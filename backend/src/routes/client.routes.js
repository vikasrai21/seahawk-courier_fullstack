const router = require('express').Router();
const ctrl   = require('../controllers/client.controller');
const { protect, adminOnly, staffOnly } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { clientSchema } = require('../validators/shipment.validator');

router.use(protect, staffOnly);
router.get('/',            ctrl.getAll);
router.get('/:code',       ctrl.getOne);
router.get('/:code/stats', ctrl.getStats);
router.post('/',           validate(clientSchema), ctrl.upsert); // STAFF + ADMIN can save
router.delete('/:code',    adminOnly, ctrl.remove);              // ADMIN only
module.exports = router;
