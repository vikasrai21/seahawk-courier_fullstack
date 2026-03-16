'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/pickup.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
router.post ('/',        ctrl.create);  // public — from website booking form
router.get  ('/',        authenticate, requireRole(['ADMIN','OPS_MANAGER','STAFF']), ctrl.list);
router.get  ('/today',   authenticate, requireRole(['ADMIN','OPS_MANAGER','STAFF']), ctrl.today);
router.get  ('/stats',   authenticate, requireRole(['ADMIN','OPS_MANAGER','STAFF']), ctrl.pickupStats);
router.get  ('/:id',     authenticate, ctrl.getOne);
router.patch('/:id',     authenticate, requireRole(['ADMIN','OPS_MANAGER']), ctrl.update);
module.exports = router;
