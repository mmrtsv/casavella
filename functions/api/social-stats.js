// GET /api/social-stats   La Casa Vella's own Instagram numbers for the Claude social team (social.py, docs/social/README.md):
// followers and the latest 30 posts with likes and comments, plus reach, saves, shares and views when the token has
// instagram_business_manage_insights. Uses Maite's token (lib/instagram.js), so the script never holds it.
// Guarded like /api/social-cron, with the header authorization: Bearer <SOCIAL_CRON_SECRET>.
import { json } from '../../lib/booking.js';
import { ig, token } from '../../lib/instagram.js';

export async function onRequestGet({ request, env }) {
  const secret = env.SOCIAL_CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== 'Bearer ' + secret) return json({ error: 'access' }, 401);
  const t = await token(env).catch(() => null);
  if (!t) return json({ error: 'ig_not_configured' }, 503);
  try {
    const me = await ig(env, t, '/me?fields=username,followers_count,media_count');
    const d = await ig(env, t, '/me/media?fields=id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count&limit=30');
    let insights = true;
    const posts = [];
    for (const m of d.data || []) {
      const post = { id: m.id, at: m.timestamp, url: m.permalink, type: m.media_product_type || m.media_type,
        caption: (m.caption || '').slice(0, 200), likes: m.like_count ?? null, comments: m.comments_count ?? null };
      // Without the insights permission every call fails the same way: stop asking after the first
      if (insights) {
        try {
          const r = await ig(env, t, `/${m.id}/insights?metric=reach,saved,shares,views`);
          for (const x of r.data || []) post[x.name] = x.values?.[0]?.value ?? x.total_value?.value ?? null;
        } catch { insights = false; }
      }
      posts.push(post);
    }
    return json({ username: me.username, followers: me.followers_count ?? null, insights, posts });
  } catch (e) { return json({ error: 'ig', detail: e.message }, 502); }
}
