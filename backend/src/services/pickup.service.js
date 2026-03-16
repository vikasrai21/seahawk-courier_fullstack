// src/services/pickup.service.js
const prisma = require('../config/prisma');

function genRef() {
  const y = new Date().getFullYear();
  const n = Math.floor(1000 + Math.random() * 9000);
  return `SHK-${y}-${n}`;
}

async function create(data) {
  let refNo = genRef();
  // Ensure uniqueness
  while (await prisma.pickupRequest.findUnique({ where: { refNo } })) {
    refNo = genRef();
  }
  return prisma.pickupRequest.create({ data: { ...data, refNo } });
}

async function getAll({ status, date, page = 1, limit = 50 }) {
  const where = {};
  if (status) where.status = status;
  if (date)   where.pickupDate = date;
  const [items, total] = await Promise.all([
    prisma.pickupRequest.findMany({
      where, orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit, take: limit,
    }),
    prisma.pickupRequest.count({ where }),
  ]);
  return { items, total };
}

async function getOne(id) {
  return prisma.pickupRequest.findUnique({ where: { id } });
}

async function assign(id, agentId) {
  return prisma.pickupRequest.update({
    where: { id },
    data: { assignedAgentId: agentId, assignedAt: new Date(), status: 'ASSIGNED' },
  });
}

async function updateStatus(id, status) {
  const data = { status };
  if (status === 'COMPLETED') data.completedAt = new Date();
  return prisma.pickupRequest.update({ where: { id }, data });
}

async function linkShipment(id, shipmentId) {
  return prisma.pickupRequest.update({ where: { id }, data: { shipmentId, status: 'COMPLETED' } });
}

async function getTodayCount() {
  const today = new Date().toISOString().split('T')[0];
  return prisma.pickupRequest.count({ where: { pickupDate: today } });
}

module.exports = { create, getAll, getOne, assign, updateStatus, linkShipment, getTodayCount };
