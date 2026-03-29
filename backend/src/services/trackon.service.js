'use strict';
const logger = require('../utils/logger');
const { fetchJsonWithRetry } = require('../utils/httpRetry');

const API_KEY = process.env.TRACKON_API_KEY;

function isConfigured() {
  return !!API_KEY;
}

// Trackon tracking endpoint placeholder
async function getTracking(awb) {
  if (!isConfigured()) {
    logger.warn('[Trackon] API key not set');
    throw new Error('Trackon API key is not configured. Please add TRACKON_API_KEY to your environment variables.');
  }

  try {
    // Example: Actual URL and headers will depend on the Trackon API documentation
    const data = await fetchJsonWithRetry(`https://some-trackon-api.com/track?awb=${awb}&key=${API_KEY}`, {
      headers: { 'Content-Type': 'application/json' },
    }, { attempts: 3, timeoutMs: 8000 });
    
    // Placeholder response mapping. You will need to map this exactly like Delhivery
    // after reading their API docs.
    const statusMapping = {
       'DLVD': 'Delivered',
       'IN TRANSIT': 'InTransit',
       'OUT FOR DELIVERY': 'OutForDelivery',
       'RTO': 'RTO',
       'BOOKED': 'Booked'
    };

    return {
      awb,
      courier:      'Trackon',
      status:       statusMapping[data.status] || 'InTransit', // map strictly to your schema
      rawStatus:    data.status || '',
      statusDetail: data.instructions || '',
      origin:       data.origin || '',
      destination:  data.destination || '',
      expectedDate: data.expectedDate || null,
      deliveredAt:  data.deliveryDate || null,
      recipient:    data.consignee || '',
      events:       [] // Trackon typically provides an array of scans here
    };
  } catch (err) {
    logger.error(`[Trackon] getTracking: ${err.message}`);
    return null;
  }
}

module.exports = { isConfigured, getTracking };
