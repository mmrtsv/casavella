// Posts on the house's Google Business Profile (the Google Maps listing), through the Business Profile API.
// Two ways in, whichever is set up:
//  - GBP_REFRESH_TOKEN (with GBP_CLIENT_ID and GBP_CLIENT_SECRET): an OAuth token of a Google account that manages the
//    listing (info@casavellarural.com), scope https://www.googleapis.com/auth/business.manage;
//  - GBP_AS: that account's address, for the calendars' service account to act as it (Workspace domain-wide delegation
//    with the same scope).
// The listing is GBP_LOCATION ("accounts/…/locations/…"), or the one called La Casa Vella among the account's, found once
// and kept in KV ('gbp-location'). GBP_POSTS=off stops every post.
// Used by lib/instagram.js (each feed post Maite publishes goes to the listing too) and by runGoogleQueue (the posts the
// weekly SEO routine writes in content/gbp/, published on their day by the cron).
import { googleToken } from './booking.js';

const SCOPE = 'https://www.googleapis.com/auth/business.manage';
export const gbpReady = env => env.GBP_POSTS !== 'off' && !!(env.GBP_REFRESH_TOKEN || env.GBP_AS);

async function token(env) {
  if (env.GBP_REFRESH_TOKEN) {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: env.GBP_REFRESH_TOKEN, client_id: env.GBP_CLIENT_ID || '', client_secret: env.GBP_CLIENT_SECRET || '' }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.access_token) throw new Error('Google: ' + (d.error_description || d.error || r.status));
    return d.access_token;
  }
  return googleToken(env, SCOPE, env.GBP_AS);
}

async function call(t, url, body) {
  const r = await fetch(url, { method: body ? 'POST' : 'GET', headers: { authorization: 'Bearer ' + t, 'content-type': 'application/json' }, body: body && JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('Google: ' + (d.error?.message || r.status));
  return d;
}

async function location(env, t) {
  if (env.GBP_LOCATION) return env.GBP_LOCATION;
  const saved = await env.MAITE?.get('gbp-location');
  if (saved) return saved;
  const { accounts = [] } = await call(t, 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts');
  for (const a of accounts) {
    const { locations = [] } = await call(t, `https://mybusinessbusinessinformation.googleapis.com/v1/${a.name}/locations?readMask=name,title&pageSize=100`);
    const l = locations.find(x => /casa vella/i.test(x.title || ''));
    if (l) {
      const name = `${a.name}/${l.name}`; // accounts/1/locations/2, as the v4 posts API wants it
      await env.MAITE?.put('gbp-location', name);
      return name;
    }
  }
  throw new Error('Google: no es troba la fitxa de La Casa Vella en aquest compte');
}

// What a Google post can carry: plain text up to 1,500 characters, without the sentences that give a phone number (Google
// rejects posts with one)
// and without hashtags (they mean nothing there)
export function googleText(caption) {
  return String(caption || '')
    .replace(/#[\p{L}\p{N}_]+/gu, '')
    .replace(/[^.!?\n]*\+?\d[\d\s]{7,}\d[^.!?\n]*[.!?]?/g, '')
    .replace(/^[ \t]+|[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ')
    .trim().slice(0, 1500);
}

// One post on the listing. image: an absolute https URL Google fetches; link: where its button goes ("Reserva" when it goes
// to the booking form or a table, "Més informació" otherwise). Returns { at, url } (the post on Google), throws when Google says no
export async function postToGoogle(env, { text, image, link, lang = 'ca' }) {
  const t = await token(env);
  const loc = await location(env, t);
  const summary = googleText(text);
  if (!summary) throw new Error('Google: el post no té text');
  const body = { languageCode: lang, summary, topicType: 'STANDARD' };
  if (link) body.callToAction = { actionType: /#(reservar|reserva|taula|disponibles)|[?&]in=/.test(link) ? 'BOOK' : 'LEARN_MORE', url: link };
  if (image) body.media = [{ mediaFormat: 'PHOTO', sourceUrl: image }];
  const d = await call(t, `https://mybusiness.googleapis.com/v4/${loc}/localPosts`, body);
  return { at: new Date().toISOString(), url: d.searchUrl || '', name: d.name || '' };
}

// The posts the weekly SEO routine leaves in content/gbp/*.json (built into /gbp-queue.json): each goes out once, on its day
// (Madrid), from 9:00. KV 'gbp-queue' keeps what went out. Returns how many were posted
export async function runGoogleQueue(env) {
  if (!gbpReady(env) || !env.MAITE) return 0;
  const site = (env.SITE_URL || 'https://casavellarural.com').replace(/\/$/, '');
  const now = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid', dateStyle: 'short', timeStyle: 'short' }).format(new Date());
  if (now.slice(11) < '09:00') return 0;
  const queue = await fetch(site + '/gbp-queue.json').then(r => r.ok ? r.json() : []).catch(() => []);
  const done = JSON.parse((await env.MAITE.get('gbp-queue')) || '{}');
  let n = 0;
  for (const p of queue.filter(p => p.id && p.date <= now.slice(0, 10) && !done[p.id])) {
    done[p.id] = { at: new Date().toISOString(), started: true };
    await env.MAITE.put('gbp-queue', JSON.stringify(done));
    try { done[p.id] = await postToGoogle(env, { text: p.text, image: p.image && site + p.image, link: p.link, lang: p.lang || 'ca' }); n++; }
    catch (e) { done[p.id] = { at: new Date().toISOString(), error: String(e.message || e).slice(0, 300) }; }
    await env.MAITE.put('gbp-queue', JSON.stringify(done));
  }
  return n;
}
