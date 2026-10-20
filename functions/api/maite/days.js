// POST /api/maite/days  { stays: ['montserrat', …], dates: ['2026-12-24', …], price, min }
// Special price for those nights and/or minimum stay for arrivals on those days.
// Each of price and min: a number sets it, null goes back to the normal one, left out keeps what there is.
import { STAYS, settings, isDate, today, json } from '../../../lib/booking.js';

export async function onRequestPost({ request, env, data }) {
  if (!env.MAITE) return json({ error: 'not_configured' }, 503);
  let b;
  try { b = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const stays = [...new Set([].concat(b.stays || []))], dates = [...new Set([].concat(b.dates || []))];
  if (!stays.length || !stays.every(s => STAYS[s])) return json({ error: 'stay' }, 400);
  if (!dates.length || dates.length > 731 || !dates.every(isDate)) return json({ error: 'dates' }, 400);
  const price = b.price === undefined ? undefined : b.price === null || b.price === '' ? null : Math.round(Number(b.price) * 100) / 100;
  const min = b.min === undefined ? undefined : b.min === null || b.min === '' ? null : Number(b.min);
  if (price != null && !(price >= 1 && price <= 5000)) return json({ error: 'price' }, 400);
  if (min != null && !(Number.isInteger(min) && min >= 1 && min <= 30)) return json({ error: 'min' }, 400);
  const S = await settings(env), t = today();
  for (const stay of stays) {
    // Past days are dropped as we go, so the list never grows without end
    const days = Object.fromEntries(Object.entries(S.days[stay] || {}).filter(([d]) => d >= t));
    for (const d of dates) {
      const v = { ...days[d] };
      if (price !== undefined) price === null ? delete v.price : v.price = price;
      if (min !== undefined) min === null ? delete v.min : v.min = min;
      if (Object.keys(v).length) days[d] = v; else delete days[d];
    }
    S.days[stay] = days;
  }
  await env.MAITE.put('settings', JSON.stringify({ ...S, by: data.user, at: new Date().toISOString() }));
  return json({ ok: true, days: S.days });
}
