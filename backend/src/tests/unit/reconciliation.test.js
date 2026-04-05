import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma } from '../setup.js';
const reconciliationService = await import('../../services/reconciliation.service.js');

vi.mock('../../utils/rateEngine', () => ({
  stateToZones: vi.fn(() => ({ trackon: 'roi', delhivery: 'A', pt: 'roi' })),
  courierCost: vi.fn((id, zone, weight) => {
    if (id === 'delhivery_std') return { total: 150 };
    return null;
  }),
  COURIERS: [
    { id: 'delhivery_std', label: 'Delhivery' },
    { id: 'trackon_exp', label: 'Trackon' }
  ]
}));

describe('reconciliation.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadCourierInvoice', () => {
    it('calculates discrepancy correctly and creates invoice', async () => {
      mockPrisma.shipment.findMany.mockResolvedValue([
        { awb: 'AWB1', destination: 'Delhi', weight: 1, courier: 'Delhivery' }
      ]);
      
      mockPrisma.courierInvoice.create.mockResolvedValue({ id: 1, totalAmount: 160 });

      const result = await reconciliationService.uploadCourierInvoice({
        courier: 'Delhivery',
        invoiceNo: 'INV-001',
        invoiceDate: '2023-10-01',
        items: [
          { awb: 'AWB1', billedAmount: 160 } // overcharged by 10 (160 - 150)
        ]
      }, 1);

      expect(mockPrisma.courierInvoice.create).toHaveBeenCalled();
      
      // The items array sent to Prisma should have the status "OVER"
      const createCall = mockPrisma.courierInvoice.create.mock.calls[0][0];
      const items = createCall.data.items.create;
      expect(items[0]).toMatchObject({
        awb: 'AWB1',
        calculatedAmount: 64.9,
        billedAmount: 160,
        status: 'OVER',
        discrepancy: 95.1
      });
      expect(result.id).toBe(1);
    });

    it('sets NOT_FOUND for unknown AWBs or couriers', async () => {
      mockPrisma.shipment.findMany.mockResolvedValue([]);
      mockPrisma.courierInvoice.create.mockResolvedValue({ id: 2, totalAmount: 100 });

      const result = await reconciliationService.uploadCourierInvoice({
        courier: 'Unknown',
        invoiceNo: 'INV-002',
        invoiceDate: '2023-10-01',
        items: [
          { awb: 'UNKNOWN_AWB', billedAmount: 100 }
        ]
      }, 1);

      const createCall = mockPrisma.courierInvoice.create.mock.calls[0][0];
      const items = createCall.data.items.create;
      expect(items[0].status).toBe('NOT_FOUND');
    });
  });

  describe('listCourierInvoices', () => {
    it('returns paginated data', async () => {
      mockPrisma.courierInvoice.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrisma.courierInvoice.count.mockResolvedValue(1);

      const result = await reconciliationService.listCourierInvoices({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });
  });

  describe('getCourierInvoiceDetails', () => {
    it('aggregates statistics for invoice items', async () => {
      mockPrisma.courierInvoice.findUnique.mockResolvedValue({
        id: 1,
        items: [
          { status: 'OK', billedAmount: 150, calculatedAmount: 150, discrepancy: 0 },
          { status: 'OVER', billedAmount: 200, calculatedAmount: 150, discrepancy: 50 },
          { status: 'UNDER', billedAmount: 100, calculatedAmount: 150, discrepancy: -50 }
        ]
      });

      const result = await reconciliationService.getCourierInvoiceDetails(1);
      expect(result.summary.ok).toBe(1);
      expect(result.summary.over).toBe(1);
      expect(result.summary.under).toBe(1);
      expect(result.summary.totalBilled).toBe(450);
      expect(result.summary.totalOver).toBe(50);
    });

    it('returns null if not found', async () => {
      mockPrisma.courierInvoice.findUnique.mockResolvedValue(null);
      const result = await reconciliationService.getCourierInvoiceDetails(99);
      expect(result).toBeNull();
    });
  });

  describe('updateInvoiceStatus', () => {
    it('updates status and notes', async () => {
      mockPrisma.courierInvoice.update.mockResolvedValue({ id: 1, status: 'VERIFIED' });
      const result = await reconciliationService.updateInvoiceStatus(1, 'VERIFIED', 'Looks good');
      expect(mockPrisma.courierInvoice.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'VERIFIED', notes: 'Looks good' } })
      );
      expect(result.status).toBe('VERIFIED');
    });
  });

  describe('getReconciliationStats', () => {
    it('calculates global stats', async () => {
      mockPrisma.courierInvoice.findMany.mockResolvedValue([
        { items: [{ billedAmount: 200, calculatedAmount: 150, status: 'OVER', discrepancy: 50 }] },
        { items: [{ billedAmount: 150, calculatedAmount: 150, status: 'OK', discrepancy: 0 }] }
      ]);
      const result = await reconciliationService.getReconciliationStats();
      expect(result.totalInvoices).toBe(2);
      expect(result.totalBilled).toBe(350);
      expect(result.totalOvercharges).toBe(50);
      expect(result.overchargeCount).toBe(1);
    });
  });
});
