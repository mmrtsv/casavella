// GET  /api/maite/social   The Instagram posts confirmed in Xarxes socials, in grid order (1 is the first to publish), their captions
//                          and templates: the words changed on each template ({ [tpl]: texts }), which new posts start from
// POST /api/maite/social   { tpl, v, photo, texts, slides, copy, story, menu }  Adds a post at the end. photo: '' (the template's
//                          own), an upload ('/photos/…') or one of the library ('/maite/social/…'). texts: its own words on the
//                          image, one per text line of the template (null keeps the template's). slides: the images after it, when
//                          it is a carousel ([{ tpl, v, photo, texts }], the same fields). copy: its caption, if it already has one.
//                          story: true for a story (it never goes in the grid; it can be programmed like a post). menu: the
//                          values of a menu made in Nova publicació › Menú (catalog.ts Menu), kept on its post so the pack can
//                          be opened again; pack: on the menu's stories (the announcement and the menu), the id of its post.
// PUT  /api/maite/social   { order: [ids] }  New order of the grid; posts left out are removed (stories are not in it, and stay).
//                          Or { remove: id }  Removes one post or story. Or { copy: { id, text } }  The caption of one post.
//                          Or { date: { id, date } }  The day a post is planned for ('' to clear, and its program with it);
//                          planned posts follow their dates.
//                          Or { schedule: { id, at, images } }  Programs a post: at, when (ISO); images, its JPEGs already
//                          uploaded ('/photos/…'), one per slide (image, a single one, still works). Its day becomes the day of
//                          at in Barcelona. Without at, the program is cancelled.
//                          Or { edit: { id, v, photo, texts, slides, menu, images } }  Changes a post that isn't published
//                          (slides and menu only when given); a programmed one needs its new JPEGs (images, or image), which
//                          replace the ones the program publishes.
//                          Or { menu: { id, menu } }  The values of a menu on its post, published or not (its days and its image
//                          for the web can change after it went out).
//                          Or { template: { id, texts } }  The words changed on a template, for what is made from it next ([] to undo).
// Opening the grid also publishes programs that are already due (lib/instagram.js), in case the cron hasn't yet.
// Everything is one KV key, 'social' (lib/social.js).
import { json } from '../../../lib/booking.js';
import { SEED, load, store, view } from '../../../lib/social.js';
import { imagesOf, runDue } from '../../../lib/instagram.js';

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

// The slides of a carousel: each one a template with its variation, photo and words, like the post; null if any is wrong
function slidesOf(list) {
  const out = [].concat(list || []).map(x => x && TPL.test(x.tpl || '') && look(x) ? { tpl: x.tpl, ...look(x) } : null);
  return out.length > 9 || out.some(x => !x) ? null : out.map(slim);
}
const slim = x => ({ tpl: x.tpl, v: x.v, photo: x.photo, ...(x.texts.length ? { texts: x.texts } : {}) });
// The values of a menu (catalog.ts Menu): short strings and up to six dishes. null if they don't look like it; false if none
// from, until: its first and last day; story: the announcement story's own lines (null follows the menu); image: the menu as a
// JPEG, which the restaurant's booking page shows while it runs (/api/settings)
function menuOf(m) {
  if (m == null || m === false) return false;
  if (m === true) return true;
  const keys = ['photo', 'kicker', 'title', 'subtitle', 'dates', 'name', 'drinks', 'price', 'link', 'from', 'until', 'image'];
  if (typeof m !== 'object' || keys.some(k => m[k] != null && (typeof m[k] !== 'string' || m[k].length > 300))) return null;
  if (['from', 'until'].some(k => m[k] && !/^\d{4}-\d{2}-\d{2}$/.test(m[k])) || m.image && !PHOTO.test(m.image)) return null;
  const dishes = [].concat(m.dishes || []), story = [].concat(m.story || []);
  if (dishes.length > 6 || dishes.some(d => typeof d !== 'string' || d.length > 300)) return null;
  if (story.length > 6 || story.some(d => d !== null && (typeof d !== 'string' || d.length > 300))) return null;
  return { ...Object.fromEntries(keys.map(k => [k, m[k] || ''])), dishes, ...(story.some(x => x != null) ? { story } : {}) };
}

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
  const l = b && TPL.test(b.tpl || '') && look(b), slides = slidesOf(b?.slides), menu = menuOf(b?.menu);
  if (!l || !slides || menu === null || b.pack != null && !/^[\w-]{1,40}$/.test(String(b.pack))) return json({ error: 'bad_request' }, 400);
  const S = await load(env);
  if (S.posts.length >= 150) return json({ error: 'social_full' }, 400);
  const id = crypto.randomUUID().slice(0, 8);
  S.posts.push({ id, ...slim({ tpl: b.tpl, ...l }), ...(slides.length ? { slides } : {}), ...(b.story ? { story: true } : {}), ...(menu ? { menu } : {}),
    ...(b.pack ? { pack: String(b.pack) } : {}), at: new Date().toISOString(), by: data.user });
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
  } else if (b.edit && S.posts.some(p => p.id === b.edit.id && !p.published)) {
    const post = S.posts.find(p => p.id === b.edit.id), l = look(b.edit);
    const images = post.schedule && imagesOf(b.edit), slides = b.edit.slides === undefined ? undefined : slidesOf(b.edit.slides);
    const menu = b.edit.menu === undefined ? undefined : menuOf(b.edit.menu);
    if (!l || post.schedule && !images || slides === null || menu === null) return json({ error: 'bad_request' }, 400);
    Object.assign(post, { v: l.v, photo: l.photo });
    if (l.texts.length) post.texts = l.texts; else delete post.texts;
    if (slides) { if (slides.length) post.slides = slides; else delete post.slides; }
    if (menu !== undefined) { if (menu) post.menu = menu; else delete post.menu; }
    if (post.schedule) { Object.assign(post.schedule, { image: images[0], by: data.user }); if (images.length > 1) post.schedule.images = images; else delete post.schedule.images; }
  } else if (b.menu && S.posts.some(p => p.id === b.menu.id && p.menu)) {
    const menu = menuOf(b.menu.menu);
    if (!menu || menu === true) return json({ error: 'bad_request' }, 400);
    S.posts.find(p => p.id === b.menu.id).menu = menu;
  } else if (b.template && TPL.test(b.template.id || '')) {
    const texts = words(b.template.texts);
    if (!texts) return json({ error: 'bad_request' }, 400);
    S.templates = { ...S.templates };
    if (texts.length) S.templates[b.template.id] = texts; else delete S.templates[b.template.id];
  } else return json({ error: 'bad_request' }, 400);
  await store(env, S, data.user);
  return view(S, env);
}
