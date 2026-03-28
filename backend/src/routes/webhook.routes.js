'use strict';
const router = require('express').Router();
const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const { scanAwbAndUpdate } = require('../services/shipment.service');
// asyncHandler is not needed since try/catch is used directly

router.post('/:courier', async (req, res) => {
  const courier = req.params.courier?.toUpperCase();
  logger.info(`[Webhook] Received payload from ${courier}`);

  // Immediate 200 OK to the courier to prevent retries
  res.status(200).json({ success: true, message: 'Webhook received' });

  try {
    let awb, status, location, timestamp;

    if (courier === 'DELHIVERY') {
      // Delhivery specific parsing
      // e.g. req.body = { Shipment: { Waybill: "...", Status: { Status: "...", StatusLocation: "...", StatusDateTime: "..." } } }
      const shipment = req.body?.Shipment;
      if (!shipment) return;
      awb = shipment.Waybill;
      status = shipment.Status?.Status;
      location = shipment.Status?.StatusLocation || '';
      timestamp = shipment.Status?.StatusDateTime || new Date();
    } else if (courier === 'DTDC') {
      // Stub for DTDC
      awb = req.body?.awb;
      status = req.body?.status;
    }

    if (!awb || !status) return;

    const existing = await prisma.shipment.findUnique({ where: { awb } });
    if (!existing) return; // Ignore webhooks for unknown AWBs

    await prisma.shipment.update({ where: { awb }, data: { status } });
    await prisma.trackingEvent.create({
      data: {
        shipmentId: existing.id,
        awb,
        status,
        description: 'Updated via Webhook',
        location: location || '',
        source: 'WEBHOOK',
      }
    });

    logger.info(`[Webhook] Successfully updated AWB ${awb} to ${status}`);
  } catch (err) {
    logger.error(`[Webhook] Error processing payload: ${err.message}`);
  }
});

module.exports = router;
