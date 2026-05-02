'use strict';

const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const R = require('../utils/response');
const sandbox = require('../services/sandboxSimulation.service');
const config = require('../config');
const logger = require('../utils/logger');

const ACCESS = ['OWNER', 'ADMIN'];

router.use(authenticate);
router.use(requireRole(ACCESS));

function forceSandboxEnvironment(req, _res, next) {
  req.environment = 'sandbox';
  req.useMockCouriers = true;
  logger.info('[ENV] sandbox route hit', {
    path: req.originalUrl,
    method: req.method,
    userId: req.user?.id || null,
  });
  return next();
}

function ensureEnabled(req, res, next) {
  if (!config.runtime.sandboxEnabled) return R.forbidden(res, 'Sandbox API is disabled.');
  return next();
}

function resolveClientCode(req) {
  return String(req.body?.clientCode || req.query?.clientCode || '').trim().toUpperCase();
}

function handleSandboxError(res, err) {
  return R.error(res, err.message || 'Sandbox simulation failed', err.status || 400, err.details ? { code: err.code, details: err.details } : (err.code ? { code: err.code } : null));
}

router.use(ensureEnabled);
router.use(forceSandboxEnvironment);

router.get('/environment', (req, res) => {
  R.ok(res, {
    environment: req.environment,
    mock: req.useMockCouriers === true,
    source: 'sandbox-route',
  });
});

router.post('/orders', async (req, res) => {
  try {
    const clientCode = resolveClientCode(req);
    const result = await sandbox.createSandboxOrder({
      clientCode,
      payload: req.body || {},
      platformType: req.body?.platformType || req.body?.platform,
      userId: req.user?.id || null,
      scenario: req.body?.simulateError || req.body?.errorScenario,
      requestId: req.requestId,
    });
    return R.created(res, result, 'Sandbox order accepted.');
  } catch (err) {
    return handleSandboxError(res, err);
  }
});

router.post('/shipments', async (req, res) => {
  try {
    const clientCode = resolveClientCode(req);
    const result = await sandbox.createSandboxShipment({
      clientCode,
      payload: req.body || {},
      platformType: req.body?.platformType || req.body?.platform,
      userId: req.user?.id || null,
      scenario: req.body?.simulateError || req.body?.errorScenario,
      requestId: req.requestId,
    });
    return R.created(res, result, 'Sandbox shipment created.');
  } catch (err) {
    return handleSandboxError(res, err);
  }
});

router.post('/bulk-orders', async (req, res) => {
  try {
    const clientCode = resolveClientCode(req);
    const result = await sandbox.bulkGenerate({
      clientCode,
      count: req.body?.count,
      platformType: req.body?.platformType || req.body?.platform,
      createShipments: req.body?.createShipments === true,
      userId: req.user?.id || null,
      requestId: req.requestId,
    });
    return R.created(res, result, 'Sandbox bulk generation completed.');
  } catch (err) {
    return handleSandboxError(res, err);
  }
});

router.post('/shipments/:awb/progress', async (req, res) => {
  try {
    const shipment = await sandbox.progressShipment({
      awb: req.params.awb,
      status: req.body?.status,
      userId: req.user?.id || null,
    });
    return R.ok(res, shipment, 'Sandbox shipment progressed.');
  } catch (err) {
    return handleSandboxError(res, err);
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const clientCode = String(req.query?.clientCode || '').trim().toUpperCase();
    const dashboard = await sandbox.getDashboard({ clientCode: clientCode || null, limit: req.query?.limit });
    return R.ok(res, dashboard);
  } catch (err) {
    return handleSandboxError(res, err);
  }
});

router.get('/runs', async (req, res) => {
  try {
    const clientCode = String(req.query?.clientCode || '').trim().toUpperCase();
    const result = await sandbox.listRuns({
      clientCode: clientCode || null,
      status: req.query?.status,
      platformType: req.query?.platformType || req.query?.platform,
      page: req.query?.page,
      limit: req.query?.limit,
    });
    return R.ok(res, result);
  } catch (err) {
    return handleSandboxError(res, err);
  }
});

router.get('/runs/:runId', async (req, res) => {
  try {
    const clientCode = String(req.query?.clientCode || '').trim().toUpperCase();
    const result = await sandbox.getRunDetails({ runId: req.params.runId, clientCode: clientCode || null });
    return R.ok(res, result);
  } catch (err) {
    return handleSandboxError(res, err);
  }
});

router.get('/runs/:runId/logs', async (req, res) => {
  try {
    const clientCode = String(req.query?.clientCode || '').trim().toUpperCase();
    const result = await sandbox.getRunLogs({
      runId: req.params.runId,
      clientCode: clientCode || null,
      level: req.query?.level,
      step: req.query?.step,
      search: req.query?.search,
      limit: req.query?.limit,
    });
    return R.ok(res, result);
  } catch (err) {
    return handleSandboxError(res, err);
  }
});

router.get('/runs/:runId/export', async (req, res) => {
  try {
    const clientCode = String(req.query?.clientCode || '').trim().toUpperCase();
    const result = await sandbox.exportRun({ runId: req.params.runId, clientCode: clientCode || null });
    return R.ok(res, result, 'Sandbox run exported.');
  } catch (err) {
    return handleSandboxError(res, err);
  }
});

router.delete('/runs/:runId', async (req, res) => {
  try {
    const clientCode = String(req.query?.clientCode || '').trim().toUpperCase();
    const result = await sandbox.deleteRun({ runId: req.params.runId, clientCode: clientCode || null });
    return R.ok(res, result, 'Sandbox run deleted.');
  } catch (err) {
    return handleSandboxError(res, err);
  }
});

router.post('/cleanup', async (req, res) => {
  try {
    const clientCode = String(req.body?.clientCode || '').trim().toUpperCase();
    const result = await sandbox.cleanupOldRuns({
      olderThanDays: Number(req.body?.olderThanDays) || 7,
      clientCode: clientCode || null,
    });
    return R.ok(res, result, 'Sandbox cleanup completed.');
  } catch (err) {
    return handleSandboxError(res, err);
  }
});

router.post('/simulate-error', async (req, res) => {
  try {
    const clientCode = resolveClientCode(req);
    const result = await sandbox.simulateErrorScenario({
      clientCode,
      scenario: req.body?.scenario || req.body?.errorScenario,
      platformType: req.body?.platformType || req.body?.platform,
      userId: req.user?.id || null,
      requestId: req.requestId,
    });
    return R.ok(res, result, 'Error scenario simulated.');
  } catch (err) {
    return handleSandboxError(res, err);
  }
});

module.exports = router;
