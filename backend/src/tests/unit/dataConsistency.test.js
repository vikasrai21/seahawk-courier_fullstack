import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma, mockTx } from '../setup.js';

// ── Mock dependencies ───────────────────────────────────────────────────────
vi.mock('../../middleware/errorHandler', () => ({
  AppError: class AppError extends Error {
    constructor(message, statusCode) { super(message); this.statusCode = statusCode; this.isOperational = true; }
  },
}));
vi.mock('../../utils/logger', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('../../utils/cache', () => ({ default: { delByPrefix: vi.fn().mockResolvedValue(undefined), get: vi.fn(), set: vi.fn() } }));
vi.mock('../../services/notification.service', () => ({ default: { notifyStatusChange: vi.fn(), sendPODEmail: vi.fn() } }));
vi.mock('../../realtime/socket', () => ({ emitShipmentCreated: vi.fn(), emitShipmentStatusUpdated: vi.fn() }));
vi.mock('../../services/contract.service', () => ({
  default: {
    calculatePrice: vi.fn().mockResolvedValue(null),
    getActiveContractsByClientCodes: vi.fn().mockResolvedValue({}),
    calculatePriceFromContract: vi.fn().mockReturnValue(null),
    selectBestContract: vi.fn().mockReturnValue(null),
  },
  calculatePrice: vi.fn().mockResolvedValue(null),
  getActiveContractsByClientCodes: vi.fn().mockResolvedValue({}),
  calculatePriceFromContract: vi.fn().mockReturnValue(null),
  selectBestContract: vi.fn().mockReturnValue(null),
}));

vi.mock('../../services/stateMachine.js', () => ({
  default: { assertValidTransition: vi.fn(), shouldRefund: vi.fn(() => false), shouldNotify: vi.fn(() => false), isTerminal: vi.fn(() => false), getValidTransitions: vi.fn(() => []), normalizeStatus: vi.fn((s) => s) },
  assertValidTransition: vi.fn(), shouldRefund: vi.fn(() => false), shouldNotify: vi.fn(() => false), isTerminal: vi.fn(() => false), getValidTransitions: vi.fn(() => []), normalizeStatus: vi.fn((s) => s),
}));
vi.mock('../../services/wallet.service', () => ({ default: { creditShipmentRefund: vi.fn() }, creditShipmentRefund: vi.fn() }));

const queueMocks = vi.hoisted(() => ({ enqueueTrackingSync: vi.fn() }));
vi.mock('../../services/queue.service', () => ({
  default: { enqueueTrackingSync: queueMocks.enqueueTrackingSync },
  enqueueTrackingSync: queueMocks.enqueueTrackingSync,
}));

const shipmentService = await import('../../services/shipment.service.js');
const importLedgerService = await import('../../services/import-ledger.service.js');
const { auditLog } = await import('../../utils/audit.js');
const stateMachine = await import('../../services/stateMachine.js');
const importedRisk = await import('../../services/riskAnalysis.service.js');

describe('Data Consistency & Integrity Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$queryRawUnsafe = vi.fn().mockResolvedValue([{}]);
    mockPrisma.$executeRawUnsafe = vi.fn().mockResolvedValue({});
    mockPrisma.shipment.findUnique = vi.fn().mockResolvedValue(null);
    mockPrisma.auditLog.create = vi.fn().mockResolvedValue({});
    vi.spyOn(importLedgerService.default, 'ensureTable').mockResolvedValue(undefined);
    mockPrisma.$transaction.mockImplementation(async (fn) => {
      if (typeof fn === 'function') return fn(mockTx);
      return Promise.all(fn);
    });
  });

  // ─── AWB Normalization ────────────────────────────────────────────────────
  describe('AWB normalization — Unicode, whitespace, casing', () => {
    it('strips zero-width characters and normalizes to uppercase', async () => {
      mockTx.client.findUnique = vi.fn().mockResolvedValue({ walletBalance: 10000 });
      mockTx.client.update = vi.fn().mockResolvedValue({});
      mockTx.walletTransaction.create = vi.fn().mockResolvedValue({});
      mockTx.shipment.create = vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data }));

      // AWB with zero-width spaces and mixed casing
      await shipmentService.create({
        awb: 'abc\u200B123\u200Ddef',  // Zero-width space + zero-width joiner
        clientCode: 'TESTCL',
        consignee: 'Test',
        destination: 'Delhi',
        weight: 1,
        amount: 100,
      }, 1);

      const createdData = mockTx.shipment.create.mock.calls[0][0].data;
      expect(createdData.awb).toBe('ABC123DEF');
    });

    it('strips leading/trailing whitespace from AWB', async () => {
      mockTx.client.findUnique = vi.fn().mockResolvedValue({ walletBalance: 10000 });
      mockTx.client.update = vi.fn().mockResolvedValue({});
      mockTx.walletTransaction.create = vi.fn().mockResolvedValue({});
      mockTx.shipment.create = vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data }));

      await shipmentService.create({
        awb: '  SPACED AWB  ',
        clientCode: 'TESTCL',
        consignee: 'Test',
        destination: 'Delhi',
        weight: 1,
        amount: 100,
      }, 1);

      const createdData = mockTx.shipment.create.mock.calls[0][0].data;
      expect(createdData.awb).toBe('SPACEDAWB');
    });

    it('normalizes full-width characters (NFKC)', async () => {
      mockTx.client.findUnique = vi.fn().mockResolvedValue({ walletBalance: 10000 });
      mockTx.client.update = vi.fn().mockResolvedValue({});
      mockTx.walletTransaction.create = vi.fn().mockResolvedValue({});
      mockTx.shipment.create = vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data }));

      // Full-width digits ０１２３ → 0123
      await shipmentService.create({
        awb: '\uFF10\uFF11\uFF12\uFF13AWB',
        clientCode: 'TESTCL',
        consignee: 'Test',
        destination: 'Delhi',
        weight: 1,
        amount: 100,
      }, 1);

      const createdData = mockTx.shipment.create.mock.calls[0][0].data;
      expect(createdData.awb).toBe('0123AWB');
    });
  });

  // ─── Consignee/Destination uppercasing ────────────────────────────────────
  describe('Field normalization — consignee & destination', () => {
    it('uppercases consignee and destination on create()', async () => {
      mockTx.client.findUnique = vi.fn().mockResolvedValue({ walletBalance: 10000 });
      mockTx.client.update = vi.fn().mockResolvedValue({});
      mockTx.walletTransaction.create = vi.fn().mockResolvedValue({});
      mockTx.shipment.create = vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data }));

      await shipmentService.create({
        awb: 'NORMTEST1',
        clientCode: 'TESTCL',
        consignee: 'john doe',
        destination: 'new delhi',
        weight: 1,
        amount: 100,
      }, 1);

      const data = mockTx.shipment.create.mock.calls[0][0].data;
      expect(data.consignee).toBe('JOHN DOE');
      expect(data.destination).toBe('NEW DELHI');
    });

    it('uppercases consignee and destination on update()', async () => {
      mockPrisma.shipment.update = vi.fn().mockResolvedValue({
        id: 1, consignee: 'UPDATED NAME', destination: 'KOLKATA',
      });

      await shipmentService.update(1, {
        consignee: 'updated name',
        destination: 'kolkata',
      }, 99);

      const updateCall = mockPrisma.shipment.update.mock.calls[0][0];
      expect(updateCall.data.consignee).toBe('UPDATED NAME');
      expect(updateCall.data.destination).toBe('KOLKATA');
    });

    it('uppercases in bulkImport() as well', async () => {
      mockPrisma.client.upsert = vi.fn().mockResolvedValue({});
      mockPrisma.shipment.findUnique = vi.fn().mockResolvedValue(null);
      mockPrisma.shipment.create = vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data }));

      await shipmentService.bulkImport([
        { awb: 'BULKNORM1', clientCode: 'TESTCL', consignee: 'lowercase name', destination: 'mumbai suburb', weight: 1, amount: 0 },
      ], 1);

      const createData = mockPrisma.shipment.create.mock.calls[0][0].data;
      expect(createData.consignee).toBe('LOWERCASE NAME');
      expect(createData.destination).toBe('MUMBAI SUBURB');
    });
  });

  // ─── Audit Log Integrity ─────────────────────────────────────────────────
  describe('Audit log — never crashes, always records', () => {
    it('auditLog records userId, action, entity, and entityId', async () => {
      await auditLog({
        userId: 42,
        userEmail: 'admin@test.com',
        action: 'CREATE',
        entity: 'SHIPMENT',
        entityId: 101,
        newValue: { awb: 'AUDITAWB' },
        ip: '127.0.0.1',
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 42,
          userEmail: 'admin@test.com',
          action: 'CREATE',
          entity: 'SHIPMENT',
          entityId: '101',
          ip: '127.0.0.1',
        }),
      });
    });

    it('auditLog swallows DB errors without throwing', async () => {
      mockPrisma.auditLog.create = vi.fn().mockRejectedValue(new Error('DB DOWN'));

      // Should NOT throw
      await expect(auditLog({
        userId: 1, action: 'TEST', entity: 'SHIPMENT', entityId: 1,
      })).resolves.toBeUndefined();
    });

    it('auditLog handles null userId and missing fields gracefully', async () => {
      await auditLog({
        action: 'ANONYMOUS_ACTION',
        entity: 'SYSTEM',
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: null,
          userEmail: null,
          action: 'ANONYMOUS_ACTION',
          entity: 'SYSTEM',
          entityId: null,
          ip: null,
        }),
      });
    });
  });

  // ─── Import Ledger Consistency ────────────────────────────────────────────
  describe('Import ledger — records every row from bulkImport', () => {
    it('calls insertRow for each imported shipment with correct fields', async () => {
      const batch = [
        { awb: 'LEDGER1', clientCode: 'TESTCL', consignee: 'A', destination: 'Delhi', weight: 1.5, amount: 200, courier: 'Delhivery', service: 'Express' },
        { awb: 'LEDGER2', clientCode: 'TESTCL', consignee: 'B', destination: 'Mumbai', weight: 2.0, amount: 0, courier: 'DTDC', service: 'Standard' },
      ];

      mockPrisma.client.upsert = vi.fn().mockResolvedValue({});
      mockPrisma.shipment.findUnique = vi.fn().mockResolvedValue(null);
      mockPrisma.shipment.create = vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: Math.floor(Math.random() * 1000), ...data }));

      await shipmentService.bulkImport(batch, 1);

      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(2);

      // First call must contain correct data
      const firstCallArgs = mockPrisma.$executeRawUnsafe.mock.calls[0];
      // $executeRawUnsafe(query, batchKey, sourceFile, sourceSheet, rowNo, date, clientCode, awb, ...)
      // Values start at index 1
      expect(firstCallArgs[1]).toMatch(/^imp_/); // batchKey
      expect(firstCallArgs[7]).toBe('LEDGER1'); // awb
      expect(firstCallArgs[6]).toBe('TESTCL'); // clientCode
      expect(firstCallArgs[12]).toBe(1.5); // weight
      expect(firstCallArgs[13]).toBe(200); // amount
      expect(firstCallArgs[4]).toBe(1); // rowNo

      // Second call
      const secondCallArgs = mockPrisma.$executeRawUnsafe.mock.calls[1];
      expect(secondCallArgs[7]).toBe('LEDGER2');
      expect(secondCallArgs[4]).toBe(2);
    });

    it('records batchKey consistently across all rows in a batch', async () => {
      const batch = [
        { awb: 'BATCHKEY1', clientCode: 'TESTCL', consignee: 'A', destination: 'Delhi', weight: 1, amount: 0 },
        { awb: 'BATCHKEY2', clientCode: 'TESTCL', consignee: 'B', destination: 'Mumbai', weight: 1, amount: 0 },
        { awb: 'BATCHKEY3', clientCode: 'TESTCL', consignee: 'C', destination: 'Pune', weight: 1, amount: 0 },
      ];

      mockPrisma.client.upsert = vi.fn().mockResolvedValue({});
      mockPrisma.shipment.findUnique = vi.fn().mockResolvedValue(null);
      mockPrisma.shipment.create = vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data }));

      await shipmentService.bulkImport(batch, 1);

      const batchKeys = mockPrisma.$executeRawUnsafe.mock.calls.map(c => c[1]); // index 1 is batchKey
      // All 3 must share the same batchKey
      expect(batchKeys[0]).toBe(batchKeys[1]);
      expect(batchKeys[1]).toBe(batchKeys[2]);
      expect(batchKeys[0]).toMatch(/^imp_/);
    });

    it('records auto-priced flag when contract pricing applies', async () => {
      mockPrisma.contract.findMany.mockResolvedValueOnce([
        {
          id: 1,
          clientCode: 'TESTCL',
          courier: 'DELHIVERY', // uppercase like in selectBestContract
          service: 'STANDARD',
          name: 'Test Contract', // calculatePriceFromContract expects name not contractName
          pricingType: 'FLAT',
          baseRate: 120,
          minCharge: 0,
          fuelSurcharge: 0,
          gstPercent: 0,
          active: true,
        }
      ]);
      mockPrisma.shipment.findUnique = vi.fn().mockResolvedValue(null);
      mockPrisma.shipment.create = vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data }));

      await shipmentService.bulkImport([
        { awb: 'AUTOPRICED1', clientCode: 'TESTCL', consignee: 'A', destination: 'Delhi', weight: 1, amount: 0, courier: 'Delhivery', service: 'Standard' },
      ], 1);

      const ledgerCallArgs = mockPrisma.$executeRawUnsafe.mock.calls[0];
      expect(ledgerCallArgs[20]).toBe(true); // autoPriced
      expect(ledgerCallArgs[13]).toBe(120); // amount
    });
  });

  // ─── Status Transition Consistency ────────────────────────────────────────
  describe('Status transition — tracking event creation', () => {
    it('creates a trackingEvent when status is updated', async () => {
      // Use a valid transition: Booked → PickedUp
      mockPrisma.shipment.findUnique = vi.fn().mockResolvedValue({
        id: 1, awb: 'TRACK001', status: 'InTransit', clientCode: 'TESTCL', amount: 100,
        client: { company: 'Test' }, createdBy: { name: 'Admin' }, trackingEvents: [],
      });
      mockPrisma.shipment.update = vi.fn().mockResolvedValue({
        id: 1, awb: 'TRACK001', status: 'OutForDelivery', clientCode: 'TESTCL',
        client: { company: 'Test', phone: '1234', email: 'test@test.com' },
      });
      mockPrisma.trackingEvent.create = vi.fn().mockResolvedValue({});

      await shipmentService.updateStatus(1, 'OutForDelivery', 99);

      expect(mockPrisma.trackingEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          shipmentId: 1,
          awb: 'TRACK001',
          status: 'OutForDelivery',
          source: 'MANUAL',
        }),
      });
    });

    it('tracking event failure does not crash the status update', async () => {
      mockPrisma.shipment.findUnique = vi.fn().mockResolvedValue({
        id: 2, awb: 'TRACK002', status: 'InTransit', clientCode: 'TESTCL', amount: 100,
        client: { company: 'Test' }, createdBy: { name: 'Admin' }, trackingEvents: [],
      });
      mockPrisma.shipment.update = vi.fn().mockResolvedValue({
        id: 2, awb: 'TRACK002', status: 'OutForDelivery', clientCode: 'TESTCL',
        client: { company: 'Test', phone: '1234', email: 'test@test.com' },
      });
      mockPrisma.trackingEvent.create = vi.fn().mockRejectedValue(new Error('DB down'));

      // Should NOT throw even when tracking fails
      const result = await shipmentService.updateStatus(2, 'OutForDelivery', 99);
      expect(result.status).toBe('OutForDelivery');
    });
  });

  // ─── Wallet Transaction Consistency ───────────────────────────────────────
  describe('Wallet transactions — balance reference accuracy', () => {
    it('wallet transaction stores the POST-debit balance, not pre-debit', async () => {
      mockTx.client.findUnique = vi.fn().mockResolvedValue({ code: 'TESTCL', walletBalance: 1000 });
      mockTx.client.update = vi.fn().mockResolvedValue({});
      mockTx.walletTransaction.create = vi.fn().mockResolvedValue({});
      mockTx.shipment.create = vi.fn().mockResolvedValue({ id: 1, awb: 'BALTEST', amount: 300, status: 'Booked' });

      await shipmentService.create({
        awb: 'BALTEST', clientCode: 'TESTCL', consignee: 'Test', destination: 'Delhi', weight: 1, amount: 300,
      }, 1);

      const walletData = mockTx.walletTransaction.create.mock.calls[0][0].data;
      // Balance should be 1000 - 300 = 700
      expect(walletData.balance).toBe(700);
      expect(walletData.type).toBe('DEBIT');
      expect(walletData.status).toBe('SUCCESS');
      expect(walletData.reference).toBe('BALTEST');
    });
  });

  // ─── Risk Score Persistence ───────────────────────────────────────────────
  describe('Risk analysis — score persists to shipment record', () => {
    it('stores riskScore and riskFactors from analyzeShipment()', async () => {
      vi.spyOn(importedRisk.default, 'analyzeShipment').mockResolvedValueOnce({
        score: 30,
        factors: ['Missing or invalid Consignee Phone Number'],
      });

      mockTx.client.findUnique = vi.fn().mockResolvedValue({ walletBalance: 10000 });
      mockTx.client.update = vi.fn().mockResolvedValue({});
      mockTx.walletTransaction.create = vi.fn().mockResolvedValue({});
      mockTx.shipment.create = vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data }));

      await shipmentService.create({
        awb: 'RISKTEST', clientCode: 'TESTCL', consignee: 'Test', destination: 'Delhi', weight: 1, amount: 5000,
      }, 1);

      const data = mockTx.shipment.create.mock.calls[0][0].data;
      // The real risk engine gives 30 for missing phone number on an empty payload
      expect(data.riskScore).toBe(30);
      expect(data.riskFactors).toEqual(['Missing or invalid Consignee Phone Number']);
    });
  });

  // ─── Empty/Invalid AWB Rejection ──────────────────────────────────────────
  describe('Bulk import — invalid data rejection', () => {
    it('skips rows with empty AWBs and records them as errors', async () => {
      mockPrisma.client.upsert = vi.fn().mockResolvedValue({});
      mockPrisma.shipment.findUnique = vi.fn().mockResolvedValue(null);
      mockPrisma.shipment.create = vi.fn().mockResolvedValue({ id: 1 });

      const result = await shipmentService.bulkImport([
        { awb: '', clientCode: 'TESTCL', consignee: 'A', destination: 'Delhi' },
        { awb: '   ', clientCode: 'TESTCL', consignee: 'B', destination: 'Mumbai' },
        { awb: 'VALID001', clientCode: 'TESTCL', consignee: 'C', destination: 'Pune', weight: 1, amount: 0 },
      ], 1);

      // Only VALID001 should be imported
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
      expect(result.imported).toBe(1);
    });
  });
});
