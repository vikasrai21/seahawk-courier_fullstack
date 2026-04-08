'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/analytics.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const R      = require('../utils/response');
const smartRevenue = require('../services/smartRevenue.service');
const cache  = require('../utils/cache');
const MGMT = ['ADMIN','OPS_MANAGER'];
router.get('/overview',    authenticate, requireRole(MGMT), ctrl.overview);
router.get('/couriers',    authenticate, requireRole(MGMT), ctrl.courierPerformance);
router.get('/clients',     authenticate, requireRole(MGMT), ctrl.clientAnalytics);
router.get('/monthly',     authenticate, requireRole(MGMT), ctrl.monthlyTrend);
router.get('/ndr',         authenticate, requireRole(MGMT), ctrl.ndrAnalytics);

// ── Smart Revenue Intelligence ───────────────────────────────────────────
router.get('/smart-revenue', authenticate, requireRole(MGMT), async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const result = await smartRevenue.getSummary(dateFrom, dateTo);
    R.ok(res, result);
  } catch (err) { R.error(res, err.message); }
});

router.get('/smart-revenue/details', authenticate, requireRole(MGMT), async (req, res) => {
  try {
    const { dateFrom, dateTo, page = 1, limit = 10, q = '' } = req.query;
    const result = await smartRevenue.getDetails(dateFrom, dateTo, page, limit, q);
    R.ok(res, result);
  } catch (err) { R.error(res, err.message); }
});

module.exports = router;
