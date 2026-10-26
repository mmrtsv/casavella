// POST   /api/maite/push  { token }  The Android app registers its Firebase Cloud Messaging token, kept with who is signed in.
// DELETE /api/maite/push  { token }  Forgets it (signing out). Only the app calls this: the web gets no push (lib/push.js).
import { json } from '../../../lib/booking.js';
import { addDevice, removeDevice } from '../../../lib/push.js';

async function token(request) {
  const b = await request.json().catch(() => ({}));
  const t = typeof b.token === 'string' ? b.token.trim() : '';
  return /^[\w:.-]{20,400}$/.test(t) ? t : null;
}

export async function onRequestPost({ request, env, data }) {
  const t = await token(request);
  if (!t) return json({ error: 'bad_request' }, 400);
  if (!env.MAITE) return json({ error: 'kv' }, 503);
  await addDevice(env, t, data.user);
  return json({ ok: true });
}

export async function onRequestDelete({ request, env }) {
  const t = await token(request);
  if (!t) return json({ error: 'bad_request' }, 400);
  if (env.MAITE) await removeDevice(env, t);
  return json({ ok: true });
}
