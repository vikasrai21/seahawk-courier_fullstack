/* analytics.controller.js — Feature #9: Performance Analytics */
'use strict';

const prisma  = require('../config/prisma');
const R       = require('../utils/response');

/* ── GET /api/analytics/overview  — dashboard KPIs ── */
async function overview(req, res) {
  try {
    const { dateFrom, dateTo } = req.query;
    const dateFilter = _dateFilter(dateFrom, dateTo);

    const [
      totalShipments,
      delivered,
      rto,
      ndr,
      revenue,
      byStatus,
      byCourier,
      recentTrend,
    ] = await Promise.all([
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

    return R.ok(res, {
      kpis: {
        totalShipments,
        delivered,
        rto,
        ndr,
        deliveryRate:   `${deliveryRate}%`,
        rtoRate:        `${rtoRate}%`,
        totalRevenue:   revenue._sum.amount || 0,
        totalWeight:    revenue._sum.weight  || 0,
      },
      byStatus:  _mapGroupBy(byStatus,   'status',  'count'),
      byCourier: _mapGroupBy(byCourier,  'courier', 'count'),
      courierRevenue: byCourier.map(c => ({
        courier: c.courier,
        revenue: c._sum.amount || 0,
        count:   c._count.id,
      })),
      dailyTrend: recentTrend,
    });
  } catch (err) {
    return R.error(res, err.message);
  }
}

/* ── GET /api/analytics/couriers  — per-carrier performance ── */
async function courierPerformance(req, res) {
  try {
    const { dateFrom, dateTo } = req.query;
    const dateFilter = _dateFilter(dateFrom, dateTo);

    const couriers = await prisma.shipment.groupBy({
      by:      ['courier'],
      where:   { ...dateFilter, courier: { not: null } },
      _count:  { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const performance = await Promise.all(couriers.map(async (c) => {
      if (!c.courier) return null;
      const courierFilter = { ...dateFilter, courier: c.courier };

      const [delivered, rto, ndr, avgDeliveryTime, revenue] = await Promise.all([
        prisma.shipment.count({ where: { ...courierFilter, status: 'Delivered' } }),
        prisma.shipment.count({ where: { ...courierFilter, status: 'RTO' } }),
        prisma.shipment.count({ where: { ...courierFilter, ndrStatus: { not: null } } }),
        _calcAvgDeliveryTime(c.courier, courierFilter),
        prisma.shipment.aggregate({ where: courierFilter, _sum: { amount: true, weight: true } }),
      ]);

      const total = c._count.id;
      return {
        courier:       c.courier,
        total,
        delivered,
        rto,
        ndr,
        deliveryRate:  total > 0 ? parseFloat(((delivered / total) * 100).toFixed(1)) : 0,
        rtoRate:       total > 0 ? parseFloat(((rto / total) * 100).toFixed(1)) : 0,
        ndrRate:       total > 0 ? parseFloat(((ndr / total) * 100).toFixed(1)) : 0,
        avgDeliveryDays: avgDeliveryTime,
        revenue:       revenue._sum.amount || 0,
        totalWeight:   revenue._sum.weight || 0,
      };
    }));

    return R.ok(res, { couriers: performance.filter(Boolean) });
  } catch (err) {
    return R.error(res, err.message);
  }
}

/* ── GET /api/analytics/clients  — top clients by shipment volume ── */
async function clientAnalytics(req, res) {
  try {
    const { dateFrom, dateTo, limit = 15 } = req.query;
    const dateFilter = _dateFilter(dateFrom, dateTo);

    const clients = await prisma.shipment.groupBy({
      by:      ['clientCode'],
      where:   dateFilter,
      _count:  { id: true },
      _sum:    { amount: true, weight: true },
      orderBy: { _count: { id: 'desc' } },
      take:    parseInt(limit),
    });

    const enriched = await Promise.all(clients.map(async c => {
      const client = await prisma.client.findUnique({
        where:  { code: c.clientCode },
        select: { company: true, phone: true },
      });
      return {
        code:     c.clientCode,
        company:  client?.company || c.clientCode,
        count:    c._count.id,
        revenue:  c._sum.amount || 0,
        weight:   c._sum.weight || 0,
      };
    }));

    return R.ok(res, { clients: enriched });
  } catch (err) {
    return R.error(res, err.message);
  }
}

/* ── GET /api/analytics/monthly  — monthly trend data ── */
async function monthlyTrend(req, res) {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const months = [];

    for (let m = 1; m <= 12; m++) {
      const from  = `${year}-${String(m).padStart(2,'0')}-01`;
      const end   = new Date(year, m, 0);
      const to    = `${year}-${String(m).padStart(2,'0')}-${String(end.getDate()).padStart(2,'0')}`;

      const [count, revenue, delivered] = await Promise.all([
        prisma.shipment.count({ where: { date: { gte: from, lte: to } } }),
        prisma.shipment.aggregate({ where: { date: { gte: from, lte: to } }, _sum: { amount: true } }),
        prisma.shipment.count({ where: { date: { gte: from, lte: to }, status: 'Delivered' } }),
      ]);

      months.push({
        month:       m,
        name:        new Date(year, m-1, 1).toLocaleString('en-IN', { month: 'short' }),
        count,
        revenue:     revenue._sum.amount || 0,
        deliveryRate: count > 0 ? parseFloat(((delivered / count) * 100).toFixed(1)) : 0,
      });
    }

    return R.ok(res, { year: parseInt(year), months });
  } catch (err) {
    return R.error(res, err.message);
  }
}

/* ── GET /api/analytics/ndr  — NDR analytics ── */
async function ndrAnalytics(req, res) {
  try {
    const { dateFrom, dateTo } = req.query;
    const where = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo)   where.createdAt.lte = new Date(dateTo + 'T23:59:59Z');
    }

    const [total, byReason, byAction, byCourier] = await Promise.all([
      prisma.nDREvent.count({ where }),
      prisma.nDREvent.groupBy({ by: ['reason'], where, _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
      prisma.nDREvent.groupBy({ by: ['action'], where, _count: { id: true } }),
      prisma.nDREvent.groupBy({ by: ['awb'], where, _count: { id: true } }),
    ]);

    return R.ok(res, {
      total,
      byReason: byReason.map(r => ({ reason: r.reason, count: r._count.id })),
      byAction: byAction.map(a => ({ action: a.action, count: a._count.id })),
    });
  } catch (err) {
    return R.error(res, err.message);
  }
}

/* ── Helpers ── */
function _dateFilter(from, to) {
  if (!from && !to) return {};
  const filter = { date: {} };
  if (from) filter.date.gte = from;
  if (to)   filter.date.lte = to;
  return filter;
}

function _mapGroupBy(rows, key, countKey) {
  return Object.fromEntries(rows.map(r => [r[key] || 'Unknown', r._count.id]));
}

async function _getDailyTrend(dateFilter) {
  // Last 30 days of shipment counts
  const results = await prisma.$queryRaw`
    SELECT date, COUNT(*) as count, SUM(amount) as revenue
    FROM shipments
    WHERE date >= ${new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]}
    GROUP BY date
    ORDER BY date ASC
  `;
  return results.map(r => ({ date: r.date, count: Number(r.count), revenue: Number(r.revenue) || 0 }));
}

async function _calcAvgDeliveryTime(courier, filter) {
  // Avg days between first scan (Booked) and Delivered event
  try {
    const delivered = await prisma.shipment.findMany({
      where:   { ...filter, courier, status: 'Delivered' },
      include: { trackingEvents: { where: { status: { in: ['Booked', 'Delivered'] } }, orderBy: { timestamp: 'asc' } } },
      take:    100,
    });

    const durations = delivered
      .map(s => {
        const booked    = s.trackingEvents.find(e => e.status === 'Booked');
        const delivered = s.trackingEvents.find(e => e.status === 'Delivered');
        if (!booked || !delivered) return null;
        return (new Date(delivered.timestamp) - new Date(booked.timestamp)) / (1000 * 86400);
      })
      .filter(d => d !== null && d > 0);

    return durations.length > 0
      ? parseFloat((durations.reduce((a,b) => a+b, 0) / durations.length).toFixed(1))
      : null;
  } catch { return null; }
}

module.exports = { overview, courierPerformance, clientAnalytics, monthlyTrend, ndrAnalytics };
