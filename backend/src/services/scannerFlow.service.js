'use strict';

const courierPrefill = require('./courierPrefill.service');
const awbMasterResolver = require('./awbMasterResolver.service');

function hasValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  const text = String(value).trim();
  return !!text && text.toUpperCase() !== 'UNKNOWN' && text.toUpperCase() !== 'NA';
}

function normalizeLookupHints(hints, awb) {
  if (!hints) return null;
  return {
    ...hints,
    awb: String(awb || hints.awb || '').trim(),
    success: true,
  };
}

async function resolveLookupPrefill(awb, courierHint = '') {
  const cleanAwb = String(awb || '').trim();
  if (!cleanAwb) {
    return {
      awb: '',
      hints: null,
      apiData: null,
      masterPrefill: null,
      evaluation: evaluateLookupCoverage(null),
    };
  }

  const [masterPrefill, apiData] = await Promise.all([
    awbMasterResolver.resolveAwbMasterData(cleanAwb).catch(() => null),
    courierPrefill.prefillFromApi(cleanAwb, courierHint).catch(() => null),
  ]);

  let hints = null;
  if (apiData) {
    hints = normalizeLookupHints(apiData, cleanAwb);
  }
  if (masterPrefill) {
    hints = awbMasterResolver.mergeAwbMasterPrefill(hints, masterPrefill);
  }
  hints = normalizeLookupHints(hints, cleanAwb);

  if (hints?._intelligence) {
    hints._intelligence.lookupDecision = evaluateLookupCoverage(hints);
  }

  return {
    awb: cleanAwb,
    hints,
    apiData,
    masterPrefill,
    evaluation: evaluateLookupCoverage(hints),
  };
}

function evaluateLookupCoverage(hints) {
  const presence = {
    clientCode: hasValue(hints?.clientCode) && String(hints.clientCode).toUpperCase() !== 'MISC',
    consignee: hasValue(hints?.consignee),
    destination: hasValue(hints?.destination),
    pincode: hasValue(hints?.pincode),
    phone: hasValue(hints?.phone),
    weight: hasValue(hints?.weight),
  };

  const readyForNoPhoto = presence.destination && (presence.pincode || presence.phone) && (presence.consignee || presence.clientCode || presence.phone);
  const readyForAutoApprove = presence.clientCode && presence.consignee && presence.destination && presence.pincode;

  const missingForNoPhoto = [];
  if (!presence.destination) missingForNoPhoto.push('destination');
  if (!presence.pincode && !presence.phone) missingForNoPhoto.push('pincode');
  if (!presence.consignee && !presence.clientCode && !presence.phone) missingForNoPhoto.push('consignee');

  const missingForAutoApprove = [];
  if (!presence.clientCode) missingForAutoApprove.push('clientCode');
  if (!presence.consignee) missingForAutoApprove.push('consignee');
  if (!presence.destination) missingForAutoApprove.push('destination');
  if (!presence.pincode) missingForAutoApprove.push('pincode');

  return {
    readyForNoPhoto,
    readyForAutoApprove,
    missingForNoPhoto,
    missingForAutoApprove,
    presence,
  };
}

function shouldAutoApproveScan({ ocrHints, shipment, autoApproveThreshold = Number(process.env.SCANNER_AUTO_APPROVE_THRESHOLD || 0.85) }) {
  const clientCode = ocrHints?.clientCode || shipment?.clientCode || '';
  if (!clientCode || clientCode === 'MISC') return false;

  const consignee = ocrHints?.consignee || shipment?.consignee || '';
  const destination = ocrHints?.destination || shipment?.destination || '';
  if (!consignee || !destination) return false;

  const confidences = [
    ocrHints?.clientNameConfidence || 0,
    ocrHints?.consigneeConfidence || 0,
    ocrHints?.destinationConfidence || 0,
    ocrHints?.pincodeConfidence || 0,
  ].filter((confidence) => confidence > 0);

  if (confidences.length < 3) {
    return false;
  }

  return confidences.every((confidence) => confidence >= autoApproveThreshold);
}

function buildScanResultPayload({ awb, shipment, ocrHints, linkedDraftId = null, extra = {} }) {
  const intel = ocrHints?._intelligence || {};
  const clientCode = ocrHints?.clientCode || shipment?.clientCode || '';
  const clientName = ocrHints?.clientName || shipment?.client?.company || clientCode;
  const reviewRequired = !shouldAutoApproveScan({ ocrHints, shipment });

  return {
    success: true,
    awb: String(awb || shipment?.awb || '').trim(),
    shipmentId: shipment?.id || null,
    linkedDraftId,
    courier: shipment?.courier || ocrHints?.courier || '',
    status: reviewRequired ? 'pending_review' : 'ok',
    clientCode,
    clientName,
    consignee: ocrHints?.consignee || shipment?.consignee || '',
    destination: ocrHints?.destination || shipment?.destination || '',
    pincode: ocrHints?.pincode || shipment?.pincode || '',
    weight: ocrHints?.weight || shipment?.weight || 0,
    amount: ocrHints?.amount || shipment?.amount || 0,
    orderNo: ocrHints?.orderNo || '',
    date: shipment?.date || ocrHints?.date || '',
    reviewRequired,
    autoApproved: !reviewRequired,
    ocrExtracted: ocrHints || null,
    intelligence: intel,
    ...extra,
  };
}

module.exports = {
  resolveLookupPrefill,
  evaluateLookupCoverage,
  shouldAutoApproveScan,
  buildScanResultPayload,
};
