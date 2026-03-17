// Mock Prisma so tests don't need a real database
import { vi } from 'vitest';

vi.mock('../config/prisma', () => ({
  default: {
    shipment:   { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    client:     { findMany: vi.fn(), findUnique: vi.fn(), upsert: vi.fn(), delete: vi.fn(), count: vi.fn() },
    user:       { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    auditLog:   { create: vi.fn() },
    $queryRaw:  vi.fn(),
    $transaction: vi.fn((fn) => fn({
      shipment: { create: vi.fn(), update: vi.fn() },
      client:   { update: vi.fn() },
      walletTransaction: { create: vi.fn() },
    })),
    $disconnect: vi.fn(),
  },
}));
