/**
 * invoices.e2e.test.js — Invoices Route Integration Tests
 * 
 * Actual routes:
 *   GET  /api/invoices/         → getAll (ownerOnly)
 *   GET  /api/invoices/:id      → getOne (ownerOnly)
 *   POST /api/invoices/         → create (ownerOnly, validate)
 *   PATCH /api/invoices/:id/status → setStatus (ownerOnly)
 *   DELETE /api/invoices/:id    → remove (ownerOnly)
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
  let ownerToken;
  let adminToken;
  let clientToken;

  beforeAll(async () => {
    const [owner, admin, clientU] = await Promise.all([
      prisma.user.upsert({
        where: { email: 'invoice-owner@seahawk.test' },
        update: { role: 'OWNER', active: true },
        create: { name: 'Owner', email: 'invoice-owner@seahawk.test', password: hash, role: 'OWNER', active: true },
      }),
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

    ownerToken = makeToken({ id: owner.id, role: 'OWNER', email: owner.email });
    adminToken = makeToken({ id: admin.id, role: 'ADMIN', email: admin.email });
    clientToken = makeToken({ id: clientU.id, role: 'CLIENT', email: clientU.email });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ['invoice-owner@seahawk.test', 'invoice-admin@seahawk.test', 'invoice-client@seahawk.test'] } },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/invoices', () => {
    it('OWNER gets list of invoices', async () => {
      const res = await request(app)
        .get('/api/invoices')
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('ADMIN gets 403 for owner-only invoice data', async () => {
      const res = await request(app)
        .get('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/invoices', () => {
    it('Requires validation (400) for missing fields', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('CLIENT role → 403', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ clientCode: 'TEST', dateFrom: '2025-01-01', dateTo: '2025-01-31' });
      expect(res.status).toBe(403);
    });
  });
});
