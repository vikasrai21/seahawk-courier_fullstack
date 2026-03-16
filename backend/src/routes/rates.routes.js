// src/routes/rates.routes.js
const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const prisma = require('../config/prisma');
const { stateToZones, courierCost, proposalSell, COURIERS, getRateAge } = require('../utils/rateEngine');
const R = require('../utils/response');

const rnd = n => Math.round(n * 100) / 100;

router.use(protect);

// ── Calculate rates for a destination + weight ────────────────────────────
router.post('/calculate', async (req, res, next) => {
  try {
    const { state, district, city, weight, shipType = 'doc', level = 'all', odaAmt = 0 } = req.body;
    if (!state || !weight) return R.error(res, 'state and weight are required');

    const zone = stateToZones(state, district || '', city || '');
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) return R.error(res, 'Invalid weight');

    const results = COURIERS
      .filter(c => c.types.includes(shipType))
      .filter(c => level === 'all' || c.level === level)
      .map(c => {
        const bk = courierCost(c.id, zone, w, parseFloat(odaAmt) || 0);
        if (!bk) return null;
        const sell = proposalSell(zone, w, shipType, c.level);
        const profit = sell ? rnd(sell.total - bk.total) : null;
        const margin = sell && sell.total > 0 ? rnd((profit / sell.total) * 100) : null;
        return { ...c, breakdown: bk, proposalSell: sell, profit, margin, rateAge: getRateAge(c.id) };
      })
      .filter(Boolean)
      .sort((a, b) => (b.profit || 0) - (a.profit || 0));

    R.ok(res, { zone, results });
  } catch (e) { next(e); }
});

// ── Bulk calculate — array of shipments ─────────────────────────────────
router.post('/calculate/bulk', async (req, res, next) => {
  try {
    const { shipments } = req.body; // [{ state, district, city, weight, shipType, awb, ref }]
    if (!Array.isArray(shipments) || shipments.length > 500) return R.error(res, 'Send 1-500 shipments');

    const results = shipments.map(s => {
      const zone = stateToZones(s.state || '', s.district || '', s.city || '');
      const w = parseFloat(s.weight) || 0;
      const type = s.shipType || 'doc';
      const courierResults = COURIERS
        .filter(c => c.types.includes(type))
        .map(c => {
          const bk = courierCost(c.id, zone, w);
          if (!bk) return null;
          const sell = proposalSell(zone, w, type, c.level);
          const profit = sell ? rnd(sell.total - bk.total) : null;
          const margin = sell && sell.total > 0 ? rnd((profit / sell.total) * 100) : null;
          return { courierId: c.id, label: c.label, level: c.level, cost: bk.total, sell: sell?.total, profit, margin };
        }).filter(Boolean).sort((a, b) => (b.profit || 0) - (a.profit || 0));

      const best = courierResults[0];
      return {
        ref: s.ref || s.awb || '',
        awb: s.awb || '',
        destination: [s.city, s.district, s.state].filter(Boolean).join(', '),
        weight: w, shipType: type,
        seahawkZone: zone.seahawkZone,
        bestCourier: best?.label || '',
        bestCost: best?.cost || 0,
        bestSell: best?.sell || 0,
        bestProfit: best?.profit || 0,
        bestMargin: best?.margin || 0,
        allCouriers: courierResults,
      };
    });

    const summary = {
      total: results.length,
      totalCost: rnd(results.reduce((s, r) => s + r.bestCost, 0)),
      totalSell: rnd(results.reduce((s, r) => s + r.bestSell, 0)),
      totalProfit: rnd(results.reduce((s, r) => s + r.bestProfit, 0)),
      avgMargin: rnd(results.reduce((s, r) => s + r.bestMargin, 0) / results.length),
      belowMargin: results.filter(r => r.bestMargin < 15).length,
      byZone: {},
      byCourier: {},
    };
    results.forEach(r => {
      summary.byZone[r.seahawkZone] = (summary.byZone[r.seahawkZone] || 0) + 1;
      summary.byCourier[r.bestCourier] = (summary.byCourier[r.bestCourier] || 0) + 1;
    });

    R.ok(res, { results, summary });
  } catch (e) { next(e); }
});

// ── Rate health check ─────────────────────────────────────────────────────
router.get('/health', async (req, res, next) => {
  try {
    const partners = ['trackon','primetrack','dtdc','delhivery','gec','ltl','b2b','bluedart'];
    const health = partners.map(p => {
      const { RATE_VALIDITY } = require('../utils/rateEngine');
      const v = RATE_VALIDITY[p];
      const days = Math.floor((Date.now() - new Date(v.date)) / 86400000);
      return { partner: p, effectiveDate: v.date, label: v.label, ageInDays: days, stale: days > 90, critical: days > 180 };
    });
    R.ok(res, health);
  } catch (e) { next(e); }
});

// ── Margin rules CRUD ──────────────────────────────────────────────────────
router.get('/margin-rules', async (req, res, next) => {
  try { R.ok(res, await prisma.marginRule.findMany({ orderBy: { createdAt: 'desc' } })); } catch(e){next(e);}
});
router.post('/margin-rules', adminOnly, async (req, res, next) => {
  try { R.created(res, await prisma.marginRule.create({ data: req.body })); } catch(e){next(e);}
});
router.put('/margin-rules/:id', adminOnly, async (req, res, next) => {
  try { R.ok(res, await prisma.marginRule.update({ where: { id: parseInt(req.params.id) }, data: req.body })); } catch(e){next(e);}
});
router.delete('/margin-rules/:id', adminOnly, async (req, res, next) => {
  try { await prisma.marginRule.delete({ where: { id: parseInt(req.params.id) } }); R.ok(res, null, 'Deleted'); } catch(e){next(e);}
});

// ── Rate version history ──────────────────────────────────────────────────
router.get('/versions', async (req, res, next) => {
  try {
    R.ok(res, await prisma.rateVersion.findMany({
      orderBy: { createdAt: 'desc' },
      include: { uploadedBy: { select: { name: true } } },
    }));
  } catch(e){next(e);}
});
router.post('/versions', adminOnly, async (req, res, next) => {
  try {
    const { courier, effectiveDate, notes, dataJson } = req.body;
    R.created(res, await prisma.rateVersion.create({
      data: { courier, effectiveDate, notes, dataJson: dataJson || {}, uploadedById: req.user.id },
    }));
  } catch(e){next(e);}
});

module.exports = router;
