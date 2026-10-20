// GET /api/prices
// Nightly prices and discounts as set in Maite, so the page shows the current ones.
import { prices, json } from '../../lib/booking.js';

export async function onRequestGet({ env }) {
  return json(await prices(env));
}
