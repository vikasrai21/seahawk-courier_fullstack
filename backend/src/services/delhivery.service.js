/* ============================================================
   delhivery.service.js — Delhivery Live API Integration
   
   Env vars needed (set in Railway dashboard):
     DELHIVERY_API_KEY     - token from app.delhivery.com
     DELHIVERY_API_URL     - https://track.delhivery.com
     DELHIVERY_WAREHOUSE   - your warehouse name (e.g. Primary)
   
   How to get key:
   1. Register at app.delhivery.com as courier partner
   2. Settings → Developer → API Access → Generate Token
   ============================================================ */
'use strict';

const logger = require('../utils/logger');

const BASE_URL  = process.env.DELHIVERY_API_URL || 'https://track.delhivery.com';
const API_KEY   = process.env.DELHIVERY_API_KEY;
const WAREHOUSE = process.env.DELHIVERY_WAREHOUSE || 'Primary';

const SELLER = {
  name:    process.env.DELHIVERY_SELLER_NAME    || 'Sea Hawk Courier & Cargo',
  address: process.env.DELHIVERY_SELLER_ADDRESS || 'Shop 6 & 7, Rao Lal Singh Market, Sector-18',
  city:    process.env.DELHIVERY_SELLER_CITY    || 'Gurugram',
  state:   process.env.DELHIVERY_SELLER_STATE   || 'Haryana',
  pin:     process.env.DELHIVERY_SELLER_PIN     || '122015',
};

function isConfigured() { return !!API_KEY; }

function authHeaders() {
  return { 'Authorization': `Token ${API_KEY}`, 'Content-Type': 'application/json' };
}

/* ── 1. LIVE TRACKING ──────────────────────────────────────── */
async function getTracking(awb) {
  if (!isConfigured()) {
    logger.warn('[Delhivery] API key not set');
    return null;
  }
  try {
    const res = await fetch(
      `${BASE_URL}/api/v1/packages/json/?waybill=${awb}`,
      { headers: authHeaders(), signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) { logger.warn(`[Delhivery] track ${res.status}`); return null; }
    const data = await res.json();
    const s    = data?.ShipmentData?.[0]?.Shipment;
    if (!s) return null;

    const events = (s.Scans || []).map(scan => ({
      status:      scan.ScanDetail?.Scan        || scan.ScanDetail?.Instructions || 'Update',
      location:    scan.ScanDetail?.ScannedLocation || '',
      description: scan.ScanDetail?.Instructions   || '',
      timestamp:   scan.ScanDetail?.ScanDateTime
                   ? new Date(scan.ScanDetail.ScanDateTime) : new Date(),
      source: 'API',
    }));

    return {
      awb,
      courier:      'Delhivery',
      status:       mapStatus(s.Status?.Status || ''),
      rawStatus:    s.Status?.Status || '',
      statusDetail: s.Status?.Instructions || '',
      origin:       s.Origin       || '',
      destination:  s.Destination  || '',
      expectedDate: s.ExpectedDeliveryDate || null,
      deliveredAt:  s.Delivered    || null,
      recipient:    s.RecipientName || '',
      events,
    };
  } catch (err) {
    logger.error(`[Delhivery] getTracking: ${err.message}`);
    return null;
  }
}

/* ── 2. CREATE SHIPMENT + GET AWB ──────────────────────────── */
async function createShipment({
  consignee, deliveryAddress, deliveryCity, deliveryState,
  deliveryCountry = 'India', deliveryPin, phone,
  weightGrams, length = 10, width = 10, height = 10,
  declaredValue = 0, contents = 'Goods', orderRef, codAmount = 0,
}) {
  if (!isConfigured()) throw new Error('DELHIVERY_API_KEY not set in environment variables');

  const body = new URLSearchParams({
    format: 'json',
    data: JSON.stringify({
      shipments: [{
        name:             consignee,
        add:              deliveryAddress,
        city:             deliveryCity,
        state:            deliveryState,
        country:          deliveryCountry,
        pin:              String(deliveryPin),
        phone:            String(phone || '9999999999'),
        order:            orderRef || `SHK-${Date.now()}`,
        payment_mode:     codAmount > 0 ? 'COD' : 'Pre-paid',
        cod_amount:       String(codAmount),
        weight:           (weightGrams / 1000).toFixed(3),
        shipment_length:  length,
        shipment_width:   width,
        shipment_height:  height,
        seller_name:      SELLER.name,
        seller_add:       SELLER.address,
        seller_city:      SELLER.city,
        seller_state:     SELLER.state,
        seller_pin:       SELLER.pin,
        products_desc:    contents,
        invoice_value:    String(declaredValue || 0),
        waybill:          '',
        cod_charges:      '0',
        gift_wrap:        false,
      }],
      pickup_location: { name: WAREHOUSE },
    }),
  });

  const res = await fetch(`${BASE_URL}/api/cmu/create.json`, {
    method: 'POST',
    headers: { 'Authorization': `Token ${API_KEY}` },
    body,
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`Delhivery booking failed (${res.status}): ${await res.text()}`);

  const data = await res.json();
  const pkg  = data?.packages?.[0];
  if (!pkg?.waybill) throw new Error(pkg?.remarks || 'Delhivery did not return AWB');

  return {
    awb:      pkg.waybill,
    courier:  'Delhivery',
    status:   'Booked',
    labelUrl: `${BASE_URL}/api/p/packing_slip?wbns=${pkg.waybill}&pdf=true`,
    raw:      data,
  };
}

/* ── 3. DOWNLOAD LABEL PDF ─────────────────────────────────── */
async function getLabel(awb) {
  if (!isConfigured()) throw new Error('DELHIVERY_API_KEY not set');
  const res = await fetch(
    `${BASE_URL}/api/p/packing_slip?wbns=${awb}&pdf=true`,
    { headers: authHeaders(), signal: AbortSignal.timeout(15000) }
  );
  if (!res.ok) throw new Error(`Delhivery label error (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

/* ── 4. CANCEL SHIPMENT ────────────────────────────────────── */
async function cancelShipment(awb) {
  if (!isConfigured()) throw new Error('DELHIVERY_API_KEY not set');
  const res = await fetch(`${BASE_URL}/api/p/edit`, {
    method: 'POST', headers: authHeaders(),
    body: JSON.stringify({ waybill: awb, cancellation: true }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Cancel failed: ${await res.text()}`);
  return res.json();
}

/* ── 5. PIN SERVICEABILITY ─────────────────────────────────── */
async function checkServiceability(pin) {
  if (!isConfigured()) return { serviceable: true, note: 'API key not set' };
  try {
    const res = await fetch(
      `${BASE_URL}/c/api/pin-codes/json/?filter_codes=${pin}`,
      { headers: authHeaders(), signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return { serviceable: true };
    const data = await res.json();
    const info = data?.delivery_codes?.[0]?.postal_code;
    return {
      serviceable: !!info,
      zone:        info?.pre_paid   || '',
      cod:         info?.cash_on_delivery === 'Y',
      pickup:      info?.pickup === 'Y',
    };
  } catch { return { serviceable: true }; }
}

/* ── Status mapper ─────────────────────────────────────────── */
function mapStatus(raw) {
  const s = (raw || '').toUpperCase();
  if (/DELIVERED|DLVD|\bDL\b/.test(s)) return 'Delivered';
  if (/OUT.FOR|OFD/.test(s))            return 'OutForDelivery';
  if (/TRANSIT|DISPATCH|REACHED/.test(s)) return 'InTransit';
  if (/PICKED|MANIFEST|PKD/.test(s))    return 'InTransit';
  if (/RTO|RETURN/.test(s))             return 'RTO';
  if (/FAILED|CANCEL/.test(s))          return 'Delayed';
  return 'Booked';
}

module.exports = { isConfigured, getTracking, createShipment, getLabel, cancelShipment, checkServiceability, mapStatus };
