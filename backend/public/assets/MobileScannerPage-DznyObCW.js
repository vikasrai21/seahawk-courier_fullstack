import{j as e}from"./page-landing-x1OW-op4.js";import{r as t}from"./vendor-helmet-BlaZzcmj.js";import{l as G}from"./index-1ZccwC_b.js";import{B as H}from"./BrowserQRCodeReader-CDf4JARu.js";import{e as X}from"./vendor-react-6lSemIyR.js";import{b0 as _,Z as E,b as D,b4 as J,b6 as K,X as L,ab as B,aN as Q}from"./vendor-icons-BxNkTp-a.js";import"./page-import-D45f1TVW.js";import"./page-reconcile-BB9wjdTI.js";import"./page-rate-calc-Cb2iAzY3.js";function Y(){return window.location.origin}const y=(l=880,d=.08)=>{try{const a=new(window.AudioContext||window.webkitAudioContext),m=a.createOscillator(),u=a.createGain();m.type="sine",m.frequency.setValueAtTime(l,a.currentTime),u.gain.setValueAtTime(.15,a.currentTime),u.gain.exponentialRampToValueAtTime(.01,a.currentTime+d),m.connect(u),u.connect(a.destination),m.start(),m.stop(a.currentTime+d)}catch{}},N=(l=[50])=>{var d;try{(d=navigator.vibrate)==null||d.call(navigator,l)}catch{}};function de(){const{pin:l}=X(),[d,a]=t.useState(l||""),[m,u]=t.useState(l||""),[p,i]=t.useState("idle"),[g,o]=t.useState(""),[ee,U]=t.useState(""),[R,T]=t.useState(0),[P,V]=t.useState(""),[x,W]=t.useState(null),[F,b]=t.useState(null),[j,I]=t.useState(!1),f=t.useRef(null),k=t.useRef(null),S=t.useRef(null),w=t.useRef(!1),C=t.useRef(""),z=t.useRef(0),M=t.useCallback(s=>{const n=String(s||"").trim();if(n.length!==6){o("Please enter a valid 6-digit PIN"),i("error");return}a(n),i("connecting"),o("");const r=G(Y(),{auth:{scannerPin:n},withCredentials:!0,reconnection:!0,reconnectionAttempts:5,reconnectionDelay:2e3});f.current=r,r.on("connect",()=>{}),r.on("scanner:paired",({message:c,userEmail:v})=>{i("paired"),U(v||"Desktop"),o(""),N([100,50,100]),y(1200,.1)}),r.on("scanner:scan-feedback",c=>{W(c),c.status==="success"?(b("success"),N([30]),y(1400,.06)):(b("error"),N([100,50,100]),y(200,.2)),setTimeout(()=>b(null),600)}),r.on("scanner:session-ended",({reason:c})=>{i("ended"),o(c||"Session ended"),h()}),r.on("scanner:error",({message:c})=>{i("error"),o(c)}),r.on("disconnect",()=>{p!=="ended"&&(i("error"),o("Connection lost. Trying to reconnect..."))}),r.on("reconnect",()=>{i("paired"),o("")}),r.on("connect_error",()=>{i("error"),o("Could not connect to server. Check your network.")})},[]);t.useEffect(()=>(l&&l.length===6&&M(l),()=>{var s;(s=f.current)==null||s.disconnect(),h()}),[]);const h=async()=>{var s;try{await((s=S.current)==null?void 0:s.reset())}catch{}S.current=null,w.current=!1,C.current="",z.current=0,I(!1)},O=()=>{const s=k.current;if(!s||!s.videoWidth)return null;try{const n=document.createElement("canvas");n.width=Math.min(800,s.videoWidth),n.height=Math.round(n.width/s.videoWidth*s.videoHeight);const r=n.getContext("2d");return r?(r.drawImage(s,0,0,n.width,n.height),n.toDataURL("image/jpeg",.5).split(",")[1]||null):null}catch{return null}},$=async()=>{if(!(!f.current||p!=="paired"))try{await h();const s=new H;S.current=s,I(!0),await s.decodeFromVideoDevice(void 0,k.current,async(n,r)=>{var A;if(!n)return;const c=String(n.getText()||"").trim(),v=Date.now();if(!c||w.current||v<z.current&&c===C.current)return;w.current=!0,z.current=v+2e3,C.current=c,b("success"),N([50]),y(880,.06),setTimeout(()=>b(null),400),T(q=>q+1),V(c);const Z=O();(A=f.current)==null||A.emit("scanner:scan",{awb:c,imageBase64:Z}),w.current=!1})}catch(s){o(s.message||"Camera failed"),await h()}};return t.useEffect(()=>{if(p!=="paired")return;const s=setInterval(()=>{var n;(n=f.current)==null||n.emit("scanner:heartbeat")},5e3);return()=>clearInterval(s)},[p]),p==="idle"||p==="error"&&!d?e.jsx("div",{className:"msc-root",children:e.jsxs("div",{className:"msc-container",children:[e.jsx("div",{className:"msc-logo-ring",children:e.jsx(_,{size:36})}),e.jsx("h1",{className:"msc-title",children:"Seahawk Remote Scanner"}),e.jsx("p",{className:"msc-subtitle",children:"Enter the 6-digit PIN shown on your desktop"}),e.jsxs("div",{className:"msc-pin-group",children:[e.jsx("input",{className:"msc-pin-input",type:"tel",inputMode:"numeric",pattern:"[0-9]*",maxLength:6,placeholder:"● ● ● ● ● ●",value:m,onChange:s=>u(s.target.value.replace(/\D/g,"").slice(0,6)),autoFocus:!0}),e.jsxs("button",{className:"msc-connect-btn",disabled:m.length!==6,onClick:()=>M(m),children:[e.jsx(E,{size:18})," Connect"]})]}),g&&e.jsxs("div",{className:"msc-error",children:[e.jsx(D,{size:14})," ",g]}),e.jsxs("p",{className:"msc-hint",children:["Open ",e.jsx("strong",{children:"Rapid Terminal"})," on your desktop and click ",e.jsx("strong",{children:'"Connect Mobile"'})," to get the PIN."]})]})}):p==="connecting"?e.jsx("div",{className:"msc-root",children:e.jsxs("div",{className:"msc-container",children:[e.jsx("div",{className:"msc-logo-ring msc-pulse",children:e.jsx(J,{size:36})}),e.jsx("h1",{className:"msc-title",children:"Connecting..."}),e.jsxs("p",{className:"msc-subtitle",children:["Pairing with desktop via PIN ",d]})]})}):p==="ended"?e.jsx("div",{className:"msc-root",children:e.jsxs("div",{className:"msc-container",children:[e.jsx("div",{className:"msc-logo-ring msc-ended",children:e.jsx(K,{size:36})}),e.jsx("h1",{className:"msc-title",children:"Session Ended"}),e.jsx("p",{className:"msc-subtitle",children:g||"The scanning session has been closed."}),e.jsxs("p",{className:"msc-stat",children:["Total scans: ",e.jsx("strong",{children:R})]}),e.jsx("button",{className:"msc-connect-btn",onClick:()=>{i("idle"),a(""),u(""),o(""),T(0)},children:"Start New Session"})]})}):e.jsxs("div",{className:`msc-root ${F==="success"?"msc-flash-success":F==="error"?"msc-flash-error":""}`,children:[e.jsxs("div",{className:"msc-status-bar",children:[e.jsxs("div",{className:"msc-status-left",children:[e.jsx("div",{className:"msc-dot msc-dot-live"}),e.jsx("span",{children:"LIVE"}),e.jsxs("span",{className:"msc-status-pin",children:["PIN ",d]})]}),e.jsxs("div",{className:"msc-status-right",children:[e.jsxs("span",{className:"msc-scan-count",children:[R," scans"]}),e.jsx("button",{className:"msc-end-btn",onClick:()=>{var s;(s=f.current)==null||s.disconnect(),h(),i("ended")},children:e.jsx(L,{size:16})})]})]}),e.jsx("div",{className:"msc-camera-wrap",children:j?e.jsxs(e.Fragment,{children:[e.jsx("video",{ref:k,className:"msc-video",muted:!0,playsInline:!0,autoPlay:!0}),e.jsx("div",{className:"msc-scan-overlay",children:e.jsxs("div",{className:"msc-scan-frame",children:[e.jsx("div",{className:"msc-corner msc-tl"}),e.jsx("div",{className:"msc-corner msc-tr"}),e.jsx("div",{className:"msc-corner msc-bl"}),e.jsx("div",{className:"msc-corner msc-br"}),e.jsx("div",{className:"msc-scan-line"})]})})]}):e.jsxs("div",{className:"msc-camera-placeholder",children:[e.jsx(B,{size:48,className:"msc-placeholder-icon"}),e.jsx("p",{children:"Tap below to start scanning"})]})}),P&&e.jsxs("div",{className:"msc-last-scan",children:[e.jsxs("div",{className:"msc-last-awb",children:[e.jsx(Q,{size:16,className:"msc-check"}),e.jsx("span",{className:"msc-awb-text",children:P})]}),(x==null?void 0:x.clientCode)&&e.jsxs("div",{className:"msc-client-badge",children:[e.jsx(E,{size:12})," ",x.clientCode,x.clientName?` · ${x.clientName}`:""]})]}),g&&p==="error"&&e.jsxs("div",{className:"msc-error msc-error-banner",children:[e.jsx(D,{size:14})," ",g]}),e.jsx("div",{className:"msc-controls",children:e.jsx("button",{className:`msc-cam-btn ${j?"msc-cam-active":""}`,onClick:j?h:$,children:j?e.jsxs(e.Fragment,{children:[e.jsx(L,{size:22})," Stop Camera"]}):e.jsxs(e.Fragment,{children:[e.jsx(B,{size:22})," Start Scanning"]})})}),e.jsx("style",{children:`
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
          padding: 0.6rem 1rem;
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
        }
        .msc-video {
          width: 100%; height: 100%;
          object-fit: cover;
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
          display: flex; align-items: center; justify-content: center;
          pointer-events: none;
        }
        .msc-scan-frame {
          width: 80%; max-width: 300px;
          aspect-ratio: 2.5 / 1;
          position: relative;
          box-shadow: 0 0 0 9999px rgba(0,0,0,0.45);
          border-radius: 16px;
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
          padding: 0.75rem 1rem;
          background: #0f172a;
          border-top: 1px solid #1e293b;
          display: flex; align-items: center; justify-content: space-between;
          gap: 0.5rem;
          z-index: 20;
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

        /* ── Controls ───────────────────────────────────────────── */
        .msc-controls {
          padding: 1rem;
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
          background: #0f172a;
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
      `})]})}export{de as default};
