const router = require('express').Router();
const ctrl   = require('../controllers/invoice.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { invoiceSchema } = require('../validators/shipment.validator');

router.use(protect);
router.get('/',             ctrl.getAll);
router.get('/:id',          ctrl.getOne);
router.post('/',            validate(invoiceSchema), ctrl.create);
router.patch('/:id/status', ctrl.setStatus);
router.delete('/:id',       adminOnly, ctrl.remove); // ADMIN only
module.exports = router;

// ── PDF download ──────────────────────────────────────────────────────────
router.get('/:id/pdf', async (req, res) => {
  try {
    const prisma   = require('../config/prisma');
    const pdf      = require('../services/pdf.service');
    const R        = require('../utils/response');
    const invoice  = await prisma.invoice.findUnique({
      where:   { id: parseInt(req.params.id) },
      include: { client: true, items: true },
    });
    if (!invoice) return R.error(res, 'Invoice not found', 404);
    const buf = await pdf.generateInvoicePDF(invoice);
    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNo}.pdf"`,
    });
    res.send(buf);
  } catch (err) {
    require('../utils/response').error(res, err.message);
  }
});
