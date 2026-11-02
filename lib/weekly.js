// The weekly summary by email, every Monday from 10:00 (Madrid), and the push for yesterday's restaurant tables without an
// amount, every day from 10:00. Both run from /api/social-cron (the cron Worker in cron/), once each: the day they last ran
// is in KV (MAITE, keys "weekly" and "owed-push").
//
// The summary: last week's figures (stays by night, the restaurant from what Cobrat says), what is still to do (bookings of the
// next 30 days with something missing, tables to charge, the SEO drafts, next week's Instagram plan to look at), this week's
// Instagram plan, the web and the ads (PostHog and Meta, when their keys are set), the latest SEO report (lib/seo-report.js,
// written by build.py) and a few lines on the week that comes. Every item links to the place in Maite where it is done.
// WEEKLY_TO: who gets it, comma separated (default below). WEEKLY_EMAILS=off stops it.
import { STAYS, addDays, calendar, configured, euros } from './booking.js';
import { asBooking } from './maite.js';
import { madridNow, tables, tablesConfigured } from './restaurant.js';
import { load } from './social.js';
import { push, stayName } from './push.js';
import { send, weeklyNotice } from './email.js';
import { SEO } from './seo-report.js';

const TO = 'kilovatio3@gmail.com, xmontmany@gmail.com, marius@itsrever.com';
const AT = 10;

const madridHour = () => +new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', hourCycle: 'h23' }).format(new Date());
const weekday = d => (new Date(d + 'T12:00:00Z').getUTCDay() + 6) % 7;
const fmt = (d, o) => new Date(d + 'T12:00:00Z').toLocaleDateString('ca-ES', { ...o, timeZone: 'UTC' }).replace(/’/g, "'");
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const dayLong = d => cap(fmt(d, { weekday: 'long', day: 'numeric', month: 'long' }));
const dayShort = d => fmt(d, { day: 'numeric', month: 'short' }).replace('.', '');
const nightsOf = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const money = c => euros(Math.round(c || 0));
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
  const r = await fetch(`${host}/api/projects/${env.POSTHOG_PROJECT_ID}/query/`, {
    method: 'POST', headers: { authorization: 'Bearer ' + env.POSTHOG_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
  });
  if (!r.ok) throw new Error('posthog ' + r.status);
  return (await r.json()).results || [];
}
async function web(env, from, to) {
  if (!env.POSTHOG_API_KEY || !env.POSTHOG_PROJECT_ID) return null;
  const when = `timestamp >= toDateTime('${from} 00:00:00', 'Europe/Madrid') AND timestamp < toDateTime('${to} 00:00:00', 'Europe/Madrid')`;
  const [[visits = 0, checkouts = 0, purchases = 0] = []] = await hogql(env,
    `SELECT uniqIf(properties.$session_id, event = '$pageview'), countIf(event = 'begin_checkout'), countIf(event = 'purchase') FROM events WHERE ${when}`);
  const sources = await hogql(env, `SELECT multiIf(
      properties.$current_url ILIKE '%gclid=%' OR (properties.utm_source = 'google' AND properties.utm_medium IN ('cpc', 'paid', 'ppc')), 'Google Ads',
      properties.$current_url ILIKE '%fbclid=%' OR properties.utm_source IN ('facebook', 'instagram', 'meta', 'ig', 'fb'), 'Instagram i Facebook',
      properties.$referring_domain ILIKE '%google.%', 'Cerca de Google',
      properties.$referring_domain IN ('$direct', ''), 'Directe (enllaç o adreça)',
      properties.$referring_domain) AS src, uniq(properties.$session_id) AS n
    FROM events WHERE event = '$pageview' AND ${when} AND NOT (properties.$referring_domain ILIKE '%casavellarural.com%')
    GROUP BY src ORDER BY n DESC LIMIT 6`);
  return { visits, checkouts, purchases, sources: sources.map(([src, k]) => [String(src), Number(k)]) };
}
// Meta ads: META_ADS_TOKEN (a system user token with ads_read) and META_AD_ACCOUNT (the number after act_)
async function metaAds(env, from, to) {
  if (!env.META_ADS_TOKEN || !env.META_AD_ACCOUNT) return null;
  const q = new URLSearchParams({ fields: 'spend,impressions,reach,inline_link_clicks', time_range: JSON.stringify({ since: from, until: addDays(to, -1) }), access_token: env.META_ADS_TOKEN });
  const r = await fetch(`https://graph.facebook.com/v21.0/act_${String(env.META_AD_ACCOUNT).replace(/^act_/, '')}/insights?${q}`);
  if (!r.ok) throw new Error('meta ' + r.status);
  const d = (await r.json()).data?.[0] || {};
  return { spend: Math.round(Number(d.spend || 0) * 100), impressions: +d.impressions || 0, reach: +d.reach || 0, clicks: +d.inline_link_clicks || 0 };
}

// ---------- The summary ----------
export async function weeklySummary(env, today = madridNow().date) {
  const base = maiteBase(env), link = path => base + '#/' + path;
  const end = addDays(today, -weekday(today)), start = addDays(end, -7), prev = addDays(start, -7), next = addDays(end, 7);
  const [list, tlist, S] = await Promise.all([
    allBookings(env, prev, addDays(today, 31)),
    tablesConfigured(env) ? tables(env).then(t => t.list(addDays(today, -60), addDays(today, 15))) : [],
    env.MAITE ? load(env) : { posts: [] },
  ]);
  const [W, ads] = await Promise.all([web(env, start, end).catch(() => null), metaAds(env, start, end).catch(() => null)]);
  const seats = Object.keys(STAYS).length * 7;
  const st = stays(list, start, end), stPrev = stays(list, prev, start), re = restaurant(tlist, start, end), rePrev = restaurant(tlist, prev, start);
  const total = st.cents + re.cents, totalPrev = stPrev.cents + rePrev.cents;
  const range = `${dayShort(start)} – ${dayShort(addDays(end, -1))}`;

  // Last week
  const figures = [
    ['Ingressos', money(total), true],
    ['Allotjaments', money(st.cents)],
    ['Restaurant', money(re.cents)],
    ['Nits ocupades', `${st.nights} de ${seats} (${pct(st.nights, seats)} %)`],
    ['Hostes', `${st.guests} (${n(st.bookings, 'reserva', 'reserves')})`],
    ['Comensals', `${re.diners} (${n(re.tables, 'taula', 'taules')})`],
    ['La setmana abans', money(totalPrev)],
  ];

  // What is still to do
  const todo = [];
  for (const b of list.filter(b => b.until >= today && b.first < addDays(today, 30))) {
    const m = missing(b, today);
    if (m.length) todo.push({ text: `${b.name || b.title}, ${stayName(b.stay)}, ${dayShort(b.first)}`, sub: cap(m.join(', ')), href: link(`bookings?open=${encodeURIComponent(b.stay + '|' + b.id)}`) });
  }
  const owed = new Map();
  for (const t of tlist) if (!t.cancelled && t.paid == null && t.date < today) owed.set(t.date, (owed.get(t.date) || 0) + 1);
  for (const [d, k] of [...owed].sort((a, b) => b[0].localeCompare(a[0])))
    todo.push({ text: `${n(k, 'taula', 'taules')} per cobrar`, sub: dayLong(d), href: link(`restaurant?paid=${d}`) });
  // Next week's Instagram plan, made this morning at 08:00 (lib/plan.js): it goes out as it is unless someone changes it
  const plan = await env.MAITE?.get('plan', 'json').catch(() => null);
  const nextWeekPlan = S.posts.filter(p => p.auto?.week === next);
  if (nextWeekPlan.length && !plan?.weeks?.[next]?.approved) todo.push({ text: "Revisa el pla d'Instagram de la setmana que ve",
    sub: `${[n(nextWeekPlan.filter(p => !p.story).length, 'post', 'posts'), n(nextWeekPlan.filter(p => p.story).length, 'story', 'stories')].filter(x => !x.startsWith('0 ')).join(' i ')}. Es pot canviar fins diumenge a les 23:59`, href: link('social?tab=plan') });
  if (SEO && SEO.date >= addDays(today, -7)) for (const d of SEO.drafts) todo.push({ text: d, sub: "Esborrany a l'informe SEO", href: SEO.url });

  // Instagram: last week, and this week's plan
  const at = p => p.published?.at || p.schedule?.at || (p.date ? p.date + 'T12:00:00Z' : '');
  const madridDay = iso => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date(iso));
  const madridTime = iso => new Intl.DateTimeFormat('ca-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  const published = S.posts.filter(p => p.published?.at && madridDay(p.published.at) >= start && madridDay(p.published.at) < end);
  const week = S.posts.filter(p => { const a = at(p); return a && madridDay(a) >= end && madridDay(a) < next; }).sort((a, b) => at(a).localeCompare(at(b)));
  const social = week.map(p => ({
    text: `${dayLong(madridDay(at(p)))}${p.schedule || p.published ? `, ${madridTime(at(p))}` : ''}`,
    sub: `${p.story ? 'Story' : 'Post'}: ${p.auto?.why || (p.menu ? 'Menú' : 'Publicació') }${p.published ? ' (publicat)' : p.schedule ? '' : ' (sense hora)'}`,
    href: p.published?.url || link('social?tab=' + (p.auto ? 'plan' : 'profile')),
  }));

  // The week that comes
  const st7 = stays(list, today, addDays(today, 7));
  const arrivals = list.filter(b => b.first >= today && b.first < addDays(today, 7));
  // This week's Friday and Saturday nights
  const covered = (s, d) => list.some(b => b.stay === s && b.first <= d && b.until > d);
  const freeWeekend = Object.keys(STAYS).filter(s => !covered(s, addDays(end, 4)) || !covered(s, addDays(end, 5)));
  const insights = [];
  if (total || totalPrev) insights.push(total >= totalPrev
    ? `La setmana passada va fer ${money(total - totalPrev)} més que l'anterior.`
    : `La setmana passada va fer ${money(totalPrev - total)} menys que l'anterior.`);
  insights.push(`Aquesta setmana hi ha ${n(arrivals.length, 'arribada', 'arribades')} i ${st7.nights} de ${seats} nits ocupades (${pct(st7.nights, seats)} %).`);
  if (freeWeekend.length) insights.push(`Aquest cap de setmana queden nits lliures a ${freeWeekend.map(stayName).join(', ')}.`);
  if (W && W.checkouts > W.purchases) insights.push(`${n(W.checkouts, 'visita va', 'visites van')} començar a reservar i ${n(W.purchases, 'va acabar', 'van acabar')} pagant.`);
  if (ads?.spend) insights.push(ads.clicks ? `Els anuncis de Meta van costar ${money(ads.spend)} per ${n(ads.clicks, 'clic', 'clics')} a la web (${money(ads.spend / ads.clicks)} cada un).` : `Els anuncis de Meta van costar ${money(ads.spend)} i no van portar cap clic a la web.`);

  // The web, the ads and SEO
  const webRows = W ? [
    ['Visites', String(W.visits)],
    ['Han començat a reservar', String(W.checkouts)],
    ['Reserves pagades', String(W.purchases)],
    ...W.sources.map(([s, k]) => [s, String(k)]),
  ] : [];
  const adsRows = ads ? [['Meta: inversió', money(ads.spend)], ['Meta: persones que els han vist', String(ads.reach)], ['Meta: clics a la web', String(ads.clicks)]] : [];
  const seo = SEO ? {
    title: SEO.title, href: SEO.url,
    lines: [...SEO.published.map(x => `${x.what}: ${x.text}`), SEO.reviews, SEO.visibility].filter(Boolean),
  } : null;

  return weeklyNotice(env, {
    to: (env.WEEKLY_TO || TO).split(',').map(s => s.trim()).filter(Boolean),
    subject: `Resum de la setmana: ${money(total)}, ${range}`,
    range, figures, todo, insights, social, published: published.length, webRows, adsRows, seo,
    links: { maite: base, social: link('social?tab=plan'), bookings: link('bookings?filter=todo'), web: env.POSTHOG_PROJECT_ID ? `${(env.POSTHOG_HOST || 'https://eu.posthog.com').replace(/\/$/, '')}/project/${env.POSTHOG_PROJECT_ID}/web` : '', ads: env.META_AD_ACCOUNT ? `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${String(env.META_AD_ACCOUNT).replace(/^act_/, '')}` : 'https://adsmanager.facebook.com/' },
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
