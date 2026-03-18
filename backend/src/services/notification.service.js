'use strict';
// src/services/notification.service.js — Phase 2: Unified notification service
// Channels: WhatsApp (MSG91), SMS (MSG91), Email (Nodemailer)
// Gracefully skips if API keys not configured

const logger = require('../utils/logger');

// ── Tracking URL ────────────────────────────────────────────────────────────
const TRACK_URL = (awb) => `${process.env.PUBLIC_URL || 'https://seahawkcourier.in'}/track/${awb}`;

// ── Templates ───────────────────────────────────────────────────────────────
const templates = {
  booked: (s, company) => ({
    whatsapp: `🦅 *Sea Hawk Courier*\n\n📦 *Shipment Booked!*\n*AWB:* ${s.awb}\n*Courier:* ${s.courier || 'To be assigned'}\n*To:* ${s.destination}\n\n🔗 Track: ${TRACK_URL(s.awb)}\n\nQueries? +91 99115 65523`,
    sms:      `Sea Hawk: Shipment booked. AWB: ${s.awb}. Track: ${TRACK_URL(s.awb)}`,
    email: {
      subject: `Shipment Booked — AWB ${s.awb}`,
      html:    `<p>Your shipment <strong>${s.awb}</strong> has been booked via Sea Hawk Courier.</p><p>Destination: ${s.destination}</p><p><a href="${TRACK_URL(s.awb)}">Track your shipment</a></p>`,
    },
  }),

  'Picked Up': (s) => ({
    whatsapp: `🦅 *Sea Hawk Courier*\n\n✅ *Picked Up!*\n*AWB:* ${s.awb}\n*En route to:* ${s.destination}\n\nTrack: ${TRACK_URL(s.awb)}`,
    sms:      `Sea Hawk: AWB ${s.awb} picked up. En route to ${s.destination}.`,
    email:    { subject: `Picked Up — ${s.awb}`, html: `<p>AWB ${s.awb} has been picked up and is on its way to ${s.destination}.</p>` },
  }),

  'In Transit': (s) => ({
    whatsapp: `🦅 *Sea Hawk Courier*\n\n✈️ *In Transit*\n*AWB:* ${s.awb}\n*To:* ${s.destination}\n\nTrack: ${TRACK_URL(s.awb)}`,
    sms:      `Sea Hawk: AWB ${s.awb} in transit to ${s.destination}.`,
    email:    { subject: `In Transit — ${s.awb}`, html: `<p>AWB ${s.awb} is in transit to ${s.destination}.</p>` },
  }),

  'Out for Delivery': (s) => ({
    whatsapp: `🦅 *Sea Hawk Courier*\n\n🛵 *Out for Delivery!*\n*AWB:* ${s.awb}\n*Consignee:* ${s.consignee}\n*Address:* ${s.destination}\n\nPlease be available. Queries? +91 99115 65523`,
    sms:      `Sea Hawk: AWB ${s.awb} out for delivery. Please be available. 9911565523`,
    email:    { subject: `Out for Delivery — ${s.awb}`, html: `<p>AWB ${s.awb} is out for delivery to ${s.consignee} at ${s.destination}. Please be available.</p>` },
  }),

  'Delivered': (s) => ({
    whatsapp: `🦅 *Sea Hawk Courier*\n\n✅ *Delivered!*\n*AWB:* ${s.awb}\n*Delivered to:* ${s.consignee}\n\nThank you for choosing Sea Hawk Courier 🙏`,
    sms:      `Sea Hawk: AWB ${s.awb} delivered. Thank you!`,
    email:    { subject: `Delivered — ${s.awb}`, html: `<p>AWB ${s.awb} has been successfully delivered to ${s.consignee}. Thank you!</p>` },
  }),

  'Failed': (s) => ({
    whatsapp: `🦅 *Sea Hawk Courier*\n\n⚠️ *Delivery Attempted*\n*AWB:* ${s.awb}\n\nDelivery was unsuccessful. We will reattempt. For address correction call +91 99115 65523`,
    sms:      `Sea Hawk: Delivery attempt for AWB ${s.awb} unsuccessful. Will reattempt. Call 9911565523.`,
    email:    { subject: `Delivery Attempted — ${s.awb}`, html: `<p>Delivery attempt for AWB ${s.awb} was unsuccessful. We will reattempt delivery.</p>` },
  }),

  'RTO': (s) => ({
    whatsapp: `🦅 *Sea Hawk Courier*\n\n🔄 *Return Initiated*\n*AWB:* ${s.awb}\n\nShipment is being returned. Your wallet will be refunded. Queries? +91 99115 65523`,
    sms:      `Sea Hawk: AWB ${s.awb} RTO initiated. Wallet refund processed.`,
    email:    { subject: `RTO Initiated — ${s.awb}`, html: `<p>AWB ${s.awb} is being returned. Your wallet balance has been refunded.</p>` },
  }),
};

// ── Send WhatsApp via MSG91 ──────────────────────────────────────────────────
async function sendWhatsApp(phone, message) {
  if (!process.env.MSG91_AUTH_KEY || !phone) return false;
  try {
    const mobile = phone.replace(/\D/g, '');
    const to = mobile.startsWith('91') ? mobile : `91${mobile}`;
    const res = await fetch('https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', authkey: process.env.MSG91_AUTH_KEY },
      body: JSON.stringify({
        integrated_number: process.env.MSG91_WA_FROM || '919911565523',
        content_type: 'template',
        payload: {
          messaging_product: 'whatsapp',
          type:              'text',
          to,
          text: { body: message },
        },
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) { logger.warn(`[WhatsApp] Send failed: ${res.status}`); return false; }
    return true;
  } catch (e) { logger.warn(`[WhatsApp] Error: ${e.message}`); return false; }
}

// ── Send SMS via MSG91 ───────────────────────────────────────────────────────
async function sendSMS(phone, message) {
  if (!process.env.MSG91_AUTH_KEY || !phone) return false;
  try {
    const mobile = phone.replace(/\D/g, '');
    const to = mobile.startsWith('91') ? mobile : `91${mobile}`;
    const res = await fetch('https://api.msg91.com/api/v5/flow/', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', authkey: process.env.MSG91_AUTH_KEY },
      body: JSON.stringify({ template_id: process.env.MSG91_TEMPLATE_ID, short_url: '0', mobiles: to, message }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) { logger.warn(`[SMS] Send failed: ${res.status}`); return false; }
    return true;
  } catch (e) { logger.warn(`[SMS] Error: ${e.message}`); return false; }
}

// ── Send Email via Nodemailer ────────────────────────────────────────────────
async function sendEmail(to, subject, html) {
  if (!process.env.SMTP_HOST || !to) return false;
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from:    process.env.SMTP_FROM || 'Sea Hawk Courier <noreply@seahawkcourier.in>',
      to,
      subject,
      html,
    });
    return true;
  } catch (e) { logger.warn(`[Email] Send failed: ${e.message}`); return false; }
}

// ── Get phone from shipment + client ────────────────────────────────────────
function getPhone(shipment) {
  return shipment.phone || shipment.client?.phone || null;
}

// ── Public API ───────────────────────────────────────────────────────────────
async function shipmentBooked(shipment, companyName) {
  const t     = templates.booked(shipment, companyName);
  const phone = getPhone(shipment);
  await Promise.allSettled([
    sendWhatsApp(phone, t.whatsapp),
    sendSMS(phone, t.sms),
  ]);
  logger.info(`[Notify] Booking notifications sent for AWB ${shipment.awb}`);
}

async function statusChanged(shipment, newStatus) {
  const tmpl = templates[newStatus];
  if (!tmpl) return;
  const t     = tmpl(shipment);
  const phone = getPhone(shipment);
  await Promise.allSettled([
    sendWhatsApp(phone, t.whatsapp),
    sendSMS(phone, t.sms),
  ]);
  logger.info(`[Notify] ${newStatus} notifications sent for AWB ${shipment.awb}`);
}

module.exports = { shipmentBooked, statusChanged, sendWhatsApp, sendSMS, sendEmail };
