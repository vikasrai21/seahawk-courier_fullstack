// C:\Users\hp\OneDrive\Desktop\seahawk-full_stack\backend\src\tests\unit\carrierService.test.js
'use strict';

const mockHttp = {
  fetchJsonWithRetry: vi.fn(),
  fetchWithRetry: vi.fn(),
};

// Manual cache injection: The most reliable way for CJS on Windows
const httpPath = require.resolve('../../utils/httpRetry');
require.cache[httpPath] = {
  id: httpPath,
  filename: httpPath,
  loaded: true,
  exports: mockHttp,
};

const mockPrisma = require('../../config/__mocks__/prisma');

// Now require the service - it will get the mock from the cache
const carrierService = require('../../services/carrier.service');

describe('carrier.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set ALL required environment variables for the configs to be "enabled"
    process.env.DELHIVERY_API_KEY = 'test-key';
    process.env.DELHIVERY_WAREHOUSE = 'Primary';
    
    process.env.DTDC_API_KEY = 'test-key';
    process.env.DTDC_CUSTOMER_CODE = 'TEST_CUST'; // CRITICAL
    process.env.TRACKON_APP_KEY = 'trackon-app-key';
    process.env.TRACKON_USER_ID = 'trackon-user';
    process.env.TRACKON_PASSWORD = 'trackon-pass';
    
    process.env.BLUEDART_LICENSE_KEY = 'test-key';
    process.env.BLUEDART_LOGIN_ID = 'test-login';
  });

  const mockData = {
    consignee: 'John Doe',
    deliveryAddress: '123 St',
    deliveryCity: 'GGM',
    deliveryState: 'Haryana',
    pin: '122015',
    weightGrams: 500,
    declaredValue: 1000,
    awb: 'AWB123'
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

    it('creates a shipment via Trackon', async () => {
      mockHttp.fetchWithRetry.mockResolvedValueOnce({
        text: vi.fn().mockResolvedValue(JSON.stringify({ docketNo: '500055555555' }))
      });

      const result = await carrierService.createShipment('Trackon', mockData);
      expect(result.awb).toBe('500055555555');
      expect(result.carrier).toBe('Trackon');
    });
  });

  describe('fetchTracking', () => {
    it('fetches tracking info and returns mapped status', async () => {
      mockHttp.fetchJsonWithRetry.mockResolvedValueOnce({
        ShipmentData: [{
          Shipment: { 
            Status: { Status: 'Delivered', Instructions: 'Delivered to recipient' }, 
            Scans: [] 
          }
        }]
      });

      const result = await carrierService.fetchTracking('Delhivery', 'AWB123', { bypassCache: true });
      expect(result.status).toBe('Delivered');
    });

    it('fetches tracking info for Trackon and maps status', async () => {
      mockHttp.fetchJsonWithRetry.mockResolvedValueOnce({
        summaryTrack: {
          CURRENT_STATUS: 'OUT FOR DELIVERY',
          TRACKING_CODE: 'DRSG',
          CURRENT_CITY: 'Gurugram',
        },
        lstDetails: [
          {
            CURRENT_STATUS: 'OUT FOR DELIVERY',
            CURRENT_CITY: 'Gurugram',
            EVENTDATE: '07/04/2026',
            EVENTTIME: '10:00:00',
            TRACKING_CODE: 'DRSG',
          },
        ],
      });

      const result = await carrierService.fetchTracking('Trackon', 'TRK111', { bypassCache: true });
      expect(result.status).toBe('OutForDelivery');
      expect(result.events.length).toBe(1);
      expect(result.events[0].rawData?.eventCode).toBe('DRSG');
      expect(result.events[0].rawData?.hubOrBranch).toBe('Gurugram');
    });

    it('fetches tracking info for DTDC and maps status from the v4 API shape', async () => {
      mockHttp.fetchJsonWithRetry.mockResolvedValueOnce({
        statusFlag: true,
        status: 'SUCCESS',
        trackHeader: {
          strStatus: 'Delivered',
          strOrigin: 'Delhi',
          strDestination: 'Noida',
          strRemarks: 'Received by John',
        },
        trackDetails: [
          {
            strAction: 'Delivered',
            strOrigin: 'Noida Branch',
            strActionDate: '29052025',
            strActionTime: '1143',
            sTrRemarks: 'Delivered',
          },
        ],
      });

      const result = await carrierService.fetchTracking('DTDC', 'D123456789', { bypassCache: true });
      expect(result.status).toBe('Delivered');
      expect(result.destination).toBe('Noida');
      expect(result.events.length).toBe(1);
      expect(result.events[0].rawData?.proofOfDelivery).toBe(true);
      expect(result.events[0].rawData?.eventType).toBe('DELIVERY');
    });
  });

  describe('syncTrackingEvents', () => {
    it('integrates tracking events and updates shipment status', async () => {
      // Mock tracking reply from Delhivery
      mockHttp.fetchJsonWithRetry.mockResolvedValueOnce({
        ShipmentData: [{
          Shipment: {
            Status: { Status: 'Delivered' },
            Scans: [{
              ScanDetail: { 
                Scan: 'Delivered', 
                ScanDateTime: new Date().toISOString(),
                ScannedLocation: 'GGM',
                Instructions: 'OK'
              }
            }]
          }
        }]
      });

      // Mock prisma interactions
      mockPrisma.trackingEvent.findMany.mockResolvedValueOnce([]); // No existing events
      mockPrisma.trackingEvent.createMany.mockResolvedValueOnce({ count: 1 });
      mockPrisma.shipment.update.mockResolvedValueOnce({ id: 1 });

      const count = await carrierService.syncTrackingEvents(1, 'AWB123', 'Delhivery');
      expect(count).toBe(1);
    });
  });

  describe('cancelShipment', () => {
    it('sends cancellation to Delhivery', async () => {
      mockHttp.fetchJsonWithRetry.mockResolvedValueOnce({ success: true, waybill: 'AWB123' });
      const res = await carrierService.cancelShipment('Delhivery', 'AWB123');
      expect(res.success).toBe(true);
    });
  });
});
