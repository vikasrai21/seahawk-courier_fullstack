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
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
          if (id.includes('recharts')) return 'vendor-charts';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('react-helmet-async')) return 'vendor-helmet';
          if (id.includes('exceljs')) return 'vendor-excel';
          return undefined;
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
