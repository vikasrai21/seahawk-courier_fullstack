import { describe, it, expect, vi } from 'vitest';

const { metricsMiddleware, getMetricsSnapshot } = await import('../../middleware/metrics.middleware.js');

describe('metrics.middleware', () => {
  it('increments request counter and calls next', () => {
    const req = {};
    const res = { on: vi.fn() };
    const next = vi.fn();

    const before = getMetricsSnapshot().requestsTotal;
    metricsMiddleware(req, res, next);
    const after = getMetricsSnapshot().requestsTotal;

    expect(after).toBe(before + 1);
    expect(next).toHaveBeenCalled();
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  it('getMetricsSnapshot returns correct shape', () => {
    const snap = getMetricsSnapshot();
    expect(snap).toHaveProperty('uptimeSeconds');
    expect(snap).toHaveProperty('requestsTotal');
    expect(snap).toHaveProperty('byStatusFamily');
    expect(snap.byStatusFamily).toHaveProperty('2xx');
    expect(snap.byStatusFamily).toHaveProperty('4xx');
    expect(snap.byStatusFamily).toHaveProperty('5xx');
    expect(snap).toHaveProperty('latencyMs');
    expect(snap.latencyMs).toHaveProperty('avg');
    expect(snap.latencyMs).toHaveProperty('max');
  });

  it('records latency on finish', () => {
    let finishCallback = null;
    const req = {};
    const res = {
      statusCode: 200,
      on: vi.fn((event, cb) => { if (event === 'finish') finishCallback = cb; }),
    };
    const next = vi.fn();

    metricsMiddleware(req, res, next);
    expect(finishCallback).not.toBeNull();

    // Simulate response finish
    finishCallback();

    const snap = getMetricsSnapshot();
    expect(snap.byStatusFamily['2xx']).toBeGreaterThan(0);
    expect(snap.latencyMs.max).toBeGreaterThanOrEqual(0);
    expect(snap.latencyMs.avg).toBeGreaterThanOrEqual(0);
  });
});
