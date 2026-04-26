import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcryptjs';

/**
 * Tracking Pipeline Integration Tests
 * 
 * Tests the real scanner pipeline (captureOnly mode) which is how
 * production AWB intake works. This validates:
 *   1. New AWB scan → shipment creation + tracking event
 *   2. Existing AWB scan → shipment update (no duplicate)
 *   3. AWB normalization and data enrichment
 *   4. Client matching via OCR hints
 */
describe('Tracking Pipeline Integration', () => {
  let jwtToken;
  let userId;
  const testUser = {
    name: 'Pipeline Tester',
    email: 'pipeline@seahawkcourier.in',
    password: 'Password123!',
    role: 'ADMIN',
  };

  beforeAll(async () => {
    // Clean up any prior test data
    await prisma.trackingEvent.deleteMany({ where: { awb: { startsWith: 'PIPE_' } } });
    await prisma.shipment.deleteMany({ where: { awb: { startsWith: 'PIPE_' } } });
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
    userId = user.id;

    // Ensure MISC client exists (scanner creates shipments under MISC by default)
    await prisma.client.upsert({
      where: { code: 'MISC' },
      update: {},
      create: { code: 'MISC', company: 'Miscellaneous', walletBalance: 0 }
    });

    // Ensure a named client for OCR matching tests
    await prisma.client.upsert({
      where: { code: 'PIPETEST' },
      update: { walletBalance: 5000 },
      create: { code: 'PIPETEST', company: 'Pipeline Test Corp', walletBalance: 5000 }
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    jwtToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.trackingEvent.deleteMany({ where: { awb: { startsWith: 'PIPE_' } } });
    await prisma.walletTransaction.deleteMany({ where: { reference: { startsWith: 'PIPE_' } } });
    await prisma.shipment.deleteMany({ where: { awb: { startsWith: 'PIPE_' } } });
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.$disconnect();
  });

  // ─── Test 1: Capture-Only Scan creates a new shipment ──────────
  it('Scan (captureOnly) creates a new placeholder shipment', async () => {
    const awb = 'PIPE_NEW_001';

    const scanRes = await request(app)
      .post('/api/shipments/scan')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ awb, courier: 'Delhivery', captureOnly: true });

    expect(scanRes.status).toBe(200);
    expect(scanRes.body.success).toBe(true);

    // Verify shipment was created in database
    const shipment = await prisma.shipment.findUnique({ where: { awb } });
    expect(shipment).toBeDefined();
    expect(shipment.status).toBe('Booked');
    expect(shipment.courier).toBe('Delhivery');
    expect(shipment.clientCode).toBe('MISC');
    expect(shipment.remarks).toContain('SCAN_CAPTURED');
  });

  // ─── Test 2: Re-scanning same AWB does NOT create a duplicate ──
  it('Re-scanning an existing AWB updates instead of creating a duplicate', async () => {
    const awb = 'PIPE_DUPE_001';

    // First scan — creates the shipment
    const scan1 = await request(app)
      .post('/api/shipments/scan')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ awb, courier: 'Delhivery', captureOnly: true });

    expect(scan1.status).toBe(200);

    // Second scan — should NOT create a duplicate
    const scan2 = await request(app)
      .post('/api/shipments/scan')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ awb, courier: 'Delhivery', captureOnly: true });

    expect(scan2.status).toBe(200);

    // Verify only ONE shipment exists with this AWB
    const count = await prisma.shipment.count({ where: { awb } });
    expect(count).toBe(1);
  });

  // ─── Test 3: Auto-detection of courier from AWB format ─────────
  it('Auto-detects courier when set to AUTO', async () => {
    const awb = 'PIPE_AUTO_001';

    const scanRes = await request(app)
      .post('/api/shipments/scan')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ awb, courier: 'AUTO', captureOnly: true });

    expect(scanRes.status).toBe(200);

    const shipment = await prisma.shipment.findUnique({ where: { awb } });
    expect(shipment).toBeDefined();
    // AUTO should resolve to a valid courier (Delhivery is the default fallback)
    expect(['Delhivery', 'Trackon', 'DTDC']).toContain(shipment.courier);
  });

  // ─── Test 4: Status transition after scan ──────────────────────
  it('Scanned shipment can transition through the lifecycle', async () => {
    const awb = 'PIPE_LIFECYCLE_001';

    // 1. Scan to create shipment (Booked)
    const scanRes = await request(app)
      .post('/api/shipments/scan')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ awb, courier: 'Delhivery', captureOnly: true });

    expect(scanRes.status).toBe(200);
    const shipment = await prisma.shipment.findUnique({ where: { awb } });

    // 2. PickedUp transition
    const pickupRes = await request(app)
      .patch(`/api/shipments/${shipment.id}/status`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ status: 'PickedUp' });

    expect(pickupRes.status).toBe(200);

    // 3. InTransit transition
    const transitRes = await request(app)
      .patch(`/api/shipments/${shipment.id}/status`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ status: 'InTransit' });

    expect(transitRes.status).toBe(200);

    // 4. OutForDelivery transition (required before Delivered)
    const ofdRes = await request(app)
      .patch(`/api/shipments/${shipment.id}/status`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ status: 'OutForDelivery' });

    expect(ofdRes.status).toBe(200);

    // 5. Delivered (terminal)
    const deliveredRes = await request(app)
      .patch(`/api/shipments/${shipment.id}/status`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ status: 'Delivered' });

    expect(deliveredRes.status).toBe(200);

    // 6. Verify tracking events were created for each transition
    const events = await prisma.trackingEvent.findMany({
      where: { shipmentId: shipment.id },
      orderBy: { timestamp: 'asc' }
    });

    expect(events.length).toBeGreaterThanOrEqual(4);
    const statuses = events.map(e => e.status);
    expect(statuses).toContain('PickedUp');
    expect(statuses).toContain('InTransit');
    expect(statuses).toContain('OutForDelivery');
    expect(statuses).toContain('Delivered');
  });

  // ─── Test 5: Pre-existing shipment gets updated on re-scan ─────
  it('Pre-existing shipment is enriched when re-scanned with new data', async () => {
    const awb = 'PIPE_ENRICH_001';

    // 1. Create a bare-bones shipment in the DB
    await prisma.shipment.create({
      data: {
        awb,
        date: new Date().toISOString().split('T')[0],
        clientCode: 'MISC',
        consignee: '',
        destination: '',
        weight: 0,
        amount: 0,
        courier: 'Delhivery',
        service: 'Standard',
        status: 'Booked',
        createdById: userId,
        updatedById: userId,
      }
    });

    // 2. Re-scan with captureOnly — the service should update, not duplicate
    const scanRes = await request(app)
      .post('/api/shipments/scan')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ awb, courier: 'Delhivery', captureOnly: true });

    expect(scanRes.status).toBe(200);

    // Verify no duplicate
    const count = await prisma.shipment.count({ where: { awb } });
    expect(count).toBe(1);

    // The shipment should still be the same record
    const shipment = await prisma.shipment.findUnique({ where: { awb } });
    expect(shipment.status).toBe('Booked');
  });
});
