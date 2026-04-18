const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../app');
const prisma = require('../../config/prisma');

describe('Developer Hub End-to-End Integration Tests', () => {
  const runId = Date.now();
  const clientCode = `DEV${runId}`.slice(0, 20);
  const clientUser = {
    name: 'Developer Hub E2E Client',
    email: `developer-hub-${runId}@seahawk.test`,
    password: 'ClientPass123!',
    role: 'CLIENT',
  };

  let clientId;
  let clientToken;
  let keyId;
  let apiToken;
  let liveDraftId;

  beforeAll(async () => {
    await prisma.client.create({
      data: {
        code: clientCode,
        company: `Developer Hub Integration ${runId}`,
        walletBalance: 0,
        active: true,
        brandSettings: {},
      },
    });

    const passwordHash = await bcrypt.hash(clientUser.password, 10);
    const createdClientUser = await prisma.user.create({
      data: {
        name: clientUser.name,
        email: clientUser.email,
        password: passwordHash,
        role: clientUser.role,
        active: true,
      },
    });
    clientId = createdClientUser.id;

    await prisma.clientUser.create({
      data: {
        userId: clientId,
        clientCode,
      },
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: clientUser.email,
        password: clientUser.password,
      });

    clientToken = loginRes.body?.data?.accessToken;
  });

  afterAll(async () => {
    await prisma.draftOrder.deleteMany({ where: { clientCode } });
    await prisma.clientApiKey.deleteMany({ where: { clientCode } });
    await prisma.auditLog.deleteMany({
      where: {
        OR: [
          { entityId: { startsWith: `${clientCode}:` } },
          { userId: clientId || -1 },
        ],
      },
    });
    await prisma.clientUser.deleteMany({ where: { userId: clientId } });
    await prisma.user.deleteMany({ where: { id: clientId || -1 } });
    await prisma.client.deleteMany({ where: { code: clientCode } });
    await prisma.$disconnect();
  });

  it('configures provider mapping and creates a live developer API key', async () => {
    const settingsRes = await request(app)
      .post('/api/portal/developer/integrations/settings')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        provider: 'custom',
        enabled: true,
        sourceLabel: 'custom',
        defaultWeightKg: 0.5,
        mappings: {
          referenceId: 'order.id',
          consignee: 'customer.name',
          destination: 'shipping.city',
          phone: 'shipping.phone',
          pincode: 'shipping.pincode',
          weight: 'shipping.weight',
        },
        staticValues: {},
        connector: {
          enabled: false,
        },
      });

    expect(settingsRes.status).toBe(200);
    expect(settingsRes.body.success).toBe(true);

    const keyRes = await request(app)
      .post('/api/portal/developer/keys')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        name: 'Webhook Live Key',
        mode: 'live',
        scopes: ['orders:create', 'events:read', 'webhooks:read', 'webhooks:replay'],
      });

    expect(keyRes.status).toBe(200);
    expect(keyRes.body.success).toBe(true);
    expect(keyRes.body.data.token).toMatch(/^shk_live_/);
    keyId = keyRes.body.data.id;
    apiToken = keyRes.body.data.token;

    const listRes = await request(app)
      .get('/api/portal/developer/keys')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    const listed = listRes.body.data.find((k) => k.id === keyId);
    expect(listed).toBeTruthy();
    expect(listed.tokenHash).toBeUndefined();
    expect(listed.mode).toBe('live');
  });

  it('ingests ecommerce webhook into draft queue and enforces idempotency replay', async () => {
    const payload = {
      order: { id: `ORDER-${runId}` },
      customer: { name: 'API Test Customer' },
      shipping: {
        city: 'Pune',
        phone: '9999999999',
        pincode: '411001',
        weight: '1.2',
      },
    };

    const ingestRes = await request(app)
      .post(`/api/public/integrations/ecommerce/custom/${clientCode}`)
      .set('x-api-key', apiToken)
      .set('Idempotency-Key', `devhub-${runId}`)
      .send(payload);

    expect(ingestRes.status).toBe(201);
    expect(ingestRes.body.success).toBe(true);
    expect(ingestRes.body.data.draftId).toBeDefined();
    liveDraftId = ingestRes.body.data.draftId;

    const replayRes = await request(app)
      .post(`/api/public/integrations/ecommerce/custom/${clientCode}`)
      .set('x-api-key', apiToken)
      .set('Idempotency-Key', `devhub-${runId}`)
      .send(payload);

    expect(replayRes.status).toBe(200);
    expect(replayRes.body.success).toBe(true);
    expect(replayRes.body.data.duplicate).toBe(true);

    const drafts = await prisma.draftOrder.findMany({
      where: { clientCode, referenceId: `ORDER-${runId}` },
      select: { id: true },
    });
    expect(drafts).toHaveLength(1);
    expect(drafts[0].id).toBe(liveDraftId);
  });

  it('exposes developer hub events/logs with scoped key policy', async () => {
    const eventsRes = await request(app)
      .get('/api/portal/developer/integrations/events?limit=50')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(eventsRes.status).toBe(200);
    expect(eventsRes.body.success).toBe(true);
    expect(Array.isArray(eventsRes.body.data)).toBe(true);
    expect(eventsRes.body.data.some((row) => row.action === 'INTEGRATION_DRAFT_CREATED')).toBe(true);

    const logsRes = await request(app)
      .get('/api/portal/developer/integrations/logs?provider=custom&limit=30')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(logsRes.status).toBe(200);
    expect(logsRes.body.success).toBe(true);
    expect(Array.isArray(logsRes.body.data)).toBe(true);
  });

  it('supports sandbox mode where webhook is accepted without draft creation', async () => {
    const policyRes = await request(app)
      .patch(`/api/portal/developer/keys/${keyId}/policy`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        mode: 'sandbox',
        scopes: ['orders:create', 'events:read', 'webhooks:read', 'webhooks:replay'],
      });

    expect(policyRes.status).toBe(200);
    expect(policyRes.body.success).toBe(true);
    expect(policyRes.body.data.mode).toBe('sandbox');

    const sandboxPayload = {
      order: { id: `ORDER-SBX-${runId}` },
      customer: { name: 'Sandbox Customer' },
      shipping: {
        city: 'Delhi',
        phone: '9000000000',
        pincode: '110001',
        weight: '0.9',
      },
    };

    const sandboxRes = await request(app)
      .post(`/api/public/integrations/ecommerce/custom/${clientCode}`)
      .set('x-api-key', apiToken)
      .send(sandboxPayload);

    expect(sandboxRes.status).toBe(202);
    expect(sandboxRes.body.success).toBe(true);
    expect(sandboxRes.body.data.mode).toBe('sandbox');

    const sandboxDraft = await prisma.draftOrder.findFirst({
      where: { clientCode, referenceId: `ORDER-SBX-${runId}` },
    });
    expect(sandboxDraft).toBeNull();
  });
});
