import{t as Or,u as Dr,r,j as t,y as On,B as _t,b3 as Dn,e as qr,aR as qn,ad as $t,aS as Ut,Z as Pn,aw as Gt,ag as Ln,b4 as Pr,a8 as Wn,s as _n,aZ as Lr,P as Vt,b5 as $n,aL as Un,b6 as Wr,b7 as _r,p as $r,k as Gn,ar as Ur,X as Gr}from"./vendor-react-Dm-R4Vuw.js";import{a as ge,l as Vr}from"./index-78AGX88q.js";import{c as Hr,n as Qr}from"./barcodeEngine-BctUjsdZ.js";function sr(d,l){var w,p;try{if(!d||!l)return null;const A=Number(d.videoWidth||0),T=Number(d.videoHeight||0);if(!A||!T)return null;const U=(w=d.getBoundingClientRect)==null?void 0:w.call(d),D=(p=l.getBoundingClientRect)==null?void 0:p.call(l);if(!U||!D)return null;const q=Number(U.width||0),C=Number(U.height||0);if(!q||!C)return null;const h=Math.max(q/A,C/T),re=A*h,y=T*h,z=(q-re)/2,se=(C-y)/2,g=D.left-U.left,N=D.top-U.top,Pe=D.right-U.left,M=D.bottom-U.top,ie=(g-z)/h,H=(N-se)/h,oe=(Pe-z)/h,le=(M-se)/h,o=(X,Le,Ee)=>Math.max(Le,Math.min(Ee,X)),he=o(Math.min(ie,oe),0,A),b=o(Math.min(H,le),0,T),W=o(Math.max(ie,oe),0,A),P=o(Math.max(H,le),0,T),L=Math.max(0,W-he),be=Math.max(0,P-b);return!L||!be?null:{x:he,y:b,w:L,h:be}}catch{return null}}function Vn(d=[]){if(!d.length)return"";const l=[];return d.includes("blur")&&l.push("hold steady"),d.includes("glare")&&l.push("reduce glare"),d.includes("angle")&&l.push("straighten angle"),d.includes("dark")&&l.push("add light"),d.includes("low_edge")&&l.push("fill frame"),l.length?`Improve capture: ${l.join(", ")}.`:""}function Yr(d,l){if(!d||!l||!d.videoWidth||!d.videoHeight)return null;const w=sr(d,l);if(!w)return null;const p=Math.max(0,Math.floor(w.x)),A=Math.max(0,Math.floor(w.y)),T=Math.max(24,Math.floor(w.w)),U=Math.max(24,Math.floor(w.h)),D=128,q=96,C=document.createElement("canvas");C.width=D,C.height=q;const h=C.getContext("2d",{willReadFrequently:!0});if(!h)return null;h.drawImage(d,p,A,Math.min(T,d.videoWidth-p),Math.min(U,d.videoHeight-A),0,0,D,q);const re=h.getImageData(0,0,D,q).data,y=D*q,z=new Float32Array(y);let se=0,g=0,N=0;for(let V=0,J=0;V<re.length;V+=4,J+=1){const Q=.2126*re[V]+.7152*re[V+1]+.0722*re[V+2];z[J]=Q,se+=Q,Q>=245&&(g+=1),Q<=24&&(N+=1)}let Pe=0,M=0,ie=0,H=0,oe=0,le=0;const o=Math.max(4,Math.floor(q*.15)),he=Math.max(4,Math.floor(D*.15)),b=D;for(let V=1;V<q-1;V+=1)for(let J=1;J<D-1;J+=1){const Q=V*b+J,B=z[Q],We=z[Q-1],_=z[Q+1],_e=z[Q-b],$e=z[Q+b],ye=Math.abs(_-We),Et=Math.abs($e-_e),Fe=ye+Et,Ft=Math.abs(4*B-We-_-_e-$e);Pe+=Ft,Fe>58&&(M+=1),V<=o&&(ie+=Fe),V>=q-o&&(H+=Fe),J<=he&&(oe+=Fe),J>=D-he&&(le+=Fe)}const W=Math.max(1,(D-2)*(q-2)),P=se/y,L=Pe/W,be=M/W,X=g/y,Le=N/y,Ee=Math.abs(ie-H)/Math.max(1,ie+H),R=Math.abs(oe-le)/Math.max(1,oe+le),et=Math.max(Ee,R),ce=[];return L<22&&ce.push("blur"),X>.18&&ce.push("glare"),(Le>.55||P<40)&&ce.push("dark"),be<.08&&ce.push("low_edge"),et>.62&&ce.push("angle"),{ok:ce.length===0,issues:ce,metrics:{brightness:Number(P.toFixed(1)),blurScore:Number(L.toFixed(1)),glareRatio:Number((X*100).toFixed(1)),edgeRatio:Number((be*100).toFixed(1)),perspectiveSkew:Number((et*100).toFixed(1))}}}function It(d,l){const w=Number(d);return Number.isFinite(w)&&w>0?w:l}function Kr({samples:d=[],awb:l,now:w=Date.now(),stabilityWindowMs:p=1100,requiredHits:A=3}){const T=It(p,1100),U=Math.max(1,Math.floor(It(A,3))),D=It(w,Date.now()),q=String(l||"").trim(),C=Array.isArray(d)?d.filter(y=>(y==null?void 0:y.awb)&&D-((y==null?void 0:y.at)||0)<=T):[];if(!q)return{samples:C,hits:0,isStable:!1};const h=[...C,{awb:q,at:D}],re=h.reduce((y,z)=>z.awb===q?y+1:y,0);return{samples:h,hits:re,isStable:re>=U}}function Xr({currentAttempts:d=0,maxReframeAttempts:l=2}){const w=Math.max(0,Math.floor(It(l,2))),p=Math.max(0,Math.floor(Number(d)||0))+1;return p<=w?{action:"reframe",attempts:p}:{action:"switch_to_document",attempts:w}}function Jr(){return window.location.origin}const Zr=Jr(),Hn={w:"90vw",h:"18vw"},vt={w:"92vw",h:"130vw"},Qn=3500,Yn=900,es=1e4,ts=12e3,ns="mobile_scanner_offline_queue",rs="mobile_scanner_session_state",ss="mobile_scanner_sticky_client",Kn="mobile_scanner_workflow_mode",Xn="mobile_scanner_device_profile",is=2e4,as=500,os=1,Jn=100,kt=2,Ht=2,cs=500,Zn=960,De=.68,ls=900,te={phone:"phone-camera",rugged:"rugged-scanner"},Nt=["Trackon","DTDC","Delhivery","BlueDart"],qe=/^\d{4}-\d{2}-\d{2}$/,Qt=d=>{const l=String(d||"").trim();if(!l)return"";const w=l.toUpperCase();return w.includes("TRACKON")||w.includes("PRIME")?"Trackon":w.includes("DTDC")?"DTDC":w.includes("DELHIVERY")?"Delhivery":w.includes("BLUE")?"BlueDart":l},Ie=d=>String(d||"").trim().toUpperCase(),er=d=>{const l=String(d||"").trim();if(!qe.test(l))return l;try{return new Date(`${l}T00:00:00`).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}catch{return l}},Xe=(d,l="")=>{const w=String(d||"").trim();if(qe.test(w))return w;const p=String(l||"").trim();return qe.test(p)?p:new Date().toISOString().slice(0,10)},a={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"};function F(d,l){l instanceof Error?l.message:String(l||"unknown error")}const ds=d=>{var l;try{(l=navigator==null?void 0:navigator.vibrate)==null||l.call(navigator,d)}catch(w){F("vibrate",w)}},tr={tap:[20],lock:[400,50,200,50,100],success:[18,28,72],warning:[70,50,70],retry:[28,40,28],error:[110,55,110],duplicate:[90,50,90,50,90],review:[200,40,120]},v=(d="tap")=>{ds(tr[d]||tr.tap)},Ze=(d,l,w="sine")=>{try{const p=new(window.AudioContext||window.webkitAudioContext),A=p.createOscillator(),T=p.createGain();A.type=w,A.frequency.setValueAtTime(d,p.currentTime),T.gain.setValueAtTime(.12,p.currentTime),T.gain.exponentialRampToValueAtTime(.01,p.currentTime+l),A.connect(T),T.connect(p.destination),A.start(),A.stop(p.currentTime+l)}catch(p){F("playTone",p)}},Je=()=>{Ze(880,.12),setTimeout(()=>Ze(1100,.1),130)},jt=()=>{Ze(2700,.08,"square"),setTimeout(()=>Ze(3100,.05,"square"),60)},us=()=>Ze(600,.08),ne=()=>Ze(200,.25,"sawtooth"),Yt=d=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const l=new SpeechSynthesisUtterance(d);l.rate=1.2,l.pitch=1,l.lang="en-IN",window.speechSynthesis.speak(l)}catch(l){F("speak",l)}},nr=()=>{var d;try{if(typeof window>"u")return!1;if(window.isSecureContext)return!0;const l=((d=window.location)==null?void 0:d.hostname)||"";return l==="localhost"||l==="127.0.0.1"}catch{return!1}},i={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",mutedLight:"#9CA3AF",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},ps=`
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
`,ir=d=>d>=.85?"high":d>=.55?"med":"low",Kt=d=>`conf-dot conf-${ir(d)}`,rr=d=>d==="learned"?{className:"source-badge source-learned",icon:"AI",text:"Learned"}:d==="awb_master"?{className:"source-badge source-ai",icon:"DB",text:"Lookup"}:d==="courier_api"?{className:"source-badge source-history",icon:"API",text:"Courier"}:d==="fuzzy_match"?{className:"source-badge source-ai",icon:"🔍",text:"Matched"}:d==="fuzzy_history"||d==="consignee_pattern"?{className:"source-badge source-history",icon:"📊",text:"History"}:d==="delhivery_pincode"||d==="india_post"||d==="pincode_lookup"||d==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"📍",text:"Pincode"}:null,ms=d=>{const l=Math.floor(d/6e4);return l<60?`${l}m`:`${Math.floor(l/60)}h ${l%60}m`};function bs({standalone:d=!1}){var Cn,Sn,St,vn,kn,Nn,jn,In,En,Fn,Rn,An,Tn,zn,Mn,Bn;const{pin:l}=Or(),w=Dr(),p=!!d,A=`${ns}:${p?"direct":l||"unknown"}`,T=r.useMemo(()=>`${rs}:${p?"direct":l||"unknown"}`,[p,l]),U=r.useMemo(()=>`${ss}:${p?"direct":l||"unknown"}`,[p,l]),D=r.useMemo(()=>`mobile_scanner_daily_count:${new Date().toISOString().slice(0,10)}`,[]),q=r.useMemo(()=>{try{return typeof window>"u"?"":new URLSearchParams(window.location.search).get("mockBarcodeRaw")||""}catch{return""}},[]),C=r.useMemo(()=>{try{if(typeof window>"u")return!1;const e=new URLSearchParams(window.location.search);return e.get("mock")==="1"||e.get("e2e")==="1"}catch{return!1}},[]),[h,re]=r.useState(null),[y,z]=r.useState("connecting"),[se,g]=r.useState(""),[N,Pe]=r.useState(a.IDLE),[M,ie]=r.useState(""),[H,oe]=r.useState(null),[,le]=r.useState({}),[o,he]=r.useState(null),[b,W]=r.useState({}),[P,L]=r.useState(null),[be,X]=r.useState(null),[Le,Ee]=r.useState(""),[R,et]=r.useState([]),[ce,V]=r.useState(!1),[J,Q]=r.useState(0),[B,We]=r.useState({ok:!1,issues:[],metrics:null}),[_,_e]=r.useState({kb:0,width:0,height:0,quality:De}),[$e,ye]=r.useState(!1),[Et,Fe]=r.useState("0m"),[Ft,Rt]=r.useState("Connected"),[tt,Xt]=r.useState(""),[At,ar]=r.useState(!1),[Jt,Tt]=r.useState("idle"),[de,or]=r.useState(null),[cr,lr]=r.useState(0),[zt,dr]=r.useState(0),[Zt,Mt]=r.useState(null),[Re,Bt]=r.useState("barcode"),[j,Ot]=r.useState(()=>{if(typeof window>"u")return"fast";try{const e=localStorage.getItem(Kn);if(e==="fast"||e==="ocr")return e}catch(e){F("read workflow mode",e)}return C?"ocr":"fast"}),[Y,en]=r.useState(()=>{if(typeof window>"u")return te.phone;try{const e=localStorage.getItem(Xn);if(e===te.phone||e===te.rugged)return e}catch(e){F("read device profile",e)}return te.phone}),Dt=r.useRef(0),[k,Ue]=r.useState(()=>{const e={scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now(),scannedItems:[]};if(typeof window>"u")return e;try{const n=localStorage.getItem(T);if(!n)return e;const s=JSON.parse(n);if(!s||typeof s!="object")return e;const c=new Set(Array.isArray(s.scannedAwbs)?s.scannedAwbs.map(f=>Ie(f)).filter(Boolean):[]);return{...e,clientFreq:s.clientFreq&&typeof s.clientFreq=="object"?s.clientFreq:{},scanNumber:Number.isFinite(Number(s.scanNumber))?Number(s.scanNumber):0,dominantClient:Ie(s.dominantClient||"")||null,dominantClientCount:Number.isFinite(Number(s.dominantClientCount))?Number(s.dominantClientCount):0,startedAt:Number.isFinite(Number(s.startedAt))?Number(s.startedAt):e.startedAt,scannedItems:Array.isArray(s.scannedItems)?s.scannedItems:[],scannedAwbs:c}}catch(n){return F("hydrate session state",n),e}}),[ue,ct]=r.useState(()=>{if(typeof window>"u")return"";try{return Ie(localStorage.getItem(U)||"")}catch(e){return F("read sticky client",e),""}}),[Ge,ur]=r.useState(!1),[pr,lt]=r.useState(""),[dt,ut]=r.useState(""),[Ae,pt]=r.useState(""),[I,mr]=r.useState(()=>{try{const e=localStorage.getItem("seahawk_scanner_session_date");if(e&&qe.test(e))return e}catch(e){F("read session date",e)}return new Date().toISOString().slice(0,10)}),Z=r.useRef(null),mt=r.useRef(null),we=r.useRef(null),Ce=r.useRef(null),Se=r.useRef(!1),ft=r.useRef(null),fr=r.useRef(!1),xe=r.useRef(a.IDLE),qt=r.useRef(null),nt=r.useRef(0),Te=r.useRef(null),gt=r.useRef(new Set),rt=r.useRef([]),ht=r.useRef({awb:"",hits:0,lastSeenAt:0}),tn=r.useRef(0),st=r.useRef(!1),nn=r.useRef(0),ze=r.useRef(null),gr=r.useRef(null),Pt=r.useRef({message:"",at:0}),pe=r.useRef({lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]}),ve=r.useRef(null),rn=r.useRef(null),sn=r.useRef({}),xt=r.useRef(null),bt=r.useRef(null),yt=r.useRef(null),u=r.useCallback(e=>{Pe(e)},[]),K=r.useCallback(e=>{Dt.current=e,lr(e)},[]),ae=r.useCallback(e=>{tn.current=e,dr(e)},[]),Lt=r.useCallback((e,n="warning")=>{if(!e)return;const s=Date.now();Pt.current.message===e&&s-Pt.current.at<ls||(Pt.current={message:e,at:s},g(e),n&&v(n))},[]),an=r.useCallback(e=>{K(0),ae(0),Bt("document"),g(e||'No barcode lock yet. Capture label instead or tap "Back to barcode mode" and hold steady.'),v("warning")},[K,ae]),wt=r.useCallback(()=>{const e=Xr({currentAttempts:tn.current,maxReframeAttempts:kt});if(e.action==="reframe"){ae(e.attempts),K(0),g(`No lock yet. Reframe ${e.attempts}/${kt}: move closer, reduce glare, keep barcode horizontal.`),v("retry");return}an("No stable barcode lock after reframe retries. Capture label for OCR fallback.")},[an,K,ae]),hr=r.useCallback(()=>{ie(""),g(""),u(a.CAPTURING)},[u]),on=r.useCallback(e=>{const n=Date.now(),s=Kr({samples:rt.current,awb:e,now:n,stabilityWindowMs:as,requiredHits:os});return rt.current=s.samples,ht.current={awb:e,hits:s.hits,lastSeenAt:n},s.isStable},[]),Me=r.useCallback(async()=>{var s;if(!nr())throw new Error("Camera requires HTTPS (or localhost). Open this page over https:// on your phone.");if(!((s=navigator==null?void 0:navigator.mediaDevices)!=null&&s.getUserMedia))throw new Error("Camera not supported on this browser/device.");if(!Z.current)throw new Error("Camera element not ready.");const e=Z.current.srcObject;if(e&&typeof e.getTracks=="function"&&e.getTracks().some(f=>f.readyState==="live")){await Z.current.play();return}let n=null;try{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}Z.current.srcObject=n,await Z.current.play()},[]);r.useEffect(()=>{const e=setInterval(()=>Fe(ms(Date.now()-k.startedAt)),3e4);return()=>clearInterval(e)},[k.startedAt]),r.useEffect(()=>{gt.current=k.scannedAwbs instanceof Set?k.scannedAwbs:new Set},[k.scannedAwbs]),r.useEffect(()=>{try{localStorage.setItem(T,JSON.stringify({scanNumber:Number(k.scanNumber||0),clientFreq:k.clientFreq||{},dominantClient:k.dominantClient||null,dominantClientCount:Number(k.dominantClientCount||0),startedAt:Number(k.startedAt||Date.now()),scannedItems:Array.isArray(k.scannedItems)?k.scannedItems:[],scannedAwbs:Array.from(k.scannedAwbs||[])}))}catch(e){F("persist session state",e)}},[k,T]),r.useEffect(()=>{try{ue?localStorage.setItem(U,ue):localStorage.removeItem(U)}catch(e){F("persist sticky client",e)}},[ue,U]);const it=r.useCallback(e=>{et(e);try{e.length?localStorage.setItem(A,JSON.stringify(e)):localStorage.removeItem(A)}catch(n){F("persist offline queue",n)}},[A]),Ve=r.useCallback(e=>{const n={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:e};return it([...R,n]),n},[R,it]),cn=r.useCallback(async e=>{if(String((e==null?void 0:e.scanMode)||"").toLowerCase()==="fast_barcode_only"){await ge.post("/shipments/scan",{awb:e.awb,courier:"AUTO",captureOnly:!0,sessionContext:e.sessionContext||{}});return}await ge.post("/shipments/scan-mobile",{awb:e.awb,imageBase64:e.imageBase64,focusImageBase64:e.focusImageBase64||e.imageBase64,sessionContext:e.sessionContext||{}})},[]),at=r.useCallback(async()=>{var e;if(R.length){if(p){if(!navigator.onLine)return;const n=[];for(const s of R)if((e=s==null?void 0:s.payload)!=null&&e.awb)try{await cn(s.payload)}catch{n.push(s)}it(n),n.length?g(`Uploaded partially. ${n.length} scan(s) still queued.`):g("");return}!h||!h.connected||(R.forEach(n=>{var s;(s=n==null?void 0:n.payload)!=null&&s.awb&&h.emit("scanner:scan",n.payload)}),it([]))}},[p,h,R,it,cn]),G=r.useCallback(e=>{Ue(n=>{const s={...e,awb:String((e==null?void 0:e.awb)||"").trim().toUpperCase(),queueId:(e==null?void 0:e.queueId)||`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,date:Xe(e==null?void 0:e.date,I),time:(e==null?void 0:e.time)||Date.now()},c={...n,scannedItems:[s,...n.scannedItems]};try{localStorage.setItem(D,String(c.scanNumber))}catch(f){F("persist daily count",f)}return c})},[D,I]),ln=r.useCallback((e,n="")=>{e&&(Ue(s=>{const c=s.scannedItems.filter(S=>S.queueId!==e),f=new Set(s.scannedAwbs),x=String(n||"").trim().toUpperCase();return x&&f.delete(x),gt.current=f,{...s,scannedItems:c,scannedAwbs:f}}),lt(s=>s===e?"":s))},[]),xr=r.useCallback(e=>{e!=null&&e.queueId&&(lt(e.queueId),ut(Xe(e.date,I)))},[I]),br=r.useCallback(()=>{lt(""),ut("")},[]),yr=r.useCallback(async e=>{if(!(e!=null&&e.queueId))return;const n=String(dt||"").trim();if(!qe.test(n)){window.alert("Please select a valid date.");return}pt(e.queueId);try{e.shipmentId&&await ge.put(`/shipments/${e.shipmentId}`,{date:n}),Ue(s=>({...s,scannedItems:s.scannedItems.map(c=>c.queueId===e.queueId?{...c,date:n}:c)})),lt(""),ut("")}catch(s){window.alert((s==null?void 0:s.message)||"Could not update consignment date.")}finally{pt("")}},[dt]),wr=r.useCallback(async e=>{if(!(e!=null&&e.queueId))return;const n=String(e.awb||"").trim()||"this consignment",s=e.shipmentId?`Delete ${n}? This will remove it from accepted consignments and from the server.`:`Remove ${n} from accepted consignments?`;if(window.confirm(s)){pt(e.queueId);try{e.shipmentId&&await ge.delete(`/shipments/${e.shipmentId}`),ln(e.queueId,e.awb)}catch(c){window.alert((c==null?void 0:c.message)||"Could not delete consignment.")}finally{pt("")}}},[ln]);r.useEffect(()=>{xt.current=G},[G]),r.useEffect(()=>{rn.current=o},[o]),r.useEffect(()=>{sn.current=b},[b]);const Cr=r.useCallback(()=>{if(y!=="paired"){g(p?"Scanner is offline. Reconnect internet and retry.":"Phone is not connected to the desktop session.");return}if(g(""),C){u(a.SCANNING);return}Me().then(()=>u(a.SCANNING)).catch(e=>g((e==null?void 0:e.message)||"Camera access failed."))},[y,Me,u,C,p]),Sr=r.useCallback(e=>{var s;e==null||e.preventDefault();const n=tt.trim().toUpperCase();if(!n||n.length<6){g("Enter a valid AWB number (min 6 chars)");return}if(y!=="paired"){g(p?"Scanner is offline. Reconnect internet and retry.":"Not connected to desktop session.");return}if(g(""),Xt(""),ie(n),C){ye(!0),u(a.CAPTURING);return}if(j==="fast"){(s=ze.current)==null||s.call(ze,n);return}ye(!0),u(a.CAPTURING)},[tt,y,u,C,p,j]),vr=r.useCallback(()=>{if(window.confirm(p?"Exit this scanner session on the phone?":"End this mobile scanner session on the phone?")){try{localStorage.removeItem(T)}catch(e){F("clear session state on terminate",e)}if(p){w("/app/scan");return}h!=null&&h.connected?h.emit("scanner:end-session",{reason:"Mobile ended the session"}):w("/")}},[h,w,p,T]),kr=r.useCallback(()=>{if(R.length>0){at();return}window.alert(p?"No queued scans to upload.":"Everything is already synced.")},[R.length,at,p]);r.useEffect(()=>{xe.current=N},[N]);const ke=r.useCallback((e=null)=>{e&&he(e),le({}),g(""),u(a.CAPTURING)},[u]),He=r.useCallback(e=>{if(!e)return;const n=Ie(e.clientCode||""),s=Ie(ue||n);if(he(e),W({clientCode:s,consignee:e.consignee||"",destination:e.destination||"",pincode:e.pincode||"",weight:e.weight||0,amount:e.amount||0,orderNo:e.orderNo||"",courier:Qt(e.courier||""),date:e.date||I||new Date().toISOString().slice(0,10)}),le({}),e.reviewRequired){v("review"),jt(),u(a.REVIEWING);return}Je(),v("success"),Ge&&Yt(`Auto approved. ${e.clientName||""}. ${e.destination||""}.`);const c={awb:e.awb,clientCode:s||e.clientCode,clientName:e.clientName,destination:e.destination||"",weight:e.weight||0,autoApproved:!0,shipmentId:e.shipmentId||null,date:Xe(e.date,I)};L(c),G(c),u(a.SUCCESS)},[G,u,Ge,I,ue]);r.useEffect(()=>{bt.current=ke},[ke]),r.useEffect(()=>{yt.current=He},[He]),r.useEffect(()=>{if(C){z("paired"),Rt("Mock Mode"),g(""),u(a.IDLE);return}if(p){re(null),z("paired"),Rt("Direct Mode"),g(""),u(a.IDLE);return}if(!l){g("No PIN provided.");return}const e=Vr(Zr,{auth:{scannerPin:l},transports:["websocket","polling"],reconnection:!0,reconnectionDelay:1500,reconnectionAttempts:20});return e.on("connect",()=>z("connecting")),e.on("scanner:paired",({userEmail:n})=>{z("paired"),Rt(n?n.split("@")[0]:"Connected"),g("");const s=xe.current;s===a.PROCESSING||s===a.REVIEWING||s===a.APPROVING||s===a.SUCCESS||u(a.IDLE)}),e.on("scanner:error",({message:n})=>{g(n),z("disconnected")}),e.on("scanner:session-ended",({reason:n})=>{z("disconnected"),g(n||"Session ended by desktop.");try{localStorage.removeItem(T)}catch(s){F("clear session state on end",s)}w("/")}),e.on("scanner:desktop-disconnected",({message:n})=>{z("paired"),g(n||"Desktop disconnected. Keep scanning; approvals will resume when desktop reconnects.")}),e.on("disconnect",()=>z("disconnected")),e.on("reconnect",()=>{const n=xe.current;if(n===a.PROCESSING||n===a.REVIEWING||n===a.APPROVING||n===a.SUCCESS){z("paired");return}z("paired"),u(a.SCANNING)}),e.on("scanner:scan-processed",n=>{var c,f;const s=xe.current;if(!(s!==a.PROCESSING&&s!==a.REVIEWING)){if(n.status==="error"){if(s!==a.PROCESSING)return;X("error"),ne(),v("error"),u(a.ERROR),g(n.error||"Scan failed on desktop.");return}if(n.status==="photo_required"||n.requiresImageCapture){(c=bt.current)==null||c.call(bt,n);return}(f=yt.current)==null||f.call(yt,n)}}),e.on("scanner:approval-result",({success:n,message:s,awb:c,shipmentId:f})=>{var $;const x=rn.current||{},S=sn.current||{};if(n){jt(),v("success"),X("success");const m=Ie(S.clientCode||"");m&&ct(m==="MISC"?"":m),m&&m!=="MISC"&&Ue(E=>{var je,Ke;const Ne={...E.clientFreq};Ne[m]=(Ne[m]||0)+1;const Oe=Object.entries(Ne).sort((Mr,Br)=>Br[1]-Mr[1]);return{...E,clientFreq:Ne,dominantClient:((je=Oe[0])==null?void 0:je[1])>=2?Oe[0][0]:null,dominantClientCount:((Ke=Oe[0])==null?void 0:Ke[1])||0}});const ee={awb:(x==null?void 0:x.awb)||c,clientCode:S.clientCode,clientName:(x==null?void 0:x.clientName)||S.clientCode,destination:S.destination||"",weight:parseFloat(S.weight)||0,shipmentId:f||(x==null?void 0:x.shipmentId)||null,date:Xe(S.date||(x==null?void 0:x.date),"")};L(ee),($=xt.current)==null||$.call(xt,ee),u(a.SUCCESS)}else ne(),v("error"),g(s||"Approval failed.")}),e.on("scanner:ready-for-next",()=>{}),re(e),()=>{e.disconnect()}},[l,u,w,C,p,T]),r.useEffect(()=>{if(C||p||!h||y!=="paired"||!h.connected)return;const e=()=>{h.emit("scanner:heartbeat",{},()=>{})};e();const n=setInterval(e,is);return()=>clearInterval(n)},[h,y,C,p]),r.useEffect(()=>{try{const e=localStorage.getItem(A);if(!e)return;const n=JSON.parse(e);Array.isArray(n)&&n.length&&et(n)}catch(e){F("hydrate offline queue",e)}},[A]),r.useEffect(()=>{try{localStorage.setItem(Kn,j)}catch(e){F("persist workflow mode",e)}},[j]),r.useEffect(()=>{try{localStorage.setItem(Xn,Y)}catch(e){F("persist device profile",e)}},[Y]),r.useEffect(()=>{if(R.length){if(p){y==="paired"&&navigator.onLine&&at();return}y==="paired"&&(h!=null&&h.connected)&&at()}},[y,h,R.length,at,p]);const Qe=r.useCallback(async()=>{var e;try{if(ye(!1),ve.current&&ve.current.stop(),Ce.current){try{const n=Ce.current;n!=null&&n.barcodeScanner&&await n.barcodeScanner.dispose()}catch(n){F("dispose scanbot camera scanner",n)}Ce.current=null}if(we.current){try{await we.current.reset()}catch(n){F("reset camera scanner",n)}we.current=null}(e=Z.current)!=null&&e.srcObject&&(Z.current.srcObject.getTracks().forEach(n=>n.stop()),Z.current.srcObject=null)}catch(n){F("stopCamera",n)}},[]),Ye=r.useCallback(async()=>{try{if(Tt("idle"),ve.current&&ve.current.stop(),Ce.current){try{await Ce.current.barcodeScanner.dispose()}catch(e){F("dispose barcode scanner",e)}Ce.current=null}if(we.current){try{we.current._type==="native"?we.current.reset():await we.current.reset()}catch(e){F("reset barcode scanner",e)}we.current=null}}catch(e){F("stopBarcodeScanner",e)}},[]),dn=r.useCallback(async()=>{if(Z.current){await Ye();try{nt.current=Date.now(),await Me(),ve.current||(ve.current=Hr()),await ve.current.start(Z.current,mt.current,{onDetected:(e,n)=>{var f;if(Se.current)return;K(0);const s=(n==null?void 0:n.format)||"unknown",c=(n==null?void 0:n.engine)||"unknown";or({value:e,format:s,engine:c,at:Date.now(),sinceStartMs:nt.current?Date.now()-nt.current:null,candidateCount:(n==null?void 0:n.candidateCount)||1,ambiguous:!1,alternatives:(n==null?void 0:n.alternatives)||[]}),Tt(c),(f=Te.current)==null||f.call(Te,e,{candidateCount:(n==null?void 0:n.candidateCount)||1,ambiguous:!1,alternatives:(n==null?void 0:n.alternatives)||[],format:s,engine:c})},onFail:()=>{const e=Dt.current+1;K(e),e>=Jn&&wt()},onEngineReady:e=>{console.log(`[MobileScanner] Barcode engine ready: ${e}`),Tt(e)}})}catch(e){g("Camera access failed: "+e.message)}}},[Me,Ye,wt,K]),un=r.useCallback((e,n={})=>{var x;const s=String(e||"").trim().replace(/\s+/g,"").toUpperCase(),c=Qr(e)||s;if(Se.current||xe.current!==a.SCANNING)return;if(!c||c.length<8){s.replace(/[^A-Z0-9]/g,"").length>=4&&Lt("Partial barcode detected. Move closer so full AWB is visible.");return}if(n!=null&&n.ambiguous){const S=Dt.current+1;K(S),Lt("Multiple barcodes detected. Keep only the AWB barcode inside the strip.","retry"),S>=Jn&&wt();return}if(!C&&!on(c))return;if(Se.current=!0,gt.current.has(c)){v("duplicate"),ne(),Ee(c),setTimeout(()=>{Ee(""),Se.current=!1,ht.current={awb:"",hits:0,lastSeenAt:0},rt.current=[]},2500);return}clearTimeout(qt.current),v("lock"),jt(),ie(c);const f=nt.current?Date.now()-nt.current:null;if(Mt(f),pe.current={lockTimeMs:f,candidateCount:Number((n==null?void 0:n.candidateCount)||1),ambiguous:!!(n!=null&&n.ambiguous),alternatives:Array.isArray(n==null?void 0:n.alternatives)?n.alternatives.slice(0,3):[]},ae(0),K(0),g(""),Ue(S=>{const $={...S,scanNumber:S.scanNumber+1};return $.scannedAwbs=new Set(S.scannedAwbs),$.scannedAwbs.add(c),gt.current=$.scannedAwbs,$}),j==="fast"){(x=ze.current)==null||x.call(ze,c);return}ye(!0),u(a.CAPTURING)},[u,on,j,C,K,ae,Lt,wt]);r.useEffect(()=>{Te.current=un},[un]),r.useEffect(()=>{if(N===a.SCANNING&&(Se.current=!1,ht.current={awb:"",hits:0,lastSeenAt:0},rt.current=[],pe.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},Mt(null),ae(0),K(0),Bt("barcode"),dn(),C&&q)){const e=setTimeout(()=>{var n;xe.current===a.SCANNING&&((n=Te.current)==null||n.call(Te,q))},50);return()=>clearTimeout(e)}return()=>{N===a.SCANNING&&Ye()}},[N,dn,Ye,K,ae,C,q]);const pn=r.useCallback(async()=>{if(C){ye(!0);return}await Ye();try{await Me(),ye(!0)}catch(e){g("Camera access failed: "+e.message)}},[Me,Ye,C]);r.useEffect(()=>{N===a.CAPTURING&&pn()},[N,pn]);const Ct=r.useCallback(()=>{const e=Z.current,n=mt.current;return Yr(e,n)},[]);r.useEffect(()=>{if(N!==a.CAPTURING){V(!1),Q(0),We({ok:!1,issues:[],metrics:null}),fr.current=!1,st.current=!1;return}const e=setInterval(()=>{const n=Ct();n&&(We(n),V(n.ok),Q(s=>{const c=n.ok?Math.min(s+1,8):0;return c>=Ht&&!st.current&&(v("tap"),st.current=!0),n.ok||(st.current=!1),c}))},280);return()=>clearInterval(e)},[N,Ct]);const mn=r.useCallback((e={})=>{const n=Z.current,s=mt.current;if(!n||!s||!n.videoWidth)return null;const c=sr(n,s);if(!c)return null;const f=c.x,x=c.y,S=c.w,$=c.h;if(!S||!$)return null;const m=Math.max(640,Number(e.maxWidth||Zn)),ee=Math.min(.85,Math.max(.55,Number(e.quality||De))),E=document.createElement("canvas");E.width=Math.min(m,Math.round(S)),E.height=Math.round(E.width/S*$),E.getContext("2d").drawImage(n,f,x,S,$,0,0,E.width,E.height);const je=E.toDataURL("image/jpeg",ee).split(",")[1]||"";if(!je)return null;const Ke=Math.floor(je.length*3/4);return{base64:je,width:E.width,height:E.height,approxBytes:Ke,quality:ee}},[]),Nr=r.useCallback(()=>{const e=Date.now();if(e-nn.current<cs)return;nn.current=e;const n=Ct()||B;if(!(n!=null&&n.ok)||J<Ht){g(Vn(n==null?void 0:n.issues)||"Capture quality is low. Hold steady and align the AWB in the frame."),v("warning"),ne();return}X("white"),us(),v("tap");const s=mn({maxWidth:Zn,quality:De});if(!(s!=null&&s.base64)){g("Could not capture image. Try again."),Se.current=!1;return}_e({kb:Math.round((s.approxBytes||0)/1024),width:s.width||0,height:s.height||0,quality:s.quality||De}),oe(`data:image/jpeg;base64,${s.base64}`),Qe(),u(a.PREVIEW)},[mn,Qe,u,Ct,B,J]),jr=r.useCallback(()=>{if(!C)return;const e="data:image/jpeg;base64,ZmFrZS1tb2NrLWltYWdl";_e({kb:0,width:0,height:0,quality:De}),oe(e),Qe(),u(a.PREVIEW)},[u,C,Qe]),Be=r.useCallback(()=>{var e,n,s;return{scanNumber:k.scanNumber,recentClient:k.dominantClient,dominantClient:k.dominantClient,dominantClientCount:k.dominantClientCount,stickyClientCode:ue||void 0,sessionDurationMin:Math.round((Date.now()-k.startedAt)/6e4),sessionDate:I,scanWorkflowMode:j,scanMode:Re,deviceProfile:Y,hardwareClass:Y===te.rugged?"rugged":"phone",captureQuality:{ok:!!B.ok,issues:Array.isArray(B.issues)?B.issues.slice(0,8):[],metrics:B.metrics||null},captureMeta:{kb:_.kb||0,width:_.width||0,height:_.height||0,quality:_.quality||De},lockTimeMs:Number.isFinite(Number((e=pe.current)==null?void 0:e.lockTimeMs))?Number(pe.current.lockTimeMs):null,lockCandidateCount:Number.isFinite(Number((n=pe.current)==null?void 0:n.candidateCount))?Number(pe.current.candidateCount):1,lockAlternatives:Array.isArray((s=pe.current)==null?void 0:s.alternatives)?pe.current.alternatives.slice(0,3):[]}},[k,I,j,Re,Y,B,_,ue]),fn=r.useCallback(async e=>{var c,f;const n=String(e||"").trim().toUpperCase();if(!n)return;if(u(a.PROCESSING),C){setTimeout(()=>{const x={awb:n,clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25,date:I};L(x),G(x),u(a.SUCCESS)},120);return}const s={awb:n,imageBase64:null,focusImageBase64:null,scanMode:"fast_barcode_only",sessionContext:Be()};if(p){if(!navigator.onLine){Ve(s),Je(),v("success");const x={awb:n,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0,date:I};L({...x,offlineQueued:!0}),G(x),u(a.SUCCESS);return}try{const x=await ge.post("/shipments/scan",{awb:n,courier:"AUTO",captureOnly:!0,sessionContext:Be()}),S=((c=x==null?void 0:x.data)==null?void 0:c.shipment)||{},$={awb:S.awb||n,clientCode:S.clientCode||"MISC",clientName:((f=S.client)==null?void 0:f.company)||S.clientCode||"Scanned",destination:S.destination||"",weight:S.weight||0,shipmentId:S.id||null,date:Xe(S.date,I)};L($),G($),Je(),v("success"),u(a.SUCCESS)}catch(x){g((x==null?void 0:x.message)||"Barcode processing failed. Please try again."),ne(),v("error"),u(a.ERROR)}return}if(!h||!h.connected||y!=="paired"){Ve(s),Je(),v("success");const x={awb:n,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0,date:I};L({...x,offlineQueued:!0}),G(x),u(a.SUCCESS);return}h.emit("scanner:scan",s),setTimeout(()=>{xe.current===a.PROCESSING&&(g("Barcode processing timed out. Please try scanning again."),ne(),v("error"),u(a.ERROR))},es)},[h,y,u,C,Ve,G,Be,p,I]);r.useEffect(()=>{ze.current=fn},[fn]);const gn=r.useCallback(async e=>{const n=String(e||"").trim().toUpperCase();if(!n)return;if(u(a.PROCESSING),C){u(a.CAPTURING);return}const s={awb:n,scanMode:"lookup_first",sessionContext:Be()};if(p){if(!navigator.onLine){ke({awb:n,status:"photo_required",requiresImageCapture:!0});return}try{const c=await ge.post("/shipments/scan-mobile",s),f=(c==null?void 0:c.data)||c;if(f.status==="error"||!f.success){X("error"),ne(),v("error"),u(a.ERROR),g(f.error||f.message||"Lookup failed.");return}if(f.status==="photo_required"||f.requiresImageCapture){ke(f);return}He(f)}catch(c){g((c==null?void 0:c.message)||"Lookup failed. Please try again."),ne(),v("error"),u(a.ERROR)}return}if(!h||!h.connected||y!=="paired"){ke({awb:n,status:"photo_required",requiresImageCapture:!0});return}h.emit("scanner:scan",s),setTimeout(()=>{xe.current===a.PROCESSING&&(g("Lookup timed out. Capture the label photo and continue."),u(a.CAPTURING))},ts)},[h,y,u,C,Be,p,ke,He]);r.useEffect(()=>{gr.current=gn},[gn]);const Ir=r.useCallback(async()=>{if(!H)return;if(u(a.PROCESSING),C){setTimeout(()=>{const s={awb:M||"100454974120",clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25,date:I};L(s),G(s),u(a.SUCCESS)},250);return}const e=H.split(",")[1]||H,n={awb:M||"",imageBase64:e,focusImageBase64:e,scanMode:"ocr_label",sessionContext:Be()};if(p){if(!navigator.onLine){Ve(n),Je(),v("success");const s={awb:M||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0,date:I};L({...s,offlineQueued:!0}),G(s),u(a.SUCCESS);return}try{const s=await ge.post("/shipments/scan-mobile",n),c=(s==null?void 0:s.data)||s;if(c.status==="error"||!c.success){X("error"),ne(),v("error"),u(a.ERROR),g(c.error||c.message||"Scan failed.");return}if(c.status==="photo_required"||c.requiresImageCapture){ke(c);return}He(c)}catch(s){g((s==null?void 0:s.message)||"Server error. Please try again."),ne(),v("error"),u(a.ERROR)}return}if(!h||!h.connected||y!=="paired"){Ve(n),Je(),v("success");const s={awb:M||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0,date:I};L({...s,offlineQueued:!0}),G(s),u(a.SUCCESS);return}h.emit("scanner:scan",n),setTimeout(()=>{xe.current===a.PROCESSING&&(g("OCR timed out after 40 seconds. Retake the label photo and try again."),ne(),v("error"),u(a.ERROR))},4e4)},[h,M,H,u,y,Ve,G,C,Be,p,He,ke,I]),Er=r.useCallback(async()=>{var S,$;if(!o)return;u(a.APPROVING);let e=!1;const n=b.date||I||new Date().toISOString().slice(0,10);if(C){setTimeout(()=>{const m={awb:o.awb||M,clientCode:b.clientCode||"MOCKCL",clientName:o.clientName||b.clientCode||"Mock Client",destination:b.destination||"",weight:parseFloat(b.weight)||0,shipmentId:o.shipmentId||null,date:n};L(m),G(m),X("success"),e=!0,u(a.SUCCESS)},200);return}const s={clientCode:o.clientCode||"",clientName:o.clientName||"",consignee:o.consignee||"",destination:o.destination||""},c={clientCode:b.clientCode||"",clientName:b.clientCode||"",consignee:b.consignee||"",destination:b.destination||""},f={clientCode:b.clientCode,consignee:b.consignee,destination:b.destination,pincode:b.pincode,weight:parseFloat(b.weight)||0,amount:parseFloat(b.amount)||0,orderNo:b.orderNo||"",courier:b.courier||"",date:n};if(p)try{(o.ocrExtracted||o)&&await ge.post("/shipments/learn-corrections",{ocrFields:s,approvedFields:c});let m=null;if(o.shipmentId){const E=await ge.put(`/shipments/${o.shipmentId}`,f);m=(E==null?void 0:E.data)||null}else{const E=await ge.post("/shipments",{awb:o.awb||M,...f});m=(E==null?void 0:E.data)||null}jt(),v("success"),X("success");const ee={awb:(m==null?void 0:m.awb)||(o==null?void 0:o.awb)||M,clientCode:(m==null?void 0:m.clientCode)||b.clientCode,clientName:(o==null?void 0:o.clientName)||((S=m==null?void 0:m.client)==null?void 0:S.company)||b.clientCode,destination:(m==null?void 0:m.destination)||b.destination||"",weight:parseFloat((m==null?void 0:m.weight)??b.weight)||0,shipmentId:(m==null?void 0:m.id)||(o==null?void 0:o.shipmentId)||null,date:Xe(m==null?void 0:m.date,n)};L(ee),G(ee),e=!0,u(a.SUCCESS)}catch(m){u(a.REVIEWING),ne(),v("error"),g((m==null?void 0:m.message)||"Approval failed.")}else{if(!h){u(a.REVIEWING),g("Not connected to desktop session.");return}(o.ocrExtracted||o)&&h.emit("scanner:learn-corrections",{pin:l,ocrFields:s,approvedFields:c,courier:(o==null?void 0:o.courier)||(($=o==null?void 0:o.ocrExtracted)==null?void 0:$.courier)||"",deviceProfile:Y}),h.emit("scanner:approval-submit",{shipmentId:o.shipmentId,awb:o.awb||M,fields:f},m=>{m!=null&&m.success||(u(a.REVIEWING),ne(),v("error"),g((m==null?void 0:m.message)||"Approval failed."))})}const x=Ie(b.clientCode||"");e&&x&&ct(x==="MISC"?"":x),e&&x&&x!=="MISC"&&Ue(m=>{var Ne,Oe;const ee={...m.clientFreq};ee[x]=(ee[x]||0)+1;const E=Object.entries(ee).sort((je,Ke)=>Ke[1]-je[1]);return{...m,clientFreq:ee,dominantClient:((Ne=E[0])==null?void 0:Ne[1])>=2?E[0][0]:null,dominantClientCount:((Oe=E[0])==null?void 0:Oe[1])||0}})},[h,o,b,M,l,u,G,C,Y,p,I]),ot=r.useCallback((e=a.IDLE)=>{clearTimeout(ft.current),clearTimeout(qt.current),ie(""),oe(null),_e({kb:0,width:0,height:0,quality:De}),he(null),W({}),le({}),L(null),Mt(null),g(""),Ee(""),V(!1),Q(0),We({ok:!1,issues:[],metrics:null}),Se.current=!1,ht.current={awb:"",hits:0,lastSeenAt:0},rt.current=[],pe.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},st.current=!1,ae(0),u(e)},[u,ae]);r.useEffect(()=>{if(N===a.SUCCESS){const e=j==="fast"?a.SCANNING:a.IDLE,n=j==="fast"?Yn:Qn;return ft.current=setTimeout(()=>ot(e),n),()=>clearTimeout(ft.current)}},[N,ot,j]),r.useEffect(()=>{if(Ge)if(N===a.REVIEWING&&o){const e=[o.clientName||o.clientCode,o.destination,o.weight?`${o.weight} kilograms`:""].filter(Boolean);e.length&&Yt(e.join(". "))}else N===a.SUCCESS&&P&&Yt(`${P.clientName||P.clientCode||"Shipment"} Verified.`)},[Ge,N,o,P]),r.useEffect(()=>()=>{Qe(),clearTimeout(ft.current),clearTimeout(qt.current)},[Qe]);const me=e=>`msp-step ${N===e?"active":""}`,hn=Math.max(1,Math.round((j==="fast"?Yn:Qn)/1e3)),Fr=B.ok?"AWB quality looks good - press shutter":Vn(B.issues)||"Fit AWB slip fully in frame and hold steady",xn=$e&&B.ok&&J>=Ht,fe=r.useMemo(()=>{if(!o)return{};const e=o.ocrExtracted||o;return{clientCode:{confidence:(e==null?void 0:e.clientNameConfidence)||0,source:(e==null?void 0:e.clientNameSource)||null},consignee:{confidence:(e==null?void 0:e.consigneeConfidence)||0,source:(e==null?void 0:e.consigneeSource)||null},destination:{confidence:(e==null?void 0:e.destinationConfidence)||0,source:(e==null?void 0:e.destinationSource)||null},pincode:{confidence:(e==null?void 0:e.pincodeConfidence)||0,source:(e==null?void 0:e.pincodeSource)||null},weight:{confidence:(e==null?void 0:e.weightConfidence)||0,source:(e==null?void 0:e.weightSource)||null}}},[o]),Rr=r.useCallback(()=>{W(e=>{const n=Qt(e.courier||(o==null?void 0:o.courier)||""),s=Nt.findIndex(f=>f.toUpperCase()===n.toUpperCase()),c=Nt[(s+1+Nt.length)%Nt.length];return{...e,courier:c}})},[o]),Wt=r.useMemo(()=>{const e=Object.values(fe).map(f=>Number((f==null?void 0:f.confidence)||0)).filter(f=>f>0),n=e.length?e.reduce((f,x)=>f+x,0)/e.length:0,s=ir(n);return{score:n,level:s,label:s==="high"?"High Confidence":s==="med"?"Medium Confidence":"Low Confidence"}},[fe]),Ar=Qt(b.courier||(o==null?void 0:o.courier)||((Cn=o==null?void 0:o.ocrExtracted)==null?void 0:Cn.courier)||""),bn=b.date||(o==null?void 0:o.date)||I||"",Tr=r.useMemo(()=>er(bn),[bn]),yn=k.scannedItems.reduce((e,n)=>e+(n.weight||0),0),O=((Sn=o==null?void 0:o.ocrExtracted)==null?void 0:Sn.intelligence)||(o==null?void 0:o.intelligence)||null,wn=(kn=(vn=(St=ve.current)==null?void 0:St.getDiagnostics)==null?void 0:vn.call(St))==null?void 0:kn.wasmFailReason,zr=[["Step",N],["Connection",y],["Engine",Jt],...wn?[["WASM Error",wn]]:[],["Workflow",j],["Device",Y],["Scan mode",Re],["Fail count",String(cr)],["Reframe retries",`${zt}/${kt}`],["Camera",$e?"ready":"waiting"],["Doc detect",ce?`yes (${J})`:"no"],["Capture quality",B.ok?"good":B.issues.join(", ")||"pending"],["Capture metrics",B.metrics?`blur ${B.metrics.blurScore} | glare ${B.metrics.glareRatio}% | skew ${B.metrics.perspectiveSkew}%`:"-"],["JPEG last shot",_.kb?`${_.kb}KB ${_.width}x${_.height} q=${_.quality}`:"-"],["Secure ctx",nr()?"yes":"no"],["AWB lock",M||"-"],["Lock ms",Zt!=null?String(Zt):"-"],["Lock candidates",String(((Nn=pe.current)==null?void 0:Nn.candidateCount)||1)],["Queued",String(R.length)],["Scans",String(k.scanNumber)],["Last format",(de==null?void 0:de.format)||"-"],["Last code",(de==null?void 0:de.value)||"-"],["Decode ms",(de==null?void 0:de.sinceStartMs)!=null?String(de.sinceStartMs):"-"],["False-lock",(jn=o==null?void 0:o.scanTelemetry)!=null&&jn.falseLock?"yes":"no"]];return t.jsxs(t.Fragment,{children:[t.jsx("style",{children:ps}),t.jsxs("div",{className:"msp-root",children:[be&&t.jsx("div",{className:`flash-overlay flash-${be}`,onAnimationEnd:()=>X(null)}),Le&&t.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[t.jsx(On,{size:48,color:"white"}),t.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),t.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:Le}),t.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),t.jsx("button",{type:"button","data-testid":"scanner-diag-toggle",onClick:()=>ar(e=>!e),style:{position:"fixed",top:12,right:12,zIndex:70,border:"1px solid rgba(255,255,255,0.18)",background:At?"rgba(79,70,229,0.92)":"rgba(15,23,42,0.72)",color:"#fff",borderRadius:999,padding:"8px 12px",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.04em",backdropFilter:"blur(10px)",cursor:"pointer"},children:At?"Hide Diag":"Show Diag"}),At&&t.jsxs("div",{"data-testid":"scanner-diag-panel",style:{position:"fixed",top:56,right:12,zIndex:69,width:"min(92vw, 320px)",background:"rgba(15,23,42,0.88)",color:"#E5EEF8",border:"1px solid rgba(255,255,255,0.12)",borderRadius:18,padding:14,backdropFilter:"blur(14px)",boxShadow:"0 12px 30px rgba(0,0,0,0.25)"},children:[t.jsx("div",{style:{fontSize:"0.72rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10,color:"#A5B4FC"},children:"Scanner Diagnostics"}),t.jsx("div",{style:{display:"grid",gap:6},children:zr.map(([e,n])=>t.jsxs("div",{style:{display:"flex",gap:8,justifyContent:"space-between",alignItems:"flex-start",fontSize:"0.76rem"},children:[t.jsx("div",{style:{color:"rgba(226,232,240,0.72)",minWidth:88},children:e}),t.jsx("div",{className:"mono",style:{textAlign:"right",wordBreak:"break-word",maxWidth:180},children:n})]},e))}),t.jsx("div",{style:{marginTop:10,fontSize:"0.68rem",color:"rgba(226,232,240,0.7)",lineHeight:1.4},children:"Use this to verify whether Trackon labels are being decoded as `ITF` and how quickly the first lock happens after scan start."})]}),y!=="paired"&&t.jsx("div",{className:me(a.IDLE),children:t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},children:[t.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:y==="connecting"?t.jsx(_t,{size:28,color:i.primary,style:{animation:"spin 1s linear infinite"}}):t.jsx(Dn,{size:28,color:i.error})}),t.jsxs("div",{style:{textAlign:"center"},children:[t.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:y==="connecting"?"Connecting...":"Disconnected"}),t.jsx("div",{style:{fontSize:"0.82rem",color:i.muted},children:se||(p?"Preparing direct scanner session":`Connecting to session ${l}`)})]}),y==="disconnected"&&t.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[t.jsx(_t,{size:16})," Reconnect"]})]})}),t.jsx("video",{ref:Z,autoPlay:!0,playsInline:!0,muted:!0,onClick:()=>{Me().catch(e=>{g((e==null?void 0:e.message)||"Camera access failed.")})},style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(N===a.SCANNING||N===a.CAPTURING)&&!Ce.current?"block":"none"}}),t.jsx("div",{className:me(a.IDLE),children:t.jsxs("div",{className:"home-root",children:[t.jsxs("div",{className:"home-header",children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16},children:[t.jsxs("button",{onClick:()=>w("/app/scan"),style:{background:"white",border:"1px solid #E2E8F0",padding:"6px 12px",borderRadius:20,fontSize:"0.75rem",fontWeight:600,color:"#475569",display:"flex",alignItems:"center",gap:4,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.02)"},children:[t.jsx(qr,{size:14})," Go Back"]}),t.jsxs("div",{className:"home-logo-badge",children:[t.jsx(qn,{size:11,color:y==="paired"&&navigator.onLine?"#10B981":"#EF4444"}),Ft]})]}),t.jsx("div",{className:"home-logo-row",children:t.jsxs("div",{className:"home-logo-text",children:[t.jsx("img",{src:"/images/logo.png",alt:"Sea Hawk Logo",style:{height:28,width:"auto",objectFit:"contain",padding:2,background:"white",borderRadius:6,border:"1px solid #E2E8F0"}}),t.jsx("span",{children:"Seahawk Scanner"})]})}),t.jsxs("div",{className:"home-stats-row",children:[t.jsxs("div",{className:"home-stat-card",children:[t.jsx("div",{className:"home-stat-val",children:k.scanNumber}),t.jsx("div",{className:"home-stat-label",children:"Scanned"})]}),t.jsxs("div",{className:"home-stat-card",children:[t.jsx("div",{className:"home-stat-val",children:yn>0?yn.toFixed(1):"0"}),t.jsx("div",{className:"home-stat-label",children:"Total kg"})]}),t.jsxs("div",{className:"home-stat-card",children:[t.jsx("div",{className:"home-stat-val",children:Et}),t.jsx("div",{className:"home-stat-label",children:"Session"})]})]}),t.jsxs("div",{className:"home-date-chip",children:[t.jsx($t,{size:18,color:"#38BDF8"}),t.jsxs("div",{children:[t.jsx("div",{className:"home-date-label",children:"Scan Date"}),t.jsxs("div",{className:"home-date-value",children:[new Date(I+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}),I===new Date().toISOString().slice(0,10)&&t.jsx("span",{style:{fontSize:"0.65rem",color:"#10B981",marginLeft:6,fontWeight:500},children:"TODAY"})]})]}),t.jsx("div",{className:"home-date-change",children:"Change ▸"}),t.jsx("input",{type:"date",value:I,max:new Date().toISOString().slice(0,10),onChange:e=>{const n=e.target.value;if(n&&qe.test(n)){mr(n);try{localStorage.setItem("seahawk_scanner_session_date",n)}catch(s){F("persist session date",s)}v("light")}}})]})]}),t.jsxs("div",{className:"home-scan-section",children:[t.jsxs("div",{className:"home-scan-btn-wrap",children:[t.jsx("div",{className:"home-scan-ring"}),t.jsx("div",{className:"home-scan-ring home-scan-ring2"}),t.jsxs("button",{"data-testid":"start-scan-btn",className:"home-scan-btn",onClick:Cr,children:[t.jsx(Ut,{size:34,color:"white"}),t.jsx("span",{className:"home-scan-btn-label",children:"Scan"})]})]}),t.jsx("div",{className:"home-cta-text",children:k.scanNumber===0?"Tap to start your first scan":"Tap to scan next parcel"}),t.jsxs("div",{style:{display:"flex",gap:8,marginTop:14,width:"100%",maxWidth:320},children:[t.jsxs("button",{type:"button","data-testid":"workflow-fast-btn",onClick:()=>Ot("fast"),style:{flex:1,borderRadius:999,border:`1px solid ${j==="fast"?i.primary:i.border}`,background:j==="fast"?i.primaryLight:i.surface,color:j==="fast"?i.primary:i.muted,fontWeight:700,fontSize:"0.72rem",padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[t.jsx(Pn,{size:13})," Fast scan"]}),t.jsxs("button",{type:"button","data-testid":"workflow-ocr-btn",onClick:()=>Ot("ocr"),style:{flex:1,borderRadius:999,border:`1px solid ${j==="ocr"?i.primary:i.border}`,background:j==="ocr"?i.primaryLight:i.surface,color:j==="ocr"?i.primary:i.muted,fontWeight:700,fontSize:"0.72rem",padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[t.jsx(Gt,{size:13})," OCR label"]})]}),t.jsxs("div",{style:{display:"flex",gap:8,marginTop:8,width:"100%",maxWidth:320},children:[t.jsxs("button",{type:"button","data-testid":"device-profile-phone-btn",onClick:()=>en(te.phone),style:{flex:1,borderRadius:999,border:`1px solid ${Y===te.phone?i.primary:i.border}`,background:Y===te.phone?i.primaryLight:i.surface,color:Y===te.phone?i.primary:i.muted,fontWeight:700,fontSize:"0.7rem",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[t.jsx(Ut,{size:13})," Phone lens"]}),t.jsxs("button",{type:"button","data-testid":"device-profile-rugged-btn",onClick:()=>en(te.rugged),style:{flex:1,borderRadius:999,border:`1px solid ${Y===te.rugged?i.primary:i.border}`,background:Y===te.rugged?i.primaryLight:i.surface,color:Y===te.rugged?i.primary:i.muted,fontWeight:700,fontSize:"0.7rem",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[t.jsx(Ln,{size:13})," Rugged"]})]}),t.jsxs("form",{onSubmit:Sr,style:{width:"100%",maxWidth:300,marginTop:20},children:[t.jsx("div",{style:{fontSize:"0.62rem",fontWeight:700,color:i.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6,textAlign:"center"},children:"Can't scan? Enter AWB manually"}),t.jsxs("div",{style:{display:"flex",gap:6},children:[t.jsx("input",{"data-testid":"manual-awb-input",value:tt,onChange:e=>Xt(e.target.value.toUpperCase()),placeholder:"e.g. 1234567890",inputMode:"text",autoCapitalize:"characters",style:{flex:1,padding:"9px 12px",border:`1.5px solid ${i.border}`,borderRadius:10,fontFamily:"JetBrains Mono, monospace",fontSize:"0.82rem",fontWeight:600,background:i.surface,color:i.text,outline:"none"},onFocus:e=>e.target.style.borderColor=i.primary,onBlur:e=>e.target.style.borderColor=i.border}),t.jsx("button",{type:"submit","data-testid":"manual-awb-submit",disabled:tt.trim().length<6,className:"btn btn-primary",style:{padding:"9px 14px",fontSize:"0.78rem",borderRadius:10,opacity:tt.trim().length>=6?1:.45},children:"Go →"})]})]}),t.jsxs("div",{className:"action-buttons-row",children:[t.jsxs("button",{className:"action-btn",onClick:kr,children:[t.jsx(Pr,{size:14})," ",R.length>0?`Upload (${R.length})`:"Synced"]}),t.jsxs("button",{className:"action-btn danger",onClick:vr,children:[t.jsx(Wn,{size:14})," End Session"]})]}),R.length>0&&t.jsxs("div",{style:{marginTop:14,fontSize:"0.7rem",color:i.warning,fontWeight:600,display:"flex",alignItems:"center",gap:5},children:[t.jsx(_n,{size:12})," ",R.length," offline scan",R.length>1?"s":""," pending sync"]})]}),t.jsxs("div",{className:"home-queue-section",children:[t.jsxs("div",{className:"home-queue-head",children:[t.jsxs("div",{className:"home-queue-title-text",children:[t.jsx(Lr,{size:11}),"Accepted Consignments"]}),k.scannedItems.length>0&&t.jsx("div",{className:"home-queue-badge",children:k.scannedItems.length})]}),t.jsx("div",{className:"home-queue-list",children:k.scannedItems.length===0?t.jsxs("div",{className:"queue-empty",children:[t.jsx(Vt,{size:36,color:"rgba(255,255,255,0.12)"}),t.jsxs("div",{className:"queue-empty-text",children:["No consignments scanned yet.",t.jsx("br",{}),"Tap the button above to begin."]})]}):k.scannedItems.map((e,n)=>t.jsxs("div",{className:"queue-item",children:[t.jsx("div",{className:"queue-check",children:t.jsx($n,{size:13,color:"#10B981"})}),t.jsxs("div",{className:"queue-main",children:[t.jsxs("div",{className:"queue-main-top",children:[t.jsx("div",{className:"queue-awb",children:e.awb}),e.weight>0&&t.jsxs("div",{className:"queue-weight",children:[e.weight,"kg"]})]}),t.jsxs("div",{className:"queue-meta",children:[e.clientCode==="OFFLINE"?t.jsx("span",{className:"queue-offline-tag",children:"Offline"}):e.clientCode&&t.jsx("span",{className:"queue-client-tag",children:e.clientCode}),e.destination&&t.jsx("span",{children:e.destination}),e.date&&t.jsx("span",{className:"queue-date-tag",children:er(e.date)})]}),pr===e.queueId?t.jsxs("div",{className:"queue-date-editor",children:[t.jsx("input",{type:"date",className:"queue-date-input",value:dt,max:new Date().toISOString().slice(0,10),onChange:s=>ut(s.target.value),disabled:Ae===e.queueId}),t.jsx("button",{type:"button",className:"queue-action-btn primary",onClick:()=>yr(e),disabled:Ae===e.queueId||!qe.test(dt),children:Ae===e.queueId?"Saving...":"Save"}),t.jsx("button",{type:"button",className:"queue-action-btn",onClick:br,disabled:Ae===e.queueId,children:"Cancel"})]}):t.jsxs("div",{className:"queue-actions",children:[t.jsxs("button",{type:"button",className:"queue-action-btn",onClick:()=>xr(e),disabled:Ae===e.queueId,children:[t.jsx($t,{size:12})," Edit Date"]}),t.jsxs("button",{type:"button",className:"queue-action-btn danger",onClick:()=>wr(e),disabled:Ae===e.queueId,children:[t.jsx(Wn,{size:12})," ",Ae===e.queueId?"Deleting...":"Delete"]})]})]})]},e.queueId||`${e.awb}-${n}`))})]})]})}),t.jsx("div",{className:me(a.SCANNING),children:t.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[t.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:Ce.current?"block":"none"}}),t.jsx("div",{className:"cam-overlay",children:t.jsxs("div",{className:"scan-guide",style:Re==="barcode"?{width:Hn.w,height:Hn.h,borderRadius:10,maxHeight:"20vw",transition:"all 0.4s ease",borderColor:se?"rgba(248,113,113,0.92)":void 0,boxShadow:se?"0 0 0 3px rgba(248,113,113,0.2)":void 0}:{width:vt.w,height:vt.h,borderRadius:14,maxHeight:"75vh",transition:"all 0.4s ease",borderColor:"rgba(251,191,36,0.85)",boxShadow:"0 0 0 3px rgba(251,191,36,0.2)"},children:[t.jsx("div",{className:"scan-guide-corner corner-tl"}),t.jsx("div",{className:"scan-guide-corner corner-tr"}),t.jsx("div",{className:"scan-guide-corner corner-bl"}),t.jsx("div",{className:"scan-guide-corner corner-br"}),Re==="barcode"&&t.jsx("div",{className:"scan-laser",children:t.jsx("div",{className:"scan-laser-spark"})})]})}),t.jsxs("div",{className:"cam-hud",children:[t.jsxs("div",{className:"cam-hud-chip",children:[t.jsx(qn,{size:12})," ",p?"DIRECT":l]}),t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[Re==="document"&&t.jsxs("div",{className:"cam-hud-chip",style:{background:"rgba(251,191,36,0.22)",color:"#FDE68A",fontWeight:700,fontSize:"0.65rem",gap:4},children:[t.jsx(Un,{size:11})," LABEL MODE"]}),t.jsxs("div",{className:"cam-hud-chip",style:{gap:4},children:[t.jsx(Vt,{size:12})," ",k.scanNumber,Jt==="native"?t.jsx("span",{style:{color:"#34D399",fontSize:"0.6rem",fontWeight:800},children:"⚡ NATIVE"}):t.jsx("span",{style:{color:"#F59E0B",fontSize:"0.6rem",fontWeight:800},children:"ZXING"})]})]})]}),t.jsxs("div",{className:"cam-bottom",children:[Re==="barcode"?t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:6,color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:[t.jsx("div",{children:j==="fast"?"Align barcode inside the strip - auto-save on lock":"Align barcode inside the strip - camera opens for label capture after lock"}),zt>0&&t.jsxs("div",{style:{color:"#FDE68A",fontSize:"0.74rem",fontWeight:700},children:["Reframe retry ",zt,"/",kt]}),!!se&&t.jsx("div",{style:{color:"#FCA5A5",fontSize:"0.72rem",fontWeight:700},children:se})]}):t.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:6},children:[t.jsx("div",{style:{color:"rgba(251,191,36,0.95)",fontSize:"0.82rem",fontWeight:700,textAlign:"center"},children:"No barcode found - capture the label and we will read the printed AWB"}),t.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"},children:[t.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:hr,children:"Capture label instead"}),t.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:()=>{K(0),ae(0),g(""),Bt("barcode"),v("tap")},children:"Back to barcode mode"})]})]}),t.jsxs("div",{style:{display:"flex",gap:12},children:[t.jsxs("button",{className:"cam-hud-chip",onClick:()=>Ot(e=>e==="fast"?"ocr":"fast"),style:{border:"none",cursor:"pointer",gap:5},children:[j==="fast"?t.jsx(Pn,{size:13}):t.jsx(Gt,{size:13}),j==="fast"?"FAST":"OCR"]}),t.jsx("button",{className:"cam-hud-chip",onClick:()=>ur(!Ge),style:{border:"none",cursor:"pointer"},children:Ge?t.jsx(Wr,{size:14}):t.jsx(_r,{size:14})})]})]})]})}),t.jsx("div",{className:me(a.CAPTURING),children:t.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!$e&&t.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[t.jsx($r,{size:44,color:"#34D399"}),t.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:M||"OCR fallback"}),t.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:M?"Barcode locked - Preparing camera...":"Preparing label capture for printed AWB OCR..."})]}),t.jsx("div",{className:"cam-overlay",children:t.jsxs("div",{ref:mt,className:`scan-guide ${ce?"detected":""}`,style:{width:vt.w,height:vt.h,maxHeight:"75vh",borderRadius:12},children:[t.jsx("div",{className:"scan-guide-corner corner-tl"}),t.jsx("div",{className:"scan-guide-corner corner-tr"}),t.jsx("div",{className:"scan-guide-corner corner-bl"}),t.jsx("div",{className:"scan-guide-corner corner-br"})]})}),t.jsxs("div",{className:"cam-hud",children:[t.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[t.jsx(Un,{size:12})," ",M||"OCR AWB capture"]}),R.length>0&&t.jsxs("div",{className:"cam-hud-chip",children:[t.jsx(_n,{size:12})," ",R.length," queued"]})]}),t.jsxs("div",{className:"cam-bottom",children:[t.jsx("div",{style:{color:ce?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center",transition:"color 0.3s"},children:Fr}),B.metrics&&t.jsxs("div",{style:{color:"rgba(255,255,255,0.66)",fontSize:"0.72rem",textAlign:"center"},children:["Blur ",B.metrics.blurScore," | Glare ",B.metrics.glareRatio,"% | Skew ",B.metrics.perspectiveSkew,"%"]}),t.jsx("button",{className:"capture-btn","data-testid":"capture-photo-btn",onClick:Nr,disabled:!xn,style:{opacity:xn?1:.4},children:t.jsx("div",{className:"capture-btn-inner"})}),C&&t.jsx("button",{type:"button","data-testid":"mock-capture-btn",onClick:jr,style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 12px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:"Mock capture"}),t.jsx("button",{style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},onClick:()=>{ie(""),g(""),K(0),ae(0),Se.current=!1,v("tap"),u(a.SCANNING)},children:"← Rescan barcode"})]})]})}),t.jsx("div",{className:me(a.PREVIEW),children:t.jsxs("div",{style:{background:i.bg,display:"flex",flexDirection:"column",height:"100%"},children:[t.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${i.border}`},children:t.jsxs("div",{children:[t.jsx("div",{style:{fontSize:"0.72rem",color:i.muted,fontWeight:600},children:"CAPTURED"}),t.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:M||"Printed AWB OCR"}),_.kb>0&&t.jsxs("div",{style:{fontSize:"0.68rem",color:i.mutedLight},children:[_.kb,"KB • ",_.width,"×",_.height]})]})}),t.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:H&&t.jsx("img",{src:H,alt:"Captured label",className:"preview-img"})}),t.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[t.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{oe(null),u(a.CAPTURING)},children:[t.jsx(Gn,{size:16})," Retake"]}),t.jsxs("button",{"data-testid":"use-photo-btn",className:"btn btn-primary",style:{flex:2},onClick:Ir,children:[t.jsx(Ur,{size:16})," Use Photo"]})]})]})}),t.jsx("div",{className:me(a.PROCESSING),children:t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16},children:[t.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[t.jsx(Gt,{size:22,color:i.primary,style:{animation:"spin 2s linear infinite"}}),t.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:i.primary},children:"Intelligence Engine"})]}),t.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:i.muted},children:M}),t.jsx("div",{style:{fontSize:"0.72rem",color:i.mutedLight,marginTop:6},children:H?"Reading AWB label with local OCR...":"Saving barcode scan..."})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(e=>t.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{className:"field-label",children:e}),t.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),t.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},e)),t.jsx("div",{style:{textAlign:"center",marginTop:8},children:t.jsx("button",{className:"btn btn-outline",style:{fontSize:"0.75rem",padding:"8px 20px"},onClick:()=>{g("Cancelled by user."),u(a.ERROR)},children:"Cancel"})})]})}),t.jsx("div",{className:me(a.REVIEWING),children:t.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%"},children:[t.jsxs("div",{className:"review-header",children:[t.jsxs("div",{className:"review-header-top",children:[t.jsxs("div",{children:[t.jsx("div",{className:"review-title",children:"REVIEW EXTRACTION"}),t.jsx("div",{className:"mono review-awb",children:(o==null?void 0:o.awb)||M})]}),(O==null?void 0:O.learnedFieldCount)>0&&t.jsxs("div",{className:"source-badge source-learned",children:["AI ",O.learnedFieldCount," auto-corrected"]})]}),t.jsxs("div",{className:"review-meta-row",children:[t.jsxs("span",{className:`review-confidence ${Wt.level}`,children:[t.jsx(Ln,{size:13}),Wt.label," (",Math.round(Wt.score*100),"%)"]}),t.jsxs("button",{type:"button",className:"review-chip review-chip-courier",onClick:Rr,title:"Tap to change courier",children:[t.jsx(Vt,{size:13}),Ar||"Trackon"]}),t.jsxs("span",{className:"review-chip review-chip-date",children:[t.jsx($t,{size:13}),Tr||"No date"]})]})]}),t.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[t.jsxs("div",{className:`field-card ${(((In=fe.clientCode)==null?void 0:In.confidence)||0)<.55?"warning":""}`,children:[t.jsx("div",{className:Kt(((En=fe.clientCode)==null?void 0:En.confidence)||0)}),t.jsxs("div",{style:{flex:1},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[t.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((Fn=fe.clientCode)==null?void 0:Fn.source)&&(()=>{const e=rr(fe.clientCode.source);return e?t.jsxs("span",{className:e.className,children:[e.icon," ",e.text]}):null})()]}),t.jsx("input",{className:"field-input",value:b.clientCode||"",onChange:e=>W(n=>({...n,clientCode:e.target.value.toUpperCase()})),placeholder:"Client code"}),t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:6,gap:8},children:[t.jsx("div",{style:{fontSize:"0.62rem",color:"#64748B"},children:ue?`Sticky for next scans: ${ue}`:"Sticky client is off"}),ue?t.jsx("button",{type:"button",className:"suggest-chip",onClick:()=>ct(""),children:"Clear sticky"}):t.jsx("button",{type:"button",className:"suggest-chip",onClick:()=>{const e=Ie(b.clientCode||"");e&&e!=="MISC"&&ct(e)},children:"Keep this client"})]}),((Rn=O==null?void 0:O.clientMatches)==null?void 0:Rn.length)>0&&O.clientNeedsConfirmation&&t.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:O.clientMatches.slice(0,3).map(e=>t.jsxs("button",{type:"button",className:`suggest-chip ${b.clientCode===e.code?"active":""}`,onClick:()=>W(n=>({...n,clientCode:e.code})),children:[e.code," (",Math.round(e.score*100),"%)"]},e.code))})]})]}),t.jsxs("div",{className:"field-card",children:[t.jsx("div",{className:Kt(((An=fe.consignee)==null?void 0:An.confidence)||0)}),t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{className:"field-label",children:"Consignee"}),t.jsx("input",{className:"field-input",value:b.consignee||"",onChange:e=>W(n=>({...n,consignee:e.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),t.jsxs("div",{className:"field-card",children:[t.jsx("div",{className:Kt(((Tn=fe.destination)==null?void 0:Tn.confidence)||0)}),t.jsxs("div",{style:{flex:1},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[t.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((zn=fe.destination)==null?void 0:zn.source)&&(()=>{const e=rr(fe.destination.source);return e?t.jsxs("span",{className:e.className,children:[e.icon," ",e.text]}):null})()]}),t.jsx("input",{className:"field-input",value:b.destination||"",onChange:e=>W(n=>({...n,destination:e.target.value.toUpperCase()})),placeholder:"City"}),(O==null?void 0:O.pincodeCity)&&O.pincodeCity!==b.destination&&t.jsxs("button",{onClick:()=>W(e=>({...e,destination:O.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:i.successLight,color:i.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["ðŸ“ Pincode suggests: ",O.pincodeCity]})]})]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[t.jsx("div",{className:"field-card",children:t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{className:"field-label",children:"Pincode"}),t.jsx("input",{className:"field-input",value:b.pincode||"",onChange:e=>W(n=>({...n,pincode:e.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),t.jsx("div",{className:`field-card ${(Mn=O==null?void 0:O.weightAnomaly)!=null&&Mn.anomaly?"warning":"conf-med"}`,children:t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{className:"field-label",children:"Weight (kg)"}),t.jsx("input",{className:"field-input",value:b.weight||"",onChange:e=>W(n=>({...n,weight:e.target.value})),placeholder:"0.0",inputMode:"decimal"}),((Bn=O==null?void 0:O.weightAnomaly)==null?void 0:Bn.anomaly)&&t.jsxs("div",{style:{fontSize:"0.6rem",color:i.warning,marginTop:2,fontWeight:500},children:["Warning: ",O.weightAnomaly.warning]})]})})]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[t.jsx("div",{className:"field-card conf-med",children:t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{className:"field-label",children:"Amount (₹)"}),t.jsx("input",{className:"field-input",value:b.amount||"",onChange:e=>W(n=>({...n,amount:e.target.value})),placeholder:"0",inputMode:"decimal"})]})}),t.jsx("div",{className:"field-card conf-low",children:t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{className:"field-label",children:"Order No"}),t.jsx("input",{className:"field-input",value:b.orderNo||"",onChange:e=>W(n=>({...n,orderNo:e.target.value})),placeholder:"Optional"})]})})]})]}),t.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${i.border}`,display:"flex",gap:10},children:[t.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:ot,children:[t.jsx(Gr,{size:16})," Skip"]}),t.jsxs("button",{"data-testid":"approve-save-btn",className:"btn btn-success btn-lg",style:{flex:2},onClick:Er,disabled:N===a.APPROVING,children:[N===a.APPROVING?t.jsx(_t,{size:16,style:{animation:"spin 1s linear infinite"}}):t.jsx($n,{size:16}),N===a.APPROVING?"Saving...":"Approve & Save"]})]})]})}),t.jsx("div",{className:me(a.APPROVING)}),t.jsx("div",{className:me(a.SUCCESS),children:t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[t.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[t.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:i.success,strokeWidth:"3",className:"success-check-circle"}),t.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:i.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),t.jsxs("div",{style:{textAlign:"center"},children:[t.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:i.success,marginBottom:4},children:"Saved Successfully"}),t.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700},children:P==null?void 0:P.awb}),(P==null?void 0:P.clientCode)&&t.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:i.primaryLight,color:i.primary,fontSize:"0.78rem",fontWeight:600},children:P.clientName||P.clientCode})]}),t.jsx("div",{style:{fontSize:"0.72rem",color:i.muted},children:P!=null&&P.offlineQueued?`${R.length} queued for sync - Auto-continuing in ${hn}s`:`#${k.scanNumber} scanned - Auto-continuing in ${hn}s`}),t.jsxs("button",{"data-testid":"scan-next-btn",className:"btn btn-primary btn-lg btn-full",onClick:()=>ot(j==="fast"?a.SCANNING:a.IDLE),style:{maxWidth:320},children:[t.jsx(Ut,{size:18})," ",j==="fast"?"Keep Scanning":"Scan Next Parcel"]})]})}),t.jsx("div",{className:me(a.ERROR),children:t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[t.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:t.jsx(On,{size:32,color:i.error})}),t.jsxs("div",{style:{textAlign:"center"},children:[t.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:i.error},children:"Scan Error"}),t.jsx("div",{style:{fontSize:"0.82rem",color:i.muted,marginTop:4},children:se})]}),t.jsxs("button",{className:"btn btn-primary",onClick:ot,children:[t.jsx(Gn,{size:16})," Try Again"]})]})}),y==="disconnected"&&N!==a.IDLE&&t.jsxs("div",{className:"offline-banner",children:[t.jsx(Dn,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline â€” Reconnecting... ",R.length?`(${R.length} queued)`:""]})]}),t.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{bs as default};
