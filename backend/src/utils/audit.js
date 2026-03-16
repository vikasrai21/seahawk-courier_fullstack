// src/utils/audit.js — Audit logging helper
const prisma = require('../config/prisma');
const logger  = require('./logger');

async function auditLog({ userId, userEmail, action, entity, entityId, oldValue, newValue, ip }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId:    userId   || null,
        userEmail: userEmail || null,
        action,        // e.g. CREATE, UPDATE, DELETE, LOGIN, IMPORT
        entity,        // e.g. SHIPMENT, CLIENT, USER
        entityId:  entityId ? String(entityId) : null,
        oldValue:  oldValue  || undefined,
        newValue:  newValue  || undefined,
        ip:        ip || null,
      },
    });
  } catch (err) {
    // Audit failures must never crash the main request
    logger.error('Audit log failed:', err.message);
  }
}

module.exports = { auditLog };

// Alias for v7 controllers that call logAudit({ req, action, entity, entityId, newValue })
async function logAudit({ req, action, entity, entityId, newValue, oldValue } = {}) {
  return auditLog({
    userId:    req?.user?.id,
    userEmail: req?.user?.email,
    action,
    entity,
    entityId,
    oldValue,
    newValue,
    ip: req?.ip,
  });
}

module.exports.logAudit = logAudit;
