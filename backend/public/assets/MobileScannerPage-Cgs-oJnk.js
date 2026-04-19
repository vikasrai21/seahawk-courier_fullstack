import{j as e}from"./page-landing-CREvANXP.js";import{r as s}from"./vendor-helmet-Dwc3L0SQ.js";import{l as qn}from"./index-c6-PQZgn.js";import{a as ve}from"./page-import-CFGNhKM8.js";import{c as Vn,n as Hn}from"./barcodeEngine-XIys9PBr.js";import{c as Qn,u as Yn}from"./vendor-react-DrB23wtn.js";import{b as nn,R as xt,b1 as sn,Y as Kn,aW as rn,aX as bt,Z as on,aH as yt,J as Xn,b2 as Jn,ac as Zn,d as an,a7 as es,H as cn,b3 as ln,aQ as dn,b4 as ts,b5 as ns,a4 as ss,a1 as un,p as rs,X as is}from"./vendor-icons-DyYViWBt.js";import"./page-reconcile-BQT9N3SU.js";import"./page-rate-calc-CC-LHkCs.js";function jn(c,p){var S,m;try{if(!c||!p)return null;const k=Number(c.videoWidth||0),O=Number(c.videoHeight||0);if(!k||!O)return null;const $=(S=c.getBoundingClientRect)==null?void 0:S.call(c),f=(m=p.getBoundingClientRect)==null?void 0:m.call(p);if(!$||!f)return null;const g=Number($.width||0),G=Number($.height||0);if(!g||!G)return null;const b=Math.max(g/k,G/O),z=k*b,j=O*b,u=(g-z)/2,C=(G-j)/2,je=f.left-$.left,E=f.top-$.top,ne=f.right-$.left,Q=f.bottom-$.top,X=(je-u)/b,fe=(E-C)/b,se=(ne-u)/b,a=(Q-C)/b,J=(xe,be,v)=>Math.max(be,Math.min(v,xe)),h=J(Math.min(X,se),0,k),T=J(Math.min(fe,a),0,O),A=J(Math.max(X,se),0,k),M=J(Math.max(fe,a),0,O),de=Math.max(0,A-h),q=Math.max(0,M-T);return!de||!q?null:{x:h,y:T,w:de,h:q}}catch{return null}}function pn(c=[]){if(!c.length)return"";const p=[];return c.includes("blur")&&p.push("hold steady"),c.includes("glare")&&p.push("reduce glare"),c.includes("angle")&&p.push("straighten angle"),c.includes("dark")&&p.push("add light"),c.includes("low_edge")&&p.push("fill frame"),p.length?`Improve capture: ${p.join(", ")}.`:""}function os(c,p){if(!c||!p||!c.videoWidth||!c.videoHeight)return null;const S=jn(c,p);if(!S)return null;const m=Math.max(0,Math.floor(S.x)),k=Math.max(0,Math.floor(S.y)),O=Math.max(24,Math.floor(S.w)),$=Math.max(24,Math.floor(S.h)),f=128,g=96,G=document.createElement("canvas");G.width=f,G.height=g;const b=G.getContext("2d",{willReadFrequently:!0});if(!b)return null;b.drawImage(c,m,k,Math.min(O,c.videoWidth-m),Math.min($,c.videoHeight-k),0,0,f,g);const z=b.getImageData(0,0,f,g).data,j=f*g,u=new Float32Array(j);let C=0,je=0,E=0;for(let P=0,Y=0;P<z.length;P+=4,Y+=1){const y=.2126*z[P]+.7152*z[P+1]+.0722*z[P+2];u[Y]=y,C+=y,y>=245&&(je+=1),y<=24&&(E+=1)}let ne=0,Q=0,X=0,fe=0,se=0,a=0;const J=Math.max(4,Math.floor(g*.15)),h=Math.max(4,Math.floor(f*.15)),T=f;for(let P=1;P<g-1;P+=1)for(let Y=1;Y<f-1;Y+=1){const y=P*T+Y,ze=u[y],B=u[y-1],Ee=u[y+1],Re=u[y-T],ye=u[y+T],rt=Math.abs(Ee-B),it=Math.abs(ye-Re),Ce=rt+it,Te=Math.abs(4*ze-B-Ee-Re-ye);ne+=Te,Ce>58&&(Q+=1),P<=J&&(X+=Ce),P>=g-J&&(fe+=Ce),Y<=h&&(se+=Ce),Y>=f-h&&(a+=Ce)}const A=Math.max(1,(f-2)*(g-2)),M=C/j,de=ne/A,q=Q/A,xe=je/j,be=E/j,v=Math.abs(X-fe)/Math.max(1,X+fe),_e=Math.abs(se-a)/Math.max(1,se+a),ke=Math.max(v,_e),Z=[];return de<22&&Z.push("blur"),xe>.18&&Z.push("glare"),(be>.55||M<40)&&Z.push("dark"),q<.08&&Z.push("low_edge"),ke>.62&&Z.push("angle"),{ok:Z.length===0,issues:Z,metrics:{brightness:Number(M.toFixed(1)),blurScore:Number(de.toFixed(1)),glareRatio:Number((xe*100).toFixed(1)),edgeRatio:Number((q*100).toFixed(1)),perspectiveSkew:Number((ke*100).toFixed(1))}}}function nt(c,p){const S=Number(c);return Number.isFinite(S)&&S>0?S:p}function as({samples:c=[],awb:p,now:S=Date.now(),stabilityWindowMs:m=1100,requiredHits:k=3}){const O=nt(m,1100),$=Math.max(1,Math.floor(nt(k,3))),f=nt(S,Date.now()),g=String(p||"").trim(),G=Array.isArray(c)?c.filter(j=>(j==null?void 0:j.awb)&&f-((j==null?void 0:j.at)||0)<=O):[];if(!g)return{samples:G,hits:0,isStable:!1};const b=[...G,{awb:g,at:f}],z=b.reduce((j,u)=>u.awb===g?j+1:j,0);return{samples:b,hits:z,isStable:z>=$}}function cs({currentAttempts:c=0,maxReframeAttempts:p=2}){const S=Math.max(0,Math.floor(nt(p,2))),m=Math.max(0,Math.floor(Number(c)||0))+1;return m<=S?{action:"reframe",attempts:m}:{action:"switch_to_document",attempts:S}}const ls=window.location.origin,mn={w:"90vw",h:"18vw"},et={w:"92vw",h:"130vw"},hn=3500,gn=900,ds=1e4,us="mobile_scanner_offline_queue",fn="mobile_scanner_workflow_mode",xn="mobile_scanner_device_profile",ps=80,ms=1500,hs=2,bn=100,tt=2,Ct=2,gs=500,yn=960,Ne=.68,fs=900,H={phone:"phone-camera",rugged:"rugged-scanner"},i={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"},xs=c=>{var p;try{(p=navigator==null?void 0:navigator.vibrate)==null||p.call(navigator,c)}catch{}},Cn={tap:[20],lock:[24,24,24],success:[18,28,72],warning:[70,50,70],retry:[28,40,28],error:[110,55,110],duplicate:[90,50,90,50,90]},w=(c="tap")=>{xs(Cn[c]||Cn.tap)},st=(c,p,S="sine")=>{try{const m=new(window.AudioContext||window.webkitAudioContext),k=m.createOscillator(),O=m.createGain();k.type=S,k.frequency.setValueAtTime(c,m.currentTime),O.gain.setValueAtTime(.12,m.currentTime),O.gain.exponentialRampToValueAtTime(.01,m.currentTime+p),k.connect(O),O.connect(m.destination),k.start(),k.stop(m.currentTime+p)}catch{}},le=()=>{st(880,.12),setTimeout(()=>st(1100,.1),130)},wn=()=>st(600,.08),te=()=>st(200,.25,"sawtooth"),Sn=c=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const p=new SpeechSynthesisUtterance(c);p.rate=1.2,p.pitch=1,p.lang="en-IN",window.speechSynthesis.speak(p)}catch{}},vn=()=>{var c;try{if(typeof window>"u")return!1;if(window.isSecureContext)return!0;const p=((c=window.location)==null?void 0:c.hostname)||"";return p==="localhost"||p==="127.0.0.1"}catch{return!1}},r={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",mutedLight:"#9CA3AF",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},bs=`
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
@keyframes laserScan {
  0%, 100% { top: 15%; } 50% { top: 82%; }
}
.scan-laser {
  position: absolute; left: 8%; right: 8%; height: 2px;
  background: linear-gradient(90deg, transparent, rgba(79,70,229,0.6), transparent);
  animation: laserScan 2.5s ease-in-out infinite;
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
`,ys=c=>c>=.85?"high":c>=.55?"med":"low",wt=c=>`conf-dot conf-${ys(c)}`,Nn=c=>c==="learned"?{className:"source-badge source-learned",icon:"AI",text:"Learned"}:c==="fuzzy_match"?{className:"source-badge source-ai",icon:"ðŸ”",text:"Matched"}:c==="fuzzy_history"||c==="consignee_pattern"?{className:"source-badge source-history",icon:"ðŸ“Š",text:"History"}:c==="delhivery_pincode"||c==="india_post"||c==="pincode_lookup"||c==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"ðŸ“",text:"Pincode"}:null,Cs=c=>{const p=Math.floor(c/6e4);return p<60?`${p}m`:`${Math.floor(p/60)}h ${p%60}m`};function zs({standalone:c=!1}){var Dt,Je,_t,Ut,Gt,qt,Vt,Ht,Qt,Yt,Kt,Xt,Jt,Zt,en;const{pin:p}=Qn(),S=Yn(),m=!!c,k=`${us}:${m?"direct":p||"unknown"}`,O=s.useMemo(()=>`mobile_scanner_daily_count:${new Date().toISOString().slice(0,10)}`,[]),$=s.useMemo(()=>{try{return typeof window>"u"?"":new URLSearchParams(window.location.search).get("mockBarcodeRaw")||""}catch{return""}},[]),f=s.useMemo(()=>{try{if(typeof window>"u")return!1;const t=new URLSearchParams(window.location.search);return t.get("mock")==="1"||t.get("e2e")==="1"}catch{return!1}},[]),[g,G]=s.useState(null),[b,z]=s.useState("connecting"),[j,u]=s.useState(""),[C,je]=s.useState(i.IDLE),[E,ne]=s.useState(""),[Q,X]=s.useState(null),[fe,se]=s.useState({}),[a,J]=s.useState(null),[h,T]=s.useState({}),[A,M]=s.useState(null),[de,q]=s.useState(null),[xe,be]=s.useState(""),[v,_e]=s.useState([]),[ke,Z]=s.useState(!1),[P,Y]=s.useState(0),[y,ze]=s.useState({ok:!1,issues:[],metrics:null}),[B,Ee]=s.useState({kb:0,width:0,height:0,quality:Ne}),[Re,ye]=s.useState(!1),[rt,it]=s.useState("0m"),[Ce,Te]=s.useState("Connected"),[Me,St]=s.useState(""),[ot,kn]=s.useState(!1),[vt,at]=s.useState("idle"),[re,En]=s.useState(null),[Rn,Fn]=s.useState(0),[ct,In]=s.useState(0),[Nt,lt]=s.useState(null),[we,dt]=s.useState("barcode"),[R,ut]=s.useState(()=>{if(typeof window>"u")return"fast";try{const t=localStorage.getItem(fn);if(t==="fast"||t==="ocr")return t}catch{}return f?"ocr":"fast"}),[_,jt]=s.useState(()=>{if(typeof window>"u")return H.phone;try{const t=localStorage.getItem(xn);if(t===H.phone||t===H.rugged)return t}catch{}return H.phone}),pt=s.useRef(0),[W,mt]=s.useState({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now(),scannedItems:[]}),[Ue,An]=s.useState(!1),V=s.useRef(null),Ge=s.useRef(null),ue=s.useRef(null),pe=s.useRef(null),me=s.useRef(!1),qe=s.useRef(null),zn=s.useRef(!1),ae=s.useRef(i.IDLE),Ve=s.useRef(null),We=s.useRef(0),Se=s.useRef(null),kt=s.useRef(new Set),Oe=s.useRef([]),He=s.useRef({awb:"",hits:0,lastSeenAt:0}),Et=s.useRef(0),Be=s.useRef(!1),Rt=s.useRef(0),Qe=s.useRef(null),ht=s.useRef({message:"",at:0}),ie=s.useRef({lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]}),he=s.useRef(null),l=s.useCallback(t=>{je(t)},[]),U=s.useCallback(t=>{pt.current=t,Fn(t)},[]),K=s.useCallback(t=>{Et.current=t,In(t)},[]),gt=s.useCallback((t,n="warning")=>{if(!t)return;const o=Date.now();ht.current.message===t&&o-ht.current.at<fs||(ht.current={message:t,at:o},u(t),n&&w(n))},[]),Ft=s.useCallback(t=>{U(0),K(0),dt("document"),u(t||'No barcode lock yet. Capture label instead or tap "Back to barcode mode" and hold steady.'),w("warning")},[U,K]),Ye=s.useCallback(()=>{const t=cs({currentAttempts:Et.current,maxReframeAttempts:tt});if(t.action==="reframe"){K(t.attempts),U(0),u(`No lock yet. Reframe ${t.attempts}/${tt}: move closer, reduce glare, keep barcode horizontal.`),w("retry");return}Ft("No stable barcode lock after reframe retries. Capture label for OCR fallback.")},[Ft,U,K]),Tn=s.useCallback(()=>{ne(""),u(""),l(i.CAPTURING)},[l]),It=s.useCallback(t=>{const n=Date.now(),o=as({samples:Oe.current,awb:t,now:n,stabilityWindowMs:ms,requiredHits:hs});return Oe.current=o.samples,He.current={awb:t,hits:o.hits,lastSeenAt:n},o.isStable},[]),ce=s.useCallback(async()=>{var o;if(!vn())throw new Error("Camera requires HTTPS (or localhost). Open this page over https:// on your phone.");if(!((o=navigator==null?void 0:navigator.mediaDevices)!=null&&o.getUserMedia))throw new Error("Camera not supported on this browser/device.");if(!V.current)throw new Error("Camera element not ready.");const t=V.current.srcObject;if(t&&typeof t.getTracks=="function"&&t.getTracks().some(I=>I.readyState==="live")){await V.current.play();return}let n=null;try{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}V.current.srcObject=n,await V.current.play()},[]);s.useEffect(()=>{const t=setInterval(()=>it(Cs(Date.now()-W.startedAt)),3e4);return()=>clearInterval(t)},[W.startedAt]);const Pe=s.useCallback(t=>{_e(t);try{t.length?localStorage.setItem(k,JSON.stringify(t)):localStorage.removeItem(k)}catch{}},[k]),Fe=s.useCallback(t=>{const n={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:t};return Pe([...v,n]),n},[v,Pe]),At=s.useCallback(async t=>{if(String((t==null?void 0:t.scanMode)||"").toLowerCase()==="fast_barcode_only"){await ve.post("/shipments/scan",{awb:t.awb,courier:"AUTO",captureOnly:!0});return}await ve.post("/shipments/scan-mobile",{awb:t.awb,imageBase64:t.imageBase64,focusImageBase64:t.focusImageBase64||t.imageBase64,sessionContext:t.sessionContext||{}})},[]),Le=s.useCallback(async()=>{var t;if(v.length){if(m){if(!navigator.onLine)return;const n=[];for(const o of v)if((t=o==null?void 0:o.payload)!=null&&t.awb)try{await At(o.payload)}catch{n.push(o)}Pe(n),n.length?u(`Uploaded partially. ${n.length} scan(s) still queued.`):u("");return}!g||!g.connected||(v.forEach(n=>{var o;(o=n==null?void 0:n.payload)!=null&&o.awb&&g.emit("scanner:scan",n.payload)}),Pe([]))}},[m,g,v,Pe,At]),L=s.useCallback(t=>{mt(n=>{const o={...n,scannedItems:[{...t,time:Date.now()},...n.scannedItems]};try{localStorage.setItem(O,String(o.scanNumber))}catch{}return o})},[O]),Mn=s.useCallback(()=>{if(b!=="paired"){u(m?"Scanner is offline. Reconnect internet and retry.":"Phone is not connected to the desktop session.");return}if(u(""),f){l(i.SCANNING);return}ce().then(()=>l(i.SCANNING)).catch(t=>u((t==null?void 0:t.message)||"Camera access failed."))},[b,ce,l,f,m]),Wn=s.useCallback(t=>{t==null||t.preventDefault();const n=Me.trim().toUpperCase();if(!n||n.length<6){u("Enter a valid AWB number (min 6 chars)");return}if(b!=="paired"){u(m?"Scanner is offline. Reconnect internet and retry.":"Not connected to desktop session.");return}if(u(""),St(""),ne(n),f){ye(!0),l(i.CAPTURING);return}ce().then(()=>l(i.CAPTURING)).catch(o=>u((o==null?void 0:o.message)||"Camera access failed."))},[Me,b,ce,l,f,m]),On=s.useCallback(()=>{if(window.confirm(m?"Exit this scanner session on the phone?":"End this mobile scanner session on the phone?")){if(m){S("/app/scan");return}g!=null&&g.connected?g.emit("scanner:end-session",{reason:"Mobile ended the session"}):S("/")}},[g,S,m]),Bn=s.useCallback(()=>{if(v.length>0){Le();return}window.alert(m?"No queued scans to upload.":"Everything is already synced.")},[v.length,Le,m]);s.useEffect(()=>{ae.current=C},[C]),s.useEffect(()=>{if(f){z("paired"),Te("Mock Mode"),u(""),l(i.IDLE);return}if(m){G(null),z("paired"),Te("Direct Mode"),u(""),l(i.IDLE);return}if(!p){u("No PIN provided.");return}const t=qn(ls,{auth:{scannerPin:p},transports:["websocket","polling"],reconnection:!0,reconnectionDelay:1500,reconnectionAttempts:20});return t.on("connect",()=>z("connecting")),t.on("scanner:paired",({userEmail:n})=>{z("paired"),Te(n?n.split("@")[0]:"Connected"),u("");const o=ae.current;o===i.PROCESSING||o===i.REVIEWING||o===i.APPROVING||o===i.SUCCESS||l(i.IDLE)}),t.on("scanner:error",({message:n})=>{u(n),z("disconnected")}),t.on("scanner:session-ended",({reason:n})=>{z("disconnected"),u(n||"Session ended by desktop."),S("/")}),t.on("disconnect",()=>z("disconnected")),t.on("reconnect",()=>{const n=ae.current;if(n===i.PROCESSING||n===i.REVIEWING||n===i.APPROVING||n===i.SUCCESS){z("paired");return}z("paired"),l(i.SCANNING)}),t.on("scanner:scan-processed",n=>{const o=ae.current;if(!(o!==i.PROCESSING&&o!==i.REVIEWING)){if(n.status==="error"){if(o!==i.PROCESSING)return;q("error"),te(),w("error"),l(i.ERROR),u(n.error||"Scan failed on desktop.");return}if(J(n),T({clientCode:n.clientCode||"",consignee:n.consignee||"",destination:n.destination||"",pincode:n.pincode||"",weight:n.weight||0,amount:n.amount||0,orderNo:n.orderNo||""}),se({}),n.reviewRequired)l(i.REVIEWING);else{le(),w("success");const d={awb:n.awb,clientCode:n.clientCode,clientName:n.clientName,destination:n.destination||"",weight:n.weight||0};M(d),L(d),l(i.SUCCESS)}}}),t.on("scanner:approval-result",({success:n,message:o,awb:d})=>{if(n){le(),w("success"),q("success");const I={awb:(a==null?void 0:a.awb)||d,clientCode:h.clientCode,clientName:(a==null?void 0:a.clientName)||h.clientCode,destination:h.destination||"",weight:parseFloat(h.weight)||0};M(I),L(I),l(i.SUCCESS)}else te(),w("error"),u(o||"Approval failed.")}),t.on("scanner:ready-for-next",()=>{}),G(t),()=>{t.disconnect()}},[p,L,a,h,l,S,f,m]),s.useEffect(()=>{try{const t=localStorage.getItem(k);if(!t)return;const n=JSON.parse(t);Array.isArray(n)&&n.length&&_e(n)}catch{}},[k]),s.useEffect(()=>{try{localStorage.setItem(fn,R)}catch{}},[R]),s.useEffect(()=>{try{localStorage.setItem(xn,_)}catch{}},[_]),s.useEffect(()=>{if(v.length){if(m){b==="paired"&&navigator.onLine&&Le();return}b==="paired"&&(g!=null&&g.connected)&&Le()}},[b,g,v.length,Le,m]);const Ie=s.useCallback(async()=>{var t;try{if(ye(!1),he.current&&he.current.stop(),pe.current){try{const n=pe.current;n!=null&&n.barcodeScanner&&await n.barcodeScanner.dispose()}catch{}pe.current=null}if(ue.current){try{await ue.current.reset()}catch{}ue.current=null}(t=V.current)!=null&&t.srcObject&&(V.current.srcObject.getTracks().forEach(n=>n.stop()),V.current.srcObject=null)}catch{}},[]),Ae=s.useCallback(async()=>{try{if(at("idle"),he.current&&he.current.stop(),pe.current){try{await pe.current.barcodeScanner.dispose()}catch{}pe.current=null}if(ue.current){try{ue.current._type==="native"?ue.current.reset():await ue.current.reset()}catch{}ue.current=null}}catch{}},[]),zt=s.useCallback(async()=>{if(V.current){await Ae();try{We.current=Date.now(),await ce(),he.current||(he.current=Vn()),await he.current.start(V.current,Ge.current,{onDetected:(t,n)=>{var I;if(me.current)return;U(0);const o=(n==null?void 0:n.format)||"unknown",d=(n==null?void 0:n.engine)||"unknown";En({value:t,format:o,engine:d,at:Date.now(),sinceStartMs:We.current?Date.now()-We.current:null,candidateCount:(n==null?void 0:n.candidateCount)||1,ambiguous:!1,alternatives:(n==null?void 0:n.alternatives)||[]}),at(d),(I=Se.current)==null||I.call(Se,t,{candidateCount:(n==null?void 0:n.candidateCount)||1,ambiguous:!1,alternatives:(n==null?void 0:n.alternatives)||[],format:o,engine:d})},onFail:()=>{const t=pt.current+1;U(t),t>=bn&&Ye()},onEngineReady:t=>{console.log(`[MobileScanner] Barcode engine ready: ${t}`),at(t)}})}catch(t){u("Camera access failed: "+t.message)}}},[ce,Ae,Ye,U]),Tt=s.useCallback((t,n={})=>{var x;const o=String(t||"").trim().replace(/\s+/g,"").toUpperCase(),d=Hn(t)||o;if(me.current||ae.current!==i.SCANNING)return;if(!d||d.length<8){o.replace(/[^A-Z0-9]/g,"").length>=4&&gt("Partial barcode detected. Move closer so full AWB is visible.");return}if(n!=null&&n.ambiguous){const N=pt.current+1;U(N),gt("Multiple barcodes detected. Keep only the AWB barcode inside the strip.","retry"),N>=bn&&Ye();return}if(!f&&!It(d))return;if(me.current=!0,kt.current.has(d)){w("duplicate"),te(),be(d),setTimeout(()=>{be(""),me.current=!1,He.current={awb:"",hits:0,lastSeenAt:0},Oe.current=[]},2500);return}clearTimeout(Ve.current),w("lock"),wn(),ne(d);const I=We.current?Date.now()-We.current:null;if(lt(I),ie.current={lockTimeMs:I,candidateCount:Number((n==null?void 0:n.candidateCount)||1),ambiguous:!!(n!=null&&n.ambiguous),alternatives:Array.isArray(n==null?void 0:n.alternatives)?n.alternatives.slice(0,3):[]},K(0),U(0),u(""),mt(N=>{const D={...N,scanNumber:N.scanNumber+1};return D.scannedAwbs=new Set(N.scannedAwbs),D.scannedAwbs.add(d),kt.current=D.scannedAwbs,D}),R==="fast"){(x=Qe.current)==null||x.call(Qe,d);return}Ve.current=setTimeout(()=>{ae.current===i.SCANNING&&l(i.CAPTURING)},ps)},[l,It,R,f,U,K,gt,Ye]);s.useEffect(()=>{Se.current=Tt},[Tt]),s.useEffect(()=>{if(C===i.SCANNING&&(me.current=!1,He.current={awb:"",hits:0,lastSeenAt:0},Oe.current=[],ie.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},lt(null),K(0),U(0),dt("barcode"),zt(),f&&$)){const t=setTimeout(()=>{var n;ae.current===i.SCANNING&&((n=Se.current)==null||n.call(Se,$))},50);return()=>clearTimeout(t)}return()=>{C===i.SCANNING&&Ae()}},[C,zt,Ae,U,K,f,$]);const Mt=s.useCallback(async()=>{if(f){ye(!0);return}await Ae();try{await ce(),ye(!0)}catch(t){u("Camera access failed: "+t.message)}},[ce,Ae,f]);s.useEffect(()=>{C===i.CAPTURING&&Mt()},[C,Mt]);const Ke=s.useCallback(()=>{const t=V.current,n=Ge.current;return os(t,n)},[]);s.useEffect(()=>{if(C!==i.CAPTURING){Z(!1),Y(0),ze({ok:!1,issues:[],metrics:null}),zn.current=!1,Be.current=!1;return}const t=setInterval(()=>{const n=Ke();n&&(ze(n),Z(n.ok),Y(o=>{const d=n.ok?Math.min(o+1,8):0;return d>=Ct&&!Be.current&&(w("tap"),Be.current=!0),n.ok||(Be.current=!1),d}))},280);return()=>clearInterval(t)},[C,Ke]);const Wt=s.useCallback((t={})=>{const n=V.current,o=Ge.current;if(!n||!o||!n.videoWidth)return null;const d=jn(n,o);if(!d)return null;const I=d.x,x=d.y,N=d.w,D=d.h;if(!N||!D)return null;const Ze=Math.max(640,Number(t.maxWidth||yn)),De=Math.min(.85,Math.max(.55,Number(t.quality||Ne))),ee=document.createElement("canvas");ee.width=Math.min(Ze,Math.round(N)),ee.height=Math.round(ee.width/N*D),ee.getContext("2d").drawImage(n,I,x,N,D,0,0,ee.width,ee.height);const ft=ee.toDataURL("image/jpeg",De).split(",")[1]||"";if(!ft)return null;const Gn=Math.floor(ft.length*3/4);return{base64:ft,width:ee.width,height:ee.height,approxBytes:Gn,quality:De}},[]),Pn=s.useCallback(()=>{const t=Date.now();if(t-Rt.current<gs)return;Rt.current=t;const n=Ke()||y;if(!(n!=null&&n.ok)||P<Ct){u(pn(n==null?void 0:n.issues)||"Capture quality is low. Hold steady and align the AWB in the frame."),w("warning"),te();return}q("white"),wn(),w("tap");const o=Wt({maxWidth:yn,quality:Ne});if(!(o!=null&&o.base64)){u("Could not capture image. Try again."),me.current=!1;return}Ee({kb:Math.round((o.approxBytes||0)/1024),width:o.width||0,height:o.height||0,quality:o.quality||Ne}),X(`data:image/jpeg;base64,${o.base64}`),Ie(),l(i.PREVIEW)},[Wt,Ie,l,Ke,y,P]),Ln=s.useCallback(()=>{if(!f)return;const t="data:image/jpeg;base64,ZmFrZS1tb2NrLWltYWdl";Ee({kb:0,width:0,height:0,quality:Ne}),X(t),Ie(),l(i.PREVIEW)},[l,f,Ie]),Xe=s.useCallback(()=>{var t,n,o;return{scanNumber:W.scanNumber,recentClient:W.dominantClient,dominantClient:W.dominantClient,dominantClientCount:W.dominantClientCount,sessionDurationMin:Math.round((Date.now()-W.startedAt)/6e4),scanWorkflowMode:R,scanMode:we,deviceProfile:_,hardwareClass:_===H.rugged?"rugged":"phone",captureQuality:{ok:!!y.ok,issues:Array.isArray(y.issues)?y.issues.slice(0,8):[],metrics:y.metrics||null},captureMeta:{kb:B.kb||0,width:B.width||0,height:B.height||0,quality:B.quality||Ne},lockTimeMs:Number.isFinite(Number((t=ie.current)==null?void 0:t.lockTimeMs))?Number(ie.current.lockTimeMs):null,lockCandidateCount:Number.isFinite(Number((n=ie.current)==null?void 0:n.candidateCount))?Number(ie.current.candidateCount):1,lockAlternatives:Array.isArray((o=ie.current)==null?void 0:o.alternatives)?ie.current.alternatives.slice(0,3):[]}},[W,R,we,_,y,B]),Ot=s.useCallback(async t=>{var d,I;const n=String(t||"").trim().toUpperCase();if(!n)return;if(l(i.PROCESSING),f){setTimeout(()=>{const x={awb:n,clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25};M(x),L(x),l(i.SUCCESS)},120);return}const o={awb:n,imageBase64:null,focusImageBase64:null,scanMode:"fast_barcode_only",sessionContext:Xe()};if(m){if(!navigator.onLine){Fe(o),le(),w("success");const x={awb:n,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};M({...x,offlineQueued:!0}),L(x),l(i.SUCCESS);return}try{const x=await ve.post("/shipments/scan",{awb:n,courier:"AUTO",captureOnly:!0}),N=((d=x==null?void 0:x.data)==null?void 0:d.shipment)||{},D={awb:N.awb||n,clientCode:N.clientCode||"MISC",clientName:((I=N.client)==null?void 0:I.company)||N.clientCode||"Scanned",destination:N.destination||"",weight:N.weight||0};M(D),L(D),le(),w("success"),l(i.SUCCESS)}catch(x){u((x==null?void 0:x.message)||"Barcode processing failed. Please try again."),te(),w("error"),l(i.ERROR)}return}if(!g||!g.connected||b!=="paired"){Fe(o),le(),w("success");const x={awb:n,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};M({...x,offlineQueued:!0}),L(x),l(i.SUCCESS);return}g.emit("scanner:scan",o),setTimeout(()=>{ae.current===i.PROCESSING&&(u("Barcode processing timed out. Please try scanning again."),te(),w("error"),l(i.ERROR))},ds)},[g,b,l,f,Fe,L,Xe,m]);s.useEffect(()=>{Qe.current=Ot},[Ot]);const $n=s.useCallback(async()=>{if(!Q)return;if(l(i.PROCESSING),f){setTimeout(()=>{const o={awb:E||"100454974120",clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25};M(o),L(o),l(i.SUCCESS)},250);return}const t=Q.split(",")[1]||Q,n={awb:E||"",imageBase64:t,focusImageBase64:t,scanMode:"ocr_label",sessionContext:Xe()};if(m){if(!navigator.onLine){Fe(n),le(),w("success");const o={awb:E||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};M({...o,offlineQueued:!0}),L(o),l(i.SUCCESS);return}try{const o=await ve.post("/shipments/scan-mobile",n),d=(o==null?void 0:o.data)||o;if(d.status==="error"||!d.success){q("error"),te(),w("error"),l(i.ERROR),u(d.error||d.message||"Scan failed.");return}if(J(d),T({clientCode:d.clientCode||"",consignee:d.consignee||"",destination:d.destination||"",pincode:d.pincode||"",weight:d.weight||0,amount:d.amount||0,orderNo:d.orderNo||""}),se({}),d.reviewRequired)l(i.REVIEWING);else{le(),w("success");const I={awb:d.awb,clientCode:d.clientCode,clientName:d.clientName,destination:d.destination||"",weight:d.weight||0};M(I),L(I),l(i.SUCCESS)}}catch(o){u((o==null?void 0:o.message)||"Server error. Please try again."),te(),w("error"),l(i.ERROR)}return}if(!g||!g.connected||b!=="paired"){Fe(n),le(),w("success");const o={awb:E||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};M({...o,offlineQueued:!0}),L(o),l(i.SUCCESS);return}g.emit("scanner:scan",n),setTimeout(()=>{ae.current===i.PROCESSING&&(u("OCR timed out after 40 seconds. Retake the label photo and try again."),te(),w("error"),l(i.ERROR))},4e4)},[g,E,Q,l,b,Fe,L,f,Xe,m]),Dn=s.useCallback(async()=>{var I;if(!a)return;l(i.APPROVING);let t=!m;if(f){setTimeout(()=>{const x={awb:a.awb||E,clientCode:h.clientCode||"MOCKCL",clientName:a.clientName||h.clientCode||"Mock Client",destination:h.destination||"",weight:parseFloat(h.weight)||0};M(x),L(x),q("success"),t=!0,l(i.SUCCESS)},200);return}const n={clientCode:a.clientCode||"",clientName:a.clientName||"",consignee:a.consignee||"",destination:a.destination||""},o={clientCode:h.clientCode||"",clientName:h.clientCode||"",consignee:h.consignee||"",destination:h.destination||""},d={clientCode:h.clientCode,consignee:h.consignee,destination:h.destination,pincode:h.pincode,weight:parseFloat(h.weight)||0,amount:parseFloat(h.amount)||0,orderNo:h.orderNo||""};if(m)try{(a.ocrExtracted||a)&&await ve.post("/shipments/learn-corrections",{ocrFields:n,approvedFields:o}),a.shipmentId?await ve.put(`/shipments/${a.shipmentId}`,d):await ve.post("/shipments",{awb:a.awb||E,...d}),le(),w("success"),q("success");const x={awb:(a==null?void 0:a.awb)||E,clientCode:h.clientCode,clientName:(a==null?void 0:a.clientName)||h.clientCode,destination:h.destination||"",weight:parseFloat(h.weight)||0};M(x),L(x),t=!0,l(i.SUCCESS)}catch(x){l(i.REVIEWING),te(),w("error"),u((x==null?void 0:x.message)||"Approval failed.")}else{if(!g){l(i.REVIEWING),u("Not connected to desktop session.");return}(a.ocrExtracted||a)&&g.emit("scanner:learn-corrections",{pin:p,ocrFields:n,approvedFields:o,courier:(a==null?void 0:a.courier)||((I=a==null?void 0:a.ocrExtracted)==null?void 0:I.courier)||"",deviceProfile:_}),g.emit("scanner:approval-submit",{shipmentId:a.shipmentId,awb:a.awb||E,fields:d},x=>{x!=null&&x.success||(l(i.REVIEWING),te(),w("error"),u((x==null?void 0:x.message)||"Approval failed."))})}t&&h.clientCode&&h.clientCode!=="MISC"&&mt(x=>{var Ze,De;const N={...x.clientFreq};N[h.clientCode]=(N[h.clientCode]||0)+1;const D=Object.entries(N).sort((ee,tn)=>tn[1]-ee[1]);return{...x,clientFreq:N,dominantClient:((Ze=D[0])==null?void 0:Ze[1])>=2?D[0][0]:null,dominantClientCount:((De=D[0])==null?void 0:De[1])||0}})},[g,a,h,E,p,l,L,f,_,m]),$e=s.useCallback((t=i.IDLE)=>{clearTimeout(qe.current),clearTimeout(Ve.current),ne(""),X(null),Ee({kb:0,width:0,height:0,quality:Ne}),J(null),T({}),se({}),M(null),lt(null),u(""),be(""),Z(!1),Y(0),ze({ok:!1,issues:[],metrics:null}),me.current=!1,He.current={awb:"",hits:0,lastSeenAt:0},Oe.current=[],ie.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},Be.current=!1,K(0),l(t)},[l,K]);s.useEffect(()=>{if(C===i.SUCCESS){const t=R==="fast"?i.SCANNING:i.IDLE,n=R==="fast"?gn:hn;return qe.current=setTimeout(()=>$e(t),n),()=>clearTimeout(qe.current)}},[C,$e,R]),s.useEffect(()=>{if(Ue)if(C===i.REVIEWING&&a){const t=[a.clientName||a.clientCode,a.destination,a.weight?`${a.weight} kilograms`:""].filter(Boolean);t.length&&Sn(t.join(". "))}else C===i.SUCCESS&&A&&Sn(`${A.clientName||A.clientCode||"Shipment"} Verified.`)},[Ue,C,a,A]),s.useEffect(()=>()=>{Ie(),clearTimeout(qe.current),clearTimeout(Ve.current)},[Ie]);const oe=t=>`msp-step ${C===t?"active":""}`,Bt=Math.max(1,Math.round((R==="fast"?gn:hn)/1e3)),_n=y.ok?"AWB quality looks good - press shutter":pn(y.issues)||"Fit AWB slip fully in frame and hold steady",Pt=Re&&y.ok&&P>=Ct,ge=s.useMemo(()=>{if(!a)return{};const t=a.ocrExtracted||a;return{clientCode:{confidence:(t==null?void 0:t.clientNameConfidence)||0,source:(t==null?void 0:t.clientNameSource)||null},consignee:{confidence:(t==null?void 0:t.consigneeConfidence)||0,source:(t==null?void 0:t.consigneeSource)||null},destination:{confidence:(t==null?void 0:t.destinationConfidence)||0,source:(t==null?void 0:t.destinationSource)||null},pincode:{confidence:(t==null?void 0:t.pincodeConfidence)||0,source:null},weight:{confidence:(t==null?void 0:t.weightConfidence)||0,source:null}}},[a]),Lt=W.scannedItems.reduce((t,n)=>t+(n.weight||0),0),F=((Dt=a==null?void 0:a.ocrExtracted)==null?void 0:Dt.intelligence)||(a==null?void 0:a.intelligence)||null,$t=(Ut=(_t=(Je=he.current)==null?void 0:Je.getDiagnostics)==null?void 0:_t.call(Je))==null?void 0:Ut.wasmFailReason,Un=[["Step",C],["Connection",b],["Engine",vt],...$t?[["WASM Error",$t]]:[],["Workflow",R],["Device",_],["Scan mode",we],["Fail count",String(Rn)],["Reframe retries",`${ct}/${tt}`],["Camera",Re?"ready":"waiting"],["Doc detect",ke?`yes (${P})`:"no"],["Capture quality",y.ok?"good":y.issues.join(", ")||"pending"],["Capture metrics",y.metrics?`blur ${y.metrics.blurScore} | glare ${y.metrics.glareRatio}% | skew ${y.metrics.perspectiveSkew}%`:"-"],["JPEG last shot",B.kb?`${B.kb}KB ${B.width}x${B.height} q=${B.quality}`:"-"],["Secure ctx",vn()?"yes":"no"],["AWB lock",E||"-"],["Lock ms",Nt!=null?String(Nt):"-"],["Lock candidates",String(((Gt=ie.current)==null?void 0:Gt.candidateCount)||1)],["Queued",String(v.length)],["Scans",String(W.scanNumber)],["Last format",(re==null?void 0:re.format)||"-"],["Last code",(re==null?void 0:re.value)||"-"],["Decode ms",(re==null?void 0:re.sinceStartMs)!=null?String(re.sinceStartMs):"-"],["False-lock",(qt=a==null?void 0:a.scanTelemetry)!=null&&qt.falseLock?"yes":"no"]];return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:bs}),e.jsxs("div",{className:"msp-root",children:[de&&e.jsx("div",{className:`flash-overlay flash-${de}`,onAnimationEnd:()=>q(null)}),xe&&e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[e.jsx(nn,{size:48,color:"white"}),e.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),e.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:xe}),e.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),e.jsx("button",{type:"button","data-testid":"scanner-diag-toggle",onClick:()=>kn(t=>!t),style:{position:"fixed",top:12,right:12,zIndex:70,border:"1px solid rgba(255,255,255,0.18)",background:ot?"rgba(79,70,229,0.92)":"rgba(15,23,42,0.72)",color:"#fff",borderRadius:999,padding:"8px 12px",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.04em",backdropFilter:"blur(10px)",cursor:"pointer"},children:ot?"Hide Diag":"Show Diag"}),ot&&e.jsxs("div",{"data-testid":"scanner-diag-panel",style:{position:"fixed",top:56,right:12,zIndex:69,width:"min(92vw, 320px)",background:"rgba(15,23,42,0.88)",color:"#E5EEF8",border:"1px solid rgba(255,255,255,0.12)",borderRadius:18,padding:14,backdropFilter:"blur(14px)",boxShadow:"0 12px 30px rgba(0,0,0,0.25)"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10,color:"#A5B4FC"},children:"Scanner Diagnostics"}),e.jsx("div",{style:{display:"grid",gap:6},children:Un.map(([t,n])=>e.jsxs("div",{style:{display:"flex",gap:8,justifyContent:"space-between",alignItems:"flex-start",fontSize:"0.76rem"},children:[e.jsx("div",{style:{color:"rgba(226,232,240,0.72)",minWidth:88},children:t}),e.jsx("div",{className:"mono",style:{textAlign:"right",wordBreak:"break-word",maxWidth:180},children:n})]},t))}),e.jsx("div",{style:{marginTop:10,fontSize:"0.68rem",color:"rgba(226,232,240,0.7)",lineHeight:1.4},children:"Use this to verify whether Trackon labels are being decoded as `ITF` and how quickly the first lock happens after scan start."})]}),b!=="paired"&&e.jsx("div",{className:oe(i.IDLE),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:r.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:b==="connecting"?e.jsx(xt,{size:28,color:r.primary,style:{animation:"spin 1s linear infinite"}}):e.jsx(sn,{size:28,color:r.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:b==="connecting"?"Connecting...":"Disconnected"}),e.jsx("div",{style:{fontSize:"0.82rem",color:r.muted},children:j||(m?"Preparing direct scanner session":`Connecting to session ${p}`)})]}),b==="disconnected"&&e.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[e.jsx(xt,{size:16})," Reconnect"]})]})}),e.jsx("video",{ref:V,autoPlay:!0,playsInline:!0,muted:!0,onClick:()=>{ce().catch(t=>{u((t==null?void 0:t.message)||"Camera access failed.")})},style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(C===i.SCANNING||C===i.CAPTURING)&&!pe.current?"block":"none"}}),e.jsx("div",{className:oe(i.IDLE),children:e.jsxs("div",{className:"home-root",children:[e.jsxs("div",{className:"home-header",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16},children:[e.jsxs("button",{onClick:()=>S("/app/scan"),style:{background:"white",border:"1px solid #E2E8F0",padding:"6px 12px",borderRadius:20,fontSize:"0.75rem",fontWeight:600,color:"#475569",display:"flex",alignItems:"center",gap:4,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.02)"},children:[e.jsx(Kn,{size:14})," Go Back"]}),e.jsxs("div",{className:"home-logo-badge",children:[e.jsx(rn,{size:11,color:b==="paired"&&navigator.onLine?"#10B981":"#EF4444"}),Ce]})]}),e.jsx("div",{className:"home-logo-row",children:e.jsxs("div",{className:"home-logo-text",children:[e.jsx("img",{src:"/images/logo.png",alt:"Sea Hawk Logo",style:{height:28,width:"auto",objectFit:"contain",padding:2,background:"white",borderRadius:6,border:"1px solid #E2E8F0"}}),e.jsx("span",{children:"Seahawk Scanner"})]})}),e.jsxs("div",{className:"home-stats-row",children:[e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:W.scanNumber}),e.jsx("div",{className:"home-stat-label",children:"Scanned"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:Lt>0?Lt.toFixed(1):"0"}),e.jsx("div",{className:"home-stat-label",children:"Total kg"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:rt}),e.jsx("div",{className:"home-stat-label",children:"Session"})]})]})]}),e.jsxs("div",{className:"home-scan-section",children:[e.jsxs("div",{className:"home-scan-btn-wrap",children:[e.jsx("div",{className:"home-scan-ring"}),e.jsx("div",{className:"home-scan-ring home-scan-ring2"}),e.jsxs("button",{"data-testid":"start-scan-btn",className:"home-scan-btn",onClick:Mn,children:[e.jsx(bt,{size:34,color:"white"}),e.jsx("span",{className:"home-scan-btn-label",children:"Scan"})]})]}),e.jsx("div",{className:"home-cta-text",children:W.scanNumber===0?"Tap to start your first scan":"Tap to scan next parcel"}),e.jsxs("div",{style:{display:"flex",gap:8,marginTop:14,width:"100%",maxWidth:320},children:[e.jsxs("button",{type:"button","data-testid":"workflow-fast-btn",onClick:()=>ut("fast"),style:{flex:1,borderRadius:999,border:`1px solid ${R==="fast"?r.primary:r.border}`,background:R==="fast"?r.primaryLight:r.surface,color:R==="fast"?r.primary:r.muted,fontWeight:700,fontSize:"0.72rem",padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(on,{size:13})," Fast scan"]}),e.jsxs("button",{type:"button","data-testid":"workflow-ocr-btn",onClick:()=>ut("ocr"),style:{flex:1,borderRadius:999,border:`1px solid ${R==="ocr"?r.primary:r.border}`,background:R==="ocr"?r.primaryLight:r.surface,color:R==="ocr"?r.primary:r.muted,fontWeight:700,fontSize:"0.72rem",padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(yt,{size:13})," OCR label"]})]}),e.jsxs("div",{style:{display:"flex",gap:8,marginTop:8,width:"100%",maxWidth:320},children:[e.jsxs("button",{type:"button","data-testid":"device-profile-phone-btn",onClick:()=>jt(H.phone),style:{flex:1,borderRadius:999,border:`1px solid ${_===H.phone?r.primary:r.border}`,background:_===H.phone?r.primaryLight:r.surface,color:_===H.phone?r.primary:r.muted,fontWeight:700,fontSize:"0.7rem",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(bt,{size:13})," Phone lens"]}),e.jsxs("button",{type:"button","data-testid":"device-profile-rugged-btn",onClick:()=>jt(H.rugged),style:{flex:1,borderRadius:999,border:`1px solid ${_===H.rugged?r.primary:r.border}`,background:_===H.rugged?r.primaryLight:r.surface,color:_===H.rugged?r.primary:r.muted,fontWeight:700,fontSize:"0.7rem",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(Xn,{size:13})," Rugged"]})]}),e.jsxs("form",{onSubmit:Wn,style:{width:"100%",maxWidth:300,marginTop:20},children:[e.jsx("div",{style:{fontSize:"0.62rem",fontWeight:700,color:r.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6,textAlign:"center"},children:"Can't scan? Enter AWB manually"}),e.jsxs("div",{style:{display:"flex",gap:6},children:[e.jsx("input",{"data-testid":"manual-awb-input",value:Me,onChange:t=>St(t.target.value.toUpperCase()),placeholder:"e.g. 1234567890",inputMode:"text",autoCapitalize:"characters",style:{flex:1,padding:"9px 12px",border:`1.5px solid ${r.border}`,borderRadius:10,fontFamily:"JetBrains Mono, monospace",fontSize:"0.82rem",fontWeight:600,background:r.surface,color:r.text,outline:"none"},onFocus:t=>t.target.style.borderColor=r.primary,onBlur:t=>t.target.style.borderColor=r.border}),e.jsx("button",{type:"submit","data-testid":"manual-awb-submit",disabled:Me.trim().length<6,className:"btn btn-primary",style:{padding:"9px 14px",fontSize:"0.78rem",borderRadius:10,opacity:Me.trim().length>=6?1:.45},children:"Go â†’"})]})]}),e.jsxs("div",{className:"action-buttons-row",children:[e.jsxs("button",{className:"action-btn",onClick:Bn,children:[e.jsx(Jn,{size:14})," ",v.length>0?`Upload (${v.length})`:"Synced"]}),e.jsxs("button",{className:"action-btn danger",onClick:On,children:[e.jsx(Zn,{size:14})," End Session"]})]}),v.length>0&&e.jsxs("div",{style:{marginTop:14,fontSize:"0.7rem",color:r.warning,fontWeight:600,display:"flex",alignItems:"center",gap:5},children:[e.jsx(an,{size:12})," ",v.length," offline scan",v.length>1?"s":""," pending sync"]})]}),e.jsxs("div",{className:"home-queue-section",children:[e.jsxs("div",{className:"home-queue-head",children:[e.jsxs("div",{className:"home-queue-title-text",children:[e.jsx(es,{size:11}),"Accepted Consignments"]}),W.scannedItems.length>0&&e.jsx("div",{className:"home-queue-badge",children:W.scannedItems.length})]}),e.jsx("div",{className:"home-queue-list",children:W.scannedItems.length===0?e.jsxs("div",{className:"queue-empty",children:[e.jsx(cn,{size:36,color:"rgba(255,255,255,0.12)"}),e.jsxs("div",{className:"queue-empty-text",children:["No consignments scanned yet.",e.jsx("br",{}),"Tap the button above to begin."]})]}):W.scannedItems.map((t,n)=>e.jsxs("div",{className:"queue-item",children:[e.jsx("div",{className:"queue-check",children:e.jsx(ln,{size:13,color:"#10B981"})}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{className:"queue-awb",children:t.awb}),e.jsxs("div",{className:"queue-meta",children:[t.clientCode==="OFFLINE"?e.jsx("span",{className:"queue-offline-tag",children:"Offline"}):t.clientCode&&e.jsx("span",{className:"queue-client-tag",children:t.clientCode}),t.destination&&e.jsx("span",{children:t.destination})]})]}),t.weight>0&&e.jsxs("div",{className:"queue-weight",children:[t.weight,"kg"]})]},`${t.awb}-${n}`))})]})]})}),e.jsx("div",{className:oe(i.SCANNING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[e.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:pe.current?"block":"none"}}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{className:"scan-guide",style:we==="barcode"?{width:mn.w,height:mn.h,borderRadius:10,maxHeight:"20vw",transition:"all 0.4s ease",borderColor:j?"rgba(248,113,113,0.92)":void 0,boxShadow:j?"0 0 0 3px rgba(248,113,113,0.2)":void 0}:{width:et.w,height:et.h,borderRadius:14,maxHeight:"75vh",transition:"all 0.4s ease",borderColor:"rgba(251,191,36,0.85)",boxShadow:"0 0 0 3px rgba(251,191,36,0.2)"},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"}),we==="barcode"&&e.jsx("div",{className:"scan-laser"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(rn,{size:12})," ",m?"DIRECT":p]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[we==="document"&&e.jsxs("div",{className:"cam-hud-chip",style:{background:"rgba(251,191,36,0.22)",color:"#FDE68A",fontWeight:700,fontSize:"0.65rem",gap:4},children:[e.jsx(dn,{size:11})," LABEL MODE"]}),e.jsxs("div",{className:"cam-hud-chip",style:{gap:4},children:[e.jsx(cn,{size:12})," ",W.scanNumber,vt==="native"?e.jsx("span",{style:{color:"#34D399",fontSize:"0.6rem",fontWeight:800},children:"⚡ NATIVE"}):e.jsx("span",{style:{color:"#F59E0B",fontSize:"0.6rem",fontWeight:800},children:"ZXING"})]})]})]}),e.jsxs("div",{className:"cam-bottom",children:[we==="barcode"?e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:6,color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:[e.jsx("div",{children:R==="fast"?"Align barcode inside the strip - auto-save on lock":"Align barcode inside the strip - camera opens for label capture after lock"}),ct>0&&e.jsxs("div",{style:{color:"#FDE68A",fontSize:"0.74rem",fontWeight:700},children:["Reframe retry ",ct,"/",tt]}),!!j&&e.jsx("div",{style:{color:"#FCA5A5",fontSize:"0.72rem",fontWeight:700},children:j})]}):e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:6},children:[e.jsx("div",{style:{color:"rgba(251,191,36,0.95)",fontSize:"0.82rem",fontWeight:700,textAlign:"center"},children:"No barcode found - capture the label and we will read the printed AWB"}),e.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"},children:[e.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:Tn,children:"Capture label instead"}),e.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:()=>{U(0),K(0),u(""),dt("barcode"),w("tap")},children:"Back to barcode mode"})]})]}),e.jsxs("div",{style:{display:"flex",gap:12},children:[e.jsxs("button",{className:"cam-hud-chip",onClick:()=>ut(t=>t==="fast"?"ocr":"fast"),style:{border:"none",cursor:"pointer",gap:5},children:[R==="fast"?e.jsx(on,{size:13}):e.jsx(yt,{size:13}),R==="fast"?"FAST":"OCR"]}),e.jsx("button",{className:"cam-hud-chip",onClick:()=>An(!Ue),style:{border:"none",cursor:"pointer"},children:Ue?e.jsx(ts,{size:14}):e.jsx(ns,{size:14})})]})]})]})}),e.jsx("div",{className:oe(i.CAPTURING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!Re&&e.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[e.jsx(ss,{size:44,color:"#34D399"}),e.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:E||"OCR fallback"}),e.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:E?"Barcode locked - Preparing camera...":"Preparing label capture for printed AWB OCR..."})]}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{ref:Ge,className:`scan-guide ${ke?"detected":""}`,style:{width:et.w,height:et.h,maxHeight:"75vh",borderRadius:12},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[e.jsx(dn,{size:12})," ",E||"OCR AWB capture"]}),v.length>0&&e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(an,{size:12})," ",v.length," queued"]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:ke?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center",transition:"color 0.3s"},children:_n}),y.metrics&&e.jsxs("div",{style:{color:"rgba(255,255,255,0.66)",fontSize:"0.72rem",textAlign:"center"},children:["Blur ",y.metrics.blurScore," | Glare ",y.metrics.glareRatio,"% | Skew ",y.metrics.perspectiveSkew,"%"]}),e.jsx("button",{className:"capture-btn","data-testid":"capture-photo-btn",onClick:Pn,disabled:!Pt,style:{opacity:Pt?1:.4},children:e.jsx("div",{className:"capture-btn-inner"})}),f&&e.jsx("button",{type:"button","data-testid":"mock-capture-btn",onClick:Ln,style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 12px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:"Mock capture"}),e.jsx("button",{style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},onClick:()=>{ne(""),u(""),U(0),K(0),me.current=!1,w("tap"),l(i.SCANNING)},children:"â† Rescan barcode"})]})]})}),e.jsx("div",{className:oe(i.PREVIEW),children:e.jsxs("div",{style:{background:r.bg,display:"flex",flexDirection:"column",height:"100%"},children:[e.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${r.border}`},children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.72rem",color:r.muted,fontWeight:600},children:"CAPTURED"}),e.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:E||"Printed AWB OCR"}),B.kb>0&&e.jsxs("div",{style:{fontSize:"0.68rem",color:r.mutedLight},children:[B.kb,"KB • ",B.width,"×",B.height]})]})}),e.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:Q&&e.jsx("img",{src:Q,alt:"Captured label",className:"preview-img"})}),e.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{X(null),l(i.CAPTURING)},children:[e.jsx(un,{size:16})," Retake"]}),e.jsxs("button",{"data-testid":"use-photo-btn",className:"btn btn-primary",style:{flex:2},onClick:$n,children:[e.jsx(rs,{size:16})," Use Photo"]})]})]})}),e.jsx("div",{className:oe(i.PROCESSING),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16},children:[e.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[e.jsx(yt,{size:22,color:r.primary,style:{animation:"spin 2s linear infinite"}}),e.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:r.primary},children:"Intelligence Engine"})]}),e.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:r.muted},children:E}),e.jsx("div",{style:{fontSize:"0.72rem",color:r.mutedLight,marginTop:6},children:Q?"Reading AWB label with local OCR...":"Saving barcode scan..."})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(t=>e.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:t}),e.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),e.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},t)),e.jsx("div",{style:{textAlign:"center",marginTop:8},children:e.jsx("button",{className:"btn btn-outline",style:{fontSize:"0.75rem",padding:"8px 20px"},onClick:()=>{u("Cancelled by user."),l(i.ERROR)},children:"Cancel"})})]})}),e.jsx("div",{className:oe(i.REVIEWING),children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%"},children:[e.jsxs("div",{style:{padding:"14px 20px",borderBottom:`1px solid ${r.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.65rem",color:r.muted,fontWeight:600},children:"REVIEW EXTRACTION"}),e.jsx("div",{className:"mono",style:{fontSize:"0.95rem",fontWeight:700},children:(a==null?void 0:a.awb)||E})]}),(F==null?void 0:F.learnedFieldCount)>0&&e.jsxs("div",{className:"source-badge source-learned",children:["AI ",F.learnedFieldCount," auto-corrected"]})]}),e.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsxs("div",{className:`field-card ${(((Vt=ge.clientCode)==null?void 0:Vt.confidence)||0)<.55?"warning":""}`,children:[e.jsx("div",{className:wt(((Ht=ge.clientCode)==null?void 0:Ht.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((Qt=ge.clientCode)==null?void 0:Qt.source)&&(()=>{const t=Nn(ge.clientCode.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:h.clientCode||"",onChange:t=>T(n=>({...n,clientCode:t.target.value.toUpperCase()})),placeholder:"Client code"}),((Yt=F==null?void 0:F.clientMatches)==null?void 0:Yt.length)>0&&F.clientNeedsConfirmation&&e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:F.clientMatches.slice(0,3).map(t=>e.jsxs("button",{onClick:()=>T(n=>({...n,clientCode:t.code})),style:{fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:`1px solid ${r.border}`,background:h.clientCode===t.code?r.primaryLight:r.surface,color:r.text,cursor:"pointer",fontFamily:"inherit",fontWeight:500},children:[t.code," (",Math.round(t.score*100),"%)"]},t.code))})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:wt(((Kt=ge.consignee)==null?void 0:Kt.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Consignee"}),e.jsx("input",{className:"field-input",value:h.consignee||"",onChange:t=>T(n=>({...n,consignee:t.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:wt(((Xt=ge.destination)==null?void 0:Xt.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((Jt=ge.destination)==null?void 0:Jt.source)&&(()=>{const t=Nn(ge.destination.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:h.destination||"",onChange:t=>T(n=>({...n,destination:t.target.value.toUpperCase()})),placeholder:"City"}),(F==null?void 0:F.pincodeCity)&&F.pincodeCity!==h.destination&&e.jsxs("button",{onClick:()=>T(t=>({...t,destination:F.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:r.successLight,color:r.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["ðŸ“ Pincode suggests: ",F.pincodeCity]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Pincode"}),e.jsx("input",{className:"field-input",value:h.pincode||"",onChange:t=>T(n=>({...n,pincode:t.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),e.jsx("div",{className:`field-card ${(Zt=F==null?void 0:F.weightAnomaly)!=null&&Zt.anomaly?"warning":""}`,children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Weight (kg)"}),e.jsx("input",{className:"field-input",value:h.weight||"",onChange:t=>T(n=>({...n,weight:t.target.value})),placeholder:"0.0",inputMode:"decimal"}),((en=F==null?void 0:F.weightAnomaly)==null?void 0:en.anomaly)&&e.jsxs("div",{style:{fontSize:"0.6rem",color:r.warning,marginTop:2,fontWeight:500},children:["Warning: ",F.weightAnomaly.warning]})]})})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Amount (â‚¹)"}),e.jsx("input",{className:"field-input",value:h.amount||"",onChange:t=>T(n=>({...n,amount:t.target.value})),placeholder:"0",inputMode:"decimal"})]})}),e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Order No"}),e.jsx("input",{className:"field-input",value:h.orderNo||"",onChange:t=>T(n=>({...n,orderNo:t.target.value})),placeholder:"Optional"})]})})]})]}),e.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${r.border}`,display:"flex",gap:10},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:$e,children:[e.jsx(is,{size:16})," Skip"]}),e.jsxs("button",{"data-testid":"approve-save-btn",className:"btn btn-success btn-lg",style:{flex:2},onClick:Dn,disabled:C===i.APPROVING,children:[C===i.APPROVING?e.jsx(xt,{size:16,style:{animation:"spin 1s linear infinite"}}):e.jsx(ln,{size:16}),C===i.APPROVING?"Saving...":"Approve & Save"]})]})]})}),e.jsx("div",{className:oe(i.APPROVING)}),e.jsx("div",{className:oe(i.SUCCESS),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[e.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:r.success,strokeWidth:"3",className:"success-check-circle"}),e.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:r.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:r.success,marginBottom:4},children:"Saved Successfully"}),e.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700},children:A==null?void 0:A.awb}),(A==null?void 0:A.clientCode)&&e.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:r.primaryLight,color:r.primary,fontSize:"0.78rem",fontWeight:600},children:A.clientName||A.clientCode})]}),e.jsx("div",{style:{fontSize:"0.72rem",color:r.muted},children:A!=null&&A.offlineQueued?`${v.length} queued for sync - Auto-continuing in ${Bt}s`:`#${W.scanNumber} scanned - Auto-continuing in ${Bt}s`}),e.jsxs("button",{"data-testid":"scan-next-btn",className:"btn btn-primary btn-lg btn-full",onClick:()=>$e(R==="fast"?i.SCANNING:i.IDLE),style:{maxWidth:320},children:[e.jsx(bt,{size:18})," ",R==="fast"?"Keep Scanning":"Scan Next Parcel"]})]})}),e.jsx("div",{className:oe(i.ERROR),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:r.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(nn,{size:32,color:r.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:r.error},children:"Scan Error"}),e.jsx("div",{style:{fontSize:"0.82rem",color:r.muted,marginTop:4},children:j})]}),e.jsxs("button",{className:"btn btn-primary",onClick:$e,children:[e.jsx(un,{size:16})," Try Again"]})]})}),b==="disconnected"&&C!==i.IDLE&&e.jsxs("div",{className:"offline-banner",children:[e.jsx(sn,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline â€” Reconnecting... ",v.length?`(${v.length} queued)`:""]})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{zs as default};
