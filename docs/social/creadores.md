# Creadores que repiten

Los creadores del nicho de La Casa Vella con dos o más outliers, para estudiarlos y ver su próximo vídeo antes que nadie. Lo mantiene `social-creadores` cada lunes, después de `social-outliers`.

Actualizado el 29 de octubre de 2026 (primera semana).

## Cómo se cuenta

- **Outlier**: un vídeo con el doble o más de visualizaciones que la mediana de los 30 últimos vídeos de su canal. «Por encima de la mediana» no basta: la mitad de los vídeos de cualquier canal lo están.
- **Visualizaciones y mediana**: el listado público del canal con `yt-dlp --flat-playlist --playlist-end 30` (pestaña de vídeos), el 29 de octubre de 2026.
- **Fecha y likes**: el feed RSS público del canal (`https://www.youtube.com/feeds/videos.xml?channel_id=...`), que solo trae los 15 últimos vídeos. Lo que queda más atrás tiene la fecha «sin dato» y se sabe solo que es anterior al último vídeo del feed.
- **Interacción por 1.000**: likes por cada 1.000 visualizaciones, del feed. Los comentarios no salen en el feed: sin dato.
- **Antiguo**: publicado antes del 29 de septiembre de 2026 (más de 30 días). Cuenta para saber si el creador repite, pero no como ejemplo actual.
- **Primera frase**: sin dato en todos. Esta semana no se ha abierto ningún vídeo para escucharlo.
- **Cómo graba**: sale del título y la duración, no de ver el vídeo. Hay que confirmarlo viéndolo.

## Lista de seguimiento

Cada lunes, `yt-dlp --flat-playlist --playlist-end 30 -J https://www.youtube.com/channel/<id>/videos` y el feed RSS de cada uno.

| Cuenta | Canal | Outliers | Actuales (30 días) | Likes por 1.000 en sus outliers |
|---|---|---|---|---|
| Territori Efervescent | [UCQaofmM4lM5ueAQyVgbO97g](https://www.youtube.com/channel/UCQaofmM4lM5ueAQyVgbO97g/videos) | 4 | 1 | 33 (el único con dato) |
| CuinesTV3 | [UCgI4o1czcMHeMClZROI9qtQ](https://www.youtube.com/channel/UCgI4o1czcMHeMClZROI9qtQ/videos) | 3 | 1 (y 2 sin fecha) | 25 (el único con dato) |
| Gramona | [UCX0cj4K0WjUd8rPmLlwo_Og](https://www.youtube.com/channel/UCX0cj4K0WjUd8rPmLlwo_Og/videos) | 7 | 0 | de 13 a 29 |
| Vilarnau | [UC1oAX03klCzyeQZRyDKOkuQ](https://www.youtube.com/channel/UC1oAX03klCzyeQZRyDKOkuQ/videos) | 7 | 0 | de 3 a 15 |
| Jean Leon | [UCwmRddfJ6RTu1RqX-B5vdAw](https://www.youtube.com/channel/UCwmRddfJ6RTu1RqX-B5vdAw/videos) | 11 | 1 | de 0 a 34 |

Orden: por likes por 1.000 en sus outliers. Las cifras son de cuentas pequeñas (de 38 a 28.900 suscriptores, según yt-dlp): un outlier aquí son decenas o pocos miles de visualizaciones.

## Fichas

### 1. Territori Efervescent

- **Cuenta**: [Territori Efervescent en YouTube](https://www.youtube.com/channel/UCQaofmM4lM5ueAQyVgbO97g/videos). Elaboradores de vinos espumosos del Penedès. 38 suscriptores, mediana de 31,5 visualizaciones.
- **Outliers**: 4.
  - [En què consisteix el mètode ancestral en els vins](https://www.youtube.com/watch?v=z70S6gBYsyU): 121 visualizaciones, 3,8 veces, 21 de octubre de 2026, 33 likes por 1.000.
  - [Les varietats principals del Penedès: Macabeu, Xarel·lo i Parellada](https://www.youtube.com/watch?v=ZZb1Qnaxttk): 156, 5,0 veces, antiguo (anterior al 10 de septiembre de 2026), likes sin dato.
  - [How to Open a Bottle of Sparkling Wine Correctly](https://www.youtube.com/watch?v=kxVYd9Sehu0) (título tal como lo da el listado): 126, 4,0 veces, antiguo (anterior al 10 de septiembre), likes sin dato.
  - [The Voice of Eva Plazas, Vilarnau](https://www.youtube.com/watch?v=gyQRCOGgHmw) (título del listado): 63, 2,0 veces, antiguo (anterior al 10 de septiembre), likes sin dato.
  - No cuenta: la [V Trobada a Cal Feru](https://www.youtube.com/watch?v=j5ztZDjidzU) (57) daba 2,2 veces con la mediana de `social.py` (26), pero con los 30 últimos vídeos (mediana 31,5) se queda en 1,8.
- **Su mejor primera frase**: sin dato (no visto).
- **Cómo graba**: dos formatos. Explicaciones de 4 a 7 minutos sobre una sola pregunta del vino (el método ancestral, las tres variedades, cómo abrir la botella) y una serie de entrevistas cortas a elaboradores («La Veu de...», de 1,5 a 5 minutos). Tres de sus cuatro outliers son explicaciones; las entrevistas se quedan casi todas por debajo de la mediana.
- **Para colaborar**: sí. Es exactamente el público del vino y el cava del Penedès, y hacen encuentros en Sant Sadurní (la V Trobada en Cal Feru, el 2 de octubre). La casa puede ofrecerse para un tast o para alojar a quien venga a la próxima trobada. Lo que se puede copiar ya: una pregunta, una respuesta («Per què el xarel·lo?»).

### 2. CuinesTV3

- **Cuenta**: [CuinesTV3 en YouTube](https://www.youtube.com/channel/UCgI4o1czcMHeMClZROI9qtQ/videos). El programa de cocina de TV3. 28.900 suscriptores, mediana de 556 visualizaciones.
- **Outliers**: 3.
  - [Sopa de ceba en un panet](https://www.youtube.com/watch?v=P-mOqdhF-VA): 1.200 en el listado (1.246 en el feed), 2,2 veces, 17 de octubre de 2026, 25 likes por 1.000.
  - [Entrepà de pollastre marinat amb feta i raïm](https://www.youtube.com/watch?v=dNWktnKzxQ8): 1.400, 2,5 veces, fecha sin dato (anterior al 17 de octubre), likes sin dato.
  - [Pastís de nous pecanes](https://www.youtube.com/watch?v=M3kXkxOR7-Q): 1.200, 2,2 veces, fecha sin dato (anterior al 17 de octubre), likes sin dato.
- **Su mejor primera frase**: sin dato (no visto).
- **Cómo graba**: recetas de programa de televisión en plató, de 8 a 17 minutos, con cuatro cocineros que se turnan (Marc Ribas, Gessamí Caramés, Arnau París, Rais Esteve). Publica unos siete vídeos por semana. Los panellets salats, que salían en los outliers de la semana, se quedan en 1,3 veces aquí.
- **Para colaborar**: no. Es una cadena pública, no un creador. Se mira por el público catalán de cocina, el mismo que el del restaurante: recetas de temporada con un giro (la sopa de cebolla servida dentro del pan).

### 3. Gramona

- **Cuenta**: [Gramona en YouTube](https://www.youtube.com/channel/UCX0cj4K0WjUd8rPmLlwo_Og/videos). Caves de Sant Sadurní. 430 suscriptores, mediana de 128,5 visualizaciones.
- **Outliers**: 7, todos antiguos.
  - [Una vida escoltant la veu de la nostra terra](https://www.youtube.com/watch?v=cO07QAz6bn0): 1.600 en el listado (1.639 en el feed), 12,5 veces, 15 de diciembre de 2025, 13 likes por 1.000.
  - [Les veus de la terra: Marisol Garrido](https://www.youtube.com/watch?v=n8D_EyJ4Ltg): 1.100 (1.166), 8,6 veces, 8 de octubre de 2025, 19 por 1.000.
  - [Les veus de la terra](https://www.youtube.com/watch?v=KTLX7WcvJKU): 660, 5,1 veces, 8 de octubre de 2025, 14 por 1.000.
  - [Les veus de la terra: Quim Vila](https://www.youtube.com/watch?v=8aZ8o9gWUp8): 394, 3,1 veces, sin fecha (anterior al 8 de octubre de 2025), likes sin dato.
  - [Les veus de la terra: Joaquín Cámara](https://www.youtube.com/watch?v=RqzXGJS6Dwk): 345, 2,7 veces, sin fecha (anterior al 8 de octubre de 2025), likes sin dato.
  - [Les veus de la terra: Ruth Troyano](https://www.youtube.com/watch?v=LTC2qUIOIMs): 297, 2,3 veces, 8 de octubre de 2025, 20 por 1.000.
  - [Les veus de la terra: Amaya Cervera](https://www.youtube.com/watch?v=zIoIh4drfu8): 280, 2,2 veces, 8 de octubre de 2025, 29 por 1.000.
- **Su mejor primera frase**: sin dato (no visto).
- **Cómo graba**: una serie de entrevistas de 4 a 7 minutos a gente del vino («Les veus de la terra») y piezas de marca cortas (la de diciembre dura un minuto). Su vídeo actual, [La desena verema](https://www.youtube.com/watch?v=-gpDVacbhk4) (29 de septiembre), se queda en 1,6 veces.
- **Para colaborar**: como bodega vecina, no como creador. Está a 15 minutos y su público es el de la casa (enoturismo). Un plan de «dormir a la Casa Vella i visitar Gramona» tiene sentido; su canal publica poco (un vídeo desde diciembre de 2025).

### 4. Vilarnau

- **Cuenta**: [Vilarnau en YouTube](https://www.youtube.com/channel/UC1oAX03klCzyeQZRyDKOkuQ/videos). Caves de Sant Sadurní. 337 suscriptores, mediana de 215 visualizaciones. No salía en los outliers de la semana; se añade desde los datos de `social.py` (su vídeo de esta semana se queda en 0,2 veces).
- **Outliers**: 7, todos antiguos.
  - [Cómo podar una viña en invierno](https://www.youtube.com/watch?v=0WK5GRdrJYc): 54.000 en el listado (54.958 en el feed), 251 veces, 18 de enero de 2021, 5 likes por 1.000.
  - [Elaboración del Cava: El Tiraje](https://www.youtube.com/watch?v=Len_KjNsNgg): 2.100 (2.144), 9,8 veces, 5 de enero de 2021, 15 por 1.000.
  - [Emparrado con palos de castaño](https://www.youtube.com/watch?v=fvskg3LOfIA): 1.700, 7,9 veces, sin fecha (anterior al 25 de mayo de 2020), likes sin dato.
  - [¿Cómo se elabora el cava? Primeros pasos](https://www.youtube.com/watch?v=A5IM6Rm2qsA): 1.300 (1.395), 6,0 veces, 17 de septiembre de 2020, 15 por 1.000.
  - [Los beneficios del rosado](https://www.youtube.com/watch?v=pFI7i6noYE4): 1.000, 4,7 veces, sin fecha (anterior al 25 de mayo de 2020), likes sin dato.
  - [¿Cómo abrir, catar y servir un cava rosado?](https://www.youtube.com/watch?v=yEgCM7Wt33o): 997, 4,6 veces, sin fecha (anterior al 25 de mayo de 2020), likes sin dato.
  - [Vilarnau, a cava winery from the sky](https://www.youtube.com/watch?v=gbK-I4L5zcY): 608, 2,8 veces, 3 de junio de 2020, 3 por 1.000.
- **Su mejor primera frase**: sin dato (no visto).
- **Cómo graba**: tutoriales prácticos en la viña y la cava, de 40 segundos a 4 minutos («cómo podar», «cómo se elabora»). Los tutoriales de trabajo en la viña son los que más ganan; las catas largas no.
- **Para colaborar**: como bodega vecina para enoturismo, igual que Gramona. Su canal está casi parado (un vídeo en 2024 y uno en 2026). Lo que enseña: un «cómo se hace» del campo sigue sumando años después.

### 5. Jean Leon

- **Cuenta**: [Jean Leon en YouTube](https://www.youtube.com/channel/UCwmRddfJ6RTu1RqX-B5vdAw/videos). Bodega del Penedès. 552 suscriptores, mediana de 63,5 visualizaciones.
- **Outliers**: 11. Uno actual y diez antiguos:
  - [Jean Leon Nativa Forcada ESP](https://www.youtube.com/watch?v=qsyIZsQFElc): 178, 2,8 veces, 2 de octubre de 2026, 34 likes por 1.000. Actual.
  - [Jean Leon. A Man. A Time. A Wine 7' (Español)](https://www.youtube.com/watch?v=qKVZ-VzWGe0): 1.000 en el listado (1.022 en el feed), 15,7 veces, 19 de junio de 2024, 10 por 1.000.
  - [Ideas para envolver botellas de vino en Navidad](https://www.youtube.com/watch?v=ajLrvjtN7T4): 869, 13,7 veces, 13 de diciembre de 2023, 8 por 1.000.
  - [Jean Leon. A Man. A Time. A Wine 7' (English)](https://www.youtube.com/watch?v=rVViWq1kfRo): 397, 6,3 veces, 19 de junio de 2024, 20 por 1.000.
  - [La Bodega, Jean Leon](https://www.youtube.com/watch?v=eGvADx-0pzQ): 350, 5,5 veces, sin fecha (anterior al 30 de marzo de 2022), likes sin dato.
  - [Vinya La Scala Cabernet Sauvignon Gran Reserva](https://www.youtube.com/watch?v=c2E99fbmWck): 331, 5,2 veces, 21 de junio de 2022, 9 por 1.000.
  - [Entrevista a Víctor Conde](https://www.youtube.com/watch?v=aVFO0mCkdq4): 277, 4,4 veces, 30 de marzo de 2022, 4 por 1.000.
  - [Jean Leon. A Man. A Time. A Wine 3' (Español)](https://www.youtube.com/watch?v=FRg6NQKfey4): 275, 4,3 veces, 19 de junio de 2024, 18 por 1.000.
  - [La Cata, Jean Leon](https://www.youtube.com/watch?v=aLAU7rBb3o8): 273, 4,3 veces, sin fecha (anterior al 30 de marzo de 2022), likes sin dato.
  - [Jean Leon. A Man. A Time. A Wine 7' (Catalán)](https://www.youtube.com/watch?v=ZbCiSqo54Ek): 162, 2,6 veces, 19 de junio de 2024, 0 por 1.000.
  - [Jean Leon. A Man. A Time. A Wine 3' (English)](https://www.youtube.com/watch?v=1IVrPhMSgW8): 148, 2,3 veces, 19 de junio de 2024, 7 por 1.000.
- **Su mejor primera frase**: sin dato (no visto).
- **Cómo graba**: piezas de marca (presentación de un vino, documental de 3 y 8 minutos sobre el fundador), cada una en tres idiomas. Eso reparte las visualizaciones y baja la mediana: parte de sus outliers se explica por eso. El vídeo más claro es el de envolver botellas por Navidad: 36 segundos, un consejo práctico y con fecha.
- **Para colaborar**: como bodega vecina, no como creador. Para la casa lo útil es el de Navidad: un vídeo corto, práctico y de temporada.

## Descartados esta semana

- **Grup ETV-Terramar**: tiene cinco vídeos por encima del doble de su mediana, pero son programas de la televisión local (historia, entrevistas, «Misteris»), no del nicho. Su único vídeo del nicho, la [verema a Pacs del Penedès](https://www.youtube.com/watch?v=iQ0FWJ5vHkk), se queda en 1,5 veces. No pasa la auditoría.
- **VIANÉDITA**: solo tres vídeos y ninguno llega al doble de la mediana (392). El de [Corpinnat](https://www.youtube.com/watch?v=4TD5qI7Wz_k) se queda en 1,1 veces.
- **La Cocina de Nube Rosa y Lila, Ros (Recetas caseras) y 3CatHumor**: no se leyeron. Son canales de recetas en castellano y de humor, con un solo vídeo de temporada (panellets); no son cuentas que el público de la casa siga por escapadas, vino o Cataluña.

## Lo que no se pudo ver

- TikTok e Instagram: sin enlaces en `docs/social/enlaces.md` y no se buscan saltando controles anti-bots.
- Shorts: solo se leyó la pestaña de vídeos de cada canal.
- Primeras frases, guardados, compartidos y comentarios: sin dato.

## Historial

- 2026-10-29: primera lista. Cinco creadores con dos o más outliers, solo tres con un outlier de los últimos 30 días (Territori Efervescent, CuinesTV3 y Jean Leon).
