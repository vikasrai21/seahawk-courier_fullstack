// src/controllers/shipment.controller.js
const svc          = require('../services/shipment.service');
const stateMachine = require('../services/stateMachine');
const { auditLog } = require('../utils/audit');
const R = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const getAll = asyncHandler(async (req, res) => {
  const { client, courier, status, date_from, date_to, q, page = 1, limit = 500 } = req.query;
  const { shipments, total } = await svc.getAll({ client, courier, status, dateFrom: date_from, dateTo: date_to, q }, page, limit);
  R.paginated(res, shipments, total, page, limit);
});

const getOne = asyncHandler(async (req, res) => {
  const s = await svc.getById(req.params.id);
  R.ok(res, s);
});

const create = asyncHandler(async (req, res) => {
  const s = await svc.create(req.body, req.user?.id);
  await auditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'CREATE', entity: 'SHIPMENT', entityId: s.id, newValue: s, ip: req.ip });
  R.created(res, s, 'Shipment created');
});

const update = asyncHandler(async (req, res) => {
  const old = await svc.getById(req.params.id);
  const s   = await svc.update(req.params.id, req.body, req.user?.id);
  await auditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'UPDATE', entity: 'SHIPMENT', entityId: s.id, oldValue: old, newValue: s, ip: req.ip });
  R.ok(res, s, 'Shipment updated');
});

const patchStatus = asyncHandler(async (req, res) => {
  const old = await svc.getById(req.params.id);
  const s   = await svc.updateStatus(req.params.id, req.body.status, req.user?.id);
  await auditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'STATUS_CHANGE', entity: 'SHIPMENT', entityId: s.id, oldValue: { status: old.status }, newValue: { status: s.status }, ip: req.ip });
  R.ok(res, s);
});

const remove = asyncHandler(async (req, res) => {
  const old = await svc.getById(req.params.id);
  await svc.remove(req.params.id);
  await auditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'DELETE', entity: 'SHIPMENT', entityId: req.params.id, oldValue: old, ip: req.ip });
  R.ok(res, null, 'Shipment deleted');
});

const bulkImport = asyncHandler(async (req, res) => {
  const result = await svc.bulkImport(req.body.shipments, req.user?.id);
  await auditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'BULK_IMPORT', entity: 'SHIPMENT', newValue: { imported: result.imported, duplicates: result.duplicates }, ip: req.ip });
  R.ok(res, result, `Imported ${result.imported} shipments`);
});

const getValidStatuses = asyncHandler(async (req, res) => {
  const s = await svc.getById(req.params.id);
  const transitions = stateMachine.getValidTransitions(s.status);
  R.ok(res, { currentStatus: s.status, validTransitions: transitions, isTerminal: transitions.length === 0 });
});

const getTodayStats = asyncHandler(async (req, res) => {
  const stats = await svc.getTodayStats();
  R.ok(res, stats);
});

const getMonthlyStats = asyncHandler(async (req, res) => {
  const year  = parseInt(req.query.year)  || new Date().getFullYear();
  const month = parseInt(req.query.month) || new Date().getMonth() + 1;
  const rows  = await svc.getMonthlyStats(year, month);
  R.ok(res, rows);
});

const scanAwb = asyncHandler(async (req, res) => {
  const result = await svc.scanAwbAndUpdate(req.body.awb, req.user?.id, req.body.courier);
  await auditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'SCAN_AWB', entity: 'SHIPMENT', entityId: result.shipment?.id, newValue: result, ip: req.ip });
  R.ok(res, result, 'AWB scanned and updated successfully');
});

const scanAwbBulk = asyncHandler(async (req, res) => {
  const result = await svc.scanAwbBulkAndUpdate(req.body.awbs, req.user?.id, req.body.courier);
  await auditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'SCAN_AWB_BULK', entity: 'SHIPMENT', newValue: { totalScanned: req.body.awbs.length, successes: result.successful.length }, ip: req.ip });
  R.ok(res, result, 'Bulk AWB scan completed');
});

module.exports = { getAll, getOne, create, update, patchStatus, remove, bulkImport, getTodayStats, getMonthlyStats, getValidStatuses, deleteShipment: remove,
  scanAwb,
  scanAwbBulk
};
