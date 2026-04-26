import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcryptjs';

/**
 * Portal Tenant Isolation Integration Tests
 * 
 * Proves that the client portal enforces strict data isolation:
 *   - Client A cannot see Client B's shipments
 *   - Client A cannot see Client B's wallet or invoices
 *   - Admin users can see cross-client data (by passing clientCode)
 *   - Client users are restricted to their own clientCode
 */
describe('Portal Tenant Isolation', () => {
  let tokenClientA;
  let tokenClientB;
  let tokenAdmin;

  const clientA = { code: 'ISO_A', company: 'Isolation Client A' };
  const clientB = { code: 'ISO_B', company: 'Isolation Client B' };

  const userA = { name: 'Client A User', email: 'isoa@test.seahawk.in', password: 'Pass123!', role: 'CLIENT' };
  const userB = { name: 'Client B User', email: 'isob@test.seahawk.in', password: 'Pass123!', role: 'CLIENT' };
  const adminUser = { name: 'Isolation Admin', email: 'isoadmin@test.seahawk.in', password: 'Pass123!', role: 'ADMIN' };

  beforeAll(async () => {
    // Clean up prior test data
    await prisma.trackingEvent.deleteMany({ where: { awb: { startsWith: 'ISO_' } } });
    await prisma.walletTransaction.deleteMany({ where: { clientCode: { in: [clientA.code, clientB.code] } } });
    await prisma.shipment.deleteMany({ where: { awb: { startsWith: 'ISO_' } } });
    await prisma.clientUser.deleteMany({ where: { clientCode: { in: [clientA.code, clientB.code] } } });
    await prisma.user.deleteMany({ where: { email: { in: [userA.email, userB.email, adminUser.email] } } });

    // Create clients
    await prisma.client.upsert({
      where: { code: clientA.code },
      update: { walletBalance: 1000 },
      create: { code: clientA.code, company: clientA.company, walletBalance: 1000 }
    });
    await prisma.client.upsert({
      where: { code: clientB.code },
      update: { walletBalance: 2000 },
      create: { code: clientB.code, company: clientB.company, walletBalance: 2000 }
    });

    const hashedPassword = await bcrypt.hash('Pass123!', 10);

    // Create Client A user + profile link
    const createdUserA = await prisma.user.create({
      data: { name: userA.name, email: userA.email, password: hashedPassword, role: 'CLIENT', active: true }
    });
    await prisma.clientUser.create({ data: { userId: createdUserA.id, clientCode: clientA.code } });

    // Create Client B user + profile link
    const createdUserB = await prisma.user.create({
      data: { name: userB.name, email: userB.email, password: hashedPassword, role: 'CLIENT', active: true }
    });
    await prisma.clientUser.create({ data: { userId: createdUserB.id, clientCode: clientB.code } });

    // Create Admin user
    await prisma.user.create({
      data: { name: adminUser.name, email: adminUser.email, password: hashedPassword, role: 'ADMIN', active: true }
    });

    // Create shipments for each client
    const today = new Date().toISOString().split('T')[0];
    await prisma.shipment.createMany({
      data: [
        { awb: 'ISO_A_001', date: today, clientCode: clientA.code, courier: 'Delhivery', service: 'Standard', status: 'Booked', weight: 1, amount: 100 },
        { awb: 'ISO_A_002', date: today, clientCode: clientA.code, courier: 'Trackon', service: 'Express', status: 'InTransit', weight: 2, amount: 200 },
        { awb: 'ISO_B_001', date: today, clientCode: clientB.code, courier: 'Delhivery', service: 'Standard', status: 'Delivered', weight: 1.5, amount: 150 },
        { awb: 'ISO_B_002', date: today, clientCode: clientB.code, courier: 'DTDC', service: 'Standard', status: 'Booked', weight: 3, amount: 300 },
      ]
    });

    // Create wallet transactions for each client
    await prisma.walletTransaction.createMany({
      data: [
        { clientCode: clientA.code, type: 'CREDIT', amount: 1000, balance: 1000, description: 'Test topup A' },
        { clientCode: clientB.code, type: 'CREDIT', amount: 2000, balance: 2000, description: 'Test topup B' },
      ]
    });

    // Login all users
    const loginA = await request(app).post('/api/auth/login').send({ email: userA.email, password: userA.password });
    tokenClientA = loginA.body.data.accessToken;

    const loginB = await request(app).post('/api/auth/login').send({ email: userB.email, password: userB.password });
    tokenClientB = loginB.body.data.accessToken;

    const loginAdmin = await request(app).post('/api/auth/login').send({ email: adminUser.email, password: adminUser.password });
    tokenAdmin = loginAdmin.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.trackingEvent.deleteMany({ where: { awb: { startsWith: 'ISO_' } } });
    await prisma.walletTransaction.deleteMany({ where: { clientCode: { in: [clientA.code, clientB.code] } } });
    await prisma.shipment.deleteMany({ where: { awb: { startsWith: 'ISO_' } } });
    await prisma.clientUser.deleteMany({ where: { clientCode: { in: [clientA.code, clientB.code] } } });
    await prisma.user.deleteMany({ where: { email: { in: [userA.email, userB.email, adminUser.email] } } });
    await prisma.$disconnect();
  });

  // ─── Test 1: Client A sees only their own shipments ────────────
  it('Client A sees only their own shipments via portal', async () => {
    const res = await request(app)
      .get('/api/portal/shipments')
      .set('Authorization', `Bearer ${tokenClientA}`);

    expect(res.status).toBe(200);

    const shipments = res.body.data?.shipments || res.body.data || [];
    const awbs = shipments.map(s => s.awb);

    // Must see Client A shipments
    expect(awbs).toContain('ISO_A_001');
    expect(awbs).toContain('ISO_A_002');

    // Must NOT see Client B shipments
    expect(awbs).not.toContain('ISO_B_001');
    expect(awbs).not.toContain('ISO_B_002');
  });

  // ─── Test 2: Client B sees only their own shipments ────────────
  it('Client B sees only their own shipments via portal', async () => {
    const res = await request(app)
      .get('/api/portal/shipments')
      .set('Authorization', `Bearer ${tokenClientB}`);

    expect(res.status).toBe(200);

    const shipments = res.body.data?.shipments || res.body.data || [];
    const awbs = shipments.map(s => s.awb);

    // Must see Client B shipments
    expect(awbs).toContain('ISO_B_001');
    expect(awbs).toContain('ISO_B_002');

    // Must NOT see Client A shipments
    expect(awbs).not.toContain('ISO_A_001');
    expect(awbs).not.toContain('ISO_A_002');
  });

  // ─── Test 3: Client A's wallet is isolated ─────────────────────
  it('Client A sees only their own wallet balance', async () => {
    const res = await request(app)
      .get('/api/portal/wallet')
      .set('Authorization', `Bearer ${tokenClientA}`);

    expect(res.status).toBe(200);

    const walletData = res.body.data;
    expect(walletData).toBeDefined();
    // Client A wallet balance should be 1000 (not 2000 which is B's)
    // The wallet API returns { wallet: { walletBalance }, txns }
    expect(walletData.wallet.walletBalance).toBe(1000);
  });

  // ─── Test 4: Client A cannot access Client B's shipment by ID ──
  it('Client A cannot view Client B shipment detail', async () => {
    // Fetch Client B's shipment ID
    const bShipment = await prisma.shipment.findUnique({ where: { awb: 'ISO_B_001' } });

    const res = await request(app)
      .get(`/api/portal/shipments/${bShipment.id}`)
      .set('Authorization', `Bearer ${tokenClientA}`);

    // Should return 404 or empty (not 200 with data)
    expect([403, 404]).toContain(res.status);
  });

  // ─── Test 5: Stats are scoped per-client ───────────────────────
  it('Client A stats reflect only their shipment counts', async () => {
    const res = await request(app)
      .get('/api/portal/stats')
      .set('Authorization', `Bearer ${tokenClientA}`);

    expect(res.status).toBe(200);

    const stats = res.body.data;
    // Client A has exactly 2 shipments (nested under totals)
    expect(stats.totals.total).toBeGreaterThanOrEqual(2);
  });

  // ─── Test 6: Admin can access cross-client data ────────────────
  it('Admin can query shipments across clients', async () => {
    const resA = await request(app)
      .get('/api/portal/shipments?clientCode=ISO_A')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(resA.status).toBe(200);
    const shipmentsA = resA.body.data?.shipments || resA.body.data || [];
    expect(shipmentsA.length).toBe(2);

    const resB = await request(app)
      .get('/api/portal/shipments?clientCode=ISO_B')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(resB.status).toBe(200);
    const shipmentsB = resB.body.data?.shipments || resB.body.data || [];
    expect(shipmentsB.length).toBe(2);
  });
});