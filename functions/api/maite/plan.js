// GET  /api/maite/plan   Maite's own Instagram plan (lib/plan.js): its settings, the weeks it made ({ [monday]: { made,
//                        approved, deadline } }), whether the server draws the images (render), whether Claude writes (ai)
//                        and how the story robot is (bot: { alive, seen, user, error }, or null when it isn't set up).
//                        The plan's posts themselves are in /api/maite/social (posts with an auto field).
// PUT  /api/maite/plan   { settings: { on, posts, stories, hand, grace, menus } }  Changes how it plans.
//                        Or { approve: monday }  Approves that week's plan (it goes out the same either way).
//                        Or { make: monday }  Makes that week's plan again: the posts the owner hasn't changed are replaced.
//                        Or { done: id }  A story the owner posted by hand from Instagram, with its link sticker: published.
//                        Or { images: { id, images } }  The JPEGs of a planned post that had none yet, drawn by Maite (web or
//                        app) when the server can't: '/photos/…', one per slide.
//                        Or { remind: { id, on } }  Whether a menu (its post) gets reminders.
//                        Or { whatsapp: id }  A menu sent to the owner's WhatsApp broadcast list (Envia per WhatsApp): the
//                        app stops reminding her to send it, until its last days.
//                        Every answer is { plan, social }: the plan as GET, and the grid as /api/maite/social.
import { json } from '../../../lib/booking.js';
import { load, store, viewData } from '../../../lib/social.js';
import { botAlive, botState, imagesOf } from '../../../lib/instagram.js';
import { canRender } from '../../../lib/render.js';
import { appState, canApp } from '../../../lib/igapp.js';
import { loadPlan, lookOf, makeWeek, mondayOf, refreshMenus, settingsOf, storePlan, tick } from '../../../lib/plan.js';

// bot: the story robot (story-bot/), when it is set up: whether it is running (alive), as which account, and its last error
const botOf = async env => {
  // The stories go out from Cloudflare itself with the Instagram session (lib/igapp.js)
  if (canApp(env)) { const a = await appState(env).catch(() => null); return { alive: !a?.error, seen: a?.checked || '', user: a?.user || '', error: a?.error || '' }; }
  if (!env.STORY_BOT_SECRET) return null;
  const b = await botState(env).catch(() => null);
  return { alive: await botAlive(env), seen: b?.seen || '', user: b?.user || '', error: b?.error || '' };
};
const out = async (env, P) => json({ plan: { ...(P || await loadPlan(env)), render: canRender(env), ai: !!env.ANTHROPIC_API_KEY, bot: await botOf(env) }, social: viewData(await load(env), env) });
const isMonday = w => typeof w === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(w) && mondayOf(w) === w;

// Opening the plan also keeps it going (lib/plan.js tick), in case the cron isn't running
export async function onRequestGet({ env, waitUntil }) {
  if (!env.MAITE) return json({ error: 'not_configured' }, 503);
  waitUntil?.(tick(env).catch(() => {}));
  return out(env);
}

export async function onRequestPut({ request, env, data }) {
  if (!env.MAITE) return json({ error: 'not_configured' }, 503);
  let b;
  try { b = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  if (!b || typeof b !== 'object') return json({ error: 'bad_request' }, 400);
  if (b.settings) {
    const s = settingsOf(b.settings);
    if (!s) return json({ error: 'bad_request' }, 400);
    const P = { ...await loadPlan(env), ...s };
    // The menus' reminders follow at once (off takes out the ones still to come)
    if ('menus' in s || 'on' in s) { P.menusAt = ''; await refreshMenus(env, P).catch(() => {}); }
    await storePlan(env, P);
    return out(env, P);
  }
  if (isMonday(b.approve)) {
    const P = await loadPlan(env);
    if (!P.weeks[b.approve]) return json({ error: 'bad_request' }, 400);
    P.weeks[b.approve].approved = { at: new Date().toISOString(), by: data.user };
    await storePlan(env, P);
    return out(env, P);
  }
  if (isMonday(b.make)) {
    try { await makeWeek(env, b.make, { by: data.user, replace: true }); }
    catch (e) { return json({ error: 'plan', detail: e.message }, 502); }
    return out(env);
  }
  const S = await load(env);
  if (b.done) {
    const p = S.posts.find(p => p.id === String(b.done) && p.story && !p.published);
    if (!p) return json({ error: 'bad_request' }, 400);
    p.published = { at: new Date().toISOString(), url: '', hand: true, by: data.user };
    delete p.schedule;
  } else if (b.images) {
    const p = S.posts.find(p => p.id === String(b.images.id) && !p.published && p.schedule);
    const images = imagesOf(b.images);
    if (!p || !images) return json({ error: 'bad_request' }, 400);
    // Only when it still has none (the server may have drawn them meanwhile) and it has the images it was drawn for
    if ((!p.schedule.image || p.schedule.stale) && (b.images.look == null || b.images.look === lookOf(p))) {
      Object.assign(p.schedule, { image: images[0] });
      if (images.length > 1) p.schedule.images = images; else delete p.schedule.images;
      delete p.schedule.renderError; delete p.schedule.stale;
    }
  } else if (b.whatsapp) {
    const p = S.posts.find(p => p.id === String(b.whatsapp) && p.menu && !p.story);
    if (!p) return json({ error: 'bad_request' }, 400);
    p.whatsapp = { at: new Date().toISOString(), by: data.user };
  } else if (b.remind) {
    const p = S.posts.find(p => p.id === String(b.remind.id) && p.menu && !p.story);
    if (!p || typeof b.remind.on !== 'boolean') return json({ error: 'bad_request' }, 400);
    if (b.remind.on) delete p.remind; else p.remind = false;
    await store(env, S, data.user);
    const P = await loadPlan(env);
    await refreshMenus(env, P).catch(() => {});
    return out(env, P);
  } else return json({ error: 'bad_request' }, 400);
  await store(env, S, data.user);
  return out(env);
}
