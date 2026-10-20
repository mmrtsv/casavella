// Maite (the back office) is a React app in maite-app/, built into dist/maite/ next to the public site.
// The public site (dist/index.html, img/, fonts/) comes from build.py; this build only touches dist/maite/.
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const api = process.env.MAITE_API || 'http://localhost:8788';

// The stylesheet goes inside index.html, so the frame paints without waiting for another request (phones, slow networks)
function inlineCss(): Plugin {
  return {
    name: 'maite-inline-css', apply: 'build', enforce: 'post',
    generateBundle(_, bundle) {
      const html = bundle['index.html'];
      if (!html || html.type !== 'asset') return;
      let out = String(html.source);
      for (const [name, file] of Object.entries(bundle)) {
        if (file.type !== 'asset' || !name.endsWith('.css')) continue;
        const link = new RegExp(`<link rel="stylesheet"[^>]*href="[^"]*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`);
        if (!link.test(out)) continue;
        out = out.replace(link, () => `<style>${String(file.source)}</style>`);
        delete bundle[name];
      }
      html.source = out;
    },
  };
}
export default defineConfig({
  root: 'maite-app',
  base: '/maite/',
  plugins: [react(), tailwindcss(), inlineCss()],
  build: { outDir: '../dist/maite', emptyOutDir: true, target: 'es2022', cssMinify: true, reportCompressedSize: true },
  // Local development against a running copy of the API (wrangler pages dev, or the test server)
  server: { proxy: { '/api': api, '/img': api, '/photos': api, '/fonts': api } },
});
