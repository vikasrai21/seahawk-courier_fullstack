import{l as yt,_ as Ze}from"./index-DjXvc5AE.js";import{j as e}from"./page-landing-Bx5c8M2c.js";import{r as i}from"./vendor-helmet-Dwc3L0SQ.js";import{c as vt,u as Ct}from"./vendor-react-DGJm5saH.js";import{b as et,R as xe,aD as tt,B as jt,V as be,aE as wt,a5 as Nt,aF as nt,aG as St,z as kt,aH as Et,aI as Ft,au as Rt,d as At,aJ as it,O as It,ax as zt,X as Tt,aK as Ot}from"./vendor-icons-DNlwW1li.js";import"./page-import-Djha-JxU.js";import"./page-reconcile-MLkeoM-E.js";import"./page-rate-calc-Swpu-Ill.js";const Wt=window.location.origin,st={w:"90vw",h:"18vw"},rt={w:"92vw",h:"130vw"},Mt=3500,Bt="mobile_scanner_offline_queue",Pt=80,ye=["code_128","code_39","code_93","codabar","ean_13","ean_8","itf","qr_code"],s={IDLE:"IDLE",HOME:"HOME",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"},U=c=>{var v;try{(v=navigator==null?void 0:navigator.vibrate)==null||v.call(navigator,c)}catch{}},ae=(c,v,P="sine")=>{try{const l=new(window.AudioContext||window.webkitAudioContext),_=l.createOscillator(),C=l.createGain();_.type=P,_.frequency.setValueAtTime(c,l.currentTime),C.gain.setValueAtTime(.12,l.currentTime),C.gain.exponentialRampToValueAtTime(.01,l.currentTime+v),_.connect(C),C.connect(l.destination),_.start(),_.stop(l.currentTime+v)}catch{}},ve=()=>{ae(880,.12),setTimeout(()=>ae(1100,.1),130)},ot=()=>ae(600,.08),Ce=()=>ae(200,.25,"sawtooth"),at=c=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const v=new SpeechSynthesisUtterance(c);v.rate=1.2,v.pitch=1,v.lang="en-IN",window.speechSynthesis.speak(v)}catch{}},a={bg:"#FAFBFD",surface:"#FFFFFF",border:"rgba(0,0,0,0.06)",text:"#111827",muted:"#6B7280",mutedLight:"#9CA3AF",primary:"#4F46E5",primaryLight:"#EEF2FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FEF2F2"},o=a,_t=`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');

.msp-root {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: #F8FAFC;
  color: ${o.text};
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

/* ── Camera viewport ── */
.cam-viewport {
  position: relative; width: 100%; flex: 1;
  min-height: 100dvh;
  background: transparent; overflow: hidden;
}
.cam-viewport video {
  width: 100%; height: 100%; object-fit: cover;
}
.cam-overlay {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
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

/* ── Cards / Buttons ── */
.card {
  background: ${o.surface}; border: 1px solid ${o.border};
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
.btn-outline { background: ${o.surface}; border: 1.5px solid ${o.border}; color: ${o.text}; }
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
  background: ${o.surface}; border: 1px solid ${o.border}; border-radius: 12px;
}
.field-card.warning { border-color: ${o.warning}; background: ${o.warningLight}; }
.field-label { font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: ${o.muted}; margin-bottom: 2px; }
.field-input {
  width: 100%; background: ${o.bg}; border: 1px solid ${o.border};
  border-radius: 8px; padding: 8px 10px;
  font-family: inherit; font-size: 0.82rem; font-weight: 500; color: ${o.text}; outline: none;
}
.field-input:focus { border-color: ${o.primary}; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }

/* ── Confidence dots ── */
.conf-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
.conf-high { background: ${o.success}; }
.conf-med  { background: ${o.warning}; }
.conf-low  { background: ${o.error}; }

/* ── Source badges ── */
.source-badge { font-size: 0.6rem; padding: 2px 6px; border-radius: 6px; font-weight: 600; display: inline-flex; align-items: center; gap: 3px; }
.source-learned  { background: #F5F3FF; color: #7C3AED; }
.source-ai       { background: ${o.primaryLight}; color: ${o.primary}; }
.source-history  { background: ${o.warningLight}; color: ${o.warning}; }
.source-pincode  { background: ${o.successLight}; color: ${o.success}; }

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
  background: ${o.warningLight}; color: ${o.warning};
  text-align: center; padding: 6px; font-size: 0.72rem; font-weight: 600;
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 99;
}
.scroll-panel { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 16px 20px; }

/* ── Bridged Home Header ── */
.home-header {
  background: linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%);
  padding: 20px 20px 32px; position: relative; overflow: hidden;
  border-bottom: 1px solid #E2E8F0;
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
  font-size: 1.05rem; font-weight: 800; color: #0F172A; letter-spacing: -0.01em;
  display: flex; align-items: center; gap: 8px;
}
.home-logo-badge {
  background: #FFFFFF;
  border: 1px solid #E2E8F0; border-radius: 20px;
  padding: 5px 12px; font-size: 0.68rem; font-weight: 600; color: #475569;
  display: flex; align-items: center; gap: 5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}
.action-buttons-row {
  display: flex; gap: 10px; margin-top: 20px; width: 100%;
}
.action-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px; border-radius: 12px; border: 1px solid #E2E8F0;
  background: #FFFFFF; color: #475569; font-size: 0.72rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}
.action-btn:active { transform: scale(0.96); background: #F8FAFC; }
.action-btn.danger { color: #DC2626; border-color: #FECACA; background: #FEF2F2; }
`,Dt=c=>c>=.85?"high":c>=.55?"med":"low",je=c=>`conf-dot conf-${Dt(c)}`,ct=c=>c==="learned"?{className:"source-badge source-learned",icon:"🧠",text:"Learned"}:c==="fuzzy_match"?{className:"source-badge source-ai",icon:"🔍",text:"Matched"}:c==="fuzzy_history"||c==="consignee_pattern"?{className:"source-badge source-history",icon:"📊",text:"History"}:c==="delhivery_pincode"||c==="india_post"||c==="pincode_lookup"||c==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"📍",text:"Pincode"}:null;function Kt(){var Pe,_e,De,$e,Ge,Le,Ue,Ve,He,qe;const{pin:c}=vt(),v=Ct(),P=`${Bt}:${c||"unknown"}`,[l,_]=i.useState(null),[C,V]=i.useState("connecting"),[we,N]=i.useState(""),[f,lt]=i.useState(s.IDLE),[F,ce]=i.useState(""),[$,le]=i.useState(null),[$t,Ne]=i.useState({}),[r,Se]=i.useState(null),[d,E]=i.useState({}),[b,X]=i.useState(null),[ke,Q]=i.useState(null),[Ee,de]=i.useState(""),[y,Fe]=i.useState([]),[ue,Re]=i.useState(!1),[Gt,Ae]=i.useState(0),[pe,me]=i.useState(!1),[I,Ie]=i.useState({scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now()}),[Y,dt]=i.useState(!1),x=i.useRef(null),ge=i.useRef(null),R=i.useRef(null),W=i.useRef(null),z=i.useRef(!1),K=i.useRef(null),ut=i.useRef(!1),G=i.useRef(s.IDLE),J=i.useRef(null),D=i.useRef(null),ze=i.useRef(new Set),Z=i.useCallback(t=>{Fe(t);try{t.length?localStorage.setItem(P,JSON.stringify(t)):localStorage.removeItem(P)}catch{}},[P]),Te=i.useCallback(t=>{const n={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:t};return Z([...y,n]),n},[y,Z]),ee=i.useCallback(()=>{!l||!l.connected||!y.length||(y.forEach(t=>{var n,p;!((n=t==null?void 0:t.payload)!=null&&n.awb)||!((p=t==null?void 0:t.payload)!=null&&p.imageBase64)||l.emit("scanner:scan",t.payload)}),Z([]))},[l,y,Z]),u=i.useCallback(t=>{lt(t)},[]),pt=i.useCallback(()=>{l&&l.disconnect(),v("/app")},[l,v]),mt=i.useCallback(()=>{ee()},[ee]);i.useEffect(()=>{G.current=f},[f]),i.useEffect(()=>{if(!c){N("No PIN provided.");return}const t=yt(Wt,{auth:{scannerPin:c},transports:["websocket","polling"],reconnection:!0,reconnectionDelay:1500,reconnectionAttempts:20});return t.on("connect",()=>V("connecting")),t.on("scanner:paired",()=>{V("paired"),u(s.HOME)}),t.on("scanner:error",({message:n})=>{N(n),V("disconnected")}),t.on("scanner:session-ended",()=>{V("disconnected"),N("Session ended by desktop.")}),t.on("disconnect",()=>V("disconnected")),t.on("reconnect",()=>{C==="paired"&&u(s.SCANNING)}),t.on("scanner:scan-processed",n=>{if(n.status==="error"){Q("error"),Ce(),U([100,50,100]),u(s.ERROR),N(n.error||"Scan failed on desktop.");return}Se(n),E({clientCode:n.clientCode||"",consignee:n.consignee||"",destination:n.destination||"",pincode:n.pincode||"",weight:n.weight||0,amount:n.amount||0,orderNo:n.orderNo||""}),Ne({}),n.reviewRequired?u(s.REVIEWING):(ve(),U([50,30,50]),X({awb:n.awb,clientCode:n.clientCode,clientName:n.clientName}),u(s.SUCCESS))}),t.on("scanner:approval-result",({success:n,message:p,awb:g})=>{n?(ve(),U([50,30,50]),Q("success"),X({awb:(r==null?void 0:r.awb)||g,clientCode:d.clientCode,clientName:(r==null?void 0:r.clientName)||d.clientCode}),u(s.SUCCESS)):(Ce(),N(p||"Approval failed."))}),t.on("scanner:ready-for-next",()=>{}),_(t),()=>{t.disconnect()}},[c]),i.useEffect(()=>{try{const t=localStorage.getItem(P);if(!t)return;const n=JSON.parse(t);Array.isArray(n)&&n.length&&Fe(n)}catch{}},[P]),i.useEffect(()=>{C==="paired"&&(l!=null&&l.connected)&&y.length&&ee()},[C,l,y.length,ee]);const te=i.useCallback(async()=>{var t;try{if(me(!1),W.current){try{const n=W.current;n!=null&&n.barcodeScanner&&await n.barcodeScanner.dispose()}catch{}W.current=null}if(R.current){try{await R.current.reset()}catch{}R.current=null}(t=x.current)!=null&&t.srcObject&&(x.current.srcObject.getTracks().forEach(n=>n.stop()),x.current.srcObject=null)}catch{}},[]),L=i.useCallback(async()=>{try{if(W.current){try{await W.current.barcodeScanner.dispose()}catch{}W.current=null}if(R.current){try{R.current._type==="native"?R.current.reset():await R.current.reset()}catch{}R.current=null}}catch{}},[]),Oe=i.useCallback(async()=>{if(x.current){await L();try{if(!x.current.srcObject){let h=null;try{h=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{h=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}x.current.srcObject=h,await x.current.play()}if(typeof window.BarcodeDetector<"u"){let h=ye;try{const k=await window.BarcodeDetector.getSupportedFormats();h=ye.filter(O=>k.includes(O)),h.length||(h=ye)}catch{}const S=new window.BarcodeDetector({formats:h});let j=null;const T=async()=>{var O;if(z.current||G.current!==s.SCANNING)return;const k=x.current;if(!k||k.readyState<2){j=requestAnimationFrame(T);return}try{const w=await S.detect(k);w.length>0&&w[0].rawValue&&((O=D.current)==null||O.call(D,w[0].rawValue))}catch{}G.current===s.SCANNING&&(j=requestAnimationFrame(()=>setTimeout(T,15)))};R.current={_type:"native",reset:()=>{j&&cancelAnimationFrame(j),j=null}},setTimeout(T,300);return}const[{BrowserMultiFormatReader:t},n]=await Promise.all([Ze(()=>import("./index-4oYbt_M2.js"),__vite__mapDeps([0,1])),Ze(()=>import("./index-D3Mz4UNV.js"),__vite__mapDeps([]))]),p=new Map([[n.DecodeHintType.POSSIBLE_FORMATS,[n.BarcodeFormat.CODE_128,n.BarcodeFormat.ITF,n.BarcodeFormat.CODE_39,n.BarcodeFormat.CODE_93,n.BarcodeFormat.CODABAR,n.BarcodeFormat.EAN_13,n.BarcodeFormat.EAN_8]],[n.DecodeHintType.TRY_HARDER,!0],[n.DecodeHintType.ASSUME_GS1,!1],[n.DecodeHintType.CHARACTER_SET,"UTF-8"]]),g=new t(p,80);R.current=g,g.decodeFromVideoElement(x.current,h=>{var S;z.current||h&&((S=D.current)==null||S.call(D,h.getText()))})}catch(t){N("Camera access failed: "+t.message)}}},[L]),We=i.useCallback(t=>{const n=String(t||"").trim().replace(/\s+/g,"").toUpperCase();if(!(!n||n.length<6||z.current||G.current!==s.SCANNING)){if(z.current=!0,ze.current.has(n)){U([100,50,100,50,100]),Ce(),de(n),setTimeout(()=>{de(""),z.current=!1},2500);return}clearTimeout(J.current),U([50]),ot(),ce(n),Ie(p=>{const g={...p,scanNumber:p.scanNumber+1};return g.scannedAwbs=new Set(p.scannedAwbs),g.scannedAwbs.add(n),ze.current=g.scannedAwbs,g}),J.current=setTimeout(()=>{G.current===s.SCANNING&&u(s.CAPTURING)},Pt)}},[u]);i.useEffect(()=>{D.current=We},[We]),i.useEffect(()=>(f===s.SCANNING&&(z.current=!1,Oe()),()=>{f===s.SCANNING&&L()}),[f,Oe,L]);const Me=i.useCallback(async()=>{var t;await L();try{if((t=x.current)!=null&&t.srcObject){me(!0);return}const n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}});x.current&&(x.current.srcObject=n,await x.current.play(),me(!0))}catch(n){N("Camera access failed: "+n.message)}},[L]);i.useEffect(()=>{f===s.CAPTURING&&Me()},[f,Me]),i.useEffect(()=>{if(f!==s.CAPTURING){Re(!1),Ae(0),ut.current=!1;return}const t=setInterval(()=>{const n=x.current,p=ge.current;if(!n||!p||!n.videoWidth||!n.videoHeight)return;const g=n.getBoundingClientRect(),h=p.getBoundingClientRect(),S=n.videoWidth/Math.max(g.width,1),j=n.videoHeight/Math.max(g.height,1),T=Math.max(0,Math.floor((h.left-g.left)*S)),k=Math.max(0,Math.floor((h.top-g.top)*j)),O=Math.max(24,Math.floor(h.width*S)),w=Math.max(24,Math.floor(h.height*j)),ne=document.createElement("canvas"),ie=96,se=72;ne.width=ie,ne.height=se;const he=ne.getContext("2d",{willReadFrequently:!0});if(!he)return;he.drawImage(n,T,k,Math.min(O,n.videoWidth-T),Math.min(w,n.videoHeight-k),0,0,ie,se);const re=he.getImageData(0,0,ie,se).data;let Xe=0,Qe=0,Ye=0,Ke=0;for(let B=0;B<re.length;B+=4){const q=.2126*re[B]+.7152*re[B+1]+.0722*re[B+2];Xe+=q,Qe+=q*q,B>0&&Math.abs(q-Ke)>26&&Ye++,Ke=q}const fe=ie*se,oe=Xe/fe,xt=Math.sqrt(Math.max(0,Qe/fe-oe*oe)),bt=Ye/Math.max(fe,1),Je=oe>35&&oe<225&&xt>24&&bt>.12;Re(Je),Ae(B=>Je?Math.min(B+1,8):0)},320);return()=>clearInterval(t)},[f]);const Be=i.useCallback(()=>{const t=x.current,n=ge.current;if(!t||!n||!t.videoWidth)return null;const p=t.getBoundingClientRect(),g=n.getBoundingClientRect(),h=t.videoWidth/p.width,S=t.videoHeight/p.height,j=Math.max(0,(g.left-p.left)*h),T=Math.max(0,(g.top-p.top)*S),k=Math.min(t.videoWidth-j,g.width*h),O=Math.min(t.videoHeight-T,g.height*S),w=document.createElement("canvas");return w.width=Math.min(1200,Math.round(k)),w.height=Math.round(w.width/k*O),w.getContext("2d").drawImage(t,j,T,k,O,0,0,w.width,w.height),w.toDataURL("image/jpeg",.75).split(",")[1]||null},[]),gt=i.useCallback(()=>{Q("white"),ot(),U([30]);const t=Be();if(!t){N("Could not capture image. Try again."),z.current=!1;return}le(`data:image/jpeg;base64,${t}`),te(),u(s.PREVIEW)},[Be,te,u]),ht=i.useCallback(()=>{if(!F||!$)return;u(s.PROCESSING);const t={scanNumber:I.scanNumber,recentClient:I.dominantClient,dominantClient:I.dominantClient,dominantClientCount:I.dominantClientCount,sessionDurationMin:Math.round((Date.now()-I.startedAt)/6e4)},n=$.split(",")[1]||$,p={awb:F,imageBase64:n,focusImageBase64:n,sessionContext:t};if(!l||!l.connected||C!=="paired"){Te(p),ve(),X({awb:F,clientCode:"OFFLINE",clientName:"Queued Offline",offlineQueued:!0}),u(s.SUCCESS);return}l.emit("scanner:scan",p),setTimeout(()=>{G.current===s.PROCESSING&&(N("OCR timed out after 40 seconds. Check that GEMINI_API_KEY is set on Railway, then try again."),u(s.ERROR))},4e4)},[l,F,$,I,u,C,Te]),ft=i.useCallback(()=>{if(!(!l||!r)){if(u(s.APPROVING),r.ocrExtracted||r){const t={clientCode:r.clientCode||"",clientName:r.clientName||"",consignee:r.consignee||"",destination:r.destination||""},n={clientCode:d.clientCode||"",clientName:d.clientCode||"",consignee:d.consignee||"",destination:d.destination||""};l.emit("scanner:learn-corrections",{pin:c,ocrFields:t,approvedFields:n})}l.emit("scanner:approval-submit",{shipmentId:r.shipmentId,awb:r.awb||F,fields:{clientCode:d.clientCode,consignee:d.consignee,destination:d.destination,pincode:d.pincode,weight:parseFloat(d.weight)||0,amount:parseFloat(d.amount)||0,orderNo:d.orderNo||""}},t=>{t!=null&&t.success||(u(s.REVIEWING),N((t==null?void 0:t.message)||"Approval failed."))}),d.clientCode&&d.clientCode!=="MISC"&&Ie(t=>{var g,h;const n={...t.clientFreq};n[d.clientCode]=(n[d.clientCode]||0)+1;const p=Object.entries(n).sort((S,j)=>j[1]-S[1]);return{...t,clientFreq:n,dominantClient:((g=p[0])==null?void 0:g[1])>=2?p[0][0]:null,dominantClientCount:((h=p[0])==null?void 0:h[1])||0}})}},[l,r,d,F,c,u]),H=i.useCallback(()=>{clearTimeout(K.current),clearTimeout(J.current),ce(""),le(null),Se(null),E({}),Ne({}),X(null),N(""),de(""),z.current=!1,u(s.SCANNING)},[u]);i.useEffect(()=>{if(f===s.SUCCESS)return K.current=setTimeout(H,Mt),()=>clearTimeout(K.current)},[f,H]),i.useEffect(()=>{if(Y)if(f===s.REVIEWING&&r){const t=[r.clientName||r.clientCode,r.destination,r.weight?`${r.weight} kilograms`:""].filter(Boolean);t.length&&at(t.join(". "))}else f===s.SUCCESS&&b&&at(`${b.clientName||b.clientCode||"Shipment"} Verified.`)},[Y,f,r,b]),i.useEffect(()=>()=>{te(),clearTimeout(K.current),clearTimeout(J.current)},[te]);const A=t=>`msp-step ${f===t?"active":""}`,M=i.useMemo(()=>{if(!r)return{};const t=r.ocrExtracted||r;return{clientCode:{confidence:(t==null?void 0:t.clientNameConfidence)||0,source:(t==null?void 0:t.clientNameSource)||null},consignee:{confidence:(t==null?void 0:t.consigneeConfidence)||0,source:(t==null?void 0:t.consigneeSource)||null},destination:{confidence:(t==null?void 0:t.destinationConfidence)||0,source:(t==null?void 0:t.destinationSource)||null},pincode:{confidence:(t==null?void 0:t.pincodeConfidence)||0,source:null},weight:{confidence:(t==null?void 0:t.weightConfidence)||0,source:null}}},[r]),m=((Pe=r==null?void 0:r.ocrExtracted)==null?void 0:Pe.intelligence)||(r==null?void 0:r.intelligence)||null;return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:_t}),e.jsxs("div",{className:"msp-root",children:[ke&&e.jsx("div",{className:`flash-overlay flash-${ke}`,onAnimationEnd:()=>Q(null)}),Ee&&e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[e.jsx(et,{size:48,color:"white"}),e.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),e.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:Ee}),e.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),e.jsx("div",{className:A(s.IDLE),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24,background:"#F8FAFC"},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:a.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:C==="connecting"?e.jsx(xe,{size:28,color:a.primary,style:{animation:"spin 1s linear infinite"}}):e.jsx(tt,{size:28,color:a.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:C==="connecting"?"Connecting...":"Disconnected"}),e.jsx("div",{style:{fontSize:"0.82rem",color:a.muted},children:we||`Connecting to session ${c}`})]}),C==="disconnected"&&e.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[e.jsx(xe,{size:16})," Reconnect"]})]})}),e.jsxs("div",{className:A(s.HOME),children:[e.jsxs("div",{className:"home-header",children:[e.jsxs("div",{className:"home-logo-row",children:[e.jsxs("div",{className:"home-logo-text",children:[e.jsx("img",{src:"/images/logo.png",alt:"Sea Hawk",style:{height:28,width:"auto",objectFit:"contain",padding:2,background:"white",borderRadius:6,border:"1px solid #E2E8F0"}}),e.jsx("span",{children:"Seahawk Bridge"})]}),e.jsxs("div",{className:"home-logo-badge",children:[e.jsx(jt,{size:13,color:o.primary}),e.jsxs("span",{children:["Linked: ",c]})]})]}),e.jsxs("div",{className:"action-buttons-row",children:[e.jsxs("button",{className:"action-btn",onClick:()=>v("/app"),children:[e.jsx(be,{size:14})," Go Back"]}),e.jsxs("button",{className:"action-btn",onClick:mt,children:[e.jsx(wt,{size:14})," ",y.length>0?`Sync (${y.length})`:"Synced"]}),e.jsxs("button",{className:"action-btn danger",onClick:pt,children:[e.jsx(Nt,{size:14})," End Session"]})]})]}),e.jsx("div",{style:{padding:"0 20px",marginTop:-24,position:"relative",zIndex:10},children:e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10},children:[e.jsxs("div",{className:"card",style:{padding:"12px 10px",textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.3rem",fontWeight:800},children:I.scanNumber}),e.jsx("div",{style:{fontSize:"0.58rem",fontWeight:600,color:o.muted,textTransform:"uppercase",marginTop:3},children:"Scanned"})]}),e.jsxs("div",{className:"card",style:{padding:"12px 10px",textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.3rem",fontWeight:800},children:y.length}),e.jsx("div",{style:{fontSize:"0.58rem",fontWeight:600,color:o.muted,textTransform:"uppercase",marginTop:3},children:"Queued"})]}),e.jsxs("div",{className:"card",style:{padding:"12px 10px",textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.3rem",fontWeight:800},children:c}),e.jsx("div",{style:{fontSize:"0.58rem",fontWeight:600,color:o.muted,textTransform:"uppercase",marginTop:3},children:"Terminal"})]})]})}),e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px"},children:[e.jsxs("div",{style:{position:"relative",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20},children:[e.jsx("div",{style:{position:"absolute",width:120,height:120,borderRadius:"50%",border:`2.5px solid ${o.primary}`,animation:"pulseRing 2.2s ease-out infinite",opacity:0}}),e.jsxs("button",{className:"btn-primary",style:{width:104,height:104,borderRadius:"50%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,border:"none",boxShadow:"0 8px 36px rgba(79,70,229,0.35), 0 0 0 6px rgba(79,70,229,0.12)"},onClick:()=>u(s.SCANNING),children:[e.jsx(nt,{size:34,color:"white"}),e.jsx("span",{style:{fontSize:"0.6rem",fontWeight:800,color:"white",textTransform:"uppercase"},children:"Scan"})]})]}),e.jsxs("div",{style:{fontSize:"0.82rem",color:o.muted,fontWeight:500},children:["Tap to start scanning for terminal ",c]})]}),e.jsx("div",{style:{background:"white",borderTop:`1px solid ${o.border}`,padding:"16px 20px"},children:e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8,color:o.muted,fontSize:"0.7rem",fontWeight:600},children:[e.jsx(St,{size:12,color:o.success}),"System Connected & Secure"]})})]}),e.jsx("video",{ref:x,autoPlay:!0,playsInline:!0,muted:!0,style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(f===s.SCANNING||f===s.CAPTURING)&&!W.current?"block":"none"}}),e.jsx("div",{className:A(s.SCANNING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[e.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:W.current?"block":"none"}}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{className:"scan-guide",style:{width:st.w,height:st.h,borderRadius:10,maxHeight:"20vw"},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"}),e.jsx("div",{className:"scan-laser"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("button",{onClick:()=>u(s.HOME),style:{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:20,padding:"5px 12px",color:"white",display:"flex",alignItems:"center",gap:5,cursor:"pointer",backdropFilter:"blur(8px)"},children:[e.jsx(be,{size:14}),e.jsx("span",{style:{fontSize:"0.75rem",fontWeight:600},children:"Home"})]}),e.jsxs("div",{className:"cam-hud-chip",style:{gap:4},children:[e.jsx(kt,{size:12})," ",I.scanNumber,typeof window<"u"&&typeof window.BarcodeDetector<"u"?e.jsx("span",{style:{color:"#34D399",fontSize:"0.6rem",fontWeight:800},children:"⚡ NATIVE"}):e.jsx("span",{style:{color:"#F59E0B",fontSize:"0.6rem",fontWeight:800},children:"ZXING"})]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:"Align barcode inside the strip"}),e.jsx("div",{style:{display:"flex",gap:12},children:e.jsx("button",{className:"cam-hud-chip",onClick:()=>dt(!Y),style:{border:"none",cursor:"pointer"},children:Y?e.jsx(Et,{size:14}):e.jsx(Ft,{size:14})})})]})]})}),e.jsx("div",{className:A(s.CAPTURING),children:e.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!pe&&e.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[e.jsx(Rt,{size:44,color:"#34D399"}),e.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:F}),e.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:"Barcode locked · Preparing camera…"})]}),e.jsx("div",{className:"cam-overlay",children:e.jsxs("div",{ref:ge,className:`scan-guide ${ue?"detected":""}`,style:{width:rt.w,height:rt.h,maxHeight:"75vh",borderRadius:12},children:[e.jsx("div",{className:"scan-guide-corner corner-tl"}),e.jsx("div",{className:"scan-guide-corner corner-tr"}),e.jsx("div",{className:"scan-guide-corner corner-bl"}),e.jsx("div",{className:"scan-guide-corner corner-br"})]})}),e.jsxs("div",{className:"cam-hud",children:[e.jsxs("button",{onClick:()=>u(s.HOME),style:{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:20,padding:"5px 12px",color:"white",display:"flex",alignItems:"center",gap:5,cursor:"pointer",backdropFilter:"blur(8px)"},children:[e.jsx(be,{size:14}),e.jsx("span",{style:{fontSize:"0.75rem",fontWeight:600},children:"Cancel"})]}),y.length>0&&e.jsxs("div",{className:"cam-hud-chip",children:[e.jsx(At,{size:12})," ",y.length," queued"]})]}),e.jsxs("div",{className:"cam-bottom",children:[e.jsx("div",{style:{color:ue?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center",transition:"color 0.3s"},children:ue?"✓ AWB in frame — press shutter":"Fit the AWB slip inside the frame"}),e.jsx("button",{className:"capture-btn",onClick:gt,disabled:!pe,style:{opacity:pe?1:.4},children:e.jsx("div",{className:"capture-btn-inner"})}),e.jsx("button",{style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},onClick:()=>{ce(""),z.current=!1,u(s.SCANNING)},children:"← Rescan barcode"})]})]})}),e.jsx("div",{className:A(s.PREVIEW),children:e.jsxs("div",{style:{background:a.bg,display:"flex",flexDirection:"column",height:"100%"},children:[e.jsx("div",{style:{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${a.border}`},children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.72rem",color:a.muted,fontWeight:600},children:"CAPTURED"}),e.jsx("div",{className:"mono",style:{fontSize:"1rem",fontWeight:700},children:F})]})}),e.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:$&&e.jsx("img",{src:$,alt:"Captured label",className:"preview-img"})}),e.jsxs("div",{style:{padding:"16px 20px",display:"flex",gap:12},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{le(null),u(s.CAPTURING)},children:[e.jsx(it,{size:16})," Retake"]}),e.jsxs("button",{className:"btn btn-primary",style:{flex:2},onClick:ht,children:[e.jsx(It,{size:16})," Use Photo"]})]})]})}),e.jsx("div",{className:A(s.PROCESSING),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:20,gap:16},children:[e.jsxs("div",{style:{textAlign:"center",paddingTop:24,paddingBottom:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8},children:[e.jsx(zt,{size:22,color:a.primary,style:{animation:"spin 2s linear infinite"}}),e.jsx("span",{style:{fontSize:"0.9rem",fontWeight:700,color:a.primary},children:"Intelligence Engine"})]}),e.jsx("div",{className:"mono",style:{fontSize:"0.82rem",color:a.muted},children:F}),e.jsx("div",{style:{fontSize:"0.72rem",color:a.mutedLight,marginTop:6},children:"Reading AWB label with Gemini Vision…"})]}),["Client","Consignee","Destination","Pincode","Weight","Order No"].map(t=>e.jsxs("div",{className:"card",style:{display:"flex",alignItems:"center",gap:12},children:[e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:t}),e.jsx("div",{className:"skeleton",style:{height:18,width:`${60+Math.random()*30}%`,marginTop:4}})]}),e.jsx("div",{className:"skeleton",style:{width:8,height:8,borderRadius:"50%"}})]},t)),e.jsx("div",{style:{textAlign:"center",marginTop:8},children:e.jsx("button",{className:"btn btn-outline",style:{fontSize:"0.75rem",padding:"8px 20px"},onClick:()=>{N("Cancelled by user."),u(s.ERROR)},children:"Cancel"})})]})}),e.jsx("div",{className:A(s.REVIEWING),children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%"},children:[e.jsxs("div",{style:{padding:"14px 20px",borderBottom:`1px solid ${a.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.65rem",color:a.muted,fontWeight:600},children:"REVIEW EXTRACTION"}),e.jsx("div",{className:"mono",style:{fontSize:"0.95rem",fontWeight:700},children:(r==null?void 0:r.awb)||F})]}),(m==null?void 0:m.learnedFieldCount)>0&&e.jsxs("div",{className:"source-badge source-learned",children:["🧠 ",m.learnedFieldCount," auto-corrected"]})]}),e.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsxs("div",{className:`field-card ${(((_e=M.clientCode)==null?void 0:_e.confidence)||0)<.55?"warning":""}`,children:[e.jsx("div",{className:je(((De=M.clientCode)==null?void 0:De.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),(($e=M.clientCode)==null?void 0:$e.source)&&(()=>{const t=ct(M.clientCode.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:d.clientCode||"",onChange:t=>E(n=>({...n,clientCode:t.target.value.toUpperCase()})),placeholder:"Client code"}),((Ge=m==null?void 0:m.clientMatches)==null?void 0:Ge.length)>0&&m.clientNeedsConfirmation&&e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},children:m.clientMatches.slice(0,3).map(t=>e.jsxs("button",{onClick:()=>E(n=>({...n,clientCode:t.code})),style:{fontSize:"0.65rem",padding:"3px 8px",borderRadius:6,border:`1px solid ${a.border}`,background:d.clientCode===t.code?a.primaryLight:a.surface,color:a.text,cursor:"pointer",fontFamily:"inherit",fontWeight:500},children:[t.code," (",Math.round(t.score*100),"%)"]},t.code))})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:je(((Le=M.consignee)==null?void 0:Le.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Consignee"}),e.jsx("input",{className:"field-input",value:d.consignee||"",onChange:t=>E(n=>({...n,consignee:t.target.value.toUpperCase()})),placeholder:"Recipient name"})]})]}),e.jsxs("div",{className:"field-card",children:[e.jsx("div",{className:je(((Ue=M.destination)==null?void 0:Ue.confidence)||0)}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4},children:[e.jsx("span",{className:"field-label",style:{margin:0},children:"Destination"}),((Ve=M.destination)==null?void 0:Ve.source)&&(()=>{const t=ct(M.destination.source);return t?e.jsxs("span",{className:t.className,children:[t.icon," ",t.text]}):null})()]}),e.jsx("input",{className:"field-input",value:d.destination||"",onChange:t=>E(n=>({...n,destination:t.target.value.toUpperCase()})),placeholder:"City"}),(m==null?void 0:m.pincodeCity)&&m.pincodeCity!==d.destination&&e.jsxs("button",{onClick:()=>E(t=>({...t,destination:m.pincodeCity})),style:{fontSize:"0.62rem",marginTop:4,padding:"2px 8px",borderRadius:6,border:"none",background:a.successLight,color:a.success,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:["📍 Pincode suggests: ",m.pincodeCity]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Pincode"}),e.jsx("input",{className:"field-input",value:d.pincode||"",onChange:t=>E(n=>({...n,pincode:t.target.value})),placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),e.jsx("div",{className:`field-card ${(He=m==null?void 0:m.weightAnomaly)!=null&&He.anomaly?"warning":""}`,children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Weight (kg)"}),e.jsx("input",{className:"field-input",value:d.weight||"",onChange:t=>E(n=>({...n,weight:t.target.value})),placeholder:"0.0",inputMode:"decimal"}),((qe=m==null?void 0:m.weightAnomaly)==null?void 0:qe.anomaly)&&e.jsxs("div",{style:{fontSize:"0.6rem",color:a.warning,marginTop:2,fontWeight:500},children:["⚠️ ",m.weightAnomaly.warning]})]})})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Amount (₹)"}),e.jsx("input",{className:"field-input",value:d.amount||"",onChange:t=>E(n=>({...n,amount:t.target.value})),placeholder:"0",inputMode:"decimal"})]})}),e.jsx("div",{className:"field-card",children:e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"field-label",children:"Order No"}),e.jsx("input",{className:"field-input",value:d.orderNo||"",onChange:t=>E(n=>({...n,orderNo:t.target.value})),placeholder:"Optional"})]})})]})]}),e.jsxs("div",{style:{padding:"12px 20px",borderTop:`1px solid ${a.border}`,display:"flex",gap:10},children:[e.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:H,children:[e.jsx(Tt,{size:16})," Skip"]}),e.jsxs("button",{className:"btn btn-success btn-lg",style:{flex:2},onClick:ft,disabled:f===s.APPROVING,children:[f===s.APPROVING?e.jsx(xe,{size:16,style:{animation:"spin 1s linear infinite"}}):e.jsx(Ot,{size:16}),f===s.APPROVING?"Saving...":"Approve & Save"]})]})]})}),e.jsx("div",{className:A(s.APPROVING)}),e.jsx("div",{className:A(s.SUCCESS),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsxs("svg",{width:"80",height:"80",viewBox:"0 0 80 80",children:[e.jsx("circle",{cx:"40",cy:"40",r:"36",fill:"none",stroke:a.success,strokeWidth:"3",className:"success-check-circle"}),e.jsx("polyline",{points:"24,42 35,53 56,30",fill:"none",stroke:a.success,strokeWidth:"3.5",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,color:a.success,marginBottom:4},children:"Saved Successfully"}),e.jsx("div",{className:"mono",style:{fontSize:"1.2rem",fontWeight:700},children:b==null?void 0:b.awb}),(b==null?void 0:b.clientCode)&&e.jsx("div",{style:{marginTop:6,display:"inline-block",padding:"4px 14px",borderRadius:20,background:a.primaryLight,color:a.primary,fontSize:"0.78rem",fontWeight:600},children:b.clientName||b.clientCode})]}),e.jsx("div",{style:{fontSize:"0.72rem",color:a.muted},children:b!=null&&b.offlineQueued?`${y.length} queued for sync • Auto-continuing in 3s`:`#${I.scanNumber} scanned • Auto-continuing in 3s`}),e.jsxs("button",{className:"btn btn-primary btn-lg btn-full",onClick:H,style:{maxWidth:320},children:[e.jsx(nt,{size:18})," Scan Next Parcel"]})]})}),e.jsx("div",{className:A(s.ERROR),children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20},children:[e.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:a.errorLight,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(et,{size:32,color:a.error})}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"1rem",fontWeight:700,color:a.error},children:"Scan Error"}),e.jsx("div",{style:{fontSize:"0.82rem",color:a.muted,marginTop:4},children:we})]}),e.jsxs("button",{className:"btn btn-primary",onClick:H,children:[e.jsx(it,{size:16})," Try Again"]})]})}),C==="disconnected"&&f!==s.IDLE&&e.jsxs("div",{className:"offline-banner",children:[e.jsx(tt,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline — Reconnecting... ",y.length?`(${y.length} queued)`:""]})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{Kt as default};
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/index-4oYbt_M2.js","assets/index-D3Mz4UNV.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
