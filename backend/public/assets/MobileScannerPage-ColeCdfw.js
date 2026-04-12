import{l as Ut,_ as lt}from"./index-B_VOhQVw.js";import{j as e}from"./page-landing-Bx5c8M2c.js";import{r as i}from"./vendor-helmet-Dwc3L0SQ.js";import{c as qt,u as Vt}from"./vendor-react-DGJm5saH.js";import{b as dt,R as Ae,aL as ut,V as Ht,aD as pt,aE as mt,aF as Xt,a5 as Yt,d as ht,a0 as Kt,z as gt,aG as ft,aH as Qt,aI as Jt,au as Zt,aJ as en,aK as xt,O as tn,ax as nn,X as sn}from"./vendor-icons-B-y-vFlY.js";import"./page-import-DbzlmOjL.js";import"./page-reconcile-DYr3-Xse.js";import"./page-rate-calc-B5qi160J.js";function bt(a,p){var R,I;try{if(!a||!p)return null;const h=Number(a.videoWidth||0),u=Number(a.videoHeight||0);if(!h||!u)return null;const D=(R=a.getBoundingClientRect)==null?void 0:R.call(a),y=(I=p.getBoundingClientRect)==null?void 0:I.call(p);if(!D||!y)return null;const A=Number(D.width||0),Q=Number(D.height||0);if(!A||!Q)return null;const m=Math.max(A/h,Q/u),f=h*m,Se=u*m,S=(A-f)/2,X=(Q-Se)/2,$=y.left-D.left,J=y.top-D.top,We=y.right-D.left,pe=y.bottom-D.top,r=($-S)/m,re=(J-X)/m,l=(We-S)/m,k=(pe-X)/m,v=(he,ee,ge)=>Math.max(ee,Math.min(ge,he)),O=v(Math.min(r,l),0,h),ae=v(Math.min(re,k),0,u),Y=v(Math.max(r,l),0,h),me=v(Math.max(re,k),0,u),Z=Math.max(0,Y-O),b=Math.max(0,me-ae);return!Z||!b?null:{x:O,y:ae,w:Z,h:b}}catch{return null}}const on=window.location.origin,yt={w:"90vw",h:"18vw"},wt={w:"92vw",h:"130vw"},rn=3500,an="mobile_scanner_offline_queue",cn=80,ze=["code_128","code_39","code_93","codabar","ean_13","ean_8","itf","qr_code"],o={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"},oe=a=>{var p;try{(p=navigator==null?void 0:navigator.vibrate)==null||p.call(navigator,a)}catch{}},Ne=(a,p,R="sine")=>{try{const I=new(window.AudioContext||window.webkitAudioContext),h=I.createOscillator(),u=I.createGain();h.type=R,h.frequency.setValueAtTime(a,I.currentTime),u.gain.setValueAtTime(.12,I.currentTime),u.gain.exponentialRampToValueAtTime(.01,I.currentTime+p),h.connect(u),u.connect(I.destination),h.start(),h.stop(I.currentTime+p)}catch{}},Te=()=>{Ne(880,.12),setTimeout(()=>Ne(1100,.1),130)},vt=()=>Ne(600,.08),Me=()=>Ne(200,.25,"sawtooth"),Ct=a=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const p=new SpeechSynthesisUtterance(a);p.rate=1.2,p.pitch=1,p.lang="en-IN",window.speechSynthesis.speak(p)}catch{}},jt=()=>{var a;try{if(typeof window>"u")return!1;if(window.isSecureContext)return!0;const p=((a=window.location)==null?void 0:a.hostname)||"";return p==="localhost"||p==="127.0.0.1"}catch{return!1}},s={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",mutedLight:"#9CA3AF",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},ln=`
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
`,dn=a=>a>=.85?"high":a>=.55?"med":"low",Be=a=>`conf-dot conf-${dn(a)}`,Nt=a=>a==="learned"?{className:"source-badge source-learned",icon:"ðŸ§ ",text:"Learned"}:a==="fuzzy_match"?{className:"source-badge source-ai",icon:"ðŸ”",text:"Matched"}:a==="fuzzy_history"||a==="consignee_pattern"?{className:"source-badge source-history",icon:"ðŸ“Š",text:"History"}:a==="delhivery_pincode"||a==="india_post"||a==="pincode_lookup"||a==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"ðŸ“",text:"Pincode"}:null,un=a=>{const p=Math.floor(a/6e4);return p<60?`${p}m`:`${Math.floor(p/60)}h ${p%60}m`};function wn(){var Xe,Ye,Ke,Qe,Je,Ze,et,tt,nt,it;const{pin:a}=qt(),p=Vt(),R=`${an}:${a||"unknown"}`,I=i.useMemo(()=>`mobile_scanner_daily_count:${new Date().toISOString().slice(0,10)}`,[]),h=i.useMemo(()=>{try{if(typeof window>"u")return!1;const t=new URLSearchParams(window.location.search);return t.get("mock")==="1"||t.get("e2e")==="1"}catch{return!1}},[]),[u,D]=i.useState(null),[y,A]=i.useState("connecting"),[Q,m]=i.useState(""),[f,Se]=i.useState(o.IDLE),[S,X]=i.useState(""),[$,J]=i.useState(null),[We,pe]=i.useState({}),[r,re]=i.useState(null),[l,k]=i.useState({}),[v,O]=i.useState(null),[ae,Y]=i.useState(null),[me,Z]=i.useState(""),[b,he]=i.useState([]),[ee,ge]=i.useState(!1),[St,De]=i.useState(0),[fe,xe]=i.useState(!1),[kt,Ft]=i.useState("0m"),[Et,Oe]=i.useState("Connected"),[ce,Pe]=i.useState(""),[ke,It]=i.useState(!1),[Rt,Fe]=i.useState("idle"),[z,Le]=i.useState(null),[j,Ee]=i.useState({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now(),scannedItems:[]}),[be,At]=i.useState(!1),F=i.useRef(null),Ie=i.useRef(null),T=i.useRef(null),_=i.useRef(null),P=i.useRef(!1),ye=i.useRef(null),zt=i.useRef(!1),te=i.useRef(o.IDLE),we=i.useRef(null),le=i.useRef(0),K=i.useRef(null),$e=i.useRef(new Set),L=i.useCallback(async()=>{var c;if(!jt())throw new Error("Camera requires HTTPS (or localhost). Open this page over https:// on your phone.");if(!((c=navigator==null?void 0:navigator.mediaDevices)!=null&&c.getUserMedia))throw new Error("Camera not supported on this browser/device.");if(!F.current)throw new Error("Camera element not ready.");const t=F.current.srcObject;if(t&&typeof t.getTracks=="function"&&t.getTracks().some(x=>x.readyState==="live")){await F.current.play();return}let n=null;try{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}F.current.srcObject=n,await F.current.play()},[]);i.useEffect(()=>{const t=setInterval(()=>Ft(un(Date.now()-j.startedAt)),3e4);return()=>clearInterval(t)},[j.startedAt]);const ve=i.useCallback(t=>{he(t);try{t.length?localStorage.setItem(R,JSON.stringify(t)):localStorage.removeItem(R)}catch{}},[R]),_e=i.useCallback(t=>{const n={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:t};return ve([...b,n]),n},[b,ve]),Ce=i.useCallback(()=>{!u||!u.connected||!b.length||(b.forEach(t=>{var n,c;!((n=t==null?void 0:t.payload)!=null&&n.awb)||!((c=t==null?void 0:t.payload)!=null&&c.imageBase64)||u.emit("scanner:scan",t.payload)}),ve([]))},[u,b,ve]),d=i.useCallback(t=>{Se(t)},[]),G=i.useCallback(t=>{Ee(n=>{const c={...n,scannedItems:[{...t,time:Date.now()},...n.scannedItems]};try{localStorage.setItem(I,String(c.scanNumber))}catch{}return c})},[I]),Tt=i.useCallback(()=>{if(y!=="paired"){m("Phone is not connected to the desktop session.");return}if(m(""),h){d(o.SCANNING);return}L().then(()=>d(o.SCANNING)).catch(t=>m((t==null?void 0:t.message)||"Camera access failed."))},[y,L,d,h]),Mt=i.useCallback(t=>{t==null||t.preventDefault();const n=ce.trim().toUpperCase();if(!n||n.length<6){m("Enter a valid AWB number (min 6 chars)");return}if(y!=="paired"){m("Not connected to desktop session.");return}if(m(""),Pe(""),X(n),h){xe(!0),d(o.CAPTURING);return}L().then(()=>d(o.CAPTURING)).catch(c=>m((c==null?void 0:c.message)||"Camera access failed."))},[ce,y,L,d,h]),Bt=i.useCallback(()=>{window.confirm("End this mobile scanner session on the phone?")&&(u!=null&&u.connected?u.emit("scanner:end-session",{reason:"Mobile ended the session"}):p("/"))},[u,p]),Wt=i.useCallback(()=>{if(b.length>0){Ce();return}window.alert("Everything is already synced.")},[b.length,Ce]);i.useEffect(()=>{te.current=f},[f]),i.useEffect(()=>{if(h){A("paired"),Oe("Mock Mode"),m(""),d(o.IDLE);return}if(!a){m("No PIN provided.");return}const t=Ut(on,{auth:{scannerPin:a},transports:["websocket","polling"],reconnection:!0,reconnectionDelay:1500,reconnectionAttempts:20});return t.on("connect",()=>A("connecting")),t.on("scanner:paired",({userEmail:n})=>{A("paired"),Oe(n?n.split("@")[0]:"Connected"),m(""),d(o.IDLE)}),t.on("scanner:error",({message:n})=>{m(n),A("disconnected")}),t.on("scanner:session-ended",({reason:n})=>{A("disconnected"),m(n||"Session ended by desktop."),p("/")}),t.on("disconnect",()=>A("disconnected")),t.on("reconnect",()=>{y==="paired"&&d(o.SCANNING)}),t.on("scanner:scan-processed",n=>{if(n.status==="error"){Y("error"),Me(),oe([100,50,100]),d(o.ERROR),m(n.error||"Scan failed on desktop.");return}if(re(n),k({clientCode:n.clientCode||"",consignee:n.consignee||"",destination:n.destination||"",pincode:n.pincode||"",weight:n.weight||0,amount:n.amount||0,orderNo:n.orderNo||""}),pe({}),n.reviewRequired)d(o.REVIEWING);else{Te(),oe([50,30,50]);const c={awb:n.awb,clientCode:n.clientCode,clientName:n.clientName,destination:n.destination||"",weight:n.weight||0};O(c),G(c),d(o.SUCCESS)}}),t.on("scanner:approval-result",({success:n,message:c,awb:g})=>{if(n){Te(),oe([50,30,50]),Y("success");const x={awb:(r==null?void 0:r.awb)||g,clientCode:l.clientCode,clientName:(r==null?void 0:r.clientName)||l.clientCode,destination:l.destination||"",weight:parseFloat(l.weight)||0};O(x),G(x),d(o.SUCCESS)}else Me(),m(c||"Approval failed.")}),t.on("scanner:ready-for-next",()=>{}),D(t),()=>{t.disconnect()}},[a,G,r,l,d,p,h]),i.useEffect(()=>{try{const t=localStorage.getItem(R);if(!t)return;const n=JSON.parse(t);Array.isArray(n)&&n.length&&he(n)}catch{}},[R]),i.useEffect(()=>{y==="paired"&&(u!=null&&u.connected)&&b.length&&Ce()},[y,u,b.length,Ce]);const ne=i.useCallback(async()=>{var t;try{if(xe(!1),_.current){try{const n=_.current;n!=null&&n.barcodeScanner&&await n.barcodeScanner.dispose()}catch{}_.current=null}if(T.current){try{await T.current.reset()}catch{}T.current=null}(t=F.current)!=null&&t.srcObject&&(F.current.srcObject.getTracks().forEach(n=>n.stop()),F.current.srcObject=null)}catch{}},[]),ie=i.useCallback(async()=>{try{if(Fe("idle"),_.current){try{await _.current.barcodeScanner.dispose()}catch{}_.current=null}if(T.current){try{T.current._type==="native"?T.current.reset():await T.current.reset()}catch{}T.current=null}}catch{}},[]),Ge=i.useCallback(async()=>{if(F.current){await ie();try{if(le.current=Date.now(),await L(),typeof window.BarcodeDetector<"u"){let x=!0,N=ze;try{const E=await window.BarcodeDetector.getSupportedFormats();N=ze.filter(C=>E.includes(C)),N.length||(N=ze)}catch{}if(N.includes("itf")||(console.log("[MobileScanner] Native BarcodeDetector lacks ITF â€” falling back to ZXing"),x=!1),x){Fe("native");const E=new window.BarcodeDetector({formats:N});let C=null,B=!1;const q=async()=>{var se;if(B||P.current||te.current!==o.SCANNING)return;const V=F.current;if(!V||V.readyState<2){C=setTimeout(q,60);return}try{const W=await E.detect(V);W.length>0&&W[0].rawValue&&(Le({value:W[0].rawValue,format:String(W[0].format||"unknown"),engine:"native",at:Date.now(),sinceStartMs:le.current?Date.now()-le.current:null}),(se=K.current)==null||se.call(K,W[0].rawValue))}catch{}te.current===o.SCANNING&&(C=setTimeout(q,60))};T.current={_type:"native",reset:()=>{B=!0,C&&clearTimeout(C),C=null}},setTimeout(q,300);return}}const[{BrowserMultiFormatReader:t},n]=await Promise.all([lt(()=>import("./index-4oYbt_M2.js"),__vite__mapDeps([0,1])),lt(()=>import("./index-D3Mz4UNV.js"),__vite__mapDeps([]))]),c=new Map([[n.DecodeHintType.POSSIBLE_FORMATS,[n.BarcodeFormat.CODE_128,n.BarcodeFormat.ITF,n.BarcodeFormat.CODE_39,n.BarcodeFormat.CODE_93,n.BarcodeFormat.CODABAR,n.BarcodeFormat.EAN_13,n.BarcodeFormat.EAN_8]],[n.DecodeHintType.TRY_HARDER,!0],[n.DecodeHintType.ASSUME_GS1,!1],[n.DecodeHintType.CHARACTER_SET,"UTF-8"]]),g=new t(c,40);Fe("zxing"),T.current=g,g.decodeFromVideoElement(F.current,x=>{var N,E,C;if(!P.current&&x){let B="unknown";try{B=String(((N=x.getBarcodeFormat)==null?void 0:N.call(x))||"unknown")}catch{}Le({value:((E=x.getText)==null?void 0:E.call(x))||"",format:B,engine:"zxing",at:Date.now(),sinceStartMs:le.current?Date.now()-le.current:null}),(C=K.current)==null||C.call(K,x.getText())}})}catch(t){m("Camera access failed: "+t.message)}}},[L,ie]),Ue=i.useCallback(t=>{const n=String(t||"").trim().replace(/\s+/g,"").toUpperCase();if(!(!n||n.length<6||P.current||te.current!==o.SCANNING)){if(P.current=!0,$e.current.has(n)){oe([100,50,100,50,100]),Me(),Z(n),setTimeout(()=>{Z(""),P.current=!1},2500);return}clearTimeout(we.current),oe([50]),vt(),X(n),Ee(c=>{const g={...c,scanNumber:c.scanNumber+1};return g.scannedAwbs=new Set(c.scannedAwbs),g.scannedAwbs.add(n),$e.current=g.scannedAwbs,g}),we.current=setTimeout(()=>{te.current===o.SCANNING&&d(o.CAPTURING)},cn)}},[d]);i.useEffect(()=>{K.current=Ue},[Ue]),i.useEffect(()=>(f===o.SCANNING&&(P.current=!1,Ge()),()=>{f===o.SCANNING&&ie()}),[f,Ge,ie]);const qe=i.useCallback(async()=>{if(h){xe(!0);return}await ie();try{await L(),xe(!0)}catch(t){m("Camera access failed: "+t.message)}},[L,ie,h]);i.useEffect(()=>{f===o.CAPTURING&&qe()},[f,qe]),i.useEffect(()=>{if(f!==o.CAPTURING){ge(!1),De(0),zt.current=!1;return}const t=setInterval(()=>{const n=F.current,c=Ie.current;if(!n||!c||!n.videoWidth||!n.videoHeight)return;const g=bt(n,c);if(!g)return;const x=Math.max(0,Math.floor(g.x)),N=Math.max(0,Math.floor(g.y)),E=Math.max(24,Math.floor(g.w)),C=Math.max(24,Math.floor(g.h)),B=document.createElement("canvas"),q=96,V=72;B.width=q,B.height=V;const se=B.getContext("2d",{willReadFrequently:!0});if(!se)return;se.drawImage(n,x,N,Math.min(E,n.videoWidth-x),Math.min(C,n.videoHeight-N),0,0,q,V);const W=se.getImageData(0,0,q,V).data;let st=0,ot=0,rt=0,at=0;for(let H=0;H<W.length;H+=4){const ue=.2126*W[H]+.7152*W[H+1]+.0722*W[H+2];st+=ue,ot+=ue*ue,H>0&&Math.abs(ue-at)>26&&rt++,at=ue}const Re=q*V,je=st/Re,_t=Math.sqrt(Math.max(0,ot/Re-je*je)),Gt=rt/Math.max(Re,1),ct=je>35&&je<225&&_t>24&&Gt>.12;ge(ct),De(H=>ct?Math.min(H+1,8):0)},320);return()=>clearInterval(t)},[f]);const Ve=i.useCallback(()=>{const t=F.current,n=Ie.current;if(!t||!n||!t.videoWidth)return null;const c=bt(t,n);if(!c)return null;const g=c.x,x=c.y,N=c.w,E=c.h;if(!N||!E)return null;const C=document.createElement("canvas");return C.width=Math.min(1200,Math.round(N)),C.height=Math.round(C.width/N*E),C.getContext("2d").drawImage(t,g,x,N,E,0,0,C.width,C.height),C.toDataURL("image/jpeg",.75).split(",")[1]||null},[]),Dt=i.useCallback(()=>{Y("white"),vt(),oe([30]);const t=Ve();if(!t){m("Could not capture image. Try again."),P.current=!1;return}J(`data:image/jpeg;base64,${t}`),ne(),d(o.PREVIEW)},[Ve,ne,d]),Ot=i.useCallback(()=>{if(!h)return;J("data:image/jpeg;base64,ZmFrZS1tb2NrLWltYWdl"),ne(),d(o.PREVIEW)},[d,h,ne]),Pt=i.useCallback(()=>{if(!S||!$)return;if(d(o.PROCESSING),h){setTimeout(()=>{const g={awb:S,clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25};O(g),G(g),d(o.SUCCESS)},250);return}const t={scanNumber:j.scanNumber,recentClient:j.dominantClient,dominantClient:j.dominantClient,dominantClientCount:j.dominantClientCount,sessionDurationMin:Math.round((Date.now()-j.startedAt)/6e4)},n=$.split(",")[1]||$,c={awb:S,imageBase64:n,focusImageBase64:n,sessionContext:t};if(!u||!u.connected||y!=="paired"){_e(c),Te();const g={awb:S,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};O({...g,offlineQueued:!0}),G(g),d(o.SUCCESS);return}u.emit("scanner:scan",c),setTimeout(()=>{te.current===o.PROCESSING&&(m("OCR timed out after 40 seconds. Check that GEMINI_API_KEY is set on Railway, then try again."),d(o.ERROR))},4e4)},[u,S,$,j,d,y,_e,G,h]),Lt=i.useCallback(()=>{if(r){if(d(o.APPROVING),h){setTimeout(()=>{const t={awb:r.awb||S,clientCode:l.clientCode||"MOCKCL",clientName:r.clientName||l.clientCode||"Mock Client",destination:l.destination||"",weight:parseFloat(l.weight)||0};O(t),G(t),Y("success"),d(o.SUCCESS)},200);return}if(u){if(r.ocrExtracted||r){const t={clientCode:r.clientCode||"",clientName:r.clientName||"",consignee:r.consignee||"",destination:r.destination||""},n={clientCode:l.clientCode||"",clientName:l.clientCode||"",consignee:l.consignee||"",destination:l.destination||""};u.emit("scanner:learn-corrections",{pin:a,ocrFields:t,approvedFields:n})}u.emit("scanner:approval-submit",{shipmentId:r.shipmentId,awb:r.awb||S,fields:{clientCode:l.clientCode,consignee:l.consignee,destination:l.destination,pincode:l.pincode,weight:parseFloat(l.weight)||0,amount:parseFloat(l.amount)||0,orderNo:l.orderNo||""}},t=>{t!=null&&t.success||(d(o.REVIEWING),m((t==null?void 0:t.message)||"Approval failed."))}),l.clientCode&&l.clientCode!=="MISC"&&Ee(t=>{var g,x;const n={...t.clientFreq};n[l.clientCode]=(n[l.clientCode]||0)+1;const c=Object.entries(n).sort((N,E)=>E[1]-N[1]);return{...t,clientFreq:n,dominantClient:((g=c[0])==null?void 0:g[1])>=2?c[0][0]:null,dominantClientCount:((x=c[0])==null?void 0:x[1])||0}})}}},[u,r,l,S,a,d,G,h]),de=i.useCallback(()=>{clearTimeout(ye.current),clearTimeout(we.current),X(""),J(null),re(null),k({}),pe({}),O(null),m(""),Z(""),P.current=!1,d(o.IDLE)},[d]);i.useEffect(()=>{if(f===o.SUCCESS)return ye.current=setTimeout(de,rn),()=>clearTimeout(ye.current)},[f,de]),i.useEffect(()=>{if(be)if(f===o.REVIEWING&&r){const t=[r.clientName||r.clientCode,r.destination,r.weight?`${r.weight} kilograms`:""].filter(Boolean);t.length&&Ct(t.join(". "))}else f===o.SUCCESS&&v&&Ct(`${v.clientName||v.clientCode||"Shipment"} Verified.`)},[be,f,r,v]),i.useEffect(()=>()=>{ne(),clearTimeout(ye.current),clearTimeout(we.current)},[ne]);const M=t=>`msp-step ${f===t?"active":""}`,U=i.useMemo(()=>{if(!r)return{};const t=r.ocrExtracted||r;return{clientCode:{confidence:(t==null?void 0:t.clientNameConfidence)||0,source:(t==null?void 0:t.clientNameSource)||null},consignee:{confidence:(t==null?void 0:t.consigneeConfidence)||0,source:(t==null?void 0:t.consigneeSource)||null},destination:{confidence:(t==null?void 0:t.destinationConfidence)||0,source:(t==null?void 0:t.destinationSource)||null},pincode:{confidence:(t==null?void 0:t.pincodeConfidence)||0,source:null},weight:{confidence:(t==null?void 0:t.weightConfidence)||0,source:null}}},[r]),He=j.scannedItems.reduce((t,n)=>t+(n.weight||0),0),w=((Xe=r==null?void 0:r.ocrExtracted)==null?void 0:Xe.intelligence)||(r==null?void 0:r.intelligence)||null,$t=[["Step",f],["Connection",y],["Engine",Rt],["Camera",fe?"ready":"waiting"],["Doc detect",ee?`yes (${St})`:"no"],["Secure ctx",jt()?"yes":"no"],["AWB lock",S||"-"],["Queued",String(b.length)],["Scans",String(j.scanNumber)],["Last format",(z==null?void 0:z.format)||"-"],["Last code",(z==null?void 0:z.value)||"-"],["Decode ms",(z==null?void 0:z.sinceStartMs)!=null?String(z.sinceStartMs):"-"]];return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:ln}),e.jsxs("div",{className:"msp-root",children:[ae&&e.jsx("div",{className:`flash-overlay flash-${ae}`,onAnimationEnd:()=>Y(null)}),me&&e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[e.jsx(dt,{size:48,color:"white"}),e.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),e.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:me}),e.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),e.jsx("button",{type:"button","data-testid":"scanner-diag-toggle",onClick:()=>It(t=>!t),style:{position:"fixed",top:12,right:12,zIndex:70,border:"1px solid rgba(255,255,255,0.18)",background:ke?"rgba(79,70,229,0.92)":"rgba(15,23,42,0.72)",color:"#fff",borderRadius:999,padding:"8px 12px",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.04em",backdropFilter:"blur(10px)",cursor:"pointer"},children:ke?"Hide Diag":"Show Diag"}),ke&&e.jsxs("div",{"data-testid":"scanner-diag-panel",style:{position:"fixed",top:56,right:12,zIndex:69,width:"min(92vw, 320px)",background:"rgba(15,23,42,0.88)",color:"#E5EEF8",border:"1px solid rgba(255,255,255,0.12)",borderRadius:18,padding:14,backdropFilter:"blur(14px)",boxShadow:"0 12px 30px rgba(0,0,0,0.25)"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10,color:"#A5B4FC"},children:"Scanner Diagnostics"}),e.jsx("div",{style:{display:"grid",gap:6},children:$t.map(([t,n])=>e.jsxs("div",{style:{display:"flex",gap:8,justifyContent:"space-between",alignItems:"flex-start",fontSize:"0.76rem"},children:[e.jsx("div",{style:{color:"rgba(226,232,240,0.72)",minWidth:88},children:t}),e.jsx("div",{className:"mono",style:{textAlign:"right",wordBreak:"break-word",maxWidth:180},children:n})]},t))}),e.jsx("div",{style:{marginTop:10,fontSize:"0.68rem",color:"rgba(226,232,240,0.7)",lineHeight:1.4},children:"Use this to verify whether Trackon labels are being decoded as `ITF` and how quickly the first lock happens after scan start."})]}),y!=="paired"&&e.jsx("div",{className:M(o.IDLE),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:s.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:y==="connecting"?e.jsx(Ae,{size:28,color:s.primary,style:{animation:"spin 1s linear infinite"}}):e.jsx(ut,{size:28,color:s.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:y==="connecting"?"Connecting...":"Disconnected"}),e.jsx("div",{style:{fontSize:"0.82rem",color:s.muted},children:Q||`Connecting to session ${a}`})]}),y==="disconnected"&&e.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[e.jsx(Ae,{size:16})," Reconnect"]})]})}),e.jsx("video",{ref:F,autoPlay:!0,playsInline:!0,muted:!0,onClick:()=>{L().catch(t=>{m((t==null?void 0:t.message)||"Camera access failed.")})},style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(f===o.SCANNING||f===o.CAPTURING)&&!_.current?"block":"none"}}),e.jsx("div",{className:M(o.IDLE),children:e.jsxs("div",{className:"home-root",children:[e.jsxs("div",{className:"home-header",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16},children:[e.jsxs("button",{onClick:()=>p("/app/scan"),style:{background:"white",border:"1px solid #E2E8F0",padding:"6px 12px",borderRadius:20,fontSize:"0.75rem",fontWeight:600,color:"#475569",display:"flex",alignItems:"center",gap:4,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.02)"},children:[e.jsx(Ht,{size:14})," Go Back"]}),e.jsxs("div",{className:"home-logo-badge",children:[e.jsx(pt,{size:11,color:y==="paired"&&navigator.onLine?"#10B981":"#EF4444"}),Et]})]}),e.jsx("div",{className:"home-logo-row",children:e.jsxs("div",{className:"home-logo-text",children:[e.jsx("img",{src:"/images/logo.png",alt:"Sea Hawk Logo",style:{height:28,width:"auto",objectFit:"contain",padding:2,background:"white",borderRadius:6,border:"1px solid #E2E8F0"}}),e.jsx("span",{children:"Seahawk Scanner"})]})}),e.jsxs("div",{className:"home-stats-row",children:[e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:j.scanNumber}),e.jsx("div",{className:"home-stat-label",children:"Scanned"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:He>0?He.toFixed(1):"0"}),e.jsx("div",{className:"home-stat-label",children:"Total kg"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:kt}),e.jsx("div",{className:"home-stat-label",children:"Session"})]})]})]}),e.jsxs("div",{className:"home-scan-section",children:[e.jsxs("div",{className:"home-scan-btn-wrap",children:[e.jsx("div",{className:"home-scan-ring"}),e.jsx("div",{className:"home-scan-ring home-scan-ring2"}),e.jsxs("button",{className:"home-scan-btn",onClick:Tt,children:[e.jsx(mt,{size:34,color:"white"}),e.jsx("span",{className:"home-scan-btn-label",children:"Scan"})]})]}),e.jsx("div",{className:"home-cta-text",children:j.scanNumber===0?"Tap to start your first scan":"Tap to scan next parcel"}),e.jsxs("form",{onSubmit:Mt,style:{width:"100%",maxWidth:300,marginTop:20},children:[e.jsx("div",{style:{fontSize:"0.62rem",fontWeight:700,color:s.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6,textAlign:"center"},children:"Can't scan? Enter AWB manually"}),e.jsxs("div",{style:{display:"flex",gap:6},children:[e.jsx("input",{"data-testid":"manual-awb-input",value:ce,onChange:t=>Pe(t.target.value.toUpperCase()),placeholder:"e.g. 1234567890",inputMode:"text",autoCapitalize:"characters",style:{flex:1,padding:"9px 12px",border:`1.5px solid ${s.border}`,borderRadius:10,fontFamily:"JetBrains Mono, monospace",fontSize:"0.82rem",fontWeight:600,background:s.surface,color:s.text,outline:"none"},onFocus:t=>t.target.style.borderColor=s.primary,onBlur:t=>t.target.style.borderColor=s.border}),e.jsx("button",{type:"submit","data-testid":"manual-awb-submit",disabled:ce.trim().length<6,className:"btn btn-primary",style:{padding:"9px 14px",fontSize:"0.78rem",borderRadius:10,opacity:ce.trim().length>=6?1:.45},children:"Go â†’"})]})]}),e.jsxs("div",{className:"action-buttons-row",children:[e.jsxs("button",{className:"action-btn",onClick:Wt,children:[e.jsx(Xt,{size:14})," ",b.length>0?`Upload (${b.length})`:"Synced"]}),e.jsxs("button",{className:"action-btn danger",onClick:Bt,children:[e.jsx(Yt,{size:14})," End Session"]})]}),b.length>0&&e.jsxs("div",{style:{marginTop:14,fontSize:"0.7rem",color:s.warning,fontWeight:600,display:"flex",alignItems:"center",gap:5},children:[e.jsx(ht,{size:12})," ",b.length," offline scan",b.length>1?"s":""," pending sync"]})]}),e.jsxs("div",{className:"home-queue-section",children:[e.jsxs("div",{className:"home-queue-head",children:[e.jsxs("div",{className:"home-queue-title-text",children:[e.jsx(Kt,{size:11}),"Accepted Consignments"]}),j.scannedItems.length>0&&e.jsx("div",{className:"home-queue-badge",children:j.scannedItems.length})]}),e.jsx("div",{className:"home-queue-list",children:j.scannedItems.length===0?e.jsxs("div",{className:"queue-empty",children:[e.jsx(gt,{size:36,color:"rgba(255,255,255,0.12)"}),e.jsxs("div",{className:"queue-empty-text",children:["No consignments scanned yet.",e.jsx("br",{}),"Tap the button above to begin."]})]}):j.scannedItems.map((t,n)=>e.jsxs("div",{className:"queue-item",children:[e.jsx("div",{className:"queue-check",children:e.jsx(ft,{size:13,color:"#10B981"})}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{className:"queue-awb",children:t.awb}),e.jsxs("div",{className:"queue-meta",children:[t.clientCode==="OFFLINE"?e.jsx("span",{className:"queue-offline-tag",children:"Offline"}):t.clientCode&&e.jsx("span",{className:"queue-client-tag",children:t.clientCode}),t.destination&&e.jsx("span",{children:t.destination})]})]}),t.weight>0&&e.jsxs("div",{className:"queue-weight",children:[t.weight,"kg"]})]},`${t.awb}-${n}`))})]})]})}),e.jsx("div",{className:M(o.SCANNING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[e.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:_.current?"block":"none"}}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{className:"scan-guide",style:{width:yt.w,height:yt.h,borderRadius:10,maxHeight:"20vw"},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"}),e.jsx("div",{className:"scan-laser"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(pt,{size:12})," ",a]}),e.jsxs("div",{className:"cam-hud-chip",style:{gap:4},children:[e.jsx(gt,{size:12})," ",j.scanNumber,typeof window<"u"&&typeof window.BarcodeDetector<"u"?e.jsx("span",{style:{color:"#34D399",fontSize:"0.6rem",fontWeight:800},children:"âš¡ NATIVE"}):e.jsx("span",{style:{color:"#F59E0B",fontSize:"0.6rem",fontWeight:800},children:"ZXING"})]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:"Align barcode inside the strip"}),e.jsx("div",{style:{display:"flex",gap:12},children:e.jsx("button",{className:"cam-hud-chip",onClick:()=>At(!be),style:{border:"none",cursor:"pointer"},children:be?e.jsx(Qt,{size:14}):e.jsx(Jt,{size:14})})})]})]})}),e.jsx("div",{className:M(o.CAPTURING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!fe&&e.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[e.jsx(Zt,{size:44,color:"#34D399"}),e.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:S}),e.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:"Barcode locked Â· Preparing cameraâ€¦"})]}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{ref:Ie,className:`scan-guide ${ee?"detected":""}`,style:{width:wt.w,height:wt.h,maxHeight:"75vh",borderRadius:12},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[e.jsx(en,{size:12})," ",S]}),b.length>0&&e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(ht,{size:12})," ",b.length," queued"]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:ee?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center",transition:"color 0.3s"},children:ee?"âœ“ AWB in frame â€” press shutter":"Fit the AWB slip inside the frame"}),e.jsx("button",{className:"capture-btn","data-testid":"capture-photo-btn",onClick:Dt,disabled:!fe,style:{opacity:fe?1:.4},children:e.jsx("div",{className:"capture-btn-inner"})}),h&&e.jsx("button",{type:"button","data-testid":"mock-capture-btn",onClick:Ot,style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 12px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:"Mock capture"}),e.jsx("button",{style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},onClick:()=>{X(""),P.current=!1,d(o.SCANNING)},children:"â† Rescan barcode"})]})]})}),e.jsx("div",{className:M(o.PREVIEW),children:e.jsxs("div",{style:{background:s.bg,display:"flex",flexDirection:"column",height:"100%"},children:[e.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${s.border}`},children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.72rem",color:s.muted,fontWeight:600},children:"CAPTURED"}),e.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:S})]})}),e.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:$&&e.jsx("img",{src:$,alt:"Captured label",className:"preview-img"})}),e.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{J(null),d(o.CAPTURING)},children:[e.jsx(xt,{size:16})," Retake"]}),e.jsxs("button",{"data-testid":"use-photo-btn",className:"btn btn-primary",style:{flex:2},onClick:Pt,children:[e.jsx(tn,{size:16})," Use Photo"]})]})]})}),e.jsx("div",{className:M(o.PROCESSING),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16},children:[e.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[e.jsx(nn,{size:22,color:s.primary,style:{animation:"spin 2s linear infinite"}}),e.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:s.primary},children:"Intelligence Engine"})]}),e.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:s.muted},children:S}),e.jsx("div",{style:{fontSize:"0.72rem",color:s.mutedLight,marginTop:6},children:"Reading AWB label with Gemini Visionâ€¦"})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(t=>e.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:t}),e.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),e.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},t)),e.jsx("div",{style:{textAlign:"center",marginTop:8},children:e.jsx("button",{className:"btn btn-outline",style:{fontSize:"0.75rem",padding:"8px 20px"},onClick:()=>{m("Cancelled by user."),d(o.ERROR)},children:"Cancel"})})]})}),e.jsx("div",{className:M(o.REVIEWING),children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%"},children:[e.jsxs("div",{style:{padding:"14px 20px",borderBottom:`1px solid ${s.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.65rem",color:s.muted,fontWeight:600},children:"REVIEW EXTRACTION"}),e.jsx("div",{className:"mono",style:{fontSize:"0.95rem",fontWeight:700},children:(r==null?void 0:r.awb)||S})]}),(w==null?void 0:w.learnedFieldCount)>0&&e.jsxs("div",{className:"source-badge source-learned",children:["ðŸ§  ",w.learnedFieldCount," auto-corrected"]})]}),e.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsxs("div",{className:`field-card ${(((Ye=U.clientCode)==null?void 0:Ye.confidence)||0)<.55?"warning":""}`,children:[e.jsx("div",{className:Be(((Ke=U.clientCode)==null?void 0:Ke.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((Qe=U.clientCode)==null?void 0:Qe.source)&&(()=>{const t=Nt(U.clientCode.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:l.clientCode||"",onChange:t=>k(n=>({...n,clientCode:t.target.value.toUpperCase()})),placeholder:"Client code"}),((Je=w==null?void 0:w.clientMatches)==null?void 0:Je.length)>0&&w.clientNeedsConfirmation&&e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:w.clientMatches.slice(0,3).map(t=>e.jsxs("button",{onClick:()=>k(n=>({...n,clientCode:t.code})),style:{fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:`1px solid ${s.border}`,background:l.clientCode===t.code?s.primaryLight:s.surface,color:s.text,cursor:"pointer",fontFamily:"inherit",fontWeight:500},children:[t.code," (",Math.round(t.score*100),"%)"]},t.code))})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:Be(((Ze=U.consignee)==null?void 0:Ze.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Consignee"}),e.jsx("input",{className:"field-input",value:l.consignee||"",onChange:t=>k(n=>({...n,consignee:t.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:Be(((et=U.destination)==null?void 0:et.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((tt=U.destination)==null?void 0:tt.source)&&(()=>{const t=Nt(U.destination.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:l.destination||"",onChange:t=>k(n=>({...n,destination:t.target.value.toUpperCase()})),placeholder:"City"}),(w==null?void 0:w.pincodeCity)&&w.pincodeCity!==l.destination&&e.jsxs("button",{onClick:()=>k(t=>({...t,destination:w.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:s.successLight,color:s.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["ðŸ“ Pincode suggests: ",w.pincodeCity]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Pincode"}),e.jsx("input",{className:"field-input",value:l.pincode||"",onChange:t=>k(n=>({...n,pincode:t.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),e.jsx("div",{className:`field-card ${(nt=w==null?void 0:w.weightAnomaly)!=null&&nt.anomaly?"warning":""}`,children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Weight (kg)"}),e.jsx("input",{className:"field-input",value:l.weight||"",onChange:t=>k(n=>({...n,weight:t.target.value})),placeholder:"0.0",inputMode:"decimal"}),((it=w==null?void 0:w.weightAnomaly)==null?void 0:it.anomaly)&&e.jsxs("div",{style:{fontSize:"0.6rem",color:s.warning,marginTop:2,fontWeight:500},children:["âš ï¸ ",w.weightAnomaly.warning]})]})})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Amount (â‚¹)"}),e.jsx("input",{className:"field-input",value:l.amount||"",onChange:t=>k(n=>({...n,amount:t.target.value})),placeholder:"0",inputMode:"decimal"})]})}),e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Order No"}),e.jsx("input",{className:"field-input",value:l.orderNo||"",onChange:t=>k(n=>({...n,orderNo:t.target.value})),placeholder:"Optional"})]})})]})]}),e.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${s.border}`,display:"flex",gap:10},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:de,children:[e.jsx(sn,{size:16})," Skip"]}),e.jsxs("button",{"data-testid":"approve-save-btn",className:"btn btn-success btn-lg",style:{flex:2},onClick:Lt,disabled:f===o.APPROVING,children:[f===o.APPROVING?e.jsx(Ae,{size:16,style:{animation:"spin 1s linear infinite"}}):e.jsx(ft,{size:16}),f===o.APPROVING?"Saving...":"Approve & Save"]})]})]})}),e.jsx("div",{className:M(o.APPROVING)}),e.jsx("div",{className:M(o.SUCCESS),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[e.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:s.success,strokeWidth:"3",className:"success-check-circle"}),e.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:s.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:s.success,marginBottom:4},children:"Saved Successfully"}),e.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700},children:v==null?void 0:v.awb}),(v==null?void 0:v.clientCode)&&e.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:s.primaryLight,color:s.primary,fontSize:"0.78rem",fontWeight:600},children:v.clientName||v.clientCode})]}),e.jsx("div",{style:{fontSize:"0.72rem",color:s.muted},children:v!=null&&v.offlineQueued?`${b.length} queued for sync â€¢ Auto-continuing in 3s`:`#${j.scanNumber} scanned â€¢ Auto-continuing in 3s`}),e.jsxs("button",{"data-testid":"scan-next-btn",className:"btn btn-primary btn-lg btn-full",onClick:de,style:{maxWidth:320},children:[e.jsx(mt,{size:18})," Scan Next Parcel"]})]})}),e.jsx("div",{className:M(o.ERROR),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:s.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(dt,{size:32,color:s.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:s.error},children:"Scan Error"}),e.jsx("div",{style:{fontSize:"0.82rem",color:s.muted,marginTop:4},children:Q})]}),e.jsxs("button",{className:"btn btn-primary",onClick:de,children:[e.jsx(xt,{size:16})," Try Again"]})]})}),y==="disconnected"&&f!==o.IDLE&&e.jsxs("div",{className:"offline-banner",children:[e.jsx(ut,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline â€” Reconnecting... ",b.length?`(${b.length} queued)`:""]})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{wn as default};
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/index-4oYbt_M2.js","assets/index-D3Mz4UNV.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
