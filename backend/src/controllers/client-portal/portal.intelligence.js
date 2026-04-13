'use strict';

const prisma = require('../../config/prisma');
const R = require('../../utils/response');
const { resolveClientCode, parseRange } = require('./shared');

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

async function intelligence(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const { startStr, endStr } = parseRange({ ...req.query, range: req.query.range || '30d' });
  const limit = Math.min(100, Math.max(10, parseInt(req.query?.limit, 10) || 40));

  const rows = await prisma.shipment.findMany({
    where: { clientCode, date: { gte: startStr, lte: endStr } },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    take: 400,
    include: { trackingEvents: { orderBy: { timestamp: 'desc' }, take: 1 } },
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

  R.ok(res, {
    summary: { ...summary, healthScore },
    alerts,
    predictiveDelays,
    items: flagged,
    range: { from: startStr, to: endStr },
  });
}

module.exports = { intelligence };
