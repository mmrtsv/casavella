// GET  /api/maite/social   The Instagram posts confirmed in Xarxes socials, in grid order (1 is the first to publish), and their captions
// POST /api/maite/social   { tpl, v, photo }  Adds a post at the end. photo: '' (the template's own) or an upload ('/photos/…')
// PUT  /api/maite/social   { order: [ids] }  New order; posts left out are removed. Or { copy: { id, text } }  The caption of one post
// Everything is one KV key, 'social'.
import { json } from '../../../lib/booking.js';

// The grid planned in the first Instagram mock-up (artifact), in publishing order: Maite starts from it until its own is saved
const SEED = { posts: [
  { id: 'grid01', tpl: 'PostLogo', v: 0, photo: '', at: '2026-10-21T22:11:40Z' },
  { id: 'grid02', tpl: 'CarouselSlide', v: 0, photo: '', at: '2026-10-21T22:12:44Z' },
  { id: 'grid03', tpl: 'PostRoom', v: 0, photo: '', at: '2026-10-21T22:25:21Z' },
  { id: 'grid04', tpl: 'PostSplit', v: 0, photo: '', at: '2026-10-21T22:29:15Z' },
  { id: 'grid05', tpl: 'PostQuote', v: 2, photo: '', at: '2026-10-21T22:20:53Z' },
  { id: 'grid06', tpl: 'CarouselSlide', v: 3, photo: '', at: '2026-10-21T22:31:01Z' },
  { id: 'grid07', tpl: 'PostRestaurantPlain', v: 0, photo: '', at: '2026-10-21T22:33:58Z' },
  { id: 'grid08', tpl: 'PostGradient', v: 1, photo: '', at: '2026-10-21T22:18:20Z' },
  { id: 'grid09', tpl: 'PostAward', v: 0, photo: '', at: '2026-10-21T22:31:44Z' },
], copies: {} };
const EMPTY = { posts: [], copies: {} };
// Posts confirmed in Maite before the grid was brought over go after it, once; after the next save it is never added again
async function load(env) {
  const S = { ...EMPTY, ...JSON.parse((await env.MAITE.get('social')) || 'null') };
  if (!S.seeded) S.posts = [...SEED.posts, ...S.posts.filter(p => !SEED.posts.some(x => x.id === p.id))];
  return S;
}
const store = (env, S, user) => env.MAITE.put('social', JSON.stringify({ posts: S.posts, copies: S.copies, seeded: true, by: user, at: new Date().toISOString() }));
const view = (S, env) => json({ posts: S.posts, copies: S.copies, ai: !!env.ANTHROPIC_API_KEY });

async function body(request) { try { return await request.json(); } catch { return null; } }

export async function onRequestGet({ env }) {
  if (!env.MAITE) return json({ ...SEED, ai: !!env.ANTHROPIC_API_KEY });
  return view(await load(env), env);
}

export async function onRequestPost({ request, env, data }) {
  if (!env.MAITE) return json({ error: 'not_configured' }, 503);
  const b = await body(request);
  if (!b || !/^[A-Za-z]{2,40}$/.test(b.tpl || '')) return json({ error: 'bad_request' }, 400);
  const v = Number(b.v || 0), photo = String(b.photo || '');
  if (!Number.isInteger(v) || v < 0 || v > 99 || photo && !/^\/photos\/[\w-]+\.(jpg|webp|png)$/.test(photo)) return json({ error: 'bad_request' }, 400);
  const S = await load(env);
  if (S.posts.length >= 150) return json({ error: 'social_full' }, 400);
  S.posts.push({ id: crypto.randomUUID().slice(0, 8), tpl: b.tpl, v, photo, at: new Date().toISOString(), by: data.user });
  await store(env, S, data.user);
  return view(S, env);
}

export async function onRequestPut({ request, env, data }) {
  if (!env.MAITE) return json({ error: 'not_configured' }, 503);
  const b = await body(request);
  if (!b) return json({ error: 'bad_request' }, 400);
  const S = await load(env);
  if (Array.isArray(b.order)) {
    const byId = new Map(S.posts.map(p => [p.id, p]));
    S.posts = [...new Set(b.order.map(String))].map(id => byId.get(id)).filter(Boolean);
    const keep = new Set(S.posts.map(p => p.id));
    S.copies = Object.fromEntries(Object.entries(S.copies).filter(([id]) => keep.has(id)));
  } else if (b.copy && S.posts.some(p => p.id === b.copy.id)) {
    const text = String(b.copy.text || '').trim().slice(0, 4000);
    if (text) S.copies[b.copy.id] = text; else delete S.copies[b.copy.id];
  } else return json({ error: 'bad_request' }, 400);
  await store(env, S, data.user);
  return view(S, env);
}
