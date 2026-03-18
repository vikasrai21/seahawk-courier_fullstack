/* =========================================================
   hero-illustration.js — Animated Logistics SVG
   Builds the right-side hero visual dynamically
   ========================================================= */

function buildHeroIllustration() {
  const container = document.getElementById('heroIllustration');
  if (!container) return;

  container.innerHTML = `
  <svg viewBox="0 0 520 480" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">
    <defs>
      <!-- Gradients -->
      <linearGradient id="cardGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#1a3d6e;stop-opacity:1"/>
        <stop offset="100%" style="stop-color:#0f2847;stop-opacity:1"/>
      </linearGradient>
      <linearGradient id="cardGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#e8580a;stop-opacity:1"/>
        <stop offset="100%" style="stop-color:#c04000;stop-opacity:1"/>
      </linearGradient>
      <linearGradient id="planeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1"/>
        <stop offset="100%" style="stop-color:#c8dcf0;stop-opacity:1"/>
      </linearGradient>
      <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#e8580a;stop-opacity:0"/>
        <stop offset="50%" style="stop-color:#e8580a;stop-opacity:1"/>
        <stop offset="100%" style="stop-color:#e8580a;stop-opacity:0"/>
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      </filter>
      <filter id="softglow">
        <feGaussianBlur stdDeviation="6" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      </filter>
    </defs>

    <!-- ── BACKGROUND SUBTLE RINGS ── -->
    <circle cx="260" cy="240" r="200" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
    <circle cx="260" cy="240" r="160" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    <circle cx="260" cy="240" r="120" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>

    <!-- ── ROUTE LINES (dashed animated) ── -->
    <!-- Route 1: Delhi to Dubai -->
    <path id="route1" d="M 180 290 Q 230 200 320 210 Q 360 215 390 180" 
      fill="none" stroke="rgba(232,88,10,0.35)" stroke-width="1.5" 
      stroke-dasharray="6 4" style="animation:dashAnim 3s linear infinite"/>
    <!-- Route 2: Delhi to London -->
    <path id="route2" d="M 180 290 Q 160 220 120 160 Q 100 140 85 120"
      fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.2"
      stroke-dasharray="5 4" style="animation:dashAnim 4s linear infinite reverse"/>
    <!-- Route 3: Mumbai to Singapore -->
    <path id="route3" d="M 200 330 Q 280 300 360 320 Q 410 330 435 320"
      fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"
      stroke-dasharray="4 5" style="animation:dashAnim 5s linear infinite"/>
    <!-- Route 4: Delhi to USA -->
    <path id="route4" d="M 180 290 Q 200 180 240 120 Q 260 90 290 60"
      fill="none" stroke="rgba(59,158,224,0.25)" stroke-width="1"
      stroke-dasharray="4 6" style="animation:dashAnim 6s linear infinite"/>

    <!-- ── MAIN GLOBE ── -->
    <circle cx="260" cy="240" r="90" fill="#112b50" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
    <!-- Latitude lines -->
    <ellipse cx="260" cy="240" rx="90" ry="22" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width=".8"/>
    <ellipse cx="260" cy="240" rx="90" ry="55" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width=".8"/>
    <ellipse cx="260" cy="240" rx="80" ry="75" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width=".8"/>
    <!-- Longitude lines -->
    <ellipse cx="260" cy="240" rx="22" ry="90" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width=".8"/>
    <ellipse cx="260" cy="240" rx="55" ry="90" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width=".8"/>
    <!-- Globe outline -->
    <circle cx="260" cy="240" r="90" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
    <!-- Globe highlight -->
    <circle cx="230" cy="210" r="25" fill="rgba(255,255,255,0.04)"/>

    <!-- Land masses (India region) -->
    <path d="M 255 220 L 265 215 L 275 220 L 278 235 L 270 250 L 260 255 L 252 248 L 248 235 Z"
      fill="rgba(232,88,10,0.6)" stroke="rgba(232,88,10,0.8)" stroke-width="0.5"/>
    <!-- SE Asia -->
    <path d="M 295 225 L 308 220 L 315 228 L 310 238 L 300 240 Z"
      fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>
    <!-- Middle East -->
    <path d="M 230 215 L 245 210 L 248 220 L 240 228 L 228 225 Z"
      fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.18)" stroke-width="0.5"/>
    <!-- Europe -->
    <path d="M 210 200 L 228 195 L 232 205 L 222 212 L 210 210 Z"
      fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.15)" stroke-width="0.5"/>

    <!-- ── DELHI HUB (centre) ── -->
    <circle cx="260" cy="243" r="8" fill="rgba(232,88,10,0.2)" stroke="none">
      <animate attributeName="r" values="8;18;8" dur="2.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.8;0;0.8" dur="2.5s" repeatCount="indefinite"/>
    </circle>
    <circle cx="260" cy="243" r="5" fill="rgba(232,88,10,0.4)" stroke="none">
      <animate attributeName="r" values="5;14;5" dur="2.5s" begin="0.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.6;0;0.6" dur="2.5s" begin="0.5s" repeatCount="indefinite"/>
    </circle>
    <circle cx="260" cy="243" r="5" fill="#e8580a" filter="url(#glow)"/>
    <circle cx="260" cy="243" r="3" fill="#ff8c45"/>

    <!-- ── DESTINATION NODES ── -->
    <!-- Dubai -->
    <circle cx="230" cy="220" r="4" fill="rgba(255,255,255,0.1)">
      <animate attributeName="r" values="4;9;4" dur="3s" begin="0.8s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" begin="0.8s" repeatCount="indefinite"/>
    </circle>
    <circle cx="230" cy="220" r="3.5" fill="#ff9a5c" filter="url(#glow)"/>
    <!-- Singapore -->
    <circle cx="300" cy="230" r="3" fill="#4ade80" filter="url(#glow)"/>
    <circle cx="300" cy="230" r="2" fill="#22c55e"/>
    <!-- London -->
    <circle cx="212" cy="208" r="3" fill="#60a5fa" filter="url(#glow)"/>
    <!-- New York -->
    <circle cx="215" cy="225" r="3" fill="#a78bfa"/>

    <!-- ── PLANE 1 (flying along route 1) ── -->
    <g style="animation:flyPlane1 8s ease-in-out infinite">
      <path d="M 0,-5 L 10,0 L 0,5 L 2,0 Z" fill="white" transform="translate(290,192) rotate(-30)"/>
      <line x1="290" y1="192" x2="270" y2="200" stroke="rgba(255,255,255,0.3)" stroke-width="0.8" stroke-dasharray="3 2"/>
    </g>

    <!-- ── PLANE 2 (small, going up-left) ── -->
    <g style="animation:flyPlane2 11s ease-in-out infinite 2s">
      <path d="M 0,-4 L 8,0 L 0,4 L 1.5,0 Z" fill="rgba(255,200,100,0.9)" transform="translate(150,190) rotate(-45)"/>
    </g>

    <!-- ══════════════════════════════
         TOP STAT CARD — Shipments Today
    ══════════════════════════════ -->
    <g style="animation:floatCard1 4s ease-in-out infinite">
      <rect x="10" y="20" width="170" height="82" rx="12" fill="url(#cardGrad1)" stroke="rgba(255,255,255,0.12)" stroke-width="1.2"/>
      <rect x="10" y="20" width="170" height="4" rx="2" fill="url(#cardGrad2)"/>
      <!-- Icon -->
      <rect x="22" y="35" width="32" height="32" rx="8" fill="rgba(232,88,10,0.25)"/>
      <text x="38" y="57" text-anchor="middle" font-size="16" fill="#ff8c45">📦</text>
      <!-- Text -->
      <text x="63" y="50" font-family="Georgia,serif" font-size="18" font-weight="900" fill="white">247</text>
      <text x="63" y="63" font-family="system-ui" font-size="8" font-weight="700" fill="rgba(255,255,255,0.5)" letter-spacing="1">SHIPMENTS TODAY</text>
      <!-- Trend -->
      <text x="22" y="93" font-family="system-ui" font-size="9" fill="rgba(255,255,255,0.5)">↑ 18% from yesterday</text>
      <circle cx="162" cy="89" r="3" fill="#4ade80"/>
      <circle cx="162" cy="89" r="6" fill="rgba(74,222,128,0.2)">
        <animate attributeName="r" values="3;9;3" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite"/>
      </circle>
    </g>

    <!-- ══════════════════════════════
         MIDDLE DELIVERY STATUS CARD
    ══════════════════════════════ -->
    <g style="animation:floatCard2 4.5s ease-in-out infinite 1s">
      <rect x="340" y="90" width="168" height="110" rx="12" fill="url(#cardGrad1)" stroke="rgba(255,255,255,0.12)" stroke-width="1.2"/>
      <rect x="340" y="90" width="168" height="4" rx="2" fill="rgba(74,222,128,0.8)"/>
      <text x="356" y="114" font-family="system-ui" font-size="8" font-weight="800" fill="rgba(255,255,255,0.45)" letter-spacing="1.5">LIVE DELIVERIES</text>
      <!-- Progress bars -->
      <!-- Delivered -->
      <text x="356" y="132" font-family="system-ui" font-size="9" fill="rgba(255,255,255,0.7)">Delivered</text>
      <rect x="356" y="136" width="120" height="6" rx="3" fill="rgba(255,255,255,0.08)"/>
      <rect x="356" y="136" width="88" height="6" rx="3" fill="#4ade80">
        <animate attributeName="width" values="0;88" dur="2s" fill="freeze"/>
      </rect>
      <text x="492" y="142" font-family="system-ui" font-size="8" font-weight="700" fill="#4ade80">73%</text>
      <!-- In Transit -->
      <text x="356" y="158" font-family="system-ui" font-size="9" fill="rgba(255,255,255,0.7)">In Transit</text>
      <rect x="356" y="162" width="120" height="6" rx="3" fill="rgba(255,255,255,0.08)"/>
      <rect x="356" y="162" width="60" height="6" rx="3" fill="#fbbf24">
        <animate attributeName="width" values="0;60" dur="2.5s" fill="freeze"/>
      </rect>
      <text x="492" y="168" font-family="system-ui" font-size="8" font-weight="700" fill="#fbbf24">18%</text>
      <!-- Pending -->
      <text x="356" y="184" font-family="system-ui" font-size="9" fill="rgba(255,255,255,0.7)">Processing</text>
      <rect x="356" y="188" width="120" height="6" rx="3" fill="rgba(255,255,255,0.08)"/>
      <rect x="356" y="188" width="27" height="6" rx="3" fill="#60a5fa">
        <animate attributeName="width" values="0;27" dur="3s" fill="freeze"/>
      </rect>
      <text x="492" y="194" font-family="system-ui" font-size="8" font-weight="700" fill="#60a5fa">9%</text>
    </g>

    <!-- ══════════════════════════════
         BOTTOM LEFT — AWB CARD
    ══════════════════════════════ -->
    <g style="animation:floatCard3 5s ease-in-out infinite 0.5s">
      <rect x="14" y="340" width="185" height="90" rx="12" fill="rgba(17,43,80,0.95)" stroke="rgba(255,255,255,0.1)" stroke-width="1.2"/>
      <text x="26" y="365" font-family="system-ui" font-size="8" font-weight="800" fill="rgba(255,255,255,0.4)" letter-spacing="1.5">LAST AWB SCANNED</text>
      <text x="26" y="385" font-family="'Courier New',monospace" font-size="13" font-weight="700" fill="white">SHK-2025-4821</text>
      <!-- Status badge -->
      <rect x="26" y="395" width="72" height="18" rx="9" fill="rgba(74,222,128,0.15)" stroke="rgba(74,222,128,0.4)" stroke-width="1"/>
      <circle cx="36" cy="404" r="3" fill="#4ade80"/>
      <text x="43" y="408" font-family="system-ui" font-size="8" font-weight="700" fill="#4ade80">Delivered</text>
      <!-- Location -->
      <text x="112" y="408" font-family="system-ui" font-size="8" fill="rgba(255,255,255,0.4)">Dubai, UAE</text>
    </g>

    <!-- ══════════════════════════════
         BOTTOM RIGHT — SPEED CARD  
    ══════════════════════════════ -->
    <g style="animation:floatCard2 3.8s ease-in-out infinite 1.8s">
      <rect x="330" y="360" width="175" height="80" rx="12" fill="url(#cardGrad2)" stroke="rgba(255,255,255,0.15)" stroke-width="1.2"/>
      <text x="345" y="385" font-family="system-ui" font-size="8" font-weight="800" fill="rgba(255,255,255,0.65)" letter-spacing="1.5">ON-TIME DELIVERY</text>
      <text x="345" y="412" font-family="Georgia,serif" font-size="28" font-weight="900" fill="white">99%</text>
      <text x="408" y="412" font-family="system-ui" font-size="9" fill="rgba(255,255,255,0.65)">This month</text>
      <text x="345" y="428" font-family="system-ui" font-size="8" fill="rgba(255,255,255,0.5)">↑ 2.1% vs last month</text>
    </g>

    <!-- ── STYLE for SVG animations ── -->
    <style>
      @keyframes dashAnim { to { stroke-dashoffset: -40 } }
      @keyframes flyPlane1 {
        0%   { transform: translate(0,0) rotate(0deg); opacity:1 }
        30%  { transform: translate(-60px, -28px) rotate(-5deg); opacity:1 }
        60%  { transform: translate(-110px, -50px) rotate(3deg); opacity:.6 }
        80%  { transform: translate(-130px, -60px) rotate(0deg); opacity:0 }
        100% { transform: translate(0,0) rotate(0deg); opacity:1 }
      }
      @keyframes flyPlane2 {
        0%   { transform: translate(0,0); opacity:0 }
        10%  { opacity:1 }
        70%  { transform: translate(-70px,-70px); opacity:.8 }
        90%  { transform: translate(-90px,-90px); opacity:0 }
        100% { transform: translate(0,0); opacity:0 }
      }
      @keyframes floatCard1 {
        0%,100% { transform: translateY(0px) }
        50%     { transform: translateY(-8px) }
      }
      @keyframes floatCard2 {
        0%,100% { transform: translateY(-5px) }
        50%     { transform: translateY(5px) }
      }
      @keyframes floatCard3 {
        0%,100% { transform: translateY(-3px) }
        50%     { transform: translateY(6px) }
      }
    </style>
  </svg>`;
}

// Run on DOM ready
document.addEventListener('DOMContentLoaded', buildHeroIllustration);
