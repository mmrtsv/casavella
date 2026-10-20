// POST /api/maite/photos  (body: the image, already resized in the browser; content-type image/jpeg, webp or png)
// Stores it in R2 (PHOTOS) and answers with the address to use in a stay's photo list.
import { json } from '../../../lib/booking.js';

const TYPES = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' };

export async function onRequestPost({ request, env, data }) {
  if (!env.PHOTOS) return json({ error: 'not_configured' }, 503);
  const type = (request.headers.get('content-type') || '').split(';')[0], ext = TYPES[type];
  if (!ext) return json({ error: 'type' }, 400);
  const body = await request.arrayBuffer();
  if (!body.byteLength || body.byteLength > 8 * 1024 * 1024) return json({ error: 'size' }, 400);
  const key = `${crypto.randomUUID()}.${ext}`;
  await env.PHOTOS.put(key, body, { httpMetadata: { contentType: type, cacheControl: 'public, max-age=31536000, immutable' }, customMetadata: { by: data.user } });
  return json({ src: '/photos/' + key });
}
