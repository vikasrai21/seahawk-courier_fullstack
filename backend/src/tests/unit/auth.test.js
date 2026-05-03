import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
const bcrypt = require('bcryptjs');

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock('../../config/prisma', () => require('../../config/__mocks__/prisma.js'));
const mockPrisma = require('../../config/__mocks__/prisma.js');

vi.mock('../../config', () => ({
  default: {
    jwt: { secret: 'test-jwt-secret-32-characters-ok', refreshSecret: 'test-refresh-secret-32-chars-ok', accessExpiresIn: '1h' },
    cookie: { secure: false, sameSite: 'lax' },
  },
  jwt: { secret: 'test-jwt-secret-32-characters-ok', refreshSecret: 'test-refresh-secret-32-chars-ok', accessExpiresIn: '1h' },
}));

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}));

vi.mock('../../utils/owner', () => ({ isOwnerUser: vi.fn(() => false) }));

const authService = await import('../../services/auth.service.js');


describe('auth.service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Re-establish transaction mock which resetAllMocks wipes
    mockPrisma.$transaction.mockImplementation((arg) => {
      if (typeof arg === 'function') return arg(mockPrisma._mockTx);
      return Promise.all(arg);
    });
  });

  // ── sanitise ─────────────────────────────────────────────────────────────
  describe('sanitise', () => {
    it('strips HTML tags', () => {
      expect(authService.sanitise('<b>Hello</b>')).toBe('Hello');
    });
    it('strips javascript: URIs', () => {
      expect(authService.sanitise('javascript:alert(1)')).toBe('alert(1)');
    });
    it('returns non-string values unchanged', () => {
      expect(authService.sanitise(null)).toBeNull();
      expect(authService.sanitise(undefined)).toBeUndefined();
    });
    it('trims whitespace', () => {
      expect(authService.sanitise('  hello  ')).toBe('hello');
    });
  });

  // ── login ────────────────────────────────────────────────────────────────
  describe('login', () => {
    it('throws on invalid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(authService.login('bad@xyz.com', 'pass')).rejects.toThrow('Invalid email or password.');
    });

    it('throws on inactive user', async () => {
      const hash = await bcrypt.hash('correct', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1, email: 'x@x.com', password: hash, role: 'ADMIN', active: false,
        clientProfile: null,
      });
      await expect(authService.login('x@x.com', 'correct')).rejects.toThrow('Invalid email or password.');
    });

    it('returns tokens and user on success', async () => {
      const hash = await bcrypt.hash('correct', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1, email: 'admin@seahawk.com', password: hash, role: 'ADMIN', active: true,
        clientProfile: null,
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await authService.login('admin@seahawk.com', 'correct');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('admin@seahawk.com');
      expect(result.user).not.toHaveProperty('password');
    });
  });

  // ── refreshAccessToken ───────────────────────────────────────────────────
  describe('refreshAccessToken', () => {
    it('returns new access and rotated refresh token from DB-stored refresh token', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      mockPrisma._mockTx.refreshToken.findUnique.mockResolvedValue({
        token: 'validtoken', userId: 1, expiresAt: futureDate, revokedAt: null,
      });
      mockPrisma._mockTx.user.findUnique.mockResolvedValue({ id: 1, email: 'a@a.com', role: 'ADMIN', active: true });
      mockPrisma._mockTx.refreshToken.update.mockResolvedValue({});
      mockPrisma._mockTx.refreshToken.create.mockResolvedValue({});

      const result = await authService.refreshAccessToken('validtoken');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockPrisma._mockTx.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { token: 'validtoken' } }),
      );
      expect(mockPrisma._mockTx.refreshToken.create).toHaveBeenCalled();
    });

    it('throws for revoked token and revokes active token family', async () => {
      mockPrisma._mockTx.refreshToken.findUnique.mockResolvedValue({
        token: 'revokedtoken', userId: 1, expiresAt: new Date('2099-01-01'), revokedAt: new Date(),
      });
      mockPrisma._mockTx.refreshToken.updateMany.mockResolvedValue({ count: 2 });
      await expect(authService.refreshAccessToken('revokedtoken')).rejects.toThrow();
      expect(mockPrisma._mockTx.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 1, revokedAt: null } }),
      );
    });

    it('throws for expired DB token', async () => {
      mockPrisma._mockTx.refreshToken.findUnique.mockResolvedValue({
        token: 'expiredtoken', userId: 1, expiresAt: new Date('2020-01-01'), revokedAt: null,
      });
      await expect(authService.refreshAccessToken('expiredtoken')).rejects.toThrow();
    });

    it('upgrades legacy JWT refresh to rotated DB token', async () => {
      mockPrisma._mockTx.refreshToken.findUnique.mockResolvedValue(null);
      vi.spyOn(jwt, 'verify').mockReturnValue({ id: 1 });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: 'legacy@x.com', role: 'ADMIN', active: true });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await authService.refreshAccessToken('legacy-jwt-token');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
    });
  });

  // ── revokeRefreshToken ───────────────────────────────────────────────────
  describe('revokeRefreshToken', () => {
    it('no-ops on empty token', async () => {
      await authService.revokeRefreshToken('');
      expect(mockPrisma.refreshToken.update).not.toHaveBeenCalled();
    });

    it('marks token as revoked', async () => {
      mockPrisma.refreshToken.update.mockResolvedValue({});
      await authService.revokeRefreshToken('sometoken');
      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { token: 'sometoken' } }),
      );
    });
  });

  // ── revokeAllUserTokens ──────────────────────────────────────────────────
  describe('revokeAllUserTokens', () => {
    it('revokes all tokens for a user', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 3 });
      await authService.revokeAllUserTokens(1);
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 1, revokedAt: null } }),
      );
    });
  });

  // ── cleanupExpiredTokens ─────────────────────────────────────────────────
  describe('cleanupExpiredTokens', () => {
    it('deletes expired and revoked tokens', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 5 });
      await authService.cleanupExpiredTokens();
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalled();
    });
  });

  // ── createUser ───────────────────────────────────────────────────────────
  describe('createUser', () => {
    it('throws on duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
      await expect(authService.createUser({ email: 'dup@x.com', password: 'Pass123!', name: 'Test' }))
        .rejects.toThrow('Email already registered.');
    });

    it('throws on invalid role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(authService.createUser({ email: 'new@x.com', password: 'Pass123!', name: 'Test', role: 'HACKER' }))
        .rejects.toThrow('Invalid role.');
    });

    it('throws when CLIENT role missing clientCode', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(authService.createUser({ email: 'new@x.com', password: 'Pass123!', name: 'Test', role: 'CLIENT' }))
        .rejects.toThrow('clientCode is required');
    });

    it('creates a user with hashed password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 2, name: 'Test', email: 'new@x.com', role: 'STAFF', branch: null, active: true, createdAt: new Date(),
      });
      const user = await authService.createUser({ email: 'new@x.com', password: 'Pass123!', name: 'Test' });
      expect(user.email).toBe('new@x.com');
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('creates CLIENT user with clientUser link', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null) // no dup email
        .mockResolvedValueOnce(null); // not used
      mockPrisma.client.findUnique.mockResolvedValue({ code: 'TEST' });
      mockPrisma.user.create.mockResolvedValue({
        id: 3, name: 'Client', email: 'c@x.com', role: 'CLIENT', branch: null, active: true, createdAt: new Date(),
      });
      mockPrisma.clientUser.create.mockResolvedValue({});
      const user = await authService.createUser({ email: 'c@x.com', password: 'Pass123!', name: 'Client', role: 'CLIENT', clientCode: 'TEST' });
      expect(user.clientCode).toBe('TEST');
      expect(mockPrisma.clientUser.create).toHaveBeenCalled();
    });
  });

  // ── updateUser ───────────────────────────────────────────────────────────
  describe('updateUser', () => {
    it('hashes password if provided', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: 'u@x.com', role: 'ADMIN', active: true, clientProfile: null });
      mockPrisma._mockTx.user.update.mockResolvedValue({ id: 1, name: 'U', email: 'u@x.com', role: 'ADMIN', active: true });
      mockPrisma._mockTx.clientUser.deleteMany.mockResolvedValue({ count: 0 });
      await authService.updateUser(1, { password: 'NewPass123!' });
      const call = mockPrisma._mockTx.user.update.mock.calls[0][0];
      expect(call.data.password).not.toBe('NewPass123!'); // should be hashed
    });

    it('lowercases email', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 1, email: 'u@x.com', role: 'ADMIN', active: true, clientProfile: null })
        .mockResolvedValueOnce(null);
      mockPrisma._mockTx.user.update.mockResolvedValue({ id: 1, email: 'u@x.com', role: 'ADMIN', active: true });
      mockPrisma._mockTx.clientUser.deleteMany.mockResolvedValue({ count: 0 });
      await authService.updateUser(1, { email: 'User@EXAMPLE.COM' });
      const call = mockPrisma._mockTx.user.update.mock.calls[0][0];
      expect(call.data.email).toBe('user@example.com');
    });

    it('revokes tokens when deactivating', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: 'u@x.com', role: 'STAFF', active: true, clientProfile: null });
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma._mockTx.user.update.mockResolvedValue({ id: 1, email: 'u@x.com', role: 'STAFF', active: false });
      mockPrisma._mockTx.clientUser.deleteMany.mockResolvedValue({ count: 0 });
      await authService.updateUser(1, { active: false });
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalled();
    });

    it('upserts client link when updating CLIENT user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 2, email: 'client@x.com', role: 'CLIENT', active: true, clientProfile: { clientCode: 'OLD' } });
      mockPrisma.client.findUnique.mockResolvedValue({ code: 'NEW' });
      mockPrisma._mockTx.user.update.mockResolvedValue({ id: 2, email: 'client@x.com', role: 'CLIENT', active: true });
      mockPrisma._mockTx.clientUser.upsert.mockResolvedValue({});

      await authService.updateUser(2, { role: 'CLIENT', clientCode: 'new' });

      expect(mockPrisma._mockTx.clientUser.upsert).toHaveBeenCalledWith({
        where: { userId: 2 },
        update: { clientCode: 'NEW' },
        create: { userId: 2, clientCode: 'NEW' },
      });
    });
  });

  describe('deleteUser', () => {
    it('deletes a user account', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 9,
        name: 'Client User',
        email: 'client@x.com',
        role: 'CLIENT',
        branch: null,
        active: true,
        clientProfile: { clientCode: 'SEA' },
      });
      mockPrisma.user.delete.mockResolvedValue({});

      const deleted = await authService.deleteUser(9, 1);

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 9 } });
      expect(deleted.clientCode).toBe('SEA');
    });

    it('blocks self-delete', async () => {
      await expect(authService.deleteUser(3, 3)).rejects.toThrow('You cannot delete your own account.');
    });
  });

  // ── changePassword ───────────────────────────────────────────────────────
  describe('changePassword', () => {
    it('throws on wrong current password', async () => {
      const hash = await bcrypt.hash('correct', 12);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, password: hash });
      await expect(authService.changePassword(1, 'wrong', 'NewPass123!')).rejects.toThrow('Current password is incorrect.');
    });

    it('updates password and revokes tokens', async () => {
      const hash = await bcrypt.hash('correct', 12);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, password: hash });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.refreshToken.updateMany.mockResolvedValue({});
      await authService.changePassword(1, 'correct', 'NewPass123!');
      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalled();
    }, 10000);
  });

  // ── getAllUsers ───────────────────────────────────────────────────────────
  describe('getAllUsers', () => {
    it('returns users with flattened clientCode', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 1, name: 'Admin', email: 'a@a.com', role: 'ADMIN', clientProfile: null },
        { id: 2, name: 'Client', email: 'c@c.com', role: 'CLIENT', clientProfile: { clientCode: 'XYZ' } },
      ]);
      const users = await authService.getAllUsers();
      expect(users).toHaveLength(2);
      expect(users[0].clientCode).toBeNull();
      expect(users[1].clientCode).toBe('XYZ');
    });
  });
});
