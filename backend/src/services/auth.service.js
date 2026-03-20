'use strict';
// auth.service.js — Phase 3 Security: OTP 2FA + account lockout + password policy

const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const prisma  = require('../config/prisma');
const config  = require('../config');
const logger  = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const otpSvc  = require('./otp.service');

const SALT_ROUNDS      = 12;
const MAX_ATTEMPTS     = 5;
const LOCKOUT_MINUTES  = 10;

// ── Password policy ───────────────────────────────────────────────────────
function validatePasswordStrength(password) {
  const errors = [];
  if (password.length < 8)              errors.push('at least 8 characters');
  if (!/[A-Z]/.test(password))          errors.push('one uppercase letter');
  if (!/[0-9]/.test(password))          errors.push('one number');
  if (!/[^A-Za-z0-9]/.test(password))  errors.push('one special character (!@#$%^&* etc.)');
  if (errors.length > 0) {
    throw new AppError(`Password must contain: ${errors.join(', ')}`, 400);
  }
}

// ── Token generators ──────────────────────────────────────────────────────
function signAccess(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, clientCode: user.clientCode || null },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiresIn }
  );
}

function signRefresh(user) {
  return jwt.sign(
    { id: user.id },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
}

// ── Step 1: Verify credentials → send OTP ────────────────────────────────
async function initiateLogin(body) {
  const { email, password } = body;
  if (!email || !password) throw new AppError('Email and password are required.', 400);

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  // Check lockout BEFORE password comparison
  if (user?.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const minutesLeft = Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000);
    throw new AppError(
      `Account locked due to too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`,
      423
    );
  }

  // Always compare to prevent timing attacks
  const dummyHash = '$2a$12$invalidhashtopreventtimingattacks.padding00000';
  const valid = await bcrypt.compare(password, user?.password || dummyHash);

  if (!user || !valid || !user.active) {
    // Increment failed attempts
    if (user) {
      const attempts = (user.loginAttempts || 0) + 1;
      const shouldLock = attempts >= MAX_ATTEMPTS;
      await prisma.$executeRaw`
        UPDATE users SET
          login_attempts = ${attempts},
          locked_until = ${shouldLock ? new Date(Date.now() + LOCKOUT_MINUTES * 60000) : null}
        WHERE id = ${user.id}
      `;
      if (shouldLock) {
        logger.warn(`[Auth] Account locked: ${user.email} after ${attempts} attempts`);
        throw new AppError(
          `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`,
          423
        );
      }
      const remaining = MAX_ATTEMPTS - attempts;
      throw new AppError(
        `Invalid email or password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before lockout.`,
        401
      );
    }
    throw new AppError('Invalid email or password.', 401);
  }

  // Reset failed attempts on successful credential check
  await prisma.$executeRaw`
    UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ${user.id}
  `;

  // Send OTP
  const result = await otpSvc.sendLoginOTP(user.email, user.name);
  logger.info(`[Auth] OTP sent to ${user.email}`);

  return {
    otpSent:    true,
    email:      user.email,
    maskedEmail: maskEmail(user.email),
    method:     result.method,
    // Only expose OTP in dev mode for testing
    ...(result.method === 'console' && { devOtp: result.otp }),
  };
}

// ── Step 2: Verify OTP → issue tokens ────────────────────────────────────
async function verifyOTPAndLogin(body, res) {
  const { email, otp } = body;
  if (!email || !otp) throw new AppError('Email and OTP are required.', 400);

  // Verify OTP (throws if invalid)
  await otpSvc.verifyOTP(email.toLowerCase().trim(), otp);

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!user || !user.active) throw new AppError('User not found or deactivated.', 401);

  const accessToken  = signAccess(user);
  const refreshToken = signRefresh(user);

  // Set refresh token as httpOnly cookie
  if (res) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure:   config.isProd,
      sameSite: config.isProd ? 'strict' : 'lax',
      maxAge:   30 * 24 * 60 * 60 * 1000,
    });
  }

  logger.info(`[Auth] Login success: ${user.email} [${user.role}]`);

  const { password: _, ...safeUser } = user;
  return {
    accessToken,
    user: safeUser,
    mustChangePassword: user.mustChangePassword || false,
  };
}

// ── Refresh access token ──────────────────────────────────────────────────
async function refresh(req, res) {
  const token = req.cookies?.refreshToken;
  if (!token) throw new AppError('No refresh token.', 401);

  let payload;
  try {
    payload = jwt.verify(token, config.jwt.refreshSecret);
  } catch {
    throw new AppError('Invalid or expired refresh token.', 401);
  }

  const user = await prisma.user.findUnique({
    where:  { id: payload.id },
    select: { id: true, email: true, role: true, clientCode: true, active: true },
  });

  if (!user || !user.active) throw new AppError('User not found or deactivated.', 401);
  const accessToken = signAccess(user);
  return { accessToken };
}

// ── Logout ────────────────────────────────────────────────────────────────
async function logout(req, res) {
  res.clearCookie('refreshToken');
  logger.info(`[Auth] Logout: ${req.user?.email}`);
}

// ── Change password (with policy enforcement) ─────────────────────────────
async function changePassword(userId, { currentPassword, newPassword }) {
  // Enforce password policy
  validatePasswordStrength(newPassword);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new AppError('Current password is incorrect.', 400);

  // Prevent reusing same password
  const sameAsOld = await bcrypt.compare(newPassword, user.password);
  if (sameAsOld) throw new AppError('New password cannot be the same as your current password.', 400);

  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: {
      password:          hashed,
      mustChangePassword: false,
    },
  });
  logger.info(`[Auth] Password changed: userId=${userId}`);
}

// ── Create user (admin only) ──────────────────────────────────────────────
async function createUser({ name, email, password, role, branch, phone, clientCode }) {
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) throw new AppError('Email already registered.', 409);

  // Enforce password policy
  validatePasswordStrength(password);

  if (role === 'CLIENT') {
    if (!clientCode) throw new AppError('clientCode is required for CLIENT role.', 400);
    const client = await prisma.client.findUnique({ where: { code: clientCode.toUpperCase() } });
    if (!client) throw new AppError(`Client code "${clientCode}" not found.`, 400);
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      name,
      email:      email.toLowerCase(),
      password:   hashed,
      role:       role || 'STAFF',
      branch:     branch || null,
      phone:      phone || null,
      clientCode: role === 'CLIENT' ? (clientCode || '').toUpperCase() : null,
      mustChangePassword: true, // Force password change on first login
    },
    select: { id: true, name: true, email: true, role: true, branch: true, phone: true, clientCode: true, active: true, createdAt: true },
  });
  logger.info(`[Auth] User created: ${user.email} [${user.role}]`);
  return user;
}

// ── Update user (admin only) ──────────────────────────────────────────────
async function updateUser(id, data) {
  const update = { ...data };
  delete update.id;
  delete update.createdAt;
  delete update.updatedAt;

  if (update.password) {
    validatePasswordStrength(update.password);
    update.password = await bcrypt.hash(update.password, SALT_ROUNDS);
  } else {
    delete update.password;
  }
  if (update.email)    update.email = update.email.toLowerCase();
  if (update.role !== 'CLIENT') update.clientCode = null;
  if (update.clientCode) update.clientCode = update.clientCode.toUpperCase();

  return prisma.user.update({
    where: { id: parseInt(id) },
    data:  update,
    select: { id: true, name: true, email: true, role: true, branch: true, phone: true, clientCode: true, active: true },
  });
}

// ── Get all users ─────────────────────────────────────────────────────────
async function getAllUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, branch: true, phone: true, clientCode: true, active: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
}

// ── Unlock account (admin) ────────────────────────────────────────────────
async function unlockAccount(userId) {
  await prisma.$executeRaw`
    UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ${userId}
  `;
  logger.info(`[Auth] Account unlocked: userId=${userId}`);
}

// ── Helpers ───────────────────────────────────────────────────────────────
function maskEmail(email) {
  const [local, domain] = email.split('@');
  const masked = local[0] + '*'.repeat(Math.max(local.length - 2, 1)) + local[local.length - 1];
  return `${masked}@${domain}`;
}

module.exports = {
  initiateLogin, verifyOTPAndLogin, refresh, logout,
  changePassword, createUser, updateUser, getAllUsers,
  unlockAccount, validatePasswordStrength,
};
