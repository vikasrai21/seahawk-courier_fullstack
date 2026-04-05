// C:\Users\hp\OneDrive\Desktop\seahawk-full_stack\backend\src\tests\unit\carrierService.test.js
'use strict';

const mockHttp = {
  fetchJsonWithRetry: vi.fn(),
  fetchWithRetry: vi.fn(),
};

// Use hardcoded path with forward slashes for Windows/Vitest reliability
vi.mock('C:/Users/hp/OneDrive/Desktop/seahawk-full_stack/backend/src/utils/httpRetry', () => mockHttp);

const carrierService = require('../../services/carrier.service');
const mockPrisma = require('../../config/__mocks__/prisma');

describe('carrier.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DELHIVERY_API_KEY = 'test-key';
    process.env.DTDC_API_KEY = 'test-key';
    process.env.BLUEDART_LICENSE_KEY = 'test-key';
  });

  const mockData = {
    consignee: 'John Doe',
    deliveryAddress: '123 St',
    deliveryCity: 'GGM',
    deliveryState: 'Haryana',
    pin: '122015',
    weightGrams: 500,
    declaredValue: 1000
  };

  describe('createShipment', () => {
    it('creates a shipment via Delhivery', async () => {
      mockHttp.fetchJsonWithRetry.mockResolvedValueOnce({
        packages: [{ waybill: 'DEL123', remarks: '' }]
      });

      const result = await carrierService.createShipment('Delhivery', mockData);
      expect(result.awb).toBe('DEL123');
    });

    it('creates a shipment via DTDC', async () => {
      mockHttp.fetchJsonWithRetry.mockResolvedValueOnce({
        AWB_NO: 'DTDC456'
      });

      const result = await carrierService.createShipment('DTDC', mockData);
      expect(result.awb).toBe('DTDC456');
    });

    it('creates a shipment via BlueDart', async () => {
      mockHttp.fetchJsonWithRetry.mockResolvedValueOnce({
        ShipmentCreationResult: { AWBNo: 'BD789' }
      });

      const result = await carrierService.createShipment('BlueDart', mockData);
      expect(result.awb).toBe('BD789');
    });
  });

  describe('fetchTracking', () => {
    it('fetches tracking info and returns mapped status', async () => {
      mockHttp.fetchJsonWithRetry.mockResolvedValueOnce({
        ShipmentData: [{
          Shipment: { Status: { Status: 'Delivered' }, Scans: [] }
        }]
      });

      const result = await carrierService.fetchTracking('Delhivery', 'AWB123');
      expect(result.status).toBe('Delivered');
    });
  });

  describe('syncTrackingEvents', () => {
    it('integrates tracking events and updates shipment status', async () => {
      mockHttp.fetchJsonWithRetry.mockResolvedValueOnce({
        ShipmentData: [{
          Shipment: {
            Status: { Status: 'Delivered' },
            Scans: [{
              ScanDetail: { Scan: 'Delivered', ScanDateTime: new Date().toISOString() }
            }]
          }
        }]
      });

      mockPrisma.trackingEvent.findMany.mockResolvedValueOnce([]);
      mockPrisma.trackingEvent.createMany.mockResolvedValueOnce({ count: 1 });
      mockPrisma.shipment.update.mockResolvedValueOnce({ id: 1 });

      const count = await carrierService.syncTrackingEvents(1, 'AWB123', 'Delhivery');
      expect(count).toBe(1);
    });
  });

  describe('cancelShipment', () => {
    it('sends cancellation to Delhivery', async () => {
      mockHttp.fetchJsonWithRetry.mockResolvedValueOnce({ success: true });
      const res = await carrierService.cancelShipment('Delhivery', 'AWB123');
      expect(res.success).toBe(true);
    });
  });
});
