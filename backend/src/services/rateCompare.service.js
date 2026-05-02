/* ============================================================
   rateCompare.service.js — Feature #2: Rate Comparison Engine
   
   Fetches rates from all enabled carriers, returns sorted list.
   Marks cheapest, fastest, best-value options.
   ============================================================ */

'use strict';

const logger      = require('../utils/logger');
const prisma      = require('../config/prisma');

/* ════════════════════════════════════════════════════════════
   CARRIER RATE DEFINITIONS
   Each carrier has: baseCost, fuelPct, gstPct, estimatedDays
   These are our contracted buy rates — not shown to customers.
   ════════════════════════════════════════════════════════════ */
const CARRIER_RATES = {
  Delhivery: {
    modes: {
      standard: { perKg: 42, minWeight: 0.5, minCharge: 38, fuelPct: 25, daysLocal: 1, daysMetro: 2, daysRest: 3 },
      express:  { perKg: 65, minWeight: 0.5, minCharge: 58, fuelPct: 25, daysLocal: 1, daysMetro: 1, daysRest: 2 },
    },
    zones: {
      localNCR:   0.80,
      northIndia: 1.00,
      metro:      1.20,
      restIndia:  1.40,
      northEast:  1.80,
    },
  },
  DTDC: {
    modes: {
      express: { perKg: 48, minWeight: 0.5, minCharge: 40, fuelPct: 27, daysLocal: 1, daysMetro: 2, daysRest: 4 },
      economy: { perKg: 35, minWeight: 0.5, minCharge: 32, fuelPct: 27, daysLocal: 2, daysMetro: 3, daysRest: 5 },
    },
    zones: {
      localNCR:   0.85,
      northIndia: 1.00,
      metro:      1.15,
      restIndia:  1.35,
      northEast:  1.75,
    },
  },
  BlueDart: {
    modes: {
      express: { perKg: 75, minWeight: 0.5, minCharge: 65, fuelPct: 26, daysLocal: 1, daysMetro: 1, daysRest: 2 },
      surface: { perKg: 52, minWeight: 0.5, minCharge: 45, fuelPct: 26, daysLocal: 2, daysMetro: 3, daysRest: 5 },
    },
    zones: {
      localNCR:   0.90,
      northIndia: 1.00,
      metro:      1.10,
      restIndia:  1.30,
      northEast:  1.70,
    },
  },
  Trackon: {
    modes: {
      standard: { perKg: 38, minWeight: 0.5, minCharge: 32, fuelPct: 25, daysLocal: 1, daysMetro: 2, daysRest: 4 },
      economy:  { perKg: 28, minWeight: 0.5, minCharge: 25, fuelPct: 25, daysLocal: 2, daysMetro: 3, daysRest: 6 },
    },
    zones: {
      localNCR:   0.80,
      northIndia: 0.95,
      metro:      1.10,
      restIndia:  1.30,
      northEast:  1.65,
    },
  },
  FedEx: {
    modes: {
      international: { perKg: 420, minWeight: 0.5, minCharge: 380, fuelPct: 24, daysLocal: 2, daysMetro: 2, daysRest: 3 },
      priority:      { perKg: 320, minWeight: 0.5, minCharge: 280, fuelPct: 24, daysLocal: 1, daysMetro: 1, daysRest: 2 },
    },
    zones: {
      zoneA: 1.0, zoneB: 1.2, zoneC: 1.4, zoneD: 1.6, zoneE: 1.8, zoneF: 2.0, zoneG: 1.7, zoneH: 2.2,
    },
  },
  DHL: {
    modes: {
      express: { perKg: 480, minWeight: 0.5, minCharge: 430, fuelPct: 24, daysLocal: 2, daysMetro: 2, daysRest: 3 },
    },
    zones: {
      zoneA: 1.0, zoneB: 1.2, zoneC: 1.4, zoneD: 1.6, zoneE: 1.8, zoneF: 2.0, zoneG: 1.7, zoneH: 2.2,
    },
  },
};

const ZONE_DAYS = {
  localNCR: { key: 'daysLocal' }, northIndia: { key: 'daysLocal' },
  metro: { key: 'daysMetro' },    restIndia: { key: 'daysRest' },
  northEast: { key: 'daysRest' },
};

/* ════════════════════════════════════════════════════════════
   MAIN: Compare rates across all carriers
   ════════════════════════════════════════════════════════════ */
async function compareRates({ weightKg, zone, shipType = 'standard', isInternational = false }) {
  const weight = parseFloat(weightKg);
  if (!weight || weight <= 0) throw new Error('Invalid weight');
  if (!zone) throw new Error('Zone is required');

  // Fetch dynamic rates from database
  const activeVersions = await prisma.rateVersion.findMany({ where: { active: true } });
  const dynamicRates = { ...CARRIER_RATES };
  for (const rv of activeVersions) {
    if (rv.dataJson && rv.dataJson.modes && rv.dataJson.zones) {
      dynamicRates[rv.courier] = rv.dataJson;
    }
  }

  const results = [];
  const gst = 0.18;

  for (const [carrierName, carrierDef] of Object.entries(dynamicRates)) {
    // Skip domestic carriers for international and vice versa
    if (isInternational && !['FedEx', 'DHL'].includes(carrierName)) continue;
    if (!isInternational && ['FedEx', 'DHL'].includes(carrierName)) continue;

    const zoneMult = carrierDef.zones[zone] || 1.0;

    for (const [modeName, mode] of Object.entries(carrierDef.modes)) {
      const chargeableWt = Math.max(weight, mode.minWeight);
      const base         = Math.max(chargeableWt * mode.perKg * zoneMult, mode.minCharge);
      const fuel         = base * (mode.fuelPct / 100);
      const subtotal     = base + fuel;
      const gstAmt       = subtotal * gst;
      const total        = Math.ceil(subtotal + gstAmt);

      const daysKey    = ZONE_DAYS[zone]?.key || 'daysRest';
      const days       = mode[daysKey] || 3;

      const estDate = new Date();
      estDate.setDate(estDate.getDate() + days);

      results.push({
        carrier:      carrierName,
        mode:         modeName,
        displayName:  `${carrierName} ${modeName.charAt(0).toUpperCase() + modeName.slice(1)}`,
        weightKg:     chargeableWt,
        base:         Math.ceil(base),
        fuel:         Math.ceil(fuel),
        gst:          Math.ceil(gstAmt),
        total,
        estimatedDays: days,
        estimatedDelivery: estDate.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' }),
        inr:          `₹${total.toLocaleString('en-IN')}`,
      });
    }
  }

  if (!results.length) return { results: [], cheapest: null, fastest: null };

  // Sort by price
  const sorted = results.sort((a, b) => a.total - b.total);

  // Fetch historical SLA reliability score (RTO % and delayed delivery %)
  const historicalSla = await fetchCourierSLA();

  // Flag cheapest and fastest
  const cheapest = sorted[0];
  const fastest  = [...results].sort((a, b) => a.estimatedDays - b.estimatedDays)[0];
  const bestVal  = _bestValue(sorted, historicalSla);

  sorted.forEach(r => {
    r.isCheapest  = r === cheapest  || (r.carrier === cheapest.carrier  && r.mode === cheapest.mode);
    r.isFastest   = r === fastest   || (r.carrier === fastest.carrier   && r.mode === fastest.mode);
    r.isBestValue = r === bestVal   || (r.carrier === bestVal?.carrier  && r.mode === bestVal?.mode);
  });

  logger.info(`Rate comparison: ${results.length} options for ${weight}kg to ${zone}`);

  return {
    results:    sorted,
    cheapest:   { carrier: cheapest.carrier, mode: cheapest.mode, total: cheapest.total, inr: cheapest.inr },
    fastest:    { carrier: fastest.carrier,  mode: fastest.mode,  days: fastest.estimatedDays, inr: fastest.inr },
    bestValue:  bestVal ? { carrier: bestVal.carrier, mode: bestVal.mode, inr: bestVal.inr } : null,
    params:     { weightKg: weight, zone, shipType },
  };
}

/* Score = cheapness + speed + historical SLA combined */
function _bestValue(sorted, slaStats = {}) {
  const maxPrice = Math.max(...sorted.map(r => r.total));
  const maxDays  = Math.max(...sorted.map(r => r.estimatedDays));
  let best = null, bestScore = -Infinity;
  
  for (const r of sorted) {
    const priceScore = 1 - (r.total / maxPrice);
    const speedScore = 1 - (r.estimatedDays / maxDays);
    
    // Default reliability is 0.8 if no data. Higher is better.
    const reliability = slaStats[r.carrier] || 0.8;
    
    // Formula: 50% Price, 30% Speed, 20% Historical Reliability
    const score = (priceScore * 0.5) + (speedScore * 0.3) + (reliability * 0.2);
    
    if (score > bestScore) { bestScore = score; best = r; }
  }
  return best;
}

/* Helper to fetch SLA metrics smoothly */
async function fetchCourierSLA() {
  try {
    const counts = await prisma.shipment.groupBy({
      by: ['courier', 'status'],
      where: { courier: { not: null } },
      _count: { status: true }
    });
    
    const courierStats = {};
    for (const c of counts) {
      if (!c.courier) continue;
      if (!courierStats[c.courier]) courierStats[c.courier] = { total: 0, bad: 0 };
      
      courierStats[c.courier].total += c._count.status;
      if (['RTO Delivered', 'RTO Initiated', 'Destroyed', 'Lost'].includes(c.status)) {
        courierStats[c.courier].bad += c._count.status;
      }
    }

    const slaMap = {};
    for (const [courier, stats] of Object.entries(courierStats)) {
      if (stats.total < 10) {
        slaMap[courier] = 0.8; // default
      } else {
        const failureRate = stats.bad / stats.total;
        slaMap[courier] = 1.0 - failureRate; // 0.95 SLA means 5% RTO
      }
    }
    return slaMap;
  } catch (err) {
    logger.warn(`Failed to fetch Courier SLA tracking: ${err.message}`);
    return {};
  }
}

/* ── Get rate for a specific carrier+mode (for quoting) ── */
async function getSingleRate({ carrier, mode, weightKg, zone }) {
  const all = await compareRates({ weightKg, zone });
  return all.results.find(r => r.carrier === carrier && r.mode === mode) || null;
}

/* ── Live rates from carrier API (Delhivery has a rate API) ── */
async function fetchLiveRates(carrier, data) {
  try {
    const cfg = { enabled: true }; // carrier enabled check via env vars in carrier.service
    if (!cfg?.enabled) return null;

    if (carrier === 'Delhivery') {
      const { default: fetch } = await import('node-fetch');
      const res = await fetch(
        `${cfg.apiUrl}/api/kinko/v1/invoice/charges/.json?md=S&ss=Delivered&d_pin=${data.pin}&o_pin=${cfg.config?.originPin || '122015'}&cgm=${data.weightGrams}&pt=Pre-paid&cod=0`,
        { headers: { 'Authorization': `Token ${cfg.apiKey}` } }
      );
      if (res.ok) {
        const json = await res.json();
        return { carrier: 'Delhivery', total: json?.total_amount, source: 'live' };
      }
    }
  } catch (err) {
    logger.warn(`Live rate fetch failed for ${carrier}: ${err.message}`);
  }
  return null;
}

module.exports = { compareRates, getSingleRate, fetchLiveRates };
