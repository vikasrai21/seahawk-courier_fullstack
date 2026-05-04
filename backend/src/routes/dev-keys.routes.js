"use strict";
// dev-keys.routes.js — API key CRUD + policy management
// Split from developer.routes.js

const router = require('express').Router();
const prisma = require('../config/prisma');
const crypto = require('crypto');
const R = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const integrationIngestSvc = require('../services/integration-ingest.service');
const {
  resolveClientCode,
  parseScopes,
  upsertKeyPolicy,
} = require('./dev-helpers');

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

  const mode = String(req.body?.mode || 'live').toLowerCase() === 'sandbox' ? 'sandbox' : 'live';
  const tokenPrefix = mode === 'sandbox' ? 'sk_test_' : 'sk_live_';
  const rawToken = tokenPrefix + crypto.randomBytes(24).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const key = await prisma.clientApiKey.create({
    data: {
      clientCode,
      name: String(name).trim(),
      tokenHash,
    }
  });

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

  const client = await prisma.client.findUnique({
    where: { code: clientCode },
    select: { brandSettings: true },
  });
  const policies = client?.brandSettings?.integrationKeyPolicies || {};
  const existingPolicy = policies[String(id)] || {};
  const mode = String(existingPolicy.mode || 'live').toLowerCase() === 'sandbox' 
    ? 'sandbox' 
    : 'live';
  const tokenPrefix = mode === 'sandbox' ? 'sk_test_' : 'sk_live_';
  const rawToken = tokenPrefix + crypto.randomBytes(24).toString('base64url');
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

module.exports = router;
