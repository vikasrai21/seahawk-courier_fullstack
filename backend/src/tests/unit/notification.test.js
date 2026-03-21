// src/tests/unit/notification.test.js
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/index', () => ({
  default: {
    email: { host: null, user: null, from: 'test@test.com', port: 587 },
    whatsapp: { token: null, phoneId: null },
  },
}));
vi.mock('../../config/prisma', () => ({ default: { notification: { create: vi.fn() } } }));

describe('notification.service', () => {
  it('sendWhatsApp skips when token not configured', async () => {
    const { sendWhatsApp } = await import('../../services/notification.service.js');
    // Should not throw even when not configured
    await expect(sendWhatsApp('9999999999', 'test message')).resolves.not.toThrow();
  });

  it('sendEmail skips when SMTP not configured', async () => {
    const { sendEmail } = await import('../../services/notification.service.js');
    await expect(sendEmail({ to: 'a@b.com', subject: 'Test', text: 'Hi' })).resolves.not.toThrow();
  });
});
