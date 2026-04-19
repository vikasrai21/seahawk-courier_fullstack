'use strict';
const authService = require('../services/auth.service');
const { auditLog } = require('../utils/audit');
const R = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const config = require('../config');

const refreshCookieOpts = {
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  maxAge: config.cookie.maxAge,
  path: '/api/auth/refresh',
};

const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe = true } = req.body;
  const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
  const { accessToken, refreshToken, user } = await authService.login(email, password, meta);
  const cookieOpts = rememberMe
    ? refreshCookieOpts
    : { ...refreshCookieOpts, maxAge: undefined };
  res.cookie('refreshToken', refreshToken, cookieOpts);
  await auditLog({ userId: user.id, userEmail: user.email, action: 'LOGIN', entity: 'AUTH', ip: req.ip });
  R.ok(res, { accessToken, user }, 'Login successful');
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return R.unauthorized(res, 'No refresh token.');
  const result = await authService.refreshAccessToken(token);
  if (result.refreshToken) {
    res.cookie('refreshToken', result.refreshToken, refreshCookieOpts);
  }
  R.ok(res, { accessToken: result.accessToken }, 'Token refreshed');
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
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
  const { name, email, password, role, branch, clientCode } = req.body;
  const user = await authService.createUser({ name, email, password, role, branch, clientCode });
  await auditLog({ userId: req.user.id, userEmail: req.user.email, action: 'CREATE_USER', entity: 'USER', entityId: user.id, newValue: { email: user.email, role: user.role, clientCode }, ip: req.ip });
  R.created(res, user, 'User created');
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await authService.updateUser(req.params.id, req.body);
  await auditLog({ userId: req.user.id, userEmail: req.user.email, action: 'UPDATE_USER', entity: 'USER', entityId: req.params.id, newValue: { role: req.body.role, active: req.body.active }, ip: req.ip });
  R.ok(res, user, 'User updated');
});

const deleteUser = asyncHandler(async (req, res) => {
  const deleted = await authService.deleteUser(req.params.id, req.user.id);
  await auditLog({
    userId: req.user.id,
    userEmail: req.user.email,
    action: 'DELETE_USER',
    entity: 'USER',
    entityId: req.params.id,
    oldValue: { email: deleted.email, role: deleted.role, clientCode: deleted.clientCode || null },
    ip: req.ip,
  });
  R.ok(res, deleted, 'User deleted');
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
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  await auditLog({ userId: req.user.id, userEmail: req.user.email, action: 'CHANGE_PASSWORD', entity: 'USER', entityId: req.user.id, ip: req.ip });
  R.ok(res, null, 'Password changed. Please log in again.');
});

module.exports = { login, logout, refresh, getMe, createUser, updateUser, deleteUser, getAllUsers, changePassword };
