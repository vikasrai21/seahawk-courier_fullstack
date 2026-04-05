import { beforeEach, describe, expect, it, vi } from 'vitest';

const loggerMock = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

async function loadCacheWithNoRedis() {
  vi.resetModules();
  vi.doMock('../../config', () => ({
    __esModule: true,
    default: { redis: { url: '' } },
    redis: { url: '' },
  }));
  vi.doMock('../../utils/logger', () => ({
    __esModule: true,
    default: loggerMock,
    ...loggerMock,
  }));
  vi.doMock('ioredis', () => ({
    __esModule: true,
    default: vi.fn(),
  }));
  return import('../../utils/cache.js');
}

describe('cache utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the in-memory fallback for get/set/del/wrap', async () => {
    const cache = await loadCacheWithNoRedis();

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
    const cache = await loadCacheWithNoRedis();

    await cache.set('analytics:today', { a: 1 }, 60);
    await cache.set('analytics:month', { a: 2 }, 60);
    await cache.set('other:key', { a: 3 }, 60);
    await cache.delByPrefix('analytics:');

    expect(await cache.get('analytics:today')).toBeNull();
    expect(await cache.get('analytics:month')).toBeNull();
    expect(await cache.get('other:key')).toEqual({ a: 3 });
  });
});
