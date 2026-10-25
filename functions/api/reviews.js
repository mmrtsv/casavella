// GET /api/reviews?lang=ca|es|en
// The house's Google rating and the reviews Google shows first (up to five, its "most relevant"), from the Places API (New),
// for the page's reviews section. Each review keeps its author's name and link next to it, as Google asks.
// Google's terms don't allow keeping the reviews, so the server stores nothing: the page asks only when the section
// comes into view, and the browser keeps the answer for an hour.
// Access: GOOGLE_PLACES_KEY (an API key limited to the Places API), else the service account of the calendars
// (GOOGLE_SA_EMAIL, GOOGLE_SA_KEY) with the Places API (New) enabled in its Google Cloud project.
import { googleToken } from '../../lib/booking.js';

export const PLACE_ID = 'ChIJK6vlrrVlpBIRBAeTHj5ufvE';
const FIELDS = 'rating,userRatingCount,googleMapsUri,reviews';

const json = (data, status = 200, cache = 'no-store') =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache } });

export function shape(place) {
  return {
    rating: place.rating ?? null,
    count: place.userRatingCount ?? 0,
    url: place.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${PLACE_ID}`,
    reviews: (place.reviews || []).filter(r => r.text?.text || r.originalText?.text).map(r => ({
      author: r.authorAttribution?.displayName || 'Google',
      authorUrl: r.authorAttribution?.uri || '',
      rating: r.rating ?? null,
      when: r.relativePublishTimeDescription || '',
      text: (r.text || r.originalText).text,
      translated: !!(r.text && r.originalText && r.text.languageCode !== r.originalText.languageCode),
      url: r.googleMapsUri || '',
    })),
  };
}

export async function onRequestGet({ request, env }) {
  const asked = new URL(request.url).searchParams.get('lang'), lang = ['ca', 'es', 'en'].includes(asked) ? asked : 'ca';
  const headers = { 'x-goog-fieldmask': FIELDS };
  if (env.GOOGLE_PLACES_KEY) headers['x-goog-api-key'] = env.GOOGLE_PLACES_KEY;
  else if (env.GOOGLE_SA_EMAIL && env.GOOGLE_SA_KEY) {
    try { headers.authorization = 'Bearer ' + await googleToken(env, 'https://www.googleapis.com/auth/cloud-platform'); }
    catch (e) { return json({ error: 'auth' }, 502); }
    // Billed to the service account's own project: name@PROJECT.iam.gserviceaccount.com
    const project = (env.GOOGLE_SA_EMAIL.match(/@([^.]+)\./) || [])[1];
    if (project) headers['x-goog-user-project'] = project;
  } else return json({ error: 'not_configured' }, 503);

  const r = await fetch(`https://places.googleapis.com/v1/places/${PLACE_ID}?languageCode=${lang}`, { headers }).catch(() => null);
  if (!r || !r.ok) return json({ error: 'google', status: r ? r.status : 0 }, 502);
  return json(shape(await r.json()), 200, 'private, max-age=3600');
}
