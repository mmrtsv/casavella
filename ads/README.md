# Anuncios de La Casa Vella (Meta y Google)

Imágenes, textos y enlaces de las campañas. Instinct monta y opera las campañas; aquí está lo que se publica. Los precios son los de la web del 26 de octubre de 2026: entre semana, 90 € el apartamento y 70 € la habitación; viernes y sábado, 110 € y 80 €; un 5 % menos por dos noches y un 10 % desde tres. Si cambian en Maite, hay que cambiarlos aquí y en las imágenes.

Enfoque: la casa está entre viñedos, cerca de Montserrat y del Penedès. Los servicios van en los textos destacados, no en los titulares.

Para regenerar las imágenes: `python3 ads/src/make.py && node ads/src/render.cjs`. Las copias a doble resolución que se suben a Drive salen del mismo HTML con `deviceScaleFactor: 2`.

## Imágenes

Sufijos: `-es` castellano, `-ca` catalán, `-en` inglés. Formatos:

- `-feed`: 1080×1350 (4:5), para el feed de Instagram y Facebook.
- `-story`: 1080×1920 (9:16), para Stories y Reels. Los textos quedan dentro de la zona segura (250 px arriba, 340 px abajo).
- `carrusel-*`: 1080×1080.

| Concepto | Archivos | Idiomas | Campaña |
|---|---|---|---|
| Castanyada, viñedos | `castanyada-feed-*`, `castanyada-story-*` | es, ca | Castanyada, hasta el 31 de octubre |
| Castanyada, habitación | `castanyada-habitacion-feed-*`, `castanyada-habitacion-story-*` | es, ca | Castanyada, hasta el 31 de octubre |
| Desconecta entre viñedos | `vinyes-feed-*`, `vinyes-story-*` | es, ca, en | General, desde el 2 de noviembre |
| Montserrat a la vista | `montserrat-feed-*`, `montserrat-story-*` | es, ca, en | General |
| Cava y viñas | `cava-feed-*`, `cava-story-*` | es, ca, en | General |
| Del 13 al 15 de noviembre | `oferta-feed-*`, `oferta-story-*` | es, ca, en | General, hasta el 12 de noviembre |
| Carrusel de los cuatro alojamientos | `carrusel-montserrat-*`, `carrusel-la-pineda-*`, `carrusel-les-vinyes-*`, `carrusel-figarot-*` | es, ca, en | Más adelante, cuando suba el presupuesto |

Las variantes `castanyada-apartamento-*` y `castanyada-cava-*` se descartaron y no se usan.

Página de Facebook: `facebook-portada.png` (1640×924, solo la foto: encima van el nombre y la foto de perfil) y `perfil.png` (1080×1080, el isotipo sobre el verde de la marca; la misma para Instagram).

## Meta

Una campaña de ventas con un solo conjunto de anuncios, 5 €/día, optimizando a InitiateCheckout. Cada anuncio lleva las tres traducciones dentro (castellano como base, catalán e inglés), con la imagen y el enlace de cada idioma. Meta enseña a cada persona su idioma. Botón: «Reservar».

### General (del 2 al 15 de noviembre)

Público: Cataluña, de 28 a 65 años, Advantage+ con sugerencias (escapadas, enoturismo, Penedès, Montserrat, turismo rural) y el público de quien ha interactuado con @casavellarural en los últimos 365 días.

Cuatro anuncios en el conjunto: viñedos, Montserrat, cava y la oferta del 13 al 15 de noviembre. La oferta se apaga el 12. Los tres primeros llevan los mismos textos para que la diferencia la marque la imagen; Meta prueba las combinaciones y reparte hacia la que funciona.

**Textos principales (viñedos, Montserrat y cava)**

Castellano
1. Una casa de pueblo de 1898 entre viñedos, con Montserrat en el horizonte y el Penedès al lado. Dos apartamentos y dos habitaciones en El Bedorc, a 45 minutos de Barcelona.
2. Un fin de semana lejos de la ciudad, con caminos entre viñas desde la misma puerta y Montserrat al fondo. Habitaciones desde 70 € la noche y apartamentos con cocina desde 90 €.
3. Las cavas de Sant Sadurní a 15 minutos y Montserrat a 45. Apartamentos con cocina para hasta tres personas y habitaciones con baño privado. Elige fechas y mira el precio final en la web.

Catalán
1. Una casa de poble de 1898 entre vinyes, amb Montserrat a l'horitzó i el Penedès al costat. Dos apartaments i dues habitacions al Bedorc, a 45 minuts de Barcelona.
2. Un cap de setmana lluny de la ciutat, amb camins entre vinyes des de la mateixa porta i Montserrat al fons. Habitacions des de 70 € la nit i apartaments amb cuina des de 90 €.
3. Les caves de Sant Sadurní a 15 minuts i Montserrat a 45. Apartaments amb cuina per a fins a tres persones i habitacions amb bany privat. Tria les dates i mira el preu final a la web.

Inglés
1. An 1898 village house among vineyards, with Montserrat on the horizon and the Penedès next door. Two apartments and two rooms in El Bedorc, 45 minutes from Barcelona.
2. A weekend away from the city, with paths through the vineyards from the front door and Montserrat in the distance. Rooms from €70 a night and apartments with a kitchen from €90.
3. The cava cellars of Sant Sadurní are 15 minutes away and Montserrat 45. Apartments with a kitchen for up to three and rooms with a private bathroom. Pick your dates and see the final price on the website.

**Títulos**

| Castellano | Catalán | Inglés |
|---|---|---|
| Una casa rural entre viñedos | Una casa rural entre vinyes | A country house among vineyards |
| Entre Montserrat y el Penedès | Entre Montserrat i el Penedès | Between Montserrat and the Penedès |
| Desde 70 € la noche | Des de 70 € la nit | From €70 a night |

**Oferta del 13 al 15 de noviembre**

Textos principales:
- ES: Del 13 al 15 de noviembre todavía hay sitio en La Casa Vella. Habitación para dos desde 80 € la noche o apartamento con cocina para tres desde 110 €, con un 5 % menos por dos noches.
- CA: Del 13 al 15 de novembre encara hi ha lloc a La Casa Vella. Habitació per a dos des de 80 € la nit o apartament amb cuina per a tres des de 110 €, amb un 5 % menys per dues nits.
- EN: There is still room at La Casa Vella from 13 to 15 November. A room for two from €80 a night or an apartment with a kitchen for three from €110, with 5 % off for two nights.

Títulos: «Del 13 al 15 de noviembre» / «Del 13 al 15 de novembre» / «13 to 15 November».

### Castanyada (del 26 al 31 de octubre)

Público: quien ha interactuado con @casavellarural en los últimos 365 días, más visitantes de la web. Dos anuncios: viñedos y habitación. Solo castellano y catalán.

Textos principales:
- ES A: La castanyada entre viñedos, con Montserrat en el horizonte. Del 30 de octubre al 1 de noviembre en El Bedorc, desde 80 € la noche. Reserva directa en la web.
- ES B: Un fin de semana de otoño lejos de la ciudad: una casa de pueblo de 1898 entre viñas, a 45 minutos de Barcelona. Del 30 de octubre al 1 de noviembre, desde 80 € la noche.
- CA A: La castanyada entre vinyes, amb Montserrat a l'horitzó. Del 30 d'octubre a l'1 de novembre al Bedorc, des de 80 € la nit. Reserva directa a la web.
- CA B: Un cap de setmana de tardor lluny de la ciutat: una casa de poble de 1898 entre vinyes, a 45 minuts de Barcelona. Del 30 d'octubre a l'1 de novembre, des de 80 € la nit.

Títulos: «La castanyada entre viñedos» y «Del 30 oct al 1 nov, desde 80 € la noche»; «La castanyada entre vinyes» y «Del 30 oct a l'1 nov, des de 80 € la nit».

## Google: búsqueda

Una campaña long-tail, 10 €/día, puja máxima de 0,50 € por clic, Cataluña con «presencia o interés», idiomas castellano y catalán. Dos grupos de anuncios separados por el idioma de las palabras clave. Inglés todavía no.

**Titulares** (30 caracteres como máximo)

| Castellano | Catalán |
|---|---|
| Casa rural entre viñedos | Casa rural entre vinyes |
| Entre viñas y Montserrat | Entre vinyes i Montserrat |
| Cerca de Montserrat | A prop de Montserrat |
| A un paso del Penedès | A tocar del Penedès |
| Viñedos, Montserrat y Penedès | Vinyes, Montserrat i Penedès |
| Casa rural cerca de Montserrat | Casa rural prop de Montserrat |
| Escapada entre viñedos | Escapada entre vinyes |
| Escapada rural en el Anoia | Escapada rural a l'Anoia |
| Apartamentos y habitaciones | Apartaments i habitacions |
| Desde 70 € la noche | Des de 70 € la nit |
| Reserva directa en nuestra web | Reserva directa a la web |
| Valorada con 5,0 en Google | Valorada amb un 5,0 a Google |
| Casa de pueblo de 1898 | Casa de poble de 1898 |
| A 45 min de Barcelona | A 45 min de Barcelona |
| Un 5 % menos por dos noches | Un 5 % menys per dues nits |

Hasta el 31 de octubre, «Cerca de Montserrat», «Viñedos, Montserrat y Penedès» y «Escapada entre viñedos» se sustituyen por «Libre para la castanyada», «Del 30 oct al 1 nov» y «Desde 80 € la noche» (en catalán, «Lliure per la castanyada», «Del 30 d'oct a l'1 de nov» y «Des de 80 € la nit»).

**Descripciones** (90 caracteres como máximo)

Castellano
- Casa de pueblo de 1898 entre viñedos, con Montserrat en el horizonte y el Penedès al lado.
- Dos apartamentos con cocina y dos habitaciones con baño privado en El Bedorc, Anoia.
- Cavas del Penedès a 15 minutos y Montserrat a 45. Elige fechas y reserva en la web.
- Valorada con 5,0 en Google. Wifi, aparcamiento gratuito y un 5 % menos por dos noches.

Catalán
- Casa de poble de 1898 entre vinyes, amb Montserrat a l'horitzó i el Penedès al costat.
- Dos apartaments amb cuina i dues habitacions amb bany privat al Bedorc, Anoia.
- Caves del Penedès a 15 minuts i Montserrat a 45. Tria les dates i reserva a la web.
- Valorada amb un 5,0 a Google. Wifi, aparcament gratuït i un 5 % menys per dues nits.

## Enlaces

La web abre con las fechas puestas. Sin `stay`, enseña los alojamientos libres; con `stay`, va directa a la reserva de ese alojamiento. Castellano en `/es/`, catalán en `/` e inglés en `/en/`. En Meta, cada traducción del anuncio lleva el enlace de su idioma.

| Anuncio | Enlace (castellano; en catalán sin `/es`, en inglés con `/en/`) |
|---|---|
| Meta, viñedos | `https://casavellarural.com/es/?utm_source=meta&utm_medium=paid&utm_campaign=general&utm_content=vinyes#apartaments` |
| Meta, Montserrat | `https://casavellarural.com/es/?utm_source=meta&utm_medium=paid&utm_campaign=general&utm_content=montserrat#apartaments` |
| Meta, cava | `https://casavellarural.com/es/?utm_source=meta&utm_medium=paid&utm_campaign=general&utm_content=cava#apartaments` |
| Meta, oferta | `https://casavellarural.com/es/?in=2026-11-13&out=2026-11-15&utm_source=meta&utm_medium=paid&utm_campaign=general&utm_content=oferta` |
| Meta, castanyada | `https://casavellarural.com/es/?in=2026-10-30&out=2026-11-01&utm_source=meta&utm_medium=paid&utm_campaign=castanyada` |
| Google, castellano | `https://casavellarural.com/es/?utm_source=google&utm_medium=cpc&utm_campaign=longtail-es#apartaments` |
| Google, catalán | `https://casavellarural.com/?utm_source=google&utm_medium=cpc&utm_campaign=longtail-ca#apartaments` |
| Google, castanyada | `https://casavellarural.com/es/?in=2026-10-30&out=2026-11-01&utm_source=google&utm_medium=cpc&utm_campaign=castanyada` |

Cuando pase el 15 de noviembre, se cambian las fechas de la oferta (siguiente: el puente de diciembre).
