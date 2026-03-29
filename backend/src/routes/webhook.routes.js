'use strict';
const router = require('express').Router();
const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const cache = require('../utils/cache');
// asyncHandler is not needed since try/catch is used directly

function parseWebhookPayload(courier, body) {
  if (courier === 'DELHIVERY') {
    const shipment = body?.Shipment;
    if (!shipment) return null;
    return {
      awb: shipment.Waybill,
      status: shipment.Status?.Status,
      location: shipment.Status?.StatusLocation || '',
      timestamp: shipment.Status?.StatusDateTime || new Date(),
    };
  }

  if (courier === 'DTDC') {
    return {
      awb: body?.awb,
      status: body?.status,
      location: body?.location || '',
      timestamp: body?.timestamp || new Date(),
    };
  }

  return null;
}

async function processWebhook(courier, req, res) {
  logger.info(`[Webhook] Received payload from ${courier}`);
  res.status(200).json({ success: true, message: 'Webhook received' });

  try {
    const parsed = parseWebhookPayload(courier, req.body);
    if (!parsed) return;
    const awb = String(parsed.awb || '').trim().toUpperCase();
    const status = parsed.status;
    const location = parsed.location || '';
    const timestamp = parsed.timestamp || new Date();

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
        timestamp: new Date(timestamp),
        source: 'WEBHOOK',
      }
    });

    // Invalidate short-lived tracking caches for this AWB
    await Promise.all([
      cache.del(`public:track:${awb}`),
      cache.del(`carrier:track:Delhivery:${awb}`),
      cache.del(`carrier:track:DTDC:${awb}`),
      cache.del(`carrier:track:Trackon:${awb}`),
      cache.del(`carrier:track:BlueDart:${awb}`),
      cache.del(`carrier:track:DHL:${awb}`),
    ]);

    logger.info(`[Webhook] Successfully updated AWB ${awb} to ${status}`);
  } catch (err) {
    logger.error(`[Webhook] Error processing payload: ${err.message}`);
  }
}

router.post('/delhivery', (req, res) => processWebhook('DELHIVERY', req, res));
router.post('/dtdc', (req, res) => processWebhook('DTDC', req, res));
router.post('/:courier', (req, res) => processWebhook(req.params.courier?.toUpperCase(), req, res));

module.exports = router;
