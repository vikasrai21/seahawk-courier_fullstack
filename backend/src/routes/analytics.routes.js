'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/analytics.controller');
const { authenticate, ownerOnly } = require('../middleware/auth.middleware');
const R      = require('../utils/response');
const smartRevenue = require('../services/smartRevenue.service');
const cache  = require('../utils/cache');

router.get('/overview',    authenticate, ownerOnly, ctrl.overview);
router.get('/couriers',    authenticate, ownerOnly, ctrl.courierPerformance);
router.get('/clients',     authenticate, ownerOnly, ctrl.clientAnalytics);
router.get('/monthly',     authenticate, ownerOnly, ctrl.monthlyTrend);
router.get('/ndr',         authenticate, ownerOnly, ctrl.ndrAnalytics);

// ── Smart Revenue Intelligence ───────────────────────────────────────────
router.get('/smart-revenue', authenticate, ownerOnly, async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const result = await smartRevenue.getSummary(dateFrom, dateTo);
    R.ok(res, result);
  } catch (err) { R.error(res, err.message); }
});

router.get('/smart-revenue/details', authenticate, ownerOnly, async (req, res) => {
  try {
    const { dateFrom, dateTo, page = 1, limit = 10, q = '' } = req.query;
    const result = await smartRevenue.getDetails(dateFrom, dateTo, page, limit, q);
    R.ok(res, result);
  } catch (err) { R.error(res, err.message); }
});

module.exports = router;
