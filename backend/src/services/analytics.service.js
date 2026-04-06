// src/services/analytics.service.js
const prisma = require('../config/prisma');
const importLedger = require('./import-ledger.service');

function _dateFilter(from, to) {
  if (!from && !to) return {};
  const filter = { date: {} };
  if (from) filter.date.gte = from;
  if (to) filter.date.lte = to;
  return filter;
}

function _mapGroupBy(rows, key) {
  return Object.fromEntries(rows.map(r => [r[key] || r.value || 'Unknown', r._count?.id ?? r.count ?? 0]));
}

async function _resolveSource(dateFilter = {}) {
  const importCount = await importLedger.count(dateFilter);
  return importCount > 0 ? 'import' : 'shipment';
}

async function _getDailyTrend(dateFilter = {}, source = 'shipment') {
  const where = dateFilter?.date ? { date: dateFilter.date } : { date: { gte: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0] } };
  if (source === 'import') {
    const rows = await importLedger.groupBy('date', where, { sumAmount: true, orderBy: 'dateAsc' });
    return rows.map(r => ({ date: r.value, count: Number(r.count), revenue: Number(r.amount) || 0 }));
  }
  const results = await prisma.shipment.groupBy({
    by: ['date'],
    where,
    _count: { id: true },
    _sum: { amount: true },
    orderBy: { date: 'asc' },
  });
  return results.map(r => ({ date: r.date, count: Number(r._count.id), revenue: Number(r._sum.amount) || 0 }));
}

async function _calcAvgDeliveryTime(courier, filter) {
  try {
    const delivered = await prisma.shipment.findMany({ where: { ...filter, courier, status: 'Delivered' }, include: { trackingEvents: { where: { status: { in: ['Booked', 'Delivered'] } }, orderBy: { timestamp: 'asc' } } }, take: 100 });
    const durations = delivered.map(s => { const b = s.trackingEvents.find(e => e.status === 'Booked'); const d = s.trackingEvents.find(e => e.status === 'Delivered'); if (!b || !d) return null; return (new Date(d.timestamp) - new Date(b.timestamp)) / (1000 * 86400); }).filter(d => d !== null && d > 0);
    return durations.length > 0 ? parseFloat((durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1)) : null;
  } catch { return null; }
}

async function getOverview(dateFrom, dateTo) {
  const dateFilter = _dateFilter(dateFrom, dateTo);
  const source = await _resolveSource(dateFilter);
  const isImport = source === 'import';
  const model = prisma.shipment;
  
  const [totalShipments, delivered, rto, ndr, revenue, byStatus, byCourier, recentTrend] = await Promise.all([
    isImport ? importLedger.count(dateFilter) : model.count({ where: dateFilter }),
    isImport ? importLedger.count(dateFilter, [{ field: 'status', op: 'eq', value: 'Delivered' }]) : model.count({ where: { ...dateFilter, status: 'Delivered' } }),
    isImport ? importLedger.count(dateFilter, [{ field: 'status', op: 'eq', value: 'RTO' }]) : model.count({ where: { ...dateFilter, status: 'RTO' } }),
    isImport ? importLedger.count(dateFilter, [{ field: 'ndrStatus', op: 'notNull' }]) : model.count({ where: { ...dateFilter, ndrStatus: { not: null } } }),
    isImport ? importLedger.aggregate(dateFilter) : model.aggregate({ where: dateFilter, _sum: { amount: true, weight: true } }),
    isImport ? importLedger.groupBy('status', dateFilter) : model.groupBy({ by: ['status'], where: dateFilter, _count: { id: true } }),
    isImport ? importLedger.groupBy('courier', dateFilter, { excludeNull: true, sumAmount: true }) : model.groupBy({ by: ['courier'], where: { ...dateFilter, courier: { not: null } }, _count: { id: true }, _sum: { amount: true } }),
    _getDailyTrend(dateFilter, source),
  ]);

  const deliveryRate = totalShipments > 0 ? ((delivered / totalShipments) * 100).toFixed(1) : 0;
  const rtoRate = totalShipments > 0 ? ((rto / totalShipments) * 100).toFixed(1) : 0;

  return {
    kpis: { 
      totalShipments, delivered, rto, ndr, 
      deliveryRate: `${deliveryRate}%`, 
      rtoRate: `${rtoRate}%`, 
      totalRevenue: isImport ? revenue.amount : (revenue._sum.amount || 0), 
      totalWeight: isImport ? revenue.weight : (revenue._sum.weight || 0) 
    },
    byStatus: _mapGroupBy(byStatus, 'status', 'count'),
    byCourier: _mapGroupBy(byCourier, 'courier', 'count'),
    courierRevenue: byCourier.map(c => ({ 
      courier: c.courier ?? c.value, 
      revenue: isImport ? (c.amount || 0) : (c._sum.amount || 0), 
      count: isImport ? c.count : c._count.id 
    })),
    dailyTrend: recentTrend,
  };
}

async function getCourierPerformance(dateFrom, dateTo) {
  const dateFilter = _dateFilter(dateFrom, dateTo);
  const source = await _resolveSource(dateFilter);
  const isImport = source === 'import';
  const model = prisma.shipment;

  const couriers = isImport
    ? await importLedger.groupBy('courier', dateFilter, { excludeNull: true })
    : await model.groupBy({ by: ['courier'], where: { ...dateFilter, courier: { not: null } }, _count: { id: true }, orderBy: { _count: { id: 'desc' } } });

  const performance = await Promise.all(couriers.map(async (c) => {
    const courier = c.courier ?? c.value;
    const total = isImport ? c.count : c._count.id;
    if (!courier) return null;
    const cf = { ...dateFilter, courier };
    const [delivered, rto, ndr, avgDeliveryTime, revenue] = await Promise.all([
      isImport ? importLedger.count(dateFilter, [{ field: 'courier', op: 'eq', value: courier }, { field: 'status', op: 'eq', value: 'Delivered' }]) : model.count({ where: { ...cf, status: 'Delivered' } }),
      isImport ? importLedger.count(dateFilter, [{ field: 'courier', op: 'eq', value: courier }, { field: 'status', op: 'eq', value: 'RTO' }]) : model.count({ where: { ...cf, status: 'RTO' } }),
      isImport ? importLedger.count(dateFilter, [{ field: 'courier', op: 'eq', value: courier }, { field: 'ndrStatus', op: 'notNull' }]) : model.count({ where: { ...cf, ndrStatus: { not: null } } }),
      source === 'import' ? Promise.resolve(null) : _calcAvgDeliveryTime(courier, cf),
      isImport ? importLedger.aggregate(dateFilter, [{ field: 'courier', op: 'eq', value: courier }]) : model.aggregate({ where: cf, _sum: { amount: true, weight: true } }),
    ]);
    return { courier, total, delivered, rto, ndr, deliveryRate: total > 0 ? parseFloat(((delivered / total) * 100).toFixed(1)) : 0, rtoRate: total > 0 ? parseFloat(((rto / total) * 100).toFixed(1)) : 0, ndrRate: total > 0 ? parseFloat(((ndr / total) * 100).toFixed(1)) : 0, avgDeliveryDays: avgDeliveryTime, revenue: isImport ? revenue.amount : (revenue._sum.amount || 0), totalWeight: isImport ? revenue.weight : (revenue._sum.weight || 0) };
  }));
  return { couriers: performance.filter(Boolean) };
}

async function getClientAnalytics(dateFrom, dateTo, limit = 15) {
  const dateFilter = _dateFilter(dateFrom, dateTo);
  const source = await _resolveSource(dateFilter);
  const isImport = source === 'import';
  const model = prisma.shipment;

  const clients = isImport
    ? await importLedger.groupBy('clientCode', dateFilter, { sumAmount: true, sumWeight: true, limit: parseInt(limit, 10) || 15 })
    : await model.groupBy({ by: ['clientCode'], where: dateFilter, _count: { id: true }, _sum: { amount: true, weight: true }, orderBy: { _count: { id: 'desc' } }, take: parseInt(limit) });

  const enriched = await Promise.all(clients.map(async c => {
    const code = c.clientCode ?? c.value;
    const client = await prisma.client.findUnique({ where: { code }, select: { company: true, phone: true } });
    return { code, company: client?.company || code, count: isImport ? c.count : c._count.id, revenue: isImport ? (c.amount || 0) : (c._sum.amount || 0), weight: isImport ? (c.weight || 0) : (c._sum.weight || 0) };
  }));
  return { clients: enriched };
}

async function getMonthlyTrend(year) {
  const source = await _resolveSource({});
  const isImport = source === 'import';
  const model = prisma.shipment;
  const months = [];
  
  for (let m = 1; m <= 12; m++) {
    const from = `${year}-${String(m).padStart(2, '0')}-01`;
    const to = `${year}-${String(m).padStart(2, '0')}-${new Date(year, m, 0).getDate()}`;
    const [count, revenue, delivered] = await Promise.all([
      isImport ? importLedger.count({ date: { gte: from, lte: to } }) : model.count({ where: { date: { gte: from, lte: to } } }),
      isImport ? importLedger.aggregate({ date: { gte: from, lte: to } }) : model.aggregate({ where: { date: { gte: from, lte: to } }, _sum: { amount: true } }),
      isImport ? importLedger.count({ date: { gte: from, lte: to } }, [{ field: 'status', op: 'eq', value: 'Delivered' }]) : model.count({ where: { date: { gte: from, lte: to }, status: 'Delivered' } }),
    ]);
    months.push({ 
      month: m, 
      name: new Date(year, m - 1, 1).toLocaleString('en-IN', { month: 'short' }), 
      count, 
      revenue: isImport ? revenue.amount : (revenue._sum.amount || 0), 
      deliveryRate: count > 0 ? parseFloat(((delivered / count) * 100).toFixed(1)) : 0 
    });
  }
  return { year: parseInt(year), months };
}

async function getNdrAnalytics(dateFrom, dateTo) {
  const where = {};
  if (dateFrom || dateTo) { 
    where.createdAt = {}; 
    if (dateFrom) where.createdAt.gte = new Date(dateFrom); 
    if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59Z'); 
  }
  
  const [total, byReason, byAction] = await Promise.all([
    prisma.nDREvent.count({ where }),
    prisma.nDREvent.groupBy({ by: ['reason'], where, _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
    prisma.nDREvent.groupBy({ by: ['action'], where, _count: { id: true } }),
  ]);
  
  return { 
    total, 
    byReason: byReason.map(r => ({ reason: r.reason, count: r._count.id })), 
    byAction: byAction.map(a => ({ action: a.action, count: a._count.id })) 
  };
}

module.exports = {
  getOverview,
  getCourierPerformance,
  getClientAnalytics,
  getMonthlyTrend,
  getNdrAnalytics
};
