const svc = require('../services/invoice.service');
const R   = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const getAll     = asyncHandler(async (req, res) => R.ok(res, await svc.getAll(req.query.client)));
const getOne     = asyncHandler(async (req, res) => R.ok(res, await svc.getById(req.params.id)));
const create     = asyncHandler(async (req, res) => R.created(res, await svc.create(req.body), 'Invoice created'));
const setStatus  = asyncHandler(async (req, res) => R.ok(res, await svc.updateStatus(req.params.id, req.body.status), 'Status updated'));
const remove     = asyncHandler(async (req, res) => { await svc.remove(req.params.id); R.ok(res, null, 'Deleted'); });

module.exports = { getAll, getOne, create, setStatus, remove };
