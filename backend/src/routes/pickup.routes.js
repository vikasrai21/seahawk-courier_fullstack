'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/pickup.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

const STAFF_ROLES = ['ADMIN', 'OPS_MANAGER', 'STAFF'];

router.use(authenticate);

router.get('/', requireRole(STAFF_ROLES), ctrl.list);
router.get('/today', requireRole(STAFF_ROLES), ctrl.today);
router.get('/stats', requireRole(STAFF_ROLES), ctrl.pickupStats);
router.get('/:id', requireRole(STAFF_ROLES), ctrl.getOne);
router.post('/', requireRole(STAFF_ROLES), ctrl.create);
router.patch('/:id', requireRole(STAFF_ROLES), ctrl.update);
router.patch('/:id/status', requireRole(STAFF_ROLES), ctrl.update);

module.exports = router;
