'use strict';

const cache = require('../utils/cache');
const logger = require('../utils/logger');

const GEO_TTL_SECONDS = 7 * 24 * 3600;
const USER_AGENT = 'SeaHawkCourier/1.0 (ops@seahawk.example)';

function normalizeQuery(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';
  return text.replace(/\s+/g, ' ');
}

function cacheKey(query) {
  return `geo:${query.toLowerCase()}`;
}

async function fetchNominatim(query) {
  if (!global.fetch) {
    logger.warn('Geocode: fetch unavailable, skipping lookup');
    return null;
  }
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=in&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const point = data?.[0];
  if (!point) return null;
  return {
    lat: Number(point.lat),
    lon: Number(point.lon),
    label: point.display_name || query,
    source: 'nominatim',
    cachedAt: new Date().toISOString(),
  };
}

async function geocodeQuery(query, { allowFetch = true } = {}) {
  const normalized = normalizeQuery(query);
  if (!normalized) return null;

  const key = cacheKey(normalized);
  const cached = await cache.get(key);
  if (cached) return cached;

  if (!allowFetch) return null;

  try {
    const fresh = await fetchNominatim(normalized);
    if (!fresh) return null;
    await cache.set(key, fresh, GEO_TTL_SECONDS);
    return fresh;
  } catch (err) {
    logger.warn(`Geocode: lookup failed for "${normalized}": ${err.message}`);
    return null;
  }
}

function getShipmentQuery(shipment) {
  const pin = String(shipment?.pincode || '').trim();
  if (/^\d{6}$/.test(pin)) return pin;
  const hint = String(shipment?.locationHint || '').trim();
  if (hint) return hint;
  return String(shipment?.destination || '').trim();
}

async function geocodeShipments(shipments, { maxFetch = 6 } = {}) {
  const results = new Map();
  let fetchCount = 0;

  for (const shipment of shipments) {
    const query = getShipmentQuery(shipment);
    if (!query) {
      results.set(shipment.id, null);
      continue;
    }

    const allowFetch = fetchCount < maxFetch;
    const geo = await geocodeQuery(query, { allowFetch });
    if (!geo && allowFetch) fetchCount += 1;
    results.set(shipment.id, geo || null);
  }

  return results;
}

async function refreshGeoCache(queries = []) {
  let refreshed = 0;
  for (const q of queries) {
    const query = normalizeQuery(q);
    if (!query) continue;
    const cached = await cache.get(cacheKey(query));
    if (cached) continue;
    const fresh = await geocodeQuery(query, { allowFetch: true });
    if (fresh) refreshed += 1;
  }
  return refreshed;
}

module.exports = {
  geocodeQuery,
  geocodeShipments,
  refreshGeoCache,
  getShipmentQuery,
};
