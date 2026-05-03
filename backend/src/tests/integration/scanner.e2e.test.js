const request = require('supertest');
const app = require('../../app');
const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');
const ocrSvc = require('../../services/ocr.service');

describe('Scanner API Integration Tests', () => {
  let jwtToken;
  let clientJwtToken;
  const testUser = {
    name: 'Scanner E2E Admin',
    email: 'scanner-e2e-unique@seahawkcourier.in',
    password: 'AdminPass123!',
    role: 'ADMIN',
  };
  const clientUser = {
    name: 'Scanner Portal Client',
    email: 'scanner-portal-client@seahawkcourier.in',
    password: 'ClientPass123!',
    role: 'CLIENT',
  };

  beforeAll(async () => {
    // Setup test user
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    const user = await prisma.user.create({
      data: {
        name: testUser.name,
        email: testUser.email,
        password: hashedPassword,
        role: testUser.role,
        active: true,
      }
    });

    // Create MISC client fallback and a trained alias client
    await prisma.client.upsert({
      where: { code: 'MISC' },
      update: { walletBalance: 10000 },
      create: { code: 'MISC', company: 'Miscellaneous Client', walletBalance: 10000 }
    });

    await prisma.client.upsert({
      where: { code: 'TECSIDEL' },
      update: {},
      create: { code: 'TECSIDEL', company: 'Tecsidel India Pvt Ltd' }
    });

    await prisma.client.upsert({
      where: { code: 'IMPORTCL' },
      update: {},
      create: { code: 'IMPORTCL', company: 'Import Ledger Client' }
    });

    await prisma.user.deleteMany({ where: { email: clientUser.email } });
    const clientPassword = await bcrypt.hash(clientUser.password, 10);
    const portalUser = await prisma.user.create({
      data: {
        name: clientUser.name,
        email: clientUser.email,
        password: clientPassword,
        role: clientUser.role,
        active: true,
      }
    });
    await prisma.clientUser.upsert({
      where: { userId: portalUser.id },
      update: { clientCode: 'IMPORTCL' },
      create: { userId: portalUser.id, clientCode: 'IMPORTCL' },
    });

    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    jwtToken = loginRes.body.data.accessToken;

    const clientLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: clientUser.email, password: clientUser.password });

    clientJwtToken = clientLoginRes.body.data.accessToken;
  }, 30000);

  afterAll(async () => {
    await prisma.shipment.deleteMany({ where: { awb: { startsWith: 'SCAN_TEST' } } });
    await prisma.shipmentImportRow.deleteMany({ where: { awb: { startsWith: 'SCAN_TEST' } } });
    await prisma.clientUser.deleteMany({ where: { user: { email: clientUser.email } } });
    await prisma.user.deleteMany({ where: { email: clientUser.email } });
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.$disconnect();
    vi.restoreAllMocks();
  });

  describe('POST /api/shipments/scan-mobile', () => {
    it('creates a placeholder shipment if tracking fails or is unavailable', async () => {
      // Mock OCR to return a controlled parsing payload
      vi.spyOn(ocrSvc, 'extractShipmentFromImage').mockResolvedValue({
        success: true,
        awb: 'SCAN_TEST_FAIL_' + Date.now(),
        weight: 1.2
      });

      const payload = {
        awb: 'SCAN_TEST_FAIL_' + Date.now(),
        imageBase64: 'data:image/jpeg;base64,dummy',
        imageUri: null,
        ocrHints: {
          rawText: "Random OCR text 123",
          weight: 1.2
        }
      };

      const res = await request(app)
        .post('/api/shipments/scan-mobile')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.awb).toBe(payload.awb);
      expect(res.body.data.weight).toBe(1.2);
    });

    it('assigns client automatically via fuzzy matching of trained alias', async () => {
      vi.spyOn(ocrSvc, 'extractShipmentFromImage').mockResolvedValue({
        success: true,
        awb: 'SCAN_TEST_FUZZY_' + Date.now(),
        senderCompany: 'TECSIDEL INDIA P LTD',
        consignee: 'Random Buyer',
        weight: 3.5
      });

      const payload = {
        awb: 'SCAN_TEST_FUZZY_' + Date.now(),
        imageBase64: 'data:image/jpeg;base64,dummy',
        imageUri: null,
        ocrHints: {
          rawText: "TECSIDEL INDIA P LTD some text here",
          consignee: "Random Buyer",
          weight: 3.5
        }
      };

      const res = await request(app)
        .post('/api/shipments/scan-mobile')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      // Should match alias 'TECSIDEL INDIA P LTD' -> 'TECSIDEL'
      // Should map 'TECSIDEL INDIA P LTD' -> 'TECSIDEL'
      expect(res.body.data.clientCode).toBe('TECSIDEL');
      
      // Check database update
      const dbRecord = await prisma.shipment.findUnique({ where: { awb: payload.awb } });
      expect(dbRecord.clientCode).toBe('TECSIDEL');
      expect(dbRecord.weight).toBe(3.5);
    });

    it('keeps Trackon-format AWBs on the Trackon courier path', async () => {
      vi.spyOn(ocrSvc, 'extractShipmentFromImage').mockResolvedValue({
        success: true,
        awb: '500602752638',
        destination: 'Delhi',
        weight: 2.1,
      });

      const payload = {
        awb: '500602752638',
        imageBase64: 'data:image/jpeg;base64,dummy',
        imageUri: null,
        ocrHints: {
          rawText: 'Trackon label 500602752638',
          destination: 'Delhi',
          weight: 2.1,
        }
      };

      const res = await request(app)
        .post('/api/shipments/scan-mobile')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.awb).toBe(payload.awb);
      expect(res.body.data.courier).toBe('Trackon');
    });

    it('handles an empty OCR payload elegantly', async () => {
      // Mock failure or unreadable image
      vi.spyOn(ocrSvc, 'extractShipmentFromImage').mockResolvedValue({
        success: false,
        error: 'Unreadable barcode'
      });

      const payload = {
        awb: 'SCAN_TEST_EMPTY_' + Date.now(),
        imageBase64: 'data:image/jpeg;base64,dummy',
        ocrHints: null
      };

      const res = await request(app)
        .post('/api/shipments/scan-mobile')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.awb).toBe(payload.awb);
      // Defaults to MISC empty state
      expect(res.body.data.clientCode).toBe('MISC'); 
    });

    it('prefills structured fields from import ledger data when OCR fails', async () => {
      const awb = `SCAN_TEST_IMPORT_${Date.now()}`;
      await prisma.shipmentImportRow.create({
        data: {
          batchKey: `BATCH-${Date.now()}`,
          date: '2026-04-18',
          clientCode: 'IMPORTCL',
          awb,
          consignee: 'Ravi Kumar',
          destination: 'Ludhiana',
          phone: '9999999999',
          pincode: '141001',
          weight: 2.4,
          amount: 180,
          courier: 'DTDC',
          department: 'Operations',
          service: 'Standard',
          status: 'Booked',
          remarks: 'Imported from manifest',
        },
      });

      vi.spyOn(ocrSvc, 'extractShipmentFromImage').mockResolvedValue({
        success: false,
        error: 'Unreadable barcode',
      });

      const res = await request(app)
        .post('/api/shipments/scan-mobile')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          awb,
          imageBase64: 'data:image/jpeg;base64,dummy',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.awb).toBe(awb);
      expect(res.body.data.clientCode).toBe('IMPORTCL');
      expect(res.body.data.clientName).toBe('Import Ledger Client');
      expect(res.body.data.consignee).toBe('Ravi Kumar');
      expect(res.body.data.destination).toBe('Ludhiana');
      expect(res.body.data.pincode).toBe('141001');
      expect(res.body.data.weight).toBe(2.4);

      const saved = await prisma.shipment.findUnique({ where: { awb } });
      expect(saved.clientCode).toBe('IMPORTCL');
      expect(saved.consignee).toBe('RAVI KUMAR');
      expect(saved.destination).toBe('LUDHIANA');
      expect(saved.pincode).toBe('141001');
      expect(saved.weight).toBe(2.4);
    });

    it('skips photo capture when lookup data is already complete', async () => {
      const awb = `SCAN_TEST_LOOKUP_${Date.now()}`;
      await prisma.shipmentImportRow.create({
        data: {
          batchKey: `BATCH-${Date.now()}`,
          date: '2026-04-18',
          clientCode: 'IMPORTCL',
          awb,
          consignee: 'Lookup Ready',
          destination: 'Jaipur',
          phone: '9999999999',
          pincode: '302001',
          weight: 1.8,
          amount: 220,
          courier: 'Trackon',
          department: 'Operations',
          service: 'Standard',
          status: 'Booked',
          remarks: 'Complete lookup record',
        },
      });

      const res = await request(app)
        .post('/api/shipments/scan-mobile')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          awb,
          sessionContext: { sessionDate: '2026-04-18' },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.awb).toBe(awb);
      expect(res.body.data.requiresImageCapture).toBe(false);
      expect(res.body.data.consignee).toBe('Lookup Ready');
      expect(res.body.data.destination).toBe('Jaipur');
      expect(res.body.data.pincode).toBe('302001');
    });

    it('requests photo capture when lookup data is incomplete', async () => {
      const awb = `SCAN_TEST_NEEDS_PHOTO_${Date.now()}`;

      const res = await request(app)
        .post('/api/shipments/scan-mobile')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ awb });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.awb).toBe(awb);
      expect(res.body.data.status).toBe('photo_required');
      expect(res.body.data.requiresImageCapture).toBe(true);
      expect(Array.isArray(res.body.data.missingFields)).toBe(true);
      expect(res.body.data.missingFields.length).toBeGreaterThan(0);
    });

    it('updates an existing imported shipment instead of creating a second shipment', async () => {
      const awb = `SCAN_TEST_EXISTING_${Date.now()}`;
      const existing = await prisma.shipment.create({
        data: {
          awb,
          date: '2026-04-17',
          clientCode: 'IMPORTCL',
          consignee: 'UNKNOWN',
          destination: 'UNKNOWN',
          weight: 0.5,
          amount: 0,
          courier: 'Trackon',
          department: 'Operations',
          service: 'Standard',
          status: 'Booked',
          remarks: 'SCAN_CAPTURED: Intake awaiting tracking sync',
        },
      });

      await prisma.shipmentImportRow.create({
        data: {
          batchKey: `BATCH-${Date.now()}`,
          date: '2026-04-17',
          clientCode: 'IMPORTCL',
          awb,
          consignee: 'Merged Receiver',
          destination: 'Amritsar',
          phone: '9810012345',
          pincode: '143001',
          weight: 3.1,
          amount: 245,
          courier: 'Trackon',
          department: 'Operations',
          service: 'Standard',
          status: 'Booked',
          remarks: 'Imported before scan',
        },
      });

      const res = await request(app)
        .post('/api/shipments/scan-mobile')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          awb,
          sessionContext: { sessionDate: '2026-04-21' },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.shipmentId).toBe(existing.id);
      expect(res.body.data.consignee).toBe('Merged Receiver');
      expect(res.body.data.destination).toBe('Amritsar');
      expect(res.body.data.weight).toBe(3.1);

      const shipments = await prisma.shipment.findMany({ where: { awb } });
      expect(shipments).toHaveLength(1);
      expect(shipments[0].id).toBe(existing.id);
      expect(shipments[0].consignee).toBe('MERGED RECEIVER');
      expect(shipments[0].destination).toBe('AMRITSAR');
      expect(shipments[0].pincode).toBe('143001');
      expect(shipments[0].weight).toBe(3.1);
      expect([0, 245]).toContain(Number(shipments[0].amount)); // scan may or may not update amount
      expect(shipments[0].date).toBe('2026-04-17'); // scan preserves original intake/import date
    });

    it('matches imported AWBs even when the scan comes in lowercase or mixed case', async () => {
      const awb = `SCAN_TEST_CASE_${Date.now()}`;
      const lowercaseAwb = awb.toLowerCase();

      await prisma.shipmentImportRow.create({
        data: {
          batchKey: `BATCH-${Date.now()}`,
          date: '2026-04-18',
          clientCode: 'IMPORTCL',
          awb,
          consignee: 'Case Match',
          destination: 'Chandigarh',
          phone: '9999991111',
          pincode: '160017',
          weight: 1.4,
          amount: 120,
          courier: 'DTDC',
          department: 'Operations',
          service: 'Standard',
          status: 'Booked',
          remarks: 'Mixed-case lookup test',
        },
      });

      const res = await request(app)
        .post('/api/shipments/scan-mobile')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ awb: lowercaseAwb });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.awb).toBe(awb);
      expect(res.body.data.clientCode).toBe('IMPORTCL');
      expect(res.body.data.consignee).toBe('Case Match');
    });
  });

  describe('scanner route access and client-safe shipment detail', () => {
    it('blocks client accounts from staff shipment routes', async () => {
      const awb = `SCAN_TEST_PORTAL_LOCK_${Date.now()}`;
      const shipment = await prisma.shipment.create({
        data: {
          awb,
          date: '2026-04-21',
          clientCode: 'IMPORTCL',
          consignee: 'Portal Receiver',
          destination: 'Mumbai',
          pincode: '400001',
          weight: 5.2,
          amount: 999,
          courier: 'Delhivery',
          department: 'Operations',
          service: 'Express',
          status: 'Booked',
          remarks: 'Portal lock test',
        },
      });

      const blocked = await request(app)
        .get(`/api/shipments/${shipment.id}`)
        .set('Authorization', `Bearer ${clientJwtToken}`);

      expect(blocked.status).toBe(403);
      expect(blocked.body.success).toBe(false);

      const allowed = await request(app)
        .get(`/api/portal/shipments/${shipment.id}`)
        .set('Authorization', `Bearer ${clientJwtToken}`);

      expect(allowed.status).toBe(200);
      expect(allowed.body.success).toBe(true);
      expect(allowed.body.data.awb).toBe(awb);
      expect(allowed.body.data.amount).toBeUndefined();
      expect(allowed.body.data.weight).toBeUndefined();
      expect(Array.isArray(allowed.body.data.trackingEvents)).toBe(true);
    });
  });
});
