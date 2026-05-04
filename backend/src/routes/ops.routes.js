"use strict";
// ops.routes.js — Operations endpoints (orchestrator)
// Sub-routers: ops-agent, ops-manifest, ops-analytics
// Core: bulk status update, pending actions, scanner quality

const router = require("express").Router();
const prisma = require("../config/prisma");
const R = require("../utils/response");
const {
  protect,
} = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const stateMachine = require("../services/stateMachine");
const walletSvc = require("../services/wallet.service");
const correctionLearner = require("../services/correctionLearner.service");
const scannerQuality = require("../services/scannerQuality.service");
const { auditLog } = require("../utils/audit");
const { bulkStatusSchema } = require("../validators/ops.validator");

router.use(protect);

// ── Mount sub-routers ─────────────────────────────────────────────────────
router.use(require("./ops-agent.routes"));
// ops-agent handles its own ownerOnly / allowOpsAssistant guards

function staffOrOwner(req, res, next) {
  if (!req.user) return R.unauthorized(res);
  if (
    req.user.isOwner ||
    ["ADMIN", "OPS_MANAGER", "STAFF"].includes(req.user.role)
  )
    return next();
  return R.forbidden(res, "Access denied.");
}

function allowOpsAssistant(req, res, next) {
  if (!req.user) return R.unauthorized(res);
  if (req.user.isOwner || ["ADMIN", "OPS_MANAGER"].includes(req.user.role))
    return next();
  return R.forbidden(
    res,
    "Access denied. Required: ADMIN, OPS_MANAGER, or owner access",
  );
}

router.use(staffOrOwner);

// Mount manifest + analytics sub-routers (staff-protected)
router.use(require("./ops-manifest.routes"));
router.use(require("./ops-analytics.routes"));

// ── GET /api/ops/scanner-quality ────────────────────────────────────────────
router.get("/scanner-quality", allowOpsAssistant, async (req, res) => {
  try {
    const windowMinutes = Math.max(
      5,
      parseInt(req.query.windowMinutes, 10) || 240,
    );
    const [qualitySnapshot, correctionMetrics] = await Promise.all([
      Promise.resolve(
        scannerQuality.getScannerQualitySnapshot({ windowMinutes }),
      ),
      correctionLearner.getCorrectionMetrics(),
    ]);
    R.ok(res, {
      ...qualitySnapshot,
      persistedCorrections: correctionMetrics,
    });
  } catch (err) {
    R.error(res, err.message);
  }
});

// ── POST /api/ops/bulk-status ─────────────────────────────────────────────
router.post("/bulk-status", validate(bulkStatusSchema), async (req, res) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || !ids.length)
    return R.error(res, "ids array required", 400);
  if (!status) return R.error(res, "status required", 400);

  let updated = 0,
    failed = 0;
  const errors = [];

  for (const id of ids) {
    try {
      const shipment = await prisma.shipment.findUnique({
        where: { id: parseInt(id) },
      });
      if (!shipment) {
        failed++;
        continue;
      }
      const canonicalStatus = stateMachine.normalizeStatus(status);

      try {
        stateMachine.assertValidTransition(shipment.status, canonicalStatus);
      } catch (err) {
        err.status = 400;
        throw err;
      }

      if (stateMachine.normalizeStatus(shipment.status) === canonicalStatus) {
        updated++;
        continue;
      }

      await prisma.shipment.update({
        where: { id: parseInt(id) },
        data: { status: canonicalStatus, updatedById: req.user?.id },
      });

      await prisma.trackingEvent
        .create({
          data: {
            shipmentId: parseInt(id),
            awb: shipment.awb,
            status: canonicalStatus,
            description: `Bulk status update to ${canonicalStatus}`,
            source: "MANUAL",
          },
        })
        .catch(() => {});

      if (stateMachine.shouldRefund(canonicalStatus) && shipment.amount > 0) {
        await walletSvc.creditShipmentRefund({
          clientCode: shipment.clientCode,
          awb: shipment.awb,
          amount: shipment.amount,
          reason: canonicalStatus,
        });
      }

      updated++;
    } catch (err) {
      failed++;
      errors.push({ id, error: err.message });
    }
  }

  await auditLog({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: "BULK_STATUS_UPDATE",
    entity: "SHIPMENT",
    newValue: { ids, status, updated, failed },
    ip: req.ip,
  }).catch(() => {});

  R.ok(
    res,
    { updated, failed, errors: errors.slice(0, 10) },
    `${updated} shipments updated to ${status}${failed ? `, ${failed} failed` : ""}`,
  );
});

// ── GET /api/ops/pending-actions ──────────────────────────────────────────
router.get("/pending-actions", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
      .toISOString()
      .split("T")[0];

    const [
      pendingNDRs,
      draftInvoices,
      todayPickups,
      rtoShipments,
      overdueShipments,
    ] = await Promise.all([
      prisma.nDREvent.count({ where: { action: "PENDING" } }),
      prisma.invoice.count({
        where: {
          status: "DRAFT",
          createdAt: { lt: new Date(Date.now() - 3 * 86400000) },
        },
      }),
      prisma.pickupRequest.count({
        where: { scheduledDate: today, status: "PENDING" },
      }),
      prisma.shipment.count({
        where: {
          status: "RTO",
          updatedAt: { lt: new Date(Date.now() - 3 * 86400000) },
        },
      }),
      prisma.shipment.count({
        where: { status: "InTransit", date: { lte: sevenDaysAgo } },
      }),
    ]);

    R.ok(res, {
      pendingNDRs,
      draftInvoices,
      todayPickups,
      rtoShipments,
      overdueShipments,
      total:
        pendingNDRs +
        draftInvoices +
        todayPickups +
        rtoShipments +
        overdueShipments,
    });
  } catch (err) {
    R.error(res, err.message);
  }
});

module.exports = router;
