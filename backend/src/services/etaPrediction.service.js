'use strict';
const prisma = require('../config/prisma');
const logger = require('../utils/logger');

// Statistical ETA based on historical courier+zone performance
async function predictETA(shipmentId) {
  const shipment = await prisma.shipment.findUnique({ where: { id: parseInt(shipmentId) }, select: { id: true, courier: true, pincode: true, origin: true, date: true, status: true } });
  if (!shipment) throw new Error('Shipment not found');
  if (['Delivered', 'RTO', 'Cancelled'].includes(shipment.status)) return { shipmentId, eta: null, message: 'Shipment already terminal' };

  const zone = getZoneFromPincode(shipment.pincode);
  const historicalDays = await getHistoricalDeliveryDays(shipment.courier, zone);
  const etaDays = historicalDays || getDefaultETA(shipment.courier, zone);
  const shipDate = new Date(shipment.date);
  const eta = new Date(shipDate.getTime() + etaDays * 86400000);
  const etaStr = eta.toISOString().split('T')[0];

  await prisma.shipment.update({ where: { id: shipment.id }, data: { predictedDeliveryDate: etaStr } });
  return { shipmentId, eta: etaStr, estimatedDays: etaDays, confidence: historicalDays ? 'HIGH' : 'MEDIUM', zone, courier: shipment.courier };
}

async function getHistoricalDeliveryDays(courier, zone) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const delivered = await prisma.shipment.findMany({
      where: { courier, status: 'Delivered', date: { gte: thirtyDaysAgo }, pincode: zone ? { startsWith: zone.slice(0, 1) } : undefined },
      select: { date: true, updatedAt: true }, take: 200,
    });
    if (delivered.length < 5) return null;
    const days = delivered.map(s => { const d = new Date(s.updatedAt).getTime() - new Date(s.date).getTime(); return Math.max(1, Math.round(d / 86400000)); }).filter(d => d > 0 && d < 30);
    if (days.length < 5) return null;
    days.sort((a, b) => a - b);
    return days[Math.floor(days.length * 0.7)]; // 70th percentile
  } catch { return null; }
}

function getZoneFromPincode(pin) {
  if (!pin) return 'ROI';
  const first = String(pin).charAt(0);
  const zones = { '1': 'NORTH', '2': 'NORTH', '3': 'WEST', '4': 'WEST', '5': 'SOUTH', '6': 'SOUTH', '7': 'EAST', '8': 'EAST', '9': 'NE' };
  return zones[first] || 'ROI';
}

function getDefaultETA(courier, zone) {
  const defaults = { Delhivery: { NORTH: 3, SOUTH: 5, EAST: 5, WEST: 4, NE: 7, ROI: 5 }, DTDC: { NORTH: 4, SOUTH: 5, EAST: 6, WEST: 4, NE: 8, ROI: 6 }, Trackon: { NORTH: 4, SOUTH: 6, EAST: 6, WEST: 5, NE: 8, ROI: 6 } };
  return defaults[courier]?.[zone] || 5;
}

async function bulkPredictETA(shipmentIds) {
  const results = [];
  for (const id of shipmentIds) {
    try { results.push(await predictETA(id)); } catch (e) { results.push({ shipmentId: id, error: e.message }); }
  }
  return results;
}

module.exports = { predictETA, bulkPredictETA, getZoneFromPincode };
