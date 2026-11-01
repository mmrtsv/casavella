// The story robot (story-bot/), which posts Maite's programmed stories with Instagram's link sticker. It lives outside
// /api/maite/ because Cloudflare Access only lets people in there; the header authorization: Bearer <STORY_BOT_SECRET> guards it.
//
// GET  /api/story-bot   { jobs: [{ id, at, link, image, post }] }  The stories whose time has come (up to a minute early), at
//                       most three, each claimed for ten minutes so it isn't handed out twice. image: its JPEG on the web, when
//                       Maite already has it; otherwise the robot draws post ({ tpl, v, photo, texts }) on /render/render.html.
//                       link: what the sticker opens (the plan's own link; a menu's stories, the table booking page; else the web).
//                       Asking is also the robot's heartbeat: while it asks, lib/instagram.js leaves the stories to it.
// POST /api/story-bot   { id, ok: true, media, url }  Posted: the story is published.
//                       { id, ok: false, error }  It couldn't: tried again next minute, three times at most; after that (or
//                       `grace` minutes after its time) lib/instagram.js publishes it without the sticker.
//                       { status: { user, error } }  How the robot is: the account it is signed in as, or why it can't sign in
//                       (Maite shows it in Pla, and stops leaving the stories to it while there is an error).
import { json } from '../../lib/booking.js';
import { load, store } from '../../lib/social.js';
import { TABLE_LINK, WEB } from '../../lib/plan.js';

const LATE = 6 * 3600e3, CLAIM = 10 * 60e3, TRIES = 3;
const linkOf = p => p.link || (p.pack ? TABLE_LINK : WEB);

function guard(request, env) {
  const s = env.STORY_BOT_SECRET;
  return !!s && request.headers.get('authorization') === 'Bearer ' + s;
}
async function beat(env, extra = {}) {
  const was = JSON.parse((await env.MAITE.get('story-bot')) || 'null') || {};
  const now = { ...was, seen: new Date().toISOString(), ...extra };
  await env.MAITE.put('story-bot', JSON.stringify(now));
}

export async function onRequestGet({ request, env }) {
  if (!guard(request, env)) return json({ error: 'access' }, 401);
  if (!env.MAITE) return json({ error: 'not_configured' }, 503);
  const site = (env.SITE_URL || 'https://casavellarural.com').replace(/\/$/, '');
  const S = await load(env), now = Date.now();
  const jobs = S.posts.filter(p => p.story && !p.published && p.schedule && !p.schedule.error && !p.schedule.started
    && Date.parse(p.schedule.at) <= now + 60e3 && now - Date.parse(p.schedule.at) < LATE
    && (p.schedule.bot?.tries || 0) < TRIES && !(p.schedule.bot?.claimed && now - Date.parse(p.schedule.bot.claimed) < CLAIM))
    .sort((a, b) => a.schedule.at.localeCompare(b.schedule.at)).slice(0, 3);
  for (const p of jobs) p.schedule.bot = { ...p.schedule.bot, claimed: new Date().toISOString() };
  if (jobs.length) await store(env, S, 'robot');
  // The heartbeat only every few minutes when there is nothing to do, to spare KV writes
  const was = JSON.parse((await env.MAITE.get('story-bot')) || 'null');
  if (jobs.length || !was || now - Date.parse(was.seen) > 4 * 60e3) await beat(env);
  return json({ jobs: jobs.map(p => ({ id: p.id, at: p.schedule.at, link: linkOf(p), image: p.schedule.image ? site + p.schedule.image : '',
    post: { tpl: p.tpl, v: p.v || 0, photo: p.photo || '', texts: p.texts || [] } })) });
}

export async function onRequestPost({ request, env }) {
  if (!guard(request, env)) return json({ error: 'access' }, 401);
  if (!env.MAITE) return json({ error: 'not_configured' }, 503);
  let b;
  try { b = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  if (b?.status) {
    await beat(env, { user: String(b.status.user || '').slice(0, 60), error: b.status.error ? String(b.status.error).slice(0, 300) : '' });
    return json({ ok: true });
  }
  const S = await load(env), p = S.posts.find(x => x.id === String(b?.id || '') && x.story);
  if (!p) return json({ error: 'bad_request' }, 400);
  if (p.published) return json({ ok: true });
  if (b.ok) {
    p.published = { at: new Date().toISOString(), media: String(b.media || ''), url: String(b.url || ''), bot: true };
    delete p.schedule;
  } else if (p.schedule) {
    const tries = (p.schedule.bot?.tries || 0) + 1;
    p.schedule.bot = { tries, error: String(b.error || 'error').slice(0, 300) };
  }
  await store(env, S, 'robot');
  return json({ ok: true });
}
