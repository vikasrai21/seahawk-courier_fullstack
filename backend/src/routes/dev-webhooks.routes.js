"use strict";
// dev-webhooks.routes.js — Outbound webhook CRUD, test, deliveries
// Split from developer.routes.js

const router = require('express').Router();
const prisma = require('../config/prisma');
const R = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const webhookDispatch = require('../services/webhook-dispatch.service');
const { resolveClientCode, isValidHttpUrl } = require('./dev-helpers');

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
