// Pregunta a Claude (functions/api/maite/chat.js): the house asks in plain words and Claude answers from Maite's data, with
// read-only tools over the bookings, the restaurant, prices, Instagram and the P&L (lib/pnl.js). When something should change,
// Claude proposes it with the propose tool; Maite shows each proposal with a button and nothing changes until it is pressed.
// Proposals: a price or a minimum stay for some nights (the same call as Preus, /api/maite/days), or a page of Maite to open.
import { STAYS, addDays, settings, today } from './booking.js';
import { allBookings, pnl } from './pnl.js';
import { tables, tablesConfigured } from './restaurant.js';
import { load } from './social.js';
import { stayName } from './push.js';

const MODEL = 'claude-opus-5-5';
const PAGES = ['home', 'calendar', 'bookings', 'restaurant', 'prices', 'stays', 'social', 'analytics'];
// The tabs each page can open on (maite-app/src/lib/ui.ts, openAt), and what item means there
const TABS = { stays: ['stays', 'rules'], social: ['plan', 'new', 'profile', 'calendar', 'emails'], restaurant: ['tables', 'menus', 'paid', 'open'], bookings: ['today', 'todo', 'next', 'past', 'cancelled', 'block'], prices: ['nights', 'discounts'], analytics: ['pnl', 'ads'] };
const WHERE = `Pages and tabs: social (Xarxes socials): plan = the weekly Instagram plan (change or remove the plan's posts and stories), new = make a post or story, profile = Publicar (every post and story still to go out: order, program, publish now, cancel a program, remove), calendar = what goes out each day, emails = Correus (the emails guests and the house get). stays (Allotjaments): stays = texts, capacity and photos of each accommodation, rules = Normes (minimum stay, notice, hours, cancellation). restaurant: tables = the tables of a day (item: YYYY-MM-DD), menus = the menus (item: a menu post id from the instagram tool, to open that menu), paid = Cobrat, what each table paid (item: YYYY-MM-DD), open = Dies oberts. bookings: a list filter (today, todo, next, past, cancelled, block); item: a booking key from the bookings tool opens that booking. prices: nights = price per night and special days, discounts. analytics: pnl = profit and loss, ads = ad spend. Other pages have no tabs.`;
const date = { type: 'string', description: 'YYYY-MM-DD' };
const range = { type: 'object', properties: { from: date, to: { ...date, description: 'YYYY-MM-DD, exclusive' } }, required: ['from', 'to'], additionalProperties: false };

const TOOLS = [
  { name: 'bookings', description: "Stays booked between two dates (at most 400 days): accommodation, guest, nights, guests, amount in euros, whether it's paid and what is missing (documents, email, phone, check-in).", input_schema: range },
  { name: 'restaurant', description: 'Restaurant tables between two dates (at most 400 days): day, time, name, people, what they paid in euros, cancelled; and the services open in that range with their seats.', input_schema: range },
  { name: 'prices', description: 'Current prices per night (normal and weekend), special prices and minimum stays by day from today on, discounts, and the restaurant settings.', input_schema: { type: 'object', properties: {}, additionalProperties: false } },
  { name: 'instagram', description: 'Instagram posts and stories planned or published between two dates.', input_schema: range },
  { name: 'pnl', description: 'Profit and loss between two dates: income from the bookings (by night) and the restaurant tables, direct costs and gross profit, other costs and the result, and the ads (by channel, with the bookings paid on the web).', input_schema: range },
  { name: 'propose', description: "Propose a change for the user to confirm with a button. Use it whenever you suggest doing something Maite can do: a special price or a minimum stay for some nights, or opening a page of Maite where it's done. Nothing changes until the user presses the button. One call per proposal.",
    input_schema: { type: 'object', additionalProperties: false, required: ['kind', 'label', 'why', 'stays', 'dates', 'price', 'min', 'page', 'tab', 'item'], properties: {
      kind: { type: 'string', enum: ['price', 'min', 'open'] },
      label: { type: 'string', description: 'The button text, in Catalan, short and literal: "Posa 110 € el 24 i 25 de desembre a Montserrat"' },
      why: { type: 'string', description: 'One sentence in Catalan: why' },
      stays: { type: 'array', items: { type: 'string', enum: Object.keys(STAYS) }, description: 'price and min: which accommodations; [] for open' },
      dates: { type: 'array', items: date, description: 'price and min: the nights; [] for open' },
      price: { type: ['number', 'null'], description: 'price: euros per night; null to go back to the normal price; null for min and open' },
      min: { type: ['integer', 'null'], description: 'min: minimum nights for arrivals on those days; null for price and open' },
      page: { type: ['string', 'null'], enum: [...PAGES, null], description: 'open: the page of Maite; null otherwise' },
      tab: { type: ['string', 'null'], description: 'open: the tab to open the page on, always when the page has tabs, so the user lands where it is done. ' + WHERE },
      item: { type: ['string', 'null'], description: 'open: what to open there, when the tab takes one (a day, a menu id, a booking key); null otherwise' },
    } } },
];

const SYSTEM = `You are Claude inside Maite, the back office of La Casa Vella: a village house from 1898 in El Bedorc (Anoia, Catalonia) with two apartments (Montserrat, La Pineda), two rooms (Les Vinyes, Figarot) and a restaurant that opens for menus on some days. The person writing runs the house; Maite's users are family, not technical.

Answer in the language they write in (usually Catalan), short and plain: the figure or the fact first, then one or two lines if needed. Use the tools to look things up; never invent figures, names or dates, and say so when the data isn't there (for example, no expenses sheet connected). Amounts in euros, dates as "dissabte 14 de novembre".

When a change would help (a price for some nights, a minimum stay, a page to open to do something), propose it with the propose tool and say in a sentence what you proposed. To send the user somewhere, open the exact tab where it's done (and the day, menu or booking when there is one), and say in a line what to press there: to cancel a programmed story, Xarxes socials › Publicar, then the clock on that story and Desprograma. Don't claim anything was changed: the user confirms each proposal with its button. Don't propose more than three things at once.

Writing: no em dashes, no emoji, no exclamation marks, no lists of options when one answer is enough.`;

const euro = c => c == null ? null : Math.round(c) / 100;
const within = (from, to) => typeof from === 'string' && typeof to === 'string' && from < to && Date.parse(to) - Date.parse(from) <= 400 * 864e5;

async function run(env, name, a, ctx) {
  if (name !== 'prices' && name !== 'propose' && !within(a.from, a.to)) return { error: 'from and to must be YYYY-MM-DD, from before to, at most 400 days apart' };
  if (name === 'bookings') return (await allBookings(env, a.from, a.to)).map(b => ({
    key: `${b.stay}|${b.id}`, stay: stayName(b.stay), guest: b.name || b.title, first: b.first, until: b.until, guests: b.guests, amount: euro(b.amount),
    paid: b.kind === 'paid' || b.settled, source: b.source || 'direct', documents: b.docs && !!b.docsFolder, email: !!b.email, phone: !!b.phone, checkin: b.checkin || null,
  }));
  if (name === 'restaurant') {
    if (!tablesConfigured(env)) return { error: 'restaurant calendar not connected' };
    const S = await settings(env), R = S.restaurant || {};
    return { open: (R.open || []).filter(x => x.slice(0, 10) >= a.from && x.slice(0, 10) < a.to), seats: R.seats,
      tables: (await (await tables(env)).list(a.from, a.to)).map(t => ({ date: t.date, time: t.time, name: t.name, people: t.people, paid: euro(t.paid), cancelled: !!t.cancelled })) };
  }
  if (name === 'prices') {
    const S = await settings(env), t = today();
    return { stays: Object.fromEntries(Object.keys(STAYS).map(k => [stayName(k), { normal: S.stays[k]?.base, weekend: S.stays[k]?.weekend ?? null, min: S.stays[k]?.min ?? S.rules?.min ?? null,
      days: Object.fromEntries(Object.entries(S.days[k] || {}).filter(([d]) => d >= t)) }])), discounts: S.discounts, restaurant: { seats: S.restaurant?.seats, open: (S.restaurant?.open || []).filter(x => x >= t) } };
  }
  if (name === 'instagram') {
    const P = await load(env), at = p => p.published?.at || p.schedule?.at || (p.date ? p.date + 'T12:00:00Z' : '');
    return P.posts.filter(p => { const d = at(p).slice(0, 10); return d && d >= a.from && d < a.to; }).map(p => ({
      id: p.pack || p.id, kind: p.story ? 'story' : 'post', menu: !!(p.menu || p.pack), what: p.auto?.why || p.menu?.title || p.tpl, when: at(p), published: !!p.published, programmed: !!p.schedule && !p.schedule.error, caption: (P.copies[p.id] || '').slice(0, 300) }));
  }
  if (name === 'pnl') {
    const r = await pnl(env, a.from, a.to);
    const out = x => ({ label: x.label, detail: x.sub, euros: euro(x.cents), ...(x.lines?.length ? { lines: x.lines.map(out) } : {}) });
    return { note: 'Income comes from the bookings and the restaurant tables (Cobrat), never from the sheet. Gross profit = income minus direct costs only; result = after all costs.',
      income: r.income.map(out), incomeTotal: euro(r.incomeTotal), directCosts: r.direct.map(out), directTotal: euro(r.directTotal), grossProfit: euro(r.gross), grossMargin: r.grossMargin,
      otherCosts: r.other.map(out), otherTotal: euro(r.otherTotal), result: euro(r.result),
      ads: { total: euro(r.ads.total), channels: r.ads.channels.map(out), webBookings: r.ads.webBookings, webIncome: euro(r.ads.webCents), costPerWebBooking: euro(r.ads.perBooking), meta: r.ads.meta },
      months: r.months?.map(m => ({ month: m.label, income: euro(m.income), directCosts: euro(m.direct), grossProfit: euro(m.gross), ads: euro(m.ads), result: euro(m.profit) })),
      sheet: r.sheet.connected ? 'read' : r.sheet.error,
      expenseLines: r.items.slice(0, 60).map(x => ({ date: x.date, concept: x.concept, category: x.category, euros: euro(x.cents) })) };
  }
  if (name === 'propose') {
    const ok = a.kind === 'open' ? PAGES.includes(a.page) && (!a.tab || (TABS[a.page] || []).includes(a.tab))
      : a.stays?.length && a.stays.every(s => STAYS[s]) && a.dates?.length && a.dates.length <= 120 && a.dates.every(d => /^\d{4}-\d{2}-\d{2}$/.test(d)) &&
        (a.kind === 'price' ? a.price === null || a.price >= 1 && a.price <= 5000 : Number.isInteger(a.min) && a.min >= 1 && a.min <= 30);
    if (!ok || ctx.proposals.length >= 3) return { error: ok ? 'at most three proposals' : 'invalid proposal' };
    ctx.proposals.push(a.kind === 'open' ? { kind: 'open', label: a.label, why: a.why, page: a.page, tab: a.tab || null, item: a.item ? String(a.item).slice(0, 120) : null }
      : { kind: a.kind, label: a.label, why: a.why, stays: a.stays, dates: [...new Set(a.dates)].sort(), ...(a.kind === 'price' ? { price: a.price } : { min: a.min }) });
    return { shown: 'The user sees it with a button to confirm. Nothing has changed yet.' };
  }
  return { error: 'unknown tool' };
}

// history: [{ role: 'user' | 'assistant', text }], the last one the user's. Returns { text, proposals }.
export async function chat(env, history, user) {
  const now = today();
  const messages = history.slice(-30).map(m => ({ role: m.role, content: String(m.text).slice(0, 8000) }));
  // Today and who writes go after the history, so the system prompt and the earlier turns stay cacheable
  messages.push({ role: 'system', content: `Today is ${now} (${new Date(now + 'T12:00:00Z').toLocaleDateString('ca-ES', { weekday: 'long', timeZone: 'UTC' })}). Writing: ${user || 'the house'}.` });
  const ctx = { proposals: [] };
  for (let turn = 0; turn < 8; turn++) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-beta': 'server-side-fallback-2026-07-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 16000, output_config: { effort: 'low' }, fallbacks: 'default', cache_control: { type: 'ephemeral' },
        system: SYSTEM, tools: TOOLS, messages }),
    });
    if (r.status === 429) throw Object.assign(new Error('busy'), { code: 'ai_busy' });
    if (!r.ok) throw new Error('claude ' + r.status + ' ' + (await r.text()).slice(0, 300));
    const m = await r.json();
    if (m.stop_reason === 'refusal') return { text: "No puc ajudar amb això.", proposals: ctx.proposals };
    const text = m.content.filter(b => b.type === 'text').map(b => b.text).join('\n\n').trim();
    if (m.stop_reason !== 'tool_use') return { text: text || 'Fet.', proposals: ctx.proposals };
    // The whole assistant turn goes back as it came (thinking blocks included), then every tool result in one message
    messages.push({ role: 'assistant', content: m.content });
    const calls = m.content.filter(b => b.type === 'tool_use');
    const results = await Promise.all(calls.map(async b => {
      let out;
      try { out = await run(env, b.name, b.input || {}, ctx); } catch (e) { out = { error: String(e.message || e).slice(0, 200) }; }
      return { type: 'tool_result', tool_use_id: b.id, content: JSON.stringify(out).slice(0, 60000), ...(out?.error ? { is_error: true } : {}) };
    }));
    messages.push({ role: 'user', content: results });
  }
  return { text: "Ho he hagut de deixar a mitges: torna-m'ho a preguntar més concret.", proposals: ctx.proposals };
}
