/* global vi */
// src/config/__mocks__/prisma.js

const mockTx = {
  shipment: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
  client: { update: vi.fn(), findUnique: vi.fn(), upsert: vi.fn() },
  walletTransaction: { create: vi.fn(), findFirst: vi.fn() },
};

const mockPrisma = {
  shipment:   { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
  client:     { findMany: vi.fn(), findUnique: vi.fn(), upsert: vi.fn(), delete: vi.fn(), count: vi.fn(), update: vi.fn() },
  user:       { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  clientUser: { create: vi.fn() },
  contract:   { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  invoice:    { findFirst: vi.fn(), create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  quote:      { findFirst: vi.fn(), create: vi.fn(), count: vi.fn(), findMany: vi.fn(), update: vi.fn(), groupBy: vi.fn(), aggregate: vi.fn() },
  jobQueue:   { create: vi.fn(), update: vi.fn(), count: vi.fn() },
  nDREvent:   { findMany: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn() },
  auditLog:   { create: vi.fn(), findMany: vi.fn() },
  refreshToken: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
  walletTransaction: { create: vi.fn(), update: vi.fn(), findFirst: vi.fn(), count: vi.fn(), findMany: vi.fn() },
  trackingEvent: { create: vi.fn(), createMany: vi.fn(), findMany: vi.fn(), count: vi.fn() },
  pickupRequest: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), count: vi.fn() },
  courierInvoice: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), count: vi.fn() },
  delhiveryPincode: { findUnique: vi.fn() },
  draftOrder: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), count: vi.fn(), update: vi.fn(), delete: vi.fn() },
  clientApiKey: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), count: vi.fn() },
  returnRequest: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
  $queryRaw:  vi.fn(),
  $executeRaw: vi.fn(),
  $transaction: vi.fn((arg) => {
    if (typeof arg === 'function') {
      return arg(mockTx);
    }
    return Promise.all(arg);
  }),
  $disconnect: vi.fn(),
};

mockPrisma._mockTx = mockTx;
module.exports = mockPrisma;
