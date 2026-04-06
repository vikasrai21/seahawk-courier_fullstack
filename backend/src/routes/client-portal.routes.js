'use strict';

const router = require('express').Router();
const { protect, requireRole } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/errorHandler');

const portalStats = require('../controllers/client-portal/portal.stats');
const portalMap = require('../controllers/client-portal/portal.map');
const portalNdr = require('../controllers/client-portal/portal.ndr');
const portalMisc = require('../controllers/client-portal/portal.misc');
const portalIntel = require('../controllers/client-portal/portal.intelligence');
const portalAssistant = require('../controllers/client-portal/portal.assistant');

const clientOnly = requireRole('CLIENT', 'ADMIN');

router.get('/stats', protect, clientOnly, asyncHandler(portalStats.stats));
router.get('/shipments', protect, clientOnly, asyncHandler(portalStats.shipments));
router.get('/performance', protect, clientOnly, asyncHandler(portalStats.performance));
router.get('/intelligence', protect, clientOnly, asyncHandler(portalIntel.intelligence));
router.post('/assistant', protect, clientOnly, asyncHandler(portalAssistant.assistant));
router.post('/bulk-track', protect, clientOnly, asyncHandler(portalStats.bulkTrack));
router.post('/sync-tracking', protect, clientOnly, asyncHandler(portalStats.syncTracking));

// Invoices and Wallet routes removed as per requirement: "client should absolutely not have any kind of rates information"

router.get('/map/shipments', protect, clientOnly, asyncHandler(portalMap.mapShipments));
router.get('/rto-intelligence', protect, clientOnly, asyncHandler(portalMap.rtoIntelligence));
router.get('/pods', protect, clientOnly, asyncHandler(portalMap.pods));
router.get('/branding', protect, clientOnly, asyncHandler(portalMap.branding));

router.get('/ndr', protect, clientOnly, asyncHandler(portalNdr.list));
router.post('/ndr/:id/respond', protect, clientOnly, asyncHandler(portalNdr.respond));

router.get('/notification-preferences', protect, clientOnly, asyncHandler(portalMisc.notificationPreferences));
router.post('/notification-preferences', protect, clientOnly, asyncHandler(portalMisc.updateNotificationPreferences));
router.get('/pickups', protect, clientOnly, asyncHandler(portalMisc.pickups));
router.post('/pickups', protect, clientOnly, asyncHandler(portalMisc.createPickup));

// Rate Calculator routes removed as per requirement: "client should absolutely not have any kind of rates information"
router.post('/import', protect, clientOnly, asyncHandler(portalMisc.importShipments));
router.post('/support-ticket', protect, clientOnly, asyncHandler(portalMisc.supportTicket));

module.exports = router;
