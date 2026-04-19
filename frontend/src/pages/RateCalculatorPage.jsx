import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings,
  Search,
  Cpu
} from 'lucide-react';
import api from '../services/api';
import { useDataStore } from '../stores/dataStore';
import HeaderPanel from '../features/rate-calculator/components/HeaderPanel';
import DestinationCard from '../features/rate-calculator/components/DestinationCard';
import WeightCard from '../features/rate-calculator/components/WeightCard';
import TypeLevelCard from '../features/rate-calculator/components/TypeLevelCard';
import ClientCard from '../features/rate-calculator/components/ClientCard';
import SellingPriceBanner from '../features/rate-calculator/components/SellingPriceBanner';
import ResultsPanel from '../features/rate-calculator/components/ResultsPanel';
import SensitivityTable from '../features/rate-calculator/components/SensitivityTable';
import QuoteBuilder from '../features/rate-calculator/components/QuoteBuilder';
import CourierSelectCard from '../features/rate-calculator/components/CourierSelectCard';

import {
  stateToZones,
  proposalSell,
  courierCost,
  COURIERS,
  CITY_LIST,
  fmt,
  fmtI,
  fmtP,
  pColor,
  WEIGHT_POINTS,
  rnd,
} from '../features/rate-calculator/core';

export default function RateCalculatorPage() {
  const navigate = useNavigate();
  const [query,    setQuery]   = useState('');
  const [zone,     setZone]    = useState(null);
  const [locInfo,  setLocInfo] = useState(null);
  const [pinLoad,  setPinLoad] = useState(false);
  const [pinError, setPinErr]  = useState('');
  const [weight,   setWeight]  = useState('');
  const [useVol,   setUseVol]  = useState(false);
  const [dims,     setDims]    = useState({l:'',b:'',h:''});
  const [shipType, setType]    = useState('doc');
  const [svcLevel, setSvcLevel]= useState('all');
  const [odaOn,    setOdaOn]   = useState(false);
  const [odaAmt,   setOdaAmt]  = useState(500);
  const [delhiveryOda, setDelhiveryOda] = useState(false);
  const clients = useDataStore((state) => state.clients);
  const fetchClients = useDataStore((state) => state.fetchClients);
  const [selClient,    setSelClient]   = useState(null);
  const [contracts,    setContracts]   = useState([]);
  const [contractLoad, setContractLoad]= useState(false);
  const [clientSearch, setClientSearch]= useState('');
  const [showClients,  setShowClients] = useState(false);
  const [customPrice,  setCustomPrice] = useState('');
  const [editPrice,    setEditPrice]   = useState(false);
  const [sortMode,   setSortMode]  = useState('profit');
  const [goalMode,   setGoalMode]  = useState('profit'); // profit | cost | speed
  const [showAll,    setShowAll]   = useState(false);
  const [expanded,   setExpanded]  = useState(null);
  const [tab,        setTab]       = useState('calc');
  const [showSettings,setShowSettings]=useState(false);
  const [selGroup,    setSelGroup]    = useState('all');
  const [hiddenIds,  setHiddenIds] = useState(() => { try { return new Set(JSON.parse(sessionStorage.getItem('sh_hidden_couriers') || '[]')); } catch { return new Set(); } });
  const [recent, setRecent] = useState([]);
  const [targetMargin, setTargetMargin] = useState('');
  const [quoteNote, setQuoteNote] = useState('');
  const [quoteCourier, setQuoteCourier] = useState(null);
  const [savingQuote, setSavingQuote] = useState(false);
  const [quoteSaved, setQuoteSaved] = useState(null);
  const [quickActionMsg, setQuickActionMsg] = useState('');
  const [zoneConf, setZoneConf] = useState(null);
  const [marginRules, setMarginRules] = useState([]);
  const [laneIntel, setLaneIntel] = useState(null);
  const [laneIntelLoading, setLaneIntelLoading] = useState(false);
  const actionMsgTimerRef = useRef(null);

  useEffect(() => { fetchClients().catch(() => {}); }, [fetchClients]);
  useEffect(()=>{ api.get('/rates/margin-rules').then(r=>setMarginRules((r.data?.data||[]).filter(mr=>mr.active))).catch(()=>{}); },[]);
  useEffect(()=>{
    if(!selClient){setContracts([]);return;}
    setContractLoad(true);
    api.get(`/contracts/client/${selClient.code}`).then(r=>setContracts(r.data?.data||[]))
      .catch(()=>setContracts([])).finally(()=>setContractLoad(false));
  },[selClient]);
  useEffect(()=>{ sessionStorage.setItem('sh_hidden_couriers', JSON.stringify([...hiddenIds])); },[hiddenIds]);
  const addRecent=useCallback(entry=>{ setRecent(r=>[entry,...r.filter(e=>e.query!==entry.query)].slice(0,5)); },[]);

  const lookupPin = useCallback(async pin=>{
    setPinLoad(true);setPinErr('');setZone(null);setLocInfo(null);setDelhiveryOda(false);
    try{
      const res = await api.get('/pincodes/lookup', { params: { pin } });
      const po = res?.data?.postOffice;
      if(po){
        const z=stateToZones(po.State,po.District,po.Name);
        setZone(z);
        const li={label:`${po.District}, ${po.State}`,pincode:pin};
        setLocInfo(li);
        setZoneConf('high');
        addRecent({query:pin,zone:z,locInfo:li,zoneConf:'high'});
        api.get(`/delhivery/serviceability?pin=${pin}`).then(r => { if (r.data?.is_oda) setDelhiveryOda(true); }).catch(() => {});
      }else{ setPinErr('PIN not found — try city search.'); }
    }catch(err){ setPinErr('PIN lookup failed — check connection.'); }finally{setPinLoad(false);}
  },[addRecent]);

  const isPin=/^\d+$/.test(query.trim());
  const suggestions=useMemo(()=>{
    if(!query||isPin||zone)return[];
    return CITY_LIST.filter(c=>c.label.toLowerCase().includes(query.toLowerCase())).slice(0,8);
  },[query,isPin,zone]);

  const handleQueryChange=v=>{
    const raw = String(v || '');
    const hasLetters = /[a-z]/i.test(raw);
    const normalized = hasLetters ? raw.slice(0, 50) : raw.replace(/\D/g, '').slice(0, 6);
    setQuery(normalized);setZone(null);setLocInfo(null);setPinErr('');setZoneConf(null);
    setCustomPrice('');setEditPrice(false);setExpanded(null);
    if(/^\d{6}$/.test(normalized))lookupPin(normalized);
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
  const volWt=useMemo(()=>{
    if(!useVol||!dims.l||!dims.b||!dims.h)return 0;
    const l = parseFloat(dims.l)||0; const b = parseFloat(dims.b)||0; const h = parseFloat(dims.h)||0;
    const divisor = (selGroup === 'B2B' || selGroup === 'LTL' || shipType === 'surface') ? 4500 : 5000;
    return (l * b * h) / divisor;
  },[useVol,dims,selGroup,shipType]);
  const chargeWt=useMemo(()=>Math.max(parseFloat(weight)||0,volWt),[weight,volWt]);
  useEffect(() => {
    if (!zone || !chargeWt) { setLaneIntel(null); return; }
    const destination = locInfo?.label || query;
    const pincode = locInfo?.pincode || '';
    if (!destination && !pincode) { setLaneIntel(null); return; }
    setLaneIntelLoading(true);
    api.get('/rates/intelligence', { params: { destination, pincode, shipType, days: 90 } })
      .then((res) => setLaneIntel(res.data?.data || null))
      .catch(() => setLaneIntel(null))
      .finally(() => setLaneIntelLoading(false));
  }, [zone, chargeWt, locInfo, query, shipType]);
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
    if(customPrice&&parseFloat(customPrice)>0) return{total:parseFloat(customPrice),source:'Manual Override',base:parseFloat(customPrice),fsc:0,gst:0,fscPct:'—'};
    if(activeContract)return activeContract;
    return proposalSellPrice;
  },[customPrice,activeContract,proposalSellPrice]);
  const getPerCourierSell = useCallback((courier, landedCost = 0) => {
    if (customPrice && parseFloat(customPrice) > 0) return parseFloat(customPrice);
    if (activeContract) return activeContract.total;
    if (!zone || !chargeWt) return 0;
    return proposalSell(zone, chargeWt, shipType, courier.level, landedCost)?.total || 0;
  }, [customPrice, activeContract, zone, chargeWt, shipType]);

  const results=useMemo(()=>{
    if(!zone||!chargeWt)return[];
    const generalOda = odaOn ? parseFloat(odaAmt) || 0 : 0;
    return COURIERS
      .filter(c=>c.types.includes(shipType))
      .filter(c=>svcLevel==='all'||c.level===svcLevel)
      .filter(c=>!hiddenIds.has(c.id))
      .filter(c=>selGroup==='all'||c.group===selGroup)
      .map(c=>{
        const isDelhivery = c.group === 'Delhivery';
        const finalOda = (isDelhivery && delhiveryOda) ? (parseFloat(odaAmt) || 500) : generalOda;
        const bk = courierCost(c.id, zone, chargeWt, finalOda);
        if (!bk) return null;
        if (isDelhivery && delhiveryOda && !odaOn) bk.notes.push(`Auto-applied Delhivery ODA surcharge (₹${odaAmt})`);
        const sell = getPerCourierSell(c, bk.total);
        const profit = rnd(sell - bk.total);
        const margin=sell>0?rnd((profit/sell)*100):0;
        return{...c,bk,sell,profit,margin};
      }).filter(Boolean)
      .sort((a,b)=>{
        if (sortMode === 'profit') return b.profit - a.profit;
        if (sortMode === 'cost') return a.bk.total - b.bk.total;
        if (sortMode === 'speed') {
          const aSpeed = a.level === 'premium' ? 1 : 0;
          const bSpeed = b.level === 'premium' ? 1 : 0;
          if (aSpeed !== bSpeed) return bSpeed - aSpeed;
          return a.bk.total - b.bk.total;
        }
        return 0;
      });
  },[zone,chargeWt,sortMode,shipType,svcLevel,hiddenIds,odaOn,odaAmt,delhiveryOda,getPerCourierSell,selGroup]);

  const sensitivityData=useMemo(()=>{
    if(!zone)return[];
    const topIds=COURIERS.filter(c=>c.types.includes(shipType)&&!hiddenIds.has(c.id)).map(c=>c.id);
    return WEIGHT_POINTS.map(w=>{
      const row={w};
      topIds.forEach(id=>{ const bk=courierCost(id,zone,w,0); row[id]=bk?bk.total:null; });
      return row;
    });
  },[zone,shipType,hiddenIds]);

  const filteredClients=useMemo(()=> clients.filter(c=>(c.company||'').toLowerCase().includes(clientSearch.toLowerCase())).slice(0,8),[clients,clientSearch]);
  
  const getMarginWarning = useCallback((courierId, margin) => {
    if (!marginRules.length || !zone) return null;
    const applicable = marginRules.filter(rule => {
      if (rule.courier && rule.courier !== courierId) return false;
      if (rule.zone && rule.zone !== zone.seahawkZone) return false;
      if (rule.shipType && rule.shipType !== shipType) return false;
      return true;
    });
    if (!applicable.length) return null;
    const sorted = [...applicable].sort((a,b)=> ((b.courier?2:0)+(b.zone?1:0)) - ((a.courier?2:0)+(a.zone?1:0)) );
    const rule = sorted[0];
    return margin < rule.minMarginPct ? rule : null;
  }, [marginRules, zone, shipType]);

  const flashQuickAction = useCallback((message) => {
    if (!message) return;
    setQuickActionMsg(message);
    if (actionMsgTimerRef.current) clearTimeout(actionMsgTimerRef.current);
    actionMsgTimerRef.current = setTimeout(() => setQuickActionMsg(''), 3500);
  }, []);

  useEffect(() => () => {
    if (actionMsgTimerRef.current) clearTimeout(actionMsgTimerRef.current);
  }, []);

  const handleSaveQuote = async () => {
    const c = quoteCourier || results[0];
    if (!c) return;
    setSavingQuote(true);
    try {
      const payload = { clientCode: selClient?.code || null, destination: locInfo?.label || query, pincode: locInfo?.pincode || null, state: zone?.seahawkZone || '', district: '', shipType, weight: chargeWt, courier: c.label, courierMode: c.mode, costTotal: c.bk.total, sellTotal: c.sell, profit: c.profit, margin: c.margin, notes: quoteNote || null, status: 'QUOTED', };
      const res = await api.post('/quotes', payload);
      const quoteNo = res.data?.quoteNo || res.data?.data?.quoteNo || '';
      setQuoteSaved({ quoteNo });
      flashQuickAction(quoteNo ? `Quote ${quoteNo} saved.` : 'Quote saved.');
    } catch (e) {
      console.error('Save quote failed', e);
      flashQuickAction('Save failed. Please retry.');
    } finally { setSavingQuote(false); }
  };

  const handlePrint=()=>{
    const c=quoteCourier||results[0]; if(!c)return;
    const win=window.open('','_blank');
    win.document.write(`<html><head><title>Rate Quote</title><style>body{font-family: 'Inter', sans-serif;padding:40px;max-width:600px;margin:auto;}h1{color:#1e293b}table{width:100%;border-collapse:collapse;margin-top:20px}td,th{padding:8px 12px;border:1px solid #e2e8f0;text-align:left}th{background:#f8fafc;font-weight:600}.total{font-size:1.4em;font-weight:700;color:#166534}.footer{margin-top:30px;font-size:0.8em;color:#64748b}</style></head><body><h1>Seahawk Logistics — Rate Quote</h1><p><b>Date:</b> ${new Date().toLocaleDateString('en-IN')}&nbsp;&nbsp;<b>Client:</b> ${selClient?.company||'—'}&nbsp;&nbsp;<b>Valid:</b> 30 days</p><table><tr><th>Field</th><th>Value</th></tr><tr><td>Destination</td><td>${locInfo?.label||query}</td></tr><tr><td>Courier</td><td>${c.label} (${c.mode})</td></tr><tr><td>Chargeable Weight</td><td>${chargeWt} kg</td></tr><tr><td>Courier Cost (incl. all)</td><td>${fmt(c.bk.total)}</td></tr><tr><td><b>Selling Price</b></td><td class="total">${fmt(c.sell)}</td></tr><tr><td>Your Profit</td><td style="color:${c.profit>0?'green':'red'}">${fmt(c.profit)}</td></tr><tr><td>Margin</td><td>${fmtP(c.margin)}</td></tr></table>${quoteNote?`<p style="margin-top:20px"><b>Notes:</b> ${quoteNote}</p>`:''}<div class="footer">Rates as per partner agreements. ODA/remote surcharges may apply. Contact us for bulk or annual contracts.</div></body></html>`);
    win.document.close(); win.print();
  };

  const best=results[0];
  const toggleHide=id=>{ setHiddenIds(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;}); };

  const handleBookShipment = useCallback(() => {
    const selected = quoteCourier || best;
    if (!selected) {
      flashQuickAction('Calculate a quote first.');
      return;
    }
    const params = new URLSearchParams({
      destination: locInfo?.label || query || '',
      pincode: locInfo?.pincode || '',
      weight: String(chargeWt || ''),
      amount: String(rnd(selected.sell || 0)),
      courier: selected.label || '',
    });
    navigate(`/app/entry?${params.toString()}`);
  }, [quoteCourier, best, flashQuickAction, locInfo, query, chargeWt, navigate]);

  const handleSendToClient = useCallback(async () => {
    const selected = quoteCourier || best;
    if (!selected) {
      flashQuickAction('Calculate a quote first.');
      return;
    }
    const shareText = [
      'Seahawk Quote',
      `Destination: ${locInfo?.label || query || '—'}`,
      `Courier: ${selected.label} (${selected.mode})`,
      `Chargeable Weight: ${chargeWt.toFixed(2)} kg`,
      `Landed Cost: ${fmt(selected.bk.total)}`,
      `Sell Price: ${fmt(selected.sell)}`,
      `Margin: ${fmtP(selected.margin)}`,
      `Profit: ${fmt(selected.profit)}`,
    ].join('\n');

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Seahawk Rate Quote', text: shareText });
        flashQuickAction('Quote shared.');
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        flashQuickAction('Quote copied. Paste and send to client.');
        return;
      }
      flashQuickAction('Share is not supported on this browser.');
    } catch (err) {
      if (err?.name !== 'AbortError') flashQuickAction('Could not share quote.');
    }
  }, [quoteCourier, best, flashQuickAction, locInfo, query, chargeWt]);

  const intelligence = useMemo(() => {
    const notes = [];
    let score = 0;
    if (zone) { score += 30; notes.push('Zone resolved'); }
    if (locInfo?.pincode) { score += 10; notes.push('PIN verified'); }
    if (chargeWt > 0) { score += 20; notes.push('Chargeable weight ready'); }
    if (shipType) { score += 10; }
    if (svcLevel !== 'all') { score += 5; notes.push(`Service level: ${svcLevel}`); }
    if (activeContract) { score += 10; notes.push('Contract pricing applied'); }
    if (customPrice) { score += 10; notes.push('Manual price override'); }
    if (delhiveryOda) { score += 5; notes.push('ODA detected'); }
    if (useVol && volWt > 0) { notes.push('Volumetric weight considered'); }
    if (targetMargin && best?.margin != null) {
      const tm = parseFloat(targetMargin);
      if (!Number.isNaN(tm)) {
        const diff = rnd(best.margin - tm);
        notes.push(diff >= 0 ? `Meets target margin (+${diff}%)` : `Below target margin (${diff}%)`);
      }
    }
    const recommendation = best
      ? (sortMode === 'profit'
        ? `Recommended for highest profit (${fmt(best.profit)})`
        : sortMode === 'cost'
          ? `Recommended for lowest cost (${fmt(best.bk.total)})`
          : `Recommended for fastest lane (priority first)`)
      : 'Enter destination and weight to calculate';
    const clamped = Math.max(30, Math.min(95, score));
    const totals = laneIntel?.totals;
    const rtoRate = totals?.rtoRate ?? null;
    const slaRate = totals?.slaBreachRate ?? null;
    const stuckRate = totals?.stuckRate ?? null;
    const rtoProb = rtoRate == null ? null : (rtoRate >= 0.2 ? 'High' : rtoRate >= 0.1 ? 'Medium' : 'Low');
    const slaRisk = slaRate == null ? null : (slaRate >= 0.2 ? 'High' : slaRate >= 0.1 ? 'Medium' : 'Low');
    const stuckRisk = stuckRate == null ? null : (stuckRate >= 0.2 ? 'High' : stuckRate >= 0.1 ? 'Medium' : 'Low');
    const riskFlags = [
      rtoRate != null && rtoRate >= 0.15 ? 'High RTO lane' : null,
      slaRate != null && slaRate >= 0.2 ? 'Frequent SLA breaches' : null,
      stuckRate != null && stuckRate >= 0.2 ? 'Scan delays' : null,
      totals?.shipments != null && totals.shipments < 10 ? 'Low sample size' : null,
      delhiveryOda ? 'ODA zone detected' : null,
    ].filter(Boolean);
    return { score: clamped, notes, recommendation, rtoProb, slaRisk, stuckRisk, riskFlags, laneTotals: totals };
  }, [zone, locInfo, chargeWt, shipType, svcLevel, activeContract, customPrice, delhiveryOda, useVol, volWt, targetMargin, best, sortMode, fmt, zoneConf, laneIntel]);

  return (
    <div className="mx-auto max-w-[1300px] p-6 space-y-6 reveal rate-slim">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm">
              <Cpu size={18} className="text-white" />
           </div>
           <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
                 Rate Calculator
              </h1>
              <p className="text-xs text-slate-500">Fast, clean quotes across partners.</p>
           </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => setTab('calc')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${tab === 'calc' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Results
              </button>
              <button 
                onClick={() => setTab('sensitivity')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${tab === 'sensitivity' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Sensitivity
              </button>
              <button 
                onClick={() => setTab('quote')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${tab === 'quote' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Quote
              </button>
           </div>
           <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
              {[
                ['profit', 'Best Margin'],
                ['cost', 'Lowest Cost'],
                ['speed', 'Fastest'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => { setGoalMode(id); setSortMode(id); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    goalMode === id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
           </div>
           
           <button 
              onClick={() => setShowSettings(!showSettings)} 
              className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${showSettings ? 'bg-blue-600 border-blue-500 text-white rotate-90 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
           >
              <Settings size={16} />
           </button>
        </div>
      </div>

      {showSettings && (
        <div className="reveal">
           <HeaderPanel showSettings={true} setShowSettings={setShowSettings} couriers={COURIERS} hiddenIds={hiddenIds} toggleHide={toggleHide} recent={recent} zone={zone} loadRecent={loadRecent} />
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4">
          <DestinationCard {...{pinLoad, query, handleQueryChange, zone, setQuery, setZone, setLocInfo, setExpanded, isPin, suggestions, selectCity, pinError, locInfo, odaOn, setOdaOn, odaAmt, setOdaAmt, zoneConf, delhiveryOda}} />
        </div>
        <div className="lg:col-span-4">
          <WeightCard {...{weight, setWeight, useVol, setUseVol, dims, setDims, chargeWt, volWt, targetMargin, setTargetMargin, results, selGroup, shipType, fmt}} />
        </div>
        <div className="lg:col-span-4">
          <TypeLevelCard {...{shipType, setType, setExpanded, setShowAll, svcLevel, setSvcLevel, ecoCount: results.filter(r=>r.level==='economy').length, premCount: results.filter(r=>r.level==='premium').length}} />
        </div>
        <div className="lg:col-span-4">
          <CourierSelectCard selGroup={selGroup} setSelGroup={v=>{setSelGroup(v);setExpanded(null);}} />
        </div>
        <div className="lg:col-span-4">
          <ClientCard {...{selClient, setSelClient, setContracts, setClientSearch, contractLoad, contracts, activeContract, fmt, clientSearch, setShowClients, showClients, filteredClients}} />
        </div>
        <div className="lg:col-span-4">
          <div className="rate-section h-full">
             <div className="flex items-center justify-between mb-2">
               <p className="text-sm font-semibold text-slate-900">Delhivery check</p>
               <div className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${delhiveryOda ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
                 {delhiveryOda ? 'ODA applied' : 'Auto check'}
               </div>
             </div>
             <p className="text-xs text-slate-500">
               {delhiveryOda ? 'ODA is active for this PIN. Surcharge will be applied.' : 'No ODA detected for this PIN.'}
             </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         <div className="lg:col-span-12 space-y-6">
            {zone && chargeWt > 0 && (
              <div className={tab === 'calc' ? 'sticky top-3 z-20' : ''}>
                <SellingPriceBanner
                  effectiveSell={effectiveSell}
                  bannerColor={customPrice?'bg-amber-600':activeContract?'bg-blue-900':'bg-slate-900'}
                  customPrice={customPrice}
                  activeContract={activeContract}
                  svcLevel={svcLevel}
                  zone={zone}
                  chargeWt={chargeWt}
                  shipType={shipType}
                  proposalSell={(z,w,s,l) => proposalSell(z,w,s,l, results[0]?.bk?.total || 0)}
                  fmt={fmt}
                  fmtP={fmtP}
                  editPrice={editPrice}
                  setEditPrice={setEditPrice}
                  setCustomPrice={setCustomPrice}
                  sortMode={sortMode}
                  setSortMode={setSortMode}
                  onBookShipment={handleBookShipment}
                  onSaveQuote={handleSaveQuote}
                  onSendToClient={handleSendToClient}
                  savingQuote={savingQuote}
                  quickActionMsg={quickActionMsg}
                />
              </div>
            )}
            
            {results.length > 0 ? (
              <div className="reveal">
                {tab === 'calc' && (
                  <>
                    <div className="rate-section mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Recommendation intelligence</p>
                          <p className="text-xs text-slate-500">{intelligence.recommendation}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] text-slate-500">Confidence</p>
                          <p className="text-sm font-semibold text-slate-900">{intelligence.score}%</p>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${intelligence.score}%` }} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {intelligence.notes.slice(0, 5).map((n) => (
                          <span key={n} className="text-[11px] text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-1">
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="rate-section">
                        <p className="text-xs text-slate-500 mb-1">Risk flags</p>
                        <div className="flex flex-wrap gap-2">
                          {(intelligence.riskFlags.length ? intelligence.riskFlags : ['No critical flags']).map((f) => (
                            <span key={f} className="text-[11px] text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-1">
                              {f}
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2">
                          {laneIntelLoading ? 'Loading lane signals…' : (intelligence.laneTotals ? `Sample: ${intelligence.laneTotals.shipments} shipments (90d)` : 'Connect tracking feed for live signals.')}
                        </p>
                      </div>
                      <div className="rate-section">
                        <p className="text-xs text-slate-500 mb-1">SLA breach risk</p>
                        <p className="text-sm font-semibold text-slate-900">{intelligence.slaRisk || '—'}</p>
                        <p className="text-[11px] text-slate-400 mt-2">
                          {intelligence.laneTotals?.slaBreachRate != null ? `Lane rate: ${(intelligence.laneTotals.slaBreachRate * 100).toFixed(1)}%` : 'Based on lane history.'}
                        </p>
                      </div>
                      <div className="rate-section">
                        <p className="text-xs text-slate-500 mb-1">Stuck-in-scan risk</p>
                        <p className="text-sm font-semibold text-slate-900">{intelligence.stuckRisk || '—'}</p>
                        <p className="text-[11px] text-slate-400 mt-2">
                          {intelligence.laneTotals?.stuckRate != null ? `Lane rate: ${(intelligence.laneTotals.stuckRate * 100).toFixed(1)}%` : 'Powered by scan freshness.'}
                        </p>
                      </div>
                      <div className="rate-section">
                        <p className="text-xs text-slate-500 mb-1">RTO probability</p>
                        <p className="text-sm font-semibold text-slate-900">{intelligence.rtoProb || '—'}</p>
                        <p className="text-[11px] text-slate-400 mt-2">
                          {intelligence.laneTotals?.rtoRate != null ? `Lane rate: ${(intelligence.laneTotals.rtoRate * 100).toFixed(1)}%` : 'Predictive with history.'}
                        </p>
                      </div>
                    </div>
                    <ResultsPanel {...{best, sortMode, fmt, fmtP, results, odaOn, odaAmt, expanded, setExpanded, getMarginWarning, svcLevel, customPrice, activeContract, pColor, setQuoteCourier, showAll, setShowAll, targetMargin, fmtI, intelligence}} compact />
                  </>
                )}
                {tab === 'sensitivity' && <SensitivityTable {...{locInfo, shipType, visibleCouriers: results, sensitivityData, chargeWt, getPerCourierSell, rnd, fmt}} />}
                {tab === 'quote' && <QuoteBuilder {...{results, quoteCourier, setQuoteCourier, fmt, fmtP, quoteNote, setQuoteNote, handlePrint, best, handleSaveQuote, savingQuote, quoteSaved, setQuoteSaved, locInfo, query, selClient, chargeWt, pColor}} />}
              </div>
            ) : zone && (
              <div className="rate-section text-center border border-dashed rounded-xl py-10">
                 <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300 mx-auto mb-3">
                    <Search size={20} />
                 </div>
                 <h3 className="text-sm font-black text-slate-800 tracking-tight">No compatible networks</h3>
                 <p className="text-xs text-slate-500 mt-1">Adjust weight or mode.</p>
              </div>
            )}

            {!zone && (
              <div className="rate-section text-center py-8">
                 <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Enter a destination to start</h2>
                 <p className="text-xs text-slate-500">PIN or city, then weight.</p>
              </div>
            )}
         </div>
      </div>

      <style>{`
        .rate-slim .rate-section {
          padding: 16px;
          background: #ffffff;
          border: 1px solid rgba(226,232,240,0.9);
          border-radius: 16px;
          box-shadow: 0 6px 18px rgba(15,23,42,0.05);
        }
        .rate-slim .card,
        .rate-slim .card-premium {
          border-radius: 16px !important;
          padding: 16px !important;
          box-shadow: 0 6px 18px rgba(15,23,42,0.05) !important;
        }
        .rate-slim .card-hover { transform: none !important; }
        .rate-slim .input {
          border-radius: 10px !important;
          padding: 9px 10px !important;
          font-size: 13px !important;
        }
      `}</style>
    </div>
  );
}
