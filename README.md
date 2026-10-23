# La Casa Vella

Web de La Casa Vella, casa de poble familiar al Bedorc (1898): allotjaments, restaurant, història, entorn i contacte.

## Estructura

| Ruta | Què és |
| --- | --- |
| `index.html` | Versió de treball. Conté tota la pàgina (HTML, CSS i JavaScript) i les eines de revisió: el selector de propostes, la vista mòbil (tecla M) i la franja d'esborrany. |
| `build.py` | Genera la versió per al domini a `dist/`. |
| `dist/` | Versió per publicar: document HTML complet, etiquetes per a Google i xarxes, sense les eines de revisió. |
| `maite-app/` | Maite, el back office (React, Vite, HeroUI). Es construeix a `dist/maite/` (vegeu més avall). Com està fet i quines llibreries fa servir: `maite-app/README.md`. |
| `android/` | Maite per a Android: app nativa (Compose) amb tot el que fa la web, per instal·lar a mà (vegeu `android/README.md`). |
| `lib/` | Lògica compartida de les funcions: reserves i preus (`booking.js`), Maite (`maite.js`) i contingut dels allotjaments (`stays.js`). |
| `cron/` | Un Worker de Cloudflare que cada 5 minuts publica els posts d'Instagram programats (vegeu `cron/README.md`). |
| `img/` | Fotos, logo, isotip i plaques dels allotjaments. |
| `fonts/` | Tipografies de marca: Le Monde Livre i Halyard Display. |

És HTML pla, sense framework ni dependències.

## Actualitzar la web

1. Edita `index.html`.
2. Regenera la versió publicable:

   ```bash
   npm install
   npm run build:site
   ```

   Fa `python3 build.py https://casavellarural.com` i després construeix Maite a `dist/maite/` (`npm run build` només refà Maite). L'URL és opcional. Serveix per a l'enllaç canònic i la imatge que es veu quan es comparteix la web.
3. Fes commit dels canvis, inclosa la carpeta `dist/`, i puja'ls.

## Publicar a Cloudflare Pages

1. Cloudflare → Workers & Pages → Create → Pages → Connect to Git, i tria aquest repositori.
2. Build command: buit. Build output directory: `dist`.
3. Custom domains → afegeix el domini. Si el domini ja és a Cloudflare, el DNS i l'HTTPS es configuren sols.

Cada push a `main` publica la web de nou.

## Reserves (Stripe + Google Calendar)

El formulari calcula el preu (per defecte habitació 70 €, apartament 90 € la nit; 5 % de descompte per a 2 nits i 10 % a partir de 3; tot es canvia des de Maite) i obre el pagament de Stripe. Ho fan les funcions de `functions/api/` (Cloudflare Pages Functions), amb la lògica compartida a `lib/booking.js`:

- `quote`, `search`, `busy`: preu i disponibilitat (un allotjament o tots; nits ocupades per al calendari).
- `checkout`: comprova el calendari i obre el pagament de Stripe integrat a la pàgina de reserva. No bloqueja res fins que es paga.
- `stripe-webhook`: quan es completa el pagament, escriu la reserva al calendari de l'allotjament. Si mentrestant algú altre ha pagat les mateixes dates, retorna els diners.
- `release`: tanca la sessió de pagament si l'hoste canvia les dades o marxa.
- `status`: diu a la pàgina de tornada si el pagament s'ha completat.
- `settings`: preus, descomptes, normes i política de cancel·lació desats a Maite, perquè la pàgina mostri els actuals.

Cada allotjament té un Google Calendar a info@casavellarural.com, compartit amb un compte de servei de Google. Qualsevol esdeveniment al calendari d'un allotjament bloqueja aquelles nits, sigui quin sigui el títol (els marcats com a «Disponible» no). Per bloquejar dates a mà, n'hi ha prou amb crear-hi un esdeveniment.

Variables a Cloudflare Pages (Settings → Variables and secrets): `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `GOOGLE_SA_EMAIL`, `GOOGLE_SA_KEY`, `CAL_MONTSERRAT`, `CAL_LA_PINEDA`, `CAL_LES_VINYES`, `CAL_FIGAROT`, `SITE_URL`. Mentre no hi siguin, el formulari mostra el preu i remet al telèfon i al WhatsApp.

## Correus (Resend)

`lib/email.js` té les plantilles, amb els colors i la tipografia de la marca, i les envia amb [Resend](https://resend.com) (pla gratuït: 100 correus al dia).

- Formulari de contacte (`functions/api/contact.js`): el missatge arriba a info@casavellarural.com (respondre'l li arriba a l'hoste) i l'hoste rep una còpia. Mentre no hi hagi clau, el botó obre el correu de l'hoste amb el missatge ja escrit.
- Reserva (`functions/api/stripe-webhook.js`): quan el pagament es completa, l'hoste rep la confirmació i la casa un avís amb les dades. Si el banc encara ha de confirmar el pagament, s'envia «reserva rebuda» i, quan es cobra, la confirmació.

Per activar-ho: compte a Resend amb info@casavellarural.com → Domains → afegir casavellarural.com (amb Cloudflare, el botó «Auto configure» hi posa els registres DNS) → API Keys → crear una clau amb permís d'enviament → a Cloudflare Pages, variable `RESEND_API_KEY`. Opcionals: `CONTACT_TO` (per defecte info@casavellarural.com) i `CONTACT_FROM` (per defecte `La Casa Vella <info@casavellarural.com>`).

## Maite (back office)

Maite és el back office, a `maite.casavellarural.com`. Surt del mateix projecte de Cloudflare Pages: `functions/_middleware.js` mira el domini i, a `maite.`, serveix `dist/maite/` i les funcions de `functions/api/maite/` (amb la lògica a `lib/maite.js`). Des de qualsevol altre domini, aquestes rutes donen 404.

- **Calendari**: un mes amb una fila per allotjament. Es toca la primera nit i l'última per tancar dates o afegir una reserva. Tocant una reserva se'n veuen els detalls.
- **Reserves**: avui (qui arriba, qui hi és i qui marxa), properes, passades, cancel·lades i tancaments, amb cercador i un resum dels pròxims 30 dies.
- **Llista de cada reserva**: pagament (per a les de la web, el mètode que diu Stripe: targeta i últimes xifres, Apple Pay, transferència…, i el rebut; per a les directes, si està cobrada i com), correu, telèfon, documents d'identitat, registre de viatgers als Mossos, entrada i sortida (amb l'hora en què es marquen) i una nota interna. Les targetes de la llista diuen què falta.
- **Reserves directes** (telèfon, WhatsApp, en persona): s'escriuen al calendari de l'allotjament i bloquegen les nits a la web. Proposa el preu de la web, però es pot canviar.
- **Cancel·lar**: la reserva queda al calendari com a «CANCEL·LADA» i les nits queden lliures. Si es va pagar a la web, es pot retornar tot o una part per Stripe. Les que esperen la confirmació del banc no es poden cancel·lar fins que arriba.
- **Tancar dates**: un o més allotjaments, o tota la casa. Si alguna nit ja està ocupada, no es tanca res.
- **Preus**: un calendari per allotjament amb el preu de cada nit. A la dreta, el preu normal i, si es vol, un altre per a divendres i dissabte. Tocant un dia, o el primer i l'últim d'un període, s'hi posa un preu especial o una estada mínima per a qui arribi aquells dies, i es pot aplicar a la vegada a altres allotjaments. Hi ha tries ràpides per a tots els caps de setmana o tot el mes.
- **Descomptes**: per estada llarga, tants com calgui («a partir de 7 nits, un 15 % menys»). S'aplica el més alt.
- **Normes**: estada mínima i màxima, amb quanta antelació es pot reservar, hores d'entrada i sortida, i la política de cancel·lació (Flexible, Moderada, Estricta, No reemborsable o a mida). La web mostra la política al costat de les condicions, i cada reserva guarda la que va acceptar l'hoste: en cancel·lar-la, Maite proposa el retorn que toca.

- **Allotjaments**: tipus, nom, descripció, capacitat, característiques (amb icona) i fotos de cada allotjament, amb una vista prèvia de com es veu a la web. Les fotos es poden pujar (es redueixen al navegador i es guarden a R2), afegir de les que ja té la web, reordenar arrossegant-les o amb fletxes, i la primera és la portada. Les fotos pujades que ja no fa servir cap allotjament s'esborren. La capacitat compta per a la web, els pagaments i les reserves de Maite. El rètol amb el nom (`img/nom-*.png`) és una imatge i no canvia sol.
- **Xarxes socials**: les plantilles d'Instagram amb la marca, en pestanyes. *Posts* (1080 × 1350) i *Stories i reels* (1080 × 1920): cada plantilla té variacions («Una altra opció»), s'hi pot posar una foto pròpia i es descarrega en PNG a mida real. Els posts (i la portada de reel) es confirmen per a la graella. *Destacats*: les portades dels destacats. *Perfil*: com es veurà el perfil amb els posts confirmats; s'ordenen triant el número de cadascun (l'1 és el primer que es publica), es treuen, es descarreguen d'un en un o tota la graella (`01-detall.png`, `02-…`), i cada post té el seu copy: Claude en proposa tres en català i anglès, i es pot editar. *Calendari*: el dia previst de cada post, en un mes, i el que ja hi ha publicat a Instagram cada dia (des de Maite o des de l'app, amb l'enllaç al post). El dia es tria amb un calendari o arrossegant el post a un dia (i tornant-lo a la llista es treu); els posts amb data passen davant a Perfil, per ordre de dia. Un post es pot publicar ara o programar per a un dia i una hora: la imatge es puja en programar-lo i es publica sola, amb el copy que tingui llavors (cal el Worker de `cron/`; mentrestant, es publica quan algú obre Xarxes socials després de l'hora). A *Perfil*, la graella també s'ordena arrossegant els posts; els programats hi porten el dia i l'hora, i a sota hi ha el que ja és a Instagram, amb una marca i l'enllaç al post. Els publicats es veuen també a «Publicats». *Copies*: els textos de referència de cada plantilla, que són els que es proposen si no hi ha la clau de Claude. Les plantilles són a `maite-app/src/social/` (`templates.ts` es genera des del disseny) i les seves fotos a `maite-app/public/social/`.

Tot això s'aplica de seguida a la web i als pagaments. Les reserves fetes a Maite no segueixen les normes (es pot reservar per telèfon el mateix dia o una sola nit).

Tot el que hi ha al calendari continua sent la referència: el que es crea a mà a Google Calendar també surt a Maite (en blau) i bloqueja les nits.

### On es guarda cada cosa

| Què | On | Qui ho llegeix |
| --- | --- | --- |
| Reserves, dades dels hostes i la seva llista (entrada, documents…) | Google Calendar, un calendari per allotjament (a l'esdeveniment de cada reserva) | La web (disponibilitat) i Maite |
| Pagaments i devolucions | Stripe | Maite el consulta en directe |
| Preus, descomptes, normes, política i textos dels allotjaments | Cloudflare KV, espai `MAITE` (claus `settings` i `stays`) | La web (`/api/settings`) i Maite |
| Posts confirmats per a Instagram, el seu ordre, els seus copies i si ja s'han publicat | Cloudflare KV, espai `MAITE` (clau `social`; el testimoni renovat d'Instagram, a `instagram`) | Maite |
| Fotos pujades a Maite | Cloudflare R2, bucket `PHOTOS`, servides a `/photos/…` | La web i Maite |
| Fotos originals, disseny i codi | Aquest repositori (`img/`, `index.html`, `functions/`, `lib/`) | Cloudflare Pages el publica a cada push |

No hi ha cap altra base de dades: tot el que es canvia a Maite es llegeix al moment des de la web.

### Posar-lo en marxa

1. **Domini**: Cloudflare Pages → el projecte → Custom domains → afegeix `maite.casavellarural.com`.
2. **Accés amb Google**: a Google Cloud Console crea un client OAuth («Web application») amb l'URI de redirecció `https://<equip>.cloudflareaccess.com/cdn-cgi/access/callback`. A Cloudflare Zero Trust → Settings → Authentication → Login methods → Add new → Google, enganxa-hi l'ID i el secret del client. Després, Access → Applications → Add an application → Self-hosted, amb el domini `maite.casavellarural.com`, només el mètode Google i una política *Allow* amb els correus que hi poden entrar. Copia l'**Application Audience (AUD) tag**.
3. **Preus i normes**: Workers & Pages → KV → crea un espai de noms (per exemple `casavella-maite`). Al projecte de Pages → Settings → Bindings → KV namespace, amb el nom de variable `MAITE`.
4. **Variables** (Settings → Variables and secrets): `ACCESS_TEAM` (el nom de l'equip de Zero Trust, el que va davant de `.cloudflareaccess.com`) i `ACCESS_AUD` (el tag del pas 2). Les de Stripe i Google Calendar són les mateixes de la web.
5. **Fotos**: R2 → crea un bucket (per exemple `casavella-fotos`). Al projecte de Pages → Settings → Bindings → R2 bucket, amb el nom de variable `PHOTOS`. Sense això, Maite deixa triar entre les fotos de la web però no pujar-ne de noves.
6. **Documents dels hostes a Google Drive**: a Google Cloud, activa la Google Drive API al mateix projecte del compte de servei del calendari. Després tria una de les dues opcions:
   - **Unitat compartida** (més senzill): posa la carpeta «05.01 Documentació checkin» dins d'una unitat compartida i afegeix-hi el correu del compte de servei (`GOOGLE_SA_EMAIL`) com a *Gestor de contingut*.
   - **La teva unitat**: a la consola d'administració de Google Workspace → Seguretat → Controls d'API → Delegació a tot el domini, afegeix l'ID de client del compte de servei amb l'àmbit `https://www.googleapis.com/auth/drive`, i posa la variable `GOOGLE_DRIVE_AS` amb el correu del propietari de la carpeta (per exemple `info@casavellarural.com`).

   En tots dos casos, posa la variable `DOCS_FOLDER` amb l'ID de la carpeta (el tros de l'URL després de `/folders/`). Cada reserva hi té una carpeta numerada, «05.01.07 - Nom (20/10/2026 - 23/10/2026)», que es crea quan s'hi puja el primer document. Un compte de servei no pot desar fitxers a «La meva unitat» d'una altra persona sense una d'aquestes dues opcions.

7. **Copies amb Claude** (Xarxes socials): posa el secret `ANTHROPIC_API_KEY` amb una clau de l'API d'Anthropic (console.anthropic.com). Sense ella, Maite proposa els copies de referència de la pestanya Copies. Els copies tenen un to romàntic, inspirat en Mas d'en Bruno, Off Grid, Oller del Mas i Son Brull, i només porten «Reserva per DM» quan el post és d'alguna cosa concreta (un menú, una data, un cap de setmana). L'opció triada es pot editar abans de desar-la. Fa servir Claude Haiku 5.5, el model més barat: cada vegada que es demanen tres opcions costa uns 0,0005 $ (mil peticions, uns 50 cèntims), i les opcions ja escrites es guarden mentre la pàgina és oberta.
8. **Publicar a Instagram** (Xarxes socials):
   1. Al mòbil, passa el compte d'Instagram a professional (Configuració → Tipus de compte → Empresa o Creador).
   2. A [developers.facebook.com](https://developers.facebook.com) crea una app de tipus *Business* i afegeix-hi el producte **Instagram** amb «API setup with Instagram login». No cal pàgina de Facebook ni revisió de Meta: l'app només publica al teu compte.
   3. A «Generate access tokens», afegeix el compte d'Instagram, accepta els permisos `instagram_business_basic` i `instagram_business_content_publish`, i copia el testimoni.
   4. Posa'l com a secret `INSTAGRAM_TOKEN` a Cloudflare Pages (Production). Maite el renova cada setmana sol (dura 60 dies) i desa el renovat a KV (clau `instagram`). Si mai caduca, n'hi ha prou amb generar-ne un de nou i canviar el secret.

   Cada post de la graella té el botó de publicar: Maite en fa un JPEG, el desa a R2 i Instagram l'agafa de `SITE_URL/photos/…` amb el copy desat. Sense el secret, el botó no surt.
   5. Per programar posts: secret `SOCIAL_CRON_SECRET` a Cloudflare Pages i el Worker de `cron/` en marxa amb el mateix secret (`cron/README.md`).

Cada crida de Maite comprova el testimoni de Cloudflare Access, de manera que sense els passos 2 i 4 no s'hi pot entrar. Sense el pas 3, Maite funciona però no deixa desar preus ni normes, i la web fa servir els valors per defecte de `lib/booking.js`.

## Pendent

- Número de registre turístic. Ara surt com a «per confirmar».
- Fotos separades per allotjament i capacitat de cada un.
- Versions en castellà i anglès.
