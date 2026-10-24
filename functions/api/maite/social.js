// GET  /api/maite/social   The Instagram posts confirmed in Xarxes socials, in grid order (1 is the first to publish), their captions
//                          and templates: the words changed on each template ({ [tpl]: texts }), which new posts start from
// POST /api/maite/social   { tpl, v, photo, texts, copy }  Adds a post at the end. photo: '' (the template's own), an upload
//                          ('/photos/…') or one of the library ('/maite/social/…'). texts: its own words on the image, one per
//                          text line of the template (null keeps the template's). copy: its caption, if it already has one.
// PUT  /api/maite/social   { order: [ids] }  New order; posts left out are removed. Or { copy: { id, text } }  The caption of one post.
//                          Or { date: { id, date } }  The day a post is planned for ('' to clear, and its program with it);
//                          planned posts follow their dates.
//                          Or { schedule: { id, at, image } }  Programs a post: at, when (ISO); image, its JPEG already uploaded
//                          ('/photos/…'). Its day becomes the day of at in Barcelona. Without at, the program is cancelled.
//                          Or { edit: { id, v, photo, texts, image } }  Changes a post that isn't published; a programmed one needs
//                          image, its new JPEG, which replaces the one the program publishes.
//                          Or { template: { id, texts } }  The words changed on a template, for what is made from it next ([] to undo).
// Opening the grid also publishes programs that are already due (lib/instagram.js), in case the cron hasn't yet.
// Everything is one KV key, 'social' (lib/social.js).
import { json } from '../../../lib/booking.js';
import { SEED, load, store, view } from '../../../lib/social.js';
import { IMAGE, runDue } from '../../../lib/instagram.js';

async function body(request) { try { return await request.json(); } catch { return null; } }

const TPL = /^[A-Za-z]{2,40}$/, PHOTO = /^\/(photos|maite\/social)\/[\w-]+\.(jpg|webp|png)$/;
// Words on the image, one per text line (null keeps the template's): [] when there are none, null when they don't look like it
function words(t) {
  if (t == null) return [];
  const texts = [].concat(t);
  if (texts.length > 20 || texts.some(x => x !== null && (typeof x !== 'string' || x.length > 300))) return null;
  return texts.some(x => x != null) ? texts : [];
}
// The variation, photo and words of a post, or null
const look = b => {
  const v = Number(b.v || 0), photo = String(b.photo || ''), texts = words(b.texts);
  return Number.isInteger(v) && v >= 0 && v <= 99 && !(photo && !PHOTO.test(photo)) && texts ? { v, photo, texts } : null;
};

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
  const l = b && TPL.test(b.tpl || '') && look(b);
  if (!l) return json({ error: 'bad_request' }, 400);
  const S = await load(env);
  if (S.posts.length >= 150) return json({ error: 'social_full' }, 400);
  const id = crypto.randomUUID().slice(0, 8);
  S.posts.push({ id, tpl: b.tpl, v: l.v, photo: l.photo, ...(l.texts.length ? { texts: l.texts } : {}), at: new Date().toISOString(), by: data.user });
  const copy = String(b.copy || '').trim().slice(0, 4000);
  if (copy) S.copies[id] = copy;
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
  } else if (b.edit && S.posts.some(p => p.id === b.edit.id && !p.published)) {
    const post = S.posts.find(p => p.id === b.edit.id), l = look(b.edit);
    if (!l || post.schedule && !IMAGE.test(b.edit.image || '')) return json({ error: 'bad_request' }, 400);
    Object.assign(post, { v: l.v, photo: l.photo });
    if (l.texts.length) post.texts = l.texts; else delete post.texts;
    if (post.schedule) Object.assign(post.schedule, { image: b.edit.image, by: data.user });
  } else if (b.template && TPL.test(b.template.id || '')) {
    const texts = words(b.template.texts);
    if (!texts) return json({ error: 'bad_request' }, 400);
    S.templates = { ...S.templates };
    if (texts.length) S.templates[b.template.id] = texts; else delete S.templates[b.template.id];
  } else return json({ error: 'bad_request' }, 400);
  await store(env, S, data.user);
  return view(S, env);
}
