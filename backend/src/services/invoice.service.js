const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

const COMPANY = {
  name: 'Sea Hawk Courier & Cargo',
  gstin: '06AJDPR0914N2Z1',
  hsnCode: '996812',
};

function toNumber(val) {
  if (val === null || val === undefined) return 0;
  return typeof val === 'object' ? Number(val.toString()) : Number(val);
}

// Auto-generate invoice number: INV-YYYY-NNN
async function generateInvoiceNo(db = prisma) {
  const year  = new Date().getFullYear();
  const last  = await db.invoice.findFirst({
    where: { invoiceNo: { startsWith: `INV-${year}-` } },
    orderBy: { id: 'desc' },
  });
  const seq = last ? parseInt(last.invoiceNo.split('-')[2]) + 1 : 1;
  return `INV-${year}-${String(seq).padStart(3, '0')}`;
}

// Create invoice from shipments in date range
async function create({ clientCode, fromDate, toDate, gstPercent = 18, notes }, db = prisma) {
  const client = await db.client.findUnique({ where: { code: clientCode.toUpperCase() } });
  if (!client) throw new AppError('Client not found', 404);

  // Get unbilled shipments for this client and date range
  const shipments = await db.shipment.findMany({
    where: {
      clientCode: clientCode.toUpperCase(),
      date: { gte: fromDate, lte: toDate },
      // Not already invoiced
      invoiceItems: { none: {} },
    },
    orderBy: { date: 'asc' },
  });

  if (!shipments.length) throw new AppError('No unbilled shipments found for this date range.', 400);

  const invoiceNo = await generateInvoiceNo(db);
  const subtotal  = shipments.reduce((a, s) => a + (toNumber(s.amount) || 0), 0);
  
  // Dynamic Tax Split Calculation
  const companyState = '06'; // Haryana
  const clientState = String(client.gst || '').slice(0, 2);
  const intraState = clientState ? clientState === companyState : /haryana/i.test(client.address || '');

  const gstAmount = Math.round(subtotal * (gstPercent / 100) * 100) / 100;
  const cgstAmount = intraState ? Math.round((gstAmount / 2) * 100) / 100 : 0;
  const sgstAmount = intraState ? Math.round((gstAmount / 2) * 100) / 100 : 0;
  const igstAmount = intraState ? 0 : gstAmount;
  const total     = Math.round((subtotal + gstAmount) * 100) / 100;

  const invoice = await db.invoice.create({
    data: {
      invoiceNo,
      clientCode: clientCode.toUpperCase(),
      fromDate,
      toDate,
      subtotal:  Math.round(subtotal  * 100) / 100,
      gstPercent,
      gstAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      total,
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
          baseAmount:   toNumber(s.amount),
          fuelSurcharge:0,
          amount:       toNumber(s.amount),
        })),
      },
    },
    include: { items: true, client: true },
  });

  return invoice;
}

// Get all invoices
async function getAll(clientCode, db = prisma) {
  return db.invoice.findMany({
    where: clientCode ? { clientCode } : undefined,
    include: {
      client: { select: { company: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Get single invoice with full details
async function getById(id, db = prisma) {
  const inv = await db.invoice.findUnique({
    where: { id: parseInt(id) },
    include: {
      client: true,
      items: {
        orderBy: { date: 'asc' },
        include: { shipment: { select: { status: true, updatedAt: true } } },
      },
    },
  });
  if (!inv) throw new AppError('Invoice not found', 404);
  return inv;
}

// Update status
async function updateStatus(id, status, db = prisma) {
  return db.invoice.update({ where: { id: parseInt(id) }, data: { status } });
}

// Delete invoice (restores shipments to unbilled)
async function remove(id, db = prisma) {
  return db.invoice.delete({ where: { id: parseInt(id) } });
}

function getTaxBreakdown(invoice, client) {
  const gstAmount = toNumber(invoice?.gstAmount);
  const gstPercent = Number(invoice?.gstPercent || 18);
  const companyStateCode = String(COMPANY.gstin || '').slice(0, 2);
  const clientStateCode = String(client?.gst || '').slice(0, 2);
  const intraState = clientStateCode ? clientStateCode === companyStateCode : /haryana/i.test(String(client?.address || ''));

  if (intraState) {
    return {
      type: 'INTRA_STATE',
      components: [
        { label: `CGST @ ${(gstPercent / 2).toFixed(1)}%`, amount: gstAmount / 2 },
        { label: `SGST @ ${(gstPercent / 2).toFixed(1)}%`, amount: gstAmount / 2 },
      ],
    };
  }

  return {
    type: 'INTER_STATE',
    components: [
      { label: `IGST @ ${gstPercent}%`, amount: gstAmount },
    ],
  };
}

function buildExportRows(invoice) {
  const items = invoice?.items || [];
  return items.map((item, index) => ({
    srNo: index + 1,
    invoiceNo: invoice.invoiceNo,
    invoiceDate: new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-IN'),
    clientCode: invoice.clientCode,
    clientName: invoice.client?.company || invoice.clientCode,
    date: item.date,
    awb: item.awb,
    consignee: item.consignee || '',
    destination: item.destination || '',
    courier: item.courier || '',
    weightKg: Number(((item.weight || 0) / 1000).toFixed(3)),
    taxableAmount: toNumber(item.baseAmount) || toNumber(item.amount) || 0,
    fuelSurcharge: toNumber(item.fuelSurcharge),
    lineAmount: toNumber(item.amount),
    hsnCode: COMPANY.hsnCode,
  }));
}

function generateInvoiceCsv(invoice) {
  const tax = getTaxBreakdown(invoice, invoice.client);
  const rows = buildExportRows(invoice);
  const csvRows = [
    ['Invoice No', invoice.invoiceNo],
    ['Invoice Date', new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-IN')],
    ['Client', invoice.client?.company || invoice.clientCode],
    ['Client Code', invoice.clientCode],
    ['Client GSTIN', invoice.client?.gst || ''],
    ['Company GSTIN', COMPANY.gstin],
    ['HSN/SAC', COMPANY.hsnCode],
    ['Taxable Amount', toNumber(invoice.subtotal).toFixed(2)],
    ...tax.components.map((item) => [item.label, Number(item.amount || 0).toFixed(2)]),
    ['Total', toNumber(invoice.total).toFixed(2)],
    [],
    ['Sr No', 'Date', 'AWB', 'Consignee', 'Destination', 'Courier', 'Weight (kg)', 'Taxable Amount', 'Fuel Surcharge', 'Line Amount', 'HSN/SAC'],
    ...rows.map((row) => [
      row.srNo,
      row.date,
      row.awb,
      row.consignee,
      row.destination,
      row.courier,
      row.weightKg,
      row.taxableAmount.toFixed(2),
      row.fuelSurcharge.toFixed(2),
      row.lineAmount.toFixed(2),
      row.hsnCode,
    ]),
  ];

  return csvRows
    .map((row) => row.map((value) => {
      const text = String(value ?? '');
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    }).join(','))
    .join('\n');
}

function generateInvoiceExcelHtml(invoice) {
  const tax = getTaxBreakdown(invoice, invoice.client);
  const rows = buildExportRows(invoice);
  const escape = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const summaryRows = [
    ['Invoice No', invoice.invoiceNo],
    ['Invoice Date', new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-IN')],
    ['Client', invoice.client?.company || invoice.clientCode],
    ['Client Code', invoice.clientCode],
    ['Client GSTIN', invoice.client?.gst || ''],
    ['Company GSTIN', COMPANY.gstin],
    ['HSN/SAC', COMPANY.hsnCode],
    ['Taxable Amount', toNumber(invoice.subtotal).toFixed(2)],
    ...tax.components.map((item) => [item.label, Number(item.amount || 0).toFixed(2)]),
    ['Total', toNumber(invoice.total).toFixed(2)],
  ];

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: Arial, sans-serif; padding: 16px; }
      h1 { color: #0b1f3a; }
      table { border-collapse: collapse; width: 100%; margin-top: 16px; }
      th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; text-align: left; }
      th { background: #0b1f3a; color: #fff; }
      .summary td:first-child { width: 220px; font-weight: 700; }
    </style>
  </head>
  <body>
    <h1>Sea Hawk Courier & Cargo - Invoice Export</h1>
    <table class="summary">
      <tbody>
        ${summaryRows.map(([label, value]) => `<tr><td>${escape(label)}</td><td>${escape(value)}</td></tr>`).join('')}
      </tbody>
    </table>
    <table>
      <thead>
        <tr>
          <th>Sr No</th>
          <th>Date</th>
          <th>AWB</th>
          <th>Consignee</th>
          <th>Destination</th>
          <th>Courier</th>
          <th>Weight (kg)</th>
          <th>Taxable Amount</th>
          <th>Fuel Surcharge</th>
          <th>Line Amount</th>
          <th>HSN/SAC</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((row) => `<tr>
          <td>${escape(row.srNo)}</td>
          <td>${escape(row.date)}</td>
          <td>${escape(row.awb)}</td>
          <td>${escape(row.consignee)}</td>
          <td>${escape(row.destination)}</td>
          <td>${escape(row.courier)}</td>
          <td>${escape(row.weightKg)}</td>
          <td>${escape(row.taxableAmount.toFixed(2))}</td>
          <td>${escape(row.fuelSurcharge.toFixed(2))}</td>
          <td>${escape(row.lineAmount.toFixed(2))}</td>
          <td>${escape(row.hsnCode)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </body>
</html>`;
}

module.exports = {
  create,
  getAll,
  getById,
  updateStatus,
  remove,
  buildExportRows,
  generateInvoiceCsv,
  generateInvoiceExcelHtml,
};
