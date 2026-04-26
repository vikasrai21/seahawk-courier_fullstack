// src/services/webhook-dispatch.service.js — Outbound client webhook delivery engine
'use strict';
const crypto = require('crypto');
const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const config = require('../config');

// ── Supported webhook events ──────────────────────────────────────────────
const SUPPORTED_EVENTS = [
  'shipment.booked',
  'shipment.in_transit',
  'shipment.out_for_delivery',
  'shipment.delivered',
  'shipment.rto',
  'shipment.ndr',
  'shipment.cancelled',
  'shipment.status_changed', // Catch-all for any status change
  'wallet.credited',
  'wallet.debited',
  'return.created',
  'return.approved',
  'return.completed',
];

// ── Retry schedule: 10s → 1m → 5m → 30m → 2h ─────────────────────────────
const RETRY_DELAYS_MS = [
  10_000,        // 10 seconds
  60_000,        // 1 minute
  5 * 60_000,    // 5 minutes
  30 * 60_000,   // 30 minutes
  2 * 3600_000,  // 2 hours
];

const MAX_ATTEMPTS = RETRY_DELAYS_MS.length;

// ── Signature generation ──────────────────────────────────────────────────
function signPayload(secret, timestamp, body) {
  const data = `${timestamp}.${typeof body === 'string' ? body : JSON.stringify(body)}`;
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

function generateWebhookId() {
  return `whk_${crypto.randomBytes(16).toString('hex')}`;
}

// ── Map shipment status to webhook event ──────────────────────────────────
function statusToEvent(status) {
  const map = {
    Booked: 'shipment.booked',
    InTransit: 'shipment.in_transit',
    'In Transit': 'shipment.in_transit',
    OutForDelivery: 'shipment.out_for_delivery',
    'Out For Delivery': 'shipment.out_for_delivery',
    Delivered: 'shipment.delivered',
    RTO: 'shipment.rto',
    NDR: 'shipment.ndr',
    Cancelled: 'shipment.cancelled',
  };
  return map[status] || null;
}

// ── Dispatch a single webhook ─────────────────────────────────────────────
async function deliverWebhook(webhook, event, data) {
  const timestamp = Math.floor(Date.now() / 1000);
  const webhookEventId = generateWebhookId();

  const payload = {
    id: webhookEventId,
    event,
    timestamp,
    created_at: new Date().toISOString(),
    data,
  };

  const bodyStr = JSON.stringify(payload);
  const signature = signPayload(webhook.secret, timestamp, bodyStr);

  // Create delivery record
  const delivery = await prisma.webhookDelivery.create({
    data: {
      webhookId: webhook.id,
      event,
      payload,
      attempts: 1,
      maxAttempts: MAX_ATTEMPTS,
    },
  });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Seahawk-Webhooks/1.0',
        'X-Webhook-ID': webhookEventId,
        'X-Webhook-Timestamp': String(timestamp),
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Event': event,
      },
      body: bodyStr,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseText = await response.text().catch(() => '');
    const truncatedResponse = responseText.slice(0, 500);

    if (response.ok) {
      // ✅ Success
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          success: true,
          statusCode: response.status,
          response: truncatedResponse,
          deliveredAt: new Date(),
        },
      });

      await prisma.clientWebhook.update({
        where: { id: webhook.id },
        data: {
          lastDelivery: new Date(),
          failCount: 0,
        },
      });

      logger.info(`[Webhook] Delivered ${event} to ${webhook.url} (${response.status})`);
      return { success: true, statusCode: response.status };
    }

    // ❌ Non-2xx response — schedule retry
    const nextRetryAt = new Date(Date.now() + RETRY_DELAYS_MS[0]);
    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        success: false,
        statusCode: response.status,
        response: truncatedResponse,
        error: `HTTP ${response.status}`,
        nextRetryAt,
      },
    });

    await prisma.clientWebhook.update({
      where: { id: webhook.id },
      data: { failCount: { increment: 1 } },
    });

    logger.warn(`[Webhook] Failed ${event} to ${webhook.url} (${response.status}), retry at ${nextRetryAt.toISOString()}`);
    return { success: false, statusCode: response.status };

  } catch (err) {
    // ❌ Network/timeout error — schedule retry
    const nextRetryAt = new Date(Date.now() + RETRY_DELAYS_MS[0]);
    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        success: false,
        error: err.message?.slice(0, 500) || 'Unknown error',
        nextRetryAt,
      },
    });

    await prisma.clientWebhook.update({
      where: { id: webhook.id },
      data: { failCount: { increment: 1 } },
    });

    logger.warn(`[Webhook] Error delivering ${event} to ${webhook.url}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// ── Dispatch event to all matching webhooks for a client ───────────────────
async function dispatchEvent(clientCode, event, data) {
  if (!clientCode || !event) return;

  const webhooks = await prisma.clientWebhook.findMany({
    where: {
      clientCode: String(clientCode).toUpperCase(),
      active: true,
      failCount: { lt: 50 }, // Auto-disable after 50 consecutive failures
    },
  });

  if (!webhooks.length) return;

  const matching = webhooks.filter(
    (wh) => wh.events.includes(event) || wh.events.includes('*')
  );

  if (!matching.length) return;

  // Fire all webhooks concurrently (don't block the caller)
  const results = await Promise.allSettled(
    matching.map((wh) => deliverWebhook(wh, event, data))
  );

  const delivered = results.filter((r) => r.status === 'fulfilled' && r.value?.success).length;
  const failed = results.length - delivered;

  if (failed > 0) {
    logger.warn(`[Webhook] ${event} for ${clientCode}: ${delivered}/${results.length} delivered`);
  }

  return { total: results.length, delivered, failed };
}

// ── Dispatch shipment status change ───────────────────────────────────────
async function dispatchShipmentStatusChange(shipment) {
  const { awb, status, consignee, destination, courier, clientCode, phone, weight, amount } = shipment;

  const specificEvent = statusToEvent(status);
  const data = {
    awb,
    status,
    consignee: consignee || null,
    destination: destination || null,
    courier: courier || null,
    phone: phone || null,
    weight: weight || null,
    amount: amount || null,
    tracking_url: `${config.app?.publicBaseUrl || ''}/track/${encodeURIComponent(awb)}`,
  };

  // Fire specific event + catch-all
  const results = [];
  if (specificEvent) {
    const r = await dispatchEvent(clientCode, specificEvent, data);
    if (r) results.push(r);
  }

  const catchAll = await dispatchEvent(clientCode, 'shipment.status_changed', data);
  if (catchAll) results.push(catchAll);

  return results;
}

// ── Retry failed webhook deliveries (called by scheduler) ─────────────────
async function retryFailedWebhooks() {
  const now = new Date();
  const pending = await prisma.webhookDelivery.findMany({
    where: {
      success: false,
      nextRetryAt: { lte: now },
      attempts: { lt: prisma.raw ? 5 : 5 }, // Will be compared to maxAttempts below
    },
    take: 100,
    orderBy: { nextRetryAt: 'asc' },
  });

  // Filter to only those under maxAttempts
  const retryable = pending.filter((d) => d.attempts < d.maxAttempts);

  if (!retryable.length) return { retried: 0, succeeded: 0, failed: 0 };

  let succeeded = 0;
  let failed = 0;

  for (const delivery of retryable) {
    const webhook = await prisma.clientWebhook.findUnique({
      where: { id: delivery.webhookId },
    });

    if (!webhook || !webhook.active) {
      // Mark as permanently failed
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: { error: 'Webhook disabled or deleted', nextRetryAt: null },
      });
      failed++;
      continue;
    }

    try {
      const bodyStr = JSON.stringify(delivery.payload);
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = signPayload(webhook.secret, timestamp, bodyStr);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Seahawk-Webhooks/1.0',
          'X-Webhook-ID': delivery.payload?.id || generateWebhookId(),
          'X-Webhook-Timestamp': String(timestamp),
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-Webhook-Event': delivery.event,
          'X-Webhook-Retry': String(delivery.attempts),
        },
        body: bodyStr,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const responseText = await response.text().catch(() => '');

      if (response.ok) {
        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            success: true,
            statusCode: response.status,
            response: responseText.slice(0, 500),
            deliveredAt: new Date(),
            attempts: delivery.attempts + 1,
            nextRetryAt: null,
          },
        });
        await prisma.clientWebhook.update({
          where: { id: webhook.id },
          data: { lastDelivery: new Date(), failCount: 0 },
        });
        succeeded++;
      } else {
        const nextAttempt = delivery.attempts + 1;
        const delayIdx = Math.min(nextAttempt - 1, RETRY_DELAYS_MS.length - 1);
        const nextRetryAt = nextAttempt >= delivery.maxAttempts
          ? null
          : new Date(Date.now() + RETRY_DELAYS_MS[delayIdx]);

        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            attempts: nextAttempt,
            statusCode: response.status,
            response: responseText.slice(0, 500),
            error: `HTTP ${response.status}`,
            nextRetryAt,
          },
        });
        await prisma.clientWebhook.update({
          where: { id: webhook.id },
          data: { failCount: { increment: 1 } },
        });
        failed++;
      }
    } catch (err) {
      const nextAttempt = delivery.attempts + 1;
      const delayIdx = Math.min(nextAttempt - 1, RETRY_DELAYS_MS.length - 1);
      const nextRetryAt = nextAttempt >= delivery.maxAttempts
        ? null
        : new Date(Date.now() + RETRY_DELAYS_MS[delayIdx]);

      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          attempts: nextAttempt,
          error: err.message?.slice(0, 500) || 'Retry failed',
          nextRetryAt,
        },
      });
      failed++;
    }
  }

  logger.info(`[Webhook Retry] ${retryable.length} retried: ${succeeded} succeeded, ${failed} failed`);
  return { retried: retryable.length, succeeded, failed };
}

// ── Register a new webhook ────────────────────────────────────────────────
async function registerWebhook(clientCode, { url, events, description }) {
  // Generate a secure signing secret
  const secret = `whsec_${crypto.randomBytes(32).toString('base64url')}`;

  // Validate events
  const validEvents = (events || []).filter(
    (e) => SUPPORTED_EVENTS.includes(e) || e === '*'
  );
  if (!validEvents.length) {
    validEvents.push('shipment.delivered', 'shipment.rto', 'shipment.ndr');
  }

  const webhook = await prisma.clientWebhook.create({
    data: {
      clientCode: String(clientCode).toUpperCase(),
      url: String(url).trim(),
      secret,
      events: validEvents,
      description: description ? String(description).trim() : null,
    },
  });

  return {
    id: webhook.id,
    url: webhook.url,
    events: webhook.events,
    description: webhook.description,
    active: webhook.active,
    secret, // Only returned on creation, like API keys
    createdAt: webhook.createdAt,
  };
}

// ── Send a test webhook ───────────────────────────────────────────────────
async function sendTestWebhook(webhookId) {
  const webhook = await prisma.clientWebhook.findUnique({
    where: { id: webhookId },
  });
  if (!webhook) return { success: false, error: 'Webhook not found' };

  const testData = {
    awb: 'TEST_AWB_000000',
    status: 'Delivered',
    consignee: 'Test Consignee',
    destination: 'Mumbai',
    courier: 'Delhivery',
    phone: '9999999999',
    weight: 1.5,
    amount: 150,
    tracking_url: `${config.app?.publicBaseUrl || ''}/track/TEST_AWB_000000`,
    _test: true,
  };

  return await deliverWebhook(webhook, 'shipment.delivered', testData);
}

module.exports = {
  SUPPORTED_EVENTS,
  dispatchEvent,
  dispatchShipmentStatusChange,
  retryFailedWebhooks,
  registerWebhook,
  sendTestWebhook,
  signPayload,
  statusToEvent,
};
