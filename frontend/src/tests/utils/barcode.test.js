import { describe, it, expect } from 'vitest';
import { normalizeBarcodeCandidate, rankBarcodeCandidates } from '@/utils/barcode.js';

describe('normalizeBarcodeCandidate', () => {
  it('normalizes Trackon ITF decodes with a leading zero artifact', () => {
    expect(normalizeBarcodeCandidate('0500602752638')).toBe('500602752638');
  });

  it('extracts a Trackon AWB from noisy decoder text', () => {
    expect(normalizeBarcodeCandidate('RAW: 500602752638 format=itf')).toBe('500602752638');
  });

  it('preserves DTDC style alphanumeric AWBs', () => {
    expect(normalizeBarcodeCandidate(' Z65539608 ')).toBe('Z65539608');
  });

  it('prefers AWB from QR URL payload', () => {
    expect(normalizeBarcodeCandidate('https://x.example/track?awbNo=500602752638&foo=bar')).toBe('500602752638');
  });

  it('ranks candidates across multiple detections and exposes ambiguity', () => {
    const ranked = rankBarcodeCandidates(
      ['awb=500602752638', '500602752638', '123456789012'],
      { courierHint: 'Trackon' }
    );
    expect(ranked.awb).toBe('500602752638');
    expect(ranked.ambiguous).toBe(false);
    expect(ranked.ranked.length).toBeGreaterThan(1);
  });
});
