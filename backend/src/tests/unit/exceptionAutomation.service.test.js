import { describe, it, expect } from 'vitest';
import {
  computeSlaContext,
  computeNdrUrgency,
} from '../../services/exceptionAutomation.service.js';

describe('exceptionAutomation.service', () => {
  it('flags SLA breach for overdue standard shipments', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 7);
    const result = computeSlaContext({
      date: oldDate.toISOString().slice(0, 10),
      service: 'Standard',
    });
    expect(result.breach).toBe(true);
    expect(result.breachHours).toBeGreaterThan(0);
  });

  it('marks urgency as critical for stale/high-attempt NDR', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 3);
    const urgency = computeNdrUrgency({
      action: 'PENDING',
      attemptNo: 3,
      createdAt: oldDate,
    });
    expect(urgency.severity).toBe('critical');
    expect(urgency.shouldEscalate).toBe(true);
  });
});

