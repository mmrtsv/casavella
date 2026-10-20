// POST /api/contact  { name, email, message, website }
// Sends the contact form to the house inbox (guest as reply-to) and a copy to the guest, through Resend.
// Without RESEND_API_KEY it answers 503 and the page falls back to the guest's mail app.
import { json } from '../../lib/booking.js';
import { send, contactNotice, contactReply, texts } from '../../lib/email.js';

export async function onRequestPost({ request, env, waitUntil }) {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || '').trim().slice(0, 100);
  const email = String(body.email || '').trim().slice(0, 120);
  const message = String(body.message || '').trim().slice(0, 3000);
  if (body.website) return json({ ok: true }); // honeypot: bots fill the hidden field
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'invalid' }, 400);
  if (!env.RESEND_API_KEY) return json({ error: 'not_configured' }, 503);

  const msg = { name, email, message };
  if (!(await send(env, contactNotice(env, msg)))) return json({ error: 'send_failed' }, 502);
  waitUntil(texts(env).then(T => send(env, contactReply(env, msg, T))).catch(() => {}));
  return json({ ok: true });
}
