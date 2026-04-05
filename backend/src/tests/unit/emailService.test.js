import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/logger', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

describe('email.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('isConfigured', () => {
    it('returns false when EMAIL_USER/EMAIL_PASS not set', async () => {
      const origUser = process.env.EMAIL_USER;
      const origPass = process.env.EMAIL_PASS;
      delete process.env.EMAIL_USER;
      delete process.env.EMAIL_PASS;
      const svc = await import('../../services/email.service.js');
      expect(svc.isConfigured()).toBe(false);
      process.env.EMAIL_USER = origUser;
      process.env.EMAIL_PASS = origPass;
    });
  });

  describe('sendInvoice', () => {
    it('skips when not configured', async () => {
      const origUser = process.env.EMAIL_USER;
      const origPass = process.env.EMAIL_PASS;
      delete process.env.EMAIL_USER;
      delete process.env.EMAIL_PASS;
      const svc = await import('../../services/email.service.js');
      const result = await svc.sendInvoice({
        to: 'test@test.com',
        invoiceNo: 'INV-001',
        clientName: 'Test',
        total: 1000,
        fromDate: '2026-01-01',
        toDate: '2026-01-31',
      });
      expect(result.skipped).toBe(true);
      process.env.EMAIL_USER = origUser;
      process.env.EMAIL_PASS = origPass;
    });
  });

  describe('sendGeneral', () => {
    it('skips when not configured', async () => {
      const origUser = process.env.EMAIL_USER;
      const origPass = process.env.EMAIL_PASS;
      delete process.env.EMAIL_USER;
      delete process.env.EMAIL_PASS;
      const svc = await import('../../services/email.service.js');
      const result = await svc.sendGeneral({ to: 'test@test.com', subject: 'Test', html: '<p>Test</p>' });
      expect(result.skipped).toBe(true);
      process.env.EMAIL_USER = origUser;
      process.env.EMAIL_PASS = origPass;
    });
  });
});
