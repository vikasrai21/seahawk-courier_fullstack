import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import '../../styles/theme.css';

import {
  LayoutDashboard, PlusCircle, FileUp, Package, Calendar,
  BarChart2, Users, Clock, Search, RefreshCw, ShieldAlert,
  LogOut, UserCircle, Menu, X, ChevronRight, FileText,
  Receipt, ScrollText, Calculator, Activity, Layers,
  CreditCard, GitCompare, Shield, Settings2, MessageCircle,
  Sun, Moon, ScanLine, Bell
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePWA } from '../../hooks/usePWA';
import { ShortcutsHelp } from '../ui/ShortcutsHelp';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

// ── Design tokens (must match DashboardPage) ───────────────────────────────
const C = {
  bg:        'var(--shk-bg, #f8fafc)',
  sidebar:   'var(--shk-sidebar, #ffffff)',
  surface:   'var(--shk-surface, #ffffff)',
  border:    'var(--shk-border, #e2e8f0)',
  borderHi:  'var(--shk-border-hi, #cbd5e1)',
  orange:    'var(--shk-orange, #f97316)',
  text:      'var(--shk-text, #0f172a)',
  textMid:   'var(--shk-text-mid, #475569)',
  textDim:   'var(--shk-text-dim, #94a3b8)',
};

const navGroups = [
  {
    label: null,
    items: [
      { to: '/app/',          label: 'Dashboard',           icon: LayoutDashboard },
      { to: '/app/ops',       label: 'Operations',          icon: Activity, badge: 'CEO' },
      { to: '/app/analytics', label: 'Analytics',           icon: BarChart2, roles: ['ADMIN','OPS_MANAGER'] },
      { to: '/app/entry',     label: 'New Entry',           icon: PlusCircle, accent: true },
      { to: '/app/import',    label: 'Import',              icon: FileUp, isSecondary: true },
    ],
  },
  {
    label: 'Shipments',
    items: [
      { to: '/app/scan',      label: 'Scan AWB',            icon: ScanLine, badge: 'NEW', roles: ['ADMIN','OPS_MANAGER','STAFF'] },
      { to: '/app/shipments', label: 'Shipment Dashboard',  icon: Layers },
      { to: '/app/all',       label: 'All Shipments',       icon: Package },
      { to: '/app/pending',   label: 'Pending',             icon: Clock, isSecondary: true },
      { to: '/app/track',     label: 'Track',               icon: Search, isSecondary: true },
      { to: '/app/ndr',       label: 'NDR Management',      icon: ShieldAlert, isSecondary: true },
      { to: '/app/pickups',   label: 'Pickup Scheduler',    icon: Calendar, isSecondary: true },
      { to: '/app/daily',     label: 'Daily Sheet',         icon: Calendar, isSecondary: true },
      { to: '/app/monthly',   label: 'Monthly Report',      icon: BarChart2, isSecondary: true },
    ],
  },
  {
    label: 'Clients & Billing',
    items: [
      { to: '/app/clients',        label: 'Clients',          icon: Users },
      { to: '/app/contracts',      label: 'Contracts',        icon: ScrollText, isSecondary: true },
      { to: '/app/invoices',       label: 'Invoices',         icon: Receipt },
      { to: '/app/support',        label: 'Support Tickets',  icon: MessageCircle, roles: ['ADMIN','OPS_MANAGER','STAFF'], isSecondary: true },
      { to: '/app/wallet',         label: 'Wallet',           icon: CreditCard, roles: ['ADMIN','OPS_MANAGER'] },
      { to: '/app/reconciliation', label: 'Reconciliation',   icon: Shield, isSecondary: true },
    ],
  },
  {
    label: 'Rates & Quotes',
    items: [
      { to: '/app/rates',     label: 'Rate Calculator',  icon: Calculator },
      { to: '/app/bulk',      label: 'Bulk Compare',     icon: GitCompare, isSecondary: true },
      { to: '/app/rate-card', label: 'Rate Card PDF',    icon: CreditCard, isSecondary: true },
      { to: '/app/quotes',    label: 'Quote History',    icon: FileText, isSecondary: true },
      { to: '/app/whatsapp',  label: 'WhatsApp Rates',   icon: MessageCircle, badge: 'NEW', isSecondary: true },
    ],
  },
  {
    label: 'Data',
    items: [
      { to: '/app/sync', label: 'Export & Backup', icon: RefreshCw, isSecondary: true },
    ],
  },
];

const adminItems = [
  { to: '/app/users',    label: 'Users',           icon: UserCircle, isSecondary: true },
  { to: '/app/audit',    label: 'Audit Logs',      icon: ShieldAlert, isSecondary: true },
  { to: '/app/rate-mgmt',label: 'Rate Management', icon: Settings2, isSecondary: true },
];

// ── Nav item ───────────────────────────────────────────────────────────────
function NavItem({ to, label, icon: Icon, badge, roles: itemRoles, isSecondary }) {
  const { hasRole, isAdmin } = useAuth();
  const { dark } = useTheme();
  if (itemRoles && !isAdmin && !hasRole(...itemRoles)) return null;

  return (
    <NavLink
      to={to}
      end={to === '/app/'}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: isSecondary ? '7px 12px' : '9px 12px',
        borderRadius: 12,
        fontSize: isSecondary ? 12 : 13,
        fontWeight: isActive ? 700 : isSecondary ? 500 : 600,
        textDecoration: 'none',
        color:      isActive ? (dark ? '#ffffff' : '#0f172a') : (isSecondary ? (dark ? '#94a3b8' : '#64748b') : (dark ? '#e2e8f0' : '#475569')),
        background: isActive ? (dark ? 'linear-gradient(90deg, rgba(249,115,22,0.15), rgba(249,115,22,0.03))' : 'linear-gradient(90deg, rgba(249,115,22,0.1), rgba(249,115,22,0.02))') : 'transparent',
        border: isActive ? `1px solid rgba(249,115,22,0.3)` : '1px solid transparent',
        boxShadow: isActive ? '0 4px 12px rgba(249,115,22,0.05)' : 'none',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isActive ? 1 : 0.9,
      })}
      onMouseEnter={e => {
        if (!e.currentTarget.style.background.includes('249')) {
          e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)';
          e.currentTarget.style.color = dark ? '#ffffff' : '#0f172a';
          e.currentTarget.style.opacity = 1;
        }
      }}
      onMouseLeave={e => {
        if (!e.currentTarget.style.background.includes('249')) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = isSecondary ? (dark ? '#94a3b8' : '#64748b') : (dark ? '#e2e8f0' : '#475569');
          e.currentTarget.style.opacity = 0.9;
        }
      }}
    >
      <Icon size={isSecondary ? 13 : 14} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span style={{
          fontSize: 8, fontWeight: 900, padding: '2px 6px', borderRadius: 20,
          background: badge === 'NEW' ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.15)',
          color:      badge === 'NEW' ? '#22c55e'              : '#f97316',
          letterSpacing: '0.05em',
        }}>{badge}</span>
      )}
    </NavLink>
  );
}

// ── Section label ──────────────────────────────────────────────────────────
function SectionLabel({ label }) {
  const { dark } = useTheme();
  return (
    <p style={{
      padding: '0 12px', marginBottom: 6, marginTop: 4,
      fontSize: 10, fontWeight: 800,
      textTransform: 'uppercase', letterSpacing: '0.15em',
      color: dark ? '#94a3b8' : '#475569',
      fontFamily: 'Inter, sans-serif',
      display: 'flex', alignItems: 'center', gap: 8
    }}>
      {label}
      <span style={{ flex: 1, height: 1, background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
    </p>
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
      background: dark ? '#0B1120' : '#ffffff',
    }}>

      {/* Logo */}
      <div style={{
        padding: '16px 14px',
        borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexShrink: 0,
        background: dark ? '#0B1120' : '#ffffff',
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
              border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`
            }} 
          />
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: dark ? '#f8fafc' : '#0f172a', lineHeight: 1.2 }}>Seahawk</div>
            <div style={{ fontSize: 9, color: dark ? '#64748b' : '#64748b', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
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
      <div style={{ borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`, padding: '10px 8px', flexShrink: 0 }}>
        <NavLink to="/app/profile" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 10,
          textDecoration: 'none',
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)'}
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
            <div style={{ fontSize: 12, fontWeight: 700, color: dark ? '#f8fafc' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 10, color: dark ? '#94a3b8' : '#64748b', fontFamily: 'Inter, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{user?.role}</div>
          </div>
          <ChevronRight size={12} color={C.textDim} />
        </NavLink>

        <button
          onClick={toggle}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', borderRadius: 8, marginBottom: 2,
            background: 'none', border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`, cursor: 'pointer',
            fontSize: 12, color: dark ? '#94a3b8' : '#475569', fontFamily: 'Inter, sans-serif',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)'; e.currentTarget.style.color = dark ? '#fff' : '#0f172a'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = dark ? '#94a3b8' : '#475569'; }}
        >
          {dark ? <Sun size={13} color="#f59e0b" /> : <Moon size={13} color="#475569" />}
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

export function AppLayout({ children }) {
  const { user } = useAuth();
  const { dark, toggle } = useTheme();
  const { socket } = useSocket();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { canInstall, promptInstall } = usePWA();
  useKeyboardShortcuts();

  const isClient = user?.role === 'CLIENT';
  
  const [walletBalance, setWalletBalance] = useState(user?.walletBalance || 0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setWalletBalance(user?.walletBalance || 0);
  }, [user?.walletBalance]);

  useEffect(() => {
    if (!socket) return;
    
    const handleWalletUpdate = (data) => {
      if (typeof data?.balance === 'number') {
        setWalletBalance(data.balance);
      }
    };
    
    const handleNotification = (data) => {
      setUnreadCount(c => c + 1);
    };

    socket.on('wallet_update', handleWalletUpdate);
    socket.on('notification', handleNotification);

    return () => {
      socket.off('wallet_update', handleWalletUpdate);
      socket.off('notification', handleNotification);
    };
  }, [socket]);

  return (
    <div style={{
      display: 'flex', height: '100vh',
      background: 'var(--shk-bg, #f8fafc)',
      overflow: 'hidden',
      fontFamily: "'Inter', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <ShortcutsHelp />

      {/* PWA install banner */}
      {canInstall && (
        <div style={{
          position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: 60, display: 'flex', alignItems: 'center', gap: 12,
          background: C.surface, border: `1px solid ${C.border}`,
          padding: '12px 18px', borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          color: C.text, fontSize: 13, backdropFilter: 'blur(10px)',
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
        borderRight: `1px solid rgba(255,255,255,0.02)`,
        zIndex: 50,
      }}
        className="shk-sidebar-desktop"
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
            onClick={() => setMobileOpen(false)}
          />
          <aside style={{ position: 'relative', width: 248, height: '100%', borderRight: `1px solid ${C.border}`, animation: 'shkSlideIn 0.3s ease' }}>
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Global Top Bar (Mobile & Desktop) */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 24px',
          background: dark ? 'var(--shk-surface, #1e293b)' : '#ffffff',
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
          zIndex: 40,
          height: 64,
          backdropFilter: 'blur(10px)',
        }}>
          {/* Left: Mobile Menu / Brand Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setMobileOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMid, padding: 8, borderRadius: 8 }}
              className="shk-mobile-menu-btn"
            >
              <Menu size={22} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/images/logo.png" style={{ height: 32, width: 'auto', objectFit: 'contain', background: '#fff', borderRadius: 6, padding: 2 }} alt="Logo" className="shk-mobile-logo" />
              <span style={{ fontWeight: 800, color: C.text, fontSize: 16, fontFamily: 'inherit'}} className="shk-mobile-logo">Seahawk</span>
              <div className="shk-desktop-search" style={{ position: 'relative', marginLeft: 20 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textDim }} />
                <input 
                  type="text" 
                  placeholder="Universal search (Ctrl+K)" 
                  style={{
                    padding: '8px 12px 8px 36px',
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    fontSize: 12,
                    width: 240,
                    color: C.text,
                    outline: 'none'
                  }}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Right: Actions / Wallet / Theme */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            
            {/* Wallet Chip */}
            {isClient && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 12px', borderRadius: 12,
                background: dark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.08)',
                border: `1px solid ${dark ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.15)'}`,
                cursor: 'pointer'
              }}>
                <CreditCard size={14} color="#10b981" />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>Wallet</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: C.text, fontFamily: 'inherit'}}>₹{walletBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}

            <div style={{ width: 1, height: 24, background: C.border, margin: '0 4px' }} className="shk-header-divider" />

            {/* Theme Toggle */}
            <button
              onClick={toggle}
              style={{
                width: 36, height: 36, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                border: 'none', cursor: 'pointer', color: C.textMid,
              }}
              title={`Switch to ${dark ? 'Light' : 'Dark'} Mode`}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  width: 36, height: 36, borderRadius: 10, position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: showNotifications ? (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)') : (dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                  border: 'none', cursor: 'pointer', color: C.textMid,
                  transition: 'background 0.2s',
                }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#ef4444', border: `2px solid ${dark ? '#1e293b' : '#fff'}`,
                  }} />
                )}
              </button>

              {/* Dropdown Menu */}
              {showNotifications && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  width: 320, background: C.surface,
                  border: `1px solid ${C.border}`, borderRadius: 16,
                  boxShadow: dark ? '0 18px 38px rgba(0,0,0,0.35)' : '0 18px 38px rgba(15,23,42,0.12)', overflow: 'hidden',
                  zIndex: 100,
                  animation: 'shkFadeInDown 0.15s ease-out'
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.borderHi}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: C.text }}>Notifications</div>
                    <button 
                      onClick={() => setUnreadCount(0)}
                      style={{ fontSize: 11, fontWeight: 600, color: C.orange, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Mark all read
                    </button>
                  </div>
                  <div style={{ maxHeight: 300, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {unreadCount > 0 ? (
                      Array.from({ length: unreadCount }).map((_, i) => (
                        <div key={i} style={{ padding: 10, background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: C.text, display: 'block' }}>Update received</span>
                          <span style={{ fontSize: 11, color: C.textDim }}>A new event occurred in the portal.</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: 30, textAlign: 'center', color: C.textDim, fontSize: 12 }}>
                        No new notifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={{ width: 1, height: 24, background: C.border, margin: '0 4px' }} className="shk-header-divider" />

            {/* User Profile Hook */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right' }} className="shk-header-user-info">
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.1 }}>{user?.name}</div>
                <div style={{ fontSize: 10, color: C.textDim, fontWeight: 500, textTransform: 'uppercase' }}>{user?.role}</div>
              </div>
              <div style={{ 
                width: 36, height: 36, borderRadius: 10, 
                background: `linear-gradient(135deg, ${C.orange}, #fb923c)`, 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: 14, boxShadow: '0 4px 12px rgba(249,115,22,0.2)'
              }}>
                {user?.name?.[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--shk-bg, #f8fafc)', transition: 'background 0.3s' }}>
          {children}
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');

        @keyframes shkSlideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }

        /* Show desktop sidebar on md+ */
        @media (min-width: 768px) {
          .shk-sidebar-desktop   { display: flex !important; flex-direction: column; }
          .shk-mobile-menu-btn   { display: none !important; }
          .shk-mobile-logo       { display: none !important; }
        }

        @media (max-width: 767px) {
          .shk-desktop-search, .shk-header-divider, .shk-header-user-info { display: none !important; }
        }

        /* Scrollbar styling */
        nav::-webkit-scrollbar       { width: 3px; }
        nav::-webkit-scrollbar-track { background: transparent; }
        nav::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }

        main::-webkit-scrollbar       { width: 4px; }
        main::-webkit-scrollbar-track { background: transparent; }
        main::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
    </div>
  );
}
