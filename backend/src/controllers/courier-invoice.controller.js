// src/controllers/courier-invoice.controller.js
'use strict';
const prisma = require('../config/prisma');
const R      = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * GET /api/courier-invoices/pending
 */
const getPendingAudits = asyncHandler(async (req, res) => {
  const pending = await prisma.courierInvoice.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      courier: true,
      invoiceNo: true,
      totalAmount: true,
      fromDate: true,
      toDate: true,
      status: true,
      createdAt: true
    }
  });
  R.ok(res, pending);
});

/**
 * GET /api/courier-invoices/summary
 */
const getMonthlySummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [receivedCount, verifiedCount, totals, recoveries] = await Promise.all([
    // Bills received this month
    prisma.courierInvoice.count({
      where: { fromDate: { gte: firstDay }, fromDate: { lte: lastDay } }
    }),
    // Bills verified this month
    prisma.courierInvoice.count({
      where: { status: 'VERIFIED', updatedAt: { gte: new Date(firstDay) } }
    }),
    // Total billed amount
    prisma.courierInvoice.aggregate({
      _sum: { totalAmount: true },
      where: { fromDate: { gte: firstDay }, fromDate: { lte: lastDay } }
    }),
    // Cumulative recovery (year to date)
    prisma.courierInvoiceItem.aggregate({
      _sum: { discrepancy: true },
      where: { courierInvoice: { status: 'VERIFIED' } }
    })
  ]);

  R.ok(res, {
    billsReceived: receivedCount,
    verifiedCount,
    disputesRaised: 0, // Placeholder until dispute model exists
    totalBilled: totals._sum.totalAmount || 0,
    recoveredYTD: Math.abs(recoveries._sum.discrepancy || 0)
  });
});

/**
 * GET /api/courier-invoices/:id
 */
const getAuditDetails = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const invoice = await prisma.courierInvoice.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { date: 'asc' }
      }
    }
  });

  if (!invoice) return R.error(res, 'Invoice not found', 404);
  R.ok(res, invoice);
});

/**
 * POST /api/courier-invoices/:id/verify
 */
const saveAuditResult = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { items, notes, status = 'VERIFIED', finalRecoveryAmt = 0 } = req.body;

  // Transaction to update invoice status and all items
  const updatedInvoice = await prisma.$transaction(async (tx) => {
    // 1. Update individual items
    if (Array.isArray(items)) {
      for (const item of items) {
        await tx.courierInvoiceItem.updateMany({
          where: { courierInvoiceId: id, awb: item.awb },
          data: {
            calculatedAmount: item.calculatedAmount,
            discrepancy: item.discrepancy,
            status: item.status,
            notes: item.notes
          }
        });
      }
    }

    // 2. Update invoice status and totals
    return await tx.courierInvoice.update({
      where: { id },
      data: {
        status: status === 'DISPUTED' ? 'DISPUTED' : 'VERIFIED',
        recoveryTotal: parseFloat(finalRecoveryAmt || 0),
        verifiedAt: new Date(),
        notes: notes || undefined
      }
    });
  });

  R.ok(res, updatedInvoice, `Audit ${status === 'DISPUTED' ? 'marked as Disputed' : 'saved to Ledger'}`);
});

module.exports = {
  getPendingAudits,
  getMonthlySummary,
  getAuditDetails,
  saveAuditResult
};
