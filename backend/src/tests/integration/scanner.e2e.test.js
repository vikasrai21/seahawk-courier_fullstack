const request = require('supertest');
const app = require('../../app');
const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');
const ocrSvc = require('../../services/ocr.service');

describe('Scanner API Integration Tests', () => {
  let jwtToken;
  const testUser = {
    name: 'Scanner E2E Admin',
    email: 'scanner-e2e-unique@seahawkcourier.in',
    password: 'AdminPass123!',
    role: 'ADMIN',
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

    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    jwtToken = loginRes.body.data.accessToken;
  }, 30000);

  afterAll(async () => {
    await prisma.shipment.deleteMany({ where: { awb: { startsWith: 'SCAN_TEST' } } });
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
  });
});
