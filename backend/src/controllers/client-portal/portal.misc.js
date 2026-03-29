'use strict';

const prisma = require('../../config/prisma');
const notify = require('../../services/notification.service');
const contractSvc = require('../../services/contract.service');
const shipmentSvc = require('../../services/shipment.service');
const R = require('../../utils/response');
const { resolveClientCode, getClientCode, fmtDate } = require('./shared');

async function notificationPreferences(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');
  const preferences = await notify.getClientNotificationPreferences(clientCode);
  R.ok(res, { clientCode, preferences });
}

async function updateNotificationPreferences(req, res) {
  const clientCode = await resolveClientCode(req, req.body);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const prefs = {
    whatsapp: {
      outForDelivery: Boolean(req.body?.whatsapp?.outForDelivery),
      delivered: Boolean(req.body?.whatsapp?.delivered),
    },
    email: {
      ndr: Boolean(req.body?.email?.ndr),
      rto: Boolean(req.body?.email?.rto),
      pod: Boolean(req.body?.email?.pod),
    },
  };

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
  const clientCode = req.user.role === 'ADMIN' ? req.body.clientCode : await getClientCode(req.user.id);
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
    where: { active: true, role: { in: ['ADMIN', 'OPS_MANAGER'] } },
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

module.exports = {
  notificationPreferences,
  updateNotificationPreferences,
  pickups,
  createPickup,
  contracts,
  estimate,
  importShipments,
  supportTicket,
};
