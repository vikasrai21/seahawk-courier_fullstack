// BookPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from './PublicLayout';

const STEPS = ['Your Details', 'Pickup Address', 'Delivery', 'Package', 'Schedule'];

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a',
  background: '#fff', outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.2s', boxSizing: 'border-box',
};
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: '#64748b', textTransform: 'uppercase',
  letterSpacing: '0.07em', marginBottom: 6,
};
const sectionStyle = {
  padding: '18px 24px',
  borderBottom: '1px solid #f1f5f9',
  background: '#f8fafc',
  display: 'flex', alignItems: 'center', gap: 10,
};

export default function BookPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(null); // null | { requestNo, whatsappUrl }
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '', company: '', phone: '', email: '',
    pickupAddress: '', pickupCity: '', pickupPin: '',
    destination: '', destCity: '', destCountry: 'India',
    packageType: 'Parcel', weight: '', pieces: '1',
    service: 'Standard', declaredValue: '',
    preferredDate: '', preferredTime: 'Morning (9am–12pm)',
    notes: '',
  });

  function set(field, val) { setForm(p => ({ ...p, [field]: val })); }
  function handle(e) { set(e.target.name, e.target.value); }

  function inp(id, label, opts = {}) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <label style={labelStyle}>{label}</label>
        <input
          id={id} name={id}
          value={form[id]} onChange={handle}
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = '#f97316'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          {...opts}
        />
      </div>
    );
  }

  function sel(id, label, options) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <label style={labelStyle}>{label}</label>
        <select
          id={id} name={id} value={form[id]} onChange={handle}
          style={{ ...inputStyle, cursor: 'pointer' }}
          onFocus={e => e.target.style.borderColor = '#f97316'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        >
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
      </div>
    );
  }

  // Validate current step before proceeding
  function validateStep() {
    if (step === 0 && (!form.name || !form.phone)) return 'Name and phone are required.';
    if (step === 1 && (!form.pickupAddress || !form.pickupCity || !form.pickupPin)) return 'All pickup fields are required.';
    if (step === 2 && (!form.destination || !form.destCity)) return 'Delivery destination is required.';
    if (step === 3 && !form.weight) return 'Please enter the package weight.';
    if (step === 4 && !form.preferredDate) return 'Please select a preferred date.';
    return '';
  }

  function next() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setStep(s => s + 1);
  }

  function back() { setError(''); setStep(s => s - 1); }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validateStep();
    if (err) { setError(err); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/public/pickup-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Submission failed.');
      setSubmitted(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Success screen ─────────────────────────────────────────────────────
  if (submitted) {
    return (
      <PublicLayout>
        <section style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '40px 20px' }}>
          <div style={{ textAlign: 'center', maxWidth: 520, width: '100%' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 20px' }}>✅</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Pickup Request Submitted!</h2>
            <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: 8 }}>
              Your request has been saved. Our team will confirm within 30 minutes.
            </p>
            <div style={{ display: 'inline-block', padding: '8px 20px', background: '#f1f5f9', borderRadius: 8, marginBottom: 28 }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Reference Number: </span>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0b1f3a', fontSize: 15 }}>{submitted.requestNo}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
              <a
                href={submitted.whatsappUrl} target="_blank" rel="noreferrer"
                style={{ padding: '12px 22px', background: '#16a34a', color: '#fff', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}
              >
                💬 Also notify via WhatsApp
              </a>
              <Link to="/track" style={{ padding: '12px 22px', background: '#0b1f3a', color: '#fff', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
                🔍 Track a Shipment
              </Link>
            </div>
            <button
              onClick={() => { setSubmitted(null); setStep(0); setForm({ name: '', company: '', phone: '', email: '', pickupAddress: '', pickupCity: '', pickupPin: '', destination: '', destCity: '', destCountry: 'India', packageType: 'Parcel', weight: '', pieces: '1', service: 'Standard', declaredValue: '', preferredDate: '', preferredTime: 'Morning (9am–12pm)', notes: '' }); }}
              style={{ background: 'none', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, color: '#475569', fontSize: 13 }}
            >
              📦 Book Another Pickup
            </button>
          </div>
        </section>
      </PublicLayout>
    );
  }

  // ── Page ───────────────────────────────────────────────────────────────
  return (
    <PublicLayout>
      {/* Hero */}
      <section style={{ background: 'var(--navy)', padding: '48px 0 36px', borderBottom: '3px solid var(--orange)' }}>
        <div className="wrap" style={{ textAlign: 'center' }}>
          <div className="pill pill-orange" style={{ display: 'inline-block', marginBottom: 12 }}>Free Pickup</div>
          <h1 className="h-display" style={{ color: '#fff', margin: '0 0 10px' }}>Book a <span>Free Pickup</span></h1>
          <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '0.95rem', maxWidth: 440, margin: '0 auto' }}>
            Fill in the details and we'll confirm your pickup within 30 minutes.
          </p>
        </div>
      </section>

      <section className="sec" style={{ background: '#f8fafc' }}>
        <div className="wrap" style={{ maxWidth: 680 }}>

          {/* Step indicators */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: i < step ? '#16a34a' : i === step ? '#f97316' : '#e2e8f0',
                    color: i <= step ? '#fff' : '#94a3b8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800,
                    boxShadow: i === step ? '0 0 0 4px rgba(249,115,22,0.2)' : 'none',
                    transition: 'all 0.3s',
                  }}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: i === step ? '#f97316' : '#94a3b8', whiteSpace: 'nowrap', display: window.innerWidth < 500 ? 'none' : 'block' }}>
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: i < step ? '#16a34a' : '#e2e8f0', margin: '0 6px 16px', transition: 'background 0.3s' }} />
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e2e8f0', boxShadow: '0 4px 24px rgba(11,31,58,0.07)', overflow: 'hidden' }}>

            {/* Step 0 — Your Details */}
            {step === 0 && (
              <>
                <div style={sectionStyle}>
                  <span style={{ fontSize: 20 }}>👤</span>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0b1f3a', fontSize: 15 }}>Your Details</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Who should we contact for pickup?</div>
                  </div>
                </div>
                <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {inp('name', 'Full Name *', { placeholder: 'Your name', required: true })}
                  {inp('company', 'Company (optional)', { placeholder: 'Company name' })}
                  {inp('phone', 'Phone *', { placeholder: '+91 XXXXX XXXXX', required: true })}
                  {inp('email', 'Email (optional)', { placeholder: 'For confirmation', type: 'email' })}
                </div>
              </>
            )}

            {/* Step 1 — Pickup Address */}
            {step === 1 && (
              <>
                <div style={sectionStyle}>
                  <span style={{ fontSize: 20 }}>📍</span>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0b1f3a', fontSize: 15 }}>Pickup Address</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Where should we collect the package?</div>
                  </div>
                </div>
                <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ gridColumn: '1/-1' }}>
                    {inp('pickupAddress', 'Full Address *', { placeholder: 'Street, area, landmark', required: true })}
                  </div>
                  {inp('pickupCity', 'City *', { placeholder: 'City', required: true })}
                  {inp('pickupPin', 'PIN Code *', { placeholder: '6-digit PIN', maxLength: 6, required: true })}
                </div>
              </>
            )}

            {/* Step 2 — Delivery */}
            {step === 2 && (
              <>
                <div style={sectionStyle}>
                  <span style={{ fontSize: 20 }}>🚚</span>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0b1f3a', fontSize: 15 }}>Delivery Details</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Where is this shipment going?</div>
                  </div>
                </div>
                <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ gridColumn: '1/-1' }}>
                    {inp('destination', 'Delivery Address / City *', { placeholder: 'Full address or city name', required: true })}
                  </div>
                  {inp('destCity', 'Destination City *', { placeholder: 'City', required: true })}
                  {sel('destCountry', 'Country', ['India', 'UAE', 'USA', 'UK', 'Australia', 'Canada', 'Singapore', 'Other'])}
                </div>
              </>
            )}

            {/* Step 3 — Package */}
            {step === 3 && (
              <>
                <div style={sectionStyle}>
                  <span style={{ fontSize: 20 }}>📦</span>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0b1f3a', fontSize: 15 }}>Package Details</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Tell us about your shipment</div>
                  </div>
                </div>
                <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  {sel('packageType', 'Package Type', ['Document', 'Parcel', 'Box', 'Cargo / Heavy'])}
                  {inp('weight', 'Weight (kg) *', { type: 'number', placeholder: 'e.g. 1.5', min: '0.01', step: '0.01', required: true })}
                  {inp('pieces', 'No. of Pieces', { type: 'number', min: '1' })}
                  {sel('service', 'Service Level', ['Standard', 'Priority Express', 'Same Day (NCR)', 'Economy'])}
                  {inp('declaredValue', 'Declared Value (₹)', { type: 'number', placeholder: 'For insurance' })}
                </div>
              </>
            )}

            {/* Step 4 — Schedule */}
            {step === 4 && (
              <>
                <div style={sectionStyle}>
                  <span style={{ fontSize: 20 }}>📅</span>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0b1f3a', fontSize: 15 }}>Preferred Schedule</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>When should we pick it up?</div>
                  </div>
                </div>
                <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {inp('preferredDate', 'Preferred Date *', { type: 'date', required: true })}
                  {sel('preferredTime', 'Time Slot', ['Morning (9am–12pm)', 'Afternoon (12pm–4pm)', 'Evening (4pm–7pm)'])}
                  <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column' }}>
                    <label style={labelStyle}>Special Instructions (optional)</label>
                    <textarea
                      name="notes" value={form.notes} onChange={handle} rows={4}
                      placeholder="Fragile items, gate code, contact at location..."
                      style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
                      onFocus={e => e.target.style.borderColor = '#f97316'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Error */}
            {error && (
              <div style={{ margin: '0 24px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
                ⚠️ {error}
              </div>
            )}

            {/* Navigation */}
            <div style={{ padding: '20px 24px', display: 'flex', gap: 12, borderTop: '1px solid #f1f5f9' }}>
              {step > 0 && (
                <button type="button" onClick={back} style={{ padding: '11px 20px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, fontWeight: 700, cursor: 'pointer', color: '#475569', fontSize: 14 }}>
                  ← Back
                </button>
              )}
              <button
                type="button"
                onClick={step < STEPS.length - 1 ? next : handleSubmit}
                disabled={loading}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10, border: 'none',
                  background: loading ? '#fed7aa' : 'linear-gradient(135deg,#f97316,#c94d08)',
                  color: '#fff', fontWeight: 800, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 14px rgba(249,115,22,0.35)',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {loading ? (
                  <>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    Submitting...
                  </>
                ) : step < STEPS.length - 1 ? `Continue → ${STEPS[step + 1]}` : '📦 Submit Pickup Request'}
              </button>
            </div>

          </div>

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
            Your request is saved securely. Need help?{' '}
            <a href="tel:+919911565523" style={{ color: '#f97316', fontWeight: 700 }}>+91 99115 65523</a>
          </p>
        </div>
      </section>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: #c0ccda; }
      `}</style>
    </PublicLayout>
  );
}
