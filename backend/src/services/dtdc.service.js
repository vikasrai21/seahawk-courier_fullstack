'use strict';
const logger = require('../utils/logger');
const { fetchJsonWithRetry, fetchWithRetry } = require('../utils/httpRetry');

let tokenCache = {
  value: null,
  expiresAt: 0,
};

function getConfig() {
  return {
    accessToken: process.env.DTDC_ACCESS_TOKEN || process.env.DTDC_API_KEY || '',
    username: process.env.DTDC_USERNAME || process.env.DTDC_CLIENT_ID || '',
    password: process.env.DTDC_PASSWORD || '',
    authUrl: process.env.DTDC_AUTH_API_URL || 'https://blktracksvc.dtdc.com/dtdc-api/api/dtdc/authenticate',
    trackingUrl: process.env.DTDC_TRACKING_API_URL || 'https://blktracksvc.dtdc.com/dtdc-tracking-api/dtdc-api/rest/JSONCnTrk/getTrackDetails',
    addtnlDtl: process.env.DTDC_TRACKING_ADDITIONAL_DETAILS || 'Y',
    tokenTtlMs: Number(process.env.DTDC_TOKEN_TTL_MS || 50 * 60 * 1000),
  };
}

function isConfigured() {
  const cfg = getConfig();
  return !!cfg.accessToken || !!(cfg.username && cfg.password);
}

function resetTokenCache() {
  tokenCache = { value: null, expiresAt: 0 };
}

async function getAccessToken() {
  const cfg = getConfig();

  if (cfg.accessToken) return cfg.accessToken;

  if (tokenCache.value && tokenCache.expiresAt > Date.now()) {
    return tokenCache.value;
  }

  if (!cfg.username || !cfg.password) {
    throw new Error('DTDC API credentials are not configured. Add DTDC_ACCESS_TOKEN or DTDC_USERNAME/DTDC_PASSWORD.');
  }

  const query = new URLSearchParams({
    username: cfg.username,
    password: cfg.password,
  });

  const response = await fetchWithRetry(`${cfg.authUrl}?${query.toString()}`, {
    headers: { Accept: 'application/json, text/plain;q=0.9, */*;q=0.8' },
  }, { attempts: 3, timeoutMs: 8000 });

  const text = (await response.text()).trim();
  const token = extractToken(text);
  if (!token) {
    throw new Error(`DTDC authentication succeeded but no token was returned. Response: ${text.slice(0, 200)}`);
  }

  tokenCache = {
    value: token,
    expiresAt: Date.now() + Math.max(60_000, cfg.tokenTtlMs),
  };

  return token;
}

function extractToken(rawText) {
  if (!rawText) return '';

  try {
    const parsed = JSON.parse(rawText);
    const token = parsed?.token || parsed?.accessToken || parsed?.access_token || parsed?.data?.token || parsed?.data?.accessToken;
    if (token) return String(token).trim();
  } catch (e) { void e; }

  return rawText.replace(/^"+|"+$/g, '').trim();
}

function mapDTDCStatus(raw) {
  const s = String(raw || '').toUpperCase().trim();
  if (!s) return 'InTransit';
  if (s.includes('DELIVERED')) return 'Delivered';
  if (s.includes('OUT FOR DELIVERY') || s.includes('DELIVERY PROCESS IN PROGRESS')) return 'OutForDelivery';
  if (s.includes('ATTEMPT') || s.includes('NOT DELIVERED') || s.includes('HELDUP')) return 'Failed';
  if (s.includes('RETURNED') || s.includes('RTO')) return 'RTO';
  if (s.includes('PICKED UP')) return 'PickedUp';
  if (s.includes('BOOKED') || s.includes('PICKUP')) return 'Booked';
  if (s.includes('DISPATCH') || s.includes('RECEIVED') || s.includes('IN TRANSIT')) return 'InTransit';
  return 'InTransit';
}

function parseDTDCTimestamp(dateText, timeText) {
  const date = String(dateText || '').trim();
  const time = String(timeText || '').trim();

  if (!date) return new Date();

  const dmY = date.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (!dmY) return new Date();

  const [, dd, mm, yyyy] = dmY;
  let normalizedTime = '00:00:00';

  if (/^\d{4}$/.test(time)) {
    normalizedTime = `${time.slice(0, 2)}:${time.slice(2, 4)}:00`;
  } else if (/^\d{2}:\d{2}$/.test(time)) {
    normalizedTime = `${time}:00`;
  } else if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
    normalizedTime = time;
  }

  const iso = `${yyyy}-${mm}-${dd}T${normalizedTime}`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

async function getTracking(awb) {
  if (!isConfigured()) {
    logger.warn('[DTDC] tracking credentials not set');
    throw new Error('DTDC API credentials are not configured. Add DTDC_ACCESS_TOKEN or DTDC_USERNAME/DTDC_PASSWORD.');
  }

  try {
    const cfg = getConfig();
    const token = await getAccessToken();
    const data = await fetchJsonWithRetry(cfg.trackingUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token,
      },
      body: JSON.stringify({
        trkType: 'cnno',
        strcnno: String(awb || ''),
        addtnlDtl: String(cfg.addtnlDtl || 'Y').toUpperCase() === 'N' ? 'N' : 'Y',
      }),
    }, { attempts: 3, timeoutMs: 8000 });

    if (!data?.statusFlag || String(data?.status || '').toUpperCase() === 'FAILED') {
      const detail = Array.isArray(data?.errorDetails)
        ? data.errorDetails.map((item) => item?.value).filter(Boolean).join(' | ')
        : data?.errorDetails?.strError || '';
      if (detail && /NO DATA FOUND/i.test(detail)) return null;
    }

    const header = data?.trackHeader || {};
    const details = Array.isArray(data?.trackDetails) ? data.trackDetails : [];

    return {
      awb,
      courier:      'DTDC',
      status:       mapDTDCStatus(header.strStatus || details[0]?.strAction || ''),
      rawStatus:    header.strStatus || '',
      statusDetail: header.strRemarks || '',
      origin:       header.strOrigin || details[0]?.strOrigin || '',
      destination:  header.strDestination || details[0]?.strDestination || '',
      expectedDate: header.strExpectedDeliveryDate || header.strRevExpectedDeliveryDate || null,
      deliveredAt:  mapDTDCStatus(header.strStatus || '') === 'Delivered'
        ? parseDTDCTimestamp(header.strStatusTransOn, header.strStatusTransTime)
        : null,
      recipient:    header.strRemarks || '',
      rawData:      data,
      events:       details.map((event) => ({
        status: mapDTDCStatus(event.strAction || event.strCode || ''),
        location: event.strOrigin || event.strDestination || '',
        description: event.strAction || event.sTrRemarks || event.strRemarks || '',
        timestamp: parseDTDCTimestamp(event.strActionDate, event.strActionTime),
        rawData: event,
      })),
    };
  } catch (err) {
    logger.error(`[DTDC] getTracking: ${err.message}`);
    return null;
  }
}

module.exports = { isConfigured, getTracking, getAccessToken, resetTokenCache };
