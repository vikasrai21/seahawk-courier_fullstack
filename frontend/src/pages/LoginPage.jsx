import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ── Canvas fire particle system ─────────────────────────────────────────── */
function FireCanvas() {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // ── Particle class ──────────────────────────────────────────────────────
    class Particle {
      constructor() { this.reset(true); }

      reset(initial = false) {
        const w = canvas.width;
        const h = canvas.height;

        // Spread across bottom, bias toward center
        const spread = w * 0.55;
        this.x  = w / 2 + (Math.random() - 0.5) * spread;
        this.y  = initial ? h * (0.7 + Math.random() * 0.3) : h + 10;

        // Upward velocity with slight horizontal drift
        this.vy = -(1.2 + Math.random() * 3.5);
        this.vx = (Math.random() - 0.5) * 1.2;

        // Size: big at bottom, shrinks as it rises
        this.size     = 3 + Math.random() * 10;
        this.maxLife  = 80 + Math.random() * 120;
        this.life     = initial ? Math.random() * this.maxLife : 0;

        // Colour phase: white-yellow core → orange → red → dark red → transparent
        this.type = Math.random();   // 0-0.3 = ember, rest = flame
      }

      update() {
        this.life++;
        this.x  += this.vx + Math.sin(this.life * 0.05) * 0.4;
        this.y  += this.vy;
        this.vy *= 0.995;           // slight drag
        this.size *= 0.993;
        if (this.life >= this.maxLife || this.size < 0.3) this.reset();
      }

      draw() {
        const progress = this.life / this.maxLife;   // 0 → 1
        let r, g, b, a;

        if (this.type < 0.15) {
          // Bright ember / spark — small, white-hot
          r = 255; g = 240; b = 180;
          a = (1 - progress) * 0.9;
        } else if (progress < 0.2) {
          // Core: white → yellow
          const t = progress / 0.2;
          r = 255; g = 255; b = Math.round(255 * (1 - t));
          a = 0.85;
        } else if (progress < 0.5) {
          // Yellow → orange
          const t = (progress - 0.2) / 0.3;
          r = 255; g = Math.round(200 - t * 90); b = 0;
          a = 0.75 - t * 0.1;
        } else if (progress < 0.78) {
          // Orange → deep red
          const t = (progress - 0.5) / 0.28;
          r = Math.round(255 - t * 60); g = Math.round(110 - t * 80); b = 0;
          a = 0.6 - t * 0.25;
        } else {
          // Deep red → transparent smoke
          const t = (progress - 0.78) / 0.22;
          r = 80; g = 20; b = 10;
          a = 0.3 * (1 - t);
        }

        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.size
        );
        gradient.addColorStop(0,   `rgba(${r},${g},${b},${a})`);
        gradient.addColorStop(0.4, `rgba(${r},${g},${b},${a * 0.6})`);
        gradient.addColorStop(1,   `rgba(${r},${g},${b},0)`);

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    }

    // ── Star field ──────────────────────────────────────────────────────────
    class Star {
      constructor() {
        this.x    = Math.random() * canvas.width;
        this.y    = Math.random() * canvas.height * 0.85;
        this.r    = Math.random() * 1.5;
        this.alpha= 0.3 + Math.random() * 0.7;
        this.twinkleSpeed = 0.005 + Math.random() * 0.02;
        this.phase = Math.random() * Math.PI * 2;
      }
      draw(t) {
        const a = this.alpha * (0.5 + 0.5 * Math.sin(t * this.twinkleSpeed + this.phase));
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
      }
    }

    // ── Init ────────────────────────────────────────────────────────────────
    const PARTICLE_COUNT = 220;
    const STAR_COUNT     = 180;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());
    const stars     = Array.from({ length: STAR_COUNT },     () => new Star());
    let   frame     = 0;

    // ── Loop ────────────────────────────────────────────────────────────────
    const tick = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Stars
      stars.forEach(s => s.draw(frame));

      // Ground glow
      const groundGrad = ctx.createLinearGradient(0, canvas.height * 0.75, 0, canvas.height);
      groundGrad.addColorStop(0, 'rgba(232,88,10,0)');
      groundGrad.addColorStop(1, 'rgba(232,88,10,0.18)');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, canvas.height * 0.75, canvas.width, canvas.height * 0.25);

      // Particles (additive blending for glow effect)
      ctx.globalCompositeOperation = 'screen';
      particles.forEach(p => { p.update(); p.draw(); });
      ctx.globalCompositeOperation = 'source-over';

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

/* ── Login Page ──────────────────────────────────────────────────────────── */
export default function LoginPage() {
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => {
    // Slight delay so the card animates in after canvas loads
    const t = setTimeout(() => setMounted(true), 120);
    return () => clearTimeout(t);
  }, []);

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
      background: 'radial-gradient(ellipse at 50% 110%, #1a0a00 0%, #08101f 40%, #040810 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-end',   /* card sits near the fire at the bottom */
      padding: '0 24px 64px',
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Fire canvas */}
      <FireCanvas />

      {/* Seahawk brand — floats at the top of the page */}
      <div style={{
        position: 'fixed', top: 36, left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center', zIndex: 10,
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.8s ease 0.2s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, #f97316, #c94d08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
            boxShadow: '0 0 28px rgba(249,115,22,0.6)',
          }}>🦅</div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.3px' }}>
              Sea Hawk Courier
            </div>
            <div style={{ color: 'rgba(249,115,22,0.7)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Management Portal
            </div>
          </div>
        </div>
      </div>

      {/* Login card — near bottom, above the fire */}
      <div style={{
        width: '100%', maxWidth: 400,
        position: 'relative', zIndex: 10,
        opacity:   mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(32px)',
        transition: 'opacity 0.6s ease 0.3s, transform 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.3s',
      }}>

        {/* Glow behind card from fire below */}
        <div style={{
          position: 'absolute', bottom: -40, left: '50%',
          transform: 'translateX(-50%)',
          width: 340, height: 80,
          background: 'radial-gradient(ellipse, rgba(249,115,22,0.35) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(8px)',
        }} />

        <div style={{
          background: 'rgba(10, 15, 26, 0.82)',
          border: '1px solid rgba(249,115,22,0.2)',
          borderRadius: 20,
          padding: '32px',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 24px 64px rgba(0,0,0,0.7), 0 0 40px rgba(249,115,22,0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}>

          <h2 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.3px' }}>
            Welcome back
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, margin: '0 0 24px' }}>
            Sign in to continue to your dashboard
          </p>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 18, padding: '10px 14px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 10, color: '#fca5a5', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', color: 'rgba(255,255,255,0.4)',
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.08em', marginBottom: 8,
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
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f1f5f9', fontSize: 14, outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.5)'}
                onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <label style={{
                display: 'block', color: 'rgba(255,255,255,0.4)',
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.08em', marginBottom: 8,
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
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f1f5f9', fontSize: 14, outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.5)'}
                  onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.3)', fontSize: 15, padding: 0,
                    lineHeight: 1,
                  }}
                >{showPass ? '🙈' : '👁️'}</button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: loading
                  ? 'rgba(249,115,22,0.3)'
                  : 'linear-gradient(135deg, #f97316, #c94d08)',
                border: 'none', borderRadius: 11,
                color: '#fff', fontSize: 14, fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8,
                letterSpacing: '0.02em',
                boxShadow: loading ? 'none' : '0 0 32px rgba(249,115,22,0.45), 0 4px 14px rgba(0,0,0,0.4)',
                transition: 'box-shadow 0.2s, transform 0.15s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 15, height: 15,
                    border: '2px solid rgba(255,255,255,0.25)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'shkSpin 0.7s linear infinite',
                  }} />
                  Signing in…
                </>
              ) : (
                <>🚀 Launch Dashboard</>
              )}
            </button>
          </form>
        </div>

        {/* Back link */}
        <p style={{ textAlign: 'center', marginTop: 18 }}>
          <Link to="/" style={{
            color: 'rgba(255,255,255,0.25)', fontSize: 12,
            textDecoration: 'none', letterSpacing: '0.02em',
          }}>
            ← Back to website
          </Link>
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');

        @keyframes shkSpin { to { transform: rotate(360deg); } }

        input::placeholder { color: rgba(255,255,255,0.18) !important; }

        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 100px #0a0f1a inset !important;
          -webkit-text-fill-color: #f1f5f9 !important;
          caret-color: #f1f5f9;
        }
      `}</style>
    </div>
  );
}
