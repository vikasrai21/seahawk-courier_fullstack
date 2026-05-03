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

const queueMocks = vi.hoisted(() => ({ enqueueTrackingSync: vi.fn(), enqueueNotification: vi.fn() }));
vi.mock('../../services/queue.service', () => ({
  default: { enqueueTrackingSync: queueMocks.enqueueTrackingSync, enqueueNotification: queueMocks.enqueueNotification },
  enqueueTrackingSync: queueMocks.enqueueTrackingSync,
  enqueueNotification: queueMocks.enqueueNotification,
}));


const shipmentService = await import('../../services/shipment.service.js');
import * as importLedgerServiceRaw from '../../services/import-ledger.service.js';
const importLedgerService = importLedgerServiceRaw.default || importLedgerServiceRaw;
const { auditLog } = await import('../../utils/audit.js');
const stateMachine = await import('../../services/stateMachine.js');
const importedRisk = await import('../../services/riskAnalysis.service.js');

describe('Data Consistency & Integrity Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$queryRawUnsafe = vi.fn().mockResolvedValue([{}]);
    mockPrisma.$executeRawUnsafe = vi.fn().mockResolvedValue(1);
    mockPrisma.shipment.findUnique = vi.fn().mockResolvedValue(null);
    mockPrisma.shipment.findMany = vi.fn().mockResolvedValue([]);
    mockPrisma.auditLog.create = vi.fn().mockResolvedValue({});
    
    vi.spyOn(importLedgerService, 'insertRowsBulk').mockResolvedValue(undefined);
    vi.spyOn(importLedgerService, 'ensureTable').mockResolvedValue(undefined);

    mockPrisma.$transaction.mockImplementation(async (fn) => {
      if (typeof fn === 'function') return fn(mockTx);
      return Promise.all(fn);
    });
  });

  // ─── AWB Normalization ────────────────────────────────────────────────────
  describe('AWB normalization — Unicode, whitespace, casing', () => {
    it('strips zero-width characters and normalizes to uppercase', async () => {
      // Service now uses tx.client.updateMany for atomic debit
      mockTx.client.updateMany = vi.fn().mockResolvedValue({ count: 1 });
      mockTx.client.findUnique = vi.fn().mockResolvedValue({ walletBalance: 9900 });
      mockTx.walletTransaction.create = vi.fn().mockResolvedValue({});
      mockTx.shipment.create = vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data, client: { company: 'T', phone: '9' } }));

      await shipmentService.create({
        awb: 'abc\u200B123\u200Ddef',
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
      mockTx.client.updateMany = vi.fn().mockResolvedValue({ count: 1 });
      mockTx.client.findUnique = vi.fn().mockResolvedValue({ walletBalance: 9900 });
      mockTx.walletTransaction.create = vi.fn().mockResolvedValue({});
      mockTx.shipment.create = vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data, client: { company: 'T', phone: '9' } }));

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
      mockTx.client.updateMany = vi.fn().mockResolvedValue({ count: 1 });
      mockTx.client.findUnique = vi.fn().mockResolvedValue({ walletBalance: 9900 });
      mockTx.walletTransaction.create = vi.fn().mockResolvedValue({});
      mockTx.shipment.create = vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data, client: { company: 'T', phone: '9' } }));

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
      mockTx.client.updateMany = vi.fn().mockResolvedValue({ count: 1 });
      mockTx.client.findUnique = vi.fn().mockResolvedValue({ walletBalance: 9900 });
      mockTx.walletTransaction.create = vi.fn().mockResolvedValue({});
      mockTx.shipment.create = vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data, client: { company: 'T', phone: '9' } }));

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
      mockPrisma.shipment.findMany = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([
        { id: 1, awb: 'BULKNORM1', clientCode: 'TESTCL', courier: 'Delhivery', status: 'Booked' },
      ]);
      mockPrisma.shipment.createMany = vi.fn().mockResolvedValue({ count: 1 });

      await shipmentService.bulkImport([
        { awb: 'BULKNORM1', clientCode: 'TESTCL', consignee: 'lowercase name', destination: 'mumbai suburb', weight: 1, amount: 0 },
      ], 1);

      // createMany receives array of data — check normalization
      const createManyData = mockPrisma.shipment.createMany.mock.calls[0][0].data;
      expect(createManyData[0].consignee).toBe('LOWERCASE NAME');
      expect(createManyData[0].destination).toBe('MUMBAI SUBURB');
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

  // ─── Import Ledger Consistency (now uses insertRowsBulk) ─────────────────
  describe('Import ledger — records every row from bulkImport', () => {
    it('calls insertRowsBulk for all imported shipments', async () => {
      const batch = [
        { awb: 'LEDGER1', clientCode: 'TESTCL', consignee: 'A', destination: 'Delhi', weight: 1.5, amount: 200, courier: 'Delhivery', service: 'Express' },
        { awb: 'LEDGER2', clientCode: 'TESTCL', consignee: 'B', destination: 'Mumbai', weight: 2.0, amount: 0, courier: 'DTDC', service: 'Standard' },
      ];

      mockPrisma.client.upsert = vi.fn().mockResolvedValue({});
      mockPrisma.shipment.findMany = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([
        { id: 1, awb: 'LEDGER1', clientCode: 'TESTCL', courier: 'Delhivery', status: 'Booked' },
        { id: 2, awb: 'LEDGER2', clientCode: 'TESTCL', courier: 'DTDC', status: 'Booked' },
      ]);
      mockPrisma.shipment.createMany = vi.fn().mockResolvedValue({ count: 2 });

      await shipmentService.bulkImport(batch, 1);

      const insertCall = mockPrisma.$executeRawUnsafe.mock.calls.find(c => String(c[0]).includes('INSERT INTO shipment_import_rows'));
      expect(insertCall).toBeDefined();
      
      // params are flattened, awb is 7th param (index 7), weight is 12 (index 12). 22 params per row.
      expect(insertCall[7]).toBe('LEDGER1');
      expect(insertCall[12]).toBe(1.5);
      expect(insertCall[7 + 22]).toBe('LEDGER2');
    });

    it('records batchKey consistently across all rows in a batch', async () => {
      const batch = [
        { awb: 'BATCHKEY1', clientCode: 'TESTCL', consignee: 'A', destination: 'Delhi', weight: 1, amount: 0 },
        { awb: 'BATCHKEY2', clientCode: 'TESTCL', consignee: 'B', destination: 'Mumbai', weight: 1, amount: 0 },
        { awb: 'BATCHKEY3', clientCode: 'TESTCL', consignee: 'C', destination: 'Pune', weight: 1, amount: 0 },
      ];

      mockPrisma.client.upsert = vi.fn().mockResolvedValue({});
      mockPrisma.shipment.findMany = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([
        { id: 1, awb: 'BATCHKEY1', clientCode: 'TESTCL', courier: 'Delhivery', status: 'Booked' },
        { id: 2, awb: 'BATCHKEY2', clientCode: 'TESTCL', courier: 'Delhivery', status: 'Booked' },
        { id: 3, awb: 'BATCHKEY3', clientCode: 'TESTCL', courier: 'Delhivery', status: 'Booked' },
      ]);
      mockPrisma.shipment.createMany = vi.fn().mockResolvedValue({ count: 3 });

      await shipmentService.bulkImport(batch, 1);

      const insertCall = mockPrisma.$executeRawUnsafe.mock.calls.find(c => String(c[0]).includes('INSERT INTO shipment_import_rows'));
      expect(insertCall).toBeDefined();
      // batchKey is the 1st param (index 1) for each row
      expect(insertCall[1]).toBe(insertCall[1 + 22]);
      expect(insertCall[1 + 22]).toBe(insertCall[1 + 44]);
      expect(insertCall[1]).toMatch(/^imp_/);
    });

    it('records auto-priced flag when contract pricing applies', async () => {
      mockPrisma.contract.findMany = vi.fn().mockResolvedValue([{
        id: 1, clientCode: 'TESTCL', courier: 'DELHIVERY', service: 'STANDARD',
        name: 'Test Contract', pricingType: 'FLAT', baseRate: 120,
        minCharge: 0, fuelSurcharge: 0, gstPercent: 0, active: true,
      }]);
      mockPrisma.client.upsert = vi.fn().mockResolvedValue({});
      mockPrisma.shipment.findMany = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([
        { id: 1, awb: 'AUTOPRICED1', clientCode: 'TESTCL', courier: 'Delhivery', status: 'Booked' },
      ]);
      mockPrisma.shipment.createMany = vi.fn().mockResolvedValue({ count: 1 });

      await shipmentService.bulkImport([
        { awb: 'AUTOPRICED1', clientCode: 'TESTCL', consignee: 'A', destination: 'Delhi', weight: 1, amount: 0, courier: 'Delhivery', service: 'Standard' },
      ], 1);

      const insertCall = mockPrisma.$executeRawUnsafe.mock.calls.find(c => String(c[0]).includes('INSERT INTO shipment_import_rows'));
      expect(insertCall).toBeDefined();
      // autoPriced is 20th param (index 20), amount is 13th param (index 13)
      expect(insertCall[20]).toBe(true);
      expect(insertCall[13]).toBe(120);
    });
  });

  // ─── Status Transition Consistency ────────────────────────────────────────
  describe('Status transition — tracking event creation', () => {
    it('creates a trackingEvent when status is updated', async () => {
      mockPrisma.shipment.findUnique = vi.fn().mockResolvedValue({
        id: 1, awb: 'TRACK001', status: 'InTransit', clientCode: 'TESTCL', amount: 100,
        client: { company: 'Test' }, createdBy: { name: 'Admin' }, updatedBy: null, trackingEvents: [],
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
        client: { company: 'Test' }, createdBy: { name: 'Admin' }, updatedBy: null, trackingEvents: [],
      });
      mockPrisma.shipment.update = vi.fn().mockResolvedValue({
        id: 2, awb: 'TRACK002', status: 'OutForDelivery', clientCode: 'TESTCL',
        client: { company: 'Test', phone: '1234', email: 'test@test.com' },
      });
      mockPrisma.trackingEvent.create = vi.fn().mockRejectedValue(new Error('DB down'));

      const result = await shipmentService.updateStatus(2, 'OutForDelivery', 99);
      expect(result.status).toBe('OutForDelivery');
    });
  });

  // ─── Wallet Transaction Consistency ───────────────────────────────────────
  describe('Wallet transactions — balance reference accuracy', () => {
    it('wallet transaction stores the POST-debit balance, not pre-debit', async () => {
      // Service now uses updateMany for atomic debit, then findUnique for post-balance
      mockTx.client.updateMany = vi.fn().mockResolvedValue({ count: 1 });
      mockTx.client.findUnique = vi.fn().mockResolvedValue({ walletBalance: 700 }); // post-debit balance
      mockTx.walletTransaction.create = vi.fn().mockResolvedValue({});
      mockTx.shipment.create = vi.fn().mockResolvedValue({
        id: 1, awb: 'BALTEST', amount: 300, status: 'Booked',
        client: { company: 'Test', phone: '9' },
      });

      await shipmentService.create({
        awb: 'BALTEST', clientCode: 'TESTCL', consignee: 'Test', destination: 'Delhi', weight: 1, amount: 300,
      }, 1);

      const walletData = mockTx.walletTransaction.create.mock.calls[0][0].data;
      // Balance should be the post-debit balance (700)
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

      mockTx.client.updateMany = vi.fn().mockResolvedValue({ count: 1 });
      mockTx.client.findUnique = vi.fn().mockResolvedValue({ walletBalance: 5000 });
      mockTx.walletTransaction.create = vi.fn().mockResolvedValue({});
      mockTx.shipment.create = vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data, client: { company: 'T', phone: '9' } }));

      await shipmentService.create({
        awb: 'RISKTEST', clientCode: 'TESTCL', consignee: 'Test', destination: 'Delhi', weight: 1, amount: 5000,
      }, 1);

      const data = mockTx.shipment.create.mock.calls[0][0].data;
      expect(data.riskScore).toBe(30);
      expect(data.riskFactors).toEqual(['Missing or invalid Consignee Phone Number']);
    });
  });

  // ─── Empty/Invalid AWB Rejection ──────────────────────────────────────────
  describe('Bulk import — invalid data rejection', () => {
    it('skips rows with empty AWBs and records them as errors', async () => {
      mockPrisma.client.upsert = vi.fn().mockResolvedValue({});
      mockPrisma.shipment.findMany = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([
        { id: 1, awb: 'VALID001', clientCode: 'TESTCL', courier: 'Delhivery', status: 'Booked' },
      ]);
      mockPrisma.shipment.createMany = vi.fn().mockResolvedValue({ count: 1 });

      const result = await shipmentService.bulkImport([
        { awb: '', clientCode: 'TESTCL', consignee: 'A', destination: 'Delhi' },
        { awb: '   ', clientCode: 'TESTCL', consignee: 'B', destination: 'Mumbai' },
        { awb: 'VALID001', clientCode: 'TESTCL', consignee: 'C', destination: 'Pune', weight: 1, amount: 0 },
      ], 1);

      expect(result.errors.length).toBeGreaterThanOrEqual(1);
      expect(result.imported).toBe(1);
    });
  });
});
