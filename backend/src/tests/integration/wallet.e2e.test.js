/**
 * wallet.e2e.test.js — Wallet Management Integration Tests
 */
const request = require('supertest');
const app = require('../../app');
const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'test-jwt-secret-32-characters-ok-long';
const makeToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: '1h' });

const hash = await bcrypt.hash('TestPass@2024', 10);
const TEST_CLIENT_CODE = 'WALE2E';

describe('Wallet E2E Tests — /api/wallet', () => {
  let adminToken;
  let ownerToken;
  let staffToken;

  beforeAll(async () => {
    const [owner, admin, staff] = await Promise.all([
      prisma.user.upsert({
        where: { email: 'wallet-owner@seahawk.test' },
        update: { role: 'OWNER', active: true },
        create: { name: 'Owner', email: 'wallet-owner@seahawk.test', password: hash, role: 'OWNER', active: true },
      }),
      prisma.user.upsert({
        where: { email: 'wallet-admin@seahawk.test' },
        update: { role: 'ADMIN', active: true },
        create: { name: 'Admin', email: 'wallet-admin@seahawk.test', password: hash, role: 'ADMIN', active: true },
      }),
      prisma.user.upsert({
        where: { email: 'wallet-staff@seahawk.test' },
        update: { role: 'STAFF', active: true },
        create: { name: 'Staff', email: 'wallet-staff@seahawk.test', password: hash, role: 'STAFF', active: true },
      })
    ]);

    ownerToken = makeToken({ id: owner.id, role: 'OWNER', email: owner.email });
    adminToken = makeToken({ id: admin.id, role: 'ADMIN', email: admin.email });
    staffToken = makeToken({ id: staff.id, role: 'STAFF', email: staff.email });

    // Ensure client exists for wallet tests
    await prisma.client.upsert({
      where: { code: TEST_CLIENT_CODE },
      update: { walletBalance: 1000 },
      create: { code: TEST_CLIENT_CODE, company: 'Wallet Test', phone: '1234567890', walletBalance: 1000 }
    });
  });

  afterAll(async () => {
    await prisma.client.deleteMany({ where: { code: TEST_CLIENT_CODE } });
    await prisma.user.deleteMany({
      where: { email: { in: ['wallet-owner@seahawk.test', 'wallet-admin@seahawk.test', 'wallet-staff@seahawk.test'] } },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/wallet/:code', () => {
    it('ADMIN can view wallet', async () => {
      const res = await request(app)
        .get(`/api/wallet/${TEST_CLIENT_CODE}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.walletBalance).toBeDefined();
    });
  });

  describe('GET /api/wallet/:code/transactions', () => {
    it('ADMIN can view transaction history', async () => {
      const res = await request(app)
        .get(`/api/wallet/${TEST_CLIENT_CODE}/transactions`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.txns)).toBe(true);
    });
  });

  describe('POST /api/wallet/:code/credit', () => {
    it('OWNER can credit wallet', async () => {
      const res = await request(app)
        .post(`/api/wallet/${TEST_CLIENT_CODE}/credit`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ amount: 500, description: 'Test Credit' });
      expect(res.status).toBe(200);
      expect(res.body.data.txn.type).toBe('CREDIT');
    });

    it('ADMIN can credit wallet', async () => {
      const res = await request(app)
        .post(`/api/wallet/${TEST_CLIENT_CODE}/credit`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 100, description: 'Test Admin Credit' });
      expect(res.status).toBe(200);
    });

    it('STAFF gets 403 trying to credit', async () => {
      const res = await request(app)
        .post(`/api/wallet/${TEST_CLIENT_CODE}/credit`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ amount: 100, description: 'Hack' });
      expect(res.status).toBe(403);
    });

    it('Negative amount triggers validation error', async () => {
      const res = await request(app)
        .post(`/api/wallet/${TEST_CLIENT_CODE}/credit`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: -100, description: 'Negative' });
      expect(res.status).toBe(400); // Bad Request validation
    });
  });

  describe('POST /api/wallet/:code/debit', () => {
    it('OWNER can debit wallet', async () => {
      const res = await request(app)
        .post(`/api/wallet/${TEST_CLIENT_CODE}/debit`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ amount: 200, description: 'Test Debit' });
      expect(res.status).toBe(200);
      expect(res.body.data.txn.type).toBe('DEBIT');
    });

    it('Over-debiting triggers insufficient balance 400', async () => {
      const res = await request(app)
        .post(`/api/wallet/${TEST_CLIENT_CODE}/debit`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ amount: 999999, description: 'Drain' });
      expect(res.status).toBe(400); 
    });
  });

  describe('POST /api/wallet/:code/adjust', () => {
    it('OWNER can adjust wallet', async () => {
      const res = await request(app)
        .post(`/api/wallet/${TEST_CLIENT_CODE}/adjust`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ amount: -50, description: 'Test Adjust' });
      expect(res.status).toBe(200);
    });
  });
});
