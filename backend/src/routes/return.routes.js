/* ============================================================
   return.routes.js — Admin Return Management Routes
   ============================================================ */
'use strict';

const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/errorHandler');
const R = require('../utils/response');
const returnService = require('../services/return.service');

const MGMT = ['ADMIN', 'OPS_MANAGER', 'OWNER'];
const actorFromReq = (req) => ({
  userId: req.user?.id || null,
  userEmail: req.user?.email || null,
  ip: req.ip || null,
});

/* ── GET /api/returns — List all return requests ── */
router.get('/', authenticate, requireRole(MGMT), asyncHandler(async (req, res) => {
  const { status, returnMethod, reason, clientCode, dateFrom, dateTo, page, limit, search } = req.query;
  const result = await returnService.listReturns({ status, returnMethod, reason, clientCode, dateFrom, dateTo, page, limit, search });
  return R.ok(res, result);
}));

/* ── GET /api/returns/stats — Return stats overview ── */
router.get('/stats', authenticate, requireRole(MGMT), asyncHandler(async (req, res) => {
  const { clientCode } = req.query;
  const stats = await returnService.getReturnStats(clientCode || undefined);
  return R.ok(res, stats);
}));

/* ── POST /api/returns/sync-tracking — Sync active reverse tracking ── */
router.post('/sync-tracking', authenticate, requireRole(MGMT), asyncHandler(async (req, res) => {
  const { limit } = req.body || {};
  const result = await returnService.syncActiveReverseReturns(limit, actorFromReq(req));
  return R.ok(res, result);
}));

/* ── GET /api/returns/:id/timeline — Return audit timeline ── */
router.get('/:id/timeline', authenticate, requireRole(MGMT), asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const timeline = await returnService.getReturnTimeline(req.params.id, { limit });
  return R.ok(res, timeline);
}));

/* ── GET /api/returns/:id — Get single return detail ── */
router.get('/:id', authenticate, requireRole(MGMT), asyncHandler(async (req, res) => {
  const ret = await returnService.getReturn(req.params.id);
  return R.ok(res, ret);
}));

/* ── POST /api/returns/:id/approve — Approve return ── */
router.post('/:id/approve', authenticate, requireRole(MGMT), asyncHandler(async (req, res) => {
  const { adminNotes, autoBook } = req.body;
  const ret = await returnService.approveReturn(req.params.id, { adminNotes, autoBook }, actorFromReq(req));
  return R.ok(res, ret);
}));

/* ── POST /api/returns/:id/reject — Reject return ── */
router.post('/:id/reject', authenticate, requireRole(MGMT), asyncHandler(async (req, res) => {
  const { adminNotes } = req.body;
  const ret = await returnService.rejectReturn(req.params.id, { adminNotes }, actorFromReq(req));
  return R.ok(res, ret);
}));

/* ── POST /api/returns/:id/book-pickup — Book reverse pickup ── */
router.post('/:id/book-pickup', authenticate, requireRole(MGMT), asyncHandler(async (req, res) => {
  const ret = await returnService.bookReversePickup(req.params.id, actorFromReq(req));
  return R.ok(res, ret);
}));

/* ── POST /api/returns/:id/generate-label — Generate self-ship prepaid label ── */
router.post('/:id/generate-label', authenticate, requireRole(MGMT), asyncHandler(async (req, res) => {
  const ret = await returnService.generateSelfShipLabel(req.params.id, actorFromReq(req));
  return R.ok(res, ret);
}));

/* ── POST /api/returns/:id/sync-tracking — Sync one reverse tracking ── */
router.post('/:id/sync-tracking', authenticate, requireRole(MGMT), asyncHandler(async (req, res) => {
  const ret = await returnService.syncReverseTracking(req.params.id, actorFromReq(req));
  return R.ok(res, ret);
}));

/* ── PATCH /api/returns/:id/status — Manual status update ── */
router.patch('/:id/status', authenticate, requireRole(MGMT), asyncHandler(async (req, res) => {
  const { status, force } = req.body;
  const ret = await returnService.updateReturnStatus(req.params.id, status, { force }, actorFromReq(req));
  return R.ok(res, ret);
}));

module.exports = router;
