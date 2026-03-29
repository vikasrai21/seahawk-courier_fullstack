'use strict';
const router = require('express').Router();
const dl     = require('../services/delhivery.service');
const { authenticate, staffOnly } = require('../middleware/auth.middleware');
const R      = require('../utils/response');

router.use(authenticate, staffOnly);

/* GET /api/delhivery/status — is API key configured? */
router.get('/status', (req, res) => {
  R.ok(res, {
    configured: dl.isConfigured(),
    message: dl.isConfigured()
      ? '✓ Delhivery API ready'
      : 'DELHIVERY_API_KEY not set. See DELHIVERY-API-SETUP.md',
  });
});

/* GET /api/delhivery/track/:awb — live tracking */
router.get('/track/:awb', async (req, res) => {
  try {
    const data = await dl.getTracking(req.params.awb);
    if (!data) return R.error(res, 'Not found or API key not set', 404);
    R.ok(res, data);
  } catch (err) { R.error(res, err.message); }
});

/* POST /api/delhivery/book — create shipment, get AWB */
router.post('/book', async (req, res) => {
  try {
    const result = await dl.createShipment(req.body);
    // Auto-update shipment in DB if shipmentId provided
    if (result.awb && req.body.shipmentId) {
      const prisma = require('../config/prisma');
      await prisma.shipment.update({
        where: { id: parseInt(req.body.shipmentId) },
        data:  { awb: result.awb, courier: 'Delhivery' },
      });
    }
    R.ok(res, result, 201);
  } catch (err) { R.error(res, err.message); }
});

/* GET /api/delhivery/label/:awb — download label PDF */
router.get('/label/:awb', async (req, res) => {
  try {
    const buf = await dl.getLabel(req.params.awb);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="delhivery-${req.params.awb}.pdf"`,
    });
    res.send(buf);
  } catch (err) { R.error(res, err.message); }
});

/* POST /api/delhivery/cancel/:awb */
router.post('/cancel/:awb', async (req, res) => {
  try { R.ok(res, await dl.cancelShipment(req.params.awb)); }
  catch (err) { R.error(res, err.message); }
});

/* GET /api/delhivery/serviceability?pin=122015 */
router.get('/serviceability', async (req, res) => {
  if (!req.query.pin) return R.error(res, 'pin required', 400);
  try { R.ok(res, await dl.checkServiceability(req.query.pin)); }
  catch (err) { R.error(res, err.message); }
});

module.exports = router;
