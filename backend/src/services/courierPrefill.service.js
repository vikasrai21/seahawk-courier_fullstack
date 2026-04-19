'use strict';

const logger = require('../utils/logger');
const { detectCourier } = require('../utils/awbDetect');

const PREFILL_TIMEOUT_MS = 5000;

/**
 * Attempt to pre-fill shipment fields by querying the courier's tracking API.
 *
 * Different couriers return different levels of detail:
 *   - Delhivery: consignee, address, pincode, weight, COD (verbose endpoint)
 *   - DTDC/Trackon/BlueDart/Primtrack: destination city from scan events
 *
 * This function NEVER throws — failures return null silently.
 * It runs in parallel with the OCR pipeline so it never blocks scanning.
 *
 * @param {string} awb - The AWB number
 * @param {string} [courierHint] - Optional courier name hint (from barcode detection)
 * @returns {Promise<object|null>} Pre-filled fields or null
 */
async function prefillFromApi(awb, courierHint) {
  const cleanAwb = String(awb || '').trim();
  if (!cleanAwb || cleanAwb.length < 8) return null;

  // Determine which courier to query
  let courierName = String(courierHint || '').trim();
  if (!courierName || courierName === 'AUTO') {
    const detected = detectCourier(cleanAwb);
    courierName = detected?.courier || '';
  }

  if (!courierName) return null;

  // Normalize courier name for factory lookup
  const courierKey = courierName.toLowerCase();
  let factoryName = '';
  if (courierKey.includes('delhivery')) factoryName = 'Delhivery';
  else if (courierKey.includes('dtdc')) factoryName = 'DTDC';
  else if (courierKey.includes('trackon')) factoryName = 'Trackon';
  else if (courierKey.includes('blue')) factoryName = 'BlueDart';
  else if (courierKey.includes('prim')) factoryName = 'Primtrack';
  else return null;

  try {
    const { CourierFactory } = require('./couriers/CourierFactory');
    const provider = CourierFactory.get(factoryName);

    // Race the API call against a timeout
    const trackingPromise = provider.trackShipment(cleanAwb);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Prefill timeout')), PREFILL_TIMEOUT_MS)
    );

    const trackData = await Promise.race([trackingPromise, timeoutPromise]);
    if (!trackData) return null;

    // Extract what we can from the tracking response
    const result = {
      source: 'courier_api',
      courier: factoryName,
    };

    // ── Delhivery: rich consignment data from verbose endpoint ──────────
    if (factoryName === 'Delhivery') {
      // Delhivery's trackShipment (with verbose=1) returns consignment details
      // within the Shipment object. The events also contain location data.
      const events = trackData.events || [];
      const latestLocation = events.length > 0 ? events[0].location : '';

      if (latestLocation) {
        result.destination = String(latestLocation).toUpperCase().trim();
      }

      // The Delhivery response may contain additional shipment details
      // depending on the API access level. Extract whatever is available.
      if (trackData.consignee) result.consignee = trackData.consignee;
      if (trackData.pincode) result.pincode = String(trackData.pincode);
      if (trackData.weight) result.weight = Number(trackData.weight);
      if (trackData.codAmount) result.amount = Number(trackData.codAmount);
      if (trackData.phone) result.phone = String(trackData.phone);
      if (trackData.expectedDelivery) result.expectedDelivery = trackData.expectedDelivery;
    }

    // ── All couriers: extract destination city from tracking events ─────
    if (!result.destination) {
      const events = trackData.events || [];
      // The destination is typically the LAST event's location in the tracking
      // chain, or the first event if there's only one (the booking location).
      // For in-transit parcels, the most recent scan location is a good proxy.
      if (events.length > 0) {
        // Try to find the latest non-empty location
        for (const event of events) {
          const loc = String(event.location || '').trim();
          if (loc && loc.length > 1) {
            result.destination = loc.toUpperCase();
            break; // Most recent event first (already sorted desc)
          }
        }
      }
    }

    // Extract status for context
    if (trackData.status) {
      result.trackingStatus = trackData.status;
    }

    // Only return if we actually got useful data
    const hasUsefulData = result.consignee || result.destination || result.pincode || result.weight;
    if (!hasUsefulData) return null;

    logger.info(
      `[Prefill] ${factoryName} AWB ${cleanAwb}: ` +
      `dest=${result.destination || 'NA'} consignee=${result.consignee || 'NA'} ` +
      `pin=${result.pincode || 'NA'} wt=${result.weight || 'NA'}`
    );

    return result;
  } catch (err) {
    // Silently fail — prefill is a best-effort enhancement
    const msg = String(err.message || '');
    if (!msg.includes('timeout') && !msg.includes('Prefill timeout')) {
      logger.debug(`[Prefill] ${factoryName} AWB ${cleanAwb} failed: ${msg}`);
    }
    return null;
  }
}

/**
 * Merge API pre-fill data into OCR hints.
 * API data fills GAPS only — never overrides high-confidence OCR fields.
 *
 * @param {object} ocrHints - The OCR + intelligence result
 * @param {object} apiData - The pre-fill data from courier API
 * @param {number} [minConfidenceToProtect=0.80] - OCR fields above this confidence won't be overridden
 * @returns {object} Merged result
 */
function mergeApiPrefill(ocrHints, apiData, minConfidenceToProtect = 0.80) {
  if (!apiData || !ocrHints) return ocrHints || {};

  const merged = { ...ocrHints };

  // Helper: only fill if OCR field is empty OR has low confidence
  const fillGap = (field, apiValue, confidenceField) => {
    if (!apiValue) return;
    const ocrValue = String(merged[field] || '').trim();
    const ocrConf = Number(merged[confidenceField] || 0);

    if (!ocrValue || ocrValue === 'UNKNOWN') {
      merged[field] = apiValue;
      merged[confidenceField] = 0.90;
      merged[`${field}Source`] = 'courier_api';
    } else if (ocrConf > 0 && ocrConf < minConfidenceToProtect) {
      // Low-confidence OCR — API data is likely better
      merged[`_ocr_${field}`] = ocrValue;
      merged[field] = apiValue;
      merged[confidenceField] = 0.88;
      merged[`${field}Source`] = 'courier_api';
    }
    // If OCR confidence is high (≥ minConfidenceToProtect), keep OCR value
  };

  fillGap('consignee', apiData.consignee, 'consigneeConfidence');
  fillGap('destination', apiData.destination, 'destinationConfidence');
  fillGap('pincode', apiData.pincode, 'pincodeConfidence');

  // Weight and amount: only fill if OCR returned 0 or nothing
  if (apiData.weight && (!merged.weight || merged.weight <= 0)) {
    merged.weight = apiData.weight;
    merged.weightConfidence = 0.90;
    merged.weightSource = 'courier_api';
  }
  if (apiData.amount && (!merged.amount || merged.amount <= 0)) {
    merged.amount = apiData.amount;
    merged.amountConfidence = 0.90;
    merged.amountSource = 'courier_api';
  }
  if (apiData.phone && !merged.phone) {
    merged.phone = apiData.phone;
  }

  // Tag that API prefill was applied
  if (!merged._intelligence) merged._intelligence = {};
  merged._intelligence.apiPrefill = {
    courier: apiData.courier,
    source: apiData.source,
    fieldsApplied: Object.keys(apiData).filter(k =>
      k !== 'source' && k !== 'courier' && k !== 'trackingStatus' && apiData[k]
    ),
  };

  return merged;
}

module.exports = {
  prefillFromApi,
  mergeApiPrefill,
  PREFILL_TIMEOUT_MS,
};
