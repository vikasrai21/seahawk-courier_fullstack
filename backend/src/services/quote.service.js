// src/services/quote.service.js
const prisma = require('../config/prisma');

async function generateQuoteNo(db = prisma) {
  const year = new Date().getFullYear();
  const prefix = `SH-Q-${year}-`;
  const last = await db.quote.findFirst({
    where: { quoteNo: { startsWith: prefix } },
    orderBy: { createdAt: 'desc' },
  });
  const seq = last ? parseInt(last.quoteNo.split('-').pop()) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

async function createQuote(data, userId, db = prisma) {
  const quoteNo = await generateQuoteNo(db);
  const validUntil = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  return db.quote.create({
    data: { ...data, quoteNo, validUntil, createdById: userId || null },
    include: { client: { select: { company: true, code: true } }, createdBy: { select: { name: true } } },
  });
}

async function listQuotes({ clientCode, status, courier, fromDate, toDate, page = 1, limit = 50 }, db = prisma) {
  const where = {};
  if (clientCode) where.clientCode = clientCode;
  if (status) where.status = status;
  if (courier) where.courier = { contains: courier, mode: 'insensitive' };
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = new Date(fromDate);
    if (toDate) where.createdAt.lte = new Date(toDate + 'T23:59:59Z');
  }
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [total, data] = await Promise.all([
    db.quote.count({ where }),
    db.quote.findMany({
      where, skip, take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { company: true } } },
    }),
  ]);
  return { total, data, page: parseInt(page), limit: parseInt(limit) };
}

async function updateQuoteStatus(id, status, db = prisma) {
  return db.quote.update({ where: { id: parseInt(id) }, data: { status } });
}

async function getQuoteStats(db = prisma) {
  const [total, byStatus, topCouriers, avgMargin, last30] = await Promise.all([
    db.quote.count(),
    db.quote.groupBy({ by: ['status'], _count: { id: true } }),
    db.quote.groupBy({
      by: ['courier'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 5,
    }),
    db.quote.aggregate({ _avg: { margin: true, profit: true } }),
    db.quote.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
    }),
  ]);

  const conversionRate = (() => {
    const booked = byStatus.find(s => s.status === 'BOOKED')?._count?.id || 0;
    return total > 0 ? rnd((booked / total) * 100) : 0;
  })();

  return {
    total, last30, conversionRate,
    byStatus: byStatus.reduce((acc, s) => { acc[s.status] = s._count.id; return acc; }, {}),
    topCouriers: topCouriers.map(c => ({ courier: c.courier, count: c._count.id })),
    avgMargin: rnd(avgMargin._avg.margin || 0),
    avgProfit: rnd(avgMargin._avg.profit || 0),
  };
}

function rnd(n) { return Math.round(n * 100) / 100; }

module.exports = { createQuote, listQuotes, updateQuoteStatus, getQuoteStats };
