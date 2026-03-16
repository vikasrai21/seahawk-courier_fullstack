// src/routes/audit.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/audit.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.use(protect, adminOnly);
router.get('/', ctrl.getAll);

module.exports = router;
