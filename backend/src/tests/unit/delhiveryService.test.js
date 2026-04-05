import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/logger', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const httpRetry = require('../../utils/httpRetry.js');

// Reset env vars for each test
const originalEnv = { ...process.env };

describe('delhivery.service', () => {
  let fetchSpy;
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = { ...originalEnv };
    fetchSpy = vi.spyOn(httpRetry, 'fetchJsonWithRetry');
  });

  afterAll(() => { process.env = originalEnv; });

  describe('mapStatus', () => {
    it('maps Delhivery statuses to internal statuses', async () => {
      process.env.DELHIVERY_API_KEY = 'test-key';
      const svc = await import('../../services/delhivery.service.js');
      expect(svc.mapStatus('Delivered')).toBe('Delivered');
      expect(svc.mapStatus('DLVD')).toBe('Delivered');
      expect(svc.mapStatus('Out For Delivery')).toBe('OutForDelivery');
      expect(svc.mapStatus('OFD')).toBe('OutForDelivery');
      expect(svc.mapStatus('In Transit')).toBe('InTransit');
      expect(svc.mapStatus('Dispatched')).toBe('InTransit');
      expect(svc.mapStatus('Reached Hub')).toBe('InTransit');
      expect(svc.mapStatus('Picked Up')).toBe('InTransit');
      expect(svc.mapStatus('Manifest')).toBe('InTransit');
      expect(svc.mapStatus('RTO Initiated')).toBe('RTO');
      expect(svc.mapStatus('Return')).toBe('RTO');
      expect(svc.mapStatus('Failed')).toBe('Delayed');
      expect(svc.mapStatus('Cancelled')).toBe('Delayed');
      expect(svc.mapStatus('SomeUnknownStatus')).toBe('Booked');
    });
  });

  describe('isConfigured', () => {
    it('returns false when API key not set', async () => {
      delete process.env.DELHIVERY_API_KEY;
      const svc = await import('../../services/delhivery.service.js');
      expect(svc.isConfigured()).toBe(false);
    });
  });

  describe('getTracking', () => {
    it('returns null when not configured', async () => {
      delete process.env.DELHIVERY_API_KEY;
      const svc = await import('../../services/delhivery.service.js');
      const result = await svc.getTracking('AWB123');
      expect(result).toBeNull();
    });

    it('returns tracking data on success', async () => {
      process.env.DELHIVERY_API_KEY = 'test-key';
      fetchSpy.mockResolvedValue({
        ShipmentData: [{
          Shipment: {
            Status: { Status: 'Delivered', Instructions: 'Delivered to consignee' },
            Origin: 'Delhi',
            Destination: 'Mumbai',
            ExpectedDeliveryDate: '2025-01-10',
            Delivered: '2025-01-09',
            RecipientName: 'John Doe',
            Scans: [{
              ScanDetail: {
                Scan: 'Delivered',
                ScannedLocation: 'Mumbai Hub',
                Instructions: 'Delivered to consignee',
                ScanDateTime: '2025-01-09T10:00:00',
              }
            }],
          }
        }],
      });
      const svc = await import('../../services/delhivery.service.js');
      const result = await svc.getTracking('AWB123');
      expect(result.awb).toBe('AWB123');
      expect(result.courier).toBe('Delhivery');
      expect(result.status).toBe('Delivered');
      expect(result.events).toHaveLength(1);
    });

    it('returns null when no shipment data', async () => {
      process.env.DELHIVERY_API_KEY = 'test-key';
      fetchSpy.mockResolvedValue({ ShipmentData: [{}] });
      const svc = await import('../../services/delhivery.service.js');
      const result = await svc.getTracking('AWB123');
      expect(result).toBeNull();
    });

    it('returns null on API error', async () => {
      process.env.DELHIVERY_API_KEY = 'test-key';
      fetchSpy.mockRejectedValue(new Error('timeout'));
      const svc = await import('../../services/delhivery.service.js');
      const result = await svc.getTracking('AWB123');
      expect(result).toBeNull();
    });
  });

  describe('createShipment', () => {
    it('throws when not configured', async () => {
      delete process.env.DELHIVERY_API_KEY;
      const svc = await import('../../services/delhivery.service.js');
      await expect(svc.createShipment({ consignee: 'Test', deliveryPin: '400001', weightGrams: 500 }))
        .rejects.toThrow('DELHIVERY_API_KEY not set');
    });

    it('returns AWB on success', async () => {
      process.env.DELHIVERY_API_KEY = 'test-key';
      fetchSpy.mockResolvedValue({
        packages: [{ waybill: 'DLV123', remarks: '' }],
      });
      const svc = await import('../../services/delhivery.service.js');
      const result = await svc.createShipment({
        consignee: 'Test', deliveryAddress: 'Address', deliveryCity: 'Mumbai',
        deliveryState: 'MH', deliveryPin: '400001', phone: '9876543210', weightGrams: 500,
      });
      expect(result.awb).toBe('DLV123');
      expect(result.courier).toBe('Delhivery');
    });

    it('throws when no AWB returned', async () => {
      process.env.DELHIVERY_API_KEY = 'test-key';
      fetchSpy.mockResolvedValue({
        packages: [{ waybill: '', remarks: 'Invalid address' }],
      });
      const svc = await import('../../services/delhivery.service.js');
      await expect(svc.createShipment({
        consignee: 'Test', deliveryPin: '400001', weightGrams: 500,
      })).rejects.toThrow('Invalid address');
    });
  });

  describe('getLabel', () => {
    it('throws when not configured', async () => {
      delete process.env.DELHIVERY_API_KEY;
      const svc = await import('../../services/delhivery.service.js');
      await expect(svc.getLabel('AWB123')).rejects.toThrow('DELHIVERY_API_KEY not set');
    });
  });

  describe('cancelShipment', () => {
    it('throws when not configured', async () => {
      delete process.env.DELHIVERY_API_KEY;
      const svc = await import('../../services/delhivery.service.js');
      await expect(svc.cancelShipment('AWB123')).rejects.toThrow('DELHIVERY_API_KEY not set');
    });
  });

  describe('checkServiceability', () => {
    it('returns serviceable when API key not set', async () => {
      delete process.env.DELHIVERY_API_KEY;
      vi.mock('../../config/prisma', () => ({
        default: { delhiveryPincode: { findUnique: vi.fn().mockResolvedValue(null) } },
      }));
      const svc = await import('../../services/delhivery.service.js');
      const result = await svc.checkServiceability('400001');
      expect(result.serviceable).toBe(true);
    });
  });
});
