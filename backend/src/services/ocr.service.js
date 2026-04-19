'use strict';

const path = require('node:path');
const { spawn } = require('node:child_process');
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const logger = require('../utils/logger');
const { detectCourier } = require('../utils/awbDetect');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let genAI;
if (GEMINI_API_KEY) genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
let _geminiCooldownUntil = null;

const OCR_ENGINES = new Set(['local', 'gemini', 'auto']);
const LOCAL_OCR_SCRIPT = path.join(__dirname, 'ocr.local.py');
let localWorker = null;
let localWorkerStdoutBuffer = '';
let localWorkerLastStderr = '';
let localWorkerSeq = 0;
const localWorkerPending = new Map();
let localWorkerExitHookRegistered = false;

const COURIER_NORMALIZE = {
  DTDC: 'DTDC',
  DELHIVERY: 'Delhivery',
  TRACKON: 'Trackon',
  BLUEDART: 'BlueDart',
  DHL: 'DHL',
  PRIMETRACK: 'PrimeTrack',
  UNKNOWN: '',
};

function normalizeBase64Data(base64Data) {
  const value = String(base64Data || '').trim();
  if (!value) return '';
  if (value.startsWith('data:') && value.includes(',')) {
    return value.split(',', 2)[1].trim();
  }
  return value;
}

function firstMatch(text, regex, index = 1) {
  const match = String(text || '').match(regex);
  return match ? String(match[index] || '').trim() : '';
}

function normalizeRawText(text) {
  return String(text || '')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function asNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDetectedCourier(code) {
  return COURIER_NORMALIZE[String(code || '').toUpperCase()] || '';
}

function courierKey(courier = '') {
  const value = String(courier || '').toLowerCase();
  if (value.includes('trackon')) return 'trackon';
  if (value.includes('dtdc')) return 'dtdc';
  if (value.includes('delhivery')) return 'delhivery';
  if (value.includes('blue')) return 'bluedart';
  if (value.includes('xpress')) return 'xpressbees';
  if (value.includes('ecom')) return 'ecomexpress';
  return 'default';
}

const COURIER_AWB_RULES = {
  trackon: [/^\d{12}$/, /^1\d{11}$/],
  dtdc: [/^[A-Z]{1,3}\d{8,12}$/, /^\d{9,12}$/],
  delhivery: [/^\d{12,15}$/],
  bluedart: [/^\d{9,12}$/, /^[A-Z0-9]{10,14}$/],
  xpressbees: [/^\d{12,15}$/],
  ecomexpress: [/^\d{10,14}$/],
  default: [/^\d{10,14}$/, /^[A-Z0-9]{8,16}$/],
};

const AWB_STOPWORDS = new Set([
  'PHONE',
  'MOBILE',
  'CONSIGNEE',
  'CONSIGNOR',
  'SHIPPER',
  'ADDRESS',
  'DELIVERY',
  'INVOICE',
  'RETURN',
  'TRACKON',
  'DTDC',
  'BLUEDART',
  'DELHIVERY',
]);

function sanitizeAwbToken(value = '') {
  const token = String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim();
  if (!token) return '';
  if (token.length < 8 || token.length > 16) return '';
  if (AWB_STOPWORDS.has(token)) return '';
  if (/^0+$/.test(token)) return '';
  return token;
}

function extractBarcodeAwbCandidates(barcodeCandidates = []) {
  const out = [];
  for (const candidate of barcodeCandidates) {
    const text = String(candidate?.text || '').trim();
    if (!text) continue;

    const urlMatch = text.match(/[?&](?:awb|awbno|waybill|consignment|cn|docket|track(?:ing)?(?:_?no)?)=([A-Z0-9-]{6,24})/i);
    if (urlMatch?.[1]) {
      const token = sanitizeAwbToken(urlMatch[1]);
      if (token) out.push({ value: token, source: 'barcode_qr_url' });
    }

    const contextMatch = text.match(/\b(?:awb|awbno|waybill|consignment|cn|docket)[\s:=#-]*([A-Z0-9-]{6,24})\b/i);
    if (contextMatch?.[1]) {
      const token = sanitizeAwbToken(contextMatch[1]);
      if (token) out.push({ value: token, source: 'barcode_context' });
    }

    const direct = sanitizeAwbToken(text);
    if (direct) out.push({ value: direct, source: 'barcode' });
  }
  return out;
}

function extractRawTextAwbCandidates(rawText = '') {
  const text = normalizeRawText(rawText || '');
  if (!text) return [];

  const out = [];
  const contextRegex = /\b(?:awb|waybill|consignment|tracking|track(?:ing)?\s*no|cn|docket)[\s:#=-]*([A-Z0-9/-]{6,24})\b/gi;
  let match = contextRegex.exec(text);
  while (match) {
    const token = sanitizeAwbToken(match[1]);
    if (token) out.push({ value: token, source: 'ocr_context' });
    match = contextRegex.exec(text);
  }

  const numericMatches = text.match(/\b\d{10,14}\b/g) || [];
  for (const token of numericMatches.slice(0, 20)) {
    const normalized = sanitizeAwbToken(token);
    if (normalized) out.push({ value: normalized, source: 'ocr_numeric' });
  }

  const alphaNumericMatches = text.match(/\b[A-Z]{1,4}\d{7,12}\b/g) || [];
  for (const token of alphaNumericMatches.slice(0, 20)) {
    const normalized = sanitizeAwbToken(token);
    if (normalized) out.push({ value: normalized, source: 'ocr_alnum' });
  }

  return out;
}

function scoreAwbCandidate({ value, source, courierHint, rawText, phoneDigits }) {
  if (!value) return -100;
  let score = 0;

  if (/^\d+$/.test(value)) score += 3;
  if (/\d/.test(value) && /[A-Z]/.test(value)) score += 2;
  if (value.length >= 10 && value.length <= 13) score += 1;
  if (source.startsWith('barcode')) score += 3;
  if (source === 'ocr_context') score += 2;
  if (source === 'ocr_numeric') score += 1;

  if (phoneDigits && value === phoneDigits) score -= 6;
  if (value.endsWith('00') && /^\d+$/.test(value)) score -= 1;

  const rules = COURIER_AWB_RULES[courierKey(courierHint)] || COURIER_AWB_RULES.default;
  if (rules.some((rule) => rule.test(value))) {
    score += 4;
  }

  if (rawText) {
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`).test(rawText)) score += 1;
  }

  return score;
}

function pickBestAwb({ awb, awbSource, barcodeCandidates, rawText, courierHint, phone }) {
  const phoneDigits = String(phone || '').replace(/\D/g, '');
  const pool = [];

  const existing = sanitizeAwbToken(awb);
  if (existing) {
    pool.push({ value: existing, source: String(awbSource || 'existing') });
  }
  pool.push(...extractBarcodeAwbCandidates(barcodeCandidates));
  pool.push(...extractRawTextAwbCandidates(rawText));

  const scored = new Map();
  for (const candidate of pool) {
    const value = candidate.value;
    if (!value) continue;
    const score = scoreAwbCandidate({
      value,
      source: candidate.source,
      courierHint,
      rawText,
      phoneDigits,
    });
    const previous = scored.get(value);
    if (!previous || score > previous.score) {
      scored.set(value, { value, source: candidate.source, score });
    }
  }

  const ranked = [...scored.values()].sort((a, b) => b.score - a.score);
  if (!ranked.length) {
    return { awb: sanitizeAwbToken(awb), source: awbSource || '' };
  }
  const best = ranked[0];
  if (best.score < 2) {
    return { awb: sanitizeAwbToken(awb), source: awbSource || '' };
  }
  return { awb: best.value, source: best.source };
}

function enhanceParsedDetails(parsed = {}, knownAwb = '') {
  const rawText = normalizeRawText(parsed.rawText || '');
  const next = {
    ...parsed,
    awb: sanitizeAwbToken(parsed.awb || knownAwb || ''),
    rawText,
  };

  // Normalize numeric fields.
  if (next.weight !== undefined) {
    const weight = asNumber(next.weight);
    next.weight = weight === null ? undefined : weight;
  }
  if (next.amount !== undefined) {
    const amount = asNumber(next.amount);
    next.amount = amount === null ? undefined : amount;
  }

  // Courier auto-detect from raw text first.
  if (!next.courier) {
    if (/dtdc/i.test(rawText)) next.courier = 'DTDC';
    else if (/delhivery/i.test(rawText)) next.courier = 'Delhivery';
    else if (/trackon/i.test(rawText)) next.courier = 'Trackon';
    else if (/bluedart/i.test(rawText)) next.courier = 'BlueDart';
    else if (/ecom\s*express/i.test(rawText)) next.courier = 'Ecom Express';
    else if (/xpressbees/i.test(rawText)) next.courier = 'XpressBees';
    else if (/shadowfax/i.test(rawText)) next.courier = 'Shadowfax';
    else if (/shiprocket/i.test(rawText)) next.courier = 'Shiprocket';
  }

  // AWB pattern fallback for courier detection.
  if (!next.courier && next.awb) {
    const detected = detectCourier(next.awb);
    next.courier = normalizeDetectedCourier(detected?.courier);
  }

  if (!knownAwb) {
    const selectedAwb = pickBestAwb({
      awb: next.awb,
      awbSource: next.awbSource,
      barcodeCandidates: Array.isArray(next.barcodeCandidates) ? next.barcodeCandidates : [],
      rawText,
      courierHint: next.courier,
      phone: next.phone,
    });
    if (selectedAwb.awb) {
      next.awb = selectedAwb.awb;
      if (selectedAwb.source) next.awbSource = selectedAwb.source;
    }
  } else {
    next.awbSource = next.awbSource || 'known_awb';
  }

  if (!next.pincode) {
    next.pincode = firstMatch(rawText, /\b(\d{6})\b/, 1);
  }

  if (!next.weight) {
    const w = firstMatch(rawText, /\b(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilograms?)\b/i, 1);
    if (w) next.weight = Number(w);
  }

  if (!next.phone) {
    next.phone = firstMatch(rawText, /(?:mob(?:ile)?|ph(?:one)?|tel)?[:\s]*([6-9]\d{9})/i, 1);
  }

  if (!next.orderNo) {
    next.orderNo = firstMatch(
      rawText,
      /\b(?:order|oid|invoice|ref(?:erence)?|docket|c\s*note|cnote)[\s#:-]*([A-Z0-9/-]{4,})/i,
      1
    );
  }

  if (!next.amount) {
    const amount = firstMatch(rawText, /(?:rs\.?|rupees|cod|amount|value)\s*[:-]?\s*(\d{2,5}(?:\.\d{1,2})?)/i, 1);
    if (amount) {
      const amountAsString = String(amount);
      const awb = String(next.awb || '');
      const looksLikeAwbFragment = awb && amountAsString.length >= 5 && awb.includes(amountAsString);
      if (!looksLikeAwbFragment) {
        next.amount = Number(amountAsString);
      }
    }
    if (!next.amount && /\btwo\s+thousand\b/i.test(rawText)) {
      next.amount = 2000;
    }
  }

  if (!next.destination) {
    const cityPin = rawText.match(/([A-Za-z][A-Za-z\s]{2,40})[-,\s]+(\d{6})\b/);
    if (cityPin) {
      const city = String(cityPin[1] || '').replace(/[^A-Za-z ]+/g, ' ').replace(/\s+/g, ' ').trim();
      const cityUpper = city.toUpperCase();
      const blacklisted = [
        'PIN CODE',
        'TRACKON',
        'CONSIGNEE',
        'CONSIGNOR',
        'BOOKING',
        'READ TERMS',
        'VISIT',
        'WEIGHT',
        'VALUE',
        'PCS',
        'VOL',
        'ACTUAL',
        'CHGD',
        'RESTRICTION',
        'DELIVERY',
        'LOCATION',
        'PHONE',
      ];
      if (city && !blacklisted.some((token) => cityUpper.includes(token))) {
        next.destination = city;
      }
      if (!next.pincode) next.pincode = cityPin[2];
    }
  }

  if (!next.clientName) {
    next.clientName = String(parsed.senderCompany || parsed.merchant || '').trim();
  }

  if (typeof next.success !== 'boolean') {
    next.success = Boolean(next.awb || next.rawText);
  }

  return next;
}

function resolveOcrEngine() {
  const defaultEngine = process.env.GEMINI_API_KEY ? 'auto' : 'local';
  const value = String(process.env.OCR_ENGINE || defaultEngine).trim().toLowerCase();
  if (OCR_ENGINES.has(value)) return value;
  logger.warn(`[OCR] Unknown OCR_ENGINE="${value}". Falling back to "${defaultEngine}".`);
  return defaultEngine;
}

function rejectPendingLocalWorkerRequests(error) {
  for (const [, pending] of localWorkerPending) {
    clearTimeout(pending.timer);
    pending.reject(error);
  }
  localWorkerPending.clear();
}

function teardownLocalWorker() {
  if (localWorker && localWorker.exitCode === null) {
    localWorker.kill();
  }
  localWorker = null;
  localWorkerStdoutBuffer = '';
  localWorkerLastStderr = '';
}

function registerLocalWorkerExitHook() {
  if (localWorkerExitHookRegistered) return;
  localWorkerExitHookRegistered = true;
  process.on('exit', () => {
    teardownLocalWorker();
  });
}

function handleLocalWorkerStdout(chunk) {
  localWorkerStdoutBuffer += chunk.toString();
  let newlineIndex = localWorkerStdoutBuffer.indexOf('\n');
  while (newlineIndex >= 0) {
    const line = localWorkerStdoutBuffer.slice(0, newlineIndex).trim();
    localWorkerStdoutBuffer = localWorkerStdoutBuffer.slice(newlineIndex + 1);
    if (line) {
      let message;
      try {
        message = JSON.parse(line);
      } catch (error) {
        logger.error(`[OCR Local] Invalid worker JSON: ${error.message}`);
        newlineIndex = localWorkerStdoutBuffer.indexOf('\n');
        continue;
      }

      const pending = localWorkerPending.get(message.id);
      if (!pending) {
        newlineIndex = localWorkerStdoutBuffer.indexOf('\n');
        continue;
      }
      localWorkerPending.delete(message.id);
      clearTimeout(pending.timer);
      if (message.ok) {
        pending.resolve(message.result);
      } else {
        pending.reject(new Error(String(message.error || 'OCR_LOCAL_RUNTIME: Worker request failed.')));
      }
    }
    newlineIndex = localWorkerStdoutBuffer.indexOf('\n');
  }
}

function ensureLocalWorker() {
  if (localWorker && localWorker.exitCode === null) {
    return localWorker;
  }

  const pythonBin = String(process.env.OCR_PYTHON_BIN || 'python').trim();
  registerLocalWorkerExitHook();
  localWorkerStdoutBuffer = '';
  localWorkerLastStderr = '';

  localWorker = spawn(pythonBin, [LOCAL_OCR_SCRIPT, '--server'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  });

  localWorker.on('error', (error) => {
    const wrapped = new Error(`OCR_LOCAL_RUNTIME: Failed to start python process "${pythonBin}": ${error.message}`);
    rejectPendingLocalWorkerRequests(wrapped);
    teardownLocalWorker();
  });

  localWorker.stdout.on('data', handleLocalWorkerStdout);

  localWorker.stderr.on('data', (chunk) => {
    const text = chunk.toString().trim();
    if (text) {
      localWorkerLastStderr = text;
      logger.warn(`[OCR Local stderr] ${text}`);
    }
  });

  localWorker.on('close', (code, signal) => {
    const wrapped = new Error(
      localWorkerLastStderr ||
        `OCR_LOCAL_RUNTIME: Local OCR worker exited (code=${code}, signal=${signal || 'none'}).`
    );
    rejectPendingLocalWorkerRequests(wrapped);
    teardownLocalWorker();
  });

  return localWorker;
}

function runLocalOcr(payload) {
  const timeoutMs = Math.max(5000, Number.parseInt(process.env.OCR_LOCAL_TIMEOUT_MS || '60000', 10) || 60000);
  const worker = ensureLocalWorker();
  const requestId = ++localWorkerSeq;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      localWorkerPending.delete(requestId);
      reject(new Error(`OCR_LOCAL_RUNTIME: Local OCR timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    localWorkerPending.set(requestId, { resolve, reject, timer });

    try {
      worker.stdin.write(`${JSON.stringify({ id: requestId, payload })}\n`);
    } catch (error) {
      clearTimeout(timer);
      localWorkerPending.delete(requestId);
      reject(new Error(`OCR_LOCAL_RUNTIME: Failed to write to local OCR worker: ${error.message}`));
    }
  });
}

async function extractWithLocal(base64Data, mimeType, options = {}) {
  const normalizedBase64 = normalizeBase64Data(base64Data);
  if (!normalizedBase64) {
    throw new Error('OCR_LOCAL_RUNTIME: imageBase64 is required for local OCR.');
  }

  const payload = {
    imageBase64: normalizedBase64,
    mimeType: mimeType || 'image/jpeg',
    knownAwb: String(options.knownAwb || '').trim(),
  };

  const startedAt = Date.now();
  const parsed = await runLocalOcr(payload);

  const enhanced = enhanceParsedDetails(parsed, payload.knownAwb);
  enhanced._runtime = {
    ...(parsed?._runtime || {}),
    engine: 'local',
    totalMs: Date.now() - startedAt,
  };
  logger.info(
    `[OCR Local] awb=${enhanced.awb || 'NA'} courier=${enhanced.courier || 'NA'} ` +
      `client=${enhanced.clientName || 'NA'} consignee=${enhanced.consignee || 'NA'} ` +
      `dest=${enhanced.destination || 'NA'} pin=${enhanced.pincode || 'NA'} wt=${enhanced.weight || 0}`
  );
  return enhanced;
}

function buildPrompt(knownAwb = '', contextData = {}) {
  const { clients = [], corrections = [], sessionContext = {} } = contextData;

  const clientList = clients.length
    ? clients.map((c) => `  ${c.code}: ${c.company}`).join('\n')
    : '  (no client data available)';

  const correctionList = corrections.length
    ? corrections.map((c) => `  "${c.original}" -> "${c.corrected}" (${c.field}, seen ${c.count}x)`).join('\n')
    : '  (no correction history yet)';

  const sessionHint = sessionContext.recentClient
    ? `Most recent scans in this session were for client: ${sessionContext.recentClient}.`
    : 'No recent client context.';

  return `You are an expert OCR system for Seahawk Courier & Cargo, an Indian logistics company.
You are processing a shipment label image.

Known AWB: ${knownAwb || 'UNKNOWN'}.
Never invent a different AWB when known AWB is provided.

Extract these fields:
- awb, courier
- clientName, senderCompany, senderAddress
- consignee, destination, pincode, phone
- weight (kg), amount (INR), orderNo
- rawText (all visible text)

Known clients:
${clientList}

Learned corrections:
${correctionList}

Session context:
${sessionHint}

Rules:
1) Prefer explicit values on label over guesses.
2) If unsure, return empty string/null and lower confidence.
3) destination is city name only; pincode is 6-digit.
4) Return JSON only.`;
}

async function extractWithGemini(base64Data, mimeType, options = {}) {
  if (!genAI) {
    throw new Error('OCR_GEMINI_SETUP: GEMINI_API_KEY is missing.');
  }

  const normalizedBase64 = normalizeBase64Data(base64Data);
  if (!normalizedBase64) {
    throw new Error('OCR_GEMINI_RUNTIME: imageBase64 is required.');
  }

  const knownAwb = String(options.knownAwb || '').trim();
  const contextData = {
    clients: options.clients || [],
    corrections: options.corrections || [],
    sessionContext: options.sessionContext || {},
  };

  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          success: { type: SchemaType.BOOLEAN },
          labelType: { type: SchemaType.STRING, nullable: true },
          awb: { type: SchemaType.STRING },
          courier: { type: SchemaType.STRING, nullable: true },
          clientName: { type: SchemaType.STRING, nullable: true },
          clientNameConfidence: { type: SchemaType.NUMBER, nullable: true },
          clientNameSource: { type: SchemaType.STRING, nullable: true },
          senderName: { type: SchemaType.STRING, nullable: true },
          senderCompany: { type: SchemaType.STRING, nullable: true },
          senderAddress: { type: SchemaType.STRING, nullable: true },
          merchant: { type: SchemaType.STRING, nullable: true },
          consignee: { type: SchemaType.STRING, nullable: true },
          consigneeConfidence: { type: SchemaType.NUMBER, nullable: true },
          phone: { type: SchemaType.STRING, nullable: true },
          destination: { type: SchemaType.STRING, nullable: true },
          destinationConfidence: { type: SchemaType.NUMBER, nullable: true },
          pincode: { type: SchemaType.STRING, nullable: true },
          pincodeConfidence: { type: SchemaType.NUMBER, nullable: true },
          returnAddress: { type: SchemaType.STRING, nullable: true },
          weight: { type: SchemaType.NUMBER, nullable: true },
          weightConfidence: { type: SchemaType.NUMBER, nullable: true },
          amount: { type: SchemaType.NUMBER, nullable: true },
          amountConfidence: { type: SchemaType.NUMBER, nullable: true },
          orderNo: { type: SchemaType.STRING, nullable: true },
          oid: { type: SchemaType.STRING, nullable: true },
          rawText: { type: SchemaType.STRING },
        },
        required: ['success', 'awb'],
      },
    },
  });

  try {
    const startedAt = Date.now();
    const result = await model.generateContent([
      buildPrompt(knownAwb, contextData),
      { inlineData: { data: normalizedBase64, mimeType: mimeType || 'image/jpeg' } },
    ]);

    const parsed = JSON.parse(result.response.text());
    if (knownAwb && (!parsed.awb || String(parsed.awb).trim().length < 6)) {
      parsed.awb = knownAwb;
    }
    const enhanced = enhanceParsedDetails(parsed, knownAwb);
    enhanced._runtime = {
      ...(parsed?._runtime || {}),
      engine: 'gemini',
      totalMs: Date.now() - startedAt,
    };

    logger.info(
      `[OCR Gemini] awb=${enhanced.awb || 'NA'} courier=${enhanced.courier || 'NA'} ` +
        `client=${enhanced.clientName || 'NA'} consignee=${enhanced.consignee || 'NA'} ` +
        `dest=${enhanced.destination || 'NA'} pin=${enhanced.pincode || 'NA'} wt=${enhanced.weight || 0}`
    );
    return enhanced;
  } catch (error) {
    throw new Error(`OCR_GEMINI_RUNTIME: ${error.message}`);
  }
}

exports.extractShipmentFromImage = async (base64Data, mimeType, options = {}) => {
  const engine = resolveOcrEngine();

  if (engine === 'local') {
    return extractWithLocal(base64Data, mimeType, options);
  }

  if (engine === 'gemini') {
    return extractWithGemini(base64Data, mimeType, options);
  }

  // auto: local first, gemini fallback if local did a poor job (e.g. handwriting)
  // Gemini fallback has a tight timeout to avoid eating the socket OCR budget.
  const GEMINI_FALLBACK_TIMEOUT_MS = 8000;

  try {
    const localResult = await extractWithLocal(base64Data, mimeType, options);
    
    const isQuality = localResult.awb && localResult.consignee && localResult.destination;
    
    if (!isQuality && genAI && !_geminiCooldownUntil) {
      logger.info('[OCR] Local extraction missed key fields. Falling back to Gemini AI (8s budget).');
      try {
        const geminiPromise = extractWithGemini(base64Data, mimeType, options);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gemini fallback timed out after 8s')), GEMINI_FALLBACK_TIMEOUT_MS)
        );
        return await Promise.race([geminiPromise, timeoutPromise]);
      } catch (geminiError) {
        const msg = geminiError.message || '';
        // If rate-limited, set a 60-second cooldown to avoid wasting time on subsequent scans
        if (msg.includes('429') || msg.includes('Quota') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
          _geminiCooldownUntil = Date.now() + 60000;
          logger.warn(`[OCR] Gemini rate-limited. Cooling down for 60s.`);
        }
        logger.warn(`[OCR] Gemini fallback failed: ${msg}. Using partial local result.`);
        return localResult;
      }
    } else if (!isQuality && _geminiCooldownUntil) {
      if (Date.now() > _geminiCooldownUntil) {
        _geminiCooldownUntil = null; // cooldown expired, will try next time
      } else {
        logger.info('[OCR] Gemini on cooldown. Returning partial local result.');
      }
    }
    
    return localResult;
  } catch (localError) {
    logger.warn(`[OCR] Local engine failed in auto mode: ${localError.message}`);
    if (genAI) {
      return extractWithGemini(base64Data, mimeType, options);
    }
    throw localError;
  }
};

