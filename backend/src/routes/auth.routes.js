'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { loginLimiter, sensitiveActionLimiter, otpLimiter } = require('../middleware/rateLimiter');
const { loginSchema, verifyOTPSchema, createUserSchema, updateUserSchema, changePasswordSchema } = require('../validators/auth.validator');

// ── Step 1: Submit credentials → OTP sent (rate limited) ─────────────────
router.post('/login',       loginLimiter, validate(loginSchema), ctrl.login);

// ── Step 2: Submit OTP → tokens issued (rate limited strictly) ────────────
router.post('/verify-otp',  otpLimiter,   validate(verifyOTPSchema), ctrl.verifyOTP);

// ── Resend OTP ────────────────────────────────────────────────────────────
router.post('/resend-otp',  otpLimiter,   ctrl.resendOTP);

// ── Token refresh & session ───────────────────────────────────────────────
router.post('/refresh',                   ctrl.refresh);
router.post('/logout',     protect,       ctrl.logout);
router.get( '/me',         protect,       ctrl.getMe);

// ── Password management ───────────────────────────────────────────────────
router.put('/change-password', protect, sensitiveActionLimiter, validate(changePasswordSchema), ctrl.changePassword);

// ── Admin user management ─────────────────────────────────────────────────
router.get( '/users',          protect, require('../middleware/auth.middleware').requireRole('ADMIN','OPS_MANAGER','STAFF'), ctrl.getAllUsers);
router.post('/users',          protect, adminOnly, validate(createUserSchema), ctrl.createUser);
router.put( '/users/:id',      protect, adminOnly, validate(updateUserSchema), ctrl.updateUser);
router.post('/users/:id/unlock', protect, adminOnly, ctrl.unlockUser);

module.exports = router;
