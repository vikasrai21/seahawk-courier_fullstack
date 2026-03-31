import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { LayoutDashboard, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { SkeletonCard, EmptyState } from '../components/ui/Loading';
import { Skeleton } from '../components/ui/Skeleton';
import DashboardStats from '../components/dashboard/DashboardStats';
import DashboardAlerts from '../components/dashboard/DashboardAlerts';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import DashboardRecentShipments from '../components/dashboard/DashboardRecentShipments';

const RANGE_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: 'this_month', label: 'This Month' },
  { key: 'custom', label: 'Custom' },
];

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

function getRange(range, customFrom, customTo) {
  const end = new Date();
  const start = new Date();

  if (range === 'today') {
    return { dateFrom: toDateString(start), dateTo: toDateString(end), label: 'today' };
  }
  if (range === '7d') {
    start.setDate(start.getDate() - 6);
    return { dateFrom: toDateString(start), dateTo: toDateString(end), label: 'last 7 days' };
  }
  if (range === 'this_month') {
    start.setDate(1);
    return { dateFrom: toDateString(start), dateTo: toDateString(end), label: 'this month' };
  }
  if (range === 'custom' && customFrom && customTo) {
    return { dateFrom: customFrom, dateTo: customTo, label: `${customFrom} to ${customTo}` };
  }
  start.setDate(start.getDate() - 29);
  return { dateFrom: toDateString(start), dateTo: toDateString(end), label: 'last 30 days' };
}

function getPreviousRange(range, customFrom, customTo) {
  const current = getRange(range, customFrom, customTo);
  const start = new Date(current.dateFrom);
  const end = new Date(current.dateTo);
  const days = Math.max(1, Math.round((end - start) / 86400000) + 1);
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (days - 1));
  return { dateFrom: toDateString(prevStart), dateTo: toDateString(prevEnd) };
}

function secondsAgo(date) {
  if (!date) return '';
  const secs = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  return `${secs}s ago`;
}

function Filters({ range, onRangeChange, customFrom, customTo, onCustomFromChange, onCustomToChange }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Date Range</div>
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => onRangeChange(option.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${range === option.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {range === 'custom' && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <input type="date" value={customFrom} onChange={(e) => onCustomFromChange(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <input type="date" value={customTo} onChange={(e) => onCustomToChange(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isAdmin, hasRole } = useAuth();
  const { socket } = useSocket();
  const [range, setRange] = useState('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [previousOverview, setPreviousOverview] = useState(null);
  const [couriers, setCouriers] = useState(null);
  const [actions, setActions] = useState(null);
  const [rtoAlerts, setRtoAlerts] = useState([]);
  const [activity, setActivity] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [tick, setTick] = useState(Date.now());

  const currentRange = useMemo(() => getRange(range, customFrom, customTo), [range, customFrom, customTo]);
  const previousRange = useMemo(() => getPreviousRange(range, customFrom, customTo), [range, customFrom, customTo]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const canSeeOps = isAdmin || hasRole('OPS_MANAGER');
      const requests = [
        api.get(`/analytics/overview?dateFrom=${currentRange.dateFrom}&dateTo=${currentRange.dateTo}`),
        api.get(`/analytics/overview?dateFrom=${previousRange.dateFrom}&dateTo=${previousRange.dateTo}`),
        api.get(`/analytics/couriers?dateFrom=${currentRange.dateFrom}&dateTo=${currentRange.dateTo}`),
        api.get('/ops/pending-actions'),
        api.get('/ops/recent-activity?limit=8'),
        api.get(`/shipments?limit=8&dateFrom=${currentRange.dateFrom}&dateTo=${currentRange.dateTo}`),
      ];
      if (canSeeOps) requests.push(api.get('/ops/rto-alerts'));

      const results = await Promise.allSettled(requests);
      if (results[0]?.status === 'fulfilled') setOverview(results[0].value?.data || results[0].value);
      if (results[1]?.status === 'fulfilled') setPreviousOverview(results[1].value?.data || results[1].value);
      if (results[2]?.status === 'fulfilled') setCouriers(results[2].value?.data || results[2].value);
      if (results[3]?.status === 'fulfilled') setActions(results[3].value?.data || results[3].value);
      if (results[4]?.status === 'fulfilled') setActivity(results[4].value?.data || results[4].value || []);
      if (results[5]?.status === 'fulfilled') setShipments(results[5].value?.data?.shipments || results[5].value?.shipments || []);
      if (results[6]?.status === 'fulfilled') setRtoAlerts(results[6].value?.data?.alerts || results[6].value?.alerts || []);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, [currentRange.dateFrom, currentRange.dateTo, previousRange.dateFrom, previousRange.dateTo, isAdmin, hasRole]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => {
      setTick(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      load();
    }, 60000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!socket) return undefined;
    const refresh = () => load();
    socket.on('shipment:created', refresh);
    socket.on('shipment:status-updated', refresh);
    return () => {
      socket.off('shipment:created', refresh);
      socket.off('shipment:status-updated', refresh);
    };
  }, [socket, load]);

  const totalShipments = Number(overview?.kpis?.totalShipments || 0);

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fff7ed,_transparent_35%),linear-gradient(180deg,_#f8fafc,_#eef2ff)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.1),_transparent_35%),linear-gradient(180deg,_#0f172a,_#0f172a)] p-6 transition-colors duration-300">
        <div className="mx-auto max-w-7xl space-y-5">
          <PageHeader
            title="Shipment Performance"
            subtitle="Live counters, trend comparisons, and courier performance at a glance."
            icon={LayoutDashboard}
            actions={
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  Last updated {secondsAgo(lastUpdated)}
                </span>
                <button 
                  onClick={load} 
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-orange-500 px-4 py-2 text-sm font-bold text-white transition-transform active:scale-95 shadow-lg shadow-orange-500/10"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>
            }
          />

          <Filters
            range={range}
            onRangeChange={setRange}
            customFrom={customFrom}
            customTo={customTo}
            onCustomFromChange={setCustomFrom}
            onCustomToChange={setCustomTo}
          />

          <DashboardAlerts actions={actions} rtoAlerts={rtoAlerts} />

          {loading ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
              <div className="grid gap-5 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-3xl" />)}
              </div>
              <div className="grid gap-5 xl:grid-cols-2">
                <Skeleton className="h-72 rounded-3xl" />
                <Skeleton className="h-72 rounded-3xl" />
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <DashboardStats overview={overview} previousOverview={previousOverview} dateLabel={currentRange.label} />
              <DashboardCharts overview={overview} courierAnalytics={couriers} rangeLabel={currentRange.label} />
              <DashboardRecentShipments shipments={shipments} activity={activity} />
            </div>
          )}

          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Quick actions</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/app/entry" className="rounded-full bg-orange-500 hover:bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors">New Entry</Link>
              <Link to="/app/import" className="rounded-full bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Import Shipments</Link>
              <Link to="/app/scan" className="rounded-full bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Scan AWB</Link>
              <Link to="/app/invoices" className="rounded-full bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Invoices</Link>
              <Link to="/app/pickups" className="rounded-full bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Pickups</Link>
            </div>
            <p className="mt-4 text-xs text-slate-400">Signed in as {user?.name || 'Team member'}.</p>
          </div>
        </div>
      </div>
    </>
  );
}
