# SEO y visibilidad en asistentes de IA

Plan de La Casa Vella (casavellarural.com) para aparecer en Google, en Google Maps y en las respuestas de ChatGPT, Gemini, Perplexity, Claude y los AI Overviews de Google. Escrito el 25 de octubre de 2026.

Los asistentes de IA responden con lo que encuentran en tres sitios: la web de la casa, las fichas de mapas (Google Business Profile, Apple, Bing) y lo que otros publican sobre ella (directorios, reseñas, prensa local). ChatGPT busca con Bing; Gemini y los AI Overviews, con Google; Perplexity, con su propio rastreador y Bing. Para salir hace falta que los tres sitios digan lo mismo, con los mismos datos, y que haya reseñas.

## 1. Auditoría de la web (antes de este cambio)

| Punto | Estado | Qué pasaba |
| --- | --- | --- |
| Título y descripción | Bien, mejorable | Solo en catalán. En castellano e inglés el título lo cambiaba el JavaScript. |
| Canonical | Bien | `https://casavellarural.com/` |
| Idiomas y hreflang | Mal | Castellano e inglés eran la misma URL con `?lang=`, traducidos en el navegador. Sin JavaScript (GPTBot, ClaudeBot, PerplexityBot no lo ejecutan) solo existía el catalán. Googlebot, que sí lo ejecuta, con toda probabilidad veía la portada en inglés (navegador sin catalán ni castellano). Ningún `hreflang`. |
| robots.txt | Mal | No existía: `/robots.txt` devolvía la página de inicio (HTML, 200). |
| sitemap.xml | Mal | No existía (misma respuesta HTML). |
| Datos estructurados | No había | Ni `LodgingBusiness` ni `Restaurant`. |
| llms.txt | No había | |
| Contenido rastreable | Bien en catalán | Todo el texto está en el HTML. Los precios y los alojamientos se actualizan desde `/api/settings`, pero el HTML ya trae los de por defecto. |
| Rendimiento | Correcto | 225 KB de HTML con CSS y JS dentro; imágenes con `loading="lazy"`; la portada (395 KB) sin precarga; Halyard en TTF de 98 KB. |
| Maite (`maite.casavellarural.com`) | Bien | `X-Robots-Tag: noindex`, pero sin robots.txt propio. |
| Opiniones | Mal | La sección dice «Aquí es mostraran les ressenyes reals de Google…»: un texto de relleno visible para huéspedes y rastreadores. |
| Registro turístico | Mal | El pie dice «Núm. registre turístic per confirmar». En Cataluña el número debe aparecer en la publicidad del alojamiento, y los directorios oficiales lo piden. |

## 2. Hecho en el repositorio

- **Una página por idioma**: `/` (catalán), `/es/` y `/en/`. `build.py` las escribe ya traducidas con el mismo diccionario `I18N` que usaba el navegador. Se ha comprobado con el navegador que el texto es idéntico al de antes en los tres idiomas y que, sin JavaScript, no queda ningún texto sin traducir.
- **Redirección por idioma** (`functions/_middleware.js`): quien abre `/` va a su idioma (cookie `lcv-lang` con la última elección; si no hay, el idioma del navegador). Los rastreadores no envían idioma ni cookie y leen cada página donde está. Los enlaces antiguos con `?lang=es` redirigen a `/es/` con el resto de parámetros (los de anuncios `?in=&out=&stay=` siguen funcionando). Stripe devuelve al huésped a la página de su idioma.
- **Etiquetas por página**: título y descripción en su idioma, canonical propio, `hreflang` ca, es, en y x-default, `og:url`, `og:locale`.
- **Datos estructurados (JSON-LD)** en cada página: `LodgingBusiness` (dirección, coordenadas, teléfono, correo, horas de entrada y salida, 4 alojamientos con su capacidad, servicios, rango de precios, Instagram, mapa) y `Restaurant` dentro de la casa, con el enlace para reservar mesa. El validador de schema.org da 0 errores y 0 avisos.
  - **Sin `aggregateRating`**: Google no muestra (y puede penalizar) las valoraciones que un negocio marca sobre sí mismo, y el 5,0 de Google Maps no son reseñas recogidas en la web. La puntuación ya la enseña Google en la ficha de Maps; las IA la leen de ahí.
- **robots.txt**: todos los rastreadores pueden leer la web, y los de IA se nombran uno a uno (GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, Claude-SearchBot, Google-Extended, Applebot-Extended, CCBot, Meta-ExternalAgent…). `/api/` no. En `maite.` todo está bloqueado.
- **sitemap.xml** con las tres páginas y sus alternativas de idioma.
- **llms.txt** (`/llms.txt`): los datos de la casa en texto plano para asistentes de IA, con los precios, descuentos, horarios, política de cancelación y próximos días del restaurante que hay en Maite en ese momento (`functions/llms.txt.js`).
- **Rendimiento**: precarga de la foto de portada y de la tipografía; Halyard en WOFF2 (31 KB en vez de 98 KB).
- **Reseñas de Google en la web**: la sección de opiniones muestra la nota, el número de opiniones y las reseñas que Google enseña primero (hasta cinco, es lo que da la API), traducidas al idioma de la página y con el nombre de cada autor, como pide Google (`functions/api/reviews.js`). Para encenderlo (hoy `/api/reviews` contesta que falta permiso): Google Cloud, proyecto `casa-vella-booking`, con facturación activada → APIs & Services → Library → «Places API (New)» → Enable → Credentials → Create credentials → API key, restringida a «Places API (New)» → en Cloudflare Pages, variable `GOOGLE_PLACES_KEY` con esa clave y volver a desplegar (con facturación; según la tarifa actual de Google, unos 0,025 $ por consulta, y la página solo consulta cuando el visitante llega a la sección). Mientras no esté, la sección enseña solo los dos botones, sin el texto de relleno.
- **Agenda del entorno automatizada**: bloque «Qué pasa cerca» en la sección del entorno, generado desde `content/agenda.json`. Lo mantiene la rutina semanal.
- **Rutina semanal de Claude** (`docs/seo-rutina.md`): cada lunes una sesión de Claude actualiza la agenda con fuentes oficiales, comprueba la web publicada y los datos estructurados, busca si la casa sale en las consultas clave, redacta la publicación de Google Business Profile de la semana y las respuestas a reseñas nuevas, y deja el informe en `docs/informes/`. Si todas las comprobaciones pasan, lo integra sola en `main`; si algo falla, abre una pull request.
- **Correo para pedir la reseña**: el día después de la salida, cada huésped con correo (reservas de la web y de Maite, no canceladas) recibe las gracias y el enlace directo para escribir la opinión en Google, en el idioma de la reserva. Se envía a todos por igual, como exige Google. Se ve en Maite, Correus, y se para con la variable `REVIEW_EMAILS=off`.

## 3. Pendiente en la web (necesita una decisión o datos del dueño)

1. **Número de registro turístico** (HUTB-… o el que corresponda): en cuanto lo haya, va en el pie, en `llms.txt` y en los datos estructurados.
2. **Sección de opiniones**: hecho (reseñas de Google en vivo). Falta activar la Places API (ver punto 2). La puntuación no se marca en los datos estructurados.
3. **Preguntas frecuentes**: no se ha añadido una sección visible. La página no tiene ninguna sección hermana con ese formato y casi todo lo que respondería ya está escrito (capacidad, cocina, aparcamiento, horarios, descuentos). Lo que sí aportaría son respuestas que hoy no están en ninguna parte y que solo el dueño puede dar:
   - ¿Se admiten mascotas?
   - ¿Hay desayuno? ¿El restaurante abre para los huéspedes los días que no abre al público?
   - ¿Acceso sin escaleras o habitación en planta baja?
   - ¿Cuna o cama supletoria en las habitaciones?
   - ¿Cargador para coche eléctrico, dónde se aparca exactamente?
   - ¿En qué idiomas atiende la familia?
   Con esas respuestas, se añaden a `llms.txt` y, si encaja, como un bloque corto en la sección de alojamientos.
4. **Páginas del entorno** (más adelante): una página por tema con contenido propio y real, por ejemplo «Montserrat desde El Bedorc», «Caves de Sant Sadurní a 15 minutos», «Rutas a pie y en bici desde la puerta», «Calçotada en La Casa Vella». Son las páginas que responden a búsquedas como «casa rural cerca de Montserrat» o «dónde dormir en el Penedès». Hacen falta textos y fotos del dueño; la estructura (una página por idioma, en el sitemap) se monta en `build.py` en una tarde.
5. **Código postal**: la web dice 08784. OpenStreetMap tiene la calle Munné Orpí con 08718. Confirmar con Correos cuál es y corregir donde esté mal (OpenStreetMap lo puede editar cualquiera).

## 4. Plan fuera del repositorio

### Datos únicos (NAP)

Usar siempre exactamente estos datos, en todos los sitios:

- Nombre: **La Casa Vella**
- Dirección: **Carrer Munné Orpí, 23, 08784 El Bedorc (Piera), Barcelona**
- Teléfono: **+34 667 40 98 59**
- Web: **https://casavellarural.com/** (en directorios en castellano, `https://casavellarural.com/es/`)
- Correo: **info@casavellarural.com**
- Descripción corta: «Casa de pueblo de 1898 en El Bedorc (Anoia), entre viñas y con Montserrat en el horizonte. Dos apartamentos, dos habitaciones con baño privado y restaurante.»

### Semana 1

| Tarea | Quién |
| --- | --- |
| Cloudflare: comprobar que no bloquea a los rastreadores de IA. Panel del dominio → Security → Bots (o «AI Crawl Control»): «Block AI bots» desactivado y sin «managed robots.txt». Bot Fight Mode desactivado o con los bots verificados permitidos. Activar «Crawler Hints» (Caching → Configuration), que avisa a Bing por IndexNow cuando cambia la web. | Dueño o agencia (necesita acceso a Cloudflare) |
| Google Search Console: propiedad de dominio verificada por DNS en Cloudflare, enviar `https://casavellarural.com/sitemap.xml`, inspeccionar `/`, `/es/` y `/en/` y pedir la indexación. | Agencia |
| Bing Webmaster Tools: importar desde Search Console y enviar el sitemap. Bing alimenta las búsquedas de ChatGPT y de Copilot. | Agencia |
| Google Business Profile (ver abajo). | Dueño, con ayuda de la agencia |
| Los ID de la etiqueta de Google y del Pixel en `build.py` (lo hace otra sesión) y conectar GA4 con Search Console. | Agencia |

### Google Business Profile

Es lo que más pesa en Google Maps, en las búsquedas locales y en lo que contestan Gemini y los AI Overviews.

- **Categoría principal**: «Casa rural». **Secundarias**: «Restaurante» y, si Google la ofrece, «Apartamento con servicios» o «Alojamiento». No poner categorías que no sean ciertas.
- **Datos**: los de NAP de arriba; horario del restaurante solo los días que abre (o «horario especial» día a día); enlace de reservas `https://casavellarural.com/?utm_source=google&utm_medium=organic&utm_campaign=gbp`; enlace del menú a `/#restaurant`.
- **Atributos**: wifi gratuito, aparcamiento gratuito, aire acondicionado, calefacción, cocina (apartamentos), jardín y terraza, restaurante; y los que el dueño confirme (mascotas, accesibilidad).
- **Descripción** (hasta 750 caracteres, propuesta): «La Casa Vella es una casa de pueblo de 1898 en El Bedorc (Piera, Anoia), entre viñas, pinares y con Montserrat en el horizonte. La familia la ha restaurado conservando los muros de piedra, las vigas de madera y los suelos hidráulicos. Tiene dos apartamentos con cocina (Montserrat y La Pineda, hasta 3 personas) y dos habitaciones con baño privado (Les Vinyes y Figarot, 2 personas), con aire acondicionado, calefacción, wifi y aparcamiento gratuitos. En la planta baja, el restaurante abre los días que se anuncian y para grupos. Sant Sadurní d'Anoia está a 15 minutos, Montserrat y Barcelona a 45. Reserva directa en la web, por teléfono o por WhatsApp.»
- **Fotos**: al menos 5 de cada alojamiento, la fachada y la entrada (para que los huéspedes la reconozcan al llegar), el restaurante, la terraza y las vistas a Montserrat. Subir fotos nuevas cada mes.
- **Productos o servicios**: cada alojamiento con su precio «desde».
- **Publicaciones**: una por semana. Las de Instagram que salen de Maite sirven (menú del día que abre, un fin de semana con fechas libres, la calçotada). Con el botón «Reservar» y el enlace con fechas `?in=&out=`.
- **Reseñas**: responder a todas, en el idioma en que están escritas, con algo concreto de la estancia. Pedir una a cada huésped al marcharse: el enlace directo es `https://search.google.com/local/writereview?placeid=ChIJK6vlrrVlpBIRBAeTHj5ufvE` (en un código QR en el apartamento y en un mensaje de WhatsApp el día de salida). No ofrecer nada a cambio: Google lo prohíbe. Se puede añadir el enlace a un correo automático al día siguiente de la salida; lo puedo hacer desde el repositorio si el dueño quiere.

### Mes 1: directorios y citas

Cada ficha con los mismos datos de NAP y enlace a la web.

| Sitio | Qué hacer | Quién |
| --- | --- | --- |
| Registre de Turisme de Catalunya | Con el número de registro, la casa sale en los datos abiertos de la Generalitat y en catalunya.com. Revisar que nombre, dirección y teléfono coincidan. | Dueño |
| Apple Business Connect | Reclamar la ficha de Apple Maps (Siri y el mapa del iPhone). | Dueño |
| Bing Places | Importar desde Google Business Profile. | Agencia |
| TripAdvisor | Reclamar o crear dos fichas: alojamiento y restaurante. Responder reseñas. | Dueño |
| Ajuntament de Piera | Pedir que la incluyan en la guía de alojamientos y restaurantes del municipio. | Dueño |
| Consell Comarcal de l'Anoia (Anoia Turisme) | Alta en el directorio de alojamientos rurales de la comarca. | Dueño |
| Enoturisme Penedès (Ruta del Vi DO Penedès) | Ver si la casa puede adherirse como alojamiento; da enlaces y aparece en las guías de enoturismo. | Dueño |
| Escapada Rural y Clubrural | Fichas de casas rurales; tienen planes de pago. Probar la gratuita o el plan más bajo y medir reservas. | Dueño |
| OpenStreetMap | Añadir el punto (tourism=guest_house y amenity=restaurant) con web y teléfono. Lo usan muchas apps y asistentes. | Agencia o dueño |
| Facebook | Página con los mismos datos, aunque se use poco. | Agencia |

Booking.com y Airbnb también aparecen mucho en las respuestas de los asistentes, pero cobran comisión: es una decisión de negocio del dueño, no de SEO.

### Mes 1 a 3: contenido y menciones

- Páginas del entorno (punto 3.4) con textos del dueño.
- Pedir mención a quien ya habla de la zona: cavas de Sant Sadurní con las que se trabaje, la DO Penedès, blogs de escapadas por Cataluña, prensa comarcal (Anoia Diari, La Veu de l'Anoia). Una historia real (la casa de 1898, Casa Parellada, el caballo «Macho») funciona mejor que una nota de prensa.
- Mantener la web al día: los precios, normas y días del restaurante ya salen de Maite en `llms.txt`.

## Qué hace la gente con Claude para SEO (investigación, octubre 2026)

No hay casos publicados de un hotel concreto que haya automatizado su SEO con Claude con resultados medidos; lo que hay son agencias y guías que describen el mismo patrón, y es el que se ha copiado aquí:

- **Claude como orquestador** que lee datos (Search Console, Analytics, herramientas de palabras clave) y redacta informes y borradores, con una persona que decide qué se publica. Las agencias citan ahorros de una jornada de informe mensual a menos de dos horas, pero son cifras propias, no estudios independientes ([TripleDart](https://www.tripledart.com/ai-seo/claude-for-seo), [Databar](https://databar.ai/blog/article/automate-seo-claude-code), [SE Ranking](https://seranking.com/blog/claude-code-for-seo/)). Se aconseja empezar por un flujo estrecho: aquí, la agenda y el informe semanal.
- **Qué hace que un asistente cite una web**: el estudio de Princeton sobre «Generative Engine Optimization» midió hasta un 40 % más de visibilidad añadiendo datos concretos, citas y fuentes, y ninguna mejora (o peor) repitiendo palabras clave ([arXiv 2311.09735](https://arxiv.org/html/2311.09735v3)). Por eso `llms.txt` y la agenda llevan cifras, fechas y fuentes.
- **Hoteles y asistentes**: las agencias del sector coinciden en que los asistentes dan una lista corta de opciones y el huésped a menudo no llega a la web; lo que entra en esa lista sale de la ficha de Google, las reseñas y datos estructurados claros ([Gourmet Marketing](https://www.gourmetmarketing.net/blog/how-do-we-get-found-by-ai-assistants-not-just-google), [Hospitality Net](https://www.hospitalitynet.org/opinion/4125743.html), [UpHotel](https://uphotel.agency/geo-ai-optimisation-for-hotels/)).
- **Lo que no se hace**: generar páginas en serie («casa rural en [pueblo]» × 50) con IA. Google lo trata como «scaled content abuse» y lo hunde ([Innsight](https://www.innsight.com/blog/google-ai-search-spam-rules-for-hoteliers)).
- **Reseñas de Google en la web**: la API da como mucho cinco reseñas, obliga a mostrar el autor junto a cada una y no deja guardarlas ([política de Places API](https://developers.google.com/maps/documentation/places/web-service/policies)).

## 5. Cómo medir

| Qué | Dónde | Frecuencia |
| --- | --- | --- |
| Impresiones y clics por página e idioma; consultas | Search Console, Bing Webmaster Tools | Mensual |
| Llamadas, rutas y clics a la web desde Maps | Google Business Profile → Rendimiento | Mensual |
| Visitas que vienen de asistentes (chatgpt.com, perplexity.ai, gemini.google.com, claude.ai, copilot.microsoft.com) | GA4 → Adquisición → Fuente/medio (ChatGPT añade `utm_source=chatgpt.com`) | Mensual |
| Visitas de los rastreadores de IA (GPTBot, ClaudeBot, PerplexityBot…) | Cloudflare → AI Crawl Control o Analytics | Mensual |
| Si los asistentes recomiendan la casa y si los datos son correctos | Lista de preguntas fija (abajo) en ChatGPT con búsqueda, Gemini, Perplexity, Claude con búsqueda y Google (AI Overview), apuntando en una hoja: si sale, en qué posición, qué dice y si algún dato está mal | Mensual |

Preguntas de prueba (siempre las mismas, en una ventana sin sesión):

1. «Casa rural cerca de Montserrat para dos personas»
2. «Dónde dormir en el Penedès cerca de Sant Sadurní»
3. «Allotjament rural a l'Anoia amb restaurant»
4. «Apartamento rural con cocina cerca de Barcelona para un fin de semana»
5. «Rural guesthouse near Montserrat and the cava wineries»
6. «Hotel con encanto en Piera»
7. «Qué hacer en El Bedorc»
8. «La Casa Vella El Bedorc opiniones»
9. «La Casa Vella El Bedorc precio»
10. «Restaurante para un grupo de 12 personas en el Anoia»

Las preguntas 8 y 9 sirven para ver si los datos que dan son los correctos (precio, número de alojamientos, teléfono). Si algo sale mal, la fuente suele ser un directorio con datos viejos.

## 6. Reparto

**El dueño** (necesita ser el titular del negocio): verificar y llevar Google Business Profile, Apple Business Connect y TripAdvisor; fotos; responder reseñas y pedirlas a cada huésped; número de registro turístico; altas en el Registre de Turisme, el Ajuntament, Anoia Turisme y Enoturisme Penedès; respuestas a las preguntas del punto 3.3; textos y fotos del entorno.

**La agencia (Instinct)**, junto a Google Ads y Meta que ya lleva: Search Console y Bing Webmaster Tools; GA4 con sus conversiones y la vinculación con Search Console, Ads y Business Profile; revisar Cloudflare (bots y Crawler Hints); Bing Places y OpenStreetMap; la hoja mensual de medición en asistentes; avisar si algún directorio publica datos distintos.

**Desde el repositorio** (Claude, cuando haya datos): número de registro, sección de opiniones, preguntas frecuentes, páginas del entorno y el correo de después de la estancia con el enlace para la reseña.
