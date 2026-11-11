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
import { stayName } from './push.js';

const META_ACCOUNT = '1418129536379677';
export const metaAccount = env => String(env.META_AD_ACCOUNT || META_ACCOUNT).replace(/^act_/, '');
const nightsOf = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const short = d => new Date(d + 'T12:00:00Z').toLocaleDateString('ca-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' }).replace(/’/g, "'");
const long = d => new Date(d + 'T12:00:00Z').toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).replace(/’/g, "'");
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

// The ads spend month by month (YYYY-MM to cents), for the months table
export async function metaAdsMonthly(env, from, to) {
  if (!env.META_ADS_TOKEN) return null;
  const q = new URLSearchParams({ fields: 'spend', time_increment: 'monthly', time_range: JSON.stringify({ since: from, until: addDays(to, -1) }), access_token: env.META_ADS_TOKEN });
  const r = await fetch(`https://graph.facebook.com/v21.0/act_${metaAccount(env)}/insights?${q}`);
  if (!r.ok) throw new Error('meta ' + r.status);
  return Object.fromEntries(((await r.json()).data || []).map(d => [String(d.date_start).slice(0, 7), Math.round(Number(d.spend || 0) * 100)]));
}

// ---------- The expenses sheet ----------
// The id from a link (docs.google.com/spreadsheets/d/<id>/edit) or the id itself
export const sheetId = s => (String(s || '').match(/\/d\/([\w-]{20,})/) || String(s || '').match(/^([\w-]{20,})$/) || [])[1] || '';
export const sheetUrl = id => id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : '';
export const savedSheet = async env => (await env.MAITE?.get('expenses', 'json').catch(() => null))?.sheet || env.EXPENSES_SHEET || '';

// kind: an optional Tipus column (Despesa / Ingrés): an income row (a refund) takes its amount off its category
const COLS = { date: /^(data|fecha|dia|día|date)/i, concept: /concept|descrip|detall/i, category: /^categor/i, kind: /^(tipus|tipo|type)$/i, amount: /^(import|importe|amount|preu|precio|€)/i };
// An income row only counts when it gives back an expense (a refund): it takes its amount off its category. Other income in the
// sheet (a dinner's takings) is left out, because the income comes from the bookings and Cobrat
// Which categories of the sheet are direct costs (they set the gross profit) and which are ads (their own tab)
export const DIRECT = /restaurant|cuina|menjar|aliment|begud|compres|neteja|bugader|amenit|allotjament|comissi|lloguer d'estada/i;
export const ADS = /^(ads|anuncis|publicitat|marketing|màrqueting)$/i;
const INCOME = /^(ingr[eé]s|ingreso|income|devoluci|reembors|reembols|refund)/i, REFUND = /devoluci|reembors|reembols|retorn|abonament|refund/i;
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
  // Acting for GOOGLE_DRIVE_AS, the delegation is the drive scope the documents already use (Sheets accepts it); the service
  // account on its own only needs to read sheets shared with it
  const token = env.GOOGLE_DRIVE_AS ? await googleToken(env, 'https://www.googleapis.com/auth/drive', env.GOOGLE_DRIVE_AS)
    : await googleToken(env, 'https://www.googleapis.com/auth/spreadsheets.readonly');
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
    cents: !(at.kind >= 0 && INCOME.test(String(row[at.kind] ?? '').trim())) ? centsOf(row[at.amount])
      : REFUND.test(String(row[at.kind] ?? '') + ' ' + (at.concept >= 0 ? String(row[at.concept] ?? '') : '')) ? -centsOf(row[at.amount]) : 0,
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
  const days = nightsOf(from, to), seats = Object.keys(STAYS).length * days;
  // Every line can open into the lines under it (lines), with one line of detail (sub): stays into each accommodation and its
  // bookings, the restaurant into its days, each expense category into its rows
  const perStay = Object.keys(STAYS).map(k => {
    const mine = list.filter(b => b.stay === k), s = stays(mine, from, to);
    const lines = mine.map(b => ({ b, k: Math.max(0, nightsOf(b.first > from ? b.first : from, b.until < to ? b.until : to)) })).filter(x => x.k).map(({ b, k: nts }) => ({
      label: b.name || b.title || 'Reserva', sub: `${short(b.first)} a ${short(b.until)}, ${nts === 1 ? '1 nit' : nts + ' nits'}${b.kind === 'paid' || b.settled ? '' : ', per cobrar'}`,
      cents: Math.round((b.amount || 0) * nts / Math.max(1, nightsOf(b.first, b.until))) }));
    return { label: stayName(k), sub: `${s.nights === 1 ? '1 nit' : s.nights + ' nits'} de ${days}`, cents: Math.round(s.cents), lines };
  }).filter(x => x.cents || x.lines.length);
  const tdays = [...new Set(tlist.filter(t => !t.cancelled && t.date >= from && t.date < to).map(t => t.date))].sort().map(d => {
    const r1 = restaurant(tlist, d, addDays(d, 1));
    return { label: cap(long(d)), sub: `${r1.tables === 1 ? '1 taula' : r1.tables + ' taules'}, ${r1.diners} comensals${r1.unpaid ? `, ${r1.unpaid} sense import` : ''}`, cents: r1.cents };
  });
  const income = [
    { label: 'Allotjaments', sub: `${st.nights === 1 ? '1 nit' : st.nights + ' nits'}, ${seats ? Math.round(st.nights / seats * 100) : 0} % d'ocupació`, cents: Math.round(st.cents), lines: perStay },
    { label: 'Restaurant', sub: `${re.tables === 1 ? '1 taula' : re.tables + ' taules'}, ${re.diners} comensals`, cents: re.cents, lines: tdays },
  ];
  const items = (sheet.items || []).filter(x => x.date >= from && x.date < to).sort((a, b) => b.date.localeCompare(a.date));
  const group = list => {
    const by = new Map();
    for (const x of list) by.set(x.category, [...(by.get(x.category) || []), x]);
    return [...by].map(([label, l]) => ({ label, sub: l.length === 1 ? '1 apunt' : `${l.length} apunts`, cents: l.reduce((k, x) => k + x.cents, 0),
      lines: l.map(x => ({ label: x.concept || label, sub: short(x.date), cents: x.cents })) })).sort((a, b) => b.cents - a.cents);
  };
  // Direct costs (what serving a stay or a table costs) set the gross profit; the ads have their own tab; the rest come after
  const isAd = x => ADS.test(x.category), isDirect = x => !isAd(x) && DIRECT.test(x.category);
  const direct = group(items.filter(isDirect)), other = group(items.filter(x => !isAd(x) && !isDirect(x)));
  // The ads: the sheet's Ads rows by channel, and the Meta ad account when the sheet doesn't already list Meta's ads
  const metaInSheet = (sheet.items || []).some(x => /meta ads|facebook ads|instagram ads/i.test(x.concept));
  const channelOf = x => /meta|facebook|instagram/i.test(x.concept) ? 'Meta' : /google/i.test(x.concept) ? 'Google' : 'Altres';
  const adRows = items.filter(isAd), channels = ['Meta', 'Google', 'Altres'].map(ch => {
    const l = adRows.filter(x => channelOf(x) === ch), auto = ch === 'Meta' && ads?.spend && !metaInSheet;
    const lines = [...(auto ? [{ label: "Compte d'anuncis de Meta", sub: [ads.impressions && `${ads.impressions} impressions`, ads.clicks && `${ads.clicks} clics`].filter(Boolean).join(', ') || undefined, cents: ads.spend }] : []),
      ...l.map(x => ({ label: x.concept || ch, sub: short(x.date), cents: x.cents }))];
    return { label: ch, cents: lines.reduce((k, x) => k + x.cents, 0), sub: lines.length === 1 ? '1 apunt' : `${lines.length} apunts`, lines };
  }).filter(c => c.lines.length);
  const adsTotal = channels.reduce((k, c) => k + c.cents, 0);
  // What the ads may have brought: the bookings paid on the web whose stay starts in the period
  const web = list.filter(b => b.source === 'web' && b.first >= from && b.first < to);
  const webCents = web.reduce((k, b) => k + (b.amount || 0), 0);
  const adsInfo = { total: adsTotal, channels, meta: ads || null, webBookings: web.length, webCents, perBooking: web.length ? Math.round(adsTotal / web.length) : null,
    roas: adsTotal ? Math.round(webCents / adsTotal * 10) / 10 : null };
  const sum = l => l.reduce((k, x) => k + x.cents, 0);
  const incomeTotal = income.reduce((k, x) => k + x.cents, 0), directTotal = sum(direct), gross = incomeTotal - directTotal;
  const adsLine = adsTotal ? [{ label: 'Anuncis', sub: "El detall és a la pestanya Anuncis", cents: adsTotal, lines: channels }] : [];
  const otherAll = [...other, ...adsLine], otherTotal = sum(otherAll), result = gross - otherTotal;
  // All the expenses in one list, for the Monday email and the app before 2.55
  const expenses = [...direct, ...otherAll], expensesTotal = directTotal + otherTotal;

  // Month by month, when the period has more than one
  let months = null;
  const firstMonth = from.slice(0, 7), lastMonth = addDays(to, -1).slice(0, 7);
  if (firstMonth !== lastMonth && !pre.noMonths) {
    const adsBy = ads?.spend && !metaInSheet ? await metaAdsMonthly(env, from, to).catch(() => null) : null;
    months = [];
    for (let m = firstMonth; m <= lastMonth; m = addDays(m + '-28', 7).slice(0, 7)) {
      const a = m + '-01' < from ? from : m + '-01', next = addDays(m + '-28', 7).slice(0, 7) + '-01', b = next > to ? to : next;
      const inM = x => x.date >= a && x.date < b;
      const inc = Math.round(stays(list, a, b).cents) + restaurant(tlist, a, b).cents;
      const dir = items.filter(x => inM(x) && isDirect(x)).reduce((k, x) => k + x.cents, 0);
      const ad = items.filter(x => inM(x) && isAd(x)).reduce((k, x) => k + x.cents, 0) + (adsBy?.[m] || 0);
      const rest = items.filter(x => inM(x) && !isAd(x) && !isDirect(x)).reduce((k, x) => k + x.cents, 0);
      months.push({ month: m, label: cap(new Date(m + '-15T12:00:00Z').toLocaleDateString('ca-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' })),
        income: inc, direct: dir, gross: inc - dir, ads: ad, expenses: dir + ad + rest, profit: inc - dir - ad - rest });
    }
  }
  return {
    from, to, income, incomeTotal, direct, directTotal, gross, grossMargin: incomeTotal ? Math.round(gross / incomeTotal * 100) : null,
    other: otherAll, otherTotal, result, ads: adsInfo,
    // profit and margin: after every expense (the result); expenses: all of them
    expenses, expensesTotal, profit: result, margin: incomeTotal ? Math.round(result / incomeTotal * 100) : null, months,
    items, nights: st.nights, diners: re.diners, unpaidTables: re.unpaid,
    sheet: { connected: !!sheet.items, url: sheetUrl(id), error: sheet.error || null, share: env.GOOGLE_DRIVE_AS || env.GOOGLE_SA_EMAIL || '' },
  };
}
