const prisma = require('../config/prisma');

const MODES = ['surface', 'air', 'express', 'premium'];
const ZONES = ['local', 'zonal', 'metro', 'roi'];
const WEIGHT_SLABS = [
  { key: '0-500g', minKg: 0, maxKg: 0.5 },
  { key: '500g-1kg', minKg: 0.5, maxKg: 1 },
  { key: '1-5kg', minKg: 1, maxKg: 5 },
  { key: '5kg+', minKg: 5, maxKg: Infinity },
];

function normalizeKey(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '');
}

function toNumber(val) {
  if (val === null || val === undefined) return 0;
  return typeof val === 'object' ? Number(val.toString()) : Number(val);
}

function normalizeMode(value) {
  const key = normalizeKey(value);
  if (key.includes('premium') || key.includes('priority')) return 'premium';
  if (key.includes('express')) return 'express';
  if (key.includes('air')) return 'air';
  if (key.includes('surface') || key.includes('standard') || key.includes('economy')) return 'surface';
  return key && MODES.includes(key) ? key : 'surface';
}

function normalizeZone(value) {
  const key = normalizeKey(value);
  if (key.includes('local')) return 'local';
  if (key.includes('zonal') || key.includes('zone')) return 'zonal';
  if (key.includes('metro')) return 'metro';
  if (key.includes('rest') || key === 'roi' || key.includes('india')) return 'roi';
  return key && ZONES.includes(key) ? key : 'local';
}

/**
 * Accepts weight in kilograms only.
 * Callers must pass kg. The >50 heuristic has been removed
 * because it misidentifies 51kg as 0.051kg.
 */
function normalizeWeightKg(weight) {
  const n = Number(weight || 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n >= 1000) return n / 1000; // If >= 1000, it's definitely grams. (Safely allows up to 999kg)
  return n;
}

function getWeightSlab(weight) {
  const kg = normalizeWeightKg(weight);
  return WEIGHT_SLABS.find((slab) => kg > slab.minKg && kg <= slab.maxKg)?.key
    || (kg <= 0.5 ? '0-500g' : kg <= 1 ? '500g-1kg' : kg <= 5 ? '1-5kg' : '5kg+');
}

function sanitizePricingRules(rules = []) {
  if (!Array.isArray(rules)) return [];
  return rules
    .map((rule) => ({
      mode: normalizeMode(rule.mode),
      zone: normalizeZone(rule.zone),
      weightSlab: String(rule.weightSlab || getWeightSlab(rule.weight || 0)),
      rate: Number(rule.rate || 0),
      minCharge: Number(rule.minCharge || 0),
      baseCharge: Number(rule.baseCharge || 0),
      perKgRate: Number(rule.perKgRate || 0),
    }))
    .filter((rule) => rule.mode && rule.zone && rule.weightSlab);
}

function sanitizeSimpleRules(rules = []) {
  if (!Array.isArray(rules)) return [];
  return rules
    .map((rule) => ({
      zone: normalizeZone(rule.zone),
      mode: rule.mode ? normalizeMode(rule.mode) : null,
      rate: Number(rule.rate || 0),
      minCharge: Number(rule.minCharge || 0),
      baseCharge: Number(rule.baseCharge || 0),
    }))
    .filter((rule) => rule.zone && Number.isFinite(rule.rate) && rule.rate > 0);
}

function getContractMode(contract) {
  if (contract?.pricingRules && !Array.isArray(contract.pricingRules) && contract.pricingRules.type === 'simple') return 'simple';
  if (String(contract?.pricingType || '').toUpperCase() === 'SIMPLE') return 'simple';
  return 'detailed';
}

function getMatrixRules(contract) {
  return Array.isArray(contract?.pricingRules) ? contract.pricingRules : [];
}

function getSimpleRules(contract) {
  if (contract?.pricingRules && !Array.isArray(contract.pricingRules) && contract.pricingRules.type === 'simple') {
    return contract.pricingRules.rules || [];
  }
  return [];
}

function selectBestContract(contracts, { courier, service }) {
  if (!contracts?.length) return null;
  const wantCourier = String(courier || '').trim().toUpperCase();
  const wantService = String(service || '').trim().toUpperCase();
  const sameCourier = (value) => String(value || '').trim().toUpperCase() === wantCourier;
  const sameService = (value) => String(value || '').trim().toUpperCase() === wantService;
  return (
    contracts.find(c => sameCourier(c.courier) && sameService(c.service)) ||
    contracts.find(c => sameCourier(c.courier) && !c.service) ||
    contracts.find(c => !c.courier && sameService(c.service)) ||
    contracts.find(c => !c.courier && !c.service) ||
    null
  );
}

function selectPricingRule(match, { mode, zone, weight }) {
  const rules = sanitizePricingRules(getMatrixRules(match));
  if (!rules.length) return null;
  const wantedMode = normalizeMode(mode || match.service);
  const wantedZone = normalizeZone(zone);
  const wantedSlab = getWeightSlab(weight);

  return (
    rules.find((rule) => rule.mode === wantedMode && rule.zone === wantedZone && rule.weightSlab === wantedSlab) ||
    rules.find((rule) => rule.mode === wantedMode && rule.zone === wantedZone) ||
    rules.find((rule) => rule.mode === wantedMode && rule.weightSlab === wantedSlab) ||
    rules.find((rule) => rule.weightSlab === wantedSlab) ||
    null
  );
}

function calculateMatrixPrice(match, weight, options = {}) {
  const rule = selectPricingRule(match, { ...options, weight });
  if (!rule) return null;
  const kg = normalizeWeightKg(weight);
  const slab = WEIGHT_SLABS.find((item) => item.key === rule.weightSlab);
  const excessKg = slab?.maxKg === Infinity ? Math.max(0, kg - slab.minKg) : 0;
  const freight = Number(rule.rate || 0) + excessKg * Number(rule.perKgRate || 0);
  const base = Math.max(freight + Number(rule.baseCharge || 0), Number(rule.minCharge || toNumber(match.minCharge) || 0));
  const fuel = base * (toNumber(match.fuelSurcharge) / 100);
  const subtotal = base + fuel;
  const gst = subtotal * (Number(match.gstPercent || 18) / 100);
  const total = subtotal + gst;

  return {
    contractId: match.id,
    contractName: match.name,
    pricingType: 'MATRIX',
    mode: rule.mode,
    zone: rule.zone,
    weightSlab: rule.weightSlab,
    rate: rule.rate,
    perKgRate: rule.perKgRate,
    baseCharge: rule.baseCharge,
    minCharge: rule.minCharge,
    base: Math.round(base * 100) / 100,
    fuelSurcharge: Math.round(fuel * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

function calculateSimplePrice(match, weight, options = {}) {
  const rules = sanitizeSimpleRules(getSimpleRules(match));
  if (!rules.length) return null;
  const wantedMode = normalizeMode(options.mode || match.service);
  const wantedZone = normalizeZone(options.zone);
  const rule = (
    rules.find((item) => item.zone === wantedZone && item.mode === wantedMode) ||
    rules.find((item) => item.zone === wantedZone && !item.mode) ||
    rules.find((item) => item.mode === wantedMode) ||
    null
  );
  if (!rule) return null;

  const base = Math.max(Number(rule.rate || 0) + Number(rule.baseCharge || 0), Number(rule.minCharge || toNumber(match.minCharge) || 0));
  const fuel = base * (toNumber(match.fuelSurcharge) / 100);
  const subtotal = base + fuel;
  const gst = subtotal * (Number(match.gstPercent || 18) / 100);
  const total = subtotal + gst;

  return {
    contractId: match.id,
    contractName: match.name,
    pricingType: 'SIMPLE',
    mode: rule.mode || 'any',
    zone: rule.zone,
    weight,
    rate: rule.rate,
    baseCharge: rule.baseCharge,
    minCharge: rule.minCharge,
    base: Math.round(base * 100) / 100,
    fuelSurcharge: Math.round(fuel * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

function calculatePriceFromContract(match, weight, options = {}) {
  if (!match) return null;
  if (getContractMode(match) === 'simple') {
    const simplePrice = calculateSimplePrice(match, weight, options);
    if (simplePrice) return simplePrice;
  }
  const matrixPrice = calculateMatrixPrice(match, weight, options);
  if (matrixPrice) return matrixPrice;

  let base = 0;
  if (match.pricingType === 'PER_KG') base = normalizeWeightKg(weight) * toNumber(match.baseRate);
  else if (match.pricingType === 'FLAT') base = toNumber(match.baseRate);
  else if (match.pricingType === 'PER_SHIPMENT') base = toNumber(match.baseRate);

  base = Math.max(base + toNumber(match.baseCharge), toNumber(match.minCharge));
  const fuel = base * (toNumber(match.fuelSurcharge) / 100);
  const subtotal = base + fuel;
  const gst = subtotal * (match.gstPercent / 100);
  const total = subtotal + gst;

  return {
    contractId: match.id,
    contractName: match.name,
    pricingType: match.pricingType,
    baseRate: match.baseRate,
    base: Math.round(base * 100) / 100,
    fuelSurcharge: Math.round(fuel * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

async function getActiveContractsByClientCodes(clientCodes = [], db = prisma) {
  const safeCodes = [...new Set(clientCodes.map(code => String(code || '').trim().toUpperCase()).filter(Boolean))];
  if (!safeCodes.length) return {};

  const today = new Date().toISOString().split('T')[0];
  const contracts = await db.contract.findMany({
    where: {
      clientCode: { in: safeCodes },
      active: true,
      OR: [{ validFrom: null }, { validFrom: { lte: today } }],
      AND: [{ OR: [{ validTo: null }, { validTo: { gte: today } }] }],
    },
    orderBy: { createdAt: 'asc' },
  });

  const rows = Array.isArray(contracts) ? contracts : [];

  return rows.reduce((acc, contract) => {
    const key = contract.clientCode.toUpperCase();
    if (!acc[key]) acc[key] = [];
    acc[key].push(contract);
    return acc;
  }, {});
}

// Get all contracts for a client
async function getByClient(clientCode, db = prisma) {
  return db.contract.findMany({
    where: { clientCode: clientCode.toUpperCase() },
    orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
  });
}

// Get all contracts
async function getAll(db = prisma) {
  return db.contract.findMany({
    include: { client: { select: { company: true } } },
    orderBy: [{ clientCode: 'asc' }, { active: 'desc' }],
  });
}

// Upsert contract
async function upsert(data, db = prisma) {
  const contractMode = data.contractMode || data.mode || (data.pricingRules && !Array.isArray(data.pricingRules) ? data.pricingRules.type : null);
  const simpleRules = contractMode === 'simple' || String(data.pricingType || '').toUpperCase() === 'SIMPLE'
    ? sanitizeSimpleRules(data.simpleRules || data.pricingRules?.rules || [])
    : null;
  const matrixRules = simpleRules ? [] : sanitizePricingRules(data.pricingRules);
  const payload = {
    clientCode: String(data.clientCode || '').toUpperCase(),
    name: String(data.name || '').trim(),
    courier: data.courier ? String(data.courier).trim() : null,
    service: data.service ? String(data.service).trim() : null,
    baseRate: Number(data.baseRate || 0),
    baseCharge: Number(data.baseCharge || 0),
    minCharge: Number(data.minCharge || 0),
    fuelSurcharge: Number(data.fuelSurcharge || 0),
    gstPercent: Number(data.gstPercent || 18),
    pricingRules: simpleRules ? { type: 'simple', rules: simpleRules } : matrixRules,
    pricingType: simpleRules ? 'SIMPLE' : (matrixRules.length ? 'MATRIX' : (data.pricingType || 'PER_KG')),
    validFrom: data.validFrom ? String(data.validFrom) : null,
    validTo: data.validTo ? String(data.validTo) : null,
    active: data.active !== false,
    notes: data.notes ? String(data.notes) : null,
  };
  if (data.id) {
    return db.contract.update({ where: { id: parseInt(data.id) }, data: payload });
  }
  return db.contract.create({ data: payload });
}

// Delete contract
async function remove(id, db = prisma) {
  return db.contract.delete({ where: { id: parseInt(id) } });
}

// Find best matching contract for a shipment and calculate price
async function calculatePrice({ clientCode, courier, service, mode, zone, weight }, db = prisma) {
  const contractsByClient = await getActiveContractsByClientCodes([clientCode], db);
  const contracts = contractsByClient[String(clientCode || '').toUpperCase()] || [];
  if (!contracts.length) return null;
  const match = selectBestContract(contracts, { courier, service });

  if (!match) return null;
  return calculatePriceFromContract(match, Number(weight || 0), { mode: mode || service, zone });
}

module.exports = {
  getByClient,
  getAll,
  upsert,
  remove,
  calculatePrice,
  calculatePriceFromContract,
  getActiveContractsByClientCodes,
  selectBestContract,
  sanitizePricingRules,
  getWeightSlab,
  normalizeMode,
  normalizeZone,
  normalizeWeightKg,
};
