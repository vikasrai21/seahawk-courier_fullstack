import{u as bt,_ as Ve}from"./index-ICUTZYzj.js";import{j as e}from"./page-landing-Bx5c8M2c.js";import{r as s}from"./vendor-helmet-Dwc3L0SQ.js";import{a as Q}from"./page-import-KrbyjuuQ.js";import{u as yt}from"./vendor-react-DGJm5saH.js";import{b as He,aE as Qe,aK as Xe,d as Je,a0 as vt,z as Ye,aJ as Ke,aF as wt,aG as jt,X as Ze,au as Nt,aH as Ct,aI as et,O as kt,ax as St,R as Et,aD as It}from"./vendor-icons-o7elvlXJ.js";import"./page-reconcile-p5UREp47.js";import"./page-rate-calc-_eH7d9Js.js";const tt={w:"90vw",h:"18vw"},nt={w:"92vw",h:"130vw"},Rt=1800,At="mobile_scanner_offline_queue",Ft=80,st=["code_128","code_39","code_93","codabar","ean_13","ean_8","itf","qr_code"],a={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"},L=f=>{var m;try{(m=navigator==null?void 0:navigator.vibrate)==null||m.call(navigator,f)}catch{}},ie=(f,m,O="sine")=>{try{const E=new(window.AudioContext||window.webkitAudioContext),B=E.createOscillator(),P=E.createGain();B.type=O,B.frequency.setValueAtTime(f,E.currentTime),P.gain.setValueAtTime(.12,E.currentTime),P.gain.exponentialRampToValueAtTime(.01,E.currentTime+m),B.connect(P),P.connect(E.destination),B.start(),B.stop(E.currentTime+m)}catch{}},ge=()=>{ie(880,.12),setTimeout(()=>ie(1100,.1),130)},it=()=>ie(600,.08),at=()=>ie(200,.25,"sawtooth"),rt=f=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const m=new SpeechSynthesisUtterance(f);m.rate=1.2,m.pitch=1,m.lang="en-IN",window.speechSynthesis.speak(m)}catch{}},i={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",mutedLight:"#9CA3AF",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},zt=`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');

.msp-root {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: #0F172A; color: ${i.text};
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
  background: #0F172A;
}

/* ── Header ── */
.home-header {
  background: linear-gradient(135deg, #1E3A8A 0%, #3730A3 55%, #4F46E5 100%);
  padding: 20px 20px 36px; position: relative; overflow: hidden;
}
.home-header::before {
  content: ''; position: absolute; top: -40px; right: -40px;
  width: 180px; height: 180px; border-radius: 50%;
  background: rgba(255,255,255,0.05);
}
.home-header::after {
  content: ''; position: absolute;
  bottom: -22px; left: 0; right: 0; height: 44px;
  background: #0F172A;
  border-radius: 60% 60% 0 0 / 22px 22px 0 0;
}
.home-logo-row {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px;
}
.home-logo-text {
  font-size: 1.08rem; font-weight: 800; color: white; letter-spacing: -0.01em;
  display: flex; align-items: center; gap: 8px;
}
.home-logo-badge {
  background: rgba(255,255,255,0.15); backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.2); border-radius: 20px;
  padding: 5px 12px; font-size: 0.72rem; font-weight: 600; color: rgba(255,255,255,0.92);
  display: flex; align-items: center; gap: 5px;
}
.home-stats-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.home-stat-card {
  background: rgba(255,255,255,0.1); backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.15); border-radius: 12px;
  padding: 11px 10px; text-align: center;
}
.home-stat-val { font-size: 1.3rem; font-weight: 800; color: white; line-height: 1; }
.home-stat-label { font-size: 0.58rem; font-weight: 600; color: rgba(255,255,255,0.55); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 3px; }

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
  box-shadow: 0 8px 36px rgba(79,70,229,0.55), 0 0 0 6px rgba(79,70,229,0.12);
  transition: transform 0.15s, box-shadow 0.15s;
  position: relative; z-index: 1;
}
.home-scan-btn:active { transform: scale(0.93); box-shadow: 0 4px 18px rgba(79,70,229,0.4); }
.home-scan-btn-label { font-size: 0.6rem; font-weight: 800; color: white; text-transform: uppercase; letter-spacing: 0.06em; }
.home-cta-text { font-size: 0.82rem; color: rgba(255,255,255,0.5); font-weight: 500; }

/* ── Queue ── */
.home-queue-section {
  flex: 1; background: #1E293B; border-radius: 20px 20px 0 0;
  overflow: hidden; display: flex; flex-direction: column; min-height: 280px;
}
.home-queue-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px 12px; border-bottom: 1px solid rgba(255,255,255,0.06);
}
.home-queue-title-text {
  font-size: 0.65rem; font-weight: 700; color: rgba(255,255,255,0.45);
  text-transform: uppercase; letter-spacing: 0.08em;
  display: flex; align-items: center; gap: 6px;
}
.home-queue-badge {
  font-size: 0.65rem; font-weight: 700;
  background: rgba(79,70,229,0.28); color: #818CF8;
  padding: 2px 9px; border-radius: 10px;
}
.home-queue-list { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; }

@keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
.queue-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.04);
  animation: slideIn 0.3s ease-out;
}
.queue-item:active { background: rgba(255,255,255,0.04); }
.queue-check {
  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
  background: rgba(5,150,105,0.18); border: 1.5px solid rgba(16,185,129,0.4);
  display: flex; align-items: center; justify-content: center;
}
.queue-awb { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; font-weight: 600; color: white; }
.queue-meta { font-size: 0.64rem; color: rgba(255,255,255,0.4); margin-top: 2px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.queue-client-tag { background: rgba(79,70,229,0.22); color: #818CF8; padding: 1px 6px; border-radius: 4px; }
.queue-offline-tag { background: rgba(217,119,6,0.22); color: #FBBF24; padding: 1px 6px; border-radius: 4px; }
.queue-weight { font-size: 0.72rem; font-weight: 700; color: rgba(99,102,241,0.85); margin-left: auto; flex-shrink: 0; }
.queue-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 44px 20px; gap: 12px; }
.queue-empty-text { font-size: 0.8rem; color: rgba(255,255,255,0.28); font-weight: 500; text-align: center; line-height: 1.5; }
`,Tt=f=>f>=.85?"high":f>=.55?"med":"low",xe=f=>`conf-dot conf-${Tt(f)}`,ot=f=>f==="learned"?{cls:"source-badge source-learned",icon:"🧠",txt:"Learned"}:f==="fuzzy_match"?{cls:"source-badge source-ai",icon:"🔍",txt:"Matched"}:["fuzzy_history","consignee_pattern"].includes(f)?{cls:"source-badge source-history",icon:"📊",txt:"History"}:["delhivery_pincode","india_post","pincode_lookup","indiapost_lookup"].includes(f)?{cls:"source-badge source-pincode",icon:"📍",txt:"Pincode"}:null,Dt=f=>{const m=Math.floor(f/6e4);return m<60?`${m}m`:`${Math.floor(m/60)}h ${m%60}m`};function Gt(){var ze,Te,De,Oe,Be,Me,Pe,We,_e,$e;const f=yt(),{user:m}=bt(),O=`${At}:direct`,[E,B]=s.useState("paired"),[P,z]=s.useState(""),[g,ct]=s.useState(a.IDLE),[C,ae]=s.useState(""),[W,re]=s.useState(null),[Ot,fe]=s.useState({}),[r,be]=s.useState(null),[u,I]=s.useState({}),[k,X]=s.useState(null),[ye,J]=s.useState(null),[ve,oe]=s.useState(""),[N,we]=s.useState([]),[ce,je]=s.useState(!1),[le,de]=s.useState(!1),[lt,dt]=s.useState("0m"),[b,ue]=s.useState({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now(),scannedItems:[]}),[me,ut]=s.useState(!1),w=s.useRef(null),he=s.useRef(null),R=s.useRef(null),T=s.useRef(null),A=s.useRef(!1),Y=s.useRef(null),mt=s.useRef(!1),q=s.useRef(a.IDLE),K=s.useRef(null),M=s.useRef(null),Ne=s.useRef(new Set);s.useEffect(()=>{const t=setInterval(()=>dt(Dt(Date.now()-b.startedAt)),3e4);return()=>clearInterval(t)},[b.startedAt]);const Z=s.useCallback(t=>{we(t);try{t.length?localStorage.setItem(O,JSON.stringify(t)):localStorage.removeItem(O)}catch{}},[O]),Ce=s.useCallback(t=>{const n={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:t};return Z([...N,n]),n},[N,Z]),ke=s.useCallback(async()=>{var t,n;if(!(!N.length||!navigator.onLine)){for(const l of N)if(!(!((t=l==null?void 0:l.payload)!=null&&t.awb)||!((n=l==null?void 0:l.payload)!=null&&n.imageBase64)))try{await Q.post("/shipments/scan-mobile",l.payload)}catch{}Z([])}},[N,Z]),h=s.useCallback(t=>ct(t),[]);s.useEffect(()=>{q.current=g},[g]),s.useEffect(()=>{if(!m){f("/");return}B("paired")},[m,f]),s.useEffect(()=>{try{const t=localStorage.getItem(O);if(!t)return;const n=JSON.parse(t);Array.isArray(n)&&n.length&&we(n)}catch{}},[O]),s.useEffect(()=>{E==="paired"&&N.length&&ke()},[E,N.length,ke]);const ee=s.useCallback(async()=>{var t,n;try{if(de(!1),T.current){try{await((t=T.current.barcodeScanner)==null?void 0:t.dispose())}catch{}T.current=null}if(R.current){try{await R.current.reset()}catch{}R.current=null}(n=w.current)!=null&&n.srcObject&&(w.current.srcObject.getTracks().forEach(l=>l.stop()),w.current.srcObject=null)}catch{}},[]),_=s.useCallback(async()=>{var t;try{if(T.current){try{await((t=T.current.barcodeScanner)==null?void 0:t.dispose())}catch{}T.current=null}if(R.current){try{R.current._type==="native"?R.current.reset():await R.current.reset()}catch{}R.current=null}}catch{}},[]),Se=s.useCallback(async()=>{if(w.current){await _();try{if(!w.current.srcObject){let o;try{o=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{o=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}w.current.srcObject=o,await w.current.play()}if(typeof window.BarcodeDetector<"u"){let o=st;try{const j=await window.BarcodeDetector.getSupportedFormats();o=st.filter(S=>j.includes(S))||o}catch{}const x=new window.BarcodeDetector({formats:o});let c=null;const y=async()=>{var S;if(A.current||q.current!==a.SCANNING)return;const j=w.current;if(!j||j.readyState<2){c=requestAnimationFrame(y);return}try{const v=await x.detect(j);v.length&&v[0].rawValue&&((S=M.current)==null||S.call(M,v[0].rawValue))}catch{}q.current===a.SCANNING&&(c=requestAnimationFrame(()=>setTimeout(y,15)))};R.current={_type:"native",reset:()=>{c&&cancelAnimationFrame(c),c=null}},setTimeout(y,300);return}const[{BrowserMultiFormatReader:t},n]=await Promise.all([Ve(()=>import("./index-4oYbt_M2.js"),__vite__mapDeps([0,1])),Ve(()=>import("./index-D3Mz4UNV.js"),__vite__mapDeps([]))]),l=new Map([[n.DecodeHintType.POSSIBLE_FORMATS,[n.BarcodeFormat.CODE_128,n.BarcodeFormat.ITF,n.BarcodeFormat.CODE_39,n.BarcodeFormat.CODE_93,n.BarcodeFormat.CODABAR,n.BarcodeFormat.EAN_13,n.BarcodeFormat.EAN_8]],[n.DecodeHintType.TRY_HARDER,!0],[n.DecodeHintType.CHARACTER_SET,"UTF-8"]]),d=new t(l,80);R.current=d,d.decodeFromVideoElement(w.current,o=>{var x;!A.current&&o&&((x=M.current)==null||x.call(M,o.getText()))})}catch(t){z("Camera access failed: "+t.message)}}},[_]),Ee=s.useCallback(t=>{const n=String(t||"").trim().replace(/\s+/g,"").toUpperCase();if(!(!n||n.length<6||A.current||q.current!==a.SCANNING)){if(A.current=!0,Ne.current.has(n)){L([100,50,100,50,100]),at(),oe(n),setTimeout(()=>{oe(""),A.current=!1},2500);return}clearTimeout(K.current),L([50]),it(),ae(n),ue(l=>{const d={...l,scanNumber:l.scanNumber+1,scannedAwbs:new Set(l.scannedAwbs)};return d.scannedAwbs.add(n),Ne.current=d.scannedAwbs,d}),K.current=setTimeout(()=>{q.current===a.SCANNING&&h(a.CAPTURING)},Ft)}},[h]);s.useEffect(()=>{M.current=Ee},[Ee]),s.useEffect(()=>(g===a.SCANNING&&(A.current=!1,Se()),()=>{g===a.SCANNING&&_()}),[g,Se,_]);const ht=s.useCallback(()=>{h(a.SCANNING)},[h]),Ie=s.useCallback(async()=>{var t;await _();try{if((t=w.current)!=null&&t.srcObject){de(!0);return}const n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}});w.current&&(w.current.srcObject=n,await w.current.play(),de(!0))}catch(n){z("Camera access failed: "+n.message)}},[_]);s.useEffect(()=>{g===a.CAPTURING&&Ie()},[g,Ie]),s.useEffect(()=>{if(g!==a.CAPTURING){je(!1),mt.current=!1;return}const t=setInterval(()=>{const n=w.current,l=he.current;if(!n||!l||!n.videoWidth)return;const d=n.getBoundingClientRect(),o=l.getBoundingClientRect(),x=n.videoWidth/Math.max(d.width,1),c=n.videoHeight/Math.max(d.height,1),y=Math.max(0,Math.floor((o.left-d.left)*x)),j=Math.max(0,Math.floor((o.top-d.top)*c)),S=Math.max(24,Math.floor(o.width*x)),v=Math.max(24,Math.floor(o.height*c)),U=document.createElement("canvas");U.width=96,U.height=72;const V=U.getContext("2d",{willReadFrequently:!0});if(!V)return;V.drawImage(n,y,j,Math.min(S,n.videoWidth-y),Math.min(v,n.videoHeight-j),0,0,96,72);const ne=V.getImageData(0,0,96,72).data;let Le=0,qe=0,Ge=0,Ue=0;for(let $=0;$<ne.length;$+=4){const H=.2126*ne[$]+.7152*ne[$+1]+.0722*ne[$+2];Le+=H,qe+=H*H,$>0&&Math.abs(H-Ue)>26&&Ge++,Ue=H}const pe=96*72,se=Le/pe,ft=Math.sqrt(Math.max(0,qe/pe-se*se));je(se>35&&se<225&&ft>24&&Ge/pe>.12)},320);return()=>clearInterval(t)},[g]);const Re=s.useCallback(t=>{try{const n=t.getContext("2d",{willReadFrequently:!0});if(!n)return;const l=n.getImageData(0,0,t.width,t.height),d=l.data;for(let o=0;o<d.length;o+=4){const x=.299*d[o]+.587*d[o+1]+.114*d[o+2],c=Math.min(255,Math.max(0,(x-127)*1.45+127));d[o]=d[o+1]=d[o+2]=c}n.putImageData(l,0,0)}catch{}},[]),Ae=s.useCallback(()=>{const t=w.current,n=he.current;if(!t||!n||!t.videoWidth)return null;const l=t.getBoundingClientRect(),d=n.getBoundingClientRect(),o=t.videoWidth/l.width,x=t.videoHeight/l.height,c=Math.max(0,(d.left-l.left)*o),y=Math.max(0,(d.top-l.top)*x),j=Math.min(t.videoWidth-c,d.width*o),S=Math.min(t.videoHeight-y,d.height*x),v=document.createElement("canvas");return v.width=Math.min(1200,Math.round(j)),v.height=Math.round(v.width/j*S),v.getContext("2d").drawImage(t,c,y,j,S,0,0,v.width,v.height),Re(v),v.toDataURL("image/jpeg",.82).split(",")[1]||null},[Re]),pt=s.useCallback(()=>{J("white"),it(),L([30]);const t=Ae();if(!t){z("Could not capture image. Try again."),A.current=!1;return}re(`data:image/jpeg;base64,${t}`),ee(),h(a.PREVIEW)},[Ae,ee,h]),G=s.useCallback(t=>{ue(n=>({...n,scannedItems:[{...t,time:Date.now()},...n.scannedItems]}))},[]),gt=s.useCallback(async()=>{var d,o;if(!C||!W)return;h(a.PROCESSING);const t={scanNumber:b.scanNumber,recentClient:b.dominantClient,dominantClient:b.dominantClient,dominantClientCount:b.dominantClientCount,sessionDurationMin:Math.round((Date.now()-b.startedAt)/6e4)},n=W.split(",")[1]||W,l={awb:C,imageBase64:n,focusImageBase64:n,sessionContext:t};if(!navigator.onLine){Ce(l),ge();const x={awb:C,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};X({...x,offlineQueued:!0}),G(x),h(a.SUCCESS);return}try{const c=(await Q.post("/shipments/scan-mobile",l)).data;if(c.status==="error"||!c.success){J("error"),at(),L([100,50,100]),h(a.ERROR),z(c.error||c.message||"Scan failed.");return}if(be(c),I({clientCode:c.clientCode||"",consignee:c.consignee||"",destination:c.destination||"",pincode:c.pincode||"",weight:c.weight||0,amount:c.amount||0,orderNo:c.orderNo||""}),fe({}),c.reviewRequired)h(a.REVIEWING);else{ge(),L([50,30,50]);const y={awb:c.awb,clientCode:c.clientCode,clientName:c.clientName,destination:c.destination||"",weight:c.weight||0};X(y),G(y),h(a.SUCCESS)}}catch(x){z(((o=(d=x.response)==null?void 0:d.data)==null?void 0:o.message)||"Server error. Please try again."),h(a.ERROR)}},[C,W,b,h,Ce,G]),xt=s.useCallback(async()=>{var l,d;if(!r)return;h(a.APPROVING);const t={clientCode:r.clientCode||"",clientName:r.clientName||"",consignee:r.consignee||"",destination:r.destination||""},n={clientCode:u.clientCode||"",clientName:u.clientCode||"",consignee:u.consignee||"",destination:u.destination||""};try{if(r.ocrExtracted||r)try{await Q.post("/shipments/learn-corrections",{ocrFields:t,approvedFields:n})}catch{}const o={clientCode:u.clientCode,consignee:u.consignee,destination:u.destination,pincode:u.pincode,weight:parseFloat(u.weight)||0,amount:parseFloat(u.amount)||0,orderNo:u.orderNo||""};r.shipmentId?await Q.put(`/shipments/${r.shipmentId}`,o):await Q.post("/shipments",{awb:r.awb||C,...o}),ge(),L([50,30,50]),J("success");const x={awb:(r==null?void 0:r.awb)||C,clientCode:u.clientCode,clientName:(r==null?void 0:r.clientName)||u.clientCode,destination:u.destination||"",weight:parseFloat(u.weight)||0};X(x),G(x),h(a.SUCCESS),u.clientCode&&u.clientCode!=="MISC"&&ue(c=>{var S,v;const y={...c.clientFreq};y[u.clientCode]=(y[u.clientCode]||0)+1;const j=Object.entries(y).sort((U,V)=>V[1]-U[1]);return{...c,clientFreq:y,dominantClient:((S=j[0])==null?void 0:S[1])>=2?j[0][0]:null,dominantClientCount:((v=j[0])==null?void 0:v[1])||0}})}catch(o){h(a.REVIEWING),z(((d=(l=o.response)==null?void 0:l.data)==null?void 0:d.message)||"Approval failed.")}},[r,u,C,h,G]),te=s.useCallback(()=>{clearTimeout(Y.current),clearTimeout(K.current),ae(""),re(null),be(null),I({}),fe({}),X(null),z(""),oe(""),A.current=!1,h(a.IDLE)},[h]);s.useEffect(()=>{if(g===a.SUCCESS)return Y.current=setTimeout(()=>h(a.IDLE),Rt),()=>clearTimeout(Y.current)},[g,h]),s.useEffect(()=>{if(me)if(g===a.REVIEWING&&r){const t=[r.clientName||r.clientCode,r.destination,r.weight?`${r.weight} kilograms`:""].filter(Boolean);t.length&&rt(t.join(". "))}else g===a.SUCCESS&&k&&rt(`${k.clientName||k.clientCode||"Shipment"} verified.`)},[me,g,r,k]),s.useEffect(()=>()=>{ee(),clearTimeout(Y.current),clearTimeout(K.current)},[ee]);const F=t=>`msp-step ${g===t?"active":""}`,D=s.useMemo(()=>{if(!r)return{};const t=r.ocrExtracted||r;return{clientCode:{confidence:(t==null?void 0:t.clientNameConfidence)||0,source:(t==null?void 0:t.clientNameSource)||null},consignee:{confidence:(t==null?void 0:t.consigneeConfidence)||0,source:(t==null?void 0:t.consigneeSource)||null},destination:{confidence:(t==null?void 0:t.destinationConfidence)||0,source:(t==null?void 0:t.destinationSource)||null},pincode:{confidence:(t==null?void 0:t.pincodeConfidence)||0,source:null},weight:{confidence:(t==null?void 0:t.weightConfidence)||0,source:null}}},[r]),p=((ze=r==null?void 0:r.ocrExtracted)==null?void 0:ze.intelligence)||(r==null?void 0:r.intelligence)||null,Fe=b.scannedItems.reduce((t,n)=>t+(n.weight||0),0);return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:zt}),e.jsxs("div",{className:"msp-root",children:[ye&&e.jsx("div",{className:`flash-overlay flash-${ye}`,onAnimationEnd:()=>J(null)}),ve&&e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.92)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[e.jsx(He,{size:48,color:"white"}),e.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700},children:"DUPLICATE AWB"}),e.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:ve}),e.jsx("div",{style:{color:"rgba(255,255,255,0.65)",fontSize:"0.8rem"},children:"Already scanned this session"})]}),e.jsx("div",{className:F(a.IDLE),children:e.jsxs("div",{className:"home-root",children:[e.jsxs("div",{className:"home-header",children:[e.jsxs("div",{className:"home-logo-row",children:[e.jsxs("div",{className:"home-logo-text",children:["🦅 ",e.jsx("span",{children:"Seahawk Scanner"})]}),e.jsxs("div",{className:"home-logo-badge",children:[e.jsx(Qe,{size:11}),(m==null?void 0:m.name)||"Staff"]})]}),e.jsxs("div",{className:"home-stats-row",children:[e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:b.scanNumber}),e.jsx("div",{className:"home-stat-label",children:"Scanned"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:Fe>0?Fe.toFixed(1):"0"}),e.jsx("div",{className:"home-stat-label",children:"Total kg"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:lt}),e.jsx("div",{className:"home-stat-label",children:"Session"})]})]})]}),e.jsxs("div",{className:"home-scan-section",children:[e.jsxs("div",{className:"home-scan-btn-wrap",children:[e.jsx("div",{className:"home-scan-ring"}),e.jsx("div",{className:"home-scan-ring home-scan-ring2"}),e.jsxs("button",{id:"start-scanning-btn",className:"home-scan-btn",onClick:ht,children:[e.jsx(Xe,{size:34,color:"white"}),e.jsx("span",{className:"home-scan-btn-label",children:"Scan"})]})]}),e.jsx("div",{className:"home-cta-text",children:b.scanNumber===0?"Tap to start your first scan":"Tap to scan next parcel"}),N.length>0&&e.jsxs("div",{style:{marginTop:10,fontSize:"0.7rem",color:i.warning,fontWeight:600,display:"flex",alignItems:"center",gap:5},children:[e.jsx(Je,{size:12})," ",N.length," offline scan",N.length>1?"s":""," pending sync"]})]}),e.jsxs("div",{className:"home-queue-section",children:[e.jsxs("div",{className:"home-queue-head",children:[e.jsxs("div",{className:"home-queue-title-text",children:[e.jsx(vt,{size:11}),"Accepted Consignments"]}),b.scannedItems.length>0&&e.jsx("div",{className:"home-queue-badge",children:b.scannedItems.length})]}),e.jsx("div",{className:"home-queue-list",children:b.scannedItems.length===0?e.jsxs("div",{className:"queue-empty",children:[e.jsx(Ye,{size:36,color:"rgba(255,255,255,0.12)"}),e.jsxs("div",{className:"queue-empty-text",children:["No consignments scanned yet.",e.jsx("br",{}),"Tap the button above to begin."]})]}):b.scannedItems.map((t,n)=>e.jsxs("div",{className:"queue-item",children:[e.jsx("div",{className:"queue-check",children:e.jsx(Ke,{size:13,color:"#10B981"})}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{className:"queue-awb",children:t.awb}),e.jsxs("div",{className:"queue-meta",children:[t.clientCode==="OFFLINE"?e.jsx("span",{className:"queue-offline-tag",children:"Offline"}):t.clientCode&&e.jsx("span",{className:"queue-client-tag",children:t.clientCode}),t.destination&&e.jsx("span",{children:t.destination})]})]}),t.weight>0&&e.jsxs("div",{className:"queue-weight",children:[t.weight,"kg"]})]},`${t.awb}-${n}`))})]})]})}),e.jsx("video",{ref:w,autoPlay:!0,playsInline:!0,muted:!0,style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(g===a.SCANNING||g===a.CAPTURING)&&!T.current?"block":"none"}}),e.jsx("div",{className:F(a.SCANNING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[e.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:T.current?"block":"none"}}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{className:"scan-guide",style:{width:tt.w,height:tt.h,borderRadius:10,maxHeight:"20vw"},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"}),e.jsx("div",{className:"scan-laser"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(Qe,{size:12})," ",(m==null?void 0:m.name)||"Scanner"]}),e.jsxs("div",{className:"cam-hud-chip",style:{gap:4},children:[e.jsx(Ye,{size:12})," #",b.scanNumber+1,typeof window<"u"&&typeof window.BarcodeDetector<"u"?e.jsx("span",{style:{color:"#34D399",fontSize:"0.6rem",fontWeight:800},children:"⚡ NATIVE"}):e.jsx("span",{style:{color:"#F59E0B",fontSize:"0.6rem",fontWeight:800},children:"ZXING"})]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:"Align barcode inside the strip"}),e.jsxs("div",{style:{display:"flex",gap:12},children:[e.jsx("button",{className:"cam-hud-chip",onClick:()=>ut(t=>!t),style:{border:"none",cursor:"pointer"},children:me?e.jsx(wt,{size:14}):e.jsx(jt,{size:14})}),e.jsxs("button",{className:"cam-hud-chip",onClick:te,style:{border:"none",cursor:"pointer"},children:[e.jsx(Ze,{size:14})," Cancel"]})]})]})]})}),e.jsx("div",{className:F(a.CAPTURING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!le&&e.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[e.jsx(Nt,{size:44,color:"#34D399"}),e.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:C}),e.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:"Barcode locked · Preparing camera…"})]}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{ref:he,className:`scan-guide ${ce?"detected":""}`,style:{width:nt.w,height:nt.h,maxHeight:"75vh",borderRadius:12},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[e.jsx(Ct,{size:12})," ",C]}),N.length>0&&e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(Je,{size:12})," ",N.length," queued"]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:ce?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center",transition:"color 0.3s"},children:ce?"✓ AWB in frame — press shutter":"Fit the AWB slip inside the frame"}),e.jsx("button",{className:"capture-btn",onClick:pt,disabled:!le,style:{opacity:le?1:.4},children:e.jsx("div",{className:"capture-btn-inner"})}),e.jsx("button",{style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},onClick:()=>{ae(""),A.current=!1,h(a.SCANNING)},children:"← Rescan barcode"})]})]})}),e.jsx("div",{className:F(a.PREVIEW),children:e.jsxs("div",{style:{background:i.bg,display:"flex",flexDirection:"column",height:"100%"},children:[e.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${i.border}`},children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.72rem",color:i.muted,fontWeight:600},children:"CAPTURED"}),e.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:C})]})}),e.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:W&&e.jsx("img",{src:W,alt:"Captured label",className:"preview-img"})}),e.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{re(null),h(a.CAPTURING)},children:[e.jsx(et,{size:16})," Retake"]}),e.jsxs("button",{className:"btn btn-primary",style:{flex:2},onClick:gt,children:[e.jsx(kt,{size:16})," Use Photo"]})]})]})}),e.jsx("div",{className:F(a.PROCESSING),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16,background:i.bg},children:[e.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[e.jsx(St,{size:22,color:i.primary,style:{animation:"spin 2s linear infinite"}}),e.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:i.primary},children:"Intelligence Engine"})]}),e.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:i.muted},children:C}),e.jsx("div",{style:{fontSize:"0.72rem",color:i.mutedLight,marginTop:6},children:"Reading AWB label with Gemini Vision…"})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(t=>e.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:t}),e.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),e.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},t)),e.jsx("div",{style:{textAlign:"center",marginTop:8},children:e.jsx("button",{className:"btn btn-outline",style:{fontSize:"0.75rem",padding:"8px 20px"},onClick:()=>{z("Cancelled by user."),h(a.ERROR)},children:"Cancel"})})]})}),e.jsx("div",{className:F(a.REVIEWING),children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%",background:i.bg},children:[e.jsxs("div",{style:{padding:"14px 20px",borderBottom:`1px solid ${i.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.65rem",color:i.muted,fontWeight:600},children:"REVIEW EXTRACTION"}),e.jsx("div",{className:"mono",style:{fontSize:"0.95rem",fontWeight:700},children:(r==null?void 0:r.awb)||C})]}),(p==null?void 0:p.learnedFieldCount)>0&&e.jsxs("div",{className:"source-badge source-learned",children:["🧠 ",p.learnedFieldCount," auto-corrected"]})]}),e.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsxs("div",{className:`field-card ${(((Te=D.clientCode)==null?void 0:Te.confidence)||0)<.55?"warning":""}`,children:[e.jsx("div",{className:xe(((De=D.clientCode)==null?void 0:De.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((Oe=D.clientCode)==null?void 0:Oe.source)&&(()=>{const t=ot(D.clientCode.source);return t?e.jsxs("span",{className:t.cls,children:[t.icon," ",t.txt]}):null})()]}),e.jsx("input",{className:"field-input",value:u.clientCode||"",onChange:t=>I(n=>({...n,clientCode:t.target.value.toUpperCase()})),placeholder:"Client code"}),((Be=p==null?void 0:p.clientMatches)==null?void 0:Be.length)>0&&p.clientNeedsConfirmation&&e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:p.clientMatches.slice(0,3).map(t=>e.jsxs("button",{onClick:()=>I(n=>({...n,clientCode:t.code})),style:{fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:`1px solid ${i.border}`,background:u.clientCode===t.code?i.primaryLight:i.surface,color:i.text,cursor:"pointer",fontFamily:"inherit",fontWeight:500},children:[t.code," (",Math.round(t.score*100),"%)"]},t.code))})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:xe(((Me=D.consignee)==null?void 0:Me.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Consignee"}),e.jsx("input",{className:"field-input",value:u.consignee||"",onChange:t=>I(n=>({...n,consignee:t.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:xe(((Pe=D.destination)==null?void 0:Pe.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((We=D.destination)==null?void 0:We.source)&&(()=>{const t=ot(D.destination.source);return t?e.jsxs("span",{className:t.cls,children:[t.icon," ",t.txt]}):null})()]}),e.jsx("input",{className:"field-input",value:u.destination||"",onChange:t=>I(n=>({...n,destination:t.target.value.toUpperCase()})),placeholder:"City"}),(p==null?void 0:p.pincodeCity)&&p.pincodeCity!==u.destination&&e.jsxs("button",{onClick:()=>I(t=>({...t,destination:p.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:i.successLight,color:i.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["📍 Pincode suggests: ",p.pincodeCity]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Pincode"}),e.jsx("input",{className:"field-input",value:u.pincode||"",onChange:t=>I(n=>({...n,pincode:t.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),e.jsx("div",{className:`field-card ${(_e=p==null?void 0:p.weightAnomaly)!=null&&_e.anomaly?"warning":""}`,children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Weight (kg)"}),e.jsx("input",{className:"field-input",value:u.weight||"",onChange:t=>I(n=>({...n,weight:t.target.value})),placeholder:"0.0",inputMode:"decimal"}),(($e=p==null?void 0:p.weightAnomaly)==null?void 0:$e.anomaly)&&e.jsxs("div",{style:{fontSize:"0.6rem",color:i.warning,marginTop:2,fontWeight:500},children:["⚠️ ",p.weightAnomaly.warning]})]})})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Amount (₹)"}),e.jsx("input",{className:"field-input",value:u.amount||"",onChange:t=>I(n=>({...n,amount:t.target.value})),placeholder:"0",inputMode:"decimal"})]})}),e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Order No"}),e.jsx("input",{className:"field-input",value:u.orderNo||"",onChange:t=>I(n=>({...n,orderNo:t.target.value})),placeholder:"Optional"})]})})]})]}),e.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${i.border}`,display:"flex",gap:10},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:te,children:[e.jsx(Ze,{size:16})," Skip"]}),e.jsxs("button",{className:"btn btn-success btn-lg",style:{flex:2},onClick:xt,disabled:g===a.APPROVING,children:[g===a.APPROVING?e.jsx(Et,{size:16,style:{animation:"spin 1s linear infinite"}}):e.jsx(Ke,{size:16}),g===a.APPROVING?"Saving...":"Approve & Save"]})]})]})}),e.jsx("div",{className:F(a.APPROVING)}),e.jsx("div",{className:F(a.SUCCESS),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20,background:"#0F172A"},children:[e.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[e.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:i.success,strokeWidth:"3",className:"success-check-circle"}),e.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:i.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:i.success,marginBottom:4},children:"Consignment Added ✓"}),e.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700,color:"white"},children:k==null?void 0:k.awb}),(k==null?void 0:k.clientCode)&&e.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:i.primaryLight,color:i.primary,fontSize:"0.78rem",fontWeight:600},children:k.clientName||k.clientCode})]}),e.jsxs("div",{style:{fontSize:"0.72rem",color:"rgba(255,255,255,0.35)"},children:["#",b.scanNumber," scanned · Returning to home…"]}),e.jsxs("button",{className:"btn btn-primary btn-lg btn-full",style:{maxWidth:280,marginTop:4},onClick:te,children:[e.jsx(Xe,{size:18})," Scan Next"]})]})}),e.jsx("div",{className:F(a.ERROR),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20,background:i.bg},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(He,{size:32,color:i.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:i.error},children:"Scan Error"}),e.jsx("div",{style:{fontSize:"0.82rem",color:i.muted,marginTop:4},children:P})]}),e.jsxs("button",{className:"btn btn-primary",onClick:te,children:[e.jsx(et,{size:16})," Try Again"]})]})}),E==="disconnected"&&g!==a.IDLE&&e.jsxs("div",{className:"offline-banner",children:[e.jsx(It,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline — Reconnecting… ",N.length?`(${N.length} queued)`:""]})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{Gt as default};
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/index-4oYbt_M2.js","assets/index-D3Mz4UNV.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
