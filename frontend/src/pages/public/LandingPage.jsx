// src/pages/public/LandingPage.jsx
// Uses the original Sea Hawk website HTML/CSS/JS exactly as-is
// CSS and JS are loaded dynamically so they don't affect the dashboard
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const scriptsRef = useRef([]);

  useEffect(() => {
    // Add original CSS (scoped to this page only — removed on unmount)
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = '/website/css/style.css';
    link.id   = 'seahawk-website-css';
    document.head.appendChild(link);

    // Override goToTrack to use React router instead of track.html
    window.goToTrack = () => {
      const awb = document.getElementById('awb-input')?.value?.trim();
      if (!awb) { document.getElementById('awb-input')?.focus(); return; }
      navigate(`/track/${encodeURIComponent(awb.toUpperCase())}`);
    };

    // Load JS files in correct order (they depend on each other)
    const jsFiles = [
      '/website/js/main.js',
      '/website/js/calculator.js',
      '/website/js/hero.js',
      '/website/js/map.js',
    ];

    let loaded = 0;
    jsFiles.forEach((src, i) => {
      const s = document.createElement('script');
      s.src   = src;
      s.defer = false;
      s.async = false;
      s.id    = `seahawk-js-${i}`;
      document.body.appendChild(s);
      scriptsRef.current.push(s);
    });

    // Cleanup when navigating away (so dashboard CSS isn't affected)
    return () => {
      document.getElementById('seahawk-website-css')?.remove();
      scriptsRef.current.forEach(s => s.remove());
      scriptsRef.current = [];
    };
  }, []);

  const html = `
<!-- WA FLOAT -->
<a href="https://wa.me/919911565523" class="wa-float" target="_blank" title="WhatsApp">💬</a>

<!-- Sticky mobile CTA bar -->
<div class="sticky-book-bar">
  <a href="tel:+919911565523" class="btn btn-white" style="color:var(--orange);font-weight:800;">📦 Book Pickup</a>
  <a href="/track" class="btn btn-ghost-w" style="font-weight:700;">🔍 Track</a>
</div>

<!-- MOBILE MENU -->
<div class="mob-menu" id="mobMenu">
  <div class="mob-head">
    <img src="/images/logo.png" alt="Sea Hawk Courier"/>
    <button class="mob-close" onclick="mobClose()">✕</button>
  </div>
  <ul class="mob-links">
    <li><a href="/" onclick="mobClose()">Home</a></li>
    <li><a href="#services" onclick="mobClose()">Services</a></li>
    <li><a href="/track" onclick="mobClose()">🔍 Track Shipment</a></li>
    <li><a href="tel:+919911565523" onclick="mobClose()">📦 Book Pickup</a></li>
    <li><a href="#calculator" onclick="mobClose()">Rates</a></li>
    <li><a href="#map-section" onclick="mobClose()">Coverage</a></li>
    <li><a href="#contact-section" onclick="mobClose()">Contact Us</a></li>
  </ul>
  <div class="mob-ctas">
    <a href="tel:+919911565523" class="btn btn-orange" onclick="mobClose()">📦 Book Pickup</a>
    <a href="/login" class="btn btn-navy" onclick="mobClose()">🔐 Portal</a>
    <a href="tel:+919911565523" class="btn btn-outline" onclick="mobClose()">📞 +91 99115 65523</a>
  </div>
</div>

<!-- HEADER -->
<header>
  <div id="topbar">
    <div class="tb-row">
      <span>📍 New Delhi, India</span>
      <div class="tb-sep"></div>
      <span>Mon–Sat: 9 AM – 7 PM &nbsp;|&nbsp; Emergency: 24×7</span>
    </div>
    <div class="tb-row">
      <a href="tel:+919911565523">📞 +91 99115 65523</a>
      <div class="tb-sep"></div>
      <a href="tel:+918368201122">+91 83682 01122</a>
      <div class="tb-sep"></div>
      <a href="https://wa.me/919911565523" target="_blank">💬 WhatsApp</a>
    </div>
  </div>
  <nav class="main-nav">
    <a href="/" class="nav-logo">
      <img src="/images/logo.png" alt="Sea Hawk Courier and Cargo"/>
    </a>
    <ul class="nav-ul">
      <li class="has-drop">
        <a href="#services">Services ▾</a>
        <div class="nav-drop">
          <a href="#services"><span class="di">🚀</span>Express Delivery</a>
          <a href="#services"><span class="di">✈️</span>International Courier</a>
          <a href="#services"><span class="di">📦</span>Surface &amp; LTL Cargo</a>
          <a href="#services"><span class="di">🏢</span>B2B Logistics</a>
          <a href="#services"><span class="di">🛡️</span>Insured Shipping</a>
        </div>
      </li>
      <li><a href="/track" style="font-weight:700;">🔍 Track</a></li>
      <li><a href="tel:+919911565523" style="color:var(--orange);font-weight:700;">📦 Book Pickup</a></li>
      <li><a href="#calculator">Rates</a></li>
      <li><a href="#map-section">Coverage</a></li>
      <li><a href="#contact-section">Contact</a></li>
    </ul>
    <div class="nav-right">
      <a href="/login" class="nav-portal">🔐 Portal</a>
      <a href="tel:+919911565523" class="nav-quote">📦 Book Pickup</a>
    </div>
    <button class="hamburger" onclick="mobOpen()"><span></span><span></span><span></span></button>
  </nav>
</header>

<!-- HERO -->
<section id="hero">
  <div class="hero-grid-bg"></div>
  <div class="hero-glow-1"></div>
  <div class="hero-glow-2"></div>
  <div class="wrap">
    <div class="hero-inner">
      <div class="rev">
        <div class="hero-kicker"><span class="dot"></span>Trusted Since 2004 — 20+ Years Delivering Excellence</div>
        <h1 class="hero-h1">
          India's Most Trusted<br/>
          <em>Courier &amp; Cargo</em><br/>
          <span class="sub-line">Partner</span>
        </h1>
        <p class="hero-p">From same-day Delhi NCR deliveries to international shipments across 220+ countries — we power your logistics with unmatched speed, security and competitive rates.</p>
        <div class="hero-trust">
          <div class="t-chip"><span class="chk">✓</span>35,000+ PIN Codes</div>
          <div class="t-chip"><span class="chk">✓</span>220+ Countries</div>
          <div class="t-chip"><span class="chk">✓</span>24×7 Support</div>
          <div class="t-chip"><span class="chk">✓</span>Real-Time Tracking</div>
        </div>
        <div class="hero-cta">
          <a href="tel:+919911565523" class="btn btn-orange btn-lg">📦 Book Free Pickup</a>
          <a href="/track" class="btn btn-ghost-w btn-lg">🔍 Track Shipment</a>
        </div>
        <div class="hero-mini-stats rev d1">
          <div class="hms"><div class="hms-n"><span class="count" data-t="120000" data-dur="2500">0</span><sup>+</sup></div><div class="hms-l">Shipments Delivered</div></div>
          <div class="hms-sep"></div>
          <div class="hms"><div class="hms-n"><span class="count" data-t="350" data-dur="1800">0</span><sup>+</sup></div><div class="hms-l">Cities Covered</div></div>
          <div class="hms-sep"></div>
          <div class="hms"><div class="hms-n"><span class="count" data-t="220" data-dur="1600">0</span><sup>+</sup></div><div class="hms-l">Countries</div></div>
          <div class="hms-sep"></div>
          <div class="hms"><div class="hms-n"><span class="count" data-t="20" data-dur="1400">0</span><sup>+ Yrs</sup></div><div class="hms-l">Experience</div></div>
        </div>
        <!-- TRACK WIDGET -->
        <div class="track-widget rev d2">
          <div class="tw-tabs">
            <button class="tw-tab on" onclick="switchTab('tw-track',this)">🔍 Track Shipment</button>
            <button class="tw-tab" onclick="switchTab('tw-quote',this)">💰 Quick Quote</button>
            <button class="tw-tab" onclick="switchTab('tw-call',this)">📞 Callback</button>
          </div>
          <div class="tw-panel on" id="tw-track">
            <div class="tw-row">
              <div class="tw-field">
                <label>AWB / Tracking Number</label>
                <input class="tw-input" id="awb-input" placeholder="Enter AWB, Docket or Reference No." onkeydown="if(event.key==='Enter') goToTrack()"/>
              </div>
              <button class="btn-track" onclick="goToTrack()">Track Now</button>
            </div>
          </div>
          <div class="tw-panel" id="tw-quote">
            <div class="tw-row tw-row-3">
              <div class="tw-field"><label>Type</label><select class="tw-select" id="qq-svc"><option value="dom">Domestic</option><option value="intl">International</option><option value="b2b">B2B Bulk</option></select></div>
              <div class="tw-field"><label>Zone</label><select class="tw-select" id="qq-dest"><option value="local">Local/NCR</option><option value="metro">Metro City</option><option value="roi">Rest of India</option><option value="ne">North East</option></select></div>
              <div class="tw-field"><label>Weight (g)</label><input class="tw-input" id="qq-wt" type="number" placeholder="500" min="1"/></div>
              <button class="btn-track" onclick="quickQuote()">Get Rate</button>
            </div>
            <div id="qq-res" style="display:none;margin-top:10px;padding:10px 14px;background:var(--navy-faint);border:1px solid var(--navy-pale);border-radius:var(--r);font-size:.875rem;">
              <strong>Estimated: </strong><span id="qq-val" style="color:var(--orange);font-weight:800;font-size:1.1rem;"></span>
            </div>
          </div>
          <div class="tw-panel" id="tw-call">
            <div class="tw-row">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;flex:1;">
                <div class="tw-field"><label>Your Name</label><input class="tw-input" id="cb-name" placeholder="Full Name"/></div>
                <div class="tw-field"><label>Phone Number</label><input class="tw-input" id="cb-phone" placeholder="+91 XXXXX XXXXX"/></div>
              </div>
              <button class="btn-track" onclick="doCallback()">Request Call</button>
            </div>
            <div id="cb-ok" style="display:none;margin-top:10px;padding:9px 13px;background:var(--green-bg);border-radius:var(--r);font-size:.8rem;color:var(--green);font-weight:600;">✅ We'll call you back within 30 minutes!</div>
          </div>
        </div>
      </div>
      <div class="hero-visual rev d1">
        <div class="hero-illustration" id="heroIllustration"></div>
      </div>
    </div>
  </div>
</section>

<!-- TICKER -->
<div class="ticker">
  <div class="ticker-track">
    <span class="tick-item">🚀 Same Day Express Delivery</span><span class="tick-sep"></span>
    <span class="tick-item">✈️ International Air Courier</span><span class="tick-sep"></span>
    <span class="tick-item">🌍 220+ Countries &amp; Territories</span><span class="tick-sep"></span>
    <span class="tick-item">📦 Bulk &amp; LTL Surface Freight</span><span class="tick-sep"></span>
    <span class="tick-item">🔍 Real-Time Shipment Tracking</span><span class="tick-sep"></span>
    <span class="tick-item">🛡️ Fully Insured Deliveries</span><span class="tick-sep"></span>
    <span class="tick-item">💼 B2B Corporate Logistics</span><span class="tick-sep"></span>
    <span class="tick-item">📋 35,000+ PIN Codes Covered</span><span class="tick-sep"></span>
    <span class="tick-item">🕐 24×7 Customer Support</span><span class="tick-sep"></span>
    <span class="tick-item">🚀 Same Day Express Delivery</span><span class="tick-sep"></span>
    <span class="tick-item">✈️ International Air Courier</span><span class="tick-sep"></span>
    <span class="tick-item">🌍 220+ Countries &amp; Territories</span><span class="tick-sep"></span>
    <span class="tick-item">📦 Bulk &amp; LTL Surface Freight</span><span class="tick-sep"></span>
    <span class="tick-item">🔍 Real-Time Shipment Tracking</span><span class="tick-sep"></span>
    <span class="tick-item">🛡️ Fully Insured Deliveries</span><span class="tick-sep"></span>
  </div>
</div>

<!-- STATS BAND -->
<section id="stats-band">
  <div class="wrap">
    <div class="stats-grid">
      <div class="stat-block rev"><div class="stat-icon-wrap">📦</div><div class="stat-number"><span class="count" data-t="120000" data-dur="2800">0</span><sup>+</sup></div><div class="stat-label">Shipments Delivered</div></div>
      <div class="stat-block rev d1"><div class="stat-icon-wrap">📍</div><div class="stat-number"><span class="count" data-t="35000" data-dur="2500">0</span><sup>+</sup></div><div class="stat-label">PIN Codes Covered</div></div>
      <div class="stat-block rev d2"><div class="stat-icon-wrap">🏙️</div><div class="stat-number"><span class="count" data-t="800" data-dur="2000">0</span><sup>+</sup></div><div class="stat-label">Cities in India</div></div>
      <div class="stat-block rev d3"><div class="stat-icon-wrap">🌍</div><div class="stat-number"><span class="count" data-t="220" data-dur="1800">0</span><sup>+</sup></div><div class="stat-label">Countries Served</div></div>
      <div class="stat-block rev d4"><div class="stat-icon-wrap">🏆</div><div class="stat-number"><span class="count" data-t="20" data-dur="1500">0</span><sup>+ Yrs</sup></div><div class="stat-label">Years of Excellence</div></div>
    </div>
  </div>
</section>

<!-- SERVICES -->
<section id="services" class="sec">
  <div class="wrap">
    <div class="sec-head">
      <div class="pill pill-orange rev">What We Offer</div>
      <h2 class="h-display rev d1">Services <span>Built for Your Business</span></h2>
      <p class="t-lead rev d2" style="margin:0 auto;">From local same-day pickups to air freight across six continents — every shipment backed by 20 years of expertise and India's strongest carrier network.</p>
    </div>
    <div class="svc-grid">
      <div class="svc-card rev"><div class="svc-icon">🚀</div><h3 class="svc-title">Express Delivery</h3><p class="svc-desc">Same-day and next-day delivery to Delhi NCR and all major cities. Fastest transit times with guaranteed POD on every consignment.</p><div class="svc-note">📍 Delhi NCR · Metro Cities · North India</div><a href="#contact-section" class="svc-link">Get quote →</a></div>
      <div class="svc-card rev d1"><div class="svc-icon">✈️</div><h3 class="svc-title">International Courier</h3><p class="svc-desc">Documents and parcels to 220+ countries via DHL, FedEx, Aramex and our own global partner network across 8 international zones.</p><div class="svc-note">🌍 USA · UK · UAE · Australia · 220+ Countries</div><a href="#calculator" class="svc-link">Calculate rate →</a></div>
      <div class="svc-card rev d2"><div class="svc-icon">📦</div><h3 class="svc-title">Surface &amp; LTL Cargo</h3><p class="svc-desc">Cost-effective road freight for heavy consignments. LTL road express connecting 800+ cities pan-India at competitive rates.</p><div class="svc-note">📦 Pan-India · Up to 500 kg per consignment</div><a href="#contact-section" class="svc-link">Contact us →</a></div>
      <div class="svc-card rev"><div class="svc-icon">🏢</div><h3 class="svc-title">B2B Logistics</h3><p class="svc-desc">Custom rate contracts, dedicated account manager, monthly invoicing and full client portal access for enterprise shippers.</p><div class="svc-note">💼 Custom rates · Volume discounts available</div><a href="/login" class="svc-link">Open an account →</a></div>
      <div class="svc-card rev d1"><div class="svc-icon">🛡️</div><h3 class="svc-title">Insured Shipments</h3><p class="svc-desc">Full declared-value insurance for electronics, jewellery, fragile goods and high-value items at just 5% premium.</p><div class="svc-note">🔒 5% premium · Hassle-free claims process</div><a href="#calculator" class="svc-link">Calculate cost →</a></div>
      <div class="svc-card rev d2"><div class="svc-icon">📋</div><h3 class="svc-title">Document Courier</h3><p class="svc-desc">Secure delivery of legal documents, passports, bank documents and diplomatic mail — handled with absolute care and confidentiality.</p><div class="svc-note">🗂️ Domestic · International · Diplomatic Mail</div><a href="#contact-section" class="svc-link">Enquire now →</a></div>
    </div>
    <div style="text-align:center;margin-top:44px;" class="rev">
      <a href="#contact-section" class="btn btn-navy btn-lg">Get in Touch →</a>
    </div>
  </div>
</section>

<!-- RATE CALCULATOR -->
<section id="calculator" class="sec" style="background:var(--bg-2);border-top:1px solid var(--border-l);">
  <div class="wrap">
    <div class="calc-layout">
      <div>
        <div class="pill pill-navy rev">Instant Pricing</div>
        <h2 class="h-display rev d1">Transparent<br/><span>Rate Calculator</span></h2>
        <p class="t-lead rev d2" style="max-width:100%;">Exact costs before you book — fuel surcharge, GST and insurance all shown clearly. No surprises on your invoice.</p>
        <div class="calc-usps">
          <div class="calc-usp rev d1"><div class="calc-usp-icon">⚡</div><div><div class="calc-usp-t">Live Rates from 6 Carriers</div><div class="calc-usp-s">Trackon, DTDC, Delhivery, BlueDart, DHL &amp; FedEx — verified tariffs.</div></div></div>
          <div class="calc-usp rev d2"><div class="calc-usp-icon">🌍</div><div><div class="calc-usp-t">Domestic + 220 Countries</div><div class="calc-usp-s">All Indian zones including NE, J&amp;K, Andaman plus 8-zone international pricing.</div></div></div>
          <div class="calc-usp rev d3"><div class="calc-usp-icon">🔢</div><div><div class="calc-usp-t">All-Inclusive Breakdown</div><div class="calc-usp-s">Fuel surcharge (25%), GST (18%) and optional insurance (5%) all shown transparently.</div></div></div>
        </div>
      </div>
      <div class="calc-card rev d1">
        <div class="calc-head"><h3>Shipping Rate Calculator</h3><small>Rates from Sea Hawk Rate Card v10 · FSC 25% · GST 18%</small></div>
        <div class="calc-body">
          <div class="fg-grid" style="gap:13px;">
            <div class="fg"><label>From Zone</label>
              <select id="c-svc">
                <option value="doc">Document / Packet</option>
                <option value="priority">Priority Express</option>
                <option value="heavy-sfc">Heavy — Surface Cargo</option>
                <option value="heavy-air">Heavy — Air Cargo</option>
                <option value="international">International</option>
              </select>
            </div>
            <div class="fg" id="c-zone-wrap"><label>To Zone</label>
              <select id="c-zone">
                <option value="localNCR">Delhi &amp; NCR</option>
                <option value="northIndia">North India</option>
                <option value="metro">Metro Cities</option>
                <option value="restIndia">Rest of India</option>
                <option value="northEast">North East / Srinagar</option>
                <option value="diplomatic">Diplomatic / Port Blair</option>
              </select>
            </div>
            <div class="fg" id="c-priority-wrap" style="display:none;"><label>To Zone</label>
              <select id="c-priority-zone">
                <option value="localNCR">Local &amp; NCR</option>
                <option value="northIndia">North India</option>
                <option value="restIndia">Rest of India</option>
                <option value="northEast">North East</option>
              </select>
            </div>
            <div class="fg" id="c-heavy-sfc-wrap" style="display:none;"><label>To Zone</label>
              <select id="c-heavy-sfc-zone">
                <option value="localNCR">Delhi &amp; NCR</option>
                <option value="northIndia">North India</option>
                <option value="metro">Metro Cities</option>
                <option value="restIndia">Rest of India</option>
                <option value="northEast">North East</option>
                <option value="kashmir">Kashmir / J&amp;K</option>
                <option value="portBlair">Port Blair / Andaman</option>
              </select>
            </div>
            <div class="fg" id="c-heavy-air-wrap" style="display:none;"><label>To Zone</label>
              <select id="c-heavy-air-zone">
                <option value="srinagar">Srinagar Sector</option>
                <option value="biharJh">Bihar &amp; Jharkhand</option>
                <option value="metro">Metro Cities</option>
                <option value="restIndia">Rest of India</option>
                <option value="northEast">North East</option>
                <option value="portBlair">Port Blair</option>
              </select>
            </div>
            <div class="fg full" id="c-country-wrap" style="display:none;"><label>Destination Country</label>
              <select id="c-country">
                <option value="">-- Select Country --</option>
                <optgroup label="Zone A"><option value="bangladesh">Bangladesh</option><option value="bhutan">Bhutan</option><option value="maldives">Maldives</option><option value="nepal">Nepal</option><option value="sri lanka">Sri Lanka</option><option value="united arab emirates">United Arab Emirates</option></optgroup>
                <optgroup label="Zone B"><option value="bahrain">Bahrain</option><option value="hong kong">Hong Kong</option><option value="kuwait">Kuwait</option><option value="oman">Oman</option><option value="qatar">Qatar</option><option value="saudi arabia">Saudi Arabia</option><option value="singapore">Singapore</option></optgroup>
                <optgroup label="Zone C"><option value="australia">Australia</option><option value="china">China</option><option value="indonesia">Indonesia</option><option value="malaysia">Malaysia</option><option value="new zealand">New Zealand</option><option value="thailand">Thailand</option></optgroup>
                <optgroup label="Zone D"><option value="france">France</option><option value="germany">Germany</option><option value="netherlands">Netherlands</option><option value="united kingdom">United Kingdom</option></optgroup>
                <optgroup label="Zone E"><option value="canada">Canada</option><option value="united states">United States</option></optgroup>
                <optgroup label="Zone F"><option value="japan">Japan</option></optgroup>
                <optgroup label="Zone G"><option value="south africa">South Africa</option><option value="spain">Spain</option><option value="turkey">Turkey</option></optgroup>
                <optgroup label="Zone H"><option value="other">Other Countries (+₹300)</option></optgroup>
              </select>
            </div>
            <div class="fg"><label id="c-weight-lbl">Weight (grams)</label><input type="number" id="c-weight" placeholder="e.g. 500" min="0.001" step="any"/></div>
          </div>
          <div id="zone-info" class="zone-info"></div>
          <div class="fg-checks">
            <label class="fg-check"><input type="checkbox" id="c-ins"/> Insurance (0.2% min ₹50)</label>
          </div>
          <div class="calc-result" id="calcResult">
            <div class="cr-head">Estimated Cost Breakdown</div>
            <div class="cr-body">
              <div class="cr-row"><span>Base Freight</span><span class="cr-val" id="r-base">₹0</span></div>
              <div class="cr-row"><span>Fuel Surcharge (25%)</span><span class="cr-val" id="r-fuel">₹0</span></div>
              <div class="cr-row" id="r-ins-row" style="display:none;"><span>Insurance</span><span class="cr-val" id="r-ins">₹0</span></div>
              <div class="cr-row"><span>GST (18%)</span><span class="cr-val" id="r-gst">₹0</span></div>
              <div class="cr-total"><span class="cr-total-lbl">Total Estimate</span><span class="cr-total-val" id="r-total">₹0</span></div>
              <div class="cr-note">* Indicative. Final based on actual dimensions.</div>
            </div>
          </div>
          <button class="btn-calc" onclick="computeRate()">⚡ Get Rate</button>
          <a href="tel:+919911565523" style="display:block;text-align:center;margin-top:10px;padding:11px;background:var(--navy);color:#fff;border-radius:var(--r);font-size:.875rem;font-weight:700;text-decoration:none;">📦 Book This Pickup →</a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- MAP SECTION -->
<section id="map-section" class="sec" style="background:#fff;border-top:1px solid var(--border-l);">
  <div class="wrap">
    <div class="sec-head" style="margin-bottom:36px;">
      <div class="pill pill-orange rev">Our Reach</div>
      <h2 class="h-display rev d1">Coverage Across <span>India &amp; The World</span></h2>
      <p class="t-lead rev d2" style="margin:0 auto;">Every PIN code in India. 180+ countries worldwide. Real shipments, real routes, every day.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px;" class="rev d1">
      <div style="text-align:center;padding:16px;background:var(--navy-faint);border-radius:var(--r-lg);border:1.5px solid var(--navy-pale);"><div style="font-family:var(--font-head);font-size:1.7rem;font-weight:900;color:var(--navy)"><span class="count" data-t="35000">0</span>+</div><div style="font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:var(--ink-3);">PIN Codes</div></div>
      <div style="text-align:center;padding:16px;background:var(--orange-bg);border-radius:var(--r-lg);border:1.5px solid var(--orange-brd);"><div style="font-family:var(--font-head);font-size:1.7rem;font-weight:900;color:var(--orange)"><span class="count" data-t="800">0</span>+</div><div style="font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:var(--orange);">Indian Cities</div></div>
      <div style="text-align:center;padding:16px;background:var(--navy-faint);border-radius:var(--r-lg);border:1.5px solid var(--navy-pale);"><div style="font-family:var(--font-head);font-size:1.7rem;font-weight:900;color:var(--navy)"><span class="count" data-t="180">0</span>+</div><div style="font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:var(--ink-3);">Countries</div></div>
      <div style="text-align:center;padding:16px;background:var(--green-bg);border-radius:var(--r-lg);border:1.5px solid #a7f3d0;"><div style="font-family:var(--font-head);font-size:1.7rem;font-weight:900;color:var(--green)"><span class="count" data-t="6">0</span></div><div style="font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:var(--green);">Continents</div></div>
    </div>
    <div class="map-canvas-wrap rev d2" style="border-radius:var(--r-xl);overflow:hidden;box-shadow:var(--sh-xl);border:1.5px solid var(--border-l);background:var(--navy);">
      <div class="map-top-bar" style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:rgba(255,255,255,.05);border-bottom:1px solid rgba(255,255,255,.08);">
        <span class="map-title" style="font-size:.75rem;font-weight:800;color:rgba(255,255,255,.75);letter-spacing:1.5px;text-transform:uppercase;">Sea Hawk Global Coverage Map</span>
        <span class="map-live" style="display:flex;align-items:center;gap:5px;font-size:.7rem;color:rgba(255,255,255,.5);"><span style="width:7px;height:7px;border-radius:50%;background:#4ade80;animation:blinkDot 1.2s ease-in-out infinite;"></span>Live</span>
      </div>
      <div id="indiaMapCanvas" style="line-height:0;"></div>
    </div>
  </div>
</section>

<!-- TESTIMONIALS -->
<section id="testimonials" class="sec">
  <div class="wrap">
    <div class="sec-head">
      <div class="pill pill-navy rev">Client Stories</div>
      <h2 class="h-display rev d1">Trusted by <span>Businesses Across India</span></h2>
    </div>
    <div class="testi-grid">
      <div class="testi rev"><div class="testi-stars">★★★★★</div><p class="testi-text">"We've shipped internationally with Sea Hawk for 7 years. Their rates are consistently competitive and service impeccable. Documents reach Dubai in 2 days, every single time."</p><div class="testi-author"><div class="testi-av">RK</div><div><div class="testi-name">Rajan Kapoor</div><div class="testi-role">MD, Kapoor Exports · Delhi</div></div></div></div>
      <div class="testi rev d1"><div class="testi-stars">★★★★★</div><p class="testi-text">"The client portal is outstanding. Real-time tracking, instant invoice downloads and our account manager is always reachable. This is what proper B2B logistics looks like."</p><div class="testi-author"><div class="testi-av" style="background:var(--orange);">AS</div><div><div class="testi-name">Anita Sharma</div><div class="testi-role">Procurement Head, TechGrow India</div></div></div></div>
      <div class="testi rev d2"><div class="testi-stars">★★★★★</div><p class="testi-text">"Switched from a large courier company to Sea Hawk 2 years ago — best decision. Better pricing, personalised service, and they actually pick up the phone when you call."</p><div class="testi-author"><div class="testi-av" style="background:var(--green);">PG</div><div><div class="testi-name">Priya Gupta</div><div class="testi-role">Founder, Crafted Collections · Noida</div></div></div></div>
    </div>
  </div>
</section>

<!-- CTA BAND -->
<section id="cta-band">
  <div class="wrap">
    <div class="cta-inner">
      <h2>Ready to <span>Ship with Sea Hawk?</span></h2>
      <p>Free doorstep pickup. Competitive rates. Real-time tracking. 20+ years of experience.</p>
      <div class="cta-btns">
        <a href="tel:+919911565523" class="btn btn-white btn-lg">📦 Book Free Pickup</a>
        <a href="/track" class="btn btn-ghost-w btn-lg">🔍 Track Shipment</a>
        <a href="/login" class="btn btn-ghost-w btn-lg">🔐 Client Portal</a>
      </div>
      <div class="cta-phones">
        <div class="cta-phone">📞 <a href="tel:+919911565523">+91 99115 65523</a></div>
        <div class="cta-div"></div>
        <div class="cta-phone">📞 <a href="tel:+918368201122">+91 83682 01122</a></div>
        <div class="cta-div"></div>
        <div class="cta-phone">💬 <a href="https://wa.me/919911565523" target="_blank">WhatsApp Us</a></div>
      </div>
    </div>
  </div>
</section>

<!-- CONTACT -->
<section id="contact-section" class="sec" style="background:var(--bg-2);border-top:1px solid var(--border-l);">
  <div class="wrap">
    <div class="sec-head">
      <div class="pill pill-orange rev">Get In Touch</div>
      <h2 class="h-display rev d1">We're Here to <span>Help You Ship</span></h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-top:40px;" class="rev d1">
      <a href="tel:+919911565523" style="background:#fff;border:1.5px solid var(--border-l);border-radius:var(--r-xl);padding:28px 24px;text-align:center;text-decoration:none;color:var(--ink);transition:box-shadow .2s;">
        <div style="font-size:2rem;margin-bottom:12px;">📞</div>
        <div style="font-weight:800;font-size:1rem;margin-bottom:4px;">Call Us</div>
        <div style="color:var(--ink-3);font-size:.85rem;">+91 99115 65523</div>
      </a>
      <a href="https://wa.me/919911565523" target="_blank" style="background:#fff;border:1.5px solid var(--border-l);border-radius:var(--r-xl);padding:28px 24px;text-align:center;text-decoration:none;color:var(--ink);transition:box-shadow .2s;">
        <div style="font-size:2rem;margin-bottom:12px;">💬</div>
        <div style="font-weight:800;font-size:1rem;margin-bottom:4px;">WhatsApp</div>
        <div style="color:var(--ink-3);font-size:.85rem;">+91 99115 65523</div>
      </a>
      <a href="mailto:info@seahawkcourier.com" style="background:#fff;border:1.5px solid var(--border-l);border-radius:var(--r-xl);padding:28px 24px;text-align:center;text-decoration:none;color:var(--ink);transition:box-shadow .2s;">
        <div style="font-size:2rem;margin-bottom:12px;">📧</div>
        <div style="font-weight:800;font-size:1rem;margin-bottom:4px;">Email Us</div>
        <div style="color:var(--ink-3);font-size:.85rem;">info@seahawkcourier.com</div>
      </a>
      <div style="background:#fff;border:1.5px solid var(--border-l);border-radius:var(--r-xl);padding:28px 24px;text-align:center;">
        <div style="font-size:2rem;margin-bottom:12px;">📍</div>
        <div style="font-weight:800;font-size:1rem;margin-bottom:4px;">Visit Us</div>
        <div style="color:var(--ink-3);font-size:.8rem;">Shop 6 &amp; 7, Rao Lal Singh Market,<br/>Sector-18, Gurugram – 122015</div>
      </div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <div class="footer-logo"><img src="/images/logo.png" alt="Sea Hawk Courier and Cargo"/></div>
        <p class="footer-brand">Your trusted delivery partner since 2004. Connecting businesses across India and the world with speed, reliability and complete transparency.</p>
        <div class="footer-contacts">
          <div class="fci">📞 <a href="tel:+919911565523">+91 99115 65523</a> · <a href="tel:+919911555534">+91 99115 55534</a></div>
          <div class="fci">📞 <a href="tel:+918368201122">+91 83682 01122</a></div>
          <div class="fci">💬 <a href="https://wa.me/919911565523" target="_blank">WhatsApp Us</a></div>
          <div class="fci">📍 Shop 6 &amp; 7, Rao Lal Singh Market, Sector-18, Gurugram – 122015</div>
          <div class="fci" style="font-size:.73rem;color:rgba(255,255,255,.35);">GSTIN: 06AJDPR0914N2Z1</div>
        </div>
      </div>
      <div>
        <div class="footer-h">Services</div>
        <ul class="footer-ul">
          <li><a href="#services">Express Delivery</a></li>
          <li><a href="#services">International Courier</a></li>
          <li><a href="#services">Surface Cargo</a></li>
          <li><a href="#services">B2B Logistics</a></li>
          <li><a href="#services">Insured Shipping</a></li>
          <li><a href="#services">Document Courier</a></li>
        </ul>
      </div>
      <div>
        <div class="footer-h">Quick Links</div>
        <ul class="footer-ul">
          <li><a href="#calculator">Rate Calculator</a></li>
          <li><a href="#map-section">Coverage Map</a></li>
          <li><a href="/login">🔐 Client Portal</a></li>
          <li><a href="#contact-section">Contact Us</a></li>
        </ul>
      </div>
      <div>
        <div class="footer-h">Company</div>
        <ul class="footer-ul">
          <li><a href="#">Privacy Policy</a></li>
          <li><a href="#">Terms of Service</a></li>
          <li><a href="#">Shipping Guidelines</a></li>
          <li><a href="#">Claims Policy</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <div>© 2025 Sea Hawk Courier &amp; Cargo. All rights reserved.</div>
      <div class="footer-br"><a href="#">Privacy</a><a href="#">Terms</a><a href="#contact-section">Support</a></div>
    </div>
  </div>
</footer>
`;

  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
    />
  );
}
