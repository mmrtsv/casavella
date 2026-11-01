# Estrategia de Instagram que Maite hace sola

Lo que decide `lib/plan.js` y por qué. Todo se cambia en Maite (Xarxes socials › Pla › Com planifica) o en este archivo y en el código.

## Calendario

- **Cuándo**: cada lunes a partir de las 8:00 Maite planifica la semana siguiente y la manda por correo a info@. La primera vez también rellena lo que queda de la semana en curso.
- **Revisión**: hasta el domingo a las 23:59 se puede cambiar, quitar o aprobar. Si nadie entra, sale tal cual.
- **Lo manual manda**: si programas un post tuyo un día que el plan ya tenía uno, el del plan se mueve al día libre más cercano de esa semana, a la misma hora; si no queda ninguno, se quita. Un recordatorio de menú no se mueve (dice «Demà», «Avui»): se quita. Lo que tocas (texto, foto, copy, hora) pasa a ser tuyo y el plan ya no lo rehace.

## Frecuencia

- **Feed: 3 posts por semana**, martes y jueves a las 19:30 y sábado a las 10:30 (con 2: martes y sábado; con 4 o 5, se añaden lunes y viernes a mediodía). Más de tres a la semana en una cuenta pequeña baja el alcance de cada uno; menos de dos y el perfil parece parado.
- **Stories: una cada día**, a las 20:30 de lunes a jueves (cuando se mira el móvil en casa), el viernes a las 13:30 (cuando se decide el fin de semana), el sábado a las 11:00 y el domingo a las 19:00. Con dos al día, la segunda a mediodía. Horas de Barcelona.
- **Menús**: además de lo anterior, ver abajo.

## Qué empuja cada pieza, según las reservas

Lee los calendarios de los cuatro alojamientos (las tres semanas siguientes) y las mesas del restaurante.

| Pieza | Qué busca | Si no hay |
|---|---|---|
| Post del martes | El alojamiento con más noches libres los dos fines de semana siguientes. Sin fechas ni precio: el post se queda en la parrilla | La casa |
| Post del jueves | Un día de restaurante con plazas en los 10 días siguientes que no tenga menú propio | El entorno y la temporada |
| Post del sábado | La casa: historia, detalles, una cita | |
| Story del lunes | Dos o más noches libres seguidas entre semana | La casa |
| Story del martes | El entorno | |
| Story del miércoles | Noches libres este fin de semana | La casa |
| Story del jueves | Restaurante con plazas | Fin de semana libre, o el entorno |
| Story del viernes | Última hora: esta noche o mañana | La casa |
| Story del sábado | La casa | |
| Story del domingo | El fin de semana que viene, o entre semana la semana que viene | El entorno |

No repite el mismo alojamiento seguido si hay otro libre. Las stories de alojamiento llevan el enlace a la página de reserva con esas fechas (`?in=…&out=…&stay=…`); las del restaurante, a `#taula`; las demás, a la web.

## Menús y eventos

Un menú hecho en *Generador de posts › Menú* (con sus días) tiene recordatorios propios desde que sale el anuncio, rehechos cada día a las 7:00 y a las 15:00 con las mesas reservadas de cada servicio. Cuanto más vacía la sala, más seguido:

| Días antes | Ocupación | Qué |
|---|---|---|
| 7, 5 y 3 | menos del 80 % | Story (cartel o el menú) a las 21:15 |
| 4 | menos del 50 % | Post a las 19:45, que sustituye al post del plan de ese día |
| 2 y 1 | menos del 90 % | Story a las 21:15 |
| 1 | menos del 60 % | Otra story a las 13:45 |
| El mismo día (cenas) | menos del 90 % | Story a las 12:30 |
| | lleno | Nada |

Como mucho dos recordatorios al día y un post cada cuatro días. A partir del 70 % el cartel dice «Últimes places». Un menú sin días abiertos en Restaurante se recuerda por su primer y último día, sin saber la ocupación. Cada menú puede quedarse sin recordatorios (Com planifica).

## El adhesivo de enlace

La API oficial de Instagram no deja poner el adhesivo de enlace en una story (comprobado en noviembre de 2026). Lo pone el robot de stories (`story-bot/`): entra en la cuenta como la app del móvil y cuelga cada story a su hora con el adhesivo a la página de reserva (las fechas libres, o `#taula` para el restaurante). No es oficial y va contra las normas de Instagram: el dueño lo eligió sabiendo que Instagram puede pedir verificar la entrada o limitar la cuenta.

Si el robot no está o no puede entrar, la story espera a que la cuelgues desde el móvil (correo a las 9:00, «Penja amb l'enllaç» en la app) y, si en 3 horas nadie lo ha hecho, Maite la publica sola sin enlace (la imagen ya dice casavellarural.com).

## Pendiente de medir

El éxito de los menús se mide por las mesas reservadas, que es lo que importa. El alcance de cada post (`/api/social-stats`) lo lee el equipo de redes del lunes (`docs/social/README.md`); cuando haya unas semanas de datos, conviene ajustar horas y temas con lo que funcione.
