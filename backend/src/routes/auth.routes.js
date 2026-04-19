// src/routes/auth.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');
const { protect, requireOwnerOrRole } = require('../middleware/auth.middleware');
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

// User management
router.get( '/users',     protect, requireOwnerOrRole('ADMIN', 'OPS_MANAGER'), ctrl.getAllUsers);
router.post('/users',     protect, requireOwnerOrRole('ADMIN'), validate(createUserSchema), ctrl.createUser);
router.put( '/users/:id', protect, requireOwnerOrRole('ADMIN'), validate(updateUserSchema), ctrl.updateUser);
router.delete('/users/:id', protect, requireOwnerOrRole('ADMIN'), ctrl.deleteUser);

module.exports = router;
