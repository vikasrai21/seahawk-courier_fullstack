// src/routes/client-portal.routes.js — Client self-service endpoints
'use strict';
const router  = require('express').Router();
const prisma  = require('../config/prisma');
const { protect, requireRole } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/errorHandler');
const carrier = require('../services/carrier.service');
const notify = require('../services/notification.service');
const R = require('../utils/response');

const clientOnly = requireRole('CLIENT', 'ADMIN');

// Helper: get clientCode for logged-in CLIENT user
async function getClientCode(userId) {
  const cu = await prisma.clientUser.findUnique({ where: { userId }, select: { clientCode: true } });
  return cu?.clientCode;
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

function parseRange(query) {
  const today = new Date();
  const end = new Date(today);
  const start = new Date(today);

  const range = String(query.range || '30d').toLowerCase();
  if (range === 'today') {
    // today -> same start/end
  } else if (range === '7d') {
    start.setDate(start.getDate() - 6);
  } else if (range === 'this_month') {
    start.setDate(1);
  } else if (range === 'custom' && query.date_from && query.date_to) {
    return { startStr: String(query.date_from), endStr: String(query.date_to), range };
  } else {
    // default 30d
    start.setDate(start.getDate() - 29);
  }

  return { startStr: fmtDate(start), endStr: fmtDate(end), range };
}

// GET /api/portal/stats
router.get('/stats', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = req.user.role === 'ADMIN' ? req.query.clientCode : await getClientCode(req.user.id);
  if (!clientCode) return R.notFound(res, 'Client profile not linked to this account.');

  const { startStr, endStr, range } = parseRange(req.query);
  const baseWhere = { clientCode, date: { gte: startStr, lte: endStr } };

  const statusWhere = (statuses) => ({ ...baseWhere, status: { in: statuses } });

  const [
    total,
    booked,
    inTransit,
    outForDelivery,
    delivered,
    exception,
    client,
    trendRows,
  ] = await Promise.all([
    prisma.shipment.count({ where: baseWhere }),
    prisma.shipment.count({ where: statusWhere(['Booked']) }),
    prisma.shipment.count({ where: statusWhere(['InTransit']) }),
    prisma.shipment.count({ where: statusWhere(['OutForDelivery']) }),
    prisma.shipment.count({ where: statusWhere(['Delivered']) }),
    prisma.shipment.count({ where: statusWhere(['Delayed', 'NDR', 'RTO']) }),
    prisma.client.findUnique({ where: { code: clientCode }, select: { walletBalance: true } }),
    prisma.shipment.groupBy({
      by: ['date'],
      where: baseWhere,
      _count: { id: true },
      orderBy: { date: 'asc' },
    }),
  ]);

  const deliveredPct = total > 0 ? Number(((delivered / total) * 100).toFixed(1)) : 0;
  const trend = trendRows.map(r => ({ date: r.date, shipments: r._count.id }));

  R.ok(res, {
    range: { key: range, from: startStr, to: endStr },
    totals: { total, booked, inTransit, outForDelivery, delivered, exception, deliveredPct },
    wallet: client?.walletBalance || 0,
    trend,
  });
}));

// GET /api/portal/shipments
router.get('/shipments', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = req.user.role === 'ADMIN' ? req.query.clientCode : await getClientCode(req.user.id);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const { startStr, endStr } = parseRange(req.query);
  const { page = 1, limit = 25, search, status, courier } = req.query;
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(200, Math.max(10, parseInt(limit, 10) || 25));
  const skip = (safePage - 1) * safeLimit;
  const where = { clientCode, date: { gte: startStr, lte: endStr }, ...(status && { status }), ...(courier && { courier }), ...(search && { OR: [
    { awb:         { contains: search, mode: 'insensitive' } },
    { consignee:   { contains: search, mode: 'insensitive' } },
    { destination: { contains: search, mode: 'insensitive' } },
  ]}) };

  const [total, shipments] = await Promise.all([
    prisma.shipment.count({ where }),
    prisma.shipment.findMany({ where, orderBy: [{ date: 'desc' }, { id: 'desc' }], skip, take: safeLimit }),
  ]);
  R.ok(res, { shipments, pagination: { total, page: safePage, limit: safeLimit }, range: { from: startStr, to: endStr } });
}));

// GET /api/portal/invoices
router.get('/invoices', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = req.user.role === 'ADMIN' ? req.query.clientCode : await getClientCode(req.user.id);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');
  const invoices = await prisma.invoice.findMany({
    where: { clientCode },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  R.ok(res, { invoices });
}));

// GET /api/portal/wallet
router.get('/wallet', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = req.user.role === 'ADMIN' ? req.query.clientCode : await getClientCode(req.user.id);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');
  const [client, txns] = await Promise.all([
    prisma.client.findUnique({ where: { code: clientCode }, select: { code: true, company: true, walletBalance: true } }),
    prisma.walletTransaction.findMany({ where: { clientCode }, orderBy: { createdAt: 'desc' }, take: 50 }),
  ]);
  R.ok(res, { wallet: client, txns });
}));

// POST /api/portal/sync-tracking
// Pull latest tracking statuses from courier APIs for active client shipments in selected range.
router.post('/sync-tracking', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = req.user.role === 'ADMIN' ? req.body.clientCode : await getClientCode(req.user.id);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const { startStr, endStr } = parseRange(req.body || {});
  const maxAwbs = Math.min(100, Math.max(5, parseInt(req.body?.limit, 10) || 25));
  const activeStatuses = ['Booked', 'InTransit', 'OutForDelivery', 'Delayed', 'NDR'];

  const candidates = await prisma.shipment.findMany({
    where: {
      clientCode,
      date: { gte: startStr, lte: endStr },
      status: { in: activeStatuses },
      courier: { not: null },
    },
    select: { awb: true, courier: true },
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
    take: maxAwbs,
  });

  let refreshed = 0;
  let failed = 0;
  for (const s of candidates) {
    try {
      await carrier.syncTrackingEvents(s.courier, s.awb);
      refreshed += 1;
    } catch {
      failed += 1;
    }
  }

  R.ok(res, {
    message: `Refreshed ${refreshed} shipments${failed ? ` (${failed} failed)` : ''}`,
    refreshed,
    failed,
    scanned: candidates.length,
    range: { from: startStr, to: endStr },
  });
}));

// POST /api/portal/support-ticket
router.post('/support-ticket', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = req.user.role === 'ADMIN' ? req.body.clientCode : await getClientCode(req.user.id);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const subject = String(req.body?.subject || '').trim();
  const message = String(req.body?.message || '').trim();
  const awb = String(req.body?.awb || '').trim().toUpperCase();
  const priority = String(req.body?.priority || 'normal').trim().toLowerCase();

  if (!subject || !message) {
    return R.badRequest(res, 'subject and message are required.');
  }
  if (subject.length > 140) return R.badRequest(res, 'subject too long (max 140 chars).');
  if (message.length > 2000) return R.badRequest(res, 'message too long (max 2000 chars).');
  if (!['low', 'normal', 'high', 'urgent'].includes(priority)) return R.badRequest(res, 'invalid priority value.');

  const ticketNo = `TKT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10000 + Math.random() * 90000)}`;
  const payload = {
    ticketNo,
    clientCode,
    raisedBy: { id: req.user.id, email: req.user.email, name: req.user.name, role: req.user.role },
    subject,
    message,
    awb: awb || null,
    priority,
    source: 'CLIENT_PORTAL',
    createdAt: new Date().toISOString(),
  };

  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'CREATE_SUPPORT_TICKET',
      entity: 'SUPPORT_TICKET',
      entityId: ticketNo,
      newValue: payload,
      ip: req.ip,
    },
  });

  const recipients = await prisma.user.findMany({
    where: { active: true, role: { in: ['ADMIN', 'OPS_MANAGER'] } },
    select: { email: true, name: true },
  });

  const subjectLine = `[Support Ticket] ${ticketNo} · ${clientCode} · ${subject}`;
  const text = [
    `Ticket: ${ticketNo}`,
    `Client: ${clientCode}`,
    `Raised by: ${req.user.email}`,
    `Priority: ${priority.toUpperCase()}`,
    awb ? `AWB: ${awb}` : '',
    '',
    message,
  ].filter(Boolean).join('\n');

  await Promise.all(
    recipients
      .filter(r => !!r.email)
      .map(r => notify.sendEmail({
        to: r.email,
        subject: subjectLine,
        text,
        html: `<p><strong>Ticket:</strong> ${ticketNo}</p>
               <p><strong>Client:</strong> ${clientCode}</p>
               <p><strong>Raised by:</strong> ${req.user.email}</p>
               <p><strong>Priority:</strong> ${priority.toUpperCase()}</p>
               ${awb ? `<p><strong>AWB:</strong> ${awb}</p>` : ''}
               <p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>`,
      }))
  );

  const adminPhone = (process.env.ADMIN_WHATSAPP || '').replace(/\D/g, '');
  if (adminPhone) {
    await notify.sendWhatsApp(adminPhone, `New support ticket ${ticketNo} from ${clientCode} (${priority.toUpperCase()})${awb ? ` AWB: ${awb}` : ''}. Subject: ${subject}`);
  }

  return R.ok(res, { ticketNo }, 'Support ticket submitted successfully.');
}));

module.exports = router;
