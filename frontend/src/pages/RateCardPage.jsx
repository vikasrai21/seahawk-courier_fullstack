import { useState, useMemo } from 'react';
import { Printer, Download, FileText, Users, X, ChevronDown } from 'lucide-react';
import api from '../services/api';

const fmt = n => Number(n || 0).toFixed(2);

// Proposal sell rates (must mirror rateEngine)
const SELL_DOC_ECO = {
  'Delhi & NCR':             { w250:22, w500:25, addl:12 },
  'North India':             { w250:28, w500:40, addl:14 },
  'Metro Cities':            { w250:35, w500:55, addl:35 },
  'Rest of India':           { w250:40, w500:65, addl:38 },
  'North East':              { w250:65, w500:80, addl:45 },
  'Diplomatic / Port Blair': { w250:75, w500:95, addl:50 },
};
const SELL_DOC_PREM = {
  'Delhi & NCR':             { w250:30,  w500:38,  addl:18 },
  'North India':             { w250:40,  w500:58,  addl:20 },
  'Metro Cities':            { w250:50,  w500:80,  addl:50 },
  'Rest of India':           { w250:58,  w500:95,  addl:55 },
  'North East':              { w250:90,  w500:115, addl:65 },
  'Diplomatic / Port Blair': { w250:110, w500:140, addl:75 },
};

const ZONES = Object.keys(SELL_DOC_ECO);
const SLABS_DOC = ['0.25 kg','0.5 kg','1 kg','2 kg','3 kg','5 kg'];
const SLABS_SFC = ['3 kg','5 kg','10 kg','20 kg','30 kg','50 kg'];
const FSC = 0.25, GST = 0.18;

function calcDocRate(zone, wkg, level = 'economy') {
  const r = (level === 'premium' ? SELL_DOC_PREM : SELL_DOC_ECO)[zone];
  if (!r) return 0;
  const w = parseFloat(wkg);
  const b = w <= 0.25 ? r.w250 : w <= 0.5 ? r.w500 : r.w500 + Math.ceil((w - 0.5) / 0.5) * r.addl;
  const fsc = b * FSC;
  return Math.round((b + fsc) * (1 + GST) * 100) / 100;
}

const SFC_ECO = {
  'Delhi & NCR':{ s3:22, s10:20, s25:18, s50:16 },
  'North India':{ s3:30, s10:28, s25:25, s50:22 },
  'Metro Cities':{ s3:35, s10:32, s25:30, s50:29 },
  'Rest of India':{ s3:45, s10:43, s25:40, s50:38 },
  'North East':{ s3:55, s10:52, s25:50, s50:47 },
  'Diplomatic / Port Blair':{ s3:120, s10:110, s25:90, s50:85 },
};
const SFC_PREM = {
  'Delhi & NCR':{ s3:30, s10:28, s25:25, s50:22 },
  'North India':{ s3:42, s10:40, s25:36, s50:32 },
  'Metro Cities':{ s3:50, s10:46, s25:42, s50:40 },
  'Rest of India':{ s3:62, s10:58, s25:55, s50:52 },
  'North East':{ s3:75, s10:70, s25:68, s50:64 },
  'Diplomatic / Port Blair':{ s3:160, s10:145, s25:120, s50:110 },
};
function calcSfcRate(zone, wkg, level = 'economy') {
  const r = (level === 'premium' ? SFC_PREM : SFC_ECO)[zone];
  if (!r) return 0;
  const w = parseFloat(wkg);
  const rate = w <= 10 ? r.s3 : w <= 25 ? r.s10 : w <= 50 ? r.s25 : r.s50;
  const b = w * rate, fsc = b * FSC;
  return Math.round((b + fsc) * (1 + GST) * 100) / 100;
}

export default function RateCardPage({ toast }) {
  const [clients, setClients]           = useState([]);
  const [selClient, setSelClient]       = useState(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showClients, setShowClients]   = useState(false);
  const [level, setLevel]               = useState('economy');
  const [shipType, setShipType]         = useState('doc');
  const [selZones, setSelZones]         = useState(ZONES);
  const [validDays, setValidDays]       = useState(30);
  const [heading, setHeading]           = useState('Seahawk Courier & Cargo');
  const [footerNote, setFooterNote]     = useState('Rates include FSC 25% + GST 18%. ODA surcharges applicable for remote locations. COD charges extra.');

  const loadClients = async () => {
    if (clients.length) return;
    try { const r = await api.get('/clients'); setClients(r.data?.data || []); } catch {}
  };

  const filteredClients = clients.filter(c =>
    (c.company || '').toLowerCase().includes(clientSearch.toLowerCase())
  ).slice(0, 8);

  const validUntil = new Date(Date.now() + validDays * 86400000).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });

  const slabs = shipType === 'doc' ? SLABS_DOC : SLABS_SFC;
  const calcRate = shipType === 'doc' ? calcDocRate : calcSfcRate;

  const rateTable = useMemo(() => {
    return selZones.map(zone => ({
      zone,
      rates: slabs.map(slab => calcRate(zone, parseFloat(slab), level)),
    }));
  }, [selZones, slabs, level, shipType]);

  const handlePrint = () => {
    const table = rateTable;
    const html = `
<!DOCTYPE html><html><head><title>Seahawk Rate Card</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Inter', sans-serif; color:#1e293b; background:#fff; padding:30px; }
  .logo { font-size:22px; font-weight:900; color:#1e293b; letter-spacing:-0.5px; }
  .tagline { font-size:10px; color:#94a3b8; text-transform:uppercase; letter-spacing:2px; margin-top:2px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #1e293b; padding-bottom:16px; margin-bottom:20px; }
  .header-right { text-align:right; }
  .badge { display:inline-block; background:#1e293b; color:#fff; font-size:9px; font-weight:700; padding:3px 8px; border-radius:4px; text-transform:uppercase; letter-spacing:1px; }
  .meta { font-size:10px; color:#64748b; margin-top:6px; }
  .client-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px 16px; margin-bottom:16px; font-size:11px; }
  .client-box strong { font-size:14px; display:block; margin-bottom:2px; }
  h2 { font-size:12px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:8px; }
  table { width:100%; border-collapse:collapse; margin-bottom:20px; font-size:10px; }
  thead th { background:#1e293b; color:#fff; padding:7px 10px; text-align:left; font-weight:600; font-size:9px; text-transform:uppercase; letter-spacing:0.5px; }
  tbody td { padding:7px 10px; border-bottom:1px solid #f1f5f9; }
  tbody tr:nth-child(even) { background:#f8fafc; }
  tbody tr:last-child td { border-bottom:none; }
  .amount { font-weight:700; text-align:right; color:#1e293b; }
  .zone-col { font-weight:600; color:#334155; }
  tfoot td { padding:8px 10px; background:#1e293b; color:#fff; font-weight:700; font-size:9px; }
  .footer { font-size:9px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:12px; margin-top:4px; line-height:1.5; }
  .level-badge { display:inline-block; padding:2px 8px; border-radius:12px; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; ${level === 'premium' ? 'background:#7c3aed;color:#fff;' : 'background:#16a34a;color:#fff;'} }
  @media print { body { padding:20px; } }
</style></head><body>
<div class="header">
  <div>
    <div class="logo">${heading}</div>
    <div class="tagline">Courier & Cargo Solutions</div>
  </div>
  <div class="header-right">
    <div class="badge">Rate Card ${new Date().getFullYear()}</div>
    <div class="meta">Date: ${new Date().toLocaleDateString('en-IN')}</div>
    <div class="meta">Valid until: ${validUntil}</div>
  </div>
</div>
${selClient ? `<div class="client-box"><strong>${selClient.company}</strong><span>${selClient.code}${selClient.phone ? ' · ' + selClient.phone : ''}</span></div>` : ''}
<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
  <h2 style="margin-bottom:0;">${shipType === 'doc' ? 'Document / Express Rates' : 'Surface Cargo Rates (per kg)'}</h2>
  <span class="level-badge">${level}</span>
</div>
<table>
  <thead>
    <tr>
      <th>Zone / Destination</th>
      ${slabs.map(s => `<th style="text-align:right;">${s}</th>`).join('')}
    </tr>
  </thead>
  <tbody>
    ${table.map(row => `
      <tr>
        <td class="zone-col">${row.zone}</td>
        ${row.rates.map(r => `<td class="amount">₹${r.toFixed(2)}</td>`).join('')}
      </tr>
    `).join('')}
  </tbody>
  <tfoot>
    <tr>
      <td colspan="${slabs.length + 1}">All prices in INR · Inclusive of FSC 25% + GST 18% · Volumetric = L×W×H÷5000</td>
    </tr>
  </tfoot>
</table>
<div class="footer">${footerNote}</div>
</body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const toggleZone = z => {
    setSelZones(prev => prev.includes(z) ? prev.filter(x => x !== z) : [...prev, z]);
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rate Card Generator</h1>
          <p className="text-xs text-gray-400 mt-0.5">Generate printable rate cards for clients — professional PDF, instant</p>
        </div>
        <button onClick={handlePrint}
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-700">
          <Printer className="w-4 h-4" />Print / Save PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
        {/* Settings panel */}
        <div className="space-y-3">
          {/* Client */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">👤 Client (optional)</p>
            {selClient ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">{selClient.company}</p>
                  <p className="text-xs text-gray-400">{selClient.code}</p>
                </div>
                <button onClick={() => setSelClient(null)} className="text-gray-300 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="Search client…" value={clientSearch}
                  onChange={e => { setClientSearch(e.target.value); setShowClients(true); loadClients(); }}
                  onFocus={() => { setShowClients(true); loadClients(); }} />
                {showClients && filteredClients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-100 rounded-xl mt-1 shadow-lg max-h-40 overflow-y-auto">
                    {filteredClients.map(c => (
                      <button key={c.id} onClick={() => { setSelClient(c); setShowClients(false); setClientSearch(''); }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0">
                        <span className="font-semibold">{c.company}</span>
                        <span className="text-gray-400 text-xs ml-2">{c.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Type & Level */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">📦 Type</p>
              <div className="flex gap-1.5">
                {[['doc','Document'],['surface','Surface']].map(([id, label]) => (
                  <button key={id} onClick={() => setShipType(id)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${shipType === id ? 'bg-slate-800 text-white border-slate-800' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">🏷 Service Level</p>
              <div className="flex gap-1.5">
                {[['economy','💰 Economy'],['premium','⭐ Premium']].map(([id, label]) => (
                  <button key={id} onClick={() => setLevel(id)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${level === id ? (id === 'premium' ? 'bg-violet-600 text-white border-violet-600' : 'bg-green-600 text-white border-green-600') : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">📅 Valid for (days)</p>
              <input type="number" min="1" max="365" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                value={validDays} onChange={e => setValidDays(parseInt(e.target.value) || 30)} />
            </div>
          </div>

          {/* Custom text */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">✏️ Branding</p>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
              placeholder="Company heading" value={heading} onChange={e => setHeading(e.target.value)} />
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none h-16 resize-none"
              placeholder="Footer note…" value={footerNote} onChange={e => setFooterNote(e.target.value)} />
          </div>

          {/* Zone selector */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">🗺 Zones to include</p>
            <div className="space-y-1">
              {ZONES.map(z => (
                <label key={z} className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 hover:text-gray-900">
                  <input type="checkbox" checked={selZones.includes(z)} onChange={() => toggleZone(z)}
                    className="w-3.5 h-3.5 rounded" />
                  {z}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Mock rate card header */}
            <div className="bg-slate-800 text-white px-5 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-lg">{heading}</p>
                  <p className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5">Courier & Cargo Solutions</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] bg-white/20 px-2 py-1 rounded-full font-bold uppercase tracking-wide">Rate Card {new Date().getFullYear()}</span>
                  <p className="text-[10px] text-white/50 mt-1">Valid until: {validUntil}</p>
                </div>
              </div>
              {selClient && (
                <div className="mt-3 bg-white/10 rounded-xl px-3 py-2 text-sm">
                  <strong>{selClient.company}</strong>
                  <span className="text-white/60 text-xs ml-2">{selClient.code}</span>
                </div>
              )}
            </div>

            {/* Table preview */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {shipType === 'doc' ? 'Document / Express Rates' : 'Surface Cargo Rates (per kg)'}
                </h3>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${level === 'premium' ? 'bg-violet-100 text-violet-700' : 'bg-green-100 text-green-700'}`}>
                  {level === 'premium' ? '⭐ Premium' : '💰 Economy'}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-900 text-white">
                      <th className="px-3 py-2 text-left font-semibold text-[10px] uppercase tracking-wide rounded-tl-lg">Zone</th>
                      {slabs.map(s => (
                        <th key={s} className="px-2 py-2 text-right font-semibold text-[10px] uppercase tracking-wide">{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rateTable.map((row, i) => (
                      <tr key={row.zone} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 font-semibold text-gray-800 border-b border-gray-100">{row.zone}</td>
                        {row.rates.map((r, j) => (
                          <td key={j} className="px-2 py-2 text-right font-bold text-gray-900 border-b border-gray-100 font-mono">₹{r.toFixed(2)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-900 text-white">
                      <td colSpan={slabs.length + 1} className="px-3 py-2 text-[9px] text-white/60 rounded-b-lg">
                        All prices in INR · Inclusive of FSC 25% + GST 18% · Volumetric = L×W×H ÷ 5000
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <p className="text-[9px] text-gray-400 mt-3 border-t border-gray-100 pt-2">{footerNote}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
