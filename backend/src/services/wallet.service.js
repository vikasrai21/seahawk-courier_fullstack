// wallet.service.js — FIXED: uses Client.walletBalance directly (no separate Wallet model)
'use strict';
const prisma = require('../config/prisma');

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
  return prisma.$transaction(async (tx) => {
    const updated = await tx.client.update({
      where: { code: clientCode },
      data:  { walletBalance: { increment: amount } },
      select: { code: true, company: true, walletBalance: true },
    });
    const txn = await tx.walletTransaction.create({
      data: {
        clientCode,
        type:        'CREDIT',
        amount,
        balance:     updated.walletBalance,
        description,
        reference:   reference || null,
        paymentMode: paymentMode || null,
        paymentId:   paymentId || null,
        status:      'SUCCESS',
      },
    });
    return { wallet: updated, txn };
  });
}

// ── Debit (pay for shipment) ──────────────────────────────────────────────
async function debit({ clientCode, amount, description, reference }) {
  return prisma.$transaction(async (tx) => {
    const client = await tx.client.findUnique({
      where:  { code: clientCode },
      select: { walletBalance: true },
    });
    if (!client) throw new Error(`Client not found: ${clientCode}`);
    if (client.walletBalance < amount) {
      throw new Error(`Insufficient wallet balance (available: ₹${client.walletBalance.toFixed(2)}, required: ₹${amount.toFixed(2)})`);
    }
    const updated = await tx.client.update({
      where: { code: clientCode },
      data:  { walletBalance: { decrement: amount } },
      select: { code: true, company: true, walletBalance: true },
    });
    const txn = await tx.walletTransaction.create({
      data: {
        clientCode,
        type:        'DEBIT',
        amount,
        balance:     updated.walletBalance,
        description,
        reference:   reference || null,
        status:      'SUCCESS',
      },
    });
    return { wallet: updated, txn };
  });
}

// ── Adjust (admin correction) ─────────────────────────────────────────────
async function adjust({ clientCode, amount, description }) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.client.update({
      where: { code: clientCode },
      data:  { walletBalance: { increment: amount } }, // negative amount = deduct
      select: { code: true, company: true, walletBalance: true },
    });
    const txn = await tx.walletTransaction.create({
      data: {
        clientCode,
        type:    amount >= 0 ? 'CREDIT' : 'DEBIT',
        amount:  Math.abs(amount),
        balance: updated.walletBalance,
        description,
        status:  'SUCCESS',
      },
    });
    return { wallet: updated, txn };
  });
}

module.exports = { getWallet, getBalance, getTransactions, credit, debit, adjust };
