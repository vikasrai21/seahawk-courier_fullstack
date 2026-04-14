const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const prisma = require('../config/prisma');
const crypto = require('crypto');
const R = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const integrationIngestSvc = require('../services/integration-ingest.service');

router.use(authenticate);

const SUPPORTED_PROVIDERS = integrationIngestSvc.SUPPORTED_ECOM_PROVIDERS;
const ALLOWED_KEY_SCOPES = ['orders:create', 'webhooks:read', 'webhooks:replay', 'events:read', 'sandbox:write'];
const APPROVABLE_ACTIONS = ['INTEGRATION_SETTINGS_CHANGE', 'API_KEY_POLICY_CHANGE', 'DISPUTE_SETTLEMENT', 'RETENTION_POLICY_CHANGE'];

function resolveClientCode(req) {
  if (req.user?.role === 'CLIENT') return req.user.clientCode || null;
  return String(req.query?.clientCode || req.body?.clientCode || '').trim().toUpperCase() || null;
}

function parseScopes(inputScopes) {
  const scopes = integrationIngestSvc.normalizeScopes(inputScopes);
  return scopes.filter((scope) => ALLOWED_KEY_SCOPES.includes(scope) || scope === '*');
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

  await prisma.clientApiKey.deleteMany({
    where: { 
      id: parseInt(req.params.id),
      clientCode
    }
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
  const data = provider ? (all[provider] || null) : all;
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
  };

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

  R.ok(res, payload, 'Integration settings saved.');
}));

// GET /api/portal/developer/integrations/logs
router.get('/integrations/logs', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');

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

  R.ok(res, logs);
}));

// POST /api/portal/developer/integrations/replay
router.post('/integrations/replay', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');
  const provider = String(req.body?.provider || '').trim().toLowerCase();
  if (!SUPPORTED_PROVIDERS.includes(provider)) return R.badRequest(res, 'Unsupported provider');
  const payload = req.body?.payload;
  if (!payload || typeof payload !== 'object') return R.badRequest(res, 'payload object is required');

  const [client, apiKey] = await Promise.all([
    prisma.client.findUnique({ where: { code: clientCode }, select: { code: true, brandSettings: true } }),
    prisma.clientApiKey.findFirst({ where: { clientCode, active: true }, orderBy: { lastUsedAt: 'desc' }, select: { id: true, name: true } }),
  ]);
  if (!client) return R.notFound(res, 'Client');
  if (!apiKey) return R.badRequest(res, 'No active API key found to replay event');

  try {
    const result = await integrationIngestSvc.ingestOrder({
      provider,
      clientCode,
      body: payload,
      client,
      apiKey,
      explicitIdempotencyKey: String(req.body?.idempotencyKey || '').trim() || null,
      ip: req.ip,
      requestId: req.id,
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
      requestId: req.id,
      ip: req.ip,
    }).catch(() => {});
    throw err;
  }
}));

// GET /api/portal/developer/integrations/dead-letters
router.get('/integrations/dead-letters', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');
  const limit = Math.min(100, Math.max(10, parseInt(req.query?.limit, 10) || 50));
  const rows = await prisma.jobQueue.findMany({
    where: {
      type: 'INTEGRATION_DEAD_LETTER',
    },
    orderBy: { createdAt: 'desc' },
    take: Math.max(200, limit),
  });
  const filtered = rows.filter((row) => String(row?.payload?.clientCode || '').toUpperCase() === clientCode).slice(0, limit);
  R.ok(res, filtered);
}));

// GET /api/portal/developer/integrations/events
router.get('/integrations/events', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');
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

  R.ok(res, rows);
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
  if (req.user.role !== 'ADMIN') return R.forbidden(res, 'Only admin can approve or reject requests.');
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
    prisma.clientApiKey.count({ where: { clientCode, active: true } }),
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
    where: { clientCode, active: true },
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

  R.ok(res, {
    activeKeys,
    keyPolicies,
    webhookStats: stats,
    byProvider,
    deadLetters: dlqCount,
    sandboxAccepted,
    mappingPaths: sampleMapping,
    tips: [
      'Use Idempotency-Key header to guarantee exactly-once order draft creation.',
      'Keep separate live and sandbox API keys with least privilege scopes.',
      'Replay dead-letter events from the developer hub after fixing mapping issues.',
    ],
  });
}));

module.exports = router;
