// src/config/sentry.js
const Sentry = (() => {
  try { return require('@sentry/node'); } catch { return null; }
})();

function initSentry(app) {
  if (!Sentry) {
    console.warn('[Sentry] @sentry/node not installed — skipping. Run: npm install @sentry/node');
    return;
  }
  if (!process.env.SENTRY_DSN) {
    console.info('[Sentry] SENTRY_DSN not set — error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn:         process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
    ],
  });

  // Must be first middleware
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());

  console.info('[Sentry] Error tracking active.');
  return Sentry;
}

function sentryErrorHandler() {
  if (!Sentry || !process.env.SENTRY_DSN) return (err, req, res, next) => next(err);
  return Sentry.Handlers.errorHandler();
}

module.exports = { initSentry, sentryErrorHandler };
