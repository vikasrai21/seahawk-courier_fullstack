const request = require('supertest');
const app = require('../../app');
const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');

describe('Auth End-to-End Integration Tests', () => {
  const testUser = {
    name: 'E2E Tester',
    email: 'e2e@seahawkcourier.in',
    password: 'Password123!',
    role: 'CLIENT',
  };

  beforeAll(async () => {
    // Clean the test DB of any previous test artifacts for this user
    await prisma.user.deleteMany({ where: { email: testUser.email } });

    // Hash the password and insert into the real test DB
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    await prisma.user.create({
      data: {
        name: testUser.name,
        email: testUser.email,
        password: hashedPassword,
        role: testUser.role,
        active: true,
      }
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.$disconnect();
  });

  // ─── Login Tests ─────────────────────────────────────────

  it('POST /api/auth/login -> rejects invalid passwords', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'WrongPassword!' });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/login -> accepts valid credentials and returns accessToken', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email);
    // Password hash must NEVER leak to the client
    expect(res.body.data.user.password).toBeUndefined();
  });

  // ─── Protected Route Tests ───────────────────────────────

  it('GET /api/auth/me -> returns user data with valid Bearer JWT', async () => {
    // Login first
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const jwt = loginRes.body.data.accessToken;
    expect(jwt).toBeDefined();

    // Use the real JWT to access /me
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${jwt}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.email).toBe(testUser.email);
  });

  it('GET /api/auth/me -> rejects a fabricated/invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer totally.invalid.jwt');

    expect(res.status).toBeGreaterThanOrEqual(401);
  });

  it('GET /api/auth/me -> rejects requests with no Authorization header', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBeGreaterThanOrEqual(401);
  });
});
