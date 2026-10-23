// GET  /api/maite/instagram   { connected, username } Whether Maite can publish, and as which account.
//      ?media=1                adds media: what the account has published (latest 100, kept 30 minutes in KV), for the calendar and Perfil
// POST /api/maite/instagram   { id, image }  Publishes a post of the grid now with its saved caption. image: its JPEG, already
//                             uploaded through /api/maite/photos ('/photos/…'); Instagram fetches it from the public web.
// The token and the publishing itself are in lib/instagram.js.
import { json } from '../../../lib/booking.js';
import { load, view } from '../../../lib/social.js';
import { IMAGE, ig, publish, token } from '../../../lib/instagram.js';

export async function onRequestGet({ request, env }) {
  const t = await token(env).catch(() => null);
  if (!t) return json({ connected: false, media: [] });
  try {
    const me = await ig(env, t, '/me?fields=user_id,username');
    if (!new URL(request.url).searchParams.get('media')) return json({ connected: true, username: me.username });
    let cached = JSON.parse((await env.MAITE?.get('instagram-media')) || 'null');
    if (!cached || Date.now() - Date.parse(cached.at) > 30 * 60e3) {
      const d = await ig(env, t, '/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=100');
      const media = (d.data || []).map(m => ({ id: m.id, at: m.timestamp, url: m.permalink, image: m.thumbnail_url || m.media_url || '', type: m.media_type, caption: (m.caption || '').slice(0, 200) }));
      cached = { at: new Date().toISOString(), media };
      await env.MAITE?.put('instagram-media', JSON.stringify(cached));
    }
    return json({ connected: true, username: me.username, media: cached.media });
  } catch (e) { return json({ connected: false, media: [], detail: e.message }); }
}

export async function onRequestPost({ request, env, data }) {
  if (!env.MAITE) return json({ error: 'not_configured' }, 503);
  let b;
  try { b = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  if (!IMAGE.test(b?.image || '')) return json({ error: 'bad_request' }, 400);
  const t = await token(env);
  if (!t) return json({ error: 'ig_not_configured' }, 503);
  const post = (await load(env)).posts.find(p => p.id === b.id);
  if (!post) return json({ error: 'bad_request' }, 400);
  if (post.published) return json({ error: 'ig_published' }, 409);
  try { return view(await publish(env, t, post.id, b.image, data.user), env); }
  catch (e) { return json({ error: 'ig', detail: e.message }, 502); }
}
