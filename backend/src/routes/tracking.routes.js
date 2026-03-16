// tracking.routes.js
'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/tracking.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.get ('/',            authenticate, ctrl.getDashboard);
router.get ('/:awb',        authenticate, ctrl.getTimeline);
router.post('/:awb/sync',   authenticate, requireRole(['ADMIN','OPS_MANAGER','STAFF']), ctrl.forceSync);
router.post('/:awb/event',  authenticate, requireRole(['ADMIN','OPS_MANAGER','STAFF']), ctrl.addManualEvent);

module.exports = router;
