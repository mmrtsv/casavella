// The booking as a Google Ads conversion, sent by the server when Stripe confirms a web booking is paid
// (functions/api/stripe-webhook.js), through the Data Manager API. The page's own conversion (index.html, track) only counts
// a guest who accepted cookies and came back to the page after paying; this one counts every paid booking that came from an ad
// click, because the click's gclid (or gbraid / wbraid, iPhone traffic) travels with the checkout in the Stripe session's
// metadata (lib/analytics.js, visitMeta).
//
// Setup (README, «Anuncis»):
//  - GOOGLE_ADS_CUSTOMER: the Google Ads account's 10-digit customer ID, without hyphens.
//  - GOOGLE_ADS_ACTION: the ID of a conversion action whose source is «Website (Import from clicks)» (type UPLOAD_CLICKS).
//    It can't be the page's «Reserva», which is a website tag action.
//  - GOOGLE_ADS_LOGIN: optional, the manager account the credentials sign in through, when access comes from one.
//  - Credentials, either of: the calendars' service account (GOOGLE_SA_EMAIL, GOOGLE_SA_KEY) added as a user of the Google Ads
//    account, or GOOGLE_ADS_REFRESH_TOKEN with GOOGLE_ADS_CLIENT_ID and GOOGLE_ADS_CLIENT_SECRET (an OAuth token of a user of
//    the account). Both with the scope https://www.googleapis.com/auth/datamanager, and the Data Manager API enabled in the
//    Google Cloud project.
//  - GOOGLE_ADS_VALIDATE=on: Google checks every request without recording the conversion, for testing.
//  - GOOGLE_ADS_UPLOAD=off stops every upload.
//
// The Stripe session ID is the transaction ID, the same the page sends, so a retried webhook counts once.
// Consent: the guest's cookie choice goes with the event. With it accepted, the hashed email and phone go too (they help Google
// match the click); without it they don't. A guest who never answered the cookie notice goes without a consent status.
import { googleToken } from './booking.js';

const SCOPE = 'https://www.googleapis.com/auth/datamanager';
export const adsReady = env => env.GOOGLE_ADS_UPLOAD !== 'off' && !!(env.GOOGLE_ADS_CUSTOMER && env.GOOGLE_ADS_ACTION)
  && !!(env.GOOGLE_ADS_REFRESH_TOKEN || (env.GOOGLE_SA_EMAIL && env.GOOGLE_SA_KEY));

async function token(env) {
  if (env.GOOGLE_ADS_REFRESH_TOKEN) {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN, client_id: env.GOOGLE_ADS_CLIENT_ID || '', client_secret: env.GOOGLE_ADS_CLIENT_SECRET || '' }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.access_token) throw new Error('Google Ads: ' + (d.error_description || d.error || r.status));
    return d.access_token;
  }
  return googleToken(env, SCOPE);
}

async function sha256(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}

// E.164 for Google: the guest types the phone as they like; without a country code it is taken as Spanish
export function e164(phone) {
  let p = String(phone || '').trim().replace(/[\s().-]/g, '');
  if (p.startsWith('00')) p = '+' + p.slice(2);
  if (!p.startsWith('+')) p = /^[6789]\d{8}$/.test(p) ? '+34' + p : '';
  return /^\+\d{8,15}$/.test(p) ? p : '';
}

// The request body for one paid Checkout Session, or null when it didn't come from an ad click. Exported for testing
export async function conversionRequest(env, s) {
  const m = s.metadata || {}, cd = s.customer_details || {};
  const ids = Object.fromEntries(['gclid', 'gbraid', 'wbraid'].filter(k => m[k]).map(k => [k, m[k]]));
  if (!Object.keys(ids).length) return null;
  const status = { yes: 'CONSENT_GRANTED', no: 'CONSENT_DENIED' }[m.consent];
  const event = {
    eventTimestamp: new Date().toISOString(),
    transactionId: s.id,
    eventSource: 'WEB',
    conversionValue: (s.amount_total || 0) / 100,
    currency: (s.currency || 'eur').toUpperCase(),
    adIdentifiers: ids,
    ...(status ? { consent: { adUserData: status, adPersonalization: status } } : {}),
  };
  if (m.consent === 'yes') {
    const email = String(m.email || cd.email || '').trim().toLowerCase(), phone = e164(m.phone || cd.phone);
    const userIdentifiers = [
      ...(email ? [{ emailAddress: await sha256(email) }] : []),
      ...(phone ? [{ phoneNumber: await sha256(phone) }] : []),
    ];
    if (userIdentifiers.length) event.userData = { userIdentifiers };
  }
  const destination = {
    operatingAccount: { accountType: 'GOOGLE_ADS', accountId: String(env.GOOGLE_ADS_CUSTOMER).replace(/\D/g, '') },
    productDestinationId: String(env.GOOGLE_ADS_ACTION),
  };
  if (env.GOOGLE_ADS_LOGIN) destination.loginAccount = { accountType: 'GOOGLE_ADS', accountId: String(env.GOOGLE_ADS_LOGIN).replace(/\D/g, '') };
  return {
    destinations: [destination],
    events: [event],
    encoding: 'HEX',
    ...(env.GOOGLE_ADS_VALIDATE === 'on' ? { validateOnly: true } : {}),
  };
}

// Sends the conversion; returns what happened, for the log: 'off', 'no-click', or Google's request ID
export async function adsConversion(env, s) {
  if (!adsReady(env)) return 'off';
  const body = await conversionRequest(env, s);
  if (!body) return 'no-click';
  const r = await fetch('https://datamanager.googleapis.com/v1/events:ingest', {
    method: 'POST', headers: { authorization: 'Bearer ' + (await token(env)), 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('Google Ads: ' + (d.error?.message || r.status));
  if (d.fieldWarnings?.length) console.log('google ads warnings', JSON.stringify(d.fieldWarnings).slice(0, 500));
  return d.requestId || 'ok';
}
