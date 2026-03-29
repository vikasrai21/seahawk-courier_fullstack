const SUPPORTED = new Set(['LCP', 'CLS', 'INP', 'FCP', 'TTFB']);

function sendMetric(metric, value, rating) {
  if (!SUPPORTED.has(metric) || !Number.isFinite(value)) return;
  const payload = JSON.stringify({
    metric,
    value,
    rating: rating || '',
    page: window.location.pathname,
    ts: Date.now(),
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/public/rum', payload);
    return;
  }

  fetch('/api/public/rum', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

export function initWebVitals() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  // LCP
  try {
    let lcp = 0;
    const po = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const last = entries[entries.length - 1];
      if (last) lcp = last.startTime;
    });
    po.observe({ type: 'largest-contentful-paint', buffered: true });
    addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && lcp > 0) sendMetric('LCP', lcp);
    });
  } catch (err) {
    void err;
  }

  // CLS
  try {
    let cls = 0;
    const po = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) cls += entry.value;
      }
    });
    po.observe({ type: 'layout-shift', buffered: true });
    addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && cls > 0) sendMetric('CLS', cls);
    });
  } catch (err) {
    void err;
  }

  // INP
  try {
    let inp = 0;
    const po = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const candidate = entry.duration || 0;
        if (candidate > inp) inp = candidate;
      }
    });
    po.observe({ type: 'event', buffered: true, durationThreshold: 16 });
    addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && inp > 0) sendMetric('INP', inp);
    });
  } catch (err) {
    void err;
  }
}
