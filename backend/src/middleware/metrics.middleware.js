'use strict';

const metrics = {
  startedAt: Date.now(),
  requestsTotal: 0,
  byStatusFamily: { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 },
  latencyMs: { count: 0, sum: 0, max: 0 },
  latencyRecent: [],
};

function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  metrics.requestsTotal += 1;

  res.on('finish', () => {
    const code = res.statusCode || 0;
    const family = `${Math.floor(code / 100)}xx`;
    if (metrics.byStatusFamily[family] !== undefined) metrics.byStatusFamily[family] += 1;

    const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
    metrics.latencyMs.count += 1;
    metrics.latencyMs.sum += elapsedMs;
    metrics.latencyMs.max = Math.max(metrics.latencyMs.max, elapsedMs);
    metrics.latencyRecent.push(elapsedMs);
    if (metrics.latencyRecent.length > 500) metrics.latencyRecent.shift();
  });

  next();
}

function getMetricsSnapshot() {
  const avg = metrics.latencyMs.count ? metrics.latencyMs.sum / metrics.latencyMs.count : 0;
  const sorted = [...metrics.latencyRecent].sort((a, b) => a - b);
  const p95 = sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] : 0;
  return {
    uptimeSeconds: Math.floor((Date.now() - metrics.startedAt) / 1000),
    requestsTotal: metrics.requestsTotal,
    byStatusFamily: metrics.byStatusFamily,
    latencyMs: {
      avg: Number(avg.toFixed(2)),
      p95: Number(p95.toFixed(2)),
      max: Number(metrics.latencyMs.max.toFixed(2)),
    },
  };
}

module.exports = { metricsMiddleware, getMetricsSnapshot };
