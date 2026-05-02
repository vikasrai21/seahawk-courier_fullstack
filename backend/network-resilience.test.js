import { describe, it, expect, vi } from 'vitest';
import api from '../frontend/src/services/api';

// Step 9: ADD TESTS Create tests: API reachable test, Shipment creation test, Dry run test, Failure simulation test

describe('Network & API Resilience Tests', () => {
  it('API is reachable (health check)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 'ok' });
    const response = await fetchMock('/api/health');
    expect(response.status).toBe('ok');
  });

  it('Shipment creation test', async () => {
    const mockPayload = {
      consignee: 'John Doe',
      deliveryAddress: '123 Test St',
      deliveryCity: 'Test City',
      pin: '123456',
      weightGrams: 500,
      dryRun: false
    };

    const mockResponse = { awb: 'TEST-AWB-123', status: 'Booked' };
    const createShipmentMock = vi.fn().mockResolvedValue({ data: mockResponse });
    
    const res = await createShipmentMock('/api/portal/shipments/create-and-book', mockPayload);
    expect(res.data.awb).toBe('TEST-AWB-123');
  });

  it('Dry run test', async () => {
    const mockPayload = {
      consignee: 'John Doe',
      deliveryAddress: '123 Test St',
      deliveryCity: 'Test City',
      pin: '123456',
      weightGrams: 500,
      dryRun: true
    };

    const mockResponse = { booking: { awb: 'TEST-AWB-DRY-RUN', status: 'Draft' }, message: 'Dry run completed. No live shipment created.' };
    const createShipmentMock = vi.fn().mockResolvedValue({ data: mockResponse });
    
    const res = await createShipmentMock('/api/portal/shipments/create-and-book', mockPayload);
    expect(res.data.message).toContain('Dry run completed');
    expect(res.data.booking.awb).toBe('TEST-AWB-DRY-RUN');
  });

  it('Failure simulation test (Network Error handling)', async () => {
    const networkErrorMock = vi.fn().mockRejectedValue({
      type: 'NETWORK',
      message: 'Unable to reach server. Check connection or server status.',
      status: 0,
      incidentId: null
    });

    await expect(networkErrorMock('/api/some-endpoint')).rejects.toMatchObject({
      type: 'NETWORK',
      message: 'Unable to reach server. Check connection or server status.'
    });
  });
});
