// Xarxes socials in Maite: the Instagram grid (posts confirmed for publishing, in order) and their captions, one KV key ('social').
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
], copies: {} };
const EMPTY = { posts: [], copies: {} };
// Posts confirmed in Maite before the grid was brought over go after it, once; after the next save it is never added again
export async function load(env) {
  const S = { ...EMPTY, ...JSON.parse((await env.MAITE.get('social')) || 'null') };
  if (!S.seeded) S.posts = [...SEED.posts, ...S.posts.filter(p => !SEED.posts.some(x => x.id === p.id))];
  return S;
}
export const store = (env, S, user) => env.MAITE.put('social', JSON.stringify({ posts: S.posts, copies: S.copies, seeded: true, by: user, at: new Date().toISOString() }));
export const view = (S, env) => json({ posts: S.posts, copies: S.copies, ai: !!env.ANTHROPIC_API_KEY });

