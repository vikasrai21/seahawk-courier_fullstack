// C:\Users\hp\OneDrive\Desktop\seahawk-full_stack\backend\src\tests\unit\otpService.test.js
'use strict';

const mockEmailService = {
  isConfigured: vi.fn().mockReturnValue(true),
  sendGeneral: vi.fn().mockResolvedValue({ success: true }),
  sendLoginOTP: vi.fn().mockResolvedValue(true),
};

// Manual cache injection for email.service
const emailServicePath = require.resolve('../../services/email.service');
require.cache[emailServicePath] = {
  id: emailServicePath,
  filename: emailServicePath,
  loaded: true,
  exports: mockEmailService,
};

const mockPrisma = require('../../config/__mocks__/prisma');

// Now require the service
const otpService = require('../../services/otp.service');

describe('otp.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const email = 'test@example.com';
  const userName = 'Test User';

  describe('sendLoginOTP', () => {
    it('falls back to console in non-production environments', async () => {
      process.env.NODE_ENV = 'development';
      mockPrisma.$executeRaw.mockResolvedValue(1);
      mockEmailService.isConfigured.mockReturnValue(false);
      
      const result = await otpService.sendLoginOTP(email, userName);
      expect(result.sent).toBe(true);
      expect(result.method).toBe('console');
    });

    it('invalidates existing OTPs and creates a new one via SMTP', async () => {
      process.env.NODE_ENV = 'production';
      process.env.EMAIL_USER = 'user';
      process.env.EMAIL_PASS = 'pass';
      mockPrisma.$executeRaw.mockResolvedValue(1);
      mockEmailService.isConfigured.mockReturnValue(true);
      
      const result = await otpService.sendLoginOTP(email, userName);
      
      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
      expect(mockEmailService.sendGeneral).toHaveBeenCalled();
      expect(result.sent).toBe(true);
      expect(result.method).toBe('email');
    });
  });

  describe('verifyOTP', () => {
    it('verifies correctly and marks as used', async () => {
      const mockOtpRecord = { 
        id: 1, 
        otp: '123456', 
        attempts: 0, 
        expires_at: new Date(Date.now() + 10000) 
      };
      mockPrisma.$queryRaw.mockResolvedValue([mockOtpRecord]);
      mockPrisma.$executeRaw.mockResolvedValue(1);

      const result = await otpService.verifyOTP(email, '123456');
      expect(result).toBe(true);
      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
    });

    it('rejects incorrect OTP', async () => {
      const mockOtpRecord = { 
        id: 1, 
        otp: '123456', 
        attempts: 0, 
        expires_at: new Date(Date.now() + 10000) 
      };
      mockPrisma.$queryRaw.mockResolvedValue([mockOtpRecord]);
      
      await expect(otpService.verifyOTP(email, '000000')).rejects.toThrow('Incorrect OTP');
    });

    it('rejects expired or missing OTP', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);
      await expect(otpService.verifyOTP(email, '123456')).rejects.toThrow('OTP expired or not found');
    });
  });
});
