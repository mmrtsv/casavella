// GET /api/release?stay=…&event=…  (Stripe's "back" link from Checkout)
// Frees the unpaid hold straight away and closes its Stripe session, then returns to the booking form.
import { STAYS, configured, calendar, stripe } from '../../lib/booking.js';

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url), stay = u.searchParams.get('stay'), id = u.searchParams.get('event');
  const back = Response.redirect(new URL('/?reserva=cancel#reserva', u.origin).toString(), 303);
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
