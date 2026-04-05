import { describe, it, expect } from 'vitest';

const rateLimiter = await import('../../middleware/rateLimiter.js');

describe('rateLimiter', () => {
  it('exports loginLimiter middleware', () => {
    expect(rateLimiter.loginLimiter).toBeDefined();
    expect(typeof rateLimiter.loginLimiter).toBe('function');
  });

  it('exports apiLimiter middleware', () => {
    expect(rateLimiter.apiLimiter).toBeDefined();
    expect(typeof rateLimiter.apiLimiter).toBe('function');
  });

  it('exports sensitiveActionLimiter middleware', () => {
    expect(rateLimiter.sensitiveActionLimiter).toBeDefined();
    expect(typeof rateLimiter.sensitiveActionLimiter).toBe('function');
  });

  it('exports publicTrackingLimiter middleware', () => {
    expect(rateLimiter.publicTrackingLimiter).toBeDefined();
    expect(typeof rateLimiter.publicTrackingLimiter).toBe('function');
  });
});
