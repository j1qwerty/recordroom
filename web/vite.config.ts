import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    // Dev-only convenience: proxying /api and /hubs to the deployed API keeps the
    // browser on one origin, so a developer does not need the API to list
    // http://localhost:5173 in its CORS allowlist. Build output is unaffected.
    proxy: process.env.RR_API_PROXY
      ? {
          '/api': { target: process.env.RR_API_PROXY, changeOrigin: true },
          '/hubs': { target: process.env.RR_API_PROXY, changeOrigin: true, ws: true },
        }
      : undefined,
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        // Each chunk is cached independently. Phosphor is a barrel of ~3000
        // icons, so it needs to be its own long-lived chunk rather than
        // inflating whichever page imports it first.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['motion'],
          icons: ['@phosphor-icons/react'],
          pretext: ['@chenglou/pretext'],
        },
      },
    },
  },
});
