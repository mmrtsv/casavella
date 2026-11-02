// The images of a planned post drawn on the server, so the plan goes out even when nobody opens Maite (lib/plan.js).
// Cloudflare's Browser Rendering (REST API) opens /render/render#<post> (Pages serves render.html there) on the web (dist/render/, maite-app/src/render.ts)
// at the template's size and returns the screenshot as a JPEG, which goes to R2 (PHOTOS) like an upload from Maite.
// Needs CF_ACCOUNT_ID and CF_RENDER_TOKEN (an API token with Browser Rendering: Edit). Without them, Maite draws the images
// itself the next time it is opened (web and app), as it does when someone programs a post.
import { TEMPLATES } from '../maite-app/src/social/templates.ts';

export const canRender = env => !!(env.CF_ACCOUNT_ID && env.CF_RENDER_TOKEN && env.PHOTOS);

// One image (a post or a slide: { tpl, v, photo, texts }) → its address on the web ('/photos/….jpg')
export async function shoot(env, x) {
  const t = TEMPLATES.find(t => t.id === x.tpl);
  if (!t) throw new Error('template ' + x.tpl);
  const site = (env.SITE_URL || 'https://casavellarural.com').replace(/\/$/, '');
  const post = { tpl: x.tpl, v: x.v || 0, photo: x.photo || '', texts: x.texts || [] };
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/browser-rendering/screenshot`, {
    method: 'POST',
    headers: { authorization: 'Bearer ' + env.CF_RENDER_TOKEN, 'content-type': 'application/json' },
    body: JSON.stringify({
      url: `${site}/render/render#${encodeURIComponent(JSON.stringify(post))}`,
      viewport: { width: t.w, height: t.h, deviceScaleFactor: 1 },
      gotoOptions: { waitUntil: 'networkidle0', timeout: 30000 },
      waitForSelector: { selector: '#ready', timeout: 20000 },
      screenshotOptions: { type: 'jpeg', quality: 92 },
    }),
  });
  const type = r.headers.get('content-type') || '';
  if (!r.ok || !type.startsWith('image/')) {
    const d = await r.json().catch(() => ({}));
    throw new Error('render ' + r.status + ' ' + (d.errors?.[0]?.message || ''));
  }
  const key = `${crypto.randomUUID()}.jpg`;
  await env.PHOTOS.put(key, await r.arrayBuffer(), { httpMetadata: { contentType: 'image/jpeg', cacheControl: 'public, max-age=31536000, immutable' }, customMetadata: { by: 'pla' } });
  return '/photos/' + key;
}

// Every image of a post: the post, then the slides of a carousel
export const imagesOfPost = p => [p, ...(p.slides || [])];
