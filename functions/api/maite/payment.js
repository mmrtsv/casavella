// GET /api/maite/payment?stay=montserrat&id=<event id>
// What Stripe knows about a web booking's payment: status, method (card brand and last digits, bank…), refunds, receipt.
import { STAYS, configured, calendar, stripe, json } from '../../../lib/booking.js';

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url), stay = u.searchParams.get('stay'), id = u.searchParams.get('id') || '';
  if (!STAYS[stay] || !id) return json({ error: 'bad_request' }, 400);
  if (!configured(env, stay)) return json({ error: 'not_configured' }, 503);
  const ev = await (await calendar(env, stay)).get(id);
  const p = ev?.extendedProperties?.private || {};
  try {
    const pi = p.pi || (p.session && (await stripe(env, 'checkout/sessions/' + p.session, null, 'GET')).payment_intent);
    if (!pi) return json({ error: 'no_payment' }, 404);
    const intent = await stripe(env, `payment_intents/${pi}?expand[]=latest_charge`, null, 'GET');
    const ch = intent.latest_charge || {}, d = ch.payment_method_details || {}, m = d[d.type] || {};
    return json({
      status: intent.status, amount: intent.amount, received: intent.amount_received, refunded: ch.amount_refunded || 0,
      created: intent.created, receipt: ch.receipt_url || '', livemode: intent.livemode,
      method: { type: d.type || '', brand: m.brand || '', last4: m.last4 || '', wallet: m.wallet?.type || '', country: m.country || '', bank: m.bank_name || m.bank || '' },
      link: `https://dashboard.stripe.com/${intent.livemode ? '' : 'test/'}payments/${pi}`,
    });
  } catch (e) {
    return json({ error: 'stripe', detail: String(e.message || e) }, 502);
  }
}
