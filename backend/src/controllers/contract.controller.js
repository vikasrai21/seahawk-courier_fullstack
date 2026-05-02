const svc = require('../services/contract.service');
const R   = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const { auditLog } = require('../utils/audit');

const getAll       = asyncHandler(async (req, res) => R.ok(res, await svc.getAll()));
const getByClient  = asyncHandler(async (req, res) => R.ok(res, await svc.getByClient(req.params.code)));
const save         = asyncHandler(async (req, res) => {
  const contract = await svc.upsert(req.body);
  await auditLog({ userId: req.user?.id, userEmail: req.user?.email, action: req.body.id ? 'UPDATE' : 'CREATE', entity: 'CONTRACT', entityId: String(contract.id), newValue: contract, ip: req.ip });
  R.ok(res, contract, 'Contract saved');
});
const remove       = asyncHandler(async (req, res) => {
  await svc.remove(req.params.id);
  await auditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'DELETE', entity: 'CONTRACT', entityId: String(req.params.id), ip: req.ip });
  R.ok(res, null, 'Deleted');
});
const calcPrice    = asyncHandler(async (req, res) => R.ok(res, await svc.calculatePrice(req.query)));

module.exports = { getAll, getByClient, save, remove, calcPrice };
