// GET   /api/maite/restaurant?from=2026-11-01&to=2026-12-01  Every table on the restaurant's calendar in [from, to)
// POST  /api/maite/restaurant  { date, time, people, name, phone, email, notes, source }
//       A table taken by phone, WhatsApp or in person. Maite skips the web's limits (seats, notice, party size): the house decides.
// PATCH /api/maite/restaurant  { id, cancelled: true } and/or { id, paid }   paid: cents the table paid, or null to clear it.
//       Cancelled tables stay on the calendar as cancelled; their seats are free again.
// Openings, seats and limits change through /api/maite/settings (restaurant).
import { isDate, addDays, json } from '../../../lib/booking.js';
import { isSource } from '../../../lib/maite.js';
import { tablesConfigured, tables, tableEvent, asTable, isTime } from '../../../lib/restaurant.js';

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url), from = u.searchParams.get('from'), to = u.searchParams.get('to');
  if (!isDate(from) || !isDate(to) || to <= from || to > addDays(from, 400)) return json({ error: 'dates' }, 400);
  if (!tablesConfigured(env)) return json({ configured: false, tables: [] });
  try { return json({ configured: true, tables: await (await tables(env)).list(from, to) }); }
  catch (e) { return json({ error: 'calendar', detail: String(e.message || e) }, 502); }
}

export async function onRequestPost({ request, env, data }) {
  let b;
  try { b = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const clip = (v, n) => String(v ?? '').trim().slice(0, n);
  const t = {
    date: b.date, time: b.time, people: parseInt(b.people, 10), name: clip(b.name, 100), phone: clip(b.phone, 40), email: clip(b.email, 120),
    notes: clip(b.notes, 500), source: isSource(b.source) ? b.source : 'other',
  };
  if (!isDate(t.date)) return json({ error: 'dates' }, 400);
  if (!isTime(t.time)) return json({ error: 'time' }, 400);
  if (!(t.people >= 1 && t.people <= 200)) return json({ error: 'people' }, 400);
  if (t.name.length < 2) return json({ error: 'name' }, 400);
  if (!tablesConfigured(env)) return json({ error: 'restaurant_not_configured' }, 503);
  const ev = await (await tables(env)).create(tableEvent(t, data.user));
  return json({ ok: true, table: { ...asTable(ev), date: t.date, time: t.time } });
}

export async function onRequestPatch({ request, env, data }) {
  let b;
  try { b = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const paid = b.paid === undefined ? undefined : b.paid === null || b.paid === '' ? null : Math.round(Number(b.paid));
  if (typeof b.id !== 'string' || (b.cancelled !== true && paid === undefined)) return json({ error: 'bad_request' }, 400);
  if (paid != null && !(paid >= 0 && paid < 1e8)) return json({ error: 'amount' }, 400);
  if (!tablesConfigured(env)) return json({ error: 'restaurant_not_configured' }, 503);
  let cal, ev;
  try { cal = await tables(env); ev = await cal.get(b.id); }
  catch (e) { return json({ error: 'calendar', detail: String(e.message || e) }, 502); }
  if (!ev || ev.status === 'cancelled') return json({ error: 'not_found' }, 404);
  const p = { ...ev.extendedProperties?.private };
  const patch = {};
  if (paid !== undefined) p.paid = paid === null ? '' : String(paid);
  if (b.cancelled === true && p.state !== 'cancelled') {
    const when = new Intl.DateTimeFormat('ca-ES', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Madrid' }).format(new Date());
    Object.assign(patch, { summary: 'CANCEL·LADA: ' + (ev.summary || ''), colorId: '8', description: `Cancel·lada a Maite per ${data.user} el ${when}.\n\n` + (ev.description || '') });
    Object.assign(p, { state: 'cancelled', by: data.user });
  }
  const next = await cal.patch(b.id, { ...patch, extendedProperties: { private: p } });
  // Google answers the change in the calendar's own time zone; the day and time are the ones read above
  const was = asTable(ev);
  return json({ ok: true, table: { ...asTable(next), date: was.date, time: was.time } });
}
