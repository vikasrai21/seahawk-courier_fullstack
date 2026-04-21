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
// Maps PIN → {
//   desktopSocketId, desktopConnected, desktopDisconnectedAt,
//   phoneSocketId, phoneConnected,
//   userId, userEmail,
//   createdAt, lastActivityAt, scanCount
// }
const scanSessions = new Map();

function readPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const SESSION_IDLE_TTL_MS = readPositiveInt(process.env.SCANNER_SESSION_IDLE_MS, 6 * 60 * 60 * 1000); // 6h idle timeout
const SESSION_RECONNECT_GRACE_MS = readPositiveInt(process.env.SCANNER_SESSION_RECONNECT_GRACE_MS, 20 * 60 * 1000); // 20m reconnect grace

function generatePin() {
  return String(crypto.randomInt(100000, 999999));
}

function touchSession(session) {
  if (!session) return;
  session.lastActivityAt = Date.now();
}

function isSessionIdleExpired(session, now = Date.now()) {
  const lastActivityAt = Number(session?.lastActivityAt || session?.createdAt || 0);
  if (!lastActivityAt) return true;
  return (now - lastActivityAt) > SESSION_IDLE_TTL_MS;
}

function emitSessionEnded(pin, session, reason, initiatedBy = 'system') {
  const payload = {
    pin,
    reason: reason || 'Session ended',
    initiatedBy,
    totalScans: Number(session?.scanCount || 0),
  };

  if (!io) return;

  if (session?.phoneSocketId) {
    io.to(session.phoneSocketId).emit('scanner:session-ended', payload);
  }
  if (session?.desktopSocketId) {
    io.to(session.desktopSocketId).emit('scanner:session-ended', payload);
  }
}

function deleteSession(pin) {
  scanSessions.delete(pin);
}

function endSession(pin, session, reason, initiatedBy = 'system') {
  if (!session) return;
  emitSessionEnded(pin, session, reason, initiatedBy);
  deleteSession(pin);
}

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [pin, session] of scanSessions) {
    const idleExpired = isSessionIdleExpired(session, now);
    const noDesktop = !session.desktopConnected;
    const noPhone = !session.phoneConnected;
    const desktopGoneTooLong = noDesktop
      && noPhone
      && Number(session.desktopDisconnectedAt || 0) > 0
      && (now - Number(session.desktopDisconnectedAt)) > SESSION_RECONNECT_GRACE_MS;

    if (idleExpired || desktopGoneTooLong) {
      const reason = idleExpired
        ? 'Scanner session expired due to inactivity.'
        : 'Scanner session expired after extended disconnection.';
      endSession(pin, session, reason, 'system');
    }
  }
}

// Cleanup every 2 minutes
setInterval(cleanupExpiredSessions, 2 * 60 * 1000);

async function maybeLinkDraftToScan(shipment, ocrHints, clientCode, effectiveAwb) {
  if (!shipment || !ocrHints || !clientCode) return null;
  const draftSvc = require('../services/draftOrder.service');
  try {
    const draft = await draftSvc.autoDiscoverDraft(clientCode, ocrHints);
    if (!draft) return null;
    await draftSvc.linkToShipment(draft.id, shipment.id);
    logger.info(`[Auto-Bind] Linked physical AWB ${effectiveAwb} to Draft Order #${draft.id}`);
    return draft.id;
  } catch (err) {
    logger.warn(`[Auto-Bind] Failed to evaluate draft linking: ${err.message}`);
    return null;
  }
}

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

    if (user.isOwner || ['ADMIN', 'OPS_MANAGER', 'STAFF'].includes(user.role)) {
      socket.join('dashboard:global');
    }

    if (user.clientCode) {
      socket.join(`portal:client:${user.clientCode}`);
    }

    logger.info(`Socket connected: ${user.email}`);

    // ── Scanner Bridge: Desktop events ──────────────────────────────────

    // Desktop requests a new scan session (or resumes existing one for this user)
    socket.on('scanner:create-session', (callback) => {
      cleanupExpiredSessions();

      let existingPin = null;
      let existingSession = null;
      for (const [pin, session] of scanSessions) {
        if (session.userId !== user.id) continue;
        if (!existingSession || Number(session.lastActivityAt || session.createdAt || 0) > Number(existingSession.lastActivityAt || existingSession.createdAt || 0)) {
          existingPin = pin;
          existingSession = session;
        }
      }

      if (existingSession && existingPin) {
        existingSession.desktopSocketId = socket.id;
        existingSession.desktopConnected = true;
        existingSession.desktopDisconnectedAt = null;
        touchSession(existingSession);

        logger.info(`Scanner session resumed: PIN ${existingPin} by ${user.email}`);

        if (existingSession.phoneSocketId) {
          io.to(socket.id).emit('scanner:phone-connected', {
            pin: existingPin,
            resumed: true,
            message: 'Mobile phone is already connected.',
          });
        }

        if (typeof callback === 'function') {
          callback({
            success: true,
            pin: existingPin,
            resumed: true,
            phoneConnected: Boolean(existingSession.phoneConnected && existingSession.phoneSocketId),
            scanCount: Number(existingSession.scanCount || 0),
            expiresIn: SESSION_IDLE_TTL_MS,
          });
        }
        return;
      }

      let pin = generatePin();
      while (scanSessions.has(pin)) {
        pin = generatePin();
      }
      const now = Date.now();
      scanSessions.set(pin, {
        desktopSocketId: socket.id,
        desktopConnected: true,
        desktopDisconnectedAt: null,
        userId: user.id,
        userEmail: user.email,
        createdAt: now,
        lastActivityAt: now,
        phoneSocketId: null,
        phoneConnected: false,
        scanCount: 0,
      });

      logger.info(`Scanner session created: PIN ${pin} by ${user.email}`);

      if (typeof callback === 'function') {
        callback({
          success: true,
          pin,
          resumed: false,
          phoneConnected: false,
          scanCount: 0,
          expiresIn: SESSION_IDLE_TTL_MS,
        });
      }
    });

    socket.on('scanner:resume-session', ({ pin } = {}, callback) => {
      cleanupExpiredSessions();
      const requestedPin = String(pin || '').trim();
      if (!requestedPin) {
        if (typeof callback === 'function') callback({ success: false, message: 'PIN is required to resume a session.' });
        return;
      }

      const session = scanSessions.get(requestedPin);
      if (!session || session.userId !== user.id) {
        if (typeof callback === 'function') callback({ success: false, message: 'Session not found.' });
        return;
      }

      if (isSessionIdleExpired(session)) {
        endSession(requestedPin, session, 'Scanner session expired due to inactivity.', 'system');
        if (typeof callback === 'function') callback({ success: false, message: 'Session expired due to inactivity.' });
        return;
      }

      session.desktopSocketId = socket.id;
      session.desktopConnected = true;
      session.desktopDisconnectedAt = null;
      touchSession(session);

      logger.info(`Scanner session reattached: PIN ${requestedPin} by ${user.email}`);

      if (session.phoneSocketId) {
        io.to(socket.id).emit('scanner:phone-connected', {
          pin: requestedPin,
          resumed: true,
          message: 'Mobile phone is already connected.',
        });
      }

      if (typeof callback === 'function') {
        callback({
          success: true,
          pin: requestedPin,
          resumed: true,
          phoneConnected: Boolean(session.phoneConnected && session.phoneSocketId),
          scanCount: Number(session.scanCount || 0),
          expiresIn: SESSION_IDLE_TTL_MS,
        });
      }
    });

    // Desktop ends the scan session
    socket.on('scanner:end-session', ({ pin: requestedPin, reason } = {}, callback) => {
      const normalizedPin = String(requestedPin || '').trim();
      const pinsToEnd = [];
      for (const [pin, session] of scanSessions) {
        if (session.userId !== user.id) continue;
        if (normalizedPin && pin !== normalizedPin) continue;
        pinsToEnd.push(pin);
      }

      for (const pin of pinsToEnd) {
        const session = scanSessions.get(pin);
        if (!session) continue;
        endSession(pin, session, reason || 'Desktop ended the session', 'desktop');
        logger.info(`Scanner session ended by desktop: PIN ${pin}`);
      }

      if (typeof callback === 'function') {
        callback({ success: pinsToEnd.length > 0, ended: pinsToEnd.length });
      }
    });

    // Desktop processes scan result and sends feedback to phone
    socket.on('scanner:scan-processed', ({ pin, awb, shipmentId, status, clientCode, clientName, consignee, destination, pincode, weight, amount, orderNo, reviewRequired, error }) => {
      const session = scanSessions.get(pin);
      if (!session || session.desktopSocketId !== socket.id) return;
      touchSession(session);
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
      touchSession(session);
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
      touchSession(session);
      io.to(session.phoneSocketId).emit('scanner:intake-preview', { intakeRow });
    });

    // Desktop tells phone: "I'm done processing, you can scan again"
    socket.on('scanner:ready-for-next', ({ pin }) => {
      const session = scanSessions.get(pin);
      if (!session || session.desktopSocketId !== socket.id || !session.phoneSocketId) return;
      touchSession(session);
      io.to(session.phoneSocketId).emit('scanner:ready-for-next', {
        scanCount: session.scanCount,
        timestamp: new Date().toISOString(),
      });
    });

    // Desktop relays correction diffs for the learning system
    socket.on('scanner:learn-corrections', async ({ pin, ocrFields, approvedFields, courier, deviceProfile }) => {
      try {
        const session = pin ? scanSessions.get(pin) : null;
        if (session && session.userId === user.id) {
          touchSession(session);
        }

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
          session.desktopSocketId = null;
          session.desktopConnected = false;
          session.desktopDisconnectedAt = Date.now();
          touchSession(session);

          if (session.phoneSocketId) {
            io.to(session.phoneSocketId).emit('scanner:desktop-disconnected', {
              pin,
              message: 'Desktop disconnected. Keep scanning on mobile; session will resume when desktop reconnects.',
              reconnectGraceMs: SESSION_RECONNECT_GRACE_MS,
            });
          }
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

  if (isSessionIdleExpired(session)) {
    endSession(pin, session, 'This session has expired. Please generate a new code.', 'system');
    socket.emit('scanner:error', { message: 'This session has expired. Please generate a new code.' });
    socket.disconnect(true);
    return;
  }

  // Pair the phone
  const previousPhoneSocketId = session.phoneSocketId;
  if (previousPhoneSocketId && previousPhoneSocketId !== socket.id) {
    io.to(previousPhoneSocketId).emit('scanner:session-ended', {
      pin,
      reason: 'Scanner was reconnected from another device.',
      initiatedBy: 'system',
      totalScans: Number(session.scanCount || 0),
    });
  }
  session.phoneSocketId = socket.id;
  session.phoneConnected = true;
  touchSession(session);

  logger.info(`Mobile scanner paired: PIN ${pin}, desktop user ${session.userEmail}`);

  // Notify desktop that phone connected
  if (session.desktopSocketId) {
    io.to(session.desktopSocketId).emit('scanner:phone-connected', {
      pin,
      message: 'Mobile phone connected! Start scanning barcodes.',
    });
  }

  // Confirm to phone
  socket.emit('scanner:paired', {
    message: 'Connected to desktop! Point your camera at a barcode.',
    userEmail: session.userEmail,
    desktopConnected: Boolean(session.desktopConnected && session.desktopSocketId),
  });

  // Phone sends a scanned barcode — server handles OCR directly (no desktop tab required)
  socket.on('scanner:scan', async ({ awb, imageBase64, focusImageBase64, sessionContext, scanMode }) => {
    const currentSession = scanSessions.get(pin);
    if (!currentSession || currentSession.phoneSocketId !== socket.id) return;
    touchSession(currentSession);

    const scanStartedAt = Date.now();
    const cleanAwb = String(awb || '').trim();
    const deviceProfile = String(sessionContext?.deviceProfile || sessionContext?.hardwareClass || 'phone-camera').trim() || 'phone-camera';
    const lockTimeMs = Number.isFinite(Number(sessionContext?.lockTimeMs)) ? Number(sessionContext.lockTimeMs) : null;
    const lockCandidateCount = Number.isFinite(Number(sessionContext?.lockCandidateCount)) ? Number(sessionContext.lockCandidateCount) : null;
    const qualityIssues = Array.isArray(sessionContext?.captureQuality?.issues)
      ? sessionContext.captureQuality.issues.filter(Boolean).map((issue) => String(issue).toLowerCase()).slice(0, 8)
      : [];

    currentSession.scanCount++;
    touchSession(currentSession);
    logger.info(`Remote scan #${currentSession.scanCount}: AWB ${cleanAwb} via PIN ${pin}`);

    // Also relay to desktop if it's open (for the ScanAWBPage live feed)
    if (currentSession.desktopSocketId) {
      io.to(currentSession.desktopSocketId).emit('scanner:remote-scan', {
        awb: cleanAwb,
        imageBase64: imageBase64 || null,
        focusImageBase64: focusImageBase64 || null,
        scanMode: scanMode || null,
        scanNumber: currentSession.scanCount,
        timestamp: new Date().toISOString(),
        sessionContext: sessionContext || {},
      });
    }

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
        const scannerFlow = require('../services/scannerFlow.service');
        const fastSessionDate = (sessionContext?.sessionDate || '').trim();
        const lookup = await scannerFlow.resolveLookupPrefill(cleanAwb);
        const totalMs = Date.now() - scanStartedAt;

        if (scanMode !== 'fast_barcode_only') {
          if (!lookup.evaluation.readyForNoPhoto) {
            socket.emit('scanner:scan-processed', {
              awb: cleanAwb,
              status: 'photo_required',
              requiresImageCapture: true,
              missingFields: lookup.evaluation.missingForNoPhoto,
              ocrExtracted: lookup.hints || null,
              intelligence: lookup.hints?._intelligence || {},
            });
            return;
          }

          let shipment = null;
          try {
            const result = await shipmentSvc.scanAwbAndUpdate(cleanAwb, currentSession.userId, null, {
              captureOnly: true,
              source: 'mobile_scanner_lookup',
              ocrHints: lookup.hints || null,
              sessionContext: sessionContext || {},
              overrideDate: fastSessionDate || null,
            });
            shipment = result?.shipment || null;
          } catch (svcErr) {
            logger.warn(`[Scanner Lookup] shipment upsert failed: ${svcErr.message}`);
          }

          const clientCode = lookup.hints?.clientCode || shipment?.clientCode || '';
          const linkedDraftId = await maybeLinkDraftToScan(shipment, lookup.hints, clientCode, cleanAwb);
          const resultPayload = scannerFlow.buildScanResultPayload({
            awb: cleanAwb,
            shipment,
            ocrHints: lookup.hints,
            linkedDraftId,
            extra: {
              requiresImageCapture: false,
              lookupDecision: lookup.evaluation,
            },
          });

          scannerQuality.recordScanEvent({
            pin,
            source: 'mobile_scanner_lookup',
            scanMode: scanMode || 'lookup_first',
            deviceProfile,
            courier: resultPayload.courier || '',
            awb: cleanAwb,
            lockedAwb: cleanAwb,
            awbSource: 'fast_input',
            success: true,
            reviewRequired: resultPayload.reviewRequired,
            hadImage: false,
            lockTimeMs,
            totalMs,
            qualityIssues,
          });

          socket.emit('scanner:scan-processed', resultPayload);
          return;
        }

        const prefilledHints = lookup.hints || null;
        const result = await shipmentSvc.scanAwbAndUpdate(cleanAwb, currentSession.userId, null, {
          captureOnly: true,
          source: 'mobile_scanner_fast',
          ocrHints: prefilledHints,
          sessionContext: sessionContext || {},
          overrideDate: fastSessionDate || null,
        });
        const shipment = result?.shipment || null;
        scannerQuality.recordScanEvent({
          pin,
          source: 'mobile_scanner_fast',
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
      const scannerFlow = require('../services/scannerFlow.service');
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

      const lookup = cleanAwb
        ? await scannerFlow.resolveLookupPrefill(cleanAwb)
        : { awb: '', hints: null, evaluation: scannerFlow.evaluateLookupCoverage(null) };

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

      let ocrHints = lookup.hints;
      let effectiveAwb = cleanAwb;
      let bestAttempt = null;
      if (!lookup.evaluation.readyForNoPhoto || !cleanAwb) {
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

        bestAttempt = successful[0] || null;
        let extractedHints = null;
        if (bestAttempt?.value) {
          try {
            extractedHints = await withTimeout(
              intelligenceEngine.resolveEntities(bestAttempt.value, { sessionContext: sessionContext || {} }),
              4000,
              'entity-resolution'
            );
          } catch (resolveErr) {
            logger.warn(`[Scanner OCR] Intelligence resolve timed out: ${resolveErr.message}`);
            extractedHints = bestAttempt.value;
          }
        }

        effectiveAwb = String(cleanAwb || extractedHints?.awb || bestAttempt?.value?.awb || '').trim();
        const effectiveLookup = effectiveAwb && effectiveAwb !== lookup.awb
          ? await scannerFlow.resolveLookupPrefill(effectiveAwb)
          : lookup;
        ocrHints = extractedHints || effectiveLookup.hints;
        if (effectiveLookup.hints && extractedHints) {
          ocrHints = {
            ...effectiveLookup.hints,
            ...extractedHints,
            _intelligence: {
              ...(effectiveLookup.hints?._intelligence || {}),
              ...(extractedHints?._intelligence || {}),
            },
          };
        }
      }

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
      const sessionDate = (sessionContext?.sessionDate || '').trim();
      let shipment = null;
      try {
        const result = await shipmentSvc.scanAwbAndUpdate(effectiveAwb, currentSession.userId, null, {
          captureOnly: true,
          source: 'mobile_scanner',
          ocrHints,
          sessionContext: sessionContext || {},
          overrideDate: sessionDate || null,
        });
        shipment = result.shipment;
      } catch (svcErr) {
        logger.warn(`[Scanner OCR] shipment upsert failed: ${svcErr.message}`);
      }

      const clientCode = ocrHints?.clientCode || shipment?.clientCode || '';
      const linkedDraftId = await maybeLinkDraftToScan(shipment, ocrHints, clientCode, effectiveAwb);
      const resolvedCourier = ocrHints?.courier || shipment?.courier || bestAttempt?.value?.courier || '';
      const awbSource = ocrHints?.awbSource || bestAttempt?.value?.awbSource || (cleanAwb ? 'fast_input' : '');
      const resultPayload = scannerFlow.buildScanResultPayload({
        awb: effectiveAwb,
        shipment,
        ocrHints,
        linkedDraftId,
        extra: {
          requiresImageCapture: false,
          lookupDecision: scannerFlow.evaluateLookupCoverage(ocrHints),
        },
      });

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
        reviewRequired: resultPayload.reviewRequired,
        hadImage: true,
        totalMs,
        ocrLatencyMs,
        lockTimeMs,
        qualityIssues,
      });

      socket.emit('scanner:scan-processed', {
        ...resultPayload,
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
          apiPrefill: Boolean(lookup.apiData),
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
    touchSession(currentSession);

    if (!currentSession.desktopSocketId) {
      if (typeof callback === 'function') {
        callback({
          success: false,
          message: 'Desktop is disconnected. Reopen the desktop scanner to continue approvals.',
        });
      }
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
  socket.on('scanner:heartbeat', (_payload = {}, callback) => {
    const currentSession = scanSessions.get(pin);
    if (!currentSession || currentSession.phoneSocketId !== socket.id) {
      if (typeof callback === 'function') {
        callback({ success: false, message: 'Scanner session is no longer active.' });
      }
      return;
    }

    touchSession(currentSession);

    if (currentSession.desktopSocketId) {
      io.to(currentSession.desktopSocketId).emit('scanner:phone-heartbeat', {
        scanCount: currentSession.scanCount,
      });
    }

    if (typeof callback === 'function') {
      callback({
        success: true,
        desktopConnected: Boolean(currentSession.desktopSocketId),
        scanCount: Number(currentSession.scanCount || 0),
      });
    }
  });

  socket.on('scanner:end-session', ({ reason } = {}) => {
    const currentSession = scanSessions.get(pin);
    if (!currentSession || currentSession.phoneSocketId !== socket.id) return;

    endSession(pin, currentSession, reason || 'Mobile ended the session', 'phone');
    logger.info(`Mobile scanner ended session: PIN ${pin}, ${currentSession.scanCount} scans completed`);
    socket.disconnect(true);
  });

  // Phone disconnects
  socket.on('disconnect', () => {
    const currentSession = scanSessions.get(pin);
    if (currentSession && currentSession.phoneSocketId === socket.id) {
      currentSession.phoneConnected = false;
      currentSession.phoneSocketId = null;
      touchSession(currentSession);

      if (currentSession.desktopSocketId) {
        io.to(currentSession.desktopSocketId).emit('scanner:phone-disconnected', {
          pin,
          message: 'Mobile phone disconnected. Scan the QR code again to reconnect.',
          totalScans: currentSession.scanCount,
        });
      }

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
