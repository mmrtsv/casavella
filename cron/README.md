# Cron

Un Worker de Cloudflare que cada 5 minuts demana a la web que publiqui els posts d'Instagram programats a Maite que ja toquen (`functions/api/social-cron.js`). Les Pages Functions no tenen horari propi; aquest Worker els el dona.

Mentre no estigui en marxa, els posts programats es publiquen igualment la primera vegada que algú obre Xarxes socials a Maite després de l'hora.

## Posar-lo en marxa

1. Inventa un secret llarg (per exemple, `openssl rand -hex 32`).
2. Cloudflare Pages → el projecte → Settings → Variables and secrets: afegeix `SOCIAL_CRON_SECRET` amb aquest valor i torna a desplegar.
3. Des d'aquesta carpeta:

   ```bash
   npx wrangler deploy
   npx wrangler secret put SOCIAL_CRON_SECRET
   ```

   i enganxa el mateix valor. Si la web no és a `https://casavellarural.com`, afegeix també la variable `SITE_URL` al Worker.

## Límit de consultes a Google (ressenyes)

El mateix Worker té el Durable Object `PlacesBudget`, que compta les consultes a la Places API de `functions/api/reviews.js` (30 al dia i 900 al mes per defecte) atenent-les d'una en una. `npx wrangler deploy` el crea. Després, al projecte de Pages: Settings → Bindings → Durable Object, amb el nom de variable `PLACES_BUDGET`, el Worker `casavella-cron` i la classe `PlacesBudget`, i tornar a desplegar. Sense aquest lligam, les ressenyes no consulten Google.
