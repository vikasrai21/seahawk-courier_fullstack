'use strict';

const prisma = require('../config/prisma');
const logger = require('../utils/logger');

const PLACEHOLDER_TEXT = new Set(['', 'UNKNOWN', 'MISC', 'NA', 'N/A', 'NULL']);

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeAwb(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[\s\u200B-\u200D\uFEFF]+/g, '')
    .trim()
    .toUpperCase();
}

async function findLegacyMatchId(tableName, awb) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT id
     FROM ${tableName}
     WHERE regexp_replace(upper(awb), '[^A-Z0-9]+', '', 'g') = $1
     ORDER BY id DESC
     LIMIT 1`,
    awb
  );
  return Number(rows?.[0]?.id || 0) || null;
}

function normalizeUpper(value) {
  return normalizeText(value).toUpperCase();
}

function hasMeaningfulText(value) {
  const text = normalizeUpper(value);
  return Boolean(text) && !PLACEHOLDER_TEXT.has(text);
}

function hasMeaningfulNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0;
}

function mapShipment(shipment) {
  if (!shipment) return null;
  return {
    awb: normalizeAwb(shipment.awb),
    date: normalizeText(shipment.date),
    clientCode: normalizeUpper(shipment.clientCode),
    clientName: normalizeText(shipment.client?.company || ''),
    consignee: normalizeText(shipment.consignee),
    destination: normalizeText(shipment.destination),
    phone: normalizeText(shipment.phone),
    pincode: normalizeText(shipment.pincode),
    weight: Number(shipment.weight || 0) || 0,
    amount: Number(shipment.amount || 0) || 0,
    courier: normalizeText(shipment.courier),
    remarks: normalizeText(shipment.remarks),
    status: normalizeText(shipment.status),
    layer: 'shipment',
  };
}

function mapImportRow(row) {
  if (!row) return null;
  return {
    awb: normalizeAwb(row.awb),
    date: normalizeText(row.date),
    clientCode: normalizeUpper(row.clientCode),
    clientName: normalizeText(row.client?.company || ''),
    consignee: normalizeText(row.consignee),
    destination: normalizeText(row.destination),
    phone: normalizeText(row.phone),
    pincode: normalizeText(row.pincode),
    weight: Number(row.weight || 0) || 0,
    amount: Number(row.amount || 0) || 0,
    courier: normalizeText(row.courier),
    remarks: normalizeText(row.remarks),
    status: normalizeText(row.status),
    layer: 'import_ledger',
  };
}

function isPlaceholderShipment(data) {
  if (!data) return false;
  const remarks = normalizeUpper(data.remarks);
  const looksScannedPlaceholder = remarks.includes('SCAN_CAPTURED') || remarks.includes('AUTO_DISCOVERED: VIA SCANNER');
  const weakIdentity = !hasMeaningfulText(data.clientCode) || !hasMeaningfulText(data.consignee) || !hasMeaningfulText(data.destination);
  return looksScannedPlaceholder || weakIdentity;
}

function chooseText(primary, secondary) {
  if (hasMeaningfulText(primary)) return normalizeText(primary);
  if (hasMeaningfulText(secondary)) return normalizeText(secondary);
  return '';
}

function chooseNumber(primary, secondary) {
  if (hasMeaningfulNumber(primary)) return Number(primary);
  if (hasMeaningfulNumber(secondary)) return Number(secondary);
  return 0;
}

async function resolveAwbMasterData(awb) {
  const cleanAwb = normalizeAwb(awb);
  if (!cleanAwb) return null;

  try {
    let [shipment, importRows] = await Promise.all([
      prisma.shipment.findUnique({
        where: { awb: cleanAwb },
        include: { client: { select: { company: true } } },
      }),
      prisma.shipmentImportRow.findMany({
        where: { awb: cleanAwb },
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        take: 3,
        include: { client: { select: { company: true } } },
      }),
    ]);

    if (!shipment || !importRows.length) {
      const [legacyShipmentId, legacyImportId] = await Promise.all([
        shipment ? Promise.resolve(null) : findLegacyMatchId('shipments', cleanAwb),
        importRows.length ? Promise.resolve(null) : findLegacyMatchId('shipment_import_rows', cleanAwb),
      ]);

      if (!shipment && legacyShipmentId) {
        shipment = await prisma.shipment.findUnique({
          where: { id: legacyShipmentId },
          include: { client: { select: { company: true } } },
        });
      }

      if (!importRows.length && legacyImportId) {
        importRows = await prisma.shipmentImportRow.findMany({
          where: { id: legacyImportId },
          take: 1,
          include: { client: { select: { company: true } } },
        });
      }
    }

    const shipmentData = mapShipment(shipment);
    const importData = mapImportRow(importRows[0] || null);

    if (!shipmentData && !importData) return null;

    const preferImport = Boolean(importData) && (!shipmentData || isPlaceholderShipment(shipmentData));
    const primary = preferImport ? importData : shipmentData;
    const secondary = preferImport ? shipmentData : importData;

    const clientCode = normalizeUpper(chooseText(primary?.clientCode, secondary?.clientCode));
    let clientName = chooseText(primary?.clientName, secondary?.clientName);

    if (!clientName && clientCode) {
      const client = await prisma.client.findUnique({
        where: { code: clientCode },
        select: { company: true },
      }).catch(() => null);
      clientName = normalizeText(client?.company || '');
    }

    const resolved = {
      awb: cleanAwb,
      source: 'awb_master',
      layers: [shipmentData?.layer, importData?.layer].filter(Boolean),
      preferImport,
      clientCode,
      clientName,
      consignee: chooseText(primary?.consignee, secondary?.consignee),
      destination: chooseText(primary?.destination, secondary?.destination),
      phone: chooseText(primary?.phone, secondary?.phone),
      pincode: chooseText(primary?.pincode, secondary?.pincode),
      weight: chooseNumber(primary?.weight, secondary?.weight),
      amount: chooseNumber(primary?.amount, secondary?.amount),
      courier: chooseText(primary?.courier, secondary?.courier),
      date: chooseText(primary?.date, secondary?.date),
      status: chooseText(primary?.status, secondary?.status),
    };

    const usefulFields = [
      resolved.clientCode,
      resolved.clientName,
      resolved.consignee,
      resolved.destination,
      resolved.pincode,
      resolved.phone,
      resolved.weight,
      resolved.amount,
      resolved.courier,
    ].filter((value) => (typeof value === 'number' ? hasMeaningfulNumber(value) : hasMeaningfulText(value)));

    if (!usefulFields.length) return null;

    logger.info(
      `[AWB Master] ${cleanAwb}: client=${resolved.clientCode || 'NA'} consignee=${resolved.consignee || 'NA'} ` +
      `dest=${resolved.destination || 'NA'} pin=${resolved.pincode || 'NA'} wt=${resolved.weight || 'NA'} ` +
      `layers=${resolved.layers.join('+') || 'none'}`
    );

    return resolved;
  } catch (err) {
    logger.warn(`[AWB Master] ${cleanAwb} lookup failed: ${err.message}`);
    return null;
  }
}

function applyTextField(merged, field, value, fieldsApplied) {
  if (!hasMeaningfulText(value)) return;
  const nextValue = normalizeText(value);
  const currentValue = normalizeText(merged[field]);
  const same = normalizeUpper(currentValue) === normalizeUpper(nextValue);
  if (!same && hasMeaningfulText(currentValue) && merged[`_ocr_${field}`] == null) {
    merged[`_ocr_${field}`] = currentValue;
  }
  merged[field] = nextValue;
  merged[`${field}Confidence`] = 0.99;
  merged[`${field}Source`] = 'awb_master';
  fieldsApplied.push(field);
}

function applyNumberField(merged, field, value, fieldsApplied) {
  if (!hasMeaningfulNumber(value)) return;
  const nextValue = Number(value);
  const currentValue = Number(merged[field] || 0);
  if (Number.isFinite(currentValue) && currentValue > 0 && currentValue !== nextValue && merged[`_ocr_${field}`] == null) {
    merged[`_ocr_${field}`] = currentValue;
  }
  merged[field] = nextValue;
  merged[`${field}Confidence`] = 0.99;
  merged[`${field}Source`] = 'awb_master';
  fieldsApplied.push(field);
}

function mergeAwbMasterPrefill(currentHints, masterData) {
  if (!masterData) return currentHints || null;

  const merged = { ...(currentHints || {}) };
  const fieldsApplied = [];

  merged.success = true;
  if (!merged.awb) merged.awb = masterData.awb;

  applyTextField(merged, 'clientCode', masterData.clientCode, fieldsApplied);
  applyTextField(merged, 'clientName', masterData.clientName, fieldsApplied);
  applyTextField(merged, 'consignee', masterData.consignee, fieldsApplied);
  applyTextField(merged, 'destination', masterData.destination, fieldsApplied);
  applyTextField(merged, 'pincode', masterData.pincode, fieldsApplied);
  applyTextField(merged, 'phone', masterData.phone, fieldsApplied);
  applyTextField(merged, 'courier', masterData.courier, fieldsApplied);
  applyNumberField(merged, 'weight', masterData.weight, fieldsApplied);
  applyNumberField(merged, 'amount', masterData.amount, fieldsApplied);

  if (!merged._intelligence) merged._intelligence = {};
  merged._intelligence.awbMasterPrefill = {
    source: masterData.source,
    layers: masterData.layers || [],
    preferImport: Boolean(masterData.preferImport),
    fieldsApplied: [...new Set(fieldsApplied)],
  };

  return merged;
}

function hasAuthoritativeLabelData(masterData) {
  if (!masterData) return false;
  return hasMeaningfulText(masterData.clientCode)
    && hasMeaningfulText(masterData.consignee)
    && (hasMeaningfulText(masterData.destination) || hasMeaningfulText(masterData.pincode));
}

module.exports = {
  resolveAwbMasterData,
  mergeAwbMasterPrefill,
  hasAuthoritativeLabelData,
};
