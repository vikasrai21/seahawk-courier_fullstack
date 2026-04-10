'use strict';
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const logger = require('../utils/logger');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let genAI;

if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
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

function enhanceParsedDetails(parsed = {}, knownAwb = '') {
  const rawText = normalizeRawText(parsed.rawText || '');
  const next = {
    ...parsed,
    awb: String(parsed.awb || knownAwb || '').trim(),
    rawText,
  };

  if (!next.courier) {
    if (/dtdc/i.test(rawText)) next.courier = 'DTDC';
    else if (/delhivery/i.test(rawText)) next.courier = 'Delhivery';
    else if (/trackon/i.test(rawText)) next.courier = 'Trackon';
  }

  // Regex fallbacks ONLY if Gemini didn't extract
  if (!next.pincode) {
    next.pincode = firstMatch(rawText, /\b(\d{6})\b/, 1);
  }

  if (!next.weight) {
    const weight = firstMatch(rawText, /\b(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilograms?)\b/i, 1);
    if (weight) next.weight = Number(weight);
  }

  if (!next.orderNo) {
    next.orderNo = firstMatch(
      rawText,
      /\b(?:order|oid|invoice|ref(?:erence)?)\s*(?:no|id|#)?\s*[:\-]?\s*([A-Z0-9\-\/]{4,})/i,
      1
    );
  }

  if (!next.clientName) {
    next.clientName = String(parsed.senderCompany || parsed.merchant || '').trim();
  }

  return next;
}

/**
 * Build the context-aware Gemini prompt with client names and correction history injected.
 */
function buildPrompt(knownAwb = '', contextData = {}) {
  const { clients = [], corrections = [], sessionContext = {} } = contextData;

  const clientList = clients.length
    ? clients.map((c) => `${c.code}: ${c.company}`).join('\n')
    : '(no client data available)';

  const correctionList = corrections.length
    ? corrections.map((c) => `"${c.original}" → "${c.corrected}" (${c.field}, seen ${c.count}x)`).join('\n')
    : '(no correction history yet)';

  const sessionHint = sessionContext.recentClient
    ? `Recent scans in this session were mostly for client: ${sessionContext.recentClient}`
    : 'No session context available.';

  return `You are an expert OCR AI for an Indian logistics company called Seahawk Courier & Cargo.
I am uploading an image of a courier waybill/slip. Carefully read ALL visible text.

KNOWN BARCODE:
- The barcode/AWB has already been scanned separately as: ${knownAwb || 'UNKNOWN'}
- If the image barcode is blurry or partially cut, DO NOT guess a different AWB.
- Prefer the known barcode above whenever plausible.

═══════════════════════════════════════════
KNOWN CLIENTS OF SEAHAWK (match sender/merchant against these):
${clientList}
═══════════════════════════════════════════

LEARNED CORRECTIONS (past OCR mistakes → correct values):
${correctionList}

SESSION CONTEXT:
${sessionHint}

═══════════════════════════════════════════
CRITICAL EXTRACTION RULES:
═══════════════════════════════════════════

1. "consignee": The RECIPIENT (labeled "To:", "Consignee:", "Recipient:"). Extract ONLY the name of the person or company RECEIVING the package.

2. "destination": The destination CITY name. Look at the bottom of the To/Consignee address block.
   - Extract the City name. If a 6-digit Indian pincode is visible, extract it too.
   - Common cities: NEW DELHI, MUMBAI, LUCKNOW, JAIPUR, DEHRADUN, BANGALORE, LUDHIANA, JALANDHAR, CHENNAI, COIMBATORE, VARANASI, PANCHKULA, NOIDA, KOLKATA, PUNE, KANPUR, CHANDIGARH, HYDERABAD, AHMEDABAD, SURAT.

3. "clientName": The SENDER, MERCHANT, SELLER, or ACCOUNT OWNER on the label. NOT the courier brand.
   - If the sender/merchant fuzzy-matches a known client from the list above, return that client name EXACTLY as listed.
   - If you've seen a correction pattern above, apply it automatically.

4. "pincode": Always a 6-digit number. Extract separately even if it's part of the address.

5. "weight": Numeric value in kg. If the label says "2.5kg" → weight is 2.5.

6. "amount": The declared value or COD amount if visible. Otherwise 0.

7. "orderNo": Order ID / OID / Reference / Invoice number if visible.

HANDWRITTEN TEXT:
Many Indian courier slips have handwritten consignee names and destinations.
Be EXTRA CAREFUL when reading handwritten text. If unsure, provide your best guess
and reflect that uncertainty in the confidence score (lower number).

CONFIDENCE SCORES:
For EACH field, provide a confidence score between 0.0 and 1.0.
- 1.0 = 100% certain (clearly printed, easy to read)
- 0.5 = somewhat uncertain (partially visible, minor blur)
- 0.1 = very uncertain (heavily blurred, barely readable)

Be conservative: leave fields blank rather than invent data.
Respond using the required JSON schema.`;
}

/**
 * Extracts AWB details from a courier slip image using Gemini Vision
 * with context-aware prompt injection.
 *
 * @param {string} base64Data - The pure base64 string of the image
 * @param {string} mimeType - e.g. "image/jpeg"
 * @param {object} options - { knownAwb, clients, corrections, sessionContext }
 */
exports.extractShipmentFromImage = async (base64Data, mimeType, options = {}) => {
  if (!genAI) {
    throw new Error('OCR Vision is locked: GEMINI_API_KEY is missing from environment variables.');
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
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          success: { type: SchemaType.BOOLEAN, description: "Whether an AWB or details were successfully found" },
          awb: { type: SchemaType.STRING, description: "The tracking number / AWB / Docket number" },
          courier: { type: SchemaType.STRING, description: "Detected courier name (e.g. Trackon, DTDC, Delhivery)", nullable: true },
          clientName: { type: SchemaType.STRING, description: "Detected sender/merchant/client who owns the shipment. Match against known clients if possible.", nullable: true },
          clientNameConfidence: { type: SchemaType.NUMBER, description: "Confidence 0.0–1.0 for clientName extraction", nullable: true },
          consignee: { type: SchemaType.STRING, description: "The recipient's full name", nullable: true },
          consigneeConfidence: { type: SchemaType.NUMBER, description: "Confidence 0.0–1.0 for consignee extraction", nullable: true },
          destination: { type: SchemaType.STRING, description: "The destination city", nullable: true },
          destinationConfidence: { type: SchemaType.NUMBER, description: "Confidence 0.0–1.0 for destination extraction", nullable: true },
          pincode: { type: SchemaType.STRING, description: "The 6-digit Indian destination pincode if present", nullable: true },
          pincodeConfidence: { type: SchemaType.NUMBER, description: "Confidence 0.0–1.0 for pincode extraction", nullable: true },
          senderName: { type: SchemaType.STRING, description: "Consignor/sender person name if present", nullable: true },
          senderCompany: { type: SchemaType.STRING, description: "Consignor/sender company name if present", nullable: true },
          senderAddress: { type: SchemaType.STRING, description: "Consignor/sender full address if present", nullable: true },
          returnAddress: { type: SchemaType.STRING, description: "Return address text if present", nullable: true },
          merchant: { type: SchemaType.STRING, description: "Merchant/Brand/OID owner name if present", nullable: true },
          oid: { type: SchemaType.STRING, description: "Order ID / OID / reference text if present", nullable: true },
          orderNo: { type: SchemaType.STRING, description: "Order number / order reference / invoice reference if visible", nullable: true },
          weight: { type: SchemaType.NUMBER, description: "The numerical weight in kg. E.g. if '2.5kg' is seen, write 2.5", nullable: true },
          weightConfidence: { type: SchemaType.NUMBER, description: "Confidence 0.0–1.0 for weight extraction", nullable: true },
          amount: { type: SchemaType.NUMBER, description: "The declared value or COD amount if written on the label, otherwise 0", nullable: true },
          amountConfidence: { type: SchemaType.NUMBER, description: "Confidence 0.0–1.0 for amount extraction", nullable: true },
          rawText: { type: SchemaType.STRING, description: "A brief summary of raw text read to aid debugging" }
        },
        required: ["success", "awb"]
      }
    }
  });

  const prompt = buildPrompt(knownAwb, contextData);

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ]);
    
    const parsed = JSON.parse(result.response.text());
    if (knownAwb && (!parsed.awb || String(parsed.awb).trim().length < 6)) {
      parsed.awb = knownAwb;
    }
    const enhanced = enhanceParsedDetails(parsed, knownAwb);

    logger.info(`[OCR Vision] awb=${enhanced.awb || 'NA'} courier=${enhanced.courier || 'NA'} client=${enhanced.clientName || 'NA'}(${enhanced.clientNameConfidence || '?'}) consignee=${enhanced.consignee || 'NA'}(${enhanced.consigneeConfidence || '?'}) dest=${enhanced.destination || 'NA'}(${enhanced.destinationConfidence || '?'}) pin=${enhanced.pincode || 'NA'} wt=${enhanced.weight || 0} order=${enhanced.orderNo || 'NA'}`);
    return enhanced;
  } catch (error) {
    logger.error(`[OCR Vision Error]: ${error.message}`);
    throw new Error(`Vision AI Processing failed: ${error.message}`);
  }
};
