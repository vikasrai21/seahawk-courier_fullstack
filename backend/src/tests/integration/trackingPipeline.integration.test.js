import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcryptjs';

// Mock Delhivery Courier Service to return deterministic tracking data
vi.mock('../../services/delhivery.service.js', () => ({
  getTracking: vi.fn().mockImplementation((awb) => {
    if (awb === 'TRACK_NEW_INTRANSIT') {
      return Promise.resolve({
        awb,
        status: 'In Transit',
        events: [
          { status: 'In Transit', location: 'Delhi Hub', description: 'Arrived at hub', timestamp: new Date().toISOString() }
        ]
      });
    }
    if (awb === 'TRACK_EXISTING_DELIVERED') {
      return Promise.resolve({
        awb,
        status: 'Delivered',
        events: [
          { status: 'Delivered', location: 'Mumbai', description: 'Delivered to consignee', timestamp: new Date().toISOString() }
        ]
      });
    }
    return Promise.resolve(null);
  })
}));

describe('Tracking Pipeline Integration', () => {
  let jwtToken;
  const testUser = {
    name: 'Pipeline Tester',
    email: 'pipeline@seahawkcourier.in',
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
      where: { code: 'TRACK_CLIENT' },
      update: { walletBalance: 5000 },
      create: { code: 'TRACK_CLIENT', company: 'Track Client', walletBalance: 5000 }
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    jwtToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.trackingEvent.deleteMany({ where: { awb: { startsWith: 'TRACK_' } } });
    await prisma.auditLog.deleteMany({ where: { entityId: { startsWith: 'TRACK_' } } });
    await prisma.walletTransaction.deleteMany({ where: { reference: { startsWith: 'TRACK_' } } });
    await prisma.shipment.deleteMany({ where: { awb: { startsWith: 'TRACK_' } } });
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.$disconnect();
    vi.clearAllMocks();
  });

  it('Pipeline: Scan New AWB -> Fetch Tracking -> Create Shipment (InTransit)', async () => {
    const awb = 'TRACK_NEW_INTRANSIT';

    const scanRes = await request(app)
      .post('/api/shipments/scan')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ awb, courier: 'Delhivery' });

    console.log(scanRes.body);
    expect(scanRes.status).toBe(200);
    expect(scanRes.body.success).toBe(true);

    const shipment = await prisma.shipment.findUnique({ where: { awb } });
    expect(shipment).toBeDefined();
    
    // Because the state machine transitions Booked -> PickedUp -> InTransit, the live tracking sync 
    // will jump directly to InTransit! Wait, does the sync handle the jump?
    // In our live tracking, the status updates directly from the courier payload.
    expect(shipment.status).toBe('InTransit');

    const trackingEvents = await prisma.trackingEvent.findMany({
      where: { shipmentId: shipment.id },
      orderBy: { timestamp: 'desc' }
    });

    expect(trackingEvents.length).toBeGreaterThan(0);
    expect(trackingEvents[0].description).toBe('Arrived at hub');
  });

  it('Pipeline: Scan Existing AWB -> Fetch Tracking -> Update Shipment (Delivered)', async () => {
    const awb = 'TRACK_EXISTING_DELIVERED';

    // 1. Pre-create the shipment as "Booked"
    const created = await prisma.shipment.create({
      data: {
        awb,
        date: new Date().toISOString().split('T')[0],
        clientCode: 'TRACK_CLIENT',
        consignee: 'Test',
        destination: 'Mumbai',
        weight: 1.0,
        amount: 0,
        courier: 'Delhivery',
        service: 'Standard',
        status: 'Booked',
      }
    });

    // 2. Perform scanner scan which triggers pipeline
    const scanRes = await request(app)
      .post('/api/shipments/scan')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ awb, courier: 'Delhivery' });

    expect(scanRes.status).toBe(200);

    // 3. Verify it transitioned to Delivered
    const shipment = await prisma.shipment.findUnique({ where: { id: created.id } });
    expect(shipment.status).toBe('Delivered');

    const trackingEvents = await prisma.trackingEvent.findMany({
      where: { shipmentId: created.id },
      orderBy: { timestamp: 'desc' }
    });

    expect(trackingEvents.length).toBeGreaterThan(0);
    expect(trackingEvents[0].status).toBe('Delivered');
  });
});
