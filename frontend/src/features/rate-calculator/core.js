/**
 * Verified rate-calculator core.
 * Golden rule: if a charge is not explicitly written in the shared carrier file,
 * it is not applied here.
 */

const LOGOS = {
  Delhivery: '/images/partners/delhivery.png',
  Trackon: '/images/partners/trackon.png',
  DTDC: '/images/partners/dtdc.png',
};

const rnd = (n) => Math.round(Number(n || 0) * 100) / 100;
const ceil1 = (n) => Math.ceil(Number(n || 0));
const ceil05 = (n) => Math.ceil(Number(n || 0) * 2) / 2;
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtI = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
const fmtP = (n) => `${(n || 0).toFixed(1)}%`;
const pColor = (m) => m > 30 ? 'text-green-700' : m > 15 ? 'text-amber-600' : m > 0 ? 'text-orange-600' : 'text-red-600';

const METRO_CITIES = ['mumbai', 'pune', 'thane', 'ahmedabad', 'surat', 'bangalore', 'bengaluru', 'chennai', 'hyderabad', 'kolkata'];
const TRACKON_CITY_BELT = [
  'agra', 'alwar', 'allahabad', 'prayagraj', 'aligarh', 'bhiwadi', 'chandigarh',
  'dehradun', 'haridwar', 'jaipur', 'kanpur', 'lucknow', 'mathura', 'moradabad',
  'meerut', 'muzaffarnagar', 'roorkee', 'rudrapur', 'saharanpur', 'varanasi',
  'panipat', 'sonipat', 'rohtak', 'jalandhar', 'ludhiana', 'ambala',
];

function includesAny(value, patterns) {
  return patterns.some((pattern) => value.includes(pattern));
}

function stateToZones(state = '', district = '', city = '') {
  const s = String(state || '').toLowerCase().trim();
  const d = String(district || '').toLowerCase().trim();
  const c = String(city || '').toLowerCase().trim();

  const zone = {
    trackon: 'roi',
    delhivery: 'D',
    delhiveryB2B: 'Central',
    dtdc: 'roi_a',
    pt: 'roi',
    seahawkZone: 'Rest of India',
    proposal: 'roi',
  };

  if (s === 'delhi' || s.includes('new delhi')) {
    return {
      ...zone,
      trackon: 'delhi',
      delhivery: 'A',
      delhiveryB2B: 'N1',
      dtdc: 'local',
      pt: 'city',
      seahawkZone: 'Delhi & NCR',
      proposal: 'ncr',
    };
  }

  const isGurgaon = d.includes('gurgaon') || d.includes('gurugram') || c.includes('gurgaon') || c.includes('gurugram');
  if (isGurgaon) {
    return {
      ...zone,
      trackon: 'ncr',
      delhivery: 'A',
      delhiveryB2B: 'N1',
      dtdc: 'ggn',
      pt: 'region',
      seahawkZone: 'Delhi & NCR',
      proposal: 'ncr',
    };
  }

  const isNcr = (
    (s.includes('haryana') && includesAny(d, ['faridabad', 'sonipat'])) ||
    (s.includes('uttar pradesh') && includesAny(d, ['gautam buddha', 'ghaziabad'])) ||
    includesAny(c, ['noida', 'ghaziabad', 'faridabad', 'sonipat'])
  );
  if (isNcr) {
    return {
      ...zone,
      trackon: 'ncr',
      delhivery: 'B',
      delhiveryB2B: 'N1',
      dtdc: 'ncr_other',
      pt: 'region',
      seahawkZone: 'Delhi & NCR',
      proposal: 'ncr',
    };
  }

  if (s.includes('andaman') || s.includes('nicobar') || s.includes('port blair')) {
    return {
      ...zone,
      trackon: 'port_blair',
      delhivery: 'F',
      dtdc: 'spl',
      pt: 'spl',
      seahawkZone: 'Diplomatic / Special',
      proposal: 'spl',
    };
  }

  if (s.includes('ladakh') || s.includes('kashmir') || includesAny(c, ['srinagar'])) {
    return {
      ...zone,
      trackon: 'kashmir',
      delhivery: 'F',
      delhiveryB2B: 'N2',
      dtdc: 'spl',
      pt: 'spl',
      seahawkZone: 'Kashmir / Srinagar',
      proposal: 'kashmir',
    };
  }

  if (s.includes('himachal')) {
    return {
      ...zone,
      trackon: 'north_state',
      delhivery: 'E',
      delhiveryB2B: 'N2',
      dtdc: 'north',
      pt: 'zone',
      seahawkZone: 'North India',
      proposal: 'north',
    };
  }

  if (s.includes('manipur')) {
    return {
      ...zone,
      trackon: 'north_east',
      delhivery: 'F',
      delhiveryB2B: 'NE',
      dtdc: 'ne',
      pt: 'spl',
      seahawkZone: 'North East',
      proposal: 'ne',
    };
  }

  if (includesAny(s, ['assam', 'meghalaya', 'tripura', 'arunachal', 'mizoram', 'nagaland', 'sikkim'])) {
    return {
      ...zone,
      trackon: 'north_east',
      delhivery: 'E',
      delhiveryB2B: 'NE',
      dtdc: 'ne',
      pt: 'spl',
      seahawkZone: 'North East',
      proposal: 'ne',
    };
  }

  if (s.includes('bihar') || s.includes('jharkhand')) {
    return {
      ...zone,
      trackon: 'east_bihar',
      delhivery: 'D',
      delhiveryB2B: 'E',
      dtdc: 'roi_a',
      pt: 'roi',
      seahawkZone: 'Bihar & JH',
      proposal: 'bihar_jh',
    };
  }

  if (s.includes('odisha') || s.includes('west bengal')) {
    return {
      ...zone,
      trackon: 'east_south',
      delhivery: METRO_CITIES.some((m) => c.includes(m) || d.includes(m)) ? 'C' : 'D',
      delhiveryB2B: 'E',
      dtdc: 'roi_a',
      pt: 'roi',
      seahawkZone: 'Rest of India',
      proposal: METRO_CITIES.some((m) => c.includes(m) || d.includes(m)) ? 'metro' : 'roi',
    };
  }

  if (s.includes('gujarat') || s.includes('daman') || s.includes('dadra')) {
    return {
      ...zone,
      trackon: METRO_CITIES.some((m) => c.includes(m) || d.includes(m)) ? 'metro' : 'west_south',
      delhivery: METRO_CITIES.some((m) => c.includes(m) || d.includes(m)) ? 'C' : 'D',
      delhiveryB2B: 'W1',
      dtdc: METRO_CITIES.some((m) => c.includes(m) || d.includes(m)) ? 'metro' : 'roi_a',
      pt: METRO_CITIES.some((m) => c.includes(m) || d.includes(m)) ? 'metro' : 'roi',
      seahawkZone: METRO_CITIES.some((m) => c.includes(m) || d.includes(m)) ? 'Metro Cities' : 'Rest of India',
      proposal: METRO_CITIES.some((m) => c.includes(m) || d.includes(m)) ? 'metro' : 'roi',
    };
  }

  if (s.includes('maharashtra') || s.includes('goa')) {
    return {
      ...zone,
      trackon: METRO_CITIES.some((m) => c.includes(m) || d.includes(m)) ? 'metro' : 'west_south',
      delhivery: METRO_CITIES.some((m) => c.includes(m) || d.includes(m)) ? 'C' : 'D',
      delhiveryB2B: 'W2',
      dtdc: METRO_CITIES.some((m) => c.includes(m) || d.includes(m)) ? 'metro' : 'roi_a',
      pt: METRO_CITIES.some((m) => c.includes(m) || d.includes(m)) ? 'metro' : 'roi',
      seahawkZone: METRO_CITIES.some((m) => c.includes(m) || d.includes(m)) ? 'Metro Cities' : 'Rest of India',
      proposal: METRO_CITIES.some((m) => c.includes(m) || d.includes(m)) ? 'metro' : 'roi',
    };
  }

  if (s.includes('chhattisgarh') || s.includes('madhya pradesh')) {
    return {
      ...zone,
      trackon: 'central_states',
      delhivery: 'D',
      delhiveryB2B: 'Central',
      dtdc: 'roi_a',
      pt: 'roi',
      seahawkZone: 'Rest of India',
      proposal: 'roi',
    };
  }

  if (includesAny(s, ['andhra', 'telangana', 'karnataka', 'tamil nadu', 'puducherry'])) {
    return {
      ...zone,
      trackon: METRO_CITIES.some((m) => c.includes(m) || d.includes(m)) ? 'metro' : 'west_south',
      delhivery: METRO_CITIES.some((m) => c.includes(m) || d.includes(m)) ? 'C' : 'D',
      delhiveryB2B: 'S1',
      dtdc: METRO_CITIES.some((m) => c.includes(m) || d.includes(m)) ? 'metro' : 'roi_a',
      pt: METRO_CITIES.some((m) => c.includes(m) || d.includes(m)) ? 'metro' : 'roi',
      seahawkZone: METRO_CITIES.some((m) => c.includes(m) || d.includes(m)) ? 'Metro Cities' : 'Rest of India',
      proposal: METRO_CITIES.some((m) => c.includes(m) || d.includes(m)) ? 'metro' : 'roi',
    };
  }

  if (s.includes('kerala')) {
    return {
      ...zone,
      trackon: 'west_south',
      delhivery: 'D',
      delhiveryB2B: 'S2',
      dtdc: 'roi_a',
      pt: 'roi',
      seahawkZone: 'Rest of India',
      proposal: 'roi',
    };
  }

  if (includesAny(c, TRACKON_CITY_BELT) || includesAny(d, TRACKON_CITY_BELT)) {
    return {
      ...zone,
      trackon: 'north_city',
      delhivery: 'B',
      delhiveryB2B: 'N2',
      dtdc: 'north',
      pt: 'zone',
      seahawkZone: 'North India',
      proposal: 'north',
    };
  }

  if (includesAny(s, ['uttar pradesh', 'uttarakhand', 'rajasthan', 'haryana', 'punjab'])) {
    return {
      ...zone,
      trackon: 'north_state',
      delhivery: 'B',
      delhiveryB2B: 'N2',
      dtdc: 'north',
      pt: 'zone',
      seahawkZone: 'North India',
      proposal: 'north',
    };
  }

  if (METRO_CITIES.some((m) => c.includes(m) || d.includes(m))) {
    return {
      ...zone,
      trackon: 'metro',
      delhivery: 'C',
      dtdc: 'metro',
      pt: 'metro',
      seahawkZone: 'Metro Cities',
      proposal: 'metro',
    };
  }

  return zone;
}

const DTDC_2189 = {
  EXPRESS: {
    local: { w250: 16, w500: 16, addl: 10 },
    ggn: { w250: 17, w500: 18, addl: 12 },
    ncr_other: { w250: 17, w500: 18, addl: 12 },
    north: { w250: 21, w500: 23, addl: 17 },
    metro: { w250: 36, w500: 48, addl: 45 },
    roi_a: { w250: 40, w500: 53, addl: 48 },
    ne: { w250: 45, w500: 58, addl: 53 },
    spl: { w250: 46, w500: 61, addl: 60 },
  },
  SURFACE: {
    local: 14, ggn: 18, ncr_other: 18, north: 26, metro: 35, roi_a: 37, ne: 46, spl: 55,
  },
  AIR: {
    metro: 77, roi_a: 85, ne: 95, spl: 114,
  },
};

const DTDC_2215 = {
  SURFACE: {
    ggn: { w500: 12.47, addl500: 11.11, after3kg: 14.81 },
    local: { w500: 16.91, addl500: 14.81, after3kg: 17.78 },
    ncr_other: { w500: 16.91, addl500: 14.81, after3kg: 17.78 },
    north: { w500: 21.36, addl500: 18.52, after3kg: 21.48 },
    metro: { w500: 25.06, addl500: 21.48, after3kg: 25.93 },
    roi_a: { w500: 27.28, addl500: 25.93, after3kg: 31.11 },
    roi_b: { w500: 33.21, addl500: 29.63, after3kg: 37.04 },
    ne: { w500: 36.91, addl500: 34.07, after3kg: 44.44 },
    spl: { w500: 36.91, addl500: 34.07, after3kg: 44.44 },
  },
  PEP: {
    ggn: { w500: 30.99, addl500: 22.22 },
    local: { w500: 48.02, addl500: 25.93 },
    ncr_other: { w500: 48.02, addl500: 25.93 },
    north: { w500: 62.84, addl500: 34.07 },
    metro: { w500: 81.36, addl500: 62.96 },
    roi_a: { w500: 97.65, addl500: 74.07 },
    roi_b: { w500: 101.36, addl500: 77.78 },
    ne: { w500: 105.06, addl500: 81.48 },
    spl: { w500: 105.06, addl500: 81.48 },
  },
  PRIORITY: {
    ggn: { w500: 16.91, addl500: 12.59, after3kg: 17.78 },
    local: { w500: 21.36, addl500: 14.07, after3kg: 20.74 },
    ncr_other: { w500: 21.36, addl500: 14.07, after3kg: 20.74 },
    north: { w500: 25.06, addl500: 17.78, after3kg: 28.89 },
    metro: { w500: 36.91, addl500: 34.81, after3kg: 66.67 },
    roi_a: { w500: 39.87, addl500: 35.56, after3kg: 69.63 },
    roi_b: { w500: 40.62, addl500: 37.04, after3kg: 70.37 },
    ne: { w500: 51.73, addl500: 44.44, after3kg: 81.48 },
    spl: { w500: 51.73, addl500: 44.44, after3kg: 81.48 },
  },
};

const TRACKON_DOC = {
  delhi: { w250: 12, w500: 12.5, addl: 6 },
  ncr: { w250: 14, w500: 14.5, addl: 7 },
  north_city: { w250: 17, w500: 18, addl: 10 },
  north_state: { w250: 19, w500: 20, addl: 13.5 },
  east_bihar: { w250: 22, w500: 22, addl: 16.5 },
  metro: { w250: 25, w500: 42.5, addl: 40 },
  west_south: { w250: 27.5, w500: 49.5, addl: 46 },
  central_states: { w250: 22, w500: 22, addl: 16.5 },
  north_east: { w250: 45, w500: 63, addl: 55 },
  kashmir: { w250: 27.5, w500: 49.5, addl: 46 },
  port_blair: { w250: 65, w500: 85, addl: 80 },
};

const TRACKON_AIR = {
  kashmir: { s10: 45, s25: 43, s50: 41, s100: 38, sPlus: 36 },
  metro: { s10: 72, s25: 71, s50: 69, s100: 55, sPlus: 54 },
  east_bihar: { s10: 74, s25: 73, s50: 71, s100: 69, sPlus: 65 },
  west_south: { s10: 84, s25: 81, s50: 78, s100: 75, sPlus: 72 },
  north_east: { s10: 88, s25: 87, s50: 85, s100: 82, sPlus: 80 },
  port_blair: { s10: 150, s25: 145, s50: 142, s100: 140, sPlus: 135 },
};

const TRACKON_SURFACE = {
  delhi: { s10: 12, s25: 11, s50: 10.5, s100: 9, sPlus: 8.5 },
  ncr: { s10: 13.5, s25: 12.5, s50: 12, s100: 10, sPlus: 9.5 },
  north_city: { s10: 18.5, s25: 17.5, s50: 16.5, s100: 14, sPlus: 13 },
  metro: { s10: 23, s25: 27, s50: 21, s100: 20, sPlus: 18 },
  north_state: { s10: 25, s25: 24, s50: 23, s100: 22, sPlus: 20 },
  west_south: { s10: 37, s25: 35, s50: 35, s100: 33, sPlus: 30 },
  east_bihar: { s10: 33, s25: 30, s50: 27, s100: 25, sPlus: 24 },
  north_east: { s10: 48, s25: 46, s50: 43, s100: 40, sPlus: 38 },
  kashmir: { s10: 35, s25: 33, s50: 31, s100: 28, sPlus: 27 },
  central_states: { s10: 33, s25: 30, s50: 27, s100: 25, sPlus: 24 },
  port_blair: { s10: 150, s25: 145, s50: 142, s100: 140, sPlus: 135 },
};

const PRIME_TRACK = {
  city: { w250: 12, w500: 16, addl500: 14, perKgAfter3: 28 },
  region: { w250: 36, w500: 40, addl500: 30, perKgAfter3: 60 },
  zone: { w250: 40, w500: 44, addl500: 36, perKgAfter3: 70 },
  metro: { w250: 60, w500: 66, addl500: 54, perKgAfter3: 106 },
  roi: { w250: 78, w500: 86, addl500: 72, perKgAfter3: 140 },
  spl: { w250: 94, w500: 103, addl500: 87, perKgAfter3: 160 },
};

const DL_B2C_STANDARD = {
  A: { b250: 27, b500: 3, up1: 10, up2: 55, add2: 17, up5: 100, add5: 12, up10: 160, add10: 10 },
  B: { b250: 29, b500: 3, up1: 15, up2: 70, add2: 22, up5: 130, add5: 14, up10: 200, add10: 12 },
  C: { b250: 32, b500: 9, up1: 29, up2: 95, add2: 28, up5: 170, add5: 19, up10: 265, add10: 17 },
  D: { b250: 34, b500: 11, up1: 45, up2: 120, add2: 33, up5: 210, add5: 25, up10: 335, add10: 22 },
  E: { b250: 41, b500: 14, up1: 55, up2: 150, add2: 44, up5: 270, add5: 25, up10: 395, add10: 22 },
  F: { b250: 46, b500: 14, up1: 60, up2: 170, add2: 55, up5: 320, add5: 30, up10: 470, add10: 25 },
};

const DL_B2C_EXPRESS = {
  A: { w500: 30, add500: 25 },
  B: { w500: 32, add500: 28 },
  C: { w500: 49, add500: 44 },
  D: { w500: 61, add500: 56 },
  E: { w500: 85, add500: 85 },
  F: { w500: 100, add500: 90 },
};

const DL_B2B_ZONE_MATRIX = {
  N1: { N1: 6, N2: 6, E: 11.5, NE: 16, W1: 8.5, W2: 9.5, S1: 11.5, S2: 14.5, Central: 8.5 },
  N2: { N1: 6, N2: 6, E: 11.5, NE: 16, W1: 9.5, W2: 9.5, S1: 11.5, S2: 14.5, Central: 9.5 },
  E: { N1: 9.5, N2: 11.5, E: 6, NE: 8.5, W1: 9.5, W2: 11.5, S1: 9.5, S2: 12.5, Central: 8.5 },
  NE: { N1: 9.5, N2: 11.5, E: 8.5, NE: 6, W1: 11.5, W2: 11.5, S1: 11.5, S2: 16, Central: 9.5 },
  W1: { N1: 8.5, N2: 9.5, E: 11.5, NE: 16, W1: 6, W2: 6, S1: 9.5, S2: 12.5, Central: 8.5 },
  W2: { N1: 9.5, N2: 9.5, E: 11.5, NE: 16, W1: 6, W2: 6, S1: 8.5, S2: 11.5, Central: 8.5 },
  S1: { N1: 9.5, N2: 11.5, E: 11.5, NE: 16, W1: 9.5, W2: 8.5, S1: 6, S2: 8.5, Central: 8.5 },
  S2: { N1: 11.5, N2: 11.5, E: 11.5, NE: 16, W1: 9.5, W2: 9.5, S1: 6, S2: 6, Central: 8.5 },
  Central: { N1: 8.5, N2: 9.5, E: 11.5, NE: 16, W1: 6, W2: 8.5, S1: 8.5, S2: 11.5, Central: 6 },
};

function addGst(subtotal) {
  const gst = rnd(subtotal * 0.18);
  return { gst, total: rnd(subtotal + gst) };
}

function buildBreakdown(base, extras = {}) {
  const {
    fsc = 0,
    fscPct = '0%',
    development = 0,
    docket = 0,
    handling = 0,
    fov = 0,
    cn = 0,
    oda = 0,
    gst = 0,
    notes = [],
    mcwApplied = false,
    breakdown = 'Contract rate applied',
  } = extras;
  const subtotal = rnd(base + fsc + development + docket + handling + fov + cn);
  return {
    base: rnd(base),
    fsc: rnd(fsc),
    fscPct,
    development: rnd(development),
    docket: rnd(docket),
    handling: rnd(handling),
    fov: rnd(fov),
    cn: rnd(cn),
    green: 0,
    subtotal,
    gst: rnd(gst),
    oda: rnd(oda),
    total: rnd(subtotal + gst + oda),
    notes,
    mcwApplied,
    breakdown: {
      baseDesc: `${Math.max(0, Number(base || 0)).toFixed(2)} base`,
      costBreakdown: breakdown,
    },
  };
}

function calcDtdc2189Express(zone, w) {
  const r = DTDC_2189.EXPRESS[zone.dtdc] || DTDC_2189.EXPRESS.roi_a;
  const cw = ceil05(w);
  let base = 0;
  if (cw <= 0.25) base = r.w250;
  else if (cw <= 0.5) base = r.w500;
  else base = r.w500 + Math.ceil((cw - 0.5) / 0.5) * r.addl;
  return buildBreakdown(base);
}

function calcDtdc2189Surface(zone, w) {
  const rate = DTDC_2189.SURFACE[zone.dtdc] || DTDC_2189.SURFACE.roi_a;
  const chargeable = Math.max(ceil1(w), 3);
  return buildBreakdown(chargeable * rate, {
    notes: chargeable > w ? ['MCW 3kg applied'] : [],
    mcwApplied: chargeable > w,
    breakdown: `D-Surface @ ₹${rate}/kg`,
  });
}

function calcDtdc2189Air(zone, w) {
  const rate = DTDC_2189.AIR[zone.dtdc] || DTDC_2189.AIR.roi_a;
  const chargeable = Math.max(ceil1(w), 3);
  return buildBreakdown(chargeable * rate, {
    notes: chargeable > w ? ['MCW 3kg applied'] : [],
    mcwApplied: chargeable > w,
    breakdown: `D-Air @ ₹${rate}/kg`,
  });
}

function calcDtdc2215(zone, w, product) {
  const map = DTDC_2215[product];
  const r = map[zone.dtdc] || map.roi_a;
  const cw = Number(w || 0);
  let base = 0;
  const notes = [];

  if (product === 'PEP') {
    const slab = ceil05(cw);
    base = slab <= 0.5 ? r.w500 : r.w500 + Math.ceil((slab - 0.5) / 0.5) * r.addl500;
  } else if (cw <= 3) {
    const slab = Math.max(ceil05(cw), 0.5);
    base = r.w500 + Math.ceil((slab - 0.5) / 0.5) * r.addl500;
  } else {
    const kg = ceil1(cw);
    base = kg * r.after3kg;
    notes.push('Per-kg rate after 3kg applied');
  }

  return buildBreakdown(base, {
    notes,
    breakdown: `${product} table applied`,
  });
}

function calcTrackonDoc(zone, w) {
  const r = TRACKON_DOC[zone.trackon] || TRACKON_DOC.west_south;
  const slab = ceil05(w);
  const base = slab <= 0.25 ? r.w250 : slab <= 0.5 ? r.w500 : r.w500 + Math.ceil((slab - 0.5) / 0.5) * r.addl;
  const fsc = rnd(base * 0.18);
  const development = rnd(base * 0.05);
  const shipperStandard = 5;
  const gst = rnd(shipperStandard * 0.18);
  return buildBreakdown(base, {
    fsc,
    fscPct: '18%',
    development,
    cn: shipperStandard,
    gst,
    notes: ['Trackon normal: FSC 18% and development 5% are explicitly written', 'Shipper Standard ₹5 + GST applied'],
    breakdown: 'Express up to 3kg slab applied',
  });
}

function calcTrackonCargo(zone, w, air = false) {
  const table = air ? TRACKON_AIR : TRACKON_SURFACE;
  const r = table[zone.trackon] || (air ? TRACKON_AIR.west_south : TRACKON_SURFACE.west_south);
  const chargeable = Math.max(ceil1(w), 3);
  const rate = chargeable <= 10 ? r.s10 : chargeable <= 25 ? r.s25 : chargeable <= 50 ? r.s50 : chargeable <= 100 ? r.s100 : r.sPlus;
  const base = chargeable * rate;
  const fsc = rnd(base * 0.18);
  const development = rnd(base * 0.05);
  const shipperStandard = 5;
  const gst = rnd(shipperStandard * 0.18);
  const notes = [];
  if (chargeable > w) notes.push('MCW 3kg applied');
  if (!air) notes.push('No double volumetric till 180cm in surface is documented');
  notes.push('Trackon normal: FSC 18% and development 5% are explicitly written');
  return buildBreakdown(base, {
    fsc,
    fscPct: '18%',
    development,
    cn: shipperStandard,
    gst,
    notes,
    mcwApplied: chargeable > w,
    breakdown: `${air ? 'Air' : 'Surface'} cargo @ ₹${rate}/kg`,
  });
}

function calcPrimeTrack(zone, w) {
  const r = PRIME_TRACK[zone.pt] || PRIME_TRACK.roi;
  const cw = Number(w || 0);
  let base = 0;
  const notes = ['Prime Track: no fuel surcharge is applied because it is not written in the shared tariff'];
  if (cw <= 0.25) base = r.w250;
  else if (cw <= 0.5) base = r.w500;
  else if (cw <= 3) base = r.w500 + Math.ceil((ceil05(cw) - 0.5) / 0.5) * r.addl500;
  else base = ceil1(cw) * r.perKgAfter3;
  const subtotal = rnd(base + 35);
  const { gst, total } = addGst(subtotal);
  return {
    ...buildBreakdown(base, { cn: 35, notes }),
    mcwApplied: ceil1(cw) > cw && cw > 3,
    subtotal,
    gst,
    total,
  };
}

function calcDelhiveryStandard(zone, w, reverseType = 'forward') {
  const r = DL_B2C_STANDARD[zone.delhivery] || DL_B2C_STANDARD.D;
  const chargeable = Number(w || 0);
  let base = 0;

  if (chargeable <= 0.25) base = r.b250;
  else if (chargeable <= 0.5) base = r.b250 + r.b500;
  else if (chargeable <= 1) base = r.b250 + r.b500 + r.up1;
  else if (chargeable <= 2) base = r.up2;
  else if (chargeable <= 5) base = r.up5 + Math.max(0, ceil1(chargeable) - 5) * r.add5;
  else if (chargeable <= 10) base = r.up10 + Math.max(0, ceil1(chargeable) - 10) * r.add10;
  else base = r.up10 + Math.max(0, ceil1(chargeable) - 10) * r.add10;

  if (reverseType === 'dto') {
    base = rnd(base * 1.5);
  }

  const { gst, total } = addGst(base);
  return {
    ...buildBreakdown(base, {
      notes: ['No FSC applied: Delhivery B2C file explicitly says no fuel surcharge'],
      breakdown: `${reverseType === 'dto' ? 'DTO' : 'Forward'} standard slab applied`,
    }),
    gst,
    total,
  };
}

function calcDelhiveryExpress(zone, w, reverseType = 'forward') {
  const r = DL_B2C_EXPRESS[zone.delhivery] || DL_B2C_EXPRESS.D;
  const slabs = Math.max(1, Math.ceil(Number(w || 0) / 0.5));
  let base = slabs === 1 ? r.w500 : r.w500 + (slabs - 1) * r.add500;
  if (reverseType === 'dto') {
    base = slabs === 1 ? r.w500 * 1.5 : (r.w500 * 1.5) + (slabs - 1) * rnd(r.add500 * 1.5);
  }
  const { gst, total } = addGst(base);
  return {
    ...buildBreakdown(base, {
      notes: ['No FSC applied: Delhivery B2C file explicitly says no fuel surcharge'],
      breakdown: `${reverseType === 'dto' ? 'DTO' : 'Forward'} express slab applied`,
    }),
    gst,
    total,
  };
}

function calcDelhiveryB2B(zone, w, odaAmt = 0) {
  const originZone = 'N1';
  const destZone = zone.delhiveryB2B || 'Central';
  const rate = DL_B2B_ZONE_MATRIX[originZone]?.[destZone] || 8.5;
  const chargeable = Math.max(ceil1(w), 20);
  const base = rnd(chargeable * rate);
  const fsc = rnd(base * 0.15);
  const docket = 250;
  const handling = rnd(chargeable * 3);
  const notes = [];
  if (chargeable > w) notes.push('MCW 20kg applied');
  const fov = 150;
  const oda = odaAmt || 0;
  return {
    ...buildBreakdown(base, {
      fsc,
      fscPct: '15%',
      docket,
      handling,
      fov,
      oda,
      notes,
      mcwApplied: chargeable > w,
      breakdown: `${originZone} to ${destZone} @ ₹${rate}/kg`,
    }),
    subtotal: rnd(base + fsc + docket + handling + fov),
    total: rnd(base + fsc + docket + handling + fov + oda),
    notes: [
      ...notes,
      'Delhivery B2B overheads applied only as written in the shared workbook',
    ],
  };
}

function courierCost(id, zone, w, odaAmt = 0) {
  switch (id) {
    case 'dl_b2c_std':
      return calcDelhiveryStandard(zone, w);
    case 'dl_b2c_exp':
      return calcDelhiveryExpress(zone, w);
    case 'dl_b2b':
      return calcDelhiveryB2B(zone, w, odaAmt);
    case 'dtdc_2189_exp':
      return calcDtdc2189Express(zone, w);
    case 'dtdc_2189_sfc':
      return calcDtdc2189Surface(zone, w);
    case 'dtdc_2189_air':
      return calcDtdc2189Air(zone, w);
    case 'dtdc_2215_std':
      return calcDtdc2215(zone, w, 'SURFACE');
    case 'dtdc_2215_pep':
      return calcDtdc2215(zone, w, 'PEP');
    case 'dtdc_2215_pty':
      return calcDtdc2215(zone, w, 'PRIORITY');
    case 'tk_doc':
      return calcTrackonDoc(zone, w);
    case 'tk_surface':
      return calcTrackonCargo(zone, w, false);
    case 'tk_air':
      return calcTrackonCargo(zone, w, true);
    case 'tk_prime':
      return calcPrimeTrack(zone, w);
    default:
      return null;
  }
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
  delhi: 'Metro Cities', ncr: 'Metro Cities', north_city: 'Metro Cities',
  north_state: 'Srinagar Sector', metro: 'Metro Cities', east_bihar: 'Bihar & JH',
  central_states: 'Rest of India', east_south: 'Rest of India', north_east: 'North East', port_blair: 'Port Blair',
};

function proposalSell(zone, w, shipType, level = 'economy', landedCost = 0) {
  const FSC = 0.25;
  const GST = 0.18;
  const src = level === 'premium' ? 'Proposal (Premium)' : 'Proposal (Economy)';

  let result = null;

  if (shipType === 'doc') {
    const r = (level === 'premium' ? SELL_DOC_PREM : SELL_DOC_ECO)[zone.seahawkZone] || SELL_DOC_ECO['Rest of India'];
    const cw = ceil05(w);
    const b = cw <= 0.25 ? r.w250 : cw <= 0.5 ? r.w500 : r.w500 + Math.ceil((cw - 0.5) / 0.5) * r.addl;
    const fsc = rnd(b * FSC); const sub = b + fsc;
    result = { base: rnd(b), fsc, fscPct: '25%', gst: rnd(sub * GST), total: rnd(sub * (1 + GST)), source: src };
  }
  else if (shipType === 'surface') {
    if (w < 3) return null;
    const r = (level === 'premium' ? SELL_SFC_PREM : SELL_SFC_ECO)[zone.seahawkZone] || SELL_SFC_ECO['Rest of India'];
    const cw = ceil1(w);
    const rate = cw <= 10 ? r.s3 : cw <= 25 ? r.s10 : cw <= 50 ? r.s25 : cw <= 100 ? r.s50 : r.s100;
    const b = Math.max(cw, 3) * rate; const fsc = rnd(b * FSC); const sub = b + fsc;
    result = { base: rnd(b), fsc, fscPct: '25%', gst: rnd(sub * GST), total: rnd(sub * (1 + GST)), source: src };
  }
  else if (shipType === 'air') {
    if (w < 3) return null;
    const r = SELL_AIR[AIR_SELL_MAP[zone.trackon] || 'Rest of India'] || SELL_AIR['Rest of India'];
    const cw = ceil1(w);
    const rate = cw < 5 ? r.lt5 : cw <= 10 ? r.t10 : cw <= 25 ? r.t25 : cw <= 50 ? r.t50 : r.g50;
    const b = Math.max(cw, 3) * rate; const fsc = rnd(b * FSC); const sub = b + fsc;
    result = { base: rnd(b), fsc, fscPct: '25%', gst: rnd(sub * GST), total: rnd(sub * (1 + GST)), source: 'Proposal (Air)' };
  }

  if (result && landedCost > 0) {
    const minTarget = rnd(landedCost * 1.15); // Floor at 15% margin
    if (result.total < minTarget) {
      result.total = minTarget;
      result.source = `${result.source} — Floor Applied`;
      // Recalculate base/fsc/gst components roughly for the floor price
      const sub = rnd(minTarget / (1 + GST));
      result.gst = rnd(minTarget - sub);
      const b = rnd(sub / (1 + FSC));
      result.fsc = rnd(sub - b);
      result.base = b;
    }
  }

  return result;
}

const COURIERS = [
  { id: 'dl_b2c_std', label: 'Delhivery B2C Standard', group: 'Delhivery', mode: 'Standard', badgeLabel: 'Standard', color: 'rose', types: ['doc', 'surface'], level: 'economy', logo: LOGOS.Delhivery },
  { id: 'dl_b2c_exp', label: 'Delhivery B2C Express', group: 'Delhivery', mode: 'Express', badgeLabel: 'Express', color: 'rose', types: ['doc'], level: 'premium', logo: LOGOS.Delhivery },
  { id: 'dl_b2b', label: 'Delhivery B2B', group: 'Delhivery', mode: 'B2B Heavy', badgeLabel: 'B2B', color: 'pink', types: ['surface'], level: 'economy', logo: LOGOS.Delhivery },
  { id: 'dtdc_2189_exp', label: 'DTDC 2189 Express', group: 'DTDC 2189', mode: 'Express', badgeLabel: 'Express', color: 'sky', types: ['doc'], level: 'economy', logo: LOGOS.DTDC },
  { id: 'dtdc_2189_sfc', label: 'DTDC 2189 D-Surface', group: 'DTDC 2189', mode: 'D-Surface', badgeLabel: 'Surface', color: 'blue', types: ['surface'], level: 'economy', logo: LOGOS.DTDC },
  { id: 'dtdc_2189_air', label: 'DTDC 2189 D-Air', group: 'DTDC 2189', mode: 'D-Air', badgeLabel: 'Air', color: 'indigo', types: ['air'], level: 'economy', logo: LOGOS.DTDC },
  { id: 'dtdc_2215_std', label: 'DTDC 2215 Surface', group: 'DTDC 2215', mode: 'D71', badgeLabel: 'Surface', color: 'teal', types: ['doc', 'surface'], level: 'economy', logo: LOGOS.DTDC },
  { id: 'dtdc_2215_pep', label: 'DTDC 2215 PEP', group: 'DTDC 2215', mode: 'V71', badgeLabel: 'Express', color: 'emerald', types: ['doc'], level: 'premium', logo: LOGOS.DTDC },
  { id: 'dtdc_2215_pty', label: 'DTDC 2215 Priority', group: 'DTDC 2215', mode: 'P7X', badgeLabel: 'Priority', color: 'cyan', types: ['doc', 'surface'], level: 'premium', logo: LOGOS.DTDC },
  { id: 'tk_doc', label: 'Trackon Standard', group: 'Trackon', mode: 'Express up to 3kg', badgeLabel: 'Standard', color: 'orange', types: ['doc'], level: 'economy', logo: LOGOS.Trackon },
  { id: 'tk_surface', label: 'Trackon Surface Cargo', group: 'Trackon', mode: 'Surface Cargo', badgeLabel: 'Surface', color: 'orange', types: ['surface'], level: 'economy', logo: LOGOS.Trackon },
  { id: 'tk_air', label: 'Trackon Air Cargo', group: 'Trackon', mode: 'Air Cargo', badgeLabel: 'Air', color: 'amber', types: ['air'], level: 'economy', logo: LOGOS.Trackon },
  { id: 'tk_prime', label: 'Prime Track', group: 'Trackon', mode: 'Prime Track', badgeLabel: 'Prime', color: 'red', types: ['doc', 'surface'], level: 'premium', logo: LOGOS.Trackon },
];

const COURIER_GROUPS = [
  { id: 'all', label: 'All Partners', icon: '🌍', color: 'bg-slate-100', logo: null },
  { id: 'Delhivery', label: 'Delhivery', icon: '📦', color: 'bg-rose-50', logo: LOGOS.Delhivery },
  { id: 'DTDC 2189', label: 'DTDC 2189', icon: '🔵', color: 'bg-blue-50', logo: LOGOS.DTDC },
  { id: 'DTDC 2215', label: 'DTDC 2215', icon: '🟢', color: 'bg-emerald-50', logo: LOGOS.DTDC },
  { id: 'Trackon', label: 'Trackon', icon: '🚀', color: 'bg-orange-50', logo: LOGOS.Trackon },
];

const CLR = {
  orange: 'bg-orange-100 border-orange-300 text-orange-800',
  yellow: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  amber: 'bg-amber-100 border-amber-300 text-amber-800',
  red: 'bg-red-100 border-red-300 text-red-800',
  rose: 'bg-rose-100 border-rose-300 text-rose-800',
  pink: 'bg-pink-100 border-pink-300 text-pink-800',
  blue: 'bg-blue-100 border-blue-300 text-blue-800',
  cyan: 'bg-cyan-100 border-cyan-300 text-cyan-800',
  teal: 'bg-teal-100 border-teal-300 text-teal-800',
  green: 'bg-green-100 border-green-300 text-green-800',
  emerald: 'bg-emerald-100 border-emerald-300 text-emerald-800',
  lime: 'bg-lime-100 border-lime-300 text-lime-800',
  sky: 'bg-sky-100 border-sky-300 text-sky-800',
  slate: 'bg-slate-100 border-slate-300 text-slate-700',
  indigo: 'bg-indigo-100 border-indigo-300 text-indigo-800',
  violet: 'bg-violet-100 border-violet-300 text-violet-800',
  purple: 'bg-purple-100 border-purple-300 text-purple-800',
};

const CITY_LIST = [
  { label: 'Delhi', state: 'Delhi', district: 'Delhi', city: 'delhi' },
  { label: 'Gurgaon / Gurugram', state: 'Haryana', district: 'Gurugram', city: 'gurgaon' },
  { label: 'Noida', state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar', city: 'noida' },
  { label: 'Faridabad', state: 'Haryana', district: 'Faridabad', city: 'faridabad' },
  { label: 'Ghaziabad', state: 'Uttar Pradesh', district: 'Ghaziabad', city: 'ghaziabad' },
  { label: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad', city: 'ahmedabad' },
  { label: 'Mumbai', state: 'Maharashtra', district: 'Mumbai', city: 'mumbai' },
  { label: 'Bangalore', state: 'Karnataka', district: 'Bengaluru', city: 'bangalore' },
  { label: 'Kolkata', state: 'West Bengal', district: 'Kolkata', city: 'kolkata' },
  { label: 'Chennai', state: 'Tamil Nadu', district: 'Chennai', city: 'chennai' },
  { label: 'Hyderabad', state: 'Telangana', district: 'Hyderabad', city: 'hyderabad' },
];

const WEIGHT_POINTS = [0.25, 0.5, 1, 2, 3, 5, 10, 15, 20, 25, 50, 100];

export { stateToZones, proposalSell, courierCost, COURIERS, COURIER_GROUPS, CITY_LIST, CLR, fmt, fmtI, fmtP, pColor, WEIGHT_POINTS, rnd };
