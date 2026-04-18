import { describe, expect, it } from 'vitest';
import {
  evaluateBarcodeStability,
  nextBarcodeFallbackState,
} from '@/utils/scannerStateMachine.js';

describe('evaluateBarcodeStability', () => {
  it('locks only after required stable hits inside the window', () => {
    let result = evaluateBarcodeStability({
      samples: [],
      awb: '500602752638',
      now: 1_000,
      stabilityWindowMs: 1_100,
      requiredHits: 3,
    });
    expect(result.isStable).toBe(false);
    expect(result.hits).toBe(1);

    result = evaluateBarcodeStability({
      samples: result.samples,
      awb: '500602752638',
      now: 1_300,
      stabilityWindowMs: 1_100,
      requiredHits: 3,
    });
    expect(result.isStable).toBe(false);
    expect(result.hits).toBe(2);

    result = evaluateBarcodeStability({
      samples: result.samples,
      awb: '500602752638',
      now: 1_700,
      stabilityWindowMs: 1_100,
      requiredHits: 3,
    });
    expect(result.isStable).toBe(true);
    expect(result.hits).toBe(3);
  });

  it('drops stale reads before counting hits', () => {
    const staleSamples = [
      { awb: '500602752638', at: 100 },
      { awb: '500602752638', at: 200 },
    ];
    const result = evaluateBarcodeStability({
      samples: staleSamples,
      awb: '500602752638',
      now: 2_000,
      stabilityWindowMs: 1_000,
      requiredHits: 2,
    });

    expect(result.hits).toBe(1);
    expect(result.isStable).toBe(false);
    expect(result.samples).toHaveLength(1);
  });

  it('ignores empty values without mutating stability to true', () => {
    const result = evaluateBarcodeStability({
      samples: [{ awb: 'Z65539608', at: 1_000 }],
      awb: '',
      now: 1_100,
      stabilityWindowMs: 1_100,
      requiredHits: 2,
    });
    expect(result.isStable).toBe(false);
    expect(result.hits).toBe(0);
    expect(result.samples).toHaveLength(1);
  });
});

describe('nextBarcodeFallbackState', () => {
  it('returns reframe action until retry limit is reached', () => {
    expect(
      nextBarcodeFallbackState({
        currentAttempts: 0,
        maxReframeAttempts: 2,
      })
    ).toEqual({ action: 'reframe', attempts: 1 });

    expect(
      nextBarcodeFallbackState({
        currentAttempts: 1,
        maxReframeAttempts: 2,
      })
    ).toEqual({ action: 'reframe', attempts: 2 });
  });

  it('switches to document mode after retries are exhausted', () => {
    expect(
      nextBarcodeFallbackState({
        currentAttempts: 2,
        maxReframeAttempts: 2,
      })
    ).toEqual({ action: 'switch_to_document', attempts: 2 });
  });
});

