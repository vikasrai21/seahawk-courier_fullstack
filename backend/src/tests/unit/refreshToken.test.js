// src/tests/unit/refreshToken.test.js — Tests for persisted refresh token logic
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/prisma', () => ({
  default: {
    refreshToken: {
      create:     vi.fn().mockResolvedValue({ id: 1 }),
      findUnique: vi.fn(),
      update:     vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 2 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 5 }),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../config/index', () => ({
  default: {
    jwt: { secret: 'test-secret', accessExpiresIn: '15m', refreshSecret: 'test-refresh' },
  },
}));

import prisma from '../../config/prisma.js';

describe('refresh token security', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('rejects revoked refresh token', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 1, token: 'revoked-token', userId: 1,
      revokedAt: new Date('2024-01-01'),
      expiresAt: new Date(Date.now() + 86400000),
    });

    const { refreshAccessToken } = await import('../../services/auth.service.js');
    await expect(refreshAccessToken('revoked-token')).rejects.toThrow('Invalid or expired refresh token');
  });

  it('rejects expired refresh token', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 1, token: 'old-token', userId: 1,
      revokedAt: null,
      expiresAt: new Date('2020-01-01'), // in the past
    });

    const { refreshAccessToken } = await import('../../services/auth.service.js');
    await expect(refreshAccessToken('old-token')).rejects.toThrow('Invalid or expired refresh token');
  });

  it('revokeAllUserTokens marks all tokens revoked', async () => {
    const { revokeAllUserTokens } = await import('../../services/auth.service.js');
    await revokeAllUserTokens(1);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 1, revokedAt: null },
      data:  { revokedAt: expect.any(Date) },
    });
  });

  it('cleanupExpiredTokens deletes expired records', async () => {
    const { cleanupExpiredTokens } = await import('../../services/auth.service.js');
    await cleanupExpiredTokens();
    expect(prisma.refreshToken.deleteMany).toHaveBeenCalled();
  });
});
