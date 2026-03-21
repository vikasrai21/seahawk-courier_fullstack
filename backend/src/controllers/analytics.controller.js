/* analytics.controller.js — with Redis caching (5-min TTL) */
'use strict';

const prisma  = require('../config/prisma');
const R       = require('../utils/response');
const cache   = require('../utils/cache');

// Build a stable cache key from query params
function cacheKey(prefix, params) {
  const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  return `analytics:${prefix}:${sorted}`;
}

const TTL = 300; // 5 minutes

/* ── GET /api/analytics/overview ── */
async function overview(req, res) {
  try {
    const { dateFrom, dateTo } = req.query;
    const key = cacheKey('overview', { dateFrom: dateFrom || '', dateTo: dateTo || '' });

    const result = await cache.wrap(key, async () => {
      const dateFilter = _dateFilter(dateFrom, dateTo);
      const [totalShipments, delivered, rto, ndr, revenue, byStatus, byCourier, recentTrend] = await Promise.all([
        prisma.shipment.count({ where: dateFilter }),
        prisma.shipment.count({ where: { ...dateFilter, status: 'Delivered' } }),
        prisma.shipment.count({ where: { ...dateFilter, status: 'RTO' } }),
        prisma.shipment.count({ where: { ...dateFilter, ndrStatus: { not: null } } }),
        prisma.shipment.aggregate({ where: dateFilter, _sum: { amount: true, weight: true } }),
        prisma.shipment.groupBy({ by: ['status'], where: dateFilter, _count: { id: true } }),
        prisma.shipment.groupBy({ by: ['courier'], where: { ...dateFilter, courier: { not: null } }, _count: { id: true }, _sum: { amount: true } }),
        _getDailyTrend(dateFilter),
      ]);
      const deliveryRate = totalShipments > 0 ? ((delivered / totalShipments) * 100).toFixed(1) : 0;
      const rtoRate      = totalShipments > 0 ? ((rto      / totalShipments) * 100).toFixed(1) : 0;
      return {
        kpis: { totalShipments, delivered, rto, ndr, deliveryRate: `${deliveryRate}%`, rtoRate: `${rtoRate}%`, totalRevenue: revenue._sum.amount || 0, totalWeight: revenue._sum.weight || 0 },
        byStatus:  _mapGroupBy(byStatus,  'status',  'count'),
        byCourier: _mapGroupBy(byCourier, 'courier', 'count'),
        courierRevenue: byCourier.map(c => ({ courier: c.courier, revenue: c._sum.amount || 0, count: c._count.id })),
        dailyTrend: recentTrend,
      };
    }, TTL);

    return R.ok(res, result);
  } catch (err) { return R.error(res, err.message); }
}

/* ── GET /api/analytics/couriers ── */
async function courierPerformance(req, res) {
  try {
    const { dateFrom, dateTo } = req.query;
    const key = cacheKey('couriers', { dateFrom: dateFrom || '', dateTo: dateTo || '' });

    const result = await cache.wrap(key, async () => {
      const dateFilter = _dateFilter(dateFrom, dateTo);
      const couriers = await prisma.shipment.groupBy({ by: ['courier'], where: { ...dateFilter, courier: { not: null } }, _count: { id: true }, orderBy: { _count: { id: 'desc' } } });
      const performance = await Promise.all(couriers.map(async (c) => {
        if (!c.courier) return null;
        const cf = { ...dateFilter, courier: c.courier };
        const [delivered, rto, ndr, avgDeliveryTime, revenue] = await Promise.all([
          prisma.shipment.count({ where: { ...cf, status: 'Delivered' } }),
          prisma.shipment.count({ where: { ...cf, status: 'RTO' } }),
          prisma.shipment.count({ where: { ...cf, ndrStatus: { not: null } } }),
          _calcAvgDeliveryTime(c.courier, cf),
          prisma.shipment.aggregate({ where: cf, _sum: { amount: true, weight: true } }),
        ]);
        const total = c._count.id;
        return { courier: c.courier, total, delivered, rto, ndr, deliveryRate: total > 0 ? parseFloat(((delivered/total)*100).toFixed(1)) : 0, rtoRate: total > 0 ? parseFloat(((rto/total)*100).toFixed(1)) : 0, ndrRate: total > 0 ? parseFloat(((ndr/total)*100).toFixed(1)) : 0, avgDeliveryDays: avgDeliveryTime, revenue: revenue._sum.amount || 0, totalWeight: revenue._sum.weight || 0 };
      }));
      return { couriers: performance.filter(Boolean) };
    }, TTL);

    return R.ok(res, result);
  } catch (err) { return R.error(res, err.message); }
}

/* ── GET /api/analytics/clients ── */
async function clientAnalytics(req, res) {
  try {
    const { dateFrom, dateTo, limit = 15 } = req.query;
    const key = cacheKey('clients', { dateFrom: dateFrom || '', dateTo: dateTo || '', limit });

    const result = await cache.wrap(key, async () => {
      const dateFilter = _dateFilter(dateFrom, dateTo);
      const clients = await prisma.shipment.groupBy({ by: ['clientCode'], where: dateFilter, _count: { id: true }, _sum: { amount: true, weight: true }, orderBy: { _count: { id: 'desc' } }, take: parseInt(limit) });
      const enriched = await Promise.all(clients.map(async c => {
        const client = await prisma.client.findUnique({ where: { code: c.clientCode }, select: { company: true, phone: true } });
        return { code: c.clientCode, company: client?.company || c.clientCode, count: c._count.id, revenue: c._sum.amount || 0, weight: c._sum.weight || 0 };
      }));
      return { clients: enriched };
    }, TTL);

    return R.ok(res, result);
  } catch (err) { return R.error(res, err.message); }
}

/* ── GET /api/analytics/monthly ── */
async function monthlyTrend(req, res) {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const key = cacheKey('monthly', { year });

    const result = await cache.wrap(key, async () => {
      const months = [];
      for (let m = 1; m <= 12; m++) {
        const from = `${year}-${String(m).padStart(2,'0')}-01`;
        const to   = `${year}-${String(m).padStart(2,'0')}-${new Date(year, m, 0).getDate()}`;
        const [count, revenue, delivered] = await Promise.all([
          prisma.shipment.count({ where: { date: { gte: from, lte: to } } }),
          prisma.shipment.aggregate({ where: { date: { gte: from, lte: to } }, _sum: { amount: true } }),
          prisma.shipment.count({ where: { date: { gte: from, lte: to }, status: 'Delivered' } }),
        ]);
        months.push({ month: m, name: new Date(year, m-1, 1).toLocaleString('en-IN', { month: 'short' }), count, revenue: revenue._sum.amount || 0, deliveryRate: count > 0 ? parseFloat(((delivered/count)*100).toFixed(1)) : 0 });
      }
      return { year: parseInt(year), months };
    }, TTL);

    return R.ok(res, result);
  } catch (err) { return R.error(res, err.message); }
}

/* ── GET /api/analytics/ndr ── */
async function ndrAnalytics(req, res) {
  try {
    const { dateFrom, dateTo } = req.query;
    const key = cacheKey('ndr', { dateFrom: dateFrom || '', dateTo: dateTo || '' });

    const result = await cache.wrap(key, async () => {
      const where = {};
      if (dateFrom || dateTo) { where.createdAt = {}; if (dateFrom) where.createdAt.gte = new Date(dateFrom); if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59Z'); }
      const [total, byReason, byAction] = await Promise.all([
        prisma.nDREvent.count({ where }),
        prisma.nDREvent.groupBy({ by: ['reason'], where, _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
        prisma.nDREvent.groupBy({ by: ['action'], where, _count: { id: true } }),
      ]);
      return { total, byReason: byReason.map(r => ({ reason: r.reason, count: r._count.id })), byAction: byAction.map(a => ({ action: a.action, count: a._count.id })) };
    }, TTL);

    return R.ok(res, result);
  } catch (err) { return R.error(res, err.message); }
}

/* ── Helpers ── */
function _dateFilter(from, to) {
  if (!from && !to) return {};
  const filter = { date: {} };
  if (from) filter.date.gte = from;
  if (to)   filter.date.lte = to;
  return filter;
}
function _mapGroupBy(rows, key) {
  return Object.fromEntries(rows.map(r => [r[key] || 'Unknown', r._count.id]));
}
async function _getDailyTrend() {
  const results = await prisma.$queryRaw`SELECT date, COUNT(*) as count, SUM(amount) as revenue FROM shipments WHERE date >= ${new Date(Date.now() - 30*86400000).toISOString().split('T')[0]} GROUP BY date ORDER BY date ASC`;
  return results.map(r => ({ date: r.date, count: Number(r.count), revenue: Number(r.revenue) || 0 }));
}
async function _calcAvgDeliveryTime(courier, filter) {
  try {
    const delivered = await prisma.shipment.findMany({ where: { ...filter, courier, status: 'Delivered' }, include: { trackingEvents: { where: { status: { in: ['Booked','Delivered'] } }, orderBy: { timestamp: 'asc' } } }, take: 100 });
    const durations = delivered.map(s => { const b = s.trackingEvents.find(e => e.status==='Booked'); const d = s.trackingEvents.find(e => e.status==='Delivered'); if (!b||!d) return null; return (new Date(d.timestamp)-new Date(b.timestamp))/(1000*86400); }).filter(d => d !== null && d > 0);
    return durations.length > 0 ? parseFloat((durations.reduce((a,b)=>a+b,0)/durations.length).toFixed(1)) : null;
  } catch { return null; }
}

module.exports = { overview, courierPerformance, clientAnalytics, monthlyTrend, ndrAnalytics };
