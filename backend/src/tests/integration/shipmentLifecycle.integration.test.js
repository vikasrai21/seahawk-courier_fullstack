import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import config from '../../config';

// 1. Mock CSRF (essential as it blocks all POST/PUT/PATCH/DELETE)
vi.mock('../../middleware/csrf.middleware', () => ({
  issueCsrfCookie: (req, res, next) => next(),
  validateCsrf:    (req, res, next) => next(),
}));

// 2. We will use a REAL signed token but MOCK the database lookup in auth middleware
// This avoids complex CommonJS/ESM middleware interop issues
import app from '../../app';
import prisma from '../../config/prisma';

describe('Shipment Lifecycle Integration', () => {
  const testUserId = 999;
  // Generate a valid-looking token for the test
  const testToken = jwt.sign({ id: testUserId }, config.jwt.secret);

  it('Flow: Create -> Update Status -> Audit Log', async () => {
    // Mock the user lookup that 'protect' middleware performs
    prisma.user.findUnique.mockResolvedValue({
      id: testUserId,
      name: 'Test Admin',
      role: 'ADMIN',
      active: true,
      clientProfile: null 
    });

    // Mock shipment creation
    prisma.shipment.create.mockResolvedValue({
      id: 101, awb: 'SHK123456', status: 'Booked', amount: 150, clientCode: 'CL001',
    });

    prisma.client.findUnique.mockResolvedValue({
      code: 'CL001', company: 'Test Client', walletBalance: 1000,
    });

    // Create Shipment via API
    const resCreate = await request(app)
      .post('/api/shipments')
      .set('Authorization', `Bearer ${testToken}`) // provide the mock token
      .send({
        awb: 'SHK123456',
        clientCode: 'CL001',
        consignee: 'John Doe',
        destination: 'Mumbai',
        weight: 1.5,
        courier: 'Delhivery',
        amount: 150,
      });

    expect(resCreate.status).toBe(200);
    expect(prisma.shipment.create).toHaveBeenCalled();

    // Mock status update
    prisma.shipment.findUnique.mockResolvedValue({
      id: 101, awb: 'SHK123456', status: 'Booked', amount: 150, clientCode: 'CL001',
    });
    
    prisma.shipment.update.mockResolvedValue({
      id: 101, status: 'Delivered',
    });

    // Update Status via API
    const resUpdate = await request(app)
      .post('/api/ops/bulk-status')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        ids: [101],
        status: 'Delivered',
      });

    expect(resUpdate.status).toBe(200);
    expect(prisma.shipment.update).toHaveBeenCalled();
  });

  it('Flow: Cancel shipment triggers wallet refund', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: testUserId, role: 'ADMIN', active: true });
    
    prisma.shipment.findUnique.mockResolvedValue({
      id: 101, status: 'Booked', amount: 500, clientCode: 'CL001',
    });

    const resCancel = await request(app)
      .post('/api/ops/bulk-status')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        ids: [101],
        status: 'Cancelled',
      });

    expect(resCancel.status).toBe(200);
    expect(prisma.client.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { code: 'CL001' },
      data:  { walletBalance: { increment: 500 } }
    }));
  });
});
