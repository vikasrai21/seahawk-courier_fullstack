'use strict';

const router = require('express').Router();
const { protect, requireRole } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/errorHandler');

const portalStats = require('../controllers/client-portal/portal.stats');
const portalMap = require('../controllers/client-portal/portal.map');
const portalNdr = require('../controllers/client-portal/portal.ndr');
const portalMisc = require('../controllers/client-portal/portal.misc');
const portalIntel = require('../controllers/client-portal/portal.intelligence');
const portalReliability = require('../controllers/client-portal/portal.reliability');
const portalAssistant = require('../controllers/client-portal/portal.assistant');
const portalWallet = require('../controllers/client-portal/portal.wallet');
const portalInvoices = require('../controllers/client-portal/portal.invoices');
const developerRoutes = require('./developer.routes');
const returnService = require('../services/return.service');

const clientOnly = requireRole('CLIENT', 'ADMIN');
const actorFromReq = (req) => ({
  userId: req.user?.id || null,
  userEmail: req.user?.email || null,
  ip: req.ip || null,
});

router.get('/stats', protect, clientOnly, asyncHandler(portalStats.stats));
router.get('/shipments', protect, clientOnly, asyncHandler(portalStats.shipments));
router.get('/shipments/:id', protect, clientOnly, asyncHandler(portalStats.shipmentDetail));
router.get('/tracking/:awb', protect, clientOnly, asyncHandler(portalStats.trackingDetail));
router.get('/performance', protect, clientOnly, asyncHandler(portalStats.performance));
router.get('/intelligence', protect, clientOnly, asyncHandler(portalIntel.intelligence));
router.post('/assistant', protect, clientOnly, asyncHandler(portalAssistant.assistant));
router.post('/bulk-track', protect, clientOnly, asyncHandler(portalStats.bulkTrack));
router.post('/sync-tracking', protect, clientOnly, asyncHandler(portalStats.syncTracking));

router.get('/wallet', protect, clientOnly, asyncHandler(portalWallet.getWallet));
router.get('/wallet/transactions/:id/receipt', protect, clientOnly, asyncHandler(portalWallet.receipt));
router.get('/wallet/auto-topup', protect, clientOnly, asyncHandler(portalWallet.getAutoTopup));
router.post('/wallet/auto-topup', protect, clientOnly, asyncHandler(portalWallet.updateAutoTopup));
router.post('/wallet/auto-topup/trigger', protect, clientOnly, asyncHandler(portalWallet.triggerAutoTopup));
router.get('/wallet/ledger-export', protect, clientOnly, asyncHandler(portalWallet.monthlyLedgerExport));

router.get('/invoices', protect, clientOnly, asyncHandler(portalInvoices.list));
router.get('/invoices/:id', protect, clientOnly, asyncHandler(portalInvoices.detail));
router.get('/invoices/:id/pdf', protect, clientOnly, asyncHandler(portalInvoices.pdfDownload));
router.get('/invoices/:id/export.csv', protect, clientOnly, asyncHandler(portalInvoices.exportCsv));
router.get('/invoices/:id/export.xls', protect, clientOnly, asyncHandler(portalInvoices.exportExcel));
router.get('/invoices/monthly-export', protect, clientOnly, asyncHandler(portalInvoices.monthlyExport));

router.get('/map/shipments', protect, clientOnly, asyncHandler(portalMap.mapShipments));
router.get('/rto-intelligence', protect, clientOnly, asyncHandler(portalMap.rtoIntelligence));
router.get('/pods', protect, clientOnly, asyncHandler(portalMap.pods));
router.get('/branding', protect, clientOnly, asyncHandler(portalMap.branding));
router.post('/branding', protect, clientOnly, asyncHandler(portalMap.updateBranding));

router.get('/ndr', protect, clientOnly, asyncHandler(portalNdr.list));
router.post('/ndr/:id/respond', protect, clientOnly, asyncHandler(portalNdr.respond));
router.post('/ndr/:id/whatsapp-bridge', protect, clientOnly, asyncHandler(portalNdr.whatsappBridge));
router.post('/ndr/:id/escalate', protect, clientOnly, asyncHandler(portalNdr.escalate));

router.get('/notification-preferences', protect, clientOnly, asyncHandler(portalMisc.notificationPreferences));
router.post('/notification-preferences', protect, clientOnly, asyncHandler(portalMisc.updateNotificationPreferences));
router.get('/pickups', protect, clientOnly, asyncHandler(portalMisc.pickups));
router.post('/pickups', protect, clientOnly, asyncHandler(portalMisc.createPickup));
router.post('/shipments/create-and-book', protect, clientOnly, asyncHandler(portalMisc.createAndBookShipment));

// Rate Calculator routes removed as per requirement: "client should absolutely not have any kind of rates information"
router.post('/import', protect, clientOnly, asyncHandler(portalMisc.importShipments));
router.post('/support-ticket', protect, clientOnly, asyncHandler(portalMisc.supportTicket));
router.get('/developer/diagnostics', protect, clientOnly, asyncHandler(portalReliability.developerDiagnostics));
router.use('/developer', protect, clientOnly, developerRoutes);

// ── Return Requests (Client Portal) ────────────────────────────────────────
router.get('/returns/eligible', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = req.user.clientCode;
  if (!clientCode) return res.status(403).json({ success: false, message: 'Client account required' });
  const { page, limit, search } = req.query;
  const result = await returnService.getEligibleShipments(clientCode, { page, limit, search });
  res.json({ success: true, data: result });
}));

router.get('/returns', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = req.user.clientCode;
  if (!clientCode) return res.status(403).json({ success: false, message: 'Client account required' });
  const { status, returnMethod, reason, dateFrom, dateTo, page, limit, search } = req.query;
  const result = await returnService.listReturns({
    clientCode, status, returnMethod, reason, dateFrom, dateTo, page, limit, search,
  });
  res.json({ success: true, data: result });
}));

router.post('/returns', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = req.user.clientCode;
  if (!clientCode) return res.status(403).json({ success: false, message: 'Client account required' });
  const {
    shipmentId,
    reason,
    returnMethod,
    reasonDetail,
    pickupAddress,
    pickupCity,
    pickupState,
    pickupPincode,
    pickupPhone,
  } = req.body;
  const result = await returnService.createReturnRequest({
    shipmentId,
    clientCode,
    createdBy: req.user.id,
    reason,
    returnMethod,
    reasonDetail,
    pickupAddress,
    pickupCity,
    pickupState,
    pickupPincode,
    pickupPhone,
  }, actorFromReq(req));
  res.json({ success: true, data: result });
}));

router.post('/returns/:id/generate-label', protect, clientOnly, asyncHandler(async (req, res) => {
  const ret = await returnService.getReturn(req.params.id);
  if (ret.clientCode !== req.user.clientCode) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  const result = await returnService.generateSelfShipLabel(req.params.id, actorFromReq(req));
  res.json({ success: true, data: result });
}));

router.get('/returns/:id/timeline', protect, clientOnly, asyncHandler(async (req, res) => {
  const ret = await returnService.getReturn(req.params.id);
  if (ret.clientCode !== req.user.clientCode) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  const { limit } = req.query;
  const timeline = await returnService.getReturnTimeline(req.params.id, { limit });
  res.json({ success: true, data: timeline });
}));

router.get('/returns/:id', protect, clientOnly, asyncHandler(async (req, res) => {
  const ret = await returnService.getReturn(req.params.id);
  if (ret.clientCode !== req.user.clientCode) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  res.json({ success: true, data: ret });
}));

module.exports = router;

