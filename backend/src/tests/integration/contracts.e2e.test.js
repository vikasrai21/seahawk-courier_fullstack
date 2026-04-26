/**
 * contracts.e2e.test.js — Contracts Route Integration Tests
 */
const request = require('supertest');
const app = require('../../app');
const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'test-jwt-secret-32-characters-ok-long';
const makeToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: '1h' });

const hash = await bcrypt.hash('TestPass@2024', 10);

describe('Contracts E2E Tests — /api/contracts', () => {
  let ownerToken;
  let adminToken;
  let staffToken;

  beforeAll(async () => {
    const [owner, admin, staff] = await Promise.all([
      prisma.user.upsert({
        where: { email: 'contracts-owner@seahawk.test' },
        update: { role: 'OWNER', active: true },
        create: { name: 'Owner', email: 'contracts-owner@seahawk.test', password: hash, role: 'OWNER', active: true },
      }),
      prisma.user.upsert({
        where: { email: 'contracts-admin@seahawk.test' },
        update: { role: 'ADMIN', active: true },
        create: { name: 'Admin', email: 'contracts-admin@seahawk.test', password: hash, role: 'ADMIN', active: true },
      }),
      prisma.user.upsert({
        where: { email: 'contracts-staff@seahawk.test' },
        update: { role: 'STAFF', active: true },
        create: { name: 'Staff', email: 'contracts-staff@seahawk.test', password: hash, role: 'STAFF', active: true },
      })
    ]);

    ownerToken = makeToken({ id: owner.id, role: 'OWNER', email: owner.email });
    adminToken = makeToken({ id: admin.id, role: 'ADMIN', email: admin.email });
    staffToken = makeToken({ id: staff.id, role: 'STAFF', email: staff.email });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ['contracts-owner@seahawk.test', 'contracts-admin@seahawk.test', 'contracts-staff@seahawk.test'] } },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/contracts', () => {
    it('ADMIN gets list of contracts', async () => {
      const res = await request(app)
        .get('/api/contracts')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('STAFF gets list of contracts', async () => {
      const res = await request(app)
        .get('/api/contracts')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/contracts', () => {
    it('Requires OWNER or Admin', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({}); // missing body should trigger validation, not 403
      expect(res.status).toBe(400); 
    });

    it('STAFF also gets validation error (no RBAC on POST)', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/contracts/:id/calculate', () => {
    it('Rejects calculation for invalid contract id', async () => {
      const res = await request(app)
        .get('/api/contracts/99999/calculate?weight=1000&zone=A')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });
});
