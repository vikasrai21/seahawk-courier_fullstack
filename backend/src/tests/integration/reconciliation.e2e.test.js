const request = require('supertest');
const app = require('../../app');
const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');

describe('Reconciliation End-to-End Integration Tests', () => {
  let jwtToken;
  let createdInvoiceId;
  const testUser = {
    name: 'Recon E2E Owner',
    email: 'recon-e2e@seahawkcourier.in',
    password: 'AdminPass123!',
    role: 'OWNER',
  };

  beforeAll(async () => {
    // Setup test user
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

    // Ensure MISC client exists
    await prisma.client.upsert({
      where: { code: 'MISC' },
      update: { walletBalance: 10000 },
      create: { code: 'MISC', company: 'Miscellaneous Client', walletBalance: 10000 }
    });

    // Create a known shipment that the reconciliation engine can cross-reference
    await prisma.shipment.upsert({
      where: { awb: 'RECON_TEST_AWB_001' },
      update: {},
      create: {
        awb: 'RECON_TEST_AWB_001',
        date: new Date().toISOString().split('T')[0],
        clientCode: 'MISC',
        consignee: 'Recon Test Consignee',
        destination: 'Delhi',
        weight: 1.5,
        amount: 100,
        courier: 'Delhivery',
        department: 'Operations',
        service: 'Standard',
        status: 'Delivered',
      }
    });

    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    jwtToken = loginRes.body.data.accessToken;
  }, 30000);

  afterAll(async () => {
    // Clean up
    if (createdInvoiceId) {
      await prisma.courierInvoiceItem.deleteMany({ where: { courierInvoiceId: createdInvoiceId } });
      await prisma.courierInvoice.deleteMany({ where: { id: createdInvoiceId } });
    }
    await prisma.shipment.deleteMany({ where: { awb: { startsWith: 'RECON_TEST' } } });
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.$disconnect();
  });

  // ─── Upload Courier Invoice ──────────────────────────────────────
  it('POST /api/reconciliation -> uploads invoice and flags discrepancies', async () => {
    const payload = {
      courier: 'Delhivery',
      invoiceNo: 'E2E-INV-' + Date.now(),
      invoiceDate: new Date().toISOString().split('T')[0],
      fromDate: new Date().toISOString().split('T')[0],
      toDate: new Date().toISOString().split('T')[0],
      items: [
        {
          awb: 'RECON_TEST_AWB_001',
          billedAmount: 250,          // Courier says ₹250
          weight: 1.5,
          destination: 'Delhi',
        },
        {
          awb: 'RECON_TEST_UNKNOWN_AWB',  // AWB not in our system
          billedAmount: 100,
          weight: 0.5,
          destination: 'Mumbai',
        }
      ]
    };

    const res = await request(app)
      .post('/api/reconciliation')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(payload);

    if (res.status !== 201) console.error('RECON UPLOAD ERROR:', res.body);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toBeDefined();
    expect(res.body.data.items.length).toBe(2);

    // The known AWB should have a calculated amount and a status
    const knownItem = res.body.data.items.find(i => i.awb === 'RECON_TEST_AWB_001');
    expect(knownItem).toBeDefined();
    expect(knownItem.calculatedAmount).not.toBeNull();
    expect(['OK', 'OVER', 'UNDER']).toContain(knownItem.status);

    // The unknown AWB should be NOT_FOUND
    const unknownItem = res.body.data.items.find(i => i.awb === 'RECON_TEST_UNKNOWN_AWB');
    expect(unknownItem).toBeDefined();
    expect(unknownItem.status).toBe('NOT_FOUND');

    createdInvoiceId = res.body.data.id;
  });

  // ─── List Invoices ──────────────────────────────────────────────
  it('GET /api/reconciliation -> lists invoices', async () => {
    const res = await request(app)
      .get('/api/reconciliation?page=1&limit=10')
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // ─── Get Invoice Details ────────────────────────────────────────
  it('GET /api/reconciliation/:id -> returns details with summary', async () => {
    if (!createdInvoiceId) return; // skip if upload failed

    const res = await request(app)
      .get(`/api/reconciliation/${createdInvoiceId}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.summary.totalItems).toBe(2);
    expect(res.body.data.summary.notFound).toBe(1);
    expect(res.body.data.summary.totalBilled).toBeGreaterThan(0);
  });

  // ─── Get Stats ──────────────────────────────────────────────────
  it('GET /api/reconciliation/stats -> returns aggregated stats', async () => {
    const res = await request(app)
      .get('/api/reconciliation/stats')
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalInvoices).toBeGreaterThanOrEqual(1);
    expect(res.body.data.totalBilled).toBeGreaterThan(0);
  });

  // ─── Update Status ──────────────────────────────────────────────
  it('PATCH /api/reconciliation/:id/status -> updates invoice status', async () => {
    if (!createdInvoiceId) return;

    const res = await request(app)
      .patch(`/api/reconciliation/${createdInvoiceId}/status`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ status: 'VERIFIED', notes: 'E2E verified' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('VERIFIED');
  });

  // ─── Auth Boundary ──────────────────────────────────────────────
  it('GET /api/reconciliation -> rejects unauthenticated', async () => {
    const res = await request(app).get('/api/reconciliation');
    expect(res.status).toBeGreaterThanOrEqual(401);
  });
});
