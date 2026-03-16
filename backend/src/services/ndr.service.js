// src/services/ndr.service.js
const prisma = require('../config/prisma');

async function getAll({ status, page = 1, limit = 50 }) {
  const where = {};
  if (status) where.adminAction = status === 'PENDING' ? null : status;
  const [items, total] = await Promise.all([
    prisma.nDREvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.nDREvent.count({ where }),
  ]);
  return { items, total };
}

async function create({ shipmentId, awb, reason, notes, createdById }) {
  return prisma.nDREvent.create({
    data: { shipmentId, awb, reason, notes, createdById },
  });
}

async function resolve(id, { adminAction, newAddress, notes }) {
  return prisma.nDREvent.update({
    where: { id },
    data: {
      adminAction,
      newAddress,
      notes,
      resolvedAt: ['REATTEMPT','UPDATE_ADDRESS','RTO'].includes(adminAction) ? new Date() : null,
    },
  });
}

async function incrementAttempts(id) {
  return prisma.nDREvent.update({ where: { id }, data: { attempts: { increment: 1 } } });
}

module.exports = { getAll, create, resolve, incrementAttempts };
