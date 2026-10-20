// POST /api/stripe-webhook  (Stripe → checkout.session.completed / .expired / .async_payment_succeeded / .async_payment_failed)
// Paid: the calendar hold becomes the booking. Expired or failed: the hold is removed.
// Paid later (bank payments): the hold stays as "pending" until Stripe confirms or fails it.
// If a paid session's hold is gone and the dates were taken meanwhile, the payment is refunded.
import { STAYS, calendar, stripe, verifyStripe, json, euros } from '../../lib/booking.js';

export async function onRequestPost({ request, env }) {
  const body = await request.text();
  if (!env.STRIPE_WEBHOOK_SECRET || !(await verifyStripe(env, body, request.headers.get('stripe-signature')))) return json({ error: 'signature' }, 400);
  const event = JSON.parse(body);
  const s = event.data.object, m = s.metadata || {};
  if (!STAYS[m.stay]) return json({ ignored: true });
  const cal = await calendar(env, m.stay);

  if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
    const ev = m.event && await cal.get(m.event);
    if (ev && ['hold', 'pending'].includes(ev.extendedProperties?.private?.lcv)) await cal.remove(m.event);
    return json({ ok: true });
  }
  if (event.type === 'checkout.session.completed' && s.payment_status !== 'paid') {
    // A payment that confirms later: keep the dates blocked while Stripe waits for it
    if (m.event) await cal.patch(m.event, { summary: `Pendent de cobrament: ${STAYS[m.stay].name}, ${m.name || ''}`, extendedProperties: { private: { lcv: 'pending', session: s.id } } }).catch(() => {});
    return json({ ok: true, pending: true });
  }
  if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type) || s.payment_status !== 'paid') return json({ ignored: true });

  const cd = s.customer_details || {};
  const c = { name: m.name || cd.name, email: m.email || cd.email, phone: m.phone || cd.phone };
  const booking = {
    summary: `${STAYS[m.stay].name}: ${c.name || 'Reserva web'} (${m.guests} pers.)`,
    description: [
      `Reserva pagada a la web: ${euros(s.amount_total)}`,
      `${m.nights} nits, del ${m.checkin} al ${m.checkout}`,
      `Hostes: ${m.guests}`,
      c.name && `Nom: ${c.name}`, c.email && `Correu: ${c.email}`, c.phone && `Telèfon: ${c.phone}`,
      m.arrival && `Arribada prevista: ${m.arrival}`, m.notes && `Comentaris: ${m.notes}`,
      `Stripe: https://dashboard.stripe.com/${s.livemode ? '' : 'test/'}payments/${s.payment_intent}`,
    ].filter(Boolean).join('\n'),
    start: { date: m.checkin }, end: { date: m.checkout },
    colorId: '10', extendedProperties: { private: { lcv: 'paid', session: s.id } },
  };

  const hold = m.event && await cal.get(m.event);
  if (hold && hold.status !== 'cancelled') {
    if (hold.extendedProperties?.private?.lcv !== 'paid') await cal.patch(m.event, booking);
    return json({ ok: true });
  }
  // The hold disappeared (paid very late): book only if the dates are still free
  if ((await cal.conflicts(m.checkin, m.checkout)).length === 0) {
    await cal.create(booking);
    return json({ ok: true });
  }
  await stripe(env, 'refunds', { payment_intent: s.payment_intent, metadata: { reason: 'dates_taken' } });
  await cal.create({ ...booking, summary: `REEMBORSADA: ${booking.summary}`, transparency: 'transparent', colorId: '11',
    description: 'Les dates ja estaven ocupades quan va arribar el pagament. Stripe ha retornat els diners automàticament.\n\n' + booking.description });
  return json({ ok: true, refunded: true });
}
