// src/routes/quote.routes.js
const router = require('express').Router();
const { protect, staffOnly } = require('../middleware/auth.middleware');
const Q = require('../services/quote.service');
const R = require('../utils/response');

router.use(protect, staffOnly);

router.get('/',      async (req, res, next) => { try { const r = await Q.listQuotes(req.query); R.paginated(res, r.data, r.total, r.page, r.limit); } catch(e){next(e);} });
router.get('/stats', async (req, res, next) => { try { R.ok(res, await Q.getQuoteStats()); } catch(e){next(e);} });
router.post('/',     async (req, res, next) => { try { R.created(res, await Q.createQuote(req.body, req.user.id)); } catch(e){next(e);} });
router.patch('/:id/status', async (req, res, next) => {
  try { R.ok(res, await Q.updateQuoteStatus(req.params.id, req.body.status)); } catch(e){next(e);}
});

module.exports = router;
