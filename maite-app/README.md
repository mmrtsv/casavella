# Maite

El back office de La Casa Vella, a `maite.casavellarural.com`. Què fa cada pantalla, on es guarden les dades i com es posa en marxa és al [README principal](../README.md#maite-back-office). Aquí hi ha com està fet.

## Com està fet

Una aplicació de React d'una sola pàgina, escrita en TypeScript i construïda amb Vite a `dist/maite/`. No té `package.json` propi: les dependències i les ordres són a l'arrel del repositori, i `vite.config.ts` hi apunta.

```bash
npm install
npm run dev        # servidor local; les crides a /api van a MAITE_API (per defecte http://localhost:8788)
npm run typecheck
npm run build      # només Maite, a dist/maite/
```

| Carpeta | Què hi ha |
| --- | --- |
| `src/shell/` | L'estructura: barra lateral, barra superior, pestanyes al mòbil i la paleta d'ordres |
| `src/pages/` | Una pàgina per secció (Inici, Calendari, Reserves, Preus, Descomptes, Normes, Allotjaments, Correus, Xarxes socials) |
| `src/social/` | Les plantilles d'Instagram: el seu HTML a mida real (`templates.ts`, generat des del disseny), les variacions i l'exportació a PNG (`paint.ts`), com es dibuixen a escala (`Art.tsx`), i el que se'ls pot canviar des d'una descripció: les fotos i les línies de text (`catalog.ts`, que també llegeix `social-make.js`) |
| `src/windows/` | Fitxa de la reserva, formularis i finestres |
| `src/parts/` | Peces petites compartides: `Status`, avisos, camps, el full lliscant |
| `src/lib/` | API, dades, dates, textos, rutes i les superfícies de vidre (`glass.tsx`) |
| `src/styles.css` | El tema de HeroUI amb els colors de la marca i el vidre |

## Llibreries

| Llibreria | Versió | Per a què |
| --- | --- | --- |
| [React](https://react.dev) i React DOM | 19.2 | La interfície |
| [HeroUI](https://heroui.com) (`@heroui/react`, `@heroui/styles`) | 3.2 | Botons, camps, taules, pestanyes, diàlegs, avisos. Només s'importa el CSS dels components que es fan servir |
| [React Aria Components](https://react-spectrum.adobe.com/react-aria/) | 1.22 | La base accessible de HeroUI (teclat, focus, lectors de pantalla). Ve amb HeroUI |
| [Tailwind CSS](https://tailwindcss.com) (`@tailwindcss/vite`) | 4.3 | Estils |
| [tailwind-variants](https://www.tailwind-variants.org) i [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css) | 3.3, 1.4 | Variants i animacions de HeroUI. Venen amb HeroUI |
| [liquid-glass-react](https://www.npmjs.com/package/liquid-glass-react) | 1.1 | La refracció del vidre a Chromium. Es carrega a part i només on es pot veure; Safari, Firefox i qui demana menys transparència o moviment veuen un vidre desenfocat fet amb CSS |
| [Lucide](https://lucide.dev) (`lucide-react`) | 1.60 | Les icones |
| [html-to-image](https://github.com/bubkoo/html-to-image) | 1.11 | Els PNG de les plantilles d'Instagram, amb les tipografies de la marca. Es carrega només en descarregar |
| [Vite](https://vite.dev) i `@vitejs/plugin-react` | 8.3 | Servidor local i construcció. Un connector propi posa el CSS dins d'`index.html` perquè el marc es pinti de seguida |
| [TypeScript](https://www.typescriptlang.org) | 7.0 | Comprovació de tipus |

Les funcions del servidor (`functions/api/maite/`, `lib/maite.js`) no fan servir cap llibreria: són JavaScript pla sobre Cloudflare Pages Functions, amb Stripe, Google Calendar, Google Drive i Claude (els copies d'Instagram, `social-copy.js`, i els posts fets a partir d'una descripció, `social-make.js`) per la seva API HTTP.

## D'on ve el disseny

- **Liquid Glass d'Apple** (iOS 26 i macOS 26): el vidre de la barra lateral, la barra superior, les pestanyes, la paleta i els diàlegs. Es fa amb `liquid-glass-react`, que l'imita al navegador, i només a les superfícies que llista `.claude/rules/ui-no-ai-slop.md`.
- **La home de REVER**: la salutació d'Inici, on cada paraula puja des d'una màscara 60 ms després de l'anterior.
- **La web de La Casa Vella**: els colors (verd fosc, alfàbrega, sàlvia i cava). La tipografia de Maite és la del sistema, no la de la web.
- **Shoelace**: es va provar en un esborrany (taula de reserves i fitxa amb pestanyes) i es va deixar per HeroUI. D'aquell esborrany en queda la idea de la fitxa de client amb pestanyes.
