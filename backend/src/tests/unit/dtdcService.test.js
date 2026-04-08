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
    vi.spyOn(httpRetry, 'fetchWithRetry').mockReset();
  });
  afterAll(() => { process.env = originalEnv; });

  describe('isConfigured', () => {
    it('returns false when keys not set', async () => {
      delete process.env.DTDC_API_KEY;
      delete process.env.DTDC_ACCESS_TOKEN;
      delete process.env.DTDC_USERNAME;
      delete process.env.DTDC_PASSWORD;
      delete process.env.DTDC_CLIENT_ID;
      const svc = await import('../../services/dtdc.service.js');
      expect(svc.isConfigured()).toBe(false);
    });

    it('returns true when access token is set', async () => {
      process.env.DTDC_ACCESS_TOKEN = 'token';
      const svc = await import('../../services/dtdc.service.js');
      expect(svc.isConfigured()).toBe(true);
    });
  });

  describe('getTracking', () => {
    it('throws when not configured', async () => {
      delete process.env.DTDC_API_KEY;
      delete process.env.DTDC_ACCESS_TOKEN;
      delete process.env.DTDC_USERNAME;
      delete process.env.DTDC_PASSWORD;
      delete process.env.DTDC_CLIENT_ID;
      const svc = await import('../../services/dtdc.service.js');
      await expect(svc.getTracking('AWB123')).rejects.toThrow('DTDC API credentials are not configured');
    });

    it('returns tracking data on success with direct access token', async () => {
      process.env.DTDC_ACCESS_TOKEN = 'token';
      fetchSpy.mockResolvedValue({
        statusFlag: true,
        status: 'SUCCESS',
        trackHeader: {
          strStatus: 'Delivered',
          strRemarks: 'John',
          strOrigin: 'Delhi',
          strDestination: 'Mumbai',
          strStatusTransOn: '29052025',
          strStatusTransTime: '1143',
        },
        trackDetails: [
          {
            strCode: 'DLVD',
            strAction: 'Delivered',
            strOrigin: 'Mumbai Branch',
            strActionDate: '29052025',
            strActionTime: '1143',
            sTrRemarks: 'Delivered to John',
          },
        ],
      });
      const svc = await import('../../services/dtdc.service.js');
      const result = await svc.getTracking('AWB123');
      expect(result.courier).toBe('DTDC');
      expect(result.awb).toBe('AWB123');
      expect(result.status).toBe('Delivered');
      expect(result.events).toHaveLength(1);
    });

    it('authenticates with username and password when token is not preset', async () => {
      process.env.DTDC_USERNAME = 'user';
      process.env.DTDC_PASSWORD = 'pass';
      vi.spyOn(httpRetry, 'fetchWithRetry').mockResolvedValue({
        text: vi.fn().mockResolvedValue('generated-token'),
      });
      fetchSpy.mockResolvedValue({
        statusFlag: true,
        status: 'SUCCESS',
        trackHeader: { strStatus: 'Delivery Process In Progress' },
        trackDetails: [],
      });
      const svc = await import('../../services/dtdc.service.js');
      const result = await svc.getTracking('AWB123');
      expect(result.status).toBe('OutForDelivery');
    });

    it('returns null on API error', async () => {
      process.env.DTDC_ACCESS_TOKEN = 'token';
      fetchSpy.mockRejectedValue(new Error('timeout'));
      const svc = await import('../../services/dtdc.service.js');
      const result = await svc.getTracking('AWB123');
      expect(result).toBeNull();
    });
  });
});
