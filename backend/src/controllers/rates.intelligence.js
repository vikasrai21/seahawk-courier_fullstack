'use strict';

const prisma = require('../config/prisma');
const R = require('../utils/response');

const FINAL_STATUSES = new Set(['Delivered', 'RTO', 'Cancelled']);

function toDays(ms) {
  return Math.max(0, Math.round(ms / 86400000));
}

function toHours(ms) {
  return Math.max(0, Math.round(ms / 3600000));
}

function slaDaysFor(service) {
  const s = String(service || '').toLowerCase();
  if (s.includes('express')) return 2;
  if (s.includes('priority')) return 3;
  if (s.includes('standard')) return 4;
  return 5;
}

function buildFlags({ status, ageDays, idleHours, slaDays }) {
  const flags = [];
  if (!FINAL_STATUSES.has(status) && ageDays > slaDays) flags.push('SLA_BREACH');
  if (['InTransit', 'OutForDelivery', 'Delayed', 'NDR'].includes(status) && idleHours >= 48) {
    flags.push('STUCK_IN_SCAN');
  }
  return flags;
}

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

function normalizeCourier(value) {
  return String(value || '').trim().toLowerCase();
}

async function intelligence(req, res) {
  const days = Math.min(365, Math.max(7, parseInt(req.query?.days, 10) || 90));
  const end = new Date();
  const start = new Date(Date.now() - days * 86400000);
  const startStr = toDateStr(start);
  const endStr = toDateStr(end);

  const pincode = String(req.query?.pincode || '').trim();
  const destination = String(req.query?.destination || '').trim();
  const courier = String(req.query?.courier || '').trim();

  const where = { date: { gte: startStr, lte: endStr } };
  if (pincode) where.pincode = pincode;
  if (destination) where.destination = { contains: destination, mode: 'insensitive' };
  if (courier) where.courier = { contains: courier, mode: 'insensitive' };

  const rows = await prisma.shipment.findMany({
    where,
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    take: 2000,
    include: { trackingEvents: { orderBy: { timestamp: 'desc' }, take: 1 } },
  });

  const now = Date.now();
  let deliveredCount = 0;
  let rtoCount = 0;
  let ndrCount = 0;
  let slaBreachCount = 0;
  let stuckCount = 0;
  let transitSum = 0;

  const byCourier = new Map();

  rows.forEach((row) => {
    const lastScanAt = row.trackingEvents?.[0]?.timestamp || row.updatedAt || row.date;
    const ageDays = toDays(now - new Date(row.date).getTime());
    const idleHours = toHours(now - new Date(lastScanAt).getTime());
    const slaDays = slaDaysFor(row.service);
    const flags = buildFlags({ status: row.status, ageDays, idleHours, slaDays });

    if (flags.includes('SLA_BREACH')) slaBreachCount += 1;
    if (flags.includes('STUCK_IN_SCAN')) stuckCount += 1;
    if (row.status === 'RTO') rtoCount += 1;
    if (row.status === 'NDR' || row.ndrStatus) ndrCount += 1;
    if (row.status === 'Delivered') {
      deliveredCount += 1;
      transitSum += toDays(new Date(lastScanAt).getTime() - new Date(row.date).getTime());
    }

    const key = normalizeCourier(row.courier);
    if (!key) return;
    const current = byCourier.get(key) || {
      courier: row.courier,
      shipments: 0,
      delivered: 0,
      rto: 0,
      ndr: 0,
      slaBreach: 0,
      stuck: 0,
      transitSum: 0,
    };
    current.shipments += 1;
    if (row.status === 'Delivered') {
      current.delivered += 1;
      current.transitSum += toDays(new Date(lastScanAt).getTime() - new Date(row.date).getTime());
    }
    if (row.status === 'RTO') current.rto += 1;
    if (row.status === 'NDR' || row.ndrStatus) current.ndr += 1;
    if (flags.includes('SLA_BREACH')) current.slaBreach += 1;
    if (flags.includes('STUCK_IN_SCAN')) current.stuck += 1;
    byCourier.set(key, current);
  });

  const total = rows.length;
  const totals = {
    shipments: total,
    delivered: deliveredCount,
    avgTransitDays: deliveredCount ? Math.round((transitSum / deliveredCount) * 10) / 10 : null,
    rtoRate: total ? Math.round((rtoCount / total) * 1000) / 1000 : 0,
    ndrRate: total ? Math.round((ndrCount / total) * 1000) / 1000 : 0,
    slaBreachRate: total ? Math.round((slaBreachCount / total) * 1000) / 1000 : 0,
    stuckRate: total ? Math.round((stuckCount / total) * 1000) / 1000 : 0,
  };

  const courierStats = [...byCourier.values()].map((c) => ({
    courier: c.courier,
    shipments: c.shipments,
    delivered: c.delivered,
    avgTransitDays: c.delivered ? Math.round((c.transitSum / c.delivered) * 10) / 10 : null,
    rtoRate: c.shipments ? Math.round((c.rto / c.shipments) * 1000) / 1000 : 0,
    ndrRate: c.shipments ? Math.round((c.ndr / c.shipments) * 1000) / 1000 : 0,
    slaBreachRate: c.shipments ? Math.round((c.slaBreach / c.shipments) * 1000) / 1000 : 0,
    stuckRate: c.shipments ? Math.round((c.stuck / c.shipments) * 1000) / 1000 : 0,
  }));

  R.ok(res, { range: { from: startStr, to: endStr }, totals, byCourier: courierStats });
}

module.exports = { intelligence };
