// GET /api/maite/settings
// PUT /api/maite/settings  { stays?, discounts?, rules?, cancel?, restaurant? }  Any of the sections; the others are kept.
// Per-day prices and minimum stays change through /api/maite/days. See settings() in lib/booking.js for the shape.
import { STAYS, settings, policyText, isDate, today, json } from '../../../lib/booking.js';

const money = v => v === null || v === '' ? null : Math.round(Number(v) * 100) / 100;
const int = v => Number(v);
const ok = (v, a, b) => Number.isInteger(v) && v >= a && v <= b;
const time = v => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

export const onRequestGet = async ({ env }) => {
  const S = await settings(env);
  return json({ ...S, policy: policyText(S.cancel) });
};

export async function onRequestPut({ request, env, data }) {
  if (!env.MAITE) return json({ error: 'not_configured' }, 503);
  let b;
  try { b = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const S = await settings(env);
  if (b.stays) {
    for (const k of Object.keys(STAYS)) {
      if (!b.stays[k]) continue;
      const base = money(b.stays[k].base), weekend = money(b.stays[k].weekend);
      if (!(base >= 1 && base <= 5000) || !(weekend === null || weekend >= 1 && weekend <= 5000)) return json({ error: 'price', stay: k }, 400);
      S.stays[k] = { base, weekend };
    }
  }
  if (b.discounts) {
    const tiers = [].concat(b.discounts).map(t => ({ nights: int(t.nights), pct: int(t.pct) }));
    if (tiers.length > 10 || !tiers.every(t => ok(t.nights, 2, 90) && ok(t.pct, 1, 90)) || new Set(tiers.map(t => t.nights)).size !== tiers.length)
      return json({ error: 'discount' }, 400);
    S.discounts = tiers.sort((a, c) => a.nights - c.nights);
  }
  if (b.rules) {
    const r = { minNights: int(b.rules.minNights), maxNights: int(b.rules.maxNights), minAdvance: int(b.rules.minAdvance), maxAdvance: int(b.rules.maxAdvance),
      checkin: String(b.rules.checkin || ''), checkout: String(b.rules.checkout || '') };
    if (!ok(r.minNights, 1, 30) || !ok(r.maxNights, r.minNights, 90) || !ok(r.minAdvance, 0, 60) || !ok(r.maxAdvance, Math.max(r.minAdvance, 7), 730) || !time(r.checkin) || !time(r.checkout))
      return json({ error: 'rules' }, 400);
    S.rules = r;
  }
  if (b.cancel) {
    const c = { fullDays: b.cancel.fullDays === null || b.cancel.fullDays === '' ? null : int(b.cancel.fullDays),
      partialDays: b.cancel.partialDays === null || b.cancel.partialDays === '' ? null : int(b.cancel.partialDays), partialPct: int(b.cancel.partialPct || 0) };
    if (!(c.fullDays === null || ok(c.fullDays, 0, 90)) || !(c.partialDays === null || ok(c.partialDays, 0, 90)) || !ok(c.partialPct, 0, 99)
      || c.fullDays !== null && c.partialDays !== null && c.partialPct && c.partialDays >= c.fullDays)
      return json({ error: 'cancel' }, 400);
    if (!c.partialPct) c.partialDays = null;
    S.cancel = c;
  }
  if (b.restaurant) {
    const r = b.restaurant;
    const services = [].concat(r.services || []).map((x, i) => ({
      id: String(x.id || `s${Date.now().toString(36)}${i}`).slice(0, 24), name: String(x.name || '').trim().slice(0, 40),
      days: [...new Set([].concat(x.days || []).map(Number))].filter(d => ok(d, 1, 7)).sort(), from: String(x.from || ''), to: String(x.to || ''), seats: int(x.seats),
    }));
    const R = { online: !!r.online, maxParty: int(r.maxParty), minHours: int(r.minHours), maxDays: int(r.maxDays), services,
      closed: [...new Set([].concat(r.closed || []))].filter(d => isDate(d) && d >= today()).sort() };
    if (services.length > 6 || new Set(services.map(x => x.id)).size !== services.length
      || !services.every(x => x.name && x.days.length && time(x.from) && time(x.to) && x.from <= x.to && ok(x.seats, 1, 500))
      || !ok(R.maxParty, 1, 50) || !ok(R.minHours, 0, 72) || !ok(R.maxDays, 1, 365) || R.closed.length > 200)
      return json({ error: 'restaurant' }, 400);
    S.restaurant = R;
  }
  await env.MAITE.put('settings', JSON.stringify({ ...S, by: data.user, at: new Date().toISOString() }));
  return onRequestGet({ env });
}
