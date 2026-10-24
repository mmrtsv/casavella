// GET /api/maite/emails  Every email the house sends, rendered from the real templates with example data, to read in Maite.
// Times and the cancellation policy are today's, so the preview matches what a guest would get now.
import { settings, policyText, addDays, json } from '../../../lib/booking.js';
import { bookingConfirmation, bookingNotice, contactNotice, contactReply, tableConfirmation, tableNotice } from '../../../lib/email.js';

export async function onRequestGet({ env }) {
  const S = await settings(env);
  const today = new Date().toISOString().slice(0, 10), checkin = addDays(today, 21), nights = 3;
  const guest = { name: 'Anna Puig', email: 'anna.puig@example.com', phone: '+34 600 12 34 56' };
  const meta = { stay: 'montserrat', checkin, checkout: addDays(checkin, nights), nights: String(nights), guests: '2', arrival: 'Cap a les 18:00', notes: 'Venim amb un gos petit.', ...guest };
  const amount = Math.round(S.stays.montserrat.base * nights * 100);
  const extra = { checkin: S.rules.checkin, checkout: S.rules.checkout, policy: policyText(S.cancel) };
  const table = { ...guest, date: addDays(today, 5), time: '13:30', people: 4, notes: 'Un dels nens és celíac.', service: S.restaurant.services[0]?.name || 'Dinar', lang: 'ca' };
  const msg = { ...guest, message: 'Hola! Voldríem saber si el mes que ve teniu lloc per a dues persones. Gràcies!' };
  const list = [
    { id: 'confirmed', name: 'Reserva confirmada', for: 'guest', when: "Quan l'hoste paga una reserva a la web i el pagament es confirma.", ...bookingConfirmation(env, meta, amount, false, extra) },
    { id: 'pending', name: 'Reserva rebuda, pendent del banc', for: 'guest', when: "Quan l'hoste paga amb un mètode que el banc confirma més tard.", ...bookingConfirmation(env, meta, amount, true, extra) },
    { id: 'notice', name: 'Avís de nova reserva', for: 'house', when: 'A la Casa Vella, cada vegada que entra una reserva a la web.', ...bookingNotice(env, meta, amount, false) },
    { id: 'notice-pending', name: 'Avís de reserva pendent', for: 'house', when: 'A la Casa Vella, quan entra una reserva que el banc encara ha de confirmar.', ...bookingNotice(env, meta, amount, true) },
    { id: 'table', name: 'Taula reservada', for: 'guest', when: 'Quan algú reserva taula al restaurant des de la web.', ...tableConfirmation(env, table) },
    { id: 'table-notice', name: 'Avís de taula reservada', for: 'house', when: 'A la Casa Vella, cada vegada que es reserva una taula a la web.', ...tableNotice(env, table) },
    { id: 'contact-reply', name: 'Resposta al formulari de contacte', for: 'guest', when: 'A qui escriu des del formulari de contacte de la web.', ...contactReply(env, msg) },
    { id: 'contact-notice', name: 'Missatge del formulari de contacte', for: 'house', when: 'A la Casa Vella, amb el missatge i el correu de qui escriu per respondre directament.', ...contactNotice(env, msg) },
  ];
  return json({ emails: list.map(e => ({ id: e.id, name: e.name, for: e.for, when: e.when, subject: e.subject, html: e.html, text: e.text })) });
}
