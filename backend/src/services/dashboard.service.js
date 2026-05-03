const prisma = require('../config/prisma');
const cache = require('../utils/cache');
const reconciliationSvc = require('./reconciliation.service');
const logger = require('../utils/logger');

async function getDashboardData() {
  const cached = await cache.get('ops:dashboard:v2');
  if (cached) return cached;
  return await materializeDashboard();
}

async function materializeDashboard() {
  try {
    let now = new Date();
    const latestShipment = await prisma.shipment.findFirst({ select: { date: true }, orderBy: { createdAt: 'desc' } });
    if (latestShipment && latestShipment.date) {
      const latestDate = new Date(latestShipment.date);
      if (latestDate < now) now = new Date(latestDate.getTime() + 12 * 3600000);
    }
    const today = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const [todayCount, weekCount, todayRev, monthRev, pendingCount, monthDelivered, monthTotal, courierData, clientData, dailyData, recentShipments, quoteStats, reconStats, delayedByDays, monthCostData, rtoCount, failedCount, todayDelivered, todayBooked] = await Promise.all([
      prisma.shipment.count({ where: { date: today } }),
      prisma.shipment.count({ where: { date: { gte: sevenDaysAgo } } }),
      prisma.shipment.aggregate({ where: { date: today }, _sum: { amount: true } }),
      prisma.shipment.aggregate({ where: { date: { gte: monthStart } }, _sum: { amount: true } }),
      prisma.shipment.count({ where: { status: { in: ['Booked', 'InTransit'] } } }),
      prisma.shipment.count({ where: { status: 'Delivered', date: { gte: monthStart } } }),
      prisma.shipment.count({ where: { date: { gte: monthStart } } }),
      prisma.shipment.groupBy({ by: ['courier'], where: { date: { gte: monthStart }, courier: { not: null } }, _sum: { amount: true }, _count: { id: true }, orderBy: { _sum: { amount: 'desc' } } }),
      prisma.shipment.groupBy({ by: ['clientCode'], where: { date: { gte: monthStart } }, _sum: { amount: true }, _count: { id: true }, orderBy: { _sum: { amount: 'desc' } }, take: 10 }),
      prisma.shipment.groupBy({ by: ['date'], where: { date: { gte: thirtyDaysAgo } }, _count: { id: true }, _sum: { amount: true }, orderBy: { date: 'asc' } }),
      prisma.shipment.findMany({ where: { date: { gte: sevenDaysAgo } }, take: 15, orderBy: { createdAt: 'desc' }, include: { client: { select: { company: true } } } }),
      prisma.quote.aggregate({ _count: { id: true }, _avg: { profit: true, margin: true }, _sum: { profit: true } }),
      reconciliationSvc.getReconciliationStats(),
      prisma.shipment.groupBy({ by: ['courier'], where: { status: 'InTransit', date: { lte: sevenDaysAgo }, courier: { not: null } }, _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
      prisma.courierInvoice.aggregate({ where: { createdAt: { gte: new Date(monthStart) } }, _sum: { totalAmount: true } }),
      prisma.shipment.count({ where: { status: 'RTO', date: { gte: monthStart } } }),
      prisma.shipment.count({ where: { status: 'Failed', date: { gte: monthStart } } }),
      prisma.shipment.count({ where: { status: 'Delivered', date: today } }),
      prisma.shipment.count({ where: { status: 'Booked', date: today } }),
    ]);

    const clientCodes = clientData.map(c => c.clientCode);
    const clients = await prisma.client.findMany({ where: { code: { in: clientCodes } }, select: { code: true, company: true } });
    const clientMap = Object.fromEntries(clients.map(c => [c.code, c.company]));
    const totalRevenue = Number(monthRev._sum.amount || 0);
    const estimatedCost = Number(monthCostData._sum.totalAmount || Math.round(totalRevenue * 0.72));
    const grossProfit = totalRevenue - estimatedCost;
    const avgMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const payload = {
      todayCount, weekCount,
      todayRev: Number(todayRev._sum.amount || 0),
      monthRev: totalRevenue,
      pendingCount, monthDelivered, monthTotal,
      courierData: courierData.map(c => ({ courier: c.courier, revenue: Number(c._sum.amount || 0), count: c._count.id })),
      clientData: clientData.map(c => ({ clientCode: c.clientCode, company: clientMap[c.clientCode] || c.clientCode, revenue: Number(c._sum.amount || 0), count: c._count.id })),
      dailyData: dailyData.map(d => ({ date: d.date, count: d._count.id, revenue: Number(d._sum.amount || 0) })),
      recentShipments: recentShipments.map(s => ({ id: s.id, awb: s.awb, status: s.status, date: s.date, client: s.client?.company || s.clientCode, courier: s.courier })),
      profitStats: {
        totalRevenue,
        estimatedCost,
        grossProfit,
        avgMargin: Number(avgMargin.toFixed(1)),
        quoteStats: { count: quoteStats._count.id, avgProfit: Number(quoteStats._avg.profit || 0), totalProfit: Number(quoteStats._sum.profit || 0), avgMargin: Number(quoteStats._avg.margin || 0) }
      },
      reconStats,
      delayedAlerts: delayedByDays.filter(d => d._count.id > 0).map(d => ({ courier: d.courier, count: d._count.id })),
      rtoCount, failedCount, todayDelivered, todayBooked,
      lastUpdated: new Date().toISOString()
    };

    await cache.set('ops:dashboard:v2', payload, 3600); // cache for 1 hour, materialized by cron
    logger.info('Dashboard aggregates materialized.');
    return payload;
  } catch (err) {
    logger.error('Dashboard materialization failed', { error: err.message });
    throw err;
  }
}

module.exports = { getDashboardData, materializeDashboard };
