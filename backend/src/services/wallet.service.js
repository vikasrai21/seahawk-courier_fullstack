// wallet.service.js — FIXED: uses Client.walletBalance directly (no separate Wallet model)
'use strict';
const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

function toNumber(val) {
  if (val === null || val === undefined) return 0;
  return typeof val === 'object' ? Number(val.toString()) : Number(val);
}

function parseAmount(amount) {
  const value = toNumber(amount);
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
  return toNumber(client.walletBalance);
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
    const debitResult = await tx.client.updateMany({
      where: {
        code: clientCode,
        walletBalance: { gte: safeAmount },
      },
      data: { walletBalance: { decrement: safeAmount } },
    });

    if (debitResult.count === 0) {
      const client = await tx.client.findUnique({
        where: { code: clientCode },
        select: { walletBalance: true },
      });
      if (!client) throw new Error(`Client not found: ${clientCode}`);
      throw new Error(`Insufficient wallet balance (available: ₹${toNumber(client.walletBalance).toFixed(2)}, required: ₹${safeAmount.toFixed(2)})`);
    }

    const updated = await tx.client.findUnique({
      where: { code: clientCode },
      select: { code: true, company: true, walletBalance: true },
    });
    if (!updated) throw new Error(`Client not found: ${clientCode}`);

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
  const safeAmount = toNumber(amount);
  if (!Number.isFinite(safeAmount) || safeAmount === 0) {
    throw new AppError('Adjustment amount must be non-zero.', 400);
  }
  return prisma.$transaction(async (tx) => {
    // For negative adjustments, guard against resulting negative balance
    if (safeAmount < 0) {
      const absAmount = Math.abs(safeAmount);
      const debitResult = await tx.client.updateMany({
        where: {
          code: clientCode,
          walletBalance: { gte: absAmount },
        },
        data: { walletBalance: { decrement: absAmount } },
      });
      if (debitResult.count === 0) {
        const client = await tx.client.findUnique({
          where: { code: clientCode },
          select: { walletBalance: true },
        });
        if (!client) throw new AppError(`Client not found: ${clientCode}`, 404);
        throw new AppError(`Adjustment would result in negative balance (available: ₹${toNumber(client.walletBalance).toFixed(2)}, adjustment: -₹${absAmount.toFixed(2)})`, 400);
      }
    } else {
      const exists = await tx.client.findUnique({ where: { code: clientCode }, select: { code: true } });
      if (!exists) throw new AppError(`Client not found: ${clientCode}`, 404);
      await tx.client.update({
        where: { code: clientCode },
        data:  { walletBalance: { increment: safeAmount } },
      });
    }
    const updated = await tx.client.findUnique({
      where: { code: clientCode },
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
