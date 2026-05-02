'use strict';
/**
 * notificationEngine.service.js — Client Notification Engine
 *
 * Orchestrates email + WhatsApp notifications for shipment status updates.
 * Handles backlog-aware notifications (when entering backdated shipments).
 * Supports per-shipment updates, daily digests, and bulk date range notifications.
 */

const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const notify = require('./notification.service');
const config = require('../config');

const appBaseUrl = String(config.app?.publicBaseUrl || '').replace(/\/+$/, '');
const supportPhone = config.app?.supportPhone || '+91 99115 65523';

// ── Backlog Detection ───────────────────────────────────────────────────────

function isBacklog(shipmentDate) {
  const today = new Date().toISOString().slice(0, 10);
  return shipmentDate && shipmentDate < today;
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// ── Email Templates ─────────────────────────────────────────────────────────

function buildStatusUpdateEmail({ shipment, client, backlog = false }) {
  const { awb, status, consignee, destination, date, weight, courier } = shipment;
  const trackUrl = `${appBaseUrl}/track/${encodeURIComponent(awb)}`;
  const company = client?.company || 'Customer';
  const dateLabel = backlog ? `Shipment Date: ${formatDate(date)}` : '';

  const statusColors = {
    Booked: '#3b82f6',
    InTransit: '#f59e0b',
    OutForDelivery: '#8b5cf6',
    Delivered: '#10b981',
    NDR: '#ef4444',
    RTO: '#ef4444',
  };

  const statusEmoji = {
    Booked: '📦',
    InTransit: '🚛',
    OutForDelivery: '🚚',
    Delivered: '✅',
    NDR: '⚠️',
    RTO: '↩️',
  };

  const color = statusColors[status] || '#64748b';
  const emoji = statusEmoji[status] || '📦';

  const subject = `${emoji} Shipment ${status} — AWB ${awb}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <div style="background: #0b1f3a; padding: 28px 32px;">
          <h1 style="color: #fff; margin: 0; font-size: 18px; font-weight: 700;">Sea Hawk Courier & Cargo</h1>
          <p style="color: rgba(255,255,255,0.5); margin: 4px 0 0; font-size: 12px;">Shipment Status Update</p>
        </div>
        <!-- Status Bar -->
        <div style="background: ${color}; padding: 14px 32px;">
          <p style="color: #fff; margin: 0; font-size: 15px; font-weight: 700;">${emoji} ${status}</p>
        </div>
        <!-- Body -->
        <div style="padding: 32px;">
          <p style="color: #334155; font-size: 15px; margin: 0 0 20px;">Dear <strong>${company}</strong>,</p>
          ${backlog ? `<p style="color: #64748b; font-size: 13px; background: #f8fafc; padding: 10px 16px; border-radius: 8px; border-left: 3px solid ${color}; margin-bottom: 20px;">${dateLabel}</p>` : ''}
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; padding: 6px 0;">AWB Number</td>
                <td style="color: #0f172a; font-size: 13px; font-weight: 700; text-align: right; font-family: monospace;">${awb}</td>
              </tr>
              <tr>
                <td style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; padding: 6px 0;">Consignee</td>
                <td style="color: #0f172a; font-size: 13px; text-align: right;">${consignee || 'N/A'}</td>
              </tr>
              <tr>
                <td style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; padding: 6px 0;">Destination</td>
                <td style="color: #0f172a; font-size: 13px; text-align: right;">${destination || 'N/A'}</td>
              </tr>
              <tr>
                <td style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; padding: 6px 0;">Courier</td>
                <td style="color: #0f172a; font-size: 13px; text-align: right;">${courier || 'N/A'}</td>
              </tr>
              <tr>
                <td style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; padding: 6px 0;">Weight</td>
                <td style="color: #0f172a; font-size: 13px; text-align: right;">${weight || 0} kg</td>
              </tr>
            </table>
          </div>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${trackUrl}" style="display: inline-block; background: #0b1f3a; color: #fff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">Track Shipment</a>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.6;">
            For queries: 📞 ${supportPhone}<br/>
            💬 <a href="https://wa.me/919911565523" style="color: #0b1f3a;">WhatsApp Us</a>
          </p>
        </div>
        <!-- Footer -->
        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center;">
          <p style="color: #94a3b8; font-size: 10px; margin: 0;">This is an automated notification from Sea Hawk Courier & Cargo</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

function buildDigestEmailHtml({ client, shipments, dateLabel, dateFrom, dateTo }) {
  const company = client?.company || 'Customer';
  const totalWeight = shipments.reduce((s, sh) => s + (sh.weight || 0), 0);

  const statusCounts = {};
  for (const s of shipments) {
    statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
  }

  const shipmentRows = shipments.slice(0, 50).map((s) => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 10px 12px; font-family: monospace; font-size: 12px; font-weight: 700; color: #0f172a;">${s.awb}</td>
      <td style="padding: 10px 8px; font-size: 12px; color: #475569;">${s.consignee || '—'}</td>
      <td style="padding: 10px 8px; font-size: 12px; color: #475569;">${s.destination || '—'}</td>
      <td style="padding: 10px 8px; font-size: 12px; color: #475569;">${s.courier || '—'}</td>
      <td style="padding: 10px 8px; font-size: 12px; color: #475569; text-align: center;">${s.weight || 0} kg</td>
      <td style="padding: 10px 8px; font-size: 12px; font-weight: 600; color: ${s.status === 'Delivered' ? '#10b981' : s.status === 'NDR' ? '#ef4444' : '#0b1f3a'}; text-align: center;">${s.status}</td>
    </tr>
  `).join('');

  const statusSummary = Object.entries(statusCounts).map(([st, ct]) => `<span style="display: inline-block; background: #f1f5f9; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; margin: 2px 4px;">${st}: ${ct}</span>`).join(' ');

  const subject = `📊 Shipment Summary | ${company} | ${dateLabel}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 20px;">
      <div style="max-width: 700px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <div style="background: #0b1f3a; padding: 28px 32px;">
          <h1 style="color: #fff; margin: 0; font-size: 18px;">Sea Hawk Courier & Cargo</h1>
          <p style="color: rgba(255,255,255,0.5); margin: 4px 0 0; font-size: 12px;">Daily Shipment Digest</p>
        </div>
        <div style="background: linear-gradient(135deg, #e8580a, #f59e0b); padding: 16px 32px;">
          <p style="color: #fff; margin: 0; font-size: 14px; font-weight: 700;">${dateLabel} — ${shipments.length} Shipments</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #334155; font-size: 15px;">Dear <strong>${company}</strong>,</p>
          <p style="color: #64748b; font-size: 13px; line-height: 1.6;">Here is the shipment summary for <strong>${dateLabel}</strong>. Total weight: <strong>${totalWeight.toFixed(1)} kg</strong>.</p>

          <div style="margin: 20px 0;">${statusSummary}</div>

          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="padding: 10px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; text-align: left;">AWB</th>
                  <th style="padding: 10px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; text-align: left;">Consignee</th>
                  <th style="padding: 10px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; text-align: left;">Destination</th>
                  <th style="padding: 10px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; text-align: left;">Courier</th>
                  <th style="padding: 10px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; text-align: center;">Weight</th>
                  <th style="padding: 10px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; text-align: center;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${shipmentRows}
              </tbody>
            </table>
          </div>

          ${shipments.length > 50 ? `<p style="color: #94a3b8; font-size: 11px; margin-top: 12px; text-align: center;">Showing 50 of ${shipments.length} shipments. Login to the portal for full details.</p>` : ''}

          <div style="text-align: center; margin: 28px 0;">
            <a href="${appBaseUrl}/portal/shipments" style="display: inline-block; background: #0b1f3a; color: #fff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 13px; font-weight: 700;">View in Portal</a>
          </div>

          <p style="color: #64748b; font-size: 12px;">For queries: 📞 ${supportPhone}</p>
        </div>
        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center;">
          <p style="color: #94a3b8; font-size: 10px; margin: 0;">Sea Hawk Courier & Cargo — Automated Digest</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Send a status update notification for a single shipment.
 * @param {string} awbOrId - AWB number or shipment ID
 * @param {object} options - { forceEmail, forceWhatsapp }
 */
async function sendShipmentUpdate(awbOrId, options = {}) {
  const where = typeof awbOrId === 'number'
    ? { id: awbOrId }
    : { awb: { contains: String(awbOrId), mode: 'insensitive' } };

  const shipment = await prisma.shipment.findFirst({
    where,
    include: { client: { select: { email: true, company: true, phone: true, whatsapp: true, brandSettings: true } } },
  });

  if (!shipment) return { error: `Shipment not found: ${awbOrId}` };
  if (!shipment.client) return { error: 'No client linked to this shipment' };

  const client = shipment.client;
  const backlog = isBacklog(shipment.date);
  const prefs = await notify.getClientNotificationPreferences(shipment.clientCode);
  const emailTo = prefs.emailAddress || client.email;
  const whatsappTo = prefs.whatsappNumber || client.whatsapp || client.phone || shipment.phone;
  const results = { email: null, whatsapp: null };

  // Email
  if (emailTo && (options.forceEmail || prefs.email?.booked || prefs.email?.delivered)) {
    const { subject, html } = buildStatusUpdateEmail({ shipment, client, backlog });
    try {
      await notify.sendEmail({ to: emailTo, subject, html });
      results.email = { sent: true, to: emailTo };
      // Log to notifications table
      await prisma.notification.create({
        data: {
          clientCode: shipment.clientCode, awb: shipment.awb,
          channel: 'EMAIL', to: emailTo, template: 'STATUS_UPDATE',
          message: `${shipment.status} notification for ${shipment.awb}`,
          status: 'SENT', sentAt: new Date(),
        },
      });
    } catch (err) {
      results.email = { sent: false, error: err.message };
      await prisma.notification.create({
        data: {
          clientCode: shipment.clientCode, awb: shipment.awb,
          channel: 'EMAIL', to: emailTo, template: 'STATUS_UPDATE',
          message: `${shipment.status} notification for ${shipment.awb}`,
          status: 'FAILED', error: err.message,
        },
      });
    }
  }

  // WhatsApp
  if (whatsappTo && (options.forceWhatsapp || prefs.whatsapp?.booked || prefs.whatsapp?.delivered)) {
    const dateNote = backlog ? ` (shipped on ${formatDate(shipment.date)})` : '';
    const msg = `📦 Shipment Update\n\nAWB: ${shipment.awb}\nStatus: ${shipment.status}${dateNote}\nDestination: ${shipment.destination || 'N/A'}\n\nTrack: ${appBaseUrl}/track/${encodeURIComponent(shipment.awb)}\n\n— Sea Hawk Courier`;
    try {
      await notify.sendWhatsApp(whatsappTo, msg);
      results.whatsapp = { sent: true, to: whatsappTo };
    } catch (err) {
      results.whatsapp = { sent: false, error: err.message };
    }
  }

  return { success: true, awb: shipment.awb, status: shipment.status, backlog, results };
}

/**
 * Send a daily digest email to a client with all shipments for a date.
 */
async function sendDailyDigest(clientCode, date) {
  const code = String(clientCode).toUpperCase();
  const client = await prisma.client.findUnique({
    where: { code },
    select: { email: true, whatsapp: true, phone: true, company: true, code: true, notificationConfig: true, brandSettings: true },
  });

  if (!client) return { error: `Client not found: ${code}` };
  const prefs = await notify.getClientNotificationPreferences(code);
  const emailTo = prefs.emailAddress || client.email;
  const whatsappTo = prefs.whatsappNumber || client.whatsapp || client.phone;
  if (!emailTo && !whatsappTo) return { error: `No email or WhatsApp for client ${code}` };

  const shipments = await prisma.shipment.findMany({
    where: { clientCode: code, date },
    select: { awb: true, consignee: true, destination: true, courier: true, weight: true, status: true, amount: true, date: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!shipments.length) return { error: `No shipments found for ${code} on ${date}` };

  const dateLabel = formatDate(date);
  const { subject, html } = buildDigestEmailHtml({ client, shipments, dateLabel, dateFrom: date, dateTo: date });

  try {
    if (emailTo) await notify.sendEmail({ to: emailTo, subject, html });
    if (whatsappTo) {
      await notify.sendWhatsApp(whatsappTo, `Shipment Summary | ${client.company || code}\n${dateLabel}\nShipments: ${shipments.length}\nTrack details: ${appBaseUrl}/portal/shipments`);
    }
    // Log digest notification
    if (emailTo) await prisma.notification.create({
      data: {
        clientCode: code, channel: 'EMAIL', to: emailTo,
        template: 'DAILY_DIGEST', message: `Digest for ${date}: ${shipments.length} shipments`,
        status: 'SENT', sentAt: new Date(),
      },
    });
    return { success: true, clientCode: code, date, shipmentCount: shipments.length, sentTo: { email: emailTo || null, whatsapp: whatsappTo || null } };
  } catch (err) {
    if (emailTo) await prisma.notification.create({
      data: {
        clientCode: code, channel: 'EMAIL', to: emailTo,
        template: 'DAILY_DIGEST', message: `Digest for ${date}: ${shipments.length} shipments`,
        status: 'FAILED', error: err.message,
      },
    });
    return { error: err.message };
  }
}

/**
 * Send bulk notifications for a date range.
 */
async function sendBulkDateUpdate(clientCode, dateFrom, dateTo) {
  const code = String(clientCode).toUpperCase();
  const client = await prisma.client.findUnique({
    where: { code },
    select: { email: true, whatsapp: true, phone: true, company: true, code: true, notificationConfig: true, brandSettings: true },
  });

  if (!client) return { error: `Client not found: ${code}` };
  const prefs = await notify.getClientNotificationPreferences(code);
  const emailTo = prefs.emailAddress || client.email;
  const whatsappTo = prefs.whatsappNumber || client.whatsapp || client.phone;
  if (!emailTo && !whatsappTo) return { error: `No email or WhatsApp for client ${code}` };

  const shipments = await prisma.shipment.findMany({
    where: { clientCode: code, date: { gte: dateFrom, lte: dateTo } },
    select: { awb: true, consignee: true, destination: true, courier: true, weight: true, status: true, amount: true, date: true },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
  });

  if (!shipments.length) return { error: `No shipments found for ${code} between ${dateFrom} and ${dateTo}` };

  const dateLabel = `${formatDate(dateFrom)} — ${formatDate(dateTo)}`;
  const { subject, html } = buildDigestEmailHtml({ client, shipments, dateLabel, dateFrom, dateTo });

  try {
    if (emailTo) await notify.sendEmail({ to: emailTo, subject, html });
    if (whatsappTo) {
      await notify.sendWhatsApp(whatsappTo, `Shipment Summary | ${client.company || code}\n${dateLabel}\nShipments: ${shipments.length}\nTrack details: ${appBaseUrl}/portal/shipments`);
    }
    if (emailTo) await prisma.notification.create({
      data: {
        clientCode: code, channel: 'EMAIL', to: emailTo,
        template: 'BULK_UPDATE', message: `Bulk update ${dateFrom} to ${dateTo}: ${shipments.length} shipments`,
        status: 'SENT', sentAt: new Date(),
      },
    });
    return { success: true, clientCode: code, dateFrom, dateTo, shipmentCount: shipments.length, sentTo: { email: emailTo || null, whatsapp: whatsappTo || null } };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Get notification history.
 */
async function getHistory({ clientCode, channel, limit = 50 } = {}) {
  const where = {};
  if (clientCode) where.clientCode = clientCode.toUpperCase();
  if (channel) where.channel = channel.toUpperCase();

  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

module.exports = {
  sendShipmentUpdate,
  sendDailyDigest,
  sendBulkDateUpdate,
  getHistory,
  isBacklog,
};
