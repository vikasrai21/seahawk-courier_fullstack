/**
 * wallet.e2e.test.js — Wallet Management Integration Tests
 * 
 * Actual routes:
 *   GET  /api/wallet/:clientCode           → getWallet (requireClientAccountAccess)
 *   GET  /api/wallet/:clientCode/transactions → getTransactions
 *   POST /api/wallet/debit                 → debitWallet (ownerOnly)
 *   POST /api/wallet/adjust                → adjustWallet (ownerOnly)
 * 
 * There is NO /credit endpoint — credits happen via recharge/verify or internal service calls.
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

    await prisma.client.upsert({
      where: { code: TEST_CLIENT_CODE },
      update: { walletBalance: 5000 },
      create: { code: TEST_CLIENT_CODE, company: 'Wallet Test', phone: '1234567890', walletBalance: 5000 }
    });
  });

  afterAll(async () => {
    try { await prisma.walletTransaction.deleteMany({ where: { clientCode: TEST_CLIENT_CODE } }); } catch {}
    try { await prisma.client.deleteMany({ where: { code: TEST_CLIENT_CODE } }); } catch {}
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
    });
  });

  describe('GET /api/wallet/:code/transactions', () => {
    it('ADMIN can view transaction history', async () => {
      const res = await request(app)
        .get(`/api/wallet/${TEST_CLIENT_CODE}/transactions`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/wallet/debit', () => {
    it('OWNER can debit wallet', async () => {
      const res = await request(app)
        .post('/api/wallet/debit')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ clientCode: TEST_CLIENT_CODE, amount: 200, description: 'Test Debit' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Over-debiting triggers insufficient balance 400 or 500', async () => {
      const res = await request(app)
        .post('/api/wallet/debit')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ clientCode: TEST_CLIENT_CODE, amount: 999999, description: 'Drain' });
      expect([400, 500]).toContain(res.status);
    });

    it('STAFF gets 403 trying to debit', async () => {
      const res = await request(app)
        .post('/api/wallet/debit')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ clientCode: TEST_CLIENT_CODE, amount: 100, description: 'Hack' });
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/wallet/adjust', () => {
    it('OWNER can adjust wallet (CREDIT)', async () => {
      const res = await request(app)
        .post('/api/wallet/adjust')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ clientCode: TEST_CLIENT_CODE, amount: 50, type: 'CREDIT', description: 'Test Adjust Credit' });
      expect(res.status).toBe(200);
    });

    it('Negative amount triggers validation error', async () => {
      const res = await request(app)
        .post('/api/wallet/adjust')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ clientCode: TEST_CLIENT_CODE, amount: -100, type: 'DEBIT', description: 'Adjustment' });
      expect(res.status).toBe(400); // Amount must be positive in Zod
    });
  });
});
