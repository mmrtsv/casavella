// GET  /api/maite/bookings?from=2026-11-01&to=2026-12-01  Every entry on the stays' calendars in [from, to)
// POST /api/maite/bookings  { stay, first, until, guests, name, email, phone, amount, settled, source, arrival, notes }
//      A booking taken by phone, WhatsApp or in person: written to the stay's calendar, which blocks those nights.
import { STAYS, configured, calendar, prices, isDate, addDays, json } from '../../../lib/booking.js';
import { asBooking, manualEvent, isSource } from '../../../lib/maite.js';

export async function onRequestGet({ request, env, data }) {
  const u = new URL(request.url), from = u.searchParams.get('from'), to = u.searchParams.get('to');
  if (!isDate(from) || !isDate(to) || to <= from || to > addDays(from, 400)) return json({ error: 'dates' }, 400);
  const errors = [], bookings = [];
  await Promise.all(Object.keys(STAYS).map(async stay => {
    if (!configured(env, stay)) return errors.push({ stay, error: 'not_configured' });
    try {
      for (const e of await (await calendar(env, stay)).events(from, to))
        if (e.first < to && e.until > from) bookings.push(asBooking(stay, e));
    } catch (e) { errors.push({ stay, error: String(e.message || e) }); }
  }));
  bookings.sort((a, b) => a.first.localeCompare(b.first) || a.stay.localeCompare(b.stay));
  const stays = Object.entries(STAYS).map(([id, s]) => ({ id, name: s.name, max: s.max }));
  return json({ user: data.user, stays, prices: await prices(env), bookings, errors });
}

export async function onRequestPost({ request, env, data }) {
  let b;
  try { b = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const s = STAYS[b.stay], clip = (v, n) => String(v ?? '').trim().slice(0, n);
  if (!s) return json({ error: 'stay' }, 400);
  if (!isDate(b.first) || !isDate(b.until) || b.until <= b.first || b.until > addDays(b.first, 90)) return json({ error: 'dates' }, 400);
  const booking = {
    stay: b.stay, first: b.first, until: b.until, guests: Math.min(Math.max(parseInt(b.guests, 10) || 1, 1), s.max),
    name: clip(b.name, 100), email: clip(b.email, 120), phone: clip(b.phone, 40), arrival: clip(b.arrival, 40), notes: clip(b.notes, 480),
    amount: b.amount === '' || b.amount == null ? null : Math.round(Number(b.amount) * 100), settled: !!b.settled,
    source: isSource(b.source) ? b.source : 'other',
  };
  if (booking.name.length < 2) return json({ error: 'name' }, 400);
  if (booking.amount !== null && !(booking.amount >= 0 && booking.amount < 1e8)) return json({ error: 'amount' }, 400);
  if (!configured(env, b.stay)) return json({ error: 'not_configured' }, 503);
  const cal = await calendar(env, b.stay);
  const clash = await cal.conflicts(booking.first, booking.until);
  if (clash.length) return json({ error: 'unavailable', with: clash.map(e => asBooking(b.stay, e)) }, 409);
  const ev = await cal.create(manualEvent(booking, data.user));
  return json({ ok: true, booking: asBooking(b.stay, { ...ev, first: booking.first, until: booking.until }) });
}
