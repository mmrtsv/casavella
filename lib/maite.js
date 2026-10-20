// Maite, the back office at maite.casavellarural.com: who is signed in (Cloudflare Access)
// and how calendar events read as bookings, blocks and other entries.
import { STAYS, euros } from './booking.js';

// ---------- Cloudflare Access ----------
// ACCESS_TEAM: the team domain (casavella or casavella.cloudflareaccess.com). ACCESS_AUD: the application's AUD tag.
const unb64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
let certs = null;

export async function accessUser(request, env) {
  const jwt = request.headers.get('cf-access-jwt-assertion');
  if (!jwt || !env.ACCESS_TEAM || !env.ACCESS_AUD) return null;
  const team = 'https://' + env.ACCESS_TEAM.replace(/^https?:\/\//, '').replace(/\.cloudflareaccess\.com\/?$/, '') + '.cloudflareaccess.com';
  const [h, p, sig] = jwt.split('.');
  const header = JSON.parse(new TextDecoder().decode(unb64(h)));
  const claims = JSON.parse(new TextDecoder().decode(unb64(p)));
  const now = Date.now() / 1000;
  if (claims.iss !== team || !(claims.exp > now) || ![].concat(claims.aud).includes(env.ACCESS_AUD)) return null;
  if (!certs || certs.team !== team || !certs.keys.some(k => k.kid === header.kid))
    certs = { team, keys: (await (await fetch(team + '/cdn-cgi/access/certs')).json()).keys || [] };
  const jwk = certs.keys.find(k => k.kid === header.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, unb64(sig), new TextEncoder().encode(h + '.' + p));
  return ok ? claims.email || claims.sub : null;
}

// ---------- Calendar events as bookings ----------
// kind: paid (web, Stripe), pending (web, bank payment not confirmed yet), manual (added in Maite),
// block (closed in Maite), cancelled, refunded, other (anything created by hand in Google Calendar).
const line = (text, label) => (text.match(new RegExp('^' + label + ': (.*)$', 'm')) || [])[1]?.trim() || '';
const cents = s => { const m = String(s).match(/([\d.]+(?:,\d+)?) €/); return m ? Math.round(parseFloat(m[1].replace(/\./g, '').replace(',', '.')) * 100) : null; };

export function asBooking(stay, e) {
  const p = e.extendedProperties?.private || {}, d = e.description || '';
  const kind = ['paid', 'pending', 'manual', 'block', 'cancelled', 'refunded'].includes(p.lcv) ? p.lcv : p.lcv === 'hold' ? 'pending' : 'other';
  const amount = p.amount !== undefined && p.amount !== '' ? Number(p.amount) : cents(d.split('\n')[0]);
  return {
    id: e.id, stay, first: e.first, until: e.until, kind, title: e.summary || '',
    blocks: e.transparency !== 'transparent', // whether it closes those nights
    name: p.name || line(d, 'Nom'), email: p.email || line(d, 'Correu'), phone: p.phone || line(d, 'Telèfon'),
    guests: Number(p.guests || line(d, 'Hostes')) || null, amount: Number.isFinite(amount) ? amount : null,
    settled: kind === 'paid' || p.settled === 'yes', refunded: Number(p.refunded) || 0, was: p.was || '',
    source: p.source || (p.session ? 'web' : ''), arrival: line(d, 'Arribada prevista'), notes: p.notes ?? line(d, 'Comentaris'),
    stripe: p.pi ? `https://dashboard.stripe.com/payments/${p.pi}` : (d.match(/https:\/\/dashboard\.stripe\.com\/\S+/) || [])[0] || '',
    link: e.htmlLink || '',
  };
}

const SOURCES = { phone: 'Telèfon', whatsapp: 'WhatsApp', email: 'Correu', door: 'En persona', other: 'Altres' };
export const sourceName = s => SOURCES[s] || SOURCES.other;
export const isSource = s => s in SOURCES;

// The Google Calendar event for a booking added in Maite
export function manualEvent(b, user) {
  const nights = Math.round((Date.parse(b.until) - Date.parse(b.first)) / 864e5);
  return {
    summary: `${STAYS[b.stay].name}: ${b.name} (${b.guests} pers.)`,
    description: [
      b.amount != null ? `Reserva ${b.settled ? 'cobrada' : 'pendent de cobrar'}: ${euros(b.amount)}` : 'Reserva sense import',
      `${nights} ${nights === 1 ? 'nit' : 'nits'}, del ${b.first} al ${b.until}`,
      `Hostes: ${b.guests}`, `Nom: ${b.name}`, b.email && `Correu: ${b.email}`, b.phone && `Telèfon: ${b.phone}`,
      b.arrival && `Arribada prevista: ${b.arrival}`, b.notes && `Comentaris: ${b.notes}`,
      `Via: ${sourceName(b.source)}. Afegida a Maite per ${user}.`,
    ].filter(Boolean).join('\n'),
    start: { date: b.first }, end: { date: b.until }, colorId: b.settled ? '10' : '5',
    extendedProperties: { private: { lcv: 'manual', source: b.source, settled: b.settled ? 'yes' : 'no', amount: b.amount == null ? '' : String(b.amount),
      guests: String(b.guests), name: b.name, email: b.email, phone: b.phone, notes: b.notes, by: user } },
  };
}
