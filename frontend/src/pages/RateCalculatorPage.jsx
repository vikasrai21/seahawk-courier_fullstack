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

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  TrendingUp, Zap, Info, ChevronDown, ChevronUp,
  Loader, Edit3, X,
  FileText, BarChart2, Calculator, AlertTriangle, CheckCircle,
  Package, ChevronRight, Printer
} from 'lucide-react';
import api from '../services/api';
import HeaderPanel from '../features/rate-calculator/components/HeaderPanel';
import DestinationCard from '../features/rate-calculator/components/DestinationCard';
import WeightCard from '../features/rate-calculator/components/WeightCard';
import TypeLevelCard from '../features/rate-calculator/components/TypeLevelCard';
import ClientCard from '../features/rate-calculator/components/ClientCard';

import {
  stateToZones,
  proposalSell,
  courierCost,
  COURIERS,
  CLR,
  CITY_LIST,
  fmt,
  fmtI,
  fmtP,
  pColor,
  WEIGHT_POINTS,
  rnd,
} from '../features/rate-calculator/core';

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

      <HeaderPanel
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        couriers={COURIERS}
        hiddenIds={hiddenIds}
        toggleHide={toggleHide}
        recent={recent}
        zone={zone}
        loadRecent={loadRecent}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        <DestinationCard
          pinLoad={pinLoad}
          query={query}
          handleQueryChange={handleQueryChange}
          zone={zone}
          setQuery={setQuery}
          setZone={setZone}
          setLocInfo={setLocInfo}
          setExpanded={setExpanded}
          isPin={isPin}
          suggestions={suggestions}
          selectCity={selectCity}
          pinError={pinError}
          locInfo={locInfo}
          odaOn={odaOn}
          setOdaOn={setOdaOn}
          odaAmt={odaAmt}
          setOdaAmt={setOdaAmt}
          zoneConf={zoneConf}
        />

        <WeightCard
          weight={weight}
          setWeight={setWeight}
          useVol={useVol}
          setUseVol={setUseVol}
          dims={dims}
          setDims={setDims}
          chargeWt={chargeWt}
          volWt={volWt}
          targetMargin={targetMargin}
          setTargetMargin={setTargetMargin}
          results={results}
          fmt={fmt}
        />

        <TypeLevelCard
          shipType={shipType}
          setType={setType}
          setExpanded={setExpanded}
          setShowAll={setShowAll}
          svcLevel={svcLevel}
          setSvcLevel={setSvcLevel}
          ecoCount={ecoCount}
          premCount={premCount}
        />
      </div>

      <ClientCard
        selClient={selClient}
        setSelClient={setSelClient}
        setContracts={setContracts}
        setClientSearch={setClientSearch}
        contractLoad={contractLoad}
        contracts={contracts}
        activeContract={activeContract}
        fmt={fmt}
        clientSearch={clientSearch}
        setShowClients={setShowClients}
        showClients={showClients}
        filteredClients={filteredClients}
      />

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

