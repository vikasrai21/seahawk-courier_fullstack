const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../app');
const prisma = require('../../config/prisma');

describe('Client Portal E2E Tests — /api/portal', () => {
  const primaryClientCode = 'PORTALCL';
  const otherClientCode = 'PORTALOT';
  const clientUser = {
    name: 'Portal Client User',
    email: 'portal-client-e2e@seahawkcourier.in',
    password: 'ClientPass123!',
    role: 'CLIENT',
  };

  let clientJwtToken;
  let ownShipment;
  let otherShipment;
  let ownInvoice;
  let otherInvoice;

  beforeAll(async () => {
    await prisma.client.upsert({
      where: { code: primaryClientCode },
      update: {
        company: 'Portal Primary Client',
        brandSettings: {
          notificationCenter: {
            whatsapp: { delivered: true, delay: true },
          },
          brandName: 'Portal Primary Client',
          brandColor: '#e8580a',
        },
      },
      create: {
        code: primaryClientCode,
        company: 'Portal Primary Client',
        brandSettings: {
          notificationCenter: {
            whatsapp: { delivered: true, delay: true },
          },
          brandName: 'Portal Primary Client',
          brandColor: '#e8580a',
        },
      },
    });

    await prisma.client.upsert({
      where: { code: otherClientCode },
      update: { company: 'Portal Other Client' },
      create: { code: otherClientCode, company: 'Portal Other Client' },
    });

    await prisma.user.deleteMany({ where: { email: clientUser.email } });
    const passwordHash = await bcrypt.hash(clientUser.password, 10);
    const portalUser = await prisma.user.create({
      data: {
        name: clientUser.name,
        email: clientUser.email,
        password: passwordHash,
        role: clientUser.role,
        active: true,
      },
    });

    await prisma.clientUser.upsert({
      where: { userId: portalUser.id },
      update: { clientCode: primaryClientCode },
      create: { userId: portalUser.id, clientCode: primaryClientCode },
    });

    ownShipment = await prisma.shipment.create({
      data: {
        awb: `PORTAL_AWB_${Date.now()}`,
        date: '2026-04-21',
        clientCode: primaryClientCode,
        consignee: 'Primary Receiver',
        destination: 'Delhi',
        pincode: '110001',
        courier: 'DTDC',
        service: 'Express',
        status: 'InTransit',
        weight: 4.5,
        amount: 850,
        department: 'Operations',
        remarks: 'Portal tracking visibility test',
      },
    });

    otherShipment = await prisma.shipment.create({
      data: {
        awb: `PORTAL_OTHER_AWB_${Date.now()}`,
        date: '2026-04-21',
        clientCode: otherClientCode,
        consignee: 'Other Receiver',
        destination: 'Mumbai',
        pincode: '400001',
        courier: 'Delhivery',
        service: 'Standard',
        status: 'Booked',
        weight: 2.1,
        amount: 540,
        department: 'Operations',
        remarks: 'Other client shipment',
      },
    });

    await prisma.trackingEvent.createMany({
      data: [
        {
          shipmentId: ownShipment.id,
          awb: ownShipment.awb,
          status: 'InTransit',
          location: 'Delhi Hub',
          description: 'Shipment reached Delhi hub',
          source: 'TEST',
          timestamp: new Date('2026-04-21T10:00:00.000Z'),
        },
        {
          shipmentId: otherShipment.id,
          awb: otherShipment.awb,
          status: 'Booked',
          location: 'Mumbai',
          description: 'Shipment booked',
          source: 'TEST',
          timestamp: new Date('2026-04-21T09:00:00.000Z'),
        },
      ],
    });

    ownInvoice = await prisma.invoice.create({
      data: {
        invoiceNo: `INV-PORTAL-${Date.now()}`,
        clientCode: primaryClientCode,
        fromDate: '2026-04-01',
        toDate: '2026-04-30',
        subtotal: 1000,
        gstPercent: 18,
        gstAmount: 180,
        total: 1180,
        status: 'SENT',
        items: {
          create: [
            {
              date: '2026-04-21',
              awb: ownShipment.awb,
              destination: ownShipment.destination,
              courier: ownShipment.courier,
              weight: ownShipment.weight,
              amount: ownShipment.amount,
              shipmentId: ownShipment.id,
            },
          ],
        },
      },
    });

    otherInvoice = await prisma.invoice.create({
      data: {
        invoiceNo: `INV-PORTAL-OTHER-${Date.now()}`,
        clientCode: otherClientCode,
        fromDate: '2026-04-01',
        toDate: '2026-04-30',
        subtotal: 500,
        gstPercent: 18,
        gstAmount: 90,
        total: 590,
        status: 'SENT',
      },
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: clientUser.email, password: clientUser.password });

    clientJwtToken = loginRes.body.data.accessToken;
  }, 30000);

  afterAll(async () => {
    await prisma.trackingEvent.deleteMany({
      where: { awb: { in: [ownShipment?.awb, otherShipment?.awb].filter(Boolean) } },
    });
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: { in: [ownInvoice?.id, otherInvoice?.id].filter(Boolean) } },
    });
    await prisma.invoice.deleteMany({
      where: { id: { in: [ownInvoice?.id, otherInvoice?.id].filter(Boolean) } },
    });
    await prisma.shipment.deleteMany({
      where: { id: { in: [ownShipment?.id, otherShipment?.id].filter(Boolean) } },
    });
    await prisma.clientUser.deleteMany({ where: { user: { email: clientUser.email } } });
    await prisma.user.deleteMany({ where: { email: clientUser.email } });
    await prisma.$disconnect();
  });

  it('returns client-safe tracking detail without weight or amount', async () => {
    const res = await request(app)
      .get(`/api/portal/tracking/${ownShipment.awb}`)
      .set('Authorization', `Bearer ${clientJwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.shipment.awb).toBe(ownShipment.awb);
    expect(res.body.data.shipment.amount).toBeUndefined();
    expect(res.body.data.shipment.weight).toBeUndefined();
    expect(Array.isArray(res.body.data.events)).toBe(true);
  });

  it('does not let a client read another client shipment through tracking detail', async () => {
    const res = await request(app)
      .get(`/api/portal/tracking/${otherShipment.awb}`)
      .set('Authorization', `Bearer ${clientJwtToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns invoice detail only for the linked client and includes items for preview', async () => {
    const res = await request(app)
      .get(`/api/portal/invoices/${ownInvoice.id}`)
      .set('Authorization', `Bearer ${clientJwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.invoiceNo).toBe(ownInvoice.invoiceNo);
    expect(res.body.data.client.code).toBe(primaryClientCode);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.items[0].awb).toBe(ownShipment.awb);
  });

  it('blocks invoice detail access for invoices belonging to another client', async () => {
    const res = await request(app)
      .get(`/api/portal/invoices/${otherInvoice.id}`)
      .set('Authorization', `Bearer ${clientJwtToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('serves monthly invoice export through the dedicated route', async () => {
    const res = await request(app)
      .get('/api/portal/invoices/monthly-export?month=2026-04&format=csv')
      .set('Authorization', `Bearer ${clientJwtToken}`);

    expect(res.status).toBe(200);
    expect(String(res.headers['content-type'] || '')).toContain('text/csv');
    expect(String(res.text || '')).toContain(ownInvoice.invoiceNo);
    expect(String(res.text || '')).toContain(ownShipment.awb);
  });

  it('preserves existing notification-center settings when updating branding', async () => {
    const res = await request(app)
      .post('/api/portal/branding')
      .set('Authorization', `Bearer ${clientJwtToken}`)
      .send({
        brandName: 'Portal Prime',
        brandColor: '#112233',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const client = await prisma.client.findUnique({
      where: { code: primaryClientCode },
      select: { brandSettings: true },
    });

    expect(client.brandSettings.brandName).toBe('Portal Prime');
    expect(client.brandSettings.brandColor).toBe('#112233');
    expect(client.brandSettings.notificationCenter.whatsapp.delivered).toBe(true);
    expect(client.brandSettings.notificationCenter.whatsapp.delay).toBe(true);
  });

  it('rejects privileged fields when client tries create-and-book shipment', async () => {
    const res = await request(app)
      .post('/api/portal/shipments/create-and-book')
      .set('Authorization', `Bearer ${clientJwtToken}`)
      .send({
        consignee: 'Portal Booking Receiver',
        deliveryAddress: '12 Test Street',
        deliveryCity: 'Delhi',
        pincode: '110001',
        weight: 1.5,
        service: 'Standard',
        amount: 1,
        status: 'Delivered',
        department: 'Finance',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(String(res.body.message || '')).toContain('server controlled');
    expect(String(res.body.message || '')).toContain('amount');
    expect(String(res.body.message || '')).toContain('status');
    expect(String(res.body.message || '')).toContain('department');
  });
});
