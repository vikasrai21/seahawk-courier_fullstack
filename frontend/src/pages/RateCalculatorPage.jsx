import { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  AlertTriangle, 
  Calculator, 
  Settings,
  History,
  Zap,
  LayoutGrid,
  List,
  Target
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
import { PageHeader } from '../components/ui/PageHeader';

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
  const [zoneConf, setZoneConf] = useState(null);
  const [marginRules, setMarginRules] = useState([]);

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
  const volWt=useMemo(()=>{
    if(!useVol||!dims.l||!dims.b||!dims.h)return 0;
    const l = parseFloat(dims.l)||0; const b = parseFloat(dims.b)||0; const h = parseFloat(dims.h)||0;
    const divisor = (selGroup === 'B2B' || selGroup === 'LTL' || shipType === 'surface') ? 4500 : 5000;
    return (l * b * h) / divisor;
  },[useVol,dims,selGroup,shipType]);
  const chargeWt=useMemo(()=>Math.max(parseFloat(weight)||0,volWt),[weight,volWt]);
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
  const getPerCourierSell=useCallback((courier)=>{
    if(customPrice&&parseFloat(customPrice)>0)return parseFloat(customPrice);
    if(activeContract)return activeContract.total;
    if(!zone||!chargeWt)return 0;
    return proposalSell(zone,chargeWt,shipType,courier.level, courier.id)?.total||0;
  },[customPrice,activeContract,zone,chargeWt,shipType]);
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
        const bk=courierCost(c.id,zone,chargeWt,finalOda);
        if(!bk)return null;
        if (isDelhivery && delhiveryOda && !odaOn) bk.notes.push(`Auto-applied Delhivery ODA surcharge (₹${odaAmt})`);
        const sell=getPerCourierSell(c);
        const profit=rnd(sell-bk.total);
        const margin=sell>0?rnd((profit/sell)*100):0;
        return{...c,bk,sell,profit,margin};
      }).filter(Boolean)
      .sort((a,b)=>sortMode==='profit'?b.profit-a.profit:a.bk.total-b.bk.total);
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

  const handleSaveQuote = async () => {
    const c = quoteCourier || results[0];
    if (!c) return;
    setSavingQuote(true);
    try {
      const payload = { clientCode: selClient?.code || null, destination: locInfo?.label || query, pincode: locInfo?.pincode || null, state: zone?.seahawkZone || '', district: '', shipType, weight: chargeWt, courier: c.label, courierMode: c.mode, costTotal: c.bk.total, sellTotal: c.sell, profit: c.profit, margin: c.margin, notes: quoteNote || null, status: 'QUOTED', };
      const res = await api.post('/quotes', payload);
      setQuoteSaved({ quoteNo: res.data?.quoteNo || res.data?.data?.quoteNo || '' });
    } catch (e) { console.error('Save quote failed', e); } finally { setSavingQuote(false); }
  };

  const handlePrint=()=>{
    const c=quoteCourier||results[0]; if(!c)return;
    const win=window.open('','_blank');
    win.document.write(`<html><head><title>Rate Quote</title><style>body{font-family: 'Inter', sans-serif;padding:40px;max-width:600px;margin:auto;}h1{color:#1e293b}table{width:100%;border-collapse:collapse;margin-top:20px}td,th{padding:8px 12px;border:1px solid #e2e8f0;text-align:left}th{background:#f8fafc;font-weight:600}.total{font-size:1.4em;font-weight:700;color:#166534}.footer{margin-top:30px;font-size:0.8em;color:#64748b}</style></head><body><h1>Seahawk Logistics — Rate Quote</h1><p><b>Date:</b> ${new Date().toLocaleDateString('en-IN')}&nbsp;&nbsp;<b>Client:</b> ${selClient?.company||'—'}&nbsp;&nbsp;<b>Valid:</b> 30 days</p><table><tr><th>Field</th><th>Value</th></tr><tr><td>Destination</td><td>${locInfo?.label||query}</td></tr><tr><td>Courier</td><td>${c.label} (${c.mode})</td></tr><tr><td>Chargeable Weight</td><td>${chargeWt} kg</td></tr><tr><td>Courier Cost (incl. all)</td><td>${fmt(c.bk.total)}</td></tr><tr><td><b>Selling Price</b></td><td class="total">${fmt(c.sell)}</td></tr><tr><td>Your Profit</td><td style="color:${c.profit>0?'green':'red'}">${fmt(c.profit)}</td></tr><tr><td>Margin</td><td>${fmtP(c.margin)}</td></tr></table>${quoteNote?`<p style="margin-top:20px"><b>Notes:</b> ${quoteNote}</p>`:''}<div class="footer">Rates as per partner agreements. ODA/remote surcharges may apply. Contact us for bulk or annual contracts.</div></body></html>`);
    win.document.close(); win.print();
  };

  const best=results[0];
  const displayed=showAll?results:results.slice(0,6);
  const toggleHide=id=>{ setHiddenIds(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;}); };

  return (
    <div className="mx-auto max-w-[1280px] p-6 space-y-8 animate-in fade-in duration-700">
      <PageHeader 
        title="High-Speed Rate Engine" 
        subtitle="Contract-driven logistics calculation with automated ODA intelligence" 
        icon={Calculator}
        actions={
          <div className="flex gap-2">
             <button onClick={() => setShowSettings(!showSettings)} className={`p-2.5 rounded-2xl border transition-all ${showSettings ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                <Settings size={18} />
             </button>
          </div>
        }
      />

      {showSettings && (
        <div className="p-6 rounded-[32px] bg-slate-900 border border-slate-800 animate-in slide-in-from-top-4 duration-300">
           <HeaderPanel showSettings={true} setShowSettings={setShowSettings} couriers={COURIERS} hiddenIds={hiddenIds} toggleHide={toggleHide} recent={recent} zone={zone} loadRecent={loadRecent} />
        </div>
      )}

      {/* COMMAND CENTER: COMPACT INPUT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 h-full">
           <DestinationCard {...{pinLoad, query, handleQueryChange, zone, setQuery, setZone, setLocInfo, setExpanded, isPin, suggestions, selectCity, pinError, locInfo, odaOn, setOdaOn, odaAmt, setOdaAmt, zoneConf, delhiveryOda}} />
        </div>
        <div className="lg:col-span-4 h-full">
           <WeightCard {...{weight, setWeight, useVol, setUseVol, dims, setDims, chargeWt, volWt, targetMargin, setTargetMargin, results, selGroup, shipType, fmt}} />
        </div>
        <div className="lg:col-span-4 h-full space-y-6">
           <TypeLevelCard {...{shipType, setType, setExpanded, setShowAll, svcLevel, setSvcLevel, ecoCount: results.filter(r=>r.level==='economy').length, premCount: results.filter(r=>r.level==='premium').length}} />
           <CourierSelectCard selGroup={selGroup} setSelGroup={v=>{setSelGroup(v);setExpanded(null);}} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         <div className="lg:col-span-8">
            <SellingPriceBanner effectiveSell={effectiveSell} bannerColor={customPrice?'bg-amber-600':activeContract?'bg-blue-900':'bg-slate-900'} customPrice={customPrice} activeContract={activeContract} svcLevel={svcLevel} zone={zone} chargeWt={chargeWt} shipType={shipType} proposalSell={proposalSell} fmt={fmt} fmtP={fmtP} editPrice={editPrice} setEditPrice={setEditPrice} setCustomPrice={setCustomPrice} sortMode={sortMode} setSortMode={setSortMode} />
            
            {results.length > 0 && (
              <div className="mt-8 space-y-8">
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit border border-slate-200 dark:border-slate-800">
                   {[
                     { id: 'calc', label: 'Price Comparison', icon: LayoutGrid },
                     { id: 'sensitivity', label: 'Weight Sensitivity', icon: Target },
                     { id: 'quote', label: 'Quote Builder', icon: History }
                   ].map(t => (
                     <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${tab === t.id ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                        <t.icon size={14} /> {t.label}
                     </button>
                   ))}
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {tab === 'calc' && <ResultsPanel {...{best, sortMode, fmt, fmtP, results, odaOn, odaAmt, expanded, setExpanded, getMarginWarning, svcLevel, customPrice, activeContract, pColor, setQuoteCourier, showAll, setShowAll, targetMargin, fmtI}} />}
                  {tab === 'sensitivity' && <SensitivityTable {...{locInfo, shipType, visibleCouriers: results, sensitivityData, chargeWt, getPerCourierSell, rnd, fmt}} />}
                  {tab === 'quote' && <QuoteBuilder {...{results, quoteCourier, setQuoteCourier, fmt, fmtP, quoteNote, setQuoteNote, handlePrint, best, handleSaveQuote, savingQuote, quoteSaved, setQuoteSaved, locInfo, query, selClient, chargeWt, pColor}} />}
                </div>
              </div>
            )}

            {!zone && (
              <div className="mt-8 rounded-[40px] border border-dashed border-slate-200 dark:border-slate-800 p-16 text-center bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
                 <div className="w-20 h-20 rounded-[30px] bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300 mx-auto mb-8 border border-slate-100 dark:border-slate-800">
                    <Zap size={32} />
                 </div>
                 <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">System Standby</h2>
                 <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">Engagement requires destination and weight parameters. Enter a pincode to unlock specialized courier cost deltas from your verified contracts.</p>
              </div>
            )}
         </div>

         <div className="lg:col-span-4 space-y-6">
            <ClientCard {...{selClient, setSelClient, setContracts, setClientSearch, contractLoad, contracts, activeContract, fmt, clientSearch, setShowClients, showClients, filteredClients}} />
            
            <div className="rounded-[32px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 shadow-sm group">
               <div className="flex items-center justify-between mb-6">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Intelligence Snippet</h4>
                  <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${delhiveryOda ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                    {delhiveryOda ? 'ODA DETECTED' : 'NORMAL AREA'}
                  </div>
               </div>
               <p className="text-xs text-slate-500 leading-relaxed mb-6 italic">
                  {delhiveryOda 
                    ? 'The selected pincode has been flagged as Out-of-Delivery-Area by the Delhivery network. A mandatory surcharge of ₹500 is being applied to all Delhivery results.'
                    : 'System verification confirmed this pincode as a standard delivery node. No extra surcharges are required for base Delhivery network operations.'}
               </p>
               <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                     <span>Auto-Surcharge Threshold</span>
                     <span className="text-slate-800 dark:text-white">₹500.00</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
