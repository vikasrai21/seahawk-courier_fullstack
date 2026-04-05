import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma, mockTx } from '../setup.js';

vi.mock('../../middleware/errorHandler', () => ({
  AppError: class AppError extends Error {
    constructor(message, statusCode) { super(message); this.statusCode = statusCode; this.isOperational = true; }
  },
}));

const walletService = await import('../../services/wallet.service.js');

describe('wallet.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── parseAmount (via getWallet/getBalance) ──────────────────────────
  describe('getWallet', () => {
    it('returns client wallet info', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({ code: 'TEST', company: 'Test Co', walletBalance: 500 });
      const result = await walletService.getWallet('TEST');
      expect(result.walletBalance).toBe(500);
    });

    it('throws when client not found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);
      await expect(walletService.getWallet('BAD')).rejects.toThrow('Client not found');
    });
  });

  describe('getBalance', () => {
    it('returns numeric balance', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({ code: 'T', company: 'T', walletBalance: 250.50 });
      const bal = await walletService.getBalance('T');
      expect(bal).toBe(250.50);
    });
  });

  // ── getTransactions ──────────────────────────────────────────────────
  describe('getTransactions', () => {
    it('returns paginated transactions', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({ code: 'T', company: 'T', walletBalance: 100 });
      mockPrisma.$transaction.mockResolvedValue([2, [{ id: 1 }, { id: 2 }]]);
      const result = await walletService.getTransactions('T', { page: 1, limit: 10 });
      expect(result.total).toBe(2);
      expect(result.txns).toHaveLength(2);
    });
  });

  // ── credit ───────────────────────────────────────────────────────────
  describe('credit', () => {
    it('increments balance and creates transaction', async () => {
      mockTx.client.update = vi.fn().mockResolvedValue({ code: 'T', company: 'T', walletBalance: 600 });
      mockTx.walletTransaction.create = vi.fn().mockResolvedValue({ id: 1, type: 'CREDIT', amount: 100, status: 'SUCCESS' });
      mockPrisma.$transaction.mockImplementation((fn) => fn(mockTx));

      const result = await walletService.credit({ clientCode: 'T', amount: 100, description: 'Recharge' });
      expect(result.wallet.walletBalance).toBe(600);
      expect(result.txn.type).toBe('CREDIT');
    });

    it('throws on invalid amount', async () => {
      await expect(walletService.credit({ clientCode: 'T', amount: -10 })).rejects.toThrow('Amount must be a valid positive number.');
    });

    it('throws on zero amount', async () => {
      await expect(walletService.credit({ clientCode: 'T', amount: 0 })).rejects.toThrow('Amount must be a valid positive number.');
    });
  });

  // ── debit ────────────────────────────────────────────────────────────
  describe('debit', () => {
    it('decrements balance and creates transaction', async () => {
      mockTx.client.findUnique = vi.fn().mockResolvedValue({ walletBalance: 500 });
      mockTx.client.update = vi.fn().mockResolvedValue({ code: 'T', company: 'T', walletBalance: 400 });
      mockTx.walletTransaction.create = vi.fn().mockResolvedValue({ id: 2, type: 'DEBIT', amount: 100, status: 'SUCCESS' });
      mockPrisma.$transaction.mockImplementation((fn) => fn(mockTx));

      const result = await walletService.debit({ clientCode: 'T', amount: 100, description: 'Shipment' });
      expect(result.wallet.walletBalance).toBe(400);
      expect(result.txn.type).toBe('DEBIT');
    });

    it('throws on insufficient balance', async () => {
      mockTx.client.findUnique = vi.fn().mockResolvedValue({ walletBalance: 10 });
      mockPrisma.$transaction.mockImplementation((fn) => fn(mockTx));
      await expect(walletService.debit({ clientCode: 'T', amount: 500 })).rejects.toThrow('Insufficient wallet balance');
    });

    it('throws when client not found during debit', async () => {
      mockTx.client.findUnique = vi.fn().mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation((fn) => fn(mockTx));
      await expect(walletService.debit({ clientCode: 'BAD', amount: 10 })).rejects.toThrow('Client not found');
    });
  });

  // ── adjust ───────────────────────────────────────────────────────────
  describe('adjust', () => {
    it('handles positive adjustment (credit)', async () => {
      mockTx.client.update = vi.fn().mockResolvedValue({ code: 'T', company: 'T', walletBalance: 600 });
      mockTx.walletTransaction.create = vi.fn().mockResolvedValue({ type: 'CREDIT', amount: 100 });
      mockPrisma.$transaction.mockImplementation((fn) => fn(mockTx));

      const result = await walletService.adjust({ clientCode: 'T', amount: 100, description: 'Correction' });
      expect(result.txn.type).toBe('CREDIT');
    });

    it('handles negative adjustment (debit)', async () => {
      mockTx.client.update = vi.fn().mockResolvedValue({ code: 'T', company: 'T', walletBalance: 400 });
      mockTx.walletTransaction.create = vi.fn().mockResolvedValue({ type: 'DEBIT', amount: 100 });
      mockPrisma.$transaction.mockImplementation((fn) => fn(mockTx));

      const result = await walletService.adjust({ clientCode: 'T', amount: -100, description: 'Penalty' });
      expect(result.txn.type).toBe('DEBIT');
    });

    it('throws on zero adjustment', async () => {
      await expect(walletService.adjust({ clientCode: 'T', amount: 0, description: 'None' }))
        .rejects.toThrow('Adjustment amount must be non-zero.');
    });
  });
});
