// src/services/auditor.service.js
'use strict';
const prisma = require('../config/prisma');
const { stateToZones, courierCost } = require('../utils/rateEngine');
const { lookupPincode } = require('./pincode.service');
const importLedger = require('./import-ledger.service');

/**
 * Normalizes service codes to internal identifiers
 */
function normalizeServiceCode(value) {
  const text = String(value || '').trim().toUpperCase();
  const aliases = {
    AIR: 'DA1', DAIR: 'DA1', 'D-AIR': 'DA1',
    SFC: 'SF1', SURFACE: 'SF1', 'D-SURFACE': 'SF1',
    EXP: 'AR1', EXPRESS: 'AR1',
    PRI: 'AC3', PRIORITY: 'AC3',
    PEP: 'AC1', STD: 'AC2', STANDARD: 'AC2'
  };
  return aliases[text] || text;
}

const SERVICE_CODE_TO_COURIER = {
  AR1: 'dtdc_exp', AR2: 'dtdc_exp', AC1: 'dtdc_v71',
  AC2: 'dtdc_d71', AC3: 'dtdc_p7x', SF1: 'dtdc_dsfc',
  SF2: 'dtdc_dsfc', DA1: 'dtdc_dair', DA2: 'dtdc_dair'
};

/**
 * Resolves location details from pincode or text
 */
async function resolveLocation(line) {
  let state = String(line.state || '').trim();
  let district = String(line.district || '').trim();
  let city = String(line.city || '').trim();
  const pincode = String(line.pincode || '').trim();

  if (!state && /^\d{6}$/.test(pincode)) {
    try {
      const pinData = await lookupPincode(pincode);
      const office = pinData?.postOffice || {};
      state = state || office.State;
      district = district || office.District;
      city = city || office.Name;
    } catch (e) { void e; }
  }
  return { state, district, city, pincode };
}

/**
 * Verifies a single line item
 */
async function verifyLineItem(line) {
  const serviceCode = normalizeServiceCode(line.serviceCode);
  const courierId = line.courierId || SERVICE_CODE_TO_COURIER[serviceCode];
  const weight = Number(line.weight || 0);
  const billed = Number(line.amount || 0);
  const awb = String(line.awb || '').trim();

  if (!courierId) return { status: 'error', message: 'Unknown service/courier' };

  const { state, district, city, pincode } = await resolveLocation(line);
  const zone = stateToZones(state, district, city);
  const cost = courierCost(courierId, zone, weight, Number(line.odaAmount || 0));

  if (!cost) return { status: 'error', message: 'Rate calculation failed' };

  // Sync with Ledger/Shipments
  const [ledgerMatches, shipment] = await Promise.all([
    awb ? importLedger.findByAwb(awb, 1) : [],
    awb ? prisma.shipment.findUnique({ where: { awb }, select: { amount: true, weight: true } }) : null
  ]);

  const ledgerMatch = ledgerMatches[0];
  const chargedToClient = ledgerMatch ? Number(ledgerMatch.amount) : shipment ? Number(shipment.amount) : 0;
  const recordedWeight = ledgerMatch ? Number(ledgerMatch.weight) : shipment ? Number(shipment.weight) : 0;

  const flags = [];
  if (!ledgerMatch && !shipment) flags.push('No record found in ledger');
  if (recordedWeight > 0 && Math.abs(recordedWeight - weight) > 0.05) flags.push(`Weight gap: ${recordedWeight}kg vs ${weight}kg`);
  if (chargedToClient > 0 && billed > chargedToClient) flags.push(`Recovery Gap: Billed ₹${billed} but collected ₹${chargedToClient}`);
  if (cost.total < billed - 1) flags.push(`Overcharge: Expecting ₹${cost.total} but billed ₹${billed}`);

  return {
    status: 'ok',
    awb,
    destination: city || district || state || 'Unknown',
    zone: zone.seahawkZone,
    expected: cost,
    difference: Number((billed - cost.total).toFixed(2)),
    chargedToClient,
    recoveryGap: Number((chargedToClient - billed).toFixed(2)),
    flags,
    details: { state, pincode, serviceCode, weight, billed }
  };
}

/**
 * Performs a bulk audit on a CourierInvoice
 */
async function auditInvoice(invoiceId) {
  const invoice = await prisma.courierInvoice.findUnique({
    where: { id: parseInt(invoiceId) },
    include: { items: true }
  });

  if (!invoice) throw new Error('Invoice not found');

  const results = [];
  for (const item of invoice.items) {
    const result = await verifyLineItem({
      awb: item.awb,
      weight: item.weight,
      amount: item.billedAmount,
      destination: item.destination,
      serviceCode: item.serviceCode || 'AIR'
    });
    results.push({ item, result });
  }

  // Group results for summary
  const summary = {
    total: results.length,
    overcharged: results.filter(r => r.result.difference > 1).length,
    recoveryGaps: results.filter(r => r.result.recoveryGap < 0).length,
    weightMismatches: results.filter(r => r.result.flags.some(f => f.includes('Weight'))).length,
    totalOverchargeAmt: results.reduce((sum, r) => sum + Math.max(0, r.result.difference), 0)
  };

  return { summary, results };
}

module.exports = {
  verifyLineItem,
  auditInvoice
};
