// src/routes/rates.routes.js
const router = require('express').Router();
const { protect, adminOnly, ownerOnly } = require('../middleware/auth.middleware');
const prisma = require('../config/prisma');
const auditor = require('../services/auditor.service');
const R = require('../utils/response');
const { validate } = require('../middleware/validate.middleware');
const { autoSuggestSchema, bulkCalculateSchema, verifySchema } = require('../validators/rates.validator');
const { intelligence } = require('../controllers/rates.intelligence');

const SERVICE_CODE_TO_COURIER = {
  AR1: 'dtdc_exp',
  AR2: 'dtdc_exp',
  AC1: 'dtdc_v71',
  AC2: 'dtdc_d71',
  AC3: 'dtdc_p7x',
  SF1: 'dtdc_dsfc',
  SF2: 'dtdc_dsfc',
  DA1: 'dtdc_dair',
  DA2: 'dtdc_dair',
};

const rnd = n => Math.round(n * 100) / 100;

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeServiceCode(value) {
  const text = String(value || '').trim().toUpperCase();
  if (!text) return '';
  const aliases = {
    AIR: 'DA1',
    DAIR: 'DA1',
    'D-AIR': 'DA1',
    SFC: 'SF1',
    SURFACE: 'SF1',
    'D-SURFACE': 'SF1',
    EXP: 'AR1',
    EXPRESS: 'AR1',
    PRI: 'AC3',
    PRIORITY: 'AC3',
    PEP: 'AC1',
    STD: 'AC2',
    STANDARD: 'AC2',
  };
  return aliases[text] || text;
}

async function resolveAuditLocation(line) {
  let state = String(line?.state || line?.destinationState || '').trim();
  let district = String(line?.district || line?.destinationDistrict || '').trim();
  let city = String(line?.city || line?.destinationCity || line?.destination || '').trim();
  const pincode = String(line?.pincode || line?.destinationPincode || '').trim();
  let pinLookup = null;

  if ((!state || !district || !city) && /^\d{6}$/.test(pincode)) {
    try {
      pinLookup = await lookupPincode(pincode);
      const office = pinLookup?.postOffice || {};
      state = state || String(office.State || '').trim();
      district = district || String(office.District || '').trim();
      city = city || String(office.Name || office.Division || '').trim();
    } catch {
      pinLookup = null;
    }
  }

  return { state, district, city, pincode, pinLookup };
}

function pickBestImportMatch(matches, line) {
  if (!matches?.length) return null;
  if (matches.length === 1) return matches[0];

  const city = normalizeText(line?.city || line?.destination);
  const billed = Number(line?.amount || 0);
  const weight = Number(line?.weight || line?.kg || 0);

  const scored = matches.map((match) => {
    let score = 0;
    if (weight > 0) score += Math.max(0, 50 - Math.round(Math.abs(Number(match.weight || 0) - weight) * 100));
    if (city && normalizeText(match.destination).includes(city)) score += 25;
    if (billed > 0) score += Math.max(0, 25 - Math.round(Math.abs(Number(match.amount || 0) - billed)));
    return { match, score };
  });

  scored.sort((a, b) => b.score - a.score || b.match.id - a.match.id);
  return scored[0]?.match || matches[0];
}

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

router.post('/verify', ownerOnly, validate(verifySchema), async (req, res, next) => {
  try {
    const { lines } = req.body;
    if (!Array.isArray(lines) || lines.length === 0) {
      return R.badRequest(res, 'Provide at least one invoice line in { lines: [...] }');
    }

    const results = await Promise.all(lines.map(async (line, index) => {
      const result = await auditor.verifyLineItem(line);
      return { index, ...result };
    }));

    const total = results.length;
    const errors = results.filter(line => line.status !== 'ok').length;
    const mismatched = results.filter(line => line.status === 'ok' && typeof line.difference === 'number' && Math.abs(line.difference) > 1).length;
    const flagged = results.filter(line => line.status === 'ok' && Array.isArray(line.flags) && line.flags.length > 0).length;

    R.ok(res, {
      lines: results,
      summary: { total, errors, mismatched, flagged },
    });
  } catch (e) { next(e); }
});

// ── Lane intelligence for rate calculator ───────────────────────────────
router.get('/intelligence', async (req, res, next) => {
  try {
    await intelligence(req, res);
  } catch (e) { next(e); }
});

// ── Bulk calculate — array of shipments ─────────────────────────────────
router.post('/calculate/bulk', validate(bulkCalculateSchema), async (req, res, next) => {
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

// ── Auto-suggest best couriers for a shipment (used by NewEntryPage) ──────
router.post('/auto-suggest', validate(autoSuggestSchema), async (req, res, next) => {
  try {
    const { pincode, state, district, city, weight, shipType = 'doc', clientCode } = req.body;
    if ((!state && !pincode) || !weight) return R.error(res, 'state/pincode and weight required');

    let resolvedState = state || '';
    let resolvedDistrict = district || '';
    let resolvedCity = city || '';

    // If pincode provided, try to resolve location
    if (pincode && !state) {
      const pinSvc = require('../services/pincode.service');
      try {
        const pinData = await pinSvc.lookup(pincode);
        if (pinData?.postOffice) {
          resolvedState = pinData.postOffice.State || '';
          resolvedDistrict = pinData.postOffice.District || '';
          resolvedCity = pinData.postOffice.Name || '';
        }
      } catch { /* fallthrough */ }
    }

    if (!resolvedState) return R.error(res, 'Could not determine location from pincode');

    const zone = stateToZones(resolvedState, resolvedDistrict, resolvedCity);
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) return R.error(res, 'Invalid weight');

    // Get client contract if available
    let contractSell = null;
    if (clientCode) {
      const today = new Date().toISOString().split('T')[0];
      const contract = await prisma.contract.findFirst({
        where: { clientCode, active: true, validFrom: { lte: today }, OR: [{ validTo: null }, { validTo: { gte: today } }] },
        orderBy: { createdAt: 'desc' },
      });
      if (contract) {
        let base = contract.pricingType === 'PER_KG' ? w * contract.baseRate : contract.baseRate;
        base = Math.max(base, contract.minCharge || 0);
        const fsc = rnd(base * ((contract.fuelSurcharge || 0) / 100));
        const sub = base + fsc;
        const gst = rnd(sub * ((contract.gstPercent || 18) / 100));
        contractSell = { total: rnd(sub + gst), base: rnd(base), fsc, gst, source: `Contract: ${contract.name}` };
      }
    }

    const results = COURIERS
      .filter(c => c.types.includes(shipType))
      .map(c => {
        const bk = courierCost(c.id, zone, w, 0);
        if (!bk) return null;
        const sell = contractSell || proposalSell(zone, w, shipType, c.level);
        const sellTotal = sell?.total || 0;
        const profit = sellTotal ? rnd(sellTotal - bk.total) : null;
        const margin = sellTotal > 0 ? rnd((profit / sellTotal) * 100) : null;
        return {
          courierId: c.id, label: c.label, group: c.group, level: c.level,
          cost: bk.total, sell: sellTotal, profit, margin,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b.profit || 0) - (a.profit || 0))
      .slice(0, 3);

    const best = results[0];
    R.ok(res, {
      zone: zone.seahawkZone,
      location: `${resolvedDistrict}, ${resolvedState}`,
      sellSource: contractSell ? contractSell.source : 'Proposal Rate Card',
      suggestions: results,
      recommended: best ? {
        courier: best.label,
        cost: best.cost,
        sell: best.sell,
        profit: best.profit,
        margin: best.margin,
      } : null,
    });
  } catch (e) { next(e); }
});

module.exports = router;
