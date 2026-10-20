// Every Maite call needs a valid Cloudflare Access token for this application.
import { accessUser } from '../../../lib/maite.js';
import { json } from '../../../lib/booking.js';

export async function onRequest({ request, env, next, data }) {
  data.user = await accessUser(request, env).catch(() => null);
  if (!data.user) return json({ error: 'access' }, 401);
  return next();
}
