// src/services/reconciliation.service.js
const prisma = require('../config/prisma');
const { stateToZones, courierCost, COURIERS } = require('../utils/rateEngine');

const rnd = n => Math.round(n * 100) / 100;

function policySnapshotForItem(item) {
  const courier = String(item?.courier || '');
  const lane = String(item?.destination || '');
  const weight = Number(item?.weight || 0);
  return {
    courier,
    lane,
    weight,
    expectedBilledAmount: Number(item?.calculatedAmount || 0),
    actualBilledAmount: Number(item?.billedAmount || 0),
  };
}

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
  const updated = await prisma.courierInvoice.update({
    where: { id: parseInt(id) },
    data: { status, notes: notes || undefined },
  });
  await prisma.auditLog.create({
    data: {
      action: 'RECON_INVOICE_STATUS_UPDATED',
      entity: 'COURIER_INVOICE',
      entityId: String(updated.id),
      newValue: {
        status: updated.status,
        notes: updated.notes || null,
      },
    },
  }).catch(() => {});
  return updated;
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

async function getDisputes({ status = 'OPEN', page = 1, limit = 20 } = {}) {
  const where = {
    entity: 'RECON_DISPUTE',
  };
  if (status && status !== 'ALL') {
    where.action = status === 'OPEN' ? 'RECON_DISPUTE_OPENED' : 'RECON_DISPUTE_RESOLVED';
  }
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(10, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;
  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: safeLimit,
    }),
  ]);
  return {
    total,
    page: safePage,
    limit: safeLimit,
    data: rows.map((r) => ({
      id: r.id,
      disputeNo: r.entityId,
      status: r.action === 'RECON_DISPUTE_RESOLVED' ? 'RESOLVED' : 'OPEN',
      createdAt: r.createdAt,
      details: r.newValue || {},
    })),
  };
}

async function openDispute({ invoiceId, awbs = [], reason = '', expectedRecovery = 0, requestedBy = null }) {
  const inv = await prisma.courierInvoice.findUnique({
    where: { id: parseInt(invoiceId, 10) },
    include: { items: true },
  });
  if (!inv) throw new Error('Invoice not found');
  const chosenAwbs = [...new Set((Array.isArray(awbs) ? awbs : []).map((a) => String(a || '').trim().toUpperCase()).filter(Boolean))];
  const disputedItems = inv.items.filter((item) => chosenAwbs.length ? chosenAwbs.includes(String(item.awb || '').toUpperCase()) : item.status === 'OVER');
  if (!disputedItems.length) throw new Error('No eligible overcharge rows selected for dispute');
  const derivedRecovery = disputedItems.reduce((sum, item) => sum + Math.max(0, Number(item.discrepancy || 0)), 0);
  const disputeNo = `DSP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${inv.id}-${Math.floor(100 + Math.random() * 900)}`;

  await prisma.auditLog.create({
    data: {
      userId: requestedBy?.id || null,
      userEmail: requestedBy?.email || null,
      action: 'RECON_DISPUTE_OPENED',
      entity: 'RECON_DISPUTE',
      entityId: disputeNo,
      newValue: {
        invoiceId: inv.id,
        courier: inv.courier,
        invoiceNo: inv.invoiceNo,
        awbs: disputedItems.map((i) => i.awb),
        reason: String(reason || '').trim() || 'Billing discrepancy',
        expectedRecovery: Number(expectedRecovery || derivedRecovery),
        snapshots: disputedItems.map(policySnapshotForItem),
      },
    },
  });

  await prisma.courierInvoice.update({
    where: { id: inv.id },
    data: { status: 'DISPUTED' },
  });

  return {
    disputeNo,
    invoiceId: inv.id,
    invoiceNo: inv.invoiceNo,
    courier: inv.courier,
    awbCount: disputedItems.length,
    expectedRecovery: Number((expectedRecovery || derivedRecovery).toFixed(2)),
  };
}

async function resolveDispute({ disputeNo, resolutionNotes = '', requestedBy = null }) {
  const latest = await prisma.auditLog.findFirst({
    where: { entity: 'RECON_DISPUTE', entityId: String(disputeNo || '').trim(), action: 'RECON_DISPUTE_OPENED' },
    orderBy: { createdAt: 'desc' },
  });
  if (!latest) throw new Error('Dispute not found');
  const invoiceId = Number(latest?.newValue?.invoiceId || 0);
  if (invoiceId) {
    await prisma.courierInvoice.update({
      where: { id: invoiceId },
      data: { status: 'SETTLED' },
    });
  }
  await prisma.auditLog.create({
    data: {
      userId: requestedBy?.id || null,
      userEmail: requestedBy?.email || null,
      action: 'RECON_DISPUTE_RESOLVED',
      entity: 'RECON_DISPUTE',
      entityId: String(disputeNo || '').trim(),
      newValue: {
        invoiceId: invoiceId || null,
        resolutionNotes: String(resolutionNotes || '').trim() || null,
      },
    },
  });
  return { disputeNo: String(disputeNo || '').trim(), invoiceId: invoiceId || null, status: 'RESOLVED' };
}

async function contractDrift({ fromDate, toDate }) {
  const where = {};
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = new Date(fromDate);
    if (toDate) where.createdAt.lte = new Date(toDate);
  }
  const invoices = await prisma.courierInvoice.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  const laneMap = {};
  invoices.forEach((inv) => {
    inv.items.forEach((item) => {
      if (item.calculatedAmount == null) return;
      const lane = `${inv.courier}|${String(item.destination || 'UNKNOWN')}`;
      if (!laneMap[lane]) laneMap[lane] = { lane, courier: inv.courier, billed: 0, expected: 0, count: 0 };
      laneMap[lane].billed += Number(item.billedAmount || 0);
      laneMap[lane].expected += Number(item.calculatedAmount || 0);
      laneMap[lane].count += 1;
    });
  });
  return Object.values(laneMap)
    .map((row) => {
      const driftAmount = Number((row.billed - row.expected).toFixed(2));
      const driftPct = row.expected > 0 ? Number((((row.billed - row.expected) / row.expected) * 100).toFixed(2)) : 0;
      return { ...row, driftAmount, driftPct };
    })
    .filter((row) => Math.abs(row.driftPct) >= 5 || Math.abs(row.driftAmount) >= 500)
    .sort((a, b) => Math.abs(b.driftAmount) - Math.abs(a.driftAmount))
    .slice(0, 50);
}

module.exports = {
  uploadCourierInvoice, listCourierInvoices, getCourierInvoiceDetails,
  updateInvoiceStatus, getReconciliationStats,
  getDisputes, openDispute, resolveDispute, contractDrift,
};
