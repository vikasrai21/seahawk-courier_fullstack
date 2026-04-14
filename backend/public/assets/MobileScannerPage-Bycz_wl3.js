import{l as tn,_ as xt}from"./index-100vJXPb.js";import{j as e}from"./page-landing-Bx5c8M2c.js";import{r as i}from"./vendor-helmet-Dwc3L0SQ.js";import{n as nn}from"./barcode-DjYGNBFy.js";import{c as sn,u as on}from"./vendor-react-DGJm5saH.js";import{b as bt,R as Oe,aR as yt,V as rn,aJ as wt,aK as Ct,aL as an,a8 as cn,d as vt,a3 as ln,z as jt,aM as Nt,aP as St,aN as dn,aO as un,az as pn,aQ as kt,O as mn,aE as hn,X as gn}from"./vendor-icons-Cg7sz5U9.js";import"./page-import-Oou-8sKP.js";import"./page-reconcile-BDB22cXR.js";import"./page-rate-calc-DqzAxvbg.js";function Ft(c,p){var z,A;try{if(!c||!p)return null;const F=Number(c.videoWidth||0),h=Number(c.videoHeight||0);if(!F||!h)return null;const m=(z=c.getBoundingClientRect)==null?void 0:z.call(c),X=(A=p.getBoundingClientRect)==null?void 0:A.call(p);if(!m||!X)return null;const w=Number(m.width||0),T=Number(m.height||0);if(!w||!T)return null;const D=Math.max(w/F,T/h),g=F*D,f=h*D,me=(w-g)/2,j=(T-f)/2,Y=X.left-m.left,G=X.top-m.top,ee=X.right-m.left,$e=X.bottom-m.top,oe=(Y-me)/D,a=(G-j)/D,re=(ee-me)/D,l=($e-j)/D,N=(b,ge,ne)=>Math.max(ge,Math.min(ne,b)),C=N(Math.min(oe,re),0,F),L=N(Math.min(a,l),0,h),he=N(Math.max(oe,re),0,F),K=N(Math.max(a,l),0,h),ae=Math.max(0,he-C),te=Math.max(0,K-L);return!ae||!te?null:{x:C,y:L,w:ae,h:te}}catch{return null}}const fn=window.location.origin,Et={w:"90vw",h:"18vw"},ke={w:"92vw",h:"130vw"},xn=3500,bn="mobile_scanner_offline_queue",yn=80,Rt=90,Pe=["code_128","code_39","code_93","codabar","ean_13","ean_8","itf","qr_code"],wn=!0,o={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"},Z=c=>{var p;try{(p=navigator==null?void 0:navigator.vibrate)==null||p.call(navigator,c)}catch{}},Fe=(c,p,z="sine")=>{try{const A=new(window.AudioContext||window.webkitAudioContext),F=A.createOscillator(),h=A.createGain();F.type=z,F.frequency.setValueAtTime(c,A.currentTime),h.gain.setValueAtTime(.12,A.currentTime),h.gain.exponentialRampToValueAtTime(.01,A.currentTime+p),F.connect(h),h.connect(A.destination),F.start(),F.stop(A.currentTime+p)}catch{}},De=()=>{Fe(880,.12),setTimeout(()=>Fe(1100,.1),130)},It=()=>Fe(600,.08),Le=()=>Fe(200,.25,"sawtooth"),At=c=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const p=new SpeechSynthesisUtterance(c);p.rate=1.2,p.pitch=1,p.lang="en-IN",window.speechSynthesis.speak(p)}catch{}},zt=()=>{var c;try{if(typeof window>"u")return!1;if(window.isSecureContext)return!0;const p=((c=window.location)==null?void 0:c.hostname)||"";return p==="localhost"||p==="127.0.0.1"}catch{return!1}},s={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",mutedLight:"#9CA3AF",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},Cn=`
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
`,vn=c=>c>=.85?"high":c>=.55?"med":"low",_e=c=>`conf-dot conf-${vn(c)}`,Tt=c=>c==="learned"?{className:"source-badge source-learned",icon:"ðŸ§ ",text:"Learned"}:c==="fuzzy_match"?{className:"source-badge source-ai",icon:"ðŸ”",text:"Matched"}:c==="fuzzy_history"||c==="consignee_pattern"?{className:"source-badge source-history",icon:"ðŸ“Š",text:"History"}:c==="delhivery_pincode"||c==="india_post"||c==="pincode_lookup"||c==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"ðŸ“",text:"Pincode"}:null,jn=c=>{const p=Math.floor(c/6e4);return p<60?`${p}m`:`${Math.floor(p/60)}h ${p%60}m`};function Tn(){var nt,it,st,ot,rt,at,ct,lt,dt,ut;const{pin:c}=sn(),p=on(),z=`${bn}:${c||"unknown"}`,A=i.useMemo(()=>`mobile_scanner_daily_count:${new Date().toISOString().slice(0,10)}`,[]),F=i.useMemo(()=>{try{return typeof window>"u"?"":new URLSearchParams(window.location.search).get("mockBarcodeRaw")||""}catch{return""}},[]),h=i.useMemo(()=>{try{if(typeof window>"u")return!1;const t=new URLSearchParams(window.location.search);return t.get("mock")==="1"||t.get("e2e")==="1"}catch{return!1}},[]),[m,X]=i.useState(null),[w,T]=i.useState("connecting"),[D,g]=i.useState(""),[f,me]=i.useState(o.IDLE),[j,Y]=i.useState(""),[G,ee]=i.useState(null),[$e,oe]=i.useState({}),[a,re]=i.useState(null),[l,N]=i.useState({}),[C,L]=i.useState(null),[he,K]=i.useState(null),[ae,te]=i.useState(""),[b,ge]=i.useState([]),[ne,Ge]=i.useState(!1),[Bt,Ue]=i.useState(0),[fe,xe]=i.useState(!1),[Mt,Wt]=i.useState("0m"),[Ot,qe]=i.useState("Connected"),[ce,Ve]=i.useState(""),[Ee,Pt]=i.useState(!1),[He,Re]=i.useState("idle"),[B,Xe]=i.useState(null),[Dt,Lt]=i.useState(0),[le,Ie]=i.useState("barcode"),Ae=i.useRef(0),[v,ze]=i.useState({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now(),scannedItems:[]}),[be,_t]=i.useState(!1),R=i.useRef(null),Te=i.useRef(null),M=i.useRef(null),U=i.useRef(null),_=i.useRef(!1),ye=i.useRef(null),$t=i.useRef(!1),Q=i.useRef(o.IDLE),we=i.useRef(null),de=i.useRef(0),W=i.useRef(null),Ye=i.useRef(new Set),d=i.useCallback(t=>{me(t)},[]),O=i.useCallback(t=>{Ae.current=t,Lt(t)},[]),Be=i.useCallback(()=>{O(0),Ie("document"),g('No barcode lock yet. Capture label instead or tap "Back to barcode mode" and hold steady.'),Z([80,60,80])},[O]),Gt=i.useCallback(()=>{Y(""),g(""),d(o.CAPTURING)},[d]),$=i.useCallback(async()=>{var r;if(!zt())throw new Error("Camera requires HTTPS (or localhost). Open this page over https:// on your phone.");if(!((r=navigator==null?void 0:navigator.mediaDevices)!=null&&r.getUserMedia))throw new Error("Camera not supported on this browser/device.");if(!R.current)throw new Error("Camera element not ready.");const t=R.current.srcObject;if(t&&typeof t.getTracks=="function"&&t.getTracks().some(x=>x.readyState==="live")){await R.current.play();return}let n=null;try{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}R.current.srcObject=n,await R.current.play()},[]);i.useEffect(()=>{const t=setInterval(()=>Wt(jn(Date.now()-v.startedAt)),3e4);return()=>clearInterval(t)},[v.startedAt]);const Ce=i.useCallback(t=>{ge(t);try{t.length?localStorage.setItem(z,JSON.stringify(t)):localStorage.removeItem(z)}catch{}},[z]),Ke=i.useCallback(t=>{const n={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:t};return Ce([...b,n]),n},[b,Ce]),ve=i.useCallback(()=>{!m||!m.connected||!b.length||(b.forEach(t=>{var n,r;!((n=t==null?void 0:t.payload)!=null&&n.awb)||!((r=t==null?void 0:t.payload)!=null&&r.imageBase64)||m.emit("scanner:scan",t.payload)}),Ce([]))},[m,b,Ce]),q=i.useCallback(t=>{ze(n=>{const r={...n,scannedItems:[{...t,time:Date.now()},...n.scannedItems]};try{localStorage.setItem(A,String(r.scanNumber))}catch{}return r})},[A]),Ut=i.useCallback(()=>{if(w!=="paired"){g("Phone is not connected to the desktop session.");return}if(g(""),h){d(o.SCANNING);return}$().then(()=>d(o.SCANNING)).catch(t=>g((t==null?void 0:t.message)||"Camera access failed."))},[w,$,d,h]),qt=i.useCallback(t=>{t==null||t.preventDefault();const n=ce.trim().toUpperCase();if(!n||n.length<6){g("Enter a valid AWB number (min 6 chars)");return}if(w!=="paired"){g("Not connected to desktop session.");return}if(g(""),Ve(""),Y(n),h){xe(!0),d(o.CAPTURING);return}$().then(()=>d(o.CAPTURING)).catch(r=>g((r==null?void 0:r.message)||"Camera access failed."))},[ce,w,$,d,h]),Vt=i.useCallback(()=>{window.confirm("End this mobile scanner session on the phone?")&&(m!=null&&m.connected?m.emit("scanner:end-session",{reason:"Mobile ended the session"}):p("/"))},[m,p]),Ht=i.useCallback(()=>{if(b.length>0){ve();return}window.alert("Everything is already synced.")},[b.length,ve]);i.useEffect(()=>{Q.current=f},[f]),i.useEffect(()=>{if(h){T("paired"),qe("Mock Mode"),g(""),d(o.IDLE);return}if(!c){g("No PIN provided.");return}const t=tn(fn,{auth:{scannerPin:c},transports:["websocket","polling"],reconnection:!0,reconnectionDelay:1500,reconnectionAttempts:20});return t.on("connect",()=>T("connecting")),t.on("scanner:paired",({userEmail:n})=>{T("paired"),qe(n?n.split("@")[0]:"Connected"),g(""),d(o.IDLE)}),t.on("scanner:error",({message:n})=>{g(n),T("disconnected")}),t.on("scanner:session-ended",({reason:n})=>{T("disconnected"),g(n||"Session ended by desktop."),p("/")}),t.on("disconnect",()=>T("disconnected")),t.on("reconnect",()=>{w==="paired"&&d(o.SCANNING)}),t.on("scanner:scan-processed",n=>{if(n.status==="error"){K("error"),Le(),Z([100,50,100]),d(o.ERROR),g(n.error||"Scan failed on desktop.");return}if(re(n),N({clientCode:n.clientCode||"",consignee:n.consignee||"",destination:n.destination||"",pincode:n.pincode||"",weight:n.weight||0,amount:n.amount||0,orderNo:n.orderNo||""}),oe({}),n.reviewRequired)d(o.REVIEWING);else{De(),Z([50,30,50]);const r={awb:n.awb,clientCode:n.clientCode,clientName:n.clientName,destination:n.destination||"",weight:n.weight||0};L(r),q(r),d(o.SUCCESS)}}),t.on("scanner:approval-result",({success:n,message:r,awb:u})=>{if(n){De(),Z([50,30,50]),K("success");const x={awb:(a==null?void 0:a.awb)||u,clientCode:l.clientCode,clientName:(a==null?void 0:a.clientName)||l.clientCode,destination:l.destination||"",weight:parseFloat(l.weight)||0};L(x),q(x),d(o.SUCCESS)}else Le(),g(r||"Approval failed.")}),t.on("scanner:ready-for-next",()=>{}),X(t),()=>{t.disconnect()}},[c,q,a,l,d,p,h]),i.useEffect(()=>{try{const t=localStorage.getItem(z);if(!t)return;const n=JSON.parse(t);Array.isArray(n)&&n.length&&ge(n)}catch{}},[z]),i.useEffect(()=>{w==="paired"&&(m!=null&&m.connected)&&b.length&&ve()},[w,m,b.length,ve]);const ie=i.useCallback(async()=>{var t;try{if(xe(!1),U.current){try{const n=U.current;n!=null&&n.barcodeScanner&&await n.barcodeScanner.dispose()}catch{}U.current=null}if(M.current){try{await M.current.reset()}catch{}M.current=null}(t=R.current)!=null&&t.srcObject&&(R.current.srcObject.getTracks().forEach(n=>n.stop()),R.current.srcObject=null)}catch{}},[]),se=i.useCallback(async()=>{try{if(Re("idle"),U.current){try{await U.current.barcodeScanner.dispose()}catch{}U.current=null}if(M.current){try{M.current._type==="native"?M.current.reset():await M.current.reset()}catch{}M.current=null}}catch{}},[]),Qe=i.useCallback(async()=>{if(R.current){await se();try{if(de.current=Date.now(),await $(),wn){const[{BrowserMultiFormatReader:t},n]=await Promise.all([xt(()=>import("./index-4oYbt_M2.js"),__vite__mapDeps([0,1])),xt(()=>import("./index-D3Mz4UNV.js"),__vite__mapDeps([]))]),r=new Map([[n.DecodeHintType.POSSIBLE_FORMATS,[n.BarcodeFormat.CODE_128,n.BarcodeFormat.ITF,n.BarcodeFormat.CODE_39,n.BarcodeFormat.CODE_93,n.BarcodeFormat.CODABAR,n.BarcodeFormat.EAN_13,n.BarcodeFormat.EAN_8]],[n.DecodeHintType.TRY_HARDER,!0],[n.DecodeHintType.ASSUME_GS1,!1],[n.DecodeHintType.CHARACTER_SET,"UTF-8"]]),u=new t(r,40);Re("zxing"),M.current=u,u.decodeFromVideoElement(R.current,x=>{var S,I,E;if(!_.current)if(x){O(0);let k="unknown";try{k=String(((S=x.getBarcodeFormat)==null?void 0:S.call(x))||"unknown")}catch{}Xe({value:((I=x.getText)==null?void 0:I.call(x))||"",format:k,engine:"zxing",at:Date.now(),sinceStartMs:de.current?Date.now()-de.current:null}),(E=W.current)==null||E.call(W,x.getText())}else{const k=Ae.current+1;O(k),k>=Rt&&Be()}});return}if(typeof window.BarcodeDetector<"u"){let t=!0,n=Pe;try{const r=await window.BarcodeDetector.getSupportedFormats();n=Pe.filter(u=>r.includes(u)),n.length||(n=Pe)}catch{}if(n.includes("itf")||(console.log("[MobileScanner] Native BarcodeDetector lacks ITF â€” falling back to ZXing"),t=!1),t){Re("native");const r=new window.BarcodeDetector({formats:n});let u=null,x=!1;const S=async()=>{var E;if(x||_.current||Q.current!==o.SCANNING)return;const I=R.current;if(!I||I.readyState<2){u=setTimeout(S,60);return}try{const k=await r.detect(I);if(k.length>0&&k[0].rawValue)O(0),Xe({value:k[0].rawValue,format:String(k[0].format||"unknown"),engine:"native",at:Date.now(),sinceStartMs:de.current?Date.now()-de.current:null}),(E=W.current)==null||E.call(W,k[0].rawValue);else{const J=Ae.current+1;O(J),J>=Rt&&Be()}}catch{}Q.current===o.SCANNING&&(u=setTimeout(S,60))};M.current={_type:"native",reset:()=>{x=!0,u&&clearTimeout(u),u=null}},setTimeout(S,300);return}}throw new Error("Unable to initialize a barcode scanner on this device.")}catch(t){g("Camera access failed: "+t.message)}}},[$,se,Be,O]),Je=i.useCallback(t=>{const n=nn(t)||String(t||"").trim().replace(/\s+/g,"").toUpperCase();if(!(!n||n.length<6||_.current||Q.current!==o.SCANNING)){if(_.current=!0,Ye.current.has(n)){Z([100,50,100,50,100]),Le(),te(n),setTimeout(()=>{te(""),_.current=!1},2500);return}clearTimeout(we.current),Z([50]),It(),Y(n),ze(r=>{const u={...r,scanNumber:r.scanNumber+1};return u.scannedAwbs=new Set(r.scannedAwbs),u.scannedAwbs.add(n),Ye.current=u.scannedAwbs,u}),we.current=setTimeout(()=>{Q.current===o.SCANNING&&d(o.CAPTURING)},yn)}},[d]);i.useEffect(()=>{W.current=Je},[Je]),i.useEffect(()=>{if(f===o.SCANNING&&(_.current=!1,O(0),Ie("barcode"),Qe(),h&&F)){const t=setTimeout(()=>{var n;Q.current===o.SCANNING&&((n=W.current)==null||n.call(W,F))},50);return()=>clearTimeout(t)}return()=>{f===o.SCANNING&&se()}},[f,Qe,se,O,h,F]);const Ze=i.useCallback(async()=>{if(h){xe(!0);return}await se();try{await $(),xe(!0)}catch(t){g("Camera access failed: "+t.message)}},[$,se,h]);i.useEffect(()=>{f===o.CAPTURING&&Ze()},[f,Ze]),i.useEffect(()=>{if(f!==o.CAPTURING){Ge(!1),Ue(0),$t.current=!1;return}const t=setInterval(()=>{const n=R.current,r=Te.current;if(!n||!r||!n.videoWidth||!n.videoHeight)return;const u=Ft(n,r);if(!u)return;const x=Math.max(0,Math.floor(u.x)),S=Math.max(0,Math.floor(u.y)),I=Math.max(24,Math.floor(u.w)),E=Math.max(24,Math.floor(u.h)),k=document.createElement("canvas"),J=96,je=72;k.width=J,k.height=je;const Me=k.getContext("2d",{willReadFrequently:!0});if(!Me)return;Me.drawImage(n,x,S,Math.min(I,n.videoWidth-x),Math.min(E,n.videoHeight-S),0,0,J,je);const Ne=Me.getImageData(0,0,J,je).data;let pt=0,mt=0,ht=0,gt=0;for(let H=0;H<Ne.length;H+=4){const pe=.2126*Ne[H]+.7152*Ne[H+1]+.0722*Ne[H+2];pt+=pe,mt+=pe*pe,H>0&&Math.abs(pe-gt)>26&&ht++,gt=pe}const We=J*je,Se=pt/We,Zt=Math.sqrt(Math.max(0,mt/We-Se*Se)),en=ht/Math.max(We,1),ft=Se>35&&Se<225&&Zt>24&&en>.12;Ge(ft),Ue(H=>ft?Math.min(H+1,8):0)},320);return()=>clearInterval(t)},[f]);const et=i.useCallback(()=>{const t=R.current,n=Te.current;if(!t||!n||!t.videoWidth)return null;const r=Ft(t,n);if(!r)return null;const u=r.x,x=r.y,S=r.w,I=r.h;if(!S||!I)return null;const E=document.createElement("canvas");return E.width=Math.min(1200,Math.round(S)),E.height=Math.round(E.width/S*I),E.getContext("2d").drawImage(t,u,x,S,I,0,0,E.width,E.height),E.toDataURL("image/jpeg",.75).split(",")[1]||null},[]),Xt=i.useCallback(()=>{K("white"),It(),Z([30]);const t=et();if(!t){g("Could not capture image. Try again."),_.current=!1;return}ee(`data:image/jpeg;base64,${t}`),ie(),d(o.PREVIEW)},[et,ie,d]),Yt=i.useCallback(()=>{if(!h)return;ee("data:image/jpeg;base64,ZmFrZS1tb2NrLWltYWdl"),ie(),d(o.PREVIEW)},[d,h,ie]),Kt=i.useCallback(()=>{if(!G)return;if(d(o.PROCESSING),h){setTimeout(()=>{const u={awb:j||"100454974120",clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25};L(u),q(u),d(o.SUCCESS)},250);return}const t={scanNumber:v.scanNumber,recentClient:v.dominantClient,dominantClient:v.dominantClient,dominantClientCount:v.dominantClientCount,sessionDurationMin:Math.round((Date.now()-v.startedAt)/6e4)},n=G.split(",")[1]||G,r={awb:j||"",imageBase64:n,focusImageBase64:n,sessionContext:t};if(!m||!m.connected||w!=="paired"){Ke(r),De();const u={awb:j||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};L({...u,offlineQueued:!0}),q(u),d(o.SUCCESS);return}m.emit("scanner:scan",r),setTimeout(()=>{Q.current===o.PROCESSING&&(g("OCR timed out after 40 seconds. Check that GEMINI_API_KEY is set on Railway, then try again."),d(o.ERROR))},4e4)},[m,j,G,v,d,w,Ke,q,h]),Qt=i.useCallback(()=>{if(a){if(d(o.APPROVING),h){setTimeout(()=>{const t={awb:a.awb||j,clientCode:l.clientCode||"MOCKCL",clientName:a.clientName||l.clientCode||"Mock Client",destination:l.destination||"",weight:parseFloat(l.weight)||0};L(t),q(t),K("success"),d(o.SUCCESS)},200);return}if(m){if(a.ocrExtracted||a){const t={clientCode:a.clientCode||"",clientName:a.clientName||"",consignee:a.consignee||"",destination:a.destination||""},n={clientCode:l.clientCode||"",clientName:l.clientCode||"",consignee:l.consignee||"",destination:l.destination||""};m.emit("scanner:learn-corrections",{pin:c,ocrFields:t,approvedFields:n})}m.emit("scanner:approval-submit",{shipmentId:a.shipmentId,awb:a.awb||j,fields:{clientCode:l.clientCode,consignee:l.consignee,destination:l.destination,pincode:l.pincode,weight:parseFloat(l.weight)||0,amount:parseFloat(l.amount)||0,orderNo:l.orderNo||""}},t=>{t!=null&&t.success||(d(o.REVIEWING),g((t==null?void 0:t.message)||"Approval failed."))}),l.clientCode&&l.clientCode!=="MISC"&&ze(t=>{var u,x;const n={...t.clientFreq};n[l.clientCode]=(n[l.clientCode]||0)+1;const r=Object.entries(n).sort((S,I)=>I[1]-S[1]);return{...t,clientFreq:n,dominantClient:((u=r[0])==null?void 0:u[1])>=2?r[0][0]:null,dominantClientCount:((x=r[0])==null?void 0:x[1])||0}})}}},[m,a,l,j,c,d,q,h]),ue=i.useCallback(()=>{clearTimeout(ye.current),clearTimeout(we.current),Y(""),ee(null),re(null),N({}),oe({}),L(null),g(""),te(""),_.current=!1,d(o.IDLE)},[d]);i.useEffect(()=>{if(f===o.SUCCESS)return ye.current=setTimeout(ue,xn),()=>clearTimeout(ye.current)},[f,ue]),i.useEffect(()=>{if(be)if(f===o.REVIEWING&&a){const t=[a.clientName||a.clientCode,a.destination,a.weight?`${a.weight} kilograms`:""].filter(Boolean);t.length&&At(t.join(". "))}else f===o.SUCCESS&&C&&At(`${C.clientName||C.clientCode||"Shipment"} Verified.`)},[be,f,a,C]),i.useEffect(()=>()=>{ie(),clearTimeout(ye.current),clearTimeout(we.current)},[ie]);const P=t=>`msp-step ${f===t?"active":""}`,V=i.useMemo(()=>{if(!a)return{};const t=a.ocrExtracted||a;return{clientCode:{confidence:(t==null?void 0:t.clientNameConfidence)||0,source:(t==null?void 0:t.clientNameSource)||null},consignee:{confidence:(t==null?void 0:t.consigneeConfidence)||0,source:(t==null?void 0:t.consigneeSource)||null},destination:{confidence:(t==null?void 0:t.destinationConfidence)||0,source:(t==null?void 0:t.destinationSource)||null},pincode:{confidence:(t==null?void 0:t.pincodeConfidence)||0,source:null},weight:{confidence:(t==null?void 0:t.weightConfidence)||0,source:null}}},[a]),tt=v.scannedItems.reduce((t,n)=>t+(n.weight||0),0),y=((nt=a==null?void 0:a.ocrExtracted)==null?void 0:nt.intelligence)||(a==null?void 0:a.intelligence)||null,Jt=[["Step",f],["Connection",w],["Engine",He],["Scan mode",le],["Fail count",String(Dt)],["Camera",fe?"ready":"waiting"],["Doc detect",ne?`yes (${Bt})`:"no"],["Secure ctx",zt()?"yes":"no"],["AWB lock",j||"-"],["Queued",String(b.length)],["Scans",String(v.scanNumber)],["Last format",(B==null?void 0:B.format)||"-"],["Last code",(B==null?void 0:B.value)||"-"],["Decode ms",(B==null?void 0:B.sinceStartMs)!=null?String(B.sinceStartMs):"-"]];return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:Cn}),e.jsxs("div",{className:"msp-root",children:[he&&e.jsx("div",{className:`flash-overlay flash-${he}`,onAnimationEnd:()=>K(null)}),ae&&e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[e.jsx(bt,{size:48,color:"white"}),e.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),e.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:ae}),e.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),e.jsx("button",{type:"button","data-testid":"scanner-diag-toggle",onClick:()=>Pt(t=>!t),style:{position:"fixed",top:12,right:12,zIndex:70,border:"1px solid rgba(255,255,255,0.18)",background:Ee?"rgba(79,70,229,0.92)":"rgba(15,23,42,0.72)",color:"#fff",borderRadius:999,padding:"8px 12px",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.04em",backdropFilter:"blur(10px)",cursor:"pointer"},children:Ee?"Hide Diag":"Show Diag"}),Ee&&e.jsxs("div",{"data-testid":"scanner-diag-panel",style:{position:"fixed",top:56,right:12,zIndex:69,width:"min(92vw, 320px)",background:"rgba(15,23,42,0.88)",color:"#E5EEF8",border:"1px solid rgba(255,255,255,0.12)",borderRadius:18,padding:14,backdropFilter:"blur(14px)",boxShadow:"0 12px 30px rgba(0,0,0,0.25)"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10,color:"#A5B4FC"},children:"Scanner Diagnostics"}),e.jsx("div",{style:{display:"grid",gap:6},children:Jt.map(([t,n])=>e.jsxs("div",{style:{display:"flex",gap:8,justifyContent:"space-between",alignItems:"flex-start",fontSize:"0.76rem"},children:[e.jsx("div",{style:{color:"rgba(226,232,240,0.72)",minWidth:88},children:t}),e.jsx("div",{className:"mono",style:{textAlign:"right",wordBreak:"break-word",maxWidth:180},children:n})]},t))}),e.jsx("div",{style:{marginTop:10,fontSize:"0.68rem",color:"rgba(226,232,240,0.7)",lineHeight:1.4},children:"Use this to verify whether Trackon labels are being decoded as `ITF` and how quickly the first lock happens after scan start."})]}),w!=="paired"&&e.jsx("div",{className:P(o.IDLE),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:s.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:w==="connecting"?e.jsx(Oe,{size:28,color:s.primary,style:{animation:"spin 1s linear infinite"}}):e.jsx(yt,{size:28,color:s.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:w==="connecting"?"Connecting...":"Disconnected"}),e.jsx("div",{style:{fontSize:"0.82rem",color:s.muted},children:D||`Connecting to session ${c}`})]}),w==="disconnected"&&e.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[e.jsx(Oe,{size:16})," Reconnect"]})]})}),e.jsx("video",{ref:R,autoPlay:!0,playsInline:!0,muted:!0,onClick:()=>{$().catch(t=>{g((t==null?void 0:t.message)||"Camera access failed.")})},style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(f===o.SCANNING||f===o.CAPTURING)&&!U.current?"block":"none"}}),e.jsx("div",{className:P(o.IDLE),children:e.jsxs("div",{className:"home-root",children:[e.jsxs("div",{className:"home-header",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16},children:[e.jsxs("button",{onClick:()=>p("/app/scan"),style:{background:"white",border:"1px solid #E2E8F0",padding:"6px 12px",borderRadius:20,fontSize:"0.75rem",fontWeight:600,color:"#475569",display:"flex",alignItems:"center",gap:4,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.02)"},children:[e.jsx(rn,{size:14})," Go Back"]}),e.jsxs("div",{className:"home-logo-badge",children:[e.jsx(wt,{size:11,color:w==="paired"&&navigator.onLine?"#10B981":"#EF4444"}),Ot]})]}),e.jsx("div",{className:"home-logo-row",children:e.jsxs("div",{className:"home-logo-text",children:[e.jsx("img",{src:"/images/logo.png",alt:"Sea Hawk Logo",style:{height:28,width:"auto",objectFit:"contain",padding:2,background:"white",borderRadius:6,border:"1px solid #E2E8F0"}}),e.jsx("span",{children:"Seahawk Scanner"})]})}),e.jsxs("div",{className:"home-stats-row",children:[e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:v.scanNumber}),e.jsx("div",{className:"home-stat-label",children:"Scanned"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:tt>0?tt.toFixed(1):"0"}),e.jsx("div",{className:"home-stat-label",children:"Total kg"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:Mt}),e.jsx("div",{className:"home-stat-label",children:"Session"})]})]})]}),e.jsxs("div",{className:"home-scan-section",children:[e.jsxs("div",{className:"home-scan-btn-wrap",children:[e.jsx("div",{className:"home-scan-ring"}),e.jsx("div",{className:"home-scan-ring home-scan-ring2"}),e.jsxs("button",{"data-testid":"start-scan-btn",className:"home-scan-btn",onClick:Ut,children:[e.jsx(Ct,{size:34,color:"white"}),e.jsx("span",{className:"home-scan-btn-label",children:"Scan"})]})]}),e.jsx("div",{className:"home-cta-text",children:v.scanNumber===0?"Tap to start your first scan":"Tap to scan next parcel"}),e.jsxs("form",{onSubmit:qt,style:{width:"100%",maxWidth:300,marginTop:20},children:[e.jsx("div",{style:{fontSize:"0.62rem",fontWeight:700,color:s.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6,textAlign:"center"},children:"Can't scan? Enter AWB manually"}),e.jsxs("div",{style:{display:"flex",gap:6},children:[e.jsx("input",{"data-testid":"manual-awb-input",value:ce,onChange:t=>Ve(t.target.value.toUpperCase()),placeholder:"e.g. 1234567890",inputMode:"text",autoCapitalize:"characters",style:{flex:1,padding:"9px 12px",border:`1.5px solid ${s.border}`,borderRadius:10,fontFamily:"JetBrains Mono, monospace",fontSize:"0.82rem",fontWeight:600,background:s.surface,color:s.text,outline:"none"},onFocus:t=>t.target.style.borderColor=s.primary,onBlur:t=>t.target.style.borderColor=s.border}),e.jsx("button",{type:"submit","data-testid":"manual-awb-submit",disabled:ce.trim().length<6,className:"btn btn-primary",style:{padding:"9px 14px",fontSize:"0.78rem",borderRadius:10,opacity:ce.trim().length>=6?1:.45},children:"Go â†’"})]})]}),e.jsxs("div",{className:"action-buttons-row",children:[e.jsxs("button",{className:"action-btn",onClick:Ht,children:[e.jsx(an,{size:14})," ",b.length>0?`Upload (${b.length})`:"Synced"]}),e.jsxs("button",{className:"action-btn danger",onClick:Vt,children:[e.jsx(cn,{size:14})," End Session"]})]}),b.length>0&&e.jsxs("div",{style:{marginTop:14,fontSize:"0.7rem",color:s.warning,fontWeight:600,display:"flex",alignItems:"center",gap:5},children:[e.jsx(vt,{size:12})," ",b.length," offline scan",b.length>1?"s":""," pending sync"]})]}),e.jsxs("div",{className:"home-queue-section",children:[e.jsxs("div",{className:"home-queue-head",children:[e.jsxs("div",{className:"home-queue-title-text",children:[e.jsx(ln,{size:11}),"Accepted Consignments"]}),v.scannedItems.length>0&&e.jsx("div",{className:"home-queue-badge",children:v.scannedItems.length})]}),e.jsx("div",{className:"home-queue-list",children:v.scannedItems.length===0?e.jsxs("div",{className:"queue-empty",children:[e.jsx(jt,{size:36,color:"rgba(255,255,255,0.12)"}),e.jsxs("div",{className:"queue-empty-text",children:["No consignments scanned yet.",e.jsx("br",{}),"Tap the button above to begin."]})]}):v.scannedItems.map((t,n)=>e.jsxs("div",{className:"queue-item",children:[e.jsx("div",{className:"queue-check",children:e.jsx(Nt,{size:13,color:"#10B981"})}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{className:"queue-awb",children:t.awb}),e.jsxs("div",{className:"queue-meta",children:[t.clientCode==="OFFLINE"?e.jsx("span",{className:"queue-offline-tag",children:"Offline"}):t.clientCode&&e.jsx("span",{className:"queue-client-tag",children:t.clientCode}),t.destination&&e.jsx("span",{children:t.destination})]})]}),t.weight>0&&e.jsxs("div",{className:"queue-weight",children:[t.weight,"kg"]})]},`${t.awb}-${n}`))})]})]})}),e.jsx("div",{className:P(o.SCANNING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[e.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:U.current?"block":"none"}}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{className:"scan-guide",style:le==="barcode"?{width:Et.w,height:Et.h,borderRadius:10,maxHeight:"20vw",transition:"all 0.4s ease"}:{width:ke.w,height:ke.h,borderRadius:14,maxHeight:"75vh",transition:"all 0.4s ease",borderColor:"rgba(251,191,36,0.85)",boxShadow:"0 0 0 3px rgba(251,191,36,0.2)"},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"}),le==="barcode"&&e.jsx("div",{className:"scan-laser"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(wt,{size:12})," ",c]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[le==="document"&&e.jsxs("div",{className:"cam-hud-chip",style:{background:"rgba(251,191,36,0.22)",color:"#FDE68A",fontWeight:700,fontSize:"0.65rem",gap:4},children:[e.jsx(St,{size:11})," LABEL MODE"]}),e.jsxs("div",{className:"cam-hud-chip",style:{gap:4},children:[e.jsx(jt,{size:12})," ",v.scanNumber,He==="native"?e.jsx("span",{style:{color:"#34D399",fontSize:"0.6rem",fontWeight:800},children:"⚡ NATIVE"}):e.jsx("span",{style:{color:"#F59E0B",fontSize:"0.6rem",fontWeight:800},children:"ZXING"})]})]})]}),e.jsxs("div",{className:"cam-bottom",children:[le==="barcode"?e.jsx("div",{style:{color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:"Align barcode inside the strip"}):e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:6},children:[e.jsx("div",{style:{color:"rgba(251,191,36,0.95)",fontSize:"0.82rem",fontWeight:700,textAlign:"center"},children:"No barcode found - capture the label and we will read the printed AWB"}),e.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"},children:[e.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:Gt,children:"Capture label instead"}),e.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:()=>{O(0),Ie("barcode")},children:"Back to barcode mode"})]})]}),e.jsx("div",{style:{display:"flex",gap:12},children:e.jsx("button",{className:"cam-hud-chip",onClick:()=>_t(!be),style:{border:"none",cursor:"pointer"},children:be?e.jsx(dn,{size:14}):e.jsx(un,{size:14})})})]})]})}),e.jsx("div",{className:P(o.CAPTURING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!fe&&e.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[e.jsx(pn,{size:44,color:"#34D399"}),e.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:j||"OCR fallback"}),e.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:j?"Barcode locked - Preparing camera...":"Preparing label capture for printed AWB OCR..."})]}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{ref:Te,className:`scan-guide ${ne?"detected":""}`,style:{width:ke.w,height:ke.h,maxHeight:"75vh",borderRadius:12},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[e.jsx(St,{size:12})," ",j||"OCR AWB capture"]}),b.length>0&&e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(vt,{size:12})," ",b.length," queued"]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:ne?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center",transition:"color 0.3s"},children:ne?"AWB area in frame - press shutter":"Fit the AWB slip inside the frame so we can read the printed AWB"}),e.jsx("button",{className:"capture-btn","data-testid":"capture-photo-btn",onClick:Xt,disabled:!fe,style:{opacity:fe?1:.4},children:e.jsx("div",{className:"capture-btn-inner"})}),h&&e.jsx("button",{type:"button","data-testid":"mock-capture-btn",onClick:Yt,style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 12px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:"Mock capture"}),e.jsx("button",{style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},onClick:()=>{Y(""),_.current=!1,d(o.SCANNING)},children:"â† Rescan barcode"})]})]})}),e.jsx("div",{className:P(o.PREVIEW),children:e.jsxs("div",{style:{background:s.bg,display:"flex",flexDirection:"column",height:"100%"},children:[e.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${s.border}`},children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.72rem",color:s.muted,fontWeight:600},children:"CAPTURED"}),e.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:j||"Printed AWB OCR"})]})}),e.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:G&&e.jsx("img",{src:G,alt:"Captured label",className:"preview-img"})}),e.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{ee(null),d(o.CAPTURING)},children:[e.jsx(kt,{size:16})," Retake"]}),e.jsxs("button",{"data-testid":"use-photo-btn",className:"btn btn-primary",style:{flex:2},onClick:Kt,children:[e.jsx(mn,{size:16})," Use Photo"]})]})]})}),e.jsx("div",{className:P(o.PROCESSING),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16},children:[e.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[e.jsx(hn,{size:22,color:s.primary,style:{animation:"spin 2s linear infinite"}}),e.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:s.primary},children:"Intelligence Engine"})]}),e.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:s.muted},children:j}),e.jsx("div",{style:{fontSize:"0.72rem",color:s.mutedLight,marginTop:6},children:"Reading AWB label with Gemini Visionâ€¦"})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(t=>e.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:t}),e.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),e.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},t)),e.jsx("div",{style:{textAlign:"center",marginTop:8},children:e.jsx("button",{className:"btn btn-outline",style:{fontSize:"0.75rem",padding:"8px 20px"},onClick:()=>{g("Cancelled by user."),d(o.ERROR)},children:"Cancel"})})]})}),e.jsx("div",{className:P(o.REVIEWING),children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%"},children:[e.jsxs("div",{style:{padding:"14px 20px",borderBottom:`1px solid ${s.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.65rem",color:s.muted,fontWeight:600},children:"REVIEW EXTRACTION"}),e.jsx("div",{className:"mono",style:{fontSize:"0.95rem",fontWeight:700},children:(a==null?void 0:a.awb)||j})]}),(y==null?void 0:y.learnedFieldCount)>0&&e.jsxs("div",{className:"source-badge source-learned",children:["ðŸ§  ",y.learnedFieldCount," auto-corrected"]})]}),e.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsxs("div",{className:`field-card ${(((it=V.clientCode)==null?void 0:it.confidence)||0)<.55?"warning":""}`,children:[e.jsx("div",{className:_e(((st=V.clientCode)==null?void 0:st.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((ot=V.clientCode)==null?void 0:ot.source)&&(()=>{const t=Tt(V.clientCode.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:l.clientCode||"",onChange:t=>N(n=>({...n,clientCode:t.target.value.toUpperCase()})),placeholder:"Client code"}),((rt=y==null?void 0:y.clientMatches)==null?void 0:rt.length)>0&&y.clientNeedsConfirmation&&e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:y.clientMatches.slice(0,3).map(t=>e.jsxs("button",{onClick:()=>N(n=>({...n,clientCode:t.code})),style:{fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:`1px solid ${s.border}`,background:l.clientCode===t.code?s.primaryLight:s.surface,color:s.text,cursor:"pointer",fontFamily:"inherit",fontWeight:500},children:[t.code," (",Math.round(t.score*100),"%)"]},t.code))})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:_e(((at=V.consignee)==null?void 0:at.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Consignee"}),e.jsx("input",{className:"field-input",value:l.consignee||"",onChange:t=>N(n=>({...n,consignee:t.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:_e(((ct=V.destination)==null?void 0:ct.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((lt=V.destination)==null?void 0:lt.source)&&(()=>{const t=Tt(V.destination.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:l.destination||"",onChange:t=>N(n=>({...n,destination:t.target.value.toUpperCase()})),placeholder:"City"}),(y==null?void 0:y.pincodeCity)&&y.pincodeCity!==l.destination&&e.jsxs("button",{onClick:()=>N(t=>({...t,destination:y.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:s.successLight,color:s.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["ðŸ“ Pincode suggests: ",y.pincodeCity]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Pincode"}),e.jsx("input",{className:"field-input",value:l.pincode||"",onChange:t=>N(n=>({...n,pincode:t.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),e.jsx("div",{className:`field-card ${(dt=y==null?void 0:y.weightAnomaly)!=null&&dt.anomaly?"warning":""}`,children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Weight (kg)"}),e.jsx("input",{className:"field-input",value:l.weight||"",onChange:t=>N(n=>({...n,weight:t.target.value})),placeholder:"0.0",inputMode:"decimal"}),((ut=y==null?void 0:y.weightAnomaly)==null?void 0:ut.anomaly)&&e.jsxs("div",{style:{fontSize:"0.6rem",color:s.warning,marginTop:2,fontWeight:500},children:["âš ï¸ ",y.weightAnomaly.warning]})]})})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Amount (â‚¹)"}),e.jsx("input",{className:"field-input",value:l.amount||"",onChange:t=>N(n=>({...n,amount:t.target.value})),placeholder:"0",inputMode:"decimal"})]})}),e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Order No"}),e.jsx("input",{className:"field-input",value:l.orderNo||"",onChange:t=>N(n=>({...n,orderNo:t.target.value})),placeholder:"Optional"})]})})]})]}),e.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${s.border}`,display:"flex",gap:10},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:ue,children:[e.jsx(gn,{size:16})," Skip"]}),e.jsxs("button",{"data-testid":"approve-save-btn",className:"btn btn-success btn-lg",style:{flex:2},onClick:Qt,disabled:f===o.APPROVING,children:[f===o.APPROVING?e.jsx(Oe,{size:16,style:{animation:"spin 1s linear infinite"}}):e.jsx(Nt,{size:16}),f===o.APPROVING?"Saving...":"Approve & Save"]})]})]})}),e.jsx("div",{className:P(o.APPROVING)}),e.jsx("div",{className:P(o.SUCCESS),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[e.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:s.success,strokeWidth:"3",className:"success-check-circle"}),e.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:s.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:s.success,marginBottom:4},children:"Saved Successfully"}),e.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700},children:C==null?void 0:C.awb}),(C==null?void 0:C.clientCode)&&e.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:s.primaryLight,color:s.primary,fontSize:"0.78rem",fontWeight:600},children:C.clientName||C.clientCode})]}),e.jsx("div",{style:{fontSize:"0.72rem",color:s.muted},children:C!=null&&C.offlineQueued?`${b.length} queued for sync â€¢ Auto-continuing in 3s`:`#${v.scanNumber} scanned â€¢ Auto-continuing in 3s`}),e.jsxs("button",{"data-testid":"scan-next-btn",className:"btn btn-primary btn-lg btn-full",onClick:ue,style:{maxWidth:320},children:[e.jsx(Ct,{size:18})," Scan Next Parcel"]})]})}),e.jsx("div",{className:P(o.ERROR),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:s.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(bt,{size:32,color:s.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:s.error},children:"Scan Error"}),e.jsx("div",{style:{fontSize:"0.82rem",color:s.muted,marginTop:4},children:D})]}),e.jsxs("button",{className:"btn btn-primary",onClick:ue,children:[e.jsx(kt,{size:16})," Try Again"]})]})}),w==="disconnected"&&f!==o.IDLE&&e.jsxs("div",{className:"offline-banner",children:[e.jsx(yt,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline â€” Reconnecting... ",b.length?`(${b.length} queued)`:""]})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{Tn as default};
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/index-4oYbt_M2.js","assets/index-D3Mz4UNV.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
