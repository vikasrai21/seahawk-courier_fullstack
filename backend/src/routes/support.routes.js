'use strict';
const router = require('express').Router();
const prisma = require('../config/prisma');
const { protect, requireRole } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/errorHandler');
const notify = require('../services/notification.service');
const R = require('../utils/response');

const STAFF_ROLES = ['ADMIN', 'OPS_MANAGER', 'STAFF'];
const ALLOWED_STATUS = new Set(['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT', 'RESOLVED', 'CLOSED']);
const ALLOWED_PRIORITY = new Set(['LOW', 'NORMAL', 'HIGH', 'URGENT']);

async function getClientCode(user) {
  if (!user) return null;
  if (user.role !== 'CLIENT') return null;
  const link = await prisma.clientUser.findUnique({ where: { userId: user.id }, select: { clientCode: true } });
  return link?.clientCode || null;
}

function parsePayload(log) {
  return log?.newValue && typeof log.newValue === 'object' ? log.newValue : {};
}

function normalizeStatus(raw) {
  return String(raw || 'OPEN').toUpperCase();
}

function normalizePriority(raw) {
  return String(raw || 'NORMAL').toUpperCase();
}

function deriveTicketFromLogs(logs) {
  const sorted = [...logs].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const created = sorted.find((l) => l.action === 'CREATE_SUPPORT_TICKET');
  if (!created) return null;

  const base = parsePayload(created);
  const ticket = {
    ticketNo: created.entityId,
    clientCode: base.clientCode || null,
    subject: base.subject || '',
    message: base.message || '',
    awb: base.awb || null,
    source: base.source || 'PORTAL',
    raisedBy: base.raisedBy || null,
    createdAt: created.createdAt,
    status: normalizeStatus(base.status || 'OPEN'),
    priority: normalizePriority(base.priority || 'NORMAL'),
    assigneeId: base.assigneeId || null,
    assigneeName: base.assigneeName || null,
    comments: [],
    timeline: [],
    lastUpdatedAt: created.createdAt,
  };

  for (const log of sorted) {
    const data = parsePayload(log);
    const at = log.createdAt;
    ticket.lastUpdatedAt = at;

    if (log.action === 'UPDATE_SUPPORT_TICKET') {
      if (data.status) ticket.status = normalizeStatus(data.status);
      if (data.priority) ticket.priority = normalizePriority(data.priority);
      if (Object.prototype.hasOwnProperty.call(data, 'assigneeId')) ticket.assigneeId = data.assigneeId || null;
      if (Object.prototype.hasOwnProperty.call(data, 'assigneeName')) ticket.assigneeName = data.assigneeName || null;
      ticket.timeline.push({
        type: 'update',
        at,
        by: log.userEmail || 'system',
        note: data.note || 'Ticket updated',
        data,
      });
    } else if (log.action === 'COMMENT_SUPPORT_TICKET') {
      const item = {
        at,
        by: log.userEmail || 'system',
        message: data.message || '',
        internal: !!data.internal,
      };
      ticket.comments.push(item);
      ticket.timeline.push({ type: 'comment', ...item });
    } else if (log.action === 'CREATE_SUPPORT_TICKET') {
      ticket.timeline.push({
        type: 'created',
        at,
        by: log.userEmail || 'system',
        note: 'Ticket created',
      });
    }
  }

  return ticket;
}

function matchesSearch(ticket, q) {
  const query = String(q || '').trim().toLowerCase();
  if (!query) return true;
  return [
    ticket.ticketNo,
    ticket.clientCode,
    ticket.subject,
    ticket.awb,
    ticket.raisedBy?.email,
    ticket.assigneeName,
  ].filter(Boolean).some(v => String(v).toLowerCase().includes(query));
}

router.use(protect);

// GET /api/support/tickets
router.get('/tickets', requireRole(['ADMIN', 'OPS_MANAGER', 'STAFF', 'CLIENT']), asyncHandler(async (req, res) => {
  const { status, priority, q, assignee, page = 1, limit = 20 } = req.query;
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(10, parseInt(limit, 10) || 20));

  const logs = await prisma.auditLog.findMany({
    where: { entity: 'SUPPORT_TICKET' },
    orderBy: { createdAt: 'desc' },
    take: 2500,
    select: { id: true, action: true, entityId: true, userEmail: true, newValue: true, createdAt: true },
  });

  const grouped = new Map();
  for (const log of logs) {
    if (!log.entityId) continue;
    if (!grouped.has(log.entityId)) grouped.set(log.entityId, []);
    grouped.get(log.entityId).push(log);
  }

  const all = [];
  for (const [, group] of grouped) {
    const ticket = deriveTicketFromLogs(group);
    if (ticket) all.push(ticket);
  }

  const clientCode = await getClientCode(req.user);
  let filtered = all;

  if (req.user.role === 'CLIENT') {
    filtered = filtered.filter((t) => t.clientCode && t.clientCode === clientCode);
  }

  if (status) filtered = filtered.filter(t => t.status === String(status).toUpperCase());
  if (priority) filtered = filtered.filter(t => t.priority === String(priority).toUpperCase());
  if (assignee === 'me') filtered = filtered.filter(t => t.assigneeId === req.user.id);
  filtered = filtered.filter(t => matchesSearch(t, q));

  filtered.sort((a, b) => new Date(b.lastUpdatedAt) - new Date(a.lastUpdatedAt));

  const total = filtered.length;
  const start = (safePage - 1) * safeLimit;
  const data = filtered.slice(start, start + safeLimit);

  return R.paginated(res, data, total, safePage, safeLimit);
}));

// GET /api/support/tickets/:ticketNo
router.get('/tickets/:ticketNo', requireRole(['ADMIN', 'OPS_MANAGER', 'STAFF', 'CLIENT']), asyncHandler(async (req, res) => {
  const ticketNo = String(req.params.ticketNo || '').trim();
  const logs = await prisma.auditLog.findMany({
    where: { entity: 'SUPPORT_TICKET', entityId: ticketNo },
    orderBy: { createdAt: 'asc' },
    select: { id: true, action: true, entityId: true, userEmail: true, newValue: true, createdAt: true },
  });
  if (!logs.length) return R.notFound(res, 'Ticket');

  const ticket = deriveTicketFromLogs(logs);
  if (!ticket) return R.notFound(res, 'Ticket');

  if (req.user.role === 'CLIENT') {
    const clientCode = await getClientCode(req.user);
    if (!clientCode || ticket.clientCode !== clientCode) return R.forbidden(res, 'Access denied');
    ticket.comments = ticket.comments.filter(c => !c.internal);
    ticket.timeline = ticket.timeline.filter(item => !(item.type === 'comment' && item.internal));
  }

  return R.ok(res, ticket);
}));

// PATCH /api/support/tickets/:ticketNo
router.patch('/tickets/:ticketNo', requireRole(STAFF_ROLES), asyncHandler(async (req, res) => {
  const ticketNo = String(req.params.ticketNo || '').trim();
  const logs = await prisma.auditLog.findMany({
    where: { entity: 'SUPPORT_TICKET', entityId: ticketNo },
    orderBy: { createdAt: 'asc' },
    take: 500,
  });
  if (!logs.length) return R.notFound(res, 'Ticket');

  const payload = {};
  if (req.body.status) {
    const s = String(req.body.status).toUpperCase();
    if (!ALLOWED_STATUS.has(s)) return R.error(res, 'Invalid status', 400);
    payload.status = s;
  }
  if (req.body.priority) {
    const p = String(req.body.priority).toUpperCase();
    if (!ALLOWED_PRIORITY.has(p)) return R.error(res, 'Invalid priority', 400);
    payload.priority = p;
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'assigneeId')) {
    const assigneeId = req.body.assigneeId ? parseInt(req.body.assigneeId, 10) : null;
    if (assigneeId) {
      const user = await prisma.user.findUnique({ where: { id: assigneeId }, select: { id: true, name: true, role: true, active: true } });
      if (!user || !user.active || !STAFF_ROLES.includes(user.role)) return R.error(res, 'Invalid assignee', 400);
      payload.assigneeId = user.id;
      payload.assigneeName = user.name;
    } else {
      payload.assigneeId = null;
      payload.assigneeName = null;
    }
  }
  if (req.body.note) payload.note = String(req.body.note).slice(0, 500);

  if (!Object.keys(payload).length) return R.error(res, 'No fields to update', 400);

  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'UPDATE_SUPPORT_TICKET',
      entity: 'SUPPORT_TICKET',
      entityId: ticketNo,
      newValue: payload,
      ip: req.ip,
    },
  });

  return R.ok(res, { ticketNo, ...payload }, 'Ticket updated');
}));

// POST /api/support/tickets/:ticketNo/comment
router.post('/tickets/:ticketNo/comment', requireRole(['ADMIN', 'OPS_MANAGER', 'STAFF', 'CLIENT']), asyncHandler(async (req, res) => {
  const ticketNo = String(req.params.ticketNo || '').trim();
  const message = String(req.body?.message || '').trim();
  if (!message) return R.error(res, 'message is required', 400);
  if (message.length > 2000) return R.error(res, 'message too long', 400);

  const logs = await prisma.auditLog.findMany({
    where: { entity: 'SUPPORT_TICKET', entityId: ticketNo },
    orderBy: { createdAt: 'asc' },
    take: 500,
  });
  if (!logs.length) return R.notFound(res, 'Ticket');

  const ticket = deriveTicketFromLogs(logs);
  if (!ticket) return R.notFound(res, 'Ticket');

  const internal = !!req.body.internal && req.user.role !== 'CLIENT';
  if (req.user.role === 'CLIENT') {
    const clientCode = await getClientCode(req.user);
    if (!clientCode || ticket.clientCode !== clientCode) return R.forbidden(res, 'Access denied');
  }

  const commentPayload = {
    message,
    internal,
  };
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'COMMENT_SUPPORT_TICKET',
      entity: 'SUPPORT_TICKET',
      entityId: ticketNo,
      newValue: commentPayload,
      ip: req.ip,
    },
  });

  if (req.user.role === 'CLIENT') {
    const recipients = await prisma.user.findMany({
      where: { active: true, role: { in: ['ADMIN', 'OPS_MANAGER'] } },
      select: { email: true },
    });
    await Promise.all(
      recipients.filter(r => !!r.email).map(r => notify.sendEmail({
        to: r.email,
        subject: `[Support Ticket Reply] ${ticketNo} · ${ticket.clientCode}`,
        text: `Client replied on ticket ${ticketNo}\n\n${message}`,
      }))
    );
  }

  return R.ok(res, { ticketNo }, 'Comment added');
}));

module.exports = router;
