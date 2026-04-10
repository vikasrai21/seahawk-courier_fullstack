'use strict';

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Redis = require('ioredis');
const { createAdapter } = require('@socket.io/redis-adapter');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const config = require('../config');
const logger = require('../utils/logger');

let io = null;

// ── Scanner Bridge: in-memory session store ─────────────────────────────────
// Maps PIN → { desktopSocketId, userId, createdAt, phoneSocketId }
const scanSessions = new Map();
const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes

function generatePin() {
  return String(crypto.randomInt(100000, 999999));
}

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [pin, session] of scanSessions) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      scanSessions.delete(pin);
    }
  }
}

// Cleanup every 2 minutes
setInterval(cleanupExpiredSessions, 2 * 60 * 1000);

// ── Auth resolver ───────────────────────────────────────────────────────────

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

// ── Socket init ─────────────────────────────────────────────────────────────

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

  // ── Main namespace (authenticated users) ────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token
        || socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '')
        || null;

      // Allow mobile scanner connections (they send a PIN instead of a token)
      const scannerPin = socket.handshake.auth?.scannerPin;
      if (scannerPin) {
        socket.data.isMobileScanner = true;
        socket.data.scannerPin = scannerPin;
        return next();
      }

      const user = await resolveSocketUser(token);
      if (!user) return next(new Error('Unauthorized'));

      socket.data.user = user;
      return next();
    } catch {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    // ── Mobile scanner phone connection ─────────────────────────────────
    if (socket.data.isMobileScanner) {
      handleMobileScannerConnection(socket);
      return;
    }

    // ── Regular authenticated user connection ───────────────────────────
    const user = socket.data.user;

    if (['ADMIN', 'OPS_MANAGER', 'STAFF'].includes(user.role)) {
      socket.join('dashboard:global');
    }

    if (user.clientCode) {
      socket.join(`portal:client:${user.clientCode}`);
    }

    logger.info(`Socket connected: ${user.email}`);

    // ── Scanner Bridge: Desktop events ──────────────────────────────────

    // Desktop requests a new scan session
    socket.on('scanner:create-session', (callback) => {
      cleanupExpiredSessions();

      // Remove any existing session for this user
      for (const [pin, session] of scanSessions) {
        if (session.desktopSocketId === socket.id) {
          scanSessions.delete(pin);
        }
      }

      const pin = generatePin();
      scanSessions.set(pin, {
        desktopSocketId: socket.id,
        userId: user.id,
        userEmail: user.email,
        createdAt: Date.now(),
        phoneSocketId: null,
        phoneConnected: false,
        scanCount: 0,
      });

      logger.info(`Scanner session created: PIN ${pin} by ${user.email}`);

      if (typeof callback === 'function') {
        callback({ success: true, pin, expiresIn: SESSION_TTL_MS });
      }
    });

    // Desktop ends the scan session
    socket.on('scanner:end-session', () => {
      for (const [pin, session] of scanSessions) {
        if (session.desktopSocketId === socket.id) {
          // Notify phone if connected
          if (session.phoneSocketId) {
            io.to(session.phoneSocketId).emit('scanner:session-ended', {
              reason: 'Desktop ended the session',
            });
          }
          scanSessions.delete(pin);
          logger.info(`Scanner session ended: PIN ${pin}`);
        }
      }
    });

    // Desktop processes scan result and sends feedback to phone
    socket.on('scanner:scan-processed', ({ pin, awb, shipmentId, status, clientCode, clientName, consignee, destination, pincode, weight, amount, orderNo, reviewRequired, error }) => {
      const session = scanSessions.get(pin);
      if (!session || session.desktopSocketId !== socket.id) return;
      if (session.phoneSocketId) {
        io.to(session.phoneSocketId).emit('scanner:scan-feedback', {
          awb,
          shipmentId,
          status,
          clientCode,
          clientName,
          consignee,
          destination,
          pincode,
          weight,
          amount,
          orderNo,
          reviewRequired,
          error,
        });
      }
    });

    socket.on('scanner:approval-result', ({ pin, shipmentId, awb, success, message }) => {
      const session = scanSessions.get(pin);
      if (!session || session.desktopSocketId !== socket.id || !session.phoneSocketId) return;
      io.to(session.phoneSocketId).emit('scanner:approval-result', {
        shipmentId,
        awb,
        success: !!success,
        message: message || '',
      });
    });

    socket.on('scanner:intake-preview', ({ pin, intakeRow }) => {
      const session = scanSessions.get(pin);
      if (!session || session.desktopSocketId !== socket.id || !session.phoneSocketId) return;
      io.to(session.phoneSocketId).emit('scanner:intake-preview', { intakeRow });
    });

    // Desktop tells phone: "I'm done processing, you can scan again"
    socket.on('scanner:ready-for-next', ({ pin }) => {
      const session = scanSessions.get(pin);
      if (!session || session.desktopSocketId !== socket.id || !session.phoneSocketId) return;
      io.to(session.phoneSocketId).emit('scanner:ready-for-next', {
        scanCount: session.scanCount,
        timestamp: new Date().toISOString(),
      });
    });

    // Desktop relays correction diffs for the learning system
    socket.on('scanner:learn-corrections', ({ pin, ocrFields, approvedFields }) => {
      // This is handled server-side: call the correction learner directly
      try {
        const correctionLearner = require('../services/correctionLearner.service');
        correctionLearner.recordCorrections(ocrFields || {}, approvedFields || {})
          .catch(err => logger.warn(`[Learning] Socket correction save failed: ${err.message}`));
      } catch (err) {
        logger.warn(`[Learning] Socket correction failed: ${err.message}`);
      }
    });

    // Cleanup on desktop disconnect
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${user.email}`);
      for (const [pin, session] of scanSessions) {
        if (session.desktopSocketId === socket.id) {
          if (session.phoneSocketId) {
            io.to(session.phoneSocketId).emit('scanner:session-ended', {
              reason: 'Desktop disconnected',
            });
          }
          scanSessions.delete(pin);
        }
      }
    });
  });

  return io;
}

// ── Mobile scanner phone handler ────────────────────────────────────────────

function handleMobileScannerConnection(socket) {
  const pin = socket.data.scannerPin;
  const session = scanSessions.get(pin);

  if (!session) {
    socket.emit('scanner:error', { message: 'Invalid or expired PIN. Please generate a new code on the desktop.' });
    socket.disconnect(true);
    return;
  }

  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    scanSessions.delete(pin);
    socket.emit('scanner:error', { message: 'This session has expired. Please generate a new code.' });
    socket.disconnect(true);
    return;
  }

  // Pair the phone
  session.phoneSocketId = socket.id;
  session.phoneConnected = true;

  logger.info(`Mobile scanner paired: PIN ${pin}, desktop user ${session.userEmail}`);

  // Notify desktop that phone connected
  io.to(session.desktopSocketId).emit('scanner:phone-connected', {
    pin,
    message: 'Mobile phone connected! Start scanning barcodes.',
  });

  // Confirm to phone
  socket.emit('scanner:paired', {
    message: 'Connected to desktop! Point your camera at a barcode.',
    userEmail: session.userEmail,
  });

  // Phone sends a scanned barcode
  socket.on('scanner:scan', ({ awb, imageBase64, focusImageBase64, sessionContext }) => {
    const currentSession = scanSessions.get(pin);
    if (!currentSession || currentSession.phoneSocketId !== socket.id) return;

    currentSession.scanCount++;

    logger.info(`Remote scan #${currentSession.scanCount}: AWB ${awb} via PIN ${pin}`);

    // Relay to desktop with session context
    io.to(currentSession.desktopSocketId).emit('scanner:remote-scan', {
      awb: String(awb || '').trim(),
      imageBase64: imageBase64 || null,
      focusImageBase64: focusImageBase64 || null,
      scanNumber: currentSession.scanCount,
      timestamp: new Date().toISOString(),
      sessionContext: sessionContext || {},
    });
  });

  socket.on('scanner:approval-submit', ({ shipmentId, awb, fields }, callback) => {
    const currentSession = scanSessions.get(pin);
    if (!currentSession || currentSession.phoneSocketId !== socket.id) {
      if (typeof callback === 'function') callback({ success: false, message: 'Scanner session is no longer active.' });
      return;
    }

    io.to(currentSession.desktopSocketId).emit('scanner:approval-submitted', {
      pin,
      shipmentId,
      awb: String(awb || '').trim(),
      fields: fields || {},
      timestamp: new Date().toISOString(),
    });

    if (typeof callback === 'function') {
      callback({ success: true, message: 'Approval sent to desktop.' });
    }
  });

  // Phone sends a heartbeat
  socket.on('scanner:heartbeat', () => {
    const currentSession = scanSessions.get(pin);
    if (currentSession) {
      io.to(currentSession.desktopSocketId).emit('scanner:phone-heartbeat', {
        scanCount: currentSession.scanCount,
      });
    }
  });

  // Phone disconnects
  socket.on('disconnect', () => {
    const currentSession = scanSessions.get(pin);
    if (currentSession && currentSession.phoneSocketId === socket.id) {
      currentSession.phoneConnected = false;
      currentSession.phoneSocketId = null;

      io.to(currentSession.desktopSocketId).emit('scanner:phone-disconnected', {
        pin,
        message: 'Mobile phone disconnected. Scan the QR code again to reconnect.',
        totalScans: currentSession.scanCount,
      });

      logger.info(`Mobile scanner disconnected: PIN ${pin}, ${currentSession.scanCount} scans completed`);
    }
  });
}

// ── Emit helpers ────────────────────────────────────────────────────────────

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
