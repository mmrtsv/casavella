// GET  /api/maite/emails            The texts of the guest emails, the defaults and the field limits
// PUT  /api/maite/emails  { texts }  Saves them (each email's fields; missing ones go back to the default)
// POST /api/maite/emails  { kind, texts }  Preview: the email rendered with these texts and sample data
import { json, settings, policyText } from '../../../lib/booking.js';
import { DEFAULT_TEXTS, TEXT_LIMITS, TEXT_VARS, texts, contactReply, bookingConfirmation } from '../../../lib/email.js';

function clean(b) {
  return Object.fromEntries(Object.entries(DEFAULT_TEXTS).map(([k, d]) => [k, Object.fromEntries(Object.keys(d).map(f => {
    const v = String(b?.[k]?.[f] ?? '').replace(/\r\n/g, '\n').trim().slice(0, TEXT_LIMITS[f]);
    // Subject, title and subtitle can't be empty; the optional block can
    return [f, v || (f === 'before' ? '' : d[f])];
  }))]));
}

// A tag the email can't fill, or a brace left over from a half-deleted one
function badTag(T) {
  for (const [k, fields] of Object.entries(T)) for (const [f, v] of Object.entries(fields)) {
    const rest = v.replace(/\{(\w+)\}/g, (all, name) => TEXT_VARS[k].includes(name) ? '' : '\u0000');
    if (/[{}\u0000]/.test(rest)) return { kind: k, field: f };
  }
  return null;
}

export const onRequestGet = async ({ env }) => json({ texts: await texts(env), defaults: DEFAULT_TEXTS, limits: TEXT_LIMITS, vars: TEXT_VARS });

export async function onRequestPut({ request, env, data }) {
  if (!env.MAITE) return json({ error: 'not_configured' }, 503);
  const b = await request.json().catch(() => null);
  if (!b?.texts) return json({ error: 'bad_request' }, 400);
  const T = clean(b.texts), bad = badTag(T);
  if (bad) return json({ error: 'tag', ...bad }, 400);
  await env.MAITE.put('emails', JSON.stringify({ ...T, by: data.user, at: new Date().toISOString() }));
  return json({ texts: T, defaults: DEFAULT_TEXTS, limits: TEXT_LIMITS, vars: TEXT_VARS });
}

export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(() => null);
  if (!b || !['contact', 'confirm', 'pending'].includes(b.kind)) return json({ error: 'bad_request' }, 400);
  const T = clean(b.texts), S = await settings(env);
  const site = { ...env, SITE_URL: new URL(request.url).origin.replace('//maite.', '//') };
  const m = { stay: 'montserrat', checkin: '2026-11-14', checkout: '2026-11-16', nights: '2', guests: '2', name: 'Anna Puig', email: 'anna@exemple.cat', arrival: 'Entre les 17 i les 19 h', notes: 'Celebrem un aniversari' };
  const mail = b.kind === 'contact'
    ? contactReply(site, { name: 'Anna Puig', email: 'anna@exemple.cat', message: 'Hola! Voldríem venir el cap de setmana del 14 de novembre. Hi ha bressol?' }, T)
    : bookingConfirmation(site, m, 17100, b.kind === 'pending', { checkin: S.rules.checkin, checkout: S.rules.checkout, policy: policyText(S.cancel) }, T);
  return json({ subject: mail.subject, html: mail.html });
}
