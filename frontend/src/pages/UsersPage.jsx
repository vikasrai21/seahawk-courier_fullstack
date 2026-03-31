import { SkeletonTable } from '../components/ui/Skeleton';
import { useState } from 'react';
import { Plus, Edit2, Key, Link2, Shield, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { PageLoader } from '../components/ui/Loading';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';

const ROLE_META = {
  ADMIN: { label: 'Admin', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  OPS_MANAGER: { label: 'Ops Manager', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  STAFF: { label: 'Staff', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  CLIENT: { label: 'Client', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
};

function RoleBadge({ role }) {
  const m = ROLE_META[role] || { label: role, color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 99,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
      color: m.color, background: m.bg,
    }}>
      {m.label}
    </span>
  );
}

const EMPTY = { name: '', email: '', password: '', role: 'STAFF', branch: '', active: true, clientCode: '' };

export default function UsersPage({ toast }) {
  const { data: users, loading, refetch } = useFetch('/auth/users');
  const { data: clients, loading: cliL } = useFetch('/clients');

  const [editUser, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [tab, setTab] = useState('all');

  const open = (u = null) => {
    setEdit(u || {});
    setForm(u ? { ...EMPTY, ...u, password: '' } : EMPTY);
  };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name || !form.email) { toast?.('Name and email are required', 'error'); return; }
    if (!editUser?.id && !form.password) { toast?.('Password is required for new users', 'error'); return; }
    if (form.role === 'CLIENT' && !editUser?.id && !form.clientCode) {
      toast?.('Select a client account to link this login to', 'error'); return;
    }
    setSaving(true);
    try {
      if (editUser?.id) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/auth/users/${editUser.id}`, payload);
      } else {
        await api.post('/auth/users', form);
      }
      await refetch();
      setEdit(null);
      toast?.(editUser?.id ? 'User updated ✓' : 'User created ✓', 'success');
    } catch (err) {
      toast?.(err.response?.data?.message || err.message, 'error');
    } finally { setSaving(false); }
  };

  const allUsers = users || [];
  const staffUsers = allUsers.filter(u => u.role !== 'CLIENT');
  const clientUsers = allUsers.filter(u => u.role === 'CLIENT');
  const filtered = tab === 'all' ? allUsers : tab === 'staff' ? staffUsers : clientUsers;
  const clientList = clients || [];

  const C = { text: 'var(--shk-text,#f1f5f9)', dim: 'var(--shk-text-dim,#475569)', mid: 'var(--shk-text-mid,#94a3b8)', surface: 'var(--shk-surface,#111827)', border: 'var(--shk-border,#1f2d45)', borderHi: 'var(--shk-border-hi,#2d4060)' };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: C.text }}>User Management</h1>
          <p style={{ fontSize: 12, color: C.dim, margin: '4px 0 0' }}>Admin only · Create logins for staff and client portal access</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/app/profile" className="btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Key size={13} /> My Password
          </Link>
          <button onClick={() => open()} className="btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={13} /> Add User
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}` }}>
        {[
          { key: 'all', label: 'All Users', icon: Users, count: allUsers.length },
          { key: 'staff', label: 'Staff & Admin', icon: Shield, count: staffUsers.length },
          { key: 'client', label: 'Client Portals', icon: Link2, count: clientUsers.length },
        ].map(({ key, label, icon: Icon, count }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: 'none',
            color: tab === key ? '#f97316' : C.mid,
            borderBottom: tab === key ? '2px solid #f97316' : '2px solid transparent',
            marginBottom: -1, transition: 'all 0.15s',
          }}>
            <Icon size={13} /> {label}
            <span style={{ padding: '1px 7px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.06)', color: C.dim }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? <div className="p-6"><SkeletonTable rows={8} cols={6} /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
          {filtered.length === 0
            ? <div style={{ gridColumn: '1/-1' }}><EmptyState icon="👥" title="No users found" message="Create your first user above." /></div>
            : filtered.map(u => {
              const meta = ROLE_META[u.role] || ROLE_META.STAFF;
              return (
                <div key={u.id} style={{
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 14, padding: 16,
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  transition: 'border-color 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.borderHi}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                    background: meta.bg, border: `1.5px solid ${meta.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 800, color: meta.color,
                  }}>
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 13, color: C.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                        <p style={{ fontSize: 11, color: C.dim, margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                      </div>
                      <button onClick={() => open(u)} style={{ padding: 5, borderRadius: 7, border: 'none', cursor: 'pointer', flexShrink: 0, background: 'rgba(59,130,246,0.08)', color: '#3b82f6', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.18)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.08)'}
                      ><Edit2 size={13} /></button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      <RoleBadge role={u.role} />
                      {u.branch && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', color: C.mid }}>{u.branch}</span>}
                      {u.role === 'CLIENT' && u.clientCode && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(168,85,247,0.08)', color: '#a855f7', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Link2 size={9} /> {u.clientCode}
                        </span>
                      )}
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: u.active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: u.active ? '#22c55e' : '#ef4444' }}>
                        {u.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          }
        </div>
      )}

      {/* Modal */}
      <Modal open={!!editUser} onClose={() => setEdit(null)}
        title={editUser?.id ? `Edit — ${editUser.name}` : 'New User'}
        footer={<>
          <button onClick={() => setEdit(null)} className="btn-secondary">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving…' : editUser?.id ? 'Save Changes' : 'Create User'}</button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Role selector */}
          <div>
            <label className="label">Role *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {Object.entries(ROLE_META).map(([role, meta]) => (
                <button key={role} type="button" onClick={() => set('role', role)} style={{
                  padding: '8px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                  border: form.role === role ? `2px solid ${meta.color}` : `2px solid ${C.border}`,
                  background: form.role === role ? meta.bg : 'transparent',
                  color: form.role === role ? meta.color : C.mid,
                  fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                }}>
                  {meta.label}
                </button>
              ))}
            </div>
          </div>

          {/* CLIENT: link to client */}
          {form.role === 'CLIENT' && (
            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)' }}>
              <label className="label" style={{ color: '#a855f7', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Link2 size={11} /> Link to Client Account *
              </label>
              {cliL ? (
                <p style={{ fontSize: 12, color: C.dim }}>Loading clients…</p>
              ) : clientList.length === 0 ? (
                <p style={{ fontSize: 12, color: '#ef4444' }}>No clients found. Create a client first in the Clients page.</p>
              ) : (
                <select className="input" value={form.clientCode} onChange={e => set('clientCode', e.target.value)}>
                  <option value="">— Select a client account —</option>
                  {clientList.map(c => (
                    <option key={c.code} value={c.code}>{c.company} ({c.code})</option>
                  ))}
                </select>
              )}
              <p style={{ fontSize: 10, color: 'rgba(168,85,247,0.7)', marginTop: 4 }}>
                This login will only see shipments and data for the selected client.
              </p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Full Name *</label>
              <input className="input" placeholder="Rahul Sharma" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="label">Branch</label>
              <input className="input" placeholder="Main / Delhi" value={form.branch} onChange={e => set('branch', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Email Address *</label>
            <input className="input" type="email" placeholder="user@seahawk.com" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>

          <div>
            <label className="label">{editUser?.id ? 'New Password (blank = keep current)' : 'Password *'}</label>
            <input className="input" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
              value={form.password} onChange={e => set('password', e.target.value)} />
            {!editUser?.id && <p style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>e.g. Seahawk@2024</p>}
          </div>

          {editUser?.id && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)}
                style={{ width: 15, height: 15, accentColor: '#f97316' }} />
              <span style={{ fontSize: 13, color: C.text }}>Account is active</span>
            </label>
          )}
        </div>
      </Modal>
    </div>
  );
}
