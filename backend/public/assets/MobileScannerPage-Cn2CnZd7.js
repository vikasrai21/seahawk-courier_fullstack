import{l as Mt,_ as it}from"./index-B6nUsx3D.js";import{j as e}from"./page-landing-Bx5c8M2c.js";import{r as i}from"./vendor-helmet-Dwc3L0SQ.js";import{c as Bt,u as Pt}from"./vendor-react-DGJm5saH.js";import{b as ot,R as Fe,aL as rt,V as Ot,aD as at,aE as ct,aF as Wt,a5 as Dt,d as lt,a0 as $t,z as dt,aG as ut,aH as _t,aI as Lt,au as Gt,aJ as Ut,aK as mt,O as qt,ax as Vt,X as Ht}from"./vendor-icons-B-y-vFlY.js";import"./page-import-DbzlmOjL.js";import"./page-reconcile-DYr3-Xse.js";import"./page-rate-calc-B5qi160J.js";function pt(a,m){var R,E;try{if(!a||!m)return null;const h=Number(a.videoWidth||0),u=Number(a.videoHeight||0);if(!h||!u)return null;const M=(R=a.getBoundingClientRect)==null?void 0:R.call(a),y=(E=m.getBoundingClientRect)==null?void 0:E.call(m);if(!M||!y)return null;const A=Number(M.width||0),K=Number(M.height||0);if(!A||!K)return null;const p=Math.max(A/h,K/u),f=h*p,Ce=u*p,S=(A-f)/2,V=(K-Ce)/2,W=y.left-M.left,Q=y.top-M.top,ze=y.right-M.left,de=y.bottom-M.top,r=(W-S)/p,ie=(Q-V)/p,l=(ze-S)/p,k=(de-V)/p,w=(me,re,pe)=>Math.max(re,Math.min(pe,me)),B=w(Math.min(r,l),0,h),oe=w(Math.min(ie,k),0,u),H=w(Math.max(r,l),0,h),ue=w(Math.max(ie,k),0,u),J=Math.max(0,H-B),x=Math.max(0,ue-oe);return!J||!x?null:{x:B,y:oe,w:J,h:x}}catch{return null}}const Xt=window.location.origin,ht={w:"90vw",h:"18vw"},gt={w:"92vw",h:"130vw"},Yt=3500,Kt="mobile_scanner_offline_queue",Qt=80,Ee=["code_128","code_39","code_93","codabar","ean_13","ean_8","itf","qr_code"],o={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"},se=a=>{var m;try{(m=navigator==null?void 0:navigator.vibrate)==null||m.call(navigator,a)}catch{}},ve=(a,m,R="sine")=>{try{const E=new(window.AudioContext||window.webkitAudioContext),h=E.createOscillator(),u=E.createGain();h.type=R,h.frequency.setValueAtTime(a,E.currentTime),u.gain.setValueAtTime(.12,E.currentTime),u.gain.exponentialRampToValueAtTime(.01,E.currentTime+m),h.connect(u),u.connect(E.destination),h.start(),h.stop(E.currentTime+m)}catch{}},Ie=()=>{ve(880,.12),setTimeout(()=>ve(1100,.1),130)},ft=()=>ve(600,.08),Re=()=>ve(200,.25,"sawtooth"),xt=a=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const m=new SpeechSynthesisUtterance(a);m.rate=1.2,m.pitch=1,m.lang="en-IN",window.speechSynthesis.speak(m)}catch{}},Jt=()=>{var a;try{if(typeof window>"u")return!1;if(window.isSecureContext)return!0;const m=((a=window.location)==null?void 0:a.hostname)||"";return m==="localhost"||m==="127.0.0.1"}catch{return!1}},s={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",mutedLight:"#9CA3AF",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},Zt=`
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
`,en=a=>a>=.85?"high":a>=.55?"med":"low",Ae=a=>`conf-dot conf-${en(a)}`,bt=a=>a==="learned"?{className:"source-badge source-learned",icon:"ðŸ§ ",text:"Learned"}:a==="fuzzy_match"?{className:"source-badge source-ai",icon:"ðŸ”",text:"Matched"}:a==="fuzzy_history"||a==="consignee_pattern"?{className:"source-badge source-history",icon:"ðŸ“Š",text:"History"}:a==="delhivery_pincode"||a==="india_post"||a==="pincode_lookup"||a==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"ðŸ“",text:"Pincode"}:null,tn=a=>{const m=Math.floor(a/6e4);return m<60?`${m}m`:`${Math.floor(m/60)}h ${m%60}m`};function mn(){var Ge,Ue,qe,Ve,He,Xe,Ye,Ke,Qe,Je;const{pin:a}=Bt(),m=Pt(),R=`${Kt}:${a||"unknown"}`,E=i.useMemo(()=>`mobile_scanner_daily_count:${new Date().toISOString().slice(0,10)}`,[]),h=i.useMemo(()=>{try{if(typeof window>"u")return!1;const t=new URLSearchParams(window.location.search);return t.get("mock")==="1"||t.get("e2e")==="1"}catch{return!1}},[]),[u,M]=i.useState(null),[y,A]=i.useState("connecting"),[K,p]=i.useState(""),[f,Ce]=i.useState(o.IDLE),[S,V]=i.useState(""),[W,Q]=i.useState(null),[ze,de]=i.useState({}),[r,ie]=i.useState(null),[l,k]=i.useState({}),[w,B]=i.useState(null),[oe,H]=i.useState(null),[ue,J]=i.useState(""),[x,me]=i.useState([]),[re,pe]=i.useState(!1),[nn,Te]=i.useState(0),[je,he]=i.useState(!1),[yt,wt]=i.useState("0m"),[vt,Me]=i.useState("Connected"),[ae,Be]=i.useState(""),[j,Ne]=i.useState({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now(),scannedItems:[]}),[ge,Ct]=i.useState(!1),F=i.useRef(null),Se=i.useRef(null),z=i.useRef(null),D=i.useRef(null),P=i.useRef(!1),fe=i.useRef(null),jt=i.useRef(!1),Z=i.useRef(o.IDLE),xe=i.useRef(null),X=i.useRef(null),Pe=i.useRef(new Set),O=i.useCallback(async()=>{var c;if(!Jt())throw new Error("Camera requires HTTPS (or localhost). Open this page over https:// on your phone.");if(!((c=navigator==null?void 0:navigator.mediaDevices)!=null&&c.getUserMedia))throw new Error("Camera not supported on this browser/device.");if(!F.current)throw new Error("Camera element not ready.");const t=F.current.srcObject;if(t&&typeof t.getTracks=="function"&&t.getTracks().some(v=>v.readyState==="live")){await F.current.play();return}let n=null;try{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}F.current.srcObject=n,await F.current.play()},[]);i.useEffect(()=>{const t=setInterval(()=>wt(tn(Date.now()-j.startedAt)),3e4);return()=>clearInterval(t)},[j.startedAt]);const be=i.useCallback(t=>{me(t);try{t.length?localStorage.setItem(R,JSON.stringify(t)):localStorage.removeItem(R)}catch{}},[R]),Oe=i.useCallback(t=>{const n={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:t};return be([...x,n]),n},[x,be]),ye=i.useCallback(()=>{!u||!u.connected||!x.length||(x.forEach(t=>{var n,c;!((n=t==null?void 0:t.payload)!=null&&n.awb)||!((c=t==null?void 0:t.payload)!=null&&c.imageBase64)||u.emit("scanner:scan",t.payload)}),be([]))},[u,x,be]),d=i.useCallback(t=>{Ce(t)},[]),$=i.useCallback(t=>{Ne(n=>{const c={...n,scannedItems:[{...t,time:Date.now()},...n.scannedItems]};try{localStorage.setItem(E,String(c.scanNumber))}catch{}return c})},[E]),Nt=i.useCallback(()=>{if(y!=="paired"){p("Phone is not connected to the desktop session.");return}if(p(""),h){d(o.SCANNING);return}O().then(()=>d(o.SCANNING)).catch(t=>p((t==null?void 0:t.message)||"Camera access failed."))},[y,O,d,h]),St=i.useCallback(t=>{t==null||t.preventDefault();const n=ae.trim().toUpperCase();if(!n||n.length<6){p("Enter a valid AWB number (min 6 chars)");return}if(y!=="paired"){p("Not connected to desktop session.");return}if(p(""),Be(""),V(n),h){he(!0),d(o.CAPTURING);return}O().then(()=>d(o.CAPTURING)).catch(c=>p((c==null?void 0:c.message)||"Camera access failed."))},[ae,y,O,d,h]),kt=i.useCallback(()=>{window.confirm("End this mobile scanner session on the phone?")&&(u!=null&&u.connected?u.emit("scanner:end-session",{reason:"Mobile ended the session"}):m("/"))},[u,m]),Ft=i.useCallback(()=>{if(x.length>0){ye();return}window.alert("Everything is already synced.")},[x.length,ye]);i.useEffect(()=>{Z.current=f},[f]),i.useEffect(()=>{if(h){A("paired"),Me("Mock Mode"),p(""),d(o.IDLE);return}if(!a){p("No PIN provided.");return}const t=Mt(Xt,{auth:{scannerPin:a},transports:["websocket","polling"],reconnection:!0,reconnectionDelay:1500,reconnectionAttempts:20});return t.on("connect",()=>A("connecting")),t.on("scanner:paired",({userEmail:n})=>{A("paired"),Me(n?n.split("@")[0]:"Connected"),p(""),d(o.IDLE)}),t.on("scanner:error",({message:n})=>{p(n),A("disconnected")}),t.on("scanner:session-ended",({reason:n})=>{A("disconnected"),p(n||"Session ended by desktop."),m("/")}),t.on("disconnect",()=>A("disconnected")),t.on("reconnect",()=>{y==="paired"&&d(o.SCANNING)}),t.on("scanner:scan-processed",n=>{if(n.status==="error"){H("error"),Re(),se([100,50,100]),d(o.ERROR),p(n.error||"Scan failed on desktop.");return}if(ie(n),k({clientCode:n.clientCode||"",consignee:n.consignee||"",destination:n.destination||"",pincode:n.pincode||"",weight:n.weight||0,amount:n.amount||0,orderNo:n.orderNo||""}),de({}),n.reviewRequired)d(o.REVIEWING);else{Ie(),se([50,30,50]);const c={awb:n.awb,clientCode:n.clientCode,clientName:n.clientName,destination:n.destination||"",weight:n.weight||0};B(c),$(c),d(o.SUCCESS)}}),t.on("scanner:approval-result",({success:n,message:c,awb:g})=>{if(n){Ie(),se([50,30,50]),H("success");const v={awb:(r==null?void 0:r.awb)||g,clientCode:l.clientCode,clientName:(r==null?void 0:r.clientName)||l.clientCode,destination:l.destination||"",weight:parseFloat(l.weight)||0};B(v),$(v),d(o.SUCCESS)}else Re(),p(c||"Approval failed.")}),t.on("scanner:ready-for-next",()=>{}),M(t),()=>{t.disconnect()}},[a,$,r,l,d,m,h]),i.useEffect(()=>{try{const t=localStorage.getItem(R);if(!t)return;const n=JSON.parse(t);Array.isArray(n)&&n.length&&me(n)}catch{}},[R]),i.useEffect(()=>{y==="paired"&&(u!=null&&u.connected)&&x.length&&ye()},[y,u,x.length,ye]);const ee=i.useCallback(async()=>{var t;try{if(he(!1),D.current){try{const n=D.current;n!=null&&n.barcodeScanner&&await n.barcodeScanner.dispose()}catch{}D.current=null}if(z.current){try{await z.current.reset()}catch{}z.current=null}(t=F.current)!=null&&t.srcObject&&(F.current.srcObject.getTracks().forEach(n=>n.stop()),F.current.srcObject=null)}catch{}},[]),te=i.useCallback(async()=>{try{if(D.current){try{await D.current.barcodeScanner.dispose()}catch{}D.current=null}if(z.current){try{z.current._type==="native"?z.current.reset():await z.current.reset()}catch{}z.current=null}}catch{}},[]),We=i.useCallback(async()=>{if(F.current){await te();try{if(await O(),typeof window.BarcodeDetector<"u"){let v=!0,C=Ee;try{const I=await window.BarcodeDetector.getSupportedFormats();C=Ee.filter(N=>I.includes(N)),C.length||(C=Ee)}catch{}if(C.includes("itf")||(console.log("[MobileScanner] Native BarcodeDetector lacks ITF â€” falling back to ZXing"),v=!1),v){const I=new window.BarcodeDetector({formats:C});let N=null,Y=!1;const L=async()=>{var ne;if(Y||P.current||Z.current!==o.SCANNING)return;const G=F.current;if(!G||G.readyState<2){N=setTimeout(L,60);return}try{const U=await I.detect(G);U.length>0&&U[0].rawValue&&((ne=X.current)==null||ne.call(X,U[0].rawValue))}catch{}Z.current===o.SCANNING&&(N=setTimeout(L,60))};z.current={_type:"native",reset:()=>{Y=!0,N&&clearTimeout(N),N=null}},setTimeout(L,300);return}}const[{BrowserMultiFormatReader:t},n]=await Promise.all([it(()=>import("./index-4oYbt_M2.js"),__vite__mapDeps([0,1])),it(()=>import("./index-D3Mz4UNV.js"),__vite__mapDeps([]))]),c=new Map([[n.DecodeHintType.POSSIBLE_FORMATS,[n.BarcodeFormat.CODE_128,n.BarcodeFormat.ITF,n.BarcodeFormat.CODE_39,n.BarcodeFormat.CODE_93,n.BarcodeFormat.CODABAR,n.BarcodeFormat.EAN_13,n.BarcodeFormat.EAN_8]],[n.DecodeHintType.TRY_HARDER,!0],[n.DecodeHintType.ASSUME_GS1,!1],[n.DecodeHintType.CHARACTER_SET,"UTF-8"]]),g=new t(c,40);z.current=g,g.decodeFromVideoElement(F.current,v=>{var C;P.current||v&&((C=X.current)==null||C.call(X,v.getText()))})}catch(t){p("Camera access failed: "+t.message)}}},[O,te]),De=i.useCallback(t=>{const n=String(t||"").trim().replace(/\s+/g,"").toUpperCase();if(!(!n||n.length<6||P.current||Z.current!==o.SCANNING)){if(P.current=!0,Pe.current.has(n)){se([100,50,100,50,100]),Re(),J(n),setTimeout(()=>{J(""),P.current=!1},2500);return}clearTimeout(xe.current),se([50]),ft(),V(n),Ne(c=>{const g={...c,scanNumber:c.scanNumber+1};return g.scannedAwbs=new Set(c.scannedAwbs),g.scannedAwbs.add(n),Pe.current=g.scannedAwbs,g}),xe.current=setTimeout(()=>{Z.current===o.SCANNING&&d(o.CAPTURING)},Qt)}},[d]);i.useEffect(()=>{X.current=De},[De]),i.useEffect(()=>(f===o.SCANNING&&(P.current=!1,We()),()=>{f===o.SCANNING&&te()}),[f,We,te]);const $e=i.useCallback(async()=>{if(h){he(!0);return}await te();try{await O(),he(!0)}catch(t){p("Camera access failed: "+t.message)}},[O,te,h]);i.useEffect(()=>{f===o.CAPTURING&&$e()},[f,$e]),i.useEffect(()=>{if(f!==o.CAPTURING){pe(!1),Te(0),jt.current=!1;return}const t=setInterval(()=>{const n=F.current,c=Se.current;if(!n||!c||!n.videoWidth||!n.videoHeight)return;const g=pt(n,c);if(!g)return;const v=Math.max(0,Math.floor(g.x)),C=Math.max(0,Math.floor(g.y)),I=Math.max(24,Math.floor(g.w)),N=Math.max(24,Math.floor(g.h)),Y=document.createElement("canvas"),L=96,G=72;Y.width=L,Y.height=G;const ne=Y.getContext("2d",{willReadFrequently:!0});if(!ne)return;ne.drawImage(n,v,C,Math.min(I,n.videoWidth-v),Math.min(N,n.videoHeight-C),0,0,L,G);const U=ne.getImageData(0,0,L,G).data;let Ze=0,et=0,tt=0,nt=0;for(let q=0;q<U.length;q+=4){const le=.2126*U[q]+.7152*U[q+1]+.0722*U[q+2];Ze+=le,et+=le*le,q>0&&Math.abs(le-nt)>26&&tt++,nt=le}const ke=L*G,we=Ze/ke,zt=Math.sqrt(Math.max(0,et/ke-we*we)),Tt=tt/Math.max(ke,1),st=we>35&&we<225&&zt>24&&Tt>.12;pe(st),Te(q=>st?Math.min(q+1,8):0)},320);return()=>clearInterval(t)},[f]);const _e=i.useCallback(()=>{const t=F.current,n=Se.current;if(!t||!n||!t.videoWidth)return null;const c=pt(t,n);if(!c)return null;const g=c.x,v=c.y,C=c.w,I=c.h;if(!C||!I)return null;const N=document.createElement("canvas");return N.width=Math.min(1200,Math.round(C)),N.height=Math.round(N.width/C*I),N.getContext("2d").drawImage(t,g,v,C,I,0,0,N.width,N.height),N.toDataURL("image/jpeg",.75).split(",")[1]||null},[]),Et=i.useCallback(()=>{H("white"),ft(),se([30]);const t=_e();if(!t){p("Could not capture image. Try again."),P.current=!1;return}Q(`data:image/jpeg;base64,${t}`),ee(),d(o.PREVIEW)},[_e,ee,d]),It=i.useCallback(()=>{if(!h)return;Q("data:image/jpeg;base64,ZmFrZS1tb2NrLWltYWdl"),ee(),d(o.PREVIEW)},[d,h,ee]),Rt=i.useCallback(()=>{if(!S||!W)return;if(d(o.PROCESSING),h){setTimeout(()=>{const g={awb:S,clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25};B(g),$(g),d(o.SUCCESS)},250);return}const t={scanNumber:j.scanNumber,recentClient:j.dominantClient,dominantClient:j.dominantClient,dominantClientCount:j.dominantClientCount,sessionDurationMin:Math.round((Date.now()-j.startedAt)/6e4)},n=W.split(",")[1]||W,c={awb:S,imageBase64:n,focusImageBase64:n,sessionContext:t};if(!u||!u.connected||y!=="paired"){Oe(c),Ie();const g={awb:S,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};B({...g,offlineQueued:!0}),$(g),d(o.SUCCESS);return}u.emit("scanner:scan",c),setTimeout(()=>{Z.current===o.PROCESSING&&(p("OCR timed out after 40 seconds. Check that GEMINI_API_KEY is set on Railway, then try again."),d(o.ERROR))},4e4)},[u,S,W,j,d,y,Oe,$,h]),At=i.useCallback(()=>{if(r){if(d(o.APPROVING),h){setTimeout(()=>{const t={awb:r.awb||S,clientCode:l.clientCode||"MOCKCL",clientName:r.clientName||l.clientCode||"Mock Client",destination:l.destination||"",weight:parseFloat(l.weight)||0};B(t),$(t),H("success"),d(o.SUCCESS)},200);return}if(u){if(r.ocrExtracted||r){const t={clientCode:r.clientCode||"",clientName:r.clientName||"",consignee:r.consignee||"",destination:r.destination||""},n={clientCode:l.clientCode||"",clientName:l.clientCode||"",consignee:l.consignee||"",destination:l.destination||""};u.emit("scanner:learn-corrections",{pin:a,ocrFields:t,approvedFields:n})}u.emit("scanner:approval-submit",{shipmentId:r.shipmentId,awb:r.awb||S,fields:{clientCode:l.clientCode,consignee:l.consignee,destination:l.destination,pincode:l.pincode,weight:parseFloat(l.weight)||0,amount:parseFloat(l.amount)||0,orderNo:l.orderNo||""}},t=>{t!=null&&t.success||(d(o.REVIEWING),p((t==null?void 0:t.message)||"Approval failed."))}),l.clientCode&&l.clientCode!=="MISC"&&Ne(t=>{var g,v;const n={...t.clientFreq};n[l.clientCode]=(n[l.clientCode]||0)+1;const c=Object.entries(n).sort((C,I)=>I[1]-C[1]);return{...t,clientFreq:n,dominantClient:((g=c[0])==null?void 0:g[1])>=2?c[0][0]:null,dominantClientCount:((v=c[0])==null?void 0:v[1])||0}})}}},[u,r,l,S,a,d,$,h]),ce=i.useCallback(()=>{clearTimeout(fe.current),clearTimeout(xe.current),V(""),Q(null),ie(null),k({}),de({}),B(null),p(""),J(""),P.current=!1,d(o.IDLE)},[d]);i.useEffect(()=>{if(f===o.SUCCESS)return fe.current=setTimeout(ce,Yt),()=>clearTimeout(fe.current)},[f,ce]),i.useEffect(()=>{if(ge)if(f===o.REVIEWING&&r){const t=[r.clientName||r.clientCode,r.destination,r.weight?`${r.weight} kilograms`:""].filter(Boolean);t.length&&xt(t.join(". "))}else f===o.SUCCESS&&w&&xt(`${w.clientName||w.clientCode||"Shipment"} Verified.`)},[ge,f,r,w]),i.useEffect(()=>()=>{ee(),clearTimeout(fe.current),clearTimeout(xe.current)},[ee]);const T=t=>`msp-step ${f===t?"active":""}`,_=i.useMemo(()=>{if(!r)return{};const t=r.ocrExtracted||r;return{clientCode:{confidence:(t==null?void 0:t.clientNameConfidence)||0,source:(t==null?void 0:t.clientNameSource)||null},consignee:{confidence:(t==null?void 0:t.consigneeConfidence)||0,source:(t==null?void 0:t.consigneeSource)||null},destination:{confidence:(t==null?void 0:t.destinationConfidence)||0,source:(t==null?void 0:t.destinationSource)||null},pincode:{confidence:(t==null?void 0:t.pincodeConfidence)||0,source:null},weight:{confidence:(t==null?void 0:t.weightConfidence)||0,source:null}}},[r]),Le=j.scannedItems.reduce((t,n)=>t+(n.weight||0),0),b=((Ge=r==null?void 0:r.ocrExtracted)==null?void 0:Ge.intelligence)||(r==null?void 0:r.intelligence)||null;return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:Zt}),e.jsxs("div",{className:"msp-root",children:[oe&&e.jsx("div",{className:`flash-overlay flash-${oe}`,onAnimationEnd:()=>H(null)}),ue&&e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[e.jsx(ot,{size:48,color:"white"}),e.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),e.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:ue}),e.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),y!=="paired"&&e.jsx("div",{className:T(o.IDLE),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:s.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:y==="connecting"?e.jsx(Fe,{size:28,color:s.primary,style:{animation:"spin 1s linear infinite"}}):e.jsx(rt,{size:28,color:s.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:y==="connecting"?"Connecting...":"Disconnected"}),e.jsx("div",{style:{fontSize:"0.82rem",color:s.muted},children:K||`Connecting to session ${a}`})]}),y==="disconnected"&&e.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[e.jsx(Fe,{size:16})," Reconnect"]})]})}),e.jsx("video",{ref:F,autoPlay:!0,playsInline:!0,muted:!0,onClick:()=>{O().catch(t=>{p((t==null?void 0:t.message)||"Camera access failed.")})},style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(f===o.SCANNING||f===o.CAPTURING)&&!D.current?"block":"none"}}),e.jsx("div",{className:T(o.IDLE),children:e.jsxs("div",{className:"home-root",children:[e.jsxs("div",{className:"home-header",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16},children:[e.jsxs("button",{onClick:()=>m("/app/scan"),style:{background:"white",border:"1px solid #E2E8F0",padding:"6px 12px",borderRadius:20,fontSize:"0.75rem",fontWeight:600,color:"#475569",display:"flex",alignItems:"center",gap:4,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.02)"},children:[e.jsx(Ot,{size:14})," Go Back"]}),e.jsxs("div",{className:"home-logo-badge",children:[e.jsx(at,{size:11,color:y==="paired"&&navigator.onLine?"#10B981":"#EF4444"}),vt]})]}),e.jsx("div",{className:"home-logo-row",children:e.jsxs("div",{className:"home-logo-text",children:[e.jsx("img",{src:"/images/logo.png",alt:"Sea Hawk Logo",style:{height:28,width:"auto",objectFit:"contain",padding:2,background:"white",borderRadius:6,border:"1px solid #E2E8F0"}}),e.jsx("span",{children:"Seahawk Scanner"})]})}),e.jsxs("div",{className:"home-stats-row",children:[e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:j.scanNumber}),e.jsx("div",{className:"home-stat-label",children:"Scanned"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:Le>0?Le.toFixed(1):"0"}),e.jsx("div",{className:"home-stat-label",children:"Total kg"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:yt}),e.jsx("div",{className:"home-stat-label",children:"Session"})]})]})]}),e.jsxs("div",{className:"home-scan-section",children:[e.jsxs("div",{className:"home-scan-btn-wrap",children:[e.jsx("div",{className:"home-scan-ring"}),e.jsx("div",{className:"home-scan-ring home-scan-ring2"}),e.jsxs("button",{className:"home-scan-btn",onClick:Nt,children:[e.jsx(ct,{size:34,color:"white"}),e.jsx("span",{className:"home-scan-btn-label",children:"Scan"})]})]}),e.jsx("div",{className:"home-cta-text",children:j.scanNumber===0?"Tap to start your first scan":"Tap to scan next parcel"}),e.jsxs("form",{onSubmit:St,style:{width:"100%",maxWidth:300,marginTop:20},children:[e.jsx("div",{style:{fontSize:"0.62rem",fontWeight:700,color:s.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6,textAlign:"center"},children:"Can't scan? Enter AWB manually"}),e.jsxs("div",{style:{display:"flex",gap:6},children:[e.jsx("input",{"data-testid":"manual-awb-input",value:ae,onChange:t=>Be(t.target.value.toUpperCase()),placeholder:"e.g. 1234567890",inputMode:"text",autoCapitalize:"characters",style:{flex:1,padding:"9px 12px",border:`1.5px solid ${s.border}`,borderRadius:10,fontFamily:"JetBrains Mono, monospace",fontSize:"0.82rem",fontWeight:600,background:s.surface,color:s.text,outline:"none"},onFocus:t=>t.target.style.borderColor=s.primary,onBlur:t=>t.target.style.borderColor=s.border}),e.jsx("button",{type:"submit","data-testid":"manual-awb-submit",disabled:ae.trim().length<6,className:"btn btn-primary",style:{padding:"9px 14px",fontSize:"0.78rem",borderRadius:10,opacity:ae.trim().length>=6?1:.45},children:"Go â†’"})]})]}),e.jsxs("div",{className:"action-buttons-row",children:[e.jsxs("button",{className:"action-btn",onClick:Ft,children:[e.jsx(Wt,{size:14})," ",x.length>0?`Upload (${x.length})`:"Synced"]}),e.jsxs("button",{className:"action-btn danger",onClick:kt,children:[e.jsx(Dt,{size:14})," End Session"]})]}),x.length>0&&e.jsxs("div",{style:{marginTop:14,fontSize:"0.7rem",color:s.warning,fontWeight:600,display:"flex",alignItems:"center",gap:5},children:[e.jsx(lt,{size:12})," ",x.length," offline scan",x.length>1?"s":""," pending sync"]})]}),e.jsxs("div",{className:"home-queue-section",children:[e.jsxs("div",{className:"home-queue-head",children:[e.jsxs("div",{className:"home-queue-title-text",children:[e.jsx($t,{size:11}),"Accepted Consignments"]}),j.scannedItems.length>0&&e.jsx("div",{className:"home-queue-badge",children:j.scannedItems.length})]}),e.jsx("div",{className:"home-queue-list",children:j.scannedItems.length===0?e.jsxs("div",{className:"queue-empty",children:[e.jsx(dt,{size:36,color:"rgba(255,255,255,0.12)"}),e.jsxs("div",{className:"queue-empty-text",children:["No consignments scanned yet.",e.jsx("br",{}),"Tap the button above to begin."]})]}):j.scannedItems.map((t,n)=>e.jsxs("div",{className:"queue-item",children:[e.jsx("div",{className:"queue-check",children:e.jsx(ut,{size:13,color:"#10B981"})}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{className:"queue-awb",children:t.awb}),e.jsxs("div",{className:"queue-meta",children:[t.clientCode==="OFFLINE"?e.jsx("span",{className:"queue-offline-tag",children:"Offline"}):t.clientCode&&e.jsx("span",{className:"queue-client-tag",children:t.clientCode}),t.destination&&e.jsx("span",{children:t.destination})]})]}),t.weight>0&&e.jsxs("div",{className:"queue-weight",children:[t.weight,"kg"]})]},`${t.awb}-${n}`))})]})]})}),e.jsx("div",{className:T(o.SCANNING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[e.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:D.current?"block":"none"}}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{className:"scan-guide",style:{width:ht.w,height:ht.h,borderRadius:10,maxHeight:"20vw"},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"}),e.jsx("div",{className:"scan-laser"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(at,{size:12})," ",a]}),e.jsxs("div",{className:"cam-hud-chip",style:{gap:4},children:[e.jsx(dt,{size:12})," ",j.scanNumber,typeof window<"u"&&typeof window.BarcodeDetector<"u"?e.jsx("span",{style:{color:"#34D399",fontSize:"0.6rem",fontWeight:800},children:"âš¡ NATIVE"}):e.jsx("span",{style:{color:"#F59E0B",fontSize:"0.6rem",fontWeight:800},children:"ZXING"})]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:"Align barcode inside the strip"}),e.jsx("div",{style:{display:"flex",gap:12},children:e.jsx("button",{className:"cam-hud-chip",onClick:()=>Ct(!ge),style:{border:"none",cursor:"pointer"},children:ge?e.jsx(_t,{size:14}):e.jsx(Lt,{size:14})})})]})]})}),e.jsx("div",{className:T(o.CAPTURING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!je&&e.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[e.jsx(Gt,{size:44,color:"#34D399"}),e.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:S}),e.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:"Barcode locked Â· Preparing cameraâ€¦"})]}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{ref:Se,className:`scan-guide ${re?"detected":""}`,style:{width:gt.w,height:gt.h,maxHeight:"75vh",borderRadius:12},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[e.jsx(Ut,{size:12})," ",S]}),x.length>0&&e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(lt,{size:12})," ",x.length," queued"]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:re?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center",transition:"color 0.3s"},children:re?"âœ“ AWB in frame â€” press shutter":"Fit the AWB slip inside the frame"}),e.jsx("button",{className:"capture-btn","data-testid":"capture-photo-btn",onClick:Et,disabled:!je,style:{opacity:je?1:.4},children:e.jsx("div",{className:"capture-btn-inner"})}),h&&e.jsx("button",{type:"button","data-testid":"mock-capture-btn",onClick:It,style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 12px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:"Mock capture"}),e.jsx("button",{style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},onClick:()=>{V(""),P.current=!1,d(o.SCANNING)},children:"â† Rescan barcode"})]})]})}),e.jsx("div",{className:T(o.PREVIEW),children:e.jsxs("div",{style:{background:s.bg,display:"flex",flexDirection:"column",height:"100%"},children:[e.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${s.border}`},children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.72rem",color:s.muted,fontWeight:600},children:"CAPTURED"}),e.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:S})]})}),e.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:W&&e.jsx("img",{src:W,alt:"Captured label",className:"preview-img"})}),e.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{Q(null),d(o.CAPTURING)},children:[e.jsx(mt,{size:16})," Retake"]}),e.jsxs("button",{"data-testid":"use-photo-btn",className:"btn btn-primary",style:{flex:2},onClick:Rt,children:[e.jsx(qt,{size:16})," Use Photo"]})]})]})}),e.jsx("div",{className:T(o.PROCESSING),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16},children:[e.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[e.jsx(Vt,{size:22,color:s.primary,style:{animation:"spin 2s linear infinite"}}),e.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:s.primary},children:"Intelligence Engine"})]}),e.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:s.muted},children:S}),e.jsx("div",{style:{fontSize:"0.72rem",color:s.mutedLight,marginTop:6},children:"Reading AWB label with Gemini Visionâ€¦"})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(t=>e.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:t}),e.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),e.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},t)),e.jsx("div",{style:{textAlign:"center",marginTop:8},children:e.jsx("button",{className:"btn btn-outline",style:{fontSize:"0.75rem",padding:"8px 20px"},onClick:()=>{p("Cancelled by user."),d(o.ERROR)},children:"Cancel"})})]})}),e.jsx("div",{className:T(o.REVIEWING),children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%"},children:[e.jsxs("div",{style:{padding:"14px 20px",borderBottom:`1px solid ${s.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.65rem",color:s.muted,fontWeight:600},children:"REVIEW EXTRACTION"}),e.jsx("div",{className:"mono",style:{fontSize:"0.95rem",fontWeight:700},children:(r==null?void 0:r.awb)||S})]}),(b==null?void 0:b.learnedFieldCount)>0&&e.jsxs("div",{className:"source-badge source-learned",children:["ðŸ§  ",b.learnedFieldCount," auto-corrected"]})]}),e.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsxs("div",{className:`field-card ${(((Ue=_.clientCode)==null?void 0:Ue.confidence)||0)<.55?"warning":""}`,children:[e.jsx("div",{className:Ae(((qe=_.clientCode)==null?void 0:qe.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((Ve=_.clientCode)==null?void 0:Ve.source)&&(()=>{const t=bt(_.clientCode.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:l.clientCode||"",onChange:t=>k(n=>({...n,clientCode:t.target.value.toUpperCase()})),placeholder:"Client code"}),((He=b==null?void 0:b.clientMatches)==null?void 0:He.length)>0&&b.clientNeedsConfirmation&&e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:b.clientMatches.slice(0,3).map(t=>e.jsxs("button",{onClick:()=>k(n=>({...n,clientCode:t.code})),style:{fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:`1px solid ${s.border}`,background:l.clientCode===t.code?s.primaryLight:s.surface,color:s.text,cursor:"pointer",fontFamily:"inherit",fontWeight:500},children:[t.code," (",Math.round(t.score*100),"%)"]},t.code))})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:Ae(((Xe=_.consignee)==null?void 0:Xe.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Consignee"}),e.jsx("input",{className:"field-input",value:l.consignee||"",onChange:t=>k(n=>({...n,consignee:t.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:Ae(((Ye=_.destination)==null?void 0:Ye.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((Ke=_.destination)==null?void 0:Ke.source)&&(()=>{const t=bt(_.destination.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:l.destination||"",onChange:t=>k(n=>({...n,destination:t.target.value.toUpperCase()})),placeholder:"City"}),(b==null?void 0:b.pincodeCity)&&b.pincodeCity!==l.destination&&e.jsxs("button",{onClick:()=>k(t=>({...t,destination:b.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:s.successLight,color:s.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["ðŸ“ Pincode suggests: ",b.pincodeCity]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Pincode"}),e.jsx("input",{className:"field-input",value:l.pincode||"",onChange:t=>k(n=>({...n,pincode:t.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),e.jsx("div",{className:`field-card ${(Qe=b==null?void 0:b.weightAnomaly)!=null&&Qe.anomaly?"warning":""}`,children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Weight (kg)"}),e.jsx("input",{className:"field-input",value:l.weight||"",onChange:t=>k(n=>({...n,weight:t.target.value})),placeholder:"0.0",inputMode:"decimal"}),((Je=b==null?void 0:b.weightAnomaly)==null?void 0:Je.anomaly)&&e.jsxs("div",{style:{fontSize:"0.6rem",color:s.warning,marginTop:2,fontWeight:500},children:["âš ï¸ ",b.weightAnomaly.warning]})]})})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Amount (â‚¹)"}),e.jsx("input",{className:"field-input",value:l.amount||"",onChange:t=>k(n=>({...n,amount:t.target.value})),placeholder:"0",inputMode:"decimal"})]})}),e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Order No"}),e.jsx("input",{className:"field-input",value:l.orderNo||"",onChange:t=>k(n=>({...n,orderNo:t.target.value})),placeholder:"Optional"})]})})]})]}),e.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${s.border}`,display:"flex",gap:10},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:ce,children:[e.jsx(Ht,{size:16})," Skip"]}),e.jsxs("button",{"data-testid":"approve-save-btn",className:"btn btn-success btn-lg",style:{flex:2},onClick:At,disabled:f===o.APPROVING,children:[f===o.APPROVING?e.jsx(Fe,{size:16,style:{animation:"spin 1s linear infinite"}}):e.jsx(ut,{size:16}),f===o.APPROVING?"Saving...":"Approve & Save"]})]})]})}),e.jsx("div",{className:T(o.APPROVING)}),e.jsx("div",{className:T(o.SUCCESS),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[e.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:s.success,strokeWidth:"3",className:"success-check-circle"}),e.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:s.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:s.success,marginBottom:4},children:"Saved Successfully"}),e.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700},children:w==null?void 0:w.awb}),(w==null?void 0:w.clientCode)&&e.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:s.primaryLight,color:s.primary,fontSize:"0.78rem",fontWeight:600},children:w.clientName||w.clientCode})]}),e.jsx("div",{style:{fontSize:"0.72rem",color:s.muted},children:w!=null&&w.offlineQueued?`${x.length} queued for sync â€¢ Auto-continuing in 3s`:`#${j.scanNumber} scanned â€¢ Auto-continuing in 3s`}),e.jsxs("button",{"data-testid":"scan-next-btn",className:"btn btn-primary btn-lg btn-full",onClick:ce,style:{maxWidth:320},children:[e.jsx(ct,{size:18})," Scan Next Parcel"]})]})}),e.jsx("div",{className:T(o.ERROR),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:s.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(ot,{size:32,color:s.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:s.error},children:"Scan Error"}),e.jsx("div",{style:{fontSize:"0.82rem",color:s.muted,marginTop:4},children:K})]}),e.jsxs("button",{className:"btn btn-primary",onClick:ce,children:[e.jsx(mt,{size:16})," Try Again"]})]})}),y==="disconnected"&&f!==o.IDLE&&e.jsxs("div",{className:"offline-banner",children:[e.jsx(rt,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline â€” Reconnecting... ",x.length?`(${x.length} queued)`:""]})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{mn as default};
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/index-4oYbt_M2.js","assets/index-D3Mz4UNV.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
