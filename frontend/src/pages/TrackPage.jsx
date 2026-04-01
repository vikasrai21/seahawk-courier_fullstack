import { useState, useEffect } from 'react';
import { Search, ExternalLink, RefreshCw, Filter, X, Package } from 'lucide-react';
import api from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useFetch } from '../hooks/useFetch';
import { PageHeader } from '../components/ui/PageHeader';

const TRACKING_LINKS = {
  BlueDart:  awb => `https://www.bluedart.com/tracking?trackFor=0&track=awb&trackNo=${awb}`,
  DTDC:      awb => `https://www.dtdc.in/tracking/tracking.asp?TrkType=awb&strCNNo=${awb}`,
  FedEx:     awb => `https://www.fedex.com/fedextrack/?trknbr=${awb}`,
  DHL:       awb => `https://www.dhl.com/en/express/tracking.html?AWB=${awb}`,
  Delhivery: awb => `https://www.delhivery.com/track/package/${awb}`,
  'Ecom Express': awb => `https://ecomexpress.in/tracking/?awb_field=${awb}`,
};

const fmt = n => `₹${Number(n||0).toLocaleString('en-IN')}`;

export default function TrackPage({ toast }) {
  const [awbQuery,   setAwbQuery]   = useState('');
  const [clientFilter, setClient]  = useState('');
  const [statusFilter, setStatus]  = useState('');
  const [shipments,  setShipments] = useState([]);
  const [loading,    setLoading]   = useState(false);
  const [autoLoad,   setAutoLoad]  = useState(true);

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
          <table className="tbl">
            <thead className="table-head">
              <tr>
                <th>AWB</th>
                <th>Date</th>
                <th>Client</th>
                <th>Consignee</th>
                <th>Destination</th>
                <th>Courier</th>
                <th>Weight</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Track</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map(s => {
                const link = s.courier && TRACKING_LINKS[s.courier] ? TRACKING_LINKS[s.courier](s.awb) : null;
                return (
                  <tr key={s.id} className="table-row">
                    <td className="font-mono font-bold text-xs text-navy-600">{s.awb}</td>
                    <td className="text-xs text-gray-500">{s.date}</td>
                    <td className="text-xs font-semibold">{s.clientCode}</td>
                    <td className="text-xs max-w-[120px] truncate">{s.consignee}</td>
                    <td className="text-xs text-gray-500">{s.destination}</td>
                    <td className="text-xs">{s.courier}</td>
                    <td className="text-xs text-right">{s.weight} kg</td>
                    <td className="text-xs text-right font-medium">{fmt(s.amount)}</td>
                    <td><StatusBadge status={s.status} /></td>
                    <td>
                      {link ? (
                        <a href={link} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold transition-colors">
                          <ExternalLink className="w-3 h-3" /> Track
                        </a>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
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
