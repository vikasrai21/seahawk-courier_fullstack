// src/controllers/auth.controller.js
const authService = require('../services/auth.service');
const { auditLog } = require('../utils/audit');
const logger = require('../utils/logger');
const R = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const config = require('../config');

// Cookie options for httpOnly refresh token
const refreshCookieOpts = {
  httpOnly: true,
  secure:   config.cookie.secure,
  sameSite: config.cookie.sameSite,
  maxAge:   config.cookie.maxAge,
  path:     '/api/auth/refresh', // Scoped — only sent on refresh endpoint
};

// ── POST /auth/login ──────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { accessToken, refreshToken, user } = await authService.login(email, password);

  // Access token: short-lived, in response body (React stores in memory)
  // Refresh token: long-lived, httpOnly cookie (not accessible via JS → XSS safe)
  res.cookie('refreshToken', refreshToken, refreshCookieOpts);

  await auditLog({ userId: user.id, userEmail: user.email, action: 'LOGIN', entity: 'AUTH', ip: req.ip });
  R.ok(res, { accessToken, user }, 'Login successful');
});

// ── POST /auth/refresh ─────────────────────────────────────────────────────
const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) return R.unauthorized(res, 'No refresh token.');

  const result = await authService.refreshAccessToken(refreshToken);
  R.ok(res, result, 'Token refreshed');
});

// ── POST /auth/logout ─────────────────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  if (req.user) {
    await auditLog({ userId: req.user.id, userEmail: req.user.email, action: 'LOGOUT', entity: 'AUTH', ip: req.ip });
  }
  R.ok(res, null, 'Logged out');
});

// ── GET /auth/me ──────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  R.ok(res, req.user);
});

// ── POST /auth/users (admin) ──────────────────────────────────────────────
const createUser = asyncHandler(async (req, res) => {
  const user = await authService.createUser(req.body);
  await auditLog({ userId: req.user.id, userEmail: req.user.email, action: 'CREATE_USER', entity: 'USER', entityId: user.id, newValue: { email: user.email, role: user.role }, ip: req.ip });
  R.created(res, user, 'User created');
});

// ── PUT /auth/users/:id (admin) ───────────────────────────────────────────
const updateUser = asyncHandler(async (req, res) => {
  const user = await authService.updateUser(req.params.id, req.body);
  await auditLog({ userId: req.user.id, userEmail: req.user.email, action: 'UPDATE_USER', entity: 'USER', entityId: req.params.id, newValue: req.body, ip: req.ip });
  R.ok(res, user, 'User updated');
});

// ── GET /auth/users (admin) ───────────────────────────────────────────────
const getAllUsers = asyncHandler(async (req, res) => {
  const { role } = req.query;
  let users = await authService.getAllUsers();
  // Support ?role=STAFF filter for agent assignment dropdowns
  if (role) users = users.filter(u => u.role === role.toUpperCase());
  R.ok(res, users);
});

// ── PUT /auth/change-password ─────────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  await auditLog({ userId: req.user.id, userEmail: req.user.email, action: 'CHANGE_PASSWORD', entity: 'USER', entityId: req.user.id, ip: req.ip });
  R.ok(res, null, 'Password changed');
});

module.exports = { login, logout, refresh, getMe, createUser, updateUser, getAllUsers, changePassword };
