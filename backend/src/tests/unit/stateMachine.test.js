import { describe, it, expect } from 'vitest';
import { assertValidTransition, getValidTransitions, shouldRefund, shouldNotify, isTerminal } from '../../services/stateMachine.js';

describe('State Machine', () => {
  it('allows valid transition: Booked → Picked Up', () => {
    expect(() => assertValidTransition('Booked', 'Picked Up')).not.toThrow();
  });

  it('allows valid transition: In Transit → Out for Delivery', () => {
    expect(() => assertValidTransition('In Transit', 'Out for Delivery')).not.toThrow();
  });

  it('blocks invalid transition: Booked → Delivered', () => {
    expect(() => assertValidTransition('Booked', 'Delivered')).toThrow();
  });

  it('blocks invalid transition: Delivered → In Transit', () => {
    expect(() => assertValidTransition('Delivered', 'In Transit')).toThrow();
  });

  it('allows same status (idempotent)', () => {
    expect(() => assertValidTransition('In Transit', 'In Transit')).not.toThrow();
  });

  it('Delivered is terminal', () => {
    expect(isTerminal('Delivered')).toBe(true);
    expect(getValidTransitions('Delivered')).toHaveLength(0);
  });

  it('Cancelled is terminal', () => {
    expect(isTerminal('Cancelled')).toBe(true);
  });

  it('Booked is not terminal', () => {
    expect(isTerminal('Booked')).toBe(false);
  });

  it('triggers refund on Cancelled', () => {
    expect(shouldRefund('Cancelled')).toBe(true);
  });

  it('triggers refund on RTO', () => {
    expect(shouldRefund('RTO')).toBe(true);
  });

  it('does not trigger refund on Delivered', () => {
    expect(shouldRefund('Delivered')).toBe(false);
  });

  it('triggers notification on Out for Delivery', () => {
    expect(shouldNotify('Out for Delivery')).toBe(true);
  });

  it('triggers notification on Delivered', () => {
    expect(shouldNotify('Delivered')).toBe(true);
  });

  it('getValidTransitions returns correct options for Booked', () => {
    const t = getValidTransitions('Booked');
    expect(t).toContain('Picked Up');
    expect(t).toContain('Cancelled');
    expect(t).not.toContain('Delivered');
  });
});
