// src/services/notification.service.js — Email + WhatsApp notifications
'use strict';
const prisma  = require('../config/prisma');
const logger  = require('../utils/logger');
const config  = require('../config');

const DEFAULT_PREFS = {
  whatsapp: { outForDelivery: true, delivered: true },
  email: { ndr: true, rto: true, pod: true },
};

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

  // Notify consignee via WhatsApp when out for delivery or delivered
  if (
    phone &&
    (
      (status === 'OutForDelivery' && prefs.whatsapp?.outForDelivery) ||
      (status === 'Delivered' && prefs.whatsapp?.delivered)
    )
  ) {
    let msg;
    if (status === 'OutForDelivery') {
      msg = `🚚 Your shipment (AWB: ${awb}) is out for delivery today. Please be available to receive it.\n\nTrack: https://seahawk-courierfullstack-production.up.railway.app/track/${awb}\n\n— Sea Hawk Courier`;
    } else {
      msg = `✅ Your shipment (AWB: ${awb}) has been delivered successfully. Thank you for choosing Sea Hawk Courier!\n\nFor any queries call: +91 99115 65523`;
    }
    await sendWhatsApp(phone, msg);
  }

  // Notify RTO to client via email
  if (status === 'RTO' && clientCode && prefs.email?.rto) {
    const client = await prisma.client.findUnique({ where: { code: clientCode }, select: { email: true, company: true } });
    if (client?.email) {
      await sendEmail({
        to: client.email,
        subject: `RTO Alert — AWB ${awb}`,
        text: `Dear ${client.company},\n\nShipment AWB ${awb} (${consignee}) has been marked as Return to Origin (RTO).\n\nPlease log in to your portal to take action.\n\n— Sea Hawk Courier`,
        html: `<p>Dear <strong>${client.company}</strong>,</p><p>Shipment AWB <strong>${awb}</strong> addressed to <strong>${consignee}</strong> has been marked as <strong>Return to Origin (RTO)</strong>.</p><p>Please <a href="https://seahawk-courierfullstack-production.up.railway.app/portal">log in to your portal</a> to take action.</p><p>— Sea Hawk Courier</p>`,
      });
    }
  }

  // Notify on NDR
  if (status === 'NDR' && clientCode && prefs.email?.ndr) {
    const client = await prisma.client.findUnique({ where: { code: clientCode }, select: { email: true, company: true } });
    if (client?.email) {
      await sendEmail({
        to: client.email,
        subject: `Delivery Attempt Failed — AWB ${awb}`,
        text: `Dear ${client.company},\n\nDelivery attempt for AWB ${awb} (${consignee}) has failed. Please update delivery instructions in your portal.\n\n— Sea Hawk Courier`,
        html: `<p>Dear <strong>${client.company}</strong>,</p><p>Delivery attempt for AWB <strong>${awb}</strong> addressed to <strong>${consignee}</strong> has failed.</p><p>Please <a href="https://seahawk-courierfullstack-production.up.railway.app/portal">update delivery instructions</a>.</p><p>— Sea Hawk Courier</p>`,
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
async function sendWelcomeEmail(user, tempPassword) {
  if (!user.email) return;
  await sendEmail({
    to: user.email,
    subject: 'Welcome to Sea Hawk Client Portal',
    html: `<p>Dear <strong>${user.name}</strong>,</p><p>Your client portal account has been created.</p><p>Login: <a href="https://seahawk-courierfullstack-production.up.railway.app/login">https://seahawk-courierfullstack-production.up.railway.app/login</a></p><p>Email: ${user.email}<br>Temporary password: <strong>${tempPassword}</strong></p><p>Please change your password after first login.</p><p>— Sea Hawk Courier</p>`,
    text: `Welcome ${user.name}! Your portal login: ${user.email} / ${tempPassword}. Change password after first login.`,
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
