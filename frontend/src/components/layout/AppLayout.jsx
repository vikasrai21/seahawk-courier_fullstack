import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/theme.css';

import {
  LayoutDashboard, PlusCircle, FileUp, Package, Calendar,
  BarChart2, Users, Clock, Search, RefreshCw, ShieldAlert,
  LogOut, UserCircle, Menu, X, ChevronRight, FileText,
  Receipt, ScrollText, Calculator, Activity, Layers,
  CreditCard, GitCompare, Shield, Settings2, MessageCircle,
  Sun, Moon, ScanLine
} from 'lucide-react';
import { useState } from 'react';
import { usePWA } from '../../hooks/usePWA';
import { ShortcutsHelp } from '../ui/ShortcutsHelp';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

// ── Design tokens (must match DashboardPage) ───────────────────────────────
const C = {
  bg:        'var(--shk-bg, #f3f6fc)',
  sidebar:   'var(--shk-sidebar, #ffffff)',
  surface:   'var(--shk-surface, #ffffff)',
  border:    'var(--shk-border, #dde6f2)',
  borderHi:  'var(--shk-border-hi, #c9d8eb)',
  orange:    'var(--shk-orange, #f97316)',
  text:      'var(--shk-text, #0f172a)',
  textMid:   'var(--shk-text-mid, #475569)',
  textDim:   'var(--shk-text-dim, #64748b)',
};

const navGroups = [
  {
    label: null,
    items: [
      { to: '/app/',          label: 'Dashboard',           icon: LayoutDashboard },
      { to: '/app/ops',       label: 'Operations',          icon: Activity, badge: 'CEO' },
      { to: '/app/analytics', label: 'Analytics',           icon: BarChart2, roles: ['ADMIN','OPS_MANAGER'] },
      { to: '/app/entry',     label: 'New Entry',           icon: PlusCircle, accent: true },
      { to: '/app/import',    label: 'Import',              icon: FileUp },
    ],
  },
  {
    label: 'Shipments',
    items: [
      { to: '/app/scan',      label: 'Scan AWB',            icon: ScanLine, badge: 'NEW', roles: ['ADMIN','OPS_MANAGER','STAFF'] },
      { to: '/app/shipments', label: 'Shipment Dashboard',  icon: Layers },
      { to: '/app/all',       label: 'All Shipments',       icon: Package },
      { to: '/app/pending',   label: 'Pending',             icon: Clock },
      { to: '/app/track',     label: 'Track',               icon: Search },
      { to: '/app/ndr',       label: 'NDR Management',      icon: ShieldAlert },
      { to: '/app/pickups',   label: 'Pickup Scheduler',    icon: Calendar },
      { to: '/app/daily',     label: 'Daily Sheet',         icon: Calendar },
      { to: '/app/monthly',   label: 'Monthly Report',      icon: BarChart2 },
    ],
  },
  {
    label: 'Clients & Billing',
    items: [
      { to: '/app/clients',        label: 'Clients',          icon: Users },
      { to: '/app/contracts',      label: 'Contracts',        icon: ScrollText },
      { to: '/app/invoices',       label: 'Invoices',         icon: Receipt },
      { to: '/app/wallet',         label: 'Wallet',           icon: CreditCard, roles: ['ADMIN','OPS_MANAGER'] },
      { to: '/app/reconciliation', label: 'Reconciliation',   icon: Shield },
    ],
  },
  {
    label: 'Rates & Quotes',
    items: [
      { to: '/app/rates',     label: 'Rate Calculator',  icon: Calculator },
      { to: '/app/bulk',      label: 'Bulk Compare',     icon: GitCompare },
      { to: '/app/rate-card', label: 'Rate Card PDF',    icon: CreditCard },
      { to: '/app/quotes',    label: 'Quote History',    icon: FileText },
      { to: '/app/whatsapp',  label: 'WhatsApp Rates',   icon: MessageCircle, badge: 'NEW' },
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
  { to: '/app/users',    label: 'Users',           icon: UserCircle },
  { to: '/app/audit',    label: 'Audit Logs',      icon: ShieldAlert },
  { to: '/app/rate-mgmt',label: 'Rate Management', icon: Settings2 },
];

// ── Nav item ───────────────────────────────────────────────────────────────
function NavItem({ to, label, icon: Icon, badge, roles: itemRoles }) {
  const { hasRole, isAdmin } = useAuth();
  if (itemRoles && !isAdmin && !hasRole(...itemRoles)) return null;

  return (
    <NavLink
      to={to}
      end={to === '/app/'}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        borderRadius: 12,
        fontSize: 13,
        fontWeight: isActive ? 700 : 500,
        textDecoration: 'none',
        color:      isActive ? C.text : C.textMid,
        background: isActive ? 'linear-gradient(90deg, rgba(249,115,22,0.14), rgba(249,115,22,0.04))' : 'transparent',
        border: isActive ? `1px solid rgba(249,115,22,0.28)` : '1px solid transparent',
        boxShadow: isActive ? '0 6px 20px rgba(249,115,22,0.08)' : 'none',
        transition: 'all 0.16s ease',
      })}
      onMouseEnter={e => {
        if (!e.currentTarget.style.background.includes('249')) {
          e.currentTarget.style.background = 'rgba(15,23,42,0.04)';
          e.currentTarget.style.color = C.text;
        }
      }}
      onMouseLeave={e => {
        if (!e.currentTarget.style.background.includes('249')) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = C.textMid;
        }
      }}
    >
      <Icon size={14} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span style={{
          fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 20,
          background: badge === 'NEW' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)',
          color:      badge === 'NEW' ? '#22c55e'              : C.textMid,
          letterSpacing: '0.05em',
        }}>{badge}</span>
      )}
    </NavLink>
  );
}

// ── Section label ──────────────────────────────────────────────────────────
function SectionLabel({ label }) {
  return (
    <p style={{
      padding: '0 10px', marginBottom: 4,
      fontSize: 9, fontWeight: 800,
      textTransform: 'uppercase', letterSpacing: '0.12em',
      color: C.textDim,
      fontFamily: 'Outfit, sans-serif',
    }}>{label}</p>
  );
}

// ── Sidebar content ────────────────────────────────────────────────────────
function SidebarContent({ onClose }) {
  const { user, logout, isAdmin } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
      background: C.sidebar,
    }}>

      {/* Logo */}
      <div style={{
        padding: '16px 14px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexShrink: 0,
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img 
            src="/images/logo.png" 
            alt="Sea Hawk Logo" 
            style={{ 
              height: 40,
              width: 'auto', 
              objectFit: 'contain',
              borderRadius: 8,
              padding: 3,
              border: `1px solid ${C.border}`
            }} 
          />
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: C.text, lineHeight: 1.2 }}>Seahawk</div>
            <div style={{ fontSize: 9, color: C.textDim, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
              Courier & Cargo
            </div>
          </div>
        </div>
        {/* Mobile close button */}
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textDim, padding: 4 }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        {navGroups.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 20 }}>
            {group.label && <SectionLabel label={group.label} />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {group.items.map(item => <NavItem key={item.to} {...item} />)}
            </div>
          </div>
        ))}

        {isAdmin && (
          <div style={{ marginBottom: 20 }}>
            <SectionLabel label="Admin" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {adminItems.map(item => <NavItem key={item.to} {...item} />)}
            </div>
          </div>
        )}
      </nav>

      {/* User footer */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: '10px 8px', flexShrink: 0 }}>
        <NavLink to="/app/profile" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 10,
          textDecoration: 'none',
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,23,42,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{
            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
            background: `rgba(249,115,22,0.15)`,
            border: `1px solid rgba(249,115,22,0.25)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: C.orange,
          }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 10, color: C.textDim, fontFamily: 'Outfit, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{user?.role}</div>
          </div>
          <ChevronRight size={12} color={C.textDim} />
        </NavLink>

        <button
          onClick={toggle}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', borderRadius: 8, marginBottom: 2,
            background: 'none', border: `1px solid ${C.border}`, cursor: 'pointer',
            fontSize: 12, color: C.textMid, fontFamily: 'Outfit, sans-serif',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(15,23,42,0.05)'; e.currentTarget.style.color = C.text; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.textMid; }}
        >
          {dark ? <Sun size={13} color="#f59e0b" /> : <Moon size={13} color="#334155" />}
          {dark ? 'Switch to Light' : 'Switch to Dark'}
        </button>

        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', borderRadius: 8, marginTop: 2,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: C.textDim,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.textDim; }}
        >
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </div>
  );
}

// ── App Layout ─────────────────────────────────────────────────────────────
export function AppLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { canInstall, promptInstall } = usePWA();
  useKeyboardShortcuts();

  return (
    <div style={{
      display: 'flex', height: '100vh',
      background: 'linear-gradient(180deg, #f7faff 0%, #edf3fb 100%)',
      overflow: 'hidden',
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <ShortcutsHelp />

      {/* PWA install banner */}
      {canInstall && (
        <div style={{
          position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: 50, display: 'flex', alignItems: 'center', gap: 12,
          background: C.surface, border: `1px solid ${C.border}`,
          padding: '12px 18px', borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          color: C.text, fontSize: 13,
        }}>
          <img src="/images/logo.png" style={{ height: 32, width: 'auto', objectFit: 'contain', background: '#fff', borderRadius: 6, padding: 2 }} alt="Logo" />
          <div>
            <div style={{ fontWeight: 700 }}>Install Sea Hawk App</div>
            <div style={{ fontSize: 11, color: C.textDim }}>Add to home screen for offline access</div>
          </div>
          <button onClick={promptInstall} style={{
            marginLeft: 8, padding: '6px 14px', background: C.orange,
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>Install</button>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside style={{
        display: 'none',
        width: 248, flexShrink: 0,
        borderRight: `1px solid ${C.border}`,
      }}
        className="shk-sidebar-desktop"
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
            onClick={() => setMobileOpen(false)}
          />
          <aside style={{ position: 'relative', width: 248, height: '100%', borderRight: `1px solid ${C.border}` }}>
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Mobile top bar */}
        <header style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}
          className="shk-mobile-header"
        >
          <button
            onClick={() => setMobileOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMid, padding: 2 }}
          >
            <Menu size={20} />
          </button>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: C.text, fontSize: 14 }}>
            <img src="/images/logo.png" style={{ height: 28, width: 'auto', objectFit: 'contain', background: '#fff', borderRadius: 4, padding: 2 }} alt="Logo" />
            Seahawk
          </span>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--shk-bg, #f3f6fc)', transition: 'background 0.3s' }}>
          {children}
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

        /* Show desktop sidebar on md+ */
        @media (min-width: 768px) {
          .shk-sidebar-desktop { display: flex !important; flex-direction: column; }
          .shk-mobile-header   { display: none !important; }
        }

        /* Scrollbar styling */
        nav::-webkit-scrollbar       { width: 3px; }
        nav::-webkit-scrollbar-track { background: transparent; }
        nav::-webkit-scrollbar-thumb { background: #1f2d45; border-radius: 3px; }

        main::-webkit-scrollbar       { width: 4px; }
        main::-webkit-scrollbar-track { background: transparent; }
        main::-webkit-scrollbar-thumb { background: #1f2d45; border-radius: 4px; }
      `}</style>
    </div>
  );
}
