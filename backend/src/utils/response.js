// src/utils/response.js — Standard API response format
// All responses follow: { success, message, data, pagination }

const ok = (res, data = null, message = 'Success', status = 200) =>
  res.status(status).json({ success: true, message, data });

const created = (res, data, message = 'Created') =>
  ok(res, data, message, 201);

const paginated = (res, data, total, page, limit, message = 'Success') =>
  res.status(200).json({
    success: true, message, data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
  });

const error = (res, message, status = 400, errors = null) =>
  res.status(status).json({ success: false, message, ...(errors && { errors }) });

const badRequest = (res, msg = 'Bad request', errors = null) => error(res, msg, 400, errors);
const notFound  = (res, entity = 'Resource') => error(res, `${entity} not found`, 404);
const forbidden = (res, msg = 'Access denied') => error(res, msg, 403);
const unauthorized = (res, msg = 'Unauthorized') => error(res, msg, 401);
const conflict  = (res, msg) => error(res, msg, 409);

module.exports = { ok, created, paginated, error, badRequest, notFound, forbidden, unauthorized, conflict };
