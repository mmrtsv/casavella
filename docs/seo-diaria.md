# Rutina diaria de SEO

Lo que hace cada mañana, de martes a domingo, la sesión programada de Claude («SEO diari de La Casa Vella»). El lunes no corre: ese día hace todo la rutina semanal (`docs/seo-rutina.md`).

La diaria solo hace lo que pierde valor si espera una semana. Volver a buscar cada día las preguntas de `docs/aeo.md` no sirve: las respuestas de Google y de los asistentes cambian al ritmo de la indexación (días o semanas), y el ciclo necesita que cada cambio tenga tiempo de notarse. Eso sigue siendo semanal.

## Pasos

1. **La web funciona**: `curl` a `/`, `/es/`, `/en/`, `/robots.txt`, `/sitemap.xml`, `/llms.txt` y `/guies/` de `https://casavellarural.com`: todo 200. `/llms.txt` con los mismos precios y días del restaurante que `/api/settings`. Si algo falla, es lo primero del resumen.

2. **IndexNow**: si `main` tiene commits de las últimas 24 horas (`git log origin/main --since="24 hours ago"`), `python3 indexnow.py`.

3. **Foros, de las últimas 24 horas**: preguntas nuevas en Reddit (r/Barcelona, r/askspain, r/travel, r/solotravel), TripAdvisor (foros de Barcelona y Cataluña), Rick Steves y Quora sobre dónde dormir o qué hacer cerca de Montserrat, el Penedès, Sant Sadurní, el Anoia o Piera. La primera respuesta buena en un hilo es la que se queda arriba y la que leen los asistentes. Hasta 3, cada una con su enlace y un borrador en su idioma, con las reglas del paso 5 de `docs/seo-rutina.md` (útil aunque no se reserve, en primera persona, sin enlace donde las normas lo prohíben). Claude no publica en foros.

4. **Menciones y datos**: busca «La Casa Vella» El Bedorc y «casavellarural.com». Apunta cualquier página nueva que hable de la casa, una ficha de directorio que se haya publicado (las de `docs/fichas.md`) o datos que no coincidan con los de NAP de `docs/seo.md`. Si una ficha nueva ya está publicada, añádela a la tabla de fuentes de `docs/aeo.md`.

5. **Agenda urgente**: solo si aparece un evento de los próximos 14 días a menos de 45 minutos que no esté en `content/agenda.json`, con fuente de este año y fecha exacta (las reglas del paso 2 de `docs/seo-rutina.md`). Lo demás espera al lunes.

6. **Entrega**: si los pasos 4 o 5 cambian algún archivo, rama `seo/dia-AAAA-MM-DD` desde `origin/main`, `python3 build.py`, `git checkout origin/main -- dist/maite`, comprobación con Playwright de lo que cambie, y el paso 8 de `docs/seo-rutina.md` (integrar en `main` si todo pasa, pull request si no). Si no cambia nada, no hay commit.

7. **Resumen** en castellano, corto: estado de la web, los borradores de foros con su enlace, menciones o datos nuevos y lo publicado. Si no hay nada que contar, una línea: «Sin novedades».
