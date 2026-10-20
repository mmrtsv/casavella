// POST /api/maite/block  { stays: ['montserrat', …], first, until, note }
// Closes nights [first, until) on one or more stays. All or nothing: if any of them is taken, nothing is written.
import { STAYS, configured, calendar, isDate, addDays, json } from '../../../lib/booking.js';
import { asBooking } from '../../../lib/maite.js';

export async function onRequestPost({ request, env, data }) {
  let b;
  try { b = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const stays = [...new Set([].concat(b.stays || []))];
  if (!stays.length || !stays.every(s => STAYS[s])) return json({ error: 'stay' }, 400);
  if (!isDate(b.first) || !isDate(b.until) || b.until <= b.first || b.until > addDays(b.first, 400)) return json({ error: 'dates' }, 400);
  if (!stays.every(s => configured(env, s))) return json({ error: 'not_configured' }, 503);
  const note = String(b.note || '').trim().slice(0, 200);
  if (!note) return json({ error: 'note' }, 400);
  const cals = await Promise.all(stays.map(s => calendar(env, s)));
  const clash = (await Promise.all(cals.map(async (cal, i) => (await cal.conflicts(b.first, b.until)).map(e => asBooking(stays[i], e))))).flat();
  if (clash.length) return json({ error: 'unavailable', with: clash }, 409);
  await Promise.all(cals.map(cal => cal.create({
    summary: note ? `Tancat: ${note}` : 'Tancat', description: `Nits tancades a Maite per ${data.user}.`,
    start: { date: b.first }, end: { date: b.until }, colorId: '8',
    extendedProperties: { private: { lcv: 'block', notes: note, by: data.user } },
  })));
  return json({ ok: true });
}
