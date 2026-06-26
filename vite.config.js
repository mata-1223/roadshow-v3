import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],
  server: {
    port: 5175,
    strictPort: true,
    host: '0.0.0.0',
    proxy: {
      '/api': { target: 'http://127.0.0.1:3002', changeOrigin: true },
      '/ws':  { target: 'ws://127.0.0.1:3002',   ws: true },
    },
  },
});