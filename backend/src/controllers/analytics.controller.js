/* analytics.controller.js — with Redis caching (5-min TTL) */
'use strict';

const R = require('../utils/response');
const cache = require('../utils/cache');
const analyticsService = require('../services/analytics.service');

// Build a stable cache key from query params
function cacheKey(prefix, params) {
  const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  return `analytics:${prefix}:${sorted}`;
}

const TTL = 300; // 5 minutes

/* ── GET /api/analytics/overview ── */
async function overview(req, res) {
  try {
    const { dateFrom, dateTo } = req.query;
    const key = cacheKey('overview', { dateFrom: dateFrom || '', dateTo: dateTo || '' });

    const result = await cache.wrap(key, async () => {
      return await analyticsService.getOverview(dateFrom, dateTo);
    }, TTL);

    return R.ok(res, result);
  } catch (err) { return R.error(res, err.message); }
}

/* ── GET /api/analytics/couriers ── */
async function courierPerformance(req, res) {
  try {
    const { dateFrom, dateTo } = req.query;
    const key = cacheKey('couriers', { dateFrom: dateFrom || '', dateTo: dateTo || '' });

    const result = await cache.wrap(key, async () => {
      return await analyticsService.getCourierPerformance(dateFrom, dateTo);
    }, TTL);

    return R.ok(res, result);
  } catch (err) { return R.error(res, err.message); }
}

/* ── GET /api/analytics/clients ── */
async function clientAnalytics(req, res) {
  try {
    const { dateFrom, dateTo, limit = 15 } = req.query;
    const key = cacheKey('clients', { dateFrom: dateFrom || '', dateTo: dateTo || '', limit });

    const result = await cache.wrap(key, async () => {
      return await analyticsService.getClientAnalytics(dateFrom, dateTo, limit);
    }, TTL);

    return R.ok(res, result);
  } catch (err) { return R.error(res, err.message); }
}

/* ── GET /api/analytics/monthly ── */
async function monthlyTrend(req, res) {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const key = cacheKey('monthly', { year });

    const result = await cache.wrap(key, async () => {
      return await analyticsService.getMonthlyTrend(year);
    }, TTL);

    return R.ok(res, result);
  } catch (err) { return R.error(res, err.message); }
}

/* ── GET /api/analytics/ndr ── */
async function ndrAnalytics(req, res) {
  try {
    const { dateFrom, dateTo } = req.query;
    const key = cacheKey('ndr', { dateFrom: dateFrom || '', dateTo: dateTo || '' });

    const result = await cache.wrap(key, async () => {
      return await analyticsService.getNdrAnalytics(dateFrom, dateTo);
    }, TTL);

    return R.ok(res, result);
  } catch (err) { return R.error(res, err.message); }
}

/* ── GET /api/analytics/sla ── */
async function slaCompliance(req, res) {
  try {
    const { clientCode, dateFrom, dateTo } = req.query;
    const key = cacheKey('sla', { clientCode: clientCode || '', dateFrom: dateFrom || '', dateTo: dateTo || '' });

    const result = await cache.wrap(key, async () => {
      return await analyticsService.getSLACompliance(clientCode, dateFrom, dateTo);
    }, TTL);

    return R.ok(res, result);
  } catch (err) { return R.error(res, err.message); }
}

/* ── GET /api/analytics/cost ── */
async function costPerShipment(req, res) {
  try {
    const { clientCode, dateFrom, dateTo } = req.query;
    const key = cacheKey('cost', { clientCode: clientCode || '', dateFrom: dateFrom || '', dateTo: dateTo || '' });

    const result = await cache.wrap(key, async () => {
      return await analyticsService.getCostPerShipment(clientCode, dateFrom, dateTo);
    }, TTL);

    return R.ok(res, result);
  } catch (err) { return R.error(res, err.message); }
}

module.exports = { overview, courierPerformance, clientAnalytics, monthlyTrend, ndrAnalytics, slaCompliance, costPerShipment };
