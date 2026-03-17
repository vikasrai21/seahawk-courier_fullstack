// src/routes/public.routes.js — No auth required
const router = require('express').Router();
const prisma  = require('../config/prisma');
const R       = require('../utils/response');
const rateLimit = require('express-rate-limit');

// Stricter rate limit for public endpoints
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      60,
  message:  { success: false, message: 'Too many requests.' },
});

// GET /api/public/track/:awb — public shipment tracking
router.get('/track/:awb', publicLimiter, async (req, res) => {
  try {
    const { awb } = req.params;
    if (!awb || awb.length < 5) return R.error(res, 'Invalid AWB number.', 400);

    const shipment = await prisma.shipment.findUnique({
      where: { awb: awb.trim().toUpperCase() },
      select: {
        awb:         true,
        consignee:   true,
        destination: true,
        status:      true,
        courier:     true,
        date:        true,
        weight:      true,
        ndrStatus:   true,
        updatedAt:   true,
        trackingEvents: {
          orderBy: { timestamp: 'desc' },
          select:  { status: true, location: true, description: true, timestamp: true },
        },
      },
    });

    if (!shipment) return R.error(res, 'Shipment not found. Please check your AWB number.', 404);

    // Don't expose client financial data publicly
    R.ok(res, shipment);
  } catch (err) {
    R.error(res, 'Something went wrong. Please try again.', 500);
  }
});

// GET /api/public/health — simple health for uptime monitors
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
