// What a template can change without a designer: its photo, from the library below, and the words on it. Plain data, no DOM,
// so /api/maite/social-make can read it too and tell Claude what each template holds.
import type { Template } from './templates';

const S = '/maite/social/';

// The photos the templates can use, with what each shows (for Claude, and the alt of a post made from a prompt)
export const LIBRARY: { src: string; alt: string }[] = [
  ['apt-cuina-detall', 'Ampolla de cava de La Casa Vella i dues copes al taulell de la cuina'],
  ['bedorc-capvespre', 'El Bedorc al capvespre'],
  ['montserrat-vinyes', 'Vinyes amb Montserrat al fons'],
  ['hab-armari', 'Habitació amb armari verd'],
  ['hab-llit', 'Habitació Figarot amb llit de forja'],
  ['mirall', 'Mirall antic al passadís'],
  ['gerro', 'Gerro amb flors seques'],
  ['llibre', 'El llibre de La Casa Vella'],
  ['rotul', 'El rètol de fusta de La Casa Vella sobre la porta vidriera, amb el llum de forja encès'],
  ['rebedor', 'El rebedor'],
  ['escala-entrada', "L'escala d'entrada"],
  ['restaurant-barra', 'La barra del restaurant amb llum càlida'],
  ['rajola-flor', 'Detall de la rajola hidràulica'],
  ['historia-carrer', 'Foto antiga del carrer del Bedorc'],
  ['bedorc', 'El Bedorc entre vinyes'],
].map(([p, alt]) => ({ src: `${S}${p}.jpg`, alt }));

export const inLibrary = (photo: string) => LIBRARY.some(p => p.src === photo);

// The words on a template, in the order they are drawn: one entry per text node that isn't blank. paint() replaces them
// in the same order, so a post can carry its own words (texts[i] for the i-th)
export function textSlots(t: Template): string[] {
  return [...t.html.matchAll(/>([^<]*)</g)].map(m => m[1].trim()).filter(Boolean);
}
