'use strict';

const logger = require('./logger');
const { TK_EXP, TK_SFC, TK_AIR, TK_PT } = require('../rates/trackon');
const { DL_STD, DL_EXP } = require('../rates/delhivery');
const { DTDC_D71, DTDC_V71, DTDC_P7X, DTDC_EXP, DTDC_DSFC, DTDC_DAIR } = require('../rates/dtdc');
const { B2B_RATE, GEC_RATES, LTL_RATES, BD_EXP, BD_AIR, BD_SFC } = require('../rates/network');
const { COURIERS, RATE_VALIDITY, COURIER_TO_PARTNER, getRateAge } = require('../rates/meta');

const rnd = (n) => Math.round(n * 100) / 100;
const ceil1 = (n) => Math.ceil(n);
const ceil05 = (n) => Math.ceil(n * 2) / 2;

function stateToZones(state = '', district = '', city = '') {
  const s = state.toLowerCase().trim();
  const d = district.toLowerCase().trim();
  const c = city.toLowerCase().trim();

  const Z = (trackon, trackon_sfc, trackon_air, delhivery, b2b, dtdc, bd, bd_air, bd_sfc, gec, ltl, pt, seahawkZone, zoneMatched = true) =>
    ({ trackon, trackon_sfc, trackon_air, delhivery, b2b, dtdc, bd, bd_air, bd_sfc, gec, ltl, pt, seahawkZone, zoneMatched });

  if (s === 'delhi' || s.includes('new delhi')) return Z('delhi', 'delhi', 'roi_air', 'A', 'N1', 'local', 'local', 'metros_air', 'local_sfc', 'north_i', 'n1', 'city', 'Delhi & NCR');

  const isHarNCR = s.includes('haryana') && (d.includes('gurgaon') || d.includes('gurugram') || d.includes('faridabad') || d.includes('sonipat') || d.includes('jhajjar'));
  const isUPNCR = s.includes('uttar pradesh') && (d.includes('gautam buddha') || d.includes('ghaziabad'));
  if (isHarNCR || isUPNCR) return Z('ncr', 'ncr', 'roi_air', 'A', 'N1', 'region', 'ncr', 'metros_air', 'ncr_sfc', 'north_i', 'n1', 'region', 'Delhi & NCR');

  const northEastStates = ['assam', 'meghalaya', 'tripura', 'arunachal', 'mizoram', 'nagaland', 'sikkim', 'manipur'];
  if (northEastStates.some((n) => s.includes(n))) {
    const isGuw = d.includes('kamrup') || c.includes('guwahati');
    const isTri = s.includes('tripura');
    const isMani = s.includes('manipur');
    return Z('ne', 'ne_sfc', 'ne_air', isMani ? 'F' : 'E', 'NE', 'ne', 'roi', 'roi_air', 'roi_sfc', isGuw ? 'ne_i' : isTri ? 'ne_iii' : 'ne_ii', isGuw ? 'ne1' : 'ne2', 'spl', 'North East');
  }

  if (s.includes('andaman')) return Z('port_blair', 'ne_sfc', 'port_blair_air', 'F', 'NE', 'spl', 'roi', 'roi_air', 'roi_sfc', 'ne_ii', 'ne2', 'spl', 'Diplomatic / Port Blair');
  if (s.includes('ladakh')) return Z('ne', 'ne_sfc', 'ne_air', 'F', 'N2', 'spl', 'roi', 'roi_air', 'roi_sfc', 'north_iii', 'n3', 'spl', 'North East');

  if (s.includes('jammu') || s.includes('kashmir')) {
    if (d.includes('srinagar') || c.includes('srinagar')) return Z('metro', 'roi_sfc', 'srinagar_air', 'E', 'N2', 'roi_b', 'srinagar', 'srinagar_air', 'north_sfc', 'north_iii', 'n3', 'roi', 'North East');
    return Z('north_state', 'kashmir_sfc', 'srinagar_air', 'E', 'N2', 'roi_b', 'north', 'srinagar_air', 'north_sfc', 'north_iii', 'n3', 'zone', 'North India');
  }

  if (s.includes('himachal')) return Z('north_state', 'north_state_sfc', 'roi_air', 'E', 'N2', 'zone', 'north', 'metros_air', 'north_sfc', 'north_iii', 'n3', 'zone', 'North India');

  if (s.includes('punjab') || s.includes('haryana') || s.includes('uttarakhand') || s.includes('uttar pradesh') || s.includes('rajasthan')) {
    const majors = ['chandigarh', 'gurgaon', 'gurugram', 'ludhiana', 'lucknow', 'jaipur', 'faridabad', 'noida', 'ghaziabad', 'mohali', 'sahibabad', 'panchkula', 'kundli'];
    const isMajor = majors.some((m) => c.includes(m) || d.includes(m));
    return Z(isMajor ? 'north_cities' : 'north_state', isMajor ? 'north_cities_sfc' : 'north_state_sfc', 'roi_air', 'B', 'N1', isMajor ? 'region' : 'zone', 'north', 'metros_air', 'north_sfc', isMajor ? 'north_i' : 'north_ii', isMajor ? 'n1' : 'n2', isMajor ? 'region' : 'zone', 'North India');
  }

  if (s.includes('bihar') || s.includes('jharkhand')) {
    const isMajor = ['patna', 'ranchi', 'jamshedpur'].some((m) => c.includes(m) || d.includes(m));
    return Z('central_air', isMajor ? 'metro_patna_sfc' : 'rest_bihar_sfc', 'central_mp_air', 'D', 'E', 'roi_a', 'bihar_jh', 'bihar_jh_air', 'metros_sfc', isMajor ? 'east_i' : 'east_ii', isMajor ? 'e1' : 'e2', 'metro', 'Metro Cities');
  }

  if (s.includes('madhya pradesh') || s.includes('chhattisgarh')) {
    const isMajor = ['bhopal', 'indore', 'nagpur', 'raipur'].some((m) => c.includes(m) || d.includes(m));
    return Z('central_sfc', isMajor ? 'north_state_sfc' : 'cg_jh_mp_sfc', 'central_mp_air', 'D', 'Central', 'roi_a', 'metros', 'metros_air', 'metros_sfc', isMajor ? 'central_i' : 'central_ii', isMajor ? 'c1' : 'c2', 'metro', 'Rest of India');
  }

  if (s.includes('odisha') || s.includes('orissa')) {
    const isBBS = d.includes('khurda') || c.includes('bhubaneswar');
    return Z('south_west', 'roi_sfc', 'roi_air', 'D', 'E', 'roi_a', 'roi', 'roi_air', 'roi_sfc', isBBS ? 'east_i' : 'east_ii', isBBS ? 'e1' : 'e2', 'roi', 'Rest of India');
  }

  if (s.includes('west bengal')) {
    if (d.includes('kolkata') || c.includes('kolkata')) return Z('metro', 'metro_sfc', 'metro_air', 'C', 'E', 'metro', 'metros', 'metros_air', 'metros_sfc', 'east_i', 'e1', 'metro', 'Metro Cities');
    return Z('south_west', 'roi_sfc', 'mh_guj_air', 'D', 'E', 'roi_a', 'metros', 'metros_air', 'metros_sfc', 'east_ii', 'e2', 'roi', 'Rest of India');
  }

  if (s.includes('gujarat') || s.includes('dadra') || s.includes('daman') || s.includes('diu')) {
    const isMajor = ['ahmedabad', 'surat', 'vadodara', 'baroda'].some((m) => c.includes(m) || d.includes(m));
    return Z('metro', isMajor ? 'metro_patna_sfc' : 'mh_guj_sfc', 'metro_air', isMajor ? 'C' : 'D', 'W1', isMajor ? 'metro' : 'roi_a', 'metros', 'metros_air', 'metros_sfc', isMajor ? 'west_i' : 'west_ii', isMajor ? 'w1' : 'w2', isMajor ? 'metro' : 'roi', isMajor ? 'Metro Cities' : 'Rest of India');
  }

  if (s.includes('maharashtra') || s.includes('goa')) {
    if (['mumbai', 'pune', 'thane'].some((m) => c.includes(m) || d.includes(m))) return Z('metro', 'metro_patna_sfc', 'metro_air', 'C', 'W2', 'metro', 'metros', 'metros_air', 'metros_sfc', 'west_i', 'w1', 'metro', 'Metro Cities');
    if (s.includes('goa')) return Z('south_west', 'mh_guj_sfc', 'mh_guj_air', 'D', 'W2', 'roi_a', 'roi', 'roi_air', 'roi_sfc', 'south_iii', 'w2', 'roi', 'Rest of India');
    return Z('south_west', 'mh_guj_sfc', 'mh_guj_air', 'D', 'W2', 'roi_a', 'metros', 'metros_air', 'metros_sfc', 'west_ii', 'w2', 'roi', 'Rest of India');
  }

  if (s.includes('andhra') || s.includes('telangana')) {
    if (c.includes('hyderabad') || d.includes('hyderabad')) return Z('metro', 'metro_sfc', 'metro_air', 'C', 'S1', 'metro', 'metros', 'metros_air', 'metros_sfc', 'south_i', 's1', 'metro', 'Metro Cities');
    return Z('south_west', 'roi_sfc', 'roi_air', 'D', 'S1', 'roi_a', 'metros', 'metros_air', 'metros_sfc', 'south_ii', 's2', 'roi', 'Rest of India');
  }

  if (s.includes('karnataka')) {
    if (c.includes('bangalore') || c.includes('bengaluru') || d.includes('bengaluru') || d.includes('bangalore')) return Z('metro', 'metro_sfc', 'metro_air', 'C', 'S1', 'metro', 'metros', 'metros_air', 'metros_sfc', 'south_i', 's1', 'metro', 'Metro Cities');
    return Z('south_west', 'roi_sfc', 'roi_air', 'D', 'S1', 'roi_a', 'roi', 'roi_air', 'roi_sfc', 'south_ii', 's2', 'roi', 'Rest of India');
  }

  if (s.includes('tamil') || s.includes('pondicherry') || s.includes('puducherry')) {
    if (c.includes('chennai') || d.includes('chennai')) return Z('metro', 'metro_sfc', 'metro_air', 'C', 'S1', 'metro', 'metros', 'metros_air', 'metros_sfc', 'south_i', 's1', 'metro', 'Metro Cities');
    return Z('south_west', 'roi_sfc', 'roi_air', 'D', 'S1', 'roi_a', 'roi', 'roi_air', 'roi_sfc', 'south_ii', 's2', 'roi', 'Rest of India');
  }

  if (s.includes('kerala')) return Z('south_west', 'roi_sfc', 'roi_air', 'D', 'S2', 'roi_b', 'roi', 'roi_air', 'roi_sfc', 'south_iii', 's3', 'roi', 'Rest of India');

  logger.warn('[RateEngine] Zone fallback triggered', {
    state, district, city,
    fallback: 'south_west / Rest of India',
    note: 'Check if state name is spelled correctly',
  });
  return Z('south_west', 'roi_sfc', 'roi_air', 'D', 'N1', 'roi_a', 'roi', 'roi_air', 'roi_sfc', 'north_ii', 'n2', 'roi', 'Rest of India', false);
}

function checkZoneConfidence(state, district, city) {
  const zone = stateToZones(state, district, city);
  return { zone, confident: zone.zoneMatched !== false };
}

function ptZone(tkZone) {
  const map = {
    delhi: 'city', ncr: 'region', north_cities: 'region', north_state: 'zone',
    central_air: 'metro', central_sfc: 'metro', metro: 'metro',
    south_west: 'roi', ne: 'spl', port_blair: 'spl',
  };
  return map[tkZone] || 'roi';
}

function courierCost(id, zone, w, odaAmt = 0) {
  let base = 0, fsc = 0, fscPct = '', docket = 0, green = 0, mcwApplied = false;
  const notes = [];

  switch (id) {
    case 'trackon_exp': {
      const r = TK_EXP[zone.trackon] || TK_EXP.south_west;
      const cw = ceil05(w);
      base = cw <= 0.25 ? r.w250 : cw <= 0.5 ? r.w500 : r.w500 + Math.ceil((cw - 0.5) / 0.5) * r.addl;
      fsc = rnd(base * 0.23); fscPct = '23% (FSC18%+Dev5%)'; break;
    }
    case 'trackon_sfc': {
      if (w < 3) return null;
      const r = TK_SFC[zone.trackon_sfc] || TK_SFC.roi_sfc;
      const cw = Math.max(ceil1(w), 3); if (w < cw) mcwApplied = true;
      const rate = cw <= 10 ? r.s3 : cw <= 25 ? r.s10 : cw <= 50 ? r.s25 : cw <= 100 ? r.s50 : r.s100;
      base = rnd(cw * rate); fsc = rnd(base * 0.23); fscPct = '23%';
      if (mcwApplied) notes.push('MCW 3kg applied'); break;
    }
    case 'trackon_air': {
      if (w < 3) return null;
      const r = TK_AIR[zone.trackon_air] || TK_AIR.roi_air;
      const cw = Math.max(ceil1(w), 3); if (w < cw) mcwApplied = true;
      const rate = cw < 5 ? r.lt5 : cw <= 10 ? r.t10 : cw <= 25 ? r.t25 : cw <= 50 ? r.t50 : r.g50;
      base = rnd(cw * rate); fsc = rnd(base * 0.23); fscPct = '23%';
      if (mcwApplied) notes.push('MCW 3kg applied'); break;
    }
    case 'trackon_pt': {
      const r = TK_PT[ptZone(zone.trackon)] || TK_PT.roi;
      const cw = w <= 3 ? ceil05(w) : ceil1(w);
      if (cw <= 0.25) base = r.w250;
      else if (cw <= 0.5) base = r.w500;
      else if (cw <= 3) base = r.w500 + Math.ceil((cw - 0.5) / 0.5) * r.addl;
      else base = rnd(cw * r.pkg);
      docket = 35; fscPct = 'None'; break;
    }
    case 'delhivery_std': {
      const r = DL_STD[zone.delhivery] || DL_STD.D;
      const cw = ceil05(w);
      base = cw <= 0.25 ? r.b250 : cw <= 0.5 ? r.b250 + r.b500 : cw <= 1 ? r.b250 + r.b500 + r.t1 : cw <= 2 ? r.u2 : cw <= 5 ? r.u2 + Math.ceil(cw - 2) * r.a2 : cw <= 10 ? r.u5 + Math.ceil(cw - 5) * r.a5 : r.u10 + Math.ceil(cw - 10) * r.a10;
      fscPct = 'None'; break;
    }
    case 'delhivery_exp': {
      const r = DL_EXP[zone.delhivery] || DL_EXP.D;
      const cw = ceil05(w);
      base = cw <= 0.5 ? r.w500 : r.w500 + Math.ceil((cw - 0.5) / 0.5) * r.addl;
      fscPct = 'None'; break;
    }
    case 'b2b': {
      const rate = B2B_RATE[zone.b2b] || 9.5;
      const cw = Math.max(ceil1(w), 20); if (w < cw) mcwApplied = true;
      const freight = rnd(cw * rate);
      fsc = rnd(freight * 0.15); fscPct = '15%'; docket = 250; green = Math.max(rnd(cw * 0.5), 100); base = freight;
      if (freight + fsc < 350) { const diff = 350 - (freight + fsc); base = rnd(base + diff); notes.push('Min freight ₹350 applied'); }
      if (mcwApplied) notes.push('MCW 20kg applied'); break;
    }
    case 'dtdc_d71': {
      const r = DTDC_D71[zone.dtdc] || DTDC_D71.roi_a || DTDC_D71.roi;
      const cw = ceil05(w);
      if (cw <= 0.5) base = r.w500;
      else if (cw <= 3) base = r.w500 + Math.ceil((cw - 0.5) / 0.5) * r.addl;
      else base = r.w500 + Math.ceil((3 - 0.5) / 0.5) * r.addl + Math.ceil(cw - 3) * r.pkg;
      fsc = rnd(base * 0.35); fscPct = '35%'; break;
    }
    case 'dtdc_v71': {
      const r = DTDC_V71[zone.dtdc] || DTDC_V71.roi_a || DTDC_V71.roi;
      const cw = ceil05(w);
      base = cw <= 0.5 ? r.w500 : r.w500 + Math.ceil((cw - 0.5) / 0.5) * r.addl;
      fsc = rnd(base * 0.35); fscPct = '35%'; break;
    }
    case 'dtdc_p7x': {
      const r = DTDC_P7X[zone.dtdc] || DTDC_P7X.roi_a || DTDC_P7X.roi;
      const cw = ceil05(w);
      if (cw <= 0.5) base = r.w500;
      else if (cw <= 3) base = r.w500 + Math.ceil((cw - 0.5) / 0.5) * r.addl;
      else base = r.w500 + Math.ceil((3 - 0.5) / 0.5) * r.addl + Math.ceil(cw - 3) * r.pkg;
      fsc = rnd(base * 0.35); fscPct = '35%'; break;
    }
    case 'dtdc_exp': {
      const r = DTDC_EXP[zone.dtdc] || DTDC_EXP.roi_a || DTDC_EXP.roi;
      const cw = ceil05(w);
      base = cw <= 0.25 ? r.w250 : cw <= 0.5 ? r.w500 : r.w500 + Math.ceil((cw - 0.5) / 0.5) * r.addl;
      fsc = rnd(base * 0.35); fscPct = '35%'; break;
    }
    case 'dtdc_dsfc': {
      if (w < 3) return null;
      const rate = DTDC_DSFC[zone.dtdc] || DTDC_DSFC.roi_a || DTDC_DSFC.roi;
      const cw = Math.max(ceil1(w), 3); if (w < cw) mcwApplied = true;
      base = rnd(cw * rate); fsc = rnd(base * 0.35); fscPct = '35%';
      if (mcwApplied) notes.push('MCW 3kg applied'); break;
    }
    case 'dtdc_dair': {
      if (w < 3) return null;
      // D-Air only has metro, roi, ne, spl. Fallback properly.
      const mappedZone = (zone.dtdc === 'metro' || zone.dtdc === 'ne' || zone.dtdc === 'spl') ? zone.dtdc : 'roi';
      const rate = DTDC_DAIR[mappedZone];
      const cw = Math.max(ceil1(w), 3); if (w < cw) mcwApplied = true;
      base = rnd(cw * rate); fsc = rnd(base * 0.35); fscPct = '35%';
      if (mcwApplied) notes.push('MCW 3kg applied'); break;
    }
    case 'gec_sfc': {
      if (w < 1) return null;
      const rate = GEC_RATES[zone.gec] || GEC_RATES.north_ii;
      const cw = Math.max(ceil1(w), 50); if (w < cw) mcwApplied = true;
      base = rnd(cw * rate); fsc = rnd(base * 0.20); fscPct = '20%'; docket = 75;
      if (base + fsc < 275) { base = rnd(275 - fsc); notes.push('Min ₹275 applied'); }
      if (mcwApplied) notes.push('MCW 50kg applied'); break;
    }
    case 'ltl_road': {
      if (w < 1) return null;
      const rate = LTL_RATES[zone.ltl] || LTL_RATES.n2;
      const cw = Math.max(ceil1(w), 40); if (w < cw) mcwApplied = true;
      base = rnd(cw * rate); fsc = rnd(base * 0.15); fscPct = '15%'; docket = 100; green = Math.max(rnd(cw * 0.5), 100);
      if (base + fsc < 750) { base = rnd(750 - fsc); notes.push('Min ₹750 applied'); }
      notes.push(`Env. charge ₹${green}`);
      if (mcwApplied) notes.push('MCW 40kg applied'); break;
    }
    case 'bluedart_exp': {
      const r = BD_EXP[zone.bd] || BD_EXP.roi;
      const cw = ceil05(w);
      base = cw <= 0.25 ? r.w250 : cw <= 0.5 ? r.w500 : r.w500 + Math.ceil((cw - 0.5) / 0.5) * r.addl;
      fsc = rnd(base * 0.35); fscPct = '35%'; break;
    }
    case 'bluedart_air': {
      if (w < 3) return null;
      const r = BD_AIR[zone.bd_air] || BD_AIR.roi_air;
      const cw = Math.max(ceil1(w), 3); if (w < cw) mcwApplied = true;
      const rate = cw < 5 ? r.lt5 : cw <= 10 ? r.t10 : cw <= 25 ? r.t25 : cw <= 50 ? r.t50 : r.g50;
      base = rnd(cw * rate); fsc = rnd(base * 0.35); fscPct = '35%';
      if (mcwApplied) notes.push('MCW 3kg applied'); break;
    }
    case 'bluedart_sfc': {
      const isLocal = zone.bd === 'local' || zone.bd === 'ncr';
      const mcw = isLocal ? 3 : 5;
      if (w < mcw) return null;
      const r = BD_SFC[zone.bd_sfc] || BD_SFC.roi_sfc;
      const cw = Math.max(ceil1(w), mcw); if (w < cw) mcwApplied = true;
      const rate = cw < 5 ? r.lt5 : cw <= 10 ? r.t10 : cw <= 25 ? r.t25 : cw <= 50 ? r.t50 : r.g50;
      base = rnd(cw * rate); fsc = rnd(base * 0.35); fscPct = '35%';
      if (mcwApplied) notes.push(`MCW ${mcw}kg applied`); break;
    }
    default: return null;
  }

  const subtotal = rnd(base + fsc + docket + green);
  const gst = rnd(subtotal * 0.18);
  const oda = odaAmt || 0;
  return { base, fsc, fscPct, docket, green, subtotal, gst, oda, total: rnd(subtotal + gst + oda), notes, mcwApplied };
}

const SELL_DOC_ECO = {
  'Delhi & NCR': { w250: 22, w500: 25, addl: 12 },
  'North India': { w250: 28, w500: 40, addl: 14 },
  'Metro Cities': { w250: 35, w500: 55, addl: 35 },
  'Rest of India': { w250: 40, w500: 65, addl: 38 },
  'North East': { w250: 65, w500: 80, addl: 45 },
  'Diplomatic / Port Blair': { w250: 75, w500: 95, addl: 50 },
};
const SELL_DOC_PREM = {
  'Delhi & NCR': { w250: 30, w500: 38, addl: 18 },
  'North India': { w250: 40, w500: 58, addl: 20 },
  'Metro Cities': { w250: 50, w500: 80, addl: 50 },
  'Rest of India': { w250: 58, w500: 95, addl: 55 },
  'North East': { w250: 90, w500: 115, addl: 65 },
  'Diplomatic / Port Blair': { w250: 110, w500: 140, addl: 75 },
};
const SELL_SFC_ECO = {
  'Delhi & NCR': { s3: 22, s10: 20, s25: 18, s50: 16, s100: 15 },
  'North India': { s3: 30, s10: 28, s25: 25, s50: 22, s100: 20 },
  'Metro Cities': { s3: 35, s10: 32, s25: 30, s50: 29, s100: 27 },
  'Rest of India': { s3: 45, s10: 43, s25: 40, s50: 38, s100: 35 },
  'North East': { s3: 55, s10: 52, s25: 50, s50: 47, s100: 45 },
  'Diplomatic / Port Blair': { s3: 120, s10: 110, s25: 90, s50: 85, s100: 80 },
};
const SELL_SFC_PREM = {
  'Delhi & NCR': { s3: 30, s10: 28, s25: 25, s50: 22, s100: 20 },
  'North India': { s3: 42, s10: 40, s25: 36, s50: 32, s100: 28 },
  'Metro Cities': { s3: 50, s10: 46, s25: 42, s50: 40, s100: 36 },
  'Rest of India': { s3: 62, s10: 58, s25: 55, s50: 52, s100: 48 },
  'North East': { s3: 75, s10: 70, s25: 68, s50: 64, s100: 60 },
  'Diplomatic / Port Blair': { s3: 160, s10: 145, s25: 120, s50: 110, s100: 100 },
};
const SELL_AIR = {
  'Srinagar Sector': { lt5: 72, t10: 70, t25: 65, t50: 62, g50: 60 },
  'Bihar & JH': { lt5: 80, t10: 78, t25: 75, t50: 72, g50: 70 },
  'Metro Cities': { lt5: 85, t10: 80, t25: 78, t50: 75, g50: 74 },
  'Rest of India': { lt5: 88, t10: 85, t25: 82, t50: 80, g50: 78 },
  'North East': { lt5: 95, t10: 90, t25: 85, t50: 82, g50: 80 },
  'Port Blair': { lt5: 125, t10: 110, t25: 100, t50: 95, g50: 90 },
};

const AIR_SELL_MAP = {
  delhi: 'Metro Cities', ncr: 'Metro Cities', north_cities: 'Metro Cities',
  north_state: 'Srinagar Sector', metro: 'Metro Cities', central_air: 'Bihar & JH',
  central_sfc: 'Rest of India', south_west: 'Rest of India', ne: 'North East', port_blair: 'Port Blair',
};

function proposalSell(zone, w, shipType, level = 'economy') {
  const FSC = 0.25;
  const GST = 0.18;
  const src = level === 'premium' ? 'Proposal (Premium)' : 'Proposal (Economy)';

  if (shipType === 'doc') {
    const r = (level === 'premium' ? SELL_DOC_PREM : SELL_DOC_ECO)[zone.seahawkZone] || SELL_DOC_ECO['Rest of India'];
    const cw = ceil05(w);
    const b = cw <= 0.25 ? r.w250 : cw <= 0.5 ? r.w500 : r.w500 + Math.ceil((cw - 0.5) / 0.5) * r.addl;
    const fsc = rnd(b * FSC); const sub = b + fsc;
    return { base: rnd(b), fsc, fscPct: '25%', gst: rnd(sub * GST), total: rnd(sub * (1 + GST)), source: src };
  }
  if (shipType === 'surface') {
    if (w < 3) return null;
    const r = (level === 'premium' ? SELL_SFC_PREM : SELL_SFC_ECO)[zone.seahawkZone] || SELL_SFC_ECO['Rest of India'];
    const cw = ceil1(w);
    const rate = cw <= 10 ? r.s3 : cw <= 25 ? r.s10 : cw <= 50 ? r.s25 : cw <= 100 ? r.s50 : r.s100;
    const b = Math.max(cw, 3) * rate; const fsc = rnd(b * FSC); const sub = b + fsc;
    return { base: rnd(b), fsc, fscPct: '25%', gst: rnd(sub * GST), total: rnd(sub * (1 + GST)), source: src };
  }
  if (shipType === 'air') {
    if (w < 3) return null;
    const r = SELL_AIR[AIR_SELL_MAP[zone.trackon] || 'Rest of India'] || SELL_AIR['Rest of India'];
    const cw = ceil1(w);
    const rate = cw < 5 ? r.lt5 : cw <= 10 ? r.t10 : cw <= 25 ? r.t25 : cw <= 50 ? r.t50 : r.g50;
    const b = Math.max(cw, 3) * rate; const fsc = rnd(b * FSC); const sub = b + fsc;
    return { base: rnd(b), fsc, fscPct: '25%', gst: rnd(sub * GST), total: rnd(sub * (1 + GST)), source: 'Proposal (Air)' };
  }
  return null;
}

module.exports = {
  stateToZones,
  courierCost,
  proposalSell,
  COURIERS,
  RATE_VALIDITY,
  COURIER_TO_PARTNER,
  getRateAge,
  checkZoneConfidence,
};
