'use strict';

const prisma = require('../config/prisma');

function slaDaysFor(service = '') {
  const s = String(service || '').toLowerCase();
  if (s.includes('express')) return 2;
  if (s.includes('priority')) return 3;
  if (s.includes('standard')) return 4;
  return 5;
}

function computeSlaContext(shipment = {}) {
  const bookedAt = shipment?.date ? new Date(`${shipment.date}T00:00:00`) : (shipment?.createdAt ? new Date(shipment.createdAt) : new Date());
  const dueAt = new Date(bookedAt);
  dueAt.setDate(dueAt.getDate() + slaDaysFor(shipment?.service));
  const now = new Date();
  const ageMs = now.getTime() - bookedAt.getTime();
  const ageDays = Math.max(0, Math.floor(ageMs / 86400000));
  const breach = now.getTime() > dueAt.getTime();
  const breachHours = breach ? Math.max(1, Math.floor((now.getTime() - dueAt.getTime()) / 3600000)) : 0;
  return {
    bookedAt,
    dueAt,
    ageDays,
    breach,
    breachHours,
  };
}

function computeNdrUrgency(ndr = {}) {
  const action = String(ndr?.action || 'PENDING').toUpperCase();
  const attemptNo = Number(ndr?.attemptNo || 1);
  const createdAt = ndr?.createdAt ? new Date(ndr.createdAt) : new Date();
  const pendingHours = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 3600000));
  let severity = 'normal';
  if (attemptNo >= 3 || pendingHours >= 48) severity = 'critical';
  else if (attemptNo >= 2 || pendingHours >= 24) severity = 'high';
  else if (pendingHours >= 12) severity = 'medium';

  const shouldEscalate = action === 'PENDING' && (severity === 'high' || severity === 'critical');
  return {
    severity,
    pendingHours,
    attemptNo,
    shouldEscalate,
  };
}

function buildSuggestedActions({ ndr, shipment, urgency, sla }) {
  const suggestions = [];
  if (urgency.shouldEscalate) suggestions.push('ESCALATE_OPS');
  if (String(shipment?.status || '').toUpperCase() === 'NDR') suggestions.push('REATTEMPT');
  if (urgency.attemptNo >= 2) suggestions.push('WHATSAPP_BRIDGE');
  if (sla.breach) suggestions.push('SLA_ESCALATION');
  suggestions.push('UPDATE_ADDRESS');
  suggestions.push('RTO');
  return Array.from(new Set(suggestions));
}

async function buildNdrAutomationView(clientCode, ndrRows = []) {
  const normalizedCode = String(clientCode || '').toUpperCase();
  const results = [];

  for (const ndr of ndrRows) {
    const shipment = ndr?.shipment || null;
    if (!shipment || String(shipment.clientCode || '').toUpperCase() !== normalizedCode) continue;
    const urgency = computeNdrUrgency(ndr);
    const sla = computeSlaContext(shipment);
    const suggestedActions = buildSuggestedActions({ ndr, shipment, urgency, sla });
    results.push({
      ...ndr,
      automation: {
        urgency,
        sla: {
          breach: sla.breach,
          breachHours: sla.breachHours,
          dueAt: sla.dueAt,
          ageDays: sla.ageDays,
        },
        suggestedActions,
      },
    });
  }

  return results;
}

async function escalateNdrForOps({ ndrId, user, clientCode, notes }) {
  const id = Number(ndrId);
  if (!Number.isFinite(id) || id <= 0) throw new Error('Invalid NDR id');
  const ndr = await prisma.nDREvent.findUnique({
    where: { id },
    include: {
      shipment: { select: { id: true, awb: true, clientCode: true, status: true, service: true, date: true, createdAt: true } },
    },
  });
  if (!ndr) throw new Error('NDR not found');
  if (String(ndr.shipment?.clientCode || '').toUpperCase() !== String(clientCode || '').toUpperCase()) {
    throw new Error('NDR does not belong to this client');
  }

  const urgency = computeNdrUrgency(ndr);
  const sla = computeSlaContext(ndr.shipment);
  const escalationNotes = String(notes || '').trim();
  const nextReason = [ndr.description, escalationNotes].filter(Boolean).join(' | ').slice(0, 1000);

  const updated = await prisma.nDREvent.update({
    where: { id },
    data: {
      action: 'ESCALATED',
      description: nextReason || ndr.description || '',
    },
    include: {
      shipment: { select: { id: true, awb: true, clientCode: true, status: true, courier: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user?.id || null,
      userEmail: user?.email || null,
      action: 'CLIENT_NDR_ESCALATED',
      entity: 'NDR',
      entityId: String(id),
      newValue: {
        ndrId: id,
        awb: updated.awb,
        urgency: urgency.severity,
        pendingHours: urgency.pendingHours,
        slaBreach: sla.breach,
        slaBreachHours: sla.breachHours,
        note: escalationNotes || null,
      },
      ip: null,
    },
  });

  return {
    ndr: updated,
    automation: {
      urgency,
      sla: {
        breach: sla.breach,
        breachHours: sla.breachHours,
        dueAt: sla.dueAt,
      },
      escalated: true,
    },
  };
}

module.exports = {
  computeSlaContext,
  computeNdrUrgency,
  buildNdrAutomationView,
  escalateNdrForOps,
};

