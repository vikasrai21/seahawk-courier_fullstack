'use strict';
// ops.routes.js — Operations endpoints
// Bulk status update, pending actions, courier manifest, client comparison

const router = require('express').Router();
const prisma  = require('../config/prisma');
const R       = require('../utils/response');
const { protect, requireRole, staffOnly } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const stateMachine = require('../services/stateMachine');
const walletSvc = require('../services/wallet.service');
const { auditLog } = require('../utils/audit');
const logger = require('../utils/logger');
const { bulkStatusSchema } = require('../validators/ops.validator');

router.use(protect, staffOnly);

// ── POST /api/ops/bulk-status — bulk update shipment statuses ─────────────
router.post('/bulk-status', validate(bulkStatusSchema), async (req, res) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || !ids.length) return R.error(res, 'ids array required', 400);
  if (!status) return R.error(res, 'status required', 400);

  let updated = 0, failed = 0;
  const errors = [];

  for (const id of ids) {
    try {
      const shipment = await prisma.shipment.findUnique({ where: { id: parseInt(id) } });
      if (!shipment) { failed++; continue; }
      const canonicalStatus = stateMachine.normalizeStatus(status);

      // Enforce state machine
      stateMachine.assertValidTransition(shipment.status, canonicalStatus);

      if (stateMachine.normalizeStatus(shipment.status) === canonicalStatus) {
        updated++;
        continue;
      }

      await prisma.shipment.update({
        where: { id: parseInt(id) },
        data:  { status: canonicalStatus, updatedById: req.user?.id },
      });

      // Log tracking event
      await prisma.trackingEvent.create({
        data: { shipmentId: parseInt(id), awb: shipment.awb, status: canonicalStatus, description: `Bulk status update to ${canonicalStatus}`, source: 'MANUAL' },
      }).catch(() => {});

      // Wallet refund on RTO/Cancel
      if (stateMachine.shouldRefund(canonicalStatus) && shipment.amount > 0) {
        await walletSvc.creditShipmentRefund({
          clientCode: shipment.clientCode,
          awb: shipment.awb,
          amount: shipment.amount,
          reason: canonicalStatus,
        });
      }

      updated++;
    } catch (err) {
      failed++;
      errors.push({ id, error: err.message });
    }
  }

  await auditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'BULK_STATUS_UPDATE', entity: 'SHIPMENT', newValue: { ids, status, updated, failed }, ip: req.ip }).catch(() => {});

  R.ok(res, { updated, failed, errors: errors.slice(0, 10) },
    `${updated} shipments updated to ${status}${failed ? `, ${failed} failed` : ''}`);
});

// ── GET /api/ops/pending-actions — dashboard pending actions widget ────────
router.get('/pending-actions', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    const [
      pendingNDRs,
      draftInvoices,
      todayPickups,
      rtoShipments,
      overdueShipments,
    ] = await Promise.all([
      // NDRs with no action taken
      prisma.nDREvent.count({ where: { action: 'PENDING' } }),
      // Draft invoices older than 3 days
      prisma.invoice.count({ where: { status: 'DRAFT', createdAt: { lt: new Date(Date.now() - 3 * 86400000) } } }),
      // Pickups scheduled for today
      prisma.pickupRequest.count({ where: { scheduledDate: today, status: 'PENDING' } }),
      // RTO shipments needing attention (older than 3 days)
      prisma.shipment.count({ where: { status: 'RTO', updatedAt: { lt: new Date(Date.now() - 3 * 86400000) } } }),
      // Shipments in transit for more than 7 days
      prisma.shipment.count({ where: { status: 'InTransit', date: { lte: sevenDaysAgo } } }),
    ]);

    R.ok(res, { pendingNDRs, draftInvoices, todayPickups, rtoShipments, overdueShipments,
      total: pendingNDRs + draftInvoices + todayPickups + rtoShipments + overdueShipments });
  } catch (err) { R.error(res, err.message); }
});

// ── GET /api/ops/courier-manifest — end of day courier manifest ───────────
router.get('/courier-manifest', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const shipments = await prisma.shipment.findMany({
      where: { date },
      include: { client: { select: { company: true } } },
      orderBy: [{ courier: 'asc' }, { id: 'asc' }],
    });

    // Group by courier
    const byCourier = {};
    for (const s of shipments) {
      const c = s.courier || 'Unassigned';
      if (!byCourier[c]) byCourier[c] = { courier: c, shipments: [], totalPieces: 0, totalWeight: 0, totalAmount: 0 };
      byCourier[c].shipments.push(s);
      byCourier[c].totalPieces++;
      byCourier[c].totalWeight += s.weight || 0;
      byCourier[c].totalAmount += s.amount || 0;
    }

    R.ok(res, {
      date,
      totalShipments: shipments.length,
      totalWeight: shipments.reduce((a, s) => a + (s.weight || 0), 0),
      totalAmount: shipments.reduce((a, s) => a + (s.amount || 0), 0),
      couriers: Object.values(byCourier),
    });
  } catch (err) { R.error(res, err.message); }
});

// ── GET /api/ops/client-comparison — month over month per client ──────────
router.get('/client-comparison', requireRole('ADMIN', 'OPS_MANAGER'), async (req, res) => {
  try {
    const now  = new Date();
    const thisM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastM = now.getMonth() === 0
      ? `${now.getFullYear() - 1}-12`
      : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;

    const thisFrom  = `${thisM}-01`;
    const thisTo    = now.toISOString().split('T')[0];
    const lastFrom  = `${lastM}-01`;
    const lastDays  = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    const lastTo    = `${lastM}-${lastDays}`;

    const [thisMonth, lastMonth] = await Promise.all([
      prisma.shipment.groupBy({ by: ['clientCode'], where: { date: { gte: thisFrom, lte: thisTo } }, _count: { id: true }, _sum: { amount: true } }),
      prisma.shipment.groupBy({ by: ['clientCode'], where: { date: { gte: lastFrom, lte: lastTo } }, _count: { id: true }, _sum: { amount: true } }),
    ]);

    // Get client details
    const allCodes = [...new Set([...thisMonth.map(r => r.clientCode), ...lastMonth.map(r => r.clientCode)])];
    const clients  = await prisma.client.findMany({ where: { code: { in: allCodes } }, select: { code: true, company: true } });
    const clientMap = Object.fromEntries(clients.map(c => [c.code, c.company]));

    const lastMap  = Object.fromEntries(lastMonth.map(r => [r.clientCode, { count: r._count.id, revenue: r._sum.amount || 0 }]));

    const comparison = thisMonth.map(r => {
      const last = lastMap[r.clientCode] || { count: 0, revenue: 0 };
      const countDiff   = last.count   > 0 ? ((r._count.id - last.count) / last.count * 100)   : null;
      const revenueDiff = last.revenue > 0 ? ((r._sum.amount - last.revenue) / last.revenue * 100) : null;
      return {
        code:          r.clientCode,
        company:       clientMap[r.clientCode] || r.clientCode,
        thisCount:     r._count.id,
        lastCount:     last.count,
        thisRevenue:   r._sum.amount || 0,
        lastRevenue:   last.revenue,
        countChange:   countDiff   !== null ? parseFloat(countDiff.toFixed(1))   : null,
        revenueChange: revenueDiff !== null ? parseFloat(revenueDiff.toFixed(1)) : null,
      };
    }).sort((a, b) => b.thisRevenue - a.thisRevenue);

    R.ok(res, { thisMonth: thisM, lastMonth: lastM, clients: comparison });
  } catch (err) { R.error(res, err.message); }
});

// ── GET /api/ops/rto-alerts — couriers with high RTO rates ────────────────
router.get('/rto-alerts', async (req, res) => {
  try {
    const thirtyDays = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const couriers = await prisma.shipment.groupBy({
      by: ['courier'], where: { date: { gte: thirtyDays }, courier: { not: null } }, _count: { id: true },
    });

    const alerts = [];
    for (const c of couriers) {
      if (!c.courier || c._count.id < 5) continue;
      const rto = await prisma.shipment.count({ where: { courier: c.courier, date: { gte: thirtyDays }, status: 'RTO' } });
      const rate = (rto / c._count.id * 100);
      if (rate >= 15) {
        alerts.push({ courier: c.courier, total: c._count.id, rto, rate: parseFloat(rate.toFixed(1)) });
      }
    }
    R.ok(res, { alerts: alerts.sort((a, b) => b.rate - a.rate) });
  } catch (err) { R.error(res, err.message); }
});

// ── GET /api/ops/recent-activity — global activity feed ───────────────────
router.get('/recent-activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 15;
    const logs = await prisma.auditLog.findMany({
      where:   { entity: { in: ['SHIPMENT', 'INVOICE', 'CLIENT'] } },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take:    limit,
    });
    R.ok(res, logs.map(l => ({
      id:       l.id,
      action:   l.action,
      entity:   l.entity,
      entityId: l.entityId,
      user:     l.user?.name || l.userEmail || 'System',
      detail:   l.newValue,
      time:     l.createdAt,
    })));
  } catch (err) { R.error(res, err.message); }
});

// ── GET /api/ops/profit-summary — profit/margin overview ─────────────────
router.get('/profit-summary', requireRole('ADMIN', 'OPS_MANAGER'), async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const where = {};
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = dateFrom;
      if (dateTo)   where.date.lte = dateTo;
    }

    // Revenue = amount charged to clients
    const revenue = await prisma.shipment.aggregate({ where, _sum: { amount: true, weight: true }, _count: { id: true } });

    // Per-courier breakdown
    const byCourier = await prisma.shipment.groupBy({
      by: ['courier'], where: { ...where, courier: { not: null } },
      _sum: { amount: true }, _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    R.ok(res, {
      totalRevenue: revenue._sum.amount || 0,
      totalWeight:  revenue._sum.weight || 0,
      totalShipments: revenue._count.id || 0,
      avgPerShipment: revenue._count.id ? (revenue._sum.amount || 0) / revenue._count.id : 0,
      byCourier: byCourier.map(c => ({ courier: c.courier, revenue: c._sum.amount || 0, count: c._count.id })),
    });
  } catch (err) { R.error(res, err.message); }
});

// ── GET /api/ops/dashboard — consolidated analytics ───────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const [
      todayCount, weekCount, todayRev, monthRev,
      pendingCount, monthDelivered, monthTotal,
      courierData, clientData, dailyData, recentShipments,
      quoteStats, reconStats
    ] = await Promise.all([
      prisma.shipment.count({ where: { date: today } }),
      prisma.shipment.count({ where: { date: { gte: sevenDaysAgo } } }),
      prisma.shipment.aggregate({ where: { date: today }, _sum: { amount: true } }),
      prisma.shipment.aggregate({ where: { date: { gte: monthStart } }, _sum: { amount: true } }),
      prisma.shipment.count({ where: { status: { in: ['Booked', 'InTransit'] } } }),
      prisma.shipment.count({ where: { status: 'Delivered', date: { gte: monthStart } } }),
      prisma.shipment.count({ where: { date: { gte: monthStart } } }),
      prisma.shipment.groupBy({ by: ['courier'], where: { date: { gte: monthStart }, courier: { not: null } }, _sum: { amount: true }, _count: { id: true }, orderBy: { _sum: { amount: 'desc' } } }),
      prisma.shipment.groupBy({ by: ['clientCode'], where: { date: { gte: monthStart } }, _sum: { amount: true }, _count: { id: true }, orderBy: { _sum: { amount: 'desc' } }, take: 10 }),
      prisma.shipment.groupBy({ by: ['date'], where: { date: { gte: sevenDaysAgo } }, _count: { id: true }, _sum: { amount: true }, orderBy: { date: 'asc' } }),
      prisma.shipment.findMany({ where: { date: { gte: sevenDaysAgo } }, take: 15, orderBy: { createdAt: 'desc' } }),
      prisma.quote.aggregate({ _count: { id: true }, _avg: { profit: true, margin: true } }),
      prisma.courierInvoice.count({ where: { status: 'SUCCESS' } }),
    ]);

    // Enrich client data
    const clientCodes = clientData.map(c => c.clientCode);
    const clients = await prisma.client.findMany({ where: { code: { in: clientCodes } }, select: { code: true, company: true } });
    const clientMap = Object.fromEntries(clients.map(c => [c.code, c.company]));

    const responseData = {
      overview: {
        todayShipments: todayCount,
        weekShipments: weekCount,
        todayRevenue: todayRev._sum.amount || 0,
        monthRevenue: monthRev._sum.amount || 0,
        pendingCount,
        deliveredCount: monthDelivered,
        deliveryRate: monthTotal > 0 ? (monthDelivered / monthTotal * 100) : 0,
      },
      courierBreakdown: courierData.map(c => ({ courier: c.courier, revenue: c._sum.amount || 0, count: c._count.id })),
      topClients: clientData.map(c => ({ code: c.clientCode, company: clientMap[c.clientCode] || c.clientCode, revenue: c._sum.amount || 0, count: c._count.id })),
      dailyTrend: dailyData.map(d => ({ date: d.date, count: d._count.id, revenue: d._sum.amount || 0 })),
      recentShipments: recentShipments.map(s => ({
        id: s.id, date: s.date, awb: s.awb, consignee: s.consignee, destination: s.destination, courier: s.courier, amount: s.amount, status: s.status
      })),
      quotes: {
        total: quoteStats._count.id || 0,
        avgProfit: quoteStats._avg.profit || 0,
        avgMargin: quoteStats._avg.margin || 0,
      },
      reconciliation: {
        totalInvoices: reconStats,
      }
    };

    R.ok(res, responseData);
  } catch (err) {
    logger.error(`Dashboard error: ${err.message}`);
    R.error(res, err.message);
  }
});

module.exports = router;
