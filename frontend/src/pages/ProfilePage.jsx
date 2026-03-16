import { useState } from 'react';
import { Lock, User, Mail, Building, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage({ toast }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [saving, setSaving] = useState(false);
  const [done,   setDone]   = useState(false);

  const set = (k,v) => setForm(f => ({...f, [k]: v}));

  const changePassword = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast?.('New passwords do not match', 'error'); return;
    }
    if (form.newPassword.length < 6) {
      toast?.('Password must be at least 6 characters', 'error'); return;
    }
    setSaving(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
      });
      setForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
      setDone(true);
      toast?.('Password changed successfully!', 'success');
      setTimeout(() => setDone(false), 4000);
    } catch (err) {
      toast?.(err.message || 'Failed to change password', 'error');
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      {/* User info card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-navy-600 flex items-center justify-center text-white text-xl font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{user?.name}</h2>
            <span className={`badge text-xs ${user?.role === 'ADMIN' ? 'badge-red' : 'badge-blue'}`}>{user?.role}</span>
          </div>
        </div>
        <div className="space-y-2.5">
          <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={user?.email} />
          <InfoRow icon={<Building className="w-4 h-4" />} label="Branch" value={user?.branch || '—'} />
          <InfoRow icon={<User className="w-4 h-4" />} label="Account Status" value={
            <span className="badge badge-green text-[10px]">Active</span>
          } />
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Lock className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Change Password</h2>
            <p className="text-xs text-gray-500">Choose a strong password with at least 6 characters</p>
          </div>
        </div>

        {done && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" /> Password changed successfully!
          </div>
        )}

        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" placeholder="Your current password"
              value={form.currentPassword} onChange={e => set('currentPassword', e.target.value)} required />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" placeholder="At least 6 characters"
              value={form.newPassword} onChange={e => set('newPassword', e.target.value)} required />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className="input" placeholder="Repeat new password"
              value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required />
            {form.confirmPassword && form.newPassword !== form.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>
          <button type="submit" disabled={saving || (form.confirmPassword && form.newPassword !== form.confirmPassword)}
            className="btn-primary">
            {saving ? 'Changing…' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-5 text-gray-400">{icon}</div>
      <span className="text-xs text-gray-500 w-24 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  );
}
