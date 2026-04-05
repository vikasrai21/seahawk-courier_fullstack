import { afterEach, describe, expect, it } from 'vitest';

describe('owner and bootstrap helpers', () => {
  const oldEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...oldEnv };
  });

  it('getOwnerEmails normalizes and splits configured emails', async () => {
    process.env.OWNER_EMAILS = ' Owner@One.com , second@two.com ';
    const { getOwnerEmails, isOwnerUser } = await import('../../utils/owner');

    expect(getOwnerEmails()).toEqual(['owner@one.com', 'second@two.com']);
    expect(isOwnerUser({ email: 'SECOND@TWO.COM' })).toBe(true);
    expect(isOwnerUser('missing@example.com')).toBe(false);
  });

  it('assertSafeBootstrap blocks production unless explicitly allowed', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ALLOW_PROD_BOOTSTRAP;
    const { assertSafeBootstrap } = await import('../../utils/bootstrap-guard');

    expect(() => assertSafeBootstrap('bootstrap-users')).toThrow('bootstrap-users is blocked in production');
  });

  it('assertSafeBootstrap returns visibility flags when allowed', async () => {
    process.env.NODE_ENV = 'development';
    process.env.SHOW_BOOTSTRAP_PASSWORDS = 'true';
    const { assertSafeBootstrap, isTrue } = await import('../../utils/bootstrap-guard');

    expect(isTrue('TRUE')).toBe(true);
    expect(assertSafeBootstrap('bootstrap-owner')).toEqual({ showPasswords: true });
  });
});
