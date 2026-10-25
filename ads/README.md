# Anuncios de La Casa Vella (Meta y Google)

Imágenes, textos y enlaces para las campañas. Instinct monta las campañas; aquí está lo que se publica. Los precios son los de la web del 25 de octubre de 2026 (entre semana 90 € el apartamento y 70 € la habitación; viernes y sábado, 110 € y 80 €; un 5 % menos por dos noches). Si cambian en Maite, hay que cambiar aquí el precio de la oferta.

Para regenerar las imágenes: `python3 ads/src/make.py && node ads/src/render.cjs`.

## Imágenes

Cada concepto está en castellano (`-es`) y en catalán (`-ca`), en dos formatos:

- `-feed`: 1080×1350 (4:5), para el feed de Instagram y Facebook.
- `-story`: 1080×1920 (9:16), para Stories y Reels. Los textos quedan dentro de la zona segura (250 px arriba, 340 px abajo).

| Concepto | Archivos | Campaña |
|---|---|---|
| Montserrat desde casa | `montserrat-feed-*.png`, `montserrat-story-*.png` | Meta, prospección |
| Una casa de 1898 | `casa-1898-feed-*.png`, `casa-1898-story-*.png` | Meta, prospección |
| Fin de semana de cava | `cava-feed-*.png`, `cava-story-*.png` | Meta, prospección |
| Oferta del 13 al 15 de noviembre | `oferta-feed-*.png`, `oferta-story-*.png` | Meta, retargeting |
| Carrusel de los cuatro alojamientos (1080×1080) | `carrusel-montserrat-*.png`, `carrusel-la-pineda-*.png`, `carrusel-les-vinyes-*.png`, `carrusel-figarot-*.png` | Meta, prospección y retargeting |

Página de Facebook: `facebook-portada.png` (1640×924, solo la foto: encima van el nombre y la foto de perfil) y `perfil.png` (1080×1080, el isotipo sobre el verde de la marca; la misma para Instagram).

## Meta: textos

Botón: «Reservar». Público en castellano con las piezas `-es` y en catalán con las `-ca`.

**Montserrat desde casa**
- ES: Desde el Bedorc, Montserrat marca el horizonte. Dos apartamentos y dos habitaciones en una casa de pueblo de 1898, entre viñas, a una hora de Barcelona.
  Título: Un fin de semana con Montserrat a la vista
- CA: Des del Bedorc, Montserrat marca l'horitzó. Dos apartaments i dues habitacions en una casa de poble de 1898, entre vinyes, a una hora de Barcelona.
  Títol: Un cap de setmana amb Montserrat a la vista

**Una casa de 1898**
- ES: Muros de piedra, vigas de madera pintadas de verde y el armario antiguo de la casa. La Casa Vella se construyó en 1898 y ahora vuelve a tener vida.
  Título: Dormir en una casa de 1898
- CA: Murs de pedra, bigues de fusta pintades de verd i l'armari antic de la casa. La Casa Vella es va construir el 1898 i ara torna a tenir vida.
  Títol: Dormir en una casa de 1898

**Fin de semana de cava**
- ES: Las cavas de Sant Sadurní, al lado. Cata por la mañana, paseo entre viñas por la tarde y una copa de vino del Penedès en el restaurante de la casa.
  Título: Un fin de semana de cava y viñas
- CA: Les caves de Sant Sadurní, a tocar. Tast al matí, passeig entre vinyes a la tarda i una copa de vi del Penedès al restaurant de la casa.
  Títol: Un cap de setmana de cava i vinyes

**Oferta (retargeting)**
- ES: De viernes a domingo, dos noches en el apartamento para hasta tres personas: 209 €, con el descuento de dos noches. 5,0 en Google con 22 opiniones.
  Título: Del 13 al 15 de noviembre, 209 €
- CA: De divendres a diumenge, dues nits a l'apartament per a fins a tres persones: 209 €, amb el descompte de dues nits. 5,0 a Google amb 22 opinions.
  Títol: Del 13 al 15 de novembre, 209 €

**Carrusel**
- ES: Dos apartamentos con cocina y dos habitaciones con baño privado, en una casa de pueblo de 1898 en El Bedorc.
- CA: Dos apartaments amb cuina i dues habitacions amb bany privat, en una casa de poble de 1898 al Bedorc.

## Google: anuncios de búsqueda adaptables

**Títulos ES** (30 caracteres como máximo)

- Casa rural junto al Penedès
- Con Montserrat a la vista
- Una casa de pueblo de 1898
- A una hora de Barcelona
- Apartamentos y habitaciones
- Reserva directa en la web
- Entre viñas, cerca del cava
- Fin de semana en el Bedorc
- Desde 70 € la noche
- 5,0 sobre 5 en Google
- Un 5 % menos por dos noches
- Un 10 % menos desde 3 noches
- La Casa Vella, El Bedorc
- Restaurante en la misma casa

**Títulos CA**

- Casa rural a tocar del Penedès
- Amb Montserrat a la vista
- Una casa de poble de 1898
- A una hora de Barcelona
- Apartaments i habitacions
- Reserva directa a la web
- Entre vinyes, a prop del cava
- Cap de setmana al Bedorc
- Des de 70 € la nit
- 5,0 sobre 5 a Google
- Un 5 % menys per dues nits
- Un 10 % menys des de 3 nits
- La Casa Vella, el Bedorc
- Restaurant a la mateixa casa

**Descripciones ES** (90 caracteres como máximo)

- Dos apartamentos y dos habitaciones en una casa de 1898, entre viñas y Montserrat.
- Mira la disponibilidad y el precio final en la web y reserva al momento.
- Cavas de Sant Sadurní, Montserrat y caminos entre viñas desde la misma puerta.
- Apartamentos con cocina para tres. Habitaciones con baño privado. Restaurante abajo.

**Descripciones CA**

- Dos apartaments i dues habitacions en una casa de 1898, entre vinyes i Montserrat.
- Mira la disponibilitat i el preu final a la web i reserva al moment.
- Caves de Sant Sadurní, Montserrat i camins entre vinyes des de la mateixa porta.
- Apartaments amb cuina per a tres. Habitacions amb bany privat. Restaurant a baix.

Pendiente de confirmar antes de añadirlo a ningún texto: wifi, aparcamiento, barbacoa y si se admiten mascotas.

## Enlaces

La web abre con las fechas puestas. Sin `stay`, enseña los alojamientos libres; con `stay`, va directa a la reserva de ese alojamiento.

| Anuncio | Enlace |
|---|---|
| Meta, Montserrat | `https://casavellarural.com/?in=2026-11-13&out=2026-11-15&utm_source=meta&utm_medium=paid&utm_campaign=montserrat` |
| Meta, casa de 1898 | `https://casavellarural.com/?in=2026-11-13&out=2026-11-15&utm_source=meta&utm_medium=paid&utm_campaign=casa-1898` |
| Meta, cava | `https://casavellarural.com/?in=2026-11-13&out=2026-11-15&utm_source=meta&utm_medium=paid&utm_campaign=cava` |
| Meta, oferta | `https://casavellarural.com/?in=2026-11-13&out=2026-11-15&stay=montserrat&guests=3&utm_source=meta&utm_medium=paid&utm_campaign=oferta` |
| Meta, carrusel (cada tarjeta) | el de la oferta con `stay=montserrat`, `la-pineda`, `les-vinyes` o `figarot` y `utm_campaign=carrusel` |
| Google, búsqueda | `https://casavellarural.com/?utm_source=google&utm_medium=cpc&utm_campaign=busqueda` (sin fechas: quien busca aún no las ha elegido) |

Cuando pase el 15 de noviembre, se cambian las fechas de los enlaces y de la oferta.
