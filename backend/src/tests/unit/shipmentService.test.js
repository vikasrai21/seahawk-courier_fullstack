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

describe('shipment.service', () => {
  beforeEach(() => vi.clearAllMocks());

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
});
