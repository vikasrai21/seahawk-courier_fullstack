import{j as e}from"./page-landing-BAx51FWo.js";import{r as n}from"./vendor-helmet-Dwc3L0SQ.js";import{l as Qe}from"./index-mQ8lkRLZ.js";import{D as Pe,a as O,B as et,N as tt}from"./BrowserQRCodeReader-BdrjJ2XZ.js";import{e as st}from"./vendor-react-B5FFh0eD.js";import{b2 as rt,Z as Ie,b as Le,b4 as at,b6 as nt,X as ue,bi as We,bj as U,ab as Fe,t as Oe,aN as it}from"./vendor-icons-RjYP-ZdP.js";import"./page-import-D4CRWJLo.js";import"./page-reconcile-B6OsGV0x.js";import"./page-rate-calc-Dy5K7MEX.js";function ct(){return window.location.origin}const ee=(g=880,l=.08)=>{try{const m=new(window.AudioContext||window.webkitAudioContext),h=m.createOscillator(),k=m.createGain();h.type="sine",h.frequency.setValueAtTime(g,m.currentTime),k.gain.setValueAtTime(.15,m.currentTime),k.gain.exponentialRampToValueAtTime(.01,m.currentTime+l),h.connect(k),k.connect(m.destination),h.start(),h.stop(m.currentTime+l)}catch{}},te=(g=[50])=>{var l;try{(l=navigator.vibrate)==null||l.call(navigator,g)}catch{}},ot=[/^Z\d{8,9}$/,/^D\d{9,11}$/,/^X\d{9,10}$/,/^7X\d{9}$/,/^I\d{7,8}$/,/^JD\d{18}$/,/^\d{12,14}$/,/^[A-Z]{1,3}\d{7,14}$/];function lt(g){const l=String(g||"").toUpperCase().replace(/\s+/g,"").replace(/[^A-Z0-9]/g,"");if(l.length<8)return"";if(ot.some(h=>h.test(l)))return l;const m=(l.match(/\d/g)||[]).length;return/^(?=.*\d)[A-Z0-9]{8,18}$/.test(l)&&m>=7?l:""}function wt(){const{pin:g}=st(),[l,m]=n.useState(g||""),[h,k]=n.useState(g||""),[j,f]=n.useState("idle"),[T,x]=n.useState(""),[dt,Ue]=n.useState(""),[ge,he]=n.useState(0),[fe,xe]=n.useState(""),[r,$e]=n.useState(null),[be,C]=n.useState(null),[S,ve]=n.useState(!1),[se,re]=n.useState(!1),[we,$]=n.useState(!1),[je,H]=n.useState(""),[M,ae]=n.useState(""),[ne,ie]=n.useState(!1),[z,P]=n.useState(!1),[ye,b]=n.useState(""),[I,_]=n.useState(""),[y,V]=n.useState(null),[c,p]=n.useState(null),[Z,ce]=n.useState(!1),[Ne,X]=n.useState(""),N=n.useRef(null),R=n.useRef(null),Ce=n.useRef(null),oe=n.useRef(null),le=n.useRef(null),de=n.useRef(null),q=n.useRef(!1),K=n.useRef(!1),me=n.useRef(""),Y=n.useRef(0),ke=n.useRef(0),He=async t=>new Promise((s,i)=>{if(!t){i(new Error("Video element unavailable"));return}let a=!1;const o=()=>{a||(a=!0,t.removeEventListener("loadedmetadata",d),t.removeEventListener("canplay",d),clearTimeout(u),s())},v=()=>{a||(a=!0,t.removeEventListener("loadedmetadata",d),t.removeEventListener("canplay",d),clearTimeout(u),i(new Error("Camera preview did not become ready")))},d=()=>o(),u=setTimeout(v,5e3);if(t.readyState>=2){o();return}t.addEventListener("loadedmetadata",d,{once:!0}),t.addEventListener("canplay",d,{once:!0})}),_e=async()=>new Promise((t,s)=>{const i=Date.now(),a=()=>{const o=R.current;if(o){t(o);return}if(Date.now()-i>2500){s(new Error("Camera surface unavailable"));return}requestAnimationFrame(a)};a()}),Ve=(t={})=>({shipmentId:t.shipmentId||null,awb:String(t.awb||"").trim(),clientCode:String(t.clientCode||"").trim().toUpperCase(),clientName:String(t.clientName||"").trim(),consignee:String(t.consignee||"").trim().toUpperCase(),destination:String(t.destination||"").trim().toUpperCase(),pincode:String(t.pincode||"").replace(/\D/g,"").slice(0,6),weight:t.weight||0,amount:t.amount||0,orderNo:String(t.orderNo||"").trim().toUpperCase()}),Se=n.useCallback(t=>{const s=String(t||"").trim();if(s.length!==6){x("Please enter a valid 6-digit PIN"),f("error");return}m(s),f("connecting"),x("");const i=Qe(ct(),{auth:{scannerPin:s},withCredentials:!0,reconnection:!0,reconnectionAttempts:5,reconnectionDelay:2e3});N.current=i,i.on("connect",()=>{}),i.on("scanner:paired",({message:a,userEmail:o})=>{f("paired"),Ue(o||"Desktop"),x(""),te([100,50,100]),ee(1200,.1)}),i.on("scanner:scan-feedback",a=>{$e(a),a.status==="pending_review"&&(p(Ve(a)),X("Review the extracted fields, adjust anything wrong, then approve.")),a.status==="success"?(C("success"),te([30]),ee(1400,.06)):(C("error"),te([100,50,100]),ee(200,.2)),setTimeout(()=>C(null),600)}),i.on("scanner:approval-result",({success:a,message:o})=>{ce(!1),X(o||""),a?(p(null),C("success")):C("error"),setTimeout(()=>C(null),600)}),i.on("scanner:session-ended",({reason:a})=>{f("ended"),x(a||"Session ended"),A()}),i.on("scanner:error",({message:a})=>{f("error"),x(a)}),i.on("disconnect",()=>{j!=="ended"&&(f("error"),x("Connection lost. Trying to reconnect..."))}),i.on("reconnect",()=>{f("paired"),x("")}),i.on("connect_error",()=>{f("error"),x("Could not connect to server. Check your network.")})},[]);n.useEffect(()=>(g&&g.length===6&&Se(g),()=>{var t;(t=N.current)==null||t.disconnect(),A()}),[]);const Ze=()=>{!c||!N.current||(ce(!0),X("Sending approved intake to desktop..."),N.current.emit("scanner:approval-submit",{shipmentId:c.shipmentId,awb:c.awb,fields:{clientCode:c.clientCode,consignee:c.consignee,destination:c.destination,pincode:c.pincode,weight:c.weight,amount:c.amount,orderNo:c.orderNo}},t=>{t!=null&&t.success||(ce(!1),X((t==null?void 0:t.message)||"Desktop did not accept the approval."))}))},A=async()=>{var t,s,i,a,o;try{await((t=le.current)==null?void 0:t.reset())}catch{}le.current=null;try{(i=(s=de.current)==null?void 0:s.getTracks)==null||i.call(s).forEach(v=>v.stop())}catch{}de.current=null,R.current&&(R.current.srcObject=null,(o=(a=R.current).pause)==null||o.call(a)),q.current=!1,K.current=!1,me.current="",Y.current=0,ve(!1),re(!1),$(!1),ae(""),ie(!1),P(!1),b(""),_(""),V(null)},ze=({quality:t=.82,maxWidth:s=1920,target:i="full"}={})=>{const a=R.current;if(!a||!a.videoWidth)return null;try{let o=0,v=0,d=a.videoWidth,u=a.videoHeight;if(i==="focus"&&Ce.current&&oe.current){const G=a.getBoundingClientRect(),B=oe.current.getBoundingClientRect(),W=G.width,F=G.height,J=a.videoWidth,Q=a.videoHeight,pe=J/Q,Ye=W/F;let D=W,E=F,Ae=0,Be=0;pe>Ye?(E=F,D=E*pe,Ae=(D-W)/2):(D=W,E=D/pe,Be=(E-F)/2);const De=B.width*.55,Ee=B.height*.9,Te=Math.max(0,B.left-G.left-De),Me=Math.max(0,B.top-G.top-Ee),Ge=Math.min(W-Te,B.width+De*2),Je=Math.min(F-Me,B.height+Ee*2);o=Math.max(0,(Te+Ae)/D*J),v=Math.max(0,(Me+Be)/E*Q),d=Math.min(J-o,Ge/D*J),u=Math.min(Q-v,Je/E*Q)}const w=document.createElement("canvas");w.width=Math.min(s,d),w.height=Math.round(w.width/d*u);const L=w.getContext("2d");return L?(L.drawImage(a,o,v,d,u,0,0,w.width,w.height),w.toDataURL("image/jpeg",t).split(",")[1]||null):null}catch{return null}},Xe=async()=>{if(M){P(!0),b("Capturing still photo...");try{const t=ze({quality:.9,maxWidth:2200,target:"full"}),s=ze({quality:.94,maxWidth:1800,target:"focus"});if(!t){b("Could not capture photo. Hold steady and try again.");return}V({imageBase64:t,focusImageBase64:s}),_(`data:image/jpeg;base64,${s||t}`),b("Photo captured. Use it or retake it.")}finally{P(!1)}}},qe=()=>{_(""),V(null),b("Retake the full AWB photo.")},Re=async(t=!0)=>{if(!(!M||!N.current)){if(t&&!(y!=null&&y.imageBase64)){b("Capture the label photo first.");return}P(!0),b(t?"Sending captured photo to OCR...":"Sending barcode only...");try{const s=t&&(y==null?void 0:y.imageBase64)||null,i=t&&(y==null?void 0:y.focusImageBase64)||null;N.current.emit("scanner:scan",{awb:M,imageBase64:s,focusImageBase64:i}),he(a=>a+1),xe(M),ie(!1),ae(""),_(""),V(null),K.current=!1,Y.current=Date.now()+700,b("Sent to desktop. Keep scanning."),setTimeout(()=>b(""),1400)}finally{P(!1)}}},Ke=async()=>{var t;if(!(!N.current||j!=="paired"))try{H(""),$(!0),await A(),ve(!0);const s=await _e();if(!((t=navigator.mediaDevices)!=null&&t.getUserMedia))throw new Error("This browser is not allowing camera access.");const i=await navigator.mediaDevices.getUserMedia({audio:!1,video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}}});de.current=i;const a=new Map;a.set(Pe.TRY_HARDER,!0),a.set(Pe.POSSIBLE_FORMATS,[O.CODE_128,O.CODE_39,O.CODABAR,O.ITF,O.CODE_93]);const o=new et(a,{delayBetweenScanAttempts:25,delayBetweenScanSuccess:80});le.current=o,re(!1),s.srcObject=i,s.muted=!0,s.defaultMuted=!0,s.setAttribute("playsinline","true"),s.setAttribute("webkit-playsinline","true"),await s.play(),await He(s),re(!0),$(!1),await o.decodeFromVideoElement(s,async(v,d)=>{if(K.current)return;if(!v){if(d&&!(d instanceof tt)){const L=Date.now();L-ke.current>1500&&(H("Scanner is active but cannot decode yet. Try moving closer and hold steady."),ke.current=L)}return}H("");const u=lt(v.getText()),w=Date.now();u&&(q.current||w<Y.current&&u===me.current||(q.current=!0,Y.current=w+450,me.current=u,K.current=!0,C("success"),te([50]),ee(880,.06),setTimeout(()=>C(null),400),xe(u),ae(u),ie(!0),b("Barcode locked. Now capture the full AWB label photo."),q.current=!1))})}catch(s){const i=(s==null?void 0:s.message)||"Camera failed";H(i),x(i),$(!1),await A()}};return n.useEffect(()=>{if(j!=="paired")return;const t=setInterval(()=>{var s;(s=N.current)==null||s.emit("scanner:heartbeat")},5e3);return()=>clearInterval(t)},[j]),j==="idle"||j==="error"&&!l?e.jsx("div",{className:"msc-root",children:e.jsxs("div",{className:"msc-container",children:[e.jsx("div",{className:"msc-logo-ring",children:e.jsx(rt,{size:36})}),e.jsx("h1",{className:"msc-title",children:"Seahawk Remote Scanner"}),e.jsx("p",{className:"msc-subtitle",children:"Enter the 6-digit PIN shown on your desktop"}),e.jsxs("div",{className:"msc-pin-group",children:[e.jsx("input",{className:"msc-pin-input",type:"tel",inputMode:"numeric",pattern:"[0-9]*",maxLength:6,placeholder:"● ● ● ● ● ●",value:h,onChange:t=>k(t.target.value.replace(/\D/g,"").slice(0,6)),autoFocus:!0}),e.jsxs("button",{className:"msc-connect-btn",disabled:h.length!==6,onClick:()=>Se(h),children:[e.jsx(Ie,{size:18})," Connect"]})]}),T&&e.jsxs("div",{className:"msc-error",children:[e.jsx(Le,{size:14})," ",T]}),e.jsxs("p",{className:"msc-hint",children:["Open ",e.jsx("strong",{children:"Rapid Terminal"})," on your desktop and click ",e.jsx("strong",{children:'"Connect Mobile"'})," to get the PIN."]})]})}):j==="connecting"?e.jsx("div",{className:"msc-root",children:e.jsxs("div",{className:"msc-container",children:[e.jsx("div",{className:"msc-logo-ring msc-pulse",children:e.jsx(at,{size:36})}),e.jsx("h1",{className:"msc-title",children:"Connecting..."}),e.jsxs("p",{className:"msc-subtitle",children:["Pairing with desktop via PIN ",l]})]})}):j==="ended"?e.jsx("div",{className:"msc-root",children:e.jsxs("div",{className:"msc-container",children:[e.jsx("div",{className:"msc-logo-ring msc-ended",children:e.jsx(nt,{size:36})}),e.jsx("h1",{className:"msc-title",children:"Session Ended"}),e.jsx("p",{className:"msc-subtitle",children:T||"The scanning session has been closed."}),e.jsxs("p",{className:"msc-stat",children:["Total scans: ",e.jsx("strong",{children:ge})]}),e.jsx("button",{className:"msc-connect-btn",onClick:()=>{f("idle"),m(""),k(""),x(""),he(0)},children:"Start New Session"})]})}):e.jsxs("div",{className:`msc-root ${be==="success"?"msc-flash-success":be==="error"?"msc-flash-error":""}`,children:[e.jsxs("div",{className:"msc-status-bar",children:[e.jsxs("div",{className:"msc-status-left",children:[e.jsx("div",{className:"msc-dot msc-dot-live"}),e.jsx("span",{children:"LIVE"}),e.jsxs("span",{className:"msc-status-pin",children:["PIN ",l]})]}),e.jsxs("div",{className:"msc-status-right",children:[e.jsxs("span",{className:"msc-scan-count",children:[ge," scans"]}),e.jsx("button",{className:"msc-end-btn",onClick:()=>{var t;(t=N.current)==null||t.disconnect(),A(),f("ended")},children:e.jsx(ue,{size:16})})]})]}),e.jsxs("div",{className:"msc-camera-wrap",ref:Ce,children:[e.jsx("video",{ref:R,className:`msc-video ${S?"msc-video-active":"msc-video-idle"}`,muted:!0,playsInline:!0,autoPlay:!0,disablePictureInPicture:!0}),S?e.jsx(e.Fragment,{children:e.jsxs("div",{className:"msc-scan-overlay",children:[e.jsxs("div",{className:"msc-overlay-head",children:[e.jsxs("div",{className:"msc-overlay-chip",children:[e.jsx(We,{size:14}),se?"Rear camera live":"Opening rear camera"]}),e.jsxs("div",{className:`msc-overlay-chip ${se?"ready":""}`,children:[e.jsx(U,{size:14}),se?"Aim at AWB barcode":"Waking camera"]})]}),e.jsxs("div",{className:"msc-scan-frame",ref:oe,children:[e.jsx("div",{className:"msc-corner msc-tl"}),e.jsx("div",{className:"msc-corner msc-tr"}),e.jsx("div",{className:"msc-corner msc-bl"}),e.jsx("div",{className:"msc-corner msc-br"}),e.jsx("div",{className:"msc-scan-line"})]}),e.jsx("div",{className:"msc-overlay-tip",children:ne?I?"Still photo captured. Use it or retake it before OCR.":"Barcode locked. Hold full AWB in view and tap Capture Label.":"Point to barcode first. After lock, capture full AWB for client, consignee, destination, pincode, weight, and value."})]})}):e.jsxs("div",{className:"msc-camera-placeholder",children:[e.jsx(Fe,{size:48,className:"msc-placeholder-icon"}),e.jsx("p",{children:"Tap below to start scanning"})]})]}),c&&e.jsxs("div",{className:"msc-approval-sheet",children:[e.jsx("div",{className:"msc-sheet-handle"}),e.jsxs("div",{className:"msc-sheet-body",children:[e.jsxs("div",{className:"msc-sheet-head",children:[e.jsxs("div",{children:[e.jsx("div",{className:"msc-sheet-kicker",children:"Final Approval"}),e.jsx("div",{className:"msc-sheet-title",children:"Review this shipment before it reaches desktop and portal"})]}),e.jsx("button",{className:"msc-sheet-close",type:"button",onClick:()=>p(null),disabled:Z,children:e.jsx(ue,{size:16})})]}),e.jsx("div",{className:"msc-sheet-awb",children:c.awb}),Ne?e.jsx("div",{className:"msc-sheet-message",children:Ne}):null,e.jsxs("div",{className:"msc-sheet-grid",children:[e.jsxs("label",{children:[e.jsx("span",{children:"Client code"}),e.jsx("input",{value:c.clientCode,onChange:t=>p(s=>({...s,clientCode:t.target.value.toUpperCase()}))})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Client name"}),e.jsx("input",{value:c.clientName,onChange:t=>p(s=>({...s,clientName:t.target.value}))})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Consignee"}),e.jsx("input",{value:c.consignee,onChange:t=>p(s=>({...s,consignee:t.target.value.toUpperCase()}))})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Destination"}),e.jsx("input",{value:c.destination,onChange:t=>p(s=>({...s,destination:t.target.value.toUpperCase()}))})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Pincode"}),e.jsx("input",{value:c.pincode,onChange:t=>p(s=>({...s,pincode:t.target.value.replace(/\D/g,"").slice(0,6)}))})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Weight"}),e.jsx("input",{type:"number",step:"0.01",value:c.weight,onChange:t=>p(s=>({...s,weight:t.target.value}))})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Value"}),e.jsx("input",{type:"number",step:"0.01",value:c.amount,onChange:t=>p(s=>({...s,amount:t.target.value}))})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Order no"}),e.jsx("input",{value:c.orderNo,onChange:t=>p(s=>({...s,orderNo:t.target.value.toUpperCase()}))})]})]}),e.jsxs("div",{className:"msc-sheet-actions",children:[e.jsx("button",{type:"button",className:"msc-sheet-secondary",onClick:()=>p(null),disabled:Z,children:"Keep scanning"}),e.jsx("button",{type:"button",className:"msc-sheet-primary",onClick:Ze,disabled:Z,children:Z?e.jsxs(e.Fragment,{children:[e.jsx(U,{size:16})," Saving..."]}):e.jsxs(e.Fragment,{children:[e.jsx(Oe,{size:16})," Approve & Send"]})})]})]})]}),S&&ne&&e.jsxs("div",{className:"msc-capture-panel",children:[e.jsxs("div",{className:"msc-capture-title",children:["Barcode: ",M||"LOCKED"]}),e.jsx("div",{className:"msc-capture-sub",children:I?"This still image will be sent to OCR. Retake if the label is blurry or cropped.":"Take one clear full-label photo so OCR can extract all fields."}),I?e.jsx("div",{className:"msc-preview-shell",children:e.jsx("img",{src:I,alt:"Captured AWB label",className:"msc-preview-image"})}):null,e.jsxs("div",{className:"msc-capture-actions",children:[I?e.jsxs(e.Fragment,{children:[e.jsx("button",{type:"button",className:"msc-capture-secondary",onClick:qe,disabled:z,children:"Retake Photo"}),e.jsx("button",{type:"button",className:"msc-capture-primary",onClick:()=>Re(!0),disabled:z,children:z?e.jsxs(e.Fragment,{children:[e.jsx(U,{size:16})," Sending..."]}):e.jsxs(e.Fragment,{children:[e.jsx(Oe,{size:16})," Use Photo"]})})]}):e.jsx("button",{type:"button",className:"msc-capture-primary",onClick:Xe,disabled:z,children:z?e.jsxs(e.Fragment,{children:[e.jsx(U,{size:16})," Capturing..."]}):e.jsxs(e.Fragment,{children:[e.jsx(We,{size:16})," Capture Label"]})}),e.jsx("button",{type:"button",className:"msc-capture-secondary",onClick:()=>Re(!1),disabled:z,children:"Send Barcode Only"})]})]}),!ne&&!!ye&&e.jsx("div",{className:"msc-capture-toast",children:ye}),fe&&e.jsxs("div",{className:"msc-last-scan",children:[e.jsxs("div",{className:"msc-last-awb-wrap",children:[e.jsxs("div",{className:"msc-last-awb",children:[e.jsx(it,{size:16,className:"msc-check"}),e.jsx("span",{className:"msc-awb-text",children:fe})]}),(r==null?void 0:r.status)&&e.jsx("div",{className:`msc-feedback-pill ${r.status}`,children:r.status==="pending_review"?"Pending desktop review":r.status==="success"?"Verified":r.status==="review_deferred"?"Deferred":"Needs attention"})]}),((r==null?void 0:r.clientCode)||(r==null?void 0:r.consignee)||(r==null?void 0:r.destination)||(r==null?void 0:r.weight))&&e.jsxs("div",{className:"msc-feedback-card",children:[(r==null?void 0:r.clientCode)&&e.jsxs("div",{className:"msc-client-badge",children:[e.jsx(Ie,{size:12})," ",r.clientCode,r.clientName?` · ${r.clientName}`:""]}),e.jsxs("div",{className:"msc-feedback-details",children:[r!=null&&r.consignee?e.jsxs("div",{children:[e.jsx("span",{children:"Consignee"}),e.jsx("strong",{children:r.consignee})]}):null,r!=null&&r.destination?e.jsxs("div",{children:[e.jsx("span",{children:"Destination"}),e.jsx("strong",{children:r.destination})]}):null,r!=null&&r.weight?e.jsxs("div",{children:[e.jsx("span",{children:"Weight"}),e.jsxs("strong",{children:[r.weight," kg"]})]}):null]})]})]}),(je||T&&j==="error")&&e.jsxs("div",{className:"msc-error msc-error-banner",children:[e.jsx(Le,{size:14})," ",je||T]}),e.jsx("div",{className:"msc-controls",children:e.jsx("button",{className:`msc-cam-btn ${S?"msc-cam-active":""}`,disabled:we,onClick:S?A:Ke,children:S?e.jsxs(e.Fragment,{children:[e.jsx(ue,{size:22})," Stop Camera"]}):we?e.jsxs(e.Fragment,{children:[e.jsx(U,{size:22})," Starting Camera..."]}):e.jsxs(e.Fragment,{children:[e.jsx(Fe,{size:22})," Start Scanning"]})})}),e.jsx("style",{children:`
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
      `})]})}export{wt as default};
