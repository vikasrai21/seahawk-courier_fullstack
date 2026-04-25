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
}));
vi.mock('../../services/queue.service', () => ({
  default: { enqueueTrackingSync: queueMocks.enqueueTrackingSync },
  enqueueTrackingSync: queueMocks.enqueueTrackingSync,
}));

vi.mock('../../services/import-ledger.service', () => ({
  default: { ensureTable: vi.fn(), insertRow: vi.fn() },
  ensureTable: vi.fn(),
  insertRow: vi.fn(),
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
  analyzeShipment: vi.fn(),
}));

vi.mock('../../services/riskAnalysis.service', () => ({
  default: riskMocks,
  ...riskMocks,
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
    mockPrisma.$executeRawUnsafe = vi.fn().mockResolvedValue({}); // Prevent insertRow failure
    mockPrisma.shipment.findUnique = vi.fn().mockResolvedValue(null); // Prevent leaks
    
    vi.spyOn(importLedgerService, 'ensureTable').mockResolvedValue(undefined);
    vi.spyOn(importLedgerService, 'insertRow').mockResolvedValue(undefined);
    
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
        amount: 500, // Explicit amount to charge
        courier: 'Delhivery',
        service: 'Standard',
        date: '2026-04-25',
      };

      // Mock client has enough balance
      mockTx.client.findUnique = vi.fn().mockResolvedValue({
        code: 'TESTCL',
        walletBalance: 1000,
      });
      
      mockTx.client.update = vi.fn().mockResolvedValue({});
      mockTx.walletTransaction.create = vi.fn().mockResolvedValue({ id: 1 });
      mockTx.shipment.create = vi.fn().mockResolvedValue({
        id: 101,
        ...payload,
        status: 'Booked',
      });

      const result = await shipmentService.create(payload, 99); // 99 is createdById

      // Wallet MUST be checked and debited inside the transaction
      expect(mockTx.client.findUnique).toHaveBeenCalledWith({ where: { code: 'TESTCL' }, select: { walletBalance: true } });
      expect(mockTx.client.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { code: 'TESTCL' },
        data: expect.objectContaining({ walletBalance: { decrement: 500 } })
      }));
      expect(mockTx.walletTransaction.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          type: 'DEBIT',
          amount: 500,
          description: expect.stringContaining('NEW_AWB_123')
        })
      }));
      
      // Shipment must be created
      expect(mockTx.shipment.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          awb: 'NEW_AWB_123',
          amount: 500,
          status: 'Booked'
        })
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

      // Simulate Prisma Unique Constraint error
      const p2002Error = new Error('Unique constraint failed');
      p2002Error.code = 'P2002';
      
      mockTx.client.findUnique = vi.fn().mockResolvedValue({ walletBalance: 1000 });
      mockTx.client.update = vi.fn().mockResolvedValue({});
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

      mockTx.client.findUnique = vi.fn().mockResolvedValue({
        code: 'TESTCL',
        walletBalance: 100, // Insufficient!
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
        amount: 0, // Should auto-calculate
        courier: 'Delhivery',
        service: 'Express',
      };

      mockTx.client.findUnique = vi.fn().mockResolvedValue({ walletBalance: 1000 });
      mockTx.client.update = vi.fn().mockResolvedValue({});
      mockTx.shipment.create = vi.fn().mockResolvedValue({ awb: 'CONTRACT_AWB', amount: 150 });
      mockTx.walletTransaction.create = vi.fn().mockResolvedValue({});
      
      // Mock the database to return a contract so the REAL contractService calculates a price
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
        }])
      };
      
      await shipmentService.create(payload, 99);

      // Verify debit was for 150, not 0
      expect(mockTx.client.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ walletBalance: { decrement: 150 } })
      }));
      expect(mockTx.walletTransaction.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ amount: 150 })
      }));
    });

    it('preserves risk analysis score and AI pricing separation', async () => {
      const payload = {
        awb: 'RISK_AWB',
        clientCode: 'TESTCL',
        amount: 200,
        aiPredictedAmount: 250, // Should NOT override final amount
      };

      mockTx.client.findUnique = vi.fn().mockResolvedValue({ walletBalance: 1000 });
      mockTx.client.update = vi.fn().mockResolvedValue({});
      mockTx.shipment.create = vi.fn().mockResolvedValue({ awb: 'RISK_AWB' });

      await shipmentService.create(payload, 99);

      expect(mockTx.shipment.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          amount: 200, // Final amount stays 200
          riskScore: 30, // Default computed by real risk analysis when missing phone
          riskFactors: expect.arrayContaining(['Missing or invalid Consignee Phone Number']),
        })
      }));
    });
  });

  describe('bulkImport()', () => {
    it('gracefully skips duplicate AWBs and returns correct success/fail counts', async () => {
      const rows = [
        { awb: 'NEW_1', clientCode: 'TESTCL' },
        { awb: 'DUPE_2', clientCode: 'TESTCL' }, // Will fail
      ];

      mockPrisma.client.upsert = vi.fn().mockResolvedValue({});
      
      // Setup mock to fail on second create
      const p2002Error = new Error('Unique constraint failed');
      p2002Error.code = 'P2002';
      
      mockPrisma.shipment.create = vi.fn()
        .mockResolvedValueOnce({ id: 1, awb: 'NEW_1' })
        .mockRejectedValueOnce(p2002Error);

      const result = await shipmentService.bulkImport(rows, 99);

      expect(result.imported).toBe(1);
      expect(result.duplicates).toBe(1);
      expect(result.errors.length).toBe(0);
    });

    it('rejects empty or invalid AWBs entirely', async () => {
      const rows = [
        { awb: '', clientCode: 'TESTCL' },
        { awb: null, clientCode: 'TESTCL' },
      ];

      const result = await shipmentService.bulkImport(rows, 99);

      expect(result.imported).toBe(0);
      expect(result.errors.length).toBe(2);
      expect(mockPrisma.shipment.create).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus()', () => {

    it('enforces state machine transitions via API', async () => {
      mockPrisma.shipment.findUnique = vi.fn().mockResolvedValue({
        id: 1, awb: 'STATUS_AWB', status: 'Booked'
      });

      await expect(shipmentService.updateStatus(1, 'Delivered', 99))
        .rejects.toThrow(/transition/);
      
      expect(mockPrisma.shipment.update).not.toHaveBeenCalled();
    });

    it('creates tracking event when status is updated', async () => {
      mockPrisma.shipment.findUnique = vi.fn().mockResolvedValue({
        id: 1, awb: 'STATUS_AWB', status: 'Booked', courier: 'Delhivery'
      });
      mockPrisma.shipment.update = vi.fn().mockResolvedValue({
        id: 1, awb: 'STATUS_AWB', status: 'PickedUp'
      });
      mockPrisma.trackingEvent.create = vi.fn().mockResolvedValue({});
      
      vi.spyOn(stateMachine, 'assertValidTransition').mockImplementation(() => {}); // Allow
      vi.spyOn(stateMachine, 'normalizeStatus').mockImplementation((s) => s.replace(' ', '')); // Handle "Picked Up" -> "PickedUp"

      await shipmentService.updateStatus(1, 'Picked Up', 99, {
        location: 'Warehouse', description: 'Picked up successfully'
      });

      expect(mockPrisma.trackingEvent.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          shipmentId: 1,
          awb: 'STATUS_AWB',
          status: 'PickedUp',
        })
      }));
    });
  });
});
