/**
 * rates.e2e.test.js — Rates Route Integration Tests
 */
const request = require('supertest');
const app = require('../../app');
const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'test-jwt-secret-32-characters-ok-long';
const makeToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: '1h' });

const hash = await bcrypt.hash('TestPass@2024', 10);

describe('Rates E2E Tests — /api/rates', () => {
  let adminToken;
  let ownerToken;

  beforeAll(async () => {
    const [admin, owner] = await Promise.all([
      prisma.user.upsert({
        where: { email: 'rates-admin@seahawk.test' },
        update: {},
        create: { name: 'Admin', email: 'rates-admin@seahawk.test', password: hash, role: 'ADMIN', active: true },
      }),
      prisma.user.upsert({
        where: { email: 'rates-owner@seahawk.test' },
        update: { role: 'OWNER', active: true },
        create: { name: 'Owner', email: 'rates-owner@seahawk.test', password: hash, role: 'OWNER', active: true },
      })
    ]);

    adminToken = makeToken({ id: admin.id, role: 'ADMIN', email: admin.email });
    ownerToken = makeToken({ id: owner.id, role: 'OWNER', email: owner.email });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ['rates-admin@seahawk.test', 'rates-owner@seahawk.test'] } },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/rates', () => {
    it('ADMIN gets list of rate versions', async () => {
      const res = await request(app)
        .get('/api/rates')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/rates/upload', () => {
    it('Rejects missing file with 400', async () => {
      const res = await request(app)
        .post('/api/rates/upload')
        .set('Authorization', `Bearer ${ownerToken}`);
      // Doesn't attach file, triggers Multer/validation error
      expect(res.status).toBeGreaterThanOrEqual(400); 
    });
  });
});
