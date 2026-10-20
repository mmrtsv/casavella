// GET /api/search?in=2026-11-12&out=2026-11-15&guests=2
// Every stay with its price for those dates and, when the calendars are connected, whether it is free.
import { STAYS, quote, settings, configured, calendar, json } from '../../lib/booking.js';
import { content } from '../../lib/stays.js';

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url), guests = parseInt(u.searchParams.get('guests'), 10) || 1;
  const [p, C] = await Promise.all([settings(env), content(env)]);
  const results = await Promise.all(Object.keys(STAYS).map(async stay => {
    const s = C[stay];
    const q = quote(stay, u.searchParams.get('in'), u.searchParams.get('out'), p);
    if (q.error) return { ...q, stay, max: s.max, fits: guests <= s.max, available: false };
    let available = null;
    if (configured(env, stay)) {
      try { available = (await (await calendar(env, stay)).conflicts(q.checkin, q.checkout)).length === 0; } catch (e) {}
    }
    return { ...q, max: s.max, fits: guests <= s.max, available };
  }));
  // Bad dates for every stay (past, too far…): an error. Otherwise each stay says why it can't be booked (minimum stay)
  if (results.every(r => r.error)) return json(results[0], 400);
  return json({ results });
}
