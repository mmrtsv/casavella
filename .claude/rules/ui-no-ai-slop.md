# No AI-slop UI

Applies to every UI Claude builds or changes: the public web (`index.html`), Maite (`maite-app/`), the email templates (`lib/email.js`) and published artifacts. Generated UI drifts toward a recognisable look: decorative separators, shouty labels, badges and icons on everything. It makes a screen look templated rather than designed, and it is noise guests and Maite's users have to read past. Before writing markup, check the sibling section or page. If it doesn't have it, don't add it.

## What each surface already has

- **Public web**: the brand tokens on `:root` in `index.html` (`--ink`, `--basil`, `--sage`, `--cava`, `--ground`, `--paper`, `--line`, `--muted`), Le Monde Livre for display and Halyard Display for text. Small uppercase tracked text is part of the brand, but only through the existing classes (`.label`, `.btn`, the nav, `.apt-info .meta`). Reuse them; don't invent new eyebrow styles or put one above every block.
- **Maite**: HeroUI + Tailwind with the brand-derived theme in `maite-app/src/styles.css`. Glass is the chosen look, but only through `Glass` (`maite-app/src/lib/glass.tsx`) on the chrome (sidebar, top bar, tab bar, palette), dialogs and sheets, and the few highlight cards that already use it. Everything else is a plain surface. Status words go through `Status`/`Tag` in `parts/Status.tsx`.
- **Emails**: the brand colours and type already in `lib/email.js`.

## Never

| Pattern | Do instead |
|---|---|
| `·` (middot), `•`, `\|` or `/` as inline separators: `2 nits · 2 hostes · Les Vinyes` | One fact per element. Put metadata in its own line or cell; use layout (`gap`) for spacing, not glyphs. The `·` in Catalan `l·l` (cancel·lar, al·lèrgies) is spelling, not a separator: never touch it |
| New eyebrow labels: small uppercase tracked text above a title or section (`RESUM`, `PAS 1`) | A plain title in sentence case. On the web, the existing `.label` where the sibling section has one |
| Uppercase or monospace for values that aren't code (`font-mono` on dates, amounts or statuses) | Sentence case in the surface's font. `tnum` for figures that line up. `font-mono` only for codes the user may copy (a Stripe ID) |
| Badges/pills/chips on everything: "Nou", "Beta", counts on every tab, a status pill next to a status pill | `Status`/`Tag` only for a real state the user acts on (pending payment, missing documents). One per row at most |
| Emoji or decorative icons in headings, buttons, empty states or copy (✨ 🚀 ✅ 💡) | Text. Icons only where they carry meaning (navigation, actions, a stay's features) and from `lucide-react` like the rest of Maite |
| An icon in a tinted circle/square next to every card title or figure | The title alone. Icons don't label sections |
| Gradients: backgrounds, buttons, borders, gradient text | Flat tokens. The soft brand light behind Maite's glass is the only one |
| New glass, blur, glow, coloured shadows, heavy shadows outside the surfaces listed above | A plain HeroUI surface with its own border and shadow |
| Purple/indigo/blue or any colour outside the brand greens, Cava and the neutrals mixed from them | The tokens. Amber and red only for things owed and danger, as `Status` already does |
| Coloured left-border callouts, "💡 Consell" / "Nota:" boxes | A field description, one line of help text, or nothing |
| Nested cards: a card inside a card inside a card | One card per section; a muted inner panel if it really needs one |
| Hero/KPI tiles with big numbers, trend arrows and "+12%" the page doesn't need | Show the number where it's used. Home's existing figures are the pattern, not a template to repeat |
| Arrows and chevrons as decoration: "Descobreix-ho →", `→` between words | Plain link or button text. A chevron only on a control that expands or navigates |
| Tiny arbitrary type (`text-[10px]`, `text-[11px]`) for new meta and labels | `text-xs` in Maite; the existing label sizes on the web |
| Em dashes (`—`) in any UI or email string: "Reserva confirmada — et esperem" | A full stop, comma, colon or brackets: "Reserva confirmada. Et esperem." |
| Landing-page copy: "Descobreix", "Viu una experiència única", "increïble", exclamation marks | Short, literal copy: what it is, what it does. The web's voice is calm and specific (1898, el Bedorc, Montserrat), not a hotel brochure |
| Title Case On Every Label | Sentence case everywhere (titles, buttons, tabs, labels), in every language |
| Filler: subtitles restating the title, "Aquí pots gestionar…", empty-state paragraphs | Cut it. An empty state is one line and, if useful, one action |
| Fake data that looks fake: "John Doe", "Lorem ipsum", `example.com`, round numbers | Real stays (Montserrat, La Pineda, Les Vinyes, Figarot), Catalan and Spanish names, plausible prices from the current rates and real dates |
| Placeholder skeleton, loading or "properament" sections added to fill space | Only what the feature needs |

## Self-check before you hand it over

Look at the screenshot, not the code (desktop and phone width; on the web the review tools' mobile view, key M), and ask:

1. Would this screen sit next to its sibling page or section without standing out? If not, change it until it would.
2. Count the separators, badges, icons and uppercase labels. Each one should be there because the user needs it. Remove the rest.
3. Read every string out loud. If it sounds like a landing page, rewrite it.
