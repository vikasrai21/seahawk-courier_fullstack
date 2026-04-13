import{u as St,_ as Ze}from"./index-CKAsCF5A.js";import{j as e}from"./page-landing-Bx5c8M2c.js";import{r as s}from"./vendor-helmet-Dwc3L0SQ.js";import{a as X}from"./page-import-Byp047Mt.js";import{n as Et}from"./barcode-DjYGNBFy.js";import{u as Rt}from"./vendor-react-DGJm5saH.js";import{b as et,V as At,aJ as tt,aK as nt,aL as It,a8 as zt,d as st,a3 as Tt,z as it,aM as at,aN as Dt,aO as Bt,X as rt,az as Ot,aP as Mt,aQ as ot,O as Wt,aE as _t,R as Pt,aR as Lt}from"./vendor-icons-Cg7sz5U9.js";import"./page-reconcile-Bs-3AEtA.js";import"./page-rate-calc-AsTyobaA.js";const ct={w:"90vw",h:"18vw"},oe={w:"92vw",h:"130vw"},$t=1800,qt="mobile_scanner_offline_queue",Gt=80,Ce=90,lt=["code_128","code_39","code_93","codabar","ean_13","ean_8","itf","qr_code"],Ut=!0,a={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"},_=x=>{var p;try{(p=navigator==null?void 0:navigator.vibrate)==null||p.call(navigator,x)}catch{}},ce=(x,p,B="sine")=>{try{const j=new(window.AudioContext||window.webkitAudioContext),O=j.createOscillator(),P=j.createGain();O.type=B,O.frequency.setValueAtTime(x,j.currentTime),P.gain.setValueAtTime(.12,j.currentTime),P.gain.exponentialRampToValueAtTime(.01,j.currentTime+p),O.connect(P),P.connect(j.destination),O.start(),O.stop(j.currentTime+p)}catch{}},je=()=>{ce(880,.12),setTimeout(()=>ce(1100,.1),130)},dt=()=>ce(600,.08),ut=()=>ce(200,.25,"sawtooth"),mt=x=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const p=new SpeechSynthesisUtterance(x);p.rate=1.2,p.pitch=1,p.lang="en-IN",window.speechSynthesis.speak(p)}catch{}},i={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",mutedLight:"#9CA3AF",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},Vt=`
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
`,Ht=x=>x>=.85?"high":x>=.55?"med":"low",Ne=x=>`conf-dot conf-${Ht(x)}`,pt=x=>x==="learned"?{cls:"source-badge source-learned",icon:"🧠",txt:"Learned"}:x==="fuzzy_match"?{cls:"source-badge source-ai",icon:"🔍",txt:"Matched"}:["fuzzy_history","consignee_pattern"].includes(x)?{cls:"source-badge source-history",icon:"📊",txt:"History"}:["delhivery_pincode","india_post","pincode_lookup","indiapost_lookup"].includes(x)?{cls:"source-badge source-pincode",icon:"📍",txt:"Pincode"}:null,Qt=x=>{const p=Math.floor(x/6e4);return p<60?`${p}m`:`${Math.floor(p/60)}h ${p%60}m`};function on(){var _e,Pe,Le,$e,qe,Ge,Ue,Ve,He,Qe;const x=Rt(),{user:p}=St(),B=`${qt}:direct`,[j,O]=s.useState("paired"),[P,S]=s.useState(""),[f,ht]=s.useState(a.IDLE),[N,le]=s.useState(""),[L,de]=s.useState(null),[Xt,Fe]=s.useState({}),[o,ke]=s.useState(null),[u,k]=s.useState({}),[F,J]=s.useState(null),[Se,Y]=s.useState(null),[Ee,ue]=s.useState(""),[b,Re]=s.useState([]),[me,Ae]=s.useState(!1),[pe,he]=s.useState(!1),[gt,xt]=s.useState("0m"),[Jt,ft]=s.useState(0),[ge,xe]=s.useState("barcode"),[y,K]=s.useState({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now(),scannedItems:[]}),[fe,bt]=s.useState(!1),v=s.useRef(null),be=s.useRef(null),E=s.useRef(null),T=s.useRef(null),I=s.useRef(!1),Z=s.useRef(null),yt=s.useRef(!1),G=s.useRef(a.IDLE),ee=s.useRef(null),M=s.useRef(null),Ie=s.useRef(new Set),ye=s.useRef(0),R=s.useCallback(t=>{ye.current=t,ft(t)},[]),ve=s.useCallback(()=>{R(0),xe("document"),S('No barcode lock yet. Capture label instead or tap "Back to barcode mode" and hold steady.'),_([80,60,80])},[R]);s.useEffect(()=>{const t=setInterval(()=>xt(Qt(Date.now()-y.startedAt)),3e4);return()=>clearInterval(t)},[y.startedAt]);const te=s.useCallback(t=>{Re(t);try{t.length?localStorage.setItem(B,JSON.stringify(t)):localStorage.removeItem(B)}catch{}},[B]),ze=s.useCallback(t=>{const n={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:t};return te([...b,n]),n},[b,te]),ne=s.useCallback(async()=>{var t,n;if(!(!b.length||!navigator.onLine)){for(const r of b)if(!(!((t=r==null?void 0:r.payload)!=null&&t.awb)||!((n=r==null?void 0:r.payload)!=null&&n.imageBase64)))try{await X.post("/shipments/scan-mobile",r.payload)}catch{}te([])}},[b,te]),vt=s.useCallback(()=>{window.confirm("Are you sure you want to end this session? All local statistics will be reset.")&&K({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now(),scannedItems:[]})},[]),wt=s.useCallback(()=>{b.length>0?(ne(),alert(`Flushing ${b.length} offline items to the server.`)):alert("No pending offline scans to upload. Everything is synced!")},[b,ne]),m=s.useCallback(t=>ht(t),[]);s.useEffect(()=>{G.current=f},[f]),s.useEffect(()=>{if(!p){x("/");return}O("paired")},[p,x]),s.useEffect(()=>{try{const t=localStorage.getItem(B);if(!t)return;const n=JSON.parse(t);Array.isArray(n)&&n.length&&Re(n)}catch{}},[B]),s.useEffect(()=>{j==="paired"&&b.length&&ne()},[j,b.length,ne]);const se=s.useCallback(async()=>{var t,n;try{if(he(!1),T.current){try{await((t=T.current.barcodeScanner)==null?void 0:t.dispose())}catch{}T.current=null}if(E.current){try{await E.current.reset()}catch{}E.current=null}(n=v.current)!=null&&n.srcObject&&(v.current.srcObject.getTracks().forEach(r=>r.stop()),v.current.srcObject=null)}catch{}},[]),$=s.useCallback(async()=>{var t;try{if(T.current){try{await((t=T.current.barcodeScanner)==null?void 0:t.dispose())}catch{}T.current=null}if(E.current){try{E.current._type==="native"?E.current.reset():await E.current.reset()}catch{}E.current=null}}catch{}},[]),Te=s.useCallback(async()=>{if(v.current){await $();try{if(!v.current.srcObject){let t;try{t=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{t=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}v.current.srcObject=t,await v.current.play()}if(Ut){const[{BrowserMultiFormatReader:t},n]=await Promise.all([Ze(()=>import("./index-4oYbt_M2.js"),__vite__mapDeps([0,1])),Ze(()=>import("./index-D3Mz4UNV.js"),__vite__mapDeps([]))]),r=new Map([[n.DecodeHintType.POSSIBLE_FORMATS,[n.BarcodeFormat.CODE_128,n.BarcodeFormat.ITF,n.BarcodeFormat.CODE_39,n.BarcodeFormat.CODE_93,n.BarcodeFormat.CODABAR,n.BarcodeFormat.EAN_13,n.BarcodeFormat.EAN_8]],[n.DecodeHintType.TRY_HARDER,!0],[n.DecodeHintType.ASSUME_GS1,!1],[n.DecodeHintType.CHARACTER_SET,"UTF-8"]]),l=new t(r,80);E.current=l,l.decodeFromVideoElement(v.current,d=>{var c;if(I.current)return;if(d){R(0),(c=M.current)==null||c.call(M,d.getText());return}const h=ye.current+1;R(h),h>=Ce&&ve()});return}if(typeof window.BarcodeDetector<"u"){let t=lt;try{const d=await window.BarcodeDetector.getSupportedFormats();t=lt.filter(h=>d.includes(h))||t}catch{}const n=new window.BarcodeDetector({formats:t});let r=null;const l=async()=>{var h;if(I.current||G.current!==a.SCANNING)return;const d=v.current;if(!d||d.readyState<2){r=requestAnimationFrame(l);return}try{const c=await n.detect(d);if(c.length&&c[0].rawValue)R(0),(h=M.current)==null||h.call(M,c[0].rawValue);else{const w=ye.current+1;R(w),w>=Ce&&ve()}}catch{}G.current===a.SCANNING&&(r=requestAnimationFrame(()=>setTimeout(l,15)))};E.current={_type:"native",reset:()=>{r&&cancelAnimationFrame(r),r=null}},setTimeout(l,300);return}throw new Error("Unable to initialize a barcode scanner on this device.")}catch(t){S("Camera access failed: "+t.message)}}},[$,ve,R]),De=s.useCallback(t=>{const n=Et(t)||String(t||"").trim().replace(/\s+/g,"").toUpperCase();if(!(!n||n.length<6||I.current||G.current!==a.SCANNING)){if(I.current=!0,Ie.current.has(n)){_([100,50,100,50,100]),ut(),ue(n),setTimeout(()=>{ue(""),I.current=!1},2500);return}clearTimeout(ee.current),_([50]),dt(),le(n),K(r=>{const l={...r,scanNumber:r.scanNumber+1,scannedAwbs:new Set(r.scannedAwbs)};return l.scannedAwbs.add(n),Ie.current=l.scannedAwbs,l}),ee.current=setTimeout(()=>{G.current===a.SCANNING&&m(a.CAPTURING)},Gt)}},[m]);s.useEffect(()=>{M.current=De},[De]),s.useEffect(()=>(f===a.SCANNING&&(I.current=!1,R(0),xe("barcode"),Te()),()=>{f===a.SCANNING&&$()}),[f,Te,$,R]);const Ct=s.useCallback(()=>{m(a.SCANNING)},[m]),Be=s.useCallback(async()=>{var t;await $();try{if((t=v.current)!=null&&t.srcObject){he(!0);return}const n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}});v.current&&(v.current.srcObject=n,await v.current.play(),he(!0))}catch(n){S("Camera access failed: "+n.message)}},[$]);s.useEffect(()=>{f===a.CAPTURING&&Be()},[f,Be]),s.useEffect(()=>{if(f!==a.CAPTURING){Ae(!1),yt.current=!1;return}const t=setInterval(()=>{const n=v.current,r=be.current;if(!n||!r||!n.videoWidth)return;const l=n.getBoundingClientRect(),d=r.getBoundingClientRect(),h=n.videoWidth/Math.max(l.width,1),c=n.videoHeight/Math.max(l.height,1),w=Math.max(0,Math.floor((d.left-l.left)*h)),A=Math.max(0,Math.floor((d.top-l.top)*c)),W=Math.max(24,Math.floor(d.width*h)),C=Math.max(24,Math.floor(d.height*c)),V=document.createElement("canvas");V.width=96,V.height=72;const H=V.getContext("2d",{willReadFrequently:!0});if(!H)return;H.drawImage(n,w,A,Math.min(W,n.videoWidth-w),Math.min(C,n.videoHeight-A),0,0,96,72);const ae=H.getImageData(0,0,96,72).data;let Xe=0,Je=0,Ye=0,Ke=0;for(let q=0;q<ae.length;q+=4){const Q=.2126*ae[q]+.7152*ae[q+1]+.0722*ae[q+2];Xe+=Q,Je+=Q*Q,q>0&&Math.abs(Q-Ke)>26&&Ye++,Ke=Q}const we=96*72,re=Xe/we,kt=Math.sqrt(Math.max(0,Je/we-re*re));Ae(re>35&&re<225&&kt>24&&Ye/we>.12)},320);return()=>clearInterval(t)},[f]);const Oe=s.useCallback(t=>{try{const n=t.getContext("2d",{willReadFrequently:!0});if(!n)return;const r=n.getImageData(0,0,t.width,t.height),l=r.data;for(let d=0;d<l.length;d+=4){const h=.299*l[d]+.587*l[d+1]+.114*l[d+2],c=Math.min(255,Math.max(0,(h-127)*1.45+127));l[d]=l[d+1]=l[d+2]=c}n.putImageData(r,0,0)}catch{}},[]),Me=s.useCallback(()=>{const t=v.current,n=be.current;if(!t||!n||!t.videoWidth)return null;const r=t.getBoundingClientRect(),l=n.getBoundingClientRect(),d=t.videoWidth/r.width,h=t.videoHeight/r.height,c=Math.max(0,(l.left-r.left)*d),w=Math.max(0,(l.top-r.top)*h),A=Math.min(t.videoWidth-c,l.width*d),W=Math.min(t.videoHeight-w,l.height*h),C=document.createElement("canvas");return C.width=Math.min(1200,Math.round(A)),C.height=Math.round(C.width/A*W),C.getContext("2d").drawImage(t,c,w,A,W,0,0,C.width,C.height),Oe(C),C.toDataURL("image/jpeg",.82).split(",")[1]||null},[Oe]),jt=s.useCallback(()=>{Y("white"),dt(),_([30]);const t=Me();if(!t){S("Could not capture image. Try again."),I.current=!1;return}de(`data:image/jpeg;base64,${t}`),se(),m(a.PREVIEW)},[Me,se,m]),U=s.useCallback(t=>{K(n=>({...n,scannedItems:[{...t,time:Date.now()},...n.scannedItems]}))},[]),Nt=s.useCallback(async()=>{var l,d;if(!N||!L)return;m(a.PROCESSING);const t={scanNumber:y.scanNumber,recentClient:y.dominantClient,dominantClient:y.dominantClient,dominantClientCount:y.dominantClientCount,sessionDurationMin:Math.round((Date.now()-y.startedAt)/6e4)},n=L.split(",")[1]||L,r={awb:N,imageBase64:n,focusImageBase64:n,sessionContext:t};if(!navigator.onLine){ze(r),je();const h={awb:N,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0};J({...h,offlineQueued:!0}),U(h),m(a.SUCCESS);return}try{const c=(await X.post("/shipments/scan-mobile",r)).data;if(c.status==="error"||!c.success){Y("error"),ut(),_([100,50,100]),m(a.ERROR),S(c.error||c.message||"Scan failed.");return}if(ke(c),k({clientCode:c.clientCode||"",consignee:c.consignee||"",destination:c.destination||"",pincode:c.pincode||"",weight:c.weight||0,amount:c.amount||0,orderNo:c.orderNo||""}),Fe({}),c.reviewRequired)m(a.REVIEWING);else{je(),_([50,30,50]);const w={awb:c.awb,clientCode:c.clientCode,clientName:c.clientName,destination:c.destination||"",weight:c.weight||0};J(w),U(w),m(a.SUCCESS)}}catch(h){S(((d=(l=h.response)==null?void 0:l.data)==null?void 0:d.message)||"Server error. Please try again."),m(a.ERROR)}},[N,L,y,m,ze,U]),Ft=s.useCallback(async()=>{var r,l;if(!o)return;m(a.APPROVING);const t={clientCode:o.clientCode||"",clientName:o.clientName||"",consignee:o.consignee||"",destination:o.destination||""},n={clientCode:u.clientCode||"",clientName:u.clientCode||"",consignee:u.consignee||"",destination:u.destination||""};try{if(o.ocrExtracted||o)try{await X.post("/shipments/learn-corrections",{ocrFields:t,approvedFields:n})}catch{}const d={clientCode:u.clientCode,consignee:u.consignee,destination:u.destination,pincode:u.pincode,weight:parseFloat(u.weight)||0,amount:parseFloat(u.amount)||0,orderNo:u.orderNo||""};o.shipmentId?await X.put(`/shipments/${o.shipmentId}`,d):await X.post("/shipments",{awb:o.awb||N,...d}),je(),_([50,30,50]),Y("success");const h={awb:(o==null?void 0:o.awb)||N,clientCode:u.clientCode,clientName:(o==null?void 0:o.clientName)||u.clientCode,destination:u.destination||"",weight:parseFloat(u.weight)||0};J(h),U(h),m(a.SUCCESS),u.clientCode&&u.clientCode!=="MISC"&&K(c=>{var W,C;const w={...c.clientFreq};w[u.clientCode]=(w[u.clientCode]||0)+1;const A=Object.entries(w).sort((V,H)=>H[1]-V[1]);return{...c,clientFreq:w,dominantClient:((W=A[0])==null?void 0:W[1])>=2?A[0][0]:null,dominantClientCount:((C=A[0])==null?void 0:C[1])||0}})}catch(d){m(a.REVIEWING),S(((l=(r=d.response)==null?void 0:r.data)==null?void 0:l.message)||"Approval failed.")}},[o,u,N,m,U]),ie=s.useCallback(()=>{clearTimeout(Z.current),clearTimeout(ee.current),le(""),de(null),ke(null),k({}),Fe({}),J(null),S(""),ue(""),I.current=!1,m(a.IDLE)},[m]);s.useEffect(()=>{if(f===a.SUCCESS)return Z.current=setTimeout(()=>m(a.IDLE),$t),()=>clearTimeout(Z.current)},[f,m]),s.useEffect(()=>{if(fe)if(f===a.REVIEWING&&o){const t=[o.clientName||o.clientCode,o.destination,o.weight?`${o.weight} kilograms`:""].filter(Boolean);t.length&&mt(t.join(". "))}else f===a.SUCCESS&&F&&mt(`${F.clientName||F.clientCode||"Shipment"} verified.`)},[fe,f,o,F]),s.useEffect(()=>()=>{se(),clearTimeout(Z.current),clearTimeout(ee.current)},[se]);const z=t=>`msp-step ${f===t?"active":""}`,D=s.useMemo(()=>{if(!o)return{};const t=o.ocrExtracted||o;return{clientCode:{confidence:(t==null?void 0:t.clientNameConfidence)||0,source:(t==null?void 0:t.clientNameSource)||null},consignee:{confidence:(t==null?void 0:t.consigneeConfidence)||0,source:(t==null?void 0:t.consigneeSource)||null},destination:{confidence:(t==null?void 0:t.destinationConfidence)||0,source:(t==null?void 0:t.destinationSource)||null},pincode:{confidence:(t==null?void 0:t.pincodeConfidence)||0,source:null},weight:{confidence:(t==null?void 0:t.weightConfidence)||0,source:null}}},[o]),g=((_e=o==null?void 0:o.ocrExtracted)==null?void 0:_e.intelligence)||(o==null?void 0:o.intelligence)||null,We=y.scannedItems.reduce((t,n)=>t+(n.weight||0),0);return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:Vt}),e.jsxs("div",{className:"msp-root",children:[Se&&e.jsx("div",{className:`flash-overlay flash-${Se}`,onAnimationEnd:()=>Y(null)}),Ee&&e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.92)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[e.jsx(et,{size:48,color:"white"}),e.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700},children:"DUPLICATE AWB"}),e.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:Ee}),e.jsx("div",{style:{color:"rgba(255,255,255,0.65)",fontSize:"0.8rem"},children:"Already scanned this session"})]}),e.jsx("div",{className:z(a.IDLE),children:e.jsxs("div",{className:"home-root",children:[e.jsxs("div",{className:"home-header",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16},children:[e.jsxs("button",{onClick:()=>x("/app"),style:{background:"white",border:"1px solid #E2E8F0",padding:"6px 12px",borderRadius:20,fontSize:"0.75rem",fontWeight:600,color:"#475569",display:"flex",alignItems:"center",gap:4,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.02)"},children:[e.jsx(At,{size:14})," Go Back"]}),e.jsxs("div",{className:"home-logo-badge",children:[e.jsx(tt,{size:11,color:j==="paired"&&navigator.onLine?"#10B981":"#EF4444"}),(p==null?void 0:p.name)||"Staff"]})]}),e.jsx("div",{className:"home-logo-row",children:e.jsxs("div",{className:"home-logo-text",children:[e.jsx("img",{src:"/images/logo.png",alt:"Sea Hawk Logo",style:{height:28,width:"auto",objectFit:"contain",padding:2,background:"white",borderRadius:6,border:"1px solid #E2E8F0"}}),e.jsx("span",{children:"Seahawk Scanner"})]})}),e.jsxs("div",{className:"home-stats-row",children:[e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:y.scanNumber}),e.jsx("div",{className:"home-stat-label",children:"Scanned"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:We>0?We.toFixed(1):"0"}),e.jsx("div",{className:"home-stat-label",children:"Total kg"})]}),e.jsxs("div",{className:"home-stat-card",children:[e.jsx("div",{className:"home-stat-val",children:gt}),e.jsx("div",{className:"home-stat-label",children:"Session"})]})]})]}),e.jsxs("div",{className:"home-scan-section",children:[e.jsxs("div",{className:"home-scan-btn-wrap",children:[e.jsx("div",{className:"home-scan-ring"}),e.jsx("div",{className:"home-scan-ring home-scan-ring2"}),e.jsxs("button",{id:"start-scanning-btn",className:"home-scan-btn",onClick:Ct,children:[e.jsx(nt,{size:34,color:"white"}),e.jsx("span",{className:"home-scan-btn-label",children:"Scan"})]})]}),e.jsx("div",{className:"home-cta-text",children:y.scanNumber===0?"Tap to start your first scan":"Tap to scan next parcel"}),e.jsxs("div",{className:"action-buttons-row",children:[e.jsxs("button",{className:"action-btn",onClick:wt,children:[e.jsx(It,{size:14})," ",b.length>0?`Upload (${b.length})`:"Synced"]}),e.jsxs("button",{className:"action-btn danger",onClick:vt,children:[e.jsx(zt,{size:14})," End Session"]})]}),b.length>0&&e.jsxs("div",{style:{marginTop:14,fontSize:"0.7rem",color:i.warning,fontWeight:600,display:"flex",alignItems:"center",gap:5},children:[e.jsx(st,{size:12})," ",b.length," offline scan",b.length>1?"s":""," pending sync"]})]}),e.jsxs("div",{className:"home-queue-section",children:[e.jsxs("div",{className:"home-queue-head",children:[e.jsxs("div",{className:"home-queue-title-text",children:[e.jsx(Tt,{size:11}),"Accepted Consignments"]}),y.scannedItems.length>0&&e.jsx("div",{className:"home-queue-badge",children:y.scannedItems.length})]}),e.jsx("div",{className:"home-queue-list",children:y.scannedItems.length===0?e.jsxs("div",{className:"queue-empty",children:[e.jsx(it,{size:36,color:"rgba(255,255,255,0.12)"}),e.jsxs("div",{className:"queue-empty-text",children:["No consignments scanned yet.",e.jsx("br",{}),"Tap the button above to begin."]})]}):y.scannedItems.map((t,n)=>e.jsxs("div",{className:"queue-item",children:[e.jsx("div",{className:"queue-check",children:e.jsx(at,{size:13,color:"#10B981"})}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{className:"queue-awb",children:t.awb}),e.jsxs("div",{className:"queue-meta",children:[t.clientCode==="OFFLINE"?e.jsx("span",{className:"queue-offline-tag",children:"Offline"}):t.clientCode&&e.jsx("span",{className:"queue-client-tag",children:t.clientCode}),t.destination&&e.jsx("span",{children:t.destination})]})]}),t.weight>0&&e.jsxs("div",{className:"queue-weight",children:[t.weight,"kg"]})]},`${t.awb}-${n}`))})]})]})}),e.jsx("video",{ref:v,autoPlay:!0,playsInline:!0,muted:!0,style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(f===a.SCANNING||f===a.CAPTURING)&&!T.current?"block":"none"}}),e.jsx("div",{className:z(a.SCANNING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[e.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:T.current?"block":"none"}}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{className:"scan-guide",style:ge==="barcode"?{width:ct.w,height:ct.h,borderRadius:10,maxHeight:"20vw",transition:"all 0.4s ease"}:{width:oe.w,height:oe.h,borderRadius:14,maxHeight:"75vh",transition:"all 0.4s ease",borderColor:"rgba(251,191,36,0.85)",boxShadow:"0 0 0 3px rgba(251,191,36,0.2)"},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"}),ge==="barcode"&&e.jsx("div",{className:"scan-laser"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(tt,{size:12})," ",(p==null?void 0:p.name)||"Scanner"]}),e.jsxs("div",{className:"cam-hud-chip",style:{gap:4},children:[e.jsx(it,{size:12})," #",y.scanNumber+1,typeof window<"u"&&typeof window.BarcodeDetector<"u"?e.jsx("span",{style:{color:"#34D399",fontSize:"0.6rem",fontWeight:800},children:"⚡ NATIVE"}):e.jsx("span",{style:{color:"#F59E0B",fontSize:"0.6rem",fontWeight:800},children:"ZXING"})]})]}),e.jsxs("div",{className:"cam-bottom",children:[ge==="barcode"?e.jsx("div",{style:{color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:"Align barcode inside the strip"}):e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:6},children:[e.jsxs("div",{style:{color:"rgba(251,191,36,0.95)",fontSize:"0.82rem",fontWeight:700,textAlign:"center"},children:["No barcode lock after ",Ce," frames. Capture label instead."]}),e.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"},children:[e.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:()=>m(a.CAPTURING),children:"Capture label instead"}),e.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:()=>{R(0),xe("barcode"),S("")},children:"Back to barcode mode"})]})]}),e.jsxs("div",{style:{display:"flex",gap:12},children:[e.jsx("button",{className:"cam-hud-chip",onClick:()=>bt(t=>!t),style:{border:"none",cursor:"pointer"},children:fe?e.jsx(Dt,{size:14}):e.jsx(Bt,{size:14})}),e.jsxs("button",{className:"cam-hud-chip",onClick:ie,style:{border:"none",cursor:"pointer"},children:[e.jsx(rt,{size:14})," Cancel"]})]})]})]})}),e.jsx("div",{className:z(a.CAPTURING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!pe&&e.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[e.jsx(Ot,{size:44,color:"#34D399"}),e.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:N}),e.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:"Barcode locked · Preparing camera…"})]}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{ref:be,className:`scan-guide ${me?"detected":""}`,style:{width:oe.w,height:oe.h,maxHeight:"75vh",borderRadius:12},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[e.jsx(Mt,{size:12})," ",N]}),b.length>0&&e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(st,{size:12})," ",b.length," queued"]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:me?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center",transition:"color 0.3s"},children:me?"✓ AWB in frame — press shutter":"Fit the AWB slip inside the frame"}),e.jsx("button",{className:"capture-btn",onClick:jt,disabled:!pe,style:{opacity:pe?1:.4},children:e.jsx("div",{className:"capture-btn-inner"})}),e.jsx("button",{style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},onClick:()=>{le(""),I.current=!1,m(a.SCANNING)},children:"← Rescan barcode"})]})]})}),e.jsx("div",{className:z(a.PREVIEW),children:e.jsxs("div",{style:{background:i.bg,display:"flex",flexDirection:"column",height:"100%"},children:[e.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${i.border}`},children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.72rem",color:i.muted,fontWeight:600},children:"CAPTURED"}),e.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:N})]})}),e.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:L&&e.jsx("img",{src:L,alt:"Captured label",className:"preview-img"})}),e.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{de(null),m(a.CAPTURING)},children:[e.jsx(ot,{size:16})," Retake"]}),e.jsxs("button",{className:"btn btn-primary",style:{flex:2},onClick:Nt,children:[e.jsx(Wt,{size:16})," Use Photo"]})]})]})}),e.jsx("div",{className:z(a.PROCESSING),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16,background:i.bg},children:[e.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[e.jsx(_t,{size:22,color:i.primary,style:{animation:"spin 2s linear infinite"}}),e.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:i.primary},children:"Intelligence Engine"})]}),e.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:i.muted},children:N}),e.jsx("div",{style:{fontSize:"0.72rem",color:i.mutedLight,marginTop:6},children:"Reading AWB label with Gemini Vision…"})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(t=>e.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:t}),e.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),e.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},t)),e.jsx("div",{style:{textAlign:"center",marginTop:8},children:e.jsx("button",{className:"btn btn-outline",style:{fontSize:"0.75rem",padding:"8px 20px"},onClick:()=>{S("Cancelled by user."),m(a.ERROR)},children:"Cancel"})})]})}),e.jsx("div",{className:z(a.REVIEWING),children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%",background:i.bg},children:[e.jsxs("div",{style:{padding:"14px 20px",borderBottom:`1px solid ${i.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.65rem",color:i.muted,fontWeight:600},children:"REVIEW EXTRACTION"}),e.jsx("div",{className:"mono",style:{fontSize:"0.95rem",fontWeight:700},children:(o==null?void 0:o.awb)||N})]}),(g==null?void 0:g.learnedFieldCount)>0&&e.jsxs("div",{className:"source-badge source-learned",children:["🧠 ",g.learnedFieldCount," auto-corrected"]})]}),e.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsxs("div",{className:`field-card ${(((Pe=D.clientCode)==null?void 0:Pe.confidence)||0)<.55?"warning":""}`,children:[e.jsx("div",{className:Ne(((Le=D.clientCode)==null?void 0:Le.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),(($e=D.clientCode)==null?void 0:$e.source)&&(()=>{const t=pt(D.clientCode.source);return t?e.jsxs("span",{className:t.cls,children:[t.icon," ",t.txt]}):null})()]}),e.jsx("input",{className:"field-input",value:u.clientCode||"",onChange:t=>k(n=>({...n,clientCode:t.target.value.toUpperCase()})),placeholder:"Client code"}),((qe=g==null?void 0:g.clientMatches)==null?void 0:qe.length)>0&&g.clientNeedsConfirmation&&e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:g.clientMatches.slice(0,3).map(t=>e.jsxs("button",{onClick:()=>k(n=>({...n,clientCode:t.code})),style:{fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:`1px solid ${i.border}`,background:u.clientCode===t.code?i.primaryLight:i.surface,color:i.text,cursor:"pointer",fontFamily:"inherit",fontWeight:500},children:[t.code," (",Math.round(t.score*100),"%)"]},t.code))})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:Ne(((Ge=D.consignee)==null?void 0:Ge.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Consignee"}),e.jsx("input",{className:"field-input",value:u.consignee||"",onChange:t=>k(n=>({...n,consignee:t.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:Ne(((Ue=D.destination)==null?void 0:Ue.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((Ve=D.destination)==null?void 0:Ve.source)&&(()=>{const t=pt(D.destination.source);return t?e.jsxs("span",{className:t.cls,children:[t.icon," ",t.txt]}):null})()]}),e.jsx("input",{className:"field-input",value:u.destination||"",onChange:t=>k(n=>({...n,destination:t.target.value.toUpperCase()})),placeholder:"City"}),(g==null?void 0:g.pincodeCity)&&g.pincodeCity!==u.destination&&e.jsxs("button",{onClick:()=>k(t=>({...t,destination:g.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:i.successLight,color:i.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["📍 Pincode suggests: ",g.pincodeCity]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Pincode"}),e.jsx("input",{className:"field-input",value:u.pincode||"",onChange:t=>k(n=>({...n,pincode:t.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),e.jsx("div",{className:`field-card ${(He=g==null?void 0:g.weightAnomaly)!=null&&He.anomaly?"warning":""}`,children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Weight (kg)"}),e.jsx("input",{className:"field-input",value:u.weight||"",onChange:t=>k(n=>({...n,weight:t.target.value})),placeholder:"0.0",inputMode:"decimal"}),((Qe=g==null?void 0:g.weightAnomaly)==null?void 0:Qe.anomaly)&&e.jsxs("div",{style:{fontSize:"0.6rem",color:i.warning,marginTop:2,fontWeight:500},children:["⚠️ ",g.weightAnomaly.warning]})]})})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Amount (₹)"}),e.jsx("input",{className:"field-input",value:u.amount||"",onChange:t=>k(n=>({...n,amount:t.target.value})),placeholder:"0",inputMode:"decimal"})]})}),e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Order No"}),e.jsx("input",{className:"field-input",value:u.orderNo||"",onChange:t=>k(n=>({...n,orderNo:t.target.value})),placeholder:"Optional"})]})})]})]}),e.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${i.border}`,display:"flex",gap:10},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:ie,children:[e.jsx(rt,{size:16})," Skip"]}),e.jsxs("button",{className:"btn btn-success btn-lg",style:{flex:2},onClick:Ft,disabled:f===a.APPROVING,children:[f===a.APPROVING?e.jsx(Pt,{size:16,style:{animation:"spin 1s linear infinite"}}):e.jsx(at,{size:16}),f===a.APPROVING?"Saving...":"Approve & Save"]})]})]})}),e.jsx("div",{className:z(a.APPROVING)}),e.jsx("div",{className:z(a.SUCCESS),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20,background:"#0F172A"},children:[e.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[e.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:i.success,strokeWidth:"3",className:"success-check-circle"}),e.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:i.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:i.success,marginBottom:4},children:"Consignment Added ✓"}),e.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700,color:"white"},children:F==null?void 0:F.awb}),(F==null?void 0:F.clientCode)&&e.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:i.primaryLight,color:i.primary,fontSize:"0.78rem",fontWeight:600},children:F.clientName||F.clientCode})]}),e.jsxs("div",{style:{fontSize:"0.72rem",color:"rgba(255,255,255,0.35)"},children:["#",y.scanNumber," scanned · Returning to home…"]}),e.jsxs("button",{className:"btn btn-primary btn-lg btn-full",style:{maxWidth:280,marginTop:4},onClick:ie,children:[e.jsx(nt,{size:18})," Scan Next"]})]})}),e.jsx("div",{className:z(a.ERROR),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20,background:i.bg},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(et,{size:32,color:i.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:i.error},children:"Scan Error"}),e.jsx("div",{style:{fontSize:"0.82rem",color:i.muted,marginTop:4},children:P})]}),e.jsxs("button",{className:"btn btn-primary",onClick:ie,children:[e.jsx(ot,{size:16})," Try Again"]})]})}),j==="disconnected"&&f!==a.IDLE&&e.jsxs("div",{className:"offline-banner",children:[e.jsx(Lt,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline — Reconnecting… ",b.length?`(${b.length} queued)`:""]})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{on as default};
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/index-4oYbt_M2.js","assets/index-D3Mz4UNV.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
