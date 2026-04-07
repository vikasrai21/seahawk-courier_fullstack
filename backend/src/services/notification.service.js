// src/services/notification.service.js — Email + WhatsApp notifications
'use strict';
const prisma  = require('../config/prisma');
const logger  = require('../utils/logger');
const config  = require('../config');
const appBaseUrl = String(config.app?.publicBaseUrl || '').replace(/\/+$/, '');
const supportPhone = config.app?.supportPhone || '+91 99115 65523';

const DEFAULT_PREFS = {
  whatsapp: {
    booked: false,
    inTransit: false,
    outForDelivery: true,
    delivered: true,
  },
  email: {
    booked: false,
    inTransit: false,
    outForDelivery: false,
    delivered: true,
    ndr: true,
    rto: true,
    pod: true,
  },
};

const MOVEMENT_STATUS_PREF_KEYS = {
  Booked: 'booked',
  InTransit: 'inTransit',
  OutForDelivery: 'outForDelivery',
  Delivered: 'delivered',
};

function buildMovementWhatsAppMessage(status, awb) {
  const trackUrl = `${appBaseUrl}/track/${encodeURIComponent(awb)}`;
  if (status === 'Booked') {
    return `📦 Your shipment (AWB: ${awb}) has been booked successfully with Sea Hawk Courier.\n\nTrack: ${trackUrl}\n\nFor support: ${supportPhone}`;
  }
  if (status === 'InTransit') {
    return `🚛 Your shipment (AWB: ${awb}) is now in transit.\n\nTrack live updates: ${trackUrl}\n\n— Sea Hawk Courier`;
  }
  if (status === 'OutForDelivery') {
    return `🚚 Your shipment (AWB: ${awb}) is out for delivery today. Please be available to receive it.\n\nTrack: ${trackUrl}\n\n— Sea Hawk Courier`;
  }
  return `✅ Your shipment (AWB: ${awb}) has been delivered successfully. Thank you for choosing Sea Hawk Courier!\n\nFor any queries call: ${supportPhone}`;
}

function buildMovementEmailPayload({ status, awb, consignee, company }) {
  const trackUrl = `${appBaseUrl}/track/${encodeURIComponent(awb)}`;
  if (status === 'Booked') {
    return {
      subject: `Shipment Booked — AWB ${awb}`,
      text: `Dear ${company},\n\nShipment AWB ${awb} (${consignee || 'Consignee'}) has been booked successfully.\nTrack: ${trackUrl}\n\n— Sea Hawk Courier`,
      html: `<p>Dear <strong>${company}</strong>,</p><p>Shipment AWB <strong>${awb}</strong>${consignee ? ` for <strong>${consignee}</strong>` : ''} has been booked successfully.</p><p><a href="${trackUrl}">Track shipment</a></p><p>— Sea Hawk Courier</p>`,
    };
  }
  if (status === 'InTransit') {
    return {
      subject: `Shipment In Transit — AWB ${awb}`,
      text: `Dear ${company},\n\nShipment AWB ${awb} (${consignee || 'Consignee'}) is now in transit.\nTrack: ${trackUrl}\n\n— Sea Hawk Courier`,
      html: `<p>Dear <strong>${company}</strong>,</p><p>Shipment AWB <strong>${awb}</strong>${consignee ? ` for <strong>${consignee}</strong>` : ''} is now in transit.</p><p><a href="${trackUrl}">Track shipment</a></p><p>— Sea Hawk Courier</p>`,
    };
  }
  if (status === 'OutForDelivery') {
    return {
      subject: `Out For Delivery — AWB ${awb}`,
      text: `Dear ${company},\n\nShipment AWB ${awb} (${consignee || 'Consignee'}) is out for delivery.\nTrack: ${trackUrl}\n\n— Sea Hawk Courier`,
      html: `<p>Dear <strong>${company}</strong>,</p><p>Shipment AWB <strong>${awb}</strong>${consignee ? ` for <strong>${consignee}</strong>` : ''} is out for delivery.</p><p><a href="${trackUrl}">Track shipment</a></p><p>— Sea Hawk Courier</p>`,
    };
  }
  return {
    subject: `Delivered — AWB ${awb}`,
    text: `Dear ${company},\n\nShipment AWB ${awb} (${consignee || 'Consignee'}) has been delivered.\nTrack: ${trackUrl}\n\nFor support: ${supportPhone}\n\n— Sea Hawk Courier`,
    html: `<p>Dear <strong>${company}</strong>,</p><p>Shipment AWB <strong>${awb}</strong>${consignee ? ` for <strong>${consignee}</strong>` : ''} has been delivered.</p><p><a href="${trackUrl}">Track shipment history</a></p><p>For support: ${supportPhone}</p><p>— Sea Hawk Courier</p>`,
  };
}

async function getClientNotificationPreferences(clientCode) {
  if (!clientCode) return DEFAULT_PREFS;
  try {
    const latest = await prisma.auditLog.findFirst({
      where: {
        entity: 'NOTIFICATION_PREFS',
        entityId: String(clientCode).toUpperCase(),
      },
      orderBy: { createdAt: 'desc' },
      select: { newValue: true },
    });
    const prefs = latest?.newValue && typeof latest.newValue === 'object' ? latest.newValue : null;
    return {
      whatsapp: { ...DEFAULT_PREFS.whatsapp, ...(prefs?.whatsapp || {}) },
      email: { ...DEFAULT_PREFS.email, ...(prefs?.email || {}) },
    };
  } catch (err) {
    logger.warn(`Notification preferences fallback for ${clientCode}: ${err.message}`);
    return DEFAULT_PREFS;
  }
}

// ── Email via nodemailer ───────────────────────────────────────────────────
let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (!config.email.host || !config.email.user) return null;
  const nodemailer = require('nodemailer');
  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: { user: config.email.user, pass: config.email.pass },
  });
  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) { logger.warn('Email skipped — SMTP not configured'); return; }
  try {
    await t.sendMail({ from: config.email.from, to, subject, html, text });
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    logger.error('Email failed', { to, subject, error: err.message });
  }
}

// ── WhatsApp via Meta Cloud API ────────────────────────────────────────────
async function sendWhatsApp(phone, message) {
  if (!config.whatsapp.token || !config.whatsapp.phoneId) {
    logger.warn('WhatsApp skipped — WHATSAPP_TOKEN or WHATSAPP_PHONE_ID not configured');
    return;
  }
  const cleaned = phone.replace(/\D/g, '');
  const to = cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
  try {
    const axios = require('axios');
    await axios.post(
      `https://graph.facebook.com/v18.0/${config.whatsapp.phoneId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      },
      { headers: { Authorization: `Bearer ${config.whatsapp.token}`, 'Content-Type': 'application/json' } }
    );
    // Log to DB
    await prisma.notification.create({
      data: { channel: 'WHATSAPP', to, template: 'TEXT', message, status: 'SENT', provider: 'META', sentAt: new Date() },
    });
    logger.info(`WhatsApp sent to ${to}`);
  } catch (err) {
    logger.error('WhatsApp failed', { to, error: err.message });
    await prisma.notification.create({
      data: { channel: 'WHATSAPP', to, template: 'TEXT', message, status: 'FAILED', error: err.message },
    });
  }
}

// ── Shipment status change notifications ───────────────────────────────────
async function notifyStatusChange(shipment) {
  const { awb, status, consignee, phone, clientCode } = shipment;
  const prefs = await getClientNotificationPreferences(clientCode);
  const movementPrefKey = MOVEMENT_STATUS_PREF_KEYS[status];
  let client = null;
  const getClient = async () => {
    if (client !== null) return client;
    if (!clientCode) return null;
    client = await prisma.client.findUnique({
      where: { code: clientCode },
      select: { email: true, company: true },
    });
    return client;
  };

  if (movementPrefKey && phone && prefs.whatsapp?.[movementPrefKey]) {
    await sendWhatsApp(phone, buildMovementWhatsAppMessage(status, awb));
  }

  if (movementPrefKey && clientCode && prefs.email?.[movementPrefKey]) {
    const c = await getClient();
    if (c?.email) {
      const payload = buildMovementEmailPayload({
        status,
        awb,
        consignee,
        company: c.company || 'Customer',
      });
      await sendEmail({
        to: c.email,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      });
    }
  }

  // Notify RTO to client via email
  if (status === 'RTO' && clientCode && prefs.email?.rto) {
    const c = await getClient();
    if (c?.email) {
      await sendEmail({
        to: c.email,
        subject: `RTO Alert — AWB ${awb}`,
        text: `Dear ${c.company},\n\nShipment AWB ${awb} (${consignee}) has been marked as Return to Origin (RTO).\n\nPlease log in to your portal to take action.\n\n— Sea Hawk Courier`,
        html: `<p>Dear <strong>${c.company}</strong>,</p><p>Shipment AWB <strong>${awb}</strong> addressed to <strong>${consignee}</strong> has been marked as <strong>Return to Origin (RTO)</strong>.</p><p>Please <a href="${appBaseUrl}/portal">log in to your portal</a> to take action.</p><p>— Sea Hawk Courier</p>`,
      });
    }
  }

  // Notify on NDR
  if (status === 'NDR' && clientCode && prefs.email?.ndr) {
    const c = await getClient();
    if (c?.email) {
      await sendEmail({
        to: c.email,
        subject: `Delivery Attempt Failed — AWB ${awb}`,
        text: `Dear ${c.company},\n\nDelivery attempt for AWB ${awb} (${consignee}) has failed. Please update delivery instructions in your portal.\n\n— Sea Hawk Courier`,
        html: `<p>Dear <strong>${c.company}</strong>,</p><p>Delivery attempt for AWB <strong>${awb}</strong> addressed to <strong>${consignee}</strong> has failed.</p><p>Please <a href="${appBaseUrl}/portal">update delivery instructions</a>.</p><p>— Sea Hawk Courier</p>`,
      });
    }
  }
}

// ── POD email to client ────────────────────────────────────────────────────
async function sendPODEmail(shipment, pdfUrl) {
  if (!shipment.clientCode) return;
  const prefs = await getClientNotificationPreferences(shipment.clientCode);
  if (!prefs.email?.pod) return;
  const client = await prisma.client.findUnique({ where: { code: shipment.clientCode }, select: { email: true, company: true } });
  if (!client?.email) return;
  await sendEmail({
    to: client.email,
    subject: `Delivery Confirmation — AWB ${shipment.awb}`,
    html: `<p>Dear <strong>${client.company}</strong>,</p><p>Shipment AWB <strong>${shipment.awb}</strong> to <strong>${shipment.consignee}</strong> was delivered successfully.</p>${pdfUrl ? `<p><a href="${pdfUrl}">Download Proof of Delivery (PDF)</a></p>` : ''}<p>— Sea Hawk Courier</p>`,
    text: `AWB ${shipment.awb} delivered to ${shipment.consignee}. ${pdfUrl ? 'POD: ' + pdfUrl : ''}`,
  });
}

// ── Welcome email for new client portal user ──────────────────────────────
async function sendWelcomeEmail(user, _tempPassword) {
  if (!user.email) return;
  const loginUrl = `${appBaseUrl}/login`;
  await sendEmail({
    to: user.email,
    subject: 'Welcome to Sea Hawk Client Portal',
    html: `<p>Dear <strong>${user.name}</strong>,</p><p>Your client portal account has been created.</p><p>Login: <a href="${loginUrl}">${loginUrl}</a></p><p>Email: ${user.email}</p><p>Your temporary password has been shared by your account administrator via a secure channel.</p><p>Please change your password after first login.</p><p>— Sea Hawk Courier</p>`,
    text: `Welcome ${user.name}! Your portal login is ${user.email}. Your temporary password has been shared separately via a secure channel. Please change your password after first login.`,
  });
}

module.exports = {
  sendEmail,
  sendWhatsApp,
  notifyStatusChange,
  sendPODEmail,
  sendWelcomeEmail,
  getClientNotificationPreferences,
};
