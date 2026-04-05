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
});
