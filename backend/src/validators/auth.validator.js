// src/validators/auth.validator.js
const { z } = require('zod');

const loginSchema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

const createUserSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role:     z.enum(['ADMIN', 'STAFF']).default('STAFF'),
  branch:   z.string().optional(),
});

const updateUserSchema = z.object({
  name:     z.string().min(2).optional(),
  email:    z.string().email().optional(),
  password: z.string().min(6).optional(),
  role:     z.enum(['ADMIN', 'STAFF']).optional(),
  branch:   z.string().optional(),
  active:   z.boolean().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(6, 'New password must be at least 6 characters'),
});

module.exports = { loginSchema, createUserSchema, updateUserSchema, changePasswordSchema };
