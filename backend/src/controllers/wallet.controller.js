/* wallet.controller.js — Feature #10: Wallet & Payment System */
'use strict';

const prisma  = require('../config/prisma');
const R       = require('../utils/response');
const notify  = require('../services/notification.service');
const { logAudit } = require('../utils/audit');
const logger  = require('../utils/logger');

/* ── GET /api/wallet  — all wallets (admin) ── */
async function listWallets(req, res) {
  try {
    const clients = await prisma.client.findMany({
      where:   { active: true },
      select:  { code: true, company: true, phone: true, walletBalance: true },
      orderBy: { walletBalance: 'desc' },
    });
    return R.ok(res, { wallets: clients.map(c => ({ ...c, balance: c.walletBalance })) });
  } catch (err) { return R.error(res, err.message); }
}


/* ── GET /api/wallet/me  — current user's wallet (CLIENT role) ── */
async function getMyWallet(req, res) {
  try {
    // Find client linked to this user by email
    const client = await prisma.client.findFirst({
      where: { email: req.user.email },
      select: { code: true, company: true, walletBalance: true },
    });
    if (!client) return R.error(res, 'No client account linked to this user', 404);
    const txns = await prisma.walletTransaction.findMany({
      where:   { clientCode: client.code },
      orderBy: { createdAt: 'desc' },
      take:    50,
    });
    return R.ok(res, { ...client, balance: client.walletBalance, transactions: txns });
  } catch (err) { return R.error(res, err.message); }
}

/* ── GET /api/wallet/:clientCode ── */
async function getWallet(req, res) {
  try {
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
    return R.ok(res, { ...client, balance: client.walletBalance, transactions: txns });
  } catch (err) { return R.error(res, err.message); }
}

/* ── GET /api/wallet/:clientCode/transactions ── */
async function getTransactions(req, res) {
  try {
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

    return R.ok(res, { transactions: txns, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    return R.error(res, err.message);
  }
}

/* ── POST /api/wallet/recharge/order  — create Razorpay order ── */
async function createRechargeOrder(req, res) {
  try {
    const { clientCode, amount } = req.body;
    if (!clientCode || !amount || amount < 100) {
      return R.error(res, 'clientCode and amount (min ₹100) required', 400);
    }

    const client = await prisma.client.findUnique({ where: { code: clientCode } });
    if (!client) return R.error(res, 'Client not found', 404);

    const razorpayKey = process.env.RAZORPAY_KEY_ID;
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKey || !razorpaySecret) {
      // Dev mode: simulate order
      const mockOrder = {
        id:       `order_dev_${Date.now()}`,
        amount:   amount * 100,
        currency: 'INR',
        receipt:  `wallet_${clientCode}_${Date.now()}`,
      };
      return R.ok(res, { order: mockOrder, key: 'rzp_dev_key', clientCode, amount, devMode: true });
    }

    const Razorpay = require('razorpay');
    const rzp = new Razorpay({ key_id: razorpayKey, key_secret: razorpaySecret });

    const order = await rzp.orders.create({
      amount:   Math.round(amount * 100),
      currency: 'INR',
      receipt:  `wallet_${clientCode}_${Date.now()}`,
      notes:    { clientCode, purpose: 'wallet_recharge' },
    });

    return R.ok(res, { order, key: razorpayKey, clientCode, amount });
  } catch (err) {
    logger.error('Razorpay order error', err);
    return R.error(res, err.message);
  }
}

/* ── POST /api/wallet/recharge/verify  — verify payment & credit wallet ── */
async function verifyRecharge(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, clientCode, amount } = req.body;

    // Verify Razorpay signature
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
    if (razorpaySecret && razorpay_signature) {
      const crypto = require('crypto');
      const expectedSig = crypto.createHmac('sha256', razorpaySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
      if (expectedSig !== razorpay_signature) {
        return R.error(res, 'Invalid payment signature', 400);
      }
    }

    // Credit wallet in transaction
    const [txn] = await prisma.$transaction([
      prisma.walletTransaction.create({
        data: {
          clientCode,
          type:        'CREDIT',
          amount:      parseFloat(amount),
          balance:     0, // will update below
          description: `Wallet recharge via Razorpay`,
          reference:   razorpay_payment_id || razorpay_order_id,
          paymentMode: 'RAZORPAY',
          paymentId:   razorpay_payment_id,
          status:      'SUCCESS',
        },
      }),
      prisma.client.update({
        where: { code: clientCode },
        data:  { walletBalance: { increment: parseFloat(amount) } },
      }),
    ]);

    const client = await prisma.client.findUnique({ where: { code: clientCode }, select: { walletBalance: true } });

    await notify.paymentReceived({ ...txn, balance: client.walletBalance }, clientCode).catch(() => {});
    await logAudit({ req, action: 'WALLET_CREDITED', entity: 'Client', entityId: clientCode, newValue: { amount } });

    return R.ok(res, {
      message:    'Wallet recharged successfully',
      amount:     parseFloat(amount),
      newBalance: client.walletBalance,
    });
  } catch (err) {
    logger.error('Verify recharge error', err);
    return R.error(res, err.message);
  }
}

/* ── POST /api/wallet/debit  — debit wallet for shipment (admin/ops) ── */
async function debitWallet(req, res) {
  try {
    const { clientCode, amount, description, reference } = req.body;
    if (!clientCode || !amount) return R.error(res, 'clientCode and amount required', 400);

    const client = await prisma.client.findUnique({ where: { code: clientCode } });
    if (!client) return R.error(res, 'Client not found', 404);
    if (client.walletBalance < amount) return R.error(res, `Insufficient balance. Available: ₹${client.walletBalance}`, 400);

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

    return R.ok(res, { message: 'Wallet debited', amount: parseFloat(amount), newBalance: txn.balance });
  } catch (err) {
    return R.error(res, err.message);
  }
}

/* ── POST /api/wallet/adjust  — manual adjustment by admin ── */
async function adjustWallet(req, res) {
  try {
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

    await logAudit({ req, action: `WALLET_${type}_MANUAL`, entity: 'Client', entityId: clientCode, newValue: { amount, type, description } });

    return R.ok(res, { message: `Wallet ${type.toLowerCase()}ed`, amount: parseFloat(amount), newBalance });
  } catch (err) {
    return R.error(res, err.message);
  }
}

module.exports = { listWallets, getMyWallet, getWallet, getTransactions, createRechargeOrder, verifyRecharge, debitWallet, adjustWallet };
