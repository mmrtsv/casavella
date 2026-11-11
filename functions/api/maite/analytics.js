// GET /api/maite/analytics?from=2026-11-01&to=2026-12-01   The P&L of that period (lib/pnl.js): income, expenses by category,
//                                                         gross profit, the period's expenses and whether the sheet is read.
// PUT /api/maite/analytics  { sheet: 'https://docs.google.com/spreadsheets/d/…' }   Links the expenses sheet (checked first);
//                           { sheet: '' } unlinks it.
import { isDate, json } from '../../../lib/booking.js';
import { pnl, readExpenses, sheetId } from '../../../lib/pnl.js';

export async function onRequestGet({ request, env }) {
  const q = new URL(request.url).searchParams, from = q.get('from'), to = q.get('to');
  if (!isDate(from) || !isDate(to) || from >= to || Date.parse(to) - Date.parse(from) > 400 * 864e5) return json({ error: 'dates' }, 400);
  return json(await pnl(env, from, to));
}

export async function onRequestPut({ request, env, data }) {
  if (!env.MAITE) return json({ error: 'not_configured' }, 503);
  let b;
  try { b = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  if (b.sheet === '') { await env.MAITE.delete('expenses'); return json({ ok: true }); }
  const id = sheetId(b.sheet);
  if (!id) return json({ error: 'sheet_link' }, 400);
  try { await readExpenses(env, id); } catch (e) { console.log('expenses sheet', e.message); return json({ error: e.code || 'sheet', detail: e.detail, share: env.GOOGLE_DRIVE_AS || env.GOOGLE_SA_EMAIL || '' }, 400); }
  await env.MAITE.put('expenses', JSON.stringify({ sheet: id, by: data.user, at: new Date().toISOString() }));
  return json({ ok: true });
}
