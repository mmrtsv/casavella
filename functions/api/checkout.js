// POST /api/checkout  { stay, in, out, guests, name, email, phone, arrival, notes }
// Checks the stay's calendar and opens a Stripe Checkout session in Elements mode:
// the card form is embedded in our own booking page. Nothing is blocked until the guest pays;
// the webhook (stripe-webhook.js) writes the booking to the calendar once the payment is complete.
import { STAYS, quote, settings, configured, calendar, stripe, json, euros } from '../../lib/booking.js';
import { content } from '../../lib/stays.js';

const fmt = d => new Date(d + 'T12:00:00Z').toLocaleDateString('ca-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const S = await settings(env), q = quote(body.stay, body.in, body.out, S);
  if (q.error) return json(q, 400);
  const guests = Math.min(Math.max(parseInt(body.guests, 10) || 1, 1), (await content(env))[q.stay].max);
  const clip = (v, n) => String(v || '').trim().slice(0, n);
  const guest = { name: clip(body.name, 100), email: clip(body.email, 120), phone: clip(body.phone, 40), arrival: clip(body.arrival, 40), notes: clip(body.notes, 480) };
  if (guest.name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email) || guest.phone.replace(/\D/g, '').length < 6) return json({ error: 'details' }, 400);
  if (!configured(env, q.stay) || !env.STRIPE_PUBLISHABLE_KEY) return json({ error: 'not_configured' }, 503);

  try {
    if ((await (await calendar(env, q.stay)).conflicts(q.checkin, q.checkout)).length) return json({ error: 'unavailable' }, 409);
    const site = env.SITE_URL || new URL(request.url).origin;
    const label = `${q.nights} ${q.nights === 1 ? 'nit' : 'nits'}, del ${fmt(q.checkin)} al ${fmt(q.checkout)}, ${guests} ${guests === 1 ? 'persona' : 'persones'}`;
    const session = await stripe(env, 'checkout/sessions', {
      mode: 'payment',
      ui_mode: 'elements',
      locale: body.lang === 'en' ? 'en' : 'es', // the page's language; Stripe has no Catalan, Spanish is the closest
      line_items: [{ quantity: 1, price_data: { currency: 'eur', unit_amount: q.total, product_data: {
        name: `${q.name}, La Casa Vella`,
        description: (q.price != null ? `${label}. ${euros(q.price * 100)} la nit` : `${label}. ${euros(q.subtotal)} en total`) + (q.discount ? ` amb un ${q.discount} % de descompte (abans ${euros(q.subtotal)})` : ''),
      } } }],
      customer_email: guest.email,
      billing_address_collection: 'auto',
      expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
      return_url: `${site}/?reserva=ok&session_id={CHECKOUT_SESSION_ID}#reserva`,
      // The cancellation policy the guest accepted, so Maite refunds by it even if it changes later
      metadata: { stay: q.stay, checkin: q.checkin, checkout: q.checkout, nights: q.nights, guests, policy: `${S.cancel.fullDays ?? ''}/${S.cancel.partialDays ?? ''}/${S.cancel.partialPct}`, ...guest },
      payment_intent_data: { description: `${q.name}, ${label}`, metadata: { stay: q.stay, checkin: q.checkin, checkout: q.checkout } },
    });
    return json({ clientSecret: session.client_secret, publishableKey: env.STRIPE_PUBLISHABLE_KEY, release: `/api/release?session=${encodeURIComponent(session.id)}` });
  } catch (e) {
    return json({ error: 'server', detail: String(e.message || e) }, 500);
  }
}
