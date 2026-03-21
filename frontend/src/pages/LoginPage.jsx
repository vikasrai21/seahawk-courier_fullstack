import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      if (user?.role === 'CLIENT') {
        navigate('/portal', { replace: true });
      } else {
        navigate('/app', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #060d1a 0%, #0b1f3a 50%, #0f2d52 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 68, height: 68, borderRadius: 18,
            background: 'linear-gradient(135deg, #e8580a, #c94d08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, margin: '0 auto 14px',
            boxShadow: '0 8px 24px rgba(232,88,10,0.4)',
          }}>🦅</div>
          <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>
            Sea Hawk Courier & Cargo
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>
            Management Portal
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: '32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}>
          <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 6px' }}>
            Sign in to your account
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: '0 0 24px' }}>
            Enter your credentials to continue
          </p>

          {error && (
            <div style={{
              marginBottom: 18, padding: '10px 14px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, color: '#fca5a5', fontSize: 13,
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', color: 'rgba(255,255,255,0.5)',
                fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.07em', marginBottom: 8,
              }}>Email Address</label>
              <input
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="admin@seahawk.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', fontSize: 14, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block', color: 'rgba(255,255,255,0.5)',
                fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.07em', marginBottom: 8,
              }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '11px 44px 11px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff', fontSize: 14, outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.35)', fontSize: 15, padding: 0,
                  }}
                >{showPass ? '🙈' : '👁️'}</button>
              </div>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px',
                background: loading
                  ? 'rgba(232,88,10,0.4)'
                  : 'linear-gradient(135deg, #e8580a, #c94d08)',
                border: 'none', borderRadius: 10,
                color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8,
                boxShadow: loading ? 'none' : '0 4px 14px rgba(232,88,10,0.4)',
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 15, height: 15,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  Signing in…
                </>
              ) : 'Sign in →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textDecoration: 'none' }}>
            ← Back to website
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #0b1f3a inset !important;
          -webkit-text-fill-color: #fff !important;
        }
      `}</style>
    </div>
  );
}