'use strict';

const prisma = require('../../config/prisma');
const R = require('../../utils/response');
const { resolveClientCode } = require('./shared');

async function list(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const { action, page = 1, limit = 25 } = req.query;
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(10, parseInt(limit, 10) || 25));
  const skip = (safePage - 1) * safeLimit;
  const where = { shipment: { clientCode }, ...(action ? { action } : {}) };

  const [total, items] = await Promise.all([
    prisma.nDREvent.count({ where }),
    prisma.nDREvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: safeLimit,
      include: {
        shipment: { select: { id: true, awb: true, consignee: true, destination: true, phone: true, courier: true, status: true } },
      },
    }),
  ]);

  R.ok(res, { ndrs: items, pagination: { total, page: safePage, limit: safeLimit } });
}

async function respond(req, res) {
  const clientCode = await resolveClientCode(req, req.body);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const ndr = await prisma.nDREvent.findUnique({
    where: { id: parseInt(req.params.id, 10) },
    include: {
      shipment: { select: { id: true, awb: true, clientCode: true, destination: true, phone: true } },
    },
  });
  if (!ndr || ndr.shipment?.clientCode !== clientCode) return R.notFound(res, 'NDR');

  const action = String(req.body?.action || 'REATTEMPT').trim().toUpperCase();
  const newAddress = String(req.body?.newAddress || '').trim();
  const newPhone = String(req.body?.newPhone || '').trim();
  const rescheduleDate = String(req.body?.rescheduleDate || '').trim();
  const notes = String(req.body?.notes || '').trim();

  if (!['REATTEMPT', 'UPDATE_ADDRESS', 'RTO'].includes(action)) {
    return R.error(res, 'Invalid action', 400);
  }

  const shipmentPatch = {};
  if (newAddress) shipmentPatch.destination = newAddress;
  if (newPhone) shipmentPatch.phone = newPhone;

  const updated = await prisma.$transaction(async (tx) => {
    const item = await tx.nDREvent.update({
      where: { id: ndr.id },
      data: { action, newAddress: newAddress || undefined },
    });

    if (Object.keys(shipmentPatch).length) {
      await tx.shipment.update({ where: { id: ndr.shipment.id }, data: shipmentPatch });
    }

    await tx.auditLog.create({
      data: {
        userId: req.user.id,
        userEmail: req.user.email,
        action: 'CLIENT_NDR_REQUEST',
        entity: 'NDR',
        entityId: String(ndr.id),
        newValue: {
          action,
          newAddress: newAddress || null,
          newPhone: newPhone || null,
          rescheduleDate: rescheduleDate || null,
          notes: notes || null,
          awb: ndr.awb,
        },
        ip: req.ip,
      },
    });

    return item;
  });

  R.ok(res, updated, 'NDR request submitted successfully.');
}

module.exports = { list, respond };
