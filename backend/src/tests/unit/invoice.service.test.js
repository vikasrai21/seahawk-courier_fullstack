import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma } from '../setup.js';
import * as invoiceService from '../../services/invoice.service.js';

vi.mock('../../middleware/errorHandler', () => ({
  AppError: class AppError extends Error {
    constructor(message, statusCode) { super(message); this.statusCode = statusCode; this.isOperational = true; }
  },
}));

describe('invoice.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('throws AppError if client not found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);
      await expect(
        invoiceService.create({ clientCode: 'NONEXISTENT', fromDate: '2023-01-01', toDate: '2023-01-31' })
      ).rejects.toThrow('Client not found');
    });

    it('throws AppError if no unbilled shipments found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({ code: 'CLI-1', gst: '06XXXXX' });
      mockPrisma.shipment.findMany.mockResolvedValue([]);
      await expect(
        invoiceService.create({ clientCode: 'CLI-1', fromDate: '2023-01-01', toDate: '2023-01-31' })
      ).rejects.toThrow('No unbilled shipments found');
    });

    it('handles fractional GST amounts with exact rounding', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({ code: 'CLI-1', gst: '06ABCDE1234F1Z5' }); // Haryana
      mockPrisma.shipment.findMany.mockResolvedValue([
        { id: 1, awb: 'A1', amount: 100.55 },
        { id: 2, awb: 'A2', amount: 200.33 }
      ]);
      mockPrisma.invoice.findFirst.mockResolvedValue(null);
      mockPrisma.invoice.create.mockImplementation((args) => Promise.resolve(args.data));

      const invoice = await invoiceService.create({ clientCode: 'CLI-1', fromDate: '2023-01-01', toDate: '2023-01-31', gstPercent: 18 });
      
      expect(invoice.subtotal).toBe(300.88);
      // GST: 18% of 300.88 = 54.1584 -> rounds to 54.16
      expect(invoice.gstAmount).toBe(54.16);
      expect(invoice.cgstAmount).toBe(27.08); 
      expect(invoice.sgstAmount).toBe(27.08);
      expect(invoice.total).toBe(355.04);
    });

    it('generates invoice successfully with intra-state GST (Haryana)', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({ code: 'CLI-1', gst: '06ABCDE1234F1Z5' }); // Haryana GST
      mockPrisma.shipment.findMany.mockResolvedValue([
        { id: 1, awb: 'A1', amount: 100 },
        { id: 2, awb: 'A2', amount: 200 }
      ]);
      mockPrisma.invoice.findFirst.mockResolvedValue(null); // No previous invoices
      mockPrisma.invoice.create.mockImplementation((args) => Promise.resolve(args.data));

      const invoice = await invoiceService.create({ clientCode: 'CLI-1', fromDate: '2023-01-01', toDate: '2023-01-31', gstPercent: 18 });
      
      expect(invoice.invoiceNo.startsWith(`INV-${new Date().getFullYear()}-001`)).toBe(true);
      expect(invoice.subtotal).toBe(300);
      expect(invoice.gstPercent).toBe(18);
      expect(invoice.gstAmount).toBe(54); // 18% of 300
      expect(invoice.cgstAmount).toBe(27);
      expect(invoice.sgstAmount).toBe(27);
      expect(invoice.igstAmount).toBe(0);
      expect(invoice.total).toBe(354);
    });

    it('generates invoice successfully with inter-state GST', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({ code: 'CLI-2', gst: '27ABCDE1234F1Z5' }); // Maharashtra GST
      mockPrisma.shipment.findMany.mockResolvedValue([
        { id: 1, awb: 'A1', amount: 100 }
      ]);
      mockPrisma.invoice.findFirst.mockResolvedValue({ invoiceNo: `INV-${new Date().getFullYear()}-010` });
      mockPrisma.invoice.create.mockImplementation((args) => Promise.resolve(args.data));

      const invoice = await invoiceService.create({ clientCode: 'CLI-2', fromDate: '2023-01-01', toDate: '2023-01-31', gstPercent: 18 });
      
      expect(invoice.invoiceNo).toBe(`INV-${new Date().getFullYear()}-011`);
      expect(invoice.subtotal).toBe(100);
      expect(invoice.gstAmount).toBe(18);
      expect(invoice.cgstAmount).toBe(0);
      expect(invoice.sgstAmount).toBe(0);
      expect(invoice.igstAmount).toBe(18);
      expect(invoice.total).toBe(118);
    });
  });

  describe('getAll', () => {
    it('returns invoices with items count', async () => {
      const mockResult = [{ id: 1, invoiceNo: 'INV-1' }];
      mockPrisma.invoice.findMany.mockResolvedValue(mockResult);
      const res = await invoiceService.getAll('CLI');
      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { clientCode: 'CLI' }
      }));
      expect(res).toEqual(mockResult);
    });
  });

  describe('getById', () => {
    it('returns invoice if found', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({ id: 1, invoiceNo: 'INV-1' });
      const res = await invoiceService.getById(1);
      expect(res.id).toBe(1);
    });

    it('throws AppError if not found', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);
      await expect(invoiceService.getById(1)).rejects.toThrow('Invoice not found');
    });
  });

  describe('updateStatus', () => {
    it('updates and returns invoice', async () => {
      mockPrisma.invoice.update.mockResolvedValue({ id: 1, status: 'PAID' });
      const res = await invoiceService.updateStatus(1, 'PAID');
      expect(res.status).toBe('PAID');
    });
  });

  describe('remove', () => {
    it('deletes invoice', async () => {
      mockPrisma.invoice.delete.mockResolvedValue({ id: 1 });
      const res = await invoiceService.remove(1);
      expect(res.id).toBe(1);
    });
  });

});
