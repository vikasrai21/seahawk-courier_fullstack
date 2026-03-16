import { useState, useEffect } from 'react';
import { Printer, MessageCircle, ChevronDown } from 'lucide-react';
import api from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PageLoader, EmptyState } from '../components/ui/Loading';
import { useFetch } from '../hooks/useFetch';
import { sendWhatsAppReport } from '../utils/whatsapp';

const fmt    = n => `₹${Number(n||0).toLocaleString('en-IN')}`;
const fmtNum = n => Number(n||0).toFixed(1);

export default function DailySheetPage({ toast }) {
  const today = new Date().toISOString().split('T')[0];
  const [date,      setDate]    = useState(today);
  const [shipments, setShip]    = useState([]);
  const [loading,   setLoading] = useState(false);
  const [clientFilter, setClientF] = useState('');
  const [showWA,    setShowWA]  = useState(false);
  const { data: clients } = useFetch('/clients');

  const load = async d => {
    setLoading(true);
    try {
      const res = await api.get(`/shipments?date_from=${d}&date_to=${d}&limit=500`);
      setShip(res.data || []);
    } catch (err) { toast?.(err.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(date); }, [date]);

  const filtered   = clientFilter ? shipments.filter(s => s.clientCode === clientFilter) : shipments;
  const totalAmt   = filtered.reduce((a,s) => a+(s.amount||0), 0);
  const totalWt    = filtered.reduce((a,s) => a+(s.weight||0), 0);
  const byCourier  = filtered.reduce((acc,s) => { if(s.courier) acc[s.courier]=(acc[s.courier]||0)+1; return acc; }, {});
  const clientCodes= [...new Set(shipments.map(s => s.clientCode))].filter(Boolean);

  const handleSendWA = (clientCode) => {
    const rows   = clientCode ? shipments.filter(s => s.clientCode === clientCode) : filtered;
    const client = clientCode ? clients?.find(c => c.code === clientCode) : null;
    const phone  = client?.whatsapp || client?.phone || '';
    if (clientCode && !phone) { toast?.('No WhatsApp number for this client. Edit their card to add one.', 'error'); setShowWA(false); return; }

    const result = sendWhatsAppReport({
      rows,
      client,
      phoneRaw:   phone,
      dateLabel:  date,
      reportType: 'Daily Dispatch Report',
    });

    setShowWA(false);
    if (result.error) { toast?.(result.error, 'error'); return; }
    if (result.usedExcel) {
      toast?.(`${rows.length} entries — Excel file downloaded. Attach it in WhatsApp! 📎`, 'success');
    } else {
      toast?.('WhatsApp opened ✓', 'success');
    }
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

          {/* Smart WhatsApp button */}
          <div className="relative">
            <button onClick={() => setShowWA(!showWA)}
              className="btn-success btn-sm gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" /> Send WhatsApp <ChevronDown className="w-3 h-3" />
            </button>
            {showWA && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-100 shadow-xl z-50 min-w-[240px] py-2">
                <div className="px-3 py-1.5 bg-blue-50 border-b border-blue-100 mx-2 mb-1 rounded-lg">
                  <p className="text-[10px] text-blue-700 font-semibold">
                    📎 More than 5 entries → Excel auto-downloaded
                  </p>
                </div>
                <p className="px-3 py-1 text-[10px] text-gray-400 uppercase font-bold tracking-wider">Send to client:</p>
                {clientCodes.map(code => {
                  const info   = clients?.find(c => c.code === code);
                  const hasWA  = !!(info?.whatsapp || info?.phone);
                  const count  = shipments.filter(s => s.clientCode === code).length;
                  return (
                    <button key={code} onClick={() => handleSendWA(code)}
                      className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-2 ${!hasWA ? 'opacity-40' : ''}`}>
                      <MessageCircle className={`w-3.5 h-3.5 shrink-0 ${hasWA ? 'text-green-500' : 'text-gray-300'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold">{code}</p>
                        <p className="text-[10px] text-gray-400">{info?.company || ''}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${count > 5 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                          {count} {count > 5 ? '📎' : ''}
                        </span>
                        {!hasWA && <p className="text-[9px] text-red-400">No #</p>}
                      </div>
                    </button>
                  );
                })}
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button onClick={() => handleSendWA('')}
                    className="w-full text-left px-3 py-2 hover:bg-green-50 text-green-700 text-xs font-semibold flex items-center gap-2">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Send full report ({filtered.length} entries) {filtered.length > 5 ? '📎' : ''}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button onClick={() => window.print()} className="btn-secondary btn-sm gap-1.5">
            <Printer className="w-3.5 h-3.5" /> Print / PDF
          </button>
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block mb-6 text-center border-b pb-4">
        <h2 className="text-2xl font-bold">🦅 Seahawk Courier & Cargo</h2>
        <p className="text-sm mt-1">Daily Dispatch Sheet — {date}</p>
        {clientFilter && <p className="text-sm">Client: {clientFilter}</p>}
      </div>

      {loading ? <PageLoader /> : filtered.length === 0 ? (
        <EmptyState icon="📋" title="No shipments for this date" />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 print:grid-cols-4">
            <SummaryCard label="Shipments"    value={filtered.length}        color="navy" />
            <SummaryCard label="Total Amount" value={fmt(totalAmt)}           color="green" />
            <SummaryCard label="Total Weight" value={`${fmtNum(totalWt)} kg`} color="blue" />
            <SummaryCard label="Couriers"     value={Object.keys(byCourier).length} color="purple" />
          </div>

          {Object.keys(byCourier).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(byCourier).sort((a,b) => b[1]-a[1]).map(([courier, count]) => (
                <span key={courier} className="badge badge-blue gap-1">{courier}: <strong>{count}</strong></span>
              ))}
            </div>
          )}

          <div className="table-wrap print:overflow-visible">
            <table className="tbl text-xs">
              <thead>
                <tr><th>#</th><th>AWB</th><th>Client</th><th>Consignee</th><th>Destination</th><th>Courier</th><th>Dept</th><th className="text-right">Wt</th><th className="text-right">Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.map((s,i) => (
                  <tr key={s.id}>
                    <td className="text-gray-400">{i+1}</td>
                    <td className="font-mono font-bold text-navy-600">{s.awb}</td>
                    <td className="font-semibold">{s.clientCode}</td>
                    <td className="max-w-[130px] truncate">{s.consignee}</td>
                    <td className="text-gray-500">{s.destination}</td>
                    <td>{s.courier}</td>
                    <td className="text-gray-400">{s.department}</td>
                    <td className="text-right">{fmtNum(s.weight)}</td>
                    <td className="text-right font-medium">{fmt(s.amount)}</td>
                    <td><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={7} className="px-3 py-2 text-sm">Total — {filtered.length} shipments</td>
                  <td className="px-3 py-2 text-right text-sm">{fmtNum(totalWt)}</td>
                  <td className="px-3 py-2 text-right text-sm">{fmt(totalAmt)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {showWA && <div className="fixed inset-0 z-40" onClick={() => setShowWA(false)} />}
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  const colors = { navy:'bg-navy-50 text-navy-700 border-navy-100', green:'bg-green-50 text-green-700 border-green-100', blue:'bg-blue-50 text-blue-700 border-blue-100', purple:'bg-purple-50 text-purple-700 border-purple-100' };
  return (
    <div className={`rounded-xl border p-3 ${colors[color]}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">{label}</p>
      <p className="text-lg font-bold mt-0.5">{value}</p>
    </div>
  );
}
