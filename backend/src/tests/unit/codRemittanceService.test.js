import { describe, it, expect, vi, beforeEach } from 'vitest';
import codRemittanceService from '../../services/codRemittance.service';
import prisma from '../../config/prisma';
import walletService from '../../services/wallet.service';

vi.mock('../../config/prisma', () => ({
  default: {
    shipment: { findMany: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
    cODRemittance: { create: vi.fn(), findMany: vi.fn() },
    $transaction: vi.fn((cb) => cb({
      shipment: { updateMany: vi.fn(), update: vi.fn() },
      cODRemittance: { create: vi.fn() }
    }))
  }
}));

vi.mock('../../services/wallet.service', () => ({
  default: { adjust: vi.fn() }
}));

describe('codRemittance.service', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('markCollected', () => {
    it('should update shipment codStatus to COLLECTED', async () => {
      prisma.shipment.findUnique.mockResolvedValue({ id: 1, codStatus: 'PENDING', codAmount: 100 });
      prisma.shipment.update.mockResolvedValue({ id: 1, codStatus: 'COLLECTED' });

      const res = await codRemittanceService.markCollected(1);
      expect(prisma.shipment.update).toHaveBeenCalledWith({
        where: { id: 1 }, data: { codStatus: 'COLLECTED' }
      });
      expect(res.codStatus).toBe('COLLECTED');
    });

    it('should throw if shipment not found or not PENDING', async () => {
      prisma.shipment.findUnique.mockResolvedValue({ id: 1, codStatus: 'REMITTED' });
      await expect(codRemittanceService.markCollected(1)).rejects.toThrow('Shipment not pending COD collection');
    });
  });

  describe('processRemittanceBatch', () => {
    it('should calculate net amount and create remittance record', async () => {
      const mockShipments = [
        { id: 1, awb: 'A1', codAmount: 1000, clientCode: 'C1' },
        { id: 2, awb: 'A2', codAmount: 2000, clientCode: 'C1' }
      ];
      
      prisma.shipment.findMany.mockResolvedValue(mockShipments);
      prisma.$transaction.mockImplementation(async (cb) => {
        const tx = {
          cODRemittance: { create: vi.fn().mockResolvedValue({ id: 10, totalAmount: 3000, netAmount: 2900 }) },
          shipment: { updateMany: vi.fn() }
        };
        return await cb(tx);
      });

      const res = await codRemittanceService.processRemittanceBatch('C1', 'DELHIVERY', 100);
      
      expect(res.totalAmount).toBe(3000);
      expect(res.netAmount).toBe(2900); // 3000 - 100 fee
      expect(walletService.adjust).toHaveBeenCalledWith('C1', 2900, 'COD_REMITTANCE', expect.any(String));
    });

    it('should throw if no eligible shipments found', async () => {
      prisma.shipment.findMany.mockResolvedValue([]);
      await expect(codRemittanceService.processRemittanceBatch('C1', 'DELHIVERY', 100)).rejects.toThrow('No eligible COD shipments found');
    });
  });
});
