import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('config helper modules', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads redis config safely when REDIS_URL is not set', async () => {
    vi.resetModules();
    delete process.env.REDIS_URL;
    const redis = await import('../../config/redis.js');
    expect(redis.default).toBeNull();
  });

  it('keeps bull queue disabled when redis is unavailable', async () => {
    const logger = { info: vi.fn(), error: vi.fn() };
    const queueConfig = await import('../../config/queue.js');

    expect(queueConfig.createScanQueue({ redisClient: null, loggerInstance: logger })).toBeNull();
    expect(logger.info).toHaveBeenCalledWith('[BullMQ] Redis disabled; bulk-scan queue not initialized');
  });

  it('initializes bull queue when redis is available', async () => {
    const logger = { info: vi.fn(), error: vi.fn() };
    const redisConn = { host: 'localhost', port: 6379 };
    const Queue = vi.fn(() => ({ name: 'bulk-scan' }));
    const queueConfig = await import('../../config/queue.js');

    const queue = queueConfig.createScanQueue({
      redisClient: redisConn,
      QueueClass: Queue,
      loggerInstance: logger,
    });

    expect(Queue).toHaveBeenCalledWith('bulk-scan', { connection: redisConn });
    expect(queue).toEqual(expect.objectContaining({ name: 'bulk-scan' }));
    expect(logger.info).toHaveBeenCalledWith('[BullMQ] bulk-scan queue initialized');
  });

  it('logs queue init errors when bullmq throws', async () => {
    const logger = { info: vi.fn(), error: vi.fn() };
    const Queue = vi.fn(() => {
      throw new Error('boom');
    });
    const queueConfig = await import('../../config/queue.js');

    expect(queueConfig.createScanQueue({
      redisClient: { host: 'localhost' },
      QueueClass: Queue,
      loggerInstance: logger,
    })).toBeNull();
    expect(logger.error).toHaveBeenCalledWith('[BullMQ] failed to initialize queue', { error: 'boom' });
  });

  it('skips sentry when the SDK or DSN is missing', async () => {
    const sentry = await import('../../config/sentry.js');
    const app = { use: vi.fn() };
    const consoleObj = { warn: vi.fn(), info: vi.fn() };

    expect(sentry.initSentry(app, { Sentry: null, env: {}, console: consoleObj })).toBeUndefined();
    expect(consoleObj.warn).toHaveBeenCalled();

    expect(sentry.initSentry(app, {
      Sentry: { init: vi.fn(), Integrations: {}, Handlers: {} },
      env: {},
      console: consoleObj,
    })).toBeUndefined();
    expect(consoleObj.info).toHaveBeenCalled();

    const handler = sentry.sentryErrorHandler({ Sentry: null, env: {} });
    const next = vi.fn();
    handler(new Error('boom'), {}, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('initializes sentry when SDK and DSN are available', async () => {
    const requestHandler = vi.fn(() => 'request');
    const tracingHandler = vi.fn(() => 'trace');
    const errorHandler = vi.fn(() => 'error');
    const init = vi.fn();
    const Integrations = { Http: vi.fn(), Express: vi.fn() };
    const Sentry = {
      init,
      Integrations,
      Handlers: {
        requestHandler,
        tracingHandler,
        errorHandler,
      },
    };

    const sentry = await import('../../config/sentry.js');
    const app = { use: vi.fn() };
    const consoleObj = { warn: vi.fn(), info: vi.fn() };

    const result = sentry.initSentry(app, {
      Sentry,
      env: { SENTRY_DSN: 'https://example.com/123', NODE_ENV: 'production' },
      console: consoleObj,
    });
    expect(init).toHaveBeenCalled();
    expect(app.use).toHaveBeenCalledWith('request');
    expect(app.use).toHaveBeenCalledWith('trace');
    expect(result).toBeDefined();
    expect(consoleObj.info).toHaveBeenCalledWith('[Sentry] Error tracking active.');

    const handler = sentry.sentryErrorHandler({
      Sentry,
      env: { SENTRY_DSN: 'https://example.com/123' },
    });
    expect(handler).toBe('error');
  });
});
