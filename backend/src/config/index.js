// src/config/index.js — Validated config, fails fast on missing secrets
'use strict';
if (process.env.NODE_ENV !== 'production') {
  const path = require('path');
  require('dotenv').config({ path: path.join(__dirname, '../../.env') });
}

function required(key, minLen = 0) {
  const val = process.env[key];
  if (!val) throw new Error(`[CONFIG] Missing required env variable: ${key}`);
  if (minLen && val.length < minLen) throw new Error(`[CONFIG] ${key} must be at least ${minLen} chars`);
  return val;
}

const optional = (key, fallback = undefined) => process.env[key] || fallback;

const env = process.env.NODE_ENV || 'development';

if (env === 'production' && !process.env.CORS_ORIGIN?.trim()) {
  throw new Error('[CONFIG] CORS_ORIGIN must be configured in production');
}

if (env === 'production') {
  const { getOwnerEmails } = require('../utils/owner');
  if (!getOwnerEmails().length) {
    throw new Error(
      '[CONFIG] OWNER_EMAILS must be set in production. ' +
      'Example: OWNER_EMAILS=you@yourdomain.com'
    );
  }
}

if (env === 'production' && !process.env.REDIS_URL) {
  console.warn(
    '[WARN] REDIS_URL is not set. Rate limiting, caching, and ' +
    'job queues will use in-memory fallbacks — not safe for ' +
    'multi-pod deployments.'
  );
}

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
    // 'none' is required for cross-origin portal access (e.g., separate frontend domain).
    // Set COOKIE_SAME_SITE=lax when frontend and backend share the same origin for stronger CSRF protection.
    sameSite: optional('COOKIE_SAME_SITE', env === 'production' ? 'none' : 'lax'),
    maxAge:   30 * 24 * 60 * 60 * 1000,
  },

  rateLimits: {
    login:  { windowMs: 15 * 60 * 1000, max: parseInt(optional('LOGIN_RATE_MAX',  '5')) },
    global: { windowMs: 15 * 60 * 1000, max: parseInt(optional('GLOBAL_RATE_MAX', '300')) },
  },

  // Optional integrations — no crash if missing, but carrier will be disabled
  carriers: {
    delhivery: { key: optional('DELHIVERY_API_KEY'), url: optional('DELHIVERY_API_URL', 'https://track.delhivery.com') },
    dtdc:      {
      key: optional('DTDC_API_KEY'),
      accessToken: optional('DTDC_ACCESS_TOKEN', optional('DTDC_API_KEY')),
      username: optional('DTDC_USERNAME', optional('DTDC_CLIENT_ID')),
      password: optional('DTDC_PASSWORD'),
      customerCode: optional('DTDC_CUSTOMER_CODE'),
      authUrl: optional('DTDC_AUTH_API_URL', 'https://blktracksvc.dtdc.com/dtdc-api/api/dtdc/authenticate'),
      trackingUrl: optional('DTDC_TRACKING_API_URL', 'https://blktracksvc.dtdc.com/dtdc-tracking-api/dtdc-api/rest/JSONCnTrk/getTrackDetails'),
    },
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
    model: optional('OPENAI_MODEL', 'gpt-4o'),
    baseUrl: optional('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
  },

  googleVision: {
    apiKey: optional('GOOGLE_VISION_API_KEY'),
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

  integrations: {
    syncApiKey: optional('INTEGRATION_SYNC_API_KEY'),
  },

  runtime: {
    sandboxEnabled: optional('SANDBOX_API_ENABLED', 'true') !== 'false',
  },

  operations: {
    retention: {
      auditDays: parseInt(optional('RETENTION_AUDIT_DAYS', '180'), 10),
      jobQueueDays: parseInt(optional('RETENTION_JOBQUEUE_DAYS', '60'), 10),
      notificationDays: parseInt(optional('RETENTION_NOTIFICATION_DAYS', '90'), 10),
    },
    slo: {
      connectorPullFailureThreshold: parseFloat(optional('SLO_CONNECTOR_PULL_FAILURE_THRESHOLD', '0.25')),
      connectorPullMinimumRuns: parseInt(optional('SLO_CONNECTOR_PULL_MIN_RUNS', '4'), 10),
    },
    auditEvidenceSigningSecret: optional('AUDIT_EVIDENCE_SIGNING_SECRET'),
  },
};
