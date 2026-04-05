import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  contract: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
};

async function loadService() {
  vi.resetModules();
  vi.doMock('../../config/prisma', () => ({
    __esModule: true,
    default: prismaMock,
    ...prismaMock,
  }));
  return import('../../services/contract.service');
}

describe('contract.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('selectBestContract prefers exact courier and service match', async () => {
    const contractService = await loadService();
    const contracts = [
      { id: 1, courier: '', service: '', name: 'fallback' },
      { id: 2, courier: 'DTDC', service: '', name: 'courier-only' },
      { id: 3, courier: '', service: 'EXPRESS', name: 'service-only' },
      { id: 4, courier: 'DTDC', service: 'EXPRESS', name: 'exact-match' },
    ];

    const match = contractService.selectBestContract(contracts, { courier: 'dtdc', service: 'express' });

    expect(match?.id).toBe(4);
  });

  it('calculatePriceFromContract applies min charge, fuel surcharge, and GST', async () => {
    const contractService = await loadService();
    const price = contractService.calculatePriceFromContract({
      id: 9,
      name: 'Per KG',
      pricingType: 'PER_KG',
      baseRate: 20,
      minCharge: 100,
      fuelSurcharge: 10,
      gstPercent: 18,
    }, 2);

    expect(price).toMatchObject({
      contractId: 9,
      base: 100,
      fuelSurcharge: 10,
      subtotal: 110,
      gst: 19.8,
      total: 129.8,
    });
  });

  it('getActiveContractsByClientCodes normalizes client codes and groups results', async () => {
    const contractService = await loadService();
    prismaMock.contract.findMany.mockResolvedValue([
      { id: 1, clientCode: 'SEA' },
      { id: 2, clientCode: 'ABC' },
      { id: 3, clientCode: 'SEA' },
    ]);

    const grouped = await contractService.getActiveContractsByClientCodes([' sea ', 'ABC', 'SEA', ''], prismaMock);

    expect(prismaMock.contract.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        clientCode: { in: ['SEA', 'ABC'] },
        active: true,
      }),
    }));
    expect(grouped).toEqual({
      SEA: [{ id: 1, clientCode: 'SEA' }, { id: 3, clientCode: 'SEA' }],
      ABC: [{ id: 2, clientCode: 'ABC' }],
    });
  });

  it('calculatePrice returns null when no matching active contract exists', async () => {
    const contractService = await loadService();
    prismaMock.contract.findMany.mockResolvedValue([]);

    const result = await contractService.calculatePrice({
      clientCode: 'SEA',
      courier: 'DTDC',
      service: 'EXPRESS',
      weight: 2,
    }, prismaMock);

    expect(result).toBeNull();
  });
});
