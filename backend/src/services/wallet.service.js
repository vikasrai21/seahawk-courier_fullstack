// wallet.service.js — FIXED: uses Client.walletBalance directly (no separate Wallet model)
'use strict';
const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

function parseAmount(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    throw new AppError('Amount must be a valid positive number.', 400);
  }
  return Number(value.toFixed(2));
}

async function getWallet(clientCode) {
  const client = await prisma.client.findUnique({
    where: { code: clientCode },
    select: { code: true, company: true, walletBalance: true },
  });
  if (!client) throw new Error(`Client not found: ${clientCode}`);
  return client;
}

async function getBalance(clientCode) {
  const client = await getWallet(clientCode);
  return client.walletBalance;
}

async function getTransactions(clientCode, { page = 1, limit = 30 } = {}) {
  const client = await getWallet(clientCode);
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [total, txns] = await prisma.$transaction([
    prisma.walletTransaction.count({ where: { clientCode } }),
    prisma.walletTransaction.findMany({
      where: { clientCode },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
  ]);
  return { wallet: client, txns, total };
}

// ── Credit (recharge / refund) ─────────────────────────────────────────────
async function credit({ clientCode, amount, description, reference, paymentMode, paymentId }) {
  const safeAmount = parseAmount(amount);
  return prisma.$transaction(async (tx) => {
    const updated = await tx.client.update({
      where: { code: clientCode },
      data:  { walletBalance: { increment: safeAmount } },
      select: { code: true, company: true, walletBalance: true },
    });
    const txn = await tx.walletTransaction.create({
      data: {
        clientCode,
        type:        'CREDIT',
        amount:      safeAmount,
        balance:     updated.walletBalance,
        description: description || 'Wallet credit',
        reference:   reference || null,
        paymentMode: paymentMode || null,
        paymentId:   paymentId || null,
        status:      'SUCCESS',
      },
    });
    return { wallet: updated, txn };
  });
}

async function creditShipmentRefund({ clientCode, awb, amount, reason }, db = prisma) {
  const safeAmount = parseAmount(amount);
  const refundPrefix = `Refund — AWB ${awb}`;

  return db.$transaction(async (tx) => {
    const existing = await tx.walletTransaction.findFirst({
      where: {
        clientCode,
        type: 'CREDIT',
        reference: awb || null,
        status: 'SUCCESS',
        description: { startsWith: refundPrefix },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      const wallet = await tx.client.findUnique({
        where: { code: clientCode },
        select: { code: true, company: true, walletBalance: true },
      });
      return { wallet, txn: existing, skipped: true };
    }

    const updated = await tx.client.update({
      where: { code: clientCode },
      data: { walletBalance: { increment: safeAmount } },
      select: { code: true, company: true, walletBalance: true },
    });
    const txn = await tx.walletTransaction.create({
      data: {
        clientCode,
        type: 'CREDIT',
        amount: safeAmount,
        balance: updated.walletBalance,
        description: `${refundPrefix} (${reason})`,
        reference: awb || null,
        paymentMode: 'SYSTEM_REFUND',
        status: 'SUCCESS',
      },
    });
    return { wallet: updated, txn, skipped: false };
  });
}

// ── Debit (pay for shipment) ──────────────────────────────────────────────
async function debit({ clientCode, amount, description, reference }) {
  const safeAmount = parseAmount(amount);
  return prisma.$transaction(async (tx) => {
    const client = await tx.client.findUnique({
      where:  { code: clientCode },
      select: { walletBalance: true },
    });
    if (!client) throw new Error(`Client not found: ${clientCode}`);
    if (client.walletBalance < safeAmount) {
      throw new Error(`Insufficient wallet balance (available: ₹${client.walletBalance.toFixed(2)}, required: ₹${safeAmount.toFixed(2)})`);
    }
    const updated = await tx.client.update({
      where: { code: clientCode },
      data:  { walletBalance: { decrement: safeAmount } },
      select: { code: true, company: true, walletBalance: true },
    });
    const txn = await tx.walletTransaction.create({
      data: {
        clientCode,
        type:        'DEBIT',
        amount:      safeAmount,
        balance:     updated.walletBalance,
        description: description || 'Wallet debit',
        reference:   reference || null,
        status:      'SUCCESS',
      },
    });
    return { wallet: updated, txn };
  });
}

// ── Adjust (admin correction) ─────────────────────────────────────────────
async function adjust({ clientCode, amount, description }) {
  const safeAmount = Number(amount);
  if (!Number.isFinite(safeAmount) || safeAmount === 0) {
    throw new AppError('Adjustment amount must be non-zero.', 400);
  }
  return prisma.$transaction(async (tx) => {
    const updated = await tx.client.update({
      where: { code: clientCode },
      data:  { walletBalance: { increment: safeAmount } }, // negative amount = deduct
      select: { code: true, company: true, walletBalance: true },
    });
    const txn = await tx.walletTransaction.create({
      data: {
        clientCode,
        type:    safeAmount >= 0 ? 'CREDIT' : 'DEBIT',
        amount:  Math.abs(safeAmount),
        balance: updated.walletBalance,
        description,
        paymentMode: 'ADJUSTMENT',
        status:  'SUCCESS',
      },
    });
    return { wallet: updated, txn };
  });
}

module.exports = { getWallet, getBalance, getTransactions, credit, creditShipmentRefund, debit, adjust };
