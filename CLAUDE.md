# La Casa Vella

The public web (`index.html`, built to `dist/` by `build.py`), Maite the back office (`maite-app/`), and the Cloudflare Pages Functions behind both (`functions/`, `lib/`). See `README.md` for how each part works and is published.

## Rules

@.claude/rules/writing-style.md
@.claude/rules/ui-no-ai-slop.md

## Maite has two clients

Maite web (`maite-app/`) and the Android app (`android/`) do the same things against the same `/api/maite/*`. A change to one is a change to both, in the same piece of work:

- A feature, a change to a page or a new or changed endpoint in `maite-app/src/pages/`, `functions/api/maite/` or `lib/` gets ported to the app's screen (`android/tools/parity.mjs` maps pages to Kotlin files). A web change the app doesn't need (styling only, a web-only detail) goes in `android/parity-skip.txt` with the reason.
- Changes to `maite-app/src/social/` need `node android/tools/social-assets.mjs`. The logo comes from `android/tools/logo.py`.
- `npm run check` (typecheck and `android/tools/parity.mjs`) must pass. The Stop hook in `.claude/settings.json` runs the parity check.
- Then release the app so the phones get it: raise `versionCode` and `versionName` in `android/app/build.gradle`, `gradle assembleRelease` with the keystore, `node android/tools/release.mjs "what is new"`, `npm run build`, and publish. The app offers the update on Inici. If the keystore isn't available, say so: the web change still ships, and the release waits.
