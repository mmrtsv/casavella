#!/usr/bin/env python3
"""Ad images for Meta and Google: writes one HTML page per piece into ads/src/html/.
render.cjs turns them into PNGs in ads/ (Playwright). Copy and links: ads/README.md."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent / 'html'
OUT.mkdir(exist_ok=True)
IMG = (ROOT / 'img').as_uri()
FONTS = (ROOT / 'fonts').as_uri()

HEAD = f'''<!doctype html><meta charset="utf-8"><style>
@font-face {{ font-family: "Le Monde Livre"; src: url({FONTS}/LeMondeLivre.woff2) format("woff2"); }}
@font-face {{ font-family: "Halyard Display"; src: url({FONTS}/HalyardDisplay.ttf) format("truetype"); font-weight: 300 700; }}
* {{ box-sizing: border-box; margin: 0; }}
body {{ background: #1a3f20; }}
.c {{ position: relative; overflow: hidden; background: #1a3f20; color: #f3efe4; font-family: "Halyard Display", sans-serif; }}
.photo {{ position: absolute; width: 100%; object-fit: cover; }}
.title {{ font-family: "Le Monde Livre", serif; line-height: 1.08; text-wrap: balance; }}
.line {{ font-weight: 400; color: #e3ddd0; }}
</style>'''

# Concepts: photo, how to crop it, and the words in each language
CONCEPTS = {
  'montserrat': {'photo': 'hero-vinyes-cel', 'pos': '58% center',
    'es': ['Un fin de semana con Montserrat a la vista', 'A una hora de Barcelona'],
    'ca': ['Un cap de setmana amb Montserrat a la vista', 'A una hora de Barcelona']},
  'casa-1898': {'photo': 'hab-llit', 'pos': '50% center',
    'es': ['Dormir en una casa de 1898', 'Dos apartamentos y dos habitaciones en El Bedorc'],
    'ca': ['Dormir en una casa de 1898', 'Dos apartaments i dues habitacions al Bedorc']},
  'cava': {'photo': 'apt-cuina-detall', 'pos': '62% center',
    'es': ['Un fin de semana de cava y viñas', 'Las cavas de Sant Sadurní, al lado'],
    'ca': ['Un cap de setmana de cava i vinyes', 'Les caves de Sant Sadurní, a tocar']},
  'castanyada': {'photo': 'hero-vinyes-capvespre', 'pos': '50% center', 'date': True,
    'es': ['Del 30 de octubre al 1 de noviembre', 'La castanyada entre viñedos', 'Desde 80 € la noche', 'Con Montserrat en el horizonte'],
    'ca': ["Del 30 d'octubre a l'1 de novembre", 'La castanyada entre vinyes', 'Des de 80 € la nit', "Amb Montserrat a l'horitzó"]},
  'castanyada-apartamento': {'photo': 'apt-sala-2', 'pos': '45% center', 'date': True,
    'es': ['Del 30 de octubre al 1 de noviembre', 'La castanyada entre viñedos', 'Desde 80 € la noche', 'Con Montserrat en el horizonte'],
    'ca': ["Del 30 d'octubre a l'1 de novembre", 'La castanyada entre vinyes', 'Des de 80 € la nit', "Amb Montserrat a l'horitzó"]},
  'castanyada-habitacion': {'photo': 'hab-llit', 'pos': '50% center', 'date': True,
    'es': ['Del 30 de octubre al 1 de noviembre', 'Aquí las mañanas empiezan despacio', 'Habitación desde 80 € la noche', 'La castanyada entre viñedos'],
    'ca': ["Del 30 d'octubre a l'1 de novembre", 'Aquí els matins comencen a poc a poc', 'Habitació des de 80 € la nit', 'La castanyada entre vinyes']},
  'castanyada-cava': {'photo': 'apt-cuina-detall', 'pos': '62% center', 'date': True,
    'es': ['Del 30 de octubre al 1 de noviembre', 'La castanyada entre viñedos', 'Desde 80 € la noche', 'Con Montserrat en el horizonte'],
    'ca': ["Del 30 d'octubre a l'1 de novembre", 'La castanyada entre vinyes', 'Des de 80 € la nit', "Amb Montserrat a l'horitzó"]},
  'oferta': {'photo': 'apt-sala-2', 'pos': '45% center', 'date': True,
    'es': ['Del 13 al 15 de noviembre', 'Dos noches en el apartamento, 209 €', 'Hasta tres personas', '5,0 en Google, 22 opiniones'],
    'ca': ['Del 13 al 15 de novembre', "Dues nits a l'apartament, 209 €", 'Fins a tres persones', '5,0 a Google, 22 opinions']},
}

def words(c, t):
    if c.get('date'):
        date, title, *rest = t
        return (f'<p class="line" style="font-size: 34px; color: #c6bfaf;">{date}</p>'
                f'<p class="title" style="font-size: 76px;">{title}</p>'
                + ''.join(f'<p class="line" style="font-size: 32px;">{x}</p>' for x in rest))
    title, line = t
    return f'<p class="title" style="font-size: 80px;">{title}</p><p class="line" style="font-size: 34px;">{line}</p>'

def feed(c, t):
    # 4:5: the photo full bleed, the brand green rising from the foot under the words (as the Instagram templates)
    return f'''<div class="c" style="width:1080px;height:1350px">
<img class="photo" src="{IMG}/{c['photo']}.jpg" style="inset:0;height:100%;object-position:{c['pos']}">
<div style="position:absolute;inset:0;background:linear-gradient(0deg,rgba(26,63,32,.96) 0%,rgba(26,63,32,.55) 34%,rgba(26,63,32,0) 58%)"></div>
<div style="position:absolute;left:88px;right:88px;bottom:96px;display:flex;flex-direction:column;align-items:center;gap:22px;text-align:center">
<img src="{IMG}/iso-light.png" alt="" style="width:56px;margin-bottom:6px">{words(c, t)}</div></div>'''

def story(c, t):
    # 9:16: green band with the logo, the photo as a band (the photos are landscape), the words below.
    # Top 250 px and bottom 340 px stay clear of the Stories and Reels interface
    return f'''<div class="c" style="width:1080px;height:1920px">
<img src="{IMG}/logo-light.png" alt="La Casa Vella" style="position:absolute;top:262px;left:50%;width:170px;margin-left:-85px">
<img class="photo" src="{IMG}/{c['photo']}.jpg" style="top:540px;height:680px;object-position:{c['pos']}">
<div style="position:absolute;left:0;right:0;top:540px;height:680px;background:linear-gradient(180deg,rgba(26,63,32,1) 0%,rgba(26,63,32,0) 22%,rgba(26,63,32,0) 55%,rgba(26,63,32,1) 100%)"></div>
<div style="position:absolute;left:88px;right:88px;top:1270px;display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center">{words(c, t).replace('font-size: 80px', 'font-size: 74px').replace('font-size: 76px', 'font-size: 62px')}</div></div>'''

# Carousel: one card per stay. Weekday price from Maite's base (the web says "from")
STAYS = [
  ('montserrat', 'apt-sala-2', '45% center', ['Apartamento Montserrat', 'Hasta 3 personas, con cocina', 'Desde 90 € la noche'], ['Apartament Montserrat', 'Fins a 3 persones, amb cuina', 'Des de 90 € la nit']),
  ('la-pineda', 'apt-dormitori-3', '40% center', ['Apartamento La Pineda', 'Hasta 3 personas, con cocina', 'Desde 90 € la noche'], ['Apartament La Pineda', 'Fins a 3 persones, amb cuina', 'Des de 90 € la nit']),
  ('les-vinyes', 'hab-armari', '50% center', ['Habitación Les Vinyes', '2 personas, baño privado', 'Desde 70 € la noche'], ['Habitació Les Vinyes', '2 persones, bany privat', 'Des de 70 € la nit']),
  ('figarot', 'hab-llit', '50% center', ['Habitación Figarot', '2 personas, baño privado', 'Desde 70 € la noche'], ['Habitació Figarot', '2 persones, bany privat', 'Des de 70 € la nit']),
]
def card(photo, pos, t):
    name, what, price = t
    return f'''<div class="c" style="width:1080px;height:1080px;background:#f7f5f0;color:#1a3f20">
<img class="photo" src="{IMG}/{photo}.jpg" style="top:0;height:760px;object-position:{pos}">
<div style="position:absolute;left:72px;right:72px;top:808px;display:grid;gap:12px">
<p class="title" style="font-size:58px">{name}</p>
<div style="display:flex;justify-content:space-between;gap:24px;font-size:30px;color:#5f6a5f"><span>{what}</span><span style="color:#1a3f20">{price}</span></div></div></div>'''

pages = {}
for key, c in CONCEPTS.items():
    for lang in ('es', 'ca'):
        pages[f'{key}-feed-{lang}'] = feed(c, c[lang])
        pages[f'{key}-story-{lang}'] = story(c, c[lang])
for key, photo, pos, es, ca in STAYS:
    pages[f'carrusel-{key}-es'] = card(photo, pos, es)
    pages[f'carrusel-{key}-ca'] = card(photo, pos, ca)
# Facebook page: the cover is the photo alone (the page name and profile picture sit on it); the profile picture is the isotype
pages['facebook-portada'] = f'<div class="c" style="width:1640px;height:924px"><img class="photo" src="{IMG}/hero-vinyes-cel.jpg" style="inset:0;height:100%;object-position:58% 60%"></div>'
pages['perfil'] = f'<div class="c" style="width:1080px;height:1080px;display:grid;place-items:center"><img src="{IMG}/iso-light.png" alt="La Casa Vella" style="width:420px"></div>'

for name, body in pages.items():
    (OUT / f'{name}.html').write_text(HEAD + body, encoding='utf-8')
print(len(pages), 'pages')
