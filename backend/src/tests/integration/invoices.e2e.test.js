/**
 * invoices.e2e.test.js — Invoices Route Integration Tests
 */
const request = require('supertest');
const app = require('../../app');
const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'test-jwt-secret-32-characters-ok-long';
const makeToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: '1h' });

const hash = await bcrypt.hash('TestPass@2024', 10);

describe('Invoices E2E Tests — /api/invoices', () => {
  let adminToken;
  let clientToken;

  beforeAll(async () => {
    const [admin, clientU] = await Promise.all([
      prisma.user.upsert({
        where: { email: 'invoice-admin@seahawk.test' },
        update: {},
        create: { name: 'Admin', email: 'invoice-admin@seahawk.test', password: hash, role: 'ADMIN', active: true },
      }),
      prisma.user.upsert({
        where: { email: 'invoice-client@seahawk.test' },
        update: {},
        create: { name: 'Client', email: 'invoice-client@seahawk.test', password: hash, role: 'CLIENT', active: true },
      })
    ]);

    adminToken = makeToken({ id: admin.id, role: 'ADMIN', email: admin.email });
    clientToken = makeToken({ id: clientU.id, role: 'CLIENT', email: clientU.email });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ['invoice-admin@seahawk.test', 'invoice-client@seahawk.test'] } },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/invoices', () => {
    it('ADMIN gets list of invoices', async () => {
      const res = await request(app)
        .get('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/invoices/generate', () => {
    it('Requires validation (400) for missing fields', async () => {
      const res = await request(app)
        .post('/api/invoices/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400); 
    });

    it('CLIENT role → 403', async () => {
      const res = await request(app)
        .post('/api/invoices/generate')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ clientCode: 'TEST', dateFrom: '2025-01-01', dateTo: '2025-01-31' });
      expect(res.status).toBe(403); 
    });
  });
});
