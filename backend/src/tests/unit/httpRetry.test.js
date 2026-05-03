import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchBufferWithRetry, fetchJsonWithRetry, fetchWithRetry } from '../../utils/httpRetry.js';

vi.mock('../../utils/security.js', () => ({
  isSafeUrl: vi.fn().mockResolvedValue(true),
}));

describe('httpRetry', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('returns successful responses without retrying', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true }),
    });

    const result = await fetchJsonWithRetry('https://example.com');

    expect(result).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('retries retryable HTTP failures and eventually succeeds', async () => {
    vi.useFakeTimers();
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: vi.fn().mockResolvedValue('busy'),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue('done'),
      });

    const promise = fetchWithRetry('https://example.com', {}, { attempts: 2, baseDelayMs: 1, timeoutMs: 100 });
    await vi.runAllTimersAsync();
    const response = await promise;

    expect(response.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('throws non-retryable errors immediately', async () => {
    global.fetch = vi.fn().mockRejectedValue(Object.assign(new Error('bad request'), { code: 'EOTHER' }));

    await expect(fetchWithRetry('https://example.com', {}, { attempts: 3 })).rejects.toThrow('bad request');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns binary buffers for buffer requests', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
    });

    const result = await fetchBufferWithRetry('https://example.com/file');

    expect(Buffer.isBuffer(result)).toBe(true);
    expect([...result]).toEqual([1, 2, 3]);
  });
});
