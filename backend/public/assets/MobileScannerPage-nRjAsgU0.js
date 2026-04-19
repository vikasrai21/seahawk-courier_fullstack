import{l as Un,_ as tn}from"./index-MP_6dZPZ.js";import{j as e}from"./page-landing-CREvANXP.js";import{r as s}from"./vendor-helmet-Dwc3L0SQ.js";import{a as ke}from"./page-import-larNtCqj.js";import{r as Gn,n as qn}from"./barcode-yEOY_efB.js";import{c as Vn,u as Hn}from"./vendor-react-DrB23wtn.js";import{b as nn,R as ft,b1 as sn,Y as Qn,aW as rn,aX as xt,Z as an,aH as bt,J as Yn,b2 as Kn,ac as Xn,d as on,a7 as Jn,H as cn,b3 as ln,aQ as dn,b4 as Zn,b5 as es,a4 as ts,a1 as un,p as ns,X as ss}from"./vendor-icons-DyYViWBt.js";import"./page-reconcile-Bz6mdC7g.js";import"./page-rate-calc-DMnFppas.js";function Nn(l,m){var N,h;try{if(!l||!m)return null;const R=Number(l.videoWidth||0),O=Number(l.videoHeight||0);if(!R||!O)return null;const U=(N=l.getBoundingClientRect)==null?void 0:N.call(l),x=(h=m.getBoundingClientRect)==null?void 0:h.call(m);if(!U||!x)return null;const f=Number(U.width||0),H=Number(U.height||0);if(!f||!H)return null;const b=Math.max(f/R,H/O),W=R*b,E=O*b,u=(f-W)/2,v=(H-E)/2,Ee=x.left-U.left,F=x.top-U.top,ie=x.right-U.left,K=x.bottom-U.top,Z=(Ee-u)/b,be=(F-v)/b,re=(ie-u)/b,o=(K-v)/b,ee=(ye,we,k)=>Math.max(we,Math.min(k,ye)),g=ee(Math.min(Z,re),0,R),M=ee(Math.min(be,o),0,O),z=ee(Math.max(Z,re),0,R),B=ee(Math.max(be,o),0,O),he=Math.max(0,z-g),Q=Math.max(0,B-M);return!he||!Q?null:{x:g,y:M,w:he,h:Q}}catch{return null}}function mn(l=[]){if(!l.length)return"";const m=[];return l.includes("blur")&&m.push("hold steady"),l.includes("glare")&&m.push("reduce glare"),l.includes("angle")&&m.push("straighten angle"),l.includes("dark")&&m.push("add light"),l.includes("low_edge")&&m.push("fill frame"),m.length?`Improve capture: ${m.join(", ")}.`:""}function is(l,m){if(!l||!m||!l.videoWidth||!l.videoHeight)return null;const N=Nn(l,m);if(!N)return null;const h=Math.max(0,Math.floor(N.x)),R=Math.max(0,Math.floor(N.y)),O=Math.max(24,Math.floor(N.w)),U=Math.max(24,Math.floor(N.h)),x=128,f=96,H=document.createElement("canvas");H.width=x,H.height=f;const b=H.getContext("2d",{willReadFrequently:!0});if(!b)return null;b.drawImage(l,h,R,Math.min(O,l.videoWidth-h),Math.min(U,l.videoHeight-R),0,0,x,f);const W=b.getImageData(0,0,x,f).data,E=x*f,u=new Float32Array(E);let v=0,Ee=0,F=0;for(let P=0,X=0;P<W.length;P+=4,X+=1){const y=.2126*W[P]+.7152*W[P+1]+.0722*W[P+2];u[X]=y,v+=y,y>=245&&(Ee+=1),y<=24&&(F+=1)}let ie=0,K=0,Z=0,be=0,re=0,o=0;const ee=Math.max(4,Math.floor(f*.15)),g=Math.max(4,Math.floor(x*.15)),M=x;for(let P=1;P<f-1;P+=1)for(let X=1;X<x-1;X+=1){const y=P*M+X,Me=u[y],L=u[y-1],Fe=u[y+1],Ae=u[y-M],Ce=u[y+M],st=Math.abs(Fe-L),it=Math.abs(Ce-Ae),ve=st+it,Be=Math.abs(4*Me-L-Fe-Ae-Ce);ie+=Be,ve>58&&(K+=1),P<=ee&&(Z+=ve),P>=f-ee&&(be+=ve),X<=g&&(re+=ve),X>=x-g&&(o+=ve)}const z=Math.max(1,(x-2)*(f-2)),B=v/E,he=ie/z,Q=K/z,ye=Ee/E,we=F/E,k=Math.abs(Z-be)/Math.max(1,Z+be),Ge=Math.abs(re-o)/Math.max(1,re+o),Re=Math.max(k,Ge),te=[];return he<22&&te.push("blur"),ye>.18&&te.push("glare"),(we>.55||B<40)&&te.push("dark"),Q<.08&&te.push("low_edge"),Re>.62&&te.push("angle"),{ok:te.length===0,issues:te,metrics:{brightness:Number(B.toFixed(1)),blurScore:Number(he.toFixed(1)),glareRatio:Number((ye*100).toFixed(1)),edgeRatio:Number((Q*100).toFixed(1)),perspectiveSkew:Number((Re*100).toFixed(1))}}}function tt(l,m){const N=Number(l);return Number.isFinite(N)&&N>0?N:m}function rs({samples:l=[],awb:m,now:N=Date.now(),stabilityWindowMs:h=1100,requiredHits:R=3}){const O=tt(h,1100),U=Math.max(1,Math.floor(tt(R,3))),x=tt(N,Date.now()),f=String(m||"").trim(),H=Array.isArray(l)?l.filter(E=>(E==null?void 0:E.awb)&&x-((E==null?void 0:E.at)||0)<=O):[];if(!f)return{samples:H,hits:0,isStable:!1};const b=[...H,{awb:f,at:x}],W=b.reduce((E,u)=>u.awb===f?E+1:E,0);return{samples:b,hits:W,isStable:W>=U}}function as({currentAttempts:l=0,maxReframeAttempts:m=2}){const N=Math.max(0,Math.floor(tt(m,2))),h=Math.max(0,Math.floor(Number(l)||0))+1;return h<=N?{action:"reframe",attempts:h}:{action:"switch_to_document",attempts:N}}var os={};const cs=window.location.origin,pn={w:"90vw",h:"18vw"},Ze={w:"92vw",h:"130vw"},hn=3500,gn=900,ls=1e4,ds="mobile_scanner_offline_queue",fn="mobile_scanner_workflow_mode",xn="mobile_scanner_device_profile",us=80,ms=1100,ps=3,yt=160,et=2,wt=45,Ct=2,hs=500,bn=960,je=.68,gs=String(os.VITE_PREFER_ZXING_FOR_TRACKON||"1")!=="0",fs=900,Y={phone:"phone-camera",rugged:"rugged-scanner"},vt=["code_128","code_39","code_93","codabar","ean_13","ean_8","itf","qr_code"],a={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"},xs=l=>{var m;try{(m=navigator==null?void 0:navigator.vibrate)==null||m.call(navigator,l)}catch{}},yn={tap:[20],lock:[24,24,24],success:[18,28,72],warning:[70,50,70],retry:[28,40,28],error:[110,55,110],duplicate:[90,50,90,50,90]},S=(l="tap")=>{xs(yn[l]||yn.tap)},nt=(l,m,N="sine")=>{try{const h=new(window.AudioContext||window.webkitAudioContext),R=h.createOscillator(),O=h.createGain();R.type=N,R.frequency.setValueAtTime(l,h.currentTime),O.gain.setValueAtTime(.12,h.currentTime),O.gain.exponentialRampToValueAtTime(.01,h.currentTime+m),R.connect(O),O.connect(h.destination),R.start(),R.stop(h.currentTime+m)}catch{}},pe=()=>{nt(880,.12),setTimeout(()=>nt(1100,.1),130)},wn=()=>nt(600,.08),se=()=>nt(200,.25,"sawtooth"),Cn=l=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const m=new SpeechSynthesisUtterance(l);m.rate=1.2,m.pitch=1,m.lang="en-IN",window.speechSynthesis.speak(m)}catch{}},vn=()=>{var l;try{if(typeof window>"u")return!1;if(window.isSecureContext)return!0;const m=((l=window.location)==null?void 0:l.hostname)||"";return m==="localhost"||m==="127.0.0.1"}catch{return!1}},i={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",mutedLight:"#9CA3AF",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},bs=`
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
  background: ${i.surface}; border: 1px solid ${i.border};
  border-radius: 12px;
}
.field-card.warning { border-color: ${i.warning}; background: ${i.warningLight}; }
.field-card.error-field { border-color: ${i.error}; background: ${i.errorLight}; }
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

/* â”€â”€ Confidence dot â”€â”€ */
.conf-dot {
  width: 8px; height: 8px; border-radius: 50%;
  flex-shrink: 0; margin-top: 4px;
}
.conf-high { background: ${i.success}; }
.conf-med { background: ${i.warning}; }
.conf-low { background: ${i.error}; }

/* â”€â”€ Source badge â”€â”€ */
.source-badge {
  font-size: 0.6rem; padding: 2px 6px; border-radius: 6px;
  font-weight: 600; display: inline-flex; align-items: center; gap: 3px;
}
.source-learned { background: #F5F3FF; color: #7C3AED; }
.source-ai { background: ${i.primaryLight}; color: ${i.primary}; }
.source-history { background: ${i.warningLight}; color: ${i.warning}; }
.source-pincode { background: ${i.successLight}; color: ${i.success}; }

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
  background: ${i.warningLight}; color: ${i.warning};
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
`,ys=l=>l>=.85?"high":l>=.55?"med":"low",St=l=>`conf-dot conf-${ys(l)}`,Sn=l=>l==="learned"?{className:"source-badge source-learned",icon:"AI",text:"Learned"}:l==="fuzzy_match"?{className:"source-badge source-ai",icon:"ðŸ”",text:"Matched"}:l==="fuzzy_history"||l==="consignee_pattern"?{className:"source-badge source-history",icon:"ðŸ“Š",text:"History"}:l==="delhivery_pincode"||l==="india_post"||l==="pincode_lookup"||l==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"ðŸ“",text:"Pincode"}:null,ws=l=>{const m=Math.floor(l/6e4);return m<60?`${m}m`:`${Math.floor(m/60)}h ${m%60}m`};function Ts({standalone:l=!1}){var Ut,Gt,qt,Vt,Ht,Qt,Yt,Kt,Xt,Jt,Zt,en;const{pin:m}=Vn(),N=Hn(),h=!!l,R=`${ds}:${h?"direct":m||"unknown"}`,O=s.useMemo(()=>`mobile_scanner_daily_count:${new Date().toISOString().slice(0,10)}`,[]),U=s.useMemo(()=>{try{return typeof window>"u"?"":new URLSearchParams(window.location.search).get("mockBarcodeRaw")||""}catch{return""}},[]),x=s.useMemo(()=>{try{if(typeof window>"u")return!1;const t=new URLSearchParams(window.location.search);return t.get("mock")==="1"||t.get("e2e")==="1"}catch{return!1}},[]),[f,H]=s.useState(null),[b,W]=s.useState("connecting"),[E,u]=s.useState(""),[v,Ee]=s.useState(a.IDLE),[F,ie]=s.useState(""),[K,Z]=s.useState(null),[be,re]=s.useState({}),[o,ee]=s.useState(null),[g,M]=s.useState({}),[z,B]=s.useState(null),[he,Q]=s.useState(null),[ye,we]=s.useState(""),[k,Ge]=s.useState([]),[Re,te]=s.useState(!1),[P,X]=s.useState(0),[y,Me]=s.useState({ok:!1,issues:[],metrics:null}),[L,Fe]=s.useState({kb:0,width:0,height:0,quality:je}),[Ae,Ce]=s.useState(!1),[st,it]=s.useState("0m"),[ve,Be]=s.useState("Connected"),[_e,Nt]=s.useState(""),[rt,kn]=s.useState(!1),[kt,at]=s.useState("idle"),[ae,jt]=s.useState(null),[jn,En]=s.useState(0),[ot,Rn]=s.useState(0),[Et,ct]=s.useState(null),[Se,lt]=s.useState("barcode"),[A,dt]=s.useState(()=>{if(typeof window>"u")return"fast";try{const t=localStorage.getItem(fn);if(t==="fast"||t==="ocr")return t}catch{}return x?"ocr":"fast"}),[q,Rt]=s.useState(()=>{if(typeof window>"u")return Y.phone;try{const t=localStorage.getItem(xn);if(t===Y.phone||t===Y.rugged)return t}catch{}return Y.phone}),qe=s.useRef(0),[_,ut]=s.useState({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now(),scannedItems:[]}),[Ve,Fn]=s.useState(!1),V=s.useRef(null),mt=s.useRef(null),oe=s.useRef(null),ge=s.useRef(null),ue=s.useRef(!1),He=s.useRef(null),An=s.useRef(!1),fe=s.useRef(a.IDLE),Qe=s.useRef(null),Ne=s.useRef(0),ce=s.useRef(null),Ft=s.useRef(new Set),Oe=s.useRef([]),Ye=s.useRef({awb:"",hits:0,lastSeenAt:0}),At=s.useRef(0),We=s.useRef(!1),It=s.useRef(0),Ke=s.useRef(null),pt=s.useRef({message:"",at:0}),le=s.useRef({lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]}),d=s.useCallback(t=>{Ee(t)},[]),D=s.useCallback(t=>{qe.current=t,En(t)},[]),J=s.useCallback(t=>{At.current=t,Rn(t)},[]),ht=s.useCallback((t,n="warning")=>{if(!t)return;const r=Date.now();pt.current.message===t&&r-pt.current.at<fs||(pt.current={message:t,at:r},u(t),n&&S(n))},[]),Tt=s.useCallback(t=>{D(0),J(0),lt("document"),u(t||'No barcode lock yet. Capture label instead or tap "Back to barcode mode" and hold steady.'),S("warning")},[D,J]),Le=s.useCallback(()=>{const t=as({currentAttempts:At.current,maxReframeAttempts:et});if(t.action==="reframe"){J(t.attempts),D(0),u(`No lock yet. Reframe ${t.attempts}/${et}: move closer, reduce glare, keep barcode horizontal.`),S("retry");return}Tt("No stable barcode lock after reframe retries. Capture label for OCR fallback.")},[Tt,D,J]),In=s.useCallback(()=>{ie(""),u(""),d(a.CAPTURING)},[d]),zt=s.useCallback(t=>{const n=Date.now(),r=rs({samples:Oe.current,awb:t,now:n,stabilityWindowMs:ms,requiredHits:ps});return Oe.current=r.samples,Ye.current={awb:t,hits:r.hits,lastSeenAt:n},r.isStable},[]),me=s.useCallback(async()=>{var r;if(!vn())throw new Error("Camera requires HTTPS (or localhost). Open this page over https:// on your phone.");if(!((r=navigator==null?void 0:navigator.mediaDevices)!=null&&r.getUserMedia))throw new Error("Camera not supported on this browser/device.");if(!V.current)throw new Error("Camera element not ready.");const t=V.current.srcObject;if(t&&typeof t.getTracks=="function"&&t.getTracks().some(w=>w.readyState==="live")){await V.current.play();return}let n=null;try{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}V.current.srcObject=n,await V.current.play()},[]);s.useEffect(()=>{const t=setInterval(()=>it(ws(Date.now()-_.startedAt)),3e4);return()=>clearInterval(t)},[_.startedAt]);const Pe=s.useCallback(t=>{Ge(t);try{t.length?localStorage.setItem(R,JSON.stringify(t)):localStorage.removeItem(R)}catch{}},[R]),Ie=s.useCallback(t=>{const n={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:t};return Pe([...k,n]),n},[k,Pe]),Mt=s.useCallback(async t=>{if(String((t==null?void 0:t.scanMode)||"").toLowerCase()==="fast_barcode_only"){await ke.post("/shipments/scan",{awb:t.awb,courier:"AUTO",captureOnly:!0});return}await ke.post("/shipments/scan-mobile",{awb:t.awb,imageBase64:t.imageBase64,focusImageBase64:t.focusImageBase64||t.imageBase64,sessionContext:t.sessionContext||{}})},[]),De=s.useCallback(async()=>{var t;if(k.length){if(h){if(!navigator.onLine)return;const n=[];for(const r of k)if((t=r==null?void 0:r.payload)!=null&&t.awb)try{await Mt(r.payload)}catch{n.push(r)}Pe(n),n.length?u(`Uploaded partially. ${n.length} scan(s) still queued.`):u("");return}!f||!f.connected||(k.forEach(n=>{var r;(r=n==null?void 0:n.payload)!=null&&r.awb&&f.emit("scanner:scan",n.payload)}),Pe([]))}},[h,f,k,Pe,Mt]),$=s.useCallback(t=>{ut(n=>{const r={...n,scannedItems:[{...t,time:Date.now()},...n.scannedItems]};try{localStorage.setItem(O,String(r.scanNumber))}catch{}return r})},[O]),Tn=s.useCallback(()=>{if(b!=="paired"){u(h?"Scanner is offline. Reconnect internet and retry.":"Phone is not connected to the desktop session.");return}if(u(""),x){d(a.SCANNING);return}me().then(()=>d(a.SCANNING)).catch(t=>u((t==null?void 0:t.message)||"Camera access failed."))},[b,me,d,x,h]),zn=s.useCallback(t=>{t==null||t.preventDefault();const n=_e.trim().toUpperCase();if(!n||n.length<6){u("Enter a valid AWB number (min 6 chars)");return}if(b!=="paired"){u(h?"Scanner is offline. Reconnect internet and retry.":"Not connected to desktop session.");return}if(u(""),Nt(""),ie(n),x){Ce(!0),d(a.CAPTURING);return}me().then(()=>d(a.CAPTURING)).catch(r=>u((r==null?void 0:r.message)||"Camera access failed."))},[_e,b,me,d,x,h]),Mn=s.useCallback(()=>{if(window.confirm(h?"Exit this scanner session on the phone?":"End this mobile scanner session on the phone?")){if(h){N("/app/scan");return}f!=null&&f.connected?f.emit("scanner:end-session",{reason:"Mobile ended the session"}):N("/")}},[f,N,h]),Bn=s.useCallback(()=>{if(k.length>0){De();return}window.alert(h?"No queued scans to upload.":"Everything is already synced.")},[k.length,De,h]);s.useEffect(()=>{fe.current=v},[v]),s.useEffect(()=>{if(x){W("paired"),Be("Mock Mode"),u(""),d(a.IDLE);return}if(h){H(null),W("paired"),Be("Direct Mode"),u(""),d(a.IDLE);return}if(!m){u("No PIN provided.");return}const t=Un(cs,{auth:{scannerPin:m},transports:["websocket","polling"],reconnection:!0,reconnectionDelay:1500,reconnectionAttempts:20});return t.on("connect",()=>W("connecting")),t.on("scanner:paired",({userEmail:n})=>{W("paired"),Be(n?n.split("@")[0]:"Connected"),u(""),d(a.IDLE)}),t.on("scanner:error",({message:n})=>{u(n),W("disconnected")}),t.on("scanner:session-ended",({reason:n})=>{W("disconnected"),u(n||"Session ended by desktop."),N("/")}),t.on("disconnect",()=>W("disconnected")),t.on("reconnect",()=>{b==="paired"&&d(a.SCANNING)}),t.on("scanner:scan-processed",n=>{if(n.status==="error"){Q("error"),se(),S("error"),d(a.ERROR),u(n.error||"Scan failed on desktop.");return}if(ee(n),M({clientCode:n.clientCode||"",consignee:n.consignee||"",destination:n.destination||"",pincode:n.pincode||"",weight:n.weight||0,amount:n.amount||0,orderNo:n.orderNo||""}),re({}),n.reviewRequired)d(a.REVIEWING);else{pe(),S("success");const r={awb:n.awb,clientCode:n.clientCode,clientName:n.clientName,destination:n.destination||"",weight:n.weight||0};B(r),$(r),d(a.SUCCESS)}}),t.on("scanner:approval-result",({success:n,message:r,awb:c})=>{if(n){pe(),S("success"),Q("success");const w={awb:(o==null?void 0:o.awb)||c,clientCode:g.clientCode,clientName:(o==null?void 0:o.clientName)||g.clientCode,destination:g.destination||"",weight:parseFloat(g.weight)||0};B(w),$(w),d(a.SUCCESS)}else se(),S("error"),u(r||"Approval failed.")}),t.on("scanner:ready-for-next",()=>{}),H(t),()=>{t.disconnect()}},[m,$,o,g,d,N,x,h]),s.useEffect(()=>{try{const t=localStorage.getItem(R);if(!t)return;const n=JSON.parse(t);Array.isArray(n)&&n.length&&Ge(n)}catch{}},[R]),s.useEffect(()=>{try{localStorage.setItem(fn,A)}catch{}},[A]),s.useEffect(()=>{try{localStorage.setItem(xn,q)}catch{}},[q]),s.useEffect(()=>{if(k.length){if(h){b==="paired"&&navigator.onLine&&De();return}b==="paired"&&(f!=null&&f.connected)&&De()}},[b,f,k.length,De,h]);const Te=s.useCallback(async()=>{var t;try{if(Ce(!1),ge.current){try{const n=ge.current;n!=null&&n.barcodeScanner&&await n.barcodeScanner.dispose()}catch{}ge.current=null}if(oe.current){try{await oe.current.reset()}catch{}oe.current=null}(t=V.current)!=null&&t.srcObject&&(V.current.srcObject.getTracks().forEach(n=>n.stop()),V.current.srcObject=null)}catch{}},[]),ze=s.useCallback(async()=>{try{if(at("idle"),ge.current){try{await ge.current.barcodeScanner.dispose()}catch{}ge.current=null}if(oe.current){try{oe.current._type==="native"?oe.current.reset():await oe.current.reset()}catch{}oe.current=null}}catch{}},[]),Bt=s.useCallback(async()=>{if(V.current){await ze();try{if(Ne.current=Date.now(),await me(),gs){const[{BrowserMultiFormatReader:t},n]=await Promise.all([tn(()=>import("./index-4oYbt_M2.js"),__vite__mapDeps([0,1])),tn(()=>import("./index-D3Mz4UNV.js"),__vite__mapDeps([]))]),r=new Map([[n.DecodeHintType.POSSIBLE_FORMATS,[n.BarcodeFormat.CODE_128,n.BarcodeFormat.ITF,n.BarcodeFormat.CODE_39,n.BarcodeFormat.CODE_93,n.BarcodeFormat.CODABAR,n.BarcodeFormat.EAN_13,n.BarcodeFormat.EAN_8]],[n.DecodeHintType.TRY_HARDER,!0],[n.DecodeHintType.ASSUME_GS1,!1],[n.DecodeHintType.CHARACTER_SET,"UTF-8"]]),c=new t(r,40);at("zxing"),oe.current=c,c.decodeFromVideoElement(V.current,w=>{var p,C,T;if(!ue.current)if(w){D(0);let G="unknown";try{G=String(((p=w.getBarcodeFormat)==null?void 0:p.call(w))||"unknown")}catch{}jt({value:((C=w.getText)==null?void 0:C.call(w))||"",format:G,engine:"zxing",at:Date.now(),sinceStartMs:Ne.current?Date.now()-Ne.current:null,candidateCount:1,ambiguous:!1,alternatives:[]}),(T=ce.current)==null||T.call(ce,w.getText(),{candidateCount:1,ambiguous:!1,alternatives:[],format:G,engine:"zxing"})}else{const G=qe.current+1;D(G),G>=yt&&Le()}});return}if(typeof window.BarcodeDetector<"u"){let t=!0,n=vt;try{const r=await window.BarcodeDetector.getSupportedFormats();n=vt.filter(c=>r.includes(c)),n.length||(n=vt)}catch{}if(n.includes("itf")||(console.log("[MobileScanner] Native BarcodeDetector lacks ITF, falling back to ZXing"),t=!1),t){at("native");const r=new window.BarcodeDetector({formats:n});let c=null,w=!1;const p=async()=>{var T;if(w||fe.current!==a.SCANNING)return;if(ue.current){c=setTimeout(p,wt);return}const C=V.current;if(!C||C.readyState<2){c=setTimeout(p,wt);return}try{const G=await r.detect(C),ne=G.map(j=>String((j==null?void 0:j.rawValue)||"").trim()).filter(Boolean);if(ne.length>0){const j=Gn(ne),Ue=j.awb||ne[0];D(0),jt({value:Ue,format:String(G[0].format||"unknown"),engine:"native",at:Date.now(),sinceStartMs:Ne.current?Date.now()-Ne.current:null,candidateCount:ne.length,ambiguous:j.ambiguous,alternatives:j.alternatives}),(T=ce.current)==null||T.call(ce,Ue,{candidateCount:ne.length,ambiguous:j.ambiguous,alternatives:j.alternatives,format:String(G[0].format||"unknown"),engine:"native"})}else{const j=qe.current+1;D(j),j>=yt&&Le()}}catch{}fe.current===a.SCANNING&&(c=setTimeout(p,wt))};oe.current={_type:"native",reset:()=>{w=!0,c&&clearTimeout(c),c=null}},setTimeout(p,220);return}}throw new Error("Unable to initialize a barcode scanner on this device.")}catch(t){u("Camera access failed: "+t.message)}}},[me,ze,Le,D]),_t=s.useCallback((t,n={})=>{var p;const r=String(t||"").trim().replace(/\s+/g,"").toUpperCase(),c=qn(t)||r;if(ue.current||fe.current!==a.SCANNING)return;if(!c||c.length<8){r.replace(/[^A-Z0-9]/g,"").length>=4&&ht("Partial barcode detected. Move closer so full AWB is visible.");return}if(n!=null&&n.ambiguous){const C=qe.current+1;D(C),ht("Multiple barcodes detected. Keep only the AWB barcode inside the strip.","retry"),C>=yt&&Le();return}if(!x&&!zt(c))return;if(ue.current=!0,Ft.current.has(c)){S("duplicate"),se(),we(c),setTimeout(()=>{we(""),ue.current=!1,Ye.current={awb:"",hits:0,lastSeenAt:0},Oe.current=[]},2500);return}clearTimeout(Qe.current),S("lock"),wn(),ie(c);const w=Ne.current?Date.now()-Ne.current:null;if(ct(w),le.current={lockTimeMs:w,candidateCount:Number((n==null?void 0:n.candidateCount)||1),ambiguous:!!(n!=null&&n.ambiguous),alternatives:Array.isArray(n==null?void 0:n.alternatives)?n.alternatives.slice(0,3):[]},J(0),D(0),u(""),ut(C=>{const T={...C,scanNumber:C.scanNumber+1};return T.scannedAwbs=new Set(C.scannedAwbs),T.scannedAwbs.add(c),Ft.current=T.scannedAwbs,T}),A==="fast"){(p=Ke.current)==null||p.call(Ke,c);return}Qe.current=setTimeout(()=>{fe.current===a.SCANNING&&d(a.CAPTURING)},us)},[d,zt,A,x,D,J,ht,Le]);s.useEffect(()=>{ce.current=_t},[_t]),s.useEffect(()=>{if(v===a.SCANNING&&(ue.current=!1,Ye.current={awb:"",hits:0,lastSeenAt:0},Oe.current=[],le.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},ct(null),J(0),D(0),lt("barcode"),Bt(),x&&U)){const t=setTimeout(()=>{var n;fe.current===a.SCANNING&&((n=ce.current)==null||n.call(ce,U))},50);return()=>clearTimeout(t)}return()=>{v===a.SCANNING&&ze()}},[v,Bt,ze,D,J,x,U]);const Ot=s.useCallback(async()=>{if(x){Ce(!0);return}await ze();try{await me(),Ce(!0)}catch(t){u("Camera access failed: "+t.message)}},[me,ze,x]);s.useEffect(()=>{v===a.CAPTURING&&Ot()},[v,Ot]);const Xe=s.useCallback(()=>{const t=V.current,n=mt.current;return is(t,n)},[]);s.useEffect(()=>{if(v!==a.CAPTURING){te(!1),X(0),Me({ok:!1,issues:[],metrics:null}),An.current=!1,We.current=!1;return}const t=setInterval(()=>{const n=Xe();n&&(Me(n),te(n.ok),X(r=>{const c=n.ok?Math.min(r+1,8):0;return c>=Ct&&!We.current&&(S("tap"),We.current=!0),n.ok||(We.current=!1),c}))},280);return()=>clearInterval(t)},[v,Xe]);const Wt=s.useCallback((t={})=>{const n=V.current,r=mt.current;if(!n||!r||!n.videoWidth)return null;const c=Nn(n,r);if(!c)return null;const w=c.x,p=c.y,C=c.w,T=c.h;if(!C||!T)return null;const G=Math.max(640,Number(t.maxWidth||bn)),ne=Math.min(.85,Math.max(.55,Number(t.quality||je))),j=document.createElement("canvas");j.width=Math.min(G,Math.round(C)),j.height=Math.round(j.width/C*T),j.getContext("2d").drawImage(n,w,p,C,T,0,0,j.width,j.height);const gt=j.toDataURL("image/jpeg",ne).split(",")[1]||"";if(!gt)return null;const $n=Math.floor(gt.length*3/4);return{base64:gt,width:j.width,height:j.height,approxBytes:$n,quality:ne}},[]),_n=s.useCallback(()=>{const t=Date.now();if(t-It.current<hs)return;It.current=t;const n=Xe()||y;if(!(n!=null&&n.ok)||P<Ct){u(mn(n==null?void 0:n.issues)||"Capture quality is low. Hold steady and align the AWB in the frame."),S("warning"),se();return}Q("white"),wn(),S("tap");const r=Wt({maxWidth:bn,quality:je});if(!(r!=null&&r.base64)){u("Could not capture image. Try again."),ue.current=!1;return}Fe({kb:Math.round((r.approxBytes||0)/1024),width:r.width||0,height:r.height||0,quality:r.quality||je}),Z(`data:image/jpeg;base64,${r.base64}`),Te(),d(a.PREVIEW)},[Wt,Te,d,Xe,y,P]),On=s.useCallback(()=>{if(!x)return;const t="data:image/jpeg;base64,ZmFrZS1tb2NrLWltYWdl";Fe({kb:0,width:0,height:0,quality:je}),Z(t),Te(),d(a.PREVIEW)},[d,x,Te]),Je=s.useCallback(()=>{var t,n,r;return{scanNumber:_.scanNumber,recentClient:_.dominantClient,dominantClient:_.dominantClient,dominantClientCount:_.dominantClientCount,sessionDurationMin:Math.round((Date.now()-_.startedAt)/6e4),scanWorkflowMode:A,scanMode:Se,deviceProfile:q,hardwareClass:q===Y.rugged?"rugged":"phone",captureQuality:{ok:!!y.ok,issues:Array.isArray(y.issues)?y.issues.slice(0,8):[],metrics:y.metrics||null},captureMeta:{kb:L.kb||0,width:L.width||0,height:L.height||0,quality:L.quality||je},lockTimeMs:Number.isFinite(Number((t=le.current)==null?void 0:t.lockTimeMs))?Number(le.current.lockTimeMs):null,lockCandidateCount:Number.isFinite(Number((n=le.current)==null?void 0:n.candidateCount))?Number(le.current.candidateCount):1,lockAlternatives:Array.isArray((r=le.current)==null?void 0:r.alternatives)?le.current.alternatives.slice(0,3):[]}},[_,A,Se,q,y,L]),Lt=s.useCallback(async t=>{var c,w;const n=String(t||"").trim().toUpperCase();if(!n)return;if(d(a.PROCESSING),x){setTimeout(()=>{const p={awb:n,clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25};B(p),$(p),d(a.SUCCESS)},120);return}const r={awb:n,imageBase64:null,focusImageBase64:null,scanMode:"fast_barcode_only",sessionContext:Je()};if(h){if(!navigator.onLine){Ie(r),pe(),S("success");const p={awb:n,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};B({...p,offlineQueued:!0}),$(p),d(a.SUCCESS);return}try{const p=await ke.post("/shipments/scan",{awb:n,courier:"AUTO",captureOnly:!0}),C=((c=p==null?void 0:p.data)==null?void 0:c.shipment)||{},T={awb:C.awb||n,clientCode:C.clientCode||"MISC",clientName:((w=C.client)==null?void 0:w.company)||C.clientCode||"Scanned",destination:C.destination||"",weight:C.weight||0};B(T),$(T),pe(),S("success"),d(a.SUCCESS)}catch(p){u((p==null?void 0:p.message)||"Barcode processing failed. Please try again."),se(),S("error"),d(a.ERROR)}return}if(!f||!f.connected||b!=="paired"){Ie(r),pe(),S("success");const p={awb:n,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};B({...p,offlineQueued:!0}),$(p),d(a.SUCCESS);return}f.emit("scanner:scan",r),setTimeout(()=>{fe.current===a.PROCESSING&&(u("Barcode processing timed out. Please try scanning again."),se(),S("error"),d(a.ERROR))},ls)},[f,b,d,x,Ie,$,Je,h]);s.useEffect(()=>{Ke.current=Lt},[Lt]);const Wn=s.useCallback(async()=>{if(!K)return;if(d(a.PROCESSING),x){setTimeout(()=>{const r={awb:F||"100454974120",clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25};B(r),$(r),d(a.SUCCESS)},250);return}const t=K.split(",")[1]||K,n={awb:F||"",imageBase64:t,focusImageBase64:t,scanMode:"ocr_label",sessionContext:Je()};if(h){if(!navigator.onLine){Ie(n),pe(),S("success");const r={awb:F||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};B({...r,offlineQueued:!0}),$(r),d(a.SUCCESS);return}try{const r=await ke.post("/shipments/scan-mobile",n),c=(r==null?void 0:r.data)||r;if(c.status==="error"||!c.success){Q("error"),se(),S("error"),d(a.ERROR),u(c.error||c.message||"Scan failed.");return}if(ee(c),M({clientCode:c.clientCode||"",consignee:c.consignee||"",destination:c.destination||"",pincode:c.pincode||"",weight:c.weight||0,amount:c.amount||0,orderNo:c.orderNo||""}),re({}),c.reviewRequired)d(a.REVIEWING);else{pe(),S("success");const w={awb:c.awb,clientCode:c.clientCode,clientName:c.clientName,destination:c.destination||"",weight:c.weight||0};B(w),$(w),d(a.SUCCESS)}}catch(r){u((r==null?void 0:r.message)||"Server error. Please try again."),se(),S("error"),d(a.ERROR)}return}if(!f||!f.connected||b!=="paired"){Ie(n),pe(),S("success");const r={awb:F||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};B({...r,offlineQueued:!0}),$(r),d(a.SUCCESS);return}f.emit("scanner:scan",n),setTimeout(()=>{fe.current===a.PROCESSING&&(u("OCR timed out after 40 seconds. Retake the label photo and try again."),se(),S("error"),d(a.ERROR))},4e4)},[f,F,K,d,b,Ie,$,x,Je,h]),Ln=s.useCallback(async()=>{var w;if(!o)return;d(a.APPROVING);let t=!h;if(x){setTimeout(()=>{const p={awb:o.awb||F,clientCode:g.clientCode||"MOCKCL",clientName:o.clientName||g.clientCode||"Mock Client",destination:g.destination||"",weight:parseFloat(g.weight)||0};B(p),$(p),Q("success"),t=!0,d(a.SUCCESS)},200);return}const n={clientCode:o.clientCode||"",clientName:o.clientName||"",consignee:o.consignee||"",destination:o.destination||""},r={clientCode:g.clientCode||"",clientName:g.clientCode||"",consignee:g.consignee||"",destination:g.destination||""},c={clientCode:g.clientCode,consignee:g.consignee,destination:g.destination,pincode:g.pincode,weight:parseFloat(g.weight)||0,amount:parseFloat(g.amount)||0,orderNo:g.orderNo||""};if(h)try{(o.ocrExtracted||o)&&await ke.post("/shipments/learn-corrections",{ocrFields:n,approvedFields:r}),o.shipmentId?await ke.put(`/shipments/${o.shipmentId}`,c):await ke.post("/shipments",{awb:o.awb||F,...c}),pe(),S("success"),Q("success");const p={awb:(o==null?void 0:o.awb)||F,clientCode:g.clientCode,clientName:(o==null?void 0:o.clientName)||g.clientCode,destination:g.destination||"",weight:parseFloat(g.weight)||0};B(p),$(p),t=!0,d(a.SUCCESS)}catch(p){d(a.REVIEWING),se(),S("error"),u((p==null?void 0:p.message)||"Approval failed.")}else{if(!f){d(a.REVIEWING),u("Not connected to desktop session.");return}(o.ocrExtracted||o)&&f.emit("scanner:learn-corrections",{pin:m,ocrFields:n,approvedFields:r,courier:(o==null?void 0:o.courier)||((w=o==null?void 0:o.ocrExtracted)==null?void 0:w.courier)||"",deviceProfile:q}),f.emit("scanner:approval-submit",{shipmentId:o.shipmentId,awb:o.awb||F,fields:c},p=>{p!=null&&p.success||(d(a.REVIEWING),se(),S("error"),u((p==null?void 0:p.message)||"Approval failed."))})}t&&g.clientCode&&g.clientCode!=="MISC"&&ut(p=>{var G,ne;const C={...p.clientFreq};C[g.clientCode]=(C[g.clientCode]||0)+1;const T=Object.entries(C).sort((j,Ue)=>Ue[1]-j[1]);return{...p,clientFreq:C,dominantClient:((G=T[0])==null?void 0:G[1])>=2?T[0][0]:null,dominantClientCount:((ne=T[0])==null?void 0:ne[1])||0}})},[f,o,g,F,m,d,$,x,q,h]),$e=s.useCallback((t=a.IDLE)=>{clearTimeout(He.current),clearTimeout(Qe.current),ie(""),Z(null),Fe({kb:0,width:0,height:0,quality:je}),ee(null),M({}),re({}),B(null),ct(null),u(""),we(""),te(!1),X(0),Me({ok:!1,issues:[],metrics:null}),ue.current=!1,Ye.current={awb:"",hits:0,lastSeenAt:0},Oe.current=[],le.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},We.current=!1,J(0),d(t)},[d,J]);s.useEffect(()=>{if(v===a.SUCCESS){const t=A==="fast"?a.SCANNING:a.IDLE,n=A==="fast"?gn:hn;return He.current=setTimeout(()=>$e(t),n),()=>clearTimeout(He.current)}},[v,$e,A]),s.useEffect(()=>{if(Ve)if(v===a.REVIEWING&&o){const t=[o.clientName||o.clientCode,o.destination,o.weight?`${o.weight} kilograms`:""].filter(Boolean);t.length&&Cn(t.join(". "))}else v===a.SUCCESS&&z&&Cn(`${z.clientName||z.clientCode||"Shipment"} Verified.`)},[Ve,v,o,z]),s.useEffect(()=>()=>{Te(),clearTimeout(He.current),clearTimeout(Qe.current)},[Te]);const de=t=>`msp-step ${v===t?"active":""}`,Pt=Math.max(1,Math.round((A==="fast"?gn:hn)/1e3)),Pn=y.ok?"AWB quality looks good - press shutter":mn(y.issues)||"Fit AWB slip fully in frame and hold steady",Dt=Ae&&y.ok&&P>=Ct,xe=s.useMemo(()=>{if(!o)return{};const t=o.ocrExtracted||o;return{clientCode:{confidence:(t==null?void 0:t.clientNameConfidence)||0,source:(t==null?void 0:t.clientNameSource)||null},consignee:{confidence:(t==null?void 0:t.consigneeConfidence)||0,source:(t==null?void 0:t.consigneeSource)||null},destination:{confidence:(t==null?void 0:t.destinationConfidence)||0,source:(t==null?void 0:t.destinationSource)||null},pincode:{confidence:(t==null?void 0:t.pincodeConfidence)||0,source:null},weight:{confidence:(t==null?void 0:t.weightConfidence)||0,source:null}}},[o]),$t=_.scannedItems.reduce((t,n)=>t+(n.weight||0),0),I=((Ut=o==null?void 0:o.ocrExtracted)==null?void 0:Ut.intelligence)||(o==null?void 0:o.intelligence)||null,Dn=[["Step",v],["Connection",b],["Engine",kt],["Workflow",A],["Device",q],["Scan mode",Se],["Fail count",String(jn)],["Reframe retries",`${ot}/${et}`],["Camera",Ae?"ready":"waiting"],["Doc detect",Re?`yes (${P})`:"no"],["Capture quality",y.ok?"good":y.issues.join(", ")||"pending"],["Capture metrics",y.metrics?`blur ${y.metrics.blurScore} | glare ${y.metrics.glareRatio}% | skew ${y.metrics.perspectiveSkew}%`:"-"],["JPEG last shot",L.kb?`${L.kb}KB ${L.width}x${L.height} q=${L.quality}`:"-"],["Secure ctx",vn()?"yes":"no"],["AWB lock",F||"-"],["Lock ms",Et!=null?String(Et):"-"],["Lock candidates",String(((Gt=le.current)==null?void 0:Gt.candidateCount)||1)],["Queued",String(k.length)],["Scans",String(_.scanNumber)],["Last format",(ae==null?void 0:ae.format)||"-"],["Last code",(ae==null?void 0:ae.value)||"-"],["Decode ms",(ae==null?void 0:ae.sinceStartMs)!=null?String(ae.sinceStartMs):"-"],["False-lock",(qt=o==null?void 0:o.scanTelemetry)!=null&&qt.falseLock?"yes":"no"]];return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:bs}),e.jsxs("div",{className:"msp-root",children:[he&&e.jsx("div",{className:`flash-overlay flash-${he}`,onAnimationEnd:()=>Q(null)}),ye&&e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[e.jsx(nn,{size:48,color:"white"}),e.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),e.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:ye}),e.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),e.jsx("button",{type:"button","data-testid":"scanner-diag-toggle",onClick:()=>kn(t=>!t),style:{position:"fixed",top:12,right:12,zIndex:70,border:"1px solid rgba(255,255,255,0.18)",background:rt?"rgba(79,70,229,0.92)":"rgba(15,23,42,0.72)",color:"#fff",borderRadius:999,padding:"8px 12px",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.04em",backdropFilter:"blur(10px)",cursor:"pointer"},children:rt?"Hide Diag":"Show Diag"}),rt&&e.jsxs("div",{"data-testid":"scanner-diag-panel",style:{position:"fixed",top:56,right:12,zIndex:69,width:"min(92vw, 320px)",background:"rgba(15,23,42,0.88)",color:"#E5EEF8",border:"1px solid rgba(255,255,255,0.12)",borderRadius:18,padding:14,backdropFilter:"blur(14px)",boxShadow:"0 12px 30px rgba(0,0,0,0.25)"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10,color:"#A5B4FC"},children:"Scanner Diagnostics"}),e.jsx("div",{style:{display:"grid",gap:6},children:Dn.map(([t,n])=>e.jsxs("div",{style:{display:"flex",gap:8,justifyContent:"space-between",alignItems:"flex-start",fontSize:"0.76rem"},children:[e.jsx("div",{style:{color:"rgba(226,232,240,0.72)",minWidth:88},children:t}),e.jsx("div",{className:"mono",style:{textAlign:"right",wordBreak:"break-word",maxWidth:180},children:n})]},t))}),e.jsx("div",{style:{marginTop:10,fontSize:"0.68rem",color:"rgba(226,232,240,0.7)",lineHeight:1.4},children:"Use this to verify whether Trackon labels are being decoded as `ITF` and how quickly the first lock happens after scan start."})]}),b!=="paired"&&e.jsx("div",{className:de(a.IDLE),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:b==="connecting"?e.jsx(ft,{size:28,color:i.primary,style:{animation:"spin 1s linear infinite"}}):e.jsx(sn,{size:28,color:i.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:b==="connecting"?"Connecting...":"Disconnected"}),e.jsx("div",{style:{fontSize:"0.82rem",color:i.muted},children:E||(h?"Preparing direct scanner session":`Connecting to session ${m}`)})]}),b==="disconnected"&&e.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[e.jsx(ft,{size:16})," Reconnect"]})]})}),e.jsx("video",{ref:V,autoPlay:!0,playsInline:!0,muted:!0,onClick:()=>{me().catch(t=>{u((t==null?void 0:t.message)||"Camera access failed.")})},style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(v===a.SCANNING||v===a.CAPTURING)&&!ge.current?"block":"none"}}),e.jsx("div",{className:de(a.IDLE),children:e.jsxs("div",{className:"home-root",children:[e.jsxs("div",{className:"home-header",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16},children:[e.jsxs("button",{onClick:()=>N("/app/scan"),style:{background:"white",border:"1px solid #E2E8F0",padding:"6px 12px",borderRadius:20,fontSize:"0.75rem",fontWeight:600,color:"#475569",display:"flex",alignItems:"center",gap:4,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.02)"},children:[e.jsx(Qn,{size:14})," Go Back"]}),e.jsxs("div",{className:"home-logo-badge",children:[e.jsx(rn,{size:11,color:b==="paired"&&navigator.onLine?"#10B981":"#EF4444"}),ve]})]}),e.jsx("div",{className:"home-logo-row",children:e.jsxs("div",{className:"home-logo-text",children:[e.jsx("img",{src:"/images/logo.png",alt:"Sea Hawk Logo",style:{height:28,width:"auto",objectFit:"contain",padding:2,background:"white",borderRadius:6,border:"1px solid #E2E8F0"}}),e.jsx("span",{children:"Seahawk Scanner"})]})}),e.jsxs("div",{className:"home-stats-row",children:[e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:_.scanNumber}),e.jsx("div",{className:"home-stat-label",children:"Scanned"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:$t>0?$t.toFixed(1):"0"}),e.jsx("div",{className:"home-stat-label",children:"Total kg"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:st}),e.jsx("div",{className:"home-stat-label",children:"Session"})]})]})]}),e.jsxs("div",{className:"home-scan-section",children:[e.jsxs("div",{className:"home-scan-btn-wrap",children:[e.jsx("div",{className:"home-scan-ring"}),e.jsx("div",{className:"home-scan-ring home-scan-ring2"}),e.jsxs("button",{"data-testid":"start-scan-btn",className:"home-scan-btn",onClick:Tn,children:[e.jsx(xt,{size:34,color:"white"}),e.jsx("span",{className:"home-scan-btn-label",children:"Scan"})]})]}),e.jsx("div",{className:"home-cta-text",children:_.scanNumber===0?"Tap to start your first scan":"Tap to scan next parcel"}),e.jsxs("div",{style:{display:"flex",gap:8,marginTop:14,width:"100%",maxWidth:320},children:[e.jsxs("button",{type:"button","data-testid":"workflow-fast-btn",onClick:()=>dt("fast"),style:{flex:1,borderRadius:999,border:`1px solid ${A==="fast"?i.primary:i.border}`,background:A==="fast"?i.primaryLight:i.surface,color:A==="fast"?i.primary:i.muted,fontWeight:700,fontSize:"0.72rem",padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(an,{size:13})," Fast scan"]}),e.jsxs("button",{type:"button","data-testid":"workflow-ocr-btn",onClick:()=>dt("ocr"),style:{flex:1,borderRadius:999,border:`1px solid ${A==="ocr"?i.primary:i.border}`,background:A==="ocr"?i.primaryLight:i.surface,color:A==="ocr"?i.primary:i.muted,fontWeight:700,fontSize:"0.72rem",padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(bt,{size:13})," OCR label"]})]}),e.jsxs("div",{style:{display:"flex",gap:8,marginTop:8,width:"100%",maxWidth:320},children:[e.jsxs("button",{type:"button","data-testid":"device-profile-phone-btn",onClick:()=>Rt(Y.phone),style:{flex:1,borderRadius:999,border:`1px solid ${q===Y.phone?i.primary:i.border}`,background:q===Y.phone?i.primaryLight:i.surface,color:q===Y.phone?i.primary:i.muted,fontWeight:700,fontSize:"0.7rem",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(xt,{size:13})," Phone lens"]}),e.jsxs("button",{type:"button","data-testid":"device-profile-rugged-btn",onClick:()=>Rt(Y.rugged),style:{flex:1,borderRadius:999,border:`1px solid ${q===Y.rugged?i.primary:i.border}`,background:q===Y.rugged?i.primaryLight:i.surface,color:q===Y.rugged?i.primary:i.muted,fontWeight:700,fontSize:"0.7rem",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(Yn,{size:13})," Rugged"]})]}),e.jsxs("form",{onSubmit:zn,style:{width:"100%",maxWidth:300,marginTop:20},children:[e.jsx("div",{style:{fontSize:"0.62rem",fontWeight:700,color:i.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6,textAlign:"center"},children:"Can't scan? Enter AWB manually"}),e.jsxs("div",{style:{display:"flex",gap:6},children:[e.jsx("input",{"data-testid":"manual-awb-input",value:_e,onChange:t=>Nt(t.target.value.toUpperCase()),placeholder:"e.g. 1234567890",inputMode:"text",autoCapitalize:"characters",style:{flex:1,padding:"9px 12px",border:`1.5px solid ${i.border}`,borderRadius:10,fontFamily:"JetBrains Mono, monospace",fontSize:"0.82rem",fontWeight:600,background:i.surface,color:i.text,outline:"none"},onFocus:t=>t.target.style.borderColor=i.primary,onBlur:t=>t.target.style.borderColor=i.border}),e.jsx("button",{type:"submit","data-testid":"manual-awb-submit",disabled:_e.trim().length<6,className:"btn btn-primary",style:{padding:"9px 14px",fontSize:"0.78rem",borderRadius:10,opacity:_e.trim().length>=6?1:.45},children:"Go â†’"})]})]}),e.jsxs("div",{className:"action-buttons-row",children:[e.jsxs("button",{className:"action-btn",onClick:Bn,children:[e.jsx(Kn,{size:14})," ",k.length>0?`Upload (${k.length})`:"Synced"]}),e.jsxs("button",{className:"action-btn danger",onClick:Mn,children:[e.jsx(Xn,{size:14})," End Session"]})]}),k.length>0&&e.jsxs("div",{style:{marginTop:14,fontSize:"0.7rem",color:i.warning,fontWeight:600,display:"flex",alignItems:"center",gap:5},children:[e.jsx(on,{size:12})," ",k.length," offline scan",k.length>1?"s":""," pending sync"]})]}),e.jsxs("div",{className:"home-queue-section",children:[e.jsxs("div",{className:"home-queue-head",children:[e.jsxs("div",{className:"home-queue-title-text",children:[e.jsx(Jn,{size:11}),"Accepted Consignments"]}),_.scannedItems.length>0&&e.jsx("div",{className:"home-queue-badge",children:_.scannedItems.length})]}),e.jsx("div",{className:"home-queue-list",children:_.scannedItems.length===0?e.jsxs("div",{className:"queue-empty",children:[e.jsx(cn,{size:36,color:"rgba(255,255,255,0.12)"}),e.jsxs("div",{className:"queue-empty-text",children:["No consignments scanned yet.",e.jsx("br",{}),"Tap the button above to begin."]})]}):_.scannedItems.map((t,n)=>e.jsxs("div",{className:"queue-item",children:[e.jsx("div",{className:"queue-check",children:e.jsx(ln,{size:13,color:"#10B981"})}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{className:"queue-awb",children:t.awb}),e.jsxs("div",{className:"queue-meta",children:[t.clientCode==="OFFLINE"?e.jsx("span",{className:"queue-offline-tag",children:"Offline"}):t.clientCode&&e.jsx("span",{className:"queue-client-tag",children:t.clientCode}),t.destination&&e.jsx("span",{children:t.destination})]})]}),t.weight>0&&e.jsxs("div",{className:"queue-weight",children:[t.weight,"kg"]})]},`${t.awb}-${n}`))})]})]})}),e.jsx("div",{className:de(a.SCANNING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[e.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:ge.current?"block":"none"}}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{className:"scan-guide",style:Se==="barcode"?{width:pn.w,height:pn.h,borderRadius:10,maxHeight:"20vw",transition:"all 0.4s ease",borderColor:E?"rgba(248,113,113,0.92)":void 0,boxShadow:E?"0 0 0 3px rgba(248,113,113,0.2)":void 0}:{width:Ze.w,height:Ze.h,borderRadius:14,maxHeight:"75vh",transition:"all 0.4s ease",borderColor:"rgba(251,191,36,0.85)",boxShadow:"0 0 0 3px rgba(251,191,36,0.2)"},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"}),Se==="barcode"&&e.jsx("div",{className:"scan-laser"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(rn,{size:12})," ",h?"DIRECT":m]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[Se==="document"&&e.jsxs("div",{className:"cam-hud-chip",style:{background:"rgba(251,191,36,0.22)",color:"#FDE68A",fontWeight:700,fontSize:"0.65rem",gap:4},children:[e.jsx(dn,{size:11})," LABEL MODE"]}),e.jsxs("div",{className:"cam-hud-chip",style:{gap:4},children:[e.jsx(cn,{size:12})," ",_.scanNumber,kt==="native"?e.jsx("span",{style:{color:"#34D399",fontSize:"0.6rem",fontWeight:800},children:"⚡ NATIVE"}):e.jsx("span",{style:{color:"#F59E0B",fontSize:"0.6rem",fontWeight:800},children:"ZXING"})]})]})]}),e.jsxs("div",{className:"cam-bottom",children:[Se==="barcode"?e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:6,color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:[e.jsx("div",{children:A==="fast"?"Align barcode inside the strip - auto-save on lock":"Align barcode inside the strip - camera opens for label capture after lock"}),ot>0&&e.jsxs("div",{style:{color:"#FDE68A",fontSize:"0.74rem",fontWeight:700},children:["Reframe retry ",ot,"/",et]}),!!E&&e.jsx("div",{style:{color:"#FCA5A5",fontSize:"0.72rem",fontWeight:700},children:E})]}):e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:6},children:[e.jsx("div",{style:{color:"rgba(251,191,36,0.95)",fontSize:"0.82rem",fontWeight:700,textAlign:"center"},children:"No barcode found - capture the label and we will read the printed AWB"}),e.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"},children:[e.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:In,children:"Capture label instead"}),e.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:()=>{D(0),J(0),u(""),lt("barcode"),S("tap")},children:"Back to barcode mode"})]})]}),e.jsxs("div",{style:{display:"flex",gap:12},children:[e.jsxs("button",{className:"cam-hud-chip",onClick:()=>dt(t=>t==="fast"?"ocr":"fast"),style:{border:"none",cursor:"pointer",gap:5},children:[A==="fast"?e.jsx(an,{size:13}):e.jsx(bt,{size:13}),A==="fast"?"FAST":"OCR"]}),e.jsx("button",{className:"cam-hud-chip",onClick:()=>Fn(!Ve),style:{border:"none",cursor:"pointer"},children:Ve?e.jsx(Zn,{size:14}):e.jsx(es,{size:14})})]})]})]})}),e.jsx("div",{className:de(a.CAPTURING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!Ae&&e.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[e.jsx(ts,{size:44,color:"#34D399"}),e.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:F||"OCR fallback"}),e.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:F?"Barcode locked - Preparing camera...":"Preparing label capture for printed AWB OCR..."})]}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{ref:mt,className:`scan-guide ${Re?"detected":""}`,style:{width:Ze.w,height:Ze.h,maxHeight:"75vh",borderRadius:12},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[e.jsx(dn,{size:12})," ",F||"OCR AWB capture"]}),k.length>0&&e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(on,{size:12})," ",k.length," queued"]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:Re?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center",transition:"color 0.3s"},children:Pn}),y.metrics&&e.jsxs("div",{style:{color:"rgba(255,255,255,0.66)",fontSize:"0.72rem",textAlign:"center"},children:["Blur ",y.metrics.blurScore," | Glare ",y.metrics.glareRatio,"% | Skew ",y.metrics.perspectiveSkew,"%"]}),e.jsx("button",{className:"capture-btn","data-testid":"capture-photo-btn",onClick:_n,disabled:!Dt,style:{opacity:Dt?1:.4},children:e.jsx("div",{className:"capture-btn-inner"})}),x&&e.jsx("button",{type:"button","data-testid":"mock-capture-btn",onClick:On,style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 12px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:"Mock capture"}),e.jsx("button",{style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},onClick:()=>{ie(""),u(""),D(0),J(0),ue.current=!1,S("tap"),d(a.SCANNING)},children:"â† Rescan barcode"})]})]})}),e.jsx("div",{className:de(a.PREVIEW),children:e.jsxs("div",{style:{background:i.bg,display:"flex",flexDirection:"column",height:"100%"},children:[e.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${i.border}`},children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.72rem",color:i.muted,fontWeight:600},children:"CAPTURED"}),e.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:F||"Printed AWB OCR"}),L.kb>0&&e.jsxs("div",{style:{fontSize:"0.68rem",color:i.mutedLight},children:[L.kb,"KB • ",L.width,"×",L.height]})]})}),e.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:K&&e.jsx("img",{src:K,alt:"Captured label",className:"preview-img"})}),e.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{Z(null),d(a.CAPTURING)},children:[e.jsx(un,{size:16})," Retake"]}),e.jsxs("button",{"data-testid":"use-photo-btn",className:"btn btn-primary",style:{flex:2},onClick:Wn,children:[e.jsx(ns,{size:16})," Use Photo"]})]})]})}),e.jsx("div",{className:de(a.PROCESSING),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16},children:[e.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[e.jsx(bt,{size:22,color:i.primary,style:{animation:"spin 2s linear infinite"}}),e.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:i.primary},children:"Intelligence Engine"})]}),e.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:i.muted},children:F}),e.jsx("div",{style:{fontSize:"0.72rem",color:i.mutedLight,marginTop:6},children:K?"Reading AWB label with local OCR...":"Saving barcode scan..."})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(t=>e.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:t}),e.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),e.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},t)),e.jsx("div",{style:{textAlign:"center",marginTop:8},children:e.jsx("button",{className:"btn btn-outline",style:{fontSize:"0.75rem",padding:"8px 20px"},onClick:()=>{u("Cancelled by user."),d(a.ERROR)},children:"Cancel"})})]})}),e.jsx("div",{className:de(a.REVIEWING),children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%"},children:[e.jsxs("div",{style:{padding:"14px 20px",borderBottom:`1px solid ${i.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.65rem",color:i.muted,fontWeight:600},children:"REVIEW EXTRACTION"}),e.jsx("div",{className:"mono",style:{fontSize:"0.95rem",fontWeight:700},children:(o==null?void 0:o.awb)||F})]}),(I==null?void 0:I.learnedFieldCount)>0&&e.jsxs("div",{className:"source-badge source-learned",children:["AI ",I.learnedFieldCount," auto-corrected"]})]}),e.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsxs("div",{className:`field-card ${(((Vt=xe.clientCode)==null?void 0:Vt.confidence)||0)<.55?"warning":""}`,children:[e.jsx("div",{className:St(((Ht=xe.clientCode)==null?void 0:Ht.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((Qt=xe.clientCode)==null?void 0:Qt.source)&&(()=>{const t=Sn(xe.clientCode.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:g.clientCode||"",onChange:t=>M(n=>({...n,clientCode:t.target.value.toUpperCase()})),placeholder:"Client code"}),((Yt=I==null?void 0:I.clientMatches)==null?void 0:Yt.length)>0&&I.clientNeedsConfirmation&&e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:I.clientMatches.slice(0,3).map(t=>e.jsxs("button",{onClick:()=>M(n=>({...n,clientCode:t.code})),style:{fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:`1px solid ${i.border}`,background:g.clientCode===t.code?i.primaryLight:i.surface,color:i.text,cursor:"pointer",fontFamily:"inherit",fontWeight:500},children:[t.code," (",Math.round(t.score*100),"%)"]},t.code))})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:St(((Kt=xe.consignee)==null?void 0:Kt.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Consignee"}),e.jsx("input",{className:"field-input",value:g.consignee||"",onChange:t=>M(n=>({...n,consignee:t.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:St(((Xt=xe.destination)==null?void 0:Xt.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((Jt=xe.destination)==null?void 0:Jt.source)&&(()=>{const t=Sn(xe.destination.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:g.destination||"",onChange:t=>M(n=>({...n,destination:t.target.value.toUpperCase()})),placeholder:"City"}),(I==null?void 0:I.pincodeCity)&&I.pincodeCity!==g.destination&&e.jsxs("button",{onClick:()=>M(t=>({...t,destination:I.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:i.successLight,color:i.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["ðŸ“ Pincode suggests: ",I.pincodeCity]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Pincode"}),e.jsx("input",{className:"field-input",value:g.pincode||"",onChange:t=>M(n=>({...n,pincode:t.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),e.jsx("div",{className:`field-card ${(Zt=I==null?void 0:I.weightAnomaly)!=null&&Zt.anomaly?"warning":""}`,children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Weight (kg)"}),e.jsx("input",{className:"field-input",value:g.weight||"",onChange:t=>M(n=>({...n,weight:t.target.value})),placeholder:"0.0",inputMode:"decimal"}),((en=I==null?void 0:I.weightAnomaly)==null?void 0:en.anomaly)&&e.jsxs("div",{style:{fontSize:"0.6rem",color:i.warning,marginTop:2,fontWeight:500},children:["Warning: ",I.weightAnomaly.warning]})]})})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Amount (â‚¹)"}),e.jsx("input",{className:"field-input",value:g.amount||"",onChange:t=>M(n=>({...n,amount:t.target.value})),placeholder:"0",inputMode:"decimal"})]})}),e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Order No"}),e.jsx("input",{className:"field-input",value:g.orderNo||"",onChange:t=>M(n=>({...n,orderNo:t.target.value})),placeholder:"Optional"})]})})]})]}),e.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${i.border}`,display:"flex",gap:10},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:$e,children:[e.jsx(ss,{size:16})," Skip"]}),e.jsxs("button",{"data-testid":"approve-save-btn",className:"btn btn-success btn-lg",style:{flex:2},onClick:Ln,disabled:v===a.APPROVING,children:[v===a.APPROVING?e.jsx(ft,{size:16,style:{animation:"spin 1s linear infinite"}}):e.jsx(ln,{size:16}),v===a.APPROVING?"Saving...":"Approve & Save"]})]})]})}),e.jsx("div",{className:de(a.APPROVING)}),e.jsx("div",{className:de(a.SUCCESS),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[e.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:i.success,strokeWidth:"3",className:"success-check-circle"}),e.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:i.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:i.success,marginBottom:4},children:"Saved Successfully"}),e.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700},children:z==null?void 0:z.awb}),(z==null?void 0:z.clientCode)&&e.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:i.primaryLight,color:i.primary,fontSize:"0.78rem",fontWeight:600},children:z.clientName||z.clientCode})]}),e.jsx("div",{style:{fontSize:"0.72rem",color:i.muted},children:z!=null&&z.offlineQueued?`${k.length} queued for sync - Auto-continuing in ${Pt}s`:`#${_.scanNumber} scanned - Auto-continuing in ${Pt}s`}),e.jsxs("button",{"data-testid":"scan-next-btn",className:"btn btn-primary btn-lg btn-full",onClick:()=>$e(A==="fast"?a.SCANNING:a.IDLE),style:{maxWidth:320},children:[e.jsx(xt,{size:18})," ",A==="fast"?"Keep Scanning":"Scan Next Parcel"]})]})}),e.jsx("div",{className:de(a.ERROR),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(nn,{size:32,color:i.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:i.error},children:"Scan Error"}),e.jsx("div",{style:{fontSize:"0.82rem",color:i.muted,marginTop:4},children:E})]}),e.jsxs("button",{className:"btn btn-primary",onClick:$e,children:[e.jsx(un,{size:16})," Try Again"]})]})}),b==="disconnected"&&v!==a.IDLE&&e.jsxs("div",{className:"offline-banner",children:[e.jsx(sn,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline â€” Reconnecting... ",k.length?`(${k.length} queued)`:""]})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{Ts as default};
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/index-4oYbt_M2.js","assets/index-D3Mz4UNV.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
