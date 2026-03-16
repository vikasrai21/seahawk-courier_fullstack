/* tracking.controller.js — Features #3, #4
   Shipment dashboard with full filters/pagination + tracking events */

'use strict';

const prisma   = require('../config/prisma');
const R        = require('../utils/response');
const carrier  = require('../services/carrier.service');
const queue    = require('../services/queue.service');
const logger   = require('../utils/logger');

/* ── GET /api/tracking/:awb  — full tracking timeline ── */
async function getTimeline(req, res) {
  try {
    const { awb } = req.params;
    const shipment = await prisma.shipment.findUnique({
      where:   { awb },
      include: {
        trackingEvents: { orderBy: { timestamp: 'desc' } },
        ndrEvents:      { orderBy: { createdAt: 'desc' } },
        client:         { select: { code: true, company: true } },
      },
    });
    if (!shipment) return R.error(res, 'Shipment not found', 404);

    // Trigger live sync in background
    if (shipment.courier) {
      queue.enqueueTrackingSync(shipment.id, shipment.awb, shipment.courier).catch(() => {});
    }

    return R.ok(res, {
      shipment: {
        id:          shipment.id,
        awb:         shipment.awb,
        consignee:   shipment.consignee,
        destination: shipment.destination,
        pincode:     shipment.pincode,
        courier:     shipment.courier,
        service:     shipment.service,
        status:      shipment.status,
        date:        shipment.date,
        weight:      shipment.weight,
        amount:      shipment.amount,
        client:      shipment.client,
      },
      events: shipment.trackingEvents,
      ndrs:   shipment.ndrEvents,
    });
  } catch (err) {
    logger.error('getTimeline error', err);
    return R.error(res, err.message);
  }
}

/* ── POST /api/tracking/:awb/sync  — force-sync from carrier ── */
async function forceSync(req, res) {
  try {
    const { awb } = req.params;
    const shipment = await prisma.shipment.findUnique({
      where:  { awb },
      select: { id: true, courier: true },
    });
    if (!shipment) return R.error(res, 'Shipment not found', 404);
    if (!shipment.courier) return R.error(res, 'No carrier assigned to this shipment', 400);

    const count = await carrier.syncTrackingEvents(shipment.id, awb, shipment.courier);
    return R.ok(res, { message: `Synced ${count} new events`, eventsAdded: count });
  } catch (err) {
    return R.error(res, err.message);
  }
}

/* ── POST /api/tracking/:awb/event  — manual event entry (admin) ── */
async function addManualEvent(req, res) {
  try {
    const { awb } = req.params;
    const { status, location, description, timestamp } = req.body;
    if (!status) return R.error(res, 'status is required', 400);

    const shipment = await prisma.shipment.findUnique({
      where:  { awb },
      select: { id: true },
    });
    if (!shipment) return R.error(res, 'Shipment not found', 404);

    const event = await prisma.trackingEvent.create({
      data: {
        shipmentId:  shipment.id,
        awb,
        status,
        location:    location || '',
        description: description || '',
        timestamp:   timestamp ? new Date(timestamp) : new Date(),
        source:      'MANUAL',
      },
    });

    // Update shipment status
    await prisma.shipment.update({
      where: { awb },
      data:  { status, updatedById: req.user?.id },
    });

    return R.ok(res, event, 201);
  } catch (err) {
    return R.error(res, err.message);
  }
}

/* ── GET /api/shipments/dashboard  — Feature #3 ── */
async function getDashboard(req, res) {
  try {
    const {
      page = 1, limit = 25,
      search, courier, status, clientCode,
      dateFrom, dateTo,
      ndrStatus, sortBy = 'createdAt', sortDir = 'desc',
    } = req.query;

    const where = {};
    if (search)     where.OR = [{ awb: { contains: search, mode: 'insensitive' } }, { consignee: { contains: search, mode: 'insensitive' } }];
    if (courier)    where.courier = courier;
    if (status)     where.status  = status;
    if (clientCode) where.clientCode = clientCode;
    if (ndrStatus)  where.ndrStatus  = ndrStatus;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = dateFrom;
      if (dateTo)   where.date.lte = dateTo;
    }

    // Role-based filter: CLIENT role can only see their own shipments
    if (req.user?.role === 'CLIENT') {
      const client = await prisma.client.findFirst({ where: { email: req.user.email } });
      if (client) where.clientCode = client.code;
    }

    const skip   = (parseInt(page) - 1) * parseInt(limit);
    const orderBy = { [sortBy]: sortDir };

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where, skip, take: parseInt(limit), orderBy,
        include: {
          client: { select: { company: true } },
          trackingEvents: { orderBy: { timestamp: 'desc' }, take: 1 },
        },
      }),
      prisma.shipment.count({ where }),
    ]);

    // Aggregate stats for the filtered set
    const stats = await prisma.shipment.aggregate({
      where,
      _count:  { id: true },
      _sum:    { amount: true, weight: true },
    });

    return R.ok(res, {
      shipments,
      pagination: {
        total, page: parseInt(page), limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
      stats: {
        count:       stats._count.id,
        totalAmount: stats._sum.amount,
        totalWeight: stats._sum.weight,
      },
    });
  } catch (err) {
    logger.error('getDashboard error', err);
    return R.error(res, err.message);
  }
}

module.exports = { getTimeline, forceSync, addManualEvent, getDashboard };
