/**
 * notifications.e2e.test.js — Notifications Route Integration Tests
 * 
 * Actual routes:
 *   POST /api/notifications/send-update  → sends status notification (needs awb)
 *   POST /api/notifications/send-digest  → sends daily digest (needs clientCode + date)
 *   GET  /api/notifications/history      → notification history
 *   GET  /api/notifications/stats        → delivery stats
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

  describe('GET /api/notifications/history', () => {
    it('ADMIN gets notification history', async () => {
      const res = await request(app)
        .get('/api/notifications/history')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/notifications/stats', () => {
    it('ADMIN gets delivery stats', async () => {
      const res = await request(app)
        .get('/api/notifications/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/notifications/send-update', () => {
    it('Requires awb field (400)', async () => {
      const res = await request(app)
        .post('/api/notifications/send-update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/notifications/send-digest', () => {
    it('Requires clientCode and date (400)', async () => {
      const res = await request(app)
        .post('/api/notifications/send-digest')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });
});
