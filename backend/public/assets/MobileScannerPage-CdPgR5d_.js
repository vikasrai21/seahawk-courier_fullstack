import{j as e}from"./page-landing-CREvANXP.js";import{r}from"./vendor-helmet-Dwc3L0SQ.js";import{l as mr}from"./index-CjH_qiJx.js";import{a as xe}from"./page-import-CFGNhKM8.js";import{c as gr,n as fr}from"./barcodeEngine-DQ7Kmt3e.js";import{c as xr,u as br}from"./vendor-react-DrB23wtn.js";import{b as Cn,R as jt,b1 as vn,Y as yr,aW as Sn,ax as Nn,aX as Et,Z as kn,aH as Rt,J as jn,b2 as wr,ac as Cr,d as En,a7 as vr,H as It,b3 as Rn,aQ as In,b4 as Sr,b5 as Nr,a4 as kr,a1 as Fn,p as jr,X as Er}from"./vendor-icons-DyYViWBt.js";import"./page-reconcile-BQT9N3SU.js";import"./page-rate-calc-CC-LHkCs.js";function _n(c,d){var w,h;try{if(!c||!d)return null;const R=Number(c.videoWidth||0),B=Number(c.videoHeight||0);if(!R||!B)return null;const $=(w=c.getBoundingClientRect)==null?void 0:w.call(c),x=(h=d.getBoundingClientRect)==null?void 0:h.call(d);if(!$||!x)return null;const m=Number($.width||0),G=Number($.height||0);if(!m||!G)return null;const y=Math.max(m/R,G/B),z=R*y,E=B*y,u=(m-z)/2,N=(G-E)/2,Re=x.left-$.left,I=x.top-$.top,ne=x.right-$.left,Q=x.bottom-$.top,Z=(Re-u)/y,be=(I-N)/y,re=(ne-u)/y,o=(Q-N)/y,ee=(ye,we,k)=>Math.max(we,Math.min(k,ye)),f=ee(Math.min(Z,re),0,R),T=ee(Math.min(be,o),0,B),A=ee(Math.max(Z,re),0,R),P=ee(Math.max(be,o),0,B),ue=Math.max(0,A-f),_=Math.max(0,P-T);return!ue||!_?null:{x:f,y:T,w:ue,h:_}}catch{return null}}function An(c=[]){if(!c.length)return"";const d=[];return c.includes("blur")&&d.push("hold steady"),c.includes("glare")&&d.push("reduce glare"),c.includes("angle")&&d.push("straighten angle"),c.includes("dark")&&d.push("add light"),c.includes("low_edge")&&d.push("fill frame"),d.length?`Improve capture: ${d.join(", ")}.`:""}function Rr(c,d){if(!c||!d||!c.videoWidth||!c.videoHeight)return null;const w=_n(c,d);if(!w)return null;const h=Math.max(0,Math.floor(w.x)),R=Math.max(0,Math.floor(w.y)),B=Math.max(24,Math.floor(w.w)),$=Math.max(24,Math.floor(w.h)),x=128,m=96,G=document.createElement("canvas");G.width=x,G.height=m;const y=G.getContext("2d",{willReadFrequently:!0});if(!y)return null;y.drawImage(c,h,R,Math.min(B,c.videoWidth-h),Math.min($,c.videoHeight-R),0,0,x,m);const z=y.getImageData(0,0,x,m).data,E=x*m,u=new Float32Array(E);let N=0,Re=0,I=0;for(let W=0,K=0;W<z.length;W+=4,K+=1){const C=.2126*z[W]+.7152*z[W+1]+.0722*z[W+2];u[K]=C,N+=C,C>=245&&(Re+=1),C<=24&&(I+=1)}let ne=0,Q=0,Z=0,be=0,re=0,o=0;const ee=Math.max(4,Math.floor(m*.15)),f=Math.max(4,Math.floor(x*.15)),T=x;for(let W=1;W<m-1;W+=1)for(let K=1;K<x-1;K+=1){const C=W*T+K,We=u[C],D=u[C-1],Fe=u[C+1],Ae=u[C-T],le=u[C+T],ut=Math.abs(Fe-D),pt=Math.abs(le-Ae),Ce=ut+pt,Le=Math.abs(4*We-D-Fe-Ae-le);ne+=Le,Ce>58&&(Q+=1),W<=ee&&(Z+=Ce),W>=m-ee&&(be+=Ce),K<=f&&(re+=Ce),K>=x-f&&(o+=Ce)}const A=Math.max(1,(x-2)*(m-2)),P=N/E,ue=ne/A,_=Q/A,ye=Re/E,we=I/E,k=Math.abs(Z-be)/Math.max(1,Z+be),Ke=Math.abs(re-o)/Math.max(1,re+o),Ie=Math.max(k,Ke),te=[];return ue<22&&te.push("blur"),ye>.18&&te.push("glare"),(we>.55||P<40)&&te.push("dark"),_<.08&&te.push("low_edge"),Ie>.62&&te.push("angle"),{ok:te.length===0,issues:te,metrics:{brightness:Number(P.toFixed(1)),blurScore:Number(ue.toFixed(1)),glareRatio:Number((ye*100).toFixed(1)),edgeRatio:Number((_*100).toFixed(1)),perspectiveSkew:Number((Ie*100).toFixed(1))}}}function dt(c,d){const w=Number(c);return Number.isFinite(w)&&w>0?w:d}function Ir({samples:c=[],awb:d,now:w=Date.now(),stabilityWindowMs:h=1100,requiredHits:R=3}){const B=dt(h,1100),$=Math.max(1,Math.floor(dt(R,3))),x=dt(w,Date.now()),m=String(d||"").trim(),G=Array.isArray(c)?c.filter(E=>(E==null?void 0:E.awb)&&x-((E==null?void 0:E.at)||0)<=B):[];if(!m)return{samples:G,hits:0,isStable:!1};const y=[...G,{awb:m,at:x}],z=y.reduce((E,u)=>u.awb===m?E+1:E,0);return{samples:y,hits:z,isStable:z>=$}}function Fr({currentAttempts:c=0,maxReframeAttempts:d=2}){const w=Math.max(0,Math.floor(dt(d,2))),h=Math.max(0,Math.floor(Number(c)||0))+1;return h<=w?{action:"reframe",attempts:h}:{action:"switch_to_document",attempts:w}}const Ar=window.location.origin,zn={w:"90vw",h:"18vw"},at={w:"92vw",h:"130vw"},Tn=3500,Mn=900,zr=1e4,Tr=12e3,Mr="mobile_scanner_offline_queue",On="mobile_scanner_workflow_mode",Bn="mobile_scanner_device_profile",Or=500,Br=1,Pn=100,ot=2,Ft=2,Pr=500,Dn=960,Ee=.68,Dr=900,H={phone:"phone-camera",rugged:"rugged-scanner"},ct=["Trackon","DTDC","Delhivery","BlueDart"],At=c=>{const d=String(c||"").trim();if(!d)return"";const w=d.toUpperCase();return w.includes("TRACKON")||w.includes("PRIME")?"Trackon":w.includes("DTDC")?"DTDC":w.includes("DELHIVERY")?"Delhivery":w.includes("BLUE")?"BlueDart":d},Wr=c=>{const d=String(c||"").trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return d;try{return new Date(`${d}T00:00:00`).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}catch{return d}},a={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"},Lr=c=>{var d;try{(d=navigator==null?void 0:navigator.vibrate)==null||d.call(navigator,c)}catch{}},Wn={tap:[20],lock:[400,50,200,50,100],success:[18,28,72],warning:[70,50,70],retry:[28,40,28],error:[110,55,110],duplicate:[90,50,90,50,90],review:[200,40,120]},S=(c="tap")=>{Lr(Wn[c]||Wn.tap)},De=(c,d,w="sine")=>{try{const h=new(window.AudioContext||window.webkitAudioContext),R=h.createOscillator(),B=h.createGain();R.type=w,R.frequency.setValueAtTime(c,h.currentTime),B.gain.setValueAtTime(.12,h.currentTime),B.gain.exponentialRampToValueAtTime(.01,h.currentTime+d),R.connect(B),B.connect(h.destination),R.start(),R.stop(h.currentTime+d)}catch{}},Pe=()=>{De(880,.12),setTimeout(()=>De(1100,.1),130)},lt=()=>{De(2700,.08,"square"),setTimeout(()=>De(3100,.05,"square"),60)},$r=()=>De(600,.08),Y=()=>De(200,.25,"sawtooth"),zt=c=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const d=new SpeechSynthesisUtterance(c);d.rate=1.2,d.pitch=1,d.lang="en-IN",window.speechSynthesis.speak(d)}catch{}},Ln=()=>{var c;try{if(typeof window>"u")return!1;if(window.isSecureContext)return!0;const d=((c=window.location)==null?void 0:c.hostname)||"";return d==="localhost"||d==="127.0.0.1"}catch{return!1}},s={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",mutedLight:"#9CA3AF",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},_r=`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');

.msp-root {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: ${s.bg};
  color: ${s.text};
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  user-select: none;
  -webkit-user-select: none;
}
.msp-root * { box-sizing: border-box; }

/* â”€â”€ Monospace for AWB â”€â”€ */
.mono { font-family: 'JetBrains Mono', 'SF Mono', monospace; letter-spacing: -0.02em; }

/* â”€â”€ Step wrapper (full-screen transitions) â”€â”€ */
.msp-step {
  position: absolute; inset: 0;
  display: none; flex-direction: column;
  opacity: 0; transform: none;
  transition: none;
  pointer-events: none;
  z-index: 1;
}
.msp-step.active {
  display: flex;
  opacity: 1; transform: none;
  pointer-events: all; z-index: 2;
}
.msp-step.exiting {
  opacity: 0; transform: none;
  pointer-events: none;
}

/* â”€â”€ Camera viewport â”€â”€ */
.cam-viewport {
  position: relative; width: 100%; flex: 1;
  /* Use the full screen height as the sizing context so the scan-guide
     height-percentages always reference the actual screen, not the element's
     own unknown height (which can collapse when the <video> is outside). */
  min-height: 100dvh;
  background: transparent; overflow: hidden;
}
.cam-viewport video {
  width: 100%; height: 100%; object-fit: cover;
}
.cam-overlay {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  /* Must sit ABOVE the persistent background video (z-index 0) */
  z-index: 3;
}

/* â”€â”€ Scan guide rectangle â”€â”€ */
.scan-guide {
  border: 2.5px solid rgba(255,255,255,0.7);
  border-radius: 16px;
  position: relative;
  transition: border-color 0.3s, box-shadow 0.3s;
}
.scan-guide.detected {
  border-color: #10B981;
  box-shadow: 0 0 0 3px rgba(16,185,129,0.25), inset 0 0 30px rgba(16,185,129,0.05);
}
.scan-guide-corner {
  position: absolute; width: 24px; height: 24px;
  border: 3px solid rgba(255,255,255,0.9);
  transition: border-color 0.3s;
}
.scan-guide.detected .scan-guide-corner { border-color: #10B981; }
.corner-tl { top: -2px; left: -2px; border-right: none; border-bottom: none; border-radius: 8px 0 0 0; }
.corner-tr { top: -2px; right: -2px; border-left: none; border-bottom: none; border-radius: 0 8px 0 0; }
.corner-bl { bottom: -2px; left: -2px; border-right: none; border-top: none; border-radius: 0 0 0 8px; }
.corner-br { bottom: -2px; right: -2px; border-left: none; border-top: none; border-radius: 0 0 8px 0; }

/* â”€â”€ Scan laser â”€â”€ */
@keyframes laserHeadSweep {
  0% { left: 2%; }
  100% { left: 98%; }
}
@keyframes laserLinePulse {
  0%, 100% {
    opacity: 0.78;
    box-shadow: 0 0 7px rgba(255, 28, 32, 0.8), 0 0 20px rgba(255, 10, 16, 0.35);
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 12px rgba(255, 36, 42, 0.95), 0 0 34px rgba(255, 12, 20, 0.55);
  }
}
@keyframes laserBandsDrift {
  0% { background-position: 0 0, 0 0; }
  100% { background-position: 160px 0, -120px 0; }
}
@keyframes laserBandsPulse {
  0%, 100% { opacity: 0.35; transform: translateY(-50%) scaleY(0.82); }
  50% { opacity: 0.85; transform: translateY(-50%) scaleY(1.08); }
}
@keyframes laserParticlesDrift {
  0% { background-position: 0 0, 10px 6px, 5px 2px; opacity: 0.28; }
  50% { opacity: 0.6; }
  100% { background-position: -42px 0, -24px 6px, -54px 2px; opacity: 0.32; }
}
.scan-laser {
  position: absolute; left: 2%; right: 2%; height: 3px;
  top: 50%; transform: translateY(-50%);
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(255, 42, 46, 0.92), #ff111a 48%, rgba(255, 42, 46, 0.92));
  animation: laserLinePulse 1.4s ease-in-out infinite;
  overflow: visible;
}
.scan-laser::before {
  content: '';
  position: absolute;
  left: 0; right: 0; top: 50%; height: 34px;
  transform: translateY(-50%);
  background:
    linear-gradient(
      to bottom,
      transparent 0%,
      rgba(255, 48, 48, 0.4) 36%,
      rgba(255, 90, 90, 0.9) 50%,
      rgba(255, 48, 48, 0.4) 64%,
      transparent 100%
    ),
    repeating-linear-gradient(
      90deg,
      rgba(255, 70, 70, 0) 0 7px,
      rgba(255, 95, 95, 0.85) 7px 8px,
      rgba(255, 70, 70, 0) 8px 13px
    );
  filter: blur(0.35px);
  transform-origin: center;
  animation: laserBandsDrift 2.2s linear infinite, laserBandsPulse 1.3s ease-in-out infinite;
  pointer-events: none;
  mix-blend-mode: screen;
}
.scan-laser::after {
  content: '';
  position: absolute;
  left: 0; right: 0; top: 2px; height: 26px;
  background:
    radial-gradient(circle, rgba(255, 95, 95, 0.72) 0 1px, transparent 1.8px) 0 0 / 22px 15px repeat,
    radial-gradient(circle, rgba(255, 40, 40, 0.55) 0 1.1px, transparent 2px) 11px 6px / 29px 17px repeat,
    radial-gradient(circle, rgba(255, 145, 145, 0.36) 0 0.8px, transparent 1.6px) 5px 2px / 18px 13px repeat;
  filter: blur(0.15px);
  animation: laserParticlesDrift 2.4s linear infinite;
  pointer-events: none;
}
.scan-laser-spark {
  position: absolute; top: 50%;
  width: 14px; height: 14px; border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle at 40% 40%, #fff 0 26%, #ffd9dd 34%, #ff3b44 70%, rgba(255, 40, 45, 0.7) 100%);
  box-shadow: 0 0 14px 4px rgba(255, 245, 245, 0.85), 0 0 28px 10px rgba(255, 40, 45, 0.75), 0 0 58px 20px rgba(255, 20, 30, 0.36);
  animation: laserHeadSweep 1.35s cubic-bezier(0.45, 0, 0.2, 1) infinite alternate;
  z-index: 2;
}
.scan-laser-spark::before {
  content: '';
  position: absolute; top: 50%; right: 100%;
  width: 30px; height: 3px; transform: translateY(-50%);
  background: linear-gradient(to left, rgba(255, 220, 220, 0.82), rgba(255, 55, 60, 0.4), rgba(255, 55, 60, 0));
  filter: blur(0.6px);
}
.scan-laser-spark::after {
  content: '';
  position: absolute; inset: -4px; border-radius: 50%;
  border: 1px solid rgba(255, 220, 220, 0.5);
  animation: laserLinePulse 1.2s ease-in-out infinite;
}

/* â”€â”€ HUD (top bar on camera) â”€â”€ */
.cam-hud {
  position: absolute; top: 0; left: 0; right: 0;
  padding: 16px 20px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.55), transparent);
  display: flex; justify-content: space-between; align-items: flex-start;
  z-index: 3;
}
.cam-hud-chip {
  padding: 5px 12px; border-radius: 20px;
  background: rgba(255,255,255,0.15); backdrop-filter: blur(8px);
  color: white; font-size: 0.72rem; font-weight: 600;
  display: flex; align-items: center; gap: 5px;
}

/* â”€â”€ Bottom bar on camera â”€â”€ */
.cam-bottom {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 20px;
  background: linear-gradient(to top, rgba(0,0,0,0.65), transparent);
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  z-index: 3;
}

/* â”€â”€ Cards â”€â”€ */
.card {
  background: ${s.surface}; border: 1px solid ${s.border};
  border-radius: 16px; padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

/* â”€â”€ Buttons â”€â”€ */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px 24px; border-radius: 12px; border: none;
  font-family: inherit; font-size: 0.9rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.btn:active { transform: scale(0.97); }
.btn-primary {
  background: linear-gradient(135deg, #4F46E5, #6366F1);
  color: white;
}
.btn-primary:hover { box-shadow: 0 4px 14px rgba(79,70,229,0.35); }
.btn-success {
  background: linear-gradient(135deg, #059669, #10B981);
  color: white;
}
.btn-outline {
  background: ${s.surface}; border: 1.5px solid ${s.border};
  color: ${s.text};
}
.btn-danger { background: ${s.errorLight}; color: ${s.error}; }
.btn-lg { padding: 16px 32px; font-size: 1rem; border-radius: 14px; }
.btn-full { width: 100%; }
.btn:disabled {
  opacity: 0.5; cursor: default;
}

/* ——— Capture button (circular) ——— */
.capture-btn {
  width: 72px; height: 72px; border-radius: 50%;
  background: white; border: 4px solid rgba(255,255,255,0.4);
  cursor: pointer; position: relative;
  transition: transform 0.15s;
  box-shadow: 0 4px 20px rgba(0,0,0,0.25);
}
.capture-btn:active { transform: scale(0.92); }
.capture-btn-inner {
  position: absolute; inset: 4px; border-radius: 50%;
  background: white; border: 2px solid #E5E7EB;
}

/* ——— Preview image ——— */
.preview-img {
  width: 100%; border-radius: 12px;
  object-fit: contain; max-height: 50vh;
  background: #F1F5F9;
}

/* ——— Field card in review ——— */
.field-card {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 14px;
  background: ${s.surface}; border: 1px solid ${s.border};
  border-left-width: 4px; border-left-style: solid; border-left-color: transparent;
  border-radius: 12px;
}
.field-card.conf-high { border-left-color: ${s.success}; }
.field-card.conf-med { border-left-color: ${s.warning}; }
.field-card.conf-low { border-left-color: ${s.error}; }
.field-card.warning { border-color: ${s.warning}; background: ${s.warningLight}; border-left-color: ${s.warning}; }
.field-card.error-field { border-color: ${s.error}; background: ${s.errorLight}; border-left-color: ${s.error}; }
.field-label {
  font-size: 0.65rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em;
  color: ${s.muted}; margin-bottom: 2px;
}
.field-value {
  font-size: 0.85rem; font-weight: 600;
  color: ${s.text};
}
.field-input {
  width: 100%; background: ${s.bg}; border: 1px solid ${s.border};
  border-radius: 8px; padding: 8px 10px;
  font-family: inherit; font-size: 0.82rem; font-weight: 500;
  color: ${s.text}; outline: none;
}
.field-input:focus { border-color: ${s.primary}; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }

/* ——— Confidence dot ——— */
.conf-dot {
  width: 8px; height: 8px; border-radius: 50%;
  flex-shrink: 0; margin-top: 4px;
}
.conf-high { background: ${s.success}; }
.conf-med { background: ${s.warning}; }
.conf-low { background: ${s.error}; }

/* ——— Source badge ——— */
.source-badge {
  font-size: 0.6rem; padding: 2px 6px; border-radius: 6px;
  font-weight: 600; display: inline-flex; align-items: center; gap: 3px;
}
.source-learned { background: #F5F3FF; color: #7C3AED; }
.source-ai { background: ${s.primaryLight}; color: ${s.primary}; }
.source-history { background: ${s.warningLight}; color: ${s.warning}; }
.source-pincode { background: ${s.successLight}; color: ${s.success}; }

.review-header {
  background: linear-gradient(135deg, #0F172A, #1E293B);
  color: #F8FAFC;
  border-bottom: 1px solid #334155;
  padding: 14px 20px 12px;
}
.review-header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.review-title {
  font-size: 0.65rem;
  color: #94A3B8;
  font-weight: 600;
  letter-spacing: 0.06em;
}
.review-awb {
  font-size: 0.96rem;
  font-weight: 700;
  color: #F8FAFC;
  margin-top: 2px;
}
.review-meta-row {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.review-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  border: 1px solid transparent;
}
.review-chip-courier {
  border: 1px solid #6366F1;
  background: rgba(99,102,241,0.22);
  color: #E0E7FF;
  cursor: pointer;
}
.review-chip-date {
  border: 1px solid #475569;
  background: rgba(30,41,59,0.6);
  color: #CBD5E1;
}
.review-confidence {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
}
.review-confidence.high { background: rgba(5,150,105,0.22); color: #6EE7B7; border: 1px solid #059669; }
.review-confidence.med { background: rgba(217,119,6,0.22); color: #FCD34D; border: 1px solid #D97706; }
.review-confidence.low { background: rgba(220,38,38,0.22); color: #FCA5A5; border: 1px solid #DC2626; }

.suggest-chip {
  font-size: 0.76rem;
  padding: 8px 12px;
  min-height: 34px;
  border-radius: 10px;
  border: 1px solid ${s.border};
  background: ${s.surface};
  color: ${s.text};
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
  touch-action: manipulation;
}
.suggest-chip.active {
  background: ${s.primaryLight};
  color: ${s.primary};
  border-color: rgba(79,70,229,0.3);
}

/* ——— Shimmer skeleton ——— */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}

/* ——— Success checkmark ——— */
@keyframes checkDraw {
  0% { stroke-dashoffset: 48; }
  100% { stroke-dashoffset: 0; }
}
@keyframes circleDraw {
  0% { stroke-dashoffset: 200; }
  100% { stroke-dashoffset: 0; }
}
.success-check-circle {
  stroke-dasharray: 200; stroke-dashoffset: 200;
  animation: circleDraw 0.6s ease-out 0.1s forwards;
}
.success-check-mark {
  stroke-dasharray: 48; stroke-dashoffset: 48;
  animation: checkDraw 0.5s ease-out 0.5s forwards;
}

/* ——— Flash overlay ——— */
@keyframes flash { 0% { opacity: 0.8; } 100% { opacity: 0; } }
.flash-overlay {
  position: fixed; inset: 0; z-index: 50;
  pointer-events: none;
  animation: flash 0.3s ease-out forwards;
}
.flash-white { background: white; }
.flash-success { background: rgba(5,150,105,0.2); }
.flash-error { background: rgba(220,38,38,0.2); }

/* ——— Duplicate warning ——— */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}
.shake { animation: shake 0.5s ease-in-out; }

/* ——— Offline banner ——— */
.offline-banner {
  background: ${s.warningLight}; color: ${s.warning};
  text-align: center; padding: 6px; font-size: 0.72rem; font-weight: 600;
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 99;
}

/* ——— Scrollable panel ——— */
.scroll-panel {
  flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
  padding: 16px 20px;
}

/* ──────────────────────────────────────────────────────────────────────────────────
   HOME SCREEN (aligned with direct mobile scanner)
   ────────────────────────────────────────────────────────────────────────────────── */
.home-root {
  display: flex; flex-direction: column;
  min-height: 100dvh; overflow-y: auto;
  background: #F8FAFC;
}
.home-header {
  background: linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%);
  padding: 20px 20px 36px; position: relative; overflow: hidden;
  border-bottom: 1px solid #E2E8F0;
}
.home-header::before {
  content: ''; position: absolute; top: -40px; right: -40px;
  width: 180px; height: 180px; border-radius: 50%;
  background: rgba(79,70,229,0.03);
}
.home-header::after {
  content: ''; position: absolute;
  bottom: -22px; left: 0; right: 0; height: 44px;
  background: #F8FAFC;
  border-radius: 60% 60% 0 0 / 22px 22px 0 0;
  border-top: 1px solid #E2E8F0;
}
.home-logo-row {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px;
}
.home-logo-text {
  font-size: 1.08rem; font-weight: 800; color: #0F172A; letter-spacing: -0.01em;
  display: flex; align-items: center; gap: 8px;
}
.home-logo-badge {
  background: #FFFFFF;
  border: 1px solid #E2E8F0; border-radius: 20px;
  padding: 5px 12px; font-size: 0.72rem; font-weight: 600; color: #475569;
  display: flex; align-items: center; gap: 5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}
.home-stats-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.home-date-chip {
  display: flex; align-items: center; gap: 6px;
  background: linear-gradient(135deg, #1E293B, #334155);
  border: 1px solid #475569; border-radius: 12px;
  padding: 10px 14px; margin-bottom: 12px;
  cursor: pointer; position: relative;
  transition: all 0.2s ease;
}
.home-date-chip:active { transform: scale(0.97); }
.home-date-label {
  font-size: 0.68rem; font-weight: 500; color: #94A3B8;
  text-transform: uppercase; letter-spacing: 0.5px;
}
.home-date-value {
  font-size: 1rem; font-weight: 700; color: #F8FAFC;
  line-height: 1.2;
}
.home-date-change {
  font-size: 0.65rem; font-weight: 500; color: #38BDF8;
  margin-left: auto;
}
.home-date-chip input[type="date"] {
  position: absolute; inset: 0; opacity: 0;
  width: 100%; height: 100%; cursor: pointer;
  -webkit-appearance: none;
}
.home-stat-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0; border-radius: 12px;
  padding: 11px 10px; text-align: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.02);
}
.home-stat-val { font-size: 1.3rem; font-weight: 800; color: #0F172A; line-height: 1; }
.home-stat-label { font-size: 0.58rem; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 3px; }
.home-scan-section { display: flex; flex-direction: column; align-items: center; padding: 36px 20px 28px; }
@keyframes pulseRing { 0% { transform: scale(1); opacity: 0.55; } 100% { transform: scale(1.6); opacity: 0; } }
.home-scan-btn-wrap { position: relative; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
.home-scan-ring {
  position: absolute; width: 120px; height: 120px; border-radius: 50%;
  border: 2.5px solid #6366F1;
  animation: pulseRing 2.2s ease-out infinite;
}
.home-scan-ring2 { animation-delay: 0.8s; }
.home-scan-btn {
  width: 104px; height: 104px; border-radius: 50%;
  background: linear-gradient(145deg, #4F46E5, #6366F1);
  border: none; cursor: pointer; touch-action: manipulation;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
  box-shadow: 0 8px 36px rgba(79,70,229,0.35), 0 0 0 6px rgba(79,70,229,0.12);
  transition: transform 0.15s, box-shadow 0.15s;
  position: relative; z-index: 1;
}
.home-scan-btn:active { transform: scale(0.93); box-shadow: 0 4px 18px rgba(79,70,229,0.25); }
.home-scan-btn-label { font-size: 0.6rem; font-weight: 800; color: white; text-transform: uppercase; letter-spacing: 0.06em; }
.home-cta-text { font-size: 0.82rem; color: #64748B; font-weight: 500; }
.action-buttons-row {
  display: flex; gap: 12px; margin-top: 24px; width: 100%; max-width: 300px;
}
.action-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px; border-radius: 12px; border: 1px solid #E2E8F0;
  background: #FFFFFF; color: #475569; font-size: 0.75rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}
.action-btn:active { transform: scale(0.96); background: #F8FAFC; }
.action-btn.danger { color: #DC2626; border-color: #FECACA; background: #FEF2F2; }
.home-queue-section {
  flex: 1; background: #FFFFFF; border-radius: 20px 20px 0 0;
  overflow: hidden; display: flex; flex-direction: column; min-height: 280px;
  border-top: 1px solid #E2E8F0; box-shadow: 0 -4px 20px rgba(0,0,0,0.02);
}
.home-queue-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px 12px; border-bottom: 1px solid #E2E8F0;
}
.home-queue-title-text {
  font-size: 0.65rem; font-weight: 700; color: #64748B;
  text-transform: uppercase; letter-spacing: 0.08em;
  display: flex; align-items: center; gap: 6px;
}
.home-queue-badge {
  font-size: 0.65rem; font-weight: 700;
  background: #EEF2FF; color: #4F46E5;
  padding: 2px 9px; border-radius: 10px;
}
.home-queue-list { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; }
@keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
.queue-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 20px; border-bottom: 1px solid #F1F5F9;
  animation: slideIn 0.3s ease-out;
}
.queue-item:active { background: #F8FAFC; }
.queue-check {
  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
  background: #ECFDF5; border: 1.5px solid #10B981;
  display: flex; align-items: center; justify-content: center;
}
.queue-awb { font-family: 'JetBrains Mono', 'SF Mono', monospace; font-size: 0.8rem; font-weight: 600; color: #0F172A; }
.queue-meta { font-size: 0.64rem; color: #64748B; margin-top: 2px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.queue-client-tag { background: #EEF2FF; color: #4F46E5; padding: 1px 6px; border-radius: 4px; }
.queue-offline-tag { background: #FFFBEB; color: #D97706; padding: 1px 6px; border-radius: 4px; }
.queue-weight { font-size: 0.72rem; font-weight: 700; color: #4F46E5; margin-left: auto; flex-shrink: 0; }
.queue-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 44px 20px; gap: 12px; }
.queue-empty-text { font-size: 0.8rem; color: #94A3B8; font-weight: 500; text-align: center; line-height: 1.5; }
`,Un=c=>c>=.85?"high":c>=.55?"med":"low",Tt=c=>`conf-dot conf-${Un(c)}`,$n=c=>c==="learned"?{className:"source-badge source-learned",icon:"AI",text:"Learned"}:c==="awb_master"?{className:"source-badge source-ai",icon:"DB",text:"Lookup"}:c==="courier_api"?{className:"source-badge source-history",icon:"API",text:"Courier"}:c==="fuzzy_match"?{className:"source-badge source-ai",icon:"🔍",text:"Matched"}:c==="fuzzy_history"||c==="consignee_pattern"?{className:"source-badge source-history",icon:"📊",text:"History"}:c==="delhivery_pincode"||c==="india_post"||c==="pincode_lookup"||c==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"📍",text:"Pincode"}:null,Ur=c=>{const d=Math.floor(c/6e4);return d<60?`${d}m`:`${Math.floor(d/60)}h ${d%60}m`};function es({standalone:c=!1}){var rn,sn,it,an,on,cn,ln,dn,un,pn,hn,mn,gn,fn,xn,bn;const{pin:d}=xr(),w=br(),h=!!c,R=`${Mr}:${h?"direct":d||"unknown"}`,B=r.useMemo(()=>`mobile_scanner_daily_count:${new Date().toISOString().slice(0,10)}`,[]),$=r.useMemo(()=>{try{return typeof window>"u"?"":new URLSearchParams(window.location.search).get("mockBarcodeRaw")||""}catch{return""}},[]),x=r.useMemo(()=>{try{if(typeof window>"u")return!1;const t=new URLSearchParams(window.location.search);return t.get("mock")==="1"||t.get("e2e")==="1"}catch{return!1}},[]),[m,G]=r.useState(null),[y,z]=r.useState("connecting"),[E,u]=r.useState(""),[N,Re]=r.useState(a.IDLE),[I,ne]=r.useState(""),[Q,Z]=r.useState(null),[be,re]=r.useState({}),[o,ee]=r.useState(null),[f,T]=r.useState({}),[A,P]=r.useState(null),[ue,_]=r.useState(null),[ye,we]=r.useState(""),[k,Ke]=r.useState([]),[Ie,te]=r.useState(!1),[W,K]=r.useState(0),[C,We]=r.useState({ok:!1,issues:[],metrics:null}),[D,Fe]=r.useState({kb:0,width:0,height:0,quality:Ee}),[Ae,le]=r.useState(!1),[ut,pt]=r.useState("0m"),[Ce,Le]=r.useState("Connected"),[$e,Mt]=r.useState(""),[ht,qn]=r.useState(!1),[Ot,mt]=r.useState("idle"),[se,Gn]=r.useState(null),[Vn,Hn]=r.useState(0),[gt,Yn]=r.useState(0),[Bt,ft]=r.useState(null),[ve,xt]=r.useState("barcode"),[j,bt]=r.useState(()=>{if(typeof window>"u")return"fast";try{const t=localStorage.getItem(On);if(t==="fast"||t==="ocr")return t}catch{}return x?"ocr":"fast"}),[U,Pt]=r.useState(()=>{if(typeof window>"u")return H.phone;try{const t=localStorage.getItem(Bn);if(t===H.phone||t===H.rugged)return t}catch{}return H.phone}),yt=r.useRef(0),[O,wt]=r.useState({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now(),scannedItems:[]}),[ze,Qn]=r.useState(!1),[ie,Kn]=r.useState(()=>{try{const t=localStorage.getItem("seahawk_scanner_session_date");if(t&&/^\d{4}-\d{2}-\d{2}$/.test(t))return t}catch{}return new Date().toISOString().slice(0,10)}),V=r.useRef(null),Xe=r.useRef(null),pe=r.useRef(null),he=r.useRef(null),me=r.useRef(!1),Je=r.useRef(null),Xn=r.useRef(!1),de=r.useRef(a.IDLE),Ct=r.useRef(null),_e=r.useRef(0),Se=r.useRef(null),Dt=r.useRef(new Set),Ue=r.useRef([]),Ze=r.useRef({awb:"",hits:0,lastSeenAt:0}),Wt=r.useRef(0),qe=r.useRef(!1),Lt=r.useRef(0),Ne=r.useRef(null),Jn=r.useRef(null),vt=r.useRef({message:"",at:0}),ae=r.useRef({lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]}),ge=r.useRef(null),$t=r.useRef(null),_t=r.useRef({}),et=r.useRef(null),tt=r.useRef(null),nt=r.useRef(null),l=r.useCallback(t=>{Re(t)},[]),q=r.useCallback(t=>{yt.current=t,Hn(t)},[]),X=r.useCallback(t=>{Wt.current=t,Yn(t)},[]),St=r.useCallback((t,n="warning")=>{if(!t)return;const i=Date.now();vt.current.message===t&&i-vt.current.at<Dr||(vt.current={message:t,at:i},u(t),n&&S(n))},[]),Ut=r.useCallback(t=>{q(0),X(0),xt("document"),u(t||'No barcode lock yet. Capture label instead or tap "Back to barcode mode" and hold steady.'),S("warning")},[q,X]),rt=r.useCallback(()=>{const t=Fr({currentAttempts:Wt.current,maxReframeAttempts:ot});if(t.action==="reframe"){X(t.attempts),q(0),u(`No lock yet. Reframe ${t.attempts}/${ot}: move closer, reduce glare, keep barcode horizontal.`),S("retry");return}Ut("No stable barcode lock after reframe retries. Capture label for OCR fallback.")},[Ut,q,X]),Zn=r.useCallback(()=>{ne(""),u(""),l(a.CAPTURING)},[l]),qt=r.useCallback(t=>{const n=Date.now(),i=Ir({samples:Ue.current,awb:t,now:n,stabilityWindowMs:Or,requiredHits:Br});return Ue.current=i.samples,Ze.current={awb:t,hits:i.hits,lastSeenAt:n},i.isStable},[]),ke=r.useCallback(async()=>{var i;if(!Ln())throw new Error("Camera requires HTTPS (or localhost). Open this page over https:// on your phone.");if(!((i=navigator==null?void 0:navigator.mediaDevices)!=null&&i.getUserMedia))throw new Error("Camera not supported on this browser/device.");if(!V.current)throw new Error("Camera element not ready.");const t=V.current.srcObject;if(t&&typeof t.getTracks=="function"&&t.getTracks().some(g=>g.readyState==="live")){await V.current.play();return}let n=null;try{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}V.current.srcObject=n,await V.current.play()},[]);r.useEffect(()=>{const t=setInterval(()=>pt(Ur(Date.now()-O.startedAt)),3e4);return()=>clearInterval(t)},[O.startedAt]);const Ge=r.useCallback(t=>{Ke(t);try{t.length?localStorage.setItem(R,JSON.stringify(t)):localStorage.removeItem(R)}catch{}},[R]),Te=r.useCallback(t=>{const n={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:t};return Ge([...k,n]),n},[k,Ge]),Gt=r.useCallback(async t=>{if(String((t==null?void 0:t.scanMode)||"").toLowerCase()==="fast_barcode_only"){await xe.post("/shipments/scan",{awb:t.awb,courier:"AUTO",captureOnly:!0,sessionContext:t.sessionContext||{}});return}await xe.post("/shipments/scan-mobile",{awb:t.awb,imageBase64:t.imageBase64,focusImageBase64:t.focusImageBase64||t.imageBase64,sessionContext:t.sessionContext||{}})},[]),Ve=r.useCallback(async()=>{var t;if(k.length){if(h){if(!navigator.onLine)return;const n=[];for(const i of k)if((t=i==null?void 0:i.payload)!=null&&t.awb)try{await Gt(i.payload)}catch{n.push(i)}Ge(n),n.length?u(`Uploaded partially. ${n.length} scan(s) still queued.`):u("");return}!m||!m.connected||(k.forEach(n=>{var i;(i=n==null?void 0:n.payload)!=null&&i.awb&&m.emit("scanner:scan",n.payload)}),Ge([]))}},[h,m,k,Ge,Gt]),L=r.useCallback(t=>{wt(n=>{const i={...n,scannedItems:[{...t,time:Date.now()},...n.scannedItems]};try{localStorage.setItem(B,String(i.scanNumber))}catch{}return i})},[B]);r.useEffect(()=>{et.current=L},[L]),r.useEffect(()=>{$t.current=o},[o]),r.useEffect(()=>{_t.current=f},[f]);const er=r.useCallback(()=>{if(y!=="paired"){u(h?"Scanner is offline. Reconnect internet and retry.":"Phone is not connected to the desktop session.");return}if(u(""),x){l(a.SCANNING);return}ke().then(()=>l(a.SCANNING)).catch(t=>u((t==null?void 0:t.message)||"Camera access failed."))},[y,ke,l,x,h]),tr=r.useCallback(t=>{var i;t==null||t.preventDefault();const n=$e.trim().toUpperCase();if(!n||n.length<6){u("Enter a valid AWB number (min 6 chars)");return}if(y!=="paired"){u(h?"Scanner is offline. Reconnect internet and retry.":"Not connected to desktop session.");return}if(u(""),Mt(""),ne(n),x){le(!0),l(a.CAPTURING);return}if(j==="fast"){(i=Ne.current)==null||i.call(Ne,n);return}le(!0),l(a.CAPTURING)},[$e,y,l,x,h,j]),nr=r.useCallback(()=>{if(window.confirm(h?"Exit this scanner session on the phone?":"End this mobile scanner session on the phone?")){if(h){w("/app/scan");return}m!=null&&m.connected?m.emit("scanner:end-session",{reason:"Mobile ended the session"}):w("/")}},[m,w,h]),rr=r.useCallback(()=>{if(k.length>0){Ve();return}window.alert(h?"No queued scans to upload.":"Everything is already synced.")},[k.length,Ve,h]);r.useEffect(()=>{de.current=N},[N]);const fe=r.useCallback((t=null)=>{t&&ee(t),re({}),u(""),l(a.CAPTURING)},[l]),Me=r.useCallback(t=>{if(!t)return;if(ee(t),T({clientCode:t.clientCode||"",consignee:t.consignee||"",destination:t.destination||"",pincode:t.pincode||"",weight:t.weight||0,amount:t.amount||0,orderNo:t.orderNo||"",courier:At(t.courier||""),date:t.date||ie||new Date().toISOString().slice(0,10)}),re({}),t.reviewRequired){S("review"),lt(),l(a.REVIEWING);return}Pe(),S("success"),ze&&zt(`Auto approved. ${t.clientName||""}. ${t.destination||""}.`);const n={awb:t.awb,clientCode:t.clientCode,clientName:t.clientName,destination:t.destination||"",weight:t.weight||0,autoApproved:!0};P(n),L(n),l(a.SUCCESS)},[L,l,ze,ie]);r.useEffect(()=>{tt.current=fe},[fe]),r.useEffect(()=>{nt.current=Me},[Me]),r.useEffect(()=>{if(x){z("paired"),Le("Mock Mode"),u(""),l(a.IDLE);return}if(h){G(null),z("paired"),Le("Direct Mode"),u(""),l(a.IDLE);return}if(!d){u("No PIN provided.");return}const t=mr(Ar,{auth:{scannerPin:d},transports:["websocket","polling"],reconnection:!0,reconnectionDelay:1500,reconnectionAttempts:20});return t.on("connect",()=>z("connecting")),t.on("scanner:paired",({userEmail:n})=>{z("paired"),Le(n?n.split("@")[0]:"Connected"),u("");const i=de.current;i===a.PROCESSING||i===a.REVIEWING||i===a.APPROVING||i===a.SUCCESS||l(a.IDLE)}),t.on("scanner:error",({message:n})=>{u(n),z("disconnected")}),t.on("scanner:session-ended",({reason:n})=>{z("disconnected"),u(n||"Session ended by desktop."),w("/")}),t.on("disconnect",()=>z("disconnected")),t.on("reconnect",()=>{const n=de.current;if(n===a.PROCESSING||n===a.REVIEWING||n===a.APPROVING||n===a.SUCCESS){z("paired");return}z("paired"),l(a.SCANNING)}),t.on("scanner:scan-processed",n=>{var p,g;const i=de.current;if(!(i!==a.PROCESSING&&i!==a.REVIEWING)){if(n.status==="error"){if(i!==a.PROCESSING)return;_("error"),Y(),S("error"),l(a.ERROR),u(n.error||"Scan failed on desktop.");return}if(n.status==="photo_required"||n.requiresImageCapture){(p=tt.current)==null||p.call(tt,n);return}(g=nt.current)==null||g.call(nt,n)}}),t.on("scanner:approval-result",({success:n,message:i,awb:p})=>{var b;const g=$t.current||{},v=_t.current||{};if(n){lt(),S("success"),_("success");const M={awb:(g==null?void 0:g.awb)||p,clientCode:v.clientCode,clientName:(g==null?void 0:g.clientName)||v.clientCode,destination:v.destination||"",weight:parseFloat(v.weight)||0};P(M),(b=et.current)==null||b.call(et,M),l(a.SUCCESS)}else Y(),S("error"),u(i||"Approval failed.")}),t.on("scanner:ready-for-next",()=>{}),G(t),()=>{t.disconnect()}},[d,l,w,x,h]),r.useEffect(()=>{try{const t=localStorage.getItem(R);if(!t)return;const n=JSON.parse(t);Array.isArray(n)&&n.length&&Ke(n)}catch{}},[R]),r.useEffect(()=>{try{localStorage.setItem(On,j)}catch{}},[j]),r.useEffect(()=>{try{localStorage.setItem(Bn,U)}catch{}},[U]),r.useEffect(()=>{if(k.length){if(h){y==="paired"&&navigator.onLine&&Ve();return}y==="paired"&&(m!=null&&m.connected)&&Ve()}},[y,m,k.length,Ve,h]);const Oe=r.useCallback(async()=>{var t;try{if(le(!1),ge.current&&ge.current.stop(),he.current){try{const n=he.current;n!=null&&n.barcodeScanner&&await n.barcodeScanner.dispose()}catch{}he.current=null}if(pe.current){try{await pe.current.reset()}catch{}pe.current=null}(t=V.current)!=null&&t.srcObject&&(V.current.srcObject.getTracks().forEach(n=>n.stop()),V.current.srcObject=null)}catch{}},[]),Be=r.useCallback(async()=>{try{if(mt("idle"),ge.current&&ge.current.stop(),he.current){try{await he.current.barcodeScanner.dispose()}catch{}he.current=null}if(pe.current){try{pe.current._type==="native"?pe.current.reset():await pe.current.reset()}catch{}pe.current=null}}catch{}},[]),Vt=r.useCallback(async()=>{if(V.current){await Be();try{_e.current=Date.now(),await ke(),ge.current||(ge.current=gr()),await ge.current.start(V.current,Xe.current,{onDetected:(t,n)=>{var g;if(me.current)return;q(0);const i=(n==null?void 0:n.format)||"unknown",p=(n==null?void 0:n.engine)||"unknown";Gn({value:t,format:i,engine:p,at:Date.now(),sinceStartMs:_e.current?Date.now()-_e.current:null,candidateCount:(n==null?void 0:n.candidateCount)||1,ambiguous:!1,alternatives:(n==null?void 0:n.alternatives)||[]}),mt(p),(g=Se.current)==null||g.call(Se,t,{candidateCount:(n==null?void 0:n.candidateCount)||1,ambiguous:!1,alternatives:(n==null?void 0:n.alternatives)||[],format:i,engine:p})},onFail:()=>{const t=yt.current+1;q(t),t>=Pn&&rt()},onEngineReady:t=>{console.log(`[MobileScanner] Barcode engine ready: ${t}`),mt(t)}})}catch(t){u("Camera access failed: "+t.message)}}},[ke,Be,rt,q]),Ht=r.useCallback((t,n={})=>{var v;const i=String(t||"").trim().replace(/\s+/g,"").toUpperCase(),p=fr(t)||i;if(me.current||de.current!==a.SCANNING)return;if(!p||p.length<8){i.replace(/[^A-Z0-9]/g,"").length>=4&&St("Partial barcode detected. Move closer so full AWB is visible.");return}if(n!=null&&n.ambiguous){const b=yt.current+1;q(b),St("Multiple barcodes detected. Keep only the AWB barcode inside the strip.","retry"),b>=Pn&&rt();return}if(!x&&!qt(p))return;if(me.current=!0,Dt.current.has(p)){S("duplicate"),Y(),we(p),setTimeout(()=>{we(""),me.current=!1,Ze.current={awb:"",hits:0,lastSeenAt:0},Ue.current=[]},2500);return}clearTimeout(Ct.current),S("lock"),lt(),ne(p);const g=_e.current?Date.now()-_e.current:null;if(ft(g),ae.current={lockTimeMs:g,candidateCount:Number((n==null?void 0:n.candidateCount)||1),ambiguous:!!(n!=null&&n.ambiguous),alternatives:Array.isArray(n==null?void 0:n.alternatives)?n.alternatives.slice(0,3):[]},X(0),q(0),u(""),wt(b=>{const M={...b,scanNumber:b.scanNumber+1};return M.scannedAwbs=new Set(b.scannedAwbs),M.scannedAwbs.add(p),Dt.current=M.scannedAwbs,M}),j==="fast"){(v=Ne.current)==null||v.call(Ne,p);return}le(!0),l(a.CAPTURING)},[l,qt,j,x,q,X,St,rt]);r.useEffect(()=>{Se.current=Ht},[Ht]),r.useEffect(()=>{if(N===a.SCANNING&&(me.current=!1,Ze.current={awb:"",hits:0,lastSeenAt:0},Ue.current=[],ae.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},ft(null),X(0),q(0),xt("barcode"),Vt(),x&&$)){const t=setTimeout(()=>{var n;de.current===a.SCANNING&&((n=Se.current)==null||n.call(Se,$))},50);return()=>clearTimeout(t)}return()=>{N===a.SCANNING&&Be()}},[N,Vt,Be,q,X,x,$]);const Yt=r.useCallback(async()=>{if(x){le(!0);return}await Be();try{await ke(),le(!0)}catch(t){u("Camera access failed: "+t.message)}},[ke,Be,x]);r.useEffect(()=>{N===a.CAPTURING&&Yt()},[N,Yt]);const st=r.useCallback(()=>{const t=V.current,n=Xe.current;return Rr(t,n)},[]);r.useEffect(()=>{if(N!==a.CAPTURING){te(!1),K(0),We({ok:!1,issues:[],metrics:null}),Xn.current=!1,qe.current=!1;return}const t=setInterval(()=>{const n=st();n&&(We(n),te(n.ok),K(i=>{const p=n.ok?Math.min(i+1,8):0;return p>=Ft&&!qe.current&&(S("tap"),qe.current=!0),n.ok||(qe.current=!1),p}))},280);return()=>clearInterval(t)},[N,st]);const Qt=r.useCallback((t={})=>{const n=V.current,i=Xe.current;if(!n||!i||!n.videoWidth)return null;const p=_n(n,i);if(!p)return null;const g=p.x,v=p.y,b=p.w,M=p.h;if(!b||!M)return null;const Ye=Math.max(640,Number(t.maxWidth||Dn)),Qe=Math.min(.85,Math.max(.55,Number(t.quality||Ee))),J=document.createElement("canvas");J.width=Math.min(Ye,Math.round(b)),J.height=Math.round(J.width/b*M),J.getContext("2d").drawImage(n,g,v,b,M,0,0,J.width,J.height);const kt=J.toDataURL("image/jpeg",Qe).split(",")[1]||"";if(!kt)return null;const hr=Math.floor(kt.length*3/4);return{base64:kt,width:J.width,height:J.height,approxBytes:hr,quality:Qe}},[]),sr=r.useCallback(()=>{const t=Date.now();if(t-Lt.current<Pr)return;Lt.current=t;const n=st()||C;if(!(n!=null&&n.ok)||W<Ft){u(An(n==null?void 0:n.issues)||"Capture quality is low. Hold steady and align the AWB in the frame."),S("warning"),Y();return}_("white"),$r(),S("tap");const i=Qt({maxWidth:Dn,quality:Ee});if(!(i!=null&&i.base64)){u("Could not capture image. Try again."),me.current=!1;return}Fe({kb:Math.round((i.approxBytes||0)/1024),width:i.width||0,height:i.height||0,quality:i.quality||Ee}),Z(`data:image/jpeg;base64,${i.base64}`),Oe(),l(a.PREVIEW)},[Qt,Oe,l,st,C,W]),ir=r.useCallback(()=>{if(!x)return;const t="data:image/jpeg;base64,ZmFrZS1tb2NrLWltYWdl";Fe({kb:0,width:0,height:0,quality:Ee}),Z(t),Oe(),l(a.PREVIEW)},[l,x,Oe]),je=r.useCallback(()=>{var t,n,i;return{scanNumber:O.scanNumber,recentClient:O.dominantClient,dominantClient:O.dominantClient,dominantClientCount:O.dominantClientCount,sessionDurationMin:Math.round((Date.now()-O.startedAt)/6e4),sessionDate:ie,scanWorkflowMode:j,scanMode:ve,deviceProfile:U,hardwareClass:U===H.rugged?"rugged":"phone",captureQuality:{ok:!!C.ok,issues:Array.isArray(C.issues)?C.issues.slice(0,8):[],metrics:C.metrics||null},captureMeta:{kb:D.kb||0,width:D.width||0,height:D.height||0,quality:D.quality||Ee},lockTimeMs:Number.isFinite(Number((t=ae.current)==null?void 0:t.lockTimeMs))?Number(ae.current.lockTimeMs):null,lockCandidateCount:Number.isFinite(Number((n=ae.current)==null?void 0:n.candidateCount))?Number(ae.current.candidateCount):1,lockAlternatives:Array.isArray((i=ae.current)==null?void 0:i.alternatives)?ae.current.alternatives.slice(0,3):[]}},[O,ie,j,ve,U,C,D]),Kt=r.useCallback(async t=>{var p,g;const n=String(t||"").trim().toUpperCase();if(!n)return;if(l(a.PROCESSING),x){setTimeout(()=>{const v={awb:n,clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25};P(v),L(v),l(a.SUCCESS)},120);return}const i={awb:n,imageBase64:null,focusImageBase64:null,scanMode:"fast_barcode_only",sessionContext:je()};if(h){if(!navigator.onLine){Te(i),Pe(),S("success");const v={awb:n,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};P({...v,offlineQueued:!0}),L(v),l(a.SUCCESS);return}try{const v=await xe.post("/shipments/scan",{awb:n,courier:"AUTO",captureOnly:!0,sessionContext:je()}),b=((p=v==null?void 0:v.data)==null?void 0:p.shipment)||{},M={awb:b.awb||n,clientCode:b.clientCode||"MISC",clientName:((g=b.client)==null?void 0:g.company)||b.clientCode||"Scanned",destination:b.destination||"",weight:b.weight||0};P(M),L(M),Pe(),S("success"),l(a.SUCCESS)}catch(v){u((v==null?void 0:v.message)||"Barcode processing failed. Please try again."),Y(),S("error"),l(a.ERROR)}return}if(!m||!m.connected||y!=="paired"){Te(i),Pe(),S("success");const v={awb:n,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};P({...v,offlineQueued:!0}),L(v),l(a.SUCCESS);return}m.emit("scanner:scan",i),setTimeout(()=>{de.current===a.PROCESSING&&(u("Barcode processing timed out. Please try scanning again."),Y(),S("error"),l(a.ERROR))},zr)},[m,y,l,x,Te,L,je,h]);r.useEffect(()=>{Ne.current=Kt},[Kt]);const Xt=r.useCallback(async t=>{const n=String(t||"").trim().toUpperCase();if(!n)return;if(l(a.PROCESSING),x){l(a.CAPTURING);return}const i={awb:n,scanMode:"lookup_first",sessionContext:je()};if(h){if(!navigator.onLine){fe({awb:n,status:"photo_required",requiresImageCapture:!0});return}try{const p=await xe.post("/shipments/scan-mobile",i),g=(p==null?void 0:p.data)||p;if(g.status==="error"||!g.success){_("error"),Y(),S("error"),l(a.ERROR),u(g.error||g.message||"Lookup failed.");return}if(g.status==="photo_required"||g.requiresImageCapture){fe(g);return}Me(g)}catch(p){u((p==null?void 0:p.message)||"Lookup failed. Please try again."),Y(),S("error"),l(a.ERROR)}return}if(!m||!m.connected||y!=="paired"){fe({awb:n,status:"photo_required",requiresImageCapture:!0});return}m.emit("scanner:scan",i),setTimeout(()=>{de.current===a.PROCESSING&&(u("Lookup timed out. Capture the label photo and continue."),l(a.CAPTURING))},Tr)},[m,y,l,x,je,h,fe,Me]);r.useEffect(()=>{Jn.current=Xt},[Xt]);const ar=r.useCallback(async()=>{if(!Q)return;if(l(a.PROCESSING),x){setTimeout(()=>{const i={awb:I||"100454974120",clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25};P(i),L(i),l(a.SUCCESS)},250);return}const t=Q.split(",")[1]||Q,n={awb:I||"",imageBase64:t,focusImageBase64:t,scanMode:"ocr_label",sessionContext:je()};if(h){if(!navigator.onLine){Te(n),Pe(),S("success");const i={awb:I||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};P({...i,offlineQueued:!0}),L(i),l(a.SUCCESS);return}try{const i=await xe.post("/shipments/scan-mobile",n),p=(i==null?void 0:i.data)||i;if(p.status==="error"||!p.success){_("error"),Y(),S("error"),l(a.ERROR),u(p.error||p.message||"Scan failed.");return}if(p.status==="photo_required"||p.requiresImageCapture){fe(p);return}Me(p)}catch(i){u((i==null?void 0:i.message)||"Server error. Please try again."),Y(),S("error"),l(a.ERROR)}return}if(!m||!m.connected||y!=="paired"){Te(n),Pe(),S("success");const i={awb:I||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};P({...i,offlineQueued:!0}),L(i),l(a.SUCCESS);return}m.emit("scanner:scan",n),setTimeout(()=>{de.current===a.PROCESSING&&(u("OCR timed out after 40 seconds. Retake the label photo and try again."),Y(),S("error"),l(a.ERROR))},4e4)},[m,I,Q,l,y,Te,L,x,je,h,Me,fe]),or=r.useCallback(async()=>{var v;if(!o)return;l(a.APPROVING);let t=!h;const n=f.date||ie||new Date().toISOString().slice(0,10);if(x){setTimeout(()=>{const b={awb:o.awb||I,clientCode:f.clientCode||"MOCKCL",clientName:o.clientName||f.clientCode||"Mock Client",destination:f.destination||"",weight:parseFloat(f.weight)||0};P(b),L(b),_("success"),t=!0,l(a.SUCCESS)},200);return}const i={clientCode:o.clientCode||"",clientName:o.clientName||"",consignee:o.consignee||"",destination:o.destination||""},p={clientCode:f.clientCode||"",clientName:f.clientCode||"",consignee:f.consignee||"",destination:f.destination||""},g={clientCode:f.clientCode,consignee:f.consignee,destination:f.destination,pincode:f.pincode,weight:parseFloat(f.weight)||0,amount:parseFloat(f.amount)||0,orderNo:f.orderNo||"",courier:f.courier||"",date:n};if(h)try{(o.ocrExtracted||o)&&await xe.post("/shipments/learn-corrections",{ocrFields:i,approvedFields:p}),o.shipmentId?await xe.put(`/shipments/${o.shipmentId}`,g):await xe.post("/shipments",{awb:o.awb||I,...g}),lt(),S("success"),_("success");const b={awb:(o==null?void 0:o.awb)||I,clientCode:f.clientCode,clientName:(o==null?void 0:o.clientName)||f.clientCode,destination:f.destination||"",weight:parseFloat(f.weight)||0};P(b),L(b),t=!0,l(a.SUCCESS)}catch(b){l(a.REVIEWING),Y(),S("error"),u((b==null?void 0:b.message)||"Approval failed.")}else{if(!m){l(a.REVIEWING),u("Not connected to desktop session.");return}(o.ocrExtracted||o)&&m.emit("scanner:learn-corrections",{pin:d,ocrFields:i,approvedFields:p,courier:(o==null?void 0:o.courier)||((v=o==null?void 0:o.ocrExtracted)==null?void 0:v.courier)||"",deviceProfile:U}),m.emit("scanner:approval-submit",{shipmentId:o.shipmentId,awb:o.awb||I,fields:g},b=>{b!=null&&b.success||(l(a.REVIEWING),Y(),S("error"),u((b==null?void 0:b.message)||"Approval failed."))})}t&&f.clientCode&&f.clientCode!=="MISC"&&wt(b=>{var Qe,J;const M={...b.clientFreq};M[f.clientCode]=(M[f.clientCode]||0)+1;const Ye=Object.entries(M).sort((yn,wn)=>wn[1]-yn[1]);return{...b,clientFreq:M,dominantClient:((Qe=Ye[0])==null?void 0:Qe[1])>=2?Ye[0][0]:null,dominantClientCount:((J=Ye[0])==null?void 0:J[1])||0}})},[m,o,f,I,d,l,L,x,U,h,ie]),He=r.useCallback((t=a.IDLE)=>{clearTimeout(Je.current),clearTimeout(Ct.current),ne(""),Z(null),Fe({kb:0,width:0,height:0,quality:Ee}),ee(null),T({}),re({}),P(null),ft(null),u(""),we(""),te(!1),K(0),We({ok:!1,issues:[],metrics:null}),me.current=!1,Ze.current={awb:"",hits:0,lastSeenAt:0},Ue.current=[],ae.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},qe.current=!1,X(0),l(t)},[l,X]);r.useEffect(()=>{if(N===a.SUCCESS){const t=j==="fast"?a.SCANNING:a.IDLE,n=j==="fast"?Mn:Tn;return Je.current=setTimeout(()=>He(t),n),()=>clearTimeout(Je.current)}},[N,He,j]),r.useEffect(()=>{if(ze)if(N===a.REVIEWING&&o){const t=[o.clientName||o.clientCode,o.destination,o.weight?`${o.weight} kilograms`:""].filter(Boolean);t.length&&zt(t.join(". "))}else N===a.SUCCESS&&A&&zt(`${A.clientName||A.clientCode||"Shipment"} Verified.`)},[ze,N,o,A]),r.useEffect(()=>()=>{Oe(),clearTimeout(Je.current),clearTimeout(Ct.current)},[Oe]);const oe=t=>`msp-step ${N===t?"active":""}`,Jt=Math.max(1,Math.round((j==="fast"?Mn:Tn)/1e3)),cr=C.ok?"AWB quality looks good - press shutter":An(C.issues)||"Fit AWB slip fully in frame and hold steady",Zt=Ae&&C.ok&&W>=Ft,ce=r.useMemo(()=>{if(!o)return{};const t=o.ocrExtracted||o;return{clientCode:{confidence:(t==null?void 0:t.clientNameConfidence)||0,source:(t==null?void 0:t.clientNameSource)||null},consignee:{confidence:(t==null?void 0:t.consigneeConfidence)||0,source:(t==null?void 0:t.consigneeSource)||null},destination:{confidence:(t==null?void 0:t.destinationConfidence)||0,source:(t==null?void 0:t.destinationSource)||null},pincode:{confidence:(t==null?void 0:t.pincodeConfidence)||0,source:(t==null?void 0:t.pincodeSource)||null},weight:{confidence:(t==null?void 0:t.weightConfidence)||0,source:(t==null?void 0:t.weightSource)||null}}},[o]),lr=r.useCallback(()=>{T(t=>{const n=At(t.courier||(o==null?void 0:o.courier)||""),i=ct.findIndex(g=>g.toUpperCase()===n.toUpperCase()),p=ct[(i+1+ct.length)%ct.length];return{...t,courier:p}})},[o]),Nt=r.useMemo(()=>{const t=Object.values(ce).map(g=>Number((g==null?void 0:g.confidence)||0)).filter(g=>g>0),n=t.length?t.reduce((g,v)=>g+v,0)/t.length:0,i=Un(n);return{score:n,level:i,label:i==="high"?"High Confidence":i==="med"?"Medium Confidence":"Low Confidence"}},[ce]),dr=At(f.courier||(o==null?void 0:o.courier)||((rn=o==null?void 0:o.ocrExtracted)==null?void 0:rn.courier)||""),en=f.date||(o==null?void 0:o.date)||ie||"",ur=r.useMemo(()=>Wr(en),[en]),tn=O.scannedItems.reduce((t,n)=>t+(n.weight||0),0),F=((sn=o==null?void 0:o.ocrExtracted)==null?void 0:sn.intelligence)||(o==null?void 0:o.intelligence)||null,nn=(on=(an=(it=ge.current)==null?void 0:it.getDiagnostics)==null?void 0:an.call(it))==null?void 0:on.wasmFailReason,pr=[["Step",N],["Connection",y],["Engine",Ot],...nn?[["WASM Error",nn]]:[],["Workflow",j],["Device",U],["Scan mode",ve],["Fail count",String(Vn)],["Reframe retries",`${gt}/${ot}`],["Camera",Ae?"ready":"waiting"],["Doc detect",Ie?`yes (${W})`:"no"],["Capture quality",C.ok?"good":C.issues.join(", ")||"pending"],["Capture metrics",C.metrics?`blur ${C.metrics.blurScore} | glare ${C.metrics.glareRatio}% | skew ${C.metrics.perspectiveSkew}%`:"-"],["JPEG last shot",D.kb?`${D.kb}KB ${D.width}x${D.height} q=${D.quality}`:"-"],["Secure ctx",Ln()?"yes":"no"],["AWB lock",I||"-"],["Lock ms",Bt!=null?String(Bt):"-"],["Lock candidates",String(((cn=ae.current)==null?void 0:cn.candidateCount)||1)],["Queued",String(k.length)],["Scans",String(O.scanNumber)],["Last format",(se==null?void 0:se.format)||"-"],["Last code",(se==null?void 0:se.value)||"-"],["Decode ms",(se==null?void 0:se.sinceStartMs)!=null?String(se.sinceStartMs):"-"],["False-lock",(ln=o==null?void 0:o.scanTelemetry)!=null&&ln.falseLock?"yes":"no"]];return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:_r}),e.jsxs("div",{className:"msp-root",children:[ue&&e.jsx("div",{className:`flash-overlay flash-${ue}`,onAnimationEnd:()=>_(null)}),ye&&e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[e.jsx(Cn,{size:48,color:"white"}),e.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),e.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:ye}),e.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),e.jsx("button",{type:"button","data-testid":"scanner-diag-toggle",onClick:()=>qn(t=>!t),style:{position:"fixed",top:12,right:12,zIndex:70,border:"1px solid rgba(255,255,255,0.18)",background:ht?"rgba(79,70,229,0.92)":"rgba(15,23,42,0.72)",color:"#fff",borderRadius:999,padding:"8px 12px",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.04em",backdropFilter:"blur(10px)",cursor:"pointer"},children:ht?"Hide Diag":"Show Diag"}),ht&&e.jsxs("div",{"data-testid":"scanner-diag-panel",style:{position:"fixed",top:56,right:12,zIndex:69,width:"min(92vw, 320px)",background:"rgba(15,23,42,0.88)",color:"#E5EEF8",border:"1px solid rgba(255,255,255,0.12)",borderRadius:18,padding:14,backdropFilter:"blur(14px)",boxShadow:"0 12px 30px rgba(0,0,0,0.25)"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10,color:"#A5B4FC"},children:"Scanner Diagnostics"}),e.jsx("div",{style:{display:"grid",gap:6},children:pr.map(([t,n])=>e.jsxs("div",{style:{display:"flex",gap:8,justifyContent:"space-between",alignItems:"flex-start",fontSize:"0.76rem"},children:[e.jsx("div",{style:{color:"rgba(226,232,240,0.72)",minWidth:88},children:t}),e.jsx("div",{className:"mono",style:{textAlign:"right",wordBreak:"break-word",maxWidth:180},children:n})]},t))}),e.jsx("div",{style:{marginTop:10,fontSize:"0.68rem",color:"rgba(226,232,240,0.7)",lineHeight:1.4},children:"Use this to verify whether Trackon labels are being decoded as `ITF` and how quickly the first lock happens after scan start."})]}),y!=="paired"&&e.jsx("div",{className:oe(a.IDLE),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:s.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:y==="connecting"?e.jsx(jt,{size:28,color:s.primary,style:{animation:"spin 1s linear infinite"}}):e.jsx(vn,{size:28,color:s.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:y==="connecting"?"Connecting...":"Disconnected"}),e.jsx("div",{style:{fontSize:"0.82rem",color:s.muted},children:E||(h?"Preparing direct scanner session":`Connecting to session ${d}`)})]}),y==="disconnected"&&e.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[e.jsx(jt,{size:16})," Reconnect"]})]})}),e.jsx("video",{ref:V,autoPlay:!0,playsInline:!0,muted:!0,onClick:()=>{ke().catch(t=>{u((t==null?void 0:t.message)||"Camera access failed.")})},style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(N===a.SCANNING||N===a.CAPTURING)&&!he.current?"block":"none"}}),e.jsx("div",{className:oe(a.IDLE),children:e.jsxs("div",{className:"home-root",children:[e.jsxs("div",{className:"home-header",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16},children:[e.jsxs("button",{onClick:()=>w("/app/scan"),style:{background:"white",border:"1px solid #E2E8F0",padding:"6px 12px",borderRadius:20,fontSize:"0.75rem",fontWeight:600,color:"#475569",display:"flex",alignItems:"center",gap:4,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.02)"},children:[e.jsx(yr,{size:14})," Go Back"]}),e.jsxs("div",{className:"home-logo-badge",children:[e.jsx(Sn,{size:11,color:y==="paired"&&navigator.onLine?"#10B981":"#EF4444"}),Ce]})]}),e.jsx("div",{className:"home-logo-row",children:e.jsxs("div",{className:"home-logo-text",children:[e.jsx("img",{src:"/images/logo.png",alt:"Sea Hawk Logo",style:{height:28,width:"auto",objectFit:"contain",padding:2,background:"white",borderRadius:6,border:"1px solid #E2E8F0"}}),e.jsx("span",{children:"Seahawk Scanner"})]})}),e.jsxs("div",{className:"home-stats-row",children:[e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:O.scanNumber}),e.jsx("div",{className:"home-stat-label",children:"Scanned"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:tn>0?tn.toFixed(1):"0"}),e.jsx("div",{className:"home-stat-label",children:"Total kg"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:ut}),e.jsx("div",{className:"home-stat-label",children:"Session"})]})]}),e.jsxs("div",{className:"home-date-chip",children:[e.jsx(Nn,{size:18,color:"#38BDF8"}),e.jsxs("div",{children:[e.jsx("div",{className:"home-date-label",children:"Scan Date"}),e.jsxs("div",{className:"home-date-value",children:[new Date(ie+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}),ie===new Date().toISOString().slice(0,10)&&e.jsx("span",{style:{fontSize:"0.65rem",color:"#10B981",marginLeft:6,fontWeight:500},children:"TODAY"})]})]}),e.jsx("div",{className:"home-date-change",children:"Change ▸"}),e.jsx("input",{type:"date",value:ie,max:new Date().toISOString().slice(0,10),onChange:t=>{const n=t.target.value;if(n&&/^\d{4}-\d{2}-\d{2}$/.test(n)){Kn(n);try{localStorage.setItem("seahawk_scanner_session_date",n)}catch{}S("light")}}})]})]}),e.jsxs("div",{className:"home-scan-section",children:[e.jsxs("div",{className:"home-scan-btn-wrap",children:[e.jsx("div",{className:"home-scan-ring"}),e.jsx("div",{className:"home-scan-ring home-scan-ring2"}),e.jsxs("button",{"data-testid":"start-scan-btn",className:"home-scan-btn",onClick:er,children:[e.jsx(Et,{size:34,color:"white"}),e.jsx("span",{className:"home-scan-btn-label",children:"Scan"})]})]}),e.jsx("div",{className:"home-cta-text",children:O.scanNumber===0?"Tap to start your first scan":"Tap to scan next parcel"}),e.jsxs("div",{style:{display:"flex",gap:8,marginTop:14,width:"100%",maxWidth:320},children:[e.jsxs("button",{type:"button","data-testid":"workflow-fast-btn",onClick:()=>bt("fast"),style:{flex:1,borderRadius:999,border:`1px solid ${j==="fast"?s.primary:s.border}`,background:j==="fast"?s.primaryLight:s.surface,color:j==="fast"?s.primary:s.muted,fontWeight:700,fontSize:"0.72rem",padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(kn,{size:13})," Fast scan"]}),e.jsxs("button",{type:"button","data-testid":"workflow-ocr-btn",onClick:()=>bt("ocr"),style:{flex:1,borderRadius:999,border:`1px solid ${j==="ocr"?s.primary:s.border}`,background:j==="ocr"?s.primaryLight:s.surface,color:j==="ocr"?s.primary:s.muted,fontWeight:700,fontSize:"0.72rem",padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(Rt,{size:13})," OCR label"]})]}),e.jsxs("div",{style:{display:"flex",gap:8,marginTop:8,width:"100%",maxWidth:320},children:[e.jsxs("button",{type:"button","data-testid":"device-profile-phone-btn",onClick:()=>Pt(H.phone),style:{flex:1,borderRadius:999,border:`1px solid ${U===H.phone?s.primary:s.border}`,background:U===H.phone?s.primaryLight:s.surface,color:U===H.phone?s.primary:s.muted,fontWeight:700,fontSize:"0.7rem",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(Et,{size:13})," Phone lens"]}),e.jsxs("button",{type:"button","data-testid":"device-profile-rugged-btn",onClick:()=>Pt(H.rugged),style:{flex:1,borderRadius:999,border:`1px solid ${U===H.rugged?s.primary:s.border}`,background:U===H.rugged?s.primaryLight:s.surface,color:U===H.rugged?s.primary:s.muted,fontWeight:700,fontSize:"0.7rem",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(jn,{size:13})," Rugged"]})]}),e.jsxs("form",{onSubmit:tr,style:{width:"100%",maxWidth:300,marginTop:20},children:[e.jsx("div",{style:{fontSize:"0.62rem",fontWeight:700,color:s.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6,textAlign:"center"},children:"Can't scan? Enter AWB manually"}),e.jsxs("div",{style:{display:"flex",gap:6},children:[e.jsx("input",{"data-testid":"manual-awb-input",value:$e,onChange:t=>Mt(t.target.value.toUpperCase()),placeholder:"e.g. 1234567890",inputMode:"text",autoCapitalize:"characters",style:{flex:1,padding:"9px 12px",border:`1.5px solid ${s.border}`,borderRadius:10,fontFamily:"JetBrains Mono, monospace",fontSize:"0.82rem",fontWeight:600,background:s.surface,color:s.text,outline:"none"},onFocus:t=>t.target.style.borderColor=s.primary,onBlur:t=>t.target.style.borderColor=s.border}),e.jsx("button",{type:"submit","data-testid":"manual-awb-submit",disabled:$e.trim().length<6,className:"btn btn-primary",style:{padding:"9px 14px",fontSize:"0.78rem",borderRadius:10,opacity:$e.trim().length>=6?1:.45},children:"Go →"})]})]}),e.jsxs("div",{className:"action-buttons-row",children:[e.jsxs("button",{className:"action-btn",onClick:rr,children:[e.jsx(wr,{size:14})," ",k.length>0?`Upload (${k.length})`:"Synced"]}),e.jsxs("button",{className:"action-btn danger",onClick:nr,children:[e.jsx(Cr,{size:14})," End Session"]})]}),k.length>0&&e.jsxs("div",{style:{marginTop:14,fontSize:"0.7rem",color:s.warning,fontWeight:600,display:"flex",alignItems:"center",gap:5},children:[e.jsx(En,{size:12})," ",k.length," offline scan",k.length>1?"s":""," pending sync"]})]}),e.jsxs("div",{className:"home-queue-section",children:[e.jsxs("div",{className:"home-queue-head",children:[e.jsxs("div",{className:"home-queue-title-text",children:[e.jsx(vr,{size:11}),"Accepted Consignments"]}),O.scannedItems.length>0&&e.jsx("div",{className:"home-queue-badge",children:O.scannedItems.length})]}),e.jsx("div",{className:"home-queue-list",children:O.scannedItems.length===0?e.jsxs("div",{className:"queue-empty",children:[e.jsx(It,{size:36,color:"rgba(255,255,255,0.12)"}),e.jsxs("div",{className:"queue-empty-text",children:["No consignments scanned yet.",e.jsx("br",{}),"Tap the button above to begin."]})]}):O.scannedItems.map((t,n)=>e.jsxs("div",{className:"queue-item",children:[e.jsx("div",{className:"queue-check",children:e.jsx(Rn,{size:13,color:"#10B981"})}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{className:"queue-awb",children:t.awb}),e.jsxs("div",{className:"queue-meta",children:[t.clientCode==="OFFLINE"?e.jsx("span",{className:"queue-offline-tag",children:"Offline"}):t.clientCode&&e.jsx("span",{className:"queue-client-tag",children:t.clientCode}),t.destination&&e.jsx("span",{children:t.destination})]})]}),t.weight>0&&e.jsxs("div",{className:"queue-weight",children:[t.weight,"kg"]})]},`${t.awb}-${n}`))})]})]})}),e.jsx("div",{className:oe(a.SCANNING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[e.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:he.current?"block":"none"}}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{className:"scan-guide",style:ve==="barcode"?{width:zn.w,height:zn.h,borderRadius:10,maxHeight:"20vw",transition:"all 0.4s ease",borderColor:E?"rgba(248,113,113,0.92)":void 0,boxShadow:E?"0 0 0 3px rgba(248,113,113,0.2)":void 0}:{width:at.w,height:at.h,borderRadius:14,maxHeight:"75vh",transition:"all 0.4s ease",borderColor:"rgba(251,191,36,0.85)",boxShadow:"0 0 0 3px rgba(251,191,36,0.2)"},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"}),ve==="barcode"&&e.jsx("div",{className:"scan-laser",children:e.jsx("div",{className:"scan-laser-spark"})})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(Sn,{size:12})," ",h?"DIRECT":d]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[ve==="document"&&e.jsxs("div",{className:"cam-hud-chip",style:{background:"rgba(251,191,36,0.22)",color:"#FDE68A",fontWeight:700,fontSize:"0.65rem",gap:4},children:[e.jsx(In,{size:11})," LABEL MODE"]}),e.jsxs("div",{className:"cam-hud-chip",style:{gap:4},children:[e.jsx(It,{size:12})," ",O.scanNumber,Ot==="native"?e.jsx("span",{style:{color:"#34D399",fontSize:"0.6rem",fontWeight:800},children:"⚡ NATIVE"}):e.jsx("span",{style:{color:"#F59E0B",fontSize:"0.6rem",fontWeight:800},children:"ZXING"})]})]})]}),e.jsxs("div",{className:"cam-bottom",children:[ve==="barcode"?e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:6,color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:[e.jsx("div",{children:j==="fast"?"Align barcode inside the strip - auto-save on lock":"Align barcode inside the strip - camera opens for label capture after lock"}),gt>0&&e.jsxs("div",{style:{color:"#FDE68A",fontSize:"0.74rem",fontWeight:700},children:["Reframe retry ",gt,"/",ot]}),!!E&&e.jsx("div",{style:{color:"#FCA5A5",fontSize:"0.72rem",fontWeight:700},children:E})]}):e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:6},children:[e.jsx("div",{style:{color:"rgba(251,191,36,0.95)",fontSize:"0.82rem",fontWeight:700,textAlign:"center"},children:"No barcode found - capture the label and we will read the printed AWB"}),e.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"},children:[e.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:Zn,children:"Capture label instead"}),e.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:()=>{q(0),X(0),u(""),xt("barcode"),S("tap")},children:"Back to barcode mode"})]})]}),e.jsxs("div",{style:{display:"flex",gap:12},children:[e.jsxs("button",{className:"cam-hud-chip",onClick:()=>bt(t=>t==="fast"?"ocr":"fast"),style:{border:"none",cursor:"pointer",gap:5},children:[j==="fast"?e.jsx(kn,{size:13}):e.jsx(Rt,{size:13}),j==="fast"?"FAST":"OCR"]}),e.jsx("button",{className:"cam-hud-chip",onClick:()=>Qn(!ze),style:{border:"none",cursor:"pointer"},children:ze?e.jsx(Sr,{size:14}):e.jsx(Nr,{size:14})})]})]})]})}),e.jsx("div",{className:oe(a.CAPTURING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!Ae&&e.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[e.jsx(kr,{size:44,color:"#34D399"}),e.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:I||"OCR fallback"}),e.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:I?"Barcode locked - Preparing camera...":"Preparing label capture for printed AWB OCR..."})]}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{ref:Xe,className:`scan-guide ${Ie?"detected":""}`,style:{width:at.w,height:at.h,maxHeight:"75vh",borderRadius:12},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[e.jsx(In,{size:12})," ",I||"OCR AWB capture"]}),k.length>0&&e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(En,{size:12})," ",k.length," queued"]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:Ie?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center",transition:"color 0.3s"},children:cr}),C.metrics&&e.jsxs("div",{style:{color:"rgba(255,255,255,0.66)",fontSize:"0.72rem",textAlign:"center"},children:["Blur ",C.metrics.blurScore," | Glare ",C.metrics.glareRatio,"% | Skew ",C.metrics.perspectiveSkew,"%"]}),e.jsx("button",{className:"capture-btn","data-testid":"capture-photo-btn",onClick:sr,disabled:!Zt,style:{opacity:Zt?1:.4},children:e.jsx("div",{className:"capture-btn-inner"})}),x&&e.jsx("button",{type:"button","data-testid":"mock-capture-btn",onClick:ir,style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 12px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:"Mock capture"}),e.jsx("button",{style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},onClick:()=>{ne(""),u(""),q(0),X(0),me.current=!1,S("tap"),l(a.SCANNING)},children:"← Rescan barcode"})]})]})}),e.jsx("div",{className:oe(a.PREVIEW),children:e.jsxs("div",{style:{background:s.bg,display:"flex",flexDirection:"column",height:"100%"},children:[e.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${s.border}`},children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.72rem",color:s.muted,fontWeight:600},children:"CAPTURED"}),e.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:I||"Printed AWB OCR"}),D.kb>0&&e.jsxs("div",{style:{fontSize:"0.68rem",color:s.mutedLight},children:[D.kb,"KB • ",D.width,"×",D.height]})]})}),e.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:Q&&e.jsx("img",{src:Q,alt:"Captured label",className:"preview-img"})}),e.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{Z(null),l(a.CAPTURING)},children:[e.jsx(Fn,{size:16})," Retake"]}),e.jsxs("button",{"data-testid":"use-photo-btn",className:"btn btn-primary",style:{flex:2},onClick:ar,children:[e.jsx(jr,{size:16})," Use Photo"]})]})]})}),e.jsx("div",{className:oe(a.PROCESSING),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16},children:[e.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[e.jsx(Rt,{size:22,color:s.primary,style:{animation:"spin 2s linear infinite"}}),e.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:s.primary},children:"Intelligence Engine"})]}),e.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:s.muted},children:I}),e.jsx("div",{style:{fontSize:"0.72rem",color:s.mutedLight,marginTop:6},children:Q?"Reading AWB label with local OCR...":"Saving barcode scan..."})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(t=>e.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:t}),e.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),e.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},t)),e.jsx("div",{style:{textAlign:"center",marginTop:8},children:e.jsx("button",{className:"btn btn-outline",style:{fontSize:"0.75rem",padding:"8px 20px"},onClick:()=>{u("Cancelled by user."),l(a.ERROR)},children:"Cancel"})})]})}),e.jsx("div",{className:oe(a.REVIEWING),children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%"},children:[e.jsxs("div",{className:"review-header",children:[e.jsxs("div",{className:"review-header-top",children:[e.jsxs("div",{children:[e.jsx("div",{className:"review-title",children:"REVIEW EXTRACTION"}),e.jsx("div",{className:"mono review-awb",children:(o==null?void 0:o.awb)||I})]}),(F==null?void 0:F.learnedFieldCount)>0&&e.jsxs("div",{className:"source-badge source-learned",children:["AI ",F.learnedFieldCount," auto-corrected"]})]}),e.jsxs("div",{className:"review-meta-row",children:[e.jsxs("span",{className:`review-confidence ${Nt.level}`,children:[e.jsx(jn,{size:13}),Nt.label," (",Math.round(Nt.score*100),"%)"]}),e.jsxs("button",{type:"button",className:"review-chip review-chip-courier",onClick:lr,title:"Tap to change courier",children:[e.jsx(It,{size:13}),dr||"Trackon"]}),e.jsxs("span",{className:"review-chip review-chip-date",children:[e.jsx(Nn,{size:13}),ur||"No date"]})]})]}),e.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsxs("div",{className:`field-card ${(((dn=ce.clientCode)==null?void 0:dn.confidence)||0)<.55?"warning":""}`,children:[e.jsx("div",{className:Tt(((un=ce.clientCode)==null?void 0:un.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((pn=ce.clientCode)==null?void 0:pn.source)&&(()=>{const t=$n(ce.clientCode.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:f.clientCode||"",onChange:t=>T(n=>({...n,clientCode:t.target.value.toUpperCase()})),placeholder:"Client code"}),((hn=F==null?void 0:F.clientMatches)==null?void 0:hn.length)>0&&F.clientNeedsConfirmation&&e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:F.clientMatches.slice(0,3).map(t=>e.jsxs("button",{type:"button",className:`suggest-chip ${f.clientCode===t.code?"active":""}`,onClick:()=>T(n=>({...n,clientCode:t.code})),children:[t.code," (",Math.round(t.score*100),"%)"]},t.code))})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:Tt(((mn=ce.consignee)==null?void 0:mn.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Consignee"}),e.jsx("input",{className:"field-input",value:f.consignee||"",onChange:t=>T(n=>({...n,consignee:t.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:Tt(((gn=ce.destination)==null?void 0:gn.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((fn=ce.destination)==null?void 0:fn.source)&&(()=>{const t=$n(ce.destination.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:f.destination||"",onChange:t=>T(n=>({...n,destination:t.target.value.toUpperCase()})),placeholder:"City"}),(F==null?void 0:F.pincodeCity)&&F.pincodeCity!==f.destination&&e.jsxs("button",{onClick:()=>T(t=>({...t,destination:F.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:s.successLight,color:s.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["ðŸ“ Pincode suggests: ",F.pincodeCity]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Pincode"}),e.jsx("input",{className:"field-input",value:f.pincode||"",onChange:t=>T(n=>({...n,pincode:t.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),e.jsx("div",{className:`field-card ${(xn=F==null?void 0:F.weightAnomaly)!=null&&xn.anomaly?"warning":"conf-med"}`,children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Weight (kg)"}),e.jsx("input",{className:"field-input",value:f.weight||"",onChange:t=>T(n=>({...n,weight:t.target.value})),placeholder:"0.0",inputMode:"decimal"}),((bn=F==null?void 0:F.weightAnomaly)==null?void 0:bn.anomaly)&&e.jsxs("div",{style:{fontSize:"0.6rem",color:s.warning,marginTop:2,fontWeight:500},children:["Warning: ",F.weightAnomaly.warning]})]})})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card conf-med",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Amount (₹)"}),e.jsx("input",{className:"field-input",value:f.amount||"",onChange:t=>T(n=>({...n,amount:t.target.value})),placeholder:"0",inputMode:"decimal"})]})}),e.jsx("div",{className:"field-card conf-low",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Order No"}),e.jsx("input",{className:"field-input",value:f.orderNo||"",onChange:t=>T(n=>({...n,orderNo:t.target.value})),placeholder:"Optional"})]})})]})]}),e.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${s.border}`,display:"flex",gap:10},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:He,children:[e.jsx(Er,{size:16})," Skip"]}),e.jsxs("button",{"data-testid":"approve-save-btn",className:"btn btn-success btn-lg",style:{flex:2},onClick:or,disabled:N===a.APPROVING,children:[N===a.APPROVING?e.jsx(jt,{size:16,style:{animation:"spin 1s linear infinite"}}):e.jsx(Rn,{size:16}),N===a.APPROVING?"Saving...":"Approve & Save"]})]})]})}),e.jsx("div",{className:oe(a.APPROVING)}),e.jsx("div",{className:oe(a.SUCCESS),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[e.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:s.success,strokeWidth:"3",className:"success-check-circle"}),e.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:s.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:s.success,marginBottom:4},children:"Saved Successfully"}),e.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700},children:A==null?void 0:A.awb}),(A==null?void 0:A.clientCode)&&e.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:s.primaryLight,color:s.primary,fontSize:"0.78rem",fontWeight:600},children:A.clientName||A.clientCode})]}),e.jsx("div",{style:{fontSize:"0.72rem",color:s.muted},children:A!=null&&A.offlineQueued?`${k.length} queued for sync - Auto-continuing in ${Jt}s`:`#${O.scanNumber} scanned - Auto-continuing in ${Jt}s`}),e.jsxs("button",{"data-testid":"scan-next-btn",className:"btn btn-primary btn-lg btn-full",onClick:()=>He(j==="fast"?a.SCANNING:a.IDLE),style:{maxWidth:320},children:[e.jsx(Et,{size:18})," ",j==="fast"?"Keep Scanning":"Scan Next Parcel"]})]})}),e.jsx("div",{className:oe(a.ERROR),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:s.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(Cn,{size:32,color:s.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:s.error},children:"Scan Error"}),e.jsx("div",{style:{fontSize:"0.82rem",color:s.muted,marginTop:4},children:E})]}),e.jsxs("button",{className:"btn btn-primary",onClick:He,children:[e.jsx(Fn,{size:16})," Try Again"]})]})}),y==="disconnected"&&N!==a.IDLE&&e.jsxs("div",{className:"offline-banner",children:[e.jsx(vn,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline â€” Reconnecting... ",k.length?`(${k.length} queued)`:""]})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{es as default};
