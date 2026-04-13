import { describe, it, expect } from 'vitest';
import { normalizeBarcodeCandidate } from '@/utils/barcode.js';

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
});
