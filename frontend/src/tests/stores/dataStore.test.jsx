import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiGet = vi.fn();

vi.mock('../../services/api', () => ({
  default: {
    get: apiGet,
  },
}));

describe('useDataStore shipment query cache', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { useDataStore } = await import('../../stores/dataStore');
    useDataStore.setState({
      clients: [],
      clientsLoadedAt: null,
      shipments: [],
      shipmentMeta: null,
      shipmentsLoadedAt: null,
      shipmentQueryCache: {},
    });
  });

  it('reuses cache only for the same shipment query key', async () => {
    const firstPayload = {
      data: {
        shipments: [{ id: 1, awb: 'AWB-1' }],
        pagination: { total: 1, page: 1, limit: 25 },
        stats: { delivered: 0 },
      },
    };
    const secondPayload = {
      data: {
        shipments: [{ id: 2, awb: 'AWB-2' }],
        pagination: { total: 1, page: 1, limit: 25 },
        stats: { delivered: 1 },
      },
    };

    apiGet
      .mockResolvedValueOnce(firstPayload)
      .mockResolvedValueOnce(secondPayload);

    const { useDataStore } = await import('../../stores/dataStore');

    const first = await useDataStore.getState().fetchShipments({ page: 1, limit: 25 }, false);
    const repeat = await useDataStore.getState().fetchShipments({ limit: 25, page: 1 }, false);
    const filtered = await useDataStore.getState().fetchShipments({ page: 1, limit: 25, status: 'Delivered' }, false);

    expect(first.shipments[0].awb).toBe('AWB-1');
    expect(repeat.shipments[0].awb).toBe('AWB-1');
    expect(filtered.shipments[0].awb).toBe('AWB-2');
    expect(apiGet).toHaveBeenCalledTimes(2);
  });
});
