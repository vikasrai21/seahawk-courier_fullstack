import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const prismaMock = {
  shipment: { findMany: vi.fn() },
  courierInvoice: { findMany: vi.fn(), findUnique: vi.fn() },
  auditLog: { create: vi.fn() },
};

const rateEngineMock = {
  stateToZones: vi.fn(() => ({ trackon: 'roi', delhivery: 'A', pt: 'roi' })),
  courierCost: vi.fn(() => ({ total: 100 })),
  COURIERS: [{ id: 'delhivery_std', label: 'Delhivery' }],
};

const prismaPath = require.resolve('../../config/prisma');
const rateEnginePath = require.resolve('../../utils/rateEngine');
require.cache[prismaPath] = {
  id: prismaPath,
  filename: prismaPath,
  loaded: true,
  exports: prismaMock,
};
require.cache[rateEnginePath] = {
  id: rateEnginePath,
  filename: rateEnginePath,
  loaded: true,
  exports: rateEngineMock,
};

const service = require('../../services/reconciliation.service');

describe('reconciliation intelligence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns weight dispute and leakage insights in invoice details', async () => {
    prismaMock.courierInvoice.findUnique.mockResolvedValue({
      id: 11,
      items: [
        {
          awb: 'X1',
          status: 'OVER',
          billedAmount: 180,
          calculatedAmount: 120,
          discrepancy: 60,
          weight: 2.0,
          notes: '',
        },
      ],
    });
    prismaMock.shipment.findMany.mockResolvedValue([
      { awb: 'X1', clientCode: 'ACME', amount: 130, weight: 1.5, courier: 'Delhivery' },
    ]);

    const result = await service.getCourierInvoiceDetails(11);

    expect(result.intelligence.overchargeAlertCount).toBe(1);
    expect(result.intelligence.leakageAlertCount).toBe(1);
    expect(result.intelligence.weightDisputeCount).toBe(1);
    expect(result.intelligence.clientMarginRisk[0].clientCode).toBe('ACME');
    expect(result.intelligence.totalLeakage).toBeGreaterThan(0);
  });

  it('exposes leakage and weight alert counts in reconciliation stats', async () => {
    prismaMock.courierInvoice.findMany.mockResolvedValue([
      {
        items: [
          { billedAmount: 200, calculatedAmount: 150, status: 'OVER', discrepancy: 50, notes: 'INTEL:MARGIN_LEAKAGE_ALERT' },
          { billedAmount: 150, calculatedAmount: 150, status: 'OK', discrepancy: 0, notes: 'INTEL:WEIGHT_DISPUTE_ALERT' },
        ],
      },
    ]);

    const stats = await service.getReconciliationStats();
    expect(stats.totalInvoices).toBe(1);
    expect(stats.leakageAlerts).toBe(1);
    expect(stats.weightDisputeAlerts).toBe(1);
    expect(stats.totalOvercharges).toBe(50);
  });
});

