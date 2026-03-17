import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock prisma
const mockUser = {
  id: 1, email: 'admin@seahawk.com',
  password: '', role: 'ADMIN', active: true,
};

vi.mock('../../config/prisma', () => ({
  default: {
    user: {
      findUnique:  vi.fn(),
      findFirst:   vi.fn(),
      create:      vi.fn(),
      update:      vi.fn(),
    },
    $disconnect: vi.fn(),
  },
}));

describe('Auth service', () => {
  it('bcrypt hashes password correctly', async () => {
    const hash = await bcrypt.hash('testpassword', 10);
    const valid = await bcrypt.compare('testpassword', hash);
    expect(valid).toBe(true);
  });

  it('wrong password fails comparison', async () => {
    const hash = await bcrypt.hash('correctpassword', 10);
    const valid = await bcrypt.compare('wrongpassword', hash);
    expect(valid).toBe(false);
  });

  it('JWT signs and verifies correctly', () => {
    const secret  = 'test-secret-32-chars-minimum-here';
    const payload = { id: 1, email: 'test@test.com', role: 'ADMIN' };
    const token   = jwt.sign(payload, secret, { expiresIn: '1h' });
    const decoded = jwt.verify(token, secret);
    expect(decoded.id).toBe(1);
    expect(decoded.role).toBe('ADMIN');
  });

  it('expired JWT throws error', () => {
    const secret = 'test-secret-32-chars-minimum-here';
    const token  = jwt.sign({ id: 1 }, secret, { expiresIn: '0s' });
    expect(() => jwt.verify(token, secret)).toThrow();
  });
});
