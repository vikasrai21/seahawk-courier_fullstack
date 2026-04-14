'use strict';

const crypto = require('crypto');
const prisma = require('../config/prisma');
const cache = require('../utils/cache');
const config = require('../config');
const draftOrderSvc = require('./draftOrder.service');

const SUPPORTED_ECOM_PROVIDERS = ['amazon', 'flipkart', 'myntra', 'ajio', 'custom', 'tally', 'sap', 'netsuite'];

function makeError(status, message, code, details = null) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  if (details) err.details = details;
  return err;
}

function getByPath(obj, path) {
  return String(path || '')
    .split('.')
    .filter(Boolean)
    .reduce((acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined), obj);
}

function pickFirst(...values) {
  for (const v of values) {
    const s = String(v ?? '').trim();
    if (s) return s;
  }
  return '';
}

function getKeyPolicy(clientBrandSettings, keyId) {
  const policies = clientBrandSettings?.integrationKeyPolicies || {};
  return policies[String(keyId)] || { scopes: ['orders:create'], mode: 'live' };
}

function normalizeScopes(scopes) {
  const values = Array.isArray(scopes) ? scopes : String(scopes || '').split(',');
  const normalized = [...new Set(values.map((s) => String(s || '').trim().toLowerCase()).filter(Boolean))];
  return normalized.length ? normalized : ['orders:create'];
}

function hasScope(policy, requiredScope) {
  const scopes = normalizeScopes(policy?.scopes);
  return scopes.includes('*') || scopes.includes(requiredScope);
}

function idempotencyCacheKey({ clientCode, provider, orderId, explicitIdempotencyKey, body }) {
  const payloadHash = crypto.createHash('sha256').update(JSON.stringify(body || {})).digest('hex').slice(0, 24);
  const seed = String(explicitIdempotencyKey || `${clientCode}:${provider}:${orderId}:${payloadHash}`);
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  return `integration:idemp:${hash}`;
}

async function ingestOrder({
  provider,
  clientCode,
  body,
  client,
  apiKey,
  explicitIdempotencyKey,
  ip,
  requestId,
}) {
  if (!SUPPORTED_ECOM_PROVIDERS.includes(provider)) {
    throw makeError(400, 'Unsupported provider.', 'UNSUPPORTED_PROVIDER');
  }

  const cfg = client?.brandSettings?.integrations?.[provider];
  if (!cfg?.enabled) {
    throw makeError(403, `${provider} integration is disabled for this client.`, 'PROVIDER_DISABLED');
  }

  const orderId = pickFirst(
    getByPath(body, cfg?.mappings?.referenceId),
    body?.id,
    body?.order_number,
    body?.number,
    body?.order_key
  );
  const consignee = pickFirst(
    getByPath(body, cfg?.mappings?.consignee),
    body?.shipping_address?.name,
    [body?.shipping?.first_name, body?.shipping?.last_name].filter(Boolean).join(' '),
    body?.customer?.name
  );
  const destination = pickFirst(
    getByPath(body, cfg?.mappings?.destination),
    body?.shipping_address?.city,
    body?.shipping?.city,
    cfg?.staticValues?.destination
  );
  const phone = pickFirst(
    getByPath(body, cfg?.mappings?.phone),
    body?.shipping_address?.phone,
    body?.billing_address?.phone,
    body?.billing?.phone
  );
  const pincode = pickFirst(
    getByPath(body, cfg?.mappings?.pincode),
    body?.shipping_address?.zip,
    body?.shipping?.postcode,
    cfg?.staticValues?.pincode
  );
  const weightRaw = pickFirst(
    getByPath(body, cfg?.mappings?.weight),
    body?.total_weight,
    body?.weight
  );
  const weight = Number(weightRaw || cfg?.defaultWeightKg || 0.5);

  if (!orderId || !consignee) {
    throw makeError(400, 'Order id/reference and consignee are required by mapping.', 'MAPPING_REQUIRED');
  }

  const idemKey = idempotencyCacheKey({
    clientCode,
    provider,
    orderId: String(orderId),
    explicitIdempotencyKey,
    body,
  });
  const seen = await cache.get(idemKey);
  if (seen) {
    return { duplicate: true, idempotencyReplay: true, orderId: String(orderId), draftId: seen.draftId || null };
  }

  const dup = await prisma.draftOrder.findFirst({
    where: { clientCode, referenceId: String(orderId), status: { in: ['PENDING', 'FULFILLED'] } },
    select: { id: true, status: true },
  });
  if (dup) {
    await cache.set(idemKey, { seenAt: new Date().toISOString(), draftId: dup.id }, config.webhooks.idempotencyTtlSeconds);
    await prisma.auditLog.create({
      data: {
        action: 'INTEGRATION_DRAFT_DUPLICATE',
        entity: 'INTEGRATION_WEBHOOK',
        entityId: `${clientCode}:${provider}:${orderId}`,
        newValue: { duplicateDraftId: dup.id, duplicateStatus: dup.status, requestId: requestId || null },
        ip,
      },
    });
    return { duplicate: true, idempotencyReplay: false, orderId: String(orderId), draftId: dup.id };
  }

  const draft = await draftOrderSvc.create({
    clientCode,
    referenceId: String(orderId),
    consignee: String(consignee),
    destination: String(destination || ''),
    phone: phone || null,
    pincode: pincode || null,
    weight: Number.isFinite(weight) && weight > 0 ? weight : Number(cfg?.defaultWeightKg || 0.5),
  });

  await cache.set(idemKey, { seenAt: new Date().toISOString(), draftId: draft.id }, config.webhooks.idempotencyTtlSeconds);

  await prisma.clientApiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  await prisma.auditLog.create({
    data: {
      action: 'INTEGRATION_DRAFT_CREATED',
      entity: 'INTEGRATION_WEBHOOK',
      entityId: `${clientCode}:${provider}:${orderId}`,
      newValue: {
        provider,
        apiKeyName: apiKey.name,
        draftId: draft.id,
        referenceId: draft.referenceId,
        requestId: requestId || null,
      },
      ip,
    },
  });

  return { duplicate: false, idempotencyReplay: false, orderId: String(orderId), draftId: draft.id, referenceId: draft.referenceId };
}

function queueDeadLetter({ provider, clientCode, body, reason, requestId, ip }) {
  return prisma.jobQueue.create({
    data: {
      type: 'INTEGRATION_DEAD_LETTER',
      status: 'FAILED',
      attempts: 3,
      maxAttempts: 3,
      error: String(reason || 'ingestion-failed').slice(0, 500),
      payload: {
        provider,
        clientCode,
        body,
        reason: String(reason || 'unknown'),
        requestId: requestId || null,
        sourceIp: ip || null,
      },
      runAfter: new Date(),
      completedAt: new Date(),
    },
  });
}

module.exports = {
  SUPPORTED_ECOM_PROVIDERS,
  normalizeScopes,
  getKeyPolicy,
  hasScope,
  ingestOrder,
  queueDeadLetter,
  makeError,
};

