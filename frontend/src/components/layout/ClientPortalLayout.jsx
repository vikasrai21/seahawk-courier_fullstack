import { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Menu,
  X,
  LayoutDashboard,
  Package2,
  ClipboardList,
  FilePlus2,
  AlertTriangle,
  Truck,
  Upload,
  LifeBuoy,
  Map,
  Bell,
  Radar,
  Image,
  Code2,
  Wallet,
  FileText,
  ShieldCheck,
  Calculator,
  RotateCcw,
  LogOut,
  Sun,
  Moon,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const navGroups = [
  {
    label: 'Command',
    items: [
      { to: '/portal', label: 'Command Center', icon: LayoutDashboard, end: true },
      { to: '/portal/shipments', label: 'Shipments', icon: Package2 },
      { to: '/portal/book-shipment', label: 'Book Shipment', icon: FilePlus2 },
      { to: '/portal/drafts', label: 'Orders Queue', icon: ClipboardList },
      { to: '/portal/bulk-track', label: 'Bulk Track', icon: Radar },
      { to: '/portal/track', label: 'Single Track', icon: Radar },
      { to: '/portal/map', label: 'Live Map', icon: Map },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/portal/ndr', label: 'Delivery Recovery Engine', icon: AlertTriangle },
      { to: '/portal/pickups', label: 'Pickup Requests', icon: Truck },
      { to: '/portal/import', label: 'Order Import', icon: Upload },
      { to: '/portal/pod', label: 'POD Vault', icon: FileText },
      { to: '/portal/rto-intelligence', label: 'Delivery Risk Engine', icon: Calculator },
      { to: '/portal/returns', label: 'Returns', icon: RotateCcw },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { to: '/portal/invoices', label: 'Invoices', icon: FileText },
      { to: '/portal/wallet', label: 'Wallet', icon: Wallet },
      { to: '/portal/support', label: 'Support', icon: LifeBuoy },
      { to: '/portal/notifications', label: 'Notifications', icon: Bell },
      { to: '/portal/branding', label: 'Branding', icon: Image },
      { to: '/portal/developer', label: 'Developer Hub', icon: Code2 },
      { to: '/portal/governance', label: 'Governance', icon: ShieldCheck },
    ],
  },
];

const pageMeta = {
  '/portal': { title: 'Command Center', subtitle: 'Live control tower for your logistics operation.' },
  '/portal/shipments': { title: 'Shipments', subtitle: 'Operational shipment list, filters, and deep drilldowns.' },
  '/portal/book-shipment': { title: 'Book Shipment', subtitle: 'Create order and auto-book with carrier in one flow.' },
  '/portal/drafts': { title: 'Orders Queue', subtitle: 'Draft and queued orders ready for dispatch.' },
  '/portal/bulk-track': { title: 'Bulk Track', subtitle: 'High-volume tracking intelligence and bulk lookup.' },
  '/portal/track': { title: 'Single Track', subtitle: 'Deep event timeline and full shipment journey story.' },
  '/portal/map': { title: 'Live Map', subtitle: 'Realtime movement visibility for in-transit shipments.' },
  '/portal/ndr': { title: 'Delivery Recovery Engine', subtitle: 'At-risk, failed-attempt, and reattempt lifecycle control.' },
  '/portal/pickups': { title: 'Pickup Requests', subtitle: 'Schedule and manage pickup workflow.' },
  '/portal/import': { title: 'Order Import', subtitle: 'Bulk order ingestion pipeline.' },
  '/portal/pod': { title: 'POD Vault', subtitle: 'Proof-of-delivery documents and events.' },
  '/portal/rto-intelligence': { title: 'Delivery Risk Engine', subtitle: 'Predictive return prevention with risk scoring and actions.' },
  '/portal/invoices': { title: 'Invoices', subtitle: 'Billing, invoices, and downloadable statements.' },
  '/portal/wallet': { title: 'Wallet', subtitle: 'Balance, transactions, and recharge controls.' },
  '/portal/support': { title: 'Support', subtitle: 'Tickets, escalations, and issue resolution.' },
  '/portal/notifications': { title: 'Notifications', subtitle: 'Alert preferences and communication controls.' },
  '/portal/branding': { title: 'Branding', subtitle: 'White-label settings for client-facing tracking.' },
  '/portal/developer': { title: 'Developer Hub', subtitle: 'API and integration tools for engineering teams.' },
  '/portal/governance': { title: 'Governance', subtitle: 'Security, audit, and compliance workspace.' },
  '/portal/returns': { title: 'Returns', subtitle: 'Request and track product returns and reverse pickups.' },
};

function SidebarNav({ onNavigate }) {
  return (
    <nav className="flex-1 overflow-y-auto px-2 py-3">
      {navGroups.map((group) => (
        <section key={group.label} className="mb-5">
          <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{group.label}</p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `client-shell-nav-item flex items-center gap-2.5 rounded-xl border px-3 py-2 text-[12px] font-bold transition ${
                      isActive
                        ? 'client-shell-nav-item-active border-orange-300/80 bg-gradient-to-r from-orange-500/16 to-sky-400/8 text-orange-800 shadow-[0_10px_22px_-16px_rgba(249,115,22,0.95)] dark:border-orange-400/40 dark:from-orange-500/20 dark:to-sky-500/20 dark:text-orange-200'
                        : 'border-transparent text-slate-600 hover:border-slate-200/70 hover:bg-white/75 hover:text-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
                    }`
                  }
                >
                  <Icon size={14} />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}

function SidebarFooter({ mobile = false }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className={`border-t border-slate-200/80 p-2 dark:border-slate-800 ${mobile ? 'bg-white dark:bg-slate-900' : ''}`}>
      <div className="mb-2 rounded-xl border border-slate-200 bg-white/85 px-3 py-2 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.8)] dark:border-slate-700 dark:bg-slate-800/85">
        <p className="truncate text-xs font-black text-slate-800 dark:text-slate-100">{user?.name || 'Client User'}</p>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{user?.role || 'Client'}</p>
      </div>
      <button
        type="button"
        onClick={toggle}
        className="mb-1 flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-xs font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        {dark ? <Sun size={13} /> : <Moon size={13} />}
        {dark ? 'Switch to Light' : 'Switch to Dark'}
      </button>
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-900/30"
      >
        <LogOut size={13} />
        Sign out
      </button>
    </div>
  );
}

export function ClientPortalLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const headerMeta = useMemo(() => pageMeta[location.pathname] || pageMeta['/portal'], [location.pathname]);

  return (
    <div className="client-premium-shell flex h-screen overflow-hidden dark:bg-slate-950">
      <aside className="client-shell-sidebar hidden w-64 flex-col border-r border-slate-200/80 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-900/95 lg:flex">
        <div className="flex items-center gap-3 border-b border-slate-200/80 px-4 py-4 dark:border-slate-800">
          <img src="/images/logo.png" alt="Seahawk Logo" className="h-10 w-auto rounded-xl bg-white p-1.5 shadow-[0_12px_20px_-14px_rgba(15,23,42,0.6)]" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Client Portal</p>
            <p className="text-sm font-black text-slate-900 dark:text-slate-100">Sea Hawk Workspace</p>
          </div>
        </div>
        <div className="mx-3 mt-3 rounded-[22px] border border-sky-200/70 bg-gradient-to-r from-sky-50 via-white to-orange-50 px-3.5 py-3 shadow-[0_20px_34px_-24px_rgba(37,99,235,0.62)] dark:border-sky-900/40 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800/90">
          <p className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-sky-600 dark:text-sky-300">
            <Sparkles size={12} />
            Enterprise Mode
          </p>
          <p className="text-[11px] font-semibold leading-4 text-slate-600 dark:text-slate-300">Designed for channel partners who need faster dispatch, cleaner decisions, and clearer shipment visibility.</p>
        </div>
        <SidebarNav />
        <SidebarFooter />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} aria-label="Close sidebar" />
          <aside className="relative z-10 flex h-full w-72 flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <img src="/images/logo.png" alt="Seahawk Logo" className="h-8 w-auto rounded-md bg-white p-1 shadow-sm" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Client Portal</p>
                  <p className="text-sm font-black text-slate-900 dark:text-slate-100">Sea Hawk Workspace</p>
                </div>
              </div>
              <button type="button" onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800">
                <X size={16} />
              </button>
            </div>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
            <SidebarFooter mobile />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="client-shell-header flex h-16 items-center justify-between border-b border-slate-200/90 bg-white/85 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85 lg:px-6">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden">
              <Menu size={18} />
            </button>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Channel Partner View</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-slate-900 dark:text-slate-100">{headerMeta.title}</p>
                <ChevronRight size={13} className="text-slate-300 dark:text-slate-600" />
                <p className="hidden text-xs font-semibold text-slate-500 dark:text-slate-300 md:block">{headerMeta.subtitle}</p>
              </div>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
              Live
            </div>
            <div className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-sky-700">
              Client Workspace
            </div>
            <div className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-violet-700">
              Secure
            </div>
          </div>
        </header>
        <main className="client-shell-main min-h-0 flex-1 overflow-y-auto pb-3">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              className="h-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default ClientPortalLayout;
