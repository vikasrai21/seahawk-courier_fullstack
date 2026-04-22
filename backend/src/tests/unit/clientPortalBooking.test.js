import { createRequire } from 'module';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);

const prismaMock = {
  client: { findUnique: vi.fn() },
};

const cacheMock = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
};

const shipmentSvcMock = {
  create: vi.fn(),
};

const carrierSvcMock = {
  getConfiguredCarriers: vi.fn(),
  createShipment: vi.fn(),
};

const courierDecisionSvcMock = {
  recommendCourierForBooking: vi.fn(),
  normalizeCarrier: vi.fn(),
};

vi.mock('../../config/prisma', () => ({
  __esModule: true,
  default: prismaMock,
  ...prismaMock,
}));

vi.mock('../../utils/cache', () => ({
  __esModule: true,
  default: cacheMock,
  ...cacheMock,
}));

vi.mock('../../services/notification.service', () => ({ __esModule: true, default: {}, }));
vi.mock('../../services/contract.service', () => ({ __esModule: true, default: {}, }));
vi.mock('../../services/shipment.service', () => ({
  __esModule: true,
  default: shipmentSvcMock,
  ...shipmentSvcMock,
}));
vi.mock('../../services/carrier.service', () => ({
  __esModule: true,
  default: carrierSvcMock,
  ...carrierSvcMock,
}));
vi.mock('../../services/courierDecision.service', () => ({
  __esModule: true,
  default: courierDecisionSvcMock,
  ...courierDecisionSvcMock,
}));

const { createAndBookShipment } = require('../../controllers/client-portal/portal.misc.js');

function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe('client portal booking controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.client.findUnique.mockResolvedValue({ brandSettings: {} });
    cacheMock.get.mockResolvedValue(null);
    cacheMock.set.mockResolvedValue(undefined);
    cacheMock.del.mockResolvedValue(undefined);
    shipmentSvcMock.create.mockResolvedValue({ id: 77, awb: 'AWB1234567890' });
    courierDecisionSvcMock.recommendCourierForBooking.mockReturnValue({
      recommendedCourier: 'Trackon',
      fallbackCourier: 'Delhivery',
      rankedCouriers: [],
      decisionMeta: {},
    });
    courierDecisionSvcMock.normalizeCarrier.mockImplementation((value) => {
      const map = { trackon: 'Trackon', delhivery: 'Delhivery', dtdc: 'DTDC' };
      return map[String(value || '').trim().toLowerCase()] || null;
    });
  });

  it('returns a clear 503 when the client explicitly selects an inactive courier', async () => {
    carrierSvcMock.getConfiguredCarriers.mockReturnValue(['Trackon']);

    const req = {
      body: {
        courier: 'DTDC',
        consignee: 'Receiver',
        deliveryAddress: '12 Test Street',
        deliveryCity: 'Delhi',
        pincode: '110001',
        weight: 1,
      },
      headers: {},
      ip: '127.0.0.1',
      user: { id: 1, email: 'client@test.com', role: 'CLIENT', clientCode: 'CL001' },
    };

    const res = createRes();

    await expect(createAndBookShipment(req, res)).rejects.toMatchObject({
      status: 503,
      message: expect.stringContaining('DTDC booking is not active right now'),
    });
  });

});
