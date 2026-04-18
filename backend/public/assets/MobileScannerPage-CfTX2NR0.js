import{l as Wn,_ as Ht}from"./index-C2SkN_C3.js";import{j as e}from"./page-landing-CREvANXP.js";import{r as s}from"./vendor-helmet-Dwc3L0SQ.js";import{a as Dn,c as Pn,d as Qt}from"./scannerQuality-D6Vbh8po.js";import{r as Ln,n as Mn}from"./barcode-yEOY_efB.js";import{c as $n,u as Un}from"./vendor-react-DrB23wtn.js";import{b as Kt,R as st,aS as Yt,V as Gn,aL as Xt,aM as rt,Z as Zt,aG as it,B as qn,aN as Vn,ab as Hn,d as Jt,a6 as Qn,z as en,aO as tn,aR as nn,aP as Kn,aQ as Yn,a3 as Xn,a0 as sn,O as Zn,X as Jn}from"./vendor-icons-_vZM4mPL.js";import"./page-import-PlU4c2WE.js";import"./page-reconcile-DaV-jqNQ.js";import"./page-rate-calc-BqvTJtQC.js";function Be(c,h){const E=Number(c);return Number.isFinite(E)&&E>0?E:h}function es({samples:c=[],awb:h,now:E=Date.now(),stabilityWindowMs:A=1100,requiredHits:L=3}){const g=Be(A,1100),f=Math.max(1,Math.floor(Be(L,3))),xe=Be(E,Date.now()),b=String(h||"").trim(),Q=Array.isArray(c)?c.filter(m=>(m==null?void 0:m.awb)&&xe-((m==null?void 0:m.at)||0)<=g):[];if(!b)return{samples:Q,hits:0,isStable:!1};const K=[...Q,{awb:b,at:xe}],u=K.reduce((m,We)=>We.awb===b?m+1:m,0);return{samples:K,hits:u,isStable:u>=f}}function ts({currentAttempts:c=0,maxReframeAttempts:h=2}){const E=Math.max(0,Math.floor(Be(h,2))),A=Math.max(0,Math.floor(Number(c)||0))+1;return A<=E?{action:"reframe",attempts:A}:{action:"switch_to_document",attempts:E}}var ns={};const ss=window.location.origin,rn={w:"90vw",h:"18vw"},Te={w:"92vw",h:"130vw"},an=3500,on=900,rs=1e4,is="mobile_scanner_offline_queue",cn="mobile_scanner_workflow_mode",ln="mobile_scanner_device_profile",as=80,os=1100,cs=3,at=160,ze=2,ot=45,ct=2,ls=500,dn=960,ae=.68,ds=String(ns.VITE_PREFER_ZXING_FOR_TRACKON||"1")!=="0",us=900,W={phone:"phone-camera",rugged:"rugged-scanner"},lt=["code_128","code_39","code_93","codabar","ean_13","ean_8","itf","qr_code"],i={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"},ps=c=>{var h;try{(h=navigator==null?void 0:navigator.vibrate)==null||h.call(navigator,c)}catch{}},un={tap:[20],lock:[24,24,24],success:[18,28,72],warning:[70,50,70],retry:[28,40,28],error:[110,55,110],duplicate:[90,50,90,50,90]},j=(c="tap")=>{ps(un[c]||un.tap)},Oe=(c,h,E="sine")=>{try{const A=new(window.AudioContext||window.webkitAudioContext),L=A.createOscillator(),g=A.createGain();L.type=E,L.frequency.setValueAtTime(c,A.currentTime),g.gain.setValueAtTime(.12,A.currentTime),g.gain.exponentialRampToValueAtTime(.01,A.currentTime+h),L.connect(g),g.connect(A.destination),L.start(),L.stop(A.currentTime+h)}catch{}},_e=()=>{Oe(880,.12),setTimeout(()=>Oe(1100,.1),130)},pn=()=>Oe(600,.08),oe=()=>Oe(200,.25,"sawtooth"),mn=c=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const h=new SpeechSynthesisUtterance(c);h.rate=1.2,h.pitch=1,h.lang="en-IN",window.speechSynthesis.speak(h)}catch{}},hn=()=>{var c;try{if(typeof window>"u")return!1;if(window.isSecureContext)return!0;const h=((c=window.location)==null?void 0:c.hostname)||"";return h==="localhost"||h==="127.0.0.1"}catch{return!1}},r={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",mutedLight:"#9CA3AF",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},ms=`
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
`,hs=c=>c>=.85?"high":c>=.55?"med":"low",dt=c=>`conf-dot conf-${hs(c)}`,gn=c=>c==="learned"?{className:"source-badge source-learned",icon:"AI",text:"Learned"}:c==="fuzzy_match"?{className:"source-badge source-ai",icon:"ðŸ”",text:"Matched"}:c==="fuzzy_history"||c==="consignee_pattern"?{className:"source-badge source-history",icon:"ðŸ“Š",text:"History"}:c==="delhivery_pincode"||c==="india_post"||c==="pincode_lookup"||c==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"ðŸ“",text:"Pincode"}:null,gs=c=>{const h=Math.floor(c/6e4);return h<60?`${h}m`:`${Math.floor(h/60)}h ${h%60}m`};function Rs(){var Bt,Ot,Wt,Dt,Pt,Lt,Mt,$t,Ut,Gt,qt,Vt;const{pin:c}=$n(),h=Un(),E=`${is}:${c||"unknown"}`,A=s.useMemo(()=>`mobile_scanner_daily_count:${new Date().toISOString().slice(0,10)}`,[]),L=s.useMemo(()=>{try{return typeof window>"u"?"":new URLSearchParams(window.location.search).get("mockBarcodeRaw")||""}catch{return""}},[]),g=s.useMemo(()=>{try{if(typeof window>"u")return!1;const t=new URLSearchParams(window.location.search);return t.get("mock")==="1"||t.get("e2e")==="1"}catch{return!1}},[]),[f,xe]=s.useState(null),[b,Q]=s.useState("connecting"),[K,u]=s.useState(""),[m,We]=s.useState(i.IDLE),[z,de]=s.useState(""),[se,be]=s.useState(null),[fs,ut]=s.useState({}),[o,pt]=s.useState(null),[p,M]=s.useState({}),[I,Z]=s.useState(null),[mt,ue]=s.useState(null),[ht,De]=s.useState(""),[S,gt]=s.useState([]),[Pe,Le]=s.useState(!1),[ye,Me]=s.useState(0),[N,$e]=s.useState({ok:!1,issues:[],metrics:null}),[_,Ue]=s.useState({kb:0,width:0,height:0,quality:ae}),[Ge,Ce]=s.useState(!1),[fn,xn]=s.useState("0m"),[bn,ft]=s.useState("Connected"),[pe,xt]=s.useState(""),[qe,yn]=s.useState(!1),[bt,Ve]=s.useState("idle"),[U,yt]=s.useState(null),[Cn,wn]=s.useState(0),[He,vn]=s.useState(0),[Ct,Qe]=s.useState(null),[re,Ke]=s.useState("barcode"),[y,Ye]=s.useState(()=>{if(typeof window>"u")return"fast";try{const t=localStorage.getItem(cn);if(t==="fast"||t==="ocr")return t}catch{}return g?"ocr":"fast"}),[B,wt]=s.useState(()=>{if(typeof window>"u")return W.phone;try{const t=localStorage.getItem(ln);if(t===W.phone||t===W.rugged)return t}catch{}return W.phone}),we=s.useRef(0),[k,Xe]=s.useState({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now(),scannedItems:[]}),[ve,Sn]=s.useState(!1),O=s.useRef(null),Ze=s.useRef(null),G=s.useRef(null),J=s.useRef(null),Y=s.useRef(!1),Se=s.useRef(null),Nn=s.useRef(!1),ee=s.useRef(i.IDLE),Ne=s.useRef(null),ie=s.useRef(0),q=s.useRef(null),vt=s.useRef(new Set),me=s.useRef([]),je=s.useRef({awb:"",hits:0,lastSeenAt:0}),St=s.useRef(0),he=s.useRef(!1),Nt=s.useRef(0),ke=s.useRef(null),Je=s.useRef({message:"",at:0}),V=s.useRef({lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]}),d=s.useCallback(t=>{We(t)},[]),F=s.useCallback(t=>{we.current=t,wn(t)},[]),D=s.useCallback(t=>{St.current=t,vn(t)},[]),et=s.useCallback((t,n="warning")=>{if(!t)return;const a=Date.now();Je.current.message===t&&a-Je.current.at<us||(Je.current={message:t,at:a},u(t),n&&j(n))},[]),jt=s.useCallback(t=>{F(0),D(0),Ke("document"),u(t||'No barcode lock yet. Capture label instead or tap "Back to barcode mode" and hold steady.'),j("warning")},[F,D]),ge=s.useCallback(()=>{const t=ts({currentAttempts:St.current,maxReframeAttempts:ze});if(t.action==="reframe"){D(t.attempts),F(0),u(`No lock yet. Reframe ${t.attempts}/${ze}: move closer, reduce glare, keep barcode horizontal.`),j("retry");return}jt("No stable barcode lock after reframe retries. Capture label for OCR fallback.")},[jt,F,D]),jn=s.useCallback(()=>{de(""),u(""),d(i.CAPTURING)},[d]),kt=s.useCallback(t=>{const n=Date.now(),a=es({samples:me.current,awb:t,now:n,stabilityWindowMs:os,requiredHits:cs});return me.current=a.samples,je.current={awb:t,hits:a.hits,lastSeenAt:n},a.isStable},[]),X=s.useCallback(async()=>{var a;if(!hn())throw new Error("Camera requires HTTPS (or localhost). Open this page over https:// on your phone.");if(!((a=navigator==null?void 0:navigator.mediaDevices)!=null&&a.getUserMedia))throw new Error("Camera not supported on this browser/device.");if(!O.current)throw new Error("Camera element not ready.");const t=O.current.srcObject;if(t&&typeof t.getTracks=="function"&&t.getTracks().some(x=>x.readyState==="live")){await O.current.play();return}let n=null;try{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}O.current.srcObject=n,await O.current.play()},[]);s.useEffect(()=>{const t=setInterval(()=>xn(gs(Date.now()-k.startedAt)),3e4);return()=>clearInterval(t)},[k.startedAt]);const Ee=s.useCallback(t=>{gt(t);try{t.length?localStorage.setItem(E,JSON.stringify(t)):localStorage.removeItem(E)}catch{}},[E]),Fe=s.useCallback(t=>{const n={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:t};return Ee([...S,n]),n},[S,Ee]),Re=s.useCallback(()=>{!f||!f.connected||!S.length||(S.forEach(t=>{var n;(n=t==null?void 0:t.payload)!=null&&n.awb&&f.emit("scanner:scan",t.payload)}),Ee([]))},[f,S,Ee]),$=s.useCallback(t=>{Xe(n=>{const a={...n,scannedItems:[{...t,time:Date.now()},...n.scannedItems]};try{localStorage.setItem(A,String(a.scanNumber))}catch{}return a})},[A]),kn=s.useCallback(()=>{if(b!=="paired"){u("Phone is not connected to the desktop session.");return}if(u(""),g){d(i.SCANNING);return}X().then(()=>d(i.SCANNING)).catch(t=>u((t==null?void 0:t.message)||"Camera access failed."))},[b,X,d,g]),En=s.useCallback(t=>{t==null||t.preventDefault();const n=pe.trim().toUpperCase();if(!n||n.length<6){u("Enter a valid AWB number (min 6 chars)");return}if(b!=="paired"){u("Not connected to desktop session.");return}if(u(""),xt(""),de(n),g){Ce(!0),d(i.CAPTURING);return}X().then(()=>d(i.CAPTURING)).catch(a=>u((a==null?void 0:a.message)||"Camera access failed."))},[pe,b,X,d,g]),Fn=s.useCallback(()=>{window.confirm("End this mobile scanner session on the phone?")&&(f!=null&&f.connected?f.emit("scanner:end-session",{reason:"Mobile ended the session"}):h("/"))},[f,h]),Rn=s.useCallback(()=>{if(S.length>0){Re();return}window.alert("Everything is already synced.")},[S.length,Re]);s.useEffect(()=>{ee.current=m},[m]),s.useEffect(()=>{if(g){Q("paired"),ft("Mock Mode"),u(""),d(i.IDLE);return}if(!c){u("No PIN provided.");return}const t=Wn(ss,{auth:{scannerPin:c},transports:["websocket","polling"],reconnection:!0,reconnectionDelay:1500,reconnectionAttempts:20});return t.on("connect",()=>Q("connecting")),t.on("scanner:paired",({userEmail:n})=>{Q("paired"),ft(n?n.split("@")[0]:"Connected"),u(""),d(i.IDLE)}),t.on("scanner:error",({message:n})=>{u(n),Q("disconnected")}),t.on("scanner:session-ended",({reason:n})=>{Q("disconnected"),u(n||"Session ended by desktop."),h("/")}),t.on("disconnect",()=>Q("disconnected")),t.on("reconnect",()=>{b==="paired"&&d(i.SCANNING)}),t.on("scanner:scan-processed",n=>{if(n.status==="error"){ue("error"),oe(),j("error"),d(i.ERROR),u(n.error||"Scan failed on desktop.");return}if(pt(n),M({clientCode:n.clientCode||"",consignee:n.consignee||"",destination:n.destination||"",pincode:n.pincode||"",weight:n.weight||0,amount:n.amount||0,orderNo:n.orderNo||""}),ut({}),n.reviewRequired)d(i.REVIEWING);else{_e(),j("success");const a={awb:n.awb,clientCode:n.clientCode,clientName:n.clientName,destination:n.destination||"",weight:n.weight||0};Z(a),$(a),d(i.SUCCESS)}}),t.on("scanner:approval-result",({success:n,message:a,awb:l})=>{if(n){_e(),j("success"),ue("success");const x={awb:(o==null?void 0:o.awb)||l,clientCode:p.clientCode,clientName:(o==null?void 0:o.clientName)||p.clientCode,destination:p.destination||"",weight:parseFloat(p.weight)||0};Z(x),$(x),d(i.SUCCESS)}else oe(),j("error"),u(a||"Approval failed.")}),t.on("scanner:ready-for-next",()=>{}),xe(t),()=>{t.disconnect()}},[c,$,o,p,d,h,g]),s.useEffect(()=>{try{const t=localStorage.getItem(E);if(!t)return;const n=JSON.parse(t);Array.isArray(n)&&n.length&&gt(n)}catch{}},[E]),s.useEffect(()=>{try{localStorage.setItem(cn,y)}catch{}},[y]),s.useEffect(()=>{try{localStorage.setItem(ln,B)}catch{}},[B]),s.useEffect(()=>{b==="paired"&&(f!=null&&f.connected)&&S.length&&Re()},[b,f,S.length,Re]);const ce=s.useCallback(async()=>{var t;try{if(Ce(!1),J.current){try{const n=J.current;n!=null&&n.barcodeScanner&&await n.barcodeScanner.dispose()}catch{}J.current=null}if(G.current){try{await G.current.reset()}catch{}G.current=null}(t=O.current)!=null&&t.srcObject&&(O.current.srcObject.getTracks().forEach(n=>n.stop()),O.current.srcObject=null)}catch{}},[]),le=s.useCallback(async()=>{try{if(Ve("idle"),J.current){try{await J.current.barcodeScanner.dispose()}catch{}J.current=null}if(G.current){try{G.current._type==="native"?G.current.reset():await G.current.reset()}catch{}G.current=null}}catch{}},[]),Et=s.useCallback(async()=>{if(O.current){await le();try{if(ie.current=Date.now(),await X(),ds){const[{BrowserMultiFormatReader:t},n]=await Promise.all([Ht(()=>import("./index-4oYbt_M2.js"),__vite__mapDeps([0,1])),Ht(()=>import("./index-D3Mz4UNV.js"),__vite__mapDeps([]))]),a=new Map([[n.DecodeHintType.POSSIBLE_FORMATS,[n.BarcodeFormat.CODE_128,n.BarcodeFormat.ITF,n.BarcodeFormat.CODE_39,n.BarcodeFormat.CODE_93,n.BarcodeFormat.CODABAR,n.BarcodeFormat.EAN_13,n.BarcodeFormat.EAN_8]],[n.DecodeHintType.TRY_HARDER,!0],[n.DecodeHintType.ASSUME_GS1,!1],[n.DecodeHintType.CHARACTER_SET,"UTF-8"]]),l=new t(a,40);Ve("zxing"),G.current=l,l.decodeFromVideoElement(O.current,x=>{var T,v,R;if(!Y.current)if(x){F(0);let P="unknown";try{P=String(((T=x.getBarcodeFormat)==null?void 0:T.call(x))||"unknown")}catch{}yt({value:((v=x.getText)==null?void 0:v.call(x))||"",format:P,engine:"zxing",at:Date.now(),sinceStartMs:ie.current?Date.now()-ie.current:null,candidateCount:1,ambiguous:!1,alternatives:[]}),(R=q.current)==null||R.call(q,x.getText(),{candidateCount:1,ambiguous:!1,alternatives:[],format:P,engine:"zxing"})}else{const P=we.current+1;F(P),P>=at&&ge()}});return}if(typeof window.BarcodeDetector<"u"){let t=!0,n=lt;try{const a=await window.BarcodeDetector.getSupportedFormats();n=lt.filter(l=>a.includes(l)),n.length||(n=lt)}catch{}if(n.includes("itf")||(console.log("[MobileScanner] Native BarcodeDetector lacks ITF, falling back to ZXing"),t=!1),t){Ve("native");const a=new window.BarcodeDetector({formats:n});let l=null,x=!1;const T=async()=>{var R;if(x||ee.current!==i.SCANNING)return;if(Y.current){l=setTimeout(T,ot);return}const v=O.current;if(!v||v.readyState<2){l=setTimeout(T,ot);return}try{const P=await a.detect(v),ne=P.map(w=>String((w==null?void 0:w.rawValue)||"").trim()).filter(Boolean);if(ne.length>0){const w=Ln(ne),tt=w.awb||ne[0];F(0),yt({value:tt,format:String(P[0].format||"unknown"),engine:"native",at:Date.now(),sinceStartMs:ie.current?Date.now()-ie.current:null,candidateCount:ne.length,ambiguous:w.ambiguous,alternatives:w.alternatives}),(R=q.current)==null||R.call(q,tt,{candidateCount:ne.length,ambiguous:w.ambiguous,alternatives:w.alternatives,format:String(P[0].format||"unknown"),engine:"native"})}else{const w=we.current+1;F(w),w>=at&&ge()}}catch{}ee.current===i.SCANNING&&(l=setTimeout(T,ot))};G.current={_type:"native",reset:()=>{x=!0,l&&clearTimeout(l),l=null}},setTimeout(T,220);return}}throw new Error("Unable to initialize a barcode scanner on this device.")}catch(t){u("Camera access failed: "+t.message)}}},[X,le,ge,F]),Ft=s.useCallback((t,n={})=>{var T;const a=String(t||"").trim().replace(/\s+/g,"").toUpperCase(),l=Mn(t)||a;if(Y.current||ee.current!==i.SCANNING)return;if(!l||l.length<8){a.replace(/[^A-Z0-9]/g,"").length>=4&&et("Partial barcode detected. Move closer so full AWB is visible.");return}if(n!=null&&n.ambiguous){const v=we.current+1;F(v),et("Multiple barcodes detected. Keep only the AWB barcode inside the strip.","retry"),v>=at&&ge();return}if(!g&&!kt(l))return;if(Y.current=!0,vt.current.has(l)){j("duplicate"),oe(),De(l),setTimeout(()=>{De(""),Y.current=!1,je.current={awb:"",hits:0,lastSeenAt:0},me.current=[]},2500);return}clearTimeout(Ne.current),j("lock"),pn(),de(l);const x=ie.current?Date.now()-ie.current:null;if(Qe(x),V.current={lockTimeMs:x,candidateCount:Number((n==null?void 0:n.candidateCount)||1),ambiguous:!!(n!=null&&n.ambiguous),alternatives:Array.isArray(n==null?void 0:n.alternatives)?n.alternatives.slice(0,3):[]},D(0),F(0),u(""),Xe(v=>{const R={...v,scanNumber:v.scanNumber+1};return R.scannedAwbs=new Set(v.scannedAwbs),R.scannedAwbs.add(l),vt.current=R.scannedAwbs,R}),y==="fast"){(T=ke.current)==null||T.call(ke,l);return}Ne.current=setTimeout(()=>{ee.current===i.SCANNING&&d(i.CAPTURING)},as)},[d,kt,y,g,F,D,et,ge]);s.useEffect(()=>{q.current=Ft},[Ft]),s.useEffect(()=>{if(m===i.SCANNING&&(Y.current=!1,je.current={awb:"",hits:0,lastSeenAt:0},me.current=[],V.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},Qe(null),D(0),F(0),Ke("barcode"),Et(),g&&L)){const t=setTimeout(()=>{var n;ee.current===i.SCANNING&&((n=q.current)==null||n.call(q,L))},50);return()=>clearTimeout(t)}return()=>{m===i.SCANNING&&le()}},[m,Et,le,F,D,g,L]);const Rt=s.useCallback(async()=>{if(g){Ce(!0);return}await le();try{await X(),Ce(!0)}catch(t){u("Camera access failed: "+t.message)}},[X,le,g]);s.useEffect(()=>{m===i.CAPTURING&&Rt()},[m,Rt]);const Ae=s.useCallback(()=>{const t=O.current,n=Ze.current;return Dn(t,n)},[]);s.useEffect(()=>{if(m!==i.CAPTURING){Le(!1),Me(0),$e({ok:!1,issues:[],metrics:null}),Nn.current=!1,he.current=!1;return}const t=setInterval(()=>{const n=Ae();n&&($e(n),Le(n.ok),Me(a=>{const l=n.ok?Math.min(a+1,8):0;return l>=ct&&!he.current&&(j("tap"),he.current=!0),n.ok||(he.current=!1),l}))},280);return()=>clearInterval(t)},[m,Ae]);const At=s.useCallback((t={})=>{const n=O.current,a=Ze.current;if(!n||!a||!n.videoWidth)return null;const l=Pn(n,a);if(!l)return null;const x=l.x,T=l.y,v=l.w,R=l.h;if(!v||!R)return null;const P=Math.max(640,Number(t.maxWidth||dn)),ne=Math.min(.85,Math.max(.55,Number(t.quality||ae))),w=document.createElement("canvas");w.width=Math.min(P,Math.round(v)),w.height=Math.round(w.width/v*R),w.getContext("2d").drawImage(n,x,T,v,R,0,0,w.width,w.height);const nt=w.toDataURL("image/jpeg",ne).split(",")[1]||"";if(!nt)return null;const On=Math.floor(nt.length*3/4);return{base64:nt,width:w.width,height:w.height,approxBytes:On,quality:ne}},[]),An=s.useCallback(()=>{const t=Date.now();if(t-Nt.current<ls)return;Nt.current=t;const n=Ae()||N;if(!(n!=null&&n.ok)||ye<ct){u(Qt(n==null?void 0:n.issues)||"Capture quality is low. Hold steady and align the AWB in the frame."),j("warning"),oe();return}ue("white"),pn(),j("tap");const a=At({maxWidth:dn,quality:ae});if(!(a!=null&&a.base64)){u("Could not capture image. Try again."),Y.current=!1;return}Ue({kb:Math.round((a.approxBytes||0)/1024),width:a.width||0,height:a.height||0,quality:a.quality||ae}),be(`data:image/jpeg;base64,${a.base64}`),ce(),d(i.PREVIEW)},[At,ce,d,Ae,N,ye]),In=s.useCallback(()=>{if(!g)return;const t="data:image/jpeg;base64,ZmFrZS1tb2NrLWltYWdl";Ue({kb:0,width:0,height:0,quality:ae}),be(t),ce(),d(i.PREVIEW)},[d,g,ce]),Ie=s.useCallback(()=>{var t,n,a;return{scanNumber:k.scanNumber,recentClient:k.dominantClient,dominantClient:k.dominantClient,dominantClientCount:k.dominantClientCount,sessionDurationMin:Math.round((Date.now()-k.startedAt)/6e4),scanWorkflowMode:y,scanMode:re,deviceProfile:B,hardwareClass:B===W.rugged?"rugged":"phone",captureQuality:{ok:!!N.ok,issues:Array.isArray(N.issues)?N.issues.slice(0,8):[],metrics:N.metrics||null},captureMeta:{kb:_.kb||0,width:_.width||0,height:_.height||0,quality:_.quality||ae},lockTimeMs:Number.isFinite(Number((t=V.current)==null?void 0:t.lockTimeMs))?Number(V.current.lockTimeMs):null,lockCandidateCount:Number.isFinite(Number((n=V.current)==null?void 0:n.candidateCount))?Number(V.current.candidateCount):1,lockAlternatives:Array.isArray((a=V.current)==null?void 0:a.alternatives)?V.current.alternatives.slice(0,3):[]}},[k,y,re,B,N,_]),It=s.useCallback(t=>{const n=String(t||"").trim().toUpperCase();if(!n)return;if(d(i.PROCESSING),g){setTimeout(()=>{const l={awb:n,clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25};Z(l),$(l),d(i.SUCCESS)},120);return}const a={awb:n,imageBase64:null,focusImageBase64:null,scanMode:"fast_barcode_only",sessionContext:Ie()};if(!f||!f.connected||b!=="paired"){Fe(a),_e(),j("success");const l={awb:n,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};Z({...l,offlineQueued:!0}),$(l),d(i.SUCCESS);return}f.emit("scanner:scan",a),setTimeout(()=>{ee.current===i.PROCESSING&&(u("Barcode processing timed out. Please try scanning again."),oe(),j("error"),d(i.ERROR))},rs)},[f,b,d,g,Fe,$,Ie]);s.useEffect(()=>{ke.current=It},[It]);const Tn=s.useCallback(()=>{if(!se)return;if(d(i.PROCESSING),g){setTimeout(()=>{const a={awb:z||"100454974120",clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25};Z(a),$(a),d(i.SUCCESS)},250);return}const t=se.split(",")[1]||se,n={awb:z||"",imageBase64:t,focusImageBase64:t,scanMode:"ocr_label",sessionContext:Ie()};if(!f||!f.connected||b!=="paired"){Fe(n),_e(),j("success");const a={awb:z||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};Z({...a,offlineQueued:!0}),$(a),d(i.SUCCESS);return}f.emit("scanner:scan",n),setTimeout(()=>{ee.current===i.PROCESSING&&(u("OCR timed out after 40 seconds. Retake the label photo and try again."),oe(),j("error"),d(i.ERROR))},4e4)},[f,z,se,d,b,Fe,$,g,Ie]),zn=s.useCallback(()=>{var t;if(o){if(d(i.APPROVING),g){setTimeout(()=>{const n={awb:o.awb||z,clientCode:p.clientCode||"MOCKCL",clientName:o.clientName||p.clientCode||"Mock Client",destination:p.destination||"",weight:parseFloat(p.weight)||0};Z(n),$(n),ue("success"),d(i.SUCCESS)},200);return}if(f){if(o.ocrExtracted||o){const n={clientCode:o.clientCode||"",clientName:o.clientName||"",consignee:o.consignee||"",destination:o.destination||""},a={clientCode:p.clientCode||"",clientName:p.clientCode||"",consignee:p.consignee||"",destination:p.destination||""};f.emit("scanner:learn-corrections",{pin:c,ocrFields:n,approvedFields:a,courier:(o==null?void 0:o.courier)||((t=o==null?void 0:o.ocrExtracted)==null?void 0:t.courier)||"",deviceProfile:B})}f.emit("scanner:approval-submit",{shipmentId:o.shipmentId,awb:o.awb||z,fields:{clientCode:p.clientCode,consignee:p.consignee,destination:p.destination,pincode:p.pincode,weight:parseFloat(p.weight)||0,amount:parseFloat(p.amount)||0,orderNo:p.orderNo||""}},n=>{n!=null&&n.success||(d(i.REVIEWING),oe(),j("error"),u((n==null?void 0:n.message)||"Approval failed."))}),p.clientCode&&p.clientCode!=="MISC"&&Xe(n=>{var x,T;const a={...n.clientFreq};a[p.clientCode]=(a[p.clientCode]||0)+1;const l=Object.entries(a).sort((v,R)=>R[1]-v[1]);return{...n,clientFreq:a,dominantClient:((x=l[0])==null?void 0:x[1])>=2?l[0][0]:null,dominantClientCount:((T=l[0])==null?void 0:T[1])||0}})}}},[f,o,p,z,c,d,$,g,B]),fe=s.useCallback((t=i.IDLE)=>{clearTimeout(Se.current),clearTimeout(Ne.current),de(""),be(null),Ue({kb:0,width:0,height:0,quality:ae}),pt(null),M({}),ut({}),Z(null),Qe(null),u(""),De(""),Le(!1),Me(0),$e({ok:!1,issues:[],metrics:null}),Y.current=!1,je.current={awb:"",hits:0,lastSeenAt:0},me.current=[],V.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},he.current=!1,D(0),d(t)},[d,D]);s.useEffect(()=>{if(m===i.SUCCESS){const t=y==="fast"?i.SCANNING:i.IDLE,n=y==="fast"?on:an;return Se.current=setTimeout(()=>fe(t),n),()=>clearTimeout(Se.current)}},[m,fe,y]),s.useEffect(()=>{if(ve)if(m===i.REVIEWING&&o){const t=[o.clientName||o.clientCode,o.destination,o.weight?`${o.weight} kilograms`:""].filter(Boolean);t.length&&mn(t.join(". "))}else m===i.SUCCESS&&I&&mn(`${I.clientName||I.clientCode||"Shipment"} Verified.`)},[ve,m,o,I]),s.useEffect(()=>()=>{ce(),clearTimeout(Se.current),clearTimeout(Ne.current)},[ce]);const H=t=>`msp-step ${m===t?"active":""}`,Tt=Math.max(1,Math.round((y==="fast"?on:an)/1e3)),_n=N.ok?"AWB quality looks good - press shutter":Qt(N.issues)||"Fit AWB slip fully in frame and hold steady",zt=Ge&&N.ok&&ye>=ct,te=s.useMemo(()=>{if(!o)return{};const t=o.ocrExtracted||o;return{clientCode:{confidence:(t==null?void 0:t.clientNameConfidence)||0,source:(t==null?void 0:t.clientNameSource)||null},consignee:{confidence:(t==null?void 0:t.consigneeConfidence)||0,source:(t==null?void 0:t.consigneeSource)||null},destination:{confidence:(t==null?void 0:t.destinationConfidence)||0,source:(t==null?void 0:t.destinationSource)||null},pincode:{confidence:(t==null?void 0:t.pincodeConfidence)||0,source:null},weight:{confidence:(t==null?void 0:t.weightConfidence)||0,source:null}}},[o]),_t=k.scannedItems.reduce((t,n)=>t+(n.weight||0),0),C=((Bt=o==null?void 0:o.ocrExtracted)==null?void 0:Bt.intelligence)||(o==null?void 0:o.intelligence)||null,Bn=[["Step",m],["Connection",b],["Engine",bt],["Workflow",y],["Device",B],["Scan mode",re],["Fail count",String(Cn)],["Reframe retries",`${He}/${ze}`],["Camera",Ge?"ready":"waiting"],["Doc detect",Pe?`yes (${ye})`:"no"],["Capture quality",N.ok?"good":N.issues.join(", ")||"pending"],["Capture metrics",N.metrics?`blur ${N.metrics.blurScore} | glare ${N.metrics.glareRatio}% | skew ${N.metrics.perspectiveSkew}%`:"-"],["JPEG last shot",_.kb?`${_.kb}KB ${_.width}x${_.height} q=${_.quality}`:"-"],["Secure ctx",hn()?"yes":"no"],["AWB lock",z||"-"],["Lock ms",Ct!=null?String(Ct):"-"],["Lock candidates",String(((Ot=V.current)==null?void 0:Ot.candidateCount)||1)],["Queued",String(S.length)],["Scans",String(k.scanNumber)],["Last format",(U==null?void 0:U.format)||"-"],["Last code",(U==null?void 0:U.value)||"-"],["Decode ms",(U==null?void 0:U.sinceStartMs)!=null?String(U.sinceStartMs):"-"],["False-lock",(Wt=o==null?void 0:o.scanTelemetry)!=null&&Wt.falseLock?"yes":"no"]];return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:ms}),e.jsxs("div",{className:"msp-root",children:[mt&&e.jsx("div",{className:`flash-overlay flash-${mt}`,onAnimationEnd:()=>ue(null)}),ht&&e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[e.jsx(Kt,{size:48,color:"white"}),e.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),e.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:ht}),e.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),e.jsx("button",{type:"button","data-testid":"scanner-diag-toggle",onClick:()=>yn(t=>!t),style:{position:"fixed",top:12,right:12,zIndex:70,border:"1px solid rgba(255,255,255,0.18)",background:qe?"rgba(79,70,229,0.92)":"rgba(15,23,42,0.72)",color:"#fff",borderRadius:999,padding:"8px 12px",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.04em",backdropFilter:"blur(10px)",cursor:"pointer"},children:qe?"Hide Diag":"Show Diag"}),qe&&e.jsxs("div",{"data-testid":"scanner-diag-panel",style:{position:"fixed",top:56,right:12,zIndex:69,width:"min(92vw, 320px)",background:"rgba(15,23,42,0.88)",color:"#E5EEF8",border:"1px solid rgba(255,255,255,0.12)",borderRadius:18,padding:14,backdropFilter:"blur(14px)",boxShadow:"0 12px 30px rgba(0,0,0,0.25)"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10,color:"#A5B4FC"},children:"Scanner Diagnostics"}),e.jsx("div",{style:{display:"grid",gap:6},children:Bn.map(([t,n])=>e.jsxs("div",{style:{display:"flex",gap:8,justifyContent:"space-between",alignItems:"flex-start",fontSize:"0.76rem"},children:[e.jsx("div",{style:{color:"rgba(226,232,240,0.72)",minWidth:88},children:t}),e.jsx("div",{className:"mono",style:{textAlign:"right",wordBreak:"break-word",maxWidth:180},children:n})]},t))}),e.jsx("div",{style:{marginTop:10,fontSize:"0.68rem",color:"rgba(226,232,240,0.7)",lineHeight:1.4},children:"Use this to verify whether Trackon labels are being decoded as `ITF` and how quickly the first lock happens after scan start."})]}),b!=="paired"&&e.jsx("div",{className:H(i.IDLE),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:r.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:b==="connecting"?e.jsx(st,{size:28,color:r.primary,style:{animation:"spin 1s linear infinite"}}):e.jsx(Yt,{size:28,color:r.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:b==="connecting"?"Connecting...":"Disconnected"}),e.jsx("div",{style:{fontSize:"0.82rem",color:r.muted},children:K||`Connecting to session ${c}`})]}),b==="disconnected"&&e.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[e.jsx(st,{size:16})," Reconnect"]})]})}),e.jsx("video",{ref:O,autoPlay:!0,playsInline:!0,muted:!0,onClick:()=>{X().catch(t=>{u((t==null?void 0:t.message)||"Camera access failed.")})},style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(m===i.SCANNING||m===i.CAPTURING)&&!J.current?"block":"none"}}),e.jsx("div",{className:H(i.IDLE),children:e.jsxs("div",{className:"home-root",children:[e.jsxs("div",{className:"home-header",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16},children:[e.jsxs("button",{onClick:()=>h("/app/scan"),style:{background:"white",border:"1px solid #E2E8F0",padding:"6px 12px",borderRadius:20,fontSize:"0.75rem",fontWeight:600,color:"#475569",display:"flex",alignItems:"center",gap:4,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.02)"},children:[e.jsx(Gn,{size:14})," Go Back"]}),e.jsxs("div",{className:"home-logo-badge",children:[e.jsx(Xt,{size:11,color:b==="paired"&&navigator.onLine?"#10B981":"#EF4444"}),bn]})]}),e.jsx("div",{className:"home-logo-row",children:e.jsxs("div",{className:"home-logo-text",children:[e.jsx("img",{src:"/images/logo.png",alt:"Sea Hawk Logo",style:{height:28,width:"auto",objectFit:"contain",padding:2,background:"white",borderRadius:6,border:"1px solid #E2E8F0"}}),e.jsx("span",{children:"Seahawk Scanner"})]})}),e.jsxs("div",{className:"home-stats-row",children:[e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:k.scanNumber}),e.jsx("div",{className:"home-stat-label",children:"Scanned"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:_t>0?_t.toFixed(1):"0"}),e.jsx("div",{className:"home-stat-label",children:"Total kg"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:fn}),e.jsx("div",{className:"home-stat-label",children:"Session"})]})]})]}),e.jsxs("div",{className:"home-scan-section",children:[e.jsxs("div",{className:"home-scan-btn-wrap",children:[e.jsx("div",{className:"home-scan-ring"}),e.jsx("div",{className:"home-scan-ring home-scan-ring2"}),e.jsxs("button",{"data-testid":"start-scan-btn",className:"home-scan-btn",onClick:kn,children:[e.jsx(rt,{size:34,color:"white"}),e.jsx("span",{className:"home-scan-btn-label",children:"Scan"})]})]}),e.jsx("div",{className:"home-cta-text",children:k.scanNumber===0?"Tap to start your first scan":"Tap to scan next parcel"}),e.jsxs("div",{style:{display:"flex",gap:8,marginTop:14,width:"100%",maxWidth:320},children:[e.jsxs("button",{type:"button","data-testid":"workflow-fast-btn",onClick:()=>Ye("fast"),style:{flex:1,borderRadius:999,border:`1px solid ${y==="fast"?r.primary:r.border}`,background:y==="fast"?r.primaryLight:r.surface,color:y==="fast"?r.primary:r.muted,fontWeight:700,fontSize:"0.72rem",padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(Zt,{size:13})," Fast scan"]}),e.jsxs("button",{type:"button","data-testid":"workflow-ocr-btn",onClick:()=>Ye("ocr"),style:{flex:1,borderRadius:999,border:`1px solid ${y==="ocr"?r.primary:r.border}`,background:y==="ocr"?r.primaryLight:r.surface,color:y==="ocr"?r.primary:r.muted,fontWeight:700,fontSize:"0.72rem",padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(it,{size:13})," OCR label"]})]}),e.jsxs("div",{style:{display:"flex",gap:8,marginTop:8,width:"100%",maxWidth:320},children:[e.jsxs("button",{type:"button","data-testid":"device-profile-phone-btn",onClick:()=>wt(W.phone),style:{flex:1,borderRadius:999,border:`1px solid ${B===W.phone?r.primary:r.border}`,background:B===W.phone?r.primaryLight:r.surface,color:B===W.phone?r.primary:r.muted,fontWeight:700,fontSize:"0.7rem",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(rt,{size:13})," Phone lens"]}),e.jsxs("button",{type:"button","data-testid":"device-profile-rugged-btn",onClick:()=>wt(W.rugged),style:{flex:1,borderRadius:999,border:`1px solid ${B===W.rugged?r.primary:r.border}`,background:B===W.rugged?r.primaryLight:r.surface,color:B===W.rugged?r.primary:r.muted,fontWeight:700,fontSize:"0.7rem",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"},children:[e.jsx(qn,{size:13})," Rugged"]})]}),e.jsxs("form",{onSubmit:En,style:{width:"100%",maxWidth:300,marginTop:20},children:[e.jsx("div",{style:{fontSize:"0.62rem",fontWeight:700,color:r.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6,textAlign:"center"},children:"Can't scan? Enter AWB manually"}),e.jsxs("div",{style:{display:"flex",gap:6},children:[e.jsx("input",{"data-testid":"manual-awb-input",value:pe,onChange:t=>xt(t.target.value.toUpperCase()),placeholder:"e.g. 1234567890",inputMode:"text",autoCapitalize:"characters",style:{flex:1,padding:"9px 12px",border:`1.5px solid ${r.border}`,borderRadius:10,fontFamily:"JetBrains Mono, monospace",fontSize:"0.82rem",fontWeight:600,background:r.surface,color:r.text,outline:"none"},onFocus:t=>t.target.style.borderColor=r.primary,onBlur:t=>t.target.style.borderColor=r.border}),e.jsx("button",{type:"submit","data-testid":"manual-awb-submit",disabled:pe.trim().length<6,className:"btn btn-primary",style:{padding:"9px 14px",fontSize:"0.78rem",borderRadius:10,opacity:pe.trim().length>=6?1:.45},children:"Go â†’"})]})]}),e.jsxs("div",{className:"action-buttons-row",children:[e.jsxs("button",{className:"action-btn",onClick:Rn,children:[e.jsx(Vn,{size:14})," ",S.length>0?`Upload (${S.length})`:"Synced"]}),e.jsxs("button",{className:"action-btn danger",onClick:Fn,children:[e.jsx(Hn,{size:14})," End Session"]})]}),S.length>0&&e.jsxs("div",{style:{marginTop:14,fontSize:"0.7rem",color:r.warning,fontWeight:600,display:"flex",alignItems:"center",gap:5},children:[e.jsx(Jt,{size:12})," ",S.length," offline scan",S.length>1?"s":""," pending sync"]})]}),e.jsxs("div",{className:"home-queue-section",children:[e.jsxs("div",{className:"home-queue-head",children:[e.jsxs("div",{className:"home-queue-title-text",children:[e.jsx(Qn,{size:11}),"Accepted Consignments"]}),k.scannedItems.length>0&&e.jsx("div",{className:"home-queue-badge",children:k.scannedItems.length})]}),e.jsx("div",{className:"home-queue-list",children:k.scannedItems.length===0?e.jsxs("div",{className:"queue-empty",children:[e.jsx(en,{size:36,color:"rgba(255,255,255,0.12)"}),e.jsxs("div",{className:"queue-empty-text",children:["No consignments scanned yet.",e.jsx("br",{}),"Tap the button above to begin."]})]}):k.scannedItems.map((t,n)=>e.jsxs("div",{className:"queue-item",children:[e.jsx("div",{className:"queue-check",children:e.jsx(tn,{size:13,color:"#10B981"})}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{className:"queue-awb",children:t.awb}),e.jsxs("div",{className:"queue-meta",children:[t.clientCode==="OFFLINE"?e.jsx("span",{className:"queue-offline-tag",children:"Offline"}):t.clientCode&&e.jsx("span",{className:"queue-client-tag",children:t.clientCode}),t.destination&&e.jsx("span",{children:t.destination})]})]}),t.weight>0&&e.jsxs("div",{className:"queue-weight",children:[t.weight,"kg"]})]},`${t.awb}-${n}`))})]})]})}),e.jsx("div",{className:H(i.SCANNING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[e.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:J.current?"block":"none"}}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{className:"scan-guide",style:re==="barcode"?{width:rn.w,height:rn.h,borderRadius:10,maxHeight:"20vw",transition:"all 0.4s ease",borderColor:K?"rgba(248,113,113,0.92)":void 0,boxShadow:K?"0 0 0 3px rgba(248,113,113,0.2)":void 0}:{width:Te.w,height:Te.h,borderRadius:14,maxHeight:"75vh",transition:"all 0.4s ease",borderColor:"rgba(251,191,36,0.85)",boxShadow:"0 0 0 3px rgba(251,191,36,0.2)"},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"}),re==="barcode"&&e.jsx("div",{className:"scan-laser"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(Xt,{size:12})," ",c]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[re==="document"&&e.jsxs("div",{className:"cam-hud-chip",style:{background:"rgba(251,191,36,0.22)",color:"#FDE68A",fontWeight:700,fontSize:"0.65rem",gap:4},children:[e.jsx(nn,{size:11})," LABEL MODE"]}),e.jsxs("div",{className:"cam-hud-chip",style:{gap:4},children:[e.jsx(en,{size:12})," ",k.scanNumber,bt==="native"?e.jsx("span",{style:{color:"#34D399",fontSize:"0.6rem",fontWeight:800},children:"⚡ NATIVE"}):e.jsx("span",{style:{color:"#F59E0B",fontSize:"0.6rem",fontWeight:800},children:"ZXING"})]})]})]}),e.jsxs("div",{className:"cam-bottom",children:[re==="barcode"?e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:6,color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:[e.jsx("div",{children:y==="fast"?"Align barcode inside the strip - auto-save on lock":"Align barcode inside the strip - camera opens for label capture after lock"}),He>0&&e.jsxs("div",{style:{color:"#FDE68A",fontSize:"0.74rem",fontWeight:700},children:["Reframe retry ",He,"/",ze]}),!!K&&e.jsx("div",{style:{color:"#FCA5A5",fontSize:"0.72rem",fontWeight:700},children:K})]}):e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:6},children:[e.jsx("div",{style:{color:"rgba(251,191,36,0.95)",fontSize:"0.82rem",fontWeight:700,textAlign:"center"},children:"No barcode found - capture the label and we will read the printed AWB"}),e.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"},children:[e.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:jn,children:"Capture label instead"}),e.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:()=>{F(0),D(0),u(""),Ke("barcode"),j("tap")},children:"Back to barcode mode"})]})]}),e.jsxs("div",{style:{display:"flex",gap:12},children:[e.jsxs("button",{className:"cam-hud-chip",onClick:()=>Ye(t=>t==="fast"?"ocr":"fast"),style:{border:"none",cursor:"pointer",gap:5},children:[y==="fast"?e.jsx(Zt,{size:13}):e.jsx(it,{size:13}),y==="fast"?"FAST":"OCR"]}),e.jsx("button",{className:"cam-hud-chip",onClick:()=>Sn(!ve),style:{border:"none",cursor:"pointer"},children:ve?e.jsx(Kn,{size:14}):e.jsx(Yn,{size:14})})]})]})]})}),e.jsx("div",{className:H(i.CAPTURING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!Ge&&e.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[e.jsx(Xn,{size:44,color:"#34D399"}),e.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:z||"OCR fallback"}),e.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:z?"Barcode locked - Preparing camera...":"Preparing label capture for printed AWB OCR..."})]}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{ref:Ze,className:`scan-guide ${Pe?"detected":""}`,style:{width:Te.w,height:Te.h,maxHeight:"75vh",borderRadius:12},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[e.jsx(nn,{size:12})," ",z||"OCR AWB capture"]}),S.length>0&&e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(Jt,{size:12})," ",S.length," queued"]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:Pe?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center",transition:"color 0.3s"},children:_n}),N.metrics&&e.jsxs("div",{style:{color:"rgba(255,255,255,0.66)",fontSize:"0.72rem",textAlign:"center"},children:["Blur ",N.metrics.blurScore," | Glare ",N.metrics.glareRatio,"% | Skew ",N.metrics.perspectiveSkew,"%"]}),e.jsx("button",{className:"capture-btn","data-testid":"capture-photo-btn",onClick:An,disabled:!zt,style:{opacity:zt?1:.4},children:e.jsx("div",{className:"capture-btn-inner"})}),g&&e.jsx("button",{type:"button","data-testid":"mock-capture-btn",onClick:In,style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 12px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:"Mock capture"}),e.jsx("button",{style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},onClick:()=>{de(""),u(""),F(0),D(0),Y.current=!1,j("tap"),d(i.SCANNING)},children:"â† Rescan barcode"})]})]})}),e.jsx("div",{className:H(i.PREVIEW),children:e.jsxs("div",{style:{background:r.bg,display:"flex",flexDirection:"column",height:"100%"},children:[e.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${r.border}`},children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.72rem",color:r.muted,fontWeight:600},children:"CAPTURED"}),e.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:z||"Printed AWB OCR"}),_.kb>0&&e.jsxs("div",{style:{fontSize:"0.68rem",color:r.mutedLight},children:[_.kb,"KB • ",_.width,"×",_.height]})]})}),e.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:se&&e.jsx("img",{src:se,alt:"Captured label",className:"preview-img"})}),e.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{be(null),d(i.CAPTURING)},children:[e.jsx(sn,{size:16})," Retake"]}),e.jsxs("button",{"data-testid":"use-photo-btn",className:"btn btn-primary",style:{flex:2},onClick:Tn,children:[e.jsx(Zn,{size:16})," Use Photo"]})]})]})}),e.jsx("div",{className:H(i.PROCESSING),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16},children:[e.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[e.jsx(it,{size:22,color:r.primary,style:{animation:"spin 2s linear infinite"}}),e.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:r.primary},children:"Intelligence Engine"})]}),e.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:r.muted},children:z}),e.jsx("div",{style:{fontSize:"0.72rem",color:r.mutedLight,marginTop:6},children:se?"Reading AWB label with local OCR...":"Saving barcode scan..."})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(t=>e.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:t}),e.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),e.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},t)),e.jsx("div",{style:{textAlign:"center",marginTop:8},children:e.jsx("button",{className:"btn btn-outline",style:{fontSize:"0.75rem",padding:"8px 20px"},onClick:()=>{u("Cancelled by user."),d(i.ERROR)},children:"Cancel"})})]})}),e.jsx("div",{className:H(i.REVIEWING),children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%"},children:[e.jsxs("div",{style:{padding:"14px 20px",borderBottom:`1px solid ${r.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.65rem",color:r.muted,fontWeight:600},children:"REVIEW EXTRACTION"}),e.jsx("div",{className:"mono",style:{fontSize:"0.95rem",fontWeight:700},children:(o==null?void 0:o.awb)||z})]}),(C==null?void 0:C.learnedFieldCount)>0&&e.jsxs("div",{className:"source-badge source-learned",children:["AI ",C.learnedFieldCount," auto-corrected"]})]}),e.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsxs("div",{className:`field-card ${(((Dt=te.clientCode)==null?void 0:Dt.confidence)||0)<.55?"warning":""}`,children:[e.jsx("div",{className:dt(((Pt=te.clientCode)==null?void 0:Pt.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((Lt=te.clientCode)==null?void 0:Lt.source)&&(()=>{const t=gn(te.clientCode.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:p.clientCode||"",onChange:t=>M(n=>({...n,clientCode:t.target.value.toUpperCase()})),placeholder:"Client code"}),((Mt=C==null?void 0:C.clientMatches)==null?void 0:Mt.length)>0&&C.clientNeedsConfirmation&&e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:C.clientMatches.slice(0,3).map(t=>e.jsxs("button",{onClick:()=>M(n=>({...n,clientCode:t.code})),style:{fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:`1px solid ${r.border}`,background:p.clientCode===t.code?r.primaryLight:r.surface,color:r.text,cursor:"pointer",fontFamily:"inherit",fontWeight:500},children:[t.code," (",Math.round(t.score*100),"%)"]},t.code))})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:dt((($t=te.consignee)==null?void 0:$t.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Consignee"}),e.jsx("input",{className:"field-input",value:p.consignee||"",onChange:t=>M(n=>({...n,consignee:t.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:dt(((Ut=te.destination)==null?void 0:Ut.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((Gt=te.destination)==null?void 0:Gt.source)&&(()=>{const t=gn(te.destination.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:p.destination||"",onChange:t=>M(n=>({...n,destination:t.target.value.toUpperCase()})),placeholder:"City"}),(C==null?void 0:C.pincodeCity)&&C.pincodeCity!==p.destination&&e.jsxs("button",{onClick:()=>M(t=>({...t,destination:C.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:r.successLight,color:r.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["ðŸ“ Pincode suggests: ",C.pincodeCity]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Pincode"}),e.jsx("input",{className:"field-input",value:p.pincode||"",onChange:t=>M(n=>({...n,pincode:t.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),e.jsx("div",{className:`field-card ${(qt=C==null?void 0:C.weightAnomaly)!=null&&qt.anomaly?"warning":""}`,children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Weight (kg)"}),e.jsx("input",{className:"field-input",value:p.weight||"",onChange:t=>M(n=>({...n,weight:t.target.value})),placeholder:"0.0",inputMode:"decimal"}),((Vt=C==null?void 0:C.weightAnomaly)==null?void 0:Vt.anomaly)&&e.jsxs("div",{style:{fontSize:"0.6rem",color:r.warning,marginTop:2,fontWeight:500},children:["Warning: ",C.weightAnomaly.warning]})]})})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Amount (â‚¹)"}),e.jsx("input",{className:"field-input",value:p.amount||"",onChange:t=>M(n=>({...n,amount:t.target.value})),placeholder:"0",inputMode:"decimal"})]})}),e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Order No"}),e.jsx("input",{className:"field-input",value:p.orderNo||"",onChange:t=>M(n=>({...n,orderNo:t.target.value})),placeholder:"Optional"})]})})]})]}),e.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${r.border}`,display:"flex",gap:10},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:fe,children:[e.jsx(Jn,{size:16})," Skip"]}),e.jsxs("button",{"data-testid":"approve-save-btn",className:"btn btn-success btn-lg",style:{flex:2},onClick:zn,disabled:m===i.APPROVING,children:[m===i.APPROVING?e.jsx(st,{size:16,style:{animation:"spin 1s linear infinite"}}):e.jsx(tn,{size:16}),m===i.APPROVING?"Saving...":"Approve & Save"]})]})]})}),e.jsx("div",{className:H(i.APPROVING)}),e.jsx("div",{className:H(i.SUCCESS),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[e.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:r.success,strokeWidth:"3",className:"success-check-circle"}),e.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:r.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:r.success,marginBottom:4},children:"Saved Successfully"}),e.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700},children:I==null?void 0:I.awb}),(I==null?void 0:I.clientCode)&&e.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:r.primaryLight,color:r.primary,fontSize:"0.78rem",fontWeight:600},children:I.clientName||I.clientCode})]}),e.jsx("div",{style:{fontSize:"0.72rem",color:r.muted},children:I!=null&&I.offlineQueued?`${S.length} queued for sync - Auto-continuing in ${Tt}s`:`#${k.scanNumber} scanned - Auto-continuing in ${Tt}s`}),e.jsxs("button",{"data-testid":"scan-next-btn",className:"btn btn-primary btn-lg btn-full",onClick:()=>fe(y==="fast"?i.SCANNING:i.IDLE),style:{maxWidth:320},children:[e.jsx(rt,{size:18})," ",y==="fast"?"Keep Scanning":"Scan Next Parcel"]})]})}),e.jsx("div",{className:H(i.ERROR),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:r.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(Kt,{size:32,color:r.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:r.error},children:"Scan Error"}),e.jsx("div",{style:{fontSize:"0.82rem",color:r.muted,marginTop:4},children:K})]}),e.jsxs("button",{className:"btn btn-primary",onClick:fe,children:[e.jsx(sn,{size:16})," Try Again"]})]})}),b==="disconnected"&&m!==i.IDLE&&e.jsxs("div",{className:"offline-banner",children:[e.jsx(Yt,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline â€” Reconnecting... ",S.length?`(${S.length} queued)`:""]})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{Rs as default};
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/index-4oYbt_M2.js","assets/index-D3Mz4UNV.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
