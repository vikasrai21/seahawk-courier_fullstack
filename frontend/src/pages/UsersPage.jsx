import { useState } from 'react';
import { Plus, Edit2, Key, UserCircle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { PageLoader } from '../components/ui/Loading';
import { Modal } from '../components/ui/Modal';

const ROLE_COLORS = {
  ADMIN:       'bg-red-500',
  OPS_MANAGER: 'bg-orange-500',
  STAFF:       'bg-blue-600',
  WAREHOUSE:   'bg-green-600',
  CLIENT:      'bg-purple-600',
};
const BADGE_COLORS = {
  ADMIN:       'badge-red',
  OPS_MANAGER: 'badge-orange',
  STAFF:       'badge-blue',
  WAREHOUSE:   'badge-green',
  CLIENT:      'badge-purple',
};

export default function UsersPage({ toast }) {
  const { data: users, loading, refetch } = useFetch('/auth/users');
  const { data: clients } = useFetch('/clients');
  const [editUser, setEdit]   = useState(null);
  const [saving,   setSaving] = useState(false);

  const empty = { name:'', email:'', password:'', role:'STAFF', branch:'', phone:'', clientCode:'', active:true };
  const [form, setForm] = useState(empty);

  const open = (u = null) => {
    setEdit(u || {});
    setForm(u ? { ...u, password: '', clientCode: u.clientCode || '' } : empty);
  };

  const save = async () => {
    if (!form.name || !form.email) { toast?.('Name and email are required', 'error'); return; }
    if (!editUser?.id && !form.password) { toast?.('Password is required for new users', 'error'); return; }
    if (form.role === 'CLIENT' && !form.clientCode) { toast?.('Client code is required for CLIENT role', 'error'); return; }

    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (form.role !== 'CLIENT') delete payload.clientCode;

      if (editUser?.id) {
        await api.put(`/auth/users/${editUser.id}`, payload);
      } else {
        await api.post('/auth/users', payload);
      }
      await refetch();
      setEdit(null);
      toast?.(editUser?.id ? 'User updated ✓' : 'User created ✓', 'success');
    } catch (err) { toast?.(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Group users by role for display
  const clientUsers = (users || []).filter(u => u.role === 'CLIENT');
  const staffUsers  = (users || []).filter(u => u.role !== 'CLIENT');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Admin only · Manage staff accounts and client portal access</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/app/profile" className="btn-secondary btn-sm gap-1.5">
            <Key className="w-3.5 h-3.5" /> My Password
          </Link>
          <button onClick={() => open()} className="btn-primary btn-sm gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add User
          </button>
        </div>
      </div>

      {loading ? <PageLoader /> : (
        <div className="space-y-8">
          {/* ── Staff / Admin users ── */}
          <div>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
              Staff & Admin ({staffUsers.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {staffUsers.map(u => (
                <UserCard key={u.id} user={u} onEdit={() => open(u)} />
              ))}
            </div>
          </div>

          {/* ── Client portal users ── */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Client Portal Users ({clientUsers.length})
              </h2>
              <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2 py-0.5 font-semibold">
                Login at /client-login
              </span>
            </div>
            {clientUsers.length === 0 ? (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center">
                <div className="text-3xl mb-2">👤</div>
                <p className="text-sm text-gray-500 font-medium">No client portal users yet</p>
                <p className="text-xs text-gray-400 mt-1">Add a user with role "Client" to give a client access to their portal</p>
                <button onClick={() => { open(); set('role', 'CLIENT'); }} className="btn-primary btn-sm mt-3">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Client User
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {clientUsers.map(u => (
                  <UserCard key={u.id} user={u} onEdit={() => open(u)} showClient />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Create/Edit Modal ── */}
      <Modal
        open={!!editUser}
        onClose={() => setEdit(null)}
        title={editUser?.id ? `Edit — ${editUser.name}` : 'New User'}
        footer={<>
          <button onClick={() => setEdit(null)} className="btn-secondary">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save User'}
          </button>
        </>}
      >
        <div className="space-y-3">
          <div>
            <label className="label">Full Name *</label>
            <input className="input" placeholder="e.g. Rahul Sharma" value={form.name}
              onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className="label">Email *</label>
            <input className="input" type="email" placeholder="rahul@seahawk.com" value={form.email}
              onChange={e => set('email', e.target.value)} />
          </div>
          <div>
            <label className="label">{editUser?.id ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
            <input className="input" type="password" placeholder="••••••••" value={form.password}
              onChange={e => set('password', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
                <option value="OPS_MANAGER">Operations Manager</option>
                <option value="WAREHOUSE">Warehouse Staff</option>
                <option value="CLIENT">Client (Portal Access)</option>
              </select>
            </div>
            <div>
              <label className="label">Branch</label>
              <input className="input" placeholder="Main / Branch 1" value={form.branch}
                onChange={e => set('branch', e.target.value)} />
            </div>
          </div>

          {/* CLIENT-specific field */}
          {form.role === 'CLIENT' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <label className="label text-purple-700">Client Account *</label>
              <select className="input" value={form.clientCode} onChange={e => set('clientCode', e.target.value)}>
                <option value="">— Select client —</option>
                {(clients || []).map(c => (
                  <option key={c.code} value={c.code}>{c.company} ({c.code})</option>
                ))}
              </select>
              <p className="text-[10px] text-purple-600 mt-1.5">
                This user will only see shipments and invoices for the selected client account.
              </p>
            </div>
          )}

          {editUser?.id && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)}
                className="w-4 h-4 rounded accent-navy-600" />
              <span className="text-sm text-gray-700">Account is active</span>
            </label>
          )}
        </div>
      </Modal>
    </div>
  );
}

function UserCard({ user: u, onEdit, showClient }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 ${ROLE_COLORS[u.role] || 'bg-navy-600'}`}>
        {u.name?.[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="font-bold text-sm text-gray-900 truncate">{u.name}</p>
            <p className="text-xs text-gray-500 truncate">{u.email}</p>
            {showClient && u.clientCode && (
              <p className="text-xs text-purple-600 font-semibold mt-0.5">Client: {u.clientCode}</p>
            )}
          </div>
          <button onClick={onEdit} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg shrink-0 transition-colors">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className={`badge text-[10px] ${BADGE_COLORS[u.role] || 'badge-blue'}`}>{u.role}</span>
          {u.branch && <span className="badge badge-gray text-[10px]">{u.branch}</span>}
          {u.active
            ? <span className="badge badge-green text-[10px]">Active</span>
            : <span className="badge badge-red text-[10px]">Inactive</span>
          }
        </div>
      </div>
    </div>
  );
}
