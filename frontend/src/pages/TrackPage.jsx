import { useState, useEffect } from 'react';
import { Search, ExternalLink, RefreshCw, X, Package, MapPin, Clock, ArrowRight, Calendar } from 'lucide-react';
import api from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useFetch } from '../hooks/useFetch';
import { PageHeader } from '../components/ui/PageHeader';

const TRACKING_LINKS = {
  BlueDart:  awb => `https://www.bluedart.com/tracking?trackFor=0&track=awb&trackNo=${awb}`,
  BLUEDART:  awb => `https://www.bluedart.com/tracking?trackFor=0&track=awb&trackNo=${awb}`,
  DTDC:      awb => `https://www.dtdc.in/tracking/tracking.asp?TrkType=awb&strCNNo=${awb}`,
  FedEx:     awb => `https://www.fedex.com/fedextrack/?trknbr=${awb}`,
  DHL:       awb => `https://www.dhl.com/en/express/tracking.html?AWB=${awb}`,
  Delhivery: awb => `https://www.delhivery.com/track/package/${awb}`,
  DELHIVERY: awb => `https://www.delhivery.com/track/package/${awb}`,
  'Ecom Express': awb => `https://ecomexpress.in/tracking/?awb_field=${awb}`,
  Trackon:   awb => `http://trackon.in/Trackon/pub/mainHtml.pub?awbs=${awb}`,
  TRACKON:   awb => `http://trackon.in/Trackon/pub/mainHtml.pub?awbs=${awb}`,
  Primetrack: awb => `http://trackon.in/Trackon/pub/mainHtml.pub?awbs=${awb}`,
  PRIMETRACK: awb => `http://trackon.in/Trackon/pub/mainHtml.pub?awbs=${awb}`,
};

const fmt = n => `₹${Number(n||0).toLocaleString('en-IN')}`;

export default function TrackPage({ toast }) {
  const [awbQuery,   setAwbQuery]   = useState('');
  const [clientFilter, setClient]  = useState('');
  const [statusFilter, setStatus]  = useState('');
  const [shipments,  setShipments] = useState([]);
  const [loading,    setLoading]   = useState(false);
  const autoLoad = true;

  const { data: clients } = useFetch('/clients');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 200 });
      if (awbQuery.trim())  params.set('q', awbQuery.trim());
      if (clientFilter)     params.set('client', clientFilter);
      if (statusFilter)     params.set('status', statusFilter);
      const res = await api.get(`/shipments?${params}`);
      setShipments(res.data || []);
    } catch (err) { toast?.(err.message, 'error'); }
    finally { setLoading(false); }
  };

  // Load all on mount and when filters change
  useEffect(() => { if (autoLoad) load(); }, [clientFilter, statusFilter, autoLoad]);

  const handleSearch = () => load();

  const clearFilters = () => {
    setAwbQuery(''); setClient(''); setStatus('');
    setTimeout(load, 50);
  };

  const hasFilters = awbQuery || clientFilter || statusFilter;

  return (
    <div className="p-6">
      <PageHeader
        title="Track Shipments"
        subtitle="Search by AWB, consignee, or client and jump directly into courier tracking links."
        icon={Package}
        actions={(
          <div className="flex items-center gap-2">
            {loading && <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />}
            <span className="badge badge-blue">{shipments.length} results</span>
          </div>
        )}
      />

      {/* Filters */}
      <div className="card-compact mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* AWB / Consignee search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="AWB number, consignee name…"
              value={awbQuery}
              onChange={e => setAwbQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          {/* Client filter */}
          <select className="input" value={clientFilter} onChange={e => setClient(e.target.value)}>
            <option value="">All Clients</option>
            {(clients||[]).map(c => (
              <option key={c.code} value={c.code}>{c.code} — {c.company}</option>
            ))}
          </select>
          {/* Status filter */}
          <select className="input" value={statusFilter} onChange={e => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {['Booked','InTransit','OutForDelivery','Delivered','Delayed','RTO','Cancelled'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={handleSearch} className="btn-primary btn-sm gap-1.5">
            <Search className="w-3.5 h-3.5" /> Search
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-secondary btn-sm gap-1.5">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading shipments…</p>
        </div>
      ) : shipments.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-gray-500">No shipments found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="table-shell">
          <table className="tbl w-full text-left border-collapse">
            <thead className="table-head border-b border-slate-200 bg-slate-50/50">
              <tr>
                <th className="py-3 px-4 font-black uppercase tracking-widest text-[10px] text-slate-400">Shipment Details</th>
                <th className="py-3 px-4 font-black uppercase tracking-widest text-[10px] text-slate-400">Destination</th>
                <th className="py-3 px-4 font-black uppercase tracking-widest text-[10px] text-slate-400">Timeline</th>
                <th className="py-3 px-4 font-black uppercase tracking-widest text-[10px] text-slate-400 text-center">TAT</th>
                <th className="py-3 px-4 font-black uppercase tracking-widest text-[10px] text-slate-400">Status</th>
                <th className="py-3 px-4 font-black uppercase tracking-widest text-[10px] text-slate-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {shipments.map(s => {
                const link = `/track/${s.awb}`;
                const isDelivered = s.status === 'Delivered' || s.status === 'RTO';
                const deliverDate = s.updatedAt ? new Date(s.updatedAt).toISOString().split('T')[0] : null;
                const bookStr = s.date;
                const delStr = isDelivered && deliverDate ? deliverDate : 'Pending';
                
                let tat = 'Pending';
                if (isDelivered && deliverDate && bookStr) {
                  const diff = Math.floor((new Date(deliverDate) - new Date(bookStr)) / (1000 * 60 * 60 * 24));
                  tat = diff <= 0 ? 'Same Day' : `${diff} days`;
                }

                return (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-4 align-top">
                      <div className="flex flex-col gap-1.5">
                         <div className="flex items-center gap-2">
                           <span className="font-mono font-black text-[13px] text-navy-800 tracking-tight">{s.awb}</span>
                           <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border ${
                             s.courier?.toUpperCase() === 'TRACKON' ? 'bg-green-50 text-green-700 border-green-200' :
                             s.courier?.toUpperCase() === 'PRIMETRACK' ? 'bg-red-50 text-red-700 border-red-200' :
                             s.courier?.toUpperCase() === 'DTDC' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                             s.courier?.toUpperCase() === 'DELHIVERY' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                             'bg-slate-100 text-slate-500 border-slate-200'
                           }`}>{s.courier}</span>
                         </div>
                         <div className="text-[11px] text-slate-500 font-semibold truncate max-w-[220px]">Ref: {s.clientCode} • {s.consignee}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top">
                       <div className="flex items-start gap-1.5 text-navy-700 font-bold text-[13px] mt-0.5">
                         <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                         <span className="truncate max-w-[150px]">{s.destination || '—'}</span>
                       </div>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-center gap-3 text-[11px] font-semibold mt-0.5">
                         <div className="flex flex-col gap-1">
                           <span className="text-[9px] uppercase tracking-widest text-slate-400 leading-none">Booked</span>
                           <span className="text-slate-600 flex items-center gap-1 leading-none"><Calendar className="w-3 h-3 text-slate-400"/> {bookStr}</span>
                         </div>
                         <ArrowRight className="w-3.5 h-3.5 text-slate-300 mt-2" />
                         <div className="flex flex-col gap-1">
                           <span className="text-[9px] uppercase tracking-widest text-slate-400 leading-none">Delivered</span>
                           <span className={`flex items-center gap-1 leading-none ${isDelivered ? 'text-emerald-700' : 'text-slate-400'}`}>
                             <Calendar className="w-3 h-3 opacity-70"/> {delStr}
                           </span>
                         </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top text-center">
                       <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-black uppercase tracking-wider mt-0.5 ${tat === 'Pending' ? 'bg-slate-50 text-slate-400 border-slate-200/50' : 'bg-orange-50 text-orange-700 border-orange-100/60'}`}>
                         <Clock className="w-3 h-3" />
                         {tat}
                       </div>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <div className="mt-0.5">
                        <StatusBadge status={s.status} />
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top text-right">
                        <a href={link} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-sky-200 bg-sky-50 shadow-[0_2px_8px_rgba(14,165,233,0.08)] hover:shadow-[0_4px_12px_rgba(14,165,233,0.15)] hover:bg-sky-100 text-sky-700 text-xs font-bold transition-all hover:-translate-y-0.5 mt-0.5">
                          Track Live <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
