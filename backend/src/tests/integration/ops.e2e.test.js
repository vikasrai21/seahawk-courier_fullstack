/**
 * ops.e2e.test.js — Ops Routes Integration Tests
 */
const request = require('supertest');
const app = require('../../app');
const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'test-jwt-secret-32-characters-ok-long';
const makeToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: '1h' });

const hash = await bcrypt.hash('TestPass@2024', 10);

describe('Ops Routes E2E Tests — /api/ops', () => {
  let adminToken;
  let staffToken;
  let clientToken;

  beforeAll(async () => {
    const [admin, staff, client] = await Promise.all([
      prisma.user.upsert({
        where: { email: 'ops-admin@seahawk.test' },
        update: {},
        create: { name: 'Admin', email: 'ops-admin@seahawk.test', password: hash, role: 'ADMIN', active: true },
      }),
      prisma.user.upsert({
        where: { email: 'ops-staff@seahawk.test' },
        update: {},
        create: { name: 'Staff', email: 'ops-staff@seahawk.test', password: hash, role: 'STAFF', active: true },
      }),
      prisma.user.upsert({
        where: { email: 'ops-client@seahawk.test' },
        update: {},
        create: { name: 'Client', email: 'ops-client@seahawk.test', password: hash, role: 'CLIENT', active: true },
      })
    ]);

    adminToken = makeToken({ id: admin.id, role: 'ADMIN', email: admin.email });
    staffToken = makeToken({ id: staff.id, role: 'STAFF', email: staff.email });
    clientToken = makeToken({ id: client.id, role: 'CLIENT', email: client.email });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ['ops-admin@seahawk.test', 'ops-staff@seahawk.test', 'ops-client@seahawk.test'] } },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/ops/dashboard', () => {
    it('ADMIN gets full dashboard payload', async () => {
      const res = await request(app)
        .get('/api/ops/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overview).toBeDefined();
    });

    it('CLIENT gets 403', async () => {
      const res = await request(app)
        .get('/api/ops/dashboard')
        .set('Authorization', `Bearer ${clientToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/ops/pending-actions', () => {
    it('ADMIN gets pending actions count', async () => {
      const res = await request(app)
        .get('/api/ops/pending-actions')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.total).toBeDefined();
    });
  });

  describe('POST /api/ops/bulk-status', () => {
    it('ADMIN rejects missing fields with 400', async () => {
      const res = await request(app)
        .post('/api/ops/bulk-status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Delivered' }); // missing ids
      expect(res.status).toBe(400);
    });
  });
});
