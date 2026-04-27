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
  const [showPassword, setShowPassword] = useState(false);

  // If already logged in as CLIENT, go to portal
  useEffect(() => {
    if (user?.role === 'CLIENT') navigate('/portal', { replace: true });
    else if (user) navigate('/app', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    try {
      const savedEmail = window.localStorage.getItem(REMEMBERED_CLIENT_LOGIN_EMAIL_KEY);
      if (savedEmail) setForm((prev) => ({ ...prev, email: savedEmail }));
    } catch (err) {
      console.debug('[ClientLoginPage] Failed to read remembered email:', err);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const normalizedEmail = form.email.trim();
      const loggedIn = await login(normalizedEmail, form.password, rememberMe);
      try {
        if (rememberMe) window.localStorage.setItem(REMEMBERED_CLIENT_LOGIN_EMAIL_KEY, normalizedEmail);
        else window.localStorage.removeItem(REMEMBERED_CLIENT_LOGIN_EMAIL_KEY);
      } catch (err) {
        console.debug('[ClientLoginPage] Failed to persist remembered email:', err);
      }
      if (loggedIn.role === 'CLIENT') {
        navigate('/portal', { replace: true });
      } else {
        // Staff/Admin who accidentally hit this page
        navigate('/app', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
      setForm((prev) => ({ ...prev, password: '' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top left, rgba(249,115,22,0.16), transparent 28rem), radial-gradient(circle at top right, rgba(56,189,248,0.14), transparent 26rem), linear-gradient(135deg, #091525 0%, #0f2442 52%, #132f57 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 980, display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 24 }} className="shk-client-login-shell">
        <div style={{
          borderRadius: 28,
          padding: '40px 36px',
          color: '#f8fafc',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04))',
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: '0 28px 60px rgba(2,6,23,0.32)',
          backdropFilter: 'blur(18px)',
          minHeight: 560,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
              <img src="/images/logo.png" alt="Sea Hawk Courier" style={{ height: 52, width: 'auto', borderRadius: 12, background: '#fff', padding: 4 }} onError={e => e.target.style.display='none'} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>Sea Hawk Courier & Cargo</div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.62)' }}>Client Access</div>
              </div>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, padding: '8px 14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fcd34d', marginBottom: 24 }}>
              Premium Portal
            </div>
            <h1 style={{ fontSize: 40, lineHeight: 1.05, margin: '0 0 14px', fontWeight: 800, letterSpacing: '-0.04em' }}>
              Complete visibility into your logistics operations.
            </h1>
            <p style={{ margin: 0, maxWidth: 460, color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.7 }}>
              Shipment visibility, invoices, pickups, wallet history, returns, and live tracking in one clean client workspace.
            </p>
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            {[
              'Live shipment visibility with branded tracking',
              'Invoice, wallet, POD, and pickup workflows in one place',
              'Secure role-based access for client teams',
            ].map((item) => (
              <div key={item} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 18,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.88)',
                fontSize: 14,
                fontWeight: 600,
              }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'linear-gradient(135deg,#fb923c,#38bdf8)', boxShadow: '0 0 0 6px rgba(255,255,255,0.04)' }} />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.96)',
          borderRadius: 28,
          padding: 36,
          boxShadow: '0 28px 70px rgba(15,23,42,0.24)',
          border: '1px solid rgba(255,255,255,0.7)',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ color: '#f97316', fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>Client Portal</div>
            <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.04em' }}>Sign in to continue</h2>
            <p style={{ color: '#64748b', fontSize: '.92rem', margin: 0, lineHeight: 1.6 }}>
              Access shipments, invoices, wallet balance, support, and delivery intelligence from one secure workspace.
            </p>
          </div>

          {error && (
            <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 14, padding: '12px 14px', marginBottom: 18, color: '#be123c', fontSize: '.88rem', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="on" name="client-login" method="post" action="/portal/login" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '.76rem', fontWeight: 800, color: '#334155', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Email Address</label>
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
                style={{ width: '100%', padding: '13px 14px', border: '1.5px solid #dbe4ee', borderRadius: 14, fontSize: '.96rem', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', color: '#0f172a' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.76rem', fontWeight: 800, color: '#334155', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={form.password}
                  onChange={e => setForm(f => ({...f, password: e.target.value}))}
                  placeholder="Enter your password"
                  required
                  style={{ width: '100%', padding: '13px 48px 13px 14px', border: '1.5px solid #dbe4ee', borderRadius: 14, fontSize: '.96rem', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', color: '#0f172a' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#64748b', fontWeight: 700, fontSize: '.78rem', cursor: 'pointer', padding: 4 }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '.82rem', color: '#475569', userSelect: 'none' }}>
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
              style={{ padding: '14px 16px', background: loading ? 'linear-gradient(135deg,#fdba74,#fb923c)' : 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', border: 'none', borderRadius: 14, fontSize: '1rem', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 6, boxShadow: loading ? 'none' : '0 18px 30px -20px rgba(249,115,22,0.85)', letterSpacing: '0.01em' }}
            >
              {loading ? 'Signing in...' : 'Sign In to Client Portal'}
            </button>
          </form>

          <div style={{ marginTop: 22, paddingTop: 20, borderTop: '1px solid #edf2f7', textAlign: 'center' }}>
            <p style={{ color: '#64748b', fontSize: '.82rem', lineHeight: 1.6, margin: 0 }}>
              Having trouble? Contact us at{' '}
              <a href="tel:+919911565523" style={{ color: '#0f172a', fontWeight: 800, textDecoration: 'none' }}>+91 99115 65523</a>
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 22, fontSize: '.8rem' }}>
            <Link to="/login" style={{ color: '#475569', textDecoration: 'none', fontWeight: 700 }}>
              Staff / Admin login
            </Link>
            <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 700 }}>
              Back to website
            </Link>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .shk-client-login-shell {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
