// src/controllers/audit.controller.js
const prisma = require('../config/prisma');
const R = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const getAll = asyncHandler(async (req, res) => {
  const { entity, userId, action, from, to, page = 1, limit = 50 } = req.query;
  const where = {};
  if (entity) where.entity = entity;
  if (userId) where.userId = parseInt(userId);
  if (action) where.action = action;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to)   where.createdAt.lte = new Date(to);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [total, logs] = await prisma.$transaction([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
  ]);

  R.paginated(res, logs, total, page, limit);
});

module.exports = { getAll };
