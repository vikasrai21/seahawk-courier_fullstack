// src/routes/ops.routes.js — Operations dashboard aggregated stats
const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const prisma = require('../config/prisma');
const R = require('../utils/response');

const rnd = n => Math.round(n * 100) / 100;

router.use(protect);

router.get('/dashboard', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thisMonthStart = today.slice(0, 7) + '-01';
    const last30Start = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const last7Start  = new Date(Date.now() -  7 * 86400000).toISOString().split('T')[0];

    const [
      todayShipments, weekShipments, monthShipments,
      todayRevenue, monthRevenue,
      pendingCount, deliveredCount,
      topCouriers, topClients,
      recentShipments,
      quoteStats, recoStats,
      courierBreakdown,
      dailyTrend,
    ] = await Promise.all([
      // Counts
      prisma.shipment.count({ where: { date: today } }),
      prisma.shipment.count({ where: { date: { gte: last7Start } } }),
      prisma.shipment.count({ where: { date: { gte: thisMonthStart } } }),
      // Revenue
      prisma.shipment.aggregate({ where: { date: today }, _sum: { amount: true } }),
      prisma.shipment.aggregate({ where: { date: { gte: thisMonthStart } }, _sum: { amount: true } }),
      // Status
      prisma.shipment.count({ where: { status: { in: ['Booked','In Transit','Out for Delivery'] } } }),
      prisma.shipment.count({ where: { date: { gte: thisMonthStart }, status: 'Delivered' } }),
      // Top couriers this month
      prisma.shipment.groupBy({
        by: ['courier'],
        where: { date: { gte: thisMonthStart } },
        _count: { id: true },
        _sum:   { amount: true },
        orderBy: { _count: { id: 'desc' } },
        take: 6,
      }),
      // Top clients this month
      prisma.shipment.groupBy({
        by: ['clientCode'],
        where: { date: { gte: thisMonthStart } },
        _count: { id: true },
        _sum:   { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 5,
      }),
      // Recent shipments
      prisma.shipment.findMany({
        where: { date: { gte: last7Start } },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { id: true, awb: true, date: true, consignee: true, destination: true, courier: true, amount: true, status: true, clientCode: true },
      }),
      // Quote stats
      prisma.quote.aggregate({ _count: { id: true }, _avg: { margin: true, profit: true } }).catch(() => null),
      // Reconciliation stats
      prisma.courierInvoice.aggregate({ _count: { id: true } }).catch(() => null),
      // Courier breakdown this month
      prisma.shipment.groupBy({
        by: ['courier'],
        where: { date: { gte: thisMonthStart } },
        _count: { id: true },
        _sum:   { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      // Daily trend last 14 days
      prisma.$queryRaw`
        SELECT date, COUNT(*)::int as count, COALESCE(SUM(amount),0)::float as revenue
        FROM shipments
        WHERE date >= ${last7Start}
        GROUP BY date ORDER BY date ASC
      `.catch(() => []),
    ]);

    // Enrich top clients with company name
    const clientCodes = topClients.map(c => c.clientCode);
    const clients = await prisma.client.findMany({
      where: { code: { in: clientCodes } },
      select: { code: true, company: true },
    });
    const clientMap = {};
    clients.forEach(c => { clientMap[c.code] = c.company; });

    R.ok(res, {
      overview: {
        todayShipments,
        weekShipments,
        monthShipments,
        todayRevenue:  rnd(todayRevenue._sum.amount || 0),
        monthRevenue:  rnd(monthRevenue._sum.amount || 0),
        pendingCount,
        deliveredCount,
        deliveryRate:  monthShipments > 0 ? rnd((deliveredCount / monthShipments) * 100) : 0,
      },
      quotes: quoteStats ? {
        total: quoteStats._count.id,
        avgMargin: rnd(quoteStats._avg.margin || 0),
        avgProfit: rnd(quoteStats._avg.profit || 0),
      } : null,
      reconciliation: recoStats ? { totalInvoices: recoStats._count.id } : null,
      topCouriers: topCouriers.map(c => ({
        courier: c.courier || 'Unknown',
        count:   c._count.id,
        revenue: rnd(c._sum.amount || 0),
      })),
      topClients: topClients.map(c => ({
        code:    c.clientCode,
        company: clientMap[c.clientCode] || c.clientCode,
        count:   c._count.id,
        revenue: rnd(c._sum.amount || 0),
      })),
      courierBreakdown: courierBreakdown.map(c => ({
        courier: c.courier || 'Unknown',
        count:   c._count.id,
        revenue: rnd(c._sum.amount || 0),
      })),
      dailyTrend: (dailyTrend || []).map(d => ({
        date:    d.date,
        count:   Number(d.count),
        revenue: Number(d.revenue),
      })),
      recentShipments,
    });
  } catch (e) { next(e); }
});

module.exports = router;
