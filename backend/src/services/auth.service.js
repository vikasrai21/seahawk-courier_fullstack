'use strict';
// auth.service.js — JWT with access + refresh token system
// Phase 3: CLIENT role + clientCode support added

const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const prisma  = require('../config/prisma');
const config  = require('../config');
const logger  = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

const SALT_ROUNDS = 12;

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

// ── Login ─────────────────────────────────────────────────────────────────
async function login(body, res) {
  const { email, password } = body;
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  // Always compare to prevent timing attacks
  const dummyHash = '$2a$12$invalidhashtopreventtimingattacks.padding';
  const valid = await bcrypt.compare(password, user?.password || dummyHash);

  if (!user || !valid || !user.active) {
    throw new AppError('Invalid email or password.', 401);
  }

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

  logger.info(`Login: ${user.email} [${user.role}]${user.clientCode ? ` client=${user.clientCode}` : ''}`);

  const { password: _, ...safeUser } = user;
  return { accessToken, user: safeUser };
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
  logger.info(`Logout: ${req.user?.email}`);
}

// ── Create user (admin only) ──────────────────────────────────────────────
async function createUser({ name, email, password, role, branch, phone, clientCode }) {
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) throw new AppError('Email already registered.', 409);

  // Validate CLIENT role has clientCode
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
    },
    select: { id: true, name: true, email: true, role: true, branch: true, phone: true, clientCode: true, active: true, createdAt: true },
  });
  logger.info(`User created: ${user.email} [${user.role}]`);
  return user;
}

// ── Update user (admin only) ──────────────────────────────────────────────
async function updateUser(id, data) {
  const update = { ...data };
  delete update.id;
  delete update.createdAt;
  delete update.updatedAt;

  if (update.password) {
    update.password = await bcrypt.hash(update.password, SALT_ROUNDS);
  } else {
    delete update.password;
  }
  if (update.email) update.email = update.email.toLowerCase();
  if (update.role !== 'CLIENT') update.clientCode = null;
  if (update.clientCode) update.clientCode = update.clientCode.toUpperCase();

  return prisma.user.update({
    where: { id: parseInt(id) },
    data:  update,
    select: { id: true, name: true, email: true, role: true, branch: true, phone: true, clientCode: true, active: true },
  });
}

// ── Change own password ───────────────────────────────────────────────────
async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new AppError('Current password is incorrect.', 400);
  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  logger.info(`Password changed: userId=${userId}`);
}

// ── Get all users ─────────────────────────────────────────────────────────
async function getAllUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, branch: true, phone: true, clientCode: true, active: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
}

module.exports = { login, refresh, logout, createUser, updateUser, changePassword, getAllUsers };
