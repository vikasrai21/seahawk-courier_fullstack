// src/services/reconciliation.service.js
const prisma = require('../config/prisma');
const { stateToZones, courierCost, COURIERS } = require('../utils/rateEngine');

const rnd = n => Math.round(n * 100) / 100;

/**
 * Upload and process a courier invoice.
 * items: Array of { awb, date, destination, weight, billedAmount }
 */
async function uploadCourierInvoice({ courier, invoiceNo, invoiceDate, fromDate, toDate, notes, items }, userId) {
  // Find AWBs in shipment DB to get zone info
  const awbs = items.map(i => i.awb);
  const shipments = await prisma.shipment.findMany({
    where: { awb: { in: awbs } },
    select: { awb: true, destination: true, weight: true, amount: true, courier: true },
  });
  const shipMap = {};
  shipments.forEach(s => { shipMap[s.awb] = s; });

  // Calculate what we think each AWB should cost
  const processedItems = items.map(item => {
    const billed = parseFloat(item.billedAmount) || 0;
    const shipment = shipMap[item.awb];

    let calculated = null;
    if (shipment) {
      // Attempt rate lookup using destination string
      const parts = (shipment.destination || '').split(',');
      const city = parts[0]?.trim() || '';
      const state = parts[1]?.trim() || parts[0]?.trim() || '';
      const zone = stateToZones(state, '', city);

      // Find the courier ID from shipment.courier label
      const courierObj = COURIERS.find(c =>
        c.label.toLowerCase().includes((shipment.courier || '').toLowerCase()) ||
        (shipment.courier || '').toLowerCase().includes(c.label.toLowerCase())
      );

      if (courierObj) {
        const bk = courierCost(courierObj.id, zone, parseFloat(shipment.weight) || 0);
        if (bk) calculated = bk.total;
      }
    }

    const discrepancy = calculated !== null ? rnd(billed - calculated) : null;
    let status = 'NOT_FOUND';
    if (calculated !== null) {
      if (Math.abs(discrepancy) < 2) status = 'OK';         // ±₹2 tolerance
      else if (discrepancy > 2)      status = 'OVER';        // courier overcharged
      else if (discrepancy < -2)     status = 'UNDER';       // courier undercharged
    }

    return {
      awb:              item.awb,
      date:             item.date || invoiceDate,
      destination:      item.destination || shipment?.destination || '',
      weight:           parseFloat(item.weight) || shipment?.weight || 0,
      billedAmount:     billed,
      calculatedAmount: calculated,
      discrepancy,
      status,
      notes:            item.notes || null,
    };
  });

  const totalAmount = processedItems.reduce((s, i) => s + i.billedAmount, 0);

  return prisma.courierInvoice.create({
    data: {
      courier, invoiceNo, invoiceDate, fromDate, toDate,
      totalAmount: rnd(totalAmount),
      notes,
      uploadedById: userId || null,
      items: { create: processedItems },
    },
    include: { items: true },
  });
}

async function listCourierInvoices({ courier, status, page = 1, limit = 20 }) {
  const where = {};
  if (courier) where.courier = { contains: courier, mode: 'insensitive' };
  if (status) where.status = status;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [total, data] = await Promise.all([
    prisma.courierInvoice.count({ where }),
    prisma.courierInvoice.findMany({
      where, skip, take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { items: true } },
        uploadedBy: { select: { name: true } },
      },
    }),
  ]);
  return { total, data, page: parseInt(page), limit: parseInt(limit) };
}

async function getCourierInvoiceDetails(id) {
  const inv = await prisma.courierInvoice.findUnique({
    where: { id: parseInt(id) },
    include: {
      items: { orderBy: { status: 'asc' } },
      uploadedBy: { select: { name: true } },
    },
  });
  if (!inv) return null;

  // Summary stats
  const items = inv.items;
  const totalBilled = items.reduce((s, i) => s + i.billedAmount, 0);
  const totalCalc   = items.filter(i => i.calculatedAmount != null).reduce((s, i) => s + (i.calculatedAmount || 0), 0);
  const totalOver   = items.filter(i => i.status === 'OVER').reduce((s, i) => s + (i.discrepancy || 0), 0);
  const totalUnder  = items.filter(i => i.status === 'UNDER').reduce((s, i) => s + Math.abs(i.discrepancy || 0), 0);

  return {
    ...inv,
    summary: {
      totalItems:   items.length,
      ok:           items.filter(i => i.status === 'OK').length,
      over:         items.filter(i => i.status === 'OVER').length,
      under:        items.filter(i => i.status === 'UNDER').length,
      notFound:     items.filter(i => i.status === 'NOT_FOUND').length,
      totalBilled:  rnd(totalBilled),
      totalCalc:    rnd(totalCalc),
      totalOver:    rnd(totalOver),
      totalUnder:   rnd(totalUnder),
      netDiscrepancy: rnd(totalBilled - totalCalc),
    },
  };
}

async function updateInvoiceStatus(id, status, notes) {
  return prisma.courierInvoice.update({
    where: { id: parseInt(id) },
    data: { status, notes: notes || undefined },
  });
}

async function getReconciliationStats() {
  const invoices = await prisma.courierInvoice.findMany({
    include: { items: { select: { status: true, billedAmount: true, calculatedAmount: true, discrepancy: true } } },
  });

  let totalBilled = 0, totalCalc = 0, totalOver = 0, totalOverCount = 0;
  invoices.forEach(inv => {
    inv.items.forEach(item => {
      totalBilled += item.billedAmount;
      if (item.calculatedAmount) totalCalc += item.calculatedAmount;
      if (item.status === 'OVER') { totalOver += item.discrepancy || 0; totalOverCount++; }
    });
  });

  return {
    totalInvoices:    invoices.length,
    totalBilled:      rnd(totalBilled),
    totalCalculated:  rnd(totalCalc),
    totalOvercharges: rnd(totalOver),
    overchargeCount:  totalOverCount,
    potentialSaving:  rnd(totalOver),
  };
}

module.exports = {
  uploadCourierInvoice, listCourierInvoices, getCourierInvoiceDetails,
  updateInvoiceStatus, getReconciliationStats,
};
