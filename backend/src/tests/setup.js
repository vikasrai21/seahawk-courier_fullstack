// Mock Prisma so tests don't need a real database
import { vi } from 'vitest';

const mockPrisma = {
  shipment:   { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
  client:     { findMany: vi.fn(), findUnique: vi.fn(), upsert: vi.fn(), delete: vi.fn(), count: vi.fn(), update: vi.fn() },
  user:       { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  auditLog:   { create: vi.fn() },
  refreshToken: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
  walletTransaction: { create: vi.fn(), update: vi.fn(), findFirst: vi.fn(), count: vi.fn(), findMany: vi.fn() },
  trackingEvent: { create: vi.fn() },
  $queryRaw:  vi.fn(),
  $transaction: vi.fn((arg) => {
    if (typeof arg === 'function') {
      return arg({
        shipment: { create: vi.fn(), update: vi.fn() },
        client:   { update: vi.fn(), findUnique: vi.fn() },
        walletTransaction: { create: vi.fn() },
      });
    }
    return Promise.all(arg);
  }),
  $disconnect: vi.fn(),
};

vi.mock('../config/prisma', () => ({
  ...mockPrisma,
  default: mockPrisma,
}));
