'use strict';

const crypto = require('crypto');
const prisma = require('../config/prisma');
const cache = require('../utils/cache');
const config = require('../config');
const draftOrderSvc = require('./draftOrder.service');
const { fetchWithRetry } = require('../utils/httpRetry');

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

function idempotencyCacheKey({ clientCode, provider, orderId, explicitIdempotencyKey, body, mode = 'live' }) {
  const payloadHash = crypto.createHash('sha256').update(JSON.stringify(body || {})).digest('hex').slice(0, 24);
  const seed = String(explicitIdempotencyKey || `${mode}:${clientCode}:${provider}:${orderId}:${payloadHash}`);
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
  const keyPolicy = getKeyPolicy(client?.brandSettings, apiKey?.id);
  const mode = String(keyPolicy.mode || 'live').toLowerCase() === 'sandbox' ? 'sandbox' : 'live';

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
    mode,
  });
  const seen = await cache.get(idemKey);
  if (seen) {
    return { duplicate: true, idempotencyReplay: true, orderId: String(orderId), draftId: seen.draftId || null };
  }

  const dup = await prisma.draftOrder.findFirst({
    where: {
      clientCode,
      referenceId: String(orderId),
      status: { in: ['PENDING', 'FULFILLED'] },
      environment: mode === 'sandbox' ? 'sandbox' : 'production',
    },
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
    environment: mode === 'sandbox' ? 'sandbox' : 'production',
    sandboxRunId: mode === 'sandbox' ? `ING-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}` : null,
    sourcePlatform: mode === 'sandbox' ? provider : null,
    simulationState: mode === 'sandbox' ? {
      phase: 'ORDER_RECEIVED',
      provider,
      rawPayload: body,
      requestId: requestId || null,
    } : undefined,
  });

  await cache.set(idemKey, { seenAt: new Date().toISOString(), draftId: draft.id }, config.webhooks.idempotencyTtlSeconds);

  await prisma.clientApiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  await prisma.auditLog.create({
    data: {
      action: mode === 'sandbox' ? 'INTEGRATION_SANDBOX_ACCEPTED' : 'INTEGRATION_DRAFT_CREATED',
      entity: 'INTEGRATION_WEBHOOK',
      entityId: `${clientCode}:${provider}:${orderId}`,
      newValue: {
        provider,
        apiKeyName: apiKey.name,
        mode,
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

function connectorHeaders(connector = {}) {
  const headers = { Accept: 'application/json' };
  const authType = String(connector?.authType || 'none').trim().toLowerCase();
  const credentials = connector?.credentials || {};

  if (authType === 'api_key' && credentials.apiKey) {
    headers[String(credentials.headerName || 'x-api-key').trim() || 'x-api-key'] = String(credentials.apiKey);
  } else if (authType === 'bearer' && credentials.token) {
    headers.Authorization = `Bearer ${String(credentials.token)}`;
  } else if (authType === 'basic' && credentials.username) {
    const raw = `${String(credentials.username)}:${String(credentials.password || '')}`;
    headers.Authorization = `Basic ${Buffer.from(raw).toString('base64')}`;
  }

  return headers;
}

function extractOrderList(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  const candidates = [payload.orders, payload.data, payload.items, payload.results];
  for (const list of candidates) {
    if (Array.isArray(list)) return list;
  }
  if (payload.order_number || payload.id || payload.number || payload.order_key) return [payload];
  return [];
}

function normalizeProvider(provider) {
  return String(provider || '').trim().toLowerCase();
}

function resolveOrderReference(order = {}) {
  return pickFirst(order.order_number, order.id, order.number, order.order_key, order.referenceId);
}

async function pickActiveLiveOrderKey(clientCode, brandSettings) {
  const rows = await prisma.clientApiKey.findMany({
    where: {
      clientCode,
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { id: true, name: true, lastUsedAt: true, createdAt: true },
    orderBy: [{ lastUsedAt: 'desc' }, { createdAt: 'desc' }],
  });
  const policies = brandSettings?.integrationKeyPolicies || {};
  return rows.find((row) => {
    const policy = policies[String(row.id)] || {};
    const mode = String(policy.mode || 'live').toLowerCase() === 'sandbox' ? 'sandbox' : 'live';
    return mode === 'live' && hasScope(policy, 'orders:create');
  }) || null;
}

async function pullOrdersFromConnector({ client, provider, apiKey, requestId, ip }) {
  const normalizedProvider = normalizeProvider(provider);
  if (!SUPPORTED_ECOM_PROVIDERS.includes(normalizedProvider)) {
    throw makeError(400, 'Unsupported provider.', 'UNSUPPORTED_PROVIDER');
  }

  const cfg = client?.brandSettings?.integrations?.[normalizedProvider];
  const connector = cfg?.connector;
  if (!cfg?.enabled || !connector?.enabled) {
    return { pulled: 0, created: 0, duplicate: 0, failed: 0, provider: normalizedProvider };
  }

  const baseUrl = String(connector.baseUrl || '').trim().replace(/\/+$/, '');
  const pullPath = String(connector.orderPullPath || '').trim();
  if (!baseUrl || !pullPath) {
    return { pulled: 0, created: 0, duplicate: 0, failed: 0, provider: normalizedProvider };
  }

  const url = `${baseUrl}/${pullPath.replace(/^\/+/, '')}`;
  const timeoutMs = Math.min(60000, Math.max(2000, parseInt(connector.timeoutMs, 10) || 10000));
  const attempts = Math.min(6, Math.max(1, parseInt(connector.retryAttempts, 10) || 3));
  const baseDelayMs = Math.min(10000, Math.max(200, parseInt(connector.retryBaseDelayMs, 10) || 600));
  const headers = connectorHeaders(connector);

  const response = await fetchWithRetry(url, {
    method: 'GET',
    headers,
  }, { attempts, timeoutMs, baseDelayMs });
  const payload = await response.json().catch(() => null);
  const orders = extractOrderList(payload);

  let created = 0;
  let duplicate = 0;
  let failed = 0;
  const acks = [];
  for (const order of orders) {
    try {
      const result = await ingestOrder({
        provider: normalizedProvider,
        clientCode: client.code,
        body: order,
        client,
        apiKey,
        explicitIdempotencyKey: null,
        ip,
        requestId,
      });
      if (result.duplicate) duplicate += 1;
      else created += 1;
      acks.push({
        referenceId: result.referenceId || result.orderId || resolveOrderReference(order) || null,
        status: result.duplicate ? 'DUPLICATE' : 'INGESTED',
        draftId: result.draftId || null,
      });
    } catch (err) {
      failed += 1;
      await queueDeadLetter({
        provider: normalizedProvider,
        clientCode: client.code,
        body: order,
        reason: err.message,
        requestId,
        ip,
      }).catch(() => {});
      acks.push({
        referenceId: resolveOrderReference(order) || null,
        status: 'FAILED',
        reason: err.message,
      });
    }
  }

  const ackPath = String(connector.orderAckPath || '').trim();
  if (ackPath && acks.length) {
    const ackUrl = `${baseUrl}/${ackPath.replace(/^\/+/, '')}`;
    await fetchWithRetry(ackUrl, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: normalizedProvider,
        clientCode: client.code,
        requestId: requestId || null,
        acknowledgements: acks,
      }),
    }, { attempts, timeoutMs, baseDelayMs }).catch(() => {});
  }

  await prisma.auditLog.create({
    data: {
      action: 'INTEGRATION_CONNECTOR_PULL_RUN',
      entity: 'INTEGRATION_WEBHOOK',
      entityId: `${client.code}:${normalizedProvider}:connector`,
      newValue: {
        pulled: orders.length,
        created,
        duplicate,
        failed,
        requestId: requestId || null,
      },
      ip,
    },
  }).catch(() => {});

  return { pulled: orders.length, created, duplicate, failed, provider: normalizedProvider };
}

async function runAutomatedConnectorPulls({ requestId = null, ip = 'scheduler' } = {}) {
  const clients = await prisma.client.findMany({
    where: { active: true },
    select: { code: true, brandSettings: true },
  });

  const runs = [];
  for (const client of clients) {
    const integrations = client?.brandSettings?.integrations || {};
    const providers = Object.keys(integrations).filter((provider) => {
      const cfg = integrations[provider];
      return cfg?.enabled && cfg?.connector?.enabled && cfg?.connector?.baseUrl && cfg?.connector?.orderPullPath;
    });
    if (!providers.length) continue;

    const apiKey = await pickActiveLiveOrderKey(client.code, client.brandSettings);
    if (!apiKey) continue;

    for (const provider of providers) {
      try {
        const stats = await pullOrdersFromConnector({
          client,
          provider,
          apiKey,
          requestId,
          ip,
        });
        runs.push({ clientCode: client.code, ...stats });
      } catch (err) {
        runs.push({
          clientCode: client.code,
          provider: normalizeProvider(provider),
          pulled: 0,
          created: 0,
          duplicate: 0,
          failed: 1,
          error: err.message,
        });
      }
    }
  }

  return runs;
}

module.exports = {
  SUPPORTED_ECOM_PROVIDERS,
  normalizeScopes,
  getKeyPolicy,
  hasScope,
  ingestOrder,
  queueDeadLetter,
  pullOrdersFromConnector,
  runAutomatedConnectorPulls,
  makeError,
};

