'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/invoice.controller');
const { protect, adminOnly, requireRole, staffOnly } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { invoiceSchema } = require('../validators/shipment.validator');
const prisma  = require('../config/prisma');
const pdf     = require('../services/pdf.service');
const email   = require('../services/email.service');
const R       = require('../utils/response');
const logger  = require('../utils/logger');

router.use(protect);

// Standard CRUD
router.get('/',             staffOnly, ctrl.getAll);
router.get('/:id',          staffOnly, ctrl.getOne);
router.post('/',            staffOnly, validate(invoiceSchema), ctrl.create);
router.patch('/:id/status', staffOnly, ctrl.setStatus);
router.delete('/:id',       adminOnly, ctrl.remove);

// ── PDF download ──────────────────────────────────────────────────────────
router.get('/:id/pdf', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where:   { id: parseInt(req.params.id) },
      include: { client: true, items: { orderBy: { date: 'asc' } } },
    });
    if (!invoice) return R.error(res, 'Invoice not found', 404);

    // CLIENT role can only access their own invoices
    if (req.user.role === 'CLIENT' && req.user.clientCode !== invoice.clientCode) {
      return R.forbidden(res, 'Access denied');
    }

    const buf = await pdf.generateInvoicePDF(invoice, invoice.items, invoice.client);
    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNo}.pdf"`,
      'Content-Length':      buf.length,
    });
    res.send(buf);
  } catch (err) {
    logger.error(`[Invoice PDF] ${err.message}`);
    R.error(res, err.message);
  }
});

// ── Send invoice by email ─────────────────────────────────────────────────
router.post('/:id/send-email', requireRole('ADMIN', 'STAFF', 'OPS_MANAGER'), async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where:   { id: parseInt(req.params.id) },
      include: { client: true, items: { orderBy: { date: 'asc' } } },
    });
    if (!invoice) return R.error(res, 'Invoice not found', 404);

    // Determine recipient email
    const toEmail = req.body.email || invoice.client?.email;
    if (!toEmail) return R.error(res, 'No email address. Add email to client profile or provide in request body.', 400);

    // Generate PDF
    const pdfBuf = await pdf.generateInvoicePDF(invoice, invoice.items, invoice.client);

    // Send email
    const result = await email.sendInvoice({
      to:         toEmail,
      invoiceNo:  invoice.invoiceNo,
      clientName: invoice.client?.company || invoice.clientCode,
      total:      invoice.total,
      fromDate:   invoice.fromDate,
      toDate:     invoice.toDate,
      pdfBuffer:  pdfBuf,
    });

    if (result.skipped) {
      return R.error(res, 'Email not configured. Set EMAIL_USER and EMAIL_PASS in environment variables.', 503);
    }

    // Update invoice status to SENT if it was DRAFT
    if (invoice.status === 'DRAFT') {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data:  { status: 'SENT' },
      });
    }

    R.ok(res, { sent: true, to: toEmail, messageId: result.messageId }, `Invoice sent to ${toEmail}`);
  } catch (err) {
    logger.error(`[Invoice Email] ${err.message}`);
    R.error(res, err.message);
  }
});

module.exports = router;
