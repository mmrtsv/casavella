// GET /api/maite/stays   Every stay's content, the icon catalog and the web's own photos
// PUT /api/maite/stays   { stay, kind, name, desc, feats: [{ icon, text }], max, photos: ['img/…', '/photos/…'] }
// Uploaded photos that no stay uses any more are deleted from R2.
import { STAYS, json } from '../../../lib/booking.js';
import { content, ICONS, ICON_NAMES, LIBRARY, isPhoto, isUpload } from '../../../lib/stays.js';

export const onRequestGet = async ({ env }) =>
  json({ stays: await content(env), icons: ICONS, iconNames: ICON_NAMES, library: LIBRARY, uploads: !!env.PHOTOS });

export async function onRequestPut({ request, env, data }) {
  if (!env.MAITE) return json({ error: 'not_configured' }, 503);
  let b;
  try { b = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  if (!STAYS[b.stay]) return json({ error: 'stay' }, 400);
  const clip = (v, n) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
  const c = {
    kind: clip(b.kind, 40), name: clip(b.name, 60), desc: String(b.desc ?? '').trim().slice(0, 1200),
    feats: [].concat(b.feats || []).map(f => ({ icon: ICONS[f.icon] ? f.icon : 'star', text: clip(f.text, 60) })).filter(f => f.text).slice(0, 16),
    max: Number(b.max), photos: [...new Set([].concat(b.photos || []))],
  };
  if (!c.kind || !c.name) return json({ error: 'name' }, 400);
  if (!(Number.isInteger(c.max) && c.max >= 1 && c.max <= 12)) return json({ error: 'max' }, 400);
  if (!c.photos.length || c.photos.length > 40 || !c.photos.every(isPhoto)) return json({ error: 'photos' }, 400);
  const all = await content(env), before = all[b.stay].photos;
  all[b.stay] = c;
  await env.MAITE.put('stays', JSON.stringify({ ...all, by: data.user, at: new Date().toISOString() }));
  // Uploads that were in this stay and no stay uses now
  const used = new Set(Object.values(all).flatMap(s => s.photos || []));
  const gone = before.filter(src => isUpload(src) && !used.has(src));
  if (env.PHOTOS && gone.length) await env.PHOTOS.delete(gone.map(src => src.slice(8))).catch(() => {});
  return json({ ok: true, stay: c });
}
