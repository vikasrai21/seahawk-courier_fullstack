'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/wallet.controller');
const { authenticate, requireRole, ownerOnly, requireClientAccountAccess } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { rechargeOrderSchema, rechargeVerifySchema, walletDebitSchema, walletAdjustSchema, walletTransactionsQuerySchema } = require('../validators/wallet.validator');

router.get ('/',                            authenticate, ownerOnly, ctrl.listWallets);
router.get ('/me',                              authenticate, requireRole(['CLIENT']), ctrl.getMyWallet);
router.get ('/:clientCode',                 authenticate, requireClientAccountAccess(), ctrl.getWallet);
router.get ('/:clientCode/transactions',    authenticate, requireClientAccountAccess(), validate(walletTransactionsQuerySchema, 'query'), ctrl.getTransactions);
router.get ('/:clientCode/transactions/:id/receipt', authenticate, requireClientAccountAccess(), ctrl.downloadReceipt);
router.post('/recharge/order',              authenticate, requireClientAccountAccess({ body: 'clientCode' }), validate(rechargeOrderSchema), ctrl.createRechargeOrder);
router.post('/recharge/verify',             authenticate, requireClientAccountAccess({ body: 'clientCode' }), validate(rechargeVerifySchema), ctrl.verifyRecharge);
router.post('/debit',                       authenticate, ownerOnly, validate(walletDebitSchema), ctrl.debitWallet);
router.post('/adjust',                      authenticate, ownerOnly, validate(walletAdjustSchema), ctrl.adjustWallet);
module.exports = router;
