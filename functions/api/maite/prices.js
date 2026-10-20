// GET /api/maite/prices   PUT /api/maite/prices  { stays: { montserrat: 90, … }, d2: 5, d3: 10 }
// Nightly prices (euros) and the 2-night and 3-nights-or-more discounts (%), kept in the MAITE KV namespace.
// They apply to new quotes and payments straight away; bookings already made keep what they paid.
import { STAYS, prices, json } from '../../../lib/booking.js';

export const onRequestGet = async ({ env }) => json(await prices(env));

export async function onRequestPut({ request, env, data }) {
  if (!env.MAITE) return json({ error: 'not_configured' }, 503);
  let b;
  try { b = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const money = v => Math.round(Number(v) * 100) / 100, pct = v => Number(v);
  const next = { stays: {}, d2: pct(b.d2), d3: pct(b.d3), by: data.user, at: new Date().toISOString() };
  for (const stay of Object.keys(STAYS)) {
    const v = money(b.stays?.[stay]);
    if (!(v >= 1 && v <= 5000)) return json({ error: 'price', stay }, 400);
    next.stays[stay] = v;
  }
  if (![next.d2, next.d3].every(d => Number.isInteger(d) && d >= 0 && d <= 90)) return json({ error: 'discount' }, 400);
  await env.MAITE.put('prices', JSON.stringify(next));
  return json(await prices(env));
}
