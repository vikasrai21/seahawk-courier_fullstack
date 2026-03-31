// DailySheetPage.jsx — Enhanced with auto-print + courier manifest
import { useState, useEffect } from 'react';
import { Printer, MessageCircle, ChevronDown, FileDown, Truck } from 'lucide-react';
import api from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PageLoader, EmptyState } from '../components/ui/Loading';
import { useFetch } from '../hooks/useFetch';
import { sendWhatsAppReport } from '../utils/whatsapp';

const fmt    = n => `₹${Number(n||0).toLocaleString('en-IN')}`;
const fmtNum = n => Number(n||0).toFixed(1);

export default function DailySheetPage({ toast }) {
  const today = new Date().toISOString().split('T')[0];
  const [date,       setDate]      = useState(today);
  const [shipments,  setShip]      = useState([]);
  const [manifest,   setManifest]  = useState(null);
  const [loading,    setLoading]   = useState(false);
  const [view,       setView]      = useState('sheet'); // 'sheet' | 'manifest'
  const [clientFilter, setClientF] = useState('');
  const [showWA,     setShowWA]    = useState(false);
  const { data: clients } = useFetch('/clients');

  const load = async d => {
    setLoading(true);
    try {
      const [shipRes, manifestRes] = await Promise.all([
        api.get(`/shipments?date_from=${d}&date_to=${d}&limit=500`),
        api.get(`/ops/courier-manifest?date=${d}`),
      ]);
      setShip(shipRes.data || shipRes || []);
      setManifest(manifestRes);
    } catch (err) { toast?.(err.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(date); }, [date]);

  const filtered   = clientFilter ? shipments.filter(s => s.clientCode === clientFilter) : shipments;
  const totalAmt   = filtered.reduce((a,s) => a+(s.amount||0), 0);
  const totalWt    = filtered.reduce((a,s) => a+(s.weight||0), 0);
  const byCourier  = filtered.reduce((acc,s) => { if(s.courier) acc[s.courier]=(acc[s.courier]||0)+1; return acc; }, {});
  const clientCodes = [...new Set(shipments.map(s => s.clientCode))].filter(Boolean);

  // ── Auto-print daily sheet ────────────────────────────────────────────
  const printSheet = () => {
    const printContent = `
      <!DOCTYPE html><html><head>
      <title>Sea Hawk Daily Sheet — ${date}</title>
      <style>
        body { font-family: 'Inter', sans-serif; font-size: 11px; margin: 20px; }
        h1 { font-size: 16px; margin-bottom: 4px; }
        .meta { color: #666; font-size: 10px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #0b1f3a; color: white; padding: 6px 8px; text-align: left; font-size: 9px; text-transform: uppercase; }
        td { padding: 5px 8px; border-bottom: 1px solid #eee; font-size: 10px; }
        tr:nth-child(even) td { background: #f9f9f9; }
        .summary { margin-top: 16px; display: flex; gap: 24px; }
        .sum-item { background: #f3f4f6; padding: 8px 12px; border-radius: 6px; }
        .sum-label { font-size: 9px; color: #666; text-transform: uppercase; }
        .sum-val { font-size: 14px; font-weight: bold; }
        .footer { margin-top: 20px; font-size: 9px; color: #aaa; text-align: center; }
      </style></head><body>
      <h1><img src="/images/logo.png" alt="Logo" style="height: 20px; vertical-align: middle; margin-right: 8px;" /> Sea Hawk Courier & Cargo — Daily Dispatch Sheet</h1>
      <div class="meta">Date: ${date} | Client: ${clientFilter || 'All'} | Generated: ${new Date().toLocaleString('en-IN')}</div>
      <table>
        <thead><tr><th>#</th><th>AWB No.</th><th>Client</th><th>Consignee</th><th>Destination</th><th>Courier</th><th>Wt (kg)</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>
          ${filtered.map((s, i) => `
            <tr>
              <td>${i+1}</td><td><b>${s.awb}</b></td><td>${s.clientCode}</td>
              <td>${s.consignee||''}</td><td>${s.destination||''}</td>
              <td>${s.courier||'—'}</td><td>${s.weight}</td>
              <td>₹${Number(s.amount||0).toLocaleString('en-IN')}</td><td>${s.status}</td>
            </tr>`).join('')}
        </tbody>
      </table>
      <div class="summary">
        <div class="sum-item"><div class="sum-label">Total Shipments</div><div class="sum-val">${filtered.length}</div></div>
        <div class="sum-item"><div class="sum-label">Total Weight</div><div class="sum-val">${totalWt.toFixed(2)} kg</div></div>
        <div class="sum-item"><div class="sum-label">Total Amount</div><div class="sum-val">₹${Number(totalAmt).toLocaleString('en-IN')}</div></div>
        <div class="sum-item"><div class="sum-label">By Courier</div><div class="sum-val" style="font-size:10px">${Object.entries(byCourier).map(([c,n])=>`${c}: ${n}`).join(' | ')}</div></div>
      </div>
      <div class="footer">Sea Hawk Courier & Cargo | GSTIN: 06AJDPR0914N2Z1 | +91 99115 65523</div>
      </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(printContent);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  // ── Print courier manifest ────────────────────────────────────────────
  const printManifest = () => {
    if (!manifest) return;
    const printContent = `
      <!DOCTYPE html><html><head>
      <title>Sea Hawk Courier Manifest — ${date}</title>
      <style>
        body { font-family: 'Inter', sans-serif; font-size: 11px; margin: 20px; }
        h1 { font-size: 16px; margin-bottom: 4px; }
        h2 { font-size: 13px; margin: 16px 0 6px; color: #0b1f3a; border-bottom: 2px solid #e8580a; padding-bottom: 4px; }
        .meta { color: #666; font-size: 10px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        th { background: #1a3a6b; color: white; padding: 5px 8px; font-size: 9px; text-transform: uppercase; text-align: left; }
        td { padding: 4px 8px; border-bottom: 1px solid #eee; font-size: 10px; }
        .courier-summary { background: #f0f4ff; padding: 6px 10px; border-radius: 4px; font-size: 10px; margin-bottom: 6px; }
        .total-row { background: #0b1f3a; color: white; font-weight: bold; }
        .total-row td { color: white; }
        .footer { margin-top: 20px; font-size: 9px; color: #aaa; text-align: center; }
        @media print { .no-print { display: none; } }
      </style></head><body>
      <h1><img src="/images/logo.png" alt="Logo" style="height: 20px; vertical-align: middle; margin-right: 8px;" /> Sea Hawk Courier & Cargo — Courier Handover Manifest</h1>
      <div class="meta">Date: ${date} | Total: ${manifest.totalShipments} shipments | ${manifest.totalWeight?.toFixed(2)} kg | ₹${Number(manifest.totalAmount||0).toLocaleString('en-IN')} | Generated: ${new Date().toLocaleString('en-IN')}</div>
      ${(manifest.couriers || []).map(c => `
        <h2>${c.courier} — ${c.totalPieces} pieces</h2>
        <div class="courier-summary">Total Weight: ${c.totalWeight?.toFixed(3)} kg | Amount: ₹${Number(c.totalAmount||0).toLocaleString('en-IN')}</div>
        <table>
          <thead><tr><th>#</th><th>AWB No.</th><th>Client</th><th>Consignee</th><th>Destination</th><th>Weight (kg)</th><th>Amount</th></tr></thead>
          <tbody>
            ${c.shipments.map((s, i) => `<tr><td>${i+1}</td><td><b>${s.awb}</b></td><td>${s.clientCode}</td><td>${s.consignee||''}</td><td>${s.destination||''}</td><td>${s.weight}</td><td>₹${Number(s.amount||0).toLocaleString('en-IN')}</td></tr>`).join('')}
          </tbody>
        </table>`).join('')}
      <div class="footer">Sea Hawk Courier & Cargo | GSTIN: 06AJDPR0914N2Z1 | +91 99115 65523</div>
      </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(printContent);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  const handleSendWA = (clientCode) => {
    const rows   = clientCode ? shipments.filter(s => s.clientCode === clientCode) : filtered;
    const client = clientCode ? clients?.find(c => c.code === clientCode) : null;
    const phone  = client?.whatsapp || client?.phone || '';
    if (clientCode && !phone) { toast?.('No WhatsApp number for this client.', 'error'); setShowWA(false); return; }
    const result = sendWhatsAppReport({ rows, client, phoneRaw: phone, dateLabel: date, reportType: 'Daily Dispatch Report' });
    setShowWA(false);
    if (result.error) { toast?.(result.error, 'error'); return; }
    toast?.(result.usedExcel ? `${rows.length} entries — Excel downloaded. Attach in WhatsApp! 📎` : 'WhatsApp opened ✓', 'success');
  };

  return (
    <div className="p-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 print:hidden">
        <h1 className="text-2xl font-bold text-gray-900">Daily Dispatch Sheet</h1>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" className="input w-auto" value={date} onChange={e => setDate(e.target.value)} />

          <select className="input w-auto" value={clientFilter} onChange={e => setClientF(e.target.value)}>
            <option value="">All Clients</option>
            {clientCodes.map(code => {
              const info = clients?.find(c => c.code === code);
              return <option key={code} value={code}>{code}{info ? ` — ${info.company}` : ''}</option>;
            })}
          </select>

          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button onClick={() => setView('sheet')} className={`px-3 py-1.5 text-xs font-semibold ${view === 'sheet' ? 'bg-navy-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`} style={{ background: view === 'sheet' ? '#1a2b5e' : '' }}>
              📋 Sheet
            </button>
            <button onClick={() => setView('manifest')} className={`px-3 py-1.5 text-xs font-semibold border-l border-gray-200 ${view === 'manifest' ? 'bg-navy-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`} style={{ background: view === 'manifest' ? '#1a2b5e' : '' }}>
              🚚 Manifest
            </button>
          </div>

          {/* Print button */}
          <button onClick={view === 'manifest' ? printManifest : printSheet} className="btn-secondary btn-sm gap-1.5">
            <Printer className="w-3.5 h-3.5" /> Print {view === 'manifest' ? 'Manifest' : 'Sheet'}
          </button>

          {/* WhatsApp */}
          <div className="relative">
            <button onClick={() => setShowWA(!showWA)} className="btn-success btn-sm gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp Report
              <ChevronDown className="w-3 h-3" />
            </button>
            {showWA && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowWA(false)} />
                <div className="absolute z-20 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 min-w-[180px]">
                  <button onClick={() => handleSendWA('')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 font-semibold">📊 All Clients Summary</button>
                  <div className="border-t border-gray-100 my-1" />
                  {clientCodes.map(code => {
                    const info = clients?.find(c => c.code === code);
                    return (
                      <button key={code} onClick={() => handleSendWA(code)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
                        {code}{info ? ` — ${info.company}` : ''}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {loading ? <PageLoader /> : (
        <>
          {/* Summary strip */}
          {filtered.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                <div className="text-xl font-black text-gray-900">{filtered.length}</div>
                <div className="text-xs text-gray-500">Total Shipments</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                <div className="text-xl font-black text-gray-900">{fmt(totalAmt)}</div>
                <div className="text-xs text-gray-500">Total Revenue</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                <div className="text-xl font-black text-gray-900">{totalWt.toFixed(2)} kg</div>
                <div className="text-xs text-gray-500">Total Weight</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                <div className="text-xs font-semibold text-gray-900">
                  {Object.entries(byCourier).map(([c,n]) => (
                    <div key={c} className="flex justify-between"><span>{c}</span><span className="font-bold">{n}</span></div>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-1">By Courier</div>
              </div>
            </div>
          )}

          {/* SHEET VIEW */}
          {view === 'sheet' && (
            filtered.length === 0 ? (
              <EmptyState icon="📭" title="No shipments for this date" description="Try a different date or check if data was entered" />
            ) : (
              <div className="table-wrap">
                <table className="tbl text-xs">
                  <thead>
                    <tr>
                      <th>#</th><th>AWB</th><th>Client</th><th>Consignee</th>
                      <th>Destination</th><th>Dept</th><th>Courier</th>
                      <th className="text-right">Wt(kg)</th><th className="text-right">Amount</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s, i) => (
                      <tr key={s.id}>
                        <td className="text-gray-400">{i+1}</td>
                        <td className="font-mono font-bold">{s.awb}</td>
                        <td className="font-semibold">{s.clientCode}</td>
                        <td className="max-w-[100px] truncate">{s.consignee}</td>
                        <td>{s.destination}</td>
                        <td className="text-gray-500">{s.department || '—'}</td>
                        <td>{s.courier || '—'}</td>
                        <td className="text-right">{s.weight}</td>
                        <td className="text-right font-semibold">{fmt(s.amount)}</td>
                        <td><StatusBadge status={s.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* MANIFEST VIEW */}
          {view === 'manifest' && manifest && (
            <div className="space-y-4">
              {(manifest.couriers || []).length === 0 ? (
                <EmptyState icon="🚚" title="No shipments for this date" description="No manifest to display" />
              ) : (
                manifest.couriers.map(c => (
                  <div key={c.courier} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 flex items-center justify-between" style={{ background: '#0b1f3a' }}>
                      <div className="flex items-center gap-3">
                        <Truck className="w-4 h-4 text-orange-400" />
                        <span className="font-bold text-white">{c.courier}</span>
                        <span className="text-white/60 text-sm">{c.totalPieces} pieces</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-white/70">
                        <span>{c.totalWeight?.toFixed(3)} kg</span>
                        <span className="font-bold text-orange-400">{fmt(c.totalAmount)}</span>
                      </div>
                    </div>
                    <table className="tbl text-xs">
                      <thead>
                        <tr><th>#</th><th>AWB</th><th>Client</th><th>Consignee</th><th>Destination</th><th className="text-right">Weight</th><th className="text-right">Amount</th></tr>
                      </thead>
                      <tbody>
                        {c.shipments.map((s, i) => (
                          <tr key={s.id}>
                            <td className="text-gray-400">{i+1}</td>
                            <td className="font-mono font-bold text-navy-700">{s.awb}</td>
                            <td className="font-semibold">{s.clientCode}</td>
                            <td className="max-w-[100px] truncate">{s.consignee}</td>
                            <td>{s.destination}</td>
                            <td className="text-right">{s.weight}</td>
                            <td className="text-right font-semibold">{fmt(s.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
