// GET /api/settings
// Prices, discounts, booking rules, the cancellation policy and each stay's texts and photos as set in Maite,
// so the page shows the current ones. menus: the restaurant's menus made in Maite (Xarxes socials › Menú) that haven't
// ended, soonest first, as the image of the menu and its days, for the table booking page.
import { settings, publicSettings, json } from '../../lib/booking.js';
import { content, ICONS } from '../../lib/stays.js';
import { load } from '../../lib/social.js';

async function menus(env) {
  if (!env.MAITE) return [];
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());
  return (await load(env)).posts.filter(p => !p.pack && p.menu && p.menu.image && p.menu.until >= today)
    .map(({ menu: m }) => ({ image: m.image, from: m.from, until: m.until, alt: [m.name, ...(m.dishes || [])].filter(Boolean).join('. ') }))
    .sort((a, b) => a.from.localeCompare(b.from));
}

export async function onRequestGet({ env }) {
  const [S, C, M] = await Promise.all([settings(env), content(env), menus(env).catch(() => [])]);
  for (const c of Object.values(C)) c.feats = c.feats.map(f => ({ text: f.text, svg: ICONS[f.icon] || ICONS.star }));
  return json({ ...publicSettings(S), content: C, menus: M });
}
