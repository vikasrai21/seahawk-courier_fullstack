'use strict';
// otp.service.js — Email OTP generation and verification
// Used for 2FA on login

const crypto  = require('crypto');
const prisma  = require('../config/prisma');
const logger  = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

const OTP_EXPIRY_MINUTES = 10; // OTP valid for 10 minutes
const MAX_OTP_ATTEMPTS   = 3;  // Max wrong OTP attempts before invalidation

// ── Generate a 6-digit OTP ───────────────────────────────────────────────
function generateOTP() {
  return String(crypto.randomInt(100000, 999999));
}

// ── Send OTP via email ────────────────────────────────────────────────────
async function sendLoginOTP(email, userName) {
  // Invalidate any existing OTPs for this email
  await prisma.$executeRaw`
    UPDATE login_otps SET used = true 
    WHERE email = ${email} AND used = false
  `;

  const otp       = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Store OTP in database
  await prisma.$executeRaw`
    INSERT INTO login_otps (email, otp, expires_at, used, attempts)
    VALUES (${email}, ${otp}, ${expiresAt}, false, 0)
  `;

  // Send email
  try {
    const emailSvc = require('./email.service');
    if (emailSvc.isConfigured()) {
      await emailSvc.sendGeneral({
        to:      email,
        subject: 'Sea Hawk Portal — Your Login OTP',
        html: `
          <!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
          <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);">
            <div style="background:#0b1f3a;padding:24px 32px;">
              <h1 style="color:#fff;margin:0;font-size:18px;">Sea Hawk Courier &amp; Cargo</h1>
            </div>
            <div style="padding:32px;">
              <p style="color:#333;font-size:15px;">Hello <strong>${userName || 'there'}</strong>,</p>
              <p style="color:#555;line-height:1.6;">Your login OTP is:</p>
              <div style="text-align:center;margin:24px 0;">
                <div style="display:inline-block;background:#f0f4ff;border:2px solid #0b1f3a;border-radius:12px;padding:16px 40px;">
                  <span style="font-size:2.5rem;font-weight:900;letter-spacing:12px;color:#0b1f3a;font-family:monospace;">${otp}</span>
                </div>
              </div>
              <p style="color:#555;font-size:14px;">This OTP is valid for <strong>${OTP_EXPIRY_MINUTES} minutes</strong> and can only be used once.</p>
              <p style="color:#e8580a;font-size:13px;font-weight:600;">⚠️ Never share this OTP with anyone. Sea Hawk staff will never ask for your OTP.</p>
              <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
              <p style="color:#aaa;font-size:11px;">If you didn't request this OTP, your account may be at risk. Contact us immediately at +91 99115 65523.</p>
            </div>
          </div>
          </body></html>
        `,
      });
      logger.info(`[OTP] Sent to ${email}`);
      return { sent: true, method: 'email' };
    }
  } catch (err) {
    logger.error(`[OTP] Email failed: ${err.message}`);
  }

  // Fallback: log OTP to server console (dev only)
  if (process.env.NODE_ENV !== 'production') {
    logger.warn(`[OTP DEV] ${email} → ${otp} (expires ${expiresAt.toISOString()})`);
    return { sent: true, method: 'console', otp }; // Only expose in dev
  }

  throw new AppError('Email service not configured. Contact admin.', 503);
}

// ── Verify OTP ────────────────────────────────────────────────────────────
async function verifyOTP(email, enteredOTP) {
  const rows = await prisma.$queryRaw`
    SELECT * FROM login_otps
    WHERE email = ${email}
      AND used = false
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const record = rows?.[0];

  if (!record) {
    throw new AppError('OTP expired or not found. Please request a new one.', 401);
  }

  // Increment attempt counter
  await prisma.$executeRaw`
    UPDATE login_otps SET attempts = attempts + 1 WHERE id = ${record.id}
  `;

  // Max attempts exceeded — invalidate
  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    await prisma.$executeRaw`UPDATE login_otps SET used = true WHERE id = ${record.id}`;
    throw new AppError('Too many wrong attempts. Please request a new OTP.', 401);
  }

  // Wrong OTP
  if (record.otp !== String(enteredOTP).trim()) {
    const remaining = MAX_OTP_ATTEMPTS - record.attempts - 1;
    throw new AppError(
      remaining > 0
        ? `Incorrect OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        : 'Incorrect OTP. Please request a new one.',
      401
    );
  }

  // Mark as used
  await prisma.$executeRaw`UPDATE login_otps SET used = true WHERE id = ${record.id}`;
  logger.info(`[OTP] Verified for ${email}`);
  return true;
}

// ── Cleanup expired OTPs (run periodically) ───────────────────────────────
async function cleanupExpired() {
  const deleted = await prisma.$executeRaw`
    DELETE FROM login_otps WHERE expires_at < NOW() OR used = true
  `;
  if (deleted > 0) logger.info(`[OTP] Cleaned up ${deleted} expired OTPs`);
}

module.exports = { sendLoginOTP, verifyOTP, cleanupExpired, generateOTP };
