// ChangePasswordPage.jsx — Forced password change on first login
// Also used for voluntary password changes from profile
import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const REQUIREMENTS = [
  { label: 'At least 8 characters', test: p => p.length >= 8 },
  { label: 'One uppercase letter',  test: p => /[A-Z]/.test(p) },
  { label: 'One number',            test: p => /[0-9]/.test(p) },
  { label: 'One special character (!@#$%^&*)', test: p => /[^A-Za-z0-9]/.test(p) },
];

export default function ChangePasswordPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRequired = searchParams.get('required') === '1';

  const [form, setForm]     = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const passChecks = REQUIREMENTS.map(r => ({ ...r, pass: r.test(form.newPassword) }));
  const allPassed  = passChecks.every(r => r.pass);
  const matches    = form.newPassword && form.newPassword === form.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!allPassed) { setError('Password does not meet requirements'); return; }
    if (!matches)   { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        if (isRequired) navigate('/app', { replace: true });
        else navigate(-1);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0b1f3a, #1a3a6b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', maxWidth: 360 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
          <h2 style={{ fontWeight: 800, color: '#0b1f3a', marginBottom: 8 }}>Password Changed!</h2>
          <p style={{ color: '#6b7280', fontSize: '.85rem' }}>Redirecting you to the dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0b1f3a, #1a3a6b)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/images/logo.png" alt="Sea Hawk" style={{ height: 48, marginBottom: 10 }} onError={e => e.target.style.display = 'none'} />
          <h1 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Sea Hawk Courier & Cargo</h1>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>

          {isRequired && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: '.82rem', color: '#92400e' }}>
              🔐 For security, you must set a new password before continuing.
            </div>
          )}

          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0b1f3a', marginBottom: 6 }}>
            {isRequired ? 'Set Your New Password' : 'Change Password'}
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '.78rem', marginBottom: 24 }}>
            Logged in as <strong>{user?.email}</strong>
          </p>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#dc2626', fontSize: '.82rem' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>Current Password</label>
              <input type="password" value={form.currentPassword} onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
                placeholder="Your current password" required
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>New Password</label>
              <input type="password" value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                placeholder="Create a strong password" required
                style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${form.newPassword ? (allPassed ? '#22c55e' : '#f59e0b') : '#e5e7eb'}`, borderRadius: 8, fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' }} />

              {/* Password strength checklist */}
              {form.newPassword && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {passChecks.map(r => (
                    <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.72rem' }}>
                      <span style={{ color: r.pass ? '#22c55e' : '#9ca3af', fontSize: '.9rem' }}>{r.pass ? '✓' : '○'}</span>
                      <span style={{ color: r.pass ? '#15803d' : '#6b7280' }}>{r.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>Confirm New Password</label>
              <input type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Repeat new password" required
                style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${form.confirmPassword ? (matches ? '#22c55e' : '#ef4444') : '#e5e7eb'}`, borderRadius: 8, fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' }} />
              {form.confirmPassword && !matches && (
                <p style={{ color: '#ef4444', fontSize: '.72rem', marginTop: 4 }}>Passwords do not match</p>
              )}
            </div>

            <button type="submit" disabled={loading || !allPassed || !matches}
              style={{ padding: '12px', background: allPassed && matches ? '#0b1f3a' : '#e5e7eb', color: allPassed && matches ? '#fff' : '#9ca3af', border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 800, cursor: allPassed && matches ? 'pointer' : 'not-allowed', marginTop: 4 }}>
              {loading ? 'Changing...' : '🔐 Change Password'}
            </button>
          </form>

          {!isRequired && (
            <button onClick={() => navigate(-1)}
              style={{ width: '100%', marginTop: 12, padding: '8px', background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, color: '#6b7280', cursor: 'pointer', fontSize: '.78rem' }}>
              ← Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
