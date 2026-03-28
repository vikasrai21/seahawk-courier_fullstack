'use strict';
const prisma       = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');
const stateMachine = require('./stateMachine');
const walletSvc    = require('./wallet.service');
const notify       = require('./notification.service');
const logger       = require('../utils/logger');
const delhiverySvc = require('./delhivery.service');
const trackonSvc   = require('./trackon.service');
const dtdcSvc      = require('./dtdc.service');

const COURIERS = {
  'Delhivery': delhiverySvc,
  'Trackon': trackonSvc,
  'DTDC': dtdcSvc
};

function buildFilters({ client, courier, status, dateFrom, dateTo, q }) {
  const where = {};
  if (client)  where.clientCode = client;
  if (courier) where.courier = { contains: courier, mode: 'insensitive' };
  if (status)  where.status = status;
  if (dateFrom || dateTo) { where.date = {}; if (dateFrom) where.date.gte = dateFrom; if (dateTo) where.date.lte = dateTo; }
  if (q) { where.OR = [
    { awb: { contains: q, mode: 'insensitive' } },
    { clientCode: { contains: q, mode: 'insensitive' } },
    { consignee: { contains: q, mode: 'insensitive' } },
    { destination: { contains: q, mode: 'insensitive' } },
    { courier: { contains: q, mode: 'insensitive' } },
  ];}
  return where;
}

async function getAll(filters = {}, page = 1, limit = 500) {
  const where = buildFilters(filters);
  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const [total, shipments] = await prisma.$transaction([
    prisma.shipment.count({ where }),
    prisma.shipment.findMany({ where, include: { client: { select: { company: true } }, createdBy: { select: { name: true } } }, orderBy: [{ date: 'desc' }, { id: 'desc' }], skip, take: parseInt(limit) }),
  ]);
  return { shipments, total };
}

async function getById(id) {
  const s = await prisma.shipment.findUnique({
    where: { id: parseInt(id) },
    include: { client: true, createdBy: { select: { name: true } }, updatedBy: { select: { name: true } }, trackingEvents: { orderBy: { timestamp: 'desc' }, take: 20 } },
  });
  if (!s) throw new AppError('Shipment not found.', 404);
  return s;
}

async function create(data, userId) {
  const today = new Date().toISOString().split('T')[0];
  const shipment = await prisma.shipment.create({
    data: { ...data, date: data.date || today, consignee: (data.consignee || '').toUpperCase(), destination: (data.destination || '').toUpperCase(), status: 'Booked', createdById: userId || null, updatedById: userId || null },
    include: { client: { select: { company: true, phone: true } } },
  });
  if (shipment.amount > 0) {
    try { await walletSvc.debit({ clientCode: shipment.clientCode, amount: shipment.amount, description: `Shipment — AWB ${shipment.awb}`, reference: shipment.awb }); }
    catch (e) { logger.warn(`[Wallet] Debit failed for ${shipment.awb}: ${e.message}`); }
  }
  return shipment;
}

async function update(id, data, userId) {
  const u = { ...data, updatedById: userId };
  if (data.consignee)   u.consignee   = data.consignee.toUpperCase();
  if (data.destination) u.destination = data.destination.toUpperCase();
  return prisma.shipment.update({ where: { id: parseInt(id) }, data: u, include: { client: { select: { company: true } } } });
}

async function updateStatus(id, newStatus, userId) {
  const shipment = await getById(id);
  if (stateMachine.assertValidTransition) stateMachine.assertValidTransition(shipment.status, newStatus);

  const updated = await prisma.shipment.update({
    where: { id: parseInt(id) },
    data:  { status: newStatus, updatedById: userId },
    include: { client: { select: { company: true, phone: true, email: true } } },
  });

  // Log tracking event
  try {
    await prisma.trackingEvent.create({ data: { shipmentId: parseInt(id), awb: updated.awb, status: newStatus, description: `Status updated to ${newStatus}`, timestamp: new Date(), source: 'MANUAL' } });
  } catch (e) { logger.warn(`[Tracking] Event log failed: ${e.message}`); }

  // Auto-refund on cancel/RTO
  if (stateMachine.shouldRefund && stateMachine.shouldRefund(newStatus) && shipment.amount > 0) {
    try {
      await walletSvc.credit({ clientCode: shipment.clientCode, amount: shipment.amount, description: `Refund — AWB ${shipment.awb} (${newStatus})`, reference: shipment.awb });
      logger.info(`[Wallet] Refunded ₹${shipment.amount} for ${shipment.awb}`);
    } catch (e) { logger.warn(`[Wallet] Refund failed: ${e.message}`); }
  }

  // ── Fire WhatsApp + email notifications ────────────────────────────────
  try { await notify.notifyStatusChange({ ...updated, status: newStatus }); }
  catch (e) { logger.warn(`[Notify] Status notification failed: ${e.message}`); }

  // POD email on delivery
  if (newStatus === 'Delivered') {
    try { await notify.sendPODEmail(updated, updated.labelUrl); }
    catch (e) { logger.warn(`[Notify] POD email failed: ${e.message}`); }
  }

  return updated;
}

async function remove(id) { return prisma.shipment.delete({ where: { id: parseInt(id) } }); }

async function bulkImport(shipments, userId) {
  const today = new Date().toISOString().split('T')[0];
  let imported = 0, duplicates = 0;
  const errors = [];
  const clientCodes = [...new Set(shipments.map(s => (s.clientCode || 'MISC').toUpperCase()))];
  for (const code of clientCodes) { await prisma.client.upsert({ where: { code }, create: { code, company: code }, update: {} }); }
  for (const s of shipments) {
    if (!s.awb || String(s.awb).trim() === '') { errors.push({ awb: '(empty)', error: 'No AWB' }); continue; }
    const awb = String(s.awb).trim();
    try {
      const existing = await prisma.shipment.findUnique({ where: { awb } });
      if (existing) { duplicates++; continue; }
      await prisma.shipment.create({ data: { awb, clientCode: (s.clientCode || 'MISC').toUpperCase(), date: s.date || today, consignee: String(s.consignee || '').toUpperCase(), destination: String(s.destination || '').toUpperCase(), weight: parseFloat(s.weight) || 0, amount: parseFloat(s.amount) || 0, courier: String(s.courier || ''), department: String(s.department || ''), service: String(s.service || 'Standard'), status: String(s.status || 'Delivered'), remarks: String(s.remarks || ''), createdById: userId || null, updatedById: userId || null } });
      imported++;
    } catch (err) { if (err.code === 'P2002') duplicates++; else errors.push({ awb, error: err.message }); }
  }
  return { imported, duplicates, errors: errors.slice(0, 20) };
}

async function getTodayStats() {
  const today = new Date().toISOString().split('T')[0];
  const [summary, byCourier, recentActivity] = await prisma.$transaction([
    prisma.shipment.groupBy({ by: ['status'], where: { date: today }, _count: { id: true }, _sum: { amount: true, weight: true } }),
    prisma.shipment.groupBy({ by: ['courier'], where: { date: today, courier: { not: '' } }, _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
    prisma.shipment.findMany({ where: { date: today }, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, awb: true, clientCode: true, courier: true, status: true, amount: true, createdAt: true } }),
  ]);
  const totals = summary.reduce((acc, row) => {
    acc.total += row._count.id; acc.amount += row._sum.amount || 0; acc.weight += row._sum.weight || 0;
    if (row.status === 'Delivered') acc.delivered++;
    if (['InTransit','Booked','OutForDelivery'].includes(row.status)) acc.inTransit++;
    return acc;
  }, { total: 0, delivered: 0, inTransit: 0, delayed: 0, amount: 0, weight: 0 });
  return { date: today, ...totals, byCourier, recentActivity };
}

async function getMonthlyStats(year, month) {
  const from = `${year}-${String(month).padStart(2,'0')}-01`;
  const to   = `${year}-${String(month).padStart(2,'0')}-${new Date(year,month,0).getDate()}`;
  return prisma.shipment.findMany({ where: { date: { gte: from, lte: to } }, select: { date: true, clientCode: true, courier: true, status: true, amount: true, weight: true } });
}

// Client-facing: shipments for a specific client (for portal)
async function getMyShipments(clientCode, { page = 1, limit = 25, search, status } = {}) {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = { clientCode, ...(status && { status }), ...(search && { OR: [
    { awb:         { contains: search, mode: 'insensitive' } },
    { consignee:   { contains: search, mode: 'insensitive' } },
    { destination: { contains: search, mode: 'insensitive' } },
  ]}) };
  const [total, shipments] = await prisma.$transaction([
    prisma.shipment.count({ where }),
    prisma.shipment.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit), select: { id: true, awb: true, date: true, consignee: true, destination: true, courier: true, status: true, weight: true, amount: true } }),
  ]);
  return { shipments, pagination: { total, page: parseInt(page), limit: parseInt(limit) } };
}

async function scanAwbAndUpdate(awb, userId, courier = 'Delhivery') {
  let shipment = await prisma.shipment.findUnique({ where: { awb } });
  
  if (!shipment) {
     throw new AppError(`Shipment with AWB ${awb} not found. Please ensure it is synced from Excel first.`, 404);
  }

  const tracker = COURIERS[courier] || COURIERS['Delhivery'];

  const trackingData = await tracker.getTracking(awb);
  if (!trackingData) {
    throw new AppError(`Could not fetch tracking data for AWB ${awb} from ${courier} API. Please check your tracking number or API credentials.`, 400);
  }

  const updateData = { updatedById: userId };
  
  if (trackingData.recipient) updateData.consignee = trackingData.recipient.toUpperCase();
  if (trackingData.destination) updateData.destination = trackingData.destination.toUpperCase();
  if (trackingData.status && trackingData.status !== 'Booked') updateData.status = trackingData.status;
  updateData.courier = courier;

  const updatedShipment = await prisma.shipment.update({
    where: { awb },
    data: updateData,
    include: { client: { select: { company: true } } }
  });

  if (trackingData.status && trackingData.status !== shipment.status) {
    try {
      await prisma.trackingEvent.create({ data: { shipmentId: updatedShipment.id, awb, status: trackingData.status, description: 'Scanned and updated from API', timestamp: new Date(), source: 'API' } });
    } catch (e) { logger.warn(`[Tracking] Event log failed: ${e.message}`); }
  }

  return { shipment: updatedShipment, trackingData };
}

module.exports = { getAll, getById, create, update, updateStatus, remove, bulkImport, getTodayStats, getMonthlyStats, getMyShipments, scanAwbAndUpdate };
