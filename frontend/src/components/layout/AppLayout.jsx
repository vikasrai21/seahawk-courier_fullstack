import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, PlusCircle, FileUp, Package, Calendar,
  BarChart2, Users, Clock, Search, RefreshCw, ShieldAlert,
  LogOut, UserCircle, Menu, X, ChevronRight, FileText,
  Receipt, ScrollText, Calculator, Activity, Layers,
  CreditCard, GitCompare, Shield, Settings2, MessageCircle
} from 'lucide-react';
import { useState } from 'react';
import { usePWA } from '../../hooks/usePWA';
import { ShortcutsHelp } from '../ui/ShortcutsHelp';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

const navGroups = [
  {
    label: null,
    items: [
      { to: '/app/',      label: 'Dashboard',      icon: LayoutDashboard },
      { to: '/app/ops',   label: 'Operations',     icon: Activity, badge: 'CEO' },
      { to: '/app/analytics', label: 'Analytics',      icon: BarChart2, roles: ['ADMIN','OPS_MANAGER'] },
      { to: '/app/entry', label: 'New Entry',      icon: PlusCircle, accent: true },
      { to: '/app/import', label: 'Import',         icon: FileUp },
    ],
  },
  {
    label: 'Shipments',
    items: [
      { to: '/app/shipments', label: 'Shipment Dashboard', icon: Layers, badge: 'NEW' },
      { to: '/app/all',  label: 'All Shipments',      icon: Package },
      { to: '/app/pending', label: 'Pending',             icon: Clock },
      { to: '/app/track', label: 'Track',               icon: Search },
      { to: '/app/ndr',  label: 'NDR Management',      icon: ShieldAlert },
      { to: '/app/pickups', label: 'Pickup Scheduler',    icon: Calendar },
      { to: '/app/daily', label: 'Daily Sheet',         icon: Calendar },
      { to: '/app/monthly', label: 'Monthly Report',      icon: BarChart2 },
    ],
  },
  {
    label: 'Clients & Billing',
    items: [
      { to: '/app/clients', label: 'Clients',         icon: Users },
      { to: '/app/contracts', label: 'Contracts',       icon: ScrollText },
      { to: '/app/invoices', label: 'Invoices',        icon: Receipt },
      { to: '/app/wallet', label: 'Wallet',          icon: CreditCard, roles: ['ADMIN','OPS_MANAGER'] },
      { to: '/app/reconciliation', label: 'Reconciliation',  icon: Shield },
    ],
  },
  {
    label: 'Rates & Quotes',
    items: [
      { to: '/app/rates', label: 'Rate Calculator', icon: Calculator },
      { to: '/app/bulk',  label: 'Bulk Compare',    icon: GitCompare },
      { to: '/app/rate-card', label: 'Rate Card PDF',   icon: CreditCard },
      { to: '/app/quotes', label: 'Quote History',   icon: FileText },
      { to: '/app/whatsapp', label: 'WhatsApp Rates',  icon: MessageCircle, badge: 'NEW' },
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
  { to: '/app/users', label: 'Users',          icon: UserCircle },
  { to: '/app/audit', label: 'Audit Logs',     icon: ShieldAlert },
  { to: '/app/rate-mgmt', label: 'Rate Management',icon: Settings2 },
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
  const { canInstall, promptInstall } = usePWA();

  // Keyboard shortcuts active for all app pages
  useKeyboardShortcuts();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-xl">🦅</div>
          <div>
            <h1 className="font-bold text-sm text-white">Seahawk</h1>
            <p className="text-white/40 text-[10px] tracking-widest uppercase">Courier & Cargo</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-3 mb-1 text-[9px] uppercase font-bold tracking-widest text-white/30">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => <NavItem key={item.to} {...item} />)}
            </div>
          </div>
        ))}

        {isAdmin && (
          <div>
            <p className="px-3 mb-1 text-[9px] uppercase font-bold tracking-widest text-white/30">Admin</p>
            <div className="space-y-0.5">
              {adminItems.map(item => <NavItem key={item.to} {...item} />)}
            </div>
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 p-3 shrink-0">
        <NavLink to="/app/profile"
          className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/10 transition-all group mb-1">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-white/40 truncate">{user?.role}</p>
          </div>
          <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/50" />
        </NavLink>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:bg-white/10 hover:text-white/80 transition-all">
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Keyboard shortcuts modal */}
      <ShortcutsHelp />

      {/* PWA install banner */}
      {canInstall && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-navy-700 text-white px-5 py-3 rounded-xl shadow-xl border border-white/10" style={{ background: '#0b1f3a' }}>
          <span className="text-xl">🦅</span>
          <div>
            <div className="text-sm font-semibold">Install Sea Hawk App</div>
            <div className="text-xs opacity-70">Add to home screen for offline access</div>
          </div>
          <button onClick={promptInstall} className="ml-2 px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600" style={{ background: '#e8580a' }}>Install</button>
          <button onClick={() => {}} className="text-white/50 hover:text-white text-lg leading-none">✕</button>
        </div>
      )}
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 bg-navy-600 flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-56 h-full bg-navy-600 flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shrink-0">
          <button onClick={() => setMobileOpen(true)} className="text-gray-600">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-gray-900 text-sm">🦅 Seahawk</span>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
