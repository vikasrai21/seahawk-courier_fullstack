import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma, mockTx } from '../setup.js';
import { AppError } from '../../middleware/errorHandler.js';

// Mock dependencies
vi.mock('../../middleware/errorHandler', () => ({
  AppError: class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = true;
    }
  },
}));

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../../utils/cache', () => ({
  default: { delByPrefix: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../../services/notification.service', () => ({
  default: { notifyStatusChange: vi.fn(), sendPODEmail: vi.fn() },
}));

vi.mock('../../realtime/socket', () => ({
  emitShipmentCreated: vi.fn(),
  emitShipmentStatusUpdated: vi.fn(),
}));

const queueMocks = vi.hoisted(() => ({
  enqueueTrackingSync: vi.fn(),
  enqueueNotification: vi.fn(),
}));
vi.mock('../../services/queue.service', () => ({
  default: { enqueueTrackingSync: queueMocks.enqueueTrackingSync, enqueueNotification: queueMocks.enqueueNotification },
  enqueueTrackingSync: queueMocks.enqueueTrackingSync,
  enqueueNotification: queueMocks.enqueueNotification,
}));

vi.mock('../../services/import-ledger.service', () => ({
  default: { ensureTable: vi.fn(), insertRow: vi.fn(), insertRowsBulk: vi.fn() },
  ensureTable: vi.fn(),
  insertRow: vi.fn(),
  insertRowsBulk: vi.fn(),
}));

vi.mock('../../services/stateMachine', () => ({
  default: {
    assertValidTransition: vi.fn(),
    shouldRefund: vi.fn(() => false),
    shouldNotify: vi.fn(() => false),
    isTerminal: vi.fn(() => false),
    getValidTransitions: vi.fn(() => []),
    normalizeStatus: vi.fn((s) => s),
  },
  assertValidTransition: vi.fn(),
  shouldRefund: vi.fn(() => false),
  shouldNotify: vi.fn(() => false),
  isTerminal: vi.fn(() => false),
  getValidTransitions: vi.fn(() => []),
  normalizeStatus: vi.fn((s) => s),
}));

vi.mock('../../services/wallet.service', () => ({
  default: { creditShipmentRefund: vi.fn() },
  creditShipmentRefund: vi.fn(),
}));

const riskMocks = vi.hoisted(() => ({
  analyzeShipment: vi.fn().mockResolvedValue({ score: 30, factors: ['Missing or invalid Consignee Phone Number'] }),
}));

vi.mock('../../services/riskAnalysis.service', () => ({
  default: riskMocks,
  ...riskMocks,
}));

vi.mock('../../services/clientMatcher.service', () => ({
  findClosestClient: vi.fn().mockResolvedValue(null),
}));

const shipmentService = await import('../../services/shipment.service.js');
const contractService = await import('../../services/contract.service.js');
const stateMachine = await import('../../services/stateMachine.js');
const importLedgerService = await import('../../services/import-ledger.service.js');
const riskAnalysis = await import('../../services/riskAnalysis.service.js');

describe('Data Integrity & Business Logic (Client-Grade)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$queryRawUnsafe = vi.fn().mockResolvedValue([{}]);
    mockPrisma.$executeRawUnsafe = vi.fn().mockResolvedValue(1);
    mockPrisma.shipment.findUnique = vi.fn().mockResolvedValue(null);
    mockPrisma.shipment.findMany = vi.fn().mockResolvedValue([]);
    
    vi.spyOn(importLedgerService, 'ensureTable').mockResolvedValue(undefined);
    vi.spyOn(importLedgerService, 'insertRow').mockResolvedValue(undefined);
    vi.spyOn(importLedgerService, 'insertRowsBulk').mockResolvedValue(undefined);
    
    // Reset the transaction mock to route through mockTx
    mockPrisma.$transaction.mockImplementation(async (fn) => {
      if (typeof fn === 'function') {
        return await fn(mockTx);
      }
      return Promise.all(fn);
    });
  });

  describe('create() - The Money Function', () => {
    it('successfully creates a shipment and debits wallet atomically', async () => {
      const payload = {
        awb: 'NEW_AWB_123',
        clientCode: 'TESTCL',
        consignee: 'Test Recipient',
        destination: 'Mumbai',
        weight: 1.5,
        amount: 500,
        courier: 'Delhivery',
        service: 'Standard',
        date: '2026-04-25',
      };

      // The new create() uses tx.client.updateMany for atomic debit
      mockTx.client.updateMany = vi.fn().mockResolvedValue({ count: 1 });
      mockTx.client.findUnique = vi.fn().mockResolvedValue({
        code: 'TESTCL',
        walletBalance: 500,
      });
      mockTx.walletTransaction.create = vi.fn().mockResolvedValue({ id: 1 });
      mockTx.shipment.create = vi.fn().mockResolvedValue({
        id: 101,
        ...payload,
        status: 'Booked',
        client: { company: 'Test Co', phone: '9999' },
      });

      const result = await shipmentService.create(payload, 99);

      // Wallet debit MUST use atomic updateMany (WHERE balance >= amount)
      expect(mockTx.client.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          code: 'TESTCL',
          walletBalance: { gte: 500 },
        }),
        data: expect.objectContaining({ walletBalance: { decrement: 500 } }),
      }));
      
      expect(mockTx.walletTransaction.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          type: 'DEBIT',
          amount: 500,
          description: expect.stringContaining('NEW_AWB_123'),
        }),
      }));
      
      // Shipment must be created
      expect(mockTx.shipment.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          awb: 'NEW_AWB_123',
          amount: 500,
          status: 'Booked',
        }),
      }));

      expect(result.awb).toBe('NEW_AWB_123');
    });

    it('rejects duplicate AWB (P2002 Prisma error)', async () => {
      const payload = {
        awb: 'DUPE_AWB',
        clientCode: 'TESTCL',
        consignee: 'Test Recipient',
        destination: 'Mumbai',
        weight: 1.5,
        amount: 500,
      };

      const p2002Error = new Error('Unique constraint failed');
      p2002Error.code = 'P2002';
      
      mockTx.client.updateMany = vi.fn().mockResolvedValue({ count: 1 });
      mockTx.client.findUnique = vi.fn().mockResolvedValue({ walletBalance: 500 });
      mockTx.walletTransaction.create = vi.fn().mockResolvedValue({});
      mockTx.shipment.create = vi.fn().mockRejectedValue(p2002Error);

      await expect(shipmentService.create(payload, 99)).rejects.toThrow(/Unique constraint failed/);
    });

    it('fails transaction entirely on insufficient wallet balance', async () => {
      const payload = {
        awb: 'NO_MONEY_AWB',
        clientCode: 'TESTCL',
        consignee: 'Test Recipient',
        destination: 'Mumbai',
        weight: 1.5,
        amount: 500,
      };

      // updateMany returns count: 0 when balance is insufficient
      mockTx.client.updateMany = vi.fn().mockResolvedValue({ count: 0 });
      mockTx.client.findUnique = vi.fn().mockResolvedValue({
        code: 'TESTCL',
        walletBalance: 100,
      });

      await expect(shipmentService.create(payload, 99)).rejects.toThrow(/Insufficient wallet balance/);
      
      // Crucially, shipment MUST NOT be created
      expect(mockTx.shipment.create).not.toHaveBeenCalled();
    });

    it('uses contract pricing when amount is 0', async () => {
      const payload = {
        awb: 'CONTRACT_AWB',
        clientCode: 'TESTCL',
        consignee: 'Test Recipient',
        destination: 'Mumbai',
        weight: 1.5,
        amount: 0,
        courier: 'Delhivery',
        service: 'Express',
      };

      mockTx.client.updateMany = vi.fn().mockResolvedValue({ count: 1 });
      mockTx.client.findUnique = vi.fn().mockResolvedValue({ walletBalance: 850 });
      mockTx.shipment.create = vi.fn().mockResolvedValue({ 
        awb: 'CONTRACT_AWB', amount: 150,
        client: { company: 'Test', phone: '9999' },
      });
      mockTx.walletTransaction.create = vi.fn().mockResolvedValue({});
      
      // Mock the database to return a contract
      mockPrisma.contract = {
        findMany: vi.fn().mockResolvedValue([{
          id: 1,
          clientCode: 'TESTCL',
          courier: 'Delhivery',
          service: 'Express',
          pricingType: 'FLAT',
          baseRate: 150,
          minCharge: 0,
          fuelSurcharge: 0,
          gstPercent: 0,
          active: true,
        }]),
      };
      
      await shipmentService.create(payload, 99);

      // Verify debit was for the contract price, not 0
      expect(mockTx.client.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ walletBalance: { decrement: 150 } }),
      }));
      expect(mockTx.walletTransaction.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ amount: 150 }),
      }));
    });

    it('preserves risk analysis score and AI pricing separation', async () => {
      const payload = {
        awb: 'RISK_AWB',
        clientCode: 'TESTCL',
        amount: 200,
        aiPredictedAmount: 250,
      };

      mockTx.client.updateMany = vi.fn().mockResolvedValue({ count: 1 });
      mockTx.client.findUnique = vi.fn().mockResolvedValue({ walletBalance: 800 });
      mockTx.walletTransaction.create = vi.fn().mockResolvedValue({});
      mockTx.shipment.create = vi.fn().mockResolvedValue({
        awb: 'RISK_AWB',
        client: { company: 'Test', phone: '9999' },
      });

      await shipmentService.create(payload, 99);

      expect(mockTx.shipment.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          amount: 200,
          riskScore: 30,
          riskFactors: expect.arrayContaining(['Missing or invalid Consignee Phone Number']),
        }),
      }));
    });
  });

  describe('bulkImport()', () => {
    it('gracefully skips duplicate AWBs and returns correct success/fail counts', async () => {
      const rows = [
        { awb: 'NEW_1', clientCode: 'TESTCL' },
        { awb: 'DUPE_2', clientCode: 'TESTCL' },
      ];

      mockPrisma.client.upsert = vi.fn().mockResolvedValue({});
      
      // Pre-existing AWB
      mockPrisma.shipment.findMany
        .mockResolvedValueOnce([{ id: 99, awb: 'DUPE_2', courier: 'Delhivery', status: 'Booked' }]) // existing lookup
        .mockResolvedValueOnce([{ id: 100, awb: 'NEW_1', clientCode: 'TESTCL', courier: 'Delhivery', status: 'Booked' }]); // after createMany
      mockPrisma.shipment.createMany = vi.fn().mockResolvedValue({ count: 1 });

      const result = await shipmentService.bulkImport(rows, 99);

      expect(result.duplicates).toBe(1);
      expect(result.operationalCreated).toBe(1);
    });

    it('rejects empty or invalid AWBs entirely', async () => {
      const rows = [
        { awb: '', clientCode: 'TESTCL' },
        { awb: null, clientCode: 'TESTCL' },
      ];

      mockPrisma.shipment.findMany = vi.fn().mockResolvedValue([]);

      const result = await shipmentService.bulkImport(rows, 99);

      expect(result.imported).toBe(0);
      expect(result.errors.length).toBe(2);
      expect(mockPrisma.shipment.createMany).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus()', () => {
    it('enforces state machine transitions via API', async () => {
      mockPrisma.shipment.findUnique = vi.fn().mockResolvedValue({
        id: 1, awb: 'STATUS_AWB', status: 'Booked', client: {},
        createdBy: { name: 'Admin' }, updatedBy: null, trackingEvents: [],
      });

      vi.spyOn(stateMachine, 'assertValidTransition').mockImplementation(() => {
        throw new Error('Invalid transition');
      });

      await expect(shipmentService.updateStatus(1, 'Delivered', 99))
        .rejects.toThrow(/transition/);
      
      expect(mockPrisma.shipment.update).not.toHaveBeenCalled();
    });

    it('creates tracking event when status is updated', async () => {
      mockPrisma.shipment.findUnique = vi.fn().mockResolvedValue({
        id: 1, awb: 'STATUS_AWB', status: 'Booked', courier: 'Delhivery', amount: 0,
        client: {}, createdBy: { name: 'Admin' }, updatedBy: null, trackingEvents: [],
      });
      mockPrisma.shipment.update = vi.fn().mockResolvedValue({
        id: 1, awb: 'STATUS_AWB', status: 'PickedUp',
        client: { company: 'Test', phone: '9999', email: 'test@test.com' },
      });
      mockPrisma.trackingEvent.create = vi.fn().mockResolvedValue({});
      
      vi.spyOn(stateMachine, 'assertValidTransition').mockImplementation(() => {});
      vi.spyOn(stateMachine, 'normalizeStatus').mockImplementation((s) => s.replace(' ', ''));

      await shipmentService.updateStatus(1, 'Picked Up', 99);

      expect(mockPrisma.trackingEvent.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          shipmentId: 1,
          awb: 'STATUS_AWB',
          status: 'PickedUp',
        }),
      }));
    });
  });
});
