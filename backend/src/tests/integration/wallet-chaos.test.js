/**
 * wallet-chaos.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Chaos / race-condition tests for the wallet subsystem.
 * Fires concurrent wallet adjustments to verify ACID compliance and
 * ensure no double-credits or negative-balance violations under load.
 */
const request = require('supertest');
const app = require('../../app');
const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'test-jwt-secret-32-characters-ok-long';
const makeToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: '1h' });

const TEST_CLIENT_CODE = 'CHAOSCL';

describe('Wallet Chaos & Concurrency Tests', () => {
  let ownerToken;

  beforeAll(async () => {
    const hash = await bcrypt.hash('TestPass@2024', 10);
    
    // Seed Owner
    const owner = await prisma.user.upsert({
      where: { email: 'chaos-owner@seahawk.test' },
      update: { role: 'OWNER', active: true },
      create: { name: 'Owner', email: 'chaos-owner@seahawk.test', password: hash, role: 'OWNER', active: true },
    });

    ownerToken = makeToken({ id: owner.id, role: 'OWNER', email: owner.email });

    // Seed Client
    await prisma.client.upsert({
      where: { code: TEST_CLIENT_CODE },
      update: {},
      create: {
        code: TEST_CLIENT_CODE,
        company: 'Chaos Test Client',
        contact: 'Mr. Chaos',
        email: 'chaos@seahawk.test',
        phone: '9999999999',
        walletBalance: 0,
        address: '123 Chaos St'
      }
    });
  });

  // ── 1. Concurrent Credits Don't Cause Data Corruption ────────────────────

  test('5 concurrent credit adjustments all succeed and balance is correct', async () => {
    // Get initial balance
    const before = await request(app)
      .get(`/api/wallet/${TEST_CLIENT_CODE}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    
    const initialBalance = before.body?.data?.balance || 0;
    const creditAmount = 10;
    const concurrency = 5;

    // Fire 5 concurrent credit adjustments
    const promises = Array.from({ length: concurrency }, (_, i) =>
      request(app)
        .post(`/api/wallet/adjust`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          clientCode: TEST_CLIENT_CODE,
          amount: creditAmount,
          type: 'CREDIT',
          description: `CHAOS_TEST credit #${i + 1}`,
        })
    );

    const results = await Promise.all(promises);
    const successes = results.filter(r => r.status === 200 || r.status === 201);

    // Check final balance
    const after = await request(app)
      .get(`/api/wallet/${TEST_CLIENT_CODE}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    
    const expectedBalance = initialBalance + (successes.length * creditAmount);
    expect(after.body.data.balance).toBe(expectedBalance);
    expect(successes.length).toBe(concurrency);
  });

  // ── 2. Concurrent Debits Cannot Overdraw ─────────────────────────────────

  test('concurrent debits cannot create a negative balance', async () => {
    // First credit a known amount
    const seedAmount = 50;
    await request(app)
      .post(`/api/wallet/adjust`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        clientCode: TEST_CLIENT_CODE,
        amount: seedAmount,
        type: 'CREDIT',
        description: 'CHAOS_TEST: seed for debit race',
      });

    const balanceRes = await request(app)
      .get(`/api/wallet/${TEST_CLIENT_CODE}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    
    const balanceBefore = balanceRes.body.data.balance;

    // Try to debit more than the balance with concurrent requests
    const debitAmount = balanceBefore; 
    const promises = Array.from({ length: 3 }, (_, i) =>
      request(app)
        .post(`/api/wallet/debit`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          clientCode: TEST_CLIENT_CODE,
          amount: debitAmount,
          description: `CHAOS_TEST: overdraw attempt #${i + 1}`,
        })
    );

    const results = await Promise.all(promises);
    const successes = results.filter(r => r.status === 200 || r.status === 201);
    
    // At most 1 should succeed (the one that got the lock first)
    expect(successes.length).toBeLessThanOrEqual(1);

    // Final balance must never be negative
    const after = await request(app)
      .get(`/api/wallet/${TEST_CLIENT_CODE}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    
    expect(after.body.data.balance).toBeGreaterThanOrEqual(0);
  });

  // ── 3. Rapid Fire: Credit then Debit Interleaving ────────────────────────

  test('rapid interleaved credit/debit operations maintain consistency', async () => {
    const before = await request(app)
      .get(`/api/wallet/${TEST_CLIENT_CODE}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    const startBalance = before.body?.data?.balance || 0;

    // Fire a sequence: +100, -50, +200, -100, +50  → net = +200
    const ops = [
      { amount: 100, type: 'CREDIT', description: 'CHAOS interleave +100' },
      { amount: 50,  type: 'DEBIT',  description: 'CHAOS interleave -50' },
      { amount: 200, type: 'CREDIT', description: 'CHAOS interleave +200' },
      { amount: 100, type: 'DEBIT',  description: 'CHAOS interleave -100' },
      { amount: 50,  type: 'CREDIT', description: 'CHAOS interleave +50' },
    ];

    for (const op of ops) {
      if (op.type === 'DEBIT') {
        await request(app)
          .post(`/api/wallet/debit`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            clientCode: TEST_CLIENT_CODE,
            amount: op.amount,
            description: op.description,
          });
      } else {
        await request(app)
          .post(`/api/wallet/adjust`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            clientCode: TEST_CLIENT_CODE,
            amount: op.amount,
            type: op.type,
            description: op.description,
          });
      }
    }

    const after = await request(app)
      .get(`/api/wallet/${TEST_CLIENT_CODE}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    
    const expectedNet = startBalance + 200;
    expect(after.body.data.balance).toBe(expectedNet);
  });
});

