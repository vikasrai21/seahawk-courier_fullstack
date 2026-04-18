function toPositiveNumber(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

export function evaluateBarcodeStability({
  samples = [],
  awb,
  now = Date.now(),
  stabilityWindowMs = 1100,
  requiredHits = 3,
}) {
  const windowMs = toPositiveNumber(stabilityWindowMs, 1100);
  const minHits = Math.max(1, Math.floor(toPositiveNumber(requiredHits, 3)));
  const timestamp = toPositiveNumber(now, Date.now());
  const value = String(awb || '').trim();

  const filtered = Array.isArray(samples)
    ? samples.filter((entry) => entry?.awb && (timestamp - (entry?.at || 0)) <= windowMs)
    : [];

  if (!value) {
    return {
      samples: filtered,
      hits: 0,
      isStable: false,
    };
  }

  const nextSamples = [...filtered, { awb: value, at: timestamp }];
  const hits = nextSamples.reduce(
    (count, entry) => (entry.awb === value ? count + 1 : count),
    0
  );

  return {
    samples: nextSamples,
    hits,
    isStable: hits >= minHits,
  };
}

export function nextBarcodeFallbackState({
  currentAttempts = 0,
  maxReframeAttempts = 2,
}) {
  const maxAttempts = Math.max(0, Math.floor(toPositiveNumber(maxReframeAttempts, 2)));
  const nextAttempts = Math.max(0, Math.floor(Number(currentAttempts) || 0)) + 1;
  if (nextAttempts <= maxAttempts) {
    return {
      action: 'reframe',
      attempts: nextAttempts,
    };
  }
  return {
    action: 'switch_to_document',
    attempts: maxAttempts,
  };
}

