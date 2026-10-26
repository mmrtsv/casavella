// Push notifications to the phones with the Maite app (android/), through Firebase Cloud Messaging (HTTP v1).
// The app registers its FCM token at /api/maite/push. Each token is a key "push:<token>" in the MAITE KV namespace,
// with who signed in on that phone as metadata. FCM_SERVICE_ACCOUNT: the JSON key of a service account of the Firebase
// project (README). Without it, or without KV, nothing is sent.
import { STAYS, serviceToken } from './booking.js';

const PREFIX = 'push:';
const SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

function account(env) {
  try {
    const a = JSON.parse(env.FCM_SERVICE_ACCOUNT || 'null');
    return a?.project_id && a.client_email && a.private_key ? a : null;
  } catch { return null; }
}

export const addDevice = (env, token, user) => env.MAITE.put(PREFIX + token, '', { metadata: { user, at: new Date().toISOString() } });
export const removeDevice = (env, token) => env.MAITE.delete(PREFIX + token);

async function devices(env) {
  const out = [];
  let cursor;
  do {
    const r = await env.MAITE.list({ prefix: PREFIX, cursor });
    out.push(...r.keys.map(k => ({ token: k.name.slice(PREFIX.length), user: k.metadata?.user || '' })));
    cursor = r.list_complete ? null : r.cursor;
  } while (cursor);
  return out;
}

// m: { title, body, type, stay, id, date }. The app opens the screen that type and id point to.
// by: who did it from Maite; their own phones aren't told what they just did.
export async function push(env, m, by = '') {
  const sa = account(env);
  if (!sa || !env.MAITE) return;
  const list = (await devices(env)).filter(d => !by || d.user.toLowerCase() !== by.toLowerCase());
  if (!list.length) return;
  const auth = 'Bearer ' + await serviceToken(sa.client_email, sa.private_key, SCOPE);
  // Data only: the app draws the notification itself, with its channel and the screen to open
  const data = Object.fromEntries(Object.entries(m).filter(([, v]) => v != null && v !== '').map(([k, v]) => [k, String(v)]));
  await Promise.all(list.map(async d => {
    const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
      method: 'POST', headers: { authorization: auth, 'content-type': 'application/json' },
      body: JSON.stringify({ message: { token: d.token, data, android: { priority: 'high' } } }),
    });
    if (r.ok) return;
    // The app was uninstalled or the token renewed: forget it
    const e = (await r.json().catch(() => ({}))).error || {};
    const code = (e.details || []).map(x => x.errorCode).find(Boolean);
    if (code === 'UNREGISTERED' || r.status === 404 || (code === 'INVALID_ARGUMENT' && /registration token/i.test(e.message || ''))) await removeDevice(env, d.token);
    else console.log('push', r.status, code || '', e.message || '');
  }));
}

// Sends after the answer has gone (waitUntil); a failed push never fails or slows the request
export function pushLater(waitUntil, env, m, by = '') {
  const job = push(env, m, by).catch(e => console.log('push', String(e.message || e)));
  if (waitUntil) waitUntil(job);
}

// ---------- The words ----------
// "del 14 al 16 de novembre", "del 30 d'octubre al 2 de novembre" (de l'1, a l'11)
const cat = (d, o) => new Date(d + 'T12:00:00Z').toLocaleDateString('ca-ES', { ...o, timeZone: 'UTC' }).replace(/’/g, "'").replace(',', '');
const dm = d => cat(d, { day: 'numeric', month: 'long' });
const dayOnly = d => String(+d.slice(8, 10));
const de = s => /^(1|11)\b/.test(s) ? "de l'" + s : 'del ' + s;
const a = s => /^(1|11)\b/.test(s) ? "a l'" + s : 'al ' + s;
export const nights = (first, until) => `${de(first.slice(0, 7) === until.slice(0, 7) ? dayOnly(first) : dm(first))} ${a(dm(until))}`;

export const stayName = stay => String(STAYS[stay]?.name || stay || '').replace(/^(Apartament|Habitació) /, '');
const people = (n, one, many) => `${n} ${n === 1 ? one : many}`;
export const guests = n => n ? people(Number(n), 'hoste', 'hostes') : '';
export const diners = n => people(Number(n), 'persona', 'persones');
// "dissabte 14 de novembre a les 21:00"
export const when = (date, time) => cat(date, { weekday: 'long', day: 'numeric', month: 'long' }) + (time ? ` a les ${time}` : '');
export const phrase = (...parts) => parts.filter(Boolean).join(', ');
