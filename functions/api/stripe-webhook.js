// POST /api/stripe-webhook  (Stripe → checkout.session.completed / .expired / .async_payment_succeeded / .async_payment_failed)
// Only completed bookings reach the calendar. Paid: the booking is written to the stay's calendar.
// Paid later (bank payments): the dates are kept as "pending" until Stripe confirms or fails it.
// If the dates were taken meanwhile (two guests paying at once), the payment is refunded.
import { STAYS, calendar, stripe, verifyStripe, json, euros, settings, policyText } from '../../lib/booking.js';
import { send, bookingConfirmation, bookingNotice, texts } from '../../lib/email.js';

export async function onRequestPost({ request, env, waitUntil }) {
  const body = await request.text();
  if (!env.STRIPE_WEBHOOK_SECRET || !(await verifyStripe(env, body, request.headers.get('stripe-signature')))) return json({ error: 'signature' }, 400);
  const event = JSON.parse(body);
  const s = event.data.object, m = s.metadata || {};
  if (!STAYS[m.stay]) return json({ ignored: true });
  const cal = await calendar(env, m.stay);
  // The calendar event this session already wrote, if any (pending bank payment, or a retried webhook)
  const mine = async () => (await cal.blocking(m.checkin, m.checkout)).find(e => e.extendedProperties?.private?.session === s.id);

  if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
    const ev = await mine();
    if (ev && ev.extendedProperties.private.lcv === 'pending') await cal.remove(ev.id);
    // Sessions from before this change created a hold event of their own
    const old = m.event && await cal.get(m.event);
    if (old && old.extendedProperties?.private?.lcv === 'hold') await cal.remove(m.event);
    return json({ ok: true });
  }
  const paidNow = ['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type) && s.payment_status === 'paid';
  const waiting = event.type === 'checkout.session.completed' && s.payment_status !== 'paid';
  if (!paidNow && !waiting) return json({ ignored: true });

  const cd = s.customer_details || {};
  const c = { name: m.name || cd.name, email: m.email || cd.email, phone: m.phone || cd.phone };
  const booking = {
    summary: waiting ? `Pendent de cobrament: ${STAYS[m.stay].name}, ${c.name || ''}` : `${STAYS[m.stay].name}: ${c.name || 'Reserva web'} (${m.guests} pers.)`,
    description: [
      waiting ? `Pagament pendent de confirmar pel banc: ${euros(s.amount_total)}` : `Reserva pagada a la web: ${euros(s.amount_total)}`,
      `${m.nights} nits, del ${m.checkin} al ${m.checkout}`,
      `Hostes: ${m.guests}`,
      c.name && `Nom: ${c.name}`, c.email && `Correu: ${c.email}`, c.phone && `Telèfon: ${c.phone}`,
      m.arrival && `Arribada prevista: ${m.arrival}`, m.notes && `Comentaris: ${m.notes}`,
      `Stripe: https://dashboard.stripe.com/${s.livemode ? '' : 'test/'}payments/${s.payment_intent}`,
    ].filter(Boolean).join('\n'),
    start: { date: m.checkin }, end: { date: m.checkout },
    colorId: waiting ? '5' : '10',
    // Read back by Maite (the back office) to list the booking and refund it
    extendedProperties: { private: { lcv: waiting ? 'pending' : 'paid', session: s.id, pi: s.payment_intent || '', amount: String(s.amount_total ?? ''),
      guests: String(m.guests || ''), policy: m.policy || '', name: c.name || '', email: c.email || '', phone: c.phone || '' } },
  };
  // Confirmation to the guest and a notice to the house; a failed email never fails the webhook
  const notify = () => waitUntil((async () => {
    const meta = { ...m, ...c }, [S, T] = await Promise.all([settings(env), texts(env)]);
    // The policy the guest accepted at checkout ("fullDays/partialDays/partialPct"), else today's
    const [f, d, pct] = (m.policy || '').split('/');
    const cancel = m.policy ? { fullDays: f === '' ? null : +f, partialDays: d === '' ? null : +d, partialPct: +pct || 0 } : S.cancel;
    const extra = { checkin: S.rules.checkin, checkout: S.rules.checkout, policy: policyText(cancel) };
    await Promise.all([
      c.email && send(env, bookingConfirmation(env, meta, s.amount_total, waiting, extra, T)),
      send(env, bookingNotice(env, meta, s.amount_total, waiting)),
    ]);
  })().catch(() => {}));

  const existing = await mine();
  if (existing) {
    const was = existing.extendedProperties.private.lcv;
    if (was !== 'paid') await cal.patch(existing.id, booking);
    if (was === 'pending' && paidNow) notify(); // the bank payment has cleared
    return json({ ok: true });
  }
  const old = m.event && await cal.get(m.event);
  if (old && old.status !== 'cancelled' && old.extendedProperties?.private?.lcv === 'hold') {
    await cal.patch(m.event, booking);
    notify();
    return json({ ok: true });
  }
  if ((await cal.conflicts(m.checkin, m.checkout)).length === 0) {
    await cal.create(booking);
    notify();
    return json({ ok: true });
  }
  // Someone else completed a booking for these dates first
  if (s.payment_intent) await stripe(env, 'refunds', { payment_intent: s.payment_intent, metadata: { reason: 'dates_taken' } });
  await cal.create({ ...booking, summary: `REEMBORSADA: ${STAYS[m.stay].name}, ${c.name || ''}`, transparency: 'transparent', colorId: '11',
    extendedProperties: { private: { ...booking.extendedProperties.private, lcv: 'refunded' } },
    description: 'Les dates ja estaven reservades quan va arribar el pagament. Stripe ha retornat els diners automàticament.\n\n' + booking.description });
  return json({ ok: true, refunded: true });
}
