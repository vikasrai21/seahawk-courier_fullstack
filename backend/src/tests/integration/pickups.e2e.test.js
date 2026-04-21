/**
 * pickups.e2e.test.js — Pickup Routing Integration Tests
 */
const request = require('supertest');
const app = require('../../app');
const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'test-jwt-secret-32-characters-ok-long';
const makeToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: '1h' });

const hash = await bcrypt.hash('TestPass@2024', 10);

describe('Pickup E2E Tests — /api/pickups', () => {
  let adminToken;
  let clientToken;

  beforeAll(async () => {
    const [admin, clientO] = await Promise.all([
      prisma.user.upsert({
        where: { email: 'pickup-admin@seahawk.test' },
        update: {},
        create: { name: 'Admin', email: 'pickup-admin@seahawk.test', password: hash, role: 'ADMIN', active: true },
      }),
      prisma.user.upsert({
        where: { email: 'pickup-client@seahawk.test' },
        update: {},
        create: { name: 'Client', email: 'pickup-client@seahawk.test', password: hash, role: 'CLIENT', active: true },
      })
    ]);

    adminToken = makeToken({ id: admin.id, role: 'ADMIN', email: admin.email });
    clientToken = makeToken({ id: clientO.id, role: 'CLIENT', email: clientO.email });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ['pickup-admin@seahawk.test', 'pickup-client@seahawk.test'] } },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/pickups', () => {
    it('ADMIN gets list of pickups', async () => {
      const res = await request(app)
        .get('/api/pickups')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/pickups', () => {
    it('Requires validation (400) for missing fields', async () => {
      const res = await request(app)
        .post('/api/pickups')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({});
      expect(res.status).toBe(400); 
    });
  });
});
