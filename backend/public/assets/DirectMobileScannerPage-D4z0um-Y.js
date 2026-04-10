import{u as pt,_ as Qe}from"./index-BrQSv4ps.js";import{j as e}from"./page-landing-Bx5c8M2c.js";import{r as s}from"./vendor-helmet-Dwc3L0SQ.js";import{a as H}from"./page-import-KrbyjuuQ.js";import{u as ht}from"./vendor-react-DGJm5saH.js";import{b as Ye,R as ge,aD as Je,aE as gt,z as ft,aF as xt,aG as bt,au as yt,aH as vt,d as Ct,aI as Ke,O as wt,ax as Nt,X as jt,aJ as St,aK as kt}from"./vendor-icons-o7elvlXJ.js";import"./page-reconcile-p5UREp47.js";import"./page-rate-calc-_eH7d9Js.js";const Ze={w:"90vw",h:"18vw"},et={w:"92vw",h:"130vw"},Et=3500,Rt="mobile_scanner_offline_queue",At=80,fe=["code_128","code_39","code_93","codabar","ean_13","ean_8","itf","qr_code"],r={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"},L=m=>{var f;try{(f=navigator==null?void 0:navigator.vibrate)==null||f.call(navigator,m)}catch{}},re=(m,f,M="sine")=>{try{const w=new(window.AudioContext||window.webkitAudioContext),P=w.createOscillator(),W=w.createGain();P.type=M,P.frequency.setValueAtTime(m,w.currentTime),W.gain.setValueAtTime(.12,w.currentTime),W.gain.exponentialRampToValueAtTime(.01,w.currentTime+f),P.connect(W),W.connect(w.destination),P.start(),P.stop(w.currentTime+f)}catch{}},xe=()=>{re(880,.12),setTimeout(()=>re(1100,.1),130)},tt=()=>re(600,.08),nt=()=>re(200,.25,"sawtooth"),it=m=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const f=new SpeechSynthesisUtterance(m);f.rate=1.2,f.pitch=1,f.lang="en-IN",window.speechSynthesis.speak(f)}catch{}},i={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",mutedLight:"#9CA3AF",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},It=`
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

/* ── Monospace for AWB ── */
.mono { font-family: 'JetBrains Mono', 'SF Mono', monospace; letter-spacing: -0.02em; }

/* ── Step wrapper (full-screen transitions) ── */
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

/* ── Camera viewport ── */
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

/* ── Scan guide rectangle ── */
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

/* ── Scan laser ── */
@keyframes laserScan {
  0%, 100% { top: 15%; } 50% { top: 82%; }
}
.scan-laser {
  position: absolute; left: 8%; right: 8%; height: 2px;
  background: linear-gradient(90deg, transparent, rgba(79,70,229,0.6), transparent);
  animation: laserScan 2.5s ease-in-out infinite;
}

/* ── HUD (top bar on camera) ── */
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

/* ── Bottom bar on camera ── */
.cam-bottom {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 20px;
  background: linear-gradient(to top, rgba(0,0,0,0.65), transparent);
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  z-index: 3;
}

/* ── Cards ── */
.card {
  background: ${i.surface}; border: 1px solid ${i.border};
  border-radius: 16px; padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

/* ── Buttons ── */
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

/* ── Capture button (circular) ── */
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

/* ── Preview image ── */
.preview-img {
  width: 100%; border-radius: 12px;
  object-fit: contain; max-height: 50vh;
  background: #F1F5F9;
}

/* ── Field card in review ── */
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

/* ── Confidence dot ── */
.conf-dot {
  width: 8px; height: 8px; border-radius: 50%;
  flex-shrink: 0; margin-top: 4px;
}
.conf-high { background: ${i.success}; }
.conf-med { background: ${i.warning}; }
.conf-low { background: ${i.error}; }

/* ── Source badge ── */
.source-badge {
  font-size: 0.6rem; padding: 2px 6px; border-radius: 6px;
  font-weight: 600; display: inline-flex; align-items: center; gap: 3px;
}
.source-learned { background: #F5F3FF; color: #7C3AED; }
.source-ai { background: ${i.primaryLight}; color: ${i.primary}; }
.source-history { background: ${i.warningLight}; color: ${i.warning}; }
.source-pincode { background: ${i.successLight}; color: ${i.success}; }

/* ── Shimmer skeleton ── */
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

/* ── Success checkmark ── */
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

/* ── Flash overlay ── */
@keyframes flash { 0% { opacity: 0.8; } 100% { opacity: 0; } }
.flash-overlay {
  position: fixed; inset: 0; z-index: 50;
  pointer-events: none;
  animation: flash 0.3s ease-out forwards;
}
.flash-white { background: white; }
.flash-success { background: rgba(5,150,105,0.2); }
.flash-error { background: rgba(220,38,38,0.2); }

/* ── Duplicate warning ── */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}
.shake { animation: shake 0.5s ease-in-out; }

/* ── Offline banner ── */
.offline-banner {
  background: ${i.warningLight}; color: ${i.warning};
  text-align: center; padding: 6px; font-size: 0.72rem; font-weight: 600;
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 99;
}

/* ── Scrollable panel ── */
.scroll-panel {
  flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
  padding: 16px 20px;
}
`,Ft=m=>m>=.85?"high":m>=.55?"med":"low",be=m=>`conf-dot conf-${Ft(m)}`,st=m=>m==="learned"?{className:"source-badge source-learned",icon:"🧠",text:"Learned"}:m==="fuzzy_match"?{className:"source-badge source-ai",icon:"🔍",text:"Matched"}:m==="fuzzy_history"||m==="consignee_pattern"?{className:"source-badge source-history",icon:"📊",text:"History"}:m==="delhivery_pincode"||m==="india_post"||m==="pincode_lookup"||m==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"📍",text:"Pincode"}:null;function Gt(){var Oe,Be,Me,Pe,We,_e,$e,De,Ge,Le;const m=ht(),{user:f}=pt(),M=`${Rt}:direct`,[w,P]=s.useState("paired"),[W,F]=s.useState(""),[g,rt]=s.useState(r.IDLE),[j,ae]=s.useState(""),[$,oe]=s.useState(null),[zt,ye]=s.useState({}),[a,ve]=s.useState(null),[c,E]=s.useState({}),[y,X]=s.useState(null),[Ce,Q]=s.useState(null),[we,ce]=s.useState(""),[S,Ne]=s.useState([]),[le,je]=s.useState(!1),[Tt,Se]=s.useState(0),[de,ue]=s.useState(!1),[z,ke]=s.useState({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now()}),[Y,at]=s.useState(!1),x=s.useRef(null),me=s.useRef(null),R=s.useRef(null),T=s.useRef(null),A=s.useRef(!1),J=s.useRef(null),ot=s.useRef(!1),U=s.useRef(r.IDLE),K=s.useRef(null),_=s.useRef(null),Ee=s.useRef(new Set),Z=s.useCallback(t=>{Ne(t);try{t.length?localStorage.setItem(M,JSON.stringify(t)):localStorage.removeItem(M)}catch{}},[M]),Re=s.useCallback(t=>{const n={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:t};return Z([...S,n]),n},[S,Z]),Ae=s.useCallback(async()=>{var t,n;if(!(!S.length||!navigator.onLine)){for(const l of S)if(!(!((t=l==null?void 0:l.payload)!=null&&t.awb)||!((n=l==null?void 0:l.payload)!=null&&n.imageBase64)))try{await H.post("/shipments/scan-mobile",l.payload)}catch{}Z([])}},[S,Z]),p=s.useCallback(t=>{rt(t)},[]);s.useEffect(()=>{U.current=g},[g]),s.useEffect(()=>{if(!f){m("/");return}P("paired"),p(r.SCANNING)},[f,m,p]),s.useEffect(()=>{try{const t=localStorage.getItem(M);if(!t)return;const n=JSON.parse(t);Array.isArray(n)&&n.length&&Ne(n)}catch{}},[M]),s.useEffect(()=>{w==="paired"&&S.length&&Ae()},[w,S.length,Ae]);const ee=s.useCallback(async()=>{var t;try{if(ue(!1),T.current){try{const n=T.current;n!=null&&n.barcodeScanner&&await n.barcodeScanner.dispose()}catch{}T.current=null}if(R.current){try{await R.current.reset()}catch{}R.current=null}(t=x.current)!=null&&t.srcObject&&(x.current.srcObject.getTracks().forEach(n=>n.stop()),x.current.srcObject=null)}catch{}},[]),D=s.useCallback(async()=>{try{if(T.current){try{await T.current.barcodeScanner.dispose()}catch{}T.current=null}if(R.current){try{R.current._type==="native"?R.current.reset():await R.current.reset()}catch{}R.current=null}}catch{}},[]),Ie=s.useCallback(async()=>{if(x.current){await D();try{if(!x.current.srcObject){let d=null;try{d=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{d=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}x.current.srcObject=d,await x.current.play()}if(typeof window.BarcodeDetector<"u"){let d=fe;try{const v=await window.BarcodeDetector.getSupportedFormats();d=fe.filter(k=>v.includes(k)),d.length||(d=fe)}catch{}const b=new window.BarcodeDetector({formats:d});let o=null;const N=async()=>{var k;if(A.current||U.current!==r.SCANNING)return;const v=x.current;if(!v||v.readyState<2){o=requestAnimationFrame(N);return}try{const C=await b.detect(v);C.length>0&&C[0].rawValue&&((k=_.current)==null||k.call(_,C[0].rawValue))}catch{}U.current===r.SCANNING&&(o=requestAnimationFrame(()=>setTimeout(N,15)))};R.current={_type:"native",reset:()=>{o&&cancelAnimationFrame(o),o=null}},setTimeout(N,300);return}const[{BrowserMultiFormatReader:t},n]=await Promise.all([Qe(()=>import("./index-4oYbt_M2.js"),__vite__mapDeps([0,1])),Qe(()=>import("./index-D3Mz4UNV.js"),__vite__mapDeps([]))]),l=new Map([[n.DecodeHintType.POSSIBLE_FORMATS,[n.BarcodeFormat.CODE_128,n.BarcodeFormat.ITF,n.BarcodeFormat.CODE_39,n.BarcodeFormat.CODE_93,n.BarcodeFormat.CODABAR,n.BarcodeFormat.EAN_13,n.BarcodeFormat.EAN_8]],[n.DecodeHintType.TRY_HARDER,!0],[n.DecodeHintType.ASSUME_GS1,!1],[n.DecodeHintType.CHARACTER_SET,"UTF-8"]]),u=new t(l,80);R.current=u,u.decodeFromVideoElement(x.current,d=>{var b;A.current||d&&((b=_.current)==null||b.call(_,d.getText()))})}catch(t){F("Camera access failed: "+t.message)}}},[D]),Fe=s.useCallback(t=>{const n=String(t||"").trim().replace(/\s+/g,"").toUpperCase();if(!(!n||n.length<6||A.current||U.current!==r.SCANNING)){if(A.current=!0,Ee.current.has(n)){L([100,50,100,50,100]),nt(),ce(n),setTimeout(()=>{ce(""),A.current=!1},2500);return}clearTimeout(K.current),L([50]),tt(),ae(n),ke(l=>{const u={...l,scanNumber:l.scanNumber+1};return u.scannedAwbs=new Set(l.scannedAwbs),u.scannedAwbs.add(n),Ee.current=u.scannedAwbs,u}),K.current=setTimeout(()=>{U.current===r.SCANNING&&p(r.CAPTURING)},At)}},[p]);s.useEffect(()=>{_.current=Fe},[Fe]),s.useEffect(()=>(g===r.SCANNING&&(A.current=!1,Ie()),()=>{g===r.SCANNING&&D()}),[g,Ie,D]);const ze=s.useCallback(async()=>{var t;await D();try{if((t=x.current)!=null&&t.srcObject){ue(!0);return}const n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}});x.current&&(x.current.srcObject=n,await x.current.play(),ue(!0))}catch(n){F("Camera access failed: "+n.message)}},[D]);s.useEffect(()=>{g===r.CAPTURING&&ze()},[g,ze]),s.useEffect(()=>{if(g!==r.CAPTURING){je(!1),Se(0),ot.current=!1;return}const t=setInterval(()=>{const n=x.current,l=me.current;if(!n||!l||!n.videoWidth||!n.videoHeight)return;const u=n.getBoundingClientRect(),d=l.getBoundingClientRect(),b=n.videoWidth/Math.max(u.width,1),o=n.videoHeight/Math.max(u.height,1),N=Math.max(0,Math.floor((d.left-u.left)*b)),v=Math.max(0,Math.floor((d.top-u.top)*o)),k=Math.max(24,Math.floor(d.width*b)),C=Math.max(24,Math.floor(d.height*o)),G=document.createElement("canvas"),te=96,ne=72;G.width=te,G.height=ne;const pe=G.getContext("2d",{willReadFrequently:!0});if(!pe)return;pe.drawImage(n,N,v,Math.min(k,n.videoWidth-N),Math.min(C,n.videoHeight-v),0,0,te,ne);const ie=pe.getImageData(0,0,te,ne).data;let Ue=0,Ve=0,qe=0,He=0;for(let B=0;B<ie.length;B+=4){const q=.2126*ie[B]+.7152*ie[B+1]+.0722*ie[B+2];Ue+=q,Ve+=q*q,B>0&&Math.abs(q-He)>26&&qe++,He=q}const he=te*ne,se=Ue/he,ut=Math.sqrt(Math.max(0,Ve/he-se*se)),mt=qe/Math.max(he,1),Xe=se>35&&se<225&&ut>24&&mt>.12;je(Xe),Se(B=>Xe?Math.min(B+1,8):0)},320);return()=>clearInterval(t)},[g]);const Te=s.useCallback(()=>{const t=x.current,n=me.current;if(!t||!n||!t.videoWidth)return null;const l=t.getBoundingClientRect(),u=n.getBoundingClientRect(),d=t.videoWidth/l.width,b=t.videoHeight/l.height,o=Math.max(0,(u.left-l.left)*d),N=Math.max(0,(u.top-l.top)*b),v=Math.min(t.videoWidth-o,u.width*d),k=Math.min(t.videoHeight-N,u.height*b),C=document.createElement("canvas");return C.width=Math.min(1200,Math.round(v)),C.height=Math.round(C.width/v*k),C.getContext("2d").drawImage(t,o,N,v,k,0,0,C.width,C.height),C.toDataURL("image/jpeg",.75).split(",")[1]||null},[]),ct=s.useCallback(()=>{Q("white"),tt(),L([30]);const t=Te();if(!t){F("Could not capture image. Try again."),A.current=!1;return}oe(`data:image/jpeg;base64,${t}`),ee(),p(r.PREVIEW)},[Te,ee,p]),lt=s.useCallback(async()=>{var u,d;if(!j||!$)return;p(r.PROCESSING);const t={scanNumber:z.scanNumber,recentClient:z.dominantClient,dominantClient:z.dominantClient,dominantClientCount:z.dominantClientCount,sessionDurationMin:Math.round((Date.now()-z.startedAt)/6e4)},n=$.split(",")[1]||$,l={awb:j,imageBase64:n,focusImageBase64:n,sessionContext:t};if(!navigator.onLine){Re(l),xe(),X({awb:j,clientCode:"OFFLINE",clientName:"Queued Offline",offlineQueued:!0}),p(r.SUCCESS);return}try{const o=(await H.post("/shipments/scan-mobile",l)).data;if(o.status==="error"||!o.success){Q("error"),nt(),L([100,50,100]),p(r.ERROR),F(o.error||o.message||"Scan failed.");return}ve(o),E({clientCode:o.clientCode||"",consignee:o.consignee||"",destination:o.destination||"",pincode:o.pincode||"",weight:o.weight||0,amount:o.amount||0,orderNo:o.orderNo||""}),ye({}),o.reviewRequired?p(r.REVIEWING):(xe(),L([50,30,50]),X({awb:o.awb,clientCode:o.clientCode,clientName:o.clientName}),p(r.SUCCESS))}catch(b){F(((d=(u=b.response)==null?void 0:u.data)==null?void 0:d.message)||"Server error. Please try again."),p(r.ERROR)}},[j,$,z,p,Re]),dt=s.useCallback(async()=>{var l,u;if(!a)return;p(r.APPROVING);const t={clientCode:a.clientCode||"",clientName:a.clientName||"",consignee:a.consignee||"",destination:a.destination||""},n={clientCode:c.clientCode||"",clientName:c.clientCode||"",consignee:c.consignee||"",destination:c.destination||""};try{if(a.ocrExtracted||a)try{await H.post("/shipments/learn-corrections",{ocrFields:t,approvedFields:n})}catch{}const d={clientCode:c.clientCode,consignee:c.consignee,destination:c.destination,pincode:c.pincode,weight:parseFloat(c.weight)||0,amount:parseFloat(c.amount)||0,orderNo:c.orderNo||""};a.shipmentId?await H.put(`/shipments/${a.shipmentId}`,d):await H.post("/shipments",{awb:a.awb||j,...d}),xe(),L([50,30,50]),Q("success"),X({awb:(a==null?void 0:a.awb)||j,clientCode:c.clientCode,clientName:c.clientCode}),p(r.SUCCESS),c.clientCode&&c.clientCode!=="MISC"&&ke(b=>{var v,k;const o={...b.clientFreq};o[c.clientCode]=(o[c.clientCode]||0)+1;const N=Object.entries(o).sort((C,G)=>G[1]-C[1]);return{...b,clientFreq:o,dominantClient:((v=N[0])==null?void 0:v[1])>=2?N[0][0]:null,dominantClientCount:((k=N[0])==null?void 0:k[1])||0}})}catch(d){p(r.REVIEWING),F(((u=(l=d.response)==null?void 0:l.data)==null?void 0:u.message)||"Approval failed.")}},[a,c,j,p]),V=s.useCallback(()=>{clearTimeout(J.current),clearTimeout(K.current),ae(""),oe(null),ve(null),E({}),ye({}),X(null),F(""),ce(""),A.current=!1,p(r.SCANNING)},[p]);s.useEffect(()=>{if(g===r.SUCCESS)return J.current=setTimeout(V,Et),()=>clearTimeout(J.current)},[g,V]),s.useEffect(()=>{if(Y)if(g===r.REVIEWING&&a){const t=[a.clientName||a.clientCode,a.destination,a.weight?`${a.weight} kilograms`:""].filter(Boolean);t.length&&it(t.join(". "))}else g===r.SUCCESS&&y&&it(`${y.clientName||y.clientCode||"Shipment"} Verified.`)},[Y,g,a,y]),s.useEffect(()=>()=>{ee(),clearTimeout(J.current),clearTimeout(K.current)},[ee]);const I=t=>`msp-step ${g===t?"active":""}`,O=s.useMemo(()=>{if(!a)return{};const t=a.ocrExtracted||a;return{clientCode:{confidence:(t==null?void 0:t.clientNameConfidence)||0,source:(t==null?void 0:t.clientNameSource)||null},consignee:{confidence:(t==null?void 0:t.consigneeConfidence)||0,source:(t==null?void 0:t.consigneeSource)||null},destination:{confidence:(t==null?void 0:t.destinationConfidence)||0,source:(t==null?void 0:t.destinationSource)||null},pincode:{confidence:(t==null?void 0:t.pincodeConfidence)||0,source:null},weight:{confidence:(t==null?void 0:t.weightConfidence)||0,source:null}}},[a]),h=((Oe=a==null?void 0:a.ocrExtracted)==null?void 0:Oe.intelligence)||(a==null?void 0:a.intelligence)||null;return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:It}),e.jsxs("div",{className:"msp-root",children:[Ce&&e.jsx("div",{className:`flash-overlay flash-${Ce}`,onAnimationEnd:()=>Q(null)}),we&&e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[e.jsx(Ye,{size:48,color:"white"}),e.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),e.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:we}),e.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),e.jsx("div",{className:I(r.IDLE),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:w==="connecting"?e.jsx(ge,{size:28,color:i.primary,style:{animation:"spin 1s linear infinite"}}):e.jsx(Je,{size:28,color:i.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:w==="connecting"?"Connecting...":"Disconnected"}),e.jsx("div",{style:{fontSize:"0.82rem",color:i.muted},children:W||`Connecting to session ${pin}`})]}),w==="disconnected"&&e.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[e.jsx(ge,{size:16})," Reconnect"]})]})}),e.jsx("video",{ref:x,autoPlay:!0,playsInline:!0,muted:!0,style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(g===r.SCANNING||g===r.CAPTURING)&&!T.current?"block":"none"}}),e.jsx("div",{className:I(r.SCANNING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[e.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:T.current?"block":"none"}}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{className:"scan-guide",style:{width:Ze.w,height:Ze.h,borderRadius:10,maxHeight:"20vw"},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"}),e.jsx("div",{className:"scan-laser"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(gt,{size:12})," ",(f==null?void 0:f.name)||"Scanner"]}),e.jsxs("div",{className:"cam-hud-chip",style:{gap:4},children:[e.jsx(ft,{size:12})," ",z.scanNumber,typeof window<"u"&&typeof window.BarcodeDetector<"u"?e.jsx("span",{style:{color:"#34D399",fontSize:"0.6rem",fontWeight:800},children:"⚡ NATIVE"}):e.jsx("span",{style:{color:"#F59E0B",fontSize:"0.6rem",fontWeight:800},children:"ZXING"})]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:"Align barcode inside the strip"}),e.jsx("div",{style:{display:"flex",gap:12},children:e.jsx("button",{className:"cam-hud-chip",onClick:()=>at(!Y),style:{border:"none",cursor:"pointer"},children:Y?e.jsx(xt,{size:14}):e.jsx(bt,{size:14})})})]})]})}),e.jsx("div",{className:I(r.CAPTURING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!de&&e.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[e.jsx(yt,{size:44,color:"#34D399"}),e.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:j}),e.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:"Barcode locked · Preparing camera…"})]}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{ref:me,className:`scan-guide ${le?"detected":""}`,style:{width:et.w,height:et.h,maxHeight:"75vh",borderRadius:12},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[e.jsx(vt,{size:12})," ",j]}),S.length>0&&e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(Ct,{size:12})," ",S.length," queued"]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:le?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center",transition:"color 0.3s"},children:le?"✓ AWB in frame — press shutter":"Fit the AWB slip inside the frame"}),e.jsx("button",{className:"capture-btn",onClick:ct,disabled:!de,style:{opacity:de?1:.4},children:e.jsx("div",{className:"capture-btn-inner"})}),e.jsx("button",{style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},onClick:()=>{ae(""),A.current=!1,p(r.SCANNING)},children:"← Rescan barcode"})]})]})}),e.jsx("div",{className:I(r.PREVIEW),children:e.jsxs("div",{style:{background:i.bg,display:"flex",flexDirection:"column",height:"100%"},children:[e.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${i.border}`},children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.72rem",color:i.muted,fontWeight:600},children:"CAPTURED"}),e.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:j})]})}),e.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:$&&e.jsx("img",{src:$,alt:"Captured label",className:"preview-img"})}),e.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{oe(null),p(r.CAPTURING)},children:[e.jsx(Ke,{size:16})," Retake"]}),e.jsxs("button",{className:"btn btn-primary",style:{flex:2},onClick:lt,children:[e.jsx(wt,{size:16})," Use Photo"]})]})]})}),e.jsx("div",{className:I(r.PROCESSING),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16},children:[e.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[e.jsx(Nt,{size:22,color:i.primary,style:{animation:"spin 2s linear infinite"}}),e.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:i.primary},children:"Intelligence Engine"})]}),e.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:i.muted},children:j}),e.jsx("div",{style:{fontSize:"0.72rem",color:i.mutedLight,marginTop:6},children:"Reading AWB label with Gemini Vision…"})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(t=>e.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:t}),e.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),e.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},t)),e.jsx("div",{style:{textAlign:"center",marginTop:8},children:e.jsx("button",{className:"btn btn-outline",style:{fontSize:"0.75rem",padding:"8px 20px"},onClick:()=>{F("Cancelled by user."),p(r.ERROR)},children:"Cancel"})})]})}),e.jsx("div",{className:I(r.REVIEWING),children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%"},children:[e.jsxs("div",{style:{padding:"14px 20px",borderBottom:`1px solid ${i.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.65rem",color:i.muted,fontWeight:600},children:"REVIEW EXTRACTION"}),e.jsx("div",{className:"mono",style:{fontSize:"0.95rem",fontWeight:700},children:(a==null?void 0:a.awb)||j})]}),(h==null?void 0:h.learnedFieldCount)>0&&e.jsxs("div",{className:"source-badge source-learned",children:["🧠 ",h.learnedFieldCount," auto-corrected"]})]}),e.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsxs("div",{className:`field-card ${(((Be=O.clientCode)==null?void 0:Be.confidence)||0)<.55?"warning":""}`,children:[e.jsx("div",{className:be(((Me=O.clientCode)==null?void 0:Me.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((Pe=O.clientCode)==null?void 0:Pe.source)&&(()=>{const t=st(O.clientCode.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:c.clientCode||"",onChange:t=>E(n=>({...n,clientCode:t.target.value.toUpperCase()})),placeholder:"Client code"}),((We=h==null?void 0:h.clientMatches)==null?void 0:We.length)>0&&h.clientNeedsConfirmation&&e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:h.clientMatches.slice(0,3).map(t=>e.jsxs("button",{onClick:()=>E(n=>({...n,clientCode:t.code})),style:{fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:`1px solid ${i.border}`,background:c.clientCode===t.code?i.primaryLight:i.surface,color:i.text,cursor:"pointer",fontFamily:"inherit",fontWeight:500},children:[t.code," (",Math.round(t.score*100),"%)"]},t.code))})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:be(((_e=O.consignee)==null?void 0:_e.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Consignee"}),e.jsx("input",{className:"field-input",value:c.consignee||"",onChange:t=>E(n=>({...n,consignee:t.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:be((($e=O.destination)==null?void 0:$e.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((De=O.destination)==null?void 0:De.source)&&(()=>{const t=st(O.destination.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:c.destination||"",onChange:t=>E(n=>({...n,destination:t.target.value.toUpperCase()})),placeholder:"City"}),(h==null?void 0:h.pincodeCity)&&h.pincodeCity!==c.destination&&e.jsxs("button",{onClick:()=>E(t=>({...t,destination:h.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:i.successLight,color:i.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["📍 Pincode suggests: ",h.pincodeCity]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Pincode"}),e.jsx("input",{className:"field-input",value:c.pincode||"",onChange:t=>E(n=>({...n,pincode:t.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),e.jsx("div",{className:`field-card ${(Ge=h==null?void 0:h.weightAnomaly)!=null&&Ge.anomaly?"warning":""}`,children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Weight (kg)"}),e.jsx("input",{className:"field-input",value:c.weight||"",onChange:t=>E(n=>({...n,weight:t.target.value})),placeholder:"0.0",inputMode:"decimal"}),((Le=h==null?void 0:h.weightAnomaly)==null?void 0:Le.anomaly)&&e.jsxs("div",{style:{fontSize:"0.6rem",color:i.warning,marginTop:2,fontWeight:500},children:["⚠️ ",h.weightAnomaly.warning]})]})})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Amount (₹)"}),e.jsx("input",{className:"field-input",value:c.amount||"",onChange:t=>E(n=>({...n,amount:t.target.value})),placeholder:"0",inputMode:"decimal"})]})}),e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Order No"}),e.jsx("input",{className:"field-input",value:c.orderNo||"",onChange:t=>E(n=>({...n,orderNo:t.target.value})),placeholder:"Optional"})]})})]})]}),e.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${i.border}`,display:"flex",gap:10},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:V,children:[e.jsx(jt,{size:16})," Skip"]}),e.jsxs("button",{className:"btn btn-success btn-lg",style:{flex:2},onClick:dt,disabled:g===r.APPROVING,children:[g===r.APPROVING?e.jsx(ge,{size:16,style:{animation:"spin 1s linear infinite"}}):e.jsx(St,{size:16}),g===r.APPROVING?"Saving...":"Approve & Save"]})]})]})}),e.jsx("div",{className:I(r.APPROVING)}),e.jsx("div",{className:I(r.SUCCESS),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[e.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:i.success,strokeWidth:"3",className:"success-check-circle"}),e.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:i.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:i.success,marginBottom:4},children:"Saved Successfully"}),e.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700},children:y==null?void 0:y.awb}),(y==null?void 0:y.clientCode)&&e.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:i.primaryLight,color:i.primary,fontSize:"0.78rem",fontWeight:600},children:y.clientName||y.clientCode})]}),e.jsx("div",{style:{fontSize:"0.72rem",color:i.muted},children:y!=null&&y.offlineQueued?`${S.length} queued for sync • Auto-continuing in 3s`:`#${z.scanNumber} scanned • Auto-continuing in 3s`}),e.jsxs("button",{className:"btn btn-primary btn-lg btn-full",onClick:V,style:{maxWidth:320},children:[e.jsx(kt,{size:18})," Scan Next Parcel"]})]})}),e.jsx("div",{className:I(r.ERROR),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(Ye,{size:32,color:i.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:i.error},children:"Scan Error"}),e.jsx("div",{style:{fontSize:"0.82rem",color:i.muted,marginTop:4},children:W})]}),e.jsxs("button",{className:"btn btn-primary",onClick:V,children:[e.jsx(Ke,{size:16})," Try Again"]})]})}),w==="disconnected"&&g!==r.IDLE&&e.jsxs("div",{className:"offline-banner",children:[e.jsx(Je,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline — Reconnecting... ",S.length?`(${S.length} queued)`:""]})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{Gt as default};
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/index-4oYbt_M2.js","assets/index-D3Mz4UNV.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
