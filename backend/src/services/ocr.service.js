'use strict';
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const logger = require('../utils/logger');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let genAI;
if (GEMINI_API_KEY) genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ─── Regex fallback helpers ──────────────────────────────────────────────────
function firstMatch(text, regex, index = 1) {
  const match = String(text || '').match(regex);
  return match ? String(match[index] || '').trim() : '';
}

function normalizeRawText(text) {
  return String(text || '').replace(/\r/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();
}

function enhanceParsedDetails(parsed = {}, knownAwb = '') {
  const rawText = normalizeRawText(parsed.rawText || '');
  const next = { ...parsed, awb: String(parsed.awb || knownAwb || '').trim(), rawText };

  // Courier auto-detect from raw text
  if (!next.courier) {
    if (/dtdc/i.test(rawText))         next.courier = 'DTDC';
    else if (/delhivery/i.test(rawText)) next.courier = 'Delhivery';
    else if (/trackon/i.test(rawText))   next.courier = 'Trackon';
    else if (/bluedart/i.test(rawText))  next.courier = 'BlueDart';
    else if (/ecom\s*express/i.test(rawText)) next.courier = 'Ecom Express';
    else if (/xpressbees/i.test(rawText))     next.courier = 'XpressBees';
    else if (/shadowfax/i.test(rawText))      next.courier = 'Shadowfax';
    else if (/shiprocket/i.test(rawText))     next.courier = 'Shiprocket';
  }

  // Regex fallbacks ONLY when Gemini couldn't extract
  if (!next.pincode)
    next.pincode = firstMatch(rawText, /\b(\d{6})\b/, 1);

  if (!next.weight) {
    const w = firstMatch(rawText, /\b(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilograms?)\b/i, 1);
    if (w) next.weight = Number(w);
  }

  if (!next.phone)
    next.phone = firstMatch(rawText, /(?:mob(?:ile)?|ph(?:one)?|tel)?[:\s]*([6-9]\d{9})/i, 1);

  if (!next.orderNo)
    next.orderNo = firstMatch(rawText, /\b(?:order|oid|invoice|ref(?:erence)?)[\s#:\-]*([A-Z0-9\-\/]{4,})/i, 1);

  if (!next.clientName)
    next.clientName = String(parsed.senderCompany || parsed.merchant || '').trim();

  return next;
}

/**
 * Build a zone-aware, label-type-aware prompt for Gemini Vision.
 */
function buildPrompt(knownAwb = '', contextData = {}) {
  const { clients = [], corrections = [], sessionContext = {} } = contextData;

  const clientList = clients.length
    ? clients.map(c => `  ${c.code}: ${c.company}`).join('\n')
    : '  (no client data available)';

  const correctionList = corrections.length
    ? corrections.map(c => `  "${c.original}" → "${c.corrected}" (${c.field}, seen ${c.count}x)`).join('\n')
    : '  (no correction history yet)';

  const sessionHint = sessionContext.recentClient
    ? `Most recent scans in this session were for client: ${sessionContext.recentClient}.`
    : 'No recent client context.';

  return `You are an expert OCR system for Seahawk Courier & Cargo, an Indian logistics company.
You are processing an image of a courier waybill/shipment label.

═══════════════════════════════════════════════════════
STEP 1 — IDENTIFY LABEL TYPE (choose one):
═══════════════════════════════════════════════════════
Before extracting fields, identify what kind of label this is:
  a) "marketplace" — Printed by Shiprocket, Delhivery, DTDC, Ecom Express, XpressBees etc. Has clean structured layout with barcode, sender block, consignee block.
  b) "handwritten" — Handwritten text on paper/envelope. May have messy layout.
  c) "courier_printed" — Printed by Trackon, local courier. Often has both printed and handwritten parts.

Knowing the label type helps you read the right zones. Set the "labelType" field accordingly.

═══════════════════════════════════════════════════════
STEP 2 — READ ZONES IN THIS ORDER:
═══════════════════════════════════════════════════════

ZONE A — AWB / BARCODE AREA (usually top-right or top-center):
  - The tracking number / AWB / Docket No / C Note is KNOWN: ${knownAwb || 'UNKNOWN'}
  - If visible text confirms the same number, great. If slightly different (OCR blur), trust the KNOWN value.
  - DO NOT invent a different AWB.

ZONE B — CONSIGNEE BLOCK (where it says "To:", "Deliver To:", "Consignee:"):
  - Extract: recipient name, full address, city, state, PIN code, mobile number
  - The "consignee" field = RECIPIENT NAME ONLY (not address)
  - The "destination" field = DESTINATION CITY name
  - The "pincode" field = 6-digit destination PIN code
  - The "phone" field = consignee mobile (10 digits starting with 6-9)

ZONE C — SENDER / MERCHANT BLOCK (where it says "From:", "Sender:", "Return To:", "Ship From:"):
  - Extract: company/brand name, address
  - The "clientName" field = this sender/merchant name
  - Match it against known clients below. If it fuzzy-matches, use the EXACT known client name.
  - If you've seen a correction below for this text, apply it automatically.

ZONE D — WEIGHT / DIMENSIONS BLOCK:
  - Extract: weight in kg (just the number, e.g. 2.5 not "2.5kg")
  - If "Actual Weight" and "Chargeable Weight" are both shown, prefer "Chargeable Weight"

ZONE E — VALUE / COD / AMOUNT:
  - Extract: declared value or COD amount (₹ or Rs)
  - If none visible, return 0

ZONE F — ORDER REFERENCE:
  - Look for: Order ID, OID, Invoice No, Reference No, Bag ID, Manifest No
  - Extract the alphanumeric code

═══════════════════════════════════════════════════════
KNOWN SEAHAWK CLIENTS (match ZONE C against these):
═══════════════════════════════════════════════════════
${clientList}

═══════════════════════════════════════════════════════
LEARNED CORRECTIONS (apply these automatically):
═══════════════════════════════════════════════════════
${correctionList}

SESSION CONTEXT:
${sessionHint}

═══════════════════════════════════════════════════════
IMPORTANT RULES:
═══════════════════════════════════════════════════════
1. HANDWRITTEN TEXT: Be extra careful. If unsure, give a lower confidence score (0.3–0.5) but still provide your best guess. Do NOT leave blank when text is partially visible.
2. MARKETPLACE LABELS (Shiprocket, Delhivery, Ecom): The merchant/seller name is usually in small print near the barcode or in the "Ship From" block. Look carefully — this is the most important field for us.
3. CONFIDENCE SCORES: Every field needs a score 0.0–1.0:
   - 0.9–1.0 = Clearly printed, no doubt
   - 0.6–0.8 = Mostly clear, minor uncertainty
   - 0.3–0.5 = Partially visible or handwritten
   - 0.1–0.2 = Barely readable, heavy blur
4. RAW TEXT: Dump ALL text you can read from the entire image — do not summarize. This is used for debugging and regex fallbacks.
5. NEVER invent data. If a field is truly not visible, return null/empty string.

Respond with the required JSON schema.`;
}

/**
 * Extracts AWB shipment details from a courier slip image using Gemini Vision.
 * Context-aware: injects known clients, learned corrections, and session state.
 *
 * @param {string} base64Data - Pure base64 string of the image
 * @param {string} mimeType   - e.g. "image/jpeg"
 * @param {object} options    - { knownAwb, clients, corrections, sessionContext }
 */
exports.extractShipmentFromImage = async (base64Data, mimeType, options = {}) => {
  if (!genAI) throw new Error('OCR Vision is locked: GEMINI_API_KEY is missing from environment variables.');

  const knownAwb   = String(options.knownAwb || '').trim();
  const contextData = {
    clients:        options.clients     || [],
    corrections:    options.corrections || [],
    sessionContext: options.sessionContext || {},
  };

  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          success:               { type: SchemaType.BOOLEAN, description: 'Whether useful data was found' },
          labelType:             { type: SchemaType.STRING, description: 'marketplace | handwritten | courier_printed', nullable: true },
          awb:                   { type: SchemaType.STRING, description: 'AWB / tracking number / docket number' },
          courier:               { type: SchemaType.STRING, description: 'Detected courier (e.g. Trackon, DTDC, Delhivery, Shiprocket)', nullable: true },

          // Sender / merchant (ZONE C)
          clientName:            { type: SchemaType.STRING, description: 'Sender company/brand name matched against known clients', nullable: true },
          clientNameConfidence:  { type: SchemaType.NUMBER, description: 'Confidence 0.0–1.0 for clientName', nullable: true },
          clientNameSource:      { type: SchemaType.STRING, description: 'How clientName was determined: ocr_direct | fuzzy_match | learned', nullable: true },
          senderName:            { type: SchemaType.STRING, description: 'Sender person name if present', nullable: true },
          senderCompany:         { type: SchemaType.STRING, description: 'Sender company/brand raw text before matching', nullable: true },
          senderAddress:         { type: SchemaType.STRING, description: 'Full sender address text', nullable: true },
          merchant:              { type: SchemaType.STRING, description: 'Marketplace merchant/OID owner name', nullable: true },

          // Consignee (ZONE B)
          consignee:             { type: SchemaType.STRING, description: 'Recipient full name', nullable: true },
          consigneeConfidence:   { type: SchemaType.NUMBER, description: 'Confidence 0.0–1.0 for consignee', nullable: true },
          phone:                 { type: SchemaType.STRING, description: 'Consignee mobile number (10 digits)', nullable: true },
          destination:           { type: SchemaType.STRING, description: 'Destination city name', nullable: true },
          destinationConfidence: { type: SchemaType.NUMBER, description: 'Confidence 0.0–1.0 for destination', nullable: true },
          pincode:               { type: SchemaType.STRING, description: '6-digit destination PIN code', nullable: true },
          pincodeConfidence:     { type: SchemaType.NUMBER, description: 'Confidence 0.0–1.0 for pincode', nullable: true },
          returnAddress:         { type: SchemaType.STRING, description: 'Return address if visible', nullable: true },

          // Weight / value (ZONES D, E)
          weight:                { type: SchemaType.NUMBER, description: 'Chargeable/actual weight in kg (numeric only)', nullable: true },
          weightConfidence:      { type: SchemaType.NUMBER, description: 'Confidence 0.0–1.0 for weight', nullable: true },
          amount:                { type: SchemaType.NUMBER, description: 'COD or declared value in ₹, 0 if absent', nullable: true },
          amountConfidence:      { type: SchemaType.NUMBER, description: 'Confidence 0.0–1.0 for amount', nullable: true },

          // Reference (ZONE F)
          orderNo:               { type: SchemaType.STRING, description: 'Order ID / OID / invoice reference', nullable: true },
          oid:                   { type: SchemaType.STRING, description: 'Alternate OID / bag ID if different from orderNo', nullable: true },

          // Debug
          rawText:               { type: SchemaType.STRING, description: 'FULL dump of ALL visible text on the label (not a summary)' },
        },
        required: ['success', 'awb'],
      },
    },
  });

  const prompt = buildPrompt(knownAwb, contextData);

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType } },
    ]);

    const parsed = JSON.parse(result.response.text());

    // Ensure known AWB is preserved
    if (knownAwb && (!parsed.awb || String(parsed.awb).trim().length < 6)) {
      parsed.awb = knownAwb;
    }

    const enhanced = enhanceParsedDetails(parsed, knownAwb);

    logger.info(
      `[OCR Vision] labelType=${enhanced.labelType||'?'} awb=${enhanced.awb||'NA'} ` +
      `courier=${enhanced.courier||'NA'} client=${enhanced.clientName||'NA'}(${(enhanced.clientNameConfidence||0).toFixed(2)}) ` +
      `consignee=${enhanced.consignee||'NA'}(${(enhanced.consigneeConfidence||0).toFixed(2)}) ` +
      `dest=${enhanced.destination||'NA'}(${(enhanced.destinationConfidence||0).toFixed(2)}) ` +
      `pin=${enhanced.pincode||'NA'} wt=${enhanced.weight||0} phone=${enhanced.phone||'NA'} order=${enhanced.orderNo||'NA'}`
    );

    return enhanced;
  } catch (error) {
    logger.error(`[OCR Vision Error]: ${error.message}`);
    throw new Error(`Vision AI Processing failed: ${error.message}`);
  }
};
