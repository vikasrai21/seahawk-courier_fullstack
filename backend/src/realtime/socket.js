'use strict';

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Redis = require('ioredis');
const { createAdapter } = require('@socket.io/redis-adapter');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const config = require('../config');
const logger = require('../utils/logger');
const scannerQuality = require('../services/scannerQuality.service');

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
    // Allow large base64 image payloads from mobile scanner flows.
    maxHttpBufferSize: 10 * 1024 * 1024,
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
        io.to(session.phoneSocketId).emit('scanner:scan-processed', {
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
    socket.on('scanner:learn-corrections', async ({ pin, ocrFields, approvedFields, courier, deviceProfile }) => {
      try {
        const correctionLearner = require('../services/correctionLearner.service');
        const saved = await correctionLearner.recordCorrections(ocrFields || {}, approvedFields || {});
        const changedFields = ['clientName', 'clientCode', 'consignee', 'destination']
          .filter((field) => String(ocrFields?.[field] || '').trim() && String(approvedFields?.[field] || '').trim())
          .filter((field) => String(ocrFields?.[field] || '').trim() !== String(approvedFields?.[field] || '').trim())
          .length;

        scannerQuality.recordCorrectionEvent({
          pin,
          courier,
          deviceProfile,
          changedFields,
          savedCorrections: saved.length,
        });
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

  // Phone sends a scanned barcode — server handles OCR directly (no desktop tab required)
  socket.on('scanner:scan', async ({ awb, imageBase64, focusImageBase64, sessionContext, scanMode }) => {
    const currentSession = scanSessions.get(pin);
    if (!currentSession || currentSession.phoneSocketId !== socket.id) return;

    const scanStartedAt = Date.now();
    const cleanAwb = String(awb || '').trim();
    const deviceProfile = String(sessionContext?.deviceProfile || sessionContext?.hardwareClass || 'phone-camera').trim() || 'phone-camera';
    const lockTimeMs = Number.isFinite(Number(sessionContext?.lockTimeMs)) ? Number(sessionContext.lockTimeMs) : null;
    const lockCandidateCount = Number.isFinite(Number(sessionContext?.lockCandidateCount)) ? Number(sessionContext.lockCandidateCount) : null;
    const qualityIssues = Array.isArray(sessionContext?.captureQuality?.issues)
      ? sessionContext.captureQuality.issues.filter(Boolean).map((issue) => String(issue).toLowerCase()).slice(0, 8)
      : [];

    currentSession.scanCount++;
    logger.info(`Remote scan #${currentSession.scanCount}: AWB ${cleanAwb} via PIN ${pin}`);

    // Also relay to desktop if it's open (for the ScanAWBPage live feed)
    io.to(currentSession.desktopSocketId).emit('scanner:remote-scan', {
      awb: cleanAwb,
      imageBase64: imageBase64 || null,
      focusImageBase64: focusImageBase64 || null,
      scanMode: scanMode || null,
      scanNumber: currentSession.scanCount,
      timestamp: new Date().toISOString(),
      sessionContext: sessionContext || {},
    });

    // --- SERVER-SIDE OCR PIPELINE (runs regardless of desktop tab state) ---
    if (!imageBase64 && !focusImageBase64) {
      if (!cleanAwb) {
        scannerQuality.recordScanEvent({
          pin,
          source: 'mobile_scanner_fast',
          scanMode: scanMode || 'fast_barcode_only',
          deviceProfile,
          lockedAwb: cleanAwb,
          success: false,
          reviewRequired: false,
          hadImage: false,
          lockTimeMs,
          totalMs: Date.now() - scanStartedAt,
          qualityIssues,
        });
        socket.emit('scanner:scan-processed', {
          awb: '',
          status: 'error',
          error: 'Barcode scan did not include an AWB.',
        });
        return;
      }

      try {
        const shipmentSvc = require('../services/shipment.service');
        const result = await shipmentSvc.scanAwbAndUpdate(cleanAwb, currentSession.userId, null, {
          captureOnly: true,
          source: scanMode === 'fast_barcode_only' ? 'mobile_scanner_fast' : 'mobile_scanner',
          sessionContext: sessionContext || {},
        });
        const shipment = result?.shipment || null;
        const totalMs = Date.now() - scanStartedAt;
        scannerQuality.recordScanEvent({
          pin,
          source: scanMode === 'fast_barcode_only' ? 'mobile_scanner_fast' : 'mobile_scanner',
          scanMode: scanMode || 'fast_barcode_only',
          deviceProfile,
          courier: shipment?.courier || '',
          awb: cleanAwb,
          lockedAwb: cleanAwb,
          awbSource: 'fast_input',
          success: true,
          reviewRequired: false,
          hadImage: false,
          lockTimeMs,
          totalMs,
          qualityIssues,
        });

        socket.emit('scanner:scan-processed', {
          awb: cleanAwb,
          shipmentId: shipment?.id || null,
          status: 'ok',
          clientCode: shipment?.clientCode || '',
          clientName: shipment?.client?.company || shipment?.clientCode || '',
          consignee: shipment?.consignee || '',
          destination: shipment?.destination || '',
          pincode: shipment?.pincode || '',
          weight: shipment?.weight || 0,
          amount: shipment?.amount || 0,
          orderNo: shipment?.orderNo || '',
          reviewRequired: false,
          noImage: true,
          scanTelemetry: {
            totalMs,
            deviceProfile,
            lockTimeMs,
            lockCandidateCount,
          },
        });
      } catch (noImageErr) {
        logger.error(`[Scanner OCR] AWB-only save failed for ${cleanAwb}: ${noImageErr.message}`);
        scannerQuality.recordScanEvent({
          pin,
          source: 'mobile_scanner_fast',
          scanMode: scanMode || 'fast_barcode_only',
          deviceProfile,
          awb: cleanAwb,
          lockedAwb: cleanAwb,
          awbSource: 'fast_input',
          success: false,
          reviewRequired: false,
          hadImage: false,
          lockTimeMs,
          totalMs: Date.now() - scanStartedAt,
          qualityIssues,
        });
        socket.emit('scanner:scan-processed', {
          awb: cleanAwb,
          status: 'error',
          error: noImageErr.message || 'Unable to save barcode scan.',
        });
      }
      return;
    }

    try {
      const { extractShipmentFromImage } = require('../services/ocr.service');
      const intelligenceEngine = require('../services/intelligenceEngine.service');
      const correctionLearner = require('../services/correctionLearner.service');
      const shipmentSvc = require('../services/shipment.service');
      const withTimeout = (promise, timeoutMs, stage) => new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Stage timeout (${stage}) after ${timeoutMs}ms`)), timeoutMs);
        promise
          .then((value) => {
            clearTimeout(timer);
            resolve(value);
          })
          .catch((error) => {
            clearTimeout(timer);
            reject(error);
          });
      });

      const ocrStartedAt = Date.now();

      // Build context for OCR prompt + intelligence enrichment
      const [clients, corrections] = await Promise.all([
        intelligenceEngine.getActiveClientsForPrompt(),
        correctionLearner.getTopCorrections(20),
      ]);

      const ocrOptions = {
        knownAwb: cleanAwb,
        clients,
        corrections,
        sessionContext: sessionContext || {},
      };

      // Score helper — prefer image with more extracted fields
      const scoreOcr = (details) => {
        if (!details?.success) return 0;
        return [details.clientName, details.consignee, details.destination, details.pincode, details.orderNo, details.weight, details.amount]
          .filter((value) => (typeof value === 'number' ? value > 0 : String(value || '').trim().length > 0)).length;
      };

      const ocrTotalBudgetMs = Math.max(8000, Number.parseInt(process.env.SCANNER_OCR_BUDGET_MS || '30000', 10) || 30000);
      const focusBudgetMs = Math.max(8000, Math.floor(ocrTotalBudgetMs * 0.6));
      const fullBudgetMs = Math.max(6000, ocrTotalBudgetMs - focusBudgetMs);
      const ocrAttempts = [];

      const runOcrAttempt = async (label, base64Payload, timeoutMs) => {
        if (!base64Payload) return null;
        const startedAt = Date.now();
        try {
          const value = await withTimeout(
            extractShipmentFromImage(base64Payload, 'image/jpeg', ocrOptions),
            timeoutMs,
            label
          );
          const item = {
            label,
            status: 'fulfilled',
            latencyMs: Date.now() - startedAt,
            score: scoreOcr(value),
            awbSource: value?.awbSource || '',
            value,
          };
          ocrAttempts.push(item);
          return item;
        } catch (error) {
          const item = {
            label,
            status: 'rejected',
            latencyMs: Date.now() - startedAt,
            score: 0,
            reason: error.message,
          };
          ocrAttempts.push(item);
          logger.warn(`[Scanner OCR] ${label} attempt failed for AWB ${cleanAwb || 'unknown'}: ${error.message}`);
          return item;
        }
      };

      const focusAttempt = focusImageBase64
        ? await runOcrAttempt('focus', focusImageBase64, focusBudgetMs)
        : null;
      const focusScore = focusAttempt?.status === 'fulfilled' ? focusAttempt.score : 0;
      if (imageBase64 && (!focusAttempt || focusScore < 3)) {
        await runOcrAttempt('full', imageBase64, fullBudgetMs);
      }

      const successful = ocrAttempts
        .filter((attempt) => attempt.status === 'fulfilled' && attempt.value?.success)
        .sort((a, b) => b.score - a.score);

      const bestAttempt = successful[0] || null;
      let ocrHints = null;
      if (bestAttempt?.value) {
        try {
          ocrHints = await withTimeout(
            intelligenceEngine.resolveEntities(bestAttempt.value, { sessionContext: sessionContext || {} }),
            4000,
            'entity-resolution'
          );
        } catch (resolveErr) {
          logger.warn(`[Scanner OCR] Intelligence resolve timed out: ${resolveErr.message}`);
          ocrHints = bestAttempt.value;
        }
      }

      const effectiveAwb = String(cleanAwb || ocrHints?.awb || bestAttempt?.value?.awb || '').trim();
      const totalMs = Date.now() - scanStartedAt;
      const ocrLatencyMs = Date.now() - ocrStartedAt;
      const falseLock = Boolean(cleanAwb && effectiveAwb && String(cleanAwb).toUpperCase() !== String(effectiveAwb).toUpperCase());

      if (!effectiveAwb) {
        scannerQuality.recordScanEvent({
          pin,
          source: 'mobile_scanner_ocr',
          scanMode: scanMode || 'ocr_label',
          deviceProfile,
          success: false,
          reviewRequired: true,
          hadImage: true,
          totalMs,
          ocrLatencyMs,
          lockTimeMs,
          qualityIssues,
        });
        socket.emit('scanner:scan-processed', {
          awb: '',
          status: 'error',
          error: 'Could not read the AWB from the label. Please retake the photo or enter it manually.',
          scanTelemetry: {
            totalMs,
            ocrMs: ocrLatencyMs,
            attempts: ocrAttempts.map((attempt) => ({
              label: attempt.label,
              status: attempt.status,
              latencyMs: attempt.latencyMs,
              score: attempt.score,
              reason: attempt.reason || '',
            })),
            deviceProfile,
            lockTimeMs,
            lockCandidateCount,
          },
        });
        return;
      }

      // Create/update shipment record
      let shipment = null;
      try {
        const result = await shipmentSvc.scanAwbAndUpdate(effectiveAwb, currentSession.userId, null, {
          captureOnly: true,
          source: 'mobile_scanner',
          ocrHints,
          sessionContext: sessionContext || {},
        });
        shipment = result.shipment;
      } catch (svcErr) {
        logger.warn(`[Scanner OCR] shipment upsert failed: ${svcErr.message}`);
      }

      const intel = ocrHints?._intelligence || {};
      const clientCode = ocrHints?.clientCode || shipment?.clientCode || '';
      const clientName = ocrHints?.clientName || shipment?.client?.company || clientCode;
      const resolvedCourier = ocrHints?.courier || shipment?.courier || bestAttempt?.value?.courier || '';
      const awbSource = ocrHints?.awbSource || bestAttempt?.value?.awbSource || (cleanAwb ? 'fast_input' : '');

      scannerQuality.recordScanEvent({
        pin,
        source: 'mobile_scanner_ocr',
        scanMode: scanMode || 'ocr_label',
        deviceProfile,
        courier: resolvedCourier,
        awb: effectiveAwb,
        lockedAwb: cleanAwb,
        awbSource,
        falseLock,
        success: true,
        reviewRequired: true,
        hadImage: true,
        totalMs,
        ocrLatencyMs,
        lockTimeMs,
        qualityIssues,
      });

      socket.emit('scanner:scan-processed', {
        awb: effectiveAwb,
        shipmentId: shipment?.id || null,
        status: 'pending_review',
        clientCode,
        clientName,
        consignee: ocrHints?.consignee || shipment?.consignee || '',
        destination: ocrHints?.destination || shipment?.destination || '',
        pincode: ocrHints?.pincode || shipment?.pincode || '',
        weight: ocrHints?.weight || shipment?.weight || 0,
        amount: ocrHints?.amount || shipment?.amount || 0,
        orderNo: ocrHints?.orderNo || '',
        reviewRequired: true,
        ocrExtracted: ocrHints || null,
        intelligence: intel,
        scanTelemetry: {
          totalMs,
          ocrMs: ocrLatencyMs,
          attempts: ocrAttempts.map((attempt) => ({
            label: attempt.label,
            status: attempt.status,
            latencyMs: attempt.latencyMs,
            score: attempt.score,
            awbSource: attempt.awbSource || '',
            reason: attempt.reason || '',
          })),
          deviceProfile,
          courier: resolvedCourier,
          lockTimeMs,
          lockCandidateCount,
          falseLock,
        },
      });

      logger.info(`[Scanner OCR] AWB ${effectiveAwb} → client=${clientCode} dest=${ocrHints?.destination || 'NA'}`);
    } catch (err) {
      logger.error(`[Scanner OCR] Failed for AWB ${cleanAwb}: ${err.message}`);
      scannerQuality.recordScanEvent({
        pin,
        source: 'mobile_scanner_ocr',
        scanMode: scanMode || 'ocr_label',
        deviceProfile,
        awb: cleanAwb,
        lockedAwb: cleanAwb,
        awbSource: cleanAwb ? 'fast_input' : '',
        success: false,
        reviewRequired: true,
        hadImage: true,
        lockTimeMs,
        totalMs: Date.now() - scanStartedAt,
        qualityIssues,
      });
      socket.emit('scanner:scan-processed', {
        awb: cleanAwb,
        status: 'error',
        error: err.message.includes('OCR_LOCAL_SETUP')
          ? 'Local OCR is not installed. Run "cd backend && npm run ocr:local:setup" and set OCR_PYTHON_BIN if needed.'
          : err.message.includes('OCR_GEMINI_SETUP')
            ? 'Gemini OCR is not configured. Set GEMINI_API_KEY or switch OCR_ENGINE=local.'
            : `OCR failed: ${err.message}`,
      });
    }
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

  socket.on('scanner:end-session', ({ reason } = {}) => {
    const currentSession = scanSessions.get(pin);
    if (!currentSession || currentSession.phoneSocketId !== socket.id) return;

    io.to(currentSession.desktopSocketId).emit('scanner:session-ended', {
      pin,
      reason: reason || 'Mobile ended the session',
      initiatedBy: 'phone',
      totalScans: currentSession.scanCount,
    });

    socket.emit('scanner:session-ended', {
      pin,
      reason: reason || 'Session ended',
      initiatedBy: 'phone',
      totalScans: currentSession.scanCount,
    });

    scanSessions.delete(pin);
    logger.info(`Mobile scanner ended session: PIN ${pin}, ${currentSession.scanCount} scans completed`);
    socket.disconnect(true);
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
