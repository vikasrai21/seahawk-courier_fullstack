import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        // Dev: proxy /api → backend at :3001
        '/api': {
          target:       env.VITE_API_URL?.startsWith('http') ? env.VITE_API_URL.replace('/api', '') : 'http://localhost:3001',
          changeOrigin: true,
          secure:       false,
        },
      },
    },
    build: {
      outDir:    'dist',
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor:   ['react', 'react-dom', 'react-router-dom'],
            charts:   ['recharts'],
            xlsx:     ['xlsx'],
          },
        },
      },
    },
  };
});
