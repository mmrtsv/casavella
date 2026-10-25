// GET /api/status?session_id=cs_…  (the return page after paying)
// Whether that Checkout Session was paid, so the page only says "confirmed" when it really is,
// and what was booked, for the ad conversion the page reports (only with the guest's consent).
import { stripe, json } from '../../lib/booking.js';

export async function onRequestGet({ request, env }) {
  const id = new URL(request.url).searchParams.get('session_id') || '';
  if (!/^cs_(live|test)_\w+$/.test(id) || !env.STRIPE_SECRET_KEY) return json({ error: 'session' }, 400);
  try {
    const s = await stripe(env, 'checkout/sessions/' + id, null, 'GET');
    return json({ status: s.status, paid: s.payment_status === 'paid', pending: s.status === 'complete' && s.payment_status !== 'paid', amount: (s.amount_total || 0) / 100, stay: s.metadata?.stay || '' });
  } catch (e) {
    return json({ error: 'server' }, 500);
  }
}
