/**
 * barcodeEngine.js — WASM-accelerated barcode detection engine
 *
 * Replaces the fragile inline ZXing JS setup across all scanner pages with a
 * single, high-performance decode pipeline:
 *
 *   Camera Frame → Crop to scan region → Grayscale → Contrast boost →
 *   zxing-wasm (C++ via WASM) decoder → result callback
 *
 * Falls back to native BarcodeDetector or legacy @zxing/browser if WASM
 * cannot load (e.g. very old browsers).
 *
 * Usage:
 *   import { createBarcodeScanner } from './barcodeEngine.js';
 *   const scanner = createBarcodeScanner();
 *   await scanner.start(videoEl, guideEl, { onDetected, onFail, onEngineReady });
 *   scanner.stop();
 */

'use strict';

// ── Supported barcode formats for all courier labels ───────────────────────
const WASM_FORMATS = ['ITF', 'Code128', 'Code39', 'Code93', 'Codabar', 'EAN-13', 'EAN-8'];

const NATIVE_FORMATS = [
  'code_128', 'code_39', 'code_93', 'codabar',
  'ean_13', 'ean_8', 'itf', 'qr_code',
];

// ── Engine constants ───────────────────────────────────────────────────────
const SCAN_INTERVAL_MS = 55;        // ~18fps decode rate (balanced perf/battery)
const CONTRAST_FACTOR = 1.65;       // Boost factor for thermal-print labels
const CROP_MAX_WIDTH = 640;         // Max width for decode canvas (speed vs accuracy)
const scratchCanvases = {
  crop: null,
  center: null,
  raw: null,
  full: null,
};

function getScratchCanvas(key) {
  const canvas = scratchCanvases[key] || document.createElement('canvas');
  scratchCanvases[key] = canvas;
  return canvas;
}

// ── Canvas preprocessing: makes ITF bars pop on thermal paper ──────────────
function preprocessForBarcode(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const midpoint = 127;

  for (let i = 0; i < data.length; i += 4) {
    // Luminance (BT.601 weights — good for thermal print contrast)
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

    // Contrast stretch around midpoint
    const boosted = Math.min(255, Math.max(0, (gray - midpoint) * CONTRAST_FACTOR + midpoint));

    data[i] = boosted;     // R
    data[i + 1] = boosted; // G
    data[i + 2] = boosted; // B
    // Alpha unchanged
  }

  ctx.putImageData(imageData, 0, 0);
}

// ── Crop the scan-guide region from the video frame ────────────────────────
function cropVideoToGuide(video, guide) {
  if (!video || !guide || !video.videoWidth || !video.videoHeight) return null;

  const vRect = video.getBoundingClientRect();
  const gRect = guide.getBoundingClientRect();

  // Map guide rect to video pixel coordinates
  const scaleX = video.videoWidth / vRect.width;
  const scaleY = video.videoHeight / vRect.height;

  const cropX = Math.max(0, Math.round((gRect.left - vRect.left) * scaleX));
  const cropY = Math.max(0, Math.round((gRect.top - vRect.top) * scaleY));
  const cropW = Math.min(video.videoWidth - cropX, Math.round(gRect.width * scaleX));
  const cropH = Math.min(video.videoHeight - cropY, Math.round(gRect.height * scaleY));

  if (cropW < 40 || cropH < 20) return null;

  // Scale down for faster decode
  const outputW = Math.min(CROP_MAX_WIDTH, cropW);
  const outputH = Math.round((outputW / cropW) * cropH);

  // CHANGE: reuse decode canvas across scan ticks
  const canvas = getScratchCanvas('crop');
  canvas.width = outputW;
  canvas.height = outputH;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, outputW, outputH);

  return canvas;
}

// ── Crop center strip from full frame (fallback when no guide element) ─────
function cropVideoCenter(video) {
  if (!video || !video.videoWidth) return null;

  const vw = video.videoWidth;
  const vh = video.videoHeight;

  // Take a wide landscape strip from the center (where barcodes usually are)
  const stripH = Math.round(vh * 0.35);
  const stripY = Math.round((vh - stripH) / 2);

  const outputW = Math.min(CROP_MAX_WIDTH, vw);
  const outputH = Math.round((outputW / vw) * stripH);

  // CHANGE: reuse center-crop canvas across scan ticks
  const canvas = getScratchCanvas('center');
  canvas.width = outputW;
  canvas.height = outputH;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(video, 0, stripY, vw, stripH, 0, 0, outputW, outputH);

  return canvas;
}


// ═══════════════════════════════════════════════════════════════════════════
// WASM Engine (primary — best ITF detection)
// ═══════════════════════════════════════════════════════════════════════════
// Store the reason if WASM fails so we can surface it in diagnostics
let wasmFailReason = null;

async function loadWasmReader() {
  try {
    const { readBarcodesFromImageData, setZXingModuleOverrides } = await import('zxing-wasm/reader');

    // Point the WASM loader to our locally-hosted binary instead of relying on CDN
    setZXingModuleOverrides({
      locateFile: (path, prefix) => {
        if (path.endsWith('.wasm')) {
          return '/wasm/' + path;
        }
        return prefix + path;
      },
    });

    console.log('[BarcodeEngine] WASM module imported, warming up...');

    // Warm up the WASM module
    const warmupCanvas = document.createElement('canvas');
    warmupCanvas.width = 2;
    warmupCanvas.height = 2;
    const warmupCtx = warmupCanvas.getContext('2d');
    const warmupData = warmupCtx.getImageData(0, 0, 2, 2);
    
    // Increase timeout to 25s — on bad 3G/4G, fetching a 1.5MB file can take a while
    const WASM_WARMUP_TIMEOUT_MS = 25000;

    await Promise.race([
      readBarcodesFromImageData(warmupData, { formats: ['ITF'], tryHarder: false }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('WASM warmup timeout (25s exceeded)')), WASM_WARMUP_TIMEOUT_MS)),
    ]);

    console.log('[BarcodeEngine] WASM engine ready ✓');
    return readBarcodesFromImageData;
  } catch (err) {
    wasmFailReason = err.message || 'Unknown WASM load error';
    console.error('[BarcodeEngine] WASM load failed, will use fallback:', wasmFailReason, err);
    return null;
  }
}

function createWasmDecoder(readFn) {
  const options = {
    tryHarder: true,
    formats: WASM_FORMATS,
    maxNumberOfSymbols: 3,
  };

  return {
    name: 'wasm',
    decode: async (canvas) => {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return [];
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const results = await readFn(imageData, options);
      return results
        .filter((r) => r && r.text)
        .map((r) => ({
          rawValue: r.text,
          format: r.format || 'unknown',
        }));
    },
  };
}


// ═══════════════════════════════════════════════════════════════════════════
// Native BarcodeDetector Engine (fallback 1 — good on Chrome Android)
// ═══════════════════════════════════════════════════════════════════════════
async function createNativeDecoder() {
  if (typeof window === 'undefined' || typeof window.BarcodeDetector === 'undefined') {
    return null;
  }

  let supportedFormats = NATIVE_FORMATS;
  try {
    const available = await window.BarcodeDetector.getSupportedFormats();
    supportedFormats = NATIVE_FORMATS.filter((f) => available.includes(f));
    if (!supportedFormats.length) supportedFormats = NATIVE_FORMATS;
  } catch {
    // Use defaults
  }

  // Must support ITF for Trackon — if native doesn't, this engine shouldn't be used
  if (!supportedFormats.includes('itf')) {
    console.log('[BarcodeEngine] Native BarcodeDetector lacks ITF — skipping');
    return null;
  }

  const detector = new window.BarcodeDetector({ formats: supportedFormats });

  return {
    name: 'native',
    // Native BarcodeDetector can take an HTMLCanvasElement directly
    decode: async (canvas) => {
      const barcodes = await detector.detect(canvas);
      return barcodes
        .filter((b) => b && b.rawValue)
        .map((b) => ({
          rawValue: b.rawValue,
          format: b.format || 'unknown',
        }));
    },
  };
}


// ═══════════════════════════════════════════════════════════════════════════
// Legacy ZXing JS Engine (fallback 2 — last resort)
// ═══════════════════════════════════════════════════════════════════════════
async function createLegacyZxingDecoder() {
  try {
    const [{ BrowserMultiFormatReader }, zxingCore] = await Promise.all([
      import('@zxing/browser'),
      import('@zxing/library'),
    ]);

    const hints = new Map([
      [zxingCore.DecodeHintType.POSSIBLE_FORMATS, [
        zxingCore.BarcodeFormat.CODE_128,
        zxingCore.BarcodeFormat.ITF,
        zxingCore.BarcodeFormat.CODE_39,
        zxingCore.BarcodeFormat.CODE_93,
        zxingCore.BarcodeFormat.CODABAR,
        zxingCore.BarcodeFormat.EAN_13,
        zxingCore.BarcodeFormat.EAN_8,
      ]],
      [zxingCore.DecodeHintType.TRY_HARDER, true],
      [zxingCore.DecodeHintType.ASSUME_GS1, false],
      [zxingCore.DecodeHintType.CHARACTER_SET, 'UTF-8'],
    ]);

    const reader = new BrowserMultiFormatReader(hints, 0);

    return {
      name: 'zxing-legacy',
      decode: async (canvas) => {
        try {
          // CHANGE: use public ZXing API instead of private decoder internals
          const result = await reader.decodeFromCanvas(canvas);
          if (result && result.getText()) {
            let format = 'unknown';
            const barcodeFormat = result.getBarcodeFormat?.();
            if (barcodeFormat != null) {
              format = String(barcodeFormat);
            }
            return [{ rawValue: result.getText(), format }];
          }
        } catch (err) {
          // CHANGE: ignore NotFoundException, log other legacy ZXing errors
          const name = err?.name || err?.constructor?.name || '';
          if (name !== 'NotFoundException') {
            console.debug('[BarcodeEngine] Legacy ZXing decode failed:', err?.message || err);
          }
        }
        return [];
      },
    };
  } catch (err) {
    console.warn('[BarcodeEngine] Legacy ZXing load failed:', err.message);
    return null;
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// MULTI-PASS DECODE — tries preprocessed first, then raw
// ═══════════════════════════════════════════════════════════════════════════
async function multiPassDecode(decoder, video, guide, frameCountRef) {
  // Pass 1: Cropped + preprocessed (grayscale + contrast boost)
  const croppedCanvas = guide
    ? cropVideoToGuide(video, guide)
    : cropVideoCenter(video);

  if (croppedCanvas) {
    // Clone canvas for raw pass before we preprocess
    // CHANGE: reuse raw-pass canvas instead of allocating during scan loop
    const rawCanvas = getScratchCanvas('raw');
    rawCanvas.width = croppedCanvas.width;
    rawCanvas.height = croppedCanvas.height;
    const rawCtx = rawCanvas.getContext('2d');
    if (!rawCtx) return { results: [], pass: 'none' };
    rawCtx.drawImage(croppedCanvas, 0, 0);

    // Preprocess the original canvas
    preprocessForBarcode(croppedCanvas);

    const preprocessedResults = await decoder.decode(croppedCanvas);
    if (preprocessedResults.length > 0) {
      return { results: preprocessedResults, pass: 'preprocessed' };
    }

    // Pass 2: Raw (no preprocessing) — some barcodes detect better unprocessed
    const rawResults = await decoder.decode(rawCanvas);
    if (rawResults.length > 0) {
      return { results: rawResults, pass: 'raw' };
    }
  }

  // Pass 3: Full frame (no crop, no preprocessing) — catches edge cases
  // Only do this every 3rd call to save CPU
  // CHANGE: deterministic full-frame fallback every third scan tick
  if (frameCountRef % 3 === 0) {
    const fullCanvas = getScratchCanvas('full');
    const maxW = Math.min(CROP_MAX_WIDTH, video.videoWidth);
    const maxH = Math.round((maxW / video.videoWidth) * video.videoHeight);
    fullCanvas.width = maxW;
    fullCanvas.height = maxH;
    const ctx = fullCanvas.getContext('2d');
    if (!ctx) return { results: [], pass: 'none' };
    ctx.drawImage(video, 0, 0, maxW, maxH);

    const fullResults = await decoder.decode(fullCanvas);
    if (fullResults.length > 0) {
      return { results: fullResults, pass: 'fullframe' };
    }
  }

  return { results: [], pass: 'none' };
}


// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC: createBarcodeScanner
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Creates a barcode scanner instance.
 *
 * @returns {{ start, stop, getEngine }}
 *
 * start(videoElement, guideElement?, options?) — begins scanning
 *   options.onDetected(rawValue, meta)  — called when barcode found
 *   options.onFail()                    — called on each frame with no barcode
 *   options.onEngineReady(engineName)   — called when decoder is initialized
 *
 * stop() — halts scanning loop (camera stays alive)
 *
 * getEngine() — returns name of active engine ('wasm' | 'native' | 'zxing-legacy' | null)
 */
export function createBarcodeScanner() {
  let decoder = null;
  let timerId = null;
  let stopped = true;
  let engineName = null;
  let frameCountRef = 0;

  async function initDecoder(onEngineReady) {
    // Try engines in order of quality
    // 1. WASM (best for ITF)
    const wasmReader = await loadWasmReader();
    if (wasmReader) {
      decoder = createWasmDecoder(wasmReader);
      engineName = 'wasm';
      onEngineReady?.('wasm');
      return;
    }

    // 2. Native BarcodeDetector (good on Chrome Android if ITF is supported)
    const nativeDecoder = await createNativeDecoder();
    if (nativeDecoder) {
      decoder = nativeDecoder;
      engineName = 'native';
      onEngineReady?.('native');
      return;
    }

    // 3. Legacy ZXing JS (last resort)
    const legacyDecoder = await createLegacyZxingDecoder();
    if (legacyDecoder) {
      decoder = legacyDecoder;
      engineName = 'zxing-legacy';
      onEngineReady?.('zxing-legacy');
      return;
    }

    throw new Error('No barcode detection engine available on this device.');
  }

  async function start(videoEl, guideEl, options = {}) {
    const { onDetected, onFail, onEngineReady } = options;
    stopped = false;

    if (!decoder) {
      await initDecoder(onEngineReady);
    } else {
      onEngineReady?.(engineName);
    }

    let busy = false;

    const tick = async () => {
      if (stopped || busy) return;
      if (!videoEl || videoEl.readyState < 2) {
        timerId = setTimeout(tick, SCAN_INTERVAL_MS);
        return;
      }

      busy = true;

      try {
        // CHANGE: persist frame count across scan ticks without increasing frequency
        frameCountRef += 1;
        const { results, pass } = await multiPassDecode(decoder, videoEl, guideEl, frameCountRef);

        if (results.length > 0) {
          const best = results[0];
          onDetected?.(best.rawValue, {
            format: best.format,
            engine: engineName,
            pass,
            candidateCount: results.length,
            alternatives: results.slice(1).map((r) => r.rawValue),
          });
        } else {
          onFail?.();
        }
      } catch (err) {
        // Decode error — treat as no barcode found
        onFail?.();
      }

      busy = false;

      if (!stopped) {
        timerId = setTimeout(tick, SCAN_INTERVAL_MS);
      }
    };

    // Small delay to let camera settle
    timerId = setTimeout(tick, 200);
  }

  function stop() {
    stopped = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  function getEngine() {
    return engineName;
  }

  function getDiagnostics() {
    return {
      engineName,
      wasmFailReason,
    };
  }

  return { start, stop, getEngine, getDiagnostics };
}
