// Publishes a built APK with Maite, so the phones offer it as an update (data/Update.kt). Run from the repository root
// after `gradle assembleRelease`, then build Maite (npm run build) and publish as usual:
//   node android/tools/release.mjs "What is new, in one or two short sentences"
// The APK and version.json go to maite-app/public/android/, served behind Cloudflare Access at /maite/android/.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const gradle = fs.readFileSync(path.join(ROOT, 'android/app/build.gradle'), 'utf8');
const versionCode = Number(gradle.match(/versionCode (\d+)/)[1]), version = gradle.match(/versionName '([^']+)'/)[1];
const apk = path.join(ROOT, 'android/app/build/outputs/apk/release/app-release.apk');
if (!fs.existsSync(apk)) throw new Error('Build it first: cd android && gradle assembleRelease');
const out = path.join(ROOT, 'maite-app/public/android');
const old = fs.existsSync(path.join(out, 'version.json')) ? JSON.parse(fs.readFileSync(path.join(out, 'version.json'), 'utf8')) : null;
if (old && old.versionCode >= versionCode) throw new Error(`versionCode ${versionCode} is already published: raise it in android/app/build.gradle`);
fs.mkdirSync(out, { recursive: true });
fs.copyFileSync(apk, path.join(out, 'Maite.apk'));
fs.writeFileSync(path.join(out, 'version.json'), JSON.stringify({ versionCode, version, notes: process.argv[2] || '' }, null, 2) + '\n');
console.log(`Maite ${version} (${versionCode}) ready in maite-app/public/android/`);
