# La Casa Vella

Web de La Casa Vella, casa de poble familiar al Bedorc (1898): allotjaments, restaurant, història, entorn i contacte.

## Estructura

| Ruta | Què és |
| --- | --- |
| `index.html` | Versió de treball. Conté tota la pàgina (HTML, CSS i JavaScript) i les eines de revisió: el selector de propostes, la vista mòbil (tecla M) i la franja d'esborrany. |
| `build.py` | Genera la versió per al domini a `dist/`. |
| `dist/` | Versió per publicar: document HTML complet, etiquetes per a Google i xarxes, sense les eines de revisió. |
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

- `quote`: preu i disponibilitat.
- `checkout`: bloqueja les dates al calendari de l'allotjament durant 45 minuts i obre Stripe Checkout.
- `stripe-webhook`: quan es paga, el bloqueig passa a ser la reserva; si la sessió caduca, s'esborra. Si les dates s'han ocupat mentrestant, retorna els diners.
- `release`: si l'hoste torna enrere des de Stripe, allibera les dates a l'acte.

Cada allotjament té un Google Calendar a info@casavellarural.com, compartit amb un compte de servei de Google. Per bloquejar dates a mà, n'hi ha prou amb crear un esdeveniment al calendari.

Variables a Cloudflare Pages (Settings → Variables and secrets): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `GOOGLE_SA_EMAIL`, `GOOGLE_SA_KEY`, `CAL_MONTSERRAT`, `CAL_LA_PINEDA`, `CAL_LES_VINYES`, `CAL_FIGAROT`, `SITE_URL`. Mentre no hi siguin, el formulari mostra el preu i remet al telèfon i al WhatsApp.

## Pendent

- Adreça, correu, comptes d'Instagram i Facebook, enllaç a la fitxa de Google i número de registre turístic. Ara surten com a «per confirmar».
- Fotos separades per allotjament i capacitat de cada un.
- Versions en castellà i anglès.
