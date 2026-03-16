/* ============================================================
   notification.service.js — Feature #7: Notifications
   
   Channels: WhatsApp (via Twilio / wati.io), SMS (Fast2SMS),
             Email (nodemailer / SendGrid)
   
   Usage:
     await notify.shipmentBooked(shipment, client);
     await notify.outForDelivery(shipment);
     await notify.delivered(shipment);
   ============================================================ */

'use strict';

const prisma  = require('../config/prisma');
const logger  = require('../utils/logger');

/* ── Template definitions ── */
const TEMPLATES = {
  SHIPMENT_BOOKED: (s, company) => ({
    subject: `Shipment Booked — AWB ${s.awb}`,
    body: `Dear ${s.consignee || 'Customer'},\n\nYour shipment has been booked by ${company || 'Sea Hawk Courier'}.\n\n📦 AWB Number: ${s.awb}\n🚚 Courier: ${s.courier || 'To be assigned'}\n📍 Destination: ${s.destination}\n\nTrack your shipment: https://seahawkcourier.in/track.html?awb=${s.awb}\n\nFor any queries, WhatsApp us: +91 99115 65523\n\nThank you!\nSea Hawk Courier & Cargo`,
    whatsapp: `🦅 *Sea Hawk Courier*\n\n📦 Shipment Booked!\n*AWB:* ${s.awb}\n*Courier:* ${s.courier || 'TBD'}\n*To:* ${s.destination}\n\n🔗 Track: https://seahawkcourier.in/track.html?awb=${s.awb}\n\nQueries? Reply here 📞`,
    sms: `Sea Hawk: Shipment booked. AWB: ${s.awb}. Track: seahawkcourier.in/track.html?awb=${s.awb}`,
  }),

  PICKED_UP: (s) => ({
    subject: `Shipment Picked Up — ${s.awb}`,
    body:    `AWB ${s.awb} has been picked up and is on its way to ${s.destination}.`,
    whatsapp: `🦅 *Sea Hawk Courier*\n\n✅ Shipment Picked Up\n*AWB:* ${s.awb}\n*To:* ${s.destination}\n\nWe'll notify you when it's out for delivery.`,
    sms:     `Sea Hawk: AWB ${s.awb} picked up. En route to ${s.destination}.`,
  }),

  IN_TRANSIT: (s) => ({
    subject: `Shipment In Transit — ${s.awb}`,
    body:    `AWB ${s.awb} is in transit to ${s.destination}.`,
    whatsapp: `🦅 *Sea Hawk Courier*\n\n✈️ In Transit\n*AWB:* ${s.awb}\n*To:* ${s.destination}`,
    sms:     `Sea Hawk: AWB ${s.awb} is in transit to ${s.destination}.`,
  }),

  OUT_FOR_DELIVERY: (s) => ({
    subject: `Out for Delivery — ${s.awb}`,
    body:    `AWB ${s.awb} is out for delivery to ${s.consignee || 'you'} at ${s.destination}. Expected today.`,
    whatsapp: `🦅 *Sea Hawk Courier*\n\n🛵 *Out for Delivery!*\n*AWB:* ${s.awb}\n*Consignee:* ${s.consignee}\n*Address:* ${s.destination}\n\nOur delivery agent will reach you shortly. Please be available.\n\nQueries? +91 99115 65523`,
    sms:     `Sea Hawk: AWB ${s.awb} out for delivery. Please be available. Queries: 9911565523`,
  }),

  DELIVERED: (s) => ({
    subject: `Delivered — ${s.awb}`,
    body:    `AWB ${s.awb} has been successfully delivered to ${s.consignee || 'the recipient'}.`,
    whatsapp: `🦅 *Sea Hawk Courier*\n\n✅ *Delivered Successfully!*\n*AWB:* ${s.awb}\n*Delivered to:* ${s.consignee}\n\nThank you for choosing Sea Hawk Courier. 🙏`,
    sms:     `Sea Hawk: AWB ${s.awb} delivered successfully. Thank you!`,
  }),

  NDR: (s, reason) => ({
    subject: `Delivery Attempted — ${s.awb}`,
    body:    `AWB ${s.awb} delivery was attempted but unsuccessful. Reason: ${reason}. We will reattempt delivery.`,
    whatsapp: `🦅 *Sea Hawk Courier*\n\n⚠️ *Delivery Attempted*\n*AWB:* ${s.awb}\n*Reason:* ${reason}\n\nWe will reattempt delivery. If address needs correction, please reply here or call +91 99115 65523`,
    sms:     `Sea Hawk: Delivery attempt for AWB ${s.awb} unsuccessful (${reason}). Will reattempt. Call 9911565523.`,
  }),

  PICKUP_CONFIRMED: (p) => ({
    subject: `Pickup Confirmed — ${p.requestNo}`,
    body:    `Your pickup request ${p.requestNo} is confirmed for ${p.scheduledDate} (${p.timeSlot}).`,
    whatsapp: `🦅 *Sea Hawk Courier*\n\n📦 *Pickup Confirmed!*\n*Ref:* ${p.requestNo}\n*Date:* ${p.scheduledDate}\n*Slot:* ${p.timeSlot}\n*Address:* ${p.pickupAddress}, ${p.pickupCity}\n\nOur agent will arrive during your selected time slot.`,
    sms:     `Sea Hawk: Pickup confirmed. Ref: ${p.requestNo}. Date: ${p.scheduledDate} (${p.timeSlot}). Addr: ${p.pickupCity}.`,
  }),

  PAYMENT_RECEIVED: (txn) => ({
    subject: `Payment Confirmed — ₹${txn.amount}`,
    body:    `Payment of ₹${txn.amount} received. New wallet balance: ₹${txn.balance}. Ref: ${txn.reference || txn.id}`,
    whatsapp: `🦅 *Sea Hawk Courier*\n\n💰 *Payment Received*\n*Amount:* ₹${txn.amount}\n*New Balance:* ₹${txn.balance}\n*Ref:* ${txn.reference || txn.id}\n\nThank you!`,
    sms:     `Sea Hawk: Payment ₹${txn.amount} received. Balance: ₹${txn.balance}.`,
  }),
};

/* ════════════════════════════════════════════════════════════
   SEND NOTIFICATION
   ════════════════════════════════════════════════════════════ */
async function send({ type, template, shipmentId, clientCode, data, channels = ['whatsapp', 'sms', 'email'] }) {
  const tmplFn = TEMPLATES[template];
  if (!tmplFn) { logger.warn(`Unknown template: ${template}`); return; }

  const content = tmplFn(...(Array.isArray(data) ? data : [data]));
  const results = [];

  for (const channel of channels) {
    const result = await _sendChannel(channel, type, template, content, shipmentId, clientCode);
    results.push(result);
  }

  return results;
}

async function _sendChannel(channel, type, template, content, shipmentId, clientCode) {
  let recipient = null, message = null;

  // Get recipient from DB
  if (shipmentId) {
    const s = await prisma.shipment.findUnique({
      where:   { id: shipmentId },
      include: { client: true },
    });
    if (channel === 'sms' || channel === 'whatsapp') recipient = s?.phone || s?.client?.whatsapp || s?.client?.phone;
    if (channel === 'email') recipient = s?.client?.email;
  } else if (clientCode) {
    const c = await prisma.client.findUnique({ where: { code: clientCode } });
    if (channel === 'sms' || channel === 'whatsapp') recipient = c?.whatsapp || c?.phone;
    if (channel === 'email') recipient = c?.email;
  }

  if (!recipient) {
    logger.debug(`No ${channel} recipient for template ${template}`);
    return { channel, status: 'SKIPPED', reason: 'No recipient' };
  }

  message = channel === 'email' ? content.body : channel === 'whatsapp' ? content.whatsapp : content.sms;

  // Log to DB
  const notifRecord = await prisma.notification.create({
    data: {
      type:       channel.toUpperCase(),
      template,
      recipient,
      message,
      status:     'PENDING',
      shipmentId,
      clientCode,
    },
  });

  try {
    let externalId = null;

    if (channel === 'whatsapp') externalId = await _sendWhatsApp(recipient, message);
    else if (channel === 'sms') externalId = await _sendSMS(recipient, content.sms);
    else if (channel === 'email') externalId = await _sendEmail(recipient, content.subject, content.body);

    await prisma.notification.update({
      where: { id: notifRecord.id },
      data:  { status: 'SENT', sentAt: new Date(), externalId },
    });

    return { channel, status: 'SENT', externalId };
  } catch (err) {
    logger.error(`Notification failed [${channel}] ${template}: ${err.message}`);
    await prisma.notification.update({
      where: { id: notifRecord.id },
      data:  { status: 'FAILED', error: err.message },
    });
    return { channel, status: 'FAILED', error: err.message };
  }
}

/* ════════════════════════════════════════════════════════════
   CHANNEL IMPLEMENTATIONS
   ════════════════════════════════════════════════════════════ */

/* WhatsApp via Twilio or WATI */
async function _sendWhatsApp(to, message) {
  const twilio = process.env.TWILIO_ACCOUNT_SID;
  const wati   = process.env.WATI_API_TOKEN;

  // Clean phone number
  const phone = to.replace(/\D/g,'').replace(/^0+/, '');
  const e164  = phone.startsWith('91') ? `+${phone}` : `+91${phone}`;

  if (twilio) {
    // Twilio WhatsApp Business
    const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const msg = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'}`,
      to:   `whatsapp:${e164}`,
      body: message,
    });
    return msg.sid;
  }

  if (wati) {
    // WATI (WhatsApp Business API)
    const { default: fetch } = await import('node-fetch');
    const res = await fetch(`${process.env.WATI_API_URL}/api/v1/sendSessionMessage/${phone}`, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${wati}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ messageText: message }),
    });
    const data = await res.json();
    return data?.id;
  }

  // Fallback: WA.me link logging (development mode)
  const waUrl = `https://wa.me/${e164.replace('+','')}?text=${encodeURIComponent(message)}`;
  logger.info(`[WhatsApp DEV] Would send to ${e164}. URL: ${waUrl.slice(0,80)}…`);
  return `dev_${Date.now()}`;
}

/* SMS via Fast2SMS */
async function _sendSMS(to, message) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    logger.info(`[SMS DEV] Would send to ${to}: ${message.slice(0,50)}…`);
    return `sms_dev_${Date.now()}`;
  }

  const phone = to.replace(/\D/g,'').replace(/^91/, '');
  const { default: fetch } = await import('node-fetch');
  const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method:  'POST',
    headers: { authorization: apiKey, 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      route:    'q',
      message,
      language: 'english',
      flash:    0,
      numbers:  phone,
    }),
  });
  const data = await res.json();
  if (!data.return) throw new Error(data.message || 'Fast2SMS failed');
  return data.request_id;
}

/* Email via nodemailer / SendGrid */
async function _sendEmail(to, subject, body) {
  const sgKey   = process.env.SENDGRID_API_KEY;
  const smtpHost = process.env.SMTP_HOST;

  if (!sgKey && !smtpHost) {
    logger.info(`[Email DEV] Would send to ${to}: ${subject}`);
    return `email_dev_${Date.now()}`;
  }

  if (sgKey) {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(sgKey);
    const [res] = await sgMail.send({
      to,
      from: process.env.SMTP_FROM || 'noreply@seahawkcourier.in',
      subject,
      text: body,
      html: body.replace(/\n/g,'<br/>'),
    });
    return res?.headers?.['x-message-id'] || 'sg_sent';
  }

  // SMTP fallback
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransporter({
    host: smtpHost,
    port: parseInt(process.env.SMTP_PORT) || 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const info = await transporter.sendMail({
    from:    process.env.SMTP_FROM || 'noreply@seahawkcourier.in',
    to,
    subject,
    text:    body,
    html:    body.replace(/\n/g,'<br/>'),
  });
  return info.messageId;
}

/* ════════════════════════════════════════════════════════════
   CONVENIENCE METHODS
   ════════════════════════════════════════════════════════════ */
async function shipmentBooked(shipment, client) {
  return send({
    type:       'OUTBOUND',
    template:   'SHIPMENT_BOOKED',
    shipmentId: shipment.id,
    clientCode: shipment.clientCode,
    data:       [shipment, client?.company || 'Sea Hawk Courier'],
    channels:   ['whatsapp', 'sms'],
  });
}

async function outForDelivery(shipment) {
  return send({
    type:       'OUTBOUND',
    template:   'OUT_FOR_DELIVERY',
    shipmentId: shipment.id,
    data:       [shipment],
    channels:   ['whatsapp', 'sms'],
  });
}

async function delivered(shipment) {
  return send({
    type:       'OUTBOUND',
    template:   'DELIVERED',
    shipmentId: shipment.id,
    data:       [shipment],
    channels:   ['whatsapp', 'sms', 'email'],
  });
}

async function ndrAlert(shipment, reason) {
  return send({
    type:       'OUTBOUND',
    template:   'NDR',
    shipmentId: shipment.id,
    data:       [shipment, reason],
    channels:   ['whatsapp', 'sms'],
  });
}

async function pickupConfirmed(pickup) {
  if (!pickup.contactPhone) return;
  return send({
    type:      'OUTBOUND',
    template:  'PICKUP_CONFIRMED',
    data:      [pickup],
    channels:  ['whatsapp', 'sms'],
  });
}

async function paymentReceived(txn, clientCode) {
  return send({
    type:       'OUTBOUND',
    template:   'PAYMENT_RECEIVED',
    clientCode,
    data:       [txn],
    channels:   ['whatsapp', 'email'],
  });
}

module.exports = {
  send,
  shipmentBooked,
  outForDelivery,
  delivered,
  ndrAlert,
  pickupConfirmed,
  paymentReceived,
};
