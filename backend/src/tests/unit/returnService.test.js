import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequire } from 'module';
import { mockPrisma } from '../setup.js';

vi.mock('../../config/prisma', () => require('../../config/__mocks__/prisma.js'));
vi.mock('../../utils/logger', () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }));

const requireModule = createRequire(import.meta.url);
const carrierApi = requireModule('../../services/carrier.service.js');
const decisionApi = requireModule('../../services/courierDecision.service.js');
const returnService = await import('../../services/return.service.js');

describe('return.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('books reverse pickup using fallback carrier when primary fails', async () => {
    mockPrisma.returnRequest.findUnique.mockResolvedValue({
      id: 12,
      status: 'APPROVED',
      originalAwb: 'AWB123',
      reason: 'customer_return',
      clientCode: 'SEA',
      pickupDate: null,
      pickupAddress: 'Customer lane 1',
      pickupCity: 'Pune',
      pickupState: 'Maharashtra',
      pickupPincode: '411001',
      pickupPhone: '9999999999',
      shipment: { consignee: 'Ramesh', pincode: '411001', weight: 0.8, amount: 500, phone: '9999999999' },
      client: { code: 'SEA', company: 'Seahawk Client' },
    });

    vi.spyOn(carrierApi, 'getConfiguredCarriers').mockReturnValue(['Trackon', 'Delhivery']);
    vi.spyOn(decisionApi, 'recommendCourierForBooking').mockReturnValue({
      recommendedCourier: 'Trackon',
      fallbackCourier: 'Delhivery',
    });

    vi.spyOn(carrierApi, 'createShipment')
      .mockRejectedValueOnce(new Error('Trackon timeout'))
      .mockResolvedValueOnce({ awb: 'REV123', carrier: 'Delhivery', labelUrl: 'https://label.pdf' });

    mockPrisma.returnRequest.update.mockResolvedValue({
      id: 12,
      status: 'PICKUP_BOOKED',
      reverseAwb: 'REV123',
      reverseCourier: 'Delhivery',
      labelUrl: 'https://label.pdf',
      shipment: {},
      client: {},
    });

    const result = await returnService.bookReversePickup(12);

    expect(carrierApi.createShipment).toHaveBeenCalledTimes(2);
    expect(carrierApi.createShipment).toHaveBeenNthCalledWith(1, 'Trackon', expect.any(Object));
    expect(carrierApi.createShipment).toHaveBeenNthCalledWith(2, 'Delhivery', expect.any(Object));
    expect(mockPrisma.returnRequest.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 12 },
      data: expect.objectContaining({
        status: 'PICKUP_BOOKED',
        reverseAwb: 'REV123',
        reverseCourier: 'Delhivery',
      }),
    }));
    expect(result.reverseAwb).toBe('REV123');
  });

  it('syncs reverse tracking and moves status to IN_TRANSIT', async () => {
    mockPrisma.returnRequest.findUnique.mockResolvedValue({
      id: 15,
      status: 'PICKUP_BOOKED',
      reverseAwb: 'REV567',
      reverseCourier: 'Delhivery',
      pickupDate: null,
      shipment: {},
      client: {},
    });
    vi.spyOn(carrierApi, 'fetchTracking').mockResolvedValue({ status: 'InTransit', events: [] });
    mockPrisma.returnRequest.update.mockResolvedValue({
      id: 15,
      status: 'IN_TRANSIT',
      reverseAwb: 'REV567',
      reverseCourier: 'Delhivery',
      pickupDate: '2026-04-16',
      shipment: {},
      client: {},
    });

    const result = await returnService.syncReverseTracking(15);

    expect(carrierApi.fetchTracking).toHaveBeenCalledWith('Delhivery', 'REV567', { bypassCache: true });
    expect(mockPrisma.returnRequest.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 15 },
      data: expect.objectContaining({ status: 'IN_TRANSIT' }),
    }));
    expect(result.sync).toEqual(expect.objectContaining({ changed: true, to: 'IN_TRANSIT' }));
  });

  it('creates self-ship return requests with returnMethod', async () => {
    mockPrisma.shipment.findFirst.mockResolvedValue({
      id: 42,
      awb: 'AWB9001',
      status: 'Delivered',
      clientCode: 'SEA',
      destination: 'Pune',
      pincode: '411001',
      phone: '9999999999',
    });
    mockPrisma.returnRequest.findFirst.mockResolvedValue(null);
    mockPrisma.returnRequest.create.mockResolvedValue({
      id: 44,
      status: 'PENDING',
      returnMethod: 'SELF_SHIP',
      originalAwb: 'AWB9001',
      clientCode: 'SEA',
      shipment: {},
      client: {},
    });

    const result = await returnService.createReturnRequest({
      shipmentId: 42,
      clientCode: 'SEA',
      reason: 'customer_return',
      returnMethod: 'SELF_SHIP',
    });

    expect(mockPrisma.returnRequest.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        returnMethod: 'SELF_SHIP',
      }),
    }));
    expect(result.returnMethod).toBe('SELF_SHIP');
  });

  it('generates prepaid label for SELF_SHIP returns', async () => {
    mockPrisma.returnRequest.findUnique
      .mockResolvedValueOnce({ id: 23, returnMethod: 'SELF_SHIP' })
      .mockResolvedValueOnce({
        id: 23,
        status: 'APPROVED',
        returnMethod: 'SELF_SHIP',
        originalAwb: 'AWB-SHIP-23',
        reason: 'customer_return',
        clientCode: 'SEA',
        pickupDate: null,
        pickupAddress: 'Customer lane 1',
        pickupCity: 'Delhi',
        pickupState: 'Delhi',
        pickupPincode: '110001',
        pickupPhone: '9999999999',
        shipment: { consignee: 'Ramesh', pincode: '110001', weight: 0.6, amount: 450, phone: '9999999999' },
        client: { code: 'SEA', company: 'Seahawk Client' },
      });

    vi.spyOn(carrierApi, 'getConfiguredCarriers').mockReturnValue(['Delhivery']);
    vi.spyOn(decisionApi, 'recommendCourierForBooking').mockReturnValue({
      recommendedCourier: 'Delhivery',
      fallbackCourier: 'Trackon',
    });
    vi.spyOn(carrierApi, 'createShipment').mockResolvedValue({
      awb: 'REV-LABEL-23',
      carrier: 'Delhivery',
      labelUrl: 'https://labels.example.com/rev-23.pdf',
    });

    mockPrisma.returnRequest.update.mockResolvedValue({
      id: 23,
      status: 'LABEL_READY',
      returnMethod: 'SELF_SHIP',
      reverseAwb: 'REV-LABEL-23',
      reverseCourier: 'Delhivery',
      labelUrl: 'https://labels.example.com/rev-23.pdf',
      shipment: {},
      client: {},
    });

    const result = await returnService.generateSelfShipLabel(23);

    expect(mockPrisma.returnRequest.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'LABEL_READY',
      }),
    }));
    expect(result.status).toBe('LABEL_READY');
    expect(result.labelUrl).toBe('https://labels.example.com/rev-23.pdf');
  });

  it('keeps eligible-shipment filter aligned with active return statuses', async () => {
    mockPrisma.shipment.count.mockResolvedValue(0);
    mockPrisma.shipment.findMany.mockResolvedValue([]);

    await returnService.getEligibleShipments('SEA', { page: 1, limit: 20 });

    expect(mockPrisma.shipment.count).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        returnRequests: {
          none: {
            status: { notIn: ['REJECTED', 'RETURNED_TO_CLIENT'] },
          },
        },
      }),
    }));
  });

  it('blocks invalid manual status transition without force', async () => {
    mockPrisma.returnRequest.findUnique.mockResolvedValue({
      id: 51,
      status: 'PENDING',
      returnMethod: 'PICKUP',
    });

    await expect(returnService.updateReturnStatus(51, 'IN_TRANSIT')).rejects.toThrow('Invalid status transition: PENDING -> IN_TRANSIT');
    expect(mockPrisma.returnRequest.update).not.toHaveBeenCalled();
  });

  it('returns return timeline entries from audit logs', async () => {
    mockPrisma.returnRequest.findUnique.mockResolvedValue({
      id: 78,
      status: 'APPROVED',
      returnMethod: 'SELF_SHIP',
      shipment: {},
      client: {},
    });
    mockPrisma.auditLog.findMany.mockResolvedValue([
      {
        id: 'log_1',
        action: 'RETURN_REQUEST_CREATED',
        userEmail: 'ops@seahawk.com',
        createdAt: '2026-04-16T12:00:00.000Z',
      },
    ]);

    const result = await returnService.getReturnTimeline(78, { limit: 10 });

    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        entity: 'RETURN_REQUEST',
        entityId: '78',
      }),
      take: 10,
    }));
    expect(result.items).toHaveLength(1);
    expect(result.items[0].action).toBe('RETURN_REQUEST_CREATED');
  });
});
