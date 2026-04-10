'use strict';

const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const stringSimilarity = require('string-similarity');
const correctionLearner = require('./correctionLearner.service');

// ── Thresholds ──────────────────────────────────────────────────────────────
const AUTOFILL_THRESHOLD    = 0.85; // auto-fill without asking
const SUGGEST_THRESHOLD     = 0.55; // show in dropdown
const DEST_MATCH_THRESHOLD  = 0.80;
const CONSIGNEE_MATCH_THRESHOLD = 0.85;

function norm(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

// ── Client Resolution ───────────────────────────────────────────────────────

async function resolveClient(ocrClientName, sessionContext = {}) {
  if (!ocrClientName) return { matches: [], bestMatch: null };

  const clients = await prisma.client.findMany({
    where: { active: true },
    select: { code: true, company: true },
  });

  if (!clients.length) return { matches: [], bestMatch: null };

  const inputNorm = norm(ocrClientName);
  const matches = clients.map((c) => {
    const codeScore = stringSimilarity.compareTwoStrings(inputNorm, norm(c.code));
    const companyScore = stringSimilarity.compareTwoStrings(inputNorm, norm(c.company));
    let score = Math.max(codeScore, companyScore);

    // Session boosting: if this client was dominant in the current session, boost
    if (sessionContext.dominantClient && sessionContext.dominantClient === c.code) {
      score = Math.min(1.0, score + 0.12);
    }

    return { code: c.code, name: c.company, score: Math.round(score * 100) / 100 };
  }).sort((a, b) => b.score - a.score);

  const top = matches[0];
  const bestMatch = top && top.score >= SUGGEST_THRESHOLD ? top : null;
  const autoFill = top && top.score >= AUTOFILL_THRESHOLD;

  return {
    matches: matches.slice(0, 5),
    bestMatch,
    autoFill,
    needsConfirmation: bestMatch && !autoFill,
  };
}

// ── Consignee → Client Pattern ──────────────────────────────────────────────

async function resolveConsigneeClientPattern(consignee) {
  if (!consignee) return null;

  try {
    const patterns = await prisma.shipment.groupBy({
      by: ['clientCode'],
      where: {
        consignee: { equals: consignee, mode: 'insensitive' },
        clientCode: { not: 'MISC' },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 3,
    });

    if (patterns.length > 0 && patterns[0]._count.id >= 3) {
      return {
        suggestedClient: patterns[0].clientCode,
        count: patterns[0]._count.id,
        confidence: Math.min(0.95, 0.70 + patterns[0]._count.id * 0.02),
        alternatives: patterns.slice(1).map((p) => ({
          clientCode: p.clientCode,
          count: p._count.id,
        })),
      };
    }
    return null;
  } catch {
    return null;
  }
}

// ── Destination Fuzzy Match ─────────────────────────────────────────────────

async function resolveDestination(ocrDestination) {
  if (!ocrDestination) return null;

  try {
    const topDestinations = await prisma.shipment.groupBy({
      by: ['destination'],
      where: {
        destination: { not: null },
        NOT: [{ destination: '' }, { destination: 'UNKNOWN' }],
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 200,
    });

    if (!topDestinations.length) return null;

    const destNames = topDestinations.map((d) => norm(d.destination));
    const inputNorm = norm(ocrDestination);

    const result = stringSimilarity.findBestMatch(inputNorm, destNames);

    if (result.bestMatch.rating >= DEST_MATCH_THRESHOLD) {
      const correctedDest = topDestinations[result.bestMatchIndex].destination;
      if (norm(correctedDest) !== inputNorm) {
        return {
          corrected: correctedDest,
          confidence: Math.round(result.bestMatch.rating * 100) / 100,
          source: 'fuzzy_history',
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

// ── Pincode → City Auto-fill ────────────────────────────────────────────────

async function resolvePincodeCity(pincode) {
  if (!pincode || !/^\d{6}$/.test(String(pincode).trim())) return null;

  const pin = String(pincode).trim();

  try {
    // Try DelhiveryPincode table first
    const pinData = await prisma.delhiveryPincode.findUnique({
      where: { pincode: pin },
    });

    if (pinData?.facilityCity) {
      return {
        city: pinData.facilityCity.toUpperCase(),
        state: pinData.facilityState || null,
        oda: pinData.oda || false,
        source: 'delhivery_pincode',
        confidence: 0.95,
      };
    }

    // Fallback to India Post API
    try {
      const pincodeSvc = require('./pincode.service');
      const postData = await pincodeSvc.lookupPincode(pin);
      if (postData?.postOffice?.District) {
        return {
          city: postData.postOffice.District.toUpperCase(),
          state: postData.postOffice.State || null,
          oda: false,
          source: 'india_post',
          confidence: 0.90,
        };
      }
    } catch { /* non-blocking */ }

    return null;
  } catch {
    return null;
  }
}

// ── Weight Anomaly Detection ────────────────────────────────────────────────

function detectWeightAnomaly(weight) {
  const w = Number(weight || 0);
  if (w <= 0) return { anomaly: false };
  if (w > 100) return { anomaly: true, warning: `Weight ${w}kg is extremely high. Likely an OCR error.`, suggestedConfidence: 0.15 };
  if (w > 50)  return { anomaly: true, warning: `Weight ${w}kg seems unusually high. Verify manually.`, suggestedConfidence: 0.30 };
  if (w > 30)  return { anomaly: true, warning: `Weight ${w}kg is above normal parcel range. Please check.`, suggestedConfidence: 0.50 };
  return { anomaly: false };
}

// ── MAIN ORCHESTRATOR ───────────────────────────────────────────────────────

/**
 * Full intelligence pipeline: takes raw OCR output and enriches it with
 * learned corrections, fuzzy matching, pincode resolution, and session context.
 *
 * @param {object} ocrResult - Raw OCR output from Gemini
 * @param {object} options - { sessionContext }
 * @returns {object} Enriched result with _intelligence metadata
 */
async function resolveEntities(ocrResult = {}, options = {}) {
  const result = { ...ocrResult };
  const intelligence = {
    clientMatches: [],
    clientAutoFill: false,
    clientNeedsConfirmation: false,
    consigneeClientPattern: null,
    destinationCorrected: false,
    pincodeCity: null,
    pincodeState: null,
    pincodeODA: false,
    weightAnomaly: null,
    learnedFieldCount: 0,
    sources: {},
  };

  const sessionContext = options.sessionContext || {};

  // ── Step 1: Apply learned corrections first (instant, no AI needed) ─────
  try {
    await correctionLearner.applyLearnedCorrections(result);
    const learnedFields = ['clientName', 'consignee', 'destination'].filter(
      (f) => result[`${f}Source`] === 'learned'
    );
    intelligence.learnedFieldCount = learnedFields.length;
    learnedFields.forEach((f) => {
      intelligence.sources[f] = 'learned';
    });
  } catch (err) {
    logger.warn(`[Intelligence] Learned corrections failed: ${err.message}`);
  }

  // ── Step 2: Fuzzy client resolution ─────────────────────────────────────
  try {
    const clientRes = await resolveClient(result.clientName, sessionContext);
    intelligence.clientMatches = clientRes.matches;
    intelligence.clientAutoFill = clientRes.autoFill || false;
    intelligence.clientNeedsConfirmation = clientRes.needsConfirmation || false;

    if (clientRes.autoFill && clientRes.bestMatch) {
      result.clientCode = clientRes.bestMatch.code;
      result.clientName = clientRes.bestMatch.name;
      result.clientNameConfidence = clientRes.bestMatch.score;
      if (!intelligence.sources.clientName) {
        intelligence.sources.clientName = 'fuzzy_match';
      }
    }
  } catch (err) {
    logger.warn(`[Intelligence] Client resolution failed: ${err.message}`);
  }

  // ── Step 3: Consignee → Client pattern ──────────────────────────────────
  try {
    const consigneePattern = await resolveConsigneeClientPattern(result.consignee);
    if (consigneePattern) {
      intelligence.consigneeClientPattern = consigneePattern;
      // If client is still unknown but consignee pattern is strong, use it
      if ((!result.clientCode || result.clientCode === 'MISC') && consigneePattern.confidence >= 0.80) {
        result.clientCode = consigneePattern.suggestedClient;
        result.clientCodeConfidence = consigneePattern.confidence;
        intelligence.sources.clientCode = 'consignee_pattern';
      }
    }
  } catch (err) {
    logger.warn(`[Intelligence] Consignee pattern failed: ${err.message}`);
  }

  // ── Step 4: Destination fuzzy match ─────────────────────────────────────
  try {
    if (result.destination && result.destinationSource !== 'learned') {
      const destFix = await resolveDestination(result.destination);
      if (destFix) {
        result._original_destination = result._original_destination || result.destination;
        result.destination = destFix.corrected;
        result.destinationConfidence = destFix.confidence;
        intelligence.destinationCorrected = true;
        intelligence.sources.destination = destFix.source;
      }
    }
  } catch (err) {
    logger.warn(`[Intelligence] Destination resolution failed: ${err.message}`);
  }

  // ── Step 5: Pincode → City auto-fill ────────────────────────────────────
  try {
    const pincode = result.pincode;
    if (pincode) {
      const cityData = await resolvePincodeCity(pincode);
      if (cityData) {
        intelligence.pincodeCity = cityData.city;
        intelligence.pincodeState = cityData.state;
        intelligence.pincodeODA = cityData.oda;

        // Auto-fill destination if empty or low confidence
        if (!result.destination || result.destination === 'UNKNOWN' ||
            (result.destinationConfidence || 0) < 0.50) {
          result.destination = cityData.city;
          result.destinationConfidence = cityData.confidence;
          intelligence.sources.destination = cityData.source;
        }
      }
    }
  } catch (err) {
    logger.warn(`[Intelligence] Pincode resolution failed: ${err.message}`);
  }

  // ── Step 6: Weight anomaly detection ────────────────────────────────────
  const weightCheck = detectWeightAnomaly(result.weight);
  if (weightCheck.anomaly) {
    intelligence.weightAnomaly = weightCheck;
    result.weightConfidence = Math.min(
      result.weightConfidence || 0.5,
      weightCheck.suggestedConfidence
    );
  }

  result._intelligence = intelligence;
  return result;
}

// ── Get active clients for OCR prompt injection ─────────────────────────────

async function getActiveClientsForPrompt() {
  try {
    const clients = await prisma.client.findMany({
      where: { active: true },
      select: { code: true, company: true },
      orderBy: { code: 'asc' },
    });
    return clients;
  } catch {
    return [];
  }
}

module.exports = {
  resolveEntities,
  resolveClient,
  resolveConsigneeClientPattern,
  resolveDestination,
  resolvePincodeCity,
  detectWeightAnomaly,
  getActiveClientsForPrompt,
};
