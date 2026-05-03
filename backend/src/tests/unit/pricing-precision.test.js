import { describe, it, expect } from 'vitest';
import contractService from '../../services/contract.service.js';

describe('Pricing Precision & Float Arithmetic', () => {
  it('calculates complex subtotal with exact precision', () => {
    // Math.round((100.55 + 10.33) * 100) / 100
    const contract = {
      id: 1,
      name: 'Precision',
      pricingType: 'SIMPLE',
      pricingRules: {
        type: 'simple',
        rules: [
          { zone: 'local', rate: 100.55, baseCharge: 10.33 }
        ]
      },
      fuelSurcharge: 0,
      gstPercent: 0,
    };

    const price = contractService.calculatePriceFromContract(contract, 1, { zone: 'local' });
    expect(price.subtotal).toBe(110.88);
  });

  it('calculates fuel surcharge precision without floating point drift', () => {
    const contract = {
      id: 2,
      name: 'Fuel',
      pricingType: 'SIMPLE',
      pricingRules: {
        type: 'simple',
        rules: [
          { zone: 'local', rate: 100.10 }
        ]
      },
      fuelSurcharge: 10, // 10% of 100.10 = 10.010000000000002 without precision
      gstPercent: 0,
    };

    const price = contractService.calculatePriceFromContract(contract, 1, { zone: 'local' });
    expect(price.fuelSurcharge).toBe(10.01);
    expect(price.subtotal).toBe(110.11);
  });

  it('calculates fractional GST precision correctly', () => {
    const contract = {
      id: 3,
      name: 'GST',
      pricingType: 'SIMPLE',
      pricingRules: {
        type: 'simple',
        rules: [
          { zone: 'local', rate: 45.45 }
        ]
      },
      fuelSurcharge: 5.5, // 5.5% of 45.45 = 2.49975 -> 2.50
      gstPercent: 18, // 18% of 47.95 = 8.631 -> 8.63
    };

    const price = contractService.calculatePriceFromContract(contract, 1, { zone: 'local' });
    expect(price.base).toBe(45.45);
    expect(price.fuelSurcharge).toBe(2.50);
    expect(price.subtotal).toBe(47.95);
    expect(price.gst).toBe(8.63);
    expect(price.total).toBe(56.58);
  });

  it('respects decimal precision on minimum charges', () => {
    const contract = {
      id: 4,
      name: 'MinCharge',
      pricingType: 'SIMPLE',
      pricingRules: {
        type: 'simple',
        rules: [
          { zone: 'local', rate: 10.123, minCharge: 50.55 }
        ]
      },
      fuelSurcharge: 0,
      gstPercent: 0,
    };

    const price = contractService.calculatePriceFromContract(contract, 1, { zone: 'local' });
    // rate is 10.123, but minCharge is 50.55. So base should be 50.55.
    expect(price.base).toBe(50.55);
  });

  it('handles per-kg decimal multipliers without drift', () => {
    const contract = {
      id: 5,
      name: 'Matrix Per KG',
      pricingType: 'SLAB_BASED',
      pricingRules: [
        { mode: 'surface', zone: 'local', weightSlab: '5kg+', rate: 100, perKgRate: 33.33 }
      ],
      fuelSurcharge: 0,
      gstPercent: 0,
    };

    // 6.5kg = 1.5 excess kg over the 5kg minimum for that slab.
    // Freight: 100 + (1.5 * 33.33) = 100 + 49.995 = 149.995 -> 150.00
    const price = contractService.calculatePriceFromContract(contract, 6.5, { mode: 'surface', zone: 'local' });
    expect(price.base).toBe(150);
  });

  it('handles large calculations without drift', () => {
    const contract = {
      id: 6,
      name: 'Large',
      pricingType: 'SIMPLE',
      pricingRules: {
        type: 'simple',
        rules: [
          { zone: 'local', rate: 123456.78 }
        ]
      },
      fuelSurcharge: 12.34, 
      gstPercent: 18,
    };

    const price = contractService.calculatePriceFromContract(contract, 1, { zone: 'local' });
    expect(price.base).toBe(123456.78);
    // 12.34% of 123456.78 = 15234.566652 -> 15234.57
    expect(price.fuelSurcharge).toBe(15234.57);
    // 123456.78 + 15234.57 = 138691.35
    expect(price.subtotal).toBe(138691.35);
    // 18% of 138691.35 = 24964.443 -> 24964.44
    expect(price.gst).toBe(24964.44);
    // Total = 138691.35 + 24964.44 = 163655.79
    expect(price.total).toBe(163655.79);
  });
});
