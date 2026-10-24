// The restaurant's table bookings: one Google Calendar (CAL_RESTAURANT) with an event per table,
// and the services, seats and limits set in Maite (settings().restaurant in lib/booking.js). No payment.
import { googleToken, addDays } from './booking.js';
import { sourceName } from './maite.js';

export const tablesConfigured = env => !!(env.GOOGLE_SA_EMAIL && env.GOOGLE_SA_KEY && env.CAL_RESTAURANT);

const pad = n => String(n).padStart(2, '0');
const mins = t => +t.slice(0, 2) * 60 + +t.slice(3, 5);
const hhmm = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
export const isTime = t => typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
// Arrival times of a service, every half hour from the first to the last
export function times(s) {
  const out = [];
  for (let m = mins(s.from); m <= mins(s.to); m += 30) out.push(hhmm(m));
  return out;
}
// The restaurant is closed unless that date is opened in Maite, with the services it has
export const servicesOn = (R, date) => R.services.filter(s => (R.open[date] || []).includes(s.id));
export const serviceAt = (R, date, time) => servicesOn(R, date).find(s => times(s).includes(time));

// Today's date and the minutes gone since midnight, in Spain
export function madridNow() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date()).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: +p.hour * 60 + +p.minute };
}
// Whether the web can still take a table at that moment, with the hours of notice set in Maite
export function inTime(R, date, time, now = madridNow()) {
  const days = Math.round((Date.parse(date) - Date.parse(now.date)) / 864e5);
  return days * 1440 + mins(time) - now.minutes >= R.minHours * 60;
}

// How full each service is that day: seats taken by the tables that aren't cancelled
export function serviceLoad(R, date, list) {
  return servicesOn(R, date).map(s => {
    const ts = times(s);
    const taken = list.filter(t => !t.cancelled && t.date === date && (t.service ? t.service === s.id : ts.includes(t.time))).reduce((n, t) => n + (t.people || 0), 0);
    return { ...s, times: ts, taken };
  });
}

// ---------- Calendar events as tables ----------
// Tables from the web or Maite carry lcv=table; anything else on that calendar (written by hand in Google Calendar) shows as it is
export function asTable(e) {
  const p = e.extendedProperties?.private || {}, start = e.start.dateTime || e.start.date || '';
  const mine = p.lcv === 'table';
  return {
    id: e.id, date: start.slice(0, 10), time: e.start.dateTime ? start.slice(11, 16) : '', people: Number(p.people) || null,
    name: mine ? p.name || '' : e.summary || '', phone: p.phone || '', email: p.email || '', notes: mine ? p.notes || '' : e.description || '',
    source: mine ? p.source || '' : 'calendar', service: p.service || '', lang: p.lang || '', cancelled: p.state === 'cancelled', link: e.htmlLink || '',
  };
}

// t: { date, time, people, name, phone, email, notes, source, service, lang }. Two hours at the table, so the calendar reads well.
export function tableEvent(t, by = '') {
  const end = Math.min(mins(t.time) + 120, 23 * 60 + 59);
  return {
    summary: `${t.name} (${t.people} pers.)`,
    description: [
      `Taula per a ${t.people}`, `Nom: ${t.name}`, t.phone && `Telèfon: ${t.phone}`, t.email && `Correu: ${t.email}`, t.notes && `Comentaris: ${t.notes}`,
      t.source === 'web' ? 'Reservada a la web.' : `Via: ${sourceName(t.source)}. Afegida a Maite per ${by}.`,
    ].filter(Boolean).join('\n'),
    start: { dateTime: `${t.date}T${t.time}:00`, timeZone: 'Europe/Madrid' }, end: { dateTime: `${t.date}T${hhmm(end)}:00`, timeZone: 'Europe/Madrid' },
    transparency: 'transparent', colorId: t.source === 'web' ? '10' : '5',
    extendedProperties: { private: { lcv: 'table', people: String(t.people), name: t.name, phone: t.phone, email: t.email, notes: t.notes,
      source: t.source, service: t.service || '', lang: t.lang || '', by } },
  };
}

export async function tables(env) {
  const token = await googleToken(env);
  const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(env.CAL_RESTAURANT)}/events`;
  const call = async (path, method = 'GET', body) => {
    const r = await fetch(base + path, { method, headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' }, body: body && JSON.stringify(body) });
    if (r.status === 404 || r.status === 410) return null;
    if (!r.ok) throw new Error(`calendar ${method} ${r.status}`);
    return r.json();
  };
  return {
    // Every table from `from` to the day before `to`, in time order (times read in Spain's time zone)
    async list(from, to) {
      const q = new URLSearchParams({ timeMin: addDays(from, -1) + 'T00:00:00Z', timeMax: addDays(to, 1) + 'T00:00:00Z', singleEvents: 'true', orderBy: 'startTime', maxResults: '2500', timeZone: 'Europe/Madrid' });
      const res = await call('?' + q);
      if (!res) throw new Error('calendar not shared with the service account');
      return (res.items || []).filter(e => e.status !== 'cancelled').map(asTable).filter(t => t.date >= from && t.date < to);
    },
    create: ev => call('', 'POST', ev),
    get: id => call('/' + encodeURIComponent(id) + '?timeZone=Europe%2FMadrid'),
    patch: (id, ev) => call('/' + encodeURIComponent(id), 'PATCH', ev),
  };
}
