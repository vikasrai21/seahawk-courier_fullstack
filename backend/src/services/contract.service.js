const prisma = require('../config/prisma');

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

function calculatePriceFromContract(match, weight) {
  if (!match) return null;

  let base = 0;
  if (match.pricingType === 'PER_KG') base = (weight || 0) * match.baseRate;
  else if (match.pricingType === 'FLAT') base = match.baseRate;
  else if (match.pricingType === 'PER_SHIPMENT') base = match.baseRate;

  base = Math.max(base, match.minCharge);
  const fuel = base * (match.fuelSurcharge / 100);
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

  return contracts.reduce((acc, contract) => {
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
  if (data.id) {
    return db.contract.update({ where: { id: parseInt(data.id) }, data });
  }
  return db.contract.create({ data });
}

// Delete contract
async function remove(id, db = prisma) {
  return db.contract.delete({ where: { id: parseInt(id) } });
}

// Find best matching contract for a shipment and calculate price
async function calculatePrice({ clientCode, courier, service, weight }, db = prisma) {
  const contractsByClient = await getActiveContractsByClientCodes([clientCode], db);
  const contracts = contractsByClient[String(clientCode || '').toUpperCase()] || [];
  if (!contracts.length) return null;
  const match = selectBestContract(contracts, { courier, service });

  if (!match) return null;
  return calculatePriceFromContract(match, Number(weight || 0));
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
};
