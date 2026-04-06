// src/config/sentry.js
const loadSentry = () => {
  try { return require('@sentry/node'); } catch { return null; }
};

function initSentry(app, options = {}) {
  const sentry = options.Sentry ?? loadSentry();
  const env = options.env ?? process.env;
  const consoleObj = options.console ?? console;

  if (!sentry) {
    consoleObj.warn('[Sentry] @sentry/node not installed — skipping. Run: npm install @sentry/node');
    return;
  }
  if (!env.SENTRY_DSN) {
    consoleObj.info('[Sentry] SENTRY_DSN not set — error tracking disabled.');
    return;
  }

  sentry.init({
    dsn:         env.SENTRY_DSN,
    environment: env.NODE_ENV || 'development',
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.2 : 1.0,
    integrations: [
      new sentry.Integrations.Http({ tracing: true }),
      new sentry.Integrations.Express({ app }),
    ],
  });

  // Must be first middleware
  app.use(sentry.Handlers.requestHandler());
  app.use(sentry.Handlers.tracingHandler());

  consoleObj.info('[Sentry] Error tracking active.');
  return sentry;
}

function sentryErrorHandler(options = {}) {
  const sentry = options.Sentry ?? loadSentry();
  const env = options.env ?? process.env;

  if (!sentry || !env.SENTRY_DSN) return (err, req, res, next) => next(err);
  return sentry.Handlers.errorHandler();
}

module.exports = { initSentry, sentryErrorHandler, loadSentry };
