// Branded emails sent through Resend: contact form, booking confirmation and restaurant tables.
// The guest's emails go in the language they used on the web (ca, es, en); the house's stay in Catalan.
// Colours and type follow the brand book (Verd fosc, Cava, Verd alfàbrega, Le Monde Livre / Halyard).
// Email clients ignore web fonts more often than not, so each family falls back to a close system font.
import { STAYS, euros } from './booking.js';

export const HOUSE = 'info@casavellarural.com';
const PHONE = '+34 667 40 98 59';
const WHATSAPP = 'https://wa.me/34667409859';
const ADDRESS = ['Carrer Munné Orpí, 23', '08784 El Bedorc (Barcelona)'];
const MAPS = 'https://www.google.com/maps/search/?api=1&query=La+Casa+Vella+El+Bedorc&query_place_id=ChIJK6vlrrVlpBIRBAeTHj5ufvE';

const C = { deep: '#1a3f20', ground: '#efebe3', paper: '#f7f5f0', line: '#d6d0c2', text: '#26302a', muted: '#5f6a5f', basil: '#2e6d2e', sage: '#79a57a', onDeep: '#f3efe4' };
const SERIF = "'Le Monde Livre', Georgia, 'Times New Roman', serif";
const SANS = "'Halyard Display', 'Helvetica Neue', Helvetica, Arial, sans-serif";

export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const site = env => (env.SITE_URL || 'https://casavellarural.com').replace(/\/$/, '');
const LANGS = ['ca', 'es', 'en'];
export const langOf = l => LANGS.includes(l) ? l : 'ca';
const tr = (lang, ca, es, en) => lang === 'es' ? es : lang === 'en' ? en : ca;
const LANG_NAME = { es: 'castellà', en: 'anglès' };
const day = (d, lang = 'ca') => new Date(d + 'T12:00:00Z').toLocaleDateString(tr(lang, 'ca-ES', 'es-ES', 'en-GB'), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
// The arrival times the booking page offers, kept in Catalan (Maite shows them), for the guest's own email
const ARRIVAL = {
  'Abans de les 16 h': ['Antes de las 16 h', 'Before 4 pm'], 'Entre les 16 i les 18 h': ['Entre las 16 y las 18 h', '4 to 6 pm'],
  'Entre les 18 i les 20 h': ['Entre las 18 y las 20 h', '6 to 8 pm'], 'Entre les 20 i les 22 h': ['Entre las 20 y las 22 h', '8 to 10 pm'],
  'Més tard de les 22 h': ['Más tarde de las 22 h', 'After 10 pm'],
};
const arrivalIn = (a, lang) => ARRIVAL[a] ? tr(lang, a, ...ARRIVAL[a]) : a;

// ---------- Building blocks ----------
const label = t => `<div style="font:600 11px/1.4 ${SANS};letter-spacing:.24em;text-transform:uppercase;color:${C.basil};margin:0 0 10px">${t}</div>`;
const h1 = t => `<h1 style="font:400 30px/1.15 ${SERIF};color:${C.deep};margin:0 0 6px">${t}</h1>`;
const script = t => `<div style="font:italic 400 20px/1.3 ${SERIF};color:${C.basil};margin:0 0 22px">${t}</div>`;
const p = t => `<p style="font:300 16px/1.7 ${SANS};color:${C.text};margin:0 0 16px">${t}</p>`;
const button = (href, t) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px"><tr><td style="background:${C.deep}"><a href="${href}" style="display:inline-block;padding:14px 24px;font:600 11.5px/1 ${SANS};letter-spacing:.22em;text-transform:uppercase;color:${C.onDeep};text-decoration:none">${t}</a></td></tr></table>`;
const rows = list => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.line};margin:6px 0 24px">${list.filter(Boolean).map(([k, v, strong]) =>
  `<tr><td style="padding:12px 12px 12px 0;border-bottom:1px solid ${C.line};font:600 11px/1.5 ${SANS};letter-spacing:.18em;text-transform:uppercase;color:${C.muted};vertical-align:top;white-space:nowrap">${k}</td>` +
  `<td align="right" style="padding:12px 0;border-bottom:1px solid ${C.line};font:${strong ? `400 22px/1.3 ${SERIF};color:${C.deep}` : `300 15px/1.5 ${SANS};color:${C.text}`}">${v}</td></tr>`).join('')}</table>`;

function layout(env, { preheader, body, image, lang = 'ca' }) {
  const s = site(env);
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>La Casa Vella</title></head>
<body style="margin:0;padding:0;background:${C.ground}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ground}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
  <tr><td align="center" style="background:${C.deep};padding:30px 24px 26px"><a href="${s}/"><img src="${s}/img/logo-light.png" width="96" height="112" alt="La Casa Vella, 1898, El Bedorc" style="display:block;border:0;width:96px;height:auto"></a></td></tr>
  ${image ? `<tr><td style="background:${C.paper};padding:0"><img src="${s}/img/${image}" width="600" alt="" style="display:block;width:100%;height:auto;max-height:340px;object-fit:cover;border:0"></td></tr>` : ''}
  <tr><td style="background:${C.paper};padding:36px 32px 24px">${body}</td></tr>
  <tr><td style="background:${C.deep};padding:26px 32px;font:300 13.5px/1.7 ${SANS};color:${C.onDeep}">
    <div style="font:600 11px/1.4 ${SANS};letter-spacing:.24em;text-transform:uppercase;color:${C.sage};margin-bottom:8px">La Casa Vella</div>
    <a href="${MAPS}" style="color:${C.onDeep};text-decoration:none">${ADDRESS.join('<br>')}</a><br>
    <a href="tel:+34667409859" style="color:${C.onDeep};text-decoration:none">${PHONE}</a> (${tr(lang, 'també per', 'también por', 'also on')} <a href="${WHATSAPP}" style="color:${C.onDeep}">WhatsApp</a>)<br>
    <a href="mailto:${HOUSE}" style="color:${C.onDeep}">${HOUSE}</a><br>
    <a href="${s}/" style="color:${C.onDeep}">casavellarural.com</a>
  </td></tr>
</table></td></tr></table></body></html>`;
}

const textFooter = `\n\n--\nLa Casa Vella\n${ADDRESS.join(', ')}\n${PHONE}\n${HOUSE}`;
// For the house: which language to answer the guest in, when it isn't Catalan
const langNote = lang => LANG_NAME[lang] ? p(`L'hoste ha fet servir la web en ${LANG_NAME[lang]}.`) : '';

// ---------- Sending ----------
export async function send(env, { to, subject, html, text, replyTo }) {
  if (!env.RESEND_API_KEY) return false;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.CONTACT_FROM || `La Casa Vella <${HOUSE}>`, to: [to], reply_to: replyTo || HOUSE, subject, html, text }),
  });
  return r.ok;
}

// ---------- Contact form ----------
// To the house: the message, with the guest as reply-to.
export function contactNotice(env, { name, email, message, lang }) {
  const body = label('Missatge de la web') + h1(esc(name)) + script(`<a href="mailto:${esc(email)}" style="color:${C.basil}">${esc(email)}</a>`) +
    `<div style="border-left:3px solid ${C.sage};padding:4px 0 4px 18px;margin:0 0 24px;font:300 16px/1.7 ${SANS};color:${C.text};white-space:pre-wrap">${esc(message || '(sense missatge)')}</div>` +
    langNote(lang) + p(`Respon aquest correu i li arribarà directament a ${esc(name)}.`);
  return { to: env.CONTACT_TO || HOUSE, replyTo: email, subject: `Missatge de la web: ${name}`,
    html: layout(env, { preheader: (message || '').slice(0, 120), body }), text: `${name} <${email}>\n\n${message || '(sense missatge)'}` };
}

// To the guest: we got it, here is a copy.
export function contactReply(env, { name, email, message, lang }) {
  lang = langOf(lang);
  const t = (...a) => tr(lang, ...a), first = esc(name.split(/\s+/)[0]);
  const got = t('Hem rebut el teu missatge', 'Hemos recibido tu mensaje', "We've received your message");
  const line = t("Hem rebut el teu missatge i et respondrem tan aviat com puguem. Si és urgent, truca'ns o escriu-nos per WhatsApp.", 'Hemos recibido tu mensaje y te responderemos lo antes posible. Si es urgente, llámanos o escríbenos por WhatsApp.', "We've received your message and will reply as soon as we can. If it's urgent, call us or message us on WhatsApp.");
  const body = label(got) + h1(t(`Gràcies, ${first}`, `Gracias, ${first}`, `Thank you, ${first}`)) + script(t("t'escrivim aviat", 'te escribimos pronto', "we'll write soon")) +
    p(line) +
    (message ? label(t('El teu missatge', 'Tu mensaje', 'Your message')) + `<div style="border-left:3px solid ${C.sage};padding:4px 0 4px 18px;margin:0 0 24px;font:300 15px/1.7 ${SANS};color:${C.muted};white-space:pre-wrap">${esc(message)}</div>` : '') +
    button(WHATSAPP, t('Escriu-nos per WhatsApp', 'Escríbenos por WhatsApp', 'Message us on WhatsApp'));
  return { to: email, subject: got,
    html: layout(env, { preheader: t('Et respondrem aviat.', 'Te responderemos pronto.', "We'll reply soon."), body, image: 'montserrat-vinyes.jpg', lang }),
    text: `${t('Hola', 'Hola', 'Hello')} ${name.split(/\s+/)[0]},\n\n${line.replace(/\.$/, '')} (${PHONE}).${message ? `\n\n${t('El teu missatge', 'Tu mensaje', 'Your message')}:\n${message}` : ''}${textFooter}` };
}

// ---------- Booking ----------
// m: Stripe session metadata (stay, checkin, checkout, nights, guests, name, email, phone, arrival, notes)
// times: { checkin, checkout } hours from Maite's rules, shown next to the dates when given
// The stay as the guest reads it: name, and "of the …" with the article each language needs
const STAY_IN = {
  'montserrat': { ca: ["l'Apartament Montserrat"], es: ['Apartamento Montserrat', 'del Apartamento Montserrat'], en: ['Montserrat apartment', 'the Montserrat apartment'] },
  'la-pineda': { ca: ["l'Apartament La Pineda"], es: ['Apartamento La Pineda', 'del Apartamento La Pineda'], en: ['La Pineda apartment', 'the La Pineda apartment'] },
  'les-vinyes': { ca: ["l'Habitació Les Vinyes"], es: ['Habitación Les Vinyes', 'de la Habitación Les Vinyes'], en: ['Les Vinyes room', 'the Les Vinyes room'] },
  'figarot': { ca: ["l'Habitació Figarot"], es: ['Habitación Figarot', 'de la Habitación Figarot'], en: ['Figarot room', 'the Figarot room'] },
};
const stayName = (stay, lang) => lang === 'ca' || !STAY_IN[stay] ? STAYS[stay].name : STAY_IN[stay][lang][0];
// lang: the guest's language for their own email; the house's notice is always Catalan
const money = (cents, lang) => lang === 'en' ? '€' + (cents / 100).toLocaleString('en-GB', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 }) : euros(cents);
const stayLine = (n, g, lang) => `${n} ${n === 1 ? tr(lang, 'nit', 'noche', 'night') : tr(lang, 'nits', 'noches', 'nights')}, ${g} ${g === 1 ? tr(lang, 'persona', 'persona', 'guest') : tr(lang, 'persones', 'personas', 'guests')}`;
function bookingRows(m, amount, paidLabel, times = {}, lang = 'ca') {
  const t = (...a) => tr(lang, ...a);
  return rows([
    [t('Allotjament', 'Alojamiento', 'Stay'), esc(stayName(m.stay, lang))],
    ['Check-in', day(m.checkin, lang) + (times.checkin ? `<br>${t('a partir de les', 'a partir de las', 'from')} ${esc(times.checkin)}` : '')],
    ['Check-out', day(m.checkout, lang) + (times.checkout ? `<br>${t('abans de les', 'antes de las', 'by')} ${esc(times.checkout)}` : '')],
    [t('Estada', 'Estancia', 'Length'), stayLine(+m.nights, +m.guests, lang)],
    m.arrival && m.arrival !== 'Encara no ho sé' && [t("Hora d'arribada", 'Hora de llegada', 'Arrival'), esc(arrivalIn(m.arrival, lang))],
    m.notes && [t('A destacar', 'Comentarios', 'Notes'), esc(m.notes)],
    [paidLabel, money(amount, lang), true],
  ]);
}

// To the guest once the payment is complete. pending: bank payment still clearing.
// extra: { checkin, checkout, policy } check-in/out hours and the cancellation policy text the guest accepted (in m.lang)
export function bookingConfirmation(env, m, amount, pending = false, extra = {}) {
  const lang = langOf(m.lang), t = (...a) => tr(lang, ...a);
  const firstRaw = String(m.name || '').split(/\s+/)[0], first = esc(firstRaw);
  const names = STAY_IN[m.stay] || {}, stay = stayName(m.stay, lang);
  const ofStay = lang === 'ca' ? `de ${(names.ca || [STAYS[m.stay].name])[0]}` : lang === 'es' ? names.es[1] : names.en[1];
  const intro = pending
    ? t(`Hem rebut la teva reserva ${ofStay}. El banc encara ha de confirmar el pagament; quan arribi, et tornarem a escriure i les dates quedaran confirmades.`,
        `Hemos recibido tu reserva ${ofStay}. El banco todavía tiene que confirmar el pago; cuando llegue, te volveremos a escribir y las fechas quedarán confirmadas.`,
        `We've received your booking for ${ofStay}. The bank still has to confirm the payment; when it does, we'll write again and the dates will be confirmed.`)
    : t(`La teva reserva ${ofStay} està confirmada. Uns dies abans del check-in t'escriurem amb tot el que necessites per arribar al Bedorc.`,
        `Tu reserva ${ofStay} está confirmada. Unos días antes del check-in te escribiremos con todo lo que necesitas para llegar a El Bedorc.`,
        `Your booking for ${ofStay} is confirmed. A few days before check-in we'll write with everything you need to get to El Bedorc.`);
  const paid = pending ? t('Import', 'Importe', 'Amount') : t('Pagat', 'Pagado', 'Paid');
  const body = label(pending ? t('Reserva rebuda', 'Reserva recibida', 'Booking received') : t('Reserva confirmada', 'Reserva confirmada', 'Booking confirmed')) +
    h1(pending ? t(`Gràcies, ${first}`, `Gracias, ${first}`, `Thank you, ${first}`) : t(`Ja us esperem a casa, ${first}`, `Ya os esperamos en casa, ${first}`, `We look forward to having you, ${first}`)) +
    script(pending ? t('només falta el banc', 'solo falta el banco', 'just waiting on the bank') : t('fins ben aviat', 'hasta muy pronto', 'see you soon')) +
    p(esc(intro)) +
    bookingRows(m, amount, paid, extra, lang) +
    (extra.policy ? label(t('Cancel·lació', 'Cancelación', 'Cancellation')) + p(esc(extra.policy)) : '') +
    label(t('On som', 'Dónde estamos', 'Where we are')) + p(`<a href="${MAPS}" style="color:${C.deep}">${ADDRESS.join('<br>')}</a>`) +
    button(MAPS, t('Com arribar', 'Cómo llegar', 'Directions')) +
    `<div style="height:18px"></div>` +
    p(t(`Per a qualsevol canvi o pregunta, respon aquest correu, truca'ns al <a href="tel:+34667409859" style="color:${C.deep}">${PHONE}</a> o escriu-nos per <a href="${WHATSAPP}" style="color:${C.deep}">WhatsApp</a>.`,
        `Para cualquier cambio o pregunta, responde a este correo, llámanos al <a href="tel:+34667409859" style="color:${C.deep}">${PHONE}</a> o escríbenos por <a href="${WHATSAPP}" style="color:${C.deep}">WhatsApp</a>.`,
        `For any change or question, reply to this email, call us on <a href="tel:+34667409859" style="color:${C.deep}">${PHONE}</a> or message us on <a href="${WHATSAPP}" style="color:${C.deep}">WhatsApp</a>.`));
  const text = `${t('Hola', 'Hola', 'Hello')} ${firstRaw},\n\n` + intro.split('. ')[0] + '.' +
    `\n\nCheck-in: ${day(m.checkin, lang)}${extra.checkin ? `, ${t('a partir de les', 'a partir de las', 'from')} ${extra.checkin}` : ''}\nCheck-out: ${day(m.checkout, lang)}${extra.checkout ? `, ${t('abans de les', 'antes de las', 'by')} ${extra.checkout}` : ''}\n${stayLine(+m.nights, +m.guests, lang)}\n${paid}: ${money(amount, lang)}` +
    `${extra.policy ? `\n\n${t('Cancel·lació', 'Cancelación', 'Cancellation')}: ${extra.policy}` : ''}\n\n${t('On som', 'Dónde estamos', 'Where we are')}: ${ADDRESS.join(', ')}\n${MAPS}${textFooter}`;
  const subject = pending ? t(`Reserva rebuda: ${stay}`, `Reserva recibida: ${stay}`, `Booking received: ${stay}`) : t(`Reserva confirmada: ${stay}`, `Reserva confirmada: ${stay}`, `Booking confirmed: ${stay}`);
  const pre = t(`${stay}, del ${day(m.checkin)} al ${day(m.checkout)}.`, `${stay}, del ${day(m.checkin, lang)} al ${day(m.checkout, lang)}.`, `${stay}, ${day(m.checkin, lang)} to ${day(m.checkout, lang)}.`);
  return { to: m.email, subject, html: layout(env, { preheader: pre, body, image: 'hero-vinyes-cel.jpg', lang }), text };
}

// To the house: a new booking has come in (the calendar already has it).
export function bookingNotice(env, m, amount, pending = false) {
  const stay = STAYS[m.stay].name;
  const body = label(pending ? 'Reserva pendent del banc' : 'Nova reserva a la web') + h1(esc(stay)) + script(esc(m.name || '')) +
    bookingRows(m, amount, pending ? 'Import' : 'Pagat') +
    rows([['Correu', `<a href="mailto:${esc(m.email)}" style="color:${C.deep}">${esc(m.email)}</a>`], m.phone && ['Telèfon', `<a href="tel:${esc(m.phone.replace(/\s/g, ''))}" style="color:${C.deep}">${esc(m.phone)}</a>`]]) +
    langNote(m.lang) + p('Ja és al calendari de l\'allotjament. Respon aquest correu per escriure a l\'hoste.');
  return { to: env.CONTACT_TO || HOUSE, replyTo: m.email, subject: `${pending ? 'Reserva pendent' : 'Nova reserva'}: ${stay}, ${m.checkin} – ${m.checkout} (${m.name})`,
    html: layout(env, { preheader: `${m.name}, ${m.nights} nits, ${euros(amount)}`, body }),
    text: `${stay}\n${m.name}\n${m.email}\n${m.phone}\n${m.checkin} – ${m.checkout}, ${m.nights} nits, ${m.guests} persones\n${euros(amount)}${m.notes ? `\n\n${m.notes}` : ''}` };
}

// ---------- Restaurant ----------
// t: { date, time, people, name, email, phone, notes, lang }
const clock = (time, lang) => lang === 'en' ? time : `${+time.slice(0, 2)}${time.slice(3) === '00' ? '' : '.' + time.slice(3)} h`;
const diners = (n, lang) => `${n} ${n === 1 ? tr(lang, 'persona', 'persona', 'person') : tr(lang, 'persones', 'personas', 'people')}`;
const tableRows = (t, lang) => rows([
  [tr(lang, 'Dia', 'Día', 'Day'), day(t.date, lang)],
  [tr(lang, 'Hora', 'Hora', 'Time'), clock(t.time, lang)],
  [tr(lang, 'Persones', 'Personas', 'People'), diners(t.people, lang)],
  t.notes && [tr(lang, 'A tenir en compte', 'A tener en cuenta', 'Notes'), esc(t.notes)],
]);

// To the guest: the table is booked
export function tableConfirmation(env, t) {
  const lang = langOf(t.lang), tt = (...a) => tr(lang, ...a);
  const firstRaw = String(t.name || '').split(/\s+/)[0], first = esc(firstRaw);
  const intro = tt("La taula està reservada. Si no podeu venir o sou més o menys persones, avisa'ns per telèfon o WhatsApp.",
    'La mesa está reservada. Si no podéis venir o sois más o menos personas, avísanos por teléfono o WhatsApp.',
    "Your table is booked. If you can't come or the number of people changes, let us know by phone or WhatsApp.");
  const body = label(tt('Taula reservada', 'Mesa reservada', 'Table booked')) + h1(tt(`Us esperem, ${first}`, `Os esperamos, ${first}`, `See you soon, ${first}`)) +
    script(tt('a la planta baixa', 'en la planta baja', 'on the ground floor')) + p(esc(intro)) + tableRows(t, lang) +
    label(tt('On som', 'Dónde estamos', 'Where we are')) + p(`<a href="${MAPS}" style="color:${C.deep}">${ADDRESS.join('<br>')}</a>`) +
    button(MAPS, tt('Com arribar', 'Cómo llegar', 'Directions')) + `<div style="height:18px"></div>` +
    p(tt(`Truca'ns al <a href="tel:+34667409859" style="color:${C.deep}">${PHONE}</a> o escriu-nos per <a href="${WHATSAPP}" style="color:${C.deep}">WhatsApp</a>.`,
      `Llámanos al <a href="tel:+34667409859" style="color:${C.deep}">${PHONE}</a> o escríbenos por <a href="${WHATSAPP}" style="color:${C.deep}">WhatsApp</a>.`,
      `Call us on <a href="tel:+34667409859" style="color:${C.deep}">${PHONE}</a> or message us on <a href="${WHATSAPP}" style="color:${C.deep}">WhatsApp</a>.`));
  const when = `${day(t.date, lang)}, ${clock(t.time, lang)}`;
  return { to: t.email, subject: tt(`Taula reservada: ${when}`, `Mesa reservada: ${when}`, `Table booked: ${when}`),
    html: layout(env, { preheader: `${when}, ${diners(t.people, lang)}.`, body, image: 'restaurant-barra.jpg', lang }),
    text: `${tt('Hola', 'Hola', 'Hello')} ${firstRaw},\n\n${intro}\n\n${tt('Dia', 'Día', 'Day')}: ${day(t.date, lang)}\n${tt('Hora', 'Hora', 'Time')}: ${clock(t.time, lang)}\n${diners(t.people, lang)}${t.notes ? `\n${t.notes}` : ''}\n\n${tt('On som', 'Dónde estamos', 'Where we are')}: ${ADDRESS.join(', ')}\n${MAPS}${textFooter}` };
}

// To the house: a table booked on the web (it is already in the restaurant's calendar and in Maite)
export function tableNotice(env, t) {
  const body = label('Taula reservada a la web') + h1(esc(t.name)) + script(`per a ${diners(t.people, 'ca')}`) +
    tableRows(t, 'ca') +
    rows([['Telèfon', `<a href="tel:${esc(t.phone.replace(/\s/g, ''))}" style="color:${C.deep}">${esc(t.phone)}</a>`], ['Correu', `<a href="mailto:${esc(t.email)}" style="color:${C.deep}">${esc(t.email)}</a>`]]) +
    langNote(t.lang) + p("Ja és al calendari del restaurant i a Maite. Respon aquest correu per escriure a l'hoste.");
  return { to: env.CONTACT_TO || HOUSE, replyTo: t.email, subject: `Taula: ${t.date} a les ${t.time}, ${t.people} pers. (${t.name})`,
    html: layout(env, { preheader: `${t.name}, ${diners(t.people, 'ca')}, ${clock(t.time, 'ca')}`, body }),
    text: `${t.name}\n${t.phone}\n${t.email}\n${t.date} a les ${t.time}, ${diners(t.people, 'ca')}${t.notes ? `\n\n${t.notes}` : ''}` };
}

// ---------- Event request ----------
// e: { people, message, name, email, phone, lang }. No day yet: the house answers with one.
const quote = (t, color = C.text) => `<div style="border-left:3px solid ${C.sage};padding:4px 0 4px 18px;margin:0 0 24px;font:300 16px/1.7 ${SANS};color:${color};white-space:pre-wrap">${esc(t)}</div>`;

// To the house: what they'd like, with the guest as reply-to
export function eventNotice(env, e) {
  const body = label('Petició d\'esdeveniment') + h1(esc(e.name)) + script(`per a ${diners(e.people, 'ca')}`) + quote(e.message) +
    rows([['Telèfon', `<a href="tel:${esc(e.phone.replace(/\s/g, ''))}" style="color:${C.deep}">${esc(e.phone)}</a>`], ['Correu', `<a href="mailto:${esc(e.email)}" style="color:${C.deep}">${esc(e.email)}</a>`]]) +
    langNote(e.lang) + p("Encara no té dia. Respon aquest correu per proposar-li dia, hora i menú.");
  return { to: env.CONTACT_TO || HOUSE, replyTo: e.email, subject: `Esdeveniment: ${e.people} pers. (${e.name})`,
    html: layout(env, { preheader: e.message.slice(0, 120), body }),
    text: `${e.name}\n${e.phone}\n${e.email}\n${diners(e.people, 'ca')}\n\n${e.message}` };
}

// To the guest: we got it and will write with a day and a menu
export function eventReply(env, e) {
  const lang = langOf(e.lang), tt = (...a) => tr(lang, ...a);
  const firstRaw = e.name.split(/\s+/)[0], first = esc(firstRaw);
  const got = tt('Hem rebut la vostra petició', 'Hemos recibido vuestra petición', "We've received your request");
  const line = tt("Us escriurem aviat amb una proposta de dia, hora i menú. Si és urgent, truca'ns o escriu-nos per WhatsApp.",
    'Os escribiremos pronto con una propuesta de día, hora y menú. Si es urgente, llámanos o escríbenos por WhatsApp.',
    "We'll write soon with a suggested day, time and menu. If it's urgent, call us or message us on WhatsApp.");
  const body = label(got) + h1(tt(`Gràcies, ${first}`, `Gracias, ${first}`, `Thank you, ${first}`)) + script(tt('a la planta baixa', 'en la planta baja', 'on the ground floor')) +
    p(line) + rows([[tt('Persones', 'Personas', 'People'), diners(e.people, lang)]]) +
    label(tt('La vostra petició', 'Vuestra petición', 'Your request')) + quote(e.message, C.muted) +
    button(WHATSAPP, tt('Escriu-nos per WhatsApp', 'Escríbenos por WhatsApp', 'Message us on WhatsApp'));
  return { to: e.email, subject: got,
    html: layout(env, { preheader: tt('Us escriurem aviat.', 'Os escribiremos pronto.', "We'll write soon."), body, image: 'restaurant-barra.jpg', lang }),
    text: `${tt('Hola', 'Hola', 'Hello')} ${firstRaw},\n\n${line.replace(/\.$/, '')} (${PHONE}).\n\n${diners(e.people, lang)}\n${e.message}${textFooter}` };
}
