import { createRequire } from 'module';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'events';

const require = createRequire(import.meta.url);
const { createCacheAPI } = require('../../utils/cache.js');

const loggerMock = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

describe('cache utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the in-memory fallback for get/set/del/wrap', async () => {
    const cache = createCacheAPI({ loggerInstance: loggerMock, redisUrl: '' });

    await cache.set('user:1', { ok: true }, 60);
    expect(await cache.get('user:1')).toEqual({ ok: true });

    const fn = vi.fn().mockResolvedValue({ fresh: true });
    expect(await cache.wrap('wrapped', fn, 60)).toEqual({ fresh: true });
    expect(await cache.wrap('wrapped', fn, 60)).toEqual({ fresh: true });
    expect(fn).toHaveBeenCalledTimes(1);

    await cache.del('user:1');
    expect(await cache.get('user:1')).toBeNull();
  });

  it('deletes cached keys by prefix', async () => {
    const cache = createCacheAPI({ loggerInstance: loggerMock, redisUrl: '' });

    await cache.set('analytics:today', { a: 1 }, 60);
    await cache.set('analytics:month', { a: 2 }, 60);
    await cache.set('other:key', { a: 3 }, 60);
    await cache.delByPrefix('analytics:');

    expect(await cache.get('analytics:today')).toBeNull();
    expect(await cache.get('analytics:month')).toBeNull();
    expect(await cache.get('other:key')).toEqual({ a: 3 });
  });

  it('uses Redis when configured and connected', async () => {
    const getImpl = vi.fn().mockResolvedValue(JSON.stringify({ source: 'redis' }));
    const setImpl = vi.fn().mockResolvedValue(undefined);
    const delImpl = vi.fn().mockResolvedValue(undefined);
    const streamFactory = () => {
      const emitter = new EventEmitter();
      queueMicrotask(() => {
        emitter.emit('data', ['ops:1', 'ops:2']);
        emitter.emit('end');
      });
      return emitter;
    };
    const client = {
      on: vi.fn(),
      connect: vi.fn().mockResolvedValue(undefined),
      get: getImpl,
      set: setImpl,
      del: delImpl,
      scanStream: vi.fn(streamFactory),
    };
    const RedisClass = vi.fn(() => client);
    const cache = createCacheAPI({
      loggerInstance: loggerMock,
      redisUrl: 'redis://localhost:6379',
      RedisClass,
    });

    expect(await cache.get('ops:1')).toEqual({ source: 'redis' });
    await cache.set('ops:1', { stored: true }, 120);
    await cache.del('ops:1');
    await cache.delByPrefix('ops:');

    expect(RedisClass).toHaveBeenCalledWith('redis://localhost:6379', expect.objectContaining({
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: true,
    }));
    expect(client.connect).toHaveBeenCalledTimes(1);
    expect(client.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(setImpl).toHaveBeenCalledWith('ops:1', JSON.stringify({ stored: true }), 'EX', 120);
    expect(delImpl).toHaveBeenCalledWith('ops:1');
    expect(delImpl).toHaveBeenCalledWith('ops:1', 'ops:2');
  });

  it('falls back cleanly when Redis initialization fails or cache operations throw', async () => {
    const fallbackCache = createCacheAPI({
      loggerInstance: loggerMock,
      redisUrl: 'redis://localhost:6379',
      RedisClass: vi.fn(() => ({
        on: vi.fn(),
        connect: vi.fn().mockRejectedValue(new Error('connect failed')),
      })),
    });

    await fallbackCache.set('fallback:key', { ok: true }, 60);
    expect(await fallbackCache.get('fallback:key')).toEqual({ ok: true });
    expect(loggerMock.warn).toHaveBeenCalledWith('Cache: Redis unavailable — using in-memory fallback');

    const brokenClient = {
      on: vi.fn(),
      connect: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockRejectedValue(new Error('get boom')),
      set: vi.fn().mockRejectedValue(new Error('set boom')),
      del: vi.fn().mockRejectedValue(new Error('del boom')),
      scanStream: vi.fn(() => {
        const emitter = new EventEmitter();
        queueMicrotask(() => emitter.emit('error', new Error('scan boom')));
        return emitter;
      }),
    };
    const brokenCache = createCacheAPI({
      loggerInstance: loggerMock,
      redisUrl: 'redis://localhost:6379',
      RedisClass: vi.fn(() => brokenClient),
    });

    expect(await brokenCache.get('bad:key')).toBeNull();
    await brokenCache.set('bad:key', { bad: true }, 60);
    await brokenCache.del('bad:key');
    await brokenCache.delByPrefix('bad:');

    expect(loggerMock.warn).toHaveBeenCalledWith('Cache get failed for bad:key:', 'get boom');
    expect(loggerMock.warn).toHaveBeenCalledWith('Cache set failed for bad:key:', 'set boom');
    expect(loggerMock.warn).toHaveBeenCalledWith('Cache del failed for bad:key:', 'del boom');
    expect(loggerMock.warn).toHaveBeenCalledWith('Cache delByPrefix failed for bad::', 'scan boom');
  });
});
