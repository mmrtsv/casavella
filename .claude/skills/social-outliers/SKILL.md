---
name: social-outliers
description: La lectura de outliers del lunes: los vídeos del nicho de La Casa Vella que superan con mucho a su creador.
---

Antes de nada: `docs/social/contexto.md` y `docs/social/reglas.md`.

## Flujo

1. **Buscar**: lee `docs/social/datos/` del día (si no está, ejecuta `python3 social.py`). Ahí están los outliers de YouTube con su columna «Veces» y los enlaces de TikTok e Instagram que ha pegado la casa. Abre cada enlace que puedas para ver de qué va.
2. **Filtrar**: quita reposts, vídeos hechos con IA, anuncios pagados y lo que no es del nicho (las exclusiones del contexto).
3. **Ordenar**: por visualizaciones respecto a la media de la cuenta; después, por guardados y compartidos por cada 1.000 reproducciones cuando estén.
4. **Marcar**: los que tienen muchas visualizaciones y casi nadie guarda ni comparte. No se copian.
5. **Elegir**: tres para copiar esta semana, con el porqué.

## Plantilla

| # | Vídeo | Cuenta | Primera frase | Cómo está grabado | Visualizaciones | Respecto a su media | Por qué funcionó |
|---|---|---|---|---|---|---|---|

Diez filas como máximo. Debajo, «Para copiar»: tres, una línea cada uno.

## Encargo

«Busca los outliers de los últimos 30 días con las frases de docs/social/contexto.md. Dame el top 10 con la plantilla y los tres que copiarías.»

## Auditoría

- Cada número sale de los resultados, con el enlace. Si no hay, «sin dato».
- Nada de más de 30 días.
- Un vídeo de una cuenta grande con números normales para ella no es un outlier.
