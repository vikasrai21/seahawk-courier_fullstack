import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcryptjs';

describe('Shipment Lifecycle Integration', () => {
  let jwtToken;
  const testUser = {
    name: 'Lifecycle Tester',
    email: 'lifecycle@seahawkcourier.in',
    password: 'Password123!',
    role: 'ADMIN',
  };

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    const user = await prisma.user.create({
      data: {
        name: testUser.name,
        email: testUser.email,
        password: hashedPassword,
        role: testUser.role,
        active: true,
      }
    });

    await prisma.client.upsert({
      where: { code: 'LIFECYCLE_CLIENT' },
      update: { walletBalance: 5000 },
      create: { code: 'LIFECYCLE_CLIENT', company: 'Lifecycle Client', walletBalance: 5000 }
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    jwtToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.trackingEvent.deleteMany({ where: { awb: { startsWith: 'LC_AWB_' } } });
    await prisma.auditLog.deleteMany({ where: { entityId: { startsWith: 'LC_AWB_' } } });
    await prisma.walletTransaction.deleteMany({ where: { reference: { startsWith: 'LC_AWB_' } } });
    await prisma.shipment.deleteMany({ where: { awb: { startsWith: 'LC_AWB_' } } });
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.$disconnect();
  });

  it('Full Shipment Lifecycle (Booked -> InTransit -> Delivered -> Terminal Lock)', async () => {
    const awb = 'LC_AWB_' + Date.now();
    const newShipment = {
      awb,
      date: new Date().toISOString().split('T')[0],
      clientCode: 'LIFECYCLE_CLIENT',
      consignee: 'Lifecycle Consignee',
      destination: 'MUMBAI',
      weight: 1.0,
      amount: 150,
      courier: 'Delhivery',
      service: 'Standard',
      status: 'Booked',
    };

    // 1. Create Shipment (Booked)
    const createRes = await request(app)
      .post('/api/shipments')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(newShipment);

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    const shipmentId = createRes.body.data.id;

    // Verify initial state
    let dbShipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
    expect(dbShipment.status).toBe('Booked');

    // Verify Audit Log
    const createAudit = await prisma.auditLog.findFirst({
      where: { entity: 'Shipment', entityId: awb, action: 'CREATE' }
    });
    expect(createAudit).toBeDefined();

    // Verify Wallet Transaction
    const walletTx = await prisma.walletTransaction.findFirst({
      where: { reference: awb, type: 'DEBIT' }
    });
    expect(walletTx).toBeDefined();
    expect(walletTx.amount).toBe(150);

    // 2. Transition to PickedUp
    const pickedUpRes = await request(app)
      .patch(`/api/shipments/${shipmentId}/status`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ status: 'PickedUp', remarks: 'Courier collected' });

    expect(pickedUpRes.status).toBe(200);

    // 3. Transition to InTransit
    const updateRes = await request(app)
      .patch(`/api/shipments/${shipmentId}/status`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ status: 'InTransit', remarks: 'Hub scan' });

    expect(updateRes.status).toBe(200);

    // Verify Tracking Event
    const trackingEvents = await prisma.trackingEvent.findMany({
      where: { shipmentId },
      orderBy: { timestamp: 'desc' }
    });
    expect(trackingEvents.length).toBeGreaterThan(0);
    expect(trackingEvents[0].status).toBe('InTransit');
    expect(trackingEvents[0].description).toBe('Status updated to InTransit');

    // 4. Transition to RTO (Refund Scenario)
    const rtoRes = await request(app)
      .patch(`/api/shipments/${shipmentId}/status`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ status: 'RTO' });

    expect(rtoRes.status).toBe(200);
    
    // Verify Refund
    const refundTx = await prisma.walletTransaction.findFirst({
      where: { reference: awb, type: 'CREDIT', description: { contains: 'Refund' } }
    });
    expect(refundTx).toBeDefined();
    expect(refundTx.amount).toBe(150);

    // 5. Transition to RTO Delivered (Terminal)
    const terminalRes = await request(app)
      .patch(`/api/shipments/${shipmentId}/status`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ status: 'RTODelivered' });

    expect(terminalRes.status).toBe(200);

    // 4. Attempt Terminal Lock violation
    const lockRes = await request(app)
      .patch(`/api/shipments/${shipmentId}/status`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ status: 'Delivered' });

    // Should reject updates to terminal shipment
    expect(lockRes.status).toBe(500);
    expect(lockRes.body.message).toContain('Invalid status transition');
  });
});
