import { EmptyState } from '../components/ui/EmptyState';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Shield, AlertTriangle, X, Loader, Eye, TrendingDown, IndianRupee } from 'lucide-react';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';

const fmt  = n => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtI = n => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

const STATUS_ROW = {
  OK:        { label:'OK',        color:'bg-green-100 text-green-700',   icon:'✓' },
  OVER:      { label:'Overcharge',color:'bg-red-100 text-red-700',       icon:'⬆' },
  UNDER:     { label:'Undercharge',color:'bg-amber-100 text-amber-700',  icon:'⬇' },
  NOT_FOUND: { label:'Not Found', color:'bg-gray-100 text-gray-500',     icon:'?' },
};
const INV_STATUS = {
  PENDING:  'bg-yellow-100 text-yellow-700',
  REVIEWED: 'bg-blue-100 text-blue-700',
  DISPUTED: 'bg-red-100 text-red-700',
  SETTLED:  'bg-green-100 text-green-700',
};

const COURIERS = ['Trackon','Delhivery','DTDC','BlueDart','GEC','LTL','B2B'];

const CSV_TEMPLATE = `awb,date,destination,weight,billed_amount
TK1234567890,2024-03-01,Mumbai,5.0,850.00
DL9876543210,2024-03-01,Delhi,0.5,120.00
DTDC1122334455,2024-03-02,Bengaluru,2.0,320.00`;

function parseRecoCsv(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g,'_'));
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = vals[i] || ''; });
    return row;
  }).filter(r => r.awb && r.billed_amount);
}

export default function ReconciliationPage({ toast }) {
  const [invoices, setInvoices]   = useState([]);
  const [stats, setStats]         = useState(null);
  const [drift, setDrift]         = useState([]);
  const [disputes, setDisputes]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewInv, setViewInv]     = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [showUpload, setShowUpload]   = useState(false);
  const [openingDispute, setOpeningDispute] = useState(false);
  const [resolvingDispute, setResolvingDispute] = useState(null);
  const fileRef = useRef();

  // Upload form state
  const [form, setForm] = useState({ courier:'Trackon', invoiceNo:'', invoiceDate:'', fromDate:'', toDate:'', notes:'' });
  const [csvText, setCsvText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [iRes, sRes, dRes, dspRes] = await Promise.all([
        api.get('/reconciliation'),
        api.get('/reconciliation/stats'),
        api.get('/reconciliation/drift'),
        api.get('/reconciliation/disputes?status=ALL&limit=50'),
      ]);
      setInvoices(iRes.data?.data || []);
      setStats(sRes.data?.data);
      setDrift(dRes.data?.data || []);
      setDisputes(dspRes.data?.data || []);
    } catch { toast?.('Failed to load reconciliation data', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadDetail = async (inv) => {
    setViewLoading(true);
    try {
      const r = await api.get(`/reconciliation/${inv.id}`);
      setViewInv(r.data?.data);
    } catch { toast?.('Failed to load invoice details', 'error'); }
    finally { setViewLoading(false); }
  };

  const openDispute = async (inv) => {
    setOpeningDispute(true);
    try {
      const res = await api.post('/reconciliation/disputes', {
        invoiceId: inv.id,
        awbs: [],
        reason: 'System-detected overcharge requiring recovery',
      });
      toast?.(`Dispute ${res.data?.disputeNo || ''} opened`, 'success');
      if (viewInv?.id === inv.id) {
        const detail = await api.get(`/reconciliation/${inv.id}`);
        setViewInv(detail.data?.data || null);
      }
      await load();
    } catch (err) {
      toast?.(err.message || 'Failed to open dispute', 'error');
    } finally {
      setOpeningDispute(false);
    }
  };

  const resolveDispute = async (disputeNo) => {
    setResolvingDispute(disputeNo);
    try {
      await api.patch(`/reconciliation/disputes/${encodeURIComponent(disputeNo)}/resolve`, {
        resolutionNotes: 'Settled with courier partner.',
      });
      toast?.(`Dispute ${disputeNo} marked resolved`, 'success');
      await load();
    } catch (err) {
      toast?.(err.message || 'Failed to resolve dispute', 'error');
    } finally {
      setResolvingDispute(null);
    }
  };

  const handleUpload = async () => {
    if (!form.invoiceNo || !form.invoiceDate || !form.fromDate || !form.toDate) {
      toast?.('Fill in all invoice details', 'error'); return;
    }
    const items = parseRecoCsv(csvText);
    if (!items.length) { toast?.('No valid rows in CSV', 'error'); return; }
    setUploading(true);
    try {
      await api.post('/reconciliation', { ...form, items });
      toast?.(`Invoice uploaded — ${items.length} AWBs processed`, 'success');
      setShowUpload(false);
      setCsvText('');
      setForm({ courier:'Trackon', invoiceNo:'', invoiceDate:'', fromDate:'', toDate:'', notes:'' });
      load();
    } catch (e) {
      toast?.('Upload failed — ' + (e.response?.data?.message || 'check network'), 'error');
    } finally { setUploading(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/reconciliation/${id}/status`, { status });
      toast?.(`Invoice marked as ${status.toLowerCase()}`, 'success');
      load();
      if (viewInv?.id === id) setViewInv(v => ({ ...v, status }));
    } catch { toast?.('Update failed', 'error'); }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = 'Seahawk_RecoTemplate.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <PageHeader
        title="Invoice Reconciliation"
        subtitle="Upload partner invoices, auto-match AWBs, and surface overcharges with a cleaner dispute workflow."
        icon={Shield}
        actions={
        <div className="flex gap-2">
          <button onClick={downloadTemplate}
            className="btn-secondary btn-sm">
            CSV Template
          </button>
          <button onClick={() => setShowUpload(!showUpload)}
            className="btn-primary btn-sm">
            <Upload className="w-3.5 h-3.5" />Upload Invoice
          </button>
        </div>
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {[
            ['Invoices Processed', stats.totalInvoices, 'text-gray-800', Shield],
            ['Total Partner Billed', fmtI(stats.totalBilled), 'text-gray-800', IndianRupee],
            ['Overcharges Found', fmtI(stats.totalOvercharges), stats.totalOvercharges > 0 ? 'text-red-600 font-extrabold' : 'text-green-700', TrendingDown],
            ['Disputed Items', stats.overchargeCount, stats.overchargeCount > 0 ? 'text-red-600' : 'text-green-700', AlertTriangle],
          ].map(([label, val, cls, Icon]) => (
            <div key={label} className="card-compact">
              <Icon className="w-5 h-5 text-gray-400 mb-2" />
              <p className={`text-2xl font-bold ${cls}`}>{val}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}
      {stats?.totalOvercharges > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <p className="font-bold text-red-800">You have been overcharged {fmtI(stats.totalOvercharges)} across {stats.overchargeCount} AWBs</p>
            <p className="text-sm text-red-600 mt-0.5">Raise disputes with courier partners using the itemized breakdown below.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="table-shell">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-bold text-sm text-gray-700">Contract Drift Alerts</h2>
          </div>
          <div className="p-3 space-y-2">
            {drift.length === 0 ? (
              <div className="text-xs text-gray-500">No billing drift alerts in selected period.</div>
            ) : drift.slice(0, 6).map((row) => (
              <div key={row.lane} className="border rounded-lg p-2 text-xs">
                <div className="font-semibold text-slate-800">{row.courier} · {row.lane}</div>
                <div className="text-slate-600">Drift: {fmt(row.driftAmount)} ({row.driftPct}%) · {row.count} records</div>
              </div>
            ))}
          </div>
        </div>
        <div className="table-shell">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-bold text-sm text-gray-700">Dispute Workflow</h2>
          </div>
          <div className="p-3 space-y-2">
            {disputes.length === 0 ? (
              <div className="text-xs text-gray-500">No disputes raised yet.</div>
            ) : disputes.slice(0, 6).map((d) => (
              <div key={d.id} className="border rounded-lg p-2 text-xs">
                <div className="font-semibold text-slate-800">{d.disputeNo}</div>
                <div className="text-slate-600">{new Date(d.createdAt).toLocaleString()} · {d.status}</div>
                {d.status !== 'RESOLVED' && (
                  <button className="btn-secondary btn-sm mt-2" onClick={() => resolveDispute(d.disputeNo)} disabled={resolvingDispute === d.disputeNo}>
                    {resolvingDispute === d.disputeNo ? 'Resolving…' : 'Mark Resolved'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm text-gray-700">Upload Partner Invoice</h2>
            <button onClick={() => setShowUpload(false)} className="text-gray-300 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Courier</label>
              <select className="input"
                value={form.courier} onChange={e => setForm(f => ({ ...f, courier: e.target.value }))}>
                {COURIERS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Invoice No</label>
              <input className="input"
                placeholder="e.g. TK-2024-0123" value={form.invoiceNo} onChange={e => setForm(f => ({ ...f, invoiceNo: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Invoice Date</label>
              <input type="date" className="input"
                value={form.invoiceDate} onChange={e => setForm(f => ({ ...f, invoiceDate: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Period From</label>
              <input type="date" className="input"
                value={form.fromDate} onChange={e => setForm(f => ({ ...f, fromDate: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Period To</label>
              <input type="date" className="input"
                value={form.toDate} onChange={e => setForm(f => ({ ...f, toDate: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Notes</label>
              <input className="input"
                placeholder="Optional notes…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">AWB Data (CSV)</label>
          <div className="flex gap-2 mb-2">
            <button onClick={() => fileRef.current.click()}
              className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:border-gray-400">
              <Upload className="w-3 h-3" />Upload File
            </button>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden"
              onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = ev => setCsvText(ev.target.result); r.readAsText(f); } }} />
            <span className="text-xs text-gray-400 self-center">or paste below</span>
          </div>
          <textarea className="input h-28 resize-none text-xs font-mono"
            placeholder={`Paste CSV:\n${CSV_TEMPLATE}`}
            value={csvText} onChange={e => setCsvText(e.target.value)} />
          {csvText && (
            <p className="text-[10px] text-blue-600 mt-1">{parseRecoCsv(csvText).length} rows detected</p>
          )}
          <button onClick={handleUpload} disabled={uploading}
            className="mt-3 w-full bg-slate-800 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {uploading ? <><Loader className="w-4 h-4 animate-spin" />Processing…</> : <><Shield className="w-4 h-4" />Upload & Reconcile</>}
          </button>
        </div>
      )}

      {/* Invoice list */}
      <div className="table-shell mb-4">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-bold text-sm text-gray-700">Partner Invoices</h2>
        </div>
        {loading ? (
          <div className="py-12 text-center"><Loader className="w-6 h-6 animate-spin mx-auto text-gray-400 mb-2" /><p className="text-gray-400 text-sm">Loading…</p></div>
        ) : invoices.length === 0 ? (
          <EmptyState icon="🛡️" title="No invoices yet" message="Upload your first courier partner invoice using the button above to start reconciliation." />
        ) : (
          <div className="divide-y divide-gray-50">
            {invoices.map(inv => (
              <div key={inv.id} className="px-4 py-3 flex flex-wrap items-center gap-3 hover:bg-amber-50/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-gray-800">{inv.courier}</span>
                    <span className="text-xs text-gray-400 font-mono">{inv.invoiceNo}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${INV_STATUS[inv.status] || INV_STATUS.PENDING}`}>{inv.status}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {inv.fromDate} → {inv.toDate} · {inv._count?.items || 0} AWBs · {fmt(inv.totalAmount)}
                    {inv.uploadedBy && <span className="ml-2">Uploaded by {inv.uploadedBy.name}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {inv.status === 'PENDING' && (
                    <>
                      <button onClick={() => updateStatus(inv.id, 'REVIEWED')}
                        className="text-[9px] bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded font-bold">Review</button>
                      <button onClick={() => openDispute(inv)} disabled={openingDispute}
                        className="text-[9px] bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded font-bold">Dispute</button>
                    </>
                  )}
                  {inv.status === 'DISPUTED' && (
                    <button onClick={() => updateStatus(inv.id, 'SETTLED')}
                      className="text-[9px] bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded font-bold">Settled</button>
                  )}
                  <button onClick={() => loadDetail(inv)}
                    className="flex items-center gap-1 text-xs border border-gray-200 rounded-lg px-2 py-1 hover:border-gray-400 text-gray-600">
                    <Eye className="w-3 h-3" />View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoice detail panel */}
      {viewLoading && (
        <div className="py-8 text-center"><Loader className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>
      )}
      {viewInv && !viewLoading && (
        <div className="table-shell overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-gray-700">{viewInv.courier} — {viewInv.invoiceNo}</h2>
              <p className="text-xs text-gray-400">{viewInv.fromDate} → {viewInv.toDate}</p>
            </div>
            <button onClick={() => setViewInv(null)} className="text-gray-300 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>

          {/* Summary */}
          {viewInv.summary && (
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  ['Total AWBs', viewInv.summary.totalItems, 'text-gray-800'],
                  ['OK', viewInv.summary.ok, 'text-green-700'],
                  ['Overcharged', viewInv.summary.over, viewInv.summary.over > 0 ? 'text-red-700 font-extrabold' : 'text-gray-400'],
                  ['Undercharged', viewInv.summary.under, 'text-amber-600'],
                  ['Not Found', viewInv.summary.notFound, 'text-gray-400'],
                  ['Net Discrepancy', fmt(viewInv.summary.netDiscrepancy), viewInv.summary.netDiscrepancy > 0 ? 'text-red-700 font-extrabold' : 'text-green-700'],
                ].map(([label, val, cls]) => (
                  <div key={label} className="text-center">
                    <p className={`text-lg font-bold ${cls}`}>{val}</p>
                    <p className="text-[9px] text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
              {viewInv.summary.over > 0 && (
                <div className="mt-3 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  <p className="text-xs text-red-700 font-bold">
                    ⚠️ Overcharged on {viewInv.summary.over} AWBs · Total excess: {fmt(viewInv.summary.totalOver)} — Dispute with {viewInv.courier}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Item table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="table-head">
                <tr>
                  {['AWB','Date','Destination','Weight','Billed (₹)','Calculated (₹)','Discrepancy (₹)','Status'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(viewInv.items || []).map(item => {
                  const sc = STATUS_ROW[item.status] || STATUS_ROW.NOT_FOUND;
                  return (
                    <tr key={item.id} className={`border-t border-gray-50 ${item.status === 'OVER' ? 'bg-red-50/40' : item.status === 'UNDER' ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-3 py-2 font-mono font-bold text-slate-700">{item.awb}</td>
                      <td className="px-3 py-2 text-gray-500">{item.date}</td>
                      <td className="px-3 py-2 text-gray-600 max-w-[120px] truncate">{item.destination}</td>
                      <td className="px-3 py-2 font-bold text-gray-700">{item.weight}kg</td>
                      <td className="px-3 py-2 font-bold text-gray-800">{fmt(item.billedAmount)}</td>
                      <td className="px-3 py-2 text-gray-600">{item.calculatedAmount !== null ? fmt(item.calculatedAmount) : '—'}</td>
                      <td className={`px-3 py-2 font-bold ${item.discrepancy > 2 ? 'text-red-700' : item.discrepancy < -2 ? 'text-amber-600' : 'text-green-700'}`}>
                        {item.discrepancy !== null ? (item.discrepancy > 0 ? '+' : '') + fmt(item.discrepancy) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${sc.color}`}>{sc.icon} {sc.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
