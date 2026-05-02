import { useEffect, useState } from 'react';
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
    <div className="min-h-full">
      <div className="client-premium-main max-w-5xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Shape the white-label tracking experience your customers see after every shipment.</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Control your hosted tracking link, embed code, visual identity, and message template from one branded workspace.</p>
        </div>
      </div>
        <div className="client-premium-card p-5">
          <h1 className="font-bold text-slate-900 dark:text-white">White-Label Tracking Setup</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Share a hosted tracking link with your customers or embed the Sea Hawk tracker on your own website.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="client-premium-card p-5">
            <div className="text-xs text-slate-400 dark:text-slate-500 uppercase">Hosted Link</div>
            <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white break-all">{brand?.trackingUrl || 'Loading…'}</div>
            <div className="mt-4 flex gap-2">
              <button className="client-action-btn-primary" onClick={() => copy(brand?.trackingUrl || '', 'link')}>Copy Link</button>
              {brand?.trackingUrl && <a className="btn-secondary" href={brand.trackingUrl} target="_blank" rel="noreferrer">Open</a>}
            </div>
            {copied === 'link' && <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">Hosted link copied.</div>}
          </div>

          <div className="client-premium-card p-5">
            <div className="text-xs text-slate-400 dark:text-slate-500 uppercase">Embed Script</div>
            <pre className="mt-2 rounded-xl bg-slate-950 text-slate-100 text-xs p-4 overflow-x-auto whitespace-pre-wrap">{brand?.embedCode || 'Loading…'}</pre>
            <div className="mt-4">
              <button className="client-action-btn-primary" onClick={() => copy(brand?.embedCode || '', 'embed')}>Copy Embed Code</button>
            </div>
            {copied === 'embed' && <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">Embed code copied.</div>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="client-premium-card p-5 lg:col-span-2">
            <div className="font-bold text-slate-900 dark:text-white">Brand Studio</div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Customize logo, color, subdomain hint, and customer SMS template.</p>
            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1 block">Brand Name</label>
                <input className="input" value={form.brandName} onChange={(e) => setForm((p) => ({ ...p, brandName: e.target.value }))} placeholder="e.g. Acme Corp" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1 block">Logo URL</label>
                <input className="input" value={form.logoUrl} onChange={(e) => setForm((p) => ({ ...p, logoUrl: e.target.value }))} placeholder="https://example.com/logo.png" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1 block">Primary Brand Color</label>
                <div className="flex gap-2">
                  <input type="color" className="h-10 w-12 rounded bg-slate-100 border-none cursor-pointer p-1" value={form.brandColor} onChange={(e) => setForm((p) => ({ ...p, brandColor: e.target.value }))} />
                  <input className="input flex-1 font-mono uppercase" value={form.brandColor} onChange={(e) => setForm((p) => ({ ...p, brandColor: e.target.value }))} placeholder="#e8580a" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1 block">Subdomain Hint</label>
                <input className="input" value={form.subdomain} onChange={(e) => setForm((p) => ({ ...p, subdomain: e.target.value }))} placeholder="track.yourbrand.com" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1 block">SMS Template</label>
                <textarea className="input min-h-[90px]" value={form.smsTemplate} onChange={(e) => setForm((p) => ({ ...p, smsTemplate: e.target.value }))} placeholder="Your order {{awb}} is {{status}}." />
              </div>
            </div>
            <div className="mt-6 border-t border-slate-100 dark:border-slate-800/60 pt-4">
              <button className="client-action-btn-primary w-full md:w-auto" onClick={saveBrandSettings} disabled={saving}>{saving ? 'Saving…' : 'Save Brand Settings'}</button>
            </div>
          </div>

          {/* Live Preview Phone Mockup */}
          <div className="lg:col-span-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/20 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="border-[6px] border-slate-900 rounded-[2.5rem] bg-white overflow-hidden shadow-xl relative w-full max-w-[280px] h-[540px]">
              {/* Phone Notch */}
              <div className="absolute top-0 inset-x-0 h-5 bg-slate-900 rounded-b-xl w-32 mx-auto z-50"></div>
              
              {/* Fake Browser Top */}
              <div className="bg-slate-100 pt-7 pb-2 px-4 border-b border-slate-200">
                 <div className="text-[9px] text-center text-slate-400 font-mono bg-slate-200 rounded py-1 px-2 truncate">
                   {form.subdomain || 'track.yourbrand.com'}
                 </div>
              </div>

              {/* Simulated Tracking Page */}
              <div className="p-5 h-full bg-slate-50">
                 <div className="flex flex-col items-center justify-center pt-2 pb-6">
                   {form.logoUrl ? (
                     <img src={form.logoUrl} alt="Brand Logo" className="h-8 object-contain max-w-[150px]" onError={(e) => e.target.style.display = 'none'} />
                   ) : (
                     <div className="h-8 flex items-center justify-center font-black text-lg tracking-tight" style={{ color: form.brandColor }}>{form.brandName || 'Your Brand'}</div>
                   )}
                 </div>

                 <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 text-center">
                    <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Current Status</div>
                    <div className="text-xl font-black mt-1" style={{ color: form.brandColor }}>Out for Delivery</div>
                    <div className="text-xs text-slate-500 mt-2 font-mono bg-slate-50 py-1 rounded-md">AWB 1029384756</div>
                 </div>

                 <div className="mt-6 relative px-2">
                   <div className="absolute left-[13px] top-2 bottom-2 w-0.5" style={{ backgroundColor: form.brandColor, opacity: 0.15 }}></div>
                   
                   <div className="flex gap-4 relative mb-5">
                     <div className="w-3.5 h-3.5 rounded-full mt-0.5 border-2 bg-white z-10" style={{ borderColor: form.brandColor }}></div>
                     <div>
                       <div className="text-xs font-bold text-slate-800">Out for Delivery</div>
                       <div className="text-[10px] text-slate-400 mt-0.5">Today, 09:30 AM</div>
                     </div>
                   </div>

                   <div className="flex gap-4 relative mb-5 opacity-40 grayscale">
                     <div className="w-3.5 h-3.5 rounded-full mt-0.5 border-2 bg-slate-200 border-slate-200 z-10"></div>
                     <div>
                       <div className="text-xs font-bold text-slate-800">In Transit</div>
                       <div className="text-[10px] text-slate-400 mt-0.5">Yesterday, 14:15 PM</div>
                     </div>
                   </div>

                   <div className="flex gap-4 relative opacity-40 grayscale">
                     <div className="w-3.5 h-3.5 rounded-full mt-0.5 border-2 bg-slate-200 border-slate-200 z-10"></div>
                     <div>
                       <div className="text-xs font-bold text-slate-800">Order Booked</div>
                       <div className="text-[10px] text-slate-400 mt-0.5">2 days ago</div>
                     </div>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        <div className="client-premium-card p-5">
          <div className="font-bold text-slate-900 dark:text-white">Quick Notes</div>
          <ul className="mt-3 text-sm text-slate-600 dark:text-slate-300 list-disc pl-5 space-y-1">
            <li>Your customers can use the hosted link immediately.</li>
            <li>The embed widget can be dropped into Shopify, WordPress, or any custom site.</li>
            <li>A true custom domain like `track.yourbrand.com` still needs DNS/domain setup outside the portal.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
