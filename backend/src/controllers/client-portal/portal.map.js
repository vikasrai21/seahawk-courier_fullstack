'use strict';

const prisma = require('../../config/prisma');
const R = require('../../utils/response');
const { resolveClientCode, parseRange, monthKey } = require('./shared');

async function mapShipments(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const { startStr, endStr } = parseRange({ ...req.query, range: req.query.range || '30d' });
  const activeStatuses = ['Booked', 'InTransit', 'OutForDelivery', 'Delayed', 'NDR', 'RTO'];
  const shipments = await prisma.shipment.findMany({
    where: { clientCode, date: { gte: startStr, lte: endStr }, status: { in: activeStatuses } },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    take: 100,
    include: { trackingEvents: { orderBy: { timestamp: 'desc' }, take: 1 } },
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
}

async function rtoIntelligence(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const days = Math.min(180, Math.max(30, parseInt(req.query?.days, 10) || 90));
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  const shipments = await prisma.shipment.findMany({
    where: { clientCode, date: { gte: startStr, lte: endStr } },
    select: { awb: true, date: true, status: true, pincode: true, destination: true, department: true, service: true },
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
}

async function pods(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const podsList = await prisma.shipment.findMany({
    where: { clientCode, status: 'Delivered' },
    orderBy: { updatedAt: 'desc' },
    take: 100,
    include: { trackingEvents: { where: { status: 'Delivered' }, orderBy: { timestamp: 'desc' }, take: 1 } },
  });

  R.ok(res, {
    pods: podsList.map((item) => ({
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
}

async function branding(req, res) {
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

  R.ok(res, {
    brand: {
      clientCode: client.code,
      company: brandName,
      trackingUrl,
      widgetScriptUrl,
      embedCode: `<div id="seahawk-tracker"></div>\n<script src="${widgetScriptUrl}" data-container="seahawk-tracker" data-brand-color="#e8580a"></script>`,
    },
  });
}

module.exports = { mapShipments, rtoIntelligence, pods, branding };
