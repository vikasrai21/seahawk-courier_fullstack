// src/tests/unit/wallet.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('../../config/prisma', () => ({
  default: {
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

import walletSvc from '../../services/wallet.service.js';

describe('wallet.service', () => {
  it('credit increases wallet balance', async () => {
    const result = await walletSvc.credit({ clientCode: 'TEST', amount: 500, description: 'Top-up', reference: 'REF001' });
    expect(result.wallet.walletBalance).toBe(500);
  });
});
