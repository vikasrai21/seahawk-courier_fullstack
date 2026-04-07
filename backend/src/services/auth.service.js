'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const config = require('../config');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const { isOwnerUser } = require('../utils/owner');

const SALT_ROUNDS = 12;
const MAX_FAILED_LOGIN_ATTEMPTS = parseInt(process.env.LOGIN_LOCK_MAX || '5', 10);
const LOGIN_LOCK_MINUTES = parseInt(process.env.LOGIN_LOCK_MINUTES || '15', 10);

function sanitise(str) {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').replace(/on\w+\s*=/gi, '').trim();
}

function signAccess(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiresIn }
  );
}

function generateRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

// Store refresh token — gracefully skips if table doesn't exist yet
async function storeRefreshToken(userId, token, meta = {}) {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
        ip: meta.ip || null,
        userAgent: meta.userAgent || null,
      },
    });
  } catch {
    // Table doesn't exist yet — silently skip
  }
}

async function login(email, password, meta = {}) {
  const normalised = email.toLowerCase().trim();
  const now = new Date();
  const user = await prisma.user.findUnique({ 
    where: { email: normalised },
    include: { clientProfile: { include: { client: { select: { walletBalance: true } } } } }
  });

  if (user?.lockedUntil && user.lockedUntil > now) {
    throw new AppError('Account temporarily locked due to repeated failed logins. Please try again later.', 429);
  }

  // Always compare to prevent timing attacks
  const dummyHash = '$2a$12$invalidhashtopreventtimingattacks.padding.xx';
  const valid = await bcrypt.compare(password, user?.password || dummyHash);

  if (!user || !valid || !user.active) {
    if (user && !valid) {
      const attempts = (user.loginAttempts || 0) + 1;
      const lockNow = attempts >= MAX_FAILED_LOGIN_ATTEMPTS;
      const lockedUntil = lockNow ? new Date(now.getTime() + LOGIN_LOCK_MINUTES * 60 * 1000) : null;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: lockNow ? 0 : attempts,
          lockedUntil,
        },
      });
    }
    throw new AppError('Invalid email or password.', 401);
  }

  if (user.loginAttempts || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null },
    });
  }

  const accessToken = signAccess(user);
  const refreshToken = generateRefreshToken();
  await storeRefreshToken(user.id, refreshToken, meta);

  logger.info(`Login: ${user.email} [${user.role}]`);

  const clientProfile = user.clientProfile;
  const safeUser = { ...user };
  delete safeUser.password;
  delete safeUser.clientProfile;
  return { 
    accessToken, 
    refreshToken, 
    user: { 
      ...safeUser, 
      clientCode: clientProfile?.clientCode || null,
      walletBalance: clientProfile?.client?.walletBalance ?? 0,
      isOwner: isOwnerUser(user),
      mustChangePassword: !!user.mustChangePassword,
    } 
  };
}

// Refresh — tries DB first, falls back to JWT verification
async function refreshAccessToken(token) {
  // Try DB-stored token first
  try {
    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (stored) {
      if (stored.revokedAt || stored.expiresAt < new Date()) {
        throw new AppError('Invalid or expired refresh token.', 401);
      }
      const user = await prisma.user.findUnique({
        where: { id: stored.userId },
        select: { id: true, email: true, role: true, active: true },
      });
      if (!user || !user.active) throw new AppError('User not found.', 401);
      return { accessToken: signAccess(user) };
    }
  } catch (err) {
    if (err.isOperational) throw err;
    // Table doesn't exist — fall through to JWT
  }

  // Fallback: verify as JWT (old tokens)
  try {
    const payload = jwt.verify(token, config.jwt.refreshSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, role: true, active: true },
    });
    if (!user || !user.active) throw new AppError('User not found.', 401);
    return { accessToken: signAccess(user) };
  } catch {
    throw new AppError('Invalid or expired refresh token.', 401);
  }
}

async function revokeRefreshToken(token) {
  if (!token) return;
  try {
    await prisma.refreshToken.update({
      where: { token },
      data: { revokedAt: new Date() },
    });
  } catch {
    // Token not found or table missing — ignore
  }
}

async function revokeAllUserTokens(userId) {
  try {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } catch (err) {
    logger.warn(`Failed to revoke all user tokens for userId=${userId}: ${err.message}`);
  }
}

async function cleanupExpiredTokens() {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: { OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }] },
    });
    logger.info(`Cleaned up ${result.count} expired/revoked refresh tokens`);
  } catch (err) {
    logger.warn(`Failed to clean expired refresh tokens: ${err.message}`);
  }
}

async function createUser({ name, email, password, role, branch, clientCode }) {
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) throw new AppError('Email already registered.', 409);
  const validRoles = ['ADMIN', 'OPS_MANAGER', 'STAFF', 'CLIENT'];
  if (role && !validRoles.includes(role)) throw new AppError('Invalid role.', 400);

  // CLIENT role must have a clientCode
  if (role === 'CLIENT') {
    if (!clientCode) throw new AppError('clientCode is required for CLIENT role.', 400);
    const client = await prisma.client.findUnique({ where: { code: clientCode } });
    if (!client) throw new AppError(`Client with code "${clientCode}" not found.`, 404);
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      name: sanitise(name),
      email: email.toLowerCase(),
      password: hashed,
      role: role || 'STAFF',
      branch: sanitise(branch),
      mustChangePassword: true,
    },
    select: { id: true, name: true, email: true, role: true, branch: true, active: true, mustChangePassword: true, createdAt: true },
  });

  // If CLIENT, create the ClientUser bridge record
  if (role === 'CLIENT' && clientCode) {
    await prisma.clientUser.create({
      data: { userId: user.id, clientCode },
    });
    logger.info(`ClientUser link created: userId=${user.id} → clientCode=${clientCode}`);
  }

  logger.info(`User created: ${user.email} [${user.role}]`);
  return { ...user, clientCode: role === 'CLIENT' ? clientCode : undefined };
}

async function updateUser(id, data) {
  const update = { ...data };
  if (update.password) update.password = await bcrypt.hash(update.password, SALT_ROUNDS);
  if (update.email) update.email = update.email.toLowerCase();
  if (update.name) update.name = sanitise(update.name);
  if (update.branch) update.branch = sanitise(update.branch);
  if (update.active === false) await revokeAllUserTokens(parseInt(id));
  return prisma.user.update({
    where: { id: parseInt(id) },
    data: update,
    select: { id: true, name: true, email: true, role: true, branch: true, active: true },
  });
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new AppError('Current password is incorrect.', 400);
  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashed,
      mustChangePassword: false,
      loginAttempts: 0,
      lockedUntil: null,
    },
  });
  await revokeAllUserTokens(userId);
  logger.info(`Password changed: userId=${userId}`);
}

async function getAllUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, role: true,
      branch: true, active: true, mustChangePassword: true, createdAt: true,
      clientProfile: { select: { clientCode: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  // Flatten clientCode to top level for convenience
  return users.map(u => ({
    ...u,
    isOwner: isOwnerUser(u),
    clientCode: u.clientProfile?.clientCode ?? null,
    clientProfile: undefined,
  }));
}

module.exports = {
  login,
  refreshAccessToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  cleanupExpiredTokens,
  createUser,
  updateUser,
  changePassword,
  getAllUsers,
  sanitise,
};
