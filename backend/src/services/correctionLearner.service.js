'use strict';

const prisma = require('../config/prisma');
const logger = require('../utils/logger');

const TRACKED_FIELDS = ['clientName', 'clientCode', 'consignee', 'destination', 'pincode', 'weight'];
const FIELD_MIN_COUNTS = {
  clientName: 1,
  clientCode: 2,
  consignee: 1,
  destination: 1,
  pincode: 1,
  weight: 2,
};

function normalize(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Record a single correction.
 * Upserts — if the same (field, original) pair already exists, increment count.
 */
async function saveCorrection({ field, original, corrected }) {
  const normOriginal = normalize(original);
  const normCorrected = normalize(corrected);

  if (!normOriginal || !normCorrected || normOriginal === normCorrected) return null;

  try {
    const row = await prisma.scanCorrection.upsert({
      where: { field_original: { field, original: normOriginal } },
      create: { field, original: normOriginal, corrected: normCorrected, count: 1 },
      update: { corrected: normCorrected, count: { increment: 1 } },
    });
    logger.info(`[Learning] ${field}: "${normOriginal}" → "${normCorrected}" (count=${row.count})`);
    return row;
  } catch (err) {
    logger.warn(`[Learning] Save correction failed: ${err.message}`);
    return null;
  }
}

/**
 * Record corrections by comparing OCR-extracted fields to user-approved fields.
 */
async function recordCorrections(ocrFields = {}, approvedFields = {}) {
  const saved = [];

  for (const field of TRACKED_FIELDS) {
    const original = normalize(ocrFields[field] || '');
    const corrected = normalize(approvedFields[field] || '');

    if (!original || !corrected) continue;
    if (original === corrected) continue;

    const row = await saveCorrection({ field, original, corrected });
    if (row) saved.push(row);
  }

  return saved;
}

/**
 * Look up a single correction for a given field + OCR value.
 * Returns the corrected value + confidence if the correction has been seen ≥ 2 times.
 */
async function lookupCorrection(field, ocrValue) {
  const normValue = normalize(ocrValue);
  if (!normValue) return null;

  try {
    const match = await prisma.scanCorrection.findUnique({
      where: { field_original: { field, original: normValue } },
    });

    const minCount = FIELD_MIN_COUNTS[field] || 2;
    if (match && match.count >= minCount) {
      return {
        corrected: match.corrected,
        confidence: Math.min(0.99, 0.78 + match.count * 0.03),
        count: match.count,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Apply learned corrections to an OCR result object in-place.
 * Modifies the fields and adds metadata about the source.
 */
async function applyLearnedCorrections(ocrResult = {}) {
  for (const field of TRACKED_FIELDS) {
    if (!ocrResult[field]) continue;

    const learned = await lookupCorrection(field, ocrResult[field]);
    if (learned) {
      ocrResult[`_original_${field}`] = ocrResult[field];
      ocrResult[field] = learned.corrected;
      ocrResult[`${field}Confidence`] = learned.confidence;
      ocrResult[`${field}Source`] = 'learned';
    }
  }

  return ocrResult;
}

async function getCorrectionMetrics() {
  try {
    const [rows, aggregate] = await Promise.all([
      prisma.scanCorrection.groupBy({
        by: ['field'],
        _count: { id: true },
        _sum: { count: true },
        orderBy: { _sum: { count: 'desc' } },
      }),
      prisma.scanCorrection.aggregate({
        _count: { id: true },
        _sum: { count: true },
      }),
    ]);

    return {
      distinctPairs: aggregate?._count?.id || 0,
      totalCorrectionsObserved: aggregate?._sum?.count || 0,
      byField: rows.map((row) => ({
        field: row.field,
        distinctPairs: row?._count?.id || 0,
        totalCorrectionsObserved: row?._sum?.count || 0,
      })),
    };
  } catch {
    return {
      distinctPairs: 0,
      totalCorrectionsObserved: 0,
      byField: [],
    };
  }
}

/**
 * Get the top N corrections by frequency. Used to inject into the Gemini prompt.
 */
async function getTopCorrections(limit = 20) {
  try {
    return await prisma.scanCorrection.findMany({
      orderBy: { count: 'desc' },
      take: limit,
      select: { field: true, original: true, corrected: true, count: true },
    });
  } catch {
    return [];
  }
}

/**
 * Discover new client aliases — corrections that have been applied 5+ times
 * and should be considered reliable enough to become permanent aliases.
 */
async function discoverNewAliases() {
  try {
    return await prisma.scanCorrection.findMany({
      where: {
        field: { in: ['clientName', 'clientCode'] },
        count: { gte: 5 },
      },
      select: { original: true, corrected: true, count: true },
      orderBy: { count: 'desc' },
    });
  } catch {
    return [];
  }
}

module.exports = {
  saveCorrection,
  recordCorrections,
  lookupCorrection,
  applyLearnedCorrections,
  getTopCorrections,
  discoverNewAliases,
  getCorrectionMetrics,
  normalize,
};
