// src/routes/client-portal.routes.js — Client self-service endpoints
'use strict';
const router  = require('express').Router();
const prisma  = require('../config/prisma');
const { protect, requireRole } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/errorHandler');
const carrier = require('../services/carrier.service');
const notify = require('../services/notification.service');
const pdf = require('../services/pdf.service');
const contractSvc = require('../services/contract.service');
const shipmentSvc = require('../services/shipment.service');
const R = require('../utils/response');

const clientOnly = requireRole('CLIENT', 'ADMIN');

// Helper: get clientCode for logged-in CLIENT user
async function getClientCode(userId) {
  const cu = await prisma.clientUser.findUnique({ where: { userId }, select: { clientCode: true } });
  return cu?.clientCode;
}

async function resolveClientCode(req, source = req.query) {
  if (req.user.role === 'ADMIN') return String(source?.clientCode || '').trim() || null;
  return req.user.clientCode || await getClientCode(req.user.id);
}

function normaliseAwbs(input) {
  const values = Array.isArray(input)
    ? input
    : String(input || '')
      .split(/[\s,;\n\r\t]+/);
  return [...new Set(values.map((v) => String(v || '').trim().toUpperCase()).filter(Boolean))];
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

function monthKey(date) {
  return String(date || '').slice(0, 7);
}

function parseRange(query) {
  const today = new Date();
  const end = new Date(today);
  const start = new Date(today);

  const range = String(query.range || '30d').toLowerCase();
  if (range === 'today') {
    // today -> same start/end
  } else if (range === '7d') {
    start.setDate(start.getDate() - 6);
  } else if (range === 'this_month') {
    start.setDate(1);
  } else if (range === 'custom' && query.date_from && query.date_to) {
    return { startStr: String(query.date_from), endStr: String(query.date_to), range };
  } else {
    // default 30d
    start.setDate(start.getDate() - 29);
  }

  return { startStr: fmtDate(start), endStr: fmtDate(end), range };
}

// GET /api/portal/stats
router.get('/stats', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not linked to this account.');

  const { startStr, endStr, range } = parseRange(req.query);
  const baseWhere = { clientCode, date: { gte: startStr, lte: endStr } };

  const statusWhere = (statuses) => ({ ...baseWhere, status: { in: statuses } });

  const [
    total,
    booked,
    inTransit,
    outForDelivery,
    delivered,
    exception,
    client,
    trendRows,
  ] = await Promise.all([
    prisma.shipment.count({ where: baseWhere }),
    prisma.shipment.count({ where: statusWhere(['Booked']) }),
    prisma.shipment.count({ where: statusWhere(['InTransit']) }),
    prisma.shipment.count({ where: statusWhere(['OutForDelivery']) }),
    prisma.shipment.count({ where: statusWhere(['Delivered']) }),
    prisma.shipment.count({ where: statusWhere(['Delayed', 'NDR', 'RTO']) }),
    prisma.client.findUnique({ where: { code: clientCode }, select: { walletBalance: true } }),
    prisma.shipment.groupBy({
      by: ['date'],
      where: baseWhere,
      _count: { id: true },
      orderBy: { date: 'asc' },
    }),
  ]);

  const deliveredPct = total > 0 ? Number(((delivered / total) * 100).toFixed(1)) : 0;
  const trend = trendRows.map(r => ({ date: r.date, shipments: r._count.id }));

  R.ok(res, {
    range: { key: range, from: startStr, to: endStr },
    totals: { total, booked, inTransit, outForDelivery, delivered, exception, deliveredPct },
    wallet: client?.walletBalance || 0,
    trend,
  });
}));

// GET /api/portal/shipments
router.get('/shipments', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const { startStr, endStr } = parseRange(req.query);
  const { page = 1, limit = 25, search, status, courier } = req.query;
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(200, Math.max(10, parseInt(limit, 10) || 25));
  const skip = (safePage - 1) * safeLimit;
  const where = { clientCode, date: { gte: startStr, lte: endStr }, ...(status && { status }), ...(courier && { courier }), ...(search && { OR: [
    { awb:         { contains: search, mode: 'insensitive' } },
    { consignee:   { contains: search, mode: 'insensitive' } },
    { destination: { contains: search, mode: 'insensitive' } },
  ]}) };

  const [total, shipments] = await Promise.all([
    prisma.shipment.count({ where }),
    prisma.shipment.findMany({ where, orderBy: [{ date: 'desc' }, { id: 'desc' }], skip, take: safeLimit }),
  ]);
  R.ok(res, { shipments, pagination: { total, page: safePage, limit: safeLimit }, range: { from: startStr, to: endStr } });
}));

// GET /api/portal/performance
router.get('/performance', protect, clientOnly, asyncHandler(async (req, res) => {
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
    summary.total += 0;
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

  const successRate = summary.total ? Number(((summary.delivered / summary.total) * 100).toFixed(1)) : 0;
  R.ok(res, {
    days,
    range: { from: startStr, to: endStr },
    summary: { ...summary, successRate },
    series: Array.from(bucket.values()),
  });
}));

// GET /api/portal/invoices
router.get('/invoices', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');
  const invoices = await prisma.invoice.findMany({
    where: { clientCode },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  R.ok(res, { invoices });
}));

// GET /api/portal/invoices/:id/pdf
router.get('/invoices/:id/pdf', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const invoice = await prisma.invoice.findUnique({
    where: { id: parseInt(req.params.id, 10) },
    include: { client: true, items: { orderBy: { date: 'asc' } } },
  });
  if (!invoice || invoice.clientCode !== clientCode) return R.notFound(res, 'Invoice');

  const buf = await pdf.generateInvoicePDF(invoice, invoice.items, invoice.client);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNo}.pdf"`,
    'Content-Length': buf.length,
  });
  res.send(buf);
}));

// GET /api/portal/wallet
router.get('/wallet', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');
  const [client, txns] = await Promise.all([
    prisma.client.findUnique({ where: { code: clientCode }, select: { code: true, company: true, walletBalance: true } }),
    prisma.walletTransaction.findMany({ where: { clientCode }, orderBy: { createdAt: 'desc' }, take: 50 }),
  ]);
  R.ok(res, { wallet: client, txns });
}));

// GET /api/portal/map/shipments
router.get('/map/shipments', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const { startStr, endStr } = parseRange({ ...req.query, range: req.query.range || '30d' });
  const activeStatuses = ['Booked', 'InTransit', 'OutForDelivery', 'Delayed', 'NDR', 'RTO'];
  const shipments = await prisma.shipment.findMany({
    where: {
      clientCode,
      date: { gte: startStr, lte: endStr },
      status: { in: activeStatuses },
    },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    take: 100,
    include: {
      trackingEvents: {
        orderBy: { timestamp: 'desc' },
        take: 1,
      },
    },
  });

  R.ok(res, {
    shipments: shipments.map((item) => ({
      id: item.id,
      awb: item.awb,
      status: item.status,
      destination: item.destination,
      pincode: item.pincode,
      consignee: item.consignee,
      courier: item.courier,
      updatedAt: item.updatedAt,
      latestEvent: item.trackingEvents?.[0] || null,
      locationHint: item.trackingEvents?.[0]?.location || item.destination || '',
    })),
    range: { from: startStr, to: endStr },
  });
}));

// POST /api/portal/bulk-track
router.post('/bulk-track', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = await resolveClientCode(req, req.body);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const awbs = normaliseAwbs(req.body?.awbs || req.body?.text).slice(0, 200);
  if (!awbs.length) return R.error(res, 'Provide at least one AWB number', 400);

  const shipments = await prisma.shipment.findMany({
    where: { clientCode, awb: { in: awbs } },
    include: {
      trackingEvents: {
        orderBy: { timestamp: 'desc' },
        take: 3,
      },
    },
  });

  const byAwb = new Map(shipments.map((row) => [row.awb.toUpperCase(), row]));
  const results = [];
  for (const awb of awbs) {
    const shipment = byAwb.get(awb);
    if (!shipment) {
      results.push({ awb, found: false, status: 'Not Found' });
      continue;
    }

    results.push({
      awb,
      found: true,
      status: shipment.status,
      courier: shipment.courier,
      destination: shipment.destination,
      consignee: shipment.consignee,
      lastUpdatedAt: shipment.updatedAt,
      latestEvent: shipment.trackingEvents?.[0] || null,
    });
  }

  R.ok(res, {
    total: awbs.length,
    found: results.filter((r) => r.found).length,
    missing: results.filter((r) => !r.found).length,
    results,
  });
}));

// GET /api/portal/rate-calculator/contracts
router.get('/rate-calculator/contracts', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');
  const contracts = await contractSvc.getByClient(clientCode);
  R.ok(res, { contracts });
}));

// GET /api/portal/rate-calculator/estimate
router.get('/rate-calculator/estimate', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = await resolveClientCode(req, req.query);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const weight = Number(req.query?.weight || 0);
  if (!Number.isFinite(weight) || weight <= 0) return R.error(res, 'weight must be greater than 0', 400);

  const contracts = (await contractSvc.getByClient(clientCode)).filter((c) => c.active);
  const estimates = contracts.map((contract) => {
    let base = contract.pricingType === 'PER_KG' ? weight * (contract.baseRate || 0) : (contract.baseRate || 0);
    base = Math.max(base, contract.minCharge || 0);
    const fuel = base * ((contract.fuelSurcharge || 0) / 100);
    const subtotal = base + fuel;
    const gst = subtotal * ((contract.gstPercent || 18) / 100);
    const total = subtotal + gst;
    return {
      id: contract.id,
      name: contract.name,
      courier: contract.courier || 'Any',
      service: contract.service || 'Standard',
      pricingType: contract.pricingType,
      weight,
      base: Math.round(base * 100) / 100,
      fuelSurcharge: Math.round(fuel * 100) / 100,
      gst: Math.round(gst * 100) / 100,
      total: Math.round(total * 100) / 100,
      fuelSurchargePct: contract.fuelSurcharge || 0,
      gstPercent: contract.gstPercent || 18,
      notes: contract.notes || '',
    };
  }).sort((a, b) => a.total - b.total);

  R.ok(res, { estimates, clientCode, weight });
}));

// POST /api/portal/sync-tracking
// Pull latest tracking statuses from courier APIs for active client shipments in selected range.
router.post('/sync-tracking', protect, clientOnly, asyncHandler(async (req, res) => {
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
}));

// GET /api/portal/notification-preferences
router.get('/notification-preferences', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');
  const preferences = await notify.getClientNotificationPreferences(clientCode);
  R.ok(res, { clientCode, preferences });
}));

// POST /api/portal/notification-preferences
router.post('/notification-preferences', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = await resolveClientCode(req, req.body);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const prefs = {
    whatsapp: {
      outForDelivery: Boolean(req.body?.whatsapp?.outForDelivery),
      delivered: Boolean(req.body?.whatsapp?.delivered),
    },
    email: {
      ndr: Boolean(req.body?.email?.ndr),
      rto: Boolean(req.body?.email?.rto),
      pod: Boolean(req.body?.email?.pod),
    },
  };

  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'UPDATE_NOTIFICATION_PREFS',
      entity: 'NOTIFICATION_PREFS',
      entityId: clientCode,
      newValue: prefs,
      ip: req.ip,
    },
  });

  R.ok(res, { clientCode, preferences: prefs }, 'Notification preferences updated.');
}));

// GET /api/portal/ndr
router.get('/ndr', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const { action, page = 1, limit = 25 } = req.query;
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(10, parseInt(limit, 10) || 25));
  const skip = (safePage - 1) * safeLimit;
  const where = {
    shipment: { clientCode },
    ...(action ? { action } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.nDREvent.count({ where }),
    prisma.nDREvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: safeLimit,
      include: {
        shipment: {
          select: {
            id: true,
            awb: true,
            consignee: true,
            destination: true,
            phone: true,
            courier: true,
            status: true,
          },
        },
      },
    }),
  ]);

  R.ok(res, { ndrs: items, pagination: { total, page: safePage, limit: safeLimit } });
}));

// POST /api/portal/ndr/:id/respond
router.post('/ndr/:id/respond', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = await resolveClientCode(req, req.body);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const ndr = await prisma.nDREvent.findUnique({
    where: { id: parseInt(req.params.id, 10) },
    include: {
      shipment: {
        select: {
          id: true,
          awb: true,
          clientCode: true,
          destination: true,
          phone: true,
        },
      },
    },
  });
  if (!ndr || ndr.shipment?.clientCode !== clientCode) return R.notFound(res, 'NDR');

  const action = String(req.body?.action || 'REATTEMPT').trim().toUpperCase();
  const newAddress = String(req.body?.newAddress || '').trim();
  const newPhone = String(req.body?.newPhone || '').trim();
  const rescheduleDate = String(req.body?.rescheduleDate || '').trim();
  const notes = String(req.body?.notes || '').trim();

  if (!['REATTEMPT', 'UPDATE_ADDRESS', 'RTO'].includes(action)) {
    return R.error(res, 'Invalid action', 400);
  }

  const shipmentPatch = {};
  if (newAddress) shipmentPatch.destination = newAddress;
  if (newPhone) shipmentPatch.phone = newPhone;

  const updated = await prisma.$transaction(async (tx) => {
    const item = await tx.nDREvent.update({
      where: { id: ndr.id },
      data: {
        action,
        newAddress: newAddress || undefined,
      },
    });

    if (Object.keys(shipmentPatch).length) {
      await tx.shipment.update({
        where: { id: ndr.shipment.id },
        data: shipmentPatch,
      });
    }

    await tx.auditLog.create({
      data: {
        userId: req.user.id,
        userEmail: req.user.email,
        action: 'CLIENT_NDR_REQUEST',
        entity: 'NDR',
        entityId: String(ndr.id),
        newValue: {
          action,
          newAddress: newAddress || null,
          newPhone: newPhone || null,
          rescheduleDate: rescheduleDate || null,
          notes: notes || null,
          awb: ndr.awb,
        },
        ip: req.ip,
      },
    });

    return item;
  });

  R.ok(res, updated, 'NDR request submitted successfully.');
}));

// GET /api/portal/rto-intelligence
router.get('/rto-intelligence', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const days = Math.min(180, Math.max(30, parseInt(req.query?.days, 10) || 90));
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  const startStr = fmtDate(start);
  const endStr = fmtDate(end);

  const shipments = await prisma.shipment.findMany({
    where: {
      clientCode,
      date: { gte: startStr, lte: endStr },
    },
    select: {
      awb: true,
      date: true,
      status: true,
      pincode: true,
      destination: true,
      department: true,
      service: true,
    },
  });

  const total = shipments.length;
  const rtoRows = shipments.filter((row) => row.status === 'RTO');
  const countBy = (keyFn) => {
    const map = new Map();
    for (const row of shipments) {
      const key = keyFn(row);
      if (!key) continue;
      if (!map.has(key)) map.set(key, { key, total: 0, rto: 0 });
      map.get(key).total += 1;
      if (row.status === 'RTO') map.get(key).rto += 1;
    }
    return [...map.values()]
      .map((item) => ({ ...item, rate: item.total ? Number(((item.rto / item.total) * 100).toFixed(1)) : 0 }))
      .filter((item) => item.rto > 0)
      .sort((a, b) => b.rate - a.rate || b.rto - a.rto)
      .slice(0, 10);
  };

  const monthlyMap = new Map();
  for (const row of shipments) {
    const key = monthKey(row.date);
    if (!monthlyMap.has(key)) monthlyMap.set(key, { month: key, total: 0, rto: 0 });
    monthlyMap.get(key).total += 1;
    if (row.status === 'RTO') monthlyMap.get(key).rto += 1;
  }

  R.ok(res, {
    summary: {
      days,
      totalShipments: total,
      totalRto: rtoRows.length,
      rtoRate: total ? Number(((rtoRows.length / total) * 100).toFixed(1)) : 0,
    },
    topPincodes: countBy((row) => row.pincode || ''),
    topDestinations: countBy((row) => row.destination || ''),
    topCategories: countBy((row) => row.department || row.service || 'Uncategorised'),
    monthlyTrend: [...monthlyMap.values()].sort((a, b) => a.month.localeCompare(b.month)).map((item) => ({
      ...item,
      rate: item.total ? Number(((item.rto / item.total) * 100).toFixed(1)) : 0,
    })),
  });
}));

// GET /api/portal/pickups
router.get('/pickups', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const pickups = await prisma.pickupRequest.findMany({
    where: { clientCode },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  R.ok(res, { pickups });
}));

// POST /api/portal/pickups
router.post('/pickups', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = await resolveClientCode(req, req.body);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const contactName = String(req.body?.contactName || '').trim();
  const contactPhone = String(req.body?.contactPhone || '').trim();
  const pickupAddress = String(req.body?.pickupAddress || '').trim();
  const pickupCity = String(req.body?.pickupCity || '').trim();
  const pickupPin = String(req.body?.pickupPin || '').trim();
  const scheduledDate = String(req.body?.scheduledDate || '').trim();
  const timeSlot = String(req.body?.timeSlot || 'Morning').trim();

  if (!contactName || !contactPhone || !pickupAddress || !pickupCity || !pickupPin || !scheduledDate || !timeSlot) {
    return R.error(res, 'Missing required pickup fields', 400);
  }

  const pickup = await prisma.pickupRequest.create({
    data: {
      requestNo: `PKP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      clientCode,
      contactName,
      contactPhone,
      contactEmail: String(req.body?.contactEmail || '').trim() || null,
      pickupAddress,
      pickupCity,
      pickupPin,
      deliveryAddress: String(req.body?.deliveryAddress || '').trim() || null,
      deliveryCity: String(req.body?.deliveryCity || '').trim() || null,
      deliveryState: String(req.body?.deliveryState || '').trim() || null,
      deliveryCountry: String(req.body?.deliveryCountry || 'India').trim(),
      packageType: String(req.body?.packageType || 'Parcel').trim(),
      weightGrams: Number(req.body?.weightGrams || 0),
      pieces: Math.max(1, parseInt(req.body?.pieces, 10) || 1),
      service: String(req.body?.service || 'Standard').trim(),
      declaredValue: req.body?.declaredValue ? Number(req.body.declaredValue) : null,
      notes: String(req.body?.notes || '').trim() || null,
      source: 'CLIENT_PORTAL',
      preferredCarrier: String(req.body?.preferredCarrier || '').trim() || null,
      scheduledDate,
      timeSlot,
      status: 'PENDING',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'CLIENT_PICKUP_CREATED',
      entity: 'PICKUP',
      entityId: pickup.requestNo,
      newValue: { clientCode, scheduledDate, timeSlot },
      ip: req.ip,
    },
  }).catch(() => {});

  R.created(res, pickup, 'Pickup request created successfully.');
}));

// GET /api/portal/pods
router.get('/pods', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const pods = await prisma.shipment.findMany({
    where: {
      clientCode,
      status: 'Delivered',
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
    include: {
      trackingEvents: {
        where: { status: 'Delivered' },
        orderBy: { timestamp: 'desc' },
        take: 1,
      },
    },
  });

  R.ok(res, {
    pods: pods.map((item) => ({
      id: item.id,
      awb: item.awb,
      consignee: item.consignee,
      destination: item.destination,
      courier: item.courier,
      deliveredAt: item.trackingEvents?.[0]?.timestamp || item.updatedAt,
      deliveredLocation: item.trackingEvents?.[0]?.location || null,
      proofUrl: item.labelUrl || null,
      hasProof: Boolean(item.labelUrl),
    })),
  });
}));

// POST /api/portal/import
router.post('/import', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = await resolveClientCode(req, req.body);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const rows = Array.isArray(req.body?.shipments) ? req.body.shipments.slice(0, 500) : [];
  if (!rows.length) return R.error(res, 'Provide shipments to import', 400);

  const cleaned = rows.map((item) => ({
    date: String(item?.date || fmtDate(new Date())).slice(0, 10),
    clientCode,
    awb: String(item?.awb || '').trim().toUpperCase(),
    consignee: String(item?.consignee || '').trim(),
    destination: String(item?.destination || '').trim(),
    pincode: String(item?.pincode || '').trim(),
    courier: String(item?.courier || '').trim(),
    department: String(item?.department || '').trim(),
    service: String(item?.service || 'Standard').trim(),
    weight: Number(item?.weight || 0),
    amount: Number(item?.amount || 0),
    remarks: String(item?.remarks || '').trim(),
    status: String(item?.status || 'Booked').trim(),
  })).filter((item) => item.awb);

  const result = await shipmentSvc.bulkImport(cleaned, req.user.id);
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'CLIENT_IMPORT_SHIPMENTS',
      entity: 'SHIPMENT_IMPORT',
      entityId: clientCode,
      newValue: { imported: result.imported, duplicates: result.duplicates },
      ip: req.ip,
    },
  }).catch(() => {});

  R.ok(res, result, `Imported ${result.imported} shipments`);
}));

// GET /api/portal/branding
router.get('/branding', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const client = await prisma.client.findUnique({
    where: { code: clientCode },
    select: { code: true, company: true, email: true },
  });
  if (!client) return R.notFound(res, 'Client');

  const origin = `${req.protocol}://${req.get('host')}`;
  const brandName = client.company || client.code;
  const trackingUrl = `${origin}/track?brand=${encodeURIComponent(brandName)}&client=${encodeURIComponent(client.code)}`;
  const widgetScriptUrl = `${origin}/embed/tracker.js`;
  const embedCode = `<div id="seahawk-tracker"></div>\n<script src="${widgetScriptUrl}" data-container="seahawk-tracker" data-brand-color="#e8580a"></script>`;

  R.ok(res, {
    brand: {
      clientCode: client.code,
      company: brandName,
      trackingUrl,
      widgetScriptUrl,
      embedCode,
    },
  });
}));

// POST /api/portal/support-ticket
router.post('/support-ticket', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = req.user.role === 'ADMIN' ? req.body.clientCode : await getClientCode(req.user.id);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const subject = String(req.body?.subject || '').trim();
  const message = String(req.body?.message || '').trim();
  const awb = String(req.body?.awb || '').trim().toUpperCase();
  const priority = String(req.body?.priority || 'normal').trim().toLowerCase();

  if (!subject || !message) {
    return R.badRequest(res, 'subject and message are required.');
  }
  if (subject.length > 140) return R.badRequest(res, 'subject too long (max 140 chars).');
  if (message.length > 2000) return R.badRequest(res, 'message too long (max 2000 chars).');
  if (!['low', 'normal', 'high', 'urgent'].includes(priority)) return R.badRequest(res, 'invalid priority value.');

  const ticketNo = `TKT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10000 + Math.random() * 90000)}`;
  const payload = {
    ticketNo,
    clientCode,
    raisedBy: { id: req.user.id, email: req.user.email, name: req.user.name, role: req.user.role },
    subject,
    message,
    awb: awb || null,
    priority,
    source: 'CLIENT_PORTAL',
    createdAt: new Date().toISOString(),
  };

  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'CREATE_SUPPORT_TICKET',
      entity: 'SUPPORT_TICKET',
      entityId: ticketNo,
      newValue: payload,
      ip: req.ip,
    },
  });

  const recipients = await prisma.user.findMany({
    where: { active: true, role: { in: ['ADMIN', 'OPS_MANAGER'] } },
    select: { email: true, name: true },
  });

  const subjectLine = `[Support Ticket] ${ticketNo} · ${clientCode} · ${subject}`;
  const text = [
    `Ticket: ${ticketNo}`,
    `Client: ${clientCode}`,
    `Raised by: ${req.user.email}`,
    `Priority: ${priority.toUpperCase()}`,
    awb ? `AWB: ${awb}` : '',
    '',
    message,
  ].filter(Boolean).join('\n');

  await Promise.all(
    recipients
      .filter(r => !!r.email)
      .map(r => notify.sendEmail({
        to: r.email,
        subject: subjectLine,
        text,
        html: `<p><strong>Ticket:</strong> ${ticketNo}</p>
               <p><strong>Client:</strong> ${clientCode}</p>
               <p><strong>Raised by:</strong> ${req.user.email}</p>
               <p><strong>Priority:</strong> ${priority.toUpperCase()}</p>
               ${awb ? `<p><strong>AWB:</strong> ${awb}</p>` : ''}
               <p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>`,
      }))
  );

  const adminPhone = (process.env.ADMIN_WHATSAPP || '').replace(/\D/g, '');
  if (adminPhone) {
    await notify.sendWhatsApp(adminPhone, `New support ticket ${ticketNo} from ${clientCode} (${priority.toUpperCase()})${awb ? ` AWB: ${awb}` : ''}. Subject: ${subject}`);
  }

  return R.ok(res, { ticketNo }, 'Support ticket submitted successfully.');
}));

module.exports = router;
