import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma } from '../setup.js';

const pickupService = await import('../../services/pickup.service.js');

describe('pickup.service', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('create', () => {
    it('creates a pickup request with unique refNo', async () => {
      mockPrisma.pickupRequest.findUnique.mockResolvedValue(null); // no collision
      mockPrisma.pickupRequest.create.mockResolvedValue({ id: 1, refNo: 'SHK-2026-1234', clientCode: 'SEA' });

      const result = await pickupService.create({ clientCode: 'SEA', pickupDate: '2026-04-05', address: '123 Street' });
      expect(result.refNo).toMatch(/^SHK-\d{4}-\d{4}$/);
      expect(mockPrisma.pickupRequest.create).toHaveBeenCalled();
    });

    it('retries on refNo collision', async () => {
      mockPrisma.pickupRequest.findUnique
        .mockResolvedValueOnce({ id: 99 }) // collision
        .mockResolvedValueOnce(null);       // unique
      mockPrisma.pickupRequest.create.mockResolvedValue({ id: 2, refNo: 'SHK-2026-5678' });

      const result = await pickupService.create({ clientCode: 'TEST' });
      expect(mockPrisma.pickupRequest.findUnique).toHaveBeenCalledTimes(2);
      expect(result.id).toBe(2);
    });
  });

  describe('getAll', () => {
    it('returns paginated results', async () => {
      mockPrisma.pickupRequest.findMany.mockReturnValue(Promise.resolve([{ id: 1 }]));
      mockPrisma.pickupRequest.count.mockReturnValue(Promise.resolve(1));
      const result = await pickupService.getAll({ page: 1, limit: 50 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('filters by status', async () => {
      mockPrisma.pickupRequest.findMany.mockReturnValue(Promise.resolve([]));
      mockPrisma.pickupRequest.count.mockReturnValue(Promise.resolve(0));
      await pickupService.getAll({ status: 'ASSIGNED', page: 1, limit: 50 });
      expect(mockPrisma.pickupRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'ASSIGNED' }) }),
      );
    });

    it('filters by date', async () => {
      mockPrisma.pickupRequest.findMany.mockReturnValue(Promise.resolve([]));
      mockPrisma.pickupRequest.count.mockReturnValue(Promise.resolve(0));
      await pickupService.getAll({ date: '2026-04-05', page: 1, limit: 50 });
      expect(mockPrisma.pickupRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ pickupDate: '2026-04-05' }) }),
      );
    });
  });

  describe('getOne', () => {
    it('returns a single pickup request', async () => {
      mockPrisma.pickupRequest.findUnique.mockResolvedValue({ id: 1, refNo: 'SHK-2026-1234' });
      const result = await pickupService.getOne(1);
      expect(result.refNo).toBe('SHK-2026-1234');
    });
  });

  describe('assign', () => {
    it('assigns agent and marks as ASSIGNED', async () => {
      mockPrisma.pickupRequest.update.mockResolvedValue({ id: 1, status: 'ASSIGNED', assignedAgentId: 5 });
      const result = await pickupService.assign(1, 5);
      expect(result.status).toBe('ASSIGNED');
      expect(result.assignedAgentId).toBe(5);
    });
  });

  describe('updateStatus', () => {
    it('updates status to COMPLETED', async () => {
      mockPrisma.pickupRequest.update.mockResolvedValue({ id: 1, status: 'COMPLETED', completedAt: new Date() });
      const result = await pickupService.updateStatus(1, 'COMPLETED');
      expect(result.status).toBe('COMPLETED');
    });

    it('updates status to IN_PROGRESS without completedAt', async () => {
      mockPrisma.pickupRequest.update.mockResolvedValue({ id: 1, status: 'IN_PROGRESS' });
      const result = await pickupService.updateStatus(1, 'IN_PROGRESS');
      expect(result.status).toBe('IN_PROGRESS');
    });
  });

  describe('linkShipment', () => {
    it('links shipment and marks as COMPLETED', async () => {
      mockPrisma.pickupRequest.update.mockResolvedValue({ id: 1, shipmentId: 100, status: 'COMPLETED' });
      const result = await pickupService.linkShipment(1, 100);
      expect(result.shipmentId).toBe(100);
    });
  });

  describe('getTodayCount', () => {
    it('returns count of today pickups', async () => {
      mockPrisma.pickupRequest.count.mockResolvedValue(7);
      const result = await pickupService.getTodayCount();
      expect(result).toBe(7);
    });
  });
});
