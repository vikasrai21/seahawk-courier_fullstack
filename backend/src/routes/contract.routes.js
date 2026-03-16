const router = require('express').Router();
const ctrl   = require('../controllers/contract.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { contractSchema } = require('../validators/shipment.validator');

router.use(protect);
router.get('/',                 ctrl.getAll);
router.get('/calculate',        ctrl.calcPrice);
router.get('/client/:code',     ctrl.getByClient);
router.post('/',   validate(contractSchema), ctrl.save);
router.put('/:id', validate(contractSchema), ctrl.save);
router.delete('/:id', adminOnly, ctrl.remove);
module.exports = router;
