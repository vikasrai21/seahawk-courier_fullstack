import { Fragment, useState, useEffect } from 'react';
import { Search, ExternalLink, RefreshCw, X, Package, MapPin, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useFetch } from '../hooks/useFetch';
import { PageHeader } from '../components/ui/PageHeader';

const TRACKING_LINKS = {
  BlueDart: awb => `https://www.bluedart.com/tracking?trackFor=0&track=awb&trackNo=${awb}`,
  BLUEDART: awb => `https://www.bluedart.com/tracking?trackFor=0&track=awb&trackNo=${awb}`,
  DTDC: awb => `https://www.dtdc.in/tracking/tracking.asp?TrkType=awb&strCNNo=${awb}`,
  FedEx: awb => `https://www.fedex.com/fedextrack/?trknbr=${awb}`,
  DHL: awb => `https://www.dhl.com/en/express/tracking.html?AWB=${awb}`,
  Delhivery: awb => `https://www.delhivery.com/track/package/${awb}`,
  DELHIVERY: awb => `https://www.delhivery.com/track/package/${awb}`,
  'Ecom Express': awb => `https://ecomexpress.in/tracking/?awb_field=${awb}`,
  Trackon: awb => `http://trackon.in/Trackon/pub/mainHtml.pub?awbs=${awb}`,
  TRACKON: awb => `http://trackon.in/Trackon/pub/mainHtml.pub?awbs=${awb}`,
  Primetrack: awb => `http://trackon.in/Trackon/pub/mainHtml.pub?awbs=${awb}`,
  PRIMETRACK: awb => `http://trackon.in/Trackon/pub/mainHtml.pub?awbs=${awb}`,
};

const STATUS_OPTIONS = ['Booked', 'InTransit', 'OutForDelivery', 'Delivered', 'Delayed', 'RTO', 'Cancelled'];
const TERMINAL_STATUSES = new Set(['Delivered', 'RTO', 'Cancelled']);

const pick = (obj, ...keys) => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return '';
};

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const formatDate = value => {
  const d = parseDate(value);
  return d ? d.toLocaleDateString('en-IN') : '—';
};

const formatDateTime = value => {
  const d = parseDate(value);
  return d ? d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
};

const daysBetween = (from, to) => {
  const a = parseDate(from);
  const b = parseDate(to);
  if (!a || !b) return null;
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

const addDays = (dateValue, days) => {
  const base = parseDate(dateValue);
  if (!base) return null;
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};

const getSlaDays = (shipment) => {
  const service = String(shipment?.service || '').toLowerCase();
  const courier = String(shipment?.courier || '').toLowerCase();

  if (service.includes('air') || service.includes('express') || service.includes('priority')) return 2;
  if (service.includes('surface') || service.includes('cargo')) return 5;
  if (courier.includes('bluedart')) return 2;
  if (courier.includes('dtdc') || courier.includes('delhivery')) return 3;
  if (courier.includes('trackon') || courier.includes('primetrack')) return 4;
  return 4;
};

const getEtaMeta = (shipment, deliveredAt) => {
  const bookedAt = parseDate(shipment?.date);
  if (!bookedAt) {
    return { etaText: '—', badge: 'Unknown', tone: 'bg-slate-100 text-slate-500 border-slate-200' };
  }
  const etaDate = addDays(bookedAt, getSlaDays(shipment));
  if (!etaDate) {
    return { etaText: '—', badge: 'Unknown', tone: 'bg-slate-100 text-slate-500 border-slate-200' };
  }

  if (deliveredAt) {
    const deliveredDate = parseDate(deliveredAt);
    const delayed = deliveredDate ? deliveredDate.getTime() > etaDate.getTime() : false;
    return {
      etaText: formatDate(etaDate),
      badge: delayed ? 'Delayed' : 'On Time',
      tone: delayed
        ? 'bg-rose-50 text-rose-700 border-rose-200'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }

  const now = new Date();
  const daysToEta = daysBetween(now, etaDate);
  if (daysToEta != null && daysToEta < 0) {
    return {
      etaText: formatDate(etaDate),
      badge: 'Delayed',
      tone: 'bg-rose-50 text-rose-700 border-rose-200',
    };
  }
  if (daysToEta != null && daysToEta <= 1) {
    return {
      etaText: formatDate(etaDate),
      badge: 'At Risk',
      tone: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }
  return {
    etaText: formatDate(etaDate),
    badge: 'On Track',
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
};

const getAgingBucket = (shipment) => {
  if (TERMINAL_STATUSES.has(String(shipment?.status || ''))) {
    return { label: 'Closed', tone: 'bg-slate-100 text-slate-500 border-slate-200' };
  }
  const daysOpen = daysBetween(shipment?.date, new Date());
  if (daysOpen == null) return { label: '—', tone: 'bg-slate-100 text-slate-500 border-slate-200' };
  if (daysOpen <= 2) return { label: '0-2d', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (daysOpen <= 5) return { label: '3-5d', tone: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: '6d+', tone: 'bg-rose-50 text-rose-700 border-rose-200' };
};

const getEventLocation = (event, fallback = '—') => {
  if (!event) return fallback;
  return (
    event.location ||
    pick(event.rawData, 'hubOrBranch', 'CURRENT_CITY', 'strOrigin', 'strDestination') ||
    fallback
  );
};

export default function TrackPage({ toast }) {
  const [awbQuery, setAwbQuery] = useState('');
  const [clientFilter, setClient] = useState('');
  const [statusFilter, setStatus] = useState('');
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedAwb, setExpandedAwb] = useState(null);
  const autoLoad = true;

  const { data: clients } = useFetch('/clients');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 200 });
      if (awbQuery.trim()) params.set('q', awbQuery.trim());
      if (clientFilter) params.set('client', clientFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/shipments?${params}`);
      setShipments(res.data || []);
      if (expandedAwb && !(res.data || []).some(s => s.awb === expandedAwb)) setExpandedAwb(null);
    } catch (err) {
      toast?.(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad) load();
  }, [clientFilter, statusFilter, autoLoad]);

  const handleSearch = () => load();

  const clearFilters = () => {
    setAwbQuery('');
    setClient('');
    setStatus('');
    setExpandedAwb(null);
    setTimeout(load, 50);
  };

  const hasFilters = awbQuery || clientFilter || statusFilter;

  return (
    <div className="p-6">
      <PageHeader
        title="Track Shipments"
        subtitle="Operations view with last scan, ETA risk, NDR attempts, aging buckets, and inline timelines."
        icon={Package}
        actions={(
          <div className="flex items-center gap-2">
            {loading && <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />}
            <span className="badge badge-blue">{shipments.length} results</span>
          </div>
        )}
      />

      <div className="card-compact mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
          <select className="input" value={clientFilter} onChange={e => setClient(e.target.value)}>
            <option value="">All Clients</option>
            {(clients || []).map(c => (
              <option key={c.code} value={c.code}>{c.code} — {c.company}</option>
            ))}
          </select>
          <select className="input" value={statusFilter} onChange={e => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => (
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
                <th className="py-3 px-4 font-black uppercase tracking-widest text-[10px] text-slate-400">Shipment</th>
                <th className="py-3 px-4 font-black uppercase tracking-widest text-[10px] text-slate-400">Last Scan</th>
                <th className="py-3 px-4 font-black uppercase tracking-widest text-[10px] text-slate-400">ETA & Delay</th>
                <th className="py-3 px-4 font-black uppercase tracking-widest text-[10px] text-slate-400">Attempts / NDR</th>
                <th className="py-3 px-4 font-black uppercase tracking-widest text-[10px] text-slate-400">Aging</th>
                <th className="py-3 px-4 font-black uppercase tracking-widest text-[10px] text-slate-400">Status</th>
                <th className="py-3 px-4 font-black uppercase tracking-widest text-[10px] text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {shipments.map(s => {
                const internalLink = `/track/${s.awb}`;
                const carrierLink = TRACKING_LINKS[s.courier] || TRACKING_LINKS[String(s.courier || '').toUpperCase()] || null;
                const isTerminal = TERMINAL_STATUSES.has(String(s.status || ''));
                const latestEvent = s.trackingEvents?.[0] || null;
                const recentEvents = Array.isArray(s.trackingEvents) ? s.trackingEvents.slice(0, 3) : [];
                const lastScanAt = latestEvent?.timestamp || s.updatedAt;
                const lastScanLocation = getEventLocation(latestEvent, s.destination || '—');
                const etaMeta = getEtaMeta(s, isTerminal ? s.updatedAt : null);
                const aging = getAgingBucket(s);
                const latestNdr = s.ndrEvents?.[0] || null;
                const ndrCount = Number(s?._count?.ndrEvents || 0);
                const attemptCount = Number(latestNdr?.attemptNo || ndrCount || 0);
                const ndrReason = latestNdr?.reason || latestNdr?.description || (s.ndrStatus ? `Status: ${s.ndrStatus}` : '');
                const isExpanded = expandedAwb === s.awb;
                const courierLabel = String(s.courier || '').toUpperCase();

                return (
                  <Fragment key={s.id}>
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-4 align-top">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-[13px] text-navy-800 tracking-tight">{s.awb}</span>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border ${
                              courierLabel === 'TRACKON' ? 'bg-green-50 text-green-700 border-green-200' :
                              courierLabel === 'PRIMETRACK' ? 'bg-red-50 text-red-700 border-red-200' :
                              courierLabel === 'DTDC' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              courierLabel === 'DELHIVERY' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                              'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>{s.courier || '—'}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-semibold truncate max-w-[260px]">
                            Ref: {s.clientCode} • {s.consignee || 'Unknown consignee'}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[260px] flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-slate-400" /> {s.destination || '—'}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 align-top">
                        <div className="text-[12px] font-semibold text-slate-700 truncate max-w-[220px]">{lastScanLocation}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{formatDateTime(lastScanAt)}</div>
                      </td>

                      <td className="py-4 px-4 align-top">
                        <div className="text-[12px] font-semibold text-slate-700">ETA {etaMeta.etaText}</div>
                        <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-wider ${etaMeta.tone}`}>
                          {etaMeta.badge}
                        </span>
                      </td>

                      <td className="py-4 px-4 align-top">
                        <div className="text-[12px] font-semibold text-slate-700">{attemptCount} attempt{attemptCount === 1 ? '' : 's'}</div>
                        {ndrReason ? (
                          <div className="text-[10px] text-rose-600 mt-1 max-w-[220px] truncate">{ndrReason}</div>
                        ) : (
                          <div className="text-[10px] text-emerald-600 mt-1">No active NDR</div>
                        )}
                      </td>

                      <td className="py-4 px-4 align-top">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-black uppercase tracking-wider ${aging.tone}`}>
                          <Clock className="w-3 h-3" />
                          {aging.label}
                        </span>
                      </td>

                      <td className="py-4 px-4 align-top">
                        <StatusBadge status={s.status} />
                      </td>

                      <td className="py-4 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedAwb(isExpanded ? null : s.awb)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            Details
                          </button>
                          <a
                            href={internalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-200 bg-sky-50 text-sky-700 text-xs font-bold hover:bg-sky-100"
                          >
                            Full Track <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-slate-50/60">
                        <td colSpan={7} className="px-4 pb-4">
                          <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                                Recent Timeline (Latest 3 Events)
                              </p>
                              {carrierLink && (
                                <a
                                  href={carrierLink(s.awb)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-bold text-sky-700 hover:text-sky-800 inline-flex items-center gap-1"
                                >
                                  Carrier site <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>

                            {recentEvents.length === 0 ? (
                              <p className="text-sm text-slate-500">No tracking events available yet.</p>
                            ) : (
                              <div className="space-y-2">
                                {recentEvents.map((ev, idx) => {
                                  const eventCode = pick(ev.rawData, 'eventCode', 'TRACKING_CODE', 'strCode');
                                  const eventLocation = getEventLocation(ev, s.destination || '—');
                                  return (
                                    <div key={ev.id || `${s.id}-${idx}`} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="text-sm font-semibold text-slate-800">{ev.status || 'Status update'}</div>
                                        <div className="text-[11px] text-slate-500">{formatDateTime(ev.timestamp)}</div>
                                      </div>
                                      <div className="text-[12px] text-slate-600 mt-1">{eventLocation}</div>
                                      {ev.description && (
                                        <div className="text-[11px] text-slate-500 mt-1">{ev.description}</div>
                                      )}
                                      {eventCode && (
                                        <span className="inline-flex mt-2 px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600">
                                          Code {eventCode}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {latestNdr && (
                              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                                <div className="text-[10px] font-black uppercase tracking-widest text-amber-700">Latest NDR</div>
                                <div className="text-[12px] text-amber-900 mt-1">
                                  Attempt {latestNdr.attemptNo || 1} • {latestNdr.reason || latestNdr.description || 'Issue logged'}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
