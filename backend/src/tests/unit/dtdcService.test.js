import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/logger', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const httpRetry = require('../../utils/httpRetry.js');

const originalEnv = { ...process.env };

describe('dtdc.service', () => {
  let fetchSpy;
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = { ...originalEnv };
    fetchSpy = vi.spyOn(httpRetry, 'fetchJsonWithRetry');
  });
  afterAll(() => { process.env = originalEnv; });

  describe('isConfigured', () => {
    it('returns false when keys not set', async () => {
      delete process.env.DTDC_API_KEY;
      delete process.env.DTDC_CLIENT_ID;
      const svc = await import('../../services/dtdc.service.js');
      expect(svc.isConfigured()).toBe(false);
    });

    it('returns true when both keys set', async () => {
      process.env.DTDC_API_KEY = 'key';
      process.env.DTDC_CLIENT_ID = 'client';
      const svc = await import('../../services/dtdc.service.js');
      expect(svc.isConfigured()).toBe(true);
    });
  });

  describe('getTracking', () => {
    it('throws when not configured', async () => {
      delete process.env.DTDC_API_KEY;
      delete process.env.DTDC_CLIENT_ID;
      const svc = await import('../../services/dtdc.service.js');
      await expect(svc.getTracking('AWB123')).rejects.toThrow('DTDC API credentials are not configured');
    });

    it('returns tracking data on success', async () => {
      process.env.DTDC_API_KEY = 'key';
      process.env.DTDC_CLIENT_ID = 'client';
      fetchSpy.mockResolvedValue({
        status: 'DELIVERED',
        details: 'Delivered successfully',
        recipient_name: 'John',
      });
      const svc = await import('../../services/dtdc.service.js');
      const result = await svc.getTracking('AWB123');
      expect(result.courier).toBe('DTDC');
      expect(result.awb).toBe('AWB123');
    });

    it('returns null on API error', async () => {
      process.env.DTDC_API_KEY = 'key';
      process.env.DTDC_CLIENT_ID = 'client';
      fetchSpy.mockRejectedValue(new Error('timeout'));
      const svc = await import('../../services/dtdc.service.js');
      const result = await svc.getTracking('AWB123');
      expect(result).toBeNull();
    });
  });
});
