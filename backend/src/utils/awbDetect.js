// backend/src/utils/awbDetect.js
// Detects courier from AWB number format
// Based on real AWB samples from Sea Hawk channel partners

'use strict';

/**
 * Detect courier from AWB number
 * Returns { courier, confidence, normalized }
 * confidence: 'high' = certain, 'medium' = likely, 'low' = ambiguous
 */
function detectCourier(awb) {
  if (!awb) return null;
  const a = awb.toString().trim().toUpperCase().replace(/\s+/g, '');
  if (!a) return null;

  // ── DTDC patterns ──────────────────────────────────────────────────────
  // Z + 8 digits  e.g. Z65539608, Z66077762
  if (/^Z\d{8,9}$/.test(a)) {
    return { courier: 'DTDC', confidence: 'high', normalized: a };
  }
  // D + 10 digits  e.g. D3005408087, D4000581181
  if (/^D\d{9,11}$/.test(a)) {
    return { courier: 'DTDC', confidence: 'high', normalized: a };
  }
  // X + 10 digits  e.g. X1000204925
  if (/^X\d{9,10}$/.test(a)) {
    return { courier: 'DTDC', confidence: 'high', normalized: a };
  }
  // 7X + 9 digits  e.g. 7X109105835, 7X113619194
  if (/^7X\d{9}$/.test(a)) {
    return { courier: 'DTDC', confidence: 'high', normalized: a };
  }
  // I + 8 digits  e.g. I23458138 (DTDC COD)
  if (/^I\d{7,8}$/.test(a)) {
    return { courier: 'DTDC', confidence: 'high', normalized: a, type: 'COD' };
  }
  // I + 8 digits starting with 85 (DTDC COD)
  if (/^I85\d{6}$/.test(a)) {
    return { courier: 'DTDC', confidence: 'high', normalized: a, type: 'COD' };
  }

  // ── Bluedart patterns ──────────────────────────────────────────────────
  // 11 digits starting with 209, 175, 179, 176, 177, 178, 209
  if (/^(209|175|176|177|178|179)\d{8}$/.test(a)) {
    return { courier: 'BLUEDART', confidence: 'high', normalized: a };
  }

  // ── Delhivery patterns ─────────────────────────────────────────────────
  // 14 digits starting with 299, 368, 289, 279
  if (/^(299|368|289|279)\d{11}$/.test(a)) {
    return { courier: 'DELHIVERY', confidence: 'high', normalized: a };
  }

  // ── DHL patterns ───────────────────────────────────────────────────────
  // 10-11 digits starting with 8
  if (/^8\d{9,10}$/.test(a)) {
    return { courier: 'DHL', confidence: 'high', normalized: a };
  }
  // JD + digits (DHL eCommerce)
  if (/^JD\d{18}$/.test(a)) {
    return { courier: 'DHL', confidence: 'high', normalized: a };
  }

  // ── Primetrack vs Trackon disambiguation ───────────────────────────────
  // Both use 12-digit numbers starting with 1 or 5 or 2
  // Trackon:   100..., 500...
  // Primetrack: 200040..., 200042..., 200058485..., 200055477... (mixed!)
  // Strategy: try to match known Primetrack prefixes first

  // 12 digits starting with 100 → Trackon (high confidence)
  if (/^100\d{9}$/.test(a)) {
    return { courier: 'TRACKON', confidence: 'high', normalized: a };
  }
  // 12 digits starting with 500 → Trackon (high confidence)
  if (/^500\d{9}$/.test(a)) {
    return { courier: 'TRACKON', confidence: 'high', normalized: a };
  }
  // 12 digits starting with 20004 or 20040 → Primetrack
  if (/^200(04|40)\d{7}$/.test(a)) {
    return { courier: 'PRIMETRACK', confidence: 'high', normalized: a };
  }
  // 12 digits starting with 20005848 or 20005849 → Primetrack
  if (/^2000584[5-9]\d{4}$/.test(a)) {
    return { courier: 'PRIMETRACK', confidence: 'medium', normalized: a };
  }
  // 12 digits starting with 200 but ambiguous → try both
  if (/^200\d{9}$/.test(a)) {
    return { courier: 'PRIMETRACK_OR_TRACKON', confidence: 'low', normalized: a, tryBoth: true };
  }

  // Unknown
  return { courier: 'UNKNOWN', confidence: 'low', normalized: a };
}

/**
 * Get courier display info
 */
function getCourierInfo(courier) {
  const map = {
    DTDC:        { name: 'DTDC',       logo: '🟣', color: '#7c3aed', trackUrl: 'https://www.dtdc.in/trace.asp?strCnno=' },
    BLUEDART:    { name: 'Bluedart',   logo: '🔵', color: '#1d4ed8', trackUrl: 'https://www.bluedart.com/tracking' },
    DELHIVERY:   { name: 'Delhivery', logo: '🟠', color: '#f97316', trackUrl: 'https://www.delhivery.com/track/package/' },
    TRACKON:     { name: 'Trackon',    logo: '🟢', color: '#16a34a', trackUrl: 'http://trackon.in/Trackon/pub/mainHtml.pub' },
    PRIMETRACK:  { name: 'Primetrack', logo: '🔴', color: '#dc2626', trackUrl: 'https://www.primetrack.in' },
    DHL:         { name: 'DHL',        logo: '🟡', color: '#ca8a04', trackUrl: 'https://www.dhl.com/in-en/home/tracking.html' },
    UNKNOWN:     { name: 'Unknown',    logo: '❓', color: '#6b7280', trackUrl: null },
  };
  return map[courier] || map.UNKNOWN;
}

module.exports = { detectCourier, getCourierInfo };