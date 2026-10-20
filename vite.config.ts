// Maite (the back office) is a React app in maite-app/, built into dist/maite/ next to the public site.
// The public site (dist/index.html, img/, fonts/) comes from build.py; this build only touches dist/maite/.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const api = process.env.MAITE_API || 'http://localhost:8788';
export default defineConfig({
  root: 'maite-app',
  base: '/maite/',
  plugins: [react(), tailwindcss()],
  build: { outDir: '../dist/maite', emptyOutDir: true, target: 'es2022', cssMinify: true, reportCompressedSize: true },
  // Local development against a running copy of the API (wrangler pages dev, or the test server)
  server: { proxy: { '/api': api, '/img': api, '/photos': api, '/fonts': api } },
});
