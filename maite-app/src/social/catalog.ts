// What a template can change without a designer: its photo, from the library below, and the words on it. Plain data, no DOM,
// so /api/maite/social-make can read it too and tell Claude what each template holds.
import { TEMPLATES, type Template } from './templates';

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

// What a post or story is about, to ask for one (Menú, Habitació, Restaurant…): each topic is a group of templates that fit it,
// and a line that tells Claude what to write about and which photos go with it. Claude picks within it. General is any template
const all = (kind: string) => TEMPLATES.filter(t => t.kind === kind).map(t => t.id);
const TOPICS: { id: string; label: string; about: string; post: string[]; story: string[] }[] = [
  { id: 'menu', label: 'Menú', about: "a menu or a dinner at the restaurant: the dishes, the date and the price the owner gives",
    post: ['PostMenuCover', 'PostAnnounce', 'PostMenu'], story: ['StoryPoster', 'StoryMenu'] },
  { id: 'room', label: 'Habitació', about: 'one of the rooms (habitacions): the bed, the light, waking up slowly. Photos of the rooms and their details',
    post: ['PostRoom', 'PostDetail', 'PostFrame', 'PostDiptych', 'PostTriptych', 'PostArch', 'PostSplit', 'CarouselCover'], story: ['StoryPhoto', 'StoryReel'] },
  { id: 'apartment', label: 'Apartament', about: 'one of the apartments: the kitchen, the living space, staying a few days as at home. Photos of the inside of the house',
    post: ['PostRoom', 'PostDetail', 'PostFrame', 'PostDiptych', 'PostTriptych', 'PostSplit', 'CarouselCover'], story: ['StoryPhoto', 'StoryReel'] },
  { id: 'restaurant', label: 'Restaurant', about: 'the restaurant: a dinner, a date, an evening at the bar, words of a guest. The restaurant photo, unless the owner gives one',
    post: ['PostMenuCover', 'PostAnnounce', 'PostRestaurant', 'PostRestaurantPlain', 'PostMenu', 'PostGuest', 'PostDetail'], story: ['StoryPoster', 'StoryPhoto'] },
  { id: 'surroundings', label: 'Entorn', about: 'El Bedorc and the land around it: the vineyards, the olive groves, Montserrat, the seasons, the history of the village',
    post: ['Main', 'PostGradient', 'PostSeason', 'PostHistory', 'PostArch', 'PostLogo', 'PostWord', 'PostQuote'], story: ['StoryPhoto', 'StoryReel'] },
  { id: 'general', label: 'General', about: '', post: all('post'), story: all('story') },
];
export const STYLES: { id: string; label: string; about: string; kind: 'post' | 'story'; tpls: string[] }[] = (['post', 'story'] as const)
  .flatMap(kind => TOPICS.map(({ post, story, ...t }) => ({ ...t, kind, tpls: kind === 'post' ? post : story })));

// Templates that can open a carousel, and the slides that follow them on Instagram (the menu's cover, then the menu)
export const CAROUSELS: Record<string, string[]> = { PostMenuCover: ['PostMenu'] };
// One slide after the first: a template with its variation, photo and words, as a post has them
export type Slide = { tpl: string; v: number; photo: string; texts?: (string | null)[] };

// A menu made in Xarxes socials > Menús: the cover (photo, the line above the title, the title, the line under it, the days it
// runs) and the menu (its name, the dishes, the drinks and the price). It becomes a carousel, the menu's cover (dates large, no
// price) with the menu after it (the price, and booking on the web), and two stories: the announcement (with the price) and
// the menu. The words go in the templates' text lines, in order (textSlots); an empty one is hidden, null keeps the template's.
// from, until: the first and last day (YYYY-MM-DD); dates is the line written from them (older menus only have that line).
// story: the announcement story's own words, one per line after the first (null follows the menu). image: the menu as a JPEG, for the restaurant's booking page on the web while the menu runs.
// link: the web address on the menu and on the stories (Instagram's API can't add a link sticker)
export type Menu = {
  photo: string; kicker: string; title: string; subtitle: string; dates: string; from: string; until: string; name: string; dishes: string[];
  drinks: string; price: string; link: string; story: (string | null)[]; image: string;
};
export const MENU_DISHES = 4;
export const MENU_EXAMPLE: Menu = {
  photo: '/maite/social/restaurant-barra.jpg', kicker: 'Torna la', title: 'Calçotada', subtitle: 'A la terrassa, cada diumenge', dates: 'Del 18 de gener al 29 de març', from: '', until: '',
  name: 'Menú de calçotada', dishes: ['Calçots a la brasa amb salsa romesco', 'Botifarra i xai a la brasa', 'Mongetes del ganxet', 'Crema catalana'], drinks: 'Vi del Penedès, aigua, cafè', price: '38',
  link: 'www.casavellarural.com', story: [], image: '',
};
// The web address as the menu writes it: without https://, with www.
export const www = (link: string) => { const l = link.trim().replace(/^https?:\/\//, '').replace(/\/$/, '') || 'casavellarural.com'; return /^www\./.test(l) ? l : 'www.' + l; };
// The days a menu runs, as the cover writes them: «Del 18 de gener al 29 de març», «De l'1 d'abril a l'11 de maig», «El 6 de gener»
export function datesText(from: string, until: string) {
  if (!from) return '';
  const d = (x: string) => new Date(x + 'T12:00').toLocaleDateString('ca-ES', { day: 'numeric', month: 'long' }).replace(/’/g, "'");
  const apos = (x: string) => [1, 11].includes(+x.slice(8, 10));
  if (!until || until === from) return (apos(from) ? "L'" : 'El ') + d(from);
  return (apos(from) ? "De l'" : 'Del ') + d(from) + (apos(until) ? " a l'" : ' al ') + d(until);
}
// The menu's words in the templates' lines: the carousel post (cover, then the menu), and the two stories
export function menuSlides(m: Menu): { post: Slide & { slides: Slide[] }; story: Slide; storyMenu: Slide } {
  const price = m.price.trim().replace(/\s*€$/, '');
  const dates = (m.from ? datesText(m.from, m.until) : m.dates).trim();
  const when = [dates, price && `${price} € per persona`].filter(Boolean).join(', ');
  const link = www(m.link);
  const cover = ['La Casa Vella, El Bedorc', m.kicker.trim(), m.title.trim(), dates, m.subtitle.trim()];
  const dishes = Array.from({ length: MENU_DISHES }, (_, i) => (m.dishes[i] || '').trim());
  const menu = [m.subtitle.trim(), m.name.trim(), ...dishes, m.drinks.trim(), price ? `${price}€` : '', 'persona', 'Reserva a', link];
  const story = [m.kicker.trim(), m.title.trim(), m.subtitle.trim(), when, link].map((x, i) => m.story?.[i] ?? x);
  return {
    post: { tpl: 'PostMenuCover', v: 0, photo: m.photo, texts: cover, slides: [{ tpl: 'PostMenu', v: 0, photo: '', texts: menu }] },
    story: { tpl: 'StoryPoster', v: 0, photo: m.photo, texts: ['La Casa Vella, El Bedorc', ...story] },
    storyMenu: { tpl: 'StoryMenu', v: 0, photo: '', texts: menu },
  };
}
// The lines of the announcement story that can be changed, in order (Menu.story)
export const STORY_LINES = ['Damunt del títol', 'Títol', 'Sota el títol', 'Dates i preu', 'Botó'];
// A first caption for the menu, to change before it goes out
export function menuCaption(m: Menu) {
  const price = m.price.trim().replace(/\s*€$/, '');
  const dates = (m.from ? datesText(m.from, m.until) : m.dates).trim();
  return [`${m.kicker.trim()} ${m.title.trim()}`.trim() + '.', [m.subtitle.trim(), dates].filter(Boolean).join('. ') + '.',
    [m.name.trim(), ...m.dishes.map(d => d.trim()).filter(Boolean)].filter(Boolean).join('\n'), price && `${price} € per persona, ${m.drinks.trim() || 'begudes a part'}.`,
    `Reserva a ${www(m.link)}.`]
    .filter(x => x && x !== '.').join('\n\n');
}
