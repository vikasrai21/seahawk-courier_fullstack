import{j as t}from"./page-landing-CREvANXP.js";import{r}from"./vendor-helmet-Dwc3L0SQ.js";import{l as Fr}from"./index-CW2d398h.js";import{a as ue}from"./page-import-CFGNhKM8.js";import{c as Rr,n as Ar}from"./barcodeEngine-BS9nuDjq.js";import{c as zr,u as Tr}from"./vendor-react-DrB23wtn.js";import{b as Rn,R as Bt,b1 as An,Y as Mr,aW as zn,ax as Ot,aX as Dt,Z as Tn,aH as Pt,J as Mn,b2 as Br,ac as Bn,d as On,a7 as Or,H as Lt,b3 as Dn,aQ as Pn,b4 as Dr,b5 as Pr,a4 as Lr,a1 as Ln,p as Wr,X as qr}from"./vendor-icons-DyYViWBt.js";import"./page-reconcile-BQT9N3SU.js";import"./page-rate-calc-CC-LHkCs.js";function Jn(l,d){var w,h;try{if(!l||!d)return null;const R=Number(l.videoWidth||0),D=Number(l.videoHeight||0);if(!R||!D)return null;const $=(w=l.getBoundingClientRect)==null?void 0:w.call(l),b=(h=d.getBoundingClientRect)==null?void 0:h.call(d);if(!$||!b)return null;const f=Number($.width||0),H=Number($.height||0);if(!f||!H)return null;const C=Math.max(f/R,H/D),M=R*C,F=D*C,g=(f-M)/2,N=(H-F)/2,ze=b.left-$.left,A=b.top-$.top,ie=b.right-$.left,X=b.bottom-$.top,ne=(ze-g)/C,we=(A-N)/C,ae=(ie-g)/C,o=(X-N)/C,re=(Ce,Se,j)=>Math.max(Se,Math.min(j,Ce)),m=re(Math.min(ne,ae),0,R),B=re(Math.min(we,o),0,D),T=re(Math.max(ne,ae),0,R),P=re(Math.max(we,o),0,D),he=Math.max(0,T-m),_=Math.max(0,P-B);return!he||!_?null:{x:m,y:B,w:he,h:_}}catch{return null}}function Wn(l=[]){if(!l.length)return"";const d=[];return l.includes("blur")&&d.push("hold steady"),l.includes("glare")&&d.push("reduce glare"),l.includes("angle")&&d.push("straighten angle"),l.includes("dark")&&d.push("add light"),l.includes("low_edge")&&d.push("fill frame"),d.length?`Improve capture: ${d.join(", ")}.`:""}function $r(l,d){if(!l||!d||!l.videoWidth||!l.videoHeight)return null;const w=Jn(l,d);if(!w)return null;const h=Math.max(0,Math.floor(w.x)),R=Math.max(0,Math.floor(w.y)),D=Math.max(24,Math.floor(w.w)),$=Math.max(24,Math.floor(w.h)),b=128,f=96,H=document.createElement("canvas");H.width=b,H.height=f;const C=H.getContext("2d",{willReadFrequently:!0});if(!C)return null;C.drawImage(l,h,R,Math.min(D,l.videoWidth-h),Math.min($,l.videoHeight-R),0,0,b,f);const M=C.getImageData(0,0,b,f).data,F=b*f,g=new Float32Array(F);let N=0,ze=0,A=0;for(let W=0,J=0;W<M.length;W+=4,J+=1){const v=.2126*M[W]+.7152*M[W+1]+.0722*M[W+2];g[J]=v,N+=v,v>=245&&(ze+=1),v<=24&&(A+=1)}let ie=0,X=0,ne=0,we=0,ae=0,o=0;const re=Math.max(4,Math.floor(f*.15)),m=Math.max(4,Math.floor(b*.15)),B=b;for(let W=1;W<f-1;W+=1)for(let J=1;J<b-1;J+=1){const v=W*B+J,Ue=g[v],L=g[v-1],Me=g[v+1],Be=g[v-B],pe=g[v+B],wt=Math.abs(Me-L),Ct=Math.abs(pe-Be),ve=wt+Ct,Ge=Math.abs(4*Ue-L-Me-Be-pe);ie+=Ge,ve>58&&(X+=1),W<=re&&(ne+=ve),W>=f-re&&(we+=ve),J<=m&&(ae+=ve),J>=b-m&&(o+=ve)}const T=Math.max(1,(b-2)*(f-2)),P=N/F,he=ie/T,_=X/T,Ce=ze/F,Se=A/F,j=Math.abs(ne-we)/Math.max(1,ne+we),tt=Math.abs(ae-o)/Math.max(1,ae+o),Te=Math.max(j,tt),se=[];return he<22&&se.push("blur"),Ce>.18&&se.push("glare"),(Se>.55||P<40)&&se.push("dark"),_<.08&&se.push("low_edge"),Te>.62&&se.push("angle"),{ok:se.length===0,issues:se,metrics:{brightness:Number(P.toFixed(1)),blurScore:Number(he.toFixed(1)),glareRatio:Number((Ce*100).toFixed(1)),edgeRatio:Number((_*100).toFixed(1)),perspectiveSkew:Number((Te*100).toFixed(1))}}}function yt(l,d){const w=Number(l);return Number.isFinite(w)&&w>0?w:d}function _r({samples:l=[],awb:d,now:w=Date.now(),stabilityWindowMs:h=1100,requiredHits:R=3}){const D=yt(h,1100),$=Math.max(1,Math.floor(yt(R,3))),b=yt(w,Date.now()),f=String(d||"").trim(),H=Array.isArray(l)?l.filter(F=>(F==null?void 0:F.awb)&&b-((F==null?void 0:F.at)||0)<=D):[];if(!f)return{samples:H,hits:0,isStable:!1};const C=[...H,{awb:f,at:b}],M=C.reduce((F,g)=>g.awb===f?F+1:F,0);return{samples:C,hits:M,isStable:M>=$}}function Ur({currentAttempts:l=0,maxReframeAttempts:d=2}){const w=Math.max(0,Math.floor(yt(d,2))),h=Math.max(0,Math.floor(Number(l)||0))+1;return h<=w?{action:"reframe",attempts:h}:{action:"switch_to_document",attempts:w}}const Gr=window.location.origin,qn={w:"90vw",h:"18vw"},ft={w:"92vw",h:"130vw"},$n=3500,_n=900,Vr=1e4,Hr=12e3,Qr="mobile_scanner_offline_queue",Un="mobile_scanner_workflow_mode",Gn="mobile_scanner_device_profile",Yr=500,Kr=1,Vn=100,mt=2,Wt=2,Xr=500,Hn=960,Re=.68,Jr=900,Y={phone:"phone-camera",rugged:"rugged-scanner"},xt=["Trackon","DTDC","Delhivery","BlueDart"],Ae=/^\d{4}-\d{2}-\d{2}$/,qt=l=>{const d=String(l||"").trim();if(!d)return"";const w=d.toUpperCase();return w.includes("TRACKON")||w.includes("PRIME")?"Trackon":w.includes("DTDC")?"DTDC":w.includes("DELHIVERY")?"Delhivery":w.includes("BLUE")?"BlueDart":d},Qn=l=>{const d=String(l||"").trim();if(!Ae.test(d))return d;try{return new Date(`${d}T00:00:00`).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}catch{return d}},qe=(l,d="")=>{const w=String(l||"").trim();if(Ae.test(w))return w;const h=String(d||"").trim();return Ae.test(h)?h:new Date().toISOString().slice(0,10)},a={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"},Zr=l=>{var d;try{(d=navigator==null?void 0:navigator.vibrate)==null||d.call(navigator,l)}catch{}},Yn={tap:[20],lock:[400,50,200,50,100],success:[18,28,72],warning:[70,50,70],retry:[28,40,28],error:[110,55,110],duplicate:[90,50,90,50,90],review:[200,40,120]},k=(l="tap")=>{Zr(Yn[l]||Yn.tap)},_e=(l,d,w="sine")=>{try{const h=new(window.AudioContext||window.webkitAudioContext),R=h.createOscillator(),D=h.createGain();R.type=w,R.frequency.setValueAtTime(l,h.currentTime),D.gain.setValueAtTime(.12,h.currentTime),D.gain.exponentialRampToValueAtTime(.01,h.currentTime+d),R.connect(D),D.connect(h.destination),R.start(),R.stop(h.currentTime+d)}catch{}},$e=()=>{_e(880,.12),setTimeout(()=>_e(1100,.1),130)},bt=()=>{_e(2700,.08,"square"),setTimeout(()=>_e(3100,.05,"square"),60)},es=()=>_e(600,.08),K=()=>_e(200,.25,"sawtooth"),$t=l=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const d=new SpeechSynthesisUtterance(l);d.rate=1.2,d.pitch=1,d.lang="en-IN",window.speechSynthesis.speak(d)}catch{}},Kn=()=>{var l;try{if(typeof window>"u")return!1;if(window.isSecureContext)return!0;const d=((l=window.location)==null?void 0:l.hostname)||"";return d==="localhost"||d==="127.0.0.1"}catch{return!1}},i={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",mutedLight:"#9CA3AF",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},ts=`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');

.msp-root {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: ${i.bg};
  color: ${i.text};
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
  background: ${i.surface}; border: 1px solid ${i.border};
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
  background: ${i.surface}; border: 1.5px solid ${i.border};
  color: ${i.text};
}
.btn-danger { background: ${i.errorLight}; color: ${i.error}; }
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
  background: ${i.surface}; border: 1px solid ${i.border};
  border-left-width: 4px; border-left-style: solid; border-left-color: transparent;
  border-radius: 12px;
}
.field-card.conf-high { border-left-color: ${i.success}; }
.field-card.conf-med { border-left-color: ${i.warning}; }
.field-card.conf-low { border-left-color: ${i.error}; }
.field-card.warning { border-color: ${i.warning}; background: ${i.warningLight}; border-left-color: ${i.warning}; }
.field-card.error-field { border-color: ${i.error}; background: ${i.errorLight}; border-left-color: ${i.error}; }
.field-label {
  font-size: 0.65rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em;
  color: ${i.muted}; margin-bottom: 2px;
}
.field-value {
  font-size: 0.85rem; font-weight: 600;
  color: ${i.text};
}
.field-input {
  width: 100%; background: ${i.bg}; border: 1px solid ${i.border};
  border-radius: 8px; padding: 8px 10px;
  font-family: inherit; font-size: 0.82rem; font-weight: 500;
  color: ${i.text}; outline: none;
}
.field-input:focus { border-color: ${i.primary}; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }

/* ——— Confidence dot ——— */
.conf-dot {
  width: 8px; height: 8px; border-radius: 50%;
  flex-shrink: 0; margin-top: 4px;
}
.conf-high { background: ${i.success}; }
.conf-med { background: ${i.warning}; }
.conf-low { background: ${i.error}; }

/* ——— Source badge ——— */
.source-badge {
  font-size: 0.6rem; padding: 2px 6px; border-radius: 6px;
  font-weight: 600; display: inline-flex; align-items: center; gap: 3px;
}
.source-learned { background: #F5F3FF; color: #7C3AED; }
.source-ai { background: ${i.primaryLight}; color: ${i.primary}; }
.source-history { background: ${i.warningLight}; color: ${i.warning}; }
.source-pincode { background: ${i.successLight}; color: ${i.success}; }

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
  border: 1px solid ${i.border};
  background: ${i.surface};
  color: ${i.text};
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
  touch-action: manipulation;
}
.suggest-chip.active {
  background: ${i.primaryLight};
  color: ${i.primary};
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
  background: ${i.warningLight}; color: ${i.warning};
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
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 20px; border-bottom: 1px solid #F1F5F9;
  animation: slideIn 0.3s ease-out;
}
.queue-item:active { background: #F8FAFC; }
.queue-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.queue-main-top { display: flex; align-items: center; gap: 8px; }
.queue-check {
  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
  background: #ECFDF5; border: 1.5px solid #10B981;
  display: flex; align-items: center; justify-content: center;
}
.queue-awb { font-family: 'JetBrains Mono', 'SF Mono', monospace; font-size: 0.8rem; font-weight: 600; color: #0F172A; }
.queue-meta { font-size: 0.64rem; color: #64748B; margin-top: 2px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.queue-client-tag { background: #EEF2FF; color: #4F46E5; padding: 1px 6px; border-radius: 4px; }
.queue-offline-tag { background: #FFFBEB; color: #D97706; padding: 1px 6px; border-radius: 4px; }
.queue-date-tag { background: #EFF6FF; color: #1D4ED8; padding: 1px 6px; border-radius: 4px; }
.queue-weight { font-size: 0.72rem; font-weight: 700; color: #4F46E5; margin-left: auto; flex-shrink: 0; }
.queue-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.queue-date-editor { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.queue-date-input {
  height: 28px; border-radius: 8px; border: 1px solid #CBD5E1;
  padding: 0 8px; font-size: 0.72rem; color: #0F172A; background: #FFFFFF;
}
.queue-action-btn {
  height: 28px; border-radius: 8px; border: 1px solid #CBD5E1;
  background: #FFFFFF; color: #334155; font-size: 0.68rem; font-weight: 700;
  padding: 0 10px; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;
}
.queue-action-btn.primary {
  border-color: #4F46E5; background: #EEF2FF; color: #4338CA;
}
.queue-action-btn.danger {
  border-color: #FECACA; background: #FEF2F2; color: #B91C1C;
}
.queue-action-btn:disabled { opacity: 0.55; cursor: default; }
.queue-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 44px 20px; gap: 12px; }
.queue-empty-text { font-size: 0.8rem; color: #94A3B8; font-weight: 500; text-align: center; line-height: 1.5; }
`,Zn=l=>l>=.85?"high":l>=.55?"med":"low",_t=l=>`conf-dot conf-${Zn(l)}`,Xn=l=>l==="learned"?{className:"source-badge source-learned",icon:"AI",text:"Learned"}:l==="awb_master"?{className:"source-badge source-ai",icon:"DB",text:"Lookup"}:l==="courier_api"?{className:"source-badge source-history",icon:"API",text:"Courier"}:l==="fuzzy_match"?{className:"source-badge source-ai",icon:"🔍",text:"Matched"}:l==="fuzzy_history"||l==="consignee_pattern"?{className:"source-badge source-history",icon:"📊",text:"History"}:l==="delhivery_pincode"||l==="india_post"||l==="pincode_lookup"||l==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"📍",text:"Pincode"}:null,ns=l=>{const d=Math.floor(l/6e4);return d<60?`${d}m`:`${Math.floor(d/60)}h ${d%60}m`};function gs({standalone:l=!1}){var hn,fn,ht,mn,xn,bn,yn,wn,Cn,Sn,vn,kn,Nn,jn,En,In;const{pin:d}=zr(),w=Tr(),h=!!l,R=`${Qr}:${h?"direct":d||"unknown"}`,D=r.useMemo(()=>`mobile_scanner_daily_count:${new Date().toISOString().slice(0,10)}`,[]),$=r.useMemo(()=>{try{return typeof window>"u"?"":new URLSearchParams(window.location.search).get("mockBarcodeRaw")||""}catch{return""}},[]),b=r.useMemo(()=>{try{if(typeof window>"u")return!1;const e=new URLSearchParams(window.location.search);return e.get("mock")==="1"||e.get("e2e")==="1"}catch{return!1}},[]),[f,H]=r.useState(null),[C,M]=r.useState("connecting"),[F,g]=r.useState(""),[N,ze]=r.useState(a.IDLE),[A,ie]=r.useState(""),[X,ne]=r.useState(null),[we,ae]=r.useState({}),[o,re]=r.useState(null),[m,B]=r.useState({}),[T,P]=r.useState(null),[he,_]=r.useState(null),[Ce,Se]=r.useState(""),[j,tt]=r.useState([]),[Te,se]=r.useState(!1),[W,J]=r.useState(0),[v,Ue]=r.useState({ok:!1,issues:[],metrics:null}),[L,Me]=r.useState({kb:0,width:0,height:0,quality:Re}),[Be,pe]=r.useState(!1),[wt,Ct]=r.useState("0m"),[ve,Ge]=r.useState("Connected"),[Ve,Ut]=r.useState(""),[St,er]=r.useState(!1),[Gt,vt]=r.useState("idle"),[oe,tr]=r.useState(null),[nr,rr]=r.useState(0),[kt,sr]=r.useState(0),[Vt,Nt]=r.useState(null),[ke,jt]=r.useState("barcode"),[E,Et]=r.useState(()=>{if(typeof window>"u")return"fast";try{const e=localStorage.getItem(Un);if(e==="fast"||e==="ocr")return e}catch{}return b?"ocr":"fast"}),[U,Ht]=r.useState(()=>{if(typeof window>"u")return Y.phone;try{const e=localStorage.getItem(Gn);if(e===Y.phone||e===Y.rugged)return e}catch{}return Y.phone}),It=r.useRef(0),[O,He]=r.useState({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now(),scannedItems:[]}),[Oe,ir]=r.useState(!1),[ar,nt]=r.useState(""),[rt,st]=r.useState(""),[Ne,it]=r.useState(""),[I,or]=r.useState(()=>{try{const e=localStorage.getItem("seahawk_scanner_session_date");if(e&&Ae.test(e))return e}catch{}return new Date().toISOString().slice(0,10)}),Q=r.useRef(null),at=r.useRef(null),fe=r.useRef(null),me=r.useRef(null),xe=r.useRef(!1),ot=r.useRef(null),cr=r.useRef(!1),ge=r.useRef(a.IDLE),Ft=r.useRef(null),Qe=r.useRef(0),je=r.useRef(null),Rt=r.useRef(new Set),Ye=r.useRef([]),ct=r.useRef({awb:"",hits:0,lastSeenAt:0}),Qt=r.useRef(0),Ke=r.useRef(!1),Yt=r.useRef(0),Ee=r.useRef(null),lr=r.useRef(null),At=r.useRef({message:"",at:0}),ce=r.useRef({lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]}),be=r.useRef(null),Kt=r.useRef(null),Xt=r.useRef({}),lt=r.useRef(null),dt=r.useRef(null),ut=r.useRef(null),u=r.useCallback(e=>{ze(e)},[]),G=r.useCallback(e=>{It.current=e,rr(e)},[]),Z=r.useCallback(e=>{Qt.current=e,sr(e)},[]),zt=r.useCallback((e,n="warning")=>{if(!e)return;const s=Date.now();At.current.message===e&&s-At.current.at<Jr||(At.current={message:e,at:s},g(e),n&&k(n))},[]),Jt=r.useCallback(e=>{G(0),Z(0),jt("document"),g(e||'No barcode lock yet. Capture label instead or tap "Back to barcode mode" and hold steady.'),k("warning")},[G,Z]),pt=r.useCallback(()=>{const e=Ur({currentAttempts:Qt.current,maxReframeAttempts:mt});if(e.action==="reframe"){Z(e.attempts),G(0),g(`No lock yet. Reframe ${e.attempts}/${mt}: move closer, reduce glare, keep barcode horizontal.`),k("retry");return}Jt("No stable barcode lock after reframe retries. Capture label for OCR fallback.")},[Jt,G,Z]),dr=r.useCallback(()=>{ie(""),g(""),u(a.CAPTURING)},[u]),Zt=r.useCallback(e=>{const n=Date.now(),s=_r({samples:Ye.current,awb:e,now:n,stabilityWindowMs:Yr,requiredHits:Kr});return Ye.current=s.samples,ct.current={awb:e,hits:s.hits,lastSeenAt:n},s.isStable},[]),Ie=r.useCallback(async()=>{var s;if(!Kn())throw new Error("Camera requires HTTPS (or localhost). Open this page over https:// on your phone.");if(!((s=navigator==null?void 0:navigator.mediaDevices)!=null&&s.getUserMedia))throw new Error("Camera not supported on this browser/device.");if(!Q.current)throw new Error("Camera element not ready.");const e=Q.current.srcObject;if(e&&typeof e.getTracks=="function"&&e.getTracks().some(x=>x.readyState==="live")){await Q.current.play();return}let n=null;try{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}Q.current.srcObject=n,await Q.current.play()},[]);r.useEffect(()=>{const e=setInterval(()=>Ct(ns(Date.now()-O.startedAt)),3e4);return()=>clearInterval(e)},[O.startedAt]);const Xe=r.useCallback(e=>{tt(e);try{e.length?localStorage.setItem(R,JSON.stringify(e)):localStorage.removeItem(R)}catch{}},[R]),De=r.useCallback(e=>{const n={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:e};return Xe([...j,n]),n},[j,Xe]),en=r.useCallback(async e=>{if(String((e==null?void 0:e.scanMode)||"").toLowerCase()==="fast_barcode_only"){await ue.post("/shipments/scan",{awb:e.awb,courier:"AUTO",captureOnly:!0,sessionContext:e.sessionContext||{}});return}await ue.post("/shipments/scan-mobile",{awb:e.awb,imageBase64:e.imageBase64,focusImageBase64:e.focusImageBase64||e.imageBase64,sessionContext:e.sessionContext||{}})},[]),Je=r.useCallback(async()=>{var e;if(j.length){if(h){if(!navigator.onLine)return;const n=[];for(const s of j)if((e=s==null?void 0:s.payload)!=null&&e.awb)try{await en(s.payload)}catch{n.push(s)}Xe(n),n.length?g(`Uploaded partially. ${n.length} scan(s) still queued.`):g("");return}!f||!f.connected||(j.forEach(n=>{var s;(s=n==null?void 0:n.payload)!=null&&s.awb&&f.emit("scanner:scan",n.payload)}),Xe([]))}},[h,f,j,Xe,en]),q=r.useCallback(e=>{He(n=>{const s={...e,awb:String((e==null?void 0:e.awb)||"").trim().toUpperCase(),queueId:(e==null?void 0:e.queueId)||`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,date:qe(e==null?void 0:e.date,I),time:(e==null?void 0:e.time)||Date.now()},c={...n,scannedItems:[s,...n.scannedItems]};try{localStorage.setItem(D,String(c.scanNumber))}catch{}return c})},[D,I]),tn=r.useCallback((e,n="")=>{e&&(He(s=>{const c=s.scannedItems.filter(S=>S.queueId!==e),x=new Set(s.scannedAwbs),y=String(n||"").trim().toUpperCase();return y&&x.delete(y),Rt.current=x,{...s,scannedItems:c,scannedAwbs:x}}),nt(s=>s===e?"":s))},[]),ur=r.useCallback(e=>{e!=null&&e.queueId&&(nt(e.queueId),st(qe(e.date,I)))},[I]),pr=r.useCallback(()=>{nt(""),st("")},[]),gr=r.useCallback(async e=>{if(!(e!=null&&e.queueId))return;const n=String(rt||"").trim();if(!Ae.test(n)){window.alert("Please select a valid date.");return}it(e.queueId);try{e.shipmentId&&await ue.put(`/shipments/${e.shipmentId}`,{date:n}),He(s=>({...s,scannedItems:s.scannedItems.map(c=>c.queueId===e.queueId?{...c,date:n}:c)})),nt(""),st("")}catch(s){window.alert((s==null?void 0:s.message)||"Could not update consignment date.")}finally{it("")}},[rt]),hr=r.useCallback(async e=>{if(!(e!=null&&e.queueId))return;const n=String(e.awb||"").trim()||"this consignment",s=e.shipmentId?`Delete ${n}? This will remove it from accepted consignments and from the server.`:`Remove ${n} from accepted consignments?`;if(window.confirm(s)){it(e.queueId);try{e.shipmentId&&await ue.delete(`/shipments/${e.shipmentId}`),tn(e.queueId,e.awb)}catch(c){window.alert((c==null?void 0:c.message)||"Could not delete consignment.")}finally{it("")}}},[tn]);r.useEffect(()=>{lt.current=q},[q]),r.useEffect(()=>{Kt.current=o},[o]),r.useEffect(()=>{Xt.current=m},[m]);const fr=r.useCallback(()=>{if(C!=="paired"){g(h?"Scanner is offline. Reconnect internet and retry.":"Phone is not connected to the desktop session.");return}if(g(""),b){u(a.SCANNING);return}Ie().then(()=>u(a.SCANNING)).catch(e=>g((e==null?void 0:e.message)||"Camera access failed."))},[C,Ie,u,b,h]),mr=r.useCallback(e=>{var s;e==null||e.preventDefault();const n=Ve.trim().toUpperCase();if(!n||n.length<6){g("Enter a valid AWB number (min 6 chars)");return}if(C!=="paired"){g(h?"Scanner is offline. Reconnect internet and retry.":"Not connected to desktop session.");return}if(g(""),Ut(""),ie(n),b){pe(!0),u(a.CAPTURING);return}if(E==="fast"){(s=Ee.current)==null||s.call(Ee,n);return}pe(!0),u(a.CAPTURING)},[Ve,C,u,b,h,E]),xr=r.useCallback(()=>{if(window.confirm(h?"Exit this scanner session on the phone?":"End this mobile scanner session on the phone?")){if(h){w("/app/scan");return}f!=null&&f.connected?f.emit("scanner:end-session",{reason:"Mobile ended the session"}):w("/")}},[f,w,h]),br=r.useCallback(()=>{if(j.length>0){Je();return}window.alert(h?"No queued scans to upload.":"Everything is already synced.")},[j.length,Je,h]);r.useEffect(()=>{ge.current=N},[N]);const ye=r.useCallback((e=null)=>{e&&re(e),ae({}),g(""),u(a.CAPTURING)},[u]),Pe=r.useCallback(e=>{if(!e)return;if(re(e),B({clientCode:e.clientCode||"",consignee:e.consignee||"",destination:e.destination||"",pincode:e.pincode||"",weight:e.weight||0,amount:e.amount||0,orderNo:e.orderNo||"",courier:qt(e.courier||""),date:e.date||I||new Date().toISOString().slice(0,10)}),ae({}),e.reviewRequired){k("review"),bt(),u(a.REVIEWING);return}$e(),k("success"),Oe&&$t(`Auto approved. ${e.clientName||""}. ${e.destination||""}.`);const n={awb:e.awb,clientCode:e.clientCode,clientName:e.clientName,destination:e.destination||"",weight:e.weight||0,autoApproved:!0,shipmentId:e.shipmentId||null,date:qe(e.date,I)};P(n),q(n),u(a.SUCCESS)},[q,u,Oe,I]);r.useEffect(()=>{dt.current=ye},[ye]),r.useEffect(()=>{ut.current=Pe},[Pe]),r.useEffect(()=>{if(b){M("paired"),Ge("Mock Mode"),g(""),u(a.IDLE);return}if(h){H(null),M("paired"),Ge("Direct Mode"),g(""),u(a.IDLE);return}if(!d){g("No PIN provided.");return}const e=Fr(Gr,{auth:{scannerPin:d},transports:["websocket","polling"],reconnection:!0,reconnectionDelay:1500,reconnectionAttempts:20});return e.on("connect",()=>M("connecting")),e.on("scanner:paired",({userEmail:n})=>{M("paired"),Ge(n?n.split("@")[0]:"Connected"),g("");const s=ge.current;s===a.PROCESSING||s===a.REVIEWING||s===a.APPROVING||s===a.SUCCESS||u(a.IDLE)}),e.on("scanner:error",({message:n})=>{g(n),M("disconnected")}),e.on("scanner:session-ended",({reason:n})=>{M("disconnected"),g(n||"Session ended by desktop."),w("/")}),e.on("disconnect",()=>M("disconnected")),e.on("reconnect",()=>{const n=ge.current;if(n===a.PROCESSING||n===a.REVIEWING||n===a.APPROVING||n===a.SUCCESS){M("paired");return}M("paired"),u(a.SCANNING)}),e.on("scanner:scan-processed",n=>{var c,x;const s=ge.current;if(!(s!==a.PROCESSING&&s!==a.REVIEWING)){if(n.status==="error"){if(s!==a.PROCESSING)return;_("error"),K(),k("error"),u(a.ERROR),g(n.error||"Scan failed on desktop.");return}if(n.status==="photo_required"||n.requiresImageCapture){(c=dt.current)==null||c.call(dt,n);return}(x=ut.current)==null||x.call(ut,n)}}),e.on("scanner:approval-result",({success:n,message:s,awb:c,shipmentId:x})=>{var p;const y=Kt.current||{},S=Xt.current||{};if(n){bt(),k("success"),_("success");const ee={awb:(y==null?void 0:y.awb)||c,clientCode:S.clientCode,clientName:(y==null?void 0:y.clientName)||S.clientCode,destination:S.destination||"",weight:parseFloat(S.weight)||0,shipmentId:x||(y==null?void 0:y.shipmentId)||null,date:qe(S.date||(y==null?void 0:y.date),"")};P(ee),(p=lt.current)==null||p.call(lt,ee),u(a.SUCCESS)}else K(),k("error"),g(s||"Approval failed.")}),e.on("scanner:ready-for-next",()=>{}),H(e),()=>{e.disconnect()}},[d,u,w,b,h]),r.useEffect(()=>{try{const e=localStorage.getItem(R);if(!e)return;const n=JSON.parse(e);Array.isArray(n)&&n.length&&tt(n)}catch{}},[R]),r.useEffect(()=>{try{localStorage.setItem(Un,E)}catch{}},[E]),r.useEffect(()=>{try{localStorage.setItem(Gn,U)}catch{}},[U]),r.useEffect(()=>{if(j.length){if(h){C==="paired"&&navigator.onLine&&Je();return}C==="paired"&&(f!=null&&f.connected)&&Je()}},[C,f,j.length,Je,h]);const Le=r.useCallback(async()=>{var e;try{if(pe(!1),be.current&&be.current.stop(),me.current){try{const n=me.current;n!=null&&n.barcodeScanner&&await n.barcodeScanner.dispose()}catch{}me.current=null}if(fe.current){try{await fe.current.reset()}catch{}fe.current=null}(e=Q.current)!=null&&e.srcObject&&(Q.current.srcObject.getTracks().forEach(n=>n.stop()),Q.current.srcObject=null)}catch{}},[]),We=r.useCallback(async()=>{try{if(vt("idle"),be.current&&be.current.stop(),me.current){try{await me.current.barcodeScanner.dispose()}catch{}me.current=null}if(fe.current){try{fe.current._type==="native"?fe.current.reset():await fe.current.reset()}catch{}fe.current=null}}catch{}},[]),nn=r.useCallback(async()=>{if(Q.current){await We();try{Qe.current=Date.now(),await Ie(),be.current||(be.current=Rr()),await be.current.start(Q.current,at.current,{onDetected:(e,n)=>{var x;if(xe.current)return;G(0);const s=(n==null?void 0:n.format)||"unknown",c=(n==null?void 0:n.engine)||"unknown";tr({value:e,format:s,engine:c,at:Date.now(),sinceStartMs:Qe.current?Date.now()-Qe.current:null,candidateCount:(n==null?void 0:n.candidateCount)||1,ambiguous:!1,alternatives:(n==null?void 0:n.alternatives)||[]}),vt(c),(x=je.current)==null||x.call(je,e,{candidateCount:(n==null?void 0:n.candidateCount)||1,ambiguous:!1,alternatives:(n==null?void 0:n.alternatives)||[],format:s,engine:c})},onFail:()=>{const e=It.current+1;G(e),e>=Vn&&pt()},onEngineReady:e=>{console.log(`[MobileScanner] Barcode engine ready: ${e}`),vt(e)}})}catch(e){g("Camera access failed: "+e.message)}}},[Ie,We,pt,G]),rn=r.useCallback((e,n={})=>{var y;const s=String(e||"").trim().replace(/\s+/g,"").toUpperCase(),c=Ar(e)||s;if(xe.current||ge.current!==a.SCANNING)return;if(!c||c.length<8){s.replace(/[^A-Z0-9]/g,"").length>=4&&zt("Partial barcode detected. Move closer so full AWB is visible.");return}if(n!=null&&n.ambiguous){const S=It.current+1;G(S),zt("Multiple barcodes detected. Keep only the AWB barcode inside the strip.","retry"),S>=Vn&&pt();return}if(!b&&!Zt(c))return;if(xe.current=!0,Rt.current.has(c)){k("duplicate"),K(),Se(c),setTimeout(()=>{Se(""),xe.current=!1,ct.current={awb:"",hits:0,lastSeenAt:0},Ye.current=[]},2500);return}clearTimeout(Ft.current),k("lock"),bt(),ie(c);const x=Qe.current?Date.now()-Qe.current:null;if(Nt(x),ce.current={lockTimeMs:x,candidateCount:Number((n==null?void 0:n.candidateCount)||1),ambiguous:!!(n!=null&&n.ambiguous),alternatives:Array.isArray(n==null?void 0:n.alternatives)?n.alternatives.slice(0,3):[]},Z(0),G(0),g(""),He(S=>{const p={...S,scanNumber:S.scanNumber+1};return p.scannedAwbs=new Set(S.scannedAwbs),p.scannedAwbs.add(c),Rt.current=p.scannedAwbs,p}),E==="fast"){(y=Ee.current)==null||y.call(Ee,c);return}pe(!0),u(a.CAPTURING)},[u,Zt,E,b,G,Z,zt,pt]);r.useEffect(()=>{je.current=rn},[rn]),r.useEffect(()=>{if(N===a.SCANNING&&(xe.current=!1,ct.current={awb:"",hits:0,lastSeenAt:0},Ye.current=[],ce.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},Nt(null),Z(0),G(0),jt("barcode"),nn(),b&&$)){const e=setTimeout(()=>{var n;ge.current===a.SCANNING&&((n=je.current)==null||n.call(je,$))},50);return()=>clearTimeout(e)}return()=>{N===a.SCANNING&&We()}},[N,nn,We,G,Z,b,$]);const sn=r.useCallback(async()=>{if(b){pe(!0);return}await We();try{await Ie(),pe(!0)}catch(e){g("Camera access failed: "+e.message)}},[Ie,We,b]);r.useEffect(()=>{N===a.CAPTURING&&sn()},[N,sn]);const gt=r.useCallback(()=>{const e=Q.current,n=at.current;return $r(e,n)},[]);r.useEffect(()=>{if(N!==a.CAPTURING){se(!1),J(0),Ue({ok:!1,issues:[],metrics:null}),cr.current=!1,Ke.current=!1;return}const e=setInterval(()=>{const n=gt();n&&(Ue(n),se(n.ok),J(s=>{const c=n.ok?Math.min(s+1,8):0;return c>=Wt&&!Ke.current&&(k("tap"),Ke.current=!0),n.ok||(Ke.current=!1),c}))},280);return()=>clearInterval(e)},[N,gt]);const an=r.useCallback((e={})=>{const n=Q.current,s=at.current;if(!n||!s||!n.videoWidth)return null;const c=Jn(n,s);if(!c)return null;const x=c.x,y=c.y,S=c.w,p=c.h;if(!S||!p)return null;const ee=Math.max(640,Number(e.maxWidth||Hn)),V=Math.min(.85,Math.max(.55,Number(e.quality||Re))),te=document.createElement("canvas");te.width=Math.min(ee,Math.round(S)),te.height=Math.round(te.width/S*p),te.getContext("2d").drawImage(n,x,y,S,p,0,0,te.width,te.height);const et=te.toDataURL("image/jpeg",V).split(",")[1]||"";if(!et)return null;const Ir=Math.floor(et.length*3/4);return{base64:et,width:te.width,height:te.height,approxBytes:Ir,quality:V}},[]),yr=r.useCallback(()=>{const e=Date.now();if(e-Yt.current<Xr)return;Yt.current=e;const n=gt()||v;if(!(n!=null&&n.ok)||W<Wt){g(Wn(n==null?void 0:n.issues)||"Capture quality is low. Hold steady and align the AWB in the frame."),k("warning"),K();return}_("white"),es(),k("tap");const s=an({maxWidth:Hn,quality:Re});if(!(s!=null&&s.base64)){g("Could not capture image. Try again."),xe.current=!1;return}Me({kb:Math.round((s.approxBytes||0)/1024),width:s.width||0,height:s.height||0,quality:s.quality||Re}),ne(`data:image/jpeg;base64,${s.base64}`),Le(),u(a.PREVIEW)},[an,Le,u,gt,v,W]),wr=r.useCallback(()=>{if(!b)return;const e="data:image/jpeg;base64,ZmFrZS1tb2NrLWltYWdl";Me({kb:0,width:0,height:0,quality:Re}),ne(e),Le(),u(a.PREVIEW)},[u,b,Le]),Fe=r.useCallback(()=>{var e,n,s;return{scanNumber:O.scanNumber,recentClient:O.dominantClient,dominantClient:O.dominantClient,dominantClientCount:O.dominantClientCount,sessionDurationMin:Math.round((Date.now()-O.startedAt)/6e4),sessionDate:I,scanWorkflowMode:E,scanMode:ke,deviceProfile:U,hardwareClass:U===Y.rugged?"rugged":"phone",captureQuality:{ok:!!v.ok,issues:Array.isArray(v.issues)?v.issues.slice(0,8):[],metrics:v.metrics||null},captureMeta:{kb:L.kb||0,width:L.width||0,height:L.height||0,quality:L.quality||Re},lockTimeMs:Number.isFinite(Number((e=ce.current)==null?void 0:e.lockTimeMs))?Number(ce.current.lockTimeMs):null,lockCandidateCount:Number.isFinite(Number((n=ce.current)==null?void 0:n.candidateCount))?Number(ce.current.candidateCount):1,lockAlternatives:Array.isArray((s=ce.current)==null?void 0:s.alternatives)?ce.current.alternatives.slice(0,3):[]}},[O,I,E,ke,U,v,L]),on=r.useCallback(async e=>{var c,x;const n=String(e||"").trim().toUpperCase();if(!n)return;if(u(a.PROCESSING),b){setTimeout(()=>{const y={awb:n,clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25,date:I};P(y),q(y),u(a.SUCCESS)},120);return}const s={awb:n,imageBase64:null,focusImageBase64:null,scanMode:"fast_barcode_only",sessionContext:Fe()};if(h){if(!navigator.onLine){De(s),$e(),k("success");const y={awb:n,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0,date:I};P({...y,offlineQueued:!0}),q(y),u(a.SUCCESS);return}try{const y=await ue.post("/shipments/scan",{awb:n,courier:"AUTO",captureOnly:!0,sessionContext:Fe()}),S=((c=y==null?void 0:y.data)==null?void 0:c.shipment)||{},p={awb:S.awb||n,clientCode:S.clientCode||"MISC",clientName:((x=S.client)==null?void 0:x.company)||S.clientCode||"Scanned",destination:S.destination||"",weight:S.weight||0,shipmentId:S.id||null,date:qe(S.date,I)};P(p),q(p),$e(),k("success"),u(a.SUCCESS)}catch(y){g((y==null?void 0:y.message)||"Barcode processing failed. Please try again."),K(),k("error"),u(a.ERROR)}return}if(!f||!f.connected||C!=="paired"){De(s),$e(),k("success");const y={awb:n,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0,date:I};P({...y,offlineQueued:!0}),q(y),u(a.SUCCESS);return}f.emit("scanner:scan",s),setTimeout(()=>{ge.current===a.PROCESSING&&(g("Barcode processing timed out. Please try scanning again."),K(),k("error"),u(a.ERROR))},Vr)},[f,C,u,b,De,q,Fe,h,I]);r.useEffect(()=>{Ee.current=on},[on]);const cn=r.useCallback(async e=>{const n=String(e||"").trim().toUpperCase();if(!n)return;if(u(a.PROCESSING),b){u(a.CAPTURING);return}const s={awb:n,scanMode:"lookup_first",sessionContext:Fe()};if(h){if(!navigator.onLine){ye({awb:n,status:"photo_required",requiresImageCapture:!0});return}try{const c=await ue.post("/shipments/scan-mobile",s),x=(c==null?void 0:c.data)||c;if(x.status==="error"||!x.success){_("error"),K(),k("error"),u(a.ERROR),g(x.error||x.message||"Lookup failed.");return}if(x.status==="photo_required"||x.requiresImageCapture){ye(x);return}Pe(x)}catch(c){g((c==null?void 0:c.message)||"Lookup failed. Please try again."),K(),k("error"),u(a.ERROR)}return}if(!f||!f.connected||C!=="paired"){ye({awb:n,status:"photo_required",requiresImageCapture:!0});return}f.emit("scanner:scan",s),setTimeout(()=>{ge.current===a.PROCESSING&&(g("Lookup timed out. Capture the label photo and continue."),u(a.CAPTURING))},Hr)},[f,C,u,b,Fe,h,ye,Pe]);r.useEffect(()=>{lr.current=cn},[cn]);const Cr=r.useCallback(async()=>{if(!X)return;if(u(a.PROCESSING),b){setTimeout(()=>{const s={awb:A||"100454974120",clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25,date:I};P(s),q(s),u(a.SUCCESS)},250);return}const e=X.split(",")[1]||X,n={awb:A||"",imageBase64:e,focusImageBase64:e,scanMode:"ocr_label",sessionContext:Fe()};if(h){if(!navigator.onLine){De(n),$e(),k("success");const s={awb:A||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0,date:I};P({...s,offlineQueued:!0}),q(s),u(a.SUCCESS);return}try{const s=await ue.post("/shipments/scan-mobile",n),c=(s==null?void 0:s.data)||s;if(c.status==="error"||!c.success){_("error"),K(),k("error"),u(a.ERROR),g(c.error||c.message||"Scan failed.");return}if(c.status==="photo_required"||c.requiresImageCapture){ye(c);return}Pe(c)}catch(s){g((s==null?void 0:s.message)||"Server error. Please try again."),K(),k("error"),u(a.ERROR)}return}if(!f||!f.connected||C!=="paired"){De(n),$e(),k("success");const s={awb:A||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0,date:I};P({...s,offlineQueued:!0}),q(s),u(a.SUCCESS);return}f.emit("scanner:scan",n),setTimeout(()=>{ge.current===a.PROCESSING&&(g("OCR timed out after 40 seconds. Retake the label photo and try again."),K(),k("error"),u(a.ERROR))},4e4)},[f,A,X,u,C,De,q,b,Fe,h,Pe,ye,I]),Sr=r.useCallback(async()=>{var y,S;if(!o)return;u(a.APPROVING);let e=!h;const n=m.date||I||new Date().toISOString().slice(0,10);if(b){setTimeout(()=>{const p={awb:o.awb||A,clientCode:m.clientCode||"MOCKCL",clientName:o.clientName||m.clientCode||"Mock Client",destination:m.destination||"",weight:parseFloat(m.weight)||0,shipmentId:o.shipmentId||null,date:n};P(p),q(p),_("success"),e=!0,u(a.SUCCESS)},200);return}const s={clientCode:o.clientCode||"",clientName:o.clientName||"",consignee:o.consignee||"",destination:o.destination||""},c={clientCode:m.clientCode||"",clientName:m.clientCode||"",consignee:m.consignee||"",destination:m.destination||""},x={clientCode:m.clientCode,consignee:m.consignee,destination:m.destination,pincode:m.pincode,weight:parseFloat(m.weight)||0,amount:parseFloat(m.amount)||0,orderNo:m.orderNo||"",courier:m.courier||"",date:n};if(h)try{(o.ocrExtracted||o)&&await ue.post("/shipments/learn-corrections",{ocrFields:s,approvedFields:c});let p=null;if(o.shipmentId){const V=await ue.put(`/shipments/${o.shipmentId}`,x);p=(V==null?void 0:V.data)||null}else{const V=await ue.post("/shipments",{awb:o.awb||A,...x});p=(V==null?void 0:V.data)||null}bt(),k("success"),_("success");const ee={awb:(p==null?void 0:p.awb)||(o==null?void 0:o.awb)||A,clientCode:(p==null?void 0:p.clientCode)||m.clientCode,clientName:(o==null?void 0:o.clientName)||((y=p==null?void 0:p.client)==null?void 0:y.company)||m.clientCode,destination:(p==null?void 0:p.destination)||m.destination||"",weight:parseFloat((p==null?void 0:p.weight)??m.weight)||0,shipmentId:(p==null?void 0:p.id)||(o==null?void 0:o.shipmentId)||null,date:qe(p==null?void 0:p.date,n)};P(ee),q(ee),e=!0,u(a.SUCCESS)}catch(p){u(a.REVIEWING),K(),k("error"),g((p==null?void 0:p.message)||"Approval failed.")}else{if(!f){u(a.REVIEWING),g("Not connected to desktop session.");return}(o.ocrExtracted||o)&&f.emit("scanner:learn-corrections",{pin:d,ocrFields:s,approvedFields:c,courier:(o==null?void 0:o.courier)||((S=o==null?void 0:o.ocrExtracted)==null?void 0:S.courier)||"",deviceProfile:U}),f.emit("scanner:approval-submit",{shipmentId:o.shipmentId,awb:o.awb||A,fields:x},p=>{p!=null&&p.success||(u(a.REVIEWING),K(),k("error"),g((p==null?void 0:p.message)||"Approval failed."))})}e&&m.clientCode&&m.clientCode!=="MISC"&&He(p=>{var te,Mt;const ee={...p.clientFreq};ee[m.clientCode]=(ee[m.clientCode]||0)+1;const V=Object.entries(ee).sort((Fn,et)=>et[1]-Fn[1]);return{...p,clientFreq:ee,dominantClient:((te=V[0])==null?void 0:te[1])>=2?V[0][0]:null,dominantClientCount:((Mt=V[0])==null?void 0:Mt[1])||0}})},[f,o,m,A,d,u,q,b,U,h,I]),Ze=r.useCallback((e=a.IDLE)=>{clearTimeout(ot.current),clearTimeout(Ft.current),ie(""),ne(null),Me({kb:0,width:0,height:0,quality:Re}),re(null),B({}),ae({}),P(null),Nt(null),g(""),Se(""),se(!1),J(0),Ue({ok:!1,issues:[],metrics:null}),xe.current=!1,ct.current={awb:"",hits:0,lastSeenAt:0},Ye.current=[],ce.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},Ke.current=!1,Z(0),u(e)},[u,Z]);r.useEffect(()=>{if(N===a.SUCCESS){const e=E==="fast"?a.SCANNING:a.IDLE,n=E==="fast"?_n:$n;return ot.current=setTimeout(()=>Ze(e),n),()=>clearTimeout(ot.current)}},[N,Ze,E]),r.useEffect(()=>{if(Oe)if(N===a.REVIEWING&&o){const e=[o.clientName||o.clientCode,o.destination,o.weight?`${o.weight} kilograms`:""].filter(Boolean);e.length&&$t(e.join(". "))}else N===a.SUCCESS&&T&&$t(`${T.clientName||T.clientCode||"Shipment"} Verified.`)},[Oe,N,o,T]),r.useEffect(()=>()=>{Le(),clearTimeout(ot.current),clearTimeout(Ft.current)},[Le]);const le=e=>`msp-step ${N===e?"active":""}`,ln=Math.max(1,Math.round((E==="fast"?_n:$n)/1e3)),vr=v.ok?"AWB quality looks good - press shutter":Wn(v.issues)||"Fit AWB slip fully in frame and hold steady",dn=Be&&v.ok&&W>=Wt,de=r.useMemo(()=>{if(!o)return{};const e=o.ocrExtracted||o;return{clientCode:{confidence:(e==null?void 0:e.clientNameConfidence)||0,source:(e==null?void 0:e.clientNameSource)||null},consignee:{confidence:(e==null?void 0:e.consigneeConfidence)||0,source:(e==null?void 0:e.consigneeSource)||null},destination:{confidence:(e==null?void 0:e.destinationConfidence)||0,source:(e==null?void 0:e.destinationSource)||null},pincode:{confidence:(e==null?void 0:e.pincodeConfidence)||0,source:(e==null?void 0:e.pincodeSource)||null},weight:{confidence:(e==null?void 0:e.weightConfidence)||0,source:(e==null?void 0:e.weightSource)||null}}},[o]),kr=r.useCallback(()=>{B(e=>{const n=qt(e.courier||(o==null?void 0:o.courier)||""),s=xt.findIndex(x=>x.toUpperCase()===n.toUpperCase()),c=xt[(s+1+xt.length)%xt.length];return{...e,courier:c}})},[o]),Tt=r.useMemo(()=>{const e=Object.values(de).map(x=>Number((x==null?void 0:x.confidence)||0)).filter(x=>x>0),n=e.length?e.reduce((x,y)=>x+y,0)/e.length:0,s=Zn(n);return{score:n,level:s,label:s==="high"?"High Confidence":s==="med"?"Medium Confidence":"Low Confidence"}},[de]),Nr=qt(m.courier||(o==null?void 0:o.courier)||((hn=o==null?void 0:o.ocrExtracted)==null?void 0:hn.courier)||""),un=m.date||(o==null?void 0:o.date)||I||"",jr=r.useMemo(()=>Qn(un),[un]),pn=O.scannedItems.reduce((e,n)=>e+(n.weight||0),0),z=((fn=o==null?void 0:o.ocrExtracted)==null?void 0:fn.intelligence)||(o==null?void 0:o.intelligence)||null,gn=(xn=(mn=(ht=be.current)==null?void 0:ht.getDiagnostics)==null?void 0:mn.call(ht))==null?void 0:xn.wasmFailReason,Er=[["Step",N],["Connection",C],["Engine",Gt],...gn?[["WASM Error",gn]]:[],["Workflow",E],["Device",U],["Scan mode",ke],["Fail count",String(nr)],["Reframe retries",`${kt}/${mt}`],["Camera",Be?"ready":"waiting"],["Doc detect",Te?`yes (${W})`:"no"],["Capture quality",v.ok?"good":v.issues.join(", ")||"pending"],["Capture metrics",v.metrics?`blur ${v.metrics.blurScore} | glare ${v.metrics.glareRatio}% | skew ${v.metrics.perspectiveSkew}%`:"-"],["JPEG last shot",L.kb?`${L.kb}KB ${L.width}x${L.height} q=${L.quality}`:"-"],["Secure ctx",Kn()?"yes":"no"],["AWB lock",A||"-"],["Lock ms",Vt!=null?String(Vt):"-"],["Lock candidates",String(((bn=ce.current)==null?void 0:bn.candidateCount)||1)],["Queued",String(j.length)],["Scans",String(O.scanNumber)],["Last format",(oe==null?void 0:oe.format)||"-"],["Last code",(oe==null?void 0:oe.value)||"-"],["Decode ms",(oe==null?void 0:oe.sinceStartMs)!=null?String(oe.sinceStartMs):"-"],["False-lock",(yn=o==null?void 0:o.scanTelemetry)!=null&&yn.falseLock?"yes":"no"]];return t.jsxs(t.Fragment,{children:[t.jsx("style",{children:ts}),t.jsxs("div",{className:"msp-root",children:[he&&t.jsx("div",{className:`flash-overlay flash-${he}`,onAnimationEnd:()=>_(null)}),Ce&&t.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[t.jsx(Rn,{size:48,color:"white"}),t.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),t.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:Ce}),t.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),t.jsx("button",{type:"button","data-testid":"scanner-diag-toggle",onClick:()=>er(e=>!e),style:{position:"fixed",top:12,right:12,zIndex:70,border:"1px solid rgba(255,255,255,0.18)",background:St?"rgba(79,70,229,0.92)":"rgba(15,23,42,0.72)",color:"#fff",borderRadius:999,padding:"8px 12px",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.04em",backdropFilter:"blur(10px)",cursor:"pointer"},children:St?"Hide Diag":"Show Diag"}),St&&t.jsxs("div",{"data-testid":"scanner-diag-panel",style:{position:"fixed",top:56,right:12,zIndex:69,width:"min(92vw, 320px)",background:"rgba(15,23,42,0.88)",color:"#E5EEF8",border:"1px solid rgba(255,255,255,0.12)",borderRadius:18,padding:14,backdropFilter:"blur(14px)",boxShadow:"0 12px 30px rgba(0,0,0,0.25)"},children:[t.jsx("div",{style:{fontSize:"0.72rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10,color:"#A5B4FC"},children:"Scanner Diagnostics"}),t.jsx("div",{style:{display:"grid",gap:6},children:Er.map(([e,n])=>t.jsxs("div",{style:{display:"flex",gap:8,justifyContent:"space-between",alignItems:"flex-start",fontSize:"0.76rem"},children:[t.jsx("div",{style:{color:"rgba(226,232,240,0.72)",minWidth:88},children:e}),t.jsx("div",{className:"mono",style:{textAlign:"right",wordBreak:"break-word",maxWidth:180},children:n})]},e))}),t.jsx("div",{style:{marginTop:10,fontSize:"0.68rem",color:"rgba(226,232,240,0.7)",lineHeight:1.4},children:"Use this to verify whether Trackon labels are being decoded as `ITF` and how quickly the first lock happens after scan start."})]}),C!=="paired"&&t.jsx("div",{className:le(a.IDLE),children:t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},children:[t.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:C==="connecting"?t.jsx(Bt,{size:28,color:i.primary,style:{animation:"spin 1s linear infinite"}}):t.jsx(An,{size:28,color:i.error})}),t.jsxs("div",{style:{textAlign:"center"},children:[t.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:C==="connecting"?"Connecting...":"Disconnected"}),t.jsx("div",{style:{fontSize:"0.82rem",color:i.muted},children:F||(h?"Preparing direct scanner session":`Connecting to session ${d}`)})]}),C==="disconnected"&&t.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[t.jsx(Bt,{size:16})," Reconnect"]})]})}),t.jsx("video",{ref:Q,autoPlay:!0,playsInline:!0,muted:!0,onClick:()=>{Ie().catch(e=>{g((e==null?void 0:e.message)||"Camera access failed.")})},style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(N===a.SCANNING||N===a.CAPTURING)&&!me.current?"block":"none"}}),t.jsx("div",{className:le(a.IDLE),children:t.jsxs("div",{className:"home-root",children:[t.jsxs("div",{className:"home-header",children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16},children:[t.jsxs("button",{onClick:()=>w("/app/scan"),style:{background:"white",border:"1px solid #E2E8F0",padding:"6px 12px",borderRadius:20,fontSize:"0.75rem",fontWeight:600,color:"#475569",display:"flex",alignItems:"center",gap:4,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.02)"},children:[t.jsx(Mr,{size:14})," Go Back"]}),t.jsxs("div",{className:"home-logo-badge",children:[t.jsx(zn,{size:11,color:C==="paired"&&navigator.onLine?"#10B981":"#EF4444"}),ve]})]}),t.jsx("div",{className:"home-logo-row",children:t.jsxs("div",{className:"home-logo-text",children:[t.jsx("img",{src:"/images/logo.png",alt:"Sea Hawk Logo",style:{height:28,width:"auto",objectFit:"contain",padding:2,background:"white",borderRadius:6,border:"1px solid #E2E8F0"}}),t.jsx("span",{children:"Seahawk Scanner"})]})}),t.jsxs("div",{className:"home-stats-row",children:[t.jsxs("div",{className:"home-stat-card",children:[t.jsx("div",{className:"home-stat-val",children:O.scanNumber}),t.jsx("div",{className:"home-stat-label",children:"Scanned"})]}),t.jsxs("div",{className:"home-stat-card",children:[t.jsx("div",{className:"home-stat-val",children:pn>0?pn.toFixed(1):"0"}),t.jsx("div",{className:"home-stat-label",children:"Total kg"})]}),t.jsxs("div",{className:"home-stat-card",children:[t.jsx("div",{className:"home-stat-val",children:wt}),t.jsx("div",{className:"home-stat-label",children:"Session"})]})]}),t.jsxs("div",{className:"home-date-chip",children:[t.jsx(Ot,{size:18,color:"#38BDF8"}),t.jsxs("div",{children:[t.jsx("div",{className:"home-date-label",children:"Scan Date"}),t.jsxs("div",{className:"home-date-value",children:[new Date(I+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}),I===new Date().toISOString().slice(0,10)&&t.jsx("span",{style:{fontSize:"0.65rem",color:"#10B981",marginLeft:6,fontWeight:500},children:"TODAY"})]})]}),t.jsx("div",{className:"home-date-change",children:"Change ▸"}),t.jsx("input",{type:"date",value:I,max:new Date().toISOString().slice(0,10),onChange:e=>{const n=e.target.value;if(n&&Ae.test(n)){or(n);try{localStorage.setItem("seahawk_scanner_session_date",n)}catch{}k("light")}}})]})]}),t.jsxs("div",{className:"home-scan-section",children:[t.jsxs("div",{className:"home-scan-btn-wrap",children:[t.jsx("div",{className:"home-scan-ring"}),t.jsx("div",{className:"home-scan-ring home-scan-ring2"}),t.jsxs("button",{"data-testid":"start-scan-btn",className:"home-scan-btn",onClick:fr,children:[t.jsx(Dt,{size:34,color:"white"}),t.jsx("span",{className:"home-scan-btn-label",children:"Scan"})]})]}),t.jsx("div",{className:"home-cta-text",children:O.scanNumber===0?"Tap to start your first scan":"Tap to scan next parcel"}),t.jsxs("div",{style:{display:"flex",gap:8,marginTop:14,width:"100%",maxWidth:320},children:[t.jsxs("button",{type:"button","data-testid":"workflow-fast-btn",onClick:()=>Et("fast"),style:{flex:1,borderRadius:999,border:`1px solid ${E==="fast"?i.primary:i.border}`,background:E==="fast"?i.primaryLight:i.surface,color:E==="fast"?i.primary:i.muted,fontWeight:700,fontSize:"0.72rem",padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[t.jsx(Tn,{size:13})," Fast scan"]}),t.jsxs("button",{type:"button","data-testid":"workflow-ocr-btn",onClick:()=>Et("ocr"),style:{flex:1,borderRadius:999,border:`1px solid ${E==="ocr"?i.primary:i.border}`,background:E==="ocr"?i.primaryLight:i.surface,color:E==="ocr"?i.primary:i.muted,fontWeight:700,fontSize:"0.72rem",padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[t.jsx(Pt,{size:13})," OCR label"]})]}),t.jsxs("div",{style:{display:"flex",gap:8,marginTop:8,width:"100%",maxWidth:320},children:[t.jsxs("button",{type:"button","data-testid":"device-profile-phone-btn",onClick:()=>Ht(Y.phone),style:{flex:1,borderRadius:999,border:`1px solid ${U===Y.phone?i.primary:i.border}`,background:U===Y.phone?i.primaryLight:i.surface,color:U===Y.phone?i.primary:i.muted,fontWeight:700,fontSize:"0.7rem",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[t.jsx(Dt,{size:13})," Phone lens"]}),t.jsxs("button",{type:"button","data-testid":"device-profile-rugged-btn",onClick:()=>Ht(Y.rugged),style:{flex:1,borderRadius:999,border:`1px solid ${U===Y.rugged?i.primary:i.border}`,background:U===Y.rugged?i.primaryLight:i.surface,color:U===Y.rugged?i.primary:i.muted,fontWeight:700,fontSize:"0.7rem",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[t.jsx(Mn,{size:13})," Rugged"]})]}),t.jsxs("form",{onSubmit:mr,style:{width:"100%",maxWidth:300,marginTop:20},children:[t.jsx("div",{style:{fontSize:"0.62rem",fontWeight:700,color:i.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6,textAlign:"center"},children:"Can't scan? Enter AWB manually"}),t.jsxs("div",{style:{display:"flex",gap:6},children:[t.jsx("input",{"data-testid":"manual-awb-input",value:Ve,onChange:e=>Ut(e.target.value.toUpperCase()),placeholder:"e.g. 1234567890",inputMode:"text",autoCapitalize:"characters",style:{flex:1,padding:"9px 12px",border:`1.5px solid ${i.border}`,borderRadius:10,fontFamily:"JetBrains Mono, monospace",fontSize:"0.82rem",fontWeight:600,background:i.surface,color:i.text,outline:"none"},onFocus:e=>e.target.style.borderColor=i.primary,onBlur:e=>e.target.style.borderColor=i.border}),t.jsx("button",{type:"submit","data-testid":"manual-awb-submit",disabled:Ve.trim().length<6,className:"btn btn-primary",style:{padding:"9px 14px",fontSize:"0.78rem",borderRadius:10,opacity:Ve.trim().length>=6?1:.45},children:"Go →"})]})]}),t.jsxs("div",{className:"action-buttons-row",children:[t.jsxs("button",{className:"action-btn",onClick:br,children:[t.jsx(Br,{size:14})," ",j.length>0?`Upload (${j.length})`:"Synced"]}),t.jsxs("button",{className:"action-btn danger",onClick:xr,children:[t.jsx(Bn,{size:14})," End Session"]})]}),j.length>0&&t.jsxs("div",{style:{marginTop:14,fontSize:"0.7rem",color:i.warning,fontWeight:600,display:"flex",alignItems:"center",gap:5},children:[t.jsx(On,{size:12})," ",j.length," offline scan",j.length>1?"s":""," pending sync"]})]}),t.jsxs("div",{className:"home-queue-section",children:[t.jsxs("div",{className:"home-queue-head",children:[t.jsxs("div",{className:"home-queue-title-text",children:[t.jsx(Or,{size:11}),"Accepted Consignments"]}),O.scannedItems.length>0&&t.jsx("div",{className:"home-queue-badge",children:O.scannedItems.length})]}),t.jsx("div",{className:"home-queue-list",children:O.scannedItems.length===0?t.jsxs("div",{className:"queue-empty",children:[t.jsx(Lt,{size:36,color:"rgba(255,255,255,0.12)"}),t.jsxs("div",{className:"queue-empty-text",children:["No consignments scanned yet.",t.jsx("br",{}),"Tap the button above to begin."]})]}):O.scannedItems.map((e,n)=>t.jsxs("div",{className:"queue-item",children:[t.jsx("div",{className:"queue-check",children:t.jsx(Dn,{size:13,color:"#10B981"})}),t.jsxs("div",{className:"queue-main",children:[t.jsxs("div",{className:"queue-main-top",children:[t.jsx("div",{className:"queue-awb",children:e.awb}),e.weight>0&&t.jsxs("div",{className:"queue-weight",children:[e.weight,"kg"]})]}),t.jsxs("div",{className:"queue-meta",children:[e.clientCode==="OFFLINE"?t.jsx("span",{className:"queue-offline-tag",children:"Offline"}):e.clientCode&&t.jsx("span",{className:"queue-client-tag",children:e.clientCode}),e.destination&&t.jsx("span",{children:e.destination}),e.date&&t.jsx("span",{className:"queue-date-tag",children:Qn(e.date)})]}),ar===e.queueId?t.jsxs("div",{className:"queue-date-editor",children:[t.jsx("input",{type:"date",className:"queue-date-input",value:rt,max:new Date().toISOString().slice(0,10),onChange:s=>st(s.target.value),disabled:Ne===e.queueId}),t.jsx("button",{type:"button",className:"queue-action-btn primary",onClick:()=>gr(e),disabled:Ne===e.queueId||!Ae.test(rt),children:Ne===e.queueId?"Saving...":"Save"}),t.jsx("button",{type:"button",className:"queue-action-btn",onClick:pr,disabled:Ne===e.queueId,children:"Cancel"})]}):t.jsxs("div",{className:"queue-actions",children:[t.jsxs("button",{type:"button",className:"queue-action-btn",onClick:()=>ur(e),disabled:Ne===e.queueId,children:[t.jsx(Ot,{size:12})," Edit Date"]}),t.jsxs("button",{type:"button",className:"queue-action-btn danger",onClick:()=>hr(e),disabled:Ne===e.queueId,children:[t.jsx(Bn,{size:12})," ",Ne===e.queueId?"Deleting...":"Delete"]})]})]})]},e.queueId||`${e.awb}-${n}`))})]})]})}),t.jsx("div",{className:le(a.SCANNING),children:t.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[t.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:me.current?"block":"none"}}),t.jsx("div",{className:"cam-overlay",children:t.jsxs("div",{className:"scan-guide",style:ke==="barcode"?{width:qn.w,height:qn.h,borderRadius:10,maxHeight:"20vw",transition:"all 0.4s ease",borderColor:F?"rgba(248,113,113,0.92)":void 0,boxShadow:F?"0 0 0 3px rgba(248,113,113,0.2)":void 0}:{width:ft.w,height:ft.h,borderRadius:14,maxHeight:"75vh",transition:"all 0.4s ease",borderColor:"rgba(251,191,36,0.85)",boxShadow:"0 0 0 3px rgba(251,191,36,0.2)"},children:[t.jsx("div",{className:"scan-guide-corner corner-tl"}),t.jsx("div",{className:"scan-guide-corner corner-tr"}),t.jsx("div",{className:"scan-guide-corner corner-bl"}),t.jsx("div",{className:"scan-guide-corner corner-br"}),ke==="barcode"&&t.jsx("div",{className:"scan-laser",children:t.jsx("div",{className:"scan-laser-spark"})})]})}),t.jsxs("div",{className:"cam-hud",children:[t.jsxs("div",{className:"cam-hud-chip",children:[t.jsx(zn,{size:12})," ",h?"DIRECT":d]}),t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[ke==="document"&&t.jsxs("div",{className:"cam-hud-chip",style:{background:"rgba(251,191,36,0.22)",color:"#FDE68A",fontWeight:700,fontSize:"0.65rem",gap:4},children:[t.jsx(Pn,{size:11})," LABEL MODE"]}),t.jsxs("div",{className:"cam-hud-chip",style:{gap:4},children:[t.jsx(Lt,{size:12})," ",O.scanNumber,Gt==="native"?t.jsx("span",{style:{color:"#34D399",fontSize:"0.6rem",fontWeight:800},children:"⚡ NATIVE"}):t.jsx("span",{style:{color:"#F59E0B",fontSize:"0.6rem",fontWeight:800},children:"ZXING"})]})]})]}),t.jsxs("div",{className:"cam-bottom",children:[ke==="barcode"?t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:6,color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:[t.jsx("div",{children:E==="fast"?"Align barcode inside the strip - auto-save on lock":"Align barcode inside the strip - camera opens for label capture after lock"}),kt>0&&t.jsxs("div",{style:{color:"#FDE68A",fontSize:"0.74rem",fontWeight:700},children:["Reframe retry ",kt,"/",mt]}),!!F&&t.jsx("div",{style:{color:"#FCA5A5",fontSize:"0.72rem",fontWeight:700},children:F})]}):t.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:6},children:[t.jsx("div",{style:{color:"rgba(251,191,36,0.95)",fontSize:"0.82rem",fontWeight:700,textAlign:"center"},children:"No barcode found - capture the label and we will read the printed AWB"}),t.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"},children:[t.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:dr,children:"Capture label instead"}),t.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:()=>{G(0),Z(0),g(""),jt("barcode"),k("tap")},children:"Back to barcode mode"})]})]}),t.jsxs("div",{style:{display:"flex",gap:12},children:[t.jsxs("button",{className:"cam-hud-chip",onClick:()=>Et(e=>e==="fast"?"ocr":"fast"),style:{border:"none",cursor:"pointer",gap:5},children:[E==="fast"?t.jsx(Tn,{size:13}):t.jsx(Pt,{size:13}),E==="fast"?"FAST":"OCR"]}),t.jsx("button",{className:"cam-hud-chip",onClick:()=>ir(!Oe),style:{border:"none",cursor:"pointer"},children:Oe?t.jsx(Dr,{size:14}):t.jsx(Pr,{size:14})})]})]})]})}),t.jsx("div",{className:le(a.CAPTURING),children:t.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!Be&&t.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[t.jsx(Lr,{size:44,color:"#34D399"}),t.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:A||"OCR fallback"}),t.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:A?"Barcode locked - Preparing camera...":"Preparing label capture for printed AWB OCR..."})]}),t.jsx("div",{className:"cam-overlay",children:t.jsxs("div",{ref:at,className:`scan-guide ${Te?"detected":""}`,style:{width:ft.w,height:ft.h,maxHeight:"75vh",borderRadius:12},children:[t.jsx("div",{className:"scan-guide-corner corner-tl"}),t.jsx("div",{className:"scan-guide-corner corner-tr"}),t.jsx("div",{className:"scan-guide-corner corner-bl"}),t.jsx("div",{className:"scan-guide-corner corner-br"})]})}),t.jsxs("div",{className:"cam-hud",children:[t.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[t.jsx(Pn,{size:12})," ",A||"OCR AWB capture"]}),j.length>0&&t.jsxs("div",{className:"cam-hud-chip",children:[t.jsx(On,{size:12})," ",j.length," queued"]})]}),t.jsxs("div",{className:"cam-bottom",children:[t.jsx("div",{style:{color:Te?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center",transition:"color 0.3s"},children:vr}),v.metrics&&t.jsxs("div",{style:{color:"rgba(255,255,255,0.66)",fontSize:"0.72rem",textAlign:"center"},children:["Blur ",v.metrics.blurScore," | Glare ",v.metrics.glareRatio,"% | Skew ",v.metrics.perspectiveSkew,"%"]}),t.jsx("button",{className:"capture-btn","data-testid":"capture-photo-btn",onClick:yr,disabled:!dn,style:{opacity:dn?1:.4},children:t.jsx("div",{className:"capture-btn-inner"})}),b&&t.jsx("button",{type:"button","data-testid":"mock-capture-btn",onClick:wr,style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 12px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:"Mock capture"}),t.jsx("button",{style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},onClick:()=>{ie(""),g(""),G(0),Z(0),xe.current=!1,k("tap"),u(a.SCANNING)},children:"← Rescan barcode"})]})]})}),t.jsx("div",{className:le(a.PREVIEW),children:t.jsxs("div",{style:{background:i.bg,display:"flex",flexDirection:"column",height:"100%"},children:[t.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${i.border}`},children:t.jsxs("div",{children:[t.jsx("div",{style:{fontSize:"0.72rem",color:i.muted,fontWeight:600},children:"CAPTURED"}),t.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:A||"Printed AWB OCR"}),L.kb>0&&t.jsxs("div",{style:{fontSize:"0.68rem",color:i.mutedLight},children:[L.kb,"KB • ",L.width,"×",L.height]})]})}),t.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:X&&t.jsx("img",{src:X,alt:"Captured label",className:"preview-img"})}),t.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[t.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{ne(null),u(a.CAPTURING)},children:[t.jsx(Ln,{size:16})," Retake"]}),t.jsxs("button",{"data-testid":"use-photo-btn",className:"btn btn-primary",style:{flex:2},onClick:Cr,children:[t.jsx(Wr,{size:16})," Use Photo"]})]})]})}),t.jsx("div",{className:le(a.PROCESSING),children:t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16},children:[t.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[t.jsx(Pt,{size:22,color:i.primary,style:{animation:"spin 2s linear infinite"}}),t.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:i.primary},children:"Intelligence Engine"})]}),t.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:i.muted},children:A}),t.jsx("div",{style:{fontSize:"0.72rem",color:i.mutedLight,marginTop:6},children:X?"Reading AWB label with local OCR...":"Saving barcode scan..."})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(e=>t.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{className:"field-label",children:e}),t.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),t.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},e)),t.jsx("div",{style:{textAlign:"center",marginTop:8},children:t.jsx("button",{className:"btn btn-outline",style:{fontSize:"0.75rem",padding:"8px 20px"},onClick:()=>{g("Cancelled by user."),u(a.ERROR)},children:"Cancel"})})]})}),t.jsx("div",{className:le(a.REVIEWING),children:t.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%"},children:[t.jsxs("div",{className:"review-header",children:[t.jsxs("div",{className:"review-header-top",children:[t.jsxs("div",{children:[t.jsx("div",{className:"review-title",children:"REVIEW EXTRACTION"}),t.jsx("div",{className:"mono review-awb",children:(o==null?void 0:o.awb)||A})]}),(z==null?void 0:z.learnedFieldCount)>0&&t.jsxs("div",{className:"source-badge source-learned",children:["AI ",z.learnedFieldCount," auto-corrected"]})]}),t.jsxs("div",{className:"review-meta-row",children:[t.jsxs("span",{className:`review-confidence ${Tt.level}`,children:[t.jsx(Mn,{size:13}),Tt.label," (",Math.round(Tt.score*100),"%)"]}),t.jsxs("button",{type:"button",className:"review-chip review-chip-courier",onClick:kr,title:"Tap to change courier",children:[t.jsx(Lt,{size:13}),Nr||"Trackon"]}),t.jsxs("span",{className:"review-chip review-chip-date",children:[t.jsx(Ot,{size:13}),jr||"No date"]})]})]}),t.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[t.jsxs("div",{className:`field-card ${(((wn=de.clientCode)==null?void 0:wn.confidence)||0)<.55?"warning":""}`,children:[t.jsx("div",{className:_t(((Cn=de.clientCode)==null?void 0:Cn.confidence)||0)}),t.jsxs("div",{style:{flex:1},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[t.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((Sn=de.clientCode)==null?void 0:Sn.source)&&(()=>{const e=Xn(de.clientCode.source);return e?t.jsxs("span",{className:e.className,children:[e.icon," ",e.text]}):null})()]}),t.jsx("input",{className:"field-input",value:m.clientCode||"",onChange:e=>B(n=>({...n,clientCode:e.target.value.toUpperCase()})),placeholder:"Client code"}),((vn=z==null?void 0:z.clientMatches)==null?void 0:vn.length)>0&&z.clientNeedsConfirmation&&t.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:z.clientMatches.slice(0,3).map(e=>t.jsxs("button",{type:"button",className:`suggest-chip ${m.clientCode===e.code?"active":""}`,onClick:()=>B(n=>({...n,clientCode:e.code})),children:[e.code," (",Math.round(e.score*100),"%)"]},e.code))})]})]}),t.jsxs("div",{className:"field-card",children:[t.jsx("div",{className:_t(((kn=de.consignee)==null?void 0:kn.confidence)||0)}),t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{className:"field-label",children:"Consignee"}),t.jsx("input",{className:"field-input",value:m.consignee||"",onChange:e=>B(n=>({...n,consignee:e.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),t.jsxs("div",{className:"field-card",children:[t.jsx("div",{className:_t(((Nn=de.destination)==null?void 0:Nn.confidence)||0)}),t.jsxs("div",{style:{flex:1},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[t.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((jn=de.destination)==null?void 0:jn.source)&&(()=>{const e=Xn(de.destination.source);return e?t.jsxs("span",{className:e.className,children:[e.icon," ",e.text]}):null})()]}),t.jsx("input",{className:"field-input",value:m.destination||"",onChange:e=>B(n=>({...n,destination:e.target.value.toUpperCase()})),placeholder:"City"}),(z==null?void 0:z.pincodeCity)&&z.pincodeCity!==m.destination&&t.jsxs("button",{onClick:()=>B(e=>({...e,destination:z.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:i.successLight,color:i.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["ðŸ“ Pincode suggests: ",z.pincodeCity]})]})]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[t.jsx("div",{className:"field-card",children:t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{className:"field-label",children:"Pincode"}),t.jsx("input",{className:"field-input",value:m.pincode||"",onChange:e=>B(n=>({...n,pincode:e.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),t.jsx("div",{className:`field-card ${(En=z==null?void 0:z.weightAnomaly)!=null&&En.anomaly?"warning":"conf-med"}`,children:t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{className:"field-label",children:"Weight (kg)"}),t.jsx("input",{className:"field-input",value:m.weight||"",onChange:e=>B(n=>({...n,weight:e.target.value})),placeholder:"0.0",inputMode:"decimal"}),((In=z==null?void 0:z.weightAnomaly)==null?void 0:In.anomaly)&&t.jsxs("div",{style:{fontSize:"0.6rem",color:i.warning,marginTop:2,fontWeight:500},children:["Warning: ",z.weightAnomaly.warning]})]})})]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[t.jsx("div",{className:"field-card conf-med",children:t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{className:"field-label",children:"Amount (₹)"}),t.jsx("input",{className:"field-input",value:m.amount||"",onChange:e=>B(n=>({...n,amount:e.target.value})),placeholder:"0",inputMode:"decimal"})]})}),t.jsx("div",{className:"field-card conf-low",children:t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{className:"field-label",children:"Order No"}),t.jsx("input",{className:"field-input",value:m.orderNo||"",onChange:e=>B(n=>({...n,orderNo:e.target.value})),placeholder:"Optional"})]})})]})]}),t.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${i.border}`,display:"flex",gap:10},children:[t.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:Ze,children:[t.jsx(qr,{size:16})," Skip"]}),t.jsxs("button",{"data-testid":"approve-save-btn",className:"btn btn-success btn-lg",style:{flex:2},onClick:Sr,disabled:N===a.APPROVING,children:[N===a.APPROVING?t.jsx(Bt,{size:16,style:{animation:"spin 1s linear infinite"}}):t.jsx(Dn,{size:16}),N===a.APPROVING?"Saving...":"Approve & Save"]})]})]})}),t.jsx("div",{className:le(a.APPROVING)}),t.jsx("div",{className:le(a.SUCCESS),children:t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[t.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[t.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:i.success,strokeWidth:"3",className:"success-check-circle"}),t.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:i.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),t.jsxs("div",{style:{textAlign:"center"},children:[t.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:i.success,marginBottom:4},children:"Saved Successfully"}),t.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700},children:T==null?void 0:T.awb}),(T==null?void 0:T.clientCode)&&t.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:i.primaryLight,color:i.primary,fontSize:"0.78rem",fontWeight:600},children:T.clientName||T.clientCode})]}),t.jsx("div",{style:{fontSize:"0.72rem",color:i.muted},children:T!=null&&T.offlineQueued?`${j.length} queued for sync - Auto-continuing in ${ln}s`:`#${O.scanNumber} scanned - Auto-continuing in ${ln}s`}),t.jsxs("button",{"data-testid":"scan-next-btn",className:"btn btn-primary btn-lg btn-full",onClick:()=>Ze(E==="fast"?a.SCANNING:a.IDLE),style:{maxWidth:320},children:[t.jsx(Dt,{size:18})," ",E==="fast"?"Keep Scanning":"Scan Next Parcel"]})]})}),t.jsx("div",{className:le(a.ERROR),children:t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[t.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:t.jsx(Rn,{size:32,color:i.error})}),t.jsxs("div",{style:{textAlign:"center"},children:[t.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:i.error},children:"Scan Error"}),t.jsx("div",{style:{fontSize:"0.82rem",color:i.muted,marginTop:4},children:F})]}),t.jsxs("button",{className:"btn btn-primary",onClick:Ze,children:[t.jsx(Ln,{size:16})," Try Again"]})]})}),C==="disconnected"&&N!==a.IDLE&&t.jsxs("div",{className:"offline-banner",children:[t.jsx(An,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline â€” Reconnecting... ",j.length?`(${j.length} queued)`:""]})]}),t.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{gs as default};
