import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function ClientBrandTrackingPage({ toast }) {
  const [brand, setBrand] = useState(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/portal/branding');
        setBrand(res.data?.brand || null);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link to="/portal" className="text-gray-400 hover:text-gray-600">← Portal</Link>
        <span className="font-bold text-gray-900">Client-Branded Tracking</span>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-5">
        <div className="card">
          <h1 className="font-bold text-gray-900">White-Label Tracking Setup</h1>
          <p className="text-sm text-gray-500 mt-1">Share a hosted tracking link with your customers or embed the Sea Hawk tracker on your own website.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card">
            <div className="text-xs text-gray-400 uppercase">Hosted Link</div>
            <div className="mt-2 text-sm font-semibold text-gray-900 break-all">{brand?.trackingUrl || 'Loading…'}</div>
            <div className="mt-4 flex gap-2">
              <button className="btn-primary" onClick={() => copy(brand?.trackingUrl || '', 'link')}>Copy Link</button>
              {brand?.trackingUrl && <a className="btn-secondary" href={brand.trackingUrl} target="_blank" rel="noreferrer">Open</a>}
            </div>
            {copied === 'link' && <div className="mt-2 text-xs text-green-600">Hosted link copied.</div>}
          </div>

          <div className="card">
            <div className="text-xs text-gray-400 uppercase">Embed Script</div>
            <pre className="mt-2 rounded-xl bg-gray-950 text-gray-100 text-xs p-4 overflow-x-auto whitespace-pre-wrap">{brand?.embedCode || 'Loading…'}</pre>
            <div className="mt-4">
              <button className="btn-primary" onClick={() => copy(brand?.embedCode || '', 'embed')}>Copy Embed Code</button>
            </div>
            {copied === 'embed' && <div className="mt-2 text-xs text-green-600">Embed code copied.</div>}
          </div>
        </div>

        <div className="card">
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
