// src/services/shipment.service.js
const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

function buildFilters({ client, courier, status, dateFrom, dateTo, q }) {
  const where = {};
  if (client)  where.clientCode = client;
  if (courier) where.courier = { contains: courier, mode: 'insensitive' };
  if (status)  where.status = status;
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = dateFrom;
    if (dateTo)   where.date.lte = dateTo;
  }
  if (q) {
    where.OR = [
      { awb:         { contains: q, mode: 'insensitive' } },
      { clientCode:  { contains: q, mode: 'insensitive' } },
      { consignee:   { contains: q, mode: 'insensitive' } },
      { destination: { contains: q, mode: 'insensitive' } },
      { courier:     { contains: q, mode: 'insensitive' } },
    ];
  }
  return where;
}

async function getAll(filters = {}, page = 1, limit = 500) {
  const where = buildFilters(filters);
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [total, shipments] = await prisma.$transaction([
    prisma.shipment.count({ where }),
    prisma.shipment.findMany({
      where,
      include: { client: { select: { company: true } }, createdBy: { select: { name: true } } },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      skip,
      take: parseInt(limit),
    }),
  ]);
  return { shipments, total };
}

async function getById(id) {
  const s = await prisma.shipment.findUnique({
    where: { id: parseInt(id) },
    include: { client: true, createdBy: { select: { name: true } }, updatedBy: { select: { name: true } } },
  });
  if (!s) throw new AppError('Shipment not found.', 404);
  return s;
}

async function create(data, userId) {
  const today = new Date().toISOString().split('T')[0];
  return prisma.shipment.create({
    data: {
      ...data,
      date: data.date || today,
      consignee:   (data.consignee   || '').toUpperCase(),
      destination: (data.destination || '').toUpperCase(),
      createdById: userId || null,
      updatedById: userId || null,
    },
    include: { client: { select: { company: true } } },
  });
}

async function update(id, data, userId) {
  const update = { ...data, updatedById: userId };
  if (data.consignee)   update.consignee   = data.consignee.toUpperCase();
  if (data.destination) update.destination = data.destination.toUpperCase();

  const s = await prisma.shipment.update({
    where: { id: parseInt(id) },
    data: update,
    include: { client: { select: { company: true } } },
  });
  return s;
}

async function updateStatus(id, status, userId) {
  return prisma.shipment.update({
    where: { id: parseInt(id) },
    data: { status, updatedById: userId },
  });
}

async function remove(id) {
  return prisma.shipment.delete({ where: { id: parseInt(id) } });
}

async function bulkImport(shipments, userId) {
  const today = new Date().toISOString().split('T')[0];
  let imported = 0, duplicates = 0;
  const errors = [];

  // Collect all unique client codes and auto-create any that don't exist
  const clientCodes = [...new Set(shipments.map(s => (s.clientCode || 'MISC').toUpperCase()))];
  for (const code of clientCodes) {
    await prisma.client.upsert({
      where:  { code },
      create: { code, company: code }, // Minimal record — update company name later in Clients page
      update: {},
    });
  }

  for (const s of shipments) {
    // Skip rows with no AWB
    if (!s.awb || String(s.awb).trim() === '') {
      errors.push({ awb: '(empty)', error: 'Skipped — no AWB number' });
      continue;
    }

    const awb        = String(s.awb).trim();
    const clientCode = (s.clientCode || 'MISC').toUpperCase();
    const date       = s.date || today;

    try {
      const existing = await prisma.shipment.findUnique({ where: { awb } });
      if (existing) { duplicates++; continue; }

      await prisma.shipment.create({
        data: {
          awb,
          clientCode,
          date,
          consignee:   String(s.consignee   || '').toUpperCase(),
          destination: String(s.destination || '').toUpperCase(),
          weight:      parseFloat(s.weight)  || 0,
          amount:      parseFloat(s.amount)  || 0,
          courier:     String(s.courier     || ''),
          department:  String(s.department  || ''),
          service:     String(s.service     || 'Standard'),
          status:      String(s.status      || 'Delivered'),
          remarks:     String(s.remarks     || ''),
          createdById: userId || null,
          updatedById: userId || null,
        },
      });
      imported++;
    } catch (err) {
      if (err.code === 'P2002') {
        duplicates++;
      } else {
        errors.push({ awb, error: err.message });
      }
    }
  }

  return { imported, duplicates, errors: errors.slice(0, 20) };
}

async function getTodayStats() {
  const today = new Date().toISOString().split('T')[0];

  const [summary, byCourier, recentActivity] = await prisma.$transaction([
    prisma.shipment.groupBy({
      by: ['status'],
      where: { date: today },
      _count: { id: true },
      _sum: { amount: true, weight: true },
    }),
    prisma.shipment.groupBy({
      by: ['courier'],
      where: { date: today, courier: { not: '' } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.shipment.findMany({
      where: { date: today },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, awb: true, clientCode: true, courier: true, status: true, amount: true, createdAt: true },
    }),
  ]);

  const totals = summary.reduce((acc, row) => {
    acc.total     += row._count.id;
    acc.amount    += row._sum.amount || 0;
    acc.weight    += row._sum.weight || 0;
    if (row.status === 'Delivered')                             acc.delivered++;
    if (['InTransit','Booked','OutForDelivery'].includes(row.status)) acc.inTransit++;
    if (['Delayed','RTO'].includes(row.status))                 acc.delayed++;
    return acc;
  }, { total: 0, delivered: 0, inTransit: 0, delayed: 0, amount: 0, weight: 0 });

  return { date: today, ...totals, byCourier, recentActivity };
}

async function getMonthlyStats(year, month) {
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const end  = new Date(year, month, 0).getDate();
  const to   = `${year}-${String(month).padStart(2, '0')}-${end}`;

  const rows = await prisma.shipment.findMany({
    where: { date: { gte: from, lte: to } },
    select: { date: true, clientCode: true, courier: true, status: true, amount: true, weight: true },
  });
  return rows;
}

module.exports = { getAll, getById, create, update, updateStatus, remove, bulkImport, getTodayStats, getMonthlyStats };
