# Equipo de redes con Claude

Diez agentes de Claude Code que miran qué vídeos funcionan en el nicho de La Casa Vella (escapadas rurales cerca de Barcelona, Penedès, Montserrat) y lo convierten en guiones para Instagram. Uno por departamento, cada uno con su skill (flujo, plantilla, encargo y auditoría). Todos leen primero `contexto.md` y `reglas.md`.

Idea sacada de la guía de @dsqjaffa («Marketing Engineer for social media with Claude», octubre de 2026), reducida a lo que necesita una casa de cuatro alojamientos y un restaurante: un agente por departamento en lugar de cinco.

## El equipo

| Semana | Agente | Qué hace | Deja el resultado en |
|---|---|---|---|
| Investigación | `social-nicho` | Mantiene las búsquedas y exclusiones del contexto | `contexto.md` |
| Investigación | `social-competencia` | Sigue 5 a 10 cuentas y marca sus posts que despegan | `competencia.md` |
| Inteligencia | `social-outliers` | Los vídeos del nicho que hacen mucho más de lo normal en su cuenta | el informe del lunes |
| Inteligencia | `social-creadores` | Los creadores que repiten éxitos, para estudiarlos | `creadores.md` |
| Inteligencia | `social-hooks` | Las primeras frases de los ganadores, palabra por palabra | `hooks.md` |
| Inteligencia | `social-tendencias` | Formatos y tendencias que sirven para la casa | el informe del lunes |
| Producción | `social-guiones` | Guiones de 20 a 30 segundos a partir de los ganadores, en la voz de la casa | el informe del lunes |
| Producción | `social-multiplicar` | Un ganador convertido en tres ideas propias | el informe del lunes |
| Operaciones | `social-lunes` | El informe de cada lunes: qué ganó, qué empujar, qué dejar, qué probar y cinco guiones | `informes/AAAA-MM-DD.md` |
| Operaciones | `social-ops` | Comprueba las fuentes y pasa cada corrección a regla | `reglas.md` |

Los agentes están en `.claude/agents/social-*.md` y sus skills en `.claude/skills/social-*/SKILL.md`. En Claude Code, `/agents` los lista.

## Cómo se usa

- **Cada lunes**: pedir a Claude «haz el lunes de redes» (o `/social-lunes`). Lanza los agentes de inteligencia y producción y deja el informe en `docs/social/informes/`. Se puede programar como la rutina de SEO (`docs/seo-rutina.md`).
- **Un encargo suelto**: «usa social-multiplicar con este vídeo: [enlace]», «usa social-hooks y dame 20 aperturas».
- **Una corrección**: decirle a Claude qué estaba mal. `social-ops` la apunta en `reglas.md` y nadie la repite.

Nada se publica solo. Los guiones se graban, y los posts se hacen y programan en Maite (Xarxes socials).

## De dónde salen los datos

Claude no puede mirar TikTok ni Instagram por su cuenta. Por orden:

1. **Virlo** (opcional, de pago): un conector con una base de vídeos virales de TikTok, YouTube Shorts e Instagram, con visualizaciones, la media de cada cuenta y tendencias. Se conecta en claude.ai, Settings, Connectors, «Add custom connector» (las instrucciones están en virlo.ai/claude), y en Claude Code con `/mcp`. Si sus herramientas están, los agentes las usan primero.
2. **Sin Virlo**: búsqueda web (`site:tiktok.com`, `site:youtube.com/shorts`, `site:instagram.com/reel` con las frases del contexto) y las páginas públicas de cada vídeo. El buscador casi no indexa TikTok: si `site:` no trae nada, se prueba la frase con «tiktok» o «reels» detrás. YouTube enseña las visualizaciones; TikTok e Instagram a menudo no. Cuando falta el número, el informe pone «sin dato» y el ranking es más flojo.
3. **Lo propio**: los posts publicados están en Maite, Xarxes socials, Publicats. Las métricas de cada post (alcance, guardados, compartidos) solo las da la app de Instagram; si el dueño las pega en la conversación, `social-lunes` las usa.
