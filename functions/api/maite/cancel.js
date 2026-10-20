// POST /api/maite/cancel  { stay, id, refund }
// Closed nights: the block is removed. Bookings: kept on the calendar as cancelled (no longer blocking),
// and for web bookings, `refund` cents go back to the guest's card through Stripe.
import { STAYS, configured, calendar, stripe, json, euros } from '../../../lib/booking.js';
import { asBooking } from '../../../lib/maite.js';

export async function onRequestPost({ request, env, data }) {
  let b;
  try { b = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  if (!STAYS[b.stay] || typeof b.id !== 'string') return json({ error: 'bad_request' }, 400);
  if (!configured(env, b.stay)) return json({ error: 'not_configured' }, 503);
  const cal = await calendar(env, b.stay);
  const ev = await cal.get(b.id);
  if (!ev || ev.status === 'cancelled') return json({ error: 'not_found' }, 404);
  const p = ev.extendedProperties?.private || {};
  const bk = asBooking(b.stay, { ...ev, first: '', until: '' });

  if (bk.kind === 'block') {
    await cal.remove(b.id);
    return json({ ok: true });
  }
  // A bank payment Stripe has not confirmed yet would put the booking back when it lands
  if (bk.kind === 'pending') return json({ error: 'pending' }, 409);
  if (bk.kind !== 'paid' && bk.kind !== 'manual') return json({ error: 'kind' }, 400);

  let refunded = 0;
  const refund = Math.round(Number(b.refund) || 0);
  if (refund > 0) {
    if (bk.kind !== 'paid') return json({ error: 'refund_manual' }, 400);
    if (bk.amount !== null && refund > bk.amount) return json({ error: 'refund_amount' }, 400);
    try {
      const pi = p.pi || (p.session && (await stripe(env, 'checkout/sessions/' + p.session, null, 'GET')).payment_intent);
      if (!pi) return json({ error: 'no_payment' }, 400);
      await stripe(env, 'refunds', { payment_intent: pi, amount: refund, metadata: { reason: 'cancelled_in_maite', by: data.user } });
      refunded = refund;
    } catch (e) {
      return json({ error: 'stripe', detail: String(e.message || e) }, 502);
    }
  }
  const when = new Intl.DateTimeFormat('ca-ES', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Madrid' }).format(new Date());
  await cal.patch(b.id, {
    summary: 'CANCEL·LADA: ' + (ev.summary || ''), transparency: 'transparent', colorId: '8',
    description: `Cancel·lada a Maite per ${data.user} el ${when}.` + (refunded ? ` Retornats ${euros(refunded)} per Stripe.` : '') + '\n\n' + (ev.description || ''),
    extendedProperties: { private: { ...p, lcv: 'cancelled', was: bk.kind, refunded: String(refunded), by: data.user } },
  });
  return json({ ok: true, refunded });
}
