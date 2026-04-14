'use strict';

const crypto = require('crypto');

function createRequestId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return crypto.randomBytes(16).toString('hex');
}

function requestContext(req, res, next) {
  const incoming = String(req.get('x-request-id') || '').trim();
  const requestId = incoming || createRequestId();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}

module.exports = { requestContext };

