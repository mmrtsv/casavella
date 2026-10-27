// GET /api/reviews?lang=ca|es|en
// The house's Google rating and the reviews Google shows first (up to five, its "most relevant"), from the Places API (New),
// for the page's reviews section. Each review keeps its author's name and link next to it, as Google asks.
// Google's terms don't allow keeping the reviews, so the server stores nothing: the page asks only when the section
// comes into view, and the browser keeps the answer for an hour.
// Access: GOOGLE_PLACES_KEY, an API key limited to the Places API (New). Nothing else: without the key it asks Google nothing.
// Google lets the quota go up to 125,000 a day and a budget only warns, so the cap is here: at most PLACES_PER_DAY calls a
// day and PLACES_PER_MONTH a month (defaults 30 and 900, under the 1,000 free ones), counted in KV (MAITE). Past the cap
// the section shows only its two buttons until the next day or month.
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

// Counts one call against the day's and the month's cap (Madrid time); false when either is used up.
// KV isn't atomic, so two visits in the same instant can both pass: the caps sit well under the free 1,000 for that.
export async function allowed(env, now = new Date()) {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(now), month = day.slice(0, 7);
  const perDay = +env.PLACES_PER_DAY || 30, perMonth = +env.PLACES_PER_MONTH || 900;
  const [d, m] = await Promise.all([env.MAITE.get('places-' + day), env.MAITE.get('places-' + month)]).then(v => v.map(x => +x || 0));
  if (d >= perDay || m >= perMonth) return false;
  await Promise.all([
    env.MAITE.put('places-' + day, String(d + 1), { expirationTtl: 3 * 86400 }),
    env.MAITE.put('places-' + month, String(m + 1), { expirationTtl: 40 * 86400 }),
  ]);
  return true;
}

export async function onRequestGet({ request, env }) {
  const asked = new URL(request.url).searchParams.get('lang'), lang = ['ca', 'es', 'en'].includes(asked) ? asked : 'ca';
  if (!env.GOOGLE_PLACES_KEY || !env.MAITE) return json({ error: 'not_configured' });
  if (!await allowed(env)) return json({ error: 'limit' });
  const headers = { 'x-goog-fieldmask': FIELDS, 'x-goog-api-key': env.GOOGLE_PLACES_KEY };

  const r = await fetch(`https://places.googleapis.com/v1/places/${PLACE_ID}?languageCode=${lang}`, { headers }).catch(() => null);
  // Errors go out as 200 with what Google said (Cloudflare replaces the body of a 502), so it can be read from outside
  if (!r || !r.ok) return json({ error: 'google', status: r ? r.status : 0, detail: r ? ((await r.json().catch(() => null))?.error?.message || '').slice(0, 300) : '' });
  return json(shape(await r.json()), 200, 'private, max-age=3600');
}
