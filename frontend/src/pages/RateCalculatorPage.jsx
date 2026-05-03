import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  CheckCircle2,
  ChevronDown,
  Cpu,
  FileText,
  Loader2,
  PackageCheck,
  Save,
  SlidersHorizontal,
  Truck,
  Wind,
} from 'lucide-react';
import api from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { useDataStore } from '../stores/dataStore';
import indiaLocationsUrl from '../data/indiaLocations.json?url';
import {
  COURIERS,
  WEIGHT_POINTS,
  courierCost,
  fmt,
  fmtI,
  proposalSell,
  rnd,
  stateToZones,
} from '../features/rate-calculator/core';

const PIN_CACHE = new Map();

const CURATED_LOCATIONS = [
  { pincode: '560001', city: 'Bangalore', state: 'Karnataka', zone: 'South', aliases: ['Bengaluru'] },
  { pincode: '682001', city: 'Kochi', state: 'Kerala', zone: 'South', aliases: ['Cochin', 'Ernakulam'] },
  { pincode: '744101', city: 'Port Blair', state: 'Andaman & Nicobar Islands', zone: 'Special', aliases: ['Portblair'] },
  { pincode: '122001', city: 'Gurugram', state: 'Haryana', zone: 'North', aliases: ['Gurgaon'] },
  { pincode: '400001', city: 'Mumbai', state: 'Maharashtra', zone: 'West', aliases: ['Bombay'] },
  { pincode: '600001', city: 'Chennai', state: 'Tamil Nadu', zone: 'South', aliases: ['Madras'] },
  { pincode: '700001', city: 'Kolkata', state: 'West Bengal', zone: 'East', aliases: ['Calcutta'] },
  { pincode: '411001', city: 'Pune', state: 'Maharashtra', zone: 'West', aliases: ['Poona'] },
];

const SHIPMENT_TYPES = [
  { id: 'doc', label: 'Document', icon: FileText },
  { id: 'surface', label: 'Cargo', icon: Truck },
  { id: 'air', label: 'Air', icon: Wind },
];

const SERVICE_LEVELS = [
  { id: 'all', label: 'Normal' },
  { id: 'premium', label: 'Priority' },
];

function normalize(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeLocation(raw) {
  const pincode = String(raw?.pincode || '').trim();
  const city = String(raw?.city || '').trim();
  const state = String(raw?.state || '').trim();
  const zone = String(raw?.zone || '').trim() || 'Rest of India';
  const aliases = Array.isArray(raw?.aliases) ? raw.aliases.map((alias) => String(alias || '').trim()).filter(Boolean) : [];
  return {
    id: `${pincode}-${normalize(city)}-${normalize(state)}`,
    pincode,
    city,
    state,
    zone,
    aliases,
    searchTerms: [city, state, `${city}, ${state}`, ...aliases].map(normalize).filter(Boolean),
    label: `${city}, ${state}`,
  };
}

function etaFor(courier, shipType, zone) {
  let min = 3;
  let max = 5;
  if (shipType === 'doc') {
    min = courier.level === 'premium' ? 1 : 2;
    max = courier.level === 'premium' ? 2 : 4;
  } else if (shipType === 'air') {
    min = 2;
    max = courier.level === 'premium' ? 3 : 4;
  } else {
    min = courier.group === 'Delhivery' ? 3 : 4;
    max = courier.level === 'premium' ? 5 : 7;
  }
  const special = ['North East', 'Diplomatic', 'Kashmir', 'Srinagar'].some((part) => String(zone?.seahawkZone || '').includes(part));
  if (special) {
    min += 1;
    max += 2;
  }
  return { min, max, days: (min + max) / 2, label: min === max ? `${min}d` : `${min}-${max}d` };
}

function courierHistory(courier, laneIntel) {
  const rows = laneIntel?.byCourier || [];
  const cKey = normalize(courier.label);
  const gKey = normalize(courier.group);
  return rows.find((row) => {
    const key = normalize(row.courier);
    return key && (cKey.includes(key) || key.includes(gKey) || key.includes(normalize(courier.badgeLabel)));
  });
}

function confidenceFor({ margin, etaDays, history }) {
  const marginScore = Math.max(0, Math.min(100, 50 + Number(margin || 0)));
  const speedScore = Math.max(35, 100 - etaDays * 12);
  const successRate = history?.shipments
    ? Math.max(35, 100 - ((history.rtoRate || 0) + (history.ndrRate || 0) + ((history.slaBreachRate || 0) * 0.5)) * 100)
    : 72;
  return Math.round((0.45 * marginScore) + (0.25 * speedScore) + (0.30 * successRate));
}

function uniqueOptions(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function getLaneMeta(zone, locInfo) {
  const zoneText = String(locInfo?.zone || zone?.seahawkZone || zone?.proposal || 'Rest of India');
  const normalizedZone = zoneText.toLowerCase();
  const normalizedPlace = `${locInfo?.city || ''} ${locInfo?.label || ''}`.toLowerCase();
  const isMetro = normalizedZone.includes('metro') || ['delhi', 'mumbai', 'bangalore', 'bengaluru', 'chennai', 'hyderabad', 'kolkata', 'pune', 'ahmedabad'].some((city) => normalizedPlace.includes(city));
  const isRisky = normalizedZone.includes('north east') || normalizedZone.includes('kashmir') || normalizedZone.includes('srinagar') || normalizedZone.includes('port blair');
  const isModerate = !isRisky && (normalizedZone.includes('rest') || normalizedZone.includes('bihar') || normalizedZone.includes('jh'));

  return {
    zoneLabel: normalizedZone.includes('north') ? 'North' : zoneText,
    deliveryType: isMetro ? 'Metro' : 'Non-metro',
    serviceability: isRisky ? 'Low' : isModerate ? 'Medium' : 'High',
    tone: isRisky ? 'lane-risk-low' : isModerate ? 'lane-risk-medium' : 'lane-risk-high',
  };
}

function serviceabilityFor(courier, laneMeta, history, zone) {
  const zoneText = `${zone?.seahawkZone || ''} ${locInfoLabel(zone)}`.toLowerCase();
  const riskyLane = laneMeta?.serviceability === 'Low' || zoneText.includes('north east') || zoneText.includes('kashmir') || zoneText.includes('special');
  const shipments = Number(history?.shipments || 0);
  const rtoRate = Number(history?.rtoRate || 0);
  const breachRate = Number(history?.slaBreachRate || 0);

  if (riskyLane && courier.group === 'Delhivery' && courier.id === 'dl_b2b') {
    return { label: 'Restricted', tone: 'text-amber-600 dark:text-amber-300', note: 'Verify B2B serviceability before booking.' };
  }
  if (shipments > 0 && (rtoRate > 0.18 || breachRate > 0.20)) {
    return { label: 'Watch', tone: 'text-amber-600 dark:text-amber-300', note: 'Lane history has elevated RTO/SLA risk.' };
  }
  if (riskyLane) {
    return { label: 'Verify', tone: 'text-amber-600 dark:text-amber-300', note: 'Special lane: confirm pickup cutoff and ODA.' };
  }
  return { label: 'Available', tone: 'text-emerald-600 dark:text-emerald-400', note: 'Tariff available for this lane.' };
}

function locInfoLabel(zone) {
  return zone?.proposal || zone?.trackon || '';
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Number(value || 0)));
}

function optionReason(option, cheapest, fastest, marginLeader) {
  if (!option) return '';
  const parts = [];
  if (cheapest?.id === option.id) parts.push('lowest client quote');
  if (fastest?.id === option.id) parts.push(`fastest ETA ${option.eta.label}`);
  if (marginLeader?.id === option.id) parts.push(`best profit ${fmtI(option.profit)}`);
  if (!parts.length) parts.push(`${option.confidence}% confidence`, `${option.margin.toFixed(1)}% margin`);
  return parts.join(', ');
}

export default function RateCalculatorPage() {
  const navigate = useNavigate();
  const clients = useDataStore((state) => state.clients);
  const fetchClients = useDataStore((state) => state.fetchClients);

  const [query, setQuery] = useState('');
  const [weight, setWeight] = useState('');
  const [shipType, setShipType] = useState('doc');
  const [svcLevel, setSvcLevel] = useState('all');
  const [zone, setZone] = useState(null);
  const [locInfo, setLocInfo] = useState(null);
  const [pinLoad, setPinLoad] = useState(false);
  const [pinError, setPinError] = useState('');
  const [laneIntel, setLaneIntel] = useState(null);
  const [laneIntelLoading, setLaneIntelLoading] = useState(false);
  const [useVol, setUseVol] = useState(false);
  const [dims, setDims] = useState({ l: '', b: '', h: '' });
  const [targetMargin, setTargetMargin] = useState('');
  const [selClient, setSelClient] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [contractLoad, setContractLoad] = useState(false);
  const [selGroup, setSelGroup] = useState('all');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [savingQuote, setSavingQuote] = useState(false);
  const [quickActionMsg, setQuickActionMsg] = useState('');
  const [locations, setLocations] = useState([]);
  const actionMsgTimerRef = useRef(null);

  const debouncedQuery = useDebounce(query, 300);
  const debouncedWeight = useDebounce(weight, 300);
  const debouncedShipType = useDebounce(shipType, 300);
  const debouncedSvcLevel = useDebounce(svcLevel, 300);
  const isCalculating = query !== debouncedQuery || weight !== debouncedWeight || shipType !== debouncedShipType || svcLevel !== debouncedSvcLevel || pinLoad;

  useEffect(() => { fetchClients().catch(() => {}); }, [fetchClients]);

  useEffect(() => {
    let cancelled = false;
    fetch(indiaLocationsUrl)
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => {
        if (!cancelled) setLocations(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setLocations([]);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selClient) {
      setContracts([]);
      return;
    }
    setContractLoad(true);
    api.get(`/contracts/client/${selClient.code}`)
      .then((res) => setContracts(res.data?.data || res.data || []))
      .catch(() => setContracts([]))
      .finally(() => setContractLoad(false));
  }, [selClient]);

  const flashQuickAction = useCallback((message) => {
    if (!message) return;
    setQuickActionMsg(message);
    if (actionMsgTimerRef.current) clearTimeout(actionMsgTimerRef.current);
    actionMsgTimerRef.current = setTimeout(() => setQuickActionMsg(''), 3500);
  }, []);

  useEffect(() => () => {
    if (actionMsgTimerRef.current) clearTimeout(actionMsgTimerRef.current);
  }, []);

  const locationIndex = useMemo(() => {
    const rows = [...CURATED_LOCATIONS, ...locations].map(normalizeLocation);
    const byKey = new Map();
    rows.forEach((location) => {
      const key = `${location.pincode}-${normalize(location.city)}-${normalize(location.state)}`;
      if (!byKey.has(key)) byKey.set(key, location);
    });
    return [...byKey.values()];
  }, [locations]);
  const locationsReady = locationIndex.length > 0;

  const locationSuggestions = useMemo(() => {
    const raw = String(query || '').trim();
    const q = raw.toLowerCase();
    const compact = normalize(raw);
    if (!compact) return [];

    const matches = locationIndex.filter((location) => {
      if (/^\d+$/.test(raw)) return location.pincode.startsWith(raw);
      const city = location.city.toLowerCase();
      const state = location.state.toLowerCase();
      return city.startsWith(q) || normalize(city).includes(compact) || state.startsWith(q) || location.searchTerms.some((term) => term.includes(compact));
    });

    const ranked = [...matches].sort((a, b) => {
      const aCity = a.city.toLowerCase();
      const bCity = b.city.toLowerCase();
      const aRank = a.searchTerms.includes(compact) ? 0 : aCity === q ? 1 : aCity.startsWith(q) ? 2 : 3;
      const bRank = b.searchTerms.includes(compact) ? 0 : bCity === q ? 1 : bCity.startsWith(q) ? 2 : 3;
      if (aRank !== bRank) return aRank - bRank;
      return aCity.localeCompare(bCity) || a.state.localeCompare(b.state) || a.pincode.localeCompare(b.pincode);
    });

    const seen = new Set();
    return ranked.filter((location) => {
      const key = /^\d+$/.test(raw) ? location.pincode : `${normalize(location.city)}-${normalize(location.state)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 8);
  }, [locationIndex, query]);

  useEffect(() => {
    const value = String(debouncedQuery || '').trim();
    setPinError('');
    if (!value) {
      setZone(null);
      setLocInfo(null);
      return;
    }
    if (/^\d{1,5}$/.test(value)) {
      setZone(null);
      setLocInfo(null);
      return;
    }
    if (/^\d{6}$/.test(value)) {
      const local = locationIndex.find((location) => location.pincode === value);
      if (local) {
        const nextZone = stateToZones(local.state, local.city, local.city);
        setZone(nextZone);
        setLocInfo({ label: local.label, city: local.city, state: local.state, pincode: local.pincode, zone: local.zone });
        return;
      }

      let cancelled = false;
      const lookupPin = async () => {
        if (PIN_CACHE.has(value)) {
          const cached = PIN_CACHE.get(value);
          setZone(cached.zone);
          setLocInfo(cached.locInfo);
          return;
        }
        setPinLoad(true);
        try {
          const res = await api.get('/pincodes/lookup', { params: { pin: value } });
          const po = res?.data?.postOffice;
          if (!po) {
            if (!cancelled) setPinError('PIN not found. Try city search.');
            return;
          }
          const nextZone = stateToZones(po.State, po.District, po.Name);
          const nextLoc = { label: `${po.District}, ${po.State}`, city: po.District, state: po.State, pincode: value, zone: nextZone.seahawkZone };
          PIN_CACHE.set(value, { zone: nextZone, locInfo: nextLoc });
          if (!cancelled) {
            setZone(nextZone);
            setLocInfo(nextLoc);
          }
        } catch {
          if (!cancelled) setPinError('PIN lookup failed. Check connection.');
        } finally {
          if (!cancelled) setPinLoad(false);
        }
      };
      lookupPin();
      return () => { cancelled = true; };
    }

    const city = locationIndex.find((location) => normalize(location.city) === normalize(value) || normalize(location.label) === normalize(value) || location.searchTerms.includes(normalize(value)));
    if (city) {
      setZone(stateToZones(city.state, city.city, city.city));
      setLocInfo({ label: city.label, city: city.city, state: city.state, pincode: city.pincode, zone: city.zone });
      return;
    }

    setZone(null);
    setLocInfo(null);
    if (locationsReady && value.length >= 2 && !locationSuggestions.length) {
      setPinError('No results found. Manual entry is allowed, but zone and pricing may need verification.');
    }
  }, [debouncedQuery, locationIndex, locationSuggestions.length, locationsReady]);

  useEffect(() => {
    if (!zone || !locInfo || !Number(debouncedWeight)) {
      setLaneIntel(null);
      return;
    }
    let cancelled = false;
    setLaneIntelLoading(true);
    api.get('/rates/intelligence', {
      params: {
        destination: locInfo.label || debouncedQuery,
        pincode: locInfo.pincode || '',
        shipType: debouncedShipType,
        days: 90,
      },
    })
      .then((res) => {
        if (!cancelled) setLaneIntel(res.data?.data || res.data || null);
      })
      .catch(() => {
        if (!cancelled) setLaneIntel(null);
      })
      .finally(() => {
        if (!cancelled) setLaneIntelLoading(false);
      });
    return () => { cancelled = true; };
  }, [zone, locInfo, debouncedQuery, debouncedWeight, debouncedShipType]);

  const volWt = useMemo(() => {
    if (!useVol || !dims.l || !dims.b || !dims.h) return 0;
    const divisor = debouncedShipType === 'surface' ? 4500 : 5000;
    return ((parseFloat(dims.l) || 0) * (parseFloat(dims.b) || 0) * (parseFloat(dims.h) || 0)) / divisor;
  }, [useVol, dims, debouncedShipType]);

  const chargeWt = useMemo(() => Math.max(parseFloat(debouncedWeight) || 0, volWt), [debouncedWeight, volWt]);

  const activeContract = useMemo(() => {
    if (!contracts.length || !chargeWt) return null;
    const today = new Date().toISOString().slice(0, 10);
    return contracts.find((c) => c.active && (!c.validFrom || c.validFrom <= today) && (!c.validTo || c.validTo >= today)) || null;
  }, [contracts, chargeWt]);

  const contractSell = useMemo(() => {
    if (!activeContract || !chargeWt) return null;
    const baseRate = Number(activeContract.baseRate || 0);
    const min = Number(activeContract.minCharge || 0);
    const baseCharge = Number(activeContract.baseCharge || 0);
    let base = activeContract.pricingType === 'PER_KG' ? chargeWt * baseRate : baseRate;

    if (activeContract.pricingType === 'SIMPLE' && activeContract.pricingRules?.rules?.length) {
      const zoneKey = normalize(zone?.proposal || zone?.seahawkZone);
      const modeKey = debouncedShipType === 'air' ? 'air' : debouncedShipType === 'surface' ? 'surface' : 'express';
      const rule = activeContract.pricingRules.rules.find((r) => normalize(r.zone) === zoneKey && (!r.mode || normalize(r.mode) === modeKey))
        || activeContract.pricingRules.rules.find((r) => !r.mode || normalize(r.mode) === modeKey)
        || activeContract.pricingRules.rules[0];
      base = Number(rule?.rate || base);
    }

    base = Math.max(base + baseCharge, min);
    const fsc = rnd(base * (Number(activeContract.fuelSurcharge || 0) / 100));
    const sub = base + fsc;
    const gst = rnd(sub * (Number(activeContract.gstPercent || 18) / 100));
    return {
      source: activeContract.name,
      total: rnd(sub + gst),
      base: rnd(base),
      fsc,
      gst,
      fscPct: `${activeContract.fuelSurcharge || 0}%`,
    };
  }, [activeContract, chargeWt, zone, debouncedShipType]);

  const decisionOptions = useMemo(() => {
    if (!zone || !chargeWt) return [];
    const generalOda = 0;
    const laneMeta = getLaneMeta(zone, locInfo);
    const rows = COURIERS
      .filter((c) => c.types.includes(debouncedShipType))
      .filter((c) => debouncedSvcLevel === 'all' || c.level === debouncedSvcLevel)
      .filter((c) => selGroup === 'all' || c.group === selGroup)
      .map((c) => {
        const bk = courierCost(c.id, zone, chargeWt, generalOda);
        if (!bk) return null;
        const sell = contractSell || proposalSell(zone, chargeWt, debouncedShipType, c.level, bk.total);
        if (!sell) return null;
        const profit = rnd(sell.total - bk.total);
        const margin = sell.total > 0 ? rnd((profit / sell.total) * 100) : 0;
        const eta = etaFor(c, debouncedShipType, zone);
        const history = courierHistory(c, laneIntel);
        const confidence = confidenceFor({ margin, etaDays: eta.days, history });
        const serviceability = serviceabilityFor(c, laneMeta, history, zone);
        const marginScore = Math.max(0, Math.min(100, 50 + margin));
        const speedScore = Math.max(35, 100 - eta.days * 12);
        const successRate = history?.shipments
          ? Math.max(35, 100 - ((history.rtoRate || 0) + (history.ndrRate || 0)) * 100)
          : 72;
        const score = rnd((0.45 * marginScore) + (0.25 * speedScore) + (0.30 * successRate));
        return {
          ...c,
          bk,
          sell,
          profit,
          margin,
          eta,
          history,
          confidence,
          serviceability,
          score,
          contractName: contractSell?.source || 'Proposal pricing',
        };
      })
      .filter(Boolean);

    if (!rows.length) return [];

    const minSell = Math.min(...rows.map((item) => item.sell.total));
    const maxSell = Math.max(...rows.map((item) => item.sell.total));
    const maxProfit = Math.max(...rows.map((item) => item.profit));
    const minProfit = Math.min(...rows.map((item) => item.profit));
    const minEta = Math.min(...rows.map((item) => item.eta.days));
    const maxEta = Math.max(...rows.map((item) => item.eta.days));

    return rows
      .map((item) => {
        const priceScore = maxSell === minSell ? 100 : 100 - (((item.sell.total - minSell) / (maxSell - minSell)) * 100);
        const marginScore = maxProfit === minProfit ? 80 : ((item.profit - minProfit) / (maxProfit - minProfit)) * 100;
        const etaScore = maxEta === minEta ? 100 : 100 - (((item.eta.days - minEta) / (maxEta - minEta)) * 100);
        const servicePenalty = item.serviceability.label === 'Available' ? 0 : item.serviceability.label === 'Watch' ? 8 : 12;
        const balancedScore = rnd(clampScore((0.38 * item.confidence) + (0.27 * priceScore) + (0.20 * etaScore) + (0.15 * marginScore) - servicePenalty));
        return { ...item, priceScore: rnd(priceScore), etaScore: rnd(etaScore), marginRankScore: rnd(marginScore), balancedScore };
      })
      .sort((a, b) => b.balancedScore - a.balancedScore || a.sell.total - b.sell.total);
  }, [zone, locInfo, chargeWt, debouncedShipType, debouncedSvcLevel, selGroup, contractSell, laneIntel]);

  const recommendations = useMemo(() => {
    if (!decisionOptions.length) return [];
    const recommended = decisionOptions[0];
    const bestMargin = [...decisionOptions].sort((a, b) => b.profit - a.profit)[0];
    const fastest = [...decisionOptions].sort((a, b) => a.eta.days - b.eta.days || b.confidence - a.confidence)[0];
    const cheapest = [...decisionOptions].sort((a, b) => a.sell.total - b.sell.total)[0];
    return uniqueOptions([
      { ...recommended, cardType: 'Recommended', tag: 'Recommended', reason: optionReason(recommended, cheapest, fastest, bestMargin), cardAccent: 'emerald' },
      { ...cheapest, cardType: 'Cheapest', tag: 'Cheapest', reason: optionReason(cheapest, cheapest, fastest, bestMargin), cardAccent: 'amber' },
      { ...fastest, cardType: 'Fastest', tag: 'Fastest', reason: optionReason(fastest, cheapest, fastest, bestMargin), cardAccent: 'sky' },
      { ...bestMargin, cardType: 'Best Margin', tag: 'Best Margin', reason: optionReason(bestMargin, cheapest, fastest, bestMargin), cardAccent: 'emerald' },
    ]).slice(0, 3);
  }, [decisionOptions]);

  const selected = useMemo(() => (
    recommendations.find((item) => item.id === selectedId) || decisionOptions.find((item) => item.id === selectedId) || recommendations[0] || decisionOptions[0] || null
  ), [decisionOptions, recommendations, selectedId]);

  useEffect(() => {
    if (!recommendations[0]) return;
    if (!selectedId || !decisionOptions.some((item) => item.id === selectedId)) setSelectedId(recommendations[0].id);
  }, [decisionOptions, recommendations, selectedId]);

  const sensitivityData = useMemo(() => {
    if (!zone) return [];
    return WEIGHT_POINTS.map((w) => {
      const row = { w };
      decisionOptions.slice(0, 5).forEach((c) => {
        const bk = courierCost(c.id, zone, w, 0);
        row[c.id] = bk ? bk.total : null;
      });
      return row;
    });
  }, [zone, decisionOptions]);

  const handleBookShipment = useCallback(() => {
    if (!selected) {
      flashQuickAction('Calculate a recommendation first.');
      return;
    }
    const params = new URLSearchParams({
      destination: locInfo?.label || debouncedQuery || '',
      pincode: locInfo?.pincode || '',
      weight: String(chargeWt || ''),
      amount: String(rnd(selected.sell.total || 0)),
      courier: selected.label || '',
      courierMode: selected.mode || '',
      quoteSource: selected.contractName || selected.sell.source || '',
      margin: String(selected.margin || ''),
      profit: String(rnd(selected.profit || 0)),
      serviceability: selected.serviceability?.label || '',
      rateDecision: selected.reason || `Recommended score ${selected.balancedScore}`,
    });
    navigate(`/app/entry?${params.toString()}`);
  }, [selected, locInfo, debouncedQuery, chargeWt, navigate, flashQuickAction]);

  const handleSaveQuote = useCallback(async () => {
    if (!selected) {
      flashQuickAction('Calculate a recommendation first.');
      return;
    }
    setSavingQuote(true);
    try {
      const payload = {
        clientCode: selClient?.code || null,
        destination: locInfo?.label || debouncedQuery,
        pincode: locInfo?.pincode || null,
        state: zone?.seahawkZone || '',
        district: '',
        shipType: debouncedShipType,
        weight: chargeWt,
        courier: selected.label,
        courierMode: selected.mode,
        costTotal: selected.bk.total,
        sellTotal: selected.sell.total,
        profit: selected.profit,
        margin: selected.margin,
        notes: `Decision score ${selected.score}; ETA ${selected.eta.label}`,
        status: 'QUOTED',
      };
      const res = await api.post('/quotes', payload);
      const quoteNo = res.data?.quoteNo || res.data?.data?.quoteNo || '';
      flashQuickAction(quoteNo ? `Quote ${quoteNo} saved.` : 'Quote saved.');
    } catch {
      flashQuickAction('Save failed. Please retry.');
    } finally {
      setSavingQuote(false);
    }
  }, [selected, selClient, locInfo, debouncedQuery, zone, debouncedShipType, chargeWt, flashQuickAction]);

  const chooseLocation = (location) => {
    setQuery(location.pincode || location.label);
    setZone(stateToZones(location.state, location.city, location.city));
    setLocInfo({ label: location.label, city: location.city, state: location.state, pincode: location.pincode, zone: location.zone });
    setPinError('');
  };

  return (
    <div className="rate-decision-page mx-auto max-w-[1500px] p-5">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-orange-300 shadow-[0_0_18px_rgba(255,165,0,0.16)]">
            <Cpu size={18} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-950 dark:text-white">Rate Calculator</h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Decision engine for courier selection, margin and SLA confidence.</p>
          </div>
        </div>
        <div className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-xs font-black text-orange-600 dark:text-orange-300">
          {zone ? `${zone.seahawkZone} zone detected` : 'Waiting for destination'}
        </div>
      </div>

      <TopInputBar
        query={query}
        setQuery={setQuery}
        pinLoad={pinLoad}
        pinError={pinError}
        locationSuggestions={locationSuggestions}
        chooseLocation={chooseLocation}
        locationsReady={locationsReady}
        weight={weight}
        setWeight={setWeight}
        shipType={shipType}
        setShipType={setShipType}
        svcLevel={svcLevel}
        setSvcLevel={setSvcLevel}
        locInfo={locInfo}
        zone={zone}
      />

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr),280px]">
        <main className="space-y-4">
          {isCalculating || laneIntelLoading ? (
            <RecommendationSkeleton />
          ) : recommendations.length ? (
            <RecommendationCards
              recommendations={recommendations}
              allOptions={decisionOptions}
              selectedId={selected?.id}
              onSelect={setSelectedId}
            />
          ) : (
            <DecisionEmptyState hasZone={!!zone} hasWeight={chargeWt > 0} />
          )}

          <AdvancedControls
            open={advancedOpen}
            setOpen={setAdvancedOpen}
            useVol={useVol}
            setUseVol={setUseVol}
            dims={dims}
            setDims={setDims}
            volWt={volWt}
            chargeWt={chargeWt}
            targetMargin={targetMargin}
            setTargetMargin={setTargetMargin}
            clients={clients}
            selClient={selClient}
            setSelClient={setSelClient}
            contracts={contracts}
            contractLoad={contractLoad}
            activeContract={activeContract}
            selGroup={selGroup}
            setSelGroup={setSelGroup}
            sensitivityData={sensitivityData}
            decisionOptions={decisionOptions}
          />
        </main>

        <SummaryPanel
          selected={selected}
          locInfo={locInfo}
          zone={zone}
          chargeWt={chargeWt}
          onBookShipment={handleBookShipment}
          onSaveQuote={handleSaveQuote}
          savingQuote={savingQuote}
          quickActionMsg={quickActionMsg}
        />
      </div>

      <style>{`
        .rate-decision-page {
          color: #0f172a;
        }
        .dark .rate-decision-page {
          color: #e5e7eb;
        }
        .decision-shell {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(255, 255, 255, 0.78);
          box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
          backdrop-filter: blur(18px);
        }
        .dark .decision-shell {
          background: rgba(8, 17, 31, 0.92);
          border-color: rgba(148, 163, 184, 0.15);
          box-shadow: 0 0 12px rgba(255,165,0,0.10), 0 22px 60px rgba(0,0,0,0.35);
        }
        .decision-input {
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.24);
          background: rgba(15, 23, 42, 0.04);
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 800;
          outline: none;
          width: 100%;
        }
        .dark .decision-input {
          background: rgba(15, 23, 42, 0.72);
          color: white;
        }
        .decision-input:focus {
          border-color: rgba(249, 115, 22, 0.45);
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.10);
        }
        .destination-confirm {
          border: 1px solid rgba(34, 197, 94, 0.22);
          background: linear-gradient(135deg, rgba(240, 253, 244, 0.95), rgba(255, 247, 237, 0.72));
        }
        .dark .destination-confirm {
          border-color: rgba(74, 222, 128, 0.20);
          background: linear-gradient(135deg, rgba(20, 83, 45, 0.18), rgba(154, 52, 18, 0.12));
        }
        .destination-confirm.lane-risk-high {
          border-color: rgba(34, 197, 94, 0.24);
          background: linear-gradient(135deg, rgba(240, 253, 244, 0.95), rgba(236, 253, 245, 0.72));
        }
        .destination-confirm.lane-risk-medium {
          border-color: rgba(245, 158, 11, 0.26);
          background: linear-gradient(135deg, rgba(255, 251, 235, 0.96), rgba(255, 247, 237, 0.72));
        }
        .destination-confirm.lane-risk-low {
          border-color: rgba(244, 63, 94, 0.25);
          background: linear-gradient(135deg, rgba(255, 241, 242, 0.95), rgba(255, 247, 237, 0.72));
        }
        .dark .destination-confirm.lane-risk-high {
          background: linear-gradient(135deg, rgba(20, 83, 45, 0.20), rgba(6, 78, 59, 0.14));
        }
        .dark .destination-confirm.lane-risk-medium {
          background: linear-gradient(135deg, rgba(120, 53, 15, 0.26), rgba(69, 26, 3, 0.14));
        }
        .dark .destination-confirm.lane-risk-low {
          background: linear-gradient(135deg, rgba(136, 19, 55, 0.24), rgba(76, 5, 25, 0.14));
        }
        .decision-card {
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(255,255,255,0.82);
          padding: 18px;
          transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease, background .2s ease;
        }
        .dark .decision-card {
          background: rgba(9, 18, 33, 0.9);
        }
        .decision-card-compact {
          min-height: 248px;
        }
        .decision-card-active,
        .decision-card:hover {
          transform: translateY(-1px) scale(1.02);
          border-color: rgba(249, 115, 22, 0.45);
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.10), 0 0 18px rgba(255,165,0,0.16), 0 18px 36px rgba(15, 23, 42, 0.16);
        }
        .decision-card-active {
          background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,247,237,0.82));
        }
        .dark .decision-card-active {
          background: linear-gradient(180deg, rgba(15,23,42,0.98), rgba(67,34,7,0.26));
        }
        .decision-chip {
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          background: rgba(15, 23, 42, 0.04);
          padding: 5px 9px;
          font-size: 10px;
          font-weight: 900;
        }
        .price-focus {
          color: #0f172a;
          letter-spacing: 0;
        }
        .dark .price-focus {
          color: #ffffff;
        }
        .other-option-card {
          transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease, background .2s ease;
        }
        .other-option-card:hover {
          transform: translateY(-1px);
          background: rgba(249, 115, 22, 0.08);
          border-color: rgba(249, 115, 22, 0.42);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.10);
          cursor: pointer;
        }
        .dark .decision-chip {
          background: rgba(255,255,255,0.04);
        }
        .skeleton-line {
          background: linear-gradient(90deg, rgba(148,163,184,0.12), rgba(148,163,184,0.25), rgba(148,163,184,0.12));
          background-size: 200% 100%;
          animation: shimmer 1.3s infinite linear;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

function TopInputBar({
  query,
  setQuery,
  pinLoad,
  pinError,
  locationSuggestions,
  chooseLocation,
  locationsReady,
  weight,
  setWeight,
  shipType,
  setShipType,
  svcLevel,
  setSvcLevel,
  locInfo,
  zone,
}) {
  const laneMeta = getLaneMeta(zone, locInfo);
  const selectedQuery = locInfo && (query === locInfo.pincode || normalize(query) === normalize(locInfo.label) || normalize(query) === normalize(locInfo.city));
  const showSuggestions = locationSuggestions.length > 0 && !selectedQuery;

  return (
    <section className="decision-shell sticky top-3 z-30 rounded-2xl p-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr,0.7fr,1fr,0.8fr]">
        <div className="relative">
          <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Destination</label>
          <div className="relative">
            {pinLoad && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-orange-500" />}
            <input
              className="decision-input"
              value={query}
              onChange={(e) => setQuery(e.target.value.slice(0, 50))}
              placeholder="PIN or city"
            />
          </div>
          {showSuggestions && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-xl border border-slate-700/40 bg-slate-950 shadow-2xl">
              {locationSuggestions.map((location) => (
                <button key={location.id} type="button" onClick={() => chooseLocation(location)} className="flex w-full items-center gap-3 border-b border-white/5 px-3 py-2 text-left text-xs font-bold text-slate-200 transition hover:bg-white/5">
                  <span className="min-w-0 flex-1 truncate">{location.city}, {location.state}</span>
                  {location.aliases?.length > 0 && <span className="hidden text-[11px] text-slate-500 sm:inline">aka {location.aliases.slice(0, 2).join(', ')}</span>}
                  <span className="text-[11px] text-slate-500">{location.pincode}</span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-widest text-orange-300">{location.zone}</span>
                </button>
              ))}
            </div>
          )}
          {locationsReady && query.trim().length >= 2 && !showSuggestions && !locInfo && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 rounded-xl border border-amber-500/20 bg-slate-950 px-3 py-2 text-xs font-bold text-amber-200 shadow-2xl">
              No verified city match. Use a 6-digit PIN for accurate zone and courier serviceability.
            </div>
          )}
          <p className={`mt-1 text-[11px] ${pinError ? 'text-rose-500' : 'text-slate-500'}`}>
            {pinError || locInfo?.label || 'Auto-detects zone from PIN or city.'}
          </p>
          {locInfo && zone && (
            <div className={`destination-confirm mt-2 rounded-xl px-3 py-2 ${laneMeta.tone}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-black text-slate-950 dark:text-white">📍 {locInfo.label}</p>
                <span className="shrink-0 text-[10px] font-black uppercase tracking-widest">{laneMeta.serviceability}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <span>PIN: {locInfo.pincode || 'Manual'}</span>
                <span>Zone: {laneMeta.zoneLabel}</span>
                <span>Delivery Type: {laneMeta.deliveryType}</span>
                <span>Serviceability: {laneMeta.serviceability}</span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Weight</label>
          <div className="relative">
            <input className="decision-input pr-9" type="number" min="0" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0.0" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">kg</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Actual weight. Volumetric is in advanced.</p>
        </div>

        <Segment label="Shipment Type" items={SHIPMENT_TYPES} value={shipType} onChange={setShipType} />
        <Segment label="Service Level" items={SERVICE_LEVELS} value={svcLevel} onChange={setSvcLevel} />
      </div>
    </section>
  );
}

function Segment({ label, items, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</label>
      <div className="flex rounded-xl border border-slate-700/20 bg-slate-950/5 p-1 dark:bg-slate-950/80">
        {items.map((item) => {
          const Icon = item.icon;
          const active = value === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-black transition ${active ? 'bg-orange-500 text-white shadow-[0_0_12px_rgba(255,165,0,0.15)]' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
            >
              {Icon && <Icon size={14} />}
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RecommendationCards({ recommendations, allOptions = [], selectedId, onSelect }) {
  const selected = recommendations.find((item) => item.id === selectedId) || recommendations[0];
  const fastest = [...allOptions].sort((a, b) => a.eta.days - b.eta.days)[0];
  const cheapest = [...allOptions].sort((a, b) => a.sell.total - b.sell.total)[0];
  const marginLeader = [...allOptions].sort((a, b) => b.profit - a.profit)[0];
  const selectedDelta = cheapest && selected ? rnd(selected.sell.total - cheapest.sell.total) : 0;

  return (
    <section>
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-orange-500">Decision engine</p>
          <h2 className="text-base font-black text-slate-950 dark:text-white">Pick the courier with price, speed and risk in one view</h2>
        </div>
        <span className="hidden text-xs font-bold text-slate-500 sm:block">Balanced score: confidence, price, ETA and margin.</span>
      </div>
      {selected && (
        <div className="mb-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-bold text-slate-700 dark:text-slate-200">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
              Recommended: <strong className="text-slate-950 dark:text-white">{selected.label}</strong>
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {selected.reason || `${selected.confidence}% confidence`} {selectedDelta > 0 ? ` | ${fmtI(selectedDelta)} above cheapest` : ' | lowest quote'}
            </span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {recommendations.map((item) => (
          <button
            key={`${item.cardType}-${item.id}`}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`decision-card decision-card-compact text-left ${selectedId === item.id ? 'decision-card-active' : ''}`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className={`decision-chip ${item.cardType === 'Fastest' ? 'text-sky-600 dark:text-sky-300' : item.cardType === 'Cheapest' ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300'}`}>
                {item.cardType === 'Fastest' ? 'Fastest' : item.cardType === 'Cheapest' ? 'Cheapest' : item.cardType}
              </span>
              {selectedId === item.id && <span className="decision-chip border-orange-500/30 text-orange-600 dark:text-orange-300">Selected</span>}
            </div>
            <p className="mt-4 text-base font-black leading-tight text-slate-950 dark:text-white">{item.label}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">{item.mode}</p>
            <div className="mt-4">
              <p className="price-focus text-[30px] font-black leading-none tabular-nums">{fmtI(item.sell.total)}</p>
              <p className="mt-2 text-xs font-bold text-slate-500">
                Client quote incl. GST <span className="mx-1 text-slate-300">|</span>
                <span className={item.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{item.margin.toFixed(1)}% margin</span>
              </p>
              <p className="mt-2 text-xs font-bold text-slate-500">
                Cost: {fmtI(item.bk.total)} <span className="mx-1 text-slate-300">|</span>
                Profit: {fmtI(item.profit)}
              </p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-700/10 pt-3 text-xs">
              <MetricMini label="ETA" value={item.eta.label} />
              <MetricMini label="Risk" value={item.serviceability.label} tone={item.serviceability.tone} />
              <MetricMini label="Score" value={Number(item.balancedScore || item.score || 0).toFixed(1)} />
            </div>
            <p className="mt-3 min-h-8 text-xs font-semibold leading-snug text-slate-500">{item.reason}</p>
          </button>
        ))}
      </div>
      {allOptions.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-700/10 bg-white/80 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between border-b border-slate-700/10 px-3 py-2">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Courier comparison</p>
            <p className="hidden text-xs font-bold text-slate-500 sm:block">Click a row to select it.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-slate-950/[0.03] text-[10px] font-black uppercase tracking-widest text-slate-400 dark:bg-white/[0.04]">
                <tr>
                  <th className="px-3 py-2">Courier</th>
                  <th className="px-3 py-2 text-right">Sell</th>
                  <th className="px-3 py-2 text-right">Cost</th>
                  <th className="px-3 py-2 text-right">Profit</th>
                  <th className="px-3 py-2 text-right">Margin</th>
                  <th className="px-3 py-2">ETA</th>
                  <th className="px-3 py-2">Service</th>
                  <th className="px-3 py-2 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {allOptions.map((item) => (
                  <tr
                    key={`compare-${item.id}`}
                    onClick={() => onSelect(item.id)}
                    className={`cursor-pointer border-t border-slate-700/10 transition hover:bg-orange-500/5 ${selectedId === item.id ? 'bg-orange-500/10' : ''}`}
                  >
                    <td className="px-3 py-3">
                      <p className="font-black text-slate-950 dark:text-white">{item.label}</p>
                      <p className="mt-0.5 text-[11px] font-bold text-slate-500">{item.mode}</p>
                    </td>
                    <td className="px-3 py-3 text-right font-black tabular-nums text-slate-950 dark:text-white">{fmtI(item.sell.total)}</td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums text-slate-500">{fmtI(item.bk.total)}</td>
                    <td className={`px-3 py-3 text-right font-black tabular-nums ${item.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{fmtI(item.profit)}</td>
                    <td className="px-3 py-3 text-right font-black tabular-nums">{item.margin.toFixed(1)}%</td>
                    <td className="px-3 py-3 font-black">{item.eta.label}</td>
                    <td className={`px-3 py-3 font-black ${item.serviceability.tone}`}>{item.serviceability.label}</td>
                    <td className="px-3 py-3 text-right font-black tabular-nums">{Number(item.balancedScore || 0).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="mt-3 rounded-2xl border border-slate-700/10 bg-white/70 p-3 text-xs font-bold text-slate-600 dark:bg-white/[0.03] dark:text-slate-300">
        <p>{selected?.label} is selected because it balances quote, ETA, serviceability and margin for this shipment.</p>
        {fastest && marginLeader && cheapest && (
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Cheapest: {cheapest.label} at {fmtI(cheapest.sell.total)}. Fastest: {fastest.label} at {fastest.eta.label}. Best margin: {marginLeader.label} with {fmtI(marginLeader.profit)} profit.
          </p>
        )}
      </div>
    </section>
  );
}

function MetricMini({ label, value, tone = '' }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-black ${tone || 'text-slate-950 dark:text-white'}`}>{value}</p>
    </div>
  );
}

function SummaryPanel({ selected, locInfo, zone, chargeWt, onBookShipment, onSaveQuote, savingQuote, quickActionMsg }) {
  const [breakdownOpen, setBreakdownOpen] = useState(true);
  const laneMeta = getLaneMeta(zone, locInfo);

  return (
    <aside className="decision-shell sticky top-[100px] self-start rounded-2xl p-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-orange-500">Summary</p>
          <h2 className="text-base font-black text-slate-950 dark:text-white">Decision panel</h2>
        </div>
        <PackageCheck className="text-orange-500" size={20} />
      </div>

      {!selected ? (
        <div className="rounded-2xl border border-dashed border-slate-700/20 p-5 text-center">
          <Truck className="mx-auto text-slate-400" size={26} />
          <p className="mt-3 text-sm font-black text-slate-900 dark:text-white">No courier selected</p>
          <p className="mt-1 text-xs text-slate-500">Enter destination and weight to generate recommendations.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl bg-slate-950 p-4 text-white shadow-[0_0_12px_rgba(255,165,0,0.15)]">
            <p className="text-xs font-black uppercase tracking-widest text-orange-300">{selected.cardType || 'Selected courier'}</p>
            <h3 className="mt-2 text-xl font-black leading-tight">{selected.label}</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Final quote</p>
                <p className="mt-1 text-lg font-black text-orange-300">{fmt(selected.sell.total)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">ETA</p>
                <p className="mt-1 text-lg font-black">{selected.eta.label}</p>
              </div>
            </div>
            <div className="mt-3 rounded-xl bg-white/8 p-3 text-xs font-bold text-slate-200">
              {selected.reason || `${selected.confidence}% confidence with ${selected.margin.toFixed(1)}% margin.`}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <SummaryStat label="Cost" value={fmt(selected.bk.total)} />
            <SummaryStat label="Profit" value={fmt(selected.profit)} tone={selected.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} />
            <SummaryStat label="Margin" value={`${selected.margin.toFixed(1)}%`} />
            <SummaryStat label="Risk" value={selected.serviceability?.label || laneMeta.serviceability} tone={selected.serviceability?.tone} />
          </div>

          <div className="rounded-2xl border border-slate-700/10 bg-slate-950/5 p-3 text-xs font-bold text-slate-600 dark:bg-white/[0.03] dark:text-slate-300">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Booking handoff</p>
            <p className="mt-2">{locInfo?.label || 'Destination pending'} · {chargeWt.toFixed(2)} kg · {selected.contractName}</p>
            <p className="mt-1 text-slate-500 dark:text-slate-400">{selected.serviceability?.note || 'Confirm serviceability if this is an exception lane.'}</p>
          </div>

          <div className="rounded-2xl border border-slate-700/10 bg-slate-950/5 p-4 dark:bg-white/[0.03]">
            <button type="button" onClick={() => setBreakdownOpen((current) => !current)} className="flex w-full items-center justify-between text-left">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Charge breakdown</span>
              <ChevronDown size={16} className={`transition duration-200 ${breakdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {breakdownOpen && (
              <div className="mt-3 border-t border-slate-700/10 pt-3">
                <BreakdownRow label="Base" value={fmt(selected.sell.base || selected.sell.total)} />
                <BreakdownRow label="Fuel" value={fmt(selected.sell.fsc || 0)} />
                <BreakdownRow label="GST" value={fmt(selected.sell.gst || 0)} />
                <div className="my-3 border-t border-slate-700/10" />
                <BreakdownRow strong label="Final quote" value={fmt(selected.sell.total)} />
                <p className="mt-2 text-[11px] font-semibold text-slate-500">Client quote incl. GST. Source: {selected.contractName}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button type="button" onClick={onBookShipment} className="btn-primary w-full">
              <Truck size={16} /> Book Shipment
            </button>
            <button type="button" onClick={onSaveQuote} disabled={savingQuote} className="btn-secondary w-full">
              {savingQuote ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Quote
            </button>
          </div>
          {quickActionMsg && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-600">{quickActionMsg}</div>}
        </div>
      )}
    </aside>
  );
}

function SummaryStat({ label, value, tone = 'text-slate-950 dark:text-white' }) {
  return (
    <div className="rounded-xl border border-slate-700/10 bg-slate-950/5 p-3 dark:bg-white/[0.03]">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-black tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

function AdvancedControls({
  open,
  setOpen,
  useVol,
  setUseVol,
  dims,
  setDims,
  volWt,
  chargeWt,
  targetMargin,
  setTargetMargin,
  clients,
  selClient,
  setSelClient,
  contracts,
  contractLoad,
  activeContract,
  selGroup,
  setSelGroup,
  sensitivityData,
  decisionOptions,
}) {
  return (
    <section className="decision-shell rounded-2xl p-4">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-black text-slate-950 dark:text-white">
          <SlidersHorizontal size={16} className="text-orange-500" /> Advanced controls
        </span>
        <ChevronDown size={18} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-700/10 bg-slate-950/5 p-4 dark:bg-white/[0.03]">
            <label className="mb-3 flex items-center justify-between text-sm font-black text-slate-900 dark:text-white">
              Volumetric weight
              <input type="checkbox" checked={useVol} onChange={(e) => setUseVol(e.target.checked)} className="h-4 w-4 accent-orange-500" />
            </label>
            <div className={`grid grid-cols-3 gap-2 ${useVol ? '' : 'opacity-40'}`}>
              {['l', 'b', 'h'].map((key) => (
                <input key={key} disabled={!useVol} className="decision-input text-center" type="number" min="0" placeholder={key.toUpperCase()} value={dims[key]} onChange={(e) => setDims((current) => ({ ...current, [key]: e.target.value }))} />
              ))}
            </div>
            <p className="mt-3 text-xs font-bold text-slate-500">Volumetric: {volWt.toFixed(2)} kg · Chargeable: {chargeWt.toFixed(2)} kg</p>
          </div>

          <div className="rounded-2xl border border-slate-700/10 bg-slate-950/5 p-4 dark:bg-white/[0.03]">
            <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">Client contract</label>
            <select className="decision-input" value={selClient?.code || ''} onChange={(e) => setSelClient(clients.find((c) => c.code === e.target.value) || null)}>
              <option value="">No client contract</option>
              {clients.map((client) => <option key={client.code} value={client.code}>{client.company} ({client.code})</option>)}
            </select>
            <p className="mt-3 text-xs font-bold text-slate-500">
              {contractLoad ? 'Loading contracts...' : activeContract ? `Applying ${activeContract.name}` : `${contracts.length} active contracts found`}
            </p>
            <label className="mt-4 mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">Partner group</label>
            <select className="decision-input" value={selGroup} onChange={(e) => setSelGroup(e.target.value)}>
              <option value="all">All partners</option>
              {[...new Set(COURIERS.map((c) => c.group))].map((group) => <option key={group} value={group}>{group}</option>)}
            </select>
          </div>

          <div className="rounded-2xl border border-slate-700/10 bg-slate-950/5 p-4 dark:bg-white/[0.03]">
            <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">Target margin</label>
            <input className="decision-input" type="number" min="0" max="99" value={targetMargin} onChange={(e) => setTargetMargin(e.target.value)} placeholder="20%" />
            <div className="mt-4 max-h-40 overflow-auto rounded-xl border border-slate-700/10">
              {sensitivityData.length ? sensitivityData.slice(0, 8).map((row) => (
                <div key={row.w} className="grid grid-cols-[60px,1fr] border-b border-slate-700/10 px-3 py-2 text-xs">
                  <span className="font-black">{row.w}kg</span>
                  <span className="truncate text-slate-500">
                    {decisionOptions.slice(0, 3).map((c) => `${c.badgeLabel}: ${row[c.id] ? fmt(row[c.id]) : '-'}`).join(' · ')}
                  </span>
                </div>
              )) : <div className="p-4 text-xs font-bold text-slate-500">Sensitivity appears after calculation.</div>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function RecommendationSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="decision-card decision-card-compact">
          <div className="skeleton-line h-6 w-24 rounded-full" />
          <div className="skeleton-line mt-5 h-6 w-4/5 rounded-lg" />
          <div className="skeleton-line mt-3 h-4 w-2/3 rounded-lg" />
          <div className="mt-5 flex items-end justify-between">
            <div className="skeleton-line h-8 w-16 rounded-lg" />
            <div className="skeleton-line h-8 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DecisionEmptyState({ hasZone, hasWeight }) {
  return (
    <div className="decision-shell flex min-h-[360px] flex-col items-center justify-center rounded-2xl p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
        <Box size={28} />
      </div>
      <h2 className="mt-4 text-xl font-black text-slate-950 dark:text-white">
        {!hasZone ? 'Start with a destination' : !hasWeight ? 'Add shipment weight' : 'No matching courier options'}
      </h2>
      <p className="mt-2 max-w-md text-sm font-semibold text-slate-500">
        The engine ranks couriers only after destination zone and chargeable weight are available.
      </p>
    </div>
  );
}

function BreakdownRow({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={`text-sm ${strong ? 'font-black text-slate-950 dark:text-white' : 'font-bold text-slate-500'}`}>{label}</span>
      <span className={`text-sm ${strong ? 'font-black text-orange-600 dark:text-orange-300' : 'font-black text-slate-950 dark:text-white'}`}>{value}</span>
    </div>
  );
}
