'use strict';
const logger = require('../utils/logger');

const CLIENT_ID = process.env.DTDC_CLIENT_ID;
const API_KEY   = process.env.DTDC_API_KEY;

function isConfigured() {
  return !!(API_KEY && CLIENT_ID);
}

// DTDC tracking endpoint placeholder
async function getTracking(awb) {
  if (!isConfigured()) {
    logger.warn('[DTDC] API key or Client ID not set');
    throw new Error('DTDC API credentials are not configured. Please add DTDC_API_KEY and DTDC_CLIENT_ID to your environment variables.');
  }

  try {
    // Example: Actual URL and headers will depend on the DTDC API documentation
    const res = await fetch(`https://some-dtdc-api.com/track/${awb}`, {
      headers: { 
         'Content-Type': 'application/json',
         'x-api-key': API_KEY,
         'client-id': CLIENT_ID
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) { 
        logger.warn(`[DTDC] track ${res.status}`); 
        return null; 
    }

    const data = await res.json();
    
    // Placeholder response mapping:
    return {
      awb,
      courier:      'DTDC',
      status:       'InTransit', // Map to standard STATUSES ('Delivered', 'OutForDelivery', etc.)
      rawStatus:    data.status || '',
      statusDetail: data.details || '',
      origin:       data.start_location || '',
      destination:  data.end_location || '',
      expectedDate: null,
      deliveredAt:  null,
      recipient:    data.recipient_name || '',
      events:       [] 
    };
  } catch (err) {
    logger.error(`[DTDC] getTracking: ${err.message}`);
    return null;
  }
}

module.exports = { isConfigured, getTracking };
