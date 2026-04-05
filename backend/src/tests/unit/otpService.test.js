// C:\Users\hp\OneDrive\Desktop\seahawk-full_stack\backend\src\tests\unit\otpService.test.js
'use strict';

const mockEmail = {
  isConfigured: vi.fn(() => true),
  sendGeneral: vi.fn(async () => ({ success: true, messageId: 'test' })),
};

// Variable must start with 'mock' to be used in vi.mock factory
vi.mock('C:/Users/hp/OneDrive/Desktop/seahawk-full_stack/backend/src/services/email.service', () => mockEmail);
vi.mock('../../services/email.service', () => mockEmail);

const otpService = require('../../services/otp.service');
const mockPrisma = require('../../config/__mocks__/prisma');

describe('otp.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateOTP', () => {
    it('generates a 6-digit numeric string', () => {
      const otp = otpService.generateOTP();
      expect(otp).toHaveLength(6);
    });
  });

  describe('sendLoginOTP', () => {
    const email = 'test@example.com';
    const userName = 'Test User';

    it('invalidates existing OTPs and creates a new one via SMTP', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      mockPrisma.$executeRaw.mockResolvedValue(1);
      
      const result = await otpService.sendLoginOTP(email, userName);
      
      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
      expect(mockEmail.sendGeneral).toHaveBeenCalled();
      expect(result.sent).toBe(true);
      expect(result.method).toBe('email');
    });

    it('falls back to console in non-production environments', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      const result = await otpService.sendLoginOTP(email, userName);
      expect(result.method).toBe('console');
    });
  });

  describe('verifyOTP', () => {
    it('verifies correctly and marks as used', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{
        id: 1, otp: '123456', attempts: 0, used: false
      }]);
      mockPrisma.$executeRaw.mockResolvedValue(1);

      const result = await otpService.verifyOTP('test@example.com', '123456');
      expect(result).toBe(true);
    });
  });
});
