import { beforeEach, describe, expect, it } from 'vitest';
import { createRequire } from 'module';

const requireModule = createRequire(import.meta.url);
const scannerQuality = requireModule('../../services/scannerQuality.service.js');

describe('scannerQuality.service', () => {
  beforeEach(() => {
    scannerQuality.resetScannerQuality();
  });

  it('aggregates scan quality metrics with SLA status', () => {
    scannerQuality.recordScanEvent({
      pin: '111111',
      source: 'mobile_scanner_fast',
      scanMode: 'fast_barcode_only',
      courier: 'Trackon',
      deviceProfile: 'phone-camera',
      awb: '500602752638',
      lockedAwb: '500602752638',
      awbSource: 'barcode',
      success: true,
      hadImage: false,
      reviewRequired: false,
      lockTimeMs: 320,
      totalMs: 420,
    });
    scannerQuality.recordScanEvent({
      pin: '111111',
      source: 'mobile_scanner_ocr',
      scanMode: 'ocr_label',
      courier: 'BlueDart',
      deviceProfile: 'rugged-scanner',
      awb: '123456789012',
      lockedAwb: '123456789111',
      awbSource: 'ocr_context',
      falseLock: true,
      success: true,
      hadImage: true,
      reviewRequired: true,
      totalMs: 6400,
      ocrLatencyMs: 6100,
      lockTimeMs: 980,
      qualityIssues: ['glare'],
    });

    const snapshot = scannerQuality.getScannerQualitySnapshot({ windowMinutes: 60 });
    expect(snapshot.sampleSize).toBe(2);
    expect(snapshot.summary.awbExtractionRatePct).toBe(100);
    expect(snapshot.summary.barcodeFirstPassRatePct).toBeGreaterThan(0);
    expect(snapshot.summary.falseLockRatePct).toBeGreaterThan(0);
    expect(snapshot.summary.lockMs.p95).toBeGreaterThan(0);
    expect(snapshot.byCourier.length).toBe(2);
    expect(snapshot.byDeviceProfile.find((row) => row.deviceProfile === 'phone-camera')?.total).toBe(1);
    expect(snapshot.slaStatus).toHaveProperty('barcodeFirstPass');
    expect(snapshot.slaStatus).toHaveProperty('lockLatencyP95');
    expect(snapshot.slaStatus).toHaveProperty('falseLock');
  });

  it('tracks correction signal events', () => {
    scannerQuality.recordCorrectionEvent({
      pin: '222222',
      deviceProfile: 'phone-camera',
      courier: 'DTDC',
      changedFields: 2,
      savedCorrections: 1,
    });

    const snapshot = scannerQuality.getScannerQualitySnapshot({ windowMinutes: 60 });
    expect(snapshot.correctionLoop.totalEvents).toBe(1);
    expect(snapshot.correctionLoop.savedCorrectionsAvg).toBeGreaterThan(0);
    expect(snapshot.slaStatus).toHaveProperty('correctionSignal');
  });
});

