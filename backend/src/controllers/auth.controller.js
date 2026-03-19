'use strict';
// auth.controller.js — Updated for Phase 3: CLIENT role support
const svc    = require('../services/auth.service');
const R      = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const login  = asyncHandler(async (req, res) => {
  const result = await svc.login(req.body, res);
  R.ok(res, result);
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
    select: { id: true, name: true, email: true, role: true, branch: true, phone: true, active: true, clientCode: true },
  });
  R.ok(res, user);
});

const changePassword = asyncHandler(async (req, res) => {
  await svc.changePassword(req.user.id, req.body);
  R.ok(res, null, 'Password changed');
});

const getAllUsers = asyncHandler(async (req, res) => {
  const prisma = require('../config/prisma');
  const users  = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, branch: true, phone: true, active: true, clientCode: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
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

module.exports = { login, refresh, logout, getMe, changePassword, getAllUsers, createUser, updateUser };
