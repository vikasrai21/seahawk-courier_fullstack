/**
 * Seahawk Courier Rate & Profit Calculator
 * Logic is contract-driven: if a charge is not explicitly written in the
 * source rate sheet, it is not applied in calculation.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { AlertTriangle, BarChart2, Calculator, Package, Printer } from 'lucide-react';
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
  COURIER_GROUPS,
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
  const [odaAmt,   setOdaAmt]  = useState(500);
  const [delhiveryOda, setDelhiveryOda] = useState(false);

  // ── Client ──
  const clients = useDataStore((state) => state.clients);
  const fetchClients = useDataStore((state) => state.fetchClients);
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
  const [selGroup,    setSelGroup]    = useState('all'); // all | Delhivery | Trackon | DTDC | BlueDart | LTL
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
  useEffect(() => {
    fetchClients().catch(() => {});
  }, [fetchClients]);

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
  const addRecent=useCallback(entry=>{
    setRecent(r=>[entry,...r.filter(e=>e.query!==entry.query)].slice(0,5));
  },[]);

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

        // ── Delhivery ODA Auto-check ──
        api.get(`/delhivery/serviceability?pin=${pin}`)
          .then(r => {
            if (r.data?.is_oda) setDelhiveryOda(true);
          })
          .catch(() => {});
      }else{
        setPinErr('PIN not found — try city search.');
      }
    }catch(err){
      if(err?.status===404) setPinErr('PIN not found — try city search.');
      else setPinErr('PIN lookup failed — check connection.');
    }finally{setPinLoad(false);}
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

  // Volumetric weight
  const volWt=useMemo(()=>{
    if(!useVol||!dims.l||!dims.b||!dims.h)return 0;
    const l = parseFloat(dims.l)||0;
    const b = parseFloat(dims.b)||0;
    const h = parseFloat(dims.h)||0;
    const divisor = (selGroup === 'B2B' || selGroup === 'LTL' || shipType === 'surface') ? 4500 : 5000;
    return (l * b * h) / divisor;
  },[useVol,dims,selGroup,shipType]);
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
  const getPerCourierSell=useCallback((courier)=>{
    if(customPrice&&parseFloat(customPrice)>0)return parseFloat(customPrice);
    if(activeContract)return activeContract.total;
    if(!zone||!chargeWt)return 0;
    return proposalSell(zone,chargeWt,shipType,courier.level, courier.id)?.total||0;
  },[customPrice,activeContract,zone,chargeWt,shipType]);

  // Results
  const results=useMemo(()=>{
    if(!zone||!chargeWt)return[];
    const generalOda = odaOn ? parseFloat(odaAmt) || 0 : 0;
    
    return COURIERS
      .filter(c=>c.types.includes(shipType))
      .filter(c=>svcLevel==='all'||c.level===svcLevel)
      .filter(c=>!hiddenIds.has(c.id))
      .filter(c=>selGroup==='all'||c.group===selGroup)
      .map(c=>{
        // Delhivery ODA is automatic even if general ODA is off
        const isDelhivery = c.group === 'Delhivery';
        const finalOda = (isDelhivery && delhiveryOda) ? (parseFloat(odaAmt) || 500) : generalOda;
        
        const bk=courierCost(c.id,zone,chargeWt,finalOda);
        if(!bk)return null;

        // If local ODA was applied, add a note
        if (isDelhivery && delhiveryOda && !odaOn) {
          bk.notes.push(`Auto-applied Delhivery ODA surcharge (₹${odaAmt})`);
        }

        const sell=getPerCourierSell(c);
        const profit=rnd(sell-bk.total);
        const margin=sell>0?rnd((profit/sell)*100):0;
        return{...c,bk,sell,profit,margin};
      }).filter(Boolean)
      .sort((a,b)=>sortMode==='profit'?b.profit-a.profit:a.bk.total-b.bk.total);
  },[zone,chargeWt,effectiveSell,sortMode,shipType,svcLevel,hiddenIds,odaOn,odaAmt,delhiveryOda,getPerCourierSell,selGroup]);

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
  const visibleCouriers = byType;
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
      <style>body{font-family: 'Inter', sans-serif;padding:40px;max-width:600px;margin:auto;}
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
    <div className="p-4 md:p-6 max-w-5xl mx-auto">

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
          delhiveryOda={delhiveryOda}
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
          selGroup={selGroup}
          shipType={shipType}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        <CourierSelectCard
          selGroup={selGroup}
          setSelGroup={v=>{setSelGroup(v);setExpanded(null);}}
        />

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

        <div className="card !p-4 flex flex-col justify-center gap-3 border-slate-200/90">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Delhivery Check</span>
            <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${delhiveryOda ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
              {delhiveryOda ? 'ODA DETECTED' : (selGroup === 'Delhivery' ? 'CLEAN CITY' : 'AUTO-DETECTION')}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {selGroup === 'Delhivery' 
              ? 'The Delhivery lookup verifies whether the selected pincode is standard or ODA before the result list is ranked.'
              : 'Select Delhivery focus when you want serviceability and ODA feedback to be shown more prominently.'}
          </p>
          {delhiveryOda && (
            <div className="px-3 py-2.5 bg-rose-50 border border-rose-200/70 rounded-2xl">
              <p className="text-[11px] text-rose-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Warning: Delhivery ODA surcharge (₹{odaAmt}) applied.
              </p>
            </div>
          )}
        </div>
      </div>

      <SellingPriceBanner
        effectiveSell={effectiveSell}
        bannerColor={bannerColor}
        customPrice={customPrice}
        activeContract={activeContract}
        svcLevel={svcLevel}
        zone={zone}
        chargeWt={chargeWt}
        shipType={shipType}
        proposalSell={proposalSell}
        fmt={fmt}
        fmtP={fmtP}
        editPrice={editPrice}
        setEditPrice={setEditPrice}
        setCustomPrice={setCustomPrice}
        sortMode={sortMode}
        setSortMode={setSortMode}
      />

      {/* Tabs (Premium Pill) */}
      {results.length>0&&(
        <div className="flex gap-1 mb-5 bg-white p-1 rounded-full w-fit border border-slate-200 shadow-sm">
          {[['calc','Calculator',Calculator],['sensitivity','Sensitivity',BarChart2],['quote','Quote',Printer]].map(([id,label,Icon])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-4 py-2 rounded-full text-[13px] font-bold flex items-center gap-2 transition-all duration-300 ${tab===id?'bg-slate-900 text-white shadow-[0_8px_18px_rgba(15,23,42,0.14)]':'text-slate-500 hover:text-slate-800'}`}>
              <Icon className="w-4 h-4"/>{label}
            </button>
          ))}
        </div>
      )}

      {/* CALCULATOR TAB ── */}
      {(!results.length||tab==='calc')&&(
        <ResultsPanel
          best={best}
          sortMode={sortMode}
          fmt={fmt}
          fmtP={fmtP}
          results={results}
          displayed={displayed}
          odaOn={odaOn}
          odaAmt={odaAmt}
          expanded={expanded}
          setExpanded={setExpanded}
          getMarginWarning={getMarginWarning}
          svcLevel={svcLevel}
          customPrice={customPrice}
          activeContract={activeContract}
          pColor={pColor}
          setQuoteCourier={setQuoteCourier}
          showAll={showAll}
          setShowAll={setShowAll}
          targetMargin={targetMargin}
          fmtI={fmtI}
        />
      )}

      {/* SENSITIVITY TAB ── */}
      {tab==='sensitivity'&&results.length>0&&(
        <SensitivityTable
          locInfo={locInfo}
          shipType={shipType}
          visibleCouriers={visibleCouriers}
          sensitivityData={sensitivityData}
          chargeWt={chargeWt}
          getPerCourierSell={getPerCourierSell}
          rnd={rnd}
          fmt={fmt}
        />
      )}

      {/* QUOTE TAB ── */}
      {tab==='quote'&&results.length>0&&(
        <QuoteBuilder
          results={results}
          quoteCourier={quoteCourier}
          setQuoteCourier={setQuoteCourier}
          fmt={fmt}
          fmtP={fmtP}
          quoteNote={quoteNote}
          setQuoteNote={setQuoteNote}
          handlePrint={handlePrint}
          best={best}
          handleSaveQuote={handleSaveQuote}
          savingQuote={savingQuote}
          quoteSaved={quoteSaved}
          setQuoteSaved={setQuoteSaved}
          locInfo={locInfo}
          query={query}
          selClient={selClient}
          chargeWt={chargeWt}
          pColor={pColor}
        />
      )}

      {/* Empty state (Luxury Glass) */}
      {!zone&&(
        <div className="card !p-12 md:!p-14 text-center animate-in border-slate-200/90">
          <div className="w-16 h-16 rounded-[1.75rem] bg-gradient-to-br from-amber-50 to-sky-50 flex items-center justify-center mx-auto mb-6 border border-slate-200/70">
            <Package className="w-8 h-8 text-slate-400"/>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-3 tracking-tight">Contract-Based Rate Engine</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">Search a destination to compare courier costs against the verified rate sheets you shared, without extra assumed surcharges.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
             {['400019 (Mumbai)', 'Bangalore', 'Noida'].map(ex => (
                <span key={ex} className="px-3.5 py-2 border border-slate-200 rounded-full text-[11px] font-semibold text-slate-500 hover:border-amber-300 hover:text-amber-700 cursor-pointer transition-all">
                  Try "{ex}"
                </span>
             ))}
          </div>
        </div>
      )}
    </div>
  );
}

