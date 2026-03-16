/**
 * Seahawk — WhatsApp Rate Automation
 * Type a plain-English rate query → instant multi-courier result → send via WhatsApp
 */
import { useState, useCallback } from 'react';
import {
  MessageCircle, Send, Zap, Copy, CheckCircle, AlertTriangle,
  Search, TrendingUp, Phone, Loader, IndianRupee, X, Clock
} from 'lucide-react';
import api from '../services/api';

// ── City → { state, district, city } ─────────────────────────────────────
const CITY_MAP = {
  'delhi':['Delhi','Delhi','delhi'], 'new delhi':['Delhi','Delhi','delhi'],
  'gurgaon':['Haryana','Gurugram','gurgaon'], 'gurugram':['Haryana','Gurugram','gurugram'],
  'noida':['Uttar Pradesh','Gautam Buddha Nagar','noida'],
  'faridabad':['Haryana','Faridabad','faridabad'],
  'ghaziabad':['Uttar Pradesh','Ghaziabad','ghaziabad'],
  'chandigarh':['Punjab','Chandigarh','chandigarh'],
  'ludhiana':['Punjab','Ludhiana','ludhiana'],
  'amritsar':['Punjab','Amritsar','amritsar'],
  'jaipur':['Rajasthan','Jaipur','jaipur'],
  'jodhpur':['Rajasthan','Jodhpur','jodhpur'],
  'lucknow':['Uttar Pradesh','Lucknow','lucknow'],
  'kanpur':['Uttar Pradesh','Kanpur','kanpur'],
  'agra':['Uttar Pradesh','Agra','agra'],
  'varanasi':['Uttar Pradesh','Varanasi','varanasi'],
  'meerut':['Uttar Pradesh','Meerut','meerut'],
  'dehradun':['Uttarakhand','Dehradun','dehradun'],
  'shimla':['Himachal Pradesh','Shimla','shimla'],
  'jammu':['Jammu And Kashmir','Jammu','jammu'],
  'srinagar':['Jammu And Kashmir','Srinagar','srinagar'],
  'patna':['Bihar','Patna','patna'],
  'ranchi':['Jharkhand','Ranchi','ranchi'],
  'jamshedpur':['Jharkhand','East Singhbhum','jamshedpur'],
  'bhopal':['Madhya Pradesh','Bhopal','bhopal'],
  'indore':['Madhya Pradesh','Indore','indore'],
  'raipur':['Chhattisgarh','Raipur','raipur'],
  'nagpur':['Maharashtra','Nagpur','nagpur'],
  'kolkata':['West Bengal','Kolkata','kolkata'],
  'bhubaneswar':['Odisha','Khurda','bhubaneswar'],
  'guwahati':['Assam','Kamrup','guwahati'],
  'shillong':['Meghalaya','East Khasi Hills','shillong'],
  'imphal':['Manipur','Imphal West','imphal'],
  'agartala':['Tripura','West Tripura','agartala'],
  'ahmedabad':['Gujarat','Ahmedabad','ahmedabad'],
  'surat':['Gujarat','Surat','surat'],
  'vadodara':['Gujarat','Vadodara','vadodara'],
  'baroda':['Gujarat','Vadodara','baroda'],
  'mumbai':['Maharashtra','Mumbai','mumbai'],
  'pune':['Maharashtra','Pune','pune'],
  'thane':['Maharashtra','Thane','thane'],
  'hyderabad':['Telangana','Hyderabad','hyderabad'],
  'vizag':['Andhra Pradesh','Visakhapatnam','vizag'],
  'visakhapatnam':['Andhra Pradesh','Visakhapatnam','vizag'],
  'bangalore':['Karnataka','Bengaluru','bangalore'],
  'bengaluru':['Karnataka','Bengaluru','bengaluru'],
  'mysore':['Karnataka','Mysore','mysore'],
  'chennai':['Tamil Nadu','Chennai','chennai'],
  'coimbatore':['Tamil Nadu','Coimbatore','coimbatore'],
  'kochi':['Kerala','Ernakulam','kochi'],
  'cochin':['Kerala','Ernakulam','kochi'],
  'trivandrum':['Kerala','Thiruvananthapuram','trivandrum'],
  'port blair':['Andaman And Nicobar Islands','South Andamans','port blair'],
  'andaman':['Andaman And Nicobar Islands','South Andamans','port blair'],
};

// ── Parse natural-language query ──────────────────────────────────────────
function parseQuery(text) {
  const t = text.toLowerCase().trim();

  // Weight — match "5kg", "5 kg", "5.5kg"
  const wm = t.match(/(\d+(?:\.\d+)?)\s*kg/);
  const weight = wm ? parseFloat(wm[1]) : null;

  // Ship type
  let shipType = 'doc';
  if (/\b(surface|sfr|ground|cargo|parcel|package|heavy)\b/.test(t)) shipType = 'surface';
  if (/\b(air|airway|aerial)\b/.test(t)) shipType = 'air';
  if (/\b(doc|document|letter|envelope)\b/.test(t)) shipType = 'doc';

  // City — longest match first
  let cityKey = null;
  const multiWord = Object.keys(CITY_MAP).filter(k => k.includes(' ')).sort((a,b) => b.length - a.length);
  for (const key of multiWord) { if (t.includes(key)) { cityKey = key; break; } }
  if (!cityKey) {
    for (const word of t.split(/[\s,]+/)) {
      const clean = word.replace(/[^a-z]/g, '');
      if (CITY_MAP[clean]) { cityKey = clean; break; }
    }
  }

  // PIN code
  const pm = t.match(/\b(\d{6})\b/);
  const pin = pm ? pm[1] : null;

  return { weight, shipType, cityKey, pin };
}

const fmt  = n => `₹${Math.round(n||0).toLocaleString('en-IN')}`;
const fmtP = n => `${Number(n||0).toFixed(1)}%`;
const pColor = m => m > 30 ? 'text-green-700' : m > 15 ? 'text-amber-600' : m > 0 ? 'text-orange-500' : 'text-red-600';

const EXAMPLES = [
  'rate mumbai 5kg surface', 'hyderabad 1kg doc', 'chennai 10kg surface',
  'guwahati 2kg', 'surat 3.5kg', 'jaipur 0.5kg', 'kolkata 8kg surface',
];

export default function WhatsAppPage({ toast }) {
  const [query,   setQuery]   = useState('');
  const [parsed,  setParsed]  = useState(null);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied,  setCopied]  = useState(false);
  const [error,   setError]   = useState('');
  const [history, setHistory] = useState([]);
  const [phone,   setPhone]   = useState('');

  const runQuery = useCallback(async (qStr) => {
    const q = qStr ?? query;
    if (!q.trim()) return;

    const p = parseQuery(q);
    setParsed(p);
    setError('');

    if (!p.weight) {
      setError('Weight not detected — try "mumbai 5kg surface"');
      return;
    }
    if (!p.cityKey && !p.pin) {
      setError('City not recognised — try a major city name or 6-digit PIN code');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let state = '', district = '', city = '';
      let locationLabel = '';

      if (p.pin) {
        const res  = await fetch(`https://api.postalpincode.in/pincode/${p.pin}`);
        const data = await res.json();
        if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          state = po.State; district = po.District; city = po.Name;
          locationLabel = `${po.District}, ${po.State} (PIN ${p.pin})`;
        } else {
          setError('PIN code not found'); setLoading(false); return;
        }
      } else {
        const [s, d, c] = CITY_MAP[p.cityKey];
        state = s; district = d; city = c;
        locationLabel = `${d}, ${s}`;
      }

      // Call backend rate engine
      const res = await api.post('/rates/calculate', {
        state, district, city,
        weight: p.weight,
        shipType: p.shipType,
        odaAmt: 0,
      });

      const { zone, results } = res.data || {};
      if (!results?.length) {
        setError('No rates available — check shipment type vs weight'); setLoading(false); return;
      }

      const top5 = results.slice(0, 5);
      const best = top5[0];

      const entry = { q, locationLabel, weight: p.weight, shipType: p.shipType, best, top5, zone };
      setResult(entry);
      setHistory(h => [entry, ...h.filter(x => x.q !== q)].slice(0, 8));
    } catch (e) {
      setError('Rate lookup failed — check network connection');
    } finally {
      setLoading(false);
    }
  }, [query]);

  // ── Build WhatsApp message ─────────────────────────────────────────────
  const buildMessage = (r) => {
    if (!r) return '';
    const { best, top5, locationLabel, weight, shipType } = r;
    const typeLabel = shipType === 'surface' ? 'Surface Cargo' : shipType === 'air' ? 'Air Cargo' : 'Document / Packet';
    const bestCost  = best.breakdown?.total ?? 0;
    const bestSell  = best.proposalSell?.total ?? bestCost;
    return [
      `🦅 *Seahawk Logistics — Rate Quote*`,
      `📍 *To:* ${locationLabel}`,
      `📦 *${typeLabel}* · ${weight} kg`,
      ``,
      `✅ *Best: ${best.label}* (${best.mode})`,
      `   Courier cost: ${fmt(bestCost)}`,
      `   Our price: ${fmt(bestSell)}`,
      ``,
      `📋 *All options:*`,
      ...top5.map((c, i) =>
        `${i + 1}. ${c.label} — ${fmt(c.breakdown?.total ?? 0)} ${c.margin ? `· ${fmtP(c.margin)} margin` : ''}`
      ),
      ``,
      `_Valid 24 hrs. ODA / remote charges extra._`,
      `_Reply for bulk / annual pricing._`,
    ].join('\n');
  };

  const copyMsg = async () => {
    try {
      await navigator.clipboard.writeText(buildMessage(result));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast?.('Copied to clipboard', 'success');
    } catch { toast?.('Copy failed — try manually selecting the text', 'error'); }
  };

  const sendWA = (num = '') => {
    const msg = encodeURIComponent(buildMessage(result));
    const url = num.trim()
      ? `https://wa.me/${num.replace(/\D/g,'')}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="p-4 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-7 h-7 text-green-600"/>
            WhatsApp Rate Automation
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Type any rate query in plain English → instant quote → send on WhatsApp in one click
          </p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-2xl px-3 py-2 text-center hidden sm:block">
          <p className="text-[9px] text-green-500 font-bold uppercase tracking-wide">Live rates from</p>
          <p className="text-sm font-bold text-green-800">17 couriers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── LEFT: Input ──────────────────────────────────────────────── */}
        <div className="space-y-3">

          {/* Query box */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">💬 Enter Rate Query</p>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <input
                className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 transition-all"
                placeholder='e.g. "mumbai 5kg surface" or "400001 3kg"'
                value={query}
                onChange={e => { setQuery(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && runQuery()}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0"/>
                {error}
              </div>
            )}

            <button
              onClick={() => runQuery()}
              disabled={loading || !query.trim()}
              className="w-full bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              {loading
                ? <><Loader className="w-4 h-4 animate-spin"/>Calculating all 17 couriers…</>
                : <><Zap className="w-4 h-4"/>Get Rate</>}
            </button>

            {/* Parsed preview */}
            {parsed && (parsed.cityKey || parsed.pin || parsed.weight) && (
              <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wide mb-1">Detected from your query:</p>
                <div className="flex flex-wrap gap-1.5">
                  {(parsed.cityKey || parsed.pin) && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                      📍 {parsed.cityKey || `PIN ${parsed.pin}`}
                    </span>
                  )}
                  {parsed.weight && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                      ⚖ {parsed.weight} kg
                    </span>
                  )}
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold capitalize">
                    📦 {parsed.shipType}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick examples */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">⚡ Quick Examples</p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex, i) => (
                <button key={i}
                  onClick={() => { setQuery(ex); runQuery(ex); }}
                  className="text-xs bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1 hover:border-green-400 hover:bg-green-50 hover:text-green-700 transition-all text-gray-600"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                <Clock className="w-3 h-3 inline mr-1"/>Recent Queries
              </p>
              <div className="space-y-1">
                {history.slice(0, 6).map((h, i) => (
                  <button key={i}
                    onClick={() => { setQuery(h.q); runQuery(h.q); }}
                    className="w-full text-left text-xs bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-200 rounded-xl px-3 py-2 flex items-center justify-between transition-all"
                  >
                    <span className="text-gray-700 font-medium truncate">{h.q}</span>
                    <span className="text-gray-400 ml-2 shrink-0">{fmt(h.best?.breakdown?.total)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Result ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {loading && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <Loader className="w-8 h-8 mx-auto animate-spin text-green-500 mb-3"/>
              <p className="text-sm text-gray-500 font-medium">Calculating rates…</p>
              <p className="text-xs text-gray-300 mt-1">Checking all 17 courier services</p>
            </div>
          )}

          {!loading && !result && (
            <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-200"/>
              <p className="text-gray-400 font-medium">Rate results will appear here</p>
              <p className="text-xs text-gray-300 mt-1">Try "mumbai 5kg surface" or "400001 2kg"</p>
            </div>
          )}

          {!loading && result && (() => {
            const { best, top5, locationLabel, weight, shipType } = result;
            const bestCost = best.breakdown?.total ?? 0;
            const bestSell = best.proposalSell?.total ?? bestCost;
            return (
              <>
                {/* Best courier banner */}
                <div className="bg-gradient-to-br from-green-600 to-emerald-500 text-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">Best Option</p>
                      <p className="font-bold text-lg leading-tight">{best.label}</p>
                      <p className="text-[11px] opacity-70">{locationLabel} · {weight}kg · {shipType}</p>
                    </div>
                    <TrendingUp className="w-6 h-6 opacity-50 shrink-0"/>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ['Courier Cost', fmt(bestCost)],
                      ['Sell Price',   fmt(bestSell)],
                      ['Margin',       fmtP(best.margin)],
                    ].map(([k,v]) => (
                      <div key={k} className="bg-white/20 rounded-xl p-2 text-center">
                        <p className="text-[9px] opacity-70 uppercase">{k}</p>
                        <p className="font-bold text-sm">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* All 5 couriers */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-bold text-sm text-gray-700">Top Options</h2>
                    <span className="text-[10px] text-gray-400">{top5.length} of 17 couriers</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {top5.map((r, i) => (
                      <div key={i} className={`px-4 py-2.5 flex items-center justify-between ${i===0?'bg-green-50/50':''}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${i===0?'bg-green-600 text-white':'bg-gray-100 text-gray-500'}`}>{i+1}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{r.label}</p>
                            <p className="text-[10px] text-gray-400">{r.mode}</p>
                          </div>
                          {i===0 && <span className="text-[8px] bg-green-600 text-white px-1.5 py-0.5 rounded-full font-bold shrink-0">BEST</span>}
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="text-xs font-bold text-gray-800">{fmt(r.breakdown?.total ?? 0)}</p>
                          <p className={`text-[10px] font-semibold ${pColor(r.margin)}`}>{fmtP(r.margin)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* WhatsApp share */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">📱 WhatsApp Message</p>

                  {/* Preview */}
                  <pre className="bg-green-50 border border-green-100 rounded-xl p-3 mb-3 text-[10px] font-mono text-green-900 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {buildMessage(result)}
                  </pre>

                  {/* Copy + Open */}
                  <div className="flex gap-2 mb-2">
                    <button onClick={copyMsg}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                        copied ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}>
                      {copied ? <><CheckCircle className="w-3.5 h-3.5"/>Copied!</> : <><Copy className="w-3.5 h-3.5"/>Copy</>}
                    </button>
                    <button onClick={() => sendWA()}
                      className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-green-700 flex items-center justify-center gap-1.5 transition-all">
                      <Send className="w-3.5 h-3.5"/>Open WhatsApp
                    </button>
                  </div>

                  {/* Send to specific number */}
                  <div className="flex gap-2 items-center">
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0"/>
                    <input
                      className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-200"
                      placeholder="Send to: 919876543210 (optional)"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendWA(phone)}
                    />
                    <button onClick={() => sendWA(phone)} disabled={!phone.trim()}
                      className="text-xs bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg font-bold hover:bg-green-200 transition-all disabled:opacity-40">
                      Send
                    </button>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* How to use guide */}
      <div className="mt-5 bg-slate-50 border border-slate-100 rounded-2xl p-4">
        <h3 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2">
          <IndianRupee className="w-4 h-4"/>How to use WhatsApp Rate Automation
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
          <div className="bg-white rounded-xl border border-slate-100 p-3">
            <p className="font-bold text-slate-800 mb-1">① Customer asks:</p>
            <p className="font-mono bg-slate-50 rounded p-2 text-[10px]">"rate mumbai 5kg surface"</p>
            <p className="mt-1 text-slate-500">Any natural phrasing — no fixed format needed</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-3">
            <p className="font-bold text-slate-800 mb-1">② Paste here, hit Enter</p>
            <p className="text-slate-500">Instantly checks all 17 couriers, finds best margin, ready in &lt;1 second</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-3">
            <p className="font-bold text-slate-800 mb-1">③ Send the pre-built reply</p>
            <p className="text-slate-500">Copy the formatted message or open WhatsApp directly — one click</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-slate-400">
          <span>✅ City names</span><span>✅ PIN codes</span><span>✅ Detects weight + type</span>
          <span>✅ Doc / Surface / Air</span><span>✅ Send direct to customer number</span>
        </div>
      </div>
    </div>
  );
}
