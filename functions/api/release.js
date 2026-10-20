// GET /api/release?session=cs_…  (the guest edits their details or leaves the payment step)
// Closes the unpaid Stripe session so it can no longer be paid with stale details.
import { stripe, json } from '../../lib/booking.js';

export async function onRequestGet({ request, env }) {
  const id = new URL(request.url).searchParams.get('session') || '';
  if (/^cs_(live|test)_\w+$/.test(id) && env.STRIPE_SECRET_KEY) await stripe(env, `checkout/sessions/${id}/expire`, {}).catch(() => {});
  return json({ ok: true });
}
