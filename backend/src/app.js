'use strict';
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const path         = require('path');
const fs           = require('fs');
const config       = require('./config');
const logger       = require('./utils/logger');
const { globalErrorHandler } = require('./middleware/errorHandler');
const { apiLimiter }         = require('./middleware/rateLimiter');
const { initSentry, sentryErrorHandler } = require('./config/sentry');
const { sanitiseBody } = require('./middleware/sanitise.middleware');
const { issueCsrfCookie, validateCsrf } = require('./middleware/csrf.middleware');
const R = require('./utils/response');

const app = express();
app.set('trust proxy', 1);

initSentry(app);

app.use(helmet({
  contentSecurityPolicy: config.isProd ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin:      config.cors.origin,
  credentials: true,
  methods:     ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
app.use(morgan(config.isProd ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.http(msg.trim()) },
  skip:   (req) => req.path === '/api/health',
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Global XSS sanitisation ────────────────────────────────────────────────
app.use(sanitiseBody);

// ── CSRF protection (cookie-based sessions) ────────────────────────────────
app.use(issueCsrfCookie);   // issues token cookie on all requests
app.use('/api', validateCsrf); // validates on all mutating API requests

// ── Global rate limit ──────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ── Health ─────────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  const prisma = require('./config/prisma');
  try {
    await prisma.$queryRaw`SELECT 1`;
    R.ok(res, { status: 'healthy', database: 'connected', uptime: Math.floor(process.uptime()), version: '8.0.0', env: config.env });
  } catch {
    res.status(503).json({ success: false, status: 'unhealthy' });
  }
});

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/public',         require('./routes/public.routes'));
app.use('/api/auth',           require('./routes/auth.routes'));
app.use('/api/portal',         require('./routes/client-portal.routes'));
app.use('/api/shipments',      require('./routes/shipment.routes'));
app.use('/api/clients',        require('./routes/client.routes'));
app.use('/api/contracts',      require('./routes/contract.routes'));
app.use('/api/invoices',       require('./routes/invoice.routes'));
app.use('/api/audit',          require('./routes/audit.routes'));
app.use('/api/quotes',         require('./routes/quote.routes'));
app.use('/api/reconciliation', require('./routes/reconciliation.routes'));
app.use('/api/rates',          require('./routes/rates.routes'));
app.use('/api/ops',            require('./routes/ops.routes'));
app.use('/api/tracking',       require('./routes/tracking.routes'));
app.use('/api/ndr',            require('./routes/ndr.routes'));
app.use('/api/pickups',        require('./routes/pickup.routes'));
app.use('/api/wallet',         require('./routes/wallet.routes'));
app.use('/api/analytics',      require('./routes/analytics.routes'));
app.use('/api/delhivery',      require('./routes/delhivery.routes'));
app.use('/api/couriers',       require('./routes/courier.routes'));
app.use('/api/carrier',        require('./routes/carrier.routes'));

// ── Serve React (production) ───────────────────────────────────────────────
const frontendBuild = path.join(__dirname, '../public');
if (fs.existsSync(frontendBuild)) {
  app.use(express.static(frontendBuild, { maxAge: config.isProd ? '1d' : 0 }));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendBuild, 'index.html'));
    }
  });
}

sentryErrorHandler(app);
app.use(globalErrorHandler);

module.exports = app;
