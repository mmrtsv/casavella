// Publishing to Instagram, shared by /api/maite/instagram (Publica ara), /api/maite/social (programs that are due when Maite
// is open) and /api/social-cron (programs that are due, every few minutes).
// Instagram API with Instagram Login (a professional account and a Meta app with instagram_business_basic and
// instagram_business_content_publish). The token starts as the INSTAGRAM_TOKEN secret; Maite renews it every week
// (long-lived tokens last 60 days) and keeps the renewed one in KV ('instagram').
import { load, store } from './social.js';
import { AppError, STICKER, appState, canApp, postStory } from './igapp.js';
import { gbpReady, postToGoogle } from './gbp.js';

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
  // Already on Instagram: another run published it while this one read an older copy of the grid (KV takes a while to agree
  // everywhere), or the grid lost the mark. It is marked, not posted a second time
  const twin = post.story ? null : await twinOf(env, t, me.user_id, S, caption);
  if (twin) {
    const now = await load(env), p = now.posts.find(x => x.id === post.id);
    if (p && !p.published) { p.published = { at: twin.timestamp, media: twin.id, url: twin.permalink || '', image: images[0], twin: true }; delete p.schedule; await store(env, now, user); }
    return now;
  }
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
  // Every feed post goes to the Google listing too (lib/gbp.js), with the first image. Whatever Google says stays on the post
  // (published.google: its link, or the error) and never undoes Instagram
  if (!post.story && gbpReady(env)) {
    let google;
    try { google = await postToGoogle(env, { text: caption, image: site + images[0], link: linkOf(post) }); }
    catch (e) { google = { at: new Date().toISOString(), error: String(e.message || e).slice(0, 300) }; }
    const A = await load(env), q = A.posts.find(x => x.id === post.id);
    if (q?.published) { q.published.google = google; await store(env, A, user); }
    return A;
  }
  return now;
}

// A post on the account from the last day with the same caption that no other post of the grid is: this one, already out.
// Without a caption (or if Instagram can't be asked) there is nothing to compare, and it goes out
const words = c => String(c || '').replace(/\s+/g, ' ').trim();
async function twinOf(env, t, uid, S, caption) {
  if (!words(caption)) return null;
  try {
    const d = await ig(env, t, `/${uid}/media?fields=id,caption,timestamp,permalink&limit=12`);
    const ours = new Set(S.posts.map(p => p.published?.media).filter(Boolean));
    return (d.data || []).find(m => !ours.has(m.id) && Date.now() - Date.parse(m.timestamp) < DAY && words(m.caption) === words(caption)) || null;
  } catch { return null; }
}

// Programmed posts whose time has come. Each one is marked as started first, so two runs at once don't post it twice;
// a failure is kept on the post for Maite to show, and it is not tried again until it is programmed again.
// A program of Maite's own plan (lib/plan.js) may still be waiting for its images: it goes when they are there. A story with a
// link sticker (hand) waits for the owner to post it from the phone, and goes out without the sticker `hand.grace` minutes
// later if she hasn't (never, when grace is null); if Instagram already has a story of hers from around that time, it was
// posted by hand and is only marked as published.
// Every programmed story goes out first with the link sticker: from here, through the app's own API (lib/igapp.js, with
// IG_SESSIONID), or else by the story robot when it runs (story-bot/, functions/api/story-bot.js). Only if that couldn't, this
// publishes it through the official API without the sticker, `grace` minutes after its time.
const grace = p => (p.hand ? p.hand.grace : 180);
const dueAt = (p, sticker) => Date.parse(p.schedule.at) + ((p.story && sticker) || (p.hand && p.link) ? (grace(p) == null ? Infinity : grace(p) * 60e3) : 0);
export async function runDue(env) {
  if (!env.MAITE) return 0;
  const app = await appStories(env);
  const S = await load(env), now = Date.now(), bot = await botAlive(env) || await appAlive(env);
  const due = S.posts.filter(p => !p.published && p.schedule && !p.schedule.error && p.schedule.image && dueAt(p, bot) <= now
    && !(p.schedule.started && now - Date.parse(p.schedule.started) < 10 * 60e3)
    && !(p.schedule.bot?.claimed && now - Date.parse(p.schedule.bot.claimed) < 10 * 60e3));
  if (!due.length) return app;
  const t = await token(env);
  if (!t) return app;
  if (due.some(p => p.hand && p.link)) {
    const posted = await handPosted(env, t, S, due.filter(p => p.hand && p.link));
    if (posted.length) {
      for (const p of posted) delete p.schedule;
      await store(env, S, 'programat');
      return runDue(env);
    }
  }
  for (const p of due) p.schedule.started = new Date().toISOString();
  await store(env, S, 'programat');
  let n = app;
  for (const p of due) {
    try { await publish(env, t, p.id, p.schedule.images || [p.schedule.image], 'programat'); n++; }
    catch (e) {
      const A = await load(env), q = A.posts.find(x => x.id === p.id);
      if (q?.schedule) { delete q.schedule.started; q.schedule.error = String(e.message || e).slice(0, 300); await store(env, A, 'programat'); }
    }
  }
  return n;
}

// Stories on the account (the last 24 hours) that Maite didn't publish and that went up after a hand story's time (less half
// an hour): that one was posted by hand. Marks them published on S; returns them. Without the permission to read stories,
// nothing is marked
async function handPosted(env, t, S, list) {
  try {
    const me = await ig(env, t, '/me?fields=user_id');
    const d = await ig(env, t, `/${me.user_id}/stories?fields=id,timestamp,permalink`);
    const ours = new Set(S.posts.map(p => p.published?.media).filter(Boolean));
    const theirs = (d.data || []).filter(m => !ours.has(m.id)).sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    const out = [];
    for (const p of list.sort((a, b) => a.schedule.at.localeCompare(b.schedule.at))) {
      const m = theirs.find(m => Date.parse(m.timestamp) >= Date.parse(p.schedule.at) - 30 * 60e3);
      if (!m) continue;
      theirs.splice(theirs.indexOf(m), 1);
      p.published = { at: m.timestamp, media: m.id, url: m.permalink || '', hand: true };
      out.push(p);
    }
    return out;
  } catch { return []; }
}

// ---------- The story robot ----------
// story-bot/ runs outside Cloudflare (Instagram's own app protocol, which can add the link sticker the API can't) and asks
// /api/story-bot every minute. KV 'story-bot': when it last asked (seen), as which account, and its last error.
export const botState = async env => JSON.parse((await env.MAITE?.get('story-bot')) || 'null');
export async function botAlive(env) {
  if (!env.STORY_BOT_SECRET) return false;
  const b = await botState(env).catch(() => null);
  return !!(b && Date.now() - Date.parse(b.seen) < 10 * 60e3 && !b.error);
}

// ---------- Stories with the link sticker, from here (lib/igapp.js) ----------
export const linkOf = p => p.link || (p.pack ? 'https://www.casavellarural.com/#taula' : 'https://www.casavellarural.com/');
// The session works: IG_SESSIONID is set and Instagram hasn't turned it down
export async function appAlive(env) {
  if (!canApp(env)) return false;
  const s = await appState(env).catch(() => null);
  // A session copied again is worth a try, whatever the old one said
  return !s?.error || s.from !== env.IG_SESSIONID.slice(-12);
}
// The stories whose time has come (up to six hours late), each tried three times at most, one call at a time. Returns how many
// went out
async function appStories(env) {
  if (!await appAlive(env)) return 0;
  const S = await load(env), now = Date.now();
  const due = S.posts.filter(p => p.story && !p.published && p.schedule && !p.schedule.error && p.schedule.image
    && Date.parse(p.schedule.at) <= now && now - Date.parse(p.schedule.at) < 6 * 3600e3 && (p.schedule.app?.tries || 0) < 3
    && !(p.schedule.started && now - Date.parse(p.schedule.started) < 10 * 60e3)
    && !(p.schedule.bot?.claimed && now - Date.parse(p.schedule.bot.claimed) < 10 * 60e3));
  if (!due.length) return 0;
  for (const p of due) p.schedule.started = new Date().toISOString();
  await store(env, S, 'programat');
  let n = 0;
  for (const p of due) {
    let done = null, error = '', lost = false;
    try {
      const obj = await env.PHOTOS.get(p.schedule.image.replace(/^\/photos\//, ''));
      if (!obj) throw new AppError('No es troba la imatge de la story');
      done = await postStory(env, await obj.arrayBuffer(), linkOf(p), STICKER[p.tpl] || {});
      n++;
    } catch (e) { error = String(e.message || e).slice(0, 300); lost = !!e.session; }
    const A = await load(env), q = A.posts.find(x => x.id === p.id);
    if (q && !q.published && q.schedule) {
      if (done) { q.published = { at: new Date().toISOString(), media: done.media, url: done.url, app: true, image: p.schedule.image }; delete q.schedule; }
      else { delete q.schedule.started; q.schedule.app = { tries: (q.schedule.app?.tries || 0) + 1, error }; }
      await store(env, A, 'programat');
    }
    // The session no longer works: the rest wait for the official API (or the owner) until it is copied again
    if (lost) break;
  }
  return n;
}
