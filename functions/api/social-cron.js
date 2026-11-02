// POST /api/social-cron   Publishes the programmed Instagram posts whose time has come, keeps Maite's own Instagram plan going
// (lib/plan.js: the week's plan, the menus' reminders, their images), posts the weekly SEO routine's Google listing posts on
// their day (lib/gbp.js; each Instagram feed post goes to the listing too) and sends the day's review emails
// (lib/review-requests.js), and answers the new Google reviews (lib/review-replies.js). Called every few minutes by the
// cron Worker in cron/ with the header authorization: Bearer <SOCIAL_CRON_SECRET>. Lives outside /api/maite/ because
// Cloudflare Access only lets people in there; the secret is what guards it.
import { json } from '../../lib/booking.js';
import { runDue } from '../../lib/instagram.js';
import { sendReviewRequests } from '../../lib/review-requests.js';
import { tick } from '../../lib/plan.js';
import { runGoogleQueue } from '../../lib/gbp.js';
import { replyToReviews } from '../../lib/review-replies.js';

export async function onRequestPost({ request, env }) {
  const secret = env.SOCIAL_CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== 'Bearer ' + secret) return json({ error: 'access' }, 401);
  // The review emails go out once a day; most calls return straight away
  const reviews = await sendReviewRequests(env).catch(e => ({ error: e.message }));
  const plan = await tick(env).catch(e => ({ error: e.message }));
  const published = await runDue(env);
  // The weekly SEO routine's posts for the Google listing, on their day
  const google = await runGoogleQueue(env).catch(e => ({ error: e.message }));
  // The new Google reviews, at most once an hour
  const replies = await replyToReviews(env).catch(e => ({ error: e.message }));
  return json({ plan, published, reviews, google, replies });
}
