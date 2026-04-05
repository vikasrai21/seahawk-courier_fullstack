import { describe, expect, it } from 'vitest';
import { detectCourier, getCourierInfo } from '../../utils/awbDetect.js';

describe('awbDetect', () => {
  it('detects known courier formats', () => {
    expect(detectCourier('Z65539608')).toMatchObject({ courier: 'DTDC', confidence: 'high' });
    expect(detectCourier('20912345678')).toMatchObject({ courier: 'BLUEDART', confidence: 'high' });
    expect(detectCourier('29912345678901')).toMatchObject({ courier: 'DELHIVERY', confidence: 'high' });
    expect(detectCourier('JD014600006838363771')).toMatchObject({ courier: 'DHL', confidence: 'high' });
    expect(detectCourier('100123456789')).toMatchObject({ courier: 'TRACKON', confidence: 'high' });
    expect(detectCourier('200040123456')).toMatchObject({ courier: 'PRIMETRACK', confidence: 'high' });
  });

  it('flags ambiguous and unknown AWBs safely', () => {
    expect(detectCourier('200123456789')).toMatchObject({ courier: 'PRIMETRACK_OR_TRACKON', tryBoth: true });
    expect(detectCourier('abc-123')).toMatchObject({ courier: 'UNKNOWN', confidence: 'low' });
    expect(detectCourier('')).toBeNull();
  });

  it('returns courier display metadata with a sensible fallback', () => {
    expect(getCourierInfo('DTDC')).toMatchObject({ name: 'DTDC', trackUrl: expect.stringContaining('dtdc') });
    expect(getCourierInfo('UNKNOWN')).toMatchObject({ name: 'Unknown', trackUrl: null });
    expect(getCourierInfo('NOT_REAL')).toMatchObject({ name: 'Unknown', trackUrl: null });
  });
});
