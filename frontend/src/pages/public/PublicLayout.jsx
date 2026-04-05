// PublicLayout.jsx — Shared header + footer for all public pages
// Proper React component (no DOM hacks, no global function injection)
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function PublicLayout({ children }) {
  const [mobOpen, setMobOpen] = useState(false);

  // Load/unload website CSS scoped to public pages only
  useEffect(() => {
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = '/website/css/style.css';
    link.id   = 'seahawk-public-css';
    document.head.appendChild(link);
    return () => document.getElementById('seahawk-public-css')?.remove();
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobOpen]);

  return (
    <>
      {/* ── WhatsApp Float ── */}
      <a href="https://wa.me/919911565523" className="wa-float" target="_blank" rel="noreferrer" title="WhatsApp">💬</a>

      {/* ── Sticky mobile CTA bar ── */}
      <div className="sticky-book-bar">
        <Link to="/book" className="btn btn-white" style={{ color: 'var(--orange)', fontWeight: 800 }}>📦 Book Pickup</Link>
        <Link to="/track" className="btn btn-ghost-w" style={{ fontWeight: 700 }}>🔍 Track</Link>
      </div>

      {/* ── Mobile Menu ── */}
      <div className={`mob-menu${mobOpen ? ' open' : ''}`} id="mobMenu">
        <div className="mob-head">
          <img src="/images/logo.png" alt="Sea Hawk Courier" />
          <button className="mob-close" onClick={() => setMobOpen(false)}>✕</button>
        </div>
        <ul className="mob-links">
          <li><Link to="/" onClick={() => setMobOpen(false)}>Home</Link></li>
          <li><Link to="/services" onClick={() => setMobOpen(false)}>Services</Link></li>
          <li><Link to="/track" onClick={() => setMobOpen(false)}>🔍 Track Shipment</Link></li>
          <li><Link to="/book" onClick={() => setMobOpen(false)}>📦 Book Pickup</Link></li>
          <li><a href="/#calculator" onClick={() => setMobOpen(false)}>Rates</a></li>
          <li><a href="/#map-section" onClick={() => setMobOpen(false)}>Coverage</a></li>
          <li><Link to="/contact" onClick={() => setMobOpen(false)}>Contact Us</Link></li>
        </ul>
        <div className="mob-ctas">
          <Link to="/book" className="btn btn-orange" onClick={() => setMobOpen(false)}>📦 Book Pickup</Link>
          <Link to="/login" className="btn btn-navy" onClick={() => setMobOpen(false)}>🔐 Portal</Link>
          <a href="tel:+919911565523" className="btn btn-outline" onClick={() => setMobOpen(false)}>📞 +91 99115 65523</a>
        </div>
      </div>

      {/* ── Header ── */}
      <header>
        <div id="topbar">
          <div className="tb-row">
            <span>📍 New Delhi, India</span>
            <div className="tb-sep" />
            <span>Mon–Sat: 9 AM – 7 PM &nbsp;|&nbsp; Emergency: 24×7</span>
          </div>
          <div className="tb-row">
            <a href="tel:+919911565523">📞 +91 99115 65523</a>
            <div className="tb-sep" />
            <a href="tel:+918368201122">+91 83682 01122</a>
            <div className="tb-sep" />
            <a href="https://wa.me/919911565523" target="_blank" rel="noreferrer">💬 WhatsApp</a>
          </div>
        </div>
        <nav className="main-nav">
          <Link to="/" className="nav-logo">
            <img src="/images/logo.png" alt="Sea Hawk Courier and Cargo" />
          </Link>
          <ul className="nav-ul">
            <li className="has-drop">
              <Link to="/services">Services ▾</Link>
              <div className="nav-drop">
                <Link to="/services#express"><span className="di">🚀</span>Express Delivery</Link>
                <Link to="/services#international"><span className="di">✈️</span>International Courier</Link>
                <Link to="/services#cargo"><span className="di">📦</span>Surface &amp; LTL Cargo</Link>
                <Link to="/services#b2b"><span className="di">🏢</span>B2B Logistics</Link>
                <Link to="/services#insured"><span className="di">🛡️</span>Insured Shipping</Link>
              </div>
            </li>
            <li><Link to="/track" style={{ fontWeight: 700 }}>🔍 Track</Link></li>
            <li><Link to="/book" style={{ color: 'var(--orange)', fontWeight: 700 }}>📦 Book Pickup</Link></li>
            <li><a href="/#calculator">Rates</a></li>
            <li><a href="/#map-section">Coverage</a></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
          <div className="nav-right">
            <Link to="/login" className="nav-portal">🔐 Portal</Link>
            <Link to="/book" className="nav-quote">📦 Book Pickup</Link>
          </div>
          <button className="hamburger" onClick={() => setMobOpen(true)}>
            <span /><span /><span />
          </button>
        </nav>
      </header>

      {/* ── Page Content ── */}
      <main>{children}</main>

      {/* ── Footer ── */}
      <footer>
        <div className="wrap">
          <div className="footer-grid">
            <div>
              <div className="footer-logo">
                <img loading="lazy" src="/images/logo.png" alt="Sea Hawk Courier and Cargo" />
              </div>
              <p className="footer-brand">Your trusted delivery partner since 2004. Connecting businesses across India and the world with speed, reliability and complete transparency.</p>
              <div className="footer-contacts">
                <div className="fci">📞 <a href="tel:+919911565523">+91 99115 65523</a> · <a href="tel:+919911555534">+91 99115 55534</a></div>
                <div className="fci">📞 <a href="tel:+918368201122">+91 83682 01122</a></div>
                <div className="fci">💬 <a href="https://wa.me/919911565523" target="_blank" rel="noreferrer">WhatsApp Us</a></div>
                <div className="fci">📍 Shop 6 &amp; 7, Rao Lal Singh Market, Sector-18, Gurugram – 122015</div>
                <div className="fci" style={{ fontSize: '.73rem', color: 'rgba(255,255,255,.35)' }}>GSTIN: 06AJDPR0914N2Z1</div>
              </div>
            </div>
            <div>
              <div className="footer-h">Services</div>
              <ul className="footer-ul">
                <li><Link to="/services#express">Express Delivery</Link></li>
                <li><Link to="/services#international">International Courier</Link></li>
                <li><Link to="/services#cargo">Surface Cargo</Link></li>
                <li><Link to="/services#b2b">B2B Logistics</Link></li>
                <li><Link to="/services#insured">Insured Shipping</Link></li>
                <li><Link to="/services">Document Courier</Link></li>
              </ul>
            </div>
            <div>
              <div className="footer-h">Quick Links</div>
              <ul className="footer-ul">
                <li><a href="/#calculator">Rate Calculator</a></li>
                <li><a href="/#map-section">Coverage Map</a></li>
                <li><Link to="/login">🔐 Client Portal</Link></li>
                <li><Link to="/contact">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <div className="footer-h">Company</div>
              <ul className="footer-ul">
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Shipping Guidelines</a></li>
                <li><a href="#">Claims Policy</a></li>
                <li><a href="#">Prohibited Items</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <div>© {new Date().getFullYear()} Sea Hawk Courier &amp; Cargo. All rights reserved.</div>
            <div className="footer-br">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <Link to="/contact">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
