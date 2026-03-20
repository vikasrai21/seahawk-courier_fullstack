'use strict';
// auth.controller.js — Two-step login: credentials → OTP → token

const svc    = require('../services/auth.service');
const R      = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

// ── Step 1: Submit email + password → OTP sent ────────────────────────────
const login = asyncHandler(async (req, res) => {
  const result = await svc.initiateLogin(req.body);
  R.ok(res, result, 'OTP sent to your email');
});

// ── Step 2: Submit OTP → access token issued ──────────────────────────────
const verifyOTP = asyncHandler(async (req, res) => {
  const result = await svc.verifyOTPAndLogin(req.body, res);
  R.ok(res, result);
});

// ── Resend OTP ────────────────────────────────────────────────────────────
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return R.error(res, 'Email required', 400);

  // Re-initiate to resend OTP (requires password again for security)
  // Just send a new OTP if user exists and is active
  const prisma = require('../config/prisma');
  const user   = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.active) return R.ok(res, { message: 'If that email exists, an OTP was sent.' });

  const otpSvc = require('../services/otp.service');
  const result = await otpSvc.sendLoginOTP(user.email, user.name);
  R.ok(res, { otpSent: true, maskedEmail: email.replace(/(.{2}).*(@.*)/, '$1***$2') });
});

const refresh = asyncHandler(async (req, res) => {
  const result = await svc.refresh(req, res);
  R.ok(res, result);
});

const logout = asyncHandler(async (req, res) => {
  await svc.logout(req, res);
  R.ok(res, null, 'Logged out');
});

const getMe = asyncHandler(async (req, res) => {
  const prisma = require('../config/prisma');
  const user   = await prisma.user.findUnique({
    where:  { id: req.user.id },
    select: { id: true, name: true, email: true, role: true, branch: true, phone: true, active: true, clientCode: true, mustChangePassword: true },
  });
  R.ok(res, user);
});

const changePassword = asyncHandler(async (req, res) => {
  await svc.changePassword(req.user.id, req.body);
  R.ok(res, null, 'Password changed successfully');
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await svc.getAllUsers();
  R.ok(res, users);
});

const createUser = asyncHandler(async (req, res) => {
  const result = await svc.createUser(req.body);
  R.created(res, result, 'User created');
});

const updateUser = asyncHandler(async (req, res) => {
  const result = await svc.updateUser(req.params.id, req.body);
  R.ok(res, result, 'User updated');
});

const unlockUser = asyncHandler(async (req, res) => {
  await svc.unlockAccount(parseInt(req.params.id));
  R.ok(res, null, 'Account unlocked');
});

module.exports = {
  login, verifyOTP, resendOTP, refresh, logout,
  getMe, changePassword, getAllUsers, createUser, updateUser, unlockUser,
};
