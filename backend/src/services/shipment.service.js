'use strict';
const prisma       = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');
const stateMachine = require('./stateMachine');
const notify       = require('./notification.service');
const logger       = require('../utils/logger');
const delhiverySvc = require('./delhivery.service');
const trackonSvc   = require('./trackon.service');
const dtdcSvc      = require('./dtdc.service');
const walletSvc    = require('./wallet.service');
const redis        = require('../config/redis');
const cache        = require('../utils/cache');
const { normalizeStatus } = require('./stateMachine');
const { emitShipmentCreated, emitShipmentStatusUpdated } = require('../realtime/socket');
const contractSvc  = require('./contract.service');
const importLedger = require('./import-ledger.service');
const riskAnalysis = require('./riskAnalysis.service');
const queueSvc     = require('./queue.service');
const clientMatcher = require('./clientMatcher.service');
const { detectCourier } = require('../utils/awbDetect');

const TRACKABLE_COURIERS = new Set(['Delhivery', 'Trackon', 'DTDC', 'BlueDart', 'FedEx', 'DHL']);
const TERMINAL_STATUSES = new Set(['Delivered', 'RTO', 'Cancelled']);
const PLACEHOLDER_TEXT = new Set(['', 'UNKNOWN', 'MISC', 'NA', 'N/A', 'NULL']);

function toNumber(val) {
  if (val === null || val === undefined) return 0;
  return typeof val === 'object' ? Number(val.toString()) : Number(val);
}

const clearCache = () => {
  if (redis?.status === 'ready') {
    redis.del('stats:today', 'stats:monthly').catch(e => logger.warn(`[Redis] Clear cache failed: ${e.message}`));
  }
  cache.delByPrefix('analytics:').catch(e => logger.warn(`[Cache] Analytics clear failed: ${e.message}`));
  cache.delByPrefix('ops:dashboard:').catch(e => logger.warn(`[Cache] Ops dashboard clear failed: ${e.message}`));
  cache.delByPrefix('shipments:list:').catch(e => logger.warn(`[Cache] Shipment list clear failed: ${e.message}`));
};

const COURIERS = {
  'Delhivery': delhiverySvc,
  'Trackon': trackonSvc,
  'DTDC': dtdcSvc
};

function resolveEnqueueTrackingSync() {
  if (typeof queueSvc?.enqueueTrackingSync === 'function') return queueSvc.enqueueTrackingSync.bind(queueSvc);
  if (typeof queueSvc?.default?.enqueueTrackingSync === 'function') return queueSvc.default.enqueueTrackingSync.bind(queueSvc.default);
  return null;
}


function slaDaysFor(service) {
  const s = String(service || '').toLowerCase();
  if (s.includes('express')) return 2;
  if (s.includes('priority')) return 3;
  if (s.includes('standard')) return 4;
  return 5;
}

function buildFilters({ client, courier, status, filter, dateFrom, dateTo, q, environment }) {
  const where = {};
  // ── Sandbox isolation: exclude sandbox shipments from production queries ───
  where.environment = environment || 'production';
  if (client)  where.clientCode = client;
  if (courier) where.courier = { contains: courier, mode: 'insensitive' };
  if (status)  where.status = status;
  if (filter === 'sla_breach') {
    where.status = 'InTransit';
    const slaDaysAgo = new Date();
    slaDaysAgo.setDate(slaDaysAgo.getDate() - 7); // SLA threshold (e.g. 7 days)
    where.createdAt = { lt: slaDaysAgo };
  }
  if (dateFrom || dateTo) { where.date = {}; if (dateFrom) where.date.gte = dateFrom; if (dateTo) where.date.lte = dateTo; }
  if (q) {
    const rawQuery = String(q || '').trim();
    const awbQuery = normalizeAwb(rawQuery);
    where.OR = [
      { awb: { contains: awbQuery, mode: 'insensitive' } },
      { clientCode: { contains: rawQuery, mode: 'insensitive' } },
      { consignee: { contains: rawQuery, mode: 'insensitive' } },
      { destination: { contains: rawQuery, mode: 'insensitive' } },
      { courier: { contains: rawQuery, mode: 'insensitive' } },
    ];
  }
  return where;
}

async function getAll(filters = {}, page = 1, limit = 50, includeDetails = false) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(5000, Math.max(10, parseInt(limit, 10) || 50));
  const where = buildFilters(filters);
  const skip  = (safePage - 1) * safeLimit;
  const cacheKey = includeDetails ? null : `shipments:list:v2:${JSON.stringify({ filters, safePage, safeLimit })}`;
  if (cacheKey) {
    const cached = await cache.get(cacheKey);
    if (cached) return cached;
  }
  const [total, shipments, aggregates, statusGroups] = await Promise.all([
    prisma.shipment.count({ where }),
    prisma.shipment.findMany({
      where,
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      skip,
      take: safeLimit,
      select: {
        id: true,
        date: true,
        clientCode: true,
        awb: true,
        consignee: true,
        destination: true,
        phone: true,
        pincode: true,
        weight: true,
        amount: true,
        courier: true,
        department: true,
        service: true,
        status: true,
        ndrStatus: true,
        remarks: true,
        createdAt: true,
        updatedAt: true,
        ...(includeDetails ? {
          trackingEvents: {
            orderBy: { timestamp: 'desc' },
            take: 3,
            select: {
              id: true,
              status: true,
              location: true,
              description: true,
              timestamp: true,
              rawData: true,
            },
          },
          ndrEvents: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              reason: true,
              description: true,
              attemptNo: true,
              action: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              ndrEvents: true,
            },
          },
        } : {}),
        client: { select: { company: true } },
        createdBy: { select: { name: true } },
      },
    }),
    prisma.shipment.aggregate({
      where,
      _sum: { amount: true, weight: true },
    }),
    prisma.shipment.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
    }),
  ]);
  const statusCounts = statusGroups.reduce((acc, g) => {
    acc[g.status] = g._count._all;
    return acc;
  }, {});
  const deliveredCount = statusCounts['Delivered'] || 0;
  const inTransitCount = statusCounts['InTransit'] || 0;
  const rtoCount       = statusCounts['RTO'] || 0;

  const stats = {
    count: total,
    totalAmount: toNumber(aggregates._sum.amount),
    totalWeight: toNumber(aggregates._sum.weight),
    delivered: deliveredCount,
    inTransit: inTransitCount,
    rto: rtoCount,
    revenue: toNumber(aggregates._sum.amount), // Aliased for frontend compatibility
  };
  const enrichedShipments = shipments.map(s => {
    const sla = slaDaysFor(s.service);
    const d = new Date(s.date);
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() + sla);
      return { ...s, eta: d.toISOString().split('T')[0] };
    }
    return s;
  });
  const result = { shipments: enrichedShipments, total, stats };
  if (cacheKey) await cache.set(cacheKey, result, 30).catch(e => logger.warn(`[Cache] Shipment list set failed: ${e.message}`));
  return result;
}

async function simulateShipment(data = {}) {
  const today = new Date().toISOString().split('T')[0];
  const awb = normalizeAwb(data.awb);
  const clientCode = String(data.clientCode || '').trim().toUpperCase();
  const weight = Number(data.weight || 0);
  const service = String(data.service || 'Standard');
  const courier = String(data.courier || '').trim() || autoDetectCourier(awb);
  const contractPrice = (!Number(data.amount || 0) && clientCode)
    ? await contractSvc.calculatePrice({
        clientCode,
        courier,
        service,
        weight: Number.isFinite(weight) ? weight : 0,
      }).catch(() => null)
    : null;
  const amount = Number(data.amount || 0) > 0 ? Number(data.amount) : Number(contractPrice?.total || 0);
  const risk = await riskAnalysis.analyzeShipment(data).catch(() => ({ score: 0, factors: [] }));
  const d = new Date(data.date || today);
  if (!isNaN(d.getTime())) d.setDate(d.getDate() + slaDaysFor(service));

  return {
    wouldCreate: true,
    wouldDebitWallet: amount > 0,
    shipment: {
      date: data.date || today,
      clientCode,
      awb,
      consignee: String(data.consignee || '').toUpperCase(),
      destination: String(data.destination || '').toUpperCase(),
      weight: Number.isFinite(weight) ? weight : 0,
      amount,
      courier,
      department: String(data.department || ''),
      service,
      status: 'Booked',
      eta: !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : null,
      remarks: data.remarks || (contractPrice ? `AUTO_PRICED:${contractPrice.contractName}` : ''),
      riskScore: risk?.score || 0,
      riskFactors: risk?.factors || [],
    },
  };
}

async function getById(id) {
  const s = await prisma.shipment.findUnique({
    where: { id: parseInt(id) },
    include: { client: true, createdBy: { select: { name: true } }, updatedBy: { select: { name: true } }, trackingEvents: { orderBy: { timestamp: 'desc' }, take: 20 } },
  });
  if (!s) throw new AppError('Shipment not found.', 404);
  return s;
}

async function create(data, userId) {
  const today = new Date().toISOString().split('T')[0];
  const risk = await riskAnalysis.analyzeShipment(data);

  // Read contract price BEFORE transaction to avoid holding 
  // a connection unnecessarily during the lookup
  const contractPrice = (!Number(data.amount || 0) && data.clientCode)
    ? await contractSvc.calculatePrice({
        clientCode: data.clientCode,
        courier: data.courier || '',
        service: data.service || 'Standard',
        weight: parseFloat(data.weight) || 0,
      })
    : null;

  const shipment = await prisma.$transaction(async (tx) => {
    const payload = {
      ...data,
      awb: normalizeAwb(data.awb),
      date: data.date || today,
      consignee: (data.consignee || '').toUpperCase(),
      destination: (data.destination || '').toUpperCase(),
      amount: Number(data.amount || 0) > 0 ? Number(data.amount) : Number(contractPrice?.total || 0),
      status: 'Booked',
      createdById: userId || null,
      updatedById: userId || null,
      remarks: data.remarks || (contractPrice ? `AUTO_PRICED:${contractPrice.contractName}` : ''),
      riskScore: risk?.score || 0,
      riskFactors: risk?.factors || [],
    };

    if ((payload.amount || 0) > 0) {
      // ── Atomic wallet debit: prevents race condition / double-debit ──────
      // Uses updateMany with WHERE balance >= amount so the check + decrement
      // happen in a single atomic DB operation (no TOCTOU gap).
      const debitResult = await tx.client.updateMany({
        where: {
          code: payload.clientCode,
          walletBalance: { gte: payload.amount },
        },
        data: { walletBalance: { decrement: payload.amount } },
      });

      if (debitResult.count === 0) {
        // Debit failed — either client doesn't exist or insufficient balance
        const client = await tx.client.findUnique({
          where: { code: payload.clientCode },
          select: { walletBalance: true },
        });
        if (!client) throw new AppError(`Client not found: ${payload.clientCode}`, 404);
        throw new AppError(`Insufficient wallet balance (available: ₹${client.walletBalance.toFixed(2)}, required: ₹${Number(payload.amount).toFixed(2)})`, 400);
      }

      // Fetch updated balance for the transaction record
      const updatedClient = await tx.client.findUnique({
        where: { code: payload.clientCode },
        select: { walletBalance: true },
      });

      await tx.walletTransaction.create({
        data: {
          clientCode: payload.clientCode,
          type: 'DEBIT',
          amount: payload.amount,
          balance: updatedClient.walletBalance,
          description: `Shipment — AWB ${payload.awb}`,
          reference: payload.awb,
          paymentMode: 'WALLET',
          status: 'SUCCESS',
        },
      });
    }

    const shipment = await tx.shipment.create({
      data: payload,
      include: { client: { select: { company: true, phone: true } } },
    });

    clearCache();
    return shipment;
  });

  emitShipmentCreated(shipment);
  try { await queueSvc.enqueueNotification('SHIPMENT_BOOKED', { shipmentId: shipment.id }); }
  catch (e) { logger.warn(`[Notify] Booking notification enqueue failed: ${e.message}`); }
  return shipment;
}

async function update(id, data, userId) {
  const u = { ...data, updatedById: userId };
  if (data.awb)          u.awb          = normalizeAwb(data.awb);
  if (data.consignee)   u.consignee   = data.consignee.toUpperCase();
  if (data.destination) u.destination = data.destination.toUpperCase();
  const updated = await prisma.shipment.update({ where: { id: parseInt(id) }, data: u, include: { client: { select: { company: true } } } });
  clearCache();
  emitShipmentStatusUpdated(updated);
  return updated;
}

async function updateStatus(id, newStatus, userId) {
  const shipment = await getById(id);
  const canonicalStatus = normalizeStatus(newStatus);
  if (stateMachine.assertValidTransition) {
    try {
      stateMachine.assertValidTransition(shipment.status, canonicalStatus);
    } catch (err) {
      throw new AppError(err.message, 400);
    }
  }

  if (normalizeStatus(shipment.status) === canonicalStatus) {
    return shipment;
  }

  const updated = await prisma.shipment.update({
    where: { id: parseInt(id) },
    data:  { status: canonicalStatus, updatedById: userId },
    include: { client: { select: { company: true, phone: true, email: true } } },
  });

  // Log tracking event
  try {
    await prisma.trackingEvent.create({ data: { shipmentId: parseInt(id), awb: updated.awb, status: canonicalStatus, description: `Status updated to ${canonicalStatus}`, timestamp: new Date(), source: 'MANUAL' } });
  } catch (e) { logger.warn(`[Tracking] Event log failed: ${e.message}`); }

  // Auto-refund on cancel/RTO
  if (stateMachine.shouldRefund && stateMachine.shouldRefund(canonicalStatus) && shipment.amount > 0) {
    try {
      const refund = await walletSvc.creditShipmentRefund({
        clientCode: shipment.clientCode,
        awb: shipment.awb,
        amount: shipment.amount,
        reason: canonicalStatus,
      });
      if (refund.skipped) logger.info(`[Wallet] Refund skipped for ${shipment.awb}; already refunded`);
      else logger.info(`[Wallet] Refunded ₹${shipment.amount} for ${shipment.awb}`);
    } catch (e) { logger.warn(`[Wallet] Refund failed: ${e.message}`); }
  }

  // ── Fire WhatsApp + email notifications asynchronously ─────────────────
  try {
    const eventType = canonicalStatus === 'OutForDelivery'
      ? 'OUT_FOR_DELIVERY'
      : canonicalStatus === 'Delivered'
        ? 'DELIVERED'
        : (canonicalStatus === 'NDR' || canonicalStatus === 'Failed') ? 'NDR' : null;
    if (eventType) await queueSvc.enqueueNotification(eventType, { shipmentId: updated.id });
    else await notify.notifyStatusChange({ ...updated, status: canonicalStatus });
  }
  catch (e) { logger.warn(`[Notify] Status notification enqueue failed: ${e.message}`); }

  // POD email on delivery
  if (canonicalStatus === 'Delivered') {
    try { await notify.sendPODEmail(updated, updated.labelUrl); }
    catch (e) { logger.warn(`[Notify] POD email failed: ${e.message}`); }
  }

  clearCache();
  emitShipmentStatusUpdated(updated);
  return updated;
}

async function forceUpdateStatus(id, newStatus, userId, note = '') {
  const shipment = await getById(id);
  const canonicalStatus = normalizeStatus(newStatus);

  if (normalizeStatus(shipment.status) === canonicalStatus) {
    return shipment;
  }

  const updated = await prisma.shipment.update({
    where: { id: parseInt(id, 10) },
    data: {
      status: canonicalStatus,
      updatedById: userId || null,
      remarks: [shipment.remarks, note ? `MANUAL_OVERRIDE:${note}` : 'MANUAL_OVERRIDE']
        .filter(Boolean)
        .join(' | '),
    },
    include: { client: { select: { company: true, phone: true, email: true } } },
  });

  await prisma.trackingEvent.create({
    data: {
      shipmentId: parseInt(id, 10),
      awb: updated.awb,
      status: canonicalStatus,
      description: note ? `Manual override: ${note}` : `Manual override to ${canonicalStatus}`,
      timestamp: new Date(),
      source: 'MANUAL',
    },
  }).catch((e) => logger.warn(`[Tracking] Manual override event log failed: ${e.message}`));

  if (stateMachine.shouldRefund && stateMachine.shouldRefund(canonicalStatus) && shipment.amount > 0) {
    try {
      await walletSvc.creditShipmentRefund({
        clientCode: shipment.clientCode,
        awb: shipment.awb,
        amount: shipment.amount,
        reason: canonicalStatus,
      });
    } catch (e) { logger.warn(`[Wallet] Manual override refund failed: ${e.message}`); }
  }

  clearCache();
  emitShipmentStatusUpdated(updated);
  return updated;
}

async function remove(id) { 
  const res = await prisma.shipment.delete({ where: { id: parseInt(id) } }); 
  clearCache();
  return res;
}

async function bulkImport(shipments, userId) {
  const today = new Date().toISOString().split('T')[0];
  const batchKey = `imp_${Date.now()}`;
  let imported = 0, duplicates = 0, autoPriced = 0, operationalCreated = 0;
  let trackingQueued = 0;
  const errors = [];
  const trackingCandidates = [];
  await importLedger.ensureTable();
  const clientCodes = [...new Set(shipments.map(s => (s.clientCode || 'MISC').toUpperCase()))];
  const contractsByClient = await contractSvc.getActiveContractsByClientCodes(clientCodes);
  for (const code of clientCodes) { await prisma.client.upsert({ where: { code }, create: { code, company: code }, update: {} }); }

  // Extract AWBs and pre-fetch existing shipments to avoid N+1 findUnique
  const allAwbs = shipments.map(s => s.awb ? normalizeAwb(s.awb) : null).filter(Boolean);
  const existingList = await prisma.shipment.findMany({
    where: { awb: { in: allAwbs } },
    select: { id: true, awb: true, courier: true, status: true }
  });
  const existingMap = new Map(existingList.map(e => [e.awb, e]));

  const newShipmentsData = [];
  const ledgerRows = [];
  const processedAwbs = new Set(); // Prevent duplicates within the same import payload

  for (let index = 0; index < shipments.length; index++) {
    const s = shipments[index];
    if (!s.awb || String(s.awb).trim() === '') { errors.push({ awb: '(empty)', error: 'No AWB' }); continue; }
    const awb = normalizeAwb(s.awb);
    
    // Skip if AWB is duplicated within the same import file
    if (processedAwbs.has(awb)) { duplicates++; continue; }
    processedAwbs.add(awb);

    const clientCode = (s.clientCode || 'MISC').toUpperCase();
    const amount = parseFloat(s.amount) || 0;
    const weight = parseFloat(s.weight) || 0;
    const normalizedCourier = String(s.courier || '').trim() || autoDetectCourier(awb);
    const contractPrice = amount > 0
      ? null
      : contractSvc.calculatePriceFromContract(
          contractSvc.selectBestContract(contractsByClient[clientCode] || [], {
            courier: normalizedCourier,
            service: String(s.service || 'Standard'),
          }),
          weight
        );
    const finalAmount = amount > 0 ? amount : Number(contractPrice?.total || 0);
    if (contractPrice) autoPriced++;
    const normalizedStatus = normalizeStatus('Booked');
    
    const existing = existingMap.get(awb);
    let shipmentId = existing?.id || null;

    if (!existing) {
      newShipmentsData.push({
        awb, clientCode, date: s.date || today,
        consignee: String(s.consignee || '').toUpperCase(),
        destination: String(s.destination || '').toUpperCase(),
        weight, amount: finalAmount, courier: normalizedCourier,
        department: String(s.department || ''), service: String(s.service || 'Standard'),
        status: normalizedStatus,
        remarks: String(s.remarks || (contractPrice ? `AUTO_PRICED:${contractPrice.contractName}` : '')),
        createdById: userId || null, updatedById: userId || null
      });
      operationalCreated++;
    } else {
      duplicates++;
    }

    const effectiveCourier = String(existing?.courier || normalizedCourier || '').trim();
    const effectiveStatus = String(existing?.status || normalizedStatus || '').trim();
    
    // We'll push tracking candidates after inserting, since we need the newly generated shipmentId
    
    ledgerRows.push({
      batchKey, rowNo: index + 1, date: s.date || today, clientCode, awb,
      consignee: String(s.consignee || '').toUpperCase(),
      destination: String(s.destination || '').toUpperCase(),
      phone: String(s.phone || ''), pincode: String(s.pincode || ''),
      weight, amount: finalAmount, courier: normalizedCourier,
      department: String(s.department || ''), service: String(s.service || 'Standard'),
      status: normalizedStatus,
      remarks: String(s.remarks || (contractPrice ? `AUTO_PRICED:${contractPrice.contractName}` : '')),
      autoPriced: !!contractPrice,
      shipmentId: existing?.id || null, // Will backfill for new ones later
      createdById: userId || null,
    });
    
    imported++;
  }

  // Insert new shipments in one transaction batch
  if (newShipmentsData.length > 0) {
    const createPromises = newShipmentsData.map(data => prisma.shipment.create({ data }));
    const createdShipments = await prisma.$transaction(createPromises);
    
    // Emit socket events
    createdShipments.forEach(s => emitShipmentCreated(s));
    
    // Update ledger rows and tracking candidates with new IDs
    const newIdMap = new Map(createdShipments.map(s => [s.awb, s.id]));
    
    for (const row of ledgerRows) {
      if (!row.shipmentId && newIdMap.has(row.awb)) {
        row.shipmentId = newIdMap.get(row.awb);
      }
      
      const effectiveCourier = String(row.courier || '').trim();
      const effectiveStatus = String(row.status || '').trim();
      if (row.shipmentId && TRACKABLE_COURIERS.has(effectiveCourier) && !TERMINAL_STATUSES.has(effectiveStatus)) {
        trackingCandidates.push({ shipmentId: row.shipmentId, awb: row.awb, carrier: effectiveCourier });
      }
    }
  } else {
    // For existing ones, populate tracking candidates
    for (const row of ledgerRows) {
      const effectiveCourier = String(row.courier || '').trim();
      const effectiveStatus = String(row.status || '').trim();
      if (row.shipmentId && TRACKABLE_COURIERS.has(effectiveCourier) && !TERMINAL_STATUSES.has(effectiveStatus)) {
        trackingCandidates.push({ shipmentId: row.shipmentId, awb: row.awb, carrier: effectiveCourier });
      }
    }
  }

  // Bulk insert ledger rows
  await importLedger.insertRowsBulk(ledgerRows);
  
  if (trackingCandidates.length > 0) {
      const uniqueCandidates = [...new Map(trackingCandidates.map((item) => [item.awb, item])).values()];
      const enqueueTrackingSync = resolveEnqueueTrackingSync();
      for (const candidate of uniqueCandidates) {
        try {
          if (!enqueueTrackingSync) {
            throw new Error('enqueueTrackingSync is unavailable');
          }
          await enqueueTrackingSync(candidate.shipmentId, candidate.awb, candidate.carrier);
          trackingQueued++;
        } catch (err) {
          logger.warn(`[Import] Tracking sync enqueue failed for ${candidate.awb}: ${err.message}`);
        }
      }
  }

  if (imported > 0) clearCache();
  return { imported, duplicates, autoPriced, operationalCreated, trackingQueued, batchKey, errors: errors.slice(0, 20) };
}

async function getTodayStats() {
  const today = new Date().toISOString().split('T')[0];
  
  if (redis?.status === 'ready') {
    const cached = await redis.get('stats:today').catch(() => null);
    if (cached) return JSON.parse(cached);
  }

  // ── Exclude sandbox shipments from production stats ─────────────────────
  const prodFilter = { date: today, environment: 'production' };
  const [summary, byCourier, recentActivity] = await prisma.$transaction([
    prisma.shipment.groupBy({ by: ['status'], where: prodFilter, _count: { id: true }, _sum: { amount: true, weight: true } }),
    prisma.shipment.groupBy({ by: ['courier'], where: { ...prodFilter, courier: { not: '' } }, _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
    prisma.shipment.findMany({ where: prodFilter, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, awb: true, clientCode: true, courier: true, status: true, amount: true, createdAt: true } }),
  ]);
  const totals = summary.reduce((acc, row) => {
    acc.total += row._count.id; acc.amount += toNumber(row._sum.amount); acc.weight += toNumber(row._sum.weight);
    if (row.status === 'Delivered') acc.delivered++;
    if (['InTransit','Booked','OutForDelivery'].includes(row.status)) acc.inTransit++;
    return acc;
  }, { total: 0, delivered: 0, inTransit: 0, delayed: 0, amount: 0, weight: 0 });
  
  const result = { date: today, ...totals, byCourier, recentActivity };
  if (redis?.status === 'ready') redis.setex('stats:today', 3600, JSON.stringify(result)).catch(() => {});
  return result;
}

async function getMonthlyStats(year, month) {
  const cacheKey = `stats:monthly:${year}:${month}`;
  
  if (redis?.status === 'ready') {
    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) return JSON.parse(cached);
  }

  const from = `${year}-${String(month).padStart(2,'0')}-01`;
  const to   = `${year}-${String(month).padStart(2,'0')}-${new Date(year,month,0).getDate()}`;
  const rows = await prisma.shipment.findMany({ where: { date: { gte: from, lte: to }, environment: 'production' }, select: { date: true, clientCode: true, courier: true, status: true, amount: true, weight: true } });
  
  if (redis?.status === 'ready') redis.setex(cacheKey, 3600, JSON.stringify(rows)).catch(() => {});
  return rows;
}

// Client-facing: shipments for a specific client (for portal)
async function getMyShipments(clientCode, { page = 1, limit = 25, search, status } = {}) {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = { clientCode, environment: 'production', ...(status && { status }), ...(search && { OR: [
    { awb:         { contains: search, mode: 'insensitive' } },
    { consignee:   { contains: search, mode: 'insensitive' } },
    { destination: { contains: search, mode: 'insensitive' } },
  ]}) };
  const [total, shipments] = await prisma.$transaction([
    prisma.shipment.count({ where }),
    prisma.shipment.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit), select: { id: true, awb: true, date: true, consignee: true, destination: true, courier: true, status: true, weight: true, amount: true } }),
  ]);
  return { shipments, pagination: { total, page: parseInt(page), limit: parseInt(limit) } };
}

function autoDetectCourier(awbStr) {
  const awb = String(awbStr || '').toUpperCase().trim();
  if (!awb) return 'Delhivery';
  const detected = detectCourier(awb);
  if (detected?.courier === 'TRACKON') return 'Trackon';
  if (detected?.courier === 'DTDC') return 'DTDC';
  if (detected?.courier === 'DELHIVERY') return 'Delhivery';
  if (/^\d{12}$/.test(awb)) return 'Trackon';
  if (/^\d{13,14}$/.test(awb)) return 'Delhivery';
  if (/^[A-Z]{1,2}\d{8,10}$/.test(awb)) return 'DTDC';
  return 'Delhivery';
}

function normalizeAwb(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[\s\u200B-\u200D\uFEFF]+/g, '')
    .trim()
    .toUpperCase();
}

function buildShipmentQuery(where, include) {
  return include ? { where, include } : { where };
}

async function findShipmentByAwb(awb, include = null) {
  const normalizedAwb = normalizeAwb(awb);
  if (!normalizedAwb) return null;

  const directMatch = await prisma.shipment.findUnique(buildShipmentQuery({ awb: normalizedAwb }, include));
  if (directMatch) return directMatch;

  const legacyMatches = await prisma.$queryRawUnsafe(
    `SELECT id
     FROM shipments
     WHERE regexp_replace(upper(awb), '[^A-Z0-9]+', '', 'g') = $1
     ORDER BY id ASC
     LIMIT 1`,
    normalizedAwb
  );

  const legacyId = Number(legacyMatches?.[0]?.id || 0);
  if (!legacyId) return null;

  return prisma.shipment.findUnique(buildShipmentQuery({ id: legacyId }, include));
}

function hasMeaningfulText(value) {
  const text = String(value || '').trim();
  return Boolean(text) && !PLACEHOLDER_TEXT.has(text.toUpperCase());
}

function hasMeaningfulNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0;
}

function shouldReplaceText(currentValue, nextValue) {
  if (!hasMeaningfulText(nextValue)) return false;
  return !hasMeaningfulText(currentValue);
}

function shouldReplaceNumber(currentValue, nextValue, { allowPlaceholderWeight = false } = {}) {
  if (!hasMeaningfulNumber(nextValue)) return false;
  if (!hasMeaningfulNumber(currentValue)) return true;
  if (allowPlaceholderWeight && Number(currentValue) <= 0.5) return true;
  return false;
}

function extractPincode(value) {
  const match = String(value || '').match(/\b\d{6}\b/);
  return match ? match[0] : '';
}

function normalizeOrderNo(ocrHints) {
  return String(ocrHints?.orderNo || ocrHints?.oid || '').trim();
}

function summarizeOcrHints(ocrHints = null) {
  if (!ocrHints) return null;
  return {
    awb: String(ocrHints.awb || '').trim(),
    clientName: String(ocrHints.clientName || ocrHints.merchant || ocrHints.senderCompany || '').trim(),
    clientCode: String(ocrHints.clientCode || '').trim(),
    consignee: String(ocrHints.consignee || '').trim(),
    destination: String(ocrHints.destination || '').trim(),
    phone: String(ocrHints.phone || '').trim(),
    pincode: String(ocrHints.pincode || extractPincode(ocrHints.destination) || '').trim(),
    weight: Number(ocrHints.weight || 0) || 0,
    amount: Number(ocrHints.amount || 0) || 0,
    orderNo: normalizeOrderNo(ocrHints),
    merchant: String(ocrHints.merchant || '').trim(),
    rawText: String(ocrHints.rawText || '').trim(),
    // Intelligence metadata
    clientNameConfidence: Number(ocrHints.clientNameConfidence || 0) || 0,
    consigneeConfidence: Number(ocrHints.consigneeConfidence || 0) || 0,
    destinationConfidence: Number(ocrHints.destinationConfidence || 0) || 0,
    pincodeConfidence: Number(ocrHints.pincodeConfidence || 0) || 0,
    weightConfidence: Number(ocrHints.weightConfidence || 0) || 0,
    amountConfidence: Number(ocrHints.amountConfidence || 0) || 0,
    // Source tracking
    clientNameSource: ocrHints.clientNameSource || null,
    consigneeSource: ocrHints.consigneeSource || null,
    destinationSource: ocrHints.destinationSource || null,
    // Intelligence engine data
    intelligence: ocrHints._intelligence || null,
  };
}

function buildOcrPatch(ocrHints = null) {
  const patch = {};
  const summary = summarizeOcrHints(ocrHints);
  if (!summary) return patch;

  if (summary.clientCode && summary.clientCode.toUpperCase() !== 'MISC') patch.clientCode = summary.clientCode.toUpperCase();
  if (summary.consignee) patch.consignee = summary.consignee.toUpperCase();
  if (summary.destination) patch.destination = summary.destination.toUpperCase();
  if (summary.phone) patch.phone = summary.phone;
  if (summary.pincode) patch.pincode = summary.pincode;
  if (summary.weight > 0) patch.weight = summary.weight;
  if (summary.orderNo) {
    patch.remarks = `ORDER_NO:${summary.orderNo}`;
  }
  return patch;
}

function buildCapturedShipmentPayload(awb, courier, userId, source, overrideDate = null) {
  return {
    awb: normalizeAwb(awb),
    date: overrideDate || new Date().toISOString().split('T')[0],
    clientCode: 'MISC',
    consignee: 'UNKNOWN',
    destination: 'UNKNOWN',
    weight: 0.5,
    amount: 0,
    courier,
    department: 'Operations',
    service: 'Standard',
    status: 'Booked',
    remarks: source === 'scanner_bulk'
      ? 'SCAN_CAPTURED: Bulk intake awaiting tracking sync'
      : 'SCAN_CAPTURED: Intake awaiting tracking sync',
    createdById: userId,
    updatedById: userId,
  };
}

async function createOrReuseCapturedShipment(awb, userId, courier, source = 'scanner', ocrHints = null, overrideDate = null) {
  const normalizedAwb = normalizeAwb(awb);
  const ocrPatch = buildOcrPatch(ocrHints);
  const existingShipment = await findShipmentByAwb(normalizedAwb, { client: { select: { company: true } } });

  if (existingShipment) {
    const updateData = {
      courier,
      updatedById: userId,
    };

    if (shouldReplaceText(existingShipment.clientCode, ocrPatch.clientCode) && ocrPatch.clientCode?.toUpperCase() !== 'MISC') {
      updateData.clientCode = ocrPatch.clientCode.toUpperCase();
    }
    if (shouldReplaceText(existingShipment.consignee, ocrPatch.consignee)) updateData.consignee = ocrPatch.consignee.toUpperCase();
    if (shouldReplaceText(existingShipment.destination, ocrPatch.destination)) updateData.destination = ocrPatch.destination.toUpperCase();
    if (shouldReplaceText(existingShipment.phone, ocrPatch.phone)) updateData.phone = ocrPatch.phone;
    if (shouldReplaceText(existingShipment.pincode, ocrPatch.pincode)) updateData.pincode = ocrPatch.pincode;
    if (shouldReplaceNumber(existingShipment.weight, ocrPatch.weight, { allowPlaceholderWeight: true })) updateData.weight = ocrPatch.weight;

    const existingRemarks = String(existingShipment.remarks || '').trim();
    const incomingRemarks = String(ocrPatch.remarks || '').trim();
    updateData.remarks = existingRemarks || incomingRemarks || 'SCAN_CAPTURED: Intake awaiting tracking sync';

    const updatedShipment = await prisma.shipment.update({
      where: { id: existingShipment.id },
      data: updateData,
      include: { client: { select: { company: true } } },
    });

    return {
      shipment: updatedShipment,
      existed: true,
      source: 'local_existing',
      trackingUnavailable: true,
      message: 'Shipment captured from local records. Live tracking is unavailable right now.',
    };
  }

  const createdShipment = await prisma.shipment.create({
    data: {
      ...buildCapturedShipmentPayload(normalizedAwb, courier, userId, source, overrideDate),
      ...ocrPatch,
      remarks: ocrPatch.remarks || buildCapturedShipmentPayload(normalizedAwb, courier, userId, source, overrideDate).remarks,
    },
    include: { client: { select: { company: true } } },
  });
  emitShipmentCreated(createdShipment);
  clearCache();

  return {
    shipment: createdShipment,
    existed: false,
    source: 'captured_placeholder',
    trackingUnavailable: true,
    message: 'Shipment captured successfully. Live tracking can sync later.',
  };
}

async function attachClientSuggestion(savedShipment, ocrHints = null, sessionContext = null) {
  if (!savedShipment?.id) {
    return { shipment: savedShipment, clientSuggestion: null };
  }

  const suggestion = await clientMatcher.suggestClientForShipment(savedShipment, ocrHints, sessionContext);
  if (!suggestion?.suggestedClientCode) {
    return { shipment: savedShipment, clientSuggestion: suggestion };
  }

  if (savedShipment.clientCode === suggestion.suggestedClientCode) {
    return { shipment: savedShipment, clientSuggestion: { ...suggestion, autoAssigned: false } };
  }

  if (savedShipment.clientCode === 'MISC' && suggestion.shouldAutoAssign) {
    const patched = await prisma.shipment.update({
      where: { id: savedShipment.id },
      data: {
        clientCode: suggestion.suggestedClientCode,
        remarks: `${savedShipment.remarks || ''}${savedShipment.remarks ? ' | ' : ''}AUTO_CLIENT_MATCH:${suggestion.suggestedClientCode}`,
      },
      include: { client: { select: { company: true } } },
    });
    return {
      shipment: patched,
      clientSuggestion: { ...suggestion, autoAssigned: true },
    };
  }

  return { shipment: savedShipment, clientSuggestion: { ...suggestion, autoAssigned: false } };
}

async function scanAwbAndUpdate(awb, userId, courier = 'Delhivery', options = {}) {
  const { captureOnly = false, source = 'scanner', ocrHints = null, forceLiveTrackingInCapture = false, overrideDate = null, sessionContext = null } = options;
  awb = normalizeAwb(awb);
  if (!courier || courier === 'AUTO') {
    courier = autoDetectCourier(awb);
  }

  // Validate overrideDate format if provided (YYYY-MM-DD)
  const effectiveDate = (overrideDate && /^\d{4}-\d{2}-\d{2}$/.test(overrideDate)) ? overrideDate : null;

  if (captureOnly && !forceLiveTrackingInCapture) {
    const captured = await createOrReuseCapturedShipment(awb, userId, courier, source, ocrHints, effectiveDate);
    const enriched = await attachClientSuggestion(captured.shipment, ocrHints, sessionContext);
    return {
      ...captured,
      shipment: enriched.shipment,
      meta: {
        existed: captured.existed,
        source: captured.source,
        trackingUnavailable: true,
        trackingError: null,
        clientSuggestion: enriched.clientSuggestion,
        ocrExtracted: summarizeOcrHints(ocrHints),
      },
    };
  }

  let shipment = await findShipmentByAwb(awb);
  
  const tracker = COURIERS[courier] || COURIERS['Delhivery'];

  let trackingData = null;
  let trackingError = null;
  try {
    trackingData = await tracker.getTracking(awb);
  } catch (err) {
    trackingError = err;
  }

  if (!trackingData) {
    if (captureOnly) {
      const captured = await createOrReuseCapturedShipment(awb, userId, courier, source, ocrHints, effectiveDate);
      const enriched = await attachClientSuggestion(captured.shipment, ocrHints, sessionContext);
      return {
        ...captured,
        shipment: enriched.shipment,
        meta: {
          existed: captured.existed,
          source: captured.source,
          trackingUnavailable: true,
          trackingError: trackingError?.message || null,
          clientSuggestion: enriched.clientSuggestion,
          ocrExtracted: summarizeOcrHints(ocrHints),
        },
      };
    }

    if (!shipment) {
      throw new AppError(`Shipment with AWB ${awb} not found in database and could not be fetched from ${courier} API.`, 404);
    }
    throw new AppError(`Could not fetch tracking data for AWB ${awb} from ${courier} API. Please check your tracking number or API credentials.`, 400);
  }

  const updateData = { updatedById: userId };
  const ocrPatch = buildOcrPatch(ocrHints);
  
  if (trackingData.recipient) updateData.consignee = trackingData.recipient.toUpperCase();
  if (trackingData.destination) updateData.destination = trackingData.destination.toUpperCase();
  if (trackingData.status && trackingData.status !== 'Booked') updateData.status = normalizeStatus(trackingData.status);
  updateData.courier = courier;
  if (ocrPatch.clientCode && (!shipment || shouldReplaceText(shipment.clientCode, ocrPatch.clientCode))) updateData.clientCode = ocrPatch.clientCode;
  if (ocrPatch.consignee && (!shipment || shouldReplaceText(shipment.consignee, ocrPatch.consignee))) updateData.consignee = ocrPatch.consignee.toUpperCase();
  if (ocrPatch.destination && (!shipment || shouldReplaceText(shipment.destination, ocrPatch.destination))) updateData.destination = ocrPatch.destination.toUpperCase();
  if (ocrPatch.phone && (!shipment || shouldReplaceText(shipment.phone, ocrPatch.phone))) updateData.phone = ocrPatch.phone;
  if (effectiveDate && !shipment) updateData.date = effectiveDate;
  if (ocrPatch.pincode && (!shipment || shouldReplaceText(shipment.pincode, ocrPatch.pincode))) updateData.pincode = ocrPatch.pincode;
  if (ocrPatch.weight && (!shipment || shouldReplaceNumber(shipment.weight, ocrPatch.weight, { allowPlaceholderWeight: true }))) updateData.weight = ocrPatch.weight;
  if (ocrPatch.remarks) updateData.remarks = shipment?.remarks ? `${shipment.remarks} | ${ocrPatch.remarks}` : ocrPatch.remarks;

  let savedShipment;
  if (!shipment) {
    // Auto-create newly discovered shipment
    savedShipment = await prisma.shipment.create({
      data: {
        awb,
        date: effectiveDate || new Date().toISOString().split('T')[0],
        clientCode: updateData.clientCode || 'MISC',
        consignee: updateData.consignee || 'UNKNOWN',
        destination: updateData.destination || 'UNKNOWN',
        phone: updateData.phone || null,
        pincode: updateData.pincode || null,
        weight: 0.5,
        amount: 0,
        courier: courier,
        department: 'Operations',
        service: 'Standard',
        status: updateData.status || 'InTransit',
        remarks: updateData.remarks ? `AUTO_DISCOVERED: Via Scanner | ${updateData.remarks}` : 'AUTO_DISCOVERED: Via Scanner',
        createdById: userId,
        updatedById: userId
      },
      include: { client: { select: { company: true } } }
    });
    emitShipmentCreated(savedShipment);
  } else {
    // Update existing shipment
    savedShipment = await prisma.shipment.update({
      where: { id: shipment.id },
      data: updateData,
      include: { client: { select: { company: true } } }
    });
  }

  if (trackingData.status && (!shipment || trackingData.status !== shipment.status)) {
    try {
      await prisma.trackingEvent.create({ data: { shipmentId: savedShipment.id, awb, status: trackingData.status, description: 'Scanned and updated from API', timestamp: new Date(), source: 'API' } });
    } catch (e) { logger.warn(`[Tracking] Event log failed: ${e.message}`); }
  }

  clearCache();
  const enriched = await attachClientSuggestion(savedShipment, ocrHints, sessionContext);
  emitShipmentStatusUpdated(enriched.shipment);
  return {
    message: shipment ? 'Tracking data updated successfully' : 'Shipment automatically discovered and created',
    shipment: enriched.shipment,
    meta: {
      existed: !!shipment,
      source: shipment ? 'tracked_existing' : 'tracked_discovered',
      trackingUnavailable: false,
      clientSuggestion: enriched.clientSuggestion,
      ocrExtracted: summarizeOcrHints(ocrHints),
    },
  };
}

async function scanAwbBulkAndUpdate(awbs, userId, courier = 'Delhivery', options = {}) {
  const results = { successful: [], failed: [] };
  
  // Process sequentially to be kind to Courier API rate limits
  for (const awb of awbs) {
    try {
      const data = await scanAwbAndUpdate(awb, userId, courier, options);
      results.successful.push({ awb, data: data.shipment, meta: data.meta || {} });
    } catch (err) {
      results.failed.push({ awb, error: err.message });
    }
  }
  
  return results;
}

module.exports = {
  getAll,
  getById,
  simulateShipment,
  create,
  update,
  updateStatus,
  forceUpdateStatus,
  remove,
  bulkImport,
  getTodayStats,
  getMonthlyStats,
  getMyShipments,
  scanAwbAndUpdate,
  scanAwbBulkAndUpdate,
  buildFilters
};
