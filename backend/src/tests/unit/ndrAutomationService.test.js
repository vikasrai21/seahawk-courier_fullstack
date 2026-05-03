import { describe, it, expect, vi, beforeEach } from 'vitest';
import ndrAutomationService from '../../services/ndrAutomation.service';
import prisma from '../../config/prisma';
import notifications from '../../services/notifications.service';

vi.mock('../../config/prisma', () => ({
  default: {
    shipment: { findUnique: vi.fn(), update: vi.fn() },
    nDRLog: { create: vi.fn() }
  }
}));

vi.mock('../../services/notifications.service', () => ({
  default: { sendEmail: vi.fn(), sendWhatsApp: vi.fn() }
}));

describe('ndrAutomation.service', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('logNDR', () => {
    it('should increment attempt count and notify client', async () => {
      const mockShipment = { id: 1, awb: 'NDR1', ndrAttempt: 0, clientCode: 'C1', consigneePhone: '12345' };
      prisma.shipment.findUnique.mockResolvedValue(mockShipment);
      prisma.nDRLog.create.mockResolvedValue({});
      prisma.shipment.update.mockResolvedValue({ ...mockShipment, ndrAttempt: 1, status: 'NDR_RAISED' });

      const res = await ndrAutomationService.logNDR(1, 'CUSTOMER_NOT_AVAILABLE', 'Door locked');
      
      expect(prisma.shipment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'NDR_RAISED', ndrAttempt: 1, subStatus: 'CUSTOMER_NOT_AVAILABLE' }
      });
      expect(notifications.sendEmail).toHaveBeenCalled();
      expect(res.ndrAttempt).toBe(1);
    });

    it('should escalate to RTO if max attempts reached', async () => {
      const mockShipment = { id: 2, awb: 'NDR2', ndrAttempt: 3, clientCode: 'C2' };
      prisma.shipment.findUnique.mockResolvedValue(mockShipment);
      prisma.shipment.update.mockResolvedValue({ ...mockShipment, status: 'RTO_INITIATED' });

      const res = await ndrAutomationService.logNDR(2, 'ADDRESS_INCOMPLETE', 'No such street');
      
      expect(prisma.shipment.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { status: 'RTO_INITIATED', ndrAttempt: 3, subStatus: 'MAX_ATTEMPTS_REACHED' }
      });
      expect(res.status).toBe('RTO_INITIATED');
    });
  });

  describe('requestReattempt', () => {
    it('should set status to OUT_FOR_DELIVERY and clear subStatus', async () => {
      prisma.shipment.update.mockResolvedValue({ id: 1, status: 'OUT_FOR_DELIVERY', subStatus: null });
      const res = await ndrAutomationService.requestReattempt(1, 'New address provided');
      
      expect(prisma.shipment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'OUT_FOR_DELIVERY', subStatus: null }
      });
      expect(res.status).toBe('OUT_FOR_DELIVERY');
    });
  });
});
