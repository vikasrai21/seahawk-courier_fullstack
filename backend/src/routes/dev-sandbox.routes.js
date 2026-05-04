"use strict";
// dev-sandbox.routes.js — Sandbox dashboard + bulk order generation
// Split from developer.routes.js

const router = require('express').Router();
const R = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const sandboxSimulation = require('../services/sandboxSimulation.service');
const { resolveClientCode } = require('./dev-helpers');

// GET /api/portal/developer/sandbox/dashboard
router.get('/sandbox/dashboard', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');
  const dashboard = await sandboxSimulation.getDashboard({ clientCode, limit: req.query?.limit });
  R.ok(res, dashboard);
}));

// POST /api/portal/developer/sandbox/bulk-orders
router.post('/sandbox/bulk-orders', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');
  const result = await sandboxSimulation.bulkGenerate({
    clientCode,
    count: req.body?.count,
    platformType: req.body?.platformType || req.body?.platform,
    createShipments: req.body?.createShipments === true,
    userId: req.user?.id || null,
  });
  R.created(res, result, 'Sandbox bulk generation completed.');
}));

module.exports = router;
