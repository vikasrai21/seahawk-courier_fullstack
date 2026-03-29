'use strict';
const router  = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const prisma   = require('../config/prisma');
const carrier  = require('../services/carrier.service');
const compare  = require('../services/rateCompare.service');
const R        = require('../utils/response');
const logger   = require('../utils/logger');
const queue    = require('../services/queue.service');
const pdf      = require('../services/pdf.service');

const MGMT  = ['ADMIN','OPS_MANAGER'];
const STAFF = ['ADMIN','OPS_MANAGER','STAFF'];

// ── Carrier config status (env-based, no DB) ──────────────────────────────
router.get('/configs', authenticate, requireRole(['ADMIN']), (req, res) => {
  const carriers = ['Delhivery','DTDC','BlueDart','FedEx','DHL'];
  const configs  = carriers.map(c => ({
    carrier:  c,
    enabled:  !!process.env[`${c.toUpperCase().replace(' ','_')}_API_KEY`] ||
              !!process.env[`DELHIVERY_API_KEY`] && c === 'Delhivery' ||
              !!process.env[`DTDC_CUSTOMER_CODE`] && c === 'DTDC' ||
              !!process.env[`BLUEDART_LICENSE_KEY`] && c === 'BlueDart',
    note: 'Configured via environment variables',
  }));
  return R.ok(res, configs);
});

// ── Book shipment via carrier API ─────────────────────────────────────────
router.post('/book', authenticate, requireRole(STAFF), async (req, res) => {
  try {
    const result = await carrier.createShipment(req.body.carrier, req.body);
    return R.ok(res, result, 201);
  } catch (err) { return R.error(res, err.message); }
});

// ── Compare rates across carriers ─────────────────────────────────────────
router.post('/compare', authenticate, requireRole(STAFF), async (req, res) => {
  try {
    const result = await compare.compareRates(req.body);
    return R.ok(res, result);
  } catch (err) { return R.error(res, err.message); }
});

// ── Bulk tracking sync ────────────────────────────────────────────────────
router.post('/sync-all', authenticate, requireRole(MGMT), async (req, res) => {
  try {
    const count = await queue.enqueueBulkTrackingSync();
    return R.ok(res, { message: `Queued ${count} shipments for tracking sync` });
  } catch (err) { return R.error(res, err.message); }
});

// ── Generate shipping label PDF ───────────────────────────────────────────
router.get('/label/:awb', authenticate, requireRole(STAFF), async (req, res) => {
  try {
    const shipment = await prisma.shipment.findUnique({ where: { awb: req.params.awb } });
    if (!shipment) return R.error(res, 'Shipment not found', 404);
    const buf = await pdf.generateShippingLabel(shipment);
    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="label-${req.params.awb}.pdf"`,
    });
    res.send(buf);
  } catch (err) { return R.error(res, err.message); }
});

// ── Bulk labels ───────────────────────────────────────────────────────────
router.post('/labels/bulk', authenticate, requireRole(STAFF), async (req, res) => {
  try {
    const { awbs } = req.body;
    if (!Array.isArray(awbs) || awbs.length === 0) return R.error(res, 'awbs array required', 400);
    const shipments = await prisma.shipment.findMany({ where: { awb: { in: awbs } } });
    const buf = await pdf.generateBulkLabels(shipments);
    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': 'attachment; filename="labels-bulk.pdf"',
    });
    res.send(buf);
  } catch (err) { return R.error(res, err.message); }
});

// ── Job queue stats ───────────────────────────────────────────────────────
router.get('/jobs', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    const stats = await queue.getJobStats();
    return R.ok(res, stats);
  } catch (err) { return R.error(res, err.message); }
});

module.exports = router;
