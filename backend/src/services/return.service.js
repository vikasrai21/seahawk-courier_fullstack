/* ============================================================
   return.service.js — Reverse Logistics / Return Management
   
   Handles return requests from clients, admin approval,
   and reverse pickup booking via courier APIs.
   ============================================================ */
'use strict';

const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const carrierService = require('./carrier.service');
const { recommendCourierForBooking } = require('./courierDecision.service');
const { AppError } = require('../middleware/errorHandler');

const VALID_REASONS = ['customer_return', 'damaged', 'wrong_item', 'size_exchange', 'quality_issue', 'other'];
const VALID_STATUSES = ['PENDING', 'APPROVED', 'LABEL_READY', 'PICKUP_BOOKED', 'IN_TRANSIT', 'RECEIVED', 'RETURNED_TO_CLIENT', 'REJECTED'];
const VALID_RETURN_METHODS = ['PICKUP', 'SELF_SHIP'];
const REVERSE_BOOKING_CARRIERS = ['Trackon', 'Delhivery', 'DTDC', 'BlueDart'];
const REVERSE_TRACKABLE_STATUSES = ['LABEL_READY', 'PICKUP_BOOKED', 'IN_TRANSIT'];
const STATUS_TRANSITIONS = {
  PENDING: ['APPROVED', 'REJECTED'],
  APPROVED: ['LABEL_READY', 'PICKUP_BOOKED', 'REJECTED'],
  LABEL_READY: ['IN_TRANSIT', 'REJECTED'],
  PICKUP_BOOKED: ['IN_TRANSIT', 'REJECTED'],
  IN_TRANSIT: ['RECEIVED'],
  RECEIVED: ['RETURNED_TO_CLIENT'],
  RETURNED_TO_CLIENT: [],
  REJECTED: [],
};

function parseReturnId(id) {
  const parsed = parseInt(id, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new AppError('Invalid return request id', 400);
  }
  return parsed;
}

function normalizeStatus(status) {
  return String(status || '').trim().toUpperCase();
}

function normalizeReturnMethod(method, { strict = false } = {}) {
  const normalized = String(method || 'PICKUP').trim().toUpperCase();
  if (!VALID_RETURN_METHODS.includes(normalized) && strict) {
    throw new AppError(`Invalid return method. Must be one of: ${VALID_RETURN_METHODS.join(', ')}`, 400);
  }
  return VALID_RETURN_METHODS.includes(normalized) ? normalized : 'PICKUP';
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length < 10 || digits.length > 15) {
    throw new AppError('Pickup phone must be between 10 and 15 digits', 400);
  }
  return digits;
}

function normalizePincode(pincode) {
  const digits = String(pincode || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length !== 6) {
    throw new AppError('Pickup pincode must be 6 digits', 400);
  }
  return digits;
}

function normalizeAddressField(value, label, { required = false } = {}) {
  const normalized = String(value || '').trim();
  if (required && !normalized) throw new AppError(`${label} is required`, 400);
  return normalized;
}

function assertTransition(currentStatus, nextStatus, returnMethod, { force = false } = {}) {
  const current = normalizeStatus(currentStatus);
  const next = normalizeStatus(nextStatus);
  const method = normalizeReturnMethod(returnMethod || 'PICKUP', { strict: true });

  if (!VALID_STATUSES.includes(next)) {
    throw new AppError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 400);
  }
  if (current === next) return;
  if (force) return;

  if (method === 'SELF_SHIP' && next === 'PICKUP_BOOKED') {
    throw new AppError('SELF_SHIP returns cannot transition to PICKUP_BOOKED', 409);
  }
  if (method === 'PICKUP' && next === 'LABEL_READY') {
    throw new AppError('PICKUP returns cannot transition to LABEL_READY', 409);
  }

  const allowed = STATUS_TRANSITIONS[current] || [];
  if (!allowed.includes(next)) {
    throw new AppError(`Invalid status transition: ${current} -> ${next}`, 409);
  }
}

async function logReturnAudit({
  action,
  returnId,
  actor = {},
  oldValue = null,
  newValue = null,
}) {
  await prisma.auditLog.create({
    data: {
      userId: actor.userId || null,
      userEmail: actor.userEmail || null,
      action,
      entity: 'RETURN_REQUEST',
      entityId: String(returnId),
      oldValue: oldValue || undefined,
      newValue: newValue || undefined,
      ip: actor.ip || null,
    },
  });
}

function getReverseHubConfig() {
  return {
    name: process.env.REVERSE_HUB_NAME || process.env.DELHIVERY_SELLER_NAME || 'Sea Hawk Courier & Cargo',
    address: process.env.REVERSE_HUB_ADDRESS || process.env.DELHIVERY_SELLER_ADDRESS || 'Shop 6 & 7, Rao Lal Singh Market, Sector-18',
    city: process.env.REVERSE_HUB_CITY || process.env.DELHIVERY_SELLER_CITY || 'Gurugram',
    state: process.env.REVERSE_HUB_STATE || process.env.DELHIVERY_SELLER_STATE || 'Haryana',
    pin: process.env.REVERSE_HUB_PIN || process.env.DELHIVERY_SELLER_PIN || '122015',
    phone: process.env.REVERSE_HUB_PHONE || process.env.TRACKON_PICKUP_PHONE || '9999999999',
  };
}

function formatDateYYYYMMDD(value = new Date()) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function buildReverseBookingPayload(ret) {
  const hub = getReverseHubConfig();
  const returnMethod = normalizeReturnMethod(ret.returnMethod);
  const isSelfShip = returnMethod === 'SELF_SHIP';
  return {
    consignee: hub.name,
    deliveryAddress: hub.address,
    deliveryCity: hub.city,
    deliveryState: hub.state,
    deliveryCountry: 'India',
    pin: hub.pin,
    phone: hub.phone,
    weightGrams: Math.max(100, Math.round((ret.shipment?.weight || 0.5) * 1000)),
    declaredValue: Number(ret.shipment?.amount || 0),
    contents: `Reverse return (${ret.reason}) [${returnMethod}]`,
    orderRef: `RET-${ret.id}-${ret.originalAwb}`,
    service: 'Standard',

    // Useful for carriers that support pickup-specific payload fields.
    pickupName: ret.shipment?.consignee || 'Customer',
    pickupAddress: ret.pickupAddress || ret.shipment?.destination || '',
    pickupCity: ret.pickupCity || '',
    pickupState: ret.pickupState || '',
    pickupPincode: ret.pickupPincode || ret.shipment?.pincode || '',
    pickupPhone: ret.pickupPhone || ret.shipment?.phone || '9999999999',
    clientCode: ret.clientCode,
    actionType: isSelfShip ? 'Book' : 'Pickup',
  };
}

function getReverseCarrierCandidates(ret) {
  const returnMethod = normalizeReturnMethod(ret.returnMethod);
  const preferred = returnMethod === 'SELF_SHIP'
    ? ['Delhivery', ...REVERSE_BOOKING_CARRIERS]
    : REVERSE_BOOKING_CARRIERS;
  const configured = carrierService.getConfiguredCarriers(preferred);
  if (!configured.length) {
    throw new AppError('No reverse-booking carrier is configured. Set Delhivery/Trackon/DTDC credentials in environment variables.', 503);
  }

  const decision = recommendCourierForBooking({
    pincode: ret.pickupPincode || ret.shipment?.pincode || '',
    deliveryState: ret.pickupState || '',
    service: 'Standard',
    weightGrams: Math.max(100, Math.round((ret.shipment?.weight || 0.5) * 1000)),
    cod: false,
  });

  const ordered = [];
  for (const carrier of [decision.recommendedCourier, decision.fallbackCourier, ...configured]) {
    if (!carrier || !configured.includes(carrier) || ordered.includes(carrier)) continue;
    ordered.push(carrier);
  }
  return { ordered, decision };
}

function mapCarrierStatusToReturnStatus(currentStatus, carrierStatus) {
  if (currentStatus === 'RETURNED_TO_CLIENT') return 'RETURNED_TO_CLIENT';
  const normalized = String(carrierStatus || '').trim().toUpperCase();
  if (!normalized) return currentStatus;
  if (normalized === 'DELIVERED') return 'RECEIVED';
  if (['INTRANSIT', 'OUTFORDELIVERY', 'PICKEDUP'].includes(normalized)) return 'IN_TRANSIT';
  if (normalized === 'BOOKED') return currentStatus;
  return currentStatus;
}

/**
 * Create a new return request (called by client via portal).
 */
async function createReturnRequest({
  shipmentId,
  clientCode,
  reason,
  returnMethod,
  reasonDetail,
  pickupAddress,
  pickupCity,
  pickupState,
  pickupPincode,
  pickupPhone,
}, actor = {}) {
  if (!VALID_REASONS.includes(reason)) {
    throw new AppError(`Invalid reason. Must be one of: ${VALID_REASONS.join(', ')}`, 400);
  }
  const normalizedMethodInput = normalizeReturnMethod(returnMethod === undefined ? 'PICKUP' : returnMethod, { strict: true });
  const parsedShipmentId = parseInt(shipmentId, 10);
  if (!Number.isFinite(parsedShipmentId) || parsedShipmentId <= 0) {
    throw new AppError('shipmentId is required and must be a positive integer', 400);
  }
  const normalizedReasonDetail = String(reasonDetail || '').trim() || null;

  // Verify shipment exists, belongs to this client, and is delivered
  const shipment = await prisma.shipment.findFirst({
    where: { id: parsedShipmentId, clientCode },
  });

  if (!shipment) throw new AppError('Shipment not found or does not belong to your account', 404);
  if (shipment.status !== 'Delivered') {
    throw new AppError(`Returns can only be requested for delivered shipments. Current status: ${shipment.status}`, 409);
  }

  // Check for existing pending/active return
  const existing = await prisma.returnRequest.findFirst({
    where: {
      shipmentId: parsedShipmentId,
      status: { notIn: ['REJECTED', 'RETURNED_TO_CLIENT'] },
    },
  });
  if (existing) throw new AppError('A return request already exists for this shipment', 409);

  const normalizedPickupAddress = normalizeAddressField(
    pickupAddress || shipment.destination || '',
    'Pickup address',
    { required: normalizedMethodInput === 'PICKUP' }
  );
  const normalizedPickupCity = normalizeAddressField(
    pickupCity || '',
    'Pickup city',
    { required: normalizedMethodInput === 'PICKUP' }
  );
  const normalizedPickupState = normalizeAddressField(
    pickupState || '',
    'Pickup state',
    { required: normalizedMethodInput === 'PICKUP' }
  );
  const normalizedPickupPincode = normalizePincode(pickupPincode || shipment.pincode || '');
  const normalizedPickupPhone = normalizePhone(pickupPhone || shipment.phone || '');
  if (normalizedMethodInput === 'PICKUP' && !normalizedPickupPincode) {
    throw new AppError('Pickup pincode is required for PICKUP return method', 400);
  }
  if (normalizedMethodInput === 'PICKUP' && !normalizedPickupPhone) {
    throw new AppError('Pickup phone is required for PICKUP return method', 400);
  }

  const returnReq = await prisma.returnRequest.create({
    data: {
      shipmentId: parsedShipmentId,
      originalAwb: shipment.awb,
      clientCode,
      reason,
      returnMethod: normalizedMethodInput,
      reasonDetail: normalizedReasonDetail,
      pickupAddress: normalizedPickupAddress,
      pickupCity: normalizedPickupCity,
      pickupState: normalizedPickupState,
      pickupPincode: normalizedPickupPincode,
      pickupPhone: normalizedPickupPhone,
    },
    include: { shipment: true, client: { select: { code: true, company: true } } },
  });

  await logReturnAudit({
    action: 'RETURN_REQUEST_CREATED',
    returnId: returnReq.id,
    actor,
    newValue: {
      status: returnReq.status,
      returnMethod: returnReq.returnMethod,
      reason: returnReq.reason,
      originalAwb: returnReq.originalAwb,
    },
  });

  logger.info(`Return request created: #${returnReq.id} for AWB ${shipment.awb}`, { clientCode });
  return returnReq;
}

/**
 * List return requests with filters (admin or client).
 */
async function listReturns({ clientCode, status, returnMethod, reason, dateFrom, dateTo, page = 1, limit = 20, search } = {}) {
  const where = {};
  if (clientCode) where.clientCode = clientCode;
  if (status) where.status = normalizeStatus(status);
  if (returnMethod) where.returnMethod = normalizeReturnMethod(returnMethod, { strict: true });
  if (reason) where.reason = String(reason).trim().toLowerCase();
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59Z');
  }
  if (search) {
    where.OR = [
      { originalAwb: { contains: search, mode: 'insensitive' } },
      { reverseAwb: { contains: search, mode: 'insensitive' } },
      { clientCode: { contains: search, mode: 'insensitive' } },
    ];
  }

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(5, parseInt(limit, 10) || 20));

  const [total, items] = await Promise.all([
    prisma.returnRequest.count({ where }),
    prisma.returnRequest.findMany({
      where,
      include: {
        shipment: { select: { awb: true, consignee: true, destination: true, courier: true, date: true, weight: true, amount: true, status: true } },
        client: { select: { code: true, company: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    }),
  ]);

  const normalizedItems = items.map((item) => ({
    ...item,
    returnMethod: normalizeReturnMethod(item.returnMethod),
  }));
  return { items: normalizedItems, total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) };
}

/**
 * Get a single return request by ID.
 */
async function getReturn(id) {
  const returnId = parseReturnId(id);
  const ret = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: {
      shipment: true,
      client: { select: { code: true, company: true, contact: true, phone: true, address: true } },
    },
  });
  if (!ret) throw new AppError('Return request not found', 404);
  return { ...ret, returnMethod: normalizeReturnMethod(ret.returnMethod) };
}

/**
 * Approve a return request (admin action).
 */
async function approveReturn(id, { adminNotes, autoBook = false } = {}, actor = {}) {
  const returnId = parseReturnId(id);
  const ret = await prisma.returnRequest.findUnique({ where: { id: returnId } });
  if (!ret) throw new AppError('Return request not found', 404);
  assertTransition(ret.status, 'APPROVED', ret.returnMethod);
  const normalizedNotes = String(adminNotes || '').trim() || null;

  const updated = await prisma.returnRequest.update({
    where: { id: returnId },
    data: { status: 'APPROVED', adminNotes: normalizedNotes },
    include: { shipment: true, client: { select: { code: true, company: true } } },
  });

  await logReturnAudit({
    action: 'RETURN_REQUEST_APPROVED',
    returnId,
    actor,
    oldValue: { status: ret.status, adminNotes: ret.adminNotes || null },
    newValue: { status: updated.status, adminNotes: updated.adminNotes || null, autoBook: Boolean(autoBook) },
  });

  logger.info(`Return #${id} approved`, { adminNotes: normalizedNotes });

  // Optionally auto-book reverse pickup
  if (autoBook) {
    return bookReversePickup(returnId, actor);
  }

  return updated;
}

/**
 * Reject a return request (admin action).
 */
async function rejectReturn(id, { adminNotes } = {}, actor = {}) {
  const returnId = parseReturnId(id);
  const ret = await prisma.returnRequest.findUnique({ where: { id: returnId } });
  if (!ret) throw new AppError('Return request not found', 404);
  assertTransition(ret.status, 'REJECTED', ret.returnMethod);
  const normalizedNotes = String(adminNotes || '').trim() || null;

  const updated = await prisma.returnRequest.update({
    where: { id: returnId },
    data: { status: 'REJECTED', adminNotes: normalizedNotes },
    include: { shipment: true, client: { select: { code: true, company: true } } },
  });

  await logReturnAudit({
    action: 'RETURN_REQUEST_REJECTED',
    returnId,
    actor,
    oldValue: { status: ret.status, adminNotes: ret.adminNotes || null },
    newValue: { status: updated.status, adminNotes: updated.adminNotes || null },
  });

  logger.info(`Return #${id} rejected`, { adminNotes: normalizedNotes });
  return updated;
}

/**
 * Book reverse pickup with prioritized + fallback courier orchestration.
 */
async function bookReversePickup(id, actor = {}) {
  const returnId = parseReturnId(id);
  const ret = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: {
      shipment: true,
      client: { select: { code: true, company: true } },
    },
  });

  if (!ret) throw new AppError('Return request not found', 404);
  const returnMethod = normalizeReturnMethod(ret.returnMethod);
  const allowedStatuses = returnMethod === 'SELF_SHIP' ? ['APPROVED', 'PENDING', 'LABEL_READY'] : ['APPROVED', 'PENDING'];
  if (!allowedStatuses.includes(ret.status)) {
    const verb = returnMethod === 'SELF_SHIP' ? 'generate label for' : 'book pickup for';
    throw new AppError(`Cannot ${verb} a ${ret.status} return request`, 409);
  }
  if (returnMethod === 'SELF_SHIP' && ret.status === 'LABEL_READY' && ret.reverseAwb) {
    return { ...ret, returnMethod };
  }

  const payload = buildReverseBookingPayload(ret);
  const { ordered, decision } = getReverseCarrierCandidates(ret);
  const failures = [];
  let booking = null;
  let bookedVia = null;

  for (const carrier of ordered) {
    try {
      const result = await carrierService.createShipment(carrier, payload);
      if (!result?.awb) throw new Error(`${carrier} booking returned no AWB`);
      booking = result;
      bookedVia = result.carrier || carrier;
      break;
    } catch (err) {
      failures.push(`${carrier}: ${err.message}`);
      logger.warn(`Reverse booking attempt failed for return #${ret.id}`, { carrier, error: err.message });
    }
  }

  if (!booking) {
    throw new AppError(`Reverse pickup booking failed across carriers (${failures.join(' | ')})`, 502);
  }

  const nextStatus = returnMethod === 'SELF_SHIP' ? 'LABEL_READY' : 'PICKUP_BOOKED';
  assertTransition(ret.status, nextStatus, returnMethod);

  const updated = await prisma.returnRequest.update({
    where: { id: returnId },
    data: {
      status: nextStatus,
      reverseAwb: booking.awb,
      reverseCourier: bookedVia,
      labelUrl: booking.labelUrl || null,
      pickupDate: ret.pickupDate || formatDateYYYYMMDD(),
    },
    include: {
      shipment: true,
      client: { select: { code: true, company: true } },
    },
  });

  await logReturnAudit({
    action: returnMethod === 'SELF_SHIP' ? 'RETURN_LABEL_GENERATED' : 'RETURN_PICKUP_BOOKED',
    returnId,
    actor,
    oldValue: {
      status: ret.status,
      reverseAwb: ret.reverseAwb || null,
      reverseCourier: ret.reverseCourier || null,
      labelUrl: ret.labelUrl || null,
    },
    newValue: {
      status: updated.status,
      reverseAwb: updated.reverseAwb,
      reverseCourier: updated.reverseCourier,
      labelUrl: updated.labelUrl || null,
      failedAttempts: failures,
    },
  });

  logger.info(`Reverse pickup booked for return #${id}: AWB ${booking.awb}`, {
    carrier: bookedVia,
    returnMethod,
    candidateOrder: ordered,
    recommendation: decision,
    failedAttempts: failures.length,
  });
  return updated;
}

async function generateSelfShipLabel(id, actor = {}) {
  const returnId = parseReturnId(id);
  const ret = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    select: { id: true, returnMethod: true },
  });
  if (!ret) throw new AppError('Return request not found', 404);
  if (normalizeReturnMethod(ret.returnMethod) !== 'SELF_SHIP') {
    throw new AppError('Label generation is only available for SELF_SHIP return method', 409);
  }
  return bookReversePickup(returnId, actor);
}

/**
 * Update return status (admin manual progression).
 */
async function updateReturnStatus(id, status, { force = false } = {}, actor = {}) {
  const returnId = parseReturnId(id);
  const nextStatus = normalizeStatus(status);
  if (!VALID_STATUSES.includes(nextStatus)) {
    throw new AppError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 400);
  }
  const current = await prisma.returnRequest.findUnique({ where: { id: returnId } });
  if (!current) throw new AppError('Return request not found', 404);
  const returnMethod = normalizeReturnMethod(current.returnMethod);
  assertTransition(current.status, nextStatus, returnMethod, { force });

  const updated = await prisma.returnRequest.update({
    where: { id: returnId },
    data: { status: nextStatus },
    include: { shipment: true, client: { select: { code: true, company: true } } },
  });

  await logReturnAudit({
    action: 'RETURN_STATUS_UPDATED',
    returnId,
    actor,
    oldValue: { status: current.status },
    newValue: { status: nextStatus, force: Boolean(force) },
  });

  logger.info(`Return #${id} status updated to ${nextStatus}`);
  return updated;
}

async function syncReverseTracking(id, actor = {}) {
  const returnId = parseReturnId(id);
  const ret = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: {
      shipment: true,
      client: { select: { code: true, company: true } },
    },
  });
  if (!ret) throw new AppError('Return request not found', 404);
  if (!ret.reverseAwb || !ret.reverseCourier) {
    throw new AppError('Reverse shipment details are missing for this return request', 409);
  }

  const tracking = await carrierService.fetchTracking(ret.reverseCourier, ret.reverseAwb, { bypassCache: true });
  if (!tracking) {
    return { ...ret, tracking: null, sync: { changed: false, reason: 'No tracking data from carrier' } };
  }

  const nextStatus = mapCarrierStatusToReturnStatus(ret.status, tracking.status);
  const shouldMove = nextStatus !== ret.status && REVERSE_TRACKABLE_STATUSES.includes(ret.status);

  if (!shouldMove) {
    return { ...ret, tracking, sync: { changed: false, from: ret.status, to: ret.status } };
  }

  try {
    assertTransition(ret.status, nextStatus, ret.returnMethod);
  } catch (err) {
    if (err instanceof AppError) {
      return { ...ret, tracking, sync: { changed: false, from: ret.status, to: ret.status, reason: err.message } };
    }
    throw err;
  }

  const updated = await prisma.returnRequest.update({
    where: { id: ret.id },
    data: {
      status: nextStatus,
      pickupDate: ret.pickupDate || formatDateYYYYMMDD(),
    },
    include: {
      shipment: true,
      client: { select: { code: true, company: true } },
    },
  });

  await logReturnAudit({
    action: 'RETURN_TRACKING_SYNCED',
    returnId: ret.id,
    actor,
    oldValue: { status: ret.status },
    newValue: {
      status: nextStatus,
      carrier: ret.reverseCourier,
      awb: ret.reverseAwb,
      carrierStatus: tracking.status || null,
    },
  });

  logger.info(`Reverse tracking sync updated return #${ret.id}`, {
    from: ret.status,
    to: nextStatus,
    carrier: ret.reverseCourier,
    awb: ret.reverseAwb,
  });

  return { ...updated, tracking, sync: { changed: true, from: ret.status, to: nextStatus } };
}

async function syncActiveReverseReturns(limit = 100, actor = {}) {
  const active = await prisma.returnRequest.findMany({
    where: {
      status: { in: REVERSE_TRACKABLE_STATUSES },
      reverseAwb: { not: null },
      reverseCourier: { not: null },
    },
    select: { id: true },
    take: Math.max(1, Math.min(300, Number(limit) || 100)),
    orderBy: { updatedAt: 'desc' },
  });

  let synced = 0;
  let changed = 0;
  let failed = 0;

  for (const row of active) {
    try {
      const result = await syncReverseTracking(row.id, actor);
      synced += 1;
      if (result?.sync?.changed) changed += 1;
    } catch (err) {
      failed += 1;
      logger.warn(`Reverse tracking sync failed for return #${row.id}`, { error: err.message });
    }
  }

  return { total: active.length, synced, changed, failed };
}

/**
 * Get return stats (for dashboard widgets).
 */
async function getReturnStats(clientCode) {
  const where = clientCode ? { clientCode } : {};
  const now = Date.now();
  const pendingCutoff = new Date(now - 24 * 60 * 60 * 1000);
  const activeCutoff = new Date(now - 72 * 60 * 60 * 1000);

  const [
    pending,
    approved,
    labelReady,
    pickupBooked,
    inTransit,
    received,
    returnedToClient,
    rejected,
    pickupMethod,
    selfShipMethod,
    pendingOver24h,
    activeOver72h,
    total,
  ] = await Promise.all([
    prisma.returnRequest.count({ where: { ...where, status: 'PENDING' } }),
    prisma.returnRequest.count({ where: { ...where, status: 'APPROVED' } }),
    prisma.returnRequest.count({ where: { ...where, status: 'LABEL_READY' } }),
    prisma.returnRequest.count({ where: { ...where, status: 'PICKUP_BOOKED' } }),
    prisma.returnRequest.count({ where: { ...where, status: 'IN_TRANSIT' } }),
    prisma.returnRequest.count({ where: { ...where, status: 'RECEIVED' } }),
    prisma.returnRequest.count({ where: { ...where, status: 'RETURNED_TO_CLIENT' } }),
    prisma.returnRequest.count({ where: { ...where, status: 'REJECTED' } }),
    prisma.returnRequest.count({ where: { ...where, returnMethod: 'PICKUP' } }),
    prisma.returnRequest.count({ where: { ...where, returnMethod: 'SELF_SHIP' } }),
    prisma.returnRequest.count({
      where: { ...where, status: { in: ['PENDING', 'APPROVED'] }, createdAt: { lte: pendingCutoff } },
    }),
    prisma.returnRequest.count({
      where: { ...where, status: { in: ['LABEL_READY', 'PICKUP_BOOKED', 'IN_TRANSIT'] }, updatedAt: { lte: activeCutoff } },
    }),
    prisma.returnRequest.count({ where }),
  ]);

  return {
    pending,
    approved,
    labelReady,
    pickupBooked,
    inTransit,
    received,
    returnedToClient,
    rejected,
    pickupMethod,
    selfShipMethod,
    pendingOver24h,
    activeOver72h,
    total,
  };
}

async function getReturnTimeline(id, { limit = 50 } = {}) {
  const returnId = parseReturnId(id);
  await getReturn(returnId);
  const safeLimit = Math.max(5, Math.min(200, Number(limit) || 50));
  const items = await prisma.auditLog.findMany({
    where: {
      entity: 'RETURN_REQUEST',
      entityId: String(returnId),
    },
    orderBy: { createdAt: 'desc' },
    take: safeLimit,
    select: {
      id: true,
      action: true,
      userId: true,
      userEmail: true,
      ip: true,
      oldValue: true,
      newValue: true,
      createdAt: true,
    },
  });
  return { items, limit: safeLimit };
}

/**
 * Get shipments eligible for return (Delivered, client-owned).
 */
async function getEligibleShipments(clientCode, { page = 1, limit = 20, search } = {}) {
  const where = {
    clientCode,
    status: 'Delivered',
    returnRequests: { none: { status: { notIn: ['REJECTED', 'RETURNED_TO_CLIENT'] } } },
  };

  if (search) {
    where.OR = [
      { awb: { contains: search, mode: 'insensitive' } },
      { consignee: { contains: search, mode: 'insensitive' } },
      { destination: { contains: search, mode: 'insensitive' } },
    ];
    // Move clientCode and status into AND to combine with OR
    delete where.clientCode;
    delete where.status;
    where.AND = [{ clientCode }, { status: 'Delivered' }];
  }

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(5, parseInt(limit, 10) || 20));

  const [total, items] = await Promise.all([
    prisma.shipment.count({ where }),
    prisma.shipment.findMany({
      where,
      select: { id: true, awb: true, consignee: true, destination: true, pincode: true, phone: true, weight: true, amount: true, date: true, courier: true },
      orderBy: { date: 'desc' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    }),
  ]);

  return { items, total, page: safePage, limit: safeLimit };
}

module.exports = {
  createReturnRequest,
  listReturns,
  getReturn,
  approveReturn,
  rejectReturn,
  bookReversePickup,
  generateSelfShipLabel,
  updateReturnStatus,
  syncReverseTracking,
  syncActiveReverseReturns,
  getReturnStats,
  getReturnTimeline,
  getEligibleShipments,
};
