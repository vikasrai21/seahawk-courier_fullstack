// AppLayout.jsx — Enhanced with global search, dark mode toggle
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, PlusCircle, FileUp, Package, Calendar,
  BarChart2, Users, Clock, Search, RefreshCw, ShieldAlert,
  LogOut, UserCircle, Menu, X, ChevronRight, FileText,
  Receipt, ScrollText, Calculator, Activity, Layers,
  CreditCard, GitCompare, Shield, Settings2, MessageCircle,
  Moon, Sun, Bell
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';

// ── Dark mode ────────────────────────────────────────────────────────────
function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem('darkMode') === 'true');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('darkMode', dark);
  }, [dark]);
  return { dark, toggle: () => setDark(d => !d) };
}

// ── Global Search ────────────────────────────────────────────────────────
function GlobalSearch({ onClose }) {
  const [q, setQ]           = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const search = useCallback(async (query) => {
    if (!query.trim() || query.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await api.get(`/shipments?q=${encodeURIComponent(query)}&limit=8`);
      setResults(res.data || res || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(q), 300);
    return () => clearTimeout(t);
  }, [q, search]);

  const go = (path) => { navigate(path); onClose(); };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && onClose()}
            placeholder="Search AWB, client, consignee…"
            className="flex-1 text-base outline-none placeholder-gray-400"
          />
          {loading && <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />}
          <kbd className="text-xs bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-gray-400">Esc</kbd>
        </div>

        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto">
            {results.map(s => (
              <button key={s.id} onClick={() => go(`/app/all?q=${s.awb}`)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center" style={{ background: '#eff6ff' }}>
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono font-bold text-sm text-gray-900">{s.awb}</div>
                  <div className="text-xs text-gray-500 truncate">{s.consignee} → {s.destination}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    s.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                    s.status === 'In Transit' ? 'bg-blue-100 text-blue-700' :
                    s.status === 'RTO' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                  }`}>{s.status}</span>
                  <span className="text-[10px] text-gray-400">{s.clientCode}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {q.length >= 2 && !loading && results.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">No shipments found for "{q}"</div>
        )}

        {q.length === 0 && (
          <div className="px-4 py-4">
            <p className="text-xs text-gray-400 mb-3 uppercase font-semibold tracking-wide">Quick navigate</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'New Entry', path: '/app/entry', icon: '➕', key: 'N' },
                { label: 'Import', path: '/app/import', icon: '📥', key: 'I' },
                { label: 'Daily Sheet', path: '/app/daily', icon: '📋', key: 'D' },
                { label: 'All Shipments', path: '/app/all', icon: '📦', key: 'A' },
              ].map(({ label, path, icon, key }) => (
                <button key={path} onClick={() => go(path)}
                  className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-gray-50 text-left text-sm text-gray-700 font-medium">
                  <span>{icon}</span>
                  <span className="flex-1">{label}</span>
                  <kbd className="text-[9px] bg-gray-100 border border-gray-200 rounded px-1 text-gray-400">{key}</kbd>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const navGroups = [
  {
    label: null,
    items: [
      { to: '/app/',        label: 'Dashboard',         icon: LayoutDashboard },
      { to: '/app/ops',     label: 'Operations',        icon: Activity, badge: 'OPS' },
      { to: '/app/analytics', label: 'Analytics',       icon: BarChart2, roles: ['ADMIN','OPS_MANAGER'] },
      { to: '/app/entry',   label: 'New Entry',         icon: PlusCircle, accent: true },
      { to: '/app/import',  label: 'Import',            icon: FileUp },
    ],
  },
  {
    label: 'Shipments',
    items: [
      { to: '/app/shipments', label: 'Shipment Dashboard', icon: Layers, badge: 'NEW' },
      { to: '/app/all',     label: 'All Shipments',     icon: Package },
      { to: '/app/pending', label: 'Pending',           icon: Clock },
      { to: '/app/track',   label: 'Track',             icon: Search },
      { to: '/app/ndr',     label: 'NDR Management',    icon: ShieldAlert },
      { to: '/app/pickups', label: 'Pickup Scheduler',  icon: Calendar },
      { to: '/app/daily',   label: 'Daily Sheet',       icon: Calendar },
      { to: '/app/monthly', label: 'Monthly Report',    icon: BarChart2 },
    ],
  },
  {
    label: 'Clients & Billing',
    items: [
      { to: '/app/clients',       label: 'Clients',        icon: Users },
      { to: '/app/contracts',     label: 'Contracts',      icon: ScrollText },
      { to: '/app/invoices',      label: 'Invoices',       icon: Receipt },
      { to: '/app/wallet',        label: 'Wallet',         icon: CreditCard, roles: ['ADMIN','OPS_MANAGER'] },
      { to: '/app/reconciliation', label: 'Reconciliation', icon: Shield },
    ],
  },
  {
    label: 'Rates & Quotes',
    items: [
      { to: '/app/rates',     label: 'Rate Calculator', icon: Calculator },
      { to: '/app/bulk',      label: 'Bulk Compare',    icon: GitCompare },
      { to: '/app/rate-card', label: 'Rate Card PDF',   icon: CreditCard },
      { to: '/app/quotes',    label: 'Quote History',   icon: FileText },
      { to: '/app/whatsapp',  label: 'WhatsApp Rates',  icon: MessageCircle, badge: 'NEW' },
    ],
  },
  {
    label: 'Data',
    items: [
      { to: '/app/sync', label: 'Export & Backup', icon: RefreshCw },
    ],
  },
];

const adminItems = [
  { to: '/app/users',     label: 'Users',           icon: UserCircle },
  { to: '/app/audit',     label: 'Audit Logs',      icon: ShieldAlert },
  { to: '/app/rate-mgmt', label: 'Rate Management', icon: Settings2 },
];

function NavItem({ to, label, icon: Icon, accent, badge, roles: itemRoles }) {
  const { hasRole, isAdmin } = useAuth();
  if (itemRoles && !isAdmin && !hasRole(...itemRoles)) return null;
  return (
    <NavLink to={to} end={to === '/app/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all
         ${isActive
           ? 'bg-white/15 text-white'
           : accent
           ? 'text-orange-300 hover:bg-white/10 hover:text-orange-200'
           : 'text-white/60 hover:bg-white/10 hover:text-white'
         }`
      }
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge && (
        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
          badge === 'NEW' ? 'bg-green-500/80 text-white' : 'bg-white/20 text-white/80'
        }`}>{badge}</span>
      )}
    </NavLink>
  );
}

export function AppLayout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { dark, toggle: toggleDark } = useDarkMode();

  // Global keyboard shortcut for search
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 's' || e.key === 'S' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-navy-900 text-white overflow-y-auto" style={{ background: '#0b1f3a' }}>
      {/* Logo */}
      <div className="px-4 pt-5 pb-3 flex items-center gap-3 border-b border-white/10">
        <img src="/images/logo.png" alt="Sea Hawk" className="w-8 h-8 object-contain" onError={e => e.target.style.display='none'} />
        <div>
          <div className="text-sm font-black text-white leading-tight">Sea Hawk</div>
          <div className="text-[10px] text-white/40">Courier & Cargo</div>
        </div>
      </div>

      {/* Search button */}
      <div className="px-3 pt-3">
        <button onClick={() => setShowSearch(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white/50 hover:bg-white/15 hover:text-white/70 text-sm transition-all">
          <Search className="w-3.5 h-3.5" />
          <span className="flex-1 text-left text-xs">Search... </span>
          <kbd className="text-[9px] bg-white/10 rounded px-1">S</kbd>
        </button>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label || 'main'}>
            {group.label && (
              <div className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-white/30">
                {group.label}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => <NavItem key={item.to} {...item} />)}
            </div>
          </div>
        ))}
        {isAdmin && (
          <div>
            <div className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-white/30">Admin</div>
            <div className="space-y-0.5">
              {adminItems.map(item => <NavItem key={item.to} {...item} />)}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom: dark mode + user */}
      <div className="border-t border-white/10 p-3 space-y-2">
        <button onClick={toggleDark}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/50 hover:bg-white/10 hover:text-white text-sm transition-all">
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
            <div className="text-[10px] text-white/40 truncate">{user?.role}</div>
          </div>
          <button onClick={handleLogout} title="Logout" className="p-1.5 text-white/30 hover:text-white/70 rounded-lg hover:bg-white/10">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-56 flex-shrink-0 flex-col">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 w-56 flex flex-col">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-gray-900 flex-1">Sea Hawk</span>
          <button onClick={() => setShowSearch(true)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100">
            <Search className="w-5 h-5" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Global search modal */}
      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}
    </div>
  );
}
