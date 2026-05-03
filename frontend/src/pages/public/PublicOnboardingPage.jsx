import { useState } from 'react';

export default function PublicOnboardingPage() {
  const [form, setForm] = useState({ companyName: '', contactName: '', email: '', phone: '', gst: '', pan: '', address: '', city: '', state: '', pincode: '', monthlyVolume: '', businessType: '', website: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/features/onboarding/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSubmitted(true);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50 p-4">
      <div className="card max-w-md p-8 text-center animate-in">
        <div className="text-6xl mb-4">🚀</div>
        <h2 className="text-2xl font-black text-slate-900">Application Submitted!</h2>
        <p className="text-sm text-slate-500 mt-2">Our team will review your application and get back to you within 24 hours.</p>
        <a href="/" className="btn-primary mt-6 inline-block">Back to Home</a>
      </div>
    </div>
  );

  const F = (label, key, ph, type = 'text') => (
    <div><label className="label">{label}</label><input type={type} className="input" placeholder={ph} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} /></div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Start Shipping with Sea Hawk</h1>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">Complete your application to get access to our client portal, competitive rates, and multi-carrier shipping.</p>
        </div>

        <div className="card p-6 sm:p-8">
          <h2 className="font-bold text-slate-900 mb-1">Business Details</h2>
          <p className="text-xs text-slate-400 mb-5">Required fields marked with *</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {F('Company Name *', 'companyName', 'Acme Corp Pvt Ltd')}
            {F('Contact Person *', 'contactName', 'John Doe')}
            {F('Email *', 'email', 'john@acme.com', 'email')}
            {F('Phone *', 'phone', '+91 98765 43210', 'tel')}
            {F('GST Number', 'gst', '22AAAAA0000A1Z5')}
            {F('PAN', 'pan', 'AAAPA1234A')}
            {F('Address', 'address', 'Plot 42, Industrial Area')}
            {F('City', 'city', 'Mumbai')}
            {F('State', 'state', 'Maharashtra')}
            {F('Pincode', 'pincode', '400001')}
            {F('Website', 'website', 'https://acme.com')}
            <div>
              <label className="label">Monthly Shipment Volume</label>
              <select className="input" value={form.monthlyVolume} onChange={e => setForm(p => ({ ...p, monthlyVolume: e.target.value }))}>
                <option value="">Select volume</option>
                <option value="1-100">1 – 100</option><option value="100-500">100 – 500</option>
                <option value="500-2000">500 – 2,000</option><option value="2000+">2,000+</option>
              </select>
            </div>
            <div>
              <label className="label">Business Type</label>
              <select className="input" value={form.businessType} onChange={e => setForm(p => ({ ...p, businessType: e.target.value }))}>
                <option value="">Select type</option>
                <option value="ECOMMERCE">E-Commerce</option><option value="D2C">D2C Brand</option>
                <option value="B2B">B2B / Enterprise</option><option value="MARKETPLACE">Marketplace</option>
              </select>
            </div>
          </div>

          {error && <div className="mt-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-sm border border-rose-200">{error}</div>}

          <button className="btn-primary w-full mt-6" onClick={submit} disabled={saving || !form.companyName || !form.email || !form.phone}>
            {saving ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
}
