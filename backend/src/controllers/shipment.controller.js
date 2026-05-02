// src/controllers/shipment.controller.js
const svc          = require('../services/shipment.service');
const importLedger = require('../services/import-ledger.service');
const stateMachine = require('../services/stateMachine');
const { auditLog } = require('../utils/audit');
const R = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const prisma = require('../config/prisma');

const getAll = asyncHandler(async (req, res) => {
  const {
    client,
    clientCode,
    courier,
    status,
    filter,
    date_from,
    dateFrom,
    date_to,
    dateTo,
    q,
    search,
    sortBy,
    sortDir,
    includeDetails,
    details,
    page = 1,
    limit = 50,
  } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(5000, Math.max(10, parseInt(limit, 10) || 50));
  const { shipments, total, stats } = await svc.getAll(
    {
      client: client || clientCode,
      courier,
      status,
      filter,
      dateFrom: date_from || dateFrom,
      dateTo: date_to || dateTo,
      q: q || search,
      sortBy,
      sortDir,
    },
    pageNum,
    limitNum,
    includeDetails === '1' || includeDetails === 'true' || details === '1' || details === 'true'
  );
  R.paginated(res, shipments, total, pageNum, limitNum, 'Success', stats);
});

const getOne = asyncHandler(async (req, res) => {
  const s = await svc.getById(req.params.id);
  R.ok(res, s);
});

const create = asyncHandler(async (req, res) => {
  if (req.query?.dryRun === '1' || req.query?.dryRun === 'true') {
    const simulation = await svc.simulateShipment(req.body);
    return R.ok(res, { dryRun: true, simulation }, 'Shipment dry run completed');
  }
  const s = await svc.create(req.body, req.user?.id);
  await auditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'CREATE', entity: 'SHIPMENT', entityId: s.id, newValue: s, ip: req.ip });
  R.created(res, s, 'Shipment created');
});

const update = asyncHandler(async (req, res) => {
  const old = await svc.getById(req.params.id);
  const s   = await svc.update(req.params.id, req.body, req.user?.id);
  await auditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'UPDATE', entity: 'SHIPMENT', entityId: s.id, oldValue: old, newValue: s, ip: req.ip });
  R.ok(res, s, 'Shipment updated');
});

const patchStatus = asyncHandler(async (req, res) => {
  const old = await svc.getById(req.params.id);
  const s   = await svc.updateStatus(req.params.id, req.body.status, req.user?.id);
  await auditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'STATUS_CHANGE', entity: 'SHIPMENT', entityId: s.id, oldValue: { status: old.status }, newValue: { status: s.status }, ip: req.ip });
  R.ok(res, s);
});

const manualStatus = asyncHandler(async (req, res) => {
  const old = await svc.getById(req.params.id);
  const s   = await svc.forceUpdateStatus(req.params.id, req.body.status, req.user?.id, req.body.note);
  await auditLog({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'MANUAL_STATUS_OVERRIDE',
    entity: 'SHIPMENT',
    entityId: s.id,
    oldValue: { status: old.status },
    newValue: { status: s.status, note: req.body.note || '' },
    ip: req.ip,
  });
  R.ok(res, s, 'Shipment status manually updated');
});

const remove = asyncHandler(async (req, res) => {
  const old = await svc.getById(req.params.id);
  await svc.remove(req.params.id);
  await auditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'DELETE', entity: 'SHIPMENT', entityId: req.params.id, oldValue: old, ip: req.ip });
  R.ok(res, null, 'Shipment deleted');
});

const bulkImport = asyncHandler(async (req, res) => {
  const result = await svc.bulkImport(req.body.shipments, req.user?.id);
  await auditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'BULK_IMPORT', entity: 'SHIPMENT', newValue: { importedRows: result.imported, operationalCreated: result.operationalCreated, duplicateAwbs: result.duplicates, batchKey: result.batchKey }, ip: req.ip });
  R.ok(res, result, `Imported ${result.imported} rows`);
});

const getValidStatuses = asyncHandler(async (req, res) => {
  const s = await svc.getById(req.params.id);
  const transitions = stateMachine.getValidTransitions(s.status);
  R.ok(res, { currentStatus: s.status, validTransitions: transitions, isTerminal: transitions.length === 0 });
});

const getTodayStats = asyncHandler(async (req, res) => {
  const stats = await svc.getTodayStats();
  R.ok(res, stats);
});

const getImportLedger = asyncHandler(async (req, res) => {
  const {
    date_from,
    date_to,
    q,
    batch_key,
    page = 1,
    limit = 50,
  } = req.query;

  const [list, summary] = await Promise.all([
    importLedger.listRows({ dateFrom: date_from, dateTo: date_to, q, batchKey: batch_key }, page, limit),
    importLedger.getSummary({ dateFrom: date_from, dateTo: date_to, q }),
  ]);

  res.status(200).json({
    success: true,
    message: 'Success',
    data: {
      rows: list.rows,
      summary,
    },
    pagination: {
      total: list.total,
      page: list.page,
      limit: list.limit,
      pages: Math.ceil(list.total / list.limit),
    },
  });
});

const getMonthlyStats = asyncHandler(async (req, res) => {
  const year  = parseInt(req.query.year)  || new Date().getFullYear();
  const month = parseInt(req.query.month) || new Date().getMonth() + 1;
  const rows  = await svc.getMonthlyStats(year, month);
  R.ok(res, rows);
});

async function maybeLinkDraftToScan(shipment, ocrHints, clientCode, effectiveAwb) {
  if (!shipment || !ocrHints || !clientCode) return null;
  const draftSvc = require('../services/draftOrder.service');
  const logger = require('../utils/logger');
  try {
    const draft = await draftSvc.autoDiscoverDraft(clientCode, ocrHints);
    if (!draft) return null;
    await draftSvc.linkToShipment(draft.id, shipment.id);
    logger.info(`[Auto-Bind] Linked physical AWB ${effectiveAwb} to Draft Order #${draft.id}`);
    return draft.id;
  } catch (err) {
    logger.warn(`[Auto-Bind] Failed to evaluate draft linking: ${err.message}`);
    return null;
  }
}

const scanAwb = asyncHandler(async (req, res) => {
  let ocrHints = null;
  const scannerFlow = require('../services/scannerFlow.service');
  const sessionDate = (req.body.sessionContext?.sessionDate || '').trim();
  const lookup = req.body.awb
    ? await scannerFlow.resolveLookupPrefill(req.body.awb, req.body.courier || '')
    : { hints: null };
  if (req.body.imageBase64 || req.body.focusImageBase64) {
    try {
      const { extractShipmentFromImage } = require('../services/ocr.service');
      const intelligenceEngine = require('../services/intelligenceEngine.service');
      const correctionLearner = require('../services/correctionLearner.service');

      // Build context for the AI prompt
      const [clients, corrections] = await Promise.all([
        intelligenceEngine.getActiveClientsForPrompt(),
        correctionLearner.getTopCorrections(20),
      ]);
      const sessionContext = req.body.sessionContext || {};

      const scoreOcr = (details) => {
        if (!details?.success) return 0;
        return [
          details.clientName,
          details.consignee,
          details.destination,
          details.pincode,
          details.orderNo,
          details.weight,
          details.amount,
        ].filter((value) => {
          if (typeof value === 'number') return value > 0;
          return String(value || '').trim().length > 0;
        }).length;
      };

      const ocrOptions = { knownAwb: req.body.awb, clients, corrections, sessionContext };

      const attempts = [];
      if (req.body.focusImageBase64) attempts.push({ label: 'focus', image: req.body.focusImageBase64 });
      if (req.body.imageBase64) attempts.push({ label: 'full', image: req.body.imageBase64 });

      let bestExtracted = null;
      let bestScore = -1;

      for (const attempt of attempts) {
        const extracted = await extractShipmentFromImage(attempt.image, 'image/jpeg', ocrOptions);
        if (!extracted?.success) continue;

        const currentScore = scoreOcr(extracted);
        if (currentScore > bestScore) {
          bestExtracted = extracted;
          bestScore = currentScore;
        }

        if (attempt.label === 'focus' && currentScore >= 4) {
          break;
        }
      }

      if (bestExtracted) {
        // Run through Intelligence Engine (fuzzy match, corrections, pincode, anomalies)
        ocrHints = await intelligenceEngine.resolveEntities(bestExtracted, { sessionContext });
      }
    } catch (_err) {
      // Non-blocking by design: barcode capture should still proceed.
    }
  }

  if (lookup.hints && ocrHints) {
    const courierPrefill = require('../services/courierPrefill.service');
    ocrHints = courierPrefill.mergeApiPrefill(ocrHints, lookup.hints);
  } else if (lookup.hints && !ocrHints) {
    ocrHints = lookup.hints;
  }

  const result = await svc.scanAwbAndUpdate(req.body.awb, req.user?.id, req.body.courier, {
    captureOnly: req.body.captureOnly,
    source: 'scanner',
    ocrHints,
    sessionContext: req.body.sessionContext || {},
    overrideDate: sessionDate || null,
  });
  await auditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'SCAN_AWB', entity: 'SHIPMENT', entityId: result.shipment?.id, newValue: result, ip: req.ip });
  R.ok(res, result, 'AWB scanned and updated successfully');
});

const scanAwbBulk = asyncHandler(async (req, res) => {
  const { scanQueue } = require('../config/queue');
  
  if (!scanQueue) {
    // Fallback to synchronous if Redis/Queue is not configured
    const result = await svc.scanAwbBulkAndUpdate(req.body.awbs, req.user?.id, req.body.courier, {
      captureOnly: req.body.captureOnly,
      source: 'scanner_bulk',
    });
    await auditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'SCAN_AWB_BULK', entity: 'SHIPMENT', newValue: { totalScanned: req.body.awbs.length, successes: result.successful.length }, ip: req.ip });
    return R.ok(res, result, 'Bulk AWB scan completed synchronously');
  }

  // Add the job to BullMQ
  const job = await scanQueue.add('bulk-scan', { awbs: req.body.awbs, userId: req.user?.id, courier: req.body.courier, captureOnly: req.body.captureOnly });
  await auditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'ENQUEUE_SCAN_BULK', entity: 'JOB', entityId: job.id, newValue: { totalScanned: req.body.awbs.length }, ip: req.ip });
  
  R.ok(res, { jobId: job.id, message: 'Processing in background' }, 'Bulk scan queued successfully');
});

const scanImage = asyncHandler(async (req, res) => {
  const { imageBase64 } = req.body;
  const sessionDate = (req.body.sessionContext?.sessionDate || '').trim();

  // 1. Process image using configured OCR engine (local by default)
  const { extractShipmentFromImage } = require('../services/ocr.service');
  let details = await extractShipmentFromImage(imageBase64, 'image/jpeg');
  const intelligenceEngine = require('../services/intelligenceEngine.service');
  details = await intelligenceEngine.resolveEntities(details, { sessionContext: req.body.sessionContext || {} });

  if (!details.success || !details.awb) {
    return res.status(400).json({ success: false, message: 'Could not extract a valid AWB from the image.' });
  }

  const awb = String(details.awb || '').trim();
  const result = await svc.scanAwbAndUpdate(awb, req.user?.id, details.courier || 'AUTO', {
    captureOnly: true,
    source: 'scanner_image',
    ocrHints: details,
    sessionContext: req.body.sessionContext || {},
    overrideDate: sessionDate || null,
  });

  await auditLog({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'SCAN_IMAGE_OCR',
    entity: 'SHIPMENT',
    entityId: result.shipment?.id,
    newValue: { ocr: details, resultMeta: result.meta || null },
    ip: req.ip,
  });
  
  R.ok(res, { message: 'Image scanned safely.', shipment: result.shipment, ocrDetails: details, meta: result.meta || null });
});

const learnCorrections = asyncHandler(async (req, res) => {
  const correctionLearner = require('../services/correctionLearner.service');
  const { ocrFields, approvedFields } = req.body;
  if (!ocrFields || !approvedFields) {
    return R.ok(res, { saved: 0 }, 'No fields to learn from');
  }
  const saved = await correctionLearner.recordCorrections(ocrFields, approvedFields);
  R.ok(res, { saved: saved.length, corrections: saved }, 'Corrections recorded for learning');
});

const scanMobile = asyncHandler(async (req, res) => {
  const { awb, imageBase64, focusImageBase64, sessionContext } = req.body;
  const cleanAwb = String(awb || '').trim();

  const { extractShipmentFromImage } = require('../services/ocr.service');
  const intelligenceEngine = require('../services/intelligenceEngine.service');
  const correctionLearner = require('../services/correctionLearner.service');
  const shipmentSvc = require('../services/shipment.service');
  const scannerFlow = require('../services/scannerFlow.service');
  const logger = require('../utils/logger');
  const sessionDate = (sessionContext?.sessionDate || '').trim();

  const lookup = cleanAwb
    ? await scannerFlow.resolveLookupPrefill(cleanAwb)
    : { awb: '', hints: null, evaluation: scannerFlow.evaluateLookupCoverage(null) };

  if (!imageBase64 && !focusImageBase64) {
    if (!cleanAwb) {
      return res.status(400).json({ success: false, message: 'AWB is required.' });
    }

    if (!lookup.evaluation.readyForNoPhoto) {
      return R.ok(res, {
        success: true,
        awb: cleanAwb,
        status: 'photo_required',
        requiresImageCapture: true,
        missingFields: lookup.evaluation.missingForNoPhoto,
        ocrExtracted: lookup.hints || null,
        intelligence: lookup.hints?._intelligence || {},
      }, 'Lookup incomplete. Capture label photo for OCR fallback.');
    }

    let shipment = null;
    try {
      const result = await shipmentSvc.scanAwbAndUpdate(cleanAwb, req.user?.id, null, {
        captureOnly: true,
        source: 'mobile_scanner_lookup',
        ocrHints: lookup.hints,
        sessionContext: sessionContext || {},
        overrideDate: sessionDate || null,
      });
      shipment = result.shipment;
    } catch (svcErr) {
      logger.warn(`[Mobile Scanner Lookup] shipment upsert failed: ${svcErr.message}`);
    }

    const clientCode = lookup.hints?.clientCode || shipment?.clientCode || '';
    const linkedDraftId = await maybeLinkDraftToScan(shipment, lookup.hints, clientCode, cleanAwb);
    const resultPayload = scannerFlow.buildScanResultPayload({
      awb: cleanAwb,
      shipment,
      ocrHints: lookup.hints,
      linkedDraftId,
      extra: {
        requiresImageCapture: false,
        lookupDecision: lookup.evaluation,
      },
    });

    return R.ok(res, resultPayload, 'Lookup scan processed successfully');
  }

  const [clients, corrections] = await Promise.all([
    intelligenceEngine.getActiveClientsForPrompt(),
    correctionLearner.getTopCorrections(20),
  ]);

  const ocrOptions = {
    knownAwb: cleanAwb,
    clients,
    corrections,
    sessionContext: sessionContext || {},
  };

  let ocrHints = lookup.hints;
  let effectiveAwb = cleanAwb;

  if (!lookup.evaluation.readyForNoPhoto || !cleanAwb) {
    const scoreOcr = (d) => {
      if (!d?.success) return 0;
      return [d.clientName, d.consignee, d.destination, d.pincode, d.orderNo, d.weight, d.amount]
        .filter(v => typeof v === 'number' ? v > 0 : String(v || '').trim().length > 0).length;
    };

    const attempts = [];
    if (focusImageBase64) attempts.push(extractShipmentFromImage(focusImageBase64, 'image/jpeg', ocrOptions));
    if (imageBase64)      attempts.push(extractShipmentFromImage(imageBase64, 'image/jpeg', ocrOptions));

    const settled = await Promise.allSettled(attempts);
    const successful = settled
      .filter(r => r.status === 'fulfilled' && r.value?.success)
      .map(r => r.value)
      .sort((a, b) => scoreOcr(b) - scoreOcr(a));

    let extractedHints = null;
    if (successful.length) {
      extractedHints = await intelligenceEngine.resolveEntities(successful[0], { sessionContext: sessionContext || {} });
    }

    effectiveAwb = String(cleanAwb || extractedHints?.awb || successful[0]?.awb || '').trim();
    if (!effectiveAwb) {
      return res.status(400).json({ success: false, message: 'Could not read the AWB from the label image.' });
    }

    const effectiveLookup = effectiveAwb === lookup.awb
      ? lookup
      : await scannerFlow.resolveLookupPrefill(effectiveAwb);

    if (effectiveLookup.hints && extractedHints) {
      const courierPrefill = require('../services/courierPrefill.service');
      ocrHints = courierPrefill.mergeApiPrefill(extractedHints, effectiveLookup.hints);
    } else {
      ocrHints = extractedHints || effectiveLookup.hints;
    }
  }

  let shipment = null;
  try {
    const result = await shipmentSvc.scanAwbAndUpdate(effectiveAwb, req.user?.id, null, {
      captureOnly: true,
      source: 'mobile_scanner_direct',
      ocrHints,
      sessionContext: sessionContext || {},
      overrideDate: sessionDate || null,
    });
    shipment = result.shipment;
  } catch (svcErr) {
    logger.warn(`[Mobile Scanner OCR] shipment upsert failed: ${svcErr.message}`);
  }

  const clientCode = ocrHints?.clientCode || shipment?.clientCode || '';
  const linkedDraftId = await maybeLinkDraftToScan(shipment, ocrHints, clientCode, effectiveAwb);
  const resultPayload = scannerFlow.buildScanResultPayload({
    awb: effectiveAwb,
    shipment,
    ocrHints,
    linkedDraftId,
    extra: {
      requiresImageCapture: false,
      lookupDecision: scannerFlow.evaluateLookupCoverage(ocrHints),
    },
  });

  R.ok(res, resultPayload, 'Mobile scan processed successfully');
});


// ── CSV formula injection guard ──────────────────────────────────────────────
// Prevents cells starting with =, +, -, @, \t, \r from being interpreted as
// formulas by Excel/Sheets. Prefixes with a tab character to neutralise.
function sanitizeCsvCell(value) {
  const str = String(value ?? '').replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(str)) return `\t${str}`;
  return str;
}

const exportShipments = asyncHandler(async (req, res) => {
  const {
    client, clientCode, courier, status, filter, date_from, dateFrom, date_to, dateTo, q, search, sortBy, sortDir
  } = req.query;
  
  const where = svc.buildFilters({
    client: client || clientCode,
    courier,
    status,
    filter,
    dateFrom: date_from || dateFrom,
    dateTo: date_to || dateTo,
    q: q || search,
  });
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=shipments_export.csv');
  
  const headers = ['Date', 'AWB', 'Consignee', 'Destination', 'Courier', 'Weight', 'Amount', 'Status'];
  res.write(headers.join(',') + '\n');
  
  const BATCH_SIZE = 1000;
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const shipments = await prisma.shipment.findMany({
      where,
      skip,
      take: BATCH_SIZE,
      orderBy: { id: 'desc' },
      select: {
        date: true, awb: true, consignee: true, destination: true, courier: true, weight: true, amount: true, status: true
      }
    });

    if (shipments.length === 0) {
      hasMore = false;
      break;
    }

    const csvRows = shipments.map(s => [
      `"${sanitizeCsvCell(s.date)}"`,
      `"${sanitizeCsvCell(s.awb)}"`,
      `"${sanitizeCsvCell(s.consignee)}"`,
      `"${sanitizeCsvCell(s.destination)}"`,
      `"${sanitizeCsvCell(s.courier)}"`,
      s.weight || 0,
      s.amount || 0,
      `"${sanitizeCsvCell(s.status)}"`,
    ].join(','));

    res.write(csvRows.join('\n') + '\n');
    skip += BATCH_SIZE;
  }
  
  res.end();
});

module.exports = { exportShipments,  getAll, getOne, create, update, patchStatus, manualStatus, remove, bulkImport, getTodayStats, getMonthlyStats, getValidStatuses, deleteShipment: remove,
  getImportLedger,
  scanAwb,
  scanAwbBulk,
  scanImage,
  scanMobile,
  learnCorrections
};
