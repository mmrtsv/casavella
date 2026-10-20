// POST /api/maite/check  { stay, id, set: { checkin, checkout, police, settled, method, email, phone, memo } }
// Ticks the booking's checklist. Everything is kept on the booking's calendar event (private properties),
// next to the guest details. checkin/checkout: true stamps the current time, false clears it.
import { STAYS, configured, calendar, json } from '../../../lib/booking.js';
import { asBooking, METHODS } from '../../../lib/maite.js';

export async function onRequestPost({ request, env, data }) {
  let b;
  try { b = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  if (!STAYS[b.stay] || typeof b.id !== 'string' || !b.set || typeof b.set !== 'object') return json({ error: 'bad_request' }, 400);
  if (!configured(env, b.stay)) return json({ error: 'not_configured' }, 503);
  const cal = await calendar(env, b.stay), ev = await cal.get(b.id);
  if (!ev || ev.status === 'cancelled') return json({ error: 'not_found' }, 404);
  const p = { ...ev.extendedProperties?.private }, kind = asBooking(b.stay, { ...ev, first: '', until: '' }).kind;
  if (!['paid', 'pending', 'manual'].includes(kind)) return json({ error: 'kind' }, 400);
  const set = b.set, clip = (v, n) => String(v ?? '').trim().slice(0, n), patch = {};
  const now = new Date().toISOString();
  if ('checkin' in set) p.in = set.checkin ? p.in || now : '';
  if ('checkout' in set) p.out = set.checkout ? p.out || now : '';
  // Documents are marked done only by an upload (see docs.js), never by hand
  if ('police' in set) p.police = set.police ? 'yes' : '';
  if ('memo' in set) p.memo = clip(set.memo, 1000);
  if ('phone' in set) p.phone = clip(set.phone, 40);
  if ('email' in set) {
    p.email = clip(set.email, 120);
    if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) return json({ error: 'email' }, 400);
  }
  if ('settled' in set || 'method' in set) {
    if (kind !== 'manual') return json({ error: 'kind' }, 400);   // web bookings: Stripe decides
    if ('settled' in set) { p.settled = set.settled ? 'yes' : 'no'; patch.colorId = set.settled ? '10' : '5'; }
    if ('method' in set) p.method = set.method in METHODS ? set.method : '';
  }
  p.checkedBy = data.user;
  const out = await cal.patch(b.id, { ...patch, extendedProperties: { private: p } });
  return json({ ok: true, booking: asBooking(b.stay, { ...out, first: out.start.date || out.start.dateTime.slice(0, 10), until: out.end.date || out.end.dateTime.slice(0, 10) }) });
}
