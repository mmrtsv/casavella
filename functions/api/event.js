// POST /api/event  { people, message, name, email, phone, website, lang }
// A request for an event on a day the restaurant doesn't list (up to 16 people): mailed to the house (guest as reply-to),
// who answers with a day and a menu, and acknowledged to the guest. Nothing goes in the calendar.
// Without RESEND_API_KEY it answers 503 and the page gives the phone.
import { json } from '../../lib/booking.js';
import { send, eventNotice, eventReply, langOf } from '../../lib/email.js';

const MAX_EVENT = 16;

export async function onRequestPost({ request, env, waitUntil }) {
  const b = await request.json().catch(() => ({}));
  if (b.website) return json({ ok: true }); // honeypot: bots fill the hidden field
  const clip = (v, n) => String(v ?? '').trim().slice(0, n);
  const e = { people: Number(b.people), message: clip(b.message, 2000), name: clip(b.name, 100), email: clip(b.email, 120), phone: clip(b.phone, 40), lang: langOf(b.lang) };
  if (!(Number.isInteger(e.people) && e.people >= 1 && e.people <= MAX_EVENT)) return json({ error: 'people' }, 400);
  if (e.message.length < 3) return json({ error: 'message' }, 400);
  if (e.name.length < 2) return json({ error: 'name' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email)) return json({ error: 'email' }, 400);
  if (e.phone.replace(/\D/g, '').length < 6) return json({ error: 'phone' }, 400);
  if (!env.RESEND_API_KEY) return json({ error: 'not_configured' }, 503);

  if (!(await send(env, eventNotice(env, e)))) return json({ error: 'send_failed' }, 502);
  waitUntil(send(env, eventReply(env, e)).catch(() => {}));
  return json({ ok: true });
}
