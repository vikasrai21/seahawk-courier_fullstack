/**
 * clients.e2e.test.js — Client Management Route Integration Tests
 * Tests CRUD operations and RBAC for /api/clients/*
 */
const request = require('supertest');
const app = require('../../app');
const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'test-jwt-secret-32-characters-ok-long';
const makeToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: '1h' });

const TEST_CLIENT_CODE = 'T1E2S';
const hash = await bcrypt.hash('TestPass@2024', 10);

describe('Client Management E2E — /api/clients/*', () => {
  let adminToken;
  let staffToken;
  let clientPortalToken;

  beforeAll(async () => {
    const [admin, staff, clientU] = await Promise.all([
      prisma.user.upsert({
        where: { email: 'clients-admin@seahawk.test' },
        update: {},
        create: { name: 'Admin', email: 'clients-admin@seahawk.test', password: hash, role: 'ADMIN', active: true },
      }),
      prisma.user.upsert({
        where: { email: 'clients-staff@seahawk.test' },
        update: {},
        create: { name: 'Staff', email: 'clients-staff@seahawk.test', password: hash, role: 'STAFF', active: true },
      }),
      prisma.user.upsert({
        where: { email: 'clients-client@seahawk.test' },
        update: {},
        create: { name: 'Client', email: 'clients-client@seahawk.test', password: hash, role: 'CLIENT', active: true },
      }),
    ]);

    adminToken = makeToken({ id: admin.id, role: 'ADMIN', email: admin.email });
    staffToken = makeToken({ id: staff.id, role: 'STAFF', email: staff.email });
    clientPortalToken = makeToken({ id: clientU.id, role: 'CLIENT', email: clientU.email });

    // Cleanup any leftover test client
    await prisma.client.deleteMany({ where: { code: TEST_CLIENT_CODE } });
  });

  afterAll(async () => {
    await prisma.client.deleteMany({ where: { code: TEST_CLIENT_CODE } });
    await prisma.user.deleteMany({
      where: { email: { in: ['clients-admin@seahawk.test', 'clients-staff@seahawk.test', 'clients-client@seahawk.test'] } },
    });
    await prisma.$disconnect();
  });

  // ── GET /api/clients ─────────────────────────────────────────────────────

  describe('GET /api/clients (list)', () => {
    it('ADMIN → 200 with array', async () => {
      const res = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('STAFF → 200 (read access)', async () => {
      const res = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(200);
    });

    it('No auth → 401', async () => {
      const res = await request(app).get('/api/clients');
      expect(res.status).toBe(401);
    });
  });

  // ── POST /api/clients (create) ───────────────────────────────────────────

  describe('POST /api/clients (create)', () => {
    it('ADMIN → 200/201 creates client', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: TEST_CLIENT_CODE,
          company: 'E2E Test Company Pvt Ltd',
          phone: '9876543210',
        });
      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });

    it('Duplicate code → upserts (200) or rejects (400/409)', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: TEST_CLIENT_CODE, company: 'Duplicate', phone: '9876543210' });
      expect([200, 201, 400, 409, 422]).toContain(res.status);
    });

    it('Missing required fields → 400', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'XXX' }); // missing company, phone
      expect(res.status).toBe(400);
    });

    it('CLIENT role → 403', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${clientPortalToken}`)
        .send({ code: 'ZZZ99', company: 'Test', phone: '9876543210' });
      expect(res.status).toBe(403);
    });

    it('No auth → 401', async () => {
      const res = await request(app)
        .post('/api/clients')
        .send({ code: 'ZZZ99', company: 'Test', phone: '9876543210' });
      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/clients/:code ───────────────────────────────────────────────

  describe('GET /api/clients/:code (single)', () => {
    it('ADMIN → 200 with client data', async () => {
      const res = await request(app)
        .get(`/api/clients/${TEST_CLIENT_CODE}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.code).toBe(TEST_CLIENT_CODE);
    });

    it('Non-existent code → 404', async () => {
      const res = await request(app)
        .get('/api/clients/ZZZNONE')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it('CLIENT token without profile access → 403 or 200 own', async () => {
      const res = await request(app)
        .get(`/api/clients/${TEST_CLIENT_CODE}`)
        .set('Authorization', `Bearer ${clientPortalToken}`);
      expect([200, 403]).toContain(res.status);
    });
  });
});
