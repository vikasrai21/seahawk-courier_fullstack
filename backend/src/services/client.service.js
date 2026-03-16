// src/services/client.service.js
const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

async function getAll() {
  return prisma.client.findMany({ orderBy: { code: 'asc' } });
}

async function getByCode(code) {
  const client = await prisma.client.findUnique({ where: { code: code.toUpperCase() } });
  if (!client) throw new AppError('Client not found.', 404);
  return client;
}

async function upsert(data) {
  const code = data.code.toUpperCase();
  return prisma.client.upsert({
    where: { code },
    create: { ...data, code },
    update: { ...data, code },
  });
}

async function remove(code) {
  const shipmentCount = await prisma.shipment.count({ where: { clientCode: code } });
  if (shipmentCount > 0)
    throw new AppError(`Cannot delete: client has ${shipmentCount} shipments. Deactivate instead.`, 400);
  return prisma.client.delete({ where: { code } });
}

async function getClientStats(code) {
  const [client, stats] = await prisma.$transaction([
    prisma.client.findUnique({ where: { code } }),
    prisma.shipment.groupBy({
      by: ['status'],
      where: { clientCode: code },
      _count: { id: true },
      _sum: { amount: true, weight: true },
    }),
  ]);
  if (!client) throw new AppError('Client not found.', 404);

  const totals = stats.reduce((acc, row) => {
    acc.total  += row._count.id;
    acc.amount += row._sum.amount || 0;
    acc.weight += row._sum.weight || 0;
    return acc;
  }, { total: 0, amount: 0, weight: 0 });

  return { client, stats: totals, byStatus: stats };
}

module.exports = { getAll, getByCode, upsert, remove, getClientStats };
