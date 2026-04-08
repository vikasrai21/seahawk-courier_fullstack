'use strict';

/**
 * smartRevenue.service.js — Intelligent Revenue Calculator
 *
 * Applies the existing rateEngine (stateToZones + proposalSell) to every
 * shipment in the import-ledger / shipments table to compute what each
 * shipment *should* have been charged based on weight, destination, and
 * courier. Returns both per-shipment detail and an aggregate summary.
 */

const prisma = require('../config/prisma');
const cache = require('../utils/cache');
const logger = require('../utils/logger');
const { stateToZones } = require('../utils/rateEngine');

const rnd = (n) => Math.round(n * 100) / 100;

/* ═══════════════════════════════════════════════════════════════════════════
   DESTINATION  →  STATE / DISTRICT / CITY  RESOLVER
   ═══════════════════════════════════════════════════════════════════════════
   When we only have a destination string (e.g. "MUMBAI" or "JAIPUR") and
   no structured state/district, we fuzzy-match it to get zone params.
   ═══════════════════════════════════════════════════════════════════════════ */

const CITY_TO_LOCATION = {
  // ── NCR / Delhi ─────────────────────────────────────────────────────
  'delhi': { state: 'delhi', district: 'delhi', city: 'delhi' },
  'new delhi': { state: 'delhi', district: 'new delhi', city: 'new delhi' },
  'noida': { state: 'uttar pradesh', district: 'gautam buddha nagar', city: 'noida' },
  'ghaziabad': { state: 'uttar pradesh', district: 'ghaziabad', city: 'ghaziabad' },
  'ghazaibad': { state: 'uttar pradesh', district: 'ghaziabad', city: 'ghaziabad' }, // typo variant
  'gurugram': { state: 'haryana', district: 'gurgaon', city: 'gurugram' },
  'gurgaon': { state: 'haryana', district: 'gurgaon', city: 'gurgaon' },
  'faridabad': { state: 'haryana', district: 'faridabad', city: 'faridabad' },
  'sonipat': { state: 'haryana', district: 'sonipat', city: 'sonipat' },
  'greater noida': { state: 'uttar pradesh', district: 'gautam buddha nagar', city: 'greater noida' },
  'bawal': { state: 'haryana', district: 'rewari', city: 'bawal' },
  'bhiwadi': { state: 'rajasthan', district: 'alwar', city: 'bhiwadi' },
  'bulandshahr': { state: 'uttar pradesh', district: 'bulandshahr', city: 'bulandshahr' },
  'bulandhaher': { state: 'uttar pradesh', district: 'bulandshahr', city: 'bulandshahr' }, // typo

  // ── Haryana (North India zone) ──────────────────────────────────────
  'karnal': { state: 'haryana', district: 'karnal', city: 'karnal' },
  'panipat': { state: 'haryana', district: 'panipat', city: 'panipat' },
  'ambala': { state: 'haryana', district: 'ambala', city: 'ambala' },
  'rohtak': { state: 'haryana', district: 'rohtak', city: 'rohtak' },
  'hissar': { state: 'haryana', district: 'hisar', city: 'hisar' },
  'hisar': { state: 'haryana', district: 'hisar', city: 'hisar' },
  'panchkula': { state: 'haryana', district: 'panchkula', city: 'panchkula' },
  'kaithal': { state: 'haryana', district: 'kaithal', city: 'kaithal' },

  // ── Punjab (North India zone) ───────────────────────────────────────
  'chandigarh': { state: 'punjab', district: 'chandigarh', city: 'chandigarh' },
  'ludhiana': { state: 'punjab', district: 'ludhiana', city: 'ludhiana' },
  'amritsar': { state: 'punjab', district: 'amritsar', city: 'amritsar' },
  'jalandhar': { state: 'punjab', district: 'jalandhar', city: 'jalandhar' },
  'patiala': { state: 'punjab', district: 'patiala', city: 'patiala' },
  'mohali': { state: 'punjab', district: 'mohali', city: 'mohali' },
  'bhatinda': { state: 'punjab', district: 'bathinda', city: 'bhatinda' },
  'bathinda': { state: 'punjab', district: 'bathinda', city: 'bathinda' },
  'sangrur': { state: 'punjab', district: 'sangrur', city: 'sangrur' },
  'barnala': { state: 'punjab', district: 'barnala', city: 'barnala' },
  'malerkotla': { state: 'punjab', district: 'malerkotla', city: 'malerkotla' },
  'pathankot': { state: 'punjab', district: 'pathankot', city: 'pathankot' },
  'rajpura': { state: 'punjab', district: 'patiala', city: 'rajpura' },
  'zirakpur': { state: 'punjab', district: 'mohali', city: 'zirakpur' },

  // ── Rajasthan (North India zone) ────────────────────────────────────
  'jaipur': { state: 'rajasthan', district: 'jaipur', city: 'jaipur' },
  'jodhpur': { state: 'rajasthan', district: 'jodhpur', city: 'jodhpur' },
  'udaipur': { state: 'rajasthan', district: 'udaipur', city: 'udaipur' },
  'kota': { state: 'rajasthan', district: 'kota', city: 'kota' },
  'ajmer': { state: 'rajasthan', district: 'ajmer', city: 'ajmer' },
  'sriganganagar': { state: 'rajasthan', district: 'sri ganganagar', city: 'sriganganagar' },

  // ── Uttar Pradesh (North India zone) ────────────────────────────────
  'lucknow': { state: 'uttar pradesh', district: 'lucknow', city: 'lucknow' },
  'kanpur': { state: 'uttar pradesh', district: 'kanpur nagar', city: 'kanpur' },
  'agra': { state: 'uttar pradesh', district: 'agra', city: 'agra' },
  'varanasi': { state: 'uttar pradesh', district: 'varanasi', city: 'varanasi' },
  'meerut': { state: 'uttar pradesh', district: 'meerut', city: 'meerut' },
  'allahabad': { state: 'uttar pradesh', district: 'allahabad', city: 'allahabad' },
  'prayagraj': { state: 'uttar pradesh', district: 'allahabad', city: 'prayagraj' },
  'gorakhpur': { state: 'uttar pradesh', district: 'gorakhpur', city: 'gorakhpur' },
  'bareilly': { state: 'uttar pradesh', district: 'bareilly', city: 'bareilly' },
  'barelly': { state: 'uttar pradesh', district: 'bareilly', city: 'bareilly' }, // typo
  'moradabad': { state: 'uttar pradesh', district: 'moradabad', city: 'moradabad' },
  'aligarh': { state: 'uttar pradesh', district: 'aligarh', city: 'aligarh' },
  'mathura': { state: 'uttar pradesh', district: 'mathura', city: 'mathura' },
  'unnao': { state: 'uttar pradesh', district: 'unnao', city: 'unnao' },
  'khurja': { state: 'uttar pradesh', district: 'bulandshahr', city: 'khurja' },
  'jhansi': { state: 'uttar pradesh', district: 'jhansi', city: 'jhansi' },
  'jhanshi': { state: 'uttar pradesh', district: 'jhansi', city: 'jhansi' }, // typo
  'sambal': { state: 'uttar pradesh', district: 'sambhal', city: 'sambhal' },

  // ── Uttarakhand (North India zone) ──────────────────────────────────
  'dehradun': { state: 'uttarakhand', district: 'dehradun', city: 'dehradun' },
  'haridwar': { state: 'uttarakhand', district: 'haridwar', city: 'haridwar' },
  'roorkee': { state: 'uttarakhand', district: 'haridwar', city: 'roorkee' },
  'ruderpur': { state: 'uttarakhand', district: 'udham singh nagar', city: 'rudrapur' },
  'rudrapur': { state: 'uttarakhand', district: 'udham singh nagar', city: 'rudrapur' },
  'udham singh': { state: 'uttarakhand', district: 'udham singh nagar', city: 'udham singh nagar' },
  'sitarganj': { state: 'uttarakhand', district: 'udham singh nagar', city: 'sitarganj' },

  // ── Himachal Pradesh (North India zone) ─────────────────────────────
  'shimla': { state: 'himachal pradesh', district: 'shimla', city: 'shimla' },
  'manali': { state: 'himachal pradesh', district: 'kullu', city: 'manali' },
  'baddi': { state: 'himachal pradesh', district: 'solan', city: 'baddi' },
  'solan': { state: 'himachal pradesh', district: 'solan', city: 'solan' },
  'palampur': { state: 'himachal pradesh', district: 'kangra', city: 'palampur' },
  'ponta sahib': { state: 'himachal pradesh', district: 'sirmaur', city: 'ponta sahib' },

  // ── Metro Cities ────────────────────────────────────────────────────
  'mumbai': { state: 'maharashtra', district: 'mumbai', city: 'mumbai' },
  'pune': { state: 'maharashtra', district: 'pune', city: 'pune' },
  'thane': { state: 'maharashtra', district: 'thane', city: 'thane' },
  'navi mumbai': { state: 'maharashtra', district: 'thane', city: 'navi mumbai' },
  'kolkata': { state: 'west bengal', district: 'kolkata', city: 'kolkata' },
  'kolkotta': { state: 'west bengal', district: 'kolkata', city: 'kolkata' }, // typo
  'calcutta': { state: 'west bengal', district: 'kolkata', city: 'kolkata' },
  'howrah': { state: 'west bengal', district: 'howrah', city: 'howrah' },
  'bangalore': { state: 'karnataka', district: 'bengaluru', city: 'bangalore' },
  'bengaluru': { state: 'karnataka', district: 'bengaluru', city: 'bengaluru' },
  'chennai': { state: 'tamil nadu', district: 'chennai', city: 'chennai' },
  'hyderabad': { state: 'telangana', district: 'hyderabad', city: 'hyderabad' },
  'ahmedabad': { state: 'gujarat', district: 'ahmedabad', city: 'ahmedabad' },
  'surat': { state: 'gujarat', district: 'surat', city: 'surat' },

  // ── Maharashtra ─────────────────────────────────────────────────────
  'nagpur': { state: 'maharashtra', district: 'nagpur', city: 'nagpur' },
  'nashik': { state: 'maharashtra', district: 'nashik', city: 'nashik' },
  'aurangabad': { state: 'maharashtra', district: 'aurangabad', city: 'aurangabad' },
  'solapur': { state: 'maharashtra', district: 'solapur', city: 'solapur' },
  'ratnagiri': { state: 'maharashtra', district: 'ratnagiri', city: 'ratnagiri' },
  'ratangiri': { state: 'maharashtra', district: 'ratnagiri', city: 'ratnagiri' }, // typo
  'bhiwandi': { state: 'maharashtra', district: 'thane', city: 'bhiwandi' },
  'dhule': { state: 'maharashtra', district: 'dhule', city: 'dhule' },

  // ── Gujarat ─────────────────────────────────────────────────────────
  'vadodara': { state: 'gujarat', district: 'vadodara', city: 'vadodara' },
  'rajkot': { state: 'gujarat', district: 'rajkot', city: 'rajkot' },
  'bharuch': { state: 'gujarat', district: 'bharuch', city: 'bharuch' },
  'bahruch': { state: 'gujarat', district: 'bharuch', city: 'bharuch' }, // typo
  'jamnagar': { state: 'gujarat', district: 'jamnagar', city: 'jamnagar' },
  'gandhinagar': { state: 'gujarat', district: 'gandhinagar', city: 'gandhinagar' },
  'virangaum': { state: 'gujarat', district: 'ahmedabad', city: 'viramgam' },
  'gujrat': { state: 'gujarat', district: '', city: '' }, // state name as destination

  // ── Tamil Nadu ──────────────────────────────────────────────────────
  'coimbatore': { state: 'tamil nadu', district: 'coimbatore', city: 'coimbatore' },
  'madurai': { state: 'tamil nadu', district: 'madurai', city: 'madurai' },
  'trichy': { state: 'tamil nadu', district: 'tiruchirappalli', city: 'trichy' },
  'hosur': { state: 'tamil nadu', district: 'krishnagiri', city: 'hosur' },
  'dindugal': { state: 'tamil nadu', district: 'dindigul', city: 'dindigul' },
  'kancheepuram': { state: 'tamil nadu', district: 'kancheepuram', city: 'kancheepuram' },
  'tamil nadu': { state: 'tamil nadu', district: '', city: '' }, // state name

  // ── Kerala ──────────────────────────────────────────────────────────
  'kochi': { state: 'kerala', district: 'ernakulam', city: 'kochi' },
  'cochin': { state: 'kerala', district: 'ernakulam', city: 'kochi' },
  'trivandrum': { state: 'kerala', district: 'thiruvananthapuram', city: 'trivandrum' },
  'thiruvananthapuram': { state: 'kerala', district: 'thiruvananthapuram', city: 'thiruvananthapuram' },
  'ernakulam': { state: 'kerala', district: 'ernakulam', city: 'ernakulam' },
  'kottayam': { state: 'kerala', district: 'kottayam', city: 'kottayam' },
  'kerala': { state: 'kerala', district: '', city: '' }, // state name

  // ── Karnataka ───────────────────────────────────────────────────────
  'mangalore': { state: 'karnataka', district: 'dakshina kannada', city: 'mangalore' },
  'mysore': { state: 'karnataka', district: 'mysuru', city: 'mysore' },
  'mysuru': { state: 'karnataka', district: 'mysuru', city: 'mysuru' },
  'belgaum': { state: 'karnataka', district: 'belgaum', city: 'belgaum' },
  'davangere': { state: 'karnataka', district: 'davanagere', city: 'davanagere' },

  // ── Andhra Pradesh / Telangana ──────────────────────────────────────
  'visakhapatnam': { state: 'andhra pradesh', district: 'visakhapatnam', city: 'visakhapatnam' },
  'vizag': { state: 'andhra pradesh', district: 'visakhapatnam', city: 'vizag' },
  'vijayawada': { state: 'andhra pradesh', district: 'krishna', city: 'vijayawada' },
  'ananantpur': { state: 'andhra pradesh', district: 'anantapur', city: 'anantapur' },
  'anantapur': { state: 'andhra pradesh', district: 'anantapur', city: 'anantapur' },
  'telengana': { state: 'telangana', district: '', city: '' }, // state name typo

  // ── Madhya Pradesh ──────────────────────────────────────────────────
  'bhopal': { state: 'madhya pradesh', district: 'bhopal', city: 'bhopal' },
  'indore': { state: 'madhya pradesh', district: 'indore', city: 'indore' },
  'gwalior': { state: 'madhya pradesh', district: 'gwalior', city: 'gwalior' },
  'jabalpur': { state: 'madhya pradesh', district: 'jabalpur', city: 'jabalpur' },
  'sagar': { state: 'madhya pradesh', district: 'sagar', city: 'sagar' },
  'rajgarh': { state: 'madhya pradesh', district: 'rajgarh', city: 'rajgarh' },

  // ── Chhattisgarh ────────────────────────────────────────────────────
  'raipur': { state: 'chhattisgarh', district: 'raipur', city: 'raipur' },

  // ── Bihar / Jharkhand ───────────────────────────────────────────────
  'patna': { state: 'bihar', district: 'patna', city: 'patna' },
  'begusarai': { state: 'bihar', district: 'begusarai', city: 'begusarai' },
  'ranchi': { state: 'jharkhand', district: 'ranchi', city: 'ranchi' },
  'jamshedpur': { state: 'jharkhand', district: 'jamshedpur', city: 'jamshedpur' },
  'deoghar': { state: 'jharkhand', district: 'deoghar', city: 'deoghar' },

  // ── Odisha ──────────────────────────────────────────────────────────
  'bhubaneswar': { state: 'odisha', district: 'khurda', city: 'bhubaneswar' },
  'bhubneswar': { state: 'odisha', district: 'khurda', city: 'bhubaneswar' }, // typo
  'cuttack': { state: 'odisha', district: 'cuttack', city: 'cuttack' },
  'puri': { state: 'odisha', district: 'puri', city: 'puri' },

  // ── West Bengal ─────────────────────────────────────────────────────
  'burdwan': { state: 'west bengal', district: 'bardhaman', city: 'burdwan' },
  'asansol': { state: 'west bengal', district: 'paschim bardhaman', city: 'asansol' },
  'west bangal': { state: 'west bengal', district: '', city: '' }, // state name typo

  // ── North East ──────────────────────────────────────────────────────
  'guwahati': { state: 'assam', district: 'kamrup', city: 'guwahati' },
  'shillong': { state: 'meghalaya', district: 'east khasi hills', city: 'shillong' },
  'imphal': { state: 'manipur', district: 'imphal', city: 'imphal' },
  'agartala': { state: 'tripura', district: 'west tripura', city: 'agartala' },
  'dimapur': { state: 'nagaland', district: 'dimapur', city: 'dimapur' },
  'gangtok': { state: 'sikkim', district: 'east sikkim', city: 'gangtok' },
  'itanagar': { state: 'arunachal pradesh', district: 'papum pare', city: 'itanagar' },

  // ── J&K ─────────────────────────────────────────────────────────────
  'srinagar': { state: 'jammu and kashmir', district: 'srinagar', city: 'srinagar' },
  'jammu': { state: 'jammu and kashmir', district: 'jammu', city: 'jammu' },

  // ── Goa ─────────────────────────────────────────────────────────────
  'goa': { state: 'goa', district: 'goa', city: 'goa' },
  'panaji': { state: 'goa', district: 'north goa', city: 'panaji' },
};

// State-name variations → canonical state name for stateToZones
const STATE_ALIASES = {
  'maharastra': 'maharashtra', 'karnatak': 'karnataka', 'tamilnadu': 'tamil nadu',
  'ap': 'andhra pradesh', 'ts': 'telangana', 'tn': 'tamil nadu',
  'wb': 'west bengal', 'up': 'uttar pradesh', 'mp': 'madhya pradesh',
  'hp': 'himachal pradesh', 'uk': 'uttarakhand', 'rj': 'rajasthan',
  'hr': 'haryana', 'pb': 'punjab', 'jk': 'jammu and kashmir',
  'cg': 'chhattisgarh', 'jh': 'jharkhand', 'or': 'odisha',
  'orissa': 'odisha', 'pondicherry': 'puducherry',
};

/**
 * Resolve a destination string to { state, district, city }.
 * Priority: exact city match → fuzzy (includes) city match → pincode DB lookup → fallback
 */
async function resolveDestination(destination, pincode) {
  const dest = String(destination || '').trim().toLowerCase();
  const pin = String(pincode || '').trim();

  // 1. Exact city match
  if (dest && CITY_TO_LOCATION[dest]) {
    return CITY_TO_LOCATION[dest];
  }

  // 2. Fuzzy match — destination text contains a known city name
  if (dest) {
    for (const [cityKey, loc] of Object.entries(CITY_TO_LOCATION)) {
      if (dest.includes(cityKey) || cityKey.includes(dest)) {
        return loc;
      }
    }
    // Check if the destination text itself is a state name
    const canonical = STATE_ALIASES[dest] || dest;
    const stateCheck = canonical.toLowerCase();
    // Try using destination as state directly
    const testZone = stateToZones(stateCheck, '', '');
    if (testZone.seahawkZone !== 'Rest of India' || stateCheck.includes('rest')) {
      return { state: stateCheck, district: '', city: '' };
    }
  }

  // 3. Pincode lookup from DelhiveryPincode table (fast, no external API)
  if (/^\d{6}$/.test(pin)) {
    try {
      const pinData = await prisma.delhiveryPincode.findUnique({ where: { pincode: pin } });
      if (pinData?.facilityState) {
        return {
          state: pinData.facilityState.toLowerCase(),
          district: '',
          city: (pinData.facilityCity || '').toLowerCase(),
        };
      }
    } catch { /* fallthrough */ }
  }

  // 4. Fallback — use destination text as-is and let stateToZones handle it
  return { state: dest || 'unknown', district: '', city: dest || '' };
}

/**
 * Determine shipType based on service field, courier, and weight.
 */
function detectShipType(service, courier, weight) {
  const svc = String(service || '').toLowerCase();
  const cour = String(courier || '').toLowerCase();

  // Air detection
  if (svc.includes('air') || svc.includes('d-air') || cour.includes('air')) return 'air';

  // Surface / SFC detection
  if (svc.includes('surface') || svc.includes('sfc') || svc.includes('d-surface')) return 'surface';
  if (svc.includes('cargo') || svc.includes('b2b') || svc.includes('ltl')) return 'surface';

  // Weight-based fallback
  if (weight >= 3) return 'surface';
  return 'doc';
}

/* ═══════════════════════════════════════════════════════════════════════════
   SEAHAWK SELLING RATES
   
   KEY BUSINESS RULES:
   1. SeaHawk charges ONE UNIFIED RATE to all clients regardless of courier
      (DTDC/Trackon/Delhivery/BlueDart). Proposal Tables 12-14 = standard.
   2. PRIORITY SERVICES have separate higher rates (Proposal Table 15).
      - Prime Track = Trackon's priority service
      - DTDC PEP/Priority = DTDC's priority service  
      - BlueDart = treated as priority service
   3. FSC (25%) and GST (18%) are ALWAYS charged ON TOP of every rate.
   ═══════════════════════════════════════════════════════════════════════════ */

// ── PRIME TRACK RATES (Trackon Priority — confirmed by owner) ─────────
// Up to 500gm base, +₹40 per additional 500gm
const SELL_PRIME_TRACK = {
  'Delhi & NCR':                { w500: 75,  addl: 40 },
  'North India':                { w500: 100, addl: 40 },
  'Metro Cities':               { w500: 100, addl: 40 },
  'Rest of India':              { w500: 140, addl: 40 },
  'North East':                 { w500: 175, addl: 50 },
  'Diplomatic / Port Blair':    { w500: 200, addl: 60 },
};

// ── PRIORITY SERVICES (Proposal Table 15) ─────────────────────────────
// For DTDC PEP, DTDC Priority, BlueDart, and any other priority courier.
// Up to 500gm, up to 1kg, +addl per 500gm
const SELL_PRIORITY = {
  'Delhi & NCR':                { w500: 70,  w1000: 100, addl: 50 },
  'North India':                { w500: 100, w1000: 140, addl: 75 },
  'Metro Cities':               { w500: 140, w1000: 190, addl: 100 },
  'Rest of India':              { w500: 140, w1000: 190, addl: 100 },
  'North East':                 { w500: 175, w1000: 225, addl: 125 },
  'Diplomatic / Port Blair':    { w500: 200, w1000: 260, addl: 140 },
};

// ── STANDARD DOC/PACKET RATES (Proposal Table 12) ────────────────────
// APPLIES TO ALL COURIERS: DTDC, Trackon, Delhivery, BlueDart, Plus, etc.
const SELL_DOC = {
  'Delhi & NCR':                { w250: 22,  w500: 25,  addl: 12 },
  'North India':                { w250: 28,  w500: 40,  addl: 14 },
  'Metro Cities':               { w250: 35,  w500: 55,  addl: 35 },
  'Rest of India':              { w250: 40,  w500: 65,  addl: 38 },
  'North East':                 { w250: 65,  w500: 80,  addl: 45 },
  'Diplomatic / Port Blair':    { w250: 75,  w500: 95,  addl: 50 },
};

// ── HEAVY CARGO SURFACE (Proposal Table 13) ─────────────────────────
// Per-kg rates, MCW 3kg. APPLIES TO ALL COURIERS.
const SELL_SURFACE = {
  'Delhi & NCR':   { s3: 25, s10: 20, s25: 18, s50: 16, s100: 15 },
  'North India':   { s3: 30, s10: 28, s25: 25, s50: 22, s100: 20 },
  'Metro Cities':  { s3: 35, s10: 32, s25: 30, s50: 29, s100: 27 },
  'Rest of India': { s3: 45, s10: 43, s25: 40, s50: 38, s100: 35 },
  'North East':    { s3: 55, s10: 52, s25: 50, s50: 47, s100: 45 },
  'Diplomatic / Port Blair': { s3: 120, s10: 110, s25: 90, s50: 85, s100: 80 },
};

// ── HEAVY CARGO AIR (Proposal Table 14) ──────────────────────────────
// Per-kg rates, MCW 3kg. APPLIES TO ALL COURIERS.
const SELL_AIR = {
  'Delhi & NCR':   { lt5: 85, t10: 80, t25: 78, t50: 75, g50: 74 },
  'North India':   { lt5: 72, t10: 70, t25: 65, t50: 62, g50: 60 },
  'Metro Cities':  { lt5: 85, t10: 80, t25: 78, t50: 75, g50: 74 },
  'Rest of India': { lt5: 88, t10: 85, t25: 82, t50: 80, g50: 78 },
  'North East':    { lt5: 95, t10: 90, t25: 85, t50: 82, g50: 80 },
  'Diplomatic / Port Blair': { lt5: 125, t10: 110, t25: 100, t50: 95, g50: 90 },
};

const FSC_PCT = 0.25;  // 25% Fuel Surcharge
const GST_PCT = 0.18;  // 18% GST

const ceil05 = (n) => Math.ceil(n * 2) / 2;
const ceil1 = (n) => Math.ceil(n);

/**
 * Detect if this is Prime Track or standard courier.
 * 3 tiers: prime_track (Trackon Prime), priority (BlueDart/DTDC PEP), standard (rest).
 */
function detectCourierTier(courier) {
  const c = String(courier || '').toLowerCase();
  // Prime Track = Trackon's premium service
  if (c.includes('prime') || c.includes('primetrack') || c.includes('prime track')) return 'prime_track';
  // Priority services: BlueDart, DTDC PEP/Priority
  if (c.includes('bluedart') || c.includes('blue dart')) return 'priority';
  if (c.includes('plus')) return 'priority'; // Plus is a premium courier
  // Standard couriers: DTDC Express, Trackon Express, Delhivery, etc.
  return 'standard';
}

/**
 * Calculate the Seahawk selling price for a single shipment.
 * 3 tiers: Prime Track → owner rates, Priority → Table 15, Standard → Tables 12-14.
 * FSC (25%) + GST (18%) always applied on top.
 */
function calcSellingRate(zone, weight, shipType, courierTier) {
  const szn = zone.seahawkZone || 'Rest of India';
  const w = parseFloat(weight) || 0;
  if (w <= 0) return null;

  let base = 0;
  let rateSource = '';

  // ── PRIME TRACK (Trackon's priority — owner's confirmed rates) ──────
  if (courierTier === 'prime_track') {
    const r = SELL_PRIME_TRACK[szn] || SELL_PRIME_TRACK['Rest of India'];
    const cw = ceil05(w);
    if (cw <= 0.5) {
      base = r.w500;
    } else {
      base = r.w500 + Math.ceil((cw - 0.5) / 0.5) * r.addl;
    }
    rateSource = 'Prime Track';
  }

  // ── PRIORITY (BlueDart, DTDC PEP, Plus — Proposal Table 15) ────────
  else if (courierTier === 'priority') {
    if (shipType === 'surface' && w >= 3) {
      // Heavy parcels use surface rates even on priority
      const r = SELL_SURFACE[szn] || SELL_SURFACE['Rest of India'];
      const cw = Math.max(ceil1(w), 3);
      const rate = cw <= 10 ? r.s3 : cw <= 25 ? r.s10 : cw <= 50 ? r.s25 : cw <= 100 ? r.s50 : r.s100;
      base = cw * rate;
      rateSource = 'Priority Surface';
    } else if (shipType === 'air' && w >= 3) {
      const r = SELL_AIR[szn] || SELL_AIR['Rest of India'];
      const cw = Math.max(ceil1(w), 3);
      const rate = cw < 5 ? r.lt5 : cw <= 10 ? r.t10 : cw <= 25 ? r.t25 : cw <= 50 ? r.t50 : r.g50;
      base = cw * rate;
      rateSource = 'Priority Air';
    } else {
      // Doc/packet — Priority Service rates from Table 15
      const r = SELL_PRIORITY[szn] || SELL_PRIORITY['Rest of India'];
      const cw = ceil05(w);
      if (cw <= 0.5) base = r.w500;
      else if (cw <= 1) base = r.w1000;
      else base = r.w1000 + Math.ceil((cw - 1) / 0.5) * r.addl;
      rateSource = 'Priority';
    }
  }

  // ── STANDARD (DTDC Express, Trackon Express, Delhivery, etc.) ───────
  else {
    if (shipType === 'surface' && w >= 3) {
      // Heavy Cargo Surface — per-kg, MCW 3kg
      const r = SELL_SURFACE[szn] || SELL_SURFACE['Rest of India'];
      const cw = Math.max(ceil1(w), 3);
      const rate = cw <= 10 ? r.s3 : cw <= 25 ? r.s10 : cw <= 50 ? r.s25 : cw <= 100 ? r.s50 : r.s100;
      base = cw * rate;
      rateSource = 'Surface';
    } else if (shipType === 'air' && w >= 3) {
      // Heavy Cargo Air — per-kg, MCW 3kg
      const r = SELL_AIR[szn] || SELL_AIR['Rest of India'];
      const cw = Math.max(ceil1(w), 3);
      const rate = cw < 5 ? r.lt5 : cw <= 10 ? r.t10 : cw <= 25 ? r.t25 : cw <= 50 ? r.t50 : r.g50;
      base = cw * rate;
      rateSource = 'Air Cargo';
    } else {
      // Doc/Packet — per-consignment
      const r = SELL_DOC[szn] || SELL_DOC['Rest of India'];
      const cw = ceil05(w);
      if (cw <= 0.25) base = r.w250;
      else if (cw <= 0.5) base = r.w500;
      else base = r.w500 + Math.ceil((cw - 0.5) / 0.5) * r.addl;
      rateSource = 'Doc/Packet';
    }
  }

  const fsc = rnd(base * FSC_PCT);
  const subtotal = base + fsc;
  const gst = rnd(subtotal * GST_PCT);
  const total = rnd(subtotal + gst);

  return { base: rnd(base), fsc, gst, total, rateSource };
}

/**
 * Calculate the intelligent selling price for a single shipment.
 */
async function calcShipmentRate(shipment) {
  const { destination, pincode, weight, courier, service, amount } = shipment;
  const w = parseFloat(weight) || 0;
  if (w <= 0) return { calculated: 0, zone: 'Unknown', shipType: 'doc', courierTier: 'standard', error: 'No weight' };

  const loc = await resolveDestination(destination, pincode);
  const zone = stateToZones(loc.state, loc.district, loc.city);
  const shipType = detectShipType(service, courier, w);
  const courierTier = detectCourierTier(courier);

  let sell = calcSellingRate(zone, w, shipType, courierTier);
  if (!sell && shipType === 'surface') {
    // If surface calc returns null (weight < 3kg edge case), fallback to doc
    sell = calcSellingRate(zone, w, 'doc', courierTier);
  }

  if (!sell) {
    return {
      calculated: 0,
      zone: zone.seahawkZone,
      shipType,
      courierTier,
      resolvedLocation: `${loc.city || loc.district}, ${loc.state}`,
      error: 'No rate available',
    };
  }

  return {
    calculated: sell.total,
    base: sell.base,
    fsc: sell.fsc,
    gst: sell.gst,
    zone: zone.seahawkZone,
    shipType,
    courierTier,
    rateSource: sell.rateSource,
    resolvedLocation: `${loc.city || loc.district}, ${loc.state}`,
  };
}


/* ═══════════════════════════════════════════════════════════════════════════
   PUBLIC API
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Get smart revenue summary for a date range.
 * Uses import-ledger rows (they have all 680 entries).
 */
async function getSummary(dateFrom, dateTo) {
  const cacheKey = `smartrev:summary:${dateFrom || ''}:${dateTo || ''}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const where = {};
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = dateFrom;
    if (dateTo) where.date.lte = dateTo;
  }

  // Fetch ALL shipments for the range (from import-ledger for completeness)
  const rows = await prisma.$queryRawUnsafe(
    `SELECT date, destination, pincode, weight, courier, service, amount
     FROM shipment_import_rows
     ${dateFrom || dateTo ? `WHERE ${dateFrom ? `date >= '${dateFrom}'` : '1=1'} ${dateTo ? `AND date <= '${dateTo}'` : ''}` : ''}
     ORDER BY date ASC, id ASC`
  );

  let calculatedRevenue = 0;
  let recordedRevenue = 0;
  let calculatedCount = 0;
  const byZone = {};
  const byCourier = {};
  const daily = {};

  for (const row of rows) {
    const recorded = parseFloat(row.amount) || 0;
    recordedRevenue += recorded;

    const result = await calcShipmentRate(row);
    const calc = result.calculated || 0;
    calculatedRevenue += calc;
    if (calc > 0) calculatedCount++;

    const zone = result.zone || 'Unknown';
    byZone[zone] = byZone[zone] || { count: 0, revenue: 0 };
    byZone[zone].count++;
    byZone[zone].revenue += calc;

    const courier = String(row.courier || 'Unknown');
    byCourier[courier] = byCourier[courier] || { count: 0, revenue: 0 };
    byCourier[courier].count++;
    byCourier[courier].revenue += calc;

    const dStr = row.date ? new Date(row.date).toISOString().slice(0, 10) : 'Unknown';
    daily[dStr] = daily[dStr] || { count: 0, revenue: 0, recorded: 0 };
    daily[dStr].count++;
    daily[dStr].revenue += calc;
    daily[dStr].recorded += recorded;
  }

  const summary = {
    totalShipments: rows.length,
    calculatedRevenue: rnd(calculatedRevenue),
    recordedRevenue: rnd(recordedRevenue),
    revenueGap: rnd(calculatedRevenue - recordedRevenue),
    calculatedCount,
    uncalculatedCount: rows.length - calculatedCount,
    avgPerShipment: rows.length > 0 ? rnd(calculatedRevenue / rows.length) : 0,
    byZone: Object.entries(byZone)
      .map(([zone, data]) => ({ zone, ...data, revenue: rnd(data.revenue) }))
      .sort((a, b) => b.revenue - a.revenue),
    byCourier: Object.entries(byCourier)
      .map(([courier, data]) => ({ courier, ...data, revenue: rnd(data.revenue) }))
      .sort((a, b) => b.revenue - a.revenue),
    dailyTrend: Object.entries(daily)
      .map(([date, data]) => ({ date, ...data, revenue: rnd(data.revenue), recorded: rnd(data.recorded) }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };

  await cache.set(cacheKey, summary, 300).catch(() => {});
  return summary;
}

/**
 * Get paginated shipment-level detail with rate breakdowns.
 */
async function getDetails(dateFrom, dateTo, page = 1, limit = 10, search = '') {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(5, parseInt(limit, 10) || 10));
  const offset = (safePage - 1) * safeLimit;

  // Build WHERE clause
  const conditions = [];
  const params = [];

  if (dateFrom) {
    params.push(dateFrom);
    conditions.push(`date >= $${params.length}`);
  }
  if (dateTo) {
    params.push(dateTo);
    conditions.push(`date <= $${params.length}`);
  }
  if (search) {
    params.push(`%${String(search).trim()}%`);
    const idx = params.length;
    conditions.push(`(
      awb ILIKE $${idx}
      OR COALESCE(destination, '') ILIKE $${idx}
      OR COALESCE(courier, '') ILIKE $${idx}
      OR COALESCE(consignee, '') ILIKE $${idx}
      OR COALESCE(client_code, '') ILIKE $${idx}
    )`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // Total count
  const totalResult = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS count FROM shipment_import_rows ${whereClause}`,
    ...params
  );
  const total = Number(totalResult[0]?.count || 0);

  // Fetch the page
  const rows = await prisma.$queryRawUnsafe(
    `SELECT id, date, client_code AS "clientCode", awb, consignee, destination, pincode,
            weight, amount, courier, service, status
     FROM shipment_import_rows
     ${whereClause}
     ORDER BY date DESC, id DESC
     LIMIT ${safeLimit} OFFSET ${offset}`,
    ...params
  );

  // Calculate rate for each row
  const details = [];
  for (const row of rows) {
    const result = await calcShipmentRate(row);
    details.push({
      id: row.id,
      date: row.date,
      clientCode: row.clientCode,
      awb: row.awb,
      consignee: row.consignee || '',
      destination: row.destination || '',
      pincode: row.pincode || '',
      weight: parseFloat(row.weight) || 0,
      courier: row.courier || '',
      service: row.service || '',
      status: row.status || '',
      recordedAmount: parseFloat(row.amount) || 0,
      calculatedAmount: rnd(result.calculated || 0),
      zone: result.zone || 'Unknown',
      shipType: result.shipType || 'doc',
      courierTier: result.courierTier || 'standard',
      rateSource: result.rateSource || '',
      resolvedLocation: result.resolvedLocation || '',
      base: result.base || 0,
      fsc: result.fsc || 0,
      gst: result.gst || 0,
    });
  }

  // Page-level calculated totals
  const pageCalculatedTotal = rnd(details.reduce((s, d) => s + d.calculatedAmount, 0));
  const pageRecordedTotal = rnd(details.reduce((s, d) => s + d.recordedAmount, 0));

  return {
    details,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    },
    pageTotals: {
      calculatedTotal: pageCalculatedTotal,
      recordedTotal: pageRecordedTotal,
    },
  };
}

module.exports = { getSummary, getDetails, calcShipmentRate };
