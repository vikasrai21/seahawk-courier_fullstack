// src/services/client.service.js
const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

function normalizeClientName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

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
  const normalizedName = normalizeClientName(data.company || data.code);

  if (normalizedName) {
    const existingByName = typeof prisma.client.findFirst === 'function'
      ? await prisma.client.findFirst({
          where: {
            normalizedName,
            NOT: { code },
          },
        })
      : null;

    if (existingByName) {
      return prisma.client.update({
        where: { code: existingByName.code },
        data: {
          contact: existingByName.contact || data.contact || '',
          phone: existingByName.phone || data.phone || '',
          whatsapp: existingByName.whatsapp || data.whatsapp || '',
          email: existingByName.email || data.email || '',
          gst: existingByName.gst || data.gst || '',
          address: existingByName.address || data.address || '',
          notes: [existingByName.notes, data.notes].filter(Boolean).join('\n').slice(0, 4000),
          active: data.active ?? existingByName.active,
          notificationConfig: existingByName.notificationConfig || data.notificationConfig || undefined,
          normalizedName,
        },
      });
    }
  }

  return prisma.client.upsert({
    where: { code },
    create: { ...data, code, normalizedName },
    update: { ...data, code, normalizedName },
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

module.exports = { getAll, getByCode, upsert, remove, getClientStats, normalizeClientName };
