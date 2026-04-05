import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma } from '../setup.js';
const trackingService = await import('../../services/tracking.service.js');

describe('tracking.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('STATUSES', () => {
    it('exports a predefined list of statuses', () => {
      expect(trackingService.STATUSES).toBeDefined();
      expect(trackingService.STATUSES).toContain('Booked');
      expect(trackingService.STATUSES).toContain('Delivered');
      expect(trackingService.STATUSES).toContain('RTO Delivered');
    });
  });

  describe('getTimeline', () => {
    it('returns events and shipment for an AWB', async () => {
      mockPrisma.trackingEvent.findMany.mockResolvedValue([
        { id: 1, awb: 'AWB1', status: 'Booked', location: 'Delhi' },
        { id: 2, awb: 'AWB1', status: 'In Transit', location: 'Jaipur' },
      ]);
      mockPrisma.shipment.findFirst.mockResolvedValue({
        id: 1, awb: 'AWB1', client: { code: 'SEA', company: 'Sea Hawk' },
      });
      const result = await trackingService.getTimeline('AWB1');
      expect(result.events).toHaveLength(2);
      expect(result.shipment.awb).toBe('AWB1');
    });
  });

  describe('addEvent', () => {
    it('creates event and updates shipment status', async () => {
      mockPrisma.trackingEvent.create.mockResolvedValue({ id: 1, status: 'Delivered' });
      mockPrisma.shipment.updateMany.mockResolvedValue({ count: 1 });

      const result = await trackingService.addEvent({
        shipmentId: 1, awb: 'AWB1', status: 'Delivered', location: 'Mumbai', description: 'Delivered to consignee',
      });
      expect(result.status).toBe('Delivered');
      expect(mockPrisma.shipment.updateMany).toHaveBeenCalled();
    });

    it('does not update shipment for unknown status', async () => {
      mockPrisma.trackingEvent.create.mockResolvedValue({ id: 1, status: 'Random' });
      await trackingService.addEvent({
        shipmentId: 1, awb: 'AWB1', status: 'Random', location: 'Somewhere',
      });
      expect(mockPrisma.shipment.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('bulkAddEvents', () => {
    it('creates multiple events', async () => {
      mockPrisma.trackingEvent.createMany.mockResolvedValue({ count: 3 });
      const result = await trackingService.bulkAddEvents([
        { shipmentId: 1, awb: 'A', status: 'Booked' },
        { shipmentId: 2, awb: 'B', status: 'InTransit' },
        { shipmentId: 3, awb: 'C', status: 'Delivered' },
      ]);
      expect(result.count).toBe(3);
    });
  });

  describe('getRecentEvents', () => {
    it('returns recent events with default limit', async () => {
      mockPrisma.trackingEvent.findMany.mockResolvedValue([{ id: 1 }]);
      const result = await trackingService.getRecentEvents();
      expect(result).toHaveLength(1);
    });
  });

  describe('seedBookedEvent', () => {
    it('creates initial Booked event when none exists', async () => {
      mockPrisma.trackingEvent.count.mockResolvedValue(0);
      mockPrisma.trackingEvent.create.mockResolvedValue({ id: 1, status: 'Booked' });
      await trackingService.seedBookedEvent({ id: 1, awb: 'AWB1', courier: 'Delhivery' });
      expect(mockPrisma.trackingEvent.create).toHaveBeenCalled();
    });

    it('skips when events already exist', async () => {
      mockPrisma.trackingEvent.count.mockResolvedValue(3);
      await trackingService.seedBookedEvent({ id: 1, awb: 'AWB1', courier: 'Delhivery' });
      expect(mockPrisma.trackingEvent.create).not.toHaveBeenCalled();
    });
  });
});
