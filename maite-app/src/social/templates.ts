// Generated from the Instagram templates (canvas artboards): one entry per template, its markup at full size.
// Photos are in public/social/, the logo and isotype in /img/, the fonts in /fonts/ and public/social/.
export type Kind = 'post' | 'story' | 'highlight';
export interface Template { id: string; title: string; desc: string; w: number; h: number; kind: Kind; photo: string; html: string }
export interface Copy { label: string; caption: string; note: string; hashtags: string }

export const TEMPLATES: Template[] = [
 {
  "id": "Main",
  "title": "Foto + logo",
  "desc": "El logo sobre la foto tonificada del Bedorc, amb dues línies curtes.",
  "w": 1080,
  "h": 1350,
  "kind": "post",
  "photo": "/maite/social/bedorc.jpg",
  "html": "<div style=\"width: 1080px; height: 1350px; position: relative; overflow: hidden; background: #1a3f20; font-family: 'Halyard Display', 'Helvetica Neue', Arial, sans-serif; color: #f3efe4;\"> <img data-photo src=\"/maite/social/bedorc.jpg\" alt=\"El Bedorc entre vinyes\" style=\"position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 55%;\"> <div style=\"position: absolute; inset: 0; background: linear-gradient(180deg, rgba(26,63,32,0.15) 0%, rgba(26,63,32,0.6) 100%);\"></div> <div style=\"position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 48px; padding: 96px; box-sizing: border-box; text-align: center;\"> <img src=\"/img/logo-light.png\" alt=\"La Casa Vella, 1898, El Bedorc\" style=\"width: 360px; height: auto;\"> <p style=\"margin: 0; font-size: 26px; font-weight: 500; letter-spacing: .3em; text-transform: uppercase; opacity: .92;\">Entre vinyes i oliveres</p> </div> <p style=\"position: absolute; left: 0; right: 0; bottom: 64px; margin: 0; text-align: center; font-size: 22px; font-weight: 500; letter-spacing: .26em; text-transform: uppercase; opacity: .8;\">El Bedorc, Anoia, Barcelona</p> </div>"
 },
 {
  "id": "PostLogo",
  "title": "Només logo",
  "desc": "La composició de la marca: foto en verd i només el logo, sense text.",
  "w": 1080,
  "h": 1350,
  "kind": "post",
  "photo": "/maite/social/bedorc.jpg",
  "html": "<div style=\"width: 1080px; height: 1350px; position: relative; overflow: hidden; background: #1a3f20; display: flex; align-items: center; justify-content: center;\"> <img data-photo src=\"/maite/social/bedorc.jpg\" alt=\"El Bedorc entre vinyes, en verd\" style=\"position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 55%;\"> <div style=\"position: absolute; inset: 0; background: rgba(26,63,32,0.3);\"></div> <img src=\"/img/logo-light.png\" alt=\"La Casa Vella, 1898, El Bedorc\" style=\"position: relative; width: 380px; height: auto;\"> </div>"
 },
 {
  "id": "PostGradient",
  "title": "Degradat verd + logo",
  "desc": "La foto es fon cap a Verd fosc; el logo pot anar a baix o a dalt.",
  "w": 1080,
  "h": 1350,
  "kind": "post",
  "photo": "/maite/social/montserrat-vinyes.jpg",
  "html": "<div style=\"width: 1080px; height: 1350px; position: relative; overflow: hidden; background: #1a3f20; display: flex; flex-direction: column; justify-content: flex-end; align-items: center;\"> <img data-photo src=\"/maite/social/montserrat-vinyes.jpg\" alt=\"Vinyes amb Montserrat al fons\" style=\"position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;\"> <div style=\"position: absolute; inset: 0; background: linear-gradient(0deg, rgba(26,63,32,0.95) 0%, rgba(26,63,32,.35) 32%, rgba(26,63,32,0) 58%);\"></div> <img src=\"/img/logo-light.png\" alt=\"La Casa Vella, 1898, El Bedorc\" style=\"position: relative; width: 250px; height: auto; margin: 96px 0;\"> </div>"
 },
 {
  "id": "PostDetail",
  "title": "Detall",
  "desc": "Un racó de la casa amb una sola frase. Com els detalls d’Es Racó i Oller.",
  "w": 1080,
  "h": 1350,
  "kind": "post",
  "photo": "/maite/social/apt-cuina-detall.jpg",
  "html": "<div style=\"width: 1080px; height: 1350px; position: relative; overflow: hidden; background: #1a3f20; color: #f3efe4; font-family: 'Halyard Display', 'Helvetica Neue', Arial, sans-serif;\"> <img data-photo src=\"/maite/social/apt-cuina-detall.jpg\" alt=\"Ampolla de cava de La Casa Vella i dues copes al taulell de la cuina\" style=\"position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 66% center;\"> <div style=\"position: absolute; inset: 0; background: linear-gradient(0deg, rgba(26,63,32,0.9) 0%, rgba(26,63,32,.3) 26%, rgba(26,63,32,0) 46%);\"></div> <div style=\"position: absolute; left: 88px; right: 88px; bottom: 96px; display: flex; flex-direction: column; align-items: center; gap: 22px; text-align: center;\"> <img src=\"/img/iso-light.png\" alt=\"\" style=\"width: 56px; height: auto;\"> <p style=\"margin: 0; font-family: 'Le Monde Livre', Georgia, serif; font-size: 64px; line-height: 1.12; text-wrap: balance;\">Una copa de cava per començar</p> </div> </div>"
 },
 {
  "id": "PostRestaurant",
  "title": "Restaurant",
  "desc": "Només la foto del restaurant amb un degradat verd suau a baix.",
  "w": 1080,
  "h": 1350,
  "kind": "post",
  "photo": "/maite/social/restaurant-barra.jpg",
  "html": "<div style=\"width: 1080px; height: 1350px; position: relative; overflow: hidden; background: #1a3f20;\"> <img data-photo src=\"/maite/social/restaurant-barra.jpg\" alt=\"La barra del restaurant amb llum càlida\" style=\"position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 55% center;\"> <div style=\"position: absolute; left: 0; right: 0; bottom: 0; height: 320px; background: linear-gradient(0deg, rgba(26,63,32,0.55) 0%, rgba(26,63,32,0) 100%);\"></div> </div>"
 },
 {
  "id": "PostRestaurantPlain",
  "title": "Restaurant, només foto",
  "desc": "La foto del restaurant sola, sense degradat ni text.",
  "w": 1080,
  "h": 1350,
  "kind": "post",
  "photo": "/maite/social/restaurant-barra.jpg",
  "html": "<div style=\"width: 1080px; height: 1350px; position: relative; overflow: hidden; background: #1a3f20;\"> <img data-photo src=\"/maite/social/restaurant-barra.jpg\" alt=\"La barra del restaurant amb llum càlida\" style=\"position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 55% center;\"> </div>"
 },
 {
  "id": "PostAnnounce",
  "title": "Anunci del restaurant",
  "desc": "Foto del restaurant amb el titular, la data i el preu, per a un post sol.",
  "w": 1080,
  "h": 1350,
  "kind": "post",
  "photo": "/maite/social/restaurant-barra.jpg",
  "html": "<div style=\"width: 1080px; height: 1350px; position: relative; overflow: hidden; background: #1a3f20; color: #f3efe4; font-family: 'Halyard Display', 'Helvetica Neue', Arial, sans-serif;\"> <img data-photo src=\"/maite/social/restaurant-barra.jpg\" alt=\"La barra del restaurant amb llum càlida\" style=\"position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center;\"> <div style=\"position: absolute; inset: 0; background: linear-gradient(180deg, rgba(26,63,32,.45) 0%, rgba(26,63,32,.1) 28%, rgba(26,63,32,0.85) 72%);\"></div> <p style=\"position: absolute; top: 96px; left: 0; right: 0; margin: 0; text-align: center; font-family: 'Le Monde Livre', Georgia, serif; font-size: 26px; letter-spacing: .3em; text-transform: uppercase;\">La Casa Vella, El Bedorc</p> <div style=\"position: absolute; left: 88px; right: 88px; bottom: 96px; display: flex; flex-direction: column; gap: 14px;\"> <p style=\"margin: 0; font-family: 'Le Monde Livre', Georgia, serif; font-size: 36px; letter-spacing: .2em; text-transform: uppercase;\">Torna la</p> <p style=\"margin: 0 0 10px; font-family: 'Pinyon Script', cursive; font-size: 190px; line-height: .9;\">Calçotada</p> <p style=\"margin: 0; font-size: 32px; font-weight: 300; line-height: 1.4;\">A la terrassa, cada diumenge</p> <p style=\"margin: 0; font-size: 32px; font-weight: 600;\">[DATES], [PREU] € per persona</p> <p style=\"margin: 24px 0 0; align-self: flex-start; padding: 20px 34px; border: 1px solid #f3efe4; font-size: 22px; font-weight: 600; letter-spacing: .26em; text-transform: uppercase;\">Reserva per DM</p> </div> </div>"
 },
 {
  "id": "PostMenuCover",
  "title": "Portada de menú",
  "desc": "La foto, el títol i les dates en gran, sense preu. La primera imatge del carrusel, amb el menú darrere.",
  "w": 1080,
  "h": 1350,
  "kind": "post",
  "photo": "/maite/social/restaurant-barra.jpg",
  "html": "<div style=\"width: 1080px; height: 1350px; position: relative; overflow: hidden; background: #1a3f20; color: #f3efe4; font-family: 'Halyard Display', 'Helvetica Neue', Arial, sans-serif;\"> <img data-photo src=\"/maite/social/restaurant-barra.jpg\" alt=\"La barra del restaurant amb llum càlida\" style=\"position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center;\"> <div style=\"position: absolute; inset: 0; background: linear-gradient(180deg, rgba(26,63,32,.45) 0%, rgba(26,63,32,.1) 28%, rgba(26,63,32,0.85) 70%);\"></div> <p style=\"position: absolute; top: 96px; left: 0; right: 0; margin: 0; text-align: center; font-family: 'Le Monde Livre', Georgia, serif; font-size: 26px; letter-spacing: .3em; text-transform: uppercase;\">La Casa Vella, El Bedorc</p> <div style=\"position: absolute; left: 88px; right: 88px; bottom: 112px; display: flex; flex-direction: column; gap: 14px;\"> <p style=\"margin: 0; font-family: 'Le Monde Livre', Georgia, serif; font-size: 36px; letter-spacing: .2em; text-transform: uppercase;\">Torna la</p> <p style=\"margin: 0 0 18px; font-family: 'Pinyon Script', cursive; font-size: 190px; line-height: .9;\">Calçotada</p> <p style=\"margin: 0; font-family: 'Le Monde Livre', Georgia, serif; font-size: 54px; line-height: 1.15;\">Del 18 de gener al 29 de març</p> <p style=\"margin: 0; font-size: 32px; font-weight: 300; line-height: 1.4;\">A la terrassa, cada diumenge</p> </div> </div>"
 },
 {
  "id": "PostSplit",
  "title": "Foto + franja Cava",
  "desc": "Foto a dalt i una frase a la franja Cava, amb l’emblema.",
  "w": 1080,
  "h": 1350,
  "kind": "post",
  "photo": "/maite/social/escala-entrada.jpg",
  "html": "<div style=\"width: 1080px; height: 1350px; display: flex; flex-direction: column; background: #c6bfaf; color: #1a3f20; font-family: 'Halyard Display', 'Helvetica Neue', Arial, sans-serif;\"> <img data-photo src=\"/maite/social/escala-entrada.jpg\" alt=\"L'escala d'entrada\" style=\"width: 1080px; height: 1060px; object-fit: cover; display: block;\"> <div style=\"flex-grow: 1; display: flex; align-items: center; justify-content: space-between; gap: 48px; padding: 0 88px;\"> <p style=\"margin: 0; font-family: 'Le Monde Livre', Georgia, serif; font-size: 54px; line-height: 1.1; max-width: 680px;\">Cada esglaó té la seva història</p> <img src=\"/img/iso-dark.png\" alt=\"\" style=\"width: 72px; height: auto;\"> </div> </div>"
 },
 {
  "id": "PostFrame",
  "title": "Foto emmarcada",
  "desc": "La foto amb un marge Cava, com una làmina, i l’emblema a sota.",
  "w": 1080,
  "h": 1350,
  "kind": "post",
  "photo": "/maite/social/gerro.jpg",
  "html": "<div style=\"width: 1080px; height: 1350px; box-sizing: border-box; background: #c6bfaf; padding: 88px 88px 0; display: flex; flex-direction: column; align-items: center;\"> <img data-photo src=\"/maite/social/gerro.jpg\" alt=\"Gerro amb flors seques\" style=\"width: 904px; height: 1050px; object-fit: cover; display: block;\"> <div style=\"flex-grow: 1; display: flex; align-items: center; justify-content: center;\"> <img src=\"/img/iso-dark.png\" alt=\"La Casa Vella\" style=\"width: 64px; height: auto;\"> </div> </div>"
 },
 {
  "id": "PostDiptych",
  "title": "Díptic",
  "desc": "Dos detalls costat per costat sobre Verd fosc.",
  "w": 1080,
  "h": 1350,
  "kind": "post",
  "photo": "/maite/social/llibre.jpg",
  "html": "<div style=\"width: 1080px; height: 1350px; box-sizing: border-box; background: #1a3f20; padding: 64px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px;\"> <img data-photo src=\"/maite/social/llibre.jpg\" alt=\"El llibre de La Casa Vella\" style=\"width: 100%; height: 100%; object-fit: cover; display: block;\"> <img src=\"/maite/social/rotul.jpg\" alt=\"El rètol de fusta de la casa\" style=\"width: 100%; height: 100%; object-fit: cover; display: block;\"> </div>"
 },
 {
  "id": "PostSeason",
  "title": "Temporada",
  "desc": "Títol gran de temporada a dalt i les dates a baix.",
  "w": 1080,
  "h": 1350,
  "kind": "post",
  "photo": "/maite/social/bedorc-capvespre.jpg",
  "html": "<div style=\"width: 1080px; height: 1350px; position: relative; overflow: hidden; background: #1a3f20; color: #f3efe4; font-family: 'Halyard Display', 'Helvetica Neue', Arial, sans-serif;\"> <img data-photo src=\"/maite/social/bedorc-capvespre.jpg\" alt=\"El Bedorc al capvespre\" style=\"position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 30% center;\"> <div style=\"position: absolute; inset: 0; background: linear-gradient(180deg, rgba(26,63,32,.75) 0%, rgba(26,63,32,0) 40%, rgba(26,63,32,0) 70%, rgba(26,63,32,.6) 100%);\"></div> <p style=\"position: absolute; top: 88px; left: 88px; margin: 0; font-family: 'Le Monde Livre', Georgia, serif; font-size: 132px; line-height: .95;\">Tardor<br>al Bedorc</p> <p style=\"position: absolute; left: 88px; bottom: 80px; margin: 0; font-size: 22px; font-weight: 500; letter-spacing: .28em; text-transform: uppercase;\">Octubre, novembre</p> <img src=\"/img/iso-light.png\" alt=\"\" style=\"position: absolute; right: 88px; bottom: 72px; width: 56px; height: auto;\"> </div>"
 },
 {
  "id": "PostEmblem",
  "title": "Emblema",
  "desc": "Només l’emblema dins un cercle, sobre Verd fosc. Per obrir o tancar una sèrie.",
  "w": 1080,
  "h": 1350,
  "kind": "post",
  "photo": "",
  "html": "<div style=\"width: 1080px; height: 1350px; background: #1a3f20; display: flex; align-items: center; justify-content: center;\"> <div style=\"width: 620px; height: 620px; border-radius: 50%; border: 2px solid #c6bfaf; box-sizing: border-box; display: flex; align-items: center; justify-content: center;\"> <img src=\"/img/iso-light.png\" alt=\"Emblema de La Casa Vella\" style=\"width: 300px; height: auto;\"> </div> </div>"
 },
 {
  "id": "PostWord",
  "title": "Una paraula",
  "desc": "Una sola paraula gran sobre Cava.",
  "w": 1080,
  "h": 1350,
  "kind": "post",
  "photo": "",
  "html": "<div style=\"width: 1080px; height: 1350px; box-sizing: border-box; background: #c6bfaf; color: #1a3f20; font-family: 'Halyard Display', 'Helvetica Neue', Arial, sans-serif; padding: 120px 96px 96px; display: flex; flex-direction: column; justify-content: space-between; align-items: center; text-align: center;\"> <p style=\"margin: 0; font-size: 22px; font-weight: 500; letter-spacing: .3em; text-transform: uppercase; color: #2e6d2e;\">El que trobaràs aquí</p> <p style=\"margin: 0; font-family: 'Le Monde Livre', Georgia, serif; font-size: 200px; line-height: 1;\">Silenci</p> <img src=\"/img/iso-dark.png\" alt=\"\" style=\"width: 64px; height: auto;\"> </div>"
 },
 {
  "id": "PostHistory",
  "title": "Història",
  "desc": "Foto antiga del poble amb l’any 1898 en gran.",
  "w": 1080,
  "h": 1350,
  "kind": "post",
  "photo": "/maite/social/historia-carrer.jpg",
  "html": "<div style=\"width: 1080px; height: 1350px; position: relative; overflow: hidden; background: #1a3f20; color: #f3efe4; font-family: 'Halyard Display', 'Helvetica Neue', Arial, sans-serif;\"> <img data-photo src=\"/maite/social/historia-carrer.jpg\" alt=\"Foto antiga del carrer del Bedorc\" style=\"position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 35% center;\"> <div style=\"position: absolute; inset: 0; background: linear-gradient(0deg, rgba(26,63,32,.92) 0%, rgba(26,63,32,.4) 34%, rgba(26,63,32,0) 55%);\"></div> <div style=\"position: absolute; left: 88px; right: 88px; bottom: 96px; display: flex; flex-direction: column; gap: 16px;\"> <p style=\"margin: 0; font-family: 'Le Monde Livre', Georgia, serif; font-size: 180px; line-height: .9;\">1898</p> <p style=\"margin: 0; font-size: 24px; font-weight: 500; letter-spacing: .26em; text-transform: uppercase;\">Quan el poble ja tenia aquesta casa</p> </div> </div>"
 },
 {
  "id": "PostTriptych",
  "title": "Tríptic",
  "desc": "Tres detalls en columnes i el logo a sota.",
  "w": 1080,
  "h": 1350,
  "kind": "post",
  "photo": "/maite/social/hab-armari.jpg",
  "html": "<div style=\"width: 1080px; height: 1350px; box-sizing: border-box; background: #c6bfaf; padding: 64px 64px 0; display: flex; flex-direction: column; gap: 0;\"> <div style=\"flex-grow: 1; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; min-height: 0;\"> <img data-photo src=\"/maite/social/hab-armari.jpg\" alt=\"Habitació amb armari verd\" style=\"width: 100%; height: 100%; object-fit: cover; display: block;\"> <img src=\"/maite/social/rajola-flor.jpg\" alt=\"Rajola amb una flor\" style=\"width: 100%; height: 100%; object-fit: cover; display: block;\"> <img src=\"/maite/social/rebedor.jpg\" alt=\"El rebedor\" style=\"width: 100%; height: 100%; object-fit: cover; display: block;\"> </div> <div style=\"height: 150px; display: flex; align-items: center; justify-content: center;\"> <img src=\"/img/logo-dark.png\" alt=\"La Casa Vella\" style=\"height: 96px; width: auto;\"> </div> </div>"
 },
 {
  "id": "PostArch",
  "title": "Arc",
  "desc": "La foto dins un arc, com les finestres de la casa, i una frase.",
  "w": 1080,
  "h": 1350,
  "kind": "post",
  "photo": "/maite/social/montserrat-vinyes.jpg",
  "html": "<div style=\"width: 1080px; height: 1350px; box-sizing: border-box; background: #1a3f20; color: #f3efe4; padding: 104px 0 88px; display: flex; flex-direction: column; align-items: center; gap: 56px;\"> <img data-photo src=\"/maite/social/montserrat-vinyes.jpg\" alt=\"Vinyes amb Montserrat al fons\" style=\"width: 720px; height: 940px; object-fit: cover; object-position: 40% center; border-radius: 360px 360px 0 0; display: block;\"> <p style=\"margin: 0; font-family: 'Le Monde Livre', Georgia, serif; font-size: 52px; line-height: 1.1; text-align: center;\">Montserrat, des de la finestra</p> </div>"
 },
 {
  "id": "PostGuest",
  "title": "Paraules d’un hoste",
  "desc": "Foto a dalt i la frase d’un hoste a sota. Omple els claudàtors amb una ressenya real.",
  "w": 1080,
  "h": 1350,
  "kind": "post",
  "photo": "/maite/social/restaurant-barra.jpg",
  "html": "<div style=\"width: 1080px; height: 1350px; display: flex; flex-direction: column; background: #c6bfaf; color: #1a3f20; font-family: 'Halyard Display', 'Helvetica Neue', Arial, sans-serif;\"> <img data-photo src=\"/maite/social/restaurant-barra.jpg\" alt=\"La barra del restaurant\" style=\"width: 1080px; height: 640px; object-fit: cover; display: block;\"> <div style=\"flex-grow: 1; box-sizing: border-box; padding: 72px 104px 88px; display: flex; flex-direction: column; justify-content: space-between; align-items: center; text-align: center;\"> <p style=\"margin: 0; font-family: 'Le Monde Livre', Georgia, serif; font-size: 120px; line-height: .6; color: #2e6d2e;\">“</p> <p style=\"margin: 0; font-family: 'Le Monde Livre', Georgia, serif; font-size: 50px; line-height: 1.25; text-wrap: balance;\">[Frase d’un hoste sobre la seva estada]</p> <p style=\"margin: 0; font-size: 22px; font-weight: 500; letter-spacing: .26em; text-transform: uppercase;\">[Nom de l’hoste], [ciutat]</p> </div> </div>"
 },
 {
  "id": "PostRoom",
  "title": "Estança",
  "desc": "Una habitació per post, amb el nom en gran. Com Off Grid.",
  "w": 1080,
  "h": 1350,
  "kind": "post",
  "photo": "/maite/social/hab-llit.jpg",
  "html": "<div style=\"width: 1080px; height: 1350px; position: relative; overflow: hidden; background: #1a3f20; font-family: 'Halyard Display', 'Helvetica Neue', Arial, sans-serif; color: #f3efe4;\"> <img data-photo src=\"/maite/social/hab-llit.jpg\" alt=\"Habitació Figarot amb llit de forja\" style=\"position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center;\"> <div style=\"position: absolute; inset: 0; background: linear-gradient(180deg, rgba(26,63,32,0.35) 0%, rgba(26,63,32,0) 35%, rgba(26,63,32,0.75) 100%);\"></div> <img src=\"/img/iso-light.png\" alt=\"La Casa Vella\" style=\"position: absolute; top: 72px; left: 50%; width: 84px; height: auto; margin-left: -42px;\"> <div style=\"position: absolute; left: 96px; right: 96px; bottom: 96px; display: flex; flex-direction: column; align-items: center; gap: 28px; text-align: center;\"> <p style=\"margin: 0; font-family: 'Le Monde Livre', Georgia, serif; font-size: 132px; line-height: 1;\">Figarot</p> <p style=\"margin: 0; font-size: 22px; font-weight: 500; letter-spacing: .26em; text-transform: uppercase; opacity: .8;\">Per despertar-se sense presses</p> </div> </div>"
 },
 {
  "id": "PostQuote",
  "title": "Cita",
  "desc": "Una frase de la casa sobre Verd fosc o Cava.",
  "w": 1080,
  "h": 1350,
  "kind": "post",
  "photo": "",
  "html": "<div style=\"width: 1080px; height: 1350px; box-sizing: border-box; background: #1a3f20; color: #f3efe4; font-family: 'Halyard Display', 'Helvetica Neue', Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 112px 104px 96px; text-align: center;\"> <img src=\"/img/iso-light.png\" alt=\"\" style=\"width: 92px; height: auto;\"> <div style=\"display: flex; flex-direction: column; align-items: center; gap: 40px;\"> <p style=\"margin: 0; font-family: 'Le Monde Livre', Georgia, serif; font-size: 64px; line-height: 1.28; text-wrap: balance;\">Murs de pedra originals, un jardí i tranquil·litat en cada racó.</p> <p style=\"margin: 0; font-family: 'Pinyon Script', cursive; font-size: 72px; line-height: 1; color: #79a57a;\">viure-la a poc a poc</p> </div> <p style=\"margin: 0; font-size: 22px; font-weight: 600; letter-spacing: .3em; text-transform: uppercase; opacity: .8;\">La Casa Vella, El Bedorc</p> </div>"
 },
 {
  "id": "CarouselCover",
  "title": "Portada de carrusel",
  "desc": "Titular a dalt a l’esquerra, paràgraf i signatura a baix. Com Off Grid.",
  "w": 1080,
  "h": 1350,
  "kind": "post",
  "photo": "/maite/social/escala-entrada.jpg",
  "html": "<div style=\"width: 1080px; height: 1350px; position: relative; overflow: hidden; background: #1a3f20; color: #f3efe4; font-family: 'Halyard Display', 'Helvetica Neue', Arial, sans-serif;\"> <img data-photo src=\"/maite/social/escala-entrada.jpg\" alt=\"L'escala de la casa\" style=\"position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;\"> <div style=\"position: absolute; inset: 0; background: linear-gradient(180deg, rgba(26,63,32,0.55) 0%, rgba(26,63,32,0) 38%, rgba(26,63,32,0) 55%, rgba(26,63,32,0.55) 100%);\"></div> <p style=\"position: absolute; top: 88px; left: 88px; right: 300px; margin: 0; font-family: 'Le Monde Livre', Georgia, serif; font-size: 124px; line-height: 1; letter-spacing: -.01em;\">Una casa de 1898</p> <div style=\"position: absolute; left: 88px; right: 88px; bottom: 80px; display: flex; flex-direction: column; gap: 28px;\"> <p style=\"margin: 0; max-width: 760px; font-size: 22px; font-weight: 500; line-height: 1.6; letter-spacing: .14em; text-transform: uppercase;\">Bigues de fusta a la vista, rajola hidràulica i parets de pedra. Restaurada per viure-la a poc a poc.</p> <div style=\"height: 1px; background: rgba(243,239,228,.6);\"></div> <div style=\"display: flex; justify-content: space-between; align-items: center; gap: 24px;\"> <p style=\"margin: 0; font-size: 20px; font-weight: 500; letter-spacing: .24em; text-transform: uppercase;\">Tardor 2026</p> <div style=\"display: flex; align-items: center; gap: 14px;\"> <img src=\"/img/iso-light.png\" alt=\"\" style=\"width: 40px; height: auto;\"> <p style=\"margin: 0; font-family: 'Le Monde Livre', Georgia, serif; font-size: 24px; letter-spacing: .16em; text-transform: uppercase;\">La Casa Vella</p> </div> </div> </div> </div>"
 },
 {
  "id": "CarouselSlide",
  "title": "Foto de carrusel",
  "desc": "Les diapositives de després: foto sola, sense text.",
  "w": 1080,
  "h": 1350,
  "kind": "post",
  "photo": "/maite/social/rajola-flor.jpg",
  "html": "<div style=\"width: 1080px; height: 1350px; position: relative; overflow: hidden; background: #c6bfaf;\"> <img data-photo src=\"/maite/social/rajola-flor.jpg\" alt=\"Detall de la rajola hidràulica\" style=\"position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center;\"> </div>"
 },
 {
  "id": "PostMenu",
  "title": "Menú",
  "desc": "Fons Cava, plats centrats i preu en un cercle. Com La Vella Farga.",
  "w": 1080,
  "h": 1350,
  "kind": "post",
  "photo": "",
  "html": "<div style=\"width: 1080px; height: 1350px; box-sizing: border-box; background: #c6bfaf; color: #1a3f20; font-family: 'Halyard Display', 'Helvetica Neue', Arial, sans-serif; padding: 104px 120px 88px; display: flex; flex-direction: column; align-items: center; text-align: center; position: relative;\"> <p style=\"margin: 0; font-size: 22px; font-weight: 600; letter-spacing: .3em; text-transform: uppercase; color: #2e6d2e;\">Al restaurant, cada diumenge</p> <p style=\"margin: 28px 0 0; font-family: 'Le Monde Livre', Georgia, serif; font-size: 76px; line-height: 1.05; letter-spacing: .04em; text-transform: uppercase;\">Menú de calçotada</p> <div style=\"margin: 40px 0 48px; display: flex; align-items: center; gap: 18px;\"> <div style=\"width: 80px; height: 1px; background: #1a3f20;\"></div> <img src=\"/img/iso-dark.png\" alt=\"\" style=\"width: 40px; height: auto;\"> <div style=\"width: 80px; height: 1px; background: #1a3f20;\"></div> </div> <div style=\"display: flex; flex-direction: column; gap: 30px; font-family: 'Le Monde Livre', Georgia, serif; font-size: 32px; line-height: 1.35; color: #1a3f20;\"> <p style=\"margin: 0;\">Calçots a la brasa amb salsa romesco</p> <p style=\"margin: 0;\">[SEGON PLAT]</p> <p style=\"margin: 0;\">[TERCER PLAT]</p> <p style=\"margin: 0;\">Crema catalana</p> <p style=\"margin: 0; font-family: 'Halyard Display', 'Helvetica Neue', Arial, sans-serif; font-size: 24px; font-weight: 400; color: #2e6d2e;\">Vi del Penedès, aigua, cafè</p> </div> <div style=\"margin-top: auto; display: flex; flex-direction: column; align-items: center; gap: 30px; width: 100%;\"> <div style=\"width: 150px; height: 150px; border-radius: 50%; background: #2e6d2e; color: #f3efe4; display: flex; flex-direction: column; align-items: center; justify-content: center;\"> <span style=\"font-family: 'Le Monde Livre', Georgia, serif; font-size: 52px; line-height: 1;\">[PREU]€</span> <span style=\"font-size: 18px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; margin-top: 6px;\">persona</span> </div> <div style=\"display: flex; flex-direction: column; align-items: center; gap: 8px;\"> <p style=\"margin: 0; font-family: 'Le Monde Livre', Georgia, serif; font-size: 30px;\">Reserva a casavellarural.com</p> <p style=\"margin: 0; font-size: 24px; color: #2e6d2e;\">o per WhatsApp al 667 40 98 59</p> </div> </div> </div>"
 },
 {
  "id": "PostAward",
  "title": "Premi / premsa",
  "desc": "Columna Cava amb el premi i el logo, foto a la dreta. Com Mas Grimosach.",
  "w": 1080,
  "h": 1350,
  "kind": "post",
  "photo": "/maite/social/mirall.jpg",
  "html": "<div style=\"width: 1080px; height: 1350px; display: flex; background: #c6bfaf; color: #1a3f20; font-family: 'Halyard Display', 'Helvetica Neue', Arial, sans-serif;\"> <div style=\"width: 450px; flex-shrink: 0; box-sizing: border-box; padding: 96px 56px 88px 64px; display: flex; flex-direction: column; justify-content: center;\"> <div style=\"display: flex; flex-direction: column; align-items: center; gap: 18px; text-align: center;\"> <img src=\"/img/logo-dark.png\" alt=\"La Casa Vella, 1898, El Bedorc\" style=\"width: 220px; height: auto;\"> </div> </div> <img data-photo src=\"/maite/social/mirall.jpg\" alt=\"Mirall antic al passadís\" style=\"flex-grow: 1; min-width: 0; height: 100%; object-fit: cover; object-position: 40% center; display: block;\"> </div>"
 },
 {
  "id": "StoryPhoto",
  "title": "Story amb foto i titular",
  "desc": "Titular a baix, lluny dels botons d’Instagram.",
  "w": 1080,
  "h": 1920,
  "kind": "story",
  "photo": "/maite/social/bedorc-capvespre.jpg",
  "html": "<div style=\"width: 1080px; height: 1920px; position: relative; overflow: hidden; background: #1a3f20; color: #f3efe4; font-family: 'Halyard Display', 'Helvetica Neue', Arial, sans-serif;\"> <img data-photo src=\"/maite/social/bedorc-capvespre.jpg\" alt=\"El Bedorc al capvespre\" style=\"position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center;\"> <div style=\"position: absolute; inset: 0; background: linear-gradient(180deg, rgba(26,63,32,.35) 0%, rgba(26,63,32,0) 30%, rgba(26,63,32,0) 45%, rgba(26,63,32,0.8) 100%);\"></div> <img src=\"/img/iso-light.png\" alt=\"La Casa Vella\" style=\"position: absolute; top: 250px; left: 50%; width: 96px; height: auto; margin-left: -48px;\"> <div style=\"position: absolute; left: 88px; right: 88px; bottom: 380px; display: flex; flex-direction: column; gap: 20px;\"> <p style=\"margin: 0; font-size: 26px; font-weight: 600; letter-spacing: .3em; text-transform: uppercase; color: #c6bfaf;\">El nostre entorn</p> <p style=\"margin: 0; font-family: 'Le Monde Livre', Georgia, serif; font-size: 96px; line-height: 1.06; text-wrap: balance;\">El Bedorc, amb Montserrat a la vista</p> <p style=\"margin: 0; font-family: 'Pinyon Script', cursive; font-size: 76px; line-height: 1; color: #79a57a;\">a una hora de Barcelona</p> </div> </div>"
 },
 {
  "id": "StoryReel",
  "title": "Portada de Reel",
  "desc": "Una sola paraula al centre i el nom de la casa.",
  "w": 1080,
  "h": 1920,
  "kind": "story",
  "photo": "/maite/social/rebedor.jpg",
  "html": "<div style=\"width: 1080px; height: 1920px; position: relative; overflow: hidden; background: #1a3f20; color: #f3efe4;\"> <img data-photo src=\"/maite/social/rebedor.jpg\" alt=\"El rebedor\" style=\"position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center;\"> <div style=\"position: absolute; inset: 0; background: rgba(26,63,32,0.25);\"></div> <div style=\"position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; text-align: center;\"> <p style=\"margin: 0; font-family: 'Pinyon Script', cursive; font-size: 200px; line-height: 1;\">calma</p> <p style=\"margin: 0; font-family: 'Le Monde Livre', Georgia, serif; font-size: 30px; letter-spacing: .3em; text-transform: uppercase;\">La Casa Vella</p> </div> </div>"
 },
 {
  "id": "StoryPoster",
  "title": "Story amb cartell",
  "desc": "Per a la calçotada o qualsevol data; després, al destacat Restaurant.",
  "w": 1080,
  "h": 1920,
  "kind": "story",
  "photo": "/maite/social/restaurant-barra.jpg",
  "html": "<div style=\"width: 1080px; height: 1920px; position: relative; overflow: hidden; background: #1a3f20; color: #f3efe4; font-family: 'Halyard Display', 'Helvetica Neue', Arial, sans-serif;\"> <img data-photo src=\"/maite/social/restaurant-barra.jpg\" alt=\"La barra del restaurant\" style=\"position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center;\"> <div style=\"position: absolute; inset: 0; background: linear-gradient(180deg, rgba(26,63,32,.45) 0%, rgba(26,63,32,.1) 30%, rgba(26,63,32,0.85) 75%);\"></div> <p style=\"position: absolute; top: 250px; left: 0; right: 0; margin: 0; text-align: center; font-family: 'Le Monde Livre', Georgia, serif; font-size: 28px; letter-spacing: .3em; text-transform: uppercase;\">La Casa Vella, El Bedorc</p> <div style=\"position: absolute; left: 88px; right: 88px; bottom: 360px; display: flex; flex-direction: column; gap: 18px;\"> <p style=\"margin: 0; font-family: 'Le Monde Livre', Georgia, serif; font-size: 40px; letter-spacing: .2em; text-transform: uppercase;\">Torna la</p> <p style=\"margin: 0 0 12px; font-family: 'Pinyon Script', cursive; font-size: 210px; line-height: .9;\">Calçotada</p> <p style=\"margin: 0; font-size: 34px; font-weight: 300; line-height: 1.4;\">A la terrassa, cada diumenge</p> <p style=\"margin: 0; font-size: 34px; font-weight: 600;\">[DATES], [PREU] € per persona</p> <p style=\"margin: 28px 0 0; align-self: flex-start; padding: 22px 36px; border: 1px solid #f3efe4; font-size: 24px; font-weight: 600; letter-spacing: .26em; text-transform: uppercase;\">Reserva per DM</p> </div> </div>"
 },
 {
  "id": "HlEstances",
  "title": "Estances",
  "desc": "Icona centrada perquè el retall rodó la conservi.",
  "w": 1080,
  "h": 1920,
  "kind": "highlight",
  "photo": "",
  "html": "<div style=\"width: 1080px; height: 1920px; background: #1a3f20; display: flex; align-items: center; justify-content: center;\"> <div style=\"width: 640px; height: 640px; border-radius: 50%; border: 3px solid #c6bfaf; box-sizing: border-box; display: flex; align-items: center; justify-content: center;\"> <svg width=\"320\" height=\"320\" viewBox=\"0 0 100 100\" fill=\"none\" stroke=\"#c6bfaf\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" role=\"img\" aria-label=\"Estances\"><path d=\"M20 72 V36 M20 56 H80 V72 M20 64 H80 M28 56 V50 a6 6 0 0 1 6-6 h12 a6 6 0 0 1 6 6 v6\"/></svg> </div> </div>"
 },
 {
  "id": "HlRestaurant",
  "title": "Restaurant",
  "desc": "Icona centrada perquè el retall rodó la conservi.",
  "w": 1080,
  "h": 1920,
  "kind": "highlight",
  "photo": "",
  "html": "<div style=\"width: 1080px; height: 1920px; background: #1a3f20; display: flex; align-items: center; justify-content: center;\"> <div style=\"width: 640px; height: 640px; border-radius: 50%; border: 3px solid #c6bfaf; box-sizing: border-box; display: flex; align-items: center; justify-content: center;\"> <svg width=\"320\" height=\"320\" viewBox=\"0 0 100 100\" fill=\"none\" stroke=\"#c6bfaf\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" role=\"img\" aria-label=\"Restaurant\"><path d=\"M38 22 H62 C62 42 57 52 50 52 C43 52 38 42 38 22 Z M50 52 V76 M40 78 H60\"/></svg> </div> </div>"
 },
 {
  "id": "HlBedorc",
  "title": "El Bedorc",
  "desc": "Icona centrada perquè el retall rodó la conservi.",
  "w": 1080,
  "h": 1920,
  "kind": "highlight",
  "photo": "",
  "html": "<div style=\"width: 1080px; height: 1920px; background: #1a3f20; display: flex; align-items: center; justify-content: center;\"> <div style=\"width: 640px; height: 640px; border-radius: 50%; border: 3px solid #c6bfaf; box-sizing: border-box; display: flex; align-items: center; justify-content: center;\"> <svg width=\"320\" height=\"320\" viewBox=\"0 0 100 100\" fill=\"none\" stroke=\"#c6bfaf\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" role=\"img\" aria-label=\"El Bedorc\"><path d=\"M14 74 L30 46 L38 56 L48 28 L58 50 L66 38 L86 74 Z\"/></svg> </div> </div>"
 },
 {
  "id": "HlCasa",
  "title": "La casa",
  "desc": "Icona centrada perquè el retall rodó la conservi.",
  "w": 1080,
  "h": 1920,
  "kind": "highlight",
  "photo": "",
  "html": "<div style=\"width: 1080px; height: 1920px; background: #1a3f20; display: flex; align-items: center; justify-content: center;\"> <div style=\"width: 640px; height: 640px; border-radius: 50%; border: 3px solid #c6bfaf; box-sizing: border-box; display: flex; align-items: center; justify-content: center;\"> <svg width=\"320\" height=\"320\" viewBox=\"0 0 100 100\" fill=\"none\" stroke=\"#c6bfaf\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" role=\"img\" aria-label=\"La casa\"><path d=\"M22 78 V46 L50 24 L78 46 V78 Z M42 78 V62 a8 8 0 0 1 16 0 V78\"/></svg> </div> </div>"
 },
 {
  "id": "HlReserva",
  "title": "Com reservar",
  "desc": "Icona centrada perquè el retall rodó la conservi.",
  "w": 1080,
  "h": 1920,
  "kind": "highlight",
  "photo": "",
  "html": "<div style=\"width: 1080px; height: 1920px; background: #1a3f20; display: flex; align-items: center; justify-content: center;\"> <div style=\"width: 640px; height: 640px; border-radius: 50%; border: 3px solid #c6bfaf; box-sizing: border-box; display: flex; align-items: center; justify-content: center;\"> <svg width=\"320\" height=\"320\" viewBox=\"0 0 100 100\" fill=\"none\" stroke=\"#c6bfaf\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" role=\"img\" aria-label=\"Com reservar\"><rect x=\"22\" y=\"28\" width=\"56\" height=\"50\" rx=\"4\"/><path d=\"M22 42 H78 M36 20 V34 M64 20 V34\"/></svg> </div> </div>"
 }
];

// The top of the Instagram profile (picture, name, bio, highlights); the grid under it is built from the confirmed posts
export const PROFILE_HEAD = "<div style=\"width: 1080px;  box-sizing: border-box; background: #ffffff; color: #1a1a1a; font-family: 'Halyard Display', 'Helvetica Neue', Arial, sans-serif; display: flex; flex-direction: column;\"> <div style=\"padding: 56px 48px 0; display: flex; flex-direction: column; gap: 36px;\"> <p style=\"margin: 0; font-size: 46px; font-weight: 600; display: flex; align-items: center; gap: 14px;\">casavellarural<svg viewBox=\"0 0 40 40\" width=\"40\" height=\"40\" aria-label=\"Verificat\" style=\"flex-shrink: 0;\"><path fill=\"#0095f6\" fill-rule=\"evenodd\" d=\"M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z\"/></svg></p> <div style=\"display: flex; align-items: center; gap: 56px;\"> <div style=\"width: 220px; height: 220px; flex-shrink: 0; border-radius: 50%; background: #1a3f20; display: flex; align-items: center; justify-content: center;\"> <img src=\"/img/iso-light.png\" alt=\"Emblema de La Casa Vella\" style=\"width: 120px; height: auto;\"> </div> <div style=\"flex-grow: 1; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; text-align: center;\"> <div><p style=\"margin: 0; font-size: 42px; font-weight: 600;\">[N]</p><p style=\"margin: 0; font-size: 32px;\">publicacions</p></div> <div><p style=\"margin: 0; font-size: 42px; font-weight: 600;\">[N]</p><p style=\"margin: 0; font-size: 32px;\">seguidors</p></div> <div><p style=\"margin: 0; font-size: 42px; font-weight: 600;\">[N]</p><p style=\"margin: 0; font-size: 32px;\">seguits</p></div> </div> </div> <div style=\"display: flex; flex-direction: column; gap: 6px; font-size: 34px; line-height: 1.4;\"> <p style=\"margin: 0; font-weight: 600;\">La Casa Vella, El Bedorc</p> <p style=\"margin: 0; color: #6b6b6b;\">Allotjament rural</p> <p style=\"margin: 0;\">Casa de poble de 1898 entre vinyes i oliveres</p> <p style=\"margin: 0;\">2 apartaments, 2 habitacions i restaurant</p> <p style=\"margin: 0;\">El Bedorc, Anoia, a 1 h de Barcelona</p> <p style=\"margin: 0;\">Reserva directa ↓</p> <a href=\"#\" style=\"font-weight: 600; text-decoration: none;\">casavellarural.com</a> </div> <div style=\"display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px;\"> <a href=\"#\" style=\"padding: 22px 0; border-radius: 20px; background: #1a3f20; color: #f3efe4; font-size: 32px; font-weight: 600; text-align: center; text-decoration: none;\">Reserva</a> <a href=\"#\" style=\"padding: 22px 0; border-radius: 20px; background: #efefef; color: #1a1a1a; font-size: 32px; font-weight: 600; text-align: center; text-decoration: none;\">Missatge</a> <a href=\"#\" style=\"padding: 22px 0; border-radius: 20px; background: #efefef; color: #1a1a1a; font-size: 32px; font-weight: 600; text-align: center; text-decoration: none;\">Com arribar</a> </div> <div style=\"display: flex; justify-content: space-between; gap: 16px; padding-bottom: 40px;\"> <div style=\"display: flex; flex-direction: column; align-items: center; gap: 14px; width: 172px;\"> <div style=\"width: 160px; height: 160px; border-radius: 50%; border: 3px solid #c6bfaf; box-sizing: border-box; padding: 6px;\"><div style=\"width: 100%; height: 100%; border-radius: 50%; background: #1a3f20; display: flex; align-items: center; justify-content: center;\"><svg width=\"64\" height=\"64\" viewBox=\"0 0 100 100\" fill=\"none\" stroke=\"#c6bfaf\" stroke-width=\"5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M20 72 V36 M20 56 H80 V72 M20 64 H80 M28 56 V50 a6 6 0 0 1 6-6 h12 a6 6 0 0 1 6 6 v6\"/></svg></div></div> <p style=\"margin: 0; font-size: 28px;\">Estances</p> </div> <div style=\"display: flex; flex-direction: column; align-items: center; gap: 14px; width: 172px;\"> <div style=\"width: 160px; height: 160px; border-radius: 50%; border: 3px solid #c6bfaf; box-sizing: border-box; padding: 6px;\"><div style=\"width: 100%; height: 100%; border-radius: 50%; background: #1a3f20; display: flex; align-items: center; justify-content: center;\"><svg width=\"64\" height=\"64\" viewBox=\"0 0 100 100\" fill=\"none\" stroke=\"#c6bfaf\" stroke-width=\"5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M38 22 H62 C62 42 57 52 50 52 C43 52 38 42 38 22 Z M50 52 V76 M40 78 H60\"/></svg></div></div> <p style=\"margin: 0; font-size: 28px;\">Restaurant</p> </div> <div style=\"display: flex; flex-direction: column; align-items: center; gap: 14px; width: 172px;\"> <div style=\"width: 160px; height: 160px; border-radius: 50%; border: 3px solid #c6bfaf; box-sizing: border-box; padding: 6px;\"><div style=\"width: 100%; height: 100%; border-radius: 50%; background: #1a3f20; display: flex; align-items: center; justify-content: center;\"><svg width=\"64\" height=\"64\" viewBox=\"0 0 100 100\" fill=\"none\" stroke=\"#c6bfaf\" stroke-width=\"5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M14 74 L30 46 L38 56 L48 28 L58 50 L66 38 L86 74 Z\"/></svg></div></div> <p style=\"margin: 0; font-size: 28px;\">El Bedorc</p> </div> <div style=\"display: flex; flex-direction: column; align-items: center; gap: 14px; width: 172px;\"> <div style=\"width: 160px; height: 160px; border-radius: 50%; border: 3px solid #c6bfaf; box-sizing: border-box; padding: 6px;\"><div style=\"width: 100%; height: 100%; border-radius: 50%; background: #1a3f20; display: flex; align-items: center; justify-content: center;\"><svg width=\"64\" height=\"64\" viewBox=\"0 0 100 100\" fill=\"none\" stroke=\"#c6bfaf\" stroke-width=\"5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M22 78 V46 L50 24 L78 46 V78 Z M42 78 V62 a8 8 0 0 1 16 0 V78\"/></svg></div></div> <p style=\"margin: 0; font-size: 28px;\">La casa</p> </div> <div style=\"display: flex; flex-direction: column; align-items: center; gap: 14px; width: 172px;\"> <div style=\"width: 160px; height: 160px; border-radius: 50%; border: 3px solid #c6bfaf; box-sizing: border-box; padding: 6px;\"><div style=\"width: 100%; height: 100%; border-radius: 50%; background: #1a3f20; display: flex; align-items: center; justify-content: center;\"><svg width=\"64\" height=\"64\" viewBox=\"0 0 100 100\" fill=\"none\" stroke=\"#c6bfaf\" stroke-width=\"5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"22\" y=\"28\" width=\"56\" height=\"50\" rx=\"4\"/><path d=\"M22 42 H78 M36 20 V34 M64 20 V34\"/></svg></div></div> <p style=\"margin: 0; font-size: 28px;\">Com reservar</p> </div> </div> </div> <div style=\"display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-top: 1px solid #dbdbdb;\"> <div style=\"padding: 26px 0; text-align: center; border-bottom: 3px solid #1a1a1a; font-size: 28px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase;\">Publicacions</div> <div style=\"padding: 26px 0; text-align: center; font-size: 28px; color: #8e8e8e; letter-spacing: .1em; text-transform: uppercase;\">Reels</div> <div style=\"padding: 26px 0; text-align: center; font-size: 28px; color: #8e8e8e; letter-spacing: .1em; text-transform: uppercase;\">Etiquetades</div> </div> </div>";

export const COPIES: Copy[] = [
 {
  "label": "Foto + logo",
  "caption": "Hi ha cases que t'esperen. Aquesta ho fa des del 1898, entre vinyes i oliveres, amb Montserrat mirant-la de lluny.",
  "note": "",
  "hashtags": "#LaCasaVella #ElBedorc #Anoia #escapadarural #slowtravel"
 },
 {
  "label": "Degradat verd + logo",
  "caption": "La primera llum toca les vinyes i el poble encara dorm.",
  "note": "Una sola línia, com Mas Grimosach i Off Grid a les fotos d'ambient.",
  "hashtags": "#LaCasaVella #ElBedorc #Anoia #casadepoble #slowliving"
 },
 {
  "label": "Cita",
  "caption": "Aquí el temps no corre: s'asseu al jardí amb tu, entre murs de pedra que fa més d'un segle que escolten.",
  "note": "",
  "hashtags": "#LaCasaVella #casadepoble #Anoia #slowtravel #escapadarural"
 },
 {
  "label": "Estança",
  "caption": "La Figarot. Un llit de forja, la llum del matí a la paret i cap motiu per llevar-se aviat.",
  "note": "",
  "hashtags": "#LaCasaVella #hotelambencant #boutiquestay #Anoia #escapadarural"
 },
 {
  "label": "Carrusel",
  "caption": "Una casa de 1898 que es deixa descobrir a poc a poc: la rajola hidràulica, les bigues, la pedra. Llisca i entra.",
  "note": "",
  "hashtags": "#LaCasaVella #casadepoble #patrimoni #Anoia #slowtravel"
 },
 {
  "label": "Menú",
  "caption": "MENÚ DE CALÇOTADA, CADA DIUMENGE\nCalçots a la brasa, [segon plat] i crema catalana, amb vi del Penedès. [PREU] € per persona.\nReserves per DM o al [TELÈFON].",
  "note": "Titular en majúscules i crida clara, com La Vella Farga.",
  "hashtags": "#calçotada #videlPenedès #cuinacatalana #Anoia #LaCasaVella"
 },
 {
  "label": "Premi / premsa",
  "caption": "Estem molt contents de compartir-ho: La Casa Vella ha rebut [PREMI] de [ORGANITZACIÓ]. Gràcies a tothom qui ha passat per casa.",
  "note": "Dues diapositives, una per idioma, com Mas Grimosach.",
  "hashtags": "#LaCasaVella #ElBedorc #Anoia #enoturisme #escapadarural"
 },
 {
  "label": "Portada de Reel",
  "caption": "Arribar, deixar la maleta i escoltar el silenci.",
  "note": "Vídeo de 10–20 s, sense posar: mans, llum, portes que s'obren. Com Mas d'en Bruno.",
  "hashtags": "#LaCasaVella #slowliving #escapadarural #Anoia #casadepoble"
 },
 {
  "label": "Story amb foto i titular",
  "caption": "Text a la imatge: «El Bedorc, amb Montserrat a la vista».\nAdhesiu: ubicació «El Bedorc» + enquesta «Hi has estat? Sí / Encara no».",
  "note": "",
  "hashtags": ""
 },
 {
  "label": "Story amb cartell",
  "caption": "Text a la imatge: «Torna la Calçotada, [DATES], [PREU] €».\nAdhesius: compte enrere fins al primer diumenge + enllaç «Reserva».\nDesprés, desa-la al destacat «Restaurant».",
  "note": "",
  "hashtags": ""
 }
];
