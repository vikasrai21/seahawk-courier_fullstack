import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockTx } from '../setup.js';
import { creditShipmentRefund } from '../../services/wallet.service.js';

describe('wallet refund idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a refund transaction when none exists', async () => {
    const db = {
      $transaction: vi.fn((handler) => handler(mockTx)),
    };
    mockTx.walletTransaction.findFirst.mockResolvedValue(null);
    mockTx.client.update.mockResolvedValue({ code: 'SEA', company: 'Sea Hawk', walletBalance: 250 });
    mockTx.walletTransaction.create.mockResolvedValue({ id: 11, reference: 'AWB123', status: 'SUCCESS' });

    const result = await creditShipmentRefund({
      clientCode: 'SEA',
      awb: 'AWB123',
      amount: 50,
      reason: 'RTO',
    }, db);

    expect(db.$transaction).toHaveBeenCalled();
    expect(mockTx.walletTransaction.findFirst).toHaveBeenCalled();
    expect(mockTx.client.update).toHaveBeenCalledWith({
      where: { code: 'SEA' },
      data: { walletBalance: { increment: 50 } },
      select: { code: true, company: true, walletBalance: true },
    });
    expect(mockTx.walletTransaction.create).toHaveBeenCalled();
    expect(result.skipped).toBe(false);
  });

  it('skips a duplicate refund for the same AWB', async () => {
    const db = {
      $transaction: vi.fn((handler) => handler(mockTx)),
    };
    const existingTxn = { id: 99, reference: 'AWB123', status: 'SUCCESS' };
    mockTx.walletTransaction.findFirst.mockResolvedValue(existingTxn);
    mockTx.client.findUnique.mockResolvedValue({ code: 'SEA', company: 'Sea Hawk', walletBalance: 250 });

    const result = await creditShipmentRefund({
      clientCode: 'SEA',
      awb: 'AWB123',
      amount: 50,
      reason: 'RTODelivered',
    }, db);

    expect(mockTx.client.update).not.toHaveBeenCalled();
    expect(mockTx.walletTransaction.create).not.toHaveBeenCalled();
    expect(result.skipped).toBe(true);
    expect(result.txn).toEqual(existingTxn);
  });
});
