// LoginPage.jsx — Two-step login: credentials → OTP → dashboard
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const PASSWORD_HINTS = [
  'At least 8 characters',
  'One uppercase letter',
  'One number',
  'One special character (!@#$%^&*)',
];

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep]     = useState('credentials'); // 'credentials' | 'otp'
  const [form, setForm]     = useState({ email: '', password: '' });
  const [otp,  setOtp]      = useState(['', '', '', '', '', '']);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [devOtp, setDevOtp] = useState(''); // dev only
  const [error, setError]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);

  // Redirect if already logged in
  useEffect(() => {
    if (user?.role === 'CLIENT') navigate('/client-portal', { replace: true });
    else if (user) navigate('/app', { replace: true });
  }, [user]);

  // Resend OTP countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // ── Step 1: Submit credentials ──────────────────────────────────────────
  const handleCredentials = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      setMaskedEmail(res.maskedEmail || form.email);
      if (res.devOtp) setDevOtp(res.devOtp); // dev only
      setStep('otp');
      setResendTimer(60);
      // Auto-focus first OTP box
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  // ── OTP input handling ──────────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    // Auto-advance
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all 6 filled
    if (value && index === 5 && next.every(d => d)) {
      submitOTP(next.join(''));
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter' && otp.every(d => d)) {
      submitOTP(otp.join(''));
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const next = pasted.split('');
      setOtp(next);
      otpRefs.current[5]?.focus();
      setTimeout(() => submitOTP(pasted), 100);
    }
    e.preventDefault();
  };

  // ── Step 2: Submit OTP ──────────────────────────────────────────────────
  const submitOTP = async (otpValue) => {
    setError('');
    setLoading(true);
    try {
      const res = await login(null, null, { email: form.email, otp: otpValue });
      if (res?.mustChangePassword) {
        navigate('/change-password?required=1', { replace: true });
      } else if (res?.role === 'CLIENT') {
        navigate('/client-portal', { replace: true });
      } else {
        navigate('/app', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } finally { setLoading(false); }
  };

  // ── Resend OTP ──────────────────────────────────────────────────────────
  const resendOTP = async () => {
    setError('');
    try {
      await api.post('/auth/resend-otp', { email: form.email });
      setResendTimer(60);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) { setError(err.message); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0b1f3a 0%, #1a3a6b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/images/logo.png" alt="Sea Hawk" style={{ height: 60, marginBottom: 12 }} onError={e => e.target.style.display = 'none'} />
          <h1 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Sea Hawk Courier & Cargo</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '.85rem', marginTop: 6 }}>Management Portal</p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

          {/* ── STEP 1: Credentials ── */}
          {step === 'credentials' && (
            <>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0b1f3a', marginBottom: 6 }}>Sign in to your account</h2>
              <p style={{ color: '#9ca3af', fontSize: '.78rem', marginBottom: 24 }}>Enter your credentials to receive a login OTP</p>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#dc2626', fontSize: '.82rem' }}>
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleCredentials} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>Email Address</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="admin@seahawk.com" required autoFocus
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>Password</label>
                  <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••" required
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" disabled={loading}
                  style={{ padding: '12px', background: loading ? '#9ca3af' : '#0b1f3a', color: '#fff', border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}>
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                      Sending OTP...
                    </span>
                  ) : '🔐 Send Login OTP'}
                </button>
              </form>
            </>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === 'otp' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📧</div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0b1f3a', marginBottom: 6 }}>Enter your OTP</h2>
                <p style={{ color: '#6b7280', fontSize: '.82rem', lineHeight: 1.5 }}>
                  We sent a 6-digit code to<br />
                  <strong style={{ color: '#0b1f3a' }}>{maskedEmail}</strong>
                </p>
                {devOtp && (
                  <div style={{ marginTop: 8, padding: '6px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: '.75rem', color: '#92400e' }}>
                    🛠️ Dev mode OTP: <strong style={{ fontFamily: 'monospace', letterSpacing: 4 }}>{devOtp}</strong>
                  </div>
                )}
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#dc2626', fontSize: '.82rem', textAlign: 'center' }}>
                  ⚠️ {error}
                </div>
              )}

              {/* OTP boxes */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }} onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input key={i} ref={el => otpRefs.current[i] = el}
                    type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    disabled={loading}
                    style={{
                      width: 48, height: 56, textAlign: 'center', fontSize: '1.5rem', fontWeight: 800,
                      fontFamily: 'monospace', border: `2px solid ${digit ? '#0b1f3a' : '#e5e7eb'}`,
                      borderRadius: 10, outline: 'none', background: digit ? '#f0f4ff' : '#fff',
                      transition: 'all 0.15s', color: '#0b1f3a',
                    }} />
                ))}
              </div>

              {loading && (
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <span style={{ display: 'inline-block', width: 20, height: 20, border: '2px solid #e5e7eb', borderTopColor: '#0b1f3a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ marginLeft: 8, color: '#6b7280', fontSize: '.82rem' }}>Verifying...</span>
                </div>
              )}

              <button onClick={() => submitOTP(otp.join(''))} disabled={loading || otp.some(d => !d)}
                style={{ width: '100%', padding: '12px', background: otp.every(d => d) ? '#0b1f3a' : '#e5e7eb', color: otp.every(d => d) ? '#fff' : '#9ca3af', border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 800, cursor: otp.every(d => d) ? 'pointer' : 'not-allowed', marginBottom: 16 }}>
                ✓ Verify OTP
              </button>

              <div style={{ textAlign: 'center', fontSize: '.78rem' }}>
                {resendTimer > 0 ? (
                  <span style={{ color: '#9ca3af' }}>Resend OTP in {resendTimer}s</span>
                ) : (
                  <button onClick={resendOTP} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '.78rem', fontWeight: 700 }}>
                    Didn't receive it? Resend OTP
                  </button>
                )}
              </div>

              <button onClick={() => { setStep('credentials'); setError(''); setOtp(['','','','','','']); }}
                style={{ width: '100%', marginTop: 12, padding: '8px', background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, color: '#6b7280', cursor: 'pointer', fontSize: '.78rem' }}>
                ← Back to login
              </button>
            </>
          )}

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
            <Link to="/" style={{ color: '#9ca3af', fontSize: '.72rem', textDecoration: 'none' }}>← Back to website</Link>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
