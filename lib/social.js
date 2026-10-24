// Xarxes socials in Maite: the Instagram grid (posts confirmed for publishing, in order), their captions and the words changed on
// the templates, one KV key ('social').
// Shared by /api/maite/social (the grid) and /api/maite/instagram (publishing).
import { json } from './booking.js';

// The grid planned in the first Instagram mock-up (artifact), in publishing order: Maite starts from it until its own is saved
export const SEED = { posts: [
  { id: 'grid01', tpl: 'PostLogo', v: 0, photo: '', at: '2026-10-21T22:11:40Z' },
  { id: 'grid02', tpl: 'CarouselSlide', v: 0, photo: '', at: '2026-10-21T22:12:44Z' },
  { id: 'grid03', tpl: 'PostRoom', v: 0, photo: '', at: '2026-10-21T22:25:21Z' },
  { id: 'grid04', tpl: 'PostSplit', v: 0, photo: '', at: '2026-10-21T22:29:15Z' },
  { id: 'grid05', tpl: 'PostQuote', v: 2, photo: '', at: '2026-10-21T22:20:53Z' },
  { id: 'grid06', tpl: 'CarouselSlide', v: 3, photo: '', at: '2026-10-21T22:31:01Z' },
  { id: 'grid07', tpl: 'PostRestaurantPlain', v: 0, photo: '', at: '2026-10-21T22:33:58Z' },
  { id: 'grid08', tpl: 'PostGradient', v: 1, photo: '', at: '2026-10-21T22:18:20Z' },
  { id: 'grid09', tpl: 'PostAward', v: 0, photo: '', at: '2026-10-21T22:31:44Z' },
], copies: {}, templates: {} };
const EMPTY = { posts: [], copies: {}, templates: {} };
// Posts confirmed in Maite before the grid was brought over go after it, once; after the next save it is never added again
// Captions are Catalan only (Instagram translates them). Older ones had the English after a line with "~": drop it
export const catalanOnly = s => String(s).split(/\n\s*~\s*\n/)[0].trim();

export async function load(env) {
  const S = { ...EMPTY, ...JSON.parse((await env.MAITE.get('social')) || 'null') };
  for (const p of S.posts) if (!p.published && S.copies[p.id]) S.copies[p.id] = catalanOnly(S.copies[p.id]);
  if (!S.seeded) S.posts = [...SEED.posts, ...S.posts.filter(p => !SEED.posts.some(x => x.id === p.id))];
  return S;
}
export const store = (env, S, user) => env.MAITE.put('social', JSON.stringify({ posts: S.posts, copies: S.copies, templates: S.templates, seeded: true, by: user, at: new Date().toISOString() }));
export const view = (S, env) => json({ posts: S.posts, copies: S.copies, templates: S.templates, ai: !!env.ANTHROPIC_API_KEY });

// How La Casa Vella writes on Instagram: the voice, the facts Claude may use and the format. Shared by the caption options
// (/api/maite/social-copy) and the posts made from a prompt (/api/maite/social-make)
export const VOICE = `You write Instagram captions for La Casa Vella, a village house in El Bedorc. Write them like a quiet love letter to the place and to the people who come: romantic, warm and evocative, never a description of features.

The voice:
- Moments and feelings, not amenities: the first light on the wall, two coffees on the balcony, a glass shared at dusk, a morning with nowhere to be, the silence of the village at night, the vines turning gold.
- Speak to the reader ("tu"), often as two people. Let the sentence breathe; simple images and soft metaphors are welcome.
- Never a list of features, never "we offer", "our rooms have", "perfect for", "experience". No clichés ("paradise", "unique", "magical", "unforgettable"), no exclamation marks.
- Short lines that read like a poem are good: 1 to 3, a first line that stops the scroll.
- Name at most one or two details of the house in a caption, woven into a feeling ("the stone walls keep the cool of the night"), never as a list.
- Natural Catalan, as people speak it, never a translation from English or Spanish.
- The village takes the article: "al Bedorc", "del Bedorc" (never "a El Bedorc").

Captions from stays we admire, for the tone only (never copy them, never name them):
- "A place beyond the noise. Where mornings arrive slowly, the light stays longer, and the wild feels like home."
- "Baixes del cotxe, notes que l'aire és diferent i el temps comença a passar més lent."
- "De dia són els colors vius que t'envolten, de nit són les estrelles que et captiven."
- "L'essència del raïm, el tacte de la pell i el plaer d'aturar el temps."
- "Where the mountains embrace the landscape, and time gently slows down."
- "Nothing needs to shout to be noticed."

Facts you may use, and no others (never invent sizes, materials, objects, dishes or prices): a village house from 1898 in El Bedorc (Anoia), one hour from Barcelona; restored to be lived slowly; among vineyards and olive groves, with Montserrat on the horizon; original stone walls, wooden beams, hydraulic tiles and a garden; two apartments, two rooms and a restaurant; Penedès wine and cava (in Catalan "el cava") close by. Plus whatever the post details say.

Format:
- Catalan only: Instagram translates posts for people who read other languages. No English, no Spanish.
- No emojis.
- No call to action ("book", "reserva", "link in bio", "DM"). The only exception: when the post details are about something specific to book (a dinner, a menu, a date, a weekend, a price), end every option with one gentle line: "Reserva per DM".
- hashtags: exactly 5 on one line, niche and local, for example #LaCasaVella #ElBedorc #Anoia #slowtravel #escapadarural.
- Never use "·" as a separator (the "l·l" of Catalan words is spelling and stays).
`;

// House style the model doesn't always keep: no emojis, Catalan only (anything after a "~" is another language), and the one
// slip it still makes now and then, "a El Bedorc" for "al Bedorc"
export const tidyCaption = s => catalanOnly(String(s)
  .replace(/\b(a|de) El Bedorc/g, (_, p) => (p === 'a' ? 'al' : 'del') + ' Bedorc')
  .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '').replace(/[ \t]+$/gm, ''));
