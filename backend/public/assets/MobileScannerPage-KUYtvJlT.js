import{l as dt,_ as qe}from"./index-DRCMpwG1.js";import{j as e}from"./page-landing-Bx5c8M2c.js";import{r as s}from"./vendor-helmet-Dwc3L0SQ.js";import{c as ut,u as mt}from"./vendor-react-DGJm5saH.js";import{b as Xe,R as de,aD as Ke,aE as ht,z as pt,aF as gt,aG as ft,au as xt,aH as bt,d as yt,aI as He,O as vt,ax as Ct,X as jt,aJ as Nt,aK as wt}from"./vendor-icons-o7elvlXJ.js";import"./page-import-KrbyjuuQ.js";import"./page-reconcile-p5UREp47.js";import"./page-rate-calc-_eH7d9Js.js";var St={};const kt=window.location.origin,Qe=St.VITE_SCANBOT_LICENSE_KEY||"",ee={widthPct:.72,heightPct:.38},Ye={widthPct:.88,heightPct:.55},Et=3500,Rt="mobile_scanner_offline_queue",r={IDLE:"IDLE",SCANNING:"SCANNING",BARCODE_LOCKED:"BARCODE_LOCKED",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"},M=c=>{var g;try{(g=navigator==null?void 0:navigator.vibrate)==null||g.call(navigator,c)}catch{}},te=(c,g,p="sine")=>{try{const A=new(window.AudioContext||window.webkitAudioContext),f=A.createOscillator(),S=A.createGain();f.type=p,f.frequency.setValueAtTime(c,A.currentTime),S.gain.setValueAtTime(.12,A.currentTime),S.gain.exponentialRampToValueAtTime(.01,A.currentTime+g),f.connect(S),S.connect(A.destination),f.start(),f.stop(A.currentTime+g)}catch{}},ue=()=>{te(880,.12),setTimeout(()=>te(1100,.1),130)},Je=()=>te(600,.08),me=()=>te(200,.25,"sawtooth"),Ze=c=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const g=new SpeechSynthesisUtterance(c);g.rate=1.2,g.pitch=1,g.lang="en-IN",window.speechSynthesis.speak(g)}catch{}},i={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},It=`
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
  display: flex; flex-direction: column;
  opacity: 0; transform: translateX(40px);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
  z-index: 1;
}
.msp-step.active {
  opacity: 1; transform: translateX(0);
  pointer-events: all; z-index: 2;
}
.msp-step.exiting {
  opacity: 0; transform: translateX(-40px);
  pointer-events: none;
}

/* ── Camera viewport ── */
.cam-viewport {
  position: relative; width: 100%; flex: 1;
  background: #000; overflow: hidden;
}
.cam-viewport video {
  width: 100%; height: 100%; object-fit: cover;
}
.cam-overlay {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
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
`,At=c=>c>=.85?"high":c>=.55?"med":"low",he=c=>`conf-dot conf-${At(c)}`,et=c=>c==="learned"?{className:"source-badge source-learned",icon:"🧠",text:"Learned"}:c==="fuzzy_match"?{className:"source-badge source-ai",icon:"🔍",text:"Matched"}:c==="fuzzy_history"||c==="consignee_pattern"?{className:"source-badge source-history",icon:"📊",text:"History"}:c==="delhivery_pincode"||c==="india_post"||c==="pincode_lookup"||c==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"📍",text:"Pincode"}:null;function Lt(){var Pe,ze,Fe,$e,Te,Oe,We,Be,Me,Le;const{pin:c}=ut();mt();const g=`${Rt}:${c||"unknown"}`,[p,A]=s.useState(null),[f,S]=s.useState("connecting"),[pe,j]=s.useState(""),[d,tt]=s.useState(r.IDLE),[nt,it]=s.useState(null),[N,ge]=s.useState(""),[W,ne]=s.useState(null),[Pt,fe]=s.useState({}),[o,xe]=s.useState(null),[l,w]=s.useState({}),[x,D]=s.useState(null),[be,G]=s.useState(null),[ye,ie]=s.useState(""),[y,ve]=s.useState([]),[se,Ce]=s.useState(!1),[je,Ne]=s.useState(0),[k,we]=s.useState({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now()}),[U,st]=s.useState(!1),v=s.useRef(null),re=s.useRef(null),V=s.useRef(null),B=s.useRef(null),$=s.useRef(!1),q=s.useRef(null),oe=s.useRef(!1),X=s.useCallback(t=>{ve(t);try{t.length?localStorage.setItem(g,JSON.stringify(t)):localStorage.removeItem(g)}catch{}},[g]),Se=s.useCallback(t=>{const n={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:t};return X([...y,n]),n},[y,X]),ke=s.useCallback(()=>{!p||!p.connected||!y.length||(y.forEach(t=>{var n,a;!((n=t==null?void 0:t.payload)!=null&&n.awb)||!((a=t==null?void 0:t.payload)!=null&&a.imageBase64)||p.emit("scanner:scan",t.payload)}),X([]))},[p,y,X]),h=s.useCallback(t=>{tt(n=>(it(n),t))},[]);s.useEffect(()=>{if(!c){j("No PIN provided.");return}const t=dt(kt,{auth:{scannerPin:c},transports:["websocket","polling"],reconnection:!0,reconnectionDelay:1500,reconnectionAttempts:20});return t.on("connect",()=>S("connecting")),t.on("scanner:paired",()=>{S("paired"),h(r.SCANNING)}),t.on("scanner:error",({message:n})=>{j(n),S("disconnected")}),t.on("scanner:session-ended",()=>{S("disconnected"),j("Session ended by desktop.")}),t.on("disconnect",()=>S("disconnected")),t.on("reconnect",()=>{f==="paired"&&h(r.SCANNING)}),t.on("scanner:scan-processed",n=>{if(n.status==="error"){G("error"),me(),M([100,50,100]),h(r.ERROR),j(n.error||"Scan failed on desktop.");return}xe(n),w({clientCode:n.clientCode||"",consignee:n.consignee||"",destination:n.destination||"",pincode:n.pincode||"",weight:n.weight||0,amount:n.amount||0,orderNo:n.orderNo||""}),fe({}),n.reviewRequired?h(r.REVIEWING):(ue(),M([50,30,50]),D({awb:n.awb,clientCode:n.clientCode,clientName:n.clientName}),h(r.SUCCESS))}),t.on("scanner:approval-result",({success:n,message:a,awb:m})=>{n?(ue(),M([50,30,50]),G("success"),D({awb:(o==null?void 0:o.awb)||m,clientCode:l.clientCode,clientName:(o==null?void 0:o.clientName)||l.clientCode}),h(r.SUCCESS)):(me(),j(a||"Approval failed."))}),t.on("scanner:ready-for-next",()=>{}),A(t),()=>{t.disconnect()}},[c]),s.useEffect(()=>{try{const t=localStorage.getItem(g);if(!t)return;const n=JSON.parse(t);Array.isArray(n)&&n.length&&ve(n)}catch{}},[g]),s.useEffect(()=>{f==="paired"&&(p!=null&&p.connected)&&y.length&&ke()},[f,p,y.length,ke]);const E=s.useCallback(async()=>{var t;try{if(B.current){try{const n=B.current;n!=null&&n.barcodeScanner&&await n.barcodeScanner.dispose()}catch{}B.current=null}if(V.current){try{await V.current.reset()}catch{}V.current=null}(t=v.current)!=null&&t.srcObject&&(v.current.srcObject.getTracks().forEach(n=>n.stop()),v.current.srcObject=null)}catch{}$.current=!1},[]),Ee=s.useCallback(async()=>{if(v.current){await E();try{if(Qe)try{const m=await(await qe(()=>import("./index-OhzldbFf.js").then(b=>b.i),__vite__mapDeps([0,1]))).default.initialize({licenseKey:Qe,enginePath:"/scanbot-sdk/"}),C={containerId:"scanbot-camera-container",onBarcodesDetected:b=>{var z;if($.current)return;const I=(z=b==null?void 0:b.barcodes)==null?void 0:z[0];I!=null&&I.text&&Re(I.text)},style:{window:{widthProportion:ee.widthPct,heightProportion:ee.heightPct}}},P=await m.createBarcodeScanner(C);B.current={sdk:m,barcodeScanner:P};return}catch(a){console.warn("Scanbot init failed, falling back to ZXing:",a.message)}const{BrowserMultiFormatReader:t}=await qe(()=>import("./index-S8vgl5Ss.js"),__vite__mapDeps([])),n=new t;V.current=n,await n.decodeFromVideoDevice(void 0,v.current,a=>{$.current||a&&Re(a.getText())})}catch(t){j("Camera access failed: "+t.message)}}},[E]),Re=s.useCallback(t=>{const n=String(t||"").trim();if(!(!n||n.length<6||$.current)){if($.current=!0,k.scannedAwbs.has(n)){M([100,50,100,50,100]),me(),ie(n),setTimeout(()=>{ie(""),$.current=!1},2500);return}M([50]),Je(),ge(n),h(r.BARCODE_LOCKED),we(a=>{const m={...a,scanNumber:a.scanNumber+1};return m.scannedAwbs=new Set(a.scannedAwbs),m.scannedAwbs.add(n),m}),setTimeout(()=>h(r.CAPTURING),600)}},[k,h]);s.useEffect(()=>(d===r.SCANNING&&($.current=!1,Ee()),()=>{d===r.SCANNING&&E()}),[d,Ee,E]);const Ie=s.useCallback(async()=>{await E();try{const t=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}});v.current&&(v.current.srcObject=t,await v.current.play())}catch(t){j("Camera access failed: "+t.message)}},[E]);s.useEffect(()=>{d===r.CAPTURING&&Ie()},[d,Ie]),s.useEffect(()=>{if(d!==r.CAPTURING){Ce(!1),Ne(0),oe.current=!1;return}const t=setInterval(()=>{const n=v.current,a=re.current;if(!n||!a||!n.videoWidth||!n.videoHeight)return;const m=n.getBoundingClientRect(),C=a.getBoundingClientRect(),P=n.videoWidth/Math.max(m.width,1),b=n.videoHeight/Math.max(m.height,1),I=Math.max(0,Math.floor((C.left-m.left)*P)),z=Math.max(0,Math.floor((C.top-m.top)*b)),K=Math.max(24,Math.floor(C.width*P)),F=Math.max(24,Math.floor(C.height*b)),H=document.createElement("canvas"),Q=96,Y=72;H.width=Q,H.height=Y;const ce=H.getContext("2d",{willReadFrequently:!0});if(!ce)return;ce.drawImage(n,I,z,Math.min(K,n.videoWidth-I),Math.min(F,n.videoHeight-z),0,0,Q,Y);const J=ce.getImageData(0,0,Q,Y).data;let _e=0,De=0,Ge=0,Ue=0;for(let O=0;O<J.length;O+=4){const _=.2126*J[O]+.7152*J[O+1]+.0722*J[O+2];_e+=_,De+=_*_,O>0&&Math.abs(_-Ue)>26&&(Ge+=1),Ue=_}const le=Q*Y,Z=_e/le,at=Math.max(0,De/le-Z*Z),ct=Math.sqrt(at),lt=Ge/Math.max(le,1),Ve=Z>35&&Z<225&&ct>24&&lt>.12;Ce(Ve),Ne(O=>Ve?Math.min(O+1,8):0)},320);return()=>clearInterval(t)},[d]);const Ae=s.useCallback(()=>{const t=v.current,n=re.current;if(!t||!n||!t.videoWidth)return null;const a=t.getBoundingClientRect(),m=n.getBoundingClientRect(),C=t.videoWidth/a.width,P=t.videoHeight/a.height,b=Math.max(0,(m.left-a.left)*C),I=Math.max(0,(m.top-a.top)*P),z=Math.min(t.videoWidth-b,m.width*C),K=Math.min(t.videoHeight-I,m.height*P),F=document.createElement("canvas");return F.width=Math.min(1800,Math.round(z)),F.height=Math.round(F.width/z*K),F.getContext("2d").drawImage(t,b,I,z,K,0,0,F.width,F.height),F.toDataURL("image/jpeg",.92).split(",")[1]||null},[]),ae=s.useCallback(()=>{G("white"),Je(),M([30]);const t=Ae();if(!t){j("Could not capture image. Try again.");return}ne(`data:image/jpeg;base64,${t}`),E(),h(r.PREVIEW)},[Ae,E,h]);s.useEffect(()=>{d===r.CAPTURING&&(je<3||oe.current||(oe.current=!0,ae()))},[je,d,ae]);const rt=s.useCallback(()=>{if(!N||!W)return;h(r.PROCESSING);const t={scanNumber:k.scanNumber,recentClient:k.dominantClient,dominantClient:k.dominantClient,dominantClientCount:k.dominantClientCount,sessionDurationMin:Math.round((Date.now()-k.startedAt)/6e4)},n=W.split(",")[1]||W,a={awb:N,imageBase64:n,focusImageBase64:n,sessionContext:t};if(!p||!p.connected||f!=="paired"){Se(a),ue(),D({awb:N,clientCode:"OFFLINE",clientName:"Queued Offline",offlineQueued:!0}),h(r.SUCCESS);return}p.emit("scanner:scan",a),setTimeout(()=>{d===r.PROCESSING&&j("Processing is taking longer than expected...")},2e4)},[p,N,W,k,d,h,f,Se]),ot=s.useCallback(()=>{if(!(!p||!o)){if(h(r.APPROVING),o.ocrExtracted||o){const t={clientCode:o.clientCode||"",clientName:o.clientName||"",consignee:o.consignee||"",destination:o.destination||""},n={clientCode:l.clientCode||"",clientName:l.clientCode||"",consignee:l.consignee||"",destination:l.destination||""};p.emit("scanner:learn-corrections",{pin:c,ocrFields:t,approvedFields:n})}p.emit("scanner:approval-submit",{shipmentId:o.shipmentId,awb:o.awb||N,fields:{clientCode:l.clientCode,consignee:l.consignee,destination:l.destination,pincode:l.pincode,weight:parseFloat(l.weight)||0,amount:parseFloat(l.amount)||0,orderNo:l.orderNo||""}},t=>{t!=null&&t.success||(h(r.REVIEWING),j((t==null?void 0:t.message)||"Approval failed."))}),l.clientCode&&l.clientCode!=="MISC"&&we(t=>{var m,C;const n={...t.clientFreq};n[l.clientCode]=(n[l.clientCode]||0)+1;const a=Object.entries(n).sort((P,b)=>b[1]-P[1]);return{...t,clientFreq:n,dominantClient:((m=a[0])==null?void 0:m[1])>=2?a[0][0]:null,dominantClientCount:((C=a[0])==null?void 0:C[1])||0}})}},[p,o,l,N,c,h]),L=s.useCallback(()=>{clearTimeout(q.current),ge(""),ne(null),xe(null),w({}),fe({}),D(null),j(""),ie(""),$.current=!1,h(r.SCANNING)},[h]);s.useEffect(()=>{if(d===r.SUCCESS)return q.current=setTimeout(L,Et),()=>clearTimeout(q.current)},[d,L]),s.useEffect(()=>{if(U)if(d===r.REVIEWING&&o){const t=[o.clientName||o.clientCode,o.destination,o.weight?`${o.weight} kilograms`:""].filter(Boolean);t.length&&Ze(t.join(". "))}else d===r.SUCCESS&&x&&Ze(`${x.clientName||x.clientCode||"Shipment"} Verified.`)},[U,d,o,x]),s.useEffect(()=>()=>{E(),clearTimeout(q.current)},[E]);const R=t=>`msp-step ${d===t?"active":""} ${nt===t?"exiting":""}`,T=s.useMemo(()=>{if(!o)return{};const t=o.ocrExtracted||o;return{clientCode:{confidence:(t==null?void 0:t.clientNameConfidence)||0,source:(t==null?void 0:t.clientNameSource)||null},consignee:{confidence:(t==null?void 0:t.consigneeConfidence)||0,source:(t==null?void 0:t.consigneeSource)||null},destination:{confidence:(t==null?void 0:t.destinationConfidence)||0,source:(t==null?void 0:t.destinationSource)||null},pincode:{confidence:(t==null?void 0:t.pincodeConfidence)||0,source:null},weight:{confidence:(t==null?void 0:t.weightConfidence)||0,source:null}}},[o]),u=((Pe=o==null?void 0:o.ocrExtracted)==null?void 0:Pe.intelligence)||(o==null?void 0:o.intelligence)||null;return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:It}),e.jsxs("div",{className:"msp-root",children:[be&&e.jsx("div",{className:`flash-overlay flash-${be}`,onAnimationEnd:()=>G(null)}),ye&&e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[e.jsx(Xe,{size:48,color:"white"}),e.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),e.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:ye}),e.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),e.jsx("div",{className:R(r.IDLE),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:f==="connecting"?e.jsx(de,{size:28,color:i.primary,style:{animation:"spin 1s linear infinite"}}):e.jsx(Ke,{size:28,color:i.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:f==="connecting"?"Connecting...":"Disconnected"}),e.jsx("div",{style:{fontSize:"0.82rem",color:i.muted},children:pe||`Connecting to session ${c}`})]}),f==="disconnected"&&e.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[e.jsx(de,{size:16})," Reconnect"]})]})}),e.jsx("div",{className:R(r.SCANNING),children:e.jsxs("div",{className:"cam-viewport",children:[!B.current&&e.jsx("video",{ref:v,autoPlay:!0,playsInline:!0,muted:!0,style:{width:"100%",height:"100%",objectFit:"cover"}}),e.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:B.current?"block":"none"}}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{className:"scan-guide",style:{width:`${ee.widthPct*100}%`,height:`${ee.heightPct*100}%`},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"}),e.jsx("div",{className:"scan-laser"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(ht,{size:12})," ",c]}),e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(pt,{size:12})," ",k.scanNumber]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:"Point camera at barcode"}),e.jsx("div",{style:{display:"flex",gap:12},children:e.jsx("button",{className:"cam-hud-chip",onClick:()=>st(!U),style:{border:"none",cursor:"pointer"},children:U?e.jsx(gt,{size:14}):e.jsx(ft,{size:14})})})]})]})}),e.jsx("div",{className:R(r.BARCODE_LOCKED),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:i.successLight,gap:16},children:[e.jsx(xt,{size:48,color:i.success}),e.jsx("div",{className:"mono",style:{fontSize:"1.5rem",fontWeight:700,color:i.success},children:N}),e.jsx("div",{style:{color:i.muted,fontSize:"0.82rem"},children:"Barcode locked • Preparing camera..."})]})}),e.jsx("div",{className:R(r.CAPTURING),children:e.jsxs("div",{className:"cam-viewport",children:[e.jsx("video",{ref:d===r.CAPTURING?v:void 0,autoPlay:!0,playsInline:!0,muted:!0,style:{width:"100%",height:"100%",objectFit:"cover"}}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{ref:re,className:`scan-guide ${se?"detected":""}`,style:{width:`${Ye.widthPct*100}%`,height:`${Ye.heightPct*100}%`},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[e.jsx(bt,{size:12})," ",N]}),y.length>0&&e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(yt,{size:12})," ",y.length," queued"]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:500,textAlign:"center"},children:"Place AWB slip inside the frame"}),e.jsx("div",{style:{color:se?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.72)",fontSize:"0.72rem",fontWeight:700},children:se?"Document detected - auto-capturing":"Auto-detecting document edges..."}),e.jsx("button",{className:"capture-btn",onClick:ae,children:e.jsx("div",{className:"capture-btn-inner"})})]})]})}),e.jsx("div",{className:R(r.PREVIEW),children:e.jsxs("div",{style:{background:i.bg,display:"flex",flexDirection:"column",height:"100%"},children:[e.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${i.border}`},children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.72rem",color:i.muted,fontWeight:600},children:"CAPTURED"}),e.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:N})]})}),e.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:W&&e.jsx("img",{src:W,alt:"Captured label",className:"preview-img"})}),e.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{ne(null),h(r.CAPTURING)},children:[e.jsx(He,{size:16})," Retake"]}),e.jsxs("button",{className:"btn btn-primary",style:{flex:2},onClick:rt,children:[e.jsx(vt,{size:16})," Use Photo"]})]})]})}),e.jsx("div",{className:R(r.PROCESSING),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16},children:[e.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[e.jsx(Ct,{size:22,color:i.primary,style:{animation:"spin 2s linear infinite"}}),e.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:i.primary},children:"Intelligence Engine"})]}),e.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:i.muted},children:N})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(t=>e.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:t}),e.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),e.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},t))]})}),e.jsx("div",{className:R(r.REVIEWING),children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%"},children:[e.jsxs("div",{style:{padding:"14px 20px",borderBottom:`1px solid ${i.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.65rem",color:i.muted,fontWeight:600},children:"REVIEW EXTRACTION"}),e.jsx("div",{className:"mono",style:{fontSize:"0.95rem",fontWeight:700},children:(o==null?void 0:o.awb)||N})]}),(u==null?void 0:u.learnedFieldCount)>0&&e.jsxs("div",{className:"source-badge source-learned",children:["🧠 ",u.learnedFieldCount," auto-corrected"]})]}),e.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsxs("div",{className:`field-card ${(((ze=T.clientCode)==null?void 0:ze.confidence)||0)<.55?"warning":""}`,children:[e.jsx("div",{className:he(((Fe=T.clientCode)==null?void 0:Fe.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),(($e=T.clientCode)==null?void 0:$e.source)&&(()=>{const t=et(T.clientCode.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:l.clientCode||"",onChange:t=>w(n=>({...n,clientCode:t.target.value.toUpperCase()})),placeholder:"Client code"}),((Te=u==null?void 0:u.clientMatches)==null?void 0:Te.length)>0&&u.clientNeedsConfirmation&&e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:u.clientMatches.slice(0,3).map(t=>e.jsxs("button",{onClick:()=>w(n=>({...n,clientCode:t.code})),style:{fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:`1px solid ${i.border}`,background:l.clientCode===t.code?i.primaryLight:i.surface,color:i.text,cursor:"pointer",fontFamily:"inherit",fontWeight:500},children:[t.code," (",Math.round(t.score*100),"%)"]},t.code))})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:he(((Oe=T.consignee)==null?void 0:Oe.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Consignee"}),e.jsx("input",{className:"field-input",value:l.consignee||"",onChange:t=>w(n=>({...n,consignee:t.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:he(((We=T.destination)==null?void 0:We.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((Be=T.destination)==null?void 0:Be.source)&&(()=>{const t=et(T.destination.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:l.destination||"",onChange:t=>w(n=>({...n,destination:t.target.value.toUpperCase()})),placeholder:"City"}),(u==null?void 0:u.pincodeCity)&&u.pincodeCity!==l.destination&&e.jsxs("button",{onClick:()=>w(t=>({...t,destination:u.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:i.successLight,color:i.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["📍 Pincode suggests: ",u.pincodeCity]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Pincode"}),e.jsx("input",{className:"field-input",value:l.pincode||"",onChange:t=>w(n=>({...n,pincode:t.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),e.jsx("div",{className:`field-card ${(Me=u==null?void 0:u.weightAnomaly)!=null&&Me.anomaly?"warning":""}`,children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Weight (kg)"}),e.jsx("input",{className:"field-input",value:l.weight||"",onChange:t=>w(n=>({...n,weight:t.target.value})),placeholder:"0.0",inputMode:"decimal"}),((Le=u==null?void 0:u.weightAnomaly)==null?void 0:Le.anomaly)&&e.jsxs("div",{style:{fontSize:"0.6rem",color:i.warning,marginTop:2,fontWeight:500},children:["⚠️ ",u.weightAnomaly.warning]})]})})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Amount (₹)"}),e.jsx("input",{className:"field-input",value:l.amount||"",onChange:t=>w(n=>({...n,amount:t.target.value})),placeholder:"0",inputMode:"decimal"})]})}),e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Order No"}),e.jsx("input",{className:"field-input",value:l.orderNo||"",onChange:t=>w(n=>({...n,orderNo:t.target.value})),placeholder:"Optional"})]})})]})]}),e.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${i.border}`,display:"flex",gap:10},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:L,children:[e.jsx(jt,{size:16})," Skip"]}),e.jsxs("button",{className:"btn btn-success btn-lg",style:{flex:2},onClick:ot,disabled:d===r.APPROVING,children:[d===r.APPROVING?e.jsx(de,{size:16,style:{animation:"spin 1s linear infinite"}}):e.jsx(Nt,{size:16}),d===r.APPROVING?"Saving...":"Approve & Save"]})]})]})}),e.jsx("div",{className:R(r.APPROVING)}),e.jsx("div",{className:R(r.SUCCESS),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[e.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:i.success,strokeWidth:"3",className:"success-check-circle"}),e.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:i.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:i.success,marginBottom:4},children:"Saved Successfully"}),e.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700},children:x==null?void 0:x.awb}),(x==null?void 0:x.clientCode)&&e.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:i.primaryLight,color:i.primary,fontSize:"0.78rem",fontWeight:600},children:x.clientName||x.clientCode})]}),e.jsx("div",{style:{fontSize:"0.72rem",color:i.muted},children:x!=null&&x.offlineQueued?`${y.length} queued for sync • Auto-continuing in 3s`:`#${k.scanNumber} scanned • Auto-continuing in 3s`}),e.jsxs("button",{className:"btn btn-primary btn-lg btn-full",onClick:L,style:{maxWidth:320},children:[e.jsx(wt,{size:18})," Scan Next Parcel"]})]})}),e.jsx("div",{className:R(r.ERROR),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(Xe,{size:32,color:i.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:i.error},children:"Scan Error"}),e.jsx("div",{style:{fontSize:"0.82rem",color:i.muted,marginTop:4},children:pe})]}),e.jsxs("button",{className:"btn btn-primary",onClick:L,children:[e.jsx(He,{size:16})," Try Again"]})]})}),f==="disconnected"&&d!==r.IDLE&&e.jsxs("div",{className:"offline-banner",children:[e.jsx(Ke,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline — Reconnecting... ",y.length?`(${y.length} queued)`:""]})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{Lt as default};
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/index-OhzldbFf.js","assets/vendor-helmet-Dwc3L0SQ.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
