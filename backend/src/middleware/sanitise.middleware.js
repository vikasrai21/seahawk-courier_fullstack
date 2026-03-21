// src/middleware/sanitise.middleware.js — Strip XSS from all string body fields
'use strict';
const { sanitise } = require('../services/auth.service');

// Recursively sanitise all string values in an object
function sanitiseObj(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      obj[key] = sanitise(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitiseObj(obj[key]);
    }
  }
  return obj;
}

// Fields that should NOT be sanitised (passwords, tokens — must be kept as-is)
const SKIP_FIELDS = new Set(['password', 'currentPassword', 'newPassword', 'token', 'refreshToken']);

function sanitiseBody(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (SKIP_FIELDS.has(key)) continue;
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitise(req.body[key]);
      } else if (typeof req.body[key] === 'object') {
        sanitiseObj(req.body[key]);
      }
    }
  }
  next();
}

module.exports = { sanitiseBody };
