// src/routes/shipment.routes.js
const express = require('express');
const router = express.Router();
const ctrl   = require('../controllers/shipment.controller');
const { protect, ownerOnly, requireRole, requireOwnerOrRole } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { shipmentSchema, updateShipmentSchema, statusUpdateSchema, scanAwbSchema, importSchema, scanAwbBulkSchema } = require('../validators/shipment.validator');
const config = require('../config');

const importJsonParser = express.json({ limit: config.bodyLimits.importJson });

router.use(protect); // All shipment routes require auth
router.use(requireOwnerOrRole('ADMIN', 'OPS_MANAGER', 'STAFF'));

router.get('/',               ctrl.getAll);
router.get('/import-ledger',  ownerOnly, ctrl.getImportLedger);
router.get('/stats/today',    ctrl.getTodayStats);
router.get('/stats/monthly',  ctrl.getMonthlyStats);
router.get('/:id',            ctrl.getOne);
router.post('/',              validate(shipmentSchema),       ctrl.create);
router.post('/import',        requireRole('ADMIN', 'OPS_MANAGER'), importJsonParser, validate(importSchema), ctrl.bulkImport);
router.post('/scan',          requireRole('ADMIN', 'OPS_MANAGER', 'STAFF'), validate(scanAwbSchema), ctrl.scanAwb);
router.post('/scan-image',    requireRole('ADMIN', 'OPS_MANAGER', 'STAFF'), importJsonParser, ctrl.scanImage);
router.post('/scan-mobile',   requireRole('ADMIN', 'OPS_MANAGER', 'STAFF'), importJsonParser, ctrl.scanMobile);
router.post('/scan-bulk',     requireRole('ADMIN', 'OPS_MANAGER', 'STAFF'), validate(scanAwbBulkSchema), ctrl.scanAwbBulk);
router.post('/learn-corrections', requireRole('ADMIN', 'OPS_MANAGER', 'STAFF'), ctrl.learnCorrections);
router.put('/:id',            validate(updateShipmentSchema), ctrl.update);
router.patch('/:id/status',   validate(statusUpdateSchema),   ctrl.patchStatus);
router.get('/:id/transitions',                                 ctrl.getValidStatuses);
router.delete('/:id',         requireOwnerOrRole('ADMIN'), ctrl.remove);

module.exports = router;
