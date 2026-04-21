'use strict';

const prisma = require('../../config/prisma');

async function getClientCode(userId) {
  const cu = await prisma.clientUser.findUnique({ where: { userId }, select: { clientCode: true } });
  return cu?.clientCode;
}

async function resolveClientCode(req, source = req.query) {
  if (req.user.isOwner || req.user.role === 'ADMIN') return String(source?.clientCode || '').trim() || null;
  return req.user.clientCode || await getClientCode(req.user.id);
}

function normaliseAwbs(input) {
  const values = Array.isArray(input)
    ? input
    : String(input || '').split(/[\s,;\n\r\t]+/);
  return [...new Set(values.map((v) => String(v || '').trim().toUpperCase()).filter(Boolean))];
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

function monthKey(date) {
  return String(date || '').slice(0, 7);
}

function parseRange(query) {
  const today = new Date();
  const end = new Date(today);
  const start = new Date(today);

  const range = String(query.range || '30d').toLowerCase();
  if (range === 'today') {
    // no-op
  } else if (range === '7d') {
    start.setDate(start.getDate() - 6);
  } else if (range === 'this_month') {
    start.setDate(1);
  } else if (range === 'custom' && query.date_from && query.date_to) {
    return { startStr: String(query.date_from), endStr: String(query.date_to), range };
  } else {
    start.setDate(start.getDate() - 29);
  }

  return { startStr: fmtDate(start), endStr: fmtDate(end), range };
}

function enrichWalletReceipt(txn) {
  const amount = Number(txn.amount || 0);
  const gstPercent = 18;
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

module.exports = {
  getClientCode,
  resolveClientCode,
  normaliseAwbs,
  fmtDate,
  monthKey,
  parseRange,
  enrichWalletReceipt,
};
