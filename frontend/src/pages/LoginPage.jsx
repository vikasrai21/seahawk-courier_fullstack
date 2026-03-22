import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ── Canvas fire system ───────────────────────────────────────────────────── */
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

    // ── Tiny flame particle ─────────────────────────────────────────────────
    // Small, fast, concentrated at the bottom strip — looks like a real fire line
    class Flame {
      constructor() { this.reset(true); }

      reset(initial = false) {
        const w = canvas.width;
        const h = canvas.height;

        // Spawn across full width at the very bottom
        this.x = Math.random() * w;
        this.y = initial ? h - Math.random() * h * 0.18 : h + 2;

        // Fast upward, slow horizontal
        this.vy = -(0.6 + Math.random() * 2.2);
        this.vx = (Math.random() - 0.5) * 1.0;

        // SMALL sizes — this was the key fix
        this.size    = 2 + Math.random() * 7;
        this.maxLife = 35 + Math.random() * 65;
        this.life    = initial ? Math.random() * this.maxLife : 0;

        this.wobbleAmp  = 0.3 + Math.random() * 0.8;
        this.wobbleFreq = 0.08 + Math.random() * 0.12;
        this.wobbleOff  = Math.random() * Math.PI * 2;

        // 15% are tiny bright embers
        this.isEmber = Math.random() < 0.15;
      }

      update() {
        this.life++;
        this.x    += this.vx + Math.sin(this.life * this.wobbleFreq + this.wobbleOff) * this.wobbleAmp;
        this.y    += this.vy;
        this.size *= 0.984; // shrink steadily
        if (this.life >= this.maxLife || this.size < 0.4) this.reset();
      }

      draw() {
        const p = this.life / this.maxLife;

        if (this.isEmber) {
          // Tiny yellow-white spark
          ctx.beginPath();
          ctx.arc(this.x, this.y, Math.max(0.3, this.size * 0.35), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,230,120,${(1 - p) * 0.9})`;
          ctx.fill();
          return;
        }

        // Fire color ramp: white-yellow → orange → red → gone
        let r, g, b, a;
        if (p < 0.15) {
          // White-hot base
          r=255; g=240; b=180; a=0.9;
        } else if (p < 0.4) {
          const t=(p-0.15)/0.25;
          r=255; g=Math.round(200-t*100); b=Math.round(20-t*20); a=0.85;
        } else if (p < 0.7) {
          const t=(p-0.4)/0.3;
          r=255; g=Math.round(100-t*80); b=0; a=0.7-t*0.15;
        } else {
          const t=(p-0.7)/0.3;
          r=Math.round(200-t*120); g=Math.round(20-t*20); b=0; a=0.45*(1-t);
        }

        // Draw as teardrop-ish shape: tall narrow gradient
        ctx.save();
        ctx.translate(this.x, this.y);
        // Stretch tall — 2.5× taller than wide = flame tongue shape
        ctx.scale(1, 2.5);

        const g2 = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        g2.addColorStop(0,   `rgba(${r},${g},${b},${a})`);
        g2.addColorStop(0.45,`rgba(${r},${g},${b},${a*0.55})`);
        g2.addColorStop(1,   `rgba(${r},${g},${b},0)`);

        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fillStyle = g2;
        ctx.fill();
        ctx.restore();
      }
    }

    // ── Ember — rises high, floats across screen ────────────────────────────
    class Ember {
      constructor() { this.reset(true); }
      reset(initial = false) {
        const w = canvas.width;
        const h = canvas.height;
        this.x    = Math.random() * w;
        this.y    = initial ? h * (0.5 + Math.random() * 0.5) : h + 5;
        this.vy   = -(0.4 + Math.random() * 1.5);
        this.vx   = (Math.random() - 0.5) * 2.5; // strong horizontal drift
        this.size = 0.8 + Math.random() * 2.2;
        this.maxLife = 80 + Math.random() * 140;
        this.life    = initial ? Math.random() * this.maxLife : 0;
      }
      update() {
        this.life++;
        this.x += this.vx + Math.sin(this.life * 0.04) * 0.5;
        this.y += this.vy;
        this.vy *= 0.998;
        if (this.life >= this.maxLife || this.y < 0) this.reset();
      }
      draw() {
        const p = this.life / this.maxLife;
        const a = (1 - p) * 0.85;
        // Flicker
        const flicker = 0.5 + 0.5 * Math.sin(this.life * 0.3);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * flicker, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,${Math.round(160 - p*100)},0,${a})`;
        ctx.fill();
      }
    }

    // ── Stars ───────────────────────────────────────────────────────────────
    class Star {
      constructor() {
        this.x     = Math.random() * canvas.width;
        this.y     = Math.random() * canvas.height * 0.78;
        this.r     = 0.3 + Math.random() * 1.2;
        this.alpha = 0.3 + Math.random() * 0.7;
        this.speed = 0.003 + Math.random() * 0.015;
        this.phase = Math.random() * Math.PI * 2;
      }
      draw(t) {
        const a = this.alpha * (0.4 + 0.6 * Math.sin(t * this.speed + this.phase));
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
      }
    }

    // ── Init — fewer particles on mobile ───────────────────────────────────
    const isMobile     = window.innerWidth < 600;
    const FLAME_COUNT  = isMobile ? 120 : 200;
    const EMBER_COUNT  = isMobile ? 30  : 60;
    const STAR_COUNT   = isMobile ? 100 : 180;

    const flames = Array.from({ length: FLAME_COUNT }, () => new Flame());
    const embers = Array.from({ length: EMBER_COUNT  }, () => new Ember());
    const stars  = Array.from({ length: STAR_COUNT   }, () => new Star());
    let frame = 0;

    const tick = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Stars
      stars.forEach(s => s.draw(frame));

      // Bottom glow strip — full width
      const gh = canvas.height;
      const gw = canvas.width;
      const groundGrad = ctx.createLinearGradient(0, gh * 0.78, 0, gh);
      groundGrad.addColorStop(0,   'rgba(180,50,0,0)');
      groundGrad.addColorStop(0.7, 'rgba(180,50,0,0.10)');
      groundGrad.addColorStop(1,   'rgba(100,25,0,0.25)');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, gh * 0.78, gw, gh * 0.22);

      // Fire (screen blend = natural glow/light effect)
      ctx.globalCompositeOperation = 'screen';
      flames.forEach(f => { f.update(); f.draw(); });
      embers.forEach(e => { e.update(); e.draw(); });
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
        pointerEvents: 'none', zIndex: 0,
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
      padding: '0 16px 48px',
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>

      {/* Fire canvas */}
      <FireCanvas />

      {/* Seahawk brand — floats at the top of the page */}
      <div className="shk-login-brand" style={{
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

      <div className="shk-login-wrap" style={{
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

        <div className="shk-login-card" style={{
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

        *, *::before, *::after { box-sizing: border-box; }

        input::placeholder { color: rgba(255,255,255,0.18) !important; }

        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 100px #0a0f1a inset !important;
          -webkit-text-fill-color: #f1f5f9 !important;
          caret-color: #f1f5f9;
        }

        @media (max-width: 480px) {
          .shk-login-brand {
            top: 16px !important;
          }
          .shk-login-brand-icon {
            width: 32px !important;
            height: 32px !important;
            font-size: 16px !important;
          }
          .shk-login-brand-title {
            font-size: 13px !important;
          }
          .shk-login-card {
            padding: 22px 18px !important;
            border-radius: 16px !important;
          }
          .shk-login-wrap {
            padding-bottom: 32px !important;
          }
        }
      `}</style>
    </div>
  );
}
