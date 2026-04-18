'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { extractShipmentFromImage } = require('../src/services/ocr.service');

const DEFAULT_DATASET = path.resolve(__dirname, '../src/tests/fixtures/scanner-gold/index.json');
const BARCODE_SOURCES = new Set(['barcode', 'barcode_qr_url', 'barcode_context', 'barcode_alnum', 'known_awb', 'fast_input']);

function normalizeAwb(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim();
}

function inferMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1);
  return Number(sorted[idx].toFixed(2));
}

function average(values) {
  if (!values.length) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

function pct(part, total) {
  if (!total) return 0;
  return Number(((part / total) * 100).toFixed(2));
}

function readDataset(datasetPath) {
  const absolutePath = path.resolve(datasetPath || DEFAULT_DATASET);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Dataset file not found: ${absolutePath}`);
  }
  const parsed = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  const cases = Array.isArray(parsed.cases) ? parsed.cases : [];
  return {
    datasetPath: absolutePath,
    datasetDir: path.dirname(absolutePath),
    cases,
    pipeline: parsed.pipeline || null,
  };
}

function isVerifiedCase(caseDef = {}) {
  return String(caseDef?.label?.status || '').toLowerCase() === 'verified';
}

function validateCase(caseDef = {}) {
  const issues = [];
  if (!String(caseDef.file || '').trim()) issues.push('file is missing');
  if (!String(caseDef.courier || '').trim()) issues.push('courier is missing');
  if (!String(caseDef.expectedAwb || caseDef.expectedAwbPattern || '').trim()) issues.push('expectedAwb/expectedAwbPattern is missing');
  if (!isVerifiedCase(caseDef)) issues.push('label.status must be "verified"');
  return issues;
}

async function runCase(caseDef, datasetDir) {
  const filePath = path.resolve(datasetDir, String(caseDef.file || '').trim());
  if (!fs.existsSync(filePath)) {
    return {
      id: caseDef.id || caseDef.file || 'unknown',
      courier: caseDef.courier || 'unknown',
      status: 'missing_file',
      message: `File not found: ${filePath}`,
      latencyMs: 0,
      awbPass: false,
      barcodeFirstPass: false,
    };
  }

  const base64 = fs.readFileSync(filePath).toString('base64');
  const expectedAwb = normalizeAwb(caseDef.expectedAwb);
  const expectedPattern = caseDef.expectedAwbPattern ? new RegExp(caseDef.expectedAwbPattern, 'i') : null;
  const knownAwb = normalizeAwb(caseDef.knownAwb);

  const startedAt = Date.now();
  try {
    const result = await extractShipmentFromImage(base64, inferMimeType(filePath), {
      knownAwb,
      sessionContext: {
        source: 'benchmark',
        courierHint: caseDef.courier || '',
      },
    });
    const latencyMs = Date.now() - startedAt;
    const actualAwb = normalizeAwb(result?.awb);
    const source = String(result?.awbSource || '').toLowerCase();
    const awbPass = expectedAwb
      ? actualAwb === expectedAwb
      : expectedPattern
        ? expectedPattern.test(actualAwb)
        : Boolean(actualAwb);

    return {
      id: caseDef.id || path.basename(filePath),
      courier: caseDef.courier || 'unknown',
      status: 'ok',
      latencyMs,
      expectedAwb: expectedAwb || null,
      actualAwb: actualAwb || null,
      awbSource: source || null,
      awbPass,
      barcodeFirstPass: Boolean(actualAwb && BARCODE_SOURCES.has(source)),
      fallbackUsed: source.startsWith('ocr'),
      success: Boolean(result?.success),
    };
  } catch (error) {
    return {
      id: caseDef.id || path.basename(filePath),
      courier: caseDef.courier || 'unknown',
      status: 'error',
      message: error.message,
      latencyMs: Date.now() - startedAt,
      awbPass: false,
      barcodeFirstPass: false,
      fallbackUsed: false,
    };
  }
}

function summarize(results) {
  const completed = results.filter((row) => row.status === 'ok');
  const total = results.length;
  const passed = completed.filter((row) => row.awbPass).length;
  const fallbackCount = completed.filter((row) => row.fallbackUsed).length;
  const firstPassCount = completed.filter((row) => row.barcodeFirstPass).length;
  const latencies = completed.map((row) => row.latencyMs).filter((value) => Number.isFinite(value));

  const byCourierMap = new Map();
  for (const row of completed) {
    const key = row.courier || 'unknown';
    if (!byCourierMap.has(key)) byCourierMap.set(key, []);
    byCourierMap.get(key).push(row);
  }

  const byCourier = [...byCourierMap.entries()].map(([courier, rows]) => {
    const courierLatencies = rows.map((row) => row.latencyMs);
    const courierPassed = rows.filter((row) => row.awbPass).length;
    const courierFirstPass = rows.filter((row) => row.barcodeFirstPass).length;
    return {
      courier,
      total: rows.length,
      awbPassRatePct: pct(courierPassed, rows.length),
      barcodeFirstPassRatePct: pct(courierFirstPass, rows.length),
      p95LatencyMs: percentile(courierLatencies, 0.95),
    };
  }).sort((a, b) => b.total - a.total);

  return {
    totalCases: total,
    processedCases: completed.length,
    awbPassRatePct: pct(passed, completed.length || total),
    barcodeFirstPassRatePct: pct(firstPassCount, completed.length || total),
    fallbackRatePct: pct(fallbackCount, completed.length || total),
    latencyMs: {
      avg: average(latencies),
      p95: percentile(latencies, 0.95),
      p99: percentile(latencies, 0.99),
    },
    byCourier,
  };
}

async function main() {
  const datasetInput = process.argv[2] || DEFAULT_DATASET;
  const { datasetPath, datasetDir, cases, pipeline } = readDataset(datasetInput);

  if (!cases.length) {
    console.log(JSON.stringify({
      datasetPath,
      message: 'Dataset is empty. Add cases to "cases" array before running benchmark.',
      summary: {
        totalCases: 0,
        processedCases: 0,
      },
    }, null, 2));
    return;
  }

  const verifiedCases = [];
  const skippedCases = [];
  for (const caseDef of cases) {
    const issues = validateCase(caseDef);
    if (issues.length) {
      skippedCases.push({
        id: caseDef.id || caseDef.file || 'unknown',
        issues,
      });
      continue;
    }
    verifiedCases.push(caseDef);
  }

  if (!verifiedCases.length) {
    console.log(JSON.stringify({
      datasetPath,
      pipeline: pipeline || null,
      message: 'No verified benchmark cases found. Set case.label.status="verified" and fill expected AWB fields.',
      skippedCases,
      summary: {
        totalCases: cases.length,
        processedCases: 0,
      },
    }, null, 2));
    return;
  }

  const results = [];
  for (const caseDef of verifiedCases) {
    // Run sequentially to avoid overloading local OCR worker memory on large suites.
    // Benchmark timing still reflects realistic single-device scan workload.
    // eslint-disable-next-line no-await-in-loop
    results.push(await runCase(caseDef, datasetDir));
  }

  const summary = summarize(results);
  const output = {
    datasetPath,
    generatedAt: new Date().toISOString(),
    pipeline: pipeline || null,
    skippedCases,
    summary,
    failures: results.filter((row) => row.status !== 'ok' || !row.awbPass),
  };

  console.log(JSON.stringify(output, null, 2));

  const minPassRate = Number(process.env.SCANNER_BENCHMARK_MIN_PASS_PCT || '0');
  if (Number.isFinite(minPassRate) && minPassRate > 0 && summary.awbPassRatePct < minPassRate) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

