import{j as e}from"./page-landing-CREvANXP.js";import{r as s}from"./vendor-helmet-Dwc3L0SQ.js";import{l as Gn}from"./index-C7IjjJal.js";import{a as ve}from"./page-import-CFGNhKM8.js";import{c as qn,n as Vn}from"./barcodeEngine-2DnBUigh.js";import{c as Hn,u as Qn}from"./vendor-react-DrB23wtn.js";import{b as nn,R as xt,b1 as sn,Y as Xn,aW as rn,aX as bt,Z as an,aH as yt,J as Yn,b2 as Kn,ac as Jn,d as on,a7 as Zn,H as cn,b3 as ln,aQ as dn,b4 as es,b5 as ts,a4 as ns,a1 as un,p as ss,X as rs}from"./vendor-icons-DyYViWBt.js";import"./page-reconcile-BQT9N3SU.js";import"./page-rate-calc-CC-LHkCs.js";function Nn(c,p){var S,m;try{if(!c||!p)return null;const j=Number(c.videoWidth||0),B=Number(c.videoHeight||0);if(!j||!B)return null;const $=(S=c.getBoundingClientRect)==null?void 0:S.call(c),g=(m=p.getBoundingClientRect)==null?void 0:m.call(p);if(!$||!g)return null;const f=Number($.width||0),G=Number($.height||0);if(!f||!G)return null;const b=Math.max(f/j,G/B),z=j*b,k=B*b,u=(f-z)/2,w=(G-k)/2,ke=g.left-$.left,E=g.top-$.top,ne=g.right-$.left,Q=g.bottom-$.top,K=(ke-u)/b,ge=(E-w)/b,se=(ne-u)/b,o=(Q-w)/b,J=(xe,be,v)=>Math.max(be,Math.min(v,xe)),h=J(Math.min(K,se),0,j),T=J(Math.min(ge,o),0,B),A=J(Math.max(K,se),0,j),M=J(Math.max(ge,o),0,B),de=Math.max(0,A-h),q=Math.max(0,M-T);return!de||!q?null:{x:h,y:T,w:de,h:q}}catch{return null}}function pn(c=[]){if(!c.length)return"";const p=[];return c.includes("blur")&&p.push("hold steady"),c.includes("glare")&&p.push("reduce glare"),c.includes("angle")&&p.push("straighten angle"),c.includes("dark")&&p.push("add light"),c.includes("low_edge")&&p.push("fill frame"),p.length?`Improve capture: ${p.join(", ")}.`:""}function is(c,p){if(!c||!p||!c.videoWidth||!c.videoHeight)return null;const S=Nn(c,p);if(!S)return null;const m=Math.max(0,Math.floor(S.x)),j=Math.max(0,Math.floor(S.y)),B=Math.max(24,Math.floor(S.w)),$=Math.max(24,Math.floor(S.h)),g=128,f=96,G=document.createElement("canvas");G.width=g,G.height=f;const b=G.getContext("2d",{willReadFrequently:!0});if(!b)return null;b.drawImage(c,m,j,Math.min(B,c.videoWidth-m),Math.min($,c.videoHeight-j),0,0,g,f);const z=b.getImageData(0,0,g,f).data,k=g*f,u=new Float32Array(k);let w=0,ke=0,E=0;for(let P=0,X=0;P<z.length;P+=4,X+=1){const y=.2126*z[P]+.7152*z[P+1]+.0722*z[P+2];u[X]=y,w+=y,y>=245&&(ke+=1),y<=24&&(E+=1)}let ne=0,Q=0,K=0,ge=0,se=0,o=0;const J=Math.max(4,Math.floor(f*.15)),h=Math.max(4,Math.floor(g*.15)),T=g;for(let P=1;P<f-1;P+=1)for(let X=1;X<g-1;X+=1){const y=P*T+X,ze=u[y],O=u[y-1],Ee=u[y+1],Re=u[y-T],ye=u[y+T],rt=Math.abs(Ee-O),it=Math.abs(ye-Re),we=rt+it,Te=Math.abs(4*ze-O-Ee-Re-ye);ne+=Te,we>58&&(Q+=1),P<=J&&(K+=we),P>=f-J&&(ge+=we),X<=h&&(se+=we),X>=g-h&&(o+=we)}const A=Math.max(1,(g-2)*(f-2)),M=w/k,de=ne/A,q=Q/A,xe=ke/k,be=E/k,v=Math.abs(K-ge)/Math.max(1,K+ge),Ue=Math.abs(se-o)/Math.max(1,se+o),je=Math.max(v,Ue),Z=[];return de<22&&Z.push("blur"),xe>.18&&Z.push("glare"),(be>.55||M<40)&&Z.push("dark"),q<.08&&Z.push("low_edge"),je>.62&&Z.push("angle"),{ok:Z.length===0,issues:Z,metrics:{brightness:Number(M.toFixed(1)),blurScore:Number(de.toFixed(1)),glareRatio:Number((xe*100).toFixed(1)),edgeRatio:Number((q*100).toFixed(1)),perspectiveSkew:Number((je*100).toFixed(1))}}}function st(c,p){const S=Number(c);return Number.isFinite(S)&&S>0?S:p}function as({samples:c=[],awb:p,now:S=Date.now(),stabilityWindowMs:m=1100,requiredHits:j=3}){const B=st(m,1100),$=Math.max(1,Math.floor(st(j,3))),g=st(S,Date.now()),f=String(p||"").trim(),G=Array.isArray(c)?c.filter(k=>(k==null?void 0:k.awb)&&g-((k==null?void 0:k.at)||0)<=B):[];if(!f)return{samples:G,hits:0,isStable:!1};const b=[...G,{awb:f,at:g}],z=b.reduce((k,u)=>u.awb===f?k+1:k,0);return{samples:b,hits:z,isStable:z>=$}}function os({currentAttempts:c=0,maxReframeAttempts:p=2}){const S=Math.max(0,Math.floor(st(p,2))),m=Math.max(0,Math.floor(Number(c)||0))+1;return m<=S?{action:"reframe",attempts:m}:{action:"switch_to_document",attempts:S}}const cs=window.location.origin,mn={w:"90vw",h:"18vw"},tt={w:"92vw",h:"130vw"},hn=3500,fn=900,ls=1e4,ds="mobile_scanner_offline_queue",gn="mobile_scanner_workflow_mode",xn="mobile_scanner_device_profile",us=80,ps=500,ms=1,bn=100,nt=2,wt=2,hs=500,yn=960,Ne=.68,fs=900,H={phone:"phone-camera",rugged:"rugged-scanner"},i={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"},gs=c=>{var p;try{(p=navigator==null?void 0:navigator.vibrate)==null||p.call(navigator,c)}catch{}},wn={tap:[20],lock:[150],success:[18,28,72],warning:[70,50,70],retry:[28,40,28],error:[110,55,110],duplicate:[90,50,90,50,90]},C=(c="tap")=>{gs(wn[c]||wn.tap)},_e=(c,p,S="sine")=>{try{const m=new(window.AudioContext||window.webkitAudioContext),j=m.createOscillator(),B=m.createGain();j.type=S,j.frequency.setValueAtTime(c,m.currentTime),B.gain.setValueAtTime(.12,m.currentTime),B.gain.exponentialRampToValueAtTime(.01,m.currentTime+p),j.connect(B),B.connect(m.destination),j.start(),j.stop(m.currentTime+p)}catch{}},le=()=>{_e(880,.12),setTimeout(()=>_e(1100,.1),130)},xs=()=>_e(2500,.08,"square"),bs=()=>_e(600,.08),te=()=>_e(200,.25,"sawtooth"),Cn=c=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const p=new SpeechSynthesisUtterance(c);p.rate=1.2,p.pitch=1,p.lang="en-IN",window.speechSynthesis.speak(p)}catch{}},Sn=()=>{var c;try{if(typeof window>"u")return!1;if(window.isSecureContext)return!0;const p=((c=window.location)==null?void 0:c.hostname)||"";return p==="localhost"||p==="127.0.0.1"}catch{return!1}},r={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",mutedLight:"#9CA3AF",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},ys=`
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
  10% { transform: translateX(-50%) scale(1.5); box-shadow: 0 0 15px 4px #fff, 0 0 30px 10px #ff0000; opacity: 1; }
  50% { left: 50%; transform: translateX(-50%) scale(2); box-shadow: 0 0 20px 6px #fff, 0 0 40px 15px #ff0000; opacity: 1; }
  90% { transform: translateX(-50%) scale(1.5); box-shadow: 0 0 15px 4px #fff, 0 0 30px 10px #ff0000; opacity: 1; }
  100% { left: 98%; transform: translateX(-50%) scale(1); opacity: 0.8; }
}
@keyframes laserPulse {
  0%, 100% { opacity: 0.6; box-shadow: 0 0 4px rgba(255, 0, 0, 0.8), 0 0 8px rgba(255, 0, 0, 0.4); }
  50% { opacity: 1; box-shadow: 0 0 6px rgba(255, 0, 0, 1), 0 0 15px rgba(255, 0, 0, 0.8); }
}
.scan-laser {
  position: absolute; left: 4%; right: 4%; height: 2px;
  top: 50%; transform: translateY(-50%);
  background: rgba(255, 0, 0, 0.9);
  animation: laserPulse 2s ease-in-out infinite;
}
.scan-laser-spark {
  position: absolute; top: 50%; margin-top: -2.5px;
  width: 5px; height: 5px; border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 8px 2px #ffffff, 0 0 20px 5px #ff0000;
  animation: laserSparkMove 1.8s ease-in-out infinite alternate;
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
`,ws=c=>c>=.85?"high":c>=.55?"med":"low",Ct=c=>`conf-dot conf-${ws(c)}`,vn=c=>c==="learned"?{className:"source-badge source-learned",icon:"AI",text:"Learned"}:c==="fuzzy_match"?{className:"source-badge source-ai",icon:"ðŸ”",text:"Matched"}:c==="fuzzy_history"||c==="consignee_pattern"?{className:"source-badge source-history",icon:"ðŸ“Š",text:"History"}:c==="delhivery_pincode"||c==="india_post"||c==="pincode_lookup"||c==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"ðŸ“",text:"Pincode"}:null,Cs=c=>{const p=Math.floor(c/6e4);return p<60?`${p}m`:`${Math.floor(p/60)}h ${p%60}m`};function Ts({standalone:c=!1}){var Dt,Ze,_t,Ut,Gt,qt,Vt,Ht,Qt,Xt,Yt,Kt,Jt,Zt,en;const{pin:p}=Hn(),S=Qn(),m=!!c,j=`${ds}:${m?"direct":p||"unknown"}`,B=s.useMemo(()=>`mobile_scanner_daily_count:${new Date().toISOString().slice(0,10)}`,[]),$=s.useMemo(()=>{try{return typeof window>"u"?"":new URLSearchParams(window.location.search).get("mockBarcodeRaw")||""}catch{return""}},[]),g=s.useMemo(()=>{try{if(typeof window>"u")return!1;const t=new URLSearchParams(window.location.search);return t.get("mock")==="1"||t.get("e2e")==="1"}catch{return!1}},[]),[f,G]=s.useState(null),[b,z]=s.useState("connecting"),[k,u]=s.useState(""),[w,ke]=s.useState(i.IDLE),[E,ne]=s.useState(""),[Q,K]=s.useState(null),[ge,se]=s.useState({}),[o,J]=s.useState(null),[h,T]=s.useState({}),[A,M]=s.useState(null),[de,q]=s.useState(null),[xe,be]=s.useState(""),[v,Ue]=s.useState([]),[je,Z]=s.useState(!1),[P,X]=s.useState(0),[y,ze]=s.useState({ok:!1,issues:[],metrics:null}),[O,Ee]=s.useState({kb:0,width:0,height:0,quality:Ne}),[Re,ye]=s.useState(!1),[rt,it]=s.useState("0m"),[we,Te]=s.useState("Connected"),[Me,St]=s.useState(""),[at,kn]=s.useState(!1),[vt,ot]=s.useState("idle"),[re,jn]=s.useState(null),[En,Rn]=s.useState(0),[ct,Fn]=s.useState(0),[Nt,lt]=s.useState(null),[Ce,dt]=s.useState("barcode"),[R,ut]=s.useState(()=>{if(typeof window>"u")return"fast";try{const t=localStorage.getItem(gn);if(t==="fast"||t==="ocr")return t}catch{}return g?"ocr":"fast"}),[_,kt]=s.useState(()=>{if(typeof window>"u")return H.phone;try{const t=localStorage.getItem(xn);if(t===H.phone||t===H.rugged)return t}catch{}return H.phone}),pt=s.useRef(0),[W,mt]=s.useState({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now(),scannedItems:[]}),[Ge,In]=s.useState(!1),V=s.useRef(null),qe=s.useRef(null),ue=s.useRef(null),pe=s.useRef(null),me=s.useRef(!1),Ve=s.useRef(null),An=s.useRef(!1),oe=s.useRef(i.IDLE),He=s.useRef(null),We=s.useRef(0),Se=s.useRef(null),jt=s.useRef(new Set),Be=s.useRef([]),Qe=s.useRef({awb:"",hits:0,lastSeenAt:0}),Et=s.useRef(0),Oe=s.useRef(!1),Rt=s.useRef(0),Xe=s.useRef(null),ht=s.useRef({message:"",at:0}),ie=s.useRef({lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]}),he=s.useRef(null),l=s.useCallback(t=>{ke(t)},[]),U=s.useCallback(t=>{pt.current=t,Rn(t)},[]),Y=s.useCallback(t=>{Et.current=t,Fn(t)},[]),ft=s.useCallback((t,n="warning")=>{if(!t)return;const a=Date.now();ht.current.message===t&&a-ht.current.at<fs||(ht.current={message:t,at:a},u(t),n&&C(n))},[]),Ft=s.useCallback(t=>{U(0),Y(0),dt("document"),u(t||'No barcode lock yet. Capture label instead or tap "Back to barcode mode" and hold steady.'),C("warning")},[U,Y]),Ye=s.useCallback(()=>{const t=os({currentAttempts:Et.current,maxReframeAttempts:nt});if(t.action==="reframe"){Y(t.attempts),U(0),u(`No lock yet. Reframe ${t.attempts}/${nt}: move closer, reduce glare, keep barcode horizontal.`),C("retry");return}Ft("No stable barcode lock after reframe retries. Capture label for OCR fallback.")},[Ft,U,Y]),zn=s.useCallback(()=>{ne(""),u(""),l(i.CAPTURING)},[l]),It=s.useCallback(t=>{const n=Date.now(),a=as({samples:Be.current,awb:t,now:n,stabilityWindowMs:ps,requiredHits:ms});return Be.current=a.samples,Qe.current={awb:t,hits:a.hits,lastSeenAt:n},a.isStable},[]),ce=s.useCallback(async()=>{var a;if(!Sn())throw new Error("Camera requires HTTPS (or localhost). Open this page over https:// on your phone.");if(!((a=navigator==null?void 0:navigator.mediaDevices)!=null&&a.getUserMedia))throw new Error("Camera not supported on this browser/device.");if(!V.current)throw new Error("Camera element not ready.");const t=V.current.srcObject;if(t&&typeof t.getTracks=="function"&&t.getTracks().some(I=>I.readyState==="live")){await V.current.play();return}let n=null;try{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}V.current.srcObject=n,await V.current.play()},[]);s.useEffect(()=>{const t=setInterval(()=>it(Cs(Date.now()-W.startedAt)),3e4);return()=>clearInterval(t)},[W.startedAt]);const Pe=s.useCallback(t=>{Ue(t);try{t.length?localStorage.setItem(j,JSON.stringify(t)):localStorage.removeItem(j)}catch{}},[j]),Fe=s.useCallback(t=>{const n={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:t};return Pe([...v,n]),n},[v,Pe]),At=s.useCallback(async t=>{if(String((t==null?void 0:t.scanMode)||"").toLowerCase()==="fast_barcode_only"){await ve.post("/shipments/scan",{awb:t.awb,courier:"AUTO",captureOnly:!0});return}await ve.post("/shipments/scan-mobile",{awb:t.awb,imageBase64:t.imageBase64,focusImageBase64:t.focusImageBase64||t.imageBase64,sessionContext:t.sessionContext||{}})},[]),Le=s.useCallback(async()=>{var t;if(v.length){if(m){if(!navigator.onLine)return;const n=[];for(const a of v)if((t=a==null?void 0:a.payload)!=null&&t.awb)try{await At(a.payload)}catch{n.push(a)}Pe(n),n.length?u(`Uploaded partially. ${n.length} scan(s) still queued.`):u("");return}!f||!f.connected||(v.forEach(n=>{var a;(a=n==null?void 0:n.payload)!=null&&a.awb&&f.emit("scanner:scan",n.payload)}),Pe([]))}},[m,f,v,Pe,At]),L=s.useCallback(t=>{mt(n=>{const a={...n,scannedItems:[{...t,time:Date.now()},...n.scannedItems]};try{localStorage.setItem(B,String(a.scanNumber))}catch{}return a})},[B]),Tn=s.useCallback(()=>{if(b!=="paired"){u(m?"Scanner is offline. Reconnect internet and retry.":"Phone is not connected to the desktop session.");return}if(u(""),g){l(i.SCANNING);return}ce().then(()=>l(i.SCANNING)).catch(t=>u((t==null?void 0:t.message)||"Camera access failed."))},[b,ce,l,g,m]),Mn=s.useCallback(t=>{t==null||t.preventDefault();const n=Me.trim().toUpperCase();if(!n||n.length<6){u("Enter a valid AWB number (min 6 chars)");return}if(b!=="paired"){u(m?"Scanner is offline. Reconnect internet and retry.":"Not connected to desktop session.");return}if(u(""),St(""),ne(n),g){ye(!0),l(i.CAPTURING);return}ce().then(()=>l(i.CAPTURING)).catch(a=>u((a==null?void 0:a.message)||"Camera access failed."))},[Me,b,ce,l,g,m]),Wn=s.useCallback(()=>{if(window.confirm(m?"Exit this scanner session on the phone?":"End this mobile scanner session on the phone?")){if(m){S("/app/scan");return}f!=null&&f.connected?f.emit("scanner:end-session",{reason:"Mobile ended the session"}):S("/")}},[f,S,m]),Bn=s.useCallback(()=>{if(v.length>0){Le();return}window.alert(m?"No queued scans to upload.":"Everything is already synced.")},[v.length,Le,m]);s.useEffect(()=>{oe.current=w},[w]),s.useEffect(()=>{if(g){z("paired"),Te("Mock Mode"),u(""),l(i.IDLE);return}if(m){G(null),z("paired"),Te("Direct Mode"),u(""),l(i.IDLE);return}if(!p){u("No PIN provided.");return}const t=Gn(cs,{auth:{scannerPin:p},transports:["websocket","polling"],reconnection:!0,reconnectionDelay:1500,reconnectionAttempts:20});return t.on("connect",()=>z("connecting")),t.on("scanner:paired",({userEmail:n})=>{z("paired"),Te(n?n.split("@")[0]:"Connected"),u("");const a=oe.current;a===i.PROCESSING||a===i.REVIEWING||a===i.APPROVING||a===i.SUCCESS||l(i.IDLE)}),t.on("scanner:error",({message:n})=>{u(n),z("disconnected")}),t.on("scanner:session-ended",({reason:n})=>{z("disconnected"),u(n||"Session ended by desktop."),S("/")}),t.on("disconnect",()=>z("disconnected")),t.on("reconnect",()=>{const n=oe.current;if(n===i.PROCESSING||n===i.REVIEWING||n===i.APPROVING||n===i.SUCCESS){z("paired");return}z("paired"),l(i.SCANNING)}),t.on("scanner:scan-processed",n=>{const a=oe.current;if(!(a!==i.PROCESSING&&a!==i.REVIEWING)){if(n.status==="error"){if(a!==i.PROCESSING)return;q("error"),te(),C("error"),l(i.ERROR),u(n.error||"Scan failed on desktop.");return}if(J(n),T({clientCode:n.clientCode||"",consignee:n.consignee||"",destination:n.destination||"",pincode:n.pincode||"",weight:n.weight||0,amount:n.amount||0,orderNo:n.orderNo||""}),se({}),n.reviewRequired)l(i.REVIEWING);else{le(),C("success");const d={awb:n.awb,clientCode:n.clientCode,clientName:n.clientName,destination:n.destination||"",weight:n.weight||0};M(d),L(d),l(i.SUCCESS)}}}),t.on("scanner:approval-result",({success:n,message:a,awb:d})=>{if(n){le(),C("success"),q("success");const I={awb:(o==null?void 0:o.awb)||d,clientCode:h.clientCode,clientName:(o==null?void 0:o.clientName)||h.clientCode,destination:h.destination||"",weight:parseFloat(h.weight)||0};M(I),L(I),l(i.SUCCESS)}else te(),C("error"),u(a||"Approval failed.")}),t.on("scanner:ready-for-next",()=>{}),G(t),()=>{t.disconnect()}},[p,L,o,h,l,S,g,m]),s.useEffect(()=>{try{const t=localStorage.getItem(j);if(!t)return;const n=JSON.parse(t);Array.isArray(n)&&n.length&&Ue(n)}catch{}},[j]),s.useEffect(()=>{try{localStorage.setItem(gn,R)}catch{}},[R]),s.useEffect(()=>{try{localStorage.setItem(xn,_)}catch{}},[_]),s.useEffect(()=>{if(v.length){if(m){b==="paired"&&navigator.onLine&&Le();return}b==="paired"&&(f!=null&&f.connected)&&Le()}},[b,f,v.length,Le,m]);const Ie=s.useCallback(async()=>{var t;try{if(ye(!1),he.current&&he.current.stop(),pe.current){try{const n=pe.current;n!=null&&n.barcodeScanner&&await n.barcodeScanner.dispose()}catch{}pe.current=null}if(ue.current){try{await ue.current.reset()}catch{}ue.current=null}(t=V.current)!=null&&t.srcObject&&(V.current.srcObject.getTracks().forEach(n=>n.stop()),V.current.srcObject=null)}catch{}},[]),Ae=s.useCallback(async()=>{try{if(ot("idle"),he.current&&he.current.stop(),pe.current){try{await pe.current.barcodeScanner.dispose()}catch{}pe.current=null}if(ue.current){try{ue.current._type==="native"?ue.current.reset():await ue.current.reset()}catch{}ue.current=null}}catch{}},[]),zt=s.useCallback(async()=>{if(V.current){await Ae();try{We.current=Date.now(),await ce(),he.current||(he.current=qn()),await he.current.start(V.current,qe.current,{onDetected:(t,n)=>{var I;if(me.current)return;U(0);const a=(n==null?void 0:n.format)||"unknown",d=(n==null?void 0:n.engine)||"unknown";jn({value:t,format:a,engine:d,at:Date.now(),sinceStartMs:We.current?Date.now()-We.current:null,candidateCount:(n==null?void 0:n.candidateCount)||1,ambiguous:!1,alternatives:(n==null?void 0:n.alternatives)||[]}),ot(d),(I=Se.current)==null||I.call(Se,t,{candidateCount:(n==null?void 0:n.candidateCount)||1,ambiguous:!1,alternatives:(n==null?void 0:n.alternatives)||[],format:a,engine:d})},onFail:()=>{const t=pt.current+1;U(t),t>=bn&&Ye()},onEngineReady:t=>{console.log(`[MobileScanner] Barcode engine ready: ${t}`),ot(t)}})}catch(t){u("Camera access failed: "+t.message)}}},[ce,Ae,Ye,U]),Tt=s.useCallback((t,n={})=>{var x;const a=String(t||"").trim().replace(/\s+/g,"").toUpperCase(),d=Vn(t)||a;if(me.current||oe.current!==i.SCANNING)return;if(!d||d.length<8){a.replace(/[^A-Z0-9]/g,"").length>=4&&ft("Partial barcode detected. Move closer so full AWB is visible.");return}if(n!=null&&n.ambiguous){const N=pt.current+1;U(N),ft("Multiple barcodes detected. Keep only the AWB barcode inside the strip.","retry"),N>=bn&&Ye();return}if(!g&&!It(d))return;if(me.current=!0,jt.current.has(d)){C("duplicate"),te(),be(d),setTimeout(()=>{be(""),me.current=!1,Qe.current={awb:"",hits:0,lastSeenAt:0},Be.current=[]},2500);return}clearTimeout(He.current),C("lock"),xs(),ne(d);const I=We.current?Date.now()-We.current:null;if(lt(I),ie.current={lockTimeMs:I,candidateCount:Number((n==null?void 0:n.candidateCount)||1),ambiguous:!!(n!=null&&n.ambiguous),alternatives:Array.isArray(n==null?void 0:n.alternatives)?n.alternatives.slice(0,3):[]},Y(0),U(0),u(""),mt(N=>{const D={...N,scanNumber:N.scanNumber+1};return D.scannedAwbs=new Set(N.scannedAwbs),D.scannedAwbs.add(d),jt.current=D.scannedAwbs,D}),R==="fast"){(x=Xe.current)==null||x.call(Xe,d);return}He.current=setTimeout(()=>{oe.current===i.SCANNING&&l(i.CAPTURING)},us)},[l,It,R,g,U,Y,ft,Ye]);s.useEffect(()=>{Se.current=Tt},[Tt]),s.useEffect(()=>{if(w===i.SCANNING&&(me.current=!1,Qe.current={awb:"",hits:0,lastSeenAt:0},Be.current=[],ie.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},lt(null),Y(0),U(0),dt("barcode"),zt(),g&&$)){const t=setTimeout(()=>{var n;oe.current===i.SCANNING&&((n=Se.current)==null||n.call(Se,$))},50);return()=>clearTimeout(t)}return()=>{w===i.SCANNING&&Ae()}},[w,zt,Ae,U,Y,g,$]);const Mt=s.useCallback(async()=>{if(g){ye(!0);return}await Ae();try{await ce(),ye(!0)}catch(t){u("Camera access failed: "+t.message)}},[ce,Ae,g]);s.useEffect(()=>{w===i.CAPTURING&&Mt()},[w,Mt]);const Ke=s.useCallback(()=>{const t=V.current,n=qe.current;return is(t,n)},[]);s.useEffect(()=>{if(w!==i.CAPTURING){Z(!1),X(0),ze({ok:!1,issues:[],metrics:null}),An.current=!1,Oe.current=!1;return}const t=setInterval(()=>{const n=Ke();n&&(ze(n),Z(n.ok),X(a=>{const d=n.ok?Math.min(a+1,8):0;return d>=wt&&!Oe.current&&(C("tap"),Oe.current=!0),n.ok||(Oe.current=!1),d}))},280);return()=>clearInterval(t)},[w,Ke]);const Wt=s.useCallback((t={})=>{const n=V.current,a=qe.current;if(!n||!a||!n.videoWidth)return null;const d=Nn(n,a);if(!d)return null;const I=d.x,x=d.y,N=d.w,D=d.h;if(!N||!D)return null;const et=Math.max(640,Number(t.maxWidth||yn)),De=Math.min(.85,Math.max(.55,Number(t.quality||Ne))),ee=document.createElement("canvas");ee.width=Math.min(et,Math.round(N)),ee.height=Math.round(ee.width/N*D),ee.getContext("2d").drawImage(n,I,x,N,D,0,0,ee.width,ee.height);const gt=ee.toDataURL("image/jpeg",De).split(",")[1]||"";if(!gt)return null;const Un=Math.floor(gt.length*3/4);return{base64:gt,width:ee.width,height:ee.height,approxBytes:Un,quality:De}},[]),On=s.useCallback(()=>{const t=Date.now();if(t-Rt.current<hs)return;Rt.current=t;const n=Ke()||y;if(!(n!=null&&n.ok)||P<wt){u(pn(n==null?void 0:n.issues)||"Capture quality is low. Hold steady and align the AWB in the frame."),C("warning"),te();return}q("white"),bs(),C("tap");const a=Wt({maxWidth:yn,quality:Ne});if(!(a!=null&&a.base64)){u("Could not capture image. Try again."),me.current=!1;return}Ee({kb:Math.round((a.approxBytes||0)/1024),width:a.width||0,height:a.height||0,quality:a.quality||Ne}),K(`data:image/jpeg;base64,${a.base64}`),Ie(),l(i.PREVIEW)},[Wt,Ie,l,Ke,y,P]),Pn=s.useCallback(()=>{if(!g)return;const t="data:image/jpeg;base64,ZmFrZS1tb2NrLWltYWdl";Ee({kb:0,width:0,height:0,quality:Ne}),K(t),Ie(),l(i.PREVIEW)},[l,g,Ie]),Je=s.useCallback(()=>{var t,n,a;return{scanNumber:W.scanNumber,recentClient:W.dominantClient,dominantClient:W.dominantClient,dominantClientCount:W.dominantClientCount,sessionDurationMin:Math.round((Date.now()-W.startedAt)/6e4),scanWorkflowMode:R,scanMode:Ce,deviceProfile:_,hardwareClass:_===H.rugged?"rugged":"phone",captureQuality:{ok:!!y.ok,issues:Array.isArray(y.issues)?y.issues.slice(0,8):[],metrics:y.metrics||null},captureMeta:{kb:O.kb||0,width:O.width||0,height:O.height||0,quality:O.quality||Ne},lockTimeMs:Number.isFinite(Number((t=ie.current)==null?void 0:t.lockTimeMs))?Number(ie.current.lockTimeMs):null,lockCandidateCount:Number.isFinite(Number((n=ie.current)==null?void 0:n.candidateCount))?Number(ie.current.candidateCount):1,lockAlternatives:Array.isArray((a=ie.current)==null?void 0:a.alternatives)?ie.current.alternatives.slice(0,3):[]}},[W,R,Ce,_,y,O]),Bt=s.useCallback(async t=>{var d,I;const n=String(t||"").trim().toUpperCase();if(!n)return;if(l(i.PROCESSING),g){setTimeout(()=>{const x={awb:n,clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25};M(x),L(x),l(i.SUCCESS)},120);return}const a={awb:n,imageBase64:null,focusImageBase64:null,scanMode:"fast_barcode_only",sessionContext:Je()};if(m){if(!navigator.onLine){Fe(a),le(),C("success");const x={awb:n,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};M({...x,offlineQueued:!0}),L(x),l(i.SUCCESS);return}try{const x=await ve.post("/shipments/scan",{awb:n,courier:"AUTO",captureOnly:!0}),N=((d=x==null?void 0:x.data)==null?void 0:d.shipment)||{},D={awb:N.awb||n,clientCode:N.clientCode||"MISC",clientName:((I=N.client)==null?void 0:I.company)||N.clientCode||"Scanned",destination:N.destination||"",weight:N.weight||0};M(D),L(D),le(),C("success"),l(i.SUCCESS)}catch(x){u((x==null?void 0:x.message)||"Barcode processing failed. Please try again."),te(),C("error"),l(i.ERROR)}return}if(!f||!f.connected||b!=="paired"){Fe(a),le(),C("success");const x={awb:n,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};M({...x,offlineQueued:!0}),L(x),l(i.SUCCESS);return}f.emit("scanner:scan",a),setTimeout(()=>{oe.current===i.PROCESSING&&(u("Barcode processing timed out. Please try scanning again."),te(),C("error"),l(i.ERROR))},ls)},[f,b,l,g,Fe,L,Je,m]);s.useEffect(()=>{Xe.current=Bt},[Bt]);const Ln=s.useCallback(async()=>{if(!Q)return;if(l(i.PROCESSING),g){setTimeout(()=>{const a={awb:E||"100454974120",clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25};M(a),L(a),l(i.SUCCESS)},250);return}const t=Q.split(",")[1]||Q,n={awb:E||"",imageBase64:t,focusImageBase64:t,scanMode:"ocr_label",sessionContext:Je()};if(m){if(!navigator.onLine){Fe(n),le(),C("success");const a={awb:E||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};M({...a,offlineQueued:!0}),L(a),l(i.SUCCESS);return}try{const a=await ve.post("/shipments/scan-mobile",n),d=(a==null?void 0:a.data)||a;if(d.status==="error"||!d.success){q("error"),te(),C("error"),l(i.ERROR),u(d.error||d.message||"Scan failed.");return}if(J(d),T({clientCode:d.clientCode||"",consignee:d.consignee||"",destination:d.destination||"",pincode:d.pincode||"",weight:d.weight||0,amount:d.amount||0,orderNo:d.orderNo||""}),se({}),d.reviewRequired)l(i.REVIEWING);else{le(),C("success");const I={awb:d.awb,clientCode:d.clientCode,clientName:d.clientName,destination:d.destination||"",weight:d.weight||0};M(I),L(I),l(i.SUCCESS)}}catch(a){u((a==null?void 0:a.message)||"Server error. Please try again."),te(),C("error"),l(i.ERROR)}return}if(!f||!f.connected||b!=="paired"){Fe(n),le(),C("success");const a={awb:E||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};M({...a,offlineQueued:!0}),L(a),l(i.SUCCESS);return}f.emit("scanner:scan",n),setTimeout(()=>{oe.current===i.PROCESSING&&(u("OCR timed out after 40 seconds. Retake the label photo and try again."),te(),C("error"),l(i.ERROR))},4e4)},[f,E,Q,l,b,Fe,L,g,Je,m]),$n=s.useCallback(async()=>{var I;if(!o)return;l(i.APPROVING);let t=!m;if(g){setTimeout(()=>{const x={awb:o.awb||E,clientCode:h.clientCode||"MOCKCL",clientName:o.clientName||h.clientCode||"Mock Client",destination:h.destination||"",weight:parseFloat(h.weight)||0};M(x),L(x),q("success"),t=!0,l(i.SUCCESS)},200);return}const n={clientCode:o.clientCode||"",clientName:o.clientName||"",consignee:o.consignee||"",destination:o.destination||""},a={clientCode:h.clientCode||"",clientName:h.clientCode||"",consignee:h.consignee||"",destination:h.destination||""},d={clientCode:h.clientCode,consignee:h.consignee,destination:h.destination,pincode:h.pincode,weight:parseFloat(h.weight)||0,amount:parseFloat(h.amount)||0,orderNo:h.orderNo||""};if(m)try{(o.ocrExtracted||o)&&await ve.post("/shipments/learn-corrections",{ocrFields:n,approvedFields:a}),o.shipmentId?await ve.put(`/shipments/${o.shipmentId}`,d):await ve.post("/shipments",{awb:o.awb||E,...d}),le(),C("success"),q("success");const x={awb:(o==null?void 0:o.awb)||E,clientCode:h.clientCode,clientName:(o==null?void 0:o.clientName)||h.clientCode,destination:h.destination||"",weight:parseFloat(h.weight)||0};M(x),L(x),t=!0,l(i.SUCCESS)}catch(x){l(i.REVIEWING),te(),C("error"),u((x==null?void 0:x.message)||"Approval failed.")}else{if(!f){l(i.REVIEWING),u("Not connected to desktop session.");return}(o.ocrExtracted||o)&&f.emit("scanner:learn-corrections",{pin:p,ocrFields:n,approvedFields:a,courier:(o==null?void 0:o.courier)||((I=o==null?void 0:o.ocrExtracted)==null?void 0:I.courier)||"",deviceProfile:_}),f.emit("scanner:approval-submit",{shipmentId:o.shipmentId,awb:o.awb||E,fields:d},x=>{x!=null&&x.success||(l(i.REVIEWING),te(),C("error"),u((x==null?void 0:x.message)||"Approval failed."))})}t&&h.clientCode&&h.clientCode!=="MISC"&&mt(x=>{var et,De;const N={...x.clientFreq};N[h.clientCode]=(N[h.clientCode]||0)+1;const D=Object.entries(N).sort((ee,tn)=>tn[1]-ee[1]);return{...x,clientFreq:N,dominantClient:((et=D[0])==null?void 0:et[1])>=2?D[0][0]:null,dominantClientCount:((De=D[0])==null?void 0:De[1])||0}})},[f,o,h,E,p,l,L,g,_,m]),$e=s.useCallback((t=i.IDLE)=>{clearTimeout(Ve.current),clearTimeout(He.current),ne(""),K(null),Ee({kb:0,width:0,height:0,quality:Ne}),J(null),T({}),se({}),M(null),lt(null),u(""),be(""),Z(!1),X(0),ze({ok:!1,issues:[],metrics:null}),me.current=!1,Qe.current={awb:"",hits:0,lastSeenAt:0},Be.current=[],ie.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},Oe.current=!1,Y(0),l(t)},[l,Y]);s.useEffect(()=>{if(w===i.SUCCESS){const t=R==="fast"?i.SCANNING:i.IDLE,n=R==="fast"?fn:hn;return Ve.current=setTimeout(()=>$e(t),n),()=>clearTimeout(Ve.current)}},[w,$e,R]),s.useEffect(()=>{if(Ge)if(w===i.REVIEWING&&o){const t=[o.clientName||o.clientCode,o.destination,o.weight?`${o.weight} kilograms`:""].filter(Boolean);t.length&&Cn(t.join(". "))}else w===i.SUCCESS&&A&&Cn(`${A.clientName||A.clientCode||"Shipment"} Verified.`)},[Ge,w,o,A]),s.useEffect(()=>()=>{Ie(),clearTimeout(Ve.current),clearTimeout(He.current)},[Ie]);const ae=t=>`msp-step ${w===t?"active":""}`,Ot=Math.max(1,Math.round((R==="fast"?fn:hn)/1e3)),Dn=y.ok?"AWB quality looks good - press shutter":pn(y.issues)||"Fit AWB slip fully in frame and hold steady",Pt=Re&&y.ok&&P>=wt,fe=s.useMemo(()=>{if(!o)return{};const t=o.ocrExtracted||o;return{clientCode:{confidence:(t==null?void 0:t.clientNameConfidence)||0,source:(t==null?void 0:t.clientNameSource)||null},consignee:{confidence:(t==null?void 0:t.consigneeConfidence)||0,source:(t==null?void 0:t.consigneeSource)||null},destination:{confidence:(t==null?void 0:t.destinationConfidence)||0,source:(t==null?void 0:t.destinationSource)||null},pincode:{confidence:(t==null?void 0:t.pincodeConfidence)||0,source:null},weight:{confidence:(t==null?void 0:t.weightConfidence)||0,source:null}}},[o]),Lt=W.scannedItems.reduce((t,n)=>t+(n.weight||0),0),F=((Dt=o==null?void 0:o.ocrExtracted)==null?void 0:Dt.intelligence)||(o==null?void 0:o.intelligence)||null,$t=(Ut=(_t=(Ze=he.current)==null?void 0:Ze.getDiagnostics)==null?void 0:_t.call(Ze))==null?void 0:Ut.wasmFailReason,_n=[["Step",w],["Connection",b],["Engine",vt],...$t?[["WASM Error",$t]]:[],["Workflow",R],["Device",_],["Scan mode",Ce],["Fail count",String(En)],["Reframe retries",`${ct}/${nt}`],["Camera",Re?"ready":"waiting"],["Doc detect",je?`yes (${P})`:"no"],["Capture quality",y.ok?"good":y.issues.join(", ")||"pending"],["Capture metrics",y.metrics?`blur ${y.metrics.blurScore} | glare ${y.metrics.glareRatio}% | skew ${y.metrics.perspectiveSkew}%`:"-"],["JPEG last shot",O.kb?`${O.kb}KB ${O.width}x${O.height} q=${O.quality}`:"-"],["Secure ctx",Sn()?"yes":"no"],["AWB lock",E||"-"],["Lock ms",Nt!=null?String(Nt):"-"],["Lock candidates",String(((Gt=ie.current)==null?void 0:Gt.candidateCount)||1)],["Queued",String(v.length)],["Scans",String(W.scanNumber)],["Last format",(re==null?void 0:re.format)||"-"],["Last code",(re==null?void 0:re.value)||"-"],["Decode ms",(re==null?void 0:re.sinceStartMs)!=null?String(re.sinceStartMs):"-"],["False-lock",(qt=o==null?void 0:o.scanTelemetry)!=null&&qt.falseLock?"yes":"no"]];return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:ys}),e.jsxs("div",{className:"msp-root",children:[de&&e.jsx("div",{className:`flash-overlay flash-${de}`,onAnimationEnd:()=>q(null)}),xe&&e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[e.jsx(nn,{size:48,color:"white"}),e.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),e.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:xe}),e.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),e.jsx("button",{type:"button","data-testid":"scanner-diag-toggle",onClick:()=>kn(t=>!t),style:{position:"fixed",top:12,right:12,zIndex:70,border:"1px solid rgba(255,255,255,0.18)",background:at?"rgba(79,70,229,0.92)":"rgba(15,23,42,0.72)",color:"#fff",borderRadius:999,padding:"8px 12px",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.04em",backdropFilter:"blur(10px)",cursor:"pointer"},children:at?"Hide Diag":"Show Diag"}),at&&e.jsxs("div",{"data-testid":"scanner-diag-panel",style:{position:"fixed",top:56,right:12,zIndex:69,width:"min(92vw, 320px)",background:"rgba(15,23,42,0.88)",color:"#E5EEF8",border:"1px solid rgba(255,255,255,0.12)",borderRadius:18,padding:14,backdropFilter:"blur(14px)",boxShadow:"0 12px 30px rgba(0,0,0,0.25)"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10,color:"#A5B4FC"},children:"Scanner Diagnostics"}),e.jsx("div",{style:{display:"grid",gap:6},children:_n.map(([t,n])=>e.jsxs("div",{style:{display:"flex",gap:8,justifyContent:"space-between",alignItems:"flex-start",fontSize:"0.76rem"},children:[e.jsx("div",{style:{color:"rgba(226,232,240,0.72)",minWidth:88},children:t}),e.jsx("div",{className:"mono",style:{textAlign:"right",wordBreak:"break-word",maxWidth:180},children:n})]},t))}),e.jsx("div",{style:{marginTop:10,fontSize:"0.68rem",color:"rgba(226,232,240,0.7)",lineHeight:1.4},children:"Use this to verify whether Trackon labels are being decoded as `ITF` and how quickly the first lock happens after scan start."})]}),b!=="paired"&&e.jsx("div",{className:ae(i.IDLE),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:r.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:b==="connecting"?e.jsx(xt,{size:28,color:r.primary,style:{animation:"spin 1s linear infinite"}}):e.jsx(sn,{size:28,color:r.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:b==="connecting"?"Connecting...":"Disconnected"}),e.jsx("div",{style:{fontSize:"0.82rem",color:r.muted},children:k||(m?"Preparing direct scanner session":`Connecting to session ${p}`)})]}),b==="disconnected"&&e.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[e.jsx(xt,{size:16})," Reconnect"]})]})}),e.jsx("video",{ref:V,autoPlay:!0,playsInline:!0,muted:!0,onClick:()=>{ce().catch(t=>{u((t==null?void 0:t.message)||"Camera access failed.")})},style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(w===i.SCANNING||w===i.CAPTURING)&&!pe.current?"block":"none"}}),e.jsx("div",{className:ae(i.IDLE),children:e.jsxs("div",{className:"home-root",children:[e.jsxs("div",{className:"home-header",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16},children:[e.jsxs("button",{onClick:()=>S("/app/scan"),style:{background:"white",border:"1px solid #E2E8F0",padding:"6px 12px",borderRadius:20,fontSize:"0.75rem",fontWeight:600,color:"#475569",display:"flex",alignItems:"center",gap:4,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.02)"},children:[e.jsx(Xn,{size:14})," Go Back"]}),e.jsxs("div",{className:"home-logo-badge",children:[e.jsx(rn,{size:11,color:b==="paired"&&navigator.onLine?"#10B981":"#EF4444"}),we]})]}),e.jsx("div",{className:"home-logo-row",children:e.jsxs("div",{className:"home-logo-text",children:[e.jsx("img",{src:"/images/logo.png",alt:"Sea Hawk Logo",style:{height:28,width:"auto",objectFit:"contain",padding:2,background:"white",borderRadius:6,border:"1px solid #E2E8F0"}}),e.jsx("span",{children:"Seahawk Scanner"})]})}),e.jsxs("div",{className:"home-stats-row",children:[e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:W.scanNumber}),e.jsx("div",{className:"home-stat-label",children:"Scanned"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:Lt>0?Lt.toFixed(1):"0"}),e.jsx("div",{className:"home-stat-label",children:"Total kg"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:rt}),e.jsx("div",{className:"home-stat-label",children:"Session"})]})]})]}),e.jsxs("div",{className:"home-scan-section",children:[e.jsxs("div",{className:"home-scan-btn-wrap",children:[e.jsx("div",{className:"home-scan-ring"}),e.jsx("div",{className:"home-scan-ring home-scan-ring2"}),e.jsxs("button",{"data-testid":"start-scan-btn",className:"home-scan-btn",onClick:Tn,children:[e.jsx(bt,{size:34,color:"white"}),e.jsx("span",{className:"home-scan-btn-label",children:"Scan"})]})]}),e.jsx("div",{className:"home-cta-text",children:W.scanNumber===0?"Tap to start your first scan":"Tap to scan next parcel"}),e.jsxs("div",{style:{display:"flex",gap:8,marginTop:14,width:"100%",maxWidth:320},children:[e.jsxs("button",{type:"button","data-testid":"workflow-fast-btn",onClick:()=>ut("fast"),style:{flex:1,borderRadius:999,border:`1px solid ${R==="fast"?r.primary:r.border}`,background:R==="fast"?r.primaryLight:r.surface,color:R==="fast"?r.primary:r.muted,fontWeight:700,fontSize:"0.72rem",padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(an,{size:13})," Fast scan"]}),e.jsxs("button",{type:"button","data-testid":"workflow-ocr-btn",onClick:()=>ut("ocr"),style:{flex:1,borderRadius:999,border:`1px solid ${R==="ocr"?r.primary:r.border}`,background:R==="ocr"?r.primaryLight:r.surface,color:R==="ocr"?r.primary:r.muted,fontWeight:700,fontSize:"0.72rem",padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(yt,{size:13})," OCR label"]})]}),e.jsxs("div",{style:{display:"flex",gap:8,marginTop:8,width:"100%",maxWidth:320},children:[e.jsxs("button",{type:"button","data-testid":"device-profile-phone-btn",onClick:()=>kt(H.phone),style:{flex:1,borderRadius:999,border:`1px solid ${_===H.phone?r.primary:r.border}`,background:_===H.phone?r.primaryLight:r.surface,color:_===H.phone?r.primary:r.muted,fontWeight:700,fontSize:"0.7rem",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(bt,{size:13})," Phone lens"]}),e.jsxs("button",{type:"button","data-testid":"device-profile-rugged-btn",onClick:()=>kt(H.rugged),style:{flex:1,borderRadius:999,border:`1px solid ${_===H.rugged?r.primary:r.border}`,background:_===H.rugged?r.primaryLight:r.surface,color:_===H.rugged?r.primary:r.muted,fontWeight:700,fontSize:"0.7rem",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(Yn,{size:13})," Rugged"]})]}),e.jsxs("form",{onSubmit:Mn,style:{width:"100%",maxWidth:300,marginTop:20},children:[e.jsx("div",{style:{fontSize:"0.62rem",fontWeight:700,color:r.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6,textAlign:"center"},children:"Can't scan? Enter AWB manually"}),e.jsxs("div",{style:{display:"flex",gap:6},children:[e.jsx("input",{"data-testid":"manual-awb-input",value:Me,onChange:t=>St(t.target.value.toUpperCase()),placeholder:"e.g. 1234567890",inputMode:"text",autoCapitalize:"characters",style:{flex:1,padding:"9px 12px",border:`1.5px solid ${r.border}`,borderRadius:10,fontFamily:"JetBrains Mono, monospace",fontSize:"0.82rem",fontWeight:600,background:r.surface,color:r.text,outline:"none"},onFocus:t=>t.target.style.borderColor=r.primary,onBlur:t=>t.target.style.borderColor=r.border}),e.jsx("button",{type:"submit","data-testid":"manual-awb-submit",disabled:Me.trim().length<6,className:"btn btn-primary",style:{padding:"9px 14px",fontSize:"0.78rem",borderRadius:10,opacity:Me.trim().length>=6?1:.45},children:"Go â†’"})]})]}),e.jsxs("div",{className:"action-buttons-row",children:[e.jsxs("button",{className:"action-btn",onClick:Bn,children:[e.jsx(Kn,{size:14})," ",v.length>0?`Upload (${v.length})`:"Synced"]}),e.jsxs("button",{className:"action-btn danger",onClick:Wn,children:[e.jsx(Jn,{size:14})," End Session"]})]}),v.length>0&&e.jsxs("div",{style:{marginTop:14,fontSize:"0.7rem",color:r.warning,fontWeight:600,display:"flex",alignItems:"center",gap:5},children:[e.jsx(on,{size:12})," ",v.length," offline scan",v.length>1?"s":""," pending sync"]})]}),e.jsxs("div",{className:"home-queue-section",children:[e.jsxs("div",{className:"home-queue-head",children:[e.jsxs("div",{className:"home-queue-title-text",children:[e.jsx(Zn,{size:11}),"Accepted Consignments"]}),W.scannedItems.length>0&&e.jsx("div",{className:"home-queue-badge",children:W.scannedItems.length})]}),e.jsx("div",{className:"home-queue-list",children:W.scannedItems.length===0?e.jsxs("div",{className:"queue-empty",children:[e.jsx(cn,{size:36,color:"rgba(255,255,255,0.12)"}),e.jsxs("div",{className:"queue-empty-text",children:["No consignments scanned yet.",e.jsx("br",{}),"Tap the button above to begin."]})]}):W.scannedItems.map((t,n)=>e.jsxs("div",{className:"queue-item",children:[e.jsx("div",{className:"queue-check",children:e.jsx(ln,{size:13,color:"#10B981"})}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{className:"queue-awb",children:t.awb}),e.jsxs("div",{className:"queue-meta",children:[t.clientCode==="OFFLINE"?e.jsx("span",{className:"queue-offline-tag",children:"Offline"}):t.clientCode&&e.jsx("span",{className:"queue-client-tag",children:t.clientCode}),t.destination&&e.jsx("span",{children:t.destination})]})]}),t.weight>0&&e.jsxs("div",{className:"queue-weight",children:[t.weight,"kg"]})]},`${t.awb}-${n}`))})]})]})}),e.jsx("div",{className:ae(i.SCANNING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[e.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:pe.current?"block":"none"}}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{className:"scan-guide",style:Ce==="barcode"?{width:mn.w,height:mn.h,borderRadius:10,maxHeight:"20vw",transition:"all 0.4s ease",borderColor:k?"rgba(248,113,113,0.92)":void 0,boxShadow:k?"0 0 0 3px rgba(248,113,113,0.2)":void 0}:{width:tt.w,height:tt.h,borderRadius:14,maxHeight:"75vh",transition:"all 0.4s ease",borderColor:"rgba(251,191,36,0.85)",boxShadow:"0 0 0 3px rgba(251,191,36,0.2)"},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"}),Ce==="barcode"&&e.jsx("div",{className:"scan-laser",children:e.jsx("div",{className:"scan-laser-spark"})})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(rn,{size:12})," ",m?"DIRECT":p]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[Ce==="document"&&e.jsxs("div",{className:"cam-hud-chip",style:{background:"rgba(251,191,36,0.22)",color:"#FDE68A",fontWeight:700,fontSize:"0.65rem",gap:4},children:[e.jsx(dn,{size:11})," LABEL MODE"]}),e.jsxs("div",{className:"cam-hud-chip",style:{gap:4},children:[e.jsx(cn,{size:12})," ",W.scanNumber,vt==="native"?e.jsx("span",{style:{color:"#34D399",fontSize:"0.6rem",fontWeight:800},children:"⚡ NATIVE"}):e.jsx("span",{style:{color:"#F59E0B",fontSize:"0.6rem",fontWeight:800},children:"ZXING"})]})]})]}),e.jsxs("div",{className:"cam-bottom",children:[Ce==="barcode"?e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:6,color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:[e.jsx("div",{children:R==="fast"?"Align barcode inside the strip - auto-save on lock":"Align barcode inside the strip - camera opens for label capture after lock"}),ct>0&&e.jsxs("div",{style:{color:"#FDE68A",fontSize:"0.74rem",fontWeight:700},children:["Reframe retry ",ct,"/",nt]}),!!k&&e.jsx("div",{style:{color:"#FCA5A5",fontSize:"0.72rem",fontWeight:700},children:k})]}):e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:6},children:[e.jsx("div",{style:{color:"rgba(251,191,36,0.95)",fontSize:"0.82rem",fontWeight:700,textAlign:"center"},children:"No barcode found - capture the label and we will read the printed AWB"}),e.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"},children:[e.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:zn,children:"Capture label instead"}),e.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:()=>{U(0),Y(0),u(""),dt("barcode"),C("tap")},children:"Back to barcode mode"})]})]}),e.jsxs("div",{style:{display:"flex",gap:12},children:[e.jsxs("button",{className:"cam-hud-chip",onClick:()=>ut(t=>t==="fast"?"ocr":"fast"),style:{border:"none",cursor:"pointer",gap:5},children:[R==="fast"?e.jsx(an,{size:13}):e.jsx(yt,{size:13}),R==="fast"?"FAST":"OCR"]}),e.jsx("button",{className:"cam-hud-chip",onClick:()=>In(!Ge),style:{border:"none",cursor:"pointer"},children:Ge?e.jsx(es,{size:14}):e.jsx(ts,{size:14})})]})]})]})}),e.jsx("div",{className:ae(i.CAPTURING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!Re&&e.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[e.jsx(ns,{size:44,color:"#34D399"}),e.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:E||"OCR fallback"}),e.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:E?"Barcode locked - Preparing camera...":"Preparing label capture for printed AWB OCR..."})]}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{ref:qe,className:`scan-guide ${je?"detected":""}`,style:{width:tt.w,height:tt.h,maxHeight:"75vh",borderRadius:12},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[e.jsx(dn,{size:12})," ",E||"OCR AWB capture"]}),v.length>0&&e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(on,{size:12})," ",v.length," queued"]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:je?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center",transition:"color 0.3s"},children:Dn}),y.metrics&&e.jsxs("div",{style:{color:"rgba(255,255,255,0.66)",fontSize:"0.72rem",textAlign:"center"},children:["Blur ",y.metrics.blurScore," | Glare ",y.metrics.glareRatio,"% | Skew ",y.metrics.perspectiveSkew,"%"]}),e.jsx("button",{className:"capture-btn","data-testid":"capture-photo-btn",onClick:On,disabled:!Pt,style:{opacity:Pt?1:.4},children:e.jsx("div",{className:"capture-btn-inner"})}),g&&e.jsx("button",{type:"button","data-testid":"mock-capture-btn",onClick:Pn,style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 12px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:"Mock capture"}),e.jsx("button",{style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},onClick:()=>{ne(""),u(""),U(0),Y(0),me.current=!1,C("tap"),l(i.SCANNING)},children:"â† Rescan barcode"})]})]})}),e.jsx("div",{className:ae(i.PREVIEW),children:e.jsxs("div",{style:{background:r.bg,display:"flex",flexDirection:"column",height:"100%"},children:[e.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${r.border}`},children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.72rem",color:r.muted,fontWeight:600},children:"CAPTURED"}),e.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:E||"Printed AWB OCR"}),O.kb>0&&e.jsxs("div",{style:{fontSize:"0.68rem",color:r.mutedLight},children:[O.kb,"KB • ",O.width,"×",O.height]})]})}),e.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:Q&&e.jsx("img",{src:Q,alt:"Captured label",className:"preview-img"})}),e.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{K(null),l(i.CAPTURING)},children:[e.jsx(un,{size:16})," Retake"]}),e.jsxs("button",{"data-testid":"use-photo-btn",className:"btn btn-primary",style:{flex:2},onClick:Ln,children:[e.jsx(ss,{size:16})," Use Photo"]})]})]})}),e.jsx("div",{className:ae(i.PROCESSING),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16},children:[e.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[e.jsx(yt,{size:22,color:r.primary,style:{animation:"spin 2s linear infinite"}}),e.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:r.primary},children:"Intelligence Engine"})]}),e.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:r.muted},children:E}),e.jsx("div",{style:{fontSize:"0.72rem",color:r.mutedLight,marginTop:6},children:Q?"Reading AWB label with local OCR...":"Saving barcode scan..."})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(t=>e.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:t}),e.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),e.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},t)),e.jsx("div",{style:{textAlign:"center",marginTop:8},children:e.jsx("button",{className:"btn btn-outline",style:{fontSize:"0.75rem",padding:"8px 20px"},onClick:()=>{u("Cancelled by user."),l(i.ERROR)},children:"Cancel"})})]})}),e.jsx("div",{className:ae(i.REVIEWING),children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%"},children:[e.jsxs("div",{style:{padding:"14px 20px",borderBottom:`1px solid ${r.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.65rem",color:r.muted,fontWeight:600},children:"REVIEW EXTRACTION"}),e.jsx("div",{className:"mono",style:{fontSize:"0.95rem",fontWeight:700},children:(o==null?void 0:o.awb)||E})]}),(F==null?void 0:F.learnedFieldCount)>0&&e.jsxs("div",{className:"source-badge source-learned",children:["AI ",F.learnedFieldCount," auto-corrected"]})]}),e.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsxs("div",{className:`field-card ${(((Vt=fe.clientCode)==null?void 0:Vt.confidence)||0)<.55?"warning":""}`,children:[e.jsx("div",{className:Ct(((Ht=fe.clientCode)==null?void 0:Ht.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((Qt=fe.clientCode)==null?void 0:Qt.source)&&(()=>{const t=vn(fe.clientCode.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:h.clientCode||"",onChange:t=>T(n=>({...n,clientCode:t.target.value.toUpperCase()})),placeholder:"Client code"}),((Xt=F==null?void 0:F.clientMatches)==null?void 0:Xt.length)>0&&F.clientNeedsConfirmation&&e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:F.clientMatches.slice(0,3).map(t=>e.jsxs("button",{onClick:()=>T(n=>({...n,clientCode:t.code})),style:{fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:`1px solid ${r.border}`,background:h.clientCode===t.code?r.primaryLight:r.surface,color:r.text,cursor:"pointer",fontFamily:"inherit",fontWeight:500},children:[t.code," (",Math.round(t.score*100),"%)"]},t.code))})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:Ct(((Yt=fe.consignee)==null?void 0:Yt.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Consignee"}),e.jsx("input",{className:"field-input",value:h.consignee||"",onChange:t=>T(n=>({...n,consignee:t.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:Ct(((Kt=fe.destination)==null?void 0:Kt.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((Jt=fe.destination)==null?void 0:Jt.source)&&(()=>{const t=vn(fe.destination.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:h.destination||"",onChange:t=>T(n=>({...n,destination:t.target.value.toUpperCase()})),placeholder:"City"}),(F==null?void 0:F.pincodeCity)&&F.pincodeCity!==h.destination&&e.jsxs("button",{onClick:()=>T(t=>({...t,destination:F.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:r.successLight,color:r.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["ðŸ“ Pincode suggests: ",F.pincodeCity]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Pincode"}),e.jsx("input",{className:"field-input",value:h.pincode||"",onChange:t=>T(n=>({...n,pincode:t.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),e.jsx("div",{className:`field-card ${(Zt=F==null?void 0:F.weightAnomaly)!=null&&Zt.anomaly?"warning":""}`,children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Weight (kg)"}),e.jsx("input",{className:"field-input",value:h.weight||"",onChange:t=>T(n=>({...n,weight:t.target.value})),placeholder:"0.0",inputMode:"decimal"}),((en=F==null?void 0:F.weightAnomaly)==null?void 0:en.anomaly)&&e.jsxs("div",{style:{fontSize:"0.6rem",color:r.warning,marginTop:2,fontWeight:500},children:["Warning: ",F.weightAnomaly.warning]})]})})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Amount (â‚¹)"}),e.jsx("input",{className:"field-input",value:h.amount||"",onChange:t=>T(n=>({...n,amount:t.target.value})),placeholder:"0",inputMode:"decimal"})]})}),e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Order No"}),e.jsx("input",{className:"field-input",value:h.orderNo||"",onChange:t=>T(n=>({...n,orderNo:t.target.value})),placeholder:"Optional"})]})})]})]}),e.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${r.border}`,display:"flex",gap:10},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:$e,children:[e.jsx(rs,{size:16})," Skip"]}),e.jsxs("button",{"data-testid":"approve-save-btn",className:"btn btn-success btn-lg",style:{flex:2},onClick:$n,disabled:w===i.APPROVING,children:[w===i.APPROVING?e.jsx(xt,{size:16,style:{animation:"spin 1s linear infinite"}}):e.jsx(ln,{size:16}),w===i.APPROVING?"Saving...":"Approve & Save"]})]})]})}),e.jsx("div",{className:ae(i.APPROVING)}),e.jsx("div",{className:ae(i.SUCCESS),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[e.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:r.success,strokeWidth:"3",className:"success-check-circle"}),e.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:r.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:r.success,marginBottom:4},children:"Saved Successfully"}),e.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700},children:A==null?void 0:A.awb}),(A==null?void 0:A.clientCode)&&e.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:r.primaryLight,color:r.primary,fontSize:"0.78rem",fontWeight:600},children:A.clientName||A.clientCode})]}),e.jsx("div",{style:{fontSize:"0.72rem",color:r.muted},children:A!=null&&A.offlineQueued?`${v.length} queued for sync - Auto-continuing in ${Ot}s`:`#${W.scanNumber} scanned - Auto-continuing in ${Ot}s`}),e.jsxs("button",{"data-testid":"scan-next-btn",className:"btn btn-primary btn-lg btn-full",onClick:()=>$e(R==="fast"?i.SCANNING:i.IDLE),style:{maxWidth:320},children:[e.jsx(bt,{size:18})," ",R==="fast"?"Keep Scanning":"Scan Next Parcel"]})]})}),e.jsx("div",{className:ae(i.ERROR),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:r.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(nn,{size:32,color:r.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:r.error},children:"Scan Error"}),e.jsx("div",{style:{fontSize:"0.82rem",color:r.muted,marginTop:4},children:k})]}),e.jsxs("button",{className:"btn btn-primary",onClick:$e,children:[e.jsx(un,{size:16})," Try Again"]})]})}),b==="disconnected"&&w!==i.IDLE&&e.jsxs("div",{className:"offline-banner",children:[e.jsx(sn,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline â€” Reconnecting... ",v.length?`(${v.length} queued)`:""]})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{Ts as default};
