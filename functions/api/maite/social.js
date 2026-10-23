// GET  /api/maite/social   The Instagram posts confirmed in Xarxes socials, in grid order (1 is the first to publish), and their captions
// POST /api/maite/social   { tpl, v, photo }  Adds a post at the end. photo: '' (the template's own) or an upload ('/photos/…')
// PUT  /api/maite/social   { order: [ids] }  New order; posts left out are removed. Or { copy: { id, text } }  The caption of one post.
//                          Or { date: { id, date } }  The day a post is planned for ('' to clear, and its program with it);
//                          planned posts follow their dates.
//                          Or { schedule: { id, at, image } }  Programs a post: at, when (ISO); image, its JPEG already uploaded
//                          ('/photos/…'). Its day becomes the day of at in Barcelona. Without at, the program is cancelled.
// Opening the grid also publishes programs that are already due (lib/instagram.js), in case the cron hasn't yet.
// Everything is one KV key, 'social' (lib/social.js).
import { json } from '../../../lib/booking.js';
import { SEED, load, store, view } from '../../../lib/social.js';
import { IMAGE, runDue } from '../../../lib/instagram.js';

async function body(request) { try { return await request.json(); } catch { return null; } }

// The day of a moment in Barcelona, as YYYY-MM-DD
const dayOf = at => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date(at));

export async function onRequestGet({ env, waitUntil }) {
  if (!env.MAITE) return json({ ...SEED, ai: !!env.ANTHROPIC_API_KEY });
  waitUntil(runDue(env).catch(() => {}));
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

// Dated posts come first, by day (and time, when programmed), so the numbers in Perfil follow the calendar; the rest keep
// their order after them
function follow(S) {
  const planned = S.posts.filter(p => !p.published), done = S.posts.filter(p => p.published);
  const when = p => p.date + (p.schedule ? p.schedule.at.slice(10) : 'T99');
  const dated = planned.filter(p => p.date).sort((x, y) => when(x).localeCompare(when(y)));
  S.posts = [...dated, ...planned.filter(p => !p.date), ...done];
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
  } else if (b.date && S.posts.some(p => p.id === b.date.id)) {
    const date = String(b.date.date || '');
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: 'bad_request' }, 400);
    const post = S.posts.find(p => p.id === b.date.id);
    if (date) post.date = date; else delete post.date;
    // A program is for one moment: moving the day without a new time cancels it (Maite sends a new program instead)
    if (post.schedule && dayOf(post.schedule.at) !== date) delete post.schedule;
    follow(S);
  } else if (b.schedule && S.posts.some(p => p.id === b.schedule.id && !p.published)) {
    const post = S.posts.find(p => p.id === b.schedule.id);
    if (!b.schedule.at) delete post.schedule;
    else {
      const at = Date.parse(b.schedule.at);
      if (!(at > Date.now() - 60e3 && at < Date.now() + 400 * 864e5) || !IMAGE.test(b.schedule.image || '')) return json({ error: 'bad_request' }, 400);
      post.schedule = { at: new Date(at).toISOString(), image: b.schedule.image, by: data.user };
      post.date = dayOf(at);
    }
    follow(S);
  } else return json({ error: 'bad_request' }, 400);
  await store(env, S, data.user);
  return view(S, env);
}
