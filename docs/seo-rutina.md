# Rutina semanal de SEO y contenido

De martes a domingo corre la rutina diaria (`docs/seo-diaria.md`): web, IndexNow, foros del día, menciones nuevas y agenda urgente. El ciclo de preguntas y el cambio de la semana son solo de los lunes.

Lo que hace cada lunes la sesión programada de Claude (Routine «SEO setmanal de La Casa Vella»), y en versión corta cada jueves (ver al final). También se puede lanzar a mano pidiéndoselo a Claude: «haz la rutina de docs/seo-rutina.md».

Sigue el patrón que usan las agencias que trabajan con Claude: Claude reúne datos, verifica y redacta. El dueño ha decidido que la rutina integre sola en `main` cuando todas las comprobaciones pasan; el informe semanal le cuenta qué se ha publicado. Todo lo que sale en la web lleva su fuente y nada se inventa (ver las reglas de `CLAUDE.md` y `.claude/rules/`). Google penaliza el contenido generado en masa sin valor propio («scaled content abuse»); por eso la rutina no crea páginas en serie: actualiza datos reales.

## Pasos

1. **Rama**: `git fetch origin main` y crea `seo/semana-AAAA-MM-DD` desde `origin/main`.

2. **Agenda del entorno** (`content/agenda.json`):
   - Quita lo que ya ha pasado.
   - Busca qué hay en las próximas 6 semanas a menos de 45 minutos de El Bedorc: Piera, Sant Sadurní d'Anoia, Capellades, Vilafranca del Penedès, Igualada, Martorell, Montserrat, Sant Llorenç d'Hortons, Masquefa. Fuentes válidas: webs de ayuntamientos, Anoia Turisme, Enoturisme Penedès y DO Penedès, abadía de Montserrat, Catalunya Turisme, la prensa comarcal (La Veu de l'Anoia, Anoia Diari, El 3 de Vuit). Ferias, fiestas mayores, mercados, conciertos, rutas guiadas, catas abiertas al público.
   - Solo entra un evento si una fuente de este año da el día exacto. Si la fecha es de otro año o dudosa, no entra.
   - La web enseña los 6 próximos; el archivo puede guardar más, que entran solos a medida que pasan los anteriores. Cada uno:

     ```json
     { "from": "2026-11-28", "to": "2026-11-29", "place": "Sant Sadurní d'Anoia", "minutes": 15,
       "title": { "ca": "…", "es": "…", "en": "…" },
       "text": { "ca": "…", "es": "…", "en": "…" },
       "url": "https://… (la fuente)" }
     ```

     `minutes`: en coche desde la casa (los de la web: Sant Sadurní 15, Capellades 20, Vilafranca 25, Claramunt 30, Montserrat 45). `text`: una frase literal, qué es y qué se hace. Sin exclamaciones, sin «increíble», sin rayas largas, sin punto medio como separador (el `·` de `l·l` sí).
   - Cambia `updated` a la fecha de hoy.

2b. **Guías** (`content/guides/*.json`, formato en `guides.py`): una guía nueva cada lunes, siempre que haya datos comprobables para escribirla (si no, se dice en el informe y no se rellena).
   - Revisa las existentes: fechas, horarios y precios que hayan cambiado según sus fuentes; si un dato ya no se puede confirmar, quítalo. Si cambias algo, pon `updated` a hoy.
   - Tema nuevo: lo que la gente pregunta y aún nadie ha respondido bien, sobre todo lo de la **próxima temporada antes que nadie** (la calçotada del año que viene, Navidad y Cap d'Any en la zona, la vendimia, la fira del cava del año siguiente, la Setmana Santa en Montserrat). Solo se escribe si hay fuente con fecha de este año o del siguiente; si la fecha aún no se ha anunciado, se explica la regla («el primer fin de semana de octubre») con las ediciones anteriores como fuente.
   - Formato que citan los asistentes: la respuesta en la primera frase (`description`), datos concretos (fechas, distancias, precios), cada dato con su fuente en `sources`, entre 250 y 450 palabras por idioma, en catalán, castellano e inglés. Título en minúsculas salvo nombres propios, sin exclamaciones ni frases de folleto. Enlaza a la casa solo donde aporte (el restaurante, un evento). Una imagen de `img/` que tenga que ver.
   - Nunca páginas en serie del tipo «casa rural en [pueblo]»: cada guía responde una pregunta distinta.
   - Temas pendientes, de más a menos útil (quita el que escribas y añade los que salgan de las búsquedas):
     - Cómo llegar al Bedorc sin coche desde Barcelona: Piera tiene estación de FGC (R6 y R60 desde Plaça Espanya); falta confirmar el tiempo de viaje en el buscador de horarios de FGC y si algún bus llega al Bedorc.
     - El castell de la Ventosa y paseos desde el Bedorc (Anoia Turisme lo documenta: castell-del-bedorc; falta una fuente oficial de rutas a pie).
     - Navidad y Cap d'Any 2026 en el Penedès y el Anoia (ferias con fecha publicada).
     - El castell de Claramunt.
     - Vilafranca del Penedès: el Vinseum y el mercado.
     - Sant Jeroni a pie desde el monasterio, paso a paso.
     - La vendimia 2027 en el Penedès (cuando haya fechas).
     - Setmana Santa 2027 en Montserrat (cuando la abadía publique horarios).

3. **Comprobar la web publicada**:
   - `curl` a `https://casavellarural.com/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/es/`, `/en/`: todo 200, con el tipo correcto.
   - Que `/` con `Accept-Language: es` redirija a `/es/` y que sin cabeceras se quede en `/`.
   - Datos estructurados de `/en/` en `https://validator.schema.org/validate` (POST con `html`): 0 errores.
   - `/llms.txt`: que precios, horarios y días del restaurante coincidan con `/api/settings`.
   - `/api/reviews?lang=ca`: si responde, apunta la nota y el número de opiniones.

4. **Visibilidad, pregunta por pregunta** (el ciclo de `docs/aeo.md`):
   - Busca en la web (WebSearch) cada pregunta de `docs/aeo.md`, sección 1, tal como está escrita. Apunta si sale casavellarural.com o una ficha de La Casa Vella, en qué posición y qué fuentes salen en su lugar.
   - Diagnostica cada pregunta perdida (Rastreo, Floja, Falta, Terceros) y clasifica cada fuente nueva en propias, reclamar, ganar o corregir (secciones 2 y 3).
   - Mira si la pregunta del cambio de la semana pasada se ha movido.
   - Haz **un** cambio propio concreto para la pregunta que más pese (mejorar una página floja antes que crear otra). Si el cambio es una guía nueva, cuenta como la guía del paso 2b.
   - Añade la columna de hoy al seguimiento (sección 6) y actualiza la tabla de fuentes.
   Si algún sitio publica datos que no coinciden con los de `docs/seo.md` (NAP), apúntalo como fuente a corregir.

5. **Publicación de la ficha de Google**: se publica sola. Escribe `content/gbp/AAAA-MM-DD-tema.json` con `id` (el mismo nombre), `date` (el día que debe salir, normalmente el martes), `lang` (`ca`), `text` (hasta 1.500 caracteres, a partir de algo real: un día que abre el restaurante según `/api/settings`, un evento de la agenda, una temporada; sin teléfonos, que Google rechaza, ni almohadillas), `image` (una de `/img/`) y `link` (la web, o `#reservar` / `?in=&out=` con fechas libres). El cron la publica ese día desde las 9 h (`lib/gbp.js`). Los posts de Instagram que se publican desde Maite también van solos a la ficha.

5b. **Borradores para el dueño** (no se publican solos):
   - Respuestas a las reseñas nuevas que salgan en `/api/reviews`, en el idioma de cada reseña, concretas y cortas.
   - **Foros**: busca preguntas recientes (últimos 30 días) con pocas respuestas en TripAdvisor (foros de Barcelona y Cataluña), Reddit (r/Barcelona, r/askspain, r/travel), Quora y similares sobre dónde dormir o qué hacer cerca de Montserrat, el Penedès, Sant Sadurní o el Anoia. Hasta 5, cada una con su enlace y un borrador de respuesta en su idioma: útil aunque no se reserve (responde lo que pregunta, con datos de las guías), y al final, si encaja, una línea que diga que la escribe alguien de La Casa Vella, con el enlace. Las publica una persona de la casa con su cuenta: Claude no publica en foros. Antes, mira las normas de cada foro: Rick Steves, TripAdvisor, Fodor's y la mayoría de subreddits prohíben que un negocio conteste promocionándose, aunque lo diga; ahí no se proponen borradores (como mucho, apuntar la pregunta para que el dueño decida).

6. **Generar y comprobar**: `python3 build.py`, `git checkout origin/main -- dist/maite`. Comprueba con Playwright que la sección de la agenda, el bloque de guías y cada guía nueva o cambiada se ven bien en `/`, `/es/` y `/en/` (escritorio y 390 px) y que no hay errores en la consola.

7. **Informe**: `docs/informes/AAAA-MM-DD.md` en castellano, corto: qué se ha cambiado en la agenda y en las guías (con las fuentes), estado de la web, visibilidad (qué preguntas se han movido, el cambio de la semana y las acciones sobre fuentes de terceros para el dueño), problemas encontrados y los borradores del paso 5.

8. **Entrega**: commit claro y push de la rama. Después, si todo lo del paso 6 ha salido bien:
   - `git fetch origin main` y `git merge origin/main` en la rama; vuelve a ejecutar `python3 build.py` y `git checkout origin/main -- dist/maite`, y repite la comprobación del paso 6.
   - `git push origin HEAD:main`. Cloudflare publica en uno o dos minutos; comprueba con `curl` que `/` responde 200 y que la agenda nueva está en el HTML. Después, `python3 indexnow.py` avisa a Bing (el buscador de ChatGPT) de todas las páginas del sitemap.
   - Si algo falla (conflicto, comprobación en rojo, una fuente dudosa), no integres: abre una pull request a `main` con el problema explicado al principio, para que la revise el dueño.
   El informe va siempre en el commit, aunque la agenda no cambie.

## Jueves: revisión corta

El jueves, la rutina diaria (`docs/seo-diaria.md`) añade esto a sus pasos, en la rama `seo/jueves-AAAA-MM-DD`:

1. Agenda: quita lo pasado y añade lo que se haya publicado desde el lunes, con las mismas reglas.
2. Guías: comprueba los datos que caducan (horarios, precios, cierres, fechas de ferias) en sus fuentes. Si algo ha cambiado, corrígelo y pon `updated` a hoy. Si no ha cambiado nada, no se toca: cambiar la fecha sin cambiar el contenido no sirve y Google lo detecta.
3. Reseñas nuevas en `/api/reviews`: borradores de respuesta.
4. Generar, comprobar con Playwright, una nota corta en el informe de la semana (`docs/informes/` del lunes) e integrar en `main` si hay cambios. Si no hay nada que cambiar, no hay commit.
