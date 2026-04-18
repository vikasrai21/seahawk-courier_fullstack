const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../app');
const prisma = require('../../config/prisma');

describe('Returns End-to-End Integration Tests', () => {
  const runId = Date.now();
  const clientCode = `RET${runId}`.slice(0, 20);
  const adminUser = {
    name: 'Returns E2E Admin',
    email: `returns-admin-${runId}@seahawk.test`,
    password: 'AdminPass123!',
    role: 'ADMIN',
  };
  const clientUser = {
    name: 'Returns E2E Client',
    email: `returns-client-${runId}@seahawk.test`,
    password: 'ClientPass123!',
    role: 'CLIENT',
  };

  let adminId;
  let clientId;
  let adminToken;
  let clientToken;
  let shipmentId;
  let returnId;

  beforeAll(async () => {
    await prisma.client.create({
      data: {
        code: clientCode,
        company: `Returns Integration ${runId}`,
        walletBalance: 0,
        active: true,
      },
    });

    const adminPasswordHash = await bcrypt.hash(adminUser.password, 10);
    const createdAdmin = await prisma.user.create({
      data: {
        name: adminUser.name,
        email: adminUser.email,
        password: adminPasswordHash,
        role: adminUser.role,
        active: true,
      },
    });
    adminId = createdAdmin.id;

    const clientPasswordHash = await bcrypt.hash(clientUser.password, 10);
    const createdClient = await prisma.user.create({
      data: {
        name: clientUser.name,
        email: clientUser.email,
        password: clientPasswordHash,
        role: clientUser.role,
        active: true,
      },
    });
    clientId = createdClient.id;

    await prisma.clientUser.create({
      data: {
        userId: clientId,
        clientCode,
      },
    });

    const shipment = await prisma.shipment.create({
      data: {
        date: new Date().toISOString().slice(0, 10),
        clientCode,
        awb: `RET-AWB-${runId}`,
        consignee: 'Return Test User',
        destination: 'PUNE',
        phone: '9876543210',
        pincode: '411001',
        weight: 1.1,
        amount: 599,
        courier: 'Delhivery',
        service: 'Standard',
        status: 'Delivered',
      },
    });
    shipmentId = shipment.id;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: adminUser.password });
    adminToken = adminLogin.body?.data?.accessToken;

    const clientLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: clientUser.email, password: clientUser.password });
    clientToken = clientLogin.body?.data?.accessToken;
  });

  afterAll(async () => {
    if (returnId) {
      await prisma.auditLog.deleteMany({
        where: {
          entity: 'RETURN_REQUEST',
          entityId: String(returnId),
        },
      });
      await prisma.returnRequest.deleteMany({ where: { id: returnId } });
    }

    if (shipmentId) {
      await prisma.shipment.deleteMany({ where: { id: shipmentId } });
    }

    await prisma.auditLog.deleteMany({
      where: { userId: { in: [adminId, clientId].filter(Boolean) } },
    });

    await prisma.clientUser.deleteMany({ where: { userId: clientId } });
    await prisma.user.deleteMany({ where: { id: { in: [adminId, clientId].filter(Boolean) } } });
    await prisma.client.deleteMany({ where: { code: clientCode } });
    await prisma.$disconnect();
  });

  it('client creates SELF_SHIP return and can view portal timeline', async () => {
    const createRes = await request(app)
      .post('/api/portal/returns')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        shipmentId,
        reason: 'customer_return',
        returnMethod: 'SELF_SHIP',
        reasonDetail: 'Wrong size selected',
        pickupPincode: '411001',
        pickupPhone: '9876543210',
      });

    expect(createRes.status).toBe(200);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.returnMethod).toBe('SELF_SHIP');
    expect(createRes.body.data.status).toBe('PENDING');
    returnId = createRes.body.data.id;

    const timelineRes = await request(app)
      .get(`/api/portal/returns/${returnId}/timeline?limit=20`)
      .set('Authorization', `Bearer ${clientToken}`);

    expect(timelineRes.status).toBe(200);
    expect(timelineRes.body.success).toBe(true);
    expect(Array.isArray(timelineRes.body.data.items)).toBe(true);
    expect(timelineRes.body.data.items.some((event) => event.action === 'RETURN_REQUEST_CREATED')).toBe(true);
  });

  it('admin approval enforces transition rules and captures timeline', async () => {
    const approveRes = await request(app)
      .post(`/api/returns/${returnId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ adminNotes: 'Approved for processing' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.success).toBe(true);
    expect(approveRes.body.data.status).toBe('APPROVED');

    const invalidTransitionRes = await request(app)
      .patch(`/api/returns/${returnId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'IN_TRANSIT' });

    expect(invalidTransitionRes.status).toBe(409);
    expect(invalidTransitionRes.body.success).toBe(false);

    const moveToLabelReadyRes = await request(app)
      .patch(`/api/returns/${returnId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'LABEL_READY' });

    expect(moveToLabelReadyRes.status).toBe(200);
    expect(moveToLabelReadyRes.body.success).toBe(true);
    expect(moveToLabelReadyRes.body.data.status).toBe('LABEL_READY');

    const adminTimelineRes = await request(app)
      .get(`/api/returns/${returnId}/timeline?limit=30`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminTimelineRes.status).toBe(200);
    expect(adminTimelineRes.body.success).toBe(true);
    expect(adminTimelineRes.body.data.items.some((event) => event.action === 'RETURN_REQUEST_APPROVED')).toBe(true);
    expect(adminTimelineRes.body.data.items.some((event) => event.action === 'RETURN_STATUS_UPDATED')).toBe(true);
  });
});
