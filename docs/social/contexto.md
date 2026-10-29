# Contexto de La Casa Vella para redes

La página que lee cada agente del equipo de redes (`.claude/agents/social-*.md`) antes de hacer nada. Si un dato cambia (precios, días del restaurante, una campaña), se cambia aquí y en su fuente: los precios salen de Maite (`/api/settings`, `/llms.txt`), los anuncios de `ads/README.md`.

Actualizado el 29 de octubre de 2026.

## Negocio

Casa de pueblo de 1898 en El Bedorc (Piera, Anoia), entre viñedos, con Montserrat en el horizonte y el Penedès al lado. Familiar. Dos apartamentos con cocina (Montserrat, La Pineda), dos habitaciones con baño privado (Les Vinyes, Figarot) y un restaurante en la planta baja que abre días concretos, cada uno con su hora. Reserva directa en casavellarural.com, por teléfono o WhatsApp. Instagram: @casavellarural.

## Público

- Parejas de 28 a 65 años de Barcelona y su área (a 45 minutos) que buscan un fin de semana tranquilo sin ir lejos.
- Gente del vino y el cava: enoturismo en el Penedès, las caves de Sant Sadurní a 15 minutos.
- Quien sube a Montserrat y busca dónde dormir cerca.
- Grupos de 8 a 16 para una comida o un evento privado en el restaurante.
- Idiomas: catalán primero, castellano después. Inglés solo para extranjeros que viven en Barcelona.

## Oferta y fechas

- Entre semana, 90 € el apartamento y 70 € la habitación; viernes y sábado, 110 € y 80 €. Un 5 % menos por dos noches y un 10 % desde tres. Comprobar en `/llms.txt` antes de citar un precio.
- Temporadas que dan vídeo: verema (septiembre), castanyada (finales de octubre), Navidad y Cap d'Any, calçotada en la terraza (enero a marzo), la fira del cava de Sant Sadurní, Setmana Santa en Montserrat.
- Campañas activas: las de `ads/README.md`.
- Agenda del entorno con fechas y fuentes: `content/agenda.json`.

## Voz

Tranquila, literal y concreta: 1898, el Bedorc, Montserrat al fondo, las vigas pintadas de verde, el suelo hidráulico. Romántica sin folleto, en la línea de Mas d'en Bruno, Oller del Mas y Son Brull. Sin exclamaciones, sin «increíble», sin «descubre», sin emojis de relleno, sin rayas largas. «Reserva per DM» solo cuando el post es de algo concreto (un menú, una fecha, un fin de semana). Las reglas de `.claude/rules/` valen también aquí.

## A quién mirar

- Referencias de tono y formato (no compiten por precio): Mas d'en Bruno, Oller del Mas, Son Brull.
- Competencia directa: casas rurales y hoteles pequeños del Anoia, el Penedès y el entorno de Montserrat. La lista de 5 a 10 cuentas la mantiene `social-competencia` en `docs/social/competencia.md`, cada una con su enlace; el dueño la confirma.
- Cuentas de la zona que la gente sigue: bodegas y caves del Penedès, Enoturisme Penedès, DO Penedès, Anoia Turisme, la abadía de Montserrat, creadores de escapadas cerca de Barcelona.

## Búsquedas y exclusiones

Frases que la gente escribe en el buscador de TikTok, Instagram y YouTube. Las mantiene `social-nicho` y `social.py` las busca cada lunes:

- escapada rural cerca de Barcelona
- casa rural Montserrat
- enoturisme Penedès
- caves Sant Sadurní
- ruta entre vinyes Penedès
- calçotada a la terrassa
- cap de setmana a l'Anoia
- verema Penedès

Excluir (si una de estas palabras sale en el título o la descripción, el vídeo no cuenta; `social.py` las lee de aquí):

- Caballé
- Pineda de Mar
- Salou
- cava de hielo
- tractor
- en venta
- Reseña de hotel
- Hotel Review
- Reseña del hotel
