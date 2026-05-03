'use strict';

const SCORE_WEIGHT = {
  source: {
    url: 7,
    context: 6,
    raw: 4,
    compact: 3,
  },
  numericShape: 3,
  alphaNumericShape: 3,
  preferredLength: 2,
  courierRuleMatch: 6,
  likelyPhonePenalty: -6,
  likelyEan13Penalty: -4,
};

const COURIER_RULES = {
  trackon: [/^(?:100|200|500)\d{8,10}$/],
  dtdc: [/^[A-Z]{1,2}\d{8,11}$/, /^\d{9,12}$/],
  delhivery: [/^\d{12,15}$/],
  bluedart: [/^(209|175|176|177|178|179)\d{8}$/],
  default: [/^\d{10,14}$/, /^[A-Z]{1,2}\d{8,11}$/],
};

// Trackon AWB prefixes — these should NEVER be mistaken for phone numbers.
// Keep these strict to avoid promoting random numeric strings.
const TRACKON_PREFIXES = [
  /^100\d{9,10}$/, // 12-13 digits
  /^2000[45]\d*$/, // CHANGE: match backend Trackon Prime Track prefix
  /^200\d{8,10}$/, // 11-13 digits
  /^500\d{8,10}$/, // 11-13 digits
];

function courierKey(value = '') {
  const courier = String(value || '').toLowerCase();
  if (courier.includes('trackon')) return 'trackon';
  if (courier.includes('dtdc')) return 'dtdc';
  if (courier.includes('delhivery')) return 'delhivery';
  if (courier.includes('blue')) return 'bluedart';
  return 'default';
}

function isLikelyPhone(value = '') {
  // Don't flag Trackon AWBs as phone numbers
  if (TRACKON_PREFIXES.some((rx) => rx.test(value))) return false;
  return /^[6-9]\d{9}$/.test(value);
}

function isLikelyTrackonAwb(value = '') {
  return TRACKON_PREFIXES.some((rx) => rx.test(value));
}

function isValidEan13(value = '') {
  if (!/^\d{13}$/.test(value)) return false;
  const digits = value.split('').map(Number);
  const check = digits.pop();
  const sum = digits.reduce((acc, digit, idx) => acc + digit * (idx % 2 === 0 ? 1 : 3), 0);
  const calc = (10 - (sum % 10)) % 10;
  return calc === check;
}

function scoreCandidate(candidate, source, courierHint) {
  let score = SCORE_WEIGHT.source[source] || 1;

  if (/^\d+$/.test(candidate)) score += SCORE_WEIGHT.numericShape;
  if (/[A-Z]/.test(candidate) && /\d/.test(candidate)) score += SCORE_WEIGHT.alphaNumericShape;
  if (candidate.length >= 10 && candidate.length <= 13) score += SCORE_WEIGHT.preferredLength;

  const key = courierKey(courierHint);
  const rules = COURIER_RULES[key] || COURIER_RULES.default;
  if (rules.some((rule) => rule.test(candidate))) {
    score += SCORE_WEIGHT.courierRuleMatch;
  }

  // Trackon AWB boost — these are high-confidence, never phone numbers
  if (isLikelyTrackonAwb(candidate)) {
    score += 8;
  }

  if (isLikelyPhone(candidate)) {
    score += SCORE_WEIGHT.likelyPhonePenalty;
  }
  if (/^0\d{12}$/.test(candidate)) {
    // Leading-zero 13-digit — could be ITF with padding
    // Reduced penalty since it might be a valid padded Trackon AWB
    score -= 2;
  }
  if (isValidEan13(candidate) && key === 'default' && !isLikelyTrackonAwb(candidate)) {
    score += SCORE_WEIGHT.likelyEan13Penalty;
  }

  return score;
}

function collectCandidatesFromRaw(rawValue = '', courierHint = '') {
  const raw = String(rawValue || '').toUpperCase();
  const compact = raw.replace(/\s+/g, '');
  const candidates = new Map();

  const push = (value, source = 'raw') => {
    const normalized = String(value || '').replace(/[^A-Z0-9]/g, '');
    if (!normalized) return;
    if (normalized.length < 8 || normalized.length > 16) return;
    if (/^0+$/.test(normalized)) return;
    const score = scoreCandidate(normalized, source, courierHint);
    const previous = candidates.get(normalized);
    if (!previous || score > previous.score) {
      candidates.set(normalized, { value: normalized, score });
    }
  };

  push(compact, 'compact');
  (raw.match(/[?&](?:awb|awbno|waybill|consignment|cn|docket|track(?:ing)?(?:_?no)?)=([A-Z0-9-]{6,24})/g) || [])
    .forEach((token) => {
      const value = token.split('=').pop();
      push(value, 'url');
    });
  (raw.match(/\b(?:AWB|AWBNO|WAYBILL|CONSIGNMENT|CN|DOCKET)[\s:=#-]*([A-Z0-9-]{6,24})\b/g) || [])
    .forEach((token) => {
      const match = token.match(/([A-Z0-9-]{6,24})$/);
      if (match?.[1]) push(match[1], 'context');
    });
  // Expanded to capture 9-14 digit numbers (Trackon 11-digit AWBs)
  (raw.match(/\b\d{9,14}\b/g) || []).forEach((token) => push(token, 'raw'));
  (raw.match(/\b[A-Z]{1,2}\d{8,11}\b/g) || []).forEach((token) => push(token, 'raw'));

  // Handle ITF odd-digit barcodes: ITF requires even digit count, so decoders
  // often add a leading zero. Try both the padded and stripped versions.
  [...candidates.keys()].forEach((candidate) => {
    if (/^0\d{10,13}$/.test(candidate)) {
      // Padded — also try the stripped version
      push(candidate.slice(1), 'raw');
    }
    if (/^\d{11}$/.test(candidate)) {
      // 11-digit — also try with leading zero (ITF padding)
      push('0' + candidate, 'raw');
    }
  });

  return [...candidates.values()].sort((a, b) => b.score - a.score);
}

export function rankBarcodeCandidates(rawValues = [], options = {}) {
  const courierHint = typeof options === 'string' ? options : options?.courierHint || '';
  const values = Array.isArray(rawValues) ? rawValues : [rawValues];
  const aggregate = new Map();

  values.forEach((rawValue) => {
    const ranked = collectCandidatesFromRaw(rawValue, courierHint);
    ranked.forEach((candidate) => {
      const prev = aggregate.get(candidate.value);
      if (!prev || candidate.score > prev.score) {
        aggregate.set(candidate.value, candidate);
      }
    });
  });

  const ranked = [...aggregate.values()].sort((a, b) => b.score - a.score);
  const top = ranked[0] || null;
  const second = ranked[1] || null;
  const ambiguous = Boolean(top && second && Math.abs(top.score - second.score) <= 1);

  return {
    awb: top?.value || '',
    score: top?.score || 0,
    ambiguous,
    alternatives: ranked.slice(1, 4).map((candidate) => candidate.value),
    ranked,
  };
}

export function normalizeBarcodeCandidate(rawValue = '', options = {}) {
  return rankBarcodeCandidates([rawValue], options).awb;
}

export function inferCourierFromAwb(awb = '') {
  // CHANGE: match backend/src/utils/awbDetect.js courier inference exactly
  const a = String(awb || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!a) return '';
  if (/^Z\d{8,9}$/.test(a)) return 'DTDC';
  if (/^D\d{9,11}$/.test(a)) return 'DTDC';
  if (/^X\d{9,10}$/.test(a)) return 'DTDC';
  if (/^7X\d{9}$/.test(a)) return 'DTDC';
  if (/^I\d{7,8}$/.test(a)) return 'DTDC';
  if (/^I85\d{6}$/.test(a)) return 'DTDC';
  if (/^(209|175|176|177|178|179)\d{8}$/.test(a)) return 'BlueDart';
  if (/^(299|368|289|279)\d{11}$/.test(a)) return 'Delhivery';
  if (/^8\d{9,10}$/.test(a)) return 'DHL';
  if (/^JD\d{18}$/.test(a)) return 'DHL';
  if (/^100\d{9}$/.test(a)) return 'Trackon';
  if (/^500\d{9}$/.test(a)) return 'Trackon';
  if (/^2000[45]/.test(a)) return 'Trackon';
  if (/^200\d{9}$/.test(a)) return 'Trackon';
  return '';
}
