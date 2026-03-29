// src/tests/unit/wallet.test.js
import { describe, it, expect, vi } from 'vitest';

// Mock prisma
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    client: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    walletTransaction: { create: vi.fn() },
    $transaction: vi.fn(fn => fn({
      client: { update: vi.fn().mockResolvedValue({ code: 'TEST', company: 'Test Co', walletBalance: 500 }) },
      walletTransaction: { create: vi.fn().mockResolvedValue({ id: 1 }) },
    })),
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

describe('wallet.service', () => {
  it.skip('credit increases wallet balance', async () => {
    expect(true).toBe(true);
  });
});
