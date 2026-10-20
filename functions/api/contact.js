// POST /api/contact  { name, email, message, website }
// Sends the contact form to the house inbox through Resend, with the guest as reply-to.
// Without RESEND_API_KEY it answers 503 and the page falls back to the guest's mail app.
import { json } from '../../lib/booking.js';

const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || '').trim().slice(0, 100);
  const email = String(body.email || '').trim().slice(0, 120);
  const message = String(body.message || '').trim().slice(0, 3000);
  if (body.website) return json({ ok: true }); // honeypot: bots fill the hidden field
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'invalid' }, 400);
  if (!env.RESEND_API_KEY) return json({ error: 'not_configured' }, 503);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM || 'La Casa Vella <web@casavellarural.com>',
      to: [env.CONTACT_TO || 'info@casavellarural.com'],
      reply_to: email,
      subject: `Missatge de la web: ${name}`,
      text: `${name} <${email}>\n\n${message || '(sense missatge)'}`,
      html: `<p><strong>${esc(name)}</strong> &lt;${esc(email)}&gt;</p><p style="white-space:pre-wrap">${esc(message || '(sense missatge)')}</p>`,
    }),
  });
  if (!res.ok) return json({ error: 'send_failed' }, 502);
  return json({ ok: true });
}
