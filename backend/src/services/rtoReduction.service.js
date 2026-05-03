'use strict';
const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const notification = require('./notification.service');

// Pre-delivery address verification + WhatsApp confirmation
async function runPreDeliveryIntervention(shipmentId) {
  const shipment = await prisma.shipment.findUnique({ where: { id: parseInt(shipmentId) }, select: { id: true, awb: true, phone: true, consignee: true, destination: true, pincode: true, clientCode: true, status: true, riskScore: true } });
  if (!shipment) return { skipped: true, reason: 'Shipment not found' };
  if (!['Booked', 'InTransit', 'OutForDelivery'].includes(shipment.status)) return { skipped: true, reason: 'Not eligible for intervention' };

  const interventions = [];

  // 1. Address verification for high-risk
  if (shipment.riskScore && shipment.riskScore > 70) {
    interventions.push({ type: 'HIGH_RISK_FLAG', detail: `Risk score ${shipment.riskScore}. Suggest address verification.` });
  }

  // 2. Pre-delivery WhatsApp confirmation
  if (shipment.phone && shipment.status === 'OutForDelivery') {
    const msg = `📦 Hi ${shipment.consignee || 'there'}, your shipment (AWB: ${shipment.awb}) is out for delivery today.\n\nWill you be available to receive? Reply YES to confirm or share alternate instructions.\n\n— Sea Hawk Courier`;
    const result = await notification.sendWhatsApp(shipment.phone, msg).catch(e => ({ sent: false, error: e.message }));
    interventions.push({ type: 'PRE_DELIVERY_WHATSAPP', sent: result?.sent || false, phone: shipment.phone });
  }

  // 3. Incomplete/suspicious address
  if (!shipment.pincode || !shipment.destination || String(shipment.destination).length < 10) {
    interventions.push({ type: 'INCOMPLETE_ADDRESS', detail: 'Address incomplete — high RTO probability' });
  }

  return { shipmentId, awb: shipment.awb, interventions, interventionCount: interventions.length };
}

async function getRTOReductionDashboard(dateFrom, dateTo) {
  const where = {};
  if (dateFrom || dateTo) { where.date = {}; if (dateFrom) where.date.gte = dateFrom; if (dateTo) where.date.lte = dateTo; }
  const [total, rto, delivered] = await Promise.all([
    prisma.shipment.count({ where }),
    prisma.shipment.count({ where: { ...where, status: 'RTO' } }),
    prisma.shipment.count({ where: { ...where, status: 'Delivered' } }),
  ]);
  const rtoRate = total > 0 ? ((rto / total) * 100).toFixed(2) : 0;
  const deliveryRate = total > 0 ? ((delivered / total) * 100).toFixed(2) : 0;

  // Top RTO reasons from NDR events
  const ndrReasons = await prisma.nDREvent.groupBy({ by: ['reason'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 10 });

  // RTO by courier
  const rtoByCourier = await prisma.shipment.groupBy({ by: ['courier'], where: { ...where, status: 'RTO', courier: { not: null } }, _count: { id: true }, orderBy: { _count: { id: 'desc' } } });

  return { total, rto, delivered, rtoRate: Number(rtoRate), deliveryRate: Number(deliveryRate), topReasons: ndrReasons.map(r => ({ reason: r.reason, count: r._count.id })), rtoByCourier: rtoByCourier.map(c => ({ courier: c.courier, count: c._count.id })) };
}

async function identifyHighRiskShipments(limit = 50) {
  return prisma.shipment.findMany({
    where: { status: { in: ['Booked', 'InTransit'] }, OR: [{ riskScore: { gt: 60 } }, { pincode: null }, { destination: null }] },
    select: { id: true, awb: true, consignee: true, destination: true, pincode: true, riskScore: true, courier: true, clientCode: true },
    orderBy: { riskScore: 'desc' }, take: limit,
  });
}

module.exports = { runPreDeliveryIntervention, getRTOReductionDashboard, identifyHighRiskShipments };
