import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  quote: {
    findFirst: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    groupBy: vi.fn(),
    aggregate: vi.fn(),
  },
};

async function loadService() {
  vi.resetModules();
  vi.doMock('../../config/prisma', () => ({
    __esModule: true,
    default: prismaMock,
    ...prismaMock,
  }));
  return import('../../services/quote.service');
}

describe('quote.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createQuote generates the next quote number and valid-until date', async () => {
    const quoteService = await loadService();
    prismaMock.quote.findFirst.mockResolvedValue({ quoteNo: 'SH-Q-2026-0007' });
    prismaMock.quote.create.mockImplementation(async ({ data }) => ({
      ...data,
      client: { company: 'Sea Hawk', code: data.clientCode },
      createdBy: { name: 'Admin' },
    }));

    const quote = await quoteService.createQuote({ clientCode: 'SEA', courier: 'DTDC' }, 12, prismaMock);

    expect(quote.quoteNo).toBe('SH-Q-2026-0008');
    expect(quote.createdById).toBe(12);
    expect(quote.validUntil).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('listQuotes returns paginated results with filters', async () => {
    const quoteService = await loadService();
    prismaMock.quote.count.mockResolvedValue(3);
    prismaMock.quote.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const result = await quoteService.listQuotes({
      clientCode: 'SEA',
      status: 'BOOKED',
      courier: 'dtdc',
      fromDate: '2026-04-01',
      toDate: '2026-04-05',
      page: 2,
      limit: 2,
    }, prismaMock);

    expect(prismaMock.quote.findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 2,
      take: 2,
      where: expect.objectContaining({
        clientCode: 'SEA',
        status: 'BOOKED',
      }),
    }));
    expect(result).toEqual({
      total: 3,
      data: [{ id: 1 }, { id: 2 }],
      page: 2,
      limit: 2,
    });
  });

  it('getQuoteStats computes conversion, status map, and averages', async () => {
    const quoteService = await loadService();
    prismaMock.quote.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(4);
    prismaMock.quote.groupBy
      .mockResolvedValueOnce([
        { status: 'BOOKED', _count: { id: 3 } },
        { status: 'QUOTED', _count: { id: 7 } },
      ])
      .mockResolvedValueOnce([
        { courier: 'DTDC', _count: { id: 5 } },
        { courier: 'BlueDart', _count: { id: 2 } },
      ]);
    prismaMock.quote.aggregate.mockResolvedValue({ _avg: { margin: 12.345, profit: 98.765 } });

    const stats = await quoteService.getQuoteStats(prismaMock);

    expect(stats).toEqual({
      total: 10,
      last30: 4,
      conversionRate: 30,
      byStatus: { BOOKED: 3, QUOTED: 7 },
      topCouriers: [
        { courier: 'DTDC', count: 5 },
        { courier: 'BlueDart', count: 2 },
      ],
      avgMargin: 12.35,
      avgProfit: 98.77,
    });
  });
});
