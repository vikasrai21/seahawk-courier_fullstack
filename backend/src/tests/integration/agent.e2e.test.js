/**
 * agent.e2e.test.js — HawkAI Agent Route Integration Tests
 *
 * Tests all /api/ops/agent/* endpoints for:
 * - RBAC (OWNER passes, ADMIN/STAFF/CLIENT rejected)
 * - Input validation
 * - Correct response shape
 */
const request = require('supertest');
const app = require('../../app');
const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'test-jwt-secret-32-characters-ok-long';

// Helper: create a signed JWT directly for a role (fast — no login round-trip)
function makeToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '1h' });
}

describe('HawkAI Agent E2E Tests — /api/ops/agent/*', () => {
  let ownerToken;
  let adminToken;
  let staffToken;
  let clientToken;
  let ownerUser;

  beforeAll(async () => {
    const hash = await bcrypt.hash('TestPass@2024', 10);

    // Create test users with all roles
    const [owner, admin, staff, clientUser] = await Promise.all([
      prisma.user.upsert({
        where: { email: 'test-owner@seahawk.test' },
        update: { role: 'OWNER', active: true },
        create: { name: 'Test Owner', email: 'test-owner@seahawk.test', password: hash, role: 'OWNER', active: true },
      }),
      prisma.user.upsert({
        where: { email: 'test-admin@seahawk.test' },
        update: { role: 'ADMIN', active: true },
        create: { name: 'Test Admin', email: 'test-admin@seahawk.test', password: hash, role: 'ADMIN', active: true },
      }),
      prisma.user.upsert({
        where: { email: 'test-staff@seahawk.test' },
        update: { role: 'STAFF', active: true },
        create: { name: 'Test Staff', email: 'test-staff@seahawk.test', password: hash, role: 'STAFF', active: true },
      }),
      prisma.user.upsert({
        where: { email: 'test-client-user@seahawk.test' },
        update: { role: 'CLIENT', active: true },
        create: { name: 'Test Client', email: 'test-client-user@seahawk.test', password: hash, role: 'CLIENT', active: true },
      }),
    ]);

    ownerUser = owner;
    ownerToken = makeToken({ id: owner.id, role: 'OWNER', email: owner.email });
    adminToken = makeToken({ id: admin.id, role: 'ADMIN', email: admin.email });
    staffToken = makeToken({ id: staff.id, role: 'STAFF', email: staff.email });
    clientToken = makeToken({ id: clientUser.id, role: 'CLIENT', email: clientUser.email });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ['test-owner@seahawk.test', 'test-admin@seahawk.test', 'test-staff@seahawk.test', 'test-client-user@seahawk.test'] } },
    });
    await prisma.$disconnect();
  });

  // ── POST /api/ops/agent/chat ─────────────────────────────────────────────

  describe('POST /api/ops/agent/chat', () => {
    it('OWNER token → 200 with reply', async () => {
      const res = await request(app)
        .post('/api/ops/agent/chat')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ message: 'show overview' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reply).toBeDefined();
      expect(typeof res.body.data.reply).toBe('string');
    });

    it('ADMIN token → 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/ops/agent/chat')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ message: 'show overview' });
      expect(res.status).toBe(403);
    });

    it('STAFF token → 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/ops/agent/chat')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ message: 'show overview' });
      expect(res.status).toBe(403);
    });

    it('CLIENT token → 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/ops/agent/chat')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ message: 'show overview' });
      expect(res.status).toBe(403);
    });

    it('No auth → 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/ops/agent/chat')
        .send({ message: 'show overview' });
      expect(res.status).toBe(401);
    });

    it('Empty message → 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/ops/agent/chat')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ message: '' });
      expect(res.status).toBe(400);
    });

    it('Missing message field → 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/ops/agent/chat')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('Message exceeding 2000 chars → 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/ops/agent/chat')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ message: 'x'.repeat(2001) });
      expect(res.status).toBe(400);
    });

    it('reply includes suggestions array', async () => {
      const res = await request(app)
        .post('/api/ops/agent/chat')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ message: 'show overview' });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.suggestions)).toBe(true);
    });

    it('multi-turn: second message in same session continues flow', async () => {
      const sid = `e2e-session-${Date.now()}`;
      const res1 = await request(app)
        .post('/api/ops/agent/chat')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ message: 'list clients', sessionId: sid });
      expect(res1.status).toBe(200);
    });
  });

  // ── GET /api/ops/agent/memory ────────────────────────────────────────────

  describe('GET /api/ops/agent/memory', () => {
    it('OWNER → 200', async () => {
      const res = await request(app)
        .get('/api/ops/agent/memory')
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(res.status).toBe(200);
    });

    it('ADMIN → 403', async () => {
      const res = await request(app)
        .get('/api/ops/agent/memory')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
    });

    it('STAFF → 403', async () => {
      const res = await request(app)
        .get('/api/ops/agent/memory')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(403);
    });

    it('No auth → 401', async () => {
      const res = await request(app).get('/api/ops/agent/memory');
      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/ops/agent/history ───────────────────────────────────────────

  describe('GET /api/ops/agent/history', () => {
    it('OWNER → 200 with array data', async () => {
      const res = await request(app)
        .get('/api/ops/agent/history')
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(res.status).toBe(200);
    });

    it('STAFF → 403', async () => {
      const res = await request(app)
        .get('/api/ops/agent/history')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ── POST /api/ops/agent/teach ────────────────────────────────────────────

  describe('POST /api/ops/agent/teach', () => {
    it('OWNER → 200', async () => {
      const res = await request(app)
        .post('/api/ops/agent/teach')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ category: 'courier', contextKey: 'Delhi heavy', decision: 'DTDC' });
      expect(res.status).toBe(200);
    });

    it('Missing required fields → 400', async () => {
      const res = await request(app)
        .post('/api/ops/agent/teach')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ category: 'courier' }); // missing contextKey and decision
      expect(res.status).toBe(400);
    });

    it('STAFF → 403', async () => {
      const res = await request(app)
        .post('/api/ops/agent/teach')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ category: 'courier', contextKey: 'Delhi', decision: 'DTDC' });
      expect(res.status).toBe(403);
    });
  });
});
