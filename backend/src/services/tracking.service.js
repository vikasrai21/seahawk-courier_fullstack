// src/services/tracking.service.js
const prisma = require('../config/prisma');

const STATUSES = ['Booked','Picked Up','In Transit','Reached Hub','Out for Delivery','Delivered','Failed Delivery','RTO Initiated','RTO Delivered'];

async function getTimeline(awb) {
  const events = await prisma.trackingEvent.findMany({
    where: { awb: { equals: awb, mode: 'insensitive' } },
    orderBy: { createdAt: 'desc' },
  });
  const shipment = await prisma.shipment.findFirst({
    where: { awb: { equals: awb, mode: 'insensitive' } },
    include: { client: { select: { code: true, company: true } } },
  });
  return { shipment, events };
}

async function addEvent({ shipmentId, awb, status, location, description, courier, source = 'MANUAL', rawData }) {
  // Create event
  const event = await prisma.trackingEvent.create({
    data: { shipmentId, awb, status, location, description, courier, source, rawData },
  });
  // Update shipment status to latest
  const latestStatus = mapEventToShipmentStatus(status);
  if (latestStatus) {
    await prisma.shipment.updateMany({
      where: { id: shipmentId },
      data: { status: latestStatus, updatedAt: new Date() },
    });
  }
  return event;
}

async function bulkAddEvents(events) {
  return prisma.trackingEvent.createMany({ data: events, skipDuplicates: true });
}

function mapEventToShipmentStatus(eventStatus) {
  const map = {
    'Booked':            'Booked',
    'Picked Up':         'InTransit',
    'In Transit':        'InTransit',
    'Reached Hub':       'InTransit',
    'Out for Delivery':  'OutForDelivery',
    'Delivered':         'Delivered',
    'Failed Delivery':   'Delayed',
    'RTO Initiated':     'RTO',
    'RTO Delivered':     'RTO',
  };
  return map[eventStatus] || null;
}

async function getRecentEvents(limit = 50) {
  return prisma.trackingEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

// Auto-seed first event when a shipment is booked
async function seedBookedEvent(shipment) {
  const existing = await prisma.trackingEvent.count({ where: { shipmentId: shipment.id } });
  if (existing > 0) return;
  return prisma.trackingEvent.create({
    data: {
      shipmentId: shipment.id,
      awb: shipment.awb,
      status: 'Booked',
      location: 'Delhi NCR — Sea Hawk Origin Hub',
      description: 'Shipment booked and accepted by Sea Hawk Courier',
      courier: shipment.courier,
      source: 'MANUAL',
    },
  });
}

module.exports = { getTimeline, addEvent, bulkAddEvents, getRecentEvents, seedBookedEvent, STATUSES };
