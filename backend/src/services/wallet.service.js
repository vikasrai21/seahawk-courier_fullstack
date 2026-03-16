// src/services/wallet.service.js
const prisma  = require('../config/prisma');
const crypto  = require('crypto');
const config  = require('../config');

// ── Get or create wallet for a client ──────────────────────────────────────
async function getWallet(clientCode) {
  let wallet = await prisma.wallet.findUnique({ where: { clientCode } });
  if (!wallet) {
    wallet = await prisma.wallet.create({ data: { clientCode, balance: 0 } });
  }
  return wallet;
}

async function getBalance(clientCode) {
  const w = await getWallet(clientCode);
  return w.balance;
}

async function getTransactions(clientCode, { page = 1, limit = 30 }) {
  const wallet = await getWallet(clientCode);
  const [txns, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
  ]);
  return { wallet, txns, total };
}

// ── Credit (recharge) ──────────────────────────────────────────────────────
async function credit({ clientCode, amount, description, refNo, paymentId, orderId }) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.update({
      where: { clientCode },
      data: { balance: { increment: amount } },
    });
    const txn = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'CREDIT',
        amount,
        balance: wallet.balance,
        description,
        refNo,
        paymentId,
        orderId,
        status: 'COMPLETED',
      },
    });
    return { wallet, txn };
  });
}

// ── Debit (pay for shipment) ───────────────────────────────────────────────
async function debit({ clientCode, amount, description, refNo }) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { clientCode } });
    if (!wallet || wallet.balance < amount) throw new Error('Insufficient wallet balance');
    const updated = await tx.wallet.update({
      where: { clientCode },
      data: { balance: { decrement: amount } },
    });
    const txn = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEBIT',
        amount,
        balance: updated.balance,
        description,
        refNo,
        status: 'COMPLETED',
      },
    });
    return { wallet: updated, txn };
  });
}

// ── Razorpay order creation ────────────────────────────────────────────────
async function createRazorpayOrder({ clientCode, amount }) {
  const razorpayKeyId     = process.env.RAZORPAY_KEY_ID;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!razorpayKeyId || !razorpayKeySecret) {
    throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }

  const body = JSON.stringify({
    amount: Math.round(amount * 100), // Razorpay uses paise
    currency: 'INR',
    receipt: `SHK-${Date.now()}`,
    notes: { clientCode },
  });

  const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
  const resp = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
    body,
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Razorpay order creation failed: ${err}`);
  }

  const order = await resp.json();

  // Save to DB
  await prisma.payment.create({
    data: {
      clientCode,
      orderId: order.id,
      amount,
      currency: 'INR',
      purpose: 'WALLET_TOPUP',
      status: 'CREATED',
    },
  });

  return { orderId: order.id, amount, currency: 'INR', keyId: razorpayKeyId };
}

// ── Verify Razorpay payment ────────────────────────────────────────────────
async function verifyPayment({ orderId, paymentId, signature, clientCode }) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const body      = `${orderId}|${paymentId}`;
  const expected  = crypto.createHmac('sha256', keySecret).update(body).digest('hex');

  if (expected !== signature) throw new Error('Payment signature verification failed');

  // Update payment record
  const payment = await prisma.payment.update({
    where: { orderId },
    data: { paymentId, signature, status: 'CAPTURED' },
  });

  // Credit wallet
  const { wallet, txn } = await credit({
    clientCode,
    amount: payment.amount,
    description: `Wallet recharge via Razorpay`,
    refNo: orderId,
    paymentId,
    orderId,
  });

  return { payment, wallet, txn };
}

// ── Get all wallets (admin) ────────────────────────────────────────────────
async function getAllWallets() {
  return prisma.wallet.findMany({
    orderBy: { balance: 'desc' },
    include: { transactions: { take: 1, orderBy: { createdAt: 'desc' } } },
  });
}

module.exports = {
  getWallet, getBalance, getTransactions,
  credit, debit,
  createRazorpayOrder, verifyPayment,
  getAllWallets,
};
