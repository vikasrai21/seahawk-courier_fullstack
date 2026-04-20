'use strict';
/**
 * notification.routes.js — Admin notification management routes
 * 
 * Allows owner/staff to trigger shipment notifications,
 * send daily digests, bulk updates, and view notification history.
 */

const router = require('express').Router();
const R = require('../utils/response');
const { protect, requireOwnerOrRole } = require('../middleware/auth.middleware');
const notifEngine = require('../services/notificationEngine.service');
const prisma = require('../config/prisma');
const logger = require('../utils/logger');

router.use(protect);
const allowNotifManagement = requireOwnerOrRole('ADMIN', 'OPS_MANAGER', 'STAFF');

// POST /api/notifications/send-update — send status notification for a shipment
router.post('/send-update', allowNotifManagement, async (req, res) => {
  try {
    const { awb, forceEmail, forceWhatsapp } = req.body;
    if (!awb) return R.error(res, 'AWB is required', 400);
    const result = await notifEngine.sendShipmentUpdate(awb, { forceEmail, forceWhatsapp });
    if (result.error) return R.error(res, result.error, 400);
    R.ok(res, result, `Notification sent for ${awb}`);
  } catch (err) {
    logger.error(`[Notifications] Send update error: ${err.message}`);
    R.error(res, err.message);
  }
});

// POST /api/notifications/send-digest — send daily digest to a client
router.post('/send-digest', allowNotifManagement, async (req, res) => {
  try {
    const { clientCode, date } = req.body;
    if (!clientCode || !date) return R.error(res, 'clientCode and date are required', 400);
    const result = await notifEngine.sendDailyDigest(clientCode, date);
    if (result.error) return R.error(res, result.error, 400);
    R.ok(res, result, `Digest sent for ${clientCode} on ${date}`);
  } catch (err) {
    logger.error(`[Notifications] Send digest error: ${err.message}`);
    R.error(res, err.message);
  }
});

// POST /api/notifications/send-bulk — send bulk notifications for date range
router.post('/send-bulk', allowNotifManagement, async (req, res) => {
  try {
    const { clientCode, dateFrom, dateTo } = req.body;
    if (!clientCode || !dateFrom || !dateTo) return R.error(res, 'clientCode, dateFrom, and dateTo are required', 400);
    const result = await notifEngine.sendBulkDateUpdate(clientCode, dateFrom, dateTo);
    if (result.error) return R.error(res, result.error, 400);
    R.ok(res, result, `Bulk update sent for ${clientCode}`);
  } catch (err) {
    logger.error(`[Notifications] Bulk send error: ${err.message}`);
    R.error(res, err.message);
  }
});

// GET /api/notifications/history — view notification history
router.get('/history', allowNotifManagement, async (req, res) => {
  try {
    const { clientCode, channel, limit } = req.query;
    const history = await notifEngine.getHistory({
      clientCode,
      channel,
      limit: parseInt(limit) || 50,
    });
    R.ok(res, history);
  } catch (err) {
    R.error(res, err.message);
  }
});

// GET /api/notifications/preferences/:clientCode — get client notification prefs
router.get('/preferences/:clientCode', allowNotifManagement, async (req, res) => {
  try {
    const notify = require('../services/notification.service');
    const prefs = await notify.getClientNotificationPreferences(req.params.clientCode);
    R.ok(res, prefs);
  } catch (err) {
    R.error(res, err.message);
  }
});

// GET /api/notifications/stats — notification delivery stats
router.get('/stats', allowNotifManagement, async (req, res) => {
  try {
    const [total, sent, failed, queued, byChannel] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.count({ where: { status: 'SENT' } }),
      prisma.notification.count({ where: { status: 'FAILED' } }),
      prisma.notification.count({ where: { status: 'QUEUED' } }),
      prisma.notification.groupBy({
        by: ['channel'],
        _count: { id: true },
        where: { createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
      }),
    ]);
    R.ok(res, {
      total, sent, failed, queued,
      deliveryRate: total > 0 ? parseFloat((sent / total * 100).toFixed(1)) : 0,
      byChannel: byChannel.map((c) => ({ channel: c.channel, count: c._count.id })),
    });
  } catch (err) {
    R.error(res, err.message);
  }
});

module.exports = router;
