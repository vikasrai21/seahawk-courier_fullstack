'use strict';

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Redis = require('ioredis');
const { createAdapter } = require('@socket.io/redis-adapter');
const prisma = require('../config/prisma');
const config = require('../config');
const logger = require('../utils/logger');

let io = null;

async function resolveSocketUser(token) {
  if (!token) return null;

  const decoded = jwt.verify(token, config.jwt.secret);
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      email: true,
      role: true,
      active: true,
      clientProfile: { select: { clientCode: true } },
    },
  });

  if (!user || !user.active) return null;

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    clientCode: user.clientProfile?.clientCode || null,
  };
}

async function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: config.cors.origin,
      credentials: true,
    },
  });

  if (config.redis.url) {
    try {
      const pubClient = new Redis(config.redis.url, { maxRetriesPerRequest: null, enableReadyCheck: false });
      const subClient = new Redis(config.redis.url, { maxRetriesPerRequest: null, enableReadyCheck: false });
      io.adapter(createAdapter(pubClient, subClient));
      logger.info('Socket.io Redis adapter enabled');
    } catch (err) {
      logger.warn(`Socket.io Redis adapter disabled: ${err.message}`);
    }
  }

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token
        || socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '')
        || null;

      const user = await resolveSocketUser(token);
      if (!user) return next(new Error('Unauthorized'));

      socket.data.user = user;
      return next();
    } catch {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;

    if (['ADMIN', 'OPS_MANAGER', 'STAFF'].includes(user.role)) {
      socket.join('dashboard:global');
    }

    if (user.clientCode) {
      socket.join(`portal:client:${user.clientCode}`);
    }

    logger.info(`Socket connected: ${user.email}`);
    socket.on('disconnect', () => logger.info(`Socket disconnected: ${user.email}`));
  });

  return io;
}

function emitShipmentCreated(shipment) {
  if (!io || !shipment) return;

  io.to('dashboard:global').emit('shipment:created', shipment);
  if (shipment.clientCode) {
    io.to(`portal:client:${shipment.clientCode}`).emit('shipment:created', shipment);
  }
}

function emitShipmentStatusUpdated(shipment) {
  if (!io || !shipment) return;

  io.to('dashboard:global').emit('shipment:status-updated', shipment);
  if (shipment.clientCode) {
    io.to(`portal:client:${shipment.clientCode}`).emit('shipment:status-updated', shipment);
  }
}

module.exports = {
  initSocket,
  emitShipmentCreated,
  emitShipmentStatusUpdated,
};
