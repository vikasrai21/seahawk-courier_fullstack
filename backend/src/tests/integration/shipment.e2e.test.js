const request = require('supertest');
const app = require('../../app');
const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');

describe('Shipment End-to-End Integration Tests', () => {
  let jwtToken;
  const testUser = {
    name: 'Shipment E2E Admin',
    email: 'shipment-e2e@seahawkcourier.in',
    password: 'AdminPass123!',
    role: 'ADMIN',
  };

  beforeAll(async () => {
    // Setup: create an ADMIN user for shipment operations
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    await prisma.user.create({
      data: {
        name: testUser.name,
        email: testUser.email,
        password: hashedPassword,
        role: testUser.role,
        active: true,
      }
    });

    // Create the MISC client for shipments
    await prisma.client.upsert({
      where: { code: 'MISC' },
      update: { walletBalance: 10000 },
      create: { code: 'MISC', company: 'Miscellaneous Client', walletBalance: 10000 }
    });

    // Login to get a real JWT
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    jwtToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    // Clean up test shipments and the test user
    await prisma.shipment.deleteMany({ where: { awb: { startsWith: 'E2ETEST' } } });
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.$disconnect();
  });

  // ─── Shipment CRUD ───────────────────────────────────────

  it('GET /api/shipments -> returns paginated shipment list', async () => {
    const res = await request(app)
      .get('/api/shipments?page=1&limit=10')
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/shipments -> creates a new shipment', async () => {
    const newShipment = {
      awb: 'E2ETEST' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      clientCode: 'MISC',
      consignee: 'E2E Test Consignee',
      destination: 'DELHI',
      weight: 1.5,
      amount: 250,
      courier: 'Delhivery',
      department: 'Operations',
      service: 'Standard',
      status: 'Booked',
    };

    const res = await request(app)
      .post('/api/shipments')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(newShipment);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.awb).toBe(newShipment.awb);
    expect(res.body.data.consignee).toBe(newShipment.consignee.toUpperCase());

    // Verify it actually exists in the database
    const dbRecord = await prisma.shipment.findUnique({ where: { awb: newShipment.awb } });
    expect(dbRecord).not.toBeNull();
    expect(dbRecord.destination).toBe('DELHI');
  });

  it('GET /api/shipments/:id -> fetches a single shipment by ID', async () => {
    // First create one
    const awb = 'E2ETEST_GET_' + Date.now();
    const created = await prisma.shipment.create({
      data: {
        awb,
        date: new Date().toISOString().split('T')[0],
        clientCode: 'MISC',
        consignee: 'Get Test',
        destination: 'MUMBAI',
        weight: 0.5,
        amount: 100,
        courier: 'DTDC',
        department: 'Operations',
        service: 'Express',
        status: 'Booked',
      }
    });

    const res = await request(app)
      .get(`/api/shipments/${created.id}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.awb).toBe(awb);
  });

  it('PUT /api/shipments/:id -> updates shipment details', async () => {
    const awb = 'E2ETEST_PUT_' + Date.now();
    const created = await prisma.shipment.create({
      data: {
        awb,
        date: new Date().toISOString().split('T')[0],
        clientCode: 'MISC',
        consignee: 'Before Update',
        destination: 'CHENNAI',
        weight: 1.0,
        amount: 200,
        courier: 'Delhivery',
        department: 'Operations',
        service: 'Standard',
        status: 'Booked',
      }
    });

    const res = await request(app)
      .put(`/api/shipments/${created.id}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ consignee: 'After Update', weight: 2.5 });

    expect(res.status).toBe(200);
    expect(res.body.data.consignee).toBe('AFTER UPDATE');
    expect(res.body.data.weight).toBe(2.5);
  });

  it('DELETE /api/shipments/:id -> deletes a shipment (ADMIN only)', async () => {
    const awb = 'E2ETEST_DEL_' + Date.now();
    const created = await prisma.shipment.create({
      data: {
        awb,
        date: new Date().toISOString().split('T')[0],
        clientCode: 'MISC',
        consignee: 'To Delete',
        destination: 'KOLKATA',
        weight: 0.3,
        amount: 50,
        courier: 'Trackon',
        department: 'Operations',
        service: 'Standard',
        status: 'Booked',
      }
    });

    const res = await request(app)
      .delete(`/api/shipments/${created.id}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it's gone from the DB
    const dbRecord = await prisma.shipment.findUnique({ where: { id: created.id } });
    expect(dbRecord).toBeNull();
  });

  // ─── Stats Endpoints ─────────────────────────────────────

  it('GET /api/shipments/stats/today -> returns today stats', async () => {
    const res = await request(app)
      .get('/api/shipments/stats/today')
      .set('Authorization', `Bearer ${jwtToken}`);

    if (res.status !== 200) console.error('TODAY STATS ERROR:', res.body);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('GET /api/shipments/stats/monthly -> returns monthly stats', async () => {
    const res = await request(app)
      .get('/api/shipments/stats/monthly')
      .set('Authorization', `Bearer ${jwtToken}`);

    if (res.status !== 200) console.error('MONTHLY STATS ERROR:', res.body);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // ─── Authorization Boundary ──────────────────────────────

  it('POST /api/shipments -> rejects unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/shipments')
      .send({ awb: 'NOAUTH123', consignee: 'Should fail' });

    expect(res.status).toBeGreaterThanOrEqual(401);
  });
});
