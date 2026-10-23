// POST /api/social-cron   Publishes the programmed Instagram posts whose time has come. Called every few minutes by the
// cron Worker in cron/ with the header authorization: Bearer <SOCIAL_CRON_SECRET>. Lives outside /api/maite/ because
// Cloudflare Access only lets people in there; the secret is what guards it.
import { json } from '../../lib/booking.js';
import { runDue } from '../../lib/instagram.js';

export async function onRequestPost({ request, env }) {
  const secret = env.SOCIAL_CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== 'Bearer ' + secret) return json({ error: 'access' }, 401);
  return json({ published: await runDue(env) });
}
