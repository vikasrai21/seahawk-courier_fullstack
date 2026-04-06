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
    vi.resetModules();
    vi.doMock('../../config/redis', () => ({
      __esModule: true,
      default: null,
    }));
    vi.doMock('bullmq', () => ({
      __esModule: true,
      Queue: vi.fn(),
    }));

    const queueConfig = await import('../../config/queue.js');

    expect(queueConfig.scanQueue).toBeNull();
  });

  it('initializes bull queue when redis is available', async () => {
    vi.resetModules();
    const logger = { info: vi.fn(), error: vi.fn() };
    vi.doMock('../../utils/logger', () => ({
      __esModule: true,
      default: logger,
      ...logger,
    }));
    const redisConn = { host: 'localhost', port: 6379 };
    vi.doMock('../../config/redis', () => ({
      __esModule: true,
      default: redisConn,
    }));
    const Queue = vi.fn(() => ({ name: 'bulk-scan' }));
    vi.doMock('bullmq', () => ({
      __esModule: true,
      Queue,
    }));

    const queueConfig = await import('../../config/queue.js');

    expect(Queue).toHaveBeenCalledWith('bulk-scan', expect.objectContaining({ connection: redisConn }));
    expect(queueConfig.scanQueue).toEqual(expect.objectContaining({ name: 'bulk-scan' }));
    expect(logger.info).toHaveBeenCalledWith('[BullMQ] bulk-scan queue initialized');
  });

  it('logs queue init errors when bullmq throws', async () => {
    vi.resetModules();
    const logger = { info: vi.fn(), error: vi.fn() };
    vi.doMock('../../utils/logger', () => ({
      __esModule: true,
      default: logger,
      ...logger,
    }));
    vi.doMock('../../config/redis', () => ({
      __esModule: true,
      default: { host: 'localhost' },
    }));
    const Queue = vi.fn(() => {
      throw new Error('boom');
    });
    vi.doMock('bullmq', () => ({
      __esModule: true,
      Queue,
    }));

    const queueConfig = await import('../../config/queue.js');

    expect(queueConfig.scanQueue).toBeNull();
    expect(logger.error).toHaveBeenCalledWith('[BullMQ] failed to initialize queue', { error: 'boom' });
  });

  it('skips sentry when the SDK or DSN is missing', async () => {
    vi.resetModules();
    delete process.env.SENTRY_DSN;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.doMock('@sentry/node', () => {
      throw new Error('missing');
    });

    const sentry = await import('../../config/sentry.js');
    const app = { use: vi.fn() };

    expect(sentry.initSentry(app)).toBeUndefined();
    const handler = sentry.sentryErrorHandler();
    const next = vi.fn();
    handler(new Error('boom'), {}, {}, next);
    expect(next).toHaveBeenCalled();
    expect(warnSpy.mock.calls.length + infoSpy.mock.calls.length).toBeGreaterThan(0);
  });

  it('initializes sentry when SDK and DSN are available', async () => {
    vi.resetModules();
    process.env.SENTRY_DSN = 'https://example.com/123';
    process.env.NODE_ENV = 'production';

    const requestHandler = vi.fn(() => 'request');
    const tracingHandler = vi.fn(() => 'trace');
    const errorHandler = vi.fn(() => 'error');
    const init = vi.fn();
    const Integrations = { Http: vi.fn(), Express: vi.fn() };
    vi.doMock('@sentry/node', () => ({
      __esModule: true,
      init,
      Integrations,
      Handlers: {
        requestHandler,
        tracingHandler,
        errorHandler,
      },
    }));

    const sentry = await import('../../config/sentry.js');
    const app = { use: vi.fn() };

    const result = sentry.initSentry(app);
    expect(init).toHaveBeenCalled();
    expect(app.use).toHaveBeenCalledWith('request');
    expect(app.use).toHaveBeenCalledWith('trace');
    expect(result).toBeDefined();

    const handler = sentry.sentryErrorHandler();
    expect(handler).toBe('error');

    delete process.env.SENTRY_DSN;
  });
});
