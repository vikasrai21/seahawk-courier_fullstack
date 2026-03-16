'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/wallet.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const MGMT = ['ADMIN','OPS_MANAGER'];

router.get ('/',                            authenticate, requireRole(MGMT), ctrl.listWallets);
router.get ('/me',                              authenticate, ctrl.getMyWallet);
router.get ('/:clientCode',                 authenticate, ctrl.getWallet);
router.get ('/:clientCode/transactions',    authenticate, ctrl.getTransactions);
router.post('/recharge/order',              authenticate, ctrl.createRechargeOrder);
router.post('/recharge/verify',             authenticate, ctrl.verifyRecharge);
router.post('/debit',                       authenticate, requireRole(MGMT), ctrl.debitWallet);
router.post('/adjust',                      authenticate, requireRole(['ADMIN']), ctrl.adjustWallet);
module.exports = router;
