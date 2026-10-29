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

Sin servicios de pago. Cada lunes, antes de los agentes, `python3 social.py` deja en `docs/social/datos/AAAA-MM-DD.md` (y `.json`):

1. **Outliers de YouTube** (Shorts y vídeos de menos de 4 minutos del último mes) para las frases de `contexto.md`: las visualizaciones de cada vídeo contra la mediana de los últimos vídeos de su canal. Sin nada más, lee los listados públicos de YouTube con `yt-dlp` (`pip install yt-dlp`) y solo tiene visualizaciones. Con la variable `YOUTUBE_API_KEY` usa la API oficial y gratuita (10.000 unidades al día; una pasada gasta unas 1.000) y tiene también la fecha, los likes y los comentarios. La clave se crea en Google Cloud, proyecto `casa-vella-booking`, APIs & Services, Library, «YouTube Data API v3», Enable, y Credentials, API key restringida a esa API.
2. **El Instagram de la casa**: con la variable `INSTAGRAM_TOKEN` (el mismo token que Maite tiene en Cloudflare), los últimos 30 posts con likes y comentarios, y alcance, guardados y compartidos si el token tiene el permiso de estadísticas.
3. **Enlaces de TikTok e Instagram**: TikTok e Instagram no dejan buscar vídeos de otros sin pasar por sus controles anti-bots, y eso no se hace. Cuando alguien de la casa ve un vídeo del nicho que funciona, pega el enlace en `docs/social/enlaces.md` (o en la conversación). `social.py` pone el autor y el título de los de TikTok y los agentes los estudian como los demás.

Además, los agentes pueden usar la búsqueda web para tendencias y noticias. Cuando falta un número, el informe pone «sin dato». El nicho es pequeño en YouTube: muchas semanas habrá pocos vídeos, y los enlaces de TikTok e Instagram pesan más.
