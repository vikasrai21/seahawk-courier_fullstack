const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const prisma = require('../config/prisma');
const crypto = require('crypto');
const R = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

router.use(authenticate);

const SUPPORTED_PROVIDERS = ['amazon', 'flipkart', 'myntra', 'ajio', 'custom'];

function resolveClientCode(req) {
  if (req.user?.role === 'CLIENT') return req.user.clientCode || null;
  return String(req.query?.clientCode || req.body?.clientCode || '').trim().toUpperCase() || null;
}

function getByPath(obj, path) {
  return String(path || '')
    .split('.')
    .filter(Boolean)
    .reduce((acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined), obj);
}

// GET /api/portal/developer/keys
router.get('/keys', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');

  const keys = await prisma.clientApiKey.findMany({
    where: { clientCode },
    orderBy: { createdAt: 'desc' }
  });
  
  // Omit the tokenHash from output
  const safeKeys = keys.map(k => {
    const { tokenHash, ...rest } = k;
    return rest;
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

  // Notice we return the rawToken ONLY ONCE during creation!
  res.json({
    success: true,
    data: {
      id: key.id,
      name: key.name,
      createdAt: key.createdAt,
      active: key.active,
      token: rawToken // THE ONLY TIME THEY SEE THIS
    }
  });
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

// GET /api/portal/developer/integrations/diagnostics
router.get('/integrations/diagnostics', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');

  const [activeKeys, recentLogs, client] = await Promise.all([
    prisma.clientApiKey.count({ where: { clientCode, active: true } }),
    prisma.auditLog.findMany({
      where: { entity: 'INTEGRATION_WEBHOOK', entityId: { startsWith: `${clientCode}:` } },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { action: true, newValue: true, createdAt: true, entityId: true },
    }),
    prisma.client.findUnique({ where: { code: clientCode }, select: { brandSettings: true } }),
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
    webhookStats: stats,
    byProvider,
    mappingPaths: sampleMapping,
    tips: [
      'Use unique order number mapping to prevent duplicates.',
      'Set fallback destination/pincode for incomplete checkouts.',
      'Keep at least one active API key and rotate every 90 days.',
    ],
  });
}));

module.exports = router;
