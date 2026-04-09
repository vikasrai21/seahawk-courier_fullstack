import{j as e}from"./page-landing-BAx51FWo.js";import{r}from"./vendor-helmet-Dwc3L0SQ.js";import{l as X}from"./index-BkH8mL41.js";import{B as F}from"./BrowserQRCodeReader-CDf4JARu.js";import{e as J}from"./vendor-react-B5FFh0eD.js";import{b1 as K,Z as W,b as B,b4 as Q,b6 as Y,X as U,bi as ee,bj as se,ab as V,aN as te}from"./vendor-icons-DcdZdILd.js";import"./page-import-CtWT_iQL.js";import"./page-reconcile-Cn6VRQFr.js";import"./page-rate-calc-DAygmaFE.js";function re(){return window.location.origin}const N=(d=880,m=.08)=>{try{const c=new(window.AudioContext||window.webkitAudioContext),p=c.createOscillator(),f=c.createGain();p.type="sine",p.frequency.setValueAtTime(d,c.currentTime),f.gain.setValueAtTime(.15,c.currentTime),f.gain.exponentialRampToValueAtTime(.01,c.currentTime+m),p.connect(f),f.connect(c.destination),p.start(),p.stop(c.currentTime+m)}catch{}},k=(d=[50])=>{var m;try{(m=navigator.vibrate)==null||m.call(navigator,d)}catch{}};function fe(){const{pin:d}=J(),[m,c]=r.useState(d||""),[p,f]=r.useState(d||""),[u,o]=r.useState("idle"),[h,l]=r.useState(""),[ne,_]=r.useState(""),[P,T]=r.useState(0),[A,$]=r.useState(""),[s,O]=r.useState(null),[I,b]=r.useState(null),[v,M]=r.useState(!1),[D,z]=r.useState(!1),g=r.useRef(null),w=r.useRef(null),C=r.useRef(null),j=r.useRef(!1),S=r.useRef(""),R=r.useRef(0),E=r.useCallback(t=>{const n=String(t||"").trim();if(n.length!==6){l("Please enter a valid 6-digit PIN"),o("error");return}c(n),o("connecting"),l("");const a=X(re(),{auth:{scannerPin:n},withCredentials:!0,reconnection:!0,reconnectionAttempts:5,reconnectionDelay:2e3});g.current=a,a.on("connect",()=>{}),a.on("scanner:paired",({message:i,userEmail:y})=>{o("paired"),_(y||"Desktop"),l(""),k([100,50,100]),N(1200,.1)}),a.on("scanner:scan-feedback",i=>{O(i),i.status==="success"?(b("success"),k([30]),N(1400,.06)):(b("error"),k([100,50,100]),N(200,.2)),setTimeout(()=>b(null),600)}),a.on("scanner:session-ended",({reason:i})=>{o("ended"),l(i||"Session ended"),x()}),a.on("scanner:error",({message:i})=>{o("error"),l(i)}),a.on("disconnect",()=>{u!=="ended"&&(o("error"),l("Connection lost. Trying to reconnect..."))}),a.on("reconnect",()=>{o("paired"),l("")}),a.on("connect_error",()=>{o("error"),l("Could not connect to server. Check your network.")})},[]);r.useEffect(()=>(d&&d.length===6&&E(d),()=>{var t;(t=g.current)==null||t.disconnect(),x()}),[]);const x=async()=>{var t;try{await((t=C.current)==null?void 0:t.reset())}catch{}C.current=null,j.current=!1,S.current="",R.current=0,M(!1),z(!1)},Z=()=>{const t=w.current;if(!t||!t.videoWidth)return null;try{const n=document.createElement("canvas");n.width=Math.min(800,t.videoWidth),n.height=Math.round(n.width/t.videoWidth*t.videoHeight);const a=n.getContext("2d");return a?(a.drawImage(t,0,0,n.width,n.height),n.toDataURL("image/jpeg",.5).split(",")[1]||null):null}catch{return null}},q=async()=>{if(!(!g.current||u!=="paired"))try{await x();const t=new F;C.current=t,M(!0),z(!1),w.current&&(w.current.onloadedmetadata=()=>z(!0)),await t.decodeFromConstraints({video:{facingMode:{ideal:"environment"},width:{ideal:1920},height:{ideal:1080}}},w.current,async(n,a)=>{var L;if(!n)return;const i=String(n.getText()||"").trim(),y=Date.now();if(!i||j.current||y<R.current&&i===S.current)return;j.current=!0,R.current=y+2e3,S.current=i,b("success"),k([50]),N(880,.06),setTimeout(()=>b(null),400),T(H=>H+1),$(i);const G=Z();(L=g.current)==null||L.emit("scanner:scan",{awb:i,imageBase64:G}),j.current=!1})}catch(t){l(t.message||"Camera failed"),await x()}};return r.useEffect(()=>{if(u!=="paired")return;const t=setInterval(()=>{var n;(n=g.current)==null||n.emit("scanner:heartbeat")},5e3);return()=>clearInterval(t)},[u]),u==="idle"||u==="error"&&!m?e.jsx("div",{className:"msc-root",children:e.jsxs("div",{className:"msc-container",children:[e.jsx("div",{className:"msc-logo-ring",children:e.jsx(K,{size:36})}),e.jsx("h1",{className:"msc-title",children:"Seahawk Remote Scanner"}),e.jsx("p",{className:"msc-subtitle",children:"Enter the 6-digit PIN shown on your desktop"}),e.jsxs("div",{className:"msc-pin-group",children:[e.jsx("input",{className:"msc-pin-input",type:"tel",inputMode:"numeric",pattern:"[0-9]*",maxLength:6,placeholder:"● ● ● ● ● ●",value:p,onChange:t=>f(t.target.value.replace(/\D/g,"").slice(0,6)),autoFocus:!0}),e.jsxs("button",{className:"msc-connect-btn",disabled:p.length!==6,onClick:()=>E(p),children:[e.jsx(W,{size:18})," Connect"]})]}),h&&e.jsxs("div",{className:"msc-error",children:[e.jsx(B,{size:14})," ",h]}),e.jsxs("p",{className:"msc-hint",children:["Open ",e.jsx("strong",{children:"Rapid Terminal"})," on your desktop and click ",e.jsx("strong",{children:'"Connect Mobile"'})," to get the PIN."]})]})}):u==="connecting"?e.jsx("div",{className:"msc-root",children:e.jsxs("div",{className:"msc-container",children:[e.jsx("div",{className:"msc-logo-ring msc-pulse",children:e.jsx(Q,{size:36})}),e.jsx("h1",{className:"msc-title",children:"Connecting..."}),e.jsxs("p",{className:"msc-subtitle",children:["Pairing with desktop via PIN ",m]})]})}):u==="ended"?e.jsx("div",{className:"msc-root",children:e.jsxs("div",{className:"msc-container",children:[e.jsx("div",{className:"msc-logo-ring msc-ended",children:e.jsx(Y,{size:36})}),e.jsx("h1",{className:"msc-title",children:"Session Ended"}),e.jsx("p",{className:"msc-subtitle",children:h||"The scanning session has been closed."}),e.jsxs("p",{className:"msc-stat",children:["Total scans: ",e.jsx("strong",{children:P})]}),e.jsx("button",{className:"msc-connect-btn",onClick:()=>{o("idle"),c(""),f(""),l(""),T(0)},children:"Start New Session"})]})}):e.jsxs("div",{className:`msc-root ${I==="success"?"msc-flash-success":I==="error"?"msc-flash-error":""}`,children:[e.jsxs("div",{className:"msc-status-bar",children:[e.jsxs("div",{className:"msc-status-left",children:[e.jsx("div",{className:"msc-dot msc-dot-live"}),e.jsx("span",{children:"LIVE"}),e.jsxs("span",{className:"msc-status-pin",children:["PIN ",m]})]}),e.jsxs("div",{className:"msc-status-right",children:[e.jsxs("span",{className:"msc-scan-count",children:[P," scans"]}),e.jsx("button",{className:"msc-end-btn",onClick:()=>{var t;(t=g.current)==null||t.disconnect(),x(),o("ended")},children:e.jsx(U,{size:16})})]})]}),e.jsx("div",{className:"msc-camera-wrap",children:v?e.jsxs(e.Fragment,{children:[e.jsx("video",{ref:w,className:"msc-video",muted:!0,playsInline:!0,autoPlay:!0,disablePictureInPicture:!0}),e.jsxs("div",{className:"msc-scan-overlay",children:[e.jsxs("div",{className:"msc-overlay-head",children:[e.jsxs("div",{className:"msc-overlay-chip",children:[e.jsx(ee,{size:14}),"Rear camera live"]}),e.jsxs("div",{className:`msc-overlay-chip ${D?"ready":""}`,children:[e.jsx(se,{size:14}),D?"Aim at AWB barcode":"Waking camera"]})]}),e.jsxs("div",{className:"msc-scan-frame",children:[e.jsx("div",{className:"msc-corner msc-tl"}),e.jsx("div",{className:"msc-corner msc-tr"}),e.jsx("div",{className:"msc-corner msc-bl"}),e.jsx("div",{className:"msc-corner msc-br"}),e.jsx("div",{className:"msc-scan-line"})]}),e.jsx("div",{className:"msc-overlay-tip",children:"Fill this box with the barcode first. Desktop review will then confirm client, consignee, destination, and weight."})]})]}):e.jsxs("div",{className:"msc-camera-placeholder",children:[e.jsx(V,{size:48,className:"msc-placeholder-icon"}),e.jsx("p",{children:"Tap below to start scanning"})]})}),A&&e.jsxs("div",{className:"msc-last-scan",children:[e.jsxs("div",{className:"msc-last-awb-wrap",children:[e.jsxs("div",{className:"msc-last-awb",children:[e.jsx(te,{size:16,className:"msc-check"}),e.jsx("span",{className:"msc-awb-text",children:A})]}),(s==null?void 0:s.status)&&e.jsx("div",{className:`msc-feedback-pill ${s.status}`,children:s.status==="pending_review"?"Pending desktop review":s.status==="success"?"Verified":s.status==="review_deferred"?"Deferred":"Needs attention"})]}),((s==null?void 0:s.clientCode)||(s==null?void 0:s.consignee)||(s==null?void 0:s.destination)||(s==null?void 0:s.weight))&&e.jsxs("div",{className:"msc-feedback-card",children:[(s==null?void 0:s.clientCode)&&e.jsxs("div",{className:"msc-client-badge",children:[e.jsx(W,{size:12})," ",s.clientCode,s.clientName?` · ${s.clientName}`:""]}),e.jsxs("div",{className:"msc-feedback-details",children:[s!=null&&s.consignee?e.jsxs("div",{children:[e.jsx("span",{children:"Consignee"}),e.jsx("strong",{children:s.consignee})]}):null,s!=null&&s.destination?e.jsxs("div",{children:[e.jsx("span",{children:"Destination"}),e.jsx("strong",{children:s.destination})]}):null,s!=null&&s.weight?e.jsxs("div",{children:[e.jsx("span",{children:"Weight"}),e.jsxs("strong",{children:[s.weight," kg"]})]}):null]})]})]}),h&&u==="error"&&e.jsxs("div",{className:"msc-error msc-error-banner",children:[e.jsx(B,{size:14})," ",h]}),e.jsx("div",{className:"msc-controls",children:e.jsx("button",{className:`msc-cam-btn ${v?"msc-cam-active":""}`,onClick:v?x:q,children:v?e.jsxs(e.Fragment,{children:[e.jsx(U,{size:22})," Stop Camera"]}):e.jsxs(e.Fragment,{children:[e.jsx(V,{size:22})," Start Scanning"]})})}),e.jsx("style",{children:`
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
        }
        .msc-video {
          width: 100%; height: 100%;
          object-fit: cover;
          display: block;
          background: #020617;
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
          box-shadow: 0 0 0 9999px rgba(2,6,23,0.22);
          border-radius: 20px;
          margin: auto 0;
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
        .msc-cam-btn:active { transform: scale(0.97); }
        .msc-cam-active {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          box-shadow: 0 4px 20px rgba(239,68,68,0.3);
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
        }
      `})]})}export{fe as default};
