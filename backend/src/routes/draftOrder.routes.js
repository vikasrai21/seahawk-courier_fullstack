// src/routes/draftOrder.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, requireClientAccountAccess } = require('../middleware/auth.middleware');
const svc = require('../services/draftOrder.service');
const R = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

// Apply auth to all routes
router.use(authenticate);

/**
 * GET /api/drafts
 * Clients only see their own. Ops can specify ?clientCode=XYZ or see all.
 */
router.get('/', asyncHandler(async (req, res) => {
  const { status, q, page = 1, limit = 50 } = req.query;
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 50;
  
  let clientCode = req.query.clientCode;
  
  // If user is CLIENT, force their own client code
  if (req.user?.role === 'CLIENT') {
    clientCode = req.user.clientCode;
    if (!clientCode) return res.status(403).json({ success: false, message: 'No client profile attached' });
  }

  const result = await svc.getAll({ clientCode, status, q }, pageNum, limitNum);
  R.paginated(res, result.drafts, result.total, pageNum, limitNum);
}));

/**
 * POST /api/drafts
 * Create a single draft order
 */
router.post('/', requireClientAccountAccess({ body: 'clientCode' }), asyncHandler(async (req, res) => {
  const clientCode = req.body?.clientCode || req.user?.clientCode;
  const draft = await svc.create({ ...req.body, clientCode }, req.user?.id);
  R.created(res, draft, 'Draft order created');
}));

/**
 * POST /api/drafts/bulk
 * Create multiple draft orders
 */
router.post('/bulk', requireClientAccountAccess({ body: 'clientCode' }), asyncHandler(async (req, res) => {
  const clientCode = req.body?.clientCode || req.user?.clientCode;
  const result = await svc.bulkCreate(req.body.drafts, clientCode);
  R.created(res, result, `Imported ${result.createdCount} draft orders`);
}));

/**
 * DELETE /api/drafts/:id
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  await svc.remove(req.params.id);
  R.ok(res, null, 'Draft deleted');
}));

module.exports = router;
