import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── Right panel space canvas (kept from original) ─────────────────────────
function SpaceCanvas() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;
    const resize = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    class Star {
      constructor() { this.reset(true); }
      reset() { this.x = Math.random() * W; this.y = Math.random() * H; this.r = 0.2 + Math.random() * 1.0; this.a = 0.15 + Math.random() * 0.7; this.sp = 0.002 + Math.random() * 0.01; this.ph = Math.random() * Math.PI * 2; }
      draw(t) { const a = this.a * (0.4 + 0.6 * Math.sin(t * this.sp + this.ph)); ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fill(); }
    }
    class Ember {
      constructor(init) { this.reset(init); }
      reset(init) { this.x = Math.random() * W; this.y = init ? H * (0.3 + Math.random() * 0.7) : H + 5; this.vy = -(0.8 + Math.random() * 2.8); this.vx = (Math.random() - 0.5) * 1.6; this.size = 0.5 + Math.random() * 2.0; this.ml = Math.round(H / (0.8 + Math.random() * 2.8) * 1.1); this.life = init ? Math.random() * this.ml : 0; this.wb = Math.random() * Math.PI * 2; this.ws = 0.02 + Math.random() * 0.05; this.wa = 0.2 + Math.random() * 1.2; this.flk = Math.random() * Math.PI * 2; this.flkS = 0.08 + Math.random() * 0.25; this.streak = Math.random() < 0.28; this.angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6; }
      update() { this.life++; this.x += this.vx + Math.sin(this.life * this.ws + this.wb) * this.wa; this.y += this.vy; this.vy *= 0.9992; if (this.life >= this.ml || this.y < -10) this.reset(false); }
      draw() {
        const p = this.life / this.ml; const flk = 0.7 + 0.3 * Math.sin(this.life * this.flkS + this.flk);
        let r, g, b, a;
        if (p < 0.08) { r = 255; g = 230; b = 160; a = 0.95 * flk; }
        else if (p < 0.25) { const t = (p - .08) / .17; r = 255; g = Math.round(190 - t * 90); b = Math.round(20 - t * 20); a = (0.9 - t * .05) * flk; }
        else if (p < 0.5) { const t = (p - .25) / .25; r = 255; g = Math.round(100 - t * 70); b = 0; a = (0.82 - t * .2) * flk; }
        else if (p < 0.75) { const t = (p - .5) / .25; r = Math.round(240 - t * 120); g = Math.round(30 - t * 30); b = 0; a = (0.55 - t * .25) * flk; }
        else { const t = (p - .75) / .25; r = Math.round(110 - t * 80); g = 5; b = 0; a = (0.25 - t * .25) * flk; }
        a = Math.max(0, a);
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(a * 1.5, 1)})`; ctx.fill();
        const halo = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2.5);
        halo.addColorStop(0, `rgba(${r},${g},${b},${a * 0.55})`); halo.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2); ctx.fillStyle = halo; ctx.fill();
      }
    }

    const stars = Array.from({ length: 180 }, () => new Star());
    const embers = Array.from({ length: 160 }, () => new Ember(true));
    let frame = 0;
    const tick = () => {
      frame++;
      ctx.fillStyle = '#060012'; ctx.fillRect(0, 0, W, H);
      const vign = ctx.createLinearGradient(0, H * 0.55, 0, H);
      vign.addColorStop(0, 'rgba(0,0,0,0)'); vign.addColorStop(1, 'rgba(60,15,0,0.5)');
      ctx.fillStyle = vign; ctx.fillRect(0, H * 0.55, W, H * 0.45);
      stars.forEach(s => s.draw(frame));
      ctx.globalCompositeOperation = 'screen';
      embers.forEach(e => { e.update(); e.draw(); });
      ctx.globalCompositeOperation = 'source-over';
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(email.trim(), password, rememberMe);
      if (user?.mustChangePassword) navigate('/change-password?required=1', { replace: true });
      else if (user?.role === 'CLIENT') navigate('/portal', { replace: true });
      else navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password');
      setPassword('');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
    }}>

      {/* ── LEFT: Login form ─────────────────────────────── */}
      <div style={{
        flex: '0 0 auto', width: '100%', maxWidth: 460,
        background: '#ffffff',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 40px',
        position: 'relative', zIndex: 2,
        boxShadow: '4px 0 32px rgba(11,31,58,0.12)',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}>

        {/* Brand */}
        <div style={{ width: '100%', maxWidth: 340, marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <img src="/images/logo.png" alt="Sea Hawk Logo"
              style={{ height: 42, width: 'auto', objectFit: 'contain', borderRadius: 8, padding: 2, border: '1px solid #e2eaf5' }} />
            <div>
              <div style={{ color: '#0b1f3a', fontSize: 16, fontWeight: 800, lineHeight: 1.2 }}>Sea Hawk Courier</div>
              <div style={{ color: '#e8580a', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Management Portal</div>
            </div>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0b1f3a', margin: '0 0 6px', letterSpacing: '-0.4px' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 13, color: '#8a9ab0', margin: '0 0 28px' }}>
            Sign in to continue to your dashboard
          </p>

          {error && (
            <div style={{
              marginBottom: 20, padding: '10px 14px',
              background: '#fdedef', border: '1px solid #f9c4c7',
              borderRadius: 10, color: '#c8303a', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>⚠️ {error}</div>
          )}

          <form onSubmit={handleSubmit} autoComplete="on">
            <label style={{ display: 'block', color: '#5a6b80', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email" name="email" autoComplete="username" autoFocus
              placeholder="admin@seahawk.com"
              value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, background: '#f7faff', border: '1.5px solid #e2eaf5', color: '#0b1f3a', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 16, fontFamily: 'inherit', transition: 'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor = '#e8580a'}
              onBlur={e => e.target.style.borderColor = '#e2eaf5'}
            />

            <label style={{ display: 'block', color: '#5a6b80', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative', marginBottom: 28 }}>
              <input
                type={showPass ? 'text' : 'password'} name="password" autoComplete="current-password"
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required
                style={{ width: '100%', padding: '11px 44px 11px 14px', borderRadius: 10, background: '#f7faff', border: '1.5px solid #e2eaf5', color: '#0b1f3a', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#e8580a'}
                onBlur={e => e.target.style.borderColor = '#e2eaf5'}
              />
              <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8a9ab0', fontSize: 15, padding: 0, lineHeight: 1 }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#5a6b80', marginBottom: 18, userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: 14, height: 14 }}
              />
              Remember me on this device
            </label>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px',
              background: loading ? 'rgba(232,88,10,0.4)' : 'linear-gradient(135deg,#e8580a,#c94000)',
              border: 'none', borderRadius: 11, color: '#fff', fontSize: 14, fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              letterSpacing: '0.02em', fontFamily: 'inherit',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(232,88,10,0.35)',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(232,88,10,0.45)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 20px rgba(232,88,10,0.35)'; }}
            >
              {loading ? (
                <><span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'shkSpin 0.7s linear infinite' }} /> Signing in…</>
              ) : '🚀 Launch Dashboard'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24 }}>
            <Link to="/" style={{ color: '#8a9ab0', fontSize: 12, textDecoration: 'none' }}>
              ← Back to website
            </Link>
          </p>
        </div>
      </div>

      {/* ── RIGHT: Space visual panel ─────────────────────── */}
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        background: '#060012',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}
        className="shk-login-right"
      >
        <SpaceCanvas />

        {/* Overlay content */}
        <div style={{
          position: 'relative', zIndex: 2, textAlign: 'center', padding: 40,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s',
        }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🦅</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', margin: '0 0 12px', letterSpacing: '-0.5px' }}>
            Sea Hawk Courier
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', maxWidth: 280, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Trusted by businesses across India for reliable, tech-powered logistics
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            {[
              { icon: '⚡', text: 'Real-time shipment tracking' },
              { icon: '📊', text: 'Smart analytics dashboard' },
              { icon: '🔐', text: 'Enterprise-grade security' },
            ].map(({ icon, text }) => (
              <div key={text} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 18px', borderRadius: 99,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.65)', fontSize: 13,
              }}>
                <span>{icon}</span> {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes shkSpin { to { transform: rotate(360deg); } }
        *, *::before, *::after { box-sizing: border-box; }
        @media (max-width: 640px) {
          .shk-login-right { display: none !important; }
        }
      `}</style>
    </div>
  );
}
