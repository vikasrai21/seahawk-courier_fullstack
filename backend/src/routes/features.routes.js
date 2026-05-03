'use strict';
const router = require('express').Router();
const R = require('../utils/response');
const { protect, requireRole, ownerOnly } = require('../middleware/auth.middleware');
const logger = require('../utils/logger');

// Feature services
const labelSvc = require('../services/labelGeneration.service');
const ndrAutoSvc = require('../services/ndrAutomation.service');
const codSvc = require('../services/codRemittance.service');
const disputeSvc = require('../services/weightDispute.service');
const onboardSvc = require('../services/onboarding.service');
const warehouseSvc = require('../services/warehouse.service');
const etaSvc = require('../services/etaPrediction.service');
const rtoSvc = require('../services/rtoReduction.service');
const channelSvc = require('../services/channelIntegration.service');
const csatSvc = require('../services/csat.service');
const slaSvc = require('../services/slaMonitor.service');
const razorpaySvc = require('../services/razorpay.service');

// ═══════════════════════════════════════════════════════════════
// PUBLIC ROUTES (no auth)
// ═══════════════════════════════════════════════════════════════

// Feature 5: Public onboarding application
router.post('/onboarding/apply', async (req, res) => {
  try {
    const app = await onboardSvc.submitApplication(req.body);
    R.ok(res, app, 'Application submitted successfully');
  } catch (err) { R.error(res, err.message, 400); }
});

// Feature 10: Public CSAT submission
router.get('/feedback/:token', async (req, res) => {
  try {
    const feedback = await csatSvc.getFeedbackByToken(req.params.token);
    if (!feedback) return R.error(res, 'Survey not found', 404);
    R.ok(res, feedback);
  } catch (err) { R.error(res, err.message); }
});

router.post('/feedback/:token', async (req, res) => {
  try {
    const result = await csatSvc.submitFeedback(req.params.token, req.body);
    R.ok(res, result, 'Thank you for your feedback!');
  } catch (err) { R.error(res, err.message, 400); }
});

// Feature 13: Razorpay webhook (no auth, uses HMAC)
router.post('/payments/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const result = await razorpaySvc.handleWebhook(req.body, signature);
    R.ok(res, result);
  } catch (err) { logger.error(`Razorpay webhook error: ${err.message}`); R.error(res, err.message, 400); }
});

// ═══════════════════════════════════════════════════════════════
// AUTHENTICATED ROUTES
// ═══════════════════════════════════════════════════════════════
router.use(protect);

// ── Feature 1: Shipping Labels ──────────────────────────────────
router.get('/shipments/:id/label', async (req, res) => {
  try {
    const format = req.query.format || '4x6';
    const { buffer, filename } = await labelSvc.generateLabel(req.params.id, format);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(buffer);
  } catch (err) { R.error(res, err.message, 400); }
});

router.post('/shipments/labels/bulk', async (req, res) => {
  try {
    const { ids, format } = req.body;
    if (!Array.isArray(ids) || !ids.length) return R.error(res, 'ids array required', 400);
    const results = await labelSvc.generateBulkLabels(ids, format || '4x6');
    R.ok(res, results);
  } catch (err) { R.error(res, err.message); }
});

// ── Feature 2: NDR Automation ───────────────────────────────────
router.post('/ndr/:shipmentId/process', requireRole('ADMIN', 'OPS_MANAGER'), async (req, res) => {
  try {
    const result = await ndrAutoSvc.processNDREvent(parseInt(req.params.shipmentId), req.body);
    R.ok(res, result);
  } catch (err) { R.error(res, err.message, 400); }
});

router.put('/ndr/:ndrId/action', requireRole('ADMIN', 'OPS_MANAGER'), async (req, res) => {
  try {
    const result = await ndrAutoSvc.updateNDRAction(req.params.ndrId, req.body.action, req.body);
    R.ok(res, result);
  } catch (err) { R.error(res, err.message, 400); }
});

router.get('/ndr/automation/stats', requireRole('ADMIN', 'OPS_MANAGER'), async (req, res) => {
  try { R.ok(res, await ndrAutoSvc.getAutomationStats()); } catch (err) { R.error(res, err.message); }
});

// ── Feature 3: COD Remittance ───────────────────────────────────
router.get('/cod/shipments', async (req, res) => {
  try { R.ok(res, await codSvc.getCODShipments(req.query)); } catch (err) { R.error(res, err.message); }
});

router.get('/cod/summary', async (req, res) => {
  try { R.ok(res, await codSvc.getCODSummary(req.query.clientCode)); } catch (err) { R.error(res, err.message); }
});

router.post('/cod/remittance', requireRole('ADMIN', 'OPS_MANAGER'), async (req, res) => {
  try { R.ok(res, await codSvc.createRemittance(req.body), 'Remittance created'); } catch (err) { R.error(res, err.message, 400); }
});

router.get('/cod/remittances', async (req, res) => {
  try { R.ok(res, await codSvc.getRemittances(req.query)); } catch (err) { R.error(res, err.message); }
});

router.put('/cod/remittance/:id', requireRole('ADMIN', 'OPS_MANAGER'), async (req, res) => {
  try { R.ok(res, await codSvc.updateRemittanceStatus(req.params.id, req.body)); } catch (err) { R.error(res, err.message, 400); }
});

// ── Feature 4: Weight Disputes ──────────────────────────────────
router.get('/disputes', async (req, res) => {
  try { R.ok(res, await disputeSvc.getDisputes(req.query)); } catch (err) { R.error(res, err.message); }
});

router.get('/disputes/summary', async (req, res) => {
  try { R.ok(res, await disputeSvc.getDisputeSummary(req.query.clientCode)); } catch (err) { R.error(res, err.message); }
});

router.post('/disputes/auto-flag/:invoiceId', requireRole('ADMIN', 'OPS_MANAGER'), async (req, res) => {
  try { R.ok(res, await disputeSvc.autoFlagDiscrepancies(req.params.invoiceId)); } catch (err) { R.error(res, err.message, 400); }
});

router.put('/disputes/:id/resolve', requireRole('ADMIN', 'OPS_MANAGER'), async (req, res) => {
  try { R.ok(res, await disputeSvc.resolveDispute(req.params.id, req.body)); } catch (err) { R.error(res, err.message, 400); }
});

// ── Feature 5: Onboarding (admin) ───────────────────────────────
router.get('/onboarding/applications', requireRole('ADMIN', 'OPS_MANAGER'), async (req, res) => {
  try { R.ok(res, await onboardSvc.getApplications(req.query)); } catch (err) { R.error(res, err.message); }
});

router.post('/onboarding/:id/approve', requireRole('ADMIN'), async (req, res) => {
  try { R.ok(res, await onboardSvc.approveApplication(req.params.id, req.user.id), 'Application approved'); } catch (err) { R.error(res, err.message, 400); }
});

router.post('/onboarding/:id/reject', requireRole('ADMIN'), async (req, res) => {
  try { R.ok(res, await onboardSvc.rejectApplication(req.params.id, req.body.reviewNotes)); } catch (err) { R.error(res, err.message, 400); }
});

// ── Feature 6: Warehouses ───────────────────────────────────────
router.get('/warehouses', async (req, res) => {
  try {
    const clientCode = req.query.clientCode || req.user.clientCode;
    if (!clientCode) return R.error(res, 'clientCode required', 400);
    R.ok(res, await warehouseSvc.getByClient(clientCode));
  } catch (err) { R.error(res, err.message); }
});

router.post('/warehouses', async (req, res) => {
  try {
    const clientCode = req.body.clientCode || req.user.clientCode;
    if (!clientCode) return R.error(res, 'clientCode required', 400);
    R.ok(res, await warehouseSvc.create(clientCode, req.body), 'Warehouse created');
  } catch (err) { R.error(res, err.message, 400); }
});

router.put('/warehouses/:id', async (req, res) => {
  try { R.ok(res, await warehouseSvc.update(req.params.id, req.body)); } catch (err) { R.error(res, err.message, 400); }
});

router.delete('/warehouses/:id', async (req, res) => {
  try { R.ok(res, await warehouseSvc.remove(req.params.id), 'Warehouse deleted'); } catch (err) { R.error(res, err.message, 400); }
});

// ── Feature 7: ETA Prediction ───────────────────────────────────
router.get('/shipments/:id/eta', async (req, res) => {
  try { R.ok(res, await etaSvc.predictETA(req.params.id)); } catch (err) { R.error(res, err.message, 400); }
});

router.post('/shipments/eta/bulk', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return R.error(res, 'ids array required', 400);
    R.ok(res, await etaSvc.bulkPredictETA(ids));
  } catch (err) { R.error(res, err.message); }
});

// ── Feature 8: RTO Reduction ────────────────────────────────────
router.get('/rto-reduction/dashboard', requireRole('ADMIN', 'OPS_MANAGER'), async (req, res) => {
  try { R.ok(res, await rtoSvc.getRTOReductionDashboard(req.query.dateFrom, req.query.dateTo)); } catch (err) { R.error(res, err.message); }
});

router.get('/rto-reduction/high-risk', requireRole('ADMIN', 'OPS_MANAGER'), async (req, res) => {
  try { R.ok(res, await rtoSvc.identifyHighRiskShipments(parseInt(req.query.limit) || 50)); } catch (err) { R.error(res, err.message); }
});

router.post('/rto-reduction/intervene/:shipmentId', requireRole('ADMIN', 'OPS_MANAGER'), async (req, res) => {
  try { R.ok(res, await rtoSvc.runPreDeliveryIntervention(req.params.shipmentId)); } catch (err) { R.error(res, err.message, 400); }
});

// ── Feature 9: Channel Integrations ─────────────────────────────
router.get('/integrations/channels', async (req, res) => {
  try {
    const clientCode = req.query.clientCode || req.user.clientCode;
    if (!clientCode) return R.error(res, 'clientCode required', 400);
    R.ok(res, await channelSvc.getClientIntegrations(clientCode));
  } catch (err) { R.error(res, err.message); }
});

router.post('/integrations/channels', async (req, res) => {
  try {
    const clientCode = req.body.clientCode || req.user.clientCode;
    if (!clientCode) return R.error(res, 'clientCode required', 400);
    R.ok(res, await channelSvc.connectChannel(clientCode, req.body), 'Channel connected');
  } catch (err) { R.error(res, err.message, 400); }
});

router.delete('/integrations/channels/:id', async (req, res) => {
  try { R.ok(res, await channelSvc.disconnectChannel(req.params.id), 'Channel disconnected'); } catch (err) { R.error(res, err.message, 400); }
});

router.post('/integrations/shopify/webhook', async (req, res) => {
  try {
    const clientCode = req.query.clientCode || req.body.clientCode;
    if (!clientCode) return R.error(res, 'clientCode required', 400);
    R.ok(res, await channelSvc.processShopifyOrder(clientCode, req.body));
  } catch (err) { R.error(res, err.message, 400); }
});

router.post('/integrations/woocommerce/webhook', async (req, res) => {
  try {
    const clientCode = req.query.clientCode || req.body.clientCode;
    if (!clientCode) return R.error(res, 'clientCode required', 400);
    R.ok(res, await channelSvc.processWooCommerceOrder(clientCode, req.body));
  } catch (err) { R.error(res, err.message, 400); }
});

// ── Feature 10: CSAT ────────────────────────────────────────────
router.post('/csat/survey/:shipmentId', async (req, res) => {
  try { R.ok(res, await csatSvc.createSurvey(req.params.shipmentId), 'Survey sent'); } catch (err) { R.error(res, err.message, 400); }
});

router.get('/csat/dashboard', requireRole('ADMIN', 'OPS_MANAGER'), async (req, res) => {
  try { R.ok(res, await csatSvc.getCSATDashboard(req.query)); } catch (err) { R.error(res, err.message); }
});

// ── Feature 12: SLA Rules ───────────────────────────────────────
router.get('/sla/rules', requireRole('ADMIN', 'OPS_MANAGER'), async (req, res) => {
  try { R.ok(res, await slaSvc.getRules()); } catch (err) { R.error(res, err.message); }
});

router.post('/sla/rules', requireRole('ADMIN'), async (req, res) => {
  try { R.ok(res, await slaSvc.upsertRule(req.body), 'SLA rule saved'); } catch (err) { R.error(res, err.message, 400); }
});

router.delete('/sla/rules/:id', requireRole('ADMIN'), async (req, res) => {
  try { R.ok(res, await slaSvc.deleteRule(req.params.id), 'SLA rule deleted'); } catch (err) { R.error(res, err.message, 400); }
});

router.post('/sla/check', requireRole('ADMIN', 'OPS_MANAGER'), async (req, res) => {
  try { R.ok(res, await slaSvc.checkSLABreaches()); } catch (err) { R.error(res, err.message); }
});

// ── Feature 13: Payments ────────────────────────────────────────
router.post('/payments/create-order', async (req, res) => {
  try {
    const clientCode = req.body.clientCode || req.user.clientCode;
    if (!clientCode) return R.error(res, 'clientCode required', 400);
    R.ok(res, await razorpaySvc.createOrder(clientCode, req.body.amount, req.body.description));
  } catch (err) { R.error(res, err.message, 400); }
});

router.post('/payments/verify', async (req, res) => {
  try { R.ok(res, await razorpaySvc.verifyPayment(req.body), 'Payment verified'); } catch (err) { R.error(res, err.message, 400); }
});

router.get('/payments/history', async (req, res) => {
  try {
    const clientCode = req.query.clientCode || req.user.clientCode;
    if (!clientCode) return R.error(res, 'clientCode required', 400);
    R.ok(res, await razorpaySvc.getPaymentHistory(clientCode, req.query));
  } catch (err) { R.error(res, err.message); }
});

module.exports = router;
