// The email asking for a Google review (reviewRequest in email.js), the day after each guest leaves.
// Runs at most once a day, from 11:00 Madrid time on: called by the cron Worker (via /api/social-cron) and, so it
// doesn't depend on it, by /api/settings, which every visit to the web asks for. The day it last ran is in KV
// (MAITE, key "review-requests"); each booking that got its email is marked in its calendar event (review: sent).
// Who gets it: web and Maite bookings, not cancelled, with an email, that left in the last three days
// (so a day without visits or cron doesn't skip anyone). REVIEW_EMAILS=off stops it.
import { STAYS, calendar, configured, addDays, stripe } from './booking.js';
import { asBooking } from './maite.js';
import { reviewRequest, send } from './email.js';

const madrid = () => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date()).map(p => [p.type, p.value]));
  return { day: `${parts.year}-${parts.month}-${parts.day}`, hour: +parts.hour };
};

// The language the guest booked in: saved with the booking since this change, else from Stripe, else Catalan
async function languageOf(env, p) {
  if (['ca', 'es', 'en'].includes(p.lang)) return p.lang;
  if (p.session && env.STRIPE_SECRET_KEY) {
    try { const l = (await stripe(env, 'checkout/sessions/' + p.session, null, 'GET')).metadata?.lang; if (['ca', 'es', 'en'].includes(l)) return l; } catch (e) {}
  }
  return 'ca';
}

export async function sendReviewRequests(env, now = madrid()) {
  if (env.REVIEW_EMAILS === 'off' || !env.MAITE || !env.RESEND_API_KEY || !env.GOOGLE_SA_KEY) return { skipped: 'not_configured' };
  if (now.hour < 11) return { skipped: 'early' };
  if ((await env.MAITE.get('review-requests', 'json'))?.day === now.day) return { skipped: 'done_today' };
  await env.MAITE.put('review-requests', JSON.stringify({ day: now.day }));

  const sent = [], seen = new Set();
  for (const stay of Object.keys(STAYS).filter(k => configured(env, k))) {
    const cal = await calendar(env, stay);
    for (const e of await cal.events(addDays(now.day, -4), now.day)) {
      const b = asBooking(stay, e), p = e.extendedProperties?.private || {};
      if (!['paid', 'manual'].includes(b.kind) || p.review || !b.email || b.until >= now.day || b.until < addDays(now.day, -3)) continue;
      const email = b.email.trim().toLowerCase();
      if (seen.has(email)) continue;
      seen.add(email);
      const ok = await send(env, reviewRequest(env, { name: b.name, email: b.email, stay, lang: await languageOf(env, p) })).catch(() => false);
      if (!ok) continue;
      await cal.patch(e.id, { extendedProperties: { private: { ...p, review: 'sent', reviewAt: now.day } } });
      sent.push(e.id);
    }
  }
  return { sent: sent.length };
}
