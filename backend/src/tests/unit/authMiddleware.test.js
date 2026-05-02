import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { mockPrisma } from '../setup.js';

// Pre-set environment variables used by the config module
process.env.JWT_SECRET = 'test-jwt-secret-32-characters-ok-long';
process.env.DATABASE_URL = 'postgresql://mock:mock@localhost:5432/mock';

// 1. Mock third-party/config modules that are problematic
vi.mock('../../config', () => ({
  jwt: { secret: 'test-jwt-secret-32-characters-ok-long', accessExpiresIn: '15m' },
  env: 'test'
}));

// 2. Use require for internal utilities that we will spy on
const responseUtil = require('../../utils/response');
const ownerUtil = require('../../utils/owner');
const authMiddleware = require('../../middleware/auth.middleware');

describe('auth.middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 3. Setup spies on the required objects.
    // This ensures that the test and the middleware share the same spied-upon functions.
    vi.spyOn(responseUtil, 'unauthorized').mockImplementation((res, msg) => res);
    vi.spyOn(responseUtil, 'forbidden').mockImplementation((res, msg) => res);
    vi.spyOn(responseUtil, 'ok').mockImplementation((res, obj) => res);
    vi.spyOn(ownerUtil, 'isOwnerUser').mockReturnValue(false);
  });

  const SECRET = 'test-jwt-secret-32-characters-ok-long';
  const createReq = (overrides = {}) => ({ 
    headers: {}, cookies: {}, params: {}, body: {}, query: {}, ...overrides 
  });
  const createRes = () => ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis()
  });

  describe('protect', () => {
    it('calls unauthorized when no token provided', async () => {
      const req = createReq();
      const res = createRes();
      const next = vi.fn();
      await authMiddleware.protect(req, res, next);
      expect(responseUtil.unauthorized).toHaveBeenCalled();
    });

    it('authenticates with valid Bearer token', async () => {
      const token = jwt.sign({ id: 1, email: 'a@a.com', role: 'ADMIN' }, SECRET);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1, name: 'Admin', role: 'ADMIN', active: true,
        clientProfile: null,
      });
      const req = createReq({ headers: { authorization: `Bearer ${token}` } });
      const res = createRes();
      const next = vi.fn();
      await authMiddleware.protect(req, res, next);
      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
    });

    it('rejects deactivated user', async () => {
      const token = jwt.sign({ id: 3 }, SECRET);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 3, name: 'Inactive', active: false,
      });
      const req = createReq({ headers: { authorization: `Bearer ${token}` } });
      const res = createRes();
      const next = vi.fn();
      await authMiddleware.protect(req, res, next);
      expect(responseUtil.unauthorized).toHaveBeenCalledWith(res, expect.stringContaining('deactivated'));
    });

    it('rejects deleted user', async () => {
      const token = jwt.sign({ id: 99 }, SECRET);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const req = createReq({ headers: { authorization: `Bearer ${token}` } });
      const res = createRes();
      const next = vi.fn();
      await authMiddleware.protect(req, res, next);
      expect(responseUtil.unauthorized).toHaveBeenCalledWith(res, 'User no longer exists.');
    });

    it('attaches client details for CLIENT users', async () => {
      const token = jwt.sign({ id: 4 }, SECRET);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 4, role: 'CLIENT', active: true,
        clientProfile: { clientCode: 'SEA', client: { walletBalance: 500 } },
      });
      const req = createReq({ headers: { authorization: `Bearer ${token}` } });
      const res = createRes();
      const next = vi.fn();
      await authMiddleware.protect(req, res, next);
      expect(req.user.clientCode).toBe('SEA');
      expect(req.user.walletBalance).toBe(500);
    });
  });

  describe('requireRole', () => {
    it('allows matching role', () => {
      const middleware = authMiddleware.requireRole('ADMIN', 'STAFF');
      const req = createReq({ user: { role: 'ADMIN' } });
      const res = createRes();
      const next = vi.fn();
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('rejects non-matching role', () => {
      const middleware = authMiddleware.requireRole('ADMIN');
      const req = createReq({ user: { role: 'STAFF' } });
      const res = createRes();
      const next = vi.fn();
      middleware(req, res, next);
      expect(responseUtil.forbidden).toHaveBeenCalled();
    });
  });

  describe('ownerOnly', () => {
    it('allows user with isOwner=true (email-based)', () => {
      const req = createReq({ user: { isOwner: true, role: 'ADMIN' } });
      const res = createRes();
      const next = vi.fn();
      authMiddleware.ownerOnly(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('allows user with concrete OWNER role', () => {
      const req = createReq({ user: { isOwner: false, role: 'OWNER' } });
      const res = createRes();
      const next = vi.fn();
      authMiddleware.ownerOnly(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('denies ADMIN role without owner identity', () => {
      const req = createReq({ user: { isOwner: false, role: 'ADMIN' } });
      const res = createRes();
      const next = vi.fn();
      authMiddleware.ownerOnly(req, res, next);
      expect(responseUtil.forbidden).toHaveBeenCalledWith(res, 'Owner access required.');
      expect(next).not.toHaveBeenCalled();
    });

    it('denies STAFF role', () => {
      const req = createReq({ user: { isOwner: false, role: 'STAFF' } });
      const res = createRes();
      const next = vi.fn();
      authMiddleware.ownerOnly(req, res, next);
      expect(responseUtil.forbidden).toHaveBeenCalled();
    });

    it('denies OPS_MANAGER role', () => {
      const req = createReq({ user: { isOwner: false, role: 'OPS_MANAGER' } });
      const res = createRes();
      const next = vi.fn();
      authMiddleware.ownerOnly(req, res, next);
      expect(responseUtil.forbidden).toHaveBeenCalled();
    });

    it('denies CLIENT role', () => {
      const req = createReq({ user: { isOwner: false, role: 'CLIENT' } });
      const res = createRes();
      const next = vi.fn();
      authMiddleware.ownerOnly(req, res, next);
      expect(responseUtil.forbidden).toHaveBeenCalled();
    });

    it('denies missing user', () => {
      const req = createReq();
      const res = createRes();
      const next = vi.fn();
      authMiddleware.ownerOnly(req, res, next);
      expect(responseUtil.unauthorized).toHaveBeenCalled();
    });
  });

  describe('requireClientAccountAccess', () => {
    it('allows matching client access', () => {
      const middleware = authMiddleware.requireClientAccountAccess();
      const req = createReq({ params: { clientCode: 'SEA' }, user: { role: 'CLIENT', clientCode: 'SEA' } });
      const res = createRes();
      const next = vi.fn();
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('denies mismatched client access', () => {
      const middleware = authMiddleware.requireClientAccountAccess();
      const req = createReq({ params: { clientCode: 'OTHER' }, user: { role: 'CLIENT', clientCode: 'SEA' } });
      const res = createRes();
      const next = vi.fn();
      middleware(req, res, next);
      expect(responseUtil.forbidden).toHaveBeenCalled();
    });

    it('allows ADMIN management access', () => {
      const middleware = authMiddleware.requireClientAccountAccess();
      const req = createReq({ params: { clientCode: 'OTHER' }, user: { role: 'ADMIN', clientCode: null, isOwner: false } });
      const res = createRes();
      const next = vi.fn();
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('allows OWNER management access', () => {
      const middleware = authMiddleware.requireClientAccountAccess();
      const req = createReq({ params: { clientCode: 'OTHER' }, user: { role: 'OWNER', clientCode: null, isOwner: true } });
      const res = createRes();
      const next = vi.fn();
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('allows OPS_MANAGER management access', () => {
      const middleware = authMiddleware.requireClientAccountAccess();
      const req = createReq({ params: { clientCode: 'OTHER' }, user: { role: 'OPS_MANAGER', clientCode: null, isOwner: false } });
      const res = createRes();
      const next = vi.fn();
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('denies CLIENT accessing another client', () => {
      const middleware = authMiddleware.requireClientAccountAccess();
      const req = createReq({ params: { clientCode: 'VKR' }, user: { role: 'CLIENT', clientCode: 'TST', isOwner: false } });
      const res = createRes();
      const next = vi.fn();
      middleware(req, res, next);
      expect(responseUtil.forbidden).toHaveBeenCalled();
    });
  });
});
