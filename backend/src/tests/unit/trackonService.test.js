import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/logger', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const httpRetry = require('../../utils/httpRetry.js');

const originalEnv = { ...process.env };

describe('trackon.service', () => {
  let fetchSpy;
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = { ...originalEnv };
    fetchSpy = vi.spyOn(httpRetry, 'fetchJsonWithRetry');
  });
  afterAll(() => { process.env = originalEnv; });

  describe('isConfigured', () => {
    it('returns false when key not set', async () => {
      delete process.env.TRACKON_APP_KEY;
      delete process.env.TRACKON_API_KEY;
      delete process.env.TRACKON_USER_ID;
      delete process.env.TRACKON_PASSWORD;
      const svc = await import('../../services/trackon.service.js');
      expect(svc.isConfigured()).toBe(false);
    });

    it('returns true when key set', async () => {
      process.env.TRACKON_APP_KEY = 'key';
      process.env.TRACKON_USER_ID = 'user';
      process.env.TRACKON_PASSWORD = 'pass';
      const svc = await import('../../services/trackon.service.js');
      expect(svc.isConfigured()).toBe(true);
    });
  });

  describe('getTracking', () => {
    it('throws when not configured', async () => {
      delete process.env.TRACKON_APP_KEY;
      delete process.env.TRACKON_API_KEY;
      delete process.env.TRACKON_USER_ID;
      delete process.env.TRACKON_PASSWORD;
      const svc = await import('../../services/trackon.service.js');
      await expect(svc.getTracking('AWB123')).rejects.toThrow('Trackon credentials are not configured');
    });

    it('returns tracking data on success', async () => {
      process.env.TRACKON_APP_KEY = 'key';
      process.env.TRACKON_USER_ID = 'user';
      process.env.TRACKON_PASSWORD = 'pass';
      fetchSpy.mockResolvedValue({
        summaryTrack: {
          CURRENT_STATUS: 'DELIVERED',
          TRACKING_CODE: 'DDUB',
          ORIGIN: 'Delhi',
          DESTINATION: 'Mumbai',
        },
        lstDetails: [],
      });
      const svc = await import('../../services/trackon.service.js');
      const result = await svc.getTracking('AWB123');
      expect(result.courier).toBe('Trackon');
      expect(result.status).toBe('Delivered');
    });

    it('maps standard statuses correctly', async () => {
      process.env.TRACKON_APP_KEY = 'key';
      process.env.TRACKON_USER_ID = 'user';
      process.env.TRACKON_PASSWORD = 'pass';

      fetchSpy.mockResolvedValue({ summaryTrack: { CURRENT_STATUS: 'IN TRANSIT', TRACKING_CODE: 'MFTD' } });
      const svc = await import('../../services/trackon.service.js');
      let result = await svc.getTracking('AWB1');
      expect(result.status).toBe('InTransit');

      fetchSpy.mockResolvedValue({ summaryTrack: { CURRENT_STATUS: 'OUT FOR DELIVERY', TRACKING_CODE: 'DRSG' } });
      result = await svc.getTracking('AWB2');
      expect(result.status).toBe('OutForDelivery');

      fetchSpy.mockResolvedValue({ summaryTrack: { CURRENT_STATUS: 'RTO MARKED', TRACKING_CODE: 'RSET' } });
      result = await svc.getTracking('AWB3');
      expect(result.status).toBe('RTO');

      fetchSpy.mockResolvedValue({ summaryTrack: { CURRENT_STATUS: 'BOOKED', TRACKING_CODE: 'BOKN' } });
      result = await svc.getTracking('AWB4');
      expect(result.status).toBe('Booked');
    });

    it('returns null on API error', async () => {
      process.env.TRACKON_APP_KEY = 'key';
      process.env.TRACKON_USER_ID = 'user';
      process.env.TRACKON_PASSWORD = 'pass';
      fetchSpy.mockRejectedValue(new Error('timeout'));
      const svc = await import('../../services/trackon.service.js');
      const result = await svc.getTracking('AWB123');
      expect(result).toBeNull();
    });
  });
});
