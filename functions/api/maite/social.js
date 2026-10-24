// GET  /api/maite/social   The Instagram posts confirmed in Xarxes socials, in grid order (1 is the first to publish), and their captions
// POST /api/maite/social   { tpl, v, photo, texts, slides, copy }  Adds a post at the end. photo: '' (the template's own), an
//                          upload ('/photos/…') or one of the library ('/maite/social/…'). texts: its own words on the image (a
//                          post made from a prompt), one per text line of the template. slides: the images after it, when it is
//                          a carousel ([{ tpl, v, photo, texts }], the same fields). copy: its caption, if it already has one.
//                          story: true for a story (it never goes in the grid; it can be programmed like a post). menu: true
//                          for the post and the story made in Menús, which lists them.
// PUT  /api/maite/social   { order: [ids] }  New order of the grid; posts left out are removed (stories are not in it, and stay).
//                          Or { remove: id }  Removes one post or story. Or { copy: { id, text } }  The caption of one post.
//                          Or { date: { id, date } }  The day a post is planned for ('' to clear, and its program with it);
//                          planned posts follow their dates.
//                          Or { schedule: { id, at, images } }  Programs a post: at, when (ISO); images, its JPEGs already
//                          uploaded ('/photos/…'), one per slide (image, a single one, still works). Its day becomes the day of at in Barcelona. Without at, the program is cancelled.
// Opening the grid also publishes programs that are already due (lib/instagram.js), in case the cron hasn't yet.
// Everything is one KV key, 'social' (lib/social.js).
import { json } from '../../../lib/booking.js';
import { SEED, load, store, view } from '../../../lib/social.js';
import { imagesOf, runDue } from '../../../lib/instagram.js';

async function body(request) { try { return await request.json(); } catch { return null; } }

// The day of a moment in Barcelona, as YYYY-MM-DD
const dayOf = at => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date(at));

export async function onRequestGet({ env, waitUntil }) {
  if (!env.MAITE) return json({ ...SEED, ai: !!env.ANTHROPIC_API_KEY });
  waitUntil(runDue(env).catch(() => {}));
  return view(await load(env), env);
}

// One image of a post (the post itself, or a slide after it): its template, variation, photo and own words; null if it is wrong
function image(b) {
  if (!/^[A-Za-z]{2,40}$/.test(b?.tpl || '')) return null;
  const v = Number(b.v || 0), photo = String(b.photo || '');
  if (!Number.isInteger(v) || v < 0 || v > 99 || photo && !/^\/(photos|maite\/social)\/[\w-]+\.(jpg|webp|png)$/.test(photo)) return null;
  const texts = b.texts == null ? null : [].concat(b.texts);
  if (texts && (texts.length > 20 || texts.some(x => typeof x !== 'string' || x.length > 300))) return null;
  return { tpl: b.tpl, v, photo, ...(texts?.length ? { texts } : {}) };
}

export async function onRequestPost({ request, env, data }) {
  if (!env.MAITE) return json({ error: 'not_configured' }, 503);
  const b = await body(request);
  const post = b && image(b), slides = [].concat(b?.slides || []).map(image);
  if (!post || slides.length > 9 || slides.some(x => !x)) return json({ error: 'bad_request' }, 400);
  const S = await load(env);
  if (S.posts.length >= 150) return json({ error: 'social_full' }, 400);
  const id = crypto.randomUUID().slice(0, 8);
  S.posts.push({ id, ...post, ...(slides.length ? { slides } : {}), ...(b.story ? { story: true } : {}), ...(b.menu ? { menu: true } : {}), at: new Date().toISOString(), by: data.user });
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
  const keepCopies = () => { const keep = new Set(S.posts.map(p => p.id)); S.copies = Object.fromEntries(Object.entries(S.copies).filter(([id]) => keep.has(id))); };
  if (Array.isArray(b.order)) {
    const byId = new Map(S.posts.filter(p => !p.story).map(p => [p.id, p]));
    S.posts = [...[...new Set(b.order.map(String))].map(id => byId.get(id)).filter(Boolean), ...S.posts.filter(p => p.story)];
    keepCopies();
  } else if (b.remove) {
    S.posts = S.posts.filter(p => p.id !== String(b.remove));
    keepCopies();
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
      const images = imagesOf(b.schedule);
      if (!(at > Date.now() - 60e3 && at < Date.now() + 400 * 864e5) || !images) return json({ error: 'bad_request' }, 400);
      post.schedule = { at: new Date(at).toISOString(), image: images[0], ...(images.length > 1 ? { images } : {}), by: data.user };
      post.date = dayOf(at);
    }
    follow(S);
  } else return json({ error: 'bad_request' }, 400);
  await store(env, S, data.user);
  return view(S, env);
}
