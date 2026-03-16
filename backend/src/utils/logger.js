// src/utils/logger.js — Winston structured logger
// All logs go through here — NEVER use console.log directly
const path      = require('path');
const fs        = require('fs');
const { createLogger, format, transports } = require('winston');

const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const { combine, timestamp, errors, json, colorize, printf } = format;

// Human-readable format for dev console
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    const extra = Object.keys(meta).length ? '\n  ' + JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message}${stack ? '\n' + stack : ''}${extra}`;
  })
);

// Structured JSON for production (machine-parseable)
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const isProd = process.env.NODE_ENV === 'production';

const logger = createLogger({
  level: isProd ? 'info' : 'debug',
  format: isProd ? prodFormat : prodFormat, // Always JSON to file
  transports: [
    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
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

// Pretty console in development
if (!isProd) {
  logger.add(new transports.Console({ format: devFormat }));
}

// Replace console.error/warn to route through Winston in prod
if (isProd) {
  console.error = (...args) => logger.error(args.join(' '));
  console.warn  = (...args) => logger.warn(args.join(' '));
  console.log   = (...args) => logger.info(args.join(' '));
}

module.exports = logger;
