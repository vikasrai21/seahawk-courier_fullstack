'use strict';
/**
 * agentSession.js — In-Memory Session State Manager for HawkAI
 * 
 * Tracks active conversational flows per user/session.
 * Auto-expires after 5 minutes of inactivity.
 */

const logger = require('./logger');

const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// Map<sessionId, SessionState>
const sessions = new Map();

/**
 * @typedef {Object} SessionState
 * @property {string} flowId - Active flow ID (e.g. 'CREATE_CLIENT')
 * @property {Object} collectedParams - Params collected so far { code: 'ABC', company: 'Acme' }
 * @property {string|null} pendingField - The field key we're currently asking about
 * @property {boolean} awaitingConfirmation - True if all fields collected and awaiting yes/no
 * @property {number} startedAt - Timestamp
 * @property {number} lastActivity - Timestamp of last interaction
 */

function getSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;

  // Check expiry
  if (Date.now() - session.lastActivity > SESSION_TIMEOUT_MS) {
    sessions.delete(sessionId);
    logger.info(`[HawkAI Session] Expired session ${sessionId}`);
    return null;
  }

  return session;
}

function startSession(sessionId, flowId) {
  const session = {
    flowId,
    collectedParams: {},
    pendingField: null,
    awaitingConfirmation: false,
    startedAt: Date.now(),
    lastActivity: Date.now(),
  };
  sessions.set(sessionId, session);
  logger.info(`[HawkAI Session] Started flow ${flowId} for session ${sessionId}`);
  return session;
}

function updateSession(sessionId, updates) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  Object.assign(session, updates, { lastActivity: Date.now() });
  return session;
}

function clearSession(sessionId) {
  sessions.delete(sessionId);
}

function getActiveCount() {
  // Purge expired
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.lastActivity > SESSION_TIMEOUT_MS) sessions.delete(id);
  }
  return sessions.size;
}

module.exports = {
  getSession,
  startSession,
  updateSession,
  clearSession,
  getActiveCount,
};
