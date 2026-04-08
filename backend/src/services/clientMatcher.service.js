'use strict';
const prisma = require('../config/prisma');

// ── Score weights for different signal types ────────────────────────────────
const SCORE = {
  ALIAS_EXACT:           100,  // Hardcoded alias from training data → instant match
  OID_EXACT:              95,  // Delhivery OID matches client code/company exactly
  AWB_PREFIX:             80,  // AWB prefix pattern matches a known client
  CODE_IN_TEXT:           42,  // Client code found verbatim in OCR text
  COMPANY_IN_TEXT:        34,  // Company name found verbatim in OCR text
  SENDER_COMPANY_MATCH:  50,  // Sender/consignor company matches a known alias
  RETURN_ADDRESS_MATCH:  40,  // Return address contains client-linked keywords
  CONSIGNEE_OVERLAP:     18,  // Consignee name overlaps with company tokens
  DESTINATION_OVERLAP:   12,  // Destination overlaps with client address
  ADDRESS_OVERLAP:       20,  // Address token overlap
  NOTES_OVERLAP:          8,  // Notes/alias overlap
  HISTORY_SAME_CONSIGNEE:     24,
  HISTORY_SAME_DESTINATION:   16,
};

// ── Alias map: trained from March 2026 Excel + label images ─────────────────
// Keys are UPPERCASE normalised phrases found in OCR text (sender, OID, etc.)
// Values are the client codes they correspond to.
// This is the "brain" that makes instant predictions without needing database history.
const TRAINED_ALIASES = {
  // VALUE / VALUE SHOPPE (Delhivery OID labels)
  'VALUE SHOPPE':         'VALUE',
  'VALUE SHOP':           'VALUE',
  'VALUESHOPPE':          'VALUE',

  // TECSIDEL (DTDC labels, sender = "TECSIDEL INDIA P LTD")
  'TECSIDEL':             'TECSIDEL',
  'TECSIDEL INDIA':       'TECSIDEL',
  'TECSIDEL INDIA P LTD': 'TECSIDEL',
  'TECSIDEL INDIA PVT':   'TECSIDEL',

  // TS / T S SEWING MACHINE (DTDC labels)
  'T S SEWING':           'TS',
  'T S SEWING MACHINE':   'TS',
  'TS SEWING':            'TS',
  'TS SEWING MACHINE':    'TS',

  // NORMA (dominant client, 274 shipments)
  'NORMA':                'NORMA',

  // SEAHAWK own shipments (return address on Delhivery labels)
  'SEAHAWKCOURIERCARGORP':      'SEA HAWK',
  'SEAHAWK COURIER':            'SEA HAWK',
  'SEA HAWK COURIER':           'SEA HAWK',
  'SEAHAWKCOURIERCARGORP B2BR': 'SEA HAWK',

  // ALOK
  'ALOK':                 'ALOK',

  // DORABI
  'DORABI':               'DORABI',

  // LIFUNG
  'LIFUNG':               'LIFUNG',
  'LI FUNG':              'LIFUNG',
  'LI AND FUNG':          'LIFUNG',

  // SPL
  'SPL':                  'SPL',

  // DRYLICIOUS
  'DRYLICIOUS':           'DRYLICIOUS',
  'DRY LICIOUS':          'DRYLICIOUS',

  // ELCON
  'ELCON':                'ELCON',

  // OMNICOM
  'OMNICOM':              'OMNICOM',
  'OMNICOM MEDIA':        'OMNICOM',

  // VARDHMAN
  'VARDHMAN':             'VARDHMAN',

  // DEHN
  'DEHN':                 'DEHN',

  // COMART
  'COMART':               'COMART',

  // LIFE ESSEN
  'LIFE ESSEN':           'LIFE ESSEN',
  'LIFE ESSENTIALS':      'LIFE ESSEN',

  // SILHOTE
  'SILHOTE':              'SILHOTE',

  // SUNVISOR
  'SUNVISOR':             'SUNVISOR',
  'SUN VISOR':            'SUNVISOR',

  // DM
  'DM':                   'DM',

  // DAKSH
  'DAKSH':                'DAKSH',

  // CML
  'CML':                  'CML',

  // INTELEMAX
  'INTELEMAX':            'INTELEMAX',

  // ASHOK
  'ASHOK':                'ASHOK',

  // A ONE
  'A ONE':                'A ONE',

  // INFINITY
  'INFINITY':             'INFINITY',

  // SI INTERPACK (seen on TS labels as consignee)
  'SI INTERPACK':         'TS',
  'S I INTERPACK':        'TS',
  'SI INTERPACK PVT':     'TS',
};

// ── AWB prefix patterns trained from Excel data ─────────────────────────────
// Some clients have distinctive AWB number patterns
const AWB_PREFIX_RULES = [
  { pattern: /^29904710/,        clientCode: 'VALUE' },    // Delhivery VALUE SHOPPE
  { pattern: /^D[0-9]{10}$/,     clientCode: null },       // Generic DTDC, don't auto-assign
  { pattern: /^X1000/,           clientCode: null },       // PLUS courier, multiple clients
  { pattern: /^V1000/,           clientCode: null },       // PLUS courier, multiple clients
  { pattern: /^Z66/,             clientCode: null },       // DTDC, multiple clients use this
];

// ── Helper functions ────────────────────────────────────────────────────────

function normalize(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value) {
  return normalize(value)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !/^\d+$/.test(token));
}

function overlapScore(textTokens, candidateTokens, maxPoints, weight = 1) {
  if (!textTokens.length || !candidateTokens.length) return 0;
  const set = new Set(textTokens);
  const matches = candidateTokens.filter((token) => set.has(token)).length;
  return Math.min(maxPoints, Math.round(matches * weight));
}

/**
 * Check if any trained alias phrase appears in the merged text.
 * Returns the client code if found, null otherwise.
 */
function findAliasMatch(mergedText) {
  const norm = normalize(mergedText);
  // Sort aliases by length descending so longer (more specific) phrases match first
  const sortedAliases = Object.entries(TRAINED_ALIASES)
    .sort((a, b) => b[0].length - a[0].length);

  for (const [phrase, clientCode] of sortedAliases) {
    if (norm.includes(phrase)) {
      return { clientCode, phrase };
    }
  }
  return null;
}

/**
 * Check if AWB matches a known client prefix pattern.
 */
function findAwbPrefixMatch(awb) {
  if (!awb) return null;
  const awbStr = String(awb).trim();
  for (const rule of AWB_PREFIX_RULES) {
    if (rule.pattern.test(awbStr) && rule.clientCode) {
      return rule.clientCode;
    }
  }
  return null;
}

// ── History boost from past shipments ───────────────────────────────────────

async function getHistoryBoost({ consignee, destination }) {
  const where = {
    clientCode: { not: 'MISC' },
    OR: [],
  };

  if (consignee) {
    where.OR.push({ consignee: { equals: consignee, mode: 'insensitive' } });
  }
  if (destination) {
    where.OR.push({ destination: { equals: destination, mode: 'insensitive' } });
  }

  if (where.OR.length === 0) return {};

  const rows = await prisma.shipment.findMany({
    where,
    select: { clientCode: true, consignee: true, destination: true },
    take: 120,
    orderBy: { updatedAt: 'desc' },
  });

  return rows.reduce((acc, row) => {
    const key = row.clientCode;
    if (!acc[key]) acc[key] = { consignee: 0, destination: 0 };
    if (consignee && normalize(row.consignee) === normalize(consignee)) acc[key].consignee += 1;
    if (destination && normalize(row.destination) === normalize(destination)) acc[key].destination += 1;
    return acc;
  }, {});
}

// ── Main suggestion engine ──────────────────────────────────────────────────

async function suggestClientForShipment(shipment, ocrHints = null) {
  const clients = await prisma.client.findMany({
    where: { active: true },
    select: { code: true, company: true, address: true, notes: true },
    orderBy: { code: 'asc' },
  });

  if (!clients.length) {
    return {
      suggestedClientCode: null,
      suggestedClientName: null,
      confidence: 0,
      needsConfirmation: true,
      shouldAutoAssign: false,
      topCandidates: [],
    };
  }

  // ── Build merged text from all available signals ────────────────────────
  const allSignals = [
    ocrHints?.rawText,
    ocrHints?.senderName,
    ocrHints?.senderCompany,
    ocrHints?.senderAddress,
    ocrHints?.returnAddress,
    ocrHints?.merchant,
    ocrHints?.oid,
    shipment?.consignee,
    shipment?.destination,
    shipment?.remarks,
  ].filter(Boolean);

  const mergedText = normalize(allSignals.join(' '));
  const mergedTokens = tokenize(mergedText);
  const consigneeTokens = tokenize(shipment?.consignee);
  const destinationTokens = tokenize(shipment?.destination);

  // ── FAST PATH: Alias matching (trained from your Excel + images) ────────
  // Check OID specifically first (Delhivery labels have "OID: VALUE SHOPPE")
  const oidText = normalize(ocrHints?.oid);
  const senderCompanyText = normalize(ocrHints?.senderCompany);
  const senderNameText = normalize(ocrHints?.senderName);
  const returnAddrText = normalize(ocrHints?.returnAddress);

  // Try alias match on individual high-signal fields first, then merged text
  const aliasMatch =
    (oidText && findAliasMatch(oidText)) ||
    (senderCompanyText && findAliasMatch(senderCompanyText)) ||
    (senderNameText && findAliasMatch(senderNameText)) ||
    (returnAddrText && findAliasMatch(returnAddrText)) ||
    findAliasMatch(mergedText);

  // ── FAST PATH: AWB prefix matching ──────────────────────────────────────
  const awbPrefixMatch = findAwbPrefixMatch(shipment?.awb);

  // ── History boost ───────────────────────────────────────────────────────
  const historyBoost = await getHistoryBoost({
    consignee: shipment?.consignee || '',
    destination: shipment?.destination || '',
  });

  // ── Score every client ──────────────────────────────────────────────────
  const scored = clients.map((client) => {
    let score = 0;
    const reasons = [];
    const codeNorm = normalize(client.code);
    const companyNorm = normalize(client.company);
    const companyTokens = tokenize(client.company);
    const addressTokens = tokenize(client.address);
    const notesTokens = tokenize(client.notes);

    // ── Trained alias match (highest signal) ────────────────────────────
    if (aliasMatch && aliasMatch.clientCode === client.code) {
      score += SCORE.ALIAS_EXACT;
      reasons.push(`trained alias: "${aliasMatch.phrase}"`);
    }

    // ── OID exact match against client code/company ─────────────────────
    if (oidText && (codeNorm === oidText || companyNorm === oidText || companyNorm.includes(oidText) || oidText.includes(companyNorm))) {
      score += SCORE.OID_EXACT;
      reasons.push('OID matches client');
    }

    // ── AWB prefix match ────────────────────────────────────────────────
    if (awbPrefixMatch && awbPrefixMatch === client.code) {
      score += SCORE.AWB_PREFIX;
      reasons.push('AWB prefix pattern match');
    }

    // ── Sender/consignor company match ──────────────────────────────────
    if (senderCompanyText && (senderCompanyText.includes(codeNorm) || senderCompanyText.includes(companyNorm) || companyNorm.includes(senderCompanyText))) {
      score += SCORE.SENDER_COMPANY_MATCH;
      reasons.push('sender company matches client');
    }

    // ── Return address match ────────────────────────────────────────────
    if (returnAddrText && addressTokens.length) {
      const returnTokens = tokenize(returnAddrText);
      const returnOverlap = overlapScore(returnTokens, addressTokens, SCORE.RETURN_ADDRESS_MATCH, 5);
      if (returnOverlap > 0) {
        score += returnOverlap;
        reasons.push('return address overlap');
      }
    }

    // ── Client code found in OCR text ───────────────────────────────────
    if (codeNorm && codeNorm.length >= 2 && mergedText.includes(codeNorm)) {
      score += SCORE.CODE_IN_TEXT;
      reasons.push('client code in label text');
    }

    // ── Company name found verbatim in OCR text ─────────────────────────
    if (companyNorm && mergedText.includes(companyNorm)) {
      score += SCORE.COMPANY_IN_TEXT;
      reasons.push('company name exact match');
    }

    // ── Company token overlap ───────────────────────────────────────────
    const companyOverlap = overlapScore(mergedTokens, companyTokens, SCORE.COMPANY_IN_TEXT - 6, 4);
    if (companyOverlap > 0) {
      score += companyOverlap;
      reasons.push('company token overlap');
    }

    // ── Consignee similarity ────────────────────────────────────────────
    const consigneeOverlap = overlapScore(consigneeTokens, companyTokens, SCORE.CONSIGNEE_OVERLAP, 4);
    if (consigneeOverlap > 0) {
      score += consigneeOverlap;
      reasons.push('consignee similarity');
    }

    // ── Destination-address overlap ─────────────────────────────────────
    const destinationOverlap = overlapScore(destinationTokens, addressTokens, SCORE.DESTINATION_OVERLAP, 2);
    if (destinationOverlap > 0) {
      score += destinationOverlap;
      reasons.push('destination-address overlap');
    }

    // ── Address token overlap ───────────────────────────────────────────
    const addressOverlap = overlapScore(mergedTokens, addressTokens, SCORE.ADDRESS_OVERLAP, 2);
    if (addressOverlap > 0) {
      score += addressOverlap;
      reasons.push('address token overlap');
    }

    // ── Notes/alias overlap ─────────────────────────────────────────────
    const notesOverlap = overlapScore(mergedTokens, notesTokens, SCORE.NOTES_OVERLAP, 1.5);
    if (notesOverlap > 0) {
      score += notesOverlap;
      reasons.push('notes alias overlap');
    }

    // ── Historical patterns ─────────────────────────────────────────────
    const hist = historyBoost[client.code];
    if (hist?.consignee) {
      score += Math.min(SCORE.HISTORY_SAME_CONSIGNEE, hist.consignee * 8);
      reasons.push('historical consignee match');
    }
    if (hist?.destination) {
      score += Math.min(SCORE.HISTORY_SAME_DESTINATION, hist.destination * 5);
      reasons.push('historical destination match');
    }

    return {
      code: client.code,
      company: client.company,
      score,
      reasons,
    };
  }).sort((a, b) => b.score - a.score);

  const top = scored[0];
  const second = scored[1] || { score: 0 };
  const confidence = Math.max(0, Math.min(99, top?.score || 0));
  const scoreGap = (top?.score || 0) - (second?.score || 0);

  // ── Decision thresholds ───────────────────────────────────────────────
  // If alias or OID matched, auto-assign with very high confidence
  const hasAliasOrOidSignal = (aliasMatch && top?.code === aliasMatch.clientCode) ||
    (awbPrefixMatch && top?.code === awbPrefixMatch);
  const shouldAutoAssign = hasAliasOrOidSignal || (confidence >= 88 && scoreGap >= 16);
  const hasStrongSignal = confidence >= 50;
  const needsConfirmation = !shouldAutoAssign && hasStrongSignal;

  if (!hasStrongSignal) {
    return {
      suggestedClientCode: null,
      suggestedClientName: null,
      confidence,
      needsConfirmation: true,
      shouldAutoAssign: false,
      topCandidates: scored.slice(0, 5),
    };
  }

  return {
    suggestedClientCode: top.code,
    suggestedClientName: top.company,
    confidence,
    needsConfirmation,
    shouldAutoAssign,
    topCandidates: scored.slice(0, 5),
  };
}

module.exports = {
  suggestClientForShipment,
  // Exported for testing / admin usage
  TRAINED_ALIASES,
  findAliasMatch,
  findAwbPrefixMatch,
};
