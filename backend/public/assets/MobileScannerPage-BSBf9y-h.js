import{a0 as Dr,u as Pr,r,j as t,v as Pn,e as Nt,bs as qn,H as qr,bc as Wn,aq as Ut,bd as Gt,Z as Ln,aL as Vt,as as _n,bt as Wr,aj as $n,C as Un,bj as Lr,P as Ht,w as Gn,b6 as Vn,bu as _r,bv as $r,p as Ur,d as Hn,G as Gr,X as Vr}from"./vendor-react-DHsZcx6l.js";import{a as xe,l as Hr}from"./index-CMH1D_pm.js";import{c as Qr,n as Yr}from"./barcodeEngine-BcErVNpV.js";function ar(o,d){var b,p;try{if(!o||!d)return null;const T=Number(o.videoWidth||0),z=Number(o.videoHeight||0);if(!T||!z)return null;const U=(b=o.getBoundingClientRect)==null?void 0:b.call(o),D=(p=d.getBoundingClientRect)==null?void 0:p.call(d);if(!U||!D)return null;const P=Number(U.width||0),S=Number(U.height||0);if(!P||!S)return null;const x=Math.max(P/T,S/z),re=T*x,w=z*x,M=(P-re)/2,se=(S-w)/2,g=D.left-U.left,k=D.top-U.top,We=D.right-U.left,A=D.bottom-U.top,ie=(g-M)/x,H=(k-se)/x,oe=(We-M)/x,ue=(A-se)/x,c=(J,Le,Fe)=>Math.max(Le,Math.min(Fe,J)),be=c(Math.min(ie,oe),0,T),y=c(Math.min(H,ue),0,z),L=c(Math.max(ie,oe),0,T),q=c(Math.max(H,ue),0,z),W=Math.max(0,L-be),ye=Math.max(0,q-y);return!W||!ye?null:{x:be,y,w:W,h:ye}}catch{return null}}function Qn(o=[]){if(!o.length)return"";const d=[];return o.includes("blur")&&d.push("hold steady"),o.includes("glare")&&d.push("reduce glare"),o.includes("angle")&&d.push("straighten angle"),o.includes("dark")&&d.push("add light"),o.includes("low_edge")&&d.push("fill frame"),d.length?`Improve capture: ${d.join(", ")}.`:""}function Kr(o,d){if(!o||!d||!o.videoWidth||!o.videoHeight)return null;const b=ar(o,d);if(!b)return null;const p=Math.max(0,Math.floor(b.x)),T=Math.max(0,Math.floor(b.y)),z=Math.max(24,Math.floor(b.w)),U=Math.max(24,Math.floor(b.h)),D=128,P=96,S=document.createElement("canvas");S.width=D,S.height=P;const x=S.getContext("2d",{willReadFrequently:!0});if(!x)return null;x.drawImage(o,p,T,Math.min(z,o.videoWidth-p),Math.min(U,o.videoHeight-T),0,0,D,P);const re=x.getImageData(0,0,D,P).data,w=D*P,M=new Float32Array(w);let se=0,g=0,k=0;for(let V=0,Z=0;V<re.length;V+=4,Z+=1){const Q=.2126*re[V]+.7152*re[V+1]+.0722*re[V+2];M[Z]=Q,se+=Q,Q>=245&&(g+=1),Q<=24&&(k+=1)}let We=0,A=0,ie=0,H=0,oe=0,ue=0;const c=Math.max(4,Math.floor(P*.15)),be=Math.max(4,Math.floor(D*.15)),y=D;for(let V=1;V<P-1;V+=1)for(let Z=1;Z<D-1;Z+=1){const Q=V*y+Z,O=M[Q],_e=M[Q-1],_=M[Q+1],$e=M[Q-y],Ue=M[Q+y],we=Math.abs(_-_e),Rt=Math.abs(Ue-$e),Ae=we+Rt,Tt=Math.abs(4*O-_e-_-$e-Ue);We+=Tt,Ae>58&&(A+=1),V<=c&&(ie+=Ae),V>=P-c&&(H+=Ae),Z<=be&&(oe+=Ae),Z>=D-be&&(ue+=Ae)}const L=Math.max(1,(D-2)*(P-2)),q=se/w,W=We/L,ye=A/L,J=g/w,Le=k/w,Fe=Math.abs(ie-H)/Math.max(1,ie+H),R=Math.abs(oe-ue)/Math.max(1,oe+ue),et=Math.max(Fe,R),ce=[];return W<22&&ce.push("blur"),J>.18&&ce.push("glare"),(Le>.55||q<40)&&ce.push("dark"),ye<.08&&ce.push("low_edge"),et>.62&&ce.push("angle"),{ok:ce.length===0,issues:ce,metrics:{brightness:Number(q.toFixed(1)),blurScore:Number(W.toFixed(1)),glareRatio:Number((J*100).toFixed(1)),edgeRatio:Number((ye*100).toFixed(1)),perspectiveSkew:Number((et*100).toFixed(1))}}}function Ft(o,d){const b=Number(o);return Number.isFinite(b)&&b>0?b:d}function Xr({samples:o=[],awb:d,now:b=Date.now(),stabilityWindowMs:p=1100,requiredHits:T=3}){const z=Ft(p,1100),U=Math.max(1,Math.floor(Ft(T,3))),D=Ft(b,Date.now()),P=String(d||"").trim(),S=Array.isArray(o)?o.filter(w=>(w==null?void 0:w.awb)&&D-((w==null?void 0:w.at)||0)<=z):[];if(!P)return{samples:S,hits:0,isStable:!1};const x=[...S,{awb:P,at:D}],re=x.reduce((w,M)=>M.awb===P?w+1:w,0);return{samples:x,hits:re,isStable:re>=U}}function Jr({currentAttempts:o=0,maxReframeAttempts:d=2}){const b=Math.max(0,Math.floor(Ft(d,2))),p=Math.max(0,Math.floor(Number(o)||0))+1;return p<=b?{action:"reframe",attempts:p}:{action:"switch_to_document",attempts:b}}function Zr(){return window.location.origin}const es=Zr(),Yn={w:"90vw",h:"18vw"},kt={w:"92vw",h:"130vw"},Kn=3500,Xn=900,ts=1e4,ns=12e3,rs=15e3,ss="mobile_scanner_offline_queue",is="mobile_scanner_session_state",as="mobile_scanner_sticky_client",Jn="mobile_scanner_workflow_mode",Zn="mobile_scanner_device_profile",os=2e4,cs=500,ls=1,er=100,jt=2,Qt=2,ds=500,tr=960,Pe=.68,us=900,ne={phone:"phone-camera",rugged:"rugged-scanner"},It=["Trackon","DTDC","Delhivery","BlueDart"],qe=/^\d{4}-\d{2}-\d{2}$/,Yt=o=>{const d=String(o||"").trim();if(!d)return"";const b=d.toUpperCase();return b.includes("TRACKON")||b.includes("PRIME")?"Trackon":b.includes("DTDC")?"DTDC":b.includes("DELHIVERY")?"Delhivery":b.includes("BLUE")?"BlueDart":d},Ee=o=>String(o||"").trim().toUpperCase(),nr=o=>{const d=String(o||"").trim();if(!qe.test(d))return d;try{return new Date(`${d}T00:00:00`).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}catch{return d}},Je=(o,d="")=>{const b=String(o||"").trim();if(qe.test(b))return b;const p=String(d||"").trim();return qe.test(p)?p:new Date().toISOString().slice(0,10)},a={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"};function j(o,d){d instanceof Error?d.message:String(d||"unknown error")}const ps=o=>{var d;try{(d=navigator==null?void 0:navigator.vibrate)==null||d.call(navigator,o)}catch(b){j("vibrate",b)}},rr={tap:[20],lock:[400,50,200,50,100],success:[18,28,72],warning:[70,50,70],retry:[28,40,28],error:[110,55,110],duplicate:[90,50,90,50,90],review:[200,40,120]},v=(o="tap")=>{ps(rr[o]||rr.tap)},At=(o,d,b="sine")=>{try{const p=new(window.AudioContext||window.webkitAudioContext),T=p.createOscillator(),z=p.createGain();T.type=b,T.frequency.setValueAtTime(o,p.currentTime),z.gain.setValueAtTime(.12,p.currentTime),z.gain.exponentialRampToValueAtTime(.01,p.currentTime+d),T.connect(z),z.connect(p.destination),T.start(),T.stop(p.currentTime+d)}catch(p){j("playTone",p)}},Ze=()=>{At(880,.12),setTimeout(()=>At(1100,.1),130)},Et=()=>{try{const o=new(window.AudioContext||window.webkitAudioContext),d=o.createOscillator(),b=o.createGain();d.type="square",d.frequency.setValueAtTime(3800,o.currentTime),d.frequency.setValueAtTime(3200,o.currentTime+.04),b.gain.setValueAtTime(0,o.currentTime),b.gain.linearRampToValueAtTime(.18,o.currentTime+.005),b.gain.setValueAtTime(.18,o.currentTime+.055),b.gain.exponentialRampToValueAtTime(.001,o.currentTime+.13),d.connect(b),b.connect(o.destination),d.start(o.currentTime),d.stop(o.currentTime+.14)}catch(o){j("playHardwareBeep",o)}},ms=()=>At(600,.08),X=()=>At(200,.25,"sawtooth"),Kt=o=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const d=new SpeechSynthesisUtterance(o);d.rate=1.2,d.pitch=1,d.lang="en-IN",window.speechSynthesis.speak(d)}catch(d){j("speak",d)}},sr=()=>{var o;try{if(typeof window>"u")return!1;if(window.isSecureContext)return!0;const d=((o=window.location)==null?void 0:o.hostname)||"";return d==="localhost"||d==="127.0.0.1"}catch{return!1}},i={bg:"#F0F4FF",surface:"#FFFFFF",border:"rgba(0,0,0,0.07)",text:"#111827",muted:"#6B7280",mutedLight:"#9CA3AF",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},gs=`
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
  box-shadow: 0 2px 10px rgba(79,70,229,0.07);
}

/* â”€â”€ Buttons â”€â”€ */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px 24px; border-radius: 12px; border: none;
  font-family: inherit; font-size: 0.9rem; font-weight: 700;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  letter-spacing: 0.01em;
}
.btn:active { transform: scale(0.96); }
.btn-primary {
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  color: white;
}
.btn-primary:hover { box-shadow: 0 6px 20px rgba(79,70,229,0.4); }
.btn-success {
  background: linear-gradient(135deg, #059669, #10B981);
  color: white;
  box-shadow: 0 4px 16px rgba(5,150,105,0.3);
}
.btn-success:hover { box-shadow: 0 6px 22px rgba(5,150,105,0.45); }
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
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  transition: box-shadow 0.2s;
}
.field-card.conf-high { border-left-color: ${i.success}; }
.field-card.conf-med { border-left-color: ${i.warning}; }
.field-card.conf-low { border-left-color: ${i.error}; }
.field-card.warning { border-color: ${i.warning}; background: ${i.warningLight}; border-left-color: ${i.warning}; box-shadow: 0 2px 8px rgba(217,119,6,0.1); }
.field-card.error-field { border-color: ${i.error}; background: ${i.errorLight}; border-left-color: ${i.error}; box-shadow: 0 2px 8px rgba(220,38,38,0.1); }
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
  background: linear-gradient(135deg, #1E1B4B, #312E81);
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
  background: linear-gradient(160deg, #EEF2FF 0%, #F0F4FF 60%, #F5F3FF 100%);
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
  background: linear-gradient(145deg, #4F46E5, #7C3AED);
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
`,or=o=>o>=.85?"high":o>=.55?"med":"low",Xt=o=>`conf-dot conf-${or(o)}`,ir=o=>o==="learned"?{className:"source-badge source-learned",icon:"AI",text:"Learned"}:o==="awb_master"?{className:"source-badge source-ai",icon:"DB",text:"Lookup"}:o==="courier_api"?{className:"source-badge source-history",icon:"API",text:"Courier"}:o==="fuzzy_match"?{className:"source-badge source-ai",icon:"🔍",text:"Matched"}:o==="fuzzy_history"||o==="consignee_pattern"?{className:"source-badge source-history",icon:"📊",text:"History"}:o==="delhivery_pincode"||o==="india_post"||o==="pincode_lookup"||o==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"📍",text:"Pincode"}:null,fs=o=>{const d=Math.floor(o/6e4);return d<60?`${d}m`:`${Math.floor(d/60)}h ${d%60}m`};function ws({standalone:o=!1}){var vn,Nn,vt,kn,jn,In,En,Fn,An,Rn,Tn,zn,Mn,On,Bn,Dn;const{pin:d}=Dr(),b=Pr(),p=!!o,T=`${ss}:${p?"direct":d||"unknown"}`,z=r.useMemo(()=>`${is}:${p?"direct":d||"unknown"}`,[p,d]),U=r.useMemo(()=>`${as}:${p?"direct":d||"unknown"}`,[p,d]),D=r.useMemo(()=>`mobile_scanner_daily_count:${new Date().toISOString().slice(0,10)}`,[]),P=r.useMemo(()=>{try{return typeof window>"u"?"":new URLSearchParams(window.location.search).get("mockBarcodeRaw")||""}catch{return""}},[]),S=r.useMemo(()=>{try{if(typeof window>"u")return!1;const e=new URLSearchParams(window.location.search);return e.get("mock")==="1"||e.get("e2e")==="1"}catch{return!1}},[]),[x,re]=r.useState(null),[w,M]=r.useState("connecting"),[se,g]=r.useState(""),[k,We]=r.useState(a.IDLE),[A,ie]=r.useState(""),[H,oe]=r.useState(null),[,ue]=r.useState({}),[c,be]=r.useState(null),[y,L]=r.useState({}),[q,W]=r.useState(null),[ye,J]=r.useState(null),[Le,Fe]=r.useState(""),[R,et]=r.useState([]),[ce,V]=r.useState(!1),[Z,Q]=r.useState(0),[O,_e]=r.useState({ok:!1,issues:[],metrics:null}),[_,$e]=r.useState({kb:0,width:0,height:0,quality:Pe}),[Ue,we]=r.useState(!1),[Rt,Ae]=r.useState("0m"),[Tt,zt]=r.useState("Connected"),[tt,Jt]=r.useState(""),[Mt,cr]=r.useState(!1),[Zt,Ot]=r.useState("idle"),[pe,lr]=r.useState(null),[dr,ur]=r.useState(0),[Bt,pr]=r.useState(0),[en,Dt]=r.useState(null),[Re,Pt]=r.useState("barcode"),[I,qt]=r.useState(()=>{if(typeof window>"u")return"fast";try{const e=localStorage.getItem(Jn);if(e==="fast"||e==="ocr")return e}catch(e){j("read workflow mode",e)}return S?"ocr":"fast"}),[Y,tn]=r.useState(()=>{if(typeof window>"u")return ne.phone;try{const e=localStorage.getItem(Zn);if(e===ne.phone||e===ne.rugged)return e}catch(e){j("read device profile",e)}return ne.phone}),Wt=r.useRef(0),[N,Ge]=r.useState(()=>{const e={scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now(),scannedItems:[]};if(typeof window>"u")return e;try{const n=localStorage.getItem(z);if(!n)return e;const s=JSON.parse(n);if(!s||typeof s!="object")return e;const l=new Set(Array.isArray(s.scannedAwbs)?s.scannedAwbs.map(m=>Ee(m)).filter(Boolean):[]);return{...e,clientFreq:s.clientFreq&&typeof s.clientFreq=="object"?s.clientFreq:{},scanNumber:Number.isFinite(Number(s.scanNumber))?Number(s.scanNumber):0,dominantClient:Ee(s.dominantClient||"")||null,dominantClientCount:Number.isFinite(Number(s.dominantClientCount))?Number(s.dominantClientCount):0,startedAt:Number.isFinite(Number(s.startedAt))?Number(s.startedAt):e.startedAt,scannedItems:Array.isArray(s.scannedItems)?s.scannedItems:[],scannedAwbs:l}}catch(n){return j("hydrate session state",n),e}}),[me,ct]=r.useState(()=>{if(typeof window>"u")return"";try{return Ee(localStorage.getItem(U)||"")}catch(e){return j("read sticky client",e),""}}),[Ve,mr]=r.useState(!1),[gr,lt]=r.useState(""),[dt,ut]=r.useState(""),[Te,pt]=r.useState(""),[E,nn]=r.useState(()=>{const e=new Date().toISOString().slice(0,10);try{const n=localStorage.getItem("seahawk_scanner_session_date");if(n&&qe.test(n)&&n===e)return n}catch(n){j("read session date",n)}return e}),ee=r.useRef(null),mt=r.useRef(null),Ce=r.useRef(null),Se=r.useRef(null),ve=r.useRef(!1),gt=r.useRef(null),fr=r.useRef(!1),le=r.useRef(a.IDLE),Lt=r.useRef(null),de=r.useRef(null),nt=r.useRef(0),ze=r.useRef(null),ft=r.useRef(new Set),rt=r.useRef([]),ht=r.useRef({awb:"",hits:0,lastSeenAt:0}),rn=r.useRef(0),st=r.useRef(!1),sn=r.useRef(0),Me=r.useRef(null),hr=r.useRef(null),_t=r.useRef({message:"",at:0}),ge=r.useRef({lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]}),Ne=r.useRef(null),an=r.useRef(null),on=r.useRef({}),xt=r.useRef(null),bt=r.useRef(null),yt=r.useRef(null),u=r.useCallback(e=>{We(e)},[]),K=r.useCallback(e=>{Wt.current=e,ur(e)},[]),ae=r.useCallback(e=>{rn.current=e,pr(e)},[]),$t=r.useCallback((e,n="warning")=>{if(!e)return;const s=Date.now();_t.current.message===e&&s-_t.current.at<us||(_t.current={message:e,at:s},g(e),n&&v(n))},[]),cn=r.useCallback(e=>{K(0),ae(0),Pt("document"),g(e||'No barcode lock yet. Capture label instead or tap "Back to barcode mode" and hold steady.'),v("warning")},[K,ae]),wt=r.useCallback(()=>{const e=Jr({currentAttempts:rn.current,maxReframeAttempts:jt});if(e.action==="reframe"){ae(e.attempts),K(0),g(`No lock yet. Reframe ${e.attempts}/${jt}: move closer, reduce glare, keep barcode horizontal.`),v("retry");return}cn("No stable barcode lock after reframe retries. Capture label for OCR fallback.")},[cn,K,ae]),xr=r.useCallback(()=>{ie(""),g(""),u(a.CAPTURING)},[u]),ln=r.useCallback(e=>{const n=Date.now(),s=Xr({samples:rt.current,awb:e,now:n,stabilityWindowMs:cs,requiredHits:ls});return rt.current=s.samples,ht.current={awb:e,hits:s.hits,lastSeenAt:n},s.isStable},[]),Oe=r.useCallback(async()=>{var s;if(!sr())throw new Error("Camera requires HTTPS (or localhost). Open this page over https:// on your phone.");if(!((s=navigator==null?void 0:navigator.mediaDevices)!=null&&s.getUserMedia))throw new Error("Camera not supported on this browser/device.");if(!ee.current)throw new Error("Camera element not ready.");const e=ee.current.srcObject;if(e&&typeof e.getTracks=="function"&&e.getTracks().some(m=>m.readyState==="live")){await ee.current.play();return}let n=null;try{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}ee.current.srcObject=n,await ee.current.play()},[]);r.useEffect(()=>{const e=setInterval(()=>Ae(fs(Date.now()-N.startedAt)),3e4);return()=>clearInterval(e)},[N.startedAt]),r.useEffect(()=>{const e=()=>{const l=new Date,m=new Date(l);return m.setHours(24,0,0,0),m-l};let n;const s=()=>{n=setTimeout(()=>{const l=new Date().toISOString().slice(0,10);nn(l);try{localStorage.setItem("seahawk_scanner_session_date",l)}catch{}s()},e()+500)};return s(),()=>clearTimeout(n)},[]),r.useEffect(()=>{ft.current=N.scannedAwbs instanceof Set?N.scannedAwbs:new Set},[N.scannedAwbs]),r.useEffect(()=>{try{localStorage.setItem(z,JSON.stringify({scanNumber:Number(N.scanNumber||0),clientFreq:N.clientFreq||{},dominantClient:N.dominantClient||null,dominantClientCount:Number(N.dominantClientCount||0),startedAt:Number(N.startedAt||Date.now()),scannedItems:Array.isArray(N.scannedItems)?N.scannedItems:[],scannedAwbs:Array.from(N.scannedAwbs||[])}))}catch(e){j("persist session state",e)}},[N,z]),r.useEffect(()=>{try{me?localStorage.setItem(U,me):localStorage.removeItem(U)}catch(e){j("persist sticky client",e)}},[me,U]);const it=r.useCallback(e=>{et(e);try{e.length?localStorage.setItem(T,JSON.stringify(e)):localStorage.removeItem(T)}catch(n){j("persist offline queue",n)}},[T]),He=r.useCallback(e=>{const n={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:e};return it([...R,n]),n},[R,it]),dn=r.useCallback(async e=>{if(String((e==null?void 0:e.scanMode)||"").toLowerCase()==="fast_barcode_only"){await xe.post("/shipments/scan",{awb:e.awb,courier:"AUTO",captureOnly:!0,sessionContext:e.sessionContext||{}});return}await xe.post("/shipments/scan-mobile",{awb:e.awb,imageBase64:e.imageBase64,focusImageBase64:e.focusImageBase64||e.imageBase64,sessionContext:e.sessionContext||{}})},[]),at=r.useCallback(async()=>{var e;if(R.length){if(p){if(!navigator.onLine)return;const n=[];for(const s of R)if((e=s==null?void 0:s.payload)!=null&&e.awb)try{await dn(s.payload)}catch{n.push(s)}it(n),n.length?g(`Uploaded partially. ${n.length} scan(s) still queued.`):g("");return}!x||!x.connected||(R.forEach(n=>{var s;(s=n==null?void 0:n.payload)!=null&&s.awb&&x.emit("scanner:scan",n.payload)}),it([]))}},[p,x,R,it,dn]),G=r.useCallback(e=>{Ge(n=>{const s={...e,awb:String((e==null?void 0:e.awb)||"").trim().toUpperCase(),queueId:(e==null?void 0:e.queueId)||`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,date:Je(e==null?void 0:e.date,E),time:(e==null?void 0:e.time)||Date.now()},l={...n,scannedItems:[s,...n.scannedItems]};try{localStorage.setItem(D,String(l.scanNumber))}catch(m){j("persist daily count",m)}return l})},[D,E]),un=r.useCallback((e,n="")=>{e&&(Ge(s=>{const l=s.scannedItems.filter(C=>C.queueId!==e),m=new Set(s.scannedAwbs),f=String(n||"").trim().toUpperCase();return f&&m.delete(f),ft.current=m,{...s,scannedItems:l,scannedAwbs:m}}),lt(s=>s===e?"":s))},[]),br=r.useCallback(e=>{e!=null&&e.queueId&&(lt(e.queueId),ut(Je(e.date,E)))},[E]),yr=r.useCallback(()=>{lt(""),ut("")},[]),wr=r.useCallback(async e=>{if(!(e!=null&&e.queueId))return;const n=String(dt||"").trim();if(!qe.test(n)){window.alert("Please select a valid date.");return}pt(e.queueId);try{e.shipmentId&&await xe.put(`/shipments/${e.shipmentId}`,{date:n}),Ge(s=>({...s,scannedItems:s.scannedItems.map(l=>l.queueId===e.queueId?{...l,date:n}:l)})),lt(""),ut("")}catch(s){window.alert((s==null?void 0:s.message)||"Could not update consignment date.")}finally{pt("")}},[dt]),Cr=r.useCallback(async e=>{if(!(e!=null&&e.queueId))return;const n=String(e.awb||"").trim()||"this consignment",s=e.shipmentId?`Delete ${n}? This will remove it from accepted consignments and from the server.`:`Remove ${n} from accepted consignments?`;if(window.confirm(s)){pt(e.queueId);try{e.shipmentId&&await xe.delete(`/shipments/${e.shipmentId}`),un(e.queueId,e.awb)}catch(l){window.alert((l==null?void 0:l.message)||"Could not delete consignment.")}finally{pt("")}}},[un]);r.useEffect(()=>{xt.current=G},[G]),r.useEffect(()=>{an.current=c},[c]),r.useEffect(()=>{on.current=y},[y]);const Sr=r.useCallback(()=>{if(w!=="paired"){g(p?"Scanner is offline. Reconnect internet and retry.":"Phone is not connected to the desktop session.");return}if(g(""),S){u(a.SCANNING);return}Oe().then(()=>u(a.SCANNING)).catch(e=>g((e==null?void 0:e.message)||"Camera access failed."))},[w,Oe,u,S,p]),vr=r.useCallback(e=>{var s;e==null||e.preventDefault();const n=tt.trim().toUpperCase();if(!n||n.length<6){g("Enter a valid AWB number (min 6 chars)");return}if(w!=="paired"){g(p?"Scanner is offline. Reconnect internet and retry.":"Not connected to desktop session.");return}if(g(""),Jt(""),ie(n),S){we(!0),u(a.CAPTURING);return}if(I==="fast"){(s=Me.current)==null||s.call(Me,n);return}we(!0),u(a.CAPTURING)},[tt,w,u,S,p,I]),Nr=r.useCallback(()=>{if(window.confirm(p?"Exit this scanner session on the phone?":"End this mobile scanner session on the phone?")){try{localStorage.removeItem(z)}catch(e){j("clear session state on terminate",e)}if(p){b("/app/scan");return}x!=null&&x.connected?x.emit("scanner:end-session",{reason:"Mobile ended the session"}):b("/")}},[x,b,p,z]),kr=r.useCallback(()=>{if(R.length>0){at();return}window.alert(p?"No queued scans to upload.":"Everything is already synced.")},[R.length,at,p]);r.useEffect(()=>{le.current=k},[k]);const ke=r.useCallback((e=null)=>{e&&be(e),ue({}),g(""),u(a.CAPTURING)},[u]),Qe=r.useCallback(e=>{if(!e)return;const n=Ee(e.clientCode||""),s=Ee(me||n);be(e);const l=f=>{const C=String(f||"").trim().toUpperCase();return C==="UNKNOWN"||C==="N/A"||C==="NA"||C==="NONE"?"":String(f||"").trim()};if(L({clientCode:s,consignee:l(e.consignee),destination:l(e.destination),pincode:e.pincode||"",weight:e.weight||0,amount:e.amount||0,orderNo:e.orderNo||"",courier:Yt(e.courier||""),date:e.date||E||new Date().toISOString().slice(0,10)}),ue({}),e.reviewRequired){v("review"),Et(),u(a.REVIEWING);return}Ze(),v("success"),Ve&&Kt(`Auto approved. ${e.clientName||""}. ${e.destination||""}.`);const m={awb:e.awb,clientCode:s||e.clientCode,clientName:e.clientName,destination:e.destination||"",weight:e.weight||0,autoApproved:!0,shipmentId:e.shipmentId||null,date:Je(e.date,E)};W(m),G(m),u(a.SUCCESS)},[G,u,Ve,E,me]);r.useEffect(()=>{bt.current=ke},[ke]),r.useEffect(()=>{yt.current=Qe},[Qe]),r.useEffect(()=>{if(S){M("paired"),zt("Mock Mode"),g(""),u(a.IDLE);return}if(p){re(null),M("paired"),zt("Direct Mode"),g(""),u(a.IDLE);return}if(!d){g("No PIN provided.");return}const e=Hr(es,{auth:{scannerPin:d},transports:["websocket","polling"],reconnection:!0,reconnectionDelay:1500,reconnectionAttempts:20});return e.on("connect",()=>M("connecting")),e.on("scanner:paired",({userEmail:n})=>{M("paired"),zt(n?n.split("@")[0]:"Connected"),g("");const s=le.current;s===a.PROCESSING||s===a.REVIEWING||s===a.APPROVING||s===a.SUCCESS||u(a.IDLE)}),e.on("scanner:error",({message:n})=>{g(n),M("disconnected")}),e.on("scanner:session-ended",({reason:n})=>{M("disconnected"),g(n||"Session ended by desktop.");try{localStorage.removeItem(z)}catch(s){j("clear session state on end",s)}b("/")}),e.on("scanner:desktop-disconnected",({message:n})=>{M("paired"),g(n||"Desktop disconnected. Keep scanning; approvals will resume when desktop reconnects.")}),e.on("disconnect",()=>M("disconnected")),e.on("reconnect",()=>{const n=le.current;if(n===a.PROCESSING||n===a.REVIEWING||n===a.APPROVING||n===a.SUCCESS){M("paired");return}M("paired"),u(a.SCANNING)}),e.on("scanner:scan-processed",n=>{var l,m;const s=le.current;if(!(s!==a.PROCESSING&&s!==a.REVIEWING)){if(n.status==="error"){if(s!==a.PROCESSING)return;J("error"),X(),v("error"),u(a.ERROR),g(n.error||"Scan failed on desktop.");return}if(n.status==="photo_required"||n.requiresImageCapture){(l=bt.current)==null||l.call(bt,n);return}(m=yt.current)==null||m.call(yt,n)}}),e.on("scanner:approval-result",({success:n,message:s,awb:l,shipmentId:m})=>{var $;clearTimeout(de.current),de.current=null;const f=an.current||{},C=on.current||{};if(n){Et(),v("success"),J("success");const h=Ee(C.clientCode||"");h&&ct(h==="MISC"?"":h),h&&h!=="MISC"&&Ge(F=>{var Ie,Xe;const je={...F.clientFreq};je[h]=(je[h]||0)+1;const De=Object.entries(je).sort((Or,Br)=>Br[1]-Or[1]);return{...F,clientFreq:je,dominantClient:((Ie=De[0])==null?void 0:Ie[1])>=2?De[0][0]:null,dominantClientCount:((Xe=De[0])==null?void 0:Xe[1])||0}});const te={awb:(f==null?void 0:f.awb)||l,clientCode:C.clientCode,clientName:(f==null?void 0:f.clientName)||C.clientCode,destination:C.destination||"",weight:parseFloat(C.weight)||0,shipmentId:m||(f==null?void 0:f.shipmentId)||null,date:Je(C.date||(f==null?void 0:f.date),"")};W(te),($=xt.current)==null||$.call(xt,te),u(a.SUCCESS);return}le.current===a.APPROVING&&(X(),v("error"),g(s||"Approval failed. Please review and try again."),u(a.REVIEWING))}),e.on("scanner:ready-for-next",()=>{}),re(e),()=>{e.disconnect()}},[d,u,b,S,p,z]),r.useEffect(()=>{if(S||p||!x||w!=="paired"||!x.connected)return;const e=()=>{x.emit("scanner:heartbeat",{},()=>{})};e();const n=setInterval(e,os);return()=>clearInterval(n)},[x,w,S,p]),r.useEffect(()=>{try{const e=localStorage.getItem(T);if(!e)return;const n=JSON.parse(e);Array.isArray(n)&&n.length&&et(n)}catch(e){j("hydrate offline queue",e)}},[T]),r.useEffect(()=>{try{localStorage.setItem(Jn,I)}catch(e){j("persist workflow mode",e)}},[I]),r.useEffect(()=>{try{localStorage.setItem(Zn,Y)}catch(e){j("persist device profile",e)}},[Y]),r.useEffect(()=>{if(R.length){if(p){w==="paired"&&navigator.onLine&&at();return}w==="paired"&&(x!=null&&x.connected)&&at()}},[w,x,R.length,at,p]);const Ye=r.useCallback(async()=>{var e;try{if(we(!1),Ne.current&&Ne.current.stop(),Se.current){try{const n=Se.current;n!=null&&n.barcodeScanner&&await n.barcodeScanner.dispose()}catch(n){j("dispose scanbot camera scanner",n)}Se.current=null}if(Ce.current){try{await Ce.current.reset()}catch(n){j("reset camera scanner",n)}Ce.current=null}(e=ee.current)!=null&&e.srcObject&&(ee.current.srcObject.getTracks().forEach(n=>n.stop()),ee.current.srcObject=null)}catch(n){j("stopCamera",n)}},[]),Ke=r.useCallback(async()=>{try{if(Ot("idle"),Ne.current&&Ne.current.stop(),Se.current){try{await Se.current.barcodeScanner.dispose()}catch(e){j("dispose barcode scanner",e)}Se.current=null}if(Ce.current){try{Ce.current._type==="native"?Ce.current.reset():await Ce.current.reset()}catch(e){j("reset barcode scanner",e)}Ce.current=null}}catch(e){j("stopBarcodeScanner",e)}},[]),pn=r.useCallback(async()=>{if(ee.current){await Ke();try{nt.current=Date.now(),await Oe(),Ne.current||(Ne.current=Qr()),await Ne.current.start(ee.current,mt.current,{onDetected:(e,n)=>{var m;if(ve.current)return;K(0);const s=(n==null?void 0:n.format)||"unknown",l=(n==null?void 0:n.engine)||"unknown";lr({value:e,format:s,engine:l,at:Date.now(),sinceStartMs:nt.current?Date.now()-nt.current:null,candidateCount:(n==null?void 0:n.candidateCount)||1,ambiguous:!1,alternatives:(n==null?void 0:n.alternatives)||[]}),Ot(l),(m=ze.current)==null||m.call(ze,e,{candidateCount:(n==null?void 0:n.candidateCount)||1,ambiguous:!1,alternatives:(n==null?void 0:n.alternatives)||[],format:s,engine:l})},onFail:()=>{const e=Wt.current+1;K(e),e>=er&&wt()},onEngineReady:e=>{console.log(`[MobileScanner] Barcode engine ready: ${e}`),Ot(e)}})}catch(e){g("Camera access failed: "+e.message)}}},[Oe,Ke,wt,K]),mn=r.useCallback((e,n={})=>{var f;const s=String(e||"").trim().replace(/\s+/g,"").toUpperCase(),l=Yr(e)||s;if(ve.current||le.current!==a.SCANNING)return;if(!l||l.length<8){s.replace(/[^A-Z0-9]/g,"").length>=4&&$t("Partial barcode detected. Move closer so full AWB is visible.");return}if(n!=null&&n.ambiguous){const C=Wt.current+1;K(C),$t("Multiple barcodes detected. Keep only the AWB barcode inside the strip.","retry"),C>=er&&wt();return}if(!S&&!ln(l))return;if(ve.current=!0,ft.current.has(l)){v("duplicate"),X(),Fe(l),setTimeout(()=>{Fe(""),ve.current=!1,ht.current={awb:"",hits:0,lastSeenAt:0},rt.current=[]},2500);return}clearTimeout(Lt.current),v("lock"),Et(),ie(l);const m=nt.current?Date.now()-nt.current:null;if(Dt(m),ge.current={lockTimeMs:m,candidateCount:Number((n==null?void 0:n.candidateCount)||1),ambiguous:!!(n!=null&&n.ambiguous),alternatives:Array.isArray(n==null?void 0:n.alternatives)?n.alternatives.slice(0,3):[]},ae(0),K(0),g(""),Ge(C=>{const $={...C,scanNumber:C.scanNumber+1};return $.scannedAwbs=new Set(C.scannedAwbs),$.scannedAwbs.add(l),ft.current=$.scannedAwbs,$}),I==="fast"){(f=Me.current)==null||f.call(Me,l);return}we(!0),u(a.CAPTURING)},[u,ln,I,S,K,ae,$t,wt]);r.useEffect(()=>{ze.current=mn},[mn]),r.useEffect(()=>{if(k===a.SCANNING&&(ve.current=!1,ht.current={awb:"",hits:0,lastSeenAt:0},rt.current=[],ge.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},Dt(null),ae(0),K(0),Pt("barcode"),pn(),S&&P)){const e=setTimeout(()=>{var n;le.current===a.SCANNING&&((n=ze.current)==null||n.call(ze,P))},50);return()=>clearTimeout(e)}return()=>{k===a.SCANNING&&Ke()}},[k,pn,Ke,K,ae,S,P]);const gn=r.useCallback(async()=>{if(S){we(!0);return}await Ke();try{await Oe(),we(!0)}catch(e){g("Camera access failed: "+e.message)}},[Oe,Ke,S]);r.useEffect(()=>{k===a.CAPTURING&&gn()},[k,gn]);const Ct=r.useCallback(()=>{const e=ee.current,n=mt.current;return Kr(e,n)},[]);r.useEffect(()=>{if(k!==a.CAPTURING){V(!1),Q(0),_e({ok:!1,issues:[],metrics:null}),fr.current=!1,st.current=!1;return}const e=setInterval(()=>{const n=Ct();n&&(_e(n),V(n.ok),Q(s=>{const l=n.ok?Math.min(s+1,8):0;return l>=Qt&&!st.current&&(v("tap"),st.current=!0),n.ok||(st.current=!1),l}))},280);return()=>clearInterval(e)},[k,Ct]);const fn=r.useCallback((e={})=>{const n=ee.current,s=mt.current;if(!n||!s||!n.videoWidth)return null;const l=ar(n,s);if(!l)return null;const m=l.x,f=l.y,C=l.w,$=l.h;if(!C||!$)return null;const h=Math.max(640,Number(e.maxWidth||tr)),te=Math.min(.85,Math.max(.55,Number(e.quality||Pe))),F=document.createElement("canvas");F.width=Math.min(h,Math.round(C)),F.height=Math.round(F.width/C*$),F.getContext("2d").drawImage(n,m,f,C,$,0,0,F.width,F.height);const Ie=F.toDataURL("image/jpeg",te).split(",")[1]||"";if(!Ie)return null;const Xe=Math.floor(Ie.length*3/4);return{base64:Ie,width:F.width,height:F.height,approxBytes:Xe,quality:te}},[]),jr=r.useCallback(()=>{const e=Date.now();if(e-sn.current<ds)return;sn.current=e;const n=Ct()||O;if(!(n!=null&&n.ok)||Z<Qt){g(Qn(n==null?void 0:n.issues)||"Capture quality is low. Hold steady and align the AWB in the frame."),v("warning"),X();return}J("white"),ms(),v("tap");const s=fn({maxWidth:tr,quality:Pe});if(!(s!=null&&s.base64)){g("Could not capture image. Try again."),ve.current=!1;return}$e({kb:Math.round((s.approxBytes||0)/1024),width:s.width||0,height:s.height||0,quality:s.quality||Pe}),oe(`data:image/jpeg;base64,${s.base64}`),Ye(),u(a.PREVIEW)},[fn,Ye,u,Ct,O,Z]),Ir=r.useCallback(()=>{if(!S)return;const e="data:image/jpeg;base64,ZmFrZS1tb2NrLWltYWdl";$e({kb:0,width:0,height:0,quality:Pe}),oe(e),Ye(),u(a.PREVIEW)},[u,S,Ye]),Be=r.useCallback(()=>{var e,n,s;return{scanNumber:N.scanNumber,recentClient:N.dominantClient,dominantClient:N.dominantClient,dominantClientCount:N.dominantClientCount,stickyClientCode:me||void 0,sessionDurationMin:Math.round((Date.now()-N.startedAt)/6e4),sessionDate:E,scanWorkflowMode:I,scanMode:Re,deviceProfile:Y,hardwareClass:Y===ne.rugged?"rugged":"phone",captureQuality:{ok:!!O.ok,issues:Array.isArray(O.issues)?O.issues.slice(0,8):[],metrics:O.metrics||null},captureMeta:{kb:_.kb||0,width:_.width||0,height:_.height||0,quality:_.quality||Pe},lockTimeMs:Number.isFinite(Number((e=ge.current)==null?void 0:e.lockTimeMs))?Number(ge.current.lockTimeMs):null,lockCandidateCount:Number.isFinite(Number((n=ge.current)==null?void 0:n.candidateCount))?Number(ge.current.candidateCount):1,lockAlternatives:Array.isArray((s=ge.current)==null?void 0:s.alternatives)?ge.current.alternatives.slice(0,3):[]}},[N,E,I,Re,Y,O,_,me]),hn=r.useCallback(async e=>{var l,m;const n=String(e||"").trim().toUpperCase();if(!n)return;if(u(a.PROCESSING),S){setTimeout(()=>{const f={awb:n,clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25,date:E};W(f),G(f),u(a.SUCCESS)},120);return}const s={awb:n,imageBase64:null,focusImageBase64:null,scanMode:"fast_barcode_only",sessionContext:Be()};if(p){if(!navigator.onLine){He(s),Ze(),v("success");const f={awb:n,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0,date:E};W({...f,offlineQueued:!0}),G(f),u(a.SUCCESS);return}try{const f=await xe.post("/shipments/scan",{awb:n,courier:"AUTO",captureOnly:!0,sessionContext:Be()}),C=((l=f==null?void 0:f.data)==null?void 0:l.shipment)||{},$={awb:C.awb||n,clientCode:C.clientCode||"MISC",clientName:((m=C.client)==null?void 0:m.company)||C.clientCode||"Scanned",destination:C.destination||"",weight:C.weight||0,shipmentId:C.id||null,date:Je(C.date,E)};W($),G($),Ze(),v("success"),u(a.SUCCESS)}catch(f){g((f==null?void 0:f.message)||"Barcode processing failed. Please try again."),X(),v("error"),u(a.ERROR)}return}if(!x||!x.connected||w!=="paired"){He(s),Ze(),v("success");const f={awb:n,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0,date:E};W({...f,offlineQueued:!0}),G(f),u(a.SUCCESS);return}x.emit("scanner:scan",s),setTimeout(()=>{le.current===a.PROCESSING&&(g("Barcode processing timed out. Please try scanning again."),X(),v("error"),u(a.ERROR))},ts)},[x,w,u,S,He,G,Be,p,E]);r.useEffect(()=>{Me.current=hn},[hn]);const xn=r.useCallback(async e=>{const n=String(e||"").trim().toUpperCase();if(!n)return;if(u(a.PROCESSING),S){u(a.CAPTURING);return}const s={awb:n,scanMode:"lookup_first",sessionContext:Be()};if(p){if(!navigator.onLine){ke({awb:n,status:"photo_required",requiresImageCapture:!0});return}try{const l=await xe.post("/shipments/scan-mobile",s),m=(l==null?void 0:l.data)||l;if(m.status==="error"||!m.success){J("error"),X(),v("error"),u(a.ERROR),g(m.error||m.message||"Lookup failed.");return}if(m.status==="photo_required"||m.requiresImageCapture){ke(m);return}Qe(m)}catch(l){g((l==null?void 0:l.message)||"Lookup failed. Please try again."),X(),v("error"),u(a.ERROR)}return}if(!x||!x.connected||w!=="paired"){ke({awb:n,status:"photo_required",requiresImageCapture:!0});return}x.emit("scanner:scan",s),setTimeout(()=>{le.current===a.PROCESSING&&(g("Lookup timed out. Capture the label photo and continue."),u(a.CAPTURING))},ns)},[x,w,u,S,Be,p,ke,Qe]);r.useEffect(()=>{hr.current=xn},[xn]);const Er=r.useCallback(async()=>{if(!H)return;if(u(a.PROCESSING),S){setTimeout(()=>{const s={awb:A||"100454974120",clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25,date:E};W(s),G(s),u(a.SUCCESS)},250);return}const e=H.split(",")[1]||H,n={awb:A||"",imageBase64:e,focusImageBase64:e,scanMode:"ocr_label",sessionContext:Be()};if(p){if(!navigator.onLine){He(n),Ze(),v("success");const s={awb:A||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0,date:E};W({...s,offlineQueued:!0}),G(s),u(a.SUCCESS);return}try{const s=await xe.post("/shipments/scan-mobile",n),l=(s==null?void 0:s.data)||s;if(l.status==="error"||!l.success){J("error"),X(),v("error"),u(a.ERROR),g(l.error||l.message||"Scan failed.");return}if(l.status==="photo_required"||l.requiresImageCapture){ke(l);return}Qe(l)}catch(s){g((s==null?void 0:s.message)||"Server error. Please try again."),X(),v("error"),u(a.ERROR)}return}if(!x||!x.connected||w!=="paired"){He(n),Ze(),v("success");const s={awb:A||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0,date:E};W({...s,offlineQueued:!0}),G(s),u(a.SUCCESS);return}x.emit("scanner:scan",n),setTimeout(()=>{le.current===a.PROCESSING&&(g("OCR timed out after 40 seconds. Retake the label photo and try again."),X(),v("error"),u(a.ERROR))},4e4)},[x,A,H,u,w,He,G,S,Be,p,Qe,ke,E]),Fr=r.useCallback(async()=>{var C,$;if(!c)return;u(a.APPROVING);let e=!1;const n=y.date||E||new Date().toISOString().slice(0,10);if(S){setTimeout(()=>{const h={awb:c.awb||A,clientCode:y.clientCode||"MOCKCL",clientName:c.clientName||y.clientCode||"Mock Client",destination:y.destination||"",weight:parseFloat(y.weight)||0,shipmentId:c.shipmentId||null,date:n};W(h),G(h),J("success"),e=!0,u(a.SUCCESS)},200);return}const s={clientCode:c.clientCode||"",clientName:c.clientName||"",consignee:c.consignee||"",destination:c.destination||""},l={clientCode:y.clientCode||"",clientName:y.clientCode||"",consignee:y.consignee||"",destination:y.destination||""},m={clientCode:y.clientCode,consignee:y.consignee,destination:y.destination,pincode:y.pincode,weight:parseFloat(y.weight)||0,amount:parseFloat(y.amount)||0,orderNo:y.orderNo||"",courier:y.courier||"",date:n};if(p)try{(c.ocrExtracted||c)&&await xe.post("/shipments/learn-corrections",{ocrFields:s,approvedFields:l});let h=null;if(c.shipmentId){const F=await xe.put(`/shipments/${c.shipmentId}`,m);h=(F==null?void 0:F.data)||null}else{const F=await xe.post("/shipments",{awb:c.awb||A,...m});h=(F==null?void 0:F.data)||null}Et(),v("success"),J("success");const te={awb:(h==null?void 0:h.awb)||(c==null?void 0:c.awb)||A,clientCode:(h==null?void 0:h.clientCode)||y.clientCode,clientName:(c==null?void 0:c.clientName)||((C=h==null?void 0:h.client)==null?void 0:C.company)||y.clientCode,destination:(h==null?void 0:h.destination)||y.destination||"",weight:parseFloat((h==null?void 0:h.weight)??y.weight)||0,shipmentId:(h==null?void 0:h.id)||(c==null?void 0:c.shipmentId)||null,date:Je(h==null?void 0:h.date,n)};W(te),G(te),e=!0,u(a.SUCCESS)}catch(h){u(a.REVIEWING),X(),v("error"),g((h==null?void 0:h.message)||"Approval failed.")}else{if(!x){u(a.REVIEWING),g("Not connected to desktop session.");return}(c.ocrExtracted||c)&&x.emit("scanner:learn-corrections",{pin:d,ocrFields:s,approvedFields:l,courier:(c==null?void 0:c.courier)||(($=c==null?void 0:c.ocrExtracted)==null?void 0:$.courier)||"",deviceProfile:Y}),x.emit("scanner:approval-submit",{shipmentId:c.shipmentId,awb:c.awb||A,fields:m},h=>{h!=null&&h.success||(clearTimeout(de.current),de.current=null,u(a.REVIEWING),X(),v("error"),g((h==null?void 0:h.message)||"Approval failed."))}),clearTimeout(de.current),de.current=setTimeout(()=>{le.current===a.APPROVING&&(X(),v("error"),g("Save confirmation timed out. Please tap Approve & Save again."),u(a.REVIEWING))},rs)}const f=Ee(y.clientCode||"");e&&f&&ct(f==="MISC"?"":f),e&&f&&f!=="MISC"&&Ge(h=>{var je,De;const te={...h.clientFreq};te[f]=(te[f]||0)+1;const F=Object.entries(te).sort((Ie,Xe)=>Xe[1]-Ie[1]);return{...h,clientFreq:te,dominantClient:((je=F[0])==null?void 0:je[1])>=2?F[0][0]:null,dominantClientCount:((De=F[0])==null?void 0:De[1])||0}})},[x,c,y,A,d,u,G,S,Y,p,E]),ot=r.useCallback((e=a.IDLE)=>{clearTimeout(gt.current),clearTimeout(Lt.current),clearTimeout(de.current),de.current=null,ie(""),oe(null),$e({kb:0,width:0,height:0,quality:Pe}),be(null),L({}),ue({}),W(null),Dt(null),g(""),Fe(""),V(!1),Q(0),_e({ok:!1,issues:[],metrics:null}),ve.current=!1,ht.current={awb:"",hits:0,lastSeenAt:0},rt.current=[],ge.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},st.current=!1,ae(0),u(e)},[u,ae]);r.useEffect(()=>{if(k===a.SUCCESS){const e=I==="fast"?a.SCANNING:a.IDLE,n=I==="fast"?Xn:Kn;return gt.current=setTimeout(()=>ot(e),n),()=>clearTimeout(gt.current)}},[k,ot,I]),r.useEffect(()=>{if(Ve)if(k===a.REVIEWING&&c){const e=[c.clientName||c.clientCode,c.destination,c.weight?`${c.weight} kilograms`:""].filter(Boolean);e.length&&Kt(e.join(". "))}else k===a.SUCCESS&&q&&Kt(`${q.clientName||q.clientCode||"Shipment"} Verified.`)},[Ve,k,c,q]),r.useEffect(()=>()=>{Ye(),clearTimeout(gt.current),clearTimeout(Lt.current),clearTimeout(de.current)},[Ye]);const fe=e=>`msp-step ${k===e?"active":""}`,bn=Math.max(1,Math.round((I==="fast"?Xn:Kn)/1e3)),Ar=O.ok?"AWB quality looks good - press shutter":Qn(O.issues)||"Fit AWB slip fully in frame and hold steady",yn=Ue&&O.ok&&Z>=Qt,he=r.useMemo(()=>{if(!c)return{};const e=c.ocrExtracted||c;return{clientCode:{confidence:(e==null?void 0:e.clientNameConfidence)||0,source:(e==null?void 0:e.clientNameSource)||null},consignee:{confidence:(e==null?void 0:e.consigneeConfidence)||0,source:(e==null?void 0:e.consigneeSource)||null},destination:{confidence:(e==null?void 0:e.destinationConfidence)||0,source:(e==null?void 0:e.destinationSource)||null},pincode:{confidence:(e==null?void 0:e.pincodeConfidence)||0,source:(e==null?void 0:e.pincodeSource)||null},weight:{confidence:(e==null?void 0:e.weightConfidence)||0,source:(e==null?void 0:e.weightSource)||null}}},[c]),Rr=r.useCallback(()=>{L(e=>{const n=Yt(e.courier||(c==null?void 0:c.courier)||""),s=It.findIndex(m=>m.toUpperCase()===n.toUpperCase()),l=It[(s+1+It.length)%It.length];return{...e,courier:l}})},[c]),St=r.useMemo(()=>{const e=Object.values(he).map(m=>Number((m==null?void 0:m.confidence)||0)).filter(m=>m>0),n=e.length?e.reduce((m,f)=>m+f,0)/e.length:0,s=or(n);return{score:n,level:s,label:s==="high"?"High Confidence":s==="med"?"Medium Confidence":"Low Confidence"}},[he]),Tr=Yt(y.courier||(c==null?void 0:c.courier)||((vn=c==null?void 0:c.ocrExtracted)==null?void 0:vn.courier)||""),wn=y.date||(c==null?void 0:c.date)||E||"",zr=r.useMemo(()=>nr(wn),[wn]),Cn=N.scannedItems.reduce((e,n)=>e+(n.weight||0),0),B=((Nn=c==null?void 0:c.ocrExtracted)==null?void 0:Nn.intelligence)||(c==null?void 0:c.intelligence)||null,Sn=(jn=(kn=(vt=Ne.current)==null?void 0:vt.getDiagnostics)==null?void 0:kn.call(vt))==null?void 0:jn.wasmFailReason,Mr=[["Step",k],["Connection",w],["Engine",Zt],...Sn?[["WASM Error",Sn]]:[],["Workflow",I],["Device",Y],["Scan mode",Re],["Fail count",String(dr)],["Reframe retries",`${Bt}/${jt}`],["Camera",Ue?"ready":"waiting"],["Doc detect",ce?`yes (${Z})`:"no"],["Capture quality",O.ok?"good":O.issues.join(", ")||"pending"],["Capture metrics",O.metrics?`blur ${O.metrics.blurScore} | glare ${O.metrics.glareRatio}% | skew ${O.metrics.perspectiveSkew}%`:"-"],["JPEG last shot",_.kb?`${_.kb}KB ${_.width}x${_.height} q=${_.quality}`:"-"],["Secure ctx",sr()?"yes":"no"],["AWB lock",A||"-"],["Lock ms",en!=null?String(en):"-"],["Lock candidates",String(((In=ge.current)==null?void 0:In.candidateCount)||1)],["Queued",String(R.length)],["Scans",String(N.scanNumber)],["Last format",(pe==null?void 0:pe.format)||"-"],["Last code",(pe==null?void 0:pe.value)||"-"],["Decode ms",(pe==null?void 0:pe.sinceStartMs)!=null?String(pe.sinceStartMs):"-"],["False-lock",(En=c==null?void 0:c.scanTelemetry)!=null&&En.falseLock?"yes":"no"]];return t.jsxs(t.Fragment,{children:[t.jsx("style",{children:gs}),t.jsxs("div",{className:"msp-root",children:[ye&&t.jsx("div",{className:`flash-overlay flash-${ye}`,onAnimationEnd:()=>J(null)}),Le&&t.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[t.jsx(Pn,{size:48,color:"white"}),t.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),t.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:Le}),t.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),t.jsx("button",{type:"button","data-testid":"scanner-diag-toggle",onClick:()=>cr(e=>!e),style:{position:"fixed",top:12,right:12,zIndex:70,border:"1px solid rgba(255,255,255,0.18)",background:Mt?"rgba(79,70,229,0.92)":"rgba(15,23,42,0.72)",color:"#fff",borderRadius:999,padding:"8px 12px",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.04em",backdropFilter:"blur(10px)",cursor:"pointer"},children:Mt?"Hide Diag":"Show Diag"}),Mt&&t.jsxs("div",{"data-testid":"scanner-diag-panel",style:{position:"fixed",top:56,right:12,zIndex:69,width:"min(92vw, 320px)",background:"rgba(15,23,42,0.88)",color:"#E5EEF8",border:"1px solid rgba(255,255,255,0.12)",borderRadius:18,padding:14,backdropFilter:"blur(14px)",boxShadow:"0 12px 30px rgba(0,0,0,0.25)"},children:[t.jsx("div",{style:{fontSize:"0.72rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10,color:"#A5B4FC"},children:"Scanner Diagnostics"}),t.jsx("div",{style:{display:"grid",gap:6},children:Mr.map(([e,n])=>t.jsxs("div",{style:{display:"flex",gap:8,justifyContent:"space-between",alignItems:"flex-start",fontSize:"0.76rem"},children:[t.jsx("div",{style:{color:"rgba(226,232,240,0.72)",minWidth:88},children:e}),t.jsx("div",{className:"mono",style:{textAlign:"right",wordBreak:"break-word",maxWidth:180},children:n})]},e))}),t.jsx("div",{style:{marginTop:10,fontSize:"0.68rem",color:"rgba(226,232,240,0.7)",lineHeight:1.4},children:"Use this to verify whether Trackon labels are being decoded as `ITF` and how quickly the first lock happens after scan start."})]}),w!=="paired"&&t.jsx("div",{className:fe(a.IDLE),children:t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},children:[t.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:w==="connecting"?t.jsx(Nt,{size:28,color:i.primary,style:{animation:"spin 1s linear infinite"}}):t.jsx(qn,{size:28,color:i.error})}),t.jsxs("div",{style:{textAlign:"center"},children:[t.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:w==="connecting"?"Connecting...":"Disconnected"}),t.jsx("div",{style:{fontSize:"0.82rem",color:i.muted},children:se||(p?"Preparing direct scanner session":`Connecting to session ${d}`)})]}),w==="disconnected"&&t.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[t.jsx(Nt,{size:16})," Reconnect"]})]})}),t.jsx("video",{ref:ee,autoPlay:!0,playsInline:!0,muted:!0,onClick:()=>{Oe().catch(e=>{g((e==null?void 0:e.message)||"Camera access failed.")})},style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(k===a.SCANNING||k===a.CAPTURING)&&!Se.current?"block":"none"}}),t.jsx("div",{className:fe(a.IDLE),children:t.jsxs("div",{className:"home-root",children:[t.jsxs("div",{className:"home-header",children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16},children:[t.jsxs("button",{onClick:()=>b("/app/scan"),style:{background:"white",border:"1px solid #E2E8F0",padding:"6px 12px",borderRadius:20,fontSize:"0.75rem",fontWeight:600,color:"#475569",display:"flex",alignItems:"center",gap:4,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.02)"},children:[t.jsx(qr,{size:14})," Go Back"]}),t.jsxs("div",{className:"home-logo-badge",children:[t.jsx(Wn,{size:11,color:w==="paired"&&navigator.onLine?"#10B981":"#EF4444"}),Tt]})]}),t.jsx("div",{className:"home-logo-row",children:t.jsxs("div",{className:"home-logo-text",children:[t.jsx("img",{src:"/images/logo.png",alt:"Sea Hawk Logo",style:{height:28,width:"auto",objectFit:"contain",padding:2,background:"white",borderRadius:6,border:"1px solid #E2E8F0"}}),t.jsx("span",{children:"Seahawk Scanner"})]})}),t.jsxs("div",{className:"home-stats-row",children:[t.jsxs("div",{className:"home-stat-card",children:[t.jsx("div",{className:"home-stat-val",children:N.scanNumber}),t.jsx("div",{className:"home-stat-label",children:"Scanned"})]}),t.jsxs("div",{className:"home-stat-card",children:[t.jsx("div",{className:"home-stat-val",children:Cn>0?Cn.toFixed(1):"0"}),t.jsx("div",{className:"home-stat-label",children:"Total kg"})]}),t.jsxs("div",{className:"home-stat-card",children:[t.jsx("div",{className:"home-stat-val",children:Rt}),t.jsx("div",{className:"home-stat-label",children:"Session"})]})]}),t.jsxs("div",{className:"home-date-chip",children:[t.jsx(Ut,{size:18,color:"#38BDF8"}),t.jsxs("div",{children:[t.jsx("div",{className:"home-date-label",children:"Scan Date"}),t.jsxs("div",{className:"home-date-value",children:[new Date(E+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}),E===new Date().toISOString().slice(0,10)&&t.jsx("span",{style:{fontSize:"0.65rem",color:"#10B981",marginLeft:6,fontWeight:500},children:"TODAY"})]})]}),t.jsx("div",{className:"home-date-change",children:"Change ▸"}),t.jsx("input",{type:"date",value:E,max:new Date().toISOString().slice(0,10),onChange:e=>{const n=e.target.value;if(n&&qe.test(n)){nn(n);try{localStorage.setItem("seahawk_scanner_session_date",n)}catch(s){j("persist session date",s)}v("light")}}})]})]}),t.jsxs("div",{className:"home-scan-section",children:[t.jsxs("div",{className:"home-scan-btn-wrap",children:[t.jsx("div",{className:"home-scan-ring"}),t.jsx("div",{className:"home-scan-ring home-scan-ring2"}),t.jsxs("button",{"data-testid":"start-scan-btn",className:"home-scan-btn",onClick:Sr,children:[t.jsx(Gt,{size:34,color:"white"}),t.jsx("span",{className:"home-scan-btn-label",children:"Scan"})]})]}),t.jsx("div",{className:"home-cta-text",children:N.scanNumber===0?"Tap to start your first scan":"Tap to scan next parcel"}),t.jsxs("div",{style:{display:"flex",gap:8,marginTop:14,width:"100%",maxWidth:320},children:[t.jsxs("button",{type:"button","data-testid":"workflow-fast-btn",onClick:()=>qt("fast"),style:{flex:1,borderRadius:999,border:`1px solid ${I==="fast"?i.primary:i.border}`,background:I==="fast"?i.primaryLight:i.surface,color:I==="fast"?i.primary:i.muted,fontWeight:700,fontSize:"0.72rem",padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[t.jsx(Ln,{size:13})," Fast scan"]}),t.jsxs("button",{type:"button","data-testid":"workflow-ocr-btn",onClick:()=>qt("ocr"),style:{flex:1,borderRadius:999,border:`1px solid ${I==="ocr"?i.primary:i.border}`,background:I==="ocr"?i.primaryLight:i.surface,color:I==="ocr"?i.primary:i.muted,fontWeight:700,fontSize:"0.72rem",padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[t.jsx(Vt,{size:13})," OCR label"]})]}),t.jsxs("div",{style:{display:"flex",gap:8,marginTop:8,width:"100%",maxWidth:320},children:[t.jsxs("button",{type:"button","data-testid":"device-profile-phone-btn",onClick:()=>tn(ne.phone),style:{flex:1,borderRadius:999,border:`1px solid ${Y===ne.phone?i.primary:i.border}`,background:Y===ne.phone?i.primaryLight:i.surface,color:Y===ne.phone?i.primary:i.muted,fontWeight:700,fontSize:"0.7rem",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[t.jsx(Gt,{size:13})," Phone lens"]}),t.jsxs("button",{type:"button","data-testid":"device-profile-rugged-btn",onClick:()=>tn(ne.rugged),style:{flex:1,borderRadius:999,border:`1px solid ${Y===ne.rugged?i.primary:i.border}`,background:Y===ne.rugged?i.primaryLight:i.surface,color:Y===ne.rugged?i.primary:i.muted,fontWeight:700,fontSize:"0.7rem",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[t.jsx(_n,{size:13})," Rugged"]})]}),t.jsxs("form",{onSubmit:vr,style:{width:"100%",maxWidth:300,marginTop:20},children:[t.jsx("div",{style:{fontSize:"0.62rem",fontWeight:700,color:i.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6,textAlign:"center"},children:"Can't scan? Enter AWB manually"}),t.jsxs("div",{style:{display:"flex",gap:6},children:[t.jsx("input",{"data-testid":"manual-awb-input",value:tt,onChange:e=>Jt(e.target.value.toUpperCase()),placeholder:"e.g. 1234567890",inputMode:"text",autoCapitalize:"characters",style:{flex:1,padding:"9px 12px",border:`1.5px solid ${i.border}`,borderRadius:10,fontFamily:"JetBrains Mono, monospace",fontSize:"0.82rem",fontWeight:600,background:i.surface,color:i.text,outline:"none"},onFocus:e=>e.target.style.borderColor=i.primary,onBlur:e=>e.target.style.borderColor=i.border}),t.jsx("button",{type:"submit","data-testid":"manual-awb-submit",disabled:tt.trim().length<6,className:"btn btn-primary",style:{padding:"9px 14px",fontSize:"0.78rem",borderRadius:10,opacity:tt.trim().length>=6?1:.45},children:"Go →"})]})]}),t.jsxs("div",{className:"action-buttons-row",children:[t.jsxs("button",{className:"action-btn",onClick:kr,children:[t.jsx(Wr,{size:14})," ",R.length>0?`Upload (${R.length})`:"Synced"]}),t.jsxs("button",{className:"action-btn danger",onClick:Nr,children:[t.jsx($n,{size:14})," End Session"]})]}),R.length>0&&t.jsxs("div",{style:{marginTop:14,fontSize:"0.7rem",color:i.warning,fontWeight:600,display:"flex",alignItems:"center",gap:5},children:[t.jsx(Un,{size:12})," ",R.length," offline scan",R.length>1?"s":""," pending sync"]})]}),t.jsxs("div",{className:"home-queue-section",children:[t.jsxs("div",{className:"home-queue-head",children:[t.jsxs("div",{className:"home-queue-title-text",children:[t.jsx(Lr,{size:11}),"Accepted Consignments"]}),N.scannedItems.length>0&&t.jsx("div",{className:"home-queue-badge",children:N.scannedItems.length})]}),t.jsx("div",{className:"home-queue-list",children:N.scannedItems.length===0?t.jsxs("div",{className:"queue-empty",children:[t.jsx(Ht,{size:36,color:"rgba(255,255,255,0.12)"}),t.jsxs("div",{className:"queue-empty-text",children:["No consignments scanned yet.",t.jsx("br",{}),"Tap the button above to begin."]})]}):N.scannedItems.map((e,n)=>t.jsxs("div",{className:"queue-item",children:[t.jsx("div",{className:"queue-check",children:t.jsx(Gn,{size:13,color:"#10B981"})}),t.jsxs("div",{className:"queue-main",children:[t.jsxs("div",{className:"queue-main-top",children:[t.jsx("div",{className:"queue-awb",children:e.awb}),e.weight>0&&t.jsxs("div",{className:"queue-weight",children:[e.weight,"kg"]})]}),t.jsxs("div",{className:"queue-meta",children:[e.clientCode==="OFFLINE"?t.jsx("span",{className:"queue-offline-tag",children:"Offline"}):e.clientCode&&t.jsx("span",{className:"queue-client-tag",children:e.clientCode}),e.destination&&t.jsx("span",{children:e.destination}),e.date&&t.jsx("span",{className:"queue-date-tag",children:nr(e.date)})]}),gr===e.queueId?t.jsxs("div",{className:"queue-date-editor",children:[t.jsx("input",{type:"date",className:"queue-date-input",value:dt,max:new Date().toISOString().slice(0,10),onChange:s=>ut(s.target.value),disabled:Te===e.queueId}),t.jsx("button",{type:"button",className:"queue-action-btn primary",onClick:()=>wr(e),disabled:Te===e.queueId||!qe.test(dt),children:Te===e.queueId?"Saving...":"Save"}),t.jsx("button",{type:"button",className:"queue-action-btn",onClick:yr,disabled:Te===e.queueId,children:"Cancel"})]}):t.jsxs("div",{className:"queue-actions",children:[t.jsxs("button",{type:"button",className:"queue-action-btn",onClick:()=>br(e),disabled:Te===e.queueId,children:[t.jsx(Ut,{size:12})," Edit Date"]}),t.jsxs("button",{type:"button",className:"queue-action-btn danger",onClick:()=>Cr(e),disabled:Te===e.queueId,children:[t.jsx($n,{size:12})," ",Te===e.queueId?"Deleting...":"Delete"]})]})]})]},e.queueId||`${e.awb}-${n}`))})]})]})}),t.jsx("div",{className:fe(a.SCANNING),children:t.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[t.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:Se.current?"block":"none"}}),t.jsx("div",{className:"cam-overlay",children:t.jsxs("div",{className:"scan-guide",style:Re==="barcode"?{width:Yn.w,height:Yn.h,borderRadius:10,maxHeight:"20vw",transition:"all 0.4s ease",borderColor:se?"rgba(248,113,113,0.92)":void 0,boxShadow:se?"0 0 0 3px rgba(248,113,113,0.2)":void 0}:{width:kt.w,height:kt.h,borderRadius:14,maxHeight:"75vh",transition:"all 0.4s ease",borderColor:"rgba(251,191,36,0.85)",boxShadow:"0 0 0 3px rgba(251,191,36,0.2)"},children:[t.jsx("div",{className:"scan-guide-corner corner-tl"}),t.jsx("div",{className:"scan-guide-corner corner-tr"}),t.jsx("div",{className:"scan-guide-corner corner-bl"}),t.jsx("div",{className:"scan-guide-corner corner-br"}),Re==="barcode"&&t.jsx("div",{className:"scan-laser",children:t.jsx("div",{className:"scan-laser-spark"})})]})}),t.jsxs("div",{className:"cam-hud",children:[t.jsxs("div",{className:"cam-hud-chip",children:[t.jsx(Wn,{size:12})," ",p?"DIRECT":d]}),t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[Re==="document"&&t.jsxs("div",{className:"cam-hud-chip",style:{background:"rgba(251,191,36,0.22)",color:"#FDE68A",fontWeight:700,fontSize:"0.65rem",gap:4},children:[t.jsx(Vn,{size:11})," LABEL MODE"]}),t.jsxs("div",{className:"cam-hud-chip",style:{gap:4},children:[t.jsx(Ht,{size:12})," ",N.scanNumber,Zt==="native"?t.jsx("span",{style:{color:"#34D399",fontSize:"0.6rem",fontWeight:800},children:"⚡ NATIVE"}):t.jsx("span",{style:{color:"#F59E0B",fontSize:"0.6rem",fontWeight:800},children:"ZXING"})]})]})]}),t.jsxs("div",{className:"cam-bottom",children:[Re==="barcode"?t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:6,color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:[t.jsx("div",{children:I==="fast"?"Align barcode inside the strip - auto-save on lock":"Align barcode inside the strip - camera opens for label capture after lock"}),Bt>0&&t.jsxs("div",{style:{color:"#FDE68A",fontSize:"0.74rem",fontWeight:700},children:["Reframe retry ",Bt,"/",jt]}),!!se&&t.jsx("div",{style:{color:"#FCA5A5",fontSize:"0.72rem",fontWeight:700},children:se})]}):t.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:6},children:[t.jsx("div",{style:{color:"rgba(251,191,36,0.95)",fontSize:"0.82rem",fontWeight:700,textAlign:"center"},children:"No barcode found - capture the label and we will read the printed AWB"}),t.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"},children:[t.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:xr,children:"Capture label instead"}),t.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:()=>{K(0),ae(0),g(""),Pt("barcode"),v("tap")},children:"Back to barcode mode"})]})]}),t.jsxs("div",{style:{display:"flex",gap:12},children:[t.jsxs("button",{className:"cam-hud-chip",onClick:()=>qt(e=>e==="fast"?"ocr":"fast"),style:{border:"none",cursor:"pointer",gap:5},children:[I==="fast"?t.jsx(Ln,{size:13}):t.jsx(Vt,{size:13}),I==="fast"?"FAST":"OCR"]}),t.jsx("button",{className:"cam-hud-chip",onClick:()=>mr(!Ve),style:{border:"none",cursor:"pointer"},children:Ve?t.jsx(_r,{size:14}):t.jsx($r,{size:14})})]})]})]})}),t.jsx("div",{className:fe(a.CAPTURING),children:t.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!Ue&&t.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[t.jsx(Ur,{size:44,color:"#34D399"}),t.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:A||"OCR fallback"}),t.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:A?"Barcode locked - Preparing camera...":"Preparing label capture for printed AWB OCR..."})]}),t.jsx("div",{className:"cam-overlay",children:t.jsxs("div",{ref:mt,className:`scan-guide ${ce?"detected":""}`,style:{width:kt.w,height:kt.h,maxHeight:"75vh",borderRadius:12},children:[t.jsx("div",{className:"scan-guide-corner corner-tl"}),t.jsx("div",{className:"scan-guide-corner corner-tr"}),t.jsx("div",{className:"scan-guide-corner corner-bl"}),t.jsx("div",{className:"scan-guide-corner corner-br"})]})}),t.jsxs("div",{className:"cam-hud",children:[t.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[t.jsx(Vn,{size:12})," ",A||"OCR AWB capture"]}),R.length>0&&t.jsxs("div",{className:"cam-hud-chip",children:[t.jsx(Un,{size:12})," ",R.length," queued"]})]}),t.jsxs("div",{className:"cam-bottom",children:[t.jsx("div",{style:{color:ce?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center",transition:"color 0.3s"},children:Ar}),O.metrics&&t.jsxs("div",{style:{color:"rgba(255,255,255,0.66)",fontSize:"0.72rem",textAlign:"center"},children:["Blur ",O.metrics.blurScore," | Glare ",O.metrics.glareRatio,"% | Skew ",O.metrics.perspectiveSkew,"%"]}),t.jsx("button",{className:"capture-btn","data-testid":"capture-photo-btn",onClick:jr,disabled:!yn,style:{opacity:yn?1:.4},children:t.jsx("div",{className:"capture-btn-inner"})}),S&&t.jsx("button",{type:"button","data-testid":"mock-capture-btn",onClick:Ir,style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 12px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:"Mock capture"}),t.jsx("button",{style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},onClick:()=>{ie(""),g(""),K(0),ae(0),ve.current=!1,v("tap"),u(a.SCANNING)},children:"← Rescan barcode"})]})]})}),t.jsx("div",{className:fe(a.PREVIEW),children:t.jsxs("div",{style:{background:i.bg,display:"flex",flexDirection:"column",height:"100%"},children:[t.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${i.border}`},children:t.jsxs("div",{children:[t.jsx("div",{style:{fontSize:"0.72rem",color:i.muted,fontWeight:600},children:"CAPTURED"}),t.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:A||"Printed AWB OCR"}),_.kb>0&&t.jsxs("div",{style:{fontSize:"0.68rem",color:i.mutedLight},children:[_.kb,"KB • ",_.width,"×",_.height]})]})}),t.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:H&&t.jsx("img",{src:H,alt:"Captured label",className:"preview-img"})}),t.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[t.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{oe(null),u(a.CAPTURING)},children:[t.jsx(Hn,{size:16})," Retake"]}),t.jsxs("button",{"data-testid":"use-photo-btn",className:"btn btn-primary",style:{flex:2},onClick:Er,children:[t.jsx(Gr,{size:16})," Use Photo"]})]})]})}),t.jsx("div",{className:fe(a.PROCESSING),children:t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16},children:[t.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[t.jsx(Vt,{size:22,color:i.primary,style:{animation:"spin 2s linear infinite"}}),t.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:i.primary},children:"Intelligence Engine"})]}),t.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:i.muted},children:A}),t.jsx("div",{style:{fontSize:"0.72rem",color:i.mutedLight,marginTop:6},children:H?"Reading AWB label with local OCR...":"Saving barcode scan..."})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(e=>t.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{className:"field-label",children:e}),t.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),t.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},e)),t.jsx("div",{style:{textAlign:"center",marginTop:8},children:t.jsx("button",{className:"btn btn-outline",style:{fontSize:"0.75rem",padding:"8px 20px"},onClick:()=>{g("Cancelled by user."),u(a.ERROR)},children:"Cancel"})})]})}),t.jsx("div",{className:fe(a.REVIEWING),children:t.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%"},children:[t.jsxs("div",{className:"review-header",children:[t.jsxs("div",{className:"review-header-top",children:[t.jsxs("div",{children:[t.jsx("div",{className:"review-title",children:"REVIEW EXTRACTION"}),t.jsx("div",{className:"mono review-awb",children:(c==null?void 0:c.awb)||A})]}),t.jsxs("div",{style:{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"},children:[(B==null?void 0:B.learnedFieldCount)>0&&t.jsxs("div",{className:"source-badge source-learned",children:["AI ",B.learnedFieldCount," auto-corrected"]}),St.score===0&&t.jsx("div",{style:{fontSize:"0.62rem",background:"rgba(220,38,38,0.18)",color:"#FCA5A5",padding:"3px 8px",borderRadius:6,fontWeight:700},children:"OCR could not read label — fill fields manually"})]})]}),t.jsxs("div",{className:"review-meta-row",children:[t.jsxs("span",{className:`review-confidence ${St.level}`,children:[t.jsx(_n,{size:13}),St.label," (",Math.round(St.score*100),"%)"]}),t.jsxs("button",{type:"button",className:"review-chip review-chip-courier",onClick:Rr,title:"Tap to change courier",children:[t.jsx(Ht,{size:13}),Tr||"Trackon"]}),t.jsxs("span",{className:"review-chip review-chip-date",children:[t.jsx(Ut,{size:13}),zr||"No date"]})]})]}),t.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10,background:"linear-gradient(180deg, #F0F4FF 0%, #F5F3FF 100%)"},children:[t.jsxs("div",{className:`field-card ${(((Fn=he.clientCode)==null?void 0:Fn.confidence)||0)<.55?"warning":""}`,children:[t.jsx("div",{className:Xt(((An=he.clientCode)==null?void 0:An.confidence)||0)}),t.jsxs("div",{style:{flex:1},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[t.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((Rn=he.clientCode)==null?void 0:Rn.source)&&(()=>{const e=ir(he.clientCode.source);return e?t.jsxs("span",{className:e.className,children:[e.icon," ",e.text]}):null})()]}),t.jsx("input",{className:"field-input",value:y.clientCode||"",onChange:e=>L(n=>({...n,clientCode:e.target.value.toUpperCase()})),placeholder:"Client code"}),t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:6,gap:8},children:[t.jsx("div",{style:{fontSize:"0.62rem",color:"#64748B"},children:me?`Sticky for next scans: ${me}`:"Sticky client is off"}),me?t.jsx("button",{type:"button",className:"suggest-chip",onClick:()=>ct(""),children:"Clear sticky"}):t.jsx("button",{type:"button",className:"suggest-chip",onClick:()=>{const e=Ee(y.clientCode||"");e&&e!=="MISC"&&ct(e)},children:"Keep this client"})]}),((Tn=B==null?void 0:B.clientMatches)==null?void 0:Tn.length)>0&&B.clientNeedsConfirmation&&t.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:B.clientMatches.slice(0,3).map(e=>t.jsxs("button",{type:"button",className:`suggest-chip ${y.clientCode===e.code?"active":""}`,onClick:()=>L(n=>({...n,clientCode:e.code})),children:[e.code," (",Math.round(e.score*100),"%)"]},e.code))})]})]}),t.jsxs("div",{className:"field-card",children:[t.jsx("div",{className:Xt(((zn=he.consignee)==null?void 0:zn.confidence)||0)}),t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{className:"field-label",children:"Consignee"}),t.jsx("input",{className:"field-input",value:y.consignee||"",onChange:e=>L(n=>({...n,consignee:e.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),t.jsxs("div",{className:"field-card",children:[t.jsx("div",{className:Xt(((Mn=he.destination)==null?void 0:Mn.confidence)||0)}),t.jsxs("div",{style:{flex:1},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[t.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((On=he.destination)==null?void 0:On.source)&&(()=>{const e=ir(he.destination.source);return e?t.jsxs("span",{className:e.className,children:[e.icon," ",e.text]}):null})()]}),t.jsx("input",{className:"field-input",value:y.destination||"",onChange:e=>L(n=>({...n,destination:e.target.value.toUpperCase()})),placeholder:"City"}),(B==null?void 0:B.pincodeCity)&&B.pincodeCity!==y.destination&&t.jsxs("button",{onClick:()=>L(e=>({...e,destination:B.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:i.successLight,color:i.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["ðŸ“ Pincode suggests: ",B.pincodeCity]})]})]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[t.jsx("div",{className:"field-card",children:t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{className:"field-label",children:"Pincode"}),t.jsx("input",{className:"field-input",value:y.pincode||"",onChange:e=>L(n=>({...n,pincode:e.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),t.jsx("div",{className:`field-card ${(Bn=B==null?void 0:B.weightAnomaly)!=null&&Bn.anomaly?"warning":"conf-med"}`,children:t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{className:"field-label",children:"Weight (kg)"}),t.jsx("input",{className:"field-input",value:y.weight||"",onChange:e=>L(n=>({...n,weight:e.target.value})),placeholder:"0.0",inputMode:"decimal"}),((Dn=B==null?void 0:B.weightAnomaly)==null?void 0:Dn.anomaly)&&t.jsxs("div",{style:{fontSize:"0.6rem",color:i.warning,marginTop:2,fontWeight:500},children:["Warning: ",B.weightAnomaly.warning]})]})})]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[t.jsx("div",{className:"field-card conf-med",children:t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{className:"field-label",children:"Amount (₹)"}),t.jsx("input",{className:"field-input",value:y.amount||"",onChange:e=>L(n=>({...n,amount:e.target.value})),placeholder:"0",inputMode:"decimal"})]})}),t.jsx("div",{className:"field-card conf-low",children:t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{className:"field-label",children:"Order No"}),t.jsx("input",{className:"field-input",value:y.orderNo||"",onChange:e=>L(n=>({...n,orderNo:e.target.value})),placeholder:"Optional"})]})})]})]}),t.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${i.border}`,display:"flex",gap:10},children:[t.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{if(p){b("/scan-mobile");return}ot()},children:[t.jsx(Vr,{size:16})," Skip"]}),t.jsxs("button",{"data-testid":"approve-save-btn",className:"btn btn-success btn-lg",style:{flex:2},onClick:Fr,disabled:k===a.APPROVING,children:[k===a.APPROVING?t.jsx(Nt,{size:16,style:{animation:"spin 1s linear infinite"}}):t.jsx(Gn,{size:16}),k===a.APPROVING?"Saving...":"Approve & Save"]})]})]})}),t.jsx("div",{className:fe(a.APPROVING),children:t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:16},children:[t.jsx(Nt,{size:42,style:{animation:"spin 1s linear infinite",color:i.primary}}),t.jsxs("div",{style:{textAlign:"center"},children:[t.jsx("div",{style:{fontSize:"1.05rem",fontWeight:700,color:i.text},children:"Saving approval..."}),t.jsx("div",{className:"mono",style:{fontSize:"0.98rem",marginTop:6,color:i.muted},children:(c==null?void 0:c.awb)||A||"AWB"}),t.jsx("div",{style:{fontSize:"0.78rem",color:i.muted,marginTop:8},children:"Waiting for desktop confirmation. If this takes too long, retry from review."})]}),t.jsx("button",{className:"btn btn-outline",onClick:()=>{clearTimeout(de.current),de.current=null,g("Approval pending. Please tap Approve & Save again."),u(a.REVIEWING)},children:"Back to review"})]})}),t.jsx("div",{className:fe(a.SUCCESS),children:t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[t.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[t.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:i.success,strokeWidth:"3",className:"success-check-circle"}),t.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:i.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),t.jsxs("div",{style:{textAlign:"center"},children:[t.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:i.success,marginBottom:4},children:"Saved Successfully"}),t.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700},children:q==null?void 0:q.awb}),(q==null?void 0:q.clientCode)&&t.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:i.primaryLight,color:i.primary,fontSize:"0.78rem",fontWeight:600},children:q.clientName||q.clientCode})]}),t.jsx("div",{style:{fontSize:"0.72rem",color:i.muted},children:q!=null&&q.offlineQueued?`${R.length} queued for sync - Auto-continuing in ${bn}s`:`#${N.scanNumber} scanned - Auto-continuing in ${bn}s`}),t.jsxs("button",{"data-testid":"scan-next-btn",className:"btn btn-primary btn-lg btn-full",onClick:()=>ot(I==="fast"?a.SCANNING:a.IDLE),style:{maxWidth:320},children:[t.jsx(Gt,{size:18})," ",I==="fast"?"Keep Scanning":"Scan Next Parcel"]})]})}),t.jsx("div",{className:fe(a.ERROR),children:t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[t.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:t.jsx(Pn,{size:32,color:i.error})}),t.jsxs("div",{style:{textAlign:"center"},children:[t.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:i.error},children:"Scan Error"}),t.jsx("div",{style:{fontSize:"0.82rem",color:i.muted,marginTop:4},children:se})]}),t.jsxs("button",{className:"btn btn-primary",onClick:ot,children:[t.jsx(Hn,{size:16})," Try Again"]})]})}),w==="disconnected"&&k!==a.IDLE&&t.jsxs("div",{className:"offline-banner",children:[t.jsx(qn,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline â€” Reconnecting... ",R.length?`(${R.length} queued)`:""]})]}),t.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{ws as default};
