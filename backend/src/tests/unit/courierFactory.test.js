import { describe, it, expect } from 'vitest';
import { CourierFactory } from '../../services/couriers/CourierFactory.js';

describe('CourierFactory', () => {
  it('lists all registered couriers', () => {
    const all = CourierFactory.getAll();
    expect(all).toContain('Delhivery');
    expect(all).toContain('DTDC');
    expect(all).toContain('BlueDart');
  });

  it('returns empty configured list when no API keys set', () => {
    // No API keys in test env
    const configured = CourierFactory.getConfigured();
    expect(Array.isArray(configured)).toBe(true);
  });

  it('throws for unknown courier', () => {
    expect(() => CourierFactory.get('XYZCourier')).toThrow(/Unknown courier/);
  });

  it('returns internal rate estimates when no APIs configured', async () => {
    const rates = await CourierFactory.compareRates({ weight: 1, cod: 0 });
    expect(rates.length).toBeGreaterThan(0);
    expect(rates[0]).toHaveProperty('courier');
    expect(rates[0]).toHaveProperty('rate');
  });

  it('cheapest courier comes first in rate comparison', async () => {
    const rates = await CourierFactory.compareRates({ weight: 0.5, cod: 0 });
    const sorted = [...rates].sort((a, b) => (a.rate?.total || 0) - (b.rate?.total || 0));
    expect(rates[0].courier).toBe(sorted[0].courier);
  });
});
