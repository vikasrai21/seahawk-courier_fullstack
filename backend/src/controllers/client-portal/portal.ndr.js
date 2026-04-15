'use strict';

const prisma = require('../../config/prisma');
const R = require('../../utils/response');
const { resolveClientCode } = require('./shared');
const notify = require('../../services/notification.service');
const exceptionAutomation = require('../../services/exceptionAutomation.service');

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

  const enriched = await exceptionAutomation.buildNdrAutomationView(clientCode, items);
  R.ok(res, { ndrs: enriched, pagination: { total, page: safePage, limit: safeLimit } });
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

async function whatsappBridge(req, res) {
  const clientCode = await resolveClientCode(req, req.body);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const ndr = await prisma.nDREvent.findUnique({
    where: { id: parseInt(req.params.id, 10) },
    include: {
      shipment: { select: { id: true, awb: true, clientCode: true, consignee: true, destination: true, phone: true } },
    },
  });
  if (!ndr || ndr.shipment?.clientCode !== clientCode) return R.notFound(res, 'NDR');

  const rawPhone = String(req.body?.phone || ndr.shipment?.phone || '').trim();
  const phone = rawPhone.replace(/\D/g, '');
  if (!phone || phone.length < 10) return R.badRequest(res, 'Valid customer phone number is required.');

  const preferredDate = String(req.body?.preferredDate || '').trim();
  const mapHint = String(req.body?.mapHint || '').trim();
  const note = String(req.body?.note || '').trim();
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const fallbackTrack = `${baseUrl}/track/${encodeURIComponent(ndr.awb)}`;
  const message = [
    `Sea Hawk Delivery Support`,
    `AWB: ${ndr.awb}`,
    `Hi ${ndr.shipment?.consignee || 'Customer'}, please share your live location and preferred delivery slot so we can reattempt your shipment.`,
    `Tracking link: ${fallbackTrack}`,
    preferredDate ? `Preferred date: ${preferredDate}` : '',
    mapHint ? `Location note: ${mapHint}` : '',
    note ? `Note: ${note}` : '',
  ].filter(Boolean).join('\n');

  await notify.sendWhatsApp(phone, message);

  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'CLIENT_NDR_WHATSAPP_BRIDGE',
      entity: 'NDR',
      entityId: String(ndr.id),
      newValue: { awb: ndr.awb, to: phone, preferredDate: preferredDate || null, mapHint: mapHint || null, note: note || null },
      ip: req.ip,
    },
  });

  R.ok(res, { sent: true, to: phone }, 'WhatsApp bridge message sent to customer.');
}

async function escalate(req, res) {
  const clientCode = await resolveClientCode(req, req.body);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const notes = String(req.body?.notes || '').trim();
  try {
    const result = await exceptionAutomation.escalateNdrForOps({
      ndrId: req.params.id,
      user: req.user,
      clientCode,
      notes,
    });
    await notify.sendOpsEscalationAlert({
      clientCode,
      awb: result?.ndr?.awb,
      ndrId: result?.ndr?.id,
      urgency: result?.automation?.urgency?.severity || 'high',
      note: notes || null,
    });
    R.ok(res, result, 'NDR escalated to operations successfully.');
  } catch (err) {
    if (String(err.message || '').toLowerCase().includes('not found')) {
      return R.notFound(res, 'NDR');
    }
    if (String(err.message || '').toLowerCase().includes('does not belong')) {
      return R.error(res, err.message, 403);
    }
    return R.error(res, err.message || 'Unable to escalate NDR', 400);
  }
}

module.exports = { list, respond, whatsappBridge, escalate };
