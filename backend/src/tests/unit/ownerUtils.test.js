import { afterEach, describe, expect, it, vi } from 'vitest';

describe('isOwnerUser', () => {
  const oldEnv = { ...process.env };

  afterEach(() => {
    vi.resetModules();
    process.env = { ...oldEnv };
  });

  it('returns true for user with concrete OWNER role (no env needed)', async () => {
    const { isOwnerUser } = await import('../../utils/owner');
    expect(isOwnerUser({ role: 'OWNER', email: 'anyone@anywhere.com' })).toBe(true);
  });

  it('returns false for ADMIN role (ADMIN is not automatically an owner)', async () => {
    process.env.OWNER_EMAILS = 'ownerme@seahawk.com';
    const { isOwnerUser } = await import('../../utils/owner');
    expect(isOwnerUser({ role: 'ADMIN', email: 'admin@other.com' })).toBe(false);
  });

  it('returns true for email-whitelisted user (backward compat)', async () => {
    process.env.OWNER_EMAILS = 'legacy@seahawk.com';
    const { isOwnerUser } = await import('../../utils/owner');
    expect(isOwnerUser({ role: 'ADMIN', email: 'LEGACY@SEAHAWK.COM' })).toBe(true);
  });

  it('returns true for string email that is whitelisted', async () => {
    process.env.OWNER_EMAILS = 'ownerme@seahawk.com';
    const { isOwnerUser } = await import('../../utils/owner');
    expect(isOwnerUser('ownerme@seahawk.com')).toBe(true);
  });

  it('returns false for user with no role and non-whitelisted email', async () => {
    process.env.OWNER_EMAILS = 'ownerme@seahawk.com';
    const { isOwnerUser } = await import('../../utils/owner');
    expect(isOwnerUser({ role: 'STAFF', email: 'staff@seahawk.com' })).toBe(false);
  });

  it('returns false for null input', async () => {
    const { isOwnerUser } = await import('../../utils/owner');
    expect(isOwnerUser(null)).toBe(false);
  });

  it('returns false for undefined input', async () => {
    const { isOwnerUser } = await import('../../utils/owner');
    expect(isOwnerUser(undefined)).toBe(false);
  });
});

describe('getOwnerEmails', () => {
  const oldEnv = { ...process.env };

  afterEach(() => {
    vi.resetModules();
    process.env = { ...oldEnv };
  });

  it('normalizes and splits comma-separated OWNER_EMAILS', async () => {
    process.env.OWNER_EMAILS = ' Owner@One.com , second@two.com ';
    const { getOwnerEmails } = await import('../../utils/owner');
    expect(getOwnerEmails()).toEqual(['owner@one.com', 'second@two.com']);
  });

  it('falls back to OWNER_EMAIL (singular) when OWNER_EMAILS not set', async () => {
    delete process.env.OWNER_EMAILS;
    process.env.OWNER_EMAIL = 'single@seahawk.com';
    const { getOwnerEmails } = await import('../../utils/owner');
    expect(getOwnerEmails()).toEqual(['single@seahawk.com']);
  });

  it('falls back to DEFAULT_OWNER_EMAIL when neither env var set', async () => {
    delete process.env.OWNER_EMAILS;
    delete process.env.OWNER_EMAIL;
    const { getOwnerEmails, DEFAULT_OWNER_EMAIL } = await import('../../utils/owner');
    expect(getOwnerEmails()).toContain(DEFAULT_OWNER_EMAIL);
  });
});

describe('bootstrap-guard', () => {
  const oldEnv = { ...process.env };

  afterEach(() => {
    vi.resetModules();
    process.env = { ...oldEnv };
  });

  it('blocks production bootstrap unless explicitly allowed', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ALLOW_PROD_BOOTSTRAP;
    const { assertSafeBootstrap } = await import('../../utils/bootstrap-guard');
    expect(() => assertSafeBootstrap('bootstrap-users')).toThrow('bootstrap-users is blocked in production');
  });

  it('allows bootstrap in development', async () => {
    process.env.NODE_ENV = 'development';
    process.env.SHOW_BOOTSTRAP_PASSWORDS = 'true';
    const { assertSafeBootstrap, isTrue } = await import('../../utils/bootstrap-guard');
    expect(isTrue('TRUE')).toBe(true);
    expect(assertSafeBootstrap('bootstrap-owner')).toEqual({ showPasswords: true });
  });
});
