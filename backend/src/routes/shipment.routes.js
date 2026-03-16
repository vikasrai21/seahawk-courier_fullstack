// src/routes/shipment.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/shipment.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { shipmentSchema, updateShipmentSchema, statusUpdateSchema, importSchema } = require('../validators/shipment.validator');

router.use(protect); // All shipment routes require auth

router.get('/',               ctrl.getAll);
router.get('/stats/today',    ctrl.getTodayStats);
router.get('/stats/monthly',  ctrl.getMonthlyStats);
router.get('/:id',            ctrl.getOne);
router.post('/',              validate(shipmentSchema),       ctrl.create);
router.post('/import',        validate(importSchema),         ctrl.bulkImport);
router.put('/:id',            validate(updateShipmentSchema), ctrl.update);
router.patch('/:id/status',   validate(statusUpdateSchema),   ctrl.patchStatus);
router.delete('/:id',         adminOnly, ctrl.remove);  // ADMIN only

module.exports = router;
