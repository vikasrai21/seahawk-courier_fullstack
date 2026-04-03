'use strict';

const { fetchJsonWithRetry } = require('../utils/httpRetry');

const PIN_API_URL = process.env.PINCODE_API_URL || 'https://api.postalpincode.in/pincode';
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour cache on the server
const cache = new Map();

function normalizePin(pin) {
  return String(pin || '').trim();
}

async function lookupPincode(pin) {
  const normalized = normalizePin(pin);
  if (!/^\d{6}$/.test(normalized)) throw new Error('Invalid PIN code');

  const now = Date.now();
  const cached = cache.get(normalized);
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  const payload = await fetchJsonWithRetry(`${PIN_API_URL}/${normalized}`, {}, { attempts: 2, timeoutMs: 5000 });
  const info = Array.isArray(payload) ? payload[0] : null;
  const postOffice = info?.PostOffice?.[0] || null;
  const result = {
    status: info?.Status || 'Unknown',
    message: info?.Message || '',
    pin: normalized,
    postOffice,
    raw: info || null,
  };

  cache.set(normalized, { ts: now, data: result });
  return result;
}

module.exports = { lookupPincode };
