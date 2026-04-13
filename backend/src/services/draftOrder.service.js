// src/services/draftOrder.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { NotFoundError, BadRequestError } = require('../middleware/errorHandler');

/**
 * Creates a new draft order
 */
const create = async (data, userId) => {
  const { clientCode, referenceId, consignee, destination, phone, pincode, weight } = data;

  if (!clientCode || !consignee || !weight) {
    throw new BadRequestError('clientCode, consignee, and weight are required');
  }

  // Ensure client exists
  const client = await prisma.client.findUnique({ where: { code: clientCode } });
  if (!client) {
    throw new NotFoundError('Client not found');
  }

  const draft = await prisma.draftOrder.create({
    data: {
      clientCode,
      referenceId,
      consignee,
      destination,
      phone,
      pincode,
      weight: parseFloat(weight),
      status: 'PENDING',
    },
  });
  return draft;
};

/**
 * Get draft orders for a given client (or all for ops)
 */
const getAll = async (options = {}, page = 1, limit = 50) => {
  const { clientCode, status, q } = options;
  const where = {};

  if (clientCode) where.clientCode = clientCode;
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { referenceId: { contains: q, mode: 'insensitive' } },
      { consignee: { contains: q, mode: 'insensitive' } },
      { destination: { contains: q, mode: 'insensitive' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [drafts, total] = await Promise.all([
    prisma.draftOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        shipment: { select: { awb: true, status: true } },
      },
    }),
    prisma.draftOrder.count({ where }),
  ]);

  return { drafts, total, page, limit };
};

/**
 * Bulk create drafts from an array
 */
const bulkCreate = async (draftsArray, clientCode) => {
  if (!draftsArray || !draftsArray.length) throw new BadRequestError('No drafts provided');

  const created = [];
  const errors = [];

  for (const row of draftsArray) {
    try {
      if (!row.consignee || !row.weight) {
        throw new Error('Missing consignee or weight');
      }
      const draft = await prisma.draftOrder.create({
        data: {
          clientCode,
          referenceId: row.referenceId || null,
          consignee: row.consignee,
          destination: row.destination || '',
          phone: row.phone || null,
          pincode: row.pincode || null,
          weight: parseFloat(row.weight) || 0.1,
          status: 'PENDING',
        },
      });
      created.push(draft);
    } catch (err) {
      errors.push({ row, error: err.message });
    }
  }

  return { createdCount: created.length, created, errors };
};

/**
 * Link a Draft Order to a formal Shipment (AWB binding)
 */
const linkToShipment = async (draftId, shipmentId) => {
  const draft = await prisma.draftOrder.findUnique({ where: { id: parseInt(draftId) } });
  if (!draft) throw new NotFoundError('Draft order not found');

  return prisma.draftOrder.update({
    where: { id: draft.id },
    data: {
      status: 'FULFILLED',
      shipmentId: parseInt(shipmentId),
    },
  });
};

/**
 * Auto-discover a matching PENDING draft for a given client and OCR hints
 * (Used by Mobile Scanner)
 */
const autoDiscoverDraft = async (clientCode, ocrHints) => {
  if (!clientCode || !ocrHints) return null;

  // Attempt 1: Exact Reference (Order No)
  if (ocrHints.orderNo) {
    const byRef = await prisma.draftOrder.findFirst({
      where: {
        clientCode,
        status: 'PENDING',
        referenceId: { equals: ocrHints.orderNo, mode: 'insensitive' },
      },
    });
    if (byRef) return byRef;
  }

  // Attempt 2: Precise Consignee Name Match
  if (ocrHints.consignee) {
    const byName = await prisma.draftOrder.findFirst({
      where: {
        clientCode,
        status: 'PENDING',
        consignee: { equals: ocrHints.consignee, mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' }, // Prioritize most recent
    });
    if (byName) return byName;
  }

  return null;
};

const remove = async (id) => {
  return prisma.draftOrder.delete({ where: { id: parseInt(id) } });
};

module.exports = {
  create,
  getAll,
  bulkCreate,
  linkToShipment,
  autoDiscoverDraft,
  remove,
};
