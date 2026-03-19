'use strict';
// email.service.js — Gmail SMTP email service
// Uses nodemailer with Gmail App Password
//
// Setup:
// 1. Go to Google Account → Security → 2-Step Verification → App Passwords
// 2. Generate an App Password for "Mail"
// 3. Set in Railway env vars:
//    EMAIL_USER=info@seahawkcourier.com (or your Gmail)
//    EMAIL_PASS=your-16-char-app-password
//    EMAIL_FROM=Sea Hawk Courier <info@seahawkcourier.com>

const logger = require('../utils/logger');

// Lazy-load nodemailer
let transporter = null;

function isConfigured() {
  return !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

async function getTransporter() {
  if (transporter) return transporter;
  try {
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    // Verify connection
    await transporter.verify();
    logger.info('[Email] Gmail SMTP connected');
    return transporter;
  } catch (err) {
    transporter = null;
    throw new Error(`Email not configured: ${err.message}`);
  }
}

// ── Send invoice email with PDF attachment ──────────────────────────────────
async function sendInvoice({ to, invoiceNo, clientName, total, fromDate, toDate, pdfBuffer }) {
  if (!isConfigured()) {
    logger.warn('[Email] EMAIL_USER/EMAIL_PASS not set — skipping email');
    return { skipped: true, reason: 'Email not configured' };
  }

  const t = await getTransporter();
  const from = process.env.EMAIL_FROM || `Sea Hawk Courier <${process.env.EMAIL_USER}>`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: #0b1f3a; padding: 24px 32px;">
          <h1 style="color: #fff; margin: 0; font-size: 20px;">Sea Hawk Courier &amp; Cargo</h1>
          <p style="color: rgba(255,255,255,0.6); margin: 4px 0 0; font-size: 13px;">Shop 6 &amp; 7, Rao Lal Singh Market, Sector-18, Gurugram</p>
        </div>
        <!-- Orange bar -->
        <div style="background: #e8580a; padding: 12px 32px;">
          <p style="color: #fff; margin: 0; font-size: 14px; font-weight: bold;">Invoice ${invoiceNo}</p>
        </div>
        <!-- Body -->
        <div style="padding: 32px;">
          <p style="color: #333; font-size: 15px;">Dear <strong>${clientName}</strong>,</p>
          <p style="color: #555; line-height: 1.6;">
            Please find attached your invoice <strong>${invoiceNo}</strong> for the period 
            <strong>${fromDate}</strong> to <strong>${toDate}</strong>.
          </p>
          <!-- Invoice summary box -->
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #666; font-size: 13px; padding: 4px 0;">Invoice No.</td>
                <td style="color: #111; font-size: 13px; font-weight: bold; text-align: right;">${invoiceNo}</td>
              </tr>
              <tr>
                <td style="color: #666; font-size: 13px; padding: 4px 0;">Period</td>
                <td style="color: #111; font-size: 13px; text-align: right;">${fromDate} to ${toDate}</td>
              </tr>
              <tr style="border-top: 1px solid #e5e7eb;">
                <td style="color: #0b1f3a; font-size: 16px; font-weight: bold; padding-top: 12px;">Total Due</td>
                <td style="color: #e8580a; font-size: 18px; font-weight: bold; text-align: right; padding-top: 12px;">₹${Number(total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </table>
          </div>
          <p style="color: #555; line-height: 1.6; font-size: 14px;">
            Kindly process the payment at your earliest convenience via UPI, bank transfer, or cheque.
          </p>
          <p style="color: #555; line-height: 1.6; font-size: 14px;">
            For any queries regarding this invoice, please contact us at:<br/>
            📞 +91 99115 65523 &nbsp;|&nbsp; +91 83682 01122<br/>
            💬 <a href="https://wa.me/919911565523" style="color: #0b1f3a;">WhatsApp Us</a>
          </p>
          <p style="color: #333; margin-top: 32px;">
            Regards,<br/>
            <strong>Sea Hawk Courier &amp; Cargo</strong><br/>
            <span style="color: #888; font-size: 12px;">GSTIN: 06AJDPR0914N2Z1</span>
          </p>
        </div>
        <!-- Footer -->
        <div style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 16px 32px; text-align: center;">
          <p style="color: #aaa; font-size: 11px; margin: 0;">
            This is an auto-generated email. Please do not reply directly to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await t.sendMail({
    from,
    to,
    subject: `Invoice ${invoiceNo} — Sea Hawk Courier & Cargo`,
    html,
    attachments: pdfBuffer ? [{
      filename: `invoice-${invoiceNo}.pdf`,
      content:  pdfBuffer,
      contentType: 'application/pdf',
    }] : [],
  });

  logger.info(`[Email] Invoice ${invoiceNo} sent to ${to} (messageId: ${info.messageId})`);
  return { success: true, messageId: info.messageId };
}

// ── Send general notification email ────────────────────────────────────────
async function sendGeneral({ to, subject, html }) {
  if (!isConfigured()) return { skipped: true };
  const t = await getTransporter();
  const from = process.env.EMAIL_FROM || `Sea Hawk Courier <${process.env.EMAIL_USER}>`;
  const info = await t.sendMail({ from, to, subject, html });
  return { success: true, messageId: info.messageId };
}

module.exports = { isConfigured, sendInvoice, sendGeneral };
