# La Casa Vella

Web de La Casa Vella, casa de poble familiar al Bedorc (1898): allotjaments, restaurant, història, entorn i contacte.

## Estructura

| Ruta | Què és |
| --- | --- |
| `index.html` | Versió de treball. Conté tota la pàgina (HTML, CSS i JavaScript) i les eines de revisió: el selector de propostes, la vista mòbil (tecla M) i la franja d'esborrany. |
| `build.py` | Genera la versió per al domini a `dist/`. |
| `dist/` | Versió per publicar: document HTML complet, etiquetes per a Google i xarxes, sense les eines de revisió. |
| `maite/` | Maite, el back office (vegeu més avall). |
| `img/` | Fotos, logo, isotip i plaques dels allotjaments. |
| `fonts/` | Tipografies de marca: Le Monde Livre i Halyard Display. |

És HTML pla, sense framework ni dependències.

## Actualitzar la web

1. Edita `index.html`.
2. Regenera la versió publicable:

   ```bash
   python3 build.py https://casavellarural.com
   ```

   L'URL és opcional. Serveix per a l'enllaç canònic i la imatge que es veu quan es comparteix la web.
3. Fes commit dels canvis, inclosa la carpeta `dist/`, i puja'ls.

## Publicar a Cloudflare Pages

1. Cloudflare → Workers & Pages → Create → Pages → Connect to Git, i tria aquest repositori.
2. Build command: buit. Build output directory: `dist`.
3. Custom domains → afegeix el domini. Si el domini ja és a Cloudflare, el DNS i l'HTTPS es configuren sols.

Cada push a `main` publica la web de nou.

## Reserves (Stripe + Google Calendar)

El formulari calcula el preu (habitació 70 €, apartament 90 € la nit; 5 % de descompte per a 2 nits i 10 % a partir de 3) i obre el pagament de Stripe. Ho fan les funcions de `functions/api/` (Cloudflare Pages Functions), amb la lògica compartida a `lib/booking.js`:

- `quote`, `search`, `busy`: preu i disponibilitat (un allotjament o tots; nits ocupades per al calendari).
- `checkout`: comprova el calendari i obre el pagament de Stripe integrat a la pàgina de reserva. No bloqueja res fins que es paga.
- `stripe-webhook`: quan es completa el pagament, escriu la reserva al calendari de l'allotjament. Si mentrestant algú altre ha pagat les mateixes dates, retorna els diners.
- `release`: tanca la sessió de pagament si l'hoste canvia les dades o marxa.
- `status`: diu a la pàgina de tornada si el pagament s'ha completat.
- `prices`: els preus i descomptes desats a Maite, perquè la pàgina mostri els actuals.

Cada allotjament té un Google Calendar a info@casavellarural.com, compartit amb un compte de servei de Google. Qualsevol esdeveniment al calendari d'un allotjament bloqueja aquelles nits, sigui quin sigui el títol (els marcats com a «Disponible» no). Per bloquejar dates a mà, n'hi ha prou amb crear-hi un esdeveniment.

Variables a Cloudflare Pages (Settings → Variables and secrets): `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `GOOGLE_SA_EMAIL`, `GOOGLE_SA_KEY`, `CAL_MONTSERRAT`, `CAL_LA_PINEDA`, `CAL_LES_VINYES`, `CAL_FIGAROT`, `SITE_URL`. Mentre no hi siguin, el formulari mostra el preu i remet al telèfon i al WhatsApp.

## Maite (back office)

Maite és el back office, a `maite.casavellarural.com`. Surt del mateix projecte de Cloudflare Pages: `functions/_middleware.js` mira el domini i, a `maite.`, serveix `maite/index.html` i les funcions de `functions/api/maite/` (amb la lògica a `lib/maite.js`). Des de qualsevol altre domini, aquestes rutes donen 404.

- **Calendari**: un mes amb una fila per allotjament. Es toca la primera nit i l'última per tancar dates o afegir una reserva. Tocant una reserva se'n veuen els detalls.
- **Reserves**: properes, passades, cancel·lades i tancaments, amb cercador i un resum dels pròxims 30 dies.
- **Reserves directes** (telèfon, WhatsApp, en persona): s'escriuen al calendari de l'allotjament i bloquegen les nits a la web. Proposa el preu de la web, però es pot canviar.
- **Cancel·lar**: la reserva queda al calendari com a «CANCEL·LADA» i les nits queden lliures. Si es va pagar a la web, es pot retornar tot o una part per Stripe. Les que esperen la confirmació del banc no es poden cancel·lar fins que arriba.
- **Tancar dates**: un o més allotjaments, o tota la casa. Si alguna nit ja està ocupada, no es tanca res.
- **Preus**: preu per nit de cada allotjament i descomptes de 2 nits i de 3 o més. S'apliquen de seguida a la web i als pagaments.

Tot el que hi ha al calendari continua sent la referència: el que es crea a mà a Google Calendar també surt a Maite (en blau) i bloqueja les nits.

### Posar-lo en marxa

1. **Domini**: Cloudflare Pages → el projecte → Custom domains → afegeix `maite.casavellarural.com`.
2. **Accés**: Cloudflare Zero Trust → Access → Applications → Add an application → Self-hosted. Domini `maite.casavellarural.com`, política *Allow* amb els correus que hi poden entrar (per exemple info@casavellarural.com) i el mètode «One-time PIN»: Cloudflare envia un codi per correu per entrar. Copia l'**Application Audience (AUD) tag**.
3. **Preus**: Workers & Pages → KV → crea un espai de noms (per exemple `casavella-maite`). Al projecte de Pages → Settings → Bindings → KV namespace, amb el nom de variable `MAITE`.
4. **Variables** (Settings → Variables and secrets): `ACCESS_TEAM` (el nom de l'equip de Zero Trust, el que va davant de `.cloudflareaccess.com`) i `ACCESS_AUD` (el tag del pas 2). Les de Stripe i Google Calendar són les mateixes de la web.

Cada crida de Maite comprova el testimoni de Cloudflare Access, de manera que sense els passos 2 i 4 no s'hi pot entrar. Sense el pas 3, Maite funciona però no deixa desar preus i la web fa servir els de `lib/booking.js`.

## Pendent

- Adreça, correu, comptes d'Instagram i Facebook, enllaç a la fitxa de Google i número de registre turístic. Ara surten com a «per confirmar».
- Fotos separades per allotjament i capacitat de cada un.
- Versions en castellà i anglès.
