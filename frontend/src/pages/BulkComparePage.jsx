import { useState, useRef } from 'react';
import { Upload, Download, Play, AlertTriangle, Package } from 'lucide-react';
import api from '../services/api';

const fmt  = n => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtP = n => `${Number(n || 0).toFixed(1)}%`;
const pColor = m => m > 30 ? 'text-green-700' : m > 15 ? 'text-amber-600' : m > 0 ? 'text-orange-500' : 'text-red-600';

const TEMPLATE = `ref,destination_city,state,weight_kg,ship_type
SH-001,Mumbai,Maharashtra,2.5,surface
SH-002,Chennai,Tamil Nadu,0.5,doc
SH-003,Delhi,Delhi,10,surface
SH-004,Kolkata,West Bengal,1,doc
SH-005,Guwahati,Assam,5,surface`;

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = vals[i] || ''; });
    return row;
  }).filter(r => r.weight_kg && parseFloat(r.weight_kg) > 0);
}

function shipmentsToBulkPayload(rows) {
  return rows.map(r => ({
    ref: r.ref || r.awb || '',
    awb: r.awb || '',
    city: r.destination_city || r.city || '',
    district: r.district || '',
    state: r.state || '',
    weight: parseFloat(r.weight_kg || r.weight) || 0,
    shipType: (r.ship_type || r.type || 'doc').toLowerCase(),
  }));
}

export default function BulkComparePage({ toast }) {
  const [csvText, setCsvText]     = useState('');
  const [parsed, setParsed]       = useState([]);
  const [results, setResults]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const fileRef = useRef();

  const handleParse = () => {
    const rows = parseCSV(csvText);
    if (!rows.length) { toast?.('No valid rows found — check your CSV format', 'error'); return; }
    setParsed(rows);
    setResults(null);
    toast?.(`Parsed ${rows.length} rows`, 'success');
  };

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setCsvText(ev.target.result); };
    reader.readAsText(file);
  };

  const handleRun = async () => {
    if (!parsed.length) { toast?.('Parse CSV first', 'error'); return; }
    setLoading(true);
    try {
      const payload = shipmentsToBulkPayload(parsed);
      const res = await api.post('/rates/calculate/bulk', { shipments: payload });
      setResults(res.data?.data);
    } catch (e) {
      toast?.('Calculation failed — check network and try again', 'error');
    } finally { setLoading(false); }
  };

  const handleDownload = () => {
    if (!results?.results) return;
    const rows = results.results;
    const headers = ['Ref','Destination','Weight (kg)','Ship Type','Zone','Best Courier','Courier Cost (₹)','Sell Price (₹)','Profit (₹)','Margin (%)'];
    const lines = [headers.join(',')];
    rows.forEach(r => {
      lines.push([
        r.ref, `"${r.destination}"`, r.weight, r.shipType, r.seahawkZone,
        `"${r.bestCourier}"`,
        r.bestCost.toFixed(2), r.bestSell.toFixed(2),
        r.bestProfit.toFixed(2), r.bestMargin.toFixed(1),
      ].join(','));
    });
    // Summary rows
    lines.push('');
    lines.push(['SUMMARY','','','','','','','','',''].join(','));
    lines.push(['Total Shipments',rows.length,'','','','','','','',''].join(','));
    lines.push(['Total Courier Cost','',results.summary.totalCost,'','','','','','',''].join(','));
    lines.push(['Total Sell Price','',results.summary.totalSell,'','','','','','',''].join(','));
    lines.push(['Total Profit','',results.summary.totalProfit,'','','','','','',''].join(','));
    lines.push(['Avg Margin %','',results.summary.avgMargin,'','','','','','',''].join(','));
    lines.push(['Below 15% Margin',results.summary.belowMargin,'','','','','','','',''].join(','));

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `Seahawk_BulkComparison_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = 'Seahawk_BulkTemplate.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const selectedResult = selectedRow !== null ? results?.results?.[selectedRow] : null;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Rate Comparison</h1>
          <p className="text-xs text-gray-400 mt-0.5">Upload a shipment list — get cost + profit for every row across all 17 couriers</p>
        </div>
        <button onClick={downloadTemplate}
          className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-3 py-2 rounded-xl text-xs font-bold hover:border-gray-400">
          <Download className="w-3.5 h-3.5" />Download Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        {/* Input panel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">1</div>
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Paste or Upload Data</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-3">
            <button onClick={() => fileRef.current.click()}
              className="flex items-center gap-2 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold hover:border-slate-400 hover:shadow-sm transition-all focus:ring-2 focus:ring-slate-900">
              <Upload className="w-3.5 h-3.5" /> Upload CSV File
            </button>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">or paste directly below</span>
          </div>

          <textarea
            className="w-full border border-gray-200 rounded-xl p-3 text-xs font-mono h-40 resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder={`Paste CSV here:\n${TEMPLATE}`}
            value={csvText}
            onChange={e => { setCsvText(e.target.value); setParsed([]); setResults(null); }}
          />

          <div className="flex gap-2 mt-2">
            <button onClick={handleParse} disabled={!csvText.trim()}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-xs font-bold disabled:opacity-40">
              Parse CSV
            </button>
            <button onClick={handleRun} disabled={!parsed.length || loading}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
              <Play className="w-3 h-3" />{loading ? 'Calculating…' : `Run ${parsed.length} rows`}
            </button>
          </div>

          {parsed.length > 0 && (
            <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <p className="text-xs text-blue-700 font-semibold">{parsed.length} rows parsed — preview:</p>
              <div className="mt-1 max-h-20 overflow-y-auto">
                {parsed.slice(0, 5).map((r, i) => (
                  <p key={i} className="text-[10px] text-blue-600">
                    {i + 1}. {r.ref} — {r.destination_city}, {r.state} · {r.weight_kg}kg · {r.ship_type}
                  </p>
                ))}
                {parsed.length > 5 && <p className="text-[10px] text-blue-400">…and {parsed.length - 5} more</p>}
              </div>
            </div>
          )}
        </div>

        {/* Empty state for unparsed */}
        {!results && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4">
              <Play className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-600">Ready to Compare Rates</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Upload a CSV and click parse to see your 17-courier comparison.</p>
          </div>
        )}

        {/* Summary */}
        {results && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">📊 Summary</p>
              <button onClick={handleDownload}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold">
                <Download className="w-3 h-3" />Export Results
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                ['Shipments', results.summary.total.toLocaleString('en-IN'), 'text-gray-800'],
                ['Total Cost', fmt(results.summary.totalCost), 'text-gray-800'],
                ['Total Revenue', fmt(results.summary.totalSell), 'text-gray-800'],
                ['Total Profit', fmt(results.summary.totalProfit), results.summary.totalProfit > 0 ? 'text-green-700' : 'text-red-600'],
                ['Avg Margin', fmtP(results.summary.avgMargin), results.summary.avgMargin > 20 ? 'text-green-700' : 'text-amber-600'],
                ['Below 15%', results.summary.belowMargin, results.summary.belowMargin > 0 ? 'text-red-600' : 'text-green-700'],
              ].map(([k, v, cls]) => (
                <div key={k} className="bg-gray-50 rounded-xl p-2.5">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide">{k}</p>
                  <p className={`text-base font-bold ${cls}`}>{v}</p>
                </div>
              ))}
            </div>

            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Best Courier Breakdown</p>
            <div className="space-y-1">
              {Object.entries(results.summary.byCourier).sort((a,b) => b[1]-a[1]).map(([courier, count]) => (
                <div key={courier} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 truncate">{courier}</span>
                  <span className="font-bold text-gray-800 ml-2">{count} shipment{count > 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>

            {results.summary.belowMargin > 0 && (
              <div className="mt-3 bg-red-50 border border-red-100 rounded-xl p-2.5">
                <p className="text-xs text-red-700 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {results.summary.belowMargin} shipment(s) below 15% margin — review before booking
                </p>
              </div>
            )}
          </div>
        )}

        {!results && !loading && (
          <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8 flex flex-col items-center justify-center text-center">
            <Package className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400 font-medium">Results will appear here</p>
            <p className="text-xs text-gray-300 mt-1">Parse CSV then click Run</p>
          </div>
        )}
      </div>

      {/* Results table */}
      {results?.results?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-sm text-gray-700">Results — {results.results.length} Shipments</h2>
            <p className="text-[10px] text-gray-400">Click any row to see all courier options</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {['#','Ref','Destination','Weight','Type','Zone','Best Courier','Cost','Sell','Profit','Margin','Alert'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.results.map((r, i) => (
                  <>
                    <tr key={i} onClick={() => setSelectedRow(selectedRow === i ? null : i)}
                      className={`border-t border-gray-50 cursor-pointer transition-all ${
                        r.bestMargin < 0 ? 'bg-red-50/40' : r.bestMargin < 15 ? 'bg-amber-50/40' : ''
                      } ${selectedRow === i ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-3 py-2 text-gray-400 font-mono">{i + 1}</td>
                      <td className="px-3 py-2 font-bold text-slate-700">{r.ref || '—'}</td>
                      <td className="px-3 py-2 text-gray-600 max-w-[130px] truncate">{r.destination}</td>
                      <td className="px-3 py-2 font-bold text-gray-700">{r.weight}kg</td>
                      <td className="px-3 py-2 text-gray-500">{r.shipType}</td>
                      <td className="px-3 py-2 text-gray-500">{r.seahawkZone}</td>
                      <td className="px-3 py-2 font-semibold text-gray-800">{r.bestCourier}</td>
                      <td className="px-3 py-2 font-bold text-gray-700">{fmt(r.bestCost)}</td>
                      <td className="px-3 py-2 font-bold text-gray-700">{fmt(r.bestSell)}</td>
                      <td className={`px-3 py-2 font-bold ${r.bestProfit > 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(r.bestProfit)}</td>
                      <td className={`px-3 py-2 font-bold ${pColor(r.bestMargin)}`}>{fmtP(r.bestMargin)}</td>
                      <td className="px-3 py-2">
                        {r.bestMargin < 0 ? <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">LOSS</span>
                         : r.bestMargin < 15 ? <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">LOW</span>
                         : <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">OK</span>}
                      </td>
                    </tr>
                    {/* Expanded all-courier view */}
                    {selectedRow === i && selectedResult && (
                      <tr>
                        <td colSpan={12} className="bg-blue-50 border-b border-blue-100 px-4 py-3">
                          <p className="text-[10px] font-bold text-blue-700 mb-2 uppercase tracking-wide">
                            All couriers for {r.destination} · {r.weight}kg · {r.shipType}
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                            {selectedResult.allCouriers.map((c, j) => (
                              <div key={j} className={`bg-white rounded-xl border px-2.5 py-2 ${j === 0 ? 'border-green-300' : 'border-gray-100'}`}>
                                <p className="text-[9px] text-gray-400 truncate">{c.label}</p>
                                <p className="text-xs font-bold text-gray-800">{fmt(c.cost)}</p>
                                <p className={`text-[9px] font-semibold ${pColor(c.margin)}`}>{fmtP(c.margin)} margin</p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
