'use strict';
// ops.routes.js — Operations endpoints
// Bulk status update, pending actions, courier manifest, client comparison

const router = require('express').Router();
const prisma  = require('../config/prisma');
const R       = require('../utils/response');
const { protect, requireRole } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const stateMachine = require('../services/stateMachine');
const walletSvc = require('../services/wallet.service');
const reconciliationSvc = require('../services/reconciliation.service');
const correctionLearner = require('../services/correctionLearner.service');
const scannerQuality = require('../services/scannerQuality.service');
const { auditLog } = require('../utils/audit');
const logger = require('../utils/logger');
const { bulkStatusSchema } = require('../validators/ops.validator');
const adminAssistant = require('../services/adminAssistant.service');

router.use(protect);

function allowOpsAssistant(req, res, next) {
  if (!req.user) return R.unauthorized(res);
  if (req.user.isOwner || ['ADMIN', 'OPS_MANAGER'].includes(req.user.role)) return next();
  return R.forbidden(res, 'Access denied. Required: ADMIN, OPS_MANAGER, or owner access');
}

function staffOrOwner(req, res, next) {
  if (!req.user) return R.unauthorized(res);
  if (req.user.isOwner || ['ADMIN', 'OPS_MANAGER', 'STAFF'].includes(req.user.role)) return next();
  return R.forbidden(res, 'Access denied.');
}

// ── POST /api/ops/assistant/chat — SkyAI internal ops assistant ───────────
router.post('/assistant/chat', allowOpsAssistant, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) return R.error(res, 'message is required', 400);
    if (message.length > 500) return R.error(res, 'message too long', 400);

    const { reply, action } = await adminAssistant.chat({ message: message.trim(), history });

    let data = null;
    let finalReply = reply;
    if (action?.requiresData) {
      data = await adminAssistant.resolveAction(action);
      finalReply = adminAssistant.summarizeAction(action, data) || reply;
    } else if (action?.type === 'GET_OVERVIEW') {
      data = await adminAssistant.resolveAction(action);
      finalReply = adminAssistant.summarizeAction(action, data) || reply;
    }

    R.ok(res, { reply: finalReply, action, data });
  } catch (err) {
    logger.error(`SkyAI route error: ${err.message}`);
    R.error(res, 'AI assistant error', 500);
  }
});

// ── POST /api/ops/assistant/execute — run a confirmed action ─────────────
router.post('/assistant/execute', allowOpsAssistant, async (req, res) => {
  try {
    const { action } = req.body;
    if (!action?.type) return R.error(res, 'action is required', 400);
    const data = await adminAssistant.resolveAction(action);
    R.ok(res, { data });
  } catch (err) {
    logger.error(`SkyAI execute error: ${err.message}`);
    R.error(res, 'Action execution error', 500);
  }
});

router.use(staffOrOwner);

// ── GET /api/ops/scanner-quality ────────────────────────────────────────────
router.get('/scanner-quality', allowOpsAssistant, async (req, res) => {
  try {
    const windowMinutes = Math.max(5, parseInt(req.query.windowMinutes, 10) || 240);
    const [qualitySnapshot, correctionMetrics] = await Promise.all([
      Promise.resolve(scannerQuality.getScannerQualitySnapshot({ windowMinutes })),
      correctionLearner.getCorrectionMetrics(),
    ]);
    R.ok(res, {
      ...qualitySnapshot,
      persistedCorrections: correctionMetrics,
    });
  } catch (err) {
    R.error(res, err.message);
  }
});

// ── POST /api/ops/bulk-status ─────────────────────────────────────────────
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

      stateMachine.assertValidTransition(shipment.status, canonicalStatus);

      if (stateMachine.normalizeStatus(shipment.status) === canonicalStatus) {
        updated++;
        continue;
      }

      await prisma.shipment.update({
        where: { id: parseInt(id) },
        data:  { status: canonicalStatus, updatedById: req.user?.id },
      });

      await prisma.trackingEvent.create({
        data: { shipmentId: parseInt(id), awb: shipment.awb, status: canonicalStatus, description: `Bulk status update to ${canonicalStatus}`, source: 'MANUAL' },
      }).catch(() => {});

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

// ── GET /api/ops/pending-actions ──────────────────────────────────────────
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
      prisma.nDREvent.count({ where: { action: 'PENDING' } }),
      prisma.invoice.count({ where: { status: 'DRAFT', createdAt: { lt: new Date(Date.now() - 3 * 86400000) } } }),
      prisma.pickupRequest.count({ where: { scheduledDate: today, status: 'PENDING' } }),
      prisma.shipment.count({ where: { status: 'RTO', updatedAt: { lt: new Date(Date.now() - 3 * 86400000) } } }),
      prisma.shipment.count({ where: { status: 'InTransit', date: { lte: sevenDaysAgo } } }),
    ]);

    R.ok(res, { pendingNDRs, draftInvoices, todayPickups, rtoShipments, overdueShipments,
      total: pendingNDRs + draftInvoices + todayPickups + rtoShipments + overdueShipments });
  } catch (err) { R.error(res, err.message); }
});

// ── GET /api/ops/courier-manifest ─────────────────────────────────────────
router.get('/courier-manifest', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const shipments = await prisma.shipment.findMany({
      where: { date },
      include: { client: { select: { company: true } } },
      orderBy: [{ courier: 'asc' }, { id: 'asc' }],
    });

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

// ── GET /api/ops/client-comparison ────────────────────────────────────────
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

// ── GET /api/ops/rto-alerts ───────────────────────────────────────────────
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

// ── GET /api/ops/recent-activity ──────────────────────────────────────────
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

// ── GET /api/ops/profit-summary ──────────────────────────────────────────
router.get('/profit-summary', requireRole('ADMIN', 'OPS_MANAGER'), async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const where = {};
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = dateFrom;
      if (dateTo)   where.date.lte = dateTo;
    }

    const revenue = await prisma.shipment.aggregate({ where, _sum: { amount: true, weight: true }, _count: { id: true } });

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

// ── GET /api/ops/dashboard — consolidated analytics with intelligence ─────
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const [
      todayCount, weekCount, todayRev, monthRev,
      pendingCount, monthDelivered, monthTotal,
      courierData, clientData, dailyData, recentShipments,
      quoteStats, reconStats,
      delayedByDays, monthCostData, rtoCount, failedCount,
      todayDelivered, todayBooked
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
      prisma.shipment.groupBy({ by: ['date'], where: { date: { gte: thirtyDaysAgo } }, _count: { id: true }, _sum: { amount: true }, orderBy: { date: 'asc' } }),
      prisma.shipment.findMany({ where: { date: { gte: sevenDaysAgo } }, take: 15, orderBy: { createdAt: 'desc' }, include: { client: { select: { company: true } } } }),
      prisma.quote.aggregate({ _count: { id: true }, _avg: { profit: true, margin: true }, _sum: { profit: true } }),
      reconciliationSvc.getReconciliationStats(),
      // Delayed shipments by courier (in transit > 7 days)
      prisma.shipment.groupBy({ by: ['courier'], where: { status: 'InTransit', date: { lte: sevenDaysAgo }, courier: { not: null } }, _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
      // Cost estimate from courier invoices this month
      prisma.courierInvoice.aggregate({ where: { createdAt: { gte: new Date(monthStart) } }, _sum: { totalAmount: true } }),
      // RTO & Failed counts
      prisma.shipment.count({ where: { status: 'RTO', date: { gte: monthStart } } }),
      prisma.shipment.count({ where: { status: 'Failed', date: { gte: monthStart } } }),
      // Today specifics
      prisma.shipment.count({ where: { status: 'Delivered', date: today } }),
      prisma.shipment.count({ where: { status: 'Booked', date: today } }),
    ]);

    // Enrich client data
    const clientCodes = clientData.map(c => c.clientCode);
    const clients = await prisma.client.findMany({ where: { code: { in: clientCodes } }, select: { code: true, company: true } });
    const clientMap = Object.fromEntries(clients.map(c => [c.code, c.company]));

    // Profit calculations
    const totalRevenue = monthRev._sum.amount || 0;
    const estimatedCost = monthCostData._sum.totalAmount || Math.round(totalRevenue * 0.72);
    const grossProfit = totalRevenue - estimatedCost;
    const avgMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100) : 0;

    const responseData = {
      overview: {
        todayShipments: todayCount,
        weekShipments: weekCount,
        todayRevenue: todayRev._sum.amount || 0,
        monthRevenue: totalRevenue,
        pendingCount,
        deliveredCount: monthDelivered,
        deliveryRate: monthTotal > 0 ? parseFloat((monthDelivered / monthTotal * 100).toFixed(1)) : 0,
        // Intelligence fields
        estimatedCost,
        grossProfit,
        avgMargin: parseFloat(avgMargin.toFixed(1)),
        rtoCount,
        failedCount,
        totalShipments: monthTotal,
        todayDelivered,
        todayBooked,
      },
      courierBreakdown: courierData.map(c => ({ courier: c.courier, revenue: c._sum.amount || 0, count: c._count.id })),
      topClients: clientData.map(c => ({ code: c.clientCode, company: clientMap[c.clientCode] || c.clientCode, revenue: c._sum.amount || 0, count: c._count.id })),
      dailyTrend: dailyData.map(d => ({ date: d.date, count: d._count.id, revenue: d._sum.amount || 0 })),
      recentShipments: recentShipments.map(s => ({
        id: s.id, date: s.date, awb: s.awb, consignee: s.consignee,
        destination: s.destination, courier: s.courier, amount: s.amount,
        status: s.status, clientName: s.client?.company || s.clientCode,
      })),
      delayedByCourier: (delayedByDays || []).map(d => ({ courier: d.courier, count: d._count.id })),
      quotes: {
        total: quoteStats._count.id || 0,
        avgProfit: parseFloat((quoteStats._avg.profit || 0).toFixed(2)),
        avgMargin: parseFloat((quoteStats._avg.margin || 0).toFixed(1)),
        totalProfit: quoteStats._sum.profit || 0,
      },
      reconciliation: {
        totalInvoices: reconStats?.totalInvoices || 0,
        overchargeCount: reconStats?.overchargeCount || 0,
        leakageAlerts: reconStats?.leakageAlerts || 0,
        weightDisputeAlerts: reconStats?.weightDisputeAlerts || 0,
        potentialSaving: reconStats?.potentialSaving || 0,
      }
    };

    R.ok(res, responseData);
  } catch (err) {
    logger.error(`Dashboard error: ${err.message}`);
    R.error(res, err.message);
  }
});

module.exports = router;
