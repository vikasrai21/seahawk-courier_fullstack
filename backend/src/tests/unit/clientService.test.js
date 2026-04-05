import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma } from '../setup.js';

vi.mock('../../middleware/errorHandler', () => ({
  AppError: class AppError extends Error {
    constructor(message, statusCode) { super(message); this.statusCode = statusCode; this.isOperational = true; }
  },
}));

const clientService = await import('../../services/client.service.js');

describe('client.service', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getAll', () => {
    it('returns all clients ordered by code', async () => {
      mockPrisma.client.findMany.mockResolvedValue([
        { code: 'AAA', company: 'Alpha' },
        { code: 'BBB', company: 'Beta' },
      ]);
      const result = await clientService.getAll();
      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('AAA');
    });
  });

  describe('getByCode', () => {
    it('returns client when found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({ code: 'TEST', company: 'Test Co' });
      const result = await clientService.getByCode('test');
      expect(result.code).toBe('TEST');
    });

    it('throws when not found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);
      await expect(clientService.getByCode('MISSING')).rejects.toThrow('Client not found.');
    });
  });

  describe('upsert', () => {
    it('upserts with uppercased code', async () => {
      mockPrisma.client.upsert.mockResolvedValue({ code: 'SEA', company: 'Sea Hawk' });
      const result = await clientService.upsert({ code: 'sea', company: 'Sea Hawk' });
      expect(result.code).toBe('SEA');
    });
  });

  describe('remove', () => {
    it('deletes client with no shipments', async () => {
      mockPrisma.shipment.count.mockResolvedValue(0);
      mockPrisma.client.delete.mockResolvedValue({ code: 'DEL' });
      const result = await clientService.remove('DEL');
      expect(result.code).toBe('DEL');
    });

    it('throws when client has shipments', async () => {
      mockPrisma.shipment.count.mockResolvedValue(5);
      await expect(clientService.remove('BUSY')).rejects.toThrow('Cannot delete');
    });
  });

  describe('getClientStats', () => {
    it('returns stats with totals aggregated', async () => {
      mockPrisma.$transaction.mockResolvedValue([
        { code: 'SEA', company: 'Sea Hawk' },
        [
          { status: 'Delivered', _count: { id: 10 }, _sum: { amount: 1000, weight: 50 } },
          { status: 'InTransit', _count: { id: 3 }, _sum: { amount: 300, weight: 15 } },
        ],
      ]);
      const result = await clientService.getClientStats('SEA');
      expect(result.stats.total).toBe(13);
      expect(result.stats.amount).toBe(1300);
      expect(result.stats.weight).toBe(65);
    });

    it('throws when client not found', async () => {
      mockPrisma.$transaction.mockResolvedValue([null, []]);
      await expect(clientService.getClientStats('BAD')).rejects.toThrow('Client not found.');
    });
  });
});
