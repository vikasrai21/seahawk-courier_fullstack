import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { LayoutDashboard, RefreshCw, PlusCircle, FileUp, ScanLine, Receipt, Calendar, Calculator, Zap, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { SkeletonCard } from '../components/ui/Loading';
import { Skeleton } from '../components/ui/Skeleton';
import DashboardStats from '../components/dashboard/DashboardStats';
import DashboardAlerts from '../components/dashboard/DashboardAlerts';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import DashboardRecentShipments from '../components/dashboard/DashboardRecentShipments';
import SmartRevenueTable from '../components/dashboard/SmartRevenueTable';

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
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

function isLikelyMobileBrowser() {
  if (typeof window === 'undefined') return false;
  const ua = String(navigator.userAgent || '').toLowerCase();
  const mobileUA = /android|iphone|ipod|iemobile|blackberry|opera mini|mobile/.test(ua);
  return mobileUA;
}

function Filters({ range, onRangeChange, customFrom, customTo, onCustomFromChange, onCustomToChange }) {
  return (
    <div className="card-compact animate-in">
      <div className="flex flex-wrap items-center gap-3">
        <div className="section-eyebrow">Date Range</div>
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => onRangeChange(option.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition pressable ${range === option.key ? 'bg-slate-900 text-white shadow-[0_10px_20px_rgba(15,23,42,0.14)]' : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {range === 'custom' && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <input type="date" value={customFrom} onChange={(e) => onCustomFromChange(e.target.value)} className="input !w-auto !px-3 !py-2 text-sm" />
            <input type="date" value={customTo} onChange={(e) => onCustomToChange(e.target.value)} className="input !w-auto !px-3 !py-2 text-sm" />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Smart Command Bar ─────────────────────────────────────────────────────
const COMMANDS = [
  { to: '/app/entry', label: 'New Shipment', icon: PlusCircle, desc: 'Create a new shipment entry', accent: true },
  { to: '/app/import', label: 'Import CSV', icon: FileUp, desc: 'Bulk import shipments' },
  { to: '/app/scan', label: 'Scan AWB', icon: ScanLine, desc: 'Scan barcode to find shipment' },
  { to: '/app/rates', label: 'Rate Calculator', icon: Calculator, desc: 'Compare courier rates & profit' },
  { to: '/app/invoices', label: 'Invoices', icon: Receipt, desc: 'Manage client invoices' },
  { to: '/app/pickups', label: 'Pickups', icon: Calendar, desc: 'Schedule courier pickups' },
];

function SmartCommandBar({ user }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-amber-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Quick Actions</span>
        </div>
        <span className="text-[10px] text-slate-400">Signed in as <strong className="text-slate-600 dark:text-slate-300">{user?.name || 'Team'}</strong></span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {COMMANDS.map((cmd) => (
          <Link
            key={cmd.to}
            to={cmd.to}
            className={`group flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${
              cmd.accent
                ? 'border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 hover:border-orange-300 dark:from-orange-900/20 dark:border-orange-800/50'
                : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white dark:border-slate-800 dark:bg-slate-800/30 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className={`rounded-xl p-2.5 transition-colors ${
              cmd.accent ? 'bg-orange-500/10 text-orange-600' : 'bg-slate-200/50 text-slate-500 group-hover:text-slate-700 dark:bg-slate-700/50 dark:text-slate-400'
            }`}>
              <cmd.icon size={18} strokeWidth={2.5} />
            </div>
            <span className={`text-xs font-bold ${cmd.accent ? 'text-orange-700 dark:text-orange-300' : 'text-slate-600 dark:text-slate-300'}`}>{cmd.label}</span>
            <span className="text-[9px] text-slate-400 text-center leading-tight hidden sm:block">{cmd.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isAdmin, hasRole } = useAuth();
  const navigate = useNavigate();
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
  const [opsData, setOpsData] = useState(null);
  const [smartRevenue, setSmartRevenue] = useState(null);
  const [, setTick] = useState(Date.now());


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
        // Fetch ops dashboard for intelligence data
        api.get('/ops/dashboard'),
        // Smart revenue intelligence
        api.get(`/analytics/smart-revenue?dateFrom=${currentRange.dateFrom}&dateTo=${currentRange.dateTo}`),
      ];
      if (canSeeOps) requests.push(api.get('/ops/rto-alerts'));

      const results = await Promise.allSettled(requests);
      if (results[0]?.status === 'fulfilled') setOverview(results[0].value?.data || results[0].value);
      if (results[1]?.status === 'fulfilled') setPreviousOverview(results[1].value?.data || results[1].value);
      if (results[2]?.status === 'fulfilled') setCouriers(results[2].value?.data || results[2].value);
      if (results[3]?.status === 'fulfilled') setActions(results[3].value?.data || results[3].value);
      if (results[4]?.status === 'fulfilled') setActivity(results[4].value?.data || results[4].value || []);
      if (results[5]?.status === 'fulfilled') setShipments(results[5].value?.data?.shipments || results[5].value?.shipments || []);
      if (results[6]?.status === 'fulfilled') setOpsData(results[6].value?.data || results[6].value);
      if (results[7]?.status === 'fulfilled') setSmartRevenue(results[7].value?.data || results[7].value);
      if (results[8]?.status === 'fulfilled') setRtoAlerts(results[8].value?.data?.alerts || results[8].value?.alerts || []);
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

  // Use ops recent shipments if available (they have client names)
  const displayShipments = opsData?.recentShipments?.length ? opsData.recentShipments : shipments;

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="app-shell min-h-screen p-6 transition-colors duration-300">
        <div className="mx-auto max-w-7xl space-y-5">
          <PageHeader
            title="Command Center"
            subtitle="Real-time business intelligence, performance analytics, and operational insights."
            icon={LayoutDashboard}
            actions={
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-600">LIVE</span>
                </div>
                <span className="badge badge-gray !px-3 !py-1.5 !rounded-full">
                  {secondsAgo(lastUpdated)}
                </span>
                <button 
                  onClick={load} 
                  className="btn-primary pressable"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync
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
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
              <div className="grid gap-5 xl:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-3xl" />)}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <DashboardStats overview={overview} previousOverview={previousOverview} dateLabel={currentRange.label} opsData={opsData} smartRevenue={smartRevenue} />
              <SmartRevenueTable dateFrom={currentRange.dateFrom} dateTo={currentRange.dateTo} />
              <DashboardCharts overview={overview} courierAnalytics={couriers} rangeLabel={currentRange.label} opsData={opsData} smartRevenue={smartRevenue} />
              <DashboardRecentShipments shipments={displayShipments} activity={activity} />
            </div>
          )}

          <SmartCommandBar user={user} />
        </div>
      </div>
    </>
  );
}
