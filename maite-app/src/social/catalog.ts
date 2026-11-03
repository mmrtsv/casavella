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
  ['hab-llit', 'Habitació amb llit de forja'],
  ['figarot-llit', 'Habitació Figarot: llit de forja, coixins verds i quatre quadres de branques a la paret'],
  ['figarot-balco', "Habitació Figarot: l'escriptori al costat del balcó obert al carrer"],
  ['vinyes-llit-finestra', 'Habitació Les Vinyes: el llit amb el cobrellit verd, la finestra i el llum de vímet'],
  ['vinyes-habitacio-2', 'Habitació Les Vinyes: el llit, la finestra i el llum de vímet amb la llum del matí'],
  ['figarot-sol', 'Habitació Figarot: el sol sobre el llit de forja'],
  ['vinyes-habitacio', 'Habitació Les Vinyes sencera, amb el bany al fons'],
  ['vinyes-balco', 'Habitació Les Vinyes: el llit verd i el balcó obert sobre les teulades, amb el sol entrant'],
  ['vinyes-entrada', "Habitació Les Vinyes des de l'entrada: el penjador de ferro, el bany i el llit verd"],
  ['vinyes-tauleta', 'Habitació Les Vinyes: la tauleta blava amb el llum encès i les tovalloles sobre el llit verd'],
  ['vinyes-escriptori', "Habitació Les Vinyes: una rosa vermella en un gerro i el llum de bombeta a l'escriptori"],
  ['vinyes-mirall', 'Habitació Les Vinyes: el mirall rodó del bany, amb el llum reflectit'],
  ['figarot-capcal', 'Habitació Figarot: el capçal de forja, els coixins verds i els quadres de branques'],
  ['figarot-tauleta', 'Habitació Figarot: la tauleta de forja amb el llum verd i una ampolla de cava'],
  ['figarot-placa', 'Habitació Figarot: la placa amb la figuera i el nom, en un marc de fusta'],
  ['figarot-rajola', 'Habitació Figarot: el terra hidràulic amb la llum de la finestra'],
  ['apt-cuina-2', "Cuina de l'apartament amb bigues verdes i terra hidràulic"],
  ['apt-cuina-4', "Cuina de l'apartament: la pica, la campana i el llum encès sobre el taulell de fusta"],
  ['apt-rajola', "El terra hidràulic de l'apartament, amb estrelles grises"],
  ['apt-dormitori-2', "Dormitori de l'apartament: el llit amb tovalloles i els llums de les tauletes encesos"],
  ['apt-tovalloles', "Tovalloles enrotllades amb una flor sobre el llit de l'apartament"],
  ['terrassa', 'La terrassa: taula i cadires blanques al costat de la casa'],
  ['terrassa-taula', 'La terrassa: una taula blanca amb una planta, davant la tanca de fusta'],
  ['mirall', 'Mirall antic al passadís'],
  ['gerro', 'Gerro amb flors seques'],
  ['llibre', 'El llibre de La Casa Vella'],
  ['rotul', 'El rètol de fusta de La Casa Vella sobre la porta vidriera, amb el llum de forja encès'],
  ['rebedor', 'El rebedor'],
  ['escala-entrada', "L'escala d'entrada"],
  ['escala-llibres', "Llibres antics a l'escala, amb el de La Casa Vella"],
  ['escala-barometre', "Baròmetre antic de fusta a l'escala"],
  ['escala-barometre-2', "El baròmetre antic a la paret, vist des de l'escala"],
  ['escala-llibres-2', "Els llibres antics de l'escala, il·luminats per sota"],
  ['escala-diploma', "Un diploma antic emmarcat a l'escala i, a sota, una foto de la casa"],
  ['escala-fotos', "La paret de l'escala amb fotos antigues del poble, en blanc i negre"],
  ['restaurant-barra', 'La barra del restaurant amb llum càlida'],
  ['restaurant-sala', 'La sala del restaurant: columna de pedra, bigues de fusta i taules per a dos'],
  ['restaurant-vins', 'Ampolles de vi al prestatge del restaurant'],
  ['restaurant-oli', "Una mà tira oli d'herbes sobre un plat de peix blau amb olives"],
  ['restaurant-plat-2', "Plat de peix blau amb olives, cogombrets i oli d'herbes, sobre la taula de fusta"],
  ['restaurant-postres', 'Crema de xocolata amb fruits secs en una copa de vidre tallat, sobre la barra de fusta'],
  ['restaurant-xocolata', 'La xocolata cau de la cullera a una copa de vidre tallat'],
  ['restaurant-llar', 'La llar de foc de pedra de la sala del restaurant, amb una guitarra a la paret'],
  ['restaurant-guitarra', 'Una guitarra penjada a la paret del restaurant i un gerro amb buguenvíl·lia'],
  ['restaurant-targeta', "La targeta de La Casa Vella sobre un tros d'escorça, a la taula del restaurant"],
  ['rajola-flor', 'Detall de la rajola hidràulica'],
  ['historia-carrer', 'Foto antiga del carrer del Bedorc'],
  ['bedorc', 'El Bedorc entre vinyes'],
  ['escala-barometre-bn', "El baròmetre de fusta tallada de l'escala, en blanc i negre"],
  ['escala-finestreta', "La finestreta de l'escala, amb una pedra daurada i un salt d'aigua al fons"],
  ['rajola-parquet', 'Rajola hidràulica gris i blanca tocant al parquet'],
  ['restaurant-fulla', 'La planta de ferro verd a la paret del restaurant'],
  ['restaurant-passadis', 'El passadís que porta a la sala del restaurant'],
  ['restaurant-barra-bn', 'El frontal de la barra, de rajola en relleu, en blanc i negre'],
  ['restaurant-sala-3', 'La sala del restaurant amb el ventilador de fusta i els llums de vímet'],
  ['restaurant-llum', 'Un llum de vímet encès sobre les taules del restaurant'],
  ['restaurant-sala-barra', 'La sala del restaurant des de la barra, amb els llums de vímet'],
  ['restaurant-taules', 'Taules de fusta sota els llums negres, amb les ampolles de vi al prestatge'],
  ['restaurant-test', 'Un test amb La Casa Vella escrit a mà i una planta, sobre una taula'],
  ['restaurant-tamboret', 'Un tamboret de pell a la barra de rajola en relleu'],
].map(([p, alt]) => ({ src: `${S}${p}.jpg`, alt }));

export const inLibrary = (photo: string) => LIBRARY.some(p => p.src === photo);

// The photos a menu's cover can use: the restaurant, its dishes, the terrace and the land around. No rooms or apartments
export const MENU_PHOTOS: string[] = ['restaurant-sala', 'restaurant-barra', 'restaurant-llar', 'restaurant-oli', 'restaurant-plat-2', 'restaurant-postres',
  'restaurant-xocolata', 'restaurant-guitarra', 'restaurant-vins', 'restaurant-targeta',
  'restaurant-fulla', 'restaurant-passadis', 'restaurant-barra-bn', 'restaurant-sala-3', 'restaurant-llum', 'restaurant-sala-barra', 'restaurant-taules', 'restaurant-test', 'restaurant-tamboret', 'terrassa', 'rotul', 'bedorc-capvespre', 'montserrat-vinyes', 'bedorc'].map(p => `${S}${p}.jpg`);
// The menu's styles (Menu.look): the variation of the menu slide and the menu story, as paint() draws them
export const MENU_LOOKS = ['Fons cava', 'Fons verd fosc', 'Fons paper', 'Fons verd'];

// The words on a template, in the order they are drawn: one entry per text node that isn't blank. paint() replaces them
// in the same order, so a post can carry its own words (texts[i] for the i-th)
export function textSlots(t: Template): string[] {
  return [...t.html.matchAll(/>([^<]*)</g)].map(m => m[1].trim()).filter(Boolean);
}

// What a post or story is about, to ask for one (Menú, Habitació, Restaurant…): each topic is a group of templates that fit it,
// and a line that tells Claude what to write about and which photos go with it. Claude picks within it. General is any template
const all = (kind: string) => TEMPLATES.filter(t => t.kind === kind).map(t => t.id);
const TOPICS: { id: string; label: string; about: string; post: string[]; story: string[] }[] = [
  { id: 'menu', label: 'Menú', about: "a menu or a dinner at the restaurant: the dishes, the date and the price the owner gives. Photos of the restaurant, its dishes, the terrace or the land around, never the rooms",
    post: ['PostMenuCover', 'PostAnnounce', 'PostMenu'], story: ['StoryPoster', 'StoryMenu'] },
  { id: 'room', label: 'Habitació', about: 'one of the rooms (habitacions): the bed, the light, waking up slowly. Photos of the rooms and their details',
    post: ['PostRoom', 'PostDetail', 'PostFrame', 'PostDiptych', 'PostTriptych', 'PostArch', 'PostSplit', 'CarouselCover'], story: ['StoryPhoto', 'StoryReel'] },
  { id: 'apartment', label: 'Apartament', about: 'one of the apartments: the kitchen, the living space, staying a few days as at home. Photos of the inside of the house',
    post: ['PostRoom', 'PostDetail', 'PostFrame', 'PostDiptych', 'PostTriptych', 'PostSplit', 'CarouselCover'], story: ['StoryPhoto', 'StoryReel'] },
  { id: 'restaurant', label: 'Restaurant', about: 'the restaurant: a dinner, a date, an evening at the bar, words of a guest. The restaurant photos (the bar, the dining room, the dishes), unless the owner gives one',
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
// look: the menu's style (MENU_LOOKS), the variation of its slide and its story (older menus have none: Fons cava).
// link: the web address on the menu and on the stories (Instagram's API can't add a link sticker: see storyLink)
// services: the moments it is served, each a day and a time ('2026-12-31T21:00'); saving opens the restaurant then, and from and
// until follow them (older menus have no services). promo: when its promo starts ('2026-11-20T19:00', Barcelona), which the
// stories after it count from even when the post isn't programmed ('' for later)
export type Menu = {
  photo: string; kicker: string; title: string; subtitle: string; dates: string; from: string; until: string; name: string; dishes: string[];
  drinks: string; price: string; link: string; story: (string | null)[]; image: string; services?: string[]; promo?: string; look?: number;
};
export const MENU_DISHES = 4;
export const MENU_EXAMPLE: Menu = {
  photo: '/maite/social/restaurant-barra.jpg', kicker: 'Torna la', title: 'Calçotada', subtitle: 'A la terrassa, cada diumenge', dates: 'Del 18 de gener al 29 de març', from: '', until: '',
  name: 'Menú de calçotada', dishes: ['Calçots a la brasa amb salsa romesco', 'Botifarra i xai a la brasa', 'Mongetes del ganxet', 'Crema catalana'], drinks: 'Vi del Penedès, aigua, cafè', price: '38',
  link: 'www.casavellarural.com', story: [], image: '', look: 0,
};
// A new menu: the example with the cover photo and the style used least by the menus already made, a random one of those
// when several are, so two menus in a row don't look the same
export function freshMenu(made: { photo?: string; look?: number }[]): Menu {
  const least = <T,>(all: T[], used: T[]) => {
    const n = (x: T) => used.filter(u => u === x).length, min = Math.min(...all.map(n)), ok = all.filter(x => n(x) === min);
    return ok[Math.floor(Math.random() * ok.length)];
  };
  return { ...MENU_EXAMPLE, photo: least(MENU_PHOTOS, made.map(m => m.photo || '')), look: least(MENU_LOOKS.map((_, i) => i), made.map(m => m.look || 0)) };
}
// The web address as the menu writes it: without https://, with www.
export const www = (link: string) => { const l = link.trim().replace(/^https?:\/\//, '').replace(/\/$/, '') || 'casavellarural.com'; return /^www\./.test(l) ? l : 'www.' + l; };
// The stories write the web's name, and the link to book a table goes in Instagram's link sticker (storyLink), which
// Maite can't add itself; a menu with its own address writes that one
export const storyText = (link: string) => { const l = www(link); return l === 'www.casavellarural.com' ? 'casavellarural.com' : l; };
// The link for a story's sticker: a menu's stories go to the table booking page, any other story to the web
export const storyLink = (menu: boolean) => menu ? 'https://www.casavellarural.com/#taula' : 'https://www.casavellarural.com';
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
  const menu = [m.subtitle.trim(), m.name.trim(), ...dishes, m.drinks.trim(), price ? `${price} €` : '', 'per persona', 'Reserva a', link];
  const story = [m.kicker.trim(), m.title.trim(), m.subtitle.trim(), when, storyText(m.link)].map((x, i) => m.story?.[i] ?? x);
  const v = m.look || 0;
  return {
    post: { tpl: 'PostMenuCover', v: 0, photo: m.photo, texts: cover, slides: [{ tpl: 'PostMenu', v, photo: '', texts: menu }] },
    story: { tpl: 'StoryPoster', v: 0, photo: m.photo, texts: ['La Casa Vella, El Bedorc', ...story] },
    storyMenu: { tpl: 'StoryMenu', v, photo: '', texts: [...menu.slice(0, -1), storyText(m.link)] },
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

// ---------- A menu's reminders ----------
// One set of rules for the stories and posts that follow a menu: lib/plan.js plans them, and Restaurant › Menús › Publica
// shows them before the menu is saved, so what the owner reads is what Maite does.
// A service: a day and a time ('2026-12-31T21:00'), with its seats and the ones taken when known
export type MenuService = { at: string; seats?: number; taken?: number };
export type MenuReminder = { day: string; time: string; kind: 'story' | 'post'; variant: 'poster' | 'menu' | 'announce'; k: number; svc: MenuService };
const dayPlus = (d: string, n: number) => new Date(Date.parse(d + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const fillOf = (s: MenuService) => s.seats ? (s.taken || 0) / s.seats : 0;
// The last week before a service, from the share of seats taken: [days before, time, kind, variant]. Not at the weekly
// plan's own times (20:30, 13:00…), so a day can have both
export function lastWeek(fill: number, serviceTime: string): [number, string, 'story' | 'post', 'poster' | 'menu' | 'announce'][] {
  const out: [number, string, 'story' | 'post', 'poster' | 'menu' | 'announce'][] = [];
  if (fill >= 1) return out;
  if (fill < 0.8) out.push([7, '21:15', 'story', 'poster'], [5, '21:15', 'story', 'menu'], [3, '21:15', 'story', 'poster']);
  if (fill < 0.5) out.push([4, '19:45', 'post', 'announce']);
  if (fill < 0.9) out.push([2, '21:15', 'story', 'menu'], [1, '21:15', 'story', 'poster']);
  if (fill < 0.6) out.push([1, '13:45', 'story', 'menu']);
  if (fill < 0.9 && serviceTime >= '17:00') out.push([0, '12:30', 'story', 'poster']);
  return out;
}
// The reminders of one menu on the days [from, to), before the limits (capReminders). start: when its promo starts
// ('2026-11-20T19:00', Barcelona; '' for none yet, and then there are none). From the day after it until the last week before
// a service: a story every three days at 21:15, the poster and the menu in turn, for the next service while it is less than
// 80% full. Then the last week's (lastWeek), from 12 hours after the start.
export function menuReminders(services: MenuService[], start: string, from: string, to: string): MenuReminder[] {
  const out: MenuReminder[] = [];
  if (!start) return out;
  const svcs = [...services].sort((a, b) => a.at.localeCompare(b.at));
  for (let day = dayPlus(start.slice(0, 10), 1), i = 0; day < to; day = dayPlus(day, 3), i++) {
    const svc = svcs.find(o => o.at.slice(0, 10) >= day);
    if (!svc) break;
    const k = Math.round((Date.parse(svc.at.slice(0, 10)) - Date.parse(day)) / 864e5);
    if (day < from || k <= 7 || fillOf(svc) >= 0.8) continue;
    out.push({ day, time: '21:15', kind: 'story', variant: i % 2 ? 'menu' : 'poster', k, svc });
  }
  const after = Date.parse(start.slice(0, 16) + ':00Z') + 12 * 3600e3;
  for (const svc of svcs) {
    for (const [k, time, kind, variant] of lastWeek(fillOf(svc), svc.at.slice(11, 16))) {
      const day = dayPlus(svc.at.slice(0, 10), -k);
      if (day < from || day >= to || Date.parse(`${day}T${time}:00Z`) < after) continue;
      out.push({ day, time, kind, variant, k, svc });
    }
  }
  return out;
}
// At most two stories a day, one feed post every four days and one reminder at a time, the nearest service first
export function capReminders<T extends MenuReminder>(list: T[]): T[] {
  const sorted = [...list].sort((a, b) => a.k - b.k || a.svc.at.localeCompare(b.svc.at));
  const perDay: Record<string, number> = {}, posts: string[] = [], keep: T[] = [];
  for (const w of sorted) {
    if (keep.some(x => x.day === w.day && x.time === w.time)) continue;
    if (w.kind === 'post') { if (posts.some(d => Math.abs(Date.parse(d) - Date.parse(w.day)) < 4 * 864e5)) continue; posts.push(w.day); }
    else if ((perDay[w.day] = (perDay[w.day] || 0) + 1) > 2) continue;
    keep.push(w);
  }
  return keep.sort((a, b) => (a.day + a.time).localeCompare(b.day + b.time));
}
