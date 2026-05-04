"use strict";
// ops-manifest.routes.js — Courier manifest generation + PDF download
// Split from ops.routes.js for maintainability

const router = require("express").Router();
const prisma = require("../config/prisma");
const R = require("../utils/response");
const pdfService = require("../services/pdf.service");
const logger = require("../utils/logger");

// ── GET /api/ops/courier-manifest ─────────────────────────────────────────
router.get("/courier-manifest", async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split("T")[0];

    const shipments = await prisma.shipment.findMany({
      where: { date },
      include: { client: { select: { company: true } } },
      orderBy: [{ courier: "asc" }, { id: "asc" }],
    });

    const byCourier = {};
    for (const s of shipments) {
      const c = s.courier || "Unassigned";
      if (!byCourier[c])
        byCourier[c] = {
          courier: c,
          shipments: [],
          totalPieces: 0,
          totalWeight: 0,
          totalAmount: 0,
        };
      byCourier[c].shipments.push(s);
      byCourier[c].totalPieces++;
      byCourier[c].totalWeight += s.weight || 0;
      byCourier[c].totalAmount += s.amount || 0;
    }

    R.ok(res, {
      date,
      totalShipments: shipments.length,
      totalWeight: shipments.reduce((a, s) => a + (s.weight || 0), 0),
      totalAmount: shipments.reduce((a, s) => a + (s.amount || 0), 0),
      couriers: Object.values(byCourier),
    });
  } catch (err) {
    R.error(res, err.message);
  }
});

// ── GET /api/ops/manifest/download ────────────────────────────────────────
router.get("/manifest/download", async (req, res) => {
  try {
    const { date, courier } = req.query;
    if (!date) return R.error(res, "date is required", 400);

    const where = { date };
    if (courier) where.courier = courier;

    const shipments = await prisma.shipment.findMany({
      where,
      include: { client: { select: { company: true } } },
      orderBy: [{ courier: "asc" }, { awb: "asc" }],
    });

    if (!shipments.length) {
      return R.error(res, "No shipments found for the given criteria", 404);
    }

    const manifestId = `MF-${date.replace(/-/g, "")}-${courier ? courier.substring(0, 3).toUpperCase() : "ALL"}-${Date.now().toString().slice(-4)}`;
    const metadata = { date, courier, manifestId };
    const pdfBuffer = await pdfService.generateManifestPDF(shipments, metadata);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Manifest_${manifestId}.pdf`,
    );
    res.send(pdfBuffer);
  } catch (err) {
    logger.error(`Generate Manifest Error: ${err.message}`);
    R.error(res, "Failed to generate manifest PDF", 500);
  }
});

module.exports = router;
