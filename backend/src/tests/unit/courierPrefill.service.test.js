import { afterEach, describe, expect, it, vi } from 'vitest';
import { mergeApiPrefill, prefillFromApi } from '../../services/courierPrefill.service.js';

describe('courierPrefill.service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.DELHIVERY_API_KEY;
    delete process.env.TRACKON_APP_KEY;
    delete process.env.TRACKON_USER_ID;
    delete process.env.TRACKON_PASSWORD;
  });

  it('prefers structured shipment details over tracking fallback', async () => {
    process.env.DELHIVERY_API_KEY = 'test-key';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        ShipmentData: [{
          Shipment: {
            Consignee: {
              name: 'Dipesh',
              phone: '9501024132',
              city: 'Mysore',
              pincode: '571302',
            },
            Weight: 1.25,
            Status: 'In Transit',
            Scans: [],
          },
        }],
      }),
    });

    const result = await prefillFromApi('1234567890123', 'Delhivery');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      source: 'courier_api',
      courier: 'Delhivery',
      lookupType: 'shipment_details',
      consignee: 'Dipesh',
      destination: 'MYSORE',
      pincode: '571302',
      weight: 1.25,
      phone: '9501024132',
    });
  });

  it('falls back to tracking data when shipment details are unavailable', async () => {
    process.env.TRACKON_APP_KEY = 'test-app';
    process.env.TRACKON_USER_ID = 'test-user';
    process.env.TRACKON_PASSWORD = 'test-pass';
    const fetchSpy = vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          summaryTrack: {
            CURRENT_STATUS: 'In Transit',
          },
          lstDetails: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          summaryTrack: {
            CURRENT_STATUS: 'In Transit',
            DESTINATION: 'Ludhiana',
          },
          lstDetails: [
            { CURRENT_CITY: 'Bathinda', CURRENT_STATUS: 'Arrived', TRACKING_CODE: 'ARV', EVENTDATE: '19/04/2026', EVENTTIME: '10:30:00' },
            { CURRENT_CITY: 'Delhi', CURRENT_STATUS: 'Dispatched', TRACKING_CODE: 'DSP', EVENTDATE: '18/04/2026', EVENTTIME: '09:00:00' },
          ],
        }),
      });

    const result = await prefillFromApi('500602752638', 'Trackon');

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      source: 'courier_api',
      courier: 'Trackon',
      lookupType: 'tracking',
      destination: 'LUDHIANA',
      trackingStatus: 'In Transit',
    });
  });

  it('treats Primetrack hints as Trackon API lookups', async () => {
    process.env.TRACKON_APP_KEY = 'test-app';
    process.env.TRACKON_USER_ID = 'test-user';
    process.env.TRACKON_PASSWORD = 'test-pass';
    const fetchSpy = vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          summaryTrack: {
            CURRENT_STATUS: 'In Transit',
          },
          lstDetails: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          summaryTrack: {
            CURRENT_STATUS: 'In Transit',
            DESTINATION: 'Chandigarh',
          },
          lstDetails: [
            { CURRENT_CITY: 'Chandigarh', CURRENT_STATUS: 'Arrived', TRACKING_CODE: 'ARV', EVENTDATE: '19/04/2026', EVENTTIME: '10:30:00' },
          ],
        }),
      });

    const result = await prefillFromApi('200042724212', 'Primetrack');

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      source: 'courier_api',
      courier: 'Trackon',
      lookupType: 'tracking',
      destination: 'CHANDIGARH',
      trackingStatus: 'In Transit',
    });
  });

  it('does not treat current tracking location as destination city', async () => {
    process.env.TRACKON_APP_KEY = 'test-app';
    process.env.TRACKON_USER_ID = 'test-user';
    process.env.TRACKON_PASSWORD = 'test-pass';
    const fetchSpy = vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          summaryTrack: {
            CURRENT_STATUS: 'In Transit',
          },
          lstDetails: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          summaryTrack: {
            CURRENT_STATUS: 'In Transit',
          },
          lstDetails: [
            { CURRENT_CITY: 'Bathinda', CURRENT_STATUS: 'Arrived', TRACKING_CODE: 'ARV', EVENTDATE: '19/04/2026', EVENTTIME: '10:30:00' },
          ],
        }),
      });

    const result = await prefillFromApi('500602752638', 'Trackon');

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result).toBeNull();
  });

  it('records shipment-details lookup metadata when merging API prefill', () => {
    const merged = mergeApiPrefill(
      {
        consignee: '',
        destination: '',
        pincode: '',
        _intelligence: {},
      },
      {
        source: 'courier_api',
        courier: 'DTDC',
        lookupType: 'shipment_details',
        consignee: 'Ravi Kumar',
        destination: 'Ludhiana',
        pincode: '141001',
        phone: '9999999999',
      }
    );

    expect(merged.consignee).toBe('Ravi Kumar');
    expect(merged.destination).toBe('Ludhiana');
    expect(merged.pincode).toBe('141001');
    expect(merged.phone).toBe('9999999999');
    expect(merged._intelligence.apiPrefill.lookupType).toBe('shipment_details');
    expect(merged.consigneeSource).toBe('courier_api');
  });
});
