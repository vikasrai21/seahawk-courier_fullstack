// src/controllers/auth.controller.js — with real logout, meta passing, PII-safe logs
'use strict';
const authService = require('../services/auth.service');
const { auditLog } = require('../utils/audit');
const R = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const config = require('../config');

const refreshCookieOpts = {
  httpOnly: true,
  secure:   config.cookie.secure,
  sameSite: config.cookie.sameSite,
  maxAge:   config.cookie.maxAge,
  path:     '/api/auth/refresh',
};

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
  const { accessToken, refreshToken, user } = await authService.login(email, password, meta);

  res.cookie('refreshToken', refreshToken, refreshCookieOpts);

  // Audit — do NOT log password or token
  await auditLog({ userId: user.id, userEmail: user.email, action: 'LOGIN', entity: 'AUTH', ip: req.ip });
  R.ok(res, { accessToken, user }, 'Login successful');
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return R.unauthorized(res, 'No refresh token.');
  const result = await authService.refreshAccessToken(token);
  R.ok(res, result, 'Token refreshed');
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  // Revoke the token in DB — true logout
  await authService.revokeRefreshToken(token);
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  if (req.user) {
    await auditLog({ userId: req.user.id, userEmail: req.user.email, action: 'LOGOUT', entity: 'AUTH', ip: req.ip });
  }
  R.ok(res, null, 'Logged out');
});

const getMe = asyncHandler(async (req, res) => {
  R.ok(res, req.user);
});

const createUser = asyncHandler(async (req, res) => {
  const user = await authService.createUser(req.body);
  await auditLog({ userId: req.user.id, userEmail: req.user.email, action: 'CREATE_USER', entity: 'USER', entityId: user.id, newValue: { email: user.email, role: user.role }, ip: req.ip });
  R.created(res, user, 'User created');
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await authService.updateUser(req.params.id, req.body);
  await auditLog({ userId: req.user.id, userEmail: req.user.email, action: 'UPDATE_USER', entity: 'USER', entityId: req.params.id, newValue: { role: req.body.role, active: req.body.active }, ip: req.ip });
  R.ok(res, user, 'User updated');
});

const getAllUsers = asyncHandler(async (req, res) => {
  const { role } = req.query;
  let users = await authService.getAllUsers();
  if (role) users = users.filter(u => u.role === role.toUpperCase());
  R.ok(res, users);
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  // Revoke cookie too — force re-login
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  await auditLog({ userId: req.user.id, userEmail: req.user.email, action: 'CHANGE_PASSWORD', entity: 'USER', entityId: req.user.id, ip: req.ip });
  R.ok(res, null, 'Password changed. Please log in again.');
});

module.exports = { login, logout, refresh, getMe, createUser, updateUser, getAllUsers, changePassword };
