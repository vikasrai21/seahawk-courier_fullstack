// src/pages/public/LandingPage.jsx
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const [awb, setAwb] = useState('');
  const navigate = useNavigate();

  const handleTrack = (e) => {
    e.preventDefault();
    if (awb.trim()) navigate(`/track/${awb.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a1628]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="Sea Hawk" className="h-10 w-auto" onError={e => e.target.style.display='none'} />
            <div>
              <div className="font-bold text-white text-sm leading-tight">Sea Hawk Courier</div>
              <div className="text-xs text-white/50">& Cargo Management</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <a href="#track" className="hover:text-white transition-colors">Track</a>
            <a href="#coverage" className="hover:text-white transition-colors">Coverage</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            <a href="tel:+919911565523" className="hidden md:block text-sm text-white/70 hover:text-white">📞 +91 99115 65523</a>
            <Link to="/login" className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              Staff Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-transparent to-orange-900/20 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
            Trusted Since 2004 — 20+ Years Delivering Excellence
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
            India's Most Trusted<br/>
            <span className="text-orange-500">Courier & Cargo</span>
          </h1>
          <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
            From same-day Delhi NCR deliveries to international shipments across 220+ countries — powered by speed, security and competitive rates.
          </p>

          {/* Trust chips */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {['35,000+ PIN Codes', '220+ Countries', '1.2L+ Shipments', '4.8★ Rating'].map(t => (
              <div key={t} className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-sm text-white/80">
                <span className="text-green-400 text-xs">✓</span>{t}
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <a href="tel:+919911565523" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl transition-colors text-lg">
              📦 Book Free Pickup
            </a>
            <a href="#track" className="border border-white/20 hover:border-white/40 text-white font-bold px-8 py-4 rounded-xl transition-colors text-lg">
              🔍 Track Shipment
            </a>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[['1.2L+','Shipments/Month'],['35K+','PIN Codes'],['220+','Countries']].map(([n,l]) => (
              <div key={l} className="text-center">
                <div className="text-2xl font-black text-orange-400">{n}</div>
                <div className="text-xs text-white/50 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Track section */}
      <section id="track" className="py-16 px-4 bg-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2">Track Your Shipment</h2>
          <p className="text-white/50 mb-8">Enter your AWB number to get real-time updates</p>
          <form onSubmit={handleTrack} className="flex gap-3 bg-white rounded-2xl p-2 shadow-2xl">
            <input
              type="text"
              placeholder="Enter AWB / Tracking Number"
              value={awb}
              onChange={e => setAwb(e.target.value)}
              className="flex-1 px-4 py-3 text-gray-900 bg-transparent outline-none font-semibold text-lg"
            />
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">
              Track
            </button>
          </form>
          <p className="text-white/40 text-sm mt-3">
            Or visit <Link to="/track" className="text-orange-400 hover:underline">track.seahawkcourier.com</Link>
          </p>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3">Our Services</h2>
            <p className="text-white/50">Complete logistics solutions for every need</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🚀', title: 'Express Delivery', desc: 'Same-day and next-day delivery across Delhi NCR and major metro cities.' },
              { icon: '✈️', title: 'International Courier', desc: 'Reliable shipments to 220+ countries with real-time tracking.' },
              { icon: '📦', title: 'Surface & LTL Cargo', desc: 'Cost-effective ground transport for heavy and bulk shipments.' },
              { icon: '🏢', title: 'B2B Logistics', desc: 'Dedicated logistics solutions for businesses with high shipment volumes.' },
              { icon: '🛡️', title: 'Insured Shipping', desc: 'Full insurance coverage for valuable and fragile shipments.' },
              { icon: '🔄', title: 'Reverse Logistics', desc: 'Seamless return management for eCommerce and retail businesses.' },
            ].map(s => (
              <div key={s.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <div className="text-3xl mb-4">{s.icon}</div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section id="coverage" className="py-20 px-4 bg-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-3">Pan India Coverage</h2>
          <p className="text-white/50 mb-12">Serving 35,000+ PIN codes across all 28 states and 8 union territories</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ['Delhi NCR','Same Day'], ['Mumbai','Next Day'], ['Bangalore','Next Day'],
              ['Chennai','Next Day'], ['Kolkata','Next Day'], ['Hyderabad','Next Day'],
              ['Pune','Next Day'], ['Ahmedabad','Next Day'],
            ].map(([city, eta]) => (
              <div key={city} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="font-semibold">{city}</div>
                <div className="text-xs text-orange-400 mt-1">{eta}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-3">Get in Touch</h2>
          <p className="text-white/50 mb-10">Our team is available Mon–Sat, 9 AM – 7 PM. Emergency support 24×7.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '📞', label: 'Call Us', value: '+91 99115 65523', href: 'tel:+919911565523' },
              { icon: '💬', label: 'WhatsApp', value: '+91 99115 65523', href: 'https://wa.me/919911565523' },
              { icon: '📧', label: 'Email', value: 'info@seahawkcourier.com', href: 'mailto:info@seahawkcourier.com' },
            ].map(c => (
              <a key={c.label} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors block">
                <div className="text-3xl mb-3">{c.icon}</div>
                <div className="text-white/50 text-sm mb-1">{c.label}</div>
                <div className="font-semibold">{c.value}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-white/40 text-sm">© 2024 Sea Hawk Courier & Cargo. All rights reserved.</div>
          <div className="flex gap-6 text-sm text-white/40">
            <Link to="/login" className="hover:text-white/70">Staff Login</Link>
            <a href="#contact" className="hover:text-white/70">Contact</a>
            <a href="https://wa.me/919911565523" target="_blank" className="hover:text-white/70">WhatsApp</a>
          </div>
        </div>
      </footer>

      {/* WhatsApp float */}
      <a href="https://wa.me/919911565523" target="_blank"
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50 text-2xl">
        💬
      </a>
    </div>
  );
}
