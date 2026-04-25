import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma, mockTx } from '../setup.js';

// ── Mock all external dependencies ──────────────────────────────────────────
vi.mock('../../middleware/errorHandler', () => ({
  AppError: class AppError extends Error {
    constructor(message, statusCode) { super(message); this.statusCode = statusCode; this.isOperational = true; }
  },
}));
vi.mock('../../utils/logger', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('../../utils/cache', () => ({ default: { delByPrefix: vi.fn().mockResolvedValue(undefined), get: vi.fn().mockResolvedValue(null), set: vi.fn().mockResolvedValue(undefined) } }));
vi.mock('../../services/notification.service', () => ({ default: { notifyStatusChange: vi.fn(), sendPODEmail: vi.fn() } }));
vi.mock('../../realtime/socket', () => ({ emitShipmentCreated: vi.fn(), emitShipmentStatusUpdated: vi.fn() }));
vi.mock('../../services/stateMachine', () => ({
  default: { assertValidTransition: vi.fn(), shouldRefund: vi.fn(() => false), shouldNotify: vi.fn(() => false), isTerminal: vi.fn(() => false), getValidTransitions: vi.fn(() => []), normalizeStatus: vi.fn((s) => s) },
  assertValidTransition: vi.fn(), shouldRefund: vi.fn(() => false), shouldNotify: vi.fn(() => false), isTerminal: vi.fn(() => false), getValidTransitions: vi.fn(() => []), normalizeStatus: vi.fn((s) => s),
}));
vi.mock('../../services/wallet.service', () => ({ default: { creditShipmentRefund: vi.fn() }, creditShipmentRefund: vi.fn() }));
vi.mock('../../services/riskAnalysis.service', () => ({ default: { analyzeShipment: vi.fn() }, analyzeShipment: vi.fn() }));
vi.mock('../../services/import-ledger.service', () => ({ default: { ensureTable: vi.fn(), insertRow: vi.fn() }, ensureTable: vi.fn(), insertRow: vi.fn() }));

const queueMocks = vi.hoisted(() => ({ enqueueTrackingSync: vi.fn() }));
vi.mock('../../services/queue.service', () => ({
  default: { enqueueTrackingSync: queueMocks.enqueueTrackingSync },
  enqueueTrackingSync: queueMocks.enqueueTrackingSync,
}));

const shipmentService = await import('../../services/shipment.service.js');

// ── CLIENT DATA ─────────────────────────────────────────────────────────────
const CLIENT_A = {
  code: 'ALPHA',
  company: 'Alpha Corp',
  walletBalance: 10000,
};

const CLIENT_B = {
  code: 'BETA',
  company: 'Beta Industries',
  walletBalance: 5000,
};

const SHIPMENT_A1 = { id: 1, awb: 'ALPHA001', clientCode: 'ALPHA', consignee: 'JOHN', destination: 'MUMBAI', status: 'Booked', amount: 300, weight: 1.5, courier: 'Delhivery', date: '2026-04-25' };
const SHIPMENT_A2 = { id: 2, awb: 'ALPHA002', clientCode: 'ALPHA', consignee: 'JANE', destination: 'DELHI', status: 'InTransit', amount: 450, weight: 2.0, courier: 'DTDC', date: '2026-04-25' };
const SHIPMENT_B1 = { id: 3, awb: 'BETA001',  clientCode: 'BETA',  consignee: 'BOB',  destination: 'PUNE', status: 'Booked', amount: 200, weight: 1.0, courier: 'Trackon', date: '2026-04-25' };
const SHIPMENT_B2 = { id: 4, awb: 'BETA002',  clientCode: 'BETA',  consignee: 'ALICE', destination: 'KOLKATA', status: 'Delivered', amount: 350, weight: 3.0, courier: 'Delhivery', date: '2026-04-25' };

const ALL_SHIPMENTS = [SHIPMENT_A1, SHIPMENT_A2, SHIPMENT_B1, SHIPMENT_B2];

describe('Tenant Scoping & Cross-Client Isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$queryRawUnsafe = vi.fn().mockResolvedValue([{}]);
    mockPrisma.$executeRawUnsafe = vi.fn().mockResolvedValue({});
    mockPrisma.shipment.findUnique = vi.fn().mockResolvedValue(null);
    mockPrisma.$transaction.mockImplementation(async (fn) => {
      if (typeof fn === 'function') return fn(mockTx);
      return Promise.all(fn);
    });
  });

  // ─── getAll() filters by clientCode ───────────────────────────────────────
  describe('getAll() — client filter enforcement', () => {
    it('returns ONLY Client A shipments when filtered by client=ALPHA', async () => {
      const alphaShipments = ALL_SHIPMENTS.filter(s => s.clientCode === 'ALPHA');
      mockPrisma.shipment.count = vi.fn().mockResolvedValue(alphaShipments.length);
      mockPrisma.shipment.findMany = vi.fn().mockResolvedValue(alphaShipments);

      const result = await shipmentService.getAll({ client: 'ALPHA' }, 1, 50);

      expect(result.shipments).toHaveLength(2);
      expect(result.shipments.every(s => s.clientCode === 'ALPHA')).toBe(true);
      expect(result.shipments.some(s => s.clientCode === 'BETA')).toBe(false);

      // Verify Prisma was called with the clientCode filter
      const countCall = mockPrisma.shipment.count.mock.calls[0][0];
      expect(countCall.where.clientCode).toBe('ALPHA');
      const findManyCall = mockPrisma.shipment.findMany.mock.calls[0][0];
      expect(findManyCall.where.clientCode).toBe('ALPHA');
    });

    it('returns ONLY Client B shipments when filtered by client=BETA', async () => {
      const betaShipments = ALL_SHIPMENTS.filter(s => s.clientCode === 'BETA');
      mockPrisma.shipment.count = vi.fn().mockResolvedValue(betaShipments.length);
      mockPrisma.shipment.findMany = vi.fn().mockResolvedValue(betaShipments);

      const result = await shipmentService.getAll({ client: 'BETA' }, 1, 50);

      expect(result.shipments).toHaveLength(2);
      expect(result.shipments.every(s => s.clientCode === 'BETA')).toBe(true);
      expect(result.shipments.some(s => s.clientCode === 'ALPHA')).toBe(false);
    });

    it('returns ALL shipments when no client filter is provided (admin view)', async () => {
      mockPrisma.shipment.count = vi.fn().mockResolvedValue(ALL_SHIPMENTS.length);
      mockPrisma.shipment.findMany = vi.fn().mockResolvedValue(ALL_SHIPMENTS);

      const result = await shipmentService.getAll({}, 1, 50);

      expect(result.shipments).toHaveLength(4);
      // Verify no clientCode filter was applied
      const countCall = mockPrisma.shipment.count.mock.calls[0][0];
      expect(countCall.where.clientCode).toBeUndefined();
    });
  });

  // ─── getMyShipments() — portal isolation ──────────────────────────────────
  describe('getMyShipments() — client portal isolation', () => {
    it('Client A portal sees only its own shipments', async () => {
      const alphaShipments = ALL_SHIPMENTS.filter(s => s.clientCode === 'ALPHA');
      mockPrisma.shipment.count = vi.fn().mockResolvedValue(alphaShipments.length);
      mockPrisma.shipment.findMany = vi.fn().mockResolvedValue(alphaShipments);

      const result = await shipmentService.getMyShipments('ALPHA', { page: 1, limit: 25 });

      expect(result.shipments).toHaveLength(2);
      expect(result.shipments.every(s => s.clientCode === 'ALPHA')).toBe(true);

      // Verify clientCode is hardcoded in the where clause (not user-controlled)
      const findManyCall = mockPrisma.shipment.findMany.mock.calls[0][0];
      expect(findManyCall.where.clientCode).toBe('ALPHA');
    });

    it('Client B portal cannot see Client A shipments by searching for ALPHA AWBs', async () => {
      // Even if Client B searches for an ALPHA AWB, the clientCode filter ensures isolation
      mockPrisma.shipment.count = vi.fn().mockResolvedValue(0);
      mockPrisma.shipment.findMany = vi.fn().mockResolvedValue([]);

      const result = await shipmentService.getMyShipments('BETA', { page: 1, limit: 25, search: 'ALPHA001' });

      expect(result.shipments).toHaveLength(0);

      // Verify BOTH clientCode AND search are in the where clause
      const findManyCall = mockPrisma.shipment.findMany.mock.calls[0][0];
      expect(findManyCall.where.clientCode).toBe('BETA');
      expect(findManyCall.where.OR).toBeDefined();
    });

    it('pagination stays within tenant boundary', async () => {
      // Ensure page 2 still respects client scoping
      mockPrisma.shipment.count = vi.fn().mockResolvedValue(100);
      mockPrisma.shipment.findMany = vi.fn().mockResolvedValue([]);

      await shipmentService.getMyShipments('ALPHA', { page: 2, limit: 25 });

      const findManyCall = mockPrisma.shipment.findMany.mock.calls[0][0];
      expect(findManyCall.where.clientCode).toBe('ALPHA');
      expect(findManyCall.skip).toBe(25);
    });

    it('status filter combines with client scoping (not replaces)', async () => {
      mockPrisma.shipment.count = vi.fn().mockResolvedValue(1);
      mockPrisma.shipment.findMany = vi.fn().mockResolvedValue([SHIPMENT_A1]);

      const result = await shipmentService.getMyShipments('ALPHA', { status: 'Booked' });

      const findManyCall = mockPrisma.shipment.findMany.mock.calls[0][0];
      expect(findManyCall.where.clientCode).toBe('ALPHA');
      expect(findManyCall.where.status).toBe('Booked');
    });
  });

  // ─── getById() — no cross-tenant check (admin function) ──────────────────
  describe('getById() — admin access scope', () => {
    it('returns a shipment regardless of client (admin function)', async () => {
      mockPrisma.shipment.findUnique = vi.fn().mockResolvedValue(SHIPMENT_B1);

      const result = await shipmentService.getById(3);

      expect(result.clientCode).toBe('BETA');
    });

    it('throws 404 for non-existent shipment', async () => {
      mockPrisma.shipment.findUnique = vi.fn().mockResolvedValue(null);

      await expect(shipmentService.getById(9999)).rejects.toThrow(/Shipment not found/);
    });
  });

  // ─── create() — wallet isolation ──────────────────────────────────────────
  describe('create() — wallet isolation between tenants', () => {
    it('debits Client A wallet for Client A shipment, not Client B', async () => {
      mockTx.client.findUnique = vi.fn().mockResolvedValue({ code: 'ALPHA', walletBalance: 10000 });
      mockTx.client.update = vi.fn().mockResolvedValue({});
      mockTx.walletTransaction.create = vi.fn().mockResolvedValue({});
      mockTx.shipment.create = vi.fn().mockResolvedValue({ id: 10, awb: 'ALPHANEW', clientCode: 'ALPHA', amount: 300, status: 'Booked' });

      await shipmentService.create({
        awb: 'ALPHANEW', clientCode: 'ALPHA', consignee: 'Test', destination: 'Mumbai', weight: 1, amount: 300,
      }, 1);

      // Must query ALPHA's wallet, not BETA's
      expect(mockTx.client.findUnique).toHaveBeenCalledWith({
        where: { code: 'ALPHA' },
        select: { walletBalance: true },
      });
      expect(mockTx.client.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { code: 'ALPHA' },
      }));
      // walletTransaction must reference ALPHA
      expect(mockTx.walletTransaction.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ clientCode: 'ALPHA' }),
      }));
    });

    it('creating a Client B shipment does not touch Client A wallet', async () => {
      mockTx.client.findUnique = vi.fn().mockResolvedValue({ code: 'BETA', walletBalance: 5000 });
      mockTx.client.update = vi.fn().mockResolvedValue({});
      mockTx.walletTransaction.create = vi.fn().mockResolvedValue({});
      mockTx.shipment.create = vi.fn().mockResolvedValue({ id: 11, awb: 'BETANEW', clientCode: 'BETA', amount: 200, status: 'Booked' });

      await shipmentService.create({
        awb: 'BETANEW', clientCode: 'BETA', consignee: 'Test', destination: 'Pune', weight: 1, amount: 200,
      }, 1);

      // All wallet operations must target BETA only
      const updateCall = mockTx.client.update.mock.calls[0][0];
      expect(updateCall.where.code).toBe('BETA');
      const walletCall = mockTx.walletTransaction.create.mock.calls[0][0];
      expect(walletCall.data.clientCode).toBe('BETA');
    });
  });

  // ─── bulkImport() — cross-client batch isolation ──────────────────────────
  describe('bulkImport() — multi-tenant batch isolation', () => {
    it('imports mixed-client batch without cross-contamination', async () => {
      const batch = [
        { awb: 'BULKALPHA1', clientCode: 'ALPHA', consignee: 'A1', destination: 'Delhi', weight: 1, amount: 0 },
        { awb: 'BULKBETA1',  clientCode: 'BETA',  consignee: 'B1', destination: 'Pune',  weight: 2, amount: 0 },
        { awb: 'BULKALPHA2', clientCode: 'ALPHA', consignee: 'A2', destination: 'Mumbai', weight: 1, amount: 0 },
      ];

      mockPrisma.client.upsert = vi.fn().mockResolvedValue({});
      mockPrisma.shipment.findUnique = vi.fn().mockResolvedValue(null);
      mockPrisma.shipment.create = vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: Math.random(), ...data }));

      const result = await shipmentService.bulkImport(batch, 1);

      expect(result.imported).toBe(3);

      // Verify each shipment was created with its OWN clientCode
      const createCalls = mockPrisma.shipment.create.mock.calls;
      const clientCodes = createCalls.map(c => c[0].data.clientCode);
      expect(clientCodes).toEqual(['ALPHA', 'BETA', 'ALPHA']);
    });

    it('duplicate in Client A does not affect Client B import', async () => {
      const batch = [
        { awb: 'EXISTINGALPHA', clientCode: 'ALPHA', consignee: 'A', destination: 'Delhi', weight: 1, amount: 0 },
        { awb: 'NEWBETA',       clientCode: 'BETA',  consignee: 'B', destination: 'Pune',  weight: 1, amount: 0 },
      ];

      mockPrisma.client.upsert = vi.fn().mockResolvedValue({});
      // ALPHA shipment exists, BETA doesn't
      mockPrisma.shipment.findUnique = vi.fn()
        .mockResolvedValueOnce({ id: 99, awb: 'EXISTINGALPHA', clientCode: 'ALPHA' }) // exists
        .mockResolvedValueOnce(null); // doesn't exist
      mockPrisma.shipment.create = vi.fn().mockResolvedValue({ id: 100, awb: 'NEWBETA', clientCode: 'BETA' });

      const result = await shipmentService.bulkImport(batch, 1);

      expect(result.imported).toBe(2); // both processed
      expect(result.duplicates).toBe(1); // ALPHA duplicate
      expect(result.operationalCreated).toBe(1); // only BETA created
    });
  });

  // ─── search (q param) — cross-client search isolation ─────────────────────
  describe('getAll() — search respects client scope', () => {
    it('searching with client filter cannot return other tenant data', async () => {
      mockPrisma.shipment.count = vi.fn().mockResolvedValue(0);
      mockPrisma.shipment.findMany = vi.fn().mockResolvedValue([]);

      await shipmentService.getAll({ client: 'ALPHA', q: 'BETA001' }, 1, 50);

      // The where clause MUST have both clientCode AND the search OR
      const countCall = mockPrisma.shipment.count.mock.calls[0][0];
      expect(countCall.where.clientCode).toBe('ALPHA');
      expect(countCall.where.OR).toBeDefined();
    });
  });
});
