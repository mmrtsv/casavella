// Labels and messages, as in the previous Maite
import type { Booking, Kind, Policy } from './types';
import { TODAY } from './dates';

export const KIND: Record<Kind, string> = { paid: 'Pagada a la web', pending: 'Pendent del banc', manual: 'Reserva directa', block: 'Tancat', cancelled: 'Cancel·lada', refunded: 'Reemborsada', other: 'Google Calendar' };
export const SOURCE: Record<string, string> = { web: 'Web', phone: 'Telèfon', whatsapp: 'WhatsApp', email: 'Correu', door: 'En persona', other: 'Altres' };
export const METHOD: Record<string, string> = { cash: 'Efectiu', transfer: 'Transferència', bizum: 'Bizum', card: 'Targeta (TPV)', other: 'Altres' };
export const PAYTYPE: Record<string, string> = { card: 'Targeta', sepa_debit: 'Domiciliació SEPA', customer_balance: 'Transferència', bancontact: 'Bancontact', ideal: 'iDEAL', paypal: 'PayPal', klarna: 'Klarna', link: 'Link', revolut_pay: 'Revolut Pay', amazon_pay: 'Amazon Pay', sofort: 'Sofort', giropay: 'Giropay', eps: 'EPS', p24: 'Przelewy24' };
export const WALLET: Record<string, string> = { apple_pay: 'Apple Pay', google_pay: 'Google Pay', samsung_pay: 'Samsung Pay', link: 'Link' };
export const ERRORS: Record<string, string> = {
  unavailable: 'Aquestes nits ja estan ocupades', dates: 'Revisa les dates', name: 'Falta el nom', stay: 'Tria un allotjament',
  amount: "L'import no és vàlid", rules: 'Revisa les normes: algun valor no és vàlid', cancel: 'Revisa la política: els dies del retorn parcial han de ser menys que els del retorn complet',
  min: "Revisa l'estada mínima", max: 'Revisa la capacitat', photos: 'Cal almenys una foto', type: "Aquest format d'imatge no es pot pujar", size: 'La foto és massa gran',
  pending: 'El banc encara no ha confirmat aquest pagament. Espera que es confirmi per cancel·lar-la.',
  refund_amount: 'No es pot retornar més del que es va pagar', not_configured: 'Aquest allotjament no té el calendari connectat',
  no_payment: 'No trobo el pagament a Stripe', access: 'La sessió ha caducat. Torna a carregar la pàgina.',
  discount: 'Revisa els descomptes: de 2 nits en amunt, entre 1 i 90 %, sense repetir nits', price: 'Revisa els preus', email: 'Revisa el correu',
  doc_type: 'Només es poden pujar fotos (JPG, PNG, HEIC) o PDF', doc_size: 'El document és massa gran (màxim 15 MB)',
  docs_not_configured: 'Falta connectar la carpeta de Google Drive dels documents', drive: 'Google Drive no ha deixat desar el document',
};

export const hasDocs = (b: Booking) => b.docs && !!b.docsFolder;
export const isBooking = (b: Booking) => b.kind === 'paid' || b.kind === 'pending' || b.kind === 'manual';
export const atHome = (b: Booking) => !!b.checkin && !b.checkout;
export const who = (b: Booking) => b.kind === 'block' ? (b.title || 'Tancat') : b.kind === 'other' ? b.title : (b.name || b.title);

export interface Check { k: 'pay' | 'email' | 'phone' | 'docs' | 'checkin' | 'checkout'; label: string; ok: boolean }
export function checklist(b: Booking): Check[] {
  return [
    { k: 'pay', label: 'Pagament', ok: b.kind === 'paid' || (b.kind === 'manual' && b.settled) },
    { k: 'email', label: 'Correu', ok: !!b.email },
    { k: 'phone', label: 'Telèfon', ok: !!b.phone },
    // Only an upload counts: the server ticks it once a file is in the booking's Drive folder
    { k: 'docs', label: 'Documents', ok: hasDocs(b) },
    { k: 'checkin', label: 'Check-in', ok: !!b.checkin },
    { k: 'checkout', label: 'Check-out', ok: !!b.checkout },
  ];
}
// What already matters: the paperwork always, the check-in from arrival day, the check-out from departure day.
// Progress counts only these (plus anything already done), so a check-out that is not due yet never shows as pending.
export function dueList(b: Booking) {
  const due: Record<Check['k'], boolean> = { pay: true, email: true, phone: true, docs: true, checkin: b.first <= TODAY, checkout: b.until <= TODAY };
  return checklist(b).filter(c => c.ok || due[c.k]);
}
export const missing = (b: Booking) => dueList(b).filter(c => !c.ok);

// Cancellation policy (same rules as lib/booking.js)
export function policyText(c: Policy) {
  const days = (n: number) => n === 1 ? '1 dia' : `${n} dies`;
  if (c.fullDays == null && !c.partialPct) return "No es retorna l'import si es cancel·la.";
  const out: string[] = [];
  if (c.fullDays != null) out.push(c.fullDays === 0 ? 'Cancel·lació gratuïta fins al dia abans del check-in' : `Cancel·lació gratuïta fins a ${days(c.fullDays)} abans del check-in`);
  if (c.partialPct && c.partialDays != null) out.push(`es retorna el ${c.partialPct} % fins a ${c.partialDays === 0 ? 'el check-in' : days(c.partialDays) + ' abans'}`);
  return out.join('; ') + '. Després no es retorna res.';
}
export function refundDue(c: Policy, paid: number, before: number) {
  if (c.fullDays != null && before >= c.fullDays) return paid;
  if (c.partialPct && c.partialDays != null && before >= c.partialDays) return Math.round(paid * c.partialPct / 100);
  return 0;
}
