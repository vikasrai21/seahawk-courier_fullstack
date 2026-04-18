import{l as Wn,_ as Yt}from"./index-BL_r5Br-.js";import{j as e}from"./page-landing-CREvANXP.js";import{r as s}from"./vendor-helmet-Dwc3L0SQ.js";import{r as Pn,n as Ln}from"./barcode-yEOY_efB.js";import{c as Dn,u as $n}from"./vendor-react-DrB23wtn.js";import{b as Xt,R as mt,aS as Zt,V as Un,aL as Jt,aM as ht,Z as en,aG as gt,B as Gn,aN as qn,ab as Vn,d as tn,a6 as Hn,z as nn,aO as sn,aR as rn,aP as Qn,aQ as Kn,a3 as Yn,a0 as an,O as Xn,X as Zn}from"./vendor-icons-_vZM4mPL.js";import"./page-import-PlU4c2WE.js";import"./page-reconcile-DaV-jqNQ.js";import"./page-rate-calc-BqvTJtQC.js";function yn(o,p){var B,M;try{if(!o||!p)return null;const A=Number(o.videoWidth||0),h=Number(o.videoHeight||0);if(!A||!h)return null;const g=(B=o.getBoundingClientRect)==null?void 0:B.call(o),T=(M=p.getBoundingClientRect)==null?void 0:M.call(p);if(!g||!T)return null;const x=Number(g.width||0),L=Number(g.height||0);if(!x||!L)return null;const z=Math.max(x/A,L/h),m=A*z,y=h*z,Q=(x-m)/2,E=(L-y)/2,Z=T.left-g.left,G=T.top-g.top,ie=T.right-g.left,Fe=T.bottom-g.top,ae=(Z-Q)/z,c=(G-E)/z,oe=(ie-Q)/z,d=(Fe-E)/z,F=(C,Ne,xe)=>Math.max(Ne,Math.min(xe,C)),k=F(Math.min(ae,oe),0,A),P=F(Math.min(c,d),0,h),fe=F(Math.max(ae,oe),0,A),J=F(Math.max(c,d),0,h),ue=Math.max(0,fe-k),ce=Math.max(0,J-P);return!ue||!ce?null:{x:k,y:P,w:ue,h:ce}}catch{return null}}var Jn={};const es=window.location.origin,on={w:"90vw",h:"18vw"},Ye={w:"92vw",h:"130vw"},cn=3500,ln=900,ts=1e4,ns="mobile_scanner_offline_queue",dn="mobile_scanner_workflow_mode",un="mobile_scanner_device_profile",ss=80,rs=1100,is=3,ft=160,Xe=2,xt=45,bt=2,as=500,pn=960,ve=.68,os=String(Jn.VITE_PREFER_ZXING_FOR_TRACKON||"1")!=="0",cs=900,U={phone:"phone-camera",rugged:"rugged-scanner"},yt=["code_128","code_39","code_93","codabar","ean_13","ean_8","itf","qr_code"],i={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"},ls=o=>{var p;try{(p=navigator==null?void 0:navigator.vibrate)==null||p.call(navigator,o)}catch{}},mn={tap:[20],lock:[24,24,24],success:[18,28,72],warning:[70,50,70],retry:[28,40,28],error:[110,55,110],duplicate:[90,50,90,50,90]},R=(o="tap")=>{ls(mn[o]||mn.tap)},Je=(o,p,B="sine")=>{try{const M=new(window.AudioContext||window.webkitAudioContext),A=M.createOscillator(),h=M.createGain();A.type=B,A.frequency.setValueAtTime(o,M.currentTime),h.gain.setValueAtTime(.12,M.currentTime),h.gain.exponentialRampToValueAtTime(.01,M.currentTime+p),A.connect(h),h.connect(M.destination),A.start(),A.stop(M.currentTime+p)}catch{}},Ze=()=>{Je(880,.12),setTimeout(()=>Je(1100,.1),130)},hn=()=>Je(600,.08),Se=()=>Je(200,.25,"sawtooth"),gn=o=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const p=new SpeechSynthesisUtterance(o);p.rate=1.2,p.pitch=1,p.lang="en-IN",window.speechSynthesis.speak(p)}catch{}},fn=()=>{var o;try{if(typeof window>"u")return!1;if(window.isSecureContext)return!0;const p=((o=window.location)==null?void 0:o.hostname)||"";return p==="localhost"||p==="127.0.0.1"}catch{return!1}},xn=(o=[])=>{if(!o.length)return"";const p=[];return o.includes("blur")&&p.push("hold steady"),o.includes("glare")&&p.push("reduce glare"),o.includes("angle")&&p.push("straighten angle"),o.includes("dark")&&p.push("add light"),o.includes("low_edge")&&p.push("fill frame"),p.length?`Improve capture: ${p.join(", ")}.`:""},ds=(o,p)=>{if(!o||!p||!o.videoWidth||!o.videoHeight)return null;const B=yn(o,p);if(!B)return null;const M=Math.max(0,Math.floor(B.x)),A=Math.max(0,Math.floor(B.y)),h=Math.max(24,Math.floor(B.w)),g=Math.max(24,Math.floor(B.h)),T=128,x=96,L=document.createElement("canvas");L.width=T,L.height=x;const z=L.getContext("2d",{willReadFrequently:!0});if(!z)return null;z.drawImage(o,M,A,Math.min(h,o.videoWidth-M),Math.min(g,o.videoHeight-A),0,0,T,x);const m=z.getImageData(0,0,T,x).data,y=T*x,Q=new Float32Array(y);let E=0,Z=0,G=0;for(let f=0,q=0;f<m.length;f+=4,q+=1){const w=.2126*m[f]+.7152*m[f+1]+.0722*m[f+2];Q[q]=w,E+=w,w>=245&&(Z+=1),w<=24&&(G+=1)}let ie=0,Fe=0,ae=0,c=0,oe=0,d=0;const F=Math.max(4,Math.floor(x*.15)),k=Math.max(4,Math.floor(T*.15)),P=T;for(let f=1;f<x-1;f+=1)for(let q=1;q<T-1;q+=1){const w=f*P+q,Ae=Q[w],ke=Q[w-1],ye=Q[w+1],Be=Q[w-P],Me=Q[w+P],et=Math.abs(ye-ke),Oe=Math.abs(Me-Be),Y=et+Oe,We=Math.abs(4*Ae-ke-ye-Be-Me);ie+=We,Y>58&&(Fe+=1),f<=F&&(ae+=Y),f>=x-F&&(c+=Y),q<=k&&(oe+=Y),q>=T-k&&(d+=Y)}const fe=Math.max(1,(T-2)*(x-2)),J=E/y,ue=ie/fe,ce=Fe/fe,C=Z/y,Ne=G/y,xe=Math.abs(ae-c)/Math.max(1,ae+c),Re=Math.abs(oe-d)/Math.max(1,oe+d),be=Math.max(xe,Re),K=[];return ue<22&&K.push("blur"),C>.18&&K.push("glare"),(Ne>.55||J<40)&&K.push("dark"),ce<.08&&K.push("low_edge"),be>.62&&K.push("angle"),{ok:K.length===0,issues:K,metrics:{brightness:Number(J.toFixed(1)),blurScore:Number(ue.toFixed(1)),glareRatio:Number((C*100).toFixed(1)),edgeRatio:Number((ce*100).toFixed(1)),perspectiveSkew:Number((be*100).toFixed(1))}}},r={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",mutedLight:"#9CA3AF",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},us=`
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
`,ps=o=>o>=.85?"high":o>=.55?"med":"low",Ct=o=>`conf-dot conf-${ps(o)}`,bn=o=>o==="learned"?{className:"source-badge source-learned",icon:"AI",text:"Learned"}:o==="fuzzy_match"?{className:"source-badge source-ai",icon:"ðŸ”",text:"Matched"}:o==="fuzzy_history"||o==="consignee_pattern"?{className:"source-badge source-history",icon:"ðŸ“Š",text:"History"}:o==="delhivery_pincode"||o==="india_post"||o==="pincode_lookup"||o==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"ðŸ“",text:"Pincode"}:null,ms=o=>{const p=Math.floor(o/6e4);return p<60?`${p}m`:`${Math.floor(p/60)}h ${p%60}m`};function ks(){var Wt,Pt,Lt,Dt,$t,Ut,Gt,qt,Vt,Ht,Qt,Kt;const{pin:o}=Dn(),p=$n(),B=`${ns}:${o||"unknown"}`,M=s.useMemo(()=>`mobile_scanner_daily_count:${new Date().toISOString().slice(0,10)}`,[]),A=s.useMemo(()=>{try{return typeof window>"u"?"":new URLSearchParams(window.location.search).get("mockBarcodeRaw")||""}catch{return""}},[]),h=s.useMemo(()=>{try{if(typeof window>"u")return!1;const t=new URLSearchParams(window.location.search);return t.get("mock")==="1"||t.get("e2e")==="1"}catch{return!1}},[]),[g,T]=s.useState(null),[x,L]=s.useState("connecting"),[z,m]=s.useState(""),[y,Q]=s.useState(i.IDLE),[E,Z]=s.useState(""),[G,ie]=s.useState(null),[Fe,ae]=s.useState({}),[c,oe]=s.useState(null),[d,F]=s.useState({}),[k,P]=s.useState(null),[fe,J]=s.useState(null),[ue,ce]=s.useState(""),[C,Ne]=s.useState([]),[xe,Re]=s.useState(!1),[be,K]=s.useState(0),[f,q]=s.useState({ok:!1,issues:[],metrics:null}),[w,Ae]=s.useState({kb:0,width:0,height:0,quality:ve}),[ke,ye]=s.useState(!1),[Be,Me]=s.useState("0m"),[et,Oe]=s.useState("Connected"),[Y,We]=s.useState(""),[tt,Cn]=s.useState(!1),[wt,nt]=s.useState("idle"),[ee,vt]=s.useState(null),[wn,vn]=s.useState(0),[st,Sn]=s.useState(0),[St,rt]=s.useState(null),[Ce,it]=s.useState("barcode"),[v,at]=s.useState(()=>{if(typeof window>"u")return"fast";try{const t=localStorage.getItem(dn);if(t==="fast"||t==="ocr")return t}catch{}return h?"ocr":"fast"}),[D,Nt]=s.useState(()=>{if(typeof window>"u")return U.phone;try{const t=localStorage.getItem(un);if(t===U.phone||t===U.rugged)return t}catch{}return U.phone}),Pe=s.useRef(0),[I,ot]=s.useState({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now(),scannedItems:[]}),[Le,Nn]=s.useState(!1),$=s.useRef(null),ct=s.useRef(null),te=s.useRef(null),pe=s.useRef(null),le=s.useRef(!1),De=s.useRef(null),kn=s.useRef(!1),me=s.useRef(i.IDLE),$e=s.useRef(null),we=s.useRef(0),ne=s.useRef(null),kt=s.useRef(new Set),Ie=s.useRef([]),Ue=s.useRef({awb:"",hits:0,lastSeenAt:0}),jt=s.useRef(0),Te=s.useRef(!1),Et=s.useRef(0),Ge=s.useRef(null),lt=s.useRef({message:"",at:0}),se=s.useRef({lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]}),u=s.useCallback(t=>{Q(t)},[]),O=s.useCallback(t=>{Pe.current=t,vn(t)},[]),V=s.useCallback(t=>{jt.current=t,Sn(t)},[]),dt=s.useCallback((t,n="warning")=>{if(!t)return;const a=Date.now();lt.current.message===t&&a-lt.current.at<cs||(lt.current={message:t,at:a},m(t),n&&R(n))},[]),Ft=s.useCallback(t=>{O(0),V(0),it("document"),m(t||'No barcode lock yet. Capture label instead or tap "Back to barcode mode" and hold steady.'),R("warning")},[O,V]),ze=s.useCallback(()=>{const t=jt.current+1;if(t<=Xe){V(t),O(0),m(`No lock yet. Reframe ${t}/${Xe}: move closer, reduce glare, keep barcode horizontal.`),R("retry");return}Ft("No stable barcode lock after reframe retries. Capture label for OCR fallback.")},[Ft,O,V]),jn=s.useCallback(()=>{Z(""),m(""),u(i.CAPTURING)},[u]),Rt=s.useCallback(t=>{const n=Date.now(),a=Ie.current.filter(b=>n-b.at<=rs);a.push({awb:t,at:n}),Ie.current=a;const l=a.reduce((b,_)=>_.awb===t?b+1:b,0);return Ue.current={awb:t,hits:l,lastSeenAt:n},l>=is},[]),de=s.useCallback(async()=>{var a;if(!fn())throw new Error("Camera requires HTTPS (or localhost). Open this page over https:// on your phone.");if(!((a=navigator==null?void 0:navigator.mediaDevices)!=null&&a.getUserMedia))throw new Error("Camera not supported on this browser/device.");if(!$.current)throw new Error("Camera element not ready.");const t=$.current.srcObject;if(t&&typeof t.getTracks=="function"&&t.getTracks().some(b=>b.readyState==="live")){await $.current.play();return}let n=null;try{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}$.current.srcObject=n,await $.current.play()},[]);s.useEffect(()=>{const t=setInterval(()=>Me(ms(Date.now()-I.startedAt)),3e4);return()=>clearInterval(t)},[I.startedAt]);const qe=s.useCallback(t=>{Ne(t);try{t.length?localStorage.setItem(B,JSON.stringify(t)):localStorage.removeItem(B)}catch{}},[B]),Ve=s.useCallback(t=>{const n={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:t};return qe([...C,n]),n},[C,qe]),He=s.useCallback(()=>{!g||!g.connected||!C.length||(C.forEach(t=>{var n;(n=t==null?void 0:t.payload)!=null&&n.awb&&g.emit("scanner:scan",t.payload)}),qe([]))},[g,C,qe]),X=s.useCallback(t=>{ot(n=>{const a={...n,scannedItems:[{...t,time:Date.now()},...n.scannedItems]};try{localStorage.setItem(M,String(a.scanNumber))}catch{}return a})},[M]),En=s.useCallback(()=>{if(x!=="paired"){m("Phone is not connected to the desktop session.");return}if(m(""),h){u(i.SCANNING);return}de().then(()=>u(i.SCANNING)).catch(t=>m((t==null?void 0:t.message)||"Camera access failed."))},[x,de,u,h]),Fn=s.useCallback(t=>{t==null||t.preventDefault();const n=Y.trim().toUpperCase();if(!n||n.length<6){m("Enter a valid AWB number (min 6 chars)");return}if(x!=="paired"){m("Not connected to desktop session.");return}if(m(""),We(""),Z(n),h){ye(!0),u(i.CAPTURING);return}de().then(()=>u(i.CAPTURING)).catch(a=>m((a==null?void 0:a.message)||"Camera access failed."))},[Y,x,de,u,h]),Rn=s.useCallback(()=>{window.confirm("End this mobile scanner session on the phone?")&&(g!=null&&g.connected?g.emit("scanner:end-session",{reason:"Mobile ended the session"}):p("/"))},[g,p]),An=s.useCallback(()=>{if(C.length>0){He();return}window.alert("Everything is already synced.")},[C.length,He]);s.useEffect(()=>{me.current=y},[y]),s.useEffect(()=>{if(h){L("paired"),Oe("Mock Mode"),m(""),u(i.IDLE);return}if(!o){m("No PIN provided.");return}const t=Wn(es,{auth:{scannerPin:o},transports:["websocket","polling"],reconnection:!0,reconnectionDelay:1500,reconnectionAttempts:20});return t.on("connect",()=>L("connecting")),t.on("scanner:paired",({userEmail:n})=>{L("paired"),Oe(n?n.split("@")[0]:"Connected"),m(""),u(i.IDLE)}),t.on("scanner:error",({message:n})=>{m(n),L("disconnected")}),t.on("scanner:session-ended",({reason:n})=>{L("disconnected"),m(n||"Session ended by desktop."),p("/")}),t.on("disconnect",()=>L("disconnected")),t.on("reconnect",()=>{x==="paired"&&u(i.SCANNING)}),t.on("scanner:scan-processed",n=>{if(n.status==="error"){J("error"),Se(),R("error"),u(i.ERROR),m(n.error||"Scan failed on desktop.");return}if(oe(n),F({clientCode:n.clientCode||"",consignee:n.consignee||"",destination:n.destination||"",pincode:n.pincode||"",weight:n.weight||0,amount:n.amount||0,orderNo:n.orderNo||""}),ae({}),n.reviewRequired)u(i.REVIEWING);else{Ze(),R("success");const a={awb:n.awb,clientCode:n.clientCode,clientName:n.clientName,destination:n.destination||"",weight:n.weight||0};P(a),X(a),u(i.SUCCESS)}}),t.on("scanner:approval-result",({success:n,message:a,awb:l})=>{if(n){Ze(),R("success"),J("success");const b={awb:(c==null?void 0:c.awb)||l,clientCode:d.clientCode,clientName:(c==null?void 0:c.clientName)||d.clientCode,destination:d.destination||"",weight:parseFloat(d.weight)||0};P(b),X(b),u(i.SUCCESS)}else Se(),R("error"),m(a||"Approval failed.")}),t.on("scanner:ready-for-next",()=>{}),T(t),()=>{t.disconnect()}},[o,X,c,d,u,p,h]),s.useEffect(()=>{try{const t=localStorage.getItem(B);if(!t)return;const n=JSON.parse(t);Array.isArray(n)&&n.length&&Ne(n)}catch{}},[B]),s.useEffect(()=>{try{localStorage.setItem(dn,v)}catch{}},[v]),s.useEffect(()=>{try{localStorage.setItem(un,D)}catch{}},[D]),s.useEffect(()=>{x==="paired"&&(g!=null&&g.connected)&&C.length&&He()},[x,g,C.length,He]);const je=s.useCallback(async()=>{var t;try{if(ye(!1),pe.current){try{const n=pe.current;n!=null&&n.barcodeScanner&&await n.barcodeScanner.dispose()}catch{}pe.current=null}if(te.current){try{await te.current.reset()}catch{}te.current=null}(t=$.current)!=null&&t.srcObject&&($.current.srcObject.getTracks().forEach(n=>n.stop()),$.current.srcObject=null)}catch{}},[]),Ee=s.useCallback(async()=>{try{if(nt("idle"),pe.current){try{await pe.current.barcodeScanner.dispose()}catch{}pe.current=null}if(te.current){try{te.current._type==="native"?te.current.reset():await te.current.reset()}catch{}te.current=null}}catch{}},[]),At=s.useCallback(async()=>{if($.current){await Ee();try{if(we.current=Date.now(),await de(),os){const[{BrowserMultiFormatReader:t},n]=await Promise.all([Yt(()=>import("./index-4oYbt_M2.js"),__vite__mapDeps([0,1])),Yt(()=>import("./index-D3Mz4UNV.js"),__vite__mapDeps([]))]),a=new Map([[n.DecodeHintType.POSSIBLE_FORMATS,[n.BarcodeFormat.CODE_128,n.BarcodeFormat.ITF,n.BarcodeFormat.CODE_39,n.BarcodeFormat.CODE_93,n.BarcodeFormat.CODABAR,n.BarcodeFormat.EAN_13,n.BarcodeFormat.EAN_8]],[n.DecodeHintType.TRY_HARDER,!0],[n.DecodeHintType.ASSUME_GS1,!1],[n.DecodeHintType.CHARACTER_SET,"UTF-8"]]),l=new t(a,40);nt("zxing"),te.current=l,l.decodeFromVideoElement($.current,b=>{var _,j,W;if(!le.current)if(b){O(0);let H="unknown";try{H=String(((_=b.getBarcodeFormat)==null?void 0:_.call(b))||"unknown")}catch{}vt({value:((j=b.getText)==null?void 0:j.call(b))||"",format:H,engine:"zxing",at:Date.now(),sinceStartMs:we.current?Date.now()-we.current:null,candidateCount:1,ambiguous:!1,alternatives:[]}),(W=ne.current)==null||W.call(ne,b.getText(),{candidateCount:1,ambiguous:!1,alternatives:[],format:H,engine:"zxing"})}else{const H=Pe.current+1;O(H),H>=ft&&ze()}});return}if(typeof window.BarcodeDetector<"u"){let t=!0,n=yt;try{const a=await window.BarcodeDetector.getSupportedFormats();n=yt.filter(l=>a.includes(l)),n.length||(n=yt)}catch{}if(n.includes("itf")||(console.log("[MobileScanner] Native BarcodeDetector lacks ITF, falling back to ZXing"),t=!1),t){nt("native");const a=new window.BarcodeDetector({formats:n});let l=null,b=!1;const _=async()=>{var W;if(b||me.current!==i.SCANNING)return;if(le.current){l=setTimeout(_,xt);return}const j=$.current;if(!j||j.readyState<2){l=setTimeout(_,xt);return}try{const H=await a.detect(j),ge=H.map(N=>String((N==null?void 0:N.rawValue)||"").trim()).filter(Boolean);if(ge.length>0){const N=Pn(ge),ut=N.awb||ge[0];O(0),vt({value:ut,format:String(H[0].format||"unknown"),engine:"native",at:Date.now(),sinceStartMs:we.current?Date.now()-we.current:null,candidateCount:ge.length,ambiguous:N.ambiguous,alternatives:N.alternatives}),(W=ne.current)==null||W.call(ne,ut,{candidateCount:ge.length,ambiguous:N.ambiguous,alternatives:N.alternatives,format:String(H[0].format||"unknown"),engine:"native"})}else{const N=Pe.current+1;O(N),N>=ft&&ze()}}catch{}me.current===i.SCANNING&&(l=setTimeout(_,xt))};te.current={_type:"native",reset:()=>{b=!0,l&&clearTimeout(l),l=null}},setTimeout(_,220);return}}throw new Error("Unable to initialize a barcode scanner on this device.")}catch(t){m("Camera access failed: "+t.message)}}},[de,Ee,ze,O]),It=s.useCallback((t,n={})=>{var _;const a=String(t||"").trim().replace(/\s+/g,"").toUpperCase(),l=Ln(t)||a;if(le.current||me.current!==i.SCANNING)return;if(!l||l.length<8){a.replace(/[^A-Z0-9]/g,"").length>=4&&dt("Partial barcode detected. Move closer so full AWB is visible.");return}if(n!=null&&n.ambiguous){const j=Pe.current+1;O(j),dt("Multiple barcodes detected. Keep only the AWB barcode inside the strip.","retry"),j>=ft&&ze();return}if(!h&&!Rt(l))return;if(le.current=!0,kt.current.has(l)){R("duplicate"),Se(),ce(l),setTimeout(()=>{ce(""),le.current=!1,Ue.current={awb:"",hits:0,lastSeenAt:0},Ie.current=[]},2500);return}clearTimeout($e.current),R("lock"),hn(),Z(l);const b=we.current?Date.now()-we.current:null;if(rt(b),se.current={lockTimeMs:b,candidateCount:Number((n==null?void 0:n.candidateCount)||1),ambiguous:!!(n!=null&&n.ambiguous),alternatives:Array.isArray(n==null?void 0:n.alternatives)?n.alternatives.slice(0,3):[]},V(0),O(0),m(""),ot(j=>{const W={...j,scanNumber:j.scanNumber+1};return W.scannedAwbs=new Set(j.scannedAwbs),W.scannedAwbs.add(l),kt.current=W.scannedAwbs,W}),v==="fast"){(_=Ge.current)==null||_.call(Ge,l);return}$e.current=setTimeout(()=>{me.current===i.SCANNING&&u(i.CAPTURING)},ss)},[u,Rt,v,h,O,V,dt,ze]);s.useEffect(()=>{ne.current=It},[It]),s.useEffect(()=>{if(y===i.SCANNING&&(le.current=!1,Ue.current={awb:"",hits:0,lastSeenAt:0},Ie.current=[],se.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},rt(null),V(0),O(0),it("barcode"),At(),h&&A)){const t=setTimeout(()=>{var n;me.current===i.SCANNING&&((n=ne.current)==null||n.call(ne,A))},50);return()=>clearTimeout(t)}return()=>{y===i.SCANNING&&Ee()}},[y,At,Ee,O,V,h,A]);const Tt=s.useCallback(async()=>{if(h){ye(!0);return}await Ee();try{await de(),ye(!0)}catch(t){m("Camera access failed: "+t.message)}},[de,Ee,h]);s.useEffect(()=>{y===i.CAPTURING&&Tt()},[y,Tt]);const Qe=s.useCallback(()=>{const t=$.current,n=ct.current;return ds(t,n)},[]);s.useEffect(()=>{if(y!==i.CAPTURING){Re(!1),K(0),q({ok:!1,issues:[],metrics:null}),kn.current=!1,Te.current=!1;return}const t=setInterval(()=>{const n=Qe();n&&(q(n),Re(n.ok),K(a=>{const l=n.ok?Math.min(a+1,8):0;return l>=bt&&!Te.current&&(R("tap"),Te.current=!0),n.ok||(Te.current=!1),l}))},280);return()=>clearInterval(t)},[y,Qe]);const zt=s.useCallback((t={})=>{const n=$.current,a=ct.current;if(!n||!a||!n.videoWidth)return null;const l=yn(n,a);if(!l)return null;const b=l.x,_=l.y,j=l.w,W=l.h;if(!j||!W)return null;const H=Math.max(640,Number(t.maxWidth||pn)),ge=Math.min(.85,Math.max(.55,Number(t.quality||ve))),N=document.createElement("canvas");N.width=Math.min(H,Math.round(j)),N.height=Math.round(N.width/j*W),N.getContext("2d").drawImage(n,b,_,j,W,0,0,N.width,N.height);const pt=N.toDataURL("image/jpeg",ge).split(",")[1]||"";if(!pt)return null;const On=Math.floor(pt.length*3/4);return{base64:pt,width:N.width,height:N.height,approxBytes:On,quality:ge}},[]),In=s.useCallback(()=>{const t=Date.now();if(t-Et.current<as)return;Et.current=t;const n=Qe()||f;if(!(n!=null&&n.ok)||be<bt){m(xn(n==null?void 0:n.issues)||"Capture quality is low. Hold steady and align the AWB in the frame."),R("warning"),Se();return}J("white"),hn(),R("tap");const a=zt({maxWidth:pn,quality:ve});if(!(a!=null&&a.base64)){m("Could not capture image. Try again."),le.current=!1;return}Ae({kb:Math.round((a.approxBytes||0)/1024),width:a.width||0,height:a.height||0,quality:a.quality||ve}),ie(`data:image/jpeg;base64,${a.base64}`),je(),u(i.PREVIEW)},[zt,je,u,Qe,f,be]),Tn=s.useCallback(()=>{if(!h)return;const t="data:image/jpeg;base64,ZmFrZS1tb2NrLWltYWdl";Ae({kb:0,width:0,height:0,quality:ve}),ie(t),je(),u(i.PREVIEW)},[u,h,je]),Ke=s.useCallback(()=>{var t,n,a;return{scanNumber:I.scanNumber,recentClient:I.dominantClient,dominantClient:I.dominantClient,dominantClientCount:I.dominantClientCount,sessionDurationMin:Math.round((Date.now()-I.startedAt)/6e4),scanWorkflowMode:v,scanMode:Ce,deviceProfile:D,hardwareClass:D===U.rugged?"rugged":"phone",captureQuality:{ok:!!f.ok,issues:Array.isArray(f.issues)?f.issues.slice(0,8):[],metrics:f.metrics||null},captureMeta:{kb:w.kb||0,width:w.width||0,height:w.height||0,quality:w.quality||ve},lockTimeMs:Number.isFinite(Number((t=se.current)==null?void 0:t.lockTimeMs))?Number(se.current.lockTimeMs):null,lockCandidateCount:Number.isFinite(Number((n=se.current)==null?void 0:n.candidateCount))?Number(se.current.candidateCount):1,lockAlternatives:Array.isArray((a=se.current)==null?void 0:a.alternatives)?se.current.alternatives.slice(0,3):[]}},[I,v,Ce,D,f,w]),_t=s.useCallback(t=>{const n=String(t||"").trim().toUpperCase();if(!n)return;if(u(i.PROCESSING),h){setTimeout(()=>{const l={awb:n,clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25};P(l),X(l),u(i.SUCCESS)},120);return}const a={awb:n,imageBase64:null,focusImageBase64:null,scanMode:"fast_barcode_only",sessionContext:Ke()};if(!g||!g.connected||x!=="paired"){Ve(a),Ze(),R("success");const l={awb:n,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};P({...l,offlineQueued:!0}),X(l),u(i.SUCCESS);return}g.emit("scanner:scan",a),setTimeout(()=>{me.current===i.PROCESSING&&(m("Barcode processing timed out. Please try scanning again."),Se(),R("error"),u(i.ERROR))},ts)},[g,x,u,h,Ve,X,Ke]);s.useEffect(()=>{Ge.current=_t},[_t]);const zn=s.useCallback(()=>{if(!G)return;if(u(i.PROCESSING),h){setTimeout(()=>{const a={awb:E||"100454974120",clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25};P(a),X(a),u(i.SUCCESS)},250);return}const t=G.split(",")[1]||G,n={awb:E||"",imageBase64:t,focusImageBase64:t,scanMode:"ocr_label",sessionContext:Ke()};if(!g||!g.connected||x!=="paired"){Ve(n),Ze(),R("success");const a={awb:E||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};P({...a,offlineQueued:!0}),X(a),u(i.SUCCESS);return}g.emit("scanner:scan",n),setTimeout(()=>{me.current===i.PROCESSING&&(m("OCR timed out after 40 seconds. Retake the label photo and try again."),Se(),R("error"),u(i.ERROR))},4e4)},[g,E,G,u,x,Ve,X,h,Ke]),_n=s.useCallback(()=>{var t;if(c){if(u(i.APPROVING),h){setTimeout(()=>{const n={awb:c.awb||E,clientCode:d.clientCode||"MOCKCL",clientName:c.clientName||d.clientCode||"Mock Client",destination:d.destination||"",weight:parseFloat(d.weight)||0};P(n),X(n),J("success"),u(i.SUCCESS)},200);return}if(g){if(c.ocrExtracted||c){const n={clientCode:c.clientCode||"",clientName:c.clientName||"",consignee:c.consignee||"",destination:c.destination||""},a={clientCode:d.clientCode||"",clientName:d.clientCode||"",consignee:d.consignee||"",destination:d.destination||""};g.emit("scanner:learn-corrections",{pin:o,ocrFields:n,approvedFields:a,courier:(c==null?void 0:c.courier)||((t=c==null?void 0:c.ocrExtracted)==null?void 0:t.courier)||"",deviceProfile:D})}g.emit("scanner:approval-submit",{shipmentId:c.shipmentId,awb:c.awb||E,fields:{clientCode:d.clientCode,consignee:d.consignee,destination:d.destination,pincode:d.pincode,weight:parseFloat(d.weight)||0,amount:parseFloat(d.amount)||0,orderNo:d.orderNo||""}},n=>{n!=null&&n.success||(u(i.REVIEWING),Se(),R("error"),m((n==null?void 0:n.message)||"Approval failed."))}),d.clientCode&&d.clientCode!=="MISC"&&ot(n=>{var b,_;const a={...n.clientFreq};a[d.clientCode]=(a[d.clientCode]||0)+1;const l=Object.entries(a).sort((j,W)=>W[1]-j[1]);return{...n,clientFreq:a,dominantClient:((b=l[0])==null?void 0:b[1])>=2?l[0][0]:null,dominantClientCount:((_=l[0])==null?void 0:_[1])||0}})}}},[g,c,d,E,o,u,X,h,D]),_e=s.useCallback((t=i.IDLE)=>{clearTimeout(De.current),clearTimeout($e.current),Z(""),ie(null),Ae({kb:0,width:0,height:0,quality:ve}),oe(null),F({}),ae({}),P(null),rt(null),m(""),ce(""),Re(!1),K(0),q({ok:!1,issues:[],metrics:null}),le.current=!1,Ue.current={awb:"",hits:0,lastSeenAt:0},Ie.current=[],se.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},Te.current=!1,V(0),u(t)},[u,V]);s.useEffect(()=>{if(y===i.SUCCESS){const t=v==="fast"?i.SCANNING:i.IDLE,n=v==="fast"?ln:cn;return De.current=setTimeout(()=>_e(t),n),()=>clearTimeout(De.current)}},[y,_e,v]),s.useEffect(()=>{if(Le)if(y===i.REVIEWING&&c){const t=[c.clientName||c.clientCode,c.destination,c.weight?`${c.weight} kilograms`:""].filter(Boolean);t.length&&gn(t.join(". "))}else y===i.SUCCESS&&k&&gn(`${k.clientName||k.clientCode||"Shipment"} Verified.`)},[Le,y,c,k]),s.useEffect(()=>()=>{je(),clearTimeout(De.current),clearTimeout($e.current)},[je]);const re=t=>`msp-step ${y===t?"active":""}`,Bt=Math.max(1,Math.round((v==="fast"?ln:cn)/1e3)),Bn=f.ok?"AWB quality looks good - press shutter":xn(f.issues)||"Fit AWB slip fully in frame and hold steady",Mt=ke&&f.ok&&be>=bt,he=s.useMemo(()=>{if(!c)return{};const t=c.ocrExtracted||c;return{clientCode:{confidence:(t==null?void 0:t.clientNameConfidence)||0,source:(t==null?void 0:t.clientNameSource)||null},consignee:{confidence:(t==null?void 0:t.consigneeConfidence)||0,source:(t==null?void 0:t.consigneeSource)||null},destination:{confidence:(t==null?void 0:t.destinationConfidence)||0,source:(t==null?void 0:t.destinationSource)||null},pincode:{confidence:(t==null?void 0:t.pincodeConfidence)||0,source:null},weight:{confidence:(t==null?void 0:t.weightConfidence)||0,source:null}}},[c]),Ot=I.scannedItems.reduce((t,n)=>t+(n.weight||0),0),S=((Wt=c==null?void 0:c.ocrExtracted)==null?void 0:Wt.intelligence)||(c==null?void 0:c.intelligence)||null,Mn=[["Step",y],["Connection",x],["Engine",wt],["Workflow",v],["Device",D],["Scan mode",Ce],["Fail count",String(wn)],["Reframe retries",`${st}/${Xe}`],["Camera",ke?"ready":"waiting"],["Doc detect",xe?`yes (${be})`:"no"],["Capture quality",f.ok?"good":f.issues.join(", ")||"pending"],["Capture metrics",f.metrics?`blur ${f.metrics.blurScore} | glare ${f.metrics.glareRatio}% | skew ${f.metrics.perspectiveSkew}%`:"-"],["JPEG last shot",w.kb?`${w.kb}KB ${w.width}x${w.height} q=${w.quality}`:"-"],["Secure ctx",fn()?"yes":"no"],["AWB lock",E||"-"],["Lock ms",St!=null?String(St):"-"],["Lock candidates",String(((Pt=se.current)==null?void 0:Pt.candidateCount)||1)],["Queued",String(C.length)],["Scans",String(I.scanNumber)],["Last format",(ee==null?void 0:ee.format)||"-"],["Last code",(ee==null?void 0:ee.value)||"-"],["Decode ms",(ee==null?void 0:ee.sinceStartMs)!=null?String(ee.sinceStartMs):"-"],["False-lock",(Lt=c==null?void 0:c.scanTelemetry)!=null&&Lt.falseLock?"yes":"no"]];return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:us}),e.jsxs("div",{className:"msp-root",children:[fe&&e.jsx("div",{className:`flash-overlay flash-${fe}`,onAnimationEnd:()=>J(null)}),ue&&e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[e.jsx(Xt,{size:48,color:"white"}),e.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),e.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:ue}),e.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),e.jsx("button",{type:"button","data-testid":"scanner-diag-toggle",onClick:()=>Cn(t=>!t),style:{position:"fixed",top:12,right:12,zIndex:70,border:"1px solid rgba(255,255,255,0.18)",background:tt?"rgba(79,70,229,0.92)":"rgba(15,23,42,0.72)",color:"#fff",borderRadius:999,padding:"8px 12px",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.04em",backdropFilter:"blur(10px)",cursor:"pointer"},children:tt?"Hide Diag":"Show Diag"}),tt&&e.jsxs("div",{"data-testid":"scanner-diag-panel",style:{position:"fixed",top:56,right:12,zIndex:69,width:"min(92vw, 320px)",background:"rgba(15,23,42,0.88)",color:"#E5EEF8",border:"1px solid rgba(255,255,255,0.12)",borderRadius:18,padding:14,backdropFilter:"blur(14px)",boxShadow:"0 12px 30px rgba(0,0,0,0.25)"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10,color:"#A5B4FC"},children:"Scanner Diagnostics"}),e.jsx("div",{style:{display:"grid",gap:6},children:Mn.map(([t,n])=>e.jsxs("div",{style:{display:"flex",gap:8,justifyContent:"space-between",alignItems:"flex-start",fontSize:"0.76rem"},children:[e.jsx("div",{style:{color:"rgba(226,232,240,0.72)",minWidth:88},children:t}),e.jsx("div",{className:"mono",style:{textAlign:"right",wordBreak:"break-word",maxWidth:180},children:n})]},t))}),e.jsx("div",{style:{marginTop:10,fontSize:"0.68rem",color:"rgba(226,232,240,0.7)",lineHeight:1.4},children:"Use this to verify whether Trackon labels are being decoded as `ITF` and how quickly the first lock happens after scan start."})]}),x!=="paired"&&e.jsx("div",{className:re(i.IDLE),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:r.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:x==="connecting"?e.jsx(mt,{size:28,color:r.primary,style:{animation:"spin 1s linear infinite"}}):e.jsx(Zt,{size:28,color:r.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:x==="connecting"?"Connecting...":"Disconnected"}),e.jsx("div",{style:{fontSize:"0.82rem",color:r.muted},children:z||`Connecting to session ${o}`})]}),x==="disconnected"&&e.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[e.jsx(mt,{size:16})," Reconnect"]})]})}),e.jsx("video",{ref:$,autoPlay:!0,playsInline:!0,muted:!0,onClick:()=>{de().catch(t=>{m((t==null?void 0:t.message)||"Camera access failed.")})},style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(y===i.SCANNING||y===i.CAPTURING)&&!pe.current?"block":"none"}}),e.jsx("div",{className:re(i.IDLE),children:e.jsxs("div",{className:"home-root",children:[e.jsxs("div",{className:"home-header",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16},children:[e.jsxs("button",{onClick:()=>p("/app/scan"),style:{background:"white",border:"1px solid #E2E8F0",padding:"6px 12px",borderRadius:20,fontSize:"0.75rem",fontWeight:600,color:"#475569",display:"flex",alignItems:"center",gap:4,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.02)"},children:[e.jsx(Un,{size:14})," Go Back"]}),e.jsxs("div",{className:"home-logo-badge",children:[e.jsx(Jt,{size:11,color:x==="paired"&&navigator.onLine?"#10B981":"#EF4444"}),et]})]}),e.jsx("div",{className:"home-logo-row",children:e.jsxs("div",{className:"home-logo-text",children:[e.jsx("img",{src:"/images/logo.png",alt:"Sea Hawk Logo",style:{height:28,width:"auto",objectFit:"contain",padding:2,background:"white",borderRadius:6,border:"1px solid #E2E8F0"}}),e.jsx("span",{children:"Seahawk Scanner"})]})}),e.jsxs("div",{className:"home-stats-row",children:[e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:I.scanNumber}),e.jsx("div",{className:"home-stat-label",children:"Scanned"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:Ot>0?Ot.toFixed(1):"0"}),e.jsx("div",{className:"home-stat-label",children:"Total kg"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:Be}),e.jsx("div",{className:"home-stat-label",children:"Session"})]})]})]}),e.jsxs("div",{className:"home-scan-section",children:[e.jsxs("div",{className:"home-scan-btn-wrap",children:[e.jsx("div",{className:"home-scan-ring"}),e.jsx("div",{className:"home-scan-ring home-scan-ring2"}),e.jsxs("button",{"data-testid":"start-scan-btn",className:"home-scan-btn",onClick:En,children:[e.jsx(ht,{size:34,color:"white"}),e.jsx("span",{className:"home-scan-btn-label",children:"Scan"})]})]}),e.jsx("div",{className:"home-cta-text",children:I.scanNumber===0?"Tap to start your first scan":"Tap to scan next parcel"}),e.jsxs("div",{style:{display:"flex",gap:8,marginTop:14,width:"100%",maxWidth:320},children:[e.jsxs("button",{type:"button","data-testid":"workflow-fast-btn",onClick:()=>at("fast"),style:{flex:1,borderRadius:999,border:`1px solid ${v==="fast"?r.primary:r.border}`,background:v==="fast"?r.primaryLight:r.surface,color:v==="fast"?r.primary:r.muted,fontWeight:700,fontSize:"0.72rem",padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(en,{size:13})," Fast scan"]}),e.jsxs("button",{type:"button","data-testid":"workflow-ocr-btn",onClick:()=>at("ocr"),style:{flex:1,borderRadius:999,border:`1px solid ${v==="ocr"?r.primary:r.border}`,background:v==="ocr"?r.primaryLight:r.surface,color:v==="ocr"?r.primary:r.muted,fontWeight:700,fontSize:"0.72rem",padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(gt,{size:13})," OCR label"]})]}),e.jsxs("div",{style:{display:"flex",gap:8,marginTop:8,width:"100%",maxWidth:320},children:[e.jsxs("button",{type:"button","data-testid":"device-profile-phone-btn",onClick:()=>Nt(U.phone),style:{flex:1,borderRadius:999,border:`1px solid ${D===U.phone?r.primary:r.border}`,background:D===U.phone?r.primaryLight:r.surface,color:D===U.phone?r.primary:r.muted,fontWeight:700,fontSize:"0.7rem",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(ht,{size:13})," Phone lens"]}),e.jsxs("button",{type:"button","data-testid":"device-profile-rugged-btn",onClick:()=>Nt(U.rugged),style:{flex:1,borderRadius:999,border:`1px solid ${D===U.rugged?r.primary:r.border}`,background:D===U.rugged?r.primaryLight:r.surface,color:D===U.rugged?r.primary:r.muted,fontWeight:700,fontSize:"0.7rem",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(Gn,{size:13})," Rugged"]})]}),e.jsxs("form",{onSubmit:Fn,style:{width:"100%",maxWidth:300,marginTop:20},children:[e.jsx("div",{style:{fontSize:"0.62rem",fontWeight:700,color:r.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6,textAlign:"center"},children:"Can't scan? Enter AWB manually"}),e.jsxs("div",{style:{display:"flex",gap:6},children:[e.jsx("input",{"data-testid":"manual-awb-input",value:Y,onChange:t=>We(t.target.value.toUpperCase()),placeholder:"e.g. 1234567890",inputMode:"text",autoCapitalize:"characters",style:{flex:1,padding:"9px 12px",border:`1.5px solid ${r.border}`,borderRadius:10,fontFamily:"JetBrains Mono, monospace",fontSize:"0.82rem",fontWeight:600,background:r.surface,color:r.text,outline:"none"},onFocus:t=>t.target.style.borderColor=r.primary,onBlur:t=>t.target.style.borderColor=r.border}),e.jsx("button",{type:"submit","data-testid":"manual-awb-submit",disabled:Y.trim().length<6,className:"btn btn-primary",style:{padding:"9px 14px",fontSize:"0.78rem",borderRadius:10,opacity:Y.trim().length>=6?1:.45},children:"Go â†’"})]})]}),e.jsxs("div",{className:"action-buttons-row",children:[e.jsxs("button",{className:"action-btn",onClick:An,children:[e.jsx(qn,{size:14})," ",C.length>0?`Upload (${C.length})`:"Synced"]}),e.jsxs("button",{className:"action-btn danger",onClick:Rn,children:[e.jsx(Vn,{size:14})," End Session"]})]}),C.length>0&&e.jsxs("div",{style:{marginTop:14,fontSize:"0.7rem",color:r.warning,fontWeight:600,display:"flex",alignItems:"center",gap:5},children:[e.jsx(tn,{size:12})," ",C.length," offline scan",C.length>1?"s":""," pending sync"]})]}),e.jsxs("div",{className:"home-queue-section",children:[e.jsxs("div",{className:"home-queue-head",children:[e.jsxs("div",{className:"home-queue-title-text",children:[e.jsx(Hn,{size:11}),"Accepted Consignments"]}),I.scannedItems.length>0&&e.jsx("div",{className:"home-queue-badge",children:I.scannedItems.length})]}),e.jsx("div",{className:"home-queue-list",children:I.scannedItems.length===0?e.jsxs("div",{className:"queue-empty",children:[e.jsx(nn,{size:36,color:"rgba(255,255,255,0.12)"}),e.jsxs("div",{className:"queue-empty-text",children:["No consignments scanned yet.",e.jsx("br",{}),"Tap the button above to begin."]})]}):I.scannedItems.map((t,n)=>e.jsxs("div",{className:"queue-item",children:[e.jsx("div",{className:"queue-check",children:e.jsx(sn,{size:13,color:"#10B981"})}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{className:"queue-awb",children:t.awb}),e.jsxs("div",{className:"queue-meta",children:[t.clientCode==="OFFLINE"?e.jsx("span",{className:"queue-offline-tag",children:"Offline"}):t.clientCode&&e.jsx("span",{className:"queue-client-tag",children:t.clientCode}),t.destination&&e.jsx("span",{children:t.destination})]})]}),t.weight>0&&e.jsxs("div",{className:"queue-weight",children:[t.weight,"kg"]})]},`${t.awb}-${n}`))})]})]})}),e.jsx("div",{className:re(i.SCANNING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[e.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:pe.current?"block":"none"}}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{className:"scan-guide",style:Ce==="barcode"?{width:on.w,height:on.h,borderRadius:10,maxHeight:"20vw",transition:"all 0.4s ease",borderColor:z?"rgba(248,113,113,0.92)":void 0,boxShadow:z?"0 0 0 3px rgba(248,113,113,0.2)":void 0}:{width:Ye.w,height:Ye.h,borderRadius:14,maxHeight:"75vh",transition:"all 0.4s ease",borderColor:"rgba(251,191,36,0.85)",boxShadow:"0 0 0 3px rgba(251,191,36,0.2)"},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"}),Ce==="barcode"&&e.jsx("div",{className:"scan-laser"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(Jt,{size:12})," ",o]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[Ce==="document"&&e.jsxs("div",{className:"cam-hud-chip",style:{background:"rgba(251,191,36,0.22)",color:"#FDE68A",fontWeight:700,fontSize:"0.65rem",gap:4},children:[e.jsx(rn,{size:11})," LABEL MODE"]}),e.jsxs("div",{className:"cam-hud-chip",style:{gap:4},children:[e.jsx(nn,{size:12})," ",I.scanNumber,wt==="native"?e.jsx("span",{style:{color:"#34D399",fontSize:"0.6rem",fontWeight:800},children:"⚡ NATIVE"}):e.jsx("span",{style:{color:"#F59E0B",fontSize:"0.6rem",fontWeight:800},children:"ZXING"})]})]})]}),e.jsxs("div",{className:"cam-bottom",children:[Ce==="barcode"?e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:6,color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:[e.jsx("div",{children:v==="fast"?"Align barcode inside the strip - auto-save on lock":"Align barcode inside the strip - camera opens for label capture after lock"}),st>0&&e.jsxs("div",{style:{color:"#FDE68A",fontSize:"0.74rem",fontWeight:700},children:["Reframe retry ",st,"/",Xe]}),!!z&&e.jsx("div",{style:{color:"#FCA5A5",fontSize:"0.72rem",fontWeight:700},children:z})]}):e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:6},children:[e.jsx("div",{style:{color:"rgba(251,191,36,0.95)",fontSize:"0.82rem",fontWeight:700,textAlign:"center"},children:"No barcode found - capture the label and we will read the printed AWB"}),e.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"},children:[e.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:jn,children:"Capture label instead"}),e.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:()=>{O(0),V(0),m(""),it("barcode"),R("tap")},children:"Back to barcode mode"})]})]}),e.jsxs("div",{style:{display:"flex",gap:12},children:[e.jsxs("button",{className:"cam-hud-chip",onClick:()=>at(t=>t==="fast"?"ocr":"fast"),style:{border:"none",cursor:"pointer",gap:5},children:[v==="fast"?e.jsx(en,{size:13}):e.jsx(gt,{size:13}),v==="fast"?"FAST":"OCR"]}),e.jsx("button",{className:"cam-hud-chip",onClick:()=>Nn(!Le),style:{border:"none",cursor:"pointer"},children:Le?e.jsx(Qn,{size:14}):e.jsx(Kn,{size:14})})]})]})]})}),e.jsx("div",{className:re(i.CAPTURING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!ke&&e.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[e.jsx(Yn,{size:44,color:"#34D399"}),e.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:E||"OCR fallback"}),e.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:E?"Barcode locked - Preparing camera...":"Preparing label capture for printed AWB OCR..."})]}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{ref:ct,className:`scan-guide ${xe?"detected":""}`,style:{width:Ye.w,height:Ye.h,maxHeight:"75vh",borderRadius:12},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[e.jsx(rn,{size:12})," ",E||"OCR AWB capture"]}),C.length>0&&e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(tn,{size:12})," ",C.length," queued"]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:xe?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center",transition:"color 0.3s"},children:Bn}),f.metrics&&e.jsxs("div",{style:{color:"rgba(255,255,255,0.66)",fontSize:"0.72rem",textAlign:"center"},children:["Blur ",f.metrics.blurScore," | Glare ",f.metrics.glareRatio,"% | Skew ",f.metrics.perspectiveSkew,"%"]}),e.jsx("button",{className:"capture-btn","data-testid":"capture-photo-btn",onClick:In,disabled:!Mt,style:{opacity:Mt?1:.4},children:e.jsx("div",{className:"capture-btn-inner"})}),h&&e.jsx("button",{type:"button","data-testid":"mock-capture-btn",onClick:Tn,style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 12px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:"Mock capture"}),e.jsx("button",{style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},onClick:()=>{Z(""),m(""),O(0),V(0),le.current=!1,R("tap"),u(i.SCANNING)},children:"â† Rescan barcode"})]})]})}),e.jsx("div",{className:re(i.PREVIEW),children:e.jsxs("div",{style:{background:r.bg,display:"flex",flexDirection:"column",height:"100%"},children:[e.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${r.border}`},children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.72rem",color:r.muted,fontWeight:600},children:"CAPTURED"}),e.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:E||"Printed AWB OCR"}),w.kb>0&&e.jsxs("div",{style:{fontSize:"0.68rem",color:r.mutedLight},children:[w.kb,"KB • ",w.width,"×",w.height]})]})}),e.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:G&&e.jsx("img",{src:G,alt:"Captured label",className:"preview-img"})}),e.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{ie(null),u(i.CAPTURING)},children:[e.jsx(an,{size:16})," Retake"]}),e.jsxs("button",{"data-testid":"use-photo-btn",className:"btn btn-primary",style:{flex:2},onClick:zn,children:[e.jsx(Xn,{size:16})," Use Photo"]})]})]})}),e.jsx("div",{className:re(i.PROCESSING),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16},children:[e.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[e.jsx(gt,{size:22,color:r.primary,style:{animation:"spin 2s linear infinite"}}),e.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:r.primary},children:"Intelligence Engine"})]}),e.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:r.muted},children:E}),e.jsx("div",{style:{fontSize:"0.72rem",color:r.mutedLight,marginTop:6},children:G?"Reading AWB label with local OCR...":"Saving barcode scan..."})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(t=>e.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:t}),e.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),e.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},t)),e.jsx("div",{style:{textAlign:"center",marginTop:8},children:e.jsx("button",{className:"btn btn-outline",style:{fontSize:"0.75rem",padding:"8px 20px"},onClick:()=>{m("Cancelled by user."),u(i.ERROR)},children:"Cancel"})})]})}),e.jsx("div",{className:re(i.REVIEWING),children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%"},children:[e.jsxs("div",{style:{padding:"14px 20px",borderBottom:`1px solid ${r.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.65rem",color:r.muted,fontWeight:600},children:"REVIEW EXTRACTION"}),e.jsx("div",{className:"mono",style:{fontSize:"0.95rem",fontWeight:700},children:(c==null?void 0:c.awb)||E})]}),(S==null?void 0:S.learnedFieldCount)>0&&e.jsxs("div",{className:"source-badge source-learned",children:["AI ",S.learnedFieldCount," auto-corrected"]})]}),e.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsxs("div",{className:`field-card ${(((Dt=he.clientCode)==null?void 0:Dt.confidence)||0)<.55?"warning":""}`,children:[e.jsx("div",{className:Ct((($t=he.clientCode)==null?void 0:$t.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((Ut=he.clientCode)==null?void 0:Ut.source)&&(()=>{const t=bn(he.clientCode.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:d.clientCode||"",onChange:t=>F(n=>({...n,clientCode:t.target.value.toUpperCase()})),placeholder:"Client code"}),((Gt=S==null?void 0:S.clientMatches)==null?void 0:Gt.length)>0&&S.clientNeedsConfirmation&&e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:S.clientMatches.slice(0,3).map(t=>e.jsxs("button",{onClick:()=>F(n=>({...n,clientCode:t.code})),style:{fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:`1px solid ${r.border}`,background:d.clientCode===t.code?r.primaryLight:r.surface,color:r.text,cursor:"pointer",fontFamily:"inherit",fontWeight:500},children:[t.code," (",Math.round(t.score*100),"%)"]},t.code))})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:Ct(((qt=he.consignee)==null?void 0:qt.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Consignee"}),e.jsx("input",{className:"field-input",value:d.consignee||"",onChange:t=>F(n=>({...n,consignee:t.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:Ct(((Vt=he.destination)==null?void 0:Vt.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((Ht=he.destination)==null?void 0:Ht.source)&&(()=>{const t=bn(he.destination.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:d.destination||"",onChange:t=>F(n=>({...n,destination:t.target.value.toUpperCase()})),placeholder:"City"}),(S==null?void 0:S.pincodeCity)&&S.pincodeCity!==d.destination&&e.jsxs("button",{onClick:()=>F(t=>({...t,destination:S.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:r.successLight,color:r.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["ðŸ“ Pincode suggests: ",S.pincodeCity]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Pincode"}),e.jsx("input",{className:"field-input",value:d.pincode||"",onChange:t=>F(n=>({...n,pincode:t.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),e.jsx("div",{className:`field-card ${(Qt=S==null?void 0:S.weightAnomaly)!=null&&Qt.anomaly?"warning":""}`,children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Weight (kg)"}),e.jsx("input",{className:"field-input",value:d.weight||"",onChange:t=>F(n=>({...n,weight:t.target.value})),placeholder:"0.0",inputMode:"decimal"}),((Kt=S==null?void 0:S.weightAnomaly)==null?void 0:Kt.anomaly)&&e.jsxs("div",{style:{fontSize:"0.6rem",color:r.warning,marginTop:2,fontWeight:500},children:["Warning: ",S.weightAnomaly.warning]})]})})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Amount (â‚¹)"}),e.jsx("input",{className:"field-input",value:d.amount||"",onChange:t=>F(n=>({...n,amount:t.target.value})),placeholder:"0",inputMode:"decimal"})]})}),e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Order No"}),e.jsx("input",{className:"field-input",value:d.orderNo||"",onChange:t=>F(n=>({...n,orderNo:t.target.value})),placeholder:"Optional"})]})})]})]}),e.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${r.border}`,display:"flex",gap:10},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:_e,children:[e.jsx(Zn,{size:16})," Skip"]}),e.jsxs("button",{"data-testid":"approve-save-btn",className:"btn btn-success btn-lg",style:{flex:2},onClick:_n,disabled:y===i.APPROVING,children:[y===i.APPROVING?e.jsx(mt,{size:16,style:{animation:"spin 1s linear infinite"}}):e.jsx(sn,{size:16}),y===i.APPROVING?"Saving...":"Approve & Save"]})]})]})}),e.jsx("div",{className:re(i.APPROVING)}),e.jsx("div",{className:re(i.SUCCESS),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[e.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:r.success,strokeWidth:"3",className:"success-check-circle"}),e.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:r.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:r.success,marginBottom:4},children:"Saved Successfully"}),e.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700},children:k==null?void 0:k.awb}),(k==null?void 0:k.clientCode)&&e.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:r.primaryLight,color:r.primary,fontSize:"0.78rem",fontWeight:600},children:k.clientName||k.clientCode})]}),e.jsx("div",{style:{fontSize:"0.72rem",color:r.muted},children:k!=null&&k.offlineQueued?`${C.length} queued for sync - Auto-continuing in ${Bt}s`:`#${I.scanNumber} scanned - Auto-continuing in ${Bt}s`}),e.jsxs("button",{"data-testid":"scan-next-btn",className:"btn btn-primary btn-lg btn-full",onClick:()=>_e(v==="fast"?i.SCANNING:i.IDLE),style:{maxWidth:320},children:[e.jsx(ht,{size:18})," ",v==="fast"?"Keep Scanning":"Scan Next Parcel"]})]})}),e.jsx("div",{className:re(i.ERROR),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:r.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(Xt,{size:32,color:r.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:r.error},children:"Scan Error"}),e.jsx("div",{style:{fontSize:"0.82rem",color:r.muted,marginTop:4},children:z})]}),e.jsxs("button",{className:"btn btn-primary",onClick:_e,children:[e.jsx(an,{size:16})," Try Again"]})]})}),x==="disconnected"&&y!==i.IDLE&&e.jsxs("div",{className:"offline-banner",children:[e.jsx(Zt,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline â€” Reconnecting... ",C.length?`(${C.length} queued)`:""]})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{ks as default};
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/index-4oYbt_M2.js","assets/index-D3Mz4UNV.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
