'use strict';

const rateLimit = require('express-rate-limit');
const router = require('express').Router();
const R = require('../utils/response');
const { lookupPincode } = require('../services/pincode.service');

const lookupLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => R.error(res, 'Too many pin lookup requests. Try again later.', 429),
});

router.use(lookupLimiter);

router.get('/lookup', async (req, res, next) => {
  const pin = String(req.query.pin || '').trim();
  if (!pin) return R.error(res, 'pin query required', 400);
  try {
    const data = await lookupPincode(pin);
    if (!data?.postOffice) return R.error(res, data?.message || 'PIN not found', 404);
    R.ok(res, data);
  } catch (err) {
    if (String(err.message || '').includes('Invalid PIN')) {
      return R.error(res, err.message, 400);
    }
    next(err);
  }
});

module.exports = router;
