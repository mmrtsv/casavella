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
