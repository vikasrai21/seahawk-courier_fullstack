'use strict';

const DEFAULT_WINDOW_MINUTES = 240;
const MAX_SCAN_EVENTS = Math.max(500, Number.parseInt(process.env.SCANNER_QUALITY_MAX_EVENTS || '4000', 10) || 4000);
const MAX_CORRECTION_EVENTS = Math.max(200, Number.parseInt(process.env.SCANNER_QUALITY_MAX_CORRECTION_EVENTS || '2000', 10) || 2000);

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getSlaTargets() {
  return {
    barcodeFirstPassRatePct: toNumber(process.env.SCANNER_SLA_BARCODE_FIRST_PASS_PCT, 92),
    awbExtractionRatePct: toNumber(process.env.SCANNER_SLA_AWB_EXTRACTION_PCT, 97),
    ocrFallbackRateMaxPct: toNumber(process.env.SCANNER_SLA_OCR_FALLBACK_MAX_PCT, 15),
    falseLockRateMaxPct: toNumber(process.env.SCANNER_SLA_FALSE_LOCK_MAX_PCT, 1),
    p95LockMs: toNumber(process.env.SCANNER_SLA_LOCK_P95_MS, 800),
    p95FastScanMs: toNumber(process.env.SCANNER_SLA_FAST_P95_MS, 1200),
    p95OcrScanMs: toNumber(process.env.SCANNER_SLA_OCR_P95_MS, 20000),
    correctionSignalMin: toNumber(process.env.SCANNER_SLA_CORRECTION_SIGNAL_MIN, 1),
  };
}

const scannerState = {
  startedAt: Date.now(),
  scanEvents: [],
  correctionEvents: [],
};

const BARCODE_SOURCES = new Set(['fast_input', 'barcode', 'barcode_qr_url', 'barcode_context', 'barcode_alnum', 'known_awb']);

function pct(part, total) {
  if (!total) return 0;
  return Number(((part / total) * 100).toFixed(2));
}

function p95(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
  return Number(sorted[index].toFixed(2));
}

function avg(values) {
  if (!values.length) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

function normalizeText(value, fallback = 'unknown') {
  const out = String(value || '').trim();
  return out || fallback;
}

function normalizeNumber(value, fallback = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function normalizeIssueList(issues) {
  if (!Array.isArray(issues)) return [];
  return issues
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);
}

function classifyScanEvent(input = {}) {
  const awb = String(input.awb || '').trim().toUpperCase();
  const awbSource = String(input.awbSource || '').trim().toLowerCase();
  const lockedAwb = String(input.lockedAwb || '').trim().toUpperCase();
  const totalMs = normalizeNumber(input.totalMs, null);
  const ocrLatencyMs = normalizeNumber(input.ocrLatencyMs, null);
  const lockTimeMs = normalizeNumber(input.lockTimeMs, null);
  const hadImage = Boolean(input.hadImage);
  const reviewRequired = Boolean(input.reviewRequired);
  const success = Boolean(input.success);
  const awbExtracted = Boolean(awb && awb.length >= 6);
  const barcodeFirstPass = awbExtracted && BARCODE_SOURCES.has(awbSource);
  const ocrFallback = awbExtracted && (hadImage || awbSource.startsWith('ocr'));
  const falseLock = Boolean(input.falseLock || (lockedAwb && awb && lockedAwb !== awb));

  return {
    at: Date.now(),
    pin: normalizeText(input.pin, ''),
    source: normalizeText(input.source, 'scanner'),
    scanMode: normalizeText(input.scanMode, 'unknown'),
    deviceProfile: normalizeText(input.deviceProfile, 'phone-camera'),
    courier: normalizeText(input.courier, 'unknown'),
    awb,
    lockedAwb,
    awbSource: awbSource || 'none',
    success,
    awbExtracted,
    barcodeFirstPass,
    ocrFallback,
    falseLock,
    hadImage,
    reviewRequired,
    totalMs,
    ocrLatencyMs,
    lockTimeMs,
    qualityIssues: normalizeIssueList(input.qualityIssues),
  };
}

function pushBounded(list, item, maxItems) {
  list.push(item);
  if (list.length > maxItems) {
    list.splice(0, list.length - maxItems);
  }
}

function summarize(events) {
  const total = events.length;
  const successes = events.filter((event) => event.success).length;
  const awbExtracted = events.filter((event) => event.awbExtracted).length;
  const barcodeFirstPass = events.filter((event) => event.barcodeFirstPass).length;
  const fallbackCount = events.filter((event) => event.ocrFallback).length;
  const falseLockCount = events.filter((event) => event.falseLock).length;
  const reviewRequiredCount = events.filter((event) => event.reviewRequired).length;
  const totalLatencies = events.map((event) => event.totalMs).filter((value) => Number.isFinite(value));
  const lockLatencies = events.map((event) => event.lockTimeMs).filter((value) => Number.isFinite(value));
  const fastLatencies = events
    .filter((event) => !event.hadImage || event.scanMode === 'fast_barcode_only')
    .map((event) => event.totalMs)
    .filter((value) => Number.isFinite(value));
  const ocrLatencies = events
    .filter((event) => event.hadImage || event.ocrFallback)
    .map((event) => event.totalMs)
    .filter((value) => Number.isFinite(value));

  return {
    total,
    successRatePct: pct(successes, total),
    awbExtractionRatePct: pct(awbExtracted, total),
    barcodeFirstPassRatePct: pct(barcodeFirstPass, total),
    ocrFallbackRatePct: pct(fallbackCount, total),
    falseLockRatePct: pct(falseLockCount, total),
    reviewRequiredRatePct: pct(reviewRequiredCount, total),
    latencyMs: {
      avg: avg(totalLatencies),
      p95: p95(totalLatencies),
      fastP95: p95(fastLatencies),
      ocrP95: p95(ocrLatencies),
    },
    lockMs: {
      samples: lockLatencies.length,
      avg: avg(lockLatencies),
      p95: p95(lockLatencies),
    },
  };
}

function summarizeBy(events, key) {
  const buckets = new Map();
  events.forEach((event) => {
    const bucket = normalizeText(event[key], 'unknown');
    if (!buckets.has(bucket)) buckets.set(bucket, []);
    buckets.get(bucket).push(event);
  });

  return [...buckets.entries()]
    .map(([bucket, rows]) => ({
      [key]: bucket,
      ...summarize(rows),
    }))
    .sort((a, b) => b.total - a.total);
}

function buildSlaStatus(summary, slaTargets) {
  const hasSamples = summary.total > 0;
  const hasLockSamples = summary?.lockMs?.samples > 0;
  return {
    barcodeFirstPass: hasSamples
      ? (summary.barcodeFirstPassRatePct >= slaTargets.barcodeFirstPassRatePct ? 'pass' : 'fail')
      : 'na',
    awbExtraction: hasSamples
      ? (summary.awbExtractionRatePct >= slaTargets.awbExtractionRatePct ? 'pass' : 'fail')
      : 'na',
    ocrFallback: hasSamples
      ? (summary.ocrFallbackRatePct <= slaTargets.ocrFallbackRateMaxPct ? 'pass' : 'fail')
      : 'na',
    falseLock: hasSamples
      ? (summary.falseLockRatePct <= slaTargets.falseLockRateMaxPct ? 'pass' : 'fail')
      : 'na',
    lockLatencyP95: hasLockSamples
      ? (summary.lockMs.p95 <= slaTargets.p95LockMs ? 'pass' : 'fail')
      : 'na',
    fastLatencyP95: hasSamples
      ? (summary.latencyMs.fastP95 <= slaTargets.p95FastScanMs ? 'pass' : 'fail')
      : 'na',
    ocrLatencyP95: hasSamples
      ? (summary.latencyMs.ocrP95 <= slaTargets.p95OcrScanMs ? 'pass' : 'fail')
      : 'na',
  };
}

function summarizeCorrectionEvents(events) {
  const total = events.length;
  if (!total) {
    return {
      totalEvents: 0,
      changedFieldsAvg: 0,
      savedCorrectionsAvg: 0,
      signalRatePct: 0,
    };
  }
  const changedFields = events.map((event) => event.changedFields || 0);
  const savedCorrections = events.map((event) => event.savedCorrections || 0);
  const signalEvents = events.filter((event) => (event.savedCorrections || 0) > 0).length;
  return {
    totalEvents: total,
    changedFieldsAvg: avg(changedFields),
    savedCorrectionsAvg: avg(savedCorrections),
    signalRatePct: pct(signalEvents, total),
  };
}

function getRecentWindow(events, windowMinutes) {
  const minutes = Math.max(5, Number.parseInt(windowMinutes || DEFAULT_WINDOW_MINUTES, 10) || DEFAULT_WINDOW_MINUTES);
  const cutoff = Date.now() - (minutes * 60 * 1000);
  return events.filter((event) => event.at >= cutoff);
}

function recordScanEvent(input = {}) {
  const event = classifyScanEvent(input);
  pushBounded(scannerState.scanEvents, event, MAX_SCAN_EVENTS);
  return event;
}

function recordCorrectionEvent(input = {}) {
  const event = {
    at: Date.now(),
    pin: normalizeText(input.pin, ''),
    deviceProfile: normalizeText(input.deviceProfile, 'phone-camera'),
    courier: normalizeText(input.courier, 'unknown'),
    changedFields: normalizeNumber(input.changedFields, 0) || 0,
    savedCorrections: normalizeNumber(input.savedCorrections, 0) || 0,
  };
  pushBounded(scannerState.correctionEvents, event, MAX_CORRECTION_EVENTS);
  return event;
}

function getScannerQualitySnapshot(options = {}) {
  const windowMinutes = Math.max(5, Number.parseInt(options.windowMinutes || DEFAULT_WINDOW_MINUTES, 10) || DEFAULT_WINDOW_MINUTES);
  const scanWindow = getRecentWindow(scannerState.scanEvents, windowMinutes);
  const correctionWindow = getRecentWindow(scannerState.correctionEvents, windowMinutes);
  const summary = summarize(scanWindow);
  const slaTargets = getSlaTargets();
  const correctionLoop = summarizeCorrectionEvents(correctionWindow);
  const slaStatus = {
    ...buildSlaStatus(summary, slaTargets),
    correctionSignal: correctionLoop.savedCorrectionsAvg >= slaTargets.correctionSignalMin ? 'pass' : 'fail',
  };

  return {
    generatedAt: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - scannerState.startedAt) / 1000),
    windowMinutes,
    sampleSize: scanWindow.length,
    slaTargets,
    summary,
    slaStatus,
    correctionLoop,
    byCourier: summarizeBy(scanWindow, 'courier'),
    byDeviceProfile: summarizeBy(scanWindow, 'deviceProfile'),
    byScanMode: summarizeBy(scanWindow, 'scanMode'),
    recent: scanWindow.slice(-30).map((event) => ({
      at: new Date(event.at).toISOString(),
      courier: event.courier,
      deviceProfile: event.deviceProfile,
      scanMode: event.scanMode,
      lockedAwb: event.lockedAwb || '',
      awbSource: event.awbSource,
      success: event.success,
      awbExtracted: event.awbExtracted,
      falseLock: event.falseLock,
      totalMs: event.totalMs,
      lockTimeMs: event.lockTimeMs,
      reviewRequired: event.reviewRequired,
      qualityIssues: event.qualityIssues,
    })),
  };
}

function resetScannerQuality() {
  scannerState.startedAt = Date.now();
  scannerState.scanEvents = [];
  scannerState.correctionEvents = [];
}

module.exports = {
  recordScanEvent,
  recordCorrectionEvent,
  getScannerQualitySnapshot,
  resetScannerQuality,
};

