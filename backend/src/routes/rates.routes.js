// src/routes/rates.routes.js
const router = require('express').Router();
const { protect, adminOnly, ownerOnly } = require('../middleware/auth.middleware');
const prisma = require('../config/prisma');
const importLedger = require('../services/import-ledger.service');
const { stateToZones, courierCost, proposalSell, COURIERS, getRateAge } = require('../utils/rateEngine');
const R = require('../utils/response');

const SERVICE_CODE_TO_COURIER = {
  AR1: 'dtdc_2189_exp',
  AR2: 'dtdc_2189_exp',
  AC1: 'dtdc_2215_pep',
  AC2: 'dtdc_2215_std',
  AC3: 'dtdc_2215_pty',
  SF1: 'dtdc_2189_sfc',
  SF2: 'dtdc_2189_sfc',
  DA1: 'dtdc_2189_air',
  DA2: 'dtdc_2189_air',
};

const rnd = n => Math.round(n * 100) / 100;

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
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

router.post('/verify', ownerOnly, async (req, res, next) => {
  try {
    const { lines } = req.body;
    if (!Array.isArray(lines) || lines.length === 0) {
      return R.badRequest(res, 'Provide at least one invoice line in { lines: [...] }');
    }

    const results = await Promise.all(lines.map(async (line, index) => {
      const serviceCode = String(line?.serviceCode || line?.service || '').trim().toUpperCase();
      const courierId = line?.courierId || SERVICE_CODE_TO_COURIER[serviceCode];
      if (!courierId) {
        return { index, serviceCode, status: 'error', message: 'Missing or unknown serviceCode / courierId' };
      }

      const weight = Number(line?.weight || line?.kg || 0);
      const state = String(line?.state || line?.destinationState || '').trim();
      const district = String(line?.district || line?.destinationDistrict || '').trim();
      const city = String(line?.city || line?.destinationCity || line?.destination || '').trim();
      const zone = stateToZones(state, district, city);
      const cost = courierCost(courierId, zone, weight, Number(line?.odaAmount || 0));
      if (!cost) {
        return { index, serviceCode, status: 'error', message: 'Unable to compute cost for this entry' };
      }

      const awb = String(line?.awb || '').trim();
      const importMatches = awb ? await importLedger.findByAwb(awb, 10) : [];
      const importMatch = pickBestImportMatch(importMatches, line);
      const shipment = awb
        ? await prisma.shipment.findUnique({
            where: { awb },
            select: { awb: true, amount: true, clientCode: true, courier: true, weight: true, destination: true, date: true },
          })
        : null;
      const billed = line?.amount != null ? Number(line.amount) : null;
      const diff = billed != null && cost.base != null ? Number((billed - cost.base).toFixed(2)) : null;
      const chargedToClient = importMatch
        ? Number(importMatch.amount || 0)
        : shipment
          ? Number(shipment.amount || 0)
          : null;
      const recoveryGap = billed != null && chargedToClient != null
        ? Number((chargedToClient - billed).toFixed(2))
        : null;
      const flags = [];
      if (awb && importMatches.length === 0 && !shipment) flags.push('AWB not found in database');
      if (importMatches.length > 1) flags.push(`Multiple imported rows found (${importMatches.length})`);
      if (importMatch && weight > 0 && Math.abs(Number(importMatch.weight || 0) - weight) > 0.05) flags.push('Weight mismatch vs imported row');
      if (importMatch && city && normalizeText(importMatch.destination) && !normalizeText(importMatch.destination).includes(normalizeText(city))) flags.push('Destination mismatch vs imported row');
      return {
        index,
        awb: awb || null,
        destination: city || state || line?.destination || 'Unknown',
        serviceCode,
        courierId,
        weight,
        billed,
        chargedToClient,
        recoveryGap,
        matchedImportCount: importMatches.length,
        matchedImport: importMatch ? {
          date: importMatch.date,
          clientCode: importMatch.clientCode,
          destination: importMatch.destination,
          weight: Number(importMatch.weight || 0),
          amount: Number(importMatch.amount || 0),
          courier: importMatch.courier || '',
          batchKey: importMatch.batchKey,
        } : null,
        dbShipment: shipment ? {
          date: shipment.date,
          clientCode: shipment.clientCode,
          destination: shipment.destination,
          weight: Number(shipment.weight || 0),
          amount: Number(shipment.amount || 0),
          courier: shipment.courier || '',
        } : null,
        flags,
        expected: {
          base: cost.base,
          subtotal: cost.subtotal,
          total: cost.total,
          fsc: cost.fsc,
          notes: cost.notes || [],
          mcwApplied: cost.mcwApplied,
        },
        difference: diff,
        zone,
        status: 'ok',
      };
    }));

    const total = results.length;
    const errors = results.filter(line => line.status !== 'ok').length;
    const mismatched = results.filter(line => line.status === 'ok' && typeof line.difference === 'number' && Math.abs(line.difference) > 1).length;
    const underRecovered = results.filter(line => line.status === 'ok' && typeof line.recoveryGap === 'number' && line.recoveryGap < 0).length;
    const unmatchedAwbs = results.filter(line => line.status === 'ok' && line.awb && !line.matchedImport && !line.dbShipment).length;
    const flagged = results.filter(line => line.status === 'ok' && Array.isArray(line.flags) && line.flags.length > 0).length;

    R.ok(res, {
      lines: results,
      summary: { total, errors, mismatched, underRecovered, unmatchedAwbs, flagged },
    });
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
