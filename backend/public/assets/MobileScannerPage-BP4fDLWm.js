import{j as e}from"./page-landing-BAx51FWo.js";import{r as n}from"./vendor-helmet-Dwc3L0SQ.js";import{l as Je}from"./index-C6Jgc5Ue.js";import{D as Pe,a as b,B as et,N as tt}from"./BrowserQRCodeReader-BdrjJ2XZ.js";import{e as st}from"./vendor-react-B5FFh0eD.js";import{b2 as rt,Z as Ie,b as Le,b4 as at,b6 as nt,X as ue,bi as We,bj as U,ab as Fe,t as Oe,aN as it}from"./vendor-icons-RjYP-ZdP.js";import"./page-import-D4CRWJLo.js";import"./page-reconcile-B6OsGV0x.js";import"./page-rate-calc-Dy5K7MEX.js";function ct(){return window.location.origin}const ee=(v=880,w=.08)=>{try{const p=new(window.AudioContext||window.webkitAudioContext),j=p.createOscillator(),S=p.createGain();j.type="sine",j.frequency.setValueAtTime(v,p.currentTime),S.gain.setValueAtTime(.15,p.currentTime),S.gain.exponentialRampToValueAtTime(.01,p.currentTime+w),j.connect(S),S.connect(p.destination),j.start(),j.stop(p.currentTime+w)}catch{}},te=(v=[50])=>{var w;try{(w=navigator.vibrate)==null||w.call(navigator,v)}catch{}};function bt(){const{pin:v}=st(),[w,p]=n.useState(v||""),[j,S]=n.useState(v||""),[y,u]=n.useState("idle"),[M,g]=n.useState(""),[ot,Ue]=n.useState(""),[ge,fe]=n.useState(0),[he,xe]=n.useState(""),[r,_e]=n.useState(null),[be,k]=n.useState(null),[z,ve]=n.useState(!1),[se,re]=n.useState(!1),[we,_]=n.useState(!1),[je,H]=n.useState(""),[P,ae]=n.useState(""),[ne,ie]=n.useState(!1),[R,I]=n.useState(!1),[ye,f]=n.useState(""),[L,V]=n.useState(""),[N,$]=n.useState(null),[c,d]=n.useState(null),[q,ce]=n.useState(!1),[Ne,K]=n.useState(""),C=n.useRef(null),A=n.useRef(null),Ce=n.useRef(null),oe=n.useRef(null),le=n.useRef(null),de=n.useRef(null),X=n.useRef(!1),Y=n.useRef(!1),me=n.useRef(""),Z=n.useRef(0),ke=n.useRef(0),He=async t=>new Promise((s,i)=>{if(!t){i(new Error("Video element unavailable"));return}let a=!1;const o=()=>{a||(a=!0,t.removeEventListener("loadedmetadata",l),t.removeEventListener("canplay",l),clearTimeout(m),s())},h=()=>{a||(a=!0,t.removeEventListener("loadedmetadata",l),t.removeEventListener("canplay",l),clearTimeout(m),i(new Error("Camera preview did not become ready")))},l=()=>o(),m=setTimeout(h,5e3);if(t.readyState>=2){o();return}t.addEventListener("loadedmetadata",l,{once:!0}),t.addEventListener("canplay",l,{once:!0})}),Ve=async()=>new Promise((t,s)=>{const i=Date.now(),a=()=>{const o=A.current;if(o){t(o);return}if(Date.now()-i>2500){s(new Error("Camera surface unavailable"));return}requestAnimationFrame(a)};a()}),$e=(t={})=>({shipmentId:t.shipmentId||null,awb:String(t.awb||"").trim(),clientCode:String(t.clientCode||"").trim().toUpperCase(),clientName:String(t.clientName||"").trim(),consignee:String(t.consignee||"").trim().toUpperCase(),destination:String(t.destination||"").trim().toUpperCase(),pincode:String(t.pincode||"").replace(/\D/g,"").slice(0,6),weight:t.weight||0,amount:t.amount||0,orderNo:String(t.orderNo||"").trim().toUpperCase()}),Se=n.useCallback(t=>{const s=String(t||"").trim();if(s.length!==6){g("Please enter a valid 6-digit PIN"),u("error");return}p(s),u("connecting"),g("");const i=Je(ct(),{auth:{scannerPin:s},withCredentials:!0,reconnection:!0,reconnectionAttempts:5,reconnectionDelay:2e3});C.current=i,i.on("connect",()=>{}),i.on("scanner:paired",({message:a,userEmail:o})=>{u("paired"),Ue(o||"Desktop"),g(""),te([100,50,100]),ee(1200,.1)}),i.on("scanner:scan-feedback",a=>{_e(a),a.status==="pending_review"&&(d($e(a)),K("Review the extracted fields, adjust anything wrong, then approve.")),a.status==="success"?(k("success"),te([30]),ee(1400,.06)):(k("error"),te([100,50,100]),ee(200,.2)),setTimeout(()=>k(null),600)}),i.on("scanner:approval-result",({success:a,message:o})=>{ce(!1),K(o||""),a?(d(null),k("success")):k("error"),setTimeout(()=>k(null),600)}),i.on("scanner:session-ended",({reason:a})=>{u("ended"),g(a||"Session ended"),B()}),i.on("scanner:error",({message:a})=>{u("error"),g(a)}),i.on("disconnect",()=>{y!=="ended"&&(u("error"),g("Connection lost. Trying to reconnect..."))}),i.on("reconnect",()=>{u("paired"),g("")}),i.on("connect_error",()=>{u("error"),g("Could not connect to server. Check your network.")})},[]);n.useEffect(()=>(v&&v.length===6&&Se(v),()=>{var t;(t=C.current)==null||t.disconnect(),B()}),[]);const qe=()=>{!c||!C.current||(ce(!0),K("Sending approved intake to desktop..."),C.current.emit("scanner:approval-submit",{shipmentId:c.shipmentId,awb:c.awb,fields:{clientCode:c.clientCode,consignee:c.consignee,destination:c.destination,pincode:c.pincode,weight:c.weight,amount:c.amount,orderNo:c.orderNo}},t=>{t!=null&&t.success||(ce(!1),K((t==null?void 0:t.message)||"Desktop did not accept the approval."))}))},B=async()=>{var t,s,i,a,o;try{await((t=le.current)==null?void 0:t.reset())}catch{}le.current=null;try{(i=(s=de.current)==null?void 0:s.getTracks)==null||i.call(s).forEach(h=>h.stop())}catch{}de.current=null,A.current&&(A.current.srcObject=null,(o=(a=A.current).pause)==null||o.call(a)),X.current=!1,Y.current=!1,me.current="",Z.current=0,ve(!1),re(!1),_(!1),ae(""),ie(!1),I(!1),f(""),V(""),$(null)},ze=({quality:t=.82,maxWidth:s=1920,target:i="full"}={})=>{const a=A.current;if(!a||!a.videoWidth)return null;try{let o=0,h=0,l=a.videoWidth,m=a.videoHeight;if(i==="focus"&&Ce.current&&oe.current){const G=a.getBoundingClientRect(),E=oe.current.getBoundingClientRect(),F=G.width,O=G.height,Q=a.videoWidth,J=a.videoHeight,pe=Q/J,Ze=F/O;let D=F,T=O,Ae=0,Be=0;pe>Ze?(T=O,D=T*pe,Ae=(D-F)/2):(D=F,T=D/pe,Be=(T-O)/2);const Ee=E.width*.55,De=E.height*.9,Te=Math.max(0,E.left-G.left-Ee),Me=Math.max(0,E.top-G.top-De),Ge=Math.min(F-Te,E.width+Ee*2),Qe=Math.min(O-Me,E.height+De*2);o=Math.max(0,(Te+Ae)/D*Q),h=Math.max(0,(Me+Be)/T*J),l=Math.min(Q-o,Ge/D*Q),m=Math.min(J-h,Qe/T*J)}const x=document.createElement("canvas");x.width=Math.min(s,l),x.height=Math.round(x.width/l*m);const W=x.getContext("2d");return W?(W.drawImage(a,o,h,l,m,0,0,x.width,x.height),x.toDataURL("image/jpeg",t).split(",")[1]||null):null}catch{return null}},Ke=async()=>{if(P){I(!0),f("Capturing still photo...");try{const t=ze({quality:.9,maxWidth:2200,target:"full"}),s=ze({quality:.92,maxWidth:1800,target:"focus"});if(!t){f("Could not capture photo. Hold steady and try again.");return}$({imageBase64:t,focusImageBase64:s}),V(`data:image/jpeg;base64,${t}`),f("Photo captured. Use it or retake it.")}finally{I(!1)}}},Xe=()=>{V(""),$(null),f("Retake the full AWB photo.")},Re=async(t=!0)=>{if(!(!P||!C.current)){if(t&&!(N!=null&&N.imageBase64)){f("Capture the label photo first.");return}I(!0),f(t?"Sending captured photo to OCR...":"Sending barcode only...");try{const s=t&&(N==null?void 0:N.imageBase64)||null,i=t&&(N==null?void 0:N.focusImageBase64)||null;C.current.emit("scanner:scan",{awb:P,imageBase64:s,focusImageBase64:i}),fe(a=>a+1),xe(P),ie(!1),ae(""),V(""),$(null),Y.current=!1,Z.current=Date.now()+700,f("Sent to desktop. Keep scanning."),setTimeout(()=>f(""),1400)}finally{I(!1)}}},Ye=async()=>{var t;if(!(!C.current||y!=="paired"))try{H(""),_(!0),await B(),ve(!0);const s=await Ve();if(!((t=navigator.mediaDevices)!=null&&t.getUserMedia))throw new Error("This browser is not allowing camera access.");const i=await navigator.mediaDevices.getUserMedia({audio:!1,video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}}});de.current=i;const a=new Map;a.set(Pe.TRY_HARDER,!0),a.set(Pe.POSSIBLE_FORMATS,[b.CODE_128,b.CODE_39,b.CODE_93,b.CODABAR,b.ITF,b.EAN_13,b.EAN_8,b.UPC_A,b.UPC_E,b.QR_CODE]);const o=new et(a,{delayBetweenScanAttempts:60,delayBetweenScanSuccess:350});le.current=o,re(!1),s.srcObject=i,s.muted=!0,s.defaultMuted=!0,s.setAttribute("playsinline","true"),s.setAttribute("webkit-playsinline","true"),await s.play(),await He(s),re(!0),_(!1),await o.decodeFromVideoElement(s,async(h,l)=>{if(Y.current)return;if(!h){if(l&&!(l instanceof tt)){const W=Date.now();W-ke.current>1500&&(H("Scanner is active but cannot decode yet. Try moving closer and hold steady."),ke.current=W)}return}H("");const m=String(h.getText()||"").trim(),x=Date.now();m&&(X.current||x<Z.current&&m===me.current||(X.current=!0,Z.current=x+2e3,me.current=m,Y.current=!0,k("success"),te([50]),ee(880,.06),setTimeout(()=>k(null),400),xe(m),ae(m),ie(!0),f("Barcode locked. Now capture the full AWB label photo."),X.current=!1))})}catch(s){const i=(s==null?void 0:s.message)||"Camera failed";H(i),g(i),_(!1),await B()}};return n.useEffect(()=>{if(y!=="paired")return;const t=setInterval(()=>{var s;(s=C.current)==null||s.emit("scanner:heartbeat")},5e3);return()=>clearInterval(t)},[y]),y==="idle"||y==="error"&&!w?e.jsx("div",{className:"msc-root",children:e.jsxs("div",{className:"msc-container",children:[e.jsx("div",{className:"msc-logo-ring",children:e.jsx(rt,{size:36})}),e.jsx("h1",{className:"msc-title",children:"Seahawk Remote Scanner"}),e.jsx("p",{className:"msc-subtitle",children:"Enter the 6-digit PIN shown on your desktop"}),e.jsxs("div",{className:"msc-pin-group",children:[e.jsx("input",{className:"msc-pin-input",type:"tel",inputMode:"numeric",pattern:"[0-9]*",maxLength:6,placeholder:"● ● ● ● ● ●",value:j,onChange:t=>S(t.target.value.replace(/\D/g,"").slice(0,6)),autoFocus:!0}),e.jsxs("button",{className:"msc-connect-btn",disabled:j.length!==6,onClick:()=>Se(j),children:[e.jsx(Ie,{size:18})," Connect"]})]}),M&&e.jsxs("div",{className:"msc-error",children:[e.jsx(Le,{size:14})," ",M]}),e.jsxs("p",{className:"msc-hint",children:["Open ",e.jsx("strong",{children:"Rapid Terminal"})," on your desktop and click ",e.jsx("strong",{children:'"Connect Mobile"'})," to get the PIN."]})]})}):y==="connecting"?e.jsx("div",{className:"msc-root",children:e.jsxs("div",{className:"msc-container",children:[e.jsx("div",{className:"msc-logo-ring msc-pulse",children:e.jsx(at,{size:36})}),e.jsx("h1",{className:"msc-title",children:"Connecting..."}),e.jsxs("p",{className:"msc-subtitle",children:["Pairing with desktop via PIN ",w]})]})}):y==="ended"?e.jsx("div",{className:"msc-root",children:e.jsxs("div",{className:"msc-container",children:[e.jsx("div",{className:"msc-logo-ring msc-ended",children:e.jsx(nt,{size:36})}),e.jsx("h1",{className:"msc-title",children:"Session Ended"}),e.jsx("p",{className:"msc-subtitle",children:M||"The scanning session has been closed."}),e.jsxs("p",{className:"msc-stat",children:["Total scans: ",e.jsx("strong",{children:ge})]}),e.jsx("button",{className:"msc-connect-btn",onClick:()=>{u("idle"),p(""),S(""),g(""),fe(0)},children:"Start New Session"})]})}):e.jsxs("div",{className:`msc-root ${be==="success"?"msc-flash-success":be==="error"?"msc-flash-error":""}`,children:[e.jsxs("div",{className:"msc-status-bar",children:[e.jsxs("div",{className:"msc-status-left",children:[e.jsx("div",{className:"msc-dot msc-dot-live"}),e.jsx("span",{children:"LIVE"}),e.jsxs("span",{className:"msc-status-pin",children:["PIN ",w]})]}),e.jsxs("div",{className:"msc-status-right",children:[e.jsxs("span",{className:"msc-scan-count",children:[ge," scans"]}),e.jsx("button",{className:"msc-end-btn",onClick:()=>{var t;(t=C.current)==null||t.disconnect(),B(),u("ended")},children:e.jsx(ue,{size:16})})]})]}),e.jsxs("div",{className:"msc-camera-wrap",ref:Ce,children:[e.jsx("video",{ref:A,className:`msc-video ${z?"msc-video-active":"msc-video-idle"}`,muted:!0,playsInline:!0,autoPlay:!0,disablePictureInPicture:!0}),z?e.jsx(e.Fragment,{children:e.jsxs("div",{className:"msc-scan-overlay",children:[e.jsxs("div",{className:"msc-overlay-head",children:[e.jsxs("div",{className:"msc-overlay-chip",children:[e.jsx(We,{size:14}),se?"Rear camera live":"Opening rear camera"]}),e.jsxs("div",{className:`msc-overlay-chip ${se?"ready":""}`,children:[e.jsx(U,{size:14}),se?"Aim at AWB barcode":"Waking camera"]})]}),e.jsxs("div",{className:"msc-scan-frame",ref:oe,children:[e.jsx("div",{className:"msc-corner msc-tl"}),e.jsx("div",{className:"msc-corner msc-tr"}),e.jsx("div",{className:"msc-corner msc-bl"}),e.jsx("div",{className:"msc-corner msc-br"}),e.jsx("div",{className:"msc-scan-line"})]}),e.jsx("div",{className:"msc-overlay-tip",children:ne?L?"Still photo captured. Use it or retake it before OCR.":"Barcode locked. Hold full AWB in view and tap Capture Label.":"Point to barcode first. After lock, capture full AWB for client, consignee, destination, pincode, weight, and value."})]})}):e.jsxs("div",{className:"msc-camera-placeholder",children:[e.jsx(Fe,{size:48,className:"msc-placeholder-icon"}),e.jsx("p",{children:"Tap below to start scanning"})]})]}),c&&e.jsxs("div",{className:"msc-approval-sheet",children:[e.jsx("div",{className:"msc-sheet-handle"}),e.jsxs("div",{className:"msc-sheet-head",children:[e.jsxs("div",{children:[e.jsx("div",{className:"msc-sheet-kicker",children:"Final Approval"}),e.jsx("div",{className:"msc-sheet-title",children:"Review this shipment before it reaches desktop and portal"})]}),e.jsx("button",{className:"msc-sheet-close",type:"button",onClick:()=>d(null),disabled:q,children:e.jsx(ue,{size:16})})]}),e.jsx("div",{className:"msc-sheet-awb",children:c.awb}),Ne?e.jsx("div",{className:"msc-sheet-message",children:Ne}):null,e.jsxs("div",{className:"msc-sheet-grid",children:[e.jsxs("label",{children:[e.jsx("span",{children:"Client code"}),e.jsx("input",{value:c.clientCode,onChange:t=>d(s=>({...s,clientCode:t.target.value.toUpperCase()}))})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Client name"}),e.jsx("input",{value:c.clientName,onChange:t=>d(s=>({...s,clientName:t.target.value}))})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Consignee"}),e.jsx("input",{value:c.consignee,onChange:t=>d(s=>({...s,consignee:t.target.value.toUpperCase()}))})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Destination"}),e.jsx("input",{value:c.destination,onChange:t=>d(s=>({...s,destination:t.target.value.toUpperCase()}))})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Pincode"}),e.jsx("input",{value:c.pincode,onChange:t=>d(s=>({...s,pincode:t.target.value.replace(/\D/g,"").slice(0,6)}))})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Weight"}),e.jsx("input",{type:"number",step:"0.01",value:c.weight,onChange:t=>d(s=>({...s,weight:t.target.value}))})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Value"}),e.jsx("input",{type:"number",step:"0.01",value:c.amount,onChange:t=>d(s=>({...s,amount:t.target.value}))})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Order no"}),e.jsx("input",{value:c.orderNo,onChange:t=>d(s=>({...s,orderNo:t.target.value.toUpperCase()}))})]})]}),e.jsxs("div",{className:"msc-sheet-actions",children:[e.jsx("button",{type:"button",className:"msc-sheet-secondary",onClick:()=>d(null),disabled:q,children:"Keep scanning"}),e.jsx("button",{type:"button",className:"msc-sheet-primary",onClick:qe,disabled:q,children:q?e.jsxs(e.Fragment,{children:[e.jsx(U,{size:16})," Saving..."]}):e.jsxs(e.Fragment,{children:[e.jsx(Oe,{size:16})," Approve & Send"]})})]})]}),z&&ne&&e.jsxs("div",{className:"msc-capture-panel",children:[e.jsxs("div",{className:"msc-capture-title",children:["Barcode: ",P||"LOCKED"]}),e.jsx("div",{className:"msc-capture-sub",children:L?"This still image will be sent to OCR. Retake if the label is blurry or cropped.":"Take one clear full-label photo so OCR can extract all fields."}),L?e.jsx("div",{className:"msc-preview-shell",children:e.jsx("img",{src:L,alt:"Captured AWB label",className:"msc-preview-image"})}):null,e.jsxs("div",{className:"msc-capture-actions",children:[L?e.jsxs(e.Fragment,{children:[e.jsx("button",{type:"button",className:"msc-capture-secondary",onClick:Xe,disabled:R,children:"Retake Photo"}),e.jsx("button",{type:"button",className:"msc-capture-primary",onClick:()=>Re(!0),disabled:R,children:R?e.jsxs(e.Fragment,{children:[e.jsx(U,{size:16})," Sending..."]}):e.jsxs(e.Fragment,{children:[e.jsx(Oe,{size:16})," Use Photo"]})})]}):e.jsx("button",{type:"button",className:"msc-capture-primary",onClick:Ke,disabled:R,children:R?e.jsxs(e.Fragment,{children:[e.jsx(U,{size:16})," Capturing..."]}):e.jsxs(e.Fragment,{children:[e.jsx(We,{size:16})," Capture Label"]})}),e.jsx("button",{type:"button",className:"msc-capture-secondary",onClick:()=>Re(!1),disabled:R,children:"Send Barcode Only"})]})]}),!ne&&!!ye&&e.jsx("div",{className:"msc-capture-toast",children:ye}),he&&e.jsxs("div",{className:"msc-last-scan",children:[e.jsxs("div",{className:"msc-last-awb-wrap",children:[e.jsxs("div",{className:"msc-last-awb",children:[e.jsx(it,{size:16,className:"msc-check"}),e.jsx("span",{className:"msc-awb-text",children:he})]}),(r==null?void 0:r.status)&&e.jsx("div",{className:`msc-feedback-pill ${r.status}`,children:r.status==="pending_review"?"Pending desktop review":r.status==="success"?"Verified":r.status==="review_deferred"?"Deferred":"Needs attention"})]}),((r==null?void 0:r.clientCode)||(r==null?void 0:r.consignee)||(r==null?void 0:r.destination)||(r==null?void 0:r.weight))&&e.jsxs("div",{className:"msc-feedback-card",children:[(r==null?void 0:r.clientCode)&&e.jsxs("div",{className:"msc-client-badge",children:[e.jsx(Ie,{size:12})," ",r.clientCode,r.clientName?` · ${r.clientName}`:""]}),e.jsxs("div",{className:"msc-feedback-details",children:[r!=null&&r.consignee?e.jsxs("div",{children:[e.jsx("span",{children:"Consignee"}),e.jsx("strong",{children:r.consignee})]}):null,r!=null&&r.destination?e.jsxs("div",{children:[e.jsx("span",{children:"Destination"}),e.jsx("strong",{children:r.destination})]}):null,r!=null&&r.weight?e.jsxs("div",{children:[e.jsx("span",{children:"Weight"}),e.jsxs("strong",{children:[r.weight," kg"]})]}):null]})]})]}),(je||M&&y==="error")&&e.jsxs("div",{className:"msc-error msc-error-banner",children:[e.jsx(Le,{size:14})," ",je||M]}),e.jsx("div",{className:"msc-controls",children:e.jsx("button",{className:`msc-cam-btn ${z?"msc-cam-active":""}`,disabled:we,onClick:z?B:Ye,children:z?e.jsxs(e.Fragment,{children:[e.jsx(ue,{size:22})," Stop Camera"]}):we?e.jsxs(e.Fragment,{children:[e.jsx(U,{size:22})," Starting Camera..."]}):e.jsxs(e.Fragment,{children:[e.jsx(Fe,{size:22})," Start Scanning"]})})}),e.jsx("style",{children:`
        /* ── Mobile Scanner Styles ─────────────────────────────────────── */
        .msc-root {
          min-height: 100vh;
          min-height: 100dvh;
          background: #080d18;
          color: #fff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: background 0.3s;
          position: relative;
        }
        .msc-flash-success { background: #064e3b !important; }
        .msc-flash-error { background: #7f1d1d !important; }

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
          background: #0f172a;
          border-bottom: 1px solid #1e293b;
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
          background: #000;
          overflow: hidden;
          min-height: 0;
          isolation: isolate;
        }
        .msc-capture-panel {
          position: absolute;
          left: 0.75rem;
          right: 0.75rem;
          bottom: calc(0.65rem + env(safe-area-inset-bottom));
          z-index: 35;
          border-radius: 18px;
          border: 1px solid rgba(52,211,153,0.4);
          background: rgba(2,6,23,0.9);
          backdrop-filter: blur(10px);
          padding: 0.8rem;
          box-shadow: 0 10px 30px rgba(2,6,23,0.45);
        }
        .msc-capture-title {
          color: #bbf7d0;
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-family: 'SF Mono', 'Fira Code', monospace;
        }
        .msc-capture-sub {
          margin-top: 0.35rem;
          color: #cbd5e1;
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
          border: 1px solid rgba(148,163,184,0.18);
          background: rgba(2,6,23,0.82);
          max-height: 220px;
        }
        .msc-preview-image {
          width: 100%;
          display: block;
          object-fit: cover;
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
          background: linear-gradient(135deg, #16a34a, #22c55e);
          box-shadow: 0 12px 24px rgba(34,197,94,0.22);
        }
        .msc-capture-secondary {
          color: #cbd5e1;
          background: rgba(148,163,184,0.16);
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
          background: rgba(15,23,42,0.9);
          color: #bae6fd;
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
          bottom: calc(4.9rem + env(safe-area-inset-bottom));
          z-index: 40;
          margin: 0 0.85rem;
          padding: 0.9rem 0.9rem 1rem;
          border-radius: 26px 26px 22px 22px;
          background: rgba(15,23,42,0.96);
          border: 1px solid rgba(148,163,184,0.18);
          box-shadow: 0 18px 48px rgba(2,6,23,0.46);
          backdrop-filter: blur(20px);
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
          color: #38bdf8;
          font-size: 0.62rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.22em;
        }
        .msc-sheet-title {
          margin-top: 0.35rem;
          color: #f8fafc;
          font-size: 0.92rem;
          font-weight: 800;
          line-height: 1.35;
        }
        .msc-sheet-close {
          width: 2rem;
          height: 2rem;
          border-radius: 999px;
          border: none;
          background: rgba(148,163,184,0.14);
          color: #e2e8f0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .msc-sheet-awb {
          color: #f8fafc;
          font-size: 1rem;
          font-weight: 900;
          font-family: 'SF Mono', 'Fira Code', monospace;
          margin-bottom: 0.55rem;
        }
        .msc-sheet-message {
          margin-bottom: 0.75rem;
          color: #94a3b8;
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
          color: #94a3b8;
          font-size: 0.58rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.16em;
        }
        .msc-sheet-grid label input {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(148,163,184,0.14);
          background: rgba(2,6,23,0.6);
          color: #f8fafc;
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
          color: #cbd5e1;
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
          background: #000;
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
          height: 100%; gap: 1rem; color: #334155;
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
          background: rgba(15,23,42,0.74);
          border: 1px solid rgba(148,163,184,0.2);
          color: #dbeafe;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .msc-overlay-chip.ready {
          color: #86efac;
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
          background: rgba(15,23,42,0.76);
          border: 1px solid rgba(148,163,184,0.18);
          color: #cbd5e1;
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
          background: #0f172a;
          border-top: 1px solid #1e293b;
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
        .msc-awb-text { color: #e2e8f0; }
        .msc-client-badge {
          display: flex; align-items: center; gap: 0.25rem;
          padding: 0.25rem 0.6rem;
          border-radius: 8px;
          background: rgba(59,130,246,0.15);
          color: #60a5fa;
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
          color: #e2e8f0;
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
          background: linear-gradient(180deg, rgba(8,13,24,0) 0%, rgba(8,13,24,0.9) 30%, #0f172a 100%);
          border-top: 1px solid #1e293b;
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
            bottom: calc(4.7rem + env(safe-area-inset-bottom));
            padding: 0.85rem 0.8rem 0.95rem;
          }
          .msc-capture-panel {
            left: 0.55rem;
            right: 0.55rem;
            bottom: calc(0.45rem + env(safe-area-inset-bottom));
            padding: 0.72rem;
          }
          .msc-capture-actions {
            flex-direction: column;
          }
          .msc-sheet-grid {
            grid-template-columns: 1fr;
          }
        }
      `})]})}export{bt as default};
