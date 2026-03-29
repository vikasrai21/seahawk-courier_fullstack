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

module.exports = { list, pdfDownload, exportCsv, exportExcel };
