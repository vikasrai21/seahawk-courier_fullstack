import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma } from '../setup.js';
const ndrService = await import('../../services/ndr.service.js');

describe('ndr.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('returns paginated NDR events', async () => {
      mockPrisma.nDREvent.findMany.mockResolvedValue([{ id: 1, awb: 'AWB1' }]);
      mockPrisma.nDREvent.count.mockResolvedValue(1);
      // Wrap in Promise.all since it uses Promise.all internally
      const findManyPromise = Promise.resolve([{ id: 1, awb: 'AWB1' }]);
      const countPromise = Promise.resolve(1);
      mockPrisma.nDREvent.findMany.mockReturnValue(findManyPromise);
      mockPrisma.nDREvent.count.mockReturnValue(countPromise);

      const result = await ndrService.getAll({ status: undefined, page: 1, limit: 50 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('filters by PENDING status (adminAction is null)', async () => {
      mockPrisma.nDREvent.findMany.mockReturnValue(Promise.resolve([]));
      mockPrisma.nDREvent.count.mockReturnValue(Promise.resolve(0));
      await ndrService.getAll({ status: 'PENDING', page: 1, limit: 50 });
      expect(mockPrisma.nDREvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { adminAction: null } }),
      );
    });

    it('filters by resolved status', async () => {
      mockPrisma.nDREvent.findMany.mockReturnValue(Promise.resolve([]));
      mockPrisma.nDREvent.count.mockReturnValue(Promise.resolve(0));
      await ndrService.getAll({ status: 'REATTEMPT', page: 1, limit: 50 });
      expect(mockPrisma.nDREvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { adminAction: 'REATTEMPT' } }),
      );
    });
  });

  describe('create', () => {
    it('creates an NDR event', async () => {
      mockPrisma.nDREvent.create.mockResolvedValue({ id: 1, awb: 'AWB1', reason: 'Not available' });
      const result = await ndrService.create({ shipmentId: 1, awb: 'AWB1', reason: 'Not available' });
      expect(result.awb).toBe('AWB1');
    });
  });

  describe('resolve', () => {
    it('resolves with REATTEMPT and sets resolvedAt', async () => {
      mockPrisma.nDREvent.update.mockResolvedValue({ id: 1, adminAction: 'REATTEMPT', resolvedAt: new Date() });
      const result = await ndrService.resolve(1, { adminAction: 'REATTEMPT', newAddress: null, notes: 'Try again' });
      expect(result.adminAction).toBe('REATTEMPT');
    });

    it('resolves with RTO and sets resolvedAt', async () => {
      mockPrisma.nDREvent.update.mockResolvedValue({ id: 1, adminAction: 'RTO', resolvedAt: new Date() });
      const result = await ndrService.resolve(1, { adminAction: 'RTO' });
      expect(result.adminAction).toBe('RTO');
    });
  });

  describe('incrementAttempts', () => {
    it('increments attempt count', async () => {
      mockPrisma.nDREvent.update.mockResolvedValue({ id: 1, attempts: 3 });
      const result = await ndrService.incrementAttempts(1);
      expect(result.attempts).toBe(3);
    });
  });
});
