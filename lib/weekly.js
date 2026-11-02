// The weekly summary by email, every Monday from 10:00 (Madrid), and the push for yesterday's restaurant tables without an
// amount, every day from 10:00. Both run from /api/social-cron (the cron Worker in cron/), once each: the day they last ran
// is in KV (MAITE, keys "weekly" and "owed-push").
//
// The summary: last week's figures (stays by night, the restaurant from what Cobrat says), what is still to do (bookings of the
// next 30 days with something missing, tables to charge, the SEO drafts, next week's Instagram plan to look at), this week's
// Instagram plan, the web and the ads (PostHog and Meta, when their keys are set), the latest SEO report (lib/seo-report.js,
// written by build.py) and a few lines on the week that comes. Every item links to the place in Maite where it is done.
// WEEKLY_TO: who gets it, comma separated (default below). WEEKLY_EMAILS=off stops it.
import { STAYS, addDays, calendar, configured, euros, settings } from './booking.js';
import { asBooking } from './maite.js';
import { madridNow, tables, tablesConfigured } from './restaurant.js';
import { load } from './social.js';
import { push, stayName } from './push.js';
import { send, weeklyNotice } from './email.js';
import { SEO } from './seo-report.js';

const TO = 'kilovatio3@gmail.com, xmontmany@gmail.com, marius@itsrever.com';
const AT = 10;
// The house's PostHog project (eu.posthog.com) and Meta ad account; only the keys to read them are secrets
const POSTHOG_PROJECT = '320263', META_ACCOUNT = '1418129536379677';
const phProject = env => env.POSTHOG_PROJECT_ID || POSTHOG_PROJECT;
const metaAccount = env => String(env.META_AD_ACCOUNT || META_ACCOUNT).replace(/^act_/, '');

const madridHour = () => +new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', hourCycle: 'h23' }).format(new Date());
const weekday = d => (new Date(d + 'T12:00:00Z').getUTCDay() + 6) % 7;
const fmt = (d, o) => new Date(d + 'T12:00:00Z').toLocaleDateString('ca-ES', { ...o, timeZone: 'UTC' }).replace(/’/g, "'");
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const dayLong = d => cap(fmt(d, { weekday: 'long', day: 'numeric', month: 'long' }));
const dayShort = d => fmt(d, { day: 'numeric', month: 'short' }).replace('.', '');
const nightsOf = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const money = c => euros(Math.round(c || 0));
// "26 d'octubre" after "del", "1 de novembre" after "a": del 26 d'octubre a l'1 de novembre
const dm = d => fmt(d, { day: 'numeric', month: 'long' });
const fromDay = d => /^(1|11) /.test(dm(d)) ? "de l'" + dm(d) : 'del ' + dm(d);
const toDay = d => /^(1|11) /.test(dm(d)) ? "a l'" + dm(d) : 'al ' + dm(d);
const n = (k, one, many) => `${k} ${k === 1 ? one : many}`;
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
export const maiteBase = env => 'https://maite.' + new URL(env.SITE_URL || 'https://casavellarural.com').hostname.replace(/^www\./, '') + '/';
const isBooking = b => ['paid', 'pending', 'manual'].includes(b.kind);

// ---------- Yesterday's tables without an amount, on the phones ----------
export async function pushOwedTables(env) {
  if (!env.MAITE || !env.FCM_SERVICE_ACCOUNT || !tablesConfigured(env)) return { skipped: 'not_configured' };
  const now = madridNow();
  if (now.minutes < AT * 60) return { skipped: 'early' };
  if ((await env.MAITE.get('owed-push', 'json'))?.day === now.date) return { skipped: 'done_today' };
  await env.MAITE.put('owed-push', JSON.stringify({ day: now.date }));
  const y = addDays(now.date, -1);
  const owed = (await (await tables(env)).list(y, now.date)).filter(t => !t.cancelled && t.paid == null);
  if (!owed.length) return { owed: 0 };
  await push(env, {
    title: owed.length === 1 ? 'Taula per cobrar' : 'Taules per cobrar',
    body: `${owed.length === 1 ? 'Una taula' : `${owed.length} taules`} d'ahir, ${fmt(y, { weekday: 'long', day: 'numeric', month: 'long' })}, sense l'import apuntat. Toca per apuntar-lo.`,
    open: 'cobrat:' + y,
  });
  return { owed: owed.length };
}

// ---------- The numbers ----------
async function allBookings(env, from, to) {
  const out = [];
  await Promise.all(Object.keys(STAYS).filter(s => configured(env, s)).map(async stay => {
    for (const e of await (await calendar(env, stay)).events(from, to)) if (e.first < to && e.until > from) out.push(asBooking(stay, e));
  }));
  return out.filter(isBooking).sort((a, b) => a.first.localeCompare(b.first));
}

// A stay's amount counts by night, so a booking across two weeks is split between them
function stays(list, from, to) {
  const r = { nights: 0, cents: 0, guests: 0, bookings: 0 };
  for (const b of list) {
    const k = Math.max(0, nightsOf(b.first > from ? b.first : from, b.until < to ? b.until : to));
    if (!k) continue;
    r.nights += k; r.bookings++; r.guests += b.guests || 0;
    r.cents += (b.amount || 0) * k / Math.max(1, nightsOf(b.first, b.until));
  }
  return r;
}
function restaurant(list, from, to) {
  const t = list.filter(x => !x.cancelled && x.date >= from && x.date < to);
  return { tables: t.length, diners: t.reduce((k, x) => k + (x.people || 0), 0), cents: t.reduce((k, x) => k + (x.paid || 0), 0) };
}

// What Maite's checklist says is missing (maite-app/src/lib/words.ts, dueList), as words
function missing(b, today) {
  return [
    !(b.kind === 'paid' || (b.kind === 'manual' && b.settled)) && 'per cobrar',
    !(b.docs && b.docsFolder) && 'sense documents',
    !b.email && 'sense correu',
    !b.phone && 'sense telèfon',
    b.first <= today && !b.checkin && 'sense el check-in',
    b.until <= today && !b.checkout && 'sense el check-out',
  ].filter(Boolean);
}

// ---------- The web and the ads ----------
// PostHog (EU): POSTHOG_API_KEY (a personal API key with query read) and POSTHOG_PROJECT_ID
async function hogql(env, query) {
  const host = (env.POSTHOG_HOST || 'https://eu.posthog.com').replace(/\/$/, '');
  const r = await fetch(`${host}/api/projects/${phProject(env)}/query/`, {
    method: 'POST', headers: { authorization: 'Bearer ' + env.POSTHOG_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
  });
  if (!r.ok) throw new Error('posthog ' + r.status);
  return (await r.json()).results || [];
}
async function web(env, from, to) {
  if (!env.POSTHOG_API_KEY) return null;
  const when = `timestamp >= toDateTime('${from} 00:00:00', 'Europe/Madrid') AND timestamp < toDateTime('${to} 00:00:00', 'Europe/Madrid')`;
  const [[visits = 0, checkouts = 0, purchases = 0] = []] = await hogql(env,
    `SELECT uniqIf(properties.$session_id, event = '$pageview'), countIf(event = 'begin_checkout'), countIf(event = 'purchase') FROM events WHERE ${when}`);
  const sources = await hogql(env, `SELECT multiIf(
      properties.$current_url ILIKE '%gclid=%' OR (properties.utm_source = 'google' AND properties.utm_medium IN ('cpc', 'paid', 'ppc')), 'Google Ads',
      properties.$current_url ILIKE '%fbclid=%' OR properties.utm_source IN ('facebook', 'instagram', 'meta', 'ig', 'fb') OR properties.$referring_domain ILIKE '%instagram.%' OR properties.$referring_domain ILIKE '%facebook.%', 'Instagram i Facebook',
      properties.$referring_domain ILIKE '%google.%', 'Cerca de Google',
      properties.$referring_domain IN ('$direct', ''), 'Directe (enllaç o adreça)',
      properties.$referring_domain) AS src, uniq(properties.$session_id) AS n
    FROM events WHERE event = '$pageview' AND ${when} AND NOT (properties.$referring_domain ILIKE '%casavellarural.com%')
    GROUP BY src ORDER BY n DESC LIMIT 6`);
  return { visits, checkouts, purchases, sources: sources.map(([src, k]) => [String(src), Number(k)]) };
}
// Meta ads: META_ADS_TOKEN (a system user token with ads_read) and META_AD_ACCOUNT (the number after act_)
async function metaAds(env, from, to) {
  if (!env.META_ADS_TOKEN) return null;
  const q = new URLSearchParams({ fields: 'spend,impressions,reach,inline_link_clicks', time_range: JSON.stringify({ since: from, until: addDays(to, -1) }), access_token: env.META_ADS_TOKEN });
  const r = await fetch(`https://graph.facebook.com/v21.0/act_${metaAccount(env)}/insights?${q}`);
  if (!r.ok) throw new Error('meta ' + r.status);
  const d = (await r.json()).data?.[0] || {};
  return { spend: Math.round(Number(d.spend || 0) * 100), impressions: +d.impressions || 0, reach: +d.reach || 0, clicks: +d.inline_link_clicks || 0 };
}

// ---------- The summary ----------
// What the email shows (lib/email.js, weeklyNotice), worked out here as figures and words
export async function weeklySummary(env, today = madridNow().date) {
  const base = maiteBase(env), link = path => base + '#/' + path;
  const end = addDays(today, -weekday(today)), start = addDays(end, -7), prev = addDays(start, -7), next = addDays(end, 7), first = addDays(end, -56);
  const [list, tlist, S, Set] = await Promise.all([
    allBookings(env, first, addDays(today, 31)),
    tablesConfigured(env) ? tables(env).then(t => t.list(addDays(today, -60), addDays(today, 15))) : [],
    env.MAITE ? load(env) : { posts: [] },
    settings(env),
  ]);
  const [W, ads] = await Promise.all([web(env, start, end).catch(() => null), metaAds(env, start, end).catch(() => null)]);
  const ids = Object.keys(STAYS), seats = ids.length * 7;
  const st = stays(list, start, end), re = restaurant(tlist, start, end);
  const total = st.cents + re.cents, totalPrev = stays(list, prev, start).cents + restaurant(tlist, prev, start).cents;
  const covered = (s, d) => list.some(b => b.stay === s && b.first <= d && b.until > d);

  // Day by day: each night's share of its stay, and what the tables paid that day
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(start, i), s1 = stays(list, d, addDays(d, 1)), r1 = restaurant(tlist, d, addDays(d, 1));
    return { label: `${fmt(d, { weekday: 'short' }).replace('.', '')} ${+d.slice(8)}`, stays: s1.cents, restaurant: r1.cents };
  });
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const w = addDays(first, i * 7);
    return { label: i === 0 || w.slice(5, 7) !== addDays(w, -7).slice(5, 7) ? dayShort(w) : String(+w.slice(8)), cents: stays(list, w, addDays(w, 7)).cents + restaurant(tlist, w, addDays(w, 7)).cents };
  });
  const perStay = ids.map(s => ({ name: stayName(s), nights: stays(list.filter(b => b.stay === s), start, end).nights }));

  // The week that comes: nights, the weekend (Saturday night) and the restaurant's next opening this week
  const st7 = stays(list, end, next);
  const weekend = ids.filter(s => covered(s, addDays(end, 5))).length;
  const R = Set.restaurant || {}, opening = (R.open || []).filter(a => a.slice(0, 10) >= today && a.slice(0, 10) < next).sort()[0];
  const outlook = [
    { label: 'Nits ocupades', value: `${st7.nights} de ${seats}`, pct: pct(st7.nights, seats) },
    { label: 'Allotjaments dissabte', value: `${weekend} de ${ids.length}`, pct: pct(weekend, ids.length) },
    opening ? (() => {
      const taken = tlist.filter(t => !t.cancelled && `${t.date}T${t.time}` === opening).reduce((k, t) => k + (t.people || 0), 0);
      return { label: `Restaurant ${fmt(opening.slice(0, 10), { weekday: 'long' })}`, value: `${taken} de ${R.seats}`, pct: pct(taken, R.seats) };
    })() : { label: 'Restaurant', value: 'Tancat', pct: 0 },
  ];

  // What is still to do, each with where it is done
  const todo = [];
  for (const b of list.filter(b => b.until >= today && b.first < addDays(today, 30))) {
    const m = missing(b, today);
    if (!m.length) continue;
    const owes = m.includes('per cobrar');
    todo.push({ kind: owes ? 'owed' : 'docs', text: `${b.name || b.title}, ${stayName(b.stay)}, ${dayShort(b.first)}`,
      sub: cap(m.map(x => x === 'per cobrar' && b.amount ? `per cobrar ${money(b.amount)}` : x).join(', ')), action: 'Obre-la', href: link(`bookings?open=${encodeURIComponent(b.stay + '|' + b.id)}`) });
  }
  const owed = new Map();
  for (const t of tlist) if (!t.cancelled && t.paid == null && t.date < today) owed.set(t.date, (owed.get(t.date) || 0) + 1);
  for (const [d, k] of [...owed].sort((a, b) => b[0].localeCompare(a[0])))
    todo.unshift({ kind: 'owed', text: `${n(k, 'taula', 'taules')} per cobrar`, sub: dayLong(d), action: 'Apunta-ho', href: link(`restaurant?paid=${d}`) });
  // Next week's Instagram plan, made this morning at 08:00 (lib/plan.js): it goes out as it is unless someone changes it
  const plan = await env.MAITE?.get('plan', 'json').catch(() => null);
  const nextWeekPlan = S.posts.filter(p => p.auto?.week === next);
  if (nextWeekPlan.length && !plan?.weeks?.[next]?.approved) todo.push({ kind: 'ig', text: "Pla d'Instagram de la setmana que ve",
    sub: `${[n(nextWeekPlan.filter(p => !p.story).length, 'post', 'posts'), n(nextWeekPlan.filter(p => p.story).length, 'story', 'stories')].filter(x => !x.startsWith('0 ')).join(' i ')}. Es pot canviar fins diumenge`, action: "Revisa'l", href: link('social?tab=plan') });
  if (SEO && SEO.date >= addDays(today, -7) && SEO.drafts.length) todo.push({ kind: 'seo', text: SEO.drafts.join(', '), sub: "Esborranys de l'informe SEO", action: 'Llegeix-los', href: SEO.url });

  // Instagram this week
  const at = p => p.published?.at || p.schedule?.at || (p.date ? p.date + 'T12:00:00Z' : '');
  const madridDay = iso => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date(iso));
  const madridTime = iso => new Intl.DateTimeFormat('ca-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  const published = S.posts.filter(p => p.published?.at && madridDay(p.published.at) >= start && madridDay(p.published.at) < end).length;
  const week = S.posts.filter(p => { const a = at(p); return a && madridDay(a) >= end && madridDay(a) < next; }).sort((a, b) => at(a).localeCompare(at(b)));
  const social = week.map(p => {
    const d = madridDay(at(p));
    return { story: !!p.story, title: p.auto?.why || p.menu?.title || (p.story ? 'Story' : 'Post'),
      when: `${cap(fmt(d, { weekday: 'long' }))} ${+d.slice(8)}${p.schedule || p.published ? `, a les ${madridTime(at(p))}` : ''}${p.published ? ' (publicat)' : ''}`,
      href: p.published?.url || link('social?tab=' + (p.auto ? 'plan' : 'profile')) };
  });

  // Google reviews, from the SEO report ("Reseñas de Google: 5,0 con 28 opiniones (eran 23 la semana pasada).")
  const rv = SEO?.reviews?.match(/(\d[,.]\d)\D+(\d+)\D+(?:(\d+))?/);
  const reviews = rv ? { rating: rv[1].replace('.', ','), count: +rv[2], more: rv[3] ? +rv[2] - +rv[3] : null } : null;

  const range = `${fromDay(start)} ${toDay(addDays(end, -1))}`;
  return weeklyNotice(env, {
    to: (env.WEEKLY_TO || TO).split(',').map(s => s.trim()).filter(Boolean),
    subject: `Resum de la setmana: ${money(total)}, ${range}`,
    range,
    hero: { total: money(total), delta: total - totalPrev, deltaText: total >= totalPrev ? `${money(total - totalPrev)} més que la setmana anterior (${money(totalPrev)})` : `${money(totalPrev - total)} menys que la setmana anterior (${money(totalPrev)})`,
      stays: money(st.cents), restaurant: money(re.cents), staysPct: total ? Math.round(st.cents / total * 100) : 0 },
    tiles: [
      { label: 'Ocupació', value: `${pct(st.nights, seats)} %`, hint: `${st.nights} de ${seats} nits` },
      { label: 'Hostes', value: String(st.guests), hint: n(st.bookings, 'reserva', 'reserves') },
      { label: 'Comensals', value: String(re.diners), hint: n(re.tables, 'taula', 'taules') },
      W ? { label: 'Visites a la web', value: String(W.visits), hint: n(W.purchases, 'reserva pagada', 'reserves pagades') }
        : { label: 'Reserves amb nits', value: String(st.bookings), hint: n(st.nights, 'nit', 'nits') },
    ],
    days: days.map(d => ({ ...d, text: money(d.stays + d.restaurant) })),
    weeks: weeks.map(w => ({ ...w, text: euros(Math.round(w.cents / 100) * 100) })),
    perStay, outlook, todo, social, published,
    counts: { posts: social.filter(x => !x.story).length, stories: social.filter(x => x.story).length },
    web: W, ads: ads && { spend: money(ads.spend), clicks: ads.clicks, perClick: ads.clicks ? money(ads.spend / ads.clicks) : '' },
    reviews, seo: SEO && SEO.date >= addDays(today, -14) ? { what: SEO.published.map(x => x.what), href: SEO.url, title: SEO.title } : null,
    links: { maite: base, social: link('social?tab=plan'), bookings: link('bookings?filter=todo'), restaurant: link('restaurant'),
      web: `${(env.POSTHOG_HOST || 'https://eu.posthog.com').replace(/\/$/, '')}/project/${phProject(env)}/web`,
      ads: `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${metaAccount(env)}` },
  });
}

export async function sendWeekly(env) {
  if (env.WEEKLY_EMAILS === 'off' || !env.MAITE || !env.RESEND_API_KEY || !env.GOOGLE_SA_KEY) return { skipped: 'not_configured' };
  const now = madridNow();
  if (weekday(now.date) !== 0 || madridHour() < AT) return { skipped: 'not_now' };
  if ((await env.MAITE.get('weekly', 'json'))?.week === now.date) return { skipped: 'done' };
  await env.MAITE.put('weekly', JSON.stringify({ week: now.date }));
  const mail = await weeklySummary(env, now.date);
  return { sent: await send(env, mail) };
}
