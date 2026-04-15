// src/routes/audit.routes.js
const router = require('express').Router();
const crypto = require('crypto');
const ctrl   = require('../controllers/audit.controller');
const prisma = require('../config/prisma');
const config = require('../config');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const R = require('../utils/response');

router.use(protect);
router.get('/', adminOnly, ctrl.getAll);
router.get('/evidence-pack', async (req, res, next) => {
  try {
    if (!(req.user?.isOwner || req.user?.role === 'ADMIN' || req.user?.role === 'CLIENT')) {
      return R.forbidden(res, 'Access denied.');
    }
    const from = req.query?.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 86400000);
    const to = req.query?.to ? new Date(req.query.to) : new Date();
    const [auditCount, failedWebhooks, failedJobs, notificationsFailed] = await Promise.all([
      prisma.auditLog.count({ where: { createdAt: { gte: from, lte: to } } }),
      prisma.auditLog.count({
        where: {
          entity: 'INTEGRATION_WEBHOOK',
          action: 'INTEGRATION_DRAFT_FAILED',
          createdAt: { gte: from, lte: to },
        },
      }),
      prisma.jobQueue.count({ where: { status: 'FAILED', createdAt: { gte: from, lte: to } } }),
      prisma.notification.count({ where: { status: 'FAILED', createdAt: { gte: from, lte: to } } }),
    ]);
    const generatedAt = new Date().toISOString();
    const payload = {
      window: { from: from.toISOString(), to: to.toISOString() },
      generatedAt,
      generatedBy: req.user?.email || null,
      controls: {
        immutableAuditTrail: true,
        requestCorrelation: true,
        webhookDeadLetterQueue: true,
        apiKeyScopes: true,
      },
      metrics: {
        auditRecords: auditCount,
        failedWebhookEvents: failedWebhooks,
        failedBackgroundJobs: failedJobs,
        failedNotifications: notificationsFailed,
      },
    };
    const checksum = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    const signingSecret = String(config.operations.auditEvidenceSigningSecret || '').trim();
    const signature = signingSecret
      ? crypto.createHmac('sha256', signingSecret).update(`${generatedAt}.${checksum}`).digest('hex')
      : null;
    R.ok(res, { ...payload, checksum, signature });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
