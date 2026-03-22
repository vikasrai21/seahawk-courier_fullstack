import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ── Space + Fire Particle Canvas ─────────────────────────────────────────── */
function SpaceCanvas() {
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

    // ── Star ───────────────────────────────────────────────────────────────
    class Star {
      constructor() { this.reset(); }
      reset() {
        this.x     = Math.random() * canvas.width;
        this.y     = Math.random() * canvas.height;
        this.r     = 0.3 + Math.random() * 1.4;
        this.alpha = 0.2 + Math.random() * 0.8;
        this.speed = 0.003 + Math.random() * 0.012;
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

    // ── Planet ─────────────────────────────────────────────────────────────
    class Planet {
      constructor(x, y, r, color, ringColor) {
        this.x = x; this.y = y; this.r = r;
        this.color = color; this.ringColor = ringColor;
        this.glowSize = r * 1.8;
      }
      draw() {
        // Glow
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.glowSize);
        glow.addColorStop(0,   this.color.replace(')', ',0.12)').replace('rgb', 'rgba'));
        glow.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.glowSize, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
        // Planet body
        const grad = ctx.createRadialGradient(
          this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.1,
          this.x, this.y, this.r
        );
        grad.addColorStop(0, this.color.replace(')', ',0.9)').replace('rgb','rgba'));
        grad.addColorStop(1, this.color.replace(')', ',0.3)').replace('rgb','rgba'));
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        // Ring (subtle ellipse)
        if (this.ringColor) {
          ctx.save();
          ctx.translate(this.x, this.y);
          ctx.scale(1, 0.25);
          ctx.beginPath();
          ctx.ellipse(0, 0, this.r * 1.8, this.r * 1.8, 0, 0, Math.PI * 2);
          ctx.strokeStyle = this.ringColor;
          ctx.lineWidth = this.r * 0.18;
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // ── Fire Ember ─────────────────────────────────────────────────────────
    // Individual glowing particles — float upward from anywhere on screen
    class Ember {
      constructor(initial = false) { this.reset(initial); }
      reset(initial = false) {
        const w = canvas.width;
        const h = canvas.height;
        // Spawn at random x, bottom 40% of screen
        this.x       = Math.random() * w;
        this.y       = initial ? h * (0.3 + Math.random() * 0.7) : h + 10;
        // Mostly upward, with sideways drift
        this.vy      = -(0.3 + Math.random() * 1.6);
        this.vx      = (Math.random() - 0.5) * 1.8;
        // Small glowing dot
        this.size    = 1.2 + Math.random() * 3.5;
        this.maxLife = 120 + Math.random() * 200;
        this.life    = initial ? Math.random() * this.maxLife : 0;
        // Color: white-hot → yellow → orange → red → gone
        this.hue     = 15 + Math.random() * 35; // 15-50 = red to orange-yellow
        this.wobble  = Math.random() * Math.PI * 2;
        this.wobbleS = 0.03 + Math.random() * 0.05;
        this.wobbleA = 0.3 + Math.random() * 1.2;
        // Some particles are cooler (more red/purple — space-like)
        this.cool    = Math.random() < 0.12;
        if (this.cool) this.hue = 260 + Math.random() * 60; // purple/blue
      }
      update() {
        this.life++;
        this.x += this.vx + Math.sin(this.life * this.wobbleS + this.wobble) * this.wobbleA;
        this.y += this.vy;
        this.vy *= 0.999;
        this.size *= 0.997;
        if (this.life >= this.maxLife || this.size < 0.3 || this.y < -20) this.reset();
      }
      draw() {
        const p = this.life / this.maxLife;
        let r, g, b, a;
        if (this.cool) {
          // Purple/blue space particle
          r = 140 + Math.round(80 * (1-p));
          g = 60;
          b = 255;
          a = (1 - p) * 0.7;
        } else if (p < 0.15) {
          // White-yellow core
          r=255; g=240; b=180; a=0.95;
        } else if (p < 0.4) {
          const t=(p-0.15)/0.25;
          r=255; g=Math.round(200-t*100); b=Math.round(30-t*30); a=0.85-t*0.1;
        } else if (p < 0.7) {
          const t=(p-0.4)/0.3;
          r=255; g=Math.round(100-t*80); b=0; a=0.7-t*0.2;
        } else {
          const t=(p-0.7)/0.3;
          r=Math.round(220-t*120); g=Math.round(20-t*20); b=0; a=0.4*(1-t);
        }

        // Draw as glowing dot with radial gradient
        const g2 = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2.5);
        g2.addColorStop(0,   `rgba(${r},${g},${b},${a})`);
        g2.addColorStop(0.4, `rgba(${r},${g},${b},${a*0.5})`);
        g2.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = g2;
        ctx.fill();
      }
    }

    // ── Init ───────────────────────────────────────────────────────────────
    const isMobile = window.innerWidth < 600;
    const stars  = Array.from({ length: isMobile ? 120 : 220 }, () => new Star());
    const embers = Array.from({ length: isMobile ? 60  : 120 }, () => new Ember(true));

    // Planets — subtle, at edges
    const planets = [
      new Planet(canvas.width * 0.88, canvas.height * 0.15, 38, 'rgb(180,120,60)',  'rgba(200,150,80,0.25)'),
      new Planet(canvas.width * 0.08, canvas.height * 0.22, 22, 'rgb(80,120,200)',  null),
      new Planet(canvas.width * 0.92, canvas.height * 0.72, 16, 'rgb(140,80,180)',  null),
    ];

    let frame = 0;

    const tick = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep space background gradient
      const bg = ctx.createRadialGradient(
        canvas.width*0.5, canvas.height*0.4, 0,
        canvas.width*0.5, canvas.height*0.5, canvas.width*0.8
      );
      bg.addColorStop(0,   'rgba(12,8,30,0)');
      bg.addColorStop(0.5, 'rgba(6,4,18,0.3)');
      bg.addColorStop(1,   'rgba(2,1,8,0.6)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      stars.forEach(s => s.draw(frame));

      // Planets (behind embers)
      planets.forEach(p => p.draw());

      // Embers with screen blend for glow
      ctx.globalCompositeOperation = 'screen';
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
    <canvas ref={canvasRef} style={{
      position: 'fixed', inset: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 0,
      background: 'radial-gradient(ellipse at 50% 60%, #120820 0%, #060410 40%, #020108 100%)',
    }} />
  );
}

/* ── Login Page ────────────────────────────────────────────────────────────── */
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
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      if (user?.role === 'CLIENT') navigate('/portal', { replace: true });
      else navigate('/app', { replace: true });
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
      background: 'radial-gradient(ellipse at 50% 60%, #120820 0%, #060410 40%, #020108 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 16px',
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      <SpaceCanvas />

      {/* Brand */}
      <div style={{
        position: 'relative', zIndex: 10,
        textAlign: 'center', marginBottom: 32,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(-16px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #f97316, #c94d08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
            boxShadow: '0 0 32px rgba(249,115,22,0.6), 0 0 80px rgba(249,115,22,0.2)',
          }}>🦅</div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.3px' }}>
              Sea Hawk Courier
            </div>
            <div style={{ color: 'rgba(249,115,22,0.7)', fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Management Portal
            </div>
          </div>
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 400,
        position: 'relative', zIndex: 10,
        opacity:   mounted ? 1 : 0,
        transform: mounted ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
        transition: 'opacity 0.6s ease 0.15s, transform 0.6s cubic-bezier(0.34,1.4,0.64,1) 0.15s',
      }}>
        {/* Card glow */}
        <div style={{
          position: 'absolute', inset: -1,
          borderRadius: 22,
          background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(168,85,247,0.1), rgba(59,130,246,0.15))',
          filter: 'blur(1px)',
          zIndex: -1,
        }} />

        <div style={{
          background: 'rgba(8, 6, 20, 0.85)',
          border: '1px solid rgba(249,115,22,0.15)',
          borderRadius: 20,
          padding: '32px 28px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}>
          <h2 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.3px' }}>
            Welcome back
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, margin: '0 0 24px' }}>
            Sign in to continue to your dashboard
          </p>

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
              <label style={{ display:'block', color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
                Email Address
              </label>
              <input
                type="email" autoComplete="email" autoFocus
                placeholder="admin@seahawk.com"
                value={email} onChange={e => setEmail(e.target.value)} required
                style={{ width:'100%', padding:'11px 14px', borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#f1f5f9', fontSize:14, outline:'none', boxSizing:'border-box', transition:'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor='rgba(249,115,22,0.5)'}
                onBlur={e  => e.target.style.borderColor='rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display:'block', color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
                Password
              </label>
              <div style={{ position:'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} autoComplete="current-password"
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required
                  style={{ width:'100%', padding:'11px 44px 11px 14px', borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#f1f5f9', fontSize:14, outline:'none', boxSizing:'border-box', transition:'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor='rgba(249,115,22,0.5)'}
                  onBlur={e  => e.target.style.borderColor='rgba(255,255,255,0.1)'}
                />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', fontSize:15, padding:0, lineHeight:1 }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} style={{
              width:'100%', padding:'13px',
              background: loading ? 'rgba(249,115,22,0.3)' : 'linear-gradient(135deg, #f97316, #c94d08)',
              border:'none', borderRadius:11,
              color:'#fff', fontSize:14, fontWeight:800,
              cursor: loading ? 'not-allowed' : 'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              letterSpacing:'0.02em',
              boxShadow: loading ? 'none' : '0 0 40px rgba(249,115,22,0.5), 0 4px 14px rgba(0,0,0,0.4)',
              transition:'box-shadow 0.2s, transform 0.15s',
            }}
              onMouseEnter={e => { if(!loading) e.currentTarget.style.transform='translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; }}
            >
              {loading ? (
                <>
                  <span style={{ width:15, height:15, border:'2px solid rgba(255,255,255,0.25)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'shkSpin 0.7s linear infinite' }} />
                  Signing in…
                </>
              ) : <>🚀 Launch Dashboard</>}
            </button>
          </form>
        </div>

        <p style={{ textAlign:'center', marginTop:18 }}>
          <Link to="/" style={{ color:'rgba(255,255,255,0.2)', fontSize:12, textDecoration:'none', letterSpacing:'0.02em' }}>
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
          -webkit-box-shadow: 0 0 0 100px rgba(8,6,20,0.9) inset !important;
          -webkit-text-fill-color: #f1f5f9 !important;
          caret-color: #f1f5f9;
        }
        @media (max-width: 480px) {
          input, select { font-size: 16px !important; }
        }
      `}</style>
    </div>
  );
}
