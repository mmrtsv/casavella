// GET  /api/table?people=4  The openings ahead (a day and a time each) and whether each has room for that many people
// POST /api/table  { at, people, name, email, phone, notes, website, lang }   at: '2026-12-31T21:00', one of the openings
//      Books a table: written to the restaurant's calendar (CAL_RESTAURANT), confirmed to the guest and announced to the house.
// Openings, seats and limits come from Maite (lib/booking.js settings().restaurant). Errors the page explains:
// offline (the web doesn't take tables now), closed (not an opening), too_soon, party (more than maxParty), full,
// not_configured, calendar.
import { settings, addDays, json } from '../../lib/booking.js';
import { tablesConfigured, tables, tableEvent, taken, inTime, isAt, madridNow } from '../../lib/restaurant.js';
import { send, tableConfirmation, tableNotice, langOf } from '../../lib/email.js';

// Google refused the restaurant's calendar (not shared with the service account, or a wrong ID): the page falls back to phone
const calendarError = e => json({ error: 'calendar', detail: String(e.message || e) }, 502);

// The checks both calls share; returns an error body or null
function check(R, people) {
  if (!R.online) return { error: 'offline' };
  if (!(Number.isInteger(people) && people >= 1)) return { error: 'people' };
  if (people > R.maxParty) return { error: 'party', max: R.maxParty };
  return null;
}

export async function onRequestGet({ request, env }) {
  const people = Number(new URL(request.url).searchParams.get('people') || 2);
  const R = (await settings(env)).restaurant, now = madridNow();
  const bad = check(R, people);
  if (bad) return json(bad, 400);
  if (!R.open.length) return json({ people, open: [] });
  if (!tablesConfigured(env)) return json({ error: 'not_configured' }, 503);
  let list;
  try { list = await (await tables(env)).list(R.open[0].slice(0, 10), addDays(R.open.at(-1).slice(0, 10), 1)); }
  catch (e) { return calendarError(e); }
  return json({ people, open: R.open.map(at => ({ at, free: taken(list, at) + people <= R.seats && inTime(R, at, now) })) });
}

export async function onRequestPost({ request, env, waitUntil }) {
  const b = await request.json().catch(() => ({}));
  if (b.website) return json({ ok: true }); // honeypot: bots fill the hidden field
  const clip = (v, n) => String(v ?? '').trim().slice(0, n);
  const at = String(b.at || '');
  const t = {
    date: at.slice(0, 10), time: at.slice(11, 16), people: Number(b.people), name: clip(b.name, 100), email: clip(b.email, 120), phone: clip(b.phone, 40),
    notes: clip(b.notes, 500), source: 'web', lang: langOf(b.lang),
  };
  const R = (await settings(env)).restaurant;
  const bad = check(R, t.people);
  if (bad) return json(bad, 400);
  if (!isAt(at) || !R.open.includes(at)) return json({ error: 'closed' }, 400);
  if (!inTime(R, at)) return json({ error: 'too_soon', hours: R.minHours }, 400);
  if (t.name.length < 2) return json({ error: 'name' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.email)) return json({ error: 'email' }, 400);
  if (t.phone.replace(/\D/g, '').length < 6) return json({ error: 'phone' }, 400);
  if (!tablesConfigured(env)) return json({ error: 'not_configured' }, 503);

  try {
    const cal = await tables(env);
    if (taken(await cal.list(t.date, addDays(t.date, 1)), at) + t.people > R.seats) return json({ error: 'full' }, 409);
    await cal.create(tableEvent(t));
  } catch (e) { return calendarError(e); }

  waitUntil(Promise.all([send(env, tableConfirmation(env, t)), send(env, tableNotice(env, t))]).catch(() => {}));
  return json({ ok: true });
}
