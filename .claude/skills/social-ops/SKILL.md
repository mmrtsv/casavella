---
name: social-ops
description: La revisión de operaciones del equipo de redes: fuentes conectadas, agentes reutilizados y cada corrección convertida en regla.
---

Antes de nada: `docs/social/contexto.md` y `docs/social/reglas.md`.

## Flujo

1. **Fuentes**: ejecuta `python3 social.py` (con `pip install yt-dlp` si falta). Apunta si ha tenido `YOUTUBE_API_KEY` e `INSTAGRAM_TOKEN`, cuántos vídeos ha traído y si `docs/social/enlaces.md` tiene enlaces nuevos. Si algo falla, dilo en el informe.
2. **Reutilizar**: antes de crear un agente, una skill o una búsqueda nueva, mira si ya hay uno que sirva.
3. **Corregir**: repasa las correcciones del dueño de la semana (en la conversación o en los informes) y apunta cada una en `docs/social/reglas.md` con la fecha, en una frase.
4. **Programar**: si el dueño quiere que el lunes vaya solo, propón una sesión programada como la de SEO (`docs/seo-rutina.md`) que pida «haz el lunes de redes».

## Plantilla

`docs/social/reglas.md`: `- AAAA-MM-DD: la regla, en una frase. (de dónde sale)`

## Encargo

«Repasa las correcciones de esta semana y apunta cada una en docs/social/reglas.md.»

## Auditoría

- Nada se publica sin el sí del dueño, sea cual sea el programador.
- Una regla nueva no contradice otra. Si lo hace, se cambia la vieja y se dice.
