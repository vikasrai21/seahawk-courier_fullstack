/**
 * Seahawk Courier Rate & Profit Calculator — v5.0
 * All rates from verified partner documents
 *
 * Rate validity:
 *   Trackon Express/Surface/Air  : w.e.f. 01 Apr 2025
 *   Trackon Prime Track          : w.e.f. 01 Apr 2025
 *   DTDC Priority X              : w.e.f. 01 Jan 2024
 *   DTDC Ecomm 7X/7D/7G (Gold)  : w.e.f. 01 Jan 2024
 *   Delhivery Standard/Express   : as per Final_Outlet_Rates
 *   GEC Transhipment             : w.e.f. 16 Jan 2024
 *   LTL Road Express             : as per LTL rate sheet
 *   B2B Courier                  : as per B2B_rates sheet
 *   BlueDart/DEL TS              : as per Z_LITE rate sheet
 *
 * Surcharge formulas (all verified):
 *   Trackon Express/Surface/Air  : Base × 1.23 × 1.18  (FSC 18% + Dev 5% + GST 18%)
 *   Trackon Prime Track          : (Base + CN₹35) × 1.18  (GST 18% only)
 *   Delhivery Std/Exp            : Base × 1.18  (no FSC confirmed)
 *   B2B                          : (max(freight+FSC15%,₹350) + docket₹250 + green max(0.5/kg,₹100)) × 1.18
 *   DTDC Priority X              : Base × 1.35 × 1.18  (FSC 35%)
 *   DTDC 7X/7D/7G (Gold)        : (Base × 1.35 + BookCost₹12) × 1.18
 *   GEC (GA tier)                : (max(freight×1.20,₹275) + docket₹75) × 1.18  (FSC 20%, MCW 50kg)
 *   LTL                          : (max(freight×1.15,₹750) + doc₹100 + env max(0.5/kg,₹100)) × 1.18  (MCW 40kg)
 *   BlueDart                     : Base × 1.35 × 1.18  (FSC 35%)
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Search, TrendingUp, Zap, Info, ChevronDown, ChevronUp,
  IndianRupee, MapPin, Loader, Edit3, Users, X, Settings,
  FileText, BarChart2, Calculator, AlertTriangle, CheckCircle,
  Clock, Package, Wind, Truck, ChevronRight, Printer, Target
} from 'lucide-react';
import api from '../services/api';

// ─── RATE VALIDITY DATES ─────────────────────────────────────────────────
const RATE_DATES = {
  trackon:   '01 Apr 2025',
  primetrack:'01 Apr 2025',
  dtdc:      '01 Jan 2024',
  delhivery: 'Current',
  gec:       '16 Jan 2024',
  ltl:       'Current',
  b2b:       'Current',
  bluedart:  'Current',
};

// ─── ZONE MAPPING ─────────────────────────────────────────────────────────
// Returns zone keys for ALL courier rate tables from state/district/city strings
function stateToZones(state, district, city) {
  const s = (state||'').toLowerCase().trim();
  const d = (district||'').toLowerCase().trim();
  const c = (city||'').toLowerCase().trim();

  // Build zone object
  // trackon      → TK_EXP / TK_SFC zone key
  // trackon_sfc  → TK_SFC zone key
  // trackon_air  → TK_AIR zone key
  // delhivery    → DL zone (A-F)
  // b2b          → B2B zone (N1/N2/E/NE/W1/W2/S1/S2/Central)
  // dtdc         → DTDC zone (local/region/zone/metro/roi_a/roi_b/spl)
  // bd           → BD_EXP zone
  // bd_air       → BD_AIR zone
  // bd_sfc       → BD_SFC zone
  // gec          → GEC_RATES zone
  // ltl          → LTL_RATES zone
  // pt           → Prime Track zone (city/region/zone/metro/roi/spl)
  // seahawkZone  → Human readable zone for proposal rate lookup
  const Z = (trackon,trackon_sfc,trackon_air,delhivery,b2b,dtdc,bd,bd_air,bd_sfc,gec,ltl,pt,seahawkZone) =>
    ({trackon,trackon_sfc,trackon_air,delhivery,b2b,dtdc,bd,bd_air,bd_sfc,gec,ltl,pt,seahawkZone});

  // ── Delhi (within city) ──
  if (s==='delhi'||s.includes('new delhi'))
    return Z('delhi','delhi','roi_air','A','N1','local','local','metros_air','local_sfc','north_i','n1','city','Delhi & NCR');

  // ── NCR (Haryana/UP NCR districts) ──
  const isHarNCR = s.includes('haryana')&&(d.includes('gurgaon')||d.includes('gurugram')||d.includes('faridabad')||d.includes('sonipat')||d.includes('jhajjar'));
  const isUPNCR  = s.includes('uttar pradesh')&&(d.includes('gautam buddha')||d.includes('ghaziabad'));
  if (isHarNCR||isUPNCR)
    return Z('ncr','ncr','roi_air','A','N1','region','ncr','metros_air','ncr_sfc','north_i','n1','region','Delhi & NCR');

  // ── NE States ──
  const NE_STATES=['assam','meghalaya','tripura','arunachal','mizoram','nagaland','sikkim','manipur'];
  if (NE_STATES.some(n=>s.includes(n))) {
    const isGuwahati = d.includes('kamrup')||c.includes('guwahati');
    const isTripura  = s.includes('tripura');
    const isManipul  = s.includes('manipur');
    return Z('ne','ne_sfc','ne_air', isManipul?'F':'E', 'NE','spl','roi','roi_air','roi_sfc',
      isGuwahati?'ne_i':isTripura?'ne_iii':'ne_ii',
      isGuwahati?'ne1':'ne2','spl','North East');
  }

  // ── Andaman & Nicobar ──
  if (s.includes('andaman'))
    return Z('port_blair','ne_sfc','port_blair_air','F','NE','spl','roi','roi_air','roi_sfc','ne_ii','ne2','spl','Diplomatic / Port Blair');

  // ── Ladakh ──
  if (s.includes('ladakh'))
    return Z('ne','ne_sfc','ne_air','F','N2','spl','roi','roi_air','roi_sfc','north_iii','n3','spl','North East');

  // ── J&K ──
  if (s.includes('jammu')||s.includes('kashmir')) {
    if (d.includes('srinagar')||c.includes('srinagar'))
      return Z('metro','roi_sfc','srinagar_air','E','N2','roi_b','srinagar','srinagar_air','north_sfc','north_iii','n3','roi','North East');
    return Z('north_state','kashmir_sfc','srinagar_air','E','N2','roi_b','north','srinagar_air','north_sfc','north_iii','n3','zone','North India');
  }

  // ── Himachal Pradesh ──
  if (s.includes('himachal'))
    return Z('north_state','north_state_sfc','roi_air','E','N2','zone','north','metros_air','north_sfc','north_iii','n3','zone','North India');

  // ── North States (Punjab/Haryana rest/Uttarakhand/UP rest/Rajasthan) ──
  if (s.includes('punjab')||s.includes('haryana')||s.includes('uttarakhand')||s.includes('uttar pradesh')||s.includes('rajasthan')) {
    const GEC_N1_CITIES=['chandigarh','gurgaon','gurugram','ludhiana','lucknow','jaipur','faridabad','noida','ghaziabad','mohali','sahibabad','panchkula','kundli'];
    const isMajor = GEC_N1_CITIES.some(m=>c.includes(m)||d.includes(m));
    return Z(
      isMajor?'north_cities':'north_state',
      isMajor?'north_cities_sfc':'north_state_sfc',
      'roi_air','B','N1',isMajor?'region':'zone','north','metros_air','north_sfc',
      isMajor?'north_i':'north_ii',
      isMajor?'n1':'n2',
      isMajor?'region':'zone',
      'North India'
    );
  }

  // ── Bihar / Jharkhand ──
  if (s.includes('bihar')||s.includes('jharkhand')) {
    const isCity=d.includes('patna')||c.includes('patna')||d.includes('ranchi')||c.includes('ranchi')||d.includes('jamshedpur')||c.includes('jamshedpur');
    return Z('central_air',isCity?'metro_patna_sfc':'rest_bihar_sfc','central_mp_air','D','E','roi_a','bihar_jh','bihar_jh_air','metros_sfc',
      isCity?'east_i':'east_ii',isCity?'e1':'e2','metro','Metro Cities');
  }

  // ── Madhya Pradesh / Chhattisgarh ──
  if (s.includes('madhya pradesh')||s.includes('chhattisgarh')) {
    const isCity=d.includes('bhopal')||c.includes('bhopal')||d.includes('indore')||c.includes('indore')||d.includes('nagpur')||c.includes('nagpur')||d.includes('raipur')||c.includes('raipur');
    return Z('central_sfc',isCity?'north_state_sfc':'cg_jh_mp_sfc','central_mp_air','D','Central','roi_a','metros','metros_air','metros_sfc',
      isCity?'central_i':'central_ii',isCity?'c1':'c2','metro','Rest of India');
  }

  // ── Odisha ──
  if (s.includes('odisha')||s.includes('orissa')) {
    const isBBS=d.includes('khurda')||c.includes('bhubaneswar');
    return Z('south_west','roi_sfc','roi_air','D','E','roi_a','roi','roi_air','roi_sfc',
      isBBS?'east_i':'east_ii',isBBS?'e1':'e2','roi','Rest of India');
  }

  // ── West Bengal ──
  if (s.includes('west bengal')) {
    if (d.includes('kolkata')||c.includes('kolkata'))
      return Z('metro','metro_sfc','metro_air','C','E','metro','metros','metros_air','metros_sfc','east_i','e1','metro','Metro Cities');
    return Z('south_west','roi_sfc','mh_guj_air','D','E','roi_a','metros','metros_air','metros_sfc','east_ii','e2','roi','Rest of India');
  }

  // ── Gujarat / Daman / Dadra ──
  if (s.includes('gujarat')||s.includes('dadra')||s.includes('daman')||s.includes('diu')) {
    const isMajor=d.includes('ahmedabad')||c.includes('ahmedabad')||d.includes('surat')||c.includes('surat')||d.includes('vadodara')||c.includes('vadodara')||d.includes('baroda')||c.includes('baroda');
    return Z('metro',isMajor?'metro_patna_sfc':'mh_guj_sfc','metro_air',isMajor?'C':'D',isMajor?'W1':'W1',
      isMajor?'metro':'roi_a','metros','metros_air','metros_sfc',
      isMajor?'west_i':'west_ii',isMajor?'w1':'w2',isMajor?'metro':'roi',
      isMajor?'Metro Cities':'Rest of India');
  }

  // ── Maharashtra / Goa ──
  if (s.includes('maharashtra')||s.includes('goa')) {
    if (d.includes('mumbai')||c.includes('mumbai')||d.includes('pune')||c.includes('pune')||d.includes('thane')||c.includes('thane'))
      return Z('metro','metro_patna_sfc','metro_air','C','W2','metro','metros','metros_air','metros_sfc','west_i','w1','metro','Metro Cities');
    if (s.includes('goa'))
      return Z('south_west','mh_guj_sfc','mh_guj_air','D','W2','roi_a','roi','roi_air','roi_sfc','south_iii','w2','roi','Rest of India');
    return Z('south_west','mh_guj_sfc','mh_guj_air','D','W2','roi_a','metros','metros_air','metros_sfc','west_ii','w2','roi','Rest of India');
  }

  // ── Andhra / Telangana ──
  if (s.includes('andhra')||s.includes('telangana')) {
    if (d.includes('hyderabad')||c.includes('hyderabad'))
      return Z('metro','metro_sfc','metro_air','C','S1','metro','metros','metros_air','metros_sfc','south_i','s1','metro','Metro Cities');
    return Z('south_west','roi_sfc','roi_air','D','S1','roi_a','metros','metros_air','metros_sfc','south_ii','s2','roi','Rest of India');
  }

  // ── Karnataka ──
  if (s.includes('karnataka')) {
    if (d.includes('bangalore')||d.includes('bengaluru')||c.includes('bangalore')||c.includes('bengaluru'))
      return Z('metro','metro_sfc','metro_air','C','S1','metro','metros','metros_air','metros_sfc','south_i','s1','metro','Metro Cities');
    return Z('south_west','roi_sfc','roi_air','D','S1','roi_a','roi','roi_air','roi_sfc','south_ii','s2','roi','Rest of India');
  }

  // ── Tamil Nadu / Pondicherry ──
  if (s.includes('tamil')||s.includes('pondicherry')||s.includes('puducherry')) {
    if (d.includes('chennai')||c.includes('chennai'))
      return Z('metro','metro_sfc','metro_air','C','S1','metro','metros','metros_air','metros_sfc','south_i','s1','metro','Metro Cities');
    return Z('south_west','roi_sfc','roi_air','D','S1','roi_a','roi','roi_air','roi_sfc','south_ii','s2','roi','Rest of India');
  }

  // ── Kerala ──
  if (s.includes('kerala'))
    return Z('south_west','roi_sfc','roi_air','D','S2','roi_b','roi','roi_air','roi_sfc','south_iii','s3','roi','Rest of India');

  // ── Default ──
  return Z('south_west','roi_sfc','roi_air','D','N1','roi_a','roi','roi_air','roi_sfc','north_ii','n2','roi','Rest of India');
}

// ─── PROPOSAL SELLING RATES ───────────────────────────────────────────────
// All prices are BASE before FSC+GST. FSC 25%, GST 18%.
// Economy tier — Trackon Exp, Delhivery, DTDC 7X/7D/7G, GEC, LTL, B2B
const SELL_DOC_ECO = {
  'Delhi & NCR':             {w250:22,  w500:25,  addl:12},
  'North India':             {w250:28,  w500:40,  addl:14},
  'Metro Cities':            {w250:35,  w500:55,  addl:35},
  'Rest of India':           {w250:40,  w500:65,  addl:38},
  'North East':              {w250:65,  w500:80,  addl:45},
  'Diplomatic / Port Blair': {w250:75,  w500:95,  addl:50},
};
// Premium tier — Trackon Prime Track, DTDC Priority X, BlueDart
const SELL_DOC_PREM = {
  'Delhi & NCR':             {w250:30,  w500:38,  addl:18},
  'North India':             {w250:40,  w500:58,  addl:20},
  'Metro Cities':            {w250:50,  w500:80,  addl:50},
  'Rest of India':           {w250:58,  w500:95,  addl:55},
  'North East':              {w250:90,  w500:115, addl:65},
  'Diplomatic / Port Blair': {w250:110, w500:140, addl:75},
};
const SELL_SFC_ECO = {
  'Delhi & NCR':             {s3:22,  s10:20,  s25:18,  s50:16,  s100:15},
  'North India':             {s3:30,  s10:28,  s25:25,  s50:22,  s100:20},
  'Metro Cities':            {s3:35,  s10:32,  s25:30,  s50:29,  s100:27},
  'Rest of India':           {s3:45,  s10:43,  s25:40,  s50:38,  s100:35},
  'North East':              {s3:55,  s10:52,  s25:50,  s50:47,  s100:45},
  'Diplomatic / Port Blair': {s3:120, s10:110, s25:90,  s50:85,  s100:80},
};
const SELL_SFC_PREM = {
  'Delhi & NCR':             {s3:30,  s10:28,  s25:25,  s50:22,  s100:20},
  'North India':             {s3:42,  s10:40,  s25:36,  s50:32,  s100:28},
  'Metro Cities':            {s3:50,  s10:46,  s25:42,  s50:40,  s100:36},
  'Rest of India':           {s3:62,  s10:58,  s25:55,  s50:52,  s100:48},
  'North East':              {s3:75,  s10:70,  s25:68,  s50:64,  s100:60},
  'Diplomatic / Port Blair': {s3:160, s10:145, s25:120, s50:110, s100:100},
};
const SELL_AIR = {
  'Srinagar Sector': {lt5:72,  t10:70,  t25:65,  t50:62,  g50:60},
  'Bihar & JH':      {lt5:80,  t10:78,  t25:75,  t50:72,  g50:70},
  'Metro Cities':    {lt5:85,  t10:80,  t25:78,  t50:75,  g50:74},
  'Rest of India':   {lt5:88,  t10:85,  t25:82,  t50:80,  g50:78},
  'North East':      {lt5:95,  t10:90,  t25:85,  t50:82,  g50:80},
  'Port Blair':      {lt5:125, t10:110, t25:100, t50:95,  g50:90},
};
const AIR_SELL_MAP = {
  delhi:'Metro Cities',ncr:'Metro Cities',north_cities:'Metro Cities',north_state:'Srinagar Sector',
  metro:'Metro Cities',central_air:'Bihar & JH',central_sfc:'Rest of India',
  south_west:'Rest of India',ne:'North East',port_blair:'Port Blair',
};
// Seahawk zone → proposal seahawkZone uses these keys for doc/sfc lookup
const SEAHAWK_DOC_ZONE_MAP = {
  'Delhi & NCR':'Delhi & NCR','North India':'North India','Metro Cities':'Metro Cities',
  'Rest of India':'Rest of India','North East':'North East','Diplomatic / Port Blair':'Diplomatic / Port Blair',
};

function rnd(n){return Math.round(n*100)/100;}
function ceil1(n){return Math.ceil(n);} // ceil to nearest 1 kg
function ceil05(n){return Math.ceil(n*2)/2;} // ceil to nearest 0.5

// Build sell price + breakdown
function proposalSell(zone, w, shipType, level='economy') {
  const FSC=0.25, GST=0.18;
  const szKey = zone.seahawkZone;
  const src = level==='premium'?'Proposal (Premium)':'Proposal (Economy)';

  if (shipType==='doc') {
    const tbl=level==='premium'?SELL_DOC_PREM:SELL_DOC_ECO;
    const r=tbl[szKey]||tbl['Rest of India'];
    const cw=ceil05(w);
    let b=cw<=0.25?r.w250:cw<=0.5?r.w500:r.w500+Math.ceil((cw-0.5)/0.5)*r.addl;
    const fsc=rnd(b*FSC),sub=b+fsc;
    return {base:rnd(b),fsc:fsc,fscPct:'25%',gst:rnd(sub*GST),total:rnd(sub*(1+GST)),source:src};
  }
  if (shipType==='surface') {
    const tbl=level==='premium'?SELL_SFC_PREM:SELL_SFC_ECO;
    const r=tbl[szKey]||tbl['Rest of India'];
    if(w<3)return null;
    const cw=ceil1(w);
    const rate=cw<=10?r.s3:cw<=25?r.s10:cw<=50?r.s25:cw<=100?r.s50:r.s100;
    const b=Math.max(cw,3)*rate,fsc=rnd(b*FSC),sub=b+fsc;
    return {base:rnd(b),fsc:fsc,fscPct:'25%',gst:rnd(sub*GST),total:rnd(sub*(1+GST)),source:src};
  }
  if (shipType==='air') {
    if(w<3)return null;
    const airZone=AIR_SELL_MAP[zone.trackon]||'Rest of India';
    const r=SELL_AIR[airZone]||SELL_AIR['Rest of India'];
    const cw=ceil1(w);
    const rate=cw<5?r.lt5:cw<=10?r.t10:cw<=25?r.t25:cw<=50?r.t50:r.g50;
    const b=Math.max(cw,3)*rate,fsc=rnd(b*FSC),sub=b+fsc;
    return {base:rnd(b),fsc:fsc,fscPct:'25%',gst:rnd(sub*GST),total:rnd(sub*(1+GST)),source:'Proposal (Air)'};
  }
  return null;
}

// ─── COST RATE TABLES (all from verified partner files) ──────────────────

// TRACKON EXPRESS — T_S_RATE.pdf w.e.f 01 Apr 2025 (per consignment)
const TK_EXP={
  delhi:       {w250:12,  w500:12.5,addl:6   },
  ncr:         {w250:14,  w500:14.5,addl:7   },
  north_cities:{w250:17,  w500:18,  addl:10  },
  north_state: {w250:19,  w500:20,  addl:13.5},
  central_air: {w250:29,  w500:40,  addl:38.5},  // Bihar/JH/MP/CG air route
  central_sfc: {w250:22,  w500:22,  addl:16.5},  // Bihar/JH/MP/CG surface route
  metro:       {w250:25,  w500:42.5,addl:40  },
  south_west:  {w250:27.5,w500:49.5,addl:46  },
  ne:          {w250:46,  w500:63,  addl:55  },
  port_blair:  {w250:65,  w500:85,  addl:80  },
};

// TRACKON SURFACE — T_S_RATE.pdf (per kg, MCW 3kg)
const TK_SFC={
  delhi:           {s3:12,  s10:11,  s25:10.5,s50:9,  s100:8.5},
  ncr:             {s3:13.5,s10:12.5,s25:12,  s50:10, s100:9.5},
  north_cities_sfc:{s3:18.5,s10:17.5,s25:16.5,s50:14, s100:13 },
  metro_patna_sfc: {s3:23,  s10:22,  s25:21,  s50:20, s100:18 },
  north_state_sfc: {s3:25,  s10:24,  s25:23,  s50:22, s100:20 },
  metro_sfc:       {s3:27,  s10:26,  s25:24,  s50:22, s100:21 },
  rest_bihar_sfc:  {s3:30,  s10:27,  s25:25,  s50:23, s100:22 },
  mh_guj_sfc:      {s3:30,  s10:29,  s25:28,  s50:26, s100:25 },
  cg_jh_mp_sfc:    {s3:33,  s10:30,  s25:27,  s50:25, s100:24 },
  roi_sfc:         {s3:37,  s10:36,  s25:35,  s50:33, s100:30 },
  ne_sfc:          {s3:48,  s10:45,  s25:43,  s50:40, s100:38 },
  kashmir_sfc:     {s3:35,  s10:33,  s25:31,  s50:28, s100:27 },
  port_blair_sfc:  {s3:150, s10:145, s25:142, s50:140,s100:135},
};

// TRACKON AIR — T_S_RATE.pdf (per kg, MCW 3kg)
const TK_AIR={
  srinagar_air:  {lt5:45, t10:43, t25:41, t50:38, g50:36 },
  metro_air:     {lt5:72, t10:71, t25:69, t50:66, g50:64 },
  metros_air:    {lt5:72, t10:71, t25:69, t50:66, g50:64 },
  central_mp_air:{lt5:74, t10:73, t25:71, t50:69, g50:65 },
  bihar_jh_air:  {lt5:74, t10:73, t25:71, t50:69, g50:65 },
  mh_guj_air:    {lt5:80, t10:78, t25:76, t50:74, g50:71 },
  roi_air:       {lt5:84, t10:81, t25:78, t50:75, g50:72 },
  guwahati_air:  {lt5:88, t10:87, t25:85, t50:82, g50:80 },
  ne_air:        {lt5:115,t10:113,t25:110,t50:108,g50:105},
  port_blair_air:{lt5:150,t10:145,t25:142,t50:140,g50:135},
};

// TRACKON PRIME TRACK — Prime_Track_Tariff w.e.f. 01 Apr 2025 (CN ₹35 + GST, no FSC)
// Zones: city/region/zone/metro/roi/spl
const TK_PT={
  city:  {w250:12, w500:16, addl:14,pkg:28 },
  region:{w250:36, w500:40, addl:30,pkg:60 },
  zone:  {w250:40, w500:44, addl:36,pkg:70 },
  metro: {w250:60, w500:66, addl:54,pkg:106},
  roi:   {w250:78, w500:86, addl:72,pkg:140},
  spl:   {w250:94, w500:103,addl:87,pkg:160},
};
// Map trackon zone → Prime Track zone
function ptZone(tkZone){
  const M={delhi:'city',ncr:'region',north_cities:'region',north_state:'zone',
    central_air:'metro',central_sfc:'metro',metro:'metro',south_west:'roi',ne:'spl',port_blair:'spl'};
  return M[tkZone]||'roi';
}

// DELHIVERY STANDARD — Final_Outlet_Rates (no FSC, GST 18%)
// Zones: A=Within City, B=Regional, C=Metro-Metro, D=Rest India, E=Jammu/HP/NE, F=Kashmir/Manipur/Ladakh/AN
const DL_STD={
  A:{b250:27, b500:3,  t1:10, u2:55,  a2:17, u5:100, a5:12, u10:160, a10:10},
  B:{b250:29, b500:3,  t1:15, u2:70,  a2:22, u5:130, a5:14, u10:200, a10:12},
  C:{b250:32, b500:9,  t1:29, u2:95,  a2:28, u5:170, a5:19, u10:265, a10:17},
  D:{b250:34, b500:11, t1:45, u2:120, a2:33, u5:210, a5:25, u10:335, a10:22},
  E:{b250:41, b500:14, t1:55, u2:150, a2:44, u5:270, a5:25, u10:395, a10:22},
  F:{b250:46, b500:14, t1:60, u2:170, a2:55, u5:320, a5:30, u10:470, a10:25},
};

// DELHIVERY EXPRESS — Final_Outlet_Rates (no FSC, GST 18%)
const DL_EXP={
  A:{w500:30,addl:25},B:{w500:32,addl:28},C:{w500:49,addl:44},
  D:{w500:61,addl:56},E:{w500:85,addl:85},F:{w500:100,addl:90},
};

// B2B COURIER — B2B_rates.pdf (origin Gurgaon N1)
// Docket ₹250, FSC 15%, Green tax max(₹0.5/kg,₹100), MCW 20kg, Min charge ₹350 (excl docket/green), GST 18%
const B2B_RATE={N1:6,N2:6,E:11.5,NE:16,W1:8.5,W2:9.5,S1:11.5,S2:14.5,Central:8.5};

// DTDC PRIORITY X — Priority_TS_Rates.xlsx w.e.f 01 Jan 2024 (FSC 35%)
const DTDC_XDOC={
  local: {w250:13,w500:15,addl:15},region:{w250:16,w500:19,addl:19},
  zone:  {w250:19,w500:24,addl:22},metro: {w250:26,w500:39,addl:44},
  roi_a: {w250:33,w500:46,addl:53},roi_b: {w250:36,w500:52,addl:57},spl:{w250:43,w500:65,addl:72},
};
const DTDC_XNDX={
  local:[27,25,23,21],region:[32,29,27,26],zone:[41,39,37,34],metro:[82,79,76,74],
  roi_a:[93,88,86,84],roi_b:[103,99,97,95],spl:[140,134,129,124],
};

// DTDC Ecomm 7X — CP_TS_Rates Gold w.e.f 01 Jan 2024 (FSC 35% + Book Cost ₹12)
const DTDC_7X={
  local:{w500:18,addl:13},region:{w500:23,addl:15},zone:{w500:30,addl:27},metro:{w500:39,addl:42},
  roi_a:{w500:41,addl:47},roi_b:{w500:45,addl:50},spl:{w500:55,addl:60},
};

// DTDC Ecomm 7D — CP_TS_Rates Gold (FSC 35% + Book Cost ₹12)
const DTDC_7D={
  local: {w500:18,addl:13,pkg:16},region:{w500:23,addl:15,pkg:19},zone:  {w500:25,addl:18,pkg:23},
  metro: {w500:28,addl:25,pkg:38},roi_a: {w500:31,addl:27,pkg:44},roi_b: {w500:37,addl:29,pkg:47},spl:{w500:47,addl:37,pkg:52},
};

// DTDC Ecomm 7G — CP_TS_Rates Gold per kg (FSC 35% + Book Cost ₹12)
const DTDC_7G={
  local:{lt10:14,gt10:13},region:{lt10:15,gt10:14},zone:{lt10:18,gt10:16},metro:{lt10:23,gt10:20},
  roi_a:{lt10:24,gt10:21},roi_b:{lt10:25,gt10:23},spl:{lt10:29,gt10:27},
};

// GEC Transhipment — GEC_TS_Rates.xlsx GA tier w.e.f. 16 Jan 2024
// Rates FROM Gurgaon (North I) to each zone, per kg, FSC 20%, Docket ₹75, MCW 50kg, Min charge ₹275
const GEC_RATES={
  // FROM North I column (origin Gurgaon): North I row through North East III row
  north_i:6.25,north_ii:6.5,north_iii:7.75,
  west_i:10.5, west_ii:11.25,
  central_i:10.5,central_ii:12,
  south_i:11.5,south_ii:12.5,south_iii:13.5,
  east_i:10.5, east_ii:11.25,
  ne_i:12,     ne_ii:12,     ne_iii:12,
};

// LTL Road Express — LTL rate sheet (origin Gurgaon)
// FSC 15%, Doc ₹100, MCW 40kg, Min freight ₹750, Env max(₹0.5/kg,₹100), GST 18%
const LTL_RATES={n1:7.25,n2:7.7,n3:7.9,c1:9.8,c2:10.8,e1:13.6,e2:14.1,w1:11.25,w2:11.75,s1:13.5,s2:13.8,s3:13.8,ne1:22.5,ne2:24.5};

// BLUEDART Express — DEL_TS Z_LITE sheet (FSC 35%)
const BD_EXP={
  local:   {w250:13.5,w500:13.5,addl:6.5},ncr:     {w250:15.5,w500:16,  addl:8.5},
  north:   {w250:19.5,w500:20,  addl:15 },srinagar: {w250:23.5,w500:27.5,addl:23 },
  bihar_jh:{w250:23.5,w500:45.5,addl:42 },metros:   {w250:28,  w500:48.5,addl:46 },
  roi:     {w250:31,  w500:53.5,addl:51 },
};

// BLUEDART Air — DEL_TS (per kg, MCW 3kg, FSC 35%)
const BD_AIR={
  srinagar_air:{lt5:51,t10:49,t25:47,t50:44,g50:41},
  bihar_jh_air:{lt5:80,t10:77,t25:69,t50:65,g50:58},
  metros_air:  {lt5:85,t10:81,t25:78,t50:71,g50:65},
  roi_air:     {lt5:96,t10:93,t25:90,t50:85,g50:80},
};

// BLUEDART Surface — DEL_TS (per kg, MCW 3kg local/5kg outzone, FSC 35%)
const BD_SFC={
  local_sfc:{lt5:14.5,t10:14,  t25:12,  t50:11.5,g50:10  },
  ncr_sfc:  {lt5:16,  t10:15.5,t25:13.5,t50:13,  g50:12  },
  north_sfc:{lt5:28.5,t10:27.5,t25:23.5,t50:21.5,g50:18.5},
  metros_sfc:{lt5:41, t10:40,  t25:33,  t50:30,  g50:27  },
  roi_sfc:  {lt5:46,  t10:45,  t25:38,  t50:36,  g50:34  },
};

// ─── COURIER COST CALCULATION (returns detailed breakdown object) ─────────
function courierCost(id, zone, w, odaAmt=0) {
  let base=0, fsc=0, fscPct='', docket=0, green=0, extra=0, notes=[], mcwApplied=false;

  switch(id) {

    case 'trackon_exp': {
      const r=TK_EXP[zone.trackon]||TK_EXP.south_west;
      const cw=ceil05(w);
      base=cw<=0.25?r.w250:cw<=0.5?r.w500:r.w500+Math.ceil((cw-0.5)/0.5)*r.addl;
      fsc=rnd(base*0.23); fscPct='23% (FSC18%+Dev5%)'; break;
    }
    case 'trackon_sfc': {
      if(w<3)return null;
      const r=TK_SFC[zone.trackon_sfc]||TK_SFC.roi_sfc;
      const cw=Math.max(ceil1(w),3); if(w<cw)mcwApplied=true;
      const rate=cw<=10?r.s3:cw<=25?r.s10:cw<=50?r.s25:cw<=100?r.s50:r.s100;
      base=rnd(cw*rate); fsc=rnd(base*0.23); fscPct='23% (FSC18%+Dev5%)';
      if(mcwApplied)notes.push('MCW 3kg applied'); break;
    }
    case 'trackon_air': {
      if(w<3)return null;
      const r=TK_AIR[zone.trackon_air]||TK_AIR.roi_air;
      const cw=Math.max(ceil1(w),3); if(w<cw)mcwApplied=true;
      const rate=cw<5?r.lt5:cw<=10?r.t10:cw<=25?r.t25:cw<=50?r.t50:r.g50;
      base=rnd(cw*rate); fsc=rnd(base*0.23); fscPct='23% (FSC18%+Dev5%)';
      if(mcwApplied)notes.push('MCW 3kg applied'); break;
    }
    case 'trackon_pt': {
      const ptz=ptZone(zone.trackon);
      const r=TK_PT[ptz]||TK_PT.roi;
      const cw=w<=3?ceil05(w):ceil1(w);
      if(cw<=0.25) base=r.w250;
      else if(cw<=0.5) base=r.w500;
      else if(cw<=3) base=r.w500+Math.ceil((cw-0.5)/0.5)*r.addl;
      else base=rnd(cw*r.pkg);
      docket=35; fscPct='None'; break;
    }
    case 'delhivery_std': {
      const r=DL_STD[zone.delhivery]||DL_STD.D;
      const cw=ceil05(w);
      base=cw<=0.25?r.b250
        :cw<=0.5 ?r.b250+r.b500
        :cw<=1   ?r.b250+r.b500+r.t1
        :cw<=2   ?r.u2
        :cw<=5   ?r.u2+Math.ceil(cw-2)*r.a2
        :cw<=10  ?r.u5+Math.ceil(cw-5)*r.a5
        :          r.u10+Math.ceil(cw-10)*r.a10;
      fscPct='None'; break;
    }
    case 'delhivery_exp': {
      const r=DL_EXP[zone.delhivery]||DL_EXP.D;
      const cw=ceil05(w);
      base=cw<=0.5?r.w500:r.w500+Math.ceil((cw-0.5)/0.5)*r.addl;
      fscPct='None'; break;
    }
    case 'b2b': {
      const rate=B2B_RATE[zone.b2b]||9.5;
      const cw=Math.max(ceil1(w),20); if(w<cw)mcwApplied=true;
      const freight=rnd(cw*rate);
      fsc=rnd(freight*0.15); fscPct='15%';
      docket=250;
      green=Math.max(rnd(cw*0.5),100);
      base=freight;
      const minFreight=350;
      if(freight+fsc<minFreight){
        notes.push(`Min freight ₹${minFreight} applied`);
        const diff=minFreight-(freight+fsc);
        base=rnd(base+diff);
      }
      notes.push(`Docket ₹${docket} + Green tax ₹${green}`);
      if(mcwApplied)notes.push('MCW 20kg applied'); break;
    }
    case 'dtdc_xdoc': {
      const r=DTDC_XDOC[zone.dtdc]||DTDC_XDOC.roi_a;
      const cw=ceil05(w);
      base=cw<=0.25?r.w250:cw<=0.5?r.w500:r.w500+Math.ceil((cw-0.5)/0.5)*r.addl;
      fsc=rnd(base*0.35); fscPct='35%'; break;
    }
    case 'dtdc_xndx': {
      if(w<3)return null;
      const nd=DTDC_XNDX[zone.dtdc]||DTDC_XNDX.roi_a;
      const cw=Math.max(ceil1(w),3); if(w<cw)mcwApplied=true;
      const rate=cw<=25?nd[0]:cw<=50?nd[1]:cw<=100?nd[2]:nd[3];
      base=rnd(cw*rate); fsc=rnd(base*0.35); fscPct='35%';
      if(mcwApplied)notes.push('MCW 3kg applied'); break;
    }
    case 'dtdc_7x': {
      const r=DTDC_7X[zone.dtdc]||DTDC_7X.roi_a;
      const cw=ceil05(w);
      base=cw<=0.5?r.w500:r.w500+Math.ceil((cw-0.5)/0.5)*r.addl;
      fsc=rnd(base*0.35); fscPct='35%'; docket=12; notes.push('Book cost ₹12'); break;
    }
    case 'dtdc_7d': {
      const r=DTDC_7D[zone.dtdc]||DTDC_7D.roi_a;
      const cw=ceil05(w);
      if(cw<=0.5)      base=r.w500;
      else if(cw<=5)   base=r.w500+Math.ceil((cw-0.5)/0.5)*r.addl;
      else             base=r.w500+Math.ceil((5-0.5)/0.5)*r.addl+Math.ceil(cw-5)*r.pkg;
      fsc=rnd(base*0.35); fscPct='35%'; docket=12; notes.push('Book cost ₹12'); break;
    }
    case 'dtdc_7g': {
      if(w<1)return null;
      const r=DTDC_7G[zone.dtdc]||DTDC_7G.roi_a;
      const cw=Math.max(ceil1(w),1);
      const rate=cw<=10?r.lt10:r.gt10;
      base=rnd(cw*rate); fsc=rnd(base*0.35); fscPct='35%'; docket=12; notes.push('Book cost ₹12'); break;
    }
    case 'gec_sfc': {
      if(w<1)return null;
      const rate=GEC_RATES[zone.gec]||GEC_RATES.north_ii;
      const cw=Math.max(ceil1(w),50); if(w<cw)mcwApplied=true;
      base=rnd(cw*rate); fsc=rnd(base*0.20); fscPct='20%'; docket=75;
      const minCharge=275;
      if(base+fsc<minCharge){notes.push(`Min ₹${minCharge} applied`);base=rnd(minCharge-fsc);}
      if(mcwApplied)notes.push('MCW 50kg applied'); break;
    }
    case 'ltl_road': {
      if(w<1)return null;
      const rate=LTL_RATES[zone.ltl]||LTL_RATES.n2;
      const cw=Math.max(ceil1(w),40); if(w<cw)mcwApplied=true;
      base=rnd(cw*rate); fsc=rnd(base*0.15); fscPct='15%';
      docket=100; green=Math.max(rnd(cw*0.5),100);
      const minFreight=750;
      if(base+fsc<minFreight){notes.push(`Min ₹${minFreight} applied`);base=rnd(minFreight-fsc);}
      notes.push(`Env. charge ₹${green}`);
      if(mcwApplied)notes.push('MCW 40kg applied'); break;
    }
    case 'bluedart_exp': {
      const r=BD_EXP[zone.bd]||BD_EXP.roi;
      const cw=ceil05(w);
      base=cw<=0.25?r.w250:cw<=0.5?r.w500:r.w500+Math.ceil((cw-0.5)/0.5)*r.addl;
      fsc=rnd(base*0.35); fscPct='35%'; break;
    }
    case 'bluedart_air': {
      if(w<3)return null;
      const r=BD_AIR[zone.bd_air]||BD_AIR.roi_air;
      const cw=Math.max(ceil1(w),3); if(w<cw)mcwApplied=true;
      const rate=cw<5?r.lt5:cw<=10?r.t10:cw<=25?r.t25:cw<=50?r.t50:r.g50;
      base=rnd(cw*rate); fsc=rnd(base*0.35); fscPct='35%';
      if(mcwApplied)notes.push('MCW 3kg applied'); break;
    }
    case 'bluedart_sfc': {
      const isLocal=zone.bd==='local'||zone.bd==='ncr';
      const mcw=isLocal?3:5;
      if(w<mcw)return null;
      const r=BD_SFC[zone.bd_sfc]||BD_SFC.roi_sfc;
      const cw=Math.max(ceil1(w),mcw); if(w<cw)mcwApplied=true;
      const rate=cw<5?r.lt5:cw<=10?r.t10:cw<=25?r.t25:cw<=50?r.t50:r.g50;
      base=rnd(cw*rate); fsc=rnd(base*0.35); fscPct='35%';
      if(mcwApplied)notes.push(`MCW ${mcw}kg applied`); break;
    }
    default: return null;
  }

  const subtotal=rnd(base+fsc+docket+green);
  const gst=rnd(subtotal*0.18);
  const oda=odaAmt||0;
  const total=rnd(subtotal+gst+oda);
  return {base,fsc,fscPct,docket,green,subtotal,gst,oda,total,notes,mcwApplied};
}

// ─── COURIER DEFINITIONS ─────────────────────────────────────────────────
const COURIERS=[
  {id:'trackon_exp',  label:'Trackon Express',          group:'Trackon',  mode:'Express',             color:'orange',types:['doc'],          level:'economy', rateDate:RATE_DATES.trackon},
  {id:'trackon_pt',   label:'Trackon Prime Track',      group:'Trackon',  mode:'Prime Track',          color:'red',   types:['doc','surface'],level:'premium', rateDate:RATE_DATES.primetrack},
  {id:'trackon_sfc',  label:'Trackon Surface',          group:'Trackon',  mode:'Surface · MCW 3kg',   color:'yellow',types:['surface'],       level:'economy', rateDate:RATE_DATES.trackon},
  {id:'trackon_air',  label:'Trackon Air Cargo',        group:'Trackon',  mode:'Air · MCW 3kg',       color:'amber', types:['air'],           level:'economy', rateDate:RATE_DATES.trackon},
  {id:'delhivery_exp',label:'Delhivery Express',        group:'Delhivery',mode:'Express',             color:'rose',  types:['doc'],           level:'economy', rateDate:RATE_DATES.delhivery},
  {id:'delhivery_std',label:'Delhivery Standard',       group:'Delhivery',mode:'Standard',            color:'pink',  types:['surface'],       level:'economy', rateDate:RATE_DATES.delhivery},
  {id:'b2b',          label:'B2B Courier',              group:'B2B',      mode:'Surface · MCW 20kg',  color:'blue',  types:['surface'],       level:'economy', rateDate:RATE_DATES.b2b},
  {id:'dtdc_7x',      label:'DTDC Ecomm 7X',            group:'DTDC',     mode:'Priority',             color:'cyan',  types:['doc'],           level:'economy', rateDate:RATE_DATES.dtdc},
  {id:'dtdc_7d',      label:'DTDC Ecomm 7D',            group:'DTDC',     mode:'Ground Express',      color:'teal',  types:['doc','surface'], level:'economy', rateDate:RATE_DATES.dtdc},
  {id:'dtdc_7g',      label:'DTDC Ecomm 7G',            group:'DTDC',     mode:'Ground Cargo',        color:'green', types:['surface'],       level:'economy', rateDate:RATE_DATES.dtdc},
  {id:'dtdc_xdoc',    label:'DTDC Priority X (Doc)',    group:'DTDC',     mode:'X-Series · Doc',      color:'emerald',types:['doc'],          level:'premium', rateDate:RATE_DATES.dtdc},
  {id:'dtdc_xndx',    label:'DTDC Priority X (Parcel)',group:'DTDC',     mode:'X-Series · Parcel',   color:'lime',  types:['surface'],       level:'premium', rateDate:RATE_DATES.dtdc},
  {id:'gec_sfc',      label:'GEC Surface',              group:'GEC',      mode:'Tranship · MCW 50kg', color:'sky',   types:['surface'],       level:'economy', rateDate:RATE_DATES.gec},
  {id:'ltl_road',     label:'LTL Road Express',         group:'LTL',      mode:'Road · MCW 40kg',     color:'slate', types:['surface'],       level:'economy', rateDate:RATE_DATES.ltl},
  {id:'bluedart_exp', label:'BlueDart Express',         group:'BlueDart', mode:'Express',             color:'indigo',types:['doc'],           level:'premium', rateDate:RATE_DATES.bluedart},
  {id:'bluedart_air', label:'BlueDart Air Cargo',       group:'BlueDart', mode:'Air · MCW 3kg',       color:'violet',types:['air'],           level:'premium', rateDate:RATE_DATES.bluedart},
  {id:'bluedart_sfc', label:'BlueDart Surface',         group:'BlueDart', mode:'Surface · MCW 3/5kg', color:'purple',types:['surface'],       level:'premium', rateDate:RATE_DATES.bluedart},
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
  {label:'Chandigarh',state:'Punjab',district:'Chandigarh',city:'chandigarh'},
  {label:'Ludhiana',state:'Punjab',district:'Ludhiana',city:'ludhiana'},
  {label:'Amritsar',state:'Punjab',district:'Amritsar',city:'amritsar'},
  {label:'Jaipur',state:'Rajasthan',district:'Jaipur',city:'jaipur'},
  {label:'Jodhpur',state:'Rajasthan',district:'Jodhpur',city:'jodhpur'},
  {label:'Lucknow',state:'Uttar Pradesh',district:'Lucknow',city:'lucknow'},
  {label:'Kanpur',state:'Uttar Pradesh',district:'Kanpur',city:'kanpur'},
  {label:'Agra',state:'Uttar Pradesh',district:'Agra',city:'agra'},
  {label:'Varanasi',state:'Uttar Pradesh',district:'Varanasi',city:'varanasi'},
  {label:'Meerut',state:'Uttar Pradesh',district:'Meerut',city:'meerut'},
  {label:'Dehradun',state:'Uttarakhand',district:'Dehradun',city:'dehradun'},
  {label:'Shimla',state:'Himachal Pradesh',district:'Shimla',city:'shimla'},
  {label:'Jammu',state:'Jammu And Kashmir',district:'Jammu',city:'jammu'},
  {label:'Srinagar',state:'Jammu And Kashmir',district:'Srinagar',city:'srinagar'},
  {label:'Leh / Ladakh',state:'Ladakh',district:'Leh',city:'leh'},
  {label:'Patna',state:'Bihar',district:'Patna',city:'patna'},
  {label:'Ranchi',state:'Jharkhand',district:'Ranchi',city:'ranchi'},
  {label:'Jamshedpur',state:'Jharkhand',district:'East Singhbhum',city:'jamshedpur'},
  {label:'Bhopal',state:'Madhya Pradesh',district:'Bhopal',city:'bhopal'},
  {label:'Indore',state:'Madhya Pradesh',district:'Indore',city:'indore'},
  {label:'Raipur',state:'Chhattisgarh',district:'Raipur',city:'raipur'},
  {label:'Nagpur',state:'Maharashtra',district:'Nagpur',city:'nagpur'},
  {label:'Kolkata',state:'West Bengal',district:'Kolkata',city:'kolkata'},
  {label:'Bhubaneswar',state:'Odisha',district:'Khurda',city:'bhubaneswar'},
  {label:'Guwahati',state:'Assam',district:'Kamrup',city:'guwahati'},
  {label:'Shillong',state:'Meghalaya',district:'East Khasi Hills',city:'shillong'},
  {label:'Agartala',state:'Tripura',district:'West Tripura',city:'agartala'},
  {label:'Imphal',state:'Manipur',district:'Imphal West',city:'imphal'},
  {label:'Ahmedabad',state:'Gujarat',district:'Ahmedabad',city:'ahmedabad'},
  {label:'Surat',state:'Gujarat',district:'Surat',city:'surat'},
  {label:'Vadodara',state:'Gujarat',district:'Vadodara',city:'vadodara'},
  {label:'Mumbai',state:'Maharashtra',district:'Mumbai',city:'mumbai'},
  {label:'Pune',state:'Maharashtra',district:'Pune',city:'pune'},
  {label:'Thane',state:'Maharashtra',district:'Thane',city:'thane'},
  {label:'Goa / Panaji',state:'Goa',district:'North Goa',city:'panaji'},
  {label:'Hyderabad',state:'Telangana',district:'Hyderabad',city:'hyderabad'},
  {label:'Visakhapatnam',state:'Andhra Pradesh',district:'Visakhapatnam',city:'vizag'},
  {label:'Bengaluru / Bangalore',state:'Karnataka',district:'Bengaluru',city:'bangalore'},
  {label:'Mysore',state:'Karnataka',district:'Mysore',city:'mysore'},
  {label:'Chennai',state:'Tamil Nadu',district:'Chennai',city:'chennai'},
  {label:'Coimbatore',state:'Tamil Nadu',district:'Coimbatore',city:'coimbatore'},
  {label:'Kochi / Ernakulam',state:'Kerala',district:'Ernakulam',city:'kochi'},
  {label:'Trivandrum',state:'Kerala',district:'Thiruvananthapuram',city:'trivandrum'},
  {label:'Port Blair',state:'Andaman And Nicobar Islands',district:'South Andamans',city:'port blair'},
];

const fmt  =n=>`₹${Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtI =n=>`₹${Math.round(n||0).toLocaleString('en-IN')}`;
const fmtP =n=>`${(n||0).toFixed(1)}%`;
const pColor=m=>m>30?'text-green-700':m>15?'text-amber-600':m>0?'text-orange-600':'text-red-600';

const WEIGHT_POINTS=[0.25,0.5,1,2,3,5,10,15,20,25,30,40,50,75,100];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────
export default function RateCalculatorPage() {
  // ── Destination ──
  const [query,    setQuery]   = useState('');
  const [zone,     setZone]    = useState(null);
  const [locInfo,  setLocInfo] = useState(null);
  const [pinLoad,  setPinLoad] = useState(false);
  const [pinError, setPinErr]  = useState('');

  // ── Weight ──
  const [weight,   setWeight]  = useState('');
  const [useVol,   setUseVol]  = useState(false);
  const [dims,     setDims]    = useState({l:'',b:'',h:''});

  // ── Shipment type & level ──
  const [shipType, setType]    = useState('doc');
  const [svcLevel, setSvcLevel]= useState('all');

  // ── ODA ──
  const [odaOn,    setOdaOn]   = useState(false);
  const [odaAmt,   setOdaAmt]  = useState(200);

  // ── Client ──
  const [clients,      setClients]     = useState([]);
  const [selClient,    setSelClient]   = useState(null);
  const [contracts,    setContracts]   = useState([]);
  const [contractLoad, setContractLoad]= useState(false);
  const [clientSearch, setClientSearch]= useState('');
  const [showClients,  setShowClients] = useState(false);

  // ── Selling price ──
  const [customPrice,  setCustomPrice] = useState('');
  const [editPrice,    setEditPrice]   = useState(false);

  // ── Display ──
  const [sortMode,   setSortMode]  = useState('profit');
  const [showAll,    setShowAll]   = useState(false);
  const [expanded,   setExpanded]  = useState(null); // courier id with expanded breakdown
  const [tab,        setTab]       = useState('calc');// calc | sensitivity | quote
  const [showSettings,setShowSettings]=useState(false);
const [hiddenIds,  setHiddenIds] = useState(() => { try { return new Set(JSON.parse(sessionStorage.getItem('sh_hidden_couriers') || '[]')); } catch { return new Set(); } });
  // ── Recent searches ──
  const [recent, setRecent] = useState([]);

  // ── Reverse margin ──
  const [targetMargin, setTargetMargin] = useState('');

  // ── Quote ──
  const [quoteNote, setQuoteNote] = useState('');
  const [quoteCourier, setQuoteCourier] = useState(null);
  const [savingQuote, setSavingQuote] = useState(false);
  const [quoteSaved, setQuoteSaved] = useState(null); // { quoteNo }

  // ── Zone confidence ──
  const [zoneConf, setZoneConf] = useState(null); // 'high'|'medium'|'low'

  // ── Margin rules (from backend) ──
  const [marginRules, setMarginRules] = useState([]);

  // Load clients
  useEffect(()=>{api.get('/clients').then(r=>setClients(r.data?.data||[])).catch(()=>{});},[]);

  // Load margin rules from backend (for floor warnings)
  useEffect(()=>{
    api.get('/rates/margin-rules')
      .then(r=>setMarginRules((r.data?.data||[]).filter(mr=>mr.active)))
      .catch(()=>{});
  },[]);

  // Load contracts when client changes
  useEffect(()=>{
    if(!selClient){setContracts([]);return;}
    setContractLoad(true);
    api.get(`/contracts/client/${selClient.code}`)
      .then(r=>setContracts(r.data?.data||[]))
      .catch(()=>setContracts([]))
      .finally(()=>setContractLoad(false));
  },[selClient]);

  // Persist hidden couriers
 useEffect(()=>{
    sessionStorage.setItem('sh_hidden_couriers', JSON.stringify([...hiddenIds]));
  },[hiddenIds]);
  const lookupPin = useCallback(async pin=>{
    setPinLoad(true);setPinErr('');setZone(null);setLocInfo(null);
    try{
      const res=await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data=await res.json();
      if(data[0]?.Status==='Success'&&data[0]?.PostOffice?.length>0){
        const po=data[0].PostOffice[0];
        const z=stateToZones(po.State,po.District,po.Name);
        setZone(z);
        const li={label:`${po.District}, ${po.State}`,pincode:pin};
        setLocInfo(li);
        setZoneConf('high');
        addRecent({query:pin,zone:z,locInfo:li});
      }else setPinErr('PIN not found — try city search.');
    }catch{setPinErr('PIN lookup failed — check connection.');}
    finally{setPinLoad(false);}
  },[]);

  const addRecent=useCallback(entry=>{
    setRecent(r=>[entry,...r.filter(e=>e.query!==entry.query)].slice(0,5));
  },[]);

  const isPin=/^\d+$/.test(query.trim());
  const suggestions=useMemo(()=>{
    if(!query||isPin||zone)return[];
    return CITY_LIST.filter(c=>c.label.toLowerCase().includes(query.toLowerCase())).slice(0,8);
  },[query,isPin,zone]);

  const handleQueryChange=v=>{
    setQuery(v);setZone(null);setLocInfo(null);setPinErr('');setZoneConf(null);
    setCustomPrice('');setEditPrice(false);setExpanded(null);
    if(/^\d{6}$/.test(v.trim()))lookupPin(v.trim());
  };
  const selectCity=c=>{
    setQuery(c.label);
    const z=stateToZones(c.state,c.district,c.city);
    const li={label:`${c.district}, ${c.state}`,pincode:null};
    setZone(z);setLocInfo(li);
    setZoneConf('medium');
    setCustomPrice('');setEditPrice(false);setExpanded(null);
    addRecent({query:c.label,zone:z,locInfo:li,zoneConf:'medium'});
  };
  const loadRecent=r=>{
    setQuery(r.query);setZone(r.zone);setLocInfo(r.locInfo);
    setZoneConf(r.zoneConf||'medium');
    setPinErr('');setCustomPrice('');setEditPrice(false);setExpanded(null);
  };

  // Volumetric weight
  const volWt=useMemo(()=>(!useVol||!dims.l||!dims.b||!dims.h)?0
    :(parseFloat(dims.l)||0)*(parseFloat(dims.b)||0)*(parseFloat(dims.h)||0)/5000,[useVol,dims]);
  const chargeWt=useMemo(()=>Math.max(parseFloat(weight)||0,volWt),[weight,volWt]);

  // Selling price
  const proposalSellPrice=useMemo(()=>{
    if(!zone||!chargeWt)return null;
    const lvl=svcLevel==='premium'?'premium':'economy';
    return proposalSell(zone,chargeWt,shipType,lvl);
  },[zone,chargeWt,shipType,svcLevel]);

  const activeContract=useMemo(()=>{
    if(!contracts.length||!chargeWt)return null;
    const today=new Date().toISOString().split('T')[0];
    const valid=contracts.filter(c=>c.active&&(!c.validFrom||c.validFrom<=today)&&(!c.validTo||c.validTo>=today));
    if(!valid.length)return null;
    const c=valid[0];
    let base=c.pricingType==='PER_KG'?chargeWt*c.baseRate:c.baseRate;
    base=Math.max(base,c.minCharge||0);
    const fsc=rnd(base*((c.fuelSurcharge||0)/100)),sub=base+fsc,gst=rnd(sub*((c.gstPercent||18)/100));
    return{name:c.name,total:rnd(sub+gst),base:rnd(base),fsc,gst,fscPct:`${c.fuelSurcharge||0}%`,source:`Contract: ${c.name}`};
  },[contracts,chargeWt]);

  const effectiveSell=useMemo(()=>{
    if(customPrice&&parseFloat(customPrice)>0)
      return{total:parseFloat(customPrice),source:'Manual Override',base:parseFloat(customPrice),fsc:0,gst:0,fscPct:'—'};
    if(activeContract)return activeContract;
    return proposalSellPrice;
  },[customPrice,activeContract,proposalSellPrice]);

  // Reverse margin → required sell price
  const reverseSell=useMemo(()=>{
    if(!targetMargin||!zone||!chargeWt)return null;
    const margin=parseFloat(targetMargin)/100;
    if(margin>=1)return null;
    return null; // computed per-courier below
  },[targetMargin,zone,chargeWt]);

  const getPerCourierSell=useCallback((courierLevel)=>{
    if(customPrice&&parseFloat(customPrice)>0)return parseFloat(customPrice);
    if(activeContract)return activeContract.total;
    if(!zone||!chargeWt)return 0;
    return proposalSell(zone,chargeWt,shipType,courierLevel)?.total||0;
  },[customPrice,activeContract,zone,chargeWt,shipType]);

  // Results
  const results=useMemo(()=>{
    if(!zone||!chargeWt)return[];
    const oda=odaOn?parseFloat(odaAmt)||0:0;
    return COURIERS
      .filter(c=>c.types.includes(shipType))
      .filter(c=>svcLevel==='all'||c.level===svcLevel)
      .filter(c=>!hiddenIds.has(c.id))
      .map(c=>{
        const bk=courierCost(c.id,zone,chargeWt,oda);
        if(!bk)return null;
        const sell=getPerCourierSell(c.level);
        const profit=rnd(sell-bk.total);
        const margin=sell>0?rnd((profit/sell)*100):0;
        return{...c,bk,sell,profit,margin};
      }).filter(Boolean)
      .sort((a,b)=>sortMode==='profit'?b.profit-a.profit:a.bk.total-b.bk.total);
  },[zone,chargeWt,effectiveSell,sortMode,shipType,svcLevel,hiddenIds,odaOn,odaAmt,getPerCourierSell]);

  // Sensitivity data (for selected shipType, vary weight)
  const sensitivityData=useMemo(()=>{
    if(!zone)return[];
    const topIds=COURIERS.filter(c=>c.types.includes(shipType)&&!hiddenIds.has(c.id)).map(c=>c.id);
    return WEIGHT_POINTS.map(w=>{
      const row={w};
      topIds.forEach(id=>{
        const bk=courierCost(id,zone,w,0);
        row[id]=bk?bk.total:null;
      });
      return row;
    });
  },[zone,shipType,hiddenIds]);

  const filteredClients=useMemo(()=>
    clients.filter(c=>(c.company||'').toLowerCase().includes(clientSearch.toLowerCase())).slice(0,8)
  ,[clients,clientSearch]);

  // Margin floor check — returns the violated rule or null
  const getMarginWarning = useCallback((courierId, margin) => {
    if (!marginRules.length || !zone) return null;
    const applicable = marginRules.filter(rule => {
      if (rule.courier && rule.courier !== courierId) return false;
      if (rule.zone && rule.zone !== zone.seahawkZone) return false;
      if (rule.shipType && rule.shipType !== shipType) return false;
      return true;
    });
    if (!applicable.length) return null;
    // Most specific rule wins (courier+zone > courier > zone > global)
    const sorted = [...applicable].sort((a,b)=>
      ((b.courier?2:0)+(b.zone?1:0)) - ((a.courier?2:0)+(a.zone?1:0))
    );
    const rule = sorted[0];
    return margin < rule.minMarginPct ? rule : null;
  }, [marginRules, zone, shipType]);

  // Save quote to DB
  const handleSaveQuote = async () => {
    const c = quoteCourier || best;
    if (!c) return;
    setSavingQuote(true);
    try {
      const payload = {
        clientCode:  selClient?.code || null,
        destination: locInfo?.label  || query,
        pincode:     locInfo?.pincode || null,
        state:       zone?.seahawkZone || '',
        district:    '',
        shipType,
        weight:      chargeWt,
        courier:     c.label,
        courierMode: c.mode,
        costTotal:   c.bk.total,
        sellTotal:   c.sell,
        profit:      c.profit,
        margin:      c.margin,
        notes:       quoteNote || null,
        status:      'QUOTED',
      };
      const res = await api.post('/quotes', payload);
      const qno = res.data?.quoteNo || res.data?.data?.quoteNo || '';
      setQuoteSaved({ quoteNo: qno });
    } catch (e) {
      console.error('Save quote failed', e);
    } finally {
      setSavingQuote(false);
    }
  };

  const best=results[0];
  const displayed=showAll?results:results.slice(0,6);
  const byType=COURIERS.filter(c=>c.types.includes(shipType)&&!hiddenIds.has(c.id));
  const ecoCount=byType.filter(c=>c.level==='economy').length;
  const premCount=byType.filter(c=>c.level==='premium').length;
  const bannerColor=customPrice?'bg-amber-700':activeContract?'bg-purple-800':'bg-slate-800';

  const toggleHide=id=>{
    setHiddenIds(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});
  };

  const handlePrint=()=>{
    const c=quoteCourier||best;
    if(!c)return;
    const win=window.open('','_blank');
    win.document.write(`
      <html><head><title>Rate Quote</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;max-width:600px;margin:auto;}
      h1{color:#1e293b}table{width:100%;border-collapse:collapse;margin-top:20px}
      td,th{padding:8px 12px;border:1px solid #e2e8f0;text-align:left}
      th{background:#f8fafc;font-weight:600}.total{font-size:1.4em;font-weight:700;color:#166534}
      .footer{margin-top:30px;font-size:0.8em;color:#64748b}</style></head><body>
      <h1>Seahawk Logistics — Rate Quote</h1>
      <p><b>Date:</b> ${new Date().toLocaleDateString('en-IN')}&nbsp;&nbsp;
         <b>Client:</b> ${selClient?.company||'—'}&nbsp;&nbsp;
         <b>Valid:</b> 30 days</p>
      <table><tr><th>Field</th><th>Value</th></tr>
        <tr><td>Destination</td><td>${locInfo?.label||query}</td></tr>
        <tr><td>Courier</td><td>${c.label} (${c.mode})</td></tr>
        <tr><td>Chargeable Weight</td><td>${chargeWt} kg</td></tr>
        <tr><td>Courier Cost (incl. all)</td><td>${fmt(c.bk.total)}</td></tr>
        <tr><td><b>Selling Price</b></td><td class="total">${fmt(c.sell)}</td></tr>
        <tr><td>Your Profit</td><td style="color:${c.profit>0?'green':'red'}">${fmt(c.profit)}</td></tr>
        <tr><td>Margin</td><td>${fmtP(c.margin)}</td></tr>
      </table>
      ${quoteNote?`<p style="margin-top:20px"><b>Notes:</b> ${quoteNote}</p>`:''}
      <div class="footer">Rates as per partner agreements. ODA/remote surcharges may apply.
        Contact us for bulk or annual contracts.</div></body></html>`);
    win.document.close();win.print();
  };

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="p-4 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courier Rate & Profit Calculator</h1>
          <p className="text-xs text-gray-400 mt-0.5">17 services · Trackon · Delhivery · DTDC (5) · GEC · LTL · BlueDart · B2B · All rates from partner documents</p>
        </div>
        <button onClick={()=>setShowSettings(!showSettings)}
          className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${showSettings?'bg-slate-800 text-white border-slate-800':'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}>
          <Settings className="w-3.5 h-3.5"/>Couriers
        </button>
      </div>

      {/* Courier settings panel */}
      {showSettings&&(
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Show / Hide Couriers</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
            {COURIERS.map(c=>(
              <button key={c.id} onClick={()=>toggleHide(c.id)}
                className={`text-left px-2.5 py-2 rounded-lg border text-xs flex items-center gap-2 transition-all ${
                  hiddenIds.has(c.id)?'bg-gray-50 border-gray-200 text-gray-400 line-through':'bg-white border-gray-200 text-gray-800 hover:border-blue-300'
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.level==='premium'?'bg-violet-500':'bg-green-500'}`}/>
                <span className="truncate">{c.label}</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-2">Settings saved to browser. <span className="text-violet-600">● Premium</span> <span className="text-green-600">● Economy</span></p>
        </div>
      )}

      {/* Recent searches */}
      {recent.length>0&&!zone&&(
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-[10px] text-gray-400 self-center mr-1">Recent:</span>
          {recent.map((r,i)=>(
            <button key={i} onClick={()=>loadRecent(r)}
              className="text-xs bg-white border border-gray-200 rounded-full px-2.5 py-1 hover:border-slate-400 flex items-center gap-1 text-gray-600">
              <Clock className="w-2.5 h-2.5 opacity-50"/>{r.query}
            </button>
          ))}
        </div>
      )}

      {/* Top inputs row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">

        {/* Destination card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">📍 Destination</p>
          <div className="relative">
            {pinLoad?<Loader className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin"/>
                    :<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>}
            <input className="input pl-9 text-sm" placeholder="PIN code or city name…"
              value={query} onChange={e=>handleQueryChange(e.target.value)} maxLength={50}/>
            {zone&&<button onClick={()=>{setQuery('');setZone(null);setLocInfo(null);setExpanded(null);}}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600"><X className="w-3.5 h-3.5"/></button>}
          </div>
          {isPin&&query.length<6&&<p className="text-[10px] text-gray-400 mt-1">Enter all 6 digits…</p>}
          {suggestions.length>0&&(
            <div className="border border-gray-100 rounded-xl mt-1 overflow-hidden max-h-40 overflow-y-auto shadow-sm">
              {suggestions.map((c,i)=>(
                <button key={i} onClick={()=>selectCity(c)}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 text-xs border-b border-gray-50 last:border-0 flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-gray-300 shrink-0"/>
                  <span><strong>{c.label}</strong><span className="text-gray-400 ml-1">— {c.state}</span></span>
                </button>
              ))}
            </div>
          )}
          {pinError&&<p className="text-[10px] text-red-500 mt-1.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/>{pinError}</p>}
          {locInfo&&zone&&(
            <div className="mt-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-green-800 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3"/>  {locInfo.label}
                  </p>
                  {locInfo.pincode&&<p className="text-[10px] text-green-600">PIN {locInfo.pincode}</p>}
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${odaOn?'bg-amber-100 text-amber-800':'bg-green-100 text-green-700'}`}>
                  {odaOn?'ODA':'Standard'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {[['TK',zone.trackon],['DL','Z-'+zone.delhivery],['DTDC',zone.dtdc],['BD',zone.bd],['GEC',zone.gec],['LTL',zone.ltl]].map(([k,v])=>(
                  <span key={k} className="text-[9px] bg-white border border-green-200 rounded-full px-1.5 py-0.5 text-green-700">
                    <span className="opacity-50">{k}:</span>{v}
                  </span>
                ))}
              </div>
              {/* Zone confidence indicator */}
              {zoneConf && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${zoneConf==='high'?'bg-green-500':zoneConf==='medium'?'bg-blue-400':'bg-amber-400'}`}/>
                  <span className={`text-[9px] font-bold uppercase tracking-wide ${zoneConf==='high'?'text-green-700':zoneConf==='medium'?'text-blue-600':'text-amber-600'}`}>
                    {zoneConf==='high'?'HIGH':zoneConf==='medium'?'MEDIUM':'LOW'} confidence
                  </span>
                  <span className="text-[9px] text-gray-400">
                    {zoneConf==='high'?'· PIN verified · exact district known':zoneConf==='medium'?'· known city · district matched':'· state-level estimate only'}
                  </span>
                </div>
              )}
              {/* ODA toggle */}
              <div className="mt-2 pt-2 border-t border-green-100 flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-gray-600 font-semibold">
                  <input type="checkbox" checked={odaOn} onChange={e=>setOdaOn(e.target.checked)} className="w-3 h-3"/>
                  ODA surcharge
                </label>
                {odaOn&&(
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-[10px] text-gray-400">₹</span>
                    <input type="number" min="0" className="w-16 text-[10px] border border-amber-200 rounded px-1 py-0.5 text-center"
                      value={odaAmt} onChange={e=>setOdaAmt(e.target.value)}/>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Weight card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">⚖️ Weight</p>
          <input type="number" step="0.1" min="0" className="input mb-2"
            placeholder="Actual weight (kg)" value={weight} onChange={e=>setWeight(e.target.value)}/>
          <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 mb-2">
            <input type="checkbox" checked={useVol} onChange={e=>setUseVol(e.target.checked)}/>
            Include volumetric (L×W×H ÷ 5000)
          </label>
          {useVol&&(
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {['l','b','h'].map(k=>(
                <input key={k} type="number" min="0" placeholder={k.toUpperCase()+' cm'}
                  className="input text-xs py-1.5"
                  value={dims[k]} onChange={e=>setDims(d=>({...d,[k]:e.target.value}))}/>
              ))}
            </div>
          )}
          {chargeWt>0&&(
            <div className="text-xs bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-2 text-blue-700">
              Chargeable weight: <strong>{chargeWt.toFixed(2)} kg</strong>
              {volWt>0&&<span className="opacity-60 ml-1.5">(vol: {volWt.toFixed(2)} kg)</span>}
            </div>
          )}
          {/* Reverse margin */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Target className="w-3 h-3"/>Reverse: target margin
            </p>
            <div className="flex items-center gap-2">
              <input type="number" min="0" max="99" className="input flex-1 text-xs py-1.5"
                placeholder="e.g. 30" value={targetMargin} onChange={e=>setTargetMargin(e.target.value)}/>
              <span className="text-xs text-gray-400 font-bold">%</span>
            </div>
            {targetMargin&&parseFloat(targetMargin)>0&&results.length>0&&(()=>{
              const m=parseFloat(targetMargin)/100;
              const minSell=m<1?rnd(results[0].bk.total/(1-m)):null;
              return minSell?(
                <p className="text-[10px] mt-1 text-emerald-700 font-semibold">
                  Charge ≥ {fmt(minSell)} using {results[0].label} to hit {targetMargin}% margin
                </p>
              ):null;
            })()}
          </div>
        </div>

        {/* Type + Level card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">📦 Shipment Type</p>
          <div className="space-y-1.5 mb-3">
            {[
              {id:'doc',    icon:<FileText className="w-3.5 h-3.5"/>,  label:'Document / Packet',   desc:'Express · per consignment'},
              {id:'surface',icon:<Truck className="w-3.5 h-3.5"/>,     label:'Heavy Surface Cargo', desc:'Road · per kg · MCW varies'},
              {id:'air',    icon:<Wind className="w-3.5 h-3.5"/>,      label:'Heavy Air Cargo',     desc:'Air · per kg · MCW 3kg'},
            ].map(t=>(
              <button key={t.id} onClick={()=>{setType(t.id);setExpanded(null);setShowAll(false);}}
                className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center gap-2.5 ${
                  shipType===t.id?'border-slate-700 bg-slate-50 text-slate-800':'border-gray-100 text-gray-600 hover:border-gray-300'}`}>
                <span className={shipType===t.id?'text-slate-700':'text-gray-400'}>{t.icon}</span>
                <div><p className="font-bold">{t.label}</p><p className="text-gray-400">{t.desc}</p></div>
              </button>
            ))}
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">🏷 Service Level</p>
          <div className="flex gap-1.5">
            {[['all','All',null],['economy','💰 Economy','bg-green-600'],['premium','⭐ Premium','bg-violet-600']].map(([id,label,active])=>(
              <button key={id} onClick={()=>setSvcLevel(id)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                  svcLevel===id?(active||'bg-slate-700')+' text-white border-transparent'
                              :'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                {label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 text-center">{ecoCount} economy · {premCount} premium</p>
          {shipType==='air'&&(
            <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
              <p className="text-[9px] text-amber-700"><strong>Note:</strong> Air cargo from Delhi/NCR: Trackon Air Cargo + BlueDart Air Cargo only. Other couriers are surface-only.</p>
            </div>
          )}
        </div>
      </div>

      {/* Client row */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">👤 Client — auto-loads contract rate</p>
          {selClient&&<button onClick={()=>{setSelClient(null);setContracts([]);setClientSearch('');}}
            className="text-[10px] text-gray-400 hover:text-red-500 flex items-center gap-1"><X className="w-3 h-3"/>Clear</button>}
        </div>
        {selClient?(
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-700">
              {selClient.company?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-sm">{selClient.company}</p>
              <p className="text-xs text-gray-400">{selClient.code}
                {contractLoad&&<span className="ml-2 text-blue-500">Loading contracts…</span>}
                {!contractLoad&&contracts.length>0&&<span className="ml-2 text-purple-600 font-semibold">✓ {contracts.length} contract{contracts.length>1?'s':''} active</span>}
                {!contractLoad&&!contracts.length&&<span className="ml-2 text-amber-500">No active contracts — using proposal rates</span>}
              </p>
            </div>
            {activeContract&&<div className="ml-auto text-right">
              <p className="text-[10px] text-purple-600 font-bold uppercase">Contract Rate</p>
              <p className="text-sm font-bold">{fmt(activeContract.total)}</p>
            </div>}
          </div>
        ):(
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input className="input pl-9 text-sm" placeholder="Search client by name or code…"
              value={clientSearch}
              onChange={e=>{setClientSearch(e.target.value);setShowClients(true);}}
              onFocus={()=>setShowClients(true)}/>
            {showClients&&clientSearch&&filteredClients.length>0&&(
              <div className="absolute top-full left-0 right-0 z-20 bg-white border border-gray-100 rounded-xl mt-1 shadow-lg overflow-hidden">
                {filteredClients.map(c=>(
                  <button key={c.id} onClick={()=>{setSelClient(c);setShowClients(false);setClientSearch('');}}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0">
                    <span className="font-semibold">{c.company}</span>
                    <span className="text-gray-400 text-xs ml-2">{c.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selling price banner */}
      {effectiveSell&&(
        <div className={`${bannerColor} text-white rounded-2xl p-4 mb-3`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{effectiveSell.source}</span>
                <button onClick={()=>setEditPrice(!editPrice)} className="bg-white/20 hover:bg-white/30 rounded-lg p-1 transition-all"><Edit3 className="w-3 h-3"/></button>
                {customPrice&&<button onClick={()=>{setCustomPrice('');setEditPrice(false);}} className="text-[10px] bg-white/20 hover:bg-red-500/50 px-2 py-0.5 rounded-lg">Reset</button>}
              </div>
              {editPrice?(
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl font-bold opacity-60">₹</span>
                  <input type="number" min="0" autoFocus
                    className="bg-white/20 border border-white/30 rounded-xl px-3 py-1.5 text-white text-2xl font-bold w-40 placeholder-white/40 focus:outline-none"
                    placeholder="Price…" value={customPrice} onChange={e=>setCustomPrice(e.target.value)}/>
                </div>
              ):(
                <>
                  <p className="text-3xl font-bold">{fmt(effectiveSell.total)}</p>
                  {/* Dual price display in All mode */}
                  {!customPrice&&!activeContract&&svcLevel==='all'&&zone&&chargeWt>0&&shipType!=='air'&&(()=>{
                    const ep=proposalSell(zone,chargeWt,shipType,'economy');
                    const pp=proposalSell(zone,chargeWt,shipType,'premium');
                    return ep&&pp?(
                      <div className="flex gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] bg-white/15 rounded-lg px-2 py-1">💰 Economy: <strong>{fmt(ep.total)}</strong></span>
                        <span className="text-[10px] bg-white/15 rounded-lg px-2 py-1">⭐ Premium: <strong>{fmt(pp.total)}</strong></span>
                        <span className="text-[10px] text-white/50 self-center">each courier uses its own tier's price</span>
                      </div>
                    ):null;
                  })()}
                </>
              )}
              {effectiveSell.fsc>0&&(
                <p className="text-[10px] opacity-50 mt-0.5">
                  Base {fmt(effectiveSell.base)} + FSC {fmtP(parseFloat(effectiveSell.fscPct)||0)} {fmt(effectiveSell.fsc)} + GST {fmt(effectiveSell.gst)}
                </p>
              )}
            </div>
            <div className="flex gap-2 shrink-0 flex-wrap">
              {['profit','cost'].map(m=>(
                <button key={m} onClick={()=>setSortMode(m)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${sortMode===m?'bg-white text-gray-800':'bg-white/20 hover:bg-white/30 text-white'}`}>
                  {m==='profit'?'↑ Max Profit':'↓ Lowest Cost'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {results.length>0&&(
        <div className="flex gap-1 mb-3 bg-gray-100 p-1 rounded-xl w-fit">
          {[['calc','Calculator',Calculator],['sensitivity','Sensitivity',BarChart2],['quote','Quote',Printer]].map(([id,label,Icon])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${tab===id?'bg-white shadow-sm text-slate-800':'text-gray-500 hover:text-gray-700'}`}>
              <Icon className="w-3.5 h-3.5"/>{label}
            </button>
          ))}
        </div>
      )}

      {/* CALCULATOR TAB ── */}
      {(!results.length||tab==='calc')&&(
        <>
          {/* Best courier banner */}
          {best&&(
            <div className={`rounded-2xl p-4 mb-3 flex flex-wrap items-center justify-between gap-3 text-white ${best.profit>0?'bg-gradient-to-r from-green-600 to-emerald-500':'bg-gradient-to-r from-red-600 to-rose-500'}`}>
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 shrink-0"/>
                <div>
                  <p className="text-[10px] opacity-80 uppercase font-bold tracking-wide">{sortMode==='profit'?'Most Profitable':'Cheapest Option'}</p>
                  <p className="font-bold text-lg leading-tight">{best.label}
                    <span className="opacity-70 text-sm font-normal ml-2">({best.mode})</span>
                    <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${best.level==='premium'?'bg-white/20':'bg-white/10'}`}>
                      {best.level==='premium'?'⭐':'💰'} {best.level}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex gap-5 text-center">
                <div><p className="text-[10px] opacity-70">Courier Cost</p><p className="font-bold text-lg">{fmt(best.bk.total)}</p></div>
                <div><p className="text-[10px] opacity-70">Your Profit</p><p className={`font-bold text-lg ${best.profit<0?'text-red-200':''}`}>{fmt(best.profit)}</p></div>
                <div><p className="text-[10px] opacity-70">Margin</p><p className="font-bold text-lg">{fmtP(best.margin)}</p></div>
              </div>
            </div>
          )}

          {/* Results list */}
          {results.length>0&&(
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-3">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-sm text-gray-700">All Options — {sortMode==='profit'?'highest profit first':'cheapest first'}</h2>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {odaOn&&<span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">ODA +{fmt(odaAmt)}</span>}
                  <span>{results.length} services</span>
                </div>
              </div>

              <div className="divide-y divide-gray-50">
                {displayed.map((r,i)=>(
                  <div key={r.id}>
                    {/* Row */}
                    <div onClick={()=>setExpanded(expanded===r.id?null:r.id)}
                      className={`px-4 py-3 flex flex-wrap items-center gap-3 cursor-pointer transition-all hover:bg-gray-50 ${
                        i===0?'bg-green-50/60':r.profit<0?'bg-red-50/30':''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${i===0?'bg-green-600 text-white':'bg-gray-100 text-gray-500'}`}>{i+1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="font-bold text-sm">{r.label}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${CLR[r.color]}`}>{r.mode}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${r.level==='premium'?'bg-violet-100 text-violet-700':'bg-gray-100 text-gray-500'}`}>
                            {r.level==='premium'?'⭐':'💰'} {r.level}
                          </span>
                          {i===0&&<span className="text-[9px] font-bold bg-green-600 text-white px-1.5 py-0.5 rounded-full">{sortMode==='profit'?'BEST PROFIT':'CHEAPEST'}</span>}
                          {r.profit<0&&<span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">LOSS</span>}
                          {r.profit>=0&&(()=>{const w=getMarginWarning(r.id,r.margin);return w?<span className="text-[9px] font-bold bg-orange-100 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded-full">⚠ Below {w.minMarginPct}% floor</span>:null;})()}
                          {r.bk.notes.length>0&&<span className="text-[9px] text-gray-400">⚠ {r.bk.notes[0]}</span>}
                        </div>
                        <div className="flex gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                          <span>Cost: <strong className="text-gray-700">{fmt(r.bk.total)}</strong></span>
                          <span>Sell: <strong className="text-gray-700">{fmt(r.sell)}</strong>
                            {svcLevel==='all'&&!customPrice&&!activeContract&&
                              <span className={`ml-1 ${r.level==='premium'?'text-violet-500':'text-green-600'}`}>({r.level==='premium'?'⭐ prem':'💰 eco'})</span>}
                          </span>
                          <span className="text-[10px] text-gray-300">Rate: {r.rateDate}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-5 text-right shrink-0">
                        <div><p className="text-[10px] text-gray-400">Profit</p>
                          <p className={`font-bold text-base ${r.profit>0?'text-green-700':r.profit<0?'text-red-600':'text-gray-500'}`}>{fmt(r.profit)}</p></div>
                        <div><p className="text-[10px] text-gray-400">Margin</p>
                          <p className={`font-bold text-base ${pColor(r.margin)}`}>{fmtP(r.margin)}</p></div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-300 shrink-0 transition-transform ${expanded===r.id?'rotate-90':''}`}/>
                    </div>

                    {/* Expanded breakdown */}
                    {expanded===r.id&&(
                      <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 text-xs">
                        <p className="font-bold text-slate-700 mb-2 text-[10px] uppercase tracking-wide">Full Cost Breakdown — {r.label}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            ['Base Freight', fmt(r.bk.base)],
                            ['FSC ('+r.bk.fscPct+')', fmt(r.bk.fsc)],
                            r.bk.docket>0&&['Docket/CN/Book', fmt(r.bk.docket)],
                            r.bk.green>0&&['Green/Env. tax', fmt(r.bk.green)],
                            ['Subtotal', fmt(r.bk.subtotal)],
                            ['GST 18%', fmt(r.bk.gst)],
                            r.bk.oda>0&&['ODA Surcharge', fmt(r.bk.oda)],
                            ['Total Cost', fmt(r.bk.total)],
                          ].filter(Boolean).map(([k,v],j)=>(
                            <div key={j} className={`bg-white rounded-lg px-2.5 py-2 border ${k==='Total Cost'?'border-slate-300 bg-slate-100':'border-gray-100'}`}>
                              <p className="text-[9px] text-gray-400 uppercase tracking-wide">{k}</p>
                              <p className={`font-bold mt-0.5 ${k==='Total Cost'?'text-slate-800 text-sm':'text-gray-700'}`}>{v}</p>
                            </div>
                          ))}
                        </div>
                        {r.bk.notes.length>0&&(
                          <p className="text-[10px] text-amber-600 mt-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0"/>{r.bk.notes.join(' · ')}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200">
                          <span className="text-[10px] text-gray-400">If you charge {fmt(r.sell)}:</span>
                          <span className={`text-[10px] font-bold ${r.profit>0?'text-green-700':'text-red-600'}`}>
                            {r.profit>0?`+${fmt(r.profit)} profit (${fmtP(r.margin)})`:`${fmt(r.profit)} LOSS`}
                          </span>
                          <button onClick={()=>setQuoteCourier(r)}
                            className="ml-auto text-[10px] bg-slate-800 text-white px-2 py-1 rounded-lg hover:bg-slate-700 flex items-center gap-1">
                            <Printer className="w-2.5 h-2.5"/>Use in Quote
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {results.length>6&&(
                <button onClick={()=>setShowAll(!showAll)}
                  className="w-full py-3 text-xs font-semibold text-slate-600 hover:bg-gray-50 flex items-center justify-center gap-1 border-t border-gray-100">
                  {showAll?<><ChevronUp className="w-3.5 h-3.5"/>Show less</>
                          :<><ChevronDown className="w-3.5 h-3.5"/>Show all {results.length} services</>}
                </button>
              )}
            </div>
          )}

          {/* Monthly impact */}
          {results.length>1&&best&&(
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex gap-3 mb-3">
              <Zap className="w-4 h-4 text-slate-600 shrink-0 mt-0.5"/>
              <div className="text-sm text-slate-700">
                <strong>Monthly impact (×100 shipments):</strong>{' '}
                {best.label} vs {results[results.length-1].label} →{' '}
                <strong className="text-green-700">{fmt(best.profit-results[results.length-1].profit)}</strong>/shipment ={' '}
                <strong className="text-green-700">{fmtI((best.profit-results[results.length-1].profit)*100)}</strong>/month extra.
              </div>
            </div>
          )}

          {best?.profit<0&&(
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex gap-3">
              <Info className="w-4 h-4 text-red-600 shrink-0 mt-0.5"/>
              <p className="text-sm text-red-800">
                <strong>All couriers exceed your selling price.</strong>{' '}
                {targetMargin&&`To achieve ${targetMargin}% margin, `}
                Use the manual override (✏️) above to set a higher selling price, or switch to Economy filter.
              </p>
            </div>
          )}
        </>
      )}

      {/* SENSITIVITY TAB ── */}
      {tab==='sensitivity'&&results.length>0&&(
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-3">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-bold text-sm text-gray-700">Weight Sensitivity — Cost at Different Weights</h2>
            <p className="text-xs text-gray-400 mt-0.5">Destination: {locInfo?.label} · Type: {shipType} · Showing visible couriers</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">Weight (kg)</th>
                  {COURIERS.filter(c=>c.types.includes(shipType)&&!hiddenIds.has(c.id)).map(c=>(
                    <th key={c.id} className="px-3 py-2 text-right font-semibold text-gray-500 whitespace-nowrap">{c.label.replace('Trackon ','TK ').replace('Delhivery ','DL ').replace('BlueDart ','BD ').replace('DTDC ','')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sensitivityData.map((row,i)=>(
                  <tr key={i} className={`border-t border-gray-50 ${row.w===chargeWt?'bg-blue-50':''}`}>
                    <td className={`px-3 py-1.5 font-bold ${row.w===chargeWt?'text-blue-700':''}`}>
                      {row.w} kg {row.w===chargeWt&&<span className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded">current</span>}
                    </td>
                    {COURIERS.filter(c=>c.types.includes(shipType)&&!hiddenIds.has(c.id)).map(c=>{
                      const sell=getPerCourierSell(c.level);
                      const cost=row[c.id];
                      const margin=cost&&sell?rnd((sell-cost)/sell*100):null;
                      return(
                        <td key={c.id} className={`px-3 py-1.5 text-right font-mono ${!cost?'text-gray-300':margin<0?'text-red-500':margin>30?'text-green-700':'text-gray-700'}`}>
                          {cost?<>{fmt(cost)}<span className="text-[8px] ml-0.5 opacity-60">{margin!==null?`${margin.toFixed(0)}%`:''}</span></>:'—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-gray-50 text-[10px] text-gray-400 border-t border-gray-100">
            Green = profitable · Red = loss · % = margin at current sell price. Blanks = below MCW.
          </div>
        </div>
      )}

      {/* QUOTE TAB ── */}
      {tab==='quote'&&results.length>0&&(
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h2 className="font-bold text-sm text-gray-700 mb-3">Build Quote</h2>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wide block mb-1">Select Courier</label>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {results.map(r=>(
                    <button key={r.id} onClick={()=>setQuoteCourier(r)}
                      className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-all flex items-center justify-between ${quoteCourier?.id===r.id?'border-slate-700 bg-slate-50':'border-gray-100 hover:border-gray-300'}`}>
                      <span><strong>{r.label}</strong> <span className="text-gray-400">({r.mode})</span></span>
                      <span className={r.profit>0?'text-green-700 font-bold':'text-red-500 font-bold'}>{fmt(r.profit)} · {fmtP(r.margin)}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wide block mb-1">Additional Notes (optional)</label>
                <textarea className="input text-xs h-16 resize-none" placeholder="Transit time, special handling, terms…"
                  value={quoteNote} onChange={e=>setQuoteNote(e.target.value)}/>
              </div>
              <div className="flex gap-2">
                <button onClick={handlePrint} disabled={!quoteCourier&&!best}
                  className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  <Printer className="w-4 h-4"/>Print PDF
                </button>
                <button onClick={handleSaveQuote} disabled={(!quoteCourier&&!best)||savingQuote}
                  className="flex-1 bg-green-700 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingQuote
                    ? <><Loader className="w-4 h-4 animate-spin"/>Saving…</>
                    : <><CheckCircle className="w-4 h-4"/>Save to DB</>}
                </button>
              </div>
              {quoteSaved&&(
                <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0"/>
                  <div>
                    <p className="text-xs font-bold text-green-800">Quote saved — {quoteSaved.quoteNo}</p>
                    <p className="text-[10px] text-green-600">View in <a href="/quotes" className="underline">Quote History</a></p>
                  </div>
                  <button onClick={()=>setQuoteSaved(null)} className="ml-auto text-green-400 hover:text-green-600"><X className="w-3 h-3"/></button>
                </div>
              )}
            </div>
          </div>
          {/* Quote preview */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h2 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4"/>Quote Preview
            </h2>
            {(quoteCourier||best)&&(()=>{
              const c=quoteCourier||best;
              return(
                <div className="text-xs space-y-2">
                  <div className="bg-slate-800 text-white rounded-xl p-3">
                    <p className="font-bold text-base">Seahawk Logistics</p>
                    <p className="opacity-60 text-[10px]">{new Date().toLocaleDateString('en-IN')} · Valid 30 days</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      ['Destination',locInfo?.label||query],
                      ['Client',selClient?.company||'—'],
                      ['Courier',c.label],
                      ['Mode',c.mode],
                      ['Weight',`${chargeWt} kg`],
                      ['Courier Cost',fmt(c.bk.total)],
                    ].map(([k,v])=>(
                      <div key={k} className="bg-gray-50 rounded-lg px-2.5 py-2">
                        <p className="text-[9px] text-gray-400 uppercase">{k}</p>
                        <p className="font-semibold text-gray-800">{v}</p>
                      </div>
                    ))}
                  </div>
                  <div className={`rounded-xl p-3 flex justify-between items-center ${c.profit>0?'bg-green-50 border border-green-200':'bg-red-50 border border-red-200'}`}>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Your Selling Price</p>
                      <p className="text-2xl font-bold text-slate-800">{fmt(c.sell)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500">Profit</p>
                      <p className={`text-lg font-bold ${c.profit>0?'text-green-700':'text-red-600'}`}>{fmt(c.profit)}</p>
                      <p className={`text-xs font-semibold ${pColor(c.margin)}`}>{fmtP(c.margin)} margin</p>
                    </div>
                  </div>
                  {quoteNote&&<p className="text-[10px] text-gray-500 italic">{quoteNote}</p>}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!zone&&(
        <div className="text-center py-20">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-10"/>
          <p className="text-lg font-medium text-gray-400">Enter destination to compare all 17 courier options</p>
          <p className="text-sm mt-1 text-gray-300">e.g. <strong className="text-gray-400">400019</strong> · <strong className="text-gray-400">Mumbai</strong> · <strong className="text-gray-400">Bengaluru</strong></p>
        </div>
      )}
    </div>
  );
}
