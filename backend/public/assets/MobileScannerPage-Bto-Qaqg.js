import{j as e}from"./page-landing-CREvANXP.js";import{r as s}from"./vendor-helmet-Dwc3L0SQ.js";import{l as Xn}from"./index-DNJx-oeA.js";import{a as ge}from"./page-import-CFGNhKM8.js";import{c as Kn,n as Jn}from"./barcodeEngine-NERIk0hG.js";import{c as Zn,u as es}from"./vendor-react-DrB23wtn.js";import{b as ln,R as Ct,b1 as dn,Y as ts,aW as un,ax as ns,aX as St,Z as pn,aH as vt,J as ss,b2 as rs,ac as is,d as hn,a7 as as,H as mn,b3 as fn,aQ as gn,b4 as os,b5 as cs,a4 as ls,a1 as xn,p as ds,X as us}from"./vendor-icons-DyYViWBt.js";import"./page-reconcile-BQT9N3SU.js";import"./page-rate-calc-CC-LHkCs.js";function In(c,p){var v,h;try{if(!c||!p)return null;const E=Number(c.videoWidth||0),B=Number(c.videoHeight||0);if(!E||!B)return null;const D=(v=c.getBoundingClientRect)==null?void 0:v.call(c),g=(h=p.getBoundingClientRect)==null?void 0:h.call(p);if(!D||!g)return null;const m=Number(D.width||0),G=Number(D.height||0);if(!m||!G)return null;const b=Math.max(m/E,G/B),A=E*b,j=B*b,d=(m-A)/2,C=(G-j)/2,Ie=g.left-D.left,R=g.top-D.top,ne=g.right-D.left,Y=g.bottom-D.top,J=(Ie-d)/b,be=(R-C)/b,se=(ne-d)/b,o=(Y-C)/b,Z=(ye,we,N)=>Math.max(we,Math.min(N,ye)),f=Z(Math.min(J,se),0,E),T=Z(Math.min(be,o),0,B),F=Z(Math.max(J,se),0,E),W=Z(Math.max(be,o),0,B),le=Math.max(0,F-f),$=Math.max(0,W-T);return!le||!$?null:{x:f,y:T,w:le,h:$}}catch{return null}}function bn(c=[]){if(!c.length)return"";const p=[];return c.includes("blur")&&p.push("hold steady"),c.includes("glare")&&p.push("reduce glare"),c.includes("angle")&&p.push("straighten angle"),c.includes("dark")&&p.push("add light"),c.includes("low_edge")&&p.push("fill frame"),p.length?`Improve capture: ${p.join(", ")}.`:""}function ps(c,p){if(!c||!p||!c.videoWidth||!c.videoHeight)return null;const v=In(c,p);if(!v)return null;const h=Math.max(0,Math.floor(v.x)),E=Math.max(0,Math.floor(v.y)),B=Math.max(24,Math.floor(v.w)),D=Math.max(24,Math.floor(v.h)),g=128,m=96,G=document.createElement("canvas");G.width=g,G.height=m;const b=G.getContext("2d",{willReadFrequently:!0});if(!b)return null;b.drawImage(c,h,E,Math.min(B,c.videoWidth-h),Math.min(D,c.videoHeight-E),0,0,g,m);const A=b.getImageData(0,0,g,m).data,j=g*m,d=new Float32Array(j);let C=0,Ie=0,R=0;for(let L=0,X=0;L<A.length;L+=4,X+=1){const y=.2126*A[L]+.7152*A[L+1]+.0722*A[L+2];d[X]=y,C+=y,y>=245&&(Ie+=1),y<=24&&(R+=1)}let ne=0,Y=0,J=0,be=0,se=0,o=0;const Z=Math.max(4,Math.floor(m*.15)),f=Math.max(4,Math.floor(g*.15)),T=g;for(let L=1;L<m-1;L+=1)for(let X=1;X<g-1;X+=1){const y=L*T+X,_e=d[y],P=d[y-1],Ae=d[y+1],ze=d[y-T],Ce=d[y+T],ot=Math.abs(Ae-P),ct=Math.abs(Ce-ze),Se=ot+ct,De=Math.abs(4*_e-P-Ae-ze-Ce);ne+=De,Se>58&&(Y+=1),L<=Z&&(J+=Se),L>=m-Z&&(be+=Se),X<=f&&(se+=Se),X>=g-f&&(o+=Se)}const F=Math.max(1,(g-2)*(m-2)),W=C/j,le=ne/F,$=Y/F,ye=Ie/j,we=R/j,N=Math.abs(J-be)/Math.max(1,J+be),Ke=Math.abs(se-o)/Math.max(1,se+o),Fe=Math.max(N,Ke),ee=[];return le<22&&ee.push("blur"),ye>.18&&ee.push("glare"),(we>.55||W<40)&&ee.push("dark"),$<.08&&ee.push("low_edge"),Fe>.62&&ee.push("angle"),{ok:ee.length===0,issues:ee,metrics:{brightness:Number(W.toFixed(1)),blurScore:Number(le.toFixed(1)),glareRatio:Number((ye*100).toFixed(1)),edgeRatio:Number(($*100).toFixed(1)),perspectiveSkew:Number((Fe*100).toFixed(1))}}}function at(c,p){const v=Number(c);return Number.isFinite(v)&&v>0?v:p}function hs({samples:c=[],awb:p,now:v=Date.now(),stabilityWindowMs:h=1100,requiredHits:E=3}){const B=at(h,1100),D=Math.max(1,Math.floor(at(E,3))),g=at(v,Date.now()),m=String(p||"").trim(),G=Array.isArray(c)?c.filter(j=>(j==null?void 0:j.awb)&&g-((j==null?void 0:j.at)||0)<=B):[];if(!m)return{samples:G,hits:0,isStable:!1};const b=[...G,{awb:m,at:g}],A=b.reduce((j,d)=>d.awb===m?j+1:j,0);return{samples:b,hits:A,isStable:A>=D}}function ms({currentAttempts:c=0,maxReframeAttempts:p=2}){const v=Math.max(0,Math.floor(at(p,2))),h=Math.max(0,Math.floor(Number(c)||0))+1;return h<=v?{action:"reframe",attempts:h}:{action:"switch_to_document",attempts:v}}const fs=window.location.origin,yn={w:"90vw",h:"18vw"},rt={w:"92vw",h:"130vw"},wn=3500,Cn=900,gs=1e4,xs=12e3,bs="mobile_scanner_offline_queue",Sn="mobile_scanner_workflow_mode",vn="mobile_scanner_device_profile",ys=500,ws=1,Nn=100,it=2,Nt=2,Cs=500,kn=960,Re=.68,Ss=900,H={phone:"phone-camera",rugged:"rugged-scanner"},i={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"},vs=c=>{var p;try{(p=navigator==null?void 0:navigator.vibrate)==null||p.call(navigator,c)}catch{}},jn={tap:[20],lock:[400,50,200,50,100],success:[18,28,72],warning:[70,50,70],retry:[28,40,28],error:[110,55,110],duplicate:[90,50,90,50,90]},w=(c="tap")=>{vs(jn[c]||jn.tap)},Le=(c,p,v="sine")=>{try{const h=new(window.AudioContext||window.webkitAudioContext),E=h.createOscillator(),B=h.createGain();E.type=v,E.frequency.setValueAtTime(c,h.currentTime),B.gain.setValueAtTime(.12,h.currentTime),B.gain.exponentialRampToValueAtTime(.01,h.currentTime+p),E.connect(B),B.connect(h.destination),E.start(),E.stop(h.currentTime+p)}catch{}},xe=()=>{Le(880,.12),setTimeout(()=>Le(1100,.1),130)},Ns=()=>{Le(2700,.08,"square"),setTimeout(()=>Le(3100,.05,"square"),60)},ks=()=>Le(600,.08),Q=()=>Le(200,.25,"sawtooth"),kt=c=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const p=new SpeechSynthesisUtterance(c);p.rate=1.2,p.pitch=1,p.lang="en-IN",window.speechSynthesis.speak(p)}catch{}},En=()=>{var c;try{if(typeof window>"u")return!1;if(window.isSecureContext)return!0;const p=((c=window.location)==null?void 0:c.hostname)||"";return p==="localhost"||p==="127.0.0.1"}catch{return!1}},r={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",mutedLight:"#9CA3AF",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},js=`
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
`,Es=c=>c>=.85?"high":c>=.55?"med":"low",jt=c=>`conf-dot conf-${Es(c)}`,Rn=c=>c==="learned"?{className:"source-badge source-learned",icon:"AI",text:"Learned"}:c==="awb_master"?{className:"source-badge source-ai",icon:"DB",text:"Lookup"}:c==="courier_api"?{className:"source-badge source-history",icon:"API",text:"Courier"}:c==="fuzzy_match"?{className:"source-badge source-ai",icon:"ðŸ”",text:"Matched"}:c==="fuzzy_history"||c==="consignee_pattern"?{className:"source-badge source-history",icon:"ðŸ“Š",text:"History"}:c==="delhivery_pincode"||c==="india_post"||c==="pincode_lookup"||c==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"ðŸ“",text:"Pincode"}:null,Rs=c=>{const p=Math.floor(c/6e4);return p<60?`${p}m`:`${Math.floor(p/60)}h ${p%60}m`};function _s({standalone:c=!1}){var Ht,st,Qt,Yt,Xt,Kt,Jt,Zt,en,tn,nn,sn,rn,an,on;const{pin:p}=Zn(),v=es(),h=!!c,E=`${bs}:${h?"direct":p||"unknown"}`,B=s.useMemo(()=>`mobile_scanner_daily_count:${new Date().toISOString().slice(0,10)}`,[]),D=s.useMemo(()=>{try{return typeof window>"u"?"":new URLSearchParams(window.location.search).get("mockBarcodeRaw")||""}catch{return""}},[]),g=s.useMemo(()=>{try{if(typeof window>"u")return!1;const t=new URLSearchParams(window.location.search);return t.get("mock")==="1"||t.get("e2e")==="1"}catch{return!1}},[]),[m,G]=s.useState(null),[b,A]=s.useState("connecting"),[j,d]=s.useState(""),[C,Ie]=s.useState(i.IDLE),[R,ne]=s.useState(""),[Y,J]=s.useState(null),[be,se]=s.useState({}),[o,Z]=s.useState(null),[f,T]=s.useState({}),[F,W]=s.useState(null),[le,$]=s.useState(null),[ye,we]=s.useState(""),[N,Ke]=s.useState([]),[Fe,ee]=s.useState(!1),[L,X]=s.useState(0),[y,_e]=s.useState({ok:!1,issues:[],metrics:null}),[P,Ae]=s.useState({kb:0,width:0,height:0,quality:Re}),[ze,Ce]=s.useState(!1),[ot,ct]=s.useState("0m"),[Se,De]=s.useState("Connected"),[$e,Et]=s.useState(""),[lt,Fn]=s.useState(!1),[Rt,dt]=s.useState("idle"),[re,An]=s.useState(null),[zn,Tn]=s.useState(0),[ut,Mn]=s.useState(0),[It,pt]=s.useState(null),[ve,ht]=s.useState("barcode"),[k,mt]=s.useState(()=>{if(typeof window>"u")return"fast";try{const t=localStorage.getItem(Sn);if(t==="fast"||t==="ocr")return t}catch{}return g?"ocr":"fast"}),[q,Ft]=s.useState(()=>{if(typeof window>"u")return H.phone;try{const t=localStorage.getItem(vn);if(t===H.phone||t===H.rugged)return t}catch{}return H.phone}),ft=s.useRef(0),[M,gt]=s.useState({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now(),scannedItems:[]}),[Te,On]=s.useState(!1),[qe,Bn]=s.useState(()=>{try{const t=localStorage.getItem("seahawk_scanner_session_date");if(t&&/^\d{4}-\d{2}-\d{2}$/.test(t))return t}catch{}return new Date().toISOString().slice(0,10)}),V=s.useRef(null),Je=s.useRef(null),de=s.useRef(null),ue=s.useRef(null),pe=s.useRef(!1),Ze=s.useRef(null),Wn=s.useRef(!1),oe=s.useRef(i.IDLE),xt=s.useRef(null),Ue=s.useRef(0),Ne=s.useRef(null),At=s.useRef(new Set),Ge=s.useRef([]),et=s.useRef({awb:"",hits:0,lastSeenAt:0}),zt=s.useRef(0),Ve=s.useRef(!1),Tt=s.useRef(0),ke=s.useRef(null),je=s.useRef(null),bt=s.useRef({message:"",at:0}),ie=s.useRef({lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]}),he=s.useRef(null),l=s.useCallback(t=>{Ie(t)},[]),U=s.useCallback(t=>{ft.current=t,Tn(t)},[]),K=s.useCallback(t=>{zt.current=t,Mn(t)},[]),yt=s.useCallback((t,n="warning")=>{if(!t)return;const a=Date.now();bt.current.message===t&&a-bt.current.at<Ss||(bt.current={message:t,at:a},d(t),n&&w(n))},[]),Mt=s.useCallback(t=>{U(0),K(0),ht("document"),d(t||'No barcode lock yet. Capture label instead or tap "Back to barcode mode" and hold steady.'),w("warning")},[U,K]),tt=s.useCallback(()=>{const t=ms({currentAttempts:zt.current,maxReframeAttempts:it});if(t.action==="reframe"){K(t.attempts),U(0),d(`No lock yet. Reframe ${t.attempts}/${it}: move closer, reduce glare, keep barcode horizontal.`),w("retry");return}Mt("No stable barcode lock after reframe retries. Capture label for OCR fallback.")},[Mt,U,K]),Pn=s.useCallback(()=>{ne(""),d(""),l(i.CAPTURING)},[l]),Ot=s.useCallback(t=>{const n=Date.now(),a=hs({samples:Ge.current,awb:t,now:n,stabilityWindowMs:ys,requiredHits:ws});return Ge.current=a.samples,et.current={awb:t,hits:a.hits,lastSeenAt:n},a.isStable},[]),Ee=s.useCallback(async()=>{var a;if(!En())throw new Error("Camera requires HTTPS (or localhost). Open this page over https:// on your phone.");if(!((a=navigator==null?void 0:navigator.mediaDevices)!=null&&a.getUserMedia))throw new Error("Camera not supported on this browser/device.");if(!V.current)throw new Error("Camera element not ready.");const t=V.current.srcObject;if(t&&typeof t.getTracks=="function"&&t.getTracks().some(S=>S.readyState==="live")){await V.current.play();return}let n=null;try{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}V.current.srcObject=n,await V.current.play()},[]);s.useEffect(()=>{const t=setInterval(()=>ct(Rs(Date.now()-M.startedAt)),3e4);return()=>clearInterval(t)},[M.startedAt]);const He=s.useCallback(t=>{Ke(t);try{t.length?localStorage.setItem(E,JSON.stringify(t)):localStorage.removeItem(E)}catch{}},[E]),Me=s.useCallback(t=>{const n={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:t};return He([...N,n]),n},[N,He]),Bt=s.useCallback(async t=>{if(String((t==null?void 0:t.scanMode)||"").toLowerCase()==="fast_barcode_only"){await ge.post("/shipments/scan",{awb:t.awb,courier:"AUTO",captureOnly:!0});return}await ge.post("/shipments/scan-mobile",{awb:t.awb,imageBase64:t.imageBase64,focusImageBase64:t.focusImageBase64||t.imageBase64,sessionContext:t.sessionContext||{}})},[]),Qe=s.useCallback(async()=>{var t;if(N.length){if(h){if(!navigator.onLine)return;const n=[];for(const a of N)if((t=a==null?void 0:a.payload)!=null&&t.awb)try{await Bt(a.payload)}catch{n.push(a)}He(n),n.length?d(`Uploaded partially. ${n.length} scan(s) still queued.`):d("");return}!m||!m.connected||(N.forEach(n=>{var a;(a=n==null?void 0:n.payload)!=null&&a.awb&&m.emit("scanner:scan",n.payload)}),He([]))}},[h,m,N,He,Bt]),_=s.useCallback(t=>{gt(n=>{const a={...n,scannedItems:[{...t,time:Date.now()},...n.scannedItems]};try{localStorage.setItem(B,String(a.scanNumber))}catch{}return a})},[B]),Ln=s.useCallback(()=>{if(b!=="paired"){d(h?"Scanner is offline. Reconnect internet and retry.":"Phone is not connected to the desktop session.");return}if(d(""),g){l(i.SCANNING);return}Ee().then(()=>l(i.SCANNING)).catch(t=>d((t==null?void 0:t.message)||"Camera access failed."))},[b,Ee,l,g,h]),_n=s.useCallback(t=>{var a,u;t==null||t.preventDefault();const n=$e.trim().toUpperCase();if(!n||n.length<6){d("Enter a valid AWB number (min 6 chars)");return}if(b!=="paired"){d(h?"Scanner is offline. Reconnect internet and retry.":"Not connected to desktop session.");return}if(d(""),Et(""),ne(n),g){Ce(!0),l(i.CAPTURING);return}if(k==="fast"){(a=ke.current)==null||a.call(ke,n);return}(u=je.current)==null||u.call(je,n)},[$e,b,l,g,h,k]),Dn=s.useCallback(()=>{if(window.confirm(h?"Exit this scanner session on the phone?":"End this mobile scanner session on the phone?")){if(h){v("/app/scan");return}m!=null&&m.connected?m.emit("scanner:end-session",{reason:"Mobile ended the session"}):v("/")}},[m,v,h]),$n=s.useCallback(()=>{if(N.length>0){Qe();return}window.alert(h?"No queued scans to upload.":"Everything is already synced.")},[N.length,Qe,h]);s.useEffect(()=>{oe.current=C},[C]);const me=s.useCallback((t=null)=>{t&&Z(t),se({}),d(""),l(i.CAPTURING)},[l]),Oe=s.useCallback(t=>{if(!t)return;if(Z(t),T({clientCode:t.clientCode||"",consignee:t.consignee||"",destination:t.destination||"",pincode:t.pincode||"",weight:t.weight||0,amount:t.amount||0,orderNo:t.orderNo||""}),se({}),t.reviewRequired){l(i.REVIEWING);return}xe(),w("success"),Te&&kt(`Auto approved. ${t.clientName||""}. ${t.destination||""}.`);const n={awb:t.awb,clientCode:t.clientCode,clientName:t.clientName,destination:t.destination||"",weight:t.weight||0,autoApproved:!0};W(n),_(n),l(i.SUCCESS)},[_,l,Te]);s.useEffect(()=>{if(g){A("paired"),De("Mock Mode"),d(""),l(i.IDLE);return}if(h){G(null),A("paired"),De("Direct Mode"),d(""),l(i.IDLE);return}if(!p){d("No PIN provided.");return}const t=Xn(fs,{auth:{scannerPin:p},transports:["websocket","polling"],reconnection:!0,reconnectionDelay:1500,reconnectionAttempts:20});return t.on("connect",()=>A("connecting")),t.on("scanner:paired",({userEmail:n})=>{A("paired"),De(n?n.split("@")[0]:"Connected"),d("");const a=oe.current;a===i.PROCESSING||a===i.REVIEWING||a===i.APPROVING||a===i.SUCCESS||l(i.IDLE)}),t.on("scanner:error",({message:n})=>{d(n),A("disconnected")}),t.on("scanner:session-ended",({reason:n})=>{A("disconnected"),d(n||"Session ended by desktop."),v("/")}),t.on("disconnect",()=>A("disconnected")),t.on("reconnect",()=>{const n=oe.current;if(n===i.PROCESSING||n===i.REVIEWING||n===i.APPROVING||n===i.SUCCESS){A("paired");return}A("paired"),l(i.SCANNING)}),t.on("scanner:scan-processed",n=>{const a=oe.current;if(!(a!==i.PROCESSING&&a!==i.REVIEWING)){if(n.status==="error"){if(a!==i.PROCESSING)return;$("error"),Q(),w("error"),l(i.ERROR),d(n.error||"Scan failed on desktop.");return}if(n.status==="photo_required"||n.requiresImageCapture){me(n);return}Oe(n)}}),t.on("scanner:approval-result",({success:n,message:a,awb:u})=>{if(n){xe(),w("success"),$("success");const S={awb:(o==null?void 0:o.awb)||u,clientCode:f.clientCode,clientName:(o==null?void 0:o.clientName)||f.clientCode,destination:f.destination||"",weight:parseFloat(f.weight)||0};W(S),_(S),l(i.SUCCESS)}else Q(),w("error"),d(a||"Approval failed.")}),t.on("scanner:ready-for-next",()=>{}),G(t),()=>{t.disconnect()}},[p,_,o,f,l,v,g,h,Oe,me]),s.useEffect(()=>{try{const t=localStorage.getItem(E);if(!t)return;const n=JSON.parse(t);Array.isArray(n)&&n.length&&Ke(n)}catch{}},[E]),s.useEffect(()=>{try{localStorage.setItem(Sn,k)}catch{}},[k]),s.useEffect(()=>{try{localStorage.setItem(vn,q)}catch{}},[q]),s.useEffect(()=>{if(N.length){if(h){b==="paired"&&navigator.onLine&&Qe();return}b==="paired"&&(m!=null&&m.connected)&&Qe()}},[b,m,N.length,Qe,h]);const Be=s.useCallback(async()=>{var t;try{if(Ce(!1),he.current&&he.current.stop(),ue.current){try{const n=ue.current;n!=null&&n.barcodeScanner&&await n.barcodeScanner.dispose()}catch{}ue.current=null}if(de.current){try{await de.current.reset()}catch{}de.current=null}(t=V.current)!=null&&t.srcObject&&(V.current.srcObject.getTracks().forEach(n=>n.stop()),V.current.srcObject=null)}catch{}},[]),We=s.useCallback(async()=>{try{if(dt("idle"),he.current&&he.current.stop(),ue.current){try{await ue.current.barcodeScanner.dispose()}catch{}ue.current=null}if(de.current){try{de.current._type==="native"?de.current.reset():await de.current.reset()}catch{}de.current=null}}catch{}},[]),Wt=s.useCallback(async()=>{if(V.current){await We();try{Ue.current=Date.now(),await Ee(),he.current||(he.current=Kn()),await he.current.start(V.current,Je.current,{onDetected:(t,n)=>{var S;if(pe.current)return;U(0);const a=(n==null?void 0:n.format)||"unknown",u=(n==null?void 0:n.engine)||"unknown";An({value:t,format:a,engine:u,at:Date.now(),sinceStartMs:Ue.current?Date.now()-Ue.current:null,candidateCount:(n==null?void 0:n.candidateCount)||1,ambiguous:!1,alternatives:(n==null?void 0:n.alternatives)||[]}),dt(u),(S=Ne.current)==null||S.call(Ne,t,{candidateCount:(n==null?void 0:n.candidateCount)||1,ambiguous:!1,alternatives:(n==null?void 0:n.alternatives)||[],format:a,engine:u})},onFail:()=>{const t=ft.current+1;U(t),t>=Nn&&tt()},onEngineReady:t=>{console.log(`[MobileScanner] Barcode engine ready: ${t}`),dt(t)}})}catch(t){d("Camera access failed: "+t.message)}}},[Ee,We,tt,U]),Pt=s.useCallback((t,n={})=>{var x,z;const a=String(t||"").trim().replace(/\s+/g,"").toUpperCase(),u=Jn(t)||a;if(pe.current||oe.current!==i.SCANNING)return;if(!u||u.length<8){a.replace(/[^A-Z0-9]/g,"").length>=4&&yt("Partial barcode detected. Move closer so full AWB is visible.");return}if(n!=null&&n.ambiguous){const O=ft.current+1;U(O),yt("Multiple barcodes detected. Keep only the AWB barcode inside the strip.","retry"),O>=Nn&&tt();return}if(!g&&!Ot(u))return;if(pe.current=!0,At.current.has(u)){w("duplicate"),Q(),we(u),setTimeout(()=>{we(""),pe.current=!1,et.current={awb:"",hits:0,lastSeenAt:0},Ge.current=[]},2500);return}clearTimeout(xt.current),w("lock"),Ns(),ne(u);const S=Ue.current?Date.now()-Ue.current:null;if(pt(S),ie.current={lockTimeMs:S,candidateCount:Number((n==null?void 0:n.candidateCount)||1),ambiguous:!!(n!=null&&n.ambiguous),alternatives:Array.isArray(n==null?void 0:n.alternatives)?n.alternatives.slice(0,3):[]},K(0),U(0),d(""),gt(O=>{const ce={...O,scanNumber:O.scanNumber+1};return ce.scannedAwbs=new Set(O.scannedAwbs),ce.scannedAwbs.add(u),At.current=ce.scannedAwbs,ce}),k==="fast"){(x=ke.current)==null||x.call(ke,u);return}(z=je.current)==null||z.call(je,u)},[Ot,k,g,U,K,yt,tt]);s.useEffect(()=>{Ne.current=Pt},[Pt]),s.useEffect(()=>{if(C===i.SCANNING&&(pe.current=!1,et.current={awb:"",hits:0,lastSeenAt:0},Ge.current=[],ie.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},pt(null),K(0),U(0),ht("barcode"),Wt(),g&&D)){const t=setTimeout(()=>{var n;oe.current===i.SCANNING&&((n=Ne.current)==null||n.call(Ne,D))},50);return()=>clearTimeout(t)}return()=>{C===i.SCANNING&&We()}},[C,Wt,We,U,K,g,D]);const Lt=s.useCallback(async()=>{if(g){Ce(!0);return}await We();try{await Ee(),Ce(!0)}catch(t){d("Camera access failed: "+t.message)}},[Ee,We,g]);s.useEffect(()=>{C===i.CAPTURING&&Lt()},[C,Lt]);const nt=s.useCallback(()=>{const t=V.current,n=Je.current;return ps(t,n)},[]);s.useEffect(()=>{if(C!==i.CAPTURING){ee(!1),X(0),_e({ok:!1,issues:[],metrics:null}),Wn.current=!1,Ve.current=!1;return}const t=setInterval(()=>{const n=nt();n&&(_e(n),ee(n.ok),X(a=>{const u=n.ok?Math.min(a+1,8):0;return u>=Nt&&!Ve.current&&(w("tap"),Ve.current=!0),n.ok||(Ve.current=!1),u}))},280);return()=>clearInterval(t)},[C,nt]);const _t=s.useCallback((t={})=>{const n=V.current,a=Je.current;if(!n||!a||!n.videoWidth)return null;const u=In(n,a);if(!u)return null;const S=u.x,x=u.y,z=u.w,O=u.h;if(!z||!O)return null;const ce=Math.max(640,Number(t.maxWidth||kn)),Xe=Math.min(.85,Math.max(.55,Number(t.quality||Re))),te=document.createElement("canvas");te.width=Math.min(ce,Math.round(z)),te.height=Math.round(te.width/z*O),te.getContext("2d").drawImage(n,S,x,z,O,0,0,te.width,te.height);const wt=te.toDataURL("image/jpeg",Xe).split(",")[1]||"";if(!wt)return null;const Yn=Math.floor(wt.length*3/4);return{base64:wt,width:te.width,height:te.height,approxBytes:Yn,quality:Xe}},[]),qn=s.useCallback(()=>{const t=Date.now();if(t-Tt.current<Cs)return;Tt.current=t;const n=nt()||y;if(!(n!=null&&n.ok)||L<Nt){d(bn(n==null?void 0:n.issues)||"Capture quality is low. Hold steady and align the AWB in the frame."),w("warning"),Q();return}$("white"),ks(),w("tap");const a=_t({maxWidth:kn,quality:Re});if(!(a!=null&&a.base64)){d("Could not capture image. Try again."),pe.current=!1;return}Ae({kb:Math.round((a.approxBytes||0)/1024),width:a.width||0,height:a.height||0,quality:a.quality||Re}),J(`data:image/jpeg;base64,${a.base64}`),Be(),l(i.PREVIEW)},[_t,Be,l,nt,y,L]),Un=s.useCallback(()=>{if(!g)return;const t="data:image/jpeg;base64,ZmFrZS1tb2NrLWltYWdl";Ae({kb:0,width:0,height:0,quality:Re}),J(t),Be(),l(i.PREVIEW)},[l,g,Be]),Pe=s.useCallback(()=>{var t,n,a;return{scanNumber:M.scanNumber,recentClient:M.dominantClient,dominantClient:M.dominantClient,dominantClientCount:M.dominantClientCount,sessionDurationMin:Math.round((Date.now()-M.startedAt)/6e4),sessionDate:qe,scanWorkflowMode:k,scanMode:ve,deviceProfile:q,hardwareClass:q===H.rugged?"rugged":"phone",captureQuality:{ok:!!y.ok,issues:Array.isArray(y.issues)?y.issues.slice(0,8):[],metrics:y.metrics||null},captureMeta:{kb:P.kb||0,width:P.width||0,height:P.height||0,quality:P.quality||Re},lockTimeMs:Number.isFinite(Number((t=ie.current)==null?void 0:t.lockTimeMs))?Number(ie.current.lockTimeMs):null,lockCandidateCount:Number.isFinite(Number((n=ie.current)==null?void 0:n.candidateCount))?Number(ie.current.candidateCount):1,lockAlternatives:Array.isArray((a=ie.current)==null?void 0:a.alternatives)?ie.current.alternatives.slice(0,3):[]}},[M,qe,k,ve,q,y,P]),Dt=s.useCallback(async t=>{var u,S;const n=String(t||"").trim().toUpperCase();if(!n)return;if(l(i.PROCESSING),g){setTimeout(()=>{const x={awb:n,clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25};W(x),_(x),l(i.SUCCESS)},120);return}const a={awb:n,imageBase64:null,focusImageBase64:null,scanMode:"fast_barcode_only",sessionContext:Pe()};if(h){if(!navigator.onLine){Me(a),xe(),w("success");const x={awb:n,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};W({...x,offlineQueued:!0}),_(x),l(i.SUCCESS);return}try{const x=await ge.post("/shipments/scan",{awb:n,courier:"AUTO",captureOnly:!0}),z=((u=x==null?void 0:x.data)==null?void 0:u.shipment)||{},O={awb:z.awb||n,clientCode:z.clientCode||"MISC",clientName:((S=z.client)==null?void 0:S.company)||z.clientCode||"Scanned",destination:z.destination||"",weight:z.weight||0};W(O),_(O),xe(),w("success"),l(i.SUCCESS)}catch(x){d((x==null?void 0:x.message)||"Barcode processing failed. Please try again."),Q(),w("error"),l(i.ERROR)}return}if(!m||!m.connected||b!=="paired"){Me(a),xe(),w("success");const x={awb:n,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};W({...x,offlineQueued:!0}),_(x),l(i.SUCCESS);return}m.emit("scanner:scan",a),setTimeout(()=>{oe.current===i.PROCESSING&&(d("Barcode processing timed out. Please try scanning again."),Q(),w("error"),l(i.ERROR))},gs)},[m,b,l,g,Me,_,Pe,h]);s.useEffect(()=>{ke.current=Dt},[Dt]);const $t=s.useCallback(async t=>{const n=String(t||"").trim().toUpperCase();if(!n)return;if(l(i.PROCESSING),g){l(i.CAPTURING);return}const a={awb:n,scanMode:"lookup_first",sessionContext:Pe()};if(h){if(!navigator.onLine){me({awb:n,status:"photo_required",requiresImageCapture:!0});return}try{const u=await ge.post("/shipments/scan-mobile",a),S=(u==null?void 0:u.data)||u;if(S.status==="error"||!S.success){$("error"),Q(),w("error"),l(i.ERROR),d(S.error||S.message||"Lookup failed.");return}if(S.status==="photo_required"||S.requiresImageCapture){me(S);return}Oe(S)}catch(u){d((u==null?void 0:u.message)||"Lookup failed. Please try again."),Q(),w("error"),l(i.ERROR)}return}if(!m||!m.connected||b!=="paired"){me({awb:n,status:"photo_required",requiresImageCapture:!0});return}m.emit("scanner:scan",a),setTimeout(()=>{oe.current===i.PROCESSING&&(d("Lookup timed out. Capture the label photo and continue."),l(i.CAPTURING))},xs)},[m,b,l,g,Pe,h,me,Oe]);s.useEffect(()=>{je.current=$t},[$t]);const Gn=s.useCallback(async()=>{if(!Y)return;if(l(i.PROCESSING),g){setTimeout(()=>{const a={awb:R||"100454974120",clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25};W(a),_(a),l(i.SUCCESS)},250);return}const t=Y.split(",")[1]||Y,n={awb:R||"",imageBase64:t,focusImageBase64:t,scanMode:"ocr_label",sessionContext:Pe()};if(h){if(!navigator.onLine){Me(n),xe(),w("success");const a={awb:R||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};W({...a,offlineQueued:!0}),_(a),l(i.SUCCESS);return}try{const a=await ge.post("/shipments/scan-mobile",n),u=(a==null?void 0:a.data)||a;if(u.status==="error"||!u.success){$("error"),Q(),w("error"),l(i.ERROR),d(u.error||u.message||"Scan failed.");return}if(u.status==="photo_required"||u.requiresImageCapture){me(u);return}Oe(u)}catch(a){d((a==null?void 0:a.message)||"Server error. Please try again."),Q(),w("error"),l(i.ERROR)}return}if(!m||!m.connected||b!=="paired"){Me(n),xe(),w("success");const a={awb:R||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};W({...a,offlineQueued:!0}),_(a),l(i.SUCCESS);return}m.emit("scanner:scan",n),setTimeout(()=>{oe.current===i.PROCESSING&&(d("OCR timed out after 40 seconds. Retake the label photo and try again."),Q(),w("error"),l(i.ERROR))},4e4)},[m,R,Y,l,b,Me,_,g,Pe,h,Oe,me]),Vn=s.useCallback(async()=>{var S;if(!o)return;l(i.APPROVING);let t=!h;if(g){setTimeout(()=>{const x={awb:o.awb||R,clientCode:f.clientCode||"MOCKCL",clientName:o.clientName||f.clientCode||"Mock Client",destination:f.destination||"",weight:parseFloat(f.weight)||0};W(x),_(x),$("success"),t=!0,l(i.SUCCESS)},200);return}const n={clientCode:o.clientCode||"",clientName:o.clientName||"",consignee:o.consignee||"",destination:o.destination||""},a={clientCode:f.clientCode||"",clientName:f.clientCode||"",consignee:f.consignee||"",destination:f.destination||""},u={clientCode:f.clientCode,consignee:f.consignee,destination:f.destination,pincode:f.pincode,weight:parseFloat(f.weight)||0,amount:parseFloat(f.amount)||0,orderNo:f.orderNo||""};if(h)try{(o.ocrExtracted||o)&&await ge.post("/shipments/learn-corrections",{ocrFields:n,approvedFields:a}),o.shipmentId?await ge.put(`/shipments/${o.shipmentId}`,u):await ge.post("/shipments",{awb:o.awb||R,...u}),xe(),w("success"),$("success");const x={awb:(o==null?void 0:o.awb)||R,clientCode:f.clientCode,clientName:(o==null?void 0:o.clientName)||f.clientCode,destination:f.destination||"",weight:parseFloat(f.weight)||0};W(x),_(x),t=!0,l(i.SUCCESS)}catch(x){l(i.REVIEWING),Q(),w("error"),d((x==null?void 0:x.message)||"Approval failed.")}else{if(!m){l(i.REVIEWING),d("Not connected to desktop session.");return}(o.ocrExtracted||o)&&m.emit("scanner:learn-corrections",{pin:p,ocrFields:n,approvedFields:a,courier:(o==null?void 0:o.courier)||((S=o==null?void 0:o.ocrExtracted)==null?void 0:S.courier)||"",deviceProfile:q}),m.emit("scanner:approval-submit",{shipmentId:o.shipmentId,awb:o.awb||R,fields:u},x=>{x!=null&&x.success||(l(i.REVIEWING),Q(),w("error"),d((x==null?void 0:x.message)||"Approval failed."))})}t&&f.clientCode&&f.clientCode!=="MISC"&&gt(x=>{var ce,Xe;const z={...x.clientFreq};z[f.clientCode]=(z[f.clientCode]||0)+1;const O=Object.entries(z).sort((te,cn)=>cn[1]-te[1]);return{...x,clientFreq:z,dominantClient:((ce=O[0])==null?void 0:ce[1])>=2?O[0][0]:null,dominantClientCount:((Xe=O[0])==null?void 0:Xe[1])||0}})},[m,o,f,R,p,l,_,g,q,h]),Ye=s.useCallback((t=i.IDLE)=>{clearTimeout(Ze.current),clearTimeout(xt.current),ne(""),J(null),Ae({kb:0,width:0,height:0,quality:Re}),Z(null),T({}),se({}),W(null),pt(null),d(""),we(""),ee(!1),X(0),_e({ok:!1,issues:[],metrics:null}),pe.current=!1,et.current={awb:"",hits:0,lastSeenAt:0},Ge.current=[],ie.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},Ve.current=!1,K(0),l(t)},[l,K]);s.useEffect(()=>{if(C===i.SUCCESS){const t=k==="fast"?i.SCANNING:i.IDLE,n=k==="fast"?Cn:wn;return Ze.current=setTimeout(()=>Ye(t),n),()=>clearTimeout(Ze.current)}},[C,Ye,k]),s.useEffect(()=>{if(Te)if(C===i.REVIEWING&&o){const t=[o.clientName||o.clientCode,o.destination,o.weight?`${o.weight} kilograms`:""].filter(Boolean);t.length&&kt(t.join(". "))}else C===i.SUCCESS&&F&&kt(`${F.clientName||F.clientCode||"Shipment"} Verified.`)},[Te,C,o,F]),s.useEffect(()=>()=>{Be(),clearTimeout(Ze.current),clearTimeout(xt.current)},[Be]);const ae=t=>`msp-step ${C===t?"active":""}`,qt=Math.max(1,Math.round((k==="fast"?Cn:wn)/1e3)),Hn=y.ok?"AWB quality looks good - press shutter":bn(y.issues)||"Fit AWB slip fully in frame and hold steady",Ut=ze&&y.ok&&L>=Nt,fe=s.useMemo(()=>{if(!o)return{};const t=o.ocrExtracted||o;return{clientCode:{confidence:(t==null?void 0:t.clientNameConfidence)||0,source:(t==null?void 0:t.clientNameSource)||null},consignee:{confidence:(t==null?void 0:t.consigneeConfidence)||0,source:(t==null?void 0:t.consigneeSource)||null},destination:{confidence:(t==null?void 0:t.destinationConfidence)||0,source:(t==null?void 0:t.destinationSource)||null},pincode:{confidence:(t==null?void 0:t.pincodeConfidence)||0,source:(t==null?void 0:t.pincodeSource)||null},weight:{confidence:(t==null?void 0:t.weightConfidence)||0,source:(t==null?void 0:t.weightSource)||null}}},[o]),Gt=M.scannedItems.reduce((t,n)=>t+(n.weight||0),0),I=((Ht=o==null?void 0:o.ocrExtracted)==null?void 0:Ht.intelligence)||(o==null?void 0:o.intelligence)||null,Vt=(Yt=(Qt=(st=he.current)==null?void 0:st.getDiagnostics)==null?void 0:Qt.call(st))==null?void 0:Yt.wasmFailReason,Qn=[["Step",C],["Connection",b],["Engine",Rt],...Vt?[["WASM Error",Vt]]:[],["Workflow",k],["Device",q],["Scan mode",ve],["Fail count",String(zn)],["Reframe retries",`${ut}/${it}`],["Camera",ze?"ready":"waiting"],["Doc detect",Fe?`yes (${L})`:"no"],["Capture quality",y.ok?"good":y.issues.join(", ")||"pending"],["Capture metrics",y.metrics?`blur ${y.metrics.blurScore} | glare ${y.metrics.glareRatio}% | skew ${y.metrics.perspectiveSkew}%`:"-"],["JPEG last shot",P.kb?`${P.kb}KB ${P.width}x${P.height} q=${P.quality}`:"-"],["Secure ctx",En()?"yes":"no"],["AWB lock",R||"-"],["Lock ms",It!=null?String(It):"-"],["Lock candidates",String(((Xt=ie.current)==null?void 0:Xt.candidateCount)||1)],["Queued",String(N.length)],["Scans",String(M.scanNumber)],["Last format",(re==null?void 0:re.format)||"-"],["Last code",(re==null?void 0:re.value)||"-"],["Decode ms",(re==null?void 0:re.sinceStartMs)!=null?String(re.sinceStartMs):"-"],["False-lock",(Kt=o==null?void 0:o.scanTelemetry)!=null&&Kt.falseLock?"yes":"no"]];return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:js}),e.jsxs("div",{className:"msp-root",children:[le&&e.jsx("div",{className:`flash-overlay flash-${le}`,onAnimationEnd:()=>$(null)}),ye&&e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[e.jsx(ln,{size:48,color:"white"}),e.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),e.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:ye}),e.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),e.jsx("button",{type:"button","data-testid":"scanner-diag-toggle",onClick:()=>Fn(t=>!t),style:{position:"fixed",top:12,right:12,zIndex:70,border:"1px solid rgba(255,255,255,0.18)",background:lt?"rgba(79,70,229,0.92)":"rgba(15,23,42,0.72)",color:"#fff",borderRadius:999,padding:"8px 12px",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.04em",backdropFilter:"blur(10px)",cursor:"pointer"},children:lt?"Hide Diag":"Show Diag"}),lt&&e.jsxs("div",{"data-testid":"scanner-diag-panel",style:{position:"fixed",top:56,right:12,zIndex:69,width:"min(92vw, 320px)",background:"rgba(15,23,42,0.88)",color:"#E5EEF8",border:"1px solid rgba(255,255,255,0.12)",borderRadius:18,padding:14,backdropFilter:"blur(14px)",boxShadow:"0 12px 30px rgba(0,0,0,0.25)"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10,color:"#A5B4FC"},children:"Scanner Diagnostics"}),e.jsx("div",{style:{display:"grid",gap:6},children:Qn.map(([t,n])=>e.jsxs("div",{style:{display:"flex",gap:8,justifyContent:"space-between",alignItems:"flex-start",fontSize:"0.76rem"},children:[e.jsx("div",{style:{color:"rgba(226,232,240,0.72)",minWidth:88},children:t}),e.jsx("div",{className:"mono",style:{textAlign:"right",wordBreak:"break-word",maxWidth:180},children:n})]},t))}),e.jsx("div",{style:{marginTop:10,fontSize:"0.68rem",color:"rgba(226,232,240,0.7)",lineHeight:1.4},children:"Use this to verify whether Trackon labels are being decoded as `ITF` and how quickly the first lock happens after scan start."})]}),b!=="paired"&&e.jsx("div",{className:ae(i.IDLE),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:r.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:b==="connecting"?e.jsx(Ct,{size:28,color:r.primary,style:{animation:"spin 1s linear infinite"}}):e.jsx(dn,{size:28,color:r.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:b==="connecting"?"Connecting...":"Disconnected"}),e.jsx("div",{style:{fontSize:"0.82rem",color:r.muted},children:j||(h?"Preparing direct scanner session":`Connecting to session ${p}`)})]}),b==="disconnected"&&e.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[e.jsx(Ct,{size:16})," Reconnect"]})]})}),e.jsx("video",{ref:V,autoPlay:!0,playsInline:!0,muted:!0,onClick:()=>{Ee().catch(t=>{d((t==null?void 0:t.message)||"Camera access failed.")})},style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(C===i.SCANNING||C===i.CAPTURING)&&!ue.current?"block":"none"}}),e.jsx("div",{className:ae(i.IDLE),children:e.jsxs("div",{className:"home-root",children:[e.jsxs("div",{className:"home-header",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16},children:[e.jsxs("button",{onClick:()=>v("/app/scan"),style:{background:"white",border:"1px solid #E2E8F0",padding:"6px 12px",borderRadius:20,fontSize:"0.75rem",fontWeight:600,color:"#475569",display:"flex",alignItems:"center",gap:4,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.02)"},children:[e.jsx(ts,{size:14})," Go Back"]}),e.jsxs("div",{className:"home-logo-badge",children:[e.jsx(un,{size:11,color:b==="paired"&&navigator.onLine?"#10B981":"#EF4444"}),Se]})]}),e.jsx("div",{className:"home-logo-row",children:e.jsxs("div",{className:"home-logo-text",children:[e.jsx("img",{src:"/images/logo.png",alt:"Sea Hawk Logo",style:{height:28,width:"auto",objectFit:"contain",padding:2,background:"white",borderRadius:6,border:"1px solid #E2E8F0"}}),e.jsx("span",{children:"Seahawk Scanner"})]})}),e.jsxs("div",{className:"home-stats-row",children:[e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:M.scanNumber}),e.jsx("div",{className:"home-stat-label",children:"Scanned"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:Gt>0?Gt.toFixed(1):"0"}),e.jsx("div",{className:"home-stat-label",children:"Total kg"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:ot}),e.jsx("div",{className:"home-stat-label",children:"Session"})]})]}),e.jsxs("div",{className:"home-date-chip",children:[e.jsx(ns,{size:18,color:"#38BDF8"}),e.jsxs("div",{children:[e.jsx("div",{className:"home-date-label",children:"Scan Date"}),e.jsxs("div",{className:"home-date-value",children:[new Date(qe+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}),qe===new Date().toISOString().slice(0,10)&&e.jsx("span",{style:{fontSize:"0.65rem",color:"#10B981",marginLeft:6,fontWeight:500},children:"TODAY"})]})]}),e.jsx("div",{className:"home-date-change",children:"Change ▸"}),e.jsx("input",{type:"date",value:qe,max:new Date().toISOString().slice(0,10),onChange:t=>{const n=t.target.value;if(n&&/^\d{4}-\d{2}-\d{2}$/.test(n)){Bn(n);try{localStorage.setItem("seahawk_scanner_session_date",n)}catch{}w("light")}}})]})]}),e.jsxs("div",{className:"home-scan-section",children:[e.jsxs("div",{className:"home-scan-btn-wrap",children:[e.jsx("div",{className:"home-scan-ring"}),e.jsx("div",{className:"home-scan-ring home-scan-ring2"}),e.jsxs("button",{"data-testid":"start-scan-btn",className:"home-scan-btn",onClick:Ln,children:[e.jsx(St,{size:34,color:"white"}),e.jsx("span",{className:"home-scan-btn-label",children:"Scan"})]})]}),e.jsx("div",{className:"home-cta-text",children:M.scanNumber===0?"Tap to start your first scan":"Tap to scan next parcel"}),e.jsxs("div",{style:{display:"flex",gap:8,marginTop:14,width:"100%",maxWidth:320},children:[e.jsxs("button",{type:"button","data-testid":"workflow-fast-btn",onClick:()=>mt("fast"),style:{flex:1,borderRadius:999,border:`1px solid ${k==="fast"?r.primary:r.border}`,background:k==="fast"?r.primaryLight:r.surface,color:k==="fast"?r.primary:r.muted,fontWeight:700,fontSize:"0.72rem",padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(pn,{size:13})," Fast scan"]}),e.jsxs("button",{type:"button","data-testid":"workflow-ocr-btn",onClick:()=>mt("ocr"),style:{flex:1,borderRadius:999,border:`1px solid ${k==="ocr"?r.primary:r.border}`,background:k==="ocr"?r.primaryLight:r.surface,color:k==="ocr"?r.primary:r.muted,fontWeight:700,fontSize:"0.72rem",padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(vt,{size:13})," OCR label"]})]}),e.jsxs("div",{style:{display:"flex",gap:8,marginTop:8,width:"100%",maxWidth:320},children:[e.jsxs("button",{type:"button","data-testid":"device-profile-phone-btn",onClick:()=>Ft(H.phone),style:{flex:1,borderRadius:999,border:`1px solid ${q===H.phone?r.primary:r.border}`,background:q===H.phone?r.primaryLight:r.surface,color:q===H.phone?r.primary:r.muted,fontWeight:700,fontSize:"0.7rem",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(St,{size:13})," Phone lens"]}),e.jsxs("button",{type:"button","data-testid":"device-profile-rugged-btn",onClick:()=>Ft(H.rugged),style:{flex:1,borderRadius:999,border:`1px solid ${q===H.rugged?r.primary:r.border}`,background:q===H.rugged?r.primaryLight:r.surface,color:q===H.rugged?r.primary:r.muted,fontWeight:700,fontSize:"0.7rem",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(ss,{size:13})," Rugged"]})]}),e.jsxs("form",{onSubmit:_n,style:{width:"100%",maxWidth:300,marginTop:20},children:[e.jsx("div",{style:{fontSize:"0.62rem",fontWeight:700,color:r.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6,textAlign:"center"},children:"Can't scan? Enter AWB manually"}),e.jsxs("div",{style:{display:"flex",gap:6},children:[e.jsx("input",{"data-testid":"manual-awb-input",value:$e,onChange:t=>Et(t.target.value.toUpperCase()),placeholder:"e.g. 1234567890",inputMode:"text",autoCapitalize:"characters",style:{flex:1,padding:"9px 12px",border:`1.5px solid ${r.border}`,borderRadius:10,fontFamily:"JetBrains Mono, monospace",fontSize:"0.82rem",fontWeight:600,background:r.surface,color:r.text,outline:"none"},onFocus:t=>t.target.style.borderColor=r.primary,onBlur:t=>t.target.style.borderColor=r.border}),e.jsx("button",{type:"submit","data-testid":"manual-awb-submit",disabled:$e.trim().length<6,className:"btn btn-primary",style:{padding:"9px 14px",fontSize:"0.78rem",borderRadius:10,opacity:$e.trim().length>=6?1:.45},children:"Go â†’"})]})]}),e.jsxs("div",{className:"action-buttons-row",children:[e.jsxs("button",{className:"action-btn",onClick:$n,children:[e.jsx(rs,{size:14})," ",N.length>0?`Upload (${N.length})`:"Synced"]}),e.jsxs("button",{className:"action-btn danger",onClick:Dn,children:[e.jsx(is,{size:14})," End Session"]})]}),N.length>0&&e.jsxs("div",{style:{marginTop:14,fontSize:"0.7rem",color:r.warning,fontWeight:600,display:"flex",alignItems:"center",gap:5},children:[e.jsx(hn,{size:12})," ",N.length," offline scan",N.length>1?"s":""," pending sync"]})]}),e.jsxs("div",{className:"home-queue-section",children:[e.jsxs("div",{className:"home-queue-head",children:[e.jsxs("div",{className:"home-queue-title-text",children:[e.jsx(as,{size:11}),"Accepted Consignments"]}),M.scannedItems.length>0&&e.jsx("div",{className:"home-queue-badge",children:M.scannedItems.length})]}),e.jsx("div",{className:"home-queue-list",children:M.scannedItems.length===0?e.jsxs("div",{className:"queue-empty",children:[e.jsx(mn,{size:36,color:"rgba(255,255,255,0.12)"}),e.jsxs("div",{className:"queue-empty-text",children:["No consignments scanned yet.",e.jsx("br",{}),"Tap the button above to begin."]})]}):M.scannedItems.map((t,n)=>e.jsxs("div",{className:"queue-item",children:[e.jsx("div",{className:"queue-check",children:e.jsx(fn,{size:13,color:"#10B981"})}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{className:"queue-awb",children:t.awb}),e.jsxs("div",{className:"queue-meta",children:[t.clientCode==="OFFLINE"?e.jsx("span",{className:"queue-offline-tag",children:"Offline"}):t.clientCode&&e.jsx("span",{className:"queue-client-tag",children:t.clientCode}),t.destination&&e.jsx("span",{children:t.destination})]})]}),t.weight>0&&e.jsxs("div",{className:"queue-weight",children:[t.weight,"kg"]})]},`${t.awb}-${n}`))})]})]})}),e.jsx("div",{className:ae(i.SCANNING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[e.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:ue.current?"block":"none"}}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{className:"scan-guide",style:ve==="barcode"?{width:yn.w,height:yn.h,borderRadius:10,maxHeight:"20vw",transition:"all 0.4s ease",borderColor:j?"rgba(248,113,113,0.92)":void 0,boxShadow:j?"0 0 0 3px rgba(248,113,113,0.2)":void 0}:{width:rt.w,height:rt.h,borderRadius:14,maxHeight:"75vh",transition:"all 0.4s ease",borderColor:"rgba(251,191,36,0.85)",boxShadow:"0 0 0 3px rgba(251,191,36,0.2)"},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"}),ve==="barcode"&&e.jsx("div",{className:"scan-laser",children:e.jsx("div",{className:"scan-laser-spark"})})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(un,{size:12})," ",h?"DIRECT":p]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[ve==="document"&&e.jsxs("div",{className:"cam-hud-chip",style:{background:"rgba(251,191,36,0.22)",color:"#FDE68A",fontWeight:700,fontSize:"0.65rem",gap:4},children:[e.jsx(gn,{size:11})," LABEL MODE"]}),e.jsxs("div",{className:"cam-hud-chip",style:{gap:4},children:[e.jsx(mn,{size:12})," ",M.scanNumber,Rt==="native"?e.jsx("span",{style:{color:"#34D399",fontSize:"0.6rem",fontWeight:800},children:"⚡ NATIVE"}):e.jsx("span",{style:{color:"#F59E0B",fontSize:"0.6rem",fontWeight:800},children:"ZXING"})]})]})]}),e.jsxs("div",{className:"cam-bottom",children:[ve==="barcode"?e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:6,color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:[e.jsx("div",{children:k==="fast"?"Align barcode inside the strip - auto-save on lock":"Align barcode inside the strip - camera opens for label capture after lock"}),ut>0&&e.jsxs("div",{style:{color:"#FDE68A",fontSize:"0.74rem",fontWeight:700},children:["Reframe retry ",ut,"/",it]}),!!j&&e.jsx("div",{style:{color:"#FCA5A5",fontSize:"0.72rem",fontWeight:700},children:j})]}):e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:6},children:[e.jsx("div",{style:{color:"rgba(251,191,36,0.95)",fontSize:"0.82rem",fontWeight:700,textAlign:"center"},children:"No barcode found - capture the label and we will read the printed AWB"}),e.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"},children:[e.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:Pn,children:"Capture label instead"}),e.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:()=>{U(0),K(0),d(""),ht("barcode"),w("tap")},children:"Back to barcode mode"})]})]}),e.jsxs("div",{style:{display:"flex",gap:12},children:[e.jsxs("button",{className:"cam-hud-chip",onClick:()=>mt(t=>t==="fast"?"ocr":"fast"),style:{border:"none",cursor:"pointer",gap:5},children:[k==="fast"?e.jsx(pn,{size:13}):e.jsx(vt,{size:13}),k==="fast"?"FAST":"OCR"]}),e.jsx("button",{className:"cam-hud-chip",onClick:()=>On(!Te),style:{border:"none",cursor:"pointer"},children:Te?e.jsx(os,{size:14}):e.jsx(cs,{size:14})})]})]})]})}),e.jsx("div",{className:ae(i.CAPTURING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!ze&&e.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[e.jsx(ls,{size:44,color:"#34D399"}),e.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:R||"OCR fallback"}),e.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:R?"Barcode locked - Preparing camera...":"Preparing label capture for printed AWB OCR..."})]}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{ref:Je,className:`scan-guide ${Fe?"detected":""}`,style:{width:rt.w,height:rt.h,maxHeight:"75vh",borderRadius:12},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[e.jsx(gn,{size:12})," ",R||"OCR AWB capture"]}),N.length>0&&e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(hn,{size:12})," ",N.length," queued"]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:Fe?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center",transition:"color 0.3s"},children:Hn}),y.metrics&&e.jsxs("div",{style:{color:"rgba(255,255,255,0.66)",fontSize:"0.72rem",textAlign:"center"},children:["Blur ",y.metrics.blurScore," | Glare ",y.metrics.glareRatio,"% | Skew ",y.metrics.perspectiveSkew,"%"]}),e.jsx("button",{className:"capture-btn","data-testid":"capture-photo-btn",onClick:qn,disabled:!Ut,style:{opacity:Ut?1:.4},children:e.jsx("div",{className:"capture-btn-inner"})}),g&&e.jsx("button",{type:"button","data-testid":"mock-capture-btn",onClick:Un,style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 12px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:"Mock capture"}),e.jsx("button",{style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},onClick:()=>{ne(""),d(""),U(0),K(0),pe.current=!1,w("tap"),l(i.SCANNING)},children:"â† Rescan barcode"})]})]})}),e.jsx("div",{className:ae(i.PREVIEW),children:e.jsxs("div",{style:{background:r.bg,display:"flex",flexDirection:"column",height:"100%"},children:[e.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${r.border}`},children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.72rem",color:r.muted,fontWeight:600},children:"CAPTURED"}),e.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:R||"Printed AWB OCR"}),P.kb>0&&e.jsxs("div",{style:{fontSize:"0.68rem",color:r.mutedLight},children:[P.kb,"KB • ",P.width,"×",P.height]})]})}),e.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:Y&&e.jsx("img",{src:Y,alt:"Captured label",className:"preview-img"})}),e.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{J(null),l(i.CAPTURING)},children:[e.jsx(xn,{size:16})," Retake"]}),e.jsxs("button",{"data-testid":"use-photo-btn",className:"btn btn-primary",style:{flex:2},onClick:Gn,children:[e.jsx(ds,{size:16})," Use Photo"]})]})]})}),e.jsx("div",{className:ae(i.PROCESSING),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16},children:[e.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[e.jsx(vt,{size:22,color:r.primary,style:{animation:"spin 2s linear infinite"}}),e.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:r.primary},children:"Intelligence Engine"})]}),e.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:r.muted},children:R}),e.jsx("div",{style:{fontSize:"0.72rem",color:r.mutedLight,marginTop:6},children:Y?"Reading AWB label with local OCR...":"Saving barcode scan..."})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(t=>e.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:t}),e.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),e.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},t)),e.jsx("div",{style:{textAlign:"center",marginTop:8},children:e.jsx("button",{className:"btn btn-outline",style:{fontSize:"0.75rem",padding:"8px 20px"},onClick:()=>{d("Cancelled by user."),l(i.ERROR)},children:"Cancel"})})]})}),e.jsx("div",{className:ae(i.REVIEWING),children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%"},children:[e.jsxs("div",{style:{padding:"14px 20px",borderBottom:`1px solid ${r.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.65rem",color:r.muted,fontWeight:600},children:"REVIEW EXTRACTION"}),e.jsx("div",{className:"mono",style:{fontSize:"0.95rem",fontWeight:700},children:(o==null?void 0:o.awb)||R})]}),(I==null?void 0:I.learnedFieldCount)>0&&e.jsxs("div",{className:"source-badge source-learned",children:["AI ",I.learnedFieldCount," auto-corrected"]})]}),e.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsxs("div",{className:`field-card ${(((Jt=fe.clientCode)==null?void 0:Jt.confidence)||0)<.55?"warning":""}`,children:[e.jsx("div",{className:jt(((Zt=fe.clientCode)==null?void 0:Zt.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((en=fe.clientCode)==null?void 0:en.source)&&(()=>{const t=Rn(fe.clientCode.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:f.clientCode||"",onChange:t=>T(n=>({...n,clientCode:t.target.value.toUpperCase()})),placeholder:"Client code"}),((tn=I==null?void 0:I.clientMatches)==null?void 0:tn.length)>0&&I.clientNeedsConfirmation&&e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:I.clientMatches.slice(0,3).map(t=>e.jsxs("button",{onClick:()=>T(n=>({...n,clientCode:t.code})),style:{fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:`1px solid ${r.border}`,background:f.clientCode===t.code?r.primaryLight:r.surface,color:r.text,cursor:"pointer",fontFamily:"inherit",fontWeight:500},children:[t.code," (",Math.round(t.score*100),"%)"]},t.code))})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:jt(((nn=fe.consignee)==null?void 0:nn.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Consignee"}),e.jsx("input",{className:"field-input",value:f.consignee||"",onChange:t=>T(n=>({...n,consignee:t.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:jt(((sn=fe.destination)==null?void 0:sn.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((rn=fe.destination)==null?void 0:rn.source)&&(()=>{const t=Rn(fe.destination.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:f.destination||"",onChange:t=>T(n=>({...n,destination:t.target.value.toUpperCase()})),placeholder:"City"}),(I==null?void 0:I.pincodeCity)&&I.pincodeCity!==f.destination&&e.jsxs("button",{onClick:()=>T(t=>({...t,destination:I.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:r.successLight,color:r.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["ðŸ“ Pincode suggests: ",I.pincodeCity]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Pincode"}),e.jsx("input",{className:"field-input",value:f.pincode||"",onChange:t=>T(n=>({...n,pincode:t.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),e.jsx("div",{className:`field-card ${(an=I==null?void 0:I.weightAnomaly)!=null&&an.anomaly?"warning":""}`,children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Weight (kg)"}),e.jsx("input",{className:"field-input",value:f.weight||"",onChange:t=>T(n=>({...n,weight:t.target.value})),placeholder:"0.0",inputMode:"decimal"}),((on=I==null?void 0:I.weightAnomaly)==null?void 0:on.anomaly)&&e.jsxs("div",{style:{fontSize:"0.6rem",color:r.warning,marginTop:2,fontWeight:500},children:["Warning: ",I.weightAnomaly.warning]})]})})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Amount (â‚¹)"}),e.jsx("input",{className:"field-input",value:f.amount||"",onChange:t=>T(n=>({...n,amount:t.target.value})),placeholder:"0",inputMode:"decimal"})]})}),e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Order No"}),e.jsx("input",{className:"field-input",value:f.orderNo||"",onChange:t=>T(n=>({...n,orderNo:t.target.value})),placeholder:"Optional"})]})})]})]}),e.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${r.border}`,display:"flex",gap:10},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:Ye,children:[e.jsx(us,{size:16})," Skip"]}),e.jsxs("button",{"data-testid":"approve-save-btn",className:"btn btn-success btn-lg",style:{flex:2},onClick:Vn,disabled:C===i.APPROVING,children:[C===i.APPROVING?e.jsx(Ct,{size:16,style:{animation:"spin 1s linear infinite"}}):e.jsx(fn,{size:16}),C===i.APPROVING?"Saving...":"Approve & Save"]})]})]})}),e.jsx("div",{className:ae(i.APPROVING)}),e.jsx("div",{className:ae(i.SUCCESS),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[e.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:r.success,strokeWidth:"3",className:"success-check-circle"}),e.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:r.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:r.success,marginBottom:4},children:"Saved Successfully"}),e.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700},children:F==null?void 0:F.awb}),(F==null?void 0:F.clientCode)&&e.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:r.primaryLight,color:r.primary,fontSize:"0.78rem",fontWeight:600},children:F.clientName||F.clientCode})]}),e.jsx("div",{style:{fontSize:"0.72rem",color:r.muted},children:F!=null&&F.offlineQueued?`${N.length} queued for sync - Auto-continuing in ${qt}s`:`#${M.scanNumber} scanned - Auto-continuing in ${qt}s`}),e.jsxs("button",{"data-testid":"scan-next-btn",className:"btn btn-primary btn-lg btn-full",onClick:()=>Ye(k==="fast"?i.SCANNING:i.IDLE),style:{maxWidth:320},children:[e.jsx(St,{size:18})," ",k==="fast"?"Keep Scanning":"Scan Next Parcel"]})]})}),e.jsx("div",{className:ae(i.ERROR),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:r.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(ln,{size:32,color:r.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:r.error},children:"Scan Error"}),e.jsx("div",{style:{fontSize:"0.82rem",color:r.muted,marginTop:4},children:j})]}),e.jsxs("button",{className:"btn btn-primary",onClick:Ye,children:[e.jsx(xn,{size:16})," Try Again"]})]})}),b==="disconnected"&&C!==i.IDLE&&e.jsxs("div",{className:"offline-banner",children:[e.jsx(dn,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline â€” Reconnecting... ",N.length?`(${N.length} queued)`:""]})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{_s as default};
