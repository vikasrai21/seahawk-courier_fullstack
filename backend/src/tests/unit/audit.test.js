import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma } from '../setup.js';

vi.mock('../../utils/logger', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const { auditLog, logAudit } = await import('../../utils/audit.js');

describe('audit utility', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('auditLog', () => {
    it('creates an audit log entry', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 1 });
      await auditLog({
        userId: 1,
        userEmail: 'admin@seahawk.com',
        action: 'CREATE',
        entity: 'SHIPMENT',
        entityId: '1',
        ip: '127.0.0.1',
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 1,
          action: 'CREATE',
          entity: 'SHIPMENT',
        }),
      });
    });

    it('does not throw on failure (audit failures are non-critical)', async () => {
      mockPrisma.auditLog.create.mockRejectedValue(new Error('DB down'));
      await expect(auditLog({ action: 'TEST', entity: 'TEST' })).resolves.not.toThrow();
    });

    it('handles null values gracefully', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 2 });
      await auditLog({ action: 'DELETE', entity: 'CLIENT' });
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: null,
          userEmail: null,
          entityId: null,
          ip: null,
        }),
      });
    });
  });

  describe('logAudit', () => {
    it('extracts user info from request', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 3 });
      const req = { user: { id: 1, email: 'a@a.com' }, ip: '10.0.0.1' };
      await logAudit({ req, action: 'UPDATE', entity: 'USER', entityId: 5 });
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 1,
          userEmail: 'a@a.com',
          ip: '10.0.0.1',
        }),
      });
    });

    it('handles missing request object', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 4 });
      await logAudit({ action: 'IMPORT', entity: 'SHIPMENT' });
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
  });
});
