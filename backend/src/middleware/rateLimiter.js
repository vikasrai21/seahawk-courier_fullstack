// src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Strict limit for login — prevents brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      5,
  message:  { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false,
  skipSuccessfulRequests: true,
});

// General API limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      300,
  message:  { success: false, message: 'Too many requests. Slow down.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// Strict limit for password reset / OTP
const sensitiveActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max:      3,
  message:  { success: false, message: 'Too many attempts. Try again in 1 hour.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// Strict limit for public tracking endpoints to prevent scraping bots
const publicTrackingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max:      20,             // Max 20 tracks per hour per IP
  message:  { success: false, message: 'Tracking request limit exceeded. Try again in 1 hour.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

module.exports = { loginLimiter, apiLimiter, sensitiveActionLimiter, publicTrackingLimiter };
