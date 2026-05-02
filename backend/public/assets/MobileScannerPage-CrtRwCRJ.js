import{a0 as Dr,u as Pr,r,j as t,v as Dn,e as Nt,bs as Pn,H as qr,bc as qn,aq as Ut,bd as Gt,Z as Ln,aL as Vt,as as Wn,bt as Lr,aj as _n,C as $n,bj as Wr,P as Ht,w as Un,b6 as Gn,bu as _r,bv as $r,p as Ur,d as Vn,G as Gr,X as Vr}from"./vendor-react-DHsZcx6l.js";import{a as xe,l as Hr}from"./index-BslHjw_C.js";import{c as Qr,n as Yr}from"./barcodeEngine-BkQa_FuK.js";function ir(d,l){var w,p;try{if(!d||!l)return null;const T=Number(d.videoWidth||0),z=Number(d.videoHeight||0);if(!T||!z)return null;const U=(w=d.getBoundingClientRect)==null?void 0:w.call(d),D=(p=l.getBoundingClientRect)==null?void 0:p.call(l);if(!U||!D)return null;const P=Number(U.width||0),C=Number(U.height||0);if(!P||!C)return null;const h=Math.max(P/T,C/z),re=T*h,y=z*h,M=(P-re)/2,se=(C-y)/2,m=D.left-U.left,k=D.top-U.top,Le=D.right-U.left,R=D.bottom-U.top,ie=(m-M)/h,H=(k-se)/h,oe=(Le-M)/h,ue=(R-se)/h,o=(J,We,Fe)=>Math.max(We,Math.min(Fe,J)),be=o(Math.min(ie,oe),0,T),b=o(Math.min(H,ue),0,z),W=o(Math.max(ie,oe),0,T),q=o(Math.max(H,ue),0,z),L=Math.max(0,W-be),ye=Math.max(0,q-b);return!L||!ye?null:{x:be,y:b,w:L,h:ye}}catch{return null}}function Hn(d=[]){if(!d.length)return"";const l=[];return d.includes("blur")&&l.push("hold steady"),d.includes("glare")&&l.push("reduce glare"),d.includes("angle")&&l.push("straighten angle"),d.includes("dark")&&l.push("add light"),d.includes("low_edge")&&l.push("fill frame"),l.length?`Improve capture: ${l.join(", ")}.`:""}function Kr(d,l){if(!d||!l||!d.videoWidth||!d.videoHeight)return null;const w=ir(d,l);if(!w)return null;const p=Math.max(0,Math.floor(w.x)),T=Math.max(0,Math.floor(w.y)),z=Math.max(24,Math.floor(w.w)),U=Math.max(24,Math.floor(w.h)),D=128,P=96,C=document.createElement("canvas");C.width=D,C.height=P;const h=C.getContext("2d",{willReadFrequently:!0});if(!h)return null;h.drawImage(d,p,T,Math.min(z,d.videoWidth-p),Math.min(U,d.videoHeight-T),0,0,D,P);const re=h.getImageData(0,0,D,P).data,y=D*P,M=new Float32Array(y);let se=0,m=0,k=0;for(let V=0,Z=0;V<re.length;V+=4,Z+=1){const Q=.2126*re[V]+.7152*re[V+1]+.0722*re[V+2];M[Z]=Q,se+=Q,Q>=245&&(m+=1),Q<=24&&(k+=1)}let Le=0,R=0,ie=0,H=0,oe=0,ue=0;const o=Math.max(4,Math.floor(P*.15)),be=Math.max(4,Math.floor(D*.15)),b=D;for(let V=1;V<P-1;V+=1)for(let Z=1;Z<D-1;Z+=1){const Q=V*b+Z,B=M[Q],_e=M[Q-1],_=M[Q+1],$e=M[Q-b],Ue=M[Q+b],we=Math.abs(_-_e),Rt=Math.abs(Ue-$e),Re=we+Rt,At=Math.abs(4*B-_e-_-$e-Ue);Le+=At,Re>58&&(R+=1),V<=o&&(ie+=Re),V>=P-o&&(H+=Re),Z<=be&&(oe+=Re),Z>=D-be&&(ue+=Re)}const W=Math.max(1,(D-2)*(P-2)),q=se/y,L=Le/W,ye=R/W,J=m/y,We=k/y,Fe=Math.abs(ie-H)/Math.max(1,ie+H),A=Math.abs(oe-ue)/Math.max(1,oe+ue),tt=Math.max(Fe,A),ce=[];return L<22&&ce.push("blur"),J>.18&&ce.push("glare"),(We>.55||q<40)&&ce.push("dark"),ye<.08&&ce.push("low_edge"),tt>.62&&ce.push("angle"),{ok:ce.length===0,issues:ce,metrics:{brightness:Number(q.toFixed(1)),blurScore:Number(L.toFixed(1)),glareRatio:Number((J*100).toFixed(1)),edgeRatio:Number((ye*100).toFixed(1)),perspectiveSkew:Number((tt*100).toFixed(1))}}}function Ft(d,l){const w=Number(d);return Number.isFinite(w)&&w>0?w:l}function Xr({samples:d=[],awb:l,now:w=Date.now(),stabilityWindowMs:p=1100,requiredHits:T=3}){const z=Ft(p,1100),U=Math.max(1,Math.floor(Ft(T,3))),D=Ft(w,Date.now()),P=String(l||"").trim(),C=Array.isArray(d)?d.filter(y=>(y==null?void 0:y.awb)&&D-((y==null?void 0:y.at)||0)<=z):[];if(!P)return{samples:C,hits:0,isStable:!1};const h=[...C,{awb:P,at:D}],re=h.reduce((y,M)=>M.awb===P?y+1:y,0);return{samples:h,hits:re,isStable:re>=U}}function Jr({currentAttempts:d=0,maxReframeAttempts:l=2}){const w=Math.max(0,Math.floor(Ft(l,2))),p=Math.max(0,Math.floor(Number(d)||0))+1;return p<=w?{action:"reframe",attempts:p}:{action:"switch_to_document",attempts:w}}function Zr(){return window.location.origin}const es=Zr(),Qn={w:"90vw",h:"18vw"},kt={w:"92vw",h:"130vw"},Yn=3500,Kn=900,ts=1e4,ns=12e3,rs=15e3,ss="mobile_scanner_offline_queue",is="mobile_scanner_session_state",as="mobile_scanner_sticky_client",Xn="mobile_scanner_workflow_mode",Jn="mobile_scanner_device_profile",os=2e4,cs=500,ls=1,Zn=100,jt=2,Qt=2,ds=500,er=960,Pe=.68,us=900,ne={phone:"phone-camera",rugged:"rugged-scanner"},It=["Trackon","DTDC","Delhivery","BlueDart"],qe=/^\d{4}-\d{2}-\d{2}$/,Yt=d=>{const l=String(d||"").trim();if(!l)return"";const w=l.toUpperCase();return w.includes("TRACKON")||w.includes("PRIME")?"Trackon":w.includes("DTDC")?"DTDC":w.includes("DELHIVERY")?"Delhivery":w.includes("BLUE")?"BlueDart":l},Ee=d=>String(d||"").trim().toUpperCase(),tr=d=>{const l=String(d||"").trim();if(!qe.test(l))return l;try{return new Date(`${l}T00:00:00`).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}catch{return l}},Je=(d,l="")=>{const w=String(d||"").trim();if(qe.test(w))return w;const p=String(l||"").trim();return qe.test(p)?p:new Date().toISOString().slice(0,10)},a={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"};function F(d,l){l instanceof Error?l.message:String(l||"unknown error")}const ps=d=>{var l;try{(l=navigator==null?void 0:navigator.vibrate)==null||l.call(navigator,d)}catch(w){F("vibrate",w)}},nr={tap:[20],lock:[400,50,200,50,100],success:[18,28,72],warning:[70,50,70],retry:[28,40,28],error:[110,55,110],duplicate:[90,50,90,50,90],review:[200,40,120]},v=(d="tap")=>{ps(nr[d]||nr.tap)},et=(d,l,w="sine")=>{try{const p=new(window.AudioContext||window.webkitAudioContext),T=p.createOscillator(),z=p.createGain();T.type=w,T.frequency.setValueAtTime(d,p.currentTime),z.gain.setValueAtTime(.12,p.currentTime),z.gain.exponentialRampToValueAtTime(.01,p.currentTime+l),T.connect(z),z.connect(p.destination),T.start(),T.stop(p.currentTime+l)}catch(p){F("playTone",p)}},Ze=()=>{et(880,.12),setTimeout(()=>et(1100,.1),130)},Et=()=>{et(2700,.08,"square"),setTimeout(()=>et(3100,.05,"square"),60)},ms=()=>et(600,.08),X=()=>et(200,.25,"sawtooth"),Kt=d=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const l=new SpeechSynthesisUtterance(d);l.rate=1.2,l.pitch=1,l.lang="en-IN",window.speechSynthesis.speak(l)}catch(l){F("speak",l)}},rr=()=>{var d;try{if(typeof window>"u")return!1;if(window.isSecureContext)return!0;const l=((d=window.location)==null?void 0:d.hostname)||"";return l==="localhost"||l==="127.0.0.1"}catch{return!1}},i={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",mutedLight:"#9CA3AF",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},fs=`
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
`,ar=d=>d>=.85?"high":d>=.55?"med":"low",Xt=d=>`conf-dot conf-${ar(d)}`,sr=d=>d==="learned"?{className:"source-badge source-learned",icon:"AI",text:"Learned"}:d==="awb_master"?{className:"source-badge source-ai",icon:"DB",text:"Lookup"}:d==="courier_api"?{className:"source-badge source-history",icon:"API",text:"Courier"}:d==="fuzzy_match"?{className:"source-badge source-ai",icon:"🔍",text:"Matched"}:d==="fuzzy_history"||d==="consignee_pattern"?{className:"source-badge source-history",icon:"📊",text:"History"}:d==="delhivery_pincode"||d==="india_post"||d==="pincode_lookup"||d==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"📍",text:"Pincode"}:null,gs=d=>{const l=Math.floor(d/6e4);return l<60?`${l}m`:`${Math.floor(l/60)}h ${l%60}m`};function ws({standalone:d=!1}){var Sn,vn,vt,Nn,kn,jn,In,En,Fn,Rn,An,Tn,zn,Mn,Bn,On;const{pin:l}=Dr(),w=Pr(),p=!!d,T=`${ss}:${p?"direct":l||"unknown"}`,z=r.useMemo(()=>`${is}:${p?"direct":l||"unknown"}`,[p,l]),U=r.useMemo(()=>`${as}:${p?"direct":l||"unknown"}`,[p,l]),D=r.useMemo(()=>`mobile_scanner_daily_count:${new Date().toISOString().slice(0,10)}`,[]),P=r.useMemo(()=>{try{return typeof window>"u"?"":new URLSearchParams(window.location.search).get("mockBarcodeRaw")||""}catch{return""}},[]),C=r.useMemo(()=>{try{if(typeof window>"u")return!1;const e=new URLSearchParams(window.location.search);return e.get("mock")==="1"||e.get("e2e")==="1"}catch{return!1}},[]),[h,re]=r.useState(null),[y,M]=r.useState("connecting"),[se,m]=r.useState(""),[k,Le]=r.useState(a.IDLE),[R,ie]=r.useState(""),[H,oe]=r.useState(null),[,ue]=r.useState({}),[o,be]=r.useState(null),[b,W]=r.useState({}),[q,L]=r.useState(null),[ye,J]=r.useState(null),[We,Fe]=r.useState(""),[A,tt]=r.useState([]),[ce,V]=r.useState(!1),[Z,Q]=r.useState(0),[B,_e]=r.useState({ok:!1,issues:[],metrics:null}),[_,$e]=r.useState({kb:0,width:0,height:0,quality:Pe}),[Ue,we]=r.useState(!1),[Rt,Re]=r.useState("0m"),[At,Tt]=r.useState("Connected"),[nt,Jt]=r.useState(""),[zt,or]=r.useState(!1),[Zt,Mt]=r.useState("idle"),[pe,cr]=r.useState(null),[lr,dr]=r.useState(0),[Bt,ur]=r.useState(0),[en,Ot]=r.useState(null),[Ae,Dt]=r.useState("barcode"),[j,Pt]=r.useState(()=>{if(typeof window>"u")return"fast";try{const e=localStorage.getItem(Xn);if(e==="fast"||e==="ocr")return e}catch(e){F("read workflow mode",e)}return C?"ocr":"fast"}),[Y,tn]=r.useState(()=>{if(typeof window>"u")return ne.phone;try{const e=localStorage.getItem(Jn);if(e===ne.phone||e===ne.rugged)return e}catch(e){F("read device profile",e)}return ne.phone}),qt=r.useRef(0),[N,Ge]=r.useState(()=>{const e={scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now(),scannedItems:[]};if(typeof window>"u")return e;try{const n=localStorage.getItem(z);if(!n)return e;const s=JSON.parse(n);if(!s||typeof s!="object")return e;const c=new Set(Array.isArray(s.scannedAwbs)?s.scannedAwbs.map(g=>Ee(g)).filter(Boolean):[]);return{...e,clientFreq:s.clientFreq&&typeof s.clientFreq=="object"?s.clientFreq:{},scanNumber:Number.isFinite(Number(s.scanNumber))?Number(s.scanNumber):0,dominantClient:Ee(s.dominantClient||"")||null,dominantClientCount:Number.isFinite(Number(s.dominantClientCount))?Number(s.dominantClientCount):0,startedAt:Number.isFinite(Number(s.startedAt))?Number(s.startedAt):e.startedAt,scannedItems:Array.isArray(s.scannedItems)?s.scannedItems:[],scannedAwbs:c}}catch(n){return F("hydrate session state",n),e}}),[me,lt]=r.useState(()=>{if(typeof window>"u")return"";try{return Ee(localStorage.getItem(U)||"")}catch(e){return F("read sticky client",e),""}}),[Ve,pr]=r.useState(!1),[mr,dt]=r.useState(""),[ut,pt]=r.useState(""),[Te,mt]=r.useState(""),[I,fr]=r.useState(()=>{try{const e=localStorage.getItem("seahawk_scanner_session_date");if(e&&qe.test(e))return e}catch(e){F("read session date",e)}return new Date().toISOString().slice(0,10)}),ee=r.useRef(null),ft=r.useRef(null),Ce=r.useRef(null),Se=r.useRef(null),ve=r.useRef(!1),gt=r.useRef(null),gr=r.useRef(!1),le=r.useRef(a.IDLE),Lt=r.useRef(null),de=r.useRef(null),rt=r.useRef(0),ze=r.useRef(null),ht=r.useRef(new Set),st=r.useRef([]),xt=r.useRef({awb:"",hits:0,lastSeenAt:0}),nn=r.useRef(0),it=r.useRef(!1),rn=r.useRef(0),Me=r.useRef(null),hr=r.useRef(null),Wt=r.useRef({message:"",at:0}),fe=r.useRef({lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]}),Ne=r.useRef(null),sn=r.useRef(null),an=r.useRef({}),bt=r.useRef(null),yt=r.useRef(null),wt=r.useRef(null),u=r.useCallback(e=>{Le(e)},[]),K=r.useCallback(e=>{qt.current=e,dr(e)},[]),ae=r.useCallback(e=>{nn.current=e,ur(e)},[]),_t=r.useCallback((e,n="warning")=>{if(!e)return;const s=Date.now();Wt.current.message===e&&s-Wt.current.at<us||(Wt.current={message:e,at:s},m(e),n&&v(n))},[]),on=r.useCallback(e=>{K(0),ae(0),Dt("document"),m(e||'No barcode lock yet. Capture label instead or tap "Back to barcode mode" and hold steady.'),v("warning")},[K,ae]),Ct=r.useCallback(()=>{const e=Jr({currentAttempts:nn.current,maxReframeAttempts:jt});if(e.action==="reframe"){ae(e.attempts),K(0),m(`No lock yet. Reframe ${e.attempts}/${jt}: move closer, reduce glare, keep barcode horizontal.`),v("retry");return}on("No stable barcode lock after reframe retries. Capture label for OCR fallback.")},[on,K,ae]),xr=r.useCallback(()=>{ie(""),m(""),u(a.CAPTURING)},[u]),cn=r.useCallback(e=>{const n=Date.now(),s=Xr({samples:st.current,awb:e,now:n,stabilityWindowMs:cs,requiredHits:ls});return st.current=s.samples,xt.current={awb:e,hits:s.hits,lastSeenAt:n},s.isStable},[]),Be=r.useCallback(async()=>{var s;if(!rr())throw new Error("Camera requires HTTPS (or localhost). Open this page over https:// on your phone.");if(!((s=navigator==null?void 0:navigator.mediaDevices)!=null&&s.getUserMedia))throw new Error("Camera not supported on this browser/device.");if(!ee.current)throw new Error("Camera element not ready.");const e=ee.current.srcObject;if(e&&typeof e.getTracks=="function"&&e.getTracks().some(g=>g.readyState==="live")){await ee.current.play();return}let n=null;try{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}ee.current.srcObject=n,await ee.current.play()},[]);r.useEffect(()=>{const e=setInterval(()=>Re(gs(Date.now()-N.startedAt)),3e4);return()=>clearInterval(e)},[N.startedAt]),r.useEffect(()=>{ht.current=N.scannedAwbs instanceof Set?N.scannedAwbs:new Set},[N.scannedAwbs]),r.useEffect(()=>{try{localStorage.setItem(z,JSON.stringify({scanNumber:Number(N.scanNumber||0),clientFreq:N.clientFreq||{},dominantClient:N.dominantClient||null,dominantClientCount:Number(N.dominantClientCount||0),startedAt:Number(N.startedAt||Date.now()),scannedItems:Array.isArray(N.scannedItems)?N.scannedItems:[],scannedAwbs:Array.from(N.scannedAwbs||[])}))}catch(e){F("persist session state",e)}},[N,z]),r.useEffect(()=>{try{me?localStorage.setItem(U,me):localStorage.removeItem(U)}catch(e){F("persist sticky client",e)}},[me,U]);const at=r.useCallback(e=>{tt(e);try{e.length?localStorage.setItem(T,JSON.stringify(e)):localStorage.removeItem(T)}catch(n){F("persist offline queue",n)}},[T]),He=r.useCallback(e=>{const n={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:e};return at([...A,n]),n},[A,at]),ln=r.useCallback(async e=>{if(String((e==null?void 0:e.scanMode)||"").toLowerCase()==="fast_barcode_only"){await xe.post("/shipments/scan",{awb:e.awb,courier:"AUTO",captureOnly:!0,sessionContext:e.sessionContext||{}});return}await xe.post("/shipments/scan-mobile",{awb:e.awb,imageBase64:e.imageBase64,focusImageBase64:e.focusImageBase64||e.imageBase64,sessionContext:e.sessionContext||{}})},[]),ot=r.useCallback(async()=>{var e;if(A.length){if(p){if(!navigator.onLine)return;const n=[];for(const s of A)if((e=s==null?void 0:s.payload)!=null&&e.awb)try{await ln(s.payload)}catch{n.push(s)}at(n),n.length?m(`Uploaded partially. ${n.length} scan(s) still queued.`):m("");return}!h||!h.connected||(A.forEach(n=>{var s;(s=n==null?void 0:n.payload)!=null&&s.awb&&h.emit("scanner:scan",n.payload)}),at([]))}},[p,h,A,at,ln]),G=r.useCallback(e=>{Ge(n=>{const s={...e,awb:String((e==null?void 0:e.awb)||"").trim().toUpperCase(),queueId:(e==null?void 0:e.queueId)||`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,date:Je(e==null?void 0:e.date,I),time:(e==null?void 0:e.time)||Date.now()},c={...n,scannedItems:[s,...n.scannedItems]};try{localStorage.setItem(D,String(c.scanNumber))}catch(g){F("persist daily count",g)}return c})},[D,I]),dn=r.useCallback((e,n="")=>{e&&(Ge(s=>{const c=s.scannedItems.filter(S=>S.queueId!==e),g=new Set(s.scannedAwbs),x=String(n||"").trim().toUpperCase();return x&&g.delete(x),ht.current=g,{...s,scannedItems:c,scannedAwbs:g}}),dt(s=>s===e?"":s))},[]),br=r.useCallback(e=>{e!=null&&e.queueId&&(dt(e.queueId),pt(Je(e.date,I)))},[I]),yr=r.useCallback(()=>{dt(""),pt("")},[]),wr=r.useCallback(async e=>{if(!(e!=null&&e.queueId))return;const n=String(ut||"").trim();if(!qe.test(n)){window.alert("Please select a valid date.");return}mt(e.queueId);try{e.shipmentId&&await xe.put(`/shipments/${e.shipmentId}`,{date:n}),Ge(s=>({...s,scannedItems:s.scannedItems.map(c=>c.queueId===e.queueId?{...c,date:n}:c)})),dt(""),pt("")}catch(s){window.alert((s==null?void 0:s.message)||"Could not update consignment date.")}finally{mt("")}},[ut]),Cr=r.useCallback(async e=>{if(!(e!=null&&e.queueId))return;const n=String(e.awb||"").trim()||"this consignment",s=e.shipmentId?`Delete ${n}? This will remove it from accepted consignments and from the server.`:`Remove ${n} from accepted consignments?`;if(window.confirm(s)){mt(e.queueId);try{e.shipmentId&&await xe.delete(`/shipments/${e.shipmentId}`),dn(e.queueId,e.awb)}catch(c){window.alert((c==null?void 0:c.message)||"Could not delete consignment.")}finally{mt("")}}},[dn]);r.useEffect(()=>{bt.current=G},[G]),r.useEffect(()=>{sn.current=o},[o]),r.useEffect(()=>{an.current=b},[b]);const Sr=r.useCallback(()=>{if(y!=="paired"){m(p?"Scanner is offline. Reconnect internet and retry.":"Phone is not connected to the desktop session.");return}if(m(""),C){u(a.SCANNING);return}Be().then(()=>u(a.SCANNING)).catch(e=>m((e==null?void 0:e.message)||"Camera access failed."))},[y,Be,u,C,p]),vr=r.useCallback(e=>{var s;e==null||e.preventDefault();const n=nt.trim().toUpperCase();if(!n||n.length<6){m("Enter a valid AWB number (min 6 chars)");return}if(y!=="paired"){m(p?"Scanner is offline. Reconnect internet and retry.":"Not connected to desktop session.");return}if(m(""),Jt(""),ie(n),C){we(!0),u(a.CAPTURING);return}if(j==="fast"){(s=Me.current)==null||s.call(Me,n);return}we(!0),u(a.CAPTURING)},[nt,y,u,C,p,j]),Nr=r.useCallback(()=>{if(window.confirm(p?"Exit this scanner session on the phone?":"End this mobile scanner session on the phone?")){try{localStorage.removeItem(z)}catch(e){F("clear session state on terminate",e)}if(p){w("/app/scan");return}h!=null&&h.connected?h.emit("scanner:end-session",{reason:"Mobile ended the session"}):w("/")}},[h,w,p,z]),kr=r.useCallback(()=>{if(A.length>0){ot();return}window.alert(p?"No queued scans to upload.":"Everything is already synced.")},[A.length,ot,p]);r.useEffect(()=>{le.current=k},[k]);const ke=r.useCallback((e=null)=>{e&&be(e),ue({}),m(""),u(a.CAPTURING)},[u]),Qe=r.useCallback(e=>{if(!e)return;const n=Ee(e.clientCode||""),s=Ee(me||n);if(be(e),W({clientCode:s,consignee:e.consignee||"",destination:e.destination||"",pincode:e.pincode||"",weight:e.weight||0,amount:e.amount||0,orderNo:e.orderNo||"",courier:Yt(e.courier||""),date:e.date||I||new Date().toISOString().slice(0,10)}),ue({}),e.reviewRequired){v("review"),Et(),u(a.REVIEWING);return}Ze(),v("success"),Ve&&Kt(`Auto approved. ${e.clientName||""}. ${e.destination||""}.`);const c={awb:e.awb,clientCode:s||e.clientCode,clientName:e.clientName,destination:e.destination||"",weight:e.weight||0,autoApproved:!0,shipmentId:e.shipmentId||null,date:Je(e.date,I)};L(c),G(c),u(a.SUCCESS)},[G,u,Ve,I,me]);r.useEffect(()=>{yt.current=ke},[ke]),r.useEffect(()=>{wt.current=Qe},[Qe]),r.useEffect(()=>{if(C){M("paired"),Tt("Mock Mode"),m(""),u(a.IDLE);return}if(p){re(null),M("paired"),Tt("Direct Mode"),m(""),u(a.IDLE);return}if(!l){m("No PIN provided.");return}const e=Hr(es,{auth:{scannerPin:l},transports:["websocket","polling"],reconnection:!0,reconnectionDelay:1500,reconnectionAttempts:20});return e.on("connect",()=>M("connecting")),e.on("scanner:paired",({userEmail:n})=>{M("paired"),Tt(n?n.split("@")[0]:"Connected"),m("");const s=le.current;s===a.PROCESSING||s===a.REVIEWING||s===a.APPROVING||s===a.SUCCESS||u(a.IDLE)}),e.on("scanner:error",({message:n})=>{m(n),M("disconnected")}),e.on("scanner:session-ended",({reason:n})=>{M("disconnected"),m(n||"Session ended by desktop.");try{localStorage.removeItem(z)}catch(s){F("clear session state on end",s)}w("/")}),e.on("scanner:desktop-disconnected",({message:n})=>{M("paired"),m(n||"Desktop disconnected. Keep scanning; approvals will resume when desktop reconnects.")}),e.on("disconnect",()=>M("disconnected")),e.on("reconnect",()=>{const n=le.current;if(n===a.PROCESSING||n===a.REVIEWING||n===a.APPROVING||n===a.SUCCESS){M("paired");return}M("paired"),u(a.SCANNING)}),e.on("scanner:scan-processed",n=>{var c,g;const s=le.current;if(!(s!==a.PROCESSING&&s!==a.REVIEWING)){if(n.status==="error"){if(s!==a.PROCESSING)return;J("error"),X(),v("error"),u(a.ERROR),m(n.error||"Scan failed on desktop.");return}if(n.status==="photo_required"||n.requiresImageCapture){(c=yt.current)==null||c.call(yt,n);return}(g=wt.current)==null||g.call(wt,n)}}),e.on("scanner:approval-result",({success:n,message:s,awb:c,shipmentId:g})=>{var $;clearTimeout(de.current),de.current=null;const x=sn.current||{},S=an.current||{};if(n){Et(),v("success"),J("success");const f=Ee(S.clientCode||"");f&&lt(f==="MISC"?"":f),f&&f!=="MISC"&&Ge(E=>{var Ie,Xe;const je={...E.clientFreq};je[f]=(je[f]||0)+1;const De=Object.entries(je).sort((Br,Or)=>Or[1]-Br[1]);return{...E,clientFreq:je,dominantClient:((Ie=De[0])==null?void 0:Ie[1])>=2?De[0][0]:null,dominantClientCount:((Xe=De[0])==null?void 0:Xe[1])||0}});const te={awb:(x==null?void 0:x.awb)||c,clientCode:S.clientCode,clientName:(x==null?void 0:x.clientName)||S.clientCode,destination:S.destination||"",weight:parseFloat(S.weight)||0,shipmentId:g||(x==null?void 0:x.shipmentId)||null,date:Je(S.date||(x==null?void 0:x.date),"")};L(te),($=bt.current)==null||$.call(bt,te),u(a.SUCCESS);return}le.current===a.APPROVING&&(X(),v("error"),m(s||"Approval failed. Please review and try again."),u(a.REVIEWING))}),e.on("scanner:ready-for-next",()=>{}),re(e),()=>{e.disconnect()}},[l,u,w,C,p,z]),r.useEffect(()=>{if(C||p||!h||y!=="paired"||!h.connected)return;const e=()=>{h.emit("scanner:heartbeat",{},()=>{})};e();const n=setInterval(e,os);return()=>clearInterval(n)},[h,y,C,p]),r.useEffect(()=>{try{const e=localStorage.getItem(T);if(!e)return;const n=JSON.parse(e);Array.isArray(n)&&n.length&&tt(n)}catch(e){F("hydrate offline queue",e)}},[T]),r.useEffect(()=>{try{localStorage.setItem(Xn,j)}catch(e){F("persist workflow mode",e)}},[j]),r.useEffect(()=>{try{localStorage.setItem(Jn,Y)}catch(e){F("persist device profile",e)}},[Y]),r.useEffect(()=>{if(A.length){if(p){y==="paired"&&navigator.onLine&&ot();return}y==="paired"&&(h!=null&&h.connected)&&ot()}},[y,h,A.length,ot,p]);const Ye=r.useCallback(async()=>{var e;try{if(we(!1),Ne.current&&Ne.current.stop(),Se.current){try{const n=Se.current;n!=null&&n.barcodeScanner&&await n.barcodeScanner.dispose()}catch(n){F("dispose scanbot camera scanner",n)}Se.current=null}if(Ce.current){try{await Ce.current.reset()}catch(n){F("reset camera scanner",n)}Ce.current=null}(e=ee.current)!=null&&e.srcObject&&(ee.current.srcObject.getTracks().forEach(n=>n.stop()),ee.current.srcObject=null)}catch(n){F("stopCamera",n)}},[]),Ke=r.useCallback(async()=>{try{if(Mt("idle"),Ne.current&&Ne.current.stop(),Se.current){try{await Se.current.barcodeScanner.dispose()}catch(e){F("dispose barcode scanner",e)}Se.current=null}if(Ce.current){try{Ce.current._type==="native"?Ce.current.reset():await Ce.current.reset()}catch(e){F("reset barcode scanner",e)}Ce.current=null}}catch(e){F("stopBarcodeScanner",e)}},[]),un=r.useCallback(async()=>{if(ee.current){await Ke();try{rt.current=Date.now(),await Be(),Ne.current||(Ne.current=Qr()),await Ne.current.start(ee.current,ft.current,{onDetected:(e,n)=>{var g;if(ve.current)return;K(0);const s=(n==null?void 0:n.format)||"unknown",c=(n==null?void 0:n.engine)||"unknown";cr({value:e,format:s,engine:c,at:Date.now(),sinceStartMs:rt.current?Date.now()-rt.current:null,candidateCount:(n==null?void 0:n.candidateCount)||1,ambiguous:!1,alternatives:(n==null?void 0:n.alternatives)||[]}),Mt(c),(g=ze.current)==null||g.call(ze,e,{candidateCount:(n==null?void 0:n.candidateCount)||1,ambiguous:!1,alternatives:(n==null?void 0:n.alternatives)||[],format:s,engine:c})},onFail:()=>{const e=qt.current+1;K(e),e>=Zn&&Ct()},onEngineReady:e=>{console.log(`[MobileScanner] Barcode engine ready: ${e}`),Mt(e)}})}catch(e){m("Camera access failed: "+e.message)}}},[Be,Ke,Ct,K]),pn=r.useCallback((e,n={})=>{var x;const s=String(e||"").trim().replace(/\s+/g,"").toUpperCase(),c=Yr(e)||s;if(ve.current||le.current!==a.SCANNING)return;if(!c||c.length<8){s.replace(/[^A-Z0-9]/g,"").length>=4&&_t("Partial barcode detected. Move closer so full AWB is visible.");return}if(n!=null&&n.ambiguous){const S=qt.current+1;K(S),_t("Multiple barcodes detected. Keep only the AWB barcode inside the strip.","retry"),S>=Zn&&Ct();return}if(!C&&!cn(c))return;if(ve.current=!0,ht.current.has(c)){v("duplicate"),X(),Fe(c),setTimeout(()=>{Fe(""),ve.current=!1,xt.current={awb:"",hits:0,lastSeenAt:0},st.current=[]},2500);return}clearTimeout(Lt.current),v("lock"),Et(),ie(c);const g=rt.current?Date.now()-rt.current:null;if(Ot(g),fe.current={lockTimeMs:g,candidateCount:Number((n==null?void 0:n.candidateCount)||1),ambiguous:!!(n!=null&&n.ambiguous),alternatives:Array.isArray(n==null?void 0:n.alternatives)?n.alternatives.slice(0,3):[]},ae(0),K(0),m(""),Ge(S=>{const $={...S,scanNumber:S.scanNumber+1};return $.scannedAwbs=new Set(S.scannedAwbs),$.scannedAwbs.add(c),ht.current=$.scannedAwbs,$}),j==="fast"){(x=Me.current)==null||x.call(Me,c);return}we(!0),u(a.CAPTURING)},[u,cn,j,C,K,ae,_t,Ct]);r.useEffect(()=>{ze.current=pn},[pn]),r.useEffect(()=>{if(k===a.SCANNING&&(ve.current=!1,xt.current={awb:"",hits:0,lastSeenAt:0},st.current=[],fe.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},Ot(null),ae(0),K(0),Dt("barcode"),un(),C&&P)){const e=setTimeout(()=>{var n;le.current===a.SCANNING&&((n=ze.current)==null||n.call(ze,P))},50);return()=>clearTimeout(e)}return()=>{k===a.SCANNING&&Ke()}},[k,un,Ke,K,ae,C,P]);const mn=r.useCallback(async()=>{if(C){we(!0);return}await Ke();try{await Be(),we(!0)}catch(e){m("Camera access failed: "+e.message)}},[Be,Ke,C]);r.useEffect(()=>{k===a.CAPTURING&&mn()},[k,mn]);const St=r.useCallback(()=>{const e=ee.current,n=ft.current;return Kr(e,n)},[]);r.useEffect(()=>{if(k!==a.CAPTURING){V(!1),Q(0),_e({ok:!1,issues:[],metrics:null}),gr.current=!1,it.current=!1;return}const e=setInterval(()=>{const n=St();n&&(_e(n),V(n.ok),Q(s=>{const c=n.ok?Math.min(s+1,8):0;return c>=Qt&&!it.current&&(v("tap"),it.current=!0),n.ok||(it.current=!1),c}))},280);return()=>clearInterval(e)},[k,St]);const fn=r.useCallback((e={})=>{const n=ee.current,s=ft.current;if(!n||!s||!n.videoWidth)return null;const c=ir(n,s);if(!c)return null;const g=c.x,x=c.y,S=c.w,$=c.h;if(!S||!$)return null;const f=Math.max(640,Number(e.maxWidth||er)),te=Math.min(.85,Math.max(.55,Number(e.quality||Pe))),E=document.createElement("canvas");E.width=Math.min(f,Math.round(S)),E.height=Math.round(E.width/S*$),E.getContext("2d").drawImage(n,g,x,S,$,0,0,E.width,E.height);const Ie=E.toDataURL("image/jpeg",te).split(",")[1]||"";if(!Ie)return null;const Xe=Math.floor(Ie.length*3/4);return{base64:Ie,width:E.width,height:E.height,approxBytes:Xe,quality:te}},[]),jr=r.useCallback(()=>{const e=Date.now();if(e-rn.current<ds)return;rn.current=e;const n=St()||B;if(!(n!=null&&n.ok)||Z<Qt){m(Hn(n==null?void 0:n.issues)||"Capture quality is low. Hold steady and align the AWB in the frame."),v("warning"),X();return}J("white"),ms(),v("tap");const s=fn({maxWidth:er,quality:Pe});if(!(s!=null&&s.base64)){m("Could not capture image. Try again."),ve.current=!1;return}$e({kb:Math.round((s.approxBytes||0)/1024),width:s.width||0,height:s.height||0,quality:s.quality||Pe}),oe(`data:image/jpeg;base64,${s.base64}`),Ye(),u(a.PREVIEW)},[fn,Ye,u,St,B,Z]),Ir=r.useCallback(()=>{if(!C)return;const e="data:image/jpeg;base64,ZmFrZS1tb2NrLWltYWdl";$e({kb:0,width:0,height:0,quality:Pe}),oe(e),Ye(),u(a.PREVIEW)},[u,C,Ye]),Oe=r.useCallback(()=>{var e,n,s;return{scanNumber:N.scanNumber,recentClient:N.dominantClient,dominantClient:N.dominantClient,dominantClientCount:N.dominantClientCount,stickyClientCode:me||void 0,sessionDurationMin:Math.round((Date.now()-N.startedAt)/6e4),sessionDate:I,scanWorkflowMode:j,scanMode:Ae,deviceProfile:Y,hardwareClass:Y===ne.rugged?"rugged":"phone",captureQuality:{ok:!!B.ok,issues:Array.isArray(B.issues)?B.issues.slice(0,8):[],metrics:B.metrics||null},captureMeta:{kb:_.kb||0,width:_.width||0,height:_.height||0,quality:_.quality||Pe},lockTimeMs:Number.isFinite(Number((e=fe.current)==null?void 0:e.lockTimeMs))?Number(fe.current.lockTimeMs):null,lockCandidateCount:Number.isFinite(Number((n=fe.current)==null?void 0:n.candidateCount))?Number(fe.current.candidateCount):1,lockAlternatives:Array.isArray((s=fe.current)==null?void 0:s.alternatives)?fe.current.alternatives.slice(0,3):[]}},[N,I,j,Ae,Y,B,_,me]),gn=r.useCallback(async e=>{var c,g;const n=String(e||"").trim().toUpperCase();if(!n)return;if(u(a.PROCESSING),C){setTimeout(()=>{const x={awb:n,clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25,date:I};L(x),G(x),u(a.SUCCESS)},120);return}const s={awb:n,imageBase64:null,focusImageBase64:null,scanMode:"fast_barcode_only",sessionContext:Oe()};if(p){if(!navigator.onLine){He(s),Ze(),v("success");const x={awb:n,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0,date:I};L({...x,offlineQueued:!0}),G(x),u(a.SUCCESS);return}try{const x=await xe.post("/shipments/scan",{awb:n,courier:"AUTO",captureOnly:!0,sessionContext:Oe()}),S=((c=x==null?void 0:x.data)==null?void 0:c.shipment)||{},$={awb:S.awb||n,clientCode:S.clientCode||"MISC",clientName:((g=S.client)==null?void 0:g.company)||S.clientCode||"Scanned",destination:S.destination||"",weight:S.weight||0,shipmentId:S.id||null,date:Je(S.date,I)};L($),G($),Ze(),v("success"),u(a.SUCCESS)}catch(x){m((x==null?void 0:x.message)||"Barcode processing failed. Please try again."),X(),v("error"),u(a.ERROR)}return}if(!h||!h.connected||y!=="paired"){He(s),Ze(),v("success");const x={awb:n,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0,date:I};L({...x,offlineQueued:!0}),G(x),u(a.SUCCESS);return}h.emit("scanner:scan",s),setTimeout(()=>{le.current===a.PROCESSING&&(m("Barcode processing timed out. Please try scanning again."),X(),v("error"),u(a.ERROR))},ts)},[h,y,u,C,He,G,Oe,p,I]);r.useEffect(()=>{Me.current=gn},[gn]);const hn=r.useCallback(async e=>{const n=String(e||"").trim().toUpperCase();if(!n)return;if(u(a.PROCESSING),C){u(a.CAPTURING);return}const s={awb:n,scanMode:"lookup_first",sessionContext:Oe()};if(p){if(!navigator.onLine){ke({awb:n,status:"photo_required",requiresImageCapture:!0});return}try{const c=await xe.post("/shipments/scan-mobile",s),g=(c==null?void 0:c.data)||c;if(g.status==="error"||!g.success){J("error"),X(),v("error"),u(a.ERROR),m(g.error||g.message||"Lookup failed.");return}if(g.status==="photo_required"||g.requiresImageCapture){ke(g);return}Qe(g)}catch(c){m((c==null?void 0:c.message)||"Lookup failed. Please try again."),X(),v("error"),u(a.ERROR)}return}if(!h||!h.connected||y!=="paired"){ke({awb:n,status:"photo_required",requiresImageCapture:!0});return}h.emit("scanner:scan",s),setTimeout(()=>{le.current===a.PROCESSING&&(m("Lookup timed out. Capture the label photo and continue."),u(a.CAPTURING))},ns)},[h,y,u,C,Oe,p,ke,Qe]);r.useEffect(()=>{hr.current=hn},[hn]);const Er=r.useCallback(async()=>{if(!H)return;if(u(a.PROCESSING),C){setTimeout(()=>{const s={awb:R||"100454974120",clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25,date:I};L(s),G(s),u(a.SUCCESS)},250);return}const e=H.split(",")[1]||H,n={awb:R||"",imageBase64:e,focusImageBase64:e,scanMode:"ocr_label",sessionContext:Oe()};if(p){if(!navigator.onLine){He(n),Ze(),v("success");const s={awb:R||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0,date:I};L({...s,offlineQueued:!0}),G(s),u(a.SUCCESS);return}try{const s=await xe.post("/shipments/scan-mobile",n),c=(s==null?void 0:s.data)||s;if(c.status==="error"||!c.success){J("error"),X(),v("error"),u(a.ERROR),m(c.error||c.message||"Scan failed.");return}if(c.status==="photo_required"||c.requiresImageCapture){ke(c);return}Qe(c)}catch(s){m((s==null?void 0:s.message)||"Server error. Please try again."),X(),v("error"),u(a.ERROR)}return}if(!h||!h.connected||y!=="paired"){He(n),Ze(),v("success");const s={awb:R||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0,date:I};L({...s,offlineQueued:!0}),G(s),u(a.SUCCESS);return}h.emit("scanner:scan",n),setTimeout(()=>{le.current===a.PROCESSING&&(m("OCR timed out after 40 seconds. Retake the label photo and try again."),X(),v("error"),u(a.ERROR))},4e4)},[h,R,H,u,y,He,G,C,Oe,p,Qe,ke,I]),Fr=r.useCallback(async()=>{var S,$;if(!o)return;u(a.APPROVING);let e=!1;const n=b.date||I||new Date().toISOString().slice(0,10);if(C){setTimeout(()=>{const f={awb:o.awb||R,clientCode:b.clientCode||"MOCKCL",clientName:o.clientName||b.clientCode||"Mock Client",destination:b.destination||"",weight:parseFloat(b.weight)||0,shipmentId:o.shipmentId||null,date:n};L(f),G(f),J("success"),e=!0,u(a.SUCCESS)},200);return}const s={clientCode:o.clientCode||"",clientName:o.clientName||"",consignee:o.consignee||"",destination:o.destination||""},c={clientCode:b.clientCode||"",clientName:b.clientCode||"",consignee:b.consignee||"",destination:b.destination||""},g={clientCode:b.clientCode,consignee:b.consignee,destination:b.destination,pincode:b.pincode,weight:parseFloat(b.weight)||0,amount:parseFloat(b.amount)||0,orderNo:b.orderNo||"",courier:b.courier||"",date:n};if(p)try{(o.ocrExtracted||o)&&await xe.post("/shipments/learn-corrections",{ocrFields:s,approvedFields:c});let f=null;if(o.shipmentId){const E=await xe.put(`/shipments/${o.shipmentId}`,g);f=(E==null?void 0:E.data)||null}else{const E=await xe.post("/shipments",{awb:o.awb||R,...g});f=(E==null?void 0:E.data)||null}Et(),v("success"),J("success");const te={awb:(f==null?void 0:f.awb)||(o==null?void 0:o.awb)||R,clientCode:(f==null?void 0:f.clientCode)||b.clientCode,clientName:(o==null?void 0:o.clientName)||((S=f==null?void 0:f.client)==null?void 0:S.company)||b.clientCode,destination:(f==null?void 0:f.destination)||b.destination||"",weight:parseFloat((f==null?void 0:f.weight)??b.weight)||0,shipmentId:(f==null?void 0:f.id)||(o==null?void 0:o.shipmentId)||null,date:Je(f==null?void 0:f.date,n)};L(te),G(te),e=!0,u(a.SUCCESS)}catch(f){u(a.REVIEWING),X(),v("error"),m((f==null?void 0:f.message)||"Approval failed.")}else{if(!h){u(a.REVIEWING),m("Not connected to desktop session.");return}(o.ocrExtracted||o)&&h.emit("scanner:learn-corrections",{pin:l,ocrFields:s,approvedFields:c,courier:(o==null?void 0:o.courier)||(($=o==null?void 0:o.ocrExtracted)==null?void 0:$.courier)||"",deviceProfile:Y}),h.emit("scanner:approval-submit",{shipmentId:o.shipmentId,awb:o.awb||R,fields:g},f=>{f!=null&&f.success||(clearTimeout(de.current),de.current=null,u(a.REVIEWING),X(),v("error"),m((f==null?void 0:f.message)||"Approval failed."))}),clearTimeout(de.current),de.current=setTimeout(()=>{le.current===a.APPROVING&&(X(),v("error"),m("Save confirmation timed out. Please tap Approve & Save again."),u(a.REVIEWING))},rs)}const x=Ee(b.clientCode||"");e&&x&&lt(x==="MISC"?"":x),e&&x&&x!=="MISC"&&Ge(f=>{var je,De;const te={...f.clientFreq};te[x]=(te[x]||0)+1;const E=Object.entries(te).sort((Ie,Xe)=>Xe[1]-Ie[1]);return{...f,clientFreq:te,dominantClient:((je=E[0])==null?void 0:je[1])>=2?E[0][0]:null,dominantClientCount:((De=E[0])==null?void 0:De[1])||0}})},[h,o,b,R,l,u,G,C,Y,p,I]),ct=r.useCallback((e=a.IDLE)=>{clearTimeout(gt.current),clearTimeout(Lt.current),clearTimeout(de.current),de.current=null,ie(""),oe(null),$e({kb:0,width:0,height:0,quality:Pe}),be(null),W({}),ue({}),L(null),Ot(null),m(""),Fe(""),V(!1),Q(0),_e({ok:!1,issues:[],metrics:null}),ve.current=!1,xt.current={awb:"",hits:0,lastSeenAt:0},st.current=[],fe.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},it.current=!1,ae(0),u(e)},[u,ae]);r.useEffect(()=>{if(k===a.SUCCESS){const e=j==="fast"?a.SCANNING:a.IDLE,n=j==="fast"?Kn:Yn;return gt.current=setTimeout(()=>ct(e),n),()=>clearTimeout(gt.current)}},[k,ct,j]),r.useEffect(()=>{if(Ve)if(k===a.REVIEWING&&o){const e=[o.clientName||o.clientCode,o.destination,o.weight?`${o.weight} kilograms`:""].filter(Boolean);e.length&&Kt(e.join(". "))}else k===a.SUCCESS&&q&&Kt(`${q.clientName||q.clientCode||"Shipment"} Verified.`)},[Ve,k,o,q]),r.useEffect(()=>()=>{Ye(),clearTimeout(gt.current),clearTimeout(Lt.current),clearTimeout(de.current)},[Ye]);const ge=e=>`msp-step ${k===e?"active":""}`,xn=Math.max(1,Math.round((j==="fast"?Kn:Yn)/1e3)),Rr=B.ok?"AWB quality looks good - press shutter":Hn(B.issues)||"Fit AWB slip fully in frame and hold steady",bn=Ue&&B.ok&&Z>=Qt,he=r.useMemo(()=>{if(!o)return{};const e=o.ocrExtracted||o;return{clientCode:{confidence:(e==null?void 0:e.clientNameConfidence)||0,source:(e==null?void 0:e.clientNameSource)||null},consignee:{confidence:(e==null?void 0:e.consigneeConfidence)||0,source:(e==null?void 0:e.consigneeSource)||null},destination:{confidence:(e==null?void 0:e.destinationConfidence)||0,source:(e==null?void 0:e.destinationSource)||null},pincode:{confidence:(e==null?void 0:e.pincodeConfidence)||0,source:(e==null?void 0:e.pincodeSource)||null},weight:{confidence:(e==null?void 0:e.weightConfidence)||0,source:(e==null?void 0:e.weightSource)||null}}},[o]),Ar=r.useCallback(()=>{W(e=>{const n=Yt(e.courier||(o==null?void 0:o.courier)||""),s=It.findIndex(g=>g.toUpperCase()===n.toUpperCase()),c=It[(s+1+It.length)%It.length];return{...e,courier:c}})},[o]),$t=r.useMemo(()=>{const e=Object.values(he).map(g=>Number((g==null?void 0:g.confidence)||0)).filter(g=>g>0),n=e.length?e.reduce((g,x)=>g+x,0)/e.length:0,s=ar(n);return{score:n,level:s,label:s==="high"?"High Confidence":s==="med"?"Medium Confidence":"Low Confidence"}},[he]),Tr=Yt(b.courier||(o==null?void 0:o.courier)||((Sn=o==null?void 0:o.ocrExtracted)==null?void 0:Sn.courier)||""),yn=b.date||(o==null?void 0:o.date)||I||"",zr=r.useMemo(()=>tr(yn),[yn]),wn=N.scannedItems.reduce((e,n)=>e+(n.weight||0),0),O=((vn=o==null?void 0:o.ocrExtracted)==null?void 0:vn.intelligence)||(o==null?void 0:o.intelligence)||null,Cn=(kn=(Nn=(vt=Ne.current)==null?void 0:vt.getDiagnostics)==null?void 0:Nn.call(vt))==null?void 0:kn.wasmFailReason,Mr=[["Step",k],["Connection",y],["Engine",Zt],...Cn?[["WASM Error",Cn]]:[],["Workflow",j],["Device",Y],["Scan mode",Ae],["Fail count",String(lr)],["Reframe retries",`${Bt}/${jt}`],["Camera",Ue?"ready":"waiting"],["Doc detect",ce?`yes (${Z})`:"no"],["Capture quality",B.ok?"good":B.issues.join(", ")||"pending"],["Capture metrics",B.metrics?`blur ${B.metrics.blurScore} | glare ${B.metrics.glareRatio}% | skew ${B.metrics.perspectiveSkew}%`:"-"],["JPEG last shot",_.kb?`${_.kb}KB ${_.width}x${_.height} q=${_.quality}`:"-"],["Secure ctx",rr()?"yes":"no"],["AWB lock",R||"-"],["Lock ms",en!=null?String(en):"-"],["Lock candidates",String(((jn=fe.current)==null?void 0:jn.candidateCount)||1)],["Queued",String(A.length)],["Scans",String(N.scanNumber)],["Last format",(pe==null?void 0:pe.format)||"-"],["Last code",(pe==null?void 0:pe.value)||"-"],["Decode ms",(pe==null?void 0:pe.sinceStartMs)!=null?String(pe.sinceStartMs):"-"],["False-lock",(In=o==null?void 0:o.scanTelemetry)!=null&&In.falseLock?"yes":"no"]];return t.jsxs(t.Fragment,{children:[t.jsx("style",{children:fs}),t.jsxs("div",{className:"msp-root",children:[ye&&t.jsx("div",{className:`flash-overlay flash-${ye}`,onAnimationEnd:()=>J(null)}),We&&t.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[t.jsx(Dn,{size:48,color:"white"}),t.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),t.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:We}),t.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),t.jsx("button",{type:"button","data-testid":"scanner-diag-toggle",onClick:()=>or(e=>!e),style:{position:"fixed",top:12,right:12,zIndex:70,border:"1px solid rgba(255,255,255,0.18)",background:zt?"rgba(79,70,229,0.92)":"rgba(15,23,42,0.72)",color:"#fff",borderRadius:999,padding:"8px 12px",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.04em",backdropFilter:"blur(10px)",cursor:"pointer"},children:zt?"Hide Diag":"Show Diag"}),zt&&t.jsxs("div",{"data-testid":"scanner-diag-panel",style:{position:"fixed",top:56,right:12,zIndex:69,width:"min(92vw, 320px)",background:"rgba(15,23,42,0.88)",color:"#E5EEF8",border:"1px solid rgba(255,255,255,0.12)",borderRadius:18,padding:14,backdropFilter:"blur(14px)",boxShadow:"0 12px 30px rgba(0,0,0,0.25)"},children:[t.jsx("div",{style:{fontSize:"0.72rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10,color:"#A5B4FC"},children:"Scanner Diagnostics"}),t.jsx("div",{style:{display:"grid",gap:6},children:Mr.map(([e,n])=>t.jsxs("div",{style:{display:"flex",gap:8,justifyContent:"space-between",alignItems:"flex-start",fontSize:"0.76rem"},children:[t.jsx("div",{style:{color:"rgba(226,232,240,0.72)",minWidth:88},children:e}),t.jsx("div",{className:"mono",style:{textAlign:"right",wordBreak:"break-word",maxWidth:180},children:n})]},e))}),t.jsx("div",{style:{marginTop:10,fontSize:"0.68rem",color:"rgba(226,232,240,0.7)",lineHeight:1.4},children:"Use this to verify whether Trackon labels are being decoded as `ITF` and how quickly the first lock happens after scan start."})]}),y!=="paired"&&t.jsx("div",{className:ge(a.IDLE),children:t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},children:[t.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:y==="connecting"?t.jsx(Nt,{size:28,color:i.primary,style:{animation:"spin 1s linear infinite"}}):t.jsx(Pn,{size:28,color:i.error})}),t.jsxs("div",{style:{textAlign:"center"},children:[t.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:y==="connecting"?"Connecting...":"Disconnected"}),t.jsx("div",{style:{fontSize:"0.82rem",color:i.muted},children:se||(p?"Preparing direct scanner session":`Connecting to session ${l}`)})]}),y==="disconnected"&&t.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[t.jsx(Nt,{size:16})," Reconnect"]})]})}),t.jsx("video",{ref:ee,autoPlay:!0,playsInline:!0,muted:!0,onClick:()=>{Be().catch(e=>{m((e==null?void 0:e.message)||"Camera access failed.")})},style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(k===a.SCANNING||k===a.CAPTURING)&&!Se.current?"block":"none"}}),t.jsx("div",{className:ge(a.IDLE),children:t.jsxs("div",{className:"home-root",children:[t.jsxs("div",{className:"home-header",children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16},children:[t.jsxs("button",{onClick:()=>w("/app/scan"),style:{background:"white",border:"1px solid #E2E8F0",padding:"6px 12px",borderRadius:20,fontSize:"0.75rem",fontWeight:600,color:"#475569",display:"flex",alignItems:"center",gap:4,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.02)"},children:[t.jsx(qr,{size:14})," Go Back"]}),t.jsxs("div",{className:"home-logo-badge",children:[t.jsx(qn,{size:11,color:y==="paired"&&navigator.onLine?"#10B981":"#EF4444"}),At]})]}),t.jsx("div",{className:"home-logo-row",children:t.jsxs("div",{className:"home-logo-text",children:[t.jsx("img",{src:"/images/logo.png",alt:"Sea Hawk Logo",style:{height:28,width:"auto",objectFit:"contain",padding:2,background:"white",borderRadius:6,border:"1px solid #E2E8F0"}}),t.jsx("span",{children:"Seahawk Scanner"})]})}),t.jsxs("div",{className:"home-stats-row",children:[t.jsxs("div",{className:"home-stat-card",children:[t.jsx("div",{className:"home-stat-val",children:N.scanNumber}),t.jsx("div",{className:"home-stat-label",children:"Scanned"})]}),t.jsxs("div",{className:"home-stat-card",children:[t.jsx("div",{className:"home-stat-val",children:wn>0?wn.toFixed(1):"0"}),t.jsx("div",{className:"home-stat-label",children:"Total kg"})]}),t.jsxs("div",{className:"home-stat-card",children:[t.jsx("div",{className:"home-stat-val",children:Rt}),t.jsx("div",{className:"home-stat-label",children:"Session"})]})]}),t.jsxs("div",{className:"home-date-chip",children:[t.jsx(Ut,{size:18,color:"#38BDF8"}),t.jsxs("div",{children:[t.jsx("div",{className:"home-date-label",children:"Scan Date"}),t.jsxs("div",{className:"home-date-value",children:[new Date(I+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}),I===new Date().toISOString().slice(0,10)&&t.jsx("span",{style:{fontSize:"0.65rem",color:"#10B981",marginLeft:6,fontWeight:500},children:"TODAY"})]})]}),t.jsx("div",{className:"home-date-change",children:"Change ▸"}),t.jsx("input",{type:"date",value:I,max:new Date().toISOString().slice(0,10),onChange:e=>{const n=e.target.value;if(n&&qe.test(n)){fr(n);try{localStorage.setItem("seahawk_scanner_session_date",n)}catch(s){F("persist session date",s)}v("light")}}})]})]}),t.jsxs("div",{className:"home-scan-section",children:[t.jsxs("div",{className:"home-scan-btn-wrap",children:[t.jsx("div",{className:"home-scan-ring"}),t.jsx("div",{className:"home-scan-ring home-scan-ring2"}),t.jsxs("button",{"data-testid":"start-scan-btn",className:"home-scan-btn",onClick:Sr,children:[t.jsx(Gt,{size:34,color:"white"}),t.jsx("span",{className:"home-scan-btn-label",children:"Scan"})]})]}),t.jsx("div",{className:"home-cta-text",children:N.scanNumber===0?"Tap to start your first scan":"Tap to scan next parcel"}),t.jsxs("div",{style:{display:"flex",gap:8,marginTop:14,width:"100%",maxWidth:320},children:[t.jsxs("button",{type:"button","data-testid":"workflow-fast-btn",onClick:()=>Pt("fast"),style:{flex:1,borderRadius:999,border:`1px solid ${j==="fast"?i.primary:i.border}`,background:j==="fast"?i.primaryLight:i.surface,color:j==="fast"?i.primary:i.muted,fontWeight:700,fontSize:"0.72rem",padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[t.jsx(Ln,{size:13})," Fast scan"]}),t.jsxs("button",{type:"button","data-testid":"workflow-ocr-btn",onClick:()=>Pt("ocr"),style:{flex:1,borderRadius:999,border:`1px solid ${j==="ocr"?i.primary:i.border}`,background:j==="ocr"?i.primaryLight:i.surface,color:j==="ocr"?i.primary:i.muted,fontWeight:700,fontSize:"0.72rem",padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[t.jsx(Vt,{size:13})," OCR label"]})]}),t.jsxs("div",{style:{display:"flex",gap:8,marginTop:8,width:"100%",maxWidth:320},children:[t.jsxs("button",{type:"button","data-testid":"device-profile-phone-btn",onClick:()=>tn(ne.phone),style:{flex:1,borderRadius:999,border:`1px solid ${Y===ne.phone?i.primary:i.border}`,background:Y===ne.phone?i.primaryLight:i.surface,color:Y===ne.phone?i.primary:i.muted,fontWeight:700,fontSize:"0.7rem",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[t.jsx(Gt,{size:13})," Phone lens"]}),t.jsxs("button",{type:"button","data-testid":"device-profile-rugged-btn",onClick:()=>tn(ne.rugged),style:{flex:1,borderRadius:999,border:`1px solid ${Y===ne.rugged?i.primary:i.border}`,background:Y===ne.rugged?i.primaryLight:i.surface,color:Y===ne.rugged?i.primary:i.muted,fontWeight:700,fontSize:"0.7rem",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[t.jsx(Wn,{size:13})," Rugged"]})]}),t.jsxs("form",{onSubmit:vr,style:{width:"100%",maxWidth:300,marginTop:20},children:[t.jsx("div",{style:{fontSize:"0.62rem",fontWeight:700,color:i.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6,textAlign:"center"},children:"Can't scan? Enter AWB manually"}),t.jsxs("div",{style:{display:"flex",gap:6},children:[t.jsx("input",{"data-testid":"manual-awb-input",value:nt,onChange:e=>Jt(e.target.value.toUpperCase()),placeholder:"e.g. 1234567890",inputMode:"text",autoCapitalize:"characters",style:{flex:1,padding:"9px 12px",border:`1.5px solid ${i.border}`,borderRadius:10,fontFamily:"JetBrains Mono, monospace",fontSize:"0.82rem",fontWeight:600,background:i.surface,color:i.text,outline:"none"},onFocus:e=>e.target.style.borderColor=i.primary,onBlur:e=>e.target.style.borderColor=i.border}),t.jsx("button",{type:"submit","data-testid":"manual-awb-submit",disabled:nt.trim().length<6,className:"btn btn-primary",style:{padding:"9px 14px",fontSize:"0.78rem",borderRadius:10,opacity:nt.trim().length>=6?1:.45},children:"Go →"})]})]}),t.jsxs("div",{className:"action-buttons-row",children:[t.jsxs("button",{className:"action-btn",onClick:kr,children:[t.jsx(Lr,{size:14})," ",A.length>0?`Upload (${A.length})`:"Synced"]}),t.jsxs("button",{className:"action-btn danger",onClick:Nr,children:[t.jsx(_n,{size:14})," End Session"]})]}),A.length>0&&t.jsxs("div",{style:{marginTop:14,fontSize:"0.7rem",color:i.warning,fontWeight:600,display:"flex",alignItems:"center",gap:5},children:[t.jsx($n,{size:12})," ",A.length," offline scan",A.length>1?"s":""," pending sync"]})]}),t.jsxs("div",{className:"home-queue-section",children:[t.jsxs("div",{className:"home-queue-head",children:[t.jsxs("div",{className:"home-queue-title-text",children:[t.jsx(Wr,{size:11}),"Accepted Consignments"]}),N.scannedItems.length>0&&t.jsx("div",{className:"home-queue-badge",children:N.scannedItems.length})]}),t.jsx("div",{className:"home-queue-list",children:N.scannedItems.length===0?t.jsxs("div",{className:"queue-empty",children:[t.jsx(Ht,{size:36,color:"rgba(255,255,255,0.12)"}),t.jsxs("div",{className:"queue-empty-text",children:["No consignments scanned yet.",t.jsx("br",{}),"Tap the button above to begin."]})]}):N.scannedItems.map((e,n)=>t.jsxs("div",{className:"queue-item",children:[t.jsx("div",{className:"queue-check",children:t.jsx(Un,{size:13,color:"#10B981"})}),t.jsxs("div",{className:"queue-main",children:[t.jsxs("div",{className:"queue-main-top",children:[t.jsx("div",{className:"queue-awb",children:e.awb}),e.weight>0&&t.jsxs("div",{className:"queue-weight",children:[e.weight,"kg"]})]}),t.jsxs("div",{className:"queue-meta",children:[e.clientCode==="OFFLINE"?t.jsx("span",{className:"queue-offline-tag",children:"Offline"}):e.clientCode&&t.jsx("span",{className:"queue-client-tag",children:e.clientCode}),e.destination&&t.jsx("span",{children:e.destination}),e.date&&t.jsx("span",{className:"queue-date-tag",children:tr(e.date)})]}),mr===e.queueId?t.jsxs("div",{className:"queue-date-editor",children:[t.jsx("input",{type:"date",className:"queue-date-input",value:ut,max:new Date().toISOString().slice(0,10),onChange:s=>pt(s.target.value),disabled:Te===e.queueId}),t.jsx("button",{type:"button",className:"queue-action-btn primary",onClick:()=>wr(e),disabled:Te===e.queueId||!qe.test(ut),children:Te===e.queueId?"Saving...":"Save"}),t.jsx("button",{type:"button",className:"queue-action-btn",onClick:yr,disabled:Te===e.queueId,children:"Cancel"})]}):t.jsxs("div",{className:"queue-actions",children:[t.jsxs("button",{type:"button",className:"queue-action-btn",onClick:()=>br(e),disabled:Te===e.queueId,children:[t.jsx(Ut,{size:12})," Edit Date"]}),t.jsxs("button",{type:"button",className:"queue-action-btn danger",onClick:()=>Cr(e),disabled:Te===e.queueId,children:[t.jsx(_n,{size:12})," ",Te===e.queueId?"Deleting...":"Delete"]})]})]})]},e.queueId||`${e.awb}-${n}`))})]})]})}),t.jsx("div",{className:ge(a.SCANNING),children:t.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[t.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:Se.current?"block":"none"}}),t.jsx("div",{className:"cam-overlay",children:t.jsxs("div",{className:"scan-guide",style:Ae==="barcode"?{width:Qn.w,height:Qn.h,borderRadius:10,maxHeight:"20vw",transition:"all 0.4s ease",borderColor:se?"rgba(248,113,113,0.92)":void 0,boxShadow:se?"0 0 0 3px rgba(248,113,113,0.2)":void 0}:{width:kt.w,height:kt.h,borderRadius:14,maxHeight:"75vh",transition:"all 0.4s ease",borderColor:"rgba(251,191,36,0.85)",boxShadow:"0 0 0 3px rgba(251,191,36,0.2)"},children:[t.jsx("div",{className:"scan-guide-corner corner-tl"}),t.jsx("div",{className:"scan-guide-corner corner-tr"}),t.jsx("div",{className:"scan-guide-corner corner-bl"}),t.jsx("div",{className:"scan-guide-corner corner-br"}),Ae==="barcode"&&t.jsx("div",{className:"scan-laser",children:t.jsx("div",{className:"scan-laser-spark"})})]})}),t.jsxs("div",{className:"cam-hud",children:[t.jsxs("div",{className:"cam-hud-chip",children:[t.jsx(qn,{size:12})," ",p?"DIRECT":l]}),t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[Ae==="document"&&t.jsxs("div",{className:"cam-hud-chip",style:{background:"rgba(251,191,36,0.22)",color:"#FDE68A",fontWeight:700,fontSize:"0.65rem",gap:4},children:[t.jsx(Gn,{size:11})," LABEL MODE"]}),t.jsxs("div",{className:"cam-hud-chip",style:{gap:4},children:[t.jsx(Ht,{size:12})," ",N.scanNumber,Zt==="native"?t.jsx("span",{style:{color:"#34D399",fontSize:"0.6rem",fontWeight:800},children:"⚡ NATIVE"}):t.jsx("span",{style:{color:"#F59E0B",fontSize:"0.6rem",fontWeight:800},children:"ZXING"})]})]})]}),t.jsxs("div",{className:"cam-bottom",children:[Ae==="barcode"?t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:6,color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:[t.jsx("div",{children:j==="fast"?"Align barcode inside the strip - auto-save on lock":"Align barcode inside the strip - camera opens for label capture after lock"}),Bt>0&&t.jsxs("div",{style:{color:"#FDE68A",fontSize:"0.74rem",fontWeight:700},children:["Reframe retry ",Bt,"/",jt]}),!!se&&t.jsx("div",{style:{color:"#FCA5A5",fontSize:"0.72rem",fontWeight:700},children:se})]}):t.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:6},children:[t.jsx("div",{style:{color:"rgba(251,191,36,0.95)",fontSize:"0.82rem",fontWeight:700,textAlign:"center"},children:"No barcode found - capture the label and we will read the printed AWB"}),t.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"},children:[t.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:xr,children:"Capture label instead"}),t.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:()=>{K(0),ae(0),m(""),Dt("barcode"),v("tap")},children:"Back to barcode mode"})]})]}),t.jsxs("div",{style:{display:"flex",gap:12},children:[t.jsxs("button",{className:"cam-hud-chip",onClick:()=>Pt(e=>e==="fast"?"ocr":"fast"),style:{border:"none",cursor:"pointer",gap:5},children:[j==="fast"?t.jsx(Ln,{size:13}):t.jsx(Vt,{size:13}),j==="fast"?"FAST":"OCR"]}),t.jsx("button",{className:"cam-hud-chip",onClick:()=>pr(!Ve),style:{border:"none",cursor:"pointer"},children:Ve?t.jsx(_r,{size:14}):t.jsx($r,{size:14})})]})]})]})}),t.jsx("div",{className:ge(a.CAPTURING),children:t.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!Ue&&t.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[t.jsx(Ur,{size:44,color:"#34D399"}),t.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:R||"OCR fallback"}),t.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:R?"Barcode locked - Preparing camera...":"Preparing label capture for printed AWB OCR..."})]}),t.jsx("div",{className:"cam-overlay",children:t.jsxs("div",{ref:ft,className:`scan-guide ${ce?"detected":""}`,style:{width:kt.w,height:kt.h,maxHeight:"75vh",borderRadius:12},children:[t.jsx("div",{className:"scan-guide-corner corner-tl"}),t.jsx("div",{className:"scan-guide-corner corner-tr"}),t.jsx("div",{className:"scan-guide-corner corner-bl"}),t.jsx("div",{className:"scan-guide-corner corner-br"})]})}),t.jsxs("div",{className:"cam-hud",children:[t.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[t.jsx(Gn,{size:12})," ",R||"OCR AWB capture"]}),A.length>0&&t.jsxs("div",{className:"cam-hud-chip",children:[t.jsx($n,{size:12})," ",A.length," queued"]})]}),t.jsxs("div",{className:"cam-bottom",children:[t.jsx("div",{style:{color:ce?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center",transition:"color 0.3s"},children:Rr}),B.metrics&&t.jsxs("div",{style:{color:"rgba(255,255,255,0.66)",fontSize:"0.72rem",textAlign:"center"},children:["Blur ",B.metrics.blurScore," | Glare ",B.metrics.glareRatio,"% | Skew ",B.metrics.perspectiveSkew,"%"]}),t.jsx("button",{className:"capture-btn","data-testid":"capture-photo-btn",onClick:jr,disabled:!bn,style:{opacity:bn?1:.4},children:t.jsx("div",{className:"capture-btn-inner"})}),C&&t.jsx("button",{type:"button","data-testid":"mock-capture-btn",onClick:Ir,style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 12px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:"Mock capture"}),t.jsx("button",{style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},onClick:()=>{ie(""),m(""),K(0),ae(0),ve.current=!1,v("tap"),u(a.SCANNING)},children:"← Rescan barcode"})]})]})}),t.jsx("div",{className:ge(a.PREVIEW),children:t.jsxs("div",{style:{background:i.bg,display:"flex",flexDirection:"column",height:"100%"},children:[t.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${i.border}`},children:t.jsxs("div",{children:[t.jsx("div",{style:{fontSize:"0.72rem",color:i.muted,fontWeight:600},children:"CAPTURED"}),t.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:R||"Printed AWB OCR"}),_.kb>0&&t.jsxs("div",{style:{fontSize:"0.68rem",color:i.mutedLight},children:[_.kb,"KB • ",_.width,"×",_.height]})]})}),t.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:H&&t.jsx("img",{src:H,alt:"Captured label",className:"preview-img"})}),t.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[t.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{oe(null),u(a.CAPTURING)},children:[t.jsx(Vn,{size:16})," Retake"]}),t.jsxs("button",{"data-testid":"use-photo-btn",className:"btn btn-primary",style:{flex:2},onClick:Er,children:[t.jsx(Gr,{size:16})," Use Photo"]})]})]})}),t.jsx("div",{className:ge(a.PROCESSING),children:t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16},children:[t.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[t.jsx(Vt,{size:22,color:i.primary,style:{animation:"spin 2s linear infinite"}}),t.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:i.primary},children:"Intelligence Engine"})]}),t.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:i.muted},children:R}),t.jsx("div",{style:{fontSize:"0.72rem",color:i.mutedLight,marginTop:6},children:H?"Reading AWB label with local OCR...":"Saving barcode scan..."})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(e=>t.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{className:"field-label",children:e}),t.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),t.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},e)),t.jsx("div",{style:{textAlign:"center",marginTop:8},children:t.jsx("button",{className:"btn btn-outline",style:{fontSize:"0.75rem",padding:"8px 20px"},onClick:()=>{m("Cancelled by user."),u(a.ERROR)},children:"Cancel"})})]})}),t.jsx("div",{className:ge(a.REVIEWING),children:t.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%"},children:[t.jsxs("div",{className:"review-header",children:[t.jsxs("div",{className:"review-header-top",children:[t.jsxs("div",{children:[t.jsx("div",{className:"review-title",children:"REVIEW EXTRACTION"}),t.jsx("div",{className:"mono review-awb",children:(o==null?void 0:o.awb)||R})]}),(O==null?void 0:O.learnedFieldCount)>0&&t.jsxs("div",{className:"source-badge source-learned",children:["AI ",O.learnedFieldCount," auto-corrected"]})]}),t.jsxs("div",{className:"review-meta-row",children:[t.jsxs("span",{className:`review-confidence ${$t.level}`,children:[t.jsx(Wn,{size:13}),$t.label," (",Math.round($t.score*100),"%)"]}),t.jsxs("button",{type:"button",className:"review-chip review-chip-courier",onClick:Ar,title:"Tap to change courier",children:[t.jsx(Ht,{size:13}),Tr||"Trackon"]}),t.jsxs("span",{className:"review-chip review-chip-date",children:[t.jsx(Ut,{size:13}),zr||"No date"]})]})]}),t.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[t.jsxs("div",{className:`field-card ${(((En=he.clientCode)==null?void 0:En.confidence)||0)<.55?"warning":""}`,children:[t.jsx("div",{className:Xt(((Fn=he.clientCode)==null?void 0:Fn.confidence)||0)}),t.jsxs("div",{style:{flex:1},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[t.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((Rn=he.clientCode)==null?void 0:Rn.source)&&(()=>{const e=sr(he.clientCode.source);return e?t.jsxs("span",{className:e.className,children:[e.icon," ",e.text]}):null})()]}),t.jsx("input",{className:"field-input",value:b.clientCode||"",onChange:e=>W(n=>({...n,clientCode:e.target.value.toUpperCase()})),placeholder:"Client code"}),t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:6,gap:8},children:[t.jsx("div",{style:{fontSize:"0.62rem",color:"#64748B"},children:me?`Sticky for next scans: ${me}`:"Sticky client is off"}),me?t.jsx("button",{type:"button",className:"suggest-chip",onClick:()=>lt(""),children:"Clear sticky"}):t.jsx("button",{type:"button",className:"suggest-chip",onClick:()=>{const e=Ee(b.clientCode||"");e&&e!=="MISC"&&lt(e)},children:"Keep this client"})]}),((An=O==null?void 0:O.clientMatches)==null?void 0:An.length)>0&&O.clientNeedsConfirmation&&t.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:O.clientMatches.slice(0,3).map(e=>t.jsxs("button",{type:"button",className:`suggest-chip ${b.clientCode===e.code?"active":""}`,onClick:()=>W(n=>({...n,clientCode:e.code})),children:[e.code," (",Math.round(e.score*100),"%)"]},e.code))})]})]}),t.jsxs("div",{className:"field-card",children:[t.jsx("div",{className:Xt(((Tn=he.consignee)==null?void 0:Tn.confidence)||0)}),t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{className:"field-label",children:"Consignee"}),t.jsx("input",{className:"field-input",value:b.consignee||"",onChange:e=>W(n=>({...n,consignee:e.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),t.jsxs("div",{className:"field-card",children:[t.jsx("div",{className:Xt(((zn=he.destination)==null?void 0:zn.confidence)||0)}),t.jsxs("div",{style:{flex:1},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[t.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((Mn=he.destination)==null?void 0:Mn.source)&&(()=>{const e=sr(he.destination.source);return e?t.jsxs("span",{className:e.className,children:[e.icon," ",e.text]}):null})()]}),t.jsx("input",{className:"field-input",value:b.destination||"",onChange:e=>W(n=>({...n,destination:e.target.value.toUpperCase()})),placeholder:"City"}),(O==null?void 0:O.pincodeCity)&&O.pincodeCity!==b.destination&&t.jsxs("button",{onClick:()=>W(e=>({...e,destination:O.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:i.successLight,color:i.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["ðŸ“ Pincode suggests: ",O.pincodeCity]})]})]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[t.jsx("div",{className:"field-card",children:t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{className:"field-label",children:"Pincode"}),t.jsx("input",{className:"field-input",value:b.pincode||"",onChange:e=>W(n=>({...n,pincode:e.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),t.jsx("div",{className:`field-card ${(Bn=O==null?void 0:O.weightAnomaly)!=null&&Bn.anomaly?"warning":"conf-med"}`,children:t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{className:"field-label",children:"Weight (kg)"}),t.jsx("input",{className:"field-input",value:b.weight||"",onChange:e=>W(n=>({...n,weight:e.target.value})),placeholder:"0.0",inputMode:"decimal"}),((On=O==null?void 0:O.weightAnomaly)==null?void 0:On.anomaly)&&t.jsxs("div",{style:{fontSize:"0.6rem",color:i.warning,marginTop:2,fontWeight:500},children:["Warning: ",O.weightAnomaly.warning]})]})})]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[t.jsx("div",{className:"field-card conf-med",children:t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{className:"field-label",children:"Amount (₹)"}),t.jsx("input",{className:"field-input",value:b.amount||"",onChange:e=>W(n=>({...n,amount:e.target.value})),placeholder:"0",inputMode:"decimal"})]})}),t.jsx("div",{className:"field-card conf-low",children:t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{className:"field-label",children:"Order No"}),t.jsx("input",{className:"field-input",value:b.orderNo||"",onChange:e=>W(n=>({...n,orderNo:e.target.value})),placeholder:"Optional"})]})})]})]}),t.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${i.border}`,display:"flex",gap:10},children:[t.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:ct,children:[t.jsx(Vr,{size:16})," Skip"]}),t.jsxs("button",{"data-testid":"approve-save-btn",className:"btn btn-success btn-lg",style:{flex:2},onClick:Fr,disabled:k===a.APPROVING,children:[k===a.APPROVING?t.jsx(Nt,{size:16,style:{animation:"spin 1s linear infinite"}}):t.jsx(Un,{size:16}),k===a.APPROVING?"Saving...":"Approve & Save"]})]})]})}),t.jsx("div",{className:ge(a.APPROVING),children:t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:16},children:[t.jsx(Nt,{size:42,style:{animation:"spin 1s linear infinite",color:i.primary}}),t.jsxs("div",{style:{textAlign:"center"},children:[t.jsx("div",{style:{fontSize:"1.05rem",fontWeight:700,color:i.text},children:"Saving approval..."}),t.jsx("div",{className:"mono",style:{fontSize:"0.98rem",marginTop:6,color:i.muted},children:(o==null?void 0:o.awb)||R||"AWB"}),t.jsx("div",{style:{fontSize:"0.78rem",color:i.muted,marginTop:8},children:"Waiting for desktop confirmation. If this takes too long, retry from review."})]}),t.jsx("button",{className:"btn btn-outline",onClick:()=>{clearTimeout(de.current),de.current=null,m("Approval pending. Please tap Approve & Save again."),u(a.REVIEWING)},children:"Back to review"})]})}),t.jsx("div",{className:ge(a.SUCCESS),children:t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[t.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[t.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:i.success,strokeWidth:"3",className:"success-check-circle"}),t.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:i.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),t.jsxs("div",{style:{textAlign:"center"},children:[t.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:i.success,marginBottom:4},children:"Saved Successfully"}),t.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700},children:q==null?void 0:q.awb}),(q==null?void 0:q.clientCode)&&t.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:i.primaryLight,color:i.primary,fontSize:"0.78rem",fontWeight:600},children:q.clientName||q.clientCode})]}),t.jsx("div",{style:{fontSize:"0.72rem",color:i.muted},children:q!=null&&q.offlineQueued?`${A.length} queued for sync - Auto-continuing in ${xn}s`:`#${N.scanNumber} scanned - Auto-continuing in ${xn}s`}),t.jsxs("button",{"data-testid":"scan-next-btn",className:"btn btn-primary btn-lg btn-full",onClick:()=>ct(j==="fast"?a.SCANNING:a.IDLE),style:{maxWidth:320},children:[t.jsx(Gt,{size:18})," ",j==="fast"?"Keep Scanning":"Scan Next Parcel"]})]})}),t.jsx("div",{className:ge(a.ERROR),children:t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[t.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:t.jsx(Dn,{size:32,color:i.error})}),t.jsxs("div",{style:{textAlign:"center"},children:[t.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:i.error},children:"Scan Error"}),t.jsx("div",{style:{fontSize:"0.82rem",color:i.muted,marginTop:4},children:se})]}),t.jsxs("button",{className:"btn btn-primary",onClick:ct,children:[t.jsx(Vn,{size:16})," Try Again"]})]})}),y==="disconnected"&&k!==a.IDLE&&t.jsxs("div",{className:"offline-banner",children:[t.jsx(Pn,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline â€” Reconnecting... ",A.length?`(${A.length} queued)`:""]})]}),t.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{ws as default};
