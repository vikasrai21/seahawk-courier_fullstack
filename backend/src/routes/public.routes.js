'use strict';
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const { detectCourier, getCourierInfo } = require('../utils/awbDetect');
const cache = require('../utils/cache');
const { fetchJsonWithRetry } = require('../utils/httpRetry');
const rateLimit = require('express-rate-limit');
const { publicTrackingLimiter } = require('../middleware/rateLimiter');

const publicLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60, message: { success: false, message: 'Too many requests.' } });
const bookingLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { success: false, message: 'Too many booking requests. Try again later.' } });

// ── GET /api/public/health ─────────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// ── POST /api/public/rum ──────────────────────────────────────────────────
// Lightweight Real User Monitoring intake for Web Vitals.
router.post('/rum', publicLimiter, (req, res) => {
  const metric = String(req.body?.metric || '').trim().toUpperCase();
  const value = Number(req.body?.value);
  const page = String(req.body?.page || '').slice(0, 200);
  const rating = String(req.body?.rating || '').trim().toLowerCase();

  if (!metric || !Number.isFinite(value)) {
    return res.status(400).json({ success: false, message: 'Invalid metric payload.' });
  }

  logger.info('[RUM]', {
    metric,
    value: Number(value.toFixed(2)),
    rating,
    page,
    userAgent: req.get('user-agent'),
  });

  return res.status(202).json({ success: true });
});

// ── In-house tracking ──────────────────────────────────────────────────────
async function trackInHouse(awb) {
  try {
    return await prisma.shipment.findFirst({
      where: { OR: [{ awb: { equals: awb, mode: 'insensitive' } }, { awb }] },
      select: { awb: true, status: true, consignee: true, destination: true, courier: true, date: true, weight: true, amount: true, trackingEvents: true },
    });
  } catch { return null; }
}

// ── Courier API stubs ──────────────────────────────────────────────────────
async function trackDTDC(awb) {
  const key = process.env.DTDC_API_KEY, customerCode = process.env.DTDC_CUSTOMER_CODE;
  if (!key || !customerCode) return null;
  try {
    const json = await fetchJsonWithRetry('https://blktracksvc.dtdc.com/dtdc-api/rest/JSONCnTrk/getShpCnTrk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'API_KEY': key },
      body: JSON.stringify({ custCode: customerCode, trackFor: awb }),
    }, { attempts: 3, timeoutMs: 8000 });
    if (!json || json.errorMessage) return null;
    const data = json.scans?.[0] || json;
    return { courier: 'DTDC', status: data.status || data.scanStatus || 'InTransit', consignee: data.consigneeName || '', destination: data.destination || '', events: (json.scans || []).map(s => ({ status: s.scanStatus || s.status, location: s.scanLocation || s.location, timestamp: s.scanDateTime || s.date, description: s.remarks || '' })) };
  } catch (e) { logger.warn('DTDC tracking failed', { awb, error: e.message }); return null; }
}

async function trackBluedart(awb) {
  const key = process.env.BLUEDART_LICENSE_KEY, loginId = process.env.BLUEDART_LOGIN_ID;
  if (!key || !loginId) return null;
  try {
    const json = await fetchJsonWithRetry('https://netconnect.bluedart.com/ver1.9/ShippingAPI/Track/ShipmentTracking.svc/json/GetShipmentDetails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handler: { AWBNo: awb, LicenceKey: key, LoginID: loginId } }),
    }, { attempts: 3, timeoutMs: 8000 });
    if (!json?.ShipmentData) return null;
    const d = json.ShipmentData;
    return { courier: 'BLUEDART', status: d.Status || 'InTransit', consignee: d.Consignee || '', destination: d.Destination || '', events: (d.Scans || []).map(s => ({ status: s.ScanDetail?.Scan, location: s.ScanDetail?.ScannedLocation, timestamp: s.ScanDetail?.ScanDate, description: s.ScanDetail?.Instructions })) };
  } catch (e) { logger.warn('Bluedart tracking failed', { awb, error: e.message }); return null; }
}

async function trackDelhivery(awb) {
  const key = process.env.DELHIVERY_API_KEY;
  if (!key) return null;
  try {
    const json = await fetchJsonWithRetry(`https://track.delhivery.com/api/v1/packages/json/?waybill=${awb}&verbose=1`, {
      headers: { Authorization: `Token ${key}` },
    }, { attempts: 3, timeoutMs: 8000 });
    const pkg = json?.ShipmentData?.[0]?.Shipment;
    if (!pkg) return null;
    return { courier: 'DELHIVERY', status: pkg.Status?.Status || 'InTransit', consignee: pkg.Consignee || '', destination: pkg.To || '', events: (pkg.Scans || []).map(s => ({ status: s.ScanDetail?.Scan, location: s.ScanDetail?.ScannedLocation, timestamp: s.ScanDetail?.ScanDate, description: s.ScanDetail?.Instructions })) };
  } catch (e) { logger.warn('Delhivery tracking failed', { awb, error: e.message }); return null; }
}

async function trackTrackon(awb) {
  const key = process.env.TRACKON_API_KEY;
  if (!key) return null;
  try {
    const json = await fetchJsonWithRetry(`https://trackonweb.com/track-api/?awb=${awb}&apikey=${key}`, {}, { attempts: 3, timeoutMs: 8000 });
    if (!json || json.error) return null;
    return { courier: 'TRACKON', status: json.status || 'InTransit', consignee: json.consignee || '', destination: json.destination || '', events: (json.events || json.scans || []).map(s => ({ status: s.status || s.scan, location: s.location || s.city, timestamp: s.time || s.date, description: s.remarks || '' })) };
  } catch (e) { logger.warn('Trackon tracking failed', { awb, error: e.message }); return null; }
}

async function trackPrimetrack(awb) {
  const key = process.env.PRIMETRACK_API_KEY;
  if (!key) return null;
  try {
    const json = await fetchJsonWithRetry(`https://www.primetrack.in/api/track?awb=${awb}&apikey=${key}`, {}, { attempts: 3, timeoutMs: 8000 });
    if (!json || json.error) return null;
    return { courier: 'PRIMETRACK', status: json.status || 'InTransit', consignee: json.consignee || '', destination: json.destination || '', events: (json.events || []).map(s => ({ status: s.status, location: s.location, timestamp: s.time, description: s.remarks || '' })) };
  } catch (e) { logger.warn('Primetrack tracking failed', { awb, error: e.message }); return null; }
}

async function trackDHL(awb) {
  const key = process.env.DHL_API_KEY;
  if (!key) return null;
  try {
    const json = await fetchJsonWithRetry(`https://api-eu.dhl.com/track/shipments?trackingNumber=${awb}`, {
      headers: { 'DHL-API-Key': key },
    }, { attempts: 3, timeoutMs: 8000 });
    const ship = json?.shipments?.[0];
    if (!ship) return null;
    return { courier: 'DHL', status: ship.status?.description || 'InTransit', consignee: ship.receiver?.name || '', destination: ship.destination?.address?.addressLocality || '', events: (ship.events || []).map(e => ({ status: e.description, location: e.location?.address?.addressLocality, timestamp: e.timestamp, description: '' })) };
  } catch (e) { logger.warn('DHL tracking failed', { awb, error: e.message }); return null; }
}

async function trackWithCourier(courier, awb) {
  switch (courier) {
    case 'DTDC': return trackDTDC(awb);
    case 'BLUEDART': return trackBluedart(awb);
    case 'DELHIVERY': return trackDelhivery(awb);
    case 'TRACKON': return trackTrackon(awb);
    case 'PRIMETRACK': return trackPrimetrack(awb);
    case 'DHL': return trackDHL(awb);
    default: return null;
  }
}

// ── GET /api/public/track/:awb ─────────────────────────────────────────────
router.get('/track/:awb', publicTrackingLimiter, async (req, res) => {
  const awb = req.params.awb?.trim().toUpperCase();
  if (!awb || awb.length < 4) return res.status(400).json({ success: false, message: 'Invalid AWB number.' });
  try {
    const cacheKey = `public:track:${awb}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached });

    const inHouse = await trackInHouse(awb);
    if (inHouse) {
      const detection = detectCourier(awb);
      const courierInfo = getCourierInfo(detection?.courier || inHouse.courier?.toUpperCase());
      const data = { ...inHouse, courierInfo, detectedCourier: detection?.courier, source: 'internal' };
      await cache.set(cacheKey, data, 300);
      return res.json({ success: true, data });
    }
    const detection = detectCourier(awb);
    if (!detection || detection.courier === 'UNKNOWN') return res.status(404).json({ success: false, message: 'Shipment not found. Please check the AWB number.' });
    const result = detection.tryBoth
      ? (await trackPrimetrack(awb) || await trackTrackon(awb))
      : await trackWithCourier(detection.courier, awb);
    const courierInfo = getCourierInfo(detection.courier);
    if (!result) {
      const data = { awb, status: 'Check Courier Website', consignee: '', destination: '', courier: courierInfo.name, courierInfo, detectedCourier: detection.courier, trackingEvents: [], source: 'detected', noApiKey: true, externalUrl: courierInfo.trackUrl ? courierInfo.trackUrl + awb : null };
      await cache.set(cacheKey, data, 300);
      return res.json({ success: true, data });
    }
    const data = { awb, status: result.status, consignee: result.consignee, destination: result.destination, courier: courierInfo.name, courierInfo, detectedCourier: detection.courier, trackingEvents: result.events || [], source: 'courier_api' };
    await cache.set(cacheKey, data, 300);
    return res.json({ success: true, data });
  } catch (err) {
    logger.error('Public tracking error', { awb, error: err.message });
    return res.status(500).json({ success: false, message: 'Tracking service unavailable.' });
  }
});

// ── GET /api/public/detect/:awb ────────────────────────────────────────────
router.get('/detect/:awb', (req, res) => {
  const awb = req.params.awb?.trim().toUpperCase();
  const detection = detectCourier(awb);
  const info = detection ? getCourierInfo(detection.courier) : null;
  res.json({ success: true, data: { ...detection, courierInfo: info } });
});

// ── POST /api/public/pickup-request ───────────────────────────────────────
router.post('/pickup-request', bookingLimiter, async (req, res) => {
  try {
    const { name, company, phone, email, pickupAddress, pickupCity, pickupPin, destination, destCity, destCountry, packageType, weight, pieces, service, declaredValue, preferredDate, preferredTime, notes } = req.body;

    if (!name || !phone || !pickupAddress || !pickupCity || !pickupPin || !destination || !preferredDate)
      return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });

    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(10000 + Math.random() * 90000);
    const requestNo = `PKR-${datePart}-${rand}`;

    const pickup = await prisma.pickupRequest.create({
      data: {
        requestNo,
        contactName: name.trim(),
        contactPhone: phone.trim(),
        contactEmail: email?.trim() || null,
        pickupAddress: pickupAddress.trim(),
        pickupCity: pickupCity.trim(),
        pickupPin: pickupPin.trim(),
        deliveryAddress: destination?.trim() || null,
        deliveryCity: destCity?.trim() || null,
        deliveryCountry: destCountry || 'India',
        packageType: packageType || 'Parcel',
        weightGrams: parseFloat(weight) || 0,
        pieces: parseInt(pieces) || 1,
        service: service || 'Standard',
        declaredValue: declaredValue ? parseFloat(declaredValue) : null,
        scheduledDate: preferredDate,
        timeSlot: preferredTime || 'Morning (9am–12pm)',
        notes: notes?.trim() || null,
        source: 'WEBSITE',
        status: 'PENDING',
      },
    });

    // WhatsApp message to admin
    const adminPhone = (process.env.ADMIN_WHATSAPP || '919911565523').replace(/\D/g, '');
    const waMsg = `🚨 *NEW PICKUP REQUEST* — Sea Hawk\n\n` +
      `📋 *Ref:* ${requestNo}\n` +
      `👤 *${name}*${company ? ` (${company})` : ''}\n` +
      `📞 ${phone}${email ? `  📧 ${email}` : ''}\n\n` +
      `📍 *PICKUP:*\n${pickupAddress}, ${pickupCity} — ${pickupPin}\n\n` +
      `🚚 *DELIVERY:*\n${destination}, ${destCity || ''} ${destCountry || 'India'}\n\n` +
      `📦 ${packageType} · ${weight}kg · ${pieces} pc · ${service}${declaredValue ? ` · ₹${declaredValue}` : ''}\n` +
      `📅 ${preferredDate} · ${preferredTime}` +
      `${notes ? `\n📝 ${notes}` : ''}`;

    const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(waMsg)}`;

    return res.json({
      success: true,
      data: { requestNo: pickup.requestNo, id: pickup.id, whatsappUrl, message: 'Pickup request submitted successfully!' }
    });
  } catch (err) {
    logger.error('Pickup request error', { error: err.message });
    return res.status(500).json({ success: false, message: 'Failed to submit pickup request. Please try again.' });
  }
});

// ── GET /api/public/pickup-request/:requestNo ──────────────────────────────
router.get('/pickup-request/:requestNo', publicLimiter, async (req, res) => {
  try {
    const pickup = await prisma.pickupRequest.findUnique({
      where: { requestNo: req.params.requestNo.toUpperCase() },
      select: { requestNo: true, contactName: true, pickupCity: true, deliveryCity: true, packageType: true, service: true, scheduledDate: true, timeSlot: true, status: true, createdAt: true },
    });
    if (!pickup) return res.status(404).json({ success: false, message: 'Booking not found.' });
    res.json({ success: true, data: pickup });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
});

module.exports = router;
