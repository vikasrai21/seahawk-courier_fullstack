import { useState, useEffect } from 'react';
import { Printer, MessageCircle, ChevronDown } from 'lucide-react';
import api from '../services/api';
import { PageLoader, EmptyState } from '../components/ui/Loading';
import { useFetch } from '../hooks/useFetch';
import { sendWhatsAppReport } from '../utils/whatsapp';

const fmt    = n => `₹${Number(n||0).toLocaleString('en-IN')}`;
const fmtNum = n => Number(n||0).toFixed(1);
const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function MonthlyReportPage({ toast }) {
  const now  = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rows,  setRows]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [clientFilter, setClientF] = useState('');
  const [showWA, setShowWA] = useState(false);
  const { data: clients } = useFetch('/clients');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/shipments/stats/monthly?year=${year}&month=${month}`);
      setRows(res.data || []);
    } catch (err) { toast?.(err.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [year, month]);

  const filtered     = clientFilter ? rows.filter(r => r.clientCode === clientFilter) : rows;
  const totalRevenue = filtered.reduce((a,r) => a+(r.amount||0), 0);
  const totalWeight  = filtered.reduce((a,r) => a+(r.weight||0), 0);
  const clientCodes  = [...new Set(rows.map(r => r.clientCode))].filter(Boolean);
  const monthName    = `${months[month-1]} ${year}`;

  const byClient = filtered.reduce((acc,r) => {
    if (!acc[r.clientCode]) acc[r.clientCode] = { count:0, amount:0, weight:0 };
    acc[r.clientCode].count++;
    acc[r.clientCode].amount += r.amount||0;
    acc[r.clientCode].weight += r.weight||0;
    return acc;
  }, {});

  const byDay = filtered.reduce((acc,r) => {
    if (!acc[r.date]) acc[r.date] = { count:0, amount:0 };
    acc[r.date].count++;
    acc[r.date].amount += r.amount||0;
    return acc;
  }, {});

  const handleSendWA = (clientCode) => {
    const data   = clientCode ? rows.filter(r => r.clientCode === clientCode) : filtered;
    const client = clientCode ? clients?.find(c => c.code === clientCode) : null;
    const phone  = client?.whatsapp || client?.phone || '';
    if (clientCode && !phone) { toast?.('No WhatsApp number for this client. Edit their card to add one.', 'error'); setShowWA(false); return; }

    const result = sendWhatsAppReport({
      rows:       data,
      client,
      phoneRaw:   phone,
      dateLabel:  monthName,
      reportType: 'Monthly Report',
    });

    setShowWA(false);
    if (result.error) { toast?.(result.error, 'error'); return; }
    if (result.usedExcel) {
      toast?.(`${data.length} entries — Excel downloaded. Attach it in WhatsApp! 📎`, 'success');
    } else {
      toast?.('WhatsApp opened ✓', 'success');
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 print:hidden">
        <h1 className="text-2xl font-bold text-gray-900">Monthly Report</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select className="input w-auto" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {months.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="input w-auto" value={year} onChange={e => setYear(Number(e.target.value))}>
            {years.map(y => <option key={y}>{y}</option>)}
          </select>
          <select className="input w-auto" value={clientFilter} onChange={e => setClientF(e.target.value)}>
            <option value="">All Clients</option>
            {clientCodes.map(code => {
              const info = clients?.find(c => c.code === code);
              return <option key={code} value={code}>{code}{info ? ` — ${info.company}` : ''}</option>;
            })}
          </select>

          {/* Smart WhatsApp */}
          <div className="relative">
            <button onClick={() => setShowWA(!showWA)} className="btn-success btn-sm gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" /> Send WhatsApp <ChevronDown className="w-3 h-3" />
            </button>
            {showWA && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-100 shadow-xl z-50 min-w-[240px] py-2">
                <div className="px-3 py-1.5 bg-blue-50 border-b border-blue-100 mx-2 mb-1 rounded-lg">
                  <p className="text-[10px] text-blue-700 font-semibold">📎 More than 5 entries → Excel auto-downloaded</p>
                </div>
                <p className="px-3 py-1 text-[10px] text-gray-400 uppercase font-bold">Send to client:</p>
                {clientCodes.map(code => {
                  const info  = clients?.find(c => c.code === code);
                  const hasWA = !!(info?.whatsapp || info?.phone);
                  const count = rows.filter(r => r.clientCode === code).length;
                  return (
                    <button key={code} onClick={() => handleSendWA(code)}
                      className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-center gap-2 ${!hasWA ? 'opacity-40' : ''}`}>
                      <MessageCircle className={`w-3.5 h-3.5 ${hasWA ? 'text-green-500' : 'text-gray-300'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold">{code}</p>
                        <p className="text-[10px] text-gray-400">{info?.company || ''}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${count > 5 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        {count} {count > 5 ? '📎' : ''}
                      </span>
                    </button>
                  );
                })}
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
        <p className="text-sm mt-1">Monthly Report — {monthName}</p>
      </div>

      {loading ? <PageLoader /> : filtered.length === 0 ? (
        <EmptyState icon="📊" title="No data for this month" />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-navy-50 border border-navy-100 rounded-xl p-4">
              <p className="text-[10px] text-navy-500 font-bold uppercase tracking-wider">Total Shipments</p>
              <p className="text-3xl font-bold text-navy-700 mt-1">{filtered.length}</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Total Revenue</p>
              <p className="text-3xl font-bold text-green-700 mt-1">{fmt(totalRevenue)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Total Weight</p>
              <p className="text-3xl font-bold text-blue-700 mt-1">{fmtNum(totalWeight)} <span className="text-base font-normal">kg</span></p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div>
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">By Client</h2>
              <div className="table-wrap">
                <table className="tbl text-xs">
                  <thead><tr><th>Client</th><th>Company</th><th className="text-right">Shipments</th><th className="text-right">Revenue</th><th className="text-right">Weight</th></tr></thead>
                  <tbody>
                    {Object.entries(byClient).sort((a,b) => b[1].amount - a[1].amount).map(([code, d]) => {
                      const info = clients?.find(c => c.code === code);
                      return (
                        <tr key={code}>
                          <td className="font-mono font-bold text-navy-600">{code}</td>
                          <td className="text-gray-600">{info?.company || '—'}</td>
                          <td className="text-right font-semibold">{d.count}</td>
                          <td className="text-right font-semibold text-green-700">{fmt(d.amount)}</td>
                          <td className="text-right text-gray-500">{fmtNum(d.weight)}kg</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">By Day</h2>
              <div className="table-wrap max-h-[350px] overflow-y-auto">
                <table className="tbl text-xs">
                  <thead><tr><th>Date</th><th className="text-right">Shipments</th><th className="text-right">Revenue</th></tr></thead>
                  <tbody>
                    {Object.entries(byDay).sort((a,b) => a[0].localeCompare(b[0])).map(([date, d]) => (
                      <tr key={date}>
                        <td className="font-medium">{date}</td>
                        <td className="text-right">{d.count}</td>
                        <td className="text-right font-medium text-green-700">{fmt(d.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {showWA && <div className="fixed inset-0 z-40" onClick={() => setShowWA(false)} />}
    </div>
  );
}
