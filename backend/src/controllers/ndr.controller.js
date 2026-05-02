/* ndr.controller.js — Feature #5: NDR Management */

'use strict';

const prisma  = require('../config/prisma');
const R       = require('../utils/response');
const notify  = require('../services/notification.service');
const { logAudit } = require('../utils/audit');
const logger  = require('../utils/logger');

/* ── GET /api/ndr  — list all NDR shipments ── */
async function list(req, res) {
  try {
    const { action, dateFrom, dateTo, page = 1, limit = 30 } = req.query;
    const where = {};
    if (action) where.action = action;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo)   where.createdAt.lte = new Date(dateTo + 'T23:59:59Z');
    }

    const [ndrs, total] = await Promise.all([
      prisma.nDREvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:  (parseInt(page) - 1) * parseInt(limit),
        take:  parseInt(limit),
        include: {
          shipment: {
            select: { awb: true, consignee: true, destination: true, courier: true, clientCode: true, phone: true },
          },
        },
      }),
      prisma.nDREvent.count({ where }),
    ]);

    // Summary stats
    const stats = await prisma.nDREvent.groupBy({
      by:    ['action'],
      _count: { id: true },
    });

    return R.ok(res, {
      ndrs,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      stats: Object.fromEntries(stats.map(s => [s.action, s._count.id])),
    });
  } catch (err) {
    return R.error(res, err.message);
  }
}

/* ── POST /api/ndr  — record a new NDR event ── */
async function create(req, res) {
  try {
    const { awb, reason, description, attemptNo } = req.body;
    if (!awb || !reason) return R.error(res, 'awb and reason are required', 400);

    const shipment = await prisma.shipment.findUnique({
      where: { awb },
      select: { id: true, awb: true, courier: true, consignee: true },
    });
    if (!shipment) return R.error(res, 'Shipment not found', 404);

    const ndr = await prisma.$transaction(async (tx) => {
      const created = await tx.nDREvent.create({
        data: {
          shipmentId:  shipment.id,
          awb,
          reason,
          description: description || '',
          attemptNo:   attemptNo || 1,
          action:      'PENDING',
        },
      });

      await tx.shipment.update({
        where: { awb },
        data:  { status: 'Failed', ndrStatus: 'PENDING' },
      });

      return created;
    });

    try {
      if (typeof notify.ndrAlert === 'function') {
        await notify.ndrAlert(shipment, reason);
      } else {
        logger.warn('[NDR] Notification skipped: notify.ndrAlert is not configured');
      }
    } catch (err) {
      logger.warn('[NDR] Notification failed after NDR was recorded', { awb, error: err.message });
    }

    await logAudit({ req, action: 'NDR_CREATED', entity: 'Shipment', entityId: awb, newValue: { reason } });

    return R.created(res, ndr, 'NDR recorded');
  } catch (err) {
    return R.error(res, err.message);
  }
}

/* ── PATCH /api/ndr/:id  — update NDR action ── */
async function update(req, res) {
  try {
    const { id } = req.params;
    const { action, newAddress } = req.body;

    const validActions = ['PENDING', 'REATTEMPT', 'UPDATE_ADDRESS', 'RTO', 'RESOLVED'];
    if (!validActions.includes(action)) {
      return R.error(res, `Invalid action. Must be one of: ${validActions.join(', ')}`, 400);
    }

    const ndr = await prisma.nDREvent.update({
      where: { id: parseInt(id) },
      data:  {
        action,
        newAddress: newAddress || undefined,
        resolvedAt: action === 'RESOLVED' ? new Date() : undefined,
      },
      include: { shipment: true },
    });

    // Update shipment based on action
    if (action === 'RTO') {
      await prisma.shipment.update({
        where: { id: ndr.shipmentId },
        data:  { status: 'RTO', ndrStatus: 'RTO' },
      });
    } else if (action === 'RESOLVED') {
      await prisma.shipment.update({
        where: { id: ndr.shipmentId },
        data:  { status: 'Delivered', ndrStatus: null },
      });
    } else if (action === 'REATTEMPT') {
      await prisma.shipment.update({
        where: { id: ndr.shipmentId },
        data:  { ndrStatus: 'PENDING' },
      });
    } else if (action === 'UPDATE_ADDRESS' && newAddress) {
      await prisma.shipment.update({
        where: { id: ndr.shipmentId },
        data:  { destination: newAddress, ndrStatus: 'PENDING' },
      });
    }

    await logAudit({ req, action: 'NDR_UPDATED', entity: 'NDR', entityId: String(id), newValue: { action } });

    return R.ok(res, ndr);
  } catch (err) {
    return R.error(res, err.message);
  }
}

/* ── GET /api/ndr/stats ── */
async function stats(req, res) {
  try {
    const [total, pending, rto, resolved, byReason] = await Promise.all([
      prisma.nDREvent.count(),
      prisma.nDREvent.count({ where: { action: 'PENDING' } }),
      prisma.nDREvent.count({ where: { action: 'RTO' } }),
      prisma.nDREvent.count({ where: { action: 'RESOLVED' } }),
      prisma.nDREvent.groupBy({
        by:    ['reason'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take:  5,
      }),
    ]);

    return R.ok(res, {
      total, pending, rto, resolved,
      byReason: byReason.map(r => ({ reason: r.reason, count: r._count.id })),
    });
  } catch (err) {
    return R.error(res, err.message);
  }
}

module.exports = { list, create, update, stats };
