// src/middleware/csrf.middleware.js
// Double-submit cookie CSRF protection for cookie-based auth paths.
// For Bearer-token-only requests this is a no-op.
'use strict';
const crypto = require('crypto');
const logger = require('../utils/logger');

const CSRF_HEADER = 'x-csrf-token';
const CSRF_COOKIE = 'csrf_token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Generate a random CSRF token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Middleware: issue a CSRF token cookie on GET requests (so the frontend can read it)
function issueCsrfCookie(req, res, next) {
  if (!req.cookies?.[CSRF_COOKIE]) {
    const token = generateToken();
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,    // Must be readable by JS to send in header
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24h
    });
  }
  next();
}

// Middleware: validate CSRF token on state-changing requests
// Only applies when request uses cookie auth (not Bearer token)
function validateCsrf(req, res, next) {
  // Skip safe methods
  if (SAFE_METHODS.has(req.method)) return next();
  // Skip public routes — no auth required
  if (req.path.startsWith('/public/')) return next();
  // Skip if using Bearer token auth (not cookie-based)
  if (req.headers.authorization?.startsWith('Bearer ')) return next();
  // Skip if no refresh token cookie (not a cookie-auth session)
  if (!req.cookies?.refreshToken) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    logger.warn('CSRF validation failed', { ip: req.ip, path: req.path, method: req.method });
    return res.status(403).json({ success: false, message: 'CSRF validation failed.' });
  }
  next();
}

module.exports = { issueCsrfCookie, validateCsrf, generateToken };
