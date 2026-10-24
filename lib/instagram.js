// Publishing to Instagram, shared by /api/maite/instagram (Publica ara), /api/maite/social (programs that are due when Maite
// is open) and /api/social-cron (programs that are due, every few minutes).
// Instagram API with Instagram Login (a professional account and a Meta app with instagram_business_basic and
// instagram_business_content_publish). The token starts as the INSTAGRAM_TOKEN secret; Maite renews it every week
// (long-lived tokens last 60 days) and keeps the renewed one in KV ('instagram').
import { load, store } from './social.js';

const base = env => 'https://graph.instagram.com/' + (env.IG_API_VERSION || 'v26.0');
const DAY = 864e5;
export const IMAGE = /^\/photos\/[0-9a-f-]{36}\.jpg$/;
// The JPEGs of a post from a request or a program: images (one per slide, up to 10) or a single image. null if any is wrong
export function imagesOf(b) {
  const list = b?.images != null ? [].concat(b.images) : [b?.image];
  return list.length && list.length <= 10 && list.every(i => IMAGE.test(i || '')) ? list : null;
}

export async function token(env) {
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

export async function ig(env, t, path, body) {
  const r = await fetch(base(env) + path, {
    method: body ? 'POST' : 'GET',
    headers: { authorization: 'Bearer ' + t, 'content-type': 'application/json' },
    body: body && JSON.stringify(body),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error) throw new Error(d.error?.error_user_msg || d.error?.message || `Instagram ${r.status}`);
  return d;
}

// Instagram fetches an image first; a photo is usually ready within seconds
async function ready(env, t, box) {
  for (let i = 0; i < 10; i++) {
    const st = await ig(env, t, `/${box}?fields=status_code`);
    if (st.status_code === 'FINISHED') return;
    if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') throw new Error("Instagram no ha pogut llegir la imatge");
    if (i === 9) throw new Error('Instagram encara està preparant la imatge. Torna-ho a provar d\'aquí a un minut.');
    await new Promise(r => setTimeout(r, 2000));
  }
}

// Posts one post of the grid with its saved caption. images: its JPEGs on the site's photo storage, which Instagram fetches;
// more than one makes a carousel (one container per image, then the carousel with them). image, a single one, still works.
// A story goes out as a story, without caption (Instagram's API can't add stickers, so no link either).
// Returns the grid as it is afterwards; throws with Instagram's message when it fails.
export async function publish(env, t, id, images, user) {
  images = [].concat(images);
  const S = await load(env), post = S.posts.find(p => p.id === id);
  if (!post || post.published) return S;
  const site = (env.SITE_URL || 'https://casavellarural.com').replace(/\/$/, '');
  const me = await ig(env, t, '/me?fields=user_id'), caption = S.copies[post.id] || '';
  let box;
  if (post.story) box = (await ig(env, t, `/${me.user_id}/media`, { image_url: site + images[0], media_type: 'STORIES' })).id;
  else if (images.length === 1) box = (await ig(env, t, `/${me.user_id}/media`, { image_url: site + images[0], caption })).id;
  else {
    const children = [];
    for (const i of images) children.push((await ig(env, t, `/${me.user_id}/media`, { image_url: site + i, is_carousel_item: true })).id);
    for (const c of children) await ready(env, t, c);
    box = (await ig(env, t, `/${me.user_id}/media`, { media_type: 'CAROUSEL', children: children.join(','), caption })).id;
  }
  await ready(env, t, box);
  const media = await ig(env, t, `/${me.user_id}/media_publish`, { creation_id: box });
  const link = await ig(env, t, `/${media.id}?fields=permalink`).catch(() => ({}));
  // Read again: the grid may have changed while Instagram worked
  const now = await load(env), p = now.posts.find(x => x.id === post.id);
  if (p) { p.published = { at: new Date().toISOString(), media: media.id, url: link.permalink || '', image: images[0] }; delete p.schedule; }
  await store(env, now, user);
  await env.MAITE.delete('instagram-media');
  return now;
}

// Programmed posts whose time has come. Each one is marked as started first, so two runs at once don't post it twice;
// a failure is kept on the post for Maite to show, and it is not tried again until it is programmed again.
export async function runDue(env) {
  if (!env.MAITE) return 0;
  const S = await load(env), now = Date.now();
  const due = S.posts.filter(p => !p.published && p.schedule && !p.schedule.error && Date.parse(p.schedule.at) <= now
    && !(p.schedule.started && now - Date.parse(p.schedule.started) < 10 * 60e3));
  if (!due.length) return 0;
  const t = await token(env);
  if (!t) return 0;
  for (const p of due) p.schedule.started = new Date().toISOString();
  await store(env, S, 'programat');
  let n = 0;
  for (const p of due) {
    try { await publish(env, t, p.id, p.schedule.images || [p.schedule.image], 'programat'); n++; }
    catch (e) {
      const A = await load(env), q = A.posts.find(x => x.id === p.id);
      if (q?.schedule) { delete q.schedule.started; q.schedule.error = String(e.message || e).slice(0, 300); await store(env, A, 'programat'); }
    }
  }
  return n;
}
