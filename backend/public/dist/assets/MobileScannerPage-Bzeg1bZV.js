import{l as pt,_ as Qe}from"./index-CtbPmJil.js";import{j as e}from"./page-landing-Bx5c8M2c.js";import{r as s}from"./vendor-helmet-Dwc3L0SQ.js";import{c as ht,u as ft}from"./vendor-react-DGJm5saH.js";import{b as Ke,R as he,aD as Je,aE as gt,z as xt,aF as bt,aG as yt,au as vt,aH as Ct,d as Nt,aI as Ze,O as wt,ax as jt,X as St,aJ as kt,aK as Et}from"./vendor-icons-BnO5wfY8.js";import"./page-import-BnK5qB8E.js";import"./page-reconcile-C9On1HwO.js";import"./page-rate-calc-Dj0SbQEs.js";const Rt=window.location.origin,et={w:"90vw",h:"18vw"},tt={w:"92vw",h:"130vw"},It=3500,At="mobile_scanner_offline_queue",Ft=80,fe=["code_128","code_39","code_93","codabar","ean_13","ean_8","itf","qr_code"],r={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"},U=a=>{var g;try{(g=navigator==null?void 0:navigator.vibrate)==null||g.call(navigator,a)}catch{}},se=(a,g,f="sine")=>{try{const F=new(window.AudioContext||window.webkitAudioContext),y=F.createOscillator(),R=F.createGain();y.type=f,y.frequency.setValueAtTime(a,F.currentTime),R.gain.setValueAtTime(.12,F.currentTime),R.gain.exponentialRampToValueAtTime(.01,F.currentTime+g),y.connect(R),R.connect(F.destination),y.start(),y.stop(F.currentTime+g)}catch{}},ge=()=>{se(880,.12),setTimeout(()=>se(1100,.1),130)},nt=()=>se(600,.08),xe=()=>se(200,.25,"sawtooth"),it=a=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const g=new SpeechSynthesisUtterance(a);g.rate=1.2,g.pitch=1,g.lang="en-IN",window.speechSynthesis.speak(g)}catch{}},i={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",mutedLight:"#9CA3AF",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},zt=`
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
`,Tt=a=>a>=.85?"high":a>=.55?"med":"low",be=a=>`conf-dot conf-${Tt(a)}`,st=a=>a==="learned"?{className:"source-badge source-learned",icon:"🧠",text:"Learned"}:a==="fuzzy_match"?{className:"source-badge source-ai",icon:"🔍",text:"Matched"}:a==="fuzzy_history"||a==="consignee_pattern"?{className:"source-badge source-history",icon:"📊",text:"History"}:a==="delhivery_pincode"||a==="india_post"||a==="pincode_lookup"||a==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"📍",text:"Pincode"}:null;function Ut(){var Pe,Me,Be,_e,We,$e,De,Ge,Le,Ue;const{pin:a}=ht();ft();const g=`${At}:${a||"unknown"}`,[f,F]=s.useState(null),[y,R]=s.useState("connecting"),[ye,N]=s.useState(""),[p,rt]=s.useState(r.IDLE),[S,re]=s.useState(""),[D,oe]=s.useState(null),[Ot,ve]=s.useState({}),[o,Ce]=s.useState(null),[c,k]=s.useState({}),[v,H]=s.useState(null),[Ne,X]=s.useState(null),[we,ae]=s.useState(""),[w,je]=s.useState([]),[ce,Se]=s.useState(!1),[Pt,ke]=s.useState(0),[le,de]=s.useState(!1),[O,Ee]=s.useState({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now()}),[Y,ot]=s.useState(!1),x=s.useRef(null),ue=s.useRef(null),I=s.useRef(null),P=s.useRef(null),z=s.useRef(!1),Q=s.useRef(null),at=s.useRef(!1),G=s.useRef(r.IDLE),K=s.useRef(null),$=s.useRef(null),Re=s.useRef(new Set),J=s.useCallback(t=>{je(t);try{t.length?localStorage.setItem(g,JSON.stringify(t)):localStorage.removeItem(g)}catch{}},[g]),Ie=s.useCallback(t=>{const n={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:t};return J([...w,n]),n},[w,J]),Ae=s.useCallback(()=>{!f||!f.connected||!w.length||(w.forEach(t=>{var n,l;!((n=t==null?void 0:t.payload)!=null&&n.awb)||!((l=t==null?void 0:t.payload)!=null&&l.imageBase64)||f.emit("scanner:scan",t.payload)}),J([]))},[f,w,J]),d=s.useCallback(t=>{rt(t)},[]);s.useEffect(()=>{G.current=p},[p]),s.useEffect(()=>{if(!a){N("No PIN provided.");return}const t=pt(Rt,{auth:{scannerPin:a},transports:["websocket","polling"],reconnection:!0,reconnectionDelay:1500,reconnectionAttempts:20});return t.on("connect",()=>R("connecting")),t.on("scanner:paired",()=>{R("paired"),d(r.SCANNING)}),t.on("scanner:error",({message:n})=>{N(n),R("disconnected")}),t.on("scanner:session-ended",()=>{R("disconnected"),N("Session ended by desktop.")}),t.on("disconnect",()=>R("disconnected")),t.on("reconnect",()=>{y==="paired"&&d(r.SCANNING)}),t.on("scanner:scan-processed",n=>{if(n.status==="error"){X("error"),xe(),U([100,50,100]),d(r.ERROR),N(n.error||"Scan failed on desktop.");return}Ce(n),k({clientCode:n.clientCode||"",consignee:n.consignee||"",destination:n.destination||"",pincode:n.pincode||"",weight:n.weight||0,amount:n.amount||0,orderNo:n.orderNo||""}),ve({}),n.reviewRequired?d(r.REVIEWING):(ge(),U([50,30,50]),H({awb:n.awb,clientCode:n.clientCode,clientName:n.clientName}),d(r.SUCCESS))}),t.on("scanner:approval-result",({success:n,message:l,awb:m})=>{n?(ge(),U([50,30,50]),X("success"),H({awb:(o==null?void 0:o.awb)||m,clientCode:c.clientCode,clientName:(o==null?void 0:o.clientName)||c.clientCode}),d(r.SUCCESS)):(xe(),N(l||"Approval failed."))}),t.on("scanner:ready-for-next",()=>{}),F(t),()=>{t.disconnect()}},[a]),s.useEffect(()=>{try{const t=localStorage.getItem(g);if(!t)return;const n=JSON.parse(t);Array.isArray(n)&&n.length&&je(n)}catch{}},[g]),s.useEffect(()=>{y==="paired"&&(f!=null&&f.connected)&&w.length&&Ae()},[y,f,w.length,Ae]);const Z=s.useCallback(async()=>{var t;try{if(de(!1),P.current){try{const n=P.current;n!=null&&n.barcodeScanner&&await n.barcodeScanner.dispose()}catch{}P.current=null}if(I.current){try{await I.current.reset()}catch{}I.current=null}(t=x.current)!=null&&t.srcObject&&(x.current.srcObject.getTracks().forEach(n=>n.stop()),x.current.srcObject=null)}catch{}},[]),L=s.useCallback(async()=>{try{if(P.current){try{await P.current.barcodeScanner.dispose()}catch{}P.current=null}if(I.current){try{I.current._type==="native"?I.current.reset():await I.current.reset()}catch{}I.current=null}}catch{}},[]),Fe=s.useCallback(async()=>{if(x.current){await L();try{if(!x.current.srcObject){let h=null;try{h=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{h=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}x.current.srcObject=h,await x.current.play()}if(typeof window.BarcodeDetector<"u"){let h=!0,b=fe;try{const E=await window.BarcodeDetector.getSupportedFormats();b=fe.filter(C=>E.includes(C)),b.length||(b=fe)}catch{}if(b.includes("itf")||(console.log("[MobileScanner] Native BarcodeDetector lacks ITF — falling back to ZXing"),h=!1),h){const E=new window.BarcodeDetector({formats:b});let C=null;const A=async()=>{var j;if(z.current||G.current!==r.SCANNING)return;const B=x.current;if(!B||B.readyState<2){C=requestAnimationFrame(A);return}try{const _=await E.detect(B);_.length>0&&_[0].rawValue&&((j=$.current)==null||j.call($,_[0].rawValue))}catch{}G.current===r.SCANNING&&(C=requestAnimationFrame(()=>setTimeout(A,15)))};I.current={_type:"native",reset:()=>{C&&cancelAnimationFrame(C),C=null}},setTimeout(A,300);return}}const[{BrowserMultiFormatReader:t},n]=await Promise.all([Qe(()=>import("./index-4oYbt_M2.js"),__vite__mapDeps([0,1])),Qe(()=>import("./index-D3Mz4UNV.js"),__vite__mapDeps([]))]),l=new Map([[n.DecodeHintType.POSSIBLE_FORMATS,[n.BarcodeFormat.CODE_128,n.BarcodeFormat.ITF,n.BarcodeFormat.CODE_39,n.BarcodeFormat.CODE_93,n.BarcodeFormat.CODABAR,n.BarcodeFormat.EAN_13,n.BarcodeFormat.EAN_8]],[n.DecodeHintType.TRY_HARDER,!0],[n.DecodeHintType.ASSUME_GS1,!1],[n.DecodeHintType.CHARACTER_SET,"UTF-8"]]),m=new t(l,40);I.current=m,m.decodeFromVideoElement(x.current,h=>{var b;z.current||h&&((b=$.current)==null||b.call($,h.getText()))})}catch(t){N("Camera access failed: "+t.message)}}},[L]),ze=s.useCallback(t=>{const n=String(t||"").trim().replace(/\s+/g,"").toUpperCase();if(!(!n||n.length<6||z.current||G.current!==r.SCANNING)){if(z.current=!0,Re.current.has(n)){U([100,50,100,50,100]),xe(),ae(n),setTimeout(()=>{ae(""),z.current=!1},2500);return}clearTimeout(K.current),U([50]),nt(),re(n),Ee(l=>{const m={...l,scanNumber:l.scanNumber+1};return m.scannedAwbs=new Set(l.scannedAwbs),m.scannedAwbs.add(n),Re.current=m.scannedAwbs,m}),K.current=setTimeout(()=>{G.current===r.SCANNING&&d(r.CAPTURING)},Ft)}},[d]);s.useEffect(()=>{$.current=ze},[ze]),s.useEffect(()=>(p===r.SCANNING&&(z.current=!1,Fe()),()=>{p===r.SCANNING&&L()}),[p,Fe,L]);const Te=s.useCallback(async()=>{var t;await L();try{if((t=x.current)!=null&&t.srcObject){de(!0);return}const n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}});x.current&&(x.current.srcObject=n,await x.current.play(),de(!0))}catch(n){N("Camera access failed: "+n.message)}},[L]);s.useEffect(()=>{p===r.CAPTURING&&Te()},[p,Te]),s.useEffect(()=>{if(p!==r.CAPTURING){Se(!1),ke(0),at.current=!1;return}const t=setInterval(()=>{const n=x.current,l=ue.current;if(!n||!l||!n.videoWidth||!n.videoHeight)return;const m=n.getBoundingClientRect(),h=l.getBoundingClientRect(),b=n.videoWidth/Math.max(m.width,1),E=n.videoHeight/Math.max(m.height,1),C=Math.max(0,Math.floor((h.left-m.left)*b)),A=Math.max(0,Math.floor((h.top-m.top)*E)),B=Math.max(24,Math.floor(h.width*b)),j=Math.max(24,Math.floor(h.height*E)),_=document.createElement("canvas"),ee=96,te=72;_.width=ee,_.height=te;const me=_.getContext("2d",{willReadFrequently:!0});if(!me)return;me.drawImage(n,C,A,Math.min(B,n.videoWidth-C),Math.min(j,n.videoHeight-A),0,0,ee,te);const ne=me.getImageData(0,0,ee,te).data;let Ve=0,qe=0,He=0,Xe=0;for(let W=0;W<ne.length;W+=4){const q=.2126*ne[W]+.7152*ne[W+1]+.0722*ne[W+2];Ve+=q,qe+=q*q,W>0&&Math.abs(q-Xe)>26&&He++,Xe=q}const pe=ee*te,ie=Ve/pe,ut=Math.sqrt(Math.max(0,qe/pe-ie*ie)),mt=He/Math.max(pe,1),Ye=ie>35&&ie<225&&ut>24&&mt>.12;Se(Ye),ke(W=>Ye?Math.min(W+1,8):0)},320);return()=>clearInterval(t)},[p]);const Oe=s.useCallback(()=>{const t=x.current,n=ue.current;if(!t||!n||!t.videoWidth)return null;const l=t.getBoundingClientRect(),m=n.getBoundingClientRect(),h=t.videoWidth/l.width,b=t.videoHeight/l.height,E=Math.max(0,(m.left-l.left)*h),C=Math.max(0,(m.top-l.top)*b),A=Math.min(t.videoWidth-E,m.width*h),B=Math.min(t.videoHeight-C,m.height*b),j=document.createElement("canvas");return j.width=Math.min(1200,Math.round(A)),j.height=Math.round(j.width/A*B),j.getContext("2d").drawImage(t,E,C,A,B,0,0,j.width,j.height),j.toDataURL("image/jpeg",.75).split(",")[1]||null},[]),ct=s.useCallback(()=>{X("white"),nt(),U([30]);const t=Oe();if(!t){N("Could not capture image. Try again."),z.current=!1;return}oe(`data:image/jpeg;base64,${t}`),Z(),d(r.PREVIEW)},[Oe,Z,d]),lt=s.useCallback(()=>{if(!S||!D)return;d(r.PROCESSING);const t={scanNumber:O.scanNumber,recentClient:O.dominantClient,dominantClient:O.dominantClient,dominantClientCount:O.dominantClientCount,sessionDurationMin:Math.round((Date.now()-O.startedAt)/6e4)},n=D.split(",")[1]||D,l={awb:S,imageBase64:n,focusImageBase64:n,sessionContext:t};if(!f||!f.connected||y!=="paired"){Ie(l),ge(),H({awb:S,clientCode:"OFFLINE",clientName:"Queued Offline",offlineQueued:!0}),d(r.SUCCESS);return}f.emit("scanner:scan",l),setTimeout(()=>{G.current===r.PROCESSING&&(N("OCR timed out after 40 seconds. Check that GEMINI_API_KEY is set on Railway, then try again."),d(r.ERROR))},4e4)},[f,S,D,O,d,y,Ie]),dt=s.useCallback(()=>{if(!(!f||!o)){if(d(r.APPROVING),o.ocrExtracted||o){const t={clientCode:o.clientCode||"",clientName:o.clientName||"",consignee:o.consignee||"",destination:o.destination||""},n={clientCode:c.clientCode||"",clientName:c.clientCode||"",consignee:c.consignee||"",destination:c.destination||""};f.emit("scanner:learn-corrections",{pin:a,ocrFields:t,approvedFields:n})}f.emit("scanner:approval-submit",{shipmentId:o.shipmentId,awb:o.awb||S,fields:{clientCode:c.clientCode,consignee:c.consignee,destination:c.destination,pincode:c.pincode,weight:parseFloat(c.weight)||0,amount:parseFloat(c.amount)||0,orderNo:c.orderNo||""}},t=>{t!=null&&t.success||(d(r.REVIEWING),N((t==null?void 0:t.message)||"Approval failed."))}),c.clientCode&&c.clientCode!=="MISC"&&Ee(t=>{var m,h;const n={...t.clientFreq};n[c.clientCode]=(n[c.clientCode]||0)+1;const l=Object.entries(n).sort((b,E)=>E[1]-b[1]);return{...t,clientFreq:n,dominantClient:((m=l[0])==null?void 0:m[1])>=2?l[0][0]:null,dominantClientCount:((h=l[0])==null?void 0:h[1])||0}})}},[f,o,c,S,a,d]),V=s.useCallback(()=>{clearTimeout(Q.current),clearTimeout(K.current),re(""),oe(null),Ce(null),k({}),ve({}),H(null),N(""),ae(""),z.current=!1,d(r.SCANNING)},[d]);s.useEffect(()=>{if(p===r.SUCCESS)return Q.current=setTimeout(V,It),()=>clearTimeout(Q.current)},[p,V]),s.useEffect(()=>{if(Y)if(p===r.REVIEWING&&o){const t=[o.clientName||o.clientCode,o.destination,o.weight?`${o.weight} kilograms`:""].filter(Boolean);t.length&&it(t.join(". "))}else p===r.SUCCESS&&v&&it(`${v.clientName||v.clientCode||"Shipment"} Verified.`)},[Y,p,o,v]),s.useEffect(()=>()=>{Z(),clearTimeout(Q.current),clearTimeout(K.current)},[Z]);const T=t=>`msp-step ${p===t?"active":""}`,M=s.useMemo(()=>{if(!o)return{};const t=o.ocrExtracted||o;return{clientCode:{confidence:(t==null?void 0:t.clientNameConfidence)||0,source:(t==null?void 0:t.clientNameSource)||null},consignee:{confidence:(t==null?void 0:t.consigneeConfidence)||0,source:(t==null?void 0:t.consigneeSource)||null},destination:{confidence:(t==null?void 0:t.destinationConfidence)||0,source:(t==null?void 0:t.destinationSource)||null},pincode:{confidence:(t==null?void 0:t.pincodeConfidence)||0,source:null},weight:{confidence:(t==null?void 0:t.weightConfidence)||0,source:null}}},[o]),u=((Pe=o==null?void 0:o.ocrExtracted)==null?void 0:Pe.intelligence)||(o==null?void 0:o.intelligence)||null;return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:zt}),e.jsxs("div",{className:"msp-root",children:[Ne&&e.jsx("div",{className:`flash-overlay flash-${Ne}`,onAnimationEnd:()=>X(null)}),we&&e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[e.jsx(Ke,{size:48,color:"white"}),e.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),e.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:we}),e.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),e.jsx("div",{className:T(r.IDLE),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:y==="connecting"?e.jsx(he,{size:28,color:i.primary,style:{animation:"spin 1s linear infinite"}}):e.jsx(Je,{size:28,color:i.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:y==="connecting"?"Connecting...":"Disconnected"}),e.jsx("div",{style:{fontSize:"0.82rem",color:i.muted},children:ye||`Connecting to session ${a}`})]}),y==="disconnected"&&e.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[e.jsx(he,{size:16})," Reconnect"]})]})}),e.jsx("video",{ref:x,autoPlay:!0,playsInline:!0,muted:!0,style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(p===r.SCANNING||p===r.CAPTURING)&&!P.current?"block":"none"}}),e.jsx("div",{className:T(r.SCANNING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[e.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:P.current?"block":"none"}}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{className:"scan-guide",style:{width:et.w,height:et.h,borderRadius:10,maxHeight:"20vw"},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"}),e.jsx("div",{className:"scan-laser"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(gt,{size:12})," ",a]}),e.jsxs("div",{className:"cam-hud-chip",style:{gap:4},children:[e.jsx(xt,{size:12})," ",O.scanNumber,typeof window<"u"&&typeof window.BarcodeDetector<"u"?e.jsx("span",{style:{color:"#34D399",fontSize:"0.6rem",fontWeight:800},children:"⚡ NATIVE"}):e.jsx("span",{style:{color:"#F59E0B",fontSize:"0.6rem",fontWeight:800},children:"ZXING"})]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:"Align barcode inside the strip"}),e.jsx("div",{style:{display:"flex",gap:12},children:e.jsx("button",{className:"cam-hud-chip",onClick:()=>ot(!Y),style:{border:"none",cursor:"pointer"},children:Y?e.jsx(bt,{size:14}):e.jsx(yt,{size:14})})})]})]})}),e.jsx("div",{className:T(r.CAPTURING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!le&&e.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[e.jsx(vt,{size:44,color:"#34D399"}),e.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:S}),e.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:"Barcode locked · Preparing camera…"})]}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{ref:ue,className:`scan-guide ${ce?"detected":""}`,style:{width:tt.w,height:tt.h,maxHeight:"75vh",borderRadius:12},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[e.jsx(Ct,{size:12})," ",S]}),w.length>0&&e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(Nt,{size:12})," ",w.length," queued"]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:ce?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center",transition:"color 0.3s"},children:ce?"✓ AWB in frame — press shutter":"Fit the AWB slip inside the frame"}),e.jsx("button",{className:"capture-btn",onClick:ct,disabled:!le,style:{opacity:le?1:.4},children:e.jsx("div",{className:"capture-btn-inner"})}),e.jsx("button",{style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},onClick:()=>{re(""),z.current=!1,d(r.SCANNING)},children:"← Rescan barcode"})]})]})}),e.jsx("div",{className:T(r.PREVIEW),children:e.jsxs("div",{style:{background:i.bg,display:"flex",flexDirection:"column",height:"100%"},children:[e.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${i.border}`},children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.72rem",color:i.muted,fontWeight:600},children:"CAPTURED"}),e.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:S})]})}),e.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:D&&e.jsx("img",{src:D,alt:"Captured label",className:"preview-img"})}),e.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{oe(null),d(r.CAPTURING)},children:[e.jsx(Ze,{size:16})," Retake"]}),e.jsxs("button",{className:"btn btn-primary",style:{flex:2},onClick:lt,children:[e.jsx(wt,{size:16})," Use Photo"]})]})]})}),e.jsx("div",{className:T(r.PROCESSING),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16},children:[e.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[e.jsx(jt,{size:22,color:i.primary,style:{animation:"spin 2s linear infinite"}}),e.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:i.primary},children:"Intelligence Engine"})]}),e.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:i.muted},children:S}),e.jsx("div",{style:{fontSize:"0.72rem",color:i.mutedLight,marginTop:6},children:"Reading AWB label with Gemini Vision…"})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(t=>e.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:t}),e.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),e.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},t)),e.jsx("div",{style:{textAlign:"center",marginTop:8},children:e.jsx("button",{className:"btn btn-outline",style:{fontSize:"0.75rem",padding:"8px 20px"},onClick:()=>{N("Cancelled by user."),d(r.ERROR)},children:"Cancel"})})]})}),e.jsx("div",{className:T(r.REVIEWING),children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%"},children:[e.jsxs("div",{style:{padding:"14px 20px",borderBottom:`1px solid ${i.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.65rem",color:i.muted,fontWeight:600},children:"REVIEW EXTRACTION"}),e.jsx("div",{className:"mono",style:{fontSize:"0.95rem",fontWeight:700},children:(o==null?void 0:o.awb)||S})]}),(u==null?void 0:u.learnedFieldCount)>0&&e.jsxs("div",{className:"source-badge source-learned",children:["🧠 ",u.learnedFieldCount," auto-corrected"]})]}),e.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsxs("div",{className:`field-card ${(((Me=M.clientCode)==null?void 0:Me.confidence)||0)<.55?"warning":""}`,children:[e.jsx("div",{className:be(((Be=M.clientCode)==null?void 0:Be.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((_e=M.clientCode)==null?void 0:_e.source)&&(()=>{const t=st(M.clientCode.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:c.clientCode||"",onChange:t=>k(n=>({...n,clientCode:t.target.value.toUpperCase()})),placeholder:"Client code"}),((We=u==null?void 0:u.clientMatches)==null?void 0:We.length)>0&&u.clientNeedsConfirmation&&e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:u.clientMatches.slice(0,3).map(t=>e.jsxs("button",{onClick:()=>k(n=>({...n,clientCode:t.code})),style:{fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:`1px solid ${i.border}`,background:c.clientCode===t.code?i.primaryLight:i.surface,color:i.text,cursor:"pointer",fontFamily:"inherit",fontWeight:500},children:[t.code," (",Math.round(t.score*100),"%)"]},t.code))})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:be((($e=M.consignee)==null?void 0:$e.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Consignee"}),e.jsx("input",{className:"field-input",value:c.consignee||"",onChange:t=>k(n=>({...n,consignee:t.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:be(((De=M.destination)==null?void 0:De.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((Ge=M.destination)==null?void 0:Ge.source)&&(()=>{const t=st(M.destination.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:c.destination||"",onChange:t=>k(n=>({...n,destination:t.target.value.toUpperCase()})),placeholder:"City"}),(u==null?void 0:u.pincodeCity)&&u.pincodeCity!==c.destination&&e.jsxs("button",{onClick:()=>k(t=>({...t,destination:u.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:i.successLight,color:i.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["📍 Pincode suggests: ",u.pincodeCity]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Pincode"}),e.jsx("input",{className:"field-input",value:c.pincode||"",onChange:t=>k(n=>({...n,pincode:t.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),e.jsx("div",{className:`field-card ${(Le=u==null?void 0:u.weightAnomaly)!=null&&Le.anomaly?"warning":""}`,children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Weight (kg)"}),e.jsx("input",{className:"field-input",value:c.weight||"",onChange:t=>k(n=>({...n,weight:t.target.value})),placeholder:"0.0",inputMode:"decimal"}),((Ue=u==null?void 0:u.weightAnomaly)==null?void 0:Ue.anomaly)&&e.jsxs("div",{style:{fontSize:"0.6rem",color:i.warning,marginTop:2,fontWeight:500},children:["⚠️ ",u.weightAnomaly.warning]})]})})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Amount (₹)"}),e.jsx("input",{className:"field-input",value:c.amount||"",onChange:t=>k(n=>({...n,amount:t.target.value})),placeholder:"0",inputMode:"decimal"})]})}),e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Order No"}),e.jsx("input",{className:"field-input",value:c.orderNo||"",onChange:t=>k(n=>({...n,orderNo:t.target.value})),placeholder:"Optional"})]})})]})]}),e.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${i.border}`,display:"flex",gap:10},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:V,children:[e.jsx(St,{size:16})," Skip"]}),e.jsxs("button",{className:"btn btn-success btn-lg",style:{flex:2},onClick:dt,disabled:p===r.APPROVING,children:[p===r.APPROVING?e.jsx(he,{size:16,style:{animation:"spin 1s linear infinite"}}):e.jsx(kt,{size:16}),p===r.APPROVING?"Saving...":"Approve & Save"]})]})]})}),e.jsx("div",{className:T(r.APPROVING)}),e.jsx("div",{className:T(r.SUCCESS),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[e.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:i.success,strokeWidth:"3",className:"success-check-circle"}),e.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:i.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:i.success,marginBottom:4},children:"Saved Successfully"}),e.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700},children:v==null?void 0:v.awb}),(v==null?void 0:v.clientCode)&&e.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:i.primaryLight,color:i.primary,fontSize:"0.78rem",fontWeight:600},children:v.clientName||v.clientCode})]}),e.jsx("div",{style:{fontSize:"0.72rem",color:i.muted},children:v!=null&&v.offlineQueued?`${w.length} queued for sync • Auto-continuing in 3s`:`#${O.scanNumber} scanned • Auto-continuing in 3s`}),e.jsxs("button",{className:"btn btn-primary btn-lg btn-full",onClick:V,style:{maxWidth:320},children:[e.jsx(Et,{size:18})," Scan Next Parcel"]})]})}),e.jsx("div",{className:T(r.ERROR),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(Ke,{size:32,color:i.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:i.error},children:"Scan Error"}),e.jsx("div",{style:{fontSize:"0.82rem",color:i.muted,marginTop:4},children:ye})]}),e.jsxs("button",{className:"btn btn-primary",onClick:V,children:[e.jsx(Ze,{size:16})," Try Again"]})]})}),y==="disconnected"&&p!==r.IDLE&&e.jsxs("div",{className:"offline-banner",children:[e.jsx(Je,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline — Reconnecting... ",w.length?`(${w.length} queued)`:""]})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{Ut as default};
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/index-4oYbt_M2.js","assets/index-D3Mz4UNV.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
