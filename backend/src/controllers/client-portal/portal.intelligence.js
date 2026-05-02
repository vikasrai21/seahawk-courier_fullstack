'use strict';

const prisma = require('../../config/prisma');
const R = require('../../utils/response');
const logger = require('../../utils/logger');
const { resolveClientCode, parseRange } = require('./shared');
const { getMetricsSnapshot } = require('../../middleware/metrics.middleware');
const contractSvc = require('../../services/contract.service');

const FINAL_STATUSES = new Set(['Delivered', 'RTO', 'Cancelled']);

function toDays(ms) {
  return Math.max(0, Math.round(ms / 86400000));
}

function toHours(ms) {
  return Math.max(0, Math.round(ms / 3600000));
}

function slaDaysFor(service) {
  const s = String(service || '').toLowerCase();
  if (s.includes('express')) return 2;
  if (s.includes('priority')) return 3;
  if (s.includes('standard')) return 4;
  return 5;
}

function buildFlags({ status, ageDays, idleHours, slaDays }) {
  const flags = [];
  if (!FINAL_STATUSES.has(status) && ageDays > slaDays) flags.push('SLA_BREACH');
  if (['InTransit', 'OutForDelivery', 'Delayed', 'NDR'].includes(status) && idleHours >= 48) {
    flags.push('STUCK_IN_SCAN');
  }
  return flags;
}

function rtoRiskScore({ status, ageDays, idleHours, slaDays }) {
  let score = 0;
  if (status === 'NDR') score += 40;
  if (status === 'Delayed') score += 25;
  if (idleHours >= 72) score += 20;
  if (ageDays > slaDays + 2) score += 20;
  if (status === 'RTO') score = 100;
  return Math.min(100, score);
}

function deriveHealthScore(summary, total) {
  if (!total) return 100;
  const flaggedPct = (summary.flagged / total) * 100;
  const seriousPct = (summary.highRtoRisk / total) * 100;
  const breachPct = (summary.slaBreaches / total) * 100;

  // Weighted penalty model tuned for client portal readability.
  const penalty = (flaggedPct * 0.35) + (seriousPct * 0.45) + (breachPct * 0.2);
  return Math.max(0, Math.min(100, Math.round(100 - penalty)));
}

function inferRiskReason(row) {
  if (row.status === 'NDR') return 'Failed delivery attempt already recorded';
  if (row.status === 'Delayed') return 'Carrier marked shipment as delayed';
  if (row.flags.includes('STUCK_IN_SCAN')) return 'No fresh scan updates for a long duration';
  if (row.flags.includes('SLA_BREACH')) return 'Transit age exceeds expected SLA for service type';
  if (row.rtoRiskScore >= 75) return 'Multiple negative signals indicate possible return-to-origin';
  return 'Normal flow';
}

function classifyAgingBucket(ageDays) {
  if (ageDays <= 2) return '0-2d';
  if (ageDays <= 5) return '3-5d';
  if (ageDays <= 10) return '6-10d';
  return '11d+';
}

function normalizeCourier(value) {
  return String(value || 'Unknown').trim() || 'Unknown';
}

function inferAvailableModes(contracts = []) {
  const modes = new Set();
  for (const contract of contracts) {
    const rules = Array.isArray(contract.pricingRules)
      ? contract.pricingRules
      : (contract.pricingRules?.rules || []);
    for (const rule of rules) {
      if (rule.mode) modes.add(contractSvc.normalizeMode(rule.mode));
    }
    if (contract.service) modes.add(contractSvc.normalizeMode(contract.service));
  }
  return [...modes].filter(Boolean);
}

function buildCourierSuggestions(rows, contracts) {
  const stats = new Map();
  for (const row of rows) {
    const courier = normalizeCourier(row.courier);
    if (!stats.has(courier)) stats.set(courier, { courier, shipments: 0, delivered: 0, rto: 0, slaScore: 0, totalAmount: 0 });
    const item = stats.get(courier);
    item.shipments += 1;
    item.totalAmount += Number(row.amount || 0);
    if (row.status === 'Delivered') item.delivered += 1;
    if (row.status === 'RTO') item.rto += 1;
    const sla = slaDaysFor(row.service);
    const age = toDays(Date.now() - new Date(row.date).getTime());
    if (row.status === 'Delivered' && age <= sla) item.slaScore += 1;
  }

  const contractCouriers = new Set(contracts.map((c) => normalizeCourier(c.courier)).filter((c) => c !== 'Unknown'));
  const ranked = [...stats.values()].map((item) => {
    const rtoRate = item.shipments ? item.rto / item.shipments : 0;
    const deliveryRate = item.shipments ? item.delivered / item.shipments : 0;
    const slaRate = item.delivered ? item.slaScore / item.delivered : 0;
    const avgCost = item.shipments ? item.totalAmount / item.shipments : 0;
    const score = (deliveryRate * 42) + (slaRate * 28) - (rtoRate * 30) - Math.min(15, avgCost / 1000) + (contractCouriers.has(item.courier) ? 8 : 0);
    return {
      ...item,
      rtoRate: Number((rtoRate * 100).toFixed(1)),
      deliveryRate: Number((deliveryRate * 100).toFixed(1)),
      slaRate: Number((slaRate * 100).toFixed(1)),
      avgCost: Number(avgCost.toFixed(2)),
      score: Number(score.toFixed(1)),
    };
  }).sort((a, b) => b.score - a.score);

  const best = ranked[0] || null;
  return {
    bestCourier: best?.courier || null,
    reason: best ? `Best balance of cost, SLA and ${best.shipments} historical shipments.` : 'No courier history yet.',
    options: ranked.slice(0, 3),
  };
}

function laneKey(destination) {
  const parts = String(destination || '').split(',');
  const city = String(parts[0] || '').trim() || 'UNKNOWN_CITY';
  const state = String(parts[1] || '').trim() || 'UNKNOWN_STATE';
  return `${city}|${state}`;
}

function portalHandler(name, fn) {
  return async (req, res) => {
    try {
      return await fn(req, res);
    } catch (err) {
      logger.error(`Client portal ${name} failed`, {
        requestId: req.requestId,
        userId: req.user?.id,
        message: err.message,
        code: err.code,
      });
      return R.error(res, 'Client portal intelligence is temporarily unavailable. Please try again.', 500);
    }
  };
}

async function intelligence(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const { startStr, endStr } = parseRange({ ...req.query, range: req.query.range || '30d' });
  const limit = Math.min(100, Math.max(10, parseInt(req.query?.limit, 10) || 40));

  const webhookWindowStart = new Date(Date.now() - (24 * 60 * 60 * 1000));
  const rows = await prisma.shipment.findMany({
    where: { clientCode, date: { gte: startStr, lte: endStr } },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    take: 400,
    include: { trackingEvents: { orderBy: { timestamp: 'desc' }, take: 1 } },
  });
  const contracts = (await contractSvc.getByClient(clientCode)).filter((contract) => contract.active);

  const queueStats = await prisma.jobQueue.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  const recentWebhookLogs = await prisma.auditLog.findMany({
    where: {
      entity: 'INTEGRATION_WEBHOOK',
      entityId: { startsWith: `${clientCode}:` },
      createdAt: { gte: webhookWindowStart },
    },
    select: { action: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 400,
  });

  const now = Date.now();
  const intelligenceRows = rows.map((row) => {
    const lastScanAt = row.trackingEvents?.[0]?.timestamp || row.updatedAt || row.date;
    const ageDays = toDays(now - new Date(row.date).getTime());
    const idleHours = toHours(now - new Date(lastScanAt).getTime());
    const slaDays = slaDaysFor(row.service);
    const flags = buildFlags({ status: row.status, ageDays, idleHours, slaDays });
    const rtoScore = rtoRiskScore({ status: row.status, ageDays, idleHours, slaDays });
    return {
      id: row.id,
      awb: row.awb,
      status: row.status,
      destination: row.destination,
      courier: row.courier,
      amount: row.amount,
      service: row.service,
      date: row.date,
      updatedAt: row.updatedAt,
      lastScanAt,
      ageDays,
      idleHours,
      slaDays,
      flags,
      rtoRiskScore: rtoScore,
    };
  });

  const flagged = intelligenceRows
    .filter((row) => row.flags.length > 0 || row.rtoRiskScore >= 60)
    .sort((a, b) => b.rtoRiskScore - a.rtoRiskScore || b.idleHours - a.idleHours)
    .slice(0, limit);

  const summary = {
    total: intelligenceRows.length,
    flagged: flagged.length,
    slaBreaches: flagged.filter((r) => r.flags.includes('SLA_BREACH')).length,
    stuckInScan: flagged.filter((r) => r.flags.includes('STUCK_IN_SCAN')).length,
    highRtoRisk: flagged.filter((r) => r.rtoRiskScore >= 75).length,
  };

  const healthScore = deriveHealthScore(summary, summary.total);
  const alerts = [];
  if (summary.slaBreaches > 0) alerts.push(`${summary.slaBreaches} shipments are projected to miss SLA.`);
  if (summary.stuckInScan > 0) alerts.push(`${summary.stuckInScan} shipments appear stuck with no recent scans.`);
  if (summary.highRtoRisk > 0) alerts.push(`${summary.highRtoRisk} shipments carry high RTO probability.`);
  const modes = inferAvailableModes(contracts);
  const courierSuggestions = buildCourierSuggestions(intelligenceRows, contracts);
  const smartSuggestions = [
    courierSuggestions.bestCourier ? {
      type: 'COURIER_RECOMMENDATION',
      label: `Best courier: ${courierSuggestions.bestCourier}`,
      detail: courierSuggestions.reason,
      confidence: courierSuggestions.options[0]?.score || 0,
    } : null,
    modes.length === 1 ? {
      type: 'MODE_CONTEXT',
      label: `Only ${modes[0]} pricing exists`,
      detail: `Auto-select ${modes[0]} for this client unless ops overrides it.`,
      autoSelectMode: modes[0],
      confidence: 95,
    } : null,
    summary.highRtoRisk > 0 ? {
      type: 'RTO_RISK',
      label: 'High RTO risk',
      detail: `${summary.highRtoRisk} shipments need attention based on status, age and scan freshness.`,
      confidence: 88,
    } : null,
  ].filter(Boolean);

  const predictiveDelays = flagged
    .filter((r) => !FINAL_STATUSES.has(r.status))
    .slice(0, 8)
    .map((r) => ({
      awb: r.awb,
      status: r.status,
      destination: r.destination,
      courier: r.courier,
      expectedDelayDays: Math.max(0, r.ageDays - r.slaDays),
      confidence: Math.min(95, Math.max(50, 55 + Math.round((r.rtoRiskScore / 100) * 35))),
      reason: inferRiskReason(r),
    }));

  const qMap = queueStats.reduce((acc, row) => {
    acc[row.status] = row._count.id;
    return acc;
  }, {});
  const metrics = getMetricsSnapshot();
  const webhookTotal = recentWebhookLogs.length;
  const webhookFailed = recentWebhookLogs.filter((l) => l.action === 'INTEGRATION_DRAFT_FAILED').length;
  const webhookSuccess = recentWebhookLogs.filter((l) => l.action === 'INTEGRATION_DRAFT_CREATED').length;
  const webhookDuplicate = recentWebhookLogs.filter((l) => l.action === 'INTEGRATION_DRAFT_DUPLICATE').length;
  const webhookSuccessRate = webhookTotal > 0 ? Number((((webhookSuccess + webhookDuplicate) / webhookTotal) * 100).toFixed(1)) : 100;
  const stale24h = intelligenceRows.filter((r) => !FINAL_STATUSES.has(r.status) && r.idleHours >= 24).length;
  const stale48h = intelligenceRows.filter((r) => !FINAL_STATUSES.has(r.status) && r.idleHours >= 48).length;

  const deliveries = intelligenceRows.filter((r) => FINAL_STATUSES.has(r.status));
  const deliveredOnTime = deliveries.filter((r) => r.status === 'Delivered' && r.ageDays <= r.slaDays).length;
  const otif = deliveries.length ? Number(((deliveredOnTime / deliveries.length) * 100).toFixed(1)) : 100;
  const firstAttemptDelivery = intelligenceRows.length
    ? Number(((intelligenceRows.filter((r) => r.status === 'Delivered' && r.idleHours <= 36).length / intelligenceRows.length) * 100).toFixed(1))
    : 100;
  const rtoRiskShipments = intelligenceRows.filter((r) => r.rtoRiskScore >= 70).length;
  const exceptionCount = intelligenceRows.filter((r) => r.flags.length > 0 || ['NDR', 'Delayed', 'RTO'].includes(r.status)).length;
  const exceptionRate = intelligenceRows.length ? Number(((exceptionCount / intelligenceRows.length) * 100).toFixed(1)) : 0;

  const agingMap = new Map([
    ['0-2d', 0],
    ['3-5d', 0],
    ['6-10d', 0],
    ['11d+', 0],
  ]);
  intelligenceRows
    .filter((r) => !FINAL_STATUSES.has(r.status))
    .forEach((r) => {
      const bucket = classifyAgingBucket(r.ageDays);
      agingMap.set(bucket, (agingMap.get(bucket) || 0) + 1);
    });

  const heatMap = {};
  intelligenceRows.forEach((row) => {
    const lk = laneKey(row.destination);
    if (!heatMap[lk]) {
      heatMap[lk] = { lane: lk, total: 0, exceptions: 0, highRtoRisk: 0 };
    }
    heatMap[lk].total += 1;
    if (row.flags.length > 0 || ['NDR', 'Delayed', 'RTO'].includes(row.status)) heatMap[lk].exceptions += 1;
    if (row.rtoRiskScore >= 70) heatMap[lk].highRtoRisk += 1;
  });
  const exceptionHeatmap = Object.values(heatMap)
    .map((item) => ({
      ...item,
      exceptionRate: item.total ? Number(((item.exceptions / item.total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.exceptionRate - a.exceptionRate || b.highRtoRisk - a.highRtoRisk)
    .slice(0, 10);

  const autopilot = {
    delayPrediction: predictiveDelays.slice(0, 10),
    failedScanActions: intelligenceRows
      .filter((r) => r.flags.includes('STUCK_IN_SCAN') || r.status === 'NDR')
      .slice(0, 12)
      .map((r) => ({
        awb: r.awb,
        status: r.status,
        destination: r.destination,
        action:
          r.status === 'NDR'
            ? 'Escalate NDR with customer callback'
            : r.idleHours >= 72
              ? 'Escalate courier re-attempt and supervisor review'
              : 'Trigger proactive delay notification',
      })),
  };

  const ndrByCourier = {};
  intelligenceRows.forEach((r) => {
    if (r.status !== 'NDR') return;
    const c = String(r.courier || 'Unknown');
    ndrByCourier[c] = (ndrByCourier[c] || 0) + 1;
  });
  const ndrRules = Object.entries(ndrByCourier)
    .map(([courier, count]) => ({
      courier,
      ndrCount: count,
      action: count >= 5 ? 'Escalate to priority re-attempt workflow' : 'Monitor and send customer reminder',
    }))
    .sort((a, b) => b.ndrCount - a.ndrCount)
    .slice(0, 10);

  R.ok(res, {
    summary: { ...summary, healthScore },
    alerts,
    smartSuggestions,
    courierSuggestions,
    predictiveDelays,
    observability: {
      asOf: new Date().toISOString(),
      window: { from: webhookWindowStart.toISOString(), to: new Date().toISOString() },
      apiLatencyMs: {
        avg: Number(metrics?.latencyMs?.avg || 0),
        p95: Number(metrics?.latencyMs?.p95 || 0),
        max: Number(metrics?.latencyMs?.max || 0),
      },
      integrationWebhooks: {
        total: webhookTotal,
        success: webhookSuccess,
        duplicate: webhookDuplicate,
        failed: webhookFailed,
        successRate: webhookSuccessRate,
      },
      jobQueue: {
        pending: Number(qMap.PENDING || 0),
        running: Number(qMap.RUNNING || 0),
        failed: Number(qMap.FAILED || 0),
        done: Number(qMap.DONE || 0),
      },
      syncLag: {
        staleShipments24h: stale24h,
        staleShipments48h: stale48h,
      },
    },
    slaCommandCenter: {
      otif,
      firstAttemptDelivery,
      rtoRiskShipments,
      exceptionRate,
      agingBuckets: Object.fromEntries(agingMap.entries()),
      exceptionHeatmap,
    },
    opsAutomation: {
      ndrRules,
      autopilot,
    },
    items: flagged,
    range: { from: startStr, to: endStr },
  });
}

module.exports = { intelligence: portalHandler('intelligence', intelligence) };
