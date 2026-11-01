// /render/render.html#<post>: one Instagram image at full size, for the plan's posts that go out without anyone opening Maite.
// Cloudflare's browser opens it at the template's size and takes the screenshot (lib/render.js). The post comes in the hash
// as JSON: { tpl, v, photo, texts }, the same fields a post or a slide has. When it is drawn, #ready appears.
import { byId, loadBrandFonts, paint } from './social/paint';

async function draw() {
  const host = document.getElementById('art')!;
  let p: { tpl?: string; v?: number; photo?: string; texts?: (string | null)[] } = {};
  try { p = JSON.parse(decodeURIComponent(location.hash.slice(1))); } catch { /* nothing to draw */ }
  const t = p.tpl ? byId.get(p.tpl) : undefined;
  if (!t) { document.title = 'error'; return; }
  loadBrandFonts();
  host.style.cssText = `width: ${t.w}px; height: ${t.h}px; overflow: hidden;`;
  paint(host, t, Number(p.v) || 0, String(p.photo || ''), Array.isArray(p.texts) ? p.texts : undefined);
  await Promise.all([...host.querySelectorAll('img')].map(i => i.decode().catch(() => {})));
  // The fonts load when the text asks for them: wait for every face the image uses
  await Promise.all(['Le Monde Livre', 'Halyard Display', 'Pinyon Script'].map(f => document.fonts.load(`40px "${f}"`).catch(() => {})));
  await document.fonts.ready;
  const ready = document.createElement('div');
  ready.id = 'ready';
  ready.style.display = 'none';
  document.body.appendChild(ready);
}
draw();
