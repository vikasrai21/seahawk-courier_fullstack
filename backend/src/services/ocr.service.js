'use strict';
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const logger = require('../utils/logger');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let genAI;

if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

/**
 * Extracts AWB details from a courier slip image using Gemini 2.0 Flash Vision
 * @param {string} base64Data - The pure base64 string of the image (without data:image/... prefix)
 * @param {string} mimeType - e.g. "image/jpeg"
 */
exports.extractShipmentFromImage = async (base64Data, mimeType) => {
  if (!genAI) {
    throw new Error('OCR Vision is locked: GEMINI_API_KEY is missing from environment variables.');
  }

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
          clientName: { type: SchemaType.STRING, description: "Detected sender, merchant, or client account name that owns the shipment label", nullable: true },
          consignee: { type: SchemaType.STRING, description: "The recipient's full name", nullable: true },
          destination: { type: SchemaType.STRING, description: "The destination city or full address", nullable: true },
          pincode: { type: SchemaType.STRING, description: "The 6-digit Indian destination pincode if present", nullable: true },
          senderName: { type: SchemaType.STRING, description: "Consignor/sender person name if present", nullable: true },
          senderCompany: { type: SchemaType.STRING, description: "Consignor/sender company name if present", nullable: true },
          senderAddress: { type: SchemaType.STRING, description: "Consignor/sender full address if present", nullable: true },
          returnAddress: { type: SchemaType.STRING, description: "Return address text if present", nullable: true },
          merchant: { type: SchemaType.STRING, description: "Merchant/Brand/OID owner name if present", nullable: true },
          oid: { type: SchemaType.STRING, description: "Order ID / OID / reference text if present", nullable: true },
          orderNo: { type: SchemaType.STRING, description: "Order number / order reference / invoice reference if visible on the label", nullable: true },
          weight: { type: SchemaType.NUMBER, description: "The numerical weight in kg. E.g. if '2.5kg' is seen, write 2.5", nullable: true },
          amount: { type: SchemaType.NUMBER, description: "The declared value or COD amount if written on the label, otherwise 0", nullable: true },
          rawText: { type: SchemaType.STRING, description: "A brief summary of raw text read to aid debugging" }
        },
        required: ["success", "awb"]
      }
    }
  });

  const prompt = `You are an expert OCR AI for Indian logistics and courier parsing. 
I am uploading an image of a courier waybill/slip.
Carefully read ALL the text provided on the slip.

CRITICAL EXTRACTION RULES for Consignee and Destination:
1. "consignee": This is usually labeled "To:", "Consignee:", or "Recipient:". Extract ONLY the name of the person or company receiving the package. (e.g., "VILAS VADLA", "RANJAN KUMAR", "ARICOM ENTERPRISES").
2. "destination": Look for the Destination City and Pincode at the bottom of the To/Consignee address block. 
   - You MUST extract the City name. 
   - If there is a 6-digit Indian Pincode, extract it too. (e.g., "NEW DELHI 110001" or "PANCHKULA"). 
   - VERY IMPORTANT: Sometimes the Pincode is missing. That is okay, just extract the City name in that case.
   - Here are some common destination cities you should be ready to recognize: NEW DELHI, MUMBAI, LUCKNOW, JAIPUR, DEHRADUN, BANGALORE, LUDHIANA, JALANDHAR, CHENNAI, COIMBATORE, VARANASI, PANCHKULA, NOIDA, KOLKOTTA, PUNE, KANPUR.

OTHER FIELDS:
Extract the AWB Number (usually labeled Tracking, Docket, or AWB), sender/consignor details, return address, merchant/brand or OID/reference, destination pincode, declared value, and any weight values.
If you can identify the client/merchant/account owner from sender text, merchant text, or branding, put it in clientName.
If order reference text appears as OID / Order ID / Ref / Invoice / Order No, map the best value into orderNo.
If you recognize the carrier's logo (like Trackon, DTDC, Delhivery, BlueDart), specify the courier name.
Respond using the required JSON schema mapping. If you cannot find any tracking number or slip info, set success to false.`;

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
    
    return JSON.parse(result.response.text());
  } catch (error) {
    logger.error(`[OCR Vision Error]: ${error.message}`);
    throw new Error(`Vision AI Processing failed: ${error.message}`);
  }
};
