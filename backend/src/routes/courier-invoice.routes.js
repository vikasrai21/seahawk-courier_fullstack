// src/routes/courier-invoice.routes.js
'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/courier-invoice.controller');
const { protect, ownerOnly } = require('../middleware/auth.middleware');

// All audit tools are restricted to OWNER as per latest instructions
router.use(protect, ownerOnly);

router.get('/pending', ctrl.getPendingAudits);
router.get('/summary', ctrl.getMonthlySummary);
router.get('/:id',      ctrl.getAuditDetails);
router.post('/:id/save', ctrl.saveAuditResult);

module.exports = router;
