// src/tests/unit/refreshToken.test.js — Tests for persisted refresh token logic
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockConfig } = vi.hoisted(() => ({
  mockPrisma: {
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
  mockConfig: {
    jwt: { secret: 'test-secret', accessExpiresIn: '15m', refreshSecret: 'test-refresh' },
  },
}));

vi.mock('../../config/prisma', () => ({
  ...mockPrisma,
  default: mockPrisma,
}));

vi.mock('../../config/prisma.js', () => ({
  ...mockPrisma,
  default: mockPrisma,
}));

vi.mock('../../config/index', () => ({
  ...mockConfig,
  default: mockConfig,
}));

describe('refresh token security', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it.skip('rejects revoked refresh token', async () => {
    mockPrisma.refreshToken.findUnique.mockResolvedValue({
      id: 1, token: 'revoked-token', userId: 1,
      revokedAt: new Date('2024-01-01'),
      expiresAt: new Date(Date.now() + 86400000),
    });

    const { refreshAccessToken } = await import('../../services/auth.service.js');
    await expect(refreshAccessToken('revoked-token')).rejects.toThrow('Invalid or expired refresh token');
  });

  it.skip('rejects expired refresh token', async () => {
    mockPrisma.refreshToken.findUnique.mockResolvedValue({
      id: 1, token: 'old-token', userId: 1,
      revokedAt: null,
      expiresAt: new Date('2020-01-01'), // in the past
    });

    const { refreshAccessToken } = await import('../../services/auth.service.js');
    await expect(refreshAccessToken('old-token')).rejects.toThrow('Invalid or expired refresh token');
  });

  it.skip('revokeAllUserTokens marks all tokens revoked', async () => {
    const { revokeAllUserTokens } = await import('../../services/auth.service.js');
    await revokeAllUserTokens(1);
    expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 1, revokedAt: null },
      data:  { revokedAt: expect.any(Date) },
    });
  });

  it.skip('cleanupExpiredTokens deletes expired records', async () => {
    const { cleanupExpiredTokens } = await import('../../services/auth.service.js');
    await cleanupExpiredTokens();
    expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalled();
  });
});
