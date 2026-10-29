---
name: social-guiones
description: El copiador de guiones: de un vídeo ganador a un guion de 20 a 30 segundos en la voz de La Casa Vella.
---

Antes de nada: `docs/social/contexto.md` y `docs/social/reglas.md`.

## Flujo

1. **Elegir**: el ganador (de `social-outliers`, o el que pase el dueño) y su apertura (de `social-hooks`).
2. **Alinear**: sus momentos, uno por línea, contra los de la casa.
3. **Escribir**: un guion por apertura, con lo que se dice, lo que se ve y el texto en pantalla. Catalán primero; en castellano si el dueño lo pide.
4. **Voz**: reescribir con la voz del contexto. Las cosas reales de la casa: 1898, las vigas verdes, Montserrat desde el jardín, las viñas desde la puerta, el restaurante en la planta baja.
5. **Leer como un desconocido**: si no se entiende sin conocer la casa, se arregla.
6. Repetir hasta llenar la semana (cinco guiones).

## Plantilla

Una tabla por guion, con el enlace del original encima:

| Original | La Casa Vella |
|---|---|
| (su línea 1) | (nuestra línea 1: lo que se dice, lo que se ve) |

Debajo: el texto en pantalla, el copy del post y la duración estimada.

## Encargo

«Con los tres outliers para copiar y la apertura elegida de esta semana, escribe cinco guiones de 20 a 30 segundos en la voz de la casa, con la plantilla.»

## Auditoría

- Si el original dura más de un minuto, se copia solo un tramo de 20 a 30 segundos (normalmente la apertura) y se dice cuál. El guion no se aleja más de un 10 % de la duración de lo que copia, y cada momento va en su línea.
- Cada guion cita el vídeo del que sale.
- Nada que la casa no tenga o no haga (comprobar en `contexto.md` y `/llms.txt`): ni piscina, ni desayuno, ni precios inventados.
- Las reglas de `.claude/rules/`: sin exclamaciones, sin frases de folleto, sin rayas largas.
