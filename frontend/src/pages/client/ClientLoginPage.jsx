// ClientLoginPage.jsx — Separate login page for CLIENT portal users
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";

const REMEMBERED_CLIENT_LOGIN_EMAIL_KEY = 'shk_client_login_email';

export default function ClientLoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // If already logged in as CLIENT, go to portal
  useEffect(() => {
    if (user?.role === 'CLIENT') navigate('/portal', { replace: true });
    else if (user) navigate('/app', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    try {
      const savedEmail = window.localStorage.getItem(REMEMBERED_CLIENT_LOGIN_EMAIL_KEY);
      if (savedEmail) setForm((prev) => ({ ...prev, email: savedEmail }));
    } catch {}
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedIn = await login(form.email, form.password, rememberMe);
      try {
        if (rememberMe) window.localStorage.setItem(REMEMBERED_CLIENT_LOGIN_EMAIL_KEY, form.email.trim());
        else window.localStorage.removeItem(REMEMBERED_CLIENT_LOGIN_EMAIL_KEY);
      } catch {}
      if (loggedIn.role === 'CLIENT') {
        navigate('/portal', { replace: true });
      } else {
        // Staff/Admin who accidentally hit this page
        navigate('/app', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0b1f3a 0%, #1a3a6b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/images/logo.png" alt="Sea Hawk Courier" style={{ height: 60, marginBottom: 12 }} onError={e => e.target.style.display='none'} />
          <h1 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Sea Hawk Courier & Cargo</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '.85rem', marginTop: 6 }}>Client Portal</p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0b1f3a', marginBottom: 6 }}>Sign in to your account</h2>
          <p style={{ color: '#888', fontSize: '.8rem', marginBottom: 24 }}>View your shipments, invoices and wallet balance</p>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#dc2626', fontSize: '.85rem' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="on" name="client-login" method="post" action="/portal/login" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={form.email}
                onChange={e => setForm(f => ({...f, email: e.target.value}))}
                placeholder="your@email.com"
                required
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>Password</label>
              <input
                type="password"
                id="password"
                name="password"
                autoComplete="current-password"
                autoCapitalize="none"
                spellCheck={false}
                value={form.password}
                onChange={e => setForm(f => ({...f, password: e.target.value}))}
                placeholder=""
                required
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.78rem', color: '#475569', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: 14, height: 14 }}
              />
              Remember me on this device
            </label>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '12px', background: loading ? '#9ca3af' : '#e8580a', color: '#fff', border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8 }}
            >
              {loading ? 'Signing in...' : '🔐 Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
            <p style={{ color: '#888', fontSize: '.78rem' }}>
              Having trouble? Contact us at{' '}
              <a href="tel:+919911565523" style={{ color: '#0b1f3a', fontWeight: 700 }}>+91 99115 65523</a>
            </p>
          </div>
        </div>

        {/* Link to staff login */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/login" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '.78rem', textDecoration: 'none' }}>
            Staff / Admin login →
          </Link>
        </div>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <Link to="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '.72rem', textDecoration: 'none' }}>
            ← Back to website
          </Link>
        </div>
      </div>
    </div>
  );
}
