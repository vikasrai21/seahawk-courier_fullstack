const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

// Auto-generate invoice number: INV-YYYY-NNN
async function generateInvoiceNo() {
  const year  = new Date().getFullYear();
  const last  = await prisma.invoice.findFirst({
    where: { invoiceNo: { startsWith: `INV-${year}-` } },
    orderBy: { id: 'desc' },
  });
  const seq = last ? parseInt(last.invoiceNo.split('-')[2]) + 1 : 1;
  return `INV-${year}-${String(seq).padStart(3, '0')}`;
}

// Create invoice from shipments in date range
async function create({ clientCode, fromDate, toDate, gstPercent = 18, notes }) {
  // Get unbilled shipments for this client and date range
  const shipments = await prisma.shipment.findMany({
    where: {
      clientCode: clientCode.toUpperCase(),
      date: { gte: fromDate, lte: toDate },
      // Not already invoiced
      invoiceItems: { none: {} },
    },
    orderBy: { date: 'asc' },
  });

  if (!shipments.length) throw new AppError('No unbilled shipments found for this date range.', 400);

  const invoiceNo = await generateInvoiceNo();
  const subtotal  = shipments.reduce((a, s) => a + (s.amount || 0), 0);
  const gstAmount = subtotal * (gstPercent / 100);
  const total     = subtotal + gstAmount;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNo,
      clientCode: clientCode.toUpperCase(),
      fromDate,
      toDate,
      subtotal:  Math.round(subtotal  * 100) / 100,
      gstPercent,
      gstAmount: Math.round(gstAmount * 100) / 100,
      total:     Math.round(total     * 100) / 100,
      notes,
      items: {
        create: shipments.map(s => ({
          shipmentId:   s.id,
          awb:          s.awb,
          date:         s.date,
          consignee:    s.consignee || '',
          destination:  s.destination || '',
          courier:      s.courier || '',
          weight:       s.weight,
          baseAmount:   s.amount,
          fuelSurcharge:0,
          amount:       s.amount,
        })),
      },
    },
    include: { items: true, client: true },
  });

  return invoice;
}

// Get all invoices
async function getAll(clientCode) {
  return prisma.invoice.findMany({
    where: clientCode ? { clientCode } : undefined,
    include: {
      client: { select: { company: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Get single invoice with full details
async function getById(id) {
  const inv = await prisma.invoice.findUnique({
    where: { id: parseInt(id) },
    include: { client: true, items: { orderBy: { date: 'asc' } } },
  });
  if (!inv) throw new AppError('Invoice not found', 404);
  return inv;
}

// Update status
async function updateStatus(id, status) {
  return prisma.invoice.update({ where: { id: parseInt(id) }, data: { status } });
}

// Delete invoice (restores shipments to unbilled)
async function remove(id) {
  return prisma.invoice.delete({ where: { id: parseInt(id) } });
}

module.exports = { create, getAll, getById, updateStatus, remove };
