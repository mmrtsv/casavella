// GET  /api/maite/instagram   { connected, username } Whether Maite can publish, and as which account
// POST /api/maite/instagram   { id, image }  Publishes a post of the grid with its saved caption. image: its JPEG, already
//                             uploaded through /api/maite/photos ('/photos/…'); Instagram fetches it from the public web.
// Instagram API with Instagram Login (a professional account and a Meta app with instagram_business_basic and
// instagram_business_content_publish). The token starts as the INSTAGRAM_TOKEN secret; Maite renews it every week
// (long-lived tokens last 60 days) and keeps the renewed one in KV ('instagram').
import { json } from '../../../lib/booking.js';
import { load, store, view } from '../../../lib/social.js';

const base = env => 'https://graph.instagram.com/' + (env.IG_API_VERSION || 'v26.0');
const DAY = 864e5;

async function token(env) {
  const secret = env.INSTAGRAM_TOKEN;
  if (!secret) return null;
  const saved = JSON.parse((await env.MAITE?.get('instagram')) || 'null');
  // A new secret (after reconnecting) replaces whatever was renewed from the old one
  const own = saved && saved.from === secret.slice(-16);
  let t = own ? saved.token : secret;
  if (env.MAITE && (!own || Date.now() - Date.parse(saved.at) > 7 * DAY)) {
    const r = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(t)}`);
    const d = await r.json().catch(() => ({}));
    // A token less than a day old can't be renewed yet: try again tomorrow
    const at = r.ok && d.access_token ? new Date() : new Date(Date.now() - 6 * DAY);
    if (r.ok && d.access_token) t = d.access_token;
    await env.MAITE.put('instagram', JSON.stringify({ token: t, from: secret.slice(-16), at: at.toISOString() }));
  }
  return t;
}

async function ig(env, t, path, body) {
  const r = await fetch(base(env) + path, {
    method: body ? 'POST' : 'GET',
    headers: { authorization: 'Bearer ' + t, 'content-type': 'application/json' },
    body: body && JSON.stringify(body),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error) throw new Error(d.error?.error_user_msg || d.error?.message || `Instagram ${r.status}`);
  return d;
}

export async function onRequestGet({ env }) {
  const t = await token(env).catch(() => null);
  if (!t) return json({ connected: false });
  try { const me = await ig(env, t, '/me?fields=user_id,username'); return json({ connected: true, username: me.username }); }
  catch (e) { return json({ connected: false, detail: e.message }); }
}

export async function onRequestPost({ request, env, data }) {
  if (!env.MAITE) return json({ error: 'not_configured' }, 503);
  let b;
  try { b = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  if (!/^\/photos\/[0-9a-f-]{36}\.jpg$/.test(b?.image || '')) return json({ error: 'bad_request' }, 400);
  const t = await token(env);
  if (!t) return json({ error: 'ig_not_configured' }, 503);
  const S = await load(env), post = S.posts.find(p => p.id === b.id);
  if (!post) return json({ error: 'bad_request' }, 400);
  if (post.published) return json({ error: 'ig_published' }, 409);

  const site = (env.SITE_URL || 'https://casavellarural.com').replace(/\/$/, '');
  try {
    const me = await ig(env, t, '/me?fields=user_id');
    const box = await ig(env, t, `/${me.user_id}/media`, { image_url: site + b.image, caption: S.copies[post.id] || '' });
    // Instagram fetches the image first; a photo is usually ready within seconds
    for (let i = 0; i < 10; i++) {
      const st = await ig(env, t, `/${box.id}?fields=status_code`);
      if (st.status_code === 'FINISHED') break;
      if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') throw new Error("Instagram no ha pogut llegir la imatge");
      if (i === 9) throw new Error('Instagram encara està preparant la imatge. Torna-ho a provar d\'aquí a un minut.');
      await new Promise(r => setTimeout(r, 2000));
    }
    const media = await ig(env, t, `/${me.user_id}/media_publish`, { creation_id: box.id });
    const link = await ig(env, t, `/${media.id}?fields=permalink`).catch(() => ({}));
    // Read again: the grid may have changed while Instagram worked
    const now = await load(env), p = now.posts.find(x => x.id === post.id);
    if (p) p.published = { at: new Date().toISOString(), media: media.id, url: link.permalink || '', image: b.image };
    await store(env, now, data.user);
    return view(now, env);
  } catch (e) {
    return json({ error: 'ig', detail: e.message }, 502);
  }
}
