// Copies Maite's Instagram templates into the Android app: the drawing code (maite-app/src/social, bundled for a web view),
// the list of templates with their variations, and the fonts and photos they use. Run from the repository root:
//   node android/tools/social-assets.mjs
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'rolldown';
import { socialSource } from './parity.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT = path.join(ROOT, 'android/app/src/main/assets/social');
fs.mkdirSync(OUT, { recursive: true });
const entry = path.join(OUT, '.entry.ts');
fs.writeFileSync(entry, `export { paint, variants, fields, onImage, photoAlt, loadBrandFonts, byId } from '${ROOT}/maite-app/src/social/paint';\nexport { TEMPLATES, PROFILE_HEAD, COPIES } from '${ROOT}/maite-app/src/social/templates';\nexport { STYLES, CAROUSELS, LIBRARY, MENU_EXAMPLE, MENU_DISHES } from '${ROOT}/maite-app/src/social/catalog';\n`);

// For the web view: one script that sets window.MaiteSocial
await build({ input: entry, external: ['html-to-image'], output: { file: path.join(OUT, 'social.js'), format: 'iife', name: 'MaiteSocial', minify: true }, logLevel: 'silent' });
// For this script: the same code as a module, to read the templates and their variations
const tmp = path.join(OUT, '.social.mjs');
await build({ input: entry, external: ['html-to-image'], output: { file: tmp, format: 'esm' }, logLevel: 'silent' });
const S = await import(tmp);
fs.rmSync(tmp); fs.rmSync(entry);

const meta = {
  templates: S.TEMPLATES.map(t => ({ id: t.id, title: t.title, desc: t.desc, w: t.w, h: t.h, kind: t.kind, photo: t.photo, variants: S.variants(t) })),
  copies: S.COPIES,
  // What a post is about, to ask Claude for one (Menú, Habitació, Restaurant…)
  styles: S.STYLES,
  // The templates that can open a carousel, and the slides after them
  carousels: S.CAROUSELS,
  // The photos to choose from, and the menu Menús starts from (the app writes the menu's words as catalog.ts menuSlides does)
  library: S.LIBRARY,
  menu: { example: S.MENU_EXAMPLE, dishes: S.MENU_DISHES },
  // What this copy was made from: android/tools/parity.mjs compares it with the web's templates
  source: socialSource(),
};
fs.writeFileSync(path.join(OUT, 'templates.json'), JSON.stringify(meta));

// Files the templates load: fonts, photos, logo and isotype (the web view gets them from here, not the network)
const files = path.join(OUT, 'files'); fs.mkdirSync(files, { recursive: true });
const copy = (from) => fs.copyFileSync(from, path.join(files, path.basename(from)));
for (const f of ['HalyardDisplay.ttf', 'LeMondeLivreClassic-Normal.otf']) copy(path.join(ROOT, 'fonts', f));
for (const f of fs.readdirSync(path.join(ROOT, 'maite-app/public/social'))) copy(path.join(ROOT, 'maite-app/public/social', f));
for (const f of ['logo-light.png', 'logo-dark.png', 'iso-light.png', 'iso-dark.png']) copy(path.join(ROOT, 'img', f));
console.log(meta.templates.length, 'templates,', fs.readdirSync(files).length, 'files,', Math.round(fs.statSync(path.join(OUT, 'social.js')).size / 1024), 'KB of script');
