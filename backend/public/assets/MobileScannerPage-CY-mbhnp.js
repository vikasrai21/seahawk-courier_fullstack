import{j as e}from"./page-landing-CREvANXP.js";import{r as s}from"./vendor-helmet-Dwc3L0SQ.js";import{l as ts}from"./index-D5a2_FG3.js";import{a as ge}from"./page-import-CFGNhKM8.js";import{c as ns,n as ss}from"./barcodeEngine-BGkskSrW.js";import{c as rs,u as is}from"./vendor-react-DrB23wtn.js";import{b as mn,R as vt,b1 as hn,Y as as,aW as fn,ax as os,aX as Nt,Z as gn,aH as kt,J as cs,b2 as ls,ac as ds,d as xn,a7 as us,H as bn,b3 as yn,aQ as wn,b4 as ps,b5 as ms,a4 as hs,a1 as Cn,p as fs,X as gs}from"./vendor-icons-DyYViWBt.js";import"./page-reconcile-BQT9N3SU.js";import"./page-rate-calc-CC-LHkCs.js";function Tn(l,p){var N,m;try{if(!l||!p)return null;const R=Number(l.videoWidth||0),B=Number(l.videoHeight||0);if(!R||!B)return null;const _=(N=l.getBoundingClientRect)==null?void 0:N.call(l),g=(m=p.getBoundingClientRect)==null?void 0:m.call(p);if(!_||!g)return null;const h=Number(_.width||0),G=Number(_.height||0);if(!h||!G)return null;const y=Math.max(h/R,G/B),z=R*y,E=B*y,d=(h-z)/2,S=(G-E)/2,Ee=g.left-_.left,I=g.top-_.top,ne=g.right-_.left,Y=g.bottom-_.top,J=(Ee-d)/y,be=(I-S)/y,se=(ne-d)/y,o=(Y-S)/y,Z=(ye,we,k)=>Math.max(we,Math.min(k,ye)),x=Z(Math.min(J,se),0,R),T=Z(Math.min(be,o),0,B),A=Z(Math.max(J,se),0,R),W=Z(Math.max(be,o),0,B),le=Math.max(0,A-x),$=Math.max(0,W-T);return!le||!$?null:{x,y:T,w:le,h:$}}catch{return null}}function Sn(l=[]){if(!l.length)return"";const p=[];return l.includes("blur")&&p.push("hold steady"),l.includes("glare")&&p.push("reduce glare"),l.includes("angle")&&p.push("straighten angle"),l.includes("dark")&&p.push("add light"),l.includes("low_edge")&&p.push("fill frame"),p.length?`Improve capture: ${p.join(", ")}.`:""}function xs(l,p){if(!l||!p||!l.videoWidth||!l.videoHeight)return null;const N=Tn(l,p);if(!N)return null;const m=Math.max(0,Math.floor(N.x)),R=Math.max(0,Math.floor(N.y)),B=Math.max(24,Math.floor(N.w)),_=Math.max(24,Math.floor(N.h)),g=128,h=96,G=document.createElement("canvas");G.width=g,G.height=h;const y=G.getContext("2d",{willReadFrequently:!0});if(!y)return null;y.drawImage(l,m,R,Math.min(B,l.videoWidth-m),Math.min(_,l.videoHeight-R),0,0,g,h);const z=y.getImageData(0,0,g,h).data,E=g*h,d=new Float32Array(E);let S=0,Ee=0,I=0;for(let L=0,X=0;L<z.length;L+=4,X+=1){const w=.2126*z[L]+.7152*z[L+1]+.0722*z[L+2];d[X]=w,S+=w,w>=245&&(Ee+=1),w<=24&&(I+=1)}let ne=0,Y=0,J=0,be=0,se=0,o=0;const Z=Math.max(4,Math.floor(h*.15)),x=Math.max(4,Math.floor(g*.15)),T=g;for(let L=1;L<h-1;L+=1)for(let X=1;X<g-1;X+=1){const w=L*T+X,Pe=d[w],P=d[w-1],Ie=d[w+1],Fe=d[w-T],oe=d[w+T],lt=Math.abs(Ie-P),dt=Math.abs(oe-Fe),Ce=lt+dt,Le=Math.abs(4*Pe-P-Ie-Fe-oe);ne+=Le,Ce>58&&(Y+=1),L<=Z&&(J+=Ce),L>=h-Z&&(be+=Ce),X<=x&&(se+=Ce),X>=g-x&&(o+=Ce)}const A=Math.max(1,(g-2)*(h-2)),W=S/E,le=ne/A,$=Y/A,ye=Ee/E,we=I/E,k=Math.abs(J-be)/Math.max(1,J+be),Ye=Math.abs(se-o)/Math.max(1,se+o),Re=Math.max(k,Ye),ee=[];return le<22&&ee.push("blur"),ye>.18&&ee.push("glare"),(we>.55||W<40)&&ee.push("dark"),$<.08&&ee.push("low_edge"),Re>.62&&ee.push("angle"),{ok:ee.length===0,issues:ee,metrics:{brightness:Number(W.toFixed(1)),blurScore:Number(le.toFixed(1)),glareRatio:Number((ye*100).toFixed(1)),edgeRatio:Number(($*100).toFixed(1)),perspectiveSkew:Number((Re*100).toFixed(1))}}}function ct(l,p){const N=Number(l);return Number.isFinite(N)&&N>0?N:p}function bs({samples:l=[],awb:p,now:N=Date.now(),stabilityWindowMs:m=1100,requiredHits:R=3}){const B=ct(m,1100),_=Math.max(1,Math.floor(ct(R,3))),g=ct(N,Date.now()),h=String(p||"").trim(),G=Array.isArray(l)?l.filter(E=>(E==null?void 0:E.awb)&&g-((E==null?void 0:E.at)||0)<=B):[];if(!h)return{samples:G,hits:0,isStable:!1};const y=[...G,{awb:h,at:g}],z=y.reduce((E,d)=>d.awb===h?E+1:E,0);return{samples:y,hits:z,isStable:z>=_}}function ys({currentAttempts:l=0,maxReframeAttempts:p=2}){const N=Math.max(0,Math.floor(ct(p,2))),m=Math.max(0,Math.floor(Number(l)||0))+1;return m<=N?{action:"reframe",attempts:m}:{action:"switch_to_document",attempts:N}}const ws=window.location.origin,vn={w:"90vw",h:"18vw"},at={w:"92vw",h:"130vw"},Nn=3500,kn=900,Cs=1e4,Ss=12e3,vs="mobile_scanner_offline_queue",jn="mobile_scanner_workflow_mode",En="mobile_scanner_device_profile",Ns=500,ks=1,Rn=100,ot=2,jt=2,js=500,In=960,je=.68,Es=900,H={phone:"phone-camera",rugged:"rugged-scanner"},i={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"},Rs=l=>{var p;try{(p=navigator==null?void 0:navigator.vibrate)==null||p.call(navigator,l)}catch{}},Fn={tap:[20],lock:[400,50,200,50,100],success:[18,28,72],warning:[70,50,70],retry:[28,40,28],error:[110,55,110],duplicate:[90,50,90,50,90]},C=(l="tap")=>{Rs(Fn[l]||Fn.tap)},We=(l,p,N="sine")=>{try{const m=new(window.AudioContext||window.webkitAudioContext),R=m.createOscillator(),B=m.createGain();R.type=N,R.frequency.setValueAtTime(l,m.currentTime),B.gain.setValueAtTime(.12,m.currentTime),B.gain.exponentialRampToValueAtTime(.01,m.currentTime+p),R.connect(B),B.connect(m.destination),R.start(),R.stop(m.currentTime+p)}catch{}},xe=()=>{We(880,.12),setTimeout(()=>We(1100,.1),130)},Is=()=>{We(2700,.08,"square"),setTimeout(()=>We(3100,.05,"square"),60)},Fs=()=>We(600,.08),Q=()=>We(200,.25,"sawtooth"),Et=l=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const p=new SpeechSynthesisUtterance(l);p.rate=1.2,p.pitch=1,p.lang="en-IN",window.speechSynthesis.speak(p)}catch{}},An=()=>{var l;try{if(typeof window>"u")return!1;if(window.isSecureContext)return!0;const p=((l=window.location)==null?void 0:l.hostname)||"";return p==="localhost"||p==="127.0.0.1"}catch{return!1}},r={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",mutedLight:"#9CA3AF",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},As=`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');

.msp-root {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: ${r.bg};
  color: ${r.text};
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
@keyframes laserSparkMove {
  0% { left: 2%; transform: translateX(-50%) scale(1); opacity: 0.8; }
  25% { box-shadow: 0 0 15px 4px #fff, 0 0 30px 10px #ff0000; opacity: 1; }
  50% { left: 50%; transform: translateX(-50%) scale(1.8); box-shadow: 0 0 25px 6px #fff, 0 0 45px 15px #ff0000; opacity: 1; }
  75% { box-shadow: 0 0 15px 4px #fff, 0 0 30px 10px #ff0000; opacity: 1; }
  100% { left: 98%; transform: translateX(-50%) scale(1); opacity: 0.8; }
}
@keyframes sparkScatter {
  0% { transform: scale(1.5) translate(0, 0) rotate(0deg); opacity: 1; }
  100% { transform: scale(0) translate(15px, -20px) rotate(90deg); opacity: 0; }
}
@keyframes sparkScatterReverse {
  0% { transform: scale(1.5) translate(0, 0) rotate(0deg); opacity: 1; }
  100% { transform: scale(0) translate(-15px, 20px) rotate(-90deg); opacity: 0; }
}
@keyframes laserPulse {
  0%, 100% { opacity: 0.5; box-shadow: 0 0 4px rgba(255, 0, 0, 0.8), 0 0 8px rgba(255, 0, 0, 0.4); }
  50% { opacity: 1; box-shadow: 0 0 8px rgba(255, 0, 0, 1), 0 0 20px rgba(255, 0, 0, 0.8); }
}
.scan-laser {
  position: absolute; left: 2%; right: 2%; height: 2px;
  top: 50%; transform: translateY(-50%);
  background: rgba(255, 0, 0, 0.95);
  animation: laserPulse 1.5s ease-in-out infinite;
}
.scan-laser-spark {
  position: absolute; top: 50%; margin-top: -3px;
  width: 6px; height: 6px; border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 12px 3px #ffffff, 0 0 25px 8px #ff0000;
  animation: laserSparkMove 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
}
.scan-laser-spark::before, .scan-laser-spark::after {
  content: ''; position: absolute;
  width: 3px; height: 3px; background: #fff; border-radius: 50%;
  box-shadow: 0 0 5px #ff0000, 0 0 10px #ff0000;
}
.scan-laser-spark::before {
  left: -8px; top: -6px;
  animation: sparkScatter 0.6s infinite ease-out;
}
.scan-laser-spark::after {
  right: -8px; top: 6px;
  animation: sparkScatterReverse 0.7s infinite alternate ease-out;
  animation-delay: 0.15s;
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
  background: ${r.surface}; border: 1px solid ${r.border};
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
  background: ${r.surface}; border: 1.5px solid ${r.border};
  color: ${r.text};
}
.btn-danger { background: ${r.errorLight}; color: ${r.error}; }
.btn-lg { padding: 16px 32px; font-size: 1rem; border-radius: 14px; }
.btn-full { width: 100%; }
.btn:disabled {
  opacity: 0.5; cursor: default;
}

/* â”€â”€ Capture button (circular) â”€â”€ */
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

/* â”€â”€ Preview image â”€â”€ */
.preview-img {
  width: 100%; border-radius: 12px;
  object-fit: contain; max-height: 50vh;
  background: #F1F5F9;
}

/* â”€â”€ Field card in review â”€â”€ */
.field-card {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 14px;
  background: ${r.surface}; border: 1px solid ${r.border};
  border-radius: 12px;
}
.field-card.warning { border-color: ${r.warning}; background: ${r.warningLight}; }
.field-card.error-field { border-color: ${r.error}; background: ${r.errorLight}; }
.field-label {
  font-size: 0.65rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em;
  color: ${r.muted}; margin-bottom: 2px;
}
.field-value {
  font-size: 0.85rem; font-weight: 600;
  color: ${r.text};
}
.field-input {
  width: 100%; background: ${r.bg}; border: 1px solid ${r.border};
  border-radius: 8px; padding: 8px 10px;
  font-family: inherit; font-size: 0.82rem; font-weight: 500;
  color: ${r.text}; outline: none;
}
.field-input:focus { border-color: ${r.primary}; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }

/* â”€â”€ Confidence dot â”€â”€ */
.conf-dot {
  width: 8px; height: 8px; border-radius: 50%;
  flex-shrink: 0; margin-top: 4px;
}
.conf-high { background: ${r.success}; }
.conf-med { background: ${r.warning}; }
.conf-low { background: ${r.error}; }

/* â”€â”€ Source badge â”€â”€ */
.source-badge {
  font-size: 0.6rem; padding: 2px 6px; border-radius: 6px;
  font-weight: 600; display: inline-flex; align-items: center; gap: 3px;
}
.source-learned { background: #F5F3FF; color: #7C3AED; }
.source-ai { background: ${r.primaryLight}; color: ${r.primary}; }
.source-history { background: ${r.warningLight}; color: ${r.warning}; }
.source-pincode { background: ${r.successLight}; color: ${r.success}; }

/* â”€â”€ Shimmer skeleton â”€â”€ */
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

/* â”€â”€ Success checkmark â”€â”€ */
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

/* â”€â”€ Flash overlay â”€â”€ */
@keyframes flash { 0% { opacity: 0.8; } 100% { opacity: 0; } }
.flash-overlay {
  position: fixed; inset: 0; z-index: 50;
  pointer-events: none;
  animation: flash 0.3s ease-out forwards;
}
.flash-white { background: white; }
.flash-success { background: rgba(5,150,105,0.2); }
.flash-error { background: rgba(220,38,38,0.2); }

/* â”€â”€ Duplicate warning â”€â”€ */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}
.shake { animation: shake 0.5s ease-in-out; }

/* â”€â”€ Offline banner â”€â”€ */
.offline-banner {
  background: ${r.warningLight}; color: ${r.warning};
  text-align: center; padding: 6px; font-size: 0.72rem; font-weight: 600;
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 99;
}

/* â”€â”€ Scrollable panel â”€â”€ */
.scroll-panel {
  flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
  padding: 16px 20px;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   HOME SCREEN (aligned with direct mobile scanner)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
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
`,zs=l=>l>=.85?"high":l>=.55?"med":"low",Rt=l=>`conf-dot conf-${zs(l)}`,zn=l=>l==="learned"?{className:"source-badge source-learned",icon:"AI",text:"Learned"}:l==="awb_master"?{className:"source-badge source-ai",icon:"DB",text:"Lookup"}:l==="courier_api"?{className:"source-badge source-history",icon:"API",text:"Courier"}:l==="fuzzy_match"?{className:"source-badge source-ai",icon:"ðŸ”",text:"Matched"}:l==="fuzzy_history"||l==="consignee_pattern"?{className:"source-badge source-history",icon:"ðŸ“Š",text:"History"}:l==="delhivery_pincode"||l==="india_post"||l==="pincode_lookup"||l==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"ðŸ“",text:"Pincode"}:null,Ts=l=>{const p=Math.floor(l/6e4);return p<60?`${p}m`:`${Math.floor(p/60)}h ${p%60}m`};function Gs({standalone:l=!1}){var Kt,rt,Jt,Zt,en,tn,nn,sn,rn,an,on,cn,ln,dn,un;const{pin:p}=rs(),N=is(),m=!!l,R=`${vs}:${m?"direct":p||"unknown"}`,B=s.useMemo(()=>`mobile_scanner_daily_count:${new Date().toISOString().slice(0,10)}`,[]),_=s.useMemo(()=>{try{return typeof window>"u"?"":new URLSearchParams(window.location.search).get("mockBarcodeRaw")||""}catch{return""}},[]),g=s.useMemo(()=>{try{if(typeof window>"u")return!1;const t=new URLSearchParams(window.location.search);return t.get("mock")==="1"||t.get("e2e")==="1"}catch{return!1}},[]),[h,G]=s.useState(null),[y,z]=s.useState("connecting"),[E,d]=s.useState(""),[S,Ee]=s.useState(i.IDLE),[I,ne]=s.useState(""),[Y,J]=s.useState(null),[be,se]=s.useState({}),[o,Z]=s.useState(null),[x,T]=s.useState({}),[A,W]=s.useState(null),[le,$]=s.useState(null),[ye,we]=s.useState(""),[k,Ye]=s.useState([]),[Re,ee]=s.useState(!1),[L,X]=s.useState(0),[w,Pe]=s.useState({ok:!1,issues:[],metrics:null}),[P,Ie]=s.useState({kb:0,width:0,height:0,quality:je}),[Fe,oe]=s.useState(!1),[lt,dt]=s.useState("0m"),[Ce,Le]=s.useState("Connected"),[De,It]=s.useState(""),[ut,Mn]=s.useState(!1),[Ft,pt]=s.useState("idle"),[re,On]=s.useState(null),[Bn,Wn]=s.useState(0),[mt,Pn]=s.useState(0),[At,ht]=s.useState(null),[Se,ft]=s.useState("barcode"),[j,gt]=s.useState(()=>{if(typeof window>"u")return"fast";try{const t=localStorage.getItem(jn);if(t==="fast"||t==="ocr")return t}catch{}return g?"ocr":"fast"}),[U,zt]=s.useState(()=>{if(typeof window>"u")return H.phone;try{const t=localStorage.getItem(En);if(t===H.phone||t===H.rugged)return t}catch{}return H.phone}),xt=s.useRef(0),[M,bt]=s.useState({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now(),scannedItems:[]}),[Ae,Ln]=s.useState(!1),[_e,Dn]=s.useState(()=>{try{const t=localStorage.getItem("seahawk_scanner_session_date");if(t&&/^\d{4}-\d{2}-\d{2}$/.test(t))return t}catch{}return new Date().toISOString().slice(0,10)}),V=s.useRef(null),Xe=s.useRef(null),de=s.useRef(null),ue=s.useRef(null),pe=s.useRef(!1),Ke=s.useRef(null),_n=s.useRef(!1),ce=s.useRef(i.IDLE),yt=s.useRef(null),$e=s.useRef(0),ve=s.useRef(null),Tt=s.useRef(new Set),Ue=s.useRef([]),Je=s.useRef({awb:"",hits:0,lastSeenAt:0}),Mt=s.useRef(0),qe=s.useRef(!1),Ot=s.useRef(0),Ne=s.useRef(null),$n=s.useRef(null),wt=s.useRef({message:"",at:0}),ie=s.useRef({lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]}),me=s.useRef(null),Bt=s.useRef(null),Wt=s.useRef({}),Ze=s.useRef(null),et=s.useRef(null),tt=s.useRef(null),c=s.useCallback(t=>{Ee(t)},[]),q=s.useCallback(t=>{xt.current=t,Wn(t)},[]),K=s.useCallback(t=>{Mt.current=t,Pn(t)},[]),Ct=s.useCallback((t,n="warning")=>{if(!t)return;const a=Date.now();wt.current.message===t&&a-wt.current.at<Es||(wt.current={message:t,at:a},d(t),n&&C(n))},[]),Pt=s.useCallback(t=>{q(0),K(0),ft("document"),d(t||'No barcode lock yet. Capture label instead or tap "Back to barcode mode" and hold steady.'),C("warning")},[q,K]),nt=s.useCallback(()=>{const t=ys({currentAttempts:Mt.current,maxReframeAttempts:ot});if(t.action==="reframe"){K(t.attempts),q(0),d(`No lock yet. Reframe ${t.attempts}/${ot}: move closer, reduce glare, keep barcode horizontal.`),C("retry");return}Pt("No stable barcode lock after reframe retries. Capture label for OCR fallback.")},[Pt,q,K]),Un=s.useCallback(()=>{ne(""),d(""),c(i.CAPTURING)},[c]),Lt=s.useCallback(t=>{const n=Date.now(),a=bs({samples:Ue.current,awb:t,now:n,stabilityWindowMs:Ns,requiredHits:ks});return Ue.current=a.samples,Je.current={awb:t,hits:a.hits,lastSeenAt:n},a.isStable},[]),ke=s.useCallback(async()=>{var a;if(!An())throw new Error("Camera requires HTTPS (or localhost). Open this page over https:// on your phone.");if(!((a=navigator==null?void 0:navigator.mediaDevices)!=null&&a.getUserMedia))throw new Error("Camera not supported on this browser/device.");if(!V.current)throw new Error("Camera element not ready.");const t=V.current.srcObject;if(t&&typeof t.getTracks=="function"&&t.getTracks().some(b=>b.readyState==="live")){await V.current.play();return}let n=null;try{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}V.current.srcObject=n,await V.current.play()},[]);s.useEffect(()=>{const t=setInterval(()=>dt(Ts(Date.now()-M.startedAt)),3e4);return()=>clearInterval(t)},[M.startedAt]);const Ge=s.useCallback(t=>{Ye(t);try{t.length?localStorage.setItem(R,JSON.stringify(t)):localStorage.removeItem(R)}catch{}},[R]),ze=s.useCallback(t=>{const n={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:t};return Ge([...k,n]),n},[k,Ge]),Dt=s.useCallback(async t=>{if(String((t==null?void 0:t.scanMode)||"").toLowerCase()==="fast_barcode_only"){await ge.post("/shipments/scan",{awb:t.awb,courier:"AUTO",captureOnly:!0});return}await ge.post("/shipments/scan-mobile",{awb:t.awb,imageBase64:t.imageBase64,focusImageBase64:t.focusImageBase64||t.imageBase64,sessionContext:t.sessionContext||{}})},[]),Ve=s.useCallback(async()=>{var t;if(k.length){if(m){if(!navigator.onLine)return;const n=[];for(const a of k)if((t=a==null?void 0:a.payload)!=null&&t.awb)try{await Dt(a.payload)}catch{n.push(a)}Ge(n),n.length?d(`Uploaded partially. ${n.length} scan(s) still queued.`):d("");return}!h||!h.connected||(k.forEach(n=>{var a;(a=n==null?void 0:n.payload)!=null&&a.awb&&h.emit("scanner:scan",n.payload)}),Ge([]))}},[m,h,k,Ge,Dt]),D=s.useCallback(t=>{bt(n=>{const a={...n,scannedItems:[{...t,time:Date.now()},...n.scannedItems]};try{localStorage.setItem(B,String(a.scanNumber))}catch{}return a})},[B]);s.useEffect(()=>{Ze.current=D},[D]),s.useEffect(()=>{Bt.current=o},[o]),s.useEffect(()=>{Wt.current=x},[x]);const qn=s.useCallback(()=>{if(y!=="paired"){d(m?"Scanner is offline. Reconnect internet and retry.":"Phone is not connected to the desktop session.");return}if(d(""),g){c(i.SCANNING);return}ke().then(()=>c(i.SCANNING)).catch(t=>d((t==null?void 0:t.message)||"Camera access failed."))},[y,ke,c,g,m]),Gn=s.useCallback(t=>{var a;t==null||t.preventDefault();const n=De.trim().toUpperCase();if(!n||n.length<6){d("Enter a valid AWB number (min 6 chars)");return}if(y!=="paired"){d(m?"Scanner is offline. Reconnect internet and retry.":"Not connected to desktop session.");return}if(d(""),It(""),ne(n),g){oe(!0),c(i.CAPTURING);return}if(j==="fast"){(a=Ne.current)==null||a.call(Ne,n);return}oe(!0),c(i.CAPTURING)},[De,y,c,g,m,j]),Vn=s.useCallback(()=>{if(window.confirm(m?"Exit this scanner session on the phone?":"End this mobile scanner session on the phone?")){if(m){N("/app/scan");return}h!=null&&h.connected?h.emit("scanner:end-session",{reason:"Mobile ended the session"}):N("/")}},[h,N,m]),Hn=s.useCallback(()=>{if(k.length>0){Ve();return}window.alert(m?"No queued scans to upload.":"Everything is already synced.")},[k.length,Ve,m]);s.useEffect(()=>{ce.current=S},[S]);const he=s.useCallback((t=null)=>{t&&Z(t),se({}),d(""),c(i.CAPTURING)},[c]),Te=s.useCallback(t=>{if(!t)return;if(Z(t),T({clientCode:t.clientCode||"",consignee:t.consignee||"",destination:t.destination||"",pincode:t.pincode||"",weight:t.weight||0,amount:t.amount||0,orderNo:t.orderNo||""}),se({}),t.reviewRequired){c(i.REVIEWING);return}xe(),C("success"),Ae&&Et(`Auto approved. ${t.clientName||""}. ${t.destination||""}.`);const n={awb:t.awb,clientCode:t.clientCode,clientName:t.clientName,destination:t.destination||"",weight:t.weight||0,autoApproved:!0};W(n),D(n),c(i.SUCCESS)},[D,c,Ae]);s.useEffect(()=>{et.current=he},[he]),s.useEffect(()=>{tt.current=Te},[Te]),s.useEffect(()=>{if(g){z("paired"),Le("Mock Mode"),d(""),c(i.IDLE);return}if(m){G(null),z("paired"),Le("Direct Mode"),d(""),c(i.IDLE);return}if(!p){d("No PIN provided.");return}const t=ts(ws,{auth:{scannerPin:p},transports:["websocket","polling"],reconnection:!0,reconnectionDelay:1500,reconnectionAttempts:20});return t.on("connect",()=>z("connecting")),t.on("scanner:paired",({userEmail:n})=>{z("paired"),Le(n?n.split("@")[0]:"Connected"),d("");const a=ce.current;a===i.PROCESSING||a===i.REVIEWING||a===i.APPROVING||a===i.SUCCESS||c(i.IDLE)}),t.on("scanner:error",({message:n})=>{d(n),z("disconnected")}),t.on("scanner:session-ended",({reason:n})=>{z("disconnected"),d(n||"Session ended by desktop."),N("/")}),t.on("disconnect",()=>z("disconnected")),t.on("reconnect",()=>{const n=ce.current;if(n===i.PROCESSING||n===i.REVIEWING||n===i.APPROVING||n===i.SUCCESS){z("paired");return}z("paired"),c(i.SCANNING)}),t.on("scanner:scan-processed",n=>{var u,b;const a=ce.current;if(!(a!==i.PROCESSING&&a!==i.REVIEWING)){if(n.status==="error"){if(a!==i.PROCESSING)return;$("error"),Q(),C("error"),c(i.ERROR),d(n.error||"Scan failed on desktop.");return}if(n.status==="photo_required"||n.requiresImageCapture){(u=et.current)==null||u.call(et,n);return}(b=tt.current)==null||b.call(tt,n)}}),t.on("scanner:approval-result",({success:n,message:a,awb:u})=>{var v;const b=Bt.current||{},f=Wt.current||{};if(n){xe(),C("success"),$("success");const O={awb:(b==null?void 0:b.awb)||u,clientCode:f.clientCode,clientName:(b==null?void 0:b.clientName)||f.clientCode,destination:f.destination||"",weight:parseFloat(f.weight)||0};W(O),(v=Ze.current)==null||v.call(Ze,O),c(i.SUCCESS)}else Q(),C("error"),d(a||"Approval failed.")}),t.on("scanner:ready-for-next",()=>{}),G(t),()=>{t.disconnect()}},[p,c,N,g,m]),s.useEffect(()=>{try{const t=localStorage.getItem(R);if(!t)return;const n=JSON.parse(t);Array.isArray(n)&&n.length&&Ye(n)}catch{}},[R]),s.useEffect(()=>{try{localStorage.setItem(jn,j)}catch{}},[j]),s.useEffect(()=>{try{localStorage.setItem(En,U)}catch{}},[U]),s.useEffect(()=>{if(k.length){if(m){y==="paired"&&navigator.onLine&&Ve();return}y==="paired"&&(h!=null&&h.connected)&&Ve()}},[y,h,k.length,Ve,m]);const Me=s.useCallback(async()=>{var t;try{if(oe(!1),me.current&&me.current.stop(),ue.current){try{const n=ue.current;n!=null&&n.barcodeScanner&&await n.barcodeScanner.dispose()}catch{}ue.current=null}if(de.current){try{await de.current.reset()}catch{}de.current=null}(t=V.current)!=null&&t.srcObject&&(V.current.srcObject.getTracks().forEach(n=>n.stop()),V.current.srcObject=null)}catch{}},[]),Oe=s.useCallback(async()=>{try{if(pt("idle"),me.current&&me.current.stop(),ue.current){try{await ue.current.barcodeScanner.dispose()}catch{}ue.current=null}if(de.current){try{de.current._type==="native"?de.current.reset():await de.current.reset()}catch{}de.current=null}}catch{}},[]),_t=s.useCallback(async()=>{if(V.current){await Oe();try{$e.current=Date.now(),await ke(),me.current||(me.current=ns()),await me.current.start(V.current,Xe.current,{onDetected:(t,n)=>{var b;if(pe.current)return;q(0);const a=(n==null?void 0:n.format)||"unknown",u=(n==null?void 0:n.engine)||"unknown";On({value:t,format:a,engine:u,at:Date.now(),sinceStartMs:$e.current?Date.now()-$e.current:null,candidateCount:(n==null?void 0:n.candidateCount)||1,ambiguous:!1,alternatives:(n==null?void 0:n.alternatives)||[]}),pt(u),(b=ve.current)==null||b.call(ve,t,{candidateCount:(n==null?void 0:n.candidateCount)||1,ambiguous:!1,alternatives:(n==null?void 0:n.alternatives)||[],format:a,engine:u})},onFail:()=>{const t=xt.current+1;q(t),t>=Rn&&nt()},onEngineReady:t=>{console.log(`[MobileScanner] Barcode engine ready: ${t}`),pt(t)}})}catch(t){d("Camera access failed: "+t.message)}}},[ke,Oe,nt,q]),$t=s.useCallback((t,n={})=>{var f;const a=String(t||"").trim().replace(/\s+/g,"").toUpperCase(),u=ss(t)||a;if(pe.current||ce.current!==i.SCANNING)return;if(!u||u.length<8){a.replace(/[^A-Z0-9]/g,"").length>=4&&Ct("Partial barcode detected. Move closer so full AWB is visible.");return}if(n!=null&&n.ambiguous){const v=xt.current+1;q(v),Ct("Multiple barcodes detected. Keep only the AWB barcode inside the strip.","retry"),v>=Rn&&nt();return}if(!g&&!Lt(u))return;if(pe.current=!0,Tt.current.has(u)){C("duplicate"),Q(),we(u),setTimeout(()=>{we(""),pe.current=!1,Je.current={awb:"",hits:0,lastSeenAt:0},Ue.current=[]},2500);return}clearTimeout(yt.current),C("lock"),Is(),ne(u);const b=$e.current?Date.now()-$e.current:null;if(ht(b),ie.current={lockTimeMs:b,candidateCount:Number((n==null?void 0:n.candidateCount)||1),ambiguous:!!(n!=null&&n.ambiguous),alternatives:Array.isArray(n==null?void 0:n.alternatives)?n.alternatives.slice(0,3):[]},K(0),q(0),d(""),bt(v=>{const O={...v,scanNumber:v.scanNumber+1};return O.scannedAwbs=new Set(v.scannedAwbs),O.scannedAwbs.add(u),Tt.current=O.scannedAwbs,O}),j==="fast"){(f=Ne.current)==null||f.call(Ne,u);return}oe(!0),c(i.CAPTURING)},[c,Lt,j,g,q,K,Ct,nt]);s.useEffect(()=>{ve.current=$t},[$t]),s.useEffect(()=>{if(S===i.SCANNING&&(pe.current=!1,Je.current={awb:"",hits:0,lastSeenAt:0},Ue.current=[],ie.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},ht(null),K(0),q(0),ft("barcode"),_t(),g&&_)){const t=setTimeout(()=>{var n;ce.current===i.SCANNING&&((n=ve.current)==null||n.call(ve,_))},50);return()=>clearTimeout(t)}return()=>{S===i.SCANNING&&Oe()}},[S,_t,Oe,q,K,g,_]);const Ut=s.useCallback(async()=>{if(g){oe(!0);return}await Oe();try{await ke(),oe(!0)}catch(t){d("Camera access failed: "+t.message)}},[ke,Oe,g]);s.useEffect(()=>{S===i.CAPTURING&&Ut()},[S,Ut]);const st=s.useCallback(()=>{const t=V.current,n=Xe.current;return xs(t,n)},[]);s.useEffect(()=>{if(S!==i.CAPTURING){ee(!1),X(0),Pe({ok:!1,issues:[],metrics:null}),_n.current=!1,qe.current=!1;return}const t=setInterval(()=>{const n=st();n&&(Pe(n),ee(n.ok),X(a=>{const u=n.ok?Math.min(a+1,8):0;return u>=jt&&!qe.current&&(C("tap"),qe.current=!0),n.ok||(qe.current=!1),u}))},280);return()=>clearInterval(t)},[S,st]);const qt=s.useCallback((t={})=>{const n=V.current,a=Xe.current;if(!n||!a||!n.videoWidth)return null;const u=Tn(n,a);if(!u)return null;const b=u.x,f=u.y,v=u.w,O=u.h;if(!v||!O)return null;const it=Math.max(640,Number(t.maxWidth||In)),Qe=Math.min(.85,Math.max(.55,Number(t.quality||je))),te=document.createElement("canvas");te.width=Math.min(it,Math.round(v)),te.height=Math.round(te.width/v*O),te.getContext("2d").drawImage(n,b,f,v,O,0,0,te.width,te.height);const St=te.toDataURL("image/jpeg",Qe).split(",")[1]||"";if(!St)return null;const es=Math.floor(St.length*3/4);return{base64:St,width:te.width,height:te.height,approxBytes:es,quality:Qe}},[]),Qn=s.useCallback(()=>{const t=Date.now();if(t-Ot.current<js)return;Ot.current=t;const n=st()||w;if(!(n!=null&&n.ok)||L<jt){d(Sn(n==null?void 0:n.issues)||"Capture quality is low. Hold steady and align the AWB in the frame."),C("warning"),Q();return}$("white"),Fs(),C("tap");const a=qt({maxWidth:In,quality:je});if(!(a!=null&&a.base64)){d("Could not capture image. Try again."),pe.current=!1;return}Ie({kb:Math.round((a.approxBytes||0)/1024),width:a.width||0,height:a.height||0,quality:a.quality||je}),J(`data:image/jpeg;base64,${a.base64}`),Me(),c(i.PREVIEW)},[qt,Me,c,st,w,L]),Yn=s.useCallback(()=>{if(!g)return;const t="data:image/jpeg;base64,ZmFrZS1tb2NrLWltYWdl";Ie({kb:0,width:0,height:0,quality:je}),J(t),Me(),c(i.PREVIEW)},[c,g,Me]),Be=s.useCallback(()=>{var t,n,a;return{scanNumber:M.scanNumber,recentClient:M.dominantClient,dominantClient:M.dominantClient,dominantClientCount:M.dominantClientCount,sessionDurationMin:Math.round((Date.now()-M.startedAt)/6e4),sessionDate:_e,scanWorkflowMode:j,scanMode:Se,deviceProfile:U,hardwareClass:U===H.rugged?"rugged":"phone",captureQuality:{ok:!!w.ok,issues:Array.isArray(w.issues)?w.issues.slice(0,8):[],metrics:w.metrics||null},captureMeta:{kb:P.kb||0,width:P.width||0,height:P.height||0,quality:P.quality||je},lockTimeMs:Number.isFinite(Number((t=ie.current)==null?void 0:t.lockTimeMs))?Number(ie.current.lockTimeMs):null,lockCandidateCount:Number.isFinite(Number((n=ie.current)==null?void 0:n.candidateCount))?Number(ie.current.candidateCount):1,lockAlternatives:Array.isArray((a=ie.current)==null?void 0:a.alternatives)?ie.current.alternatives.slice(0,3):[]}},[M,_e,j,Se,U,w,P]),Gt=s.useCallback(async t=>{var u,b;const n=String(t||"").trim().toUpperCase();if(!n)return;if(c(i.PROCESSING),g){setTimeout(()=>{const f={awb:n,clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25};W(f),D(f),c(i.SUCCESS)},120);return}const a={awb:n,imageBase64:null,focusImageBase64:null,scanMode:"fast_barcode_only",sessionContext:Be()};if(m){if(!navigator.onLine){ze(a),xe(),C("success");const f={awb:n,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};W({...f,offlineQueued:!0}),D(f),c(i.SUCCESS);return}try{const f=await ge.post("/shipments/scan",{awb:n,courier:"AUTO",captureOnly:!0}),v=((u=f==null?void 0:f.data)==null?void 0:u.shipment)||{},O={awb:v.awb||n,clientCode:v.clientCode||"MISC",clientName:((b=v.client)==null?void 0:b.company)||v.clientCode||"Scanned",destination:v.destination||"",weight:v.weight||0};W(O),D(O),xe(),C("success"),c(i.SUCCESS)}catch(f){d((f==null?void 0:f.message)||"Barcode processing failed. Please try again."),Q(),C("error"),c(i.ERROR)}return}if(!h||!h.connected||y!=="paired"){ze(a),xe(),C("success");const f={awb:n,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};W({...f,offlineQueued:!0}),D(f),c(i.SUCCESS);return}h.emit("scanner:scan",a),setTimeout(()=>{ce.current===i.PROCESSING&&(d("Barcode processing timed out. Please try scanning again."),Q(),C("error"),c(i.ERROR))},Cs)},[h,y,c,g,ze,D,Be,m]);s.useEffect(()=>{Ne.current=Gt},[Gt]);const Vt=s.useCallback(async t=>{const n=String(t||"").trim().toUpperCase();if(!n)return;if(c(i.PROCESSING),g){c(i.CAPTURING);return}const a={awb:n,scanMode:"lookup_first",sessionContext:Be()};if(m){if(!navigator.onLine){he({awb:n,status:"photo_required",requiresImageCapture:!0});return}try{const u=await ge.post("/shipments/scan-mobile",a),b=(u==null?void 0:u.data)||u;if(b.status==="error"||!b.success){$("error"),Q(),C("error"),c(i.ERROR),d(b.error||b.message||"Lookup failed.");return}if(b.status==="photo_required"||b.requiresImageCapture){he(b);return}Te(b)}catch(u){d((u==null?void 0:u.message)||"Lookup failed. Please try again."),Q(),C("error"),c(i.ERROR)}return}if(!h||!h.connected||y!=="paired"){he({awb:n,status:"photo_required",requiresImageCapture:!0});return}h.emit("scanner:scan",a),setTimeout(()=>{ce.current===i.PROCESSING&&(d("Lookup timed out. Capture the label photo and continue."),c(i.CAPTURING))},Ss)},[h,y,c,g,Be,m,he,Te]);s.useEffect(()=>{$n.current=Vt},[Vt]);const Xn=s.useCallback(async()=>{if(!Y)return;if(c(i.PROCESSING),g){setTimeout(()=>{const a={awb:I||"100454974120",clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25};W(a),D(a),c(i.SUCCESS)},250);return}const t=Y.split(",")[1]||Y,n={awb:I||"",imageBase64:t,focusImageBase64:t,scanMode:"ocr_label",sessionContext:Be()};if(m){if(!navigator.onLine){ze(n),xe(),C("success");const a={awb:I||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};W({...a,offlineQueued:!0}),D(a),c(i.SUCCESS);return}try{const a=await ge.post("/shipments/scan-mobile",n),u=(a==null?void 0:a.data)||a;if(u.status==="error"||!u.success){$("error"),Q(),C("error"),c(i.ERROR),d(u.error||u.message||"Scan failed.");return}if(u.status==="photo_required"||u.requiresImageCapture){he(u);return}Te(u)}catch(a){d((a==null?void 0:a.message)||"Server error. Please try again."),Q(),C("error"),c(i.ERROR)}return}if(!h||!h.connected||y!=="paired"){ze(n),xe(),C("success");const a={awb:I||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};W({...a,offlineQueued:!0}),D(a),c(i.SUCCESS);return}h.emit("scanner:scan",n),setTimeout(()=>{ce.current===i.PROCESSING&&(d("OCR timed out after 40 seconds. Retake the label photo and try again."),Q(),C("error"),c(i.ERROR))},4e4)},[h,I,Y,c,y,ze,D,g,Be,m,Te,he]),Kn=s.useCallback(async()=>{var b;if(!o)return;c(i.APPROVING);let t=!m;if(g){setTimeout(()=>{const f={awb:o.awb||I,clientCode:x.clientCode||"MOCKCL",clientName:o.clientName||x.clientCode||"Mock Client",destination:x.destination||"",weight:parseFloat(x.weight)||0};W(f),D(f),$("success"),t=!0,c(i.SUCCESS)},200);return}const n={clientCode:o.clientCode||"",clientName:o.clientName||"",consignee:o.consignee||"",destination:o.destination||""},a={clientCode:x.clientCode||"",clientName:x.clientCode||"",consignee:x.consignee||"",destination:x.destination||""},u={clientCode:x.clientCode,consignee:x.consignee,destination:x.destination,pincode:x.pincode,weight:parseFloat(x.weight)||0,amount:parseFloat(x.amount)||0,orderNo:x.orderNo||""};if(m)try{(o.ocrExtracted||o)&&await ge.post("/shipments/learn-corrections",{ocrFields:n,approvedFields:a}),o.shipmentId?await ge.put(`/shipments/${o.shipmentId}`,u):await ge.post("/shipments",{awb:o.awb||I,...u}),xe(),C("success"),$("success");const f={awb:(o==null?void 0:o.awb)||I,clientCode:x.clientCode,clientName:(o==null?void 0:o.clientName)||x.clientCode,destination:x.destination||"",weight:parseFloat(x.weight)||0};W(f),D(f),t=!0,c(i.SUCCESS)}catch(f){c(i.REVIEWING),Q(),C("error"),d((f==null?void 0:f.message)||"Approval failed.")}else{if(!h){c(i.REVIEWING),d("Not connected to desktop session.");return}(o.ocrExtracted||o)&&h.emit("scanner:learn-corrections",{pin:p,ocrFields:n,approvedFields:a,courier:(o==null?void 0:o.courier)||((b=o==null?void 0:o.ocrExtracted)==null?void 0:b.courier)||"",deviceProfile:U}),h.emit("scanner:approval-submit",{shipmentId:o.shipmentId,awb:o.awb||I,fields:u},f=>{f!=null&&f.success||(c(i.REVIEWING),Q(),C("error"),d((f==null?void 0:f.message)||"Approval failed."))})}t&&x.clientCode&&x.clientCode!=="MISC"&&bt(f=>{var it,Qe;const v={...f.clientFreq};v[x.clientCode]=(v[x.clientCode]||0)+1;const O=Object.entries(v).sort((te,pn)=>pn[1]-te[1]);return{...f,clientFreq:v,dominantClient:((it=O[0])==null?void 0:it[1])>=2?O[0][0]:null,dominantClientCount:((Qe=O[0])==null?void 0:Qe[1])||0}})},[h,o,x,I,p,c,D,g,U,m]),He=s.useCallback((t=i.IDLE)=>{clearTimeout(Ke.current),clearTimeout(yt.current),ne(""),J(null),Ie({kb:0,width:0,height:0,quality:je}),Z(null),T({}),se({}),W(null),ht(null),d(""),we(""),ee(!1),X(0),Pe({ok:!1,issues:[],metrics:null}),pe.current=!1,Je.current={awb:"",hits:0,lastSeenAt:0},Ue.current=[],ie.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},qe.current=!1,K(0),c(t)},[c,K]);s.useEffect(()=>{if(S===i.SUCCESS){const t=j==="fast"?i.SCANNING:i.IDLE,n=j==="fast"?kn:Nn;return Ke.current=setTimeout(()=>He(t),n),()=>clearTimeout(Ke.current)}},[S,He,j]),s.useEffect(()=>{if(Ae)if(S===i.REVIEWING&&o){const t=[o.clientName||o.clientCode,o.destination,o.weight?`${o.weight} kilograms`:""].filter(Boolean);t.length&&Et(t.join(". "))}else S===i.SUCCESS&&A&&Et(`${A.clientName||A.clientCode||"Shipment"} Verified.`)},[Ae,S,o,A]),s.useEffect(()=>()=>{Me(),clearTimeout(Ke.current),clearTimeout(yt.current)},[Me]);const ae=t=>`msp-step ${S===t?"active":""}`,Ht=Math.max(1,Math.round((j==="fast"?kn:Nn)/1e3)),Jn=w.ok?"AWB quality looks good - press shutter":Sn(w.issues)||"Fit AWB slip fully in frame and hold steady",Qt=Fe&&w.ok&&L>=jt,fe=s.useMemo(()=>{if(!o)return{};const t=o.ocrExtracted||o;return{clientCode:{confidence:(t==null?void 0:t.clientNameConfidence)||0,source:(t==null?void 0:t.clientNameSource)||null},consignee:{confidence:(t==null?void 0:t.consigneeConfidence)||0,source:(t==null?void 0:t.consigneeSource)||null},destination:{confidence:(t==null?void 0:t.destinationConfidence)||0,source:(t==null?void 0:t.destinationSource)||null},pincode:{confidence:(t==null?void 0:t.pincodeConfidence)||0,source:(t==null?void 0:t.pincodeSource)||null},weight:{confidence:(t==null?void 0:t.weightConfidence)||0,source:(t==null?void 0:t.weightSource)||null}}},[o]),Yt=M.scannedItems.reduce((t,n)=>t+(n.weight||0),0),F=((Kt=o==null?void 0:o.ocrExtracted)==null?void 0:Kt.intelligence)||(o==null?void 0:o.intelligence)||null,Xt=(Zt=(Jt=(rt=me.current)==null?void 0:rt.getDiagnostics)==null?void 0:Jt.call(rt))==null?void 0:Zt.wasmFailReason,Zn=[["Step",S],["Connection",y],["Engine",Ft],...Xt?[["WASM Error",Xt]]:[],["Workflow",j],["Device",U],["Scan mode",Se],["Fail count",String(Bn)],["Reframe retries",`${mt}/${ot}`],["Camera",Fe?"ready":"waiting"],["Doc detect",Re?`yes (${L})`:"no"],["Capture quality",w.ok?"good":w.issues.join(", ")||"pending"],["Capture metrics",w.metrics?`blur ${w.metrics.blurScore} | glare ${w.metrics.glareRatio}% | skew ${w.metrics.perspectiveSkew}%`:"-"],["JPEG last shot",P.kb?`${P.kb}KB ${P.width}x${P.height} q=${P.quality}`:"-"],["Secure ctx",An()?"yes":"no"],["AWB lock",I||"-"],["Lock ms",At!=null?String(At):"-"],["Lock candidates",String(((en=ie.current)==null?void 0:en.candidateCount)||1)],["Queued",String(k.length)],["Scans",String(M.scanNumber)],["Last format",(re==null?void 0:re.format)||"-"],["Last code",(re==null?void 0:re.value)||"-"],["Decode ms",(re==null?void 0:re.sinceStartMs)!=null?String(re.sinceStartMs):"-"],["False-lock",(tn=o==null?void 0:o.scanTelemetry)!=null&&tn.falseLock?"yes":"no"]];return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:As}),e.jsxs("div",{className:"msp-root",children:[le&&e.jsx("div",{className:`flash-overlay flash-${le}`,onAnimationEnd:()=>$(null)}),ye&&e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[e.jsx(mn,{size:48,color:"white"}),e.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),e.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:ye}),e.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),e.jsx("button",{type:"button","data-testid":"scanner-diag-toggle",onClick:()=>Mn(t=>!t),style:{position:"fixed",top:12,right:12,zIndex:70,border:"1px solid rgba(255,255,255,0.18)",background:ut?"rgba(79,70,229,0.92)":"rgba(15,23,42,0.72)",color:"#fff",borderRadius:999,padding:"8px 12px",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.04em",backdropFilter:"blur(10px)",cursor:"pointer"},children:ut?"Hide Diag":"Show Diag"}),ut&&e.jsxs("div",{"data-testid":"scanner-diag-panel",style:{position:"fixed",top:56,right:12,zIndex:69,width:"min(92vw, 320px)",background:"rgba(15,23,42,0.88)",color:"#E5EEF8",border:"1px solid rgba(255,255,255,0.12)",borderRadius:18,padding:14,backdropFilter:"blur(14px)",boxShadow:"0 12px 30px rgba(0,0,0,0.25)"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10,color:"#A5B4FC"},children:"Scanner Diagnostics"}),e.jsx("div",{style:{display:"grid",gap:6},children:Zn.map(([t,n])=>e.jsxs("div",{style:{display:"flex",gap:8,justifyContent:"space-between",alignItems:"flex-start",fontSize:"0.76rem"},children:[e.jsx("div",{style:{color:"rgba(226,232,240,0.72)",minWidth:88},children:t}),e.jsx("div",{className:"mono",style:{textAlign:"right",wordBreak:"break-word",maxWidth:180},children:n})]},t))}),e.jsx("div",{style:{marginTop:10,fontSize:"0.68rem",color:"rgba(226,232,240,0.7)",lineHeight:1.4},children:"Use this to verify whether Trackon labels are being decoded as `ITF` and how quickly the first lock happens after scan start."})]}),y!=="paired"&&e.jsx("div",{className:ae(i.IDLE),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:r.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:y==="connecting"?e.jsx(vt,{size:28,color:r.primary,style:{animation:"spin 1s linear infinite"}}):e.jsx(hn,{size:28,color:r.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:y==="connecting"?"Connecting...":"Disconnected"}),e.jsx("div",{style:{fontSize:"0.82rem",color:r.muted},children:E||(m?"Preparing direct scanner session":`Connecting to session ${p}`)})]}),y==="disconnected"&&e.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[e.jsx(vt,{size:16})," Reconnect"]})]})}),e.jsx("video",{ref:V,autoPlay:!0,playsInline:!0,muted:!0,onClick:()=>{ke().catch(t=>{d((t==null?void 0:t.message)||"Camera access failed.")})},style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(S===i.SCANNING||S===i.CAPTURING)&&!ue.current?"block":"none"}}),e.jsx("div",{className:ae(i.IDLE),children:e.jsxs("div",{className:"home-root",children:[e.jsxs("div",{className:"home-header",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16},children:[e.jsxs("button",{onClick:()=>N("/app/scan"),style:{background:"white",border:"1px solid #E2E8F0",padding:"6px 12px",borderRadius:20,fontSize:"0.75rem",fontWeight:600,color:"#475569",display:"flex",alignItems:"center",gap:4,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.02)"},children:[e.jsx(as,{size:14})," Go Back"]}),e.jsxs("div",{className:"home-logo-badge",children:[e.jsx(fn,{size:11,color:y==="paired"&&navigator.onLine?"#10B981":"#EF4444"}),Ce]})]}),e.jsx("div",{className:"home-logo-row",children:e.jsxs("div",{className:"home-logo-text",children:[e.jsx("img",{src:"/images/logo.png",alt:"Sea Hawk Logo",style:{height:28,width:"auto",objectFit:"contain",padding:2,background:"white",borderRadius:6,border:"1px solid #E2E8F0"}}),e.jsx("span",{children:"Seahawk Scanner"})]})}),e.jsxs("div",{className:"home-stats-row",children:[e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:M.scanNumber}),e.jsx("div",{className:"home-stat-label",children:"Scanned"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:Yt>0?Yt.toFixed(1):"0"}),e.jsx("div",{className:"home-stat-label",children:"Total kg"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:lt}),e.jsx("div",{className:"home-stat-label",children:"Session"})]})]}),e.jsxs("div",{className:"home-date-chip",children:[e.jsx(os,{size:18,color:"#38BDF8"}),e.jsxs("div",{children:[e.jsx("div",{className:"home-date-label",children:"Scan Date"}),e.jsxs("div",{className:"home-date-value",children:[new Date(_e+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}),_e===new Date().toISOString().slice(0,10)&&e.jsx("span",{style:{fontSize:"0.65rem",color:"#10B981",marginLeft:6,fontWeight:500},children:"TODAY"})]})]}),e.jsx("div",{className:"home-date-change",children:"Change ▸"}),e.jsx("input",{type:"date",value:_e,max:new Date().toISOString().slice(0,10),onChange:t=>{const n=t.target.value;if(n&&/^\d{4}-\d{2}-\d{2}$/.test(n)){Dn(n);try{localStorage.setItem("seahawk_scanner_session_date",n)}catch{}C("light")}}})]})]}),e.jsxs("div",{className:"home-scan-section",children:[e.jsxs("div",{className:"home-scan-btn-wrap",children:[e.jsx("div",{className:"home-scan-ring"}),e.jsx("div",{className:"home-scan-ring home-scan-ring2"}),e.jsxs("button",{"data-testid":"start-scan-btn",className:"home-scan-btn",onClick:qn,children:[e.jsx(Nt,{size:34,color:"white"}),e.jsx("span",{className:"home-scan-btn-label",children:"Scan"})]})]}),e.jsx("div",{className:"home-cta-text",children:M.scanNumber===0?"Tap to start your first scan":"Tap to scan next parcel"}),e.jsxs("div",{style:{display:"flex",gap:8,marginTop:14,width:"100%",maxWidth:320},children:[e.jsxs("button",{type:"button","data-testid":"workflow-fast-btn",onClick:()=>gt("fast"),style:{flex:1,borderRadius:999,border:`1px solid ${j==="fast"?r.primary:r.border}`,background:j==="fast"?r.primaryLight:r.surface,color:j==="fast"?r.primary:r.muted,fontWeight:700,fontSize:"0.72rem",padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(gn,{size:13})," Fast scan"]}),e.jsxs("button",{type:"button","data-testid":"workflow-ocr-btn",onClick:()=>gt("ocr"),style:{flex:1,borderRadius:999,border:`1px solid ${j==="ocr"?r.primary:r.border}`,background:j==="ocr"?r.primaryLight:r.surface,color:j==="ocr"?r.primary:r.muted,fontWeight:700,fontSize:"0.72rem",padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(kt,{size:13})," OCR label"]})]}),e.jsxs("div",{style:{display:"flex",gap:8,marginTop:8,width:"100%",maxWidth:320},children:[e.jsxs("button",{type:"button","data-testid":"device-profile-phone-btn",onClick:()=>zt(H.phone),style:{flex:1,borderRadius:999,border:`1px solid ${U===H.phone?r.primary:r.border}`,background:U===H.phone?r.primaryLight:r.surface,color:U===H.phone?r.primary:r.muted,fontWeight:700,fontSize:"0.7rem",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(Nt,{size:13})," Phone lens"]}),e.jsxs("button",{type:"button","data-testid":"device-profile-rugged-btn",onClick:()=>zt(H.rugged),style:{flex:1,borderRadius:999,border:`1px solid ${U===H.rugged?r.primary:r.border}`,background:U===H.rugged?r.primaryLight:r.surface,color:U===H.rugged?r.primary:r.muted,fontWeight:700,fontSize:"0.7rem",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(cs,{size:13})," Rugged"]})]}),e.jsxs("form",{onSubmit:Gn,style:{width:"100%",maxWidth:300,marginTop:20},children:[e.jsx("div",{style:{fontSize:"0.62rem",fontWeight:700,color:r.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6,textAlign:"center"},children:"Can't scan? Enter AWB manually"}),e.jsxs("div",{style:{display:"flex",gap:6},children:[e.jsx("input",{"data-testid":"manual-awb-input",value:De,onChange:t=>It(t.target.value.toUpperCase()),placeholder:"e.g. 1234567890",inputMode:"text",autoCapitalize:"characters",style:{flex:1,padding:"9px 12px",border:`1.5px solid ${r.border}`,borderRadius:10,fontFamily:"JetBrains Mono, monospace",fontSize:"0.82rem",fontWeight:600,background:r.surface,color:r.text,outline:"none"},onFocus:t=>t.target.style.borderColor=r.primary,onBlur:t=>t.target.style.borderColor=r.border}),e.jsx("button",{type:"submit","data-testid":"manual-awb-submit",disabled:De.trim().length<6,className:"btn btn-primary",style:{padding:"9px 14px",fontSize:"0.78rem",borderRadius:10,opacity:De.trim().length>=6?1:.45},children:"Go â†’"})]})]}),e.jsxs("div",{className:"action-buttons-row",children:[e.jsxs("button",{className:"action-btn",onClick:Hn,children:[e.jsx(ls,{size:14})," ",k.length>0?`Upload (${k.length})`:"Synced"]}),e.jsxs("button",{className:"action-btn danger",onClick:Vn,children:[e.jsx(ds,{size:14})," End Session"]})]}),k.length>0&&e.jsxs("div",{style:{marginTop:14,fontSize:"0.7rem",color:r.warning,fontWeight:600,display:"flex",alignItems:"center",gap:5},children:[e.jsx(xn,{size:12})," ",k.length," offline scan",k.length>1?"s":""," pending sync"]})]}),e.jsxs("div",{className:"home-queue-section",children:[e.jsxs("div",{className:"home-queue-head",children:[e.jsxs("div",{className:"home-queue-title-text",children:[e.jsx(us,{size:11}),"Accepted Consignments"]}),M.scannedItems.length>0&&e.jsx("div",{className:"home-queue-badge",children:M.scannedItems.length})]}),e.jsx("div",{className:"home-queue-list",children:M.scannedItems.length===0?e.jsxs("div",{className:"queue-empty",children:[e.jsx(bn,{size:36,color:"rgba(255,255,255,0.12)"}),e.jsxs("div",{className:"queue-empty-text",children:["No consignments scanned yet.",e.jsx("br",{}),"Tap the button above to begin."]})]}):M.scannedItems.map((t,n)=>e.jsxs("div",{className:"queue-item",children:[e.jsx("div",{className:"queue-check",children:e.jsx(yn,{size:13,color:"#10B981"})}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{className:"queue-awb",children:t.awb}),e.jsxs("div",{className:"queue-meta",children:[t.clientCode==="OFFLINE"?e.jsx("span",{className:"queue-offline-tag",children:"Offline"}):t.clientCode&&e.jsx("span",{className:"queue-client-tag",children:t.clientCode}),t.destination&&e.jsx("span",{children:t.destination})]})]}),t.weight>0&&e.jsxs("div",{className:"queue-weight",children:[t.weight,"kg"]})]},`${t.awb}-${n}`))})]})]})}),e.jsx("div",{className:ae(i.SCANNING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[e.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:ue.current?"block":"none"}}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{className:"scan-guide",style:Se==="barcode"?{width:vn.w,height:vn.h,borderRadius:10,maxHeight:"20vw",transition:"all 0.4s ease",borderColor:E?"rgba(248,113,113,0.92)":void 0,boxShadow:E?"0 0 0 3px rgba(248,113,113,0.2)":void 0}:{width:at.w,height:at.h,borderRadius:14,maxHeight:"75vh",transition:"all 0.4s ease",borderColor:"rgba(251,191,36,0.85)",boxShadow:"0 0 0 3px rgba(251,191,36,0.2)"},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"}),Se==="barcode"&&e.jsx("div",{className:"scan-laser",children:e.jsx("div",{className:"scan-laser-spark"})})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(fn,{size:12})," ",m?"DIRECT":p]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[Se==="document"&&e.jsxs("div",{className:"cam-hud-chip",style:{background:"rgba(251,191,36,0.22)",color:"#FDE68A",fontWeight:700,fontSize:"0.65rem",gap:4},children:[e.jsx(wn,{size:11})," LABEL MODE"]}),e.jsxs("div",{className:"cam-hud-chip",style:{gap:4},children:[e.jsx(bn,{size:12})," ",M.scanNumber,Ft==="native"?e.jsx("span",{style:{color:"#34D399",fontSize:"0.6rem",fontWeight:800},children:"⚡ NATIVE"}):e.jsx("span",{style:{color:"#F59E0B",fontSize:"0.6rem",fontWeight:800},children:"ZXING"})]})]})]}),e.jsxs("div",{className:"cam-bottom",children:[Se==="barcode"?e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:6,color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:[e.jsx("div",{children:j==="fast"?"Align barcode inside the strip - auto-save on lock":"Align barcode inside the strip - camera opens for label capture after lock"}),mt>0&&e.jsxs("div",{style:{color:"#FDE68A",fontSize:"0.74rem",fontWeight:700},children:["Reframe retry ",mt,"/",ot]}),!!E&&e.jsx("div",{style:{color:"#FCA5A5",fontSize:"0.72rem",fontWeight:700},children:E})]}):e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:6},children:[e.jsx("div",{style:{color:"rgba(251,191,36,0.95)",fontSize:"0.82rem",fontWeight:700,textAlign:"center"},children:"No barcode found - capture the label and we will read the printed AWB"}),e.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"},children:[e.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:Un,children:"Capture label instead"}),e.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:()=>{q(0),K(0),d(""),ft("barcode"),C("tap")},children:"Back to barcode mode"})]})]}),e.jsxs("div",{style:{display:"flex",gap:12},children:[e.jsxs("button",{className:"cam-hud-chip",onClick:()=>gt(t=>t==="fast"?"ocr":"fast"),style:{border:"none",cursor:"pointer",gap:5},children:[j==="fast"?e.jsx(gn,{size:13}):e.jsx(kt,{size:13}),j==="fast"?"FAST":"OCR"]}),e.jsx("button",{className:"cam-hud-chip",onClick:()=>Ln(!Ae),style:{border:"none",cursor:"pointer"},children:Ae?e.jsx(ps,{size:14}):e.jsx(ms,{size:14})})]})]})]})}),e.jsx("div",{className:ae(i.CAPTURING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!Fe&&e.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[e.jsx(hs,{size:44,color:"#34D399"}),e.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:I||"OCR fallback"}),e.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:I?"Barcode locked - Preparing camera...":"Preparing label capture for printed AWB OCR..."})]}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{ref:Xe,className:`scan-guide ${Re?"detected":""}`,style:{width:at.w,height:at.h,maxHeight:"75vh",borderRadius:12},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[e.jsx(wn,{size:12})," ",I||"OCR AWB capture"]}),k.length>0&&e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(xn,{size:12})," ",k.length," queued"]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:Re?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center",transition:"color 0.3s"},children:Jn}),w.metrics&&e.jsxs("div",{style:{color:"rgba(255,255,255,0.66)",fontSize:"0.72rem",textAlign:"center"},children:["Blur ",w.metrics.blurScore," | Glare ",w.metrics.glareRatio,"% | Skew ",w.metrics.perspectiveSkew,"%"]}),e.jsx("button",{className:"capture-btn","data-testid":"capture-photo-btn",onClick:Qn,disabled:!Qt,style:{opacity:Qt?1:.4},children:e.jsx("div",{className:"capture-btn-inner"})}),g&&e.jsx("button",{type:"button","data-testid":"mock-capture-btn",onClick:Yn,style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 12px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:"Mock capture"}),e.jsx("button",{style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},onClick:()=>{ne(""),d(""),q(0),K(0),pe.current=!1,C("tap"),c(i.SCANNING)},children:"â† Rescan barcode"})]})]})}),e.jsx("div",{className:ae(i.PREVIEW),children:e.jsxs("div",{style:{background:r.bg,display:"flex",flexDirection:"column",height:"100%"},children:[e.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${r.border}`},children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.72rem",color:r.muted,fontWeight:600},children:"CAPTURED"}),e.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:I||"Printed AWB OCR"}),P.kb>0&&e.jsxs("div",{style:{fontSize:"0.68rem",color:r.mutedLight},children:[P.kb,"KB • ",P.width,"×",P.height]})]})}),e.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:Y&&e.jsx("img",{src:Y,alt:"Captured label",className:"preview-img"})}),e.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{J(null),c(i.CAPTURING)},children:[e.jsx(Cn,{size:16})," Retake"]}),e.jsxs("button",{"data-testid":"use-photo-btn",className:"btn btn-primary",style:{flex:2},onClick:Xn,children:[e.jsx(fs,{size:16})," Use Photo"]})]})]})}),e.jsx("div",{className:ae(i.PROCESSING),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16},children:[e.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[e.jsx(kt,{size:22,color:r.primary,style:{animation:"spin 2s linear infinite"}}),e.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:r.primary},children:"Intelligence Engine"})]}),e.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:r.muted},children:I}),e.jsx("div",{style:{fontSize:"0.72rem",color:r.mutedLight,marginTop:6},children:Y?"Reading AWB label with local OCR...":"Saving barcode scan..."})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(t=>e.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:t}),e.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),e.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},t)),e.jsx("div",{style:{textAlign:"center",marginTop:8},children:e.jsx("button",{className:"btn btn-outline",style:{fontSize:"0.75rem",padding:"8px 20px"},onClick:()=>{d("Cancelled by user."),c(i.ERROR)},children:"Cancel"})})]})}),e.jsx("div",{className:ae(i.REVIEWING),children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%"},children:[e.jsxs("div",{style:{padding:"14px 20px",borderBottom:`1px solid ${r.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.65rem",color:r.muted,fontWeight:600},children:"REVIEW EXTRACTION"}),e.jsx("div",{className:"mono",style:{fontSize:"0.95rem",fontWeight:700},children:(o==null?void 0:o.awb)||I})]}),(F==null?void 0:F.learnedFieldCount)>0&&e.jsxs("div",{className:"source-badge source-learned",children:["AI ",F.learnedFieldCount," auto-corrected"]})]}),e.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsxs("div",{className:`field-card ${(((nn=fe.clientCode)==null?void 0:nn.confidence)||0)<.55?"warning":""}`,children:[e.jsx("div",{className:Rt(((sn=fe.clientCode)==null?void 0:sn.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((rn=fe.clientCode)==null?void 0:rn.source)&&(()=>{const t=zn(fe.clientCode.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:x.clientCode||"",onChange:t=>T(n=>({...n,clientCode:t.target.value.toUpperCase()})),placeholder:"Client code"}),((an=F==null?void 0:F.clientMatches)==null?void 0:an.length)>0&&F.clientNeedsConfirmation&&e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:F.clientMatches.slice(0,3).map(t=>e.jsxs("button",{onClick:()=>T(n=>({...n,clientCode:t.code})),style:{fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:`1px solid ${r.border}`,background:x.clientCode===t.code?r.primaryLight:r.surface,color:r.text,cursor:"pointer",fontFamily:"inherit",fontWeight:500},children:[t.code," (",Math.round(t.score*100),"%)"]},t.code))})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:Rt(((on=fe.consignee)==null?void 0:on.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Consignee"}),e.jsx("input",{className:"field-input",value:x.consignee||"",onChange:t=>T(n=>({...n,consignee:t.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:Rt(((cn=fe.destination)==null?void 0:cn.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((ln=fe.destination)==null?void 0:ln.source)&&(()=>{const t=zn(fe.destination.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:x.destination||"",onChange:t=>T(n=>({...n,destination:t.target.value.toUpperCase()})),placeholder:"City"}),(F==null?void 0:F.pincodeCity)&&F.pincodeCity!==x.destination&&e.jsxs("button",{onClick:()=>T(t=>({...t,destination:F.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:r.successLight,color:r.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["ðŸ“ Pincode suggests: ",F.pincodeCity]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Pincode"}),e.jsx("input",{className:"field-input",value:x.pincode||"",onChange:t=>T(n=>({...n,pincode:t.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),e.jsx("div",{className:`field-card ${(dn=F==null?void 0:F.weightAnomaly)!=null&&dn.anomaly?"warning":""}`,children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Weight (kg)"}),e.jsx("input",{className:"field-input",value:x.weight||"",onChange:t=>T(n=>({...n,weight:t.target.value})),placeholder:"0.0",inputMode:"decimal"}),((un=F==null?void 0:F.weightAnomaly)==null?void 0:un.anomaly)&&e.jsxs("div",{style:{fontSize:"0.6rem",color:r.warning,marginTop:2,fontWeight:500},children:["Warning: ",F.weightAnomaly.warning]})]})})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Amount (â‚¹)"}),e.jsx("input",{className:"field-input",value:x.amount||"",onChange:t=>T(n=>({...n,amount:t.target.value})),placeholder:"0",inputMode:"decimal"})]})}),e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Order No"}),e.jsx("input",{className:"field-input",value:x.orderNo||"",onChange:t=>T(n=>({...n,orderNo:t.target.value})),placeholder:"Optional"})]})})]})]}),e.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${r.border}`,display:"flex",gap:10},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:He,children:[e.jsx(gs,{size:16})," Skip"]}),e.jsxs("button",{"data-testid":"approve-save-btn",className:"btn btn-success btn-lg",style:{flex:2},onClick:Kn,disabled:S===i.APPROVING,children:[S===i.APPROVING?e.jsx(vt,{size:16,style:{animation:"spin 1s linear infinite"}}):e.jsx(yn,{size:16}),S===i.APPROVING?"Saving...":"Approve & Save"]})]})]})}),e.jsx("div",{className:ae(i.APPROVING)}),e.jsx("div",{className:ae(i.SUCCESS),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[e.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:r.success,strokeWidth:"3",className:"success-check-circle"}),e.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:r.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:r.success,marginBottom:4},children:"Saved Successfully"}),e.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700},children:A==null?void 0:A.awb}),(A==null?void 0:A.clientCode)&&e.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:r.primaryLight,color:r.primary,fontSize:"0.78rem",fontWeight:600},children:A.clientName||A.clientCode})]}),e.jsx("div",{style:{fontSize:"0.72rem",color:r.muted},children:A!=null&&A.offlineQueued?`${k.length} queued for sync - Auto-continuing in ${Ht}s`:`#${M.scanNumber} scanned - Auto-continuing in ${Ht}s`}),e.jsxs("button",{"data-testid":"scan-next-btn",className:"btn btn-primary btn-lg btn-full",onClick:()=>He(j==="fast"?i.SCANNING:i.IDLE),style:{maxWidth:320},children:[e.jsx(Nt,{size:18})," ",j==="fast"?"Keep Scanning":"Scan Next Parcel"]})]})}),e.jsx("div",{className:ae(i.ERROR),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:r.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(mn,{size:32,color:r.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:r.error},children:"Scan Error"}),e.jsx("div",{style:{fontSize:"0.82rem",color:r.muted,marginTop:4},children:E})]}),e.jsxs("button",{className:"btn btn-primary",onClick:He,children:[e.jsx(Cn,{size:16})," Try Again"]})]})}),y==="disconnected"&&S!==i.IDLE&&e.jsxs("div",{className:"offline-banner",children:[e.jsx(hn,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline â€” Reconnecting... ",k.length?`(${k.length} queued)`:""]})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{Gs as default};
