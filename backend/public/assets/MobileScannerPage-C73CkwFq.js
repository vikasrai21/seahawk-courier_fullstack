import{_ as ot,l as lt}from"./index-Bo_nPLI2.js";import{j as e}from"./page-landing-BAx51FWo.js";import{r as a}from"./vendor-helmet-Dwc3L0SQ.js";import{D as We,a as X,B as dt,N as mt}from"./BrowserQRCodeReader-BdrjJ2XZ.js";import{e as pt}from"./vendor-react-B5FFh0eD.js";import{b2 as ut,Z as Ue,b as Ve,b4 as gt,b6 as ft,X as be,bi as $e,bj as Z,ab as He,t as qe,aN as ht}from"./vendor-icons-RjYP-ZdP.js";import"./page-import-D4CRWJLo.js";import"./page-reconcile-B6OsGV0x.js";import"./page-rate-calc-Dy5K7MEX.js";var xt={};const bt="/wasm/",vt=xt.VITE_SCANBOT_LICENSE_KEY||"",wt="^(?:[A-Z0-9]{8,18})$";function yt(){return window.location.origin}const Y=(h=880,p=.08)=>{try{const g=new(window.AudioContext||window.webkitAudioContext),x=g.createOscillator(),S=g.createGain();x.type="sine",x.frequency.setValueAtTime(h,g.currentTime),S.gain.setValueAtTime(.15,g.currentTime),S.gain.exponentialRampToValueAtTime(.01,g.currentTime+p),x.connect(S),S.connect(g.destination),x.start(),x.stop(g.currentTime+p)}catch{}},G=(h=[50])=>{var p;try{(p=navigator.vibrate)==null||p.call(navigator,h)}catch{}},jt=[/^Z\d{8,9}$/,/^D\d{9,11}$/,/^X\d{9,10}$/,/^7X\d{9}$/,/^I\d{7,8}$/,/^JD\d{18}$/,/^\d{12,14}$/,/^[A-Z]{1,3}\d{7,14}$/];function Ke(h){const p=String(h||"").toUpperCase().replace(/\s+/g,"").replace(/[^A-Z0-9]/g,"");if(p.length<8)return"";if(jt.some(x=>x.test(p)))return p;const g=(p.match(/\d/g)||[]).length;return/^(?=.*\d)[A-Z0-9]{8,18}$/.test(p)&&g>=7?p:""}function Bt(){const{pin:h}=pt(),[p,g]=a.useState(h||""),[x,S]=a.useState(h||""),[j,v]=a.useState("idle"),[L,w]=a.useState(""),[Ct,Xe]=a.useState(""),[ve,we]=a.useState(0),[ye,le]=a.useState(""),[i,Ze]=a.useState(null),[je,y]=a.useState(null),[R,Ce]=a.useState(!1),[de,J]=a.useState(!1),[Ne,O]=a.useState(!1),[ke,z]=a.useState(""),[F,Q]=a.useState(""),[me,ee]=a.useState(!1),[D,W]=a.useState(!1),[Se,b]=a.useState(""),[U,te]=a.useState(""),[C,se]=a.useState(null),[l,f]=a.useState(null),[re,pe]=a.useState(!1),[Re,ne]=a.useState(""),N=a.useRef(null),k=a.useRef(null),ze=a.useRef(null),V=a.useRef(null),ue=a.useRef(null),ge=a.useRef(null),fe=a.useRef(null),ae=a.useRef(null),he=a.useRef(null),E=a.useRef(!1),T=a.useRef(!1),$=a.useRef(""),B=a.useRef(0),Ee=a.useRef(0),[ie,Ae]=a.useState("scanbot"),Ye=a.useCallback(()=>{var s,n;const t=(n=(s=V.current)==null?void 0:s.querySelector)==null?void 0:n.call(s,"video");return t?(k.current=t,t):k.current},[]),Ge=a.useCallback(async()=>{if(fe.current)return fe.current;const n=await(await ot(()=>import("./index-OhzldbFf.js").then(c=>c.i),__vite__mapDeps([0,1]))).default.initialize({licenseKey:vt,enginePath:bt,userAgentAppId:"seahawk-mobile-scanner"}),r=await n.getLicenseInfo().catch(()=>null);if(r&&!r.isValid())throw new Error(r.licenseStatusMessage||"Scanbot license is not valid.");return fe.current=n,n},[]),De=async t=>new Promise((s,n)=>{if(!t){n(new Error("Video element unavailable"));return}let r=!1;const c=()=>{r||(r=!0,t.removeEventListener("loadedmetadata",o),t.removeEventListener("canplay",o),clearTimeout(u),s())},d=()=>{r||(r=!0,t.removeEventListener("loadedmetadata",o),t.removeEventListener("canplay",o),clearTimeout(u),n(new Error("Camera preview did not become ready")))},o=()=>c(),u=setTimeout(d,5e3);if(t.readyState>=2){c();return}t.addEventListener("loadedmetadata",o,{once:!0}),t.addEventListener("canplay",o,{once:!0})}),Je=async()=>new Promise((t,s)=>{const n=Date.now(),r=()=>{const c=k.current;if(c){t(c);return}if(Date.now()-n>2500){s(new Error("Camera surface unavailable"));return}requestAnimationFrame(r)};r()}),Qe=async()=>new Promise((t,s)=>{const n=Date.now(),r=()=>{const c=Ye();if(c){t(c);return}if(Date.now()-n>5e3){s(new Error("Premium scanner camera surface unavailable"));return}requestAnimationFrame(r)};r()}),et=(t={})=>({shipmentId:t.shipmentId||null,awb:String(t.awb||"").trim(),clientCode:String(t.clientCode||"").trim().toUpperCase(),clientName:String(t.clientName||"").trim(),consignee:String(t.consignee||"").trim().toUpperCase(),destination:String(t.destination||"").trim().toUpperCase(),pincode:String(t.pincode||"").replace(/\D/g,"").slice(0,6),weight:t.weight||0,amount:t.amount||0,orderNo:String(t.orderNo||"").trim().toUpperCase()}),Te=a.useCallback(t=>{const s=String(t||"").trim();if(s.length!==6){w("Please enter a valid 6-digit PIN"),v("error");return}g(s),v("connecting"),w("");const n=lt(yt(),{auth:{scannerPin:s},withCredentials:!0,reconnection:!0,reconnectionAttempts:5,reconnectionDelay:2e3});N.current=n,n.on("connect",()=>{}),n.on("scanner:paired",({message:r,userEmail:c})=>{v("paired"),Xe(c||"Desktop"),w(""),G([100,50,100]),Y(1200,.1)}),n.on("scanner:scan-feedback",r=>{Ze(r),r.status==="pending_review"&&(f(et(r)),ne("Review the extracted fields, adjust anything wrong, then approve.")),r.status==="success"?(y("success"),G([30]),Y(1400,.06)):(y("error"),G([100,50,100]),Y(200,.2)),setTimeout(()=>y(null),600)}),n.on("scanner:approval-result",({success:r,message:c})=>{pe(!1),ne(c||""),r?(f(null),y("success")):y("error"),setTimeout(()=>y(null),600)}),n.on("scanner:session-ended",({reason:r})=>{v("ended"),w(r||"Session ended"),I()}),n.on("scanner:error",({message:r})=>{v("error"),w(r)}),n.on("disconnect",()=>{j!=="ended"&&(v("error"),w("Connection lost. Trying to reconnect..."))}),n.on("reconnect",()=>{v("paired"),w("")}),n.on("connect_error",()=>{v("error"),w("Could not connect to server. Check your network.")})},[]);a.useEffect(()=>(h&&h.length===6&&Te(h),()=>{var t;(t=N.current)==null||t.disconnect(),I()}),[]);const tt=()=>{!l||!N.current||(pe(!0),ne("Sending approved intake to desktop..."),N.current.emit("scanner:approval-submit",{shipmentId:l.shipmentId,awb:l.awb,fields:{clientCode:l.clientCode,consignee:l.consignee,destination:l.destination,pincode:l.pincode,weight:l.weight,amount:l.amount,orderNo:l.orderNo}},t=>{t!=null&&t.success||(pe(!1),ne((t==null?void 0:t.message)||"Desktop did not accept the approval."))}))},I=async()=>{var t,s,n,r,c,d,o;try{(s=(t=ae.current)==null?void 0:t.dispose)==null||s.call(t)}catch{}ae.current=null;try{await((n=ge.current)==null?void 0:n.reset())}catch{}ge.current=null;try{(c=(r=he.current)==null?void 0:r.getTracks)==null||c.call(r).forEach(u=>u.stop())}catch{}he.current=null,V.current&&(V.current.innerHTML=""),k.current&&(k.current.srcObject=null,(o=(d=k.current).pause)==null||o.call(d)),E.current=!1,T.current=!1,$.current="",B.current=0,Ce(!1),J(!1),O(!1),Q(""),ee(!1),W(!1),b(""),te(""),se(null)},Be=({quality:t=.82,maxWidth:s=1920,target:n="full"}={})=>{const r=k.current;if(!r||!r.videoWidth)return null;try{let c=0,d=0,o=r.videoWidth,u=r.videoHeight;if(n==="focus"&&ze.current&&ue.current){const A=r.getBoundingClientRect(),_=ue.current.getBoundingClientRect(),q=A.width,K=A.height,ce=r.videoWidth,oe=r.videoHeight,xe=ce/oe,at=q/K;let M=q,P=K,_e=0,Me=0;xe>at?(P=K,M=P*xe,_e=(M-q)/2):(M=q,P=M/xe,Me=(P-K)/2);const Pe=_.width*.55,Le=_.height*.9,Oe=Math.max(0,_.left-A.left-Pe),Fe=Math.max(0,_.top-A.top-Le),it=Math.min(q-Oe,_.width+Pe*2),ct=Math.min(K-Fe,_.height+Le*2);c=Math.max(0,(Oe+_e)/M*ce),d=Math.max(0,(Fe+Me)/P*oe),o=Math.min(ce-c,it/M*ce),u=Math.min(oe-d,ct/P*oe)}const m=document.createElement("canvas");m.width=Math.min(s,o),m.height=Math.round(m.width/o*u);const H=m.getContext("2d");return H?(H.drawImage(r,c,d,o,u,0,0,m.width,m.height),m.toDataURL("image/jpeg",t).split(",")[1]||null):null}catch{return null}},st=async()=>{if(F){W(!0),b("Capturing still photo...");try{const t=Be({quality:.9,maxWidth:2200,target:"full"}),s=Be({quality:.94,maxWidth:1800,target:"focus"});if(!t){b("Could not capture photo. Hold steady and try again.");return}se({imageBase64:t,focusImageBase64:s}),te(`data:image/jpeg;base64,${t}`),b("Photo captured. Use it or retake it.")}finally{W(!1)}}},rt=()=>{te(""),se(null),b("Retake the full AWB photo.")},Ie=async(t=!0)=>{var s,n;if(!(!F||!N.current)){if(t&&!(C!=null&&C.imageBase64)){b("Capture the label photo first.");return}W(!0),b(t?"Sending captured photo to OCR...":"Sending barcode only...");try{const r=t&&(C==null?void 0:C.imageBase64)||null,c=t&&(C==null?void 0:C.focusImageBase64)||null;N.current.emit("scanner:scan",{awb:F,imageBase64:r,focusImageBase64:c}),we(d=>d+1),le(F),ee(!1),Q(""),te(""),se(null),T.current=!1,(n=(s=ae.current)==null?void 0:s.resumeDetection)==null||n.call(s),B.current=Date.now()+700,b("Sent to desktop. Keep scanning."),setTimeout(()=>b(""),1400)}finally{W(!1)}}},nt=async()=>{var t;if(!(!N.current||j!=="paired"))try{z(""),O(!0),await I(),Ce(!0),J(!1),Ae("scanbot");try{const s=await Ge(),n=V.current;if(!n)throw new Error("Premium scanner surface unavailable.");const r=await s.createBarcodeScanner({container:n,preferredCamera:"environment",previewMode:"FIT_IN",captureDelay:80,fpsLimit:120,enable4kStream:!0,desiredRecognitionResolution:1440,videoConstraints:{facingMode:{ideal:"environment"},width:{ideal:1920},height:{ideal:1080}},onError:d=>{const o=(d==null?void 0:d.message)||"Premium scanner hit a camera error.";z(o)},onBarcodesDetected:({barcodes:d=[]})=>{if(T.current)return;const o=d.map(m=>Ke(m==null?void 0:m.text)).find(Boolean);if(!o)return;const u=Date.now();E.current||u<B.current&&o===$.current||(E.current=!0,B.current=u+350,$.current=o,T.current=!0,r.pauseDetection(),z(""),y("success"),G([40]),Y(1050,.05),setTimeout(()=>y(null),320),le(o),Q(o),ee(!0),b("Barcode locked. Capture the AWB photo next."),E.current=!1)},scannerConfiguration:{engineMode:"NEXT_GEN",minimumTextLength:8,maximumTextLength:18,barcodeFormatConfigurations:[{_type:"BarcodeFormatCommonOneDConfiguration",formats:["CODE_128","CODE_39","CODE_93","CODABAR","ITF"],regexFilter:wt,minimumNumberOfRequiredFramesWithEqualRecognitionResult:1,minimumTextLength:8,maximumTextLength:18,oneDConfirmationMode:"MINIMAL"}]}});ae.current=r,r.setFinderVisible(!1);const c=await Qe();return await De(c),J(!0),O(!1),c}catch(s){console.debug("Scanbot unavailable, falling back to ZXing",s),Ae("zxing");const n=await Je();if(!((t=navigator.mediaDevices)!=null&&t.getUserMedia))throw new Error("This browser is not allowing camera access.");const r=await navigator.mediaDevices.getUserMedia({audio:!1,video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}}});he.current=r;const c=new Map;c.set(We.TRY_HARDER,!0),c.set(We.POSSIBLE_FORMATS,[X.CODE_128,X.CODE_39,X.CODABAR,X.ITF,X.CODE_93]);const d=new dt(c,{delayBetweenScanAttempts:25,delayBetweenScanSuccess:80});ge.current=d,n.srcObject=r,n.muted=!0,n.defaultMuted=!0,n.setAttribute("playsinline","true"),n.setAttribute("webkit-playsinline","true"),await n.play(),await De(n),J(!0),O(!1),z("Premium scanner unavailable right now. Running compatibility mode."),await d.decodeFromVideoElement(n,async(o,u)=>{if(T.current)return;if(!o){if(u&&!(u instanceof mt)){const A=Date.now();A-Ee.current>1500&&(z("Scanner is active but cannot decode yet. Try moving closer and hold steady."),Ee.current=A)}return}z("");const m=Ke(o.getText()),H=Date.now();m&&(E.current||H<B.current&&m===$.current||(E.current=!0,B.current=H+450,$.current=m,T.current=!0,y("success"),G([50]),Y(880,.06),setTimeout(()=>y(null),400),le(m),Q(m),ee(!0),b("Barcode locked. Now capture the full AWB label photo."),E.current=!1))})}}catch(s){const n=(s==null?void 0:s.message)||"Camera failed";z(n),w(n),O(!1),await I()}};return a.useEffect(()=>{if(j!=="paired")return;const t=setInterval(()=>{var s;(s=N.current)==null||s.emit("scanner:heartbeat")},5e3);return()=>clearInterval(t)},[j]),j==="idle"||j==="error"&&!p?e.jsx("div",{className:"msc-root",children:e.jsxs("div",{className:"msc-container",children:[e.jsx("div",{className:"msc-logo-ring",children:e.jsx(ut,{size:36})}),e.jsx("h1",{className:"msc-title",children:"Seahawk Remote Scanner"}),e.jsx("p",{className:"msc-subtitle",children:"Enter the 6-digit PIN shown on your desktop"}),e.jsxs("div",{className:"msc-pin-group",children:[e.jsx("input",{className:"msc-pin-input",type:"tel",inputMode:"numeric",pattern:"[0-9]*",maxLength:6,placeholder:"● ● ● ● ● ●",value:x,onChange:t=>S(t.target.value.replace(/\D/g,"").slice(0,6)),autoFocus:!0}),e.jsxs("button",{className:"msc-connect-btn",disabled:x.length!==6,onClick:()=>Te(x),children:[e.jsx(Ue,{size:18})," Connect"]})]}),L&&e.jsxs("div",{className:"msc-error",children:[e.jsx(Ve,{size:14})," ",L]}),e.jsxs("p",{className:"msc-hint",children:["Open ",e.jsx("strong",{children:"Rapid Terminal"})," on your desktop and click ",e.jsx("strong",{children:'"Connect Mobile"'})," to get the PIN."]})]})}):j==="connecting"?e.jsx("div",{className:"msc-root",children:e.jsxs("div",{className:"msc-container",children:[e.jsx("div",{className:"msc-logo-ring msc-pulse",children:e.jsx(gt,{size:36})}),e.jsx("h1",{className:"msc-title",children:"Connecting..."}),e.jsxs("p",{className:"msc-subtitle",children:["Pairing with desktop via PIN ",p]})]})}):j==="ended"?e.jsx("div",{className:"msc-root",children:e.jsxs("div",{className:"msc-container",children:[e.jsx("div",{className:"msc-logo-ring msc-ended",children:e.jsx(ft,{size:36})}),e.jsx("h1",{className:"msc-title",children:"Session Ended"}),e.jsx("p",{className:"msc-subtitle",children:L||"The scanning session has been closed."}),e.jsxs("p",{className:"msc-stat",children:["Total scans: ",e.jsx("strong",{children:ve})]}),e.jsx("button",{className:"msc-connect-btn",onClick:()=>{v("idle"),g(""),S(""),w(""),we(0)},children:"Start New Session"})]})}):e.jsxs("div",{className:`msc-root ${je==="success"?"msc-flash-success":je==="error"?"msc-flash-error":""}`,children:[e.jsxs("div",{className:"msc-status-bar",children:[e.jsxs("div",{className:"msc-status-left",children:[e.jsx("div",{className:"msc-dot msc-dot-live"}),e.jsx("span",{children:"LIVE"}),e.jsxs("span",{className:"msc-status-pin",children:["PIN ",p]})]}),e.jsxs("div",{className:"msc-status-right",children:[e.jsxs("span",{className:"msc-scan-count",children:[ve," scans"]}),e.jsx("button",{className:"msc-end-btn",onClick:()=>{var t;(t=N.current)==null||t.disconnect(),I(),v("ended")},children:e.jsx(be,{size:16})})]})]}),e.jsxs("div",{className:"msc-camera-wrap",ref:ze,children:[e.jsx("div",{ref:V,className:`msc-scanbot-host ${R&&ie==="scanbot"?"msc-scanbot-host-active":""}`}),e.jsx("video",{ref:k,className:`msc-video ${R&&ie==="zxing"?"msc-video-active":"msc-video-idle"}`,muted:!0,playsInline:!0,autoPlay:!0,disablePictureInPicture:!0}),R?e.jsx(e.Fragment,{children:e.jsxs("div",{className:"msc-scan-overlay",children:[e.jsxs("div",{className:"msc-overlay-head",children:[e.jsxs("div",{className:"msc-overlay-chip",children:[e.jsx($e,{size:14}),de?ie==="scanbot"?"Premium camera live":"Compatibility camera live":"Opening rear camera"]}),e.jsxs("div",{className:`msc-overlay-chip ${de?"ready":""}`,children:[e.jsx(Z,{size:14}),de?ie==="scanbot"?"Fast barcode lock":"Aim at AWB barcode":"Waking camera"]})]}),e.jsxs("div",{className:"msc-scan-frame",ref:ue,children:[e.jsx("div",{className:"msc-corner msc-tl"}),e.jsx("div",{className:"msc-corner msc-tr"}),e.jsx("div",{className:"msc-corner msc-bl"}),e.jsx("div",{className:"msc-corner msc-br"}),e.jsx("div",{className:"msc-scan-line"})]}),e.jsx("div",{className:"msc-overlay-tip",children:me?U?"Still photo captured. Use it or retake it before OCR.":"Barcode locked. Hold full AWB in view and tap Capture Label.":"Point to barcode first. After lock, capture full AWB for client, consignee, destination, pincode, weight, and value."})]})}):e.jsxs("div",{className:"msc-camera-placeholder",children:[e.jsx(He,{size:48,className:"msc-placeholder-icon"}),e.jsx("p",{children:"Tap below to start scanning"})]})]}),l&&e.jsxs("div",{className:"msc-approval-sheet",children:[e.jsx("div",{className:"msc-sheet-handle"}),e.jsxs("div",{className:"msc-sheet-body",children:[e.jsxs("div",{className:"msc-sheet-head",children:[e.jsxs("div",{children:[e.jsx("div",{className:"msc-sheet-kicker",children:"Final Approval"}),e.jsx("div",{className:"msc-sheet-title",children:"Review this shipment before it reaches desktop and portal"})]}),e.jsx("button",{className:"msc-sheet-close",type:"button",onClick:()=>f(null),disabled:re,children:e.jsx(be,{size:16})})]}),e.jsx("div",{className:"msc-sheet-awb",children:l.awb}),Re?e.jsx("div",{className:"msc-sheet-message",children:Re}):null,e.jsxs("div",{className:"msc-sheet-grid",children:[e.jsxs("label",{children:[e.jsx("span",{children:"Client code"}),e.jsx("input",{value:l.clientCode,onChange:t=>f(s=>({...s,clientCode:t.target.value.toUpperCase()}))})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Client name"}),e.jsx("input",{value:l.clientName,onChange:t=>f(s=>({...s,clientName:t.target.value}))})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Consignee"}),e.jsx("input",{value:l.consignee,onChange:t=>f(s=>({...s,consignee:t.target.value.toUpperCase()}))})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Destination"}),e.jsx("input",{value:l.destination,onChange:t=>f(s=>({...s,destination:t.target.value.toUpperCase()}))})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Pincode"}),e.jsx("input",{value:l.pincode,onChange:t=>f(s=>({...s,pincode:t.target.value.replace(/\D/g,"").slice(0,6)}))})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Weight"}),e.jsx("input",{type:"number",step:"0.01",value:l.weight,onChange:t=>f(s=>({...s,weight:t.target.value}))})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Value"}),e.jsx("input",{type:"number",step:"0.01",value:l.amount,onChange:t=>f(s=>({...s,amount:t.target.value}))})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Order no"}),e.jsx("input",{value:l.orderNo,onChange:t=>f(s=>({...s,orderNo:t.target.value.toUpperCase()}))})]})]}),e.jsxs("div",{className:"msc-sheet-actions",children:[e.jsx("button",{type:"button",className:"msc-sheet-secondary",onClick:()=>f(null),disabled:re,children:"Keep scanning"}),e.jsx("button",{type:"button",className:"msc-sheet-primary",onClick:tt,disabled:re,children:re?e.jsxs(e.Fragment,{children:[e.jsx(Z,{size:16})," Saving..."]}):e.jsxs(e.Fragment,{children:[e.jsx(qe,{size:16})," Approve & Send"]})})]})]})]}),R&&me&&e.jsxs("div",{className:"msc-capture-panel",children:[e.jsxs("div",{className:"msc-capture-title",children:["Barcode: ",F||"LOCKED"]}),e.jsx("div",{className:"msc-capture-sub",children:U?"This still image will be sent to OCR. Retake if the label is blurry or cropped.":"Take one clear full-label photo so OCR can extract all fields."}),U?e.jsx("div",{className:"msc-preview-shell",children:e.jsx("img",{src:U,alt:"Captured AWB label",className:"msc-preview-image"})}):null,e.jsxs("div",{className:"msc-capture-actions",children:[U?e.jsxs(e.Fragment,{children:[e.jsx("button",{type:"button",className:"msc-capture-secondary",onClick:rt,disabled:D,children:"Retake Photo"}),e.jsx("button",{type:"button",className:"msc-capture-primary",onClick:()=>Ie(!0),disabled:D,children:D?e.jsxs(e.Fragment,{children:[e.jsx(Z,{size:16})," Sending..."]}):e.jsxs(e.Fragment,{children:[e.jsx(qe,{size:16})," Use Photo"]})})]}):e.jsx("button",{type:"button",className:"msc-capture-primary",onClick:st,disabled:D,children:D?e.jsxs(e.Fragment,{children:[e.jsx(Z,{size:16})," Capturing..."]}):e.jsxs(e.Fragment,{children:[e.jsx($e,{size:16})," Capture Label"]})}),e.jsx("button",{type:"button",className:"msc-capture-secondary",onClick:()=>Ie(!1),disabled:D,children:"Send Barcode Only"})]})]}),!me&&!!Se&&e.jsx("div",{className:"msc-capture-toast",children:Se}),ye&&e.jsxs("div",{className:"msc-last-scan",children:[e.jsxs("div",{className:"msc-last-awb-wrap",children:[e.jsxs("div",{className:"msc-last-awb",children:[e.jsx(ht,{size:16,className:"msc-check"}),e.jsx("span",{className:"msc-awb-text",children:ye})]}),(i==null?void 0:i.status)&&e.jsx("div",{className:`msc-feedback-pill ${i.status}`,children:i.status==="pending_review"?"Pending desktop review":i.status==="success"?"Verified":i.status==="review_deferred"?"Deferred":"Needs attention"})]}),((i==null?void 0:i.clientCode)||(i==null?void 0:i.consignee)||(i==null?void 0:i.destination)||(i==null?void 0:i.weight))&&e.jsxs("div",{className:"msc-feedback-card",children:[(i==null?void 0:i.clientCode)&&e.jsxs("div",{className:"msc-client-badge",children:[e.jsx(Ue,{size:12})," ",i.clientCode,i.clientName?` · ${i.clientName}`:""]}),e.jsxs("div",{className:"msc-feedback-details",children:[i!=null&&i.consignee?e.jsxs("div",{children:[e.jsx("span",{children:"Consignee"}),e.jsx("strong",{children:i.consignee})]}):null,i!=null&&i.destination?e.jsxs("div",{children:[e.jsx("span",{children:"Destination"}),e.jsx("strong",{children:i.destination})]}):null,i!=null&&i.weight?e.jsxs("div",{children:[e.jsx("span",{children:"Weight"}),e.jsxs("strong",{children:[i.weight," kg"]})]}):null]})]})]}),(ke||L&&j==="error")&&e.jsxs("div",{className:"msc-error msc-error-banner",children:[e.jsx(Ve,{size:14})," ",ke||L]}),e.jsx("div",{className:"msc-controls",children:e.jsx("button",{className:`msc-cam-btn ${R?"msc-cam-active":""}`,disabled:Ne,onClick:R?I:nt,children:R?e.jsxs(e.Fragment,{children:[e.jsx(be,{size:22})," Stop Camera"]}):Ne?e.jsxs(e.Fragment,{children:[e.jsx(Z,{size:22})," Starting Camera..."]}):e.jsxs(e.Fragment,{children:[e.jsx(He,{size:22})," Start Scanning"]})})}),e.jsx("style",{children:`
        /* ── Mobile Scanner Styles ─────────────────────────────────────── */
        .msc-root {
          min-height: 100vh;
          min-height: 100dvh;
          background:
            radial-gradient(circle at top, rgba(14,165,233,0.12), transparent 28%),
            linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%);
          color: #0f172a;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: background 0.3s;
          position: relative;
        }
        .msc-flash-success {
          background:
            radial-gradient(circle at top, rgba(34,197,94,0.16), transparent 28%),
            linear-gradient(180deg, #f3fff7 0%, #eafff1 100%) !important;
        }
        .msc-flash-error {
          background:
            radial-gradient(circle at top, rgba(248,113,113,0.14), transparent 28%),
            linear-gradient(180deg, #fff7f7 0%, #fff1f1 100%) !important;
        }

        .msc-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          text-align: center;
          gap: 1.25rem;
        }

        .msc-logo-ring {
          width: 80px; height: 80px;
          border-radius: 24px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          box-shadow: 0 8px 32px rgba(59,130,246,0.3);
        }
        .msc-pulse { animation: msc-pulse 1.5s ease-in-out infinite; }
        .msc-ended { background: linear-gradient(135deg, #6b7280, #374151); box-shadow: none; }

        @keyframes msc-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }

        .msc-title {
          font-size: 1.5rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .msc-subtitle {
          font-size: 0.8rem;
          color: #94a3b8;
          margin: 0;
          max-width: 280px;
          line-height: 1.5;
        }
        .msc-stat {
          font-size: 0.85rem;
          color: #64748b;
        }
        .msc-hint {
          font-size: 0.7rem;
          color: #475569;
          max-width: 260px;
          line-height: 1.6;
        }

        .msc-pin-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          width: 100%;
          max-width: 280px;
        }
        .msc-pin-input {
          width: 100%;
          text-align: center;
          font-size: 2rem;
          font-weight: 900;
          font-family: 'SF Mono', 'Fira Code', monospace;
          letter-spacing: 0.5em;
          padding: 1rem;
          border-radius: 20px;
          border: 2px solid #1e293b;
          background: #0f172a;
          color: #fff;
          outline: none;
          transition: border-color 0.2s;
        }
        .msc-pin-input:focus { border-color: #3b82f6; }
        .msc-pin-input::placeholder {
          color: #334155;
          letter-spacing: 0.3em;
          font-size: 1.2rem;
        }

        .msc-connect-btn {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          width: 100%;
          padding: 1rem;
          border-radius: 18px;
          border: none;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          color: #fff;
          font-size: 0.9rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          box-shadow: 0 4px 20px rgba(59,130,246,0.3);
        }
        .msc-connect-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .msc-connect-btn:active { transform: scale(0.97); }

        .msc-error {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.6rem 1rem;
          border-radius: 12px;
          background: rgba(239,68,68,0.15);
          color: #f87171;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .msc-error-banner {
          position: absolute;
          bottom: 80px;
          left: 1rem; right: 1rem;
          z-index: 50;
        }

        /* ── Status bar ─────────────────────────────────────────── */
        .msc-status-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: max(0.7rem, env(safe-area-inset-top)) 1rem 0.65rem;
          background: rgba(15,23,42,0.92);
          border-bottom: 1px solid rgba(148,163,184,0.2);
          z-index: 20;
        }
        .msc-status-left, .msc-status-right {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #94a3b8;
        }
        .msc-dot {
          width: 6px; height: 6px; border-radius: 50%;
        }
        .msc-dot-live { background: #22c55e; box-shadow: 0 0 8px #22c55e; animation: msc-blink 1.5s infinite; }
        @keyframes msc-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .msc-status-pin { color: #3b82f6; }
        .msc-scan-count { color: #22c55e; font-variant-numeric: tabular-nums; }
        .msc-end-btn {
          background: rgba(239,68,68,0.15);
          border: none; border-radius: 8px;
          color: #f87171; padding: 4px; cursor: pointer;
          display: flex; align-items: center;
        }

        /* ── Camera ─────────────────────────────────────────────── */
        .msc-camera-wrap {
          flex: 1;
          position: relative;
          background: linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%);
          overflow: hidden;
          min-height: 0;
          isolation: isolate;
        }
        .msc-scanbot-host {
          position: absolute;
          inset: 0;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.18s ease;
          z-index: 0;
        }
        .msc-scanbot-host-active {
          opacity: 1;
          pointer-events: auto;
        }
        .msc-scanbot-host video,
        .msc-scanbot-host canvas {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block;
        }
        .msc-capture-panel {
          position: absolute;
          left: 0.75rem;
          right: 0.75rem;
          bottom: calc(0.5rem + env(safe-area-inset-bottom));
          z-index: 35;
          border-radius: 24px;
          border: 1px solid rgba(125,211,252,0.28);
          background: linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(241,245,249,0.98) 100%);
          backdrop-filter: blur(18px);
          padding: 0.85rem;
          box-shadow: 0 24px 60px rgba(15,23,42,0.18);
          max-height: min(44vh, 360px);
          overflow-y: auto;
        }
        .msc-capture-title {
          color: #0f4c81;
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-family: 'SF Mono', 'Fira Code', monospace;
        }
        .msc-capture-sub {
          margin-top: 0.35rem;
          color: #334155;
          font-size: 0.68rem;
          font-weight: 700;
          line-height: 1.4;
        }
        .msc-capture-actions {
          display: flex;
          gap: 0.6rem;
          margin-top: 0.7rem;
          flex-wrap: wrap;
        }
        .msc-preview-shell {
          margin-top: 0.75rem;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(148,163,184,0.2);
          background: #ffffff;
          max-height: 240px;
        }
        .msc-preview-image {
          width: 100%;
          display: block;
          object-fit: contain;
          max-height: 240px;
          background: #f8fafc;
        }
        .msc-capture-primary,
        .msc-capture-secondary {
          flex: 1;
          min-height: 2.6rem;
          border-radius: 14px;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          font-size: 0.7rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .msc-capture-primary {
          color: #fff;
          background: linear-gradient(135deg, #0ea5e9, #22c55e);
          box-shadow: 0 12px 24px rgba(14,165,233,0.22);
        }
        .msc-capture-secondary {
          color: #334155;
          background: rgba(226,232,240,0.9);
        }
        .msc-capture-toast {
          position: absolute;
          bottom: calc(6rem + env(safe-area-inset-bottom));
          left: 1rem;
          right: 1rem;
          z-index: 45;
          padding: 0.62rem 0.85rem;
          border-radius: 12px;
          border: 1px solid rgba(56,189,248,0.32);
          background: rgba(255,255,255,0.96);
          color: #0369a1;
          font-size: 0.68rem;
          font-weight: 800;
          text-align: center;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .msc-approval-sheet {
          position: absolute;
          left: 0;
          right: 0;
          bottom: calc(4.7rem + env(safe-area-inset-bottom));
          z-index: 40;
          margin: 0 0.85rem;
          border-radius: 26px 26px 22px 22px;
          background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%);
          border: 1px solid rgba(125,211,252,0.24);
          box-shadow: 0 24px 64px rgba(15,23,42,0.18);
          backdrop-filter: blur(20px);
          max-height: min(62vh, 560px);
          overflow: hidden;
        }
        .msc-sheet-body {
          padding: 0.2rem 0.9rem 1rem;
          max-height: calc(min(62vh, 560px) - 12px);
          overflow-y: auto;
        }
        .msc-sheet-handle {
          width: 54px;
          height: 5px;
          border-radius: 999px;
          background: rgba(148,163,184,0.34);
          margin: 0 auto 0.75rem;
        }
        .msc-sheet-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .msc-sheet-kicker {
          color: #0284c7;
          font-size: 0.62rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.22em;
        }
        .msc-sheet-title {
          margin-top: 0.35rem;
          color: #0f172a;
          font-size: 0.92rem;
          font-weight: 800;
          line-height: 1.35;
        }
        .msc-sheet-close {
          width: 2rem;
          height: 2rem;
          border-radius: 999px;
          border: none;
          background: rgba(226,232,240,0.9);
          color: #475569;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .msc-sheet-awb {
          color: #0f172a;
          font-size: 1rem;
          font-weight: 900;
          font-family: 'SF Mono', 'Fira Code', monospace;
          margin-bottom: 0.55rem;
        }
        .msc-sheet-message {
          margin-bottom: 0.75rem;
          color: #64748b;
          font-size: 0.7rem;
          font-weight: 700;
          line-height: 1.45;
        }
        .msc-sheet-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.65rem;
        }
        .msc-sheet-grid label {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .msc-sheet-grid label span {
          color: #64748b;
          font-size: 0.58rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.16em;
        }
        .msc-sheet-grid label input {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(148,163,184,0.18);
          background: rgba(255,255,255,0.96);
          color: #0f172a;
          padding: 0.72rem 0.8rem;
          font-size: 0.78rem;
          font-weight: 700;
          outline: none;
        }
        .msc-sheet-actions {
          display: flex;
          gap: 0.7rem;
          margin-top: 0.9rem;
        }
        .msc-sheet-secondary,
        .msc-sheet-primary {
          flex: 1;
          min-height: 3rem;
          border-radius: 16px;
          border: none;
          font-size: 0.78rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .msc-sheet-secondary {
          background: rgba(148,163,184,0.12);
          color: #475569;
        }
        .msc-sheet-primary {
          background: linear-gradient(135deg, #16a34a, #22c55e);
          color: #fff;
          box-shadow: 0 14px 30px rgba(34,197,94,0.22);
        }
        .msc-video {
          width: 100%; height: 100%;
          object-fit: cover;
          display: block;
          background: #cbd5e1;
          position: absolute;
          inset: 0;
          z-index: 0;
        }
        .msc-video-idle {
          opacity: 0;
          pointer-events: none;
        }
        .msc-video-active {
          opacity: 1;
        }
        .msc-camera-placeholder {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          height: 100%; gap: 1rem; color: #64748b;
        }
        .msc-placeholder-icon { opacity: 0.3; }
        .msc-camera-placeholder p { font-size: 0.8rem; font-weight: 600; }

        /* ── Scanning overlay ───────────────────────────────────── */
        .msc-scan-overlay {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: space-between;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem 1rem 1.35rem;
          pointer-events: none;
          z-index: 1;
        }
        .msc-overlay-head {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.65rem;
          flex-wrap: wrap;
        }
        .msc-overlay-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.55rem 0.8rem;
          border-radius: 999px;
          background: rgba(255,255,255,0.88);
          border: 1px solid rgba(148,163,184,0.22);
          color: #334155;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .msc-overlay-chip.ready {
          color: #047857;
          border-color: rgba(34,197,94,0.3);
        }
        .msc-scan-frame {
          width: min(88vw, 420px);
          aspect-ratio: 2.2 / 1;
          position: relative;
          border-radius: 20px;
          margin: auto 0;
          background: transparent;
        }
        .msc-overlay-tip {
          padding: 0.55rem 0.9rem;
          border-radius: 18px;
          background: rgba(255,255,255,0.9);
          border: 1px solid rgba(148,163,184,0.18);
          color: #334155;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-align: center;
          max-width: min(92%, 32rem);
        }
        .msc-corner {
          position: absolute; width: 24px; height: 24px;
          border-color: #22c55e; border-style: solid; border-width: 0;
        }
        .msc-tl { top: -2px; left: -2px; border-top-width: 3px; border-left-width: 3px; border-top-left-radius: 12px; }
        .msc-tr { top: -2px; right: -2px; border-top-width: 3px; border-right-width: 3px; border-top-right-radius: 12px; }
        .msc-bl { bottom: -2px; left: -2px; border-bottom-width: 3px; border-left-width: 3px; border-bottom-left-radius: 12px; }
        .msc-br { bottom: -2px; right: -2px; border-bottom-width: 3px; border-right-width: 3px; border-bottom-right-radius: 12px; }

        .msc-scan-line {
          position: absolute;
          left: 8px; right: 8px; height: 2px;
          background: linear-gradient(90deg, transparent, #22c55e, transparent);
          animation: msc-scanline 2s ease-in-out infinite;
          border-radius: 2px;
          box-shadow: 0 0 12px #22c55e;
        }
        @keyframes msc-scanline {
          0% { top: 10%; opacity: 0.4; }
          50% { top: 85%; opacity: 1; }
          100% { top: 10%; opacity: 0.4; }
        }

        /* ── Last scan feedback ─────────────────────────────────── */
        .msc-last-scan {
          padding: 0.85rem 1rem calc(0.85rem + env(safe-area-inset-bottom));
          background: rgba(255,255,255,0.92);
          border-top: 1px solid rgba(148,163,184,0.18);
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 0.75rem;
          z-index: 20;
          flex-wrap: wrap;
        }
        .msc-last-awb-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          min-width: 0;
        }
        .msc-last-awb {
          display: flex; align-items: center; gap: 0.4rem;
          font-size: 0.8rem; font-weight: 800;
          font-family: 'SF Mono', 'Fira Code', monospace;
        }
        .msc-check { color: #22c55e; }
        .msc-awb-text { color: #0f172a; }
        .msc-client-badge {
          display: flex; align-items: center; gap: 0.25rem;
          padding: 0.25rem 0.6rem;
          border-radius: 8px;
          background: rgba(14,165,233,0.12);
          color: #0369a1;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .msc-feedback-card {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          align-items: flex-end;
          max-width: none;
          flex: 1 1 100%;
          padding-top: 0.15rem;
        }
        .msc-feedback-details {
          display: grid;
          gap: 0.3rem;
          width: 100%;
        }
        .msc-feedback-details div {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.08rem;
        }
        .msc-feedback-details span {
          color: #64748b;
          font-size: 0.58rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .msc-feedback-details strong {
          color: #0f172a;
          font-size: 0.72rem;
          font-weight: 800;
          text-align: right;
        }
        .msc-feedback-pill {
          display: inline-flex;
          align-items: center;
          align-self: flex-start;
          padding: 0.24rem 0.55rem;
          border-radius: 999px;
          font-size: 0.58rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .msc-feedback-pill.pending_review,
        .msc-feedback-pill.review_deferred {
          background: rgba(245,158,11,0.18);
          color: #fbbf24;
        }
        .msc-feedback-pill.success {
          background: rgba(34,197,94,0.18);
          color: #4ade80;
        }
        .msc-feedback-pill.error {
          background: rgba(239,68,68,0.18);
          color: #f87171;
        }

        /* ── Controls ───────────────────────────────────────────── */
        .msc-controls {
          padding: 1rem;
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
          background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(248,250,252,0.96) 30%, #ffffff 100%);
          border-top: 1px solid rgba(148,163,184,0.18);
          z-index: 20;
        }
        .msc-cam-btn {
          display: flex; align-items: center; justify-content: center; gap: 0.6rem;
          width: 100%;
          padding: 1rem;
          border-radius: 18px;
          border: none;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #fff;
          font-size: 0.85rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          cursor: pointer;
          transition: transform 0.1s;
          box-shadow: 0 4px 20px rgba(34,197,94,0.3);
        }
        .msc-cam-btn:disabled {
          opacity: 0.7;
        }
        .msc-cam-btn:active { transform: scale(0.97); }
        .msc-cam-active {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          box-shadow: 0 4px 20px rgba(239,68,68,0.3);
        }
        .msc-capture-panel + .msc-controls {
          padding-top: 0.5rem;
        }
        @media (max-width: 480px) {
          .msc-status-left, .msc-status-right {
            font-size: 0.58rem;
            letter-spacing: 0.16em;
          }
          .msc-scan-frame {
            width: min(90vw, 360px);
            aspect-ratio: 2 / 1;
          }
          .msc-overlay-tip {
            font-size: 0.68rem;
          }
          .msc-feedback-details {
            grid-template-columns: 1fr;
          }
          .msc-feedback-details div {
            align-items: flex-start;
          }
          .msc-feedback-details strong {
            text-align: left;
          }
          .msc-approval-sheet {
            margin: 0 0.55rem;
            bottom: calc(4.5rem + env(safe-area-inset-bottom));
            max-height: min(58vh, 520px);
          }
          .msc-sheet-body {
            padding: 0.15rem 0.8rem 0.95rem;
            max-height: calc(min(58vh, 520px) - 12px);
          }
          .msc-capture-panel {
            left: 0.55rem;
            right: 0.55rem;
            bottom: calc(0.35rem + env(safe-area-inset-bottom));
            padding: 0.72rem;
            max-height: min(42vh, 340px);
          }
          .msc-capture-actions {
            flex-direction: column;
          }
          .msc-sheet-grid {
            grid-template-columns: 1fr;
          }
        }
      `})]})}export{Bt as default};
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/index-OhzldbFf.js","assets/vendor-helmet-Dwc3L0SQ.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
