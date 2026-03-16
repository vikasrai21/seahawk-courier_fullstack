// src/services/auth.service.js — JWT with access + refresh token system
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
    { id: user.id, email: user.email, role: user.role },
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
async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  // Always compare (even if no user) to prevent timing attacks
  const dummyHash = '$2a$12$invalidhashtopreventtimingattacks.padding';
  const valid = await bcrypt.compare(password, user?.password || dummyHash);

  if (!user || !valid || !user.active) {
    throw new AppError('Invalid email or password.', 401);
  }

  const accessToken  = signAccess(user);
  const refreshToken = signRefresh(user);

  logger.info(`Login: ${user.email} [${user.role}]`);

  const { password: _, ...safeUser } = user;
  return { accessToken, refreshToken, user: safeUser };
}

// ── Refresh access token ──────────────────────────────────────────────────
async function refreshAccessToken(refreshToken) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch {
    throw new AppError('Invalid or expired refresh token.', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, role: true, active: true },
  });

  if (!user || !user.active) throw new AppError('User not found or deactivated.', 401);

  const accessToken = signAccess(user);
  return { accessToken };
}

// ── Create user ───────────────────────────────────────────────────────────
async function createUser({ name, email, password, role, branch }) {
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) throw new AppError('Email already registered.', 409);

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { name, email: email.toLowerCase(), password: hashed, role: role || 'STAFF', branch },
    select: { id: true, name: true, email: true, role: true, branch: true, active: true, createdAt: true },
  });
  logger.info(`User created: ${user.email} [${user.role}]`);
  return user;
}

// ── Update user ───────────────────────────────────────────────────────────
async function updateUser(id, data) {
  const update = { ...data };
  if (update.password) update.password = await bcrypt.hash(update.password, SALT_ROUNDS);
  if (update.email)    update.email    = update.email.toLowerCase();

  return prisma.user.update({
    where: { id: parseInt(id) },
    data: update,
    select: { id: true, name: true, email: true, role: true, branch: true, active: true },
  });
}

// ── Change own password ───────────────────────────────────────────────────
async function changePassword(userId, currentPassword, newPassword) {
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
    select: { id: true, name: true, email: true, role: true, branch: true, active: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
}

module.exports = { login, refreshAccessToken, createUser, updateUser, changePassword, getAllUsers };
