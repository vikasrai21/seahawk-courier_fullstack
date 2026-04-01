/* wallet.controller.js — Feature #10: Wallet & Payment System */
'use strict';

const prisma                = require('../config/prisma');
const config                = require('../config');
const R                     = require('../utils/response');
const notify                = require('../services/notification.service');
const pdf                   = require('../services/pdf.service');
const walletService         = require('../services/wallet.service');
const { auditLog }          = require('../utils/audit');
const { asyncHandler }      = require('../middleware/errorHandler');

function withReceiptMeta(txn) {
  const amount = Number(txn.amount || 0);
  const gstPercent = Number(txn.gstPercent || 18);
  const taxableAmount = Number((amount / (1 + (gstPercent / 100))).toFixed(2));
  const gstAmount = Number((amount - taxableAmount).toFixed(2));
  return {
    ...txn,
    gstPercent,
    taxableAmount,
    gstAmount,
    receiptNo: `RCPT-${new Date(txn.createdAt || Date.now()).toISOString().slice(0, 10).replace(/-/g, '')}-${txn.id}`,
  };
}

async function fetchVerifiedRazorpayPayment({ orderId, paymentId, signature, expectedAmount, expectedClientCode }) {
  const razorpayKey = config.carriers.razorpay.keyId;
  const razorpaySecret = config.carriers.razorpay.secret;

  if (!razorpayKey || !razorpaySecret) {
    if (config.payments.allowMockRecharge) {
      return {
        id: paymentId,
        order_id: orderId,
        amount: Math.round(expectedAmount * 100),
        currency: 'INR',
        status: 'captured',
        notes: { clientCode: expectedClientCode },
      };
    }
    return null;
  }

  const crypto = require('crypto');
  const expectedSig = crypto
    .createHmac('sha256', razorpaySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (expectedSig !== signature) return false;

  const Razorpay = require('razorpay');
  const rzp = new Razorpay({ key_id: razorpayKey, key_secret: razorpaySecret });
  const [payment, order] = await Promise.all([
    rzp.payments.fetch(paymentId),
    rzp.orders.fetch(orderId),
  ]);

  if (!payment || !order) return false;
  if (payment.order_id !== orderId) return false;
  if (!['captured', 'authorized'].includes(String(payment.status || '').toLowerCase())) return false;
  if (Number(payment.amount) !== Math.round(expectedAmount * 100)) return false;
  if (String(order.notes?.clientCode || '').trim().toUpperCase() !== expectedClientCode) return false;

  return payment;
}

/* ── GET /api/wallet  — all wallets (admin) ── */
const listWallets = asyncHandler(async (req, res) => {
  const clients = await prisma.client.findMany({
    where:   { active: true },
    select:  { code: true, company: true, phone: true, walletBalance: true },
    orderBy: { walletBalance: 'desc' },
  });
  R.ok(res, { wallets: clients.map(c => ({ ...c, balance: c.walletBalance })) });
});


/* ── GET /api/wallet/me  — current user's wallet (CLIENT role) ── */
const getMyWallet = asyncHandler(async (req, res) => {
  if (!req.user.clientCode) {
    return R.error(res, 'No client account linked to this user', 404);
  }

  const client = await prisma.client.findUnique({
    where:  { code: req.user.clientCode },
    select: { code: true, company: true, walletBalance: true },
  });
  if (!client) return R.error(res, 'No client account linked to this user', 404);

  const txns = await prisma.walletTransaction.findMany({
    where:   { clientCode: client.code },
    orderBy: { createdAt: 'desc' },
    take:    50,
  });
  R.ok(res, { ...client, balance: client.walletBalance, transactions: txns.map(withReceiptMeta) });
});

/* ── GET /api/wallet/:clientCode ── */
const getWallet = asyncHandler(async (req, res) => {
  const { clientCode } = req.params;
  if (clientCode === 'all') return listWallets(req, res);

  const client = await prisma.client.findUnique({
    where:  { code: clientCode },
    select: { code: true, company: true, walletBalance: true },
  });
  if (!client) return R.error(res, 'Client not found', 404);

  const txns = await prisma.walletTransaction.findMany({
    where:   { clientCode },
    orderBy: { createdAt: 'desc' },
    take:    50,
  });
  R.ok(res, { ...client, balance: client.walletBalance, transactions: txns.map(withReceiptMeta) });
});

/* ── GET /api/wallet/:clientCode/transactions ── */
const getTransactions = asyncHandler(async (req, res) => {
  const { clientCode } = req.params;
  const { type, page = 1, limit = 30, dateFrom, dateTo } = req.query;

  const where = { clientCode };
  if (type) where.type = type;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo)   where.createdAt.lte = new Date(dateTo + 'T23:59:59Z');
  }

  const [txns, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:    (parseInt(page) - 1) * parseInt(limit),
      take:    parseInt(limit),
    }),
    prisma.walletTransaction.count({ where }),
  ]);

  R.ok(res, { transactions: txns.map(withReceiptMeta), total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

/* ── GET /api/wallet/:clientCode/transactions/:id/receipt ── */
const downloadReceipt = asyncHandler(async (req, res) => {
  const clientCode = String(req.params.clientCode || '').trim().toUpperCase();
  const txnId = parseInt(req.params.id, 10);

  const [client, txn] = await Promise.all([
    prisma.client.findUnique({
      where: { code: clientCode },
      select: { code: true, company: true, address: true, gst: true, phone: true },
    }),
    prisma.walletTransaction.findFirst({
      where: { id: txnId, clientCode },
    }),
  ]);

  if (!client) return R.error(res, 'Client not found', 404);
  if (!txn) return R.error(res, 'Wallet transaction not found', 404);
  if (txn.type !== 'CREDIT') return R.error(res, 'Only credit transactions have GST receipts', 400);

  const enrichedTxn = withReceiptMeta(txn);
  const buf = await pdf.generateWalletReceiptPDF(enrichedTxn, client);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="wallet-receipt-${enrichedTxn.receiptNo}.pdf"`,
    'Content-Length': buf.length,
  });
  res.send(buf);
});

/* ── POST /api/wallet/recharge/order  — create Razorpay order ── */
const createRechargeOrder = asyncHandler(async (req, res) => {
  const clientCode = String(req.body.clientCode || '').trim().toUpperCase();
  const amount = Number(req.body.amount);
  if (!clientCode || !Number.isFinite(amount) || amount < 100) {
    return R.error(res, 'clientCode and amount (min ₹100) required', 400);
  }

  const client = await prisma.client.findUnique({ where: { code: clientCode } });
  if (!client) return R.error(res, 'Client not found', 404);

  const razorpayKey = config.carriers.razorpay.keyId;
  const razorpaySecret = config.carriers.razorpay.secret;

  if ((!razorpayKey || !razorpaySecret) && config.payments.allowMockRecharge) {
    const mockOrder = {
      id:       `order_dev_${Date.now()}`,
      amount:   amount * 100,
      currency: 'INR',
      receipt:  `wallet_${clientCode}_${Date.now()}`,
    };
    return R.ok(res, { order: mockOrder, key: 'rzp_dev_key', clientCode, amount, devMode: true });
  }
  if (!razorpayKey || !razorpaySecret) {
    return R.error(res, 'Wallet recharge is temporarily unavailable', 503);
  }

  const Razorpay = require('razorpay');
  const rzp      = new Razorpay({ key_id: razorpayKey, key_secret: razorpaySecret });

  const order = await rzp.orders.create({
    amount:   Math.round(amount * 100),
    currency: 'INR',
    receipt:  `wallet_${clientCode}_${Date.now()}`,
    notes:    { clientCode, purpose: 'wallet_recharge' },
  });

  R.ok(res, { order, key: razorpayKey, clientCode, amount });
});

/* ── POST /api/wallet/recharge/verify  — verify payment & credit wallet ── */
const verifyRecharge = asyncHandler(async (req, res) => {
  const razorpay_order_id = String(req.body.razorpay_order_id || '').trim();
  const razorpay_payment_id = String(req.body.razorpay_payment_id || '').trim();
  const razorpay_signature = String(req.body.razorpay_signature || '').trim();
  const clientCode = String(req.body.clientCode || '').trim().toUpperCase();
  const amount = Number(req.body.amount);

  if (!clientCode || !Number.isFinite(amount) || amount <= 0) {
    return R.error(res, 'Valid clientCode and amount are required', 400);
  }

  const verifiedPayment = await fetchVerifiedRazorpayPayment({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
    expectedAmount: amount,
    expectedClientCode: clientCode,
  });
  if (verifiedPayment === null) {
    return R.error(res, 'Wallet recharge is temporarily unavailable', 503);
  }
  if (verifiedPayment === false) {
    return R.error(res, 'Payment verification failed', 400);
  }

  const existing = await prisma.walletTransaction.findFirst({
    where: {
      OR: [
        { paymentId: razorpay_payment_id },
        { reference: razorpay_order_id },
      ],
    },
    select: { id: true },
  });
  if (existing) {
    return R.error(res, 'This payment has already been processed', 409);
  }

  const { wallet, txn } = await walletService.credit({
    clientCode,
    amount,
    description: 'Wallet recharge via Razorpay',
    reference: razorpay_order_id,
    paymentMode: config.carriers.razorpay.keyId ? 'RAZORPAY' : 'MOCK_RAZORPAY',
    paymentId: razorpay_payment_id,
  });

  await notify.paymentReceived({ ...txn, balance: wallet.walletBalance }, clientCode).catch(() => {});
  await auditLog({
    userId:    req.user?.id,
    userEmail: req.user?.email,
    action:    'WALLET_CREDITED',
    entity:    'CLIENT',
    entityId:  clientCode,
    newValue:  { amount },
    ip:        req.ip,
  });

  R.ok(res, {
    message:    'Wallet recharged successfully',
    amount,
    newBalance: wallet.walletBalance,
  });
});

/* ── POST /api/wallet/debit  — debit wallet for shipment (admin/ops) ── */
const debitWallet = asyncHandler(async (req, res) => {
  const { clientCode, amount, description, reference } = req.body;
  const { wallet } = await walletService.debit({ clientCode, amount, description, reference });
  R.ok(res, { message: 'Wallet debited', amount: Number(amount), newBalance: wallet.walletBalance });
});

/* ── POST /api/wallet/adjust  — manual adjustment by admin ── */
const adjustWallet = asyncHandler(async (req, res) => {
  const { clientCode, amount, type, description } = req.body;
  const signedAmount = type === 'CREDIT' ? Number(amount) : -Number(amount);
  const { wallet } = await walletService.adjust({
    clientCode,
    amount: signedAmount,
    description: description || 'Manual adjustment',
  });

  await auditLog({
    userId:    req.user?.id,
    userEmail: req.user?.email,
    action:    `WALLET_${type}_MANUAL`,
    entity:    'CLIENT',
    entityId:  clientCode,
    newValue:  { amount, type, description },
    ip:        req.ip,
  });

  R.ok(res, { message: `Wallet ${type.toLowerCase()}ed`, amount: Number(amount), newBalance: wallet.walletBalance });
});

module.exports = {
  listWallets,
  getMyWallet,
  getWallet,
  getTransactions,
  downloadReceipt,
  createRechargeOrder,
  verifyRecharge,
  debitWallet,
  adjustWallet,
};
