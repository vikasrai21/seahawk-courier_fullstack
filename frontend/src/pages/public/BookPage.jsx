// BookPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from './PublicLayout';

export default function BookPage() {
  const [form, setForm] = useState({
    name: '', company: '', phone: '', email: '',
    pickupAddress: '', pickupCity: '', pickupPin: '',
    destination: '', destCity: '', destCountry: 'India',
    packageType: 'Parcel', weight: '', pieces: '1',
    service: 'Standard', declaredValue: '',
    preferredDate: '', preferredTime: 'Morning (9am–12pm)',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const msg = `📦 PICKUP REQUEST — Sea Hawk

Name: ${form.name}${form.company ? `\nCompany: ${form.company}` : ''}
Phone: ${form.phone}${form.email ? `\nEmail: ${form.email}` : ''}

PICKUP:
Address: ${form.pickupAddress}
City: ${form.pickupCity} — PIN: ${form.pickupPin}

DELIVERY:
Destination: ${form.destination}
City: ${form.destCity}, ${form.destCountry}

PACKAGE:
Type: ${form.packageType}
Weight: ${form.weight} kg · Pieces: ${form.pieces}
Service: ${form.service}${form.declaredValue ? `\nDeclared Value: ₹${form.declaredValue}` : ''}

DATE: ${form.preferredDate} · ${form.preferredTime}
${form.notes ? `Notes: ${form.notes}` : ''}`;
    window.open(`https://wa.me/919911565523?text=${encodeURIComponent(msg)}`, '_blank');
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <PublicLayout>
        <section style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-2)' }}>
          <div style={{ textAlign: 'center', maxWidth: 480, padding: '40px 24px' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>✅</div>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '1.6rem', fontWeight: 900, color: 'var(--ink)', marginBottom: 12 }}>
              Pickup Request Sent!
            </h2>
            <p style={{ color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 24 }}>
              Your booking details have been sent via WhatsApp. Our team will confirm within 30 minutes during business hours.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/track" style={{ padding: '11px 22px', background: 'var(--navy)', color: '#fff', borderRadius: 'var(--r)', fontWeight: 700, textDecoration: 'none', fontSize: '.875rem' }}>
                🔍 Track a Shipment
              </Link>
              <button onClick={() => setSubmitted(false)} style={{ padding: '11px 22px', background: '#fff', color: 'var(--ink)', border: '1.5px solid var(--border-l)', borderRadius: 'var(--r)', fontWeight: 700, cursor: 'pointer', fontSize: '.875rem' }}>
                📦 Book Another
              </button>
            </div>
          </div>
        </section>
      </PublicLayout>
    );
  }

  const sectionHead = (icon, title) => (
    <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border-l)', background: 'var(--navy-faint)' }}>
      <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--navy)', margin: 0, fontSize: '1rem' }}>
        {icon} {title}
      </h3>
    </div>
  );

  return (
    <PublicLayout>

      {/* Hero */}
      <section style={{ background: 'var(--navy)', padding: '60px 0 48px', borderBottom: '3px solid var(--orange)' }}>
        <div className="wrap" style={{ textAlign: 'center' }}>
          <div className="pill pill-orange" style={{ display: 'inline-block', marginBottom: 14 }}>Free Pickup</div>
          <h1 className="h-display" style={{ color: '#fff', margin: '0 0 12px' }}>
            Book a <span>Free Pickup</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,.7)', fontSize: '1rem', maxWidth: 480, margin: '0 auto' }}>
            Fill in the details and we'll confirm your pickup within 30 minutes via WhatsApp.
          </p>
        </div>
      </section>

      <section className="sec">
        <div className="wrap" style={{ maxWidth: 760 }}>
          <form
            onSubmit={handleSubmit}
            style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1.5px solid var(--border-l)', boxShadow: 'var(--sh-md)', overflow: 'hidden' }}
          >

            {/* Your Details */}
            {sectionHead('👤', 'Your Details')}
            <div style={{ padding: '20px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, borderBottom: '1px solid var(--border-l)' }}>
              <div className="fg">
                <label htmlFor="name">Full Name *</label>
                <input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Your name" required />
              </div>
              <div className="fg">
                <label htmlFor="company">Company (optional)</label>
                <input id="company" name="company" value={form.company} onChange={handleChange} placeholder="Company name" />
              </div>
              <div className="fg">
                <label htmlFor="phone">Phone *</label>
                <input id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" required />
              </div>
              <div className="fg">
                <label htmlFor="email">Email (optional)</label>
                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="For invoice" />
              </div>
            </div>

            {/* Pickup Address */}
            {sectionHead('📍', 'Pickup Address')}
            <div style={{ padding: '20px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, borderBottom: '1px solid var(--border-l)' }}>
              <div className="fg" style={{ gridColumn: '1/-1' }}>
                <label htmlFor="pickupAddress">Full Address *</label>
                <input id="pickupAddress" name="pickupAddress" value={form.pickupAddress} onChange={handleChange} placeholder="Street, area, landmark" required />
              </div>
              <div className="fg">
                <label htmlFor="pickupCity">City *</label>
                <input id="pickupCity" name="pickupCity" value={form.pickupCity} onChange={handleChange} placeholder="City" required />
              </div>
              <div className="fg">
                <label htmlFor="pickupPin">PIN Code *</label>
                <input id="pickupPin" name="pickupPin" value={form.pickupPin} onChange={handleChange} placeholder="6-digit PIN" maxLength={6} required />
              </div>
            </div>

            {/* Delivery Details */}
            {sectionHead('🚚', 'Delivery Details')}
            <div style={{ padding: '20px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, borderBottom: '1px solid var(--border-l)' }}>
              <div className="fg" style={{ gridColumn: '1/-1' }}>
                <label htmlFor="destination">Delivery Address / City *</label>
                <input id="destination" name="destination" value={form.destination} onChange={handleChange} placeholder="Delivery address or city" required />
              </div>
              <div className="fg">
                <label htmlFor="destCity">Destination City *</label>
                <input id="destCity" name="destCity" value={form.destCity} onChange={handleChange} placeholder="City" required />
              </div>
              <div className="fg">
                <label htmlFor="destCountry">Country</label>
                <select id="destCountry" name="destCountry" value={form.destCountry} onChange={handleChange}>
                  <option>India</option>
                  <option>UAE</option>
                  <option>USA</option>
                  <option>UK</option>
                  <option>Australia</option>
                  <option>Canada</option>
                  <option>Singapore</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            {/* Package Details */}
            {sectionHead('📦', 'Package Details')}
            <div style={{ padding: '20px 28px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, borderBottom: '1px solid var(--border-l)' }}>
              <div className="fg">
                <label htmlFor="packageType">Package Type</label>
                <select id="packageType" name="packageType" value={form.packageType} onChange={handleChange}>
                  <option>Document</option>
                  <option>Parcel</option>
                  <option>Box</option>
                  <option>Cargo / Heavy</option>
                </select>
              </div>
              <div className="fg">
                <label htmlFor="weight">Approx Weight (kg) *</label>
                <input id="weight" name="weight" type="number" value={form.weight} onChange={handleChange} placeholder="e.g. 1.5" min="0.01" step="0.01" required />
              </div>
              <div className="fg">
                <label htmlFor="pieces">No. of Pieces</label>
                <input id="pieces" name="pieces" type="number" value={form.pieces} onChange={handleChange} min="1" />
              </div>
              <div className="fg">
                <label htmlFor="service">Service Level</label>
                <select id="service" name="service" value={form.service} onChange={handleChange}>
                  <option>Standard</option>
                  <option>Priority Express</option>
                  <option>Same Day (NCR)</option>
                  <option>Economy</option>
                </select>
              </div>
              <div className="fg">
                <label htmlFor="declaredValue">Declared Value (₹)</label>
                <input id="declaredValue" name="declaredValue" type="number" value={form.declaredValue} onChange={handleChange} placeholder="For insurance" />
              </div>
            </div>

            {/* Schedule */}
            {sectionHead('📅', 'Preferred Schedule')}
            <div style={{ padding: '20px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, borderBottom: '1px solid var(--border-l)' }}>
              <div className="fg">
                <label htmlFor="preferredDate">Preferred Date *</label>
                <input id="preferredDate" name="preferredDate" type="date" value={form.preferredDate} onChange={handleChange} required />
              </div>
              <div className="fg">
                <label htmlFor="preferredTime">Time Slot</label>
                <select id="preferredTime" name="preferredTime" value={form.preferredTime} onChange={handleChange}>
                  <option>Morning (9am–12pm)</option>
                  <option>Afternoon (12pm–4pm)</option>
                  <option>Evening (4pm–7pm)</option>
                </select>
              </div>
              <div className="fg" style={{ gridColumn: '1/-1' }}>
                <label htmlFor="notes">Special Instructions (optional)</label>
                <textarea
                  id="notes" name="notes" value={form.notes} onChange={handleChange} rows={3}
                  placeholder="Fragile items, access instructions, contact at location..."
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Submit */}
            <div style={{ padding: '24px 28px' }}>
              <button
                type="submit"
                style={{ width: '100%', padding: '14px', background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 'var(--r)', fontSize: '1rem', fontWeight: 800, cursor: 'pointer' }}
              >
                📦 Confirm Pickup Request via WhatsApp
              </button>
              <p style={{ fontSize: '.73rem', color: 'var(--ink-4)', textAlign: 'center', marginTop: 10 }}>
                Clicking confirm opens WhatsApp with your booking details pre-filled. Our team will confirm within 30 minutes.
              </p>
            </div>

          </form>
        </div>
      </section>
    </PublicLayout>
  );
}
