// LandingPage.jsx — Full React conversion of the Sea Hawk website homepage
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicLayout from './PublicLayout';
import { PageMeta } from '../../components/seo/PageMeta';
import { LocalBusinessSchema } from '../../components/seo/LocalBusinessSchema';
import { CheckCircle2, Globe2, Clock, ShieldCheck, MapPin, Building2, Package, Search, PhoneCall, Truck, FileText } from 'lucide-react';

/* ════════════════════════════════════════
   RATE CALCULATOR DATA (from calculator.js)
════════════════════════════════════════ */
const DOC_RATES = {
  localNCR:   { w250: 22,  w500: 25,  addl: 12 },
  northIndia: { w250: 28,  w500: 40,  addl: 14 },
  metro:      { w250: 35,  w500: 55,  addl: 35 },
  restIndia:  { w250: 40,  w500: 65,  addl: 38 },
  northEast:  { w250: 65,  w500: 80,  addl: 45 },
  diplomatic: { w250: 75,  w500: 95,  addl: 50 },
};
const PRIORITY_RATES = {
  localNCR:   { w500: 70,  w1kg: 100, addl: 50  },
  northIndia: { w500: 100, w1kg: 140, addl: 75  },
  restIndia:  { w500: 140, w1kg: 190, addl: 100 },
  northEast:  { w500: 175, w1kg: 225, addl: 125 },
};
const HEAVY_SFC = {
  localNCR:   { r3: 22,  r10: 20,  r25: 18,  r50: 16,  r100: 15 },
  northIndia: { r3: 30,  r10: 28,  r25: 25,  r50: 22,  r100: 20 },
  metro:      { r3: 35,  r10: 32,  r25: 30,  r50: 29,  r100: 27 },
  restIndia:  { r3: 45,  r10: 43,  r25: 40,  r50: 38,  r100: 35 },
  northEast:  { r3: 55,  r10: 52,  r25: 50,  r50: 47,  r100: 45 },
  kashmir:    { r3: 60,  r10: 55,  r25: 52,  r50: 48,  r100: 46 },
  portBlair:  { r3: 120, r10: 110, r25: 90,  r50: 85,  r100: 80 },
};
const HEAVY_AIR = {
  srinagar:  { lt5: 72,  r5: 70,  r10: 65,  r25: 62,  r50: 60 },
  biharJh:   { lt5: 80,  r5: 78,  r10: 75,  r25: 72,  r50: 70 },
  metro:     { lt5: 85,  r5: 80,  r10: 78,  r25: 75,  r50: 74 },
  restIndia: { lt5: 88,  r5: 85,  r10: 82,  r25: 80,  r50: 78 },
  northEast: { lt5: 95,  r5: 90,  r10: 85,  r25: 82,  r50: 80 },
  portBlair: { lt5: 125, r5: 110, r10: 100, r25: 95,  r50: 90 },
};
const INTL = {
  zoneA: { dox: 1200, nondox: 1425, addlDox: 350, addlNon: 510 },
  zoneB: { dox: 1450, nondox: 1675, addlDox: 460, addlNon: 520 },
  zoneC: { dox: 1600, nondox: 1800, addlDox: 510, addlNon: 595 },
  zoneD: { dox: 1700, nondox: 1900, addlDox: 565, addlNon: 620 },
  zoneE: { dox: 1875, nondox: 1975, addlDox: 595, addlNon: 675 },
  zoneF: { dox: 1975, nondox: 2125, addlDox: 625, addlNon: 725 },
  zoneG: { dox: 2250, nondox: 2450, addlDox: 630, addlNon: 745 },
};
const COUNTRY_ZONE = {
  'bangladesh':'zoneA','bhutan':'zoneA','maldives':'zoneA','nepal':'zoneA','sri lanka':'zoneA','united arab emirates':'zoneA',
  'bahrain':'zoneB','hong kong':'zoneB','iran':'zoneB','jordan':'zoneB','kuwait':'zoneB','oman':'zoneB',
  'pakistan':'zoneB','qatar':'zoneB','saudi arabia':'zoneB','singapore':'zoneB','syria':'zoneB','yemen':'zoneB',
  'australia':'zoneC','china':'zoneC','indonesia':'zoneC','korea':'zoneC','malaysia':'zoneC','new zealand':'zoneC',
  'philippines':'zoneC','thailand':'zoneC','vietnam':'zoneC',
  'belgium':'zoneD','denmark':'zoneD','france':'zoneD','germany':'zoneD','italy':'zoneD',
  'netherlands':'zoneD','united kingdom':'zoneD','switzerland':'zoneD',
  'canada':'zoneE','mexico':'zoneE','united states':'zoneE',
  'japan':'zoneF',
  'austria':'zoneG','finland':'zoneG','greece':'zoneG','israel':'zoneG','norway':'zoneG',
  'poland':'zoneG','portugal':'zoneG','south africa':'zoneG','spain':'zoneG','sweden':'zoneG','turkey':'zoneG',
};
const ZONE_NAMES = {
  zoneA:'Bangladesh · Bhutan · Maldives · Nepal · Sri Lanka · UAE',
  zoneB:'Bahrain · HK · Kuwait · Oman · Qatar · Saudi Arabia · Singapore · Yemen',
  zoneC:'Australia · China · Indonesia · Korea · Malaysia · NZ · Philippines · Thailand · Vietnam',
  zoneD:'Belgium · Denmark · France · Germany · Italy · Netherlands · Switzerland · UK',
  zoneE:'Canada · Mexico · USA',
  zoneF:'Japan',
  zoneG:'Austria · Finland · Greece · Israel · Norway · Poland · Portugal · South Africa · Spain · Sweden · Turkey',
  zoneH:'Rest of World (Zone G + ₹300)',
};

const FSC = 0.25, GST = 0.18, INS_RATE = 0.002;
const rnd = (n) => Math.round(n * 100) / 100;
const fmt = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

function sfcRate(zone, kg) {
  const r = HEAVY_SFC[zone] || HEAVY_SFC.restIndia;
  if (kg < 10) return r.r3;
  if (kg < 25) return r.r10;
  if (kg < 50) return r.r25;
  if (kg < 100) return r.r50;
  return r.r100;
}
function airRate(zone, kg) {
  const r = HEAVY_AIR[zone] || HEAVY_AIR.restIndia;
  if (kg < 5) return r.lt5;
  if (kg < 10) return r.r5;
  if (kg < 25) return r.r10;
  if (kg < 50) return r.r25;
  return r.r50;
}

/* ════════════════════════════════════════
   QUICK QUOTE DATA
════════════════════════════════════════ */
const QR = {
  dom:  { local: 30, metro: 60, roi: 70, ne: 90 },
  intl: { local: 1200, metro: 1800, roi: 2200, ne: 2400 },
  b2b:  { local: 15, metro: 25, roi: 35, ne: 50 },
};

/* ════════════════════════════════════════
   COUNTER ANIMATION HOOK
════════════════════════════════════════ */
function useCounterAnimation() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    function animateCounter(el, target, duration = 2200) {
      let start = null;
      const isLarge = target >= 1000;
      const step = (ts) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);
        if (isLarge && target >= 100000) el.textContent = (current / 1000).toFixed(current < 10000 ? 1 : 0) + 'K';
        else if (isLarge) el.textContent = current.toLocaleString('en-IN');
        else el.textContent = current;
        if (progress < 1) requestAnimationFrame(step);
        else {
          if (isLarge && target >= 100000) el.textContent = (target / 1000).toFixed(0) + 'K';
          else if (isLarge) el.textContent = target.toLocaleString('en-IN');
          else el.textContent = target;
        }
      };
      requestAnimationFrame(step);
    }
    const counterObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        animateCounter(el, parseInt(el.dataset.t), parseInt(el.dataset.dur || '2200'));
        counterObs.unobserve(el);
      });
    }, { threshold: 0.3 });
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
    }, { threshold: 0.07 });
    ref.current.querySelectorAll('.count').forEach(el => counterObs.observe(el));
    ref.current.querySelectorAll('.rev').forEach(el => revealObs.observe(el));
    return () => { counterObs.disconnect(); revealObs.disconnect(); };
  }, []);
  return ref;
}

/* ════════════════════════════════════════
   RATE CALCULATOR COMPONENT
════════════════════════════════════════ */
function RateCalculator() {
  const [svc, setSvc]               = useState('doc');
  const [zone, setZone]             = useState('localNCR');
  const [priorityZone, setPZ]       = useState('localNCR');
  const [sfcZone, setSfcZone]       = useState('localNCR');
  const [airZone, setAirZone]       = useState('metro');
  const [country, setCountry]       = useState('');
  const [destination, setDest]      = useState('zoneA');
  const [shipType, setShipType]     = useState('dox');
  const [weight, setWeight]         = useState('');
  const [insured, setInsured]       = useState(false);
  const [viaDhl, setViaDhl]         = useState(false);
  const [result, setResult]         = useState(null);
  const [zoneInfo, setZoneInfo]     = useState('');
  const [calcError, setCalcError]   = useState('');

  function handleCountryChange(c) {
    setCountry(c);
    const z = COUNTRY_ZONE[c.toLowerCase()] || 'zoneH';
    setDest(z);
    setZoneInfo(z ? `🌍 ${z.toUpperCase()}: ${ZONE_NAMES[z] || ''}` : '');
  }

  function compute() {
    const w = parseFloat(weight) || 0;
    if (w <= 0) { setResult(null); return; }
    let base = 0;
    if (svc === 'doc') {
      const r = DOC_RATES[zone] || DOC_RATES.localNCR;
      if (w <= 250) base = r.w250;
      else if (w <= 500) base = r.w500;
      else base = r.w500 + Math.ceil((w - 500) / 500) * r.addl;
    } else if (svc === 'priority') {
      const r = PRIORITY_RATES[priorityZone] || PRIORITY_RATES.localNCR;
      if (w <= 500) base = r.w500;
      else if (w <= 1000) base = r.w1kg;
      else base = r.w1kg + Math.ceil((w - 1000) / 500) * r.addl;
    } else if (svc === 'heavy-sfc') {
      if (w < 3) { setCalcError('Minimum chargeable weight: 3 kg'); return; }
      setCalcError('');
      base = w * sfcRate(sfcZone, w);
    } else if (svc === 'heavy-air') {
      if (w < 3) { setCalcError('Minimum chargeable weight: 3 kg'); return; }
      setCalcError('');
      base = w * airRate(airZone, w);
    } else if (svc === 'international') {
      let r;
      if (destination === 'zoneH') r = { ...INTL.zoneG, dox: INTL.zoneG.dox + 300, nondox: INTL.zoneG.nondox + 300 };
      else r = INTL[destination] || INTL.zoneA;
      const baseRate = shipType === 'dox' ? r.dox : r.nondox;
      const addlRate = shipType === 'dox' ? r.addlDox : r.addlNon;
      base = w <= 500 ? baseRate : baseRate + Math.ceil((w - 500) / 500) * addlRate;
      if (viaDhl) base += 350;
      setZoneInfo(`🌍 ${destination.toUpperCase()}: ${ZONE_NAMES[destination] || ''}`);
    }
    const fscAmt = rnd(base * FSC);
    const insAmt = insured ? Math.max(rnd(base * INS_RATE), 50) : 0;
    const gstAmt = rnd((base + fscAmt + insAmt) * GST);
    const total  = rnd(base + fscAmt + insAmt + gstAmt);
    setCalcError('');
    setResult({ base, fsc: fscAmt, ins: insAmt, gst: gstAmt, total });
  }

  return (
    <section id="calculator" className="sec" style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--border-l)' }}>
      <div className="wrap">
        <div className="calc-layout">
          <div>
            <div className="pill pill-navy rev">Instant Pricing</div>
            <h2 className="h-display rev d1">Transparent<br /><span>Rate Calculator</span></h2>
            <p className="t-lead rev d2" style={{ maxWidth: '100%' }}>Exact costs before you book — fuel surcharge, GST and insurance all shown clearly. No surprises on your invoice.</p>
            <div className="calc-usps">
              <div className="calc-usp rev d1"><div className="calc-usp-icon">⚡</div><div><div className="calc-usp-t">Live Rates from 6 Carriers</div><div className="calc-usp-s">Trackon, DTDC, Delhivery, BlueDart, DHL &amp; FedEx — verified tariffs.</div></div></div>
              <div className="calc-usp rev d2"><div className="calc-usp-icon">🌍</div><div><div className="calc-usp-t">Domestic + 220 Countries</div><div className="calc-usp-s">All Indian zones including NE, J&amp;K, Andaman plus 8-zone international pricing.</div></div></div>
              <div className="calc-usp rev d3"><div className="calc-usp-icon">🔢</div><div><div className="calc-usp-t">All-Inclusive Breakdown</div><div className="calc-usp-s">Fuel surcharge (25%), GST (18%) and optional insurance all shown transparently.</div></div></div>
            </div>
          </div>
          <div className="calc-card rev d1">
            <div className="calc-head"><h3>Shipping Rate Calculator</h3><small>SeaHawk Rate Card v10 · FSC 25% · GST 18%</small></div>
            <div className="calc-body">
              <div className="fg-grid" style={{ gap: 13 }}>
                <div className="fg">
                  <label>Service Type</label>
                  <select value={svc} onChange={e => { setSvc(e.target.value); setResult(null); }}>
                    <option value="doc">Document / Packet</option>
                    <option value="priority">Priority Express</option>
                    <option value="heavy-sfc">Heavy — Surface Cargo</option>
                    <option value="heavy-air">Heavy — Air Cargo</option>
                    <option value="international">International</option>
                  </select>
                </div>
                {svc === 'doc' && (
                  <div className="fg">
                    <label>To Zone</label>
                    <select value={zone} onChange={e => { setZone(e.target.value); setResult(null); }}>
                      <option value="localNCR">Delhi &amp; NCR</option>
                      <option value="northIndia">North India</option>
                      <option value="metro">Metro Cities</option>
                      <option value="restIndia">Rest of India</option>
                      <option value="northEast">North East / Srinagar</option>
                      <option value="diplomatic">Diplomatic / Port Blair</option>
                    </select>
                  </div>
                )}
                {svc === 'priority' && (
                  <div className="fg">
                    <label>To Zone</label>
                    <select value={priorityZone} onChange={e => { setPZ(e.target.value); setResult(null); }}>
                      <option value="localNCR">Local &amp; NCR</option>
                      <option value="northIndia">North India</option>
                      <option value="restIndia">Rest of India</option>
                      <option value="northEast">North East</option>
                    </select>
                  </div>
                )}
                {svc === 'heavy-sfc' && (
                  <div className="fg">
                    <label>To Zone</label>
                    <select value={sfcZone} onChange={e => { setSfcZone(e.target.value); setResult(null); }}>
                      <option value="localNCR">Delhi &amp; NCR</option>
                      <option value="northIndia">North India</option>
                      <option value="metro">Metro Cities</option>
                      <option value="restIndia">Rest of India</option>
                      <option value="northEast">North East</option>
                      <option value="kashmir">Kashmir / J&amp;K</option>
                      <option value="portBlair">Port Blair / Andaman</option>
                    </select>
                  </div>
                )}
                {svc === 'heavy-air' && (
                  <div className="fg">
                    <label>To Zone</label>
                    <select value={airZone} onChange={e => { setAirZone(e.target.value); setResult(null); }}>
                      <option value="srinagar">Srinagar Sector</option>
                      <option value="biharJh">Bihar &amp; Jharkhand</option>
                      <option value="metro">Metro Cities</option>
                      <option value="restIndia">Rest of India</option>
                      <option value="northEast">North East</option>
                      <option value="portBlair">Port Blair</option>
                    </select>
                  </div>
                )}
                {svc === 'international' && (
                  <>
                    <div className="fg full">
                      <label>Destination Country</label>
                      <select value={country} onChange={e => handleCountryChange(e.target.value)}>
                        <option value="">-- Select Country --</option>
                        <optgroup label="Zone A"><option value="bangladesh">Bangladesh</option><option value="bhutan">Bhutan</option><option value="maldives">Maldives</option><option value="nepal">Nepal</option><option value="sri lanka">Sri Lanka</option><option value="united arab emirates">United Arab Emirates</option></optgroup>
                        <optgroup label="Zone B"><option value="bahrain">Bahrain</option><option value="hong kong">Hong Kong</option><option value="kuwait">Kuwait</option><option value="oman">Oman</option><option value="qatar">Qatar</option><option value="saudi arabia">Saudi Arabia</option><option value="singapore">Singapore</option><option value="yemen">Yemen</option></optgroup>
                        <optgroup label="Zone C"><option value="australia">Australia</option><option value="china">China</option><option value="indonesia">Indonesia</option><option value="korea">Korea</option><option value="malaysia">Malaysia</option><option value="new zealand">New Zealand</option><option value="philippines">Philippines</option><option value="thailand">Thailand</option><option value="vietnam">Vietnam</option></optgroup>
                        <optgroup label="Zone D"><option value="belgium">Belgium</option><option value="denmark">Denmark</option><option value="france">France</option><option value="germany">Germany</option><option value="italy">Italy</option><option value="netherlands">Netherlands</option><option value="switzerland">Switzerland</option><option value="united kingdom">United Kingdom</option></optgroup>
                        <optgroup label="Zone E"><option value="canada">Canada</option><option value="mexico">Mexico</option><option value="united states">United States</option></optgroup>
                        <optgroup label="Zone F"><option value="japan">Japan</option></optgroup>
                        <optgroup label="Zone G"><option value="austria">Austria</option><option value="finland">Finland</option><option value="greece">Greece</option><option value="israel">Israel</option><option value="norway">Norway</option><option value="poland">Poland</option><option value="portugal">Portugal</option><option value="south africa">South Africa</option><option value="spain">Spain</option><option value="sweden">Sweden</option><option value="turkey">Turkey</option></optgroup>
                        <optgroup label="Zone H"><option value="other">Other Countries (+₹300)</option></optgroup>
                      </select>
                    </div>
                    <div className="fg">
                      <label>Shipment Type</label>
                      <select value={shipType} onChange={e => { setShipType(e.target.value); setResult(null); }}>
                        <option value="dox">Documents (DOX)</option>
                        <option value="nondox">Non-Document / Parcels</option>
                      </select>
                    </div>
                  </>
                )}
                <div className="fg">
                  <label>{svc === 'heavy-sfc' || svc === 'heavy-air' ? 'Weight (kg)' : 'Weight (grams)'}</label>
                  <input type="number" value={weight} onChange={e => { setWeight(e.target.value); setResult(null); }} placeholder="e.g. 500" min="0.001" step="any" />
                </div>
              </div>
              {zoneInfo && <div className="zone-info show">{zoneInfo}</div>}
              <div className="fg-checks">
                <label className="fg-check"><input type="checkbox" checked={insured} onChange={e => setInsured(e.target.checked)} /> Insurance (0.2% min ₹50)</label>
                {svc === 'international' && (
                  <div><label className="fg-check"><input type="checkbox" checked={viaDhl} onChange={e => setViaDhl(e.target.checked)} /> Via DHL / FedEx (+₹350)</label></div>
                )}
              </div>
              {result && (
                <div className="calc-result show">
                  <div className="cr-head">Estimated Cost Breakdown</div>
                  <div className="cr-body">
                    <div className="cr-row"><span>Base Freight</span><span className="cr-val">{fmt(result.base)}</span></div>
                    <div className="cr-row"><span>Fuel Surcharge (25%)</span><span className="cr-val">{fmt(result.fsc)}</span></div>
                    {insured && <div className="cr-row"><span>Insurance</span><span className="cr-val">{fmt(result.ins)}</span></div>}
                    <div className="cr-row"><span>GST (18%)</span><span className="cr-val">{fmt(result.gst)}</span></div>
                    <div className="cr-total">
                      <span className="cr-total-lbl">Total Estimate</span>
                      <span className="cr-total-val">{fmt(result.total)}</span>
                    </div>
                    <div className="cr-note">* Indicative. Final based on actual dimensions.</div>
                  </div>
                </div>
              )}
              <button className="btn-calc" onClick={compute}>⚡ Get Rate</button>
              {calcError && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: '#FCEBEB', border: '1px solid #F7C1C1', borderRadius: 'var(--r)', fontSize: '.8rem', color: '#A32D2D', fontWeight: 600 }}>
                  ⚠️ {calcError}
                </div>
              )}
              <Link to="/book" style={{ display: 'block', textAlign: 'center', marginTop: 10, padding: 11, background: 'var(--navy)', color: '#fff', borderRadius: 'var(--r)', fontSize: '.875rem', fontWeight: 700, textDecoration: 'none' }}>📦 Book This Pickup →</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════
   HERO TRACK WIDGET
════════════════════════════════════════ */
function TrackWidget() {
  const navigate = useNavigate();
  const [tab, setTab]       = useState('track');
  const [awb, setAwb]       = useState('');
  const [qqSvc, setQqSvc]   = useState('dom');
  const [qqDest, setQqDest] = useState('local');
  const [qqWt, setQqWt]     = useState('');
  const [qqRes, setQqRes]   = useState(null);
  const [qqErr, setQqErr]   = useState('');
  const [cbName, setCbName] = useState('');
  const [cbPhone, setCbPhone] = useState('');
  const [cbOk, setCbOk]     = useState(false);
  const [cbErr, setCbErr]   = useState('');

  function goToTrack() {
    if (!awb.trim()) return;
    navigate(`/track/${encodeURIComponent(awb.trim().toUpperCase())}`);
  }

  function quickQuote() {
    const wt = parseFloat(qqWt) || 0;
    if (!wt) { setQqErr('Please enter a weight.'); return; }
    setQqErr('');
    const base = (QR[qqSvc] || QR.dom)[qqDest] || 60;
    const total = (base + Math.max(0, (wt / 1000) - 0.5) * base * 1.1) * 1.27 * 1.18;
    setQqRes('₹' + Math.round(total));
  }

  function doCallback() {
    if (!cbName.trim() || !cbPhone.trim()) { setCbErr('Please fill in your name and phone number.'); return; }
    setCbErr('');
    window.open(`https://wa.me/919911565523?text=${encodeURIComponent('Hi! Callback request.\nName: ' + cbName + '\nPhone: ' + cbPhone)}`, '_blank');
    setCbOk(true);
    setTimeout(() => setCbOk(false), 5000);
  }

  return (
    <div className="track-widget rev d2">
      <div className="tw-tabs">
        {[['track', '🔍 Track Shipment'], ['quote', '💰 Quick Quote'], ['call', '📞 Callback']].map(([id, label]) => (
          <button key={id} className={`tw-tab${tab === id ? ' on' : ''}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      {tab === 'track' && (
        <div className="tw-panel on">
          <div className="tw-row">
            <div className="tw-field">
              <label>AWB / Tracking Number</label>
              <input className="tw-input" value={awb} onChange={e => setAwb(e.target.value)} placeholder="Enter AWB, Docket or Reference No."
                onKeyDown={e => e.key === 'Enter' && goToTrack()} />
            </div>
            <button className="btn-track" onClick={goToTrack}>Track Now</button>
          </div>
        </div>
      )}
      {tab === 'quote' && (
        <div className="tw-panel on">
          <div className="tw-row tw-row-3">
            <div className="tw-field"><label>Type</label>
              <select className="tw-select" value={qqSvc} onChange={e => setQqSvc(e.target.value)}>
                <option value="dom">Domestic</option><option value="intl">International</option><option value="b2b">B2B Bulk</option>
              </select>
            </div>
            <div className="tw-field"><label>Zone</label>
              <select className="tw-select" value={qqDest} onChange={e => setQqDest(e.target.value)}>
                <option value="local">Local/NCR</option><option value="metro">Metro City</option><option value="roi">Rest of India</option><option value="ne">North East</option>
              </select>
            </div>
            <div className="tw-field"><label>Weight (g)</label>
              <input className="tw-input" type="number" value={qqWt} onChange={e => setQqWt(e.target.value)} placeholder="500" min="1" />
            </div>
            <button className="btn-track" onClick={quickQuote}>Get Rate</button>
          </div>
          {qqErr && <div style={{ marginTop: 6, fontSize: '.78rem', color: '#A32D2D', fontWeight: 600 }}>⚠️ {qqErr}</div>}
          {qqRes && (
            <div style={{ display: 'block', marginTop: 10, padding: '10px 14px', background: 'var(--navy-faint)', border: '1px solid var(--navy-pale)', borderRadius: 'var(--r)', fontSize: '.875rem' }}>
              <strong>Estimated: </strong><span style={{ color: 'var(--orange)', fontWeight: 800, fontSize: '1.1rem' }}>{qqRes}</span>
              <span style={{ color: 'var(--ink-3)', fontSize: '.73rem', marginLeft: 8 }}>(incl. fuel &amp; GST) — <a href="#calculator" style={{ color: 'var(--navy-3)', fontWeight: 700 }}>Full breakdown →</a></span>
            </div>
          )}
        </div>
      )}
      {tab === 'call' && (
        <div className="tw-panel on">
          <div className="tw-row">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1 }}>
              <div className="tw-field"><label>Your Name</label><input className="tw-input" value={cbName} onChange={e => setCbName(e.target.value)} placeholder="Full Name" /></div>
              <div className="tw-field"><label>Phone Number</label><input className="tw-input" value={cbPhone} onChange={e => setCbPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" /></div>
            </div>
            <button className="btn-track" onClick={doCallback}>Request Call</button>
          </div>
          {cbErr && <div style={{ marginTop: 6, fontSize: '.78rem', color: '#A32D2D', fontWeight: 600 }}>⚠️ {cbErr}</div>}
          {cbOk && <div style={{ marginTop: 10, padding: '9px 13px', background: 'var(--green-bg)', borderRadius: 'var(--r)', fontSize: '.8rem', color: 'var(--green)', fontWeight: 600 }}>✅ We'll call you back within 30 minutes!</div>}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   MAIN LANDING PAGE
════════════════════════════════════════ */
export default function LandingPage() {
  const pageRef = useCounterAnimation();
  const heroIllRef = useRef(null);

  // Load hero.js and map.js after React renders the DOM
  useEffect(() => {
  function loadScript(src, onload) {
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = onload;
    document.body.appendChild(s);
    return s;
  }

  const s1 = loadScript('/website/js/hero.js', () => {
    if (window.buildHeroIllustration) window.buildHeroIllustration();
  });
  const s2 = loadScript('/website/js/map.js', () => {
    if (window.buildMap) window.buildMap();
  });

  return () => { s1.remove(); s2.remove(); };
}, []);

  return (
    <PublicLayout>
      <PageMeta
        canonical="/"
        title="Sea Hawk Courier & Cargo — Delhi NCR Courier Service Since 2004"
        description="Sea Hawk Courier & Cargo — Gurugram's most trusted courier service. Same-day Delhi NCR delivery, international shipping to 220+ countries, real-time tracking. Call +91 99115 65523."
      />
      <LocalBusinessSchema />
      <div ref={pageRef}>
        {/* ── HERO ── */}
        <section id="hero">
          <div className="hero-grid-bg" />
          <div className="hero-glow-1" /><div className="hero-glow-2" />
          <div className="wrap">
            <div className="hero-inner">
              <div className="rev">
                <div className="hero-kicker"><span className="dot" />Trusted Since 2004 — 20+ Years Delivering Excellence</div>
                <h1 className="hero-h1">Precision B2B Logistics<br /><em>for Growing Brands</em><br /></h1>
                <p className="hero-p">From same-day Delhi NCR deliveries to international shipments across 220+ countries. Get the reach of a giant, with the dedicated support of a boutique logistics partner.</p>
                <div className="hero-trust">
                  {['19,000+ PIN Codes (100% India)','220+ Countries','< 15 Min Support Response','Real-Time Tracking'].map(t => (
                    <div key={t} className="t-chip"><span className="chk">✓</span>{t}</div>
                  ))}
                </div>
                <div className="hero-cta">
                  <Link to="/book" className="btn btn-orange btn-lg">📦 Book Free Pickup</Link>
                  <Link to="/track" className="btn btn-ghost-w btn-lg">🔍 Track Shipment</Link>
                </div>
                <div className="hero-mini-stats rev d1">
                  {[{t:98.4,dur:2000,l:'On-Time Delivery',sup:'%'},{t:19000,dur:1800,l:'PIN Codes Covered',sup:'+'},{t:220,dur:1600,l:'Countries',sup:'+'},{t:20,dur:1400,l:'Years Experience',sup:'+'}].map(({t,dur,l,sup}) => (
                    <div key={l} className="hms">
                      <div className="hms-n"><span className="count" data-t={t} data-dur={dur}>0</span><sup>{sup || '+'}</sup></div>
                      <div className="hms-l">{l}</div>
                    </div>
                  ))}
                </div>
                <TrackWidget />
              </div>
              <div className="hero-visual rev d1">
                <div className="hero-illustration" id="heroIllustration" ref={heroIllRef} />
              </div>
            </div>
          </div>
        </section>

        {/* ── TICKER ── */}
        <div className="ticker">
          <div className="ticker-track">
            {['Same Day Express Delivery','International Air Courier','220+ Countries & Territories','Bulk & LTL Surface Freight','Real-Time Shipment Tracking','Fully Insured Deliveries','B2B Corporate Logistics','19,000+ PIN Codes Covered','Dedicated Account Managers'].flatMap((t, i) => [
              <span key={`t${i}`} className="tick-item">{t}</span>,
              <span key={`s${i}`} className="tick-sep" />,
            ])}
          </div>
        </div>

        {/* ── STATS BAND ── */}
        <section id="stats-band">
          <div className="wrap">
            <div className="stats-grid">
              {[{icon:<ShieldCheck size={28}/>,t:98,dur:2800,l:'On-Time Delivery Rate',sup:'%'},{icon:<MapPin size={28}/>,t:19000,dur:2500,l:'PIN Codes Covered',sup:'+'},{icon:<Building2 size={28}/>,t:800,dur:2000,l:'Cities in India',sup:'+'},{icon:<Globe2 size={28}/>,t:220,dur:1800,l:'Countries Served',sup:'+'},{icon:<Clock size={28}/>,t:20,dur:1500,l:'Years of Excellence',sup:'+'}].map(({icon,t,dur,l,sup},i) => (
                <div key={l} className={`stat-block rev${i > 0 ? ` d${i}` : ''}`}>
                  <div className="stat-icon-wrap" style={{ color: 'var(--navy)' }}>{icon}</div>
                  <div className="stat-number"><span className="count" data-t={t} data-dur={dur}>0</span><sup>{sup || '+'}</sup></div>
                  <div className="stat-label">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TRUST SIGNALS ── */}
        <section style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--border-l)', borderBottom: '1px solid var(--border-l)', padding: '36px 0' }}>
          <div className="wrap">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 28 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                {[{icon:'⭐',val:'4.8',lbl:'Google Rating',sub:'200+ reviews'},{icon:'🏆',val:'20+',lbl:'Years Active',sub:'Est. 2004, Gurugram'},{icon:'🛡️',val:'GST',lbl:'Registered',sub:'06AJDPR0914N2Z1'}].map(({icon,val,lbl,sub}) => (
                  <div key={lbl} style={{ background: '#fff', borderRadius: 'var(--r-lg)', padding: '14px 20px', boxShadow: 'var(--sh-sm)', border: '1.5px solid var(--border-l)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: '1.8rem' }}>{icon}</div>
                    <div>
                      <div style={{ fontFamily: 'inherit', fontSize: '1.6rem', fontWeight: 900, color: 'var(--ink)', lineHeight: 1 }}>{val}</div>
                      <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 1 }}>{lbl}</div>
                      <div style={{ fontSize: '.68rem', color: 'var(--ink-4)' }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
                {['✓ Free Doorstep Pickup','✓ Real-Time Tracking','✓ GST Invoicing','✓ 19,000+ PIN Codes','✓ Dedicated Manager'].map(t => (
                  <div key={t} style={{ padding: '6px 14px', background: '#fff', border: '1.5px solid var(--border-l)', borderRadius: 40, fontSize: '.73rem', fontWeight: 700, color: 'var(--ink-2)' }}>{t}</div>
                ))}
              </div>
            </div>
            <p style={{ textAlign: 'center', fontSize: '.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--ink-4)', marginBottom: 16 }}>Verified Channel Partners</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
              {[{img:'/images/partners/trackon.png',name:'Trackon'},{img:'/images/partners/dtdc.png',name:'DTDC'},{img:'/images/partners/bluedart.png',name:'BlueDart'},{img:'/images/partners/dhl.png',name:'DHL Express'}].map(({img,name}) => (
                <div key={name} style={{ background: '#fff', border: '1.5px solid var(--border-l)', borderRadius: 'var(--r-md)', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: 'var(--sh-xs)' }}>
                  <img loading="lazy" src={img} alt={name} style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
                  <span style={{ fontSize: '.72rem', fontWeight: 800, color: 'var(--ink-2)' }}>{name}</span>
                </div>
              ))}
              {[{icon:'🚀',name:'Delhivery'},{icon:'🟣',name:'FedEx'}].map(({icon,name}) => (
                <div key={name} style={{ background: '#fff', border: '1.5px solid var(--border-l)', borderRadius: 'var(--r-md)', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: 'var(--sh-xs)' }}>
                  <span style={{ fontSize: '1.2rem' }}>{icon}</span><span style={{ fontSize: '.72rem', fontWeight: 800, color: 'var(--ink-2)' }}>{name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SERVICES ── */}
        <section id="services" className="sec">
          <div className="wrap">
            <div className="sec-head">
              <div className="pill pill-orange rev">What We Offer</div>
              <h2 className="h-display rev d1">Services <span>Built for Your Business</span></h2>
              <p className="t-lead rev d2" style={{ margin: '0 auto' }}>From local same-day pickups to air freight across six continents — every shipment backed by 20 years of expertise.</p>
            </div>
            <div className="svc-grid">
              {[
                {icon:<Package size={24} color="var(--orange)"/>,t:'Express Delivery',d:'Same-day and next-day delivery to Delhi NCR and all major cities. Fastest transit times with guaranteed POD on every consignment.',note:'📍 Delhi NCR · Metro Cities · North India',link:'#calculator',cta:'Learn more →'},
                {icon:<Globe2 size={24} color="var(--navy)"/>,t:'International Courier',d:'Documents and parcels to 220+ countries via DHL, FedEx, Aramex and our own global partner network across 8 international zones.',note:'🌍 USA · UK · UAE · Australia · 220+ Countries',link:'#calculator',cta:'Calculate rate →'},
                {icon:<Truck size={24} color="var(--navy)"/>,t:'Surface & LTL Cargo',d:'Cost-effective road freight for heavy consignments. LTL road express connecting 800+ cities pan-India at competitive rates.',note:'📦 Pan-India · Up to 500 kg per consignment',link:'/contact',cta:'Contact us →'},
                {icon:<Building2 size={24} color="var(--navy)"/>,t:'B2B Logistics',d:'Custom rate contracts, dedicated account manager, monthly invoicing and full client portal access for enterprise shippers.',note:'💼 Custom rates · Volume discounts available',link:'/services#b2b',cta:'Open an account →'},
                {icon:<ShieldCheck size={24} color="var(--navy)"/>,t:'Insured Shipments',d:"Full declared-value insurance for electronics, jewellery, fragile goods and high-value items at just 5% premium.",note:'🔒 5% premium · Hassle-free claims process',link:'#calculator',cta:'Calculate cost →'},
                {icon:<FileText size={24} color="var(--navy)"/>,t:'Document Courier',d:'Secure delivery of legal documents, passports, bank documents and diplomatic mail — handled with absolute care.',note:'🗂️ Domestic · International · Diplomatic Mail',link:'/contact',cta:'Enquire now →'},
              ].map(({icon,t,d,note,link,cta},i) => (
                <div key={t} className={`svc-card rev${i > 0 ? ` d${(i % 3) || ''}` : ''}`}>
                  <div className="svc-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
                  <h3 className="svc-title">{t}</h3>
                  <p className="svc-desc">{d}</p>
                  <div className="svc-note">{note}</div>
                  {link.startsWith('/') ? <Link to={link} className="svc-link">{cta}</Link> : <a href={link} className="svc-link">{cta}</a>}
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 44 }} className="rev">
              <Link to="/services" className="btn btn-navy btn-lg">View All Services →</Link>
            </div>
          </div>
        </section>

        {/* ── CALCULATOR ── */}
        <RateCalculator />

        {/* ── MAP ── */}
        <section id="map-section" className="sec" style={{ background: '#fff', borderTop: '1px solid var(--border-l)' }}>
          <div className="wrap">
            <div className="sec-head" style={{ marginBottom: 36 }}>
              <div className="pill pill-orange rev">Our Reach</div>
              <h2 className="h-display rev d1">Coverage Across <span>India &amp; The World</span></h2>
              <p className="t-lead rev d2" style={{ margin: '0 auto' }}>Every PIN code in India. 180+ countries worldwide. Real shipments, real routes, every day.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }} className="rev d1">
              {[{t:35000,c:'var(--navy)',bg:'var(--navy-faint)',brd:'var(--navy-pale)',l:'PIN Codes'},{t:800,c:'var(--orange)',bg:'var(--orange-bg)',brd:'var(--orange-brd)',l:'Indian Cities'},{t:180,c:'var(--navy)',bg:'var(--navy-faint)',brd:'var(--navy-pale)',l:'Countries'},{t:6,c:'var(--green)',bg:'var(--green-bg)',brd:'#a7f3d0',l:'Continents'}].map(({t,c,bg,brd,l}) => (
                <div key={l} style={{ textAlign: 'center', padding: 16, background: bg, borderRadius: 'var(--r-lg)', border: `1.5px solid ${brd}` }}>
                  <div style={{ fontFamily: 'inherit', fontSize: '1.7rem', fontWeight: 900, color: c }}><span className="count" data-t={t}>0</span>+</div>
                  <div style={{ fontSize: '.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, color: c }}>{l}</div>
                </div>
              ))}
            </div>
            <div className="map-canvas-wrap rev d2" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden', boxShadow: 'var(--sh-xl)', border: '1.5px solid var(--border-l)', background: 'var(--navy)' }}>
              <div className="map-top-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'rgba(255,255,255,.05)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                <span style={{ fontSize: '.75rem', fontWeight: 800, color: 'rgba(255,255,255,.75)', letterSpacing: 1.5, textTransform: 'uppercase' }}>Sea Hawk Global Coverage Map</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.45)' }}>Left: India Detail &nbsp;|&nbsp; Right: International Network</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.7rem', color: 'rgba(255,255,255,.5)' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block', animation: 'blinkDot 1.2s ease-in-out infinite' }} />Live
                  </span>
                </div>
              </div>
              <div id="indiaMapCanvas" style={{ lineHeight: 0 }} />
            </div>

            {/* ── Legend ── */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 20, justifyContent: 'center' }}>
              {[
                { color: '#e8580a', title: 'Delhi NCR Hub', sub: 'Origin for all shipments' },
                { color: '#ff8c45', title: 'Metro Cities', sub: 'Mumbai · Bangalore · Chennai · Kolkata · Hyderabad' },
                { color: '#4ade80', title: 'North East India', sub: 'All 8 NE states · Assam · Manipur · Meghalaya' },
                { color: '#fbbf24', title: 'Islands', sub: 'Andaman · Nicobar · Lakshadweep' },
                { color: '#60a5fa', title: 'International Gateways', sub: 'UAE · UK · USA · SGP · AUS · 180+ countries' },
              ].map(({ color, title, sub }) => (
                <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: '#fff', borderRadius: 'var(--r-lg)', border: '1.5px solid var(--border-l)', boxShadow: 'var(--sh-xs)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--ink)' }}>{title}</div>
                    <div style={{ fontSize: '.68rem', color: 'var(--ink-3)' }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── CTA BAND ── */}
        <section id="cta-band">
          <div className="wrap">
            <div className="cta-inner">
              <h2>Ready to <span>Ship with Sea Hawk?</span></h2>
              <p>Free doorstep pickup. Competitive rates. Real-time tracking. 20+ years of experience.</p>
              <div className="cta-btns">
                <Link to="/book" className="btn btn-white btn-lg">📦 Book Free Pickup</Link>
                <Link to="/track" className="btn btn-ghost-w btn-lg">🔍 Track Shipment</Link>
                <Link to="/login" className="btn btn-ghost-w btn-lg">🔐 Client Portal</Link>
              </div>
              <div className="cta-phones">
                <div className="cta-phone">📞 <a href="tel:+919911565523">+91 99115 65523</a></div>
                <div className="cta-div" />
                <div className="cta-phone">📞 <a href="tel:+918368201122">+91 83682 01122</a></div>
                <div className="cta-div" />
                <div className="cta-phone">💬 <a href="https://wa.me/919911565523" target="_blank" rel="noreferrer">WhatsApp Us</a></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
