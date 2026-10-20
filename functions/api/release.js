// GET /api/release?stay=…&event=…  (the guest edits their details or leaves the payment step)
// Frees the unpaid hold straight away and closes its Stripe session.
import { STAYS, configured, calendar, stripe, json } from '../../lib/booking.js';

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url), stay = u.searchParams.get('stay'), id = u.searchParams.get('event');
  const back = json({ ok: true });
  if (!STAYS[stay] || !id || !configured(env, stay)) return back;
  try {
    const cal = await calendar(env, stay), ev = await cal.get(id);
    const p = ev?.extendedProperties?.private || {};
    if (p.lcv !== 'hold') return back;
    if (p.session) await stripe(env, `checkout/sessions/${p.session}/expire`, {}).catch(() => {});
    await cal.remove(id);
  } catch (e) {}
  return back;
}
