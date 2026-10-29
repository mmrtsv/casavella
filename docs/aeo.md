# Preguntas de compra y fuentes (AEO)

Cómo trabaja La Casa Vella su visibilidad en Google y en los asistentes de IA, pregunta por pregunta. Es el método con el que Granola multiplicó por 47 en siete meses los usuarios nuevos que le llegan de búsquedas con IA, según el [hilo de jam del 28 de octubre de 2026](https://x.com/wespreadjam/status/2115568290307469548), adaptado a una casa rural de cuatro alojamientos. Lo ejecuta cada semana la rutina (`docs/seo-rutina.md`, paso 4); `docs/seo.md` tiene el plan general.

La idea en una línea: no se publica más contenido a ciegas. Se mide qué preguntas de compra se pierden, se diagnostica por qué, se hace un cambio concreto y se vuelve a medir.

## 1. Las preguntas

Salen de las decisiones que toma un huésped antes de reservar, no de palabras clave. Casi nadie busca El Bedorc ni Piera: se busca una escapada cerca de Barcelona, una zona (Montserrat, el Penedès, las cavas) o un plan. Por eso la mayoría son genéricas, y una sola pregunta de marca comprueba que los datos de la casa salen bien. Cada pregunta tiene la página propia que debería responderla. Se buscan siempre igual, para poder comparar semana a semana.

| Id | Decisión | Pregunta | Página propia que la responde |
| --- | --- | --- | --- |
| P16 | Escapada | escapada romántica cerca de Barcelona fin de semana | `/es/guias/fin-de-semana-en-el-penedes/` |
| P17 | Escapada | romantic getaway near Barcelona countryside vineyards | `/en/guides/weekend-in-the-penedes-from-barcelona/` |
| P18 | Escapada | escapada rural cerca de Barcelona con encanto | `/es/`, `/es/guias/fin-de-semana-en-el-penedes/` |
| P19 | Escapada | qué hacer cerca de Barcelona en coche un fin de semana | `/es/guias/fin-de-semana-en-el-penedes/` |
| P20 | Escapada | escapada de cap de setmana a prop de Barcelona | `/guies/cap-de-setmana-al-penedes/` |
| P14 | Escapada | casa rural con restaurante cerca de Barcelona escapada pareja | `/es/` |
| P1 | Zona | casa rural cerca de Montserrat para dos personas | `/es/` |
| P2 | Zona | dónde dormir cerca de Sant Sadurní d'Anoia cavas | `/es/guias/cavas-de-sant-sadurni/` |
| P4 | Zona | where to stay near Montserrat and Penedès wineries instead of Barcelona | `/en/`, `/en/guides/cava-cellars-sant-sadurni/` |
| P5 | Tipo de alojamiento | apartamento rural con cocina cerca de Barcelona fin de semana Penedès | `/es/` (alojamientos) |
| P7 | Plan del viaje | escapada fin de semana Montserrat y cavas dónde alojarse | `/es/guias/fin-de-semana-en-el-penedes/` |
| P15 | Plan del viaje | Montserrat day trip from Barcelona or stay overnight nearby village | `/en/guides/montserrat-from-el-bedorc/` |
| P8 | Temporada | calçotada cerca de Barcelona 2027 | `/es/guias/temporada-de-calcots-2027/` |
| P9 | Grupo o celebración | restaurante para grupo de 12 personas Anoia Piera celebración | `/es/` (restaurante, `#esdeveniment`) |
| P10 | Marca: datos correctos | La Casa Vella El Bedorc Piera | `/`, `/llms.txt` |

Retiradas el 29 de octubre por demasiado concretas (casi nadie las busca): P3 (allotjament rural Anoia), P6 (casa rural Piera), P11 y P12 (opiniones y precio de la casa; P10 ya comprueba los datos), P13 (qué ver en El Bedorc; la guía se queda). Sus resultados siguen abajo.

Se añade una pregunta cuando aparece una decisión nueva (una temporada, una oferta) y se quita solo si deja de tener sentido. Nunca más de 15: el objetivo es seguirlas, no acumularlas.

## 2. Diagnóstico de cada pregunta perdida

Antes de crear nada, cada pregunta en la que no sale la casa recibe uno o varios de estos diagnósticos:

| Código | Qué pasa | Qué se hace |
| --- | --- | --- |
| **Rastreo** | La página existe pero el buscador no la tiene (sin indexar, bloqueada, error). | Search Console y Bing Webmaster Tools; nada de contenido nuevo hasta resolverlo. |
| **Floja** | La página existe pero no responde bien a esa pregunta. | Mejorar esa página. No se publica otra que compita con ella. |
| **Falta** | Ninguna página responde la pregunta. | Una página nueva, solo si es una pregunta real y con fuentes (las reglas de guías de `docs/seo-rutina.md`, sin páginas en serie). |
| **Terceros** | La respuesta sale de sitios ajenos que no nombran la casa o la nombran mal. | Una acción de la sección 3 sobre esa fuente concreta. |

**Floja** va antes que **Falta**: si una página ya trata el tema, se mejora.

Los problemas técnicos se priorizan igual: primero los que afectan a una página ligada a una pregunta de la tabla; los avisos generales del sitio, después.

## 3. Fuentes: propias, reclamar, ganar, corregir

Para cada pregunta perdida se miran las fuentes que salen en su lugar y se decide qué tipo de fuente es. Cada tipo pide una acción distinta.

- **Propias**: lo que controla la casa. Se cambia desde el repositorio o la ficha.
- **Reclamar**: fichas y directorios donde la casa puede darse de alta o tomar el control.
- **Ganar**: menciones editoriales, reseñas y conversaciones que hay que merecer.
- **Corregir**: datos viejos o falsos que hay que pedir que cambien.

Fuentes vistas en la primera medición (29 de octubre de 2026):

| Fuente | Tipo | Sale en | Acción | Quién |
| --- | --- | --- | --- | --- |
| casavellarural.com y sus guías | Propias | ninguna todavía | Indexar (Search Console, Bing); luego, la mejora de la sección 5 | Agencia, Claude |
| Google Business Profile | Propias | P10, P11 | Lo de `docs/seo.md` (categorías, fotos, una publicación por semana) | Dueño |
| [Escapada Rural](https://www.escapadarural.com/casas-rurales/anoia) | Reclamar | P1, P3, P5 | Ficha con los datos de NAP; en la descripción, Montserrat a 45 minutos y Sant Sadurní a 15 | Dueño |
| [Clubrural](https://www.clubrural.com/casas-rurales/barcelona/sant-sadurni-d0-anoia) | Reclamar | P2 | Ficha; aparece en «dónde dormir cerca de Sant Sadurní» | Dueño |
| [casasrurales.net](https://www.casasrurales.net/apartamentos-rurales/anoia) | Reclamar | P1, P3, P5 | Ficha en «apartamentos rurales Anoia» (los dos apartamentos tienen cocina) | Dueño |
| [tuscasasrurales.com, Piera](https://www.tuscasasrurales.com/casas-rurales-piera-1142.htm) | Reclamar | P6 | Lista dos casas en Piera, una en El Bedorc (Maset de la Costa). Alta de La Casa Vella | Dueño |
| [Femturisme, dónde dormir en Piera](https://femturisme.cat/pobles/piera/on-dormir) | Reclamar | P1, P2, P3 | La página de Piera no lista ningún alojamiento de Piera. Pedir el alta (también sale en Sant Sadurní y en las rutas del Anoia) | Dueño |
| [Gastroranking, Piera](https://gastroranking.es/restaurantes/barcelona/piera/) | Reclamar | P9 | Reclamar el restaurante con los días que abre y los grupos de 8 a 16 | Dueño |
| [Barcelona és molt més](https://www.barcelonaesmoltmes.cat/en/-/alojamientos-encanto-dormir-via-blava) (Diputació) | Ganar | P3 | Proponer la casa para sus listas de alojamientos con encanto del Anoia | Dueño |
| [Time Out Barcelona](https://www.timeout.es/barcelona/es/viaje/alt-penedes-un-dia-en-sant-sadurni-danoia) | Ganar | P2, P3 | Historia real (la casa de 1898, la familia, el restaurante) a quien escribe las escapadas | Dueño o agencia |
| [Penedès Turisme](https://www.penedesturisme.cat/en/activity/weekend-wine-getaway-spa) | Ganar | P4 | Ver si una escapada con una cava de Sant Sadurní puede entrar como actividad | Dueño |
| [elbedorc.com](https://elbedorc.com) | Ganar | P10 | La web del pueblo sale en la búsqueda de la casa: pedir una mención con enlace | Dueño |
| [Sensación Rural, casas rurales con restaurante](https://www.sensacionrural.es/casas-rurales-en-barcelona/con-restaurante) | Reclamar | P14 | Lista 27 alojamientos rurales con restaurante en la provincia; la casa encaja exactamente | Dueño |
| TripAdvisor | Reclamar | P11 | Las respuestas sobre opiniones mandan a «Google Maps, Tripadvisor o Booking»; en TripAdvisor no hay ficha. Dos fichas: alojamiento y restaurante | Dueño |
| [Escapada Rural, blog de calçotadas](https://www.escapadarural.com/blog/casas-rurales-para-disfrutar-de-una-rica-calcotada/) | Ganar | P8 | El artículo es de 2024 y lo citan los asistentes para 2027. Si el restaurante hace calçots, pedir entrar en la próxima edición | Dueño |
| [Penedès Turisme, calçotada entre viñas](https://www.penedesturisme.cat/en/calcotada-among-vineyards-penedes) | Ganar | P8 | Lo mismo, para la temporada 2027 | Dueño |
| [Barcelona Secreta](https://barcelonasecreta.com/en/eat-calcots-barcelona/) y [Barcelona Urbana](https://barcelonaurbana.com/blog/donde-comer-calcots-cerca-barcelona) | Ganar | P8 | Listas de dónde comer calçots cerca de Barcelona; se actualizan cada invierno | Dueño o agencia |
| [Picuco](https://www.picuco.com/es-es/trips/escapadas/penedes-experiences/escapada-enologica-cultural-penedes/) | Ganar | P4 | Vende escapadas de 2 noches en el Penedès con casa rural; ver si la casa puede ser uno de sus alojamientos | Dueño |
| [Barcelona Secreta, escapadas](https://barcelonasecreta.com/en/getaways-barcelona/) y [Barcelona Urbana, escapadas de fin de semana](https://barcelonaurbana.com/blog/escapadas-fin-de-semana-desde-barcelona) | Ganar | P17, P19 | Listas que citan los asistentes para «escapada cerca de Barcelona». Proponer el plan del Penedès (cava, Montserrat, la casa de 1898) a quien las escribe | Instinct |
| [Sensación Rural, escapada de fin de semana cerca de Barcelona](https://www.sensacionrural.es/escapada-fin-semana-cerca-barcelona) | Reclamar | P14, P18 | Directorio con artículos propios; con la ficha, pedir entrar en el artículo | Dueño o Instinct |
| [Som Rurals, casas rurales románticas en Barcelona](https://www.somrurals.com/en/cases-rurals/barcelona/all/pers:0/price:all/habitaciones:all/theme:6L) | Reclamar | P17 | Directorio catalán con filtro «romántico»; ficha con las habitaciones para dos | Dueño o Instinct |
| [Petits Grans Hotels de Catalunya, escapadas románticas](https://www.petitsgranshotelsdecatalunya.com/en/getaways/romantic-breaks) | Reclamar | P16, P17 | Asociación de hoteles pequeños; ver si acepta casas rurales y qué cuesta | Dueño |
| [Into the Vineyard](https://www.intothevineyard.com/journal/where-to-stay-near-barcelona-best-vineyard-stays-wine-estate-accommodations) | Ganar | P4, P17 | Artículo en inglés sobre dónde dormir entre viñas cerca de Barcelona; pedir que incluyan la casa | Instinct |
| [Yumping, escapadas](https://www.yumping.com/escapadas/barcelona) | Reclamar | P16 | Vende escapadas de fin de semana (enoturismo en el Penedès); ver si puede vender una con la casa y una cava | Dueño |
| Foros (Rick Steves, TripAdvisor, Reddit) | Ganar | P4, P7, P15 | Lo de la rutina, paso 5: respuestas útiles en primera persona | Dueño |
| [gites.fr](https://www.gites.fr/gites_piera_277354.html) y [cybevasion.fr](https://www.cybevasion.fr/tous-les-hebergements-piera-v277354.html) | Corregir | P10 | Sitúan la casa en «Vallbona» y la describen como un gîte de 30 m² para 2. Copian de otro canal (Booking u otro): corregir ahí la ubicación y la descripción | Dueño |

## 4. Google y asistentes, por separado

Una página puede subir en Google y no salir en ChatGPT, y al revés. Se miden aparte:

| Qué | Cómo | Cuándo |
| --- | --- | --- |
| Google | Search Console: impresiones, clics y posición de cada página de la tabla y de las consultas que se parecen a las preguntas | Cada semana en el informe, cuando haya datos |
| Asistentes, aproximación | La rutina busca las preguntas con su buscador (no es Google ni ChatGPT, pero enseña qué fuentes usa una búsqueda con IA) | Cada semana |
| Asistentes, real | Las mismas preguntas en ChatGPT con búsqueda, Gemini, Perplexity y Google (AI Overview), en una ventana sin sesión, como en `docs/seo.md` | Cada mes |
| Lo que importa | Visitas que llegan de chatgpt.com, perplexity.ai, gemini.google.com, claude.ai y copilot.microsoft.com, y reservas de esas visitas (GA4 y PostHog) | Cada mes |

## 5. El ciclo

Cada semana:

1. Buscar las preguntas de la sección 1 y apuntar si sale la casa (web o ficha), en qué posición y qué fuentes salen en su lugar.
2. Diagnosticar cada pregunta perdida (sección 2).
3. Elegir **un** cambio propio concreto (mejorar una página floja, una pregunta sin página) y hacerlo; las acciones sobre terceros van al informe para el dueño.
4. Apuntarlo en el seguimiento de abajo con la fecha.
5. La semana siguiente, volver a buscar y mirar si esa pregunta se ha movido. Lo que mueve visitas o reservas se repite en preguntas parecidas; lo que no, no se repite.

## 6. Seguimiento

«Sale» quiere decir casavellarural.com o una ficha de La Casa Vella entre los resultados del buscador de la rutina.

| Pregunta | 29 oct 2026 | Fuentes en su lugar | Diagnóstico | Cambio |
| --- | --- | --- | --- | --- |
| P1 | No | Escapada Rural, casasrurales.net, Airbnb (Monistrol, El Cavall Bernat), Femturisme | Rastreo, Terceros | |
| P2 | No | Femturisme, Clubrural, Time Out, Hotels.com | Rastreo, Terceros | |
| P3 (retirada) | No | Femturisme, Barcelona és molt més, Time Out (Hotel La Pedra), Escapada Rural | Rastreo, Terceros | |
| P4 | No | Hotels.com, Expedia, intothevineyard.com, Penedès Turisme | Rastreo, Floja: la descripción de `/en/` no dice que las caves están a 15 minutos | 29 oct: la descripción de las tres portadas dice «a 15 minutos de las cavas de Sant Sadurní» |
| P5 | No | Escapada Rural, casasrurales.net, Clubrural, Airbnb | Rastreo, Terceros | |
| P6 (retirada) | No (28 oct) | gites.fr, tuscasasrurales.com | Rastreo, Terceros | |
| P7 | No | ofertitas.es, excursiones de un día (Civitatis, Musement) | Rastreo, Floja: la respuesta dice que no encuentra dónde dormir en el Penedès; las guías de Montserrat y del cava responden cada mitad por separado | 29 oct: la guía del cava gana el apartado «Montserrat y el cava en un fin de semana», enlazado a la de Montserrat |
| P8 | No | Escapada Rural (blog de 2024), Penedès Turisme, Barcelona Secreta, Barcelona Urbana | Rastreo, Terceros. La guía de calçots no dice si el restaurante los hace: falta el dato del dueño | |
| P9 | No | venuu.com, Gastroranking (Piera, Sant Sadurní) | Rastreo, Floja: los grupos de 8 a 16 solo están en el formulario y en `llms.txt`, no en el texto de la página | |
| P10 | Ficha de gites.fr (datos mal) | gites.fr, cybevasion.fr, Wikipedia (Piera), patrimonicultural.diba.cat | Rastreo, Terceros (Corregir) | |
| P11 (retirada) | No (solo gites.fr, ahora con 8,7 y otra vez en Vallbona) | gites.fr; el resto son casas con nombre parecido (La Casa Vella del Pantà, Casa Vella de Mallorca) | Rastreo, Terceros: las 23 opiniones de Google con 5,0 no las ve ningún rastreador | |
| P12 (retirada) | Sin medir | | | |
| P13 (retirada) | No | Fichas de patrimonio de la Diputació (PDF), tuscasasrurales.com (Maset de la Costa) | Falta: ninguna página explica qué ver en El Bedorc; los asistentes lo montan con las fichas de patrimonio | 29 oct: guía «Qué ver en El Bedorc» con las fichas de la Diputació y Castells Catalans |
| P14 | No | Sensación Rural, tuscasasrurales.com, Escapada Rural, Zonas Rurales | Rastreo, Terceros | |
| P15 | No | Blogs que recomiendan dormir en Monistrol de Montserrat | Rastreo, Terceros. La guía de Montserrat ya dice cómo ir desde la casa | |
| P16 | No | Balneario Prats, Senia (Costa Brava), Yumping, Barceló | Rastreo, Falta: ninguna página propia respondía «escapada cerca de Barcelona» | 29 oct: guía «Un fin de semana en el Penedès desde Barcelona» |
| P17 | No | Som Rurals, intothevineyard.com, Barcelona Secreta, Penedès Turisme, Petits Grans Hotels | Rastreo, Falta, Terceros. La respuesta ya dice que el Penedès es la mejor zona, a 30 o 45 minutos, sin nombrar la casa | 29 oct: la misma guía, en inglés |
| P18 | No | Sensación Rural, Escapada Rural, Marie Claire, comiviajeros.com | Rastreo, Terceros | |
| P19 | No | felicesvacaciones.es, Rumbo, Barcelona Urbana; el Penedès sale como ruta del vino | Rastreo, Falta | 29 oct: la guía del fin de semana |
| P20 | Sin medir | | | |

Rastreo, 29 de octubre por la noche: Instinct confirma `/`, `/es/` y `/en/` indexadas en Google, el sitemap en Search Console y Bing, los rastreadores de IA permitidos en Cloudflare, Crawler Hints activo, el correo sin ofuscar y GA4 vinculado con Search Console. Comprobado desde fuera: los rastreadores de IA reciben 200 y el correo se lee en el HTML. Search Console leyó el sitemap con 15 páginas; hoy tiene 21 (faltaban las guías de El Bedorc y del fin de semana): hay que volver a enviarlo.

Tercera ronda (29 de octubre): preguntas genéricas, porque casi nadie busca El Bedorc ni Piera. Las escapadas cerca de Barcelona las ganan listas de medios y directorios (Barcelona Secreta, Barcelona Urbana, Sensación Rural, Som Rurals) y el Penedès sale como la zona recomendada, sin nombrar ninguna casa. Dos líneas: entrar en esas listas (Instinct y el dueño, sección 3) y una página propia que responde la pregunta con datos concretos (la guía del fin de semana).

Segunda ronda (29 de octubre, por la tarde): seis preguntas nuevas o sin medir. Dos cambios propios: la guía de El Bedorc (P13, la única pregunta donde nadie da una respuesta hecha) y las descripciones de las portadas (P4). De paso salió un dato propio mal: la portada y `llms.txt` decían que el castillo está «documentado hace más de mil años»; la primera mención escrita es de 1188 (la torre se atribuye al siglo X, pero sin documento). Corregido en los tres idiomas.

Lectura de la primera medición: la casa no sale en ninguna pregunta y la causa común es **Rastreo** (Search Console tiene la indexación en cola desde el 27 de octubre). Mientras tanto, lo que más pesa son los directorios: Escapada Rural, casasrurales.net, Clubrural y Femturisme salen en casi todas las preguntas de zona y tipo, y la casa no está en ninguno.
