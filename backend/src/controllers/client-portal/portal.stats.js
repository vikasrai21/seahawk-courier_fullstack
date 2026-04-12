'use strict';

const prisma = require('../../config/prisma');
const carrier = require('../../services/carrier.service');
const R = require('../../utils/response');
const { resolveClientCode, parseRange, normaliseAwbs, fmtDate } = require('./shared');

async function stats(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not linked to this account.');

  const { startStr, endStr, range } = parseRange(req.query);
  const baseWhere = { clientCode, date: { gte: startStr, lte: endStr } };
  const statusWhere = (statuses) => ({ ...baseWhere, status: { in: statuses } });

  const [total, booked, inTransit, outForDelivery, delivered, rto, ndr, exception, trendRows, recentShipments] = await Promise.all([
    prisma.shipment.count({ where: baseWhere }),
    prisma.shipment.count({ where: statusWhere(['Booked']) }),
    prisma.shipment.count({ where: statusWhere(['InTransit']) }),
    prisma.shipment.count({ where: statusWhere(['OutForDelivery']) }),
    prisma.shipment.count({ where: statusWhere(['Delivered']) }),
    prisma.shipment.count({ where: statusWhere(['RTO']) }),
    prisma.shipment.count({ where: statusWhere(['NDR']) }),
    prisma.shipment.count({ where: statusWhere(['Delayed', 'NDR', 'RTO']) }),
    prisma.shipment.groupBy({
      by: ['date'],
      where: baseWhere,
      _count: { id: true },
      orderBy: { date: 'asc' },
    }),
    // Fetch the 3 most recently updated shipments for the activity feed
    prisma.shipment.findMany({
      where: { clientCode },
      orderBy: { updatedAt: 'desc' },
      take: 3,
      select: { awb: true, status: true, destination: true, updatedAt: true },
    }),
  ]);

  // Convert recent shipments to activity feed events
  const statusMeta = {
    Delivered:      { icon: '✅', title: 'Shipment Delivered',   color: '#4ade80' },
    NDR:            { icon: '⚠️', title: 'NDR Raised',           color: '#fb923c' },
    RTO:            { icon: '↩️', title: 'Return Initiated',      color: '#f87171' },
    InTransit:      { icon: '🚚', title: 'Shipment In Transit',   color: '#60a5fa' },
    OutForDelivery: { icon: '📦', title: 'Out For Delivery',      color: '#34d399' },
    Delayed:        { icon: '⏳', title: 'Shipment Delayed',      color: '#fbbf24' },
    Booked:         { icon: '📋', title: 'Shipment Booked',       color: '#a78bfa' },
  };
  const now = Date.now();
  const recentActivity = recentShipments.map((s, i) => {
    const meta = statusMeta[s.status] || { icon: '📌', title: `Status: ${s.status}`, color: '#64748b' };
    const diffMs = now - new Date(s.updatedAt).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const time = diffMin < 60
      ? `${diffMin}m ago`
      : diffMin < 1440
        ? `${Math.floor(diffMin / 60)}h ago`
        : `${Math.floor(diffMin / 1440)}d ago`;
    return {
      id: i + 1,
      type: s.status.toLowerCase(),
      icon: meta.icon,
      title: meta.title,
      desc: `AWB ${s.awb}${s.destination ? ` → ${s.destination}` : ''}`,
      time,
      color: meta.color,
    };
  });

  R.ok(res, {
    range: { key: range, from: startStr, to: endStr },
    totals: {
      total,
      booked,
      inTransit,
      outForDelivery,
      delivered,
      rto,
      ndr,
      exception,
      deliveredPct: total > 0 ? Number(((delivered / total) * 100).toFixed(1)) : 0,
    },
    trend: trendRows.map((r) => ({ date: r.date, shipments: r._count.id })),
    recentActivity,
  });
}

async function shipments(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const { startStr, endStr } = parseRange(req.query);
  const { page = 1, limit = 25, search, status, courier } = req.query;
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(200, Math.max(10, parseInt(limit, 10) || 25));
  const skip = (safePage - 1) * safeLimit;
  const where = {
    clientCode,
    date: { gte: startStr, lte: endStr },
    ...(status && { status }),
    ...(courier && { courier }),
    ...(search && {
      OR: [
        { awb: { contains: search, mode: 'insensitive' } },
        { consignee: { contains: search, mode: 'insensitive' } },
        { destination: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [total, shipmentsList] = await Promise.all([
    prisma.shipment.count({ where }),
    prisma.shipment.findMany({ 
      where, 
      orderBy: [{ date: 'desc' }, { id: 'desc' }], 
      skip, 
      take: safeLimit,
      select: {
        id: true,
        date: true,
        awb: true,
        consignee: true,
        destination: true,
        pincode: true,
        weight: true,
        courier: true,
        service: true,
        status: true,
        updatedAt: true
      }
    }),
  ]);

  R.ok(res, { shipments: shipmentsList, pagination: { total, page: safePage, limit: safeLimit }, range: { from: startStr, to: endStr } });
}

async function performance(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const days = [30, 60, 90].includes(parseInt(req.query.days, 10)) ? parseInt(req.query.days, 10) : 30;
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  const startStr = fmtDate(start);
  const endStr = fmtDate(end);

  const rows = await prisma.shipment.findMany({
    where: { clientCode, date: { gte: startStr, lte: endStr } },
    select: { id: true, date: true, status: true },
    orderBy: { date: 'asc' },
  });

  const bucket = new Map();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = fmtDate(d);
    bucket.set(key, { date: key, delivered: 0, rto: 0, failed: 0, booked: 0, total: 0 });
  }

  const summary = { total: rows.length, delivered: 0, rto: 0, failed: 0, booked: 0 };
  for (const row of rows) {
    const item = bucket.get(row.date);
    if (!item) continue;
    item.total += 1;
    if (row.status === 'Delivered') {
      item.delivered += 1;
      summary.delivered += 1;
    } else if (row.status === 'RTO') {
      item.rto += 1;
      summary.rto += 1;
    } else if (['Failed', 'Delayed', 'NDR'].includes(row.status)) {
      item.failed += 1;
      summary.failed += 1;
    } else if (row.status === 'Booked') {
      item.booked += 1;
      summary.booked += 1;
    }
  }

  R.ok(res, {
    days,
    range: { from: startStr, to: endStr },
    summary: { ...summary, successRate: summary.total ? Number(((summary.delivered / summary.total) * 100).toFixed(1)) : 0 },
    series: Array.from(bucket.values()),
  });
}

async function bulkTrack(req, res) {
  const clientCode = await resolveClientCode(req, req.body);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const awbs = normaliseAwbs(req.body?.awbs || req.body?.text).slice(0, 200);
  if (!awbs.length) return R.error(res, 'Provide at least one AWB number', 400);

  const shipmentsList = await prisma.shipment.findMany({
    where: { clientCode, awb: { in: awbs } },
    include: { trackingEvents: { orderBy: { timestamp: 'desc' }, take: 3 } },
  });

  const byAwb = new Map(shipmentsList.map((row) => [row.awb.toUpperCase(), row]));
  const results = awbs.map((awb) => {
    const shipment = byAwb.get(awb);
    if (!shipment) return { awb, found: false, status: 'Not Found' };
    return {
      awb,
      found: true,
      status: shipment.status,
      courier: shipment.courier,
      destination: shipment.destination,
      consignee: shipment.consignee,
      lastUpdatedAt: shipment.updatedAt,
      latestEvent: shipment.trackingEvents?.[0] || null,
    };
  });

  R.ok(res, {
    total: awbs.length,
    found: results.filter((r) => r.found).length,
    missing: results.filter((r) => !r.found).length,
    results,
  });
}

async function syncTracking(req, res) {
  const clientCode = await resolveClientCode(req, req.body);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const { startStr, endStr } = parseRange(req.body || {});
  const maxAwbs = Math.min(100, Math.max(5, parseInt(req.body?.limit, 10) || 25));
  const activeStatuses = ['Booked', 'InTransit', 'OutForDelivery', 'Delayed', 'NDR'];

  const candidates = await prisma.shipment.findMany({
    where: {
      clientCode,
      date: { gte: startStr, lte: endStr },
      status: { in: activeStatuses },
      courier: { not: null },
    },
    select: { awb: true, courier: true },
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
    take: maxAwbs,
  });

  let refreshed = 0;
  let failed = 0;
  for (const s of candidates) {
    try {
      await carrier.syncTrackingEvents(s.courier, s.awb);
      refreshed += 1;
    } catch {
      failed += 1;
    }
  }

  R.ok(res, {
    message: `Refreshed ${refreshed} shipments${failed ? ` (${failed} failed)` : ''}`,
    refreshed,
    failed,
    scanned: candidates.length,
    range: { from: startStr, to: endStr },
  });
}

module.exports = { stats, shipments, performance, bulkTrack, syncTracking };
