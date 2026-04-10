import{l as mt,_ as pe}from"./index-C3OHZwws.js";import{j as e}from"./page-landing-Bx5c8M2c.js";import{r as s}from"./vendor-helmet-Dwc3L0SQ.js";import{c as pt,u as ht}from"./vendor-react-DGJm5saH.js";import{b as Qe,R as he,aD as Je,aE as gt,z as ft,aF as xt,aG as bt,au as yt,aH as vt,d as Ct,aI as Ze,O as Nt,ax as jt,X as wt,aJ as St,aK as kt}from"./vendor-icons-o7elvlXJ.js";import"./page-import-KrbyjuuQ.js";import"./page-reconcile-p5UREp47.js";import"./page-rate-calc-_eH7d9Js.js";var Et={};const Rt=window.location.origin,et=Et.VITE_SCANBOT_LICENSE_KEY||"",te={widthPct:.72,heightPct:.38},tt={widthPct:.88,heightPct:.55},It=3500,At="mobile_scanner_offline_queue",Pt=280,r={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"},M=a=>{var g;try{(g=navigator==null?void 0:navigator.vibrate)==null||g.call(navigator,a)}catch{}},ne=(a,g,h="sine")=>{try{const I=new(window.AudioContext||window.webkitAudioContext),f=I.createOscillator(),k=I.createGain();f.type=h,f.frequency.setValueAtTime(a,I.currentTime),k.gain.setValueAtTime(.12,I.currentTime),k.gain.exponentialRampToValueAtTime(.01,I.currentTime+g),f.connect(k),k.connect(I.destination),f.start(),f.stop(I.currentTime+g)}catch{}},ge=()=>{ne(880,.12),setTimeout(()=>ne(1100,.1),130)},nt=()=>ne(600,.08),fe=()=>ne(200,.25,"sawtooth"),it=a=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const g=new SpeechSynthesisUtterance(a);g.rate=1.2,g.pitch=1,g.lang="en-IN",window.speechSynthesis.speak(g)}catch{}},i={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},Ft=`
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
`,zt=a=>a>=.85?"high":a>=.55?"med":"low",xe=a=>`conf-dot conf-${zt(a)}`,st=a=>a==="learned"?{className:"source-badge source-learned",icon:"🧠",text:"Learned"}:a==="fuzzy_match"?{className:"source-badge source-ai",icon:"🔍",text:"Matched"}:a==="fuzzy_history"||a==="consignee_pattern"?{className:"source-badge source-history",icon:"📊",text:"History"}:a==="delhivery_pincode"||a==="india_post"||a==="pincode_lookup"||a==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"📍",text:"Pincode"}:null;function Gt(){var $e,_e,Be,We,Me,De,Le,Ge,Ue,Ve;const{pin:a}=pt();ht();const g=`${At}:${a||"unknown"}`,[h,I]=s.useState(null),[f,k]=s.useState("connecting"),[be,C]=s.useState(""),[d,rt]=s.useState(r.IDLE),[N,ye]=s.useState(""),[B,ie]=s.useState(null),[Tt,ve]=s.useState({}),[o,Ce]=s.useState(null),[c,j]=s.useState({}),[x,G]=s.useState(null),[Ne,U]=s.useState(null),[je,se]=s.useState(""),[y,we]=s.useState([]),[re,Se]=s.useState(!1),[ke,Ee]=s.useState(0),[oe,Re]=s.useState(!1),[E,Ie]=s.useState({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now()}),[V,ot]=s.useState(!1),v=s.useRef(null),ae=s.useRef(null),q=s.useRef(null),W=s.useRef(null),T=s.useRef(!1),H=s.useRef(null),ce=s.useRef(!1),le=s.useRef(r.IDLE),X=s.useRef(null),K=s.useCallback(t=>{we(t);try{t.length?localStorage.setItem(g,JSON.stringify(t)):localStorage.removeItem(g)}catch{}},[g]),Ae=s.useCallback(t=>{const n={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:t};return K([...y,n]),n},[y,K]),Pe=s.useCallback(()=>{!h||!h.connected||!y.length||(y.forEach(t=>{var n,l;!((n=t==null?void 0:t.payload)!=null&&n.awb)||!((l=t==null?void 0:t.payload)!=null&&l.imageBase64)||h.emit("scanner:scan",t.payload)}),K([]))},[h,y,K]),p=s.useCallback(t=>{rt(t)},[]);s.useEffect(()=>{le.current=d},[d]),s.useEffect(()=>{if(!a){C("No PIN provided.");return}const t=mt(Rt,{auth:{scannerPin:a},transports:["websocket","polling"],reconnection:!0,reconnectionDelay:1500,reconnectionAttempts:20});return t.on("connect",()=>k("connecting")),t.on("scanner:paired",()=>{k("paired"),p(r.SCANNING)}),t.on("scanner:error",({message:n})=>{C(n),k("disconnected")}),t.on("scanner:session-ended",()=>{k("disconnected"),C("Session ended by desktop.")}),t.on("disconnect",()=>k("disconnected")),t.on("reconnect",()=>{f==="paired"&&p(r.SCANNING)}),t.on("scanner:scan-processed",n=>{if(n.status==="error"){U("error"),fe(),M([100,50,100]),p(r.ERROR),C(n.error||"Scan failed on desktop.");return}Ce(n),j({clientCode:n.clientCode||"",consignee:n.consignee||"",destination:n.destination||"",pincode:n.pincode||"",weight:n.weight||0,amount:n.amount||0,orderNo:n.orderNo||""}),ve({}),n.reviewRequired?p(r.REVIEWING):(ge(),M([50,30,50]),G({awb:n.awb,clientCode:n.clientCode,clientName:n.clientName}),p(r.SUCCESS))}),t.on("scanner:approval-result",({success:n,message:l,awb:u})=>{n?(ge(),M([50,30,50]),U("success"),G({awb:(o==null?void 0:o.awb)||u,clientCode:c.clientCode,clientName:(o==null?void 0:o.clientName)||c.clientCode}),p(r.SUCCESS)):(fe(),C(l||"Approval failed."))}),t.on("scanner:ready-for-next",()=>{}),I(t),()=>{t.disconnect()}},[a]),s.useEffect(()=>{try{const t=localStorage.getItem(g);if(!t)return;const n=JSON.parse(t);Array.isArray(n)&&n.length&&we(n)}catch{}},[g]),s.useEffect(()=>{f==="paired"&&(h!=null&&h.connected)&&y.length&&Pe()},[f,h,y.length,Pe]);const R=s.useCallback(async()=>{var t;try{if(Re(!1),W.current){try{const n=W.current;n!=null&&n.barcodeScanner&&await n.barcodeScanner.dispose()}catch{}W.current=null}if(q.current){try{await q.current.reset()}catch{}q.current=null}(t=v.current)!=null&&t.srcObject&&(v.current.srcObject.getTracks().forEach(n=>n.stop()),v.current.srcObject=null)}catch{}},[]),Fe=s.useCallback(async()=>{if(v.current){await R();try{if(et)try{const b=await(await pe(()=>import("./index-OhzldbFf.js").then(w=>w.i),__vite__mapDeps([0,1]))).default.initialize({licenseKey:et,enginePath:"/scanbot-sdk/"}),P={containerId:"scanbot-camera-container",onBarcodesDetected:w=>{var _;if(T.current)return;const S=(_=w==null?void 0:w.barcodes)==null?void 0:_[0];S!=null&&S.text&&ze(S.text)},style:{window:{widthProportion:te.widthPct,heightProportion:te.heightPct}}},F=await b.createBarcodeScanner(P);W.current={sdk:b,barcodeScanner:F};return}catch(u){console.warn("Scanbot init failed, falling back to ZXing:",u.message)}const[{BrowserMultiFormatReader:t},n]=await Promise.all([pe(()=>import("./index-4oYbt_M2.js"),__vite__mapDeps([2,3])),pe(()=>import("./index-D3Mz4UNV.js"),__vite__mapDeps([]))]),l=new t(new Map([[n.DecodeHintType.POSSIBLE_FORMATS,[n.BarcodeFormat.CODE_128,n.BarcodeFormat.CODE_39,n.BarcodeFormat.CODE_93,n.BarcodeFormat.ITF,n.BarcodeFormat.CODABAR]],[n.DecodeHintType.TRY_HARDER,!0]]),80);q.current=l,await l.decodeFromVideoDevice(void 0,v.current,u=>{T.current||u&&ze(u.getText())})}catch(t){C("Camera access failed: "+t.message)}}},[R]),ze=s.useCallback(t=>{const n=String(t||"").trim().replace(/\s+/g,"").toUpperCase();if(!(!n||n.length<6||T.current||le.current!==r.SCANNING)){if(T.current=!0,E.scannedAwbs.has(n)){M([100,50,100,50,100]),fe(),se(n),setTimeout(()=>{se(""),T.current=!1},2500);return}clearTimeout(X.current),M([50]),nt(),ye(n),Ie(l=>{const u={...l,scanNumber:l.scanNumber+1};return u.scannedAwbs=new Set(l.scannedAwbs),u.scannedAwbs.add(n),u}),X.current=setTimeout(()=>{le.current===r.SCANNING&&p(r.CAPTURING)},Pt)}},[E,p]);s.useEffect(()=>(d===r.SCANNING&&(T.current=!1,Fe()),()=>{d===r.SCANNING&&R()}),[d,Fe,R]);const Te=s.useCallback(async()=>{await R();try{const t=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}});v.current&&(v.current.srcObject=t,await v.current.play(),Re(!0))}catch(t){C("Camera access failed: "+t.message)}},[R]);s.useEffect(()=>{d===r.CAPTURING&&Te()},[d,Te]),s.useEffect(()=>{if(d!==r.CAPTURING){Se(!1),Ee(0),ce.current=!1;return}const t=setInterval(()=>{const n=v.current,l=ae.current;if(!n||!l||!n.videoWidth||!n.videoHeight)return;const u=n.getBoundingClientRect(),b=l.getBoundingClientRect(),P=n.videoWidth/Math.max(u.width,1),F=n.videoHeight/Math.max(u.height,1),w=Math.max(0,Math.floor((b.left-u.left)*P)),S=Math.max(0,Math.floor((b.top-u.top)*F)),_=Math.max(24,Math.floor(b.width*P)),z=Math.max(24,Math.floor(b.height*F)),Y=document.createElement("canvas"),Q=96,J=72;Y.width=Q,Y.height=J;const ue=Y.getContext("2d",{willReadFrequently:!0});if(!ue)return;ue.drawImage(n,w,S,Math.min(_,n.videoWidth-w),Math.min(z,n.videoHeight-S),0,0,Q,J);const Z=ue.getImageData(0,0,Q,J).data;let qe=0,He=0,Xe=0,Ke=0;for(let $=0;$<Z.length;$+=4){const L=.2126*Z[$]+.7152*Z[$+1]+.0722*Z[$+2];qe+=L,He+=L*L,$>0&&Math.abs(L-Ke)>26&&(Xe+=1),Ke=L}const me=Q*J,ee=qe/me,lt=Math.max(0,He/me-ee*ee),dt=Math.sqrt(lt),ut=Xe/Math.max(me,1),Ye=ee>35&&ee<225&&dt>24&&ut>.12;Se(Ye),Ee($=>Ye?Math.min($+1,8):0)},320);return()=>clearInterval(t)},[d]);const Oe=s.useCallback(()=>{const t=v.current,n=ae.current;if(!t||!n||!t.videoWidth)return null;const l=t.getBoundingClientRect(),u=n.getBoundingClientRect(),b=t.videoWidth/l.width,P=t.videoHeight/l.height,F=Math.max(0,(u.left-l.left)*b),w=Math.max(0,(u.top-l.top)*P),S=Math.min(t.videoWidth-F,u.width*b),_=Math.min(t.videoHeight-w,u.height*P),z=document.createElement("canvas");return z.width=Math.min(1800,Math.round(S)),z.height=Math.round(z.width/S*_),z.getContext("2d").drawImage(t,F,w,S,_,0,0,z.width,z.height),z.toDataURL("image/jpeg",.92).split(",")[1]||null},[]),de=s.useCallback(()=>{U("white"),nt(),M([30]);const t=Oe();if(!t){C("Could not capture image. Try again."),T.current=!1;return}ie(`data:image/jpeg;base64,${t}`),R(),p(r.PREVIEW)},[Oe,R,p]);s.useEffect(()=>{d===r.CAPTURING&&(ke<3||ce.current||(ce.current=!0,de()))},[ke,d,de]);const at=s.useCallback(()=>{if(!N||!B)return;p(r.PROCESSING);const t={scanNumber:E.scanNumber,recentClient:E.dominantClient,dominantClient:E.dominantClient,dominantClientCount:E.dominantClientCount,sessionDurationMin:Math.round((Date.now()-E.startedAt)/6e4)},n=B.split(",")[1]||B,l={awb:N,imageBase64:n,focusImageBase64:n,sessionContext:t};if(!h||!h.connected||f!=="paired"){Ae(l),ge(),G({awb:N,clientCode:"OFFLINE",clientName:"Queued Offline",offlineQueued:!0}),p(r.SUCCESS);return}h.emit("scanner:scan",l),setTimeout(()=>{d===r.PROCESSING&&C("Processing is taking longer than expected...")},2e4)},[h,N,B,E,d,p,f,Ae]),ct=s.useCallback(()=>{if(!(!h||!o)){if(p(r.APPROVING),o.ocrExtracted||o){const t={clientCode:o.clientCode||"",clientName:o.clientName||"",consignee:o.consignee||"",destination:o.destination||""},n={clientCode:c.clientCode||"",clientName:c.clientCode||"",consignee:c.consignee||"",destination:c.destination||""};h.emit("scanner:learn-corrections",{pin:a,ocrFields:t,approvedFields:n})}h.emit("scanner:approval-submit",{shipmentId:o.shipmentId,awb:o.awb||N,fields:{clientCode:c.clientCode,consignee:c.consignee,destination:c.destination,pincode:c.pincode,weight:parseFloat(c.weight)||0,amount:parseFloat(c.amount)||0,orderNo:c.orderNo||""}},t=>{t!=null&&t.success||(p(r.REVIEWING),C((t==null?void 0:t.message)||"Approval failed."))}),c.clientCode&&c.clientCode!=="MISC"&&Ie(t=>{var u,b;const n={...t.clientFreq};n[c.clientCode]=(n[c.clientCode]||0)+1;const l=Object.entries(n).sort((P,F)=>F[1]-P[1]);return{...t,clientFreq:n,dominantClient:((u=l[0])==null?void 0:u[1])>=2?l[0][0]:null,dominantClientCount:((b=l[0])==null?void 0:b[1])||0}})}},[h,o,c,N,a,p]),D=s.useCallback(()=>{clearTimeout(H.current),clearTimeout(X.current),ye(""),ie(null),Ce(null),j({}),ve({}),G(null),C(""),se(""),T.current=!1,p(r.SCANNING)},[p]);s.useEffect(()=>{if(d===r.SUCCESS)return H.current=setTimeout(D,It),()=>clearTimeout(H.current)},[d,D]),s.useEffect(()=>{if(V)if(d===r.REVIEWING&&o){const t=[o.clientName||o.clientCode,o.destination,o.weight?`${o.weight} kilograms`:""].filter(Boolean);t.length&&it(t.join(". "))}else d===r.SUCCESS&&x&&it(`${x.clientName||x.clientCode||"Shipment"} Verified.`)},[V,d,o,x]),s.useEffect(()=>()=>{R(),clearTimeout(H.current),clearTimeout(X.current)},[R]);const A=t=>`msp-step ${d===t?"active":""}`,O=s.useMemo(()=>{if(!o)return{};const t=o.ocrExtracted||o;return{clientCode:{confidence:(t==null?void 0:t.clientNameConfidence)||0,source:(t==null?void 0:t.clientNameSource)||null},consignee:{confidence:(t==null?void 0:t.consigneeConfidence)||0,source:(t==null?void 0:t.consigneeSource)||null},destination:{confidence:(t==null?void 0:t.destinationConfidence)||0,source:(t==null?void 0:t.destinationSource)||null},pincode:{confidence:(t==null?void 0:t.pincodeConfidence)||0,source:null},weight:{confidence:(t==null?void 0:t.weightConfidence)||0,source:null}}},[o]),m=(($e=o==null?void 0:o.ocrExtracted)==null?void 0:$e.intelligence)||(o==null?void 0:o.intelligence)||null;return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:Ft}),e.jsxs("div",{className:"msp-root",children:[Ne&&e.jsx("div",{className:`flash-overlay flash-${Ne}`,onAnimationEnd:()=>U(null)}),je&&e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[e.jsx(Qe,{size:48,color:"white"}),e.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),e.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:je}),e.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),e.jsx("div",{className:A(r.IDLE),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:f==="connecting"?e.jsx(he,{size:28,color:i.primary,style:{animation:"spin 1s linear infinite"}}):e.jsx(Je,{size:28,color:i.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:f==="connecting"?"Connecting...":"Disconnected"}),e.jsx("div",{style:{fontSize:"0.82rem",color:i.muted},children:be||`Connecting to session ${a}`})]}),f==="disconnected"&&e.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[e.jsx(he,{size:16})," Reconnect"]})]})}),e.jsx("div",{className:A(r.SCANNING),children:e.jsxs("div",{className:"cam-viewport",children:[!W.current&&e.jsx("video",{ref:v,autoPlay:!0,playsInline:!0,muted:!0,style:{width:"100%",height:"100%",objectFit:"cover"}}),e.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:W.current?"block":"none"}}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{className:"scan-guide",style:{width:`${te.widthPct*100}%`,height:`${te.heightPct*100}%`},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"}),e.jsx("div",{className:"scan-laser"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(gt,{size:12})," ",a]}),e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(ft,{size:12})," ",E.scanNumber]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:"Point camera at barcode"}),e.jsx("div",{style:{display:"flex",gap:12},children:e.jsx("button",{className:"cam-hud-chip",onClick:()=>ot(!V),style:{border:"none",cursor:"pointer"},children:V?e.jsx(xt,{size:14}):e.jsx(bt,{size:14})})})]})]})}),e.jsx("div",{className:A(r.CAPTURING),children:e.jsxs("div",{className:"cam-viewport",children:[e.jsx("video",{ref:d===r.CAPTURING?v:void 0,autoPlay:!0,playsInline:!0,muted:!0,style:{width:"100%",height:"100%",objectFit:"cover"}}),!oe&&e.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"linear-gradient(180deg, #0F172A 0%, #111827 100%)",color:"white"},children:[e.jsx(yt,{size:48,color:"#34D399"}),e.jsx("div",{className:"mono",style:{fontSize:"1.5rem",fontWeight:700,color:"#34D399"},children:N}),e.jsx("div",{style:{color:"rgba(255,255,255,0.74)",fontSize:"0.82rem"},children:"Barcode locked • Preparing camera..."})]}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{ref:ae,className:`scan-guide ${re?"detected":""}`,style:{width:`${tt.widthPct*100}%`,height:`${tt.heightPct*100}%`},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[e.jsx(vt,{size:12})," ",N]}),y.length>0&&e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(Ct,{size:12})," ",y.length," queued"]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:500,textAlign:"center"},children:"Place AWB slip inside the frame"}),e.jsx("div",{style:{color:re?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.72)",fontSize:"0.72rem",fontWeight:700},children:oe?re?"Document detected - auto-capturing":"Auto-detecting document edges...":"Starting document camera..."}),e.jsx("button",{className:"capture-btn",onClick:de,disabled:!oe,children:e.jsx("div",{className:"capture-btn-inner"})})]})]})}),e.jsx("div",{className:A(r.PREVIEW),children:e.jsxs("div",{style:{background:i.bg,display:"flex",flexDirection:"column",height:"100%"},children:[e.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${i.border}`},children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.72rem",color:i.muted,fontWeight:600},children:"CAPTURED"}),e.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:N})]})}),e.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:B&&e.jsx("img",{src:B,alt:"Captured label",className:"preview-img"})}),e.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{ie(null),p(r.CAPTURING)},children:[e.jsx(Ze,{size:16})," Retake"]}),e.jsxs("button",{className:"btn btn-primary",style:{flex:2},onClick:at,children:[e.jsx(Nt,{size:16})," Use Photo"]})]})]})}),e.jsx("div",{className:A(r.PROCESSING),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16},children:[e.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[e.jsx(jt,{size:22,color:i.primary,style:{animation:"spin 2s linear infinite"}}),e.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:i.primary},children:"Intelligence Engine"})]}),e.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:i.muted},children:N})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(t=>e.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:t}),e.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),e.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},t))]})}),e.jsx("div",{className:A(r.REVIEWING),children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%"},children:[e.jsxs("div",{style:{padding:"14px 20px",borderBottom:`1px solid ${i.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.65rem",color:i.muted,fontWeight:600},children:"REVIEW EXTRACTION"}),e.jsx("div",{className:"mono",style:{fontSize:"0.95rem",fontWeight:700},children:(o==null?void 0:o.awb)||N})]}),(m==null?void 0:m.learnedFieldCount)>0&&e.jsxs("div",{className:"source-badge source-learned",children:["🧠 ",m.learnedFieldCount," auto-corrected"]})]}),e.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsxs("div",{className:`field-card ${(((_e=O.clientCode)==null?void 0:_e.confidence)||0)<.55?"warning":""}`,children:[e.jsx("div",{className:xe(((Be=O.clientCode)==null?void 0:Be.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((We=O.clientCode)==null?void 0:We.source)&&(()=>{const t=st(O.clientCode.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:c.clientCode||"",onChange:t=>j(n=>({...n,clientCode:t.target.value.toUpperCase()})),placeholder:"Client code"}),((Me=m==null?void 0:m.clientMatches)==null?void 0:Me.length)>0&&m.clientNeedsConfirmation&&e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:m.clientMatches.slice(0,3).map(t=>e.jsxs("button",{onClick:()=>j(n=>({...n,clientCode:t.code})),style:{fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:`1px solid ${i.border}`,background:c.clientCode===t.code?i.primaryLight:i.surface,color:i.text,cursor:"pointer",fontFamily:"inherit",fontWeight:500},children:[t.code," (",Math.round(t.score*100),"%)"]},t.code))})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:xe(((De=O.consignee)==null?void 0:De.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Consignee"}),e.jsx("input",{className:"field-input",value:c.consignee||"",onChange:t=>j(n=>({...n,consignee:t.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:xe(((Le=O.destination)==null?void 0:Le.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((Ge=O.destination)==null?void 0:Ge.source)&&(()=>{const t=st(O.destination.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:c.destination||"",onChange:t=>j(n=>({...n,destination:t.target.value.toUpperCase()})),placeholder:"City"}),(m==null?void 0:m.pincodeCity)&&m.pincodeCity!==c.destination&&e.jsxs("button",{onClick:()=>j(t=>({...t,destination:m.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:i.successLight,color:i.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["📍 Pincode suggests: ",m.pincodeCity]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Pincode"}),e.jsx("input",{className:"field-input",value:c.pincode||"",onChange:t=>j(n=>({...n,pincode:t.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),e.jsx("div",{className:`field-card ${(Ue=m==null?void 0:m.weightAnomaly)!=null&&Ue.anomaly?"warning":""}`,children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Weight (kg)"}),e.jsx("input",{className:"field-input",value:c.weight||"",onChange:t=>j(n=>({...n,weight:t.target.value})),placeholder:"0.0",inputMode:"decimal"}),((Ve=m==null?void 0:m.weightAnomaly)==null?void 0:Ve.anomaly)&&e.jsxs("div",{style:{fontSize:"0.6rem",color:i.warning,marginTop:2,fontWeight:500},children:["⚠️ ",m.weightAnomaly.warning]})]})})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Amount (₹)"}),e.jsx("input",{className:"field-input",value:c.amount||"",onChange:t=>j(n=>({...n,amount:t.target.value})),placeholder:"0",inputMode:"decimal"})]})}),e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Order No"}),e.jsx("input",{className:"field-input",value:c.orderNo||"",onChange:t=>j(n=>({...n,orderNo:t.target.value})),placeholder:"Optional"})]})})]})]}),e.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${i.border}`,display:"flex",gap:10},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:D,children:[e.jsx(wt,{size:16})," Skip"]}),e.jsxs("button",{className:"btn btn-success btn-lg",style:{flex:2},onClick:ct,disabled:d===r.APPROVING,children:[d===r.APPROVING?e.jsx(he,{size:16,style:{animation:"spin 1s linear infinite"}}):e.jsx(St,{size:16}),d===r.APPROVING?"Saving...":"Approve & Save"]})]})]})}),e.jsx("div",{className:A(r.APPROVING)}),e.jsx("div",{className:A(r.SUCCESS),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[e.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:i.success,strokeWidth:"3",className:"success-check-circle"}),e.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:i.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:i.success,marginBottom:4},children:"Saved Successfully"}),e.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700},children:x==null?void 0:x.awb}),(x==null?void 0:x.clientCode)&&e.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:i.primaryLight,color:i.primary,fontSize:"0.78rem",fontWeight:600},children:x.clientName||x.clientCode})]}),e.jsx("div",{style:{fontSize:"0.72rem",color:i.muted},children:x!=null&&x.offlineQueued?`${y.length} queued for sync • Auto-continuing in 3s`:`#${E.scanNumber} scanned • Auto-continuing in 3s`}),e.jsxs("button",{className:"btn btn-primary btn-lg btn-full",onClick:D,style:{maxWidth:320},children:[e.jsx(kt,{size:18})," Scan Next Parcel"]})]})}),e.jsx("div",{className:A(r.ERROR),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(Qe,{size:32,color:i.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:i.error},children:"Scan Error"}),e.jsx("div",{style:{fontSize:"0.82rem",color:i.muted,marginTop:4},children:be})]}),e.jsxs("button",{className:"btn btn-primary",onClick:D,children:[e.jsx(Ze,{size:16})," Try Again"]})]})}),f==="disconnected"&&d!==r.IDLE&&e.jsxs("div",{className:"offline-banner",children:[e.jsx(Je,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline — Reconnecting... ",y.length?`(${y.length} queued)`:""]})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{Gt as default};
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/index-OhzldbFf.js","assets/vendor-helmet-Dwc3L0SQ.js","assets/index-4oYbt_M2.js","assets/index-D3Mz4UNV.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
