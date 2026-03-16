// src/routes/reconciliation.routes.js
const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const S = require('../services/reconciliation.service');
const R = require('../utils/response');

router.use(protect);

router.get('/',           async (req, res, next) => { try { const r = await S.listCourierInvoices(req.query); R.paginated(res, r.data, r.total, r.page, r.limit); } catch(e){next(e);} });
router.get('/stats',      async (req, res, next) => { try { R.ok(res, await S.getReconciliationStats()); } catch(e){next(e);} });
router.get('/:id',        async (req, res, next) => { try { const d = await S.getCourierInvoiceDetails(req.params.id); d ? R.ok(res, d) : R.notFound(res, 'Invoice'); } catch(e){next(e);} });
router.post('/',          async (req, res, next) => { try { R.created(res, await S.uploadCourierInvoice(req.body, req.user.id)); } catch(e){next(e);} });
router.patch('/:id/status', async (req, res, next) => {
  try { R.ok(res, await S.updateInvoiceStatus(req.params.id, req.body.status, req.body.notes)); } catch(e){next(e);}
});

module.exports = router;
