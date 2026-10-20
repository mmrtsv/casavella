// GET /api/quote?stay=les-vinyes&in=2026-11-12&out=2026-11-15
// Price for the stay and, when the calendars are connected, whether the dates are free.
import { quote, prices, configured, calendar, json } from '../../lib/booking.js';

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  const q = quote(u.searchParams.get('stay'), u.searchParams.get('in'), u.searchParams.get('out'), await prices(env));
  if (q.error) return json(q, 400);
  if (!configured(env, q.stay)) return json({ ...q, available: null, online: false });
  try {
    const busy = await (await calendar(env, q.stay)).conflicts(q.checkin, q.checkout);
    return json({ ...q, available: busy.length === 0, online: true });
  } catch (e) {
    return json({ ...q, available: null, online: false });
  }
}
