import { describe, it, expect, vi, beforeEach } from 'vitest';

const httpRetry = require('../../utils/httpRetry.js');

describe('pincode.service', () => {
  let fetchSpy;
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    fetchSpy = vi.spyOn(httpRetry, 'fetchJsonWithRetry');
  });

  describe('lookupPincode', () => {
    it('rejects invalid pin code (not 6 digits)', async () => {
      const pincodeService = await import('../../services/pincode.service.js');
      await expect(pincodeService.lookupPincode('123')).rejects.toThrow('Invalid PIN code');
      await expect(pincodeService.lookupPincode('abcdef')).rejects.toThrow('Invalid PIN code');
      await expect(pincodeService.lookupPincode('')).rejects.toThrow('Invalid PIN code');
    });

    it('returns pincode data on success', async () => {
      const pincodeService = await import('../../services/pincode.service.js');
      fetchSpy.mockResolvedValue([{
        Status: 'Success',
        Message: 'Number of pincode(s) found: 1',
        PostOffice: [{ Name: 'Test PO', State: 'Haryana', District: 'Gurugram' }],
      }]);
      const result = await pincodeService.lookupPincode('122015');
      expect(result.pin).toBe('122015');
      expect(result.status).toBe('Success');
      expect(result.postOffice).toBeDefined();
    });

    it('handles invalid pincode response', async () => {
      const pincodeService = await import('../../services/pincode.service.js');
      fetchSpy.mockResolvedValue([{
        Status: 'Error',
        Message: 'No records found',
        PostOffice: null,
      }]);
      const result = await pincodeService.lookupPincode('000000');
      expect(result.status).toBe('Error');
      expect(result.postOffice).toBeNull();
    });

    it('uses cache for repeated lookups', async () => {
      const pincodeService = await import('../../services/pincode.service.js');
      fetchSpy.mockResolvedValue([{
        Status: 'Success',
        Message: 'Found',
        PostOffice: [{ Name: 'Test' }],
      }]);
      await pincodeService.lookupPincode('110001');
      await pincodeService.lookupPincode('110001');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('normalizes pin with whitespace', async () => {
      const pincodeService = await import('../../services/pincode.service.js');
      fetchSpy.mockResolvedValue([{ Status: 'Success', PostOffice: [{ Name: 'T' }] }]);
      const result = await pincodeService.lookupPincode('  110002  ');
      expect(result.pin).toBe('110002');
    });
  });
});
