// GET /api/settings
// Prices, discounts, booking rules and the cancellation policy as set in Maite, so the page shows the current ones.
import { settings, publicSettings, json } from '../../lib/booking.js';

export async function onRequestGet({ env }) {
  return json(publicSettings(await settings(env)));
}
