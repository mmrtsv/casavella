// Templates at full size: the markup, its variations ("Una altra opció") and a PNG of it at 1080 px wide
import { LIBRARY, inLibrary } from './catalog';
import { TEMPLATES, type Template } from './templates';

export const byId = new Map(TEMPLATES.map(t => [t.id, t]));

const S = '/maite/social/';
const PHOTOS = ['apt-cuina-detall', 'bedorc-capvespre', 'montserrat-vinyes', 'hab-armari', 'mirall', 'gerro', 'llibre', 'rotul', 'rebedor', 'escala-entrada', 'restaurant-barra', 'rajola-flor', 'historia-carrer', 'bedorc'].map(p => `${S}${p}.jpg`);
const QUOTES = [
  ['Murs de pedra originals, un jardí i tranquil·litat en cada racó.', 'viure-la a poc a poc'],
  ['Una casa de poble de 1898, entre vinyes i oliveres.', 'a poc a poc'],
  ['Bigues de fusta, rajola hidràulica i el silenci del poble.', 'restaurada amb cura'],
];
const TAGLINES = ['Entre vinyes i oliveres', 'Casa de poble de 1898', 'A una hora de Barcelona', 'Restaurada a poc a poc'];
const WORDS = ['calma', 'silenci', 'pausa', 'llum', 'descans'];
const DETAIL_LINES = ['Una copa de cava per començar', 'El vi del Penedès, a tocar', 'Petits detalls, temps lent'];
const BIG_WORDS = ['Silenci', 'Calma', 'Pausa', 'Llum', 'Arrels'];
const ROOM_LINES = ['Per despertar-se sense presses', 'Llum de matí i bigues de fusta', 'On el dia comença a poc a poc'];

const photoFor = (t: Template, v: number) => {
  if (!v) return t.photo;
  const list = PHOTOS.filter(p => p !== t.photo);
  return list[(v - 1) % list.length];
};

// How many variations a template has (0: none)
export function variants(t: Template) {
  if (t.id === 'PostQuote') return 6;
  if (t.id === 'PostMenu') return 2;
  if (t.id === 'PostWord') return BIG_WORDS.length;
  return t.photo ? PHOTOS.length : 0;
}

const find = (root: Element, needle: string) => root.querySelector<HTMLElement>(`[style*="${needle}"]`);
const text = (el: HTMLElement | null, s: string) => { if (el) el.textContent = s; };

// Fill host with the template, then apply variation v, the photo (the owner's or one from the library), if any, and the
// post's own words, if it has them (one per text node, as textSlots lists them; a missing one keeps the template's)
export function paint(host: HTMLElement, t: Template, v = 0, photo = '', texts?: string[]) {
  host.innerHTML = t.html;
  const root = host.firstElementChild as HTMLElement | null;
  if (!root) return;
  const img = root.querySelector<HTMLImageElement>('img[data-photo]');
  if (img) img.src = photo || photoFor(t, v);
  if (t.id === 'Main') text(find(root, 'font-size: 26px'), TAGLINES[v % TAGLINES.length]);
  if (t.id === 'PostDetail') text(find(root, 'font-size: 64px'), DETAIL_LINES[v % DETAIL_LINES.length]);
  if (t.id === 'PostWord') text(find(root, 'font-size: 200px'), BIG_WORDS[v % BIG_WORDS.length]);
  if (t.id === 'PostRoom') text(find(root, 'font-size: 22px'), ROOM_LINES[v % ROOM_LINES.length]);
  if (t.id === 'StoryReel') text(find(root, 'Pinyon'), WORDS[v % WORDS.length]);
  if (t.id === 'PostGradient' && v % 2 === 1) {
    root.style.justifyContent = 'flex-start';
    const g = root.children[1] as HTMLElement | undefined;
    if (g) g.style.background = g.style.background.replace('0deg', '180deg');
  }
  if (t.id === 'PostQuote') {
    const cava = v % 2 === 1, q = QUOTES[Math.floor(v / 2) % QUOTES.length];
    text(find(root, 'font-size: 64px'), q[0]);
    const sc = find(root, 'Pinyon');
    if (sc) { sc.textContent = q[1]; sc.style.color = cava ? '#2e6d2e' : '#79a57a'; }
    root.style.background = cava ? '#c6bfaf' : '#1a3f20';
    root.style.color = cava ? '#1a3f20' : '#f3efe4';
    const iso = root.querySelector('img');
    if (iso) iso.src = cava ? '/img/iso-dark.png' : '/img/iso-light.png';
  }
  if (t.id === 'PostMenu' && v % 2 === 1) {
    root.setAttribute('data-v', 'dark');
    root.querySelectorAll('img').forEach(i => { i.src = '/img/iso-light.png'; });
  }
  if (img && inLibrary(photo)) img.alt = LIBRARY.find(p => p.src === photo)!.alt;
  if (texts?.length) {
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let i = 0, n = walk.nextNode(); n; n = walk.nextNode()) {
      if (!n.nodeValue?.trim()) continue;
      if (texts[i] != null) n.nodeValue = texts[i];
      i++;
    }
  }
}

// The words on the image, for the caption prompt
export function onImage(t: Template, v: number, texts?: string[]) {
  const d = document.createElement('div');
  paint(d, t, v, '', texts);
  return (d.textContent || '').replace(/\s+/g, ' ').trim();
}
export function photoAlt(t: Template, v: number, photo: string) {
  if (photo && !inLibrary(photo)) return 'a photo the owner uploaded';
  const d = document.createElement('div');
  paint(d, t, v, photo);
  return d.querySelector('img[data-photo]')?.getAttribute('alt') || 'none, brand colours only';
}

// Brand fonts and the few rules the templates need, once, while Xarxes socials is open
export function loadBrandFonts() {
  if (document.getElementById('social-css')) return;
  const s = document.createElement('style');
  s.id = 'social-css';
  s.textContent = `
@font-face { font-family: "Le Monde Livre"; src: url(/fonts/LeMondeLivreClassic-Normal.otf) format("opentype"); font-display: swap; }
@font-face { font-family: "Halyard Display"; src: url(/fonts/HalyardDisplay.ttf) format("truetype"); font-weight: 300 700; font-display: swap; }
@font-face { font-family: "Pinyon Script"; src: url(${S}PinyonScript.ttf) format("truetype"); font-display: swap; }
.social-art { font-family: "Halyard Display", "Helvetica Neue", Arial, sans-serif; font-size: 15px; line-height: 1.55; letter-spacing: normal; color: #1a3f20; }
.social-art img { display: revert; max-width: none; height: revert; }
.social-art [data-v="dark"] { background: #1a3f20 !important; color: #f3efe4 !important; }
.social-art [data-v="dark"] p, .social-art [data-v="dark"] span { color: #f3efe4 !important; }
.social-art [data-v="dark"] div[style*="height: 1px"] { background: #c6bfaf !important; }`;
  document.head.appendChild(s);
}

const pad = (n: number) => String(n).padStart(2, '0');
export const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const fileName = (t: Template, n?: number) => (n ? pad(n) + '-' : 'la-casa-vella-') + slug(t.title) + '.png';

// Full-size PNG, drawn off screen
export async function png(t: Template, v = 0, photo = '', texts?: string[]): Promise<Blob> {
  const { toBlob } = await import('html-to-image');
  const stage = document.createElement('div');
  stage.className = 'social-art';
  stage.style.cssText = `position: fixed; left: -20000px; top: 0; width: ${t.w}px; height: ${t.h}px; pointer-events: none;`;
  paint(stage, t, v, photo, texts);
  document.body.appendChild(stage);
  try {
    const node = stage.firstElementChild as HTMLElement;
    await Promise.all([...stage.querySelectorAll('img')].map(i => i.decode().catch(() => {})));
    await document.fonts.ready;
    const blob = await toBlob(node, { width: t.w, height: t.h, pixelRatio: 1 });
    if (!blob) throw new Error("No s'ha pogut fer la imatge");
    return blob;
  } finally { stage.remove(); }
}

export function save(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
