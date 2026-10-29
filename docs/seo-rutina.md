# Rutina semanal de SEO y contenido

Lo que hace cada lunes la sesión programada de Claude (Routine «SEO setmanal de La Casa Vella»). También se puede lanzar a mano pidiéndoselo a Claude: «haz la rutina de docs/seo-rutina.md».

Sigue el patrón que usan las agencias que trabajan con Claude: Claude reúne datos, verifica y redacta. El dueño ha decidido que la rutina integre sola en `main` cuando todas las comprobaciones pasan; el informe semanal le cuenta qué se ha publicado. Todo lo que sale en la web lleva su fuente y nada se inventa (ver las reglas de `CLAUDE.md` y `.claude/rules/`). Google penaliza el contenido generado en masa sin valor propio («scaled content abuse»); por eso la rutina no crea páginas en serie: actualiza datos reales.

## Pasos

1. **Rama**: `git fetch origin main` y crea `seo/semana-AAAA-MM-DD` desde `origin/main`.

2. **Agenda del entorno** (`content/agenda.json`):
   - Quita lo que ya ha pasado.
   - Busca qué hay en las próximas 6 semanas a menos de 45 minutos de El Bedorc: Piera, Sant Sadurní d'Anoia, Capellades, Vilafranca del Penedès, Igualada, Martorell, Montserrat, Sant Llorenç d'Hortons, Masquefa. Fuentes válidas: webs de ayuntamientos, Anoia Turisme, Enoturisme Penedès y DO Penedès, abadía de Montserrat, Catalunya Turisme, la prensa comarcal (La Veu de l'Anoia, Anoia Diari, El 3 de Vuit). Ferias, fiestas mayores, mercados, conciertos, rutas guiadas, catas abiertas al público.
   - Solo entra un evento si una fuente de este año da el día exacto. Si la fecha es de otro año o dudosa, no entra.
   - Máximo 6 elementos. Cada uno:

     ```json
     { "from": "2026-11-28", "to": "2026-11-29", "place": "Sant Sadurní d'Anoia", "minutes": 15,
       "title": { "ca": "…", "es": "…", "en": "…" },
       "text": { "ca": "…", "es": "…", "en": "…" },
       "url": "https://… (la fuente)" }
     ```

     `minutes`: en coche desde la casa (los de la web: Sant Sadurní 15, Capellades 20, Vilafranca 25, Claramunt 30, Montserrat 45). `text`: una frase literal, qué es y qué se hace. Sin exclamaciones, sin «increíble», sin rayas largas, sin punto medio como separador (el `·` de `l·l` sí).
   - Cambia `updated` a la fecha de hoy.

2b. **Guías** (`content/guides/*.json`, formato en `guides.py`): una guía nueva cada dos semanas (si la última tiene menos de 14 días, solo revisa las que hay).
   - Revisa las existentes: fechas, horarios y precios que hayan cambiado según sus fuentes; si un dato ya no se puede confirmar, quítalo. Si cambias algo, pon `updated` a hoy.
   - Tema nuevo: lo que la gente pregunta y aún nadie ha respondido bien, sobre todo lo de la **próxima temporada antes que nadie** (la calçotada del año que viene, Navidad y Cap d'Any en la zona, la vendimia, la fira del cava del año siguiente, la Setmana Santa en Montserrat). Solo se escribe si hay fuente con fecha de este año o del siguiente; si la fecha aún no se ha anunciado, se explica la regla («el primer fin de semana de octubre») con las ediciones anteriores como fuente.
   - Formato que citan los asistentes: la respuesta en la primera frase (`description`), datos concretos (fechas, distancias, precios), cada dato con su fuente en `sources`, entre 250 y 450 palabras por idioma, en catalán, castellano e inglés. Título en minúsculas salvo nombres propios, sin exclamaciones ni frases de folleto. Enlaza a la casa solo donde aporte (el restaurante, un evento). Una imagen de `img/` que tenga que ver.
   - Nunca páginas en serie del tipo «casa rural en [pueblo]»: cada guía responde una pregunta distinta.

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

5. **Borradores para el dueño** (no se publican solos):
   - Una publicación de Google Business Profile para la semana (máximo 1.500 caracteres, en catalán y castellano) a partir de algo real: un día que abre el restaurante (de `/api/settings`), un evento de la agenda, una temporada (calçots, vendimia). Con el enlace a la web y, si toca, `?in=&out=` con fechas libres.
   - Respuestas a las reseñas nuevas que salgan en `/api/reviews`, en el idioma de cada reseña, concretas y cortas.
   - **Foros**: busca preguntas recientes (últimos 30 días) con pocas respuestas en TripAdvisor (foros de Barcelona y Cataluña), Reddit (r/Barcelona, r/askspain, r/travel), Quora y similares sobre dónde dormir o qué hacer cerca de Montserrat, el Penedès, Sant Sadurní o el Anoia. Hasta 5, cada una con su enlace y un borrador de respuesta en su idioma: útil aunque no se reserve (responde lo que pregunta, con datos de las guías), y al final, si encaja, una línea que diga que la escribe alguien de La Casa Vella, con el enlace. Las publica una persona de la casa con su cuenta: Claude no publica en foros.

6. **Generar y comprobar**: `python3 build.py`, `git checkout origin/main -- dist/maite`. Comprueba con Playwright que la sección de la agenda, el bloque de guías y cada guía nueva o cambiada se ven bien en `/`, `/es/` y `/en/` (escritorio y 390 px) y que no hay errores en la consola.

7. **Informe**: `docs/informes/AAAA-MM-DD.md` en castellano, corto: qué se ha cambiado en la agenda y en las guías (con las fuentes), estado de la web, visibilidad (qué preguntas se han movido, el cambio de la semana y las acciones sobre fuentes de terceros para el dueño), problemas encontrados y los borradores del paso 5.

8. **Entrega**: commit claro y push de la rama. Después, si todo lo del paso 6 ha salido bien:
   - `git fetch origin main` y `git merge origin/main` en la rama; vuelve a ejecutar `python3 build.py` y `git checkout origin/main -- dist/maite`, y repite la comprobación del paso 6.
   - `git push origin HEAD:main`. Cloudflare publica en uno o dos minutos; comprueba con `curl` que `/` responde 200 y que la agenda nueva está en el HTML.
   - Si algo falla (conflicto, comprobación en rojo, una fuente dudosa), no integres: abre una pull request a `main` con el problema explicado al principio, para que la revise el dueño.
   El informe va siempre en el commit, aunque la agenda no cambie.
