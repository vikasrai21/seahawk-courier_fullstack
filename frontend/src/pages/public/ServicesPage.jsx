// ServicesPage.jsx — Full services page as React component
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from './PublicLayout';

const services = [
  {
    id: 'express',
    icon: '🚀',
    title: 'Express Delivery',
    tagline: 'Same-day & next-day across India',
    desc: 'Our flagship service for time-critical shipments. Guaranteed pickup within 2 hours of booking for Delhi NCR, with same-day delivery to major Delhi NCR locations and next-day to all metros.',
    features: ['Same-day delivery within Delhi NCR', 'Next-day to Mumbai, Bangalore, Chennai, Kolkata', '2-hour pickup guarantee', 'Real-time GPS tracking', 'Digital POD with signature capture', 'Dedicated account manager'],
    zones: '📍 Delhi NCR · All Metro Cities · North India',
    badge: 'Most Popular',
    badgeColor: 'var(--orange)',
  },
  {
    id: 'international',
    icon: '✈️',
    title: 'International Courier',
    tagline: 'Documents & parcels to 220+ countries',
    desc: 'Ship documents and packages worldwide via our network of tier-1 carrier partners — DHL, FedEx, Aramex and our own agent network covering 8 international pricing zones.',
    features: ['220+ countries & territories', 'Documents to UAE in 2 working days', 'Customs clearance support', 'DDP (Delivery Duty Paid) available', 'Real-time tracking with milestone alerts', 'All international zones priced transparently'],
    zones: '🌍 USA · UK · UAE · Australia · Europe · Asia · 220+ Countries',
    badge: null,
  },
  {
    id: 'cargo',
    icon: '📦',
    title: 'Surface & LTL Cargo',
    tagline: 'Heavy freight connecting 800+ cities pan-India',
    desc: 'Cost-effective road freight for heavy and bulk consignments. Less-than-truckload (LTL) surface express covering every major Indian city at competitive per-kg rates.',
    features: ['Minimum 3 kg, up to 500 kg per consignment', 'Pan-India connectivity — 800+ cities', 'Per-kg slab pricing, no hidden fees', 'Door-to-door or hub-to-hub', 'Daily departures from Delhi NCR', 'Fragile goods handling on request'],
    zones: '🏭 Pan-India Surface Network',
    badge: null,
  },
  {
    id: 'b2b',
    icon: '🏢',
    title: 'B2B Logistics',
    tagline: 'Enterprise shipping with custom contracts',
    desc: 'Tailored logistics solutions for businesses with regular shipping needs. Custom rate contracts, credit billing, dedicated account management and complete client portal access.',
    features: ['Custom per-kg rate card negotiations', 'Monthly consolidated invoicing with GST', 'Dedicated relationship manager', 'Client portal with full shipment history', 'Priority pickup scheduling', 'Volume discounts from 50 shipments/month'],
    zones: '💼 All India · Any volume from 50+ shipments/month',
    badge: 'Best Value',
    badgeColor: 'var(--navy)',
  },
  {
    id: 'insured',
    icon: '🛡️',
    title: 'Insured Shipments',
    tagline: 'Full declared-value coverage at 5% premium',
    desc: 'Ship high-value items — electronics, jewellery, luxury goods, fragile items — with complete peace of mind. Our insurance covers declared value with a hassle-free claims process.',
    features: ['Coverage up to declared value', '5% premium (minimum ₹100)', 'Covers electronics, jewellery, fragile goods', 'Claim processing within 7 working days', 'No deductibles on approved claims', 'Available on all domestic routes'],
    zones: '🔒 Domestic · All routes',
    badge: null,
  },
  {
    id: 'documents',
    icon: '📋',
    title: 'Document Courier',
    tagline: 'Secure handling for sensitive paperwork',
    desc: 'Specialised courier service for legal documents, bank instruments, passports, visa applications and diplomatic mail. Handled with absolute confidentiality and chain-of-custody tracking.',
    features: ['Legal documents & court filings', 'Passport & visa applications', 'Bank instruments & cheques', 'Diplomatic & consulate mail', 'Tamper-evident sealed packaging', 'Proof of delivery with receiver signature'],
    zones: '🗂️ Domestic & International',
    badge: null,
  },
];

export default function ServicesPage() {
  useEffect(() => {
    // Scroll to hash on load (for anchor links from other pages)
    if (window.location.hash) {
      const el = document.getElementById(window.location.hash.slice(1));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
    // Scroll reveal
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
    }, { threshold: 0.07 });
    document.querySelectorAll('.rev').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <PublicLayout>
      {/* ── PAGE HERO ── */}
      <section style={{ background: 'var(--navy)', padding: '80px 0 60px', borderBottom: '3px solid var(--orange)' }}>
        <div className="wrap" style={{ textAlign: 'center' }}>
          <div className="pill pill-orange rev" style={{ display: 'inline-block', marginBottom: 16 }}>Our Services</div>
          <h1 className="h-display rev d1" style={{ color: '#fff', margin: '0 0 16px' }}>Courier &amp; Cargo <span>Services</span></h1>
          <p className="t-lead rev d2" style={{ color: 'rgba(255,255,255,.7)', maxWidth: 600, margin: '0 auto 28px' }}>
            From a single document to a pallet of goods — domestic or international — we have a service designed for your exact need.
          </p>
          <div className="rev d3" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/book" className="btn btn-orange btn-lg">📦 Book Free Pickup</Link>
            <a href="#calculator" className="btn btn-ghost-w btn-lg">⚡ Get a Rate</a>
          </div>
        </div>
      </section>

      {/* ── SERVICE CARDS ── */}
      <section className="sec">
        <div className="wrap">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 28 }}>
            {services.map((s) => (
              <div key={s.id} id={s.id} className="rev" style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1.5px solid var(--border-l)', boxShadow: 'var(--sh-md)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: 'var(--navy-faint)', padding: '24px 24px 20px', borderBottom: '1px solid var(--border-l)', position: 'relative' }}>
                  {s.badge && (
                    <div style={{ position: 'absolute', top: 16, right: 16, background: s.badgeColor, color: '#fff', fontSize: '.65rem', fontWeight: 800, padding: '4px 10px', borderRadius: 40, textTransform: 'uppercase', letterSpacing: 1 }}>{s.badge}</div>
                  )}
                  <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>{s.icon}</div>
                  <h2 style={{ fontFamily: 'inherit', fontSize: '1.3rem', fontWeight: 800, color: 'var(--ink)', margin: '0 0 4px' }}>{s.title}</h2>
                  <div style={{ fontSize: '.8rem', color: 'var(--orange)', fontWeight: 700 }}>{s.tagline}</div>
                </div>
                <div style={{ padding: '20px 24px', flex: 1 }}>
                  <p style={{ color: 'var(--ink-2)', fontSize: '.875rem', lineHeight: 1.6, marginBottom: 16 }}>{s.desc}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {s.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.8rem', color: 'var(--ink-2)' }}>
                        <span style={{ color: 'var(--green)', fontWeight: 800, flexShrink: 0 }}>✓</span>{f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ padding: '14px 24px', background: 'var(--bg-2)', borderTop: '1px solid var(--border-l)', fontSize: '.72rem', color: 'var(--ink-3)', fontWeight: 600 }}>{s.zones}</div>
                <div style={{ padding: '16px 24px 20px', display: 'flex', gap: 10 }}>
                  <Link to="/book" style={{ flex: 1, textAlign: 'center', padding: '10px', background: 'var(--orange)', color: '#fff', borderRadius: 'var(--r)', fontSize: '.8rem', fontWeight: 700, textDecoration: 'none' }}>📦 Book Now</Link>
                  <Link to="/contact" style={{ flex: 1, textAlign: 'center', padding: '10px', background: '#fff', color: 'var(--navy)', border: '1.5px solid var(--navy-pale)', borderRadius: 'var(--r)', fontSize: '.8rem', fontWeight: 700, textDecoration: 'none' }}>Get Quote</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY SEAHAWK ── */}
      <section className="sec" style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--border-l)' }}>
        <div className="wrap">
          <div className="sec-head">
            <div className="pill pill-navy rev">Why Sea Hawk</div>
            <h2 className="h-display rev d1">The Sea Hawk <span>Difference</span></h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20 }}>
            {[
              {icon:'🏆',t:'20+ Years Experience',d:'Established in 2004. Two decades of delivering for Indian businesses.'},
              {icon:'🌐',t:'Largest Partner Network',d:'Trackon, DTDC, Delhivery, BlueDart, DHL, FedEx — all under one account.'},
              {icon:'💰',t:'Transparent Pricing',d:'No hidden surcharges. All-inclusive rates shown before you book.'},
              {icon:'🔍',t:'Real-Time Tracking',d:'Track any consignment live from booking to delivery.'},
              {icon:'📞',t:'24×7 Support',d:'Emergency support available round the clock. We pick up the phone.'},
              {icon:'🧾',t:'GST Invoicing',d:'Fully GST-compliant invoices for every shipment, on time.'},
            ].map(({icon,t,d},i) => (
              <div key={t} className={`rev${i > 0 ? ` d${i % 3 + 1}` : ''}`} style={{ textAlign: 'center', padding: '24px 16px', background: '#fff', borderRadius: 'var(--r-lg)', border: '1.5px solid var(--border-l)', boxShadow: 'var(--sh-sm)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>{icon}</div>
                <div style={{ fontWeight: 800, color: 'var(--ink)', marginBottom: 6, fontSize: '.9rem' }}>{t}</div>
                <div style={{ fontSize: '.78rem', color: 'var(--ink-3)', lineHeight: 1.5 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="cta-band">
        <div className="wrap">
          <div className="cta-inner">
            <h2>Ready to <span>Start Shipping?</span></h2>
            <p>Open a free account in 2 minutes. No commitment. No minimum volume.</p>
            <div className="cta-btns">
              <Link to="/book" className="btn btn-white btn-lg">📦 Book Free Pickup</Link>
              <Link to="/contact" className="btn btn-ghost-w btn-lg">📞 Talk to Us</Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
