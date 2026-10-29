---
name: social-lunes
description: El lunes de redes de La Casa Vella: lanza los agentes de la semana y deja una página con qué ganó, qué empujar, qué dejar, qué probar y cinco guiones.
---

Antes de nada: `docs/social/contexto.md` y `docs/social/reglas.md`.

## Flujo

1. Lanza `social-ops`: ejecuta `python3 social.py` y comprueba las fuentes y las reglas.
2. Lanza en paralelo `social-outliers` y `social-competencia`.
3. Con sus resultados, lanza en paralelo `social-creadores`, `social-hooks` y `social-tendencias`.
4. Lanza `social-guiones` con los tres outliers para copiar y la apertura elegida, y `social-multiplicar` con el mejor outlier.
5. Si el dueño ha pegado las métricas de Instagram de la semana (alcance, guardados, compartidos por post), compara los posts propios. Si no, dilo en una línea.
6. Escribe el informe con la plantilla en `docs/social/informes/AAAA-MM-DD.md`.
7. Pasa la auditoría. Haz commit del informe y de los archivos de `docs/social/` que hayan cambiado en la rama de trabajo; nada más.

## Plantilla

```markdown
# Redes, semana del D de mes de AAAA

Fuentes: los datos de social.py, los enlaces pegados y la búsqueda web. (Lo que no se pudo ver, en una línea.)

## Lo que ganó

(Las 10 filas de social-outliers, ordenadas por guardados y compartidos cuando los hay.)

## Empujar

Tres cosas, una línea cada una, con el vídeo que lo prueba.

## Dejar

Dos cosas, con el porqué.

## Probar

Un experimento, con cómo sabremos si ha funcionado.

## Guiones

Cinco, con la plantilla de social-guiones.

## Para el dueño

Lo que necesita una decisión: cuentas de competencia nuevas, una colaboración, una regla.
```

En un minuto de lectura, sin contar los guiones.

## Encargo

«Haz el lunes de redes.»

## Auditoría

- Cada línea del informe cita un vídeo real con enlace.
- Cada número tiene fuente o pone «sin dato».
- Nada se publica: el informe es para el dueño.
