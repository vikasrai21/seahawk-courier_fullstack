// src/services/analytics.service.js
"use strict";
const prisma = require("../config/prisma");

function _dateFilter(from, to) {
  if (!from && !to) return {};
  const filter = { date: {} };
  if (from) filter.date.gte = from;
  if (to) filter.date.lte = to;
  return filter;
}

async function _getDailyTrend(dateFilter = {}) {
  const where = dateFilter?.date
    ? { date: dateFilter.date }
    : {
        date: {
          gte: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
        },
      };

  const results = await prisma.shipment.groupBy({
    by: ["date"],
    where,
    _count: { id: true },
    _sum: { amount: true },
    orderBy: { date: "asc" },
  });
  return results.map((r) => ({
    date: r.date,
    count: Number(r._count.id),
    revenue: Number(r._sum.amount) || 0,
  }));
}

async function _calcAvgDeliveryTime(courier, filter) {
  try {
    const delivered = await prisma.shipment.findMany({
      where: { ...filter, courier, status: "Delivered" },
      include: {
        trackingEvents: {
          where: { status: { in: ["Booked", "Delivered"] } },
          orderBy: { timestamp: "asc" },
        },
      },
      take: 100,
    });
    const durations = delivered
      .map((s) => {
        const b = s.trackingEvents.find((e) => e.status === "Booked");
        const d = s.trackingEvents.find((e) => e.status === "Delivered");
        if (!b || !d) return null;
        return (new Date(d.timestamp) - new Date(b.timestamp)) / (1000 * 86400);
      })
      .filter((d) => d !== null && d > 0);
    return durations.length > 0
      ? parseFloat(
          (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1),
        )
      : null;
  } catch {
    return null;
  }
}

async function getOverview(dateFrom, dateTo) {
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
    prisma.shipment.count({ where: { ...dateFilter, status: "Delivered" } }),
    prisma.shipment.count({ where: { ...dateFilter, status: "RTO" } }),
    prisma.shipment.count({
      where: { ...dateFilter, ndrStatus: { not: null } },
    }),
    prisma.shipment.aggregate({
      where: dateFilter,
      _sum: { amount: true, weight: true },
    }),
    prisma.shipment.groupBy({
      by: ["status"],
      where: dateFilter,
      _count: { id: true },
    }),
    prisma.shipment.groupBy({
      by: ["courier"],
      where: { ...dateFilter, courier: { not: "" } },
      _count: { id: true },
      _sum: { amount: true },
    }),
    _getDailyTrend(dateFilter),
  ]);

  const deliveryRate =
    totalShipments > 0
      ? ((delivered / totalShipments) * 100).toFixed(1)
      : "0.0";
  const rtoRate =
    totalShipments > 0 ? ((rto / totalShipments) * 100).toFixed(1) : "0.0";

  return {
    kpis: {
      totalShipments,
      delivered,
      rto,
      ndr,
      deliveryRate: `${deliveryRate}%`,
      rtoRate: `${rtoRate}%`,
      totalRevenue: revenue._sum.amount || 0,
      totalWeight: revenue._sum.weight || 0,
    },
    byStatus: Object.fromEntries(
      byStatus.map((r) => [r.status || "Unknown", r._count.id]),
    ),
    byCourier: Object.fromEntries(
      byCourier.map((r) => [r.courier || "Unknown", r._count.id]),
    ),
    courierRevenue: byCourier.map((c) => ({
      courier: c.courier,
      revenue: c._sum.amount || 0,
      count: c._count.id,
    })),
    dailyTrend: recentTrend,
  };
}

async function getCourierPerformance(dateFrom, dateTo) {
  const dateFilter = _dateFilter(dateFrom, dateTo);

  const couriers = await prisma.shipment.groupBy({
    by: ["courier"],
    where: { ...dateFilter, courier: { not: "" } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  const performance = await Promise.all(
    couriers.map(async (c) => {
      const courier = c.courier;
      const total = c._count.id;
      if (!courier) return null;
      const cf = { ...dateFilter, courier };

      const [delivered, rto, ndr, avgDeliveryTime, revenue] = await Promise.all(
        [
          prisma.shipment.count({ where: { ...cf, status: "Delivered" } }),
          prisma.shipment.count({ where: { ...cf, status: "RTO" } }),
          prisma.shipment.count({ where: { ...cf, ndrStatus: { not: null } } }),
          _calcAvgDeliveryTime(courier, cf),
          prisma.shipment.aggregate({
            where: cf,
            _sum: { amount: true, weight: true },
          }),
        ],
      );

      return {
        courier,
        total,
        delivered,
        rto,
        ndr,
        deliveryRate:
          total > 0 ? parseFloat(((delivered / total) * 100).toFixed(1)) : 0,
        rtoRate: total > 0 ? parseFloat(((rto / total) * 100).toFixed(1)) : 0,
        ndrRate: total > 0 ? parseFloat(((ndr / total) * 100).toFixed(1)) : 0,
        avgDeliveryDays: avgDeliveryTime,
        revenue: revenue._sum.amount || 0,
        totalWeight: revenue._sum.weight || 0,
      };
    }),
  );
  return { couriers: performance.filter(Boolean) };
}

async function getClientAnalytics(dateFrom, dateTo, limit = 15) {
  const dateFilter = _dateFilter(dateFrom, dateTo);

  const clients = await prisma.shipment.groupBy({
    by: ["clientCode"],
    where: dateFilter,
    _count: { id: true },
    _sum: { amount: true, weight: true },
    orderBy: { _count: { id: "desc" } },
    take: parseInt(limit),
  });

  const enriched = await Promise.all(
    clients.map(async (c) => {
      const code = c.clientCode;
      const client = await prisma.client.findUnique({
        where: { code },
        select: { company: true, phone: true },
      });
      return {
        code,
        company: client?.company || code,
        count: c._count.id,
        revenue: c._sum.amount || 0,
        weight: c._sum.weight || 0,
      };
    }),
  );
  return { clients: enriched };
}

async function getMonthlyTrend(year) {
  const months = [];

  for (let m = 1; m <= 12; m++) {
    const from = `${year}-${String(m).padStart(2, "0")}-01`;
    const to = `${year}-${String(m).padStart(2, "0")}-${new Date(year, m, 0).getDate()}`;
    const [count, revenue, delivered] = await Promise.all([
      prisma.shipment.count({ where: { date: { gte: from, lte: to } } }),
      prisma.shipment.aggregate({
        where: { date: { gte: from, lte: to } },
        _sum: { amount: true },
      }),
      prisma.shipment.count({
        where: { date: { gte: from, lte: to }, status: "Delivered" },
      }),
    ]);
    months.push({
      month: m,
      name: new Date(year, m - 1, 1).toLocaleString("en-IN", {
        month: "short",
      }),
      count,
      revenue: revenue._sum.amount || 0,
      deliveryRate:
        count > 0 ? parseFloat(((delivered / count) * 100).toFixed(1)) : 0,
    });
  }
  return { year: parseInt(year), months };
}

async function getNdrAnalytics(dateFrom, dateTo) {
  const where = {};
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo + "T23:59:59Z");
  }

  const [total, byReason, byAction] = await Promise.all([
    prisma.nDREvent.count({ where }),
    prisma.nDREvent.groupBy({
      by: ["reason"],
      where,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.nDREvent.groupBy({ by: ["action"], where, _count: { id: true } }),
  ]);

  return {
    total,
    byReason: byReason.map((r) => ({ reason: r.reason, count: r._count.id })),
    byAction: byAction.map((a) => ({ action: a.action, count: a._count.id })),
  };
}

async function getSLACompliance(clientCode, dateFrom, dateTo) {
  const where = { status: "Delivered" };
  if (clientCode) where.clientCode = clientCode;
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = dateFrom;
    if (dateTo) where.date.lte = dateTo;
  }

  // Fetch delivered shipments with tracking events to calculate SLA
  const delivered = await prisma.shipment.findMany({
    where,
    select: {
      awb: true,
      trackingEvents: {
        where: { status: { in: ["Booked", "Delivered"] } },
        orderBy: { timestamp: "asc" },
      },
    },
    take: 1000, // Limit for performance, in a real env we'd use raw SQL or background jobs for large datasets
  });

  let total = 0;
  const buckets = {
    sameDay: 0, // <= 1 day
    twoDays: 0, // <= 2 days
    threeDays: 0, // <= 3 days
    fiveDays: 0, // <= 5 days
    sevenDays: 0, // <= 7 days
    overdue: 0, // > 7 days
  };

  delivered.forEach((s) => {
    const b = s.trackingEvents.find((e) => e.status === "Booked");
    const d = s.trackingEvents.find((e) => e.status === "Delivered");
    if (!b || !d) return;

    const days =
      (new Date(d.timestamp) - new Date(b.timestamp)) / (1000 * 86400);
    if (days <= 0) return; // Ignore invalid data

    total++;
    if (days <= 1) buckets.sameDay++;
    else if (days <= 2) buckets.twoDays++;
    else if (days <= 3) buckets.threeDays++;
    else if (days <= 5) buckets.fiveDays++;
    else if (days <= 7) buckets.sevenDays++;
    else buckets.overdue++;
  });

  return {
    total,
    buckets,
    percentages:
      total > 0
        ? {
            sameDay: parseFloat(((buckets.sameDay / total) * 100).toFixed(1)),
            twoDays: parseFloat(((buckets.twoDays / total) * 100).toFixed(1)),
            threeDays: parseFloat(
              ((buckets.threeDays / total) * 100).toFixed(1),
            ),
            fiveDays: parseFloat(((buckets.fiveDays / total) * 100).toFixed(1)),
            sevenDays: parseFloat(
              ((buckets.sevenDays / total) * 100).toFixed(1),
            ),
            overdue: parseFloat(((buckets.overdue / total) * 100).toFixed(1)),
          }
        : null,
  };
}

async function getCostPerShipment(clientCode, dateFrom, dateTo) {
  const where = {};
  if (clientCode) where.clientCode = clientCode;
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = dateFrom;
    if (dateTo) where.date.lte = dateTo;
  }

  // To avoid huge queries, let's group by date and courier
  const daily = await prisma.shipment.groupBy({
    by: ["date"],
    where,
    _count: { id: true },
    _sum: { amount: true },
    orderBy: { date: "asc" },
    take: 30, // Last 30 days of data in the range
  });

  const trend = daily.map((d) => ({
    date: d.date,
    count: d._count.id,
    revenue: d._sum.amount || 0,
    costPerShipment:
      d._count.id > 0
        ? parseFloat(((d._sum.amount || 0) / d._count.id).toFixed(2))
        : 0,
  }));

  const byCourier = await prisma.shipment.groupBy({
    by: ["courier"],
    where,
    _count: { id: true },
    _sum: { amount: true },
    orderBy: { _count: { id: "desc" } },
  });

  const courierStats = byCourier
    .filter((c) => c.courier)
    .map((c) => ({
      courier: c.courier,
      count: c._count.id,
      revenue: c._sum.amount || 0,
      costPerShipment:
        c._count.id > 0
          ? parseFloat(((c._sum.amount || 0) / c._count.id).toFixed(2))
          : 0,
    }));

  return { trend, byCourier: courierStats };
}

module.exports = {
  getOverview,
  getCourierPerformance,
  getClientAnalytics,
  getMonthlyTrend,
  getNdrAnalytics,
  getSLACompliance,
  getCostPerShipment,
};
