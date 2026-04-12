import{l as At,_ as tt}from"./index-DnGMoOpk.js";import{j as e}from"./page-landing-Bx5c8M2c.js";import{r as s}from"./vendor-helmet-Dwc3L0SQ.js";import{c as zt,u as Tt}from"./vendor-react-DGJm5saH.js";import{b as nt,R as ye,aD as it,V as Bt,aE as st,aF as ot,aG as Mt,a5 as Ot,d as rt,a0 as Dt,z as at,aH as ct,aI as Pt,aJ as Wt,au as $t,aK as _t,aL as lt,O as Lt,ax as Gt,X as qt}from"./vendor-icons-CFYsIw6f.js";import"./page-import-BDtG0mlO.js";import"./page-reconcile-D3eVU83v.js";import"./page-rate-calc-BuQIW43A.js";const Ut=window.location.origin,dt={w:"90vw",h:"18vw"},ut={w:"92vw",h:"130vw"},Vt=3500,Ht="mobile_scanner_offline_queue",Yt=80,ve=["code_128","code_39","code_93","codabar","ean_13","ean_8","itf","qr_code"],o={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"},q=c=>{var g;try{(g=navigator==null?void 0:navigator.vibrate)==null||g.call(navigator,c)}catch{}},le=(c,g,P="sine")=>{try{const d=new(window.AudioContext||window.webkitAudioContext),W=d.createOscillator(),f=d.createGain();W.type=P,W.frequency.setValueAtTime(c,d.currentTime),f.gain.setValueAtTime(.12,d.currentTime),f.gain.exponentialRampToValueAtTime(.01,d.currentTime+g),W.connect(f),f.connect(d.destination),W.start(),W.stop(d.currentTime+g)}catch{}},we=()=>{le(880,.12),setTimeout(()=>le(1100,.1),130)},pt=()=>le(600,.08),je=()=>le(200,.25,"sawtooth"),mt=c=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const g=new SpeechSynthesisUtterance(c);g.rate=1.2,g.pitch=1,g.lang="en-IN",window.speechSynthesis.speak(g)}catch{}},i={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",mutedLight:"#9CA3AF",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},Xt=`
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
`,Kt=c=>c>=.85?"high":c>=.55?"med":"low",Ce=c=>`conf-dot conf-${Kt(c)}`,ht=c=>c==="learned"?{className:"source-badge source-learned",icon:"ðŸ§ ",text:"Learned"}:c==="fuzzy_match"?{className:"source-badge source-ai",icon:"ðŸ”",text:"Matched"}:c==="fuzzy_history"||c==="consignee_pattern"?{className:"source-badge source-history",icon:"ðŸ“Š",text:"History"}:c==="delhivery_pincode"||c==="india_post"||c==="pincode_lookup"||c==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"ðŸ“",text:"Pincode"}:null,Qt=c=>{const g=Math.floor(c/6e4);return g<60?`${g}m`:`${Math.floor(g/60)}h ${g%60}m`};function ln(){var $e,_e,Le,Ge,qe,Ue,Ve,He,Ye,Xe;const{pin:c}=zt(),g=Tt(),P=`${Ht}:${c||"unknown"}`,[d,W]=s.useState(null),[f,U]=s.useState("connecting"),[Ne,y]=s.useState(""),[x,gt]=s.useState(o.IDLE),[k,K]=s.useState(""),[_,de]=s.useState(null),[Jt,Se]=s.useState({}),[r,ke]=s.useState(null),[l,F]=s.useState({}),[C,Q]=s.useState(null),[Fe,J]=s.useState(null),[Ee,ue]=s.useState(""),[b,Ie]=s.useState([]),[pe,Re]=s.useState(!1),[Zt,Ae]=s.useState(0),[me,he]=s.useState(!1),[xt,ft]=s.useState("0m"),[bt,yt]=s.useState("Connected"),[V,ze]=s.useState(""),[v,ge]=s.useState({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now(),scannedItems:[]}),[Z,vt]=s.useState(!1),w=s.useRef(null),xe=s.useRef(null),I=s.useRef(null),T=s.useRef(null),z=s.useRef(!1),ee=s.useRef(null),wt=s.useRef(!1),L=s.useRef(o.IDLE),te=s.useRef(null),$=s.useRef(null),Te=s.useRef(new Set);s.useEffect(()=>{const t=setInterval(()=>ft(Qt(Date.now()-v.startedAt)),3e4);return()=>clearInterval(t)},[v.startedAt]);const ne=s.useCallback(t=>{Ie(t);try{t.length?localStorage.setItem(P,JSON.stringify(t)):localStorage.removeItem(P)}catch{}},[P]),Be=s.useCallback(t=>{const n={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:t};return ne([...b,n]),n},[b,ne]),ie=s.useCallback(()=>{!d||!d.connected||!b.length||(b.forEach(t=>{var n,a;!((n=t==null?void 0:t.payload)!=null&&n.awb)||!((a=t==null?void 0:t.payload)!=null&&a.imageBase64)||d.emit("scanner:scan",t.payload)}),ne([]))},[d,b,ne]),u=s.useCallback(t=>{gt(t)},[]),H=s.useCallback(t=>{ge(n=>{const a={...n,scannedItems:[{...t,time:Date.now()},...n.scannedItems]};try{localStorage.setItem(TODAY_KEY,String(a.scanNumber))}catch{}return a})},[TODAY_KEY]),jt=s.useCallback(()=>{if(f!=="paired"){y("Phone is not connected to the desktop session.");return}y(""),u(o.SCANNING)},[f,u]),Ct=s.useCallback(t=>{t==null||t.preventDefault();const n=V.trim().toUpperCase();if(!n||n.length<6){y("Enter a valid AWB number (min 6 chars)");return}if(f!=="paired"){y("Not connected to desktop session.");return}y(""),ze(""),K(n),u(o.CAPTURING)},[V,f,u]),Nt=s.useCallback(()=>{window.confirm("End this mobile scanner session on the phone?")&&(d!=null&&d.connected?d.emit("scanner:end-session",{reason:"Mobile ended the session"}):g("/"))},[d,g]),St=s.useCallback(()=>{if(b.length>0){ie();return}window.alert("Everything is already synced.")},[b.length,ie]);s.useEffect(()=>{L.current=x},[x]),s.useEffect(()=>{if(!c){y("No PIN provided.");return}const t=At(Ut,{auth:{scannerPin:c},transports:["websocket","polling"],reconnection:!0,reconnectionDelay:1500,reconnectionAttempts:20});return t.on("connect",()=>U("connecting")),t.on("scanner:paired",({userEmail:n})=>{U("paired"),yt(n?n.split("@")[0]:"Connected"),y(""),u(o.IDLE)}),t.on("scanner:error",({message:n})=>{y(n),U("disconnected")}),t.on("scanner:session-ended",({reason:n})=>{U("disconnected"),y(n||"Session ended by desktop."),g("/")}),t.on("disconnect",()=>U("disconnected")),t.on("reconnect",()=>{f==="paired"&&u(o.SCANNING)}),t.on("scanner:scan-processed",n=>{if(n.status==="error"){J("error"),je(),q([100,50,100]),u(o.ERROR),y(n.error||"Scan failed on desktop.");return}if(ke(n),F({clientCode:n.clientCode||"",consignee:n.consignee||"",destination:n.destination||"",pincode:n.pincode||"",weight:n.weight||0,amount:n.amount||0,orderNo:n.orderNo||""}),Se({}),n.reviewRequired)u(o.REVIEWING);else{we(),q([50,30,50]);const a={awb:n.awb,clientCode:n.clientCode,clientName:n.clientName,destination:n.destination||"",weight:n.weight||0};Q(a),H(a),u(o.SUCCESS)}}),t.on("scanner:approval-result",({success:n,message:a,awb:p})=>{if(n){we(),q([50,30,50]),J("success");const m={awb:(r==null?void 0:r.awb)||p,clientCode:l.clientCode,clientName:(r==null?void 0:r.clientName)||l.clientCode,destination:l.destination||"",weight:parseFloat(l.weight)||0};Q(m),H(m),u(o.SUCCESS)}else je(),y(a||"Approval failed.")}),t.on("scanner:ready-for-next",()=>{}),W(t),()=>{t.disconnect()}},[c,H,r,l,u,g]),s.useEffect(()=>{try{const t=localStorage.getItem(P);if(!t)return;const n=JSON.parse(t);Array.isArray(n)&&n.length&&Ie(n)}catch{}},[P]),s.useEffect(()=>{f==="paired"&&(d!=null&&d.connected)&&b.length&&ie()},[f,d,b.length,ie]);const se=s.useCallback(async()=>{var t;try{if(he(!1),T.current){try{const n=T.current;n!=null&&n.barcodeScanner&&await n.barcodeScanner.dispose()}catch{}T.current=null}if(I.current){try{await I.current.reset()}catch{}I.current=null}(t=w.current)!=null&&t.srcObject&&(w.current.srcObject.getTracks().forEach(n=>n.stop()),w.current.srcObject=null)}catch{}},[]),G=s.useCallback(async()=>{try{if(T.current){try{await T.current.barcodeScanner.dispose()}catch{}T.current=null}if(I.current){try{I.current._type==="native"?I.current.reset():await I.current.reset()}catch{}I.current=null}}catch{}},[]),Me=s.useCallback(async()=>{if(w.current){await G();try{if(!w.current.srcObject){let m=null;try{m=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{m=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}w.current.srcObject=m,await w.current.play()}if(typeof window.BarcodeDetector<"u"){let m=!0,j=ve;try{const E=await window.BarcodeDetector.getSupportedFormats();j=ve.filter(N=>E.includes(N)),j.length||(j=ve)}catch{}if(j.includes("itf")||(console.log("[MobileScanner] Native BarcodeDetector lacks ITF â€” falling back to ZXing"),m=!1),m){const E=new window.BarcodeDetector({formats:j});let N=null;const A=async()=>{var S;if(z.current||L.current!==o.SCANNING)return;const M=w.current;if(!M||M.readyState<2){N=requestAnimationFrame(A);return}try{const O=await E.detect(M);O.length>0&&O[0].rawValue&&((S=$.current)==null||S.call($,O[0].rawValue))}catch{}L.current===o.SCANNING&&(N=requestAnimationFrame(()=>setTimeout(A,15)))};I.current={_type:"native",reset:()=>{N&&cancelAnimationFrame(N),N=null}},setTimeout(A,300);return}}const[{BrowserMultiFormatReader:t},n]=await Promise.all([tt(()=>import("./index-4oYbt_M2.js"),__vite__mapDeps([0,1])),tt(()=>import("./index-D3Mz4UNV.js"),__vite__mapDeps([]))]),a=new Map([[n.DecodeHintType.POSSIBLE_FORMATS,[n.BarcodeFormat.CODE_128,n.BarcodeFormat.ITF,n.BarcodeFormat.CODE_39,n.BarcodeFormat.CODE_93,n.BarcodeFormat.CODABAR,n.BarcodeFormat.EAN_13,n.BarcodeFormat.EAN_8]],[n.DecodeHintType.TRY_HARDER,!0],[n.DecodeHintType.ASSUME_GS1,!1],[n.DecodeHintType.CHARACTER_SET,"UTF-8"]]),p=new t(a,40);I.current=p,p.decodeFromVideoElement(w.current,m=>{var j;z.current||m&&((j=$.current)==null||j.call($,m.getText()))})}catch(t){y("Camera access failed: "+t.message)}}},[G]),Oe=s.useCallback(t=>{const n=String(t||"").trim().replace(/\s+/g,"").toUpperCase();if(!(!n||n.length<6||z.current||L.current!==o.SCANNING)){if(z.current=!0,Te.current.has(n)){q([100,50,100,50,100]),je(),ue(n),setTimeout(()=>{ue(""),z.current=!1},2500);return}clearTimeout(te.current),q([50]),pt(),K(n),ge(a=>{const p={...a,scanNumber:a.scanNumber+1};return p.scannedAwbs=new Set(a.scannedAwbs),p.scannedAwbs.add(n),Te.current=p.scannedAwbs,p}),te.current=setTimeout(()=>{L.current===o.SCANNING&&u(o.CAPTURING)},Yt)}},[u]);s.useEffect(()=>{$.current=Oe},[Oe]),s.useEffect(()=>(x===o.SCANNING&&(z.current=!1,Me()),()=>{x===o.SCANNING&&G()}),[x,Me,G]);const De=s.useCallback(async()=>{var t;await G();try{if((t=w.current)!=null&&t.srcObject){he(!0);return}const n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}});w.current&&(w.current.srcObject=n,await w.current.play(),he(!0))}catch(n){y("Camera access failed: "+n.message)}},[G]);s.useEffect(()=>{x===o.CAPTURING&&De()},[x,De]),s.useEffect(()=>{if(x!==o.CAPTURING){Re(!1),Ae(0),wt.current=!1;return}const t=setInterval(()=>{const n=w.current,a=xe.current;if(!n||!a||!n.videoWidth||!n.videoHeight)return;const p=n.getBoundingClientRect(),m=a.getBoundingClientRect(),j=n.videoWidth/Math.max(p.width,1),E=n.videoHeight/Math.max(p.height,1),N=Math.max(0,Math.floor((m.left-p.left)*j)),A=Math.max(0,Math.floor((m.top-p.top)*E)),M=Math.max(24,Math.floor(m.width*j)),S=Math.max(24,Math.floor(m.height*E)),O=document.createElement("canvas"),oe=96,re=72;O.width=oe,O.height=re;const fe=O.getContext("2d",{willReadFrequently:!0});if(!fe)return;fe.drawImage(n,N,A,Math.min(M,n.videoWidth-N),Math.min(S,n.videoHeight-A),0,0,oe,re);const ae=fe.getImageData(0,0,oe,re).data;let Ke=0,Qe=0,Je=0,Ze=0;for(let D=0;D<ae.length;D+=4){const X=.2126*ae[D]+.7152*ae[D+1]+.0722*ae[D+2];Ke+=X,Qe+=X*X,D>0&&Math.abs(X-Ze)>26&&Je++,Ze=X}const be=oe*re,ce=Ke/be,It=Math.sqrt(Math.max(0,Qe/be-ce*ce)),Rt=Je/Math.max(be,1),et=ce>35&&ce<225&&It>24&&Rt>.12;Re(et),Ae(D=>et?Math.min(D+1,8):0)},320);return()=>clearInterval(t)},[x]);const Pe=s.useCallback(()=>{const t=w.current,n=xe.current;if(!t||!n||!t.videoWidth)return null;const a=t.getBoundingClientRect(),p=n.getBoundingClientRect(),m=t.videoWidth/a.width,j=t.videoHeight/a.height,E=Math.max(0,(p.left-a.left)*m),N=Math.max(0,(p.top-a.top)*j),A=Math.min(t.videoWidth-E,p.width*m),M=Math.min(t.videoHeight-N,p.height*j),S=document.createElement("canvas");return S.width=Math.min(1200,Math.round(A)),S.height=Math.round(S.width/A*M),S.getContext("2d").drawImage(t,E,N,A,M,0,0,S.width,S.height),S.toDataURL("image/jpeg",.75).split(",")[1]||null},[]),kt=s.useCallback(()=>{J("white"),pt(),q([30]);const t=Pe();if(!t){y("Could not capture image. Try again."),z.current=!1;return}de(`data:image/jpeg;base64,${t}`),se(),u(o.PREVIEW)},[Pe,se,u]),Ft=s.useCallback(()=>{if(!k||!_)return;u(o.PROCESSING);const t={scanNumber:v.scanNumber,recentClient:v.dominantClient,dominantClient:v.dominantClient,dominantClientCount:v.dominantClientCount,sessionDurationMin:Math.round((Date.now()-v.startedAt)/6e4)},n=_.split(",")[1]||_,a={awb:k,imageBase64:n,focusImageBase64:n,sessionContext:t};if(!d||!d.connected||f!=="paired"){Be(a),we();const p={awb:k,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};Q({...p,offlineQueued:!0}),H(p),u(o.SUCCESS);return}d.emit("scanner:scan",a),setTimeout(()=>{L.current===o.PROCESSING&&(y("OCR timed out after 40 seconds. Check that GEMINI_API_KEY is set on Railway, then try again."),u(o.ERROR))},4e4)},[d,k,_,v,u,f,Be,H]),Et=s.useCallback(()=>{if(!(!d||!r)){if(u(o.APPROVING),r.ocrExtracted||r){const t={clientCode:r.clientCode||"",clientName:r.clientName||"",consignee:r.consignee||"",destination:r.destination||""},n={clientCode:l.clientCode||"",clientName:l.clientCode||"",consignee:l.consignee||"",destination:l.destination||""};d.emit("scanner:learn-corrections",{pin:c,ocrFields:t,approvedFields:n})}d.emit("scanner:approval-submit",{shipmentId:r.shipmentId,awb:r.awb||k,fields:{clientCode:l.clientCode,consignee:l.consignee,destination:l.destination,pincode:l.pincode,weight:parseFloat(l.weight)||0,amount:parseFloat(l.amount)||0,orderNo:l.orderNo||""}},t=>{t!=null&&t.success||(u(o.REVIEWING),y((t==null?void 0:t.message)||"Approval failed."))}),l.clientCode&&l.clientCode!=="MISC"&&ge(t=>{var p,m;const n={...t.clientFreq};n[l.clientCode]=(n[l.clientCode]||0)+1;const a=Object.entries(n).sort((j,E)=>E[1]-j[1]);return{...t,clientFreq:n,dominantClient:((p=a[0])==null?void 0:p[1])>=2?a[0][0]:null,dominantClientCount:((m=a[0])==null?void 0:m[1])||0}})}},[d,r,l,k,c,u]),Y=s.useCallback(()=>{clearTimeout(ee.current),clearTimeout(te.current),K(""),de(null),ke(null),F({}),Se({}),Q(null),y(""),ue(""),z.current=!1,u(o.IDLE)},[u]);s.useEffect(()=>{if(x===o.SUCCESS)return ee.current=setTimeout(Y,Vt),()=>clearTimeout(ee.current)},[x,Y]),s.useEffect(()=>{if(Z)if(x===o.REVIEWING&&r){const t=[r.clientName||r.clientCode,r.destination,r.weight?`${r.weight} kilograms`:""].filter(Boolean);t.length&&mt(t.join(". "))}else x===o.SUCCESS&&C&&mt(`${C.clientName||C.clientCode||"Shipment"} Verified.`)},[Z,x,r,C]),s.useEffect(()=>()=>{se(),clearTimeout(ee.current),clearTimeout(te.current)},[se]);const R=t=>`msp-step ${x===t?"active":""}`,B=s.useMemo(()=>{if(!r)return{};const t=r.ocrExtracted||r;return{clientCode:{confidence:(t==null?void 0:t.clientNameConfidence)||0,source:(t==null?void 0:t.clientNameSource)||null},consignee:{confidence:(t==null?void 0:t.consigneeConfidence)||0,source:(t==null?void 0:t.consigneeSource)||null},destination:{confidence:(t==null?void 0:t.destinationConfidence)||0,source:(t==null?void 0:t.destinationSource)||null},pincode:{confidence:(t==null?void 0:t.pincodeConfidence)||0,source:null},weight:{confidence:(t==null?void 0:t.weightConfidence)||0,source:null}}},[r]),We=v.scannedItems.reduce((t,n)=>t+(n.weight||0),0),h=(($e=r==null?void 0:r.ocrExtracted)==null?void 0:$e.intelligence)||(r==null?void 0:r.intelligence)||null;return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:Xt}),e.jsxs("div",{className:"msp-root",children:[Fe&&e.jsx("div",{className:`flash-overlay flash-${Fe}`,onAnimationEnd:()=>J(null)}),Ee&&e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[e.jsx(nt,{size:48,color:"white"}),e.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),e.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:Ee}),e.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),e.jsx("div",{className:R(o.IDLE),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:f==="connecting"?e.jsx(ye,{size:28,color:i.primary,style:{animation:"spin 1s linear infinite"}}):e.jsx(it,{size:28,color:i.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:f==="connecting"?"Connecting...":"Disconnected"}),e.jsx("div",{style:{fontSize:"0.82rem",color:i.muted},children:Ne||`Connecting to session ${c}`})]}),f==="disconnected"&&e.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[e.jsx(ye,{size:16})," Reconnect"]})]})}),e.jsx("video",{ref:w,autoPlay:!0,playsInline:!0,muted:!0,style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(x===o.SCANNING||x===o.CAPTURING)&&!T.current?"block":"none"}}),e.jsx("div",{className:R(o.IDLE),children:e.jsxs("div",{className:"home-root",children:[e.jsxs("div",{className:"home-header",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16},children:[e.jsxs("button",{onClick:()=>g("/app/scan"),style:{background:"white",border:"1px solid #E2E8F0",padding:"6px 12px",borderRadius:20,fontSize:"0.75rem",fontWeight:600,color:"#475569",display:"flex",alignItems:"center",gap:4,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.02)"},children:[e.jsx(Bt,{size:14})," Go Back"]}),e.jsxs("div",{className:"home-logo-badge",children:[e.jsx(st,{size:11,color:f==="paired"&&navigator.onLine?"#10B981":"#EF4444"}),bt]})]}),e.jsx("div",{className:"home-logo-row",children:e.jsxs("div",{className:"home-logo-text",children:[e.jsx("img",{src:"/images/logo.png",alt:"Sea Hawk Logo",style:{height:28,width:"auto",objectFit:"contain",padding:2,background:"white",borderRadius:6,border:"1px solid #E2E8F0"}}),e.jsx("span",{children:"Seahawk Scanner"})]})}),e.jsxs("div",{className:"home-stats-row",children:[e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:v.scanNumber}),e.jsx("div",{className:"home-stat-label",children:"Scanned"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:We>0?We.toFixed(1):"0"}),e.jsx("div",{className:"home-stat-label",children:"Total kg"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:xt}),e.jsx("div",{className:"home-stat-label",children:"Session"})]})]})]}),e.jsxs("div",{className:"home-scan-section",children:[e.jsxs("div",{className:"home-scan-btn-wrap",children:[e.jsx("div",{className:"home-scan-ring"}),e.jsx("div",{className:"home-scan-ring home-scan-ring2"}),e.jsxs("button",{className:"home-scan-btn",onClick:jt,children:[e.jsx(ot,{size:34,color:"white"}),e.jsx("span",{className:"home-scan-btn-label",children:"Scan"})]})]}),e.jsx("div",{className:"home-cta-text",children:v.scanNumber===0?"Tap to start your first scan":"Tap to scan next parcel"}),e.jsxs("form",{onSubmit:Ct,style:{width:"100%",maxWidth:300,marginTop:20},children:[e.jsx("div",{style:{fontSize:"0.62rem",fontWeight:700,color:i.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6,textAlign:"center"},children:"Can't scan? Enter AWB manually"}),e.jsxs("div",{style:{display:"flex",gap:6},children:[e.jsx("input",{value:V,onChange:t=>ze(t.target.value.toUpperCase()),placeholder:"e.g. 1234567890",inputMode:"text",autoCapitalize:"characters",style:{flex:1,padding:"9px 12px",border:`1.5px solid ${i.border}`,borderRadius:10,fontFamily:"JetBrains Mono, monospace",fontSize:"0.82rem",fontWeight:600,background:i.surface,color:i.text,outline:"none"},onFocus:t=>t.target.style.borderColor=i.primary,onBlur:t=>t.target.style.borderColor=i.border}),e.jsx("button",{type:"submit",disabled:V.trim().length<6,className:"btn btn-primary",style:{padding:"9px 14px",fontSize:"0.78rem",borderRadius:10,opacity:V.trim().length>=6?1:.45},children:"Go â†’"})]})]}),e.jsxs("div",{className:"action-buttons-row",children:[e.jsxs("button",{className:"action-btn",onClick:St,children:[e.jsx(Mt,{size:14})," ",b.length>0?`Upload (${b.length})`:"Synced"]}),e.jsxs("button",{className:"action-btn danger",onClick:Nt,children:[e.jsx(Ot,{size:14})," End Session"]})]}),b.length>0&&e.jsxs("div",{style:{marginTop:14,fontSize:"0.7rem",color:i.warning,fontWeight:600,display:"flex",alignItems:"center",gap:5},children:[e.jsx(rt,{size:12})," ",b.length," offline scan",b.length>1?"s":""," pending sync"]})]}),e.jsxs("div",{className:"home-queue-section",children:[e.jsxs("div",{className:"home-queue-head",children:[e.jsxs("div",{className:"home-queue-title-text",children:[e.jsx(Dt,{size:11}),"Accepted Consignments"]}),v.scannedItems.length>0&&e.jsx("div",{className:"home-queue-badge",children:v.scannedItems.length})]}),e.jsx("div",{className:"home-queue-list",children:v.scannedItems.length===0?e.jsxs("div",{className:"queue-empty",children:[e.jsx(at,{size:36,color:"rgba(255,255,255,0.12)"}),e.jsxs("div",{className:"queue-empty-text",children:["No consignments scanned yet.",e.jsx("br",{}),"Tap the button above to begin."]})]}):v.scannedItems.map((t,n)=>e.jsxs("div",{className:"queue-item",children:[e.jsx("div",{className:"queue-check",children:e.jsx(ct,{size:13,color:"#10B981"})}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{className:"queue-awb",children:t.awb}),e.jsxs("div",{className:"queue-meta",children:[t.clientCode==="OFFLINE"?e.jsx("span",{className:"queue-offline-tag",children:"Offline"}):t.clientCode&&e.jsx("span",{className:"queue-client-tag",children:t.clientCode}),t.destination&&e.jsx("span",{children:t.destination})]})]}),t.weight>0&&e.jsxs("div",{className:"queue-weight",children:[t.weight,"kg"]})]},`${t.awb}-${n}`))})]})]})}),e.jsx("div",{className:R(o.SCANNING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[e.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:T.current?"block":"none"}}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{className:"scan-guide",style:{width:dt.w,height:dt.h,borderRadius:10,maxHeight:"20vw"},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"}),e.jsx("div",{className:"scan-laser"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(st,{size:12})," ",c]}),e.jsxs("div",{className:"cam-hud-chip",style:{gap:4},children:[e.jsx(at,{size:12})," ",v.scanNumber,typeof window<"u"&&typeof window.BarcodeDetector<"u"?e.jsx("span",{style:{color:"#34D399",fontSize:"0.6rem",fontWeight:800},children:"âš¡ NATIVE"}):e.jsx("span",{style:{color:"#F59E0B",fontSize:"0.6rem",fontWeight:800},children:"ZXING"})]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:"Align barcode inside the strip"}),e.jsx("div",{style:{display:"flex",gap:12},children:e.jsx("button",{className:"cam-hud-chip",onClick:()=>vt(!Z),style:{border:"none",cursor:"pointer"},children:Z?e.jsx(Pt,{size:14}):e.jsx(Wt,{size:14})})})]})]})}),e.jsx("div",{className:R(o.CAPTURING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!me&&e.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[e.jsx($t,{size:44,color:"#34D399"}),e.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:k}),e.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:"Barcode locked Â· Preparing cameraâ€¦"})]}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{ref:xe,className:`scan-guide ${pe?"detected":""}`,style:{width:ut.w,height:ut.h,maxHeight:"75vh",borderRadius:12},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[e.jsx(_t,{size:12})," ",k]}),b.length>0&&e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(rt,{size:12})," ",b.length," queued"]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:pe?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center",transition:"color 0.3s"},children:pe?"âœ“ AWB in frame â€” press shutter":"Fit the AWB slip inside the frame"}),e.jsx("button",{className:"capture-btn",onClick:kt,disabled:!me,style:{opacity:me?1:.4},children:e.jsx("div",{className:"capture-btn-inner"})}),e.jsx("button",{style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},onClick:()=>{K(""),z.current=!1,u(o.SCANNING)},children:"â† Rescan barcode"})]})]})}),e.jsx("div",{className:R(o.PREVIEW),children:e.jsxs("div",{style:{background:i.bg,display:"flex",flexDirection:"column",height:"100%"},children:[e.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${i.border}`},children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.72rem",color:i.muted,fontWeight:600},children:"CAPTURED"}),e.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:k})]})}),e.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:_&&e.jsx("img",{src:_,alt:"Captured label",className:"preview-img"})}),e.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{de(null),u(o.CAPTURING)},children:[e.jsx(lt,{size:16})," Retake"]}),e.jsxs("button",{className:"btn btn-primary",style:{flex:2},onClick:Ft,children:[e.jsx(Lt,{size:16})," Use Photo"]})]})]})}),e.jsx("div",{className:R(o.PROCESSING),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16},children:[e.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[e.jsx(Gt,{size:22,color:i.primary,style:{animation:"spin 2s linear infinite"}}),e.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:i.primary},children:"Intelligence Engine"})]}),e.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:i.muted},children:k}),e.jsx("div",{style:{fontSize:"0.72rem",color:i.mutedLight,marginTop:6},children:"Reading AWB label with Gemini Visionâ€¦"})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(t=>e.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:t}),e.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),e.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},t)),e.jsx("div",{style:{textAlign:"center",marginTop:8},children:e.jsx("button",{className:"btn btn-outline",style:{fontSize:"0.75rem",padding:"8px 20px"},onClick:()=>{y("Cancelled by user."),u(o.ERROR)},children:"Cancel"})})]})}),e.jsx("div",{className:R(o.REVIEWING),children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%"},children:[e.jsxs("div",{style:{padding:"14px 20px",borderBottom:`1px solid ${i.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.65rem",color:i.muted,fontWeight:600},children:"REVIEW EXTRACTION"}),e.jsx("div",{className:"mono",style:{fontSize:"0.95rem",fontWeight:700},children:(r==null?void 0:r.awb)||k})]}),(h==null?void 0:h.learnedFieldCount)>0&&e.jsxs("div",{className:"source-badge source-learned",children:["ðŸ§  ",h.learnedFieldCount," auto-corrected"]})]}),e.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsxs("div",{className:`field-card ${(((_e=B.clientCode)==null?void 0:_e.confidence)||0)<.55?"warning":""}`,children:[e.jsx("div",{className:Ce(((Le=B.clientCode)==null?void 0:Le.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((Ge=B.clientCode)==null?void 0:Ge.source)&&(()=>{const t=ht(B.clientCode.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:l.clientCode||"",onChange:t=>F(n=>({...n,clientCode:t.target.value.toUpperCase()})),placeholder:"Client code"}),((qe=h==null?void 0:h.clientMatches)==null?void 0:qe.length)>0&&h.clientNeedsConfirmation&&e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:h.clientMatches.slice(0,3).map(t=>e.jsxs("button",{onClick:()=>F(n=>({...n,clientCode:t.code})),style:{fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:`1px solid ${i.border}`,background:l.clientCode===t.code?i.primaryLight:i.surface,color:i.text,cursor:"pointer",fontFamily:"inherit",fontWeight:500},children:[t.code," (",Math.round(t.score*100),"%)"]},t.code))})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:Ce(((Ue=B.consignee)==null?void 0:Ue.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Consignee"}),e.jsx("input",{className:"field-input",value:l.consignee||"",onChange:t=>F(n=>({...n,consignee:t.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:Ce(((Ve=B.destination)==null?void 0:Ve.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((He=B.destination)==null?void 0:He.source)&&(()=>{const t=ht(B.destination.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:l.destination||"",onChange:t=>F(n=>({...n,destination:t.target.value.toUpperCase()})),placeholder:"City"}),(h==null?void 0:h.pincodeCity)&&h.pincodeCity!==l.destination&&e.jsxs("button",{onClick:()=>F(t=>({...t,destination:h.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:i.successLight,color:i.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["ðŸ“ Pincode suggests: ",h.pincodeCity]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Pincode"}),e.jsx("input",{className:"field-input",value:l.pincode||"",onChange:t=>F(n=>({...n,pincode:t.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),e.jsx("div",{className:`field-card ${(Ye=h==null?void 0:h.weightAnomaly)!=null&&Ye.anomaly?"warning":""}`,children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Weight (kg)"}),e.jsx("input",{className:"field-input",value:l.weight||"",onChange:t=>F(n=>({...n,weight:t.target.value})),placeholder:"0.0",inputMode:"decimal"}),((Xe=h==null?void 0:h.weightAnomaly)==null?void 0:Xe.anomaly)&&e.jsxs("div",{style:{fontSize:"0.6rem",color:i.warning,marginTop:2,fontWeight:500},children:["âš ï¸ ",h.weightAnomaly.warning]})]})})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Amount (â‚¹)"}),e.jsx("input",{className:"field-input",value:l.amount||"",onChange:t=>F(n=>({...n,amount:t.target.value})),placeholder:"0",inputMode:"decimal"})]})}),e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Order No"}),e.jsx("input",{className:"field-input",value:l.orderNo||"",onChange:t=>F(n=>({...n,orderNo:t.target.value})),placeholder:"Optional"})]})})]})]}),e.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${i.border}`,display:"flex",gap:10},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:Y,children:[e.jsx(qt,{size:16})," Skip"]}),e.jsxs("button",{className:"btn btn-success btn-lg",style:{flex:2},onClick:Et,disabled:x===o.APPROVING,children:[x===o.APPROVING?e.jsx(ye,{size:16,style:{animation:"spin 1s linear infinite"}}):e.jsx(ct,{size:16}),x===o.APPROVING?"Saving...":"Approve & Save"]})]})]})}),e.jsx("div",{className:R(o.APPROVING)}),e.jsx("div",{className:R(o.SUCCESS),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[e.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:i.success,strokeWidth:"3",className:"success-check-circle"}),e.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:i.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:i.success,marginBottom:4},children:"Saved Successfully"}),e.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700},children:C==null?void 0:C.awb}),(C==null?void 0:C.clientCode)&&e.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:i.primaryLight,color:i.primary,fontSize:"0.78rem",fontWeight:600},children:C.clientName||C.clientCode})]}),e.jsx("div",{style:{fontSize:"0.72rem",color:i.muted},children:C!=null&&C.offlineQueued?`${b.length} queued for sync â€¢ Auto-continuing in 3s`:`#${v.scanNumber} scanned â€¢ Auto-continuing in 3s`}),e.jsxs("button",{className:"btn btn-primary btn-lg btn-full",onClick:Y,style:{maxWidth:320},children:[e.jsx(ot,{size:18})," Scan Next Parcel"]})]})}),e.jsx("div",{className:R(o.ERROR),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(nt,{size:32,color:i.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:i.error},children:"Scan Error"}),e.jsx("div",{style:{fontSize:"0.82rem",color:i.muted,marginTop:4},children:Ne})]}),e.jsxs("button",{className:"btn btn-primary",onClick:Y,children:[e.jsx(lt,{size:16})," Try Again"]})]})}),f==="disconnected"&&x!==o.IDLE&&e.jsxs("div",{className:"offline-banner",children:[e.jsx(it,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline â€” Reconnecting... ",b.length?`(${b.length} queued)`:""]})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{ln as default};
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/index-4oYbt_M2.js","assets/index-D3Mz4UNV.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
