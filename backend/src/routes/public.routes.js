'use strict';
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const crypto = require('crypto');
const { detectCourier, getCourierInfo } = require('../utils/awbDetect');
const cache = require('../utils/cache');
const { fetchJsonWithRetry } = require('../utils/httpRetry');
const rateLimit = require('express-rate-limit');
const { publicTrackingLimiter } = require('../middleware/rateLimiter');
const config = require('../config');
const shipmentSvc = require('../services/shipment.service');
const { importSchema } = require('../validators/shipment.validator');
const { auditLog } = require('../utils/audit');
const dtdcSvc = require('../services/dtdc.service');
const integrationIngestSvc = require('../services/integration-ingest.service');

const publicLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60, message: { success: false, message: 'Too many requests.' } });
const bookingLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { success: false, message: 'Too many booking requests. Try again later.' } });
const integrationLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 120, message: { success: false, message: 'Too many integration requests.' } });
const importJsonParser = express.json({ limit: config.bodyLimits.importJson });
const SUPPORTED_ECOM_PROVIDERS = integrationIngestSvc.SUPPORTED_ECOM_PROVIDERS;
const pick = (obj, ...keys) => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return null;
};

function enrichPublicEvent(rawEvent = {}, carrier, fallbackStatus = '') {
  const raw = rawEvent && typeof rawEvent === 'object' ? rawEvent : {};
  const statusText = String(raw.status || raw.description || fallbackStatus || '');
  const mergedText = `${raw.TRACKING_CODE || raw.strCode || ''} ${statusText} ${raw.sTrRemarks || raw.strRemarks || ''}`.toUpperCase();
  const attemptNoValue = Number(raw.ATTEMPT_NO || raw.ATTEMPTNO || raw.AttemptNo || raw.attemptNo || 0);
  const isException = /\bNDR\b|UNDELIVER|ATTEMPT|HELDUP|NOT\s+DELIVERED/.test(mergedText);
  const isDelivery = /\bDELIVER/.test(mergedText);
  return {
    ...raw,
    carrier,
    eventCode: pick(raw, 'eventCode', 'TRACKING_CODE', 'strCode'),
    eventType: isException ? 'EXCEPTION' : (isDelivery ? 'DELIVERY' : (/OUT\s+FOR|OFD/.test(mergedText) ? 'OFD' : 'MOVEMENT')),
    hubOrBranch: pick(raw, 'hubOrBranch', 'CURRENT_CITY', 'strOrigin', 'strDestination', 'location'),
    attemptNo: Number.isFinite(attemptNoValue) && attemptNoValue > 0 ? attemptNoValue : null,
    exceptionReason: isException ? pick(raw, 'exceptionReason', 'sTrRemarks', 'strRemarks', 'reason', 'description', 'CURRENT_STATUS') : null,
    recipientName: pick(raw, 'recipientName', 'RECEIVER_NAME', 'receiverName'),
    proofOfDelivery: Boolean(raw?.proofOfDelivery || raw?.POD_URL || raw?.podImageUrl || raw?.POD_SIGNATURE || raw?.podSignature),
  };
}

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
  if (!dtdcSvc.isConfigured()) return null;
  try {
    const data = await dtdcSvc.getTracking(awb);
    if (!data) return null;
    return {
      courier: 'DTDC',
      status: data.status || 'InTransit',
      consignee: data.recipient || '',
      destination: data.destination || '',
      events: (data.events || []).map((event) => ({
        status: event.status,
        location: event.location,
        timestamp: event.timestamp,
        description: event.description || '',
        rawData: enrichPublicEvent(event.rawData || event, 'DTDC', event.status),
      })),
    };
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
  const appKey = process.env.TRACKON_APP_KEY || process.env.TRACKON_API_KEY;
  const userId = process.env.TRACKON_USER_ID || process.env.TRACKON_CUSTOMER_ID || process.env.TRACKON_CLIENT_ID;
  const password = process.env.TRACKON_PASSWORD;
  const baseUrl = process.env.TRACKON_TRACKING_API_URL || process.env.TRACKON_API_URL || 'https://api.trackon.in';
  if (!appKey || !userId || !password) return null;
  try {
    const query = new URLSearchParams({
      AWBNo: String(awb || ''),
      AppKey: String(appKey),
      userID: String(userId),
      Password: String(password),
    });
    const json = await fetchJsonWithRetry(`${baseUrl}/CrmApi/t1/AWBTrackingCustomer?${query.toString()}`, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    }, { attempts: 3, timeoutMs: 8000 });
    if (!json || json.ResponseStatus?.Message === 'FAILED') return null;

    const summary = json.summaryTrack || {};
    const events = Array.isArray(json.lstDetails)
      ? json.lstDetails.map(s => ({
          status: s.CURRENT_STATUS || '',
          location: s.CURRENT_CITY || '',
          timestamp: `${s.EVENTDATE || ''} ${s.EVENTTIME || ''}`.trim(),
          description: s.TRACKING_CODE || '',
          rawData: enrichPublicEvent(s, 'Trackon', s.CURRENT_STATUS || ''),
        }))
      : [];

    return {
      courier: 'TRACKON',
      status: summary.CURRENT_STATUS || events[0]?.status || 'InTransit',
      consignee: '',
      destination: summary.DESTINATION || '',
      events,
    };
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

// ── POST /api/public/integrations/excel/import ────────────────────────────
// API-key protected endpoint for Power Automate / Apps Script sync jobs.
router.post('/integrations/excel/import', integrationLimiter, importJsonParser, async (req, res) => {
  const configuredKey = String(config.integrations?.syncApiKey || '').trim();
  if (!configuredKey) {
    return res.status(503).json({
      success: false,
      message: 'Integration key is not configured on server. Set INTEGRATION_SYNC_API_KEY.',
    });
  }

  const provided = String(
    req.get('x-sync-key')
    || req.get('x-api-key')
    || req.query.key
    || ''
  ).trim();

  const isValid = provided.length === configuredKey.length
    && crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(configuredKey));

  if (!isValid) {
    return res.status(401).json({ success: false, message: 'Invalid integration key.' });
  }

  const parsed = importSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid shipment payload.',
      errors: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  try {
    const result = await shipmentSvc.bulkImport(parsed.data.shipments, null);
    await auditLog({
      userId: null,
      userEmail: 'integration@system',
      action: 'INTEGRATION_IMPORT',
      entity: 'SHIPMENT',
      newValue: {
        importedRows: result.imported,
        operationalCreated: result.operationalCreated,
        duplicateAwbs: result.duplicates,
        batchKey: result.batchKey,
      },
      ip: req.ip,
    });

    return res.json({
      success: true,
      message: `Imported ${result.imported} rows`,
      data: result,
    });
  } catch (err) {
    logger.error('Integration import failed', { error: err.message, ip: req.ip });
    return res.status(500).json({ success: false, message: 'Integration import failed.' });
  }
});

// ── POST /api/public/integrations/ecommerce/:provider/:clientCode ──────────
// Marketplace / OMS webhook ingestion to Draft Queue.
router.post('/integrations/ecommerce/:provider/:clientCode', integrationLimiter, importJsonParser, async (req, res) => {
  const provider = String(req.params.provider || '').trim().toLowerCase();
  const clientCode = String(req.params.clientCode || '').trim().toUpperCase();
  if (!SUPPORTED_ECOM_PROVIDERS.includes(provider)) {
    return res.status(400).json({ success: false, message: 'Unsupported provider.' });
  }
  if (!clientCode) return res.status(400).json({ success: false, message: 'clientCode is required in URL.' });

  const providedKey = String(req.get('x-api-key') || req.query?.key || '').trim();
  if (!providedKey) return res.status(401).json({ success: false, message: 'x-api-key required.' });
  req.environment = providedKey.startsWith('sk_test_') ? 'sandbox' : 'production';
  req.useMockCouriers = req.environment === 'sandbox';
  logger.info(`[ENV] ${req.environment} route hit`, {
    path: req.originalUrl,
    method: req.method,
    provider,
    clientCode,
  });
  const providedHash = crypto.createHash('sha256').update(providedKey).digest('hex');

  const [client, apiKey] = await Promise.all([
    prisma.client.findUnique({
      where: { code: clientCode },
      select: { code: true, brandSettings: true },
    }),
    prisma.clientApiKey.findFirst({
      where: {
        clientCode,
        tokenHash: providedHash,
        active: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      select: { id: true, name: true },
    }),
  ]);
  if (!client) return res.status(404).json({ success: false, message: 'Client not found.' });
  if (!apiKey) return res.status(401).json({ success: false, message: 'Invalid API key.' });

  const keyPolicy = integrationIngestSvc.getKeyPolicy(client?.brandSettings, apiKey.id);
  if (!integrationIngestSvc.hasScope(keyPolicy, 'orders:create')) {
    return res.status(403).json({ success: false, message: 'API key scope does not allow order creation.', code: 'MISSING_SCOPE' });
  }

  const policyMode = String(keyPolicy?.mode || '').trim().toLowerCase();
  const mode = policyMode === 'sandbox' || providedKey.startsWith('sk_test_') ? 'sandbox' : 'live';
  req.environment = mode === 'sandbox' ? 'sandbox' : 'production';
  req.useMockCouriers = mode === 'sandbox';
  const body = req.body || {};
  const requestId = req.requestId || null;
  const explicitIdempotencyKey = String(req.get('idempotency-key') || req.get('x-idempotency-key') || '').trim() || null;

  if (mode === 'sandbox') {
    const previewRef = String(
      body?.order_number || body?.id || body?.number || body?.order_key || `sandbox-${Date.now()}`
    ).trim();
    await prisma.auditLog.create({
      data: {
        action: 'INTEGRATION_SANDBOX_ACCEPTED',
        entity: 'INTEGRATION_WEBHOOK',
        entityId: `${clientCode}:${provider}:${previewRef}`,
        newValue: {
          provider,
          mode: 'sandbox',
          apiKeyName: apiKey.name,
          requestId,
        },
        ip: req.ip,
      },
    });
    return res.status(202).json({
      success: true,
      message: 'Sandbox event accepted (no draft created).',
      data: {
        provider,
        mode: 'sandbox',
        requestId,
        accepted: true,
        previewReferenceId: previewRef,
      },
    });
  }

  try {
    const result = await integrationIngestSvc.ingestOrder({
      provider,
      clientCode,
      body,
      client,
      apiKey,
      explicitIdempotencyKey,
      ip: req.ip,
      requestId,
    });

    if (result.duplicate) {
      return res.status(result.idempotencyReplay ? 200 : 200).json({
        success: true,
        message: result.idempotencyReplay ? 'Idempotent replay ignored.' : 'Duplicate order ignored.',
        data: {
          duplicate: true,
          draftId: result.draftId,
          provider,
          requestId,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Draft order created from ecommerce webhook.',
      data: {
        draftId: result.draftId,
        referenceId: result.referenceId,
        provider,
        mode: 'live',
        requestId,
      },
    });
  } catch (err) {
    await integrationIngestSvc.queueDeadLetter({
      provider,
      clientCode,
      body,
      reason: err.message || 'integration-failure',
      requestId,
      ip: req.ip,
    }).catch(() => {});

    await prisma.auditLog.create({
      data: {
        action: 'INTEGRATION_DRAFT_FAILED',
        entity: 'INTEGRATION_WEBHOOK',
        entityId: `${clientCode}:${provider}:unknown`,
        newValue: {
          provider,
          requestId,
          reason: err.code || 'INTEGRATION_FAILED',
          message: err.message || 'Integration processing failed',
        },
        ip: req.ip,
      },
    }).catch(() => {});

    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Failed to process ecommerce webhook.',
      code: err.code || 'INTEGRATION_FAILED',
      incidentId: requestId,
    });
  }
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
    const adminPhone = String(config.app?.adminWhatsapp || '').replace(/\D/g, '');
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
