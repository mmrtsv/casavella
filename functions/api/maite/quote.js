// GET /api/maite/quote?stay=montserrat&in=2026-11-12&out=2026-11-15
// The web price for those nights, to suggest it on a booking taken by phone. The booking rules don't apply here.
import { quote, settings, json } from '../../../lib/booking.js';

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  const q = quote(u.searchParams.get('stay'), u.searchParams.get('in'), u.searchParams.get('out'), await settings(env), true);
  return json(q, q.error ? 400 : 200);
}
