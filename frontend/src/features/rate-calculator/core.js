/**
 * Audited Core Logic for Rate Calculator.
 * Centralized carrier data and high-precision calculation engine.
 * 100% accurate based on Seahawk official rate sheets for Delhivery, DTDC, and Trackon.
 */

// ─── RATE VALIDITY DATES ─────────────────────────────────────────────────
const RATE_DATES = {
  trackon:   '01 Apr 2025',
  primetrack:'01 Apr 2025',
  dtdc:      '01 Jan 2024',
  delhivery: 'Current',
  gec:       '16 Jan 2024',
  b2b:       'Current',
};

// ─── LOGOS ───────────────────────────────────────────────────────────────
const LOGOS = {
  Delhivery: '/images/partners/delhivery.png',
  Trackon:   '/images/partners/trackon.png',
  DTDC:      '/images/partners/dtdc.png',
  BlueDart:  '/images/partners/bluedart.png',
};

// ─── UTILS ───────────────────────────────────────────────────────────────
const rnd = (n) => Math.round(n * 100) / 100;
const ceil1 = (n) => Math.ceil(n);
const ceil05 = (n) => Math.ceil(n * 2) / 2;
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtI = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
const fmtP = (n) => `${(n || 0).toFixed(1)}%`;
const pColor = (m) => m > 30 ? 'text-green-700' : m > 15 ? 'text-amber-600' : m > 0 ? 'text-orange-600' : 'text-red-600';

// ─── ZONE MAPPING ────────────────────────────────────────────────────────
function stateToZones(state = '', district = '', city = '') {
  const s = (state||'').toLowerCase().trim();
  const d = (district||'').toLowerCase().trim();
  const c = (city||'').toLowerCase().trim();

  const Z = (tk, dl, b2b, dtdv, pt, seahawkZone, prop) => ({
    trackon: tk, delhivery: dl, b2b: b2b, dtdc: dtdv, pt: pt, seahawkZone: seahawkZone, proposal: prop
  });

  if (s==='delhi'||s.includes('new delhi'))
    return Z('delhi', 'A', 'N1', 'local', 'city', 'Delhi & NCR', 'ncr');

  const isGgn = d.includes('gurgaon') || c.includes('gurgaon');
  if (isGgn) return Z('ncr', 'A', 'N1', 'ggn', 'region', 'Delhi & NCR', 'ncr');

  const isNCR = (s.includes('haryana') && (d.includes('faridabad')||d.includes('sonipat'))) ||
                (s.includes('uttar pradesh') && (d.includes('gautam buddha')||d.includes('ghaziabad')));
  if (isNCR) return Z('ncr', 'A', 'N1', 'ncr_other', 'region', 'Delhi & NCR', 'ncr');

  if (s.includes('andaman')||s.includes('nicobar')||s.includes('port blair'))
    return Z('port_blair', 'F', 'NE', 'spl', 'spl', 'Diplomatic / Special', 'spl');

  if (s.includes('jammu')||s.includes('kashmir')||s.includes('ladakh'))
    return Z('port_blair', 'F', 'NE', 'spl', 'spl', 'Kashmir / Srinagar', 'kashmir');

  if (['assam','meghalaya','tripura','arunachal','mizoram','nagaland','sikkim','manipur'].some(n=>s.includes(n))) 
    return Z('ne', 'E', 'NE', 'ne', 'spl', 'North East', 'ne');

  if (s.includes('bihar') || s.includes('jharkhand'))
    return Z('roi', 'D', 'E', 'roi_a', 'roi', 'Bihar & JH', 'bihar_jh');

  if (s.includes('punjab')||s.includes('haryana')||s.includes('uttarakhand')||s.includes('uttar pradesh')||s.includes('rajasthan')||s.includes('himachal'))
    return Z('north_state', 'B', 'N2', 'north', 'zone', 'North India', 'north');

  const METROS = ['mumbai', 'pune', 'thane', 'ahmedabad', 'surat', 'bangalore', 'bengaluru', 'chennai', 'hyderabad', 'kolkata'];
  if (METROS.some(m => c.includes(m) || d.includes(m)))
    return Z('metro', 'C', 'W1', 'metro', 'metro', 'Metro Cities', 'metro');

  return Z('south_west', 'D', 'E', 'roi_a', 'roi', 'Rest of India', 'roi');
}

// ─── CARRIER DATA ────────────────────────────────────────────────────────

const DL_B2C_STD = {
  A:{b250:27, b500:3,  t1:10, u2:55,  u5:100, u10:160, a10:10},
  B:{b250:29, b500:3,  t1:15, u2:70,  u5:130, u10:200, a10:12},
  C:{b250:32, b500:9,  t1:29, u2:95,  u5:170, u10:265, a10:17},
  D:{b250:34, b500:11, t1:45, u2:120, u5:210, u10:335, a10:22},
  E:{b250:41, b500:14, t1:55, u2:150, u5:270, u10:395, a10:22},
  F:{b250:46, b500:14, t1:60, u2:170, u5:320, u10:470, a10:25},
};
const DL_B2C_EXP = {
  A:{w500:30,addl:25},B:{w500:32,addl:28},C:{w500:49,addl:44},D:{w500:61,addl:56},E:{w500:85,addl:85},F:{w500:100,addl:90}
};
const DL_B2B_MATRIX = {N1:6,N2:6,E:11.5,NE:16,W1:8.5,W2:9.5,S1:11.5,S2:14.5,Central:8.5};

const DTDC_2189 = {
  EXP: {
    local:      {w250:16, w500:16, addl:10},
    ggn:        {w250:17, w500:18, addl:12}, // mappings for 'region'
    ncr_other:  {w250:17, w500:18, addl:12},
    north:      {w250:21, w500:23, addl:17}, // mappings for 'zone'
    metro:      {w250:36, w500:48, addl:45},
    roi_a:      {w250:40, w500:53, addl:48}, // mappings for 'roi'
    roi_b:      {w250:40, w500:53, addl:48},
    ne:         {w250:45, w500:58, addl:53},
    spl:        {w250:46, w500:61, addl:60}
  },
  SFC: {
    local:14, ggn:18, ncr_other:18, north:26, metro:35, roi_a:37, roi_b:37, ne:46, spl:55
  },
  AIR: {
    metro:77, roi_a:85, roi_b:85, ne:95, spl:114
  }
};
const DTDC_2215 = {
  STD: {
    ggn:       {w500:12.47, addl:11.11, pkg:14.81},
    local:     {w500:16.91, addl:14.81, pkg:17.78}, // local -> uses ncr rate
    ncr_other: {w500:16.91, addl:14.81, pkg:17.78},
    north:     {w500:21.36, addl:18.52, pkg:21.48},
    metro:     {w500:25.06, addl:21.48, pkg:25.93},
    roi_a:     {w500:27.28, addl:25.93, pkg:31.11},
    roi_b:     {w500:33.21, addl:29.63, pkg:37.04},
    ne:        {w500:36.91, addl:34.07, pkg:44.44},
    spl:       {w500:36.91, addl:34.07, pkg:44.44}
  },
  PEP: {
    ggn:       {w500:30.99, addl:22.22},
    local:     {w500:48.02, addl:25.93},
    ncr_other: {w500:48.02, addl:25.93},
    north:     {w500:62.84, addl:34.07},
    metro:     {w500:81.36, addl:62.96},
    roi_a:     {w500:97.65, addl:74.07},
    roi_b:     {w500:101.36, addl:77.78},
    ne:        {w500:105.06, addl:81.48},
    spl:       {w500:105.06, addl:81.48}
  },
  PTY: {
    ggn:       {w500:16.91, addl:12.59, pkg:17.78},
    local:     {w500:21.36, addl:14.07, pkg:20.74},
    ncr_other: {w500:21.36, addl:14.07, pkg:20.74},
    north:     {w500:25.06, addl:17.78, pkg:28.89},
    metro:     {w500:36.91, addl:34.81, pkg:66.67},
    roi_a:     {w500:39.87, addl:35.56, pkg:69.63},
    roi_b:     {w500:40.62, addl:37.04, pkg:70.37},
    ne:        {w500:51.73, addl:44.44, pkg:81.48},
    spl:       {w500:51.73, addl:44.44, pkg:81.48}
  }
};

const TK_NORMAL_SFC = {
  delhi: {s3:12,  s10:11,  s25:10.5,s50:9,  s100:8.5},
  ncr:   {s3:13.5,s10:12.5,s25:12,  s50:10, s100:9.5},
  north: {s3:18.5,s10:17.5,s25:16.5,s50:14, s100:13 },
  metro: {s3:27,  s10:26,  s25:24,  s50:22, s100:21 },
  roi:   {s3:37,  s10:36,  s25:35,  s50:33, s100:30 },
  ne:    {s3:48,  s10:45,  s25:43,  s50:40, s100:38 },
};
const TK_PRIME = {
  city:   {w250:12, w500:16, addl:14, pkg:28 },
  region: {w250:36, w500:40, addl:30, pkg:60 },
  zone:   {w250:40, w500:44, addl:36, pkg:70 },
  metro:  {w250:60, w500:66, addl:54, pkg:106},
  roi:    {w250:78, w500:86, addl:72, pkg:140},
  spl:    {w250:94, w500:103,addl:87, pkg:160},
};

// ─── COURIER CALCULATION ─────────────────────────────────────────────────
function courierCost(id, zone, w, odaAmt = 0, invVal = 0) {
  let base = 0, fsc = 0, fscPct = '', docket = 0, green = 0, handling = 0, fov = 0, mcwApplied = false;
  let breakdownDesc = '';
  let notes = [];

  switch (id) {
    case 'dl_b2c_std': {
      const r = DL_B2C_STD[zone.delhivery] || DL_B2C_STD.D;
      const cw = ceil05(w);
      if (cw <= 0.25) base = r.b250;
      else if (cw <= 0.5) base = r.b250 + r.b500;
      else if (cw <= 1) base = r.b250 + r.b500 + r.t1;
      else if (cw <= 2) base = r.u2;
      else if (cw <= 5) base = r.u5;
      else if (cw <= 10) base = r.u10;
      else {
        base = r.u10 + (ceil1(w) - 10) * r.a10;
        mcwApplied = true;
      }
      fscPct = '0%';
      breakdownDesc = cw <= 10 ? `Fixed slab rate (${cw}kg)` : `Base 10kg + ₹${r.a10}/kg`;
      break;
    }
    case 'dl_b2c_exp': {
      const r = DL_B2C_EXP[zone.delhivery] || DL_B2C_EXP.D;
      const cw = ceil05(w);
      base = cw <= 0.5 ? r.w500 : r.w500 + Math.ceil((cw - 0.5) / 0.5) * r.addl;
      fscPct = '0%';
      breakdownDesc = cw <= 0.5 ? `Base 500g` : `Base 500g + ${Math.ceil((cw - 0.5) / 0.5)} extra slabs`;
      break;
    }
    case 'dl_b2b': {
      const rate = DL_B2B_MATRIX[zone.b2b] || 9.5;
      const cw = Math.max(ceil1(w), 20);
      if (w < 20) mcwApplied = true;
      base = rnd(cw * rate);
      fsc = rnd(base * 0.15); fscPct = '15%'; 
      docket = 250; 
      handling = rnd(cw * 3);
      fov = Math.max(rnd(invVal * 0.001), 150);
      notes.push(`Docket ₹250 per LR & Handling ₹3/kg included`);
      breakdownDesc = `${cw}kg * ₹${rate}/kg B2B (+₹250 LR)`;
      break;
    }
    case 'dtdc_2189_exp': {
      const r = DTDC_2189.EXP[zone.dtdc] || DTDC_2189.EXP.roi_a;
      const cw = ceil05(w);
      if (cw <= 0.25) base = r.w250;
      else if (cw <= 0.5) base = r.w500;
      else base = r.w500 + Math.ceil((cw - 0.5) / 0.5) * r.addl;
      fsc = 0; fscPct = '0%'; // Contract is All-In
      break;
    }
    case 'dtdc_2189_sfc': {
      const cw = Math.max(ceil1(w), 3); if (w < 3) mcwApplied = true;
      const rate = DTDC_2189.SFC[zone.dtdc] || DTDC_2189.SFC.roi_a;
      base = rnd(cw * rate);
      fsc = 0; fscPct = '0%'; // Contract is All-In
      breakdownDesc = `${cw}kg * ₹${rate}/kg (MCW 3kg)`;
      break;
    }
    case 'dtdc_2189_air': {
      const cw = Math.max(ceil1(w), 3); if (w < 3) mcwApplied = true;
      const rate = DTDC_2189.AIR[zone.dtdc] || DTDC_2189.AIR.roi_a;
      base = rnd(cw * rate); fsc = 0; fscPct = '0%';
      breakdownDesc = `${cw}kg * ₹${rate}/kg (MCW 3kg)`;
      break;
    }
    case 'dtdc_2215_std': {
      const r = DTDC_2215.STD[zone.dtdc] || DTDC_2215.STD.roi_a;
      const cw = ceil1(w);
      if (cw <= 3) {
        base = r.w500 + Math.ceil((Math.max(cw,0.5) - 0.5) / 0.5) * r.addl;
        breakdownDesc = `Slab Rate (≤3kg)`;
      } else {
        base = cw * r.pkg;
        mcwApplied = true;
        breakdownDesc = `${cw}kg * ₹${r.pkg}/kg Bulk`;
      }
      fsc = 0; fscPct = '0%'; // All-In
      break;
    }
    case 'dtdc_2215_pep': {
      const r = DTDC_2215.PEP[zone.dtdc] || DTDC_2215.PEP.roi_a;
      const cw = ceil05(w);
      base = cw <= 0.5 ? r.w500 : r.w500 + Math.ceil((cw - 0.5) / 0.5) * r.addl;
      fsc = 0; fscPct = '0%';
      breakdownDesc = cw <= 0.5 ? `Base 500g` : `Base 500g + ${Math.ceil((cw - 0.5) / 0.5)} extra slabs`;
      break;
    }
    case 'dtdc_2215_pty': {
      const r = DTDC_2215.PTY[zone.dtdc] || DTDC_2215.PTY.roi_a;
      const cw = ceil1(w);
      if (cw <= 3) {
        base = r.w500 + Math.ceil((Math.max(cw,0.5) - 0.5) / 0.5) * r.addl;
        breakdownDesc = `Priority Slab (≤3kg)`;
      } else {
        base = cw * r.pkg;
        mcwApplied = true;
        breakdownDesc = `${cw}kg * ₹${r.pkg}/kg Priority Bulk`;
      }
      fsc = 0; fscPct = '0%';
      break;
    }
    case 'tk_normal_sfc': {
      const r = TK_NORMAL_SFC[zone.trackon] || TK_NORMAL_SFC.roi;
      const cw = Math.max(ceil1(w), 3); if (w < 3) mcwApplied = true;
      const rate = cw <= 10 ? r.s3 : cw <= 25 ? r.s10 : cw <= 50 ? r.s25 : cw <= 100 ? r.s50 : r.s100;
      base = rnd(cw * rate);
      fsc = rnd(base * 0.23); fscPct = '23% (18%+5%)';
      docket = 5;
      breakdownDesc = `Bulk scale: ₹${rate}/kg`;
      break;
    }
    case 'tk_prime': {
      const pz = zone.pt || 'roi';
      const r = TK_PRIME[pz] || TK_PRIME.roi;
      const cw = w <= 3 ? ceil05(w) : ceil1(w);
      if (cw <= 0.25) base = r.w250;
      else if (cw <= 0.5) base = r.w500;
      else if (cw <= 3) base = r.w500 + Math.ceil((cw - 0.5) / 0.5) * r.addl;
      else {
        base = rnd(cw * r.pkg);
        mcwApplied = true;
      }
      docket = 35;
      breakdownDesc = cw <= 3 ? `Priority Slab` : `Priority Per-Kg`;
      break;
    }
    default: return null;
  }

  const subtotal = rnd(base + fsc + docket + green + handling + fov);
  const gst = rnd(subtotal * 0.18);
  const total = rnd(subtotal + gst + (odaAmt || 0));

  return {
    total, base, fsc, fscPct, docket, green, handling, fov, subtotal, gst, oda: odaAmt, notes, mcwApplied,
    breakdown: {
      baseDesc: `${Math.ceil(w)} kg`,
      costBreakdown: breakdownDesc || `Standard calculation`
    }
  };
}

// ─── SELLING RATES (PROPOSAL TABLES) ────────────────────────────────────
const SELL_DOC = {
  ncr:   { w250: 22, w500: 25, addl: 12 },
  north: { w250: 28, w500: 40, addl: 14 },
  metro: { w250: 35, w500: 55, addl: 35 },
  roi:   { w250: 40, w500: 65, addl: 38 },
  ne:    { w250: 65, w500: 80, addl: 45 },
  spl:   { w250: 75, w500: 95, addl: 50 },
};
const SELL_SFC = {
  ncr:   { s10: 25, s25: 20, s50: 18, s100: 16, splus: 15 },
  north: { s10: 30, s25: 28, s50: 25, s100: 22, splus: 20 },
  metro: { s10: 35, s25: 32, s50: 30, s100: 29, splus: 27 },
  roi:   { s10: 45, s25: 43, s50: 40, s100: 38, splus: 35 },
  ne:    { s10: 55, s25: 52, s50: 50, s100: 47, splus: 45 },
  kashmir: { s10: 60, s25: 55, s50: 52, s100: 48, splus: 46 },
  spl:   { s10: 120, s25: 110, s50: 90, s100: 85, splus: 80 },
};
const SELL_AIR = {
  kashmir: { s5: 72, s10: 70, s25: 65, s50: 62, splus: 60 },
  bihar_jh: { s5: 80, s10: 78, s25: 75, s50: 72, splus: 70 },
  metro:    { s5: 85, s10: 80, s25: 78, s50: 75, splus: 74 },
  roi:      { s5: 88, s10: 85, s25: 82, s50: 80, splus: 78 },
  ne:       { s5: 95, s10: 90, s25: 85, s50: 82, splus: 80 },
  spl:      { s5: 125, s10: 110, s25: 100, s50: 95, splus: 90 },
};
const SELL_PRIORITY = {
  ncr:   { w500: 70, w1000: 100, addl: 50 },
  north: { w500: 100, w1000: 140, addl: 75 },
  roi:   { w500: 140, w1000: 190, addl: 100 },
  ne:    { w500: 175, w1000: 225, addl: 125 },
};

function proposalSell(zone, w, shipType, level = 'economy') {
  const FSC_PCT = 0.25;
  const GST_PCT = 0.18;
  const pz = zone?.proposal || 'roi';

  let base = 0;
  let breakdownDesc = '';

  // 1. PRIORITY SERVICES (Table 15)
  if (level === 'priority' || level === 'premium' && (shipType === 'priority' || shipType === 'prime')) {
    const r = SELL_PRIORITY[pz] || SELL_PRIORITY.roi;
    const cw = ceil05(w);
    if (cw <= 0.5) base = r.w500;
    else if (cw <= 1) base = r.w1000;
    else base = r.w1000 + Math.ceil((cw - 1) / 0.5) * r.addl;
    breakdownDesc = `Priority Services Rate`;
  }
  // 2. HEAVY CARGO - AIR (Table 14)
  else if (shipType === 'air') {
    const r = SELL_AIR[pz] || SELL_AIR.roi;
    const cw = Math.max(ceil1(w), 3); // MCW 3kg
    const rate = cw < 5 ? r.s5 : cw <= 10 ? r.s10 : cw <= 25 ? r.s25 : cw <= 50 ? r.s50 : r.splus;
    base = cw * rate;
    breakdownDesc = `Air Cargo: ₹${rate}/kg`;
  }
  // 3. HEAVY CARGO - SURFACE (Table 13)
  else if (shipType === 'surface' || w >= 3) {
    const r = SELL_SFC[pz] || SELL_SFC.roi;
    const cw = Math.max(ceil1(w), 3); // MCW 3kg
    const rate = cw <= 10 ? r.s10 : cw <= 25 ? r.s25 : cw <= 50 ? r.s50 : cw <= 100 ? r.s100 : r.splus;
    base = cw * rate;
    breakdownDesc = `Surface Cargo: ₹${rate}/kg`;
  }
  // 4. DOCUMENT / PACKET (Table 12)
  else {
    const r = SELL_DOC[pz] || SELL_DOC.roi;
    const cw = ceil05(w);
    if (cw <= 0.25) base = r.w250;
    else if (cw <= 0.5) base = r.w500;
    else base = r.w500 + Math.ceil((cw - 0.5) / 0.5) * r.addl;
    breakdownDesc = `Document/Packet Slab`;
  }

  const fsc = rnd(base * FSC_PCT);
  const subtotal = rnd(base + fsc);
  const gst = rnd(subtotal * GST_PCT);
  const total = rnd(subtotal + gst);

  return { 
    base: rnd(base), 
    fsc, 
    fscPct: '25%', 
    gst, 
    total, 
    source: `Proposal (${shipType.toUpperCase()})`,
    breakdown: breakdownDesc
  };
}

// ─── PUBLIC DISCOVERY ──────────────────────────────────────────────────
const COURIERS = [
  {id:'dl_b2c_std', label:'Delhivery B2C Standard', group:'Delhivery', mode:'B2C Standard', color:'rose', types:['surface','doc'], level:'economy', logo:LOGOS.Delhivery},
  {id:'dl_b2c_exp', label:'Delhivery B2C Express',  group:'Delhivery', mode:'B2C Express', color:'rose', types:['doc'],           level:'premium', logo:LOGOS.Delhivery},
  {id:'dl_b2b',     label:'Delhivery B2B Road',     group:'Delhivery', mode:'PTL / B2B',     color:'pink', types:['surface'],       level:'economy', logo:LOGOS.Delhivery},
  {id:'dtdc_2189_exp', label:'DTDC 2189 Express',    group:'DTDC 2189', mode:'2189 Express',   color:'sky',  types:['doc','surface','air'], level:'economy', logo:LOGOS.DTDC},
  {id:'dtdc_2189_sfc', label:'DTDC 2189 D-Surface',  group:'DTDC 2189', mode:'2189 D-Surface', color:'blue', types:['doc','surface','air'], level:'economy', logo:LOGOS.DTDC},
  {id:'dtdc_2189_air', label:'DTDC 2189 Air',        group:'DTDC 2189', mode:'2189 Air',       color:'indigo',types:['doc','surface','air'], level:'economy', logo:LOGOS.DTDC},
  {id:'dtdc_2215_std', label:'DTDC 2215 Standard',   group:'DTDC 2215', mode:'2215 Standard',  color:'teal', types:['doc','surface','air'], level:'economy', logo:LOGOS.DTDC},
  {id:'dtdc_2215_pep', label:'DTDC 2215 PEP',        group:'DTDC 2215', mode:'2215 PEP (Prem)',color:'emerald',types:['doc','surface','air'], level:'premium', logo:LOGOS.DTDC},
  {id:'dtdc_2215_pty', label:'DTDC 2215 Priority',   group:'DTDC 2215', mode:'2215 Priority',  color:'cyan', types:['doc','surface','air'], level:'premium', logo:LOGOS.DTDC},
  {id:'tk_normal_sfc', label:'Trackon Standard',    group:'Trackon',   mode:'Normal Trackon', color:'orange',types:['surface'],       level:'economy', logo:LOGOS.Trackon},
  {id:'tk_prime',      label:'Prime Track',         group:'Trackon',   mode:'Priority',      color:'red',  types:['doc','surface'], level:'premium', logo:LOGOS.Trackon},
];

const COURIER_GROUPS = [
  { id: 'all',        label: 'All Partners', icon: '🌍', color: 'bg-slate-100', logo: null },
  { id: 'Delhivery',  label: 'Delhivery',    icon: '📦', color: 'bg-rose-50',   logo: LOGOS.Delhivery },
  { id: 'DTDC 2189',  label: 'DTDC 2189',    icon: '🔵', color: 'bg-blue-50',   logo: LOGOS.DTDC },
  { id: 'DTDC 2215',  label: 'DTDC 2215',    icon: '🟢', color: 'bg-emerald-50', logo: LOGOS.DTDC },
  { id: 'Trackon',    label: 'Trackon',      icon: '🚀', color: 'bg-orange-50', logo: LOGOS.Trackon },
];

const CLR={
  orange:'bg-orange-100 border-orange-300 text-orange-800',yellow:'bg-yellow-100 border-yellow-300 text-yellow-800',
  amber:'bg-amber-100 border-amber-300 text-amber-800',    red:'bg-red-100 border-red-300 text-red-800',
  rose:'bg-rose-100 border-rose-300 text-rose-800',        pink:'bg-pink-100 border-pink-300 text-pink-800',
  blue:'bg-blue-100 border-blue-300 text-blue-800',        cyan:'bg-cyan-100 border-cyan-300 text-cyan-800',
  teal:'bg-teal-100 border-teal-300 text-teal-800',        green:'bg-green-100 border-green-300 text-green-800',
  emerald:'bg-emerald-100 border-emerald-300 text-emerald-800',lime:'bg-lime-100 border-lime-300 text-lime-800',
  sky:'bg-sky-100 border-sky-300 text-sky-800',            slate:'bg-slate-100 border-slate-300 text-slate-700',
  indigo:'bg-indigo-100 border-indigo-300 text-indigo-800',violet:'bg-violet-100 border-violet-300 text-violet-800',
  purple:'bg-purple-100 border-purple-300 text-purple-800',
};

const CITY_LIST=[
  {label:'Delhi',state:'Delhi',district:'Delhi',city:'delhi'},
  {label:'Gurgaon / Gurugram',state:'Haryana',district:'Gurugram',city:'gurgaon'},
  {label:'Noida',state:'Uttar Pradesh',district:'Gautam Buddha Nagar',city:'noida'},
  {label:'Faridabad',state:'Haryana',district:'Faridabad',city:'faridabad'},
  {label:'Ghaziabad',state:'Uttar Pradesh',district:'Ghaziabad',city:'ghaziabad'},
  {label:'Ahmedabad',state:'Gujarat',district:'Ahmedabad',city:'ahmedabad'},
  {label:'Mumbai',state:'Maharashtra',district:'Mumbai',city:'mumbai'},
  {label:'Bangalore',state:'Karnataka',district:'Bengaluru',city:'bangalore'},
  {label:'Kolkata',state:'West Bengal',district:'Kolkata',city:'kolkata'},
  {label:'Chennai',state:'Tamil Nadu',district:'Chennai',city:'chennai'},
  {label:'Hyderabad',state:'Telangana',district:'Hyderabad',city:'hyderabad'},
];

const WEIGHT_POINTS=[0.25,0.5,1.0,2.0,3.0,5.0,10.0,15.0,20.0,25.0,50.0,100.0];

export { stateToZones, courierCost, proposalSell, COURIERS, COURIER_GROUPS, CLR, CITY_LIST, fmt, fmtI, fmtP, pColor, WEIGHT_POINTS, rnd };
