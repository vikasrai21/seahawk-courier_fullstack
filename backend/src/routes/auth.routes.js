// src/routes/auth.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { loginSchema, createUserSchema, updateUserSchema, changePasswordSchema } = require('../validators/auth.validator');

// No rate limiting — this is an internal office tool
// If you deploy publicly, re-enable rate limiting in production

router.post('/login',           validate(loginSchema),         ctrl.login);
router.post('/refresh',                                         ctrl.refresh);
router.post('/logout',          protect,                        ctrl.logout);
router.get( '/me',              protect,                        ctrl.getMe);
router.put( '/change-password', protect, validate(changePasswordSchema), ctrl.changePassword);

// Admin-only user management
router.get( '/users',     protect, require('../middleware/auth.middleware').requireRole('ADMIN','OPS_MANAGER','STAFF'), ctrl.getAllUsers);
router.post('/users',     protect, adminOnly, validate(createUserSchema),  ctrl.createUser);
router.put( '/users/:id', protect, adminOnly, validate(updateUserSchema),  ctrl.updateUser);

module.exports = router;
