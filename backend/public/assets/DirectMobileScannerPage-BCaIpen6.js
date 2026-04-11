import{u as vt,_ as Ve}from"./index-DjXvc5AE.js";import{j as e}from"./page-landing-Bx5c8M2c.js";import{r as s}from"./vendor-helmet-Dwc3L0SQ.js";import{a as Q}from"./page-import-Djha-JxU.js";import{u as wt}from"./vendor-react-DGJm5saH.js";import{b as He,V as jt,aG as Qe,aF as Xe,aE as Ct,a5 as Nt,d as Je,a0 as Ft,z as Ye,aK as Ke,aH as kt,aI as St,X as Ze,au as Et,aL as It,aJ as et,O as At,ax as Rt,R as zt,aD as Tt}from"./vendor-icons-DNlwW1li.js";import"./page-reconcile-MLkeoM-E.js";import"./page-rate-calc-Swpu-Ill.js";const tt={w:"90vw",h:"18vw"},nt={w:"92vw",h:"130vw"},Dt=1800,Bt="mobile_scanner_offline_queue",Ot=80,st=["code_128","code_39","code_93","codabar","ean_13","ean_8","itf","qr_code"],a={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"},L=g=>{var p;try{(p=navigator==null?void 0:navigator.vibrate)==null||p.call(navigator,g)}catch{}},re=(g,p,B="sine")=>{try{const N=new(window.AudioContext||window.webkitAudioContext),O=N.createOscillator(),P=N.createGain();O.type=B,O.frequency.setValueAtTime(g,N.currentTime),P.gain.setValueAtTime(.12,N.currentTime),P.gain.exponentialRampToValueAtTime(.01,N.currentTime+p),O.connect(P),P.connect(N.destination),O.start(),O.stop(N.currentTime+p)}catch{}},xe=()=>{re(880,.12),setTimeout(()=>re(1100,.1),130)},it=()=>re(600,.08),at=()=>re(200,.25,"sawtooth"),rt=g=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const p=new SpeechSynthesisUtterance(g);p.rate=1.2,p.pitch=1,p.lang="en-IN",window.speechSynthesis.speak(p)}catch{}},i={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",mutedLight:"#9CA3AF",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},Mt=`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');

.msp-root {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: #F8FAFC; color: ${i.text};
  min-height: 100dvh; display: flex; flex-direction: column;
  overflow: hidden; position: relative;
  user-select: none; -webkit-user-select: none;
}
.msp-root * { box-sizing: border-box; }
.mono { font-family: 'JetBrains Mono', 'SF Mono', monospace; letter-spacing: -0.02em; }

/* ── Step wrappers ── */
.msp-step {
  position: absolute; inset: 0; display: none; flex-direction: column;
  opacity: 0; pointer-events: none; z-index: 1;
}
.msp-step.active { display: flex; opacity: 1; pointer-events: all; z-index: 2; }

/* ── Camera ── */
.cam-viewport {
  position: relative; width: 100%; flex: 1;
  min-height: 100dvh; background: transparent; overflow: hidden;
}
.cam-viewport video { width: 100%; height: 100%; object-fit: cover; }
.cam-overlay {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center; z-index: 3;
}

/* ── Scan guide ── */
.scan-guide {
  border: 2.5px solid rgba(255,255,255,0.7); border-radius: 16px;
  position: relative; transition: border-color 0.3s, box-shadow 0.3s;
}
.scan-guide.detected {
  border-color: #10B981;
  box-shadow: 0 0 0 3px rgba(16,185,129,0.25), inset 0 0 30px rgba(16,185,129,0.05);
}
.scan-guide-corner {
  position: absolute; width: 24px; height: 24px;
  border: 3px solid rgba(255,255,255,0.9); transition: border-color 0.3s;
}
.scan-guide.detected .scan-guide-corner { border-color: #10B981; }
.corner-tl { top:-2px; left:-2px; border-right:none; border-bottom:none; border-radius:8px 0 0 0; }
.corner-tr { top:-2px; right:-2px; border-left:none; border-bottom:none; border-radius:0 8px 0 0; }
.corner-bl { bottom:-2px; left:-2px; border-right:none; border-top:none; border-radius:0 0 0 8px; }
.corner-br { bottom:-2px; right:-2px; border-left:none; border-top:none; border-radius:0 0 8px 0; }

@keyframes laserScan { 0%,100% { top:15%; } 50% { top:82%; } }
.scan-laser {
  position: absolute; left: 8%; right: 8%; height: 2px;
  background: linear-gradient(90deg, transparent, rgba(79,70,229,0.6), transparent);
  animation: laserScan 2.5s ease-in-out infinite;
}

.cam-hud {
  position: absolute; top: 0; left: 0; right: 0; padding: 16px 20px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.55), transparent);
  display: flex; justify-content: space-between; align-items: flex-start; z-index: 3;
}
.cam-hud-chip {
  padding: 5px 12px; border-radius: 20px;
  background: rgba(255,255,255,0.15); backdrop-filter: blur(8px);
  color: white; font-size: 0.72rem; font-weight: 600;
  display: flex; align-items: center; gap: 5px;
}
.cam-bottom {
  position: absolute; bottom: 0; left: 0; right: 0; padding: 20px;
  background: linear-gradient(to top, rgba(0,0,0,0.65), transparent);
  display: flex; flex-direction: column; align-items: center; gap: 12px; z-index: 3;
}

/* ── Cards / Buttons ── */
.card {
  background: ${i.surface}; border: 1px solid ${i.border};
  border-radius: 16px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px 24px; border-radius: 12px; border: none;
  font-family: inherit; font-size: 0.9rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.btn:active { transform: scale(0.97); }
.btn-primary { background: linear-gradient(135deg, #4F46E5, #6366F1); color: white; }
.btn-primary:hover { box-shadow: 0 4px 14px rgba(79,70,229,0.35); }
.btn-success { background: linear-gradient(135deg, #059669, #10B981); color: white; }
.btn-outline { background: ${i.surface}; border: 1.5px solid ${i.border}; color: ${i.text}; }
.btn-lg { padding: 16px 32px; font-size: 1rem; border-radius: 14px; }
.btn-full { width: 100%; }
.btn:disabled { opacity: 0.5; cursor: default; }

.capture-btn {
  width: 72px; height: 72px; border-radius: 50%;
  background: white; border: 4px solid rgba(255,255,255,0.4);
  cursor: pointer; position: relative; transition: transform 0.15s;
  box-shadow: 0 4px 20px rgba(0,0,0,0.25);
}
.capture-btn:active { transform: scale(0.92); }
.capture-btn-inner { position: absolute; inset: 4px; border-radius: 50%; background: white; border: 2px solid #E5E7EB; }

.preview-img { width: 100%; border-radius: 12px; object-fit: contain; max-height: 50vh; background: #F1F5F9; }

/* ── Field cards ── */
.field-card {
  display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px;
  background: ${i.surface}; border: 1px solid ${i.border}; border-radius: 12px;
}
.field-card.warning { border-color: ${i.warning}; background: ${i.warningLight}; }
.field-label { font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: ${i.muted}; margin-bottom: 2px; }
.field-input {
  width: 100%; background: ${i.bg}; border: 1px solid ${i.border};
  border-radius: 8px; padding: 8px 10px;
  font-family: inherit; font-size: 0.82rem; font-weight: 500; color: ${i.text}; outline: none;
}
.field-input:focus { border-color: ${i.primary}; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }

/* ── Confidence dots ── */
.conf-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
.conf-high { background: ${i.success}; }
.conf-med  { background: ${i.warning}; }
.conf-low  { background: ${i.error}; }

/* ── Source badges ── */
.source-badge { font-size: 0.6rem; padding: 2px 6px; border-radius: 6px; font-weight: 600; display: inline-flex; align-items: center; gap: 3px; }
.source-learned  { background: #F5F3FF; color: #7C3AED; }
.source-ai       { background: ${i.primaryLight}; color: ${i.primary}; }
.source-history  { background: ${i.warningLight}; color: ${i.warning}; }
.source-pincode  { background: ${i.successLight}; color: ${i.success}; }

/* ── Shimmer ── */
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
.skeleton {
  background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
  background-size: 200% 100%; animation: shimmer 1.5s ease-in-out infinite; border-radius: 8px;
}

/* ── Success animation ── */
@keyframes checkDraw { 0% { stroke-dashoffset: 48; } 100% { stroke-dashoffset: 0; } }
@keyframes circleDraw { 0% { stroke-dashoffset: 200; } 100% { stroke-dashoffset: 0; } }
.success-check-circle { stroke-dasharray: 200; stroke-dashoffset: 200; animation: circleDraw 0.6s ease-out 0.1s forwards; }
.success-check-mark { stroke-dasharray: 48; stroke-dashoffset: 48; animation: checkDraw 0.5s ease-out 0.5s forwards; }

/* ── Flash / Shake ── */
@keyframes flash { 0% { opacity: 0.8; } 100% { opacity: 0; } }
.flash-overlay { position: fixed; inset: 0; z-index: 50; pointer-events: none; animation: flash 0.3s ease-out forwards; }
.flash-white   { background: white; }
.flash-success { background: rgba(5,150,105,0.2); }
.flash-error   { background: rgba(220,38,38,0.2); }
@keyframes shake { 0%,100% { transform:translateX(0); } 20%,60% { transform:translateX(-6px); } 40%,80% { transform:translateX(6px); } }
.shake { animation: shake 0.5s ease-in-out; }

.offline-banner {
  background: ${i.warningLight}; color: ${i.warning};
  text-align: center; padding: 6px; font-size: 0.72rem; font-weight: 600;
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 99;
}
.scroll-panel { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 16px 20px; }

/* ════════════════════════════════════════════════════════
   HOME SCREEN (DTDC-inspired)
   ════════════════════════════════════════════════════════ */
.home-root {
  display: flex; flex-direction: column;
  min-height: 100dvh; overflow-y: auto;
  background: #F8FAFC;
}

/* ── Header ── */
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

/* ── Scan CTA ── */
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

/* ── Queue ── */
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
.queue-awb { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; font-weight: 600; color: #0F172A; }
.queue-meta { font-size: 0.64rem; color: #64748B; margin-top: 2px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.queue-client-tag { background: #EEF2FF; color: #4F46E5; padding: 1px 6px; border-radius: 4px; }
.queue-offline-tag { background: #FFFBEB; color: #D97706; padding: 1px 6px; border-radius: 4px; }
.queue-weight { font-size: 0.72rem; font-weight: 700; color: #4F46E5; margin-left: auto; flex-shrink: 0; }
.queue-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 44px 20px; gap: 12px; }
.queue-empty-text { font-size: 0.8rem; color: #94A3B8; font-weight: 500; text-align: center; line-height: 1.5; }
`,Pt=g=>g>=.85?"high":g>=.55?"med":"low",fe=g=>`conf-dot conf-${Pt(g)}`,ot=g=>g==="learned"?{cls:"source-badge source-learned",icon:"🧠",txt:"Learned"}:g==="fuzzy_match"?{cls:"source-badge source-ai",icon:"🔍",txt:"Matched"}:["fuzzy_history","consignee_pattern"].includes(g)?{cls:"source-badge source-history",icon:"📊",txt:"History"}:["delhivery_pincode","india_post","pincode_lookup","indiapost_lookup"].includes(g)?{cls:"source-badge source-pincode",icon:"📍",txt:"Pincode"}:null,Wt=g=>{const p=Math.floor(g/6e4);return p<60?`${p}m`:`${Math.floor(p/60)}h ${p%60}m`};function Xt(){var ze,Te,De,Be,Oe,Me,Pe,We,_e,$e;const g=wt(),{user:p}=vt(),B=`${Bt}:direct`,[N,O]=s.useState("paired"),[P,z]=s.useState(""),[x,ct]=s.useState(a.IDLE),[F,oe]=s.useState(""),[W,ce]=s.useState(null),[_t,be]=s.useState({}),[r,ye]=s.useState(null),[u,E]=s.useState({}),[k,X]=s.useState(null),[ve,J]=s.useState(null),[we,le]=s.useState(""),[b,je]=s.useState([]),[de,Ce]=s.useState(!1),[ue,pe]=s.useState(!1),[lt,dt]=s.useState("0m"),[y,Y]=s.useState({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now(),scannedItems:[]}),[me,ut]=s.useState(!1),j=s.useRef(null),he=s.useRef(null),I=s.useRef(null),T=s.useRef(null),A=s.useRef(!1),K=s.useRef(null),pt=s.useRef(!1),q=s.useRef(a.IDLE),Z=s.useRef(null),M=s.useRef(null),Ne=s.useRef(new Set);s.useEffect(()=>{const t=setInterval(()=>dt(Wt(Date.now()-y.startedAt)),3e4);return()=>clearInterval(t)},[y.startedAt]);const ee=s.useCallback(t=>{je(t);try{t.length?localStorage.setItem(B,JSON.stringify(t)):localStorage.removeItem(B)}catch{}},[B]),Fe=s.useCallback(t=>{const n={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:t};return ee([...b,n]),n},[b,ee]),te=s.useCallback(async()=>{var t,n;if(!(!b.length||!navigator.onLine)){for(const l of b)if(!(!((t=l==null?void 0:l.payload)!=null&&t.awb)||!((n=l==null?void 0:l.payload)!=null&&n.imageBase64)))try{await Q.post("/shipments/scan-mobile",l.payload)}catch{}ee([])}},[b,ee]),mt=s.useCallback(()=>{window.confirm("Are you sure you want to end this session? All local statistics will be reset.")&&Y({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now(),scannedItems:[]})},[]),ht=s.useCallback(()=>{b.length>0?(te(),alert(`Flushing ${b.length} offline items to the server.`)):alert("No pending offline scans to upload. Everything is synced!")},[b,te]),m=s.useCallback(t=>ct(t),[]);s.useEffect(()=>{q.current=x},[x]),s.useEffect(()=>{if(!p){g("/");return}O("paired")},[p,g]),s.useEffect(()=>{try{const t=localStorage.getItem(B);if(!t)return;const n=JSON.parse(t);Array.isArray(n)&&n.length&&je(n)}catch{}},[B]),s.useEffect(()=>{N==="paired"&&b.length&&te()},[N,b.length,te]);const ne=s.useCallback(async()=>{var t,n;try{if(pe(!1),T.current){try{await((t=T.current.barcodeScanner)==null?void 0:t.dispose())}catch{}T.current=null}if(I.current){try{await I.current.reset()}catch{}I.current=null}(n=j.current)!=null&&n.srcObject&&(j.current.srcObject.getTracks().forEach(l=>l.stop()),j.current.srcObject=null)}catch{}},[]),_=s.useCallback(async()=>{var t;try{if(T.current){try{await((t=T.current.barcodeScanner)==null?void 0:t.dispose())}catch{}T.current=null}if(I.current){try{I.current._type==="native"?I.current.reset():await I.current.reset()}catch{}I.current=null}}catch{}},[]),ke=s.useCallback(async()=>{if(j.current){await _();try{if(!j.current.srcObject){let o;try{o=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{o=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}j.current.srcObject=o,await j.current.play()}if(typeof window.BarcodeDetector<"u"){let o=st;try{const C=await window.BarcodeDetector.getSupportedFormats();o=st.filter(S=>C.includes(S))||o}catch{}const f=new window.BarcodeDetector({formats:o});let c=null;const v=async()=>{var S;if(A.current||q.current!==a.SCANNING)return;const C=j.current;if(!C||C.readyState<2){c=requestAnimationFrame(v);return}try{const w=await f.detect(C);w.length&&w[0].rawValue&&((S=M.current)==null||S.call(M,w[0].rawValue))}catch{}q.current===a.SCANNING&&(c=requestAnimationFrame(()=>setTimeout(v,15)))};I.current={_type:"native",reset:()=>{c&&cancelAnimationFrame(c),c=null}},setTimeout(v,300);return}const[{BrowserMultiFormatReader:t},n]=await Promise.all([Ve(()=>import("./index-4oYbt_M2.js"),__vite__mapDeps([0,1])),Ve(()=>import("./index-D3Mz4UNV.js"),__vite__mapDeps([]))]),l=new Map([[n.DecodeHintType.POSSIBLE_FORMATS,[n.BarcodeFormat.CODE_128,n.BarcodeFormat.ITF,n.BarcodeFormat.CODE_39,n.BarcodeFormat.CODE_93,n.BarcodeFormat.CODABAR,n.BarcodeFormat.EAN_13,n.BarcodeFormat.EAN_8]],[n.DecodeHintType.TRY_HARDER,!0],[n.DecodeHintType.CHARACTER_SET,"UTF-8"]]),d=new t(l,80);I.current=d,d.decodeFromVideoElement(j.current,o=>{var f;!A.current&&o&&((f=M.current)==null||f.call(M,o.getText()))})}catch(t){z("Camera access failed: "+t.message)}}},[_]),Se=s.useCallback(t=>{const n=String(t||"").trim().replace(/\s+/g,"").toUpperCase();if(!(!n||n.length<6||A.current||q.current!==a.SCANNING)){if(A.current=!0,Ne.current.has(n)){L([100,50,100,50,100]),at(),le(n),setTimeout(()=>{le(""),A.current=!1},2500);return}clearTimeout(Z.current),L([50]),it(),oe(n),Y(l=>{const d={...l,scanNumber:l.scanNumber+1,scannedAwbs:new Set(l.scannedAwbs)};return d.scannedAwbs.add(n),Ne.current=d.scannedAwbs,d}),Z.current=setTimeout(()=>{q.current===a.SCANNING&&m(a.CAPTURING)},Ot)}},[m]);s.useEffect(()=>{M.current=Se},[Se]),s.useEffect(()=>(x===a.SCANNING&&(A.current=!1,ke()),()=>{x===a.SCANNING&&_()}),[x,ke,_]);const gt=s.useCallback(()=>{m(a.SCANNING)},[m]),Ee=s.useCallback(async()=>{var t;await _();try{if((t=j.current)!=null&&t.srcObject){pe(!0);return}const n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}});j.current&&(j.current.srcObject=n,await j.current.play(),pe(!0))}catch(n){z("Camera access failed: "+n.message)}},[_]);s.useEffect(()=>{x===a.CAPTURING&&Ee()},[x,Ee]),s.useEffect(()=>{if(x!==a.CAPTURING){Ce(!1),pt.current=!1;return}const t=setInterval(()=>{const n=j.current,l=he.current;if(!n||!l||!n.videoWidth)return;const d=n.getBoundingClientRect(),o=l.getBoundingClientRect(),f=n.videoWidth/Math.max(d.width,1),c=n.videoHeight/Math.max(d.height,1),v=Math.max(0,Math.floor((o.left-d.left)*f)),C=Math.max(0,Math.floor((o.top-d.top)*c)),S=Math.max(24,Math.floor(o.width*f)),w=Math.max(24,Math.floor(o.height*c)),U=document.createElement("canvas");U.width=96,U.height=72;const V=U.getContext("2d",{willReadFrequently:!0});if(!V)return;V.drawImage(n,v,C,Math.min(S,n.videoWidth-v),Math.min(w,n.videoHeight-C),0,0,96,72);const ie=V.getImageData(0,0,96,72).data;let Le=0,qe=0,Ge=0,Ue=0;for(let $=0;$<ie.length;$+=4){const H=.2126*ie[$]+.7152*ie[$+1]+.0722*ie[$+2];Le+=H,qe+=H*H,$>0&&Math.abs(H-Ue)>26&&Ge++,Ue=H}const ge=96*72,ae=Le/ge,yt=Math.sqrt(Math.max(0,qe/ge-ae*ae));Ce(ae>35&&ae<225&&yt>24&&Ge/ge>.12)},320);return()=>clearInterval(t)},[x]);const Ie=s.useCallback(t=>{try{const n=t.getContext("2d",{willReadFrequently:!0});if(!n)return;const l=n.getImageData(0,0,t.width,t.height),d=l.data;for(let o=0;o<d.length;o+=4){const f=.299*d[o]+.587*d[o+1]+.114*d[o+2],c=Math.min(255,Math.max(0,(f-127)*1.45+127));d[o]=d[o+1]=d[o+2]=c}n.putImageData(l,0,0)}catch{}},[]),Ae=s.useCallback(()=>{const t=j.current,n=he.current;if(!t||!n||!t.videoWidth)return null;const l=t.getBoundingClientRect(),d=n.getBoundingClientRect(),o=t.videoWidth/l.width,f=t.videoHeight/l.height,c=Math.max(0,(d.left-l.left)*o),v=Math.max(0,(d.top-l.top)*f),C=Math.min(t.videoWidth-c,d.width*o),S=Math.min(t.videoHeight-v,d.height*f),w=document.createElement("canvas");return w.width=Math.min(1200,Math.round(C)),w.height=Math.round(w.width/C*S),w.getContext("2d").drawImage(t,c,v,C,S,0,0,w.width,w.height),Ie(w),w.toDataURL("image/jpeg",.82).split(",")[1]||null},[Ie]),xt=s.useCallback(()=>{J("white"),it(),L([30]);const t=Ae();if(!t){z("Could not capture image. Try again."),A.current=!1;return}ce(`data:image/jpeg;base64,${t}`),ne(),m(a.PREVIEW)},[Ae,ne,m]),G=s.useCallback(t=>{Y(n=>({...n,scannedItems:[{...t,time:Date.now()},...n.scannedItems]}))},[]),ft=s.useCallback(async()=>{var d,o;if(!F||!W)return;m(a.PROCESSING);const t={scanNumber:y.scanNumber,recentClient:y.dominantClient,dominantClient:y.dominantClient,dominantClientCount:y.dominantClientCount,sessionDurationMin:Math.round((Date.now()-y.startedAt)/6e4)},n=W.split(",")[1]||W,l={awb:F,imageBase64:n,focusImageBase64:n,sessionContext:t};if(!navigator.onLine){Fe(l),xe();const f={awb:F,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};X({...f,offlineQueued:!0}),G(f),m(a.SUCCESS);return}try{const c=(await Q.post("/shipments/scan-mobile",l)).data;if(c.status==="error"||!c.success){J("error"),at(),L([100,50,100]),m(a.ERROR),z(c.error||c.message||"Scan failed.");return}if(ye(c),E({clientCode:c.clientCode||"",consignee:c.consignee||"",destination:c.destination||"",pincode:c.pincode||"",weight:c.weight||0,amount:c.amount||0,orderNo:c.orderNo||""}),be({}),c.reviewRequired)m(a.REVIEWING);else{xe(),L([50,30,50]);const v={awb:c.awb,clientCode:c.clientCode,clientName:c.clientName,destination:c.destination||"",weight:c.weight||0};X(v),G(v),m(a.SUCCESS)}}catch(f){z(((o=(d=f.response)==null?void 0:d.data)==null?void 0:o.message)||"Server error. Please try again."),m(a.ERROR)}},[F,W,y,m,Fe,G]),bt=s.useCallback(async()=>{var l,d;if(!r)return;m(a.APPROVING);const t={clientCode:r.clientCode||"",clientName:r.clientName||"",consignee:r.consignee||"",destination:r.destination||""},n={clientCode:u.clientCode||"",clientName:u.clientCode||"",consignee:u.consignee||"",destination:u.destination||""};try{if(r.ocrExtracted||r)try{await Q.post("/shipments/learn-corrections",{ocrFields:t,approvedFields:n})}catch{}const o={clientCode:u.clientCode,consignee:u.consignee,destination:u.destination,pincode:u.pincode,weight:parseFloat(u.weight)||0,amount:parseFloat(u.amount)||0,orderNo:u.orderNo||""};r.shipmentId?await Q.put(`/shipments/${r.shipmentId}`,o):await Q.post("/shipments",{awb:r.awb||F,...o}),xe(),L([50,30,50]),J("success");const f={awb:(r==null?void 0:r.awb)||F,clientCode:u.clientCode,clientName:(r==null?void 0:r.clientName)||u.clientCode,destination:u.destination||"",weight:parseFloat(u.weight)||0};X(f),G(f),m(a.SUCCESS),u.clientCode&&u.clientCode!=="MISC"&&Y(c=>{var S,w;const v={...c.clientFreq};v[u.clientCode]=(v[u.clientCode]||0)+1;const C=Object.entries(v).sort((U,V)=>V[1]-U[1]);return{...c,clientFreq:v,dominantClient:((S=C[0])==null?void 0:S[1])>=2?C[0][0]:null,dominantClientCount:((w=C[0])==null?void 0:w[1])||0}})}catch(o){m(a.REVIEWING),z(((d=(l=o.response)==null?void 0:l.data)==null?void 0:d.message)||"Approval failed.")}},[r,u,F,m,G]),se=s.useCallback(()=>{clearTimeout(K.current),clearTimeout(Z.current),oe(""),ce(null),ye(null),E({}),be({}),X(null),z(""),le(""),A.current=!1,m(a.IDLE)},[m]);s.useEffect(()=>{if(x===a.SUCCESS)return K.current=setTimeout(()=>m(a.IDLE),Dt),()=>clearTimeout(K.current)},[x,m]),s.useEffect(()=>{if(me)if(x===a.REVIEWING&&r){const t=[r.clientName||r.clientCode,r.destination,r.weight?`${r.weight} kilograms`:""].filter(Boolean);t.length&&rt(t.join(". "))}else x===a.SUCCESS&&k&&rt(`${k.clientName||k.clientCode||"Shipment"} verified.`)},[me,x,r,k]),s.useEffect(()=>()=>{ne(),clearTimeout(K.current),clearTimeout(Z.current)},[ne]);const R=t=>`msp-step ${x===t?"active":""}`,D=s.useMemo(()=>{if(!r)return{};const t=r.ocrExtracted||r;return{clientCode:{confidence:(t==null?void 0:t.clientNameConfidence)||0,source:(t==null?void 0:t.clientNameSource)||null},consignee:{confidence:(t==null?void 0:t.consigneeConfidence)||0,source:(t==null?void 0:t.consigneeSource)||null},destination:{confidence:(t==null?void 0:t.destinationConfidence)||0,source:(t==null?void 0:t.destinationSource)||null},pincode:{confidence:(t==null?void 0:t.pincodeConfidence)||0,source:null},weight:{confidence:(t==null?void 0:t.weightConfidence)||0,source:null}}},[r]),h=((ze=r==null?void 0:r.ocrExtracted)==null?void 0:ze.intelligence)||(r==null?void 0:r.intelligence)||null,Re=y.scannedItems.reduce((t,n)=>t+(n.weight||0),0);return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:Mt}),e.jsxs("div",{className:"msp-root",children:[ve&&e.jsx("div",{className:`flash-overlay flash-${ve}`,onAnimationEnd:()=>J(null)}),we&&e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.92)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[e.jsx(He,{size:48,color:"white"}),e.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700},children:"DUPLICATE AWB"}),e.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:we}),e.jsx("div",{style:{color:"rgba(255,255,255,0.65)",fontSize:"0.8rem"},children:"Already scanned this session"})]}),e.jsx("div",{className:R(a.IDLE),children:e.jsxs("div",{className:"home-root",children:[e.jsxs("div",{className:"home-header",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16},children:[e.jsxs("button",{onClick:()=>g("/app"),style:{background:"white",border:"1px solid #E2E8F0",padding:"6px 12px",borderRadius:20,fontSize:"0.75rem",fontWeight:600,color:"#475569",display:"flex",alignItems:"center",gap:4,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.02)"},children:[e.jsx(jt,{size:14})," Go Back"]}),e.jsxs("div",{className:"home-logo-badge",children:[e.jsx(Qe,{size:11,color:N==="paired"&&navigator.onLine?"#10B981":"#EF4444"}),(p==null?void 0:p.name)||"Staff"]})]}),e.jsx("div",{className:"home-logo-row",children:e.jsxs("div",{className:"home-logo-text",children:[e.jsx("img",{src:"/images/logo.png",alt:"Sea Hawk Logo",style:{height:28,width:"auto",objectFit:"contain",padding:2,background:"white",borderRadius:6,border:"1px solid #E2E8F0"}}),e.jsx("span",{children:"Seahawk Scanner"})]})}),e.jsxs("div",{className:"home-stats-row",children:[e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:y.scanNumber}),e.jsx("div",{className:"home-stat-label",children:"Scanned"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:Re>0?Re.toFixed(1):"0"}),e.jsx("div",{className:"home-stat-label",children:"Total kg"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:lt}),e.jsx("div",{className:"home-stat-label",children:"Session"})]})]})]}),e.jsxs("div",{className:"home-scan-section",children:[e.jsxs("div",{className:"home-scan-btn-wrap",children:[e.jsx("div",{className:"home-scan-ring"}),e.jsx("div",{className:"home-scan-ring home-scan-ring2"}),e.jsxs("button",{id:"start-scanning-btn",className:"home-scan-btn",onClick:gt,children:[e.jsx(Xe,{size:34,color:"white"}),e.jsx("span",{className:"home-scan-btn-label",children:"Scan"})]})]}),e.jsx("div",{className:"home-cta-text",children:y.scanNumber===0?"Tap to start your first scan":"Tap to scan next parcel"}),e.jsxs("div",{className:"action-buttons-row",children:[e.jsxs("button",{className:"action-btn",onClick:ht,children:[e.jsx(Ct,{size:14})," ",b.length>0?`Upload (${b.length})`:"Synced"]}),e.jsxs("button",{className:"action-btn danger",onClick:mt,children:[e.jsx(Nt,{size:14})," End Session"]})]}),b.length>0&&e.jsxs("div",{style:{marginTop:14,fontSize:"0.7rem",color:i.warning,fontWeight:600,display:"flex",alignItems:"center",gap:5},children:[e.jsx(Je,{size:12})," ",b.length," offline scan",b.length>1?"s":""," pending sync"]})]}),e.jsxs("div",{className:"home-queue-section",children:[e.jsxs("div",{className:"home-queue-head",children:[e.jsxs("div",{className:"home-queue-title-text",children:[e.jsx(Ft,{size:11}),"Accepted Consignments"]}),y.scannedItems.length>0&&e.jsx("div",{className:"home-queue-badge",children:y.scannedItems.length})]}),e.jsx("div",{className:"home-queue-list",children:y.scannedItems.length===0?e.jsxs("div",{className:"queue-empty",children:[e.jsx(Ye,{size:36,color:"rgba(255,255,255,0.12)"}),e.jsxs("div",{className:"queue-empty-text",children:["No consignments scanned yet.",e.jsx("br",{}),"Tap the button above to begin."]})]}):y.scannedItems.map((t,n)=>e.jsxs("div",{className:"queue-item",children:[e.jsx("div",{className:"queue-check",children:e.jsx(Ke,{size:13,color:"#10B981"})}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{className:"queue-awb",children:t.awb}),e.jsxs("div",{className:"queue-meta",children:[t.clientCode==="OFFLINE"?e.jsx("span",{className:"queue-offline-tag",children:"Offline"}):t.clientCode&&e.jsx("span",{className:"queue-client-tag",children:t.clientCode}),t.destination&&e.jsx("span",{children:t.destination})]})]}),t.weight>0&&e.jsxs("div",{className:"queue-weight",children:[t.weight,"kg"]})]},`${t.awb}-${n}`))})]})]})}),e.jsx("video",{ref:j,autoPlay:!0,playsInline:!0,muted:!0,style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(x===a.SCANNING||x===a.CAPTURING)&&!T.current?"block":"none"}}),e.jsx("div",{className:R(a.SCANNING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[e.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:T.current?"block":"none"}}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{className:"scan-guide",style:{width:tt.w,height:tt.h,borderRadius:10,maxHeight:"20vw"},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"}),e.jsx("div",{className:"scan-laser"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(Qe,{size:12})," ",(p==null?void 0:p.name)||"Scanner"]}),e.jsxs("div",{className:"cam-hud-chip",style:{gap:4},children:[e.jsx(Ye,{size:12})," #",y.scanNumber+1,typeof window<"u"&&typeof window.BarcodeDetector<"u"?e.jsx("span",{style:{color:"#34D399",fontSize:"0.6rem",fontWeight:800},children:"⚡ NATIVE"}):e.jsx("span",{style:{color:"#F59E0B",fontSize:"0.6rem",fontWeight:800},children:"ZXING"})]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:"Align barcode inside the strip"}),e.jsxs("div",{style:{display:"flex",gap:12},children:[e.jsx("button",{className:"cam-hud-chip",onClick:()=>ut(t=>!t),style:{border:"none",cursor:"pointer"},children:me?e.jsx(kt,{size:14}):e.jsx(St,{size:14})}),e.jsxs("button",{className:"cam-hud-chip",onClick:se,style:{border:"none",cursor:"pointer"},children:[e.jsx(Ze,{size:14})," Cancel"]})]})]})]})}),e.jsx("div",{className:R(a.CAPTURING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!ue&&e.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[e.jsx(Et,{size:44,color:"#34D399"}),e.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:F}),e.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:"Barcode locked · Preparing camera…"})]}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{ref:he,className:`scan-guide ${de?"detected":""}`,style:{width:nt.w,height:nt.h,maxHeight:"75vh",borderRadius:12},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[e.jsx(It,{size:12})," ",F]}),b.length>0&&e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(Je,{size:12})," ",b.length," queued"]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:de?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center",transition:"color 0.3s"},children:de?"✓ AWB in frame — press shutter":"Fit the AWB slip inside the frame"}),e.jsx("button",{className:"capture-btn",onClick:xt,disabled:!ue,style:{opacity:ue?1:.4},children:e.jsx("div",{className:"capture-btn-inner"})}),e.jsx("button",{style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},onClick:()=>{oe(""),A.current=!1,m(a.SCANNING)},children:"← Rescan barcode"})]})]})}),e.jsx("div",{className:R(a.PREVIEW),children:e.jsxs("div",{style:{background:i.bg,display:"flex",flexDirection:"column",height:"100%"},children:[e.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${i.border}`},children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.72rem",color:i.muted,fontWeight:600},children:"CAPTURED"}),e.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:F})]})}),e.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:W&&e.jsx("img",{src:W,alt:"Captured label",className:"preview-img"})}),e.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{ce(null),m(a.CAPTURING)},children:[e.jsx(et,{size:16})," Retake"]}),e.jsxs("button",{className:"btn btn-primary",style:{flex:2},onClick:ft,children:[e.jsx(At,{size:16})," Use Photo"]})]})]})}),e.jsx("div",{className:R(a.PROCESSING),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16,background:i.bg},children:[e.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[e.jsx(Rt,{size:22,color:i.primary,style:{animation:"spin 2s linear infinite"}}),e.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:i.primary},children:"Intelligence Engine"})]}),e.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:i.muted},children:F}),e.jsx("div",{style:{fontSize:"0.72rem",color:i.mutedLight,marginTop:6},children:"Reading AWB label with Gemini Vision…"})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(t=>e.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:t}),e.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),e.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},t)),e.jsx("div",{style:{textAlign:"center",marginTop:8},children:e.jsx("button",{className:"btn btn-outline",style:{fontSize:"0.75rem",padding:"8px 20px"},onClick:()=>{z("Cancelled by user."),m(a.ERROR)},children:"Cancel"})})]})}),e.jsx("div",{className:R(a.REVIEWING),children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%",background:i.bg},children:[e.jsxs("div",{style:{padding:"14px 20px",borderBottom:`1px solid ${i.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.65rem",color:i.muted,fontWeight:600},children:"REVIEW EXTRACTION"}),e.jsx("div",{className:"mono",style:{fontSize:"0.95rem",fontWeight:700},children:(r==null?void 0:r.awb)||F})]}),(h==null?void 0:h.learnedFieldCount)>0&&e.jsxs("div",{className:"source-badge source-learned",children:["🧠 ",h.learnedFieldCount," auto-corrected"]})]}),e.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsxs("div",{className:`field-card ${(((Te=D.clientCode)==null?void 0:Te.confidence)||0)<.55?"warning":""}`,children:[e.jsx("div",{className:fe(((De=D.clientCode)==null?void 0:De.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((Be=D.clientCode)==null?void 0:Be.source)&&(()=>{const t=ot(D.clientCode.source);return t?e.jsxs("span",{className:t.cls,children:[t.icon," ",t.txt]}):null})()]}),e.jsx("input",{className:"field-input",value:u.clientCode||"",onChange:t=>E(n=>({...n,clientCode:t.target.value.toUpperCase()})),placeholder:"Client code"}),((Oe=h==null?void 0:h.clientMatches)==null?void 0:Oe.length)>0&&h.clientNeedsConfirmation&&e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:h.clientMatches.slice(0,3).map(t=>e.jsxs("button",{onClick:()=>E(n=>({...n,clientCode:t.code})),style:{fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:`1px solid ${i.border}`,background:u.clientCode===t.code?i.primaryLight:i.surface,color:i.text,cursor:"pointer",fontFamily:"inherit",fontWeight:500},children:[t.code," (",Math.round(t.score*100),"%)"]},t.code))})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:fe(((Me=D.consignee)==null?void 0:Me.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Consignee"}),e.jsx("input",{className:"field-input",value:u.consignee||"",onChange:t=>E(n=>({...n,consignee:t.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:fe(((Pe=D.destination)==null?void 0:Pe.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((We=D.destination)==null?void 0:We.source)&&(()=>{const t=ot(D.destination.source);return t?e.jsxs("span",{className:t.cls,children:[t.icon," ",t.txt]}):null})()]}),e.jsx("input",{className:"field-input",value:u.destination||"",onChange:t=>E(n=>({...n,destination:t.target.value.toUpperCase()})),placeholder:"City"}),(h==null?void 0:h.pincodeCity)&&h.pincodeCity!==u.destination&&e.jsxs("button",{onClick:()=>E(t=>({...t,destination:h.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:i.successLight,color:i.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["📍 Pincode suggests: ",h.pincodeCity]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Pincode"}),e.jsx("input",{className:"field-input",value:u.pincode||"",onChange:t=>E(n=>({...n,pincode:t.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),e.jsx("div",{className:`field-card ${(_e=h==null?void 0:h.weightAnomaly)!=null&&_e.anomaly?"warning":""}`,children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Weight (kg)"}),e.jsx("input",{className:"field-input",value:u.weight||"",onChange:t=>E(n=>({...n,weight:t.target.value})),placeholder:"0.0",inputMode:"decimal"}),(($e=h==null?void 0:h.weightAnomaly)==null?void 0:$e.anomaly)&&e.jsxs("div",{style:{fontSize:"0.6rem",color:i.warning,marginTop:2,fontWeight:500},children:["⚠️ ",h.weightAnomaly.warning]})]})})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Amount (₹)"}),e.jsx("input",{className:"field-input",value:u.amount||"",onChange:t=>E(n=>({...n,amount:t.target.value})),placeholder:"0",inputMode:"decimal"})]})}),e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Order No"}),e.jsx("input",{className:"field-input",value:u.orderNo||"",onChange:t=>E(n=>({...n,orderNo:t.target.value})),placeholder:"Optional"})]})})]})]}),e.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${i.border}`,display:"flex",gap:10},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:se,children:[e.jsx(Ze,{size:16})," Skip"]}),e.jsxs("button",{className:"btn btn-success btn-lg",style:{flex:2},onClick:bt,disabled:x===a.APPROVING,children:[x===a.APPROVING?e.jsx(zt,{size:16,style:{animation:"spin 1s linear infinite"}}):e.jsx(Ke,{size:16}),x===a.APPROVING?"Saving...":"Approve & Save"]})]})]})}),e.jsx("div",{className:R(a.APPROVING)}),e.jsx("div",{className:R(a.SUCCESS),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20,background:"#0F172A"},children:[e.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[e.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:i.success,strokeWidth:"3",className:"success-check-circle"}),e.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:i.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:i.success,marginBottom:4},children:"Consignment Added ✓"}),e.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700,color:"white"},children:k==null?void 0:k.awb}),(k==null?void 0:k.clientCode)&&e.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:i.primaryLight,color:i.primary,fontSize:"0.78rem",fontWeight:600},children:k.clientName||k.clientCode})]}),e.jsxs("div",{style:{fontSize:"0.72rem",color:"rgba(255,255,255,0.35)"},children:["#",y.scanNumber," scanned · Returning to home…"]}),e.jsxs("button",{className:"btn btn-primary btn-lg btn-full",style:{maxWidth:280,marginTop:4},onClick:se,children:[e.jsx(Xe,{size:18})," Scan Next"]})]})}),e.jsx("div",{className:R(a.ERROR),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20,background:i.bg},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(He,{size:32,color:i.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:i.error},children:"Scan Error"}),e.jsx("div",{style:{fontSize:"0.82rem",color:i.muted,marginTop:4},children:P})]}),e.jsxs("button",{className:"btn btn-primary",onClick:se,children:[e.jsx(et,{size:16})," Try Again"]})]})}),N==="disconnected"&&x!==a.IDLE&&e.jsxs("div",{className:"offline-banner",children:[e.jsx(Tt,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline — Reconnecting… ",b.length?`(${b.length} queued)`:""]})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{Xt as default};
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/index-4oYbt_M2.js","assets/index-D3Mz4UNV.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
