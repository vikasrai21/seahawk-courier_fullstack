const svc = require('../services/contract.service');
const R   = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const getAll       = asyncHandler(async (req, res) => R.ok(res, await svc.getAll()));
const getByClient  = asyncHandler(async (req, res) => R.ok(res, await svc.getByClient(req.params.code)));
const save         = asyncHandler(async (req, res) => R.ok(res, await svc.upsert(req.body), 'Contract saved'));
const remove       = asyncHandler(async (req, res) => { await svc.remove(req.params.id); R.ok(res, null, 'Deleted'); });
const calcPrice    = asyncHandler(async (req, res) => R.ok(res, await svc.calculatePrice(req.query)));

module.exports = { getAll, getByClient, save, remove, calcPrice };
