// Branded emails sent through Resend: contact form and booking confirmation.
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
const day = d => new Date(d + 'T12:00:00Z').toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

// ---------- Building blocks ----------
const label = t => `<div style="font:600 11px/1.4 ${SANS};letter-spacing:.24em;text-transform:uppercase;color:${C.basil};margin:0 0 10px">${t}</div>`;
const h1 = t => `<h1 style="font:400 30px/1.15 ${SERIF};color:${C.deep};margin:0 0 6px">${t}</h1>`;
const script = t => `<div style="font:italic 400 20px/1.3 ${SERIF};color:${C.basil};margin:0 0 22px">${t}</div>`;
const p = t => `<p style="font:300 16px/1.7 ${SANS};color:${C.text};margin:0 0 16px">${t}</p>`;
const button = (href, t) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px"><tr><td style="background:${C.deep}"><a href="${href}" style="display:inline-block;padding:14px 24px;font:600 11.5px/1 ${SANS};letter-spacing:.22em;text-transform:uppercase;color:${C.onDeep};text-decoration:none">${t}</a></td></tr></table>`;
const rows = list => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.line};margin:6px 0 24px">${list.filter(Boolean).map(([k, v, strong]) =>
  `<tr><td style="padding:12px 12px 12px 0;border-bottom:1px solid ${C.line};font:600 11px/1.5 ${SANS};letter-spacing:.18em;text-transform:uppercase;color:${C.muted};vertical-align:top;white-space:nowrap">${k}</td>` +
  `<td align="right" style="padding:12px 0;border-bottom:1px solid ${C.line};font:${strong ? `400 22px/1.3 ${SERIF};color:${C.deep}` : `300 15px/1.5 ${SANS};color:${C.text}`}">${v}</td></tr>`).join('')}</table>`;

function layout(env, { preheader, body, image }) {
  const s = site(env);
  return `<!doctype html><html lang="ca"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>La Casa Vella</title></head>
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
    <a href="tel:+34667409859" style="color:${C.onDeep};text-decoration:none">${PHONE}</a> · <a href="${WHATSAPP}" style="color:${C.onDeep}">WhatsApp</a><br>
    <a href="mailto:${HOUSE}" style="color:${C.onDeep}">${HOUSE}</a> · <a href="${s}/" style="color:${C.onDeep}">casavellarural.com</a>
  </td></tr>
</table></td></tr></table></body></html>`;
}

const textFooter = `\n\n--\nLa Casa Vella\n${ADDRESS.join(', ')}\n${PHONE} · ${HOUSE}`;

// ---------- Texts the guest reads, editable in Maite (MAITE KV, key "emails") ----------
// Plain text: a blank line starts a new paragraph. {nom}, {allotjament}, {arribada} and {sortida} are filled in per email.
export const DEFAULT_TEXTS = {
  contact: {
    subject: 'Hem rebut el teu missatge · La Casa Vella', title: 'Gràcies, {nom}', subtitle: "t'escrivim aviat",
    body: "Hem rebut el teu missatge i et respondrem tan aviat com puguem. Si és urgent, truca'ns o escriu-nos per WhatsApp.",
  },
  confirm: {
    subject: 'Reserva confirmada: {allotjament} · La Casa Vella', title: 'Ja us esperem a casa, {nom}', subtitle: 'fins ben aviat',
    body: "La teva reserva de l'{allotjament} està confirmada. Uns dies abans de l'arribada t'escriurem amb tot el que necessites per arribar al Bedorc.",
    before: '',
    closing: "Per a qualsevol canvi o pregunta, respon aquest correu, truca'ns o escriu-nos per WhatsApp.",
  },
  pending: {
    subject: 'Reserva rebuda: {allotjament} · La Casa Vella', title: 'Gràcies, {nom}', subtitle: 'només falta el banc',
    body: "Hem rebut la teva reserva de l'{allotjament}. El banc encara ha de confirmar el pagament; quan arribi, et tornarem a escriure i les dates quedaran confirmades.",
  },
};
export const TEXT_LIMITS = { subject: 120, title: 80, subtitle: 80, body: 1500, before: 1500, closing: 600 };

export async function texts(env) {
  let saved = null;
  try { saved = env.MAITE && await env.MAITE.get('emails', 'json'); } catch (e) {}
  return Object.fromEntries(Object.entries(DEFAULT_TEXTS).map(([k, d]) => [k, { ...d, ...saved?.[k] }]));
}

const fill = (t, v) => String(t || '').replace(/\{(nom|allotjament|arribada|sortida)\}/g, (_, k) => v[k] ?? '');
const paras = (t, v) => fill(t, v).split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
const htmlParas = (t, v) => paras(t, v).map(x => p(esc(x).replace(/\n/g, '<br>'))).join('');
const textParas = (t, v) => paras(t, v).join('\n\n');

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
export function contactNotice(env, { name, email, message }) {
  const body = label('Missatge de la web') + h1(esc(name)) + script(`<a href="mailto:${esc(email)}" style="color:${C.basil}">${esc(email)}</a>`) +
    `<div style="border-left:3px solid ${C.sage};padding:4px 0 4px 18px;margin:0 0 24px;font:300 16px/1.7 ${SANS};color:${C.text};white-space:pre-wrap">${esc(message || '(sense missatge)')}</div>` +
    p(`Respon aquest correu i li arribarà directament a ${esc(name)}.`);
  return { to: env.CONTACT_TO || HOUSE, replyTo: email, subject: `Missatge de la web: ${name}`,
    html: layout(env, { preheader: (message || '').slice(0, 120), body }), text: `${name} <${email}>\n\n${message || '(sense missatge)'}` };
}

// To the guest: we got it, here is a copy.
export function contactReply(env, { name, email, message }, T = DEFAULT_TEXTS) {
  const t = T.contact, v = { nom: name.split(/\s+/)[0] };
  const body = label('Hem rebut el teu missatge') + h1(esc(fill(t.title, v))) + script(esc(fill(t.subtitle, v))) +
    htmlParas(t.body, v) +
    (message ? label('El teu missatge') + `<div style="border-left:3px solid ${C.sage};padding:4px 0 4px 18px;margin:0 0 24px;font:300 15px/1.7 ${SANS};color:${C.muted};white-space:pre-wrap">${esc(message)}</div>` : '') +
    button(WHATSAPP, 'Escriu-nos per WhatsApp');
  return { to: email, subject: fill(t.subject, v),
    html: layout(env, { preheader: paras(t.body, v)[0] || '', body, image: 'montserrat-vinyes.jpg' }),
    text: `${fill(t.title, v)}\n\n${textParas(t.body, v)}${message ? `\n\nEl teu missatge:\n${message}` : ''}${textFooter}` };
}

// ---------- Booking ----------
// m: Stripe session metadata (stay, checkin, checkout, nights, guests, name, email, phone, arrival, notes)
// times: { checkin, checkout } hours from Maite's rules, shown next to the dates when given
function bookingRows(m, amount, paidLabel, times = {}) {
  const n = +m.nights, g = +m.guests;
  return rows([
    ['Allotjament', esc(STAYS[m.stay].name)],
    ['Arribada', day(m.checkin) + (times.checkin ? `<br>a partir de les ${esc(times.checkin)}` : '')],
    ['Sortida', day(m.checkout) + (times.checkout ? `<br>abans de les ${esc(times.checkout)}` : '')],
    ['Estada', `${n} ${n === 1 ? 'nit' : 'nits'} · ${g} ${g === 1 ? 'persona' : 'persones'}`],
    m.arrival && m.arrival !== 'Encara no ho sé' && ['Hora d\'arribada', esc(m.arrival)],
    m.notes && ['A destacar', esc(m.notes)],
    [paidLabel, euros(amount), true],
  ]);
}

// To the guest once the payment is complete. pending: bank payment still clearing.
// extra: { checkin, checkout, policy } check-in/out hours and the cancellation policy text the guest accepted
// T: texts(env), the wording edited in Maite
export function bookingConfirmation(env, m, amount, pending = false, extra = {}, T = DEFAULT_TEXTS) {
  const stay = STAYS[m.stay].name, t = pending ? T.pending : T.confirm, closing = T.confirm.closing;
  const v = { nom: String(m.name || '').split(/\s+/)[0], allotjament: stay, arribada: day(m.checkin), sortida: day(m.checkout) };
  const before = !pending && paras(T.confirm.before, v).length;
  const body = label(pending ? 'Reserva rebuda' : 'Reserva confirmada') +
    h1(esc(fill(t.title, v))) + script(esc(fill(t.subtitle, v))) +
    htmlParas(t.body, v) +
    bookingRows(m, amount, pending ? 'Import' : 'Pagat', extra) +
    (before ? label("Abans d'arribar") + htmlParas(T.confirm.before, v) : '') +
    (extra.policy ? label('Cancel·lació') + p(esc(extra.policy)) : '') +
    label('On som') + p(`<a href="${MAPS}" style="color:${C.deep}">${ADDRESS.join('<br>')}</a>`) +
    button(MAPS, 'Com arribar') +
    `<div style="height:18px"></div>` +
    htmlParas(closing, v);
  const text = `${fill(t.title, v)}\n\n${textParas(t.body, v)}` +
    `\n\nArribada: ${day(m.checkin)}${extra.checkin ? `, a partir de les ${extra.checkin}` : ''}\nSortida: ${day(m.checkout)}${extra.checkout ? `, abans de les ${extra.checkout}` : ''}\n${m.nights} nits, ${m.guests} persones\n${pending ? 'Import' : 'Pagat'}: ${euros(amount)}${before ? `\n\nAbans d'arribar:\n${textParas(T.confirm.before, v)}` : ''}${extra.policy ? `\n\nCancel·lació: ${extra.policy}` : ''}\n\nOn som: ${ADDRESS.join(', ')}\n${MAPS}\n\n${textParas(closing, v)}${textFooter}`;
  return { to: m.email, subject: fill(t.subject, v),
    html: layout(env, { preheader: `${stay}, del ${day(m.checkin)} al ${day(m.checkout)}.`, body, image: 'hero-vinyes-cel.jpg' }), text };
}

// To the house: a new booking has come in (the calendar already has it).
export function bookingNotice(env, m, amount, pending = false) {
  const stay = STAYS[m.stay].name;
  const body = label(pending ? 'Reserva pendent del banc' : 'Nova reserva a la web') + h1(esc(stay)) + script(esc(m.name || '')) +
    bookingRows(m, amount, pending ? 'Import' : 'Pagat') +
    rows([['Correu', `<a href="mailto:${esc(m.email)}" style="color:${C.deep}">${esc(m.email)}</a>`], m.phone && ['Telèfon', `<a href="tel:${esc(m.phone.replace(/\s/g, ''))}" style="color:${C.deep}">${esc(m.phone)}</a>`]]) +
    p('Ja és al calendari de l\'allotjament. Respon aquest correu per escriure a l\'hoste.');
  return { to: env.CONTACT_TO || HOUSE, replyTo: m.email, subject: `${pending ? 'Reserva pendent' : 'Nova reserva'}: ${stay}, ${m.checkin} → ${m.checkout} (${m.name})`,
    html: layout(env, { preheader: `${m.name}, ${m.nights} nits, ${euros(amount)}`, body }),
    text: `${stay}\n${m.name} · ${m.email} · ${m.phone}\n${m.checkin} → ${m.checkout}, ${m.nights} nits, ${m.guests} persones\n${euros(amount)}${m.notes ? `\n\n${m.notes}` : ''}` };
}
