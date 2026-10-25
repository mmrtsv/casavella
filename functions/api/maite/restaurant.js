// GET   /api/maite/restaurant?from=2026-11-01&to=2026-12-01  Every table on the restaurant's calendar in [from, to)
// POST  /api/maite/restaurant  { date, time, people, name, phone, email, notes, source }
//       A table taken by phone, WhatsApp or in person. Maite skips the web's limits (seats, notice, party size): the house decides.
// PATCH /api/maite/restaurant  { id, cancelled: true } and/or { id, paid }   paid: cents the table paid, or null to clear it.
//       and/or any of { date, time, people, name, phone, email, notes, source } to change the table (not a cancelled one,
//       nor one written by hand in Google Calendar). Cancelled tables stay on the calendar as cancelled; their seats are free again.
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

const FIELDS = ['date', 'time', 'people', 'name', 'phone', 'email', 'notes', 'source'];
const clip = (v, n) => String(v ?? '').trim().slice(0, n);
// A table as Maite sends it, checked: { t } or { error }
function tableOf(b) {
  const t = {
    date: b.date, time: b.time, people: parseInt(b.people, 10), name: clip(b.name, 100), phone: clip(b.phone, 40), email: clip(b.email, 120),
    notes: clip(b.notes, 500), source: b.source === 'web' || isSource(b.source) ? b.source : 'other',
  };
  if (!isDate(t.date)) return { error: 'dates' };
  if (!isTime(t.time)) return { error: 'time' };
  if (!(t.people >= 1 && t.people <= 200)) return { error: 'people' };
  if (t.name.length < 2) return { error: 'name' };
  return { t };
}

export async function onRequestPost({ request, env, data }) {
  let b;
  try { b = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const { t, error } = tableOf({ ...b, source: b.source === 'web' ? 'other' : b.source });
  if (error) return json({ error }, 400);
  if (!tablesConfigured(env)) return json({ error: 'restaurant_not_configured' }, 503);
  const ev = await (await tables(env)).create(tableEvent(t, data.user));
  return json({ ok: true, table: { ...asTable(ev), date: t.date, time: t.time } });
}

export async function onRequestPatch({ request, env, data }) {
  let b;
  try { b = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const paid = b.paid === undefined ? undefined : b.paid === null || b.paid === '' ? null : Math.round(Number(b.paid));
  const edits = FIELDS.some(k => b[k] !== undefined);
  if (typeof b.id !== 'string' || (b.cancelled !== true && paid === undefined && !edits)) return json({ error: 'bad_request' }, 400);
  if (paid != null && !(paid >= 0 && paid < 1e8)) return json({ error: 'amount' }, 400);
  if (!tablesConfigured(env)) return json({ error: 'restaurant_not_configured' }, 503);
  let cal, ev;
  try { cal = await tables(env); ev = await cal.get(b.id); }
  catch (e) { return json({ error: 'calendar', detail: String(e.message || e) }, 502); }
  if (!ev || ev.status === 'cancelled') return json({ error: 'not_found' }, 404);
  let p = { ...ev.extendedProperties?.private };
  let patch = {};
  if (edits) {
    const was = asTable(ev);
    if (p.lcv !== 'table' || was.cancelled) return json({ error: 'not_editable' }, 400);
    const { t, error } = tableOf({ ...was, ...Object.fromEntries(FIELDS.filter(k => b[k] !== undefined).map(k => [k, b[k]])) });
    if (error) return json({ error }, 400);
    // The event written again from the changed table, keeping who added it, what it paid and how it came in
    const next = tableEvent({ ...t, lang: was.lang }, p.by || data.user);
    const { summary, description, start, end, colorId } = next;
    patch = { summary, description, start, end, colorId };
    p = { ...p, ...next.extendedProperties.private };
  }
  if (paid !== undefined) p.paid = paid === null ? '' : String(paid);
  if (b.cancelled === true && p.state !== 'cancelled') {
    const when = new Intl.DateTimeFormat('ca-ES', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Madrid' }).format(new Date());
    Object.assign(patch, { summary: 'CANCEL·LADA: ' + (ev.summary || ''), colorId: '8', description: `Cancel·lada a Maite per ${data.user} el ${when}.\n\n` + (ev.description || '') });
    Object.assign(p, { state: 'cancelled', by: data.user });
  }
  const next = await cal.patch(b.id, { ...patch, extendedProperties: { private: p } });
  // Google answers the change in the calendar's own time zone; the day and time are the ones sent or read above
  const when = patch.start ? { date: patch.start.dateTime.slice(0, 10), time: patch.start.dateTime.slice(11, 16) } : asTable(ev);
  return json({ ok: true, table: { ...asTable(next), date: when.date, time: when.time } });
}
