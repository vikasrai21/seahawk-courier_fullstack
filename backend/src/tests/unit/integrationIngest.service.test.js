import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'module';
import { mockPrisma } from '../setup.js';

vi.mock('../../config/prisma', () => require('../../config/__mocks__/prisma.js'));
vi.mock('../../config', () => ({
  webhooks: { idempotencyTtlSeconds: 600 },
}));

const requireModule = createRequire(import.meta.url);
const cache = requireModule('../../utils/cache.js');
const draftOrderService = requireModule('../../services/draftOrder.service.js');
const ingestService = await import('../../services/integration-ingest.service.js');

describe('integration-ingest.service', () => {
  const baseClient = {
    code: 'SEA',
    brandSettings: {
      integrations: {
        custom: {
          enabled: true,
          defaultWeightKg: 0.5,
          mappings: {
            referenceId: 'order.id',
            consignee: 'customer.name',
            destination: 'shipping.city',
            phone: 'shipping.phone',
            pincode: 'shipping.pincode',
            weight: 'shipping.weight',
          },
          staticValues: {},
          connector: {
            enabled: false,
          },
        },
      },
    },
  };

  const orderBody = {
    order: { id: 'ORD-1001' },
    customer: { name: 'Jane Doe' },
    shipping: {
      city: 'Pune',
      phone: '9999999999',
      pincode: '411001',
      weight: '1.4',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(cache, 'get').mockResolvedValue(null);
    vi.spyOn(cache, 'set').mockResolvedValue(undefined);
    vi.spyOn(draftOrderService, 'create').mockResolvedValue({ id: 321, referenceId: 'ORD-1001' });
  });

  it('normalizes scopes and supports wildcard checks', () => {
    expect(ingestService.normalizeScopes([' Orders:Create ', 'events:read', 'events:read']))
      .toEqual(['orders:create', 'events:read']);
    expect(ingestService.normalizeScopes('')).toEqual(['orders:create']);
    expect(ingestService.hasScope({ scopes: ['*'] }, 'orders:create')).toBe(true);
    expect(ingestService.hasScope({ scopes: ['events:read'] }, 'orders:create')).toBe(false);
  });

  it('creates a draft on live ingest and writes idempotency/audit artifacts', async () => {
    mockPrisma.draftOrder.findFirst.mockResolvedValue(null);
    mockPrisma.clientApiKey.update.mockResolvedValue({ id: 11 });
    mockPrisma.auditLog.create.mockResolvedValue({ id: 1 });

    const result = await ingestService.ingestOrder({
      provider: 'custom',
      clientCode: 'SEA',
      body: orderBody,
      client: baseClient,
      apiKey: { id: 11, name: 'Live Key' },
      explicitIdempotencyKey: null,
      ip: '127.0.0.1',
      requestId: 'req-1',
    });

    expect(result.duplicate).toBe(false);
    expect(result.draftId).toBe(321);
    expect(draftOrderService.create).toHaveBeenCalledWith(expect.objectContaining({
      clientCode: 'SEA',
      referenceId: 'ORD-1001',
      consignee: 'Jane Doe',
      destination: 'Pune',
      phone: '9999999999',
      pincode: '411001',
      weight: 1.4,
    }));
    expect(cache.set).toHaveBeenCalledWith(expect.stringMatching(/^integration:idemp:/), expect.objectContaining({ draftId: 321 }), expect.any(Number));
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: 'INTEGRATION_DRAFT_CREATED',
        entity: 'INTEGRATION_WEBHOOK',
      }),
    }));
  });

  it('returns idempotency replay without creating a draft when cache already has key', async () => {
    cache.get.mockResolvedValue({ draftId: 555 });

    const result = await ingestService.ingestOrder({
      provider: 'custom',
      clientCode: 'SEA',
      body: orderBody,
      client: baseClient,
      apiKey: { id: 11, name: 'Live Key' },
      explicitIdempotencyKey: 'idemp-1',
      ip: '127.0.0.1',
      requestId: 'req-2',
    });

    expect(result).toEqual(expect.objectContaining({
      duplicate: true,
      idempotencyReplay: true,
      draftId: 555,
    }));
    expect(draftOrderService.create).not.toHaveBeenCalled();
  });

  it('returns duplicate when existing draft exists and logs duplicate audit', async () => {
    cache.get.mockResolvedValue(null);
    mockPrisma.draftOrder.findFirst.mockResolvedValue({ id: 88, status: 'PENDING' });
    mockPrisma.auditLog.create.mockResolvedValue({ id: 2 });

    const result = await ingestService.ingestOrder({
      provider: 'custom',
      clientCode: 'SEA',
      body: orderBody,
      client: baseClient,
      apiKey: { id: 11, name: 'Live Key' },
      explicitIdempotencyKey: null,
      ip: '127.0.0.1',
      requestId: 'req-3',
    });

    expect(result).toEqual(expect.objectContaining({
      duplicate: true,
      idempotencyReplay: false,
      draftId: 88,
    }));
    expect(cache.set).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ draftId: 88 }), expect.any(Number));
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: 'INTEGRATION_DRAFT_DUPLICATE',
      }),
    }));
    expect(draftOrderService.create).not.toHaveBeenCalled();
  });

  it('throws provider-disabled error when provider integration is not enabled', async () => {
    await expect(ingestService.ingestOrder({
      provider: 'custom',
      clientCode: 'SEA',
      body: orderBody,
      client: { code: 'SEA', brandSettings: { integrations: { custom: { enabled: false } } } },
      apiKey: { id: 11, name: 'Live Key' },
      explicitIdempotencyKey: null,
      ip: '127.0.0.1',
      requestId: 'req-4',
    })).rejects.toMatchObject({
      code: 'PROVIDER_DISABLED',
      status: 403,
    });
  });

  it('queues dead-letter jobs with failed status metadata', async () => {
    mockPrisma.jobQueue.create.mockResolvedValue({ id: 9 });

    const result = await ingestService.queueDeadLetter({
      provider: 'custom',
      clientCode: 'SEA',
      body: { hello: 'world' },
      reason: 'mapping-failed',
      requestId: 'req-5',
      ip: '10.0.0.1',
    });

    expect(result).toEqual({ id: 9 });
    expect(mockPrisma.jobQueue.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        type: 'INTEGRATION_DEAD_LETTER',
        status: 'FAILED',
      }),
    }));
  });

  it('pulls connector orders and ingests each order', async () => {
    cache.get.mockResolvedValue(null);
    mockPrisma.draftOrder.findFirst.mockResolvedValue(null);
    draftOrderService.create
      .mockResolvedValueOnce({ id: 1001, referenceId: 'ORD-A' })
      .mockResolvedValueOnce({ id: 1002, referenceId: 'ORD-B' });
    mockPrisma.clientApiKey.update.mockResolvedValue({ id: 11 });
    mockPrisma.auditLog.create.mockResolvedValue({ id: 77 });
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        orders: [
          { order: { id: 'ORD-A' }, customer: { name: 'A User' }, shipping: { city: 'Delhi', phone: '9000000001', pincode: '110001', weight: '1.1' } },
          { order: { id: 'ORD-B' }, customer: { name: 'B User' }, shipping: { city: 'Jaipur', phone: '9000000002', pincode: '302001', weight: '1.3' } },
        ],
      }),
      text: async () => '',
    });

    const connectorClient = {
      code: 'SEA',
      brandSettings: {
        integrations: {
          custom: {
            enabled: true,
            mappings: baseClient.brandSettings.integrations.custom.mappings,
            connector: {
              enabled: true,
              baseUrl: 'https://connector.example.com',
              orderPullPath: '/orders',
              orderAckPath: '',
              authType: 'none',
              timeoutMs: 5000,
              retryAttempts: 2,
              retryBaseDelayMs: 200,
            },
          },
        },
      },
    };

    const result = await ingestService.pullOrdersFromConnector({
      client: connectorClient,
      provider: 'custom',
      apiKey: { id: 11, name: 'Live Key' },
      requestId: 'req-6',
      ip: '127.0.0.1',
    });

    expect(result).toEqual(expect.objectContaining({
      provider: 'custom',
      pulled: 2,
      created: 2,
      duplicate: 0,
      failed: 0,
    }));
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(draftOrderService.create).toHaveBeenCalledTimes(2);
  });
});
