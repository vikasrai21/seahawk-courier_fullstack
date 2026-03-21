// LoginPage.jsx — Enterprise-grade, dark premium + navy style
import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Password strength checker
function getStrength(p) {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8)              s++;
  if (/[A-Z]/.test(p))            s++;
  if (/[0-9]/.test(p))            s++;
  if (/[^A-Za-z0-9]/.test(p))     s++;
  if (p.length >= 12)             s++;
  return s;
}
const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
const STRENGTH_COLOR = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const emailRef = useRef();

  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [attempts,  setAttempts]  = useState(0);
  const [shake,     setShake]     = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (user) navigate(user.role === 'CLIENT' ? '/portal' : '/app', { replace: true });
  }, [user]);

  useEffect(() => { emailRef.current?.focus(); }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      const { redirectTo } = await login(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const msg = err.message || 'Invalid credentials';
      setError(msg);
      setAttempts(a => a + 1);
      triggerShake();
      // Clear password on error
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const strength  = getStrength(password);
  const isLocked  = error.toLowerCase().includes('locked');
  const remaining = error.match(/(\d+) attempt/)?.[1];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #060d1a 0%, #0b1f3a 45%, #0f2d52 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Glow blobs */}
      <div style={{ position:'absolute', top:'-10%', left:'-5%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(232,88,10,0.12) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-10%', right:'-5%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'linear-gradient(135deg, #e8580a, #c94d08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(232,88,10,0.35)',
          }}>🦅</div>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.3px' }}>
            Sea Hawk Courier
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: 0 }}>
            Management Portal
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 20,
          padding: '36px 36px 32px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          animation: shake ? 'shake 0.5s ease' : 'none',
        }}>

          <div style={{ marginBottom: 28 }}>
            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.3px' }}>
              Sign in
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>
              Enter your credentials to access the portal
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div style={{
              marginBottom: 20, padding: '12px 14px',
              background: isLocked ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${isLocked ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)'}`,
              borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{isLocked ? '🔒' : '⚠️'}</span>
              <div>
                <p style={{ color: isLocked ? '#fbbf24' : '#fca5a5', fontSize: 13, margin: 0, fontWeight: 600 }}>
                  {error}
                </p>
                {remaining && (
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '3px 0 0' }}>
                    {attempts >= 3 && 'Tip: Check Caps Lock is off.'}
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="on">

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Email Address
              </label>
              <input
                ref={emailRef}
                type="email"
                autoComplete="email"
                placeholder="you@seahawk.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                required
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', fontSize: 14, outline: 'none',
                  transition: 'border .2s', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(232,88,10,0.7)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  required
                  style={{
                    width: '100%', padding: '12px 44px 12px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff', fontSize: 14, outline: 'none',
                    transition: 'border .2s', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(232,88,10,0.7)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.4)', fontSize: 16, padding: 4,
                    lineHeight: 1,
                  }}
                  title={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>

              {/* Password strength bar */}
              {password.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: i <= strength ? STRENGTH_COLOR[strength] : 'rgba(255,255,255,0.1)',
                        transition: 'background .3s',
                      }} />
                    ))}
                  </div>
                  <p style={{ color: STRENGTH_COLOR[strength] || 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>
                    {STRENGTH_LABEL[strength]}
                  </p>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || isLocked}
              style={{
                width: '100%', padding: '13px',
                background: loading || isLocked
                  ? 'rgba(232,88,10,0.4)'
                  : 'linear-gradient(135deg, #e8580a, #c94d08)',
                border: 'none', borderRadius: 10,
                color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: loading || isLocked ? 'not-allowed' : 'pointer',
                marginTop: 20,
                transition: 'opacity .2s, transform .1s',
                boxShadow: loading || isLocked ? 'none' : '0 4px 16px rgba(232,88,10,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseEnter={e => { if (!loading && !isLocked) e.target.style.opacity = '0.92'; }}
              onMouseLeave={e => { e.target.style.opacity = '1'; }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    display: 'inline-block', animation: 'spin 0.7s linear infinite',
                  }} />
                  Signing in…
                </>
              ) : isLocked ? '🔒 Account Locked' : 'Sign in →'}
            </button>
          </form>

          {/* Security badges */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            {['🔒 256-bit SSL', '🛡️ Rate limited', '⏱️ Auto-logout'].map(badge => (
              <span key={badge} style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>{badge}</span>
            ))}
          </div>
        </div>

        {/* Back to website */}
        <p style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none' }}>
            ← Back to website
          </Link>
        </p>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          15%      { transform: translateX(-8px); }
          30%      { transform: translateX(8px); }
          45%      { transform: translateX(-6px); }
          60%      { transform: translateX(6px); }
          75%      { transform: translateX(-3px); }
          90%      { transform: translateX(3px); }
        }
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px rgba(11,31,58,0.95) inset !important;
          -webkit-text-fill-color: #fff !important;
        }
      `}</style>
    </div>
  );
}
