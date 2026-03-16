// src/controllers/client.controller.js
const svc = require('../services/client.service');
const { auditLog } = require('../utils/audit');
const R = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const getAll = asyncHandler(async (req, res) => {
  const clients = await svc.getAll();
  R.ok(res, clients);
});

const getOne = asyncHandler(async (req, res) => {
  const client = await svc.getByCode(req.params.code);
  R.ok(res, client);
});

const upsert = asyncHandler(async (req, res) => {
  const client = await svc.upsert(req.body);
  await auditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'UPSERT', entity: 'CLIENT', entityId: client.code, newValue: client, ip: req.ip });
  R.ok(res, client, 'Client saved');
});

const remove = asyncHandler(async (req, res) => {
  await svc.remove(req.params.code);
  await auditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'DELETE', entity: 'CLIENT', entityId: req.params.code, ip: req.ip });
  R.ok(res, null, 'Client deleted');
});

const getStats = asyncHandler(async (req, res) => {
  const stats = await svc.getClientStats(req.params.code);
  R.ok(res, stats);
});

module.exports = { getAll, getOne, upsert, remove, getStats };
