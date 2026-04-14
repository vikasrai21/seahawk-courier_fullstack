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

const clientOnly = requireRole('CLIENT', 'ADMIN');

router.get('/stats', protect, clientOnly, asyncHandler(portalStats.stats));
router.get('/shipments', protect, clientOnly, asyncHandler(portalStats.shipments));
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

router.get('/notification-preferences', protect, clientOnly, asyncHandler(portalMisc.notificationPreferences));
router.post('/notification-preferences', protect, clientOnly, asyncHandler(portalMisc.updateNotificationPreferences));
router.get('/pickups', protect, clientOnly, asyncHandler(portalMisc.pickups));
router.post('/pickups', protect, clientOnly, asyncHandler(portalMisc.createPickup));

// Rate Calculator routes removed as per requirement: "client should absolutely not have any kind of rates information"
router.post('/import', protect, clientOnly, asyncHandler(portalMisc.importShipments));
router.post('/support-ticket', protect, clientOnly, asyncHandler(portalMisc.supportTicket));
router.get('/developer/diagnostics', protect, clientOnly, asyncHandler(portalReliability.developerDiagnostics));
router.use('/developer', protect, clientOnly, developerRoutes);

module.exports = router;
