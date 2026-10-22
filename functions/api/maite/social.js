// GET  /api/maite/social   The Instagram posts confirmed in Xarxes socials, in grid order (1 is the first to publish), and their captions
// POST /api/maite/social   { tpl, v, photo }  Adds a post at the end. photo: '' (the template's own) or an upload ('/photos/…')
// PUT  /api/maite/social   { order: [ids] }  New order; posts left out are removed. Or { copy: { id, text } }  The caption of one post
// Everything is one KV key, 'social' (lib/social.js).
import { json } from '../../../lib/booking.js';
import { SEED, load, store, view } from '../../../lib/social.js';

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
