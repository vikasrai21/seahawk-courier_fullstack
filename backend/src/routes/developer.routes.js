"use strict";
// developer.routes.js — Developer Hub orchestrator
// Mounts focused sub-routers for keys, integrations, webhooks, sandbox, approvals
//
// Sub-routers:
//   dev-keys.routes.js          — API key CRUD + policy management
//   dev-integrations.routes.js  — Integration settings, logs, replay, dead-letters, connectors, diagnostics
//   dev-webhooks.routes.js      — Outbound webhook CRUD + test + deliveries
//   dev-sandbox.routes.js       — Sandbox dashboard + bulk order generation
//   dev-approvals.routes.js     — Governance approval request + decision flow
//
// Shared helpers live in dev-helpers.js

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// Mount all sub-routers
router.use(require('./dev-keys.routes'));
router.use(require('./dev-integrations.routes'));
router.use(require('./dev-webhooks.routes'));
router.use(require('./dev-sandbox.routes'));
router.use(require('./dev-approvals.routes'));

module.exports = router;
