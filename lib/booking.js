// Shared booking logic for the Cloudflare Pages Functions in functions/api/.
// Prices, availability (one Google Calendar per stay) and Stripe calls.

export const STAYS = {
  'montserrat': { name: 'Apartament Montserrat', price: 90, max: 3, cal: 'CAL_MONTSERRAT' },
  'la-pineda': { name: 'Apartament La Pineda', price: 90, max: 3, cal: 'CAL_LA_PINEDA' },
  'les-vinyes': { name: 'Habitació Les Vinyes', price: 70, max: 2, cal: 'CAL_LES_VINYES' },
  'figarot': { name: 'Habitació Figarot', price: 70, max: 2, cal: 'CAL_FIGAROT' },
};
const MAX_NIGHTS = 30;
const HOLD_MINUTES = 45; // holds from the old checkout flow stop blocking after this

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

const DAY = 864e5;
const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + 'T00:00:00Z'));
export const addDays = (s, n) => new Date(Date.parse(s + 'T00:00:00Z') + n * DAY).toISOString().slice(0, 10);
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());

// 2 nights: 5 % off. 3 or more: 10 % off. Amounts in cents.
export function quote(stay, checkin, checkout) {
  const s = STAYS[stay];
  if (!s) return { error: 'stay' };
  if (!isDate(checkin) || !isDate(checkout)) return { error: 'dates' };
  if (checkin < today()) return { error: 'past' };
  const nights = Math.round((Date.parse(checkout) - Date.parse(checkin)) / DAY);
  if (nights < 1) return { error: 'dates' };
  if (nights > MAX_NIGHTS) return { error: 'too_long' };
  const discount = nights >= 3 ? 10 : nights === 2 ? 5 : 0;
  const subtotal = s.price * nights * 100;
  return { stay, name: s.name, checkin, checkout, nights, price: s.price, discount, subtotal, total: subtotal * (100 - discount) / 100 };
}

export const configured = (env, stay) =>
  !!(env.STRIPE_SECRET_KEY && env.GOOGLE_SA_EMAIL && env.GOOGLE_SA_KEY && STAYS[stay] && env[STAYS[stay].cal]);

// ---------- Google Calendar (service account) ----------
const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64urlStr = s => b64url(new TextEncoder().encode(s));

async function googleToken(env) {
  const pem = env.GOOGLE_SA_KEY.replace(/\\n/g, '\n').replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const now = Math.floor(Date.now() / 1000);
  const unsigned = b64urlStr(JSON.stringify({ alg: 'RS256', typ: 'JWT' })) + '.' + b64urlStr(JSON.stringify({
    iss: env.GOOGLE_SA_EMAIL, scope: 'https://www.googleapis.com/auth/calendar',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
  }));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: unsigned + '.' + b64url(sig) }),
  });
  if (!r.ok) throw new Error('google auth ' + r.status);
  return (await r.json()).access_token;
}

export async function calendar(env, stay) {
  const token = await googleToken(env);
  const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(env[STAYS[stay].cal])}/events`;
  const call = async (path, method = 'GET', body) => {
    const r = await fetch(base + path, { method, headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' }, body: body && JSON.stringify(body) });
    if (method === 'DELETE') return r.ok || r.status === 404 || r.status === 410;
    if (r.status === 404 || r.status === 410) return null;
    if (!r.ok) throw new Error(`calendar ${method} ${r.status}`);
    return r.json();
  };
  return {
    // Events that block nights in [from, to), each with its first night and departure day
    async blocking(from, to) {
      const q = new URLSearchParams({ timeMin: addDays(from, -1) + 'T00:00:00Z', timeMax: addDays(to, 1) + 'T00:00:00Z', singleEvents: 'true', maxResults: '2500' });
      const res = await call('?' + q);
      if (!res) throw new Error('calendar not shared with the service account');
      return (res.items || []).filter(e => {
        if (e.status === 'cancelled' || e.transparency === 'transparent') return false;
        const p = e.extendedProperties?.private || {};
        return !(p.lcv === 'hold' && Date.now() - Date.parse(e.created) > HOLD_MINUTES * 60e3);
      }).map(e => {
        const start = e.start.date || e.start.dateTime.slice(0, 10);
        let end = e.end.date || e.end.dateTime.slice(0, 10);
        if (e.end.dateTime && !/T00:00/.test(e.end.dateTime)) end = addDays(end, 1);
        return { ...e, first: start, until: end };
      });
    },
    // Back-to-back stays are fine: the departure day is free for the next arrival
    async conflicts(checkin, checkout, ignoreId) {
      return (await this.blocking(checkin, checkout)).filter(e => e.id !== ignoreId && e.first < checkout && e.until > checkin);
    },
    create: ev => call('', 'POST', ev),
    get: id => call('/' + encodeURIComponent(id)),
    patch: (id, ev) => call('/' + encodeURIComponent(id), 'PATCH', ev),
    remove: id => call('/' + encodeURIComponent(id), 'DELETE'),
  };
}

// ---------- Stripe ----------
function form(obj, prefix, out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object') form(v, key, out); else out.append(key, String(v));
  }
  return out;
}

export async function stripe(env, path, params, method = 'POST') {
  const r = await fetch('https://api.stripe.com/v1/' + path, {
    method, headers: { authorization: 'Bearer ' + env.STRIPE_SECRET_KEY, 'content-type': 'application/x-www-form-urlencoded' },
    body: params ? form(params) : undefined,
  });
  const data = await r.json();
  if (!r.ok) throw new Error('stripe ' + (data.error?.message || r.status));
  return data;
}

export async function verifyStripe(env, body, header) {
  const parts = Object.fromEntries((header || '').split(',').map(p => p.split('=')));
  if (!parts.t || !parts.v1 || Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${parts.t}.${body}`));
  const hex = [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
  return hex.length === parts.v1.length && [...hex].reduce((d, c, i) => d | (c.charCodeAt(0) ^ parts.v1.charCodeAt(i)), 0) === 0;
}

export const euros = cents => (cents / 100).toLocaleString('ca-ES', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 }) + ' €';
