// src/routes/auth.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { loginLimiter, sensitiveActionLimiter } = require('../middleware/rateLimiter');
const { loginSchema, createUserSchema, updateUserSchema, changePasswordSchema } = require('../validators/auth.validator');

// Login — rate limited to 5 attempts per 15 minutes
router.post('/login',           loginLimiter, validate(loginSchema), ctrl.login);
router.post('/refresh',                       ctrl.refresh);
router.post('/logout',          protect,      ctrl.logout);
router.get( '/me',              protect,      ctrl.getMe);

// Change password — rate limited
router.put('/change-password', protect, sensitiveActionLimiter, validate(changePasswordSchema), ctrl.changePassword);

// Management user management
router.get( '/users',     protect, require('../middleware/auth.middleware').requireRole('ADMIN','OPS_MANAGER'), ctrl.getAllUsers);
router.post('/users',     protect, adminOnly, validate(createUserSchema), ctrl.createUser);
router.put( '/users/:id', protect, adminOnly, validate(updateUserSchema), ctrl.updateUser);

module.exports = router;
