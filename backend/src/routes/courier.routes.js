'use strict';
// src/routes/courier.routes.js — Courier API & rate comparison
const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { CourierFactory } = require('../services/couriers/CourierFactory');
const R = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

router.use(protect);

// GET /api/couriers — list all couriers and which ones are configured
router.get('/', asyncHandler(async (req, res) => {
  const all        = CourierFactory.getAll();
  const configured = CourierFactory.getConfigured();
  const couriers   = all.map(name => ({ name, configured: configured.includes(name) }));
  R.ok(res, { couriers, configuredCount: configured.length });
}));

// GET /api/couriers/rates?originPin=&destPin=&weight=&cod=
// Compare rates across all configured couriers
router.get('/rates', asyncHandler(async (req, res) => {
  const { originPin, destPin, weight, cod } = req.query;
  if (!destPin) return R.error(res, 'destPin is required', 400);

  const rates = await CourierFactory.compareRates({
    originPin: originPin || process.env.DEFAULT_ORIGIN_PIN || '122015',
    destPin,
    weight:    parseFloat(weight) || 0.5,
    cod:       parseFloat(cod) || 0,
  });

  // Sort by cheapest first
  const sorted = rates.sort((a, b) => {
    const aTotal = a.rate?.total || a.rate?.Total || 9999;
    const bTotal = b.rate?.total || b.rate?.Total || 9999;
    return aTotal - bTotal;
  });

  R.ok(res, { rates: sorted, cheapest: sorted[0]?.courier || null });
}));

// GET /api/couriers/serviceability?originPin=&destPin=
router.get('/serviceability', asyncHandler(async (req, res) => {
  const { originPin, destPin } = req.query;
  if (!destPin) return R.error(res, 'destPin is required', 400);

  const results = await CourierFactory.checkAllServiceability(
    originPin || process.env.DEFAULT_ORIGIN_PIN || '122015',
    destPin
  );

  const serviceable = results.filter(r => r.serviceable).map(r => r.courier);
  R.ok(res, { results, serviceableCount: serviceable.length, serviceable });
}));

// POST /api/couriers/:courier/book — book shipment with specific courier
router.post('/:courier/book', asyncHandler(async (req, res) => {
  const courierName = req.params.courier;
  try {
    const provider = CourierFactory.get(courierName);
    const result   = await provider.createShipment(req.body);
    R.ok(res, result, `Shipment booked with ${courierName}`);
  } catch (err) {
    R.error(res, err.message, err.message.includes('not configured') ? 503 : 400);
  }
}));

// GET /api/couriers/:courier/track/:awb
router.get('/:courier/track/:awb', asyncHandler(async (req, res) => {
  const { courier: courierName, awb } = req.params;
  try {
    const provider = CourierFactory.get(courierName);
    const result   = await provider.trackShipment(awb);
    R.ok(res, result);
  } catch (err) {
    R.error(res, err.message, 400);
  }
}));

// GET /api/couriers/:courier/label/:awb
router.get('/:courier/label/:awb', asyncHandler(async (req, res) => {
  const { courier: courierName, awb } = req.params;
  try {
    const provider = CourierFactory.get(courierName);
    const result   = await provider.getLabel(awb);
    R.ok(res, result);
  } catch (err) {
    R.error(res, err.message, 400);
  }
}));

// DELETE /api/couriers/:courier/cancel/:awb
router.delete('/:courier/cancel/:awb', asyncHandler(async (req, res) => {
  const { courier: courierName, awb } = req.params;
  try {
    const provider = CourierFactory.get(courierName);
    const result   = await provider.cancelShipment(awb);
    R.ok(res, result);
  } catch (err) {
    R.error(res, err.message, 400);
  }
}));

module.exports = router;
