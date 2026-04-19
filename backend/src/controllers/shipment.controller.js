// src/controllers/shipment.controller.js
const svc          = require('../services/shipment.service');
const importLedger = require('../services/import-ledger.service');
const stateMachine = require('../services/stateMachine');
const { auditLog } = require('../utils/audit');
const R = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const getAll = asyncHandler(async (req, res) => {
  const { client, courier, status, date_from, date_to, q, page = 1, limit = 50 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(5000, Math.max(10, parseInt(limit, 10) || 50));
  const { shipments, total } = await svc.getAll(
    { client, courier, status, dateFrom: date_from, dateTo: date_to, q },
    pageNum,
    limitNum
  );
  R.paginated(res, shipments, total, pageNum, limitNum);
});

const getOne = asyncHandler(async (req, res) => {
  const s = await svc.getById(req.params.id);
  R.ok(res, s);
});

const create = asyncHandler(async (req, res) => {
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
  if (!imageBase64) return res.status(400).json({ success: false, message: 'Image base64 string is required' });

  // 1. Process image using configured OCR engine (local by default)
  const { extractShipmentFromImage } = require('../services/ocr.service');
  let details = await extractShipmentFromImage(imageBase64, 'image/jpeg');
  const intelligenceEngine = require('../services/intelligenceEngine.service');
  details = await intelligenceEngine.resolveEntities(details, { sessionContext: req.body.sessionContext || {} });

  if (!details.success || !details.awb) {
    return res.status(400).json({ success: false, message: 'Could not extract a valid AWB from the image.' });
  }

  // 2. We now have the AWB and optionally consignee, weight, destination
  // We feed this into the existing scanAwbAndUpdate logic, but we augment the DB if needed
  const prisma = require('../config/prisma');

  const awb = details.awb.trim();
  let courier = details.courier || 'AUTO';

  if (!courier || courier === 'AUTO') {
    // If OCR did not resolve courier, use AWB heuristics
    const autoDetectCourier = (awbStr) => {
      const a = String(awbStr || '').toUpperCase().trim();
      if (/^\d{12}$/.test(a)) return 'Trackon';
      if (/^\d{13,14}$/.test(a)) return 'Delhivery';
      if (/^[A-Z]{1,2}\d{8,10}$/.test(a)) return 'DTDC';
      return 'Delhivery';
    };
    courier = autoDetectCourier(awb);
  }

  // Check if shipment exists
  let shipment = await prisma.shipment.findUnique({ where: { awb } });

  // Regardless, we will TRY to fetch tracking if possible, or just apply OCR data directly
  // Actually, OCR gives us richer details than standard API responses!
  const updateData = { updatedById: req.user?.id };
  if (details.consignee) updateData.consignee = details.consignee.toUpperCase();
  if (details.destination) updateData.destination = details.destination.toUpperCase();
  if (details.weight) updateData.weight = details.weight;
  if (details.amount) updateData.amount = details.amount;
  updateData.courier = courier;

  let savedShipment;
  if (!shipment) {
    // Auto-create newly discovered shipment from image
    savedShipment = await prisma.shipment.create({
      data: {
        awb,
        date: new Date().toISOString().split('T')[0],
        clientCode: 'MISC',
        consignee: updateData.consignee || 'UNKNOWN',
        destination: updateData.destination || 'UNKNOWN',
        weight: updateData.weight || 0.5,
        amount: updateData.amount || 0,
        courier: courier,
        department: 'Operations',
        service: 'Standard',
        status: 'InTransit', 
        remarks: 'OCR_DISCOVERED: Captured via AI Vision Scanner',
        createdById: req.user?.id,
        updatedById: req.user?.id
      },
      include: { client: { select: { company: true } } }
    });
    // emitShipmentCreated(savedShipment); (Handled by socket emit if imported, but omitted here for simplicity)
  } else {
    // Update existing shipment with OCR details (never override existing weight/amount with 0)
    savedShipment = await prisma.shipment.update({
      where: { awb },
      data: updateData,
      include: { client: { select: { company: true } } }
    });
  }

  await auditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'SCAN_IMAGE_OCR', entity: 'SHIPMENT', entityId: savedShipment.id, newValue: details, ip: req.ip });
  
  R.ok(res, { message: 'Image scanned safely.', shipment: savedShipment, ocrDetails: details });
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

module.exports = { getAll, getOne, create, update, patchStatus, remove, bulkImport, getTodayStats, getMonthlyStats, getValidStatuses, deleteShipment: remove,
  getImportLedger,
  scanAwb,
  scanAwbBulk,
  scanImage,
  scanMobile,
  learnCorrections
};
