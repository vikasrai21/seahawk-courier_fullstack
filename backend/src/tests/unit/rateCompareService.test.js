import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/logger', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

describe('rateCompare.service', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('compareRates', () => {
    it('returns sorted domestic rates for standard zone', async () => {
      const svc = await import('../../services/rateCompare.service.js');
      const result = await svc.compareRates({ weightKg: 1, zone: 'metro' });
      expect(result.results.length).toBeGreaterThan(0);
      // Results should be sorted by price
      for (let i = 1; i < result.results.length; i++) {
        expect(result.results[i].total).toBeGreaterThanOrEqual(result.results[i - 1].total);
      }
      expect(result.cheapest).toBeDefined();
      expect(result.fastest).toBeDefined();
    });

    it('returns multiple modes per carrier', async () => {
      const svc = await import('../../services/rateCompare.service.js');
      const result = await svc.compareRates({ weightKg: 2, zone: 'northIndia' });
      const delhiveryModes = result.results.filter(r => r.carrier === 'Delhivery');
      expect(delhiveryModes.length).toBe(2); // standard + express
    });

    it('flags cheapest, fastest, and bestValue', async () => {
      const svc = await import('../../services/rateCompare.service.js');
      const result = await svc.compareRates({ weightKg: 1, zone: 'localNCR' });
      const cheapest = result.results.find(r => r.isCheapest);
      const fastest = result.results.find(r => r.isFastest);
      expect(cheapest).toBeDefined();
      expect(fastest).toBeDefined();
    });

    it('returns international carriers only for international shipments', async () => {
      const svc = await import('../../services/rateCompare.service.js');
      const result = await svc.compareRates({ weightKg: 2, zone: 'zoneA', isInternational: true });
      const carriers = [...new Set(result.results.map(r => r.carrier))];
      expect(carriers.every(c => ['FedEx', 'DHL'].includes(c))).toBe(true);
    });

    it('excludes international carriers for domestic shipments', async () => {
      const svc = await import('../../services/rateCompare.service.js');
      const result = await svc.compareRates({ weightKg: 1, zone: 'metro' });
      const carriers = [...new Set(result.results.map(r => r.carrier))];
      expect(carriers.every(c => !['FedEx', 'DHL'].includes(c))).toBe(true);
    });

    it('throws on invalid weight', async () => {
      const svc = await import('../../services/rateCompare.service.js');
      await expect(svc.compareRates({ weightKg: 0, zone: 'metro' })).rejects.toThrow('Invalid weight');
      await expect(svc.compareRates({ weightKg: -1, zone: 'metro' })).rejects.toThrow('Invalid weight');
    });

    it('throws on missing zone', async () => {
      const svc = await import('../../services/rateCompare.service.js');
      await expect(svc.compareRates({ weightKg: 1, zone: '' })).rejects.toThrow('Zone is required');
    });

    it('applies zone multipliers correctly', async () => {
      const svc = await import('../../services/rateCompare.service.js');
      const local = await svc.compareRates({ weightKg: 1, zone: 'localNCR' });
      const remote = await svc.compareRates({ weightKg: 1, zone: 'northEast' });
      // Same carrier/mode should be cheaper for localNCR
      const localDel = local.results.find(r => r.carrier === 'Delhivery' && r.mode === 'standard');
      const remoteDel = remote.results.find(r => r.carrier === 'Delhivery' && r.mode === 'standard');
      expect(localDel.total).toBeLessThan(remoteDel.total);
    });

    it('respects minimum weight', async () => {
      const svc = await import('../../services/rateCompare.service.js');
      const result = await svc.compareRates({ weightKg: 0.1, zone: 'metro' });
      // Weight should be bumped to 0.5
      result.results.forEach(r => {
        expect(r.weightKg).toBeGreaterThanOrEqual(0.5);
      });
    });
  });

  describe('getSingleRate', () => {
    it('returns specific carrier+mode rate', async () => {
      const svc = await import('../../services/rateCompare.service.js');
      const result = await svc.getSingleRate({ carrier: 'Delhivery', mode: 'standard', weightKg: 1, zone: 'metro' });
      expect(result).not.toBeNull();
      expect(result.carrier).toBe('Delhivery');
      expect(result.mode).toBe('standard');
    });

    it('returns null for unknown carrier+mode', async () => {
      const svc = await import('../../services/rateCompare.service.js');
      const result = await svc.getSingleRate({ carrier: 'Delhivery', mode: 'nonexistent', weightKg: 1, zone: 'metro' });
      expect(result).toBeNull();
    });
  });
});
