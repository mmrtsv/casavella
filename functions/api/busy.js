// GET /api/busy?stay=les-vinyes
// Booked nights for the next year, so the calendar can strike them out. Only dates, no guest details.
import { STAYS, configured, calendar, addDays, json } from '../../lib/booking.js';

export async function onRequestGet({ request, env }) {
  const stay = new URL(request.url).searchParams.get('stay');
  if (!STAYS[stay]) return json({ error: 'stay' }, 400);
  if (!configured(env, stay)) return json({ busy: null });
  try {
    const from = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date()), to = addDays(from, 400);
    const nights = new Set();
    for (const e of await (await calendar(env, stay)).blocking(from, to))
      for (let d = e.first < from ? from : e.first; d < e.until && d < to; d = addDays(d, 1)) nights.add(d);
    return json({ busy: [...nights].sort() });
  } catch (e) {
    return json({ busy: null });
  }
}
