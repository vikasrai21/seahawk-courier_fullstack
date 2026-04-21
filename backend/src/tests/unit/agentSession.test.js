import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock logger to avoid noise
vi.mock('../../utils/logger', () => ({
  info:  vi.fn(),
  warn:  vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}));

const sessionManager = require('../../utils/agentSession');

describe('agentSession', () => {
  beforeEach(() => {
    // Clear all sessions between tests
    sessionManager.clearSession('sess-1');
    sessionManager.clearSession('sess-2');
    sessionManager.clearSession('sess-timeout');
  });

  describe('startSession', () => {
    it('creates a new session with correct initial state', () => {
      const session = sessionManager.startSession('sess-1', 'CREATE_CLIENT');
      expect(session.flowId).toBe('CREATE_CLIENT');
      expect(session.collectedParams).toEqual({});
      expect(session.pendingField).toBeNull();
      expect(session.awaitingConfirmation).toBe(false);
      expect(session.startedAt).toBeDefined();
      expect(session.lastActivity).toBeDefined();
    });

    it('overwrites existing session for same sessionId', () => {
      sessionManager.startSession('sess-1', 'CREATE_CLIENT');
      const session = sessionManager.startSession('sess-1', 'WALLET_CREDIT');
      expect(session.flowId).toBe('WALLET_CREDIT');
    });
  });

  describe('getSession', () => {
    it('returns active session', () => {
      sessionManager.startSession('sess-2', 'TRACK_SHIPMENT');
      const session = sessionManager.getSession('sess-2');
      expect(session).not.toBeNull();
      expect(session.flowId).toBe('TRACK_SHIPMENT');
    });

    it('returns null for non-existent session', () => {
      expect(sessionManager.getSession('ghost-session')).toBeNull();
    });

    it('returns null and cleans up an expired session', () => {
      const session = sessionManager.startSession('sess-timeout', 'GENERATE_INVOICE');
      // Manually simulate timeout by backdating lastActivity
      session.lastActivity = Date.now() - 6 * 60 * 1000; // 6 minutes ago
      const result = sessionManager.getSession('sess-timeout');
      expect(result).toBeNull();
      // Verify it's cleaned up
      expect(sessionManager.getSession('sess-timeout')).toBeNull();
    });
  });

  describe('updateSession', () => {
    it('merges new data into existing session', () => {
      sessionManager.startSession('sess-1', 'CREATE_CLIENT');
      const updated = sessionManager.updateSession('sess-1', {
        pendingField: 'code',
        collectedParams: { company: 'Acme Ltd' },
      });
      expect(updated.pendingField).toBe('code');
      expect(updated.collectedParams.company).toBe('Acme Ltd');
    });

    it('updates lastActivity timestamp', async () => {
      sessionManager.startSession('sess-1', 'CREATE_CLIENT');
      const before = sessionManager.getSession('sess-1').lastActivity;
      await new Promise(r => setTimeout(r, 5));
      sessionManager.updateSession('sess-1', { pendingField: 'phone' });
      const after = sessionManager.getSession('sess-1').lastActivity;
      expect(after).toBeGreaterThanOrEqual(before);
    });

    it('returns null when session does not exist', () => {
      const result = sessionManager.updateSession('nonexistent', { pendingField: 'x' });
      expect(result).toBeNull();
    });
  });

  describe('clearSession', () => {
    it('removes session so getSession returns null', () => {
      sessionManager.startSession('sess-1', 'WALLET_CREDIT');
      sessionManager.clearSession('sess-1');
      expect(sessionManager.getSession('sess-1')).toBeNull();
    });

    it('does not throw when clearing a non-existent session', () => {
      expect(() => sessionManager.clearSession('never-existed')).not.toThrow();
    });
  });

  describe('getActiveCount', () => {
    it('returns correct count of active sessions', () => {
      sessionManager.clearSession('sess-1');
      sessionManager.clearSession('sess-2');
      sessionManager.startSession('sess-1', 'SYSTEM_OVERVIEW');
      sessionManager.startSession('sess-2', 'LIST_CLIENTS');
      expect(sessionManager.getActiveCount()).toBeGreaterThanOrEqual(2);
    });
  });
});
