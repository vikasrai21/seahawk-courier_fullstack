import{l as Zt,_ as ft}from"./index-DCqJj_O7.js";import{j as e}from"./page-landing-Bx5c8M2c.js";import{r as i}from"./vendor-helmet-Dwc3L0SQ.js";import{c as en,u as tn}from"./vendor-react-DGJm5saH.js";import{b as xt,R as Oe,aL as bt,V as nn,aD as yt,aE as wt,aF as sn,a5 as on,d as vt,a0 as rn,z as Ct,aG as jt,aJ as Nt,aH as an,aI as cn,au as ln,aK as St,O as dn,ax as un,X as pn}from"./vendor-icons-Bdqpyfv7.js";import"./page-import-CyeJoxHM.js";import"./page-reconcile-DF_UVosL.js";import"./page-rate-calc-DThUjZnZ.js";function kt(r,u){var z,w;try{if(!r||!u)return null;const m=Number(r.videoWidth||0),p=Number(r.videoHeight||0);if(!m||!p)return null;const v=(z=r.getBoundingClientRect)==null?void 0:z.call(r),f=(w=u.getBoundingClientRect)==null?void 0:w.call(u);if(!v||!f)return null;const T=Number(v.width||0),Z=Number(v.height||0);if(!T||!Z)return null;const h=Math.max(T/m,Z/p),x=m*h,Ie=p*h,F=(T-x)/2,Y=(Z-Ie)/2,_=f.left-v.left,ee=f.top-v.top,Ge=f.right-v.left,ge=f.bottom-v.top,a=(_-F)/h,ae=(ee-Y)/h,l=(Ge-F)/h,E=(ge-Y)/h,j=(xe,ne,be)=>Math.max(ne,Math.min(be,xe)),P=j(Math.min(a,l),0,m),ce=j(Math.min(ae,E),0,p),K=j(Math.max(a,l),0,m),fe=j(Math.max(ae,E),0,p),te=Math.max(0,K-P),y=Math.max(0,fe-ce);return!te||!y?null:{x:P,y:ce,w:te,h:y}}catch{return null}}const mn=window.location.origin,Ft={w:"90vw",h:"18vw"},Fe={w:"92vw",h:"130vw"},hn=3500,gn="mobile_scanner_offline_queue",fn=80,Et=3,Pe=["code_128","code_39","code_93","codabar","ean_13","ean_8","itf","qr_code"],xn=(r="")=>{const u=String(r||"").toUpperCase(),z=u.replace(/\s+/g,""),w=[],m=v=>{const f=String(v||"").replace(/[^A-Z0-9]/g,"");!f||w.includes(f)||w.push(f)};return m(z),(u.match(/\b\d{12,14}\b/g)||[]).forEach(m),(u.match(/\b[A-Z]{1,2}\d{8,11}\b/g)||[]).forEach(m),w.forEach(v=>{/^0\d{12}$/.test(v)&&m(v.slice(1))}),[...w.filter(v=>/^[125]\d{11}$/.test(v)),...w.filter(v=>/^\d{12}$/.test(v)),...w.filter(v=>/^\d{13,14}$/.test(v)),...w.filter(v=>/^[A-Z]{1,2}\d{8,11}$/.test(v)),...w].find(Boolean)||""},o={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"},J=r=>{var u;try{(u=navigator==null?void 0:navigator.vibrate)==null||u.call(navigator,r)}catch{}},Ee=(r,u,z="sine")=>{try{const w=new(window.AudioContext||window.webkitAudioContext),m=w.createOscillator(),p=w.createGain();m.type=z,m.frequency.setValueAtTime(r,w.currentTime),p.gain.setValueAtTime(.12,w.currentTime),p.gain.exponentialRampToValueAtTime(.01,w.currentTime+u),m.connect(p),p.connect(w.destination),m.start(),m.stop(w.currentTime+u)}catch{}},$e=()=>{Ee(880,.12),setTimeout(()=>Ee(1100,.1),130)},It=()=>Ee(600,.08),Le=()=>Ee(200,.25,"sawtooth"),Rt=r=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(r);u.rate=1.2,u.pitch=1,u.lang="en-IN",window.speechSynthesis.speak(u)}catch{}},At=()=>{var r;try{if(typeof window>"u")return!1;if(window.isSecureContext)return!0;const u=((r=window.location)==null?void 0:r.hostname)||"";return u==="localhost"||u==="127.0.0.1"}catch{return!1}},s={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",mutedLight:"#9CA3AF",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},bn=`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');

.msp-root {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: ${s.bg};
  color: ${s.text};
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
  background: ${s.surface}; border: 1px solid ${s.border};
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
  background: ${s.surface}; border: 1.5px solid ${s.border};
  color: ${s.text};
}
.btn-danger { background: ${s.errorLight}; color: ${s.error}; }
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
  background: ${s.surface}; border: 1px solid ${s.border};
  border-radius: 12px;
}
.field-card.warning { border-color: ${s.warning}; background: ${s.warningLight}; }
.field-card.error-field { border-color: ${s.error}; background: ${s.errorLight}; }
.field-label {
  font-size: 0.65rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em;
  color: ${s.muted}; margin-bottom: 2px;
}
.field-value {
  font-size: 0.85rem; font-weight: 600;
  color: ${s.text};
}
.field-input {
  width: 100%; background: ${s.bg}; border: 1px solid ${s.border};
  border-radius: 8px; padding: 8px 10px;
  font-family: inherit; font-size: 0.82rem; font-weight: 500;
  color: ${s.text}; outline: none;
}
.field-input:focus { border-color: ${s.primary}; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }

/* â”€â”€ Confidence dot â”€â”€ */
.conf-dot {
  width: 8px; height: 8px; border-radius: 50%;
  flex-shrink: 0; margin-top: 4px;
}
.conf-high { background: ${s.success}; }
.conf-med { background: ${s.warning}; }
.conf-low { background: ${s.error}; }

/* â”€â”€ Source badge â”€â”€ */
.source-badge {
  font-size: 0.6rem; padding: 2px 6px; border-radius: 6px;
  font-weight: 600; display: inline-flex; align-items: center; gap: 3px;
}
.source-learned { background: #F5F3FF; color: #7C3AED; }
.source-ai { background: ${s.primaryLight}; color: ${s.primary}; }
.source-history { background: ${s.warningLight}; color: ${s.warning}; }
.source-pincode { background: ${s.successLight}; color: ${s.success}; }

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
  background: ${s.warningLight}; color: ${s.warning};
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
`,yn=r=>r>=.85?"high":r>=.55?"med":"low",_e=r=>`conf-dot conf-${yn(r)}`,zt=r=>r==="learned"?{className:"source-badge source-learned",icon:"ðŸ§ ",text:"Learned"}:r==="fuzzy_match"?{className:"source-badge source-ai",icon:"ðŸ”",text:"Matched"}:r==="fuzzy_history"||r==="consignee_pattern"?{className:"source-badge source-history",icon:"ðŸ“Š",text:"History"}:r==="delhivery_pincode"||r==="india_post"||r==="pincode_lookup"||r==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"ðŸ“",text:"Pincode"}:null,wn=r=>{const u=Math.floor(r/6e4);return u<60?`${u}m`:`${Math.floor(u/60)}h ${u%60}m`};function In(){var nt,it,st,ot,rt,at,ct,lt,dt,ut;const{pin:r}=en(),u=tn(),z=`${gn}:${r||"unknown"}`,w=i.useMemo(()=>`mobile_scanner_daily_count:${new Date().toISOString().slice(0,10)}`,[]),m=i.useMemo(()=>{try{if(typeof window>"u")return!1;const t=new URLSearchParams(window.location.search);return t.get("mock")==="1"||t.get("e2e")==="1"}catch{return!1}},[]),[p,v]=i.useState(null),[f,T]=i.useState("connecting"),[Z,h]=i.useState(""),[x,Ie]=i.useState(o.IDLE),[F,Y]=i.useState(""),[_,ee]=i.useState(null),[Ge,ge]=i.useState({}),[a,ae]=i.useState(null),[l,E]=i.useState({}),[j,P]=i.useState(null),[ce,K]=i.useState(null),[fe,te]=i.useState(""),[y,xe]=i.useState([]),[ne,be]=i.useState(!1),[Tt,Ue]=i.useState(0),[ye,we]=i.useState(!1),[Bt,Mt]=i.useState("0m"),[Dt,qe]=i.useState("Connected"),[le,Ve]=i.useState(""),[Re,Wt]=i.useState(!1),[He,Ae]=i.useState("idle"),[B,Xe]=i.useState(null),[Ot,Pt]=i.useState(0),[de,ze]=i.useState("barcode"),Te=i.useRef(0),[S,Be]=i.useState({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now(),scannedItems:[]}),[ve,$t]=i.useState(!1),I=i.useRef(null),Me=i.useRef(null),M=i.useRef(null),G=i.useRef(null),$=i.useRef(!1),Ce=i.useRef(null),Lt=i.useRef(!1),ie=i.useRef(o.IDLE),je=i.useRef(null),ue=i.useRef(0),Q=i.useRef(null),Ye=i.useRef(new Set),D=i.useCallback(t=>{Te.current=t,Pt(t)},[]),De=i.useCallback(()=>{D(0),ze("document"),J([80,60,80])},[D]),L=i.useCallback(async()=>{var c;if(!At())throw new Error("Camera requires HTTPS (or localhost). Open this page over https:// on your phone.");if(!((c=navigator==null?void 0:navigator.mediaDevices)!=null&&c.getUserMedia))throw new Error("Camera not supported on this browser/device.");if(!I.current)throw new Error("Camera element not ready.");const t=I.current.srcObject;if(t&&typeof t.getTracks=="function"&&t.getTracks().some(b=>b.readyState==="live")){await I.current.play();return}let n=null;try{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}I.current.srcObject=n,await I.current.play()},[]);i.useEffect(()=>{const t=setInterval(()=>Mt(wn(Date.now()-S.startedAt)),3e4);return()=>clearInterval(t)},[S.startedAt]);const Ne=i.useCallback(t=>{xe(t);try{t.length?localStorage.setItem(z,JSON.stringify(t)):localStorage.removeItem(z)}catch{}},[z]),Ke=i.useCallback(t=>{const n={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:t};return Ne([...y,n]),n},[y,Ne]),Se=i.useCallback(()=>{!p||!p.connected||!y.length||(y.forEach(t=>{var n,c;!((n=t==null?void 0:t.payload)!=null&&n.awb)||!((c=t==null?void 0:t.payload)!=null&&c.imageBase64)||p.emit("scanner:scan",t.payload)}),Ne([]))},[p,y,Ne]),d=i.useCallback(t=>{Ie(t)},[]),U=i.useCallback(t=>{Be(n=>{const c={...n,scannedItems:[{...t,time:Date.now()},...n.scannedItems]};try{localStorage.setItem(w,String(c.scanNumber))}catch{}return c})},[w]),_t=i.useCallback(()=>{if(f!=="paired"){h("Phone is not connected to the desktop session.");return}if(h(""),m){d(o.SCANNING);return}L().then(()=>d(o.SCANNING)).catch(t=>h((t==null?void 0:t.message)||"Camera access failed."))},[f,L,d,m]),Gt=i.useCallback(t=>{t==null||t.preventDefault();const n=le.trim().toUpperCase();if(!n||n.length<6){h("Enter a valid AWB number (min 6 chars)");return}if(f!=="paired"){h("Not connected to desktop session.");return}if(h(""),Ve(""),Y(n),m){we(!0),d(o.CAPTURING);return}L().then(()=>d(o.CAPTURING)).catch(c=>h((c==null?void 0:c.message)||"Camera access failed."))},[le,f,L,d,m]),Ut=i.useCallback(()=>{window.confirm("End this mobile scanner session on the phone?")&&(p!=null&&p.connected?p.emit("scanner:end-session",{reason:"Mobile ended the session"}):u("/"))},[p,u]),qt=i.useCallback(()=>{if(y.length>0){Se();return}window.alert("Everything is already synced.")},[y.length,Se]);i.useEffect(()=>{ie.current=x},[x]),i.useEffect(()=>{if(m){T("paired"),qe("Mock Mode"),h(""),d(o.IDLE);return}if(!r){h("No PIN provided.");return}const t=Zt(mn,{auth:{scannerPin:r},transports:["websocket","polling"],reconnection:!0,reconnectionDelay:1500,reconnectionAttempts:20});return t.on("connect",()=>T("connecting")),t.on("scanner:paired",({userEmail:n})=>{T("paired"),qe(n?n.split("@")[0]:"Connected"),h(""),d(o.IDLE)}),t.on("scanner:error",({message:n})=>{h(n),T("disconnected")}),t.on("scanner:session-ended",({reason:n})=>{T("disconnected"),h(n||"Session ended by desktop."),u("/")}),t.on("disconnect",()=>T("disconnected")),t.on("reconnect",()=>{f==="paired"&&d(o.SCANNING)}),t.on("scanner:scan-processed",n=>{if(n.status==="error"){K("error"),Le(),J([100,50,100]),d(o.ERROR),h(n.error||"Scan failed on desktop.");return}if(ae(n),E({clientCode:n.clientCode||"",consignee:n.consignee||"",destination:n.destination||"",pincode:n.pincode||"",weight:n.weight||0,amount:n.amount||0,orderNo:n.orderNo||""}),ge({}),n.reviewRequired)d(o.REVIEWING);else{$e(),J([50,30,50]);const c={awb:n.awb,clientCode:n.clientCode,clientName:n.clientName,destination:n.destination||"",weight:n.weight||0};P(c),U(c),d(o.SUCCESS)}}),t.on("scanner:approval-result",({success:n,message:c,awb:g})=>{if(n){$e(),J([50,30,50]),K("success");const b={awb:(a==null?void 0:a.awb)||g,clientCode:l.clientCode,clientName:(a==null?void 0:a.clientName)||l.clientCode,destination:l.destination||"",weight:parseFloat(l.weight)||0};P(b),U(b),d(o.SUCCESS)}else Le(),h(c||"Approval failed.")}),t.on("scanner:ready-for-next",()=>{}),v(t),()=>{t.disconnect()}},[r,U,a,l,d,u,m]),i.useEffect(()=>{try{const t=localStorage.getItem(z);if(!t)return;const n=JSON.parse(t);Array.isArray(n)&&n.length&&xe(n)}catch{}},[z]),i.useEffect(()=>{f==="paired"&&(p!=null&&p.connected)&&y.length&&Se()},[f,p,y.length,Se]);const se=i.useCallback(async()=>{var t;try{if(we(!1),G.current){try{const n=G.current;n!=null&&n.barcodeScanner&&await n.barcodeScanner.dispose()}catch{}G.current=null}if(M.current){try{await M.current.reset()}catch{}M.current=null}(t=I.current)!=null&&t.srcObject&&(I.current.srcObject.getTracks().forEach(n=>n.stop()),I.current.srcObject=null)}catch{}},[]),oe=i.useCallback(async()=>{try{if(Ae("idle"),G.current){try{await G.current.barcodeScanner.dispose()}catch{}G.current=null}if(M.current){try{M.current._type==="native"?M.current.reset():await M.current.reset()}catch{}M.current=null}}catch{}},[]),Qe=i.useCallback(async()=>{if(I.current){await oe();try{if(ue.current=Date.now(),await L(),typeof window.BarcodeDetector<"u"){let b=!0,k=Pe;try{const R=await window.BarcodeDetector.getSupportedFormats();k=Pe.filter(N=>R.includes(N)),k.length||(k=Pe)}catch{}if(k.includes("itf")||(console.log("[MobileScanner] Native BarcodeDetector lacks ITF â€” falling back to ZXing"),b=!1),b){Ae("native");const R=new window.BarcodeDetector({formats:k});let N=null,A=!1;const V=async()=>{var re;if(A||$.current||ie.current!==o.SCANNING)return;const H=I.current;if(!H||H.readyState<2){N=setTimeout(V,60);return}try{const O=await R.detect(H);if(O.length>0&&O[0].rawValue)D(0),Xe({value:O[0].rawValue,format:String(O[0].format||"unknown"),engine:"native",at:Date.now(),sinceStartMs:ue.current?Date.now()-ue.current:null}),(re=Q.current)==null||re.call(Q,O[0].rawValue);else{const me=Te.current+1;D(me),me>=Et&&De()}}catch{}ie.current===o.SCANNING&&(N=setTimeout(V,60))};M.current={_type:"native",reset:()=>{A=!0,N&&clearTimeout(N),N=null}},setTimeout(V,300);return}}const[{BrowserMultiFormatReader:t},n]=await Promise.all([ft(()=>import("./index-4oYbt_M2.js"),__vite__mapDeps([0,1])),ft(()=>import("./index-D3Mz4UNV.js"),__vite__mapDeps([]))]),c=new Map([[n.DecodeHintType.POSSIBLE_FORMATS,[n.BarcodeFormat.CODE_128,n.BarcodeFormat.ITF,n.BarcodeFormat.CODE_39,n.BarcodeFormat.CODE_93,n.BarcodeFormat.CODABAR,n.BarcodeFormat.EAN_13,n.BarcodeFormat.EAN_8]],[n.DecodeHintType.TRY_HARDER,!0],[n.DecodeHintType.ASSUME_GS1,!1],[n.DecodeHintType.CHARACTER_SET,"UTF-8"]]),g=new t(c,40);Ae("zxing"),M.current=g,g.decodeFromVideoElement(I.current,b=>{var k,R,N;if(!$.current)if(b){D(0);let A="unknown";try{A=String(((k=b.getBarcodeFormat)==null?void 0:k.call(b))||"unknown")}catch{}Xe({value:((R=b.getText)==null?void 0:R.call(b))||"",format:A,engine:"zxing",at:Date.now(),sinceStartMs:ue.current?Date.now()-ue.current:null}),(N=Q.current)==null||N.call(Q,b.getText())}else{const A=Te.current+1;D(A),A>=Et&&De()}})}catch(t){h("Camera access failed: "+t.message)}}},[L,oe,De,D]),Je=i.useCallback(t=>{const n=xn(t)||String(t||"").trim().replace(/\s+/g,"").toUpperCase();if(!(!n||n.length<6||$.current||ie.current!==o.SCANNING)){if($.current=!0,Ye.current.has(n)){J([100,50,100,50,100]),Le(),te(n),setTimeout(()=>{te(""),$.current=!1},2500);return}clearTimeout(je.current),J([50]),It(),Y(n),Be(c=>{const g={...c,scanNumber:c.scanNumber+1};return g.scannedAwbs=new Set(c.scannedAwbs),g.scannedAwbs.add(n),Ye.current=g.scannedAwbs,g}),je.current=setTimeout(()=>{ie.current===o.SCANNING&&d(o.CAPTURING)},fn)}},[d]);i.useEffect(()=>{Q.current=Je},[Je]),i.useEffect(()=>(x===o.SCANNING&&($.current=!1,D(0),ze("barcode"),Qe()),()=>{x===o.SCANNING&&oe()}),[x,Qe,oe,D]);const Ze=i.useCallback(async()=>{if(m){we(!0);return}await oe();try{await L(),we(!0)}catch(t){h("Camera access failed: "+t.message)}},[L,oe,m]);i.useEffect(()=>{x===o.CAPTURING&&Ze()},[x,Ze]),i.useEffect(()=>{if(x!==o.CAPTURING){be(!1),Ue(0),Lt.current=!1;return}const t=setInterval(()=>{const n=I.current,c=Me.current;if(!n||!c||!n.videoWidth||!n.videoHeight)return;const g=kt(n,c);if(!g)return;const b=Math.max(0,Math.floor(g.x)),k=Math.max(0,Math.floor(g.y)),R=Math.max(24,Math.floor(g.w)),N=Math.max(24,Math.floor(g.h)),A=document.createElement("canvas"),V=96,H=72;A.width=V,A.height=H;const re=A.getContext("2d",{willReadFrequently:!0});if(!re)return;re.drawImage(n,b,k,Math.min(R,n.videoWidth-b),Math.min(N,n.videoHeight-k),0,0,V,H);const O=re.getImageData(0,0,V,H).data;let me=0,pt=0,mt=0,ht=0;for(let X=0;X<O.length;X+=4){const he=.2126*O[X]+.7152*O[X+1]+.0722*O[X+2];me+=he,pt+=he*he,X>0&&Math.abs(he-ht)>26&&mt++,ht=he}const We=V*H,ke=me/We,Qt=Math.sqrt(Math.max(0,pt/We-ke*ke)),Jt=mt/Math.max(We,1),gt=ke>35&&ke<225&&Qt>24&&Jt>.12;be(gt),Ue(X=>gt?Math.min(X+1,8):0)},320);return()=>clearInterval(t)},[x]);const et=i.useCallback(()=>{const t=I.current,n=Me.current;if(!t||!n||!t.videoWidth)return null;const c=kt(t,n);if(!c)return null;const g=c.x,b=c.y,k=c.w,R=c.h;if(!k||!R)return null;const N=document.createElement("canvas");return N.width=Math.min(1200,Math.round(k)),N.height=Math.round(N.width/k*R),N.getContext("2d").drawImage(t,g,b,k,R,0,0,N.width,N.height),N.toDataURL("image/jpeg",.75).split(",")[1]||null},[]),Vt=i.useCallback(()=>{K("white"),It(),J([30]);const t=et();if(!t){h("Could not capture image. Try again."),$.current=!1;return}ee(`data:image/jpeg;base64,${t}`),se(),d(o.PREVIEW)},[et,se,d]),Ht=i.useCallback(()=>{if(!m)return;ee("data:image/jpeg;base64,ZmFrZS1tb2NrLWltYWdl"),se(),d(o.PREVIEW)},[d,m,se]),Xt=i.useCallback(()=>{if(!F||!_)return;if(d(o.PROCESSING),m){setTimeout(()=>{const g={awb:F,clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25};P(g),U(g),d(o.SUCCESS)},250);return}const t={scanNumber:S.scanNumber,recentClient:S.dominantClient,dominantClient:S.dominantClient,dominantClientCount:S.dominantClientCount,sessionDurationMin:Math.round((Date.now()-S.startedAt)/6e4)},n=_.split(",")[1]||_,c={awb:F,imageBase64:n,focusImageBase64:n,sessionContext:t};if(!p||!p.connected||f!=="paired"){Ke(c),$e();const g={awb:F,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};P({...g,offlineQueued:!0}),U(g),d(o.SUCCESS);return}p.emit("scanner:scan",c),setTimeout(()=>{ie.current===o.PROCESSING&&(h("OCR timed out after 40 seconds. Check that GEMINI_API_KEY is set on Railway, then try again."),d(o.ERROR))},4e4)},[p,F,_,S,d,f,Ke,U,m]),Yt=i.useCallback(()=>{if(a){if(d(o.APPROVING),m){setTimeout(()=>{const t={awb:a.awb||F,clientCode:l.clientCode||"MOCKCL",clientName:a.clientName||l.clientCode||"Mock Client",destination:l.destination||"",weight:parseFloat(l.weight)||0};P(t),U(t),K("success"),d(o.SUCCESS)},200);return}if(p){if(a.ocrExtracted||a){const t={clientCode:a.clientCode||"",clientName:a.clientName||"",consignee:a.consignee||"",destination:a.destination||""},n={clientCode:l.clientCode||"",clientName:l.clientCode||"",consignee:l.consignee||"",destination:l.destination||""};p.emit("scanner:learn-corrections",{pin:r,ocrFields:t,approvedFields:n})}p.emit("scanner:approval-submit",{shipmentId:a.shipmentId,awb:a.awb||F,fields:{clientCode:l.clientCode,consignee:l.consignee,destination:l.destination,pincode:l.pincode,weight:parseFloat(l.weight)||0,amount:parseFloat(l.amount)||0,orderNo:l.orderNo||""}},t=>{t!=null&&t.success||(d(o.REVIEWING),h((t==null?void 0:t.message)||"Approval failed."))}),l.clientCode&&l.clientCode!=="MISC"&&Be(t=>{var g,b;const n={...t.clientFreq};n[l.clientCode]=(n[l.clientCode]||0)+1;const c=Object.entries(n).sort((k,R)=>R[1]-k[1]);return{...t,clientFreq:n,dominantClient:((g=c[0])==null?void 0:g[1])>=2?c[0][0]:null,dominantClientCount:((b=c[0])==null?void 0:b[1])||0}})}}},[p,a,l,F,r,d,U,m]),pe=i.useCallback(()=>{clearTimeout(Ce.current),clearTimeout(je.current),Y(""),ee(null),ae(null),E({}),ge({}),P(null),h(""),te(""),$.current=!1,d(o.IDLE)},[d]);i.useEffect(()=>{if(x===o.SUCCESS)return Ce.current=setTimeout(pe,hn),()=>clearTimeout(Ce.current)},[x,pe]),i.useEffect(()=>{if(ve)if(x===o.REVIEWING&&a){const t=[a.clientName||a.clientCode,a.destination,a.weight?`${a.weight} kilograms`:""].filter(Boolean);t.length&&Rt(t.join(". "))}else x===o.SUCCESS&&j&&Rt(`${j.clientName||j.clientCode||"Shipment"} Verified.`)},[ve,x,a,j]),i.useEffect(()=>()=>{se(),clearTimeout(Ce.current),clearTimeout(je.current)},[se]);const W=t=>`msp-step ${x===t?"active":""}`,q=i.useMemo(()=>{if(!a)return{};const t=a.ocrExtracted||a;return{clientCode:{confidence:(t==null?void 0:t.clientNameConfidence)||0,source:(t==null?void 0:t.clientNameSource)||null},consignee:{confidence:(t==null?void 0:t.consigneeConfidence)||0,source:(t==null?void 0:t.consigneeSource)||null},destination:{confidence:(t==null?void 0:t.destinationConfidence)||0,source:(t==null?void 0:t.destinationSource)||null},pincode:{confidence:(t==null?void 0:t.pincodeConfidence)||0,source:null},weight:{confidence:(t==null?void 0:t.weightConfidence)||0,source:null}}},[a]),tt=S.scannedItems.reduce((t,n)=>t+(n.weight||0),0),C=((nt=a==null?void 0:a.ocrExtracted)==null?void 0:nt.intelligence)||(a==null?void 0:a.intelligence)||null,Kt=[["Step",x],["Connection",f],["Engine",He],["Scan mode",de],["Fail count",String(Ot)],["Camera",ye?"ready":"waiting"],["Doc detect",ne?`yes (${Tt})`:"no"],["Secure ctx",At()?"yes":"no"],["AWB lock",F||"-"],["Queued",String(y.length)],["Scans",String(S.scanNumber)],["Last format",(B==null?void 0:B.format)||"-"],["Last code",(B==null?void 0:B.value)||"-"],["Decode ms",(B==null?void 0:B.sinceStartMs)!=null?String(B.sinceStartMs):"-"]];return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:bn}),e.jsxs("div",{className:"msp-root",children:[ce&&e.jsx("div",{className:`flash-overlay flash-${ce}`,onAnimationEnd:()=>K(null)}),fe&&e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[e.jsx(xt,{size:48,color:"white"}),e.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),e.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:fe}),e.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),e.jsx("button",{type:"button","data-testid":"scanner-diag-toggle",onClick:()=>Wt(t=>!t),style:{position:"fixed",top:12,right:12,zIndex:70,border:"1px solid rgba(255,255,255,0.18)",background:Re?"rgba(79,70,229,0.92)":"rgba(15,23,42,0.72)",color:"#fff",borderRadius:999,padding:"8px 12px",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.04em",backdropFilter:"blur(10px)",cursor:"pointer"},children:Re?"Hide Diag":"Show Diag"}),Re&&e.jsxs("div",{"data-testid":"scanner-diag-panel",style:{position:"fixed",top:56,right:12,zIndex:69,width:"min(92vw, 320px)",background:"rgba(15,23,42,0.88)",color:"#E5EEF8",border:"1px solid rgba(255,255,255,0.12)",borderRadius:18,padding:14,backdropFilter:"blur(14px)",boxShadow:"0 12px 30px rgba(0,0,0,0.25)"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10,color:"#A5B4FC"},children:"Scanner Diagnostics"}),e.jsx("div",{style:{display:"grid",gap:6},children:Kt.map(([t,n])=>e.jsxs("div",{style:{display:"flex",gap:8,justifyContent:"space-between",alignItems:"flex-start",fontSize:"0.76rem"},children:[e.jsx("div",{style:{color:"rgba(226,232,240,0.72)",minWidth:88},children:t}),e.jsx("div",{className:"mono",style:{textAlign:"right",wordBreak:"break-word",maxWidth:180},children:n})]},t))}),e.jsx("div",{style:{marginTop:10,fontSize:"0.68rem",color:"rgba(226,232,240,0.7)",lineHeight:1.4},children:"Use this to verify whether Trackon labels are being decoded as `ITF` and how quickly the first lock happens after scan start."})]}),f!=="paired"&&e.jsx("div",{className:W(o.IDLE),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:s.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:f==="connecting"?e.jsx(Oe,{size:28,color:s.primary,style:{animation:"spin 1s linear infinite"}}):e.jsx(bt,{size:28,color:s.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:f==="connecting"?"Connecting...":"Disconnected"}),e.jsx("div",{style:{fontSize:"0.82rem",color:s.muted},children:Z||`Connecting to session ${r}`})]}),f==="disconnected"&&e.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[e.jsx(Oe,{size:16})," Reconnect"]})]})}),e.jsx("video",{ref:I,autoPlay:!0,playsInline:!0,muted:!0,onClick:()=>{L().catch(t=>{h((t==null?void 0:t.message)||"Camera access failed.")})},style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(x===o.SCANNING||x===o.CAPTURING)&&!G.current?"block":"none"}}),e.jsx("div",{className:W(o.IDLE),children:e.jsxs("div",{className:"home-root",children:[e.jsxs("div",{className:"home-header",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16},children:[e.jsxs("button",{onClick:()=>u("/app/scan"),style:{background:"white",border:"1px solid #E2E8F0",padding:"6px 12px",borderRadius:20,fontSize:"0.75rem",fontWeight:600,color:"#475569",display:"flex",alignItems:"center",gap:4,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.02)"},children:[e.jsx(nn,{size:14})," Go Back"]}),e.jsxs("div",{className:"home-logo-badge",children:[e.jsx(yt,{size:11,color:f==="paired"&&navigator.onLine?"#10B981":"#EF4444"}),Dt]})]}),e.jsx("div",{className:"home-logo-row",children:e.jsxs("div",{className:"home-logo-text",children:[e.jsx("img",{src:"/images/logo.png",alt:"Sea Hawk Logo",style:{height:28,width:"auto",objectFit:"contain",padding:2,background:"white",borderRadius:6,border:"1px solid #E2E8F0"}}),e.jsx("span",{children:"Seahawk Scanner"})]})}),e.jsxs("div",{className:"home-stats-row",children:[e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:S.scanNumber}),e.jsx("div",{className:"home-stat-label",children:"Scanned"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:tt>0?tt.toFixed(1):"0"}),e.jsx("div",{className:"home-stat-label",children:"Total kg"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:Bt}),e.jsx("div",{className:"home-stat-label",children:"Session"})]})]})]}),e.jsxs("div",{className:"home-scan-section",children:[e.jsxs("div",{className:"home-scan-btn-wrap",children:[e.jsx("div",{className:"home-scan-ring"}),e.jsx("div",{className:"home-scan-ring home-scan-ring2"}),e.jsxs("button",{className:"home-scan-btn",onClick:_t,children:[e.jsx(wt,{size:34,color:"white"}),e.jsx("span",{className:"home-scan-btn-label",children:"Scan"})]})]}),e.jsx("div",{className:"home-cta-text",children:S.scanNumber===0?"Tap to start your first scan":"Tap to scan next parcel"}),e.jsxs("form",{onSubmit:Gt,style:{width:"100%",maxWidth:300,marginTop:20},children:[e.jsx("div",{style:{fontSize:"0.62rem",fontWeight:700,color:s.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6,textAlign:"center"},children:"Can't scan? Enter AWB manually"}),e.jsxs("div",{style:{display:"flex",gap:6},children:[e.jsx("input",{"data-testid":"manual-awb-input",value:le,onChange:t=>Ve(t.target.value.toUpperCase()),placeholder:"e.g. 1234567890",inputMode:"text",autoCapitalize:"characters",style:{flex:1,padding:"9px 12px",border:`1.5px solid ${s.border}`,borderRadius:10,fontFamily:"JetBrains Mono, monospace",fontSize:"0.82rem",fontWeight:600,background:s.surface,color:s.text,outline:"none"},onFocus:t=>t.target.style.borderColor=s.primary,onBlur:t=>t.target.style.borderColor=s.border}),e.jsx("button",{type:"submit","data-testid":"manual-awb-submit",disabled:le.trim().length<6,className:"btn btn-primary",style:{padding:"9px 14px",fontSize:"0.78rem",borderRadius:10,opacity:le.trim().length>=6?1:.45},children:"Go â†’"})]})]}),e.jsxs("div",{className:"action-buttons-row",children:[e.jsxs("button",{className:"action-btn",onClick:qt,children:[e.jsx(sn,{size:14})," ",y.length>0?`Upload (${y.length})`:"Synced"]}),e.jsxs("button",{className:"action-btn danger",onClick:Ut,children:[e.jsx(on,{size:14})," End Session"]})]}),y.length>0&&e.jsxs("div",{style:{marginTop:14,fontSize:"0.7rem",color:s.warning,fontWeight:600,display:"flex",alignItems:"center",gap:5},children:[e.jsx(vt,{size:12})," ",y.length," offline scan",y.length>1?"s":""," pending sync"]})]}),e.jsxs("div",{className:"home-queue-section",children:[e.jsxs("div",{className:"home-queue-head",children:[e.jsxs("div",{className:"home-queue-title-text",children:[e.jsx(rn,{size:11}),"Accepted Consignments"]}),S.scannedItems.length>0&&e.jsx("div",{className:"home-queue-badge",children:S.scannedItems.length})]}),e.jsx("div",{className:"home-queue-list",children:S.scannedItems.length===0?e.jsxs("div",{className:"queue-empty",children:[e.jsx(Ct,{size:36,color:"rgba(255,255,255,0.12)"}),e.jsxs("div",{className:"queue-empty-text",children:["No consignments scanned yet.",e.jsx("br",{}),"Tap the button above to begin."]})]}):S.scannedItems.map((t,n)=>e.jsxs("div",{className:"queue-item",children:[e.jsx("div",{className:"queue-check",children:e.jsx(jt,{size:13,color:"#10B981"})}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{className:"queue-awb",children:t.awb}),e.jsxs("div",{className:"queue-meta",children:[t.clientCode==="OFFLINE"?e.jsx("span",{className:"queue-offline-tag",children:"Offline"}):t.clientCode&&e.jsx("span",{className:"queue-client-tag",children:t.clientCode}),t.destination&&e.jsx("span",{children:t.destination})]})]}),t.weight>0&&e.jsxs("div",{className:"queue-weight",children:[t.weight,"kg"]})]},`${t.awb}-${n}`))})]})]})}),e.jsx("div",{className:W(o.SCANNING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[e.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:G.current?"block":"none"}}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{className:"scan-guide",style:de==="barcode"?{width:Ft.w,height:Ft.h,borderRadius:10,maxHeight:"20vw",transition:"all 0.4s ease"}:{width:Fe.w,height:Fe.h,borderRadius:14,maxHeight:"75vh",transition:"all 0.4s ease",borderColor:"rgba(251,191,36,0.85)",boxShadow:"0 0 0 3px rgba(251,191,36,0.2)"},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"}),de==="barcode"&&e.jsx("div",{className:"scan-laser"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(yt,{size:12})," ",r]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[de==="document"&&e.jsxs("div",{className:"cam-hud-chip",style:{background:"rgba(251,191,36,0.22)",color:"#FDE68A",fontWeight:700,fontSize:"0.65rem",gap:4},children:[e.jsx(Nt,{size:11})," LABEL MODE"]}),e.jsxs("div",{className:"cam-hud-chip",style:{gap:4},children:[e.jsx(Ct,{size:12})," ",S.scanNumber,He==="native"?e.jsx("span",{style:{color:"#34D399",fontSize:"0.6rem",fontWeight:800},children:"⚡ NATIVE"}):e.jsx("span",{style:{color:"#F59E0B",fontSize:"0.6rem",fontWeight:800},children:"ZXING"})]})]})]}),e.jsxs("div",{className:"cam-bottom",children:[de==="barcode"?e.jsx("div",{style:{color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:"Align barcode inside the strip"}):e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:6},children:[e.jsx("div",{style:{color:"rgba(251,191,36,0.95)",fontSize:"0.82rem",fontWeight:700,textAlign:"center"},children:"No barcode found — enter AWB manually"}),e.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:()=>{D(0),ze("barcode")},children:"↩ Back to barcode mode"})]}),e.jsx("div",{style:{display:"flex",gap:12},children:e.jsx("button",{className:"cam-hud-chip",onClick:()=>$t(!ve),style:{border:"none",cursor:"pointer"},children:ve?e.jsx(an,{size:14}):e.jsx(cn,{size:14})})})]})]})}),e.jsx("div",{className:W(o.CAPTURING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!ye&&e.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[e.jsx(ln,{size:44,color:"#34D399"}),e.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:F}),e.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:"Barcode locked Â· Preparing cameraâ€¦"})]}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{ref:Me,className:`scan-guide ${ne?"detected":""}`,style:{width:Fe.w,height:Fe.h,maxHeight:"75vh",borderRadius:12},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[e.jsx(Nt,{size:12})," ",F]}),y.length>0&&e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(vt,{size:12})," ",y.length," queued"]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:ne?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center",transition:"color 0.3s"},children:ne?"âœ“ AWB in frame â€” press shutter":"Fit the AWB slip inside the frame"}),e.jsx("button",{className:"capture-btn","data-testid":"capture-photo-btn",onClick:Vt,disabled:!ye,style:{opacity:ye?1:.4},children:e.jsx("div",{className:"capture-btn-inner"})}),m&&e.jsx("button",{type:"button","data-testid":"mock-capture-btn",onClick:Ht,style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 12px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:"Mock capture"}),e.jsx("button",{style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},onClick:()=>{Y(""),$.current=!1,d(o.SCANNING)},children:"â† Rescan barcode"})]})]})}),e.jsx("div",{className:W(o.PREVIEW),children:e.jsxs("div",{style:{background:s.bg,display:"flex",flexDirection:"column",height:"100%"},children:[e.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${s.border}`},children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.72rem",color:s.muted,fontWeight:600},children:"CAPTURED"}),e.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:F})]})}),e.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:_&&e.jsx("img",{src:_,alt:"Captured label",className:"preview-img"})}),e.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{ee(null),d(o.CAPTURING)},children:[e.jsx(St,{size:16})," Retake"]}),e.jsxs("button",{"data-testid":"use-photo-btn",className:"btn btn-primary",style:{flex:2},onClick:Xt,children:[e.jsx(dn,{size:16})," Use Photo"]})]})]})}),e.jsx("div",{className:W(o.PROCESSING),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16},children:[e.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[e.jsx(un,{size:22,color:s.primary,style:{animation:"spin 2s linear infinite"}}),e.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:s.primary},children:"Intelligence Engine"})]}),e.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:s.muted},children:F}),e.jsx("div",{style:{fontSize:"0.72rem",color:s.mutedLight,marginTop:6},children:"Reading AWB label with Gemini Visionâ€¦"})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(t=>e.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:t}),e.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),e.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},t)),e.jsx("div",{style:{textAlign:"center",marginTop:8},children:e.jsx("button",{className:"btn btn-outline",style:{fontSize:"0.75rem",padding:"8px 20px"},onClick:()=>{h("Cancelled by user."),d(o.ERROR)},children:"Cancel"})})]})}),e.jsx("div",{className:W(o.REVIEWING),children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%"},children:[e.jsxs("div",{style:{padding:"14px 20px",borderBottom:`1px solid ${s.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.65rem",color:s.muted,fontWeight:600},children:"REVIEW EXTRACTION"}),e.jsx("div",{className:"mono",style:{fontSize:"0.95rem",fontWeight:700},children:(a==null?void 0:a.awb)||F})]}),(C==null?void 0:C.learnedFieldCount)>0&&e.jsxs("div",{className:"source-badge source-learned",children:["ðŸ§  ",C.learnedFieldCount," auto-corrected"]})]}),e.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsxs("div",{className:`field-card ${(((it=q.clientCode)==null?void 0:it.confidence)||0)<.55?"warning":""}`,children:[e.jsx("div",{className:_e(((st=q.clientCode)==null?void 0:st.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((ot=q.clientCode)==null?void 0:ot.source)&&(()=>{const t=zt(q.clientCode.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:l.clientCode||"",onChange:t=>E(n=>({...n,clientCode:t.target.value.toUpperCase()})),placeholder:"Client code"}),((rt=C==null?void 0:C.clientMatches)==null?void 0:rt.length)>0&&C.clientNeedsConfirmation&&e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:C.clientMatches.slice(0,3).map(t=>e.jsxs("button",{onClick:()=>E(n=>({...n,clientCode:t.code})),style:{fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:`1px solid ${s.border}`,background:l.clientCode===t.code?s.primaryLight:s.surface,color:s.text,cursor:"pointer",fontFamily:"inherit",fontWeight:500},children:[t.code," (",Math.round(t.score*100),"%)"]},t.code))})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:_e(((at=q.consignee)==null?void 0:at.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Consignee"}),e.jsx("input",{className:"field-input",value:l.consignee||"",onChange:t=>E(n=>({...n,consignee:t.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:_e(((ct=q.destination)==null?void 0:ct.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((lt=q.destination)==null?void 0:lt.source)&&(()=>{const t=zt(q.destination.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:l.destination||"",onChange:t=>E(n=>({...n,destination:t.target.value.toUpperCase()})),placeholder:"City"}),(C==null?void 0:C.pincodeCity)&&C.pincodeCity!==l.destination&&e.jsxs("button",{onClick:()=>E(t=>({...t,destination:C.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:s.successLight,color:s.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["ðŸ“ Pincode suggests: ",C.pincodeCity]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Pincode"}),e.jsx("input",{className:"field-input",value:l.pincode||"",onChange:t=>E(n=>({...n,pincode:t.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),e.jsx("div",{className:`field-card ${(dt=C==null?void 0:C.weightAnomaly)!=null&&dt.anomaly?"warning":""}`,children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Weight (kg)"}),e.jsx("input",{className:"field-input",value:l.weight||"",onChange:t=>E(n=>({...n,weight:t.target.value})),placeholder:"0.0",inputMode:"decimal"}),((ut=C==null?void 0:C.weightAnomaly)==null?void 0:ut.anomaly)&&e.jsxs("div",{style:{fontSize:"0.6rem",color:s.warning,marginTop:2,fontWeight:500},children:["âš ï¸ ",C.weightAnomaly.warning]})]})})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Amount (â‚¹)"}),e.jsx("input",{className:"field-input",value:l.amount||"",onChange:t=>E(n=>({...n,amount:t.target.value})),placeholder:"0",inputMode:"decimal"})]})}),e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Order No"}),e.jsx("input",{className:"field-input",value:l.orderNo||"",onChange:t=>E(n=>({...n,orderNo:t.target.value})),placeholder:"Optional"})]})})]})]}),e.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${s.border}`,display:"flex",gap:10},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:pe,children:[e.jsx(pn,{size:16})," Skip"]}),e.jsxs("button",{"data-testid":"approve-save-btn",className:"btn btn-success btn-lg",style:{flex:2},onClick:Yt,disabled:x===o.APPROVING,children:[x===o.APPROVING?e.jsx(Oe,{size:16,style:{animation:"spin 1s linear infinite"}}):e.jsx(jt,{size:16}),x===o.APPROVING?"Saving...":"Approve & Save"]})]})]})}),e.jsx("div",{className:W(o.APPROVING)}),e.jsx("div",{className:W(o.SUCCESS),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[e.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:s.success,strokeWidth:"3",className:"success-check-circle"}),e.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:s.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:s.success,marginBottom:4},children:"Saved Successfully"}),e.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700},children:j==null?void 0:j.awb}),(j==null?void 0:j.clientCode)&&e.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:s.primaryLight,color:s.primary,fontSize:"0.78rem",fontWeight:600},children:j.clientName||j.clientCode})]}),e.jsx("div",{style:{fontSize:"0.72rem",color:s.muted},children:j!=null&&j.offlineQueued?`${y.length} queued for sync â€¢ Auto-continuing in 3s`:`#${S.scanNumber} scanned â€¢ Auto-continuing in 3s`}),e.jsxs("button",{"data-testid":"scan-next-btn",className:"btn btn-primary btn-lg btn-full",onClick:pe,style:{maxWidth:320},children:[e.jsx(wt,{size:18})," Scan Next Parcel"]})]})}),e.jsx("div",{className:W(o.ERROR),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:s.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(xt,{size:32,color:s.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:s.error},children:"Scan Error"}),e.jsx("div",{style:{fontSize:"0.82rem",color:s.muted,marginTop:4},children:Z})]}),e.jsxs("button",{className:"btn btn-primary",onClick:pe,children:[e.jsx(St,{size:16})," Try Again"]})]})}),f==="disconnected"&&x!==o.IDLE&&e.jsxs("div",{className:"offline-banner",children:[e.jsx(bt,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline â€” Reconnecting... ",y.length?`(${y.length} queued)`:""]})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{In as default};
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/index-4oYbt_M2.js","assets/index-D3Mz4UNV.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
