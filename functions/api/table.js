// GET  /api/table?date=2026-11-14&people=4  The times with room for that many people, by service
// POST /api/table  { date, time, people, name, email, phone, notes, website, lang }
//      Books a table: written to the restaurant's calendar (CAL_RESTAURANT), confirmed to the guest and announced to the house.
// Services, seats and limits come from Maite (lib/booking.js settings().restaurant). Errors the page explains:
// offline (the web doesn't take tables now), closed, past, too_soon, too_far, party (more than maxParty), full, not_configured.
import { settings, isDate, addDays, json } from '../../lib/booking.js';
import { tablesConfigured, tables, tableEvent, servicesOn, serviceAt, serviceLoad, inTime, isTime, madridNow } from '../../lib/restaurant.js';
import { send, tableConfirmation, tableNotice, langOf } from '../../lib/email.js';

// The checks both calls share; returns an error body or null
function check(R, date, people, now) {
  if (!R.online) return { error: 'offline' };
  if (!isDate(date)) return { error: 'dates' };
  if (!(Number.isInteger(people) && people >= 1)) return { error: 'people' };
  if (people > R.maxParty) return { error: 'party', max: R.maxParty };
  if (date < now.date) return { error: 'past' };
  if (date > addDays(now.date, R.maxDays)) return { error: 'too_far', days: R.maxDays };
  if (!servicesOn(R, date).length) return { error: 'closed' };
  return null;
}

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url), date = u.searchParams.get('date'), people = Number(u.searchParams.get('people') || 2);
  const R = (await settings(env)).restaurant, now = madridNow();
  const bad = check(R, date, people, now);
  if (bad) return json(bad, 400);
  if (!tablesConfigured(env)) return json({ error: 'not_configured' }, 503);
  const list = await (await tables(env)).list(date, addDays(date, 1));
  const services = serviceLoad(R, date, list).map(s => ({
    name: s.name, times: s.times.map(time => ({ time, free: s.taken + people <= s.seats && inTime(R, date, time, now) })),
  }));
  return json({ date, people, services });
}

export async function onRequestPost({ request, env, waitUntil }) {
  const b = await request.json().catch(() => ({}));
  if (b.website) return json({ ok: true }); // honeypot: bots fill the hidden field
  const clip = (v, n) => String(v ?? '').trim().slice(0, n);
  const t = {
    date: b.date, time: b.time, people: Number(b.people), name: clip(b.name, 100), email: clip(b.email, 120), phone: clip(b.phone, 40),
    notes: clip(b.notes, 500), source: 'web', lang: langOf(b.lang),
  };
  const R = (await settings(env)).restaurant, now = madridNow();
  const bad = check(R, t.date, t.people, now);
  if (bad) return json(bad, 400);
  if (t.name.length < 2) return json({ error: 'name' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.email)) return json({ error: 'email' }, 400);
  if (t.phone.replace(/\D/g, '').length < 6) return json({ error: 'phone' }, 400);
  const s = isTime(t.time) && serviceAt(R, t.date, t.time);
  if (!s) return json({ error: 'time' }, 400);
  if (!inTime(R, t.date, t.time, now)) return json({ error: 'too_soon', hours: R.minHours }, 400);
  if (!tablesConfigured(env)) return json({ error: 'not_configured' }, 503);

  const cal = await tables(env);
  const load = serviceLoad(R, t.date, await cal.list(t.date, addDays(t.date, 1))).find(x => x.id === s.id);
  if (load.taken + t.people > s.seats) return json({ error: 'full' }, 409);
  await cal.create(tableEvent({ ...t, service: s.id }));

  const msg = { ...t, service: s.name };
  waitUntil(Promise.all([send(env, tableConfirmation(env, msg)), send(env, tableNotice(env, msg))]).catch(() => {}));
  return json({ ok: true });
}
