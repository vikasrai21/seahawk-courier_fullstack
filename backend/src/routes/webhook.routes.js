'use strict';
const router = require('express').Router();
const crypto = require('crypto');
const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const cache = require('../utils/cache');
const config = require('../config');
// asyncHandler is not needed since try/catch is used directly

function getSecretForCourier(courier) {
  if (courier === 'DELHIVERY') return config.webhooks.delhiverySecret;
  if (courier === 'DTDC') return config.webhooks.dtdcSecret;
  return null;
}

function normalizeSignature(raw = '') {
  return String(raw).trim().replace(/^sha256=/i, '');
}

function timingSafeEquals(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function parseTimestampToMs(value) {
  if (!value) return null;
  const asNum = Number(value);
  if (Number.isFinite(asNum)) {
    // Accept epoch seconds or milliseconds
    return asNum < 10_000_000_000 ? asNum * 1000 : asNum;
  }
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function validateReplayWindow(timestampMs) {
  if (!timestampMs) return false;
  const delta = Math.abs(Date.now() - timestampMs);
  return delta <= config.webhooks.replayWindowSeconds * 1000;
}

function verifySignature(courier, req) {
  const secret = getSecretForCourier(courier);
  // If no secret is configured, do not block webhooks but keep this visible in logs.
  if (!secret) {
    logger.warn(`[Webhook] ${courier} signature secret not configured; signature validation skipped`);
    return { ok: true, skipped: true };
  }

  const rawSignature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];
  if (!rawSignature || !timestamp) return { ok: false, reason: 'missing-signature-or-timestamp' };

  const timestampMs = parseTimestampToMs(timestamp);
  if (!validateReplayWindow(timestampMs)) return { ok: false, reason: 'replay-window-failed' };

  const payload = req.rawBody || JSON.stringify(req.body || {});
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');

  const provided = normalizeSignature(rawSignature);
  if (!timingSafeEquals(provided, expected)) return { ok: false, reason: 'signature-mismatch' };

  return { ok: true, skipped: false };
}

function fingerprintEvent(courier, parsed, req) {
  const explicitId = req.headers['x-webhook-id'];
  if (explicitId) return `${courier}:${String(explicitId).trim()}`;

  const seed = `${courier}|${parsed.awb || ''}|${parsed.status || ''}|${parsed.timestamp || ''}|${parsed.location || ''}`;
  const digest = crypto.createHash('sha256').update(seed).digest('hex').slice(0, 20);
  return `${courier}:${digest}`;
}

function parseWebhookPayload(courier, body) {
  if (courier === 'DELHIVERY') {
    const shipment = body?.Shipment;
    if (!shipment) return null;
    return {
      awb: shipment.Waybill,
      status: shipment.Status?.Status,
      location: shipment.Status?.StatusLocation || '',
      timestamp: shipment.Status?.StatusDateTime || new Date(),
    };
  }

  if (courier === 'DTDC') {
    return {
      awb: body?.awb,
      status: body?.status,
      location: body?.location || '',
      timestamp: body?.timestamp || new Date(),
    };
  }

  return null;
}

async function processWebhook(courier, req, res) {
  logger.info(`[Webhook] Received payload from ${courier}`);

  try {
    const verification = verifySignature(courier, req);
    if (!verification.ok) {
      logger.warn(`[Webhook] Rejected ${courier} payload: ${verification.reason}`);
      return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
    }

    const parsed = parseWebhookPayload(courier, req.body);
    if (!parsed) return res.status(400).json({ success: false, message: 'Invalid webhook payload' });

    const eventId = fingerprintEvent(courier, parsed, req);
    const idempotencyKey = `webhook:idemp:${eventId}`;
    const seen = await cache.get(idempotencyKey);
    if (seen) {
      logger.info(`[Webhook] Duplicate ignored for ${eventId}`);
      return res.status(200).json({ success: true, message: 'Duplicate webhook ignored' });
    }
    await cache.set(idempotencyKey, { seenAt: new Date().toISOString() }, config.webhooks.idempotencyTtlSeconds);

    res.status(200).json({ success: true, message: 'Webhook received' });

    const awb = String(parsed.awb || '').trim().toUpperCase();
    const status = parsed.status;
    const location = parsed.location || '';
    const timestamp = parsed.timestamp || new Date();

    if (!awb || !status) return;

    const existing = await prisma.shipment.findUnique({ where: { awb } });
    if (!existing) return; // Ignore webhooks for unknown AWBs

    await prisma.shipment.update({ where: { awb }, data: { status } });
    await prisma.trackingEvent.create({
      data: {
        shipmentId: existing.id,
        awb,
        status,
        description: 'Updated via Webhook',
        location: location || '',
        timestamp: new Date(timestamp),
        source: 'WEBHOOK',
      }
    });

    // Invalidate short-lived tracking caches for this AWB
    await Promise.all([
      cache.del(`public:track:${awb}`),
      cache.del(`carrier:track:Delhivery:${awb}`),
      cache.del(`carrier:track:DTDC:${awb}`),
      cache.del(`carrier:track:Trackon:${awb}`),
      cache.del(`carrier:track:BlueDart:${awb}`),
      cache.del(`carrier:track:DHL:${awb}`),
    ]);

    logger.info(`[Webhook] Successfully updated AWB ${awb} to ${status}`);
  } catch (err) {
    logger.error(`[Webhook] Error processing payload: ${err.message}`);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: 'Webhook processing failed' });
    }
  }
}

router.post('/delhivery', (req, res) => processWebhook('DELHIVERY', req, res));
router.post('/dtdc', (req, res) => processWebhook('DTDC', req, res));
router.post('/:courier', (req, res) => processWebhook(req.params.courier?.toUpperCase(), req, res));

module.exports = router;
