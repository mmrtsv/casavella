// The purchase in PostHog, sent by the server when Stripe confirms a web booking is paid (functions/api/stripe-webhook.js),
// so it counts even when the guest never returns to the page after paying (a bank app, Instagram's own browser).
// The page sends who the visitor is and where the visit came from with the checkout (index.html, visitor()); Stripe keeps it
// in the session's metadata (ph, phs, utm_*, gclid, gbraid, wbraid, fbclid, referrer, and consent: the guest's cookie choice,
// for the Google Ads conversion in lib/ads.js). Without the PostHog id (a visitor who rejected cookies),
// the purchase goes under the Stripe session, with the campaign still on it.
// POSTHOG_KEY: the project's public key, the same as build.py's POSTHOG_KEY (it is in every page, so it isn't a secret).
const KEY = 'phc_wKuEYoNuGTakEhSHMUcAtm8Ms9xsKTpkMfSXuxiAQj69';
const CAMPAIGN = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'gbraid', 'wbraid', 'fbclid'];

// What checkout.js keeps from the page's visit, for the session's metadata (Stripe: values up to 500 characters)
export function visitMeta(v) {
  if (!v || typeof v !== 'object') return {};
  const out = {};
  for (const k of [...CAMPAIGN, 'referrer', 'ph', 'phs', 'consent']) if (typeof v[k] === 'string' && v[k]) out[k] = v[k].slice(0, 200);
  return out;
}

export async function purchase(env, s) {
  const m = s.metadata || {}, key = env.POSTHOG_KEY || KEY;
  if (!key) return;
  const props = {
    value: (s.amount_total || 0) / 100, currency: 'EUR', stay: m.stay, nights: Number(m.nights) || null, guests: Number(m.guests) || null,
    transaction_id: s.id, source: 'server', ...(m.phs ? { $session_id: m.phs } : {}),
    ...Object.fromEntries(CAMPAIGN.filter(k => m[k]).map(k => [k, m[k]])),
    ...(m.referrer ? { $referrer: m.referrer, $referring_domain: (() => { try { return new URL(m.referrer).hostname; } catch { return ''; } })() } : {}),
    ...(m.ph ? {} : { $process_person_profile: false }),
  };
  const r = await fetch((env.POSTHOG_INGEST || 'https://eu.i.posthog.com') + '/i/v0/e/', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ api_key: key, event: 'purchase', distinct_id: m.ph || 'stripe:' + s.id, properties: props, timestamp: new Date().toISOString(), uuid: crypto.randomUUID() }),
  });
  if (!r.ok) console.log('posthog purchase', r.status);
}
