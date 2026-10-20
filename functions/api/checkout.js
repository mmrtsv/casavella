// POST /api/checkout  { stay, in, out, guests, name, email, phone, arrival, notes }
// Holds the dates in the stay's calendar for 45 minutes and opens a Stripe Checkout session.
// The webhook (stripe-webhook.js) confirms the hold when paid and removes it when the session expires.
import { STAYS, quote, configured, calendar, stripe, json, euros } from '../../lib/booking.js';

const fmt = d => new Date(d + 'T12:00:00Z').toLocaleDateString('ca-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const q = quote(body.stay, body.in, body.out);
  if (q.error) return json(q, 400);
  const guests = Math.min(Math.max(parseInt(body.guests, 10) || 1, 1), STAYS[q.stay].max);
  const clip = (v, n) => String(v || '').trim().slice(0, n);
  const guest = { name: clip(body.name, 100), email: clip(body.email, 120), phone: clip(body.phone, 40), arrival: clip(body.arrival, 40), notes: clip(body.notes, 480) };
  if (guest.name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email) || guest.phone.replace(/\D/g, '').length < 6) return json({ error: 'details' }, 400);
  if (!configured(env, q.stay)) return json({ error: 'not_configured' }, 503);

  let cal, hold;
  try {
    cal = await calendar(env, q.stay);
    if ((await cal.conflicts(q.checkin, q.checkout)).length) return json({ error: 'unavailable' }, 409);
    hold = await cal.create({
      summary: `Pendent de pagament: ${q.name}, ${guest.name}`,
      description: `Reserva iniciada a la web. Si no es paga en 45 minuts, aquest bloqueig desapareix sol.`,
      start: { date: q.checkin }, end: { date: q.checkout },
      colorId: '5', extendedProperties: { private: { lcv: 'hold' } },
    });
    // Two people paying for the same dates at the same moment: the earlier hold wins
    const rivals = (await cal.conflicts(q.checkin, q.checkout, hold.id))
      .filter(e => !(e.extendedProperties?.private?.lcv === 'hold' && (e.created > hold.created || (e.created === hold.created && e.id > hold.id))));
    if (rivals.length) { await cal.remove(hold.id); return json({ error: 'unavailable' }, 409); }

    const site = env.SITE_URL || new URL(request.url).origin;
    const label = `${q.nights} ${q.nights === 1 ? 'nit' : 'nits'}, del ${fmt(q.checkin)} al ${fmt(q.checkout)}, ${guests} ${guests === 1 ? 'persona' : 'persones'}`;
    const session = await stripe(env, 'checkout/sessions', {
      mode: 'payment',
      locale: 'auto',
      payment_method_types: ['card'],
      line_items: [{ quantity: 1, price_data: { currency: 'eur', unit_amount: q.total, product_data: {
        name: `${q.name}, La Casa Vella`,
        description: q.discount ? `${label}. ${q.price} € la nit amb un ${q.discount} % de descompte (abans ${euros(q.subtotal)})` : `${label}. ${q.price} € la nit`,
      } } }],
      customer_email: guest.email,
      billing_address_collection: 'auto',
      expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
      success_url: `${site}/?reserva=ok#reserva`,
      cancel_url: `${site}/api/release?stay=${q.stay}&event=${encodeURIComponent(hold.id)}`,
      metadata: { stay: q.stay, checkin: q.checkin, checkout: q.checkout, nights: q.nights, guests, event: hold.id, ...guest },
      payment_intent_data: { description: `${q.name}, ${label}`, metadata: { stay: q.stay, checkin: q.checkin, checkout: q.checkout, event: hold.id } },
    });
    await cal.patch(hold.id, { extendedProperties: { private: { lcv: 'hold', session: session.id } } });
    return json({ url: session.url });
  } catch (e) {
    if (hold) await cal.remove(hold.id).catch(() => {});
    return json({ error: 'server', detail: String(e.message || e) }, 502);
  }
}
