/* wallet.controller.js — Feature #10: Wallet & Payment System */
'use strict';

const prisma                = require('../config/prisma');
const R                     = require('../utils/response');
const notify                = require('../services/notification.service');
const pdf                   = require('../services/pdf.service');
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

  const razorpayKey    = process.env.RAZORPAY_KEY_ID;
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!razorpayKey || !razorpaySecret) {
    const mockOrder = {
      id:       `order_dev_${Date.now()}`,
      amount:   amount * 100,
      currency: 'INR',
      receipt:  `wallet_${clientCode}_${Date.now()}`,
    };
    return R.ok(res, { order: mockOrder, key: 'rzp_dev_key', clientCode, amount, devMode: true });
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

  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
  if (razorpaySecret && razorpay_signature) {
    const crypto      = require('crypto');
    const expectedSig = crypto
      .createHmac('sha256', razorpaySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    if (expectedSig !== razorpay_signature) {
      return R.error(res, 'Invalid payment signature', 400);
    }
  }

  const existing = await prisma.walletTransaction.findFirst({
    where: {
      clientCode,
      ...((razorpay_payment_id || razorpay_order_id) ? {
        OR: [
          ...(razorpay_payment_id ? [{ paymentId: razorpay_payment_id }] : []),
          [{ reference: razorpay_payment_id || razorpay_order_id }],
        ].flat(),
      } : {}),
    },
    select: { id: true },
  });
  if (existing) {
    return R.error(res, 'This payment has already been processed', 409);
  }

  const { wallet, txn } = await prisma.$transaction(async (tx) => {
    const updatedClient = await tx.client.update({
      where: { code: clientCode },
      data:  { walletBalance: { increment: amount } },
      select: { walletBalance: true },
    });

    const createdTxn = await tx.walletTransaction.create({
      data: {
        clientCode,
        type:        'CREDIT',
        amount,
        balance:     updatedClient.walletBalance,
        description: 'Wallet recharge via Razorpay',
        reference:   razorpay_payment_id || razorpay_order_id,
        paymentMode: 'RAZORPAY',
        paymentId:   razorpay_payment_id || null,
        status:      'SUCCESS',
      },
    });

    return { wallet: updatedClient, txn: createdTxn };
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
  if (!clientCode || !amount) return R.error(res, 'clientCode and amount required', 400);

  const client = await prisma.client.findUnique({ where: { code: clientCode } });
  if (!client) return R.error(res, 'Client not found', 404);
  if (client.walletBalance < amount) {
    return R.error(res, `Insufficient balance. Available: ₹${client.walletBalance}`, 400);
  }

  const [txn] = await prisma.$transaction([
    prisma.walletTransaction.create({
      data: {
        clientCode,
        type:        'DEBIT',
        amount:      parseFloat(amount),
        balance:     client.walletBalance - parseFloat(amount),
        description: description || 'Shipment charge',
        reference:   reference || undefined,
        paymentMode: 'WALLET',
        status:      'SUCCESS',
      },
    }),
    prisma.client.update({
      where: { code: clientCode },
      data:  { walletBalance: { decrement: parseFloat(amount) } },
    }),
  ]);

  R.ok(res, { message: 'Wallet debited', amount: parseFloat(amount), newBalance: txn.balance });
});

/* ── POST /api/wallet/adjust  — manual adjustment by admin ── */
const adjustWallet = asyncHandler(async (req, res) => {
  const { clientCode, amount, type, description } = req.body;
  if (!['CREDIT', 'DEBIT'].includes(type)) return R.error(res, 'type must be CREDIT or DEBIT', 400);

  const client = await prisma.client.findUnique({ where: { code: clientCode } });
  if (!client) return R.error(res, 'Client not found', 404);

  const newBalance = type === 'CREDIT'
    ? client.walletBalance + parseFloat(amount)
    : client.walletBalance - parseFloat(amount);

  if (newBalance < 0) return R.error(res, 'Adjustment would result in negative balance', 400);

  await prisma.$transaction([
    prisma.walletTransaction.create({
      data: {
        clientCode,
        userId:      req.user?.id,
        type,
        amount:      parseFloat(amount),
        balance:     newBalance,
        description: description || 'Manual adjustment',
        paymentMode: 'ADJUSTMENT',
        status:      'SUCCESS',
      },
    }),
    prisma.client.update({
      where: { code: clientCode },
      data:  { walletBalance: newBalance },
    }),
  ]);

  await auditLog({
    userId:    req.user?.id,
    userEmail: req.user?.email,
    action:    `WALLET_${type}_MANUAL`,
    entity:    'CLIENT',
    entityId:  clientCode,
    newValue:  { amount, type, description },
    ip:        req.ip,
  });

  R.ok(res, { message: `Wallet ${type.toLowerCase()}ed`, amount: parseFloat(amount), newBalance });
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
