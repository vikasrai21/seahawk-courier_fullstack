import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// vite-plugin-ssg pre-renders public pages as static HTML at build time.
// Install: npm i -D vite-plugin-ssg
// Then replace `vite build` with `vite-ssg build` in your Railway build command.
let ssg = null;
try {
  // Gracefully skip if not installed yet
  ssg = require('vite-plugin-ssg').VitePluginSSG;
} catch {}

export default defineConfig({
  plugins: [
    react(),
    // SSG is opt-in — only active when vite-plugin-ssg is installed
    ...(ssg ? [ssg()] : []),
  ],

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: '../backend/public',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Manual chunk splitting — keeps bundles small
        manualChunks: {
          // Vendor libs — cached separately by browser
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts':   ['recharts'],
          'vendor-icons':    ['lucide-react'],
          'vendor-helmet':   ['react-helmet-async'],
          // Heavy app pages — each in its own chunk
          'page-rate-calc':  ['./src/pages/RateCalculatorPage.jsx'],
          'page-bulk':       ['./src/pages/BulkComparePage.jsx'],
          'page-import':     ['./src/pages/ImportPage.jsx'],
          'page-whatsapp':   ['./src/pages/WhatsAppPage.jsx'],
          'page-reconcile':  ['./src/pages/ReconciliationPage.jsx'],
          'page-landing':    ['./src/pages/public/LandingPage.jsx'],
        },
      },
    },
    // Warn if any chunk exceeds 500KB
    chunkSizeWarningLimit: 500,
  },

  // Pre-render these routes as static HTML (requires vite-plugin-ssg)
  ssgOptions: {
    script:  'async',
    formatting: 'minify',
    // Routes to pre-render
    includedRoutes: () => ['/', '/services', '/contact', '/track', '/book'],
    onFinished() {
      console.log('✅ SSG pre-rendering complete');
    },
  },
});
