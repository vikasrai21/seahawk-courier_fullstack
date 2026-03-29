const svc = require('../services/invoice.service');
const R   = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const getAll     = asyncHandler(async (req, res) => R.ok(res, await svc.getAll(req.query.client)));
const getOne     = asyncHandler(async (req, res) => R.ok(res, await svc.getById(req.params.id)));
const create     = asyncHandler(async (req, res) => R.created(res, await svc.create(req.body), 'Invoice created'));
const setStatus  = asyncHandler(async (req, res) => R.ok(res, await svc.updateStatus(req.params.id, req.body.status), 'Status updated'));
const remove     = asyncHandler(async (req, res) => { await svc.remove(req.params.id); R.ok(res, null, 'Deleted'); });
const exportCsv  = asyncHandler(async (req, res) => {
  const invoice = await svc.getById(req.params.id);
  const csv = svc.generateInvoiceCsv(invoice);
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNo}.csv"`,
  });
  res.send(csv);
});
const exportExcel = asyncHandler(async (req, res) => {
  const invoice = await svc.getById(req.params.id);
  const html = svc.generateInvoiceExcelHtml(invoice);
  res.set({
    'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
    'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNo}.xls"`,
  });
  res.send(html);
});

module.exports = { getAll, getOne, create, setStatus, remove, exportCsv, exportExcel };
