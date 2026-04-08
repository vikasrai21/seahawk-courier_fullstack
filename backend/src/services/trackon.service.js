'use strict';
const logger = require('../utils/logger');
const { fetchJsonWithRetry } = require('../utils/httpRetry');

function isConfigured() {
  const appKey = process.env.TRACKON_APP_KEY || process.env.TRACKON_API_KEY;
  const userId = process.env.TRACKON_USER_ID || process.env.TRACKON_CUSTOMER_ID || process.env.TRACKON_CLIENT_ID;
  const password = process.env.TRACKON_PASSWORD;
  return !!(appKey && userId && password);
}

async function getTracking(awb) {
  const appKey = process.env.TRACKON_APP_KEY || process.env.TRACKON_API_KEY;
  const userId = process.env.TRACKON_USER_ID || process.env.TRACKON_CUSTOMER_ID || process.env.TRACKON_CLIENT_ID;
  const password = process.env.TRACKON_PASSWORD;
  const baseUrl = process.env.TRACKON_TRACKING_API_URL || process.env.TRACKON_API_URL || 'https://api.trackon.in';

  if (!isConfigured()) {
    logger.warn('[Trackon] credentials not set');
    throw new Error('Trackon credentials are not configured. Add TRACKON_APP_KEY/TRACKON_USER_ID/TRACKON_PASSWORD.');
  }

  try {
    const query = new URLSearchParams({
      AWBNo: String(awb || ''),
      AppKey: String(appKey),
      userID: String(userId),
      Password: String(password),
    });
    const data = await fetchJsonWithRetry(`${baseUrl}/CrmApi/t1/AWBTrackingCustomer?${query.toString()}`, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    }, { attempts: 3, timeoutMs: 8000 });

    const summary = data?.summaryTrack || {};
    const details = Array.isArray(data?.lstDetails) ? data.lstDetails : [];
    const latest = details[0] || summary || {};

    return {
      awb,
      courier:      'Trackon',
      status:       mapTrackonStatus(`${latest.TRACKING_CODE || ''} ${latest.CURRENT_STATUS || ''}`),
      rawStatus:    latest.CURRENT_STATUS || '',
      statusDetail: latest.CURRENT_STATUS || '',
      origin:       summary.ORIGIN || '',
      destination:  summary.DESTINATION || '',
      expectedDate: null,
      deliveredAt:  null,
      recipient:    '',
      events: details.map((e) => ({
        status: mapTrackonStatus(`${e.TRACKING_CODE || ''} ${e.CURRENT_STATUS || ''}`),
        location: e.CURRENT_CITY || '',
        description: e.CURRENT_STATUS || '',
        timestamp: parseTrackonTimestamp(e.EVENTDATE, e.EVENTTIME),
        rawData: e,
      })),
    };
  } catch (err) {
    logger.error(`[Trackon] getTracking: ${err.message}`);
    return null;
  }
}

function mapTrackonStatus(raw) {
  const s = String(raw || '').toUpperCase().trim();
  if (s.startsWith('DRS') || s.includes('OUT FOR')) return 'OutForDelivery';
  if (s.startsWith('DDU') || s.includes('DELIVERED') || /\bDELIVER\b/.test(s)) return 'Delivered';
  if (s.startsWith('DNU') || s.includes('UNDELIVER') || s.includes('ATMP')) return 'Failed';
  if (s.startsWith('R') && (s.includes('RTO') || s.includes('RSET') || s.includes('RMFT') || s.includes('RHO') || s.includes('RIS'))) return 'RTO';
  if (s.startsWith('BOK') || s.includes('BOOK') || s.includes('PICK UP')) return 'Booked';
  if (s.includes('TRANSIT') || s.includes('MFT') || s.includes('CDIN') || s.includes('INSCAN')) return 'InTransit';
  return 'InTransit';
}

function parseTrackonTimestamp(eventDate, eventTime) {
  const dateText = String(eventDate || '').trim();
  const timeText = String(eventTime || '00:00:00').trim();
  if (!dateText) return new Date();
  const m = dateText.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return new Date();
  const [, dd, mm, yyyy] = m;
  const iso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T${timeText.length === 5 ? `${timeText}:00` : timeText}`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

module.exports = { isConfigured, getTracking };
