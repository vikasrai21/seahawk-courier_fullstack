/* ============================================================
   SEA HAWK COURIER — Rate Calculator
   Source: SeaHawk Rate Card v10 FINAL
   
   Domestic Document & Packet · Heavy Surface · Heavy Air
   Priority Services · International
   
   Surcharges: FSC 25% · GST 18% · Insurance optional
   ============================================================ */

/* ── DOMESTIC DOCUMENT & PACKET (per consignment, grams) ─── */
const DOC_RATES = {
  localNCR:   { w250: 22,  w500: 25,  addl: 12 },
  northIndia: { w250: 28,  w500: 40,  addl: 14 },
  metro:      { w250: 35,  w500: 55,  addl: 35 },
  restIndia:  { w250: 40,  w500: 65,  addl: 38 },
  northEast:  { w250: 65,  w500: 80,  addl: 45 },
  diplomatic: { w250: 75,  w500: 95,  addl: 50 },
};

/* ── PRIORITY SERVICES (per consignment, grams) ─────────── */
const PRIORITY_RATES = {
  localNCR:   { w500: 70,  w1kg: 100, addl: 50  },
  northIndia: { w500: 100, w1kg: 140, addl: 75  },
  restIndia:  { w500: 140, w1kg: 190, addl: 100 },
  northEast:  { w500: 175, w1kg: 225, addl: 125 },
};

/* ── HEAVY SURFACE (per kg, min 3 kg) ────────────────────── */
const HEAVY_SFC = {
  localNCR:   { r3: 22,  r10: 20,  r25: 18,  r50: 16,  r100: 15 },
  northIndia: { r3: 30,  r10: 28,  r25: 25,  r50: 22,  r100: 20 },
  metro:      { r3: 35,  r10: 32,  r25: 30,  r50: 29,  r100: 27 },
  restIndia:  { r3: 45,  r10: 43,  r25: 40,  r50: 38,  r100: 35 },
  northEast:  { r3: 55,  r10: 52,  r25: 50,  r50: 47,  r100: 45 },
  kashmir:    { r3: 60,  r10: 55,  r25: 52,  r50: 48,  r100: 46 },
  portBlair:  { r3: 120, r10: 110, r25: 90,  r50: 85,  r100: 80 },
};

/* ── HEAVY AIR (per kg, min 3 kg) ────────────────────────── */
const HEAVY_AIR = {
  srinagar:  { lt5: 72,  r5: 70,  r10: 65,  r25: 62,  r50: 60 },
  biharJh:   { lt5: 80,  r5: 78,  r10: 75,  r25: 72,  r50: 70 },
  metro:     { lt5: 85,  r5: 80,  r10: 78,  r25: 75,  r50: 74 },
  restIndia: { lt5: 88,  r5: 85,  r10: 82,  r25: 80,  r50: 78 },
  northEast: { lt5: 95,  r5: 90,  r10: 85,  r25: 82,  r50: 80 },
  portBlair: { lt5: 125, r5: 110, r10: 100, r25: 95,  r50: 90 },
};

/* ── INTERNATIONAL (per 500g) ────────────────────────────── */
const INTL = {
  zoneA: { dox: 1200, nondox: 1425, addlDox: 350, addlNon: 510 },
  zoneB: { dox: 1450, nondox: 1675, addlDox: 460, addlNon: 520 },
  zoneC: { dox: 1600, nondox: 1800, addlDox: 510, addlNon: 595 },
  zoneD: { dox: 1700, nondox: 1900, addlDox: 565, addlNon: 620 },
  zoneE: { dox: 1875, nondox: 1975, addlDox: 595, addlNon: 675 },
  zoneF: { dox: 1975, nondox: 2125, addlDox: 625, addlNon: 725 },
  zoneG: { dox: 2250, nondox: 2450, addlDox: 630, addlNon: 745 },
};
const ZONE_H_ADD = 300;   // Zone H = Zone G + ₹300
const DHL_ADD    = 350;   // Via DHL/FedEx
const FSC        = 0.25;  // 25% Fuel Surcharge
const GST        = 0.18;  // 18% GST
const INS_RATE   = 0.002; // 0.2% (min ₹50)

const COUNTRY_ZONE = {
  'bangladesh':'zoneA','bhutan':'zoneA','maldives':'zoneA','nepal':'zoneA',
  'sri lanka':'zoneA','united arab emirates':'zoneA',
  'bahrain':'zoneB','hong kong':'zoneB','iran':'zoneB','jordan':'zoneB',
  'kuwait':'zoneB','oman':'zoneB','pakistan':'zoneB','qatar':'zoneB',
  'saudi arabia':'zoneB','singapore':'zoneB','syria':'zoneB','yemen':'zoneB',
  'australia':'zoneC','brunei':'zoneC','cambodia':'zoneC','china':'zoneC',
  'indonesia':'zoneC','korea':'zoneC','macau':'zoneC','taiwan':'zoneC',
  'malaysia':'zoneC','myanmar':'zoneC','new zealand':'zoneC',
  'philippines':'zoneC','thailand':'zoneC','vietnam':'zoneC',
  'belgium':'zoneD','denmark':'zoneD','france':'zoneD','germany':'zoneD',
  'italy':'zoneD','luxembourg':'zoneD','netherlands':'zoneD',
  'united kingdom':'zoneD','switzerland':'zoneD',
  'canada':'zoneE','mexico':'zoneE','united states':'zoneE',
  'japan':'zoneF',
  'austria':'zoneG','bulgaria':'zoneG','canary islands':'zoneG',
  'finland':'zoneG','greece':'zoneG','israel':'zoneG','norway':'zoneG',
  'poland':'zoneG','portugal':'zoneG','romania':'zoneG',
  'south africa':'zoneG','spain':'zoneG','sweden':'zoneG',
  'malta':'zoneG','turkey':'zoneG','hungary':'zoneG',
};
const ZONE_NAMES = {
  zoneA:'Bangladesh · Bhutan · Maldives · Nepal · Sri Lanka · UAE',
  zoneB:'Bahrain · HK · Iran · Jordan · Kuwait · Oman · Pakistan · Qatar · Saudi Arabia · Singapore · Yemen',
  zoneC:'Australia · China · Indonesia · Korea · Malaysia · NZ · Philippines · Thailand · Vietnam',
  zoneD:'Belgium · Denmark · France · Germany · Italy · Netherlands · Switzerland · UK',
  zoneE:'Canada · Mexico · USA',
  zoneF:'Japan',
  zoneG:'Austria · Finland · Greece · Israel · Norway · Poland · Portugal · Romania · South Africa · Spain · Sweden · Turkey',
  zoneH:'Rest of World (Zone G + ₹300)',
};

/* ── HELPERS ─────────────────────────────────────────────── */
function sfcRate(zone, kg) {
  const r = HEAVY_SFC[zone] || HEAVY_SFC.restIndia;
  return kg <= 10 ? r.r3 : kg <= 25 ? r.r10 : kg <= 50 ? r.r25 : kg <= 100 ? r.r50 : r.r100;
}
function airRate(zone, kg) {
  const r = HEAVY_AIR[zone] || HEAVY_AIR.restIndia;
  return kg < 5 ? r.lt5 : kg <= 10 ? r.r5 : kg <= 25 ? r.r10 : kg <= 50 ? r.r25 : r.r50;
}
function rnd(n) { return Math.round(n * 100) / 100; }
function fmt(n) { return '₹' + n.toFixed(2); }
function el(id) { return document.getElementById(id); }
function show(id, v) { const e = el(id); if (e) e.style.display = v ? '' : 'none'; }

/* ── TOGGLE FIELDS ───────────────────────────────────────── */
function calcToggleFields() {
  const svc = el('c-svc')?.value || 'doc';
  const isIntl  = svc === 'international';
  const isSfc   = svc === 'heavy-sfc';
  const isAir   = svc === 'heavy-air';
  const isPri   = svc === 'priority';
  const isHeavy = isSfc || isAir;

  show('c-zone-wrap',       !isIntl && !isHeavy && !isPri);
  show('c-priority-wrap',   isPri);
  show('c-heavy-sfc-wrap',  isSfc);
  show('c-heavy-air-wrap',  isAir);
  show('c-country-wrap',    isIntl);
  show('c-dest-wrap',       isIntl);
  show('c-type-wrap',       isIntl);
  show('c-dhl-row',         isIntl);

  const wlbl = el('c-weight-lbl');
  if (wlbl) wlbl.textContent = isHeavy ? 'Weight (kg)' : 'Weight (grams)';
  const wi = el('c-weight');
  if (wi) wi.placeholder = isHeavy ? 'e.g. 5' : 'e.g. 500';

  updateZoneFromCountry();
  computeRate();
}

function updateZoneFromCountry() {
  if (el('c-svc')?.value !== 'international') return;
  const country = el('c-country')?.value?.toLowerCase().trim() || '';
  const dest    = el('c-destination');
  if (!dest) return;
  const zone = COUNTRY_ZONE[country] || 'zoneH';
  dest.value = zone;
  showZone(zone);
}

function showZone(zone) {
  const zi = el('zone-info');
  if (!zi) return;
  if (zone) { zi.textContent = `🌍 ${zone.toUpperCase()}: ${ZONE_NAMES[zone] || ''}`; zi.classList.add('show'); }
  else { zi.classList.remove('show'); }
}

/* ── MAIN CALCULATION ────────────────────────────────────── */
function computeRate() {
  const svc = el('c-svc')?.value || 'doc';
  const w   = parseFloat(el('c-weight')?.value) || 0;
  if (w <= 0) { el('calcResult')?.classList.remove('show'); return; }

  const hasIns = el('c-ins')?.checked;
  const hasDhl = el('c-dhl')?.checked;
  let base = 0;

  if (svc === 'doc') {
    const r = DOC_RATES[el('c-zone')?.value || 'localNCR'] || DOC_RATES.localNCR;
    if (w <= 250) base = r.w250;
    else if (w <= 500) base = r.w500;
    else base = r.w500 + Math.ceil((w - 500) / 500) * r.addl;
  }

  else if (svc === 'priority') {
    const r = PRIORITY_RATES[el('c-priority-zone')?.value || 'localNCR'] || PRIORITY_RATES.localNCR;
    if (w <= 500) base = r.w500;
    else if (w <= 1000) base = r.w1kg;
    else base = r.w1kg + Math.ceil((w - 1000) / 500) * r.addl;
  }

  else if (svc === 'heavy-sfc') {
    if (w < 3) { alert('Minimum chargeable weight: 3 kg'); return; }
    const zone = el('c-heavy-sfc-zone')?.value || 'localNCR';
    base = w * sfcRate(zone, w);
  }

  else if (svc === 'heavy-air') {
    if (w < 3) { alert('Minimum chargeable weight: 3 kg'); return; }
    const zone = el('c-heavy-air-zone')?.value || 'metro';
    base = w * airRate(zone, w);
  }

  else if (svc === 'international') {
    const zone = el('c-destination')?.value || 'zoneA';
    const type = el('c-type')?.value || 'dox';
    let r;
    if (zone === 'zoneH') {
      r = { ...INTL.zoneG, dox: INTL.zoneG.dox + ZONE_H_ADD, nondox: INTL.zoneG.nondox + ZONE_H_ADD };
    } else {
      r = INTL[zone] || INTL.zoneA;
    }
    const baseRate = type === 'dox' ? r.dox    : r.nondox;
    const addlRate = type === 'dox' ? r.addlDox : r.addlNon;
    base = w <= 500 ? baseRate : baseRate + Math.ceil((w - 500) / 500) * addlRate;
    if (hasDhl) base += DHL_ADD;
    showZone(zone);
  }

  const fsc  = rnd(base * FSC);
  const ins  = hasIns ? Math.max(rnd(base * INS_RATE), 50) : 0;
  const gst  = rnd((base + fsc + ins) * GST);
  const tot  = rnd(base + fsc + ins + gst);

  if (el('r-base'))  el('r-base').textContent  = fmt(base);
  if (el('r-fuel'))  el('r-fuel').textContent  = fmt(fsc);
  if (el('r-ins'))   el('r-ins').textContent   = fmt(ins);
  if (el('r-gst'))   el('r-gst').textContent   = fmt(gst);
  if (el('r-total')) el('r-total').textContent = fmt(tot);

  const ir = el('r-ins-row');
  if (ir) ir.style.display = hasIns ? '' : 'none';
  el('calcResult')?.classList.add('show');
}

function resetCalc() {
  const wi = el('c-weight');
  if (wi) wi.value = '';
  ['c-ins','c-dhl'].forEach(id => { const e = el(id); if (e) e.checked = false; });
  el('calcResult')?.classList.remove('show');
  el('zone-info')?.classList.remove('show');
}

/* ── INIT ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  ['c-svc','c-zone','c-priority-zone','c-heavy-sfc-zone','c-heavy-air-zone',
   'c-destination','c-country','c-type','c-weight','c-ins','c-dhl'].forEach(id => {
    const e = el(id);
    if (!e) return;
    e.addEventListener(e.tagName === 'SELECT' || e.type === 'checkbox' ? 'change' : 'input', () => {
      if (id === 'c-svc') calcToggleFields();
      else if (id === 'c-country') updateZoneFromCountry();
      else computeRate();
    });
  });
  calcToggleFields();
});
