'use strict';

const CARRIERS = ['Trackon', 'DTDC', 'Delhivery'];

function normalizeCarrier(input) {
  const value = String(input || '').trim().toLowerCase();
  if (!value) return null;
  if (value === 'trackon') return 'Trackon';
  if (value === 'dtdc') return 'DTDC';
  if (value === 'delhivery') return 'Delhivery';
  return null;
}

function normalizeCarrierPriority(priority) {
  const list = Array.isArray(priority) ? priority : [];
  const normalized = [];
  for (const item of list) {
    const carrier = normalizeCarrier(item);
    if (carrier && !normalized.includes(carrier)) normalized.push(carrier);
  }
  return normalized.length ? normalized : [...CARRIERS];
}

function computeStateBias(state) {
  const s = String(state || '').trim().toLowerCase();
  const northEast = ['assam', 'meghalaya', 'tripura', 'arunachal', 'mizoram', 'nagaland', 'sikkim', 'manipur'];
  if (northEast.some((n) => s.includes(n))) return 'NE';
  if (s.includes('jammu') || s.includes('kashmir') || s.includes('ladakh') || s.includes('andaman')) return 'REMOTE';
  return 'NORMAL';
}

function scoreCarrier(carrier, context) {
  let score = 0;
  const reasons = [];

  if (context.basePriority[0] === carrier) {
    score += 35;
    reasons.push('Top client priority');
  } else if (context.basePriority[1] === carrier) {
    score += 18;
    reasons.push('Secondary client priority');
  }

  if (context.manualPreferred && context.manualPreferred === carrier) {
    score += 80;
    reasons.push('Manually selected for this order');
  }

  if (context.serviceExpress) {
    if (carrier === 'Delhivery') {
      score += 26;
      reasons.push('Express service bias');
    } else if (carrier === 'DTDC') {
      score += 18;
      reasons.push('Express-capable fallback');
    } else {
      score -= 4;
    }
  }

  if (context.cod) {
    if (carrier === 'Delhivery') {
      score += 18;
      reasons.push('COD stability preference');
    } else if (carrier === 'DTDC') {
      score += 12;
      reasons.push('COD fallback preference');
    } else {
      score -= 6;
    }
  }

  if (context.weightGrams >= 10000) {
    if (carrier === 'Delhivery') {
      score += 16;
      reasons.push('Heavy shipment routing');
    } else if (carrier === 'DTDC') {
      score += 10;
    }
  } else if (context.weightGrams <= 1500 && carrier === 'Trackon' && !context.serviceExpress) {
    score += 10;
    reasons.push('Lightweight shipment efficiency');
  }

  if (context.stateBias === 'NE' || context.stateBias === 'REMOTE') {
    if (carrier === 'Delhivery') {
      score += 15;
      reasons.push('Remote/NE coverage bias');
    } else if (carrier === 'DTDC') {
      score += 8;
    } else {
      score -= 8;
    }
  }

  return { carrier, score, reasons };
}

function recommendCourierForBooking(input = {}) {
  const pincode = String(input.pincode || input.pin || '').trim();
  const service = String(input.service || 'Standard').trim().toLowerCase();
  const weightGrams = Math.max(0, Number(input.weightGrams || 0));
  const cod = Boolean(input.cod === true || String(input.paymentMode || '').toLowerCase() === 'cod');
  const manualPreferred = normalizeCarrier(input.preferredCourier || input.courier);

  const configuredPriority = normalizeCarrierPriority(
    input.clientSettings?.bookingPreferences?.carrierPriority
  );
  const serviceAdjustedPriority = service === 'express'
    ? ['Delhivery', 'DTDC', 'Trackon']
    : configuredPriority;
  const basePriority = serviceAdjustedPriority.filter((c) => CARRIERS.includes(c));
  for (const c of CARRIERS) if (!basePriority.includes(c)) basePriority.push(c);

  const context = {
    pincode,
    weightGrams,
    cod,
    serviceExpress: service === 'express',
    manualPreferred,
    basePriority,
    stateBias: computeStateBias(input.deliveryState || input.state),
  };

  const ranked = CARRIERS.map((carrier) => scoreCarrier(carrier, context))
    .sort((a, b) => b.score - a.score);

  const recommended = ranked[0]?.carrier || basePriority[0] || 'Trackon';
  const fallback = ranked.find((r) => r.carrier !== recommended)?.carrier || 'DTDC';
  const confidence = Math.max(0, Math.min(1, (ranked[0]?.score - (ranked[1]?.score || 0) + 50) / 100));

  return {
    recommendedCourier: recommended,
    fallbackCourier: fallback,
    rankedCouriers: ranked,
    decisionMeta: {
      confidence: Number(confidence.toFixed(2)),
      cod,
      service: service || 'standard',
      stateBias: context.stateBias,
      pincode,
      basePriority,
    },
  };
}

module.exports = {
  recommendCourierForBooking,
  normalizeCarrier,
};

