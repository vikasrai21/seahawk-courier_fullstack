import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma } from '../setup.js';

vi.mock('../../utils/logger', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('../../config/redis', () => ({ default: { status: 'end', get: vi.fn(), del: vi.fn(), setex: vi.fn() } }));
vi.mock('../../utils/cache', () => ({ default: { delByPrefix: vi.fn().mockResolvedValue(undefined) } }));
vi.mock('../../services/notification.service', () => ({ default: { notifyStatusChange: vi.fn(), sendPODEmail: vi.fn() } }));
vi.mock('../../realtime/socket', () => ({
  emitShipmentCreated: vi.fn(),
  emitShipmentStatusUpdated: vi.fn(),
}));
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
vi.mock('../../services/import-ledger.service', () => ({
  default: { ensureTable: vi.fn(), insertRow: vi.fn() },
  ensureTable: vi.fn(),
  insertRow: vi.fn(),
}));
vi.mock('../../services/delhivery.service', () => ({ default: { getTracking: vi.fn() } }));
vi.mock('../../services/trackon.service', () => ({ default: { getTracking: vi.fn() } }));
vi.mock('../../services/dtdc.service', () => ({ default: { getTracking: vi.fn() } }));
vi.mock('../../services/wallet.service', () => ({ default: { creditShipmentRefund: vi.fn() }, creditShipmentRefund: vi.fn() }));
vi.mock('../../services/queue.service', () => ({
  default: { enqueueTrackingSync: vi.fn() },
  enqueueTrackingSync: vi.fn(),
}));
vi.mock('../../middleware/errorHandler', () => ({
  AppError: class AppError extends Error {
    constructor(message, statusCode) { super(message); this.statusCode = statusCode; this.isOperational = true; }
  },
}));
vi.mock('../../services/stateMachine', () => ({
  default: {
    assertValidTransition: vi.fn(),
    shouldRefund: vi.fn(() => false),
  },
  assertValidTransition: vi.fn(),
  shouldRefund: vi.fn(() => false),
  normalizeStatus: vi.fn((s) => s),
}));

const shipmentService = await import('../../services/shipment.service.js');
const queueService = await import('../../services/queue.service.js');
const importLedgerService = await import('../../services/import-ledger.service.js');
const contractService = await import('../../services/contract.service.js');
const trackonService = await import('../../services/trackon.service.js');
const dtdcService = await import('../../services/dtdc.service.js');

describe('shipment.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(importLedgerService, 'ensureTable').mockResolvedValue(undefined);
    vi.spyOn(importLedgerService, 'insertRow').mockResolvedValue(undefined);
    vi.spyOn(contractService, 'getActiveContractsByClientCodes').mockResolvedValue({});
    vi.spyOn(contractService, 'selectBestContract').mockReturnValue(null);
    vi.spyOn(contractService, 'calculatePriceFromContract').mockReturnValue(null);
    mockPrisma.$queryRawUnsafe = vi.fn().mockResolvedValue([{}]);
  });

  // ── getAll ──────────────────────────────────────────────────────
  describe('getAll', () => {
    it('returns paginated shipments', async () => {
      mockPrisma.$transaction.mockResolvedValue([100, [{ id: 1, awb: 'AWB001' }]]);
      const result = await shipmentService.getAll({}, 1, 50);
      expect(result.total).toBe(100);
      expect(result.shipments).toHaveLength(1);
    });

    it('clamps page and limit to safe values', async () => {
      mockPrisma.$transaction.mockResolvedValue([0, []]);
      const result = await shipmentService.getAll({}, -5, 9999);
      expect(result).toHaveProperty('shipments');
    });
  });

  // ── getById ─────────────────────────────────────────────────────
  describe('getById', () => {
    it('returns shipment when found', async () => {
      const mockShipment = { id: 1, awb: 'AWB001', client: {} };
      mockPrisma.shipment.findUnique.mockResolvedValue(mockShipment);
      const result = await shipmentService.getById(1);
      expect(result.awb).toBe('AWB001');
    });

    it('throws when shipment not found', async () => {
      mockPrisma.shipment.findUnique.mockResolvedValue(null);
      await expect(shipmentService.getById(999)).rejects.toThrow('Shipment not found.');
    });
  });

  // ── update ──────────────────────────────────────────────────────
  describe('update', () => {
    it('uppercases consignee and destination', async () => {
      mockPrisma.shipment.update.mockResolvedValue({ id: 1, consignee: 'JOHN', destination: 'DELHI', client: {} });
      const result = await shipmentService.update(1, { consignee: 'john', destination: 'delhi' }, 1);
      expect(result.consignee).toBe('JOHN');
    });
  });

  // ── remove ──────────────────────────────────────────────────────
  describe('remove', () => {
    it('deletes shipment by id', async () => {
      mockPrisma.shipment.delete.mockResolvedValue({ id: 1 });
      const result = await shipmentService.remove(1);
      expect(result.id).toBe(1);
    });
  });

  describe('bulkImport', () => {
    it('auto-detects courier and queues tracking sync for imported active shipments', async () => {
      mockPrisma.client.upsert.mockResolvedValue({});
      mockPrisma.shipment.findUnique.mockResolvedValue(null);
      mockPrisma.shipment.create.mockResolvedValue({
        id: 42,
        awb: 'Z66077871',
        courier: 'DTDC',
        status: 'Booked',
      });

      const result = await shipmentService.bulkImport([
        {
          awb: 'Z66077871',
          clientCode: 'sea',
          consignee: 'john',
          destination: 'pune',
          weight: 1,
          amount: 0,
          courier: '',
          service: 'Standard',
          status: '',
        },
      ], 7);

      expect(mockPrisma.shipment.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          courier: 'DTDC',
          status: 'Booked',
        }),
      }));
      expect(queueService.enqueueTrackingSync).toHaveBeenCalledWith(42, 'Z66077871', 'DTDC');
      expect(result.trackingQueued).toBe(1);
    });
  });

  describe('scanAwbAndUpdate', () => {
    it('creates a placeholder capture when live tracking is unavailable in capture mode', async () => {
      vi.spyOn(trackonService.default, 'getTracking').mockResolvedValue(null);
      mockPrisma.shipment.findUnique.mockResolvedValueOnce(null);
      mockPrisma.shipment.findUnique.mockResolvedValueOnce(null);
      mockPrisma.shipment.create.mockResolvedValue({
        id: 91,
        awb: '200062288907',
        courier: 'Trackon',
        status: 'Booked',
        client: null,
      });

      const result = await shipmentService.scanAwbAndUpdate('200062288907', 5, 'AUTO', {
        captureOnly: true,
        source: 'scanner',
      });

      expect(mockPrisma.shipment.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          awb: '200062288907',
          courier: 'Trackon',
          remarks: 'SCAN_CAPTURED: Intake awaiting tracking sync',
          status: 'Booked',
        }),
      }));
      expect(result.meta).toEqual(expect.objectContaining({
        source: 'captured_placeholder',
        trackingUnavailable: true,
        existed: false,
      }));
    });

    it('reuses an existing shipment in capture mode when tracking is unavailable', async () => {
      vi.spyOn(dtdcService.default, 'getTracking').mockResolvedValue(null);
      mockPrisma.shipment.findUnique
        .mockResolvedValueOnce({ id: 10, awb: 'Z66077871', status: 'Booked' })
        .mockResolvedValueOnce({ id: 10, awb: 'Z66077871', remarks: '', client: null });
      mockPrisma.shipment.update.mockResolvedValue({
        id: 10,
        awb: 'Z66077871',
        courier: 'DTDC',
        status: 'Booked',
        remarks: 'SCAN_CAPTURED: Intake awaiting tracking sync',
        client: null,
      });

      const result = await shipmentService.scanAwbAndUpdate('Z66077871', 8, 'DTDC', {
        captureOnly: true,
        source: 'scanner',
      });

      expect(mockPrisma.shipment.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { awb: 'Z66077871' },
        data: expect.objectContaining({
          courier: 'DTDC',
          updatedById: 8,
        }),
      }));
      expect(result.meta).toEqual(expect.objectContaining({
        source: 'local_existing',
        trackingUnavailable: true,
        existed: true,
      }));
    });
  });
});
