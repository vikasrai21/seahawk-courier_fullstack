/* pickup.controller.js — Feature #8: Pickup Scheduling */
'use strict';

const prisma  = require('../config/prisma');
const R       = require('../utils/response');
const notify  = require('../services/notification.service');
const { logAudit } = require('../utils/audit');

const genRef = () => `PKP-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;

/* ── POST /api/pickups  — create pickup request ── */
async function create(req, res) {
  try {
    const {
      contactName, contactPhone, contactEmail,
      pickupAddress, pickupCity, pickupPin,
      deliveryAddress, deliveryCity, deliveryState, deliveryCountry,
      packageType, weightGrams, pieces, service, declaredValue,
      preferredCarrier, scheduledDate, timeSlot, clientCode, notes, source,
    } = req.body;

    if (!contactName || !contactPhone || !pickupAddress || !pickupCity || !pickupPin || !scheduledDate || !timeSlot) {
      return R.error(res, 'Missing required fields: contactName, contactPhone, pickupAddress, pickupCity, pickupPin, scheduledDate, timeSlot', 400);
    }

    // Validate date not in past
    if (new Date(scheduledDate) < new Date(new Date().toDateString())) {
      return R.error(res, 'Pickup date cannot be in the past', 400);
    }

    const pickup = await prisma.pickupRequest.create({
      data: {
        requestNo:        genRef(),
        clientCode:       clientCode || undefined,
        contactName,
        contactPhone,
        contactEmail:     contactEmail || undefined,
        pickupAddress,
        pickupCity,
        pickupPin,
        deliveryAddress:  deliveryAddress || undefined,
        deliveryCity:     deliveryCity || undefined,
        deliveryState:    deliveryState || undefined,
        deliveryCountry:  deliveryCountry || 'India',
        packageType:      packageType || 'Parcel',
        weightGrams:      parseFloat(weightGrams) || 0,
        pieces:           parseInt(pieces) || 1,
        service:          service || 'Standard',
        declaredValue:    declaredValue ? parseFloat(declaredValue) : undefined,
        preferredCarrier: preferredCarrier || undefined,
        scheduledDate,
        timeSlot,
        notes:            notes || undefined,
        source:           source || 'PORTAL',
        status:           'PENDING',
      },
    });

    // Notify customer
    await notify.pickupConfirmed(pickup).catch(() => {});

    await logAudit({ req, action: 'PICKUP_CREATED', entity: 'PickupRequest', entityId: pickup.requestNo });

    return R.ok(res, pickup, 201);
  } catch (err) {
    return R.error(res, err.message);
  }
}

/* ── GET /api/pickups  — list pickups ── */
async function list(req, res) {
  try {
    const { status, date, agentId, page = 1, limit = 25 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (date)   where.scheduledDate = date;
    if (agentId) where.assignedAgentId = parseInt(agentId);

    const [pickups, total] = await Promise.all([
      prisma.pickupRequest.findMany({
        where,
        orderBy: [{ scheduledDate: 'asc' }, { timeSlot: 'asc' }],
        skip:    (parseInt(page) - 1) * parseInt(limit),
        take:    parseInt(limit),
        include: {
          client:        { select: { company: true } },
          assignedAgent: { select: { name: true, phone: true } },
        },
      }),
      prisma.pickupRequest.count({ where }),
    ]);

    return R.ok(res, {
      pickups, total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    return R.error(res, err.message);
  }
}

/* ── GET /api/pickups/:id ── */
async function getOne(req, res) {
  try {
    const p = await prisma.pickupRequest.findUnique({
      where:   { id: parseInt(req.params.id) },
      include: {
        client:        true,
        assignedAgent: { select: { id: true, name: true, phone: true } },
      },
    });
    if (!p) return R.error(res, 'Pickup request not found', 404);
    return R.ok(res, p);
  } catch (err) {
    return R.error(res, err.message);
  }
}

/* ── PATCH /api/pickups/:id  — assign agent / update status ── */
async function update(req, res) {
  try {
    const { id } = req.params;
    const { status, assignedAgentId, notes } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'COMPLETED', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
      return R.error(res, `Invalid status`, 400);
    }

    const pickup = await prisma.pickupRequest.update({
      where: { id: parseInt(id) },
      data: {
        status:          status || undefined,
        assignedAgentId: assignedAgentId ? parseInt(assignedAgentId) : undefined,
        notes:           notes || undefined,
      },
    });

    await logAudit({ req, action: 'PICKUP_UPDATED', entity: 'PickupRequest', entityId: String(id), newValue: { status } });

    return R.ok(res, pickup);
  } catch (err) {
    return R.error(res, err.message);
  }
}

/* ── GET /api/pickups/today  — today's pickups for ops ── */
async function today(req, res) {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const pickups  = await prisma.pickupRequest.findMany({
      where:   { scheduledDate: todayStr, status: { notIn: ['CANCELLED'] } },
      orderBy: { timeSlot: 'asc' },
      include: {
        assignedAgent: { select: { name: true, phone: true } },
        shipments:     { select: { awb: true } },
      },
    });
    return R.ok(res, { date: todayStr, count: pickups.length, pickups });
  } catch (err) {
    return R.error(res, err.message);
  }
}

/* ── GET /api/pickups/stats ── */
async function pickupStats(req, res) {
  try {
    const [total, pending, confirmed, completed, cancelled] = await Promise.all([
      prisma.pickupRequest.count(),
      prisma.pickupRequest.count({ where: { status: 'PENDING' } }),
      prisma.pickupRequest.count({ where: { status: { in: ['CONFIRMED', 'ASSIGNED'] } } }),
      prisma.pickupRequest.count({ where: { status: 'COMPLETED' } }),
      prisma.pickupRequest.count({ where: { status: 'CANCELLED' } }),
    ]);
    return R.ok(res, { total, pending, confirmed, completed, cancelled });
  } catch (err) {
    return R.error(res, err.message);
  }
}

module.exports = { create, list, getOne, update, today, pickupStats };
