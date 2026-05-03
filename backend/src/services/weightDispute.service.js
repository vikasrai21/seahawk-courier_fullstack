'use strict';
const prisma = require('../config/prisma');
const logger = require('../utils/logger');
function toNumber(v) { return v == null ? 0 : typeof v === 'object' ? Number(v.toString()) : Number(v); }

async function autoFlagDiscrepancies(courierInvoiceId) {
  const invoice = await prisma.courierInvoice.findUnique({ where: { id: parseInt(courierInvoiceId) }, include: { items: true } });
  if (!invoice) throw new Error('Courier invoice not found');
  const flagged = [];
  for (const item of invoice.items) {
    const shipment = await prisma.shipment.findFirst({ where: { awb: item.awb }, select: { id: true, awb: true, clientCode: true, courier: true, weight: true, amount: true } });
    if (!shipment) continue;
    const bookedW = toNumber(shipment.weight), billedW = toNumber(item.weight);
    if (billedW <= 0 || bookedW <= 0) continue;
    const pct = ((billedW - bookedW) / bookedW) * 100;
    if (pct > 20) {
      const existing = await prisma.weightDispute.findFirst({ where: { awb: item.awb, status: { not: 'CLOSED' } } });
      if (existing) continue;
      const dispute = await prisma.weightDispute.create({
        data: {
          shipmentId: shipment.id, awb: item.awb, clientCode: shipment.clientCode, courier: shipment.courier || invoice.courier,
          bookedWeight: bookedW, billedWeight: billedW, discrepancyPct: Number(pct.toFixed(2)),
          bookedAmount: toNumber(shipment.amount), billedAmount: toNumber(item.billedAmount),
          overchargeAmount: Math.max(0, toNumber(item.billedAmount) - toNumber(shipment.amount)),
          status: 'OPEN', autoFlagged: true,
        },
      });
      flagged.push(dispute);
    }
  }
  logger.info(`Weight disputes: ${flagged.length} auto-flagged from invoice ${invoice.invoiceNo}`);
  return { invoiceId: courierInvoiceId, flagged: flagged.length, disputes: flagged };
}

async function getDisputes({ clientCode, status, courier, page = 1, limit = 50 } = {}) {
  const where = {};
  if (clientCode) where.clientCode = clientCode;
  if (status) where.status = status;
  if (courier) where.courier = courier;
  const take = Math.min(Number(limit) || 50, 200);
  const skip = (Math.max(1, Number(page)) - 1) * take;
  const [disputes, total] = await Promise.all([
    prisma.weightDispute.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip, include: { client: { select: { company: true } } } }),
    prisma.weightDispute.count({ where }),
  ]);
  return { disputes, pagination: { page: Number(page), limit: take, total } };
}

async function resolveDispute(disputeId, { resolution, resolvedAmount, notes }) {
  return prisma.weightDispute.update({
    where: { id: parseInt(disputeId) },
    data: { status: 'RESOLVED', resolution, resolvedAmount: resolvedAmount ? Number(resolvedAmount) : null, notes, resolvedAt: new Date() },
  });
}

async function getDisputeSummary(clientCode) {
  const base = {};
  if (clientCode) base.clientCode = clientCode;
  const [open, resolved, total] = await Promise.all([
    prisma.weightDispute.aggregate({ where: { ...base, status: 'OPEN' }, _sum: { overchargeAmount: true }, _count: { id: true } }),
    prisma.weightDispute.aggregate({ where: { ...base, status: 'RESOLVED' }, _sum: { resolvedAmount: true }, _count: { id: true } }),
    prisma.weightDispute.aggregate({ where: base, _sum: { overchargeAmount: true }, _count: { id: true } }),
  ]);
  return {
    open: { amount: toNumber(open._sum.overchargeAmount), count: open._count.id },
    resolved: { amount: toNumber(resolved._sum.resolvedAmount), count: resolved._count.id },
    total: { amount: toNumber(total._sum.overchargeAmount), count: total._count.id },
  };
}

module.exports = { autoFlagDiscrepancies, getDisputes, resolveDispute, getDisputeSummary };
