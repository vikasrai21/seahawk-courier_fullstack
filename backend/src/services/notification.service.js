// src/services/notification.service.js — Email + WhatsApp notifications
'use strict';
const prisma  = require('../config/prisma');
const logger  = require('../utils/logger');
const config  = require('../config');
const appBaseUrl = String(config.app?.publicBaseUrl || '').replace(/\/+$/, '');
const webhookDispatch = require('./webhook-dispatch.service');
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
  Delayed: 'delay',
};

function applySmsTemplate(template, params) {
  const source = String(template || '').trim();
  if (!source) return '';
  return source
    .replace(/\{\{awb\}\}/gi, String(params.awb || ''))
    .replace(/\{\{status\}\}/gi, String(params.status || ''))
    .replace(/\{\{trackUrl\}\}/gi, String(params.trackUrl || ''))
    .replace(/\{\{consignee\}\}/gi, String(params.consignee || ''))
    .replace(/\{\{brand\}\}/gi, String(params.brand || 'Sea Hawk Courier'));
}

function buildMovementWhatsAppMessage(status, awb, options = {}) {
  const trackUrl = `${appBaseUrl}/track/${encodeURIComponent(awb)}`;
  const templated = applySmsTemplate(options.smsTemplate, {
    awb,
    status,
    trackUrl,
    consignee: options.consignee || '',
    brand: options.brand || 'Sea Hawk Courier',
  });
  if (templated) return templated;
  if (status === 'Booked') {
    return `📦 Your shipment (AWB: ${awb}) has been booked successfully with Sea Hawk Courier.\n\nTrack: ${trackUrl}\n\nFor support: ${supportPhone}`;
  }
  if (status === 'InTransit') {
    return `🚛 Your shipment (AWB: ${awb}) is now in transit.\n\nTrack live updates: ${trackUrl}\n\n— Sea Hawk Courier`;
  }
  if (status === 'OutForDelivery') {
    return `🚚 Your shipment (AWB: ${awb}) is out for delivery today. Please be available to receive it.\n\nTrack: ${trackUrl}\n\n— Sea Hawk Courier`;
  }
  if (status === 'NDR' || status === 'Failed') {
    return `⚠️ Delivery needs attention for AWB ${awb}. Please share updated delivery instructions with Sea Hawk Courier.\n\nTrack: ${trackUrl}\n\nFor support: ${supportPhone}`;
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
  if (status === 'NDR' || status === 'Failed') {
    return {
      subject: `Delivery Attention Required — AWB ${awb}`,
      text: `Dear ${company},\n\nDelivery for AWB ${awb} (${consignee || 'Consignee'}) needs attention. Please share updated delivery instructions.\nTrack: ${trackUrl}\n\n— Sea Hawk Courier`,
      html: `<p>Dear <strong>${company}</strong>,</p><p>Delivery for AWB <strong>${awb}</strong>${consignee ? ` for <strong>${consignee}</strong>` : ''} needs attention.</p><p>Please share updated delivery instructions or contact support.</p><p><a href="${trackUrl}">Track shipment</a></p><p>— Sea Hawk Courier</p>`,
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
    const [latest, client] = await Promise.all([
      prisma.auditLog.findFirst({
        where: {
          entity: 'NOTIFICATION_PREFS',
          entityId: String(clientCode).toUpperCase(),
        },
        orderBy: { createdAt: 'desc' },
        select: { newValue: true },
      }),
      prisma.client.findUnique({
        where: { code: String(clientCode).toUpperCase() },
        select: { brandSettings: true, notificationConfig: true, email: true, whatsapp: true },
      }),
    ]);
    const center = client?.brandSettings?.notificationCenter && typeof client.brandSettings.notificationCenter === 'object'
      ? client.brandSettings.notificationCenter
      : {};
    const prefs = latest?.newValue && typeof latest.newValue === 'object' ? latest.newValue : null;
    const configPrefs = client?.notificationConfig && typeof client.notificationConfig === 'object'
      ? client.notificationConfig
      : {};
    const flatEvents = configPrefs.notifications || {};
    return {
      emailAddress: configPrefs.email || client?.email || '',
      whatsappNumber: configPrefs.whatsapp || client?.whatsapp || '',
      whatsapp: { ...DEFAULT_PREFS.whatsapp, booked: !!flatEvents.booked, outForDelivery: !!flatEvents.ofd, delivered: !!flatEvents.delivered, ndr: !!flatEvents.ndr, ...(center?.whatsapp || {}), ...(configPrefs.whatsappEvents || {}), ...(prefs?.whatsapp || {}) },
      email: { ...DEFAULT_PREFS.email, booked: !!flatEvents.booked, outForDelivery: !!flatEvents.ofd, delivered: !!flatEvents.delivered, ndr: !!flatEvents.ndr, ...(center?.email || {}), ...(configPrefs.emailEvents || {}), ...(prefs?.email || {}) },
      templates: {
        sms: { ...(center?.templates?.sms || {}) },
        email: { ...(center?.templates?.email || {}) },
        journeys: { ...(center?.templates?.journeys || {}) },
      },
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
  if (!t) { logger.warn('Email skipped — SMTP not configured'); return { skipped: true, error: 'SMTP not configured' }; }
  try {
    const result = await t.sendMail({ from: config.email.from, to, subject, html, text });
    logger.info(`Email sent to ${to}: ${subject}`);
    return { sent: true, messageId: result?.messageId };
  } catch (err) {
    logger.error('Email failed', { to, subject, error: err.message });
    return { sent: false, error: err.message };
  }
}

// ── WhatsApp via Meta Cloud API ────────────────────────────────────────────
async function sendWhatsApp(phone, message, options = {}) {
  if (!config.whatsapp.token || !config.whatsapp.phoneId) {
    logger.warn('WhatsApp skipped — WHATSAPP_TOKEN or WHATSAPP_PHONE_ID not configured');
    return { skipped: true, error: 'WhatsApp not configured' };
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
    if (options.log !== false) {
      await prisma.notification.create({
        data: { channel: 'WHATSAPP', to, template: 'TEXT', message, status: 'SENT', provider: 'META', sentAt: new Date() },
      });
    }
    logger.info(`WhatsApp sent to ${to}`);
    return { sent: true, to };
  } catch (err) {
    logger.error('WhatsApp failed', { to, error: err.message });
    if (options.log !== false) {
      await prisma.notification.create({
        data: { channel: 'WHATSAPP', to, template: 'TEXT', message, status: 'FAILED', error: err.message },
      });
    }
    return { sent: false, error: err.message, to };
  }
}

function eventFromStatus(status) {
  if (status === 'Booked') return 'booked';
  if (status === 'OutForDelivery') return 'ofd';
  if (status === 'Delivered') return 'delivered';
  if (status === 'NDR' || status === 'Failed') return 'ndr';
  return null;
}

async function notifyShipmentEvent(shipment, event = eventFromStatus(shipment?.status)) {
  if (!shipment || !event) return { skipped: true, reason: 'Unsupported event' };
  const client = shipment.client || await prisma.client.findUnique({
    where: { code: shipment.clientCode },
    select: { company: true, email: true, whatsapp: true, phone: true, notificationConfig: true, brandSettings: true },
  });
  if (!client) return { skipped: true, reason: 'Client not found' };

  const statusByEvent = { booked: 'Booked', ofd: 'OutForDelivery', delivered: 'Delivered', ndr: 'NDR' };
  const status = statusByEvent[event] || shipment.status;
  const prefs = await getClientNotificationPreferences(shipment.clientCode);
  const emailTo = prefs.emailAddress || client.email;
  const whatsappTo = prefs.whatsappNumber || client.whatsapp || client.phone || shipment.phone;
  const results = [];

  if (emailTo && prefs.email?.[event === 'ofd' ? 'outForDelivery' : event]) {
    const payload = buildMovementEmailPayload({ status, awb: shipment.awb, consignee: shipment.consignee, company: client.company || 'Customer' });
    const row = await prisma.notification.create({
      data: { clientCode: shipment.clientCode, awb: shipment.awb, channel: 'EMAIL', to: emailTo, template: event.toUpperCase(), message: payload.subject, status: 'QUEUED' },
    });
    const sent = await sendEmail({ to: emailTo, subject: payload.subject, text: payload.text, html: payload.html });
    await prisma.notification.update({
      where: { id: row.id },
      data: sent?.sent ? { status: 'SENT', sentAt: new Date(), providerRef: sent.messageId || null } : { status: 'FAILED', error: sent?.error || 'Email delivery skipped' },
    });
    results.push({ channel: 'EMAIL', ...sent });
  }

  if (whatsappTo && prefs.whatsapp?.[event === 'ofd' ? 'outForDelivery' : event]) {
    const message = buildMovementWhatsAppMessage(status, shipment.awb, { consignee: shipment.consignee, brand: client.company || 'Sea Hawk Courier' });
    const row = await prisma.notification.create({
      data: { clientCode: shipment.clientCode, awb: shipment.awb, channel: 'WHATSAPP', to: whatsappTo, template: event.toUpperCase(), message, status: 'QUEUED' },
    });
    const sent = await sendWhatsApp(whatsappTo, message, { log: false });
    await prisma.notification.update({
      where: { id: row.id },
      data: sent?.sent ? { status: 'SENT', sentAt: new Date(), provider: 'META' } : { status: 'FAILED', error: sent?.error || 'WhatsApp delivery skipped' },
    });
    results.push({ channel: 'WHATSAPP', ...sent });
  }

  return { success: true, event, results };
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
      select: { email: true, company: true, brandSettings: true },
    });
    return client;
  };

  if (movementPrefKey && phone && prefs.whatsapp?.[movementPrefKey]) {
    const c = await getClient();
    const smsTemplate = prefs?.templates?.sms?.[movementPrefKey]
      || (c?.brandSettings && typeof c.brandSettings === 'object' ? c.brandSettings.smsTemplate : null);
    await sendWhatsApp(phone, buildMovementWhatsAppMessage(status, awb, {
      smsTemplate,
      consignee,
      brand: c?.company || 'Sea Hawk Courier',
    }));
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

  // ── Outbound client webhooks ──────────────────────────────────────────────
  try {
    await webhookDispatch.dispatchShipmentStatusChange(shipment);
  } catch (err) {
    logger.error(`[Notification] Webhook dispatch failed for AWB ${awb}: ${err.message}`);
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
    html: `<p>Dear <strong>${user.name}</strong>,</p><p>Your client portal account has been created.</p><p>Login: <a href="${loginUrl}">${loginUrl}</a></p><p>Email: ${user.email}</p><p>Your password has been shared by your account administrator via a secure channel.</p><p>— Sea Hawk Courier</p>`,
    text: `Welcome ${user.name}! Your portal login is ${user.email}. Your password has been shared separately via a secure channel.`,
  });
}

async function sendOpsEscalationAlert({ clientCode, awb, ndrId, urgency, note }) {
  const recipients = await prisma.user.findMany({
    where: {
      active: true,
      role: { in: ['OWNER', 'ADMIN', 'OPS_MANAGER'] },
    },
    select: { email: true },
  });

  const subject = `[NDR Escalation] ${clientCode} · ${awb}`;
  const text = [
    `Client: ${clientCode}`,
    `AWB: ${awb}`,
    `NDR ID: ${ndrId}`,
    `Urgency: ${urgency || 'HIGH'}`,
    note ? `Note: ${note}` : '',
  ].filter(Boolean).join('\n');

  await Promise.all(recipients
    .filter((r) => !!r.email)
    .map((r) => sendEmail({
      to: r.email,
      subject,
      text,
      html: `<p><strong>NDR Escalation Alert</strong></p>
             <p><strong>Client:</strong> ${clientCode}</p>
             <p><strong>AWB:</strong> ${awb}</p>
             <p><strong>NDR ID:</strong> ${ndrId}</p>
             <p><strong>Urgency:</strong> ${urgency || 'HIGH'}</p>
             ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}`,
    })));
}

module.exports = {
  sendEmail,
  sendWhatsApp,
  notifyShipmentEvent,
  notifyStatusChange,
  sendPODEmail,
  sendWelcomeEmail,
  getClientNotificationPreferences,
  sendOpsEscalationAlert,
};
