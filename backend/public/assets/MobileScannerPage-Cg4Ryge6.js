import{l as gn,_ as pe}from"./index-DkteUF0C.js";import{j as e}from"./page-landing-Bx5c8M2c.js";import{r as s}from"./vendor-helmet-Dwc3L0SQ.js";import{c as fn,u as xn}from"./vendor-react-DGJm5saH.js";import{b as Ye,R as he,aD as Qe,aE as bn,z as yn,aF as vn,aG as Cn,au as Nn,aH as jn,d as wn,aI as Je,O as Sn,ax as kn,X as En,aJ as Rn,aK as In}from"./vendor-icons-o7elvlXJ.js";import"./page-import-KrbyjuuQ.js";import"./page-reconcile-p5UREp47.js";import"./page-rate-calc-_eH7d9Js.js";var An={};const Fn=window.location.origin,Ze=An.VITE_SCANBOT_LICENSE_KEY||"",en={w:"88vw",h:"22vh"},nn={w:"92vw",h:"72vh"},zn=3500,Tn="mobile_scanner_offline_queue",Pn=120,r={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"},L=c=>{var g;try{(g=navigator==null?void 0:navigator.vibrate)==null||g.call(navigator,c)}catch{}},se=(c,g,h="sine")=>{try{const R=new(window.AudioContext||window.webkitAudioContext),x=R.createOscillator(),E=R.createGain();x.type=h,x.frequency.setValueAtTime(c,R.currentTime),E.gain.setValueAtTime(.12,R.currentTime),E.gain.exponentialRampToValueAtTime(.01,R.currentTime+g),x.connect(E),E.connect(R.destination),x.start(),x.stop(R.currentTime+g)}catch{}},ge=()=>{se(880,.12),setTimeout(()=>se(1100,.1),130)},tn=()=>se(600,.08),fe=()=>se(200,.25,"sawtooth"),sn=c=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const g=new SpeechSynthesisUtterance(c);g.rate=1.2,g.pitch=1,g.lang="en-IN",window.speechSynthesis.speak(g)}catch{}},i={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},On=`
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
`,Mn=c=>c>=.85?"high":c>=.55?"med":"low",xe=c=>`conf-dot conf-${Mn(c)}`,rn=c=>c==="learned"?{className:"source-badge source-learned",icon:"🧠",text:"Learned"}:c==="fuzzy_match"?{className:"source-badge source-ai",icon:"🔍",text:"Matched"}:c==="fuzzy_history"||c==="consignee_pattern"?{className:"source-badge source-history",icon:"📊",text:"History"}:c==="delhivery_pincode"||c==="india_post"||c==="pincode_lookup"||c==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"📍",text:"Pincode"}:null;function Hn(){var Oe,Me,_e,Be,$e,We,De,Le,Ge,Ue;const{pin:c}=fn();xn();const g=`${Tn}:${c||"unknown"}`,[h,R]=s.useState(null),[x,E]=s.useState("connecting"),[be,N]=s.useState(""),[m,on]=s.useState(r.IDLE),[j,ye]=s.useState(""),[W,re]=s.useState(null),[_n,ve]=s.useState({}),[o,Ce]=s.useState(null),[l,w]=s.useState({}),[b,V]=s.useState(null),[Ne,q]=s.useState(null),[je,oe]=s.useState(""),[v,we]=s.useState([]),[ae,Se]=s.useState(!1),[Bn,ke]=s.useState(0),[ce,le]=s.useState(!1),[T,Ee]=s.useState({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now()}),[H,an]=s.useState(!1),y=s.useRef(null),de=s.useRef(null),_=s.useRef(null),I=s.useRef(null),P=s.useRef(!1),X=s.useRef(null),cn=s.useRef(!1),K=s.useRef(r.IDLE),Y=s.useRef(null),B=s.useRef(null),Re=s.useRef(new Set),Q=s.useCallback(n=>{we(n);try{n.length?localStorage.setItem(g,JSON.stringify(n)):localStorage.removeItem(g)}catch{}},[g]),Ie=s.useCallback(n=>{const t={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:n};return Q([...v,t]),t},[v,Q]),Ae=s.useCallback(()=>{!h||!h.connected||!v.length||(v.forEach(n=>{var t,d;!((t=n==null?void 0:n.payload)!=null&&t.awb)||!((d=n==null?void 0:n.payload)!=null&&d.imageBase64)||h.emit("scanner:scan",n.payload)}),Q([]))},[h,v,Q]),p=s.useCallback(n=>{on(n)},[]);s.useEffect(()=>{K.current=m},[m]),s.useEffect(()=>{if(!c){N("No PIN provided.");return}const n=gn(Fn,{auth:{scannerPin:c},transports:["websocket","polling"],reconnection:!0,reconnectionDelay:1500,reconnectionAttempts:20});return n.on("connect",()=>E("connecting")),n.on("scanner:paired",()=>{E("paired"),p(r.SCANNING)}),n.on("scanner:error",({message:t})=>{N(t),E("disconnected")}),n.on("scanner:session-ended",()=>{E("disconnected"),N("Session ended by desktop.")}),n.on("disconnect",()=>E("disconnected")),n.on("reconnect",()=>{x==="paired"&&p(r.SCANNING)}),n.on("scanner:scan-processed",t=>{if(t.status==="error"){q("error"),fe(),L([100,50,100]),p(r.ERROR),N(t.error||"Scan failed on desktop.");return}Ce(t),w({clientCode:t.clientCode||"",consignee:t.consignee||"",destination:t.destination||"",pincode:t.pincode||"",weight:t.weight||0,amount:t.amount||0,orderNo:t.orderNo||""}),ve({}),t.reviewRequired?p(r.REVIEWING):(ge(),L([50,30,50]),V({awb:t.awb,clientCode:t.clientCode,clientName:t.clientName}),p(r.SUCCESS))}),n.on("scanner:approval-result",({success:t,message:d,awb:a})=>{t?(ge(),L([50,30,50]),q("success"),V({awb:(o==null?void 0:o.awb)||a,clientCode:l.clientCode,clientName:(o==null?void 0:o.clientName)||l.clientCode}),p(r.SUCCESS)):(fe(),N(d||"Approval failed."))}),n.on("scanner:ready-for-next",()=>{}),R(n),()=>{n.disconnect()}},[c]),s.useEffect(()=>{try{const n=localStorage.getItem(g);if(!n)return;const t=JSON.parse(n);Array.isArray(t)&&t.length&&we(t)}catch{}},[g]),s.useEffect(()=>{x==="paired"&&(h!=null&&h.connected)&&v.length&&Ae()},[x,h,v.length,Ae]);const J=s.useCallback(async()=>{var n;try{if(le(!1),I.current){try{const t=I.current;t!=null&&t.barcodeScanner&&await t.barcodeScanner.dispose()}catch{}I.current=null}if(_.current){try{await _.current.reset()}catch{}_.current=null}(n=y.current)!=null&&n.srcObject&&(y.current.srcObject.getTracks().forEach(t=>t.stop()),y.current.srcObject=null)}catch{}},[]),D=s.useCallback(async()=>{try{if(I.current){try{await I.current.barcodeScanner.dispose()}catch{}I.current=null}if(_.current){try{await _.current.reset()}catch{}_.current=null}}catch{}},[]),Fe=s.useCallback(async()=>{if(y.current){await D();try{if(Ze)try{const f=await(await pe(()=>import("./index-OhzldbFf.js").then(S=>S.i),__vite__mapDeps([0,1]))).default.initialize({licenseKey:Ze,enginePath:"/scanbot-sdk/"}),F={containerId:"scanbot-camera-container",onBarcodesDetected:S=>{var $,C;if(P.current)return;const k=($=S==null?void 0:S.barcodes)==null?void 0:$[0];k!=null&&k.text&&((C=B.current)==null||C.call(B,k.text))},style:{window:{widthProportion:.88,heightProportion:.22}}},z=await f.createBarcodeScanner(F);I.current={sdk:f,barcodeScanner:z};return}catch(a){console.warn("Scanbot init failed, falling back to ZXing:",a.message)}if(!y.current.srcObject){let a=null;try{a=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{a=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}y.current.srcObject=a,await y.current.play()}const[{BrowserMultiFormatReader:n},t]=await Promise.all([pe(()=>import("./index-4oYbt_M2.js"),__vite__mapDeps([2,3])),pe(()=>import("./index-D3Mz4UNV.js"),__vite__mapDeps([]))]),d=new n(new Map([[t.DecodeHintType.POSSIBLE_FORMATS,[t.BarcodeFormat.CODE_128,t.BarcodeFormat.ITF,t.BarcodeFormat.CODE_39,t.BarcodeFormat.CODE_93,t.BarcodeFormat.CODABAR,t.BarcodeFormat.EAN_13,t.BarcodeFormat.EAN_8]],[t.DecodeHintType.TRY_HARDER,!0],[t.DecodeHintType.ASSUME_GS1,!1]]),40);_.current=d,d.decodeFromVideoElement(y.current,a=>{var f;P.current||a&&((f=B.current)==null||f.call(B,a.getText()))})}catch(n){N("Camera access failed: "+n.message)}}},[D]),ze=s.useCallback(n=>{const t=String(n||"").trim().replace(/\s+/g,"").toUpperCase();if(!(!t||t.length<6||P.current||K.current!==r.SCANNING)){if(P.current=!0,Re.current.has(t)){L([100,50,100,50,100]),fe(),oe(t),setTimeout(()=>{oe(""),P.current=!1},2500);return}clearTimeout(Y.current),L([50]),tn(),ye(t),Ee(d=>{const a={...d,scanNumber:d.scanNumber+1};return a.scannedAwbs=new Set(d.scannedAwbs),a.scannedAwbs.add(t),Re.current=a.scannedAwbs,a}),Y.current=setTimeout(()=>{K.current===r.SCANNING&&p(r.CAPTURING)},Pn)}},[p]);s.useEffect(()=>{B.current=ze},[ze]),s.useEffect(()=>(m===r.SCANNING&&(P.current=!1,Fe()),()=>{m===r.SCANNING&&D()}),[m,Fe,D]);const Te=s.useCallback(async()=>{var n;await D();try{if((n=y.current)!=null&&n.srcObject){le(!0);return}const t=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}});y.current&&(y.current.srcObject=t,await y.current.play(),le(!0))}catch(t){N("Camera access failed: "+t.message)}},[D]);s.useEffect(()=>{m===r.CAPTURING&&Te()},[m,Te]),s.useEffect(()=>{if(m!==r.CAPTURING){Se(!1),ke(0),cn.current=!1;return}const n=setInterval(()=>{const t=y.current,d=de.current;if(!t||!d||!t.videoWidth||!t.videoHeight)return;const a=t.getBoundingClientRect(),f=d.getBoundingClientRect(),F=t.videoWidth/Math.max(a.width,1),z=t.videoHeight/Math.max(a.height,1),S=Math.max(0,Math.floor((f.left-a.left)*F)),k=Math.max(0,Math.floor((f.top-a.top)*z)),$=Math.max(24,Math.floor(f.width*F)),C=Math.max(24,Math.floor(f.height*z)),Z=document.createElement("canvas"),ee=96,ne=72;Z.width=ee,Z.height=ne;const ue=Z.getContext("2d",{willReadFrequently:!0});if(!ue)return;ue.drawImage(t,S,k,Math.min($,t.videoWidth-S),Math.min(C,t.videoHeight-k),0,0,ee,ne);const te=ue.getImageData(0,0,ee,ne).data;let Ve=0,qe=0,He=0,Xe=0;for(let M=0;M<te.length;M+=4){const U=.2126*te[M]+.7152*te[M+1]+.0722*te[M+2];Ve+=U,qe+=U*U,M>0&&Math.abs(U-Xe)>26&&(He+=1),Xe=U}const me=ee*ne,ie=Ve/me,mn=Math.max(0,qe/me-ie*ie),pn=Math.sqrt(mn),hn=He/Math.max(me,1),Ke=ie>35&&ie<225&&pn>24&&hn>.12;Se(Ke),ke(M=>Ke?Math.min(M+1,8):0)},320);return()=>clearInterval(n)},[m]);const Pe=s.useCallback(()=>{const n=y.current,t=de.current;if(!n||!t||!n.videoWidth)return null;const d=n.getBoundingClientRect(),a=t.getBoundingClientRect(),f=n.videoWidth/d.width,F=n.videoHeight/d.height,z=Math.max(0,(a.left-d.left)*f),S=Math.max(0,(a.top-d.top)*F),k=Math.min(n.videoWidth-z,a.width*f),$=Math.min(n.videoHeight-S,a.height*F),C=document.createElement("canvas");return C.width=Math.min(1800,Math.round(k)),C.height=Math.round(C.width/k*$),C.getContext("2d").drawImage(n,z,S,k,$,0,0,C.width,C.height),C.toDataURL("image/jpeg",.92).split(",")[1]||null},[]),ln=s.useCallback(()=>{q("white"),tn(),L([30]);const n=Pe();if(!n){N("Could not capture image. Try again."),P.current=!1;return}re(`data:image/jpeg;base64,${n}`),J(),p(r.PREVIEW)},[Pe,J,p]),dn=s.useCallback(()=>{if(!j||!W)return;p(r.PROCESSING);const n={scanNumber:T.scanNumber,recentClient:T.dominantClient,dominantClient:T.dominantClient,dominantClientCount:T.dominantClientCount,sessionDurationMin:Math.round((Date.now()-T.startedAt)/6e4)},t=W.split(",")[1]||W,d={awb:j,imageBase64:t,focusImageBase64:t,sessionContext:n};if(!h||!h.connected||x!=="paired"){Ie(d),ge(),V({awb:j,clientCode:"OFFLINE",clientName:"Queued Offline",offlineQueued:!0}),p(r.SUCCESS);return}h.emit("scanner:scan",d),setTimeout(()=>{K.current===r.PROCESSING&&(N("No response from desktop after 25 seconds. Check the desktop connection and try again."),p(r.ERROR))},25e3)},[h,j,W,T,p,x,Ie]),un=s.useCallback(()=>{if(!(!h||!o)){if(p(r.APPROVING),o.ocrExtracted||o){const n={clientCode:o.clientCode||"",clientName:o.clientName||"",consignee:o.consignee||"",destination:o.destination||""},t={clientCode:l.clientCode||"",clientName:l.clientCode||"",consignee:l.consignee||"",destination:l.destination||""};h.emit("scanner:learn-corrections",{pin:c,ocrFields:n,approvedFields:t})}h.emit("scanner:approval-submit",{shipmentId:o.shipmentId,awb:o.awb||j,fields:{clientCode:l.clientCode,consignee:l.consignee,destination:l.destination,pincode:l.pincode,weight:parseFloat(l.weight)||0,amount:parseFloat(l.amount)||0,orderNo:l.orderNo||""}},n=>{n!=null&&n.success||(p(r.REVIEWING),N((n==null?void 0:n.message)||"Approval failed."))}),l.clientCode&&l.clientCode!=="MISC"&&Ee(n=>{var a,f;const t={...n.clientFreq};t[l.clientCode]=(t[l.clientCode]||0)+1;const d=Object.entries(t).sort((F,z)=>z[1]-F[1]);return{...n,clientFreq:t,dominantClient:((a=d[0])==null?void 0:a[1])>=2?d[0][0]:null,dominantClientCount:((f=d[0])==null?void 0:f[1])||0}})}},[h,o,l,j,c,p]),G=s.useCallback(()=>{clearTimeout(X.current),clearTimeout(Y.current),ye(""),re(null),Ce(null),w({}),ve({}),V(null),N(""),oe(""),P.current=!1,p(r.SCANNING)},[p]);s.useEffect(()=>{if(m===r.SUCCESS)return X.current=setTimeout(G,zn),()=>clearTimeout(X.current)},[m,G]),s.useEffect(()=>{if(H)if(m===r.REVIEWING&&o){const n=[o.clientName||o.clientCode,o.destination,o.weight?`${o.weight} kilograms`:""].filter(Boolean);n.length&&sn(n.join(". "))}else m===r.SUCCESS&&b&&sn(`${b.clientName||b.clientCode||"Shipment"} Verified.`)},[H,m,o,b]),s.useEffect(()=>()=>{J(),clearTimeout(X.current),clearTimeout(Y.current)},[J]);const A=n=>`msp-step ${m===n?"active":""}`,O=s.useMemo(()=>{if(!o)return{};const n=o.ocrExtracted||o;return{clientCode:{confidence:(n==null?void 0:n.clientNameConfidence)||0,source:(n==null?void 0:n.clientNameSource)||null},consignee:{confidence:(n==null?void 0:n.consigneeConfidence)||0,source:(n==null?void 0:n.consigneeSource)||null},destination:{confidence:(n==null?void 0:n.destinationConfidence)||0,source:(n==null?void 0:n.destinationSource)||null},pincode:{confidence:(n==null?void 0:n.pincodeConfidence)||0,source:null},weight:{confidence:(n==null?void 0:n.weightConfidence)||0,source:null}}},[o]),u=((Oe=o==null?void 0:o.ocrExtracted)==null?void 0:Oe.intelligence)||(o==null?void 0:o.intelligence)||null;return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:On}),e.jsxs("div",{className:"msp-root",children:[Ne&&e.jsx("div",{className:`flash-overlay flash-${Ne}`,onAnimationEnd:()=>q(null)}),je&&e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[e.jsx(Ye,{size:48,color:"white"}),e.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),e.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:je}),e.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),e.jsx("div",{className:A(r.IDLE),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:x==="connecting"?e.jsx(he,{size:28,color:i.primary,style:{animation:"spin 1s linear infinite"}}):e.jsx(Qe,{size:28,color:i.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:x==="connecting"?"Connecting...":"Disconnected"}),e.jsx("div",{style:{fontSize:"0.82rem",color:i.muted},children:be||`Connecting to session ${c}`})]}),x==="disconnected"&&e.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[e.jsx(he,{size:16})," Reconnect"]})]})}),e.jsx("video",{ref:y,autoPlay:!0,playsInline:!0,muted:!0,style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(m===r.SCANNING||m===r.CAPTURING)&&!I.current?"block":"none"}}),e.jsx("div",{className:A(r.SCANNING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[e.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:I.current?"block":"none"}}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{className:"scan-guide",style:{width:en.w,height:en.h},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"}),e.jsx("div",{className:"scan-laser"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(bn,{size:12})," ",c]}),e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(yn,{size:12})," ",T.scanNumber]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:"Point camera at barcode"}),e.jsx("div",{style:{display:"flex",gap:12},children:e.jsx("button",{className:"cam-hud-chip",onClick:()=>an(!H),style:{border:"none",cursor:"pointer"},children:H?e.jsx(vn,{size:14}):e.jsx(Cn,{size:14})})})]})]})}),e.jsx("div",{className:A(r.CAPTURING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!ce&&e.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[e.jsx(Nn,{size:44,color:"#34D399"}),e.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:j}),e.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:"Barcode locked · Preparing camera…"})]}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{ref:de,className:`scan-guide ${ae?"detected":""}`,style:{width:nn.w,height:nn.h},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[e.jsx(jn,{size:12})," ",j]}),v.length>0&&e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(wn,{size:12})," ",v.length," queued"]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:500,textAlign:"center"},children:"Place AWB slip inside the frame"}),e.jsx("div",{style:{color:ae?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.72)",fontSize:"0.72rem",fontWeight:700},children:ce?ae?"Document detected - auto-capturing":"Auto-detecting document edges...":"Preparing camera…"}),e.jsx("button",{className:"capture-btn",onClick:ln,disabled:!ce,children:e.jsx("div",{className:"capture-btn-inner"})})]})]})}),e.jsx("div",{className:A(r.PREVIEW),children:e.jsxs("div",{style:{background:i.bg,display:"flex",flexDirection:"column",height:"100%"},children:[e.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${i.border}`},children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.72rem",color:i.muted,fontWeight:600},children:"CAPTURED"}),e.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:j})]})}),e.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:W&&e.jsx("img",{src:W,alt:"Captured label",className:"preview-img"})}),e.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{re(null),p(r.CAPTURING)},children:[e.jsx(Je,{size:16})," Retake"]}),e.jsxs("button",{className:"btn btn-primary",style:{flex:2},onClick:dn,children:[e.jsx(Sn,{size:16})," Use Photo"]})]})]})}),e.jsx("div",{className:A(r.PROCESSING),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16},children:[e.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[e.jsx(kn,{size:22,color:i.primary,style:{animation:"spin 2s linear infinite"}}),e.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:i.primary},children:"Intelligence Engine"})]}),e.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:i.muted},children:j})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(n=>e.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:n}),e.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),e.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},n))]})}),e.jsx("div",{className:A(r.REVIEWING),children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%"},children:[e.jsxs("div",{style:{padding:"14px 20px",borderBottom:`1px solid ${i.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.65rem",color:i.muted,fontWeight:600},children:"REVIEW EXTRACTION"}),e.jsx("div",{className:"mono",style:{fontSize:"0.95rem",fontWeight:700},children:(o==null?void 0:o.awb)||j})]}),(u==null?void 0:u.learnedFieldCount)>0&&e.jsxs("div",{className:"source-badge source-learned",children:["🧠 ",u.learnedFieldCount," auto-corrected"]})]}),e.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsxs("div",{className:`field-card ${(((Me=O.clientCode)==null?void 0:Me.confidence)||0)<.55?"warning":""}`,children:[e.jsx("div",{className:xe(((_e=O.clientCode)==null?void 0:_e.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((Be=O.clientCode)==null?void 0:Be.source)&&(()=>{const n=rn(O.clientCode.source);return n?e.jsxs("span",{className:n.className,children:[n.icon," ",n.text]}):null})()]}),e.jsx("input",{className:"field-input",value:l.clientCode||"",onChange:n=>w(t=>({...t,clientCode:n.target.value.toUpperCase()})),placeholder:"Client code"}),(($e=u==null?void 0:u.clientMatches)==null?void 0:$e.length)>0&&u.clientNeedsConfirmation&&e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:u.clientMatches.slice(0,3).map(n=>e.jsxs("button",{onClick:()=>w(t=>({...t,clientCode:n.code})),style:{fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:`1px solid ${i.border}`,background:l.clientCode===n.code?i.primaryLight:i.surface,color:i.text,cursor:"pointer",fontFamily:"inherit",fontWeight:500},children:[n.code," (",Math.round(n.score*100),"%)"]},n.code))})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:xe(((We=O.consignee)==null?void 0:We.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Consignee"}),e.jsx("input",{className:"field-input",value:l.consignee||"",onChange:n=>w(t=>({...t,consignee:n.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:xe(((De=O.destination)==null?void 0:De.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((Le=O.destination)==null?void 0:Le.source)&&(()=>{const n=rn(O.destination.source);return n?e.jsxs("span",{className:n.className,children:[n.icon," ",n.text]}):null})()]}),e.jsx("input",{className:"field-input",value:l.destination||"",onChange:n=>w(t=>({...t,destination:n.target.value.toUpperCase()})),placeholder:"City"}),(u==null?void 0:u.pincodeCity)&&u.pincodeCity!==l.destination&&e.jsxs("button",{onClick:()=>w(n=>({...n,destination:u.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:i.successLight,color:i.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["📍 Pincode suggests: ",u.pincodeCity]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Pincode"}),e.jsx("input",{className:"field-input",value:l.pincode||"",onChange:n=>w(t=>({...t,pincode:n.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),e.jsx("div",{className:`field-card ${(Ge=u==null?void 0:u.weightAnomaly)!=null&&Ge.anomaly?"warning":""}`,children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Weight (kg)"}),e.jsx("input",{className:"field-input",value:l.weight||"",onChange:n=>w(t=>({...t,weight:n.target.value})),placeholder:"0.0",inputMode:"decimal"}),((Ue=u==null?void 0:u.weightAnomaly)==null?void 0:Ue.anomaly)&&e.jsxs("div",{style:{fontSize:"0.6rem",color:i.warning,marginTop:2,fontWeight:500},children:["⚠️ ",u.weightAnomaly.warning]})]})})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Amount (₹)"}),e.jsx("input",{className:"field-input",value:l.amount||"",onChange:n=>w(t=>({...t,amount:n.target.value})),placeholder:"0",inputMode:"decimal"})]})}),e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Order No"}),e.jsx("input",{className:"field-input",value:l.orderNo||"",onChange:n=>w(t=>({...t,orderNo:n.target.value})),placeholder:"Optional"})]})})]})]}),e.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${i.border}`,display:"flex",gap:10},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:G,children:[e.jsx(En,{size:16})," Skip"]}),e.jsxs("button",{className:"btn btn-success btn-lg",style:{flex:2},onClick:un,disabled:m===r.APPROVING,children:[m===r.APPROVING?e.jsx(he,{size:16,style:{animation:"spin 1s linear infinite"}}):e.jsx(Rn,{size:16}),m===r.APPROVING?"Saving...":"Approve & Save"]})]})]})}),e.jsx("div",{className:A(r.APPROVING)}),e.jsx("div",{className:A(r.SUCCESS),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[e.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:i.success,strokeWidth:"3",className:"success-check-circle"}),e.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:i.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:i.success,marginBottom:4},children:"Saved Successfully"}),e.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700},children:b==null?void 0:b.awb}),(b==null?void 0:b.clientCode)&&e.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:i.primaryLight,color:i.primary,fontSize:"0.78rem",fontWeight:600},children:b.clientName||b.clientCode})]}),e.jsx("div",{style:{fontSize:"0.72rem",color:i.muted},children:b!=null&&b.offlineQueued?`${v.length} queued for sync • Auto-continuing in 3s`:`#${T.scanNumber} scanned • Auto-continuing in 3s`}),e.jsxs("button",{className:"btn btn-primary btn-lg btn-full",onClick:G,style:{maxWidth:320},children:[e.jsx(In,{size:18})," Scan Next Parcel"]})]})}),e.jsx("div",{className:A(r.ERROR),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(Ye,{size:32,color:i.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:i.error},children:"Scan Error"}),e.jsx("div",{style:{fontSize:"0.82rem",color:i.muted,marginTop:4},children:be})]}),e.jsxs("button",{className:"btn btn-primary",onClick:G,children:[e.jsx(Je,{size:16})," Try Again"]})]})}),x==="disconnected"&&m!==r.IDLE&&e.jsxs("div",{className:"offline-banner",children:[e.jsx(Qe,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline — Reconnecting... ",v.length?`(${v.length} queued)`:""]})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{Hn as default};
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/index-OhzldbFf.js","assets/vendor-helmet-Dwc3L0SQ.js","assets/index-4oYbt_M2.js","assets/index-D3Mz4UNV.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
