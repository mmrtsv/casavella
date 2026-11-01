// The page that draws one Instagram image for the server (maite-app/render.html, see lib/render.js), built into dist/render/.
// It is public on the web's domain, unlike Maite: Cloudflare's browser opens it without signing in. It only holds the templates.
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'maite-app',
  base: '/render/',
  publicDir: false,
  build: { outDir: '../dist/render', emptyOutDir: true, target: 'es2022', rollupOptions: { input: 'maite-app/render.html' } },
});
