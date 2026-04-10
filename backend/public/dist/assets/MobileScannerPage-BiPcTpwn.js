import{l as Oe,_ as ye}from"./index-BiandqUq.js";import{j as e}from"./page-landing-Bx5c8M2c.js";import{r as s}from"./vendor-helmet-Dwc3L0SQ.js";import{c as Be,u as We}from"./vendor-react-DGJm5saH.js";import{b as ve,R as q,aD as je,aE as Le,z as _e,aF as Ge,aG as De,au as Me,aH as Ve,aI as Ce,O as Ue,ax as Xe,X as Ke,aJ as qe,aK as He}from"./vendor-icons-o7elvlXJ.js";import"./page-import-KrbyjuuQ.js";import"./page-reconcile-p5UREp47.js";import"./page-rate-calc-_eH7d9Js.js";var Ye={};const Je=window.location.origin,Ne=Ye.VITE_SCANBOT_LICENSE_KEY||"",D={widthPct:.72,heightPct:.38},we={widthPct:.88,heightPct:.55},Ze=3500,r={IDLE:"IDLE",SCANNING:"SCANNING",BARCODE_LOCKED:"BARCODE_LOCKED",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"},O=a=>{var p;try{(p=navigator==null?void 0:navigator.vibrate)==null||p.call(navigator,a)}catch{}},M=(a,p,V="sine")=>{try{const h=new(window.AudioContext||window.webkitAudioContext),x=h.createOscillator(),R=h.createGain();x.type=V,x.frequency.setValueAtTime(a,h.currentTime),R.gain.setValueAtTime(.12,h.currentTime),R.gain.exponentialRampToValueAtTime(.01,h.currentTime+p),x.connect(R),R.connect(h.destination),x.start(),x.stop(h.currentTime+p)}catch{}},Se=()=>{M(880,.12),setTimeout(()=>M(1100,.1),130)},ke=()=>M(600,.08),H=()=>M(200,.25,"sawtooth"),Ee=a=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const p=new SpeechSynthesisUtterance(a);p.rate=1.2,p.pitch=1,p.lang="en-IN",window.speechSynthesis.speak(p)}catch{}},i={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},Qe=`
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
`,en=a=>a>=.85?"high":a>=.55?"med":"low",Y=a=>`conf-dot conf-${en(a)}`,Re=a=>a==="learned"?{className:"source-badge source-learned",icon:"🧠",text:"Learned"}:a==="fuzzy_match"?{className:"source-badge source-ai",icon:"🔍",text:"Matched"}:a==="fuzzy_history"||a==="consignee_pattern"?{className:"source-badge source-history",icon:"📊",text:"History"}:a==="delhivery_pincode"||a==="india_post"||a==="pincode_lookup"||a==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"📍",text:"Pincode"}:null;function pn(){var ce,le,de,ue,pe,me,ge,he,fe,xe;const{pin:a}=Be();We();const[p,V]=s.useState(null),[h,x]=s.useState("connecting"),[R,b]=s.useState(""),[m,Ie]=s.useState(r.IDLE),[Ae,Pe]=s.useState(null),[j,J]=s.useState(""),[P,U]=s.useState(null),[nn,Z]=s.useState({}),[o,Q]=s.useState(null),[c,y]=s.useState({}),[f,X]=s.useState(null),[ee,W]=s.useState(null),[ne,K]=s.useState(""),[w,te]=s.useState({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,startedAt:Date.now()}),[L,ze]=s.useState(!1),v=s.useRef(null),ie=s.useRef(null),_=s.useRef(null),z=s.useRef(null),S=s.useRef(!1),G=s.useRef(null),d=s.useCallback(n=>{Ie(t=>(Pe(t),n))},[]);s.useEffect(()=>{if(!a){b("No PIN provided.");return}const n=Oe(Je,{auth:{scannerPin:a},transports:["websocket","polling"],reconnection:!0,reconnectionDelay:1500,reconnectionAttempts:20});return n.on("connect",()=>x("connecting")),n.on("scanner:paired",()=>{x("paired"),d(r.SCANNING)}),n.on("scanner:error",({message:t})=>{b(t),x("disconnected")}),n.on("scanner:session-ended",()=>{x("disconnected"),b("Session ended by desktop.")}),n.on("disconnect",()=>x("disconnected")),n.on("reconnect",()=>{h==="paired"&&d(r.SCANNING)}),n.on("scanner:scan-processed",t=>{if(t.status==="error"){W("error"),H(),O([100,50,100]),d(r.ERROR),b(t.error||"Scan failed on desktop.");return}Q(t),y({clientCode:t.clientCode||"",consignee:t.consignee||"",destination:t.destination||"",pincode:t.pincode||"",weight:t.weight||0,amount:t.amount||0,orderNo:t.orderNo||""}),Z({}),t.reviewRequired?d(r.REVIEWING):(Se(),O([50,30,50]),X({awb:t.awb,clientCode:t.clientCode,clientName:t.clientName}),d(r.SUCCESS))}),n.on("scanner:approval-result",({success:t,message:u,awb:g})=>{t?(Se(),O([50,30,50]),W("success"),X({awb:(o==null?void 0:o.awb)||g,clientCode:c.clientCode,clientName:(o==null?void 0:o.clientName)||c.clientCode}),d(r.SUCCESS)):(H(),b(u||"Approval failed."))}),n.on("scanner:ready-for-next",()=>{}),V(n),()=>{n.disconnect()}},[a]);const C=s.useCallback(async()=>{var n;try{if(z.current){try{const t=z.current;t!=null&&t.barcodeScanner&&await t.barcodeScanner.dispose()}catch{}z.current=null}if(_.current){try{await _.current.reset()}catch{}_.current=null}(n=v.current)!=null&&n.srcObject&&(v.current.srcObject.getTracks().forEach(t=>t.stop()),v.current.srcObject=null)}catch{}S.current=!1},[]),se=s.useCallback(async()=>{if(v.current){await C();try{if(Ne)try{const g=await(await ye(()=>import("./index-OhzldbFf.js").then(E=>E.i),__vite__mapDeps([0,1]))).default.initialize({licenseKey:Ne,enginePath:"/scanbot-sdk/"}),F={containerId:"scanbot-camera-container",onBarcodesDetected:E=>{var $;if(S.current)return;const I=($=E==null?void 0:E.barcodes)==null?void 0:$[0];I!=null&&I.text&&re(I.text)},style:{window:{widthProportion:D.widthPct,heightProportion:D.heightPct}}},T=await g.createBarcodeScanner(F);z.current={sdk:g,barcodeScanner:T};return}catch(u){console.warn("Scanbot init failed, falling back to ZXing:",u.message)}const{BrowserMultiFormatReader:n}=await ye(()=>import("./index-S8vgl5Ss.js"),__vite__mapDeps([])),t=new n;_.current=t,await t.decodeFromVideoDevice(void 0,v.current,u=>{S.current||u&&re(u.getText())})}catch(n){b("Camera access failed: "+n.message)}}},[C]),re=s.useCallback(n=>{const t=String(n||"").trim();if(!(!t||t.length<6||S.current)){if(S.current=!0,w.scannedAwbs.has(t)){O([100,50,100,50,100]),H(),K(t),setTimeout(()=>{K(""),S.current=!1},2500);return}O([50]),ke(),J(t),d(r.BARCODE_LOCKED),te(u=>{const g={...u,scanNumber:u.scanNumber+1};return g.scannedAwbs=new Set(u.scannedAwbs),g.scannedAwbs.add(t),g}),setTimeout(()=>d(r.CAPTURING),600)}},[w,d]);s.useEffect(()=>(m===r.SCANNING&&(S.current=!1,se()),()=>{m===r.SCANNING&&C()}),[m,se,C]);const oe=s.useCallback(async()=>{await C();try{const n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}});v.current&&(v.current.srcObject=n,await v.current.play())}catch(n){b("Camera access failed: "+n.message)}},[C]);s.useEffect(()=>{m===r.CAPTURING&&oe()},[m,oe]);const ae=s.useCallback(()=>{const n=v.current,t=ie.current;if(!n||!t||!n.videoWidth)return null;const u=n.getBoundingClientRect(),g=t.getBoundingClientRect(),F=n.videoWidth/u.width,T=n.videoHeight/u.height,E=Math.max(0,(g.left-u.left)*F),I=Math.max(0,(g.top-u.top)*T),$=Math.min(n.videoWidth-E,g.width*F),be=Math.min(n.videoHeight-I,g.height*T),A=document.createElement("canvas");return A.width=Math.min(1800,Math.round($)),A.height=Math.round(A.width/$*be),A.getContext("2d").drawImage(n,E,I,$,be,0,0,A.width,A.height),A.toDataURL("image/jpeg",.92).split(",")[1]||null},[]),Fe=s.useCallback(()=>{W("white"),ke(),O([30]);const n=ae();if(!n){b("Could not capture image. Try again.");return}U(`data:image/jpeg;base64,${n}`),C(),d(r.PREVIEW)},[ae,C,d]),Te=s.useCallback(()=>{if(!p||!j||!P)return;d(r.PROCESSING);const n={scanNumber:w.scanNumber,recentClient:w.dominantClient,sessionDurationMin:Math.round((Date.now()-w.startedAt)/6e4)},t=P.split(",")[1]||P;p.emit("scanner:scan",{awb:j,imageBase64:t,focusImageBase64:t,sessionContext:n}),setTimeout(()=>{m===r.PROCESSING&&b("Processing is taking longer than expected...")},2e4)},[p,j,P,w,m,d]),$e=s.useCallback(()=>{if(!(!p||!o)){if(d(r.APPROVING),o.ocrExtracted||o){const n={clientCode:o.clientCode||"",clientName:o.clientName||"",consignee:o.consignee||"",destination:o.destination||""},t={clientCode:c.clientCode||"",clientName:c.clientCode||"",consignee:c.consignee||"",destination:c.destination||""};p.emit("scanner:learn-corrections",{pin:a,ocrFields:n,approvedFields:t})}p.emit("scanner:approval-submit",{shipmentId:o.shipmentId,awb:o.awb||j,fields:{clientCode:c.clientCode,consignee:c.consignee,destination:c.destination,pincode:c.pincode,weight:parseFloat(c.weight)||0,amount:parseFloat(c.amount)||0,orderNo:c.orderNo||""}},n=>{n!=null&&n.success||(d(r.REVIEWING),b((n==null?void 0:n.message)||"Approval failed."))}),c.clientCode&&c.clientCode!=="MISC"&&te(n=>{var g;const t={...n.clientFreq};t[c.clientCode]=(t[c.clientCode]||0)+1;const u=Object.entries(t).sort((F,T)=>T[1]-F[1]);return{...n,clientFreq:t,dominantClient:((g=u[0])==null?void 0:g[1])>=2?u[0][0]:null}})}},[p,o,c,j,a,d]),B=s.useCallback(()=>{clearTimeout(G.current),J(""),U(null),Q(null),y({}),Z({}),X(null),b(""),K(""),S.current=!1,d(r.SCANNING)},[d]);s.useEffect(()=>{if(m===r.SUCCESS)return G.current=setTimeout(B,Ze),()=>clearTimeout(G.current)},[m,B]),s.useEffect(()=>{if(L)if(m===r.REVIEWING&&o){const n=[o.clientName||o.clientCode,o.destination,o.weight?`${o.weight} kilograms`:""].filter(Boolean);n.length&&Ee(n.join(". "))}else m===r.SUCCESS&&f&&Ee(`${f.clientName||f.clientCode||"Shipment"} Verified.`)},[L,m,o,f]),s.useEffect(()=>()=>{C(),clearTimeout(G.current)},[C]);const N=n=>`msp-step ${m===n?"active":""} ${Ae===n?"exiting":""}`,k=s.useMemo(()=>{if(!o)return{};const n=o.ocrExtracted||o;return{clientCode:{confidence:(n==null?void 0:n.clientNameConfidence)||0,source:(n==null?void 0:n.clientNameSource)||null},consignee:{confidence:(n==null?void 0:n.consigneeConfidence)||0,source:(n==null?void 0:n.consigneeSource)||null},destination:{confidence:(n==null?void 0:n.destinationConfidence)||0,source:(n==null?void 0:n.destinationSource)||null},pincode:{confidence:(n==null?void 0:n.pincodeConfidence)||0,source:null},weight:{confidence:(n==null?void 0:n.weightConfidence)||0,source:null}}},[o]),l=((ce=o==null?void 0:o.ocrExtracted)==null?void 0:ce.intelligence)||(o==null?void 0:o.intelligence)||null;return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:Qe}),e.jsxs("div",{className:"msp-root",children:[ee&&e.jsx("div",{className:`flash-overlay flash-${ee}`,onAnimationEnd:()=>W(null)}),ne&&e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[e.jsx(ve,{size:48,color:"white"}),e.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),e.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:ne}),e.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),e.jsx("div",{className:N(r.IDLE),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:h==="connecting"?e.jsx(q,{size:28,color:i.primary,style:{animation:"spin 1s linear infinite"}}):e.jsx(je,{size:28,color:i.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:h==="connecting"?"Connecting...":"Disconnected"}),e.jsx("div",{style:{fontSize:"0.82rem",color:i.muted},children:R||`Connecting to session ${a}`})]}),h==="disconnected"&&e.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[e.jsx(q,{size:16})," Reconnect"]})]})}),e.jsx("div",{className:N(r.SCANNING),children:e.jsxs("div",{className:"cam-viewport",children:[!z.current&&e.jsx("video",{ref:v,autoPlay:!0,playsInline:!0,muted:!0,style:{width:"100%",height:"100%",objectFit:"cover"}}),e.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:z.current?"block":"none"}}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{className:"scan-guide",style:{width:`${D.widthPct*100}%`,height:`${D.heightPct*100}%`},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"}),e.jsx("div",{className:"scan-laser"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(Le,{size:12})," ",a]}),e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(_e,{size:12})," ",w.scanNumber]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:"Point camera at barcode"}),e.jsx("div",{style:{display:"flex",gap:12},children:e.jsx("button",{className:"cam-hud-chip",onClick:()=>ze(!L),style:{border:"none",cursor:"pointer"},children:L?e.jsx(Ge,{size:14}):e.jsx(De,{size:14})})})]})]})}),e.jsx("div",{className:N(r.BARCODE_LOCKED),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:i.successLight,gap:16},children:[e.jsx(Me,{size:48,color:i.success}),e.jsx("div",{className:"mono",style:{fontSize:"1.5rem",fontWeight:700,color:i.success},children:j}),e.jsx("div",{style:{color:i.muted,fontSize:"0.82rem"},children:"Barcode locked • Preparing camera..."})]})}),e.jsx("div",{className:N(r.CAPTURING),children:e.jsxs("div",{className:"cam-viewport",children:[e.jsx("video",{ref:m===r.CAPTURING?v:void 0,autoPlay:!0,playsInline:!0,muted:!0,style:{width:"100%",height:"100%",objectFit:"cover"}}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{ref:ie,className:"scan-guide",style:{width:`${we.widthPct*100}%`,height:`${we.heightPct*100}%`,borderColor:"rgba(255,255,255,0.85)"},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"})]})}),e.jsx("div",{className:"cam-hud",children:e.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[e.jsx(Ve,{size:12})," ",j]})}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:500,textAlign:"center"},children:"Place AWB slip inside the frame"}),e.jsx("button",{className:"capture-btn",onClick:Fe,children:e.jsx("div",{className:"capture-btn-inner"})})]})]})}),e.jsx("div",{className:N(r.PREVIEW),children:e.jsxs("div",{style:{background:i.bg,display:"flex",flexDirection:"column",height:"100%"},children:[e.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${i.border}`},children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.72rem",color:i.muted,fontWeight:600},children:"CAPTURED"}),e.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:j})]})}),e.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:P&&e.jsx("img",{src:P,alt:"Captured label",className:"preview-img"})}),e.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{U(null),d(r.CAPTURING)},children:[e.jsx(Ce,{size:16})," Retake"]}),e.jsxs("button",{className:"btn btn-primary",style:{flex:2},onClick:Te,children:[e.jsx(Ue,{size:16})," Use Photo"]})]})]})}),e.jsx("div",{className:N(r.PROCESSING),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16},children:[e.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[e.jsx(Xe,{size:22,color:i.primary,style:{animation:"spin 2s linear infinite"}}),e.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:i.primary},children:"Intelligence Engine"})]}),e.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:i.muted},children:j})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(n=>e.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:n}),e.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),e.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},n))]})}),e.jsx("div",{className:N(r.REVIEWING),children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%"},children:[e.jsxs("div",{style:{padding:"14px 20px",borderBottom:`1px solid ${i.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.65rem",color:i.muted,fontWeight:600},children:"REVIEW EXTRACTION"}),e.jsx("div",{className:"mono",style:{fontSize:"0.95rem",fontWeight:700},children:(o==null?void 0:o.awb)||j})]}),(l==null?void 0:l.learnedFieldCount)>0&&e.jsxs("div",{className:"source-badge source-learned",children:["🧠 ",l.learnedFieldCount," auto-corrected"]})]}),e.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsxs("div",{className:`field-card ${(((le=k.clientCode)==null?void 0:le.confidence)||0)<.55?"warning":""}`,children:[e.jsx("div",{className:Y(((de=k.clientCode)==null?void 0:de.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((ue=k.clientCode)==null?void 0:ue.source)&&(()=>{const n=Re(k.clientCode.source);return n?e.jsxs("span",{className:n.className,children:[n.icon," ",n.text]}):null})()]}),e.jsx("input",{className:"field-input",value:c.clientCode||"",onChange:n=>y(t=>({...t,clientCode:n.target.value.toUpperCase()})),placeholder:"Client code"}),((pe=l==null?void 0:l.clientMatches)==null?void 0:pe.length)>0&&l.clientNeedsConfirmation&&e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:l.clientMatches.slice(0,3).map(n=>e.jsxs("button",{onClick:()=>y(t=>({...t,clientCode:n.code})),style:{fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:`1px solid ${i.border}`,background:c.clientCode===n.code?i.primaryLight:i.surface,color:i.text,cursor:"pointer",fontFamily:"inherit",fontWeight:500},children:[n.code," (",Math.round(n.score*100),"%)"]},n.code))})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:Y(((me=k.consignee)==null?void 0:me.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Consignee"}),e.jsx("input",{className:"field-input",value:c.consignee||"",onChange:n=>y(t=>({...t,consignee:n.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:Y(((ge=k.destination)==null?void 0:ge.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((he=k.destination)==null?void 0:he.source)&&(()=>{const n=Re(k.destination.source);return n?e.jsxs("span",{className:n.className,children:[n.icon," ",n.text]}):null})()]}),e.jsx("input",{className:"field-input",value:c.destination||"",onChange:n=>y(t=>({...t,destination:n.target.value.toUpperCase()})),placeholder:"City"}),(l==null?void 0:l.pincodeCity)&&l.pincodeCity!==c.destination&&e.jsxs("button",{onClick:()=>y(n=>({...n,destination:l.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:i.successLight,color:i.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["📍 Pincode suggests: ",l.pincodeCity]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Pincode"}),e.jsx("input",{className:"field-input",value:c.pincode||"",onChange:n=>y(t=>({...t,pincode:n.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),e.jsx("div",{className:`field-card ${(fe=l==null?void 0:l.weightAnomaly)!=null&&fe.anomaly?"warning":""}`,children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Weight (kg)"}),e.jsx("input",{className:"field-input",value:c.weight||"",onChange:n=>y(t=>({...t,weight:n.target.value})),placeholder:"0.0",inputMode:"decimal"}),((xe=l==null?void 0:l.weightAnomaly)==null?void 0:xe.anomaly)&&e.jsxs("div",{style:{fontSize:"0.6rem",color:i.warning,marginTop:2,fontWeight:500},children:["⚠️ ",l.weightAnomaly.warning]})]})})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Amount (₹)"}),e.jsx("input",{className:"field-input",value:c.amount||"",onChange:n=>y(t=>({...t,amount:n.target.value})),placeholder:"0",inputMode:"decimal"})]})}),e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Order No"}),e.jsx("input",{className:"field-input",value:c.orderNo||"",onChange:n=>y(t=>({...t,orderNo:n.target.value})),placeholder:"Optional"})]})})]})]}),e.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${i.border}`,display:"flex",gap:10},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:B,children:[e.jsx(Ke,{size:16})," Skip"]}),e.jsxs("button",{className:"btn btn-success btn-lg",style:{flex:2},onClick:$e,disabled:m===r.APPROVING,children:[m===r.APPROVING?e.jsx(q,{size:16,style:{animation:"spin 1s linear infinite"}}):e.jsx(qe,{size:16}),m===r.APPROVING?"Saving...":"Approve & Save"]})]})]})}),e.jsx("div",{className:N(r.APPROVING)}),e.jsx("div",{className:N(r.SUCCESS),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[e.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:i.success,strokeWidth:"3",className:"success-check-circle"}),e.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:i.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:i.success,marginBottom:4},children:"Saved Successfully"}),e.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700},children:f==null?void 0:f.awb}),(f==null?void 0:f.clientCode)&&e.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:i.primaryLight,color:i.primary,fontSize:"0.78rem",fontWeight:600},children:f.clientName||f.clientCode})]}),e.jsxs("div",{style:{fontSize:"0.72rem",color:i.muted},children:["#",w.scanNumber," scanned • Auto-continuing in 3s"]}),e.jsxs("button",{className:"btn btn-primary btn-lg btn-full",onClick:B,style:{maxWidth:320},children:[e.jsx(He,{size:18})," Scan Next Parcel"]})]})}),e.jsx("div",{className:N(r.ERROR),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(ve,{size:32,color:i.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:i.error},children:"Scan Error"}),e.jsx("div",{style:{fontSize:"0.82rem",color:i.muted,marginTop:4},children:R})]}),e.jsxs("button",{className:"btn btn-primary",onClick:B,children:[e.jsx(Ce,{size:16})," Try Again"]})]})}),h==="disconnected"&&m!==r.IDLE&&e.jsxs("div",{className:"offline-banner",children:[e.jsx(je,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline — Reconnecting..."]})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{pn as default};
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/index-OhzldbFf.js","assets/vendor-helmet-Dwc3L0SQ.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
