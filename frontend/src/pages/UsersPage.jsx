import { useState } from 'react';
import { Plus, Edit2, Check, X, Key, UserCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { PageLoader } from '../components/ui/Loading';
import { Modal } from '../components/ui/Modal';

export default function UsersPage({ toast }) {
  const { data: users, loading, refetch } = useFetch('/auth/users');
  const [editUser, setEdit] = useState(null);
  const [saving,   setSaving] = useState(false);
  const empty = { name:'', email:'', password:'', role:'STAFF', branch:'', active:true };
  const [form, setForm] = useState(empty);

  const open = (u = null) => {
    setEdit(u || {});
    setForm(u ? {...u, password:''} : empty);
  };

  const save = async () => {
    if (!form.name || !form.email) { toast?.('Name and email are required', 'error'); return; }
    if (!editUser?.id && !form.password) { toast?.('Password is required for new users', 'error'); return; }

    setSaving(true);
    try {
      if (editUser?.id) {
        const payload = {...form};
        if (!payload.password) delete payload.password;
        await api.put(`/auth/users/${editUser.id}`, payload);
      } else {
        await api.post('/auth/users', form);
      }
      await refetch();
      setEdit(null);
      toast?.(editUser?.id ? 'User updated ✓' : 'User created ✓', 'success');
    } catch (err) { toast?.(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const set = (k,v) => setForm(f => ({...f, [k]: v}));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Admin only · Control who can access the system</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/profile" className="btn-secondary btn-sm gap-1.5">
            <Key className="w-3.5 h-3.5" /> Change My Password
          </Link>
          <button onClick={() => open()} className="btn-primary btn-sm gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add User
          </button>
        </div>
      </div>

      {loading ? <PageLoader /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(users||[]).map(u => (
            <div key={u.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 ${{ ADMIN:'bg-red-500', OPS_MANAGER:'bg-orange-500', STAFF:'bg-navy-600', WAREHOUSE:'bg-green-600', CLIENT:'bg-purple-600' }[u.role] || 'bg-navy-600'}`}>
                {u.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">{u.name}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                  <button onClick={() => open(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg shrink-0 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`badge text-[10px] ${{ ADMIN:'badge-red', OPS_MANAGER:'badge-orange', STAFF:'badge-blue', WAREHOUSE:'badge-green', CLIENT:'badge-purple' }[u.role] || 'badge-blue'}`}>{u.role}</span>
                  {u.branch && <span className="badge badge-gray text-[10px]">{u.branch}</span>}
                  {u.active
                    ? <span className="badge badge-green text-[10px]">Active</span>
                    : <span className="badge badge-red text-[10px]">Inactive</span>
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editUser} onClose={() => setEdit(null)}
        title={editUser?.id ? `Edit — ${editUser.name}` : 'New User'}
        footer={<>
          <button onClick={() => setEdit(null)} className="btn-secondary">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save User'}</button>
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
            {!editUser?.id && <p className="text-[10px] text-gray-400 mt-0.5">Minimum 6 characters</p>}
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
