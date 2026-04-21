'use strict';

const prisma = require('../../config/prisma');
const R = require('../../utils/response');
const { resolveClientCode, parseRange, monthKey } = require('./shared');
const geocode = require('../../services/geocode.service');

async function mapShipments(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const { startStr, endStr } = parseRange({ ...req.query, range: req.query.range || '30d' });
  const includeDelivered = String(req.query?.includeDelivered || '') === '1';
  const activeStatuses = includeDelivered
    ? ['Booked', 'InTransit', 'OutForDelivery', 'Delayed', 'NDR', 'RTO', 'Delivered']
    : ['Booked', 'InTransit', 'OutForDelivery', 'Delayed', 'NDR', 'RTO'];
  const shipments = await prisma.shipment.findMany({
    where: { clientCode, date: { gte: startStr, lte: endStr }, status: { in: activeStatuses } },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    take: 100,
    include: { trackingEvents: { orderBy: { timestamp: 'desc' }, take: 1 } },
  });

  const geoMap = await geocode.geocodeShipments(
    shipments.map((item) => ({
      id: item.id,
      pincode: item.pincode,
      destination: item.destination,
      locationHint: item.trackingEvents?.[0]?.location || item.destination || '',
    })),
    { maxFetch: 6 }
  );

  R.ok(res, {
    shipments: shipments.map((item) => {
      const geo = geoMap.get(item.id) || null;
      return {
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
        geo,
      };
    }),
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
    select: {
      awb: true,
      date: true,
      status: true,
      pincode: true,
      destination: true,
      department: true,
      service: true,
      amount: true,
      phone: true,
      consignee: true,
      courier: true,
      remarks: true,
      updatedAt: true,
    },
  });

  const historyStart = new Date();
  historyStart.setDate(historyStart.getDate() - 365);
  const historyStartStr = historyStart.toISOString().slice(0, 10);
  const historyRows = await prisma.shipment.findMany({
    where: { clientCode, date: { gte: historyStartStr, lte: endStr } },
    select: {
      awb: true,
      status: true,
      amount: true,
      phone: true,
      consignee: true,
      pincode: true,
      destination: true,
      service: true,
      department: true,
      remarks: true,
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

  const normalizeName = (value) => String(value || '').trim().toLowerCase();
  const customerKey = (row) => {
    const phone = String(row.phone || '').replace(/\D+/g, '');
    if (phone) return `phone:${phone}`;
    const consignee = normalizeName(row.consignee);
    if (consignee) return `consignee:${consignee}`;
    return `awb:${String(row.awb || '').toLowerCase()}`;
  };
  const inferCod = (row) => {
    const tags = `${row.service || ''} ${row.department || ''} ${row.remarks || ''}`.toLowerCase();
    return /cod|cash/.test(tags) || Number(row.amount || 0) > 0;
  };
  const isRemotePincode = (pincode) => {
    const pin = String(pincode || '').trim();
    if (!/^\d{6}$/.test(pin)) return false;
    const tier1Prefixes = new Set(['11', '12', '22', '33', '40', '41', '50', '56', '60', '70']);
    return !tier1Prefixes.has(pin.slice(0, 2));
  };

  const customerStats = new Map();
  for (const row of historyRows) {
    const key = customerKey(row);
    if (!customerStats.has(key)) {
      customerStats.set(key, {
        total: 0,
        failed: 0,
        cod: 0,
        consignee: row.consignee || null,
        phone: row.phone || null,
      });
    }
    const current = customerStats.get(key);
    current.total += 1;
    if (['RTO', 'NDR', 'Delayed', 'Undelivered'].includes(String(row.status || ''))) current.failed += 1;
    if (inferCod(row)) current.cod += 1;
  }

  const scored = shipments.map((row) => {
    const reasons = [];
    let score = 0;
    const key = customerKey(row);
    const cStats = customerStats.get(key) || { total: 0, failed: 0, cod: 0 };

    const cod = inferCod(row);
    const highValue = Number(row.amount || 0) > 2000;
    const remote = isRemotePincode(row.pincode);
    const pastFailed = Math.max(0, Number(cStats.failed || 0) - (['RTO', 'NDR', 'Delayed', 'Undelivered'].includes(row.status) ? 1 : 0));
    const newCustomer = Number(cStats.total || 0) <= 1;

    if (cod) {
      score += 30;
      reasons.push('COD order');
    }
    if (highValue) {
      score += 20;
      reasons.push('High order value');
    }
    if (remote) {
      score += 25;
      reasons.push('Remote pincode');
    }
    if (pastFailed > 0) {
      score += 40;
      reasons.push(`Past failed deliveries (${pastFailed})`);
    }
    if (newCustomer) {
      score += 15;
      reasons.push('New customer profile');
    }

    score = Math.max(0, Math.min(100, score));
    const riskLevel = score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';
    const recommendedActions = [];
    if (score >= 70) recommendedActions.push('Call customer', 'Verify address', 'Confirm availability');
    if (remote) recommendedActions.push('Switch courier');
    if (score >= 60) recommendedActions.push('Delay shipment');
    if (pastFailed >= 2) recommendedActions.push('Prepaid-only recommendation');
    if (score >= 85) recommendedActions.push('Cancel order if fraud suspected');

    return {
      awb: row.awb,
      status: row.status,
      destination: row.destination,
      pincode: row.pincode,
      consignee: row.consignee,
      phone: row.phone,
      courier: row.courier,
      amount: row.amount,
      updatedAt: row.updatedAt,
      riskScore: score,
      riskLevel,
      reasons,
      recommendedActions: [...new Set(recommendedActions)].slice(0, 5),
      markers: { cod, highValue, remote, pastFailed, newCustomer },
    };
  });

  const atRiskShipments = scored
    .filter((row) => row.riskScore >= 40 && row.status !== 'Delivered')
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 25);

  const riskDistribution = {
    high: scored.filter((row) => row.riskLevel === 'HIGH').length,
    medium: scored.filter((row) => row.riskLevel === 'MEDIUM').length,
    low: scored.filter((row) => row.riskLevel === 'LOW').length,
  };

  const locationMap = new Map();
  for (const row of scored) {
    const key = String(row.pincode || row.destination || '').trim();
    if (!key) continue;
    if (!locationMap.has(key)) locationMap.set(key, { key, total: 0, rto: 0, avgRisk: 0 });
    const current = locationMap.get(key);
    current.total += 1;
    if (row.status === 'RTO') current.rto += 1;
    current.avgRisk += row.riskScore;
  }
  const heatmap = [...locationMap.values()]
    .map((row) => ({
      ...row,
      avgRisk: row.total ? Number((row.avgRisk / row.total).toFixed(1)) : 0,
      rate: row.total ? Number(((row.rto / row.total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.avgRisk - a.avgRisk || b.rate - a.rate)
    .slice(0, 12);

  const customerRiskProfiles = [...customerStats.values()]
    .map((row) => {
      const codShare = row.total ? row.cod / row.total : 0;
      let score = row.failed * 25 + Math.round(codShare * 30);
      if (row.total <= 1) score += 15;
      score = Math.max(0, Math.min(100, score));
      const riskTag = score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';
      return {
        customer: row.consignee || 'Unknown',
        phone: row.phone || null,
        totalShipments: row.total,
        failedDeliveries: row.failed,
        codShare: Number((codShare * 100).toFixed(0)),
        riskScore: score,
        riskTag,
      };
    })
    .filter((row) => row.failedDeliveries > 0 || row.riskScore >= 40)
    .sort((a, b) => b.riskScore - a.riskScore || b.failedDeliveries - a.failedDeliveries)
    .slice(0, 8);

  const avgOrderValue = (() => {
    const amounts = shipments.map((row) => Number(row.amount || 0)).filter((value) => value > 0);
    if (!amounts.length) return 900;
    return Number((amounts.reduce((sum, value) => sum + value, 0) / amounts.length).toFixed(0));
  })();
  const estimatedLoss = Number((rtoRows.length * avgOrderValue).toFixed(0));
  const potentialSaved = Number((atRiskShipments.filter((row) => row.riskScore >= 70).length * avgOrderValue * 0.35).toFixed(0));
  const topRisk = atRiskShipments[0] || null;
  const insights = [
    topRisk ? `${topRisk.awb} has the highest predicted return risk (${topRisk.riskScore}%).` : 'No high-risk shipments right now.',
    `${riskDistribution.high} high-risk and ${riskDistribution.medium} medium-risk shipments detected in this window.`,
    heatmap[0] ? `${heatmap[0].key} is currently the hottest risk zone.` : 'No heatmap zone risk concentration detected.',
  ];

  R.ok(res, {
    summary: {
      days,
      totalShipments: total,
      totalRto: rtoRows.length,
      rtoRate: total ? Number(((rtoRows.length / total) * 100).toFixed(1)) : 0,
      estimatedLoss,
      potentialSaved,
      atRiskCount: atRiskShipments.length,
    },
    topPincodes: countBy((row) => row.pincode || ''),
    topDestinations: countBy((row) => row.destination || ''),
    topCategories: countBy((row) => row.department || row.service || 'Uncategorised'),
    monthlyTrend: [...monthlyMap.values()].sort((a, b) => a.month.localeCompare(b.month)).map((item) => ({
      ...item,
      rate: item.total ? Number(((item.rto / item.total) * 100).toFixed(1)) : 0,
    })),
    atRiskShipments,
    riskDistribution,
    heatmap,
    customerRiskProfiles,
    insights,
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
    select: { code: true, company: true, email: true, brandSettings: true },
  });
  if (!client) return R.notFound(res, 'Client');

  const origin = `${req.protocol}://${req.get('host')}`;
  const cfg = typeof client.brandSettings === 'object' && client.brandSettings ? client.brandSettings : {};
  const brandName = String(cfg.brandName || client.company || client.code).trim();
  const brandColor = String(cfg.brandColor || '#e8580a').trim();
  const logoUrl = String(cfg.logoUrl || '').trim() || null;
  const subdomain = String(cfg.subdomain || '').trim() || null;
  const smsTemplate = String(cfg.smsTemplate || '').trim() || null;
  const trackingUrl = `${origin}/track?brand=${encodeURIComponent(brandName)}&client=${encodeURIComponent(client.code)}`;
  const widgetScriptUrl = `${origin}/embed/tracker.js`;

  R.ok(res, {
    brand: {
      clientCode: client.code,
      company: brandName,
      brandColor,
      logoUrl,
      subdomain,
      smsTemplate,
      trackingUrl,
      widgetScriptUrl,
      embedCode: `<div id="seahawk-tracker"></div>\n<script src="${widgetScriptUrl}" data-container="seahawk-tracker" data-brand-color="${brandColor}"></script>`,
    },
  });
}

function sanitizeBrandPayload(body = {}) {
  const brandName = String(body.brandName || '').trim();
  const brandColor = String(body.brandColor || '#e8580a').trim();
  const logoUrl = String(body.logoUrl || '').trim();
  const subdomain = String(body.subdomain || '').trim().toLowerCase();
  const smsTemplate = String(body.smsTemplate || '').trim();

  return {
    brandName: brandName || undefined,
    brandColor: /^#[0-9a-fA-F]{6}$/.test(brandColor) ? brandColor : '#e8580a',
    logoUrl: logoUrl || null,
    subdomain: subdomain || null,
    smsTemplate: smsTemplate || null,
  };
}

async function updateBranding(req, res) {
  const clientCode = await resolveClientCode(req, req.body);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');
  const payload = sanitizeBrandPayload(req.body || {});
  const existing = await prisma.client.findUnique({
    where: { code: clientCode },
    select: { brandSettings: true },
  });
  const current = existing?.brandSettings && typeof existing.brandSettings === 'object'
    ? existing.brandSettings
    : {};

  await prisma.client.update({
    where: { code: clientCode },
    data: { brandSettings: { ...current, ...payload } },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'CLIENT_BRAND_SETTINGS_UPDATED',
      entity: 'CLIENT',
      entityId: clientCode,
      newValue: payload,
      ip: req.ip,
    },
  });

  R.ok(res, { brandSettings: payload }, 'Brand settings updated.');
}

module.exports = { mapShipments, rtoIntelligence, pods, branding, updateBranding };
