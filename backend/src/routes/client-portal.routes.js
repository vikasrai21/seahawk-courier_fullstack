// src/routes/client-portal.routes.js — Client self-service endpoints
'use strict';
const router  = require('express').Router();
const prisma  = require('../config/prisma');
const { protect, requireRole } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/errorHandler');
const R = require('../utils/response');

const clientOnly = requireRole('CLIENT', 'ADMIN');

// Helper: get clientCode for logged-in CLIENT user
async function getClientCode(userId) {
  const cu = await prisma.clientUser.findUnique({ where: { userId }, select: { clientCode: true } });
  return cu?.clientCode;
}

// GET /api/portal/stats
router.get('/stats', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = req.user.role === 'ADMIN' ? req.query.clientCode : await getClientCode(req.user.id);
  if (!clientCode) return R.notFound(res, 'Client profile not linked to this account.');

  const todayStr = new Date().toISOString().split('T')[0];

  const [total, transit, delivered, client] = await Promise.all([
    prisma.shipment.count({ where: { clientCode, date: { lt: todayStr } } }),
    prisma.shipment.count({ where: { clientCode, date: { lt: todayStr }, status: 'InTransit' } }),
    prisma.shipment.count({ where: { clientCode, date: { lt: todayStr }, status: 'Delivered' } }),
    prisma.client.findUnique({ where: { code: clientCode }, select: { walletBalance: true } }),
  ]);
  R.ok(res, { total, transit, delivered, wallet: client?.walletBalance || 0 });
}));

// GET /api/portal/shipments
router.get('/shipments', protect, clientOnly, asyncHandler(async (req, res) => {
  const clientCode = req.user.role === 'ADMIN' ? req.query.clientCode : await getClientCode(req.user.id);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const todayStr = new Date().toISOString().split('T')[0];
  const { page = 1, limit = 25, search, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = { clientCode, date: { lt: todayStr }, ...(status && { status }), ...(search && { OR: [
    { awb:         { contains: search, mode: 'insensitive' } },
    { consignee:   { contains: search, mode: 'insensitive' } },
    { destination: { contains: search, mode: 'insensitive' } },
  ]}) };

  const [total, shipments] = await Promise.all([
    prisma.shipment.count({ where }),
    prisma.shipment.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit) }),
  ]);
  R.ok(res, { shipments, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
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

module.exports = router;
