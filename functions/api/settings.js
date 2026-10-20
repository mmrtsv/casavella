// GET /api/settings
// Prices, discounts, booking rules, the cancellation policy and each stay's texts and photos as set in Maite,
// so the page shows the current ones.
import { settings, publicSettings, json } from '../../lib/booking.js';
import { content, ICONS } from '../../lib/stays.js';

export async function onRequestGet({ env }) {
  const [S, C] = await Promise.all([settings(env), content(env)]);
  for (const c of Object.values(C)) c.feats = c.feats.map(f => ({ text: f.text, svg: ICONS[f.icon] || ICONS.star }));
  return json({ ...publicSettings(S), content: C });
}
