// ContactPage.jsx — Contact us page as React component
import { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from './PublicLayout';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', contact: '', subj: 'General Enquiry', msg: '' });
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState('');

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function sendContact(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.contact.trim()) { setFormError('Please fill in your name and contact details.'); return; }
    setFormError('');
    const text = `Hi Sea Hawk!\n\nName: ${form.name}\nContact: ${form.contact}\nSubject: ${form.subj}\nMessage: ${form.msg || '—'}`;
    window.open(`https://wa.me/919911565523?text=${encodeURIComponent(text)}`, '_blank');
    setSent(true);
    setTimeout(() => setSent(false), 5000);
  }

  return (
    <PublicLayout>
      {/* ── PAGE HERO ── */}
      <section style={{ background: 'var(--navy)', padding: '80px 0 60px', borderBottom: '3px solid var(--orange)' }}>
        <div className="wrap" style={{ textAlign: 'center' }}>
          <div className="pill pill-orange" style={{ display: 'inline-block', marginBottom: 16 }}>Get in Touch</div>
          <h1 className="h-display" style={{ color: '#fff', margin: '0 0 16px' }}>Contact <span>Sea Hawk</span></h1>
          <p style={{ color: 'rgba(255,255,255,.7)', fontSize: '1.05rem', maxWidth: 500, margin: '0 auto' }}>
            Questions about rates, pickups, or tracking? We're here 6 days a week with emergency support 24×7.
          </p>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 40, alignItems: 'start' }}>

            {/* ── Contact Details ── */}
            <div>
              <h2 style={{ fontFamily: 'inherit', fontSize: '1.3rem', fontWeight: 800, color: 'var(--ink)', marginBottom: 24 }}>Reach Us Directly</h2>
              {[
                { icon: '📞', title: 'Phone (Primary)', lines: [<a key="1" href="tel:+919911565523">+91 99115 65523</a>, <a key="2" href="tel:+919911555534">+91 99115 55534</a>] },
                { icon: '📞', title: 'Phone (Secondary)', lines: [<a key="3" href="tel:+918368201122">+91 83682 01122</a>] },
                { icon: '💬', title: 'WhatsApp', lines: [<a key="4" href="https://wa.me/919911565523" target="_blank" rel="noreferrer">+91 99115 65523 — Chat Now</a>] },
                { icon: '📍', title: 'Office Address', lines: ['Shop 6 & 7, Rao Lal Singh Market', 'Sector-18, Gurugram – 122015', 'Haryana, India'] },
                { icon: '🕐', title: 'Business Hours', lines: ['Mon–Sat: 9:00 AM – 7:00 PM', 'Emergency: 24×7'] },
              ].map(({ icon, title, lines }) => (
                <div key={title} style={{ display: 'flex', gap: 16, marginBottom: 20, padding: '16px', background: '#fff', borderRadius: 'var(--r-lg)', border: '1.5px solid var(--border-l)', boxShadow: 'var(--sh-xs)' }}>
                  <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: '.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--ink-3)', marginBottom: 4 }}>{title}</div>
                    {lines.map((line, i) => (
                      <div key={i} style={{ fontSize: '.9rem', color: 'var(--ink)', fontWeight: 600, lineHeight: 1.6 }}>{line}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Contact Form ── */}
            <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1.5px solid var(--border-l)', boxShadow: 'var(--sh-md)', padding: '32px' }}>
              <h2 style={{ fontFamily: 'inherit', fontSize: '1.3rem', fontWeight: 800, color: 'var(--ink)', marginBottom: 8 }}>Send Us a Message</h2>
              <p style={{ fontSize: '.8rem', color: 'var(--ink-3)', marginBottom: 24 }}>We'll get back to you via WhatsApp within 1 business hour.</p>
              <form onSubmit={sendContact} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="fg">
                    <label htmlFor="name">Your Name *</label>
                    <input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Full Name" required />
                  </div>
                  <div className="fg">
                    <label htmlFor="contact">Phone / Email *</label>
                    <input id="contact" name="contact" value={form.contact} onChange={handleChange} placeholder="+91 or email" required />
                  </div>
                </div>
                <div className="fg">
                  <label htmlFor="subj">Subject</label>
                  <select id="subj" name="subj" value={form.subj} onChange={handleChange}>
                    <option>General Enquiry</option>
                    <option>Get a Rate Quote</option>
                    <option>Book Pickup</option>
                    <option>Tracking Issue</option>
                    <option>Billing / Invoice</option>
                    <option>Open Business Account</option>
                    <option>Complaint</option>
                  </select>
                </div>
                <div className="fg">
                  <label htmlFor="msg">Message</label>
                  <textarea id="msg" name="msg" value={form.msg} onChange={handleChange} placeholder="Tell us more about your requirement..." rows={4} style={{ resize: 'vertical' }} />
                </div>
                {sent && (
                  <div style={{ padding: '10px 14px', background: 'var(--green-bg)', borderRadius: 'var(--r)', fontSize: '.85rem', color: 'var(--green)', fontWeight: 600 }}>
                    ✅ Message sent! We'll reply on WhatsApp shortly.
                  </div>
                )}
                {!!formError && (
                  <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--r)', fontSize: '.85rem', color: '#b91c1c', fontWeight: 600 }}>
                    {formError}
                  </div>
                )}
                <button type="submit" style={{ padding: '13px', background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 'var(--r)', fontSize: '.95rem', fontWeight: 800, cursor: 'pointer' }}>
                  💬 Send via WhatsApp
                </button>
                <p style={{ fontSize: '.72rem', color: 'var(--ink-4)', textAlign: 'center', margin: 0 }}>
                  This opens WhatsApp with your message pre-filled. Requires WhatsApp on your device.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
