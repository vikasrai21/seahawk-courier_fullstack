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

  it('calculatePriceFromContract supports simple zone and mode rules', async () => {
    const contractService = await loadService();
    const price = contractService.calculatePriceFromContract({
      id: 10,
      name: 'Simple',
      pricingType: 'SIMPLE',
      fuelSurcharge: 10,
      gstPercent: 18,
      pricingRules: {
        type: 'simple',
        rules: [
          { zone: 'local', rate: 38 },
          { zone: 'roi', mode: 'air', rate: 82 },
        ],
      },
    }, 1, { zone: 'roi', mode: 'air' });

    expect(price).toMatchObject({
      contractId: 10,
      pricingType: 'SIMPLE',
      zone: 'roi',
      mode: 'air',
      base: 82,
      fuelSurcharge: 8.2,
      gst: 16.24,
      total: 106.44,
    });
  });

  it('calculatePriceFromContract calculates prices across weight slab boundaries correctly', async () => {
    const contractService = await loadService();
    const contract = {
      id: 10,
      name: 'Slabs',
      pricingType: 'SLAB_BASED',
      pricingRules: [
        { weightSlab: '0-500g', rate: 40 },
        { weightSlab: '500g-1kg', rate: 70 },
        { weightSlab: '1-5kg', rate: 120 },
        { weightSlab: '5kg+', rate: 200 }
      ],
      fuelSurcharge: 0,
      gstPercent: 0,
    };

    // 0.5kg (exact boundary) -> 0-500g
    expect(contractService.calculatePriceFromContract(contract, 0.5).base).toBe(40);
    
    // 0.51kg (just over boundary) -> 500g-1kg
    expect(contractService.calculatePriceFromContract(contract, 0.51).base).toBe(70);

    // 1kg (exact boundary) -> 500g-1kg
    expect(contractService.calculatePriceFromContract(contract, 1).base).toBe(70);

    // 1.01kg (just over boundary) -> 1-5kg
    expect(contractService.calculatePriceFromContract(contract, 1.01).base).toBe(120);

    // 5kg (exact boundary) -> 1-5kg
    expect(contractService.calculatePriceFromContract(contract, 5).base).toBe(120);

    // 5.01kg (just over boundary) -> 5kg+
    expect(contractService.calculatePriceFromContract(contract, 5.01).base).toBe(200);
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

  it('normalizeWeightKg treats 51kg as 51kg (regression test for >50 heuristic)', async () => {
    const contractService = await loadService();
    expect(contractService.normalizeWeightKg(51)).toBe(51);
    expect(contractService.normalizeWeightKg(0.051)).toBe(0.051);
    expect(contractService.normalizeWeightKg(50000)).toBe(50); // 50000g -> 50kg
  });
});
