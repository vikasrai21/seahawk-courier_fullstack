"use strict";
// ops-analytics.routes.js — Client comparison, RTO alerts, profit summary,
//                           client health, and consolidated dashboard
// Split from ops.routes.js for maintainability

const router = require("express").Router();
const prisma = require("../config/prisma");
const R = require("../utils/response");
const { requireRole } = require("../middleware/auth.middleware");

// ── GET /api/ops/client-comparison ────────────────────────────────────────
router.get(
  "/client-comparison",
  requireRole("ADMIN", "OPS_MANAGER"),
  async (req, res) => {
    try {
      const now = new Date();
      const thisM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const lastM =
        now.getMonth() === 0
          ? `${now.getFullYear() - 1}-12`
          : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0")}`;

      const thisFrom = `${thisM}-01`;
      const thisTo = now.toISOString().split("T")[0];
      const lastFrom = `${lastM}-01`;
      const lastDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      const lastTo = `${lastM}-${lastDays}`;

      const [thisMonth, lastMonth] = await Promise.all([
        prisma.shipment.groupBy({
          by: ["clientCode"],
          where: { date: { gte: thisFrom, lte: thisTo } },
          _count: { id: true },
          _sum: { amount: true },
        }),
        prisma.shipment.groupBy({
          by: ["clientCode"],
          where: { date: { gte: lastFrom, lte: lastTo } },
          _count: { id: true },
          _sum: { amount: true },
        }),
      ]);

      const allCodes = [
        ...new Set([
          ...thisMonth.map((r) => r.clientCode),
          ...lastMonth.map((r) => r.clientCode),
        ]),
      ];
      const clients = await prisma.client.findMany({
        where: { code: { in: allCodes } },
        select: { code: true, company: true },
      });
      const clientMap = Object.fromEntries(
        clients.map((c) => [c.code, c.company]),
      );

      const lastMap = Object.fromEntries(
        lastMonth.map((r) => [
          r.clientCode,
          { count: r._count.id, revenue: r._sum.amount || 0 },
        ]),
      );

      const comparison = thisMonth
        .map((r) => {
          const last = lastMap[r.clientCode] || { count: 0, revenue: 0 };
          const countDiff =
            last.count > 0
              ? ((r._count.id - last.count) / last.count) * 100
              : null;
          const revenueDiff =
            last.revenue > 0
              ? ((r._sum.amount - last.revenue) / last.revenue) * 100
              : null;
          return {
            code: r.clientCode,
            company: clientMap[r.clientCode] || r.clientCode,
            thisCount: r._count.id,
            lastCount: last.count,
            thisRevenue: r._sum.amount || 0,
            lastRevenue: last.revenue,
            countChange:
              countDiff !== null ? parseFloat(countDiff.toFixed(1)) : null,
            revenueChange:
              revenueDiff !== null ? parseFloat(revenueDiff.toFixed(1)) : null,
          };
        })
        .sort((a, b) => b.thisRevenue - a.thisRevenue);

      R.ok(res, { thisMonth: thisM, lastMonth: lastM, clients: comparison });
    } catch (err) {
      R.error(res, err.message);
    }
  },
);

// ── GET /api/ops/rto-alerts ───────────────────────────────────────────────
router.get("/rto-alerts", async (req, res) => {
  try {
    const thirtyDays = new Date(Date.now() - 30 * 86400000)
      .toISOString()
      .split("T")[0];
    // Single query: get total + RTO counts per courier in parallel (no N+1)
    const [courierTotals, courierRTO] = await Promise.all([
      prisma.shipment.groupBy({
        by: ["courier"],
        where: { date: { gte: thirtyDays }, courier: { not: null } },
        _count: { id: true },
      }),
      prisma.shipment.groupBy({
        by: ["courier"],
        where: { date: { gte: thirtyDays }, courier: { not: null }, status: "RTO" },
        _count: { id: true },
      }),
    ]);

    const rtoMap = Object.fromEntries(
      courierRTO.map((r) => [r.courier, r._count.id])
    );

    const alerts = [];
    for (const c of courierTotals) {
      if (!c.courier || c._count.id < 5) continue;
      const rto = rtoMap[c.courier] || 0;
      const rate = (rto / c._count.id) * 100;
      if (rate >= 15) {
        alerts.push({
          courier: c.courier,
          total: c._count.id,
          rto,
          rate: parseFloat(rate.toFixed(1)),
        });
      }
    }
    R.ok(res, { alerts: alerts.sort((a, b) => b.rate - a.rate) });
  } catch (err) {
    R.error(res, err.message);
  }
});

// ── GET /api/ops/recent-activity ──────────────────────────────────────────
router.get("/recent-activity", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 15;
    const logs = await prisma.auditLog.findMany({
      where: { entity: { in: ["SHIPMENT", "INVOICE", "CLIENT"] } },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    R.ok(
      res,
      logs.map((l) => ({
        id: l.id,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        user: l.user?.name || l.userEmail || "System",
        detail: l.newValue,
        time: l.createdAt,
      })),
    );
  } catch (err) {
    R.error(res, err.message);
  }
});

// ── GET /api/ops/profit-summary ──────────────────────────────────────────
router.get(
  "/profit-summary",
  requireRole("ADMIN", "OPS_MANAGER"),
  async (req, res) => {
    try {
      const { dateFrom, dateTo } = req.query;
      const where = {};
      if (dateFrom || dateTo) {
        where.date = {};
        if (dateFrom) where.date.gte = dateFrom;
        if (dateTo) where.date.lte = dateTo;
      }

      const revenue = await prisma.shipment.aggregate({
        where,
        _sum: { amount: true, weight: true, cost: true, profit: true },
        _count: { id: true },
      });

      const rto = await prisma.shipment.aggregate({
        where: { ...where, status: "RTO" },
        _sum: { cost: true, amount: true },
        _count: { id: true },
      });

      const byCourier = await prisma.shipment.groupBy({
        by: ["courier"],
        where: { ...where, courier: { not: null } },
        _sum: { amount: true, cost: true, profit: true },
        _count: { id: true },
        orderBy: { _sum: { amount: "desc" } },
      });

      const totalRev = revenue._sum.amount || 0;
      const totalCost = revenue._sum.cost || 0;
      const totalProfit = revenue._sum.profit || (totalRev - totalCost);
      const margin = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0;

      R.ok(res, {
        totalRevenue: totalRev,
        totalCost: totalCost,
        totalProfit: totalProfit,
        marginPct: Number(margin.toFixed(2)),
        totalWeight: revenue._sum.weight || 0,
        totalShipments: revenue._count.id || 0,
        rtoBleed: rto._sum.cost || 0,
        rtoCount: rto._count.id || 0,
        avgPerShipment: revenue._count.id ? totalRev / revenue._count.id : 0,
        byCourier: byCourier.map((c) => {
          const rev = c._sum.amount || 0;
          const cCost = c._sum.cost || 0;
          const cProfit = c._sum.profit || (rev - cCost);
          return {
            courier: c.courier,
            revenue: rev,
            cost: cCost,
            profit: cProfit,
            marginPct: rev > 0 ? Number(((cProfit / rev) * 100).toFixed(2)) : 0,
            count: c._count.id,
          };
        }),
      });
    } catch (err) {
      R.error(res, err.message);
    }
  },
);

// ── GET /api/ops/client-health ─────────────────────────────────────────────
router.get(
  "/client-health",
  requireRole("ADMIN", "OPS_MANAGER"),
  async (req, res) => {
    try {
      // Get all clients
      const clients = await prisma.client.findMany({
        where: { active: true },
        select: { code: true, company: true, walletBalance: true },
      });

      // Get shipment stats for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateStr = thirtyDaysAgo.toISOString().split("T")[0];

      const stats = await prisma.shipment.groupBy({
        by: ["clientCode"],
        where: { date: { gte: dateStr } },
        _count: { id: true },
        _sum: { amount: true, cost: true, profit: true },
      });

      const rtoStats = await prisma.shipment.groupBy({
        by: ["clientCode"],
        where: { date: { gte: dateStr }, status: "RTO" },
        _count: { id: true },
      });

      const statsMap = stats.reduce((acc, curr) => {
        acc[curr.clientCode] = curr;
        return acc;
      }, {});

      const rtoMap = rtoStats.reduce((acc, curr) => {
        acc[curr.clientCode] = curr._count.id;
        return acc;
      }, {});

      const healthData = clients.map((c) => {
        const clientStats = statsMap[c.code] || { _count: { id: 0 }, _sum: { amount: 0, cost: 0, profit: 0 } };
        const total = clientStats._count.id;
        const rto = rtoMap[c.code] || 0;
        const revenue = clientStats._sum.amount || 0;
        const profit = clientStats._sum.profit || 0;
        
        const rtoRate = total > 0 ? (rto / total) * 100 : 0;
        const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;

        // Grading Logic
        let grade = "A";
        if (rtoRate > 20 || marginPct < 5) grade = "F";
        else if (rtoRate > 15 || marginPct < 10) grade = "D";
        else if (rtoRate > 10 || marginPct < 15) grade = "C";
        else if (rtoRate > 5 || marginPct < 20) grade = "B";

        return {
          code: c.code,
          company: c.company,
          walletBalance: c.walletBalance,
          volume30d: total,
          revenue30d: revenue,
          profit30d: profit,
          marginPct: Number(marginPct.toFixed(2)),
          rtoRate: Number(rtoRate.toFixed(2)),
          grade,
        };
      });

      R.ok(res, healthData.sort((a, b) => b.volume30d - a.volume30d));
    } catch (err) {
      R.error(res, err.message);
    }
  }
);

// ── GET /api/ops/dashboard — consolidated analytics with intelligence ─────
const dashboardSvc = require('../services/dashboard.service');
router.get('/dashboard', async (req, res) => {
  try {
    const data = await dashboardSvc.getDashboardData();
    R.ok(res, data);
  } catch (err) {
    R.error(res, err.message);
  }
});

module.exports = router;
