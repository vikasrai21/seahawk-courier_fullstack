'use strict';

const crypto = require('crypto');
const prisma = require('../../config/prisma');
const cache = require('../../utils/cache');
const notify = require('../../services/notification.service');
const contractSvc = require('../../services/contract.service');
const shipmentSvc = require('../../services/shipment.service');
const carrierSvc = require('../../services/carrier.service');
const courierDecisionSvc = require('../../services/courierDecision.service');
const R = require('../../utils/response');
const { resolveClientCode, getClientCode, fmtDate } = require('./shared');

const DEFAULT_PREFS = {
  whatsapp: {
    booked: false,
    inTransit: false,
    outForDelivery: true,
    delivered: true,
    delay: true,
    exceptionDigest: true,
  },
  email: {
    booked: false,
    inTransit: false,
    outForDelivery: false,
    delivered: true,
    ndr: true,
    rto: true,
    pod: true,
    dispute: true,
    webhookFailure: true,
  },
  templates: {
    sms: {
      booked: '',
      inTransit: '',
      outForDelivery: '',
      delivered: '',
      ndr: '',
      delay: '',
    },
    email: {
      ndrSubject: '',
      ndrBody: '',
      deliveredSubject: '',
      deliveredBody: '',
      disputeSubject: '',
      disputeBody: '',
    },
    journeys: {
      postOrderEnabled: true,
      ndrRecoveryEnabled: true,
      postDeliveryEnabled: true,
    },
  },
  retention: {
    auditLogDays: 180,
    webhookEventDays: 90,
    notificationDays: 90,
  },
};

function normalizeIdempotencyKey(raw) {
  const value = String(raw || '').trim();
  if (!value) return null;
  return value.slice(0, 128);
}

function buildBookingFingerprint(payload) {
  const normalized = {
    courier: String(payload?.courier || '').trim(),
    consignee: String(payload?.consignee || '').trim().toUpperCase(),
    deliveryAddress: String(payload?.deliveryAddress || '').trim().toUpperCase(),
    deliveryCity: String(payload?.deliveryCity || '').trim().toUpperCase(),
    deliveryState: String(payload?.deliveryState || '').trim().toUpperCase(),
    pin: String(payload?.pin || '').trim(),
    service: String(payload?.service || '').trim().toUpperCase(),
    declaredValue: Number(payload?.declaredValue || 0),
    weightGrams: Number(payload?.weightGrams || 0),
    orderRef: String(payload?.orderRef || '').trim(),
  };
  return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}

function hasValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

async function notificationPreferences(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');
  const preferences = await notify.getClientNotificationPreferences(clientCode);
  const client = await prisma.client.findUnique({ where: { code: clientCode }, select: { brandSettings: true } });
  const stored = (client?.brandSettings && typeof client.brandSettings === 'object')
    ? (client.brandSettings.notificationCenter || {})
    : {};
  const merged = {
    whatsapp: { ...DEFAULT_PREFS.whatsapp, ...(preferences?.whatsapp || {}), ...(stored?.whatsapp || {}) },
    email: { ...DEFAULT_PREFS.email, ...(preferences?.email || {}), ...(stored?.email || {}) },
    templates: {
      sms: { ...DEFAULT_PREFS.templates.sms, ...(stored?.templates?.sms || {}) },
      email: { ...DEFAULT_PREFS.templates.email, ...(stored?.templates?.email || {}) },
      journeys: { ...DEFAULT_PREFS.templates.journeys, ...(stored?.templates?.journeys || {}) },
    },
    retention: { ...DEFAULT_PREFS.retention, ...(stored?.retention || {}) },
  };
  R.ok(res, { clientCode, preferences: merged });
}

async function updateNotificationPreferences(req, res) {
  const clientCode = await resolveClientCode(req, req.body);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const prefs = {
    whatsapp: {
      booked: Boolean(req.body?.whatsapp?.booked),
      inTransit: Boolean(req.body?.whatsapp?.inTransit),
      outForDelivery: Boolean(req.body?.whatsapp?.outForDelivery),
      delivered: Boolean(req.body?.whatsapp?.delivered),
      delay: Boolean(req.body?.whatsapp?.delay),
      exceptionDigest: Boolean(req.body?.whatsapp?.exceptionDigest),
    },
    email: {
      booked: Boolean(req.body?.email?.booked),
      inTransit: Boolean(req.body?.email?.inTransit),
      outForDelivery: Boolean(req.body?.email?.outForDelivery),
      delivered: Boolean(req.body?.email?.delivered),
      ndr: Boolean(req.body?.email?.ndr),
      rto: Boolean(req.body?.email?.rto),
      pod: Boolean(req.body?.email?.pod),
      dispute: Boolean(req.body?.email?.dispute),
      webhookFailure: Boolean(req.body?.email?.webhookFailure),
    },
    templates: {
      sms: {
        booked: String(req.body?.templates?.sms?.booked || '').trim(),
        inTransit: String(req.body?.templates?.sms?.inTransit || '').trim(),
        outForDelivery: String(req.body?.templates?.sms?.outForDelivery || '').trim(),
        delivered: String(req.body?.templates?.sms?.delivered || '').trim(),
        ndr: String(req.body?.templates?.sms?.ndr || '').trim(),
        delay: String(req.body?.templates?.sms?.delay || '').trim(),
      },
      email: {
        ndrSubject: String(req.body?.templates?.email?.ndrSubject || '').trim(),
        ndrBody: String(req.body?.templates?.email?.ndrBody || '').trim(),
        deliveredSubject: String(req.body?.templates?.email?.deliveredSubject || '').trim(),
        deliveredBody: String(req.body?.templates?.email?.deliveredBody || '').trim(),
        disputeSubject: String(req.body?.templates?.email?.disputeSubject || '').trim(),
        disputeBody: String(req.body?.templates?.email?.disputeBody || '').trim(),
      },
      journeys: {
        postOrderEnabled: Boolean(req.body?.templates?.journeys?.postOrderEnabled),
        ndrRecoveryEnabled: Boolean(req.body?.templates?.journeys?.ndrRecoveryEnabled),
        postDeliveryEnabled: Boolean(req.body?.templates?.journeys?.postDeliveryEnabled),
      },
    },
    retention: {
      auditLogDays: Math.min(3650, Math.max(7, parseInt(req.body?.retention?.auditLogDays, 10) || DEFAULT_PREFS.retention.auditLogDays)),
      webhookEventDays: Math.min(3650, Math.max(7, parseInt(req.body?.retention?.webhookEventDays, 10) || DEFAULT_PREFS.retention.webhookEventDays)),
      notificationDays: Math.min(3650, Math.max(7, parseInt(req.body?.retention?.notificationDays, 10) || DEFAULT_PREFS.retention.notificationDays)),
    },
  };

  const client = await prisma.client.findUnique({ where: { code: clientCode }, select: { brandSettings: true } });
  const current = (client?.brandSettings && typeof client.brandSettings === 'object') ? client.brandSettings : {};
  await prisma.client.update({
    where: { code: clientCode },
    data: {
      brandSettings: {
        ...current,
        notificationCenter: prefs,
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'UPDATE_NOTIFICATION_PREFS',
      entity: 'NOTIFICATION_PREFS',
      entityId: clientCode,
      newValue: prefs,
      ip: req.ip,
    },
  });

  R.ok(res, { clientCode, preferences: prefs }, 'Notification preferences updated.');
}

async function pickups(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');
  const pickupsList = await prisma.pickupRequest.findMany({ where: { clientCode }, orderBy: { createdAt: 'desc' }, take: 50 });
  R.ok(res, { pickups: pickupsList });
}

async function createPickup(req, res) {
  const clientCode = await resolveClientCode(req, req.body);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const contactName = String(req.body?.contactName || '').trim();
  const contactPhone = String(req.body?.contactPhone || '').trim();
  const pickupAddress = String(req.body?.pickupAddress || '').trim();
  const pickupCity = String(req.body?.pickupCity || '').trim();
  const pickupPin = String(req.body?.pickupPin || '').trim();
  const scheduledDate = String(req.body?.scheduledDate || '').trim();
  const timeSlot = String(req.body?.timeSlot || 'Morning').trim();

  if (!contactName || !contactPhone || !pickupAddress || !pickupCity || !pickupPin || !scheduledDate || !timeSlot) {
    return R.error(res, 'Missing required pickup fields', 400);
  }

  const pickup = await prisma.pickupRequest.create({
    data: {
      requestNo: `PKP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      clientCode,
      contactName,
      contactPhone,
      contactEmail: String(req.body?.contactEmail || '').trim() || null,
      pickupAddress,
      pickupCity,
      pickupPin,
      deliveryAddress: String(req.body?.deliveryAddress || '').trim() || null,
      deliveryCity: String(req.body?.deliveryCity || '').trim() || null,
      deliveryState: String(req.body?.deliveryState || '').trim() || null,
      deliveryCountry: String(req.body?.deliveryCountry || 'India').trim(),
      packageType: String(req.body?.packageType || 'Parcel').trim(),
      weightGrams: Number(req.body?.weightGrams || 0),
      pieces: Math.max(1, parseInt(req.body?.pieces, 10) || 1),
      service: String(req.body?.service || 'Standard').trim(),
      declaredValue: req.body?.declaredValue ? Number(req.body.declaredValue) : null,
      notes: String(req.body?.notes || '').trim() || null,
      source: 'CLIENT_PORTAL',
      preferredCarrier: String(req.body?.preferredCarrier || '').trim() || null,
      scheduledDate,
      timeSlot,
      status: 'PENDING',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'CLIENT_PICKUP_CREATED',
      entity: 'PICKUP',
      entityId: pickup.requestNo,
      newValue: { clientCode, scheduledDate, timeSlot },
      ip: req.ip,
    },
  }).catch(() => {});

  R.created(res, pickup, 'Pickup request created successfully.');
}

async function contracts(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');
  const contractsList = await contractSvc.getByClient(clientCode);
  R.ok(res, { contracts: contractsList });
}

async function estimate(req, res) {
  const clientCode = await resolveClientCode(req, req.query);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const weight = Number(req.query?.weight || 0);
  if (!Number.isFinite(weight) || weight <= 0) return R.error(res, 'weight must be greater than 0', 400);

  const contractsList = (await contractSvc.getByClient(clientCode)).filter((c) => c.active);
  const estimates = contractsList.map((contract) => {
    let base = contract.pricingType === 'PER_KG' ? weight * (contract.baseRate || 0) : (contract.baseRate || 0);
    base = Math.max(base, contract.minCharge || 0);
    const fuel = base * ((contract.fuelSurcharge || 0) / 100);
    const subtotal = base + fuel;
    const gst = subtotal * ((contract.gstPercent || 18) / 100);
    const total = subtotal + gst;
    return {
      id: contract.id,
      name: contract.name,
      courier: contract.courier || 'Any',
      service: contract.service || 'Standard',
      pricingType: contract.pricingType,
      weight,
      base: Math.round(base * 100) / 100,
      fuelSurcharge: Math.round(fuel * 100) / 100,
      gst: Math.round(gst * 100) / 100,
      total: Math.round(total * 100) / 100,
      fuelSurchargePct: contract.fuelSurcharge || 0,
      gstPercent: contract.gstPercent || 18,
      notes: contract.notes || '',
    };
  }).sort((a, b) => a.total - b.total);

  R.ok(res, { estimates, clientCode, weight });
}

async function importShipments(req, res) {
  const clientCode = await resolveClientCode(req, req.body);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const rows = Array.isArray(req.body?.shipments) ? req.body.shipments.slice(0, 500) : [];
  if (!rows.length) return R.error(res, 'Provide shipments to import', 400);

  const cleaned = rows.map((item) => ({
    date: String(item?.date || fmtDate(new Date())).slice(0, 10),
    clientCode,
    awb: String(item?.awb || '').trim().toUpperCase(),
    consignee: String(item?.consignee || '').trim(),
    destination: String(item?.destination || '').trim(),
    pincode: String(item?.pincode || '').trim(),
    courier: String(item?.courier || '').trim(),
    department: String(item?.department || '').trim(),
    service: String(item?.service || 'Standard').trim(),
    weight: Number(item?.weight || 0),
    amount: Number(item?.amount || 0),
    remarks: String(item?.remarks || '').trim(),
    status: String(item?.status || 'Booked').trim(),
  })).filter((item) => item.awb);

  const result = await shipmentSvc.bulkImport(cleaned, req.user.id);
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'CLIENT_IMPORT_SHIPMENTS',
      entity: 'SHIPMENT_IMPORT',
      entityId: clientCode,
      newValue: { imported: result.imported, duplicates: result.duplicates },
      ip: req.ip,
    },
  }).catch(() => {});

  R.ok(res, result, `Imported ${result.imported} shipments`);
}

async function supportTicket(req, res) {
  const clientCode = (req.user.isOwner || req.user.role === 'ADMIN') ? req.body.clientCode : await getClientCode(req.user.id);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const subject = String(req.body?.subject || '').trim();
  const message = String(req.body?.message || '').trim();
  const awb = String(req.body?.awb || '').trim().toUpperCase();
  const priority = String(req.body?.priority || 'normal').trim().toLowerCase();

  if (!subject || !message) return R.badRequest(res, 'subject and message are required.');
  if (subject.length > 140) return R.badRequest(res, 'subject too long (max 140 chars).');
  if (message.length > 2000) return R.badRequest(res, 'message too long (max 2000 chars).');
  if (!['low', 'normal', 'high', 'urgent'].includes(priority)) return R.badRequest(res, 'invalid priority value.');

  const ticketNo = `TKT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10000 + Math.random() * 90000)}`;
  const payload = {
    ticketNo,
    clientCode,
    raisedBy: { id: req.user.id, email: req.user.email, name: req.user.name, role: req.user.role },
    subject,
    message,
    awb: awb || null,
    priority,
    source: 'CLIENT_PORTAL',
    createdAt: new Date().toISOString(),
  };

  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'CREATE_SUPPORT_TICKET',
      entity: 'SUPPORT_TICKET',
      entityId: ticketNo,
      newValue: payload,
      ip: req.ip,
    },
  });

  const recipients = await prisma.user.findMany({
    where: { active: true, role: { in: ['OWNER', 'ADMIN', 'OPS_MANAGER'] } },
    select: { email: true },
  });

  const subjectLine = `[Support Ticket] ${ticketNo} · ${clientCode} · ${subject}`;
  const text = [
    `Ticket: ${ticketNo}`,
    `Client: ${clientCode}`,
    `Raised by: ${req.user.email}`,
    `Priority: ${priority.toUpperCase()}`,
    awb ? `AWB: ${awb}` : '',
    '',
    message,
  ].filter(Boolean).join('\n');

  await Promise.all(
    recipients
      .filter((r) => !!r.email)
      .map((r) => notify.sendEmail({
        to: r.email,
        subject: subjectLine,
        text,
        html: `<p><strong>Ticket:</strong> ${ticketNo}</p>
               <p><strong>Client:</strong> ${clientCode}</p>
               <p><strong>Raised by:</strong> ${req.user.email}</p>
               <p><strong>Priority:</strong> ${priority.toUpperCase()}</p>
               ${awb ? `<p><strong>AWB:</strong> ${awb}</p>` : ''}
               <p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>`,
      }))
  );

  const adminPhone = (process.env.ADMIN_WHATSAPP || '').replace(/\D/g, '');
  if (adminPhone) {
    await notify.sendWhatsApp(adminPhone, `New support ticket ${ticketNo} from ${clientCode} (${priority.toUpperCase()})${awb ? ` AWB: ${awb}` : ''}. Subject: ${subject}`);
  }

  R.ok(res, { ticketNo }, 'Support ticket submitted successfully.');
}

async function createAndBookShipment(req, res) {
  const clientCode = await resolveClientCode(req, req.body);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const consignee = String(req.body?.consignee || '').trim();
  const destination = String(req.body?.destination || req.body?.deliveryCity || '').trim();
  const deliveryAddress = String(req.body?.deliveryAddress || '').trim();
  const deliveryCity = String(req.body?.deliveryCity || destination).trim();
  const deliveryState = String(req.body?.deliveryState || '').trim();
  const phone = String(req.body?.phone || '').trim();
  const pincode = String(req.body?.pincode || req.body?.pin || '').trim();
  const service = String(req.body?.service || 'Standard').trim();
  const declaredValue = Number(req.body?.declaredValue || 0);
  const cod = req.body?.cod === true || String(req.body?.paymentMode || '').toLowerCase() === 'cod';
  const dryRun = req.body?.dryRun === true || String(req.body?.dryRun || '').toLowerCase() === 'true';
  const idempotencyKey = normalizeIdempotencyKey(
    req.headers['x-idempotency-key'] || req.body?.idempotencyKey || req.body?.requestId
  );

  const weightKg = Number(req.body?.weight || 0);
  const weightGramsInput = Number(req.body?.weightGrams || 0);
  const weightGrams = weightGramsInput > 0 ? weightGramsInput : Math.round(weightKg * 1000);
  const forbiddenFields = ['amount', 'status', 'department'];
  const attemptedPrivilegedFields = forbiddenFields.filter((field) => hasValue(req.body?.[field]));
  if (attemptedPrivilegedFields.length > 0) {
    return R.badRequest(
      res,
      `The following fields are server controlled and cannot be set from client portal: ${attemptedPrivilegedFields.join(', ')}.`
    );
  }

  if (!consignee || !deliveryAddress || !deliveryCity || !pincode || !weightGrams) {
    return R.badRequest(res, 'consignee, deliveryAddress, deliveryCity, pincode and weight/weightGrams are required.');
  }

  const client = await prisma.client.findUnique({
    where: { code: clientCode },
    select: { brandSettings: true },
  });

  const decision = courierDecisionSvc.recommendCourierForBooking({
    pincode,
    service,
    weightGrams,
    cod,
    preferredCourier: req.body?.courier || req.body?.preferredCourier,
    deliveryState,
    clientSettings: client?.brandSettings && typeof client.brandSettings === 'object'
      ? client.brandSettings
      : {},
  });
  const selectedCourier = decision.recommendedCourier;

  const bookingPayload = {
    consignee,
    destination: deliveryCity,
    deliveryAddress,
    deliveryCity,
    deliveryState,
    pin: pincode,
    phone: phone || '9999999999',
    service,
    declaredValue,
    weightGrams,
    orderRef: String(req.body?.orderRef || `CL-${clientCode}-${Date.now()}`).trim(),
    contents: String(req.body?.contents || req.body?.productDesc || 'Shipment').trim(),
  };
  const bookingFingerprint = buildBookingFingerprint({ ...bookingPayload, courier: selectedCourier });

  let idempotencyCacheKey = null;
  let idempotencyLocked = false;
  if (!dryRun && idempotencyKey) {
    idempotencyCacheKey = `portal:booking:idempotency:${clientCode}:${idempotencyKey}`;
    const cached = await cache.get(idempotencyCacheKey);
    if (cached?.status === 'completed') {
      if (cached?.fingerprint && cached.fingerprint !== bookingFingerprint) {
        return R.error(res, 'Idempotency key conflict: payload mismatch for this key.', 409);
      }
      return R.ok(res, cached.response, 'Idempotent replay: returning existing booking result.');
    }
    if (cached?.status === 'processing') {
      return R.error(res, 'Booking is already in progress for this idempotency key.', 409);
    }

    await cache.set(idempotencyCacheKey, {
      status: 'processing',
      fingerprint: bookingFingerprint,
      startedAt: new Date().toISOString(),
    }, 900);
    idempotencyLocked = true;
  }

  const persistBookedShipment = async (resolvedCourier, resolvedBooking) => shipmentSvc.create({
    date: fmtDate(new Date()),
    clientCode,
    awb: String(resolvedBooking.awb).trim().toUpperCase(),
    consignee,
    destination: deliveryCity,
    phone: phone || null,
    pincode,
    weight: Number((weightGrams / 1000).toFixed(3)),
    amount: 0,
    courier: resolvedCourier,
    department: 'Operations',
    service,
    status: 'Booked',
    remarks: String(req.body?.remarks || '').trim(),
    labelUrl: resolvedBooking.labelUrl || null,
  }, req.user?.id);

  try {
    if (dryRun) {
      const dryRunResult = await carrierSvc.createShipment(selectedCourier, bookingPayload, { dryRun: true });
      return R.ok(res, {
        clientCode,
        decision,
        orchestration: {
          idempotencyKey: idempotencyKey || null,
          fingerprint: bookingFingerprint,
        },
        booking: dryRunResult,
      }, 'Dry run completed. No live shipment created.');
    }

    let bookingResult = null;
    let selectedCarrierUsed = selectedCourier;
    let usedFallback = false;
    const fallbackCarrier = decision.fallbackCourier && decision.fallbackCourier !== selectedCourier
      ? decision.fallbackCourier
      : null;

    try {
      bookingResult = await carrierSvc.createShipment(selectedCourier, bookingPayload, { dryRun: false });
      if (!bookingResult?.awb) throw new Error(`${selectedCourier} booking did not return AWB.`);
    } catch (primaryErr) {
      if (!fallbackCarrier) throw primaryErr;
      bookingResult = await carrierSvc.createShipment(fallbackCarrier, bookingPayload, { dryRun: false });
      if (!bookingResult?.awb) throw new Error(`${fallbackCarrier} booking did not return AWB.`);
      selectedCarrierUsed = fallbackCarrier;
      usedFallback = true;
    }

    const shipment = await persistBookedShipment(selectedCarrierUsed, bookingResult);

    const responsePayload = {
      shipment,
      decision,
      orchestration: {
        idempotencyKey: idempotencyKey || null,
        fingerprint: bookingFingerprint,
      },
      booking: {
        awb: bookingResult.awb,
        carrier: bookingResult.carrier || selectedCarrierUsed,
        trackUrl: bookingResult.trackUrl || null,
        labelUrl: bookingResult.labelUrl || null,
        usedFallback,
      },
    };

    if (idempotencyCacheKey && idempotencyLocked) {
      await cache.set(idempotencyCacheKey, {
        status: 'completed',
        fingerprint: bookingFingerprint,
        response: responsePayload,
        completedAt: new Date().toISOString(),
      }, 60 * 60 * 24);
      idempotencyLocked = false;
    }

    return R.created(res, responsePayload, usedFallback
      ? 'Shipment booked successfully using fallback courier.'
      : 'Shipment booked successfully.');
  } catch (err) {
    if (idempotencyCacheKey && idempotencyLocked) {
      await cache.set(idempotencyCacheKey, {
        status: 'failed',
        fingerprint: bookingFingerprint,
        error: String(err?.message || 'Booking failed'),
        failedAt: new Date().toISOString(),
      }, 60);
      idempotencyLocked = false;
    }
    throw err;
  } finally {
    if (idempotencyCacheKey && idempotencyLocked) {
      await cache.del(idempotencyCacheKey);
    }
  }
}

module.exports = {
  notificationPreferences,
  updateNotificationPreferences,
  pickups,
  createPickup,
  contracts,
  estimate,
  importShipments,
  supportTicket,
  createAndBookShipment,
};
