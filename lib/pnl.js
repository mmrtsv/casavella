// The profit and loss of a period: what came in (stays by night, the restaurant from Cobrat) and what went out (the expenses
// sheet and the Meta ads), and the gross profit, before taxes. Used by Analítica (functions/api/maite/analytics.js), the weekly
// summary (lib/weekly.js) and the chat (lib/chat.js).
//
// The expenses come from a Google Sheet the house keeps: its link is saved from Analítica (KV MAITE, key "expenses"), and the
// sheet is shared with the service account (GOOGLE_SA_EMAIL) or owned by GOOGLE_DRIVE_AS. Its first tab, with a header row:
// Data, Concepte, Categoria, Import (Spanish or English headers work too; the order doesn't matter). The Meta ads are added on
// their own when META_ADS_TOKEN is set, so they don't go in the sheet.
import { STAYS, addDays, calendar, configured, googleToken } from './booking.js';
import { asBooking } from './maite.js';
import { tables, tablesConfigured } from './restaurant.js';

const META_ACCOUNT = '1418129536379677';
export const metaAccount = env => String(env.META_AD_ACCOUNT || META_ACCOUNT).replace(/^act_/, '');
const nightsOf = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const isBooking = b => ['paid', 'pending', 'manual'].includes(b.kind);

// ---------- Income ----------
export async function allBookings(env, from, to) {
  const out = [];
  await Promise.all(Object.keys(STAYS).filter(s => configured(env, s)).map(async stay => {
    for (const e of await (await calendar(env, stay)).events(from, to)) if (e.first < to && e.until > from) out.push(asBooking(stay, e));
  }));
  return out.filter(isBooking).sort((a, b) => a.first.localeCompare(b.first));
}

// A stay's amount counts by night, so a booking across two periods is split between them
export function stays(list, from, to) {
  const r = { nights: 0, cents: 0, guests: 0, bookings: 0 };
  for (const b of list) {
    const k = Math.max(0, nightsOf(b.first > from ? b.first : from, b.until < to ? b.until : to));
    if (!k) continue;
    r.nights += k; r.bookings++; r.guests += b.guests || 0;
    r.cents += (b.amount || 0) * k / Math.max(1, nightsOf(b.first, b.until));
  }
  return r;
}
export function restaurant(list, from, to) {
  const t = list.filter(x => !x.cancelled && x.date >= from && x.date < to);
  return { tables: t.length, diners: t.reduce((k, x) => k + (x.people || 0), 0), cents: t.reduce((k, x) => k + (x.paid || 0), 0), unpaid: t.filter(x => x.paid == null).length };
}

// Meta ads: META_ADS_TOKEN (a system user token with ads_read) and META_AD_ACCOUNT (the number after act_)
export async function metaAds(env, from, to) {
  if (!env.META_ADS_TOKEN) return null;
  const q = new URLSearchParams({ fields: 'spend,impressions,reach,inline_link_clicks', time_range: JSON.stringify({ since: from, until: addDays(to, -1) }), access_token: env.META_ADS_TOKEN });
  const r = await fetch(`https://graph.facebook.com/v21.0/act_${metaAccount(env)}/insights?${q}`);
  if (!r.ok) throw new Error('meta ' + r.status);
  const d = (await r.json()).data?.[0] || {};
  return { spend: Math.round(Number(d.spend || 0) * 100), impressions: +d.impressions || 0, reach: +d.reach || 0, clicks: +d.inline_link_clicks || 0 };
}

// ---------- The expenses sheet ----------
// The id from a link (docs.google.com/spreadsheets/d/<id>/edit) or the id itself
export const sheetId = s => (String(s || '').match(/\/d\/([\w-]{20,})/) || String(s || '').match(/^([\w-]{20,})$/) || [])[1] || '';
export const sheetUrl = id => id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : '';
export const savedSheet = async env => (await env.MAITE?.get('expenses', 'json').catch(() => null))?.sheet || env.EXPENSES_SHEET || '';

// kind: an optional Tipus column (Despesa / Ingrés): an income row (a refund) takes its amount off its category
const COLS = { date: /^(data|fecha|dia|día|date)/i, concept: /concept|descrip|detall/i, category: /^categor/i, kind: /^(tipus|tipo|type)$/i, amount: /^(import|importe|amount|preu|precio|€)/i };
const INCOME = /^(ingr[eé]s|ingreso|income|devoluci|reembors|reembols|refund)/i;
// A day from the sheet: a date serial (days since 1899-12-30), 31/10/2026, 31-10-26 or 2026-10-31
function dayOf(v) {
  if (typeof v === 'number') return new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 864e5).toISOString().slice(0, 10);
  const s = String(v || '').trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (m) return `${m[3].length === 2 ? '20' + m[3] : m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return '';
}
// Cents from 1234.5, "1.234,50 €" or "-45,20"; expenses count as positive whatever their sign in the sheet
function centsOf(v) {
  if (typeof v === 'number') return Math.round(Math.abs(v) * 100);
  let s = String(v || '').replace(/[^\d,.-]/g, '');
  if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(/,/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(Math.abs(n) * 100) : 0;
}

// Every expense in the sheet: { date, concept, category, cents }. Throws 'sheet_access' when the account can't read it.
export async function readExpenses(env, id) {
  const token = await googleToken(env, 'https://www.googleapis.com/auth/spreadsheets.readonly', env.GOOGLE_DRIVE_AS || '');
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/A1:Z5000?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER`,
    { headers: { authorization: 'Bearer ' + token } });
  if (r.status === 403 || r.status === 404) throw Object.assign(new Error('sheet_access'), { code: 'sheet_access' });
  if (!r.ok) throw new Error('sheets ' + r.status);
  const rows = (await r.json()).values || [];
  const head = rows.findIndex(row => row.some(c => COLS.date.test(String(c).trim())) && row.some(c => COLS.amount.test(String(c).trim()) || /^total$/i.test(String(c).trim())));
  if (head < 0) throw Object.assign(new Error('sheet_columns'), { code: 'sheet_columns' });
  const at = Object.fromEntries(Object.entries(COLS).map(([k, re]) => [k, rows[head].findIndex(c => re.test(String(c).trim()))]));
  if (at.amount < 0) at.amount = rows[head].findIndex(c => /^total$/i.test(String(c).trim()));
  return rows.slice(head + 1).map(row => ({
    date: dayOf(row[at.date]), concept: at.concept >= 0 ? String(row[at.concept] ?? '').trim() : '',
    category: (at.category >= 0 ? String(row[at.category] ?? '').trim() : '') || 'Altres',
    cents: centsOf(row[at.amount]) * (at.kind >= 0 && INCOME.test(String(row[at.kind] ?? '').trim()) ? -1 : 1),
  })).filter(x => x.date && x.cents);
}

// ---------- The P&L ----------
// from inclusive, to exclusive. pre: what the caller already loaded (bookings, tables, ads), so the weekly summary doesn't read
// them twice. sheet: { connected, url, error } says whether the expenses could be read.
export async function pnl(env, from, to, pre = {}) {
  const id = await savedSheet(env);
  const [list, tlist, ads, sheet] = await Promise.all([
    pre.list || allBookings(env, from, to),
    pre.tlist || (tablesConfigured(env) ? tables(env).then(t => t.list(from, to)) : []),
    pre.ads !== undefined ? pre.ads : metaAds(env, from, to).catch(() => null),
    id ? readExpenses(env, id).then(items => ({ items }), e => ({ error: e.code || 'sheet' })) : { error: 'no_sheet' },
  ]);
  const st = stays(list, from, to), re = restaurant(tlist, from, to);
  const income = [{ label: 'Allotjaments', cents: Math.round(st.cents) }, { label: 'Restaurant', cents: re.cents }];
  const items = (sheet.items || []).filter(x => x.date >= from && x.date < to).sort((a, b) => b.date.localeCompare(a.date));
  const byCat = new Map();
  for (const x of items) byCat.set(x.category, (byCat.get(x.category) || 0) + x.cents);
  const expenses = [...byCat].map(([label, cents]) => ({ label, cents })).sort((a, b) => b.cents - a.cents);
  // The Meta ads are added from the ad account only when the sheet doesn't already carry them, so they never count twice
  const metaInSheet = (sheet.items || []).some(x => /meta ads|facebook ads|instagram ads/i.test(x.concept));
  if (ads?.spend && !metaInSheet) expenses.push({ label: 'Anuncis de Meta', cents: ads.spend, auto: true });
  const incomeTotal = income.reduce((k, x) => k + x.cents, 0), expensesTotal = expenses.reduce((k, x) => k + x.cents, 0);
  return {
    from, to, income, incomeTotal, expenses, expensesTotal, profit: incomeTotal - expensesTotal,
    margin: incomeTotal ? Math.round((incomeTotal - expensesTotal) / incomeTotal * 100) : null,
    items, nights: st.nights, diners: re.diners, unpaidTables: re.unpaid,
    sheet: { connected: !!sheet.items, url: sheetUrl(id), error: sheet.error || null, share: env.GOOGLE_DRIVE_AS || env.GOOGLE_SA_EMAIL || '' },
  };
}
