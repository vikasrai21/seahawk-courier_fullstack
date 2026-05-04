"use strict";
// dev-approvals.routes.js — Governance approval request + decision flow
// Split from developer.routes.js

const router = require('express').Router();
const prisma = require('../config/prisma');
const R = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  resolveClientCode,
  normalizeApprovalAction,
  APPROVABLE_ACTIONS,
} = require('./dev-helpers');

// POST /api/portal/developer/approvals
router.post('/approvals', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');
  const approvalAction = normalizeApprovalAction(req.body?.approvalAction);
  if (!approvalAction) return R.badRequest(res, `approvalAction must be one of: ${APPROVABLE_ACTIONS.join(', ')}`);
  const payload = req.body?.payload && typeof req.body.payload === 'object' ? req.body.payload : {};
  const reason = String(req.body?.reason || '').trim();
  const requestNo = `APR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10000 + Math.random() * 90000)}`;

  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'APPROVAL_REQUESTED',
      entity: 'CLIENT_GOVERNANCE',
      entityId: `${clientCode}:${requestNo}`,
      newValue: {
        requestNo,
        clientCode,
        approvalAction,
        reason: reason || null,
        payload,
        status: 'PENDING',
      },
      ip: req.ip,
    },
  });

  R.created(res, { requestNo, approvalAction, status: 'PENDING' }, 'Approval request submitted');
}));

// GET /api/portal/developer/approvals
router.get('/approvals', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');
  const limit = Math.min(100, Math.max(10, parseInt(req.query?.limit, 10) || 40));
  const rows = await prisma.auditLog.findMany({
    where: {
      entity: 'CLIENT_GOVERNANCE',
      entityId: { startsWith: `${clientCode}:` },
      action: { in: ['APPROVAL_REQUESTED', 'APPROVAL_DECIDED'] },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      action: true,
      entityId: true,
      userEmail: true,
      newValue: true,
      createdAt: true,
    },
  });
  R.ok(res, rows);
}));

// POST /api/portal/developer/approvals/:requestNo/decide
router.post('/approvals/:requestNo/decide', asyncHandler(async (req, res) => {
  const clientCode = resolveClientCode(req);
  if (!clientCode) return R.badRequest(res, 'clientCode is required');
  if (!req.user?.isOwner && req.user.role !== 'ADMIN') return R.forbidden(res, 'Only admin or owner can approve or reject requests.');
  const requestNo = String(req.params.requestNo || '').trim();
  const decision = String(req.body?.decision || '').trim().toUpperCase();
  if (!['APPROVED', 'REJECTED'].includes(decision)) return R.badRequest(res, 'decision must be APPROVED or REJECTED');
  const requestKey = `${clientCode}:${requestNo}`;
  const source = await prisma.auditLog.findFirst({
    where: {
      entity: 'CLIENT_GOVERNANCE',
      entityId: requestKey,
      action: 'APPROVAL_REQUESTED',
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!source) return R.notFound(res, 'Approval request');
  if (source.userId && source.userId === req.user.id) {
    return R.forbidden(res, 'Maker-checker violation: requester cannot approve their own request.');
  }
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'APPROVAL_DECIDED',
      entity: 'CLIENT_GOVERNANCE',
      entityId: requestKey,
      newValue: {
        requestNo,
        decision,
        decidedBy: req.user.email,
        note: String(req.body?.note || '').trim() || null,
      },
      ip: req.ip,
    },
  });
  R.ok(res, { requestNo, decision }, `Request ${decision.toLowerCase()}`);
}));

module.exports = router;
