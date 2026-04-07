// src/config/index.js — Validated config, fails fast on missing secrets
'use strict';
if (process.env.NODE_ENV !== 'production') require('dotenv').config();

function required(key, minLen = 0) {
  const val = process.env[key];
  if (!val) throw new Error(`[CONFIG] Missing required env variable: ${key}`);
  if (minLen && val.length < minLen) throw new Error(`[CONFIG] ${key} must be at least ${minLen} chars`);
  return val;
}

const optional = (key, fallback = undefined) => process.env[key] || fallback;

const env = process.env.NODE_ENV || 'development';

module.exports = {
  env,
  isProd:  env === 'production',
  isDev:   env === 'development',
  isTest:  env === 'test',

  port: parseInt(optional('PORT', '3001')),

  db: { url: required('DATABASE_URL') },

  jwt: {
    secret:           required('JWT_SECRET', 32),
    accessExpiresIn:  optional('JWT_ACCESS_EXPIRES', '15m'),
    refreshSecret:    optional('JWT_REFRESH_SECRET', required('JWT_SECRET') + '_refresh'),
    refreshExpiresIn: optional('JWT_REFRESH_EXPIRES', '30d'),
  },

  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
      : env === 'production'
        ? []
        : true,
  },

  redis: {
    url: optional('REDIS_URL'),
  },

  cookie: {
    secure:   env === 'production',
    // FIX: 'strict' blocks the cookie on page reload — use 'none' for production
    // 'none' requires secure:true (which is already set in production above)
    sameSite: env === 'production' ? 'none' : 'lax',
    maxAge:   30 * 24 * 60 * 60 * 1000,
  },

  rateLimits: {
    login:  { windowMs: 15 * 60 * 1000, max: parseInt(optional('LOGIN_RATE_MAX',  '5')) },
    global: { windowMs: 15 * 60 * 1000, max: parseInt(optional('GLOBAL_RATE_MAX', '300')) },
  },

  // Optional integrations — no crash if missing, but carrier will be disabled
  carriers: {
    delhivery: { key: optional('DELHIVERY_API_KEY'), url: optional('DELHIVERY_API_URL', 'https://track.delhivery.com') },
    dtdc:      { key: optional('DTDC_API_KEY'),      customerCode: optional('DTDC_CUSTOMER_CODE') },
    trackon: {
      appKey: optional('TRACKON_APP_KEY', optional('TRACKON_API_KEY')),
      userId: optional('TRACKON_USER_ID', optional('TRACKON_CUSTOMER_ID', optional('TRACKON_CLIENT_ID'))),
      password: optional('TRACKON_PASSWORD'),
      trackingUrl: optional('TRACKON_TRACKING_API_URL', optional('TRACKON_API_URL', 'https://api.trackon.in')),
      bookingUrl: optional('TRACKON_BOOKING_API_URL', 'http://trackon.in:5455'),
      customerCode: optional('TRACKON_CUSTOMER_CODE'),
    },
    bluedart:  { key: optional('BLUEDART_LICENSE_KEY'), loginId: optional('BLUEDART_LOGIN_ID') },
    razorpay:  { keyId: optional('RAZORPAY_KEY_ID'), secret: optional('RAZORPAY_KEY_SECRET') },
  },

  payments: {
    allowMockRecharge: optional('ALLOW_MOCK_WALLET_RECHARGE', env !== 'production' ? 'true' : 'false') === 'true',
  },

  whatsapp: {
    token:   optional('WHATSAPP_TOKEN'),
    phoneId: optional('WHATSAPP_PHONE_ID'),
  },

  email: {
    host:    optional('SMTP_HOST'),
    port:    parseInt(optional('SMTP_PORT', '587')),
    user:    optional('SMTP_USER'),
    pass:    optional('SMTP_PASS'),
    from:    optional('SMTP_FROM', 'Sea Hawk Courier <noreply@seahawkcourier.com>'),
  },

  sentry: { dsn: optional('SENTRY_DSN') },

  openai: {
    apiKey: optional('OPENAI_API_KEY'),
    model: optional('OPENAI_MODEL', 'gpt-5.2'),
    baseUrl: optional('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
  },

  backups: {
    s3Bucket: optional('BACKUP_S3_BUCKET'),
    s3Region: optional('BACKUP_S3_REGION', 'ap-south-1'),
    s3Key:    optional('AWS_ACCESS_KEY_ID'),
    s3Secret: optional('AWS_SECRET_ACCESS_KEY'),
  },

  bodyLimits: {
    globalJson: optional('GLOBAL_JSON_LIMIT', '1mb'),
    importJson: optional('IMPORT_JSON_LIMIT', '10mb'),
  },

  docs: {
    enabled: optional('API_DOCS_ENABLED', 'true') !== 'false',
    public: optional('API_DOCS_PUBLIC', env !== 'production' ? 'true' : 'false') === 'true',
  },

  app: {
    publicBaseUrl: optional('PUBLIC_BASE_URL', 'http://localhost:5173'),
    supportPhone: optional('SUPPORT_PHONE', '+91 99115 65523'),
    adminWhatsapp: optional('ADMIN_WHATSAPP', '919911565523'),
  },

  webhooks: {
    delhiverySecret: optional('DELHIVERY_WEBHOOK_SECRET'),
    dtdcSecret: optional('DTDC_WEBHOOK_SECRET'),
    replayWindowSeconds: parseInt(optional('WEBHOOK_REPLAY_WINDOW_SECONDS', '300'), 10),
    idempotencyTtlSeconds: parseInt(optional('WEBHOOK_IDEMPOTENCY_TTL_SECONDS', '86400'), 10),
  },
};
