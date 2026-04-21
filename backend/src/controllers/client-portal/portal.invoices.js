'use strict';

const prisma = require('../../config/prisma');
const pdf = require('../../services/pdf.service');
const invoiceSvc = require('../../services/invoice.service');
const R = require('../../utils/response');
const { resolveClientCode } = require('./shared');

async function list(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');
  const invoices = await prisma.invoice.findMany({
    where: { clientCode },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  R.ok(res, { invoices });
}

async function detail(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const invoice = await prisma.invoice.findUnique({
    where: { id: parseInt(req.params.id, 10) },
    include: {
      client: {
        select: {
          code: true,
          company: true,
          address: true,
          gst: true,
        },
      },
      items: {
        orderBy: { date: 'asc' },
        select: {
          id: true,
          date: true,
          awb: true,
          destination: true,
          courier: true,
          weight: true,
          amount: true,
        },
      },
    },
  });

  if (!invoice || invoice.clientCode !== clientCode) return R.notFound(res, 'Invoice');
  R.ok(res, invoice);
}

async function pdfDownload(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const invoice = await prisma.invoice.findUnique({
    where: { id: parseInt(req.params.id, 10) },
    include: { client: true, items: { orderBy: { date: 'asc' } } },
  });
  if (!invoice || invoice.clientCode !== clientCode) return R.notFound(res, 'Invoice');

  const buf = await pdf.generateInvoicePDF(invoice, invoice.items, invoice.client);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNo}.pdf"`,
    'Content-Length': buf.length,
  });
  res.send(buf);
}

async function exportCsv(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const invoice = await invoiceSvc.getById(req.params.id);
  if (invoice.clientCode !== clientCode) return R.notFound(res, 'Invoice');

  const csv = invoiceSvc.generateInvoiceCsv(invoice);
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNo}.csv"`,
  });
  res.send(csv);
}

async function exportExcel(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const invoice = await invoiceSvc.getById(req.params.id);
  if (invoice.clientCode !== clientCode) return R.notFound(res, 'Invoice');

  const html = invoiceSvc.generateInvoiceExcelHtml(invoice);
  res.set({
    'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
    'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNo}.xls"`,
  });
  res.send(html);
}

async function monthlyExport(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const month = String(req.query?.month || '').trim();
  const format = String(req.query?.format || 'csv').trim().toLowerCase();
  if (!/^\d{4}-\d{2}$/.test(month)) return R.badRequest(res, 'month must be in YYYY-MM format');
  if (!['csv', 'xls'].includes(format)) return R.badRequest(res, 'format must be csv or xls');

  const fromDate = `${month}-01`;
  const dt = new Date(`${fromDate}T00:00:00.000Z`);
  dt.setUTCMonth(dt.getUTCMonth() + 1);
  dt.setUTCDate(0);
  const toDate = dt.toISOString().slice(0, 10);

  const invoices = await prisma.invoice.findMany({
    where: { clientCode, fromDate: { lte: toDate }, toDate: { gte: fromDate } },
    include: {
      items: {
        select: { date: true, awb: true, destination: true, courier: true, weight: true, amount: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const rows = [];
  for (const inv of invoices) {
    for (const item of inv.items || []) {
      rows.push({
        invoiceNo: inv.invoiceNo,
        invoiceDate: new Date(inv.createdAt).toISOString().slice(0, 10),
        periodFrom: inv.fromDate,
        periodTo: inv.toDate,
        awb: item.awb,
        shipmentDate: item.date,
        courier: item.courier || '',
        destination: item.destination || '',
        weight: Number(item.weight || 0).toFixed(2),
        amount: Number(item.amount || 0).toFixed(2),
      });
    }
  }

  if (format === 'csv') {
    const header = ['InvoiceNo', 'InvoiceDate', 'PeriodFrom', 'PeriodTo', 'AWB', 'ShipmentDate', 'Courier', 'Destination', 'Weight', 'Amount'];
    const csv = [
      header.join(','),
      ...rows.map((r) => [
        r.invoiceNo, r.invoiceDate, r.periodFrom, r.periodTo, r.awb, r.shipmentDate, r.courier, r.destination, r.weight, r.amount,
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="invoice-ledger-${clientCode}-${month}.csv"`,
    });
    return res.send(csv);
  }

  const htmlRows = rows.map((r) => `<tr>
    <td>${r.invoiceNo}</td><td>${r.invoiceDate}</td><td>${r.periodFrom}</td><td>${r.periodTo}</td>
    <td>${r.awb}</td><td>${r.shipmentDate}</td><td>${r.courier}</td><td>${r.destination}</td>
    <td style="text-align:right">${r.weight}</td><td style="text-align:right">${r.amount}</td>
  </tr>`).join('');

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice Ledger ${month}</title></head><body>
  <h3>Invoice Ledger Export (${month})</h3>
  <table border="1" cellspacing="0" cellpadding="6">
  <thead><tr><th>InvoiceNo</th><th>InvoiceDate</th><th>PeriodFrom</th><th>PeriodTo</th><th>AWB</th><th>ShipmentDate</th><th>Courier</th><th>Destination</th><th>Weight</th><th>Amount</th></tr></thead>
  <tbody>${htmlRows}</tbody></table></body></html>`;
  res.set({
    'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
    'Content-Disposition': `attachment; filename="invoice-ledger-${clientCode}-${month}.xls"`,
  });
  return res.send(html);
}

module.exports = { list, detail, pdfDownload, exportCsv, exportExcel, monthlyExport };
