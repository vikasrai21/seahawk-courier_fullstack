"use strict";
// dev-integrations.routes.js — Integration settings, logs, replay,
//   dead-letters, events, pull-runs, connectors, diagnostics
// Split from developer.routes.js

const router = require('express').Router();
const prisma = require('../config/prisma');
const R = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const integrationIngestSvc = require('../services/integration-ingest.service');
const integrationIngestService = require('../services/integration-ingest.service');
const { fetchWithRetry } = require('../utils/httpRetry');
const { isSafeUrl } = require('../utils/security');
const {
  SUPPORTED_PROVIDERS,
  resolveClientCode,
  requireIntegrationScope,
  sanitizeConnector,
  isValidHttpUrl,
  redactIntegrationConfig,
  redactSensitive,
  pickLiveIngestKey,
} = require('./dev-helpers');

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

  // ── SSRF protection: block private/reserved IPs ──────────────────────────
  if (!await isSafeUrl(target)) {
    return R.badRequest(res, 'Connector URL resolves to a private/reserved IP address.');
  }

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
  const filtered = await prisma.jobQueue.findMany({
    where: {
      type: 'INTEGRATION_DEAD_LETTER',
      payload: {
        path: ['clientCode'],
        equals: clientCode,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
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
    prisma.jobQueue.count({
      where: {
        type: 'INTEGRATION_DEAD_LETTER',
        payload: {
          path: ['clientCode'],
          equals: clientCode,
        },
      },
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
  const dlqCount = dlqRows;

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

module.exports = router;
