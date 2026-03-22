// backend/src/routes/public.routes.js
// Public tracking endpoint — no auth required
'use strict';

const express = require('express');
const router  = express.Router();
const { detectCourier, getCourierInfo } = require('../utils/awbDetect');
const prisma  = require('../config/prisma');
const logger  = require('../utils/logger');

// ── In-house tracking from your DB ─────────────────────────────────────────
async function trackInHouse(awb) {
  try {
    const shipment = await prisma.shipment.findFirst({
      where: {
        OR: [
          { awb: { equals: awb, mode: 'insensitive' } },
          { awb: awb },
        ]
      },
      select: {
        awb: true, status: true, consignee: true,
        destination: true, courier: true, date: true,
        weight: true, amount: true,
        trackingEvents: true,
      }
    });
    return shipment;
  } catch { return null; }
}

// ── Courier API stubs — replace with real implementations ──────────────────
// Each function returns: { status, events[], consignee, destination, courier }
// or null if not found

async function trackDTDC(awb) {
  const key = process.env.DTDC_API_KEY;
  const customerCode = process.env.DTDC_CUSTOMER_CODE;
  if (!key || !customerCode) return null;
  try {
    const res = await fetch(`https://blktracksvc.dtdc.com/dtdc-api/rest/JSONCnTrk/getShpCnTrk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'API_KEY': key },
      body: JSON.stringify({ custCode: customerCode, trackFor: awb }),
      signal: AbortSignal.timeout(8000),
    });
    const json = await res.json();
    // Parse DTDC response — structure varies, adapt when you have real response
    if (!json || json.errorMessage) return null;
    const data = json.scans?.[0] || json;
    return {
      courier: 'DTDC',
      status: data.status || data.scanStatus || 'In Transit',
      consignee: data.consigneeName || '',
      destination: data.destination || '',
      events: (json.scans || []).map(s => ({
        status:    s.scanStatus || s.status,
        location:  s.scanLocation || s.location,
        timestamp: s.scanDateTime || s.date,
        description: s.remarks || '',
      })),
    };
  } catch (e) {
    logger.warn('DTDC tracking failed', { awb, error: e.message });
    return null;
  }
}

async function trackBluedart(awb) {
  const key     = process.env.BLUEDART_LICENSE_KEY;
  const loginId = process.env.BLUEDART_LOGIN_ID;
  if (!key || !loginId) return null;
  try {
    // Bluedart uses SOAP/REST API
    const res = await fetch(`https://netconnect.bluedart.com/ver1.9/ShippingAPI/Track/ShipmentTracking.svc/json/GetShipmentDetails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handler: { AWBNo: awb, LicenceKey: key, LoginID: loginId },
      }),
      signal: AbortSignal.timeout(8000),
    });
    const json = await res.json();
    if (!json?.ShipmentData) return null;
    const d = json.ShipmentData;
    return {
      courier: 'BLUEDART',
      status: d.Status || 'In Transit',
      consignee: d.Consignee || '',
      destination: d.Destination || '',
      events: (d.Scans || []).map(s => ({
        status:      s.ScanDetail?.Scan,
        location:    s.ScanDetail?.ScannedLocation,
        timestamp:   s.ScanDetail?.ScanDate,
        description: s.ScanDetail?.Instructions,
      })),
    };
  } catch (e) {
    logger.warn('Bluedart tracking failed', { awb, error: e.message });
    return null;
  }
}

async function trackDelhivery(awb) {
  const key = process.env.DELHIVERY_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://track.delhivery.com/api/v1/packages/json/?waybill=${awb}&verbose=1`, {
      headers: { Authorization: `Token ${key}` },
      signal: AbortSignal.timeout(8000),
    });
    const json = await res.json();
    const pkg  = json?.ShipmentData?.[0]?.Shipment;
    if (!pkg) return null;
    return {
      courier: 'DELHIVERY',
      status:      pkg.Status?.Status || 'In Transit',
      consignee:   pkg.Consignee || '',
      destination: pkg.To || '',
      events: (pkg.Scans || []).map(s => ({
        status:      s.ScanDetail?.Scan,
        location:    s.ScanDetail?.ScannedLocation,
        timestamp:   s.ScanDetail?.ScanDate,
        description: s.ScanDetail?.Instructions,
      })),
    };
  } catch (e) {
    logger.warn('Delhivery tracking failed', { awb, error: e.message });
    return null;
  }
}

async function trackTrackon(awb) {
  const key = process.env.TRACKON_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://trackonweb.com/track-api/?awb=${awb}&apikey=${key}`, {
      signal: AbortSignal.timeout(8000),
    });
    const json = await res.json();
    if (!json || json.error) return null;
    return {
      courier: 'TRACKON',
      status:      json.status || 'In Transit',
      consignee:   json.consignee || '',
      destination: json.destination || '',
      events: (json.events || json.scans || []).map(s => ({
        status:      s.status || s.scan,
        location:    s.location || s.city,
        timestamp:   s.time || s.date,
        description: s.remarks || '',
      })),
    };
  } catch (e) {
    logger.warn('Trackon tracking failed', { awb, error: e.message });
    return null;
  }
}

async function trackPrimetrack(awb) {
  const key = process.env.PRIMETRACK_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://www.primetrack.in/api/track?awb=${awb}&apikey=${key}`, {
      signal: AbortSignal.timeout(8000),
    });
    const json = await res.json();
    if (!json || json.error) return null;
    return {
      courier: 'PRIMETRACK',
      status:      json.status || 'In Transit',
      consignee:   json.consignee || '',
      destination: json.destination || '',
      events: (json.events || []).map(s => ({
        status:    s.status,
        location:  s.location,
        timestamp: s.time,
        description: s.remarks || '',
      })),
    };
  } catch (e) {
    logger.warn('Primetrack tracking failed', { awb, error: e.message });
    return null;
  }
}

async function trackDHL(awb) {
  const key = process.env.DHL_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://api-eu.dhl.com/track/shipments?trackingNumber=${awb}`, {
      headers: { 'DHL-API-Key': key },
      signal: AbortSignal.timeout(8000),
    });
    const json = await res.json();
    const ship = json?.shipments?.[0];
    if (!ship) return null;
    return {
      courier: 'DHL',
      status:      ship.status?.description || 'In Transit',
      consignee:   ship.receiver?.name || '',
      destination: ship.destination?.address?.addressLocality || '',
      events: (ship.events || []).map(e => ({
        status:    e.description,
        location:  e.location?.address?.addressLocality,
        timestamp: e.timestamp,
        description: '',
      })),
    };
  } catch (e) {
    logger.warn('DHL tracking failed', { awb, error: e.message });
    return null;
  }
}

// ── Courier dispatcher ──────────────────────────────────────────────────────
async function trackWithCourier(courier, awb) {
  switch (courier) {
    case 'DTDC':      return trackDTDC(awb);
    case 'BLUEDART':  return trackBluedart(awb);
    case 'DELHIVERY': return trackDelhivery(awb);
    case 'TRACKON':   return trackTrackon(awb);
    case 'PRIMETRACK':return trackPrimetrack(awb);
    case 'DHL':       return trackDHL(awb);
    default:          return null;
  }
}

// ── Main tracking endpoint ──────────────────────────────────────────────────
// GET /api/public/track/:awb
router.get('/track/:awb', async (req, res) => {
  const awb = req.params.awb?.trim().toUpperCase();
  if (!awb || awb.length < 4) {
    return res.status(400).json({ success: false, message: 'Invalid AWB number.' });
  }

  try {
    // Step 1: Check our own database first
    const inHouse = await trackInHouse(awb);
    if (inHouse) {
      const detection = detectCourier(awb);
      const courierInfo = getCourierInfo(detection?.courier || inHouse.courier?.toUpperCase());
      return res.json({
        success: true,
        data: {
          awb:         inHouse.awb,
          status:      inHouse.status,
          consignee:   inHouse.consignee,
          destination: inHouse.destination,
          courier:     inHouse.courier,
          date:        inHouse.date,
          weight:      inHouse.weight,
          amount:      inHouse.amount,
          courierInfo,
          detectedCourier: detection?.courier,
          trackingEvents:  inHouse.trackingEvents || [],
          source:          'internal',
        }
      });
    }

    // Step 2: Detect courier from AWB format
    const detection = detectCourier(awb);
    if (!detection || detection.courier === 'UNKNOWN') {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found. Please check the AWB number.',
        detectedCourier: null,
      });
    }

    // Step 3: Try courier API(s)
    let result = null;
    if (detection.tryBoth) {
      // Ambiguous — try Primetrack first, then Trackon
      result = await trackPrimetrack(awb) || await trackTrackon(awb);
    } else {
      result = await trackWithCourier(detection.courier, awb);
    }

    const courierInfo = getCourierInfo(detection.courier);

    // Step 4: If no API key yet, return detection + fallback message
    if (!result) {
      return res.json({
        success: true,
        data: {
          awb,
          status:          'Check Courier Website',
          consignee:       '',
          destination:     '',
          courier:         courierInfo.name,
          courierInfo,
          detectedCourier: detection.courier,
          trackingEvents:  [],
          source:          'detected',
          noApiKey:        true,
          externalUrl:     courierInfo.trackUrl ? courierInfo.trackUrl + awb : null,
        }
      });
    }

    // Step 5: Return live courier data
    return res.json({
      success: true,
      data: {
        awb,
        status:          result.status,
        consignee:       result.consignee,
        destination:     result.destination,
        courier:         courierInfo.name,
        courierInfo,
        detectedCourier: detection.courier,
        trackingEvents:  result.events || [],
        source:          'courier_api',
      }
    });

  } catch (err) {
    logger.error('Public tracking error', { awb, error: err.message });
    return res.status(500).json({ success: false, message: 'Tracking service unavailable. Please try again.' });
  }
});

// ── AWB detection endpoint (frontend can call this) ─────────────────────────
// GET /api/public/detect/:awb
router.get('/detect/:awb', (req, res) => {
  const awb = req.params.awb?.trim().toUpperCase();
  const detection = detectCourier(awb);
  const info = detection ? getCourierInfo(detection.courier) : null;
  res.json({ success: true, data: { ...detection, courierInfo: info } });
});

module.exports = router;