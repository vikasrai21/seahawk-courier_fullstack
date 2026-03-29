'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/wallet.controller');
const { authenticate, requireRole, requireClientAccountAccess } = require('../middleware/auth.middleware');
const MGMT = ['ADMIN','OPS_MANAGER'];

router.get ('/',                            authenticate, requireRole(MGMT), ctrl.listWallets);
router.get ('/me',                              authenticate, requireRole(['CLIENT']), ctrl.getMyWallet);
router.get ('/:clientCode',                 authenticate, requireClientAccountAccess(), ctrl.getWallet);
router.get ('/:clientCode/transactions',    authenticate, requireClientAccountAccess(), ctrl.getTransactions);
router.post('/recharge/order',              authenticate, requireClientAccountAccess({ body: 'clientCode' }), ctrl.createRechargeOrder);
router.post('/recharge/verify',             authenticate, requireClientAccountAccess({ body: 'clientCode' }), ctrl.verifyRecharge);
router.post('/debit',                       authenticate, requireRole(MGMT), ctrl.debitWallet);
router.post('/adjust',                      authenticate, requireRole(['ADMIN']), ctrl.adjustWallet);
module.exports = router;
