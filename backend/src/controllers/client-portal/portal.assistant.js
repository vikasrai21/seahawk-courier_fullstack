'use strict';

const prisma = require('../../config/prisma');
const R = require('../../utils/response');
const notify = require('../../services/notification.service');
const { resolveClientCode } = require('./shared');
const openai = require('../../services/openai.service');
const cache = require('../../utils/cache');

const STAFF_ROLES = ['ADMIN', 'OPS_MANAGER'];
const FINAL_STATUSES = new Set(['Delivered', 'RTO', 'Cancelled']);

function normalizeText(value) {
  return String(value || '').trim();
}

function extractAwb(text) {
  const raw = String(text || '').toUpperCase();
  const matches = raw.match(/[A-Z0-9]{6,}/g) || [];
  return matches[0] || '';
}

function extractField(text, label) {
  const re = new RegExp(`${label}\\s*:\\s*([^\\n;]+)`, 'i');
  const m = String(text || '').match(re);
  return m ? String(m[1]).trim() : '';
}

function intentFromMessage(message) {
  const msg = String(message || '').toLowerCase();
  if (msg.includes('pickup')) return 'PICKUP_CREATE';
  if (msg.includes('ndr') && (msg.includes('respond') || msg.includes('reattempt') || msg.includes('rto') || msg.includes('address'))) {
    return 'NDR_RESPOND';
  }
  if (msg.includes('ndr')) return 'NDR_LIST';
  if (msg.includes('support') || msg.includes('ticket') || msg.includes('issue')) return 'SUPPORT_TICKET';
  if (msg.includes('shipment') && msg.includes('list')) return 'SHIPMENT_LIST';
  if (msg.includes('pickup') && msg.includes('list')) return 'PICKUP_LIST';
  if (msg.includes('status') || msg.includes('track')) return 'TRACK_AWB';
  return 'SHIPMENT_LIST';
}

function buildReply({ title, lines = [], data = null, action = null }) {
  return { reply: [title, ...lines].filter(Boolean).join('\n'), data, action };
}

function recommendedSteps(steps = []) {
  if (!steps.length) return '';
  return `Recommended next steps: ${steps.join(' | ')}`;
}

function toHours(ms) {
  return Math.max(0, Math.round(ms / 3600000));
}

function toDays(ms) {
  return Math.max(0, Math.round(ms / 86400000));
}

function slaDaysFor(service) {
  const s = String(service || '').toLowerCase();
  if (s.includes('express')) return 2;
  if (s.includes('priority')) return 3;
  if (s.includes('standard')) return 4;
  return 5;
}

function computeFlags(shipment) {
  const lastScanAt = shipment.trackingEvents?.[0]?.timestamp || shipment.updatedAt || shipment.date;
  const ageDays = toDays(Date.now() - new Date(shipment.date).getTime());
  const idleHours = toHours(Date.now() - new Date(lastScanAt).getTime());
  const slaDays = slaDaysFor(shipment.service);
  const flags = [];
  if (!FINAL_STATUSES.has(shipment.status) && ageDays > slaDays) flags.push('SLA_BREACH');
  if (['InTransit', 'OutForDelivery', 'Delayed', 'NDR'].includes(shipment.status) && idleHours >= 48) flags.push('STUCK_IN_SCAN');
  return { flags, ageDays, idleHours, slaDays };
}

function suggestForShipment(shipment, flagsMeta, insights = {}) {
  const steps = [];
  if (shipment.status === 'NDR') steps.push('Respond to NDR');
  if (shipment.status === 'Delayed') steps.push('Raise support ticket');
  if (shipment.status === 'OutForDelivery') steps.push('Monitor delivery window');
  if (flagsMeta.flags.includes('STUCK_IN_SCAN')) steps.push('Sync tracking / escalate');
  if (flagsMeta.flags.includes('SLA_BREACH')) steps.push('Flag SLA breach internally');
  if (insights?.courierRiskHigh) steps.push('Consider courier escalation');
  if (insights?.laneRiskHigh) steps.push('Flag high-risk lane');
  return steps;
}

function daysBetween(start, end) {
  return Math.max(0, Math.round((end - start) / 86400000));
}

async function buildClientInsights(clientCode) {
  const key = `assistant:insights:${clientCode}`;
  return cache.wrap(key, async () => {
    const days = 180;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));

    const rows = await prisma.shipment.findMany({
      where: { clientCode, date: { gte: start.toISOString().slice(0, 10), lte: end.toISOString().slice(0, 10) } },
      select: { status: true, courier: true, pincode: true, destination: true, date: true, updatedAt: true },
    });

    const byCourier = new Map();
    const byPincode = new Map();

    for (const row of rows) {
      const courier = row.courier || 'Unknown';
      if (!byCourier.has(courier)) byCourier.set(courier, { total: 0, rto: 0, delivered: 0, transitDays: 0 });
      const c = byCourier.get(courier);
      c.total += 1;
      if (row.status === 'RTO') c.rto += 1;
      if (row.status === 'Delivered') {
        c.delivered += 1;
        const t = daysBetween(new Date(row.date), new Date(row.updatedAt || row.date));
        c.transitDays += t;
      }

      const pin = row.pincode || row.destination || 'Unknown';
      if (!byPincode.has(pin)) byPincode.set(pin, { total: 0, rto: 0 });
      const p = byPincode.get(pin);
      p.total += 1;
      if (row.status === 'RTO') p.rto += 1;
    }

    const courierStats = {};
    for (const [k, v] of byCourier.entries()) {
      courierStats[k] = {
        rtoRate: v.total ? Number(((v.rto / v.total) * 100).toFixed(1)) : 0,
        avgTransitDays: v.delivered ? Number((v.transitDays / v.delivered).toFixed(1)) : null,
      };
    }

    const laneStats = {};
    for (const [k, v] of byPincode.entries()) {
      laneStats[k] = {
        rtoRate: v.total ? Number(((v.rto / v.total) * 100).toFixed(1)) : 0,
      };
    }

    return { courierStats, laneStats, sampleSize: rows.length };
  }, 600);
}

function computeRiskScore({ shipment, flagsMeta, insights }) {
  let score = 0;
  if (shipment.status === 'NDR') score += 40;
  if (shipment.status === 'Delayed') score += 25;
  if (shipment.status === 'OutForDelivery') score += 10;
  if (shipment.status === 'InTransit') score += 15;
  if (flagsMeta.flags.includes('STUCK_IN_SCAN')) score += 20;
  if (flagsMeta.flags.includes('SLA_BREACH')) score += 20;

  const courierStat = insights?.courierStats?.[shipment.courier || 'Unknown'];
  const laneKey = shipment.pincode || shipment.destination || 'Unknown';
  const laneStat = insights?.laneStats?.[laneKey];

  if (courierStat?.rtoRate >= 15) score += 10;
  if (courierStat?.rtoRate >= 25) score += 15;
  if (laneStat?.rtoRate >= 20) score += 10;
  if (laneStat?.rtoRate >= 35) score += 15;

  const ageDays = flagsMeta.ageDays;
  const avgTransit = courierStat?.avgTransitDays;
  if (avgTransit && ageDays > avgTransit + 2) score += 15;

  return Math.min(100, score);
}

async function listShipments(clientCode) {
  const rows = await prisma.shipment.findMany({
    where: { clientCode },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    take: 8,
    select: { awb: true, status: true, destination: true, courier: true, updatedAt: true },
  });
  return rows;
}

async function trackShipment(clientCode, awb) {
  if (!awb) return null;
  return prisma.shipment.findFirst({
    where: { clientCode, awb: awb.toUpperCase() },
    include: { trackingEvents: { orderBy: { timestamp: 'desc' }, take: 5 } },
  });
}

async function listPickups(clientCode) {
  return prisma.pickupRequest.findMany({
    where: { clientCode },
    orderBy: { createdAt: 'desc' },
    take: 8,
  });
}

async function listNdrs(clientCode) {
  return prisma.nDREvent.findMany({
    where: { shipment: { clientCode } },
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: { shipment: { select: { awb: true, destination: true, status: true } } },
  });
}

async function listSupportTickets(clientCode) {
  const logs = await prisma.auditLog.findMany({
    where: { entity: 'SUPPORT_TICKET' },
    orderBy: { createdAt: 'desc' },
    take: 2000,
    select: { action: true, entityId: true, newValue: true, createdAt: true },
  });
  const map = new Map();
  for (const log of logs) {
    if (!log.entityId) continue;
    const payload = log.newValue || {};
    if (log.action === 'CREATE_SUPPORT_TICKET' && payload.clientCode === clientCode) {
      map.set(log.entityId, {
        ticketNo: log.entityId,
        subject: payload.subject || '',
        awb: payload.awb || null,
        priority: payload.priority || 'normal',
        status: payload.status || 'OPEN',
        createdAt: log.createdAt,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);
}

async function createSupportTicket({ user, clientCode, subject, message, awb, priority }) {
  const ticketNo = `TKT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10000 + Math.random() * 90000)}`;
  const payload = {
    ticketNo,
    clientCode,
    raisedBy: { id: user.id, email: user.email, name: user.name, role: user.role },
    subject,
    message,
    awb: awb || null,
    priority,
    source: 'CLIENT_PORTAL',
    createdAt: new Date().toISOString(),
  };

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      userEmail: user.email,
      action: 'CREATE_SUPPORT_TICKET',
      entity: 'SUPPORT_TICKET',
      entityId: ticketNo,
      newValue: payload,
      ip: user.ip || null,
    },
  });

  const recipients = await prisma.user.findMany({
    where: { active: true, role: { in: STAFF_ROLES } },
    select: { email: true },
  });
  await Promise.all(
    recipients
      .filter((r) => !!r.email)
      .map((r) => notify.sendEmail({
        to: r.email,
        subject: `[Support Ticket] ${ticketNo} · ${clientCode} · ${subject}`,
        text: `Ticket: ${ticketNo}\nClient: ${clientCode}\nPriority: ${priority.toUpperCase()}\n${awb ? `AWB: ${awb}` : ''}\n\n${message}`,
      }))
  );

  return { ticketNo };
}

async function createPickup({ user, clientCode, form }) {
  const pickup = await prisma.pickupRequest.create({
    data: {
      requestNo: `PKP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      clientCode,
      contactName: form.contactName,
      contactPhone: form.contactPhone,
      contactEmail: form.contactEmail || null,
      pickupAddress: form.pickupAddress,
      pickupCity: form.pickupCity,
      pickupPin: form.pickupPin,
      deliveryAddress: form.deliveryAddress || null,
      deliveryCity: form.deliveryCity || null,
      deliveryState: form.deliveryState || null,
      deliveryCountry: 'India',
      packageType: form.packageType || 'Parcel',
      weightGrams: Number(form.weightGrams || 0),
      pieces: Math.max(1, parseInt(form.pieces || 1, 10)),
      service: form.service || 'Standard',
      notes: form.notes || null,
      preferredCarrier: form.preferredCarrier || null,
      scheduledDate: form.scheduledDate,
      timeSlot: form.timeSlot || 'Morning',
      status: 'PENDING',
      source: 'CLIENT_PORTAL',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      userEmail: user.email,
      action: 'CLIENT_PICKUP_CREATED',
      entity: 'PICKUP',
      entityId: pickup.requestNo,
      newValue: { clientCode, scheduledDate: form.scheduledDate, timeSlot: form.timeSlot },
      ip: user.ip || null,
    },
  }).catch(() => {});

  return pickup;
}

async function respondNdr({ user, clientCode, awb, action, newAddress, newPhone, rescheduleDate, notes }) {
  const ndr = await prisma.nDREvent.findFirst({
    where: { shipment: { clientCode, awb: awb.toUpperCase() } },
    orderBy: { createdAt: 'desc' },
    include: { shipment: { select: { id: true, awb: true, clientCode: true, destination: true, phone: true } } },
  });
  if (!ndr) return null;

  const shipmentPatch = {};
  if (newAddress) shipmentPatch.destination = newAddress;
  if (newPhone) shipmentPatch.phone = newPhone;

  const updated = await prisma.$transaction(async (tx) => {
    const item = await tx.nDREvent.update({
      where: { id: ndr.id },
      data: { action, newAddress: newAddress || undefined },
    });
    if (Object.keys(shipmentPatch).length) {
      await tx.shipment.update({ where: { id: ndr.shipment.id }, data: shipmentPatch });
    }
    await tx.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: 'CLIENT_NDR_REQUEST',
        entity: 'NDR',
        entityId: String(ndr.id),
        newValue: {
          action,
          newAddress: newAddress || null,
          newPhone: newPhone || null,
          rescheduleDate: rescheduleDate || null,
          notes: notes || null,
          awb: ndr.awb,
        },
        ip: user.ip || null,
      },
    });
    return item;
  });

  return updated;
}

async function assistant(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const message = normalizeText(req.body?.message);
  const confirm = Boolean(req.body?.confirm);
  const incomingAction = req.body?.action || null;
  const history = Array.isArray(req.body?.history) ? req.body.history : [];

  let action = incomingAction || null;
  let aiPayload = null;
  if (!action && openai.hasOpenAI()) {
    aiPayload = await openai.inferAssistantAction({ message, history });
    if (aiPayload?.action) action = aiPayload.action;
  }
  if (!action) action = { type: intentFromMessage(message) };

  const insights = await buildClientInsights(clientCode);

  if (action.type === 'SHIPMENT_LIST') {
    const items = await listShipments(clientCode);
    const statusCounts = items.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {});
    const steps = [];
    if (statusCounts.NDR) steps.push('Review NDR cases');
    if (statusCounts.Delayed) steps.push('Raise a support ticket for delays');
    if (statusCounts.OutForDelivery) steps.push('Track OFD shipments');
    const lines = items.map((s) => {
      const laneKey = s.pincode || s.destination || 'Unknown';
      const laneRisk = insights?.laneStats?.[laneKey]?.rtoRate;
      const courierRisk = insights?.courierStats?.[s.courier || 'Unknown']?.rtoRate;
      const riskBits = [];
      if (courierRisk >= 20) riskBits.push(`courier RTO ${courierRisk}%`);
      if (laneRisk >= 25) riskBits.push(`lane RTO ${laneRisk}%`);
      const riskTag = riskBits.length ? ` · Risk: ${riskBits.join(', ')}` : '';
      return `${s.awb} · ${s.status} · ${s.destination || 'Destination'} · ${s.courier || 'Courier'}${riskTag}`;
    });
    if (steps.length) lines.push(recommendedSteps(steps));
    return R.ok(res, buildReply({
      title: insights.sampleSize ? `Here are your latest shipments (insights from ${insights.sampleSize} shipments):` : 'Here are your latest shipments:',
      lines,
      data: { shipments: items },
    }));
  }

  if (action.type === 'TRACK_AWB') {
    const awb = action.awb || extractAwb(message);
    const shipment = await trackShipment(clientCode, awb);
    if (!shipment) {
      return R.ok(res, buildReply({
        title: 'I could not find that AWB.',
        lines: ['Please share a valid AWB number.'],
      }));
    }
    const events = shipment.trackingEvents || [];
    const flagsMeta = computeFlags(shipment);
    const courierStat = insights?.courierStats?.[shipment.courier || 'Unknown'];
    const laneKey = shipment.pincode || shipment.destination || 'Unknown';
    const laneStat = insights?.laneStats?.[laneKey];
    const steps = suggestForShipment(shipment, flagsMeta, {
      courierRiskHigh: courierStat?.rtoRate >= 20,
      laneRiskHigh: laneStat?.rtoRate >= 25,
    });
    const riskScore = computeRiskScore({ shipment, flagsMeta, insights });
    const benchmarkLine = courierStat?.avgTransitDays
      ? `Benchmark: ${shipment.courier || 'Courier'} avg delivery ~${courierStat.avgTransitDays} days. Current age: ${flagsMeta.ageDays} days.`
      : '';
    const laneLine = laneStat?.rtoRate ? `Lane RTO rate: ${laneStat.rtoRate}%` : '';
    const courierLine = courierStat?.rtoRate ? `Courier RTO rate: ${courierStat.rtoRate}%` : '';
    return R.ok(res, buildReply({
      title: `Shipment ${shipment.awb} is ${shipment.status}. Risk score: ${riskScore}/100.`,
      lines: [
        benchmarkLine,
        courierLine,
        laneLine,
        ...events.map((e) => `${e.status} · ${e.location || 'Location'} · ${new Date(e.timestamp).toLocaleString('en-IN')}`),
        steps.length ? recommendedSteps(steps) : '',
      ].filter(Boolean),
      data: { shipment },
    }));
  }

  if (action.type === 'PICKUP_LIST') {
    const items = await listPickups(clientCode);
    return R.ok(res, buildReply({
      title: 'Recent pickup requests:',
      lines: items.map((p) => `${p.requestNo} · ${p.status} · ${p.pickupCity} · ${p.scheduledDate}`),
      data: { pickups: items },
    }));
  }

  if (action.type === 'NDR_LIST') {
    const items = await listNdrs(clientCode);
    return R.ok(res, buildReply({
      title: 'Latest NDR cases:',
      lines: items.map((n) => `${n.shipment?.awb || n.awb} · ${n.action} · ${n.shipment?.destination || 'Destination'}`),
      data: { ndrs: items },
    }));
  }

  if (action.type === 'SUPPORT_TICKET_LIST') {
    const items = await listSupportTickets(clientCode);
    return R.ok(res, buildReply({
      title: 'Recent support tickets:',
      lines: items.map((t) => `${t.ticketNo} · ${t.status} · ${t.subject}`),
      data: { tickets: items },
    }));
  }

  if (action.type === 'SUPPORT_TICKET') {
    const subject = action.subject || extractField(message, 'subject');
    const body = action.message || extractField(message, 'message') || extractField(message, 'details');
    const awb = action.awb || extractAwb(message);
    const priority = String(action.priority || extractField(message, 'priority') || 'normal').toLowerCase();

    if (!subject || !body) {
      return R.ok(res, buildReply({
        title: 'I can open a support ticket.',
        lines: ['Please provide: subject and message. Example: "subject: Delivery delay; message: package stuck since yesterday."'],
        action: { type: 'SUPPORT_TICKET', confirmRequired: true },
      }));
    }

    if (!confirm) {
      return R.ok(res, buildReply({
        title: 'Ready to open a ticket.',
        lines: [`Subject: ${subject}`, `Priority: ${priority}`, awb ? `AWB: ${awb}` : 'AWB: not provided'],
        action: { type: 'SUPPORT_TICKET', confirmRequired: true, subject, message: body, awb, priority },
      }));
    }

    const ticket = await createSupportTicket({ user: req.user, clientCode, subject, message: body, awb, priority });
    return R.ok(res, buildReply({
      title: `Ticket created: ${ticket.ticketNo}`,
      lines: ['Our team will respond shortly.'],
      data: { ticket },
    }));
  }

  if (action.type === 'PICKUP_CREATE') {
    const form = {
      contactName: action.contactName || extractField(message, 'name'),
      contactPhone: action.contactPhone || extractField(message, 'phone'),
      pickupAddress: action.pickupAddress || extractField(message, 'address'),
      pickupCity: action.pickupCity || extractField(message, 'city'),
      pickupPin: action.pickupPin || extractField(message, 'pin'),
      scheduledDate: action.scheduledDate || extractField(message, 'date'),
      timeSlot: action.timeSlot || extractField(message, 'slot') || 'Morning',
      packageType: action.packageType || extractField(message, 'package') || 'Parcel',
      weightGrams: action.weightGrams || extractField(message, 'weight'),
      pieces: action.pieces || extractField(message, 'pieces'),
      notes: action.notes || extractField(message, 'notes'),
    };

    if (!form.contactName || !form.contactPhone || !form.pickupAddress || !form.pickupCity || !form.pickupPin || !form.scheduledDate) {
      return R.ok(res, buildReply({
        title: 'I can schedule a pickup.',
        lines: ['Please provide: name, phone, address, city, pin, date. Example: "pickup name: Ajay; phone: 98xxxx; address: ...; city: Delhi; pin: 110001; date: 2026-04-08"'],
        action: { type: 'PICKUP_CREATE', confirmRequired: true },
      }));
    }

    if (!confirm) {
      return R.ok(res, buildReply({
        title: 'Ready to create pickup.',
        lines: [`${form.contactName} · ${form.pickupCity} · ${form.scheduledDate} (${form.timeSlot})`],
        action: { type: 'PICKUP_CREATE', confirmRequired: true, ...form },
      }));
    }

    const pickup = await createPickup({ user: req.user, clientCode, form });
    return R.ok(res, buildReply({
      title: `Pickup created: ${pickup.requestNo}`,
      lines: ['Our ops team will assign a runner shortly.'],
      data: { pickup },
    }));
  }

  if (action.type === 'NDR_RESPOND') {
    const awb = action.awb || extractAwb(message);
    const actionType = String(action.ndrAction || extractField(message, 'action') || 'REATTEMPT').toUpperCase();
    const newAddress = action.newAddress || extractField(message, 'address');
    const newPhone = action.newPhone || extractField(message, 'phone');
    const rescheduleDate = action.rescheduleDate || extractField(message, 'date');
    const notes = action.notes || extractField(message, 'notes');

    if (!awb) {
      return R.ok(res, buildReply({
        title: 'Please provide the AWB to respond to NDR.',
        action: { type: 'NDR_RESPOND', confirmRequired: true },
      }));
    }

    if (!confirm) {
      return R.ok(res, buildReply({
        title: 'Ready to submit NDR response.',
        lines: [`AWB: ${awb}`, `Action: ${actionType}`],
        action: { type: 'NDR_RESPOND', confirmRequired: true, awb, ndrAction: actionType, newAddress, newPhone, rescheduleDate, notes },
      }));
    }

    const updated = await respondNdr({ user: req.user, clientCode, awb, action: actionType, newAddress, newPhone, rescheduleDate, notes });
    if (!updated) {
      return R.ok(res, buildReply({ title: 'No matching NDR found for that AWB.' }));
    }
    return R.ok(res, buildReply({ title: 'NDR response submitted successfully.' }));
  }

  return R.ok(res, buildReply({
    title: aiPayload?.reply || 'Tell me what you need.',
    lines: aiPayload?.reply ? [] : ['You can ask about shipment status, pickups, NDRs, or support tickets.'],
  }));
}

module.exports = { assistant };
