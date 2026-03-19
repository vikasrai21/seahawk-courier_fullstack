'use strict';
// client-portal.routes.js — API routes for CLIENT role users
// Clients can view ONLY their own data — shipments, invoices, wallet

const router = require('express').Router();
const prisma  = require('../config/prisma');
const R       = require('../utils/response');
const { protect, requireRole } = require('../middleware/auth.middleware');
const pdf     = require('../services/pdf.service');

// All routes require CLIENT role
router.use(protect);
router.use(requireRole('CLIENT'));

// Middleware to ensure client code is always scoped
const clientScope = (req, res, next) => {
  if (!req.user.clientCode) return R.error(res, 'Your account is not linked to a client. Contact admin.', 403);
  next();
};
router.use(clientScope);

// ── GET /api/client-portal/me ─────────────────────────────────────────────
// Client profile + wallet balance
router.get('/me', async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where:  { code: req.user.clientCode },
      select: { code: true, company: true, contact: true, phone: true, email: true, gst: true, address: true, walletBalance: true, active: true },
    });
    if (!client) return R.error(res, 'Client account not found', 404);
    R.ok(res, { user: req.user, client });
  } catch (err) { R.error(res, err.message); }
});

// ── GET /api/client-portal/shipments ─────────────────────────────────────
// Client's own shipments with filters
router.get('/shipments', async (req, res) => {
  try {
    const { status, courier, dateFrom, dateTo, q, page = 1, limit = 50 } = req.query;
    const where = { clientCode: req.user.clientCode };
    if (status)   where.status  = status;
    if (courier)  where.courier = { contains: courier, mode: 'insensitive' };
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = dateFrom;
      if (dateTo)   where.date.lte = dateTo;
    }
    if (q) {
      where.OR = [
        { awb:         { contains: q, mode: 'insensitive' } },
        { consignee:   { contains: q, mode: 'insensitive' } },
        { destination: { contains: q, mode: 'insensitive' } },
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [total, shipments] = await prisma.$transaction([
      prisma.shipment.count({ where }),
      prisma.shipment.findMany({
        where,
        select: { id: true, date: true, awb: true, consignee: true, destination: true, weight: true, amount: true, courier: true, department: true, service: true, status: true, ndrStatus: true, remarks: true, createdAt: true },
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        skip,
        take: parseInt(limit),
      }),
    ]);
    R.ok(res, { shipments, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { R.error(res, err.message); }
});

// ── GET /api/client-portal/shipments/stats ────────────────────────────────
router.get('/shipments/stats', async (req, res) => {
  try {
    const where = { clientCode: req.user.clientCode };
    const [total, delivered, inTransit, rto, pending, revenue] = await Promise.all([
      prisma.shipment.count({ where }),
      prisma.shipment.count({ where: { ...where, status: 'Delivered' } }),
      prisma.shipment.count({ where: { ...where, status: 'In Transit' } }),
      prisma.shipment.count({ where: { ...where, status: 'RTO' } }),
      prisma.shipment.count({ where: { ...where, status: { in: ['Booked', 'Picked Up'] } } }),
      prisma.shipment.aggregate({ where, _sum: { amount: true } }),
    ]);
    R.ok(res, { total, delivered, inTransit, rto, pending, totalRevenue: revenue._sum.amount || 0 });
  } catch (err) { R.error(res, err.message); }
});

// ── GET /api/client-portal/track/:awb ─────────────────────────────────────
// Track a specific AWB (only if it belongs to this client)
router.get('/track/:awb', async (req, res) => {
  try {
    const shipment = await prisma.shipment.findFirst({
      where:   { awb: req.params.awb, clientCode: req.user.clientCode },
      include: { trackingEvents: { orderBy: { timestamp: 'desc' }, take: 20 } },
    });
    if (!shipment) return R.error(res, 'Shipment not found or not accessible', 404);
    R.ok(res, shipment);
  } catch (err) { R.error(res, err.message); }
});

// ── GET /api/client-portal/invoices ──────────────────────────────────────
router.get('/invoices', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where:   { clientCode: req.user.clientCode },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' },
    });
    R.ok(res, invoices);
  } catch (err) { R.error(res, err.message); }
});

// ── GET /api/client-portal/invoices/:id ──────────────────────────────────
router.get('/invoices/:id', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where:   { id: parseInt(req.params.id), clientCode: req.user.clientCode },
      include: { items: { orderBy: { date: 'asc' } }, client: true },
    });
    if (!invoice) return R.error(res, 'Invoice not found', 404);
    R.ok(res, invoice);
  } catch (err) { R.error(res, err.message); }
});

// ── GET /api/client-portal/invoices/:id/pdf ───────────────────────────────
router.get('/invoices/:id/pdf', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where:   { id: parseInt(req.params.id), clientCode: req.user.clientCode },
      include: { items: { orderBy: { date: 'asc' } }, client: true },
    });
    if (!invoice) return R.error(res, 'Invoice not found', 404);
    const buf = await pdf.generateInvoicePDF(invoice, invoice.items, invoice.client);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNo}.pdf"` });
    res.send(buf);
  } catch (err) { R.error(res, err.message); }
});

// ── GET /api/client-portal/wallet ────────────────────────────────────────
router.get('/wallet', async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where:  { code: req.user.clientCode },
      select: { walletBalance: true },
    });
    const transactions = await prisma.walletTransaction.findMany({
      where:   { clientCode: req.user.clientCode },
      orderBy: { createdAt: 'desc' },
      take:    50,
    });
    R.ok(res, { balance: client?.walletBalance || 0, transactions });
  } catch (err) { R.error(res, err.message); }
});

// ── GET /api/client-portal/ndrs ──────────────────────────────────────────
// Client sees their own NDR events
router.get('/ndrs', async (req, res) => {
  try {
    const shipments = await prisma.shipment.findMany({
      where:   { clientCode: req.user.clientCode, ndrStatus: { not: null } },
      include: { ndrEvents: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
      take:    50,
    });
    R.ok(res, shipments);
  } catch (err) { R.error(res, err.message); }
});

module.exports = router;
