const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const prisma = require('../config/prisma');
const crypto = require('crypto');
const R = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const integrationIngestSvc = require('../services/integration-ingest.service');
const { fetchWithRetry } = require('../utils/httpRetry');
const integrationIngestService = require('../services/integration-ingest.service');
const webhookDispatch = require('../services/webhook-dispatch.service');

router.use(authenticate);

const SUPPORTED_PROVIDERS = integrationIngestSvc.SUPPORTED_ECOM_PROVIDERS;
const ALLOWED_KEY_SCOPES = ['orders:create', 'webhooks:read', 'webhooks:replay', 'events:read', 'sandbox:write'];
const APPROVABLE_ACTIONS = ['INTEGRATION_SETTINGS_CHANGE', 'API_KEY_POLICY_CHANGE', 'DISPUTE_SETTLEMENT', 'RETENTION_POLICY_CHANGE'];
const CONNECTOR_AUTH_TYPES = ['none', 'api_key', 'bearer', 'basic'];
const SENSITIVE_FIELD_RE = /(token|secret|password|authorization|api[-_]?key|phone|email)/i;

function resolveClientCode(req) {
  if (req.user?.role === 'CLIENT') return req.user.clientCode || null;
  return String(req.query?.clientCode || req.body?.clientCode || '').trim().toUpperCase() || null;
}

function parseScopes(inputScopes) {
  const scopes = integrationIngestSvc.normalizeScopes(inputScopes);
  return scopes.filter((scope) => ALLOWED_KEY_SCOPES.includes(scope) || scope === '*');
}

async function requireIntegrationScope({ clientCode, requiredScope, preferredKeyId = null }) {
  const client = await prisma.client.findUnique({
    where: { code: clientCode },
    select: { brandSettings: true },
  });
  const policies = client?.brandSettings?.integrationKeyPolicies || {};
  const activeKeys = await prisma.clientApiKey.findMany({
    where: {
      clientCode,
      active: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    select: { id: true },
    orderBy: [{ lastUsedAt: 'desc' }, { createdAt: 'desc' }],
  });
  const ordered = Number.isFinite(preferredKeyId)
    ? [...activeKeys.filter((k) => k.id === preferredKeyId), ...activeKeys.filter((k) => k.id !== preferredKeyId)]
    : activeKeys;
  const matchedKey = ordered.find((k) => integrationIngestSvc.hasScope(policies[String(k.id)] || {}, requiredScope));
  return { matchedKey };
}

async function upsertKeyPolicy(clientCode, keyId, patch) {
  const client = await prisma.client.findUnique({
    where: { code: clientCode },
    select: { brandSettings: true },
  });
  const current = (client?.brandSettings && typeof client.brandSettings === 'object') ? client.brandSettings : {};
  const map = { ...(current.integrationKeyPolicies || {}) };
  const existing = map[String(keyId)] || {};
  map[String(keyId)] = { ...existing, ...patch };
  await prisma.client.update({
    where: { code: clientCode },
    data: { brandSettings: { ...current, integrationKeyPolicies: map } },
  });
}

function normalizeApprovalAction(input) {
  const action = String(input || '').trim().toUpperCase();
  return APPROVABLE_ACTIONS.includes(action) ? action : null;
}

function maskSecret(value) {
  const raw = String(value || '');
  if (!raw) return '';
  if (raw.length <= 8) return `${raw.slice(0, 2)}***${raw.slice(-1)}`;
  return `${raw.slice(0, 3)}***${raw.slice(-3)}`;
}

function redactSensitive(value) {
  if (Array.isArray(value)) return value.map(redactSensitive);
  if (!value || typeof value !== 'object') return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (SENSITIVE_FIELD_RE.test(String(k))) {
      out[k] = typeof v === 'string' ? maskSecret(v) : '***';
      continue;
    }
    out[k] = redactSensitive(v);
  }
  return out;
}

function sanitizeConnector(connector, provider) {
  const authType = String(connector?.authType || 'none').trim().toLowerCase();
  const safeAuthType = CONNECTOR_AUTH_TYPES.includes(authType) ? authType : 'none';
  const timeoutMs = Math.min(60000, Math.max(2000, parseInt(connector?.timeoutMs, 10) || 10000));
  const retryAttempts = Math.min(6, Math.max(1, parseInt(connector?.retryAttempts, 10) || 3));
  const retryBaseDelayMs = Math.min(10000, Math.max(200, parseInt(connector?.retryBaseDelayMs, 10) || 600));

  return {
    enabled: Boolean(connector?.enabled),
    providerType: ['amazon', 'flipkart', 'myntra', 'ajio'].includes(provider) ? 'marketplace' : (provider === 'custom' ? 'custom' : 'erp'),
    baseUrl: String(connector?.baseUrl || '').trim(),
    orderPullPath: String(connector?.orderPullPath || '').trim(),
    orderAckPath: String(connector?.orderAckPath || '').trim(),
    webhookPath: String(connector?.webhookPath || '').trim(),
    authType: safeAuthType,
    credentials: {
      headerName: String(connector?.credentials?.headerName || 'x-api-key').trim() || 'x-api-key',
      apiKey: String(connector?.credentials?.apiKey || '').trim(),
      token: String(connector?.credentials?.token || '').trim(),
      username: String(connector?.credentials?.username || '').trim(),
      password: String(connector?.credentials?.password || '').trim(),
    },
    timeoutMs,
    retryAttempts,
    retryBaseDelayMs,
    verifySsl: connector?.verifySsl !== false,
  };
}

function isValidHttpUrl(value) {
  try {
    const u = new URL(String(value || '').trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function redactIntegrationConfig(config) {
  if (!config || typeof config !== 'object') return config;
  const clone = JSON.parse(JSON.stringify(config));
  if (!clone.connector || typeof clone.connector !== 'object') return clone;
  clone.connector.credentials = clone.connector.credentials || {};
  if (clone.connector.credentials.apiKey) clone.connector.credentials.apiKey = maskSecret(clone.connector.credentials.apiKey);
  if (clone.connector.credentials.token) clone.connector.credentials.token = maskSecret(clone.connector.credentials.token);
  if (clone.connector.credentials.password) clone.connector.credentials.password = maskSecret(clone.connector.credentials.password);
  return clone;
}

async function pickLiveIngestKey(clientCode, clientBrandSettings, preferredKeyId = null) {
  const rows = await prisma.clientApiKey.findMany({
    where: {
      clientCode,
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { id: true, name: true, lastUsedAt: true, createdAt: true },
    orderBy: [{ lastUsedAt: 'desc' }, { createdAt: 'desc' }],
  });
  if (!rows.length) return null;
  const policies = clientBrandSettings?.integrationKeyPolicies || {};
  const ordered = preferredKeyId
    ? [...rows.filter((r) => r.id === preferredKeyId), ...rows.filter((r) => r.id !== preferredKeyId)]
    : rows;
  return ordered.find((row) => {
    const policy = policies[String(row.id)] || {};
    const mode = String(policy.mode || 'live').toLowerCase() === 'sandbox' ? 'sandbox' : 'live';
    return mode === 'live' && integrationIngestSvc.hasScope(policy, 'orders:create');
  }) || null;
}

// GET /api/portal/developer/keys
router.get('/keys', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');

  const keys = await prisma.clientApiKey.findMany({
    where: { clientCode },
    orderBy: { createdAt: 'desc' }
  });
  
  const client = await prisma.client.findUnique({
    where: { code: clientCode },
    select: { brandSettings: true },
  });
  const policies = client?.brandSettings?.integrationKeyPolicies || {};

  const safeKeys = keys.map((k) => {
    const { tokenHash: _tokenHash, ...rest } = k;
    const policy = policies[String(k.id)] || {};
    return {
      ...rest,
      scopes: integrationIngestSvc.normalizeScopes(policy.scopes),
      mode: String(policy.mode || 'live').toLowerCase() === 'sandbox' ? 'sandbox' : 'live',
    };
  });
  
  R.ok(res, safeKeys);
}));

// POST /api/portal/developer/keys
router.post('/keys', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');

  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Key name is required' });

  // Check limit (max 5 keys per client)
  const count = await prisma.clientApiKey.count({ where: { clientCode, active: true } });
  if (count >= 5) {
    return res.status(403).json({ success: false, message: 'Maximum 5 active API keys allowed.' });
  }

  const rawToken = 'shk_live_' + crypto.randomBytes(24).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const key = await prisma.clientApiKey.create({
    data: {
      clientCode,
      name: String(name).trim(),
      tokenHash,
    }
  });

  const mode = String(req.body?.mode || 'live').toLowerCase() === 'sandbox' ? 'sandbox' : 'live';
  const requestedScopes = parseScopes(req.body?.scopes);
  const scopes = requestedScopes.length ? requestedScopes : ['orders:create'];
  await upsertKeyPolicy(clientCode, key.id, { scopes, mode });
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'INTEGRATION_KEY_CREATED',
      entity: 'INTEGRATION_KEY',
      entityId: `${clientCode}:${key.id}`,
      newValue: { name: key.name, scopes, mode },
      ip: req.ip,
    },
  });

  // Notice we return the rawToken ONLY ONCE during creation!
  res.json({
    success: true,
    data: {
      id: key.id,
      name: key.name,
      createdAt: key.createdAt,
      active: key.active,
      scopes,
      mode,
      token: rawToken // THE ONLY TIME THEY SEE THIS
    }
  });
}));

// POST /api/portal/developer/keys/:id/rotate
router.post('/keys/:id/rotate', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');

  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return R.badRequest(res, 'Invalid key id');

  const key = await prisma.clientApiKey.findFirst({
    where: { id, clientCode, active: true },
    select: { id: true, name: true },
  });
  if (!key) return R.notFound(res, 'API key');

  const rawToken = 'shk_live_' + crypto.randomBytes(24).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  await prisma.clientApiKey.update({
    where: { id: key.id },
    data: {
      tokenHash,
      lastUsedAt: null,
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'INTEGRATION_KEY_ROTATED',
      entity: 'INTEGRATION_KEY',
      entityId: `${clientCode}:${key.id}`,
      newValue: { name: key.name },
      ip: req.ip,
    },
  });

  R.ok(res, {
    id: key.id,
    name: key.name,
    token: rawToken,
  }, 'API key rotated. Copy the new token now.');
}));

// PATCH /api/portal/developer/keys/:id/policy
router.patch('/keys/:id/policy', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');

  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return R.badRequest(res, 'Invalid key id');

  const key = await prisma.clientApiKey.findFirst({ where: { id, clientCode }, select: { id: true } });
  if (!key) return R.notFound(res, 'API key');

  const mode = String(req.body?.mode || 'live').toLowerCase() === 'sandbox' ? 'sandbox' : 'live';
  const scopes = parseScopes(req.body?.scopes);
  if (!scopes.length) return R.badRequest(res, 'At least one valid scope is required');

  await upsertKeyPolicy(clientCode, id, { scopes, mode });
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'INTEGRATION_KEY_POLICY_UPDATED',
      entity: 'INTEGRATION_KEY',
      entityId: `${clientCode}:${id}`,
      newValue: { scopes, mode },
      ip: req.ip,
    },
  });

  R.ok(res, { id, scopes, mode }, 'Key policy updated');
}));

// DELETE /api/portal/developer/keys/:id
router.delete('/keys/:id', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');

  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return R.badRequest(res, 'Invalid key id');

  const result = await prisma.clientApiKey.updateMany({
    where: {
      id,
      clientCode,
      active: true,
    },
    data: {
      active: false,
      expiresAt: new Date(),
    },
  });
  if (!result.count) return R.notFound(res, 'API key');
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'INTEGRATION_KEY_REVOKED',
      entity: 'INTEGRATION_KEY',
      entityId: `${clientCode}:${id}`,
      newValue: { revoked: true },
      ip: req.ip,
    },
  });
  R.ok(res, null, 'API key revoked');
}));

// GET /api/portal/developer/integrations/settings
router.get('/integrations/settings', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');
  const provider = String(req.query?.provider || '').trim().toLowerCase();

  const client = await prisma.client.findUnique({
    where: { code: clientCode },
    select: { brandSettings: true },
  });
  const all = (client?.brandSettings && typeof client.brandSettings === 'object' ? client.brandSettings.integrations : {}) || {};
  const data = provider ? redactIntegrationConfig(all[provider] || null) : Object.fromEntries(
    Object.entries(all).map(([k, v]) => [k, redactIntegrationConfig(v)])
  );
  R.ok(res, data);
}));

// POST /api/portal/developer/integrations/settings
router.post('/integrations/settings', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');

  const provider = String(req.body?.provider || '').trim().toLowerCase();
  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    return R.badRequest(res, `provider must be one of: ${SUPPORTED_PROVIDERS.join(', ')}`);
  }

  const payload = {
    enabled: Boolean(req.body?.enabled),
    sourceLabel: String(req.body?.sourceLabel || provider).trim(),
    defaultWeightKg: Math.max(0.1, Number(req.body?.defaultWeightKg || 0.5)),
    mappings: {
      referenceId: String(req.body?.mappings?.referenceId || '').trim(),
      consignee: String(req.body?.mappings?.consignee || '').trim(),
      destination: String(req.body?.mappings?.destination || '').trim(),
      phone: String(req.body?.mappings?.phone || '').trim(),
      pincode: String(req.body?.mappings?.pincode || '').trim(),
      weight: String(req.body?.mappings?.weight || '').trim(),
    },
    staticValues: {
      destination: String(req.body?.staticValues?.destination || '').trim(),
      pincode: String(req.body?.staticValues?.pincode || '').trim(),
    },
    connector: sanitizeConnector(req.body?.connector || {}, provider),
  };
  if (payload.connector?.enabled) {
    if (!isValidHttpUrl(payload.connector.baseUrl)) {
      return R.badRequest(res, 'connector.baseUrl must be a valid http/https URL when connector is enabled');
    }
    if (!String(payload.connector.orderPullPath || '').trim()) {
      return R.badRequest(res, 'connector.orderPullPath is required when connector is enabled');
    }
  }

  const client = await prisma.client.findUnique({
    where: { code: clientCode },
    select: { brandSettings: true },
  });
  const current = (client?.brandSettings && typeof client.brandSettings === 'object') ? client.brandSettings : {};
  const integrations = { ...(current.integrations || {}) };
  integrations[provider] = payload;

  await prisma.client.update({
    where: { code: clientCode },
    data: { brandSettings: { ...current, integrations } },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'INTEGRATION_SETTINGS_UPDATED',
      entity: 'INTEGRATION',
      entityId: `${clientCode}:${provider}`,
      newValue: payload,
      ip: req.ip,
    },
  });

  R.ok(res, redactIntegrationConfig(payload), 'Integration settings saved.');
}));

// GET /api/portal/developer/integrations/logs
router.get('/integrations/logs', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');
  const preferredKeyId = parseInt(req.query?.keyId, 10);
  const { matchedKey } = await requireIntegrationScope({
    clientCode,
    requiredScope: 'webhooks:read',
    preferredKeyId: Number.isFinite(preferredKeyId) ? preferredKeyId : null,
  });
  if (!matchedKey) return R.forbidden(res, 'No active API key with webhooks:read scope.');

  const provider = String(req.query?.provider || '').trim().toLowerCase();
  const limit = Math.min(100, Math.max(10, parseInt(req.query?.limit, 10) || 30));
  const prefix = provider ? `${clientCode}:${provider}:` : `${clientCode}:`;

  const logs = await prisma.auditLog.findMany({
    where: {
      entity: 'INTEGRATION_WEBHOOK',
      entityId: { startsWith: prefix },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      action: true,
      entityId: true,
      newValue: true,
      createdAt: true,
    },
  });

  R.ok(res, logs.map((row) => ({ ...row, newValue: redactSensitive(row.newValue || {}) })));
}));

// POST /api/portal/developer/integrations/replay
router.post('/integrations/replay', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');
  const operationKeyId = parseInt(req.body?.keyId, 10);
  const { matchedKey } = await requireIntegrationScope({
    clientCode,
    requiredScope: 'webhooks:replay',
    preferredKeyId: Number.isFinite(operationKeyId) ? operationKeyId : null,
  });
  if (!matchedKey) return R.forbidden(res, 'No active API key with webhooks:replay scope.');
  const provider = String(req.body?.provider || '').trim().toLowerCase();
  if (!SUPPORTED_PROVIDERS.includes(provider)) return R.badRequest(res, 'Unsupported provider');
  const payload = req.body?.payload;
  if (!payload || typeof payload !== 'object') return R.badRequest(res, 'payload object is required');

  const client = await prisma.client.findUnique({ where: { code: clientCode }, select: { code: true, brandSettings: true } });
  if (!client) return R.notFound(res, 'Client');
  const preferredKeyId = Number(req.body?.keyId);
  const apiKey = await pickLiveIngestKey(clientCode, client.brandSettings, Number.isFinite(preferredKeyId) ? preferredKeyId : null);
  if (!apiKey) return R.badRequest(res, 'No active live key with orders:create scope found for replay');

  try {
    const result = await integrationIngestSvc.ingestOrder({
      provider,
      clientCode,
      body: payload,
      client,
      apiKey,
      explicitIdempotencyKey: String(req.body?.idempotencyKey || '').trim() || null,
      ip: req.ip,
      requestId: req.requestId,
    });
    R.ok(res, {
      provider,
      replayed: true,
      duplicate: Boolean(result.duplicate),
      draftId: result.draftId || null,
      referenceId: result.referenceId || result.orderId || null,
    }, 'Webhook replay executed');
  } catch (err) {
    await integrationIngestSvc.queueDeadLetter({
      provider,
      clientCode,
      body: payload,
      reason: err.message,
      requestId: req.requestId,
      ip: req.ip,
    }).catch(() => {});
    throw err;
  }
}));

// POST /api/portal/developer/integrations/dead-letters/:id/retry
router.post('/integrations/dead-letters/:id/retry', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');
  const operationKeyId = parseInt(req.body?.keyId, 10);
  const { matchedKey } = await requireIntegrationScope({
    clientCode,
    requiredScope: 'webhooks:replay',
    preferredKeyId: Number.isFinite(operationKeyId) ? operationKeyId : null,
  });
  if (!matchedKey) return R.forbidden(res, 'No active API key with webhooks:replay scope.');
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return R.badRequest(res, 'Invalid dead-letter id');

  const row = await prisma.jobQueue.findFirst({
    where: { id, type: 'INTEGRATION_DEAD_LETTER' },
  });
  if (!row) return R.notFound(res, 'Dead-letter event');
  if (String(row?.payload?.clientCode || '').toUpperCase() !== clientCode) return R.forbidden(res, 'Dead-letter does not belong to this client');
  if ((row.attempts || 0) >= (row.maxAttempts || 3)) return R.error(res, 'Dead-letter reached max retry attempts', 409);

  const provider = String(row?.payload?.provider || '').trim().toLowerCase();
  if (!SUPPORTED_PROVIDERS.includes(provider)) return R.badRequest(res, 'Dead-letter provider unsupported');
  const body = row?.payload?.body;
  if (!body || typeof body !== 'object') return R.badRequest(res, 'Dead-letter payload missing body');

  const client = await prisma.client.findUnique({ where: { code: clientCode }, select: { code: true, brandSettings: true } });
  if (!client) return R.notFound(res, 'Client');
  const key = await pickLiveIngestKey(clientCode, client.brandSettings, Number.isFinite(operationKeyId) ? operationKeyId : null);
  if (!key) return R.badRequest(res, 'No active live key with orders:create scope found for retry');

  try {
    const result = await integrationIngestSvc.ingestOrder({
      provider,
      clientCode,
      body,
      client,
      apiKey: key,
      explicitIdempotencyKey: String(req.body?.idempotencyKey || '').trim() || null,
      ip: req.ip,
      requestId: req.requestId,
    });
    await prisma.jobQueue.update({
      where: { id: row.id },
      data: {
        status: 'DONE',
        attempts: (row.attempts || 0) + 1,
        error: null,
        completedAt: new Date(),
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        userEmail: req.user.email,
        action: 'INTEGRATION_DEAD_LETTER_REPLAYED',
        entity: 'INTEGRATION_WEBHOOK',
        entityId: `${clientCode}:${provider}:${row.id}`,
        newValue: { deadLetterId: row.id, duplicate: Boolean(result.duplicate), draftId: result.draftId || null },
        ip: req.ip,
      },
    });
    R.ok(res, { retried: true, duplicate: Boolean(result.duplicate), draftId: result.draftId || null }, 'Dead-letter replayed successfully');
  } catch (err) {
    const nextAttempts = (row.attempts || 0) + 1;
    const maxAttempts = row.maxAttempts || 3;
    const delayMs = Math.min(600000, 30000 * (2 ** Math.max(0, nextAttempts - 1)));
    await prisma.jobQueue.update({
      where: { id: row.id },
      data: {
        status: nextAttempts >= maxAttempts ? 'FAILED' : 'PENDING',
        attempts: nextAttempts,
        error: String(err.message || 'retry-failed').slice(0, 500),
        runAfter: nextAttempts >= maxAttempts ? row.runAfter : new Date(Date.now() + delayMs),
      },
    });
    throw err;
  }
}));

// POST /api/portal/developer/integrations/connectors/:provider/test
router.post('/integrations/connectors/:provider/test', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');
  const provider = String(req.params.provider || '').trim().toLowerCase();
  if (!SUPPORTED_PROVIDERS.includes(provider)) return R.badRequest(res, 'Unsupported provider');

  const client = await prisma.client.findUnique({
    where: { code: clientCode },
    select: { brandSettings: true },
  });
  const cfg = client?.brandSettings?.integrations?.[provider]?.connector;
  if (!cfg || !cfg.enabled) return R.badRequest(res, 'Connector config is missing or disabled');
  const baseUrl = String(cfg.baseUrl || '').trim();
  if (!baseUrl) return R.badRequest(res, 'Connector baseUrl is required');

  const probePath = String(req.body?.path || cfg.orderPullPath || '/').trim() || '/';
  const target = `${baseUrl.replace(/\/+$/, '')}/${probePath.replace(/^\/+/, '')}`;
  const headers = {};
  const authType = String(cfg.authType || 'none').trim().toLowerCase();
  if (authType === 'api_key' && cfg?.credentials?.apiKey) headers[String(cfg.credentials.headerName || 'x-api-key')] = String(cfg.credentials.apiKey);
  if (authType === 'bearer' && cfg?.credentials?.token) headers.Authorization = `Bearer ${String(cfg.credentials.token)}`;
  if (authType === 'basic' && cfg?.credentials?.username) {
    const raw = `${String(cfg.credentials.username)}:${String(cfg.credentials.password || '')}`;
    headers.Authorization = `Basic ${Buffer.from(raw).toString('base64')}`;
  }

  const timeoutMs = Math.min(60000, Math.max(2000, parseInt(cfg.timeoutMs, 10) || 10000));
  const attempts = Math.min(6, Math.max(1, parseInt(cfg.retryAttempts, 10) || 3));
  const baseDelayMs = Math.min(10000, Math.max(200, parseInt(cfg.retryBaseDelayMs, 10) || 600));

  const response = await fetchWithRetry(target, {
    method: 'GET',
    headers,
  }, { attempts, timeoutMs, baseDelayMs });
  const bodyText = await response.text().catch(() => '');
  R.ok(res, {
    provider,
    target,
    status: response.status,
    ok: response.ok,
    preview: bodyText.slice(0, 300),
  }, 'Connector probe succeeded');
}));

// POST /api/portal/developer/integrations/connectors/:provider/pull
router.post('/integrations/connectors/:provider/pull', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');
  const provider = String(req.params.provider || '').trim().toLowerCase();
  if (!SUPPORTED_PROVIDERS.includes(provider)) return R.badRequest(res, 'Unsupported provider');

  const operationKeyId = parseInt(req.body?.keyId, 10);
  const { matchedKey } = await requireIntegrationScope({
    clientCode,
    requiredScope: 'webhooks:replay',
    preferredKeyId: Number.isFinite(operationKeyId) ? operationKeyId : null,
  });
  if (!matchedKey) return R.forbidden(res, 'No active API key with webhooks:replay scope.');

  const client = await prisma.client.findUnique({
    where: { code: clientCode },
    select: { code: true, brandSettings: true },
  });
  if (!client) return R.notFound(res, 'Client');

  const ingestKey = await pickLiveIngestKey(clientCode, client.brandSettings, Number.isFinite(operationKeyId) ? operationKeyId : null);
  if (!ingestKey) return R.badRequest(res, 'No active live key with orders:create scope found for connector pull');

  const result = await integrationIngestService.pullOrdersFromConnector({
    client,
    provider,
    apiKey: ingestKey,
    requestId: req.requestId,
    ip: req.ip,
  });

  R.ok(res, result, 'Connector pull executed');
}));

// GET /api/portal/developer/integrations/dead-letters
router.get('/integrations/dead-letters', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');
  const preferredKeyId = parseInt(req.query?.keyId, 10);
  const { matchedKey } = await requireIntegrationScope({
    clientCode,
    requiredScope: 'webhooks:read',
    preferredKeyId: Number.isFinite(preferredKeyId) ? preferredKeyId : null,
  });
  if (!matchedKey) return R.forbidden(res, 'No active API key with webhooks:read scope.');
  const limit = Math.min(100, Math.max(10, parseInt(req.query?.limit, 10) || 50));
  const rows = await prisma.jobQueue.findMany({
    where: {
      type: 'INTEGRATION_DEAD_LETTER',
    },
    orderBy: { createdAt: 'desc' },
    take: Math.max(200, limit),
  });
  const filtered = rows.filter((row) => String(row?.payload?.clientCode || '').toUpperCase() === clientCode).slice(0, limit);
  R.ok(res, filtered.map((row) => ({ ...row, payload: redactSensitive(row.payload || {}) })));
}));

// GET /api/portal/developer/integrations/events
router.get('/integrations/events', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');
  const preferredKeyId = parseInt(req.query?.keyId, 10);
  const { matchedKey } = await requireIntegrationScope({
    clientCode,
    requiredScope: 'events:read',
    preferredKeyId: Number.isFinite(preferredKeyId) ? preferredKeyId : null,
  });
  if (!matchedKey) return R.forbidden(res, 'No active API key with events:read scope.');
  const limit = Math.min(200, Math.max(20, parseInt(req.query?.limit, 10) || 100));
  const action = String(req.query?.action || '').trim();

  const where = {
    entity: 'INTEGRATION_WEBHOOK',
    entityId: { startsWith: `${clientCode}:` },
  };
  if (action) where.action = action;

  const rows = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      action: true,
      entityId: true,
      newValue: true,
      createdAt: true,
      ip: true,
    },
  });

  R.ok(res, rows.map((row) => ({ ...row, newValue: redactSensitive(row.newValue || {}) })));
}));

// GET /api/portal/developer/integrations/pull-runs
router.get('/integrations/pull-runs', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');
  const preferredKeyId = parseInt(req.query?.keyId, 10);
  const { matchedKey } = await requireIntegrationScope({
    clientCode,
    requiredScope: 'events:read',
    preferredKeyId: Number.isFinite(preferredKeyId) ? preferredKeyId : null,
  });
  if (!matchedKey) return R.forbidden(res, 'No active API key with events:read scope.');

  const provider = String(req.query?.provider || '').trim().toLowerCase();
  const limit = Math.min(100, Math.max(10, parseInt(req.query?.limit, 10) || 40));

  const where = {
    entity: 'INTEGRATION_WEBHOOK',
    action: 'INTEGRATION_CONNECTOR_PULL_RUN',
    entityId: { startsWith: `${clientCode}:` },
  };
  if (provider) {
    where.entityId = { startsWith: `${clientCode}:${provider}:` };
  }

  const rows = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      entityId: true,
      newValue: true,
      createdAt: true,
      ip: true,
    },
  });

  const summary = rows.reduce((acc, row) => {
    const payload = row.newValue || {};
    acc.runs += 1;
    acc.pulled += Number(payload.pulled || 0);
    acc.created += Number(payload.created || 0);
    acc.duplicate += Number(payload.duplicate || 0);
    acc.failed += Number(payload.failed || 0);
    return acc;
  }, { runs: 0, pulled: 0, created: 0, duplicate: 0, failed: 0 });

  R.ok(res, {
    summary,
    rows: rows.map((row) => ({ ...row, newValue: redactSensitive(row.newValue || {}) })),
  });
}));

// POST /api/portal/developer/approvals
router.post('/approvals', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');
  const approvalAction = normalizeApprovalAction(req.body?.approvalAction);
  if (!approvalAction) return R.badRequest(res, `approvalAction must be one of: ${APPROVABLE_ACTIONS.join(', ')}`);
  const payload = req.body?.payload && typeof req.body.payload === 'object' ? req.body.payload : {};
  const reason = String(req.body?.reason || '').trim();
  const requestNo = `APR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10000 + Math.random() * 90000)}`;

  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'APPROVAL_REQUESTED',
      entity: 'CLIENT_GOVERNANCE',
      entityId: `${clientCode}:${requestNo}`,
      newValue: {
        requestNo,
        clientCode,
        approvalAction,
        reason: reason || null,
        payload,
        status: 'PENDING',
      },
      ip: req.ip,
    },
  });

  R.created(res, { requestNo, approvalAction, status: 'PENDING' }, 'Approval request submitted');
}));

// GET /api/portal/developer/approvals
router.get('/approvals', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');
  const limit = Math.min(100, Math.max(10, parseInt(req.query?.limit, 10) || 40));
  const rows = await prisma.auditLog.findMany({
    where: {
      entity: 'CLIENT_GOVERNANCE',
      entityId: { startsWith: `${clientCode}:` },
      action: { in: ['APPROVAL_REQUESTED', 'APPROVAL_DECIDED'] },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      action: true,
      entityId: true,
      userEmail: true,
      newValue: true,
      createdAt: true,
    },
  });
  R.ok(res, rows);
}));

// POST /api/portal/developer/approvals/:requestNo/decide
router.post('/approvals/:requestNo/decide', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');
  if (!req.user?.isOwner && req.user.role !== 'ADMIN') return R.forbidden(res, 'Only admin or owner can approve or reject requests.');
  const requestNo = String(req.params.requestNo || '').trim();
  const decision = String(req.body?.decision || '').trim().toUpperCase();
  if (!['APPROVED', 'REJECTED'].includes(decision)) return R.badRequest(res, 'decision must be APPROVED or REJECTED');
  const requestKey = `${clientCode}:${requestNo}`;
  const source = await prisma.auditLog.findFirst({
    where: {
      entity: 'CLIENT_GOVERNANCE',
      entityId: requestKey,
      action: 'APPROVAL_REQUESTED',
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!source) return R.notFound(res, 'Approval request');
  if (source.userId && source.userId === req.user.id) {
    return R.forbidden(res, 'Maker-checker violation: requester cannot approve their own request.');
  }
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'APPROVAL_DECIDED',
      entity: 'CLIENT_GOVERNANCE',
      entityId: requestKey,
      newValue: {
        requestNo,
        decision,
        decidedBy: req.user.email,
        note: String(req.body?.note || '').trim() || null,
      },
      ip: req.ip,
    },
  });
  R.ok(res, { requestNo, decision }, `Request ${decision.toLowerCase()}`);
}));

// GET /api/portal/developer/integrations/diagnostics
router.get('/integrations/diagnostics', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');

  const [activeKeys, recentLogs, client, dlqRows, sandboxAccepted] = await Promise.all([
    prisma.clientApiKey.count({
      where: {
        clientCode,
        active: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    }),
    prisma.auditLog.findMany({
      where: { entity: 'INTEGRATION_WEBHOOK', entityId: { startsWith: `${clientCode}:` } },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { action: true, newValue: true, createdAt: true, entityId: true },
    }),
    prisma.client.findUnique({ where: { code: clientCode }, select: { brandSettings: true } }),
    prisma.jobQueue.findMany({
      where: {
        type: 'INTEGRATION_DEAD_LETTER',
      },
      select: { payload: true },
      take: 2000,
    }),
    prisma.auditLog.count({
      where: {
        entity: 'INTEGRATION_WEBHOOK',
        action: 'INTEGRATION_SANDBOX_ACCEPTED',
        entityId: { startsWith: `${clientCode}:` },
      },
    }),
  ]);

  const stats = {
    total: recentLogs.length,
    created: recentLogs.filter((l) => l.action === 'INTEGRATION_DRAFT_CREATED').length,
    duplicate: recentLogs.filter((l) => l.action === 'INTEGRATION_DRAFT_DUPLICATE').length,
    failed: recentLogs.filter((l) => l.action === 'INTEGRATION_DRAFT_FAILED').length,
  };

  const byProvider = recentLogs.reduce((acc, row) => {
    const provider = String(row.entityId || '').split(':')[1] || 'unknown';
    acc[provider] = (acc[provider] || 0) + 1;
    return acc;
  }, {});
  const dlqCount = dlqRows.filter((row) => String(row?.payload?.clientCode || '').toUpperCase() === clientCode).length;

  const policies = client?.brandSettings?.integrationKeyPolicies || {};
  const keys = await prisma.clientApiKey.findMany({
    where: {
      clientCode,
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { id: true, name: true, createdAt: true, lastUsedAt: true },
    orderBy: { createdAt: 'desc' },
  });
  const keyPolicies = keys.map((k) => {
    const policy = policies[String(k.id)] || {};
    return {
      id: k.id,
      name: k.name,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
      mode: String(policy.mode || 'live').toLowerCase() === 'sandbox' ? 'sandbox' : 'live',
      scopes: integrationIngestSvc.normalizeScopes(policy.scopes),
    };
  });

  const sampleMapping = {};
  const integrations = client?.brandSettings?.integrations || {};
  Object.keys(integrations).forEach((provider) => {
    const cfg = integrations[provider];
    const sample = {
      referenceId: cfg?.mappings?.referenceId || '',
      consignee: cfg?.mappings?.consignee || '',
      destination: cfg?.mappings?.destination || '',
      phone: cfg?.mappings?.phone || '',
      pincode: cfg?.mappings?.pincode || '',
      weight: cfg?.mappings?.weight || '',
    };
    sampleMapping[provider] = sample;
  });

  const pullRuns = await prisma.auditLog.findMany({
    where: {
      entity: 'INTEGRATION_WEBHOOK',
      action: 'INTEGRATION_CONNECTOR_PULL_RUN',
      entityId: { startsWith: `${clientCode}:` },
      createdAt: { gte: new Date(Date.now() - 24 * 3600000) },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: { newValue: true },
  });
  const pullRunCount = pullRuns.length;
  const pullRunsWithFailures = pullRuns.filter((row) => Number(row?.newValue?.failed || 0) > 0).length;
  const connectorPullFailureRate = pullRunCount ? Number((pullRunsWithFailures / pullRunCount).toFixed(3)) : 0;

  R.ok(res, {
    activeKeys,
    keyPolicies,
    webhookStats: stats,
    byProvider,
    deadLetters: dlqCount,
    sandboxAccepted,
    connectorPullSlo: {
      runCount24h: pullRunCount,
      failureRuns24h: pullRunsWithFailures,
      failureRate24h: connectorPullFailureRate,
    },
    mappingPaths: sampleMapping,
    tips: [
      'Use Idempotency-Key header to guarantee exactly-once order draft creation.',
      'Keep separate live and sandbox API keys with least privilege scopes.',
      'Replay dead-letter events from the developer hub after fixing mapping issues.',
    ],
  });
}));

// ── Outbound Webhooks Management ──────────────────────────────────────────

// GET /api/portal/developer/webhook-events
router.get('/webhook-events', asyncHandler(async (req, res) => {
  R.ok(res, { events: webhookDispatch.SUPPORTED_EVENTS });
}));

// GET /api/portal/developer/webhooks
router.get('/webhooks', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');

  const webhooks = await prisma.clientWebhook.findMany({
    where: { clientCode },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      url: true,
      events: true,
      active: true,
      description: true,
      lastDelivery: true,
      failCount: true,
      createdAt: true,
    },
  });

  R.ok(res, webhooks);
}));

// POST /api/portal/developer/webhooks
router.post('/webhooks', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');

  const { url, events, description } = req.body;
  if (!url || !isValidHttpUrl(url)) return R.badRequest(res, 'Valid URL is required');

  // Limit 5 webhooks per client
  const count = await prisma.clientWebhook.count({ where: { clientCode, active: true } });
  if (count >= 5) return res.status(403).json({ success: false, message: 'Maximum 5 active webhooks allowed.' });

  const webhook = await webhookDispatch.registerWebhook(clientCode, { url, events, description });

  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'OUTBOUND_WEBHOOK_CREATED',
      entity: 'CLIENT_WEBHOOK',
      entityId: `${clientCode}:${webhook.id}`,
      newValue: { url, events, description },
      ip: req.ip,
    },
  });

  res.json({ success: true, data: webhook });
}));

// DELETE /api/portal/developer/webhooks/:id
router.delete('/webhooks/:id', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');

  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return R.badRequest(res, 'Invalid webhook id');

  const webhook = await prisma.clientWebhook.findFirst({
    where: { id, clientCode },
  });
  if (!webhook) return R.notFound(res, 'Webhook');

  await prisma.clientWebhook.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'OUTBOUND_WEBHOOK_DELETED',
      entity: 'CLIENT_WEBHOOK',
      entityId: `${clientCode}:${id}`,
      newValue: { deleted: true, url: webhook.url },
      ip: req.ip,
    },
  });

  R.ok(res, null, 'Webhook deleted');
}));

// POST /api/portal/developer/webhooks/:id/test
router.post('/webhooks/:id/test', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');

  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return R.badRequest(res, 'Invalid webhook id');

  const webhook = await prisma.clientWebhook.findFirst({
    where: { id, clientCode },
  });
  if (!webhook) return R.notFound(res, 'Webhook');

  const result = await webhookDispatch.sendTestWebhook(id);
  if (result.success) {
    R.ok(res, result, 'Test webhook delivered successfully');
  } else {
    res.status(500).json({ success: false, message: 'Test webhook failed', error: result.error || `HTTP ${result.statusCode}` });
  }
}));

// GET /api/portal/developer/webhooks/:id/deliveries
router.get('/webhooks/:id/deliveries', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');

  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return R.badRequest(res, 'Invalid webhook id');

  const webhook = await prisma.clientWebhook.findFirst({
    where: { id, clientCode },
  });
  if (!webhook) return R.notFound(res, 'Webhook');

  const limit = Math.min(100, Math.max(10, parseInt(req.query?.limit, 10) || 30));

  const deliveries = await prisma.webhookDelivery.findMany({
    where: { webhookId: id },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  R.ok(res, deliveries);
}));

module.exports = router;
