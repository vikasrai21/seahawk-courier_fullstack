import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function SpaceCanvas() {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    class Star {
      constructor() { this.reset(true); }
      reset(init) {
        this.x  = Math.random() * W;
        this.y  = Math.random() * H;
        this.r  = 0.2 + Math.random() * 1.0;
        this.a  = 0.15 + Math.random() * 0.7;
        this.sp = 0.002 + Math.random() * 0.01;
        this.ph = Math.random() * Math.PI * 2;
      }
      draw(t) {
        const a = this.a * (0.4 + 0.6 * Math.sin(t * this.sp + this.ph));
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
      }
    }

    class Planet {
      constructor(xr, yr, r, c1, c2, ring) {
        this.xr=xr; this.yr=yr; this.r=r; this.c1=c1; this.c2=c2; this.ring=ring;
      }
      draw() {
        const x=W*this.xr, y=H*this.yr;
        const halo = ctx.createRadialGradient(x,y,0,x,y,this.r*2.8);
        halo.addColorStop(0, this.c1.replace('1)','0.07)'));
        halo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(x,y,this.r*2.8,0,Math.PI*2);
        ctx.fillStyle=halo; ctx.fill();
        const g = ctx.createRadialGradient(x-this.r*.35,y-this.r*.35,this.r*.05,x,y,this.r);
        g.addColorStop(0, this.c1); g.addColorStop(1, this.c2);
        ctx.beginPath(); ctx.arc(x,y,this.r,0,Math.PI*2);
        ctx.fillStyle=g; ctx.fill();
        if (this.ring) {
          ctx.save(); ctx.translate(x,y); ctx.scale(1,0.22);
          ctx.beginPath(); ctx.ellipse(0,0,this.r*2,this.r*2,0,0,Math.PI*2);
          ctx.strokeStyle=this.ring; ctx.lineWidth=this.r*.22; ctx.stroke();
          ctx.restore();
        }
      }
    }

    class Asteroid {
      constructor() { this.reset(true); }
      reset(init) {
        this.x      = init ? Math.random()*W : (Math.random()<0.5 ? -20 : W+20);
        this.y      = Math.random() * H * 0.7;
        this.vx     = (Math.random()-0.5) * 0.4;
        this.vy     = 0.05 + Math.random() * 0.15;
        this.r      = 2 + Math.random() * 5;
        this.rot    = Math.random() * Math.PI * 2;
        this.rotS   = (Math.random()-0.5) * 0.02;
        this.a      = 0.25 + Math.random() * 0.4;
        this.tail   = Math.random() < 0.3;
        this.tailLen= 8 + Math.random() * 20;
        // Pre-generate irregular shape offsets
        this.pts = Array.from({length:7}, (_,i) => ({
          ang: (i/7)*Math.PI*2,
          rad: this.r * (0.6 + Math.random()*0.4),
        }));
      }
      update() {
        this.x   += this.vx;
        this.y   += this.vy;
        this.rot += this.rotS;
        if (this.y > H+20 || this.x < -30 || this.x > W+30) this.reset(false);
      }
      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rot);
        ctx.beginPath();
        ctx.moveTo(this.pts[0].rad, 0);
        this.pts.forEach(p => ctx.lineTo(Math.cos(p.ang)*p.rad, Math.sin(p.ang)*p.rad));
        ctx.closePath();
        ctx.fillStyle   = `rgba(120,110,100,${this.a})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(180,170,150,${this.a*0.5})`;
        ctx.lineWidth   = 0.5;
        ctx.stroke();
        ctx.restore();
        if (this.tail) {
          const grad = ctx.createLinearGradient(
            this.x, this.y,
            this.x - this.vx*this.tailLen*10,
            this.y - this.vy*this.tailLen*5
          );
          grad.addColorStop(0, `rgba(200,180,150,${this.a*0.4})`);
          grad.addColorStop(1, 'rgba(200,180,150,0)');
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          ctx.lineTo(this.x - this.vx*this.tailLen*10, this.y - this.vy*this.tailLen*5);
          ctx.strokeStyle = grad;
          ctx.lineWidth   = 1;
          ctx.stroke();
        }
      }
    }

    class Ember {
      constructor(init) { this.reset(init); }
      reset(init) {
        this.x      = Math.random() * W;
        this.y      = init ? H*(0.3+Math.random()*0.7) : H+5;
        this.vy     = -(0.8 + Math.random()*2.8);
        this.vx     = (Math.random()-0.5)*1.6;
        this.size   = 0.5 + Math.random()*2.0;
        this.ml     = Math.round(H / (0.8+Math.random()*2.8) * 1.1);
        this.life   = init ? Math.random()*this.ml : 0;
        this.wb     = Math.random()*Math.PI*2;
        this.ws     = 0.02+Math.random()*0.05;
        this.wa     = 0.2+Math.random()*1.2;
        this.flk    = Math.random()*Math.PI*2;
        this.flkS   = 0.08+Math.random()*0.25;
        this.streak = Math.random()<0.28;
        this.angle  = -Math.PI/2+(Math.random()-0.5)*0.6;
      }
      update() {
        this.life++;
        this.x += this.vx + Math.sin(this.life*this.ws+this.wb)*this.wa;
        this.y += this.vy;
        this.vy *= 0.9992;
        if (this.life>=this.ml || this.y<-10) this.reset(false);
      }
      draw() {
        const p   = this.life/this.ml;
        const flk = 0.7+0.3*Math.sin(this.life*this.flkS+this.flk);
        let r,g,b,a;
        if      (p<0.08) { r=255;g=230;b=160;a=0.95*flk; }
        else if (p<0.25) { const t=(p-.08)/.17; r=255;g=Math.round(190-t*90);b=Math.round(20-t*20);a=(0.9-t*.05)*flk; }
        else if (p<0.5)  { const t=(p-.25)/.25; r=255;g=Math.round(100-t*70);b=0;a=(0.82-t*.2)*flk; }
        else if (p<0.75) { const t=(p-.5)/.25;  r=Math.round(240-t*120);g=Math.round(30-t*30);b=0;a=(0.55-t*.25)*flk; }
        else             { const t=(p-.75)/.25; r=Math.round(110-t*80);g=5;b=0;a=(0.25-t*.25)*flk; }
        a = Math.max(0,a);

        if (this.streak) {
          const len = this.size*(4+Math.random()*3);
          const dx  = Math.cos(this.angle)*len;
          const dy  = Math.sin(this.angle)*len;
          const grad = ctx.createLinearGradient(this.x-dx/2,this.y-dy/2,this.x+dx/2,this.y+dy/2);
          grad.addColorStop(0,   `rgba(${r},${g},${b},0)`);
          grad.addColorStop(0.5, `rgba(${r},${g},${b},${a})`);
          grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
          ctx.beginPath();
          ctx.moveTo(this.x-dx/2,this.y-dy/2);
          ctx.lineTo(this.x+dx/2,this.y+dy/2);
          ctx.strokeStyle=grad; ctx.lineWidth=this.size*0.7; ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(this.x,this.y,this.size*0.5,0,Math.PI*2);
          ctx.fillStyle=`rgba(${r},${g},${b},${Math.min(a*1.5,1)})`; ctx.fill();
          const halo=ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.size*2.5);
          halo.addColorStop(0,   `rgba(${r},${g},${b},${a*0.55})`);
          halo.addColorStop(0.5, `rgba(${r},${g},${b},${a*0.18})`);
          halo.addColorStop(1,   `rgba(${r},${g},${b},0)`);
          ctx.beginPath();
          ctx.arc(this.x,this.y,this.size*2.5,0,Math.PI*2);
          ctx.fillStyle=halo; ctx.fill();
        }
      }
    }

    const isMobile = window.innerWidth < 600;
    const stars     = Array.from({length: isMobile?120:200},  ()=>new Star());
    const embers    = Array.from({length: isMobile?120:220},  ()=>new Ember(true));
    const asteroids = Array.from({length: isMobile?3:6},      ()=>new Asteroid());
    const planets   = [
      new Planet(0.87,0.11,34,'rgba(200,140,60,0.9)','rgba(130,75,20,0.5)','rgba(220,170,85,0.2)'),
      new Planet(0.07,0.18,18,'rgba(80,120,210,0.85)','rgba(35,55,150,0.45)',null),
      new Planet(0.94,0.76,13,'rgba(150,80,200,0.8)','rgba(75,28,140,0.45)',null),
    ];

    let frame=0;
    const tick = () => {
      frame++;
      ctx.fillStyle='#000003'; ctx.fillRect(0,0,W,H);
      const vign=ctx.createLinearGradient(0,H*0.55,0,H);
      vign.addColorStop(0,'rgba(0,0,0,0)');
      vign.addColorStop(1,'rgba(60,15,0,0.45)');
      ctx.fillStyle=vign; ctx.fillRect(0,H*0.55,W,H*0.45);
      stars.forEach(s=>s.draw(frame));
      planets.forEach(p=>p.draw());
      asteroids.forEach(a=>{a.update();a.draw();});
      const heat=ctx.createLinearGradient(0,H*0.78,0,H);
      heat.addColorStop(0,'rgba(160,40,0,0)');
      heat.addColorStop(0.6,'rgba(130,30,0,0.1)');
      heat.addColorStop(1,'rgba(80,15,0,0.3)');
      ctx.fillStyle=heat; ctx.fillRect(0,H*0.78,W,H*0.22);
      ctx.globalCompositeOperation='screen';
      embers.forEach(e=>{e.update();e.draw();});
      ctx.globalCompositeOperation='source-over';
      animRef.current=requestAnimationFrame(tick);
    };
    animRef.current=requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position:'fixed', inset:0,
      width:'100%', height:'100%',
      pointerEvents:'none', zIndex:0,
    }} />
  );
}

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
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
    setError(''); setLoading(true);
    try {
      const user = await login(email.trim(), password);
      if (user?.role === 'CLIENT') navigate('/portal', { replace: true });
      else navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password');
      setPassword('');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight:'100vh', background:'#000003',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      padding:'80px 16px',
      fontFamily:"'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif",
      position:'relative', overflow:'hidden',
    }}>
      <SpaceCanvas />

      {/* Brand */}
      <div style={{
        position:'relative', zIndex:10,
        textAlign:'center', marginBottom:32,
        opacity: mounted?1:0,
        transform: mounted?'translateY(0)':'translateY(-16px)',
        transition:'opacity 0.7s ease, transform 0.7s ease',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:12,justifyContent:'center'}}>
          <div style={{
            width:48,height:48,borderRadius:14,
            background:'linear-gradient(135deg,#f97316,#c94d08)',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,
            boxShadow:'0 0 32px rgba(249,115,22,0.6),0 0 80px rgba(249,115,22,0.2)',
          }}>🦅</div>
          <div style={{textAlign:'left'}}>
            <div style={{color:'#f1f5f9',fontSize:18,fontWeight:800,lineHeight:1.2,letterSpacing:'-0.3px'}}>
              Sea Hawk Courier
            </div>
            <div style={{color:'rgba(249,115,22,0.75)',fontSize:11,fontWeight:700,letterSpacing:'0.15em',textTransform:'uppercase'}}>
              Management Portal
            </div>
          </div>
        </div>
      </div>

      {/* Card */}
      <div style={{
        width:'100%', maxWidth:400,
        position:'relative', zIndex:10,
        opacity:   mounted?1:0,
        transform: mounted?'translateY(0) scale(1)':'translateY(24px) scale(0.97)',
        transition:'opacity 0.6s ease 0.15s, transform 0.6s cubic-bezier(0.34,1.4,0.64,1) 0.15s',
      }}>
        {/* Glow border */}
        <div style={{
          position:'absolute', inset:-1, borderRadius:22,
          background:'linear-gradient(135deg,rgba(249,115,22,0.25),rgba(168,85,247,0.12),rgba(59,130,246,0.18))',
          filter:'blur(1px)', zIndex:-1,
        }} />

        <div style={{
          background:'rgba(8,5,22,0.88)',
          border:'1px solid rgba(249,115,22,0.18)',
          borderRadius:20, padding:'32px 28px',
          backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
          boxShadow:'0 24px 64px rgba(0,0,0,0.8),inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>
          <h2 style={{color:'#f1f5f9',fontSize:22,fontWeight:800,margin:'0 0 4px',letterSpacing:'-0.3px'}}>
            Welcome back
          </h2>
          <p style={{color:'rgba(255,255,255,0.3)',fontSize:13,margin:'0 0 24px'}}>
            Sign in to continue to your dashboard
          </p>

          {error && (
            <div style={{
              marginBottom:18,padding:'10px 14px',
              background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.25)',
              borderRadius:10,color:'#fca5a5',fontSize:13,
              display:'flex',alignItems:'center',gap:8,
            }}>⚠️ {error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <label style={{display:'block',color:'rgba(255,255,255,0.4)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>
              Email Address
            </label>
            <input
              type="email" autoComplete="email" autoFocus
              placeholder="admin@seahawk.com"
              value={email} onChange={e=>setEmail(e.target.value)} required
              style={{width:'100%',padding:'11px 14px',borderRadius:10,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#f1f5f9',fontSize:14,outline:'none',boxSizing:'border-box',marginBottom:16,fontFamily:'inherit',transition:'border-color 0.2s'}}
              onFocus={e=>e.target.style.borderColor='rgba(249,115,22,0.5)'}
              onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}
            />

            <label style={{display:'block',color:'rgba(255,255,255,0.4)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>
              Password
            </label>
            <div style={{position:'relative',marginBottom:28}}>
              <input
                type={showPass?'text':'password'} autoComplete="current-password"
                placeholder="••••••••"
                value={password} onChange={e=>setPassword(e.target.value)} required
                style={{width:'100%',padding:'11px 44px 11px 14px',borderRadius:10,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#f1f5f9',fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:'inherit',transition:'border-color 0.2s'}}
                onFocus={e=>e.target.style.borderColor='rgba(249,115,22,0.5)'}
                onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}
              />
              <button type="button" onClick={()=>setShowPass(s=>!s)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.3)',fontSize:15,padding:0,lineHeight:1}}>
                {showPass?'🙈':'👁️'}
              </button>
            </div>

            <button type="submit" disabled={loading} style={{
              width:'100%',padding:'13px',
              background:loading?'rgba(249,115,22,0.3)':'linear-gradient(135deg,#f97316,#c94d08)',
              border:'none',borderRadius:11,color:'#fff',fontSize:14,fontWeight:800,
              cursor:loading?'not-allowed':'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',gap:8,
              letterSpacing:'0.02em',fontFamily:'inherit',
              boxShadow:loading?'none':'0 0 40px rgba(249,115,22,0.5),0 4px 14px rgba(0,0,0,0.4)',
              transition:'box-shadow 0.2s,transform 0.15s',
            }}
              onMouseEnter={e=>{if(!loading)e.currentTarget.style.transform='translateY(-1px)';}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';}}
            >
              {loading?(
                <>
                  <span style={{width:15,height:15,border:'2px solid rgba(255,255,255,0.25)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'shkSpin 0.7s linear infinite'}}/>
                  Signing in…
                </>
              ):<>🚀 Launch Dashboard</>}
            </button>
          </form>
        </div>

        <p style={{textAlign:'center',marginTop:18}}>
          <Link to="/" style={{color:'rgba(255,255,255,0.2)',fontSize:12,textDecoration:'none',letterSpacing:'0.02em'}}>
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
          -webkit-box-shadow: 0 0 0 100px rgba(8,5,22,0.95) inset !important;
          -webkit-text-fill-color: #f1f5f9 !important;
          caret-color: #f1f5f9;
        }
        @media (max-width:480px) {
          input,select { font-size:16px !important; }
        }
      `}</style>
    </div>
  );
}
