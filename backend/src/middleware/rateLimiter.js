'use strict';
const rateLimit = require('express-rate-limit');

// ── Login: 5 attempts per 15 min ──────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      5,
  message:  { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false,
  skipSuccessfulRequests: true,
});

// ── OTP: 10 attempts per 15 min (stricter) ────────────────────────────────
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { success: false, message: 'Too many OTP attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// ── General API: 300 per 15 min ───────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      300,
  message:  { success: false, message: 'Too many requests. Slow down.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// ── Sensitive actions: 3 per hour ────────────────────────────────────────
const sensitiveActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max:      3,
  message:  { success: false, message: 'Too many attempts. Try again in 1 hour.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

module.exports = { loginLimiter, otpLimiter, apiLimiter, sensitiveActionLimiter };
