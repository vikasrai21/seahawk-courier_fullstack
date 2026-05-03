'use strict';

const path = require('node:path');
const { spawn } = require('node:child_process');
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const axios = require('axios');
const logger = require('../utils/logger');
const { detectCourier } = require('../utils/awbDetect');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;
let genAI;
if (GEMINI_API_KEY) genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// Gemini resilience state
let _geminiCooldownUntil = null;
const GEMINI_MODELS = [
  'gemini-2.0-flash-lite',   // highest free-tier limits (separate quota pool)
  'gemini-2.0-flash',        // powerful, moderate free-tier
  'gemini-1.5-flash',        // legacy, separate quota pool
];
const _modelCooldowns = new Map();  // model → cooldownUntil timestamp

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
  PRIMETRACK: 'Trackon',
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

function sanitizeFieldValue(value = '') {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/^[^A-Z0-9]+/i, '')
    .replace(/[^A-Z0-9]+$/i, '')
    .trim();
}

/**
 * Strip placeholder strings like "UNKNOWN", "N/A", "NA" that AI models
 * sometimes return when they cannot read a field. Return empty string so
 * these are treated as "not extracted" rather than a real value.
 */
function cleanOcrPlaceholder(value = '') {
  const v = String(value || '').trim();
  if (!v) return '';
  const upper = v.toUpperCase();
  if (upper === 'UNKNOWN' || upper === 'N/A' || upper === 'NA' || upper === 'NOT VISIBLE' || upper === 'NOT FOUND' || upper === 'NONE') return '';
  return v;
}

function stripTrailingContactNoise(value = '') {
  return String(value || '')
    .replace(/\b(?:pin(?:\s*code)?|zip)\b.*$/i, '')
    .replace(/\b(?:mob(?:ile)?|ph(?:one)?|tel)\b.*$/i, '')
    .replace(/\b[6-9]\d{9}\b.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractLabeledValue(rawText, labelPatterns = [], options = {}) {
  const lines = String(rawText || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    for (const pattern of labelPatterns) {
      const match = line.match(pattern);
      if (!match) continue;

      let candidate = sanitizeFieldValue(match[1] || '');
      if (!candidate && i + 1 < lines.length) {
        candidate = sanitizeFieldValue(lines[i + 1]);
      }
      if (!candidate) continue;

      candidate = stripTrailingContactNoise(candidate);
      if (!candidate) continue;

      const upper = candidate.toUpperCase();
      const minLength = Number(options.minLength || 2);
      if (candidate.length < minLength) continue;

      if (Array.isArray(options.rejectTokens) && options.rejectTokens.some((token) => upper.includes(token))) {
        continue;
      }

      return options.uppercase ? upper : candidate;
    }
  }

  return '';
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
  
  // STEP 1 & 2: Text Normalization and Structured Field Extraction
  const cleanText = rawText
    .replace(/\n/g, ' ')
    .replace(/[^a-zA-Z0-9@.\- ]/g, ' ')
    .toLowerCase();

  const structuredFields = {
    phone: cleanText.match(/\b\d{10}\b/)?.[0] || null,
    pincode: cleanText.match(/\b\d{6}\b/)?.[0] || null,
    email: cleanText.match(/\S+@\S+\.\S+/)?.[0] || null,
  };

  // STEP 5: Remove "UNKNOWN" completely -> return null
  const cleanField = (val) => {
    const v = String(val || '').trim().toUpperCase();
    if (!v || v === 'UNKNOWN' || v === 'N/A' || v === 'NA' || v === 'NONE') return null;
    return String(val || '').trim();
  };

  const next = {
    ...parsed,
    awb: sanitizeAwbToken(parsed.awb || knownAwb || ''),
    rawText,
    consignee: cleanField(parsed.consignee),
    destination: cleanField(parsed.destination),
    clientName: cleanField(parsed.clientName),
    senderCompany: cleanField(parsed.senderCompany),
  };

  // Assign structured fields if missing
  if (!next.phone) next.phone = structuredFields.phone;
  if (!next.pincode) next.pincode = structuredFields.pincode;
  if (!next.email) next.email = structuredFields.email;

  // Normalize numeric fields.
  if (next.weight !== undefined && next.weight !== null) {
    const weight = asNumber(next.weight);
    next.weight = weight === null ? undefined : weight;
  }
  if (next.amount !== undefined && next.amount !== null) {
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

  if (!next.weight) {
    const w = firstMatch(rawText, /\b(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilograms?)\b/i, 1);
    if (w) next.weight = Number(w);
  }

  if (!next.orderNo) {
    next.orderNo = firstMatch(
      rawText,
      /\b(?:order|oid|invoice|ref(?:erence)?|docket|c\s*note|cnote)[\s#:-]*([A-Z0-9/-]{4,})/i,
      1
    ) || null;
  }

  // STEP 3: Consignee extraction
  if (!next.consignee) {
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    let foundConsignee = null;
    for (let i = 0; i < lines.length; i++) {
      const lowerLine = lines[i].toLowerCase();
      if (lowerLine.includes('name') || lowerLine.includes('consignee') || lowerLine.includes('ship to')) {
        const parts = lines[i].split(/[:-]/);
        if (parts.length > 1 && parts[1].trim().length > 2) {
          foundConsignee = parts[1].trim();
        } else if (i + 1 < lines.length) {
          foundConsignee = lines[i+1].trim();
        }
        break;
      }
    }
    // fallback to first uppercase-heavy line
    if (!foundConsignee) {
      for (const line of lines) {
        const uppers = (line.match(/[A-Z]/g) || []).length;
        if (uppers > 5 && line.length < 30) {
          foundConsignee = line;
          break;
        }
      }
    }
    if (foundConsignee) next.consignee = cleanField(foundConsignee);
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

  // STEP 4: Destination detection
  const CITY_LIST = ['delhi','gurgaon','noida','mumbai','bangalore','chennai','hyderabad','pune','kolkata'];
  if (!next.destination) {
    for (const city of CITY_LIST) {
      if (cleanText.includes(city)) {
        next.destination = city.toUpperCase();
        break;
      }
    }
  }

  if (!next.clientName) {
    next.clientName = cleanField(parsed.senderCompany || parsed.merchant) || null;
  }

  if (typeof next.success !== 'boolean') {
    next.success = Boolean(next.awb || next.rawText);
  }

  // STEP 6: Confidence scoring
  function computeConfidence(data) {
    let score = 0;
    if (data.awb) score += 30;
    if (data.phone) score += 15;
    if (data.pincode) score += 15;
    if (data.consignee) score += 20;
    if (data.destination) score += 20;
    return score;
  }
  
  next.confidence = computeConfidence(next);

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

async function callGoogleVisionAPI(base64Data) {
  if (!GOOGLE_VISION_API_KEY) return null;
  const startedAt = Date.now();
  try {
    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
      {
        requests: [
          {
            image: { content: base64Data },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          },
        ],
      }
    );
    const textAnnotations = response.data?.responses?.[0]?.textAnnotations;
    const visionText = textAnnotations && textAnnotations.length > 0 ? textAnnotations[0].description : '';
    logger.info(`[OCR GoogleVision] Extracted ${visionText.length} chars in ${Date.now() - startedAt}ms`);
    return visionText;
  } catch (error) {
    logger.error(`[OCR GoogleVision] Failed: ${error.message}`);
    return null;
  }
}

function buildPrompt(knownAwb = '', contextData = {}, visionText = '') {
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

  const visionHint = visionText 
    ? `\n## PRECISE OCR TEXT EXTRACTED BY HIGH-PERFORMANCE ENGINE:\nHere is the highly accurate text extracted from the label. Rely HEAVILY on this text for extraction.\n\n"""\n${visionText}\n"""\n`
    : '';

  return `You are an expert courier label OCR system for Seahawk Courier & Cargo, India.
You MUST extract EVERY field from this shipment label, including HANDWRITTEN text.
${visionHint}
Known AWB: ${knownAwb || 'UNKNOWN'}.
Never invent a different AWB when known AWB is provided.

## LABEL ZONE GUIDE (Indian courier labels)
These labels typically have these zones. Read ALL zones carefully:
- TOP ZONE: Courier logo (Trackon/DTDC/Delhivery/BlueDart), barcode, AWB number
- CONSIGNOR/SENDER ZONE: Company name (this is the CLIENT), sender address. Often labeled "CONSIGNOR" or "FROM". May be handwritten.
- CONSIGNEE/RECEIVER ZONE: Person name, full address with city + 6-digit pincode, phone. Often labeled "CONSIGNEE" or "TO" or "DELIVER TO". The name here is the consignee. May be HANDWRITTEN - read it carefully character by character.
- DETAILS ZONE: Weight (kg), dimensions, number of pieces, charges/amount in INR, DOX/N.DOX indicator
- ORIGIN/DESTINATION ZONE: Origin city and destination city, often in large print or separate boxes

## HANDWRITING INSTRUCTIONS
Many Indian courier labels have HANDWRITTEN consignee names, addresses, and destinations.
- Read handwritten text carefully, character by character
- Indian names often end with: -al, -ani, -wal, -and, -esh, -ar, -an, -at, -pur, -bad, -abad
- Common Indian city names: Delhi, Mumbai, Kolkata, Chennai, Hyderabad, Bengaluru, Pune, Jaipur, Lucknow, Chandigarh, Bhopal, Indore, Ahmedabad, Surat, Nagpur, Patna, Amritsar, Ludhiana, Bhatinda/Bathinda, Jalandhar
- If a field says "CONSIGNEE" followed by handwritten text, that text IS the consignee name
- If text appears next to a 6-digit number, the text is likely the city and the number is the pincode

## EXTRACT THESE FIELDS
- awb: The tracking/waybill number (numeric, 10-14 digits)
- courier: Trackon, DTDC, Delhivery, BlueDart, or other
- clientName: The SENDER/CONSIGNOR company name (who is shipping the package)
- senderCompany: Same as clientName
- senderAddress: Full sender address
- consignee: The RECEIVER name (person or company receiving the package)
- destination: CITY name only (not full address)
- pincode: 6-digit Indian postal code
- phone: 10-digit Indian mobile number
- weight: Weight in kilograms (number)
- amount: Cash amount in INR (COD/charges)
- orderNo: Order/invoice/reference number if visible
- rawText: ALL visible text on the label, including handwritten

Known clients:
${clientList}

Learned corrections:
${correctionList}

Session context:
${sessionHint}

Rules:
1) Read EVERY zone. Do NOT skip handwritten text.
2) consignee = the person RECEIVING, not the sender.
3) clientName = the SENDER/CONSIGNOR, not the receiver.
4) destination is city name ONLY, never full address.
5) pincode is exactly 6 digits.
6) Prefer explicit values on label over guesses.
7) Set confidence 0.0-1.0 for each field based on legibility.
8) Return JSON only.

## DTDC LABEL SPECIFIC RULES
DTDC labels have these specific regions:
- AWB starts with Z, D, X, 7X, or I followed by digits
- "Company Name & Address" or "Consignee Name & Address" box = consignee name + destination
- "Booking Branch" area shows origin city
- "Risk Surcharge" / "FSC" section = ignore for field extraction
- Handwritten entries in boxes — always attempt to read, even if cursive
- The large barcode at bottom = AWB number
- "Destination:" label or destination city is often printed in a dedicated box

## DELHIVERY LABEL SPECIFIC RULES  
- Large "SHIP TO" section = consignee
- "Return to:" = sender/client
- Order number often starts with letters followed by digits

## TRACKON LABEL SPECIFIC RULES
- AWB starts with 100 or 500 followed by 9 digits
- "To:" section = consignee and destination

If rawText is provided above, PRIORITIZE reading from that text rather than the image directly.
When rawText has a line like "Consignee Name: HARDEEP KUR" — extract "HARDEEP KUR" as consignee.
When rawText has "Destination: DELHI" — extract "DELHI" as destination.`;
}

const GEMINI_RESPONSE_SCHEMA = {
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
};

function isRetryableGeminiError(msg) {
  return msg.includes('429') || msg.includes('503') || msg.includes('500')
    || msg.includes('Quota') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')
    || msg.includes('overloaded') || msg.includes('UNAVAILABLE')
    || msg.includes('INTERNAL') || msg.includes('timed out');
}

function isRateLimitError(msg) {
  return msg.includes('429') || msg.includes('Quota') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
}

/**
 * Try a single Gemini model. Returns the extraction result or throws.
 */
async function tryGeminiModel(modelName, normalizedBase64, mimeType, knownAwb, contextData, visionText = null) {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: GEMINI_RESPONSE_SCHEMA,
      temperature: 0.1,   // Low temperature = more deterministic, less hallucination
      topP: 0.8,
      maxOutputTokens: 1024,
    },
  });

  const startedAt = Date.now();
  const result = await model.generateContent([
    buildPrompt(knownAwb, contextData, visionText),
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
    model: modelName,
    totalMs: Date.now() - startedAt,
  };

  logger.info(
    `[OCR Gemini:${modelName}] awb=${enhanced.awb || 'NA'} courier=${enhanced.courier || 'NA'} ` +
      `client=${enhanced.clientName || 'NA'} consignee=${enhanced.consignee || 'NA'} ` +
      `dest=${enhanced.destination || 'NA'} pin=${enhanced.pincode || 'NA'} wt=${enhanced.weight || 0} ` +
      `(${enhanced._runtime.totalMs}ms)`
  );
  return enhanced;
}

/**
 * Enterprise-grade Gemini extraction with model rotation + retry.
 * Tries multiple models (each with separate quota pools) so if one model's
 * free-tier quota runs out, it swaps to the next.
 */
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

  // Use env override, or rotate through available models
  const explicitModel = process.env.GEMINI_MODEL;
  const modelsToTry = explicitModel ? [explicitModel] : GEMINI_MODELS.filter((m) => {
    const cooldown = _modelCooldowns.get(m);
    if (!cooldown) return true;
    if (Date.now() > cooldown) { _modelCooldowns.delete(m); return true; }
    return false;
  });

  if (!modelsToTry.length) {
    // All models on cooldown — check if any have expired
    for (const [m, ts] of _modelCooldowns) {
      if (Date.now() > ts) { _modelCooldowns.delete(m); modelsToTry.push(m); }
    }
    if (!modelsToTry.length) {
      throw new Error('OCR_GEMINI_RUNTIME: All Gemini models are rate-limited. Waiting for cooldown.');
    }
  }

  // Pre-process with Google Vision API if configured (Dual-Engine Approach)
  let visionText = null;
  if (GOOGLE_VISION_API_KEY) {
    visionText = await callGoogleVisionAPI(normalizedBase64);
  }

  let lastError = null;
  for (const modelName of modelsToTry) {
    // Retry up to 2 times per model (for transient 500/503 errors)
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await tryGeminiModel(modelName, normalizedBase64, mimeType, knownAwb, contextData, visionText);
      } catch (err) {
        const msg = String(err.message || '');
        lastError = err;

        if (isRateLimitError(msg)) {
          // This model's quota is exhausted — cooldown and try next model
          _modelCooldowns.set(modelName, Date.now() + 90000); // 90s cooldown per model
          logger.warn(`[OCR Gemini] Model ${modelName} rate-limited. Cooldown 90s. Trying next model.`);
          break; // break retry loop, try next model
        }

        if (isRetryableGeminiError(msg) && attempt < 1) {
          const delayMs = (attempt + 1) * 1500;
          logger.warn(`[OCR Gemini] Model ${modelName} transient error: ${msg}. Retry in ${delayMs}ms.`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue; // retry same model
        }

        // Non-retryable error (auth, schema, etc.) — skip this model
        logger.error(`[OCR Gemini] Model ${modelName} failed: ${msg}`);
        break;
      }
    }
  }

  throw new Error(`OCR_GEMINI_RUNTIME: All models failed. Last error: ${lastError?.message || 'unknown'}`);
}

exports.extractShipmentFromImage = async (base64Data, mimeType, options = {}) => {
  const engine = resolveOcrEngine();

  if (engine === 'local') {
    return extractWithLocal(base64Data, mimeType, options);
  }

  if (engine === 'gemini') {
    return extractWithGemini(base64Data, mimeType, options);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // AUTO MODE: Gemini-first with local OCR running in parallel as backup.
  // Gemini is vastly superior for handwritten labels + field understanding.
  // Local OCR is fast and reliable for barcodes and basic printed text.
  // ═══════════════════════════════════════════════════════════════════════
  const GEMINI_BUDGET_MS = 12000;

  if (genAI) {
    // Launch local OCR immediately (it's fast, ~5-8s, gives us a safety net)
    const localPromise = extractWithLocal(base64Data, mimeType, options).catch((err) => {
      logger.warn(`[OCR Auto] Local engine failed in background: ${err.message}`);
      return null;
    });

    try {
      // Race Gemini against a timeout
      const geminiPromise = extractWithGemini(base64Data, mimeType, options);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini budget exceeded')), GEMINI_BUDGET_MS)
      );
      const geminiResult = await Promise.race([geminiPromise, timeoutPromise]);

      // Gemini succeeded — use it. Cancel interest in local result.
      return geminiResult;
    } catch (geminiError) {
      const msg = geminiError.message || '';
      logger.warn(`[OCR Auto] Gemini pipeline failed: ${msg}. Waiting for local OCR fallback.`);

      // Gemini failed — wait for local OCR result (it's already running)
      const localResult = await localPromise;
      if (localResult) return localResult;

      // Both failed
      throw new Error(`OCR_AUTO_RUNTIME: Gemini failed (${msg}). Local OCR also unavailable.`);
    }
  }

  // No Gemini API key — pure local
  return extractWithLocal(base64Data, mimeType, options);
};