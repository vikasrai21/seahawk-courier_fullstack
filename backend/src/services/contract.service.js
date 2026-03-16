const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

// Get all contracts for a client
async function getByClient(clientCode) {
  return prisma.contract.findMany({
    where: { clientCode: clientCode.toUpperCase() },
    orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
  });
}

// Get all contracts
async function getAll() {
  return prisma.contract.findMany({
    include: { client: { select: { company: true } } },
    orderBy: [{ clientCode: 'asc' }, { active: 'desc' }],
  });
}

// Upsert contract
async function upsert(data) {
  if (data.id) {
    return prisma.contract.update({ where: { id: parseInt(data.id) }, data });
  }
  return prisma.contract.create({ data });
}

// Delete contract
async function remove(id) {
  return prisma.contract.delete({ where: { id: parseInt(id) } });
}

// Find best matching contract for a shipment and calculate price
async function calculatePrice({ clientCode, courier, service, weight }) {
  const today = new Date().toISOString().split('T')[0];

  // Find best matching contract: most specific first (courier+service > courier > any)
  const contracts = await prisma.contract.findMany({
    where: {
      clientCode: clientCode.toUpperCase(),
      active: true,
      OR: [
        { validFrom: null },
        { validFrom: { lte: today } },
      ],
      AND: [
        { OR: [{ validTo: null }, { validTo: { gte: today } }] },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!contracts.length) return null;

  // Priority: courier+service match > courier match > generic (no courier/service)
  const match =
    contracts.find(c => c.courier === courier && c.service === service) ||
    contracts.find(c => c.courier === courier && !c.service) ||
    contracts.find(c => !c.courier && c.service === service) ||
    contracts.find(c => !c.courier && !c.service);

  if (!match) return null;

  let base = 0;
  if (match.pricingType === 'PER_KG')       base = (weight || 0) * match.baseRate;
  else if (match.pricingType === 'FLAT')     base = match.baseRate;
  else if (match.pricingType === 'PER_SHIPMENT') base = match.baseRate;

  base = Math.max(base, match.minCharge);
  const fuel = base * (match.fuelSurcharge / 100);
  const subtotal = base + fuel;
  const gst = subtotal * (match.gstPercent / 100);
  const total = subtotal + gst;

  return {
    contractId:    match.id,
    contractName:  match.name,
    pricingType:   match.pricingType,
    baseRate:      match.baseRate,
    base:          Math.round(base * 100) / 100,
    fuelSurcharge: Math.round(fuel * 100) / 100,
    subtotal:      Math.round(subtotal * 100) / 100,
    gst:           Math.round(gst * 100) / 100,
    total:         Math.round(total * 100) / 100,
  };
}

module.exports = { getByClient, getAll, upsert, remove, calculatePrice };
