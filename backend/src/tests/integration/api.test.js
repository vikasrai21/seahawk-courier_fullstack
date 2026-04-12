const request = require('supertest');
const app = require('../../app');

describe('API Health & Public Routes E2E', () => {
  it('GET /api/health -> returns healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });

  it('GET /api/non-existent -> returns 404', async () => {
    const res = await request(app).get('/api/this-does-not-exist-xyz');
    expect(res.status).toBe(404);
  });

  it('POST /api/auth/login -> rejects empty body', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/login -> rejects non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@doesnotexist.com', password: 'whatever' });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });
});
