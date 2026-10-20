// GET /api/search?in=2026-11-12&out=2026-11-15&guests=2
// Every stay with its price for those dates and, when the calendars are connected, whether it is free.
import { STAYS, quote, prices, configured, calendar, json } from '../../lib/booking.js';

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url), guests = parseInt(u.searchParams.get('guests'), 10) || 1;
  const p = await prices(env);
  const results = await Promise.all(Object.entries(STAYS).map(async ([stay, s]) => {
    const q = quote(stay, u.searchParams.get('in'), u.searchParams.get('out'), p);
    if (q.error) return { stay, error: q.error };
    let available = null;
    if (configured(env, stay)) {
      try { available = (await (await calendar(env, stay)).conflicts(q.checkin, q.checkout)).length === 0; } catch (e) {}
    }
    return { ...q, max: s.max, fits: guests <= s.max, available };
  }));
  if (results[0].error) return json({ error: results[0].error }, 400);
  return json({ results });
}
