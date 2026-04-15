import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { FetchErrorState } from '../../components/ui/FetchErrorState';
import TimelineModal from '../../components/shipments/TimelineModal';
import PortalHeroSection from './components/PortalHeroSection';
import PortalKPIGrid from './components/PortalKPIGrid';
import PortalAttentionPanel from './components/PortalAttentionPanel';
import PortalInsightsSection from './components/PortalInsightsSection';
import PortalShipmentTable from './components/PortalShipmentTable';

const formatRelativeTime = (value) => {
  if (!value) return 'just now';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'just now';
  const diffMs = Math.max(0, Date.now() - date.getTime());
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function ClientPortalPage({ toast }) {
  const { socket } = useSocket();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [intel, setIntel] = useState(null);
  const [range, setRange] = useState('30d');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [fetchErrors, setFetchErrors] = useState({
    portal: null,
    intelligence: null,
  });

  const fetchPortalData = async () => {
    setLoading(true);
    setFetchErrors((prev) => ({ ...prev, portal: null }));

    try {
      const query = new URLSearchParams();
      query.set('range', range);
      if (range === 'custom' && dateFrom && dateTo) {
        query.set('date_from', dateFrom);
        query.set('date_to', dateTo);
      }

      const statQuery = query.toString();
      const shipmentQuery = new URLSearchParams(query);
      shipmentQuery.set('limit', '8');

      const [statsResponse, shipmentsResponse] = await Promise.all([
        api.get(`/portal/stats?${statQuery}`),
        api.get(`/portal/shipments?${shipmentQuery.toString()}`),
      ]);

      setStats(statsResponse.data || {});
      setShipments(shipmentsResponse.data?.shipments || []);
    } catch (error) {
      setFetchErrors((prev) => ({ ...prev, portal: error }));
    } finally {
      setLoading(false);
    }
  };

  const fetchIntelligence = async () => {
    setFetchErrors((prev) => ({ ...prev, intelligence: null }));

    try {
      const query = new URLSearchParams();
      query.set('range', range);
      query.set('limit', '12');
      if (range === 'custom' && dateFrom && dateTo) {
        query.set('date_from', dateFrom);
        query.set('date_to', dateTo);
      }
      const response = await api.get(`/portal/intelligence?${query.toString()}`);
      setIntel(response.data || null);
    } catch (error) {
      setFetchErrors((prev) => ({ ...prev, intelligence: error }));
    }
  };

  const syncLiveStatuses = async () => {
    try {
      const payload = { range, limit: 30 };
      if (range === 'custom' && dateFrom && dateTo) {
        payload.date_from = dateFrom;
        payload.date_to = dateTo;
      }

      const response = await api.post('/portal/sync-tracking', payload);
      toast?.(response.message || 'Live status sync complete', 'success');
      setLastSyncAt(new Date());
      await fetchPortalData();
      await fetchIntelligence();
    } catch (error) {
      toast?.(error.message || 'Live status sync failed', 'error');
    }
  };

  useEffect(() => {
    fetchPortalData();
    fetchIntelligence();
  }, [range, dateFrom, dateTo]);

  useEffect(() => {
    if (!socket) return undefined;

    const refresh = () => {
      fetchPortalData();
      fetchIntelligence();
    };

    socket.on('shipment:created', refresh);
    socket.on('shipment:status-updated', refresh);

    return () => {
      socket.off('shipment:created', refresh);
      socket.off('shipment:status-updated', refresh);
    };
  }, [socket, range, dateFrom, dateTo]);

  const trendData = useMemo(
    () =>
      (stats?.trend || []).map((row) => ({
        ...row,
        day: String(row.date).slice(5),
      })),
    [stats]
  );

  const movementInsights = useMemo(() => {
    if (!trendData.length) return { wowPct: 0 };
    const values = trendData.map((row) => Number(row.shipments || 0));
    const thisWeek = values.slice(-7).reduce((sum, value) => sum + value, 0);
    const lastWeek = values.slice(-14, -7).reduce((sum, value) => sum + value, 0);
    const wowPct = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : (thisWeek > 0 ? 100 : 0);
    return { wowPct };
  }, [trendData]);

  const totals = stats?.totals || {};
  const attentionCount = Number(totals.ndr || 0) + Number(totals.rto || 0);
  const sparklineValues = trendData.slice(-12).map((row) => Number(row.shipments || 0));

  const trustSignals = [
    '99.9% uptime',
    `Last sync: ${formatRelativeTime(lastSyncAt)}`,
    'All couriers operational',
  ];

  const courierCounts = useMemo(
    () =>
      shipments.reduce((acc, shipment) => {
        const key = shipment?.courier || 'Unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    [shipments]
  );

  const bestCourier = Object.entries(courierCounts).sort((left, right) => right[1] - left[1])[0]?.[0] || 'No courier data yet';
  const peakTrend = trendData.reduce((peak, current) => {
    if (!peak || Number(current.shipments || 0) > Number(peak.shipments || 0)) return current;
    return peak;
  }, null);

  const kpiCards = [
    {
      title: 'Total Shipments',
      value: Number(totals.total || 0),
      sub: 'In selected date range',
      tone: 'text-cyan-600 dark:text-cyan-300',
      trend: movementInsights.wowPct,
    },
    {
      title: 'In Transit',
      value: Number(totals.inTransit || 0),
      sub: 'Currently moving in network',
      tone: 'text-blue-600 dark:text-blue-300',
      trend: Math.round((Number(totals.inTransit || 0) / Math.max(1, Number(totals.total || 1))) * 100),
    },
    {
      title: 'Delivery Success',
      value: `${Number(totals.deliveredPct || 0)}%`,
      sub: 'Delivered shipments ratio',
      tone: 'text-emerald-600 dark:text-emerald-300',
      trend: Number(totals.deliveredPct || 0) - 85,
    },
    {
      title: 'Needs Attention',
      value: attentionCount,
      sub: 'NDR + RTO requiring action',
      tone: 'text-rose-600 dark:text-rose-300',
      trend: -attentionCount,
    },
  ];

  const attentionItems = useMemo(() => {
    if (attentionCount === 0 && Number(totals.inTransit || 0) === 0) {
      return [
        'All systems healthy. No action required right now.',
        'Zero issue clusters detected across the current shipment window.',
        'No live in-transit load yet. Import orders or raise pickups to begin movement.',
      ];
    }

    return [
      Number(totals.deliveredPct || 0) >= 85
        ? `Delivery performance is stable at ${Number(totals.deliveredPct || 0)}%.`
        : `Delivery performance is ${Number(totals.deliveredPct || 0)}% and needs monitoring.`,
      attentionCount > 0
        ? `${attentionCount} shipments need action now across NDR and RTO queues.`
        : 'No critical issue cluster detected in the current queue.',
      Number(totals.inTransit || 0) > 0
        ? `${Number(totals.inTransit || 0)} shipments are active in the network right now.`
        : 'No active in-transit movement detected yet.',
    ];
  }, [attentionCount, totals]);

  const quickActions = [
    { to: '/portal/shipments', label: 'Open Shipments', note: 'Full shipment workspace' },
    { to: '/portal/bulk-track', label: 'Bulk Track', note: 'Track multiple AWBs together' },
    { to: '/portal/map', label: 'Live Map', note: 'See active movement in real time' },
    { to: '/portal/pickups', label: 'Raise Pickup', note: 'Create pickup requests fast' },
    { to: '/portal/ndr', label: 'Resolve NDR', note: 'Handle failed delivery attempts' },
    { to: '/portal/import', label: 'Import Orders', note: 'Upload orders in bulk' },
    { to: '/portal/support', label: 'Support Tickets', note: 'Raise and track issues' },
  ];

  const insightItems = [
    `Best performing courier in the current range: ${bestCourier}.`,
    `Peak load observed on ${peakTrend?.day || '—'} with ${peakTrend?.shipments || 0} shipments.`,
    Number(totals.inTransit || 0) > 0
      ? 'Active movement detected. Watch in-transit exceptions closely.'
      : 'Low activity detected. Consider importing new orders or raising pickups.',
    ...(intel?.items?.slice(0, 2).map((item) => item.summary || item.title || item.text).filter(Boolean) || []),
  ].slice(0, 5);

  return (
    <div className="client-premium-main space-y-5 portal-visual-upgrade">
      <PortalHeroSection
        lastSyncLabel={formatRelativeTime(lastSyncAt)}
        trustSignals={trustSignals}
        range={range}
        setRange={setRange}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        onSync={syncLiveStatuses}
      />

      {(fetchErrors.portal || fetchErrors.intelligence) && (
        <section className="grid gap-2">
          {fetchErrors.portal && <FetchErrorState compact title="Portal summary failed" error={fetchErrors.portal} onRetry={fetchPortalData} />}
          {fetchErrors.intelligence && <FetchErrorState compact title="Intelligence panel failed" error={fetchErrors.intelligence} onRetry={fetchIntelligence} />}
        </section>
      )}

      <PortalKPIGrid cards={kpiCards} sparklineValues={sparklineValues} />
      <PortalAttentionPanel items={attentionItems} />
      <PortalShipmentTable loading={loading} shipments={shipments} onSelectShipment={setSelectedShipment} />
      <PortalInsightsSection quickActions={quickActions} insightItems={insightItems} />

      {selectedShipment && <TimelineModal shipment={selectedShipment} onClose={() => setSelectedShipment(null)} />}

      <style>{`
        .portal-hero-glow {
          position: absolute;
          right: -80px;
          top: -90px;
          width: 260px;
          height: 260px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(34,211,238,0.24), rgba(34,211,238,0));
          pointer-events: none;
        }
        .portal-visual-upgrade .client-premium-card {
          box-shadow: 0 20px 36px -26px rgba(2, 6, 23, 0.75);
        }
        .shipment-row {
          transition: background-color 0.18s ease, transform 0.16s ease;
        }
        .shipment-row:hover {
          transform: translateY(-1px);
        }
        .status-glow-wrap span {
          box-shadow: 0 0 12px rgba(56,189,248,0.28);
        }
      `}</style>
    </div>
  );
}
