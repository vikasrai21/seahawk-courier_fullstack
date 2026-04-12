const request = require('supertest');
const app = require('../../app');
const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');

describe('Wallet End-to-End Integration Tests', () => {
  let adminToken;
  const testAdmin = {
    name: 'Wallet E2E Admin',
    email: 'wallet-e2e@seahawkcourier.in',
    password: 'WalletAdmin123!',
    role: 'ADMIN',
  };

  beforeAll(async () => {
    // Setup admin user
    await prisma.user.deleteMany({ where: { email: testAdmin.email } });
    const hashedPassword = await bcrypt.hash(testAdmin.password, 10);
    await prisma.user.create({
      data: {
        name: testAdmin.name,
        email: testAdmin.email,
        password: hashedPassword,
        role: testAdmin.role,
        active: true,
      }
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testAdmin.email, password: testAdmin.password });

    adminToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testAdmin.email } });
    await prisma.$disconnect();
  });

  it('GET /api/wallet -> lists all wallets (ADMIN)', async () => {
    const res = await request(app)
      .get('/api/wallet')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.wallets)).toBe(true);
  });

  it('GET /api/wallet -> rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/wallet');
    expect(res.status).toBeGreaterThanOrEqual(401);
  });
});
