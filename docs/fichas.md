# Fichas: indexar la web y darse de alta en los directorios

Lo que necesita la cuenta del dueño (Google, Bing, los directorios) y por eso no puede hacerlo Claude. Cada paso con el enlace y el texto listo para pegar. Por qué estos sitios: `docs/aeo.md`, sección 3. Escrito el 29 de octubre de 2026.

Lo que Claude ya hace solo: avisa a Bing (y a Yandex y Seznam) por IndexNow cada vez que cambia la web (`indexnow.py`).

## Antes de empezar: el número de registro turístico

Casi todos los directorios solo aceptan alojamientos inscritos en el Registre de Turisme de Catalunya (tuscasasrurales.com lo dice expresamente) y piden el número. Hoy el pie de la web dice «per confirmar». Búscalo en el documento de alta de la Generalitat o en el Ajuntament de Piera; sin él, Escapada Rural, Clubrural y los demás pueden rechazar la ficha. Cuando lo tengas, pásalo a Claude para ponerlo en la web, `llms.txt` y los datos estructurados.

## 1. Google Search Console (10 minutos)

1. Entra en [search.google.com/search-console](https://search.google.com/search-console) con la cuenta de Google de la casa.
2. Si ya existe la propiedad `casavellarural.com`, ve al punto 4.
3. Añadir propiedad → **Dominio** → `casavellarural.com`. Google da un registro TXT. En Cloudflare: el dominio → DNS → Records → Add record → tipo TXT, nombre `@`, contenido el que da Google → Save. Vuelve a Search Console → Verificar (puede tardar unos minutos).
4. Sitemaps → escribe `sitemap.xml` → Enviar.
5. Inspección de URLs (barra de arriba): pega `https://casavellarural.com/`, espera y pulsa **Solicitar indexación**. Repite con `https://casavellarural.com/es/` y `https://casavellarural.com/en/`.
6. Si al inspeccionar dice «La URL está en Google», no hace falta nada más.

## 2. Bing Webmaster Tools (5 minutos)

Bing es el buscador que usan ChatGPT y Copilot.

1. Entra en [bing.com/webmasters](https://www.bing.com/webmasters) con una cuenta de Microsoft o de Google.
2. **Import from Google Search Console** → autoriza → marca `casavellarural.com` → Import. Así se verifica sola y trae el sitemap.
3. Si no deja importar: Add site → `https://casavellarural.com/` → verificación por DNS en Cloudflare (igual que el punto 1.3) → Sitemaps → `https://casavellarural.com/sitemap.xml`.

## 3. Directorios

Datos, siempre exactamente iguales en todos:

- Nombre: **La Casa Vella**
- Dirección: **Carrer Munné Orpí, 23, 08784 El Bedorc (Piera), Barcelona**
- Teléfono: **+34 667 40 98 59**
- Correo: **info@casavellarural.com**
- Web: **https://casavellarural.com/es/** (en los que estén en catalán, `https://casavellarural.com/`)
- Tipo: casa rural, alquiler por alojamientos (no casa entera)
- Entrada desde las 15:00, salida hasta las 11:00
- Alojamientos:
  - **Montserrat**, apartamento, hasta 3 personas, 1 dormitorio y sofá cama, cocina equipada. 90 € la noche de domingo a jueves, 110 € viernes y sábado.
  - **La Pineda**, apartamento, hasta 3 personas, dormitorio doble, cocina equipada. 90 € y 110 €.
  - **Les Vinyes**, habitación, 2 personas, cama doble, baño privado. 70 € y 80 €.
  - **Figarot**, habitación, 2 personas, cama doble, baño privado. 70 € y 80 €.
- Servicios: wifi gratuito, aparcamiento gratuito, aire acondicionado, calefacción, baño privado, smart TV, nevera, toallas y ropa de cama, jardín con terraza, restaurante.
- Fotos: las de `img/` del repositorio (las mismas de la web). Al menos la fachada, cada alojamiento, el restaurante y la vista a Montserrat.

Textos completos por directorio (descripciones corta y larga en tres idiomas, alojamientos, restaurante, OpenStreetMap): `docs/fichas-textos.md`.

### Descripción en castellano

> La Casa Vella es una casa de pueblo de 1898 en El Bedorc (Piera, Anoia), entre viñas y con Montserrat en el horizonte. La familia la ha restaurado conservando los muros de piedra y las vigas de madera. Tiene dos apartamentos con cocina (Montserrat y La Pineda, hasta 3 personas) y dos habitaciones con baño privado (Les Vinyes y Figarot, 2 personas). Wifi, aire acondicionado y aparcamiento gratuitos. En la planta baja, un restaurante que abre los días anunciados y para grupos de 8 a 16 personas. Sant Sadurní d'Anoia y sus cavas están a 15 minutos; Montserrat y Barcelona, a 45. Los caminos entre viñas empiezan en la puerta.

### Descripció en català

> La Casa Vella és una casa de poble de 1898 al Bedorc (Piera, Anoia), entre vinyes i amb Montserrat a l'horitzó. La família l'ha restaurat conservant els murs de pedra i les bigues de fusta. Té dos apartaments amb cuina (Montserrat i La Pineda, fins a 3 persones) i dues habitacions amb bany privat (Les Vinyes i Figarot, 2 persones). Wifi, aire condicionat i aparcament gratuïts. A la planta baixa, un restaurant que obre els dies anunciats i per a grups de 8 a 16 persones. Sant Sadurní d'Anoia i les seves caves són a 15 minuts; Montserrat i Barcelona, a 45. Els camins entre vinyes comencen a la porta.

### Uno por uno

| Directorio | Dónde | Coste según el propio sitio | Notas |
| --- | --- | --- | --- |
| Escapada Rural | [Acceso propietarios](https://www.escapadarural.com/propietario/acceso) → dar de alta una casa | Alta gratuita; te llama un especialista en menos de 24 h laborables para activarla | Sale en «casa rural cerca de Montserrat», «Anoia» y «apartamento con cocina». Si ofrecen un plan de pago, empieza por el gratuito y mide reservas |
| Clubrural | [clubrural.com/anfitrion](https://www.clubrural.com/anfitrion/) | Registro gratis; comisión por reserva confirmada y una activación única (es de Holidu) | Ahí cobran comisión. Si no queréis reservas por ellos, decídelo antes de activar |
| casasrurales.net | [Acceso propietarios](https://www.casasrurales.net/emp-Acceso.php) → «Registra tu alojamiento gratis» | Gratis para registrarse | Sale en «apartamentos rurales Anoia» |
| tuscasasrurales.com | [Alta gratis](https://www.tuscasasrurales.com/alta-gratis.htm) | Gratis; solo alojamientos inscritos en turismo | Su página de Piera lista Maset de la Costa (El Bedorc) y no a vosotros |
| Femturisme | [Apareix a femturisme](https://femturisme.cat/pagines/apareix-a-femturisme) | Pregunta al rellenar el contacto | Su página «On dormir a Piera» no lista ningún alojamiento de Piera. Pedid salir ahí y en Sant Sadurní. En catalán |
| Gastroranking | [Registro restaurante](https://gastroranking.es/registro-restaurante/) | Registro del restaurante; el plan Pro es de pago y para cadenas, no hace falta | Para el restaurante: los días que abre y los grupos de 8 a 16 |

Cuando una ficha esté publicada, dile a Claude el enlace: lo apunta en `docs/aeo.md` y la rutina mira si empieza a salir en las preguntas.

## 4. La ficha que da datos falsos

gites.fr y cybevasion.fr dicen que la casa está en «Vallbona» y que es un gîte de 30 m² para 2. Copian de otro canal (Booking, Airbnb o similar). En el canal donde esté la casa, revisa la dirección (El Bedorc, Piera, no Vallbona) y la descripción. Si no estáis en ninguno, dile a Claude cuál es y se escribe a gites.fr para que la corrija.
