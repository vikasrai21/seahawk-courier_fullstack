import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function ClientBrandTrackingPage({ toast }) {
  const [brand, setBrand] = useState(null);
  const [copied, setCopied] = useState('');
  const [form, setForm] = useState({ brandName: '', brandColor: '#e8580a', logoUrl: '', subdomain: '', smsTemplate: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/portal/branding');
        const b = res.data?.brand || null;
        setBrand(b);
        if (b) {
          setForm({
            brandName: b.company || '',
            brandColor: b.brandColor || '#e8580a',
            logoUrl: b.logoUrl || '',
            subdomain: b.subdomain || '',
            smsTemplate: b.smsTemplate || '',
          });
        }
      } catch (err) {
        toast?.(err.message || 'Failed to load branding details', 'error');
      }
    };
    load();
  }, []);

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast?.('Copied', 'success');
    } catch {
      toast?.('Copy failed', 'error');
    }
  };

  const saveBrandSettings = async () => {
    setSaving(true);
    try {
      const res = await api.post('/portal/branding', form);
      toast?.(res.message || 'Brand settings updated', 'success');
      const latest = await api.get('/portal/branding');
      const b = latest.data?.brand || null;
      setBrand(b);
    } catch (err) {
      toast?.(err.message || 'Failed to save brand settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen client-premium-shell">
      <header className="client-premium-header px-6 py-4 flex items-center gap-3">
        <Link to="/portal" className="text-gray-400 hover:text-gray-600">← Portal</Link>
        <span className="client-premium-title text-lg">Client-Branded Tracking</span>
      </header>

      <div className="client-premium-main max-w-5xl">
        <div className="client-premium-card p-5">
          <h1 className="font-bold text-gray-900">White-Label Tracking Setup</h1>
          <p className="text-sm text-gray-500 mt-1">Share a hosted tracking link with your customers or embed the Sea Hawk tracker on your own website.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="client-premium-card p-5">
            <div className="text-xs text-gray-400 uppercase">Hosted Link</div>
            <div className="mt-2 text-sm font-semibold text-gray-900 break-all">{brand?.trackingUrl || 'Loading…'}</div>
            <div className="mt-4 flex gap-2">
              <button className="btn-primary" onClick={() => copy(brand?.trackingUrl || '', 'link')}>Copy Link</button>
              {brand?.trackingUrl && <a className="btn-secondary" href={brand.trackingUrl} target="_blank" rel="noreferrer">Open</a>}
            </div>
            {copied === 'link' && <div className="mt-2 text-xs text-green-600">Hosted link copied.</div>}
          </div>

          <div className="client-premium-card p-5">
            <div className="text-xs text-gray-400 uppercase">Embed Script</div>
            <pre className="mt-2 rounded-xl bg-gray-950 text-gray-100 text-xs p-4 overflow-x-auto whitespace-pre-wrap">{brand?.embedCode || 'Loading…'}</pre>
            <div className="mt-4">
              <button className="btn-primary" onClick={() => copy(brand?.embedCode || '', 'embed')}>Copy Embed Code</button>
            </div>
            {copied === 'embed' && <div className="mt-2 text-xs text-green-600">Embed code copied.</div>}
          </div>
        </div>

        <div className="client-premium-card p-5">
          <div className="font-bold text-gray-900">Brand Studio</div>
          <p className="text-sm text-gray-500 mt-1">Customize logo, color, subdomain hint, and customer SMS template.</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="input" value={form.brandName} onChange={(e) => setForm((p) => ({ ...p, brandName: e.target.value }))} placeholder="Brand name" />
            <input className="input" value={form.logoUrl} onChange={(e) => setForm((p) => ({ ...p, logoUrl: e.target.value }))} placeholder="Logo URL" />
            <input className="input" value={form.brandColor} onChange={(e) => setForm((p) => ({ ...p, brandColor: e.target.value }))} placeholder="#e8580a" />
            <input className="input" value={form.subdomain} onChange={(e) => setForm((p) => ({ ...p, subdomain: e.target.value }))} placeholder="track.yourbrand.com (hint)" />
            <textarea className="input md:col-span-2 min-h-[90px]" value={form.smsTemplate} onChange={(e) => setForm((p) => ({ ...p, smsTemplate: e.target.value }))} placeholder="SMS template for delivery updates" />
          </div>
          <div className="mt-4">
            <button className="btn-primary" onClick={saveBrandSettings} disabled={saving}>{saving ? 'Saving…' : 'Save Brand Settings'}</button>
          </div>
        </div>

        <div className="client-premium-card p-5">
          <div className="font-bold text-gray-900">Quick Notes</div>
          <ul className="mt-3 text-sm text-gray-600 list-disc pl-5 space-y-1">
            <li>Your customers can use the hosted link immediately.</li>
            <li>The embed widget can be dropped into Shopify, WordPress, or any custom site.</li>
            <li>A true custom domain like `track.yourbrand.com` still needs DNS/domain setup outside the portal.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
