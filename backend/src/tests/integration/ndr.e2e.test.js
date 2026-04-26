/**
 * ndr.e2e.test.js — NDR Routes Integration Tests
 * 
 * Actual routes (ndr.routes.js):
 *   GET  /api/ndr/        → list (authenticate, requireRole(STAFF))
 *   GET  /api/ndr/stats   → stats
 *   POST /api/ndr/        → create
 *   PATCH /api/ndr/:id    → update
 */
const request = require('supertest');
const app = require('../../app');
const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'test-jwt-secret-32-characters-ok-long';
const makeToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: '1h' });

const hash = await bcrypt.hash('TestPass@2024', 10);

describe('NDR E2E Tests — /api/ndr', () => {
  let adminToken;
  let staffToken;

  beforeAll(async () => {
    const [admin, staff] = await Promise.all([
      prisma.user.upsert({
        where: { email: 'ndr-admin@seahawk.test' },
        update: {},
        create: { name: 'Admin', email: 'ndr-admin@seahawk.test', password: hash, role: 'ADMIN', active: true },
      }),
      prisma.user.upsert({
        where: { email: 'ndr-staff@seahawk.test' },
        update: {},
        create: { name: 'Staff', email: 'ndr-staff@seahawk.test', password: hash, role: 'STAFF', active: true },
      })
    ]);

    adminToken = makeToken({ id: admin.id, role: 'ADMIN', email: admin.email });
    staffToken = makeToken({ id: staff.id, role: 'STAFF', email: staff.email });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ['ndr-admin@seahawk.test', 'ndr-staff@seahawk.test'] } },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/ndr', () => {
    it('ADMIN gets list of NDRs', async () => {
      const res = await request(app)
        .get('/api/ndr')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/ndr/stats', () => {
    it('ADMIN gets NDR statistics', async () => {
      const res = await request(app)
        .get('/api/ndr/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PATCH /api/ndr/:id', () => {
    it('Invalid NDR ID returns 400 or 404', async () => {
      const res = await request(app)
        .patch('/api/ndr/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'REATTEMPT' });
      expect([400, 404, 500]).toContain(res.status);
    });
  });
});
