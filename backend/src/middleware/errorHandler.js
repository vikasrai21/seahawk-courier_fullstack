// src/middleware/errorHandler.js — Global error handler + asyncHandler wrapper
const logger = require('../utils/logger');

// ── Operational error class (expected errors) ────────────────────────────
class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status      = status;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ── Async wrapper — eliminates try/catch boilerplate in controllers ───────
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ── Prisma error map ──────────────────────────────────────────────────────
const prismaMap = {
  P2002: (err) => ({ status: 409, message: `Duplicate value: ${err.meta?.target?.join(', ')} already exists.` }),
  P2025: ()    => ({ status: 404, message: 'Record not found.' }),
  P2003: ()    => ({ status: 400, message: 'Related record does not exist.' }),
  P2014: ()    => ({ status: 400, message: 'Relation constraint violation.' }),
};

// ── Global error handler (must be last middleware) ────────────────────────
function globalErrorHandler(err, req, res, _next) {
  // Log everything — structured for searchability
  logger.error('Request error', {
    method:  req.method,
    path:    req.path,
    status:  err.status || 500,
    message: err.message,
    userId:  req.user?.id,
    ip:      req.ip,
    stack:   err.isOperational ? undefined : err.stack, // Only log stack for unexpected errors
  });

  // ── Prisma known errors ──────────────────────────────────────────────
  if (err.code && prismaMap[err.code]) {
    const { status, message } = prismaMap[err.code](err);
    return res.status(status).json({ success: false, message });
  }

  // ── JWT errors ───────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError')
    return res.status(401).json({ success: false, message: 'Invalid token. Please log in again.' });
  if (err.name === 'TokenExpiredError')
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });

  // ── Zod validation errors ─────────────────────────────────────────────
  if (err.name === 'ZodError')
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors:  err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });

  // ── Operational (intentional) errors ─────────────────────────────────
  if (err.isOperational)
    return res.status(err.status).json({ success: false, message: err.message });

  // ── Unknown / programming errors — don't leak internals ───────────────
  const isProd = process.env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    message: isProd ? 'Internal server error.' : err.message,
    ...(isProd ? {} : { stack: err.stack }),
  });
}

module.exports = { globalErrorHandler, asyncHandler, AppError };
