'use strict';

const prisma = require('../../config/prisma');
const carrier = require('../../services/carrier.service');
const R = require('../../utils/response');
const cache = require('../../utils/cache');
const logger = require('../../utils/logger');
const { resolveClientCode, parseRange, normaliseAwbs, fmtDate } = require('./shared');

function portalHandler(name, fn) {
  return async (req, res) => {
    try {
      return await fn(req, res);
    } catch (err) {
      logger.error(`Client portal ${name} failed`, {
        requestId: req.requestId,
        userId: req.user?.id,
        message: err.message,
        code: err.code,
      });
      return R.error(res, 'Client portal data is temporarily unavailable. Please try again.', 500);
    }
  };
}

async function stats(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not linked to this account.');

  const { startStr, endStr, range } = parseRange(req.query);
  const baseWhere = { clientCode, date: { gte: startStr, lte: endStr } };

  const cacheKey = `portal:stats:${clientCode}:${startStr}:${endStr}`;
  const cached = await cache.get(cacheKey);
  if (cached) return R.ok(res, cached);

  const [statusGroups, trendRows, recentShipments] = await Promise.all([
    prisma.shipment.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: { id: true },
    }),
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

  let total = 0, booked = 0, inTransit = 0, outForDelivery = 0;
  let delivered = 0, rto = 0, ndr = 0, delayed = 0;

  for (const group of statusGroups) {
    const count = group._count.id;
    total += count;
    if (group.status === 'Booked') booked += count;
    else if (group.status === 'InTransit') inTransit += count;
    else if (group.status === 'OutForDelivery') outForDelivery += count;
    else if (group.status === 'Delivered') delivered += count;
    else if (group.status === 'RTO') rto += count;
    else if (group.status === 'NDR') ndr += count;
    else if (group.status === 'Delayed') delayed += count;
  }
  const exception = delayed + ndr + rto;

  const otifWindowRows = await prisma.shipment.findMany({
    where: baseWhere,
    select: { status: true, date: true, service: true },
    take: 800,
    orderBy: { date: 'desc' },
  });

  const slaDaysFor = (service) => {
    const s = String(service || '').toLowerCase();
    if (s.includes('express')) return 2;
    if (s.includes('priority')) return 3;
    if (s.includes('standard')) return 4;
    return 5;
  };
  const nowEpoch = Date.now();
  const deliveredRows = otifWindowRows.filter((r) => r.status === 'Delivered');
  const deliveredOnTime = deliveredRows.filter((r) => {
    const ageDays = Math.max(0, Math.round((nowEpoch - new Date(r.date).getTime()) / 86400000));
    return ageDays <= slaDaysFor(r.service);
  }).length;
  const otif = deliveredRows.length ? Number(((deliveredOnTime / deliveredRows.length) * 100).toFixed(1)) : 100;
  const firstAttempt = otifWindowRows.length
    ? Number(((otifWindowRows.filter((r) => r.status === 'Delivered').length / otifWindowRows.length) * 100).toFixed(1))
    : 100;

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
  const recentActivity = recentShipments.map((s, i) => {
    const meta = statusMeta[s.status] || { icon: '📌', title: `Status: ${s.status}`, color: '#64748b' };
    const diffMs = nowEpoch - new Date(s.updatedAt).getTime();
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

  const staleThresholdDate = new Date();
  staleThresholdDate.setDate(staleThresholdDate.getDate() - 3);
  const [pendingNdrCount, staleNdrCount, escalatedNdrCount] = await Promise.all([
    prisma.nDREvent.count({
      where: {
        action: 'PENDING',
        shipment: { clientCode },
      },
    }),
    prisma.nDREvent.count({
      where: {
        action: 'PENDING',
        createdAt: { lt: staleThresholdDate },
        shipment: { clientCode },
      },
    }),
    prisma.nDREvent.count({
      where: {
        action: 'ESCALATED',
        shipment: { clientCode },
      },
    }),
  ]);

  const responsePayload = {
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
      otif,
      firstAttemptDelivery: firstAttempt,
      exceptionSignals: {
        pendingNdr: pendingNdrCount,
        staleNdr: staleNdrCount,
        escalatedNdr: escalatedNdrCount,
      },
    },
    trend: trendRows.map((r) => ({ date: r.date, shipments: r._count.id })),
    recentActivity,
  };
  await cache.set(cacheKey, responsePayload, 120);
  R.ok(res, responsePayload);
}


function slaDaysFor(service) {
  const s = String(service || '').toLowerCase();
  if (s.includes('express')) return 2;
  if (s.includes('priority')) return 3;
  if (s.includes('standard')) return 4;
  return 5;
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
        courier: true,
        service: true,
        status: true,
        updatedAt: true
      }
    }),
  ]);

  const enrichedShipments = shipmentsList.map(s => {
    const sla = slaDaysFor(s.service);
    const d = new Date(s.date);
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() + sla);
      return { ...s, eta: d.toISOString().split('T')[0] };
    }
    return s;
  });
  R.ok(res, { shipments: enrichedShipments, pagination: { total, page: safePage, limit: safeLimit }, range: { from: startStr, to: endStr } });
}

async function shipmentDetail(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const shipmentId = Math.max(1, parseInt(req.params.id, 10) || 0);
  const shipment = await prisma.shipment.findFirst({
    where: { id: shipmentId, clientCode },
    select: {
      id: true,
      date: true,
      awb: true,
      consignee: true,
      destination: true,
      pincode: true,
      courier: true,
      service: true,
      status: true,
      trackingEvents: {
        orderBy: { timestamp: 'desc' },
        take: 20,
        select: {
          id: true,
          status: true,
          location: true,
          description: true,
          timestamp: true,
        },
      },
    },
  });

  if (!shipment) return R.notFound(res, 'Shipment not found.');
  const sla = slaDaysFor(shipment.service);
  const d = new Date(shipment.date);
  if (!isNaN(d.getTime())) {
    d.setDate(d.getDate() + sla);
    shipment.eta = d.toISOString().split('T')[0];
  }
  R.ok(res, shipment);
}

async function trackingDetail(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const awb = String(req.params.awb || '').trim().toUpperCase();
  if (!awb) return R.badRequest(res, 'AWB is required.');

  const shipment = await prisma.shipment.findFirst({
    where: { awb, clientCode },
    select: {
      id: true,
      awb: true,
      consignee: true,
      destination: true,
      pincode: true,
      courier: true,
      service: true,
      status: true,
      date: true,
      trackingEvents: {
        orderBy: { timestamp: 'desc' },
        select: {
          id: true,
          status: true,
          location: true,
          description: true,
          timestamp: true,
          source: true,
        },
      },
      ndrEvents: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          reason: true,
          action: true,
          createdAt: true,
          newAddress: true,
        },
      },
    },
  });

  if (!shipment) return R.notFound(res, 'Shipment not found.');
  R.ok(res, {
    shipment: {
      id: shipment.id,
      awb: shipment.awb,
      consignee: shipment.consignee,
      destination: shipment.destination,
      pincode: shipment.pincode,
      courier: shipment.courier,
      service: shipment.service,
      status: shipment.status,
      date: shipment.date,
    },
    events: shipment.trackingEvents,
    ndrs: shipment.ndrEvents,
  });
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
    select: { id: true, awb: true, courier: true },
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
    take: maxAwbs,
  });

  let refreshed = 0;
  let failed = 0;
  for (const s of candidates) {
    try {
      await carrier.syncTrackingEvents(s.id, s.awb, s.courier);
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

module.exports = {
  stats: portalHandler('stats', stats),
  shipments: portalHandler('shipments', shipments),
  shipmentDetail: portalHandler('shipmentDetail', shipmentDetail),
  trackingDetail: portalHandler('trackingDetail', trackingDetail),
  performance: portalHandler('performance', performance),
  bulkTrack: portalHandler('bulkTrack', bulkTrack),
  syncTracking: portalHandler('syncTracking', syncTracking),
};


exports.exportShipments = async (req, res) => {
  const code = await resolveClientCode(req);
  const { range = '90d', status, search } = req.query;
  const { startStr: startDate, endStr: endDate } = parseRange({ range });

  const baseWhere = {
    clientCode: code,
    date: { gte: startDate, lte: endDate },
  };

  if (status) baseWhere.status = status;
  if (search) {
    baseWhere.OR = [
      { awb: { contains: search, mode: 'insensitive' } },
      { consignee: { contains: search, mode: 'insensitive' } },
      { destination: { contains: search, mode: 'insensitive' } },
    ];
  }

  const shipments = await prisma.shipment.findMany({
    where: baseWhere,
    orderBy: { date: 'desc' },
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=client_shipments.csv');
  const headers = ['Date', 'AWB', 'Consignee', 'Destination', 'Courier', 'Weight', 'Amount', 'Status'];
  const csvRows = [headers.join(',')];
  for (const s of shipments) {
    csvRows.push([
      `"${s.date || ''}"`,
      `"${s.awb || ''}"`,
      `"${(s.consignee || '').replace(/"/g, '""')}"`,
      `"${(s.destination || '').replace(/"/g, '""')}"`,
      `"${s.courier || ''}"`,
      s.weight || 0,
      s.amount || 0,
      `"${s.status || ''}"`,
    ].join(','));
  }
  res.send(csvRows.join('\n'));
};
