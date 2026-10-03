import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
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
