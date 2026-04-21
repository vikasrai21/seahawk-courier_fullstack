/**
 * notifications.e2e.test.js — Notifications Route Integration Tests
 */
const request = require('supertest');
const app = require('../../app');
const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'test-jwt-secret-32-characters-ok-long';
const makeToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: '1h' });

const hash = await bcrypt.hash('TestPass@2024', 10);

describe('Notifications E2E Tests — /api/notifications', () => {
  let adminToken;
  let staffToken;

  beforeAll(async () => {
    const [admin, staff] = await Promise.all([
      prisma.user.upsert({
        where: { email: 'notif-admin@seahawk.test' },
        update: {},
        create: { name: 'Admin', email: 'notif-admin@seahawk.test', password: hash, role: 'ADMIN', active: true },
      }),
      prisma.user.upsert({
        where: { email: 'notif-staff@seahawk.test' },
        update: {},
        create: { name: 'Staff', email: 'notif-staff@seahawk.test', password: hash, role: 'STAFF', active: true },
      })
    ]);

    adminToken = makeToken({ id: admin.id, role: 'ADMIN', email: admin.email });
    staffToken = makeToken({ id: staff.id, role: 'STAFF', email: staff.email });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ['notif-admin@seahawk.test', 'notif-staff@seahawk.test'] } },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/notifications', () => {
    it('ADMIN gets list of notifications', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/notifications/send-pod', () => {
    it('Requires validation (400) for missing awb', async () => {
      const res = await request(app)
        .post('/api/notifications/send-pod')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400); 
    });
  });

  describe('POST /api/notifications/digest', () => {
    it('Rejects without query or matching data (404/400/200 empty)', async () => {
      const res = await request(app)
        .post('/api/notifications/digest')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ clientCode: 'NONEXISTENT' });
      expect([200, 400, 404]).toContain(res.status);
    });
  });
});
