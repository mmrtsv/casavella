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
   python3 build.py https://www.el-teu-domini.com
   ```

   L'URL és opcional. Serveix per a l'enllaç canònic i la imatge que es veu quan es comparteix la web.
3. Fes commit dels canvis, inclosa la carpeta `dist/`, i puja'ls.

## Publicar a Cloudflare Pages

1. Cloudflare → Workers & Pages → Create → Pages → Connect to Git, i tria aquest repositori.
2. Build command: buit. Build output directory: `dist`.
3. Custom domains → afegeix el domini. Si el domini ja és a Cloudflare, el DNS i l'HTTPS es configuren sols.

Cada push a `main` publica la web de nou.

## Reserves (Lodgify)

A `index.html`, la constant `LODGIFY_URL` és buida. Mentre ho sigui, el formulari de reserva mostra un missatge amb el telèfon i el WhatsApp. Hi ha dues maneres de connectar-lo:

- Posar a `LODGIFY_URL` l'enllaç de la pàgina de reserves de Lodgify. El formulari hi envia les dates i el nombre de persones.
- Substituir el formulari pel widget de reserves de Lodgify (Website → Booking widget).

Després, torna a executar `build.py`.

## Pendent

- Adreça, correu, comptes d'Instagram i Facebook, enllaç a la fitxa de Google i número de registre turístic. Ara surten com a «per confirmar».
- Fotos separades per allotjament i capacitat de cada un.
- Versions en castellà i anglès.
