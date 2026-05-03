'use strict';
const prisma = require('../config/prisma');
const logger = require('../utils/logger');

function toNumber(val) {
  if (val === null || val === undefined) return 0;
  return typeof val === 'object' ? Number(val.toString()) : Number(val);
}

async function getCODShipments({ clientCode, status, dateFrom, dateTo, page = 1, limit = 50 } = {}) {
  const where = { codAmount: { gt: 0 } };
  if (clientCode) where.clientCode = clientCode;
  if (status) where.codStatus = status;
  if (dateFrom || dateTo) { where.date = {}; if (dateFrom) where.date.gte = dateFrom; if (dateTo) where.date.lte = dateTo; }
  const take = Math.min(Number(limit) || 50, 200);
  const skip = (Math.max(1, Number(page)) - 1) * take;
  const [shipments, total, summary] = await Promise.all([
    prisma.shipment.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip, include: { client: { select: { company: true } } } }),
    prisma.shipment.count({ where }),
    prisma.shipment.aggregate({ where, _sum: { codAmount: true }, _count: { id: true } }),
  ]);
  return { shipments, total, pagination: { page: Number(page), limit: take, total }, summary: { totalCOD: toNumber(summary._sum.codAmount), shipmentCount: summary._count.id } };
}

async function createRemittance({ clientCode, courier, shipmentIds, notes } = {}) {
  const shipments = await prisma.shipment.findMany({
    where: { id: { in: shipmentIds.map(Number) }, codAmount: { gt: 0 }, codStatus: { not: 'REMITTED' } },
    select: { id: true, codAmount: true },
  });
  if (!shipments.length) throw new Error('No eligible COD shipments found');
  const totalAmount = shipments.reduce((sum, s) => sum + toNumber(s.codAmount), 0);
  const remittanceNo = `COD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  return prisma.$transaction(async (tx) => {
    const rem = await tx.cODRemittance.create({
      data: { remittanceNo, clientCode, courier: courier || 'MIXED', totalAmount, shipmentCount: shipments.length, status: 'PENDING', netAmount: totalAmount, notes },
    });
    await tx.shipment.updateMany({ where: { id: { in: shipments.map(s => s.id) } }, data: { codStatus: 'PENDING_REMITTANCE', codRemittanceId: rem.id } });
    logger.info(`COD Remittance ${remittanceNo} created: ${totalAmount}`);
    return rem;
  });
}

async function updateRemittanceStatus(remittanceId, data) {
  const rem = await prisma.cODRemittance.findUnique({ where: { id: parseInt(remittanceId) } });
  if (!rem) throw new Error('Remittance not found');
  const update = { status: data.status };
  if (data.utrNumber) update.utrNumber = data.utrNumber;
  if (data.bankReference) update.bankReference = data.bankReference;
  if (data.actualRemitDate) update.actualRemitDate = data.actualRemitDate;
  if (data.notes) update.notes = data.notes;
  if (data.deductions !== undefined) { update.deductions = Number(data.deductions); update.netAmount = toNumber(rem.totalAmount) - Number(data.deductions); }
  if (data.status === 'COLLECTED') update.collectedDate = new Date().toISOString().split('T')[0];
  return prisma.$transaction(async (tx) => {
    const result = await tx.cODRemittance.update({ where: { id: parseInt(remittanceId) }, data: update });
    const codStatus = data.status === 'REMITTED' ? 'REMITTED' : data.status === 'COLLECTED' ? 'COLLECTED' : null;
    if (codStatus) await tx.shipment.updateMany({ where: { codRemittanceId: parseInt(remittanceId) }, data: { codStatus } });
    return result;
  });
}

async function getRemittances({ clientCode, status, page = 1, limit = 30 } = {}) {
  const where = {};
  if (clientCode) where.clientCode = clientCode;
  if (status) where.status = status;
  const take = Math.min(Number(limit) || 30, 100);
  const skip = (Math.max(1, Number(page)) - 1) * take;
  const [remittances, total] = await Promise.all([
    prisma.cODRemittance.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip, include: { client: { select: { company: true } } } }),
    prisma.cODRemittance.count({ where }),
  ]);
  return { remittances, pagination: { page: Number(page), limit: take, total } };
}

async function getCODSummary(clientCode) {
  const base = { codAmount: { gt: 0 } };
  if (clientCode) base.clientCode = clientCode;
  const [pending, collected, remitted, total] = await Promise.all([
    prisma.shipment.aggregate({ where: { ...base, codStatus: { in: [null, 'PENDING', 'PENDING_REMITTANCE'] } }, _sum: { codAmount: true }, _count: { id: true } }),
    prisma.shipment.aggregate({ where: { ...base, codStatus: 'COLLECTED' }, _sum: { codAmount: true }, _count: { id: true } }),
    prisma.shipment.aggregate({ where: { ...base, codStatus: 'REMITTED' }, _sum: { codAmount: true }, _count: { id: true } }),
    prisma.shipment.aggregate({ where: base, _sum: { codAmount: true }, _count: { id: true } }),
  ]);
  return {
    pending: { amount: toNumber(pending._sum.codAmount), count: pending._count.id },
    collected: { amount: toNumber(collected._sum.codAmount), count: collected._count.id },
    remitted: { amount: toNumber(remitted._sum.codAmount), count: remitted._count.id },
    total: { amount: toNumber(total._sum.codAmount), count: total._count.id },
  };
}

module.exports = { getCODShipments, createRemittance, updateRemittanceStatus, getRemittances, getCODSummary };
