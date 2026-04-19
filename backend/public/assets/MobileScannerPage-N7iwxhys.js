import{j as e}from"./page-landing-CREvANXP.js";import{r as s}from"./vendor-helmet-Dwc3L0SQ.js";import{l as Vn}from"./index-KlqWusMf.js";import{a as ve}from"./page-import-CFGNhKM8.js";import{c as Hn,n as Qn}from"./barcodeEngine-CcLnfObO.js";import{c as Yn,u as Xn}from"./vendor-react-DrB23wtn.js";import{b as rn,R as bt,b1 as an,Y as Kn,aW as on,ax as Jn,aX as yt,Z as cn,aH as wt,J as Zn,b2 as es,ac as ts,d as ln,a7 as ns,H as dn,b3 as un,aQ as pn,b4 as ss,b5 as rs,a4 as is,a1 as mn,p as as,X as os}from"./vendor-icons-DyYViWBt.js";import"./page-reconcile-BQT9N3SU.js";import"./page-rate-calc-CC-LHkCs.js";function kn(c,p){var S,m;try{if(!c||!p)return null;const j=Number(c.videoWidth||0),W=Number(c.videoHeight||0);if(!j||!W)return null;const D=(S=c.getBoundingClientRect)==null?void 0:S.call(c),g=(m=p.getBoundingClientRect)==null?void 0:m.call(p);if(!D||!g)return null;const f=Number(D.width||0),G=Number(D.height||0);if(!f||!G)return null;const b=Math.max(f/j,G/W),z=j*b,k=W*b,u=(f-z)/2,C=(G-k)/2,ke=g.left-D.left,E=g.top-D.top,ne=g.right-D.left,Q=g.bottom-D.top,K=(ke-u)/b,ge=(E-C)/b,se=(ne-u)/b,o=(Q-C)/b,J=(xe,be,v)=>Math.max(be,Math.min(v,xe)),h=J(Math.min(K,se),0,j),T=J(Math.min(ge,o),0,W),A=J(Math.max(K,se),0,j),M=J(Math.max(ge,o),0,W),de=Math.max(0,A-h),q=Math.max(0,M-T);return!de||!q?null:{x:h,y:T,w:de,h:q}}catch{return null}}function hn(c=[]){if(!c.length)return"";const p=[];return c.includes("blur")&&p.push("hold steady"),c.includes("glare")&&p.push("reduce glare"),c.includes("angle")&&p.push("straighten angle"),c.includes("dark")&&p.push("add light"),c.includes("low_edge")&&p.push("fill frame"),p.length?`Improve capture: ${p.join(", ")}.`:""}function cs(c,p){if(!c||!p||!c.videoWidth||!c.videoHeight)return null;const S=kn(c,p);if(!S)return null;const m=Math.max(0,Math.floor(S.x)),j=Math.max(0,Math.floor(S.y)),W=Math.max(24,Math.floor(S.w)),D=Math.max(24,Math.floor(S.h)),g=128,f=96,G=document.createElement("canvas");G.width=g,G.height=f;const b=G.getContext("2d",{willReadFrequently:!0});if(!b)return null;b.drawImage(c,m,j,Math.min(W,c.videoWidth-m),Math.min(D,c.videoHeight-j),0,0,g,f);const z=b.getImageData(0,0,g,f).data,k=g*f,u=new Float32Array(k);let C=0,ke=0,E=0;for(let P=0,Y=0;P<z.length;P+=4,Y+=1){const y=.2126*z[P]+.7152*z[P+1]+.0722*z[P+2];u[Y]=y,C+=y,y>=245&&(ke+=1),y<=24&&(E+=1)}let ne=0,Q=0,K=0,ge=0,se=0,o=0;const J=Math.max(4,Math.floor(f*.15)),h=Math.max(4,Math.floor(g*.15)),T=g;for(let P=1;P<f-1;P+=1)for(let Y=1;Y<g-1;Y+=1){const y=P*T+Y,Te=u[y],O=u[y-1],Ee=u[y+1],Re=u[y-T],ye=u[y+T],it=Math.abs(Ee-O),at=Math.abs(ye-Re),we=it+at,Me=Math.abs(4*Te-O-Ee-Re-ye);ne+=Me,we>58&&(Q+=1),P<=J&&(K+=we),P>=f-J&&(ge+=we),Y<=h&&(se+=we),Y>=g-h&&(o+=we)}const A=Math.max(1,(g-2)*(f-2)),M=C/k,de=ne/A,q=Q/A,xe=ke/k,be=E/k,v=Math.abs(K-ge)/Math.max(1,K+ge),qe=Math.abs(se-o)/Math.max(1,se+o),je=Math.max(v,qe),Z=[];return de<22&&Z.push("blur"),xe>.18&&Z.push("glare"),(be>.55||M<40)&&Z.push("dark"),q<.08&&Z.push("low_edge"),je>.62&&Z.push("angle"),{ok:Z.length===0,issues:Z,metrics:{brightness:Number(M.toFixed(1)),blurScore:Number(de.toFixed(1)),glareRatio:Number((xe*100).toFixed(1)),edgeRatio:Number((q*100).toFixed(1)),perspectiveSkew:Number((je*100).toFixed(1))}}}function rt(c,p){const S=Number(c);return Number.isFinite(S)&&S>0?S:p}function ls({samples:c=[],awb:p,now:S=Date.now(),stabilityWindowMs:m=1100,requiredHits:j=3}){const W=rt(m,1100),D=Math.max(1,Math.floor(rt(j,3))),g=rt(S,Date.now()),f=String(p||"").trim(),G=Array.isArray(c)?c.filter(k=>(k==null?void 0:k.awb)&&g-((k==null?void 0:k.at)||0)<=W):[];if(!f)return{samples:G,hits:0,isStable:!1};const b=[...G,{awb:f,at:g}],z=b.reduce((k,u)=>u.awb===f?k+1:k,0);return{samples:b,hits:z,isStable:z>=D}}function ds({currentAttempts:c=0,maxReframeAttempts:p=2}){const S=Math.max(0,Math.floor(rt(p,2))),m=Math.max(0,Math.floor(Number(c)||0))+1;return m<=S?{action:"reframe",attempts:m}:{action:"switch_to_document",attempts:S}}const us=window.location.origin,fn={w:"90vw",h:"18vw"},nt={w:"92vw",h:"130vw"},gn=3500,xn=900,ps=1e4,ms="mobile_scanner_offline_queue",bn="mobile_scanner_workflow_mode",yn="mobile_scanner_device_profile",hs=80,fs=500,gs=1,wn=100,st=2,Ct=2,xs=500,Cn=960,Ne=.68,bs=900,H={phone:"phone-camera",rugged:"rugged-scanner"},i={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"},ys=c=>{var p;try{(p=navigator==null?void 0:navigator.vibrate)==null||p.call(navigator,c)}catch{}},Sn={tap:[20],lock:[400,50,200,50,100],success:[18,28,72],warning:[70,50,70],retry:[28,40,28],error:[110,55,110],duplicate:[90,50,90,50,90]},w=(c="tap")=>{ys(Sn[c]||Sn.tap)},ze=(c,p,S="sine")=>{try{const m=new(window.AudioContext||window.webkitAudioContext),j=m.createOscillator(),W=m.createGain();j.type=S,j.frequency.setValueAtTime(c,m.currentTime),W.gain.setValueAtTime(.12,m.currentTime),W.gain.exponentialRampToValueAtTime(.01,m.currentTime+p),j.connect(W),W.connect(m.destination),j.start(),j.stop(m.currentTime+p)}catch{}},le=()=>{ze(880,.12),setTimeout(()=>ze(1100,.1),130)},ws=()=>{ze(2700,.08,"square"),setTimeout(()=>ze(3100,.05,"square"),60)},Cs=()=>ze(600,.08),te=()=>ze(200,.25,"sawtooth"),St=c=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const p=new SpeechSynthesisUtterance(c);p.rate=1.2,p.pitch=1,p.lang="en-IN",window.speechSynthesis.speak(p)}catch{}},vn=()=>{var c;try{if(typeof window>"u")return!1;if(window.isSecureContext)return!0;const p=((c=window.location)==null?void 0:c.hostname)||"";return p==="localhost"||p==="127.0.0.1"}catch{return!1}},r={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",mutedLight:"#9CA3AF",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},Ss=`
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
`,vs=c=>c>=.85?"high":c>=.55?"med":"low",vt=c=>`conf-dot conf-${vs(c)}`,Nn=c=>c==="learned"?{className:"source-badge source-learned",icon:"AI",text:"Learned"}:c==="fuzzy_match"?{className:"source-badge source-ai",icon:"ðŸ”",text:"Matched"}:c==="fuzzy_history"||c==="consignee_pattern"?{className:"source-badge source-history",icon:"ðŸ“Š",text:"History"}:c==="delhivery_pincode"||c==="india_post"||c==="pincode_lookup"||c==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"ðŸ“",text:"Pincode"}:null,Ns=c=>{const p=Math.floor(c/6e4);return p<60?`${p}m`:`${Math.floor(p/60)}h ${p%60}m`};function Ws({standalone:c=!1}){var Ut,et,Gt,qt,Vt,Ht,Qt,Yt,Xt,Kt,Jt,Zt,en,tn,nn;const{pin:p}=Yn(),S=Xn(),m=!!c,j=`${ms}:${m?"direct":p||"unknown"}`,W=s.useMemo(()=>`mobile_scanner_daily_count:${new Date().toISOString().slice(0,10)}`,[]),D=s.useMemo(()=>{try{return typeof window>"u"?"":new URLSearchParams(window.location.search).get("mockBarcodeRaw")||""}catch{return""}},[]),g=s.useMemo(()=>{try{if(typeof window>"u")return!1;const t=new URLSearchParams(window.location.search);return t.get("mock")==="1"||t.get("e2e")==="1"}catch{return!1}},[]),[f,G]=s.useState(null),[b,z]=s.useState("connecting"),[k,u]=s.useState(""),[C,ke]=s.useState(i.IDLE),[E,ne]=s.useState(""),[Q,K]=s.useState(null),[ge,se]=s.useState({}),[o,J]=s.useState(null),[h,T]=s.useState({}),[A,M]=s.useState(null),[de,q]=s.useState(null),[xe,be]=s.useState(""),[v,qe]=s.useState([]),[je,Z]=s.useState(!1),[P,Y]=s.useState(0),[y,Te]=s.useState({ok:!1,issues:[],metrics:null}),[O,Ee]=s.useState({kb:0,width:0,height:0,quality:Ne}),[Re,ye]=s.useState(!1),[it,at]=s.useState("0m"),[we,Me]=s.useState("Connected"),[Be,Nt]=s.useState(""),[ot,jn]=s.useState(!1),[kt,ct]=s.useState("idle"),[re,En]=s.useState(null),[Rn,Fn]=s.useState(0),[lt,In]=s.useState(0),[jt,dt]=s.useState(null),[Ce,ut]=s.useState("barcode"),[R,pt]=s.useState(()=>{if(typeof window>"u")return"fast";try{const t=localStorage.getItem(bn);if(t==="fast"||t==="ocr")return t}catch{}return g?"ocr":"fast"}),[_,Et]=s.useState(()=>{if(typeof window>"u")return H.phone;try{const t=localStorage.getItem(yn);if(t===H.phone||t===H.rugged)return t}catch{}return H.phone}),mt=s.useRef(0),[B,ht]=s.useState({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now(),scannedItems:[]}),[We,An]=s.useState(!1),[Oe,zn]=s.useState(()=>{try{const t=localStorage.getItem("seahawk_scanner_session_date");if(t&&/^\d{4}-\d{2}-\d{2}$/.test(t))return t}catch{}return new Date().toISOString().slice(0,10)}),V=s.useRef(null),Ve=s.useRef(null),ue=s.useRef(null),pe=s.useRef(null),me=s.useRef(!1),He=s.useRef(null),Tn=s.useRef(!1),oe=s.useRef(i.IDLE),Qe=s.useRef(null),Pe=s.useRef(0),Se=s.useRef(null),Rt=s.useRef(new Set),Le=s.useRef([]),Ye=s.useRef({awb:"",hits:0,lastSeenAt:0}),Ft=s.useRef(0),De=s.useRef(!1),It=s.useRef(0),Xe=s.useRef(null),ft=s.useRef({message:"",at:0}),ie=s.useRef({lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]}),he=s.useRef(null),l=s.useCallback(t=>{ke(t)},[]),U=s.useCallback(t=>{mt.current=t,Fn(t)},[]),X=s.useCallback(t=>{Ft.current=t,In(t)},[]),gt=s.useCallback((t,n="warning")=>{if(!t)return;const a=Date.now();ft.current.message===t&&a-ft.current.at<bs||(ft.current={message:t,at:a},u(t),n&&w(n))},[]),At=s.useCallback(t=>{U(0),X(0),ut("document"),u(t||'No barcode lock yet. Capture label instead or tap "Back to barcode mode" and hold steady.'),w("warning")},[U,X]),Ke=s.useCallback(()=>{const t=ds({currentAttempts:Ft.current,maxReframeAttempts:st});if(t.action==="reframe"){X(t.attempts),U(0),u(`No lock yet. Reframe ${t.attempts}/${st}: move closer, reduce glare, keep barcode horizontal.`),w("retry");return}At("No stable barcode lock after reframe retries. Capture label for OCR fallback.")},[At,U,X]),Mn=s.useCallback(()=>{ne(""),u(""),l(i.CAPTURING)},[l]),zt=s.useCallback(t=>{const n=Date.now(),a=ls({samples:Le.current,awb:t,now:n,stabilityWindowMs:fs,requiredHits:gs});return Le.current=a.samples,Ye.current={awb:t,hits:a.hits,lastSeenAt:n},a.isStable},[]),ce=s.useCallback(async()=>{var a;if(!vn())throw new Error("Camera requires HTTPS (or localhost). Open this page over https:// on your phone.");if(!((a=navigator==null?void 0:navigator.mediaDevices)!=null&&a.getUserMedia))throw new Error("Camera not supported on this browser/device.");if(!V.current)throw new Error("Camera element not ready.");const t=V.current.srcObject;if(t&&typeof t.getTracks=="function"&&t.getTracks().some(I=>I.readyState==="live")){await V.current.play();return}let n=null;try{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}V.current.srcObject=n,await V.current.play()},[]);s.useEffect(()=>{const t=setInterval(()=>at(Ns(Date.now()-B.startedAt)),3e4);return()=>clearInterval(t)},[B.startedAt]);const $e=s.useCallback(t=>{qe(t);try{t.length?localStorage.setItem(j,JSON.stringify(t)):localStorage.removeItem(j)}catch{}},[j]),Fe=s.useCallback(t=>{const n={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:t};return $e([...v,n]),n},[v,$e]),Tt=s.useCallback(async t=>{if(String((t==null?void 0:t.scanMode)||"").toLowerCase()==="fast_barcode_only"){await ve.post("/shipments/scan",{awb:t.awb,courier:"AUTO",captureOnly:!0});return}await ve.post("/shipments/scan-mobile",{awb:t.awb,imageBase64:t.imageBase64,focusImageBase64:t.focusImageBase64||t.imageBase64,sessionContext:t.sessionContext||{}})},[]),_e=s.useCallback(async()=>{var t;if(v.length){if(m){if(!navigator.onLine)return;const n=[];for(const a of v)if((t=a==null?void 0:a.payload)!=null&&t.awb)try{await Tt(a.payload)}catch{n.push(a)}$e(n),n.length?u(`Uploaded partially. ${n.length} scan(s) still queued.`):u("");return}!f||!f.connected||(v.forEach(n=>{var a;(a=n==null?void 0:n.payload)!=null&&a.awb&&f.emit("scanner:scan",n.payload)}),$e([]))}},[m,f,v,$e,Tt]),L=s.useCallback(t=>{ht(n=>{const a={...n,scannedItems:[{...t,time:Date.now()},...n.scannedItems]};try{localStorage.setItem(W,String(a.scanNumber))}catch{}return a})},[W]),Bn=s.useCallback(()=>{if(b!=="paired"){u(m?"Scanner is offline. Reconnect internet and retry.":"Phone is not connected to the desktop session.");return}if(u(""),g){l(i.SCANNING);return}ce().then(()=>l(i.SCANNING)).catch(t=>u((t==null?void 0:t.message)||"Camera access failed."))},[b,ce,l,g,m]),Wn=s.useCallback(t=>{t==null||t.preventDefault();const n=Be.trim().toUpperCase();if(!n||n.length<6){u("Enter a valid AWB number (min 6 chars)");return}if(b!=="paired"){u(m?"Scanner is offline. Reconnect internet and retry.":"Not connected to desktop session.");return}if(u(""),Nt(""),ne(n),g){ye(!0),l(i.CAPTURING);return}ce().then(()=>l(i.CAPTURING)).catch(a=>u((a==null?void 0:a.message)||"Camera access failed."))},[Be,b,ce,l,g,m]),On=s.useCallback(()=>{if(window.confirm(m?"Exit this scanner session on the phone?":"End this mobile scanner session on the phone?")){if(m){S("/app/scan");return}f!=null&&f.connected?f.emit("scanner:end-session",{reason:"Mobile ended the session"}):S("/")}},[f,S,m]),Pn=s.useCallback(()=>{if(v.length>0){_e();return}window.alert(m?"No queued scans to upload.":"Everything is already synced.")},[v.length,_e,m]);s.useEffect(()=>{oe.current=C},[C]),s.useEffect(()=>{if(g){z("paired"),Me("Mock Mode"),u(""),l(i.IDLE);return}if(m){G(null),z("paired"),Me("Direct Mode"),u(""),l(i.IDLE);return}if(!p){u("No PIN provided.");return}const t=Vn(us,{auth:{scannerPin:p},transports:["websocket","polling"],reconnection:!0,reconnectionDelay:1500,reconnectionAttempts:20});return t.on("connect",()=>z("connecting")),t.on("scanner:paired",({userEmail:n})=>{z("paired"),Me(n?n.split("@")[0]:"Connected"),u("");const a=oe.current;a===i.PROCESSING||a===i.REVIEWING||a===i.APPROVING||a===i.SUCCESS||l(i.IDLE)}),t.on("scanner:error",({message:n})=>{u(n),z("disconnected")}),t.on("scanner:session-ended",({reason:n})=>{z("disconnected"),u(n||"Session ended by desktop."),S("/")}),t.on("disconnect",()=>z("disconnected")),t.on("reconnect",()=>{const n=oe.current;if(n===i.PROCESSING||n===i.REVIEWING||n===i.APPROVING||n===i.SUCCESS){z("paired");return}z("paired"),l(i.SCANNING)}),t.on("scanner:scan-processed",n=>{const a=oe.current;if(!(a!==i.PROCESSING&&a!==i.REVIEWING)){if(n.status==="error"){if(a!==i.PROCESSING)return;q("error"),te(),w("error"),l(i.ERROR),u(n.error||"Scan failed on desktop.");return}if(J(n),T({clientCode:n.clientCode||"",consignee:n.consignee||"",destination:n.destination||"",pincode:n.pincode||"",weight:n.weight||0,amount:n.amount||0,orderNo:n.orderNo||""}),se({}),n.reviewRequired)l(i.REVIEWING);else{le(),w("success"),We&&St(`Auto approved. ${n.clientName||""}. ${n.destination||""}.`);const d={awb:n.awb,clientCode:n.clientCode,clientName:n.clientName,destination:n.destination||"",weight:n.weight||0,autoApproved:!0};M(d),L(d),l(i.SUCCESS)}}}),t.on("scanner:approval-result",({success:n,message:a,awb:d})=>{if(n){le(),w("success"),q("success");const I={awb:(o==null?void 0:o.awb)||d,clientCode:h.clientCode,clientName:(o==null?void 0:o.clientName)||h.clientCode,destination:h.destination||"",weight:parseFloat(h.weight)||0};M(I),L(I),l(i.SUCCESS)}else te(),w("error"),u(a||"Approval failed.")}),t.on("scanner:ready-for-next",()=>{}),G(t),()=>{t.disconnect()}},[p,L,o,h,l,S,g,m]),s.useEffect(()=>{try{const t=localStorage.getItem(j);if(!t)return;const n=JSON.parse(t);Array.isArray(n)&&n.length&&qe(n)}catch{}},[j]),s.useEffect(()=>{try{localStorage.setItem(bn,R)}catch{}},[R]),s.useEffect(()=>{try{localStorage.setItem(yn,_)}catch{}},[_]),s.useEffect(()=>{if(v.length){if(m){b==="paired"&&navigator.onLine&&_e();return}b==="paired"&&(f!=null&&f.connected)&&_e()}},[b,f,v.length,_e,m]);const Ie=s.useCallback(async()=>{var t;try{if(ye(!1),he.current&&he.current.stop(),pe.current){try{const n=pe.current;n!=null&&n.barcodeScanner&&await n.barcodeScanner.dispose()}catch{}pe.current=null}if(ue.current){try{await ue.current.reset()}catch{}ue.current=null}(t=V.current)!=null&&t.srcObject&&(V.current.srcObject.getTracks().forEach(n=>n.stop()),V.current.srcObject=null)}catch{}},[]),Ae=s.useCallback(async()=>{try{if(ct("idle"),he.current&&he.current.stop(),pe.current){try{await pe.current.barcodeScanner.dispose()}catch{}pe.current=null}if(ue.current){try{ue.current._type==="native"?ue.current.reset():await ue.current.reset()}catch{}ue.current=null}}catch{}},[]),Mt=s.useCallback(async()=>{if(V.current){await Ae();try{Pe.current=Date.now(),await ce(),he.current||(he.current=Hn()),await he.current.start(V.current,Ve.current,{onDetected:(t,n)=>{var I;if(me.current)return;U(0);const a=(n==null?void 0:n.format)||"unknown",d=(n==null?void 0:n.engine)||"unknown";En({value:t,format:a,engine:d,at:Date.now(),sinceStartMs:Pe.current?Date.now()-Pe.current:null,candidateCount:(n==null?void 0:n.candidateCount)||1,ambiguous:!1,alternatives:(n==null?void 0:n.alternatives)||[]}),ct(d),(I=Se.current)==null||I.call(Se,t,{candidateCount:(n==null?void 0:n.candidateCount)||1,ambiguous:!1,alternatives:(n==null?void 0:n.alternatives)||[],format:a,engine:d})},onFail:()=>{const t=mt.current+1;U(t),t>=wn&&Ke()},onEngineReady:t=>{console.log(`[MobileScanner] Barcode engine ready: ${t}`),ct(t)}})}catch(t){u("Camera access failed: "+t.message)}}},[ce,Ae,Ke,U]),Bt=s.useCallback((t,n={})=>{var x;const a=String(t||"").trim().replace(/\s+/g,"").toUpperCase(),d=Qn(t)||a;if(me.current||oe.current!==i.SCANNING)return;if(!d||d.length<8){a.replace(/[^A-Z0-9]/g,"").length>=4&&gt("Partial barcode detected. Move closer so full AWB is visible.");return}if(n!=null&&n.ambiguous){const N=mt.current+1;U(N),gt("Multiple barcodes detected. Keep only the AWB barcode inside the strip.","retry"),N>=wn&&Ke();return}if(!g&&!zt(d))return;if(me.current=!0,Rt.current.has(d)){w("duplicate"),te(),be(d),setTimeout(()=>{be(""),me.current=!1,Ye.current={awb:"",hits:0,lastSeenAt:0},Le.current=[]},2500);return}clearTimeout(Qe.current),w("lock"),ws(),ne(d);const I=Pe.current?Date.now()-Pe.current:null;if(dt(I),ie.current={lockTimeMs:I,candidateCount:Number((n==null?void 0:n.candidateCount)||1),ambiguous:!!(n!=null&&n.ambiguous),alternatives:Array.isArray(n==null?void 0:n.alternatives)?n.alternatives.slice(0,3):[]},X(0),U(0),u(""),ht(N=>{const $={...N,scanNumber:N.scanNumber+1};return $.scannedAwbs=new Set(N.scannedAwbs),$.scannedAwbs.add(d),Rt.current=$.scannedAwbs,$}),R==="fast"){(x=Xe.current)==null||x.call(Xe,d);return}Qe.current=setTimeout(()=>{oe.current===i.SCANNING&&l(i.CAPTURING)},hs)},[l,zt,R,g,U,X,gt,Ke]);s.useEffect(()=>{Se.current=Bt},[Bt]),s.useEffect(()=>{if(C===i.SCANNING&&(me.current=!1,Ye.current={awb:"",hits:0,lastSeenAt:0},Le.current=[],ie.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},dt(null),X(0),U(0),ut("barcode"),Mt(),g&&D)){const t=setTimeout(()=>{var n;oe.current===i.SCANNING&&((n=Se.current)==null||n.call(Se,D))},50);return()=>clearTimeout(t)}return()=>{C===i.SCANNING&&Ae()}},[C,Mt,Ae,U,X,g,D]);const Wt=s.useCallback(async()=>{if(g){ye(!0);return}await Ae();try{await ce(),ye(!0)}catch(t){u("Camera access failed: "+t.message)}},[ce,Ae,g]);s.useEffect(()=>{C===i.CAPTURING&&Wt()},[C,Wt]);const Je=s.useCallback(()=>{const t=V.current,n=Ve.current;return cs(t,n)},[]);s.useEffect(()=>{if(C!==i.CAPTURING){Z(!1),Y(0),Te({ok:!1,issues:[],metrics:null}),Tn.current=!1,De.current=!1;return}const t=setInterval(()=>{const n=Je();n&&(Te(n),Z(n.ok),Y(a=>{const d=n.ok?Math.min(a+1,8):0;return d>=Ct&&!De.current&&(w("tap"),De.current=!0),n.ok||(De.current=!1),d}))},280);return()=>clearInterval(t)},[C,Je]);const Ot=s.useCallback((t={})=>{const n=V.current,a=Ve.current;if(!n||!a||!n.videoWidth)return null;const d=kn(n,a);if(!d)return null;const I=d.x,x=d.y,N=d.w,$=d.h;if(!N||!$)return null;const tt=Math.max(640,Number(t.maxWidth||Cn)),Ge=Math.min(.85,Math.max(.55,Number(t.quality||Ne))),ee=document.createElement("canvas");ee.width=Math.min(tt,Math.round(N)),ee.height=Math.round(ee.width/N*$),ee.getContext("2d").drawImage(n,I,x,N,$,0,0,ee.width,ee.height);const xt=ee.toDataURL("image/jpeg",Ge).split(",")[1]||"";if(!xt)return null;const qn=Math.floor(xt.length*3/4);return{base64:xt,width:ee.width,height:ee.height,approxBytes:qn,quality:Ge}},[]),Ln=s.useCallback(()=>{const t=Date.now();if(t-It.current<xs)return;It.current=t;const n=Je()||y;if(!(n!=null&&n.ok)||P<Ct){u(hn(n==null?void 0:n.issues)||"Capture quality is low. Hold steady and align the AWB in the frame."),w("warning"),te();return}q("white"),Cs(),w("tap");const a=Ot({maxWidth:Cn,quality:Ne});if(!(a!=null&&a.base64)){u("Could not capture image. Try again."),me.current=!1;return}Ee({kb:Math.round((a.approxBytes||0)/1024),width:a.width||0,height:a.height||0,quality:a.quality||Ne}),K(`data:image/jpeg;base64,${a.base64}`),Ie(),l(i.PREVIEW)},[Ot,Ie,l,Je,y,P]),Dn=s.useCallback(()=>{if(!g)return;const t="data:image/jpeg;base64,ZmFrZS1tb2NrLWltYWdl";Ee({kb:0,width:0,height:0,quality:Ne}),K(t),Ie(),l(i.PREVIEW)},[l,g,Ie]),Ze=s.useCallback(()=>{var t,n,a;return{scanNumber:B.scanNumber,recentClient:B.dominantClient,dominantClient:B.dominantClient,dominantClientCount:B.dominantClientCount,sessionDurationMin:Math.round((Date.now()-B.startedAt)/6e4),sessionDate:Oe,scanWorkflowMode:R,scanMode:Ce,deviceProfile:_,hardwareClass:_===H.rugged?"rugged":"phone",captureQuality:{ok:!!y.ok,issues:Array.isArray(y.issues)?y.issues.slice(0,8):[],metrics:y.metrics||null},captureMeta:{kb:O.kb||0,width:O.width||0,height:O.height||0,quality:O.quality||Ne},lockTimeMs:Number.isFinite(Number((t=ie.current)==null?void 0:t.lockTimeMs))?Number(ie.current.lockTimeMs):null,lockCandidateCount:Number.isFinite(Number((n=ie.current)==null?void 0:n.candidateCount))?Number(ie.current.candidateCount):1,lockAlternatives:Array.isArray((a=ie.current)==null?void 0:a.alternatives)?ie.current.alternatives.slice(0,3):[]}},[B,Oe,R,Ce,_,y,O]),Pt=s.useCallback(async t=>{var d,I;const n=String(t||"").trim().toUpperCase();if(!n)return;if(l(i.PROCESSING),g){setTimeout(()=>{const x={awb:n,clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25};M(x),L(x),l(i.SUCCESS)},120);return}const a={awb:n,imageBase64:null,focusImageBase64:null,scanMode:"fast_barcode_only",sessionContext:Ze()};if(m){if(!navigator.onLine){Fe(a),le(),w("success");const x={awb:n,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};M({...x,offlineQueued:!0}),L(x),l(i.SUCCESS);return}try{const x=await ve.post("/shipments/scan",{awb:n,courier:"AUTO",captureOnly:!0}),N=((d=x==null?void 0:x.data)==null?void 0:d.shipment)||{},$={awb:N.awb||n,clientCode:N.clientCode||"MISC",clientName:((I=N.client)==null?void 0:I.company)||N.clientCode||"Scanned",destination:N.destination||"",weight:N.weight||0};M($),L($),le(),w("success"),l(i.SUCCESS)}catch(x){u((x==null?void 0:x.message)||"Barcode processing failed. Please try again."),te(),w("error"),l(i.ERROR)}return}if(!f||!f.connected||b!=="paired"){Fe(a),le(),w("success");const x={awb:n,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};M({...x,offlineQueued:!0}),L(x),l(i.SUCCESS);return}f.emit("scanner:scan",a),setTimeout(()=>{oe.current===i.PROCESSING&&(u("Barcode processing timed out. Please try scanning again."),te(),w("error"),l(i.ERROR))},ps)},[f,b,l,g,Fe,L,Ze,m]);s.useEffect(()=>{Xe.current=Pt},[Pt]);const $n=s.useCallback(async()=>{if(!Q)return;if(l(i.PROCESSING),g){setTimeout(()=>{const a={awb:E||"100454974120",clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25};M(a),L(a),l(i.SUCCESS)},250);return}const t=Q.split(",")[1]||Q,n={awb:E||"",imageBase64:t,focusImageBase64:t,scanMode:"ocr_label",sessionContext:Ze()};if(m){if(!navigator.onLine){Fe(n),le(),w("success");const a={awb:E||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};M({...a,offlineQueued:!0}),L(a),l(i.SUCCESS);return}try{const a=await ve.post("/shipments/scan-mobile",n),d=(a==null?void 0:a.data)||a;if(d.status==="error"||!d.success){q("error"),te(),w("error"),l(i.ERROR),u(d.error||d.message||"Scan failed.");return}if(J(d),T({clientCode:d.clientCode||"",consignee:d.consignee||"",destination:d.destination||"",pincode:d.pincode||"",weight:d.weight||0,amount:d.amount||0,orderNo:d.orderNo||""}),se({}),d.reviewRequired)l(i.REVIEWING);else{le(),w("success");const I={awb:d.awb,clientCode:d.clientCode,clientName:d.clientName,destination:d.destination||"",weight:d.weight||0};M(I),L(I),l(i.SUCCESS)}}catch(a){u((a==null?void 0:a.message)||"Server error. Please try again."),te(),w("error"),l(i.ERROR)}return}if(!f||!f.connected||b!=="paired"){Fe(n),le(),w("success");const a={awb:E||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};M({...a,offlineQueued:!0}),L(a),l(i.SUCCESS);return}f.emit("scanner:scan",n),setTimeout(()=>{oe.current===i.PROCESSING&&(u("OCR timed out after 40 seconds. Retake the label photo and try again."),te(),w("error"),l(i.ERROR))},4e4)},[f,E,Q,l,b,Fe,L,g,Ze,m]),_n=s.useCallback(async()=>{var I;if(!o)return;l(i.APPROVING);let t=!m;if(g){setTimeout(()=>{const x={awb:o.awb||E,clientCode:h.clientCode||"MOCKCL",clientName:o.clientName||h.clientCode||"Mock Client",destination:h.destination||"",weight:parseFloat(h.weight)||0};M(x),L(x),q("success"),t=!0,l(i.SUCCESS)},200);return}const n={clientCode:o.clientCode||"",clientName:o.clientName||"",consignee:o.consignee||"",destination:o.destination||""},a={clientCode:h.clientCode||"",clientName:h.clientCode||"",consignee:h.consignee||"",destination:h.destination||""},d={clientCode:h.clientCode,consignee:h.consignee,destination:h.destination,pincode:h.pincode,weight:parseFloat(h.weight)||0,amount:parseFloat(h.amount)||0,orderNo:h.orderNo||""};if(m)try{(o.ocrExtracted||o)&&await ve.post("/shipments/learn-corrections",{ocrFields:n,approvedFields:a}),o.shipmentId?await ve.put(`/shipments/${o.shipmentId}`,d):await ve.post("/shipments",{awb:o.awb||E,...d}),le(),w("success"),q("success");const x={awb:(o==null?void 0:o.awb)||E,clientCode:h.clientCode,clientName:(o==null?void 0:o.clientName)||h.clientCode,destination:h.destination||"",weight:parseFloat(h.weight)||0};M(x),L(x),t=!0,l(i.SUCCESS)}catch(x){l(i.REVIEWING),te(),w("error"),u((x==null?void 0:x.message)||"Approval failed.")}else{if(!f){l(i.REVIEWING),u("Not connected to desktop session.");return}(o.ocrExtracted||o)&&f.emit("scanner:learn-corrections",{pin:p,ocrFields:n,approvedFields:a,courier:(o==null?void 0:o.courier)||((I=o==null?void 0:o.ocrExtracted)==null?void 0:I.courier)||"",deviceProfile:_}),f.emit("scanner:approval-submit",{shipmentId:o.shipmentId,awb:o.awb||E,fields:d},x=>{x!=null&&x.success||(l(i.REVIEWING),te(),w("error"),u((x==null?void 0:x.message)||"Approval failed."))})}t&&h.clientCode&&h.clientCode!=="MISC"&&ht(x=>{var tt,Ge;const N={...x.clientFreq};N[h.clientCode]=(N[h.clientCode]||0)+1;const $=Object.entries(N).sort((ee,sn)=>sn[1]-ee[1]);return{...x,clientFreq:N,dominantClient:((tt=$[0])==null?void 0:tt[1])>=2?$[0][0]:null,dominantClientCount:((Ge=$[0])==null?void 0:Ge[1])||0}})},[f,o,h,E,p,l,L,g,_,m]),Ue=s.useCallback((t=i.IDLE)=>{clearTimeout(He.current),clearTimeout(Qe.current),ne(""),K(null),Ee({kb:0,width:0,height:0,quality:Ne}),J(null),T({}),se({}),M(null),dt(null),u(""),be(""),Z(!1),Y(0),Te({ok:!1,issues:[],metrics:null}),me.current=!1,Ye.current={awb:"",hits:0,lastSeenAt:0},Le.current=[],ie.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},De.current=!1,X(0),l(t)},[l,X]);s.useEffect(()=>{if(C===i.SUCCESS){const t=R==="fast"?i.SCANNING:i.IDLE,n=R==="fast"?xn:gn;return He.current=setTimeout(()=>Ue(t),n),()=>clearTimeout(He.current)}},[C,Ue,R]),s.useEffect(()=>{if(We)if(C===i.REVIEWING&&o){const t=[o.clientName||o.clientCode,o.destination,o.weight?`${o.weight} kilograms`:""].filter(Boolean);t.length&&St(t.join(". "))}else C===i.SUCCESS&&A&&St(`${A.clientName||A.clientCode||"Shipment"} Verified.`)},[We,C,o,A]),s.useEffect(()=>()=>{Ie(),clearTimeout(He.current),clearTimeout(Qe.current)},[Ie]);const ae=t=>`msp-step ${C===t?"active":""}`,Lt=Math.max(1,Math.round((R==="fast"?xn:gn)/1e3)),Un=y.ok?"AWB quality looks good - press shutter":hn(y.issues)||"Fit AWB slip fully in frame and hold steady",Dt=Re&&y.ok&&P>=Ct,fe=s.useMemo(()=>{if(!o)return{};const t=o.ocrExtracted||o;return{clientCode:{confidence:(t==null?void 0:t.clientNameConfidence)||0,source:(t==null?void 0:t.clientNameSource)||null},consignee:{confidence:(t==null?void 0:t.consigneeConfidence)||0,source:(t==null?void 0:t.consigneeSource)||null},destination:{confidence:(t==null?void 0:t.destinationConfidence)||0,source:(t==null?void 0:t.destinationSource)||null},pincode:{confidence:(t==null?void 0:t.pincodeConfidence)||0,source:null},weight:{confidence:(t==null?void 0:t.weightConfidence)||0,source:null}}},[o]),$t=B.scannedItems.reduce((t,n)=>t+(n.weight||0),0),F=((Ut=o==null?void 0:o.ocrExtracted)==null?void 0:Ut.intelligence)||(o==null?void 0:o.intelligence)||null,_t=(qt=(Gt=(et=he.current)==null?void 0:et.getDiagnostics)==null?void 0:Gt.call(et))==null?void 0:qt.wasmFailReason,Gn=[["Step",C],["Connection",b],["Engine",kt],..._t?[["WASM Error",_t]]:[],["Workflow",R],["Device",_],["Scan mode",Ce],["Fail count",String(Rn)],["Reframe retries",`${lt}/${st}`],["Camera",Re?"ready":"waiting"],["Doc detect",je?`yes (${P})`:"no"],["Capture quality",y.ok?"good":y.issues.join(", ")||"pending"],["Capture metrics",y.metrics?`blur ${y.metrics.blurScore} | glare ${y.metrics.glareRatio}% | skew ${y.metrics.perspectiveSkew}%`:"-"],["JPEG last shot",O.kb?`${O.kb}KB ${O.width}x${O.height} q=${O.quality}`:"-"],["Secure ctx",vn()?"yes":"no"],["AWB lock",E||"-"],["Lock ms",jt!=null?String(jt):"-"],["Lock candidates",String(((Vt=ie.current)==null?void 0:Vt.candidateCount)||1)],["Queued",String(v.length)],["Scans",String(B.scanNumber)],["Last format",(re==null?void 0:re.format)||"-"],["Last code",(re==null?void 0:re.value)||"-"],["Decode ms",(re==null?void 0:re.sinceStartMs)!=null?String(re.sinceStartMs):"-"],["False-lock",(Ht=o==null?void 0:o.scanTelemetry)!=null&&Ht.falseLock?"yes":"no"]];return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:Ss}),e.jsxs("div",{className:"msp-root",children:[de&&e.jsx("div",{className:`flash-overlay flash-${de}`,onAnimationEnd:()=>q(null)}),xe&&e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[e.jsx(rn,{size:48,color:"white"}),e.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),e.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:xe}),e.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),e.jsx("button",{type:"button","data-testid":"scanner-diag-toggle",onClick:()=>jn(t=>!t),style:{position:"fixed",top:12,right:12,zIndex:70,border:"1px solid rgba(255,255,255,0.18)",background:ot?"rgba(79,70,229,0.92)":"rgba(15,23,42,0.72)",color:"#fff",borderRadius:999,padding:"8px 12px",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.04em",backdropFilter:"blur(10px)",cursor:"pointer"},children:ot?"Hide Diag":"Show Diag"}),ot&&e.jsxs("div",{"data-testid":"scanner-diag-panel",style:{position:"fixed",top:56,right:12,zIndex:69,width:"min(92vw, 320px)",background:"rgba(15,23,42,0.88)",color:"#E5EEF8",border:"1px solid rgba(255,255,255,0.12)",borderRadius:18,padding:14,backdropFilter:"blur(14px)",boxShadow:"0 12px 30px rgba(0,0,0,0.25)"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10,color:"#A5B4FC"},children:"Scanner Diagnostics"}),e.jsx("div",{style:{display:"grid",gap:6},children:Gn.map(([t,n])=>e.jsxs("div",{style:{display:"flex",gap:8,justifyContent:"space-between",alignItems:"flex-start",fontSize:"0.76rem"},children:[e.jsx("div",{style:{color:"rgba(226,232,240,0.72)",minWidth:88},children:t}),e.jsx("div",{className:"mono",style:{textAlign:"right",wordBreak:"break-word",maxWidth:180},children:n})]},t))}),e.jsx("div",{style:{marginTop:10,fontSize:"0.68rem",color:"rgba(226,232,240,0.7)",lineHeight:1.4},children:"Use this to verify whether Trackon labels are being decoded as `ITF` and how quickly the first lock happens after scan start."})]}),b!=="paired"&&e.jsx("div",{className:ae(i.IDLE),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:r.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:b==="connecting"?e.jsx(bt,{size:28,color:r.primary,style:{animation:"spin 1s linear infinite"}}):e.jsx(an,{size:28,color:r.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:b==="connecting"?"Connecting...":"Disconnected"}),e.jsx("div",{style:{fontSize:"0.82rem",color:r.muted},children:k||(m?"Preparing direct scanner session":`Connecting to session ${p}`)})]}),b==="disconnected"&&e.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[e.jsx(bt,{size:16})," Reconnect"]})]})}),e.jsx("video",{ref:V,autoPlay:!0,playsInline:!0,muted:!0,onClick:()=>{ce().catch(t=>{u((t==null?void 0:t.message)||"Camera access failed.")})},style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(C===i.SCANNING||C===i.CAPTURING)&&!pe.current?"block":"none"}}),e.jsx("div",{className:ae(i.IDLE),children:e.jsxs("div",{className:"home-root",children:[e.jsxs("div",{className:"home-header",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16},children:[e.jsxs("button",{onClick:()=>S("/app/scan"),style:{background:"white",border:"1px solid #E2E8F0",padding:"6px 12px",borderRadius:20,fontSize:"0.75rem",fontWeight:600,color:"#475569",display:"flex",alignItems:"center",gap:4,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.02)"},children:[e.jsx(Kn,{size:14})," Go Back"]}),e.jsxs("div",{className:"home-logo-badge",children:[e.jsx(on,{size:11,color:b==="paired"&&navigator.onLine?"#10B981":"#EF4444"}),we]})]}),e.jsx("div",{className:"home-logo-row",children:e.jsxs("div",{className:"home-logo-text",children:[e.jsx("img",{src:"/images/logo.png",alt:"Sea Hawk Logo",style:{height:28,width:"auto",objectFit:"contain",padding:2,background:"white",borderRadius:6,border:"1px solid #E2E8F0"}}),e.jsx("span",{children:"Seahawk Scanner"})]})}),e.jsxs("div",{className:"home-stats-row",children:[e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:B.scanNumber}),e.jsx("div",{className:"home-stat-label",children:"Scanned"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:$t>0?$t.toFixed(1):"0"}),e.jsx("div",{className:"home-stat-label",children:"Total kg"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:it}),e.jsx("div",{className:"home-stat-label",children:"Session"})]})]}),e.jsxs("div",{className:"home-date-chip",children:[e.jsx(Jn,{size:18,color:"#38BDF8"}),e.jsxs("div",{children:[e.jsx("div",{className:"home-date-label",children:"Scan Date"}),e.jsxs("div",{className:"home-date-value",children:[new Date(Oe+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}),Oe===new Date().toISOString().slice(0,10)&&e.jsx("span",{style:{fontSize:"0.65rem",color:"#10B981",marginLeft:6,fontWeight:500},children:"TODAY"})]})]}),e.jsx("div",{className:"home-date-change",children:"Change ▸"}),e.jsx("input",{type:"date",value:Oe,max:new Date().toISOString().slice(0,10),onChange:t=>{const n=t.target.value;if(n&&/^\d{4}-\d{2}-\d{2}$/.test(n)){zn(n);try{localStorage.setItem("seahawk_scanner_session_date",n)}catch{}w("light")}}})]})]}),e.jsxs("div",{className:"home-scan-section",children:[e.jsxs("div",{className:"home-scan-btn-wrap",children:[e.jsx("div",{className:"home-scan-ring"}),e.jsx("div",{className:"home-scan-ring home-scan-ring2"}),e.jsxs("button",{"data-testid":"start-scan-btn",className:"home-scan-btn",onClick:Bn,children:[e.jsx(yt,{size:34,color:"white"}),e.jsx("span",{className:"home-scan-btn-label",children:"Scan"})]})]}),e.jsx("div",{className:"home-cta-text",children:B.scanNumber===0?"Tap to start your first scan":"Tap to scan next parcel"}),e.jsxs("div",{style:{display:"flex",gap:8,marginTop:14,width:"100%",maxWidth:320},children:[e.jsxs("button",{type:"button","data-testid":"workflow-fast-btn",onClick:()=>pt("fast"),style:{flex:1,borderRadius:999,border:`1px solid ${R==="fast"?r.primary:r.border}`,background:R==="fast"?r.primaryLight:r.surface,color:R==="fast"?r.primary:r.muted,fontWeight:700,fontSize:"0.72rem",padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(cn,{size:13})," Fast scan"]}),e.jsxs("button",{type:"button","data-testid":"workflow-ocr-btn",onClick:()=>pt("ocr"),style:{flex:1,borderRadius:999,border:`1px solid ${R==="ocr"?r.primary:r.border}`,background:R==="ocr"?r.primaryLight:r.surface,color:R==="ocr"?r.primary:r.muted,fontWeight:700,fontSize:"0.72rem",padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(wt,{size:13})," OCR label"]})]}),e.jsxs("div",{style:{display:"flex",gap:8,marginTop:8,width:"100%",maxWidth:320},children:[e.jsxs("button",{type:"button","data-testid":"device-profile-phone-btn",onClick:()=>Et(H.phone),style:{flex:1,borderRadius:999,border:`1px solid ${_===H.phone?r.primary:r.border}`,background:_===H.phone?r.primaryLight:r.surface,color:_===H.phone?r.primary:r.muted,fontWeight:700,fontSize:"0.7rem",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(yt,{size:13})," Phone lens"]}),e.jsxs("button",{type:"button","data-testid":"device-profile-rugged-btn",onClick:()=>Et(H.rugged),style:{flex:1,borderRadius:999,border:`1px solid ${_===H.rugged?r.primary:r.border}`,background:_===H.rugged?r.primaryLight:r.surface,color:_===H.rugged?r.primary:r.muted,fontWeight:700,fontSize:"0.7rem",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(Zn,{size:13})," Rugged"]})]}),e.jsxs("form",{onSubmit:Wn,style:{width:"100%",maxWidth:300,marginTop:20},children:[e.jsx("div",{style:{fontSize:"0.62rem",fontWeight:700,color:r.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6,textAlign:"center"},children:"Can't scan? Enter AWB manually"}),e.jsxs("div",{style:{display:"flex",gap:6},children:[e.jsx("input",{"data-testid":"manual-awb-input",value:Be,onChange:t=>Nt(t.target.value.toUpperCase()),placeholder:"e.g. 1234567890",inputMode:"text",autoCapitalize:"characters",style:{flex:1,padding:"9px 12px",border:`1.5px solid ${r.border}`,borderRadius:10,fontFamily:"JetBrains Mono, monospace",fontSize:"0.82rem",fontWeight:600,background:r.surface,color:r.text,outline:"none"},onFocus:t=>t.target.style.borderColor=r.primary,onBlur:t=>t.target.style.borderColor=r.border}),e.jsx("button",{type:"submit","data-testid":"manual-awb-submit",disabled:Be.trim().length<6,className:"btn btn-primary",style:{padding:"9px 14px",fontSize:"0.78rem",borderRadius:10,opacity:Be.trim().length>=6?1:.45},children:"Go â†’"})]})]}),e.jsxs("div",{className:"action-buttons-row",children:[e.jsxs("button",{className:"action-btn",onClick:Pn,children:[e.jsx(es,{size:14})," ",v.length>0?`Upload (${v.length})`:"Synced"]}),e.jsxs("button",{className:"action-btn danger",onClick:On,children:[e.jsx(ts,{size:14})," End Session"]})]}),v.length>0&&e.jsxs("div",{style:{marginTop:14,fontSize:"0.7rem",color:r.warning,fontWeight:600,display:"flex",alignItems:"center",gap:5},children:[e.jsx(ln,{size:12})," ",v.length," offline scan",v.length>1?"s":""," pending sync"]})]}),e.jsxs("div",{className:"home-queue-section",children:[e.jsxs("div",{className:"home-queue-head",children:[e.jsxs("div",{className:"home-queue-title-text",children:[e.jsx(ns,{size:11}),"Accepted Consignments"]}),B.scannedItems.length>0&&e.jsx("div",{className:"home-queue-badge",children:B.scannedItems.length})]}),e.jsx("div",{className:"home-queue-list",children:B.scannedItems.length===0?e.jsxs("div",{className:"queue-empty",children:[e.jsx(dn,{size:36,color:"rgba(255,255,255,0.12)"}),e.jsxs("div",{className:"queue-empty-text",children:["No consignments scanned yet.",e.jsx("br",{}),"Tap the button above to begin."]})]}):B.scannedItems.map((t,n)=>e.jsxs("div",{className:"queue-item",children:[e.jsx("div",{className:"queue-check",children:e.jsx(un,{size:13,color:"#10B981"})}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{className:"queue-awb",children:t.awb}),e.jsxs("div",{className:"queue-meta",children:[t.clientCode==="OFFLINE"?e.jsx("span",{className:"queue-offline-tag",children:"Offline"}):t.clientCode&&e.jsx("span",{className:"queue-client-tag",children:t.clientCode}),t.destination&&e.jsx("span",{children:t.destination})]})]}),t.weight>0&&e.jsxs("div",{className:"queue-weight",children:[t.weight,"kg"]})]},`${t.awb}-${n}`))})]})]})}),e.jsx("div",{className:ae(i.SCANNING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[e.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:pe.current?"block":"none"}}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{className:"scan-guide",style:Ce==="barcode"?{width:fn.w,height:fn.h,borderRadius:10,maxHeight:"20vw",transition:"all 0.4s ease",borderColor:k?"rgba(248,113,113,0.92)":void 0,boxShadow:k?"0 0 0 3px rgba(248,113,113,0.2)":void 0}:{width:nt.w,height:nt.h,borderRadius:14,maxHeight:"75vh",transition:"all 0.4s ease",borderColor:"rgba(251,191,36,0.85)",boxShadow:"0 0 0 3px rgba(251,191,36,0.2)"},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"}),Ce==="barcode"&&e.jsx("div",{className:"scan-laser",children:e.jsx("div",{className:"scan-laser-spark"})})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(on,{size:12})," ",m?"DIRECT":p]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[Ce==="document"&&e.jsxs("div",{className:"cam-hud-chip",style:{background:"rgba(251,191,36,0.22)",color:"#FDE68A",fontWeight:700,fontSize:"0.65rem",gap:4},children:[e.jsx(pn,{size:11})," LABEL MODE"]}),e.jsxs("div",{className:"cam-hud-chip",style:{gap:4},children:[e.jsx(dn,{size:12})," ",B.scanNumber,kt==="native"?e.jsx("span",{style:{color:"#34D399",fontSize:"0.6rem",fontWeight:800},children:"⚡ NATIVE"}):e.jsx("span",{style:{color:"#F59E0B",fontSize:"0.6rem",fontWeight:800},children:"ZXING"})]})]})]}),e.jsxs("div",{className:"cam-bottom",children:[Ce==="barcode"?e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:6,color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:[e.jsx("div",{children:R==="fast"?"Align barcode inside the strip - auto-save on lock":"Align barcode inside the strip - camera opens for label capture after lock"}),lt>0&&e.jsxs("div",{style:{color:"#FDE68A",fontSize:"0.74rem",fontWeight:700},children:["Reframe retry ",lt,"/",st]}),!!k&&e.jsx("div",{style:{color:"#FCA5A5",fontSize:"0.72rem",fontWeight:700},children:k})]}):e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:6},children:[e.jsx("div",{style:{color:"rgba(251,191,36,0.95)",fontSize:"0.82rem",fontWeight:700,textAlign:"center"},children:"No barcode found - capture the label and we will read the printed AWB"}),e.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"},children:[e.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:Mn,children:"Capture label instead"}),e.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:()=>{U(0),X(0),u(""),ut("barcode"),w("tap")},children:"Back to barcode mode"})]})]}),e.jsxs("div",{style:{display:"flex",gap:12},children:[e.jsxs("button",{className:"cam-hud-chip",onClick:()=>pt(t=>t==="fast"?"ocr":"fast"),style:{border:"none",cursor:"pointer",gap:5},children:[R==="fast"?e.jsx(cn,{size:13}):e.jsx(wt,{size:13}),R==="fast"?"FAST":"OCR"]}),e.jsx("button",{className:"cam-hud-chip",onClick:()=>An(!We),style:{border:"none",cursor:"pointer"},children:We?e.jsx(ss,{size:14}):e.jsx(rs,{size:14})})]})]})]})}),e.jsx("div",{className:ae(i.CAPTURING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!Re&&e.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[e.jsx(is,{size:44,color:"#34D399"}),e.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:E||"OCR fallback"}),e.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:E?"Barcode locked - Preparing camera...":"Preparing label capture for printed AWB OCR..."})]}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{ref:Ve,className:`scan-guide ${je?"detected":""}`,style:{width:nt.w,height:nt.h,maxHeight:"75vh",borderRadius:12},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[e.jsx(pn,{size:12})," ",E||"OCR AWB capture"]}),v.length>0&&e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(ln,{size:12})," ",v.length," queued"]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:je?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center",transition:"color 0.3s"},children:Un}),y.metrics&&e.jsxs("div",{style:{color:"rgba(255,255,255,0.66)",fontSize:"0.72rem",textAlign:"center"},children:["Blur ",y.metrics.blurScore," | Glare ",y.metrics.glareRatio,"% | Skew ",y.metrics.perspectiveSkew,"%"]}),e.jsx("button",{className:"capture-btn","data-testid":"capture-photo-btn",onClick:Ln,disabled:!Dt,style:{opacity:Dt?1:.4},children:e.jsx("div",{className:"capture-btn-inner"})}),g&&e.jsx("button",{type:"button","data-testid":"mock-capture-btn",onClick:Dn,style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 12px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:"Mock capture"}),e.jsx("button",{style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},onClick:()=>{ne(""),u(""),U(0),X(0),me.current=!1,w("tap"),l(i.SCANNING)},children:"â† Rescan barcode"})]})]})}),e.jsx("div",{className:ae(i.PREVIEW),children:e.jsxs("div",{style:{background:r.bg,display:"flex",flexDirection:"column",height:"100%"},children:[e.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${r.border}`},children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.72rem",color:r.muted,fontWeight:600},children:"CAPTURED"}),e.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:E||"Printed AWB OCR"}),O.kb>0&&e.jsxs("div",{style:{fontSize:"0.68rem",color:r.mutedLight},children:[O.kb,"KB • ",O.width,"×",O.height]})]})}),e.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:Q&&e.jsx("img",{src:Q,alt:"Captured label",className:"preview-img"})}),e.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{K(null),l(i.CAPTURING)},children:[e.jsx(mn,{size:16})," Retake"]}),e.jsxs("button",{"data-testid":"use-photo-btn",className:"btn btn-primary",style:{flex:2},onClick:$n,children:[e.jsx(as,{size:16})," Use Photo"]})]})]})}),e.jsx("div",{className:ae(i.PROCESSING),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16},children:[e.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[e.jsx(wt,{size:22,color:r.primary,style:{animation:"spin 2s linear infinite"}}),e.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:r.primary},children:"Intelligence Engine"})]}),e.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:r.muted},children:E}),e.jsx("div",{style:{fontSize:"0.72rem",color:r.mutedLight,marginTop:6},children:Q?"Reading AWB label with local OCR...":"Saving barcode scan..."})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(t=>e.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:t}),e.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),e.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},t)),e.jsx("div",{style:{textAlign:"center",marginTop:8},children:e.jsx("button",{className:"btn btn-outline",style:{fontSize:"0.75rem",padding:"8px 20px"},onClick:()=>{u("Cancelled by user."),l(i.ERROR)},children:"Cancel"})})]})}),e.jsx("div",{className:ae(i.REVIEWING),children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%"},children:[e.jsxs("div",{style:{padding:"14px 20px",borderBottom:`1px solid ${r.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.65rem",color:r.muted,fontWeight:600},children:"REVIEW EXTRACTION"}),e.jsx("div",{className:"mono",style:{fontSize:"0.95rem",fontWeight:700},children:(o==null?void 0:o.awb)||E})]}),(F==null?void 0:F.learnedFieldCount)>0&&e.jsxs("div",{className:"source-badge source-learned",children:["AI ",F.learnedFieldCount," auto-corrected"]})]}),e.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsxs("div",{className:`field-card ${(((Qt=fe.clientCode)==null?void 0:Qt.confidence)||0)<.55?"warning":""}`,children:[e.jsx("div",{className:vt(((Yt=fe.clientCode)==null?void 0:Yt.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((Xt=fe.clientCode)==null?void 0:Xt.source)&&(()=>{const t=Nn(fe.clientCode.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:h.clientCode||"",onChange:t=>T(n=>({...n,clientCode:t.target.value.toUpperCase()})),placeholder:"Client code"}),((Kt=F==null?void 0:F.clientMatches)==null?void 0:Kt.length)>0&&F.clientNeedsConfirmation&&e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:F.clientMatches.slice(0,3).map(t=>e.jsxs("button",{onClick:()=>T(n=>({...n,clientCode:t.code})),style:{fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:`1px solid ${r.border}`,background:h.clientCode===t.code?r.primaryLight:r.surface,color:r.text,cursor:"pointer",fontFamily:"inherit",fontWeight:500},children:[t.code," (",Math.round(t.score*100),"%)"]},t.code))})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:vt(((Jt=fe.consignee)==null?void 0:Jt.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Consignee"}),e.jsx("input",{className:"field-input",value:h.consignee||"",onChange:t=>T(n=>({...n,consignee:t.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:vt(((Zt=fe.destination)==null?void 0:Zt.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((en=fe.destination)==null?void 0:en.source)&&(()=>{const t=Nn(fe.destination.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:h.destination||"",onChange:t=>T(n=>({...n,destination:t.target.value.toUpperCase()})),placeholder:"City"}),(F==null?void 0:F.pincodeCity)&&F.pincodeCity!==h.destination&&e.jsxs("button",{onClick:()=>T(t=>({...t,destination:F.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:r.successLight,color:r.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["ðŸ“ Pincode suggests: ",F.pincodeCity]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Pincode"}),e.jsx("input",{className:"field-input",value:h.pincode||"",onChange:t=>T(n=>({...n,pincode:t.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),e.jsx("div",{className:`field-card ${(tn=F==null?void 0:F.weightAnomaly)!=null&&tn.anomaly?"warning":""}`,children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Weight (kg)"}),e.jsx("input",{className:"field-input",value:h.weight||"",onChange:t=>T(n=>({...n,weight:t.target.value})),placeholder:"0.0",inputMode:"decimal"}),((nn=F==null?void 0:F.weightAnomaly)==null?void 0:nn.anomaly)&&e.jsxs("div",{style:{fontSize:"0.6rem",color:r.warning,marginTop:2,fontWeight:500},children:["Warning: ",F.weightAnomaly.warning]})]})})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Amount (â‚¹)"}),e.jsx("input",{className:"field-input",value:h.amount||"",onChange:t=>T(n=>({...n,amount:t.target.value})),placeholder:"0",inputMode:"decimal"})]})}),e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Order No"}),e.jsx("input",{className:"field-input",value:h.orderNo||"",onChange:t=>T(n=>({...n,orderNo:t.target.value})),placeholder:"Optional"})]})})]})]}),e.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${r.border}`,display:"flex",gap:10},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:Ue,children:[e.jsx(os,{size:16})," Skip"]}),e.jsxs("button",{"data-testid":"approve-save-btn",className:"btn btn-success btn-lg",style:{flex:2},onClick:_n,disabled:C===i.APPROVING,children:[C===i.APPROVING?e.jsx(bt,{size:16,style:{animation:"spin 1s linear infinite"}}):e.jsx(un,{size:16}),C===i.APPROVING?"Saving...":"Approve & Save"]})]})]})}),e.jsx("div",{className:ae(i.APPROVING)}),e.jsx("div",{className:ae(i.SUCCESS),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[e.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:r.success,strokeWidth:"3",className:"success-check-circle"}),e.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:r.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:r.success,marginBottom:4},children:"Saved Successfully"}),e.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700},children:A==null?void 0:A.awb}),(A==null?void 0:A.clientCode)&&e.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:r.primaryLight,color:r.primary,fontSize:"0.78rem",fontWeight:600},children:A.clientName||A.clientCode})]}),e.jsx("div",{style:{fontSize:"0.72rem",color:r.muted},children:A!=null&&A.offlineQueued?`${v.length} queued for sync - Auto-continuing in ${Lt}s`:`#${B.scanNumber} scanned - Auto-continuing in ${Lt}s`}),e.jsxs("button",{"data-testid":"scan-next-btn",className:"btn btn-primary btn-lg btn-full",onClick:()=>Ue(R==="fast"?i.SCANNING:i.IDLE),style:{maxWidth:320},children:[e.jsx(yt,{size:18})," ",R==="fast"?"Keep Scanning":"Scan Next Parcel"]})]})}),e.jsx("div",{className:ae(i.ERROR),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:r.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(rn,{size:32,color:r.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:r.error},children:"Scan Error"}),e.jsx("div",{style:{fontSize:"0.82rem",color:r.muted,marginTop:4},children:k})]}),e.jsxs("button",{className:"btn btn-primary",onClick:Ue,children:[e.jsx(mn,{size:16})," Try Again"]})]})}),b==="disconnected"&&C!==i.IDLE&&e.jsxs("div",{className:"offline-banner",children:[e.jsx(an,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline â€” Reconnecting... ",v.length?`(${v.length} queued)`:""]})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{Ws as default};
