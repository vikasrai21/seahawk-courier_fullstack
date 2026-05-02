import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { initWebVitals } from './utils/webVitals';
import './index.css';

// Register service worker for PWA support
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    // One-time safety cleanup so stale bundles don't survive deployments.
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((k) => k.startsWith('seahawk-')).map((k) => caches.delete(k)));
      }
    } catch {}

    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('SW registered:', reg.scope))
      .catch((err) => console.warn('SW failed:', err));
  });
}

if (import.meta.env.PROD) {
  initWebVitals();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>
);
