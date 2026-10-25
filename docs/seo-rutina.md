# Rutina semanal de SEO y contenido

Lo que hace cada lunes la sesión programada de Claude (Routine «SEO setmanal de La Casa Vella»). También se puede lanzar a mano pidiéndoselo a Claude: «haz la rutina de docs/seo-rutina.md».

Sigue el patrón que usan las agencias que trabajan con Claude: Claude reúne datos, verifica y redacta; una persona decide qué se publica. Todo lo que sale en la web lleva su fuente y nada se inventa (ver las reglas de `CLAUDE.md` y `.claude/rules/`). Google penaliza el contenido generado en masa sin valor propio («scaled content abuse»); por eso la rutina no crea páginas en serie: actualiza datos reales.

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

3. **Comprobar la web publicada**:
   - `curl` a `https://casavellarural.com/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/es/`, `/en/`: todo 200, con el tipo correcto.
   - Que `/` con `Accept-Language: es` redirija a `/es/` y que sin cabeceras se quede en `/`.
   - Datos estructurados de `/en/` en `https://validator.schema.org/validate` (POST con `html`): 0 errores.
   - `/llms.txt`: que precios, horarios y días del restaurante coincidan con `/api/settings`.
   - `/api/reviews?lang=ca`: si responde, apunta la nota y el número de opiniones.

4. **Visibilidad**: busca en la web (WebSearch) estas consultas y apunta si sale casavellarural.com o una ficha de La Casa Vella, en qué posición y con qué datos:
   - casa rural cerca de Montserrat
   - dónde dormir cerca de Sant Sadurní d'Anoia
   - allotjament rural Anoia
   - casa rural Piera
   - rural guesthouse near Montserrat
   - La Casa Vella El Bedorc
   Si algún sitio publica datos que no coinciden con los de `docs/seo.md` (NAP), apúntalo.

5. **Borradores para el dueño** (no se publican solos):
   - Una publicación de Google Business Profile para la semana (máximo 1.500 caracteres, en catalán y castellano) a partir de algo real: un día que abre el restaurante (de `/api/settings`), un evento de la agenda, una temporada (calçots, vendimia). Con el enlace a la web y, si toca, `?in=&out=` con fechas libres.
   - Respuestas a las reseñas nuevas que salgan en `/api/reviews`, en el idioma de cada reseña, concretas y cortas.

6. **Generar y comprobar**: `python3 build.py`, `git checkout origin/main -- dist/maite`. Comprueba con Playwright que la sección de la agenda se ve bien en `/`, `/es/` y `/en/` (escritorio y 390 px) y que no hay errores en la consola.

7. **Informe**: `docs/informes/AAAA-MM-DD.md` en castellano, corto: qué se ha cambiado en la agenda (con las fuentes), estado de la web, visibilidad, problemas encontrados y los borradores del paso 5.

8. **Entrega**: commit claro, push de la rama y pull request a `main` con el resumen del informe. El dueño lo revisa y lo integra; al integrarlo, Cloudflare publica. Si no hay ningún cambio en la agenda ni nada que reportar, no abras PR: deja el informe en la rama y termina.
