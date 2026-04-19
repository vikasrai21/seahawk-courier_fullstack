import { describe, it, expect } from 'vitest';
import { recommendCourierForBooking, normalizeCarrier } from '../../services/courierDecision.service.js';

describe('courierDecision.service', () => {
  it('normalizes carrier names', () => {
    expect(normalizeCarrier('trackon')).toBe('Trackon');
    expect(normalizeCarrier('Primetrack')).toBe('Trackon');
    expect(normalizeCarrier('primtrack')).toBe('Trackon');
    expect(normalizeCarrier('DTDC')).toBe('DTDC');
    expect(normalizeCarrier('Delhivery')).toBe('Delhivery');
    expect(normalizeCarrier('')).toBe(null);
  });

  it('recommends from client priority for standard shipments', () => {
    const result = recommendCourierForBooking({
      pincode: '122001',
      service: 'Standard',
      weightGrams: 900,
      clientSettings: {
        bookingPreferences: {
          carrierPriority: ['Trackon', 'DTDC', 'Delhivery'],
        },
      },
    });
    expect(result.recommendedCourier).toBe('Trackon');
    expect(result.fallbackCourier).toBe('DTDC');
  });

  it('prefers Delhivery for express + cod path', () => {
    const result = recommendCourierForBooking({
      pincode: '400001',
      service: 'Express',
      weightGrams: 1500,
      cod: true,
      clientSettings: {
        bookingPreferences: {
          carrierPriority: ['Trackon', 'DTDC', 'Delhivery'],
        },
      },
    });
    expect(result.recommendedCourier).toBe('Delhivery');
    expect(result.fallbackCourier).toBe('DTDC');
  });

  it('honors manual preferred courier when present', () => {
    const result = recommendCourierForBooking({
      pincode: '560001',
      service: 'Standard',
      weightGrams: 700,
      preferredCourier: 'DTDC',
    });
    expect(result.recommendedCourier).toBe('DTDC');
  });
});

