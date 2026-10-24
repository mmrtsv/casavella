// Checks that the Android app keeps up with Maite web. Run from the repository root:
//   node android/tools/parity.mjs        (or npm run check)
// It fails when:
// - an endpoint in functions/api/maite/ isn't called by the web or by the app,
// - a page in maite-app/src/pages/ has no screen in the app (ui/Ui.kt, enum Page),
// - a web page has commits newer than the app screens it maps to (below), unless android/parity-skip.txt lists the
//   commit with the reason it needs nothing in the app,
// - the app's copy of the Instagram templates (assets/social) is older than maite-app/src/social/.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '../..');
const KT = path.join(ROOT, 'android/app/src/main/java/com/casavellarural/maite');

// Which app files carry each web page
const SCREENS = {
  Home: ['ui/screens/Home.kt'], Calendar: ['ui/screens/Calendar.kt', 'ui/screens/Forms.kt'],
  Bookings: ['ui/screens/Bookings.kt', 'ui/screens/BookingFile.kt', 'ui/screens/Forms.kt'],
  Prices: ['ui/screens/Settings.kt'], Discounts: ['ui/screens/Settings.kt'], Rules: ['ui/screens/Settings.kt'],
  Stays: ['ui/screens/Stays.kt'], Emails: ['ui/screens/Emails.kt'], Social: ['ui/social/Social.kt', 'ui/social/Renderer.kt'],
  Restaurant: ['ui/screens/Restaurant.kt', 'ui/screens/Forms.kt'],
};

/** A fingerprint of the web's Instagram templates, so a stale copy in the app is caught */
export function socialSource() {
  const dir = path.join(ROOT, 'maite-app/src/social');
  const h = crypto.createHash('sha256');
  for (const f of fs.readdirSync(dir).sort()) h.update(f).update(fs.readFileSync(path.join(dir, f)));
  for (const f of fs.readdirSync(path.join(ROOT, 'maite-app/public/social')).sort()) h.update(f);
  return h.digest('hex').slice(0, 16);
}

const read = dir => fs.readdirSync(dir, { recursive: true }).filter(f => /\.(kt|tsx?)$/.test(f)).map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' }).trim();

function check() {
  const problems = [];
  const app = read(KT), web = read(path.join(ROOT, 'maite-app/src'));

  for (const f of fs.readdirSync(path.join(ROOT, 'functions/api/maite'))) {
    const name = f.replace(/\.js$/, '');
    if (name.startsWith('_')) continue;
    const called = src => new RegExp(`["'\`/]${name}(["'\`?/]|\\$\\{)`).test(src);
    if (!called(app)) problems.push(`The app never calls /api/maite/${name}`);
    if (!called(web)) problems.push(`The web never calls /api/maite/${name}`);
  }

  const pages = fs.readdirSync(path.join(ROOT, 'maite-app/src/pages')).map(f => f.replace(/\.tsx$/, ''));
  const ui = fs.readFileSync(path.join(KT, 'ui/Ui.kt'), 'utf8');
  const skip = fs.existsSync(path.join(ROOT, 'android/parity-skip.txt'))
    ? fs.readFileSync(path.join(ROOT, 'android/parity-skip.txt'), 'utf8').split('\n').map(l => l.trim().split(/\s/)[0]).filter(l => /^[0-9a-f]{7,}$/.test(l)) : [];
  for (const page of pages) {
    if (!new RegExp(`^\\s*${page}\\(`, 'm').test(ui)) { problems.push(`Page ${page} has no screen in the app (ui/Ui.kt)`); continue; }
    const files = SCREENS[page];
    if (!files) { problems.push(`android/tools/parity.mjs doesn't say which app files carry ${page}`); continue; }
    // The app's screen was last changed in this commit; every web change to the page after it still has to come
    const since = git('log', '-1', '--format=%H', '--', ...files.map(f => path.join(KT, f)));
    if (!since) continue;
    const newer = git('log', '--format=%h %s', `${since}..HEAD`, '--', `maite-app/src/pages/${page}.tsx`).split('\n').filter(Boolean)
      .filter(l => !skip.some(s => l.startsWith(s.slice(0, 7))));
    for (const l of newer) problems.push(`${page}: the web changed after the app (${l}). Port it to ${files.join(', ')} or list the commit in android/parity-skip.txt`);
  }

  const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'android/app/src/main/assets/social/templates.json'), 'utf8'));
  if (meta.source !== socialSource()) problems.push('The Instagram templates changed: run node android/tools/social-assets.mjs');
  return problems;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const problems = check();
  if (problems.length) { console.error(problems.map(p => '- ' + p).join('\n')); process.exit(1); }
  console.log('The app has everything the web has.');
}
