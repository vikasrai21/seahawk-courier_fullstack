// src/utils/logger.js — Winston structured logger with PII redaction
'use strict';
const path   = require('path');
const fs     = require('fs');
const { createLogger, format, transports } = require('winston');

const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const { combine, timestamp, errors, json, colorize, printf } = format;

// ── PII fields — values for these keys are redacted in every log entry ─────
const PII_FIELDS = new Set([
  'password', 'currentPassword', 'newPassword',
  'phone', 'whatsapp', 'mobile',
  'email',
  'address', 'pickupAddress', 'deliveryAddress', 'newAddress',
  'gst', 'pan',
  'token', 'refreshToken', 'accessToken', 'authorization',
  'paymentId', 'razorpayId', 'cardNumber',
  'ip',           // redact IPs from log payloads (keep in audit only)
]);

const REDACTED = '[REDACTED]';

// Recursively walk an object and redact PII fields
function redactPII(obj, depth = 0) {
  if (depth > 6 || !obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(i => redactPII(i, depth + 1));
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (PII_FIELDS.has(k.toLowerCase()) || PII_FIELDS.has(k)) {
      out[k] = REDACTED;
    } else if (typeof v === 'object' && v !== null) {
      out[k] = redactPII(v, depth + 1);
    } else {
      out[k] = v;
    }
  }
  return out;
}

// Custom format that applies PII redaction to every log entry
const piiRedact = format((info) => {
  // Redact meta fields
  const { message, ...meta } = info;
  const cleanMeta = redactPII(meta);
  // Also scrub message string for common patterns
  const cleanMsg = typeof message === 'string'
    ? message
        .replace(/(\b\d{10}\b)/g, '[PHONE]')          // 10-digit phone numbers
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]') // emails
    : message;
  return Object.assign(info, { message: cleanMsg, ...cleanMeta });
});

// Human-readable format for dev console
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  piiRedact(),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    const extra = Object.keys(meta).length ? '\n  ' + JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message}${stack ? '\n' + stack : ''}${extra}`;
  })
);

// Structured JSON for production
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  piiRedact(),
  json()
);

const isProd = process.env.NODE_ENV === 'production';

const logger = createLogger({
  level: isProd ? 'info' : 'debug',
  format: prodFormat,
  transports: [
    new transports.Console({
      format: isProd ? prodFormat : devFormat,
    }),
    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
    }),
    new transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 20 * 1024 * 1024,
      maxFiles: 10,
      tailable: true,
    }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: path.join(logsDir, 'exceptions.log') }),
  ],
  rejectionHandlers: [
    new transports.File({ filename: path.join(logsDir, 'rejections.log') }),
  ],
});

module.exports = logger;
