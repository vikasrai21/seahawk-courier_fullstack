'use strict';
const { z } = require('zod');

// ── Password policy ───────────────────────────────────────────────────────
const passwordPolicy = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character (!@#$%^&* etc.)');

// ── Step 1: Login (credentials) ───────────────────────────────────────────
const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password required'),
});

// ── Step 2: Verify OTP ────────────────────────────────────────────────────
const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp:   z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

// ── Create user ───────────────────────────────────────────────────────────
const createUserSchema = z.object({
  name:       z.string().min(2, 'Name must be at least 2 characters'),
  email:      z.string().email('Invalid email address'),
  password:   passwordPolicy,
  role:       z.enum(['OWNER', 'ADMIN', 'STAFF', 'OPS_MANAGER', 'CLIENT']).default('STAFF'),
  branch:     z.string().optional(),
  phone:      z.string().optional(),
  clientCode: z.string().max(20).optional(),
});

// ── Update user ───────────────────────────────────────────────────────────
const updateUserSchema = z.object({
  name:       z.string().min(2).optional(),
  email:      z.string().email().optional(),
  password:   passwordPolicy.optional(),
  role:       z.enum(['OWNER', 'ADMIN', 'STAFF', 'OPS_MANAGER', 'CLIENT']).optional(),
  branch:     z.string().optional(),
  phone:      z.string().optional(),
  active:     z.boolean().optional(),
  clientCode: z.string().max(20).optional(),
});

// ── Change password ───────────────────────────────────────────────────────
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword:     passwordPolicy,
});

module.exports = {
  loginSchema, verifyOTPSchema,
  createUserSchema, updateUserSchema, changePasswordSchema,
};
